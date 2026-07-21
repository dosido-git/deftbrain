const express = require('express');
const router = express.Router();
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit } = require('../lib/rateLimiter');

// ════════════════════════════════════════════════════════════
// POST /paperwork-path — document checklist + the order to handle it
// for a life event (move, baby, job change, marriage, death, …)
// ════════════════════════════════════════════════════════════
router.post('/paperwork-path', rateLimit(), async (req, res) => {
  try {
    const { lifeEvent, situation, location, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!lifeEvent?.trim()) {
      return res.status(400).json({ error: 'Pick the life event you\'re handling' });
    }

    const situationText = (situation || '').toString().slice(0, 4000);
    const locationText = (location || '').toString().slice(0, 200);

    const prompt = withLanguage(`You are a calm, organized life-admin expert who helps people handle the paperwork around a major life event without missing anything or doing it in the wrong order.

LIFE EVENT: ${lifeEvent}
${locationText ? `LOCATION: ${locationText}` : 'LOCATION: not specified'}
${situationText ? `THEIR SITUATION: ${situationText}` : ''}

Produce a document checklist AND the order to handle it. Requirements vary by country/state/employer — give the TYPICAL set and sequence.

BE SPECIFIC, then hedge — do not be vague. When a deadline or figure is well-established for the stated location (e.g. a state's new-resident vehicle-registration or driver-license grace period, a benefits enrollment window), state the actual number (e.g. "within 30 days", "90-day window") and note it should be confirmed as current. Only avoid inventing a precise figure you are not confident is commonly correct — in that case say the rule exists and point the person to where to confirm it, rather than stating a made-up number. The verify_note covers the blanket "confirm for your jurisdiction" caveat, so individual fields can carry the specific figure.

FIGURE DISCIPLINE: each deadline belongs to ITS OWN item — never reuse one item's window for a different one (e.g. a state's driver-license grace period and its vehicle-registration grace period are usually DIFFERENT numbers; don't apply one to both). If unsure whether two items share a window, hedge that specific figure rather than guessing.

Return ONLY valid JSON:

{
  "situation_summary": "One sentence restating what they're handling, grounded in their inputs",
  "document_checklist": [
    {
      "document": "Name of the document/task (e.g. 'Change address with USPS')",
      "why": "Why it matters — one sentence",
      "where_to_get": "Where/how to obtain or file it — one sentence",
      "priority": "critical | important | optional"
    }
  ],
  "ordered_steps": [
    {
      "order": 1,
      "action": "The concrete step to do",
      "week": 1,
      "timing": "When to do it (e.g. 'first', 'within 2 weeks', 'after you have X')",
      "why_first": "Why it comes at this point in the order — often because a later step depends on it. One sentence."
    }
  ],
  "watch_outs": [
    "A common mistake or thing people forget for THIS event — one sentence"
  ],
  "verify_note": "A one-sentence reminder that requirements vary by location/employer and where to confirm the specifics"
}

RULES:
- ALL five top-level keys must be present.
- document_checklist: 5-12 items, most impactful first, priority set honestly.
- ordered_steps: 4-8 steps; the ORDER is the whole value — sequence by dependency (what must exist before the next step), not alphabetically. "week" is a small integer (1-16) = which week from the start this step should be DONE (its recommended target, not its final deadline) — earlier/blocking steps get lower weeks, and steps can share a week. Keep the whole plan realistic (usually 1-12 weeks).
- watch_outs: 2-4 items.
- Keep every field to one tight sentence. Never put a double-quote (") inside a JSON string value.
- Be specific to the life event; generic "make a checklist" advice is a failure.

Return ONLY the JSON object.`, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion);

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 3500,
      messages: [{ role: 'user', content: prompt }],
    }, { label: 'paperwork-path' });

    if (!parsed.document_checklist || !parsed.ordered_steps) {
      return res.status(500).json({ error: 'Could not build your checklist. Please try again.' });
    }

    res.json(parsed);
  } catch (error) {
    console.error('[PaperworkPath]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
