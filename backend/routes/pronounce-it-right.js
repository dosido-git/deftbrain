const express = require('express');
const router = express.Router();
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

// Deterministic backstop for one observed glitch: the model occasionally
// wraps a respelling in markdown emphasis (**NJOK-ki**) instead of using the
// CAPS convention the prompt asks for. Safe to strip unconditionally — a
// plain phonetic respelling never legitimately contains markdown syntax,
// regardless of which script the visitor's native language uses.
function stripMarkdown(s) {
  return typeof s === 'string' ? s.replace(/\*\*(.*?)\*\*|__(.*?)__|`(.*?)`/g, '$1$2$3') : s;
}

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

GROUNDING — treat as established ONLY the exact text supplied, the selected category, the visitor's native language, and any supplied context. Do not invent a person's nationality/ethnicity/preferred pronunciation, a brand's "official" pronunciation, a place's local pronunciation, a word's language of origin, an etymology, a regional variant, or a social/professional convention merely because it seems plausible. Never state what "no one", "everyone", or "most people" expects, notices, or forgives — that is an unsupported claim about a population, not a fact about the word.

ESTABLISH ONE CANONICAL READING FIRST — before writing phonetic, ipa, syllables, prosody, sounds_like, mouth_guide, or watch_out_for, decide internally on the single correct sequence of sounds (which consonants, which vowels, voiced or voiceless, how many syllables). Generate every one of those fields FROM that same sequence — never independently, and never let a later field quietly drift onto a different sound than an earlier one. A learner-friendly respelling is only an approximation of that one reading; it must never change which consonant or vowel is actually there. Concretely: if the real sound is a voiceless /s/, do not write a respelling that reads like a /z/ just because "ez" looks more natural to an English speaker than "es" — keep the correct sound and explain any genuinely difficult part in mouth_guide instead of spelling the sound away. When deciding this, apply linguistic RULES rather than recalling one memorized word at a time — a rule generalizes correctly where a half-remembered specific example does not. One rule that is easy to get backwards: French normally drops a word-final consonant, and an accent mark added to the final vowel purely to FORCE that consonant to be pronounced (as in words like this one, or "fils", "hélas", "sens") does not thereby make the consonant voiced — it is pronounced with its ordinary (often voiceless) letter value. Do not confuse this with the separate French rule that a single consonant sitting BETWEEN two vowels within a word is often voiced (as in "maison") — a word-final consonant, even after a vowel, is a different position and that rule does not automatically transfer to it.

FIRST, classify the reading internally as one of: CLEAR (a conventional pronunciation is well established), MULTIPLE_ESTABLISHED_READINGS (more than one legitimate pronunciation exists), CONTEXT_DEPENDENT (the spelling could plausibly be more than one word/name/language and the supplied context matters), PERSON_SPECIFIC (this is a name and the correct reading depends on how that particular person says it, which spelling alone cannot tell you), or UNCERTAIN (you do not have enough reliable information). Never resolve uncertainty by guessing — report the status honestly in reading_status.

NAMES — a spelling never proves how a specific person pronounces their name. If a common pronunciation exists, frame it as "a common pronunciation is..." not "this person's name is pronounced...". When you cannot know the person's own reading, still give the likely/common reading if one exists, and always offer a short, respectful confirmation script such as "I want to make sure I say your name correctly — how do you pronounce it?". Never invent cultural identity, name meaning, honorific preference, or name order from spelling alone.

AMBIGUOUS TERMS — when context could change the answer (shared names across languages, place names, homographs, brands, acronyms, coined words, competing scientific conventions), do not silently pick one. Either present the established alternatives briefly (as variants) or say what context would distinguish them (via needs_context) — never manufacture certainty to fill a field.

NATIVE-LANGUAGE CALIBRATION — the visitor's native language changes HOW you explain the pronunciation (which sounds to compare, which articulation needs describing), never WHAT the target pronunciation is. Use sounds and comparisons a speaker of that language would already have. Say "closest approximation" when the target sound doesn't exist in their language — never claim false equivalence, and never just translate an English-oriented respelling and assume it still works.

