const express = require('express');
const router = express.Router();
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

// Two model calls already ran. If they were slow, the visitor has waited long
// enough — return the prep unguarded rather than spend another check budget.
// Two generation calls already ran. Past this, the visitor has waited long
// enough that a third is worse than an unedited draft.
const EDIT_ENTRY_MS = Number(process.env.HP_EDIT_ENTRY_MS || 75_000);
// The editor returns the WHOLE response, so it needs the generation's headroom.
const EDIT_MAX_TOKENS = Number(process.env.HP_EDIT_MAX_TOKENS || 8000);

// Guards the text the presenter will say out loud or lean on in the room. The
// failure mode here is not an unanswerable question — it is a fluent, confident
// answer built on a fact nobody supplied: a prior promise, a past overrun, a
// board's opinion, a document that does not exist. A presenter who repeats one
// of those in front of the people who know better is worse off than if the tool
// had said nothing.
// PASS 2 — the grounding edit.
//
// One pass cannot both invent ten hostile questions and police every premise it
// invented to land them. Tested repeatedly: sometimes the audit holds, and on
// the next generation the creative mandate wins and the output asserts a
// reporter's motives, an affected group nobody mentioned, alternatives that were
// "formally assessed", or something the presenter will have said later tonight.
// The capability that makes this tool worth using is exactly what makes it
// unsafe to ground in the same breath.
//
// So the heckler swings hard in pass 1, and a separate, colder call removes
// whatever it had to invent to land the punch. The editor is told it is NOT
// making anything sharper — that instruction is the whole point, because
// "improve this" is what produced the invention in the first place.
//
// It returns the edited object or nothing: a malformed or truncated edit falls
// back to the draft, which is grounded imperfectly rather than broken entirely.
async function enforceSuppliedFacts(draft, body, startedAt, half) {
  if (Date.now() - startedAt > EDIT_ENTRY_MS) {
    console.log(`[heckler-prep] grounding edit (${half}): skipped — out of time, draft returned unedited`);
    return draft;
  }
  const prohibited = (router.outputGuard.prohibit || []).map(x => `- ${x.replace(/_/g, ' ')}`).join('\n');

  const editorSystem = `You are a grounding editor. You are NOT trying to make this output sharper, more dramatic, more specific or more persuasive — that impulse is what put the errors in. You remove what the writer had to invent, and you change nothing else.

Return the SAME JSON object with the same keys, the same number of questions, and the same question numbering. Never place a double-quote (") character inside a JSON string value. Return ONLY the JSON.`;

  const editorPrompt = `THE USER'S ACTUAL INPUT — the complete set of established facts:
PRESENTING / PROPOSING: ${(body.topic || '').trim() || '(not given)'}
AUDIENCE: ${(body.audience || '').trim() || '(not given)'}
ASK: ${(body.proposal || body.askingFor || '').trim() || '(not given)'}
KNOWN OBJECTIONS — things the user EXPECTS TO FACE, not things they believe or admit: ${(body.knownObjections || body.objections || '').trim() || '(none given)'}
STAKES: ${(body.stakes || '').trim() || '(not given)'}

Nothing else about their organisation, its history, its finances, its people, this audience, or what anyone thinks or intends is known.

Compare EVERY sentence of the draft below against that input. For every user-specific claim or concrete detail, classify it:

SUPPORTED — directly supplied above.
OBJECTION — supplied only under KNOWN OBJECTIONS.
HYPOTHETICAL — clearly introduced as an invented "if" condition.
UNSUPPORTED — anything else.

Then rewrite by these rules:
- SUPPORTED may remain factual.
- OBJECTION must remain attributed, conditional or interrogative. Never convert it into the user's knowledge, admission, belief or a fact. "The audience already expects the decision is made" is fine; "you came in here knowing the branch is closing" is not.
- HYPOTHETICAL may remain only where it is visibly hypothetical and useful. Strip unnecessary invented specificity — "in a year's time", "up to fourteen days", "in the next 12 months" — when no such period was supplied.
- UNSUPPORTED: remove it, or turn the missing information into a question.

REMOVE ALL INVENTED:
- people or affected groups (residents without cars, older residents, children travelling alone)
- audience beliefs, feelings, motives or intentions (a reporter who "has every reason to", a room that "is sceptical")
- reasons or rationales
- costs, durations, schedules, distances, quantities
- alternatives supposedly considered, or said to have been "formally assessed"
- procedures, precedents, legal or formal claims
- future conversation history — anything the user will have said tonight, any answer to another question, any commitment they will make
- promises or commitments in the user's mouth
${prohibited}

Do not replace a removed detail with a different invented detail. Preserve the difficulty by attacking what IS known, or by asking about what is not.

FINAL TEST — apply to your edited version:
1. Could every declarative user-specific statement be highlighted in the user's input above? If not, rewrite it.
2. Could every known objection still be recognised as an objection rather than a fact? If not, rewrite it.
3. Could this be handed to the user BEFORE the event without pretending anything has already happened? If not, rewrite it.

DRAFT TO EDIT:
${JSON.stringify(draft)}`;

  try {
    const edited = await callClaudeWithRetry({
      model: MODELS.FAST,
      max_tokens: EDIT_MAX_TOKENS,
      temperature: 0,
      system: withLanguage(editorSystem, body.userLanguage),
      messages: [{ role: 'user', content: editorPrompt }],
    }, { label: `heckler-prep:grounding-edit:${half}`, maxRetries: 0 });

    // An edit that lost questions, or came back the wrong shape, is worse than
    // the draft. Only accept a result that still looks like the same response.
    const ok = edited
      && Array.isArray(edited.questions)
      && edited.questions.length === (draft.questions || []).length
      && edited.questions.every(q => q && typeof q.question === 'string' && q.question.trim())
      // the framing lives on one half only; if the draft had it, the edit must too
      && (typeof draft.situation_read !== 'string' || typeof edited.situation_read === 'string');
    if (!ok) {
      console.log(`[heckler-prep] grounding edit (${half}): rejected — shape changed, draft returned`);
      return draft;
    }
    console.log(`[heckler-prep] grounding edit (${half}): applied over ${edited.questions.length} question(s)`);
    return edited;
  } catch (err) {
    console.log(`[heckler-prep] grounding edit (${half}): failed — ${err.message} — draft returned`);
    return draft;
  }
}

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
DO NOT INVENT FUTURE CONVERSATION HISTORY
Every question has to be answerable as preparation, before the event happens. Do not invent something the user will have said earlier in the meeting, an answer they supposedly gave to another generated question, an admission or concession or commitment they will make, or something an audience member will already have established during the event. Each question stands on the supplied facts and the attributed objections as they exist NOW.

