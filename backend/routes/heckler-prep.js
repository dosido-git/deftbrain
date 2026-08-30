const express = require('express');
const router = express.Router();
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');
const { runOutputGuard } = require('../lib/outputGuard');

// Two model calls already ran. If they were slow, the visitor has waited long
// enough — return the prep unguarded rather than spend another check budget.
const GUARD_ENTRY_MS = Number(process.env.HP_GUARD_ENTRY_MS || 70_000);

// Guards the text the presenter will say out loud or lean on in the room. The
// failure mode here is not an unanswerable question — it is a fluent, confident
// answer built on a fact nobody supplied: a prior promise, a past overrun, a
// board's opinion, a document that does not exist. A presenter who repeats one
// of those in front of the people who know better is worse off than if the tool
// had said nothing.
async function guardHecklerPrep(parsed, body, startedAt) {
  if (Date.now() - startedAt > GUARD_ENTRY_MS) {
    console.log('[heckler-prep] v2 guard: skipped — out of time, prep returned unguarded');
    return;
  }
  const fields = [];
  const long = v => typeof v === 'string' && v.trim().length > 12;
  if (long(parsed.situation_read)) fields.push(['situation_read', parsed.situation_read]);
  if (long(parsed.opening_move)) fields.push(['opening_move', parsed.opening_move]);
  if (long(parsed.confidence_note)) fields.push(['confidence_note', parsed.confidence_note]);
  (parsed.questions || []).forEach((q, i) => {
    if (long(q?.real_concern)) fields.push([`questions[${i}].real_concern`, q.real_concern]);
    if (long(q?.model_answer)) fields.push([`questions[${i}].model_answer`, q.model_answer]);
    if (long(q?.if_you_dont_know)) fields.push([`questions[${i}].if_you_dont_know`, q.if_you_dont_know]);
  });
  if (!fields.length) return;

  await runOutputGuard(parsed, {
    label: 'heckler-prep-v2',
    fields,
    supplied: `WHAT THE USER TOLD US, IN FULL — nothing else about their organisation, their history, their audience or their evidence is known:
Topic: ${(body.topic || '').trim() || '(not given)'}
Audience: ${(body.audience || '').trim() || '(not given)'}
What they are asking for: ${(body.proposal || body.askingFor || '').trim() || '(not given)'}
Objections they already expect: ${(body.knownObjections || body.objections || '').trim() || '(not given)'}
Stakes: ${(body.stakes || '').trim() || '(not given)'}

Nothing is known about past projects, prior promises, budget history, vendor
relationships, test scope, internal politics, what this audience believes, how
they have reacted before, or what evidence and documents the presenter holds.

WHAT FAILS:
1. A fact about the organisation, its history, its finances or its people that
   the user did not supply — a previous overrun, an earlier commitment, a
   headcount, a deadline, a named system or vendor.
2. A claim about what the audience thinks, fears, wants or will do, stated as
   known rather than as what a question tests.
3. A model answer or if_you_dont_know that asserts evidence, a document, a
   figure or a timeline the user never mentioned, instead of marking it with a
   bracketed placeholder.
4. A real_concern written as hidden psychology or motive rather than as what
   the question is testing.
5. A gotcha built on a contradiction that is not actually present in the
   supplied facts.
6. Encouragement in confidence_note resting on an advantage, an evidence base
   or an audience reaction that was never supplied.`,
    promise: 'Give this presenter the hardest questions their actual audience could ask about the case they described, a truthful answer pattern for each, and something credible to say when they do not know the answer yet — without inventing any part of their situation.',
    guard: router.outputGuard,
    userLanguage: body.userLanguage || body.userLocale,
    locale: body.userLocale || '',
  });
}

