const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');
const { groundedFacts, normalizeKeyPart, stripCites } = require('../lib/groundedFacts');

const NO_QUOTE_RULE = 'Never place a double-quote (") character inside any JSON string value — quoted statute names or checklist notes must be written plainly or with single quotes, or it breaks the JSON.';

// Grounded facts PRE-PASS (shared lib/groundedFacts.js pattern + cache):
// deposit law is exactly the volatile-figure domain where training knowledge
// goes stale (2026-07-23 probe: /stream confidently called an illegal CA
// 2-month deposit "the legal maximum" — AB 12 capped it at 1 month in 2024).
async function groundDepositLawFacts({ location }) {
  return groundedFacts({
    cacheKey: `deposit-law:${normalizeKeyPart(location)}`,
    label: 'renters-deposit-saver-facts',
    userPrompt: `Verify with web_search the CURRENT security-deposit rules (as of today) for residential tenants in: ${location}.

Cover ONLY: (1) maximum deposit amount, (2) return deadline after move-out, (3) itemization requirement, (4) interest on deposit, (5) penalties for landlord non-compliance. Skip any you cannot verify. Note the effective date of any rule that changed since 2023.

Return ONLY valid JSON:
{ "jurisdiction": "State/region these rules apply to", "verified": [{ "topic": "deposit_cap | return_deadline | itemization | interest | penalties", "rule": "The current rule in one sentence with the numeric limit", "statute": "Statute name/number", "effective": "Effective date or 'long-standing'", "source": "Domain of the source you verified against" }] }

${NO_QUOTE_RULE}`,
    render: (cleanFacts) => {
      if (Array.isArray(cleanFacts.verified) && cleanFacts.verified.length) {
        return `\n\nVERIFIED CURRENT DEPOSIT LAW (web-checked today for ${cleanFacts.jurisdiction || location}) — these figures OVERRIDE your training knowledge; use them verbatim:\n` +
          cleanFacts.verified.map(f => `- [${f.topic}] ${f.rule} (${f.statute}, ${f.effective}; source: ${f.source})`).join('\n');
      }
      return '';
    },
  });
}

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
// Frontend now uses /renters-deposit-saver/stream for the full report
// and /renters-deposit-saver/rights for the quick rights lookup.


// ═══════════════════════════════════════════════════════════════
// QUICK RIGHTS LOOKUP — fast, bounded, standalone
// Used by the step-1 "Look Up My Rights" button.
// ═══════════════════════════════════════════════════════════════

