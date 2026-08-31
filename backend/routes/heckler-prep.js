const express = require('express');
const router = express.Router();
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

// The two-pass grounding editor that lived here until 2026-08-31 — the
// deterministic objectionLeaks() and inventedStakeholders() checkers and the
// colder editor they fed — is gone with the v3 rewrite, which enforces the
// same rules through the ledger instead. It is in git if the regex checks
// turn out to have been catching something the validator does not.

// Heckler Prep v3 — provenance-first pipeline.
//
// Pass 1 extracts a closed evidence ledger from the raw form.
// Pass 2 writes questions from that ledger — it never sees the raw form.
// Pass 3 validates every user-facing component against the ledger and repairs
// only the failing component. Facts may be weaponized; objections may be
// attributed/questioned/conditionalized; unknowns may be exposed, never filled.

const GENERATOR_SYSTEM = `You are Heckler Prep, an adversarial presentation-preparation tool.

Your job is to prepare someone for the hardest credible questions they may face when presenting, pitching, proposing, defending, or explaining something. Be sharp, skeptical, specific, and useful.

THE EVIDENCE LEDGER IS AUTHORITATIVE
You receive FACTS, OBJECTIONS, and UNKNOWNS. Treat that ledger as the complete factual universe for this scenario. Do not reconstruct, expand, embellish, or supplement the situation from general knowledge, examples, prior generations, or assumptions.

FACTS may be stated directly, but never strengthened. Preserve who, what, when, why, frequency, responsibility, causation, promises, and decisions exactly at the supplied level of assertion.

OBJECTIONS ARE NOT FACTS. An objection may appear only as: (1) attributed — 'one objection you expect is...'; (2) conditional — 'if critics are right that...'; or (3) questioned — 'is the decision already largely made?'. Never promote an objection into a fact, admission, knowledge, belief, acknowledgement, or event.

UNKNOWNS ARE QUESTIONS, NOT BLANKS TO FILL. Never fill an unknown with a plausible answer, example, circumstance, stakeholder, process, timeline, motive, or consequence. Ask about it instead.

GENERAL REASONING may generate a question. GENERAL KNOWLEDGE may not supply a scenario-specific premise. A closure can prompt a question about savings; it does not authorize assuming staffing, opening hours, internet terminals, leases, or costs.

DELETE BEFORE YOU INVENT. For every detail not supported by a FACT: if removing it does not weaken the question, delete it. If it matters, make the missing information the question. Use a hypothetical only when necessary to stress-test the proposal, and use the minimum condition necessary.

Do not invent people, stakeholders, organizations, teams, boards, auditors, reporters, demographic or transport circumstances, schedules, dates, durations, prices, costs, percentages, contracts, policies, processes, prior/future conversations, alternatives considered, motives, beliefs, reactions, trust/distrust, responsibility, accountability structures, causation, history, consequences, or future events.

Do not use 'presumably', 'probably', 'apparently', 'likely', 'obviously', or 'clearly' to turn an unknown into a premise.

RESPONSIBILITY ESCALATION IS FORBIDDEN. 'We did not catch/know/identify X earlier' does not mean 'your team failed to find X', 'your team was responsible for detecting X', 'your team should have prevented X', or 'an external process found what your team failed to find'.

QUESTION QUALITY
Generate the hardest CREDIBLE questions, not the most theatrical. Difficulty comes from evidence gaps, assumptions, tradeoffs, alternatives, implementation, cost, timing, consequences, measurement, accountability, reversibility, precedent, internal consistency, and what could change the decision — never from fabricated misconduct, motives, history, or consequences.

SCENARIO DIAGNOSIS
Identify pressure points created by FACTS, explicitly attributed OBJECTIONS, and important UNKNOWNS. Do not diagnose audience psychology or state what they think, feel, believe, trust, distrust, want, or intend unless that is a FACT.

OPENING
Acknowledge FACTS and the existence of OBJECTIONS without conceding that an objection is true. Never invent prior or future statements, admissions, promises, or decisions.

COACHING
real_concern explains what the question tests, not the questioner's hidden motive. model_answer is a truthful answer pattern using only FACTS; use [bracketed placeholders] for missing facts. if_you_dont_know names the gap without bluffing or committing the presenter to follow up. dont_say identifies an evasive, defensive, absolute, or unsupported response pattern without inventing an attitude the user has.

CURVEBALL
Use only supplied FACTS plus clearly conditional hypotheticals. Never introduce a stakeholder merely for drama.

CLOSING
Give one grounded preparation insight. No generic congratulations such as 'you've got this', 'you're ready', or 'you've done the hard work'.

PROVENANCE
Every user-facing component must carry hidden fact_ids, objection_ids, and unknown_ids. Cite only IDs that actually support the component. Do not invent IDs.

FINAL CHECK
For every scenario-specific factual premise ask: Which FACT ID entails this? If none, delete it, turn it into a question, attribute it to an OBJECTION, or make it explicitly conditional when necessary. Then check that no FACT was strengthened, no OBJECTION became fact, no UNKNOWN was filled, and nothing was imported from another scenario.

The strongest Heckler Prep question exposes an evidence gap. It does not fill that gap for the user.
Grounding outranks cleverness. Credibility outranks drama. A shorter supported question is better than a vivid invented one.
Return ONLY valid JSON. Never place a double-quote character inside a JSON string value.`;