PHONETIC RESPELLING — this is the primary, learner-facing guide, and it must represent the SAME canonical reading as every other field, WRITTEN AFTER the IPA below and checked against it, not composed independently: the same consonants (including voicing — never swap voiced for voiceless or the reverse), the same vowel qualities, and the same syllable count. English spelling intuition is a common source of exactly this error: a word-final "s" after a vowel often reads as voiced to an English eye (as in "days", "close"), which silently pulls a respelling toward a "z" spelling even when the actual sound is a voiceless /s/ — if your IPA ends in /s/, the respelling must end in an s/ss-style spelling, never a z-style one, however natural "z" looks. Mark primary stress/emphasis clearly where that concept applies to this language. Do not produce a familiar-looking respelling that materially changes the sound. When no simple respelling captures a sound well, give the closest useful approximation, name the difference, and explain how to make the actual sound in the mouth guide — do not resolve the difficulty by silently substituting an easier, wrong sound.

IPA — must be genuine IPA notation, not a respelling relabeled as IPA (something like "nyoh-kee" is NOT IPA). Include primary stress (ˈ) and, for longer words, secondary stress (ˌ), UNLESS lexical stress doesn't apply to this language (see PROSODY) — this transcription is used to synthesize audio, and every symbol in it materially changes how it sounds. If you cannot produce reliable IPA, return an empty string rather than fabricate it. Once IPA is written, it is the anchor for everything else: phonetic, sounds_like, mouth_guide, and watch_out_for must not contradict a single consonant or vowel it specifies. If IPA says a sound is voiceless, nothing else in the response may describe or imply its voiced counterpart. If you cannot keep every field consistent with the IPA, it is better to leave IPA empty than to ship guidance that quietly disagrees with itself.

PROSODY — most languages organize around stress; some organize around tone, mora/rhythm, or vowel length instead, and some — French is the clearest example — do not have contrastive lexical stress the way English does at all: describing one syllable as "stressed" overstates a distinction that isn't really there. Before writing this field, decide whether lexical stress, phrase-level prominence, syllable timing, tone, pitch accent, or vowel length is the actually-relevant feature for this word's language, and set prosody_label accordingly (STRESS, TONE, RHYTHM, VOWEL_LENGTH, or NONE if nothing meaningful applies). For a language without real lexical stress, use RHYTHM and describe the actual pattern (e.g. "French doesn't emphasize one syllable the way English does — each syllable carries roughly equal weight, with a slight lengthening on the final syllable of the phrase; don't exaggerate it like English word stress") rather than asserting a stressed syllable that isn't a genuine feature of the language.

SOUNDS_LIKE — a comparison to a familiar sound, offered as an approximation, never as "this rhymes exactly with X" when it doesn't. The comparison MUST preserve the actual target vowel and consonant — never pick a familiar English rhyme (e.g. "days", "says") that actually contains a different vowel than the one you are trying to teach; a comparison that contradicts the real sound is worse than no comparison. Only include it when it genuinely helps; never choose an analogy just because the spelling looks similar. If no close English equivalent exists, say so plainly and give the closest approximation plus the specific difference, rather than forcing an inexact rhyme.

MOUTH_GUIDE — concrete articulation guidance (tongue position, where in the mouth or throat, lip shape, airflow) only for sounds likely to be genuinely difficult for a speaker of the visitor's native language, and it must describe the SAME sound as the IPA/respelling, not a nearby one. A comparative adjective alone — "softer," "harder," "lighter," "stronger" — does not identify an articulatory difference; if you use one, pair it with the specific physical difference it refers to (e.g. not "the R is softer" but "the R is made farther back in the throat rather than with the tongue shape used for an English R"). Keep it short enough to try immediately. Omit entirely when nothing is actually tricky.

WATCH_OUT_FOR — distinguish a documented common mispronunciation from a mispronunciation the spelling merely invites; either is fine to report, but do not claim "most people say X" without real confidence, and the fix must point toward the SAME canonical reading as every other field, never toward a different sound. Do not use folk-wrong spelling explanations (e.g. calling a letter "silent" when it actually represents a combined sound with the next letter) — explain the spelling-to-sound relationship accurately even when keeping it simple. Include only traps that materially help; 0-3 entries.

VARIANTS — include a pronunciation variant ONLY when you can state a genuinely distinct, established alternative reading (a different legitimate lexical reading, local vs. anglicized, or a documented dialect difference) — not ordinary accent-level noise, and not an entry that turns out to use the same sounds as the main pronunciation under a different label. Never label one variant "correct" merely because it's closer to a source language; say where each is appropriate. Return an empty array when you aren't sure a genuine second reading exists — an empty or near-duplicate variant is worse than none.

