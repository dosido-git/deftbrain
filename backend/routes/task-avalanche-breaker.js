const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage, withLocaleContext } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

// ── JSON repair helpers (fallback for complex responses) ──

function repairJSON(str) {
  let repaired = str;
  repaired = repaired.replace(/,\s*}/g, '}');
  repaired = repaired.replace(/,\s*]/g, ']');
  repaired = repaired.replace(/[\x00-\x1F\x7F]/g, (ch) => {
    if (ch === '\n' || ch === '\r' || ch === '\t') return ch;
    return ' ';
  });

  const opens = (repaired.match(/{/g) || []).length;
  const closes = (repaired.match(/}/g) || []).length;
  if (opens > closes) repaired += '}'.repeat(opens - closes);

  const openBrackets = (repaired.match(/\[/g) || []).length;
  const closeBrackets = (repaired.match(/\]/g) || []).length;
  if (openBrackets > closeBrackets) {
    const lastBrace = repaired.lastIndexOf('}');
    if (lastBrace > 0) {
      const missing = ']'.repeat(openBrackets - closeBrackets);
      repaired = repaired.substring(0, lastBrace) + missing + repaired.substring(lastBrace);
    } else {
      repaired += ']'.repeat(openBrackets - closeBrackets);
    }
  }
  return repaired;
}

function manuallyParseTasks(jsonStr) {
  const tasks = [];
  const taskPattern = /\{\s*"task_id"\s*:\s*(\d+)\s*,\s*"task"\s*:\s*"([^"]*?)"/g;
  let match;
  while ((match = taskPattern.exec(jsonStr)) !== null) {
    const taskId = parseInt(match[1]);
    const taskText = match[2];
    const start = match.index;
    const end = jsonStr.indexOf('}', start);
    const taskChunk = end > start ? jsonStr.substring(start, end + 1) : '';

    const timeMatch = taskChunk.match(/"estimated_time"\s*:\s*"([^"]*?)"/);
    const energyMatch = taskChunk.match(/"energy_required"\s*:\s*"([^"]*?)"/);
    const criteriaMatch = taskChunk.match(/"completion_criteria"\s*:\s*"([^"]*?)"/);
    const stuckMatch = taskChunk.match(/"if_stuck"\s*:\s*"([^"]*?)"/);

    tasks.push({
      task_id: taskId,
      task: taskText,
      estimated_time: timeMatch ? timeMatch[1] : '2 minutes',
      energy_required: energyMatch ? energyMatch[1] : 'low',
      dependencies: [],
      completion_criteria: criteriaMatch ? criteriaMatch[1] : 'Task is complete',
      if_stuck: stuckMatch ? stuckMatch[1] : 'Try an easier version',
      momentum_builder: taskId <= 5
    });
  }
  return tasks;
}

