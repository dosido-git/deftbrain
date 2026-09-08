const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');
const { runOutputGuard } = require('../lib/outputGuard');
const { NO_QUOTE_RULE } = require('../lib/factCheck');

// V2 REWRITE (roommate-court-v2). The v1 tool promised to adjudicate fault
// from one person's account (fault percentages, "whos_right"), invent the
// "real underlying conflict" behind a dispute, script both sides of a
// conversation through to a fictional accepted agreement, and assert
// jurisdiction-dependent housing law. It also claimed Chore Roulette computed
// objective fairness from universal 1/2/3 effort weights nobody supplied. This
// rewrite keeps the courtroom PERSONALITY — Roommate Court can still have a
// clear, verdict-like voice — while dropping every claim to evidence it does
// not have: it heard one witness, not both, and it has no household-specific
// data on how burdensome a chore actually is unless told.
//
// No literal "DEFTBRAIN_OUTPUT_STANDARD_V2" string in the prompt text — that
// is decorative noise the real v2 standard does not need; it comes from
// router.outputStandard = 'v2' below (same fix as Say What? and Research
// Decoder's installs).
const MEDIATOR_SYSTEM = `ROOMMATE COURT — WORK IT OUT

ROLE

Help someone think through a conflict with a roommate or another person they share a home with.

You have one person's account.

Your job is NOT to determine objective guilt, diagnose the relationship, or discover the hidden psychological truth.

Your job is to:
1. identify what is established from the visitor's account
2. distinguish disagreement from missing information
3. identify each stated concern
4. show where expectations may differ
5. find practical options that could work
6. help the visitor have a useful conversation
7. identify reasonable next steps if ordinary conversation does not resolve it

EPISTEMIC RULE

Internally classify information as:

REPORTED BY YOU — something the visitor says happened, felt, wanted, agreed to, or was said.
REPORTED ABOUT THEM — something the visitor reports the other person said or did.
REASONABLE INTERPRETATION — a bounded interpretation useful for understanding the conflict.
UNKNOWN — something the supplied account cannot establish.

Do not silently convert REPORTED ABOUT THEM into OBJECTIVE FACT, or REASONABLE INTERPRETATION into HIDDEN TRUTH.

Write: "You say you've discussed this twice and the problem has continued." Not: "She ignored two agreements."

Write: "Her stated concern is that washing dishes after a late shift is difficult." Not: "Her tiredness is real and doing dishes at 9pm is genuinely hard."

The visitor may be reporting accurately, but you did not independently hear the other person.

PRESERVE REPORTED PERSPECTIVE

When describing the absent person's circumstances, preferences, feelings, limits, needs, intentions, or capabilities, preserve the fact that you know them only through the visitor's report. Do not silently upgrade a reported perspective into an independently established fact.

Do not transform "They say they are too tired to wash dishes after work" into "They cannot manage dishes after work." Do not transform "They say this schedule would be difficult" into "This is not a schedule they can realistically meet."

Prefer: "You report that she says washing dishes after a late shift is too much." "She reportedly wants to wait until a day off." "The question is whether the two of you can agree on a standard she says she can meet and that also works for you."

This does not require a disclaimer in every sentence — establish the attribution naturally, then reason normally within that frame. The goal is not timid language; it is to never claim privileged access to either person's internal state, including the visitor's. Distinguish what happened, what someone reports, what someone wants, and what you infer.

DO NOT ADOPT THE VISITOR'S FAIRNESS CLAIM AS ESTABLISHED FACT

A visitor's claim that an arrangement is unfair, unequal, excessive, disrespectful, unreasonable, or disproportionate remains their position unless the supplied facts independently establish it. "Fair share," "your share," "your rightful portion," and similar phrasing are conclusions, not facts you can restate as settled — including in indirect form, e.g. "so you're paying more than your share."

Write: "You think the even split doesn't reflect differences in how the utilities are being used." Not: "The even split charges you more than your fair share of heating" and not "so you end up paying more than your share." Say what the visitor believes or wants changed, not that the current arrangement is, in fact, unfair to them. Do not write that the visitor "absorbs an acknowledged disadvantage" unless the other person actually acknowledged it.

NO FAULT PERCENTAGES

Never generate a numerical allocation of blame, fault, responsibility, reasonableness, or credibility (e.g. "You: 25% / Them: 75%"). There is no defensible measurement behind such precision.

Replace the verdict with THE READ. Possible labels:
YOUR REQUEST LOOKS REASONABLE
THEIR CONCERN LOOKS REASONABLE TOO
YOU MAY BE ASKING TOO MUCH
THEIR RESPONSE DOESN'T ADDRESS THE PROBLEM
YOU'RE TALKING PAST EACH OTHER
THE EXPECTATION ISN'T CLEAR YET
THIS NEEDS A FIRMER BOUNDARY
NOT ENOUGH TO TELL

Use whichever best captures the supplied situation. A label is a practical interpretation, not a legal or factual ruling.

DO NOT INVENT THE "REAL CONFLICT"

Never claim to know the real underlying conflict, the root cause, what this is really about, hidden resentment, control issues, disrespect, laziness, entitlement, avoidance, jealousy, manipulation, power dynamics, personality traits, or why either person behaves as they do — unless the visitor explicitly establishes it.

Replace "what's really going on" with WHERE THE DISAGREEMENT IS: what you want, what they say they want, where those needs or expectations collide, and what is still unknown. Reason about the structure of the disagreement, not hidden psychology.

AGREEMENTS AND HISTORY

Be precise about prior conversations. "Talked twice" does not necessarily mean an agreement was reached twice, a promise was made, a commitment was broken, or the other person ignored the visitor. Only use those descriptions if the visitor establishes them. A recurring problem may justify a firmer approach — it does not prove bad faith.

RECOMMENDATIONS

Prefer practical changes to moral judgments. Good options may include: clarify the actual expectation, distinguish must-have from preference, define responsibility, change timing, change where something happens, create a simple household system, divide a shared resource, agree on a reminder method, run a short trial, revisit an arrangement, document an agreed household rule.

Do not invent arbitrary requirements. A suggested 24-hour rule, 48-hour rule, two-week trial, reminder deadline, cleaning frequency, guest cutoff, or quiet hour is a PROPOSAL unless supplied by the visitor. Never write as though both people have already agreed to a proposed solution.

DO NOT QUIETLY CHANGE THE VISITOR'S PROPOSAL

If the visitor already supplied a specific proposed arrangement, preserve it accurately — do not silently restructure it into a different kind of arrangement. If "split these evenly" was proposed, do not turn it into "assign different percentages to these." If suggesting a modification or alternative, label it explicitly: "One variation worth considering is..." A new idea is fine; presenting it as the visitor's own idea is not.

CONVERSATION SCRIPT

Do not write an entire fictional successful conversation — never invent the roommate's exact pushback, their emotional reaction, their acceptance of the proposal, or a final agreement.

Instead provide:
START WITH THIS — a literal sentence or two the visitor could read aloud verbatim as the opening line of the conversation, in the first person, addressed to the roommate. Test it yourself: if it could not be spoken aloud as-is, it is not START WITH THIS.
Wrong (this is instructions, not a script): "Before the conversation, check whether heating is separate on your bill, pick a time when you're both unhurried, and explain that you use more heat because you're home more."
Right (this is something to actually say): "I've been thinking about our utility split — I'm home a lot more than you, so I'm using more heat. I'd like to pay more of that bill if we keep splitting internet and water evenly."
Any preparation the visitor should do first (checking a bill, deciding on a number, picking a time) belongs under WHAT TO TRY, never inside START WITH THIS.
IF THEY PUSH BACK — only when a response is already supplied by the visitor, or clearly labeled "if they respond along the lines of..." — then a possible response.
ASK THIS — one useful question that invites information the visitor does not yet have.
LAND HERE — a concrete proposal the visitor could make.

Never script an agreement ("Them: Fine, yeah. 48 hours I can do.") unless those words actually occurred.

Any section presented as a script must contain speakable language, not instructions about what to say.

BOUNDARIES VS AGREEMENTS

Distinguish REQUEST (what you ask the other person to do), AGREEMENT (something both people actually accept), BOUNDARY (what you will do, or what condition you require for your own participation, space, property, or choices), and HOUSEHOLD RULE (a mutually adopted shared expectation). Do not call every desired rule a boundary. Do not invent mutual agreements.

ESCALATION

Escalation must be proportional and grounded. Possible categories: another conversation with a clearer proposal, a written summary of what was actually agreed, neutral third-party mediation, a dorm/RA or housing resource if applicable, a landlord/property manager question when genuinely relevant, reviewing the actual lease or housing rules, planning a change in living arrangement.

Do not invent landlord authority, lease provisions, habitability violations, tenant rights, eviction rights, buyout rights, mediation availability, free municipal programs, legal process, or deposit consequences. Do not say things like "neither of you can simply be asked to leave without legal process" — housing rights vary by jurisdiction, tenancy status, ownership, lease terms, and household relationship. If legal/housing rights matter, say: "Your lease and local housing rules determine your options. Verify those before acting."

PREVENTION

Do not invent a root cause ("the root cause is that your household never established written standards") or a universal prevention claim ("a written roommate agreement prevents most disputes like this"). Prefer conditional framing: "If unclear expectations contributed here, writing down whatever you both actually agree to could make future misunderstandings less likely." Prevention must follow from the supplied conflict or be clearly conditional.

ONE THING NOT TO LOSE SIGHT OF

Use only when there is one particularly useful perspective. Do not validate facts you cannot know, diagnose either person, pronounce the visitor "not uptight," tell them their feelings are objectively correct, or become the visitor's partisan ally. Be direct without pretending to possess the other side of the story.

VOICE

Write directly to the visitor as "you." Be practical, even-handed, calm, specific, willing to say the visitor's request appears unreasonable, and willing to say the other person's reported response does not address a legitimate household problem. Do not become bland in the name of neutrality — Roommate Court can still have a verdict-like personality. The personality comes from a clear read and useful judgment, not fabricated certainty.

FINAL RULE: HEAR THE CASE. DO NOT PRETEND YOU HEARD THE OTHER WITNESS.

${NO_QUOTE_RULE}`;

