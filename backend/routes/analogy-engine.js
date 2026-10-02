const express = require('express');
const router = express.Router();
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

// ════════════════════════════════════════════════════════════
// POST /analogy-engine — Explain Anything to Anyone
// ════════════════════════════════════════════════════════════
router.post('/analogy-engine', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { concept, audience, audienceInterests, depth, userLanguage } = req.body;

    if (!concept?.trim()) {
      return res.status(400).json({ error: 'Tell us what you need to explain.' });
    }

    const systemPrompt = `Master explainer. Create analogies so precise that complex concepts click instantly.

RULES: Every analogy must be accurate where it holds AND honest about where it breaks down — the break point often teaches more than the parallel. Offer multiple domains (technical, everyday, biological, historical). The key insight is WHY this analogy works structurally, not just how it sounds.

NUMBERS AND FACTS MUST BE RIGHT: a wrong number in a teaching example teaches the wrong thing. Before writing any number, calculation, unit, date or fact, work it out and check it — doubling 3/4 is 6/4 (1 1/2), never 6/8. Never call a changed quantity 'the same amount' or offer two different answers to one calculation. Use small, easy numbers. A worked example states its numbers once and uses those same numbers in every step (a 10% rate stays 10%). If you cannot verify a calculation, describe the idea in words instead of working it out. This applies everywhere — analogies, misconceptions, corrections: if you are not certain a claim is true, leave it out and choose another.
When the concept is itself numeric or mathematical, the analogy must come from outside it (sharing a pizza, splitting a bill) — a recipe that uses fractions is an example of fractions, not an analogy for them.`;

    const userPrompt = `CONCEPT TO EXPLAIN: ${concept}
AUDIENCE: ${audience || 'general adult'}
${audienceInterests ? `AUDIENCE INTERESTS/WORLD: ${audienceInterests}` : ''}
DEPTH: ${depth || 'solid_understanding'}

Generate tailored analogies. Return ONLY valid JSON:
{
  "concept_name": "Clean name of the concept — 3-6 words",
  "one_liner": "The concept explained in one sentence a 10-year-old could understand. No jargon.",

  "analogies": [
    {
      "title": "Short catchy name for this analogy (e.g., 'The Library Card System') — 3-6 words",
      "type": "Visual | Experiential | Narrative | Structural | Emotional | Mechanical",
      "analogy": "The full analogy — 3-5 sentences. Written conversationally, as if explaining to the specific audience. Use their world.",
      "why_it_works": "One sentence on what makes this analogy effective for this audience.",
      "where_it_breaks": "One sentence on the limit of this analogy — what it doesn't capture.",
      "accuracy": "high | medium",
      "memorability": "high | medium"
    }
  ],

  "the_key_insight": "The single most important thing to understand about this concept, stated plainly. The sentence that makes everything click. — one sentence",

  "common_misconceptions": [
    {
      "myth": "2-4 of these — however many are genuinely distinct. Do not pad to reach a number, and do not split one misconception into two. What people wrongly believe, as ONE claim: a single sentence, no parenthetical, no second clause explaining it. If it needs an explanation it is not a misconception, it is a lesson — cut it or move the substance into the correction.",
      "reality": "The correction, as ONE sentence — aim for about 15 words. That is a target, not a cliff: go over when the correction genuinely needs it, but a 30-word answer means you are explaining rather than correcting. No parenthetical — not one, anywhere; if you reach for brackets, the thing inside them is either the real point or cuttable. These render as a two-line pair, so length is what breaks the format."
    }
  ],

  "go_deeper": "If they want to learn more, what's the next concept to understand? One sentence pointing them forward.",
  "go_deeper_concept": "Just the clean name of that next concept — 2-5 words, no punctuation, ready to drop into a fresh explanation. e.g. 'mRNA vaccine technology'",

  "teaching_tip": "One practical tip for the person doing the explaining — how to deliver these analogies effectively. — one sentence"
}

Generate ${depth === 'quick_grasp' ? '2-3' : depth === 'deep_understanding' ? '5-6' : '3-5'} analogies.`;

    const parsed = await callClaudeWithRetry({
      // SMART, not FAST (2026-10-02): Haiku slipped arithmetic into worked
      // examples ("double 3/4 = 6/8, the same amount") — a teaching tool can't.
      model: MODELS.SMART,
      // 4000 (not 2500) for i18n headroom: deep mode (6 analogies × 3-5
      // sentences) fills ~78% of 2500 in English but truncates → 500 in verbose
      // languages like German. The schema is already bounded; this is headroom.
      max_tokens: 4000,
      system: withLanguage(systemPrompt, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion) + ' Never place a double-quote (") character inside any JSON string value — write quoted phrases or examples plainly or with single quotes, or it breaks the JSON.',
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'analogy-engine' });
    if (!parsed.concept_name) {
      return res.status(500).json({ error: 'Could not generate a response. Please try again.' });
    }
    return res.json(parsed);

  } catch (error) {
    console.error('AnalogyEngine error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.'});
  }
});

module.exports = router;
