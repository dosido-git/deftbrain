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

const RULES = [
  ['predicted what the other side will do', PREDICTION],
  ['scored or graded the negotiation', SCORED],
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
        const hit = RULES.find(([, re]) => re.test(v));
        if (hit) {
          if (v.length <= 200 && (v.match(/[.!?]/g) || []).length <= 1) {
            console.log(`[leverage-logic] ${k} blanked — ${hit[0]}: ${v.slice(0, 70)}`);
            node[k] = '';
          } else {
            console.log(`[leverage-logic] ${k} ${hit[0]} (left intact, too long to cut safely): ${v.slice(0, 70)}`);
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

A visitor is preparing for a negotiation. Work only from what they told you.

SITUATION: ${situation}
TYPE: ${negotiationType || 'not specified'}
WHAT THEY SAY IS WORKING IN THEIR FAVOUR: ${yourSide?.trim() || 'Nothing supplied — do not invent any; say so and ask what would establish some.'}
WHAT THEY SAY IS WORKING IN THE OTHER SIDE’S FAVOUR: ${theirSideSupplied ? theirSide.trim() : 'Nothing supplied. Their position is UNKNOWN. Return their_position as an empty array and put what to find out in unknowns.'}
WHAT THEY WANT: ${desired?.trim() || 'Not specified — do not invent a target or a walkaway point.'}
HOW URGENT IT IS FOR THEM: ${urgency || 'not specified'}
HOW MUCH THE RELATIONSHIP MATTERS TO THEM: ${relationship || 'not specified'}

Every entry under your_position and their_position must begin from something in
the text above. If you cannot point to the fact it rests on, it belongs in
unknowns instead.

Do not rate leverage as strong, medium or weak. Explain what the fact may mean
and what would have to be true for it to matter.

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.

Return ONLY valid JSON:
{
  "read": {
    "summary": "What they are negotiating and what they are trying to get — 1-2 sentences, entirely from what they told you",
    "type": "salary / lease / vendor / purchase / freelance / partnership / dispute / other",
    "standing_on": "One sentence naming the established facts this whole analysis rests on. If that is very little, say so plainly"
  },
  "your_position": [
    {
      "established": "The fact THEY supplied, restated plainly — one sentence",
      "implication": "What that fact may mean for this negotiation, and why — one sentence",
      "depends_on": "The unknown that decides how much it is actually worth, or null if it does not depend on one — one sentence"
    }
  ],
  "their_position": [
    {
      "established": "Only something the visitor told you about the other side — one sentence",
      "implication": "What it may mean for how they will approach this — one sentence",
      "depends_on": "The unknown that decides how much it is worth, or null — one sentence"
    }
  ],
  "their_position_note": "If they supplied nothing about the other side, one sentence saying the other side is unknown and that this is the biggest gap. Otherwise null",
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
      "how_to_find_out": "A concrete way for them to learn it before negotiating — one sentence"
    }
  ],
  "how_to_negotiate": {
    "approach": "The approach the established facts support — one sentence",
    "rests_on": "Which established fact it rests on — one sentence",
    "opening": "How to open, given only what is established — one sentence",
    "if_you_are_wrong": "What to do if the main unknown turns out to go against them — one sentence",
    "do_not_give_away": "What they should not volunteer, and why — one sentence"
  },
  "what_to_say": [
    {
      "moment": "When to use this — one sentence",
      "say_this": "Plain words they could actually say — 1-2 sentences",
      "rests_on": "The established fact this line depends on — one sentence"
    }
  ],
  "traps": [
    {
      "trap": "A way this particular visitor could mistake an assumption for leverage — one sentence",
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
WHAT THE VISITOR WANTS: ${yourGoal?.trim() || 'not supplied'}
TONE THEY PREFER: ${tonePreference || 'not specified'}

Work from the words they were actually given. Do not interpret hidden meaning,
name the tactic the other side is supposedly running, or say what will happen
after each possible reply — you cannot know any of that.

Say plainly what the words do and do not settle, then give responses the visitor
could actually use.

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.

Return ONLY valid JSON:
{
  "what_it_settles": "What their words establish, taken at face value — one sentence",
  "what_it_leaves_open": "What those words do not tell the visitor — one sentence",
  "before_you_answer": "The one thing worth being clear about in their own head first — one sentence",
  "responses": [
    {
      "approach": "Short name for this approach — 2-4 words",
      "say_this": "Plain words they could actually say — 1-2 sentences",
      "use_this_if": "The circumstance that makes this the right one — one sentence",
      "gives_up": "What this response concedes or reveals, or null — one sentence"
    }
  ],
  "do_not_say": "A reply that would cost them something, and what it costs — one sentence",
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

A visitor wants to know whether they have enough to go in with.

SITUATION: ${situation}
TYPE: ${negotiationType || 'not specified'}
WHAT THEY SAY THEY KNOW: ${whatYouKnow?.trim() || 'not supplied'}
WHAT THEY SAY THEY DO NOT KNOW: ${whatYouDontKnow?.trim() || 'not supplied'}

Do not score their readiness out of 100 or any other number. Return one of the
three verdicts below and say what it turns on.

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.

Return ONLY valid JSON:
{
  "verdict": "Exactly one of these and nothing else: ready_enough, few_things_to_check, important_gaps_first",
  "verdict_because": "What that verdict turns on — one sentence",
  "gaps": [
    {
      "gap": "Something they have not established — one sentence",
      "why_it_matters": "What it could change — one sentence",
      "how_to_find_out": "A concrete way to learn it — one sentence",
      "effort": "Exactly one of these and nothing else: a few minutes, an hour or so, longer than a day"
    }
  ],
  "already_solid": ["Something they told you that genuinely holds up — one short line each"],
  "one_thing_first": "The single thing worth doing before anything else, and why — one sentence"
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

Put the visitor’s case into an email they could send. Writing is not speaking:
what goes in an email can be forwarded, quoted and read back to them later.

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
