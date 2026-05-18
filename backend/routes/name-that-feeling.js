const express = require('express');
const router = express.Router();
const { cleanJsonResponse, withLanguage, callClaudeWithRetry } = require('../lib/claude');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

const PERSONALITY = `Emotional lexicographer. Find the precise word — often from another language — for feelings that lack a name in English.

Match on emotional accuracy, not just surface description. Explain what makes the word fit, where it breaks down, and why naming it matters. Include the poetic and the practical: knowing this feeling has a name can be genuinely clarifying.`;

router.post('/name-that-feeling', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { description, context, userLanguage } = req.body;

    if (!description?.trim()) {
      return res.status(400).json({ error: 'Describe the feeling you can\'t name.' });
    }

    const userPrompt = `NAME THAT FEELING

THE FEELING:
"${description.trim()}"
${context?.trim() ? `\nCONTEXT: "${context.trim()}"` : ''}

Find the precise word(s) for this feeling. Search across all languages. If no perfect word exists, find the closest ones and coin a poetic name.

Return ONLY valid JSON:

{
  "best_match": {
    "word": "The single best word for this feeling",
    "language": "What language it comes from",
    "pronunciation": "Phonetic pronunciation guide",
    "definition": "Clear, warm definition — 1-2 sentences",
    "why_this_fits": "Why this word captures what they described — be specific to their words"
  },
  "close_matches": [
    {
      "word": "Another word that's close but not quite",
      "language": "Language of origin",
      "definition": "Brief definition",
      "what_it_misses": "What aspect of the described feeling this word doesn't capture"
    }
  ],
  "from_other_languages": [
    {
      "word": "A beautiful word from another language",
      "language": "Language of origin",
      "pronunciation": "Phonetic guide",
      "literal_meaning": "What it literally translates to",
      "actual_meaning": "What it actually means — the feeling it captures",
      "beauty_note": "Why this word is beautiful or why this language bothered to name this feeling"
    }
  ],
  "the_poetic_name": "If no existing word is perfect, coin a beautiful compound word or phrase that captures this exact feeling. If the best_match is already perfect, still offer an alternative poetic name.",
  "you_are_not_alone": "A warm, specific sentence acknowledging that this feeling is more universal than they think. Reference the feeling itself, not generic reassurance.",
  "share_line": "A shareable one-liner: 'There's a word for [their feeling]: [word] ([language])' — punchy and interesting"
}

Provide 2-3 close_matches and 2-3 from_other_languages.`;

    const parsed = await callClaudeWithRetry({
model: 'claude-haiku-4-5-20251001',
      max_tokens: 750,
      system: withLanguage(PERSONALITY, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'name-that-feeling' });
    res.json(parsed);

  } catch (error) {
    console.error('NameThatFeeling error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.'});
  }
});

module.exports = router;
