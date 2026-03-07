const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage } = require('../lib/claude');

// ═══════════════════════════════════════════════════
// SESSION MODE PERSONALITY DEFINITIONS
// ═══════════════════════════════════════════════════
const MODE_PERSONALITIES = {
  default: {
    instruction: 'You are a calm, encouraging coworking companion — like a friend sitting across the table while you both work. Not a coach, not a therapist. Just a presence.',
    tone: 'Warm but not saccharine. Brief. Human. Like texts from a supportive friend.',
    ambient: 'Gentle presence. Background coffee shop energy.',
  },
  deep_work: {
    instruction: 'You are a quiet library companion. Minimal words. You respect deep focus and only speak when truly needed. Think: a person at the next desk in a silent library who occasionally catches your eye and nods.',
    tone: 'Minimal. Almost silent. When you do speak, it\'s whispered and brief. Never interrupt flow. Fewer ambient messages, longer gaps.',
    ambient: 'Library silence. Rare, ultra-short messages like "📖" or "..." or just "🤫".',
  },
  sprint: {
    instruction: 'You are an energetic sprint partner. This is a short, intense burst of work. Think: gym buddy during a timed set. Encouraging, slightly urgent, celebratory about speed and momentum.',
    tone: 'Energetic. Brief punchy messages. Countdown energy. "Let\'s GO" vibe without being annoying. Acknowledge every small win.',
    ambient: 'High-energy micro-messages. "⚡", "keep moving", "🏃", "crushing it".',
  },
  grind: {
    instruction: 'You are a fellow soldier in the trenches doing boring, repetitive work alongside someone. You KNOW this sucks. Dark humor welcome. Commiserate genuinely. Make the boring bearable through solidarity, not fake enthusiasm.',
    tone: 'Solidarity. Dark humor. "We\'re both doing boring things and that\'s fine." Never pretend boring work is exciting. Validate the slog.',
    ambient: 'Trench humor. "☠️", "*stares at spreadsheet*", "still grinding", "🫠", "pain is temporary".',
  },
  creative: {
    instruction: 'You are a creative companion who understands that creative work is non-linear. Wandering is part of the process. Don\'t ask "are you on track?" — ask "what are you exploring?" Give permission to go sideways. Celebrate interesting tangents.',
    tone: 'Curious. Exploratory. Never judge detours. Ask "what caught your attention?" instead of "are you focused?" Celebrate discoveries.',
    ambient: 'Creative sparks. "✨", "what if...", "🎨", "*doodling*", "hmm interesting".',
  },
  avoidance_buster: {
    instruction: 'You are a compassionate companion helping someone tackle a task they\'ve been avoiding. You KNOW starting is the hardest part. Extra-gentle. Extra-small first steps. Celebrate just being here. Frequent reassurance. Never guilt.',
    tone: 'Extremely gentle. "The fact that you opened this tool is already a win." Tiny steps. Frequent permission to do the imperfect version. Celebrate every micro-action.',
    ambient: 'Gentle encouragement. "you\'re here 💛", "one piece at a time", "still proud of you", "🌱".',
  },
};

