const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');
const { runOutputGuard } = require('../lib/outputGuard');

const NO_QUOTE_RULE = 'Never place a double-quote (") character inside any JSON string value. Use single quotes or plain text inside JSON string values.';

const SYSTEM_PROMPT = `You are Crisis Prioritizer, a calm practical task-triage assistant.

Your job is to help a person decide what deserves attention first when several things are competing for their time.

CORE RULES
1. Rank from evidence, not from emotional interpretation.
2. Use only information supplied by the visitor or directly entailed by it: stated deadlines, stated consequences, dependencies, people waiting, time sensitivity, available time, and available energy.
3. Never invent a deadline, consequence, dependency, commitment, person waiting, cost of delay, or safety of delay.
4. Never decide that a task is anxiety-driven, irrational, guilt-driven, avoidance, perfectionism, procrastination, or a sign of any psychological trait.
5. Never claim to know what will happen if a task is delayed unless the visitor supplied that consequence.
6. When a missing fact could materially change the order, expose the uncertainty. Put the task in need_one_fact and ask the smallest useful question.
6a. An unknown you name is an unknown you must ask about. If any justification says something was not specified, is unclear, or is not known, and the answer could change the order, that same unknown must also appear in need_one_fact as a question. A missing fact mentioned in passing gives the visitor nothing to act on; a question gives them something to answer.
7. A missing deadline does not mean no deadline. Say 'not supplied' rather than 'no hard deadline'.
8. Available time and energy affect feasibility and sequencing. They do not determine whether a task is objectively urgent.
9. Distinguish urgency from importance. A valuable task may still be able to wait; a small task may be time-sensitive.
9a. 'Can probably wait' is a statement about the evidence, never a reassurance. The visitor not supplying a consequence is not evidence that there is none. Never write that a task is safe to delay, harmless to postpone, has no downside, will not matter, or can wait without consequence. Say what the supplied information does not establish, and stop there.
9b. A supplied fact is not a recommended action. The visitor telling you a deadline, a person waiting, or their own intention (I should call the bank tomorrow) establishes that fact and nothing more. It does not establish that the action is right, that the timing is correct, or that they must do it. Report what they supplied as evidence, and let the ranking be your claim, not theirs restated back as advice.
9c. An expected event is not a confirmed event. Renews next month, the round closes on the 30th, they said they would reply — these describe things that have not happened. Never write about them in the past tense, never treat a future date as already reached, and never treat an intention or a schedule as an outcome. If whether it has happened would change the ranking, that is a need_one_fact question.
9d. Not knowing when something can safely be deferred to is not permission to choose a date. If the visitor supplied no deadline, revisit point, or billing cycle, you may not invent next week, end of month, in a few days, or any other moment. Use null. A revisit point is only a date the visitor gave you, or one that follows necessarily from a date they gave you.
10. Do not manufacture certainty to force every task into a neat ranking.
11. Prefer concrete next actions over motivational commentary.
12. Time estimates are rough planning estimates unless the visitor supplied a duration. Label them as estimates.
13. Do not assume universal energy curves or that particular kinds of work should happen at particular times of day.
14. Do not prescribe rest, self-care, medical action, sick leave, or stopping work merely from an energy selection. You may make a plan lighter when the visitor reports low capacity.
15. Do not infer that a workload is unsustainable unless the supplied tasks and available time demonstrate that they do not fit; if so, describe the mismatch rather than diagnosing the person.
16. History may be used to report factual recurrence: task categories, completion, deferral, timing, or outcomes the visitor recorded. Do not turn history into personality analysis, emotional profiling, or an 'urgency accuracy' score.
17. Lead with the answer. Keep output compact. Say each point once.
18. ${NO_QUOTE_RULE}`;

