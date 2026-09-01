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

REASONING IS ALLOWED. ASSERTION IS NOT. Ordinary domain knowledge may enrich a question; it may not silently become a fact about this scenario. You MAY name plausible possibilities when they are clearly framed as a question, an alternative to investigate, a possibility, or a hypothetical.

ALLOWED: 'What alternatives were assessed — reduced hours, co-location, community management, or something else?' It asks whether they were considered; it does not claim they were.
NOT ALLOWED: 'The council rejected reduced hours and co-location.' — unless a FACT says so.
ALLOWED, when children are a supplied affected group: 'How would the proposed replacement affect children using the library after school?'
NOT ALLOWED: 'Children currently depend on this branch every afternoon after school.' — unless a FACT says so.

Do not be so literal that you merely restate the ledger. Your value is reasoning ABOUT the evidence to find the credible challenges this person will face. A good question may introduce a possibility; it may not disguise that possibility as something that already happened.

DELETE BEFORE YOU ASSERT. For every detail ASSERTED as true of this scenario without a FACT behind it: if removing it does not weaken the question, delete it; if it matters, make the missing information the question. This governs assertions only — a possibility raised inside a question, an alternative offered for investigation, or an openly conditional hypothetical is a DOMAIN POSSIBILITY and is welcome. Keep a hypothetical's invented condition to the minimum the test needs.

Do not ASSERT people, stakeholders, organizations, teams, boards, auditors, reporters, demographic or transport circumstances, schedules, dates, durations, prices, costs, percentages, contracts, policies, processes, prior/future conversations, alternatives that were considered, motives, beliefs, reactions, trust/distrust, responsibility, accountability structures, causation, history, consequences, or future events that no FACT establishes. Naming one of these inside a question as a possibility to investigate is not asserting it.

Do not use 'presumably', 'probably', 'apparently', 'likely', 'obviously', or 'clearly' to turn an unknown into a premise.

KNOWN OBJECTIONS MAY BE VOICED, NOT PROMOTED

A known objection authorizes Heckler Prep to prepare the user for that argument. It does not make the factual premise inside the objection true.

The question may state the objection as something the audience may allege, challenge, or ask about.

Do not rewrite an objection as established scenario history.

Example:

KNOWN OBJECTION:
"why we didn't catch it earlier"

ALLOWED:
"You're going to be asked why these gaps weren't caught earlier. What's your answer?"

ALLOWED:
"If these gaps could have been identified internally earlier, why weren't they?"

NOT ALLOWED:
"Your team missed these gaps."

NOT ALLOWED:
"The external test found gaps your team failed to identify."

unless independently supported by a FACT.


TWO SUPPORTED FACTS DO NOT ESTABLISH A RELATIONSHIP BETWEEN THEM. Joining them may not add chronology, causation, responsibility, motivation, dependency or consequence that the evidence does not carry. Watch the connectives: 'then', 'after', 'before', 'because', 'therefore', 'as a result', 'which led to', 'in response to'.
Given 'hours were cut twice' and 'a promise was made that the branch would not close', write 'Hours were cut twice, and a promise was also made that the branch would not close.' — not 'Hours were cut twice and residents were then promised the branch would not close', which dates one against the other.
Whenever you join two facts into one proposition, ask: did I add a relationship the evidence does not establish? If so, remove the relationship and keep both facts.

RESPONSIBILITY ESCALATION IS FORBIDDEN. 'We did not catch/know/identify X earlier' does not mean 'your team failed to find X', 'your team was responsible for detecting X', 'your team should have prevented X', or 'an external process found what your team failed to find'.

======================================================================
EPISTEMIC STATUS — NEVER CHANGES DURING WRITING
======================================================================

Every piece of scenario information has a status:

FACT — explicitly supplied as true by the user.
OBJECTION — something the user expects another person to argue, challenge, allege, question, or believe.
UNKNOWN — something not established by the user.
DOMAIN POSSIBILITY — a reasonable possibility introduced by Heckler Prep to make preparation more useful.

THE STATUS OF INFORMATION MAY NOT CHANGE BECAUSE YOU REPHRASE IT.

