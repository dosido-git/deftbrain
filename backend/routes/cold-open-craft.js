const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage } = require('../lib/claude');

// ════════════════════════════════════════════════════════════
// POST /cold-open-craft — Reach Out to Anyone
// ════════════════════════════════════════════════════════════

const systemPrompt = `You are a cold outreach strategist — part copywriter, part social engineer, part empathy expert. You help people craft first messages to strangers that actually get responses.

YOUR PHILOSOPHY:
1. The #1 reason cold messages fail: they're about the SENDER, not the RECIPIENT. Every opener must lead with value or genuine relevance to THEM.
2. Specificity is everything. "I admire your work" is spam. "Your talk on X at Y conference changed how I think about Z" is a human being.
3. Short > long. The first message is a foot in the door, not a proposal. 2-4 sentences max for email/LinkedIn. Even shorter for DMs.
4. Give them an easy yes. Don't ask for a 30-minute call. Ask for a reaction, a yes/no, a pointer. Lower the bar.
5. Show you did homework without being creepy. Reference public work, not personal details.
6. Different channels have different norms. LinkedIn is more formal. Twitter DM is casual. Email is professional. Text is intimate. Match the channel.
7. Never grovel, never flatter excessively, never apologize for reaching out. Confidence without arrogance.
8. Include what NOT to say — the mistakes that kill cold outreach.

BOLDNESS CALIBRATION:
- safe: Polite, conventional, low risk of offense. Gets responses from 10-15%.
- medium: More personal, slightly unexpected. Gets responses from 15-25%.
- bold: Memorable, pattern-breaking, might raise eyebrows. Gets responses from 25-40% or gets ignored entirely.`;

router.post('/cold-open-craft', async (req, res) => {
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
      "label": "Short label for this approach (e.g., 'The Specific Compliment', 'The Mutual Connection', 'The Bold Ask')",
      "message": "The exact message to send. Channel-appropriate length. Ready to copy and customize.",
      "why_it_works": "1-2 sentences on the psychology behind this approach.",
      "response_rate": "Estimated response likelihood: low | moderate | high",
      "best_if": "When to use this one vs. the others. One sentence."
    }
  ],

  "subject_line": "If email: the subject line. If not email: null.",

  "what_not_to_say": [
    "4-5 specific things to avoid in THIS situation. Not generic advice — tailored to this outreach."
  ],

  "follow_up_plan": {
    "when": "How long to wait before following up",
    "message": "A short follow-up message if they don't respond",
    "when_to_stop": "When to accept the silence and move on"
  },

  "power_move": "One unconventional tactic specific to this situation that most people wouldn't think of. The 'nuclear option' that's high-risk, high-reward."
}

Generate 3 openers: one safe, one medium, one bold.`;

    const parsed = await callClaudeWithRetry(
      userPrompt,
      {
        system: withLanguage(systemPrompt, userLanguage),
        label: 'cold-open-craft',
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
      }
    );

    return res.json(parsed);

  } catch (error) {
    console.error('ColdOpenCraft error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate openers' });
  }
});

module.exports = router;
