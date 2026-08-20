const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

// ═══════════════════════════════════════════════════
// SESSION MODE PERSONALITY DEFINITIONS
// ═══════════════════════════════════════════════════
// Injected into every prompt that puts words in the companion's mouth.
const COMPANION_VOICE = `
VOICE — you are a person sitting nearby, not a productivity coach:
- Say the thing, then stop. Never explain why the suggestion works; a friend
  does not justify themselves, and the justification is what makes it coaching.
- No technique names, no pep-talk verbs, no "remember that...", no reframing
  their feelings back at them.
- First person is fine. You are in the room.
- Use contractions. Apostrophes are safe and a companion who says "we have got
  45 minutes" instead of "we've got 45 minutes" sounds like a form letter.
NO:  "Just open the doc and let it be ugly for now."
YES: "Let's just get the document open. Nothing has to be good yet."
NO:  "Put your phone face-down and maybe grab a drink so you have one less reason to get up."
YES: "One small favour: move the phone out of reach."
NO:  "Take a deep breath and remember that progress beats perfection."
YES: "I'm here. Start anywhere."
The exception is the first concrete step, which SHOULD be specific and
actionable — for a performance review, "Type one sentence about anything you
got done this year, even if it feels small." That one is a real instruction,
and it is welcome.

The pairs above are TONE samples from a different session. Never reuse their
wording, and never open a message with the same words twice — write for the
task in front of you.`;

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
    instruction: 'You are sitting alongside someone in the middle of a long, repetitive stretch of work. You KNOW it is dull. Do not pretend otherwise and do not try to make it exciting. Company and honesty are what help here: acknowledge the slog, keep them steady, and make the hours feel less solitary.',
    tone: 'Steady, wry, unhurried. "We are both grinding through something dull and that is fine." Never manufacture enthusiasm. Validate the slog without dramatising it.',
    ambient: 'Dry, low-key. "still going", "*stares at spreadsheet*", "🫠", "one more row", "halfway".',
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

// Shared JSON-output rules appended to every prompt: brevity (avoids German
// truncation after de-annotation) + the no-inner-double-quote rule (quoted
// speech in German → unescaped " → invalid JSON → 500).
const JSON_RULES = 'RULES: Keep each field to one tight sentence unless the schema says otherwise. Never place a double-quote (") character inside any JSON string value — it breaks the JSON.';

// ═══════════════════════════════════════════════════
// VIRTUAL BODY DOUBLE — v4 (10 routes)
// ═══════════════════════════════════════════════════
router.post('/virtual-body-double', rateLimit(DEFAULT_LIMITS), async (req, res) => {
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
        const modeConfig = MODE_PERSONALITIES[mode] || MODE_PERSONALITIES.default;

        const prompt = withLanguage(`${modeConfig.instruction}

SESSION MODE: ${mode || 'default'}
MODE TONE: ${modeConfig.tone}

TASK: "${task.trim()}"
DURATION: ${durationMin} minutes
CHECK-IN EVERY: ${freqMin} minutes (delivered separately — do NOT include check-in messages in this response)
ENVIRONMENT: ${environment || 'not specified'}
CURRENT MOOD: ${mood || 'not specified'}
SESSION GOALS: ${goals || 'just get it done'}
${req.body.companionName ? `COMPANION NAME: ${String(req.body.companionName).slice(0, 40)} — this person has worked with you before. Use this EXACT name in session_personality.name; do not invent a new one. Your style may change with the mode; your name does not.` : ''}
${subTasks?.length ? `SUB-TASKS: ${subTasks.map((s, i) => `${i + 1}. ${s}`).join(', ')}` : ''}

Generate a complete session plan. Match the mode personality exactly.
${COMPANION_VOICE}


Also generate 4-6 "ambient" micro-messages matching this style:
AMBIENT STYLE: ${modeConfig.ambient}
Keep them under 6 words each.

Return ONLY valid JSON:
{
  "kickoff": {
    "greeting": "Opening message matching mode personality",
    "first_step": "One tiny concrete action to start",
    "environment_tip": "One small physical ask that protects their attention - something to move or put away, not advice about focus. Open it differently each time. Never the words null or none; if nothing fits, offer to sit quietly instead."
  },
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
}

${JSON_RULES}`, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);

        const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'VBD-Start' });

        if (!parsed.kickoff && !parsed.check_in) {
          return res.status(500).json({ error: 'Could not start the session. Please try again.' });
        }
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
- If mood is tired/scattered/overwhelmed, make sub-tasks smaller
- 3-6 sub-tasks max
- First one is easiest (momentum builder)
- Last one can be optional/"bonus"