HYPOTHETICALS MAY INVENT CONDITIONS, NOT FACTS
A hostile question may create a clearly hypothetical future condition in order to test the proposal, and should. "If we approve this and a breach still occurs, how would you evaluate whether this investment succeeded?" is a good question: the hypothetical is visibly introduced by IF.
What it may not do is smuggle specifics in with it. Do not attach invented dates, deadlines, quantities, procedures or outcomes unless the detail is necessary to the hypothetical. Not "if we're breached in the next 12 months" when no twelve-month period was supplied. Not "if the gaps aren't closed by the end of Q3" when no Q3 deadline exists. Not "if it is cut within two years" when no horizon was given — a number spelled as a word is still a number.
And never use "presumably", "probably" or the like to introduce an invented present-day fact; that is not a hypothetical, it is a guess wearing one. Where the missing fact itself matters, ask for it.

PROVENANCE — WHERE EVERY CLAIM CAME FROM
Each input field carries an epistemic role, and the role travels with the content.
- PRESENTING / PROPOSING, AUDIENCE, ASK and STAKES are what the user says. They may be stated as supplied.
- KNOWN OBJECTIONS are claims, criticisms, concerns or challenges the user EXPECTS TO FACE. They stay attributed objections unless something else in the input independently supports them.
- A question generated here is a challenge to prepare for. It is not evidence of anything.
An objection the user expects, and a challenge you invent, are both things that have not happened. Neither may become something the user admits, acknowledges, knows, believes, said internally or publicly, already answered, or conceded. Either may be quoted, attributed, made conditional, or turned into a hostile question — those are all faithful to what it is.
A question may ask "Isn't this consultation already a done deal?". Nothing anywhere in the output may say "You have acknowledged the decision is already taken" unless the user supplied that acknowledgement.

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
- It NAMES the concerns and commits to nothing. It may not claim a capability the user has not established — "I can tell you what is and is not still genuinely open" asserts knowledge and authority nobody supplied. Acknowledge, then stop: "Before we go further, I want to acknowledge two concerns I know are likely to come up: the earlier cuts and the promise about this branch, and whether this consultation can meaningfully affect what happens next. I don't want to sidestep either." No invented answer.
- If no grounded opening move is warranted, return null.