// ═══════════════════════════════════════════════════
// VIRTUAL BODY DOUBLE — v4 (10 routes)
// ═══════════════════════════════════════════════════
router.post('/virtual-body-double', async (req, res) => {
  const { action } = req.body;

  try {
    switch (action) {

      // ────────────────────────────────────────────
      // START — Create a coworking session plan
      // ────────────────────────────────────────────
      case 'start': {
        const { task, duration, checkInFrequency, environment, mood, goals, subTasks, mode, userLanguage } = req.body;

        if (!task?.trim()) {
          return res.status(400).json({ error: 'Tell me what you\'re working on.' });
        }

        const durationMin = parseInt(duration) || 30;
        const freqMin = parseInt(checkInFrequency) || 15;
        const numCheckIns = Math.max(1, Math.floor(durationMin / freqMin));
        const modeConfig = MODE_PERSONALITIES[mode] || MODE_PERSONALITIES.default;

        const prompt = withLanguage(`${modeConfig.instruction}

SESSION MODE: ${mode || 'default'}
MODE TONE: ${modeConfig.tone}

TASK: "${task.trim()}"
DURATION: ${durationMin} minutes
CHECK-IN EVERY: ${freqMin} minutes (${numCheckIns} check-ins total)
ENVIRONMENT: ${environment || 'not specified'}
CURRENT MOOD: ${mood || 'not specified'}
SESSION GOALS: ${goals || 'just get it done'}
${subTasks?.length ? `SUB-TASKS: ${subTasks.map((s, i) => `${i + 1}. ${s}`).join(', ')}` : ''}

Generate a complete session plan. Match the mode personality exactly.
${subTasks?.length ? 'Reference the sub-tasks in check-in messages.' : ''}

Also generate 4-6 "ambient" micro-messages matching this style:
AMBIENT STYLE: ${modeConfig.ambient}
Keep them under 6 words each.

Return ONLY valid JSON:
{
  "kickoff": {
    "greeting": "Opening message matching mode personality",
    "first_step": "One tiny concrete action to start",
    "environment_tip": "One environment suggestion (or null)"
  },
  "check_ins": [
    {
      "minute": 15,
      "message": "Check-in message matching mode tone",
      "stuck_prompt": "What to say if stuck",
      "sub_task_ref": "Which sub-task (or null)",
      "vibe": "curious|encouraging|playful|calm|intense|gentle"
    }
  ],
  "ambient_messages": ["Tiny micro-message matching mode (under 6 words)"],
  "break_suggestion": {
    "when": "Suggested break time",
    "duration": "5 min",
    "activity": "Specific break activity matching mode"
  },
  "completion": {
    "celebration": "Completion message matching mode",
    "reflection_prompt": "Reflection question"
  },
  "session_personality": {
    "name": "Buddy name matching mode vibe",
    "style": "1-2 words describing their vibe"
  }
}`, userLanguage);

        const parsed = await callClaudeWithRetry(prompt, {
          label: 'VBD-Start',
          max_tokens: 1800,
        });

        return res.json(parsed);
      }

      // ────────────────────────────────────────────
      // BREAKDOWN — AI breaks task into sub-tasks
      // ────────────────────────────────────────────
      case 'breakdown': {
        const { task, duration, mood, userLanguage } = req.body;

        if (!task?.trim()) {
          return res.status(400).json({ error: 'What task should I break down?' });
        }

        const durationMin = parseInt(duration) || 30;

        const prompt = withLanguage(`Break this task into concrete sub-tasks that fit within ${durationMin} minutes.

TASK: "${task.trim()}"
TIME AVAILABLE: ${durationMin} minutes
MOOD: ${mood || 'not specified'}

Rules:
- Each sub-task should be a specific, completable action
- Time estimates should add up to roughly ${durationMin} minutes
- If mood is tired/scattered, make sub-tasks smaller
- 3-6 sub-tasks max
- First one is easiest (momentum builder)
- Last one can be optional/"bonus"

Return ONLY valid JSON:
{
  "sub_tasks": [
    {
      "label": "Specific action in plain language",
      "estimated_minutes": 10,
      "difficulty": "easy|medium|hard",
      "tip": "One sentence hint (or null)"
    }
  ],
  "strategy_note": "Why you ordered them this way",
  "momentum_starter": "The literal first physical action"
}`, userLanguage);

        const parsed = await callClaudeWithRetry(prompt, {
          label: 'VBD-Breakdown',
          max_tokens: 800,
        });

        return res.json(parsed);
      }

      // ────────────────────────────────────────────
      // CHECK-IN — Respond to mid-session status
      // ────────────────────────────────────────────
      case 'check-in': {
        const { task, status, minutesElapsed, totalMinutes, currentCheckIn, totalCheckIns, sessionPersonality, note, currentSubTask, mode, userLanguage } = req.body;

        if (!status) {
          return res.status(400).json({ error: 'How\'s it going? Let me know your status.' });
        }

        const modeConfig = MODE_PERSONALITIES[mode] || MODE_PERSONALITIES.default;

        const prompt = withLanguage(`You are ${sessionPersonality?.name || 'a coworking buddy'} (vibe: ${sessionPersonality?.style || 'calm and supportive'}).

MODE: ${mode || 'default'}
MODE TONE: ${modeConfig.tone}

THEIR TASK: "${task}"
STATUS: ${status}
TIME: ${minutesElapsed}/${totalMinutes} minutes elapsed
CHECK-IN: ${currentCheckIn}/${totalCheckIns}
${currentSubTask ? `CURRENT SUB-TASK: "${currentSubTask}"` : ''}
${note ? `THEIR NOTE: "${note}"` : ''}

Respond naturally matching the mode personality. 1-3 sentences.
${mode === 'creative' ? 'If drifting, don\'t redirect — ask what caught their attention.' : ''}
${mode === 'avoidance_buster' ? 'Extra gentle. Even "I opened the tab" counts as progress.' : ''}
${mode === 'grind' ? 'Commiserate genuinely. Dark humor welcome.' : ''}
${mode === 'deep_work' ? 'Ultra-brief. 1 sentence max. Respect their focus.' : ''}
${mode === 'sprint' ? 'High energy. Acknowledge speed. Countdown urgency.' : ''}

Return ONLY valid JSON:
{
  "response": "Your message matching mode",
  "suggestion": "One micro-action if helpful, or null",
  "energy_check": true/false,
  "emoji": "One emoji matching mode vibe"
}`, userLanguage);

        const parsed = await callClaudeWithRetry(prompt, {
          label: 'VBD-CheckIn',
          max_tokens: 500,
        });

        return res.json(parsed);
      }

      // ────────────────────────────────────────────
      // COMPLETE — Session finished
      // ────────────────────────────────────────────
      case 'complete': {
        const { task, totalMinutes, checkInsCompleted, totalCheckIns, completionNote, moodBefore, moodAfter, sessionLog, subTasksCompleted, totalSubTasks, mode, userLanguage } = req.body;

        const modeConfig = MODE_PERSONALITIES[mode] || MODE_PERSONALITIES.default;

        const prompt = withLanguage(`You are a supportive coworking companion wrapping up a session.

MODE: ${mode || 'default'}
MODE TONE: ${modeConfig.tone}

TASK: "${task}"
DURATION: ${totalMinutes} minutes
CHECK-INS: ${checkInsCompleted}/${totalCheckIns} completed
${subTasksCompleted !== undefined ? `SUB-TASKS: ${subTasksCompleted}/${totalSubTasks} completed` : ''}
${completionNote ? `THEIR NOTES: "${completionNote}"` : ''}
MOOD: ${moodBefore || '?'} → ${moodAfter || '?'}
PAST SESSIONS: ${sessionLog?.length || 0} total sessions logged

Celebrate matching the mode.${subTasksCompleted !== undefined ? ' Mention sub-task progress.' : ''}

Also generate a "card_quote" — a punchy 6-10 word line summarizing this achievement. Think: something they'd screenshot and text to a friend.

Return ONLY valid JSON:
{
  "celebration": "Celebration matching mode",
  "accomplishment_reframe": "Reframe in terms of real progress",
  "card_quote": "6-10 word punchy line for shareable card",
  "pattern_note": "Pattern from 3+ sessions, or null",
  "streak_message": "Streak acknowledgment, or null",
  "next_suggestion": "Casual next session suggestion",
  "rest_permission": "Permission to rest"
}`, userLanguage);

        const parsed = await callClaudeWithRetry(prompt, {
          label: 'VBD-Complete',
          max_tokens: 900,
        });

        return res.json(parsed);
      }

      // ────────────────────────────────────────────
      // STUCK — Emergency unstick help
      // ────────────────────────────────────────────
      case 'stuck': {
        const { task, whatHappened, minutesElapsed, alreadyTried, currentSubTask, mode, userLanguage } = req.body;

        const modeConfig = MODE_PERSONALITIES[mode] || MODE_PERSONALITIES.default;

        const prompt = withLanguage(`Someone is stuck. Help them get unstuck.

MODE: ${mode || 'default'}
MODE TONE: ${modeConfig.tone}
TASK: "${task}"
${currentSubTask ? `CURRENT SUB-TASK: "${currentSubTask}"` : ''}
WHAT HAPPENED: "${whatHappened || 'Just can\'t get going'}"
TIME SPENT: ${minutesElapsed || '?'} minutes
${mode === 'avoidance_buster' ? 'EXTRA GENTLE. They\'re working on something they\'ve been avoiding.' : ''}

Return ONLY valid JSON:
{
  "diagnosis": "One sentence — why they're stuck",
  "immediate_action": "Literal next physical thing to do",
  "micro_steps": ["Step 1", "Step 2", "Step 3"],
  "permission": "An 'it's okay' statement",
  "environment_shift": "One physical change to try",
  "bailout_option": "A productive pivot"
}`, userLanguage);

        const parsed = await callClaudeWithRetry(prompt, {
          label: 'VBD-Stuck',
          max_tokens: 800,
        });

        return res.json(parsed);
      }

      // ────────────────────────────────────────────
      // EXTEND — Keep the session going
      // ────────────────────────────────────────────
      case 'extend': {
        const { task, minutesCompleted, additionalMinutes, energyLevel, userLanguage } = req.body;

        const prompt = withLanguage(`Someone just finished a ${minutesCompleted}-minute session on "${task}" and wants ${additionalMinutes || 15} more minutes. Energy: ${energyLevel || 'not specified'}/10.

Return ONLY valid JSON:
{
  "extension_message": "Brief encouragement",
  "mini_goal": "Specific thing to accomplish",
  "energy_advice": "Keep pushing / micro-break / consider stopping",
  "new_check_in": { "minute": 10, "message": "Extension check-in" }
}`, userLanguage);

        const parsed = await callClaudeWithRetry(prompt, {
          label: 'VBD-Extend',
          max_tokens: 500,
        });

        return res.json(parsed);
      }

      // ────────────────────────────────────────────
      // BREAK — Suggest a break activity
      // ────────────────────────────────────────────
      case 'break': {
        const { task, minutesWorked, breakDuration, environment, mood, userLanguage } = req.body;

        const prompt = withLanguage(`Someone worked on "${task}" for ${minutesWorked || '?'} minutes. Taking a ${breakDuration || 5}-min break. Environment: ${environment || '?'}. Mood: ${mood || '?'}.

Return ONLY valid JSON:
{
  "activity": "Specific break activity",
  "why": "Why this helps",
  "timer_message": "Display during break",
  "return_message": "Welcome back message"
}`, userLanguage);

        const parsed = await callClaudeWithRetry(prompt, {
          label: 'VBD-Break',
          max_tokens: 400,
        });

        return res.json(parsed);
      }

      // ────────────────────────────────────────────
      // INVITE — Generate coworking invite message
      // ────────────────────────────────────────────
      case 'invite': {
        const { task, duration, platform, relationship, userLanguage } = req.body;

        const prompt = withLanguage(`Generate a casual message inviting someone to virtual coworking.
TASK: "${task || 'some focused work'}" DURATION: ${duration || '30 minutes'} PLATFORM: ${platform || 'text'}

Return ONLY valid JSON:
{
  "messages": [
    { "tone": "casual", "text": "The message" },
    { "tone": "funny", "text": "A humorous version" }
  ],
  "platform_tip": "One tip for virtual coworking"
}`, userLanguage);

        const parsed = await callClaudeWithRetry(prompt, {
          label: 'VBD-Invite',
          max_tokens: 600,
        });

        return res.json(parsed);
      }

      // ────────────────────────────────────────────
      // REVIEW — Analyze session history
      // ────────────────────────────────────────────
      case 'review': {
        const { sessionLog, userLanguage } = req.body;

        if (!sessionLog?.length || sessionLog.length < 3) {
          return res.status(400).json({ error: 'Need at least 3 logged sessions to spot patterns.' });
        }

        const prompt = withLanguage(`Analyze this coworking session history. Be specific and actionable.

SESSION LOG (most recent first):
${JSON.stringify(sessionLog.slice(0, 20), null, 2)}

Return ONLY valid JSON:
{
  "total_sessions": 0,
  "total_minutes": 0,
  "completion_rate": "X%",
  "sweet_spot": {
    "best_duration": "Most productive length",
    "best_time": "Best focus time (if data)",
    "best_task_type": "What tasks they crush"
  },
  "patterns": [{ "observation": "Pattern", "suggestion": "What to do" }],
  "streak": { "current": 0, "longest": 0, "message": "Streak note" },
  "encouragement": "Genuine specific observation"
}`, userLanguage);

        const parsed = await callClaudeWithRetry(prompt, {
          label: 'VBD-Review',
          max_tokens: 1200,
        });

        return res.json(parsed);
      }

      // ────────────────────────────────────────────
      // CARD — Generate shareable session card data
      // ────────────────────────────────────────────
      case 'card': {
        const { task, totalMinutes, mode, buddyName, cardQuote, moodBefore, moodAfter, subTasksCompleted, totalSubTasks, streak, userLanguage } = req.body;

        const prompt = withLanguage(`Generate text for a shareable "session proof" card — like a mini achievement badge.

TASK: "${task}"
DURATION: ${totalMinutes} minutes
MODE: ${mode || 'default'}
BUDDY: ${buddyName || 'Buddy'}
CARD QUOTE: "${cardQuote || ''}"
MOOD: ${moodBefore || '?'} → ${moodAfter || '?'}
${subTasksCompleted !== undefined ? `SUB-TASKS: ${subTasksCompleted}/${totalSubTasks}` : ''}
${streak ? `STREAK: ${streak} sessions` : ''}

Return ONLY valid JSON:
{
  "achievement_title": "Short 3-5 word title (e.g., 'Deep Work Champion', 'Grind Survived')",
  "share_line": "1-sentence casual brag to text a friend",
  "badge_emoji": "One emoji representing this achievement"
}`, userLanguage);

        const parsed = await callClaudeWithRetry(prompt, {
          label: 'VBD-Card',
          max_tokens: 300,
        });

        return res.json(parsed);
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }

  } catch (err) {
    console.error('VirtualBodyDouble error:', err);
    res.status(500).json({ error: err.message || 'Something went wrong.' });
  }
});

module.exports = router;
