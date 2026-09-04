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

NAME THAT FEELING — DON'T RESOLVE THE AMBIGUITY FOR THEM

When the visitor says they do not know what part of a feeling means, preserve
that uncertainty.

Do not decide that the feeling was:
- envy
- not envy
- comparison
- personal lack
- resentment
- guilt
- insecurity
- disappointment
- fear
- grief

unless the visitor established it.

GOOD:
"You described an immediate drop or pang, followed by happiness for your friend."

GOOD:
"The first feeling could involve comparison, disappointment, longing, or
something else; the description doesn't establish which."

BAD:
"It wasn't envy."
"It was a flash of your own lack."
"You knew they deserved it."
"Your authentic joy took over."

The tool's job is to give the visitor language that helps them examine the
feeling, not secretly finish the emotional story for them.

If the visitor names a specific word themselves and says it isn't quite
right, do not make that same word — or a close synonym that carries the same
baggage — the primary match anyway. Their own doubt about it is information,
not an obstacle to route around. Prefer a word that doesn't carry the
specific element they already flagged as wrong, or say plainly that nothing
established avoids it.

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
NO ADEQUATE MATCH

STRONG MATCH, CLOSE MATCH, and PARTIAL MATCH all require a real, existing
word or phrase — one you could point to a language and a definition for. If
you are describing the gap rather than naming something that exists (a
phrase like "the pause before speaking up" that nobody actually uses this
way), that is not a candidate at any match strength — it is NO ADEQUATE
MATCH, and belongs in best_match only with language and definition left
empty, or better, in made_up_name where invention is expected and labeled.

If no established word captures the whole feeling, say so — use NO ADEQUATE
MATCH rather than stretching a candidate to fit, and rather than dressing an
invented phrase up as though it were a findable one.

Do not stretch a real word until it means what the visitor wants.

NAME THAT FEELING — PRIMARY MATCH RULE

Do not promote a candidate to the primary answer merely because one secondary
or archaic sense overlaps with part of the visitor's description.

The primary word must fit the CENTRAL MEANING of the described feeling, not
merely one sensation, component, metaphor, or obscure dictionary sense.

Before selecting the primary word, ask:

1. What does this word ordinarily mean in contemporary use?
2. Does that ordinary meaning fit the visitor's experience?
3. Does the word introduce an important element the visitor did not supply?
4. Am I choosing it because it genuinely fits, or because it is interesting?

If the word introduces a major semantic element that is absent from the
description — guilt, wrongdoing, resentment, grief, envy, fear, shame, etc. —
it cannot be a STRONG or CLOSE primary match merely because another sense
overlaps.

Prefer:

NO EXACT WORD

over an impressive but semantically strained answer.

A familiar phrase that accurately describes the experience is better than an
unusual word that requires explaining why its normal meaning does not apply.

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

NAME THAT FEELING — FINAL GROUNDING PASS

When explaining why a word fits, distinguish carefully between:

1. WHAT THE VISITOR ACTUALLY DESCRIBED
2. WHAT THE WORD MEANS
3. YOUR INTERPRETATION

You may paraphrase and synthesize the visitor's description, but do not add
new emotional facts merely because they would make the explanation more
poetic, psychologically satisfying, or complete.

In particular, do not introduce:
- motives
- wishes
- regrets
- gratitude
- grief
- intensity
- imagined alternatives
- significance of a place or relationship
- what the visitor wants to happen
- why the visitor feels something

unless established by the visitor.

A beautiful sentence is not better if it requires inventing part of the
experience.

BAD:
"The feeling intensifies when the place felt like it could have been home."

Nothing supplied establishes that.

BAD:
"You are simultaneously present in something and already grieving its loss."

The visitor said sad and nostalgic. "Grieving its loss" strengthens that
into a different emotional claim.

BAD:
"You are wishing time would slow down."

The visitor did not say this.

BAD:
"the happiness and gratitude that are equally present"

The visitor said happy they went. Do not silently convert that into
gratitude or claim equal emotional weight.

GOOD:
"You are happy you had the experience, sad that it is ending, and already
nostalgic for it before it is over."

GOOD:
"That combination is why 'bittersweet' fits so well."

GOOD:
"'Wistful' captures some of the longing and sadness, but it does not by
itself capture the happiness you also described."