CURVEBALL
- The curveball must come from a plausible decision angle not already covered. It may surface an unknown, but may not assert an unsupplied fact.
- how_to_handle says how to meet the question, not what to promise in answer to it. The same bar as if_you_dont_know: no commitment the user has not chosen to make.
- The curveball is where high-stakes invention creeps in. Never assert the legal, regulatory or procedural status of anything — "a legal formality to protect the council from challenge", "consultation has a formal purpose even when a direction is set" are claims the input did not establish. A safe curveball puts the pressure somewhere real: "There is a local reporter in the room. If tomorrow's headline says 'Council admits decision already made at library consultation', what would your response be?" — and the coaching says: be precise about what you actually know is still open and what is not; if you do not know the formal or legal status of this process, do not characterise it, and find out before the meeting.

CONFIDENCE NOTE
- Base encouragement only on something actually present in the user's input or generated prep. Never invent an advantage, document, evidence base, or audience reaction — including what the audience is watching for, hoping for, or will judge them on. "Residents are watching whether you can be specific and honest" is mind-reading with a kind face: the residents are supplied, what they are watching is not.

FINAL FACT AND PROVENANCE AUDIT — MANDATORY
Before returning the response, inspect EVERY sentence: the scenario diagnosis, the opening statement, all the questions, every label and explanation, the curveball, all coaching, and the closing encouragement.

For every factual or user-specific claim, identify its source — P (proposal/presenting), A (audience), K (ask), O (known objection), S (stakes).
P, A, K and S may be stated as supplied.
An O may ONLY be attributed as an objection or concern, made conditional, or turned into a question. An O may NEVER become something the user admits, acknowledges, knows, believes, said internally or publicly, already answered, or conceded — unless independently established by P, A, K or other explicit user text.

For every concrete detail, ask: DID THE USER SUPPLY THIS? If no, remove it or turn the missing fact into a question. A hypothetical condition openly introduced by IF is not a supplied fact and does not need to be one — but any date, deadline, quantity or procedure inside it does, unless the detail is genuinely necessary to the hypothetical. Do not rescue an invented detail with "presumably", "likely", "probably", "typically", "perhaps", "may have" or "would normally". Plausibility is not evidence.

For every scripted statement or coached answer, ask: CAN I KNOW THE USER CAN TRUTHFULLY SAY THIS? If no, do not put it in their mouth.

For every high-stakes legal, regulatory, medical, financial, procedural or policy claim, ask: IS THIS ESTABLISHED BY THE USER'S INPUT? If no, frame it as something to verify, never as the answer.

If any sentence fails this audit, rewrite it before returning the response.

INVENT THE QUESTIONS. NOT THE FACTS.
ATTACK WHAT IS KNOWN. ASK ABOUT WHAT ISN'T.
KNOWN OBJECTIONS REMAIN OBJECTIONS.
NEVER ANSWER AN UNKNOWN ON THE USER'S BEHALF.`;

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
    // Each half is edited the moment it resolves, so pass 2 overlaps the other
    // half's generation instead of waiting for both. Half the output per editor
    // call, and the two run concurrently.
    const [analytical, human] = await Promise.all([
      callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: halfBudget,
        system: withLanguage(systemPrompt, userLanguage) + systemSuffix,
        messages: [{ role: 'user', content: analyticalPrompt }],
      }, { label: 'heckler-prep:analytical' }).then(d => enforceSuppliedFacts(d, req.body, startedAt, 'analytical')),
      callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: halfBudget + 600,
        system: withLanguage(systemPrompt, userLanguage) + systemSuffix,
        messages: [{ role: 'user', content: humanPrompt }],
      }, { label: 'heckler-prep:human' }).then(d => enforceSuppliedFacts(d, req.body, startedAt, 'human')),
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
    'invents_something_said_or_conceded_earlier_in_the_meeting_or_in_answer_to_another_question',
    'asserts_a_legal_regulatory_or_procedural_status_the_input_did_not_establish',
    'situation_read_characterises_the_audience_user_or_organisation_beyond_the_supplied_facts',
    'a_question_invents_a_procedure_obligation_event_or_prior_decision_to_raise_the_stakes',
    'attaches_an_invented_date_deadline_quantity_or_horizon_to_a_hypothetical',
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
