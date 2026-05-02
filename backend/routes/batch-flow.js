const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage } = require('../lib/claude');

const SYSTEM_PROMPT = `You are a productivity expert specializing in task batching and cognitive flow. Context switching costs 15-25 minutes of focus recovery. Grouping tasks by cognitive mode dramatically reduces mental friction.

COGNITIVE MODES:
- creative: Writing, brainstorming, designing — open, relaxed focus
- analytical: Spreadsheets, code, data review — tight, detail focus
- social: Calls, emails, messages, meetings — people-energy
- mechanical: Filing, data entry, organizing — low creativity, steady effort
- physical: Errands, cleaning, exercise — body movement
- planning: Scheduling, reviewing, prioritizing — big-picture thinking

ENERGY CURVES:
- morning_person: Peak 8-11am, steady noon-3pm, fade after 3pm
- slow_starter: Ramp up 10am-noon, peak 1-4pm, decent evening
- afternoon_peak: Low morning, peak 1-5pm, evening fade
- night_owl: Low morning, building afternoon, peak 7-11pm
- flat: Equal all day — batch by mode, not energy

RULES:
- Batch by cognitive mode first, then tools/location
- Never mix creative and mechanical in one batch
- Match high-energy batches to peak hours
- Breaks between batches (5-10 min short, 15-30 min mode shifts)
- Honest time estimates — people underestimate by 50%
FORMAT: Return ONLY valid JSON. No markdown, no preamble.`;

function buildTaskLines(tasks) {
  return tasks.map((t, i) => {
    if (typeof t === 'string') return `${i + 1}. "${t}"`;
    let line = `${i + 1}. "${t.task}"`;
    if (t.deadline) line += ` [Deadline: ${t.deadline}]`;
    if (t.duration) line += ` [Est: ${t.duration}]`;
    if (t.location) line += ` [Location: ${t.location}]`;
    return line;
  }).join('\n');
}

function buildCommitmentsBlock(c) {
  if (!c?.length) return '';
  return `\nFIXED COMMITMENTS (batch AROUND these):\n${c.map(x => `  - ${x.time}: "${x.label}" (${x.duration || '~30 min'})`).join('\n')}\n`;
}

const BATCH_SCHEMA = `{
      "batch_id": 1, "batch_name": "name", "cognitive_mode": "creative|analytical|social|mechanical|physical|planning",
      "energy_required": "high|medium|low", "energy_level": 3,
      "suggested_time": "9:00 AM - 10:30 AM", "start_hour": 9, "end_hour": 10.5,
      "estimated_duration": "~90 min",
      "tasks": [{ "task": "description", "time_estimate": "~20 min", "order_in_batch": 1, "location": "or null" }],
      "why_batched": "reason", "tools_needed": ["tool1"],
      "environment_tip": "setup note",
      "focus_preset": { "notifications": "off|limited|on", "music": "suggestion", "workspace": "where", "phone": "DND|nearby", "browser_tabs": "open/close", "ritual": "transition ritual" },
      "break_after": "5 min stretch"
    }`;

