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
// returns (never model-controlled), and every protocol step is reshaped to
// the fixed phase enum and stripped of anything malformed before it reaches
// the visitor. The content discipline itself (no diagnosis, no medication,
// no arbitrary precision) lives in TOOL_RULES below and is prompt-enforced,
// not code-verified — that's the honest scope of this guard.
router.outputStandard = 'v2';
router.outputGuard = {
  prohibit: [
    'nonnull_sleep_score_reaching_the_visitor',
    'protocol_step_phase_outside_the_fixed_four_value_enum',
    'malformed_protocol_step_passed_through_unfiltered',
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

NO DIAGNOSIS OR SCORING
Do not diagnose insomnia, conditioned arousal, circadian-rhythm disorders, anxiety, sleep debt, fragmented sleep, hyperarousal, or any other medical or psychological condition.
Do not assign a sleep-health score, severity score, risk score, percentage, or numeric confidence.
The response field named diagnosis exists only for frontend compatibility; use it as a plain-language summary of the reported sleep picture, not a diagnosis.
Always return sleep_score as null.

PERSONALIZATION
Personalize only from facts the visitor supplied. You may make simple arithmetic observations when the input supports them, such as the difference between two explicitly supplied clock times. Do not invent physiology, melatonin timing, sleep stages, circadian phase, nervous-system state, or hidden causes.

PRIORITIZE LEARNING, NOT VOLUME
Recommend the smallest useful experiment. Usually change one or two variables at a time so the person can tell what helped. Do not overwhelm them with a five-part optimization program when one high-information change would do.

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

SCHEDULE
Only propose a schedule when the visitor supplied enough information and schedule/timing is materially relevant to the goal. A schedule is an experiment, not a claim about the person's biological optimum. Preserve required obligations or wake times the visitor actually supplied. If those obligations are not clear, do not manufacture them.

WHAT TO NOTICE
Use observable outcomes: roughly how long it felt before sleep came, number or pattern of awakenings, how hard it was to get up, whether the person felt more or less rested, whether the change was practical, and whether the reported problem improved. Do not promise improvement.

MEDICAL / PROFESSIONAL ESCALATION
If the visitor reports a potentially important concern — for example loud snoring with gasping or breathing pauses, severe or persistent daytime sleepiness, nodding off while driving or working, ongoing significant pain, repeated nighttime urination that is concerning them, or persistent sleep difficulty that is substantially affecting daytime functioning — include a protocol step advising professional evaluation. State the observable reason for escalating; do not diagnose the cause.
Do not add a scary boilerplate warning when no such concern is present.

STYLE
Be calm, practical, and concise. Avoid clinical report voice, motivational filler, and performative certainty. Each section must earn its place. The answer should feel like a thoughtful coach helping the person test what matters next.

${NO_QUOTE_RULE}`;

// Structural sanitization only — sleep_score is force-nulled regardless of
// what the model returns, protocol steps are reshaped to the fixed phase
// enum, and every array is capped and filtered of junk. This does NOT verify
// the model actually avoided a diagnosis or a medication recommendation;
// that discipline is prompt-enforced (TOOL_RULES above), not code-checkable.
function validateResult(parsed) {
  if (!parsed?.diagnosis || !Array.isArray(parsed?.protocol)) return null;

  const allowedPhases = new Set(['immediate', 'week1', 'ongoing', 'environment']);
  const protocol = parsed.protocol
    .filter(step => step && typeof step === 'object')
    .slice(0, 4)
    .map(step => ({
      phase: allowedPhases.has(step.phase) ? step.phase : 'week1',
      title: typeof step.title === 'string' ? step.title : '',
      description: typeof step.description === 'string' ? step.description : '',
      actions: Array.isArray(step.actions)
        ? step.actions.filter(a => typeof a === 'string' && a.trim()).slice(0, 4)
        : [],
    }))
    .filter(step => step.title || step.description || step.actions.length);

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
    schedule: parsed.schedule && typeof parsed.schedule === 'object'
      ? {
          bedtime: typeof parsed.schedule.bedtime === 'string' ? parsed.schedule.bedtime : null,
          wake_time: typeof parsed.schedule.wake_time === 'string' ? parsed.schedule.wake_time : null,
          wind_down_start: typeof parsed.schedule.wind_down_start === 'string' ? parsed.schedule.wind_down_start : null,
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
  "quick_wins": [<1-2 low-risk things to try tonight; specific enough to act on but framed as experiments, not guarantees>],
  "protocol": [
    {
      "phase": <one of exactly: "immediate", "week1", "ongoing", "environment">,
      "title": <short action-oriented title>,
      "description": <1-2 sentences: why this experiment is worth trying based on the visitor's supplied facts and what question it helps answer>,
      "actions": [<2-4 concrete steps, including what to observe where useful>]
    }
  ],
  "schedule": null OR {
    "bedtime": <suggested experimental bedtime or null>,
    "wake_time": <suggested experimental wake time or null>,
    "wind_down_start": <suggested wind-down start or null>,
    "note": <one sentence explicitly framing this as an experiment and stating what to notice>
  }
}

OUTPUT LOGIC
1. diagnosis: despite the legacy field name, this is the person's SLEEP PICTURE, not a medical diagnosis. Use only what they supplied plus clearly marked possibilities.
2. key_issues: choose the few variables most worth testing. Do not treat a selected disruptor as proven causal.
3. quick_wins: maximum 2. If nothing sensible can be tried tonight from the supplied information, return an empty array rather than inventing one.
4. protocol: 2-4 steps total. Prefer a coherent 7-day experiment over a long protocol. Each step should either change one variable, establish a baseline/observation, or explain what to do next depending on the result.
5. If racing thoughts/stress is reported, a simple written offload or calming routine may be offered as an experiment; do not diagnose anxiety or claim the brain has open loops that must be closed.
6. If caffeine is reported, suggest testing earlier or reduced late-day caffeine without inventing a biologically optimal cutoff unless the visitor supplied enough context for a clearly labeled experimental cutoff.
7. If screens are reported, suggest testing phone/screen removal from bed or earlier use without claiming that screens are definitely delaying melatonin or causing the person's sleep problem.
8. If irregular timing is reported, suggest testing greater consistency without declaring a circadian disorder or inventing a biologically ideal schedule.
9. If pain, repeated bathroom waking, breathing concerns, severe daytime sleepiness, dangerous drowsiness, or persistent major impairment is reported, include a professional-evaluation step. State what reported sign makes that worth discussing with a clinician.
10. schedule: return null unless a schedule experiment is genuinely useful and supported by the supplied times/goals. Do not create an 8-hour target merely from generic adult-sleep recommendations.
11. protocol[].phase MUST stay in English exactly as immediate|week1|ongoing|environment even if the response language is not English; these are UI code values.
12. No medication or supplement recommendations, including melatonin.
13. No score. sleep_score must be null.
14. ${NO_QUOTE_RULE}
15. Return ONLY the JSON object.`;

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
