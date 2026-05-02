const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

const BODY_AREAS = {
  'stiff-neck': 'Stiff/tight neck and shoulders',
  'sore-back': 'Sore or tight lower back',
  'tight-hips': 'Tight hips and hip flexors from sitting',
  'restless-legs': 'Restless or heavy legs',
  'general-tension': 'General body tension and stress',
  'just-blah': 'No specific complaints, just low energy',
  'wrists-hands': 'Sore wrists/hands (typing, phone use)',
  'stiff-all-over': 'Stiff everywhere — haven\'t moved in a while'
};

const CONTEXTS = {
  'long-meeting': 'Just finished a long meeting/class (1+ hours sitting, mentally drained)',
  'bad-sleep': 'Slept badly (under 5 hours, restless, woke up multiple times)',
  'screen-marathon': 'Been staring at screens for hours (eyes tired, neck stiff, brain foggy)',
  'emotional-day': 'Emotionally draining day (stress, anxiety, sadness, overwhelm)',
  'ate-too-much': 'Ate too much / food coma (bloated, sluggish, regretful)',
  'hungover': 'Hungover or recovering from a rough night',
  'travel-day': 'Travel day (been in a car/plane/train, cramped, dehydrated)',
  'period-cramps': 'Period cramps or menstrual discomfort',
  'just-woke-up': 'Just woke up (groggy, stiff, need to ease in)',
  'been-standing': 'Been on feet all day (sore feet, tired legs, lower back)',
  'pre-event-nerves': 'Anxious about something coming up (interview, date, presentation)',
  'post-argument': 'After a difficult conversation or conflict (tense, activated, unsettled)'
};

