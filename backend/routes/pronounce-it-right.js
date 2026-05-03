const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');
const { rateLimit } = require('../lib/rateLimiter');

// ════════════════════════════════════════════════════════════
// CATEGORY-SPECIFIC CONTEXT INSTRUCTIONS
// ════════════════════════════════════════════════════════════
const CATEGORY_CONTEXT = {
  name: `CATEGORY: Person's Name
EXTRA CONTEXT TO PROVIDE:
- Cultural origin and meaning of the name
- Honorific conventions (Mr./Ms., -san, -ji, etc.)
- Name order conventions (family name first vs. last)
- Nickname norms (is it OK to shorten? Cultural expectations)
- A respectful script for asking the person to help correct your pronunciation
- Similar names that are commonly confused with this one`,

  food: `CATEGORY: Food or Drink
EXTRA CONTEXT TO PROVIDE:
- What this dish/drink actually IS (brief description)
- Regional origin and culinary tradition
- How to order it confidently at a restaurant (a natural sentence, not just the word)
- Common menu variations or related items
- Whether pronunciation varies by restaurant style (casual vs. fine dining)
- What NOT to say (common embarrassing mispronunciations)`,

  place: `CATEGORY: Place Name
EXTRA CONTEXT TO PROVIDE:
- Where this place is (country, region)
- What locals call it vs. what tourists typically say
- Whether the English pronunciation differs from the local one (and which to use when)
- Demonym (what people from there are called)
- Any silent letters or counterintuitive spellings explained`,

  brand: `CATEGORY: Brand or Fashion House
EXTRA CONTEXT TO PROVIDE:
- What the brand is (fashion, luxury, etc.) and country of origin
- How sales associates and fashion professionals pronounce it
- Whether there's an accepted anglicized version or if the original is expected
- Common wrong versions you hear and why they're wrong
- How to pronounce it naturally in a sentence without sounding forced`,

  music_art: `CATEGORY: Music, Art, or Cultural Figure
EXTRA CONTEXT TO PROVIDE:
- Who this person is and their primary contribution
- How their name is pronounced in their native language vs. common English adaptation
- Whether there's an accepted English pronunciation or if the original is preferred
- How to reference them in conversation without sounding pretentious or ignorant`,

  science: `CATEGORY: Scientific or Medical Term
EXTRA CONTEXT TO PROVIDE:
- What this term means in plain language
- Professional pronunciation vs. casual/common pronunciation (if they differ)
- Greek or Latin roots broken down
- How doctors/scientists actually say it in practice
- Related terms that sound similar but mean different things`,

  phrase: `CATEGORY: Foreign Phrase or Expression
EXTRA CONTEXT TO PROVIDE:
- What it literally means and what it idiomatically means
- When to use it (and when NOT to — context matters)
- Whether it sounds pretentious in casual conversation vs. natural in formal settings
- The full phrase with any parts people commonly omit or add incorrectly
- Whether there's a good English equivalent (and when to use English instead)`,

  other: `CATEGORY: General Word or Term
EXTRA CONTEXT TO PROVIDE:
- What it means
- Language of origin
- Any context-dependent pronunciation variations
- Common mispronunciations and why they happen`,
};

