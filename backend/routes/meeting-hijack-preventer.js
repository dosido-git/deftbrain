const express = require('express');
const router = express.Router();
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

const NO_QUOTE_RULE = 'Never place a double-quote (") character inside any JSON string value — write quoted phrases plainly or with single quotes, or it breaks the JSON.';

// ═══════════════════════════════════════════════════════════════
// The brief. Every endpoint below opens with this.
// ═══════════════════════════════════════════════════════════════
const CORE = `
You are helping someone prepare to run a meeting well.

Your job is not to design the theoretically perfect meeting. Build a practical
plan the person can actually use while facilitating.

The meeting plan should help them:

1. Make the purpose clear.
2. Give the meeting enough structure to reach that purpose.
3. Protect useful discussion without letting tangents consume the meeting.
4. Make participation possible without forcing equal airtime.
5. Handle predictable disruptions calmly.
6. Reach the intended decision or outcome when possible.
7. Leave with clear decisions, open questions, and next steps.

GROUNDING

Treat information supplied by the visitor as established.

You may reason from that information to design a useful meeting structure,
but do not silently invent:

- participant personalities or motives
- organizational hierarchy
- who has authority
- who should make a decision
- interpersonal conflict
- participant expertise
- participant preferences
- accessibility or neurodivergence
- psychological safety problems
- previous meeting behavior
- available technology or collaboration tools
- company policies or norms
- deadlines
- required follow-up timing
- materials that already exist
- decisions that have already been made

A selected challenge describes a facilitation problem to prepare for.
It does not establish why that problem occurs or which participant causes it.

For example:

"One person takes a lot of airtime"

may justify:
- structured turns
- a facilitator redirect
- inviting additional perspectives

It does NOT establish:
- who the person is
- why they behave that way
- that they intentionally dominate
- that other participants feel intimidated

MEETING DESIGN

Start with the visitor's stated meeting outcome.

Ask:
"What needs to happen live for this meeting to succeed?"

Build the agenda around that answer.

Do not automatically add generic meeting rituals such as:
- lengthy ground rules
- technology checks
- icebreakers
- formal role assignments
- round robins
- silent ranking
- parking lots
- breakout rooms
- objection rounds
- voting
- formal commitment ceremonies

Use them only when they solve a problem in this particular meeting.

Prefer the lightest structure that can reasonably accomplish the meeting's
purpose.

TIME

Agenda times must fit within the visitor's total duration.

Do not force a fixed 10% buffer.

Use a small buffer when useful, or leave none when the meeting design does
not need one.

Do not invent exact advance-preparation periods such as:
"send 24 hours beforehand"
or
"test technology 15 minutes early."

When timing is useful but not established, use flexible language:
"before the meeting"
"with enough time for participants to review it"

PARTICIPATION

Inclusive facilitation does not mean every participant must speak the same
amount or speak at least once.

Choose participation methods based on what the meeting needs.

Useful options may include:
- open discussion
- structured turns
- silent thinking before discussion
- written input
- anonymous input
- inviting perspectives not yet heard
- smaller-group discussion

Do not infer that someone who has not spoken is disengaged, uncomfortable,
intimidated, or "a quiet person."

Do not force someone to contribute.

Prefer invitations such as:
"We haven't heard every perspective yet. Is there anything we're missing?"

When addressing someone directly:
"Sam, is there anything you'd add?"
is appropriate only if the visitor supplied Sam's name and inviting Sam is
reasonable in context.

DECISIONS

Treat the visitor's selected decision framework as a preference, not as an
immutable organizational rule.

Adapt it to the meeting.

Do not invent decision authority.

If it is unclear who has the final decision, explicitly identify that as
something to clarify.

Do not manufacture votes, rankings, consensus, commitments, or escalation
paths.

"Disagree & commit" does not mean the facilitator can require participants
to type COMMIT, declare a decision final, or escalate disagreement to
leadership unless the visitor established that authority.

FACILITATION SCRIPTS

Give the visitor language they can actually say.

Scripts should be:
- short
- conversational
- respectful
- specific
- easy to say aloud
- firm when necessary

Avoid corporate facilitation jargon.

Do not assume bad intent.

A redirect should protect the meeting's purpose, not punish the speaker.

Good:
"That's related, but I don't think we can do it justice here. Can we capture
it and come back to the decision in front of us?"

Good:
"I want to make sure we hear some other perspectives before we stay with
this one."

Avoid:
"We really appreciate those perspectives..."
when one person has simply been talking too long.

The visitor needs usable words, not diplomatic filler.

PLATFORM

Do not generate a generic Zoom/Teams/Meet instruction manual merely because
the meeting is virtual.

Mention platform features only when they materially support the meeting
design.

Examples:
- chat for collecting ideas
- polls for voting
- breakout rooms for small-group work
- raise hand when speaking order is otherwise difficult

Do not assume those features are available, enabled, or appropriate merely
because a platform was selected.

OUTPUT STANDARD

Write directly to the visitor as "you."

Reason freely about meeting design.
Assert carefully about the visitor, participants, organization, and meeting
history.

Every recommendation should be traceable either to:
1. something the visitor told you, or
2. a clearly presented design choice you are recommending.

Do not turn recommendations into fictional facts about the meeting.
`;