// ═══════════════════════════════════════════════════
// ROUTE 1: RIGHT NOW — Energy + context-aware workout
// ═══════════════════════════════════════════════════
router.post('/lazy-workout-adapter', async (req, res) => {
  try {
    const { energy, bodyAreas, timeMinutes, limitations, setting, completionCount, preferences, contexts, userLanguage } = req.body;
    if (!energy && energy !== 0) return res.status(400).json({ error: 'How\'s your energy right now?' });

    const energyNum = parseInt(energy);
    const progressionLevel = Math.min(Math.floor((completionCount || 0) / 10), 5);
    const bodyContext = (bodyAreas || []).map(b => BODY_AREAS[b] || b).join(', ');
    const contextDesc = (contexts || []).map(ct => CONTEXTS[ct] || ct).join('. ');

    const prompt = withLanguage(`Create a genuinely low-barrier workout. Meet them where they are.

ENERGY: ${energyNum}/10 ${energyNum <= 3 ? '(very low — be gentle)' : energyNum <= 6 ? '(moderate)' : '(decent — can push a bit)'}
BODY: ${bodyContext || 'No specifics'}
${contextDesc ? `WHAT HAPPENED: ${contextDesc}` : ''}
TIME: ${timeMinutes || '10'} min${timeMinutes && parseInt(timeMinutes) <= 5 ? ' (SHORT)' : ''}
SETTING: ${setting || 'home'}
LIMITATIONS: ${limitations || 'None'}
${preferences?.hated?.length ? `DISLIKE (NEVER include): ${preferences.hated.join(', ')}` : ''}
${preferences?.loved?.length ? `LIKE (favor): ${preferences.loved.join(', ')}` : ''}
PROGRESSION: ${progressionLevel}/5 (invisible — do not mention)

RULES:
- If WHAT HAPPENED is provided, tailor specifically to that situation.
- Energy 1-3: feels like stretching. Floor-based. No standing at 1-2.
- Energy 4-6: gentle mix. Energy 7-10: moderate but accessible.
- Every exercise has a "too much?" fallback and a "do while" multitask option.
- Warm, casual, zero-guilt.

Return ONLY valid JSON:
{
  "workout_name": "Casual name",
  "vibe": "One warm sentence. If context provided, acknowledge it.",
  "total_time": "${timeMinutes || '10'} minutes",
  "exercises": [{ "name": "name", "duration": "time", "how": "conversational instructions", "why": "why this helps NOW", "too_much": "easier version", "do_while": "multitask option", "body_area": "target" }],
  "rest_note": "generous rest guidance",
  "barrier_check": { "clothes": "current clothes fine", "space": "space needed", "noise": "apartment-friendly?", "equipment": "none or what helps" },
  "done_is_done": "warm half-is-fine message",
  "if_you_want_more": "optional extra"
}`, userLanguage);

    const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: withLanguage('Low-pressure movement coach. Any movement counts. Never guilt-trip. Warm, casual, zero-judgment. Return ONLY valid JSON. No markdown.', userLanguage),
        messages: [{ role: 'user', content: prompt }],
      });
      const text = message.content.find(b => b.type === 'text')?.text || '';
      const cleaned = cleanJsonResponse(text);
      const parsed = JSON.parse(cleaned);
    res.json(parsed);
  } catch (error) {
    console.error('[LazyWorkout]', error);
    res.status(500).json({ error: error.message || 'Failed to create workout.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 2: MICRO — 2-minute floor
// ═══════════════════════════════════════════════════
router.post('/lazy-workout-adapter-micro', async (req, res) => {
  try {
    const { bodyAreas, position, userLanguage } = req.body;
    const bodyContext = (bodyAreas || []).map(b => BODY_AREAS[b] || b).join(', ');

    const prompt = withLanguage(`2-minute micro session. Three movements, 40 seconds each. For someone who can't do more right now.
BODY: ${bodyContext || 'Just blah'} | POSITION: ${position || 'sitting or lying down'}
Rules: feels like stretching. Feels good immediately. No standing unless specified. Effortless transitions.

Return ONLY valid JSON:
{ "session_name": "name", "total_time": "2 minutes", "message": "one warm sentence",
  "movements": [{ "name": "name", "seconds": 40, "how": "one sentence", "feels_like": "sensation" }],
  "after": "what to notice after" }`, userLanguage);

    const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: withLanguage('Gentle movement guide. 2 minutes is a win. Return ONLY valid JSON. No markdown.', userLanguage),
        messages: [{ role: 'user', content: prompt }],
      });
      const text = message.content.find(b => b.type === 'text')?.text || '';
      const cleaned = cleanJsonResponse(text);
      const parsed = JSON.parse(cleaned);
    res.json(parsed);
  } catch (error) {
    console.error('[LazyWorkoutMicro]', error);
    res.status(500).json({ error: error.message || 'Failed to create micro session.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 3: WEEK — Weekly movement menu
// ═══════════════════════════════════════════════════
router.post('/lazy-workout-adapter-week', async (req, res) => {
  try {
    const { typicalEnergy, limitations, preferences, completionCount, userLanguage } = req.body;
    const progressionLevel = Math.min(Math.floor((completionCount || 0) / 10), 5);

    const prompt = withLanguage(`7-day movement menu. NOT a training program.
ENERGY: ${JSON.stringify(typicalEnergy || {})} | LIMITATIONS: ${limitations || 'None'}
${preferences?.hated?.length ? `AVOID: ${preferences.hated.join(', ')}` : ''}
PROGRESSION: ${progressionLevel}/5 (invisible)
Rules: every day has minimum (2-5 min) + feeling-it (10-15 min). 2+ rest days. Variety. Menu not mandate.

Return ONLY valid JSON:
{ "plan_name": "name", "philosophy": "one sentence",
  "days": [{ "day": "Monday", "theme": "theme", "minimum": { "name": "n", "time": "t", "description": "d" }, "feeling_it": { "name": "n", "time": "t", "description": "d" }, "skip_day_note": "alt" }],
  "weekly_note": "warm note (success != 7/7)" }`, userLanguage);

    const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 3000,
        system: withLanguage('Low-pressure weekly planner. Menu, not mandate. Return ONLY valid JSON. No markdown.', userLanguage),
        messages: [{ role: 'user', content: prompt }],
      });
      const text = message.content.find(b => b.type === 'text')?.text || '';
      const cleaned = cleanJsonResponse(text);
      const parsed = JSON.parse(cleaned);
    res.json(parsed);
  } catch (error) {
    console.error('[LazyWorkoutWeek]', error);
    res.status(500).json({ error: error.message || 'Failed to plan week.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 4: ADAPT — Easier/harder mid-workout
// ═══════════════════════════════════════════════════
router.post('/lazy-workout-adapter-adapt', async (req, res) => {
  try {
    const { exercise, direction, context, userLanguage } = req.body;
    if (!exercise?.trim()) return res.status(400).json({ error: 'Which exercise?' });
    const prompt = withLanguage(`Adapt "${exercise}" ${direction === 'easier' ? 'DOWN' : 'UP'}. ${context ? `Context: "${context}"` : ''}
Return ONLY valid JSON: { "adapted": { "name": "n", "how": "instructions", "change": "what changed" }, "message": "brief note" }`, userLanguage);
    const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 600,
        system: withLanguage('Movement adapter. Return ONLY valid JSON. No markdown.', userLanguage),
        messages: [{ role: 'user', content: prompt }],
      });
      const text = message.content.find(b => b.type === 'text')?.text || '';
      const cleaned = cleanJsonResponse(text);
      const parsed = JSON.parse(cleaned);
    res.json(parsed);
  } catch (error) { console.error('[LazyWorkoutAdapt]', error); res.status(500).json({ error: error.message || 'Failed.' }); }
});

// ═══════════════════════════════════════════════════
// ROUTE 5: SWAP — Replace exercise
// ═══════════════════════════════════════════════════
router.post('/lazy-workout-adapter-swap', async (req, res) => {
  try {
    const { exercise, reason, bodyArea, energy, userLanguage } = req.body;
    if (!exercise?.trim()) return res.status(400).json({ error: 'Which exercise?' });
    const prompt = withLanguage(`Replace "${exercise}" — same area, different feel. Area: ${bodyArea || 'general'} | Energy: ${energy || '5'}/10
Return ONLY valid JSON: { "replacement": { "name": "n", "duration": "t", "how": "instructions", "why_instead": "reason", "do_while": "multitask" }, "message": "no guilt" }`, userLanguage);
    const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 600,
        system: withLanguage('Exercise swapper. No guilt. Return ONLY valid JSON. No markdown.', userLanguage),
        messages: [{ role: 'user', content: prompt }],
      });
      const text = message.content.find(b => b.type === 'text')?.text || '';
      const cleaned = cleanJsonResponse(text);
      const parsed = JSON.parse(cleaned);
    res.json(parsed);
  } catch (error) { console.error('[LazyWorkoutSwap]', error); res.status(500).json({ error: error.message || 'Failed.' }); }
});

// ═══════════════════════════════════════════════════
// ROUTE 6: BODY — Targeted relief
// ═══════════════════════════════════════════════════
router.post('/lazy-workout-adapter-body', async (req, res) => {
  try {
    const { bodyArea, intensity, timeMinutes, userLanguage } = req.body;
    if (!bodyArea?.trim()) return res.status(400).json({ error: 'What needs attention?' });
    const areaDesc = BODY_AREAS[bodyArea] || bodyArea;
    const prompt = withLanguage(`Targeted relief for: ${areaDesc}. Intensity: ${intensity || 'gentle'}. Time: ${timeMinutes || '5'} min. Should feel like RELIEF, not exercise.
Return ONLY valid JSON:
{ "session_name": "n", "for": "what this addresses", "time": "${timeMinutes || '5'} minutes",
  "movements": [{ "name": "n", "duration": "t", "how": "gentle instructions", "feels_like": "sensation", "caution": "or null" }],
  "after_note": "improvement", "prevention_tip": "daily tip" }`, userLanguage);
    const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system: withLanguage('Targeted relief guide. Physical therapist, not trainer. Return ONLY valid JSON. No markdown.', userLanguage),
        messages: [{ role: 'user', content: prompt }],
      });
      const text = message.content.find(b => b.type === 'text')?.text || '';
      const cleaned = cleanJsonResponse(text);
      const parsed = JSON.parse(cleaned);
    res.json(parsed);
  } catch (error) { console.error('[LazyWorkoutBody]', error); res.status(500).json({ error: error.message || 'Failed.' }); }
});

// ═══════════════════════════════════════════════════
// ROUTE 7: COMPLETE — Log completion
// ═══════════════════════════════════════════════════
router.post('/lazy-workout-adapter-complete', async (req, res) => {
  try {
    const { completedExercises, totalExercises, energyBefore, energyAfter, duration, streak, totalSessions, sessionType, userLanguage } = req.body;
    const pct = totalExercises ? Math.round((completedExercises / totalExercises) * 100) : 100;
    const prompt = withLanguage(`Movement done. Celebrate warmly, not over-the-top. ${completedExercises || '?'}/${totalExercises || '?'} (${pct}%). Energy: ${energyBefore || '?'}→${energyAfter || '?'}. Duration: ${duration || '?'} min. Streak: ${streak || 1}. Total: ${totalSessions || 1}. Type: ${sessionType || 'workout'}. Milestones at 7/14/30 streak, 10/25/50 total. 2-3 sentences.
Return ONLY valid JSON: { "message": "celebration", "energy_note": "or null", "milestone": "or null", "streak_status": "${streak || 1} day streak", "suggestion": "or null" }`, userLanguage);
    const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        system: withLanguage('Movement celebration. Warm, brief, real. Return ONLY valid JSON. No markdown.', userLanguage),
        messages: [{ role: 'user', content: prompt }],
      });
      const text = message.content.find(b => b.type === 'text')?.text || '';
      const cleaned = cleanJsonResponse(text);
      const parsed = JSON.parse(cleaned);
    res.json(parsed);
  } catch (error) { console.error('[LazyWorkoutComplete]', error); res.status(500).json({ error: error.message || 'Failed.' }); }
});

// ═══════════════════════════════════════════════════
// ROUTE 8: INSIGHTS — Pattern analysis
// ═══════════════════════════════════════════════════
router.post('/lazy-workout-adapter-insights', async (req, res) => {
  try {
    const { history, userLanguage } = req.body;
    if (!history?.length || history.length < 5) return res.status(400).json({ error: 'Need 5+ sessions.' });
    const recent = history.slice(-30).map(h => ({ date: h.date, day: h.day, energy_before: h.energyBefore, energy_after: h.energyAfter, duration: h.duration, completed_pct: h.completedPct, body_areas: h.bodyAreas, type: h.sessionType, contexts: h.contexts }));
    const prompt = withLanguage(`Analyze ${recent.length} movement sessions. Find helpful patterns, not judgments.
DATA: ${JSON.stringify(recent)}
Return ONLY valid JSON:
{ "summary": "warm sentence", "energy_patterns": { "best_days": [], "movement_impact": "avg change", "insight": "pattern" },
  "body_patterns": { "frequent_areas": [], "suggestion": "practical note" },
  "context_patterns": { "common_triggers": [], "insight": "what drives them to move" },
  "consistency": { "sessions_per_week": "avg", "trend": "increasing|stable|decreasing", "wins": "positive" },
  "personal_tip": "one actionable tip from THEIR data" }`, userLanguage);
    const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system: withLanguage('Movement analyst. Useful self-knowledge. Warm. Return ONLY valid JSON. No markdown.', userLanguage),
        messages: [{ role: 'user', content: prompt }],
      });
      const text = message.content.find(b => b.type === 'text')?.text || '';
      const cleaned = cleanJsonResponse(text);
      const parsed = JSON.parse(cleaned);
    res.json(parsed);
  } catch (error) { console.error('[LazyWorkoutInsights]', error); res.status(500).json({ error: error.message || 'Failed.' }); }
});

