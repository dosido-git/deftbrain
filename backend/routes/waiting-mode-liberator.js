const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

// ═══════════════════════════════════════════════════
// WAITING MODE LIBERATOR — v4 (6 routes)
// v3: multi-event, energy-aware, one-thing, reframes
// v4: +start-with-me (guided launch), +debrief
// ═══════════════════════════════════════════════════
router.post('/waiting-mode-liberator', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  const { action } = req.body;

  try {
    switch (action) {

      // ────────────────────────────────────────────
      // LIBERATE — Main: multi-event time analysis
      // ────────────────────────────────────────────
      case 'liberate': {
        const { events, currentTime, userTasks, energy, userLanguage } = req.body;

        if (!events?.length) {
          return res.status(400).json({ error: 'Add at least one appointment.' });
        }

        const eventDescriptions = events.map((ev, i) => {
          const totalPrep = (parseInt(ev.prepMinutes) || 0) + (parseInt(ev.travelMinutes) || 0);
          return `EVENT ${i + 1}: ${ev.time} (${ev.type || 'general'}) — needs ${totalPrep} min prep+travel`;
        }).join('\n');

        const windowDescriptions = (events.length === 1)
          ? `FREE WINDOW: From ${currentTime || 'now'} until prep for event at ${events[0].time}`
          : events.map((ev, i) => {
              if (i === 0) return `WINDOW 1: ${currentTime || 'now'} → prep for ${ev.time}`;
              const prev = events[i - 1];
              return `WINDOW ${i + 1}: After ${prev.time} → prep for ${ev.time}`;
            }).join('\n') + `\nWINDOW ${events.length + 1}: After ${events[events.length - 1].time} → end of day (if applicable)`;

        const energyDesc = {
          1: 'VERY LOW — barely functional. Only suggest easiest possible tasks. No deep work.',
          2: 'LOW — foggy, tired. Maintenance tasks, admin, easy cleanup. Short blocks (15-20 min). Include rest blocks.',
          3: 'MODERATE — functional but not sharp. Mix of easy and medium tasks. Standard blocks.',
          4: 'GOOD — alert and capable. Deep work in the first/longest block. Productive mix.',
          5: 'HIGH — energized and focused. Front-load the hardest task. Maximize deep work.',
        };

        const prompt = withLanguage(`You help people reclaim the hours around appointments. Someone is frozen because they have events today and can't start anything. Find every free window, map their tasks respecting energy, give permission.

${eventDescriptions}

${windowDescriptions}

CURRENT TIME: ${currentTime || 'not specified'}
ENERGY LEVEL: ${energy || 3}/5
${energyDesc[parseInt(energy) || 3]}

${userTasks?.trim() ? `THEIR ACTUAL TASKS: "${userTasks.trim()}"` : 'No specific tasks listed.'}

RULES:
- Calculate "prep alarm" for EACH event (event time minus prep+travel).
- Identify ALL free windows. Include window after last event if useful.
- First prep alarm = countdown target.
- Map tasks to windows respecting energy. Low energy = easy first, high = deep work first.
- Energy 1-2: include rest/snack blocks. Don't pack schedule.
- "permission" references ALL free windows.
- Concrete start/end times for all blocks.
- Use their tasks if listed, not generic suggestions.

Return ONLY valid JSON:
{
  "events_summary": [{ "time": "2:00 PM — one sentence", "type": "medical — one sentence", "prep_alarm": "1:25 PM — one sentence" }],
  "first_prep_alarm": "Earliest prep alarm time — one sentence",
  "total_free_minutes": 180,
  "free_until": "Plain language total — one sentence",
  "permission": "Specific liberating hero text — one sentence",
  "time_blocks": [{
    "window": 1, "start": "10:30 AM — one sentence", "end": "11:30 AM — one sentence", "minutes": 60,
    "task": "Specific task — one sentence", "why_it_fits": "Energy + time reasoning — one sentence", "intensity": "low|medium|high"
  }],
  "reframe": "Cognitive reframe for their situation — one sentence",
  "prep_plans": [{ "event_time": "2:00 PM — one sentence", "alarm_time": "1:25 PM — one sentence", "steps": ["Step 1", "Step 2"] }],
  "worst_case": "Safety net advice — one sentence"
}`, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);

        const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'WML-Liberate' });
        if (!parsed.total_free_minutes && !parsed.activities) {
          return res.status(500).json({ error: 'Could not analyze your wait time. Please try again.' });
        }
        return res.json(parsed);
      }

      // ────────────────────────────────────────────
      // START-WITH-ME — Guided launch into block (v4)
      // ────────────────────────────────────────────
      case 'start-with-me': {
        const { task, blockMinutes, intensity, energy, userLanguage } = req.body;

        if (!task?.trim()) {
          return res.status(400).json({ error: 'What task are we starting?' });
        }

        const prompt = withLanguage(`You are a calm companion guiding someone from "frozen" to "doing the thing." They have a task but can't start. Walk them through a 60-second guided launch — a sequence of tiny steps that physically gets them going.

TASK: "${task.trim()}"
BLOCK DURATION: ${blockMinutes || 30} minutes
INTENSITY: ${intensity || 'medium'}
ENERGY: ${energy || 3}/5

Generate a sequence of 4-5 micro-steps. Each step should be:
- A specific physical action (not "think about" — more like "open the app", "type the first word")
- Completable in under 15 seconds
- The next step assumes the previous one is done
- First step is the absolute smallest possible action (move mouse, open lid, unlock phone)
- Last step is the actual work beginning (type first sentence, click first item)

Also generate:
- A "launch line" — a 1-sentence kick-off message to read right before starting
- A "block complete" message for when the timer ends
- A mid-block check-in message for halfway through

Return ONLY valid JSON:
{
  "launch_line": "One warm sentence to kick off (e.g., 'Okay, here we go. Just follow along.') — one sentence",
  "steps": [
    {
      "instruction": "Tiny physical action — one sentence",
      "emoji": "One emoji (one emoji)"
    }
  ],
  "mid_check": "Brief halfway message (e.g., 'You're actually doing it. Keep going.') — one sentence",
  "block_done": "Celebration when block timer ends — one sentence",
  "next_nudge": "Gentle suggestion for what to do after this block (or permission to stop) — one sentence"
}`, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);

        const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'WML-StartWithMe' });
        if (!parsed.launch_line) {
          return res.status(500).json({ error: 'Could not analyze your wait time. Please try again.' });
        }
        return res.json(parsed);
      }

      // ────────────────────────────────────────────
      // ONE-THING — Ultra-low-stakes single task
      // ────────────────────────────────────────────
      case 'one-thing': {
        const { freeMinutes, userTasks, appointmentType, energy, userLanguage } = req.body;

        const prompt = withLanguage(`Someone is frozen before an appointment and can't commit to a plan. Pick ONE absurdly low-stakes task they can start in 30 seconds.

FREE TIME: ~${freeMinutes || '?'} minutes
${userTasks?.trim() ? `THEIR TASKS: "${userTasks.trim()}"` : 'No specific tasks listed.'}
APPOINTMENT TYPE: ${appointmentType || 'not specified'}
ENERGY: ${energy || 2}/5 (${parseInt(energy) <= 2 ? 'low — pick something VERY easy' : 'moderate — can handle a real task'})

Rules:
- 10-15 min MAX. Frame as embarrassingly small.
- Physical first action. Escape hatch. Pick from their tasks if listed.
- Energy ≤ 2: easiest possible (not "write the report" — "open the doc and read paragraph 1")

Return ONLY valid JSON:
{
  "the_one_thing": "Single task, framed as tiny — one sentence",
  "first_physical_action": "Literal body movement — one sentence",
  "time_needed": "10-15 minutes — one sentence",
  "escape_hatch": "Permission to stop — one sentence",
  "why_this_one": "Brief reason — one sentence",
  "momentum_hook": "What they'll probably do next (no pressure) — one sentence"
}`, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);

        const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'WML-OneThing' });
        if (!parsed.the_one_thing) {
          return res.status(500).json({ error: 'Could not analyze your wait time. Please try again.' });
        }
        return res.json(parsed);
      }

      // ────────────────────────────────────────────
      // REFRAME — Cognitive reframes
      // ────────────────────────────────────────────
      case 'reframe': {
        const { appointmentType, freeMinutes, anxietyLevel, energy, userLanguage } = req.body;

        const prompt = withLanguage(`Generate 3 cognitive reframes for someone stuck in "waiting mode."

APPOINTMENT TYPE: ${appointmentType || 'general'}
FREE TIME: ~${freeMinutes || '?'} minutes
ANXIETY: ${anxietyLevel || 'moderate'}
ENERGY: ${energy || 3}/5

Each: specific to appointment type, shift "dead time" → "valuable block", 1-3 sentences, wise friend tone.
${parseInt(energy) <= 2 ? 'Acknowledge low energy. Don\'t push productivity guilt.' : ''}

Return ONLY valid JSON:
{
  "reframes": [{ "angle": "Name", "text": "The reframe — one sentence", "emoji": "One emoji (one emoji)" }],
  "truth_bomb": "One blunt honest sentence — one sentence"
}`, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);

        const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'WML-Reframe' });
        if (!parsed.reframes) {
          return res.status(500).json({ error: 'Could not analyze your wait time. Please try again.' });
        }
        return res.json(parsed);
      }

      // ────────────────────────────────────────────
      // DEBRIEF — Post-appointment reflection (v4)
      // ────────────────────────────────────────────
      case 'debrief': {
        const { events, blocksCompleted, totalBlocks, energy, anxietyBefore, usedTime, appointmentReality, note, pastDebriefs, userLanguage } = req.body;

        const primaryType = events?.[0]?.type || 'general';

        // Build anxiety history if available
        const anxietyHistory = pastDebriefs?.length > 0
          ? `\nANXIETY HISTORY for ${primaryType} appointments:\n${pastDebriefs.slice(0, 10).map(d => `  ${d.date}: anxiety before=${d.anxietyBefore}/10, reality=${d.appointmentReality}`).join('\n')}`
          : '';

        const prompt = withLanguage(`Generate a post-appointment debrief for someone who used the Waiting Mode Liberator.

APPOINTMENT TYPE: ${primaryType}
BLOCKS COMPLETED: ${blocksCompleted}/${totalBlocks}
ENERGY WAS: ${energy}/5
ANXIETY BEFORE: ${anxietyBefore || '?'}/10
DID THEY USE THE TIME: ${usedTime || 'partially'}
HOW WAS THE APPOINTMENT: ${appointmentReality || 'not specified'}
${note ? `THEIR NOTE: "${note}"` : ''}
${anxietyHistory}

Generate:
1. A reflection on how they used their time (be honest but kind)
2. An anxiety reality-check — compare their anxiety to what actually happened
3. If there's anxiety history for this appointment type, show the trend
4. One concrete takeaway for next time
5. If they didn't use the time well, don't guilt — reframe as data

Return ONLY valid JSON:
{
  "time_reflection": "How they used the time — honest, encouraging — one sentence",
  "anxiety_check": {
    "before": ${anxietyBefore || 5},
    "reality_assessment": "What actually happened vs what they feared — 1-2 sentences",
    "trend": "Anxiety trend across sessions (or null if first time) — one sentence",
    "insight": "The key realization (e.g., 'Your medical appointment anxiety averages 8 but outcomes average 3. Your brain is lying.') — one sentence"
  },
  "takeaway": "One concrete thing to try next time — one sentence",
  "encouragement": "Genuine specific praise — one sentence"
}`, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);

        const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'WML-Debrief' });
        if (!parsed.time_reflection) {
          return res.status(500).json({ error: 'Could not analyze your wait time. Please try again.' });
        }
        return res.json(parsed);
      }

      // ────────────────────────────────────────────
      // REVIEW — Analyze usage patterns
      // ────────────────────────────────────────────
      case 'review': {
        const { sessionLog, userLanguage } = req.body;

        if (!sessionLog?.length || sessionLog.length < 3) {
          return res.status(400).json({ error: 'Need at least 3 sessions to spot patterns.' });
        }

        const prompt = withLanguage(`Analyze this "waiting mode" history. Pay special attention to debrief data if available.

SESSION LOG (most recent first):
${JSON.stringify(sessionLog.slice(0, 20), null, 2)}

Look for:
- Which appointment types trigger worst freezes
- Block completion rates
- Average free time reclaimed
- "Just one thing" vs full plan usage
- Energy level patterns
- DEBRIEF DATA: anxiety vs reality trends, appointment type patterns
- Whether "start with me" guided launches improved completion

Return ONLY valid JSON:
{
  "total_sessions": 0,
  "total_minutes_reclaimed": 0,
  "trigger_patterns": {
    "worst_trigger": "Type causing most paralysis — one sentence",
    "easiest": "Type they handle best — one sentence",
    "observation": "Pattern insight — one sentence"
  },
  "time_insights": {
    "avg_free_time": "Average free time — one sentence",
    "utilization": "How much they used — one sentence",
    "best_block_length": "Most productive block size — one sentence"
  },
  "energy_patterns": {
    "avg_energy": "Typical energy level — one sentence",
    "observation": "Energy insight — one sentence"
  },
  "anxiety_trends": {
    "avg_anxiety_before": "Average pre-appointment anxiety — one sentence",
    "avg_reality": "Average 'how bad was it actually' — one sentence",
    "gap": "The difference between fear and reality — one sentence",
    "insight": "Key anxiety pattern (e.g., 'Medical appointments: anxiety 8, reality 3') — one sentence"
  },
  "recommendations": [{ "insight": "What data shows — one sentence", "suggestion": "What to try — one sentence" }],
  "encouragement": "Genuine specific observation — one sentence"
}`, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);

        const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'WML-Review' });
        if (!parsed.total_sessions) {
          return res.status(500).json({ error: 'Could not analyze your wait time. Please try again.' });
        }
        return res.json(parsed);
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }

  } catch (err) {
    console.error('WaitingModeLiberator error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