// ═══════════════════════════════════════════════════════════════
// Detectors. Each one is a class of invention the brief forbids and the
// model still produced during the rewrite probes. A named field that trips
// one is blanked; an array item is pruned, because an empty bullet reads
// worse than no bullet.
// ═══════════════════════════════════════════════════════════════

// "the quiet ones", "Sam tends to dominate", "the team feels unsafe speaking up"
const INFERRED_PERSON = new RegExp([
  '\\bquiet (?:participants?|people|team ?members?|voices|ones|attendees)\\b',
  '\\bdominant (?:speakers?|participants?|personalit\\w+|voices)\\b',
  '\\b(?:participants?|people|attendees|team ?members?) who (?:are|feel) (?:shy|intimidated|uncomfortable|nervous|anxious|reluctant|afraid)\\b',
  '\\b(?:someone|somebody|the person) who (?:is|tends to be) (?:shy|quiet|dominant|domineering|talkative)\\b',
  '\\bintroverts?\\b|\\bextroverts?\\b',
  '\\b(?:they|he|she|participants?|people|attendees) (?:probably |likely |may )?(?:feel|feels|felt|are feeling) (?:intimidated|unsafe|dismissed|steamrolled|talked over|shut down)\\b',
  '\\bdeliberately (?:dominat\\w+|derail\\w+|monopoli[sz]\\w+)\\b',
  '\\b(?:is|are) (?:trying|looking) to (?:dominate|derail|take over|hijack)\\b',
].join('|'), 'i');

// The two words the old prompt asked for by name, and which the new one bans.
const IMPORTED_FRAME = /\bpsychological safety\b|\bneurodivergen\w+\b|\bneurotypical\b|\bsafe space\b/i;

// "send the deck 24 hours in advance", "test your audio 15 minutes early"
const INVENTED_LEAD_TIME = new RegExp([
  '\\b\\d+\\s*(?:hours?|days?|minutes?|weeks?)\\s*(?:in advance|beforehand|ahead of time|before the meeting|early|prior)\\b',
  '\\b(?:at least|no later than)\\s*\\d+\\s*(?:hours?|days?|minutes?|weeks?)\\b',
  '\\b(?:the day|a week|48 hours|24 hours) (?:before|prior)\\b',
].join('|'), 'i');

// Authority and escalation the visitor never established.
const INVENTED_AUTHORITY = new RegExp([
  '\\b(?:escalate|escalation) (?:it |this |the (?:decision|disagreement|issue) )?to (?:leadership|management|the (?:exec|executive|leadership) team|your (?:manager|boss|director|VP))\\b',
  '\\bthe (?:facilitator|leader|manager|organi[sz]er) (?:has|holds|retains) (?:the )?(?:final|ultimate) (?:say|call|authority|decision)\\b',
  '\\b(?:makes?|make) (?:a |the )?(?:provisional|final|binding) (?:call|decision)\\b[^.]{0,60}\\b(?:flags?|escalates?|reports?)\\b',
  '\\btype (?:COMMIT|"COMMIT")\\b|\\bsay COMMIT\\b',
  '\\b(?:requires?|require) (?:everyone|each participant|all participants) to (?:commit|agree|sign off|confirm)\\b',
].join('|'), 'i');

// Success defined as something the tool cannot observe.
const UNKNOWABLE_SUCCESS = new RegExp([
  '\\b(?:every|each|all) (?:participants?|people|attendees|team ?members?) (?:contributed|spoke|participated|had (?:their )?say)\\b',
  '\\bcontributed at least once\\b',
  '\\bno ?(?:one|body) (?:felt|had to) (?:dominated|excluded|compete|left out|unheard|silenced)\\b',
  '\\beveryone (?:felt|was) (?:heard|included|safe|comfortable)\\b',
].join('|'), 'i');