// ═══════════════════════════════════════════════════
// ROUTE 9: STACK — Environment stacking
// ═══════════════════════════════════════════════════
router.post('/lazy-workout-adapter-stack', async (req, res) => {
  try {
    const { activity, duration, bodyAreas, limitations, userLanguage } = req.body;
    if (!activity?.trim()) return res.status(400).json({ error: 'What are you about to do?' });
    const bodyContext = (bodyAreas || []).map(b => BODY_AREAS[b] || b).join(', ');

    const prompt = withLanguage(`Create micro-movements to sprinkle throughout an activity. NOT a workout — movement woven into what they're already doing.

ACTIVITY: "${activity.trim()}" | DURATION: ${duration || '60'} min
${bodyContext ? `BODY: ${bodyContext}` : ''} ${limitations ? `LIMITS: ${limitations}` : ''}

Rules: doable DURING activity. 30-60 sec each. Spaced evenly. Feel natural, not interruptions. Include a cue for each.

Return ONLY valid JSON:
{ "stack_name": "friendly name", "activity": "${activity.trim()}", "total_movements": "count", "frequency": "how often",
  "movements": [{ "name": "n", "seconds": 30, "how": "one sentence", "cue": "when to do it", "invisible": true }],
  "total_active_time": "total seconds", "message": "warm note about how this adds up" }`, userLanguage);

    const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system: withLanguage('Environment stacking expert. Layer movement onto activities. Invisible, effortless. Return ONLY valid JSON. No markdown.', userLanguage),
        messages: [{ role: 'user', content: prompt }],
      });
      const text = message.content.find(b => b.type === 'text')?.text || '';
      const cleaned = cleanJsonResponse(text);
      const parsed = JSON.parse(cleaned);
    res.json(parsed);
  } catch (error) { console.error('[LazyWorkoutStack]', error); res.status(500).json({ error: error.message || 'Failed.' }); }
});