This rule applies to EVERY visitor-facing field: scenario diagnosis, opening, questions, model answers, what-the-question-is-testing explanations, if-you-don't-know coaching, curveball, curveball coaching, closing guidance.

FACTS may be stated directly.
FACT: "A commitment was made that the branch would not close." ALLOWED as written.

OBJECTIONS are permission to PREPARE FOR A CLAIM, not evidence the claim is true.
OBJECTION: "Residents think the decision is already made."
ALLOWED: "Residents may challenge whether this is a genuine consultation."
ALLOWED: "You need to be ready for the accusation that the decision has already been made."
ALLOWED: "If the decision is already substantially made, what can tonight's consultation actually change?"
NOT ALLOWED: "The decision is largely already made." / "By the facts available, the decision is largely already decided." / "Explain how the decision was reached." — unless a completed decision is independently established as a FACT.
Preserve status with framing such as "you may be asked", "they may argue", "the objection is", "be ready to explain whether", "if", "the audience may challenge", "you need to be prepared for the claim that". Do not use these mechanically; use them whenever needed to stop an objection becoming an assertion.

UNKNOWN information must remain unknown.
ALLOWED: "Who made the decision?" / "Has a final decision been made?"
NOT ALLOWED: "The decision was made by..." / "After the decision was made..." — unless supported by a FACT.

DOMAIN POSSIBILITIES: you MAY use ordinary domain knowledge to identify credible questions, alternatives, consequences and hypotheticals.
ALLOWED: "What alternatives were considered — reduced hours, shared staffing, co-location, community management, or something else?" This does not assert that any alternative was actually considered.
ALLOWED: "If closure increases travel distance for children, what assessment has been made of access and safety?" This explores a plausible consequence without claiming it occurred.
NOT ALLOWED: "The council rejected reduced hours and co-location." / "A safety assessment found increased risk to children." — unless supported by FACTS.
DOMAIN KNOWLEDGE MAY CREATE A QUESTION. IT MAY NOT CREATE SCENARIO HISTORY.

RELATIONSHIPS BETWEEN FACTS. Two FACTS do not automatically establish chronology, causation, responsibility, motivation, dependency or consequence.
FACTS: "Hours were cut twice." and "A commitment was made that the branch would not close."
ALLOWED: "Hours were cut twice, and a commitment was also made that the branch would not close."
NOT ALLOWED: "Hours were cut twice and residents were then promised the branch would not close." — unless that chronology was supplied.

ANTICIPATED EVENTS ARE NOT OBSERVED EVENTS. Do not convert preparation context into something that has already happened.
INPUT: "Audience: about 60 residents and a local reporter."
ALLOWED: "With about 60 residents expected and a local reporter attending..."
NOT ALLOWED: "Sixty residents showed up and a reporter is here." — unless the user says the meeting is occurring and those events have happened.

FINAL WRITING TEST. Before returning EVERY visitor-facing component, inspect every scenario-specific assertion and ask:
1. Is this a FACT? — it may be stated directly.
2. Is this an OBJECTION? — preserve it as an allegation, challenge, expected question, or conditional.
3. Is this UNKNOWN? — ask about it or explicitly leave it unknown.
4. Is this a DOMAIN POSSIBILITY? — frame it as a possibility, alternative, question, or hypothetical.
5. Did I accidentally create chronology, causation, responsibility, motivation, or an event the evidence does not establish? — rewrite it.

The goal is NOT to avoid inference. The goal is to prevent inference from silently becoming fact.

NORTH STAR:
Reason freely.
Question aggressively.
Assert carefully.

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
Every user-facing component must carry hidden fact_ids, objection_ids, and unknown_ids. IDs go in those arrays and NOWHERE else: never write F3, O2 or U1 into a question, an answer, a placeholder or any other sentence a person reads. They are internal bookkeeping and mean nothing to the visitor. Cite only IDs that actually support the component. Do not invent IDs.

FINAL CHECK
For every scenario-specific premise ASSERTED as true, ask: which FACT entails this? If none, delete it, turn it into a question, attribute it to an OBJECTION, or make it explicitly conditional. A premise offered as a possibility rather than asserted needs no FACT — it needs framing that keeps it a possibility. Then check that no FACT was strengthened, no OBJECTION became fact, no UNKNOWN was filled, and nothing was imported from another scenario.

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
KNOWN OBJECTIONS MAY BE VOICED, NOT PROMOTED

