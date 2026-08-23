const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

// ════════════════════════════════════════════════════════════
// POST /cold-open-craft — Reach Out to Anyone
// ════════════════════════════════════════════════════════════

const systemPrompt = `Cold outreach writer. Help the user write a first message to someone they do not know well.

GROUNDING RULES:
- Use only facts the user supplied or facts explicitly verified elsewhere in the request context.
- Never invent a claim from the recipient's writing, the sender's work history, a shared experience, a metric, a quote, a mutual connection, or any other specific detail.
- Never infer what the recipient thinks, values, prefers, receives a lot of, will notice, or is likely to do.
- Do not manufacture "specificity". If a useful specific detail was not supplied, write a good message without it. Use an obvious bracketed placeholder only when the message truly cannot work without a user-specific fact; omission is preferred to placeholders.
- Do not predict response rates, open rates, attention, memorability, or other outcomes.
- Safe / medium / bold differ in directness and conversational risk, not in how much you invent.
- Explain the tradeoff of each approach, not speculative psychology.
- Follow-up timing is a practical suggestion, not a claim about how the recipient will perceive a particular number of days.

STYLE:
Make the ask clear and low-friction. Keep each message natural for the selected channel. Reference supplied recipient details when they are genuinely useful, without flattering or pretending to know more than the user provided.

Never place a double-quote (") character inside any JSON string value — write quoted phrases in messages plainly or with single quotes, or it breaks the JSON.`;

router.post('/cold-open-craft', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    // `tone` is no longer read: the form's tone selector was removed, and the
    // three openers now vary by directness rather than by a requested voice.
    const { who, why, channel, whatYouKnow, yourBackground, userLanguage } = req.body;

    if (!who?.trim() || !why?.trim()) {
      return res.status(400).json({ error: 'Tell us who you\'re reaching out to and why.' });
    }

    const userPrompt = `WHO I'M REACHING OUT TO: ${who}
WHY: ${why}
CHANNEL: ${channel || 'email'}
${whatYouKnow ? `WHAT I KNOW ABOUT THEM: ${whatYouKnow}` : ''}
${yourBackground ? `MY BACKGROUND: ${yourBackground}` : ''}

Generate three usable cold openers from ONLY the facts above. Return ONLY valid JSON:
{
  "situation_read": "1-2 grounded sentences naming the actual outreach challenge and the useful facts available. Do not characterize the recipient's personality, motives, preferences, inbox, status, or likely reaction.",

  "openers": [
    {
      "boldness": "safe | medium | bold",
      "label": "Short label for this approach",
      "message": "Exact sendable message. Use supplied facts only. Do not invent specifics. Avoid placeholders unless a genuinely necessary fact is missing; if it can simply be omitted, omit it.",
      "why_it_works": "1-2 sentences explaining what this version emphasizes and the tradeoff it makes. Do not predict response, attention, credibility, or what the recipient will think.",
      "best_if": "One sentence describing when the user might prefer this style over the others."
    }
  ],

  "subject_line": "If email: a subject line grounded in supplied facts. If not email: null.",

  "what_not_to_say": [
    "3-5 situation-specific cautions based only on the information supplied. Phrase them as risks or tone problems, not claims about what the recipient will think."
  ],

  "follow_up_plan": {
    "when": "A reasonable follow-up window framed as a suggestion, not a behavioral prediction.",
    "message": "A short follow-up message that adds no invented facts.",
    "when_to_stop": "A restrained stopping rule that respects silence without predicting damage or offense."
  }
}

Generate exactly 3 openers: safe, medium, bold. Every factual statement about either person must trace directly to the supplied fields above.`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 4000,
      system: withLanguage(systemPrompt, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'cold-open-craft' });

    if (!parsed.openers && !parsed.situation_read) {
      return res.status(500).json({ error: 'Could not craft your opener. Please try again.' });
    }
    return res.json(parsed);

  } catch (error) {
    console.error('ColdOpenCraft error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
