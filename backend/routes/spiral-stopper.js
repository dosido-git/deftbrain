const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage } = require('../lib/claude');

// ═══════════════════════════════════════════════════
// SPIRAL STOPPER — v2 (5 routes, 3 modes)
// v1: single spiral analysis
// v2: +unfreeze (FreezeStateUnblocker), +recover (ShutdownRecoveryGuide),
//     +reflect (post-spiral debrief), +patterns (history analysis)
// ═══════════════════════════════════════════════════

router.post('/spiral-stopper', async (req, res) => {
  const { action } = req.body;

  try {
    switch (action || 'spiral') {

      // ╔══════════════════════════════════════════════╗
      // ║  SPIRAL MODE — Anxiety spiral intervention   ║
      // ╚══════════════════════════════════════════════╝

      case 'spiral': {
        const { thoughts, physical_symptoms, trigger, intensity, history, userLanguage } = req.body;

        if (!thoughts?.trim()) {
          return res.status(400).json({ error: 'What are you thinking right now?' });
        }

        const historyHint = history?.length
          ? `\nPAST SPIRALS: ${history.slice(0, 5).map(h => `"${h.trigger}" → ${h.primary_distortion} (intensity ${h.intensity})`).join('; ')}`
          : '';

        const prompt = withLanguage(`Someone is caught in an anxiety spiral right now. This is an emergency intervention — be direct, warm, and effective.

THEIR THOUGHTS: "${thoughts}"
PHYSICAL SYMPTOMS: ${physical_symptoms || 'not specified'}
TRIGGER: ${trigger || 'not specified'}
INTENSITY: ${intensity || '?'}/5
${historyHint}

DETECT these cognitive distortions:
- Catastrophizing: one event → everything ruined
- All-or-nothing: "always", "never", "everyone", "no one"
- Fortune-telling: predicting negative outcomes with certainty
- Mind-reading: assuming what others think
- Overgeneralization: one instance → permanent pattern
- Emotional reasoning: "I feel it so it must be true"
- Should statements: "I should have" → shame spiral

RULES:
- Start with the immediate physical intervention — ground them FIRST.
- Reality checks must use EVIDENCE, not just positivity. "You've sent 500 emails without getting fired" beats "I'm sure it's fine."
- Name the specific distortion pattern. People feel validated when their thinking trap has a name.
- The compassionate reality should be SHORT and hit hard — this is the thing they'll remember.
- If you notice a pattern from history, mention it: "This looks similar to the email spiral from before — and that turned out fine."

Return ONLY valid JSON:
{
  "spiral_detected": true,
  "intensity_read": "Brief assessment of how deep this spiral is.",
  "primary_distortion": "catastrophizing|all_or_nothing|fortune_telling|mind_reading|overgeneralization|emotional_reasoning|should_statements",
  "distortion_label": "Human-readable name for their specific pattern.",
  "immediate_action": {
    "instruction": "One physical action to do RIGHT NOW. Specific. 'Put your phone face down and press both palms flat on the surface in front of you.'",
    "why": "One sentence: why this breaks the spiral."
  },
  "thought_breakdown": [
    {
      "anxious_thought": "The specific thought they expressed.",
      "distortion": "Which cognitive distortion this is.",
      "reality_check": "Evidence-based counter. Not 'it'll be fine' but specific evidence.",
      "reframe": "The same situation described without the distortion."
    }
  ],
  "grounding": {
    "name": "Grounding exercise name.",
    "steps": ["Step-by-step instructions. Short sentences. One action per step."],
    "duration": "How long."
  },
  "compassionate_reality": "2-3 sentences. The truth about what's actually happening vs anxiety's narrative. This is the anchor statement.",
  "pattern_note": "If history shows a recurring pattern, note it. Otherwise null.",
  "after_spiral": "What to do next — one concrete action for when they feel calmer."
}`, userLanguage);

        const parsed = await callClaudeWithRetry(prompt, { label: 'SS-Spiral', max_tokens: 1000 });
        return res.json(parsed);
      }

      // ╔══════════════════════════════════════════════╗
      // ║  FREEZE MODE — (absorbs FreezeStateUnblocker)║
      // ╚══════════════════════════════════════════════╝

      case 'unfreeze': {
        const { stuck_on, current_step, completed_steps, can_move, userLanguage } = req.body;

        const stepContext = completed_steps?.length
          ? `\nCOMPLETED SO FAR: ${completed_steps.join(' → ')}`
          : '';

        const prompt = withLanguage(`Someone is completely frozen. They can't start, can't decide, can't move. This is NOT procrastination — it's paralysis. They need ONE micro-action, not a plan.

STUCK ON: "${stuck_on || 'not specified — just frozen'}"
CAN THEY PHYSICALLY MOVE? ${can_move === false ? 'No — they may be in bed or on the couch' : 'Yes, or unknown'}
STEP NUMBER: ${(completed_steps?.length || 0) + 1}
${stepContext}

RULES:
- Give ONE action. Not two. Not "and then." ONE.
- If this is step 1-3 and they can move: physical actions first (stand, walk, drink water). Physical movement breaks the freeze response.
- If they can't move: start even smaller (wiggle toes, shift weight, open eyes wider).
- Each action must have a clear completion signal — how they know they did it.
- Give explicit permission to stop after this step. "If you stop here, you moved. That matters."
- If they specified what they're stuck on AND they've done 3+ physical steps, start micro-stepping toward the task.
- Never give more than one action. Never include "and then" or "next."
- Tone: calm, steady, no enthusiasm. Like a quiet friend sitting next to them.

Return ONLY valid JSON:
{
  "step_number": ${(completed_steps?.length || 0) + 1},
  "instruction": "The ONE action. Short. Specific. 'Stand up from where you are sitting.'",
  "completion_signal": "How they know they did it. 'You're standing.'",
  "why_this": "One sentence: why this specific action matters right now.",
  "permission": "Explicit permission to stop after this. 'You can be done. You moved.'",
  "encouragement": "Brief, genuine. Not peppy. 'That was hard and you did it.'",
  "is_task_step": ${(completed_steps?.length || 0) >= 3 && stuck_on ? 'true' : 'false'}
}`, userLanguage);

        const parsed = await callClaudeWithRetry(prompt, { label: 'SS-Unfreeze', max_tokens: 400 });
        return res.json(parsed);
      }

      // ╔══════════════════════════════════════════════╗
      // ║  RECOVER MODE — (absorbs ShutdownRecoveryGuide) ║
      // ╚══════════════════════════════════════════════╝

      case 'recover': {
        const { crash_type, severity, duration, can_do, userLanguage } = req.body;

        if (!crash_type) {
          return res.status(400).json({ error: 'What kind of crash are you experiencing?' });
        }

        const prompt = withLanguage(`Someone has crashed and needs a recovery protocol. This is for when they're completely spent — not "tired" but "cannot function." The protocol must be matched to what they can actually do RIGHT NOW.

CRASH TYPE: ${crash_type}
SEVERITY: ${severity || 'severe'}
HOW LONG: ${duration || 'unknown'}
WHAT THEY CAN DO: "${can_do || 'not sure'}"

RULES:
- Match instructions to severity. "Severe" means they might not be able to get out of bed. Don't tell them to cook a meal.
- Hour 1 is SURVIVAL only: breathe, water if possible, stay safe. That's enough.
- Permission statements are critical — people in this state feel guilty for not functioning. Counter that directly.
- Be warm but extremely practical. No inspirational quotes. Just: "Drink water. That counts."
- Organize by what they can handle in stages, not by time necessarily — some people will be in the first stage for a full day.
- Include when to ask for help — specific, non-scary triggers.

Return ONLY valid JSON:
{
  "acknowledgment": "Warm, brief validation. 'You're not failing. Your system hit a wall. That's real.'",
  "current_read": "What their reported state tells you, in plain language.",
  "stages": [
    {
      "name": "Stage name — e.g., 'Right now' or 'When you can sit up'",
      "description": "What this stage is for.",
      "steps": ["Ultra-simple instructions. One sentence each. 'Drink water if it's nearby.' Not 'Go get water.'"],
      "enough_statement": "What counts as 'enough' at this stage. 'If you do nothing else today, breathing is enough.'"
    }
  ],
  "permissions": ["Explicit permission statements. 'You don't have to reply to messages.' 'The mess can wait.' 'Canceling plans is protecting yourself.'"],
  "basics_checklist": ["The absolute minimum needs. 'Water', 'Medication if you take any', 'Tell one person you're struggling (text counts)'"],
  "when_to_reach_out": "Specific, non-scary guidance on when to ask for help. Not 'call 911' unless warranted — more like 'If this lasts more than 3 days, text one person.'",
  "recovery_signs": ["How they'll know they're coming out of it. 'You'll notice you can think about tomorrow.' 'You'll feel annoyed instead of numb — that's actually progress.'"],
  "gentle_reminder": "One sentence they can come back to. The anchor."
}`, userLanguage);

        const parsed = await callClaudeWithRetry(prompt, { label: 'SS-Recover', max_tokens: 1000 });
        return res.json(parsed);
      }

      // ────────────────────────────────────────────
      // REFLECT — Post-spiral debrief
      // ────────────────────────────────────────────
      case 'reflect': {
        const { trigger, distortion, intensity_before, intensity_after, what_helped, userLanguage } = req.body;

        const prompt = withLanguage(`Someone just came through a spiral/freeze/crash and is debriefing. Help them learn from it.

TRIGGER: "${trigger || 'unknown'}"
DISTORTION: ${distortion || 'unknown'}
INTENSITY: ${intensity_before || '?'}/5 → ${intensity_after || '?'}/5
WHAT HELPED: "${what_helped || 'not sure'}"

Return ONLY valid JSON:
{
  "reflection": "2-3 sentences. What this episode shows about their patterns. Non-judgmental.",
  "pattern_insight": "If there's a recurring pattern (from distortion type), name it. 'You tend to catastrophize around work emails. Your brain has a groove for that specific spiral.' null if not enough info.",
  "prevention_tip": "One specific thing they could try next time they notice this trigger. Concrete, not vague.",
  "strength_noted": "Something genuine about how they handled it. 'You recognized the spiral and sought help — most people just spin.'"
}`, userLanguage);

        const parsed = await callClaudeWithRetry(prompt, { label: 'SS-Reflect', max_tokens: 400 });
        return res.json(parsed);
      }

      // ────────────────────────────────────────────
      // PATTERNS — Analyze spiral history
      // ────────────────────────────────────────────
      case 'patterns': {
        const { episode_log, userLanguage } = req.body;

        if (!episode_log?.length || episode_log.length < 3) {
          return res.status(400).json({ error: 'Need at least 3 logged episodes for pattern analysis.' });
        }

        const prompt = withLanguage(`Analyze this person's history of spirals, freezes, and crashes for patterns.

EPISODE LOG (most recent first):
${JSON.stringify(episode_log.slice(0, 20), null, 2)}

Return ONLY valid JSON:
{
  "total_episodes": ${episode_log.length},
  "most_common_type": "spiral|freeze|crash",
  "most_common_distortion": "The distortion that shows up most.",
  "trigger_patterns": ["Recurring trigger themes. e.g., 'Work email mistakes trigger 60% of your spirals.'"],
  "time_patterns": "Any patterns in when episodes happen. null if not detectable.",
  "improvement_trend": "Are episodes getting less intense over time? More spaced out? Be honest.",
  "biggest_insight": "The single most useful pattern observation.",
  "personalized_toolkit": [
    { "trigger": "Specific trigger", "best_response": "What's worked best for this trigger based on their data." }
  ],
  "encouragement": "Genuine, data-backed. 'Your average intensity dropped from 4.2 to 3.1 over the last month — your interventions are working.'"
}`, userLanguage);

        const parsed = await callClaudeWithRetry(prompt, { label: 'SS-Patterns', max_tokens: 700 });
        return res.json(parsed);
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }

  } catch (err) {
    console.error('SpiralStopper error:', err);
    res.status(500).json({ error: err.message || 'Something went wrong.' });
  }
});

module.exports = router;
