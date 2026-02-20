const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

// ── JSON repair helpers (were missing, causing ReferenceError) ──

function repairJSON(str) {
  let repaired = str;
  
  // Remove trailing commas before } or ]
  repaired = repaired.replace(/,\s*}/g, '}');
  repaired = repaired.replace(/,\s*]/g, ']');
  
  // Remove control characters
  repaired = repaired.replace(/[\x00-\x1F\x7F]/g, (ch) => {
    if (ch === '\n' || ch === '\r' || ch === '\t') return ch;
    return ' ';
  });
  
  // Fix unescaped quotes inside strings (common Claude issue)
  // Replace single quotes used as apostrophes inside double-quoted strings
  repaired = repaired.replace(/"([^"]*?)"/g, (match, content) => {
    // Escape any unescaped inner quotes
    const fixed = content.replace(/(?<!\\)"/g, '\\"');
    return `"${fixed}"`;
  });
  
  // Try to close unclosed brackets/braces
  const opens = (repaired.match(/{/g) || []).length;
  const closes = (repaired.match(/}/g) || []).length;
  if (opens > closes) {
    repaired += '}'.repeat(opens - closes);
  }
  
  const openBrackets = (repaired.match(/\[/g) || []).length;
  const closeBrackets = (repaired.match(/\]/g) || []).length;
  if (openBrackets > closeBrackets) {
    // Find a good insertion point (before the last })
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
  
  // Try to extract individual task objects using regex
  const taskPattern = /\{\s*"task_id"\s*:\s*(\d+)\s*,\s*"task"\s*:\s*"([^"]*?)"/g;
  let match;
  
  while ((match = taskPattern.exec(jsonStr)) !== null) {
    const taskId = parseInt(match[1]);
    const taskText = match[2];
    
    // Try to extract more fields from the surrounding context
    const start = match.index;
    const end = jsonStr.indexOf('}', start);
    const taskChunk = end > start ? jsonStr.substring(start, end + 1) : '';
    
    let estimatedTime = '2 minutes';
    const timeMatch = taskChunk.match(/"estimated_time"\s*:\s*"([^"]*?)"/);
    if (timeMatch) estimatedTime = timeMatch[1];
    
    let energyRequired = 'low';
    const energyMatch = taskChunk.match(/"energy_required"\s*:\s*"([^"]*?)"/);
    if (energyMatch) energyRequired = energyMatch[1];
    
    let completionCriteria = 'Task is complete';
    const criteriaMatch = taskChunk.match(/"completion_criteria"\s*:\s*"([^"]*?)"/);
    if (criteriaMatch) completionCriteria = criteriaMatch[1];
    
    let ifStuck = 'Try an easier version';
    const stuckMatch = taskChunk.match(/"if_stuck"\s*:\s*"([^"]*?)"/);
    if (stuckMatch) ifStuck = stuckMatch[1];
    
    tasks.push({
      task_id: taskId,
      task: taskText,
      estimated_time: estimatedTime,
      energy_required: energyRequired,
      dependencies: [],
      completion_criteria: completionCriteria,
      if_stuck: ifStuck,
      momentum_builder: taskId <= 5
    });
  }
  
  return tasks;
}

