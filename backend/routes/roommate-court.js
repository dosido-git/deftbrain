const express = require('express');
const { answer, onlyKeys, planFirst, planNote } = require('../lib/progressive');
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
// LEAN (2026-11-01, audit/LEAN-PROMPT-STANDARD.md). The v2 prompt was ~3,300
// words of rules, one per past defect, sent on top of the two global contracts
// to four calls that could not see each other; a 450-word prompt in a plain
// chat app beat it. The shared checks still run after the answer shows.
const MEDIATOR_SYSTEM = `ROOMMATE COURT — WORK IT OUT
Help someone think through a conflict with a person they share a home with (a roommate, partner or family member) and go into the conversation with a plan.

Usually you have one side. What they report the other person said or wants is reported, not established. Don't decide fault, give blame percentages, or claim to know the hidden "real" conflict or anyone's motives. Work on the practical disagreement: what each person wants, where that collides, and what is still unknown.

A good answer gives:
- THE READ: one label, then what is going on as far as their account shows, which approach you would start with, and how sure you are and what would change that.
- WHERE THE DISAGREEMENT IS: their concern, the other person's reported concern, the practical collision, and up to three unknowns that would change the advice.
- OPTIONS that are genuinely different (change the system, a temporary adjustment with an end date, how requests or reminders happen, renegotiating), each with why it may help and what it costs.
- THE CONVERSATION: an opening they can say word for word, one question that gets information they lack, likely responses with calm replies, and a proposal with real details (who, what, when, what happens on a miss), offered as a proposal, never as agreed.
- IF THAT DOESN'T WORK: proportionate next steps in order, each with the sign it is time: a clearer second try, writing down what was agreed, a neutral mediator, an RA or landlord only where that fits, a change in living arrangement.
- ONE THING NOT TO LOSE SIGHT OF, only when there is one.

Housing law, lease terms and tenant rights vary by place: never state them; say to check the lease and local rules.

Labels for THE READ: YOUR REQUEST LOOKS REASONABLE · THEIR CONCERN LOOKS REASONABLE TOO · YOU MAY BE ASKING TOO MUCH · THEIR RESPONSE DOESN'T ADDRESS THE PROBLEM · YOU'RE TALKING PAST EACH OTHER · THE EXPECTATION ISN'T CLEAR YET · THIS NEEDS A FIRMER BOUNDARY · NOT ENOUGH TO TELL

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
      // "Ask the other person" (src/components/InviteKit.js): theirSide was
      // written by them, and on an ask link the description was too.
      const theirOwnWords = req.body.theirOwnWords === true;
      const disputeByThem = req.body.disputeByThem === true;

      if (!dispute) return res.status(400).json({ error: "Describe what's going on." });

      // Speed (2026-10-15): one call wrote ~1.9k tokens (39s of a 56s run in
      // German). Two calls now write disjoint keys at once: the read (what is
      // going on and what to try) and the conversation (what to say, and what
      // next if it fails). Both see the whole case file; the guard's
      // consistency check reads the merged answer.
      const caseFile = `CASE FILE:
Living situation: ${livingSituation || 'not specified'}
Duration of issue: ${duration || 'not specified'}
Prior communication attempts: ${priorCommunication || 'not specified'}

WHAT'S GOING ON (${disputeByThem ? "the other person's description, written when they asked the visitor for their side" : "the visitor's account"}):
${dispute}

WHAT'S THEIR SIDE (the visitor's own account of the situation, if given beyond the description above):
${yourSide || 'not separately provided'}

${theirOwnWords ? "THEIR SIDE (written by the other person themselves, in their own words — give it the same weight as the visitor's side)" : "WHAT WOULD THEY SAY (the visitor's understanding of the other person's perspective — may be absent; do not treat absence as evidence of anything)"}:
${theirSide || 'not provided — the visitor does not know or did not guess'}`;
      const shape = `${caseFile}

