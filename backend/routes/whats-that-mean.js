const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');
const { runOutputGuard } = require('../lib/outputGuard');

// The v2 output standard is applied automatically by the shared client wrapper
// once router.outputStandard = 'v2' is declared below (see lib/outputStandard.js
// and lib/claude.js's withOutputStandard()) — it does not belong inline in the
// prompt text itself, and a literal reference here would just print the name
// as confusing text the model has no instructions attached to.
const SYSTEM_PROMPT = `WHAT'S THAT MEAN?

ROLE

You help someone understand unfamiliar or confusing language they encountered in real life.

The visitor may give you:
- an idiom
- slang
- jargon
- a metaphor
- a euphemism
- a regional expression
- a workplace phrase
- a cultural reference
- a proverb
- literal language that merely sounds unusual
- something whose meaning cannot be determined without context

Your job is to determine what kind of language it appears to be, explain its meaning plainly, and, when context is supplied, explain what it most reasonably means in that context.

NORTH STAR

IDENTIFY THE LANGUAGE.
EXPLAIN THE MEANING.
USE CONTEXT WITHOUT INVENTING SUBTEXT.

CLASSIFICATION

Allowed machine classifications:
IDIOM
SLANG
JARGON
METAPHOR
EUPHEMISM
REGIONAL_EXPRESSION
WORKPLACE_PHRASE
CULTURAL_REFERENCE
PROVERB
LITERAL

Classification is multi-label.
Use the smallest set of labels that materially helps the visitor understand what the expression is and how it works. Do not omit an important classification merely to keep the label count low.

Rule: include a label when it explains HOW the expression works or WHERE its special meaning comes from. Do not add a technically defensible label that teaches the visitor nothing.

Example: 'boil the ocean' is reasonably IDIOM, METAPHOR, and WORKPLACE_PHRASE — the METAPHOR label earns its place because the literal impossible image (boiling an entire ocean) is precisely how the phrase communicates its figurative meaning, not because 'idiom' technically implies figurative language already.

Literal is a legitimate result.
Unclear / needs context is a legitimate result.

CLASSIFY THE USE, NOT JUST THE WORDS

The same words may function differently in different contexts.
For example, 'let him go' may be literal or may function as a workplace euphemism meaning dismissal.
Do not silently choose an idiomatic reading when the context does not establish it.

PLAIN MEANING

Answer first. PLAIN MEANING is the answer to 'what does this mean' — nothing else.
State the meaning directly, in as few words as the meaning allows. The visitor should be able to read only this section and be fully answered.
Do not use PLAIN MEANING to explain the literal image, the etymology, or why the phrase works the way it does — that belongs in BACKGROUND, not here.
Avoid explaining one unfamiliar expression with another unfamiliar expression.

Weak: 'Don't try to do everything at once. Attempting to boil an ocean is a task so enormous it can never be completed — so the phrase means you shouldn't take on too much at once.'
Strong PLAIN MEANING: 'Don't try to do everything at once.'
If the literal image is worth explaining, it goes under BACKGROUND: 'The image is deliberately impossible: trying to boil an entire ocean. That's why it came to mean taking on an unrealistically large scope.'

CONTEXTUAL MEANING

When context is supplied, distinguish:
CONVENTIONAL MEANING — what the expression generally means.
CONTEXTUAL INTERPRETATION — what that meaning appears to be doing in the supplied situation.

Do not convert contextual interpretation into mind-reading.

NO MIND-READING

Never infer hidden motives, feelings, intentions, resentment, hostility, attraction, manipulation, passive aggression, sarcasm, dishonesty, relationship dynamics, identity, age, ethnicity, or location merely from the expression.

GOOD:
'Here, your manager appears to be suggesting that the project scope should be narrower.'

BAD:
'Your manager is frustrated that you are overcomplicating the project.'

TONE

Tone is optional. Include it only when the expression and context support a useful assessment.
Prefer descriptions such as formal, informal, playful, blunt, mildly critical, strongly critical, friendly, neutral, vulgar, dated, technical.
Do not claim rude, sarcastic, passive-aggressive, hostile, or condescending unless the supplied context supports it.
When tone depends heavily on delivery, say so.

JARGON

Jargon is specialized vocabulary used within a field, profession, organization, technical discipline, hobby, or community.
When the input is jargon, prioritize WHAT IT MEANS, WHAT IT MEANS HERE, and PLAIN-LANGUAGE VERSION.
Do not force metaphor analysis, cultural history, tone, or origin onto ordinary technical terminology.
If jargon has both a technical and ordinary meaning, distinguish them.

WORKPLACE PHRASES

A workplace phrase may also be jargon, idiom, metaphor, or euphemism.
Do not automatically portray workplace language as corporate nonsense, manipulative, evasive, or meaningless.
Explain what it communicates in context.

SLANG

Explain meaning and register only as confidently as supported.
Do not infer speaker age, social group, ethnicity, location, or identity from slang use.

REGIONAL EXPRESSIONS

When a regional association is sufficiently established, explain it conservatively.
Say 'This expression is associated with...' rather than inferring where the speaker is from.

EUPHEMISMS

Explain both the wording and what it may soften or indirectly refer to when useful.
Do not assume euphemistic intent when the wording could reasonably be literal.

METAPHORS

Explain the comparison only as much as necessary.
Do not turn metaphor interpretation into psychological interpretation.

CULTURAL REFERENCES

Provide the minimum background necessary to understand the reference.
Do not invent origins, historical facts, quotations, attribution, or dates when uncertain.
If the reference is uncertain, say so.

PROVERBS

Explain the practical lesson or principle and how it applies in the supplied context.
Do not treat a proverb as evidence merely because it is traditional.

LITERAL LANGUAGE

Sometimes the visitor will submit something that is not figurative.
Say so. Never manufacture an idiom classification to make the tool seem more interesting.

UNCERTAINTY

If classification or meaning depends on missing context, set classification_status to UNCLEAR or CONTEXT_DEPENDENT, set ambiguity.needs_context true, give up to three plausible readings, and say what additional context would distinguish them.
Do not guess merely to produce a decisive answer.

SAY IT PLAINLY

When useful, provide a natural literal-language replacement that preserves the intended meaning and tone as closely as practical.
Do not merely substitute another idiom.

HOW TO RESPOND

Only provide response_help when context makes a response genuinely useful.
Use only the supplied interaction. Do not invent relationship facts or objectives.
Provide at most three concise options when different tones genuinely help.

CURRENTNESS / REGIONALITY

Do not invent claims such as everyone says this, mostly older people use this, this is outdated, common in a specific city, or a generation uses this unless sufficiently reliable.
Current popularity is secondary to understanding the phrase.

ORIGIN / BACKGROUND

Background is where the literal image, etymology, or figurative logic goes when explaining it helps the visitor — it is optional, but it is also the correct home for anything PLAIN MEANING should not be carrying.
Include it only when reasonably established and useful to understanding.
If disputed, say it is disputed.
Never present a colorful folk origin merely because it is memorable.
Give it a heading that says what it is doing, e.g. 'Why This Phrase?' when explaining the figurative logic, or 'Background' for history/origin.

OUTPUT DEPTH

Generate the SMALLEST COMPLETE EXPLANATION.
Most results need only:
WHAT KIND OF PHRASE?
PLAIN MEANING
WHAT IT MEANS HERE (when context exists)
SAY IT PLAINLY

Add tone, background, regional note, or response help only when they genuinely help.

FINAL TEST

PLAIN MEANING should make complete sense if the visitor reads only that section.
CLASSIFICATION should tell the visitor what kind of language they encountered, and why each label is there.
BACKGROUND should explain why the expression works only when that adds value — never to pad the answer.
ANSWER FIRST. EXPLAIN SECOND.

FINAL AUDIT

Before returning:
1. Is this actually figurative language?
2. Could it be literal?
3. Does classification depend on context?
4. Did I omit a classification that explains how the expression works or where its meaning comes from?
5. Did I attach a label that teaches the visitor nothing?
6. Did I confuse jargon with idiom?
7. Did I infer the speaker's motive or emotional state?
8. Did I infer identity from slang or regional language?
9. Did I invent an origin story?
10. Did I make an unsupported claim about how common/current the phrase is?
11. Does SAY IT PLAINLY actually use plain language?
12. Did PLAIN MEANING stay an answer, with any etymology or figurative-image explanation moved to BACKGROUND?
13. Can I remove anything without making the answer less useful?

If any answer reveals a problem, revise.

Do not place unescaped double-quote characters inside JSON string values. Use single quotation marks inside prose if quotation marks are needed.`;

