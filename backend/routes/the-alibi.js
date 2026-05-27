const express = require('express');
const router = express.Router();
const { cleanJsonResponse, withLanguage, callClaudeWithRetry } = require('../lib/claude');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

// ════════════════════════════════════════════════════════════
// POST /the-alibi — Frame Your Story Right
// ════════════════════════════════════════════════════════════
router.post('/the-alibi', rateLimit(DEFAULT_LIMITS), async (req, res) => {
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

    const systemPrompt = `Social exit and decline strategist. Help people get out of commitments, say no, or explain a situation gracefully — without elaborate lies or relationship damage.

Scripts must be honest (no stories that need maintaining), socially calibrated for the relationship, and delivered with confidence. Anticipate the follow-up questions and pre-load the answers. Different register for boss, friend, family, acquaintance.`;

    const userPrompt = `THE REAL STORY:
${situation}

AUDIENCE: ${audienceLabel}
${tone ? `DESIRED TONE: ${tone}` : ''}
${concerns ? `THEIR WORRY: ${concerns}` : ''}
${context ? `ADDITIONAL CONTEXT: ${context}` : ''}

Help them frame this story. Return ONLY valid JSON:

{
  "situation_read": "1-2 sentences showing you understand their situation and why it feels awkward. Be empathetic, not clinical.",

  "reframe": "The core insight — what makes this story actually fine or even impressive when framed right. One powerful sentence. — one sentence",

  "versions": [
    {
      "label": "Short label for this approach (e.g., 'The Growth Story', 'The Pivot', 'Own It') — one sentence",
      "strategy": "One sentence describing what this version emphasizes",
      "script": "Exactly what to say — written in first person, conversational, ready to use. 2-4 sentences max.",
      "when_to_use": "When this version works best — one sentence",
      "risk": "What could go wrong with this framing — one sentence"
    }
  ],

  "follow_up_prep": [
    {
      "question": "A likely follow-up question they'll get — one sentence",
      "answer": "What to say — first person, concise — one sentence",
      "trap_to_avoid": "What NOT to say or do when answering this — one sentence"
    }
  ],

  "body_language": "Specific delivery tips: pace, eye contact, tone of voice, what to do with hands. Not generic — tailored to THIS situation and audience. — one sentence",

  "common_mistakes": [
    "Specific mistakes people make when explaining this type of situation — phrased as 'Don't X because Y'"
  ],

  "confidence_note": "A genuine, honest reassurance about why this situation is more normal/less damaging than they think. Not toxic positivity — real perspective. — one sentence",

  "nuclear_option": "If the conversation goes badly, here's the graceful exit or redirect. One sentence they can use to change the subject or end the line of questioning."
}

Generate 2-3 versions in the "versions" array, each with a genuinely different strategic approach (not just different tones). One should be the safest/most conservative, one should be the boldest, and one should be somewhere in between.`;

    const parsed = await callClaudeWithRetry({
model: 'claude-haiku-4-5-20251001',
      max_tokens: 4000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'the-alibi' });
    if (!parsed.reframe || !Array.isArray(parsed.versions)) {
      return res.status(500).json({ error: 'Could not craft your alibi. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('The Alibi error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.'});
  }
});

module.exports = router;
