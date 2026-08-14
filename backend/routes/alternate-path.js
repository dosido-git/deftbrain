const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

const PERSONALITY = `Alternate history architect — historian, futurist, and storyteller. Build plausible alternate timelines where one change cascades through politics, technology, culture, and daily life. Each consequence logically follows from the last. Know enough real history to make the butterfly effect specific and surprising.

Be concrete: name the year, the decision, the person, the domino. Vague alternate histories are boring. Specific ones are fascinating.`;

router.post('/alternate-path', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { whatIf, yearOrContext, depth, reach, tone, userLanguage } = req.body;

    if (whatIf?.trim() && whatIf.trim().length < 8) {
      // Degenerate one-token inputs ("?", "x") make the model answer in prose →
      // JSON parse fails through all retries → hard 500 (audit 2026-07-19).
      // Reject early with the same friendly 400 as an empty input.
      return res.status(400).json({ error: 'Give your what-if a bit more detail — a sentence works best.' });
    }
    if (!whatIf?.trim()) {
      return res.status(400).json({ error: 'Give me a "what if" to explore!' });
    }

    // The form used to send one `depth` that mixed two questions — quick/deep
    // was how far the chain runs, absurd was how much realism it owes. They
    // arrive separately now. `depth` is still accepted so a browser holding a
    // cached bundle mid-deploy keeps working; absurd was always long, so it
    // maps to today+weird.
    const LEGACY_DEPTH = {
      quick:  ['decades', 'plausible'],
      deep:   ['today',   'plausible'],
      absurd: ['today',   'weird'],
    };
    const [legacyReach, legacyTone] = LEGACY_DEPTH[depth] || [];
    const REACH = {
      // The "exactly 8 … one tight sentence" cap is load-bearing: the old
      // free-running deep mode wrote paragraphs, blew past max_tokens and
      // 500'd every call (audit 2026-07-10). Do not loosen it.
      decades: 'Generate exactly 5 consequences, covering roughly 50 years.',
      today:   'Generate exactly 8 consequences tracing 100+ years, right up to the present day. Depth comes from the chain of 8, not from long paragraphs — keep EACH field to one tight sentence.',
    };
    const TONE = {
      plausible: 'Stay defensible: a historian should be able to nod at every step. Each consequence follows from the one before it for a reason you can name.',
      weird:     'Start plausible and let the chain escalate — later consequences can be extreme, funny, or gloriously strange. Absurd, not random: each one must still follow logically from the one before it.',
    };
    const reachKey = REACH[reach] ? reach : (legacyReach || 'decades');
    const toneKey  = TONE[tone]   ? tone  : (legacyTone  || 'plausible');

    const userPrompt = `ALTERNATE HISTORY:

WHAT IF: "${whatIf.trim()}"
${yearOrContext?.trim() ? `SCENE: ${yearOrContext.trim()}` : ''}
HOW FAR: ${REACH[reachKey]}
HOW REALISTIC: ${TONE[toneKey]}

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
      // 6000 was the anti-truncation fix for the old deep mode. today+weird is
      // a combination that never existed before — the full 8-link chain *and*
      // licence to get florid — so it gets headroom on top, which matters most
      // in German, where the same timeline runs about a third longer.
      max_tokens: 7000,
      system: withLanguage(PERSONALITY, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion) + ' Never place a double-quote (") character inside any JSON string value — write quoted phrases or speech plainly or with single quotes, or it breaks the JSON.',
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
