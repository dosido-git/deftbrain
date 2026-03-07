const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

const PERSONALITY = `You are a strategic disruption designer. You specialize in identifying invisible ruts — the patterns people fall into without realizing it — and designing single, specific, achievable interventions that break them.

You're not a life coach. You don't give motivational advice. You observe patterns, find the constraint that's producing the stagnation, and engineer one precise disruption.

YOUR METHOD:
- The disruption must be SPECIFIC (exact time, place, action — not "try something new")
- It must be SLIGHTLY UNCOMFORTABLE but not genuinely risky or harmful
- It must TARGET A REAL PATTERN hidden in their routine, not just add novelty
- The best disruption is one where they can already feel a small resistance to it — that friction is the signal
- It should produce a downstream effect that compounds — not a one-time experience, but a pattern-breaker that changes what's possible

CRITICAL RULES:
- One disruption only. Not a list of suggestions. ONE.
- Be surgical. The specificity is the value.
- Name the invisible pattern it's breaking before prescribing the disruption
- The disruption should feel slightly absurd but immediately doable
- It should NOT require money, equipment, new skills, or major time investment`;

router.post('/chaos-pilot', async (req, res) => {
  try {
    const { routine, context, goals, whatsFeelingStuck, userLanguage } = req.body;
    if (!routine?.trim()) return res.status(400).json({ error: 'Describe your typical week.' });

    const userPrompt = `CHAOS PILOT — ONE CALCULATED DISRUPTION

THEIR ROUTINE: "${routine.trim()}"
${context?.trim() ? `CONTEXT ABOUT THEM: ${context.trim()}` : ''}
${goals?.trim() ? `WHAT THEY'RE TRYING TO ACHIEVE: ${goals.trim()}` : ''}
${whatsFeelingStuck?.trim() ? `WHAT'S FEELING STALE OR STUCK: ${whatsFeelingStuck.trim()}` : ''}

Identify the invisible pattern. Design the one disruption.

Return ONLY valid JSON:
{
  "pattern_diagnosis": {
    "the_invisible_rut": "The specific behavioral or environmental pattern producing the stagnation — named precisely, not generically",
    "why_its_invisible": "Why this person can't see it from inside it",
    "what_its_costing": "The specific thing this pattern is preventing or eroding — concrete, not vague"
  },

  "the_disruption": {
    "what": "The exact action — specific enough that there's no ambiguity about what to do",
    "when": "Exact timing — day of week, time of day, specific trigger",
    "where": "Exact location if relevant",
    "the_full_instruction": "The complete, vivid description of exactly what to do. Written like you're there with them. 3-5 sentences. Include sensory details. Make it feel real.",
    "the_slight_discomfort": "The specific friction point they'll feel — name it exactly so they recognize it when it comes up",
    "why_this_one": "Why THIS disruption for THIS person — the specific mechanism by which it breaks the specific pattern you identified"
  },

  "the_downstream_effect": {
    "immediate": "What happens in the first 30 minutes",
    "within_a_week": "The first ripple — what shifts in their environment or relationships",
    "compound_effect": "The pattern that becomes possible once this one break happens — what door opens"
  },

  "if_they_resist": "The exact thought they'll have that will make them skip it — and the one sentence that dismantles that excuse"
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1800,
      system: withLanguage(PERSONALITY, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('ChaosPilot error:', error);
    res.status(500).json({ error: error.message || 'Failed to design your disruption' });
  }
});

module.exports = router;