router.post('/task-avalanche-breaker', rateLimit(DEFAULT_LIMITS), async (req, res) => {

  try {
    const {
      project, overwhelmReasons, availableTime,
      energyLevel, userLanguage, existingHabit,
      adaptiveMode, currentTasks
    } = req.body;

    if (!project || project.trim().length < 10) {
      return res.status(400).json({ error: 'Please describe your project (at least 10 characters)' });
    }

    const reasonsText = overwhelmReasons && overwhelmReasons.length > 0
      ? overwhelmReasons.map(r => r.replace(/_/g, ' ')).join(', ')
      : 'general overwhelm';

    const time = parseInt(availableTime) || 5;
    const energy = energyLevel || 5;

    // Calculate intelligent task parameters based on BOTH time and energy
    let taskCount;
    if (time <= 5) taskCount = { min: 2, max: 4 };
    else if (time <= 10) taskCount = { min: 5, max: 8 };
    else if (time <= 15) taskCount = { min: 8, max: 12 };
    else taskCount = { min: 12, max: 15 };

    let taskProfile;
    if (energy <= 3) {
      taskProfile = { maxDuration: '2 minutes', type: 'PURE PHYSICAL only - no thinking, no decisions', complexity: 'absurdly simple' };
    } else if (energy <= 6) {
      taskProfile = { maxDuration: '5 minutes', type: 'Physical tasks + light mental work okay', complexity: 'straightforward' };
    } else {
      taskProfile = { maxDuration: '10 minutes', type: 'Complex tasks okay - thinking, planning, organizing', complexity: 'can be challenging' };
    }

    const hasHabit = typeof existingHabit === 'string' && existingHabit.trim().length > 0;
    const habitAnchor = hasHabit ? existingHabit.trim().replace(/"/g, "'") : '';

    const modeLines = {
      exhausted: '\nMODE (exhausted): The user is running on empty — make every task nearly effortless and front-load trivially easy physical wins.',
      quick: '\nMODE (quick win): The user wants visible progress fast — prioritize tasks that produce an immediate, tangible result.',
      anxiety: '\nMODE (high anxiety): The project feels emotionally heavy — use calm, reassuring task wording and make the first tasks feel safe and low-stakes.'
    };
    const modeLine = modeLines[adaptiveMode] || '';

    const isReorder = adaptiveMode === 'reorder' && Array.isArray(currentTasks) && currentTasks.length > 0;

    let prompt;
    if (isReorder) {
      const taskListJson = JSON.stringify(currentTasks.map(mt => ({
        task_id: mt.task_id,
        task: mt.task,
        estimated_time: mt.estimated_time,
        energy_required: mt.energy_required,
        dependencies: Array.isArray(mt.dependencies) ? mt.dependencies : [],
        completion_criteria: mt.completion_criteria,
        if_stuck: mt.if_stuck,
        momentum_builder: mt.momentum_builder
      })), null, 2);

      prompt = `You are re-sequencing an existing micro-task list for a user's new energy level.

USER'S NEW ENERGY LEVEL: ${energy}/10

CURRENT TASKS:
${taskListJson}

Re-sequence these EXACT tasks (do not invent, remove, or rename any task) for the user's new energy level.
Put the tasks best suited to ${energy <= 3 ? 'very low' : energy <= 6 ? 'medium' : 'high'} energy first, but never place a task before one it depends on.
Return the same task objects re-ordered, with "task_id" renumbered 1..N in the new order. Keep the "task" text and every other field value EXACTLY as given.
Keep energy_required values in English exactly as listed (low, medium, or high).

Return this JSON structure:
{
  "micro_tasks": [
    { ...the same task objects as the input, re-ordered, task_id renumbered 1..N... }
  ]
}

Return ONLY valid JSON.`;
    } else {
      prompt = `You are breaking down an overwhelming project into micro-tasks.

PROJECT: ${project}
AVAILABLE TIME: ${time} minutes (this session)
ENERGY LEVEL: ${energy}/10
OVERWHELM REASONS: ${reasonsText}${modeLine}
${hasHabit ? `HABIT STACKING: The user already does this habit: "${habitAnchor}". On task 1 ONLY, include a "habit_stack" field explaining how to anchor task 1 to that habit.` : ''}
Generate ${taskCount.min}-${taskCount.max} tasks that fit within ${time} minutes.
Max task duration: ${taskProfile.maxDuration}
Task type: ${taskProfile.type}
Complexity: ${taskProfile.complexity}

${energy <= 3 ? 'EVERY task must be 30 seconds to 2 minutes MAX. ZERO mental work - pure physical actions only.' : ''}
${energy <= 6 && energy > 3 ? 'Tasks can be 1-5 minutes. Mix of physical + light mental work okay.' : ''}
${energy > 6 ? 'Tasks can be up to 10 minutes. Complex mental work is fine.' : ''}

MANDATORY RULES:
1. First 3-5 tasks MUST be extremely easy (30 sec - 2 min) regardless of energy
2. Tasks must total approximately ${time} minutes
3. Respect energy level
4. Keep energy_required values in English exactly as listed (low, medium, or high)
5. Include "why_this_first" on the first 1-3 tasks only; omit the field on later tasks

Return this JSON structure:
{
  "project_breakdown": {
    "total_micro_tasks": number,
    "estimated_total_time": "X minutes"
  },
  "micro_tasks": [
    {
      "task_id": 1,
      "task": "description — one sentence",
      "estimated_time": "30 seconds",
      "energy_required": "low|medium|high",
      "dependencies": [],
      "why_this_first": "why this task comes first — one sentence",${hasHabit ? `\n      "habit_stack": "how to anchor task 1 to '${habitAnchor}' — one sentence",` : ''}
      "completion_criteria": "Done when... — one sentence",
      "if_stuck": "Try this instead — one sentence",
      "momentum_builder": true
    }
  ],
  "anti_paralysis_strategies": {
    "if_cant_start": "Do ONLY task 1. That's enough. — one sentence",
    "if_decision_paralysis": "Pick first option, change later okay — one sentence",
    "permission_to_stop": "Stop after any task. Progress is progress. — one sentence"
  },
  "momentum_checkpoints": [
    { "after_task": 5, "celebration": "You started! Hardest part done! — one sentence" }
  ]
}

Return ONLY valid JSON.`;
    }

    const systemPrompt = withLanguage(
      'You are an expert task decomposition coach for people with executive dysfunction. Return only valid JSON.',
      userLanguage
    ) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);

    let textContent = '';
    let stopReason = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const message = await anthropic.messages.create({
          model: MODELS.SMART,
          max_tokens: 5000,
          system: systemPrompt,
          messages: [{ role: 'user', content: prompt }]
        });
        textContent = message.content.find(item => item.type === 'text')?.text || '';
        stopReason = message.stop_reason;
        break;
      } catch (retryErr) {
        if (attempt === 3) throw retryErr;
        await new Promise(r => setTimeout(r, 1000 * attempt));
      }
    }

    // Fail fast on truncation — a truncated response can never parse into valid JSON
    if (stopReason === 'max_tokens') {
      console.error('❌ Response truncated at max_tokens');
      return res.status(500).json({ error: 'The breakdown was cut off. Please try again with a simpler project description.' });
    }

    const cleaned = cleanJsonResponse(textContent);

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseError) {
      console.error('❌ Parse failed, attempting repair:', parseError.message);
      const repaired = repairJSON(cleaned);
      try {
        parsed = JSON.parse(repaired);
      } catch (retryError) {
        const tasks = manuallyParseTasks(repaired);
        if (tasks.length === 0) {
          return res.status(500).json({ error: 'Could not extract any tasks. Please try a simpler project description.' });
        }
        parsed = {
          project_breakdown: {
            total_micro_tasks: tasks.length,
            estimated_total_time: `${Math.ceil(tasks.length * 3)} minutes`,
            complexity: 'medium',
            total_points_possible: tasks.length * 10
          },
          micro_tasks: tasks,
          anti_paralysis_strategies: {
            if_cant_start: "Do ONLY task 1. That's enough.",
            if_decision_paralysis: "Pick first option, change later okay",
            permission_to_stop: "Stop after any task. Progress is progress."
          },
          momentum_checkpoints: [{ after_task: 5, celebration: "You started! Hardest part done!" }]
        };
      }
    }

    // Validate and enhance
    if (!parsed.micro_tasks || !Array.isArray(parsed.micro_tasks) || parsed.micro_tasks.length === 0) {
      return res.status(500).json({ error: 'No valid tasks found. Please try again.' });
    }

    if (!parsed.project_breakdown) parsed.project_breakdown = {};
    parsed.project_breakdown.total_micro_tasks = parsed.micro_tasks.length;
    parsed.project_breakdown.total_points_possible = parsed.micro_tasks.length * 10;

    // Always recompute total time server-side from per-task values (unit-aware, mirrors frontend parseTimeToSeconds)
    const parseTaskMinutes = (timeStr) => {
      if (!timeStr) return 2;
      const lower = String(timeStr).toLowerCase();
      const num = parseInt(lower, 10) || 0;
      if (lower.includes('second')) return num / 60;
      if (lower.includes('hour')) return num * 60;
      if (lower.includes('minute') || lower.includes('min')) return num;
      return num || 2;
    };
    const totalMinutes = Math.max(1, Math.round(parsed.micro_tasks.reduce((sum, task) => sum + parseTaskMinutes(task.estimated_time), 0)));
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    parsed.project_breakdown.estimated_total_time = hours > 0
      ? `${hours} hour${hours > 1 ? 's' : ''} ${mins} minutes`
      : `${mins} minutes`;

    // Ensure all tasks have required fields
    parsed.micro_tasks = parsed.micro_tasks.map((task, idx) => ({
      task_id: task.task_id || idx + 1,
      task: task.task || 'Complete this step',
      estimated_time: task.estimated_time || '2 minutes',
      energy_required: task.energy_required || 'low',
      dependencies: Array.isArray(task.dependencies) ? task.dependencies : [],
      why_this_first: task.why_this_first || '',
      habit_stack: task.habit_stack || '',
      completion_criteria: task.completion_criteria || 'Task is complete',
      if_stuck: task.if_stuck || 'Try an easier version',
      momentum_builder: task.momentum_builder !== undefined ? task.momentum_builder : idx < 5
    }));

    if (!parsed.anti_paralysis_strategies) {
      parsed.anti_paralysis_strategies = {
        if_cant_start: "Do ONLY task 1. That's enough.",
        permission_to_stop: "Stop after any task. Progress is progress."
      };
    }

    if (!parsed.momentum_checkpoints) {
      parsed.momentum_checkpoints = [{ after_task: 5, celebration: "You started! Hardest part done!" }];
    }

    res.json(parsed);

  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({ error: 'Failed to break down project. Please try again or simplify your project description.' });
  }
});

module.exports = router;
