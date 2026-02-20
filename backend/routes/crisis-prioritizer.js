const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse } = require('../lib/claude');

router.post('/crisis-prioritizer', async (req, res) => {
  console.log('✅ Crisis Prioritizer endpoint called');

  try {
    const {
      tasks,
      energy_level,
      hours_available,
      emotional_state,
      timeframe,
      userLanguage,
    } = req.body;

    if (!tasks || tasks.length === 0) {
      return res.status(400).json({ error: 'Please add at least one task' });
    }

    const mode = timeframe || 'right_now';

    console.log('📝 Request:', {
      taskCount: tasks.length,
      energy: energy_level,
      hours: hours_available,
      emotional: emotional_state,
      timeframe: mode,
    });

    // Build task descriptions with optional context
    const taskList = tasks.map(t => {
      let line = `- "${t.task}"`;
      if (t.deadline) line += ` [Deadline: ${t.deadline}]`;
      if (t.who_waiting) line += ` [Who's waiting: ${t.who_waiting}]`;
      return line;
    }).join('\n');

    // Contextual state info
    const stateLines = [];
    if (emotional_state) stateLines.push(`EMOTIONAL STATE: ${emotional_state.replace(/_/g, ' ')}`);
    if (energy_level) stateLines.push(`ENERGY LEVEL: ${energy_level.replace(/_/g, ' ')}`);
    if (hours_available) {
      if (mode === 'right_now') {
        stateLines.push(`TIME AVAILABLE: ${hours_available === 'unknown' ? 'Unknown' : hours_available + ' hours'}`);
      } else {
        stateLines.push(`DAILY CAPACITY: ${hours_available === 'unknown' ? 'Varies / unknown' : '~' + hours_available + ' hours/day'}`);
      }
    }
    const stateBlock = stateLines.length > 0 ? stateLines.join('\n') : 'No state info provided';

    // Shared preamble
    const sharedPreamble = `You are a crisis triage specialist who separates genuine urgency from anxiety-driven urgency. Your job is to be the calm, honest voice that tells someone what ACTUALLY needs to happen vs what their anxiety is inflating.

TASKS:
${taskList}

PERSON'S CURRENT STATE:
${stateBlock}

URGENCY LEVELS (be strict — most tasks are NOT critical):
- critical: Genuine imminent deadline, real consequences if missed (money lost, health risk, legal issue)
- important: Should happen soon, but won't cause real damage if delayed a day or two
- medium: Would be nice to do, but the world won't end
- low: Can absolutely wait with zero real consequences
- optional: Could be dropped entirely and nobody would notice

RULES:
- Most tasks are NOT critical. Be honest and strict.
- "I feel like I should" is NOT urgency. "Something irreversible happens" IS urgency.
- The grounding_message should be warm and specific to their emotional state, not generic.
- If ALL tasks genuinely are critical, flag overcommitment.`;

    // Timeframe-specific prompts
    let prompt;

    if (mode === 'right_now') {
      prompt = `${sharedPreamble}

TIMEFRAME: RIGHT NOW — Today's triage. What needs to happen in the next few hours.

If the person has very low energy or limited time, the plan should contain FEWER tasks.

OUTPUT (JSON only):
{
  "grounding_message": "Warm, specific message for someone in their emotional state. 1-3 sentences.",
  "reality_check": "Honest summary: 'Of your X tasks, only Y actually need to happen today...'",
  "tasks_analyzed": <number>,
  "actual_crisis_tasks": <number of critical + important>,
  "can_wait": <number of medium + low + optional>,
  "estimated_time": "realistic time for ONLY the must-do tasks, e.g. '~2.5 hours'",
  "todays_actual_must_dos": ["Task — brief reason it can't wait"],
  "anxiety_audit": {
    "anxiety_driven": [
      {"task": "the task", "why_it_feels_urgent": "the anxiety narrative", "reality": "what actually happens if it waits 24-48 hours"}
    ],
    "legitimately_urgent": [
      {"task": "the task", "why": "specific consequence with timeline"}
    ]
  },
  "objective_priorities": [
    {
      "rank": 1,
      "task": "task",
      "actual_urgency": "critical/important/medium/low/optional",
      "deadline": "specific or 'no hard deadline'",
      "consequence_if_missed": "what actually happens",
      "anxiety_vs_reality": "what anxiety says vs what's true",
      "do_this": "one concrete next action"
    }
  ],
  "guilt_free_deferrals": ["FULL SENTENCE with task name + specific reasoning + timeline. e.g. 'Your apartment does not need to be clean today. Nobody is coming over. It can wait until Saturday with zero consequences.' Each deferral MUST explain WHY it's safe to wait."],
  "energy_plan": "Realistic plan accounting for their energy/time. Include breaks. Be specific.",
  "overcommitment_warning": "Only if 4+ tasks are genuinely critical, otherwise null"
}`;
    } else if (mode === 'this_week') {
      prompt = `${sharedPreamble}

TIMEFRAME: THIS WEEK — Spread tasks across 7 days (Mon-Sun). Build a realistic day-by-day plan.

WEEKLY PLANNING RULES:
- Front-load critical items early in the week
- Account for energy tapering — don't overload any single day
- Leave at least one day lighter for catch-up or rest
- If they mentioned low energy, keep daily task counts LOW (2-3 per day max)
- Each day should have a theme or focus to reduce context-switching
- Include rest reminders — people in crisis forget to rest
- Consider task dependencies (what needs to happen before what?)
- The "daily capacity" they mentioned is a CEILING, not a target

OUTPUT (JSON only):
{
  "grounding_message": "Warm, specific message. 1-3 sentences.",
  "reality_check": "Honest summary: 'You have X tasks across the week. Here's the real picture...'",
  "tasks_analyzed": <number>,
  "actual_crisis_tasks": <number critical + important>,
  "can_wait": <number that can wait beyond this week>,
  "todays_actual_must_dos": ["The 1-3 things that genuinely must happen TODAY specifically"],
  "anxiety_audit": {
    "anxiety_driven": [
      {"task": "task", "why_it_feels_urgent": "anxiety narrative", "reality": "what happens if it waits"}
    ],
    "legitimately_urgent": [
      {"task": "task", "why": "specific consequence"}
    ]
  },
  "weekly_plan": [
    {
      "day_label": "Monday",
      "theme": "optional theme like 'Admin & calls' or 'Deep work' or 'Catch-up'",
      "energy_note": "brief note like 'Start of week — use highest energy for hardest task'",
      "tasks": [
        {"task": "specific task", "time_estimate": "~30 min", "urgency": "critical/important/medium/low"}
      ],
      "rest_reminder": "optional — e.g. 'Take a real lunch break. You've earned it.'"
    }
  ],
  "guilt_free_deferrals": ["FULL SENTENCE: task name + why it's safe to push to next week + what actually happens if you wait. e.g. 'The brochures can wait until next week — most buyers find listings online first, so there is no lost opportunity in a 7-day delay.'"],
  "energy_plan": "Overall week strategy: when to push, when to rest, how to pace.",
  "overcommitment_warning": "If they can't realistically do everything this week, say so honestly. Otherwise null",
  "objective_priorities": [
    {
      "rank": 1,
      "task": "task",
      "actual_urgency": "critical/important/medium/low/optional",
      "deadline": "specific or 'no hard deadline'",
      "consequence_if_missed": "what actually happens",
      "anxiety_vs_reality": "anxiety vs reality",
      "do_this": "concrete next action"
    }
  ]
}`;
    } else {
      // few_weeks
      prompt = `${sharedPreamble}

TIMEFRAME: NEXT FEW WEEKS — Build a 2-4 week plan. This is sustained crisis management, not a sprint.

MULTI-WEEK PLANNING RULES:
- Think in terms of WEEKS, not days — give weekly focus areas
- For each week: what are the must-dos, what can be delegated, what should be deleted entirely
- Sustainability is critical: someone running at crisis-pace for weeks will crash
- Schedule deliberate rest/recovery — not as an afterthought, but as a critical task
- Flag tasks that should be DELEGATED (with suggestions for who/how)
- Flag tasks that should be DELETED (dropped entirely — they're not worth the energy)
- Include a sustainability check: are they taking on more than one human can handle?
- Consider which tasks have real external deadlines vs self-imposed ones
- Front-load tasks with hard deadlines, push optional tasks to later weeks
- If the person is in a genuinely difficult life situation (grief, health crisis, job loss), be especially gentle about expectations

OUTPUT (JSON only):
{
  "grounding_message": "Warm, specific message acknowledging the sustained difficulty. 1-3 sentences.",
  "reality_check": "Honest big-picture summary. How much is actually on their plate vs how much feels like it is.",
  "tasks_analyzed": <number>,
  "actual_crisis_tasks": <number with real deadlines in the next few weeks>,
  "can_wait": <number that can wait beyond this period or be dropped>,
  "todays_actual_must_dos": ["The 1-2 things that genuinely must happen TODAY"],
  "anxiety_audit": {
    "anxiety_driven": [
      {"task": "task", "why_it_feels_urgent": "anxiety narrative", "reality": "what happens if it waits"}
    ],
    "legitimately_urgent": [
      {"task": "task", "why": "specific consequence"}
    ]
  },
  "multi_week_plan": [
    {
      "week_label": "Week 1 (This Week)",
      "focus": "Main focus area — e.g. 'Handle the two hard deadlines, delegate the rest'",
      "must_dos": ["task 1", "task 2"],
      "delegate": ["task to hand off — suggest to whom/how"],
      "delete": ["task to drop entirely — with brief reasoning"],
      "self_care": "Specific self-care task for this week — not generic, e.g. 'Take Wednesday evening completely off. No screens.'"
    }
  ],
  "guilt_free_deferrals": ["FULL SENTENCE: task name + why it genuinely does not need to happen in the next few weeks + consequence of waiting (i.e. none). e.g. 'Updating your resume can wait — you are not job-hunting right now and the information won't change. Revisit in a month if needed.'"],
  "sustainability_check": "Honest assessment: Is this workload sustainable? What needs to change? Are they running on borrowed energy? What happens if they don't slow down? Be specific and caring, not preachy.",
  "energy_plan": "How to pace across weeks. When to push, when to coast, when to completely rest.",
  "overcommitment_warning": "If the total load is unrealistic for one person, say so clearly. Otherwise null.",
  "objective_priorities": [
    {
      "rank": 1,
      "task": "task",
      "actual_urgency": "critical/important/medium/low/optional",
      "deadline": "specific or 'no hard deadline'",
      "consequence_if_missed": "what actually happens",
      "anxiety_vs_reality": "anxiety vs reality",
      "do_this": "concrete next action"
    }
  ]
}`;
    }

    prompt += `\n\nCRITICAL: Return ONLY valid JSON. No markdown, no explanation outside JSON. Be warm but ruthlessly honest.${userLanguage && userLanguage !== 'en' ? `\n\nIMPORTANT: Respond in ${userLanguage}.` : ''}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = message.content.find(item => item.type === 'text')?.text || '';
    const parsed = JSON.parse(cleanJsonResponse(textContent));

    // Validate essential fields
    if (!parsed.objective_priorities || !Array.isArray(parsed.objective_priorities)) {
      throw new Error('Invalid response structure: missing objective_priorities');
    }

    console.log('✅ Analysis complete:', {
      timeframe: mode,
      tasksAnalyzed: parsed.tasks_analyzed,
      actualCrisis: parsed.actual_crisis_tasks,
      canWait: parsed.can_wait,
      weeklyDays: parsed.weekly_plan?.length,
      multiWeeks: parsed.multi_week_plan?.length,
    });

    res.json(parsed);

  } catch (error) {
    console.error('❌ Crisis Prioritizer error:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({
      error: 'Failed to analyze tasks. Please try again.',
    });
  }
});

module.exports = router;
