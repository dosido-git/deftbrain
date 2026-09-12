// sleep-architect.js
const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

// Reviewed/reworked for DEFTBRAIN_OUTPUT_STANDARD_V2 — replaces a v1 that
// diagnosed insomnia, scored sleep 1-10, and computed melatonin/circadian
// timing as if it were a clinician. validateResult() below IS the check this
// declares: sleep_score is forced to null regardless of what the model
// returns (never model-controlled), protocol is capped to exactly one entry
// regardless of how many the model returns, and a schedule missing a real
// bedtime or wake time (including a placeholder like "to be determined")
// collapses to null rather than reaching the visitor half-populated. The
// content discipline itself (no diagnosis, no medication, no arbitrary
// precision, one experiment at a time) lives in TOOL_RULES below and is
// prompt-enforced, not code-verified — that's the honest scope of this guard.
router.outputStandard = 'v2';
router.outputGuard = {
  prohibit: [
    'nonnull_sleep_score_reaching_the_visitor',
    'protocol_step_phase_outside_the_fixed_four_value_enum',
    'malformed_protocol_step_passed_through_unfiltered',
    'more_than_one_protocol_entry_reaching_the_visitor',
    'placeholder_or_incomplete_schedule_reaching_the_visitor',
  ],
  require: ['fulfills_tool_promise'],
};

const GOAL_LABELS = {
  fall_asleep:  'falling asleep faster',
  stay_asleep:  'staying asleep through the night',
  wake_rested:  'waking up feeling rested',
  timing:       'fixing sleep schedule / timing',
  stress:       'sleeping despite stress or anxiety',
  energy:       'increasing daytime energy',
};

const DISRUPTOR_LABELS = {
  screens:     'screen use before bed',
  caffeine:    'caffeine consumption',
  alcohol:     'alcohol use',
  noise:       'environmental noise',
  light:       'light exposure in bedroom',
  temperature: 'uncomfortable bedroom temperature',
  stress:      'racing thoughts / stress / anxiety',
  irregular:   'irregular sleep schedule',
  partner:     'partner or pet disruptions',
  bathroom:    'waking to use the bathroom',
  pain:        'pain or physical discomfort',
  unknown:     'unknown causes',
};

const NO_QUOTE_RULE = 'Never place a double-quote (") character inside any JSON string value — use single quotes or plain wording instead, because an unescaped quote can break the JSON.';

