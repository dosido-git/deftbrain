const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

// ════════════════════════════════════════════════════════════
// POST /analogy-engine — Explain Anything to Anyone
// ════════════════════════════════════════════════════════════
router.post('/analogy-engine', async (req, res) => {
  try {
    const { concept, audience, audienceInterests, depth, userLanguage } = req.body;

    if (!concept?.trim()) {
      return res.status(400).json({ error: 'Tell us what you need to explain.' });
    }

    const systemPrompt = `You are a world-class explainer — part teacher, part storyteller, part comedian. Your superpower: creating analogies so good that complex ideas become instantly obvious.

YOUR APPROACH:
1. Each analogy must be TAILORED to the audience's world. "Explain blockchain to a gardener" should use soil, seeds, and seasons — not generic analogies. The more specific to their interests, the better.
2. Vary your analogy types: some visual, some experiential, some narrative, some mathematical/structural. Don't repeat the same format.
3. Include at least one analogy that's unexpectedly fun or memorable — the one they'll retell at dinner.
4. For each analogy, explain WHERE IT BREAKS DOWN. Every analogy has limits. Showing the limits proves you actually understand the concept.
5. Rate each analogy's accuracy vs. memorability — sometimes the most memorable analogy sacrifices some precision.
6. If the concept is genuinely simple, say so and give fewer analogies. Don't overexplain easy things.
7. Adapt complexity to the depth requested. "Quick grasp" = 1-2 killer analogies. "Deep understanding" = 4-5 with nuance.
8. Never be condescending. The audience isn't dumb — they just don't have context in this domain yet.`;

    const userPrompt = `CONCEPT TO EXPLAIN: ${concept}
AUDIENCE: ${audience || 'general adult'}
${audienceInterests ? `AUDIENCE INTERESTS/WORLD: ${audienceInterests}` : ''}
DEPTH: ${depth || 'solid_understanding'}

Generate tailored analogies. Return ONLY valid JSON:
{
  "concept_name": "Clean name of the concept",
  "one_liner": "The concept explained in one sentence a 10-year-old could understand. No jargon.",

  "analogies": [
    {
      "title": "Short catchy name for this analogy (e.g., 'The Library Card System')",
      "type": "Visual | Experiential | Narrative | Structural | Emotional | Mechanical",
      "analogy": "The full analogy — 3-5 sentences. Written conversationally, as if explaining to the specific audience. Use their world.",
      "why_it_works": "One sentence on what makes this analogy effective for this audience.",
      "where_it_breaks": "One sentence on the limit of this analogy — what it doesn't capture.",
      "accuracy": "high | medium",
      "memorability": "high | medium"
    }
  ],

  "the_key_insight": "The single most important thing to understand about this concept, stated plainly. The sentence that makes everything click.",

  "common_misconceptions": [
    "2-3 things people commonly get wrong about this concept, and the quick correction."
  ],

  "go_deeper": "If they want to learn more, what's the next concept to understand? One sentence pointing them forward.",

  "teaching_tip": "One practical tip for the person doing the explaining — how to deliver these analogies effectively."
}

Generate ${depth === 'quick_grasp' ? '2-3' : depth === 'deep_understanding' ? '5-6' : '3-5'} analogies.`;

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2500,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    return res.json(parsed);

  } catch (error) {
    console.error('AnalogyEngine error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate analogies' });
  }
});

module.exports = router;