// A hedge means the sentence is proposing, not asserting — spare it.
const HEDGED = /\b(?:if|whether|may|might|could|unless|when|in case|consider|you did not|not (?:supplied|established|clear))\b/i;

const RULES = [
  ['inferred a personality or a feeling nobody described', INFERRED_PERSON],
  ['imported a frame the visitor did not raise', IMPORTED_FRAME],
  ['invented an exact lead time', INVENTED_LEAD_TIME, (v) => HEDGED.test(v)],
  ['invented decision authority or an escalation path', INVENTED_AUTHORITY],
  ['defined success as something nobody can observe', UNKNOWABLE_SUCCESS],
];

// Arrays are objects: Object.entries enumerates their indices, so the walk
// reaches strings inside arrays without a special case. An earlier version of
// this pattern returned early on arrays and every array-of-strings field went
// unchecked.
function validateResult(data) {
  if (!data || typeof data !== 'object') return data;
  const walk = (node) => {
    if (!node || typeof node !== 'object') return;
    for (const [k, v] of Object.entries(node)) {
      if (typeof v === 'string') {
        const hit = RULES.find(([, re, spare]) => re.test(v) && !(spare && spare(v)));
        if (hit) {
          if (v.length <= 260 && (v.match(/[.!?]/g) || []).length <= 2) {
            console.log(`[meeting-hijack-preventer] ${k} blanked — ${hit[0]}: ${v.slice(0, 200)}`);
            node[k] = '';
          } else {
            console.log(`[meeting-hijack-preventer] ${k} ${hit[0]} (left intact, too long to cut safely): ${v.slice(0, 200)}`);
          }
        }
      } else if (v && typeof v === 'object') walk(v);
    }
  };
  walk(data);
  const prune = (node) => {
    if (Array.isArray(node)) {
      for (let i = node.length - 1; i >= 0; i--) {
        const it = node[i];
        if (it === '') node.splice(i, 1);
        else if (it && typeof it === 'object' && Object.values(it).every(x => x === '' || x == null)) node.splice(i, 1);
        else prune(it);
      }
      return;
    }
    if (node && typeof node === 'object') Object.values(node).forEach(prune);
  };
  prune(data);
  return data;
}

// The time-box is the tool's core promise and the model routinely overruns it
// (an earlier probe: 53 minutes of agenda for a 45-minute meeting). Rescale in
// code — but only DOWNWARD. An agenda that comes in under the duration left
// slack on purpose, and inflating it back up would be the fixed buffer the
// brief says not to force, applied in reverse.
function fitAgendaToDuration(plan, duration) {
  const items = plan && Array.isArray(plan.agenda) ? plan.agenda : null;
  if (!items || !items.length || !(duration > 0)) return plan;
  const sum = items.reduce((t, it) => t + (Number(it && it.minutes) || 0), 0);
  if (sum > duration) {
    let running = 0;
    items.forEach((it, i) => {
      if (i === items.length - 1) it.minutes = Math.max(1, duration - running);
      else {
        it.minutes = Math.max(1, Math.round((Number(it.minutes) || 0) * duration / sum));
        running += it.minutes;
      }
    });
  }
  plan.total_minutes = duration;
  plan.scheduled_minutes = items.reduce((t, it) => t + (Number(it.minutes) || 0), 0);
  plan.unscheduled_minutes = Math.max(0, duration - plan.scheduled_minutes);
  return plan;
}

// The challenge checkboxes. The value is the facilitation problem, stated as a
// problem — never as a claim about a person. Kept here rather than in the
// frontend so the wording the model sees is the wording under review.
const CHALLENGES = {
  airtime:      'One person takes a lot of airtime',
  wanders:      'Conversation wanders',
  interrupt:    'People interrupt each other',
  overrun:      'We run out of time',
  unheard:      'Some people do not get much chance to contribute',
  undecided:    'Decisions are hard to reach',
  no_next_step: 'We leave without clear next steps',
};

function challengeLines(challenges, other) {
  const out = [];
  if (challenges && typeof challenges === 'object') {
    for (const [k, on] of Object.entries(challenges)) {
      if (on && CHALLENGES[k]) out.push(CHALLENGES[k]);
    }
  }
  if (typeof other === 'string' && other.trim()) out.push(other.trim());
  return out;
}

