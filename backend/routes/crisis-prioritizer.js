const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage } = require('../lib/claude');
const { rateLimit } = require('../lib/rateLimiter');

// ═══════════════════════════════════════════
// SYSTEM PROMPT
// ═══════════════════════════════════════════

const SYSTEM_PROMPT = `You are a calm, clear-headed triage expert. Your job is to separate genuine urgency from the FEELING of urgency.

PHILOSOPHY:
- Not everything that feels urgent IS urgent. An aggressive email tone doesn't create a real deadline.
- "Someone will be disappointed" is not the same as "there will be real consequences."
- People in crisis overcount tasks. Some "tasks" are the same task described two ways.
- Energy matters. A critical task done by someone with zero energy will be done badly. Sometimes "rest first" IS the priority.
- Be honest but kind. Tell people what can wait without making them feel lazy.
- Never minimize genuine crises. If everything really IS on fire, say so and triage within that reality.

URGENCY LEVELS (be strict — most tasks are NOT critical):
- critical: Genuine imminent deadline, real consequences if missed (money, health, legal)
- important: Should happen soon, won't cause real damage if delayed a day or two
- medium: Would be nice to do, world won't end
- low: Can absolutely wait with zero consequences
- optional: Could be dropped entirely and nobody would notice

FORMAT: Return ONLY valid JSON. No markdown fences, no preamble.`;

// Voice/tone modifiers
const VOICE_MODIFIERS = {
  warm: 'Use a warm, gentle, supportive tone. Like a kind friend sitting with them.',
  direct: 'Be clear, concise, and no-nonsense. Respect their time. Skip the fluff, give them the facts.',
  tough_love: 'Be honest and blunt — like a trusted mentor who cares enough to not sugarcoat. Still kind, never cruel.',
};

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

function buildTaskList(tasks) {
  return tasks.map((t, i) => {
    let line = `${i + 1}. "${t.task}"`;
    if (t.deadline) line += ` [Deadline: ${t.deadline}]`;
    if (t.who_waiting) line += ` [Who's waiting: ${t.who_waiting}]`;
    return line;
  }).join('\n');
}

function buildStateBlock(energy, hours, emotional, timeframe) {
  const lines = [];
  if (emotional) lines.push(`EMOTIONAL STATE: ${emotional.replace(/_/g, ' ')}`);
  if (energy) lines.push(`ENERGY LEVEL: ${energy.replace(/_/g, ' ')}`);
  if (hours) {
    if (timeframe === 'right_now') lines.push(`TIME AVAILABLE: ${hours === 'unknown' ? 'Unknown' : hours + ' hours'}`);
    else lines.push(`DAILY CAPACITY: ${hours === 'unknown' ? 'Varies' : '~' + hours + ' hours/day'}`);
  }
  return lines.length ? lines.join('\n') : 'No state info provided';
}

function buildHistoryBlock(pastSessions) {
  if (!pastSessions?.length) return '';
  const list = pastSessions.slice(0, 8).map(s =>
    `  - ${s.date}: ${s.taskCount} tasks, ${s.actuallyUrgent} actually urgent, emotional: ${s.emotional || '?'}${s.followUp ? ` → Follow-up: ${s.followUp}` : ''}`
  ).join('\n');
  return `\nPAST CRISIS SESSIONS:\n${list}\nUse these for pattern awareness.\n`;
}

function getVoiceInstruction(voice) {
  return VOICE_MODIFIERS[voice] || VOICE_MODIFIERS.warm;
}

// Shared priority schema block
const PRIORITY_SCHEMA = `"objective_priorities": [
    {
      "rank": 1, "task": "task text",
      "actual_urgency": "critical|important|medium|low|optional",
      "deadline": "specific deadline or 'no hard deadline'",
      "consequence_if_missed": "What ACTUALLY happens — not anxiety's version",
      "anxiety_vs_reality": "What anxiety says vs what's true",
      "do_this": "One concrete next action — the FIRST step, not the whole task"
    }
  ]`;

const ANXIETY_SCHEMA = `"anxiety_audit": {
    "anxiety_driven": [{ "task": "Task", "why_it_feels_urgent": "reason", "reality": "what actually happens if you wait 24-48 hours" }],
    "legitimately_urgent": [{ "task": "Task", "why": "specific real consequence with timeline" }]
  }`;

// ═══════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════

