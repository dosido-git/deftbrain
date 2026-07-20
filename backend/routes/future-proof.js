const express = require('express');
const router = express.Router();
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { MODELS } = require('../lib/models');
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

CREDENTIALS: name a specific certification or credential ONLY if you are certain it currently exists under that exact name — otherwise describe it generically (e.g. 'a realtime-captioning certification from the national court-reporting association') and tell the reader to verify the current name.

Return ONLY valid JSON:
{
  "subject_as_understood": "What you're analyzing, clearly stated",
  "trajectory": "growing | stable | transforming | declining | volatile | context_dependent",
  "trajectory_label": "GROWING ↑ | STABLE → | TRANSFORMING ⟳ | DECLINING ↓ | VOLATILE ⚡ | CONTEXT-DEPENDENT ◇",
  "trajectory_strength": "strong | moderate | weak",
  "confidence": "high | medium | low",

  "the_pattern": "2-3 sentences — the key trend that drives this trajectory. Specific forces, not vibes. What's actually happening in the data?",

  "tailwinds": [
    {
      "force": "Name of the tailwind",
      "explanation": "One sentence — how this specifically helps",
      "strength": "strong | moderate | weak"
    }
  ],

  "headwinds": [
    {
      "force": "Name of the headwind",
      "explanation": "One sentence — what the actual risk is",
      "timeline": "When this becomes a real factor (e.g., '2-3 years', '5+ years', 'already visible')"
    }
  ],

  "the_automation_question": {
    "risk_level": "high | medium | low | negligible",
    "what_gets_automated": "Specifically which tasks or parts — not the whole thing if it's nuanced",
    "what_doesnt": "The parts that are hard to automate and why",
    "net_effect": "Whether automation is a threat, a tool, or mostly irrelevant here"
  },

  "the_pivot": {
    "adjacent_moves": [
      {
        "move": "The specific pivot or addition",
        "why_it_changes_the_picture": "How this combination dramatically improves the outlook",
        "effort_required": "low | medium | high"
      }
    ],
    "the_version_worth_pursuing": "If they're going to invest in this, this is the specific form/combination/specialization that has the strongest 5-year case"
  },

  "scenarios": {
    "bull_case": "Best-case trajectory and what conditions produce it — specific",
    "base_case": "Most likely trajectory — specific",
    "bear_case": "Worst-case and what triggers it — specific"
  },

  "the_honest_take": "One direct paragraph — if you were a mentor who genuinely cared about this person's future, what would you actually tell them about this? Don't hedge excessively, don't catastrophize. Just the real read.",

  "one_action": "The single most valuable thing they can do in the next 90 days given this analysis"
}

LIMITS: tailwinds and headwinds AT MOST 4 each; the_pivot.adjacent_moves AT MOST 3. Keep every field to ONE sentence, except the_pattern and the_honest_take (a short 2-3 sentence paragraph). Be terse — no padding.`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 5500,
      system: withLanguage(PERSONALITY, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
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
