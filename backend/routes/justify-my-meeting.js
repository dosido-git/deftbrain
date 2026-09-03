const express = require('express');
const router = express.Router();
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

const NO_QUOTE_RULE = 'Never place a double-quote (") character inside any JSON string value — write quoted phrases plainly or with single quotes, or it breaks the JSON.';

const SHARED = `
MEETING WORTH IT? — SHARED INSTRUCTIONS
DEFTBRAIN_OUTPUT_STANDARD_V2

You evaluate whether synchronous meeting time is justified by the situation the visitor describes.

Be skeptical of unnecessary meetings, but do not begin from the assumption that meetings are wasteful.

The question is not:
Could this information technically be communicated another way?

The question is:
What does having these people together at the same time make possible, and is that benefit worth the time being asked of them?

A meeting may justify synchronous time when real-time interaction materially helps with things such as:
- making a decision
- resolving disagreement
- discovering information through discussion
- coordinating interdependent work
- generating or evaluating ideas together
- handling a sensitive or ambiguous issue
- building shared understanding where back-and-forth matters
- responding to something genuinely time-sensitive

Information sharing alone does not automatically make a meeting unnecessary.
A status meeting may also create useful questioning, coordination, accountability, escalation, or shared awareness.

Evaluate what the visitor actually describes.

GROUNDING

Distinguish:
ESTABLISHED — supplied by the visitor
REASONABLE IMPLICATION — follows cautiously from supplied facts
UNKNOWN — would matter but was not supplied

Absence of information is not evidence of absence.

Do not infer:
- organizer competence or motives
- attendee engagement
- organizational culture
- whether participants are passive
- whether attendees are the correct people
- whether decisions are actually being made
- whether discussion occurs
- whether people find the meeting valuable
- whether asynchronous communication would work equally well
unless the visitor supplied enough information to support the conclusion.

Do not treat arbitrary thresholds as rules.

Never claim:
- 10+ attendees is inherently too many
- 60 minutes is inherently too long
- no prep means low cognitive demand
- recurring meetings are inherently suspect
- status updates inherently belong async
- large groups cannot collaborate productively

Those facts may affect the analysis, but only in context.

MEASUREMENT

Calculate person-hours only from supplied duration and attendee count.

person_hours = duration × attendees

This is a time footprint, not automatically wasted time.

Never invent:
- confidence percentages
- quality scores
- productivity percentages
- savings percentages
- hours that could definitely be saved

Potential savings may be calculated only after proposing a concrete alternative whose duration and participation assumptions are explicitly shown.

Do not turn uncertainty into fake precision.

TIME FOOTPRINT RULES

Person-hours are arithmetic, not AI judgment.

If duration and attendees are supplied:
duration × attendees = person-hours per occurrence.

For recurring meetings, calculate annual person-hours only when frequency is supplied.

Display:
22 people × 1 hour = 22 person-hours each meeting.

If weekly:
22 × 1 × 52 = 1,144 scheduled person-hours per year.

Do NOT call those hours:
- burned
- wasted
- lost
- reclaimable

unless the analysis establishes which portion could actually be removed.

Do not convert person-hours into 'full work weeks' unless the interface explicitly
defines the assumed work-week length.

FINAL GROUNDING PASS

These twelve are the ones that survived every earlier round of prose and had to
be written down individually. Each names a specific move the model kept making.

1. Never infer other attendees' behaviour from the visitor's own behaviour.
   The visitor saying they speak for 90 seconds establishes what THEY do. It
   establishes nothing about how anyone else in the room uses their time.
   Say so plainly instead: 'The input does not establish how the other
   attendees use their time.'

2. Recurrence or age does not establish habit, stagnation, or lack of redesign.
   'Recurring for six months' establishes that it recurs. It does not establish
   that nobody has redesigned it, that it runs on momentum, or that it has
   settled into anything. It makes the question worth asking — write the
   question, not the conclusion.

3. Lack of preparation does not establish low engagement or low cognitive
   demand. No prep establishes no prep. At most: preparation is not part of the
   meeting's described value.

4. Do not invent benefits merely to balance a verdict. A section with nothing
   established to put in it stays empty. Balance is not a quota.

5. Meeting-type labels do not establish what the meeting accomplishes.
   '1:1', 'design review', 'standup', 'planning', 'retro' are names. They do not
   tell you what happens, who needs to be there, or why it is live.

6. A decision-oriented purpose may justify synchronous discussion, but does not
   establish that every attendee is needed, or that the decision is contested.

7. Do not describe a discussion as contested, sensitive, difficult or heated
   unless the visitor described it that way.

8. Build the Agenda designs the improved meeting. It does not continue arguing
   against the old one. Once the visitor has asked for an agenda, the verdict is
   settled — criticism of the existing format does not belong in any field.

9. Agenda recommendations may be conditional. Do not invent attendees, roles,
   authority, blockers, dependencies, decisions, preparation practices, or
   desired outcomes. Where an item depends on something not established, write
   it conditionally: 'if anyone has flagged something', not 'the blockers are'.

10. Do not manufacture minute-by-minute allocations merely to fill the supplied
    duration. If the useful live work may take less time than the slot, say so.
    An agenda that fills sixty minutes after recommending a twenty-minute
    meeting contradicts its own advice.

11. WHAT WOULD BE LOST contains established value or explicitly conditional
    possibilities only.

12. Scripts must not assume a follow-up conversation, escalation, or any other
    action will happen unless the visitor established it. Offer it as a question
    the room can answer, not as a plan the room has agreed to.

13. No prep does not establish that advance thought is unnecessary either. It
    establishes that preparation is not part of the described value, so the case
    for the meeting has to rest on what happens live. Write that.

14. Do not infer that a group is too large from headcount alone. A number is not
    a verdict on who belongs there. When you do not know how attendees
    contribute, say that it is unknown whether everyone needs to attend.

15. When a pre-read is circulated late, that may create a risk that live time
    goes on orientation. It does not establish that anyone is unprepared. Name
    the risk; do not report the state.

16. Never say an interaction 'cannot happen async', 'requires synchronous time'
    or 'is impossible in writing' unless that is literally true. It almost never
    is. Say it is likely to benefit from real-time exchange, and say why —
    what the back-and-forth actually does that a thread would not.

17. In a drafted message, explain the STRUCTURE of the message: what it leads
    with, what it concedes, what it asks for, what it leaves open. Never predict
    the recipient's reaction. You do not know whether they will agree, feel
    defensive, be receptive, or appreciate the framing, and saying so turns a
    piece of writing advice into a claim about a person you have never met.

Reason freely about meeting design. Assert carefully about the meeting.

VOICE

Direct, lively, slightly irreverent.

You may call a meeting:
- unnecessary
- bloated
- poorly designed
- expensive in people's time
- meeting-shaped information delivery

Do not insult organizers or attendees.

Be equally willing to say:
'Keep it. This meeting earns its place.'

The personality comes from clear judgment, not predetermined cynicism.
`;

