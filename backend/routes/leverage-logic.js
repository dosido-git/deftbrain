const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

const NO_QUOTE_RULE = 'Never place a double-quote (") character inside any JSON string value — scripts and quoted phrases must be written plainly with no inner quote marks, or it breaks the JSON.';

// ═══════════════════════════════════════════════════════════════
// The governing rule. Everything this route asks for has to survive it,
// which is why the schemas below name the established fact each claim rests
// on: a field that has to cite its source is much harder to fill with
// invention than a field that merely asks for a conclusion.
// ═══════════════════════════════════════════════════════════════
const CORE_RULE = `
LEVERAGE LOGIC — CORE REASONING RULE

Help the visitor reason about negotiating power; do not manufacture it.

Distinguish throughout between:

ESTABLISHED
Facts supplied by the visitor.

REASONABLE IMPLICATION
What those facts may mean for the negotiation.

UNKNOWN
Information that could materially change the strategy but has not been
established.

Do not invent:
- the other party's motives, priorities, constraints, alternatives or intentions;
- market prices, salary ranges, budgets, policies or customary practices;
- the visitor's alternatives or walkaway point;
- how strong a piece of leverage is when its practical value depends on unknown facts;
- what the other party will probably do;
- hidden "subtext";
- probabilities, readiness scores or outcome grades.

Leverage is useful only to the extent that the underlying fact is established
and its consequence can be reasonably explained.

When an important fact is unknown, identify what the visitor should learn
rather than filling the gap.

LEVERAGE LOGIC — FINAL V2 GROUNDING PASS

Follow DEFTBRAIN_OUTPUT_STANDARD_V2.

1. DO NOT UPGRADE A FACT INTO A CONSEQUENCE

A supplied fact may support a negotiating implication, but the implication
must remain conditional when its practical consequence is unknown.

Prefer:
"Being the only person who currently knows the billing integration may create
a transition cost if that knowledge is difficult to replace."

Not:
"Losing them creates an immediate operational gap."

Do not call leverage "strongest," "concrete," "harder to dismiss," or otherwise
rank its strength unless the facts establish the consequence that gives it
that strength.

2. DO NOT INVENT LEGAL CONSEQUENCES

A written agreement may be relevant without establishing contractual rights.

Do not say the company:
- would need to formally revoke it;
- may face legal exposure;
- has a contractual obligation;
- must justify changing it;

unless those propositions are established.

When legal significance matters, identify it as an unknown:
"The legal effect of the written agreement depends on its wording and
applicable law."

Do not characterize an uncertain agreement as having "moral leverage."

3. DO NOT PSYCHOLOGIZE THE OTHER SIDE

Do not infer what the other party:
- believes;
- feels;
- cares about;
- is motivated by;
- will find persuasive;
- is secretly trying to accomplish.

Prefer:
"The statement about available applicants may reduce the usefulness of a
replacement-cost argument."

Not:
"They believe they can replace people if necessary."

4. DO NOT INVENT ORGANIZATIONAL PROCESS

Do not assume HR involvement, approval chains, exception procedures,
leadership concerns, precedent rules, or internal decision-making processes.

These may be useful questions to investigate, but they are not facts.

5. STRATEGY MAY BE ASSERTIVE; ITS PREMISES MUST BE GROUNDED

Leverage Logic may recommend:
- what to emphasize;
- what not to volunteer;
- what to ask;
- how to frame a proposal;
- what fallback to offer;
- what information to obtain before negotiating.

It may reason strategically from established facts.

Do not convert the strategy itself into a prediction that the other side will
respond favorably.

6. SCRIPTS MUST NOT STRENGTHEN THE USER'S FACTS

Scripts may make supplied facts concise and persuasive, but may not upgrade
them.

If the user says they moved 90 minutes away, do not say:
"I relocated based on your written commitment"

unless the user explicitly established that causal relationship.

If the user says an agreement described the role as remote-first, do not
rewrite that as:
"the arrangement I was hired under"

unless that was supplied.

7. RESEARCH / PROFESSIONAL-HELP CLAIMS

Do not invent availability, cost, customary practices, or accessibility of
professional services.

Do not say:
"most offer a short initial consultation"

unless verified.

Simply recommend obtaining appropriate professional advice when warranted.

FINAL AUDIT

Before returning the result, ask:
- Did I turn "may mean" into "does mean"?
- Did I invent what the other side thinks?
- Did I invent company process?
- Did I assign legal significance I cannot establish?
- Did a script strengthen or add to the user's history?
- Did I rank leverage whose actual consequence remains unknown?
- Are unknowns being used as questions to investigate rather than gaps to fill?

VOICE — SPEAK DIRECTLY TO THE VISITOR

Write the entire analysis directly to the visitor in second person.

Use:
"You are asking..."
"You have..."
"Your employer..."
"Your position..."
"What you know..."
"What you still need to find out..."

Do not refer to the visitor as:
- they / them / their
- the visitor
- the user
- the negotiator

This applies to headings, summaries, leverage analysis, unknowns,
strategy, cautions, and explanations.

Scripts remain naturally in first person because they are words the
visitor can say:

"I want to talk through..."
"What I'm asking for is..."

Preserve the visitor's facts and certainty while changing grammatical
perspective. Do not add or strengthen facts merely to make the prose
sound more natural.

In every schema below, "you" means the person reading the result, never the
model. Write the field values the same way.
`;