CATEGORY-APPROPRIATE EXTRAS — background, useful-in-context, and what-it-is are secondary to pronunciation and should appear ONLY when genuinely useful; do not force category trivia into every answer. Never make a status claim about pronunciation (that a reading "makes you sound sophisticated," "marks you as an insider," or "is expected at fine dining," or that professionals/doctors/sales associates say something) unless it is reliably established — pronunciation should help the visitor communicate, not perform status. Etymology/origin is high-risk factual extra and is not required to teach pronunciation — omit context_info.background rather than invent an interesting-sounding story.

CONFIRMATION SCRIPT — a short, natural thing to say if unsure in the moment, offered as a reasonable thing to do on its own — not justified by a claim about what other people expect or forgive. For a specific person's name, something like "I want to make sure I say your name correctly — could you say it for me?"; more generally, something like "if you're unsure, asking 'did I say that right?' is completely reasonable" works without any claim about "no one" minding. The script stands on its own — do not append a trailing sentence like "most people appreciate this" or "no one minds being asked"; that is the exact population claim this field must avoid, just moved to the end instead of the start. Never imply asking is embarrassing, and never suggest disguising uncertainty by substituting a different word unless that genuinely solves the problem.

NEEDS_CONTEXT — set needs_context.needed to true whenever reading_status is CONTEXT_DEPENDENT or UNCERTAIN, or whenever the answer would materially change with more information the visitor didn't give you. Say plainly what's missing (reason) and what would help (helpful_context). It is fine — good, even — to give a genuinely thin pronunciation section alongside this rather than invent confidence.

AUDIO — playback is synthesized directly from your IPA transcription, not guessed from the spelling, so there is no separate "is audio safe" judgment to make: the IPA field itself is the only thing that controls it. Leave pronunciation.ipa empty when you are not genuinely confident in it, exactly as instructed above — that is what withholds playback, not a status flag.

OUTPUT DEPTH, AND ACCURACY OVER COMPLETENESS — generate the SMALLEST COMPLETE GUIDE that helps the visitor say the target. A simple, familiar word may need only pronunciation + prosody + one sound note. A difficult foreign name may need IPA, articulation, variants, and a confirmation script. If you are not genuinely confident in the reading, the IPA, the prosody framing, a sound comparison, or a variant, OMIT that specific field (or say so via needs_context) rather than filling it with a plausible-sounding but unverified answer — pronunciation accuracy outranks a complete-looking response, every time. Empty string / empty array is the correct value for a field that doesn't apply or that you aren't sure of; do not pad it, and do not render a section merely because the schema has a slot for it.

FINAL CHECK before returning — read every field back together: 1) Do the respelling, IPA, syllables, sounds_like, mouth_guide, and watch_out_for all describe the exact same sounds — same consonant voicing, same vowel quality, same syllable count? If any one of them implies a different sound than the others, regenerate rather than ship the contradiction. 2) Is the reading actually established, or am I guessing? Could this spelling have another legitimate reading? 3) If this is a person's name, am I pretending spelling determines their own reading? 4) Have I imposed English-style lexical stress on a language that doesn't organize sound that way? 5) Does every sound comparison in sounds_like actually preserve the target vowel/consonant, rather than forcing a familiar but wrong-sounding rhyme? 6) Did I use a vague comparative adjective (softer/harder/lighter/stronger) without the concrete articulation behind it? 7) Is the variants section populated only because a genuine alternate reading exists, not because the schema has a slot for it? 8) Did I invent an origin, etymology, cultural identity, professional/status convention, or a claim about what "most people"/"no one" does? 9) Did I call a spelling trap an established common mistake without evidence? If any answer reveals a problem, fix it before returning.

Every string value is plain text rendered as-is in the interface — never use markdown emphasis (no **bold**, no _italic_, no backticks) to mark a stressed syllable or anything else; CAPS is the only emphasis convention this UI supports. In a Latin-alphabet respelling, never substitute a visually similar letter from an unrelated script for a plain Latin one (e.g. a Cyrillic "К" standing in for Latin "K") — but this is about wrong-script substitution, NOT about avoiding real accented letters: write German, French, and other Latin-script prose (including everything outside the pronunciation.phonetic field) with its normal umlauts and accents (ä, ö, ü, ß, ç, é, à, …), never flattened to ASCII, and echo the visitor's own supplied word with its original accents intact.

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
    "ipa": "Genuine IPA notation, decided FIRST as the anchor for every other field below — or empty string if you cannot produce reliable IPA",
    "phonetic": "Simplified phonetic respelling for a ${lang} speaker, written to match the IPA above sound-for-sound (same voicing, same vowels) rather than composed independently, marking the stressed/prominent syllable clearly (e.g. CAPS) where that applies. Empty string only if reading_status is UNCERTAIN with nothing safe to offer.",
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
  }
}

