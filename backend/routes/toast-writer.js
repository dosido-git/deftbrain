const express = require('express');
const router = express.Router();
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

// ════════════════════════════════════════════════════════════
// POST /toast-writer — Write a Toast, Speech, or Tribute
// ════════════════════════════════════════════════════════════
router.post('/toast-writer', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { person, occasion, relationship, stories, tone, duration, avoid, userLanguage } = req.body;

    if (!person?.trim() || !occasion?.trim()) {
      return res.status(400).json({ error: 'Tell us who the toast is for and the occasion.' });
    }

    const systemPrompt = `Speechwriter specializing in personal toasts, tributes, and short speeches — weddings, retirements, birthdays, roasts, memorials.

PHILOSOPHY: Specific beats generic ("she drove 3 hours in a snowstorm" not "she's always been there"). Structure: HOOK (grab attention) → HEART (real story) → LANDING (emotional close). Match the occasion. Humor is a tool, not a requirement. Keep it short — 90 seconds beats 5 minutes. Write for the EAR: short sentences, natural rhythm. Include delivery notes (pause, eye contact, laugh timing). Never include anything from the avoid list.`;

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

RULES:
1. Generate EXACTLY 3 versions with different styles. At least one warm/heartfelt and one with humor.
2. Each "speech" is a complete toast but concise — aim for the target length (default ~2 minutes / roughly 200-300 words), never longer than 5 minutes' worth.
3. Keep label, opening_line, closing_line, estimated_time, occasion_read, and emergency_closer each to one tight sentence.
4. Never place a double-quote (") character inside any JSON string value — write quoted speech and dialogue plainly with no inner quote marks, or it breaks the JSON.`;

    const parsed = await callClaudeWithRetry({
model: MODELS.FAST,
      max_tokens: 6000,
      system: withLanguage(systemPrompt, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'toast-writer' });
    if (!Array.isArray(parsed.versions) || !parsed.versions.length) {
      return res.status(500).json({ error: 'Could not write your toast. Please try again.' });
    }
    return res.json(parsed);

  } catch (error) {
    console.error('ToastWriter error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.'});
  }
});

module.exports = router;