A known objection authorizes Heckler Prep to prepare the user for that argument. It does not make the factual premise inside the objection true.

The question may state the objection as something the audience may allege, challenge, or ask about.

Do not rewrite an objection as established scenario history.

Example:

KNOWN OBJECTION:
"why we didn't catch it earlier"

ALLOWED:
"You're going to be asked why these gaps weren't caught earlier. What's your answer?"

ALLOWED:
"If these gaps could have been identified internally earlier, why weren't they?"

NOT ALLOWED:
"Your team missed these gaps."

NOT ALLOWED:
"The external test found gaps your team failed to identify."

unless independently supported by a FACT.


Classify every scenario-specific element into one of three, and judge it on that:
A. A SCENARIO-SPECIFIC FACTUAL PREMISE — asserted as true of this situation. Must be supported by the ledger.
B. A REASONABLE DOMAIN-SPECIFIC POSSIBILITY — named inside a question, an alternative, a possibility or a hypothetical. ALLOWED without a FACT ID. Do not reject a question merely because a possibility it raises has no ID.
C. AN INVENTED SCENARIO-SPECIFIC FACT — presented as already true. Reject.

PASS: 'What alternatives were considered — reduced hours, co-location, community management, or something else?'
FAIL unless supported: 'The council considered reduced hours and co-location.'
PASS when children are a supplied affected group: 'If children use the library after school, how would closure affect their access?'
FAIL unless supported: 'Children currently use this library every weekday after school.'

Protect provenance without suppressing useful reasoning. Grounding outranks cleverness, but grounding does not mean paraphrase-only. A question that reasons beyond the user's words is doing its job; a question that pretends to know beyond the user's evidence is not.

Reject a relationship between two supported facts that the evidence does not establish — added chronology, causation, responsibility, motivation, dependency or consequence. 'Hours were cut twice and residents were THEN promised the branch would not close' dates one fact against the other; 'and a promise was ALSO made' does not.
Reject people, circumstances, alternatives, processes, timelines, numbers, motives, audience psychology, prior/future dialogue, responsibility, causation, history or consequences that are ASSERTED as true of this scenario without support. The same nouns raised as possibilities inside a question are category B and pass.
Reject words such as presumably/probably/apparently/likely when they fill a missing fact.
Reject responsibility escalation such as turning 'not caught earlier' into 'your team failed to detect'.

QUESTION AND HYPOTHETICAL PREMISES — HARD PROVENANCE RULE

A question mark, conditional phrase, or hypothetical does NOT exempt a scenario-specific premise from provenance.

Every factual detail ASSERTED inside a question or hypothetical must still be:

1. directly supported by a FACT in the evidence ledger, OR
2. explicitly presented as the UNKNOWN being tested, OR
3. framed as a DOMAIN POSSIBILITY — an alternative, a possibility or an openly conditional hypothetical, which asserts nothing and needs no FACT.

Do not invent a detail merely because it appears inside:
- "if..."
- "what if..."
- "suppose..."
- "would..."
- "could..."
- a rhetorical question
- a hostile accusation

In particular, do not invent:
- time horizons
- future delays
- future stakeholder actions
- approval sequences
- review processes
- prior constraints
- prior duties
- missing documents
- absent plans
- future recurrence
- ownership or accountability structures

BAD:
"If the gaps are still unresolved six months from now..."

GOOD:
"If the gaps remain unresolved, who is accountable for deciding whether the response is working?"

BAD:
"If the CTO approves this but the CFO asks for a revised number..."

GOOD:
"If the full amount is not approved, which parts of the proposal are essential and which can be deferred?"

BAD:
"If the report has not been shared with the committee, why not?"

when non-sharing is unknown.

GOOD:
"Has the committee received the underlying report? If not, why not?"

BAD:
"What happens if the gaps remain open for another two quarters?"

GOOD:
"What is the business impact if the identified gaps remain unaddressed?"

FINAL TEST:

For every clause inside every question and hypothetical, ask:

