const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');
const { rateLimit } = require('../lib/rateLimiter');

// ════════════════════════════════════════════════════════════
// POST /toast-writer — Write a Toast, Speech, or Tribute
// ════════════════════════════════════════════════════════════
router.post('/toast-writer', rateLimit(), async (req, res) => {
  try {
    const { person, occasion, relationship, stories, tone, duration, avoid, userLanguage } = req.body;

    if (!person?.trim() || !occasion?.trim()) {
      return res.status(400).json({ error: 'Tell us who the toast is for and the occasion.' });
    }

    const systemPrompt = `You are a speechwriter who specializes in personal toasts, tributes, and short speeches. You've written for weddings, retirements, birthdays, roasts, memorials, and every occasion where someone stands up and says something that matters.

YOUR PHILOSOPHY:
1. SPECIFIC > GENERIC. "She's always been there for me" is forgettable. "She drove 3 hours in a snowstorm to bring me soup when I had mono" is unforgettable. Use the details they provide.
2. Structure matters: HOOK (grab attention in the first line), HEART (the real story or insight), LANDING (the emotional close that ties it together). Every great toast follows this arc.
3. Match the room. A wedding toast is different from a retirement roast. A memorial is different from a birthday. Read the occasion.
4. Humor is a tool, not a requirement. Some toasts need warmth, not laughs. But if humor fits, it should feel natural — never forced.
5. Keep it SHORT. Most people talk too long. A great 90-second toast beats a mediocre 5-minute speech every time.
6. Write for the EAR, not the eye. Short sentences. Natural rhythm. Words that feel good to say out loud.
7. Complicated relationships are okay. Not every tribute is for a perfect person. You can be honest and loving at the same time.
8. Include delivery notes — where to pause, where to make eye contact, where the laugh should land.
9. Never include anything from the "avoid" list. If they say "don't mention the divorce," that topic doesn't exist.`;

    const userPrompt = `THE PERSON: ${person}
THE OCCASION: ${occasion}
MY RELATIONSHIP TO THEM: ${relationship || 'not specified'}
${stories ? `STORIES/DETAILS I WANT TO INCLUDE: ${stories}` : ''}
TONE: ${tone || 'warm_and_funny'}
TARGET LENGTH: ${duration || '2_minutes'}
${avoid ? `DO NOT MENTION: ${avoid}` : ''}

Write the toast. Return ONLY valid JSON:
{
  "occasion_read": "One sentence acknowledging the occasion and what makes this toast important.",

  "versions": [
    {
      "style": "Warm & Heartfelt | Funny & Roast-y | Elegant & Refined",
      "label": "Short label (e.g., 'The Storyteller', 'The Roast', 'The Elegant One')",
      "speech": "The full toast/speech. Written for the ear — short sentences, natural rhythm, clear paragraph breaks. Include [PAUSE], [LOOK AT THEM], [WAIT FOR LAUGH] delivery cues inline.",
      "opening_line": "The first line, isolated — this is the hook that grabs the room.",
      "closing_line": "The last line — this is what people remember.",
      "estimated_time": "Approximate delivery time (e.g., '90 seconds', '2 minutes')"
    }
  ],

  "delivery_tips": [
    "4-5 specific delivery tips for THIS speech and THIS occasion. Not generic public speaking advice — tailored coaching."
  ],

  "common_mistakes": [
    "3-4 mistakes people make at this type of occasion. Specific and practical."
  ],

  "emergency_closer": "If you freeze or lose your place, say this line to land gracefully no matter what."
}

Generate 3 versions with different styles. At least one should be warm/heartfelt and one should have humor.`;

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 3000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    return res.json(parsed);

  } catch (error) {
    console.error('ToastWriter error:', error);
    res.status(500).json({ error: error.message || 'Failed to write toast' });
  }
});

module.exports = router;