RULE:
Transform supplied emotional facts intelligently.
Do not intensify, explain, complete, or beautify them by adding new ones.

Before returning each visitor-specific sentence, ask:

"Could I point to something the visitor actually said that supports every
claim in this sentence?"

If not:
- remove the unsupported claim,
- make it explicitly conditional,
- or describe the WORD rather than the VISITOR.

NAME THE SHAPE. DON'T INVENT THE STORY.

OUTPUT

Keep the result delightful and concise.

One excellent match plus useful alternatives is better than a parade of exotic
words.

Write directly to the visitor as "you".

Never place a double-quote character inside JSON string values.

Return only valid JSON matching the requested schema.`;

// A hedge usually means the model is proposing rather than asserting — spare it.
const HEDGED = /\b(?:may|might|could|can (?:read|come across|feel)|often|tend(?:s)? to|one possible|possibly|appears? to|seems? to|some(?:times)?|whether|does(?:n'?t)? (?:establish|say)|doesn'?t settle|not (?:sure|clear) (?:if|whether))\b/i;

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

  // A named ambiguity the visitor flagged as unclear ("I don't know if this
  // was envy or something else"), flattened into a settled fact — the exact
  // failure the DON'T RESOLVE THE AMBIGUITY FOR THEM section exists to stop.
  // Live probe: "It wasn't envy." Hedge-spared because "it may not have been
  // envy" is a legitimate, cautious reading of the same material.
  ['resolved a named emotional ambiguity into a flat fact',
    /\bit (?:was|wasn'?t|is|isn'?t)\s+(?:envy|jealousy|comparison|resentment|guilt|insecurity|disappointment|fear|grief|shame)\b/i,
    (v) => HEDGED.test(v)],

  // An epistemic state attributed to the visitor (or someone in their story)
  // that nobody reported having — "you knew they deserved it" invents
  // certainty, not just a feeling. Live probe: same sentence, verbatim.
  ['invented a certainty nobody reported having',
    /\byou knew\b.{0,30}\bdeserved?\b|\bthey knew\b.{0,30}\bdeserved?\b|\bhe knew\b.{0,30}\bdeserved?\b|\bshe knew\b.{0,30}\bdeserved?\b/i],
];

const MATCH_VALUES = ['STRONG MATCH', 'CLOSE MATCH', 'PARTIAL MATCH', 'NO ADEQUATE MATCH'];
// withLanguage translates JSON string VALUES for a non-English generation —
// the frontend switches on this exact enum (badge color, the new dynamic
// hero heading), so an untranslated pin is required the same way NameAudit
// pins verdict/rating. Live-tested across es/de/ja before this existed and
// the model happened to leave it in English every time — "happened to" is
// not a guarantee, and this now adds a fourth value worth guaranteeing too.
function pinMatch(data) {
  const m = data?.best_match?.match;
  if (!MATCH_VALUES.includes(m)) {
    if (data?.best_match) data.best_match.match = 'PARTIAL MATCH';
  }
  return data;
}

// Even with the prompt now explicit that a non-candidate word must be left
// empty, live probes kept filling it with a restatement of the gap instead
// of a real word — sometimes under NO ADEQUATE MATCH ("No established
// single word," "the discomfort of a no-win moment"), sometimes under CLOSE
// MATCH with the same shape ("homesickness for a place that exists only in
// memory," 9 words, empty language). Prompt tightening reduced but didn't
// reliably stop either. A real word or established phrase is short — long
// enough to catch "end-of-vacation blues" (3 words, legitimate) but not a
// 9-word descriptive clause — so this checks EVERY match tier, not just
// NO ADEQUATE MATCH: whatever tier the model chose, a restatement isn't a
// candidate at any tier, and gets downgraded along with it.
const NO_MATCH_META_RE = /^(?:no |not (?:one|a|really)\b|there(?:'s| is)?\s*(?:really\s*)?no\b|nothing\s)/i;
function cleanNoMatchWord(data) {
  const bm = data?.best_match;
  if (!bm || !bm.word) return data;
  const wordCount = bm.word.trim().split(/\s+/).length;
  if (NO_MATCH_META_RE.test(bm.word) || wordCount > 5) {
    console.log(`[name-that-feeling] best_match.word cleared (match was ${bm.match}) — not a candidate: ${bm.word}`);
    bm.match = 'NO ADEQUATE MATCH';
    bm.word = '';
    bm.language = '';
    bm.pronunciation = '';
    bm.definition = '';
  }
  return data;
}

// A very specific, twice-confirmed leak: the model reaches for "grief" or
// "gratitude" to make an explanation feel more complete or poetic, even when
// the visitor never used either word — the exact FINAL GROUNDING PASS bug
// report examples ("already grieving its loss," "happiness and gratitude
// that are equally present"), and a live re-test after that rule shipped
// reproduced both again verbatim. Unlike the RULES array above, this needs
// the visitor's own supplied text to judge correctness — "grief" is a
// legitimate reflection if the VISITOR wrote it, invented if they didn't.
//
// A field-wide check (any occurrence of the word anywhere in the field) was
// tried first and had to be narrowed: a live probe produced "Saudade
// carries primarily grief and melancholy" inside other_words[].misses — an
// accurate lexical fact about the WORD's own connotation (exactly the
// prompt's own "describe the WORD rather than the VISITOR" escape valve),
// which the field-wide version would have blanked, destroying good content
// to prevent a bad pattern. Narrowed to require the emotion word within 40
// characters of a "you"/"your" reference in either direction — close enough
// to catch "the happiness and gratitude that YOU also described" but not
// "Saudade carries grief... [different sentence] ...YOU described" where
// the two are unrelated. Trade-off accepted: a same-field-but-distant case
// like "...before YOU have even left... It names... already grieving
// something..." (two sentences apart) is missed by this narrower version —
// left to the prompt rule alone, same as the rest of FINAL GROUNDING PASS.
const EMOTION_WORD_NEAR_YOU = [
  ['gratitude', /\byou(?:r)?\b.{0,40}\b(?:gratitude|grateful)\b|\b(?:gratitude|grateful)\b.{0,40}\byou(?:r)?\b/i],
  ['grief', /\byou(?:r)?\b.{0,40}\b(?:griev(?:e|es|ed|ing)|grief|mourn(?:s|ed|ing)?)\b|\b(?:griev(?:e|es|ed|ing)|grief|mourn(?:s|ed|ing)?)\b.{0,40}\byou(?:r)?\b/i],
];
const EMOTION_WORD_PRESENT = [
  ['gratitude', /\b(?:gratitude|grateful)\b/i],
  ['grief', /\b(?:griev(?:e|es|ed|ing)|grief|mourn(?:s|ed|ing)?)\b/i],
];
// share_line and plain_english added after a live probe put the exact
// violation in share_line ("you are already grieving something while you
// are still in it") — a field this check didn't originally cover.
const EXPLANATORY_FIELD_KEYS = new Set(['why_it_fits', 'where_it_doesnt', 'tension', 'captures', 'misses', 'share_line', 'plain_english']);
function checkInventedEmotionWords(data, suppliedText) {
  const supplied = (suppliedText || '').toLowerCase();
  const walk = (node) => {
    if (!node || typeof node !== 'object') return;
    for (const [k, v] of Object.entries(node)) {
      if (typeof v === 'string' && EXPLANATORY_FIELD_KEYS.has(k)) {
        for (let i = 0; i < EMOTION_WORD_NEAR_YOU.length; i++) {
          const [label, nearRe] = EMOTION_WORD_NEAR_YOU[i];
          const [, presentRe] = EMOTION_WORD_PRESENT[i];
          if (nearRe.test(v) && !presentRe.test(supplied)) {
            // No length/sentence-count cap here, unlike the RULES walk below.
            // That cap exists because a stray banned word can sit inside an
            // otherwise-fine long paragraph, and blanking the whole thing
            // over one clause would destroy more than it fixes. This check
            // is different: the "near you" proximity requirement already
            // means the match usually IS the sentence's central claim, not
            // an incidental word — and a live run proved the cap actively
            // defeats the check where it matters most: why_it_fits and
            // where_it_doesnt are exactly the longer, multi-sentence fields
            // this leak shows up in, and both got logged-but-left-intact
            // ("too long to cut safely") on a real capture instead of fixed.
            console.log(`[name-that-feeling] ${k} blanked — invented "${label}" claim about the visitor, not present in their own description: ${v.slice(0, 200)}`);
            node[k] = '';
            break;
          }
        }
      } else if (v && typeof v === 'object') walk(v);
    }
  };
  walk(data);
  return data;
}

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
    "word": "A real candidate word or short established phrase — never a restatement of the gap itself (not 'the discomfort of a no-win moment'). Leave this and language/pronunciation/definition completely empty when match is NO ADEQUATE MATCH and truly nothing comes close; where_it_doesnt and plain_english carry the answer instead. Otherwise always fill it",
    "language": "",
    "pronunciation": "Only if reasonably confident — empty string otherwise",
    "match": "STRONG MATCH|CLOSE MATCH|PARTIAL MATCH|NO ADEQUATE MATCH",
    "definition": "",
    "why_it_fits": "",
    "where_it_doesnt": "Empty string only when the match is genuinely strong with no meaningful caveat. When match is NO ADEQUATE MATCH, this field is essential — say plainly what element this word introduces that the visitor didn't describe"
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

  "plain_english": "A natural English phrase describing only what the visitor actually described — no invented cause, comparison, or emotional resolution they did not supply. When match is NO ADEQUATE MATCH, this becomes the visitor's main answer, so it must stand on its own",

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
- NO ADEQUATE MATCH: "There may not be one word for this, but here's how it feels:"

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
    const suppliedText = `${description} ${context || ''}`;
    res.json(validateResult(checkInventedEmotionWords(cleanNoMatchWord(pinMatch(parsed)), suppliedText)));

  } catch (error) {
    console.error('NameThatFeeling error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// Reviewed against backend/lib/outputStandard.js during the 2026-09-05 rewrite.
router.outputStandard = 'v2';
router.outputGuard = {
  checks: ['pinMatch', 'cleanNoMatchWord', 'checkInventedEmotionWords', 'validateResult'],
  note: 'No "untranslatable" claim, no language-as-psychological-profile claim ("only the Welsh understand this," "uniquely Russian"), no personality reading built from a matched word ("the mark of someone who..."), no coined phrase presented as an established term, no named emotional ambiguity flattened into a flat fact ("It wasn\'t envy"), and no invented certainty attributed to the visitor ("you knew they deserved it") — all six are regex-detected and blanked in code. The four-value match enum (STRONG/CLOSE/PARTIAL/NO ADEQUATE MATCH) is pinned to an exact English literal (pinMatch) since the frontend switches on it for both the badge and the dynamic hero heading. cleanNoMatchWord checks best_match.word at EVERY match tier, not just NO ADEQUATE MATCH — a restatement of the gap rather than a real word ("the discomfort of a no-win moment," "homesickness for a place that exists only in memory") showed up dressed as CLOSE MATCH just as often as NO ADEQUATE MATCH across live probes, so any tier gets downgraded to NO ADEQUATE MATCH and cleared when this fires. checkInventedEmotionWords is the one check in this route that cross-references the visitor\'s own supplied text rather than judging a field in isolation — "grief"/"gratitude" is fine if the visitor used that word themselves, invented otherwise. Requires the word within 40 characters of a "you"/"your" reference, not just present anywhere in the field: a field-wide version blanked "Saudade carries primarily grief and melancholy" — an accurate lexical fact about the WORD, not a claim about the visitor — destroying good content to catch a bad pattern. It also has no length/sentence-count cap unlike the RULES walk below — a live run showed the generic cap actively defeating this check on exactly the fields the leak shows up in (why_it_fits, where_it_doesnt: detected but "too long to cut safely," left unfixed), because the "near you" proximity requirement already means a match usually IS the sentence\'s central claim, not an incidental word worth preserving the rest of the field over. Covers why_it_fits/where_it_doesnt/tension/captures/misses/share_line/plain_english — share_line and plain_english were added after a live probe put the exact violation there. The proximity version still misses a same-field-but-distant case (the emotion word two sentences away from the nearest "you"), left to the prompt rule alone. Scoped to exactly these two word-families (twice-confirmed live leaks), not the full FINAL GROUNDING PASS list (motives, wishes, imagined alternatives, ...), which is prompt-only — those vary too much for a safe word-list check without more confirmed examples.',
};

module.exports = router;
