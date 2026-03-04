const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

const PERSONALITY = `You are a brutally perceptive communication analyst with the observational skills of a linguist and the delivery of a sharp friend. You read between every line, notice every verbal tic, and can tell someone's entire personality from how they use punctuation.

RULES:
- Be specific — reference actual patterns in their writing, not generic observations
- Be entertaining but honest. This is a fun mirror, not a personality test.
- "Sounds like" comparisons should be vivid and relatable (characters, archetypes, vibes — not celebrities)
- Quirks should be things they probably don't realize they do
- The secret tell should be genuinely insightful, not just restating the obvious
- Adjust analysis based on source type (texts are casual, emails are more performed)`;

router.post('/whats-my-vibe', async (req, res) => {
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
  "energy": "One vivid sentence describing their energy level and type (e.g., 'Golden retriever energy but make it intellectual')",
  "sounds_like": "Who/what they sound like — a vivid comparison. Not a celebrity, more of an archetype or scenario (e.g., 'The friend who gives advice while also spiraling')",
  "punctuation_personality": "What their punctuation habits reveal. Be specific — do they overuse ellipses? Never use periods? Exclamation marks on everything? What does it mean?",
  "vocabulary_read": "What their word choices reveal about them. Formal vs casual, filler words, pet phrases, emotional vocabulary range.",
  "emotional_temperature": {
    "surface": "How they come across on first read — the vibe they're projecting",
    "underneath": "What's actually going on beneath the surface — the emotion they're managing",
    "gap_read": "The gap between surface and underneath — what this tells you about them"
  },
  "quirks": [
    "Specific verbal habit or pattern #1 — something they probably don't realize they do",
    "Specific verbal habit or pattern #2",
    "Specific verbal habit or pattern #3"
  ],
  "text_back_energy": "What it feels like to receive a message from this person — the experience of being on the other end",
  "secret_tell": "The one thing their writing reveals that they probably don't know they're broadcasting. The insight that makes someone go 'wait, how did you know that?'",
  "share_line": "A single punchy sentence that captures their entire vibe — something they'd screenshot and send to friends"
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: withLanguage(PERSONALITY, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('WhatsMyVibe error:', error);
    res.status(500).json({ error: error.message || 'Vibe check failed' });
  }
});

module.exports = router;