// ════════════════════════════════════════════════════════════
// POST /say-it-right — Main pronunciation guide
// ════════════════════════════════════════════════════════════
router.post('/pronounce-it-right', rateLimit(), async (req, res) => {
  try {
    const {
      word,            // The word/name/phrase to pronounce
      category,        // name | food | place | brand | music_art | science | phrase | other
      context,         // Optional extra context
      nativeLang,      // User's native language
      userLanguage,    // UI language for i18n
    } = req.body;

    if (!word?.trim()) {
      return res.status(400).json({ error: 'Enter a word, name, or phrase to pronounce' });
    }

    const cat = category || 'other';
    const lang = nativeLang || 'English (American)';
    const catContext = CATEGORY_CONTEXT[cat] || CATEGORY_CONTEXT.other;

    const systemPrompt = `You are a world-class linguist and pronunciation coach. You help people say unfamiliar words correctly by mapping foreign sounds to their native language's sound system.

YOUR APPROACH:
1. Break the word into syllables with clear stress markers
2. Provide phonetic spelling calibrated to the speaker's native language — use sounds THEY already know
3. Identify the specific sounds that don't exist in their language and give the closest approximation + mouth/tongue positioning
4. Give IPA for precision, but the simplified phonetic is the primary output
5. Explain WHY common mispronunciations happen (not just "don't say X")
6. Provide category-appropriate context (see below)

KEY PRINCIPLE: The phonetic guide must work for someone who speaks ${lang}. "Sounds like [English word]" only works if they speak English. Adapt your sound comparisons to THEIR language.`;

    const userPrompt = `WORD/NAME/PHRASE: "${word.trim()}"
SPEAKER'S NATIVE LANGUAGE: ${lang}
${context ? `ADDITIONAL CONTEXT: ${context}` : ''}

${catContext}

Return ONLY valid JSON:

{
  "word": "${word.trim()}",
  "category_detected": "${cat}",
  "language_of_origin": "What language this word comes from",

  "pronunciation": {
    "phonetic": "Simplified phonetic spelling for ${lang} speakers (e.g., 'nyoh-kee' for gnocchi). Use CAPS for stressed syllable.",
    "ipa": "IPA notation with stress markers",
    "syllables": ["broken", "in", "to", "parts"],
    "stress": "Which syllable gets primary stress and how to emphasize it",
    "sounds_like": "Comparison to familiar words in ${lang} — 'The first syllable rhymes with X, the second sounds like Y'",
    "mouth_guide": "Brief physical description for any tricky sounds — tongue position, lip shape, airflow"
  },

  "common_mistakes": [
    {
      "wrong": "How people commonly mispronounce it",
      "why": "Why this mistake happens — which sound is being substituted and why",
      "fix": "How to correct it — specific and actionable"
    }
  ],

  "context_info": {
    "what_it_is": "Category-appropriate description (what the dish is, who the person is, where the place is, etc.)",
    "origin_story": "Brief interesting background — cultural, historical, or linguistic",
    "use_in_sentence": "A natural sentence using this word correctly — shows how to deploy it confidently",
    "pro_tip": "Insider knowledge — how someone 'in the know' would handle this word"
  },

  "confidence_script": "A short, natural thing to say if you're unsure of pronunciation in the moment — not 'I'm so sorry', but something that shows you care without being awkward",

  "dont_confuse_with": [
    {
      "word": "Similar-sounding word that means something different",
      "difference": "How to distinguish them"
    }
  ] or [],

  "regional_variants": [
    {
      "region": "Where",
      "pronunciation": "How it's said there",
      "note": "Which version to use when"
    }
  ] or [],

  "fun_fact": "One interesting linguistic or cultural fact about this word that makes it memorable"
}

Keep common_mistakes to 2-3 entries. Keep dont_confuse_with to 0-2 entries. Keep regional_variants to 0-3 entries.`;

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2500,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const parsed = JSON.parse(cleanJsonResponse(text));
    res.json(parsed);

  } catch (error) {
    console.error('PronounceItRight error:', error);
    res.status(500).json({ error: error.message || 'Pronunciation guide failed' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /pronounce-it-right/batch — Multiple words at once
// ════════════════════════════════════════════════════════════
router.post('/pronounce-it-right/batch', rateLimit(), async (req, res) => {
  try {
    const { words, category, nativeLang, userLanguage } = req.body;

    if (!words?.length || words.length < 2) {
      return res.status(400).json({ error: 'Enter at least 2 words for batch mode' });
    }

    const validWords = words.filter(w => w?.trim()).slice(0, 10);
    if (validWords.length < 2) {
      return res.status(400).json({ error: 'Need at least 2 valid words' });
    }

    const lang = nativeLang || 'English (American)';
    const cat = category || 'other';

    const systemPrompt = `You are a world-class linguist. Provide concise pronunciation guides for multiple words, calibrated to a ${lang} speaker. Be efficient — hit the key sounds and common mistakes for each.`;

    const userPrompt = `WORDS: ${validWords.map(w => `"${w.trim()}"`).join(', ')}
CATEGORY: ${cat}
SPEAKER: ${lang}

For each word, return a concise pronunciation guide. Return ONLY valid JSON:

{
  "guides": [
    {
      "word": "the word",
      "phonetic": "Simplified phonetic for ${lang} speaker, CAPS for stress",
      "ipa": "IPA notation",
      "syllables": ["syl", "la", "bles"],
      "sounds_like": "Quick comparison to familiar sounds",
      "top_mistake": "The #1 mispronunciation and how to fix it",
      "what_it_is": "One-line description",
      "fun_fact": "One memorable fact"
    }
  ]
}`;

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
    console.error('PronounceItRight batch error:', error);
    res.status(500).json({ error: error.message || 'Batch pronunciation failed' });
  }
});

module.exports = router;