// Two claims the old version made constantly and neither of which it could
// support: what the other side is going to do, and how likely something is.
// The subject has to be named. These prompts call the visitor "they" as a
// matter of course, so a bare `they will` catches "decide what they will do if
// the answer is no" — the visitor planning, which is the opposite of the
// failure. Naming the other party costs a few genuine catches and blanks
// nothing the visitor wrote.
const OTHER_PARTY = '(?:the other (?:side|party)|(?:your |the )?(?:employer|manager|boss|landlord|client|vendor|buyer|seller|company|counterpart))';
const PREDICTION = new RegExp([
  '\\b' + OTHER_PARTY + "\\s+(?:will|won't|will not|are going to|is going to|'ll)\\b",
  '\\bexpect (?:them|him|her) to\\b',
  '\\bchances are\\b',
  '\\bmost likely\\b',
  '\\b\\d{1,3}\\s?%\\s?(?:chance|likely|likelihood|probability)',
  '\\b(?:probability|likelihood) (?:of|that)\\b',
].join('|'), 'i');
// Scores and grades: the shapes the old readiness_score and outcome grade took.
const SCORED = /\b(?:score|rating|grade)d?\s*(?:of|:)?\s*\d|\b\d{1,3}\s*\/\s*(?:10|100)\b|\bgrade\s*[:-]?\s*[A-DF][+-]?\b/i;

// Item 3. With the visitor addressed as "you", a third-person "they" is the
// other side — so "they believe" is exactly the failure and not a pronoun
// collision any more. Reported speech is spared: if you told us they said it,
// repeating it is not psychologizing.
const PSYCHOLOGIZED = new RegExp([
  '\\b(?:they|he|she|' + OTHER_PARTY + ")\\s+(?:(?:may|might|would|could|does|do|is|are|will)\\s+(?:not\\s+)?)?(?:believes?|feels?|thinks?|wants?|fears?|hopes?|cares? about|is worried|are worried|is motivated|are motivated|is trying to|are trying to|perceives?|views?|sees)\\b",
  '\\bwhat (?:they|he|she) (?:really )?(?:want|believe|think|care|fear)',
  '\\bthey (?:would|will) find [a-z]+ persuasive\\b',
].join('|'), 'i');
const REPORTED = /\b(?:said|told you|mentioned|stated|wrote|claimed|according to)\b/i;
// Naming the other side's view as something you do not know is the behaviour
// both rules ask for; only asserting it is the violation. Without this the
// checker blanks its own best output — "whether the company views this as a
// constraint, which you cannot know" is the sentence we want, not the one we
// are hunting.
const EPISTEMIC_HEDGE = /\b(?:whether|unclear|not clear|unknown|not established|cannot (?:yet )?know|can not know|without knowing|do (?:not|n.t) (?:yet )?know|worth (?:checking|asking)|depends (?:on|entirely on))\b/i;