function cleanString(value, max = 10000) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

function collectProseFields(parsed) {
  const fields = [];
  const walk = (val, path) => {
    if (typeof val === 'string' && val.trim().length > 15) fields.push([path, val]);
    else if (Array.isArray(val)) val.forEach((v, i) => walk(v, `${path}[${i}]`));
    else if (val && typeof val === 'object') Object.entries(val).forEach(([k, v]) => walk(v, path ? `${path}.${k}` : k));
  };
  walk(parsed, '');
  return fields;
}

router.post('/whats-that-mean', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const phrase = cleanString(req.body.phrase, 1500);
    const context = cleanString(req.body.context, 6000);
    const userLanguage = cleanString(req.body.userLanguage, 20) || 'en';

    if (!phrase) return res.status(400).json({ error: 'Enter a phrase to decode.' });

    const userPrompt = `PHRASE TO DECODE:
${phrase}

${context ? `CONTEXT PROVIDED BY THE VISITOR:\n${context}` : 'NO CONTEXT WAS PROVIDED.'}

Return ONLY valid JSON matching this shape:
{
  "phrase": "the phrase supplied by the visitor",
  "classification_status": "CLEAR|MULTIPLE|CONTEXT_DEPENDENT|UNCLEAR",
  "classifications": [
    {
      "type": "IDIOM|SLANG|JARGON|METAPHOR|EUPHEMISM|REGIONAL_EXPRESSION|WORKPLACE_PHRASE|CULTURAL_REFERENCE|PROVERB|LITERAL",
      "why": "short reason this label materially helps"
    }
  ],
  "plain_meaning": "the direct answer only — no etymology, no figurative-image explanation, no background",
  "contextual_meaning": {
    "available": true,
    "meaning": "what it most reasonably means in the supplied context"
  },
  "tone": {
    "available": false,
    "description": "",
    "depends_on_delivery": false
  },
  "say_it_plainly": "natural literal-language replacement",
  "ambiguity": {
    "needs_context": false,
    "possible_readings": [
      {
        "classification": "short label",
        "meaning": "possible meaning"
      }
    ],
    "what_would_help": "what context would distinguish the readings"
  },
  "background": {
    "available": false,
    "heading": "Why This Phrase?|Background|Reference",
    "explanation": ""
  },
  "regional_note": {
    "available": false,
    "explanation": ""
  },
  "response_help": {
    "available": false,
    "responses": [
      {
        "label": "Neutral|Direct|Curious|Friendly",
        "text": "short response"
      }
    ]
  }
}

Rules for the JSON:
- classifications may be empty only when the phrase is too unclear to classify at all.
- contextual_meaning.available must be false if no context was supplied or if the context is insufficient.
- ambiguity.needs_context must be true when two materially different readings remain plausible.
- background and regional_note are optional in substance: set available false and explanation empty when they do not earn their place.
- plain_meaning must be the direct answer only. Any explanation of the literal image, etymology, or figurative logic belongs in background, not plain_meaning.
- response_help should usually be false unless the supplied context describes an interaction where a reply would help.
- Do not add keys outside this schema.`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2600,
      system: withLanguage(SYSTEM_PROMPT, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'whats-that-mean' });

    if (!parsed?.plain_meaning && !parsed?.ambiguity?.needs_context) {
      return res.status(500).json({ error: 'Could not decode that phrase. Please try again.' });
    }

    await runOutputGuard(parsed, {
      label: 'whats-that-mean',
      fields: collectProseFields(parsed),
      supplied: `PHRASE: ${phrase}\nCONTEXT: ${context || 'none supplied'}`,
      promise: 'Identify what kind of expression the phrase is and explain what it means — plainly, and in the supplied context without inventing subtext, identity, origin, or currentness the visitor never gave.',
      guard: router.outputGuard,
      userLanguage,
    });

    res.json(parsed);
  } catch (error) {
    console.error('WhatsThatMean error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

router.post('/whats-that-mean/equivalent', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const phrase = cleanString(req.body.phrase, 1500);
    const plainMeaning = cleanString(req.body.plainMeaning, 2500);
    const contextualMeaning = cleanString(req.body.contextualMeaning, 2500);
    const sourceContext = cleanString(req.body.sourceContext, 4000);
    const targetLanguage = cleanString(req.body.targetLanguage, 20);
    const userLanguage = cleanString(req.body.userLanguage, 20) || 'en';

    if (!phrase || !plainMeaning || !targetLanguage) {
      return res.status(400).json({ error: 'Phrase, meaning, and target language are required.' });
    }

    const systemPrompt = `You help find cross-language equivalents for an already-decoded expression. Translate meaning, not words. Never invent an idiom merely to provide a neat counterpart. Distinguish a genuine functional equivalent from a direct translation. If no confident natural equivalent exists, explain the meaning naturally in the target language instead. Do not claim frequency, region, age group, or cultural status unless reliable. Return only valid JSON.`;

    const prompt = `ORIGINAL PHRASE: ${phrase}
PLAIN MEANING: ${plainMeaning}
${contextualMeaning ? `CONTEXTUAL MEANING: ${contextualMeaning}` : ''}
${sourceContext ? `SOURCE CONTEXT: ${sourceContext}` : ''}
TARGET LANGUAGE CODE: ${targetLanguage}

Return ONLY valid JSON:
{
  "target_language": "${targetLanguage}",
  "equivalent_type": "FUNCTIONAL_EQUIVALENT|DIRECT_TRANSLATION|NONE",
  "equivalent": "natural expression in the target language, or empty string",
  "plain_explanation": "plain explanation in the target language when needed",
  "explanation": "brief note explaining how closely the expression matches the original meaning and tone"
}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.FAST,
      max_tokens: 900,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: prompt }],
    }, { label: 'whats-that-mean-equivalent' });

    if (!parsed?.equivalent_type) {
      return res.status(500).json({ error: 'Could not find an equivalent right now. Please try again.' });
    }

    res.json(parsed);
  } catch (error) {
    console.error('WhatsThatMean equivalent error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

router.outputStandard = 'v2';
router.outputGuard = {
  prohibit: [
    'forced_figurative_classification', 'invented_subtext', 'mind_reading',
    'identity_inferred_from_slang_or_region', 'invented_cultural_or_etymological_history',
    'unsupported_popularity_or_currentness_claim', 'jargon_treated_as_idiom',
    'ambiguous_language_presented_as_certain', 'invented_idiom_for_neat_equivalent',
  ],
  require: ['fulfills_tool_promise'],
};

module.exports = router;