Return ONLY valid JSON:
{
  "the_read": {
    "label": "one label, exactly as listed in English",
    "explanation": "2-4 short sentences"
  },
  "where_the_disagreement_is": {
    "your_stated_concern": "",
    "their_reported_concern": "",
    "collision": "",
    "unknowns_that_matter": [""]
  },
  "what_to_try": [
    { "action": "", "why_it_may_help": "why it may help and what it costs" }
  ],
  "if_that_doesnt_work": [
    { "next_step": "", "when_it_makes_sense": "" }
  ],
  "one_thing_not_to_lose_sight_of": "",
  "conversation": {
    "start_with_this": "words to say aloud, first person",
    "ask_this": "",
    "if_they_push_back": [
      { "possible_response": "their likely words only, no lead-in", "you_could_say": "" }
    ],
    "proposal": ""
  }
}

the_read.label stays in English in every language: the page switches on it. Leave out a field that has nothing true to say. unknowns_that_matter at most 3, what_to_try at most 4, if_that_doesnt_work at most 3, if_they_push_back at most 2.`;

      const system = withLanguage(MEDIATOR_SYSTEM, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);
      const call = (content, max, tag) => callClaudeWithRetry({
        model: MODELS.SMART, max_tokens: max, system,
        messages: [{ role: 'user', content: withLanguage(content, userLanguage) }],
      }, { label: `roommate-court-lean-${tag}` });
      // Speed: the read shows first (~200 tokens, ~3s); three passes handed it
      // write the rest at once, each under ~1,200 tokens (one pass writing
      // options + next steps reached 1,700 and 15s). onlyKeys tells each pass
      // what the others carry, so a point is made once.
      const ORDER = ['the_read', 'where_the_disagreement_is', 'what_to_try', 'conversation', 'if_that_doesnt_work', 'one_thing_not_to_lose_sight_of'];
      const parts = planFirst(
        ['the_read'], () => call(onlyKeys(shape, ['the_read']), 400, 'read'),
        [['where_the_disagreement_is', 'what_to_try'], ['conversation'], ['if_that_doesnt_work', 'one_thing_not_to_lose_sight_of']],
        (keys, i, plan) => call(onlyKeys(shape, keys) + planNote(plan, ['the_read']), 1200, ['plan', 'talk', 'next'][i]),
      );
      return await answer(req, res, {
        label: 'roommate-court-lean',
        parts,
        // Original key order, so the page renders as before.
        finish: d => Object.fromEntries(ORDER.filter(k => d[k] !== undefined).map(k => [k, d[k]])),
        ready: d => Boolean(d.the_read?.label),
        complete: d => Boolean(d.the_read?.label),
        check: d => runOutputGuard(d, {
          label: 'roommate-court-lean',
          fields: collectProseFields(d),
          supplied: `SITUATION: ${dispute}\nYOUR SIDE: ${yourSide || 'none'}\nWHAT WOULD THEY SAY: ${theirSide || 'none supplied'}\nDURATION: ${duration || 'none'}\nTRIED SO FAR: ${priorCommunication || 'none'}\nLIVING SITUATION: ${livingSituation || 'none'}`,
          promise: 'Help the visitor separate fact from disagreement in a household conflict, using only their account — never adjudicate fault, invent a hidden root conflict, or script a fictional agreement.',
          guard: router.outputGuard,
          userLanguage,
        }),
      });
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

router.outputStandard = 'lean';
router.outputGuard = {
  prohibit: [
    'fault_percentage_assigned', 'real_conflict_or_root_cause_invented', 'fictional_conversation_scripted',
    'proposal_treated_as_accepted_agreement', 'unsourced_tenancy_or_landlord_claim', 'universal_prevention_claim',
    'chore_load_invented_without_household_input', 'fake_fairness_score', 'complaint_declared_valid_or_invalid',
  ],
  require: ['fulfills_tool_promise'],
};

module.exports = router;
