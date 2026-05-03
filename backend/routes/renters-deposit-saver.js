const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');
const { rateLimit } = require('../lib/rateLimiter');

router.post('/renters-deposit-saver', rateLimit(), async (req, res) => {
  try {
    const { action } = req.body;

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
  "deposit_rights": "full plain-text deposit rights guide as a single string with newlines"
}`;

      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{ role: 'user', content: rightsPrompt }]
      });

      const textContent = message.content.find(item => item.type === 'text')?.text || '';

      const cleaned = cleanJsonResponse(textContent);
      const parsed = JSON.parse(cleaned);
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
  "condition_report": "full plain-text condition report as a single string with newlines",
  "landlord_letter": "full plain-text cover letter as a single string with newlines",
  "photo_shot_list": "full plain-text prioritized shot list as a single string with newlines",
  "deposit_rights": "full plain-text deposit rights breakdown as a single string with newlines",
  "move_out_tips": "plain-text move-out advice as a single string with newlines"
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

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }]
    });

    const textContent = message.content.find(item => item.type === 'text')?.text || '';

    const cleaned = cleanJsonResponse(textContent);
    const parsed = JSON.parse(cleaned);

    res.json(parsed);

  } catch (error) {
    console.error('[RentersDepositSaver] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate move-in documentation' });
  }
});

module.exports = router;

// ═══════════════════════════════════════════════════════════════
// STREAMING ROUTE — full report generation (Mode 2 only)
// ═══════════════════════════════════════════════════════════════

router.post('/renters-deposit-saver/stream', rateLimit(), async (req, res) => {
  const { address, unit, landlordName, landlordEmail, moveInDate, location, depositAmount, checklist } = req.body;

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

Address: ${fullAddress}
Move-In Date: ${moveInDate}
Location / Jurisdiction: ${location}
Security Deposit: ${depositDisplay}
Landlord/Manager: ${landlordDisplay}
Landlord Email: ${landlordEmailDisplay}

MOVE-IN CONDITION CHECKLIST:
${checklistFormatted}

Generate a complete move-in documentation package. Return ONLY valid JSON with these keys: condition_report, landlord_letter, photo_shot_list, deposit_rights, move_out_tips — all as plain-text strings with newlines. Cite specific statutes for ${location}. No markdown formatting in the text values.`;

    const stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }],
    });

    stream.on('text', (text) => sendEvent({ chunk: text }));
    await stream.finalMessage();
    sendEvent({ done: true });
    res.end();

  } catch (err) {
    console.error('[RentersDepositSaver/stream] Error:', err);
    sendEvent({ error: err.message || 'Stream failed' });
    res.end();
  }
});