// ═══════════════════════════════════════════════════
// ROUTE 10: SLEEP — Pre-bed wind-down
// ═══════════════════════════════════════════════════
router.post('/lazy-workout-adapter-sleep', async (req, res) => {
  try {
    const { timeMinutes, bodyAreas, stress_level, userLanguage } = req.body;
    const bodyContext = (bodyAreas || []).map(b => BODY_AREAS[b] || b).join(', ');

    const prompt = withLanguage(`Pre-sleep wind-down. Goal is NOT movement — it's transition to sleep.
TIME: ${timeMinutes || '5'} min | ${bodyContext ? `BODY: ${bodyContext} |` : ''} STRESS: ${stress_level || 'medium'}

Rules: progressive relaxation (each calmer than last). End lying down, eyes closed, with breathing. RELEASE tension. If stress is high, more breathing. Include setup cues.

Return ONLY valid JSON:
{ "session_name": "calming name", "time": "${timeMinutes || '5'} minutes",
  "setup": "environmental prep (lights, temp, phone away)",
  "movements": [{ "name": "n", "duration": "t", "how": "calming instruction", "position": "sitting|lying|standing", "breathing": "paired pattern or null" }],
  "final_breathing": { "name": "pattern name", "inhale": 4, "hold": 7, "exhale": 8, "cycles": 4, "instruction": "gentle guide" },
  "sleep_tip": "one thing to remember" }`, userLanguage);

    const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system: withLanguage('Sleep preparation guide. Calm, gentle, progressive. Goal is sleep. Return ONLY valid JSON. No markdown.', userLanguage),
        messages: [{ role: 'user', content: prompt }],
      });
      const text = message.content.find(b => b.type === 'text')?.text || '';
      const cleaned = cleanJsonResponse(text);
      const parsed = JSON.parse(cleaned);
    res.json(parsed);
  } catch (error) { console.error('[LazyWorkoutSleep]', error); res.status(500).json({ error: error.message || 'Failed.' }); }
});

