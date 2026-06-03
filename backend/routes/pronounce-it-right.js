const express = require('express');
const router = express.Router();
const { withLanguage, callClaudeWithRetry } = require('../lib/claude');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

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
router.post('/pronounce-it-right', rateLimit(DEFAULT_LIMITS), async (req, res) => {
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

    const systemPrompt = `World-class linguist and pronunciation coach. Map foreign sounds to the speaker's native sound system — not English sounds unless they speak English.

APPROACH:
1. Break into syllables with stress markers
2. Phonetic spelling using sounds THEY already know
3. Identify missing sounds; give closest approximation + mouth/tongue positioning
4. IPA for precision; simplified phonetic is primary
5. Explain why common mispronunciations happen

KEY PRINCIPLE: The phonetic guide must work for a ${lang} speaker.`;

    const userPrompt = `WORD/NAME/PHRASE: "${word.trim()}"
SPEAKER'S NATIVE LANGUAGE: ${lang}
${context ? `ADDITIONAL CONTEXT: ${context}` : ''}

${catContext}

Return ONLY valid JSON:

{
  "word": "${word.trim()}",
  "category_detected": "${cat}",
  "language_of_origin": "What language this word comes from — one sentence",

  "pronunciation": {
    "phonetic": "Simplified phonetic spelling for ${lang} speakers (e.g., 'nyoh-kee' for gnocchi). Use CAPS for stressed syllable. — one sentence",
    "ipa": "IPA notation with stress markers — one sentence",
    "syllables": ["broken", "in", "to", "parts"],
    "stress": "Which syllable gets primary stress and how to emphasize it — one sentence",
    "sounds_like": "Comparison to familiar words in ${lang} — 'The first syllable rhymes with X, the second sounds like Y' — one sentence",
    "mouth_guide": "Brief physical description for any tricky sounds — tongue position, lip shape, airflow — one sentence"
  },

  "common_mistakes": [
    {
      "wrong": "How people commonly mispronounce it — one sentence",
      "why": "Why this mistake happens — which sound is being substituted and why — one sentence",
      "fix": "How to correct it — specific and actionable — one sentence"
    }
  ],

  "context_info": {
    "what_it_is": "Category-appropriate description (what the dish is, who the person is, where the place is, etc.) — one sentence",
    "origin_story": "Brief interesting background — cultural, historical, or linguistic — one sentence",
    "use_in_sentence": "A natural sentence using this word correctly — shows how to deploy it confidently — one sentence",
    "pro_tip": "Insider knowledge — how someone 'in the know' would handle this word — one sentence"
  },

  "confidence_script": "A short, natural thing to say if you're unsure of pronunciation in the moment — not 'I'm so sorry', but something that shows you care without being awkward — 2-4 sentences",

  "dont_confuse_with": [
    {
      "word": "Similar-sounding word that means something different — one sentence",
      "difference": "How to distinguish them — one sentence"
    }
  ] or [],

  "regional_variants": [
    {
      "region": "Where",
      "pronunciation": "How it's said there — one sentence",
      "note": "Which version to use when — one sentence"
    }
  ] or [],

  "fun_fact": "One interesting linguistic or cultural fact about this word that makes it memorable — one sentence"
}

Keep common_mistakes to 2-3 entries. Keep dont_confuse_with to 0-2 entries. Keep regional_variants to 0-3 entries.`;

    const parsed = await callClaudeWithRetry({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2500,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'pronounce-it-right' });
    if (!parsed.pronunciation && !parsed.phonetic) {
      return res.status(500).json({ error: 'Could not analyze pronunciation. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('PronounceItRight error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /pronounce-it-right/batch — Multiple words at once
// ════════════════════════════════════════════════════════════
router.post('/pronounce-it-right/batch', rateLimit(DEFAULT_LIMITS), async (req, res) => {
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

    const systemPrompt = `Concise pronunciation guides for multiple words, calibrated to a ${lang} speaker. Key sounds and common mistakes only.`;

    const userPrompt = `WORDS: ${validWords.map(w => `"${w.trim()}"`).join(', ')}
CATEGORY: ${cat}
SPEAKER: ${lang}

For each word, return a concise pronunciation guide. Return ONLY valid JSON:

{
  "guides": [
    {
      "word": "the word — one sentence",
      "phonetic": "Simplified phonetic for ${lang} speaker, CAPS for stress — one sentence",
      "ipa": "IPA notation — one sentence",
      "syllables": ["syl", "la", "bles"],
      "sounds_like": "Quick comparison to familiar sounds — one sentence",
      "top_mistake": "The #1 mispronunciation and how to fix it — one sentence",
      "what_it_is": "One-line description — one sentence",
      "fun_fact": "One memorable fact — one sentence"
    }
  ]
}`;

    const parsed = await callClaudeWithRetry({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'pronounce-it-right-2' });
    if (!parsed.pronunciation && !parsed.phonetic) {
      return res.status(500).json({ error: 'Could not analyze pronunciation. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('PronounceItRight batch error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