// ── Deterministic backstops ──────────────────────────────────────────────
// The old version led with "95% confidence · Quality: 2/10". Numbers like that
// are the failure this rewrite exists to remove, so they are checked rather
// than merely forbidden.
const FAKE_PRECISION = new RegExp([
  '\\b\\d{1,3}\\s?%\\s?(?:confiden\\w*|sure|certain|productiv\\w*|wasted|efficien\\w*)',
  '\\bconfidence[:\\s]+\\d',
  '\\b(?:quality|meeting|bs|zombie)[- ]?score\\b',
  '\\b\\d{1,2}\\s?/\\s?10\\b',
  '\\b(?:full )?work[- ]weeks?\\b',
].join('|'), 'i');

// Hours described as destroyed before anything established which portion could
// actually be removed.
const HOURS_BURNED = /\b(?:person[- ]?hours?|hours?)\b[^.]{0,40}\b(?:burned|wasted|lost|squandered|reclaimable|down the drain)\b|\b(?:burned|wasted|lost)\b[^.]{0,25}\b(?:person[- ]?hours?|hours?)\b/i;

// The thresholds the shared instructions name outright.
const ARBITRARY_RULE = new RegExp([
  '\\b(?:more than|over|above)\\s*\\d+\\s*(?:attendees|people|participants)\\b[^.]{0,40}\\b(?:too many|cannot|never|not productive)\\b',
  '\\bexceeds the threshold\\b',
  '\\banything (?:over|longer than) \\d+ minutes\\b',
  '\\bstatus (?:updates?|meetings?) (?:belong|should be|are always)\\b',
  '\\bno prep\\b[^.]{0,40}\\b(?:confirms|means|proves)\\b',
  '\\brecurring meetings? (?:are|tend to be) (?:inherently |usually |always )?(?:suspect|wasteful|pointless)\\b',
].join('|'), 'i');

// Reading the room from a text box.
const INFERRED_STATE = new RegExp([
  '\\b(?:roughly |about |approximately )?\\d+ (?:people|attendees) are (?:passive|just listening|not engaged|disengaged)\\b',
  '\\b(?:most|many|roughly \\d+|about \\d+|\\d+ of the) (?:attendees|people|participants) are (?:passive |just |mostly )?listen\\w*',
  '\\bpassive listeners\\b',
  '\\b(?:attendees|participants|people) are (?:bored|disengaged|checked out|tuning out)\\b',
  '\\bthe organi[sz]er (?:does not|doesn\\x27t|has not|hasn\\x27t) (?:care|understand|think)\\b',
  '\\bnobody (?:wants|likes|values) (?:this|these) meetings?\\b',
].join('|'), 'i');
// ── Final grounding pass, 2026-09-03 ──────────────────────────────────────
// Four more classes that survived the prose. Each is a real sentence the model
// produced, not a hypothetical.

// "most attendees are in a similar passive position" — generalising the
// visitor's own described behaviour to the rest of the room.
const GENERALISED_FROM_SELF = new RegExp([
  '\\b(?:most|the other|the rest of the|all (?:the )?other|everyone else)\\s+(?:attendees?|participants?|people|team ?leads?)\\b[^.]{0,60}\\b(?:similar|same|likewise|too|also|equally)\\b',
  '\\bsuggests? (?:that )?(?:most|the other|everyone else|all)\\b[^.]{0,50}\\b(?:attendees?|participants?|people)\\b',
  '\\b(?:most|the other) (?:attendees?|participants?) are\\b[^.]{0,40}\\b(?:passive|listening|silent|disengaged|in a similar)\\b',
].join('|'), 'i');

// "six months of recurrence without apparent redesign suggests habit" —
// recurrence read as stagnation.
const RECURRENCE_AS_HABIT = new RegExp([
  '\\b(?:recurr\\w+|running|standing|been (?:in place|on the calendar)|\\d+\\s*(?:months?|years?|weeks?))\\b[^.]{0,70}\\b(?:settled into|out of habit|by habit|momentum|inertia|autopilot|on autopilot|never been redesigned|without (?:apparent )?redesign|has not been (?:revisited|redesigned|questioned))\\b',
  '\\b(?:habit|inertia|momentum) rather than (?:intent|purpose|need|design)\\b',
].join('|'), 'i');