// ═══════════════════════════════════════════════════
// ROUTE 11: RECOVERY — Post-event recovery
// ═══════════════════════════════════════════════════
router.post('/lazy-workout-adapter-recovery', async (req, res) => {
  try {
    const { event, intensity, timeMinutes, userLanguage } = req.body;
    if (!event?.trim()) return res.status(400).json({ error: 'What do you need to recover from?' });

    const prompt = withLanguage(`Recovery protocol for: "${event.trim()}" — first aid for the body after life happens.
SEVERITY: ${intensity || 'moderate'} | TIME: ${timeMinutes || '5'} min

Rules: address physical AND emotional residue. Start with most soothing thing. Include non-movement element (water, breathing, temp). End with "hard part is over" signal. Be warm.

Return ONLY valid JSON:
{ "protocol_name": "warm name", "for": "acknowledge what happened", "time": "${timeMinutes || '5'} minutes",
  "immediate": "very first thing (often not movement)",
  "steps": [{ "name": "n", "duration": "t", "type": "movement|breathing|stillness|sensory|hydration", "how": "warm instruction", "why_now": "why after THIS event" }],
  "closing": "the hard part is over message",
  "next_hour": "what to do in the next hour",
  "prevention": "if recurring, one thing to try. null if one-off" }`, userLanguage);

    const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system: withLanguage('Recovery designer. First aid for the body after life happens. Warm, holistic. Return ONLY valid JSON. No markdown.', userLanguage),
        messages: [{ role: 'user', content: prompt }],
      });
      const text = message.content.find(b => b.type === 'text')?.text || '';
      const cleaned = cleanJsonResponse(text);
      const parsed = JSON.parse(cleaned);
    res.json(parsed);
  } catch (error) { console.error('[LazyWorkoutRecovery]', error); res.status(500).json({ error: error.message || 'Failed.' }); }
});