const ASSIGNER_SYSTEM = `ROOMMATE COURT — CHORE ROULETTE

ROLE

Divide a supplied set of household chores among supplied household members. The goal is not to prove objective fairness. The goal is to produce a reasonable rotation using only the information available.

NO UNIVERSAL CHORE WEIGHTS

Do not assume "dishes = 2, bathroom = 3, vacuum = 1" or any universal effort value. The burden of a chore depends on home size, frequency, household standards, amount of mess, equipment, mobility/access needs, travel, and personal circumstances — unless supplied. If the visitor supplies load labels (LIGHTER / MEDIUM / HEAVIER), use those labels only as household-provided relative weights. If no load information is supplied, treat chores as unweighted tasks.

NO FAKE FAIRNESS SCORE

Never generate a percentage like "78% fair" or "100% fair" — there is no defensible denominator for household fairness. Replace "effort balance" with THIS ROUND, and, when history exists, ROTATION SO FAR. Allowed factual arithmetic: "Jane: 2 chores this round, Ralph: 1 chore this round," or, when visitor-supplied weights exist, "Jane: 4 household load points, Ralph: 3 household load points" — clearly labeled as a balancing device, not an objective measure of effort or fairness.

FIRST ROUND

Without history, distribute chores as evenly as practical. If visitor-supplied load weights exist, balance those supplied weights as reasonably as possible. If no weights exist, balance chore count and randomize among similarly balanced assignments. Do not say one person "has had it easy."

HISTORY

History may establish which chores someone received, how many chores they received, visitor-supplied relative load values, and repeated assignment of the same chore. History does NOT establish who worked harder, who resented a chore, who completed it well, who had more free time, or who was overburdened in life generally.

Use history to rotate assignments. Prefer avoiding repeated assignment of the same less-desirable/heavier chore when practical IF its relative burden was supplied. Do not impose "never give the same heavy chore twice" — sometimes repetition is preferred or practical.

ASSIGNMENT LOGIC

Priority: 1. assign every supplied chore, 2. keep number/load reasonably balanced, 3. use history to rotate recurring assignments, 4. avoid unnecessary repetition, 5. randomize among similarly reasonable alternatives. Do not optimize to an invented precision.

WHY THESE ASSIGNMENTS

Explain only from actual assignment data. Good: "Jane and Ralph had Bathroom and Mopping last round, so this round rotates those chores to Jimmy and Billy." Good: "With four chores and four people, everyone receives one." Bad: "This corrects the burden Jane and Ralph carried last round" — unless burden was actually supplied. Bad: "Jimmy and Billy should get heavier chores next time" — unless the household supplied relative weights and the rotation supports it.

SPIN AGAIN

Spin Again should generate another assignment that still respects the same constraints and history. It is not permission to discard balancing logic randomly.

${NO_QUOTE_RULE}`;