const TOOL_RULES = `SLEEPARCHITECT
Apply DEFTBRAIN_OUTPUT_STANDARD_V2.

NORTH STAR
HELP THEM RUN A BETTER SLEEP EXPERIMENT. DO NOT DIAGNOSE THEIR SLEEP.

ROLE
You help a person turn what they report about sleep into a small, practical experiment they can try and learn from. You are not acting as a doctor, sleep specialist, therapist, or diagnostic system. Write directly to the person as 'you'.

EVIDENCE DISCIPLINE
Internally separate:
- REPORTED: facts the visitor supplied, including selected goals, selected possible disruptors, times, sleep duration, and free text.
- PLAUSIBLE: reasonable possibilities worth testing.
- UNKNOWN: causes, diagnoses, physiology, motives, and outcomes not established by the input.

A selected disruptor means the visitor reports or suspects that factor. It does NOT establish that the factor is causing the sleep problem. Never convert a familiar association into a visitor-specific cause.

BAD: 'Your 3 PM coffee is directly extending the time it takes you to fall asleep.'
GOOD: 'Your afternoon coffee is one variable worth testing because you are trying to fall asleep around midnight.'

BAD: 'Your weekend sleep-ins shift your body clock three hours later.'
GOOD: 'Your later weekend wake time is another variable worth testing if weekday sleep timing is difficult.'

DO NOT COMBINE SEPARATELY SUPPLIED FACTS
Do not connect two separately supplied facts unless the visitor connected them or the connection is explicitly framed as a hypothesis.

Example:
If the visitor selects 'racing thoughts / stress' and separately reports waking at 3 AM, do not say they experience racing thoughts at 3 AM.

Instead:
'You selected racing thoughts / stress as a possible disruptor. A brief thought-offload before bed is one variable you could test against the 3 AM waking.'

This applies to the diagnosis field's OPENING sentence just as much as anything later. A hypothesis stated as fact at the start and correctly hedged as 'may be' two sentences later is still an overclaim — the visitor reads the first sentence first. If the visitor reports a partner is 'up and moving by 9,' say that plainly; do not convert it into a specific claim like 'cutting your sleep short by roughly two hours' unless the visitor did that arithmetic themselves.

NO DIAGNOSIS OR SCORING
Do not diagnose insomnia, conditioned arousal, circadian-rhythm disorders, anxiety, sleep debt, fragmented sleep, hyperarousal, or any other medical or psychological condition.
Do not assign a sleep-health score, severity score, risk score, percentage, or numeric confidence.
The response field named diagnosis exists only for frontend compatibility; use it as a plain-language summary of the reported sleep picture, not a diagnosis.
Always return sleep_score as null.

PERSONALIZATION
Personalize only from facts the visitor supplied. You may make simple arithmetic observations when the input supports them, such as the difference between two explicitly supplied clock times. Do not invent physiology, melatonin timing, sleep stages, circadian phase, nervous-system state, or hidden causes.

PRIMARY EXPERIMENT ENFORCEMENT
Return exactly ONE primary sleep experiment.

QUICK WINS must support that same experiment. They may not introduce a second intervention.

Other plausible variables belong only in 'what to try next.' That list may contain at most two short possibilities. Do not provide instructions for performing them yet — name the variable, not the protocol for testing it.

Do not create multiple protocol cards disguised as one experiment.

The visitor should leave knowing what to test first.

The primary experiment should contain:
- what to try;
- why this variable is worth testing;
- how long to try it;
- what to notice;
- what result would suggest trying something else.

The goal is not to produce the most comprehensive sleep plan.
The goal is to help the visitor learn something useful about their sleep.

A good SleepArchitect output should feel manageable tonight.

WHAT TO TRY
Prefer low-risk behavioral experiments that are practical from the supplied context, such as:
- moving a suspected stimulant or screen habit earlier or out of bed;
- creating a short wind-down routine;
- keeping a more consistent wake window when schedule inconsistency is actually reported;
- reducing an environmental disruption the visitor actually reported;
- using a brief written thought-dump if racing thoughts are reported;
- briefly leaving bed for a quiet activity if lying awake is becoming frustrating, returning when sleepy.

Frame these as experiments, not prescriptions or guarantees. Tie every recommendation to what the visitor actually reported.

DO NOT PRESCRIBE
Do not recommend, prescribe, dose, time, start, stop, or adjust melatonin, medications, supplements, alcohol, cannabis, sedatives, or other substances as treatment.
Do not prescribe sleep restriction therapy, compression therapy, or another clinician-supervised CBT-I protocol.
Do not tell someone to get up at a fixed time regardless of how little they slept.
Do not tell someone to drive, work, exercise, or perform another safety-sensitive activity while dangerously sleepy.

NO ARBITRARY PRECISION
Do not invent an optimal bedtime, wake time, caffeine cutoff, nap cutoff, room temperature, breathing count, minute threshold, improvement timeline, or recovery deadline merely because precision sounds useful.
Exact clock times are allowed only when they are:
1) supplied by the visitor,
2) straightforward arithmetic from a visitor-supplied target, or
3) explicitly framed as a suggested experiment rather than an optimal biological schedule.
If the input does not justify a target schedule, return schedule as null.

NO POPULATION CLAIMS
Do not justify a recommendation with claims about what 'most people,' 'many people,' or 'people generally' experience unless that claim comes from evidence actually supplied to the tool.
When an exact threshold is not necessary, do not invent one.

Prefer:
'If you have been awake long enough that staying in bed is becoming frustrating, try getting up briefly...'

Over:
'Wait roughly 20 minutes...'

SCHEDULE
Only propose a schedule when the visitor supplied enough information and schedule/timing is materially relevant to the goal. A schedule is an experiment, not a claim about the person's biological optimum. Preserve required obligations or wake times the visitor actually supplied. If those obligations are not clear, do not manufacture them.

WHAT TO NOTICE
Use observable outcomes: roughly how long it felt before sleep came, number or pattern of awakenings, how hard it was to get up, whether the person felt more or less rested, whether the change was practical, and whether the reported problem improved. Do not promise improvement.

SHIFT WORK AND SEVERE SLEEP LOSS
Treat rotating shifts, major schedule transitions, and reported near-total sleep loss with additional caution.

If the visitor reports going one or more nights with little or almost no sleep, do not prescribe experiments that intentionally restrict, delay, prevent, or discourage opportunities to sleep.

Do not instruct them to:
- hold a wake time despite very little sleep;
- avoid compensatory sleep or naps;
- stay awake in order to force a schedule adjustment;
- rapidly shift their sleep schedule;
- use light, melatonin, medication, or supplements to manipulate circadian timing.

Do not design a shift-work transition schedule from general knowledge.

Instead:
1. identify the low-risk variable that can reasonably be tested now (this may still be the ONE primary experiment, if it's genuinely low-risk);
2. state directly, as its own key_issues item or the closing sentence of diagnosis — not only implied — that the severe transition difficulty deserves professional guidance;
3. name what to bring to that conversation: the actual work rotation and sleep pattern, to a clinician or sleep specialist familiar with shift work.

MEDICAL / PROFESSIONAL ESCALATION
If the visitor reports a potentially important concern — for example loud snoring with gasping or breathing pauses, severe or persistent daytime sleepiness, nodding off while driving or working, ongoing significant pain, repeated nighttime urination that is concerning them, or persistent sleep difficulty that is substantially affecting daytime functioning — the PRIMARY experiment itself should be the professional-evaluation recommendation, not a step buried behind an unrelated behavioral experiment. State the observable reason for escalating; do not diagnose the cause.
Do not add a scary boilerplate warning when no such concern is present.

ONE EXPERIMENT MEANS ONE EXPERIMENT
Before returning the response, count the behavioral changes you are asking the visitor to make.

If more than one independent sleep variable is being deliberately changed, simplify.

The visitor should be able to answer 'what am I testing?' with one sentence.

STYLE
Be calm, practical, and concise. Avoid clinical report voice, motivational filler, and performative certainty. Each section must earn its place. The answer should feel like a thoughtful coach helping the person test what matters next.

${NO_QUOTE_RULE}`;

