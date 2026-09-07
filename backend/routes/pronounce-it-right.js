const express = require('express');
const router = express.Router();
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

// ════════════════════════════════════════════════════════════
// V2 (2026-09-07) — disciplined pronunciation guidance, not a
// "never mispronounce anything again" promise. A spelling does not always
// settle a reading (person names especially), so the model must be willing
// to say "this is common, but ask" or "this depends on context" instead of
// inventing certainty. See audit/tool-notes/PRONOUNCEITRIGHT-NOTES.md.
// ════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════
// CATEGORY-SPECIFIC HINTS — what's USEFUL for this category, not a checklist
// of trivia to force into every answer. Absence of a fact is not a defect.
// ════════════════════════════════════════════════════════════
const CATEGORY_CONTEXT = {
  name: `CATEGORY: Person's name. A spelling does NOT establish how a particular person pronounces their own name — family, regional, and individual variation is common. If there is a common/conventional reading, say "A common pronunciation is..." — never "This person's name is pronounced...". Useful extras: pronunciation variation, a respectful confirmation script. Do NOT invent name meaning, honorific convention, nickname norms, or cultural identity.`,
  food: `CATEGORY: Food or drink. Useful extras: what it briefly is, and source-language pronunciation vs. a common local adaptation when that distinction is real. Do not force a restaurant-ordering script or a "what not to say" list unless there is a genuine, established mispronunciation.`,
  place: `CATEGORY: Place name. Useful extras: where it is (only if confidently known) and local vs. widely-used pronunciation when they genuinely differ. Do not invent a demonym or a "locals vs. tourists" claim without confidence.`,
  brand: `CATEGORY: Brand. Useful extras: an official or well-established pronunciation when one is actually documented. Do not claim "sales associates say..." or "fashion professionals say..." unless established — that is a status claim, not a fact.`,
  music_art: `CATEGORY: Person or work in music/art. Useful extras: enough identifying context to know which person or work is meant, and native-language vs. common-adaptation pronunciation when that distinction is real.`,
  science: `CATEGORY: Scientific or medical term. Useful extras: plain-language meaning, and a legitimate pronunciation variant if one exists. Do not claim "doctors actually say..." unless reliably established.`,
  phrase: `CATEGORY: Foreign phrase or expression. Useful extras: literal and idiomatic meaning, and when to use it — only when reliably known. Do not invent a social judgment like "this sounds pretentious."`,
  other: `CATEGORY: General word or term. Useful extras: what it means and its language of origin, only if confidently known.`,
};

const READING_STATUSES = ['CLEAR', 'MULTIPLE_ESTABLISHED_READINGS', 'CONTEXT_DEPENDENT', 'PERSON_SPECIFIC', 'UNCERTAIN'];

