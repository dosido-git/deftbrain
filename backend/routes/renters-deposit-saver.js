const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { rateLimit } = require('../lib/rateLimiter');

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

router.post('/renters-deposit-saver', rateLimit(), async (req, res) => {
  try {
    const { action, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    // ═══════════════════════════════════════
    // MODE 1: Rights-only quick lookup
    // ═══════════════════════════════════════
    if (action === 'rights-only') {
      const { location } = req.body;

      if (!location || !location.trim()) {
        return res.status(400).json({ error: 'Location is required to look up deposit rights' });
      }

      const rightsPrompt = `You are an expert tenant rights advocate. Provide a comprehensive security deposit rights guide for a renter in ${location}.

Cover ALL of the following:

DEPOSIT LIMITS:
- Maximum deposit amount allowed by law and the specific statute
- Whether the landlord must hold the deposit in a separate account
- Whether interest on the deposit is required, and at what rate

RETURN RULES:
- Exact timeline for returning the deposit after move-out (cite the statute)
- Required itemized statement / accounting requirements
- Penalties if the landlord fails to return the deposit on time (many jurisdictions allow 2x or 3x damages)

DEDUCTIONS:
- What the landlord CAN legally deduct (and the standard for "normal wear and tear" vs actual damage)
- What the landlord CANNOT deduct (with specific legal citations)
- Who has the burden of proof for claimed damage

MOVE-IN / MOVE-OUT:
- Whether ${location} requires a move-in inspection or condition report
- Walk-through / inspection requirements before deduction
- Required notice periods for move-out

DISPUTES:
- How to dispute deductions (steps and timeline)
- Small claims court limits and process for deposit disputes
- Relevant tenant advocacy organizations or legal aid resources

LOCAL EXTRAS:
- Any local city or county ordinances that provide additional protections beyond state/national law
- Recent changes in law the tenant should know about

CRITICAL RULES:
- Cite SPECIFIC statutes and code sections for ${location} — never give generic advice
- If ${location} is outside the United States, research and cite the appropriate national/regional tenancy legislation
- ALL text must be plain text. Do NOT use any markdown formatting (no #, **, *, -, backticks, etc.)
- Use ALL CAPS for section headers, line breaks, and indentation only
- Be thorough but concise — this should be a practical reference guide

Return ONLY valid JSON (no markdown, no preamble, no code fences):

{
  "deposit_rights": "full plain-text deposit rights guide as a single string with \\n for line breaks (JSON-escaped, not literal newlines)"
}`;

      const parsed = await callClaudeWithRetry({
        model: 'claude-sonnet-4-6',
        max_tokens: 4000,
        system: 'You are a JSON API. Respond with ONLY valid JSON.' + withLocaleContext(userLocale, userCurrency, userRegion),
        messages: [{ role: 'user', content: withLanguage(rightsPrompt, userLanguage) }]
      }, { label: 'renters-deposit-saver' });
      if (!parsed.deposit_rights) {
        return res.status(500).json({ error: 'Could not generate your deposit recovery plan. Please try again.' });
      }
      return res.json(parsed);
    }

    // ═══════════════════════════════════════
    // MODE 2: Full report generation
    // ═══════════════════════════════════════
    const { address, unit, landlordName, landlordEmail, moveInDate, location, depositAmount, checklist } = req.body;

    if (!address || !address.trim()) {
      return res.status(400).json({ error: 'Property address is required' });
    }
    if (!moveInDate) {
      return res.status(400).json({ error: 'Move-in date is required' });
    }
    if (!location || !location.trim()) {
      return res.status(400).json({ error: 'Location is required for deposit law lookup' });
    }
    if (!checklist || !Array.isArray(checklist) || checklist.length === 0) {
      return res.status(400).json({ error: 'At least one room checklist is required' });
    }

    // Summarize checklist for logging

    // Format checklist data for the prompt
    const checklistFormatted = checklist.map(room => {
      const items = room.items.map(item => {
        let line = `  - ${item.item}: ${item.condition.toUpperCase()}`;
        if (item.notes) line += ` — "${item.notes}"`;
        return line;
      }).join('\n');
      return `${room.room}:\n${items}`;
    }).join('\n\n');

    const fullAddress = unit ? `${address}, Unit ${unit}` : address;
    const landlordDisplay = landlordName?.trim() || '[LANDLORD / PROPERTY MANAGER]';
    const landlordEmailDisplay = landlordEmail?.trim() || '[LANDLORD EMAIL]';
    const depositDisplay = depositAmount?.trim() || '[DEPOSIT AMOUNT]';

    const prompt = `You are an expert tenant rights advocate and move-in documentation specialist. You are generating a complete move-in documentation package for a renter.

═══════════════════════════════════════
PROPERTY DETAILS
═══════════════════════════════════════
Address: ${fullAddress}
Move-In Date: ${moveInDate}
Location / Jurisdiction: ${location}
Security Deposit: ${depositDisplay}
Landlord/Manager: ${landlordDisplay}
Landlord Email: ${landlordEmailDisplay}

═══════════════════════════════════════
MOVE-IN CONDITION CHECKLIST
═══════════════════════════════════════
${checklistFormatted}

═══════════════════════════════════════
GENERATION REQUIREMENTS
═══════════════════════════════════════

Generate a COMPLETE move-in documentation package with these 5 sections:

1. CONDITION REPORT (condition_report):
   Write a formal, professional move-in condition report that could be used as legal evidence. Include:
   - A header block with property address, date, tenant name placeholder, and landlord name
   - Room-by-room listing of EVERY inspected item with its condition
   - For items rated POOR or DAMAGED, include detailed descriptions from the tenant's notes
   - Items rated GOOD should still be listed (proves they were in good condition at move-in)
   - A signature block at the bottom for tenant and landlord/manager signatures with date lines
   - A statement that "Both parties acknowledge this report accurately reflects the condition of the premises on the move-in date"
   - Format this as a clean, professional plain-text document (NOT markdown — no # headers, no ** bold, no bullets with *)
   - Use ALL CAPS for section headers, dashes for separators, and indentation for hierarchy

2. LANDLORD COVER LETTER (landlord_letter):
   Write a professional but firm cover letter to accompany the condition report. Include:
   - Proper letter format with date and addresses
   - Reference to the lease and move-in date
   - Statement that the attached condition report documents pre-existing conditions
   - A polite but clear request for the landlord to review, sign, and return a copy within 7 days
   - A note that if no response is received, the tenant will consider the report accepted as accurate
   - Reference that photos have been taken and are available upon request
   - Professional but assertive tone — this is creating a paper trail
   - Format as plain text (no markdown formatting)

3. PHOTO SHOT LIST (photo_shot_list):
   Generate a prioritized, room-by-room photo shot list. Include:
   - PRIORITY 1: Every item rated DAMAGED — list exact shots needed (wide shot + close-up + detail with scale reference)
   - PRIORITY 2: Every item rated POOR — list shots needed
   - PRIORITY 3: Every item rated FAIR — at least one photo each
   - PRIORITY 4: General room shots for items rated GOOD (wide shot of each room from doorway)
   - Specific photography tips for each type of damage (e.g., "photograph crack with coin placed next to it for scale")
   - Reminder to email all photos to self and landlord for timestamp verification
   - Total approximate photo count
   - Format as plain text (no markdown formatting)

4. DEPOSIT RIGHTS (deposit_rights):
   Research and provide security deposit law specific to ${location}. Include:
   - Maximum deposit amount allowed by law and the specific statute
   - Whether the landlord must hold the deposit in a separate account
   - Whether interest on the deposit is required, and at what rate
   - Exact timeline for returning the deposit after move-out (cite the statute)
   - What the landlord CAN legally deduct (normal wear and tear vs actual damage)
   - What the landlord CANNOT deduct (with specific legal citations)
   - Required itemized statement requirements
   - Penalties if the landlord fails to return the deposit on time (many jurisdictions allow 2x or 3x damages)
   - Whether ${location} requires a move-in inspection or condition report
   - How to dispute deductions (steps and timeline)
   - Small claims court limits and process for deposit disputes
   - Any local ordinances that may provide additional protections (especially for major cities)
   - If ${location} is outside the United States, cite the appropriate national/regional tenancy legislation
   - Format as plain text with clear sections (no markdown formatting)

5. MOVE-OUT TIPS (move_out_tips):
   Brief, practical advice for when the tenant eventually moves out:
   - Do a walkthrough with the landlord present (or document refusal)
   - Take identical photos to compare with move-in photos
   - Leave the unit in "broom clean" condition
   - Get the forwarding address form submitted properly
   - Know the deposit return deadline for ${location}
   - What to do if deductions seem unfair (dispute letter template reference)
   - Keep ALL documentation for at least 1 year after move-out
   - Format as plain text (no markdown formatting)

═══════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════

Return ONLY valid JSON (no markdown, no preamble, no code fences):

{
  "condition_report": "full plain-text condition report as a single string with \\n for line breaks (JSON-escaped, not literal newlines)",
  "landlord_letter": "full plain-text cover letter as a single string with \\n for line breaks (JSON-escaped, not literal newlines)",
  "photo_shot_list": "full plain-text prioritized shot list as a single string with \\n for line breaks (JSON-escaped, not literal newlines)",
  "deposit_rights": "full plain-text deposit rights breakdown as a single string with \\n for line breaks (JSON-escaped, not literal newlines)",
  "move_out_tips": "plain-text move-out advice as a single string with \\n for line breaks (JSON-escaped, not literal newlines)"
}

CRITICAL RULES:
- ALL text must be plain text. Do NOT use any markdown formatting (no #, **, *, -, \`\`\`, etc.). Use ALL CAPS for headers, line breaks, and indentation only.
- Cite SPECIFIC statutes and code sections for ${location} — never give generic advice
- If ${location} is outside the United States, cite the appropriate national/regional tenancy legislation
- The condition report must be formal enough to use as evidence in a deposit dispute
- The cover letter must be professional and create a clear paper trail
- The photo shot list must prioritize damaged items and be actionable
- Deposit rights MUST reference actual law with statute numbers
- Return ONLY valid JSON`;

    // Parallel generation: 3 concurrent calls (~6K tokens each) instead of
    // one 16K-token sequential call. ~3x faster overall.
    const sys = 'You are a JSON API. Respond with ONLY valid JSON.'
              + withLocaleContext(userLocale, userCurrency, userRegion);

    async function callGroup(groupPrompt) {
      let lastErr;
      for (let _att = 1; _att <= 3; _att++) {
        try {
          const msg = await anthropic.messages.create({
            model: 'claude-sonnet-4-6', max_tokens: 6000, system: sys,
            messages: [{ role: 'user', content: withLanguage(groupPrompt, userLanguage) }],
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

    const ctx = `Address: ${fullAddress}\nMove-In Date: ${moveInDate}\nLocation/Jurisdiction: ${location}\nSecurity Deposit: ${depositDisplay}\nLandlord: ${landlordDisplay} (${landlordEmailDisplay})`;

    const [g1, g2, g3] = await Promise.all([
      // Group 1 — condition report + landlord letter
      callGroup(`You are an expert tenant rights advocate generating move-in documentation.

${ctx}

MOVE-IN CONDITION CHECKLIST:
${checklistFormatted}

${prompt.split('1. MOVE-IN CONDITION REPORT')[1]?.split('3. PHOTO SHOT LIST')[0]
    ? `Generate ONLY: condition_report and landlord_letter.\n\n1. MOVE-IN CONDITION REPORT${prompt.split('1. MOVE-IN CONDITION REPORT')[1].split('3. PHOTO SHOT LIST')[0]}2. LANDLORD COVER LETTER${prompt.split('2. LANDLORD COVER LETTER')[1]?.split('3. PHOTO SHOT LIST')[0] || ''}`
    : 'Generate a formal move-in condition report (condition_report) and a professional landlord cover letter (landlord_letter).'}

Return JSON: { "condition_report": "...", "landlord_letter": "..." }
Plain text only, use \\n for line breaks, no markdown.`),

      // Group 2 — photo shot list + deposit rights
      callGroup(`You are an expert tenant rights advocate generating move-in documentation.

${ctx}

MOVE-IN CONDITION CHECKLIST:
${checklistFormatted}

Generate ONLY: photo_shot_list and deposit_rights.

PHOTO SHOT LIST: Prioritized room-by-room list. PRIORITY 1: DAMAGED items (wide+close+detail shots). PRIORITY 2: POOR items. PRIORITY 3: FAIR items. PRIORITY 4: GOOD items (wide shot). Include photography tips and total photo count. Plain text, no markdown.

DEPOSIT RIGHTS: Security deposit law specific to ${location}. Include: max deposit allowed (with statute), separate account requirements, interest requirements, return timeline (with statute), allowable vs prohibited deductions, itemized statement requirements, penalties for late return, dispute process, small claims limits. Cite specific statutes. Plain text, no markdown.

Return JSON: { "photo_shot_list": "...", "deposit_rights": "..." }
Use \\n for line breaks.`),

      // Group 3 — move-out tips (lightest)
      callGroup(`You are an expert tenant rights advocate.

${ctx}

Generate practical move-out tips to help the tenant get their full deposit back. Cover: pre-move-out walkthrough with landlord, matching photos to move-in documentation, cleaning standards, forwarding address, deposit return deadline for ${location}, dispute process if deductions seem unfair, record retention.

Return JSON: { "move_out_tips": "..." }
Plain text only, use \\n for line breaks, no markdown.`),
    ]);

    const parsed = { ...g1, ...g2, ...g3 };
    if (!parsed.condition_report && !parsed.deposit_rights) {
      return res.status(500).json({ error: 'Could not generate your deposit recovery plan. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[RentersDepositSaver] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate move-in documentation' });
  }
});

// ═══════════════════════════════════════════════════════════════
// STREAMING ROUTE — parallel section generation
// Runs 3 concurrent API calls (~6K tokens each) instead of one
// 16K-token call. Each group sends { section, content } SSE events
// as it completes, so the frontend can render sections progressively.
// Total time: ~40-60 s instead of ~3 min.
// ═══════════════════════════════════════════════════════════════

router.post('/renters-deposit-saver/stream', rateLimit(), async (req, res) => {
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
    async function callGroup(prompt, label) {
      let lastErr;
      for (let _att = 1; _att <= 3; _att++) {
        try {
          const msg = await anthropic.messages.create({
            model: 'claude-sonnet-4-6', max_tokens: 6000, system,
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

Generate ONLY these two documents. Return JSON with exactly these keys (use \\n for line breaks, no markdown):
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

Generate ONLY these two sections. Return JSON with exactly these keys (use \\n for line breaks, no markdown):
{ "photo_shot_list": "...", "deposit_rights": "... (cite specific ${location} statutes)" }`, 'group2')
      .then(r => {
        if (r.photo_shot_list) sendEvent({ section: 'photo_shot_list', content: r.photo_shot_list });
        if (r.deposit_rights)  sendEvent({ section: 'deposit_rights',  content: r.deposit_rights });
      });

    // ── Group 3: Move-Out Tips (lightest call) ─────────────────
    const p3 = callGroup(`You are an expert tenant rights advocate.

${ctx}

Generate practical move-out advice to help the tenant get their full deposit back when they eventually leave.
Return JSON with exactly this key (use \\n for line breaks, no markdown):
{ "move_out_tips": "..." }`, 'group3')
      .then(r => {
        if (r.move_out_tips) sendEvent({ section: 'move_out_tips', content: r.move_out_tips });
      });

    await Promise.all([p1, p2, p3]);
    sendEvent({ done: true });
    res.end();

  } catch (err) {
    console.error('[RentersDepositSaver/stream] Error:', err);
    sendEvent({ error: err.message || 'Stream failed' });
    res.end();
  }
});

module.exports = router;
