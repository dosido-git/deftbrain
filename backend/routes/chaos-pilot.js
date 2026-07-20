const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

const PERSONALITY = `Strategic disruption designer. Identify invisible ruts — patterns people fall into without realizing it — and design one precise, specific intervention that breaks them.

METHOD: The disruption must be SPECIFIC (exact time, place, action — not "try something new"), slightly uncomfortable but not harmful, targeting a REAL hidden pattern. Best disruptions create friction the person can already feel. ONE disruption only. Surgical. Name the invisible pattern before prescribing the fix. No money, equipment, or major time required.`;

router.post('/chaos-pilot', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { routine, context, goals, whatsFeelingStuck, userLanguage } = req.body;
    if (!routine?.trim()) return res.status(400).json({ error: 'Describe your typical week.' });

    const userPrompt = `CHAOS PILOT — ONE CALCULATED DISRUPTION

THEIR ROUTINE: "${routine.trim()}"
${context?.trim() ? `CONTEXT ABOUT THEM: ${context.trim()}` : ''}
${goals?.trim() ? `WHAT THEY'RE TRYING TO ACHIEVE: ${goals.trim()}` : ''}
${whatsFeelingStuck?.trim() ? `WHAT'S FEELING STALE OR STUCK: ${whatsFeelingStuck.trim()}` : ''}

Identify the invisible pattern. Design the one disruption.

Never place a double-quote (") character inside any JSON string value — quoted remarks must be written plainly or with single quotes, or the JSON breaks.

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

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 4000,
      system: withLanguage(PERSONALITY, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'ChaosPilot' });

    if (!parsed.pattern_diagnosis || !parsed.the_disruption) {
      return res.status(500).json({ error: 'Could not analyze this situation. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('ChaosPilot error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.'});
  }
});

module.exports = router;