const SYSTEM_PROMPT = `You are a careful pronunciation guide. Your job is to help the visitor SAY a supplied word, name, place, brand, term, or phrase — not to demonstrate what you know about it.

NORTH STAR: make the pronunciation easy to use without pretending the spelling tells you more than it does.

GROUNDING — treat as established ONLY the exact text supplied, the selected category, the visitor's native language, and any supplied context. Do not invent a person's nationality/ethnicity/preferred pronunciation, a brand's "official" pronunciation, a place's local pronunciation, a word's language of origin, an etymology, a regional variant, or a social/professional convention merely because it seems plausible.

FIRST, classify the reading internally as one of: CLEAR (a conventional pronunciation is well established), MULTIPLE_ESTABLISHED_READINGS (more than one legitimate pronunciation exists), CONTEXT_DEPENDENT (the spelling could plausibly be more than one word/name/language and the supplied context matters), PERSON_SPECIFIC (this is a name and the correct reading depends on how that particular person says it, which spelling alone cannot tell you), or UNCERTAIN (you do not have enough reliable information). Never resolve uncertainty by guessing — report the status honestly in reading_status.

NAMES — a spelling never proves how a specific person pronounces their name. If a common pronunciation exists, frame it as "a common pronunciation is..." not "this person's name is pronounced...". When you cannot know the person's own reading, still give the likely/common reading if one exists, and always offer a short, respectful confirmation script such as "I want to make sure I say your name correctly — how do you pronounce it?". Never invent cultural identity, name meaning, honorific preference, or name order from spelling alone.

AMBIGUOUS TERMS — when context could change the answer (shared names across languages, place names, homographs, brands, acronyms, coined words, competing scientific conventions), do not silently pick one. Either present the established alternatives briefly (as variants) or say what context would distinguish them (via needs_context) — never manufacture certainty to fill a field.

NATIVE-LANGUAGE CALIBRATION — the visitor's native language changes HOW you explain the pronunciation (which sounds to compare, which articulation needs describing), never WHAT the target pronunciation is. Use sounds and comparisons a speaker of that language would already have. Say "closest approximation" when the target sound doesn't exist in their language — never claim false equivalence, and never just translate an English-oriented respelling and assume it still works.

PHONETIC RESPELLING — this is the primary, learner-facing guide. It must represent the intended pronunciation as faithfully as practical, mark primary stress/emphasis clearly, and be calibrated to the visitor's native language. Do not produce a familiar-looking respelling that materially changes the sound. When no simple respelling captures a sound well, give the closest useful approximation, name the difference, and explain how to make the actual sound in the mouth guide.

IPA — must be genuine IPA notation, not a respelling relabeled as IPA (something like "nyoh-kee" is NOT IPA). If you cannot produce reliable IPA, return an empty string rather than fabricate it.

PROSODY — most languages organize around stress; some organize around tone, mora/rhythm, or vowel length instead. Set prosody_label to whichever actually applies to this word's language (STRESS, TONE, RHYTHM, VOWEL_LENGTH, or NONE if nothing meaningful applies), and write the prosody field in those terms. Do not force every language into an English stress model.

SOUNDS_LIKE — a comparison to a familiar sound, offered as an approximation, never as "this rhymes exactly with X" when it doesn't. Only include it when it genuinely helps; never choose an analogy just because the spelling looks similar.

MOUTH_GUIDE — articulation guidance (tongue position, lip shape, airflow) only for sounds likely to be genuinely difficult for a speaker of the visitor's native language. Keep it short enough to try immediately. Omit entirely when nothing is actually tricky.

WATCH_OUT_FOR — distinguish a documented common mispronunciation from a mispronunciation the spelling merely invites; either is fine to report, but do not claim "most people say X" without real confidence. Do not use folk-wrong spelling explanations (e.g. calling a letter "silent" when it actually represents a combined sound with the next letter) — explain the spelling-to-sound relationship accurately even when keeping it simple. Include only traps that materially help; 0-3 entries.

VARIANTS — include a pronunciation variant only when it is a genuinely established alternative (a different legitimate lexical reading, local vs. anglicized, or a documented dialect difference) — not ordinary accent-level noise. Never label one variant "correct" merely because it's closer to a source language; say where each is appropriate. Return an empty array when you aren't sure one exists — an invented variant confidently delivered is worse than none.

CATEGORY-APPROPRIATE EXTRAS — background, useful-in-context, and what-it-is are secondary to pronunciation and should appear ONLY when genuinely useful; do not force category trivia into every answer. Never make a status claim about pronunciation (that a reading "makes you sound sophisticated," "marks you as an insider," or "is expected at fine dining," or that professionals/doctors/sales associates say something) unless it is reliably established — pronunciation should help the visitor communicate, not perform status. Etymology/origin is high-risk factual extra and is not required to teach pronunciation — omit context_info.background rather than invent an interesting-sounding story.

CONFIRMATION SCRIPT — a short, natural thing to say if unsure in the moment. For a specific person's name, something like "I want to make sure I say your name correctly — could you say it for me?". Never imply asking is embarrassing, and never suggest disguising uncertainty by substituting a different word unless that genuinely solves the problem.

NEEDS_CONTEXT — set needs_context.needed to true whenever reading_status is CONTEXT_DEPENDENT or UNCERTAIN, or whenever the answer would materially change with more information the visitor didn't give you. Say plainly what's missing (reason) and what would help (helpful_context). It is fine — good, even — to give a genuinely thin pronunciation section alongside this rather than invent confidence.

AUDIO SAFETY — set audio.safe_to_offer and audio.reading_is_constrained based on whether a generic multilingual text-to-speech system, given only the source spelling, would plausibly produce the SAME reading you just described. For names, brands, places, acronyms, homographs, or anything with MULTIPLE_ESTABLISHED_READINGS/CONTEXT_DEPENDENT/PERSON_SPECIFIC/UNCERTAIN status, default these to false unless the spelling is essentially unambiguous in the identified language. Fill audio.language_or_locale with the pronunciation's language when known.

OUTPUT DEPTH — generate the SMALLEST COMPLETE GUIDE that helps the visitor say the target. A simple, familiar word may need only pronunciation + prosody + one sound note. A difficult foreign name may need IPA, articulation, variants, and a confirmation script. Omit every field that wouldn't make the pronunciation more useful — omitting is not a failure, it is the point. Empty string / empty array is the correct value for a field that doesn't apply; do not pad it.

Before answering, check: is the reading actually established, or am I guessing? Could this spelling have another legitimate reading? If this is a person's name, am I pretending spelling determines their own reading? Does the phonetic respelling represent the same sound as the IPA? Is the IPA genuine IPA? Is this calibrated to the visitor's native language rather than just translated from an English guide? Did I invent an origin, etymology, cultural identity, or professional/status convention? Did I call a spelling trap an established common mistake without evidence? Could the audio read a different pronunciation than what I just described? If any answer reveals a problem, fix it before returning.

Never place a double-quote (") character inside any string value — it breaks the JSON. Return ONLY valid JSON matching the schema you're given, no markdown fences, no commentary.`;

