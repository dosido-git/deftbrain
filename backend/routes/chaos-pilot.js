const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage, withLocaleContext } = require('../lib/claude');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

async function withRetry(fn, { retries = 3, baseDelayMs = 1500 } = {}) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const status = err?.status ?? err?.error?.status;
      const isOverloaded = status === 529 || err?.error?.error?.type === 'overloaded_error';
      if (isOverloaded && attempt < retries) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        console.warn(`[chaos-pilot] Overloaded (529), retrying in ${delay}ms (attempt ${attempt + 1}/${retries})`);
        await new Promise(r => setTimeout(r, delay));
      } else {
        throw err;
      }
    }
  }
}

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

Return ONLY valid JSON:
{
  "pattern_diagnosis": {
    "the_invisible_rut": "The specific behavioral or environmental pattern producing the stagnation — named precisely, not generically — one sentence",
    "why_its_invisible": "Why this person can't see it from inside it — one sentence",
    "what_its_costing": "The specific thing this pattern is preventing or eroding — concrete, not vague — one sentence"
  },

  "the_disruption": {
    "what": "The exact action — specific enough that there's no ambiguity about what to do — one sentence",
    "when": "Exact timing — day of week, time of day, specific trigger — one sentence",
    "the_full_instruction": "The complete, vivid description of exactly what to do. Written like you're there with them. 3-5 sentences. Include sensory details. Make it feel real.",
    "the_slight_discomfort": "The specific friction point they'll feel — name it exactly so they recognize it when it comes up — one sentence",
    "why_this_one": "Why THIS disruption for THIS person — the specific mechanism by which it breaks the specific pattern you identified — one sentence"
  },

  "the_downstream_effect": {
    "immediate": "What happens in the first 30 minutes — one sentence",
    "within_a_week": "The first ripple — what shifts in their environment or relationships — one sentence",
    "compound_effect": "The pattern that becomes possible once this one break happens — what door opens — one sentence"
  },

  "if_they_resist": "The exact thought they'll have that will make them skip it — and the one sentence that dismantles that excuse"
}`;

    const msg = await withRetry(() => anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: withLanguage(PERSONALITY, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
      messages: [{ role: 'user', content: userPrompt }],
    }));
    const parsed = JSON.parse(cleanJsonResponse(msg.content.find(i => i.type === 'text')?.text || ''));

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
