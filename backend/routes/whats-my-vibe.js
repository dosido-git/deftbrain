const express = require('express');
const router = express.Router();
const { cleanJsonResponse, withLanguage, callClaudeWithRetry } = require('../lib/claude');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

const PERSONALITY = `Brutally perceptive communication analyst — linguist's eye, sharp friend's delivery. Read between every line, notice every verbal tic.

RULES: Be specific — reference actual patterns, not generic observations. Entertaining but honest. "Sounds like" comparisons should be vivid archetypes, not celebrities. Quirks = things they don't realize they do. The secret tell must be genuinely insightful. Adjust for source type (texts = casual, emails = performed).`;

router.post('/whats-my-vibe', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { samples, sourceType, userLanguage } = req.body;

    if (!samples?.trim()) {
      return res.status(400).json({ error: 'Paste some text so I can read your vibe!' });
    }

    const sourceMap = {
      texts: 'casual text messages — their most unfiltered voice',
      emails: 'emails — slightly more performed but still revealing',
      social: 'social media posts — their public persona',
      dating: 'dating profile — their aspirational self-presentation',
      'work-slack': 'work chat / Slack — their professional persona',
      other: 'other writing — analyze the voice as-is',
    };

    const userPrompt = `WHAT'S MY VIBE — COMMUNICATION ANALYSIS

SOURCE TYPE: ${sourceMap[sourceType] || sourceMap.other}

THEIR WRITING:
"""
${samples.trim()}
"""

Analyze this person's communication style, personality, and vibe based on their actual writing. Be specific, entertaining, and honest.

Return ONLY valid JSON:

{
  "vibe_title": "A punchy 2-5 word vibe title (like a character archetype: 'The Warm Deflector', 'Chaotic Good Encourager', 'Professional With a Side of Unhinged')",
  "vibe_description": "2-3 sentence description of their overall communication personality. Reference specific patterns you noticed.",
  "energy": "One vivid sentence describing their energy level and type (e.g., 'Golden retriever energy but make it intellectual') — one sentence",
  "sounds_like": "Who/what they sound like — a vivid comparison. Not a celebrity, more of an archetype or scenario (e.g., 'The friend who gives advice while also spiraling') — one sentence",
  "punctuation_personality": "What their punctuation habits reveal. Be specific — do they overuse ellipses? Never use periods? Exclamation marks on everything? What does it mean? — one sentence",
  "vocabulary_read": "What their word choices reveal about them. Formal vs casual, filler words, pet phrases, emotional vocabulary range. — one sentence",
  "emotional_temperature": {
    "surface": "How they come across on first read — the vibe they're projecting — one sentence",
    "underneath": "What's actually going on beneath the surface — the emotion they're managing — one sentence",
    "gap_read": "The gap between surface and underneath — what this tells you about them — one sentence"
  },
  "quirks": [
    "Specific verbal habit or pattern #1 — something they probably don't realize they do",
    "Specific verbal habit or pattern #2",
    "Specific verbal habit or pattern #3"
  ],
  "text_back_energy": "What it feels like to receive a message from this person — the experience of being on the other end — one sentence",
  "secret_tell": "The one thing their writing reveals that they probably don't know they're broadcasting. The insight that makes someone go 'wait, how did you know that?' — one sentence",
  "share_line": "A single punchy sentence that captures their entire vibe — something they'd screenshot and send to friends — one sentence"
}`;

    const parsed = await callClaudeWithRetry({
model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      system: withLanguage(PERSONALITY, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'whats-my-vibe' });
    if (!parsed.vibe_description) {
      return res.status(500).json({ error: 'Could not read your vibe. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('WhatsMyVibe error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.'});
  }
});

module.exports = router;
