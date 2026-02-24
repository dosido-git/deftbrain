const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

// ── Robust JSON parser ──
function safeParseJSON(text) {
  let cleaned = cleanJsonResponse(text);
  cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
  try { return JSON.parse(cleaned); } catch {
    cleaned = cleaned.replace(/[\x00-\x1F\x7F]/g, ' ');
    try { return JSON.parse(cleaned); } catch {
      cleaned = cleaned.replace(/([{,]\s*)(\w+)\s*:/g, '$1"$2":');
      return JSON.parse(cleaned);
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// MAIN UNSTICK ENDPOINT
// ═══════════════════════════════════════════════════════════════

router.post('/freeze-state-unblocker', async (req, res) => {
  try {
    const { taskDescription, category, stillStuck, currentAction, userLanguage } = req.body;

    const contextParts = [];
    if (category) contextParts.push(`Category: ${category}`);
    if (taskDescription) contextParts.push(`What they're stuck on: "${taskDescription}"`);
    if (stillStuck && currentAction) contextParts.push(`Still stuck on: "${currentAction}" — they need EVEN SMALLER steps`);

    const contextBlock = contextParts.length > 0 ? contextParts.join('\n') : 'No context given — they may be too frozen to describe it. Default to general body movement.';

    const prompt = withLanguage(`You are a gentle, zero-pressure support system for someone experiencing a FREEZE STATE — executive dysfunction, depression paralysis, anxiety shutdown, or autistic freeze. They cannot start. They may not be able to think clearly. They need ONE tiny thing at a time.

YOUR ROLE:
- Remove ALL decision-making. You decide. They just do.
- Physical movement first — it breaks the neurological freeze loop.
- Each action must be completable in under 60 seconds.
- NEVER be preachy, motivational, or condescending. No "You've got this!" No "Just think positive!"
- Treat them like an intelligent adult whose brain chemistry is temporarily stuck.
- Permission to stop after EVERY step.
${stillStuck ? '\nIMPORTANT: They said the previous step was TOO BIG. Make your steps ABSURDLY small. If standing up was too much, try "wiggle your toes" or "take one deep breath." Match their current capacity which is VERY LOW.' : ''}

USER CONTEXT:
${contextBlock}

STEP DESIGN RULES:
${stillStuck ? `- Steps should be body-level micro-movements (blink, breathe, wiggle toes, flex hands)
- Max 3-4 steps, each completable without leaving current position
- Then GENTLY work up to slightly larger movements` : `- Start with 2-3 purely physical actions (stand, walk, water)
- Then 1-2 grounding actions (look at something, name things you see)
- If task was specified, end with 1-2 tiny task-adjacent steps (open the app, look at the file — NOT do the work)`}
- Total: 4-7 steps
- Each step must have a clear, observable completion signal

Return ONLY valid JSON:
{
  "acknowledgment": "One warm sentence. Validate their state without being saccharine. Example: 'Stuck is stuck. Let's just move one tiny thing.'",
  "first_micro_action": {
    "action": "The very first thing to do",
    "why_this_helps": "Brief neuroscience-lite explanation (1 sentence)",
    "just_this_one_thing": "Reassurance that this is the ONLY thing required",
    "time_estimate": "5 seconds"
  },
  "sequential_micro_actions": [
    {
      "step": 1,
      "action": "Ultra-specific physical action",
      "completion_signal": "Observable proof it's done",
      "encouragement": "Brief, non-cheesy acknowledgment (2-6 words). Examples: 'That counts.', 'Body moved. Brain follows.', 'Real progress.'"
    }
  ],
  "what_we_are_NOT_doing": {
    "not_solving": "We're not solving the whole problem right now",
    "not_forcing": "You can stop after any step — that's not quitting",
    "not_judging": "Being stuck says nothing about who you are"
  },
  "after_sequence": {
    "check_in": "Simple question: How are you feeling now?",
    "if_still_stuck": "Compassionate message if still stuck",
    "if_better": "Brief acknowledgment if they feel better",
    "permission_to_stop": "Explicit permission to be done"
  },
  "if_freeze_is_about_specific_task": ${taskDescription ? `{
    "task_identified": "The task they mentioned",
    "smallest_possible_step": "The absolute tiniest entry point to that task",
    "permission": "You don't have to finish. Just this."
  }` : 'null'}
}

CRITICAL: Return ONLY valid JSON. No markdown fences, no preamble.`, userLanguage);

    console.log(`[FreezeStateUnblocker] ${stillStuck ? 'STILL STUCK' : 'New'} | Category: ${category || 'none'} | Task: ${taskDescription ? 'yes' : 'no'}`);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = message.content.find(item => item.type === 'text')?.text || '';
    const parsed = safeParseJSON(raw);
    res.json(parsed);

  } catch (error) {
    console.error('[FreezeStateUnblocker] Error:', error);
    res.status(500).json({ error: error.message || 'Something went wrong. Try pressing the button again.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// PATTERN ANALYSIS — analyzes session history for insights
// ═══════════════════════════════════════════════════════════════

router.post('/freeze-state-unblocker/patterns', async (req, res) => {
  try {
    const { sessions, userLanguage } = req.body;

    if (!sessions || sessions.length < 5) {
      return res.status(400).json({ error: 'Need at least 5 sessions for pattern analysis' });
    }

    const sessionSummary = sessions.slice(0, 30).map((s, i) => {
      const d = new Date(s.date);
      return `Session ${i + 1}: ${d.toLocaleDateString('en-US', { weekday: 'short' })} ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} | Category: ${s.category || 'general'} | Task: ${s.task || 'unspecified'} | Steps: ${s.stepsCompleted}/${s.totalSteps} | Check-in: ${s.checkIn || 'none'}`;
    }).join('\n');

    const prompt = withLanguage(`You are analyzing freeze state patterns for someone who experiences executive dysfunction. You have their session history. Find genuinely useful patterns — NOT generic self-help advice.

SESSION HISTORY (most recent first):
${sessionSummary}

ANALYSIS RULES:
- Look for TIME patterns (morning vs evening, specific days of week)
- Look for CATEGORY patterns (do they freeze more on work vs chores?)
- Look for EFFECTIVENESS patterns (which sessions ended with "better" vs "same" vs "worse"?)
- Look for STEP COMPLETION patterns (do they complete more physical steps or task-adjacent ones?)
- Be specific. "You tend to freeze on Monday mornings" is useful. "Try to be more organized" is useless.
- Acknowledge this data compassionately — these aren't failures, they're information.
- Avoid clinical language. No diagnoses. No prescriptions.

Return ONLY valid JSON:
{
  "patterns_found": [
    {
      "pattern": "Clear, specific observation",
      "evidence": "What data supports this",
      "insight": "Why this might be happening (gentle speculation, not diagnosis)"
    }
  ],
  "what_helps_you_most": "Based on their check-in data, what approach seems to work best for them specifically",
  "gentle_suggestion": "One concrete, tiny adjustment they could try — not a life overhaul",
  "affirmation": "A genuine, non-cheesy acknowledgment of what the data shows about their effort"
}

CRITICAL: Return ONLY valid JSON. No markdown fences, no preamble.`, userLanguage);

    console.log(`[FreezeStateUnblocker/patterns] Analyzing ${sessions.length} sessions`);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = message.content.find(item => item.type === 'text')?.text || '';
    const parsed = safeParseJSON(raw);
    res.json(parsed);

  } catch (error) {
    console.error('[FreezeStateUnblocker/patterns] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze patterns' });
  }
});

module.exports = router;