const TRIAGE_SCHEMA = `{
  "headline": "One sentence stating the most useful conclusion from the supplied information.",
  "do_first": [
    {
      "task": "task text",
      "why_now": "the specific supplied evidence that makes this time-sensitive. Cite the evidence; do not restate the visitor own stated intention as your reason. Keep expected events in the future tense.",
      "next_action": "one concrete first step",
      "deadline": "supplied deadline or null",
      "who_waiting": "supplied person or null"
    }
  ],
  "do_next": [
    {
      "task": "task text",
      "why_next": "why it follows the do-first work, grounded in supplied facts",
      "next_action": "one concrete first step",
      "deadline": "supplied deadline or null"
    }
  ],
  "can_probably_wait": [
    {
      "task": "task text",
      "why": "why the supplied information does not establish that it must happen sooner",
      "revisit": "ONLY a date or moment the visitor supplied, or one that follows necessarily from one they supplied. If they supplied none, this is null. Never a date you chose."
    }
  ],
  "need_one_fact": [
    {
      "task": "task text",
      "question": "the single missing fact most likely to change this task's position",
      "why_it_matters": "brief explanation of how the answer could affect ranking"
    }
  ],
  "capacity_fit": {
    "summary": "whether the proposed do-first/do-next work appears to fit the supplied time and energy, with uncertainty stated",
    "if_it_does_not_fit": "what to defer, narrow, delegate, or clarify first; null when unnecessary"
  },
  "just_one_thing": {
    "task": "the best-supported first task; null if a missing fact prevents a defensible choice",
    "first_action": "one concrete action; null when task is null",
    "why": "brief supplied evidence for this choice, or why one fact is needed first"
  }
}`;

function taskLines(tasks = []) {
  return tasks.map((t, i) => {
    const task = typeof t === 'string' ? t : t.task;
    const bits = [`${i + 1}. ${task}`];
    if (t?.deadline) bits.push(`Deadline supplied: ${t.deadline}`);
    if (t?.who_waiting) bits.push(`Person waiting supplied: ${t.who_waiting}`);
    if (t?.consequence) bits.push(`Consequence supplied: ${t.consequence}`);
    if (t?.depends_on) bits.push(`Dependency supplied: ${t.depends_on}`);
    if (t?.context) bits.push(`Context supplied: ${t.context}`);
    return bits.join(' | ');
  }).join('\n');
}

// Everything the visitor actually typed, as the guard's only source of truth.
// This tool's whole failure mode is a deadline, a consequence, a person
// waiting or a psychological read that was never supplied coming back as a
// reason to do something first.
function suppliedFrom(body = {}) {
  const shown = {};
  for (const k of ['tasks', 'text', 'task', 'priorities', 'remainingTasks', 'completedTasks',
                   'newTasks', 'mustDos', 'deferrals', 'originalPlan', 'currentPlan', 'sessions',
                   'energy_level', 'hours_available', 'hours_remaining', 'start_time', 'period',
                   'constraints', 'context', 'newContext', 'delegateTo', 'tone', 'recipientType',
                   'whatGotDone', 'whatDidnt', 'surprises', 'outcomes']) {
    if (body[k] !== undefined && body[k] !== null && body[k] !== '') shown[k] = body[k];
  }
  return `WHAT THE VISITOR SUPPLIED — the complete set of established facts:
${JSON.stringify(shown, null, 2)}

There is no other source. A deadline, consequence, dependency, person waiting, commitment or cost of delay that is not above was invented. Absence of a deadline is 'not supplied', never 'no deadline', and absence of a stated consequence is not evidence that delaying is safe. Nothing here establishes why the visitor feels any way about a task. A fact the visitor supplied is evidence, not their instruction and not a recommendation. Anything dated in the future has not happened yet. If no date was supplied for when something could be revisited, there is no such date to report.`;
}

async function guardResult(result, { supplied, promise, label, userLanguage, userLocale }) {
  const fields = [];
  const walk = (val, path) => {
    if (typeof val === 'string' && val.trim().length > 15) fields.push([path, val]);
    else if (Array.isArray(val)) val.forEach((v, i) => walk(v, `${path}[${i}]`));
    else if (val && typeof val === 'object') Object.entries(val).forEach(([k, v]) => walk(v, path ? `${path}.${k}` : k));
  };
  walk(result, '');
  await runOutputGuard(result, {
    label,
    fields,
    supplied,
    promise,
    guard: router.outputGuard,
    userLanguage,
    locale: withLocaleContext(userLocale),
  });
}

