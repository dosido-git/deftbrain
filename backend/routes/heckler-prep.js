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
4. A real_concern written as the questioner's motive, feeling, strategy or
   psychology rather than as what the question tests or requires an answer to.
   The hostile premise inside a generated question is a challenge to prepare
   for, never a fact: nothing elsewhere in the output may treat it as something
   the user admitted, acknowledged, did, knew, promised or decided.
   And nothing may put a claim, promise, concession, commitment, procedural
   assurance or guarantee in the user's mouth — about what is decided, what is
   negotiable, what authority they hold, what data exists, what the
   organisation will do, or what the audience's input can change — unless the
   input supports it.
5. A gotcha built on a contradiction that is not actually present in the
   supplied facts.
6. Encouragement in confidence_note resting on an advantage, an evidence base
   or an audience reaction that was never supplied.
7. A situation_read that characterises the audience, the user, the proposal or
   the organisation — "a cost-focused C-suite", "a reactive spend" — rather
   than naming the tensions the supplied facts actually create. Adversarial
   framing belongs inside the questions, not in the tool's own analysis.
8. A question made harder by inventing a circumstance rather than by pressing
   on a supplied one: a budget process that was bypassed, prior knowledge that
   was concealed, a legal or disclosure obligation nobody mentioned. The
   premise may interpret known facts; it may not require new ones to be true.
