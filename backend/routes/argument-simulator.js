const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage } = require('../lib/claude');
const { rateLimit } = require('../lib/rateLimiter');

const PERSONALITY = `You are a world-class debate coach who can argue any position brilliantly. You steelman both sides — finding the STRONGEST version of each argument, not a strawman. You understand that most interesting debates have genuine merit on both sides, and the fun is seeing how far each side can go. You're intellectually honest, sharp, and occasionally funny.

RULES:
- STEELMAN both sides — find the strongest, most charitable version of each argument
- Be genuinely persuasive for BOTH sides, not secretly favoring one
- Use specific examples, data points, and thought experiments
- Include the "uncomfortable truth" each side doesn't want to admit
- End with a genuine analysis of where the real disagreement lies`;

router.post('/argument-simulator', rateLimit(), async (req, res) => {
  try {
    const { hotTake, intensity, userLanguage } = req.body;

    if (!hotTake?.trim()) {
      return res.status(400).json({ error: 'Give me a hot take to debate!' });
    }

    const intensityMap = {
      civil: 'CIVIL — Respectful academic debate. Think Oxford Union. Strong arguments, no personal attacks.',
      heated: 'HEATED — Passionate but fair. Think smart friends arguing at dinner. Pointed, emotional, but intellectually honest.',
      unhinged: 'UNHINGED — Full throttle. Think Reddit comment section but actually smart. Maximum rhetorical firepower, dramatic flair, mic drops.'
    };

    const userPrompt = `ARGUMENT SIMULATOR:

HOT TAKE: "${hotTake.trim()}"
INTENSITY: ${intensityMap[intensity] || intensityMap.heated}

Argue BOTH sides of this take with maximum persuasive force. Steelman each position.

Return ONLY valid JSON:

{
  "topic_framed": "Reframe the hot take as a clear, debatable proposition",
  "side_a": {
    "position": "FOR — the strongest version of this take",
    "argument": "The full case FOR this position — 100-150 words, specific and persuasive",
    "killer_point": "The single strongest argument — the one that's hardest to counter",
    "evidence": "Specific example, data point, or thought experiment that supports this",
    "uncomfortable_truth": "The thing this side is right about that the other side doesn't want to admit"
  },
  "side_b": {
    "position": "AGAINST — the strongest counter-position",
    "argument": "The full case AGAINST — 100-150 words, equally specific and persuasive",
    "killer_point": "The single strongest counter-argument",
    "evidence": "Specific example, data, or thought experiment",
    "uncomfortable_truth": "The thing this side is right about that the other doesn't want to admit"
  },
  "where_they_actually_disagree": "The real, underlying disagreement — often not what it appears on the surface",
  "judge_verdict": "If you HAD to pick a winner on pure argument quality (not personal opinion): which side argued better and why? Be honest.",
  "dinner_party_take": "The nuanced take you'd give at a dinner party to sound smart without alienating anyone — 1-2 sentences"
}`;

    const parsed = await callClaudeWithRetry(userPrompt, {
      label: 'argument-simulator',
      max_tokens: 2000,
      system: withLanguage(PERSONALITY, userLanguage),
    });
    res.json(parsed);

  } catch (error) {
    console.error('ArgumentSimulator error:', error);
    res.status(500).json({ error: error.message || 'Debate failed' });
  }
});

module.exports = router;