// "no prep signals low cognitive engagement" — the one the SHARED block already
// bans by name and the model wrote anyway.
const NO_PREP_AS_ENGAGEMENT = new RegExp([
  '\\bno (?:prep|preparation|pre-?read|pre-?work)\\b[^.]{0,60}\\b(?:low|little|minimal|shallow)\\b[^.]{0,25}\\b(?:engagement|cognitive|thinking|effort|demand|investment)\\b',
  '\\b(?:low|little|minimal) (?:cognitive )?(?:engagement|demand|effort) is (?:expected|designed|assumed|required)\\b',
].join('|'), 'i');

// "any soft accountability that comes from saying tasks out loud" — a benefit
// invented so the analysis looks even-handed. Only fires unhedged: a clearly
// conditional version of the same sentence is allowed and wanted.
const MANUFACTURED_BENEFIT = new RegExp([
  '\\b(?:informal|soft|implicit|tacit|social) (?:coordination|accountability|pressure|glue|cohesion|connection|bonding)\\b',
  '\\bteam (?:cohesion|bonding|morale|connection|camaraderie)\\b',
  '\\bsense of (?:accountability|belonging|shared purpose|connection)\\b',
].join('|'), 'i');

// ── Micro-pass, 2026-09-03 ───────────────────────────────────────────────
// Three of the six are shaped like something a regex can see. The other three
// (no-prep, pre-read timing, agenda roles) are about what a sentence ASSERTS
// rather than which words it uses, and live in the field descriptions instead —
// a pattern loose enough to catch them would blank correct sentences too.

// "this cannot happen async" / "requires synchronous time". Almost never
// literally true, and the honest version — likely to benefit, and why — is
// both more accurate and more useful.
const ASYNC_ABSOLUTISM = new RegExp([
  '\\b(?:cannot|can\\x27t|could not|couldn\\x27t|impossible to)\\b[^.]{0,45}\\b(?:async|asynchronous\\w*|in writing|over (?:email|slack|chat)|be written)\\b',
  '\\b(?:async|asynchronous\\w*|writing|written|email|slack|a thread)\\b[^.]{0,35}\\b(?:cannot|can\\x27t|will not|would not|does not|wouldn\\x27t|won\\x27t) (?:work|do|suffice|be enough)\\b',
  '\\b(?:requires?|demands?|needs?) (?:real[- ]time|synchronous|live) (?:time|interaction|discussion|exchange|conversation)\\b',
  '\\b(?:only|exclusively) (?:possible|works) (?:live|in real[- ]time|synchronously)\\b',
  '\\bhas to (?:happen|be done) (?:live|synchronously|in real[- ]time)\\b',
].join('|'), 'i');

// A headcount read as a verdict on who belongs. ARBITRARY_RULE already covers
// the explicit threshold form ("more than 10 attendees is too many"); this is
// the softer version that slipped past it.
const HEADCOUNT_AS_VERDICT = new RegExp([
  '\\b\\d+\\s*(?:people|attendees|participants)\\b[^.]{0,45}\\b(?:too many|more than (?:is )?needed|does not need|do not (?:all )?need to|need not all)\\b',
  '\\b(?:people|attendees|participants)\\b[^.]{0,20}\\b(?:is|are|feels?|seems?) too many\\b',
  '\\btoo many (?:people|attendees|participants|voices)\\b',
  '\\bwith \\d+ (?:people|attendees)[^.]{0,30}\\b(?:meaningful|real|genuine) (?:discussion|participation|dialogue) (?:is|becomes)\\b',
].join('|'), 'i');

// Predicting how the recipient of a drafted message will react.
const PREDICTED_REACTION = new RegExp([
  '\\b(?:they|the (?:organi[sz]er|manager|recipient|reader))\\b[^.]{0,40}\\b(?:will|are) (?:more )?likely to (?:agree|accept|say yes|respond well|receive)\\b',
  '\\bmakes (?:them|the (?:organi[sz]er|recipient|reader)) (?:more likely to|feel|less defensive|receptive)\\b',
  '\\b(?:will|would) (?:not )?(?:feel|come across as|be taken as) (?:defensive|attacked|criticis\\w+|dismissed|appreciated)\\b',
  '\\b(?:they|your (?:manager|boss|lead)|the (?:organi[sz]er|manager|recipient|reader|team)) (?:will|would|is likely to|are likely to) (?:appreciate|respect|welcome|resent|resist|understand|see)\\b',
  '\\b(?:disarms?|preempts?|defuses?) (?:their |any )?(?:defensiveness|resistance|objection)\\b',
].join('|'), 'i');

const HEDGED = /\b(?:if|whether|may|might|could|unknown|not established|you did not (?:say|describe)|unless)\b/i;

const RULES = [
  ['invented a score or percentage', FAKE_PRECISION],
  ['called hours wasted before establishing which could be removed', HOURS_BURNED],
  ['applied a threshold as a rule', ARBITRARY_RULE, (v) => HEDGED.test(v)],
  ['inferred what people in the room were doing', INFERRED_STATE, (v) => HEDGED.test(v)],
  ['generalised the visitor\'s own behaviour to the rest of the room', GENERALISED_FROM_SELF],
  ['read recurrence as habit or stagnation', RECURRENCE_AS_HABIT],
  ['read no-prep as low engagement', NO_PREP_AS_ENGAGEMENT],
  ['manufactured a benefit to balance the verdict', MANUFACTURED_BENEFIT, (v) => HEDGED.test(v)],
  ['called something impossible async when it is only harder', ASYNC_ABSOLUTISM],
  ['read a headcount as a verdict on who belongs', HEADCOUNT_AS_VERDICT],
  ['predicted how the recipient would react', PREDICTED_REACTION],
];