const EXTRACTOR_SYSTEM = `You are Heckler Prep's evidence extractor, not a writer.
Extract ONLY information explicitly supplied in the CURRENT user's form.

FACTS: propositions explicitly supplied as true in TOPIC, AUDIENCE, ASK, or STAKES. If a sentence in KNOWN OBJECTIONS contains a plainly factual clause embedded inside an objection, do NOT silently promote it; keep the whole supplied item in OBJECTIONS so the generator must attribute/question/conditionalize it.
OBJECTIONS: claims, criticisms, concerns, suspicions, arguments, and any mixed factual/critical statements supplied in KNOWN OBJECTIONS. They are not facts merely because the user expects to hear them.
UNKNOWNS: important missing information that would materially strengthen preparation. State each unknown neutrally and generally. Do not invent candidate answers or examples.

Do not infer. Do not elaborate. Do not add examples. Do not use general knowledge to complete the scenario. Do not import anything from examples or prior runs.
Return ONLY valid JSON with exactly: facts, objections, unknowns. Each item has id and text; facts also have source_field. IDs are F1..., O1..., U1.... Never place a double-quote character inside a JSON string value.`;

const VALIDATOR_SYSTEM = `You are Heckler Prep's provenance validator. You are not a creative writer.
Given ONE generated component and the complete evidence ledger, decide whether every scenario-specific factual premise is authorized.

FACTS may be stated but not strengthened.
OBJECTIONS may only be attributed, questioned, or conditionalized.
UNKNOWNS may be asked about but never filled with invented examples or answers.
General reasoning may create a question, but may not create scenario-specific facts.
A hypothetical may invent only the minimum clearly conditional premise needed to stress-test the proposal.
Reject invented people, circumstances, alternatives, processes, timelines, numbers, motives, audience psychology, prior/future dialogue, responsibility, causation, history, or consequences.
Reject words such as presumably/probably/apparently/likely when they fill a missing fact.
Reject responsibility escalation such as turning 'not caught earlier' into 'your team failed to detect'.

Return ONLY JSON:
{"pass":true,"unsupported_phrases":[],"repair_instruction":""}
or
{"pass":false,"unsupported_phrases":["..."],"repair_instruction":"Concise instruction describing only what must be removed or reframed."}`;

function ledgerText(ledger) {
  return `FACTS:\n${(ledger.facts || []).map(x => `${x.id}: ${x.text}`).join('\n') || '(none)'}\n\nOBJECTIONS:\n${(ledger.objections || []).map(x => `${x.id}: ${x.text}`).join('\n') || '(none)'}\n\nUNKNOWNS:\n${(ledger.unknowns || []).map(x => `${x.id}: ${x.text}`).join('\n') || '(none)'}`;
}

function stripProvenance(value) {
  if (Array.isArray(value)) return value.map(stripProvenance);
  if (!value || typeof value !== 'object') return value;
  const out = {};
  for (const [k, v] of Object.entries(value)) {
    if (['fact_ids', 'objection_ids', 'unknown_ids', 'hypothetical', 'hypothetical_premise'].includes(k)) continue;
    out[k] = stripProvenance(v);
  }
  return out;
}