router.post('/renters-deposit-saver/rights', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  const { location, userLanguage, userLocale, userCurrency, userRegion } = req.body;

  if (!location?.trim()) return res.status(400).json({ error: 'Location is required for deposit law lookup' });

  try {
    const system = withLanguage('You are a JSON API. Respond with ONLY valid JSON. ' + NO_QUOTE_RULE, userLanguage)
                 + withLocaleContext(userLocale, userCurrency, userRegion);

    const prompt = `You are an expert tenant rights advocate. Summarize security deposit rights for a renter in ${location}.

STATUTE ACCURACY: ONLY cite a statute number or code section when you are confident it is accurate for ${location}. If you are not certain of the exact citation, describe the legal principle and label it (e.g., "commonly cited as ..." or "verify the exact statute locally") rather than inventing a precise-looking section number. A confident principle with no number beats a fabricated citation.

Return ONLY valid JSON with exactly these keys:
{
  "rights_summary": "2-3 sentence overview",
  "key_rights": ["5-8 short bullets: max deposit, return deadline, itemization, interest, penalties"],
  "caution": "one sentence — name statutes only if certain, otherwise say verify locally"
}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 1500,
      system,
      messages: [{ role: 'user', content: prompt }],
    }, { label: 'renters-deposit-saver/rights' });

    if (!parsed.key_rights) {
      return res.status(500).json({ error: 'Failed to look up deposit rights. Please try again.' });
    }
    res.json(parsed);
  } catch (err) {
    console.error('[RentersDepositSaver/rights] Error:', err);
    res.status(500).json({ error: 'Failed to look up deposit rights. Please try again.' });
  }
});


// ═══════════════════════════════════════════════════════════════
// STREAMING ROUTE — parallel section generation
// Runs 3 concurrent API calls (groups capped at 2000 output tokens;
// group 1 gets 3500 — it carries two full documents) instead of one
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

    const depositLawBlock = await groundDepositLawFacts({ location });
    const staleness = 'DEPOSIT LAW CURRENCY: deposit caps and deadlines changed in several jurisdictions after 2023 — state a cap or deadline only together with its effective date; if you are not certain a figure is current, advise the tenant to verify it rather than presenting it as the legal maximum.';

    const ctx = `Address: ${fullAddress}\nMove-In Date: ${moveInDate}\nLocation/Jurisdiction: ${location}\nSecurity Deposit: ${depositLine}\nLandlord: ${landlordLine}${depositLawBlock}\n\n${staleness}`;
    const system = withLanguage('You are a JSON API. Respond with ONLY valid JSON. ' + NO_QUOTE_RULE, userLanguage)
                 + withLocaleContext(userLocale, userCurrency, userRegion);

    // Single-section-group helper: call Claude, repair, return parsed object.
    // Truncation (stop_reason === 'max_tokens') fails FAST: retrying would just
    // regenerate the same over-budget output. Because SSE headers are already
    // sent, we emit a clear SSE error event for this group and return {} so the
    // other groups' sections still stream to the user.
    async function callGroup(prompt, label, maxTokens = 2000) {
      let lastErr;
      for (let _att = 1; _att <= 3; _att++) {
        try {
          const msg = await anthropic.messages.create({
            model: MODELS.SMART, max_tokens: maxTokens, system,
            messages: [{ role: 'user', content: prompt }],
          });
          if (msg.stop_reason === 'max_tokens') {
            console.error(`[RentersDepositSaver/stream] ${label} truncated at max_tokens=${maxTokens} — failing fast`);
            sendEvent({ error: 'A report section was cut off while generating. Please try again.' });
            return {};
          }
          const raw = msg.content.find(b => b.type === 'text')?.text || '';
          return stripCites(JSON.parse(repairJsonStrings(cleanJsonResponse(raw))));
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

Generate ONLY these two documents. Keep them bounded: per room, include at most 6 checklist findings, one line each; the landlord letter must be 200 words or fewer.

Return ONLY valid JSON with exactly these keys (use \\n for line breaks, no markdown):
{ "condition_report": "...", "landlord_letter": "..." }`, 'group1', 3500)
      .then(r => {
        if (r.condition_report) sendEvent({ section: 'condition_report', content: r.condition_report });
        if (r.landlord_letter)  sendEvent({ section: 'landlord_letter',  content: r.landlord_letter });
      });

    // ── Group 2: Photo Shot List + Deposit Rights ──────────────
    const p2 = callGroup(`You are an expert tenant rights advocate generating move-in documentation.

${ctx}

MOVE-IN CONDITION CHECKLIST:
${checklistFormatted}

STATUTE ACCURACY: ONLY cite a statute number or code section when you are confident it is accurate for ${location}. If you are not certain of the exact citation, describe the legal principle and label it (e.g., "commonly cited as ..." or "verify the exact statute locally") rather than inventing a precise-looking section number.

Generate ONLY these two sections. Return ONLY valid JSON with exactly these keys (use \\n for line breaks, no markdown):
{ "photo_shot_list": "...", "deposit_rights": "5-8 short bullet points covering max deposit, return deadline, itemization requirement, interest, penalties for non-compliance — name statutes only if certain they exist" }`, 'group2')
      .then(r => {
        if (r.photo_shot_list) sendEvent({ section: 'photo_shot_list', content: r.photo_shot_list });
        if (r.deposit_rights)  sendEvent({ section: 'deposit_rights',  content: r.deposit_rights });
      });

    // ── Group 3: Move-Out Tips (lightest call) ─────────────────
    const p3 = callGroup(`You are an expert tenant rights advocate.

${ctx}

Generate practical move-out advice to help the tenant get their full deposit back when they eventually leave.
Return ONLY valid JSON with exactly this key (use \\n for line breaks, no markdown):
{ "move_out_tips": "..." }`, 'group3', 3000)
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
