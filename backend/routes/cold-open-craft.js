const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

// ════════════════════════════════════════════════════════════
// POST /cold-open-craft — Reach Out to Anyone
// ════════════════════════════════════════════════════════════

const systemPrompt = `Cold outreach strategist. Craft first messages to strangers that actually get responses.

RULES: Every opener must reference something specific and real about the recipient — not generic flattery. Make the ask clear and low-friction. Three versions: safe (won't backfire), bold (breaks through), creative (unexpected angle). The subject line is 40% of the open rate — treat it as a first impression.

Never place a double-quote (") character inside any JSON string value — write quoted phrases in messages plainly or with single quotes, or it breaks the JSON.`;

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
  "situation_read": "1-2 sentences on what the sender has actually told you, and what that makes hard about the approach. Restate their situation; do not extend it. You know nothing about the recipient beyond what was supplied — not how much inbound they get, not what they value, not whether they are approachable, not where the power sits. Every one of those is mind-reading, and it reads as insight while being invented. If the sender gave you little, say the approach has little to work with and what would sharpen it.",

  "openers": [
    {
      "boldness": "safe | medium | bold",
      "label": "Short label for this approach (e.g., 'The Specific Compliment', 'The Mutual Connection', 'The Bold Ask')",
      "message": "The exact message to send, channel-appropriate in length.
        THE HARD RULE, AND IT MATTERS MORE HERE THAN ANYWHERE: every factual claim in this message will be sent in the sender's name. You may use ONLY what they supplied. You may not invent what their article argued, what they built, what scale they worked at, what happened at a previous employer, what they tried and failed, or any specific of the recipient's work. If you did not read it, it did not happen.
        Where a specific would make the message land and you were not given one, leave an obvious placeholder in square brackets — [the specific thing your piece argued], [the number that surprised you] — so they fill it in and know they must. A placeholder is honest; an invented detail they do not notice is a false claim they send to a stranger.
        NO:  your piece on how alert ownership drift drives more burnout than volume   (they said only that they wrote about pager fatigue)
        NO:  when I was handling 50M events a day at Square                            (they said only that they worked at Square)
        YES: your piece on pager fatigue — [the part that stuck with me]
        YES: I worked on this at Square, and [the specific thing you ran into]
        Worked pairs for shape only; write your own.",
      "why_it_works": "1-2 sentences on what this approach does differently from the other two — what it leads with, what it leaves out, what it asks for. Describe the message, not the recipient's predicted reaction. No response likelihoods, no claims about what gets replies, no 'the fastest credibility signal available' or 'the single most attention-grabbing thing you can do' — nobody measured any of that.",
      "best_if": "When to use this one vs. the others. One sentence."
    }
  ],

  "subject_line": "If email: the subject line. If not email: null.",

  "what_not_to_say": [
    "4-5 specific things to avoid in THIS situation. Not generic advice — tailored to this outreach."
  ],

  "follow_up_plan": {
    "when": "How long to wait, offered as a reasonable interval rather than an optimal one. You cannot predict this recipient's behaviour, so do not justify the timing by what they will be doing or feeling.",
    "message": "A short follow-up message if they don't respond",
    "when_to_stop": "When to accept the silence and move on"
  },

}

Generate 3 openers: one safe, one medium, one bold.`;

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
