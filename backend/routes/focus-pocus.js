const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

// ═══════════════════════════════════════════════════════════════
// POST /focus-pocus — Generate AI break plan (v1)
// ═══════════════════════════════════════════════════════════════
router.post('/focus-pocus', async (req, res) => {
  try {
    const { activity, plannedMinutes, actualMinutes, overtimeMinutes, missedNeeds, upcomingObligations, snoozeCount, userLanguage } = req.body;

    if (!activity || !activity.trim()) {
      return res.status(400).json({ error: 'Activity is required' });
    }

    const overtime = overtimeMinutes || 0;
    const snoozes = snoozeCount || 0;
    const planned = plannedMinutes || 25;
    const actual = actualMinutes || planned;

    const prompt = withLanguage(`You are a firm but caring focus coach helping someone transition out of a deep work session. Your tone should match the urgency level — gentle if they stopped on time, increasingly direct if they've been going way past their session.

SESSION DATA:
- Activity: ${activity}
- Planned session: ${planned} minutes
- Actual time spent: ${actual} minutes
- Overtime (past session end): ${overtime} minutes
- Times they hit "5 more minutes": ${snoozes}
- Missed needs they mentioned: ${missedNeeds || 'none specified'}
- Upcoming obligations: ${upcomingObligations || 'none specified'}

URGENCY CALIBRATION:
${overtime === 0 ? '- They stopped ON TIME. Be warm and congratulatory. Gentle break suggestion.' : ''}
${overtime > 0 && overtime <= 15 ? '- Slightly over. Acknowledge it lightly, firm but friendly.' : ''}
${overtime > 15 && overtime <= 45 ? '- Significantly over. Be direct. Their body needs attention NOW.' : ''}
${overtime > 45 ? '- WAY over. This is urgent. Be blunt and caring. They may have forgotten to eat, drink, or move for hours.' : ''}
${snoozes >= 3 ? '- They snoozed multiple times. They KNOW they should stop. Be the friend who physically takes the laptop away.' : ''}

Generate a break intervention with these sections:

1. HEADLINE (headline): A short, punchy message (under 15 words). Match urgency to overtime.
   - On time: Something warm like "Great session! Time to recharge."
   - Way over: Something urgent like "STOP. Your body has been waiting ${overtime} minutes for you."

2. MESSAGE (message): 2-3 sentences explaining why they should break NOW. Reference their specific activity. If they've been overtime, mention concrete physical effects (dehydration, eye strain, muscle stiffness, blood sugar). Don't lecture — be the smart friend who cares.

3. MANDATORY ACTIONS (mandatory_actions): Array of 3-5 specific, immediate things to do. These should be concrete and quick (under 2 minutes each). Always include water and standing up. Tailor to activity and duration:
   - Coding for hours → eye rest (20-20-20 rule), wrist stretches
   - Gaming → posture reset, eye distance refocus
   - Research → break the mental loop, physical grounding
   - If they mentioned missed needs, address those first
   - If they have upcoming obligations, include a prep action

4. BODY CHECK (body_check): Object with quick status indicators:
   - hydration: string describing likely hydration state
   - hunger: string describing likely hunger state  
   - posture: string describing likely posture state
   - eyes: string describing likely eye strain state
   - movement: string describing likely movement state
   (Base these on activity type and duration — someone coding for 3 hours has different needs than someone reading for 30 minutes)

5. RE-ENTRY PLAN (re_entry): A brief suggestion for how to resume their activity after the break, IF they should resume at all. If they've been going for a very long time, suggest they might be done for now. Include a specific "bookmark" technique — e.g., "write down exactly where you are in one sentence before walking away."

6. NEXT SESSION (next_session): Suggest an appropriate duration for their next session based on how this one went. If they went way overtime, suggest a shorter next session with a harder boundary.

Return ONLY valid JSON (no markdown, no preamble, no code fences):

{
  "headline": "short punchy headline",
  "message": "2-3 sentence break message",
  "mandatory_actions": ["action 1", "action 2", "action 3"],
  "body_check": {
    "hydration": "status string",
    "hunger": "status string",
    "posture": "status string",
    "eyes": "status string",
    "movement": "status string"
  },
  "re_entry": "how to resume after break",
  "next_session": "suggested next session duration and advice"
}

CRITICAL: Be specific to their activity. Do NOT give generic advice. Reference what they were actually doing.`, userLanguage);

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    });

    const textContent = message.content.find(item => item.type === 'text')?.text || '';

    const cleaned = cleanJsonResponse(textContent);
    const parsed = JSON.parse(cleaned);

    res.json(parsed);

  } catch (error) {
    console.error('[FocusPocus] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate break plan' });
  }
});

