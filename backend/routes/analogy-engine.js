const express = require('express');
const router = express.Router();
const { cleanJsonResponse, withLanguage, callClaudeWithRetry } = require('../lib/claude');
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

RULES: Every analogy must be accurate where it holds AND honest about where it breaks down — the break point often teaches more than the parallel. Offer multiple domains (technical, everyday, biological, historical). The key insight is WHY this analogy works structurally, not just how it sounds.`;

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

    const parsed = await callClaudeWithRetry({
model: 'claude-haiku-4-5-20251001',
      max_tokens: 2500,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'analogy-engine' });
    return res.json(parsed);

  } catch (error) {
    console.error('AnalogyEngine error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.'});
  }
});

module.exports = router;
