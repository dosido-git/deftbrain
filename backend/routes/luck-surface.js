const express = require('express');
const router = express.Router();
const { cleanJsonResponse, withLanguage, callClaudeWithRetry } = require('../lib/claude');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

const PERSONALITY = `Luck surface analyst. Identify the specific structural changes that put someone in the path of more good fortune — not platitudes, but precise interventions.

Luck is surface area. Diagnose what's limiting it, then prescribe 5 asymmetric moves: high-upside, low-downside actions that compound over time. Be specific about mechanism, timing, and the counter-intuitive move they're missing.`;

router.post('/luck-surface', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { description, goals, currentExposures, userLanguage } = req.body;
    if (!description?.trim()) return res.status(400).json({ error: 'Describe your life and current patterns.' });

    const userPrompt = `LUCK SURFACE ANALYSIS

THEIR LIFE / CURRENT PATTERNS:
"${description.trim()}"
${goals?.trim() ? `\nWHAT KIND OF LUCK THEY WANT MORE OF: ${goals.trim()}` : ''}
${currentExposures?.trim() ? `\nCURRENT EXPOSURES / THINGS THEY ALREADY DO: ${currentExposures.trim()}` : ''}

Calculate their luck surface area. Design 5 moves to expand it dramatically.

Return ONLY valid JSON:
{
  "audit": {
    "current_surface_area": "A percentage — dramatic and specific, e.g. '14%' — one sentence",
    "the_diagnosis": "2-3 sentences on why their luck surface area is what it is — the specific patterns producing the constraint",
    "the_invisible_wall": "The single biggest structural reason they're not encountering more luck — named precisely — one sentence",
    "what_theyre_good_at": "What they're already doing that IS expanding their luck surface (genuine credit) — one sentence"
  },

  "the_five_moves": [
    {
      "title": "Short memorable title — 3-6 words",
      "mechanism": "broadcast | infiltrate | create | curate | compound",
      "the_move": "The specific, weird, actionable thing to do — concrete enough to execute this week — one sentence",
      "why_asymmetric": "Why this move produces disproportionate luck relative to the effort it requires — one sentence",
      "luck_multiplier": "The specific type of luck this move is most likely to generate — one sentence",
      "time_to_first_result": "How long before they'd expect the first serendipitous collision from this — one sentence"
    }
  ],

  "the_target": {
    "new_surface_area": "The percentage after implementing the five moves, e.g. '43%' — one sentence",
    "what_becomes_possible": "Specifically what becomes possible at this new surface area that isn't possible now — one sentence",
    "the_compound_effect": "How these five moves interact and amplify each other — one sentence"
  },

  "the_one_to_start": "Of the five moves, the one to do first — and the exact first step to take today — one sentence"
}`;

    const parsed = await callClaudeWithRetry({
model: 'claude-sonnet-4-6',
      max_tokens: 2200,
      system: withLanguage(PERSONALITY, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'luck-surface' });
    res.json(parsed);

  } catch (error) {
    console.error('LuckSurface error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.'});
  }
});

module.exports = router;
