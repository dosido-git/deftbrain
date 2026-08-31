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
// knownObjections is the one field whose semantics the code knows: it holds
// things the user EXPECTS TO HEAR, never things they accept. That is narrow
// enough to check deterministically, so it does not rest on the model
// remembering it — which it has repeatedly failed to do, turning "the decision
// is mostly already made" into "you came in here knowing the branch is closing".
//
// The check is deliberately blunt: a sentence that carries the objection's
// distinctive words, in one of the surfaces that speaks in DeftBrain's own
// voice, with no attribution, condition or question mark anywhere in it.
// Questions are exempt by design — a heckler is allowed the hostile premise.
//
// It catches literal reuse and second-person assertion frames. It does NOT
// catch paraphrase: "the settled direction is the central fact of the room"
// shares no words with "the decision is substantially already taken" and reads
// as clean here. That half is the validator prompt's job, and the two layers
// are complementary rather than redundant — this one is deterministic and
// cannot be talked out of a finding, the prompt one can generalise. Measured
// against the specified FAIL/PASS pairs it classifies 9 of 11; both misses are
// paraphrase.
const ATTRIBUTED = /\b(objection|concern|argue|argued|claim|accus|expect|suspect|believe|per the|according to|some|many|residents|critics|they think)\b/i;
const CONDITIONAL = /\b(if|whether|were|suppose|assuming|in the event)\b/i;
// Second-person assertion. This is checked FIRST and is never exempted: "you
// have said the decision is made" contains an attribution verb and is still the
// exact conversion the field forbids, so the attribution escape must not apply.
// One shared content word is enough here — the frame itself carries the failure.
const ASSERTS_USER = /\byou(?:'ve| have| had)?\s+(?:already\s+)?(?:know|knew|acknowledge[ds]?|admit(?:ted)?|accept(?:ed)?|concede[ds]?|said|stated|conceded|are aware|came in here knowing)\b/i;

function objectionTerms(raw) {
  const stop = new Set(['that','this','they','them','their','were','have','has','been','will','with','from','about','would','could','should','there','which','what','when','because','already','still','into','more','than','also','just','only','over','after','before','being','does','done','made','make','said','tell','told','very','much','most','some','such','then','they','your','you']);
  return String(raw || '')
    .split(/[.;\n]/)
    .flatMap(clause => {
      const words = clause.toLowerCase().match(/[a-z']{4,}/g) || [];
      const content = words.filter(w => !stop.has(w));
      // a term is distinctive enough if two content words co-occur in a clause
      return content.length >= 2 ? [content.slice(0, 6)] : [];
    });
}

function objectionLeaks(obj, fields) {
  const groups = objectionTerms(obj);
  if (!groups.length) return [];
  const hits = [];
  for (const [path, value] of fields) {
    for (const sentence of String(value || '').split(/(?<=[.!?])\s+/)) {
      if (!sentence.trim()) continue;
      if (sentence.includes('?')) continue;                 // a question is a permitted form
      const lower = sentence.toLowerCase();
      const asserts = ASSERTS_USER.test(sentence);
      if (!asserts && (ATTRIBUTED.test(sentence) || CONDITIONAL.test(sentence))) continue;
      const need = asserts ? 1 : 2;
      for (const group of groups) {
        const matched = group.filter(w => lower.includes(w));
        if (matched.length >= need) { hits.push({ path, sentence: sentence.trim(), matched }); break; }
      }
    }
  }
  return hits;
}

// The other half of the invented-context habit is narrow enough to catch in
// code: named third parties. "The board", "our auditors", "the regulator" are
// common nouns the model reaches for to make a question sound executive-level,
// and they are trivially checkable — either the user mentioned them or nobody
// did. Paraphrase is not a risk here the way it is with objections, because
// there is no paraphrase of "auditors" that is still "auditors".
const THIRD_PARTIES = ['board', 'auditor', 'auditors', 'regulator', 'regulators', 'shareholder', 'shareholders',
  'investor', 'investors', 'insurer', 'insurers', 'compliance team', 'legal team', 'procurement',
  'the press', 'the media', 'union', 'trustees', 'ombudsman', 'inspectorate'];

function inventedStakeholders(body, fields) {
  const supplied = [body.topic, body.audience, body.proposal, body.askingFor,
                    body.knownObjections, body.objections, body.stakes]
    .map(x => String(x || '').toLowerCase()).join(' ');
  const unsupplied = THIRD_PARTIES.filter(t => !supplied.includes(t));
  if (!unsupplied.length) return [];
  const hits = [];
  for (const [path, value] of fields) {
    // "across the board" is an idiom, not a stakeholder. Caught this as a false
    // positive on a real run before it could produce a spurious rewrite.
    const lower = String(value || '').toLowerCase().replace(/across the board/g, '');
    for (const t of unsupplied) {
      if (new RegExp(`\\b${t}\\b`).test(lower)) { hits.push({ path, term: t }); break; }
    }
  }
  return hits;
}

// The surfaces that speak as the tool rather than as a heckler.
function toolVoiceFields(draft) {
  const f = [];
  const put = (k, v) => { if (typeof v === 'string' && v.trim()) f.push([k, v]); };
  put('situation_read', draft.situation_read);
  put('opening_move', draft.opening_move);
  put('confidence_note', draft.confidence_note);
  put('the_curveball.how_to_handle', draft.the_curveball && draft.the_curveball.how_to_handle);
  (draft.questions || []).forEach((q, i) => {
    put(`questions[${i}].real_concern`, q && q.real_concern);
    put(`questions[${i}].model_answer`, q && q.model_answer);
    put(`questions[${i}].if_you_dont_know`, q && q.if_you_dont_know);
  });
  return f;
}

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

  const editorSystem = `PASS 2 — GROUNDING VALIDATOR AND REVISER

You are not Heckler Prep in this pass. You are a strict factual editor whose only job is to remove unsupported claims from the draft while preserving the force of the questions.

DO NOT improve the writing. DO NOT make questions more vivid. DO NOT add examples. DO NOT add specificity. DO NOT add facts. DO NOT infer what probably happened.

You may only: KEEP supported text; DELETE unsupported text; ATTRIBUTE a known objection; make an unsupported adversarial premise CONDITIONAL; turn an unknown into a QUESTION; GENERALISE an unnecessary invented detail.

Return the SAME JSON object — same keys, same number of questions, same numbering. Never place a double-quote (") character inside a JSON string value. Return ONLY the corrected JSON: no audit, no classifications, no explanation, no draft.`;

  const voice = toolVoiceFields(draft);
  const allFields = voice.concat((draft.questions || [])
    .map((q, i) => [`questions[${i}].question`, q && q.question])
    .filter(([, v]) => typeof v === 'string' && v.trim()));
  const leaks = objectionLeaks(body.knownObjections || body.objections, voice);
  const strangers = inventedStakeholders(body, allFields);
  const strangerBlock = strangers.length ? `
NAMED THIRD PARTIES THE USER NEVER MENTIONED — remove each, or turn it into what is being asked:
${strangers.map(h => `- ${h.path}: "${h.term}"`).join('\n')}
` : '';
  const leakBlock = leaks.length ? `
SENTENCES THAT ALREADY FAILED THE KNOWN-OBJECTION CHECK — rewrite each into an attributed objection, a conditional, or a question:
${leaks.map(h => `- ${h.path}: "${h.sentence}"`).join('\n')}
` : '';

  const editorPrompt = `SOURCE LEDGER — the user's fields, as separate evidence sources.

PRESENTING:
${(body.topic || '').trim() || '(not given)'}

AUDIENCE:
${(body.audience || '').trim() || '(not given)'}

ASK:
${(body.proposal || body.askingFor || '').trim() || '(not given)'}

KNOWN OBJECTIONS:
${(body.knownObjections || body.objections || '').trim() || '(none given)'}

STAKES:
${(body.stakes || '').trim() || '(not given)'}

KNOWN-OBJECTION PROVENANCE — HARD FAILURE
Any proposition sourced ONLY from KNOWN OBJECTIONS may appear in exactly three forms: an attributed objection ("residents may argue that...", "one concern is that..."), a conditional ("if the decision is already largely made..."), or a question ("is the decision already largely made?"). It may NEVER appear as a declarative fact, or as something the user knows, believes, admits, acknowledges, has said or has done. Surrounding language does not soften this.
From the known objection "the decision is mostly already made" — FAIL: "the settled direction is the central fact of the room". FAIL: "you know the decision is largely made". FAIL: "you've acknowledged that the decision is largely made". PASS: "one of the objections you expect is that the decision is largely made". PASS: "if the decision is largely made, what can tonight change?". PASS: "is the decision already largely made?"
If a sentence does this, validation FAILS and you MUST rewrite that sentence.

KNOWN OBJECTIONS ARE NOT FACTS. They establish only that the user EXPECTS those objections to arise.
From "why we didn't catch it earlier", this is supported: "why these gaps weren't identified earlier". These are NOT: "your team failed to detect the gaps", "your team missed the problem", "your team was responsible for preventing this", "the security team failed", "management knew about the gaps". Do not strengthen the meaning of supplied language.

CLAIM-BY-CLAIM AUDIT. Inspect EVERY sentence. Silently classify each concrete or user-specific claim:
S = directly supported by PRESENTING, AUDIENCE, ASK or STAKES
O = supplied only as a KNOWN OBJECTION
H = clearly hypothetical
U = unsupported
Then enforce. S may remain. O may remain ONLY as an attributed objection, a conditional premise, or a question. H may remain only where the invented condition is necessary to test the proposal — strip invented specificity that is not. U MUST be deleted, generalised, or converted into a question. There are no exceptions.

SOPHISTICATION MUST COME FROM THE QUESTION, NOT INVENTED CONTEXT
Do not make a question sound more expert by adding plausible facts, stakeholders, processes, alternatives, history or organisational consequences the user did not supply. Before retaining any named stakeholder, process, alternative, historical condition or organisational consequence, ask: DID THE USER SUPPLY THIS? If no, remove it or turn it into the thing being asked about.
"Phased spend, managed security services, narrowing scope to the highest-severity findings" invents the alternatives; ask what alternatives were evaluated, what each would have cost, and why they were rejected. "You are effectively telling us the organisation has been under-invested in security until now" invents a history; ask what changed — the understanding of the risk, the risk itself, or the protection proposed. "The board" and "our auditors" invent stakeholders. "Before your internal process did" invents a process.
A strong question exposes what is unknown. It does not fill the unknown with plausible business context.

ENTAILMENT TEST. Do not ask whether a sentence sounds consistent with the input. Ask: does the user's exact input ENTAIL this claim? If no, it cannot be stated as fact.
"why we didn't catch it earlier" does not entail "the team was responsible for not catching it" or "the team failed to prevent the problem".
"next quarter" does not entail "within the next budget cycle" or "evaluate in 12 months".
"pen test surfaced gaps" does not entail "the pen test was comprehensive", "the gaps existed last year", or "the team should have found them internally".

NO UNSOURCED NUMBERS OR TIME PERIODS. Make a separate final scan for numbers, percentages, currency amounts, dates, durations, deadlines, frequencies and time horizons. Every one must appear in the input, or be derived mathematically from a supplied number, or be removed. Never invent a convenient evaluation horizon. Not "how will we evaluate this in 12 months?" — "how will we evaluate whether this investment worked?".

NO RESPONSIBILITY ESCALATION. Never turn "didn't catch" into "failed to prevent", "was responsible for", "caused", "missed despite responsibility" or "failed in its duty". Never turn an expected criticism into an established failure. Preserve the user's level of assertion exactly.

HYPOTHETICAL TEST. A hypothetical may invent a CONDITION — "if we approve this and a breach still occurs". It may not invent unnecessary PARAMETERS — "within 12 months" — unless that came from the user. Use the minimum hypothetical needed to create the challenge.

SCRIPT TEST. For every sentence placed in the user's mouth: can they truthfully say every factual part of it based solely on the ledger above? If not, rewrite it. Never make the user admit something they did not admit, accept responsibility they did not accept, promise an action they did not promise, claim knowledge they did not provide, or characterise an unknown as known.

FINAL RED-TEAM SCAN. Before returning, search the revised output specifically for: every statement about what the user's team did or failed to do; every statement assigning responsibility; every number or time period; every statement derived from a known objection; every claim about audience beliefs or motives; every promise or commitment; every invented present or past fact.
${prohibited}
If any fails the rules above, revise it.

${leakBlock}${strangerBlock}
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
    const remaining = objectionLeaks(body.knownObjections || body.objections, toolVoiceFields(edited));
    console.log(`[heckler-prep] grounding edit (${half}): applied over ${edited.questions.length} question(s)`
      + (leaks.length ? ` — ${leaks.length} objection leak(s) flagged` : '')
      + (strangers.length ? `, ${strangers.length} invented stakeholder(s) flagged` : '')
      + (remaining.length ? `, ${remaining.length} STILL UNATTRIBUTED: ${remaining.map(r => r.path).join(', ')}` : leaks.length ? ', all resolved' : ''));
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
- how_to_handle says how to meet the question, not what to promise in answer to it. It stands alone: never refer to another question by number or to "the line you drew" elsewhere in the output. Those references are generated blind and land on the wrong question — one pointed at "the honest line you drew in question one" when question one was about transport. Say the thing itself. The same bar as if_you_dont_know: no commitment the user has not chosen to make.
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

FINAL GROUNDING PASS — DELETE BEFORE YOU INVENT

Before returning the final output, inspect every user-facing sentence.

For every specific detail, premise, circumstance, stakeholder, action, motive, alternative, cause, consequence, or event that was NOT explicitly supplied by the user:

1. Ask: "Does removing this detail weaken the question?"
   - If NO: remove it.

2. If YES, ask: "Can the missing information itself become the question?"
   - If YES: ask for it instead of inventing it.
   - If NO: make it explicitly hypothetical only when the hypothetical is necessary to test the user's proposal.

Never add plausible context merely to make a question more concrete, realistic, sophisticated, or difficult.

Do not invent:
- circumstances around people the user mentioned
- examples of alternatives supposedly considered
- reasons something might happen
- things the user will say or do at the future event
- audience beliefs, reactions, or motives
- organizational history, processes, stakeholders, or consequences

KNOWN OBJECTIONS remain objections. They may be questioned, attributed, or made conditional; they may never be promoted to facts, admissions, knowledge, or events.

FINAL TEST:
The strongest Heckler Prep question exposes an evidence gap. It does not fill that gap for the user.

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
    "how_to_handle": "2 sentences. Self-contained — no reference to another question by number or content."
  },
  "opening_move": "One grounded sentence to say at the start that directly acknowledges the biggest explicit objection, or null if the input does not support one.",
  "confidence_note": "One sentence of grounded encouragement based only on the user's supplied facts or the preparation completed here."
}

Generate exactly ${splitB} questions, escalating in difficulty.${brutalB > 0 ? ` At least ${brutalB} must be 'brutal'.` : ''} Every question must be about what follows from the proposal, never about its numbers, feasibility or execution — another pass covers those. A question in this half may still be evidential in character: "if we spend this and are breached anyway, how will we know it reduced our risk?" belongs here and is not an Emotional question. Write the strongest realistic question first and label its type afterwards; the label describes the question, it does not choose it. Number them 1 to ${splitB}.

${DIFFICULTY_RULE}`;

    const systemSuffix = withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion) + ' Never place a double-quote (") character inside any JSON string value — write quoted questions or phrases plainly or with single quotes, or it breaks the JSON.';
    // Raised 2026-08-31 with the FINAL GROUNDING PASS block. That block makes
    // the model deliberate over every sentence, and it writes longer for it —
    // German at high stakes overran 3200 and truncated, losing opening_move and
    // confidence_note off the end of the human half. The golden caught it; the
    // English runs never would have, which is the whole reason the German case
    // is the one recorded.
    const maxTokensByStakes = { low: 1600, moderate: 2400, high: 4200 };
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