"Is this detail supported by a FACT, or is this exact detail itself the thing being asked about?"

If neither is true, remove or rewrite it.

Hypotheticals may invent only the minimum condition necessary to test the proposal. They may not invent the surrounding scenario.


======================================================================
FINAL EPISTEMIC-STATUS AUDIT — HARD FAIL
======================================================================

Audit EVERY visitor-facing field, not only the questions.

For each scenario-specific assertion, classify its source as FACT, OBJECTION, UNKNOWN or DOMAIN POSSIBILITY. Then verify that its rendered language preserves that status.

HARD FAIL if:
1. an OBJECTION is rendered as an established fact;
2. an UNKNOWN is rendered as known;
3. a DOMAIN POSSIBILITY is rendered as scenario history;
4. two supported facts are joined by an unsupported chronological, causal, motivational, responsibility or dependency relationship;
5. an anticipated audience, meeting, reaction, decision, approval, delay, review or other future event is described as though it has already occurred;
6. framing text contains an unsupported premise even when every question passes.

The scenario diagnosis, opening, model answers, testing explanations, if-you-don't-know coaching, curveball, curveball coaching and closing guidance receive exactly the same scrutiny as the questions. Do not approve a component merely because the questions are grounded.

OBJECTION TEST. For every OBJECTION used anywhere, ask: if the objection turned out to be false, would this sentence still be factually valid? If NO, the sentence must explicitly preserve it as an allegation, an expected challenge, an open question, or a conditional.
OBJECTION: "The decision is already made."
FAIL: "The closure is largely already decided."
PASS: "Residents may believe the closure is already decided."
PASS: "Be ready to explain how much of the decision remains open."
PASS: "If the closure is already substantially decided, what can this consultation still change?"

UNKNOWN TEST. For every UNKNOWN used anywhere, ask: does this sentence imply I already know the answer? If YES, rewrite it as a question, a conditional, or an explicit unknown.

DOMAIN-INFERENCE TEST. Domain knowledge MAY supply plausible alternatives, lines of questioning, relevant consequences, credible hypotheticals and categories worth investigating. It may NOT supply what actually happened, what this organisation actually did, what this audience actually believes beyond supplied objections, what a stakeholder actually decided, what process actually exists, or what assessment actually occurred.

DRAMA TEST. A hard question should be difficult because it exposes a real vulnerability, not because the hypothetical was escalated to a more emotionally extreme event. Do not introduce severe injury, death, catastrophe, criminal conduct, regulatory action, public scandal, firing, litigation or similar escalation merely to make a question feel brutal. Such consequences are appropriate only when supplied by the user, strongly inherent in the subject, or necessary to test a clearly relevant risk. Prefer the least dramatic hypothetical that exposes the underlying weakness.
PREFER: "If closure increases the distance children must travel, what assessment has been made of access and safety?"
OVER: "If a child is harmed while travelling to the replacement service, who bears responsibility?" — when injury is not part of the supplied scenario.

PASS CONDITION. Approve only when facts remain facts, objections remain objections, unknowns remain unknown, possibilities remain possibilities, reasonable domain reasoning remains available, and this component passes every rule above.


