const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage, withLocaleContext } = require('../lib/claude');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

/**
 * Repair literal control characters inside JSON string values.
 * Claude occasionally emits bare newlines/tabs in long document strings,
 * which JSON.parse rejects. This walker fixes them before parsing.
 */
function repairJsonStrings(text) {
  let out = '', inStr = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (!inStr) {
      out += ch;
      if (ch === '"') inStr = true;
    } else if (ch === '\\') {
      out += ch + (text[i + 1] || '');
      i++;
    } else if (ch === '"') {
      out += ch; inStr = false;
    } else if (ch === '\n') {
      out += '\\n';
    } else if (ch === '\r') {
      if (text[i + 1] !== '\n') out += '\\r';
    } else if (ch === '\t') {
      out += '\\t';
    } else if (ch.charCodeAt(0) < 0x20) {
      out += '\\u' + ch.charCodeAt(0).toString(16).padStart(4, '0');
    } else {
      out += ch;
    }
  }
  return out;
}


// Sequential /renters-deposit-saver route removed 2026-05-10.
// Frontend now uses /renters-deposit-saver/stream exclusively.


// ═══════════════════════════════════════════════════════════════
// STREAMING ROUTE — parallel section generation
// Runs 3 concurrent API calls (~6K tokens each) instead of one
// 16K-token call. Each group sends { section, content } SSE events
// as it completes, so the frontend can render sections progressively.
// Total time: ~40-60 s instead of ~3 min.
// ═══════════════════════════════════════════════════════════════

router.post('/renters-deposit-saver/stream', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  const { address, unit, landlordName, landlordEmail, moveInDate, location, depositAmount, checklist, userLanguage, userLocale, userCurrency, userRegion } = req.body;

  if (!address?.trim()) return res.status(400).json({ error: 'Property address is required' });
  if (!moveInDate) return res.status(400).json({ error: 'Move-in date is required' });
  if (!location?.trim()) return res.status(400).json({ error: 'Location is required for deposit law lookup' });
  if (!checklist || !Array.isArray(checklist) || checklist.length === 0) return res.status(400).json({ error: 'At least one room checklist is required' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendEvent = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  try {
    const fullAddress   = unit ? `${address}, Unit ${unit}` : address;
    const landlordLine  = `${landlordName?.trim() || '[LANDLORD / PROPERTY MANAGER]'} (${landlordEmail?.trim() || '[LANDLORD EMAIL]'})`;
    const depositLine   = depositAmount?.trim() || '[DEPOSIT AMOUNT]';

    const checklistFormatted = checklist.map(room => {
      const items = room.items.map(item => {
        let line = `  - ${item.item}: ${item.condition.toUpperCase()}`;
        if (item.notes) line += ` — "${item.notes}"`;
        return line;
      }).join('\n');
      return `${room.room}:\n${items}`;
    }).join('\n\n');

    const ctx = `Address: ${fullAddress}\nMove-In Date: ${moveInDate}\nLocation/Jurisdiction: ${location}\nSecurity Deposit: ${depositLine}\nLandlord: ${landlordLine}`;
    const system = withLanguage('You are a JSON API. Respond with ONLY valid JSON.', userLanguage)
                 + withLocaleContext(userLocale, userCurrency, userRegion);

    // Single-section-group helper: call Claude, repair, return parsed object
    async function callGroup(prompt) {
      let lastErr;
      for (let _att = 1; _att <= 3; _att++) {
        try {
          const msg = await anthropic.messages.create({
            model: 'claude-sonnet-4-6', max_tokens: 2000, system,
            messages: [{ role: 'user', content: prompt }],
          });
          const raw = msg.content.find(b => b.type === 'text')?.text || '';
          return JSON.parse(repairJsonStrings(cleanJsonResponse(raw)));
        } catch (err) {
          lastErr = err;
          if (_att < 3) await new Promise(r => setTimeout(r, 500 * _att));
        }
      }
      throw lastErr;
    }

    // ── Group 1: Condition Report + Landlord Letter ────────────
    const p1 = callGroup(`You are an expert tenant rights advocate generating move-in documentation.

${ctx}

MOVE-IN CONDITION CHECKLIST:
${checklistFormatted}

Generate ONLY these two documents. Return ONLY valid JSON with exactly these keys (use \\n for line breaks, no markdown):
{ "condition_report": "...", "landlord_letter": "..." }`, 'group1')
      .then(r => {
        if (r.condition_report) sendEvent({ section: 'condition_report', content: r.condition_report });
        if (r.landlord_letter)  sendEvent({ section: 'landlord_letter',  content: r.landlord_letter });
      });

    // ── Group 2: Photo Shot List + Deposit Rights ──────────────
    const p2 = callGroup(`You are an expert tenant rights advocate generating move-in documentation.

${ctx}

MOVE-IN CONDITION CHECKLIST:
${checklistFormatted}

Generate ONLY these two sections. Return ONLY valid JSON with exactly these keys (use \\n for line breaks, no markdown):
{ "photo_shot_list": "...", "deposit_rights": "... (cite specific ${location} statutes) — one sentence" }`, 'group2')
      .then(r => {
        if (r.photo_shot_list) sendEvent({ section: 'photo_shot_list', content: r.photo_shot_list });
        if (r.deposit_rights)  sendEvent({ section: 'deposit_rights',  content: r.deposit_rights });
      });

    // ── Group 3: Move-Out Tips (lightest call) ─────────────────
    const p3 = callGroup(`You are an expert tenant rights advocate.

${ctx}

Generate practical move-out advice to help the tenant get their full deposit back when they eventually leave.
Return ONLY valid JSON with exactly this key (use \\n for line breaks, no markdown):
{ "move_out_tips": "..." }`, 'group3')
      .then(r => {
        if (r.move_out_tips) sendEvent({ section: 'move_out_tips', content: r.move_out_tips });
      });

    await Promise.all([p1, p2, p3]);
    sendEvent({ done: true });
    res.end();

  } catch (err) {
    console.error('[RentersDepositSaver/stream] Error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate deposit documentation' });
    } else {
      sendEvent({ error: err.message || 'Stream failed' });
      res.end();
    }
  }
});

module.exports = router;