// ═══════════════════════════════════════════════════
// ROUTE 12: PROVE — Evidence dashboard
// ═══════════════════════════════════════════════════
router.post('/lazy-workout-adapter-prove', async (req, res) => {
  try {
    const { history, notTodayLog, userLanguage } = req.body;
    if (!history?.length || history.length < 7) return res.status(400).json({ error: 'Need 7+ sessions to prove it.' });
    const recent = history.slice(-50).map(h => ({ date: h.date, day: h.day, energy_before: h.energyBefore, energy_after: h.energyAfter, duration: h.duration, completed_pct: h.completedPct, type: h.sessionType }));

    const prompt = withLanguage(`Evidence report: does movement help this person? Use their real data. Be honest.
${recent.length} SESSIONS: ${JSON.stringify(recent)}
${notTodayLog?.length ? `OPENED-BUT-SKIPPED (${notTodayLog.length}): ${JSON.stringify(notTodayLog.slice(-20))}` : ''}

Rules: real numbers. If it doesn't help, say so. Compare session types. Warm but honest.

Return ONLY valid JSON:
{ "headline": "one sentence verdict",
  "energy_evidence": { "avg_before": "n", "avg_after": "n", "avg_change": "n", "pct_sessions_improved": "n%", "best_change": "biggest shift", "verdict": "clear|moderate|unclear" },
  "best_sessions": { "best_type": "or null", "best_duration": "or null", "best_day": "or null", "insight": "what works for THEM" },
  "consistency_story": { "total_sessions": "${recent.length}", "sessions_per_week": "avg", "total_minutes": "n", "trend": "trend", "reframe": "put minutes in perspective" },
  "honest_note": "warm honest observation" }`, userLanguage);

    const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system: withLanguage('Evidence analyst. Real data, warm delivery. Not cheerleading. Return ONLY valid JSON. No markdown.', userLanguage),
        messages: [{ role: 'user', content: prompt }],
      });
      const text = message.content.find(b => b.type === 'text')?.text || '';
      const cleaned = cleanJsonResponse(text);
      const parsed = JSON.parse(cleaned);
    res.json(parsed);
  } catch (error) { console.error('[LazyWorkoutProve]', error); res.status(500).json({ error: error.message || 'Failed.' }); }
});

// ═══════════════════════════════════════════════════
// ROUTE 13: NUDGE — Context-aware suggestion
// ═══════════════════════════════════════════════════
router.post('/lazy-workout-adapter-nudge', async (req, res) => {
  try {
    const { history, streak, lastSessionDate, currentDay, currentHour, userLanguage } = req.body;
    const recent = (history || []).slice(-10).map(h => ({ day: h.day, date: h.date, type: h.sessionType, duration: h.duration, name: h.workoutName }));
    const prompt = withLanguage(`Context-aware suggestion. ${currentDay || '?'}, ~${currentHour || '?'}:00. Streak: ${streak || 0}. Last: ${lastSessionDate || '?'}.
Recent: ${JSON.stringify(recent)}
Rules: if pattern exists, suggest continuing. If 3+ days gap, suggest 2 min. If streak, acknowledge casually. 1-2 sentences. Not a pitch.
Return ONLY valid JSON: { "nudge": "friendly suggestion", "suggested_mode": "right-now|micro|body|sleep|stack|recovery", "suggested_time": "minutes", "reason": "why, based on patterns" }`, userLanguage);
    const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 400,
        system: withLanguage('Friendly nudger. Pattern-aware. Not pushy. Return ONLY valid JSON. No markdown.', userLanguage),
        messages: [{ role: 'user', content: prompt }],
      });
      const text = message.content.find(b => b.type === 'text')?.text || '';
      const cleaned = cleanJsonResponse(text);
      const parsed = JSON.parse(cleaned);
    res.json(parsed);
  } catch (error) { console.error('[LazyWorkoutNudge]', error); res.status(500).json({ error: error.message || 'Failed.' }); }
});

module.exports = router;