9. ANY concrete factual detail that did not come from the input and is not
   presented as an unknown to find out — a duration, a frequency, a distance,
   a cost, a quantity, a policy, a legal right, a precedent, what the
   organisation normally does, what happened somewhere comparable. "During its
   two-hour visit" is a violation when no duration was supplied; asking how
   long each visit lasts is not. Questions may be invented. Facts may not.`,
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

FACT BOUNDARY — APPLIES TO THE ENTIRE OUTPUT
You may invent questions. You may not invent facts.
The user's TOPIC, AUDIENCE, ASKING FOR, KNOWN OBJECTIONS and STAKES are the only facts. Every concrete detail in the output comes from those, or is presented as an unknown to find out — dates, times, durations, frequencies, distances, costs, quantities; policies, procedures, legal rights, institutional practices; prior promises, past performance, budget conditions, board history, test scope, vendor relationships, timelines, evidence, internal politics; what alternatives were considered; what an organisation normally does; what happened in comparable situations; characteristics of the audience or the people affected.
Never add a plausible detail to make a question sharper. Turn the missing detail into the question instead. A fabricated fact can be qualitative as well as quantitative: do not invent affected groups, causes, rationales, constraints, organisational motives or decision criteria merely because they are plausible.
Not "How many people can realistically use the van during its two-hour visit?" — ask "How long will each van visit last, and how many people can realistically use it during that time?"
Not "A branch open five days a week means..." — ask "How does the access provided by a fortnightly van compare with the access residents have at the branch now?"
Not "Every branch that has ever been closed..." — ask "What precedent does closing Aldergate set for other branch libraries?"
This binds three places in particular.
- A QUESTION may challenge, accuse, doubt, pressure or test the user, but out of supplied facts. Its premise may interpret what is known; it may not require new facts to be true. Ask "Why is this coming to us now rather than earlier?" — not "Why did you bypass the normal budget process?", unless a process and its bypass were supplied. Ask "What responsibility does your team take for not identifying these gaps sooner?" — not "Who knew about these gaps and concealed them?", unless prior knowledge was supplied. Legal, regulatory, contractual and disclosure obligations are facts like any other: never invent one to raise the stakes.
- A MODEL ANSWER never contains an invented fact, and never puts a claim, promise, concession, commitment, procedural assurance or guarantee in the user's mouth — about what is decided, what stays negotiable, what authority they hold, what data exists, what the organisation will do, what can be guaranteed, or what the audience's input can change. Where a fact is missing, say what the presenter should verify or bring.
- NO COACHING toward bluffing, evasion, false certainty or unsupported reassurance.
Before returning, inspect every number, factual comparison, historical claim, procedural claim and concrete detail. If the user did not supply it, remove it or turn it into something the presenter needs to find out.

HOSTILE PREMISES ARE NOT FACTS
The questions may carry skeptical, adversarial, accusatory or even unfair premises that a real audience member could plausibly raise. Do not adopt those premises as established fact anywhere else in the output. Keep three things distinct: facts the user supplied, objections or allegations the user supplied, and plausible challenges generated here for preparation.
Never convert a generated challenge into something the user 'admitted', 'acknowledged', 'did', 'knew', 'promised' or 'decided' unless their input establishes it. A hard question may ask 'Isn't this consultation already a done deal?'. It may not say 'You have admitted this consultation is a done deal' unless the user actually supplied that admission.

PRESERVE THE SOURCE OF USER INPUT
Each field carries a different epistemic role, and the role travels with the content.
- PRESENTING / PROPOSING is what the user says they are presenting.
- AUDIENCE is what the user says about the audience.
- ASK is what the user says they are requesting.
- KNOWN OBJECTIONS are claims, criticisms, concerns or challenges the user expects to face. They stay attributed objections unless something else in the input independently supports them.
An objection the user expects is not something the user agrees with, admits, believes, or has stated anywhere. Never turn one into "your own admission", "you stated internally", "you acknowledge", "you know", or a settled fact. It may be quoted, attributed, made conditional, or turned into a hostile question — those are all faithful to what it is.

SCENARIO DIAGNOSIS MUST REMAIN NEUTRAL
situation_read is the tool's own analysis, not an adversarial voice. It may name tensions the supplied facts actually create, likely areas of scrutiny, and how the ask relates to the objections the user already expects. It may not characterise the audience, the user, the proposal, the organisation or the situation with an interpretation the user did not supply. Describe what the supplied facts make likely to be questioned. Do not describe what the audience thinks, feels, believes, trusts, distrusts, wants or intends unless the user supplied it. Keep adversarial framing inside the generated questions.
Do not write "You are asking a cost-focused C-suite to approve a reactive spend." Write "You are asking the CFO, COO and CTO to approve a 40% increase next quarter, and you already expect questions about timing, size, accountability, alternatives and ROI."

EXPLAIN THE CHALLENGE, NOT THE QUESTIONER
Do not infer the questioner's emotions, motives, personality, strategy, politics or psychological state. Explain what the question tests, exposes, challenges, or requires the presenter to answer — evidence, feasibility, tradeoffs, trust, accountability, values, decision risk. Write 'what this is testing', 'what you need to address', 'the issue underneath the question'; never 'psychology', 'why they're really asking', 'what they're feeling', 'what they actually want'.

ANSWER COACHING
- model_answer is a grounded answer pattern the user can adapt, not a fabricated answer. Use bracketed placeholders such as [the evidence], [the timeline], or [what we can defer] when a fact is missing.
- if_you_dont_know gives a short, credible thing to say in the room when the fact is not known: name the gap plainly and say what can be answered now. It must not commit the presenter to anything — no undertaking to find out, follow up, report back, publish, provide, or return by a date. Naming what would answer the question is fine ("that needs the per-visit figures"); undertaking to produce it is the presenter's decision to make, not ours to script. "If you do not know the publication arrangements, say so. Do not guess or imply openness you cannot guarantee."
- dont_say identifies a tempting response pattern to avoid; do not put words or attitudes in the user's mouth.

QUESTION QUALITY BEFORE CATEGORY COVERAGE
- Write the strongest realistic question first, then assign its type. Never distort a question to fill a category — Emotional, Political, Values, Practical, Gotcha. If a scenario naturally yields several strong Data/Logic questions and no credible Emotional one, that is the better output; a manufactured Emotional question ("walk me through how you would feel standing here in six months") is one no real executive asks, and it wastes a slot the room would have used on something sharper.
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
- how_to_handle says how to meet the question, not what to promise in answer to it. The same bar as if_you_dont_know: no commitment the user has not chosen to make.

CONFIDENCE NOTE
- Base encouragement only on something actually present in the user's input or generated prep. Never invent an advantage, document, evidence base, or audience reaction.

IN SHORT
Invent the questions. Not the facts.
Attack what is known. Ask about what isn't.
Never answer an unknown on the user's behalf.`;

    // Partitioned by SUBJECT ANGLE, not by schema category. Category-based
    // halves made the label dictate the question — half B had to produce an
    // "Emotional" question whether or not the scenario had one, which is how
    // "walk me through how you would feel standing here in six months" reached
    // a CFO. Angles are just as disjoint, so the halves still cannot collide,
    // and the type is assigned after the question is written.
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
      "type": "A short label for what kind of question this is, written after the question — e.g. Data/Logic, Practical, Political, Trust, Accountability, Values, Gotcha. Describe the question you wrote; never write a question to fit a label.",
      "question": "Exact question in audience voice. Blunt and specific.",
      "real_concern": "What this question tests, exposes, or requires you to address, in one sentence. Not the questioner motive, feeling or strategy.",
      "model_answer": "2-3 sentences. A truthful answer pattern using only supplied facts; use [bracketed placeholders] for missing facts.",
      "if_you_dont_know": "1-2 sentences the presenter can say if the needed fact is not known yet. Acknowledge the gap without bluffing and name the specific follow-up needed.",
      "dont_say": "A short response pattern to avoid because it sounds evasive, defensive, absolute, or unsupported."
    }`;

    // ── Part A: the questions that come at the argument itself ──
    const analyticalPrompt = `${brief}