// Item 2. Assertions only. An earlier version matched the topic — `binding`,
// `legal weight` — and blanked three sentences whose whole job was telling you
// NOT to make legal claims. Advice about legal uncertainty has to be able to
// say the word.
const LEGAL_CLAIM = new RegExp([
  '\\bcreates? (?:a |an )?(?:contractual|legal|binding) (?:obligation|right|duty|commitment)\\b',
  '\\b(?:is|are|was|were|would be) (?:legally |contractually )?bind(?:ing|s)\\b',
  '\\bhas? (?:a |an )?contractual (?:obligation|duty|right)\\b',
  '\\b(?:may |will |could )?face(?:s)? legal (?:exposure|risk|action|liability)\\b',
  '\\bwould need to (?:formally )?(?:revoke|rescind)\\b',
  '\\bmust (?:legally |formally )?justify\\b',
  '\\bgives? (?:it|this|that|the document|the letter|the agreement) (?:real |any |genuine )?legal (?:weight|force|standing)\\b',
  '\\bmoral leverage\\b',
  '\\bgrounds for (?:a |an )?(?:claim|complaint|case|suit)\\b',
].join('|'), 'i');
// Naming it as an unknown is the behaviour the rule asks for, not a violation.
const HEDGED_LEGAL = /\b(?:whether|unclear|not clear|worth (?:checking|asking)|depends on (?:its |the )?wording|applicable law|unknown|not established|lawyer|attorney|solicitor|legal advice|professional advice|employment law)\b/i;

// The voice rule, mechanically: these three phrases can only be the analysis
// talking about the reader instead of to them.
const THIRD_PERSON_READER = /\bthe (?:visitor|user|negotiator)\b/i;

// Item 1. Ranking words earn their place only when the consequence behind them
// is established; hedged or explicitly conditional uses are spared.
const RANKED = /\b(?:strongest|weakest|most concrete|hardest to dismiss|harder to dismiss|your best leverage|the real leverage)\b/i;

const RULES = [
  ['predicted what the other side will do', PREDICTION],
  ['scored or graded the negotiation', SCORED],
  ['said what the other side believes or wants', PSYCHOLOGIZED, (v) => REPORTED.test(v) || EPISTEMIC_HEDGE.test(v)],
  ['assigned legal significance it cannot establish', LEGAL_CLAIM, (v) => HEDGED_LEGAL.test(v) || EPISTEMIC_HEDGE.test(v)],
  ['ranked leverage whose consequence is not established', RANKED, (v) => EPISTEMIC_HEDGE.test(v)],
  ['talked about you instead of to you', THIRD_PERSON_READER],
];

// Deterministic, not advisory. The one thing a model cannot be trusted to
// self-police here is the other side's position: if the visitor supplied
// nothing about them, every entry under their_position is invention by
// definition, and no amount of prompt text has to be trusted to prove it.
function validateResult(data, opts = {}) {
  if (!data || typeof data !== 'object') return data;

  if (opts.theirSideSupplied === false && Array.isArray(data.their_position) && data.their_position.length) {
    console.log(`[leverage-logic] dropped ${data.their_position.length} their_position entr(ies) — visitor supplied nothing about the other side`);
    data.their_position = [];
  }

  const walk = (node) => {
    if (Array.isArray(node)) return node.forEach(walk);
    if (!node || typeof node !== 'object') return;
    for (const [k, v] of Object.entries(node)) {
      if (typeof v === 'string') {
        const hit = RULES.find(([, re, spare]) => re.test(v) && !(spare && spare(v)));
        if (hit) {
          if (v.length <= 200 && (v.match(/[.!?]/g) || []).length <= 1) {
            console.log(`[leverage-logic] ${k} blanked — ${hit[0]}: ${v.slice(0, 200)}`);
            node[k] = '';
          } else {
            console.log(`[leverage-logic] ${k} ${hit[0]} (left intact, too long to cut safely): ${v.slice(0, 200)}`);
          }
        }
      } else if (v && typeof v === 'object') walk(v);
    }
  };
  walk(data);
  return data;
}

