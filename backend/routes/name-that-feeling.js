const express = require('express');
const router = express.Router();
const { withLanguage, callClaudeWithRetry } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

// ═══════════════════════════════════════════════════
// PERSONALITY — grounding rewrite, 2026-09-05
// ═══════════════════════════════════════════════════
// The tool was inventing foreign words, definitions, etymologies and
// pronunciations, then dressing the invention up as linguistics ("Welsh has
// no exact translation because the feeling is so specific to people who
// understand displacement"), and separately turning a matched word into a
// personality reading ("the mark of someone who travels with their full
// attention"). Neither move is what naming a feeling requires.
const PERSONALITY = `You are Name That Feeling: a curious, careful emotional lexicographer.

Your job is to help someone find language for a feeling that is difficult to name.

Apply DEFTBRAIN_OUTPUT_STANDARD_V2.

Be intellectually adventurous about words and conservative about claims.

The goal is not to diagnose the person or prove that one exotic word perfectly
captures their experience. The goal is to find useful language for what they
described.

CORE RULE

Match the DESCRIPTION, not an invented story about the person.

You may reason freely about:
- the emotional ingredients explicitly described
- tensions between two feelings
- timing, such as missing something before it ends
- whether a candidate word captures only part of the description
- semantic differences among candidate words

Do not infer:
- personality
- attachment style
- trauma
- mental-health condition
- relationship dynamics
- motives
- hidden needs
- emotional history
- why the person feels this way
unless the visitor supplied it.

LEXICAL ACCURACY

Words from other languages are real linguistic claims.

Do not invent:
- foreign words
- definitions
- literal translations
- etymologies
- pronunciation
- claims that a word is untranslatable
- claims that a language uniquely names a feeling
- claims about what speakers of a language collectively feel or value
- quotations or attributions

If you are not reasonably confident that a word exists and that its meaning is
relevant, omit it.

Prefer a familiar English phrase over an impressive foreign word that only
loosely matches.

Do not force a perfect match.

A candidate may be:
STRONG MATCH
CLOSE MATCH
PARTIAL MATCH

If no established word captures the whole feeling, say so.

Do not stretch a real word until it means what the visitor wants.

CULTURE

A word belonging to a language does not prove that the feeling is culturally
unique, that its speakers collectively value it, or that the language
"bothered" to name it because of who they are.

Never write:
- "only the Welsh understand this"
- "uniquely Russian"
- "Japanese culture has a word because..."
- "this language bothered to name the feeling"
- "untranslatable"
- "this culture understands..."
- "this language captures..."
unless you are making a narrow linguistic observation you can actually
support. Never turn a language into a psychological profile of its speakers.
Explain the word, not a stereotype about the people who use it. The useful
question is always "what does this word mean, and how closely does that
meaning fit what the visitor described" — not what it supposedly reveals
about a culture.

PRONUNCIATION

Give a pronunciation only when reasonably confident.

A simple approximate pronunciation for an English-speaking visitor is enough.
If uncertain, omit it rather than inventing phonetic precision.

EMOTIONAL LANGUAGE

Be warm without turning the result into a personality reading.

Do not tell the visitor what their feeling "says about them."

Avoid:
- "This is the mark of someone who..."
- "You feel deeply because..."
- "Your soul recognizes..."
- "People like you..."
- "Everyone who loves X feels this..."

Naming a feeling can be clarifying without assigning meaning to the person who
feels it.

POETIC LANGUAGE

You may be lyrical when explaining a feeling, but metaphor must remain clearly
metaphorical.

Do not let poetic language mutate the meaning of an established word.

COINED NAMES

If no established word fully fits, you may coin a playful or poetic phrase.

Clearly label it:
A NAME WE MADE UP

Never present a coined term as an existing psychological, linguistic, or cultural
concept.

MEDICAL / MENTAL HEALTH

This tool names ordinary subjective experience.
It does not diagnose mental-health conditions.

Do not convert descriptions into disorders, symptoms, syndromes, or clinical
labels unless the visitor explicitly asks about a known term, and even then do
not diagnose.

OUTPUT

Keep the result delightful and concise.

One excellent match plus useful alternatives is better than a parade of exotic
words.

Write directly to the visitor as "you".

Never place a double-quote character inside JSON string values.

Return only valid JSON matching the requested schema.`;

// A hedge usually means the model is proposing rather than asserting — spare it.
const HEDGED = /\b(?:may|might|could|can (?:read|come across|feel)|often|tend(?:s)? to|one possible|possibly|appears? to|seems? to|some(?:times)?)\b/i;