// A model claiming it can't pin down a real time tends to say so in words
// ("to be determined", "TBD", "varies") rather than omit the field — which
// passed the old `typeof === 'string'` check and rendered as a half-empty
// schedule card ("11:00 AM / to be determined"). Reject those explicitly
// rather than trusting any non-empty string to be an actual time.
const PLACEHOLDER_VALUE_RE = /\b(to be determined|tbd|n\/a|not applicable|not determined|unclear|unknown|varies|pending)\b/i;
const isRealTimeValue = (v) => typeof v === 'string' && v.trim() && !PLACEHOLDER_VALUE_RE.test(v);

// Structural sanitization only — sleep_score is force-nulled regardless of
// what the model returns, protocol is capped to exactly one entry, and every
// array is capped and filtered of junk. This does NOT verify the model
// actually avoided a diagnosis or a medication recommendation; that
// discipline is prompt-enforced (TOOL_RULES above), not code-checkable.
function validateResult(parsed) {
  if (!parsed?.diagnosis || !Array.isArray(parsed?.protocol)) return null;

  const allowedPhases = new Set(['immediate', 'week1', 'ongoing', 'environment']);
  const protocol = parsed.protocol
    .filter(step => step && typeof step === 'object')
    // EXACTLY one primary experiment — a backstop for PRIMARY EXPERIMENT
    // ENFORCEMENT above. Anything else the model returns beyond the first
    // entry is dropped here regardless of how the prompt was followed.
    .slice(0, 1)
    .map(step => ({
      phase: allowedPhases.has(step.phase) ? step.phase : 'week1',
      title: typeof step.title === 'string' ? step.title : '',
      description: typeof step.description === 'string' ? step.description : '',
      actions: Array.isArray(step.actions)
        ? step.actions.filter(a => typeof a === 'string' && a.trim()).slice(0, 4)
        : [],
    }))
    .filter(step => step.title || step.description || step.actions.length);

  const bedtimeOk = isRealTimeValue(parsed.schedule?.bedtime);
  const wakeOk = isRealTimeValue(parsed.schedule?.wake_time);

  return {
    // Never let the legacy score UI reappear. The frontend already hides it
    // when null. The field is retained only to avoid breaking persisted-result
    // and rendering code.
    sleep_score: null,
    diagnosis: typeof parsed.diagnosis === 'string' ? parsed.diagnosis : '',
    key_issues: Array.isArray(parsed.key_issues)
      ? parsed.key_issues.filter(x => typeof x === 'string' && x.trim()).slice(0, 4)
      : [],
    quick_wins: Array.isArray(parsed.quick_wins)
      ? parsed.quick_wins.filter(x => typeof x === 'string' && x.trim()).slice(0, 2)
      : [],
    protocol,
    // Named possibilities only — no instructions. If the model wrote a full
    // sentence with a "try X for Y days" shape, it still renders as a short
    // chip on the frontend rather than a card, so a verbose entry just looks
    // odd rather than duplicating the primary-experiment structure.
    try_next: Array.isArray(parsed.try_next)
      ? parsed.try_next.filter(x => typeof x === 'string' && x.trim()).slice(0, 2)
      : [],
    // A schedule needs BOTH real anchors to mean anything; a bedtime with no
    // wake time (or a placeholder in place of either) is a half-empty card,
    // not a schedule — null the whole thing rather than render that.
    schedule: (parsed.schedule && typeof parsed.schedule === 'object' && bedtimeOk && wakeOk)
      ? {
          bedtime: parsed.schedule.bedtime,
          wake_time: parsed.schedule.wake_time,
          wind_down_start: isRealTimeValue(parsed.schedule.wind_down_start) ? parsed.schedule.wind_down_start : null,
          note: typeof parsed.schedule.note === 'string' ? parsed.schedule.note : '',
        }
      : null,
  };
}