const VERDICTS = ['KEEP IT', 'SHORTEN IT', 'FIX IT', 'MAKE IT ASYNC', 'NOT ENOUGH TO TELL'];
const ZOMBIE_VERDICTS = ['ALIVE AND USEFUL', 'NEEDS A REFRESH', 'TOO FREQUENT', 'SHOULD DIE', 'NOT ENOUGH TO TELL'];

function validateResult(data) {
  if (!data || typeof data !== 'object') return data;
  const walk = (node) => {
    // No early return for arrays. An array IS an object, so Object.entries
    // below enumerates its indices and node[k] = '' assigns into it — while
    // forEach(walk) handed each STRING element to a function that returns
    // immediately for non-objects, so every array-of-strings field went
    // unchecked. Found when Justify My Meeting emitted "most attendees are
    // passive listeners" inside why_this_verdict and the rule that exists
    // to catch exactly that did not fire.
    if (!node || typeof node !== 'object') return;
    for (const [k, v] of Object.entries(node)) {
      if (k === 'verdict' || k === 'verdict_emoji') continue;
      if (typeof v === 'string') {
        const hit = RULES.find(([, re, spare]) => re.test(v) && !(spare && spare(v)));
        if (hit) {
          if (v.length <= 220 && (v.match(/[.!?]/g) || []).length <= 1) {
            console.log(`[justify-my-meeting] ${k} blanked — ${hit[0]}: ${v.slice(0, 200)}`);
            node[k] = '';
          } else {
            console.log(`[justify-my-meeting] ${k} ${hit[0]} (left intact, too long to cut safely): ${v.slice(0, 200)}`);
          }
        }
      } else if (v && typeof v === 'object') walk(v);
    }
  };
  walk(data);
  // A blanked array item would render as an empty bullet, which reads worse than
  // no bullet. Blanking is right for a named field; for a list, removal is.
  const prune = (node) => {
    if (Array.isArray(node)) {
      for (let i = node.length - 1; i >= 0; i--) {
        if (node[i] === '') node.splice(i, 1); else prune(node[i]);
      }
      return;
    }
    if (node && typeof node === 'object') Object.values(node).forEach(prune);
  };
  prune(data);
  return data;
}

// Arithmetic belongs in code. The model is asked for the reasoning; the numbers
// are computed from what the visitor actually supplied, so there is nothing for
// it to round, embellish or invent.
function timeFootprint(durationHours, attendees, perYear) {
  const d = Number(durationHours);
  const a = Number(attendees);
  const out = {
    duration_hours: Number.isFinite(d) && d > 0 ? d : null,
    participants: Number.isFinite(a) && a > 0 ? Math.round(a) : null,
    person_hours: null,
    occurrences_per_year: null,
    annual_person_hours: null,
  };
  if (out.duration_hours !== null && out.participants !== null) {
    out.person_hours = Math.round(out.duration_hours * out.participants * 100) / 100;
    const n = Number(perYear);
    if (Number.isFinite(n) && n > 0) {
      out.occurrences_per_year = Math.round(n);
      out.annual_person_hours = Math.round(out.person_hours * out.occurrences_per_year);
    }
  }
  return out;
}

const PER_YEAR = { daily: 250, weekly: 52, biweekly: 26, fortnightly: 26, monthly: 12, quarterly: 4 };

// The frontend colours and localises these by value, so they have to survive
// withLanguage exactly. The prompt asks for English; this makes it true. Note
// the frontend maps the pinned value to a t() key — pinning to English here
// does not mean the visitor reads English.
const READS = ['earns its time', 'worth questioning', 'worth revisiting', 'not enough to tell'];
const FORMATS = ['Keep as-is', 'Shorter meeting', 'Smaller meeting', 'Async update', 'Async first meeting if needed', 'Other'];

function pinTo(value, allowed, fallback) {
  const v = String(value || '').trim().toLowerCase();
  return allowed.find(a => a.toLowerCase() === v) || fallback;
}

function pinVerdict(data, allowed, fallback) {
  if (!data) return data;
  const v = String(data.verdict || '').toUpperCase().trim();
  data.verdict = allowed.includes(v) ? v : fallback;
  return data;
}