// README: "Wire responses through your repository's existing runOutputGuard
// helper/profile before merge." All twelve actions already funnel through
// this one function, so that is where it goes.
async function ask(prompt, userLanguage, label, max_tokens = 3000, guardCtx = null) {
  const result = await callClaudeWithRetry({
    model: MODELS.SMART,
    max_tokens: max_tokens,
    // withLocaleContext is localization layer 2 — without it the model
    // reasons in US defaults about working hours, holidays and money.
    system: withLanguage(SYSTEM_PROMPT, userLanguage) + withLocaleContext(guardCtx?.userLocale),
    messages: [{ role: 'user', content: prompt }],
  }, { label });
  if (guardCtx) await guardResult(result, { ...guardCtx, label, userLanguage });
  return result;
}

router.post('/crisis-prioritizer', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { action = 'generate', userLanguage, userLocale } = req.body;
    const guardCtx = { supplied: suppliedFrom(req.body), userLocale };

    if (action === 'generate') {
      const { tasks = [], energy_level, hours_available, context } = req.body;
      if (!tasks.length) return res.status(400).json({ error: 'Add at least one task.' });

      const prompt = `TRIAGE THESE TASKS.

TASKS
${taskLines(tasks)}

AVAILABLE TIME
${hours_available || 'Not supplied'}

ENERGY
${energy_level || 'Not supplied'}

ADDITIONAL CONTEXT
${context || 'None supplied'}

INSTRUCTIONS
- Every task must appear exactly once across do_first, do_next, can_probably_wait, or need_one_fact.
- do_first requires supplied evidence of time sensitivity or a dependency that makes it the defensible starting point.
- do_next is for work that matters but is not as immediately time-sensitive as do_first.
- can_probably_wait means only that the supplied information does not establish a need to do it sooner. Do not claim delay is consequence-free.
- need_one_fact is a first-class result, not a failure. Use it whenever an unknown could materially change ranking.
- If several rankings are plausible, say so rather than inventing a decisive fact.
- Energy and time may change how much fits, but must not manufacture urgency.
- just_one_thing must be drawn from do_first when possible. If no defensible first task exists, make task null and point to the most important missing fact.

Return ONLY valid JSON:
${TRIAGE_SCHEMA}`;

      const parsed = await ask(prompt, userLanguage, 'CrisisPrioritizerV2-generate', 4000, { ...guardCtx, promise: 'A defensible order of attention over the tasks the visitor listed — what to do first, what follows, what the supplied information does not show a need to rush, and the single missing fact that would change the order.' });
      if (!parsed?.headline || !Array.isArray(parsed?.need_one_fact)) {
        return res.status(500).json({ error: 'Could not prioritize your tasks. Please try again.' });
      }
      return res.json(parsed);
    }

    if (action === 'quick-dump') {
      const { text } = req.body;
      if (!text?.trim()) return res.status(400).json({ error: 'Paste what is competing for your attention.' });

      const prompt = `TURN THIS BRAIN DUMP INTO TASKS WITHOUT INTERPRETING THE PERSON.

BRAIN DUMP
${text.trim()}

RULES
- Extract actionable tasks.
- Preserve explicit deadlines, people waiting, consequences, dependencies, and constraints when stated.
- You may resolve direct references from the text, but do not invent missing facts.
- Do not produce an emotional read.
- Do not require a minimum number of tasks.
- Context that matters but is not itself a task belongs in context_notes.

Return ONLY valid JSON:
{
  "tasks": [
    {
      "task": "clear actionable task",
      "deadline": "explicit or directly stated deadline, otherwise null",
      "who_waiting": "explicitly stated person, otherwise null",
      "consequence": "explicitly stated consequence of delay, otherwise null",
      "depends_on": "explicitly stated dependency, otherwise null"
    }
  ],
  "context_notes": ["relevant supplied context that should travel with the tasks"],
  "count": 0
}`;

      const parsed = await ask(prompt, userLanguage, 'CrisisPrioritizerV2-dump', 2200, { ...guardCtx, promise: 'The tasks contained in what the visitor wrote, with any deadline, person waiting, consequence or dependency they actually stated preserved and nothing added.' });
      if (!parsed?.tasks) return res.status(500).json({ error: 'Could not extract the tasks. Please try again.' });
      return res.json(parsed);
    }

    if (action === 'just-one-thing') {
      const { tasks = [], energy_level, hours_available, context } = req.body;
      if (!tasks.length) return res.status(400).json({ error: 'Add at least one task.' });

      const prompt = `CHOOSE ONE DEFENSIBLE NEXT ACTION FROM THESE TASKS.

${taskLines(tasks)}

AVAILABLE TIME: ${hours_available || 'Not supplied'}
ENERGY: ${energy_level || 'Not supplied'}
CONTEXT: ${context || 'None supplied'}

If the supplied evidence does not support choosing one task over the others, do not guess. Ask one question instead.

Return ONLY valid JSON:
{
  "task": "single task or null",
  "first_action": "one concrete first action or null",
  "why": "brief evidence-based reason",
  "need_one_fact": "one question if needed, otherwise null",
  "after_this": "one short next step after completing the action"
}`;

      const parsed = await ask(prompt, userLanguage, 'CrisisPrioritizerV2-one', 1200, { ...guardCtx, promise: 'One task to start with, drawn from the supplied evidence, or one question when the evidence does not support choosing.' });
      return res.json(parsed);
    }

    if (action === 'split-task') {
      const { task, context, energy_level } = req.body;
      if (!task?.trim()) return res.status(400).json({ error: 'Which task?' });

      const prompt = `BREAK THIS TASK INTO USEFUL, CONCRETE STEPS.

TASK: ${task.trim()}
CONTEXT: ${context || 'None supplied'}
ENERGY: ${energy_level || 'Not supplied'}

RULES
- Decompose only what the task/context supports.
- Do not invent project requirements, deadlines, collaborators, or dependencies.
- 3-8 steps when the task genuinely supports that many; fewer is fine.
- Give rough time estimates only when useful and label them estimates.
- Identify dependencies only when logically inherent or supplied.
- Do not assign urgency to invented sub-tasks.
- Low energy may justify smaller steps, not claims about what the user can or cannot do.

Return ONLY valid JSON:
{
  "summary": "one sentence describing the useful decomposition",
  "steps": [
    {
      "step": "concrete action",
      "rough_time": "rough estimate or null",
      "depends_on": "step number or null",
      "can_delegate": "true|false|unknown"
    }
  ],
  "smallest_start": "the smallest useful first action",
  "unknowns": ["missing facts that would materially change the breakdown"]
}`;

      const parsed = await ask(prompt, userLanguage, 'CrisisPrioritizerV2-split', 2500, { ...guardCtx, promise: 'The task the visitor named, broken into concrete steps that the task and its supplied context genuinely support.' });
      return res.json(parsed);
    }

    if (action === 'time-block') {
      const { priorities = [], hours_available, energy_level, start_time, constraints } = req.body;
      if (!priorities.length) return res.status(400).json({ error: 'Need prioritized tasks.' });

      const prompt = `BUILD A FEASIBLE SCHEDULE FROM AN EXISTING PRIORITIZED LIST.

PRIORITIES
${taskLines(priorities)}

AVAILABLE TIME: ${hours_available || 'Not supplied'}
START TIME: ${start_time || 'Not supplied'}
ENERGY: ${energy_level || 'Not supplied'}
CONSTRAINTS: ${constraints || 'None supplied'}

RULES
- Preserve the evidence-based order unless a supplied fixed-time constraint requires otherwise.
- Do not invent calendar commitments.
- Time estimates are rough unless supplied.
- If available time is unknown, make an ordered sequence rather than fake clock times.
- If the work does not fit, put overflow in not_scheduled.
- Breaks may be offered as flexible space, not prescribed as medically necessary.

Return ONLY valid JSON:
{
  "summary": "one sentence",
  "blocks": [
    {
      "start": "time or null",
      "end": "time or null",
      "task": "specific action",
      "rough_minutes": 0,
      "note": "brief planning note or null"
    }
  ],
  "not_scheduled": ["work that does not fit"],
  "adjustment_rule": "one simple rule for what to do if a block runs long"
}`;

      const parsed = await ask(prompt, userLanguage, 'CrisisPrioritizerV2-schedule', 3000, { ...guardCtx, promise: 'A workable sequence for the already-prioritised work that respects supplied fixed times and shows what does not fit.' });
      return res.json(parsed);
    }

    if (action === 'delegate') {
      const { task, delegateTo, context, tone } = req.body;
      if (!task?.trim()) return res.status(400).json({ error: 'Which task?' });

      const prompt = `DRAFT A SHORT HANDOFF MESSAGE.

TASK: ${task.trim()}
RECIPIENT: ${delegateTo || 'Not supplied'}
CONTEXT: ${context || 'None supplied'}
REQUESTED TONE: ${tone || 'clear and warm'}

Do not invent deadlines, attachments, authority, or background. If a needed detail is missing, use neutral wording rather than fabricating it.

Return ONLY valid JSON:
{
  "message": "ready-to-send handoff",
  "subject_line": "email subject if useful, otherwise null",
  "include": ["only supplied attachments/context that should accompany it"],
  "missing_detail": "one detail worth adding before sending, or null"
}`;

      const parsed = await ask(prompt, userLanguage, 'CrisisPrioritizerV2-delegate', 1200, { ...guardCtx, promise: 'A short handoff message about this task that a real person could send as-is, inventing no deadline, authority or background.' });
      return res.json(parsed);
    }

    if (action === 're-triage') {
      const { completedTasks = [], remainingTasks = [], energy_level, hours_remaining, newContext } = req.body;
      if (!remainingTasks.length) {
        return res.json({
          headline: 'Everything in this plan is marked complete.',
          do_first: [], do_next: [], can_probably_wait: [], need_one_fact: [],
          capacity_fit: { summary: 'No remaining tasks were supplied.', if_it_does_not_fit: null },
          just_one_thing: { task: null, first_action: null, why: 'Nothing remains in the supplied plan.' }
        });
      }

      const prompt = `RE-TRIAGE WHAT REMAINS AFTER PROGRESS.

COMPLETED
${completedTasks.length ? completedTasks.join('\n') : 'None supplied'}

REMAINING
${taskLines(remainingTasks)}

TIME LEFT: ${hours_remaining || 'Not supplied'}
ENERGY: ${energy_level || 'Not supplied'}
NEW CONTEXT: ${newContext || 'None supplied'}

Do not assume urgency changed merely because time passed. Use only supplied deadlines and new context.

Return ONLY valid JSON:
${TRIAGE_SCHEMA}`;

      const parsed = await ask(prompt, userLanguage, 'CrisisPrioritizerV2-retriage', 3500, { ...guardCtx, promise: 'A fresh order of attention over what remains, based on supplied deadlines and new context rather than on time having passed.' });
      return res.json(parsed);
    }

    if (action === 'plan-period') {
      const { tasks = [], period = 'this_week', hours_available, energy_level, constraints } = req.body;
      if (!tasks.length) return res.status(400).json({ error: 'Add at least one task.' });

      const prompt = `BUILD A PRACTICAL ${period === 'few_weeks' ? 'MULTI-WEEK' : 'WEEK'} PLAN FROM THESE TASKS.

${taskLines(tasks)}

AVAILABLE CAPACITY: ${hours_available || 'Not supplied'}
ENERGY: ${energy_level || 'Not supplied'}
FIXED CONSTRAINTS: ${constraints || 'None supplied'}

RULES
- Schedule around supplied deadlines and dependencies.
- Do not invent dates, commitments, energy curves, or consequences.
- If exact dates are unknown, use ordered phases rather than fake calendar precision.
- If work appears not to fit supplied capacity, show the mismatch and what needs deferral, narrowing, delegation, or clarification.

Return ONLY valid JSON:
{
  "headline": "one sentence",
  "periods": [
    {
      "label": "day/week label grounded in supplied dates, or Phase 1/Phase 2",
      "focus": "short focus",
      "tasks": ["tasks/actions for this period"],
      "rough_load": "rough workload estimate or null"
    }
  ],
  "not_scheduled": ["tasks that do not fit or cannot yet be placed"],
  "need_one_fact": [
    { "task": "task", "question": "missing fact that would change placement" }
  ],
  "capacity_note": "brief fit/mismatch note"
}`;

      const parsed = await ask(prompt, userLanguage, 'CrisisPrioritizerV2-period', 3500, { ...guardCtx, promise: 'A practical plan across the period that schedules around supplied deadlines and dependencies and shows what does not fit.' });
      return res.json(parsed);
    }

    if (action === 'accountability-snapshot') {
      const { mustDos = [], deferrals = [], recipientType, context } = req.body;
      if (!mustDos.length) return res.status(400).json({ error: 'Need tasks to share.' });

      const prompt = `WRITE A CONCISE ACCOUNTABILITY MESSAGE USING ONLY THIS PLAN.

DOING
${mustDos.join('\n')}

NOT DOING YET
${deferrals.join('\n') || 'None supplied'}

RECIPIENT: ${recipientType || 'Not supplied'}
CONTEXT: ${context || 'None supplied'}

Do not invent a check-in time or ask the recipient to monitor the user unless requested.

Return ONLY valid JSON:
{
  "message": "ready-to-send message",
  "format_hint": "text|email|slack|other",
  "optional_check_in_line": "optional line inviting a check-in, or null"
}`;

      const parsed = await ask(prompt, userLanguage, 'CrisisPrioritizerV2-accountability', 1200, { ...guardCtx, promise: 'A short message the visitor could send about what they are doing and what they are not, using only this plan.' });
      return res.json(parsed);
    }

    if (action === 'follow-up') {
      const { originalPlan, whatGotDone, whatDidnt, surprises, outcomes } = req.body;
      if (!originalPlan) return res.status(400).json({ error: 'Need the earlier plan.' });

      const prompt = `REVIEW WHAT HAPPENED AFTER A PRIOR TRIAGE.

ORIGINAL PLAN
${JSON.stringify(originalPlan)}

DONE: ${whatGotDone || 'Not supplied'}
NOT DONE: ${whatDidnt || 'Not supplied'}
SURPRISES: ${surprises || 'Not supplied'}
OUTCOMES: ${outcomes || 'Not supplied'}

RULES
- Compare plan with reported outcomes.
- Do not infer that an uncompleted task was never urgent.
- Do not create an urgency-accuracy score.
- Do not infer personality or emotional patterns.
- Surface only lessons supported by the reported outcome.

Return ONLY valid JSON:
{
  "what_happened": "brief factual comparison",
  "what_the_outcome_supports": ["grounded lessons"],
  "what_it_does_not_establish": ["tempting conclusions not supported by the evidence"],
  "use_next_time": ["specific factual information worth capturing earlier next time"]
}`;

      const parsed = await ask(prompt, userLanguage, 'CrisisPrioritizerV2-followup', 2200, { ...guardCtx, promise: 'A factual comparison of the plan with what the visitor reported happened, separating what the outcome supports from what it does not establish.' });
      return res.json(parsed);
    }

    if (action === 'history-patterns' || action === 'pattern' || action === 'dashboard-insights') {
      const sessions = req.body.sessions || [];
      if (sessions.length < 2) return res.status(400).json({ error: 'Need at least 2 past sessions.' });

      const prompt = `SUMMARIZE FACTUAL PATTERNS ACROSS THESE PRIORITIZATION SESSIONS.

SESSIONS
${JSON.stringify(sessions.slice(0, 20))}

RULES
- Report only recurrence explicitly represented in the stored session data.
- Useful patterns include recurring task categories, recurring deadlines, completion/deferral outcomes, workload counts, or timing.
- Do not score urgency accuracy.
- Do not label tasks anxiety-driven.
- Do not infer personality, emotional tendencies, avoidance, perfectionism, or improvement unless the stored outcomes directly establish the specific claim.
- Distinguish counts from interpretations.

Return ONLY valid JSON:
{
  "headline": "one grounded sentence",
  "recurring_facts": [
    { "pattern": "factual recurrence", "evidence": "count/examples from supplied sessions" }
  ],
  "outcome_patterns": [
    { "pattern": "factual completion/deferral/outcome pattern", "evidence": "support" }
  ],
  "worth_capturing_next_time": ["missing factual fields that would make future triage more useful"],
  "limits": ["what this history cannot establish"]
}`;

      const parsed = await ask(prompt, userLanguage, 'CrisisPrioritizerV2-history', 2500, { ...guardCtx, promise: 'Factual recurrence across the stored sessions — counts and repeats — with the limits of what history can establish stated.' });
      return res.json(parsed);
    }

    if (action === 'rolling-crisis-update') {
      const { currentPlan, completedTasks = [], newTasks = [], hours_available, energy_level, newContext } = req.body;
      if (!currentPlan) return res.status(400).json({ error: 'Need existing plan.' });

      const prompt = `UPDATE AN EXISTING PERIOD PLAN.

CURRENT PLAN
${JSON.stringify(currentPlan)}

COMPLETED
${completedTasks.join('\n') || 'None supplied'}

NEW TASKS
${taskLines(newTasks)}

AVAILABLE CAPACITY: ${hours_available || 'Not supplied'}
ENERGY: ${energy_level || 'Not supplied'}
NEW CONTEXT: ${newContext || 'None supplied'}

Preserve supplied deadlines/dependencies. Do not invent reasons a plan is behind, sustainable, or unsustainable.

Return ONLY valid JSON:
{
  "headline": "what changed",
  "updated_periods": [
    { "label": "existing or evidence-based period label", "tasks": ["remaining/new tasks"], "rough_load": "rough estimate or null" }
  ],
  "completed": ["reported completed tasks"],
  "not_scheduled": ["tasks that do not fit or cannot yet be placed"],
  "need_one_fact": [{ "task": "task", "question": "missing fact that would change placement" }],
  "next_action": "best-supported next action"
}`;

      const parsed = await ask(prompt, userLanguage, 'CrisisPrioritizerV2-rolling', 3000, { ...guardCtx, promise: 'The existing plan brought up to date with reported progress and new work, preserving supplied deadlines and dependencies.' });
      return res.json(parsed);
    }

    return res.status(400).json({ error: 'Invalid action.' });
  } catch (error) {
    console.error('[CrisisPrioritizerV2]', error);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

router.outputStandard = 'v2';
// crisis-prioritizer-v2. A STRING here declares nothing and enforces nothing
// — Gate 9's regex matches it either way, which is exactly how Crash
// Predictor shipped with a guard that never ran. Each term below is a
// deleted concept from the V2 contract, turned into something the validator
// can actually catch.
router.outputGuard = {
  prohibit: [
    'invented_deadline_or_consequence',   // a due date or cost of delay the visitor never gave
    'invented_dependency_or_commitment',
    'psychological_read_of_the_visitor',  // anxiety-driven, avoidance, perfectionism, guilt
    'objective_urgency_claim',            // "this is actually the urgent one"
    'risk_scoring_or_accuracy_percentage',
    'universal_energy_curve',             // "mornings are for deep work"
    'unrequested_self_care_prescription',
    'overcommitment_diagnosis_without_arithmetic',
    'no_deadline_stated_as_fact',         // silence is 'not supplied', not 'no deadline'
    'safe_to_defer_claim',                // "nothing happens if this waits" — the visitor never said that
    'reassurance_not_supported_by_input',
    'supplied_intention_restated_as_recommendation',  // their plan handed back as your advice
    'expected_event_written_as_confirmed',            // a future date treated as already reached
    'invented_revisit_date',                          // 'revisit next week' with no supplied date
    'unknown_named_but_not_asked',                    // a gap raised in prose and never turned into a question
  ],
  require: [
    'ranking_traceable_to_supplied_facts',
    'unknowns_surfaced_rather_than_filled_in',
    'fulfills_tool_promise',
  ],
};

module.exports = router;