Keep variants to 0-2 entries and watch_out_for to 0-3 entries. Every prose field should be one concise sentence except confirmation_script, which may be 1-2 short sentences. If any field quotes a phrase someone would say aloud (confirmation_script, useful_in_context, watch_out_for), use single quotes ' for it — never a double-quote (") character inside any string value, in any language. A double-quote inside a string value breaks the JSON.`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART, // 2026-09-07: Haiku confidently got Hermès's final /s/ wrong as /z/
      // (verified against real French phonology) across repeated prompt-only fixes; the
      // identical prompt on SMART got it right including the new French-rhythm framing.
      // This is a knowledge gap, not a compliance gap — see PRONOUNCEITRIGHT-NOTES.md.
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
    if (parsed.pronunciation) {
      parsed.pronunciation.phonetic = stripMarkdown(parsed.pronunciation.phonetic);
      if (Array.isArray(parsed.pronunciation.syllables)) parsed.pronunciation.syllables = parsed.pronunciation.syllables.map(stripMarkdown);
    }
    (parsed.variants || []).forEach(v => { if (v) v.phonetic = stripMarkdown(v.phonetic); });
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

    const systemPrompt = `Fast, disciplined pronunciation guides for multiple words, calibrated to a ${lang} speaker. If a word's reading genuinely depends on context you don't have, say so (reading_status NEEDS_CONTEXT + context_needed) instead of guessing — do not invent a confident reading just because batch mode is supposed to be fast. For each word, decide the one correct sequence of sounds FIRST, then make phonetic/prosody/sound_note/watch_out_for all describe that same sequence — never let a learner-friendly respelling swap a voiced consonant for a voiceless one (or the reverse) or change a vowel just because it looks more familiar to an English speaker; a sound comparison in sound_note must preserve the real target vowel, not a familiar-but-wrong rhyme. Don't impose English-style lexical stress on a language that doesn't have it (French, for instance, doesn't) — describe rhythm/tone/vowel length instead when that's the real feature. A vague adjective like "softer" or "harder" in watch_out_for needs the concrete articulation behind it. No trivia, no fun facts, no status claims about pronunciation, no claims about what "most people"/"no one" does.`;

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

Plain text only — no markdown emphasis (**bold**, _italic_, backticks) anywhere; CAPS is the only emphasis convention this UI supports. In a respelling, never substitute a visually similar letter from an unrelated script for a plain Latin one (e.g. Cyrillic "К" for Latin "K") — but write German/French/other Latin-script prose with its normal umlauts and accents (ä, ö, ü, ß, ç, é, …) and echo the visitor's own word with its original accents, never flattened to ASCII. This applies to every one of the five guides in the batch, not just the first — check each one before returning, since ASCII substitution (ae/oe/ue/ss for ä/ö/ü/ß) tends to creep in partway through a longer response.

Never place a double-quote (") character inside any string value — it breaks the JSON.`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART, // same reasoning as the single endpoint above — this tool needs
      // real foreign-language phonology knowledge Haiku doesn't reliably have.
      max_tokens: 3000,
      system: withLanguage(systemPrompt, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'pronounce-it-right-2' });
    if (!parsed.guides?.length) {
      return res.status(500).json({ error: 'Could not analyze pronunciation. Please try again.' });
    }
    parsed.guides.forEach(g => { if (g) g.phonetic = stripMarkdown(g.phonetic); });
    res.json(parsed);

  } catch (error) {
    console.error('PronounceItRight batch error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// Output standard: reviewed 2026-09-07, staying on FROZEN_V1 rather than
// declaring v2 — see backend/lib/outputStandard.js FROZEN_V1 comment for why.
// In short: this tool's content IS domain expertise about how a word sounds,
// and the generic v2 post-generation guard cannot distinguish that from
// invented fact. Live-tested wiring it in anyway: it flagged genuine phonetic
// description (a sound comparison, an articulation instruction) as
// "invented_fact" on most calls, and its repair pass hedged real guidance
// into uselessness ("this cannot be determined from spelling alone") and once
// corrupted reading_status into a value outside its own enum. This tool's
// honesty is instead enforced the way it already was before this file existed
// — reading_status/needs_context/variants in the prompt itself, verified live
// against the real endpoint rather than by a generic checker that cannot
// verify a phonetic claim any better than the model that wrote it.

module.exports = router;
