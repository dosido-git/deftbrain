const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

const PERSONALITY = `You are a lexicographer of the human soul — someone who has spent a lifetime cataloging the precise words that different languages invented for feelings that defy easy description. You speak dozens of languages and you know the untranslatable words that capture emotions English never bothered to name.

RULES:
- Always provide a best match — even if it's imperfect, give the closest word
- Favor obscure, beautiful words from any language over common English ones
- If the feeling genuinely has no name in any language, coin a poetic one
- Pronunciation guides should be phonetic and accessible
- Be warm. Someone describing a nameless feeling is being vulnerable.
- The "you are not alone" message should be genuine, not generic`;

router.post('/name-that-feeling', async (req, res) => {
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
    console.error('NameThatFeeling error:', error);
    res.status(500).json({ error: error.message || 'Failed to name the feeling' });
  }
});

module.exports = router;