function brief(body) {
  const {
    meetingGoal, duration, participantCount, participantNotes,
    format, platform, meetingType, challenges, challengeOther,
    decisionFramework, extraContext,
  } = body;

  const picked = challengeLines(challenges, challengeOther);

  return `WHAT NEEDS TO HAPPEN IN THIS MEETING:
${String(meetingGoal || '').trim()}

TIME AVAILABLE: ${duration} minutes
PEOPLE: ${participantCount ? `${participantCount}` : 'Not supplied — do not assume a group size.'}
NAMES OR ROLES THAT MATTER: ${participantNotes && participantNotes.trim() ? participantNotes.trim() : 'Not supplied. Do not invent names, roles, seniority or who decides.'}
FORMAT: ${format || 'Not supplied.'}
PLATFORM: ${platform ? platform : 'Not supplied. Do not assume any platform feature is available or enabled.'}
KIND OF MEETING: ${meetingType ? meetingType : 'Not supplied — infer nothing from its absence.'}

WHAT TENDS TO GET IN THE WAY (facilitation problems to prepare for, NOT claims about any person):
${picked.length ? picked.map(x => `- ${x}`).join('\n') : '- Nothing selected. Do not invent a problem to solve; prepare for the meeting as described.'}

HOW DECISIONS WILL BE MADE: ${decisionFramework && decisionFramework !== 'Not sure'
    ? `${decisionFramework} — a preference, not an organisational rule. Adapt it.`
    : 'Not established. Do not assume one, and if the meeting needs a decision, name the question of who decides as something to clarify.'}

ANYTHING ELSE THEY SAID MATTERS: ${extraContext && extraContext.trim() ? extraContext.trim() : 'Nothing supplied.'}`;
}