// ═══════════════════════════════════════════════════════════════
// JUDGE A MEETING
// ═══════════════════════════════════════════════════════════════
router.post('/justify-my-meeting', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { meetingText, duration, attendees, context, userLanguage } = req.body;
    if (!meetingText?.trim()) return res.status(400).json({ error: 'Paste the invite, or describe the meeting.' });

    const prompt = `${SHARED}

JUDGE A MEETING

THE INVITE OR DESCRIPTION:
${meetingText.trim()}

DURATION: ${duration ? `${duration} hour(s)` : 'Not supplied — leave the time footprint out rather than guessing.'}
ATTENDEES: ${attendees ? attendees : 'Not supplied — leave the time footprint out rather than guessing.'}
ANYTHING ELSE THEY SAID MATTERS: ${context?.trim() || 'Nothing supplied.'}

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.

Return ONLY valid JSON:
{
  "verdict": "Exactly one of these English strings and nothing else: KEEP IT, SHORTEN IT, FIX IT, MAKE IT ASYNC, NOT ENOUGH TO TELL",
  "one_liner": "A memorable one-sentence judgment — the line they would repeat to a colleague",
  "what_we_know": ["A fact THEY supplied, restated plainly — one short line each"],
  "why_this_verdict": ["Specific reasoning grounded in what they supplied — one short line each. Where a step is inference rather than fact, say so. Three moves are banned outright here because they keep recurring: (a) do not generalise the visitor's own airtime to anyone else — say the input does not establish how the other attendees use their time; (b) do not read recurrence or age as habit, momentum or lack of redesign — say it recurs and that this makes the question worth asking; (c) do not read no-prep as low engagement, low cognitive demand, or as evidence that advance thought is unnecessary — say preparation is not part of the described value, so the case has to rest on what happens live. And never treat a headcount as a verdict on its own: if you do not know how the attendees contribute, say it is unknown whether everyone needs to attend"],
  "what_earns_the_meeting": ["Something synchronous time genuinely enables here — one short line each. Empty array if nothing supplied supports one. Never invent one to balance the verdict, and never call the discussion contested, sensitive or difficult unless they described it that way. Say something is LIKELY TO BENEFIT from real-time exchange and say what the back-and-forth does; never that it cannot happen async or requires synchronous time, which is almost never literally true"],
  "what_weakens_the_case": ["Something that makes synchronous time harder to justify here — one short line each. A pre-read circulated late is a RISK that live time goes on orientation; it does not establish that anyone is unprepared. Name the risk, not the state"],
  "unknowns_that_matter": ["Missing information that could materially change the verdict — one short line each"],
  "better_format": {
    "recommendation": "Exactly one of these English strings and nothing else: Keep as-is, Shorter meeting, Smaller meeting, Async update, Async first meeting if needed, Other",
    "how": "The concrete replacement or redesign — one or two sentences",
    "assumptions": "Anything that has to be true for this to work, or null — one sentence"
  },
  "next_move": "The most useful thing they can actually do next — one sentence",
  "if_it_has_to_happen": ["A concrete way to make the meeting earn its time — one short line each"]
}

ARRAY BOUNDS: what_we_know at most 5, why_this_verdict at most 4, what_earns_the_meeting at most 3, what_weakens_the_case at most 3, unknowns_that_matter at most 3, if_it_has_to_happen 2-3.

Do not include a time footprint, person-hours, or any arithmetic in any field — that is computed separately from the supplied numbers.

Return ONLY valid JSON. ${NO_QUOTE_RULE}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 4000,
      messages: [{ role: 'user', content: withLanguage(prompt, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion) }],
    }, { label: 'justify-my-meeting' });
    if (!parsed.verdict) return res.status(500).json({ error: 'Could not judge this one. Please try again.' });

    pinVerdict(parsed, VERDICTS, 'NOT ENOUGH TO TELL');
    if (parsed.better_format) parsed.better_format.recommendation = pinTo(parsed.better_format.recommendation, FORMATS, 'Other');
    parsed.time_footprint = timeFootprint(duration, attendees, null);
    res.json(validateResult(parsed));

  } catch (error) {
    console.error('[JustifyMyMeeting]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// ZOMBIE CHECK
// ═══════════════════════════════════════════════════════════════
router.post('/justify-my-meeting/zombie', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { meetingName, originalPurpose, whatActuallyHappens, frequency, duration, attendees, userLanguage } = req.body;
    if (!meetingName?.trim()) return res.status(400).json({ error: 'What is the meeting called?' });

    const prompt = `${SHARED}

ZOMBIE CHECK

A recurring meeting becomes a zombie when its current form continues mainly
because it is recurring rather than because its present purpose still requires it.

Do not infer this from age alone.

Compare:
1. original purpose, if supplied
2. what actually happens now
3. what synchronous interaction still accomplishes
4. what would be lost if the meeting disappeared
5. whether frequency, attendees, duration, or format should change

Do not produce a zombie score.

THE MEETING: ${meetingName.trim()}
ORIGINAL PURPOSE: ${originalPurpose?.trim() || 'Not supplied — do not guess at one, and do not treat its absence as evidence.'}
WHAT ACTUALLY HAPPENS NOW: ${whatActuallyHappens?.trim() || 'Not supplied.'}
FREQUENCY: ${frequency || 'Not supplied.'}
DURATION: ${duration ? `${duration} hour(s)` : 'Not supplied.'}
ATTENDEES: ${attendees || 'Not supplied.'}

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.

Return ONLY valid JSON:
{
  "verdict": "Exactly one of these English strings and nothing else: ALIVE AND USEFUL, NEEDS A REFRESH, TOO FREQUENT, SHOULD DIE, NOT ENOUGH TO TELL",
  "one_liner": "A memorable one-sentence judgment",
  "then_and_now": "What it was for versus what it does now, using only what they supplied — one or two sentences. If the original purpose was not supplied, say that plainly instead of inventing one",
  "what_synchronous_still_does": ["Something the live format still accomplishes, grounded in what they described — one short line each. Empty array if nothing supplied supports one. Do not infer that anyone is forced, obliged, distracted or disengaged from where or how they join"],
  "what_would_be_lost": ["Value the visitor ESTABLISHED, or an explicitly conditional possibility ('if X happens here, that would go') — one short line each. Never manufacture a benefit to make the analysis look balanced, and never infer informal coordination, soft accountability, morale or connection that nobody described. If nothing was established, return exactly one item: 'Nothing specific was established from what you told me. That does not mean the meeting provides no value; it means any value beyond what you described is unknown.'"],
  "what_to_change": [
    { "change": "Frequency, attendees, duration or format — one short line", "why": "Grounded in what they supplied — one short line" }
  ],
  "unknowns_that_matter": ["Missing information that could change this — one short line each"],
  "next_move": "The most useful thing they can actually do next — one sentence"
}

ARRAY BOUNDS: what_synchronous_still_does at most 3, what_would_be_lost at most 3, what_to_change at most 3, unknowns_that_matter at most 3.

Do not include person-hours or arithmetic in any field — that is computed separately.

Return ONLY valid JSON. ${NO_QUOTE_RULE}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 4000,
      messages: [{ role: 'user', content: withLanguage(prompt, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion) }],
    }, { label: 'justify-my-meeting-zombie' });
    if (!parsed.verdict) return res.status(500).json({ error: 'Could not check this one. Please try again.' });

    pinVerdict(parsed, ZOMBIE_VERDICTS, 'NOT ENOUGH TO TELL');
    parsed.time_footprint = timeFootprint(duration, attendees, PER_YEAR[String(frequency || '').toLowerCase()] || null);
    res.json(validateResult(parsed));

  } catch (error) {
    console.error('[JustifyMyMeeting/zombie]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// WEEK AUDIT
// ═══════════════════════════════════════════════════════════════
router.post('/justify-my-meeting/week', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { meetings, userLanguage } = req.body;
    if (!Array.isArray(meetings) || !meetings.length) {
      return res.status(400).json({ error: 'Add at least one meeting from your week.' });
    }

    const list = meetings.map((m, i) => `${i + 1}. ${m.name || 'Untitled'} — ${m.duration ? `${m.duration}h` : 'duration not supplied'}, ${m.attendees ? `${m.attendees} people` : 'attendees not supplied'}${m.recurring ? ', recurring' : ''}${m.purpose ? ` — ${m.purpose}` : ''}`).join('\n');

    const prompt = `${SHARED}

WEEK AUDIT

Do not grade the visitor's calendar as HEALTHY, OVERLOADED, or MEETING HELL
based only on meeting hours.

Different jobs legitimately require different amounts of synchronous work.

Evaluate each supplied meeting independently.

Then identify:
- meetings that clearly earn their time
- meetings worth questioning
- recurring meetings worth revisiting
- opportunities to shorten, combine, narrow attendance, or move information async
- concentration or fragmentation visible directly from supplied scheduling data

Do not invent focus-time needs or recommend specific meeting-free blocks unless
the visitor supplies their working schedule and focus requirements.

The list says only whether a meeting recurs. It does not say how often, on what
day, or at what time. Never describe a meeting as daily, weekly, morning, or
back-to-back, and never infer any of that from its name. If a name looks like it
implies a day, that is the name, not a fact about the schedule.

Calculate known scheduled meeting hours and person-hours exactly.
Do not calculate 'potential savings' unless tied to explicit proposed changes.

THEIR WEEK:
${list}

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.

Return ONLY valid JSON:
{
  "summary": "What this week actually looks like from what they supplied — 1-2 sentences. No grade, no verdict on the calendar as a whole. NO NUMBERS AT ALL in this field: no counts, no totals, no ranges, no hours, no headcounts. Every figure is computed separately from their own data and shown beside this. Describe the shape in words",
  "per_meeting": [
    {
      "name": "ONLY the meeting's name, exactly as they wrote it — not the whole line from the list. 'Monday standup', never 'Monday standup — 0.5h, 8 people, recurring — what everyone is working on'",
      "read": "Exactly one of these English strings and nothing else: earns its time, worth questioning, worth revisiting, not enough to tell. Judge THIS meeting from what they wrote about it, never the category its name belongs to. If the purpose is blank or too thin to judge, the answer is 'not enough to tell' — do not supply the conventional purpose of a 1:1, a standup, a design review or a retro and then grade the meeting against that",
      "why": "One sentence, grounded in what they supplied about this meeting. Where the read is 'not enough to tell', say what is missing. Never call a decision contested or a topic sensitive unless they said so; a decision needing discussion does not establish that every listed attendee needs to be in it; and never say something cannot be done async — say it is likely to benefit from real-time exchange, and why"
    }
  ],
  "opportunities": [
    { "change": "Shorten, combine, narrow attendance, or move information async — one short line", "which": "Which meeting or meetings", "what_it_assumes": "What has to be true for this to work — one short line" }
  ],
  "shape_of_the_week": "Anything about concentration or fragmentation visible directly from the supplied scheduling data, or null if they supplied no timing — one sentence",
  "unknowns_that_matter": ["What you would need to say more — one short line each"],
  "next_move": "The single most useful thing to do about this week — one sentence"
}

ARRAY BOUNDS: one per_meeting entry per supplied meeting, opportunities at most 4, unknowns_that_matter at most 3.

Do not include totals, counts, ranges or any other arithmetic in any field — every number is computed separately from their own data. A summary that says how many people or how many hours is inventing a figure it was told not to produce.

Return ONLY valid JSON. ${NO_QUOTE_RULE}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 5000,
      messages: [{ role: 'user', content: withLanguage(prompt, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion) }],
    }, { label: 'justify-my-meeting-week' });
    if (!parsed.per_meeting) return res.status(500).json({ error: 'Could not audit your week. Please try again.' });
    if (Array.isArray(parsed.per_meeting)) {
      const supplied = meetings.map(m => String(m.name || '').trim()).filter(Boolean);
      parsed.per_meeting.forEach((m, i) => {
        if (!m) return;
        m.read = pinTo(m.read, READS, 'not enough to tell');
        // The prompt used to say "copied from their list", and the list is
        // rendered as "Monday standup — 0.5h, 8 people, recurring — purpose".
        // Some runs copied the whole line into `name`, which the frontend
        // prints as the card heading. Snap it back to the supplied name: an
        // exact match wins, then a name the returned string contains, then the
        // meeting at this index — the schema asks for one entry per meeting in
        // order, so the index is a real answer rather than a guess.
        const got = String(m.name || '').trim();
        if (supplied.includes(got)) return;
        const hit = supplied.find(n => n && got.toLowerCase().startsWith(n.toLowerCase()))
          || supplied.find(n => n && got.toLowerCase().includes(n.toLowerCase()));
        m.name = hit || supplied[i] || got;
      });
    }

    // Totals, from their numbers only. A meeting missing either figure is
    // counted as unknown rather than estimated.
    let hours = 0, personHours = 0, counted = 0, incomplete = 0;
    for (const m of meetings) {
      const d = Number(m.duration), a = Number(m.attendees);
      if (Number.isFinite(d) && d > 0) hours += d; else incomplete++;
      if (Number.isFinite(d) && d > 0 && Number.isFinite(a) && a > 0) { personHours += d * a; counted++; }
    }
    parsed.totals = {
      meetings: meetings.length,
      your_hours: Math.round(hours * 100) / 100,
      person_hours: counted ? Math.round(personHours * 100) / 100 : null,
      meetings_counted_for_person_hours: counted,
      meetings_missing_numbers: incomplete,
    };
    res.json(validateResult(parsed));

  } catch (error) {
    console.error('[JustifyMyMeeting/week]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// RESCUE THIS MEETING
// ═══════════════════════════════════════════════════════════════
router.post('/justify-my-meeting/rescue', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { whatsHappening, minutesIn, yourRole, userLanguage } = req.body;
    if (!whatsHappening?.trim()) return res.status(400).json({ error: 'What is happening in there?' });

    const prompt = `${SHARED}

RESCUE THIS MEETING

The visitor is currently in a meeting and wants a useful intervention.

Do not diagnose hidden dynamics.

Describe only the observable problem they supplied.

Prefer interventions that restore:
- the question being answered
- the decision needed
- the owner
- the next action
- the boundary of the discussion

Never assume the visitor has authority to end, leave, redirect, or restructure
the meeting.

When authority is unknown, give language that invites rather than commands.

WHAT IS HAPPENING: ${whatsHappening.trim()}
HOW FAR IN: ${minutesIn ? `${minutesIn} minutes` : 'Not supplied.'}
THEIR ROLE: ${yourRole || 'Not supplied — assume no authority to end, leave or restructure it, and write language that invites.'}

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.

Return ONLY valid JSON:
{
  "the_problem": "The observable problem, from what they described and nothing more — one sentence",
  "say_this_now": "The intervention, in words they could say out loud — 1-2 sentences",
  "softer_version": "The same move with less edge, for a room where the direct version would cost them — 1-2 sentences. Do not assume a separate conversation will be scheduled, that the people involved want one, or that anyone has agreed to anything. Offer it as a question the room answers: 'would it help to park that and decide separately whether it needs more time?'",
  "if_youre_not_running_it": "How to do it without chairing — 1-2 sentences that invite rather than command",
  "if_its_time_to_wrap": "How to close it cleanly — 1-2 sentences",
  "after_the_meeting": "The follow-up that makes this stick — one sentence. Something THEY can do, not something they assume others will do"
}

Return ONLY valid JSON. ${NO_QUOTE_RULE}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2500,
      messages: [{ role: 'user', content: withLanguage(prompt, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion) }],
    }, { label: 'justify-my-meeting-rescue' });
    if (!parsed.say_this_now) return res.status(500).json({ error: 'Could not find a way in. Please try again.' });
    res.json(validateResult(parsed));

  } catch (error) {
    console.error('[JustifyMyMeeting/rescue]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// AGENDA — offered after FIX IT, not a mode of its own
// ═══════════════════════════════════════════════════════════════
router.post('/justify-my-meeting/agenda', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { meetingText, duration, attendees, context, userLanguage } = req.body;
    if (!meetingText?.trim()) return res.status(400).json({ error: 'Describe the meeting first.' });

    const prompt = `${SHARED}

The visitor has read the verdict and asked for an agenda. That argument is
over. Design the improved meeting; do not spend any field re-explaining what
was wrong with the old one. A criticism of the existing format is not an agenda
item, a purpose, or a reason to meet.

Build only as much meeting structure as the supplied purpose requires.

Do not invent:
- required attendees
- organizational roles
- decision authority
- pre-work that necessarily exists
- arbitrary read times
- arbitrary advance-notice requirements
- blockers, dependencies, decisions or coordination needs nobody described
- what each attendee already knows, possesses, or could have read

Where a live item depends on something not established, write it conditionally.
'Discuss anything anyone has flagged as needing the group' is honest.
'Resolve the blockers from the written updates' invents blockers.

The agenda must answer:

WHY ARE WE MEETING?
What must synchronous interaction accomplish?

WHAT MUST BE TRUE WHEN WE LEAVE?
Decision, agreement, questions answered, plan, ideas generated, conflict resolved, etc.

WHO ACTUALLY NEEDS TO PARTICIPATE?
Use supplied roles when known. Otherwise describe needed functions rather than
inventing job titles.

WHAT CAN HAPPEN BEFOREHAND?
Move information consumption out of the meeting when useful.

WHAT HAPPENS LIVE?
Reserve live time for interaction that benefits from being live.

END WITH:
Decision / owner / next step / unresolved question.

THE MEETING: ${meetingText.trim()}
DURATION: ${duration ? `${duration} hour(s) — this is the slot they have, NOT a target to fill. If the useful live work takes less, schedule less and say so; an agenda that fills the whole slot right after recommending a shorter meeting contradicts its own advice.` : 'Not supplied — do not assign minute-by-minute timings you cannot ground.'}
ATTENDEES: ${attendees || 'Not supplied — describe functions, not job titles.'}
ANYTHING ELSE: ${context?.trim() || 'Nothing supplied.'}

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.

Return ONLY valid JSON:
{
  "why_are_we_meeting": "What live time is FOR in the improved meeting — one or two sentences, written forwards. Not a summary of what was wrong before",
  "what_must_be_true_when_we_leave": ["A decision, an agreement, a question answered, a plan — one short line each"],
  "who_needs_to_participate": ["A role they supplied, or the FUNCTION needed if they did not — one short line each. Describe what a person needs to be able to do, never what they already know or could have read, and never invent a title. Any role they did NOT supply is a design recommendation and must read like one — 'someone will need to capture the decision' or 'it would help to have someone who can approve the spend', never 'the note-taker' or 'the approver', which assert a post that may not exist"],
  "before_the_meeting": ["What can happen beforehand instead of live — one short line each. Empty array if nothing supplied supports one"],
  "live_agenda": [
    { "item": "What happens live — one short line, written conditionally where it depends on something not established", "why_live": "What the live back-and-forth does here that a written thread would not — one short line. Phrase it as benefit, never as impossibility", "minutes": "A number only if duration was supplied and the split is defensible, otherwise null. These do not have to add up to the slot" }
  ],
  "end_with": "The closing move: decision, owner, next step, unresolved question — one sentence"
}

ARRAY BOUNDS: what_must_be_true_when_we_leave at most 4, who_needs_to_participate at most 5, before_the_meeting at most 3, live_agenda at most 5.

The live_agenda minutes may total well under the supplied duration. That is a
finding, not a gap to fill. If the honest answer is that the live portion is
short, or that the meeting may not need to convene at all when nothing has been
flagged, put that in the agenda rather than padding it.

Return ONLY valid JSON. ${NO_QUOTE_RULE}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 3500,
      messages: [{ role: 'user', content: withLanguage(prompt, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion) }],
    }, { label: 'justify-my-meeting-agenda' });
    if (!parsed.why_are_we_meeting) return res.status(500).json({ error: 'Could not build an agenda. Please try again.' });
    res.json(validateResult(parsed));

  } catch (error) {
    console.error('[JustifyMyMeeting/agenda]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// MESSAGE — offered after SHORTEN IT, MAKE IT ASYNC or FIX IT
// ═══════════════════════════════════════════════════════════════
router.post('/justify-my-meeting/message', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { meetingText, verdict, better, relationship, userLanguage } = req.body;
    if (!meetingText?.trim()) return res.status(400).json({ error: 'Describe the meeting first.' });

    const prompt = `${SHARED}

WRITE THE MESSAGE

Never give the visitor 'permission to decline.'

Help them communicate the change they want.

Do not assume:
- they are allowed to skip
- their attendance is optional
- their manager agrees
- the organizer will accept an async update

Offer language appropriate to their stated authority and relationship.

When authority is unknown, prefer proposing over announcing.

BAD:
'I am going to skip the standing call.'

BETTER:
'Would you be open to having me send my update asynchronously and join when
there is something that needs real-time discussion?'

THE MEETING: ${meetingText.trim()}
THE VERDICT REACHED: ${verdict || 'Not supplied.'}
THE CHANGE THEY WANT: ${better?.trim() || 'Not supplied.'}
THEIR RELATIONSHIP TO THE ORGANIZER: ${relationship || 'Not supplied — assume no authority to change the meeting, and propose rather than announce.'}

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.

Return ONLY valid JSON:
{
  "message": "The message, ready to send — 2-5 sentences. It proposes; it does not announce, and it never states that they will skip",
  "why_it_lands": "The STRUCTURE of the message: what it leads with, what it concedes, what it asks for, what it deliberately leaves open — one sentence. Never predict the recipient's reaction. You do not know whether they will agree, feel defensive, be receptive or appreciate the framing, and guessing turns writing advice into a claim about a person you have never met",
  "if_they_say_no": "What to say if the organizer declines, keeping the relationship intact — 1-2 sentences",
  "do_not_send": "The version of this message that would cost them something, and what it costs — one sentence"
}

Return ONLY valid JSON. ${NO_QUOTE_RULE}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2500,
      messages: [{ role: 'user', content: withLanguage(prompt, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion) }],
    }, { label: 'justify-my-meeting-message' });
    if (!parsed.message) return res.status(500).json({ error: 'Could not draft the message. Please try again.' });
    res.json(validateResult(parsed));

  } catch (error) {
    console.error('[JustifyMyMeeting/message]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// Reviewed against backend/lib/outputStandard.js during the rewrite around the
// shared instructions. Every endpoint runs scrub; the arithmetic runs in code.
router.outputStandard = 'v2';
router.outputGuard = {
  checks: ['validateResult'],
  note: 'scores, percentages, work-weeks and wasted-hours language are blanked in code; person-hours are computed from supplied numbers, never generated; verdicts are pinned to English because the frontend switches on them.',
};

module.exports = router;
