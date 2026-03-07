const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

// ════════════════════════════════════════════════════════════
// POST /the-alibi — Frame Your Story Right
// ════════════════════════════════════════════════════════════
router.post('/the-alibi', async (req, res) => {
  try {
    const {
      situation,       // The real story — what actually happened
      audience,        // Who they need to tell: 'interviewer', 'landlord', 'date', 'in-laws', 'lender', 'coworker', 'friend', 'custom'
      customAudience,  // If audience is 'custom'
      tone,            // 'professional', 'casual', 'warm', 'confident'
      concerns,        // What they're worried about: "they'll think I'm flaky", "it looks like I was fired"
      context,         // Extra context: "applying for senior role", "first date", "mortgage application"
      userLanguage,
    } = req.body;

    if (!situation?.trim()) {
      return res.status(400).json({ error: 'Tell us the real story — we\'ll help you frame it' });
    }

    const audienceLabel = audience === 'custom' ? (customAudience || 'someone') : audience;

    const systemPrompt = `You are a narrative strategist — part career coach, part communications expert, part therapist. Your job: take someone's real, messy, complicated story and help them tell it honestly but strategically to a specific audience.

KEY PRINCIPLES:
1. NEVER suggest lying or fabricating. Every frame must be truthful — you're choosing emphasis, not inventing fiction.
2. The same facts can be framed completely differently depending on audience. A career gap told to an interviewer emphasizes growth; told to a date, it emphasizes life experience.
3. Anticipate follow-up questions. The best narrative holds up under gentle probing.
4. Acknowledge the awkward parts — owning them is almost always stronger than hiding them.
5. Confidence sells. HOW you say it matters as much as what you say.
6. Short is better. Rambling signals insecurity. The best version is the most concise one.
7. Be warm, practical, and never judgmental about their situation. Everyone has messy chapters.`;

    const userPrompt = `THE REAL STORY:
${situation}

AUDIENCE: ${audienceLabel}
${tone ? `DESIRED TONE: ${tone}` : ''}
${concerns ? `THEIR WORRY: ${concerns}` : ''}
${context ? `ADDITIONAL CONTEXT: ${context}` : ''}

Help them frame this story. Return ONLY valid JSON:

{
  "situation_read": "1-2 sentences showing you understand their situation and why it feels awkward. Be empathetic, not clinical.",

  "reframe": "The core insight — what makes this story actually fine or even impressive when framed right. One powerful sentence.",

  "versions": [
    {
      "label": "Short label for this approach (e.g., 'The Growth Story', 'The Pivot', 'Own It')",
      "strategy": "One sentence describing what this version emphasizes",
      "script": "Exactly what to say — written in first person, conversational, ready to use. 2-4 sentences max.",
      "when_to_use": "When this version works best",
      "risk": "What could go wrong with this framing"
    }
  ],

  "follow_up_prep": [
    {
      "question": "A likely follow-up question they'll get",
      "answer": "What to say — first person, concise",
      "trap_to_avoid": "What NOT to say or do when answering this"
    }
  ],

  "body_language": "Specific delivery tips: pace, eye contact, tone of voice, what to do with hands. Not generic — tailored to THIS situation and audience.",

  "common_mistakes": [
    "Specific mistakes people make when explaining this type of situation — phrased as 'Don't X because Y'"
  ],

  "confidence_note": "A genuine, honest reassurance about why this situation is more normal/less damaging than they think. Not toxic positivity — real perspective.",

  "nuclear_option": "If the conversation goes badly, here's the graceful exit or redirect. One sentence they can use to change the subject or end the line of questioning."
}

Generate 2-3 versions in the "versions" array, each with a genuinely different strategic approach (not just different tones). One should be the safest/most conservative, one should be the boldest, and one should be somewhere in between.`;

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 3000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const parsed = JSON.parse(cleanJsonResponse(text));
    res.json(parsed);

  } catch (error) {
    console.error('The Alibi error:', error);
    res.status(500).json({ error: error.message || 'Failed to frame your story' });
  }
});

module.exports = router;
