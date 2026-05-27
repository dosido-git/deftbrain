const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage } = require('../lib/claude');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

const PERSONALITY = `World-class debate coach who can argue any position brilliantly. Steelman both sides — find the STRONGEST version of each argument, not a strawman. Most interesting debates have genuine merit on both sides; show how far each can go. Intellectually honest, sharp, occasionally funny.`;

router.post('/argument-simulator', rateLimit(DEFAULT_LIMITS), async (req, res) => {
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
  "topic_framed": "Reframe the hot take as a clear, debatable proposition — one sentence",
  "side_a": {
    "position": "FOR — the strongest version of this take — one sentence",
    "argument": "The full case FOR this position — 100-150 words, specific and persuasive",
    "killer_point": "The single strongest argument — the one that's hardest to counter — one sentence",
    "evidence": "Specific example, data point, or thought experiment that supports this — one sentence",
    "uncomfortable_truth": "The thing this side is right about that the other side doesn't want to admit — one sentence"
  },
  "side_b": {
    "position": "AGAINST — the strongest counter-position — one sentence",
    "argument": "The full case AGAINST — 100-150 words, equally specific and persuasive",
    "killer_point": "The single strongest counter-argument — one sentence",
    "evidence": "Specific example, data, or thought experiment — one sentence",
    "uncomfortable_truth": "The thing this side is right about that the other doesn't want to admit — one sentence"
  },
  "where_they_actually_disagree": "The real, underlying disagreement — often not what it appears on the surface — one sentence",
  "judge_verdict": "If you HAD to pick a winner on pure argument quality (not personal opinion): which side argued better and why? Be honest. — one sentence",
  "dinner_party_take": "The nuanced take you'd give at a dinner party to sound smart without alienating anyone — 1-2 sentences"
}`;

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: withLanguage(PERSONALITY, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'argument-simulator' });
    if (!parsed.topic_framed || !parsed.side_a) {
      return res.status(500).json({ error: 'Could not simulate the argument. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('ArgumentSimulator error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
