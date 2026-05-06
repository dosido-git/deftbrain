const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage } = require('../lib/claude');
const { rateLimit } = require('../lib/rateLimiter');

const PERSONALITY = `You are an alternate history architect — a blend of historian, futurist, and storyteller. You build plausible alternate timelines where one change cascades through politics, technology, culture, and daily life. Each consequence logically follows from the last. You know enough real history to make the butterfly effect specific and surprising.

RULES:
- Every consequence must LOGICALLY follow from the previous one — no random jumps
- Mix scales: geopolitics, technology, culture, AND everyday life
- Include at least one genuinely surprising but defensible consequence
- Ground everything in real historical context — what WAS happening at that time
- Be specific: "smartphones arrive in 1985" not "technology advances faster"`;

router.post('/alternate-path', rateLimit(), async (req, res) => {
  try {
    const { whatIf, yearOrContext, depth, userLanguage } = req.body;

    if (!whatIf?.trim()) {
      return res.status(400).json({ error: 'Give me a "what if" to explore!' });
    }

    const depthMap = {
      quick: 'Generate 5 consequences, keep it punchy. 50 years max.',
      deep: 'Generate 8-10 consequences tracing 100+ years. Go deep on cascading effects.',
      absurd: 'Generate 6-8 consequences that start plausible and escalate to hilarious but internally consistent extremes.'
    };

    const userPrompt = `ALTERNATE HISTORY:

WHAT IF: "${whatIf.trim()}"
${yearOrContext?.trim() ? `CONTEXT/YEAR: ${yearOrContext.trim()}` : ''}
DEPTH: ${depthMap[depth] || depthMap.quick}

Build a plausible alternate timeline. Each consequence MUST logically follow from the previous one.

Return ONLY valid JSON:

{
  "divergence_point": "Restate the exact moment history changes — be specific about date and context",
  "real_history": "What actually happened in 1-2 sentences — the baseline",
  "timeline": [
    {
      "year_range": "When this consequence occurs (e.g., '1950-1960')",
      "event": "What happens — be specific",
      "because": "Why this follows from the previous consequence",
      "real_world_contrast": "What actually happened instead, in one sentence"
    }
  ],
  "today_looks_like": "What the present day looks like in this timeline — 2-3 vivid sentences about daily life",
  "biggest_surprise": "The most unexpected but logical consequence in the chain",
  "butterfly_moment": "The single smallest change that caused the biggest downstream effect",
  "plausibility": "1-10 how plausible this overall timeline is"
}`;

    const parsed = await callClaudeWithRetry(userPrompt, {
      model: 'claude-sonnet-4-6',
      label: 'AlternatePath',
      max_tokens: 2500,
      system: withLanguage(PERSONALITY, userLanguage),
    });
    res.json(parsed);

  } catch (error) {
    console.error('AlternatePath error:', error);
    res.status(500).json({ error: error.message || 'Alternate timeline failed' });
  }
});

module.exports = router;