// ═══════════════════════════════════════════════════════════════
// POST /focus-pocus/patterns — AI behavioral analysis (v2)
// Frontend sends: { history: [...], multiDayStreak: {...} }
// ═══════════════════════════════════════════════════════════════
router.post('/focus-pocus/patterns', async (req, res) => {
  try {
    const { history, multiDayStreak, userLanguage } = req.body;

    if (!history || !Array.isArray(history) || history.length < 5) {
      return res.status(400).json({ error: 'At least 5 sessions are needed for pattern analysis.' });
    }

    // Build a compact summary (keep token count reasonable)
    const sessionSummaries = history.slice(0, 50).map(s => ({
      date: s.date,
      activity: s.activity,
      plannedMin: s.plannedMin,
      actualMin: s.actualMin,
      overtimeMin: s.overtimeMin || 0,
      score: s.score,
      distractions: s.distractions || 0,
      distractionTypes: s.distractionTypes || [],
      pauseCount: s.pauseCount || 0,
      accomplishment: s.accomplishment,
      note: s.note || null,
    }));

    const streakInfo = multiDayStreak
      ? `Current streak: ${multiDayStreak.currentStreak} days, Longest: ${multiDayStreak.longestStreak} days, Total minutes: ${multiDayStreak.totalMinutes}`
      : 'No streak data available';

    const prompt = withLanguage(`You are an expert focus and productivity analyst. Analyze this person's focus session history and provide deep behavioral insights. Be specific, data-driven, and genuinely useful — not generic self-help fluff.

SESSION HISTORY (${sessionSummaries.length} sessions):
${JSON.stringify(sessionSummaries, null, 1)}

STREAK DATA: ${streakInfo}

Analyze their patterns and return ONLY valid JSON (no markdown, no preamble, no code fences):

{
  "focus_profile": {
    "title": "A creative 2-3 word archetype name (e.g. 'The Deep Diver', 'The Sprint Master', 'The Night Owl Grinder')",
    "emoji": "A single emoji that captures their style",
    "description": "2-3 sentences describing their unique focus personality based on real patterns in the data. Reference specific things you see."
  },
  "peak_performance": {
    "best_time": "When they perform best (time of day if dates show patterns, or 'Not enough data')",
    "worst_time": "When they perform worst or are most distracted",
    "optimal_duration": "Their actual sweet-spot session length based on scores vs duration",
    "sweet_spot_insight": "One sentence about their ideal conditions"
  },
  "distraction_analysis": {
    "primary_trigger": "Their #1 distraction type or pattern",
    "pattern": "When/how distractions tend to hit (e.g. 'after 20 minutes', 'during morning sessions')",
    "strategy": "One specific, actionable strategy tailored to THEIR pattern"
  },
  "growth": {
    "trajectory": "improving" or "declining" or "stable" or "volatile",
    "early_avg_score": <number — average score of first 5 sessions>,
    "recent_avg_score": <number — average score of last 5 sessions>,
    "insight": "One sentence about their growth trajectory"
  },
  "core_blocker": "The single biggest thing holding them back, stated directly (1 sentence)",
  "prescription": "One specific behavioral change that would have the biggest impact (1-2 sentences)",
  "weekly_strategy": "A concrete weekly focus plan based on their patterns (2-3 sentences)",
  "share_snippet": "A fun, shareable 1-liner about their focus style (casual tone, could post on social media)"
}

RULES:
- Base EVERYTHING on the actual data. Reference specific numbers, activities, and patterns.
- Don't make up data points. If something isn't clear from the data, say so.
- Be honest about weaknesses — these people want to improve, not be coddled.
- The share_snippet should be playful and specific, not generic.`, userLanguage);

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    });

    const textContent = message.content.find(item => item.type === 'text')?.text || '';

    const cleaned = cleanJsonResponse(textContent);
    const parsed = JSON.parse(cleaned);

    res.json(parsed);

  } catch (error) {
    console.error('[FocusPocus/patterns] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze focus patterns' });
  }
});

// ═══════════════════════════════════════════════════════════════
// POST /focus-pocus/break-coach — AI break coaching (v2)
// Frontend sends: { sessionNote, activity, elapsedMin }
// Returns: { acknowledgment, physical_reset, mental_transition, resume_tip }
// ═══════════════════════════════════════════════════════════════
router.post('/focus-pocus/break-coach', async (req, res) => {
  try {
    const { sessionNote, activity, elapsedMin, userLanguage } = req.body;

    if (!activity || !activity.trim()) {
      return res.status(400).json({ error: 'Activity is required' });
    }

    const note = sessionNote || '';
    const elapsed = elapsedMin || 25;

    const prompt = withLanguage(`You are a mindful break coach — part sports psychologist, part meditation teacher. Someone just finished a focus session and needs help transitioning into a restorative break. Your goal: help them actually recover, not just pause.

SESSION CONTEXT:
- Activity: ${activity}
- Duration: ${elapsed} minutes
${note ? `- Their session note/bookmark: "${note}"` : '- No session note left'}

COACHING APPROACH:
- If they left a note, acknowledge what they were working on specifically
- Tailor physical reset to their activity type (coding = wrists/eyes, reading = posture/movement, creative = grounding)
- The mental transition should help them actually detach, not just think about detaching
- The resume tip should reference their note if they left one

Return ONLY valid JSON (no markdown, no preamble, no code fences):

{
  "acknowledgment": "1-2 sentences acknowledging their session. If they left a note, reference it specifically. Be warm and specific, not generic praise.",
  "physical_reset": "A specific 2-3 minute physical activity tailored to what they were doing. Be precise — name the stretch, the movement, the position. Not just 'stretch a bit'.",
  "mental_transition": "A specific mental exercise to help them detach from work mode. Could be a breathing technique, a sensory grounding exercise, or a brief mindfulness practice. Be specific enough to follow.",
  "resume_tip": "How to pick back up smoothly when they return. If they left a session note, reference it. Include a specific re-entry technique."
}

CRITICAL: Be specific to their activity and session. Generic advice is useless. Reference what they were actually doing.`, userLanguage);

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
    });

    const textContent = message.content.find(item => item.type === 'text')?.text || '';

    const cleaned = cleanJsonResponse(textContent);
    const parsed = JSON.parse(cleaned);

    res.json(parsed);

  } catch (error) {
    console.error('[FocusPocus/break-coach] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate break coaching' });
  }
});

module.exports = router;