async function validateAndRepair(component, ledger, userLanguage, localeSuffix, label) {
  const prompt = `${ledgerText(ledger)}\n\nCOMPONENT TO VALIDATE:\n${JSON.stringify(component)}`;
  try {
    const verdict = await callClaudeWithRetry({
      model: MODELS.FAST,
      max_tokens: 500,
      temperature: 0,
      system: withLanguage(VALIDATOR_SYSTEM, userLanguage) + localeSuffix,
      messages: [{ role: 'user', content: prompt }],
    }, { label: `heckler-prep:validate:${label}`, maxRetries: 0 });

    if (verdict?.pass !== false) return component;

    const repairSystem = `You are a surgical provenance editor. Rewrite ONLY the supplied Heckler Prep component to satisfy the validator. Preserve its JSON shape and purpose. Do not add replacement facts, examples, specificity, or new evidence IDs. When information is missing, ask about it instead. Facts may be stated but not strengthened. Objections must remain attributed, questioned, or conditional. Unknowns must remain unknown. Return ONLY the corrected JSON component. Never place a double-quote character inside a JSON string value.`;
    const repairPrompt = `${ledgerText(ledger)}\n\nVALIDATOR FINDING:\n${JSON.stringify(verdict)}\n\nCOMPONENT:\n${JSON.stringify(component)}`;
    const repaired = await callClaudeWithRetry({
      model: MODELS.FAST,
      max_tokens: 1600,
      temperature: 0,
      system: withLanguage(repairSystem, userLanguage) + localeSuffix,
      messages: [{ role: 'user', content: repairPrompt }],
    }, { label: `heckler-prep:repair:${label}`, maxRetries: 0 });
    return repaired || component;
  } catch (err) {
    console.log(`[heckler-prep] provenance validation ${label} failed: ${err.message}`);
    return component;
  }
}