router.post('/sleep-architect/stream', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  const {
    goals,
    bedtime,
    wakeTime,
    hoursActual,
    disruptors,
    freeform,
    userLanguage,
    userLocale,
    userCurrency,
    userRegion,
  } = req.body;

  const goalList = Array.isArray(goals) && goals.length
    ? goals.map(g => GOAL_LABELS[g] ?? g).join(', ')
    : null;

  const disruptorList = Array.isArray(disruptors) && disruptors.length
    ? disruptors.map(d => DISRUPTOR_LABELS[d] ?? d).join(', ')
    : null;

  if (!goalList && !freeform?.trim()) {
    return res.status(400).json({ error: 'Please select at least one sleep goal or describe your situation.' });
  }

  const systemPrompt = withLanguage(
    `You are SleepArchitect, a practical sleep-experiment coach. You reason carefully from what the visitor reports and do not diagnose, score, prescribe, or invent causes. You always return only valid JSON with no markdown, no code blocks, and no explanation outside the JSON object.\n\n${TOOL_RULES}`,
    userLanguage
  );

  const context = [
    goalList          ? `Visitor goals: ${goalList}` : null,
    bedtime           ? `Reported usual bedtime: ${bedtime}` : null,
    wakeTime          ? `Reported usual wake time: ${wakeTime}` : null,
    hoursActual       ? `Reported actual hours slept: ${hoursActual}` : null,
    disruptorList     ? `Visitor-selected possible disruptors: ${disruptorList}` : null,
    freeform?.trim()  ? `Visitor's own description: ${freeform.trim()}` : null,
  ].filter(Boolean).join('\n');

  const prompt = `Build a focused sleep experiment from the information below.

${context}

The frontend still uses an older field shape, so preserve the exact JSON keys below while applying the new meanings described here.

Return ONLY valid JSON with this exact structure:
{
  "sleep_score": null,
  "diagnosis": <2-4 concise sentences titled by meaning, not literally labeled; summarize WHAT THE VISITOR REPORTED and identify the one or two most useful variables to test without claiming they are causes>,
  "key_issues": [<2-4 short items phrased as 'worth testing', 'reported pattern', or 'still unknown' — never diagnoses or causal declarations>],
  "quick_wins": [<1-2 low-risk things to try tonight; MUST support the same single experiment in "protocol" below, never a second intervention; framed as experiments, not guarantees>],
  "protocol": [
    {
      "phase": <one of exactly: "immediate", "week1", "ongoing", "environment">,
      "title": <short action-oriented title>,
      "description": <1-2 sentences: why this experiment is worth trying based on the visitor's supplied facts and what question it helps answer>,
      "actions": [<2-4 concrete steps covering what to try, how long to try it, what to notice, and what result would suggest trying something else instead>]
    }
  ],
  "try_next": [<0-2 SHORT phrases naming another variable worth testing later — a few words, not instructions; e.g. "an earlier caffeine cutoff", not a paragraph of steps for it>],
  "schedule": null OR {
    "bedtime": <suggested experimental bedtime or null>,
    "wake_time": <suggested experimental wake time or null>,
    "wind_down_start": <suggested wind-down start or null>,
    "note": <one sentence explicitly framing this as an experiment and stating what to notice>
  }
}

OUTPUT LOGIC
1. diagnosis: despite the legacy field name, this is the person's SLEEP PICTURE, not a medical diagnosis. Use only what they supplied plus clearly marked possibilities. Apply the same hedging in this opening summary that you apply everywhere else — do not state a hypothesis as fact here and hedge it correctly only later.
2. key_issues: choose the few variables most worth testing. Do not treat a selected disruptor as proven causal.
3. quick_wins: maximum 2, and must support the SAME experiment as protocol[0] — never a second intervention. If nothing sensible can be tried tonight from the supplied information, return an empty array rather than inventing one.
4. protocol: EXACTLY ONE entry — the primary experiment. Never a second card, even a short one. Its actions must cover what to try, how long to try it, what to notice, and what result would suggest trying something else instead.
5. try_next: at most 2 short phrases, named only — no steps, no "how", no duration. This is where every other plausible variable goes instead of a second protocol card. Return [] if there is nothing else worth naming.
6. If racing thoughts/stress is reported, a simple written offload or calming routine may be the primary experiment; do not diagnose anxiety or claim the brain has open loops that must be closed.
7. If caffeine is reported, suggest testing earlier or reduced late-day caffeine without inventing a biologically optimal cutoff unless the visitor supplied enough context for a clearly labeled experimental cutoff.
8. If screens are reported, suggest testing phone/screen removal from bed or earlier use without claiming that screens are definitely delaying melatonin or causing the person's sleep problem.
9. If irregular timing is reported, suggest testing greater consistency without declaring a circadian disorder or inventing a biologically ideal schedule.
10. If pain, repeated bathroom waking, breathing concerns, severe daytime sleepiness, dangerous drowsiness, or persistent major impairment is reported, make the ONE primary experiment a professional-evaluation recommendation, not a behavioral step. State what reported sign makes that worth discussing with a clinician.
11. If the visitor reports rotating shifts, a major schedule transition, or near-total sleep loss over one or more nights, do not turn the primary experiment into a schedule-forcing instruction (holding a wake time, skipping recovery sleep, rapid re-timing). The primary experiment should be the lowest-risk thing worth testing now, and the description should say plainly that the transition itself is worth discussing with a clinician or sleep specialist familiar with shift work.
12. schedule: return null unless a schedule experiment is genuinely useful and supported by the supplied times/goals, AND you can populate real bedtime and wake_time values from what was supplied — never a placeholder like "to be determined". Do not create an 8-hour target merely from generic adult-sleep recommendations.
13. protocol[].phase MUST stay in English exactly as immediate|week1|ongoing|environment even if the response language is not English; these are UI code values.
14. No medication or supplement recommendations, including melatonin.
15. No score. sleep_score must be null.
16. Before returning, count the independent behavioral changes in protocol[0]'s actions. If it is more than one variable, cut it down until the visitor could answer "what am I testing?" in one sentence.
17. ${NO_QUOTE_RULE}
18. Return ONLY the JSON object.`;

  try {
    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 3500,
      system: systemPrompt + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: prompt }],
    }, { label: 'sleep-architect-v2' });

    const result = validateResult(parsed);
    if (!result) return res.status(500).json({ error: 'Unexpected response format. Please try again.' });
    res.json(result);
  } catch (err) {
    console.error('❌ SleepArchitect v2 error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Sleep experiment generation failed. Please try again.' });
    }
  }
});

module.exports = router;