Return ONLY valid JSON:
{
  "sub_tasks": [
    {
      "label": "Specific action in plain language",
      "estimated_minutes": 10,
      "difficulty": "easy",
      "tip": "One sentence hint (or null)"
    }
  ],
  "strategy_note": "Why you ordered them this way",
  "momentum_starter": "The literal first physical action"
}

"difficulty" MUST be exactly one of these English lowercase codes — easy, medium, hard — regardless of the output language. Do NOT translate it.

${JSON_RULES}`, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);

        const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'VBD-Breakdown' });

        if (!parsed.sub_tasks) {
          return res.status(500).json({ error: 'Could not start the session. Please try again.' });
        }
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
${COMPANION_VOICE}
${mode === 'creative' ? 'If drifting, don\'t redirect — ask what caught their attention.' : ''}
${mode === 'avoidance_buster' ? 'Extra gentle. Even "I opened the tab" counts as progress.' : ''}
${mode === 'grind' ? 'Commiserate genuinely. Dry humour welcome, but never make the work sound heroic or grim.' : ''}
${mode === 'deep_work' ? 'Ultra-brief. 1 sentence max. Respect their focus.' : ''}
${mode === 'sprint' ? 'High energy. Acknowledge speed. Countdown urgency.' : ''}

Return ONLY valid JSON:
{
  "response": "Your message matching mode",
  "suggestion": "One micro-action if helpful, or null",
  "emoji": "One emoji matching mode vibe"
}

${JSON_RULES}`, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);

        const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'VBD-CheckIn' });

        if (!parsed.response) {
          return res.status(500).json({ error: 'Could not start the session. Please try again.' });
        }
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
}

${JSON_RULES}`, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);

        const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 1800,
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'VBD-Complete' });

        if (!parsed.celebration) {
          return res.status(500).json({ error: 'Could not start the session. Please try again.' });
        }
        return res.json(parsed);
      }

      // ────────────────────────────────────────────
      // STUCK — Emergency unstick help
      // ────────────────────────────────────────────
      case 'stuck': {
        const { task, whatHappened, minutesElapsed, currentSubTask, mode, userLanguage } = req.body;

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
}

${JSON_RULES}`, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);

        const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'VBD-Stuck' });

        if (!parsed.diagnosis) {
          return res.status(500).json({ error: 'Could not start the session. Please try again.' });
        }
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
  "energy_advice": "Keep pushing / micro-break / consider stopping"
}

${JSON_RULES}`, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);

        const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'VBD-Extend' });

        if (!parsed.extension_message) {
          return res.status(500).json({ error: 'Could not start the session. Please try again.' });
        }
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
  "return_message": "Welcome back message"
}

${JSON_RULES}`, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);

        const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'VBD-Break' });

        if (!parsed.activity) {
          return res.status(500).json({ error: 'Could not start the session. Please try again.' });
        }
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
}

${JSON_RULES}`, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);

        const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'VBD-Review' });

        if (parsed.total_sessions === undefined) {
          return res.status(500).json({ error: 'Could not start the session. Please try again.' });
        }
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
}

${JSON_RULES}`, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);

        const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'VBD-Card' });

        if (!parsed.achievement_title) {
          return res.status(500).json({ error: 'Could not start the session. Please try again.' });
        }
        return res.json(parsed);
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }

  } catch (err) {
    console.error('VirtualBodyDouble error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