router.post('/heckler-prep', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { topic, audience, proposal, knownObjections, stakes, userLanguage } = req.body;
    if (!topic?.trim()) return res.status(400).json({ error: 'Tell us what you\'re presenting or proposing.' });

    const stakesConfig = {
      low: { count: 5, brutalMin: 1 },
      moderate: { count: 7, brutalMin: 1 },
      high: { count: 10, brutalMin: 2 },
    };
    const { count: questionCount, brutalMin } = stakesConfig[stakes] || stakesConfig.moderate;
    const localeSuffix = withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion)
      + ' Never place a double-quote character inside any JSON string value.';

    // PASS 1 — raw form -> closed evidence ledger.
    const extractorPrompt = `TOPIC:\n${topic.trim()}\n\nAUDIENCE:\n${audience?.trim() || '(not supplied)'}\n\nASK:\n${proposal?.trim() || '(not supplied)'}\n\nKNOWN OBJECTIONS:\n${knownObjections?.trim() || '(none supplied)'}\n\nSTAKES:\n${stakes || 'moderate'}`;
    const ledger = await callClaudeWithRetry({
      model: MODELS.FAST,
      max_tokens: 1800,
      temperature: 0,
      system: withLanguage(EXTRACTOR_SYSTEM, userLanguage) + localeSuffix,
      messages: [{ role: 'user', content: extractorPrompt }],
    }, { label: 'heckler-prep:evidence-ledger' });

    if (!ledger || !Array.isArray(ledger.facts) || !Array.isArray(ledger.objections) || !Array.isArray(ledger.unknowns)) {
      return res.status(500).json({ error: 'Could not prepare the evidence ledger. Please try again.' });
    }

    const splitA = Math.ceil(questionCount / 2);
    const splitB = questionCount - splitA;
    const brutalA = Math.ceil(brutalMin / 2);
    const brutalB = brutalMin - brutalA;
    const difficultyRule = 'difficulty must be EXACTLY moderate, hard, or brutal in lowercase English; do not translate those enum values.';
    const qShape = `{"number":1,"difficulty":"moderate | hard | brutal","type":"short label","question":"exact audience question","real_concern":"what the question tests","model_answer":"2-3 sentence grounded answer pattern; use [bracketed placeholders] for missing facts","if_you_dont_know":"1-2 sentence response that names the gap without bluffing or promising follow-up","dont_say":"short response pattern to avoid","fact_ids":[],"objection_ids":[],"unknown_ids":[],"hypothetical":false,"hypothetical_premise":null}`;
    const ledgerOnly = ledgerText(ledger);

    // PASS 2 — generators see ONLY the ledger, never the raw form.
    const analyticalPrompt = `${ledgerOnly}\n\nGenerate exactly ${splitA} questions about THE CASE ITSELF: evidence, cost, feasibility, timing, scope, execution, alternatives. Do not cover trust, accountability, precedent, or consequences. At least ${brutalA} must be brutal. Return ONLY valid JSON: {"questions":[${qShape}]}. Number 1-${splitA}. ${difficultyRule}`;
    const humanPrompt = `${ledgerOnly}\n\nGenerate exactly ${splitB} questions about WHAT FOLLOWS FROM IT: accountability, decision rights, precedent, trust, consequences, what happens if it goes wrong, and what approval signals. At least ${brutalB} must be brutal. Also generate grounded framing. Return ONLY valid JSON: {"questions":[${qShape}],"situation_read":{"text":"2 concise sentences","fact_ids":[],"objection_ids":[],"unknown_ids":[]},"the_curveball":{"question":"one unexpected credible question","how_to_handle":"2 concise grounded coaching sentences","fact_ids":[],"objection_ids":[],"unknown_ids":[],"hypothetical":false,"hypothetical_premise":null},"opening_move":{"text":"one grounded sentence acknowledging the biggest explicit objection without conceding it, or null","fact_ids":[],"objection_ids":[],"unknown_ids":[]},"confidence_note":{"text":"one grounded preparation insight, not generic encouragement","fact_ids":[],"objection_ids":[],"unknown_ids":[]}}. Number 1-${splitB}. ${difficultyRule}`;

    const budget = stakes === 'high' ? 5200 : stakes === 'moderate' ? 3200 : 2200;
    const [analytical, human] = await Promise.all([
      callClaudeWithRetry({ model: MODELS.SMART, max_tokens: budget, system: withLanguage(GENERATOR_SYSTEM, userLanguage) + localeSuffix, messages: [{ role: 'user', content: analyticalPrompt }] }, { label: 'heckler-prep:generate-case' }),
      callClaudeWithRetry({ model: MODELS.SMART, max_tokens: budget + 800, system: withLanguage(GENERATOR_SYSTEM, userLanguage) + localeSuffix, messages: [{ role: 'user', content: humanPrompt }] }, { label: 'heckler-prep:generate-human' }),
    ]);

    const RANK = { moderate: 0, hard: 1, brutal: 2 };
    let questions = [...(analytical?.questions || []), ...(human?.questions || [])]
      .sort((a, b) => (RANK[a?.difficulty] ?? 0) - (RANK[b?.difficulty] ?? 0))
      .map((q, i) => ({ ...q, number: i + 1 }));
    if (!questions.length) return res.status(500).json({ error: 'Could not generate your prep questions. Please try again.' });

    // PASS 3 — validate each independent surface; repair only failures.
    questions = await Promise.all(questions.map((q, i) => validateAndRepair(q, ledger, userLanguage, localeSuffix, `q${i + 1}`)));
    questions = questions.map((q, i) => ({ ...q, number: i + 1 }));

    const framingEntries = await Promise.all([
      validateAndRepair(human?.situation_read || null, ledger, userLanguage, localeSuffix, 'situation'),
      validateAndRepair(human?.opening_move || null, ledger, userLanguage, localeSuffix, 'opening'),
      validateAndRepair(human?.the_curveball || null, ledger, userLanguage, localeSuffix, 'curveball'),
      validateAndRepair(human?.confidence_note || null, ledger, userLanguage, localeSuffix, 'closing'),
    ]);

    const [situationObj, openingObj, curveballObj, confidenceObj] = framingEntries;
    const final = {
      questions,
      situation_read: situationObj?.text ?? situationObj ?? null,
      opening_move: openingObj?.text ?? openingObj ?? null,
      the_curveball: curveballObj ? {
        question: curveballObj.question,
        how_to_handle: curveballObj.how_to_handle,
      } : null,
      confidence_note: confidenceObj?.text ?? confidenceObj ?? null,
    };

    // Provenance is intentionally hidden from the current frontend. Keep it in
    // server logs during rollout so failed runs can be diagnosed by evidence ID.
    if (process.env.HP_LOG_PROVENANCE === '1') {
      console.log('[heckler-prep] evidence ledger', JSON.stringify(ledger));
      console.log('[heckler-prep] provenance output', JSON.stringify({ questions, situationObj, openingObj, curveballObj, confidenceObj }));
    }

    return res.json(stripProvenance(final));
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
