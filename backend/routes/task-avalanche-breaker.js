const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');
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
  repaired = repaired.replace(/"([^"]*?)"/g, (match, content) => {
    const fixed = content.replace(/(?<!\\)"/g, '\\"');
    return `"${fixed}"`;
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
  console.log('✅ Task Avalanche Breaker V2 endpoint called');

  try {
    const {
      project, overwhelmReasons, availableTime,
      energyLevel, adaptiveMode, existingHabit, userLanguage
    } = req.body;

    console.log('📝 Request:', { projectLength: project?.length, energy: energyLevel });

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
    else taskCount = { min: 12, max: 20 };

    let taskProfile;
    if (energy <= 3) {
      taskProfile = { maxDuration: '2 minutes', type: 'PURE PHYSICAL only - no thinking, no decisions', complexity: 'absurdly simple' };
    } else if (energy <= 6) {
      taskProfile = { maxDuration: '5 minutes', type: 'Physical tasks + light mental work okay', complexity: 'straightforward' };
    } else {
      taskProfile = { maxDuration: '10 minutes', type: 'Complex tasks okay - thinking, planning, organizing', complexity: 'can be challenging' };
    }

    const prompt = `You are breaking down an overwhelming project into micro-tasks.

PROJECT: ${project}
AVAILABLE TIME: ${time} minutes (this session)
ENERGY LEVEL: ${energy}/10
OVERWHELM REASONS: ${reasonsText}

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

Return this JSON structure:
{
  "project_breakdown": {
    "total_micro_tasks": number,
    "estimated_total_time": "X minutes",
    "complexity": "${taskProfile.complexity}",
    "time_budget": "${time} minutes",
    "energy_level": "${energy}/10"
  },
  "micro_tasks": [
    {
      "task_id": 1,
      "task": "description",
      "estimated_time": "30 seconds",
      "energy_required": "low",
      "dependencies": [],
      "completion_criteria": "Done when...",
      "if_stuck": "Try this instead",
      "momentum_builder": true
    }
  ],
  "anti_paralysis_strategies": {
    "if_cant_start": "Do ONLY task 1. That's enough.",
    "if_decision_paralysis": "Pick first option, change later okay",
    "permission_to_stop": "Stop after any task. Progress is progress."
  },
  "momentum_checkpoints": [
    { "after_task": 5, "celebration": "You started! Hardest part done!", "points_earned": 50 }
  ]
}

Return ONLY valid JSON.`;

    console.log('🤖 Calling Claude API...');

    const systemPrompt = withLanguage(
      'You are an expert task decomposition coach for people with executive dysfunction. Return only valid JSON.',
      userLanguage
    );

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }]
    });

    console.log('✅ Claude API responded');

    const textContent = message.content.find(item => item.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(textContent);

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
      console.log('✅ JSON parsed successfully');
    } catch (parseError) {
      console.error('❌ Parse failed, attempting repair:', parseError.message);
      const repaired = repairJSON(cleaned);
      try {
        parsed = JSON.parse(repaired);
        console.log('✅ JSON parsed after repair');
      } catch (retryError) {
        console.log('🔧 Attempting manual task extraction...');
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
          momentum_checkpoints: [{ after_task: 5, celebration: "You started! Hardest part done!", points_earned: 50 }]
        };
        console.log(`✅ Manually reconstructed with ${tasks.length} tasks`);
      }
    }

    // Validate and enhance
    if (!parsed.micro_tasks || !Array.isArray(parsed.micro_tasks) || parsed.micro_tasks.length === 0) {
      return res.status(500).json({ error: 'No valid tasks found. Please try again.' });
    }

    if (!parsed.project_breakdown) parsed.project_breakdown = {};
    parsed.project_breakdown.total_micro_tasks = parsed.micro_tasks.length;
    parsed.project_breakdown.total_points_possible = parsed.micro_tasks.length * 10;

    if (!parsed.project_breakdown.estimated_total_time) {
      const totalMinutes = parsed.micro_tasks.reduce((sum, task) => sum + (parseInt(task.estimated_time) || 2), 0);
      const hours = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      parsed.project_breakdown.estimated_total_time = hours > 0
        ? `${hours} hour${hours > 1 ? 's' : ''} ${mins} minutes`
        : `${mins} minutes`;
    }

    // Ensure all tasks have required fields
    parsed.micro_tasks = parsed.micro_tasks.map((task, idx) => ({
      task_id: task.task_id || idx + 1,
      task: task.task || 'Complete this step',
      estimated_time: task.estimated_time || '2 minutes',
      energy_required: task.energy_required || 'low',
      dependencies: Array.isArray(task.dependencies) ? task.dependencies : [],
      why_this_first: task.why_this_first || '',
      completion_criteria: task.completion_criteria || 'Task is complete',
      if_stuck: task.if_stuck || 'Try an easier version',
      minimum_viable: task.minimum_viable || task.if_stuck || 'Do the smallest version',
      momentum_builder: task.momentum_builder !== undefined ? task.momentum_builder : idx < 5
    }));

    if (!parsed.anti_paralysis_strategies) {
      parsed.anti_paralysis_strategies = {
        if_cant_start: "Do ONLY task 1. That's enough.",
        permission_to_stop: "Stop after any task. Progress is progress."
      };
    }

    if (!parsed.momentum_checkpoints) {
      parsed.momentum_checkpoints = [{ after_task: 5, celebration: "You started! Hardest part done!", points_earned: 50 }];
    }

    console.log('✅ Final validation complete');
    console.log('📊 Breakdown:', { totalTasks: parsed.micro_tasks.length, points: parsed.project_breakdown.total_points_possible });

    res.json(parsed);

  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({ error: 'Failed to break down project. Please try again or simplify your project description.' });
  }
});

module.exports = router;
