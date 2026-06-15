const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

// ════════════════════════════════════════════════════════════
// POST /cold-open-craft — Reach Out to Anyone
// ════════════════════════════════════════════════════════════

const systemPrompt = `Cold outreach strategist. Craft first messages to strangers that actually get responses.

RULES: Every opener must reference something specific and real about the recipient — not generic flattery. Make the ask clear and low-friction. Three versions: safe (won't backfire), bold (breaks through), creative (unexpected angle). The subject line is 40% of the open rate — treat it as a first impression.`;

router.post('/cold-open-craft', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { who, why, channel, whatYouKnow, yourBackground, tone, userLanguage } = req.body;

    if (!who?.trim() || !why?.trim()) {
      return res.status(400).json({ error: 'Tell us who you\'re reaching out to and why.' });
    }

    const userPrompt = `WHO I'M REACHING OUT TO: ${who}
WHY: ${why}
CHANNEL: ${channel || 'email'}
${whatYouKnow ? `WHAT I KNOW ABOUT THEM: ${whatYouKnow}` : ''}
${yourBackground ? `MY BACKGROUND: ${yourBackground}` : ''}
PREFERRED TONE: ${tone || 'medium'}

Generate cold openers. Return ONLY valid JSON:
{
  "situation_read": "1-2 sentences showing you understand the dynamic — who has the power, what they probably get a lot of, and why most approaches fail here.",

  "openers": [
    {
      "boldness": "safe | medium | bold",
      "label": "Short label for this approach (e.g., 'The Specific Compliment', 'The Mutual Connection', 'The Bold Ask') — one sentence",
      "message": "The exact message to send. Channel-appropriate length. Ready to copy and customize. — 2-4 sentences",
      "why_it_works": "1-2 sentences on the psychology behind this approach.",
      "response_rate": "Estimated response likelihood: low | moderate | high",
      "best_if": "When to use this one vs. the others. One sentence."
    }
  ],

  "subject_line": "If email: the subject line. If not email: null. — one sentence",

  "what_not_to_say": [
    "4-5 specific things to avoid in THIS situation. Not generic advice — tailored to this outreach."
  ],

  "follow_up_plan": {
    "when": "How long to wait before following up — one sentence",
    "message": "A short follow-up message if they don't respond — 2-4 sentences",
    "when_to_stop": "When to accept the silence and move on — one sentence"
  },

  "power_move": "One unconventional tactic specific to this situation that most people wouldn't think of. The 'nuclear option' that's high-risk, high-reward. — one sentence"
}

Generate 3 openers: one safe, one medium, one bold.`;

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
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
