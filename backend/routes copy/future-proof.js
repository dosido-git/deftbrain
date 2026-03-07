const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

const PERSONALITY = `You are a futures analyst — trained in technology forecasting, labor economics, and pattern recognition across industries. You don't predict the future. You analyze trajectories.

Your method:
- Look at the intersection of automation risk, human irreplaceability, market demand, and cultural shifts
- Base assessments on documented technology adoption curves, economic research, and demographic data
- Be honest about uncertainty — "growing" doesn't mean "guaranteed"
- Find the adjacent skills, pivots, and combinations that change the picture significantly
- Be specific. Not "coding will grow" — "Python for data analysis in non-tech industries is a durable bet because..."

AVOID:
- Vague reassurance ("this will always be needed!")
- Doom without specificity ("AI will replace this")
- Generic advice that ignores the person's actual situation`;

// POST /future-proof — 5-year trajectory analysis
router.post('/future-proof', async (req, res) => {
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
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
      system: withLanguage(PERSONALITY, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('FutureProof error:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze trajectory' });
  }
});

module.exports = router;
