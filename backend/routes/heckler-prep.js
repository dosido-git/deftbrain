const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');
const { rateLimit } = require('../lib/rateLimiter');

// ════════════════════════════════════════════════════════════
// POST /heckler-prep — Anticipate the Hard Questions
// ════════════════════════════════════════════════════════════
router.post('/heckler-prep', rateLimit(), async (req, res) => {
  try {
    const { topic, audience, proposal, knownObjections, stakes, userLanguage } = req.body;

    if (!topic?.trim()) {
      return res.status(400).json({ error: 'Tell us what you\'re presenting or proposing.' });
    }

    const systemPrompt = `You are a presentation sparring partner — part debate coach, part hostile audience simulator, part communications strategist. When someone is about to present, pitch, or propose something, you generate the hardest questions they'll face and coach them through each answer.

YOUR APPROACH:
1. THINK LIKE THE SKEPTIC. What would the most critical person in the room ask? The person who doesn't want this to succeed? The person who's been burned before? The person who has to justify this to THEIR boss?
2. RANGE OF DIFFICULTY. Start with reasonable challenges and escalate to the genuinely uncomfortable ones. The last 2-3 questions should make them sweat.
3. THE REAL CONCERN. Behind every tough question is an underlying fear or priority. Name it. "When they ask 'what's the ROI?', they're really asking 'will I look stupid if I approve this?'"
4. MODEL ANSWERS that are honest, not evasive. The best answer to a tough question acknowledges the concern, then reframes. Never dodge — it's obvious and it kills trust.
5. BAIL-OUT STRATEGIES for questions they genuinely can't answer. "I don't have that number in front of me, but I'll follow up by end of day" is better than making something up.
6. Include at least one GOTCHA question — the kind designed to trap you into contradicting yourself or making a promise you can't keep.
7. Include at least one EMOTIONAL question — not about data, but about feelings, trust, or values.
8. Adapt to the stakes. A team standup needs different prep than a board presentation.`;

    const userPrompt = `WHAT I'M PRESENTING: ${topic}
MY AUDIENCE: ${audience || 'not specified'}
${proposal ? `WHAT I'M PROPOSING/ASKING FOR: ${proposal}` : ''}
${knownObjections ? `OBJECTIONS I ALREADY KNOW ABOUT: ${knownObjections}` : ''}
STAKES: ${stakes || 'moderate'}

Generate the hardest questions. Return ONLY valid JSON:
{
  "situation_read": "1-2 sentences on the dynamic — what the audience cares about and why this presentation is tricky.",

  "questions": [
    {
      "number": 1,
      "difficulty": "moderate | hard | brutal",
      "type": "Data/Logic | Political | Emotional | Gotcha | Practical | Values",
      "question": "The exact question they'll ask. Written in their voice — blunt, specific, pointed.",
      "real_concern": "What they're actually worried about underneath this question.",
      "model_answer": "A strong 3-5 sentence answer. Acknowledges the concern, provides substance, reframes if needed. Written in natural speech, not corporate-speak.",
      "dont_say": "One thing NOT to say in response — the trap most people fall into.",
      "bail_out": "If you truly don't know the answer, say this instead."
    }
  ],

  "the_curveball": {
    "question": "One completely unexpected question from an angle you didn't anticipate.",
    "how_to_handle": "2 sentences on how to handle a question you never saw coming."
  },

  "opening_move": "One thing to say at the START of your presentation that preemptively defuses the biggest objection. Saves you from being on defense the whole time.",

  "confidence_note": "One sentence of honest encouragement — not generic, but based on what they told you about their situation."
}

Generate exactly 10 questions, escalating in difficulty. At least 2 should be 'brutal'.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4500,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    return res.json(parsed);

  } catch (error) {
    console.error('HecklerPrep error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate questions' });
  }
});

module.exports = router;
