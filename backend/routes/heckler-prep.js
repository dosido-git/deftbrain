const express = require('express');
const router = express.Router();
const { cleanJsonResponse, withLanguage, callClaudeWithRetry } = require('../lib/claude');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

// ════════════════════════════════════════════════════════════
// POST /heckler-prep — Anticipate the Hard Questions
// ════════════════════════════════════════════════════════════
router.post('/heckler-prep', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { topic, audience, proposal, knownObjections, stakes, userLanguage } = req.body;

    if (!topic?.trim()) {
      return res.status(400).json({ error: 'Tell us what you\'re presenting or proposing.' });
    }

    const stakesConfig = {
      low:      { count: 5, brutalMin: 1 },
      moderate: { count: 7, brutalMin: 1 },
      high:     { count: 10, brutalMin: 2 },
    };
    const { count: questionCount, brutalMin } = stakesConfig[stakes] || stakesConfig.moderate;

    const systemPrompt = `Presentation sparring partner. Generate the hardest questions a skeptical audience will ask, then coach concise answers. Think like the person who doesn't want this to succeed. Include at least one Gotcha (designed to trap a contradiction) and one Emotional (about trust or values, not data). Return ONLY valid JSON.`;

    const userPrompt = `TOPIC: ${topic}
AUDIENCE: ${audience || 'not specified'}
${proposal ? `ASKING FOR: ${proposal}` : ''}
${knownObjections ? `KNOWN OBJECTIONS: ${knownObjections}` : ''}
STAKES: ${stakes || 'moderate'}

Return ONLY valid JSON:
{
  "situation_read": "2 sentences: what this audience cares about and why this is tricky. — one sentence",
  "questions": [
    {
      "number": 1,
      "difficulty": "moderate | hard | brutal",
      "type": "Data/Logic | Political | Emotional | Gotcha | Practical | Values",
      "question": "Exact question in audience voice. Blunt and specific. — one sentence",
      "real_concern": "The underlying fear in one sentence.",
      "model_answer": "2 sentences. Acknowledge the concern, then reframe. Plain speech. — one sentence",
      "dont_say": "The one-phrase trap most people fall into. — one sentence"
    }
  ],
  "the_curveball": {
    "question": "One unexpected question from an angle they didn't prepare for. — one sentence",
    "how_to_handle": "2 sentences. — one sentence"
  },
  "opening_move": "One sentence to say at the start that preemptively defuses the biggest objection.",
  "confidence_note": "One sentence of specific encouragement based on their situation."
}

Generate exactly ${questionCount} questions, escalating difficulty. At least ${brutalMin} must be 'brutal'.`;

    const maxTokensByStakes = { low: 1200, moderate: 2000, high: 3000 };
    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: maxTokensByStakes[stakes] || 2000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'heckler-prep' });

    if (!parsed.questions || !parsed.questions.length) {
      return res.status(500).json({ error: 'Could not generate your prep questions. Please try again.' });
    }
    return res.json(parsed);

  } catch (error) {
    console.error('HecklerPrep error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
