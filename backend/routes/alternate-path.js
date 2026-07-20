const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

const PERSONALITY = `Alternate history architect — historian, futurist, and storyteller. Build plausible alternate timelines where one change cascades through politics, technology, culture, and daily life. Each consequence logically follows from the last. Know enough real history to make the butterfly effect specific and surprising.

Be concrete: name the year, the decision, the person, the domino. Vague alternate histories are boring. Specific ones are fascinating.`;

router.post('/alternate-path', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { whatIf, yearOrContext, depth, userLanguage } = req.body;

    if (whatIf?.trim() && whatIf.trim().length < 8) {
      // Degenerate one-token inputs ("?", "x") make the model answer in prose →
      // JSON parse fails through all retries → hard 500 (audit 2026-07-19).
      // Reject early with the same friendly 400 as an empty input.
      return res.status(400).json({ error: 'Give your what-if a bit more detail — a sentence works best.' });
    }
    if (!whatIf?.trim()) {
      return res.status(400).json({ error: 'Give me a "what if" to explore!' });
    }

    const depthMap = {
      quick: 'Generate 5 consequences, keep it punchy. 50 years max.',
      deep: 'Generate exactly 8 consequences tracing 100+ years. Go deep on cascading effects, but keep EACH field to one tight sentence — depth comes from the chain of 8, not from long paragraphs.',
      absurd: 'Generate 6-8 consequences that start plausible and escalate to hilarious but internally consistent extremes.'
    };

    const userPrompt = `ALTERNATE HISTORY:

WHAT IF: "${whatIf.trim()}"
${yearOrContext?.trim() ? `CONTEXT/YEAR: ${yearOrContext.trim()}` : ''}
DEPTH: ${depthMap[depth] || depthMap.quick}

Build a plausible alternate timeline. Each consequence MUST logically follow from the previous one.

Return ONLY valid JSON:

{
  "divergence_point": "Restate the exact moment history changes — be specific about date and context — one sentence",
  "real_history": "What actually happened in 1-2 sentences — the baseline",
  "timeline": [
    {
      "year_range": "When this consequence occurs (e.g., '1950-1960') — one sentence",
      "event": "What happens — be specific — one sentence",
      "because": "Why this follows from the previous consequence — one sentence",
      "real_world_contrast": "What actually happened instead, in one sentence"
    }
  ],
  "today_looks_like": "What the present day looks like in this timeline — 2-3 vivid sentences about daily life",
  "biggest_surprise": "The most unexpected but logical consequence in the chain — one sentence",
  "butterfly_moment": "The single smallest change that caused the biggest downstream effect — one sentence",
  "plausibility": 7
}

"plausibility" MUST be a single integer from 1 to 10 (digits only — no decimals, no text, no "/10").`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 6000,
      system: withLanguage(PERSONALITY, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'AlternatePath' });
    if (!parsed.divergence_point) {
      return res.status(500).json({ error: 'Could not generate the alternate path. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('AlternatePath error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