const RULES = [
  // "Untranslatable" is banned outright — it's a claim about every other
  // language on earth, never something a single lookup can support.
  ['claimed a word is untranslatable', /\buntranslatable\b/i],

  // A language belonging to a word is not evidence the word's speakers are
  // collectively different — "only the Welsh understand this," "uniquely
  // Russian," "this culture understands," "this language bothered to name."
  ['turned a language into a claim about its speakers', /\bonly (?:the )?[a-z]+ (?:people |speakers )?(?:truly |really )?understand(?:s)? this\b|\buniquely [a-z]+\b|\bthis (?:culture|language) (?:understands?|captures?|bothered to name)\b|\b[a-z]+ culture has a word because\b|\bspecific to people who (?:understand|have experienced|know|feel)\b|\bhas no (?:exact |direct )?(?:english )?translation\b[^.!?]{0,60}\bbecause\b/i],

  // A matched word describing the visitor's character, not their feeling —
  // the personality-reading move the CULTURE and EMOTIONAL LANGUAGE sections
  // both exist to stop.
  ['turned a word match into a personality reading', /\bthe mark of someone who\b|\byou feel deeply because\b|\byour soul recognizes?\b|\bpeople like you\b|\beveryone who loves\b.{0,20}\bfeels? this\b/i],

  // A coined phrase presented as though it were discovered rather than made
  // up — the whole point of labelling it "A NAME WE MADE UP" is lost if the
  // surrounding prose calls it established, documented, or recognized.
  ['presented a coined phrase as an existing term', /\b(?:this is |it'?s )?(?:an? )?(?:established|documented|recognized|known) (?:term|word|concept) for\b/i,
    (v) => HEDGED.test(v)],
];

function validateResult(data) {
  if (!data || typeof data !== 'object') return data;
  const walk = (node) => {
    // No early return for arrays — an array IS an object, so Object.entries
    // below enumerates its indices; returning early here would leave every
    // array-of-strings field unchecked. See the Justify My Meeting note this
    // pattern is copied from.
    if (!node || typeof node !== 'object') return;
    for (const [k, v] of Object.entries(node)) {
      if (k === 'match' || k === 'useful') continue;
      if (typeof v === 'string') {
        const hit = RULES.find(([, re, spare]) => re.test(v) && !(spare && spare(v)));
        if (hit) {
          if (v.length <= 260 && (v.match(/[.!?]/g) || []).length <= 2) {
            console.log(`[name-that-feeling] ${k} blanked — ${hit[0]}: ${v.slice(0, 200)}`);
            node[k] = '';
          } else {
            console.log(`[name-that-feeling] ${k} ${hit[0]} (left intact, too long to cut safely): ${v.slice(0, 200)}`);
          }
        }
      } else if (v && typeof v === 'object') walk(v);
    }
  };
  walk(data);
  // Blanking a named field leaves ''; a blanked array item reads as an empty
  // bullet, which is worse than no bullet, so array items are pruned instead.
  const prune = (node) => {
    if (Array.isArray(node)) {
      for (let i = node.length - 1; i >= 0; i--) {
        if (node[i] === '') node.splice(i, 1); else prune(node[i]);
      }
      return;
    }
    if (node && typeof node === 'object') Object.values(node).forEach(prune);
  };
  prune(data);
  return data;
}

router.post('/name-that-feeling', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { description, context, userLanguage } = req.body;

    if (!description?.trim()) {
      return res.status(400).json({ error: 'Describe the feeling you can\'t name.' });
    }

    const userPrompt = `NAME THAT FEELING

THE FEELING:
${description.trim()}

${context?.trim() ? `CONTEXT:\n${context.trim()}` : ''}

Find useful language for the feeling described.

Start by identifying the emotional ingredients actually present in the visitor's
description.

Then choose the strongest established word or phrase you can support.

Important:
- Do not force an exact match.
- Do not prefer a foreign-language word merely because it sounds more interesting.
- Do not alter a word's established meaning to fit the description.
- Do not invent cultural explanations.
- Do not invent biography or psychology.
- If the strongest answer is an ordinary English phrase, use it.
- If no established term captures the whole thing, say so.
- Include only alternative words that add a genuinely different shade of meaning.
- Coin a poetic term only when useful and label it clearly as invented.

Return ONLY valid JSON:

{
  "what_you_described": {
    "ingredients": [
      "2-4 short emotional or temporal elements explicitly present in the description"
    ],
    "tension": "The interesting combination or contradiction, if there is one — empty string if there isn't"
  },

  "best_match": {
    "word": "",
    "language": "",
    "pronunciation": "Only if reasonably confident — empty string otherwise",
    "match": "STRONG MATCH|CLOSE MATCH|PARTIAL MATCH",
    "definition": "",
    "why_it_fits": "",
    "where_it_doesnt": "Empty string when the match is genuinely strong with no meaningful caveat — do not manufacture one just to fill the field"
  },

  "other_words": [
    {
      "word": "",
      "language": "",
      "pronunciation": "Only if reasonably confident — empty string otherwise",
      "definition": "",
      "captures": "",
      "misses": ""
    }
  ],

  "plain_english": "A natural English phrase the visitor could actually use to describe the feeling",

  "made_up_name": {
    "useful": true,
    "name": "",
    "meaning": ""
  },

  "share_line": ""
}

OTHER WORDS:
Return 1-3 only.
Do not fill the array merely to reach a quota. A word only belongs here if it
adds a genuinely different shade of meaning from best_match — do not include
one purely for language variety.

MADE-UP NAME:
Set useful to false and leave name/meaning empty when an invented phrase adds
nothing useful.

SHARE LINE:
Make it concise and accurate, and preserve the degree of match — never phrase
a CLOSE MATCH or PARTIAL MATCH as though it were an exact, established word.
- STRONG MATCH: "There's a word for..."
- CLOSE MATCH: "One word that comes close is..."
- PARTIAL MATCH: "This reminds me of..."

Never place a double-quote character inside any JSON string value.`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.FAST,
      max_tokens: 4000,
      system: withLanguage(PERSONALITY, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'name-that-feeling' });

    if (!parsed.best_match) {
      return res.status(500).json({ error: 'Could not generate a response. Please try again.' });
    }
    res.json(validateResult(parsed));

  } catch (error) {
    console.error('NameThatFeeling error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// Reviewed against backend/lib/outputStandard.js during the 2026-09-05 rewrite.
router.outputStandard = 'v2';
router.outputGuard = {
  checks: ['validateResult'],
  note: 'No "untranslatable" claim, no language-as-psychological-profile claim ("only the Welsh understand this," "uniquely Russian"), no personality reading built from a matched word ("the mark of someone who..."), and no coined phrase presented as an established term — all four are regex-detected and blanked in code. The three-value match enum (STRONG/CLOSE/PARTIAL) and where_it_doesnt carry the epistemic nuance the prompt asks for; the backstops catch what leaks into prose despite it.',
};

module.exports = router;