router.post('/batch-flow', async (req, res) => {
  try {
    const { action = 'generate' } = req.body;

    // ─── GENERATE (v3: + commitments, location mode, focus presets, heatmap) ───
    if (action === 'generate') {
      const { tasks, energy_curve, day_type, time_available, start_time,
              fixed_commitments, location_mode, pastBatches, userLanguage } = req.body;
      if (!tasks?.length) return res.status(400).json({ error: 'Add at least one task.' });

      const taskLines = buildTaskLines(tasks);
      const commitmentsBlock = buildCommitmentsBlock(fixed_commitments);
      const historyNote = pastBatches?.length ? `\nPAST SESSIONS: ${pastBatches.slice(0, 5).map(s => `${s.date}: ${s.batchCount} batches, ${s.tasksCompleted}/${s.totalTasks} done`).join('; ')}\n` : '';
      const locationNote = location_mode ? '\nLOCATION MODE ON: Also group by physical location. Route-efficient errand batching.\n' : '';

      const prompt = withLanguage(`Batch these tasks to minimize context switching and maximize flow.

TASKS:\n${taskLines}
ENERGY CURVE: ${energy_curve || 'not specified'}
DAY TYPE: ${day_type || 'mixed'}
TIME AVAILABLE: ${time_available || 'not specified'}
START TIME: ${start_time || 'now'}
${commitmentsBlock}${locationNote}${historyNote}
RULES:
- Group by cognitive mode, tools, or location
- Order batches to match energy curve
- 2-5 tasks per batch. Single-task batches OK.
- Generous duration estimates (+25% padding)
- Calculate switch costs: before (random) vs after (batched)
- For EACH batch include a focus_preset (ideal environment)
- Generate heatmap data: hour-by-hour mode and intensity

Return ONLY valid JSON:
{
  "overview": "1-2 sentences",
  "switch_cost_before": "X switches random",
  "switch_cost_after": "Y switches batched",
  "time_saved_estimate": "~Xm",
  "total_estimated_time": "total including breaks",
  "batches": [${BATCH_SCHEMA}],
  "fixed_commitments_placed": [{ "time": "2:00 PM", "label": "meeting", "note": "batches scheduled around this" }],
  "unbatchable": ["tasks that don't fit"],
  "day_flow_note": "rhythm summary",
  "heatmap": [{ "hour": 9, "mode": "social", "intensity": "high|medium|low", "label": "batch name" }]
}`, userLanguage);

      const parsed = await callClaudeWithRetry(prompt, { label: 'BatchFlowGenerate', max_tokens: 5000, system: withLanguage(SYSTEM_PROMPT, userLanguage) });
      return res.json(parsed);
    }

    // ─── QUICK DUMP ───
    if (action === 'quick-dump') {
      const { text, energy_curve, day_type, time_available, userLanguage } = req.body;
      if (!text?.trim()) return res.status(400).json({ error: 'Paste your task list.' });

      const prompt = withLanguage(`Extract tasks from messy list, then batch for flow.

RAW INPUT: "${text.trim()}"
ENERGY CURVE: ${energy_curve || 'not specified'}
DAY TYPE: ${day_type || 'mixed'}
TIME AVAILABLE: ${time_available || 'not specified'}

STEP 1: Extract distinct actionable tasks. Merge duplicates.
STEP 2: Batch by cognitive mode.

Return ONLY valid JSON:
{
  "extracted_tasks": [{ "task": "clean description", "inferred_duration": "~X min", "cognitive_mode": "mode" }],
  "extraction_note": "Found X tasks, merged Y duplicates",
  "overview": "batched summary", "switch_cost_before": "X", "switch_cost_after": "Y",
  "time_saved_estimate": "~Xm", "total_estimated_time": "total",
  "batches": [${BATCH_SCHEMA}],
  "unbatchable": [], "day_flow_note": "summary",
  "heatmap": [{ "hour": 9, "mode": "mode", "intensity": "level", "label": "name" }]
}`, userLanguage);

      const parsed = await callClaudeWithRetry(prompt, { label: 'BatchFlowDump', max_tokens: 4000, system: withLanguage(SYSTEM_PROMPT, userLanguage) });
      return res.json(parsed);
    }

    // ─── REBATCH ───
    if (action === 'rebatch') {
      const { batches, movedTask, fromBatch, toBatch, removedTasks, energy_curve, userLanguage } = req.body;
      if (!batches?.length) return res.status(400).json({ error: 'Need current batches.' });
      const currentPlan = batches.map(b => `Batch "${b.batch_name}" (${b.cognitive_mode}): ${(b.tasks||[]).map(t=>t.task).join(', ')}`).join('\n');
      const changeNote = movedTask ? `MOVED: "${movedTask}" from "${fromBatch}" to "${toBatch}"` : removedTasks?.length ? `REMOVED: ${removedTasks.join(', ')}` : 'Fresh re-batch requested';

      const prompt = withLanguage(`Re-analyze batch plan after changes.\n\nCURRENT:\n${currentPlan}\n\nCHANGE: ${changeNote}\nENERGY: ${energy_curve || '?'}\n\nReturn ONLY valid JSON:\n{ "assessment": "brief note", "switch_cost_after": "updated count", "batches": [${BATCH_SCHEMA}], "suggestion": "improvement or null" }`, userLanguage);
      const parsed = await callClaudeWithRetry(prompt, { label: 'BatchFlowRebatch', max_tokens: 2500, system: withLanguage(SYSTEM_PROMPT, userLanguage) });
      return res.json(parsed);
    }

    // ─── EXPAND BATCH ───
    if (action === 'expand-batch') {
      const { batch, energy_level, userLanguage } = req.body;
      if (!batch?.tasks?.length) return res.status(400).json({ error: 'Need batch tasks.' });
      const taskList = batch.tasks.map((t,i) => `${i+1}. "${t.task}" (~${t.time_estimate||'?'})`).join('\n');

      const prompt = withLanguage(`Expand batch into step-by-step execution plan.\n\nBATCH: "${batch.batch_name}" (${batch.cognitive_mode})\nTASKS:\n${taskList}\nENERGY: ${energy_level||'unknown'}\n\nReturn ONLY valid JSON:\n{ "batch_name": "${batch.batch_name}", "prep_steps": ["setup steps"], "execution_plan": [{ "task": "name", "first_action": "exact physical step", "time_estimate": "~X min", "momentum_tip": "tip", "done_signal": "completion signal" }], "micro_breaks": "break strategy", "batch_complete_reward": "reward" }`, userLanguage);
      const parsed = await callClaudeWithRetry(prompt, { label: 'BatchFlowExpand', max_tokens: 1500, system: withLanguage('Execution planning specialist. Concrete first actions. Return ONLY valid JSON.', userLanguage) });
      return res.json(parsed);
    }

    // ─── PROGRESS UPDATE ───
    if (action === 'progress-update') {
      const { completedBatches, remainingBatches, energy_level, time_remaining, userLanguage } = req.body;
      if (!remainingBatches?.length && !completedBatches?.length) return res.status(400).json({ error: 'Need batch data.' });
      const cNames = (completedBatches||[]).map(b => `✓ "${b.batch_name}" (${b.tasks?.length||'?'} tasks)`).join('\n');
      const rNames = (remainingBatches||[]).map(b => `○ "${b.batch_name}" (${b.tasks?.length||'?'} tasks, ~${b.estimated_duration||'?'})`).join('\n');

      const prompt = withLanguage(`Update batch plan after progress.\n\nCOMPLETED:\n${cNames||'None'}\n\nREMAINING:\n${rNames||'All done!'}\n\nENERGY: ${energy_level||'unknown'}\nTIME LEFT: ${time_remaining||'unknown'}\n\nReturn ONLY valid JSON:\n{ "acknowledgment": "warm 1-2 sentences", "batches_completed": ${(completedBatches||[]).length}, "batches_remaining": ${(remainingBatches||[]).length}, "can_stop": true, "stop_reasoning": "reason", "next_batch": "name or null", "reorder_suggestion": "or null", "energy_note": "energy read" }`, userLanguage);
      const parsed = await callClaudeWithRetry(prompt, { label: 'BatchFlowProgress', max_tokens: 1000, system: withLanguage(SYSTEM_PROMPT, userLanguage) });
      return res.json(parsed);
    }

    // ─── SHARE PLAN ───
    if (action === 'share-plan') {
      const { batches, time_available, recipientType, userLanguage } = req.body;
      if (!batches?.length) return res.status(400).json({ error: 'Need batch plan.' });
      const summary = batches.map(b => `${b.batch_name} (${b.suggested_time||'?'}): ${(b.tasks||[]).map(t=>t.task).join(', ')}`).join('\n');

      const prompt = withLanguage(`Create shareable accountability message.\n\nPLAN:\n${summary}\nTIME: ${time_available||'?'}\nRECIPIENT: ${recipientType||'friend'}\n\nReturn ONLY valid JSON:\n{ "message": "ready to send", "check_in_time": "when to check in", "tone_note": "tone" }`, userLanguage);
      const parsed = await callClaudeWithRetry(prompt, { label: 'BatchFlowShare', max_tokens: 600, system: withLanguage('Accountability messaging expert. Confident tone. Return ONLY valid JSON.', userLanguage) });
      return res.json(parsed);
    }

    // ─── DAY TEMPLATE ───
    if (action === 'day-template') {
      const { batches, templateName, day_type, energy_curve, userLanguage } = req.body;
      if (!batches?.length) return res.status(400).json({ error: 'Need batch plan.' });
      const summary = batches.map(b => `"${b.batch_name}" (${b.cognitive_mode}, ${b.suggested_time||'?'}): ${(b.tasks||[]).map(t=>t.task).join(', ')}`).join('\n');

      const prompt = withLanguage(`Generalize this batch plan into a reusable template.\n\nPLAN:\n${summary}\nNAME: ${templateName||'My Template'}\nDAY TYPE: ${day_type||'mixed'}\nENERGY: ${energy_curve||'?'}\n\nReturn ONLY valid JSON:\n{ "template_name": "${templateName||'My Template'}", "day_type": "${day_type||'mixed'}", "energy_curve": "${energy_curve||'flexible'}", "description": "one sentence", "template_batches": [{ "batch_name": "generalized", "cognitive_mode": "mode", "suggested_time": "range", "duration": "~X min", "slot_description": "what goes here", "is_flexible": true, "energy_required": "level" }], "usage_tip": "when to use" }`, userLanguage);
      const parsed = await callClaudeWithRetry(prompt, { label: 'BatchFlowTemplate', max_tokens: 1200, system: withLanguage('Productivity template designer. Return ONLY valid JSON.', userLanguage) });
      return res.json(parsed);
    }

    // ─── BATCH INSIGHTS ───
    if (action === 'batch-insights') {
      const { sessions, userLanguage } = req.body;
      if (!sessions?.length || sessions.length < 3) return res.status(400).json({ error: 'Need 3+ sessions.' });
      const list = sessions.slice(0,15).map((s,i) => `${i+1}. ${s.date}: ${s.totalTasks} tasks, ${s.batchCount} batches, done ${s.tasksCompleted}/${s.totalTasks}, mode: ${s.topMode||'?'}, saved: ${s.timeSaved||'?'}`).join('\n');

      const prompt = withLanguage(`Analyze batching history for patterns.\n\nSESSIONS:\n${list}\n\nReturn ONLY valid JSON:\n{ "pattern_summary": "2-3 sentences", "total_time_saved": "total", "favorite_mode": "most used", "avoided_mode": "most skipped", "completion_rate": "X%", "best_insight": "ONE insight", "batch_tip": "personalized tip", "encouragement": "warm note" }`, userLanguage);
      const parsed = await callClaudeWithRetry(prompt, { label: 'BatchFlowInsights', max_tokens: 1200, system: withLanguage('Productivity pattern analyst. Warm, actionable. Return ONLY valid JSON.', userLanguage) });
      return res.json(parsed);
    }

    // ═══ v3 NEW ROUTES ═══

    // ─── A/B COMPARE (sprint vs marathon) ───
    if (action === 'ab-compare') {
      const { tasks, energy_curve, time_available, fixed_commitments, userLanguage } = req.body;
      if (!tasks?.length) return res.status(400).json({ error: 'Add tasks.' });
      const taskLines = buildTaskLines(tasks);
      const commitmentsBlock = buildCommitmentsBlock(fixed_commitments);

      const prompt = withLanguage(`Create TWO batch arrangements for the same tasks.

TASKS:\n${taskLines}
ENERGY: ${energy_curve||'?'}\nTIME: ${time_available||'?'}
${commitmentsBlock}

ARRANGEMENT A — Sprint: Front-load everything, aggressive pacing, minimal breaks. Done fast, but exhausting.
ARRANGEMENT B — Marathon: Alternate intensity, generous breaks, sustainable. Takes longer, energy left over.

Return ONLY valid JSON:
{
  "sprint": {
    "label": "Sprint Mode", "tagline": "Done by X, but spent",
    "estimated_end_time": "time",
    "batches": [{ "batch_id": 1, "batch_name": "name", "cognitive_mode": "mode", "energy_required": "level", "suggested_time": "range", "start_hour": 9, "end_hour": 10.5, "estimated_duration": "~X min", "tasks": [{ "task": "desc", "time_estimate": "~X min", "order_in_batch": 1 }], "break_after": "brief" }],
    "pros": ["reason"], "cons": ["reason"],
    "best_for": "when to use this"
  },
  "marathon": {
    "label": "Marathon Mode", "tagline": "Steady through X",
    "estimated_end_time": "time",
    "batches": [same structure],
    "pros": ["reason"], "cons": ["reason"],
    "best_for": "when to use this"
  },
  "comparison": {
    "time_difference": "Sprint finishes X hours earlier",
    "energy_difference": "Marathon leaves more energy",
    "recommendation": "Which is better for their curve — with reasoning"
  }
}`, userLanguage);

      const parsed = await callClaudeWithRetry(prompt, { label: 'BatchFlowAB', max_tokens: 5000, system: withLanguage(SYSTEM_PROMPT, userLanguage) });
      return res.json(parsed);
    }

    // ─── WEEKLY RHYTHM ───
    if (action === 'weekly-rhythm') {
      const { recurring_tasks, energy_curve, typical_commitments, preferences, userLanguage } = req.body;
      if (!recurring_tasks?.length) return res.status(400).json({ error: 'Add recurring tasks.' });
      const taskLines = recurring_tasks.map((t,i) => `${i+1}. "${t.task}" freq: ${t.frequency||'weekly'}${t.preferred_day?', pref: '+t.preferred_day:''}${t.duration?', ~'+t.duration:''}${t.cognitive_mode?' ['+t.cognitive_mode+']':''}`).join('\n');
      const commitLines = (typical_commitments||[]).map(c => `  ${c.day}: ${c.time} — "${c.label}"`).join('\n');

      const prompt = withLanguage(`Design a weekly batching rhythm.

RECURRING TASKS:\n${taskLines}
COMMITMENTS:\n${commitLines||'None'}
ENERGY: ${energy_curve||'?'}
PREFERENCES: ${preferences||'none'}

RULES: Assign tasks to specific days. Group same-mode tasks per day. Monday light, Friday wrap-up. Leave buffer days. Each day gets a theme.

Return ONLY valid JSON:
{
  "rhythm_name": "My Weekly Rhythm", "overview": "how the week flows",
  "days": [{
    "day": "Monday", "theme": "day theme", "energy_profile": "typical energy",
    "batches": [{ "batch_name": "name", "cognitive_mode": "mode", "suggested_time": "range", "tasks": ["task1"], "duration": "~X min" }],
    "commitments": ["fixed items"], "buffer_time": "30 min", "day_note": "tip"
  }],
  "weekly_balance": { "creative_hours": "X", "analytical_hours": "X", "social_hours": "X", "mechanical_hours": "X", "physical_hours": "X", "free_buffer": "X" },
  "adaptation_tip": "how to flex"
}`, userLanguage);

      const parsed = await callClaudeWithRetry(prompt, { label: 'BatchFlowWeekly', max_tokens: 4000, system: withLanguage('Weekly productivity architect. Sustainable batch rhythms. Return ONLY valid JSON.', userLanguage) });
      return res.json(parsed);
    }

    // ─── RESISTANCE CHECK ───
    if (action === 'resistance-check') {
      const { deferred_tasks, sessions, userLanguage } = req.body;
      if (!deferred_tasks?.length) return res.status(400).json({ error: 'Need deferred tasks.' });
      const lines = deferred_tasks.map((t,i) => `${i+1}. "${t.task}" deferred ${t.defer_count}x, mode: ${t.cognitive_mode||'?'}`).join('\n');

      const prompt = withLanguage(`Analyze repeatedly deferred tasks. Something is stopping them.

DEFERRED TASKS:\n${lines}\nTOTAL SESSIONS: ${sessions||'?'}

For each: diagnose WHY (too big? wrong mode? unimportant? emotional? unclear? delegate?) and suggest a fix.

Return ONLY valid JSON:
{
  "overall_pattern": "what deferred tasks have in common",
  "tasks": [{ "task": "name", "defer_count": 3, "diagnosis": "specific reason", "resistance_type": "too_big|wrong_mode|unimportant|emotional|unclear|delegate", "fix": "actionable fix", "if_you_keep_deferring": "honest consequence" }],
  "meta_insight": "ONE thing that would unblock the most",
  "encouragement": "warm note"
}`, userLanguage);

      const parsed = await callClaudeWithRetry(prompt, { label: 'BatchFlowResistance', max_tokens: 2000, system: withLanguage('Task resistance analyst. Diagnose avoidance, offer fixes. Honest but kind. Return ONLY valid JSON.', userLanguage) });
      return res.json(parsed);
    }

    // ─── TIME CALIBRATE ───
    if (action === 'time-calibrate') {
      const { time_data, userLanguage } = req.body;
      if (!time_data?.length) return res.status(400).json({ error: 'Need time data.' });
      const lines = time_data.map((t,i) => `${i+1}. "${t.task}" [${t.cognitive_mode||'?'}] est: ${t.estimated||'?'}, actual: ${t.actual||'?'}`).join('\n');

      const prompt = withLanguage(`Analyze time estimation accuracy.

DATA:\n${lines}

Check: overall accuracy, mode-specific patterns, task-size patterns, trends.

Return ONLY valid JSON:
{
  "overall_accuracy": "summary", "bias_direction": "under|over|accurate", "bias_amount": "X%",
  "mode_breakdown": [{ "mode": "creative", "avg_error": "+30%", "note": "explanation" }],
  "worst_mode": "least accurate mode", "best_mode": "most accurate",
  "calibration_tip": "specific advice", "fun_stat": "lighthearted stat",
  "adjustment_factor": "multiplier — e.g. 1.3"
}`, userLanguage);

      const parsed = await callClaudeWithRetry(prompt, { label: 'BatchFlowCalibrate', max_tokens: 1200, system: withLanguage('Time estimation analyst. Find patterns in duration misjudgment. Return ONLY valid JSON.', userLanguage) });
      return res.json(parsed);
    }

    // ─── LOCATION BATCH ───
    if (action === 'location-batch') {
      const { tasks, home_base, userLanguage } = req.body;
      if (!tasks?.length) return res.status(400).json({ error: 'Need tasks with locations.' });
      const lines = tasks.map((t,i) => `${i+1}. "${t.task}"${t.location?' @ '+t.location:''}${t.duration?' (~'+t.duration+')':''}`).join('\n');

      const prompt = withLanguage(`Re-batch by LOCATION for route efficiency.

TASKS:\n${lines}
HOME BASE: ${home_base||'home'}

Group by proximity. Logical route, minimize backtracking. "Phone tasks" as mobile batch. Estimate travel time.

Return ONLY valid JSON:
{
  "route_overview": "route description",
  "location_batches": [{
    "batch_id": 1, "batch_name": "location name", "location": "where",
    "travel_from_previous": "~X min or starting point",
    "tasks": [{ "task": "desc", "specific_location": "place", "time_estimate": "~X min" }],
    "total_time_at_location": "~X min", "tip": "efficiency tip"
  }],
  "mobile_tasks": ["phone tasks for transit"],
  "total_travel_time": "estimated", "route_efficiency": "time saved vs random"
}`, userLanguage);

      const parsed = await callClaudeWithRetry(prompt, { label: 'BatchFlowLocation', max_tokens: 2000, system: withLanguage('Errand optimization expert. Efficient routes. Return ONLY valid JSON.', userLanguage) });
      return res.json(parsed);
    }

    return res.status(400).json({ error: 'Invalid action. Use: generate, quick-dump, rebatch, expand-batch, progress-update, share-plan, day-template, batch-insights, ab-compare, weekly-rhythm, resistance-check, time-calibrate, location-batch' });
  } catch (error) {
    console.error('[BatchFlow]', error.message);
    res.status(500).json({ error: error.message || 'Failed to batch tasks.' });
  }
});

module.exports = router;