router.post('/crisis-prioritizer', rateLimit(), async (req, res) => {
  try {
    const { action = 'generate' } = req.body;

    // ─── GENERATE (main triage — 3 timeframes) ───
    if (action === 'generate') {
      const { tasks, energy_level, hours_available, emotional_state, timeframe = 'right_now',
              pastSessions, voice, userLanguage } = req.body;

      if (!tasks?.length) return res.status(400).json({ error: 'Add at least one task.' });

      const taskList = buildTaskList(tasks);
      const stateBlock = buildStateBlock(energy_level, hours_available, emotional_state, timeframe);
      const historyBlock = buildHistoryBlock(pastSessions);
      const voiceNote = voice ? `\nTONE: ${getVoiceInstruction(voice)}` : '';

      let schema;
      if (timeframe === 'right_now') {
        schema = `{
  "grounding_message": "Warm, specific message for their emotional state. 1-3 sentences.",
  "reality_check": "Honest summary: 'Of your X tasks, only Y actually need to happen today...'",
  "tasks_analyzed": ${tasks.length},
  "actual_crisis_tasks": "number actually time-sensitive TODAY",
  "can_wait": "number that can wait without real consequences",
  "estimated_time": "realistic time for ONLY the must-dos",
  "todays_actual_must_dos": ["Task — brief reason it can't wait"],
  ${ANXIETY_SCHEMA},
  ${PRIORITY_SCHEMA},
  "guilt_free_deferrals": ["FULL SENTENCE: task name + specific reasoning + timeline. e.g. 'Your apartment does not need to be clean today. Nobody is coming over. It can wait until Saturday.'"],
  "energy_plan": "Realistic plan for their energy/time. Include breaks. Be specific.",
  "overcommitment_warning": "Only if 4+ tasks are genuinely critical, otherwise null"
}`;
      } else if (timeframe === 'this_week') {
        schema = `{
  "grounding_message": "Warm, specific message. 1-3 sentences.",
  "reality_check": "Honest summary of their week — is this doable?",
  "tasks_analyzed": ${tasks.length},
  "actual_crisis_tasks": "number truly time-sensitive this week",
  "can_wait": "number that can wait beyond this week",
  "todays_actual_must_dos": ["1-3 things that must happen TODAY"],
  ${ANXIETY_SCHEMA},
  ${PRIORITY_SCHEMA},
  "weekly_plan": [
    {
      "day_label": "Monday|Tuesday|etc.",
      "theme": "Optional — 'catch-up'|'deep work'|'admin'",
      "energy_note": "When to do what based on typical energy curves",
      "tasks": [{ "task": "description", "time_estimate": "~30min|~1hr|~2hr" }],
      "rest_reminder": "Brief rest note for this day"
    }
  ],
  "guilt_free_deferrals": ["FULL SENTENCE with reasoning"],
  "energy_plan": "Week-level strategy: when to push, when to rest, how to pace.",
  "overcommitment_warning": "If too much for one week — say so. Otherwise null."
}`;
      } else {
        schema = `{
  "grounding_message": "Warm message acknowledging sustained difficulty. 1-3 sentences.",
  "reality_check": "Honest big-picture summary.",
  "tasks_analyzed": ${tasks.length},
  "actual_crisis_tasks": "truly time-sensitive in next few weeks",
  "can_wait": "can wait beyond this period or be dropped",
  "todays_actual_must_dos": ["1-2 things that must happen TODAY"],
  ${ANXIETY_SCHEMA},
  ${PRIORITY_SCHEMA},
  "multi_week_plan": [
    {
      "week_label": "Week 1 (This Week)|Week 2|etc.",
      "focus": "Main focus area",
      "must_dos": ["tasks that must happen this week"],
      "delegate": ["tasks to hand off — suggest to whom/how"],
      "delete": ["tasks to drop entirely — with reasoning"],
      "self_care": "Specific self-care for this week"
    }
  ],
  "guilt_free_deferrals": ["FULL SENTENCE with reasoning"],
  "sustainability_check": "Honest: Is this workload sustainable? What needs to change?",
  "energy_plan": "How to pace across weeks.",
  "overcommitment_warning": "If unrealistic for one person — say so. Otherwise null."
}`;
      }

      const prompt = `TRIAGE THESE TASKS:

TASKS:
${taskList}

PERSON'S STATE:
${stateBlock}

TIMEFRAME: ${timeframe === 'right_now' ? 'RIGHT NOW — today\'s triage' : timeframe === 'this_week' ? 'THIS WEEK — day-by-day plan' : 'NEXT FEW WEEKS — sustained crisis management'}
${historyBlock}${voiceNote}

RULES:
- Most tasks are NOT critical. Be strict.
- "I feel like I should" is NOT urgency. "Something irreversible happens" IS urgency.
- Low energy → fewer tasks, more breaks.
- Grounding message should be warm and specific to their emotional state.
- guilt_free_deferrals must be FULL SENTENCES explaining WHY it's safe to wait.

Return ONLY valid JSON:
${schema}`;

      const parsed = await callClaudeWithRetry(prompt, {
        model: 'claude-sonnet-4-6',
        label: 'CrisisPrioritize', max_tokens: 4000,
        system: withLanguage(SYSTEM_PROMPT, userLanguage)
      });
      return res.json(parsed);
    }

    // ─── QUICK DUMP (paste paragraph → extract tasks) ───
    if (action === 'quick-dump') {
      const { text, userLanguage } = req.body;
      if (!text?.trim()) return res.status(400).json({ error: 'Paste your thoughts.' });

      const prompt = withLanguage(`Extract individual tasks from this panicked brain dump. The person couldn't organize their thoughts into separate items, so they pasted a stream of consciousness.

BRAIN DUMP:
"${text.trim()}"

RULES:
- Extract distinct tasks — not feelings, not context, not complaints. Just actionable items.
- If they mention the same thing twice in different words, merge it into one task.
- Infer deadlines from context ("need to do this before Friday" → deadline: Friday)
- Infer who's waiting from context ("my boss keeps asking" → who: boss)
- If something is clearly a feeling, not a task, skip it — but note it in the emotional_read.
- Extract 3-15 tasks. If fewer than 3, the paragraph probably wasn't about tasks.

Return ONLY valid JSON:
{
  "tasks": [
    { "task": "Clear, actionable description", "deadline": "inferred deadline or null", "who_waiting": "inferred person or null", "inferred_urgency": "critical|important|medium|low" }
  ],
  "emotional_read": "One sentence about how this person sounds — 'You sound overwhelmed by...' — warm, not clinical",
  "duplicate_note": "If you merged duplicates, note it. Otherwise null.",
  "count": "number of distinct tasks extracted"
}`, userLanguage);

      const parsed = await callClaudeWithRetry(prompt, {
        model: 'claude-sonnet-4-6',
        label: 'CrisisDump', max_tokens: 2000,
        system: withLanguage('Task extraction specialist. Pull actionable items from messy text. Warm tone. Return ONLY valid JSON.', userLanguage)
      });
      return res.json(parsed);
    }

    // ─── RE-TRIAGE (after completing must-dos, what's next?) ───
    if (action === 're-triage') {
      const { completedTasks, remainingTasks, energy_level, hours_remaining,
              originalResults, userLanguage } = req.body;
      if (!remainingTasks?.length) return res.status(400).json({ error: 'No remaining tasks.' });

      const completedList = (completedTasks || []).map(t => `✓ "${t}"`).join('\n');
      const remainingList = remainingTasks.map((t, i) => `${i + 1}. "${t.task}"${t.deadline ? ` [${t.deadline}]` : ''}`).join('\n');

      const prompt = withLanguage(`Re-triage after progress. The person has completed some tasks and wants to know what's next.

COMPLETED:
${completedList || 'Nothing yet'}

REMAINING:
${remainingList}

CURRENT ENERGY: ${energy_level || 'unknown'}
TIME LEFT: ${hours_remaining || 'unknown'}

RULES:
- They've already done the hardest stuff. Acknowledge that.
- Re-evaluate urgency — some tasks may have become more or less urgent since the original analysis.
- If they're running low on energy, suggest stopping and give them permission.
- Don't just repeat the original analysis — this is a FRESH look at what's left.

Return ONLY valid JSON:
{
  "acknowledgment": "Warm 1-2 sentences recognizing what they've accomplished so far",
  "still_must_do": ["Tasks that still need to happen — brief reason"],
  "can_stop_now": true/false,
  "stop_reasoning": "If they can stop: why it's okay. If not: what still needs doing and roughly how long.",
  "next_action": "The ONE thing to do next — very specific",
  "updated_deferrals": ["Anything that became deferrable since the first analysis"],
  "energy_check": "Honest read on whether they should keep going or rest"
}`, userLanguage);

      const parsed = await callClaudeWithRetry(prompt, {
        model: 'claude-sonnet-4-6',
        label: 'CrisisRetriage', max_tokens: 1500,
        system: withLanguage(SYSTEM_PROMPT, userLanguage)
      });
      return res.json(parsed);
    }

    // ─── FOLLOW-UP (how did last time go?) ───
    if (action === 'follow-up') {
      const { lastSession, whatGotDone, whatDidnt, surprises, userLanguage } = req.body;
      if (!lastSession) return res.status(400).json({ error: 'Need last session data.' });

      const prompt = withLanguage(`Analyze how someone's last crisis triage went. Help them see patterns.

LAST SESSION:
- Date: ${lastSession.date || '?'}
- Tasks: ${lastSession.taskCount || '?'} total, ${lastSession.actuallyUrgent || '?'} marked urgent
- Emotional state was: ${lastSession.emotional || '?'}

WHAT ACTUALLY GOT DONE: ${whatGotDone || 'Not specified'}
WHAT DIDN'T GET DONE: ${whatDidnt || 'Not specified'}
SURPRISES: ${surprises || 'None mentioned'}

Analyze:
- Were the "critical" items actually critical in hindsight?
- Did the deferrals work out okay? (They almost always do.)
- What does this tell them about their urgency calibration?

Return ONLY valid JSON:
{
  "hindsight_summary": "2-3 sentences — honest look at how accurate the urgency assessment was",
  "calibration_insight": "Did they overrate urgency? Underrate it? Pretty accurate? One sentence.",
  "deferrals_worked": true/false,
  "deferral_note": "If deferrals worked: 'See? Those things you were worried about waiting on...' If not: what happened.",
  "pattern_hint": "If you notice a pattern from the data — e.g., 'You tend to overrate work emails' — mention it. Otherwise null.",
  "encouragement": "Warm closing — they're getting better at this"
}`, userLanguage);

      const parsed = await callClaudeWithRetry(prompt, {
        model: 'claude-sonnet-4-6',
        label: 'CrisisFollowUp', max_tokens: 1000,
        system: withLanguage('Triage follow-up analyst. Warm, honest, pattern-aware. Return ONLY valid JSON.', userLanguage)
      });
      return res.json(parsed);
    }

    // ─── DELEGATE (draft a handoff message) ───
    if (action === 'delegate') {
      const { task, delegateTo, context, tone, userLanguage } = req.body;
      if (!task?.trim()) return res.status(400).json({ error: 'Which task?' });

      const prompt = withLanguage(`Write a clear, kind handoff message for delegating this task.

TASK: "${task.trim()}"
DELEGATE TO: ${delegateTo || 'someone else (general)'}
CONTEXT: ${context || 'None provided'}
TONE: ${tone || 'professional but warm'}

RULES:
- Be clear about what needs to happen — the recipient shouldn't have to guess
- Include any deadlines or constraints
- Make it easy to say yes — don't dump without context
- Keep it short — 3-5 sentences max
- Don't be apologetic about delegating — it's good management, not weakness

Return ONLY valid JSON:
{
  "message": "The handoff message — ready to copy/paste",
  "subject_line": "Email subject line if it's an email",
  "what_to_include": "Any attachments, links, or context they should send along",
  "follow_up_note": "When/how to follow up"
}`, userLanguage);

      const parsed = await callClaudeWithRetry(prompt, {
        model: 'claude-sonnet-4-6',
        label: 'CrisisDelegate', max_tokens: 800,
        system: withLanguage('Delegation messaging expert. Clear, kind, efficient. Return ONLY valid JSON.', userLanguage)
      });
      return res.json(parsed);
    }

    // ─── PATTERN (analyze 3+ sessions for recurring themes) ───
    if (action === 'pattern') {
      const { sessions, userLanguage } = req.body;
      if (!sessions?.length || sessions.length < 3) return res.status(400).json({ error: 'Need at least 3 past sessions.' });

      const sessionList = sessions.slice(0, 15).map((s, i) =>
        `${i + 1}. ${s.date}: ${s.taskCount} tasks, ${s.actuallyUrgent} urgent, emotional: ${s.emotional || '?'}, timeframe: ${s.timeframe || '?'}${s.followUp ? `, follow-up: ${s.followUp}` : ''}`
      ).join('\n');

      const prompt = withLanguage(`Analyze this person's crisis history for patterns. Be insightful, not judgmental.

CRISIS SESSIONS (most recent first):
${sessionList}

Look for:
- Frequency: How often are they in "crisis mode"? Is it escalating?
- Urgency calibration: Do they consistently overrate or underrate urgency?
- Recurring task types: Always work? Always personal? Same category?
- Emotional patterns: Always panicking? Always frozen? Same triggers?
- Day/timing patterns: Always Mondays? Always end of month?
- Improvement: Are they getting better at triage over time?

Return ONLY valid JSON:
{
  "pattern_summary": "2-3 sentences — the big picture of their crisis patterns",
  "frequency_insight": "How often they're hitting crisis mode and whether that's changing",
  "urgency_calibration": "Do they overrate, underrate, or accurately rate urgency? With evidence.",
  "recurring_themes": ["Theme 1: description", "Theme 2: description"],
  "emotional_pattern": "Their typical emotional state during crises and any shifts",
  "biggest_insight": "The ONE thing that would help them most — specific and actionable",
  "improvement_noted": true/false,
  "improvement_detail": "If yes: what's gotten better. If no: what's stuck.",
  "encouragement": "Warm note — using this tool IS progress"
}`, userLanguage);

      const parsed = await callClaudeWithRetry(prompt, {
        model: 'claude-sonnet-4-6',
        label: 'CrisisPattern', max_tokens: 1500,
        system: withLanguage('Crisis pattern analyst. Insightful, warm, not judgmental. Find the patterns humans can\'t see in their own behavior. Return ONLY valid JSON.', userLanguage)
      });
      return res.json(parsed);
    }

    // ═══════════════════════════════════════════
    // v3 NEW ROUTES
    // ═══════════════════════════════════════════

    // ─── TIME-BLOCK (build concrete schedule from triage results) ───
    if (action === 'time-block') {
      const { priorities, hours_available, energy_level, start_time, timeframe, voice, userLanguage } = req.body;
      if (!priorities?.length) return res.status(400).json({ error: 'Need prioritized tasks.' });

      const taskLines = priorities.map((p, i) =>
        `${i + 1}. [${(p.actual_urgency || 'medium').toUpperCase()}] "${p.task}"${p.do_this ? ` → First step: ${p.do_this}` : ''}${p.deadline ? ` [Due: ${p.deadline}]` : ''}`
      ).join('\n');

      const voiceNote = voice ? `\nTONE: ${getVoiceInstruction(voice)}` : '';

      const prompt = withLanguage(`Build a concrete, minute-by-minute time-blocked schedule from these prioritized tasks.

PRIORITIZED TASKS:
${taskLines}

AVAILABLE TIME: ${hours_available || 'unknown'} hours
ENERGY LEVEL: ${energy_level || 'unknown'}
START TIME: ${start_time || 'now'}
TIMEFRAME MODE: ${timeframe || 'right_now'}
${voiceNote}

RULES:
- Build realistic time blocks — not just task order, but actual "9:00-9:30" blocks
- Include 5-10 minute breaks between blocks. Longer (15-20 min) breaks every 90 minutes.
- If energy is low: shorter work blocks (25 min), longer breaks
- If energy is wired/anxious: channel it — front-load the hardest task while energy is high, then gradually decrease intensity
- Critical tasks go first, but match task type to energy (creative tasks when fresh, admin when fading)
- If tasks exceed available hours, be honest: mark what fits and what gets deferred
- Each block should have a specific, concrete action — not vague goals
- Add a "done" block at the end with a permission-to-stop message

Return ONLY valid JSON:
{
  "schedule_summary": "1-2 sentences — 'Here's your next X hours, mapped out.'",
  "start_time": "formatted start time, e.g. '9:00 AM'",
  "end_time": "when they'll be done if they follow this",
  "total_work_time": "actual work minutes (excluding breaks)",
  "total_break_time": "total break minutes",
  "blocks": [
    {
      "start": "9:00 AM",
      "end": "9:30 AM",
      "duration_minutes": 30,
      "type": "work|break|transition",
      "task": "Specific task or break activity",
      "urgency": "critical|important|medium|low|optional|break",
      "energy_note": "Brief note like 'You're freshest now — tackle the hard one' or 'Refill water, stretch' for breaks",
      "concrete_action": "The EXACT first thing to do when this block starts — e.g. 'Open email, click reply on boss's Thursday message'"
    }
  ],
  "overflow": ["Tasks that didn't fit in available time — with brief note on when to do them"],
  "flexibility_note": "Brief note: 'If something takes longer, shift everything — don't skip breaks'"
}`, userLanguage);

      const parsed = await callClaudeWithRetry(prompt, {
        model: 'claude-sonnet-4-6',
        label: 'CrisisTimeBlock', max_tokens: 3000,
        system: withLanguage('Time management expert who builds realistic, humane schedules. You know people underestimate task duration by 50%, so you pad accordingly. Return ONLY valid JSON.', userLanguage)
      });
      return res.json(parsed);
    }

    // ─── JUST ONE THING (panic mode — the single most important action) ───
    if (action === 'just-one-thing') {
      const { tasks, energy_level, emotional_state, voice, userLanguage } = req.body;
      if (!tasks?.length) return res.status(400).json({ error: 'Add at least one task.' });

      const taskList = tasks.map((t, i) => {
        let line = `${i + 1}. "${typeof t === 'string' ? t : t.task}"`;
        if (t.deadline) line += ` [Deadline: ${t.deadline}]`;
        if (t.who_waiting) line += ` [Who's waiting: ${t.who_waiting}]`;
        return line;
      }).join('\n');

      const voiceNote = voice ? `\nTONE: ${getVoiceInstruction(voice)}` : '';

      const prompt = withLanguage(`This person is overwhelmed and can't process a full triage. They need ONE THING. Just one.

EVERYTHING ON THEIR PLATE:
${taskList}

ENERGY: ${energy_level || 'unknown'}
EMOTIONAL STATE: ${emotional_state || 'unknown'}
${voiceNote}

RULES:
- Pick the ONE task that matters most right now. Not the easiest — the most important.
- If they're completely depleted, the one thing might be "rest for 20 minutes, then do X."
- Give them the EXACT first physical action. Not "work on the report" but "open the document and write the first sentence."
- Everything else can wait. Tell them why.
- This should feel like someone taking them by the shoulders and saying "Just do this."
- Keep it SHORT. They can't process paragraphs right now.

Return ONLY valid JSON:
{
  "the_one_thing": "The single task. Clear and specific.",
  "first_physical_action": "The EXACT thing to do with their hands right now. 'Pick up your phone and dial...' or 'Open your laptop and click...'",
  "time_estimate": "How long this one thing will take — be honest",
  "why_this_one": "One sentence: why THIS task, not the others",
  "everything_else": "One sentence giving permission to ignore everything else for now",
  "after_this": "What to do after — either 'come back for a full triage' or 'rest' or the next single action",
  "grounding_word": "A single word or very short phrase of encouragement — 'You've got this.' or 'One step.' or 'Start here.'"
}`, userLanguage);

      const parsed = await callClaudeWithRetry(prompt, {
        model: 'claude-sonnet-4-6',
        label: 'CrisisOneAction', max_tokens: 800,
        system: withLanguage('Crisis de-escalation specialist. When someone is paralyzed, you cut through the noise and give them one clear action. Minimal words, maximum clarity. Return ONLY valid JSON.', userLanguage)
      });
      return res.json(parsed);
    }

    // ─── SPLIT TASK (break compound tasks into sub-tasks) ───
    if (action === 'split-task') {
      const { task, context, energy_level, userLanguage } = req.body;
      if (!task?.trim()) return res.status(400).json({ error: 'Which task?' });

      const prompt = withLanguage(`This task is actually multiple tasks hiding in a trench coat. Break it down into concrete, individually-completable sub-tasks.

THE COMPOUND TASK: "${task.trim()}"
ADDITIONAL CONTEXT: ${context || 'None'}
ENERGY LEVEL: ${energy_level || 'unknown'}

RULES:
- Each sub-task should be a single, clear action that takes 5-45 minutes
- Order them logically — what needs to happen first?
- If some sub-tasks depend on others, note it
- Assign urgency to each sub-task independently — not everything in a "big task" is equally urgent
- If energy is low, suggest which sub-tasks could be done with minimal effort
- Be specific. "Handle the apartment" → "Call landlord about leak", "Pay rent online", "Schedule cleaning for Saturday"
- 3-8 sub-tasks is the sweet spot. If more than 8, some should probably be separate projects.

Return ONLY valid JSON:
{
  "original_task": "The task as they described it",
  "diagnosis": "Why this felt overwhelming — 'This is actually 5 different tasks spanning 3 days'",
  "sub_tasks": [
    {
      "task": "Clear, specific sub-task",
      "time_estimate": "~15 min|~30 min|~1 hr",
      "urgency": "critical|important|medium|low",
      "effort_level": "minimal|moderate|significant",
      "depends_on": null or "sub-task number that must be done first",
      "note": "Optional — any context that helps"
    }
  ],
  "quick_wins": ["Sub-task numbers that are easy wins — do these first for momentum"],
  "can_delegate": ["Sub-task numbers someone else could handle"],
  "total_time_estimate": "Realistic total time for all sub-tasks"
}`, userLanguage);

      const parsed = await callClaudeWithRetry(prompt, {
        model: 'claude-sonnet-4-6',
        label: 'CrisisTaskSplit', max_tokens: 1500,
        system: withLanguage('Task decomposition expert. You see the hidden tasks inside vague to-dos. Specific, actionable, honest time estimates. Return ONLY valid JSON.', userLanguage)
      });
      return res.json(parsed);
    }

    // ─── ACCOUNTABILITY SNAPSHOT (shareable plan summary) ───
    if (action === 'accountability-snapshot') {
      const { mustDos, deferrals, timeframe, emotional_state, recipientType, voice, userLanguage } = req.body;
      if (!mustDos?.length) return res.status(400).json({ error: 'Need tasks to share.' });

      const mustDoList = mustDos.map((t, i) => `${i + 1}. ${typeof t === 'string' ? t : t.task}`).join('\n');
      const deferralList = (deferrals || []).join('\n');
      const voiceNote = voice ? `\nTONE: ${getVoiceInstruction(voice)}` : '';

      const prompt = withLanguage(`Create a shareable accountability message. This person wants to tell someone their plan for the day/week.

WHAT THEY'RE TACKLING:
${mustDoList}

WHAT THEY'RE INTENTIONALLY DEFERRING:
${deferralList || 'Nothing specified'}

TIMEFRAME: ${timeframe || 'today'}
HOW THEY'RE FEELING: ${emotional_state || 'not specified'}
RECIPIENT TYPE: ${recipientType || 'friend or partner'}
${voiceNote}

RULES:
- Make it feel confident, not apologetic. They're making a plan, not confessing.
- Include what they're doing AND what they're intentionally NOT doing — both are decisions.
- Keep it natural — this should read like a text message, not a corporate memo.
- If the recipient is a partner: warmer, more personal
- If the recipient is a coworker: more professional, focused on deliverables
- If the recipient is a friend: casual, honest
- Include a subtle "you can check in on me" invitation — accountability works better with check-ins
- Short — 4-8 sentences max

Return ONLY valid JSON:
{
  "message": "The shareable message — ready to send",
  "format_hint": "text|email|slack — suggested format",
  "check_in_time": "Suggested time for the recipient to check in — e.g. 'around 3pm' or 'end of day'",
  "tone_note": "Brief note on the tone — 'Confident and clear' or 'Honest but hopeful'"
}`, userLanguage);

      const parsed = await callClaudeWithRetry(prompt, {
        model: 'claude-sonnet-4-6',
        label: 'CrisisAccountability', max_tokens: 800,
        system: withLanguage('Accountability messaging expert. You draft clear, confident plans that invite support without sounding needy. Return ONLY valid JSON.', userLanguage)
      });
      return res.json(parsed);
    }

    // ─── ROLLING CRISIS UPDATE (re-triage within persistent multi-week plan) ───
    if (action === 'rolling-crisis-update') {
      const { currentPlan, completedTasks, newTasks, energy_level, emotional_state,
              weekNumber, userLanguage } = req.body;
      if (!currentPlan) return res.status(400).json({ error: 'Need existing plan.' });

      const completedList = (completedTasks || []).map(t => `✓ "${t}"`).join('\n');
      const newTaskList = (newTasks || []).map((t, i) => `NEW ${i + 1}. "${t.task}"${t.deadline ? ` [Deadline: ${t.deadline}]` : ''}`).join('\n');

      const planSummary = (currentPlan.multi_week_plan || []).map(w => {
        const mustDos = (w.must_dos || []).join(', ');
        const delegates = (w.delegate || []).join(', ');
        return `${w.week_label} [Focus: ${w.focus || '?'}]: Must-dos: ${mustDos || 'none'}, Delegate: ${delegates || 'none'}`;
      }).join('\n');

      const prompt = withLanguage(`Update an ongoing multi-week crisis plan. The person is checking in for a mid-period update.

CURRENT MULTI-WEEK PLAN:
${planSummary}

WHAT'S BEEN COMPLETED SINCE LAST CHECK:
${completedList || 'Nothing reported'}

NEW TASKS ADDED:
${newTaskList || 'None'}

CURRENT WEEK: ${weekNumber || '?'}
ENERGY: ${energy_level || 'unknown'}
EMOTIONAL STATE: ${emotional_state || 'unknown'}

RULES:
- Acknowledge progress first — what they've completed matters.
- Re-slot remaining tasks + any new ones across remaining weeks.
- If the plan is falling behind, be honest but kind about it.
- If new tasks make the plan unsustainable, flag it.
- Don't just repeat the old plan — this should feel like a fresh assessment.
- Adjust the remaining weeks based on what's changed.

Return ONLY valid JSON:
{
  "progress_acknowledgment": "Warm 1-2 sentences on what they've accomplished",
  "plan_status": "on_track|slightly_behind|significantly_behind|ahead",
  "status_note": "Brief honest assessment of where things stand",
  "updated_weeks": [
    {
      "week_label": "Week N",
      "focus": "Updated focus area",
      "must_dos": ["remaining + new critical tasks for this week"],
      "delegate": ["tasks to hand off"],
      "delete": ["tasks that should be dropped given new context"],
      "self_care": "Specific self-care for this week"
    }
  ],
  "new_tasks_assessment": "How the new tasks affect the overall plan — 'These fit fine' or 'This changes things significantly'",
  "sustainability_update": "Updated sustainability check — are they pacing okay?",
  "next_check_in": "When they should check in next — 'End of this week' or 'Wednesday'"
}`, userLanguage);

      const parsed = await callClaudeWithRetry(prompt, {
        model: 'claude-sonnet-4-6',
        label: 'CrisisRollingUpdate', max_tokens: 2500,
        system: withLanguage(SYSTEM_PROMPT + '\nYou are updating an ongoing crisis management plan. Be honest about progress while maintaining hope.', userLanguage)
      });
      return res.json(parsed);
    }

    // ─── DASHBOARD INSIGHTS (AI-powered stats summary from journal) ───
    if (action === 'dashboard-insights') {
      const { sessions, userLanguage } = req.body;
      if (!sessions?.length) return res.status(400).json({ error: 'Need session data.' });

      const sessionList = sessions.slice(0, 20).map((s, i) =>
        `${i + 1}. ${s.date}: ${s.taskCount} tasks, ${s.actuallyUrgent} urgent, canWait: ${s.canWait || '?'}, emotional: ${s.emotional || '?'}, timeframe: ${s.timeframe || '?'}${s.followUp ? `, follow-up: ${s.followUp}` : ''}`
      ).join('\n');

      const prompt = withLanguage(`Generate dashboard insights from this person's crisis triage history.

SESSIONS (${sessions.length} total, showing up to 20):
${sessionList}

Calculate and summarize:
- Total tasks triaged
- Average tasks per session
- Percentage that turned out to be anxiety-driven vs genuinely urgent
- Most common emotional state
- Most common timeframe used
- Trend: are crises getting more or less frequent?
- Trend: is urgency calibration improving?

Return ONLY valid JSON:
{
  "total_sessions": ${sessions.length},
  "total_tasks_triaged": "estimated total",
  "avg_tasks_per_session": "number",
  "urgency_accuracy": "percentage — how often their 'urgent' was actually urgent (estimate from data)",
  "anxiety_driven_pct": "estimated percentage of tasks that were anxiety, not reality",
  "most_common_emotion": "the emotional state they most often arrive in",
  "most_common_timeframe": "right_now|this_week|few_weeks",
  "frequency_trend": "increasing|stable|decreasing",
  "calibration_trend": "improving|stable|declining",
  "headline_insight": "One powerful sentence summarizing their journey — e.g., 'You've triaged 47 tasks across 8 sessions, and you're getting better at telling anxiety from reality.'",
  "encouragement": "Brief warm note"
}`, userLanguage);

      const parsed = await callClaudeWithRetry(prompt, {
        model: 'claude-sonnet-4-6',
        label: 'CrisisDashboard', max_tokens: 1000,
        system: withLanguage('Data analyst who turns crisis triage history into encouraging, actionable insights. Return ONLY valid JSON.', userLanguage)
      });
      return res.json(parsed);
    }

    return res.status(400).json({ error: 'Invalid action. Use: generate, quick-dump, re-triage, follow-up, delegate, pattern, time-block, just-one-thing, split-task, accountability-snapshot, rolling-crisis-update, dashboard-insights' });
  } catch (error) {
    console.error('[CrisisPrioritizer]', error.message);
    res.status(500).json({ error: error.message || 'Failed to analyze tasks.' });
  }
});

module.exports = router;
