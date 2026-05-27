const express = require('express');
const router = express.Router();
const { cleanJsonResponse, withLanguage, callClaudeWithRetry } = require('../lib/claude');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

const PERSONALITY = `Futures analyst — technology forecasting, labor economics, pattern recognition across industries. You don't predict the future; you analyze trajectories.

Assess forces shaping a person's career, skill, or industry. Show what's accelerating, what's decelerating, what's getting automated, what's becoming more valuable. Give the honest bull/base/bear scenarios. Name the specific moves that improve outcomes across all three.`;

// POST /future-proof — 5-year trajectory analysis
router.post('/future-proof', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { subject, subjectType, context, timeframe, userLanguage } = req.body;
    if (!subject?.trim()) return res.status(400).json({ error: 'What do you want to assess?' });

    const userPrompt = `FUTUREPROOF — TRAJECTORY ANALYSIS

SUBJECT: "${subject.trim()}"
TYPE: ${subjectType || 'Infer from subject — skill / career / investment / habit / commitment / technology'}
${context?.trim() ? `PERSONAL CONTEXT: ${context.trim()}` : ''}
TIMEFRAME: ${timeframe || '5 years'}

Analyze the trajectory. Show the pattern, not just the prediction.

Return ONLY valid JSON:
{
  "subject_as_understood": "What you're analyzing, clearly stated — one sentence",
  "trajectory": "growing | stable | transforming | declining | volatile | context_dependent",
  "trajectory_label": "GROWING ↑ | STABLE → | TRANSFORMING ⟳ | DECLINING ↓ | VOLATILE ⚡ | CONTEXT-DEPENDENT ◇",
  "trajectory_strength": "strong | moderate | weak",
  "confidence": "high | medium | low",

  "the_pattern": "2-3 sentences — the key trend that drives this trajectory. Specific forces, not vibes. What's actually happening in the data?",

  "tailwinds": [
    {
      "force": "Name of the tailwind — one sentence",
      "explanation": "One sentence — how this specifically helps",
      "strength": "strong | moderate | weak"
    }
  ],

  "headwinds": [
    {
      "force": "Name of the headwind — one sentence",
      "explanation": "One sentence — what the actual risk is",
      "timeline": "When this becomes a real factor (e.g., '2-3 years', '5+ years', 'already visible') — one sentence"
    }
  ],

  "the_automation_question": {
    "risk_level": "high | medium | low | negligible",
    "what_gets_automated": "Specifically which tasks or parts — not the whole thing if it's nuanced — one sentence",
    "what_doesnt": "The parts that are hard to automate and why — one sentence",
    "net_effect": "Whether automation is a threat, a tool, or mostly irrelevant here — one sentence"
  },

  "the_pivot": {
    "adjacent_moves": [
      {
        "move": "The specific pivot or addition — one sentence",
        "why_it_changes_the_picture": "How this combination dramatically improves the outlook — one sentence",
        "effort_required": "low | medium | high"
      }
    ],
    "the_version_worth_pursuing": "If they're going to invest in this, this is the specific form/combination/specialization that has the strongest 5-year case — one sentence"
  },

  "scenarios": {
    "bull_case": "Best-case trajectory and what conditions produce it — specific — one sentence",
    "base_case": "Most likely trajectory — specific — one sentence",
    "bear_case": "Worst-case and what triggers it — specific — one sentence"
  },

  "the_honest_take": "One direct paragraph — if you were a mentor who genuinely cared about this person's future, what would you actually tell them about this? Don't hedge excessively, don't catastrophize. Just the real read. — one sentence",

  "one_action": "The single most valuable thing they can do in the next 90 days given this analysis — one sentence"
}`;

    const parsed = await callClaudeWithRetry({
model: 'claude-sonnet-4-6',
      max_tokens: 4500,
      system: withLanguage(PERSONALITY, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'future-proof' });
    if (!parsed.subject_as_understood) {
      return res.status(500).json({ error: 'Could not generate a response. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('FutureProof error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.'});
  }
});

module.exports = router;