// ═══════════════════════════════════════════════════════════════
// BUILD MY MEETING PLAN
// ═══════════════════════════════════════════════════════════════
router.post('/meeting-hijack-preventer', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { meetingGoal, userLanguage } = req.body;
    const duration = Number(req.body.duration);

    if (!meetingGoal || !String(meetingGoal).trim()) {
      return res.status(400).json({ error: 'Tell me what needs to happen in this meeting.' });
    }
    if (!Number.isFinite(duration) || duration < 5 || duration > 480) {
      return res.status(400).json({ error: 'How long is the meeting? Anything from 5 minutes to 8 hours.' });
    }

    const picked = challengeLines(req.body.challenges, req.body.challengeOther);

    const prompt = `${CORE}

${brief(req.body)}

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.

Return ONLY valid JSON:
{
  "meeting_plan": {
    "goal": "What this meeting is for, in the visitor's own terms — one sentence",
    "end_state": "What is concretely true when the meeting ends: the decision made, the thing understood, the plan agreed — one sentence starting from the outcome, not from the activity",
    "total_minutes": ${duration},
    "agenda": [
      {
        "title": "What this block is — a short phrase, not a ritual name",
        "minutes": 0,
        "purpose": "Why this block is in the meeting at all — one short line",
        "how_to_run_it": "What the facilitator actually does — one or two sentences, concrete",
        "say_this_if_helpful": "Words they could say out loud to open or steer this block, or an empty string if the block needs none"
      }
    ]
  },
  "watch_for": [
    {
      "situation": "A facilitation problem this meeting could plausibly hit, described as a situation and never as a claim about a person",
      "prevent_it": "What to set up beforehand or say early so it is less likely — one short line",
      "if_it_happens": "What to actually do in the moment — one short line",
      "say_this": "Short, natural words they could say out loud. Firm where it needs to be. No diplomatic filler"
    }
  ],
  "decision_plan": {
    "needed": true,
    "approach": "How to reach the decision in this meeting, adapting whatever framework they named. Empty string if the meeting does not need a decision",
    "what_needs_clarifying": "What about the decision is genuinely unresolved — most often who makes the final call if the group does not agree. Empty string if nothing is unclear"
  },
  "before_the_meeting": ["Preparation specific to THIS meeting — one short line each. No generic meeting checklist, and no invented lead times"],
  "finish_strong": {
    "before_people_leave": ["A short checklist tied to the stated outcome — one short line each"],
    "closing_script": "Words to close the meeting cleanly — two or three sentences"
  }
}

ARRAY BOUNDS: agenda 3-6 items, watch_for ${picked.length ? `one entry per problem they selected and nothing more (${picked.length})` : 'at most 2, and only for problems this meeting design genuinely risks'}, before_the_meeting at most 4, before_people_leave at most 5.

The agenda minutes must sum to at most ${duration}. Leave time unscheduled if the design does not need every minute — do not pad to fill the slot, and do not add a block called Buffer.

"needed" is true only if this meeting has to produce a decision. When it is false, "approach" and "what_needs_clarifying" are empty strings.

Return ONLY valid JSON. ${NO_QUOTE_RULE}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 6000,
      messages: [{ role: 'user', content: withLanguage(prompt, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion) }],
    }, { label: 'meeting-hijack-preventer' });

    if (!parsed.meeting_plan || !Array.isArray(parsed.meeting_plan.agenda)) {
      return res.status(500).json({ error: 'Could not build the plan. Please try again.' });
    }

    fitAgendaToDuration(parsed.meeting_plan, duration);
    res.json(validateResult(parsed));

  } catch (error) {
    console.error('[MeetingHijackPreventer]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// FOLLOW-UP — generated on demand AFTER the meeting, from what the visitor
// captured. Never before: the old tool handed people a decision log and a
// summary email full of outcomes the meeting had not produced yet.
// ═══════════════════════════════════════════════════════════════
router.post('/meeting-hijack-preventer/follow-up', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { decided, nextSteps, stillOpen, forNextTime, meetingGoal, userLanguage } = req.body;

    const steps = Array.isArray(nextSteps)
      ? nextSteps.filter(s => s && s.task && String(s.task).trim())
      : [];

    const anything = [decided, stillOpen, forNextTime].some(x => x && String(x).trim()) || steps.length;
    if (!anything) {
      return res.status(400).json({ error: 'Capture something from the meeting first — even one line.' });
    }

    const prompt = `${CORE}

Using only the visitor's captured meeting information, create a concise
follow-up.

Do not invent decisions, owners, deadlines, attendees, agreement, dissent,
next meetings, or rationale.

If a field was not captured, omit it rather than inserting a placeholder or
guessing.

Structure:

WHAT WE DECIDED
Only if decisions were captured.

WHAT HAPPENS NEXT
Only captured actions, owners, and dates.

STILL OPEN
Only captured unresolved items.

Draft a short follow-up message using the same information.

WHAT THE MEETING WAS FOR: ${meetingGoal && meetingGoal.trim() ? meetingGoal.trim() : 'Not supplied.'}
WHAT THEY DECIDED: ${decided && decided.trim() ? decided.trim() : 'Nothing captured — omit the decisions section entirely.'}
WHAT HAPPENS NEXT: ${steps.length
    ? steps.map(s => `- ${s.task}${s.owner ? ` — ${s.owner}` : ' — no owner captured'}${s.when ? ` — ${s.when}` : ' — no date captured'}`).join('\n')
    : 'Nothing captured — omit the next-steps section entirely.'}
WHAT IS STILL OPEN: ${stillOpen && stillOpen.trim() ? stillOpen.trim() : 'Nothing captured — omit the still-open section entirely.'}
FOR NEXT TIME: ${forNextTime && forNextTime.trim() ? forNextTime.trim() : 'Nothing captured.'}

Return ONLY valid JSON:
{
  "what_we_decided": ["One captured decision per line, restated plainly. Empty array if none were captured"],
  "what_happens_next": [
    { "task": "The captured action", "owner": "The captured owner, or an empty string if none was captured", "when": "The captured date, or an empty string if none was captured" }
  ],
  "still_open": ["One captured unresolved item per line. Empty array if none were captured"],
  "message": "A short follow-up message built from the same information and nothing else — three to six sentences, ready to send. It states what was captured; it does not thank people for contributions you cannot see, summarise a discussion you were not given, or announce a next meeting nobody mentioned"
}

An empty array is the correct answer for a section nobody captured. Do not fill one with a placeholder, a bracket, or a guess.

Return ONLY valid JSON. ${NO_QUOTE_RULE}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2500,
      messages: [{ role: 'user', content: withLanguage(prompt, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion) }],
    }, { label: 'meeting-hijack-preventer-follow-up' });

    if (!parsed.message) return res.status(500).json({ error: 'Could not draft the follow-up. Please try again.' });
    res.json(validateResult(parsed));

  } catch (error) {
    console.error('[MeetingHijackPreventer/follow-up]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// Reviewed against backend/lib/outputStandard.js during the 2026-09-03 rewrite.
router.outputStandard = 'v2';
router.outputGuard = {
  checks: ['validateResult'],
  note: 'inferred personalities and feelings, imported frames (psychological safety / neurodivergence), invented lead times, invented decision authority and escalation paths, and success defined as something unobservable are all blanked in code. The agenda is fitted to the visitor\'s duration downward only — an agenda that comes in short left slack on purpose. The follow-up is generated after the meeting from captured input, never before it.',
};

module.exports = router;
