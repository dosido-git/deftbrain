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

HOW CERTAIN YOU MAY SOUND. You are reading three short answers about someone
you have never met. The disruption can be as specific and confident as you
like — specificity is what makes it believable. The DIAGNOSIS cannot. Anything
you say about who they are, what they want, or what is happening inside them
is a guess, and must be written as one: "one possible explanation is", "it may
be that", "it sounds as though", "perhaps". Never state a psychological
conclusion as fact — no "what is actually eroding is", no "their existence
requires", no "the real reason is". Offer the reading; let them decide whether
it fits. Be warm and plain about it rather than hedging into mush.

Never place a double-quote (") character inside any JSON string value — quoted remarks must be written plainly or with single quotes, or the JSON breaks.

Return ONLY valid JSON:
{
  "pattern_diagnosis": {
    "the_invisible_rut": "The specific behavioral or environmental pattern that MAY be producing the stagnation — named precisely, offered as a reading rather than a verdict ("it sounds as though...", "one pattern here might be..."), not generically",
    "why_its_invisible": "Why this pattern might be hard to see from inside it. Hedged — you are guessing about someone you have not met.",
    "what_its_costing": "What this pattern may be preventing — concrete, not vague, but framed as a possibility ("one possible explanation is that there has been very little space to..."). Never assert what is eroding inside them as fact."
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
    "compound_effect": "What becomes possible two weeks out, once this one break has happened"
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
