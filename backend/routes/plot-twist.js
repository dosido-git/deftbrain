const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');
const { rateLimit } = require('../lib/rateLimiter');

// ════════════════════════════════════════════
// MAIN ENDPOINT: Untangle a decision
// ════════════════════════════════════════════
router.post('/plot-twist', rateLimit(), async (req, res) => {
  try {
    const { decision, options, context, values, deadline, stuckReason, userLanguage } = req.body;

    if (!decision) return res.status(400).json({ error: 'Decision description is required' });

    const optionsList = Array.isArray(options) && options.length > 0
      ? options.map((o, i) => `  Option ${i + 1}: ${o}`).join('\n')
      : '  Not specified — identify the options from the description';

    const valuesText = Array.isArray(values) && values.length > 0
      ? values.join(', ')
      : 'Not specified';

    const basePrompt = `You are a decision clarity coach — part therapist, part strategist. Your job is NOT to tell people what to decide. It's to show them angles they're missing so the answer becomes obvious to THEM.

THE DECISION:
"""
${decision}
"""

OPTIONS:
${optionsList}

CONTEXT: ${context || 'None provided'}
WHAT MATTERS MOST: ${valuesText}
DEADLINE: ${deadline || 'No specific deadline'}
WHY THEY'RE STUCK: ${stuckReason || 'Not specified'}

RUN THIS DECISION THROUGH EVERY FRAMEWORK BELOW:

1. PRE-MORTEM (for each option):
   Imagine you chose this option and it went badly. What went wrong? Why did it fail? This surfaces hidden risks your optimism is blocking.

2. 10/10/10 RULE (for each option):
   How will you feel about this choice in 10 minutes? 10 months? 10 years? This separates short-term anxiety from long-term impact.

3. OPPORTUNITY COST:
   What does choosing each option cost you in terms of the other options? What doors close? What becomes harder or impossible? Be specific.

4. REVERSIBILITY CHECK:
   How reversible is each option? Can you undo it? How easily? "Two-way door" decisions (easily reversed) need less agonizing. "One-way door" decisions (hard to reverse) deserve more thought.

5. VALUES ALIGNMENT:
   Given what they said matters to them (or what you can infer), how well does each option align? Score each option against their stated/implied values.

6. THE REAL QUESTION:
   Often the stated decision isn't the actual decision. What's the deeper question they're really wrestling with? (e.g., "Should I take this job?" might really be "Am I allowed to prioritize money over passion?")

7. STUCK PATTERN:
   Based on why they're stuck, identify the cognitive pattern keeping them frozen. Is it fear of regret? Analysis paralysis? Sunk cost? People-pleasing? Fear of the unknown? Name it clearly.

OUTPUT FORMAT — Return ONLY valid JSON:
{
  "decision_summary": "1-sentence restatement of the decision in clearer terms",

  "the_real_question": "The deeper question beneath the surface decision",

  "stuck_pattern": {
    "pattern": "name of the cognitive pattern (e.g., 'Fear of regret', 'Sunk cost fallacy', 'Analysis paralysis')",
    "explanation": "How this pattern is operating in their specific situation",
    "unlock": "The reframe that typically breaks this pattern"
  },

  "options_analysis": [
    {
      "option": "Option name/description",
      "pre_mortem": "What went wrong when you imagined this failing?",
      "ten_ten_ten": {
        "ten_minutes": "How you'd feel immediately",
        "ten_months": "How you'd feel in 10 months",
        "ten_years": "How you'd feel in 10 years"
      },
      "opportunity_cost": "What you lose by choosing this",
      "reversibility": {
        "score": 7,
        "assessment": "How reversible (1=permanent, 10=easily undone) and why"
      },
      "values_alignment": {
        "score": 8,
        "assessment": "How well this aligns with their stated values and why"
      },
      "hidden_upside": "A benefit they probably haven't considered",
      "hidden_risk": "A risk they probably haven't considered"
    }
  ],

  "comparison_matrix": {
    "dimensions": ["10-year impact", "Reversibility", "Values fit", "Risk level", "Growth potential"],
    "scores": [
      {
        "option": "Option 1 name",
        "scores": [8, 7, 9, 4, 7]
      }
    ]
  },

  "gut_check": "Based on how they described the situation (word choice, what they emphasized, what they minimized), what does their gut seem to already know? Don't be afraid to call it out.",

  "one_question": "The single question that, if they can answer honestly, will make this decision clear",

  "if_still_stuck": {
    "coin_flip_test": "Assign heads to one option, tails to the other. When the coin is in the air, which one are you hoping for? That's your answer.",
    "two_year_letter": "Write a 2-sentence letter from your future self who chose well. What would they say?",
    "smallest_step": "If you can't decide the big thing, what's the smallest step you could take toward clarity right now?"
  }
}

IMPORTANT RULES:
- Be direct and insightful, not wishy-washy. If the analysis clearly favors one option, say so — but frame it as "the analysis suggests" not "you should."
- The gut_check should be genuinely perceptive — read between the lines of how they described things.
- If they only gave one option (not a choice between things), treat the implicit second option as "stay with the status quo / do nothing."
- comparison_matrix scores are 1-10. Include 2-5 options and 4-6 dimensions.
- the_real_question should be genuinely insightful, not a restatement.
- Keep all text practical and specific to THEIR situation, not generic.

Return ONLY the JSON object. No markdown fences, no preamble.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4500,
      messages: [{ role: 'user', content: withLanguage(basePrompt, userLanguage) }],
    });

    const textContent = message.content.find(item => item.type === 'text')?.text || '';
    const parsed = JSON.parse(cleanJsonResponse(textContent));
    res.json(parsed);

  } catch (error) {
    console.error('Plot Twist error:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze decision' });
  }
});

module.exports = router;