const REVIEW_SYSTEM = `ROOMMATE COURT — REVIEW AN ASSIGNMENT

The visitor says the current chore assignment does not work. Treat the complaint as NEW INFORMATION, not as a claim to put on trial.

Do not return a verdict like "complaint valid," "complaint invalid," "complaint upheld," or "assignment was fair." A complaint may reveal information that was not present when the assignment was generated.

Determine:
1. What new information did the visitor provide?
2. Does it create a real constraint?
3. Does it change the balancing information?
4. Should the assignment change?

Use only: current assignments, supplied history, supplied chore-load labels, and the new visitor information. Do not decide whether someone's subjective feeling is objectively justified.

Example good response: "The history already shows that you did Bathroom last round. Rotating it away from you is reasonable, so I've reassigned it." Or: "You've said Grocery Run isn't possible for Ralph. I didn't know that before, so I've treated it as a constraint and rebalanced the remaining chores."

Never answer: "Your complaint is not valid because the score says the assignment is fair."

${NO_QUOTE_RULE}`;

function cleanString(value, max = 8000) {
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

function formatChoreHistory(hist) {
  if (!hist || !hist.length) return '';
  return `\n\nASSIGNMENT HISTORY (most recent first):\n${hist.map((round, i) => {
    const assignments = round.assignments.map(a =>
      `  ${a.roommate}: ${a.chores.map(ch => `${ch.name}${ch.load && ch.load !== 'UNSPECIFIED' ? ` (${ch.load})` : ''}`).join(', ')}`
    ).join('\n');
    return `Round ${hist.length - i}${round.date ? ` (${round.date})` : ''}:\n${assignments}`;
  }).join('\n\n')}`;
}

router.post('/roommate-court', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { action } = req.body;
    const userLanguage = cleanString(req.body.userLanguage, 20) || 'en';

    // ── WORK IT OUT ──
    if (action === 'mediate') {
      const dispute = cleanString(req.body.dispute, 6000);
      const yourSide = cleanString(req.body.yourSide, 4000);
      const theirSide = cleanString(req.body.theirSide, 4000);
      const duration = cleanString(req.body.duration, 100);
      const priorCommunication = cleanString(req.body.priorCommunication, 100);
      const livingSituation = cleanString(req.body.livingSituation, 100);

      if (!dispute) return res.status(400).json({ error: "Describe what's going on." });

      const prompt = `CASE FILE:
Living situation: ${livingSituation || 'not specified'}
Duration of issue: ${duration || 'not specified'}
Prior communication attempts: ${priorCommunication || 'not specified'}

WHAT'S GOING ON (the visitor's account):
${dispute}

WHAT'S THEIR SIDE (the visitor's own account of the situation, if given beyond the description above):
${yourSide || 'not separately provided'}

WHAT WOULD THEY SAY (the visitor's understanding of the other person's perspective — may be absent; do not treat absence as evidence of anything):
${theirSide || 'not provided — the visitor does not know or did not guess'}

Return ONLY valid JSON matching this schema:
{
  "the_read": {
    "label": "YOUR REQUEST LOOKS REASONABLE|THEIR CONCERN LOOKS REASONABLE TOO|YOU MAY BE ASKING TOO MUCH|THEIR RESPONSE DOESN'T ADDRESS THE PROBLEM|YOU'RE TALKING PAST EACH OTHER|THE EXPECTATION ISN'T CLEAR YET|THIS NEEDS A FIRMER BOUNDARY|NOT ENOUGH TO TELL",
    "explanation": "2-3 sentences"
  },
  "where_the_disagreement_is": {
    "your_stated_concern": "",
    "their_reported_concern": "",
    "collision": "the practical conflict between the two",
    "unknowns_that_matter": [""]
  },
  "what_to_try": [
    { "action": "", "why_it_may_help": "" }
  ],
  "conversation": {
    "start_with_this": "a short opening the visitor can actually say",
    "ask_this": "one useful question that invites information the visitor doesn't have",
    "if_they_push_back": [
      { "possible_response": "clearly a possibility, not something already said", "you_could_say": "" }
    ],
    "proposal": "a concrete proposal the visitor could make — never an agreement already reached"
  },
  "if_that_doesnt_work": [
    { "next_step": "", "when_it_makes_sense": "" }
  ],
  "one_thing_not_to_lose_sight_of": ""
}

the_read.label MUST be exactly one of the English options above even in another language — it is a code value the UI switches on, not display text. Omit unsupported or unnecessary fields — do not force three actions, three escalation steps, or multiple pushback scenarios when fewer genuinely fit. unknowns_that_matter at most 3, what_to_try at most 4, if_they_push_back at most 2, if_that_doesnt_work at most 3.`;

      const parsed = await callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: 3500,
        system: withLanguage(MEDIATOR_SYSTEM, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
        messages: [{ role: 'user', content: prompt }],
      }, { label: 'roommate-court-v2' });

      if (!parsed?.the_read?.label) {
        return res.status(500).json({ error: 'Could not work through this. Please try again.' });
      }

      await runOutputGuard(parsed, {
        label: 'roommate-court-v2',
        fields: collectProseFields(parsed),
        supplied: `SITUATION: ${dispute}\nYOUR SIDE: ${yourSide || 'none'}\nWHAT WOULD THEY SAY: ${theirSide || 'none supplied'}\nDURATION: ${duration || 'none'}\nTRIED SO FAR: ${priorCommunication || 'none'}\nLIVING SITUATION: ${livingSituation || 'none'}`,
        promise: 'Help the visitor separate fact from disagreement in a household conflict, using only their account — never adjudicate fault, invent a hidden root conflict, or script a fictional agreement.',
        guard: router.outputGuard,
        userLanguage,
      });

      return res.json(parsed);
    }

    // ── CHORE ROULETTE: ASSIGN ──
    if (action === 'assign') {
      const roommates = Array.isArray(req.body.roommates) ? req.body.roommates.map(r => cleanString(r, 60)).filter(Boolean) : [];
      const chores = Array.isArray(req.body.chores) ? req.body.chores : [];
      const hist = Array.isArray(req.body.history) ? req.body.history : (Array.isArray(req.body.sessionHistory) ? req.body.sessionHistory : []);

      if (roommates.length < 2) return res.status(400).json({ error: 'Need at least 2 household members.' });
      if (!chores.length) return res.status(400).json({ error: 'Add at least 1 chore.' });

      const choreLines = chores.map(ch => {
        const name = cleanString(typeof ch === 'string' ? ch : ch?.name, 80);
        const load = typeof ch === 'object' && ch?.load ? cleanString(ch.load, 20).toUpperCase() : '';
        return `${name}${load && load !== 'UNSPECIFIED' ? ` (household-supplied load: ${load})` : ''}`;
      }).filter(Boolean);

      const prompt = `HOUSEHOLD:
Members: ${roommates.join(', ')}
Chores to assign: ${choreLines.join(', ')}
${formatChoreHistory(hist)}

Assign every chore listed above to a member. ${hist.length ? 'Use the history to rotate fairly.' : 'This is the first round — no history exists yet.'}

Return ONLY valid JSON matching this schema:
{
  "assignments": [
    { "roommate": "", "chores": [ { "name": "", "load": "UNSPECIFIED|LIGHTER|MEDIUM|HEAVIER" } ] }
  ],
  "this_round": {
    "chore_counts": { "Name": 1 },
    "load_totals": null
  },
  "why_these_assignments": "",
  "rotation_note": ""
}

Each chore's "load" must echo back exactly what was supplied for it above (or UNSPECIFIED if none was supplied) — never invent your own load judgment. Only populate load_totals (an object mapping each roommate to a summed count of their LIGHTER=1/MEDIUM=2/HEAVIER=3 chores) when at least one chore had a household-supplied load; otherwise leave it null. rotation_note is optional — omit it if there is nothing worth noting about rotation.`;

      const parsed = await callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: 2200,
        system: withLanguage(ASSIGNER_SYSTEM, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
        messages: [{ role: 'user', content: prompt }],
      }, { label: 'roommate-court-chores-v2' });

      if (!parsed?.assignments) {
        return res.status(500).json({ error: 'Could not divide the chores. Please try again.' });
      }
      return res.json(parsed);
    }

    // ── CHORE ROULETTE: REVIEW AN ASSIGNMENT ──
    if (action === 'rebalance') {
      const currentAssignments = Array.isArray(req.body.currentAssignments) ? req.body.currentAssignments : [];
      const complaint = cleanString(req.body.complaint, 2000);
      const hist = Array.isArray(req.body.history) ? req.body.history : (Array.isArray(req.body.sessionHistory) ? req.body.sessionHistory : []);

      if (!complaint) return res.status(400).json({ error: "What's wrong with this assignment?" });
      if (!currentAssignments.length) return res.status(400).json({ error: 'No current assignment to review.' });

      const prompt = `CURRENT ASSIGNMENT:
${currentAssignments.map(a => `${a.roommate}: ${a.chores.map(ch => `${ch.name}${ch.load && ch.load !== 'UNSPECIFIED' ? ` (${ch.load})` : ''}`).join(', ')}`).join('\n')}
${formatChoreHistory(hist)}

WHAT THE VISITOR SAYS DOESN'T WORK:
${complaint}

Return ONLY valid JSON matching this schema:
{
  "what_changed": "the new information the visitor's complaint actually provided",
  "adjustment_needed": true,
  "revised_assignments": [ { "roommate": "", "chores": [ { "name": "", "load": "UNSPECIFIED|LIGHTER|MEDIUM|HEAVIER" } ] } ],
  "explanation": ""
}

If no adjustment is needed, set adjustment_needed to false and revised_assignments to null — but explanation must still say what the complaint told you and why it doesn't change anything, not merely assert the assignment was fair.`;

      const parsed = await callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: 1800,
        system: withLanguage(REVIEW_SYSTEM, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
        messages: [{ role: 'user', content: prompt }],
      }, { label: 'roommate-court-review-v2' });

      if (parsed?.adjustment_needed === undefined) {
        return res.status(500).json({ error: 'Could not review that. Please try again.' });
      }
      return res.json(parsed);
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });

  } catch (error) {
    console.error('RoommateCourt error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

router.outputStandard = 'v2';
router.outputGuard = {
  prohibit: [
    'fault_percentage_assigned', 'real_conflict_or_root_cause_invented', 'fictional_conversation_scripted',
    'proposal_treated_as_accepted_agreement', 'unsourced_tenancy_or_landlord_claim', 'universal_prevention_claim',
    'chore_load_invented_without_household_input', 'fake_fairness_score', 'complaint_declared_valid_or_invalid',
  ],
  require: ['fulfills_tool_promise'],
};

module.exports = router;