router.post('/task-avalanche-breaker', async (req, res) => {
  console.log('✅ Task Avalanche Breaker V2 endpoint called');
  
  try {
    const { 
      project,
      overwhelmReasons,
      availableTime,
      energyLevel,
      adaptiveMode,
      existingHabit
    } = req.body;
    
    console.log('📝 Request:', { 
      projectLength: project?.length,
      energy: energyLevel
    });

    if (!project || project.trim().length < 10) {
      return res.status(400).json({ error: 'Please describe your project (at least 10 characters)' });
    }

    const reasonsText = overwhelmReasons && overwhelmReasons.length > 0 
      ? overwhelmReasons.map(r => r.replace(/_/g, ' ')).join(', ')
      : 'general overwhelm';

    // Calculate intelligent task parameters based on BOTH time and energy
    const getTaskParameters = (time, energy) => {
      // Determine task count based on available time
      let taskCount;
      if (time <= 5) taskCount = { min: 2, max: 4 };
      else if (time <= 10) taskCount = { min: 5, max: 8 };
      else if (time <= 15) taskCount = { min: 8, max: 12 };
      else taskCount = { min: 12, max: 20 };

      // Determine task characteristics based on energy
      let taskProfile;
      if (energy <= 3) {
        // Very low energy: Everything must be simple
        taskProfile = {
          maxDuration: '2 minutes',
          type: 'PURE PHYSICAL only - no thinking, no decisions',
          examples: 'open door, pick up one item, walk to room',
          complexity: 'absurdly simple'
        };
      } else if (energy <= 6) {
        // Medium energy: Mix of physical and light mental
        taskProfile = {
          maxDuration: '5 minutes',
          type: 'Physical tasks + light mental work okay',
          examples: 'sort items into piles, read labels, make simple decisions',
          complexity: 'straightforward'
        };
      } else {
        // High energy: Can handle complex tasks
        taskProfile = {
          maxDuration: '10 minutes',
          type: 'Complex tasks okay - thinking, planning, organizing',
          examples: 'categorize items, deep clean, research, write notes',
          complexity: 'can be challenging'
        };
      }

      // Calculate average task duration to fit time budget
      const avgDuration = Math.floor(time / ((taskCount.min + taskCount.max) / 2));
      
      return { taskCount, taskProfile, avgDuration, time, energy };
    };

    const params = getTaskParameters(parseInt(availableTime), energyLevel);

    // Intelligent prompt that uses BOTH time and energy
    const prompt = `You are breaking down an overwhelming project into micro-tasks.

PROJECT: ${project}
AVAILABLE TIME: ${params.time} minutes (this session)
ENERGY LEVEL: ${params.energy}/10
OVERWHELM REASONS: ${reasonsText}

CRITICAL: Generate ${params.taskCount.min}-${params.taskCount.max} tasks that fit within ${params.time} minutes.

TASK PARAMETERS (based on TIME + ENERGY):
- Task count: ${params.taskCount.min}-${params.taskCount.max} tasks
- Average task duration: ~${params.avgDuration} minutes (adjust ±50%)
- Max task duration: ${params.taskProfile.maxDuration}
- Task type: ${params.taskProfile.type}
- Complexity: ${params.taskProfile.complexity}

ENERGY ${params.energy}/10 RULES:
${params.energy <= 3 ? `
- EVERY task must be 30 seconds to 2 minutes MAX
- ZERO mental work - pure physical actions only
- Examples: "Open door", "Pick up 3 items", "Walk to room"
- NO sorting, NO deciding, NO thinking
` : params.energy <= 6 ? `
- Tasks can be 1-5 minutes
- Mix of physical + light mental work okay
- Examples: "Sort papers into 2 piles", "Put books on shelf"
- Simple decisions okay, but keep it straightforward
` : `
- Tasks can be up to 10 minutes
- Complex mental work is fine
- Examples: "Organize all files by category", "Deep clean area"
- Planning and thinking tasks are okay
`}

TIME ${params.time} MIN STRATEGY:
${params.time <= 5 ? `
- Generate only ${params.taskCount.min}-${params.taskCount.max} tasks
- Make them QUICK (30 sec - 2 min each)
- Focus on immediate visible wins
- Stop user before they burn out
` : params.time <= 15 ? `
- Generate ${params.taskCount.min}-${params.taskCount.max} tasks
- Mix of quick (1-2 min) and medium (3-5 min) tasks
- Balance momentum with meaningful progress
` : `
- Generate ${params.taskCount.min}-${params.taskCount.max} tasks
- Can include longer tasks (5-10 min) if energy supports it
- Build from easy to more complex
- Create sustainable workflow
`}

MANDATORY RULES:
1. First 3-5 tasks MUST be extremely easy (30 sec - 2 min) regardless of energy
2. Tasks must total approximately ${params.time} minutes
3. Respect energy level - low energy = simple tasks even if more time available
4. Put comma after EVERY task object (critical for JSON parsing)
5. NO trailing comma after last task

CRITICAL JSON RULES:
- You MUST put a comma after EVERY object in the micro_tasks array
- Example: {...}, {...}, {...}  (comma after each task)
- NO trailing comma after the last task
- Return ONLY the JSON, nothing else

Return THIS exact structure:

{
  "project_breakdown": {
    "total_micro_tasks": ${params.taskCount.min},
    "estimated_total_time": "${params.time} minutes",
    "complexity": "${params.taskProfile.complexity}",
    "time_budget": "${params.time} minutes",
    "energy_level": "${params.energy}/10"
  },
  "micro_tasks": [
    {
      "task_id": 1,
      "task": "Open the door",
      "estimated_time": "30 seconds",
      "energy_required": "low",
      "dependencies": [],
      "completion_criteria": "Door is open",
      "if_stuck": "Just unlock it",
      "momentum_builder": true
    },
    {
      "task_id": 2,
      "task": "Get a trash bag",
      "estimated_time": "1 minute",
      "energy_required": "low",
      "dependencies": [],
      "completion_criteria": "Bag in hand",
      "if_stuck": "Walk to bags",
      "momentum_builder": true
    }
  ],
  "anti_paralysis_strategies": {
    "if_cant_start": "Do only task 1",
    "permission_to_stop": "Stop after any task"
  },
  "momentum_checkpoints": [
    {
      "after_task": 5,
      "celebration": "You started!"
    }
  ]
}

REMEMBER: Put a comma after each task object in the array!`;

    console.log('🤖 Calling Claude API...');

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
      messages: [{ role: 'user', content: prompt }]
    });

    console.log('✅ Claude API responded');

    let textContent = message.content.find(item => item.type === 'text')?.text || '';
    
    // Clean up
    textContent = textContent.trim();
    textContent = textContent.replace(/```json\n?/gi, '');
    textContent = textContent.replace(/```\n?/g, '');
    
    // Extract JSON
    const firstBrace = textContent.indexOf('{');
    const lastBrace = textContent.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error('No JSON object found');
    }
    
    let jsonStr = textContent.substring(firstBrace, lastBrace + 1);
    
    console.log('Original JSON length:', jsonStr.length);
    
    // Apply aggressive repair
    let repairedStr = repairJSON(jsonStr);
    
    console.log('After repair, length:', repairedStr.length);
    
    // Try parsing
    let parsed;
    
    try {
      parsed = JSON.parse(repairedStr);
      console.log('✅ JSON parsed successfully');
      
    } catch (parseError) {
      console.error('❌ Parse failed:', parseError.message);
      
      // Get error position
      const posMatch = parseError.message.match(/position (\d+)/);
      if (posMatch) {
        const pos = parseInt(posMatch[1]);
        const context = repairedStr.substring(Math.max(0, pos - 100), Math.min(repairedStr.length, pos + 100));
        console.error('Error context:', context);
        console.error('Character at position:', repairedStr[pos], '(code:', repairedStr.charCodeAt(pos), ')');
      }
      
      // Fallback: Manual extraction
      console.log('🔧 Attempting manual task extraction...');
      
      const tasks = manuallyParseTasks(repairedStr);
      
      if (tasks.length === 0) {
        throw new Error('Could not extract any tasks. Please try a simpler project description.');
      }
      
      // Build minimal valid response
      parsed = {
        project_breakdown: {
          total_micro_tasks: tasks.length,
          estimated_total_time: `${Math.ceil(tasks.length * 3)} minutes`,
          complexity: "medium",
          total_points_possible: tasks.length * 10
        },
        micro_tasks: tasks,
        anti_paralysis_strategies: {
          if_cant_start: "Do ONLY task 1. That's enough.",
          if_decision_paralysis: "Pick first option, change later okay",
          permission_to_stop: "Stop after any task. Progress is progress."
        },
        momentum_checkpoints: [
          {
            after_task: 5,
            celebration: "You started! Hardest part done!",
            points_earned: 50
          }
        ]
      };
      
      console.log(`✅ Manually reconstructed with ${tasks.length} tasks`);
    }
    
    // Validate and enhance
    if (!parsed.micro_tasks || !Array.isArray(parsed.micro_tasks) || parsed.micro_tasks.length === 0) {
      throw new Error('No valid tasks found');
    }
    
    // Add missing metadata
    if (!parsed.project_breakdown) {
      parsed.project_breakdown = {};
    }
    
    parsed.project_breakdown.total_micro_tasks = parsed.micro_tasks.length;
    parsed.project_breakdown.total_points_possible = parsed.micro_tasks.length * 10;
    
    if (!parsed.project_breakdown.estimated_total_time) {
      const totalMinutes = parsed.micro_tasks.reduce((sum, task) => {
        const mins = parseInt(task.estimated_time) || 2;
        return sum + mins;
      }, 0);
      
      const hours = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      
      parsed.project_breakdown.estimated_total_time = hours > 0 
        ? `${hours} hour${hours > 1 ? 's' : ''} ${mins} minutes`
        : `${mins} minutes`;
    }
    
    // Ensure all tasks have required fields
    parsed.micro_tasks = parsed.micro_tasks.map((task, idx) => ({
      task_id: task.task_id || idx + 1,
      task: task.task || "Complete this step",
      estimated_time: task.estimated_time || "2 minutes",
      energy_required: task.energy_required || "low",
      dependencies: Array.isArray(task.dependencies) ? task.dependencies : [],
      why_this_first: task.why_this_first || "",
      completion_criteria: task.completion_criteria || "Task is complete",
      if_stuck: task.if_stuck || "Try an easier version",
      minimum_viable: task.minimum_viable || task.if_stuck || "Do the smallest version",
      momentum_builder: task.momentum_builder !== undefined ? task.momentum_builder : idx < 5
    }));
    
    // Add defaults for missing sections
    if (!parsed.anti_paralysis_strategies) {
      parsed.anti_paralysis_strategies = {
        if_cant_start: "Do ONLY task 1. That's enough.",
        permission_to_stop: "Stop after any task. Progress is progress."
      };
    }
    
    if (!parsed.momentum_checkpoints) {
      parsed.momentum_checkpoints = [
        {
          after_task: 5,
          celebration: "You started! Hardest part done!",
          points_earned: 50
        }
      ];
    }
    
    console.log('✅ Final validation complete');
    console.log('📊 Breakdown:', {
      totalTasks: parsed.micro_tasks.length,
      points: parsed.project_breakdown.total_points_possible
    });

    res.json(parsed);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    
    res.status(500).json({ 
      error: 'Failed to break down project. Please try again or simplify your project description.'
    });
  }
});


module.exports = router;