YOUR PART: exactly ${splitA} questions, and ONLY about THE CASE ITSELF — whether the proposal stands up. Its numbers, evidence, cost, feasibility, timing, scope, execution and the alternatives to it.

Return ONLY valid JSON with EXACTLY this one top-level key:
{
  "questions": [
${questionShape}
  ]
}

Generate exactly ${splitA} questions, escalating in difficulty.${brutalA > 0 ? ` At least ${brutalA} must be 'brutal'.` : ''} Every question must be about the case itself, never about accountability, precedent, trust or consequences — another pass covers those. Write the strongest realistic question first and label its type afterwards; the label describes the question, it does not choose it. Number them 1 to ${splitA}.

${DIFFICULTY_RULE}`;

    // ── Part B: the questions that come at the person, plus the framing ──
    const humanPrompt = `${brief}

YOUR PART: exactly ${splitB} questions, and ONLY about WHAT FOLLOWS FROM IT — accountability, decision rights, precedent, trust, what happens if it goes wrong, and what approving it signals. Plus the framing around the whole session.

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

Generate exactly ${splitB} questions, escalating in difficulty.${brutalB > 0 ? ` At least ${brutalB} must be 'brutal'.` : ''} Every question must be about what follows from the proposal, never about its numbers, feasibility or execution — another pass covers those. A question in this half may still be evidential in character: "if we spend this and are breached anyway, how will we know it reduced our risk?" belongs here and is not an Emotional question. Write the strongest realistic question first and label its type afterwards; the label describes the question, it does not choose it. Number them 1 to ${splitB}.

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
    'treats_a_generated_challenge_as_something_the_user_admitted_did_promised_or_decided',
    'scripts_a_claim_promise_concession_commitment_or_guarantee_the_input_does_not_support',
    'commits_the_presenter_to_find_out_follow_up_report_back_publish_or_provide',
    'treats_a_known_objection_as_the_users_own_admission_belief_or_established_fact',
    'situation_read_characterises_the_audience_user_or_organisation_beyond_the_supplied_facts',
    'a_question_invents_a_procedure_obligation_event_or_prior_decision_to_raise_the_stakes',
    'states_a_concrete_detail_the_user_did_not_supply_number_duration_frequency_cost_distance_or_precedent',
    'describes_what_the_audience_thinks_feels_believes_trusts_wants_or_intends',
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
