const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse } = require('../lib/claude');

router.post('/six-degrees-of-me', async (req, res) => {
  try {
    const { thingA, thingB, profileContext } = req.body;

    if (!thingA || !thingB) {
      return res.status(400).json({ error: 'Both Thing A and Thing B are required' });
    }

    const prompt = `You are a pattern-finder who traces hidden connections between seemingly unrelated parts of someone's life. You find the real, plausible threads that connect things in ways the person hasn't noticed.

THING A: ${thingA}
THING B: ${thingB}
PERSON'S CONTEXT: ${profileContext || 'No profile provided'}

YOUR TASK: Find a chain of connections from Thing A to Thing B.

RULES:
- Each link in the chain must be a plausible, specific connection - not a vague abstraction
- Use the person's actual life context when provided to make connections personal and specific
- Prefer surprising, non-obvious connections over the shortest path
- Each connection should make the person think "oh wow, I never thought of it that way"
- The chain should feel like a story, not a logic puzzle
- Keep it to 3-6 nodes (2-5 degrees of separation)
- The first node must be Thing A and the last node must be Thing B
- Each node's "connection" field explains HOW it links to the next node

BAD example (too generic):
"Philosophy degree" -> "Both involve thinking" -> "Software engineering"

GOOD example (specific and surprising):
"Philosophy degree" -> "Trained you to decompose arguments into premises" -> "Logical decomposition" -> "You instinctively break problems into boolean conditions" -> "Software engineering"

OUTPUT (JSON only):
{
  "chain": [
    {
      "point": "Thing A (the starting point)",
      "connection": "How this connects to the next point - be specific and personal"
    },
    {
      "point": "The intermediary connection",
      "connection": "How this links forward"
    },
    {
      "point": "Thing B (the destination)",
      "connection": null
    }
  ],
  "insight": "A 1-2 sentence reflection on what this chain reveals about the person - the hidden pattern or theme that connects these seemingly unrelated things. Make it feel like a genuine insight, not a platitude."
}

CRITICAL: Return ONLY valid JSON. No preamble, no markdown fences.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }]
    });

    const textContent = message.content.find(item => item.type === 'text')?.text || '';

    let jsonText = textContent.trim();
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');

    const firstBrace = jsonText.indexOf('{');
    if (firstBrace > 0) {
      jsonText = jsonText.substring(firstBrace);
    }

    const lastBrace = jsonText.lastIndexOf('}');
    if (lastBrace !== -1 && lastBrace < jsonText.length - 1) {
      jsonText = jsonText.substring(0, lastBrace + 1);
    }

    const parsed = JSON.parse(jsonText.trim());
    res.json(parsed);

  } catch (error) {
    console.error('Six Degrees of Me error:', error);
    if (error instanceof SyntaxError) {
      console.error('JSON Parse Error:', error.message);
    }
    res.status(500).json({
      error: error.message || 'Failed to trace connections'
    });
  }
});

module.exports = router;