// ═══════════════════════════════════════════════════════════════
// MAIN — your position, their position, what matters, how, what to say
// ═══════════════════════════════════════════════════════════════

router.post('/leverage-logic', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { situation, yourSide, theirSide, desired, urgency, relationship, negotiationType, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!situation?.trim()) return res.status(400).json({ error: 'Describe your negotiation situation' });

    const theirSideSupplied = !!theirSide?.trim();

    const prompt = `${CORE_RULE}

You are writing to someone preparing for a negotiation. Address them as you.
Work only from what they gave you below.

SITUATION: ${situation}
TYPE: ${negotiationType || 'not specified'}
WHAT YOU SAY IS WORKING IN YOUR FAVOUR: ${yourSide?.trim() || 'Nothing supplied — do not invent any; say so and ask what would establish some.'}
WHAT YOU SAY IS WORKING IN THE OTHER SIDE’S FAVOUR: ${theirSideSupplied ? theirSide.trim() : 'Nothing supplied. Their position is UNKNOWN. Return their_position as an empty array and put what to find out in unknowns.'}
WHAT YOU WANT: ${desired?.trim() || 'Not specified — do not invent a target or a walkaway point.'}
HOW URGENT IT IS FOR YOU: ${urgency || 'not specified'}
HOW MUCH THE RELATIONSHIP MATTERS TO YOU: ${relationship || 'not specified'}

Every entry under your_position and their_position must begin from something in
the text above. If you cannot point to the fact it rests on, it belongs in
unknowns instead.

Do not rate leverage as strong, medium or weak. Explain what the fact may mean
and what would have to be true for it to matter.

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.

Return ONLY valid JSON:
{
  "read": {
    "summary": "What you are negotiating and what you are trying to get — 1-2 sentences, entirely from what you supplied",
    "type": "salary / lease / vendor / purchase / freelance / partnership / dispute / other",
    "standing_on": "One sentence naming the established facts this whole analysis rests on, addressed to you. If that is very little, say so plainly"
  },
  "your_position": [
    {
      "established": "The fact you supplied, restated plainly and addressed to you — one sentence",
      "implication": "What that fact MAY mean for this negotiation, and why — one sentence. Stay conditional whenever its practical consequence is unknown",
      "depends_on": "The unknown that decides how much it is actually worth, or null if it does not depend on one — one sentence"
    }
  ],
  "their_position": [
    {
      "established": "Only something you told me about the other side — one sentence",
      "implication": "What it may mean for the negotiation — one sentence. Describe what the fact does to the argument, never what the other side believes, feels or intends",
      "depends_on": "The unknown that decides how much it is worth, or null — one sentence"
    }
  ],
  "their_position_note": "If you supplied nothing about the other side, one sentence addressed to you saying their side is unknown and that this is the biggest gap. Otherwise null",
  "what_matters_most": [
    {
      "factor": "The thing that most decides how this goes — one sentence",
      "why": "Why it decides it — one sentence",
      "status": "Exactly one of these and nothing else: established, unknown"
    }
  ],
  "unknowns": [
    {
      "unknown": "Something not established that could change the strategy — one sentence",
      "why_it_matters": "What it would change — one sentence",
      "how_to_find_out": "A concrete way for you to learn it before negotiating — one sentence"
    }
  ],
  "how_to_negotiate": {
    "approach": "The approach the established facts support — one sentence",
    "rests_on": "Which established fact it rests on — one sentence",
    "opening": "How to open, given only what is established — one sentence",
    "if_you_are_wrong": "What to do if the main unknown turns out to go against you — one sentence",
    "do_not_give_away": "What you should not volunteer, and why — one sentence"
  },
  "what_to_say": [
    {
      "moment": "When to use this — one sentence",
      "say_this": "Plain words you could actually say, in first person — 1-2 sentences. Make the supplied facts concise, never stronger or fuller than supplied",
      "rests_on": "The established fact this line depends on — one sentence"
    }
  ],
  "traps": [
    {
      "trap": "A way you could mistake an assumption for leverage here — one sentence",
      "instead": "What to do instead — one sentence"
    }
  ]
}

ARRAY BOUNDS: your_position at most 5, their_position at most 5, what_matters_most at most 4, unknowns at most 5, what_to_say at most 5, traps at most 3.

Return ONLY valid JSON. ${NO_QUOTE_RULE}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 6000,
      messages: [{ role: 'user', content: withLanguage(prompt, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion) }],
    }, { label: 'leverage-logic' });
    if (!parsed.read) {
      return res.status(500).json({ error: 'Could not read your situation. Please try again.' });
    }
    res.json(validateResult(parsed, { theirSideSupplied }));

  } catch (error) {
    console.error('[LeverageLogic] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// COUNTER — they just said something; what now
// ═══════════════════════════════════════════════════════════════

router.post('/leverage-logic/counter', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { situation, theyJustSaid, yourGoal, tonePreference, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!theyJustSaid?.trim()) return res.status(400).json({ error: 'What did they say?' });

    const prompt = `${CORE_RULE}

The other side has just said something and the visitor needs to respond.

SITUATION: ${situation?.trim() || 'not supplied'}
THEY JUST SAID: ${theyJustSaid.trim()}
WHAT YOU WANT: ${yourGoal?.trim() || 'not supplied'}
TONE YOU PREFER: ${tonePreference || 'not specified'}

Write to them as you. Work from the words you were actually given, and do not
interpret hidden meaning,
name the tactic the other side is supposedly running, or say what will happen
after each possible reply — you cannot know any of that.

Say plainly what the words do and do not settle, then give responses you could
actually use.

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.

Return ONLY valid JSON:
{
  "what_it_settles": "What their words establish, taken at face value — one sentence",
  "what_it_leaves_open": "What those words do not tell you — one sentence",
  "before_you_answer": "The one thing worth being clear about in your own head first — one sentence",
  "responses": [
    {
      "approach": "Short name for this approach — 2-4 words",
      "say_this": "Plain words you could actually say, in first person — 1-2 sentences",
      "use_this_if": "The circumstance that makes this the right one — one sentence",
      "gives_up": "What this response concedes or reveals, or null — one sentence"
    }
  ],
  "do_not_say": "A reply that would cost you something, and what it costs — one sentence",
  "saying_nothing": "Whether waiting is a real option here, and what it depends on — one sentence"
}

ARRAY BOUNDS: responses at most 3.

Return ONLY valid JSON. ${NO_QUOTE_RULE}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 3000,
      messages: [{ role: 'user', content: withLanguage(prompt, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion) }],
    }, { label: 'leverage-logic-counter' });
    if (!parsed.what_it_settles) {
      return res.status(500).json({ error: 'Could not read their response. Please try again.' });
    }
    res.json(validateResult(parsed));

  } catch (error) {
    console.error('[LeverageLogic/counter] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// PREP CHECK — what is still worth finding out
// ═══════════════════════════════════════════════════════════════

router.post('/leverage-logic/prep-check', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { situation, whatYouKnow, whatYouDontKnow, negotiationType, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!situation?.trim()) return res.status(400).json({ error: 'Describe your negotiation situation' });

    const prompt = `${CORE_RULE}

You are writing to someone who wants to know whether they have enough to go in
with. Address them as you.

SITUATION: ${situation}
TYPE: ${negotiationType || 'not specified'}
WHAT YOU SAY YOU KNOW: ${whatYouKnow?.trim() || 'not supplied'}
WHAT YOU SAY YOU DO NOT KNOW: ${whatYouDontKnow?.trim() || 'not supplied'}

Do not score your reader's readiness out of 100 or any other number. Return one of the
three verdicts below and say what it turns on.

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.

Return ONLY valid JSON:
{
  "verdict": "Exactly one of these and nothing else: ready_enough, few_things_to_check, important_gaps_first",
  "verdict_because": "What that verdict turns on — one sentence",
  "gaps": [
    {
      "gap": "Something you have not established — one sentence",
      "why_it_matters": "What it could change for you — one sentence",
      "how_to_find_out": "A concrete way for you to learn it — one sentence",
      "effort": "Exactly one of these and nothing else: a few minutes, an hour or so, longer than a day"
    }
  ],
  "already_solid": ["Something you supplied that genuinely holds up — one short line each"],
  "one_thing_first": "The single thing worth doing before anything else, and why — one sentence, addressed to you"
}

ARRAY BOUNDS: gaps at most 5, already_solid at most 4.

Return ONLY valid JSON. ${NO_QUOTE_RULE}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 3000,
      messages: [{ role: 'user', content: withLanguage(prompt, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion) }],
    }, { label: 'leverage-logic-prep-check' });
    if (!parsed.verdict) {
      return res.status(500).json({ error: 'Could not check your prep. Please try again.' });
    }
    res.json(validateResult(parsed));

  } catch (error) {
    console.error('[LeverageLogic/prep-check] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// DRAFT EMAIL — the same case, in sendable words
// ═══════════════════════════════════════════════════════════════

router.post('/leverage-logic/draft-email', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { situation, howToNegotiate, whatToSay, negotiationType, recipientName, tone, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!situation?.trim()) return res.status(400).json({ error: 'Situation is required' });

    const prompt = `${CORE_RULE}

Put your reader’s case into an email they could send, and address any notes to
them as you. Writing is not speaking: what goes in an email can be forwarded,
quoted and read back to them later.

SITUATION: ${situation}
TYPE: ${negotiationType || 'not specified'}
THE APPROACH: ${howToNegotiate ? JSON.stringify(howToNegotiate) : 'not supplied'}
LINES ALREADY DRAFTED: ${Array.isArray(whatToSay) && whatToSay.length ? whatToSay.map(s => s.say_this).filter(Boolean).join(' | ') : 'none'}
TO: ${recipientName?.trim() || 'the other party'}
TONE: ${tone || 'professional'}

Use only facts established above. Do not add a number, a market rate, a deadline
or a competing offer that is not already there.

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.

Return ONLY valid JSON:
{
  "drafts": [
    {
      "version": "Exactly one of these and nothing else: Professional, Direct, Warm",
      "subject_line": "Email subject — one short line",
      "body": "Full email text ready to send — 3-6 sentences",
      "tone_note": "What this version does differently — one sentence"
    }
  ],
  "keep_out_of_writing": ["Something better said in person, and why — one short line each"],
  "before_you_send": "The one thing to re-read for before sending — one sentence"
}

ARRAY BOUNDS: exactly 3 drafts, one per version, in that order. keep_out_of_writing at most 3.

Return ONLY valid JSON. ${NO_QUOTE_RULE}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 3000,
      messages: [{ role: 'user', content: withLanguage(prompt, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion) }],
    }, { label: 'leverage-logic-draft-email' });
    if (!parsed.drafts) {
      return res.status(500).json({ error: 'Could not draft your email. Please try again.' });
    }
    res.json(validateResult(parsed));

  } catch (error) {
    console.error('[LeverageLogic/draft-email] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// Reviewed against backend/lib/outputStandard.js while rewriting this route
// around the core reasoning rule. Every endpoint runs validateResult.
router.outputStandard = 'v2';
router.outputGuard = {
  checks: ['validateResult'],
  note: 'their_position is emptied in code when the visitor supplied nothing about the other side; prediction and score/grade language is blanked.',
};

module.exports = router;