// ════════════════════════════════════════════════════════════
// POST /pronounce-it-right — Main pronunciation guide
// ════════════════════════════════════════════════════════════
router.post('/pronounce-it-right', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const {
      word,            // The word/name/phrase to pronounce
      category,        // name | food | place | brand | music_art | science | phrase | other
      context,         // Optional extra context
      nativeLang,      // User's native/spoken language
      userLanguage,    // UI language for i18n
    } = req.body;

    if (!word?.trim()) {
      return res.status(400).json({ error: 'Enter a word, name, or phrase to pronounce' });
    }

    const cat = category || 'other';
    const lang = nativeLang || 'English (American)';
    const catContext = CATEGORY_CONTEXT[cat] || CATEGORY_CONTEXT.other;

    const userPrompt = `WORD/NAME/PHRASE: "${word.trim()}"
VISITOR'S NATIVE LANGUAGE: ${lang}
${context ? `SUPPLIED CONTEXT: ${context.trim()}` : 'SUPPLIED CONTEXT: none given'}

${catContext}

Calibrate every explanation (sound comparisons, mouth guide, prosody framing) to a speaker of ${lang} — never assume English as the fallback unless ${lang} IS English.

Return ONLY valid JSON in exactly this shape:

{
  "word": "${word.trim()}",
  "reading_status": "CLEAR | MULTIPLE_ESTABLISHED_READINGS | CONTEXT_DEPENDENT | PERSON_SPECIFIC | UNCERTAIN",
  "language": "The language this pronunciation belongs to, or empty string if not confidently known",

  "pronunciation": {
    "phonetic": "Simplified phonetic respelling for a ${lang} speaker, marking the stressed/prominent syllable clearly (e.g. CAPS). Empty string only if reading_status is UNCERTAIN with nothing safe to offer.",
    "ipa": "Genuine IPA notation, or empty string if you cannot produce reliable IPA",
    "syllables": ["broken", "in", "to", "parts"],
    "prosody_label": "STRESS | TONE | RHYTHM | VOWEL_LENGTH | NONE — whichever actually organizes this word's pronunciation",
    "prosody": "Explanation in those terms, calibrated to ${lang}. Empty string if prosody_label is NONE.",
    "sounds_like": "A genuine comparison to a sound a ${lang} speaker already knows, or empty string if none would help",
    "mouth_guide": "Brief articulation guidance for any sound likely to be hard for a ${lang} speaker, or empty string if nothing is tricky"
  },

  "variants": [
    {
      "label": "What makes this reading distinct (e.g. a place, a dialect, an anglicized form)",
      "phonetic": "Simplified respelling for this variant",
      "ipa": "IPA for this variant, or empty string",
      "when_used": "Where/when this variant is the appropriate one"
    }
  ],

  "watch_out_for": [
    { "trap": "A specific, real pronunciation trap this spelling invites or that is documented", "fix": "How to correct it — concrete and actionable" }
  ],

  "context_info": {
    "what_it_is": "Category-appropriate one-line description, only if useful — empty string otherwise",
    "useful_in_context": "Something practically useful for placing this word in a sentence, choosing among established variants, or asking for confirmation — empty string if nothing applies",
    "background": "Brief background ONLY if you are genuinely confident in it — empty string otherwise. Never invent an interesting-sounding origin story."
  },

  "confirmation_script": "A short, natural thing to say if unsure in the moment — empty string if not useful for this term",

  "needs_context": {
    "needed": false,
    "reason": "Plainly what makes this ambiguous, if needed is true",
    "helpful_context": "What additional information would resolve it, if needed is true"
  },

  "audio": {
    "safe_to_offer": false,
    "language_or_locale": "e.g. 'it-IT', or empty string if unknown",
    "reading_is_constrained": false
  }
}

Keep variants to 0-2 entries and watch_out_for to 0-3 entries. Every prose field should be one concise sentence except confirmation_script, which may be 1-2 short sentences. If any field quotes a phrase someone would say aloud (confirmation_script, useful_in_context, watch_out_for), use single quotes ' for it — never a double-quote (") character inside any string value, in any language. A double-quote inside a string value breaks the JSON.`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.FAST,
      max_tokens: 3500,
      system: withLanguage(SYSTEM_PROMPT, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'pronounce-it-right' });
    if (!parsed.pronunciation) {
      return res.status(500).json({ error: 'Could not analyze pronunciation. Please try again.' });
    }
    if (!READING_STATUSES.includes(parsed.reading_status)) {
      parsed.reading_status = parsed.pronunciation?.phonetic ? 'CLEAR' : 'UNCERTAIN';
    }
    res.json(parsed);

  } catch (error) {
    console.error('PronounceItRight error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /pronounce-it-right/batch — Multiple words at once.
// Batch mode is for fast pronunciation help, not eight miniature
// encyclopedia entries — no what_it_is, no fun_fact, no ipa/syllables.
// ════════════════════════════════════════════════════════════
router.post('/pronounce-it-right/batch', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { words, category, nativeLang, userLanguage } = req.body;

    if (!words?.length || words.length < 2) {
      return res.status(400).json({ error: 'Enter at least 2 words for batch mode' });
    }

    const validWords = words.filter(w => w?.trim()).slice(0, 8);
    if (validWords.length < 2) {
      return res.status(400).json({ error: 'Need at least 2 valid words' });
    }

    const lang = nativeLang || 'English (American)';
    const cat = category || 'other';

    const systemPrompt = `Fast, disciplined pronunciation guides for multiple words, calibrated to a ${lang} speaker. If a word's reading genuinely depends on context you don't have, say so (reading_status NEEDS_CONTEXT + context_needed) instead of guessing — do not invent a confident reading just because batch mode is supposed to be fast. No trivia, no fun facts, no status claims about pronunciation.`;

    const userPrompt = `WORDS: ${validWords.map(w => `"${w.trim()}"`).join(', ')}
CATEGORY: ${cat}
VISITOR'S NATIVE LANGUAGE: ${lang}

For each word, return a concise pronunciation guide. Return ONLY valid JSON:

{
  "guides": [
    {
      "word": "the word",
      "reading_status": "CLEAR | MULTIPLE | NEEDS_CONTEXT | PERSON_SPECIFIC | UNCERTAIN",
      "phonetic": "Simplified respelling for a ${lang} speaker, marking the stressed/prominent syllable. Empty string if reading_status is NEEDS_CONTEXT or UNCERTAIN with nothing safe to offer.",
      "prosody": "One short phrase on stress/tone/rhythm, whichever applies — empty string if not useful",
      "sound_note": "One genuine comparison or articulation note, or empty string if nothing helps",
      "watch_out_for": "The single most useful trap and fix, or empty string if none is well-established",
      "context_needed": "What context would resolve it, only if reading_status is NEEDS_CONTEXT or CONTEXT_DEPENDENT — empty string otherwise"
    }
  ]
}

Never place a double-quote (") character inside any string value — it breaks the JSON.`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.FAST,
      max_tokens: 3000,
      system: withLanguage(systemPrompt, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'pronounce-it-right-2' });
    if (!parsed.guides?.length) {
      return res.status(500).json({ error: 'Could not analyze pronunciation. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('PronounceItRight batch error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// Reviewed against backend/lib/outputStandard.js as part of the 2026-09-07 V2
// rewrite: the tool already leads with the answer (pronunciation before any
// background), makes progress under uncertainty instead of manufacturing
// certainty (reading_status/needs_context), respects the visitor's agency on
// a name they can't know for sure (confirmation_script instead of asserting),
// and is instructed to give the smallest complete guide rather than pad every
// field. Declaring v2 for both endpoints in this file.
router.outputStandard = 'v2';

module.exports = router;