// ════════════════════════════════════════════════════════════
// POST /heckler-prep — Anticipate the Hard Questions
// ════════════════════════════════════════════════════════════
router.post('/heckler-prep', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  const startedAt = Date.now();
  try {
    const { topic, audience, proposal, knownObjections, stakes, userLanguage } = req.body;

    if (!topic?.trim()) {
      return res.status(400).json({ error: 'Tell us what you\'re presenting or proposing.' });
    }

    const stakesConfig = {
      low:      { count: 5, brutalMin: 1 },
      moderate: { count: 7, brutalMin: 1 },
      high:     { count: 10, brutalMin: 2 },
    };
    const { count: questionCount, brutalMin } = stakesConfig[stakes] || stakesConfig.moderate;

    const systemPrompt = `You are a rigorous presentation Q&A coach. Your job is to pressure-test the user's case without inventing facts about their situation, audience, organization, history, evidence, motives, or likely reactions. Generate difficult but plausible questions, then help the user prepare truthful, concise answers. Return ONLY valid JSON.

GROUNDING RULES
- Treat only the user's TOPIC, AUDIENCE, ASKING FOR, KNOWN OBJECTIONS, and STAKES as facts.
- Never invent prior promises, past performance, budget conditions, board history, test scope, vendor relationships, timelines, evidence, internal politics, audience beliefs, or facts not supplied.
- A hard question may challenge an unknown, but must frame it as a question rather than assert the unknown as fact.
- Do not claim to know the audience's psychology or hidden motives. Describe what a question tests: evidence, feasibility, tradeoffs, trust, accountability, values, or decision risk.
- Never put invented facts into a model answer. If the answer depends on missing information, say what the presenter should verify or bring.
- Do not coach bluffing, evasion, false certainty, or unsupported reassurance.

ANSWER COACHING
- model_answer is a grounded answer pattern the user can adapt, not a fabricated answer. Use bracketed placeholders such as [the evidence], [the timeline], or [what we can defer] when a fact is missing.
- if_you_dont_know gives a short, credible response for the room: acknowledge the gap, say what you can answer now, and state the specific follow-up needed. Do not invent a follow-up deadline unless the user supplied one.
- dont_say identifies a tempting response pattern to avoid; do not put words or attitudes in the user's mouth.

QUESTION QUALITY
- Questions should be distinct, specific to the supplied case, and decision-relevant.
- Make them challenging without turning them into theatrical hostility.
- Gotcha questions may expose a real tension or contradiction in the supplied facts; never manufacture a contradiction.
- Emotional questions may test trust, accountability, or confidence, but must not assert unsupplied failures or motives.
- Escalate difficulty by increasing decision pressure and precision, not by inventing accusations.

OPENING MOVE
- Only recommend preempting an objection that is explicit in the user's input or directly follows from the ask itself.
- If no grounded opening move is warranted, return null.

CURVEBALL
- The curveball must come from a plausible decision angle not already covered. It may surface an unknown, but may not assert an unsupplied fact.

CONFIDENCE NOTE
- Base encouragement only on something actually present in the user's input or generated prep. Never invent an advantage, document, evidence base, or audience reaction.`;

    // The questions array is the whole cost — at high stakes it is 10 entries of
    // 7 fields, and the golden case measured 64-69s, past the ~60s where Safari
    // abandons the fetch. A key-wise split cannot help (everything else is four
    // short strings), so the array itself is partitioned — by question TYPE, so
    // the two halves cannot ask the same question twice. Merged, re-sorted into
    // the escalating order the tool promises, and renumbered.
    const splitA = Math.ceil(questionCount / 2);
    const splitB = questionCount - splitA;
    const brutalA = Math.ceil(brutalMin / 2);
    const brutalB = brutalMin - brutalA;

    // The merge below sorts on `difficulty`, and the frontend colour-codes the
    // badge off it — so it has to stay the English enum. withLanguage translates
    // JSON string VALUES, which would otherwise hand both a German word.
    const DIFFICULTY_RULE = 'The "difficulty" field must be EXACTLY one of moderate, hard, brutal — lowercase English, never translated. Every other string is written in the user\'s language as normal.';

    const brief = `TOPIC: ${topic}
AUDIENCE: ${audience || 'not specified'}
${proposal ? `ASKING FOR: ${proposal}` : ''}
${knownObjections ? `KNOWN OBJECTIONS: ${knownObjections}` : ''}
STAKES: ${stakes || 'moderate'}

You are producing ONE PART of the prep. Another sparring partner is producing the other part — stay strictly inside the question types assigned to you so you cannot both ask the same thing.`;

    const questionShape = `    {
      "number": 1,
      "difficulty": "moderate | hard | brutal",
      "type": "One of the question types assigned to you",
      "question": "Exact question in audience voice. Blunt and specific.",
      "real_concern": "What this question is testing, in one sentence. Do not claim hidden motives or psychology.",
      "model_answer": "2-3 sentences. A truthful answer pattern using only supplied facts; use [bracketed placeholders] for missing facts.",
      "if_you_dont_know": "1-2 sentences the presenter can say if the needed fact is not known yet. Acknowledge the gap without bluffing and name the specific follow-up needed.",
      "dont_say": "A short response pattern to avoid because it sounds evasive, defensive, absolute, or unsupported."
    }`;

    // ── Part A: the questions that come at the argument itself ──
    const analyticalPrompt = `${brief}

YOUR PART: exactly ${splitA} questions, and ONLY of these types: Data/Logic, Practical, Political.

Return ONLY valid JSON with EXACTLY this one top-level key:
{
  "questions": [
${questionShape}
  ]
}

Generate exactly ${splitA} questions, escalating in difficulty.${brutalA > 0 ? ` At least ${brutalA} must be 'brutal'.` : ''} Every question must be a Data/Logic, Practical or Political question — never Emotional, Gotcha or Values. Number them 1 to ${splitA}.

${DIFFICULTY_RULE}`;

    // ── Part B: the questions that come at the person, plus the framing ──
    const humanPrompt = `${brief}

YOUR PART: exactly ${splitB} questions, and ONLY of these types: Emotional, Gotcha, Values — plus the framing around the whole session.

At least one of your questions must be a Gotcha that tests a real tension in the supplied case without inventing a contradiction, and at least one must be Emotional (about trust, accountability, or values rather than data).

Return ONLY valid JSON with EXACTLY these four top-level keys:
{
  "questions": [
${questionShape}
  ],
  "situation_read": "2 sentences identifying the main pressure points created by the supplied topic, ask, objections, audience, and stakes. Do not invent what the audience believes or what has happened before.",
  "the_curveball": {
    "question": "One unexpected question from an angle they didn't prepare for.",
    "how_to_handle": "2 sentences."
  },
  "opening_move": "One grounded sentence to say at the start that directly acknowledges the biggest explicit objection, or null if the input does not support one.",
  "confidence_note": "One sentence of grounded encouragement based only on the user's supplied facts or the preparation completed here."
}

Generate exactly ${splitB} questions, escalating in difficulty.${brutalB > 0 ? ` At least ${brutalB} must be 'brutal'.` : ''} Every question must be an Emotional, Gotcha or Values question — never Data/Logic, Practical or Political. Number them 1 to ${splitB}.

${DIFFICULTY_RULE}`;

    const systemSuffix = withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion) + ' Never place a double-quote (") character inside any JSON string value — write quoted questions or phrases plainly or with single quotes, or it breaks the JSON.';
    const maxTokensByStakes = { low: 1400, moderate: 2000, high: 3200 };
    const halfBudget = maxTokensByStakes[stakes] || 1600;
    const [analytical, human] = await Promise.all([
      callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: halfBudget,
        system: withLanguage(systemPrompt, userLanguage) + systemSuffix,
        messages: [{ role: 'user', content: analyticalPrompt }],
      }, { label: 'heckler-prep:analytical' }),
      callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: halfBudget + 600,
        system: withLanguage(systemPrompt, userLanguage) + systemSuffix,
        messages: [{ role: 'user', content: humanPrompt }],
      }, { label: 'heckler-prep:human' }),
    ]);

    // Both halves number from 1, and each escalates on its own. Restore the
    // single escalating list the tool promises before the frontend sees it.
    const RANK = { moderate: 0, hard: 1, brutal: 2 };
    const merged = [
      ...(Array.isArray(analytical.questions) ? analytical.questions : []),
      ...(Array.isArray(human.questions) ? human.questions : []),
    ]
      .sort((a, b) => (RANK[a?.difficulty] ?? 0) - (RANK[b?.difficulty] ?? 0))
      .map((q, i) => ({ ...q, number: i + 1 }));

    const parsed = { ...human, questions: merged };

    if (!parsed.questions || !parsed.questions.length) {
      return res.status(500).json({ error: 'Could not generate your prep questions. Please try again.' });
    }
    await guardHecklerPrep(parsed, req.body, startedAt);
    return res.json(parsed);

  } catch (error) {
    console.error('HecklerPrep error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// Reviewed against backend/lib/outputStandard.js on 2026-08-30, as part of the
// v2 rewrite. The clauses this tool leans on hardest are §3 (progress under
// uncertainty) and §5 (a recovery path): if_you_dont_know and the bracketed
// placeholders are what let a presenter act on a question they cannot fully
// answer yet. See PF-39.
router.outputStandard = 'v2';
router.outputGuard = {
  prohibit: [
    'states_a_fact_about_the_organisation_history_or_finances_the_user_did_not_supply',
    'claims_what_the_audience_thinks_fears_wants_or_will_do_as_known',
    'asserts_evidence_a_document_a_figure_or_a_timeline_that_was_never_mentioned',
    'writes_real_concern_as_hidden_motive_or_psychology_rather_than_what_the_question_tests',
    'builds_a_gotcha_on_a_contradiction_not_present_in_the_supplied_facts',
    'coaches_bluffing_evasion_or_unsupported_reassurance',
  ],
  require: [
    'every_question_carries_if_you_dont_know',
    'missing_facts_marked_with_bracketed_placeholders',
    'fulfills_tool_promise',
  ],
};

module.exports = router;