Return ONLY JSON:
{"pass":true,"unsupported_phrases":[],"repair_instruction":""}
or
{"pass":false,"unsupported_phrases":["..."],"repair_instruction":"Concise instruction describing only what must be removed or reframed."}`;

function ledgerText(ledger) {
  return `FACTS:\n${(ledger.facts || []).map(x => `${x.id}: ${x.text}`).join('\n') || '(none)'}\n\nOBJECTIONS:\n${(ledger.objections || []).map(x => `${x.id}: ${x.text}`).join('\n') || '(none)'}\n\nUNKNOWNS:\n${(ledger.unknowns || []).map(x => `${x.id}: ${x.text}`).join('\n') || '(none)'}`;
}

// The public/internal boundary, enforced in code rather than by asking the
// model nicely. The ledger and every provenance key are infrastructure: they
// steer generation and validation and must never reach a visitor.
const INTERNAL_KEYS = [
  'evidence_ledger', 'facts', 'objections', 'unknowns',
  'fact_ids', 'objection_ids', 'unknown_ids',
  'provenance', 'validation',
  'hypothetical', 'hypothetical_premise',
];

// Keys are not the only way the ledger leaks. The model cites its own IDs
// INSIDE the bracketed placeholders it writes for the presenter — "[who, when
// — U3]", "[the building-cost pressure described in F3]" — which is internal
// vocabulary sitting in visitor-facing coaching.
//
// Scoped to bracket spans on purpose. A blanket strip of /\b[FOU]\d\b/ would
// eat "F1 racing" and "U2" out of somebody's real topic; inside a placeholder
// the token can only be a citation. If removing it would empty the placeholder,
// the placeholder goes with it rather than leaving "[]" on the page.
const LEDGER_CITATION = /\s*(?:[—–-]|,)?\s*(?:described in|referenced in|per|from|see|ref\.?)?\s*\b[FOU][0-9]{1,2}\b/g;

function stripLedgerCitations(text) {
  if (typeof text !== 'string') return text;
  if (!text.includes('[') && !text.includes('(')) return text;
  const clean = (whole, inner, open, close) => {
    if (!/\b[FOU][0-9]{1,2}\b/.test(inner)) return whole;
    const cleaned = inner.replace(LEDGER_CITATION, '').replace(/\s{2,}/g, ' ').replace(/[\s,;—–-]+$/, '').trim();
    return cleaned ? `${open}${cleaned}${close}` : '';
  };
  return text
    // Placeholders the presenter fills in: "[who, when — U3]".
    .replace(/\[([^\]]*)\]/g, (w, inner) => clean(w, inner, '[', ']'))
    // Citations appended to prose: "a prior promise (F7)", "the savings (U2)".
    .replace(/\(([^)]*)\)/g, (w, inner) => clean(w, inner, '(', ')'))
    .replace(/\s{2,}/g, ' ').replace(/\s+([.,;:!?])/g, '$1').trim();
}

function stripProvenance(value) {
  if (Array.isArray(value)) return value.map(stripProvenance);
  if (!value || typeof value !== 'object') return value;
  const out = {};
  for (const [k, v] of Object.entries(value)) {
    if (INTERNAL_KEYS.includes(k)) continue;
    out[k] = typeof v === 'string' ? stripLedgerCitations(v) : stripProvenance(v);
  }
  return out;
}

// Strip is total and recursive, so this can only fire if someone edits it or
// routes a response around it. That is exactly when a silent leak would ship,
// which is why the check is here and not in a test: the assertion travels with
// the code that has to keep holding.
function assertNoInternalKeys(value, path = 'response') {
  if (Array.isArray(value)) { value.forEach((v, i) => assertNoInternalKeys(v, `${path}[${i}]`)); return; }
  if (!value || typeof value !== 'object') return;
  for (const [k, v] of Object.entries(value)) {
    if (INTERNAL_KEYS.includes(k)) throw new Error(`internal key "${k}" reached the public response at ${path}`);
    assertNoInternalKeys(v, `${path}.${k}`);
  }
}

// Rule 2 — no unsupported relationship between two supported facts — is in the
// generator and in the validator, and one run in four still produced the exact
// shape the spec names as a failure: "Hours were cut twice, residents were then
// told the branch would not close." Both facts are supported; the chronology
// joining them is not.
//
// So the connectives that carry it are matched in code and handed to the
// validator by name. Deliberately narrow: bare "then" is legitimate constantly
// ("if X, then Y", "what happens then"), so only the constructions that date
// one clause against another are listed. A judge decides whether a premise is
// supported; a regex is better at spotting the word that smuggled it in.
const CHRONOLOGY_CONNECTIVES = /\b(?:were|was|residents were|they were)\s+then\s+\w+|\band then (?:told|promised|assured|informed|decided|cut|closed)\b|\bwhich led to\b|\bin response to\b|\bafter which\b|\bas a result of the\b/gi;

function chronologyLeaks(component) {
  const found = new Set();
  (function walk(v) {
    if (Array.isArray(v)) return v.forEach(walk);
    if (v && typeof v === 'object') return Object.values(v).forEach(walk);
    if (typeof v === 'string') {
      const m = v.match(CHRONOLOGY_CONNECTIVES);
      if (m) m.forEach(x => found.add(x.trim()));
    }
  })(component);
  return [...found];
}

// The model cites its own ledger IDs in prose, in three shapes seen in testing:
// inside a placeholder ("[who, when — U3]"), appended in parentheses ("a prior
// promise (F7)"), and bare ("U5 is the key unknown here", "named in O3").
// Rewriting the third with a regex means editing sentences, so it goes to the
// repair pass instead — a rewrite is what it needs — and only what survives
// that gets cut mechanically.
const LEDGER_ID = /\b[FOU][0-9]{1,2}\b/;

function ledgerIdLeaks(component) {
  const found = new Set();
  (function walk(v) {
    if (Array.isArray(v)) return v.forEach(walk);
    if (v && typeof v === 'object') {
      for (const [k, val] of Object.entries(v)) {
        if (INTERNAL_KEYS.includes(k)) continue;   // the id arrays are meant to hold ids
        walk(val);
      }
      return;
    }
    if (typeof v === 'string') {
      const m = v.match(new RegExp(LEDGER_ID.source, 'g'));
      if (m) m.forEach(x => found.add(x));
    }
  })(component);
  return [...found];
}

// Last net. A sentence that still names an internal ID after the repair pass is
// removed whole: a visitor reading "U5 is the key unknown here" learns nothing,
// and losing one sentence beats shipping the machinery.
function dropSentencesWithIds(value) {
  if (Array.isArray(value)) return value.map(dropSentencesWithIds);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = dropSentencesWithIds(v);
    return out;
  }
  if (typeof value !== 'string' || !LEDGER_ID.test(value)) return value;
  const kept = value.split(/(?<=[.!?])\s+/).filter(sentence => !LEDGER_ID.test(sentence));
  return kept.join(' ').trim();
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

    // A clean verdict is not the end of it: the deterministic chronology check
    // runs regardless, and a hit sends the component to the same repair path
    // the validator would have used, with the offending phrase named.
    const chrono = chronologyLeaks(component);
    const idLeaks = ledgerIdLeaks(component);
    if (verdict?.pass !== false && !chrono.length && !idLeaks.length) return component;
    const notes = [];
    if (chrono.length) notes.push(`These phrases add chronology, causation or sequence between facts that the ledger does not establish: ${chrono.join('; ')}. Keep both facts and remove the relationship — "and a promise was ALSO made", not "were THEN promised".`);
    if (idLeaks.length) notes.push(`Internal evidence IDs appear in text a person reads: ${idLeaks.join(', ')}. Say the thing in plain words instead — "the promise not to close" rather than "O3" — or drop the reference. Never print an ID.`);
    const finding = notes.length
      ? { pass: false, unsupported_phrases: [...chrono, ...idLeaks], repair_instruction: `${notes.join(' ')}${verdict?.pass === false ? ' Also: ' + (verdict.repair_instruction || '') : ''} Change nothing else.` }
      : verdict;
    if (chrono.length) console.log(`[heckler-prep] chronology connective in ${label}: ${chrono.join('; ')}`);
    if (idLeaks.length) console.log(`[heckler-prep] ledger ID in prose in ${label}: ${idLeaks.join(', ')}`);

    const repairSystem = `You are a surgical provenance editor. Rewrite ONLY the supplied Heckler Prep component to satisfy the validator. Preserve its JSON shape and purpose. Do not add replacement facts, examples, specificity, or new evidence IDs. When information is missing, ask about it instead. Facts may be stated but not strengthened. Objections must remain attributed, questioned, or conditional. Unknowns must remain unknown. Return ONLY the corrected JSON component. Never place a double-quote character inside a JSON string value.`;
    const repairPrompt = `${ledgerText(ledger)}\n\nVALIDATOR FINDING:\n${JSON.stringify(finding)}\n\nCOMPONENT:\n${JSON.stringify(component)}`;
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

    // Public response boundary. `final` is assembled field by field from the
    // validated components — an allowlist, so a new internal field cannot
    // arrive by accident — then stripped recursively, then checked.
    const publicResult = dropSentencesWithIds(stripProvenance(final));
    assertNoInternalKeys(publicResult);
    return res.json(publicResult);
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
