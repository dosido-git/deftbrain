const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage } = require('../lib/claude');
const { rateLimit } = require('../lib/rateLimiter');

// ═══════════════════════════════════════════════════
// DOPAMINE MENU BUILDER — v6 (18 routes)
// v5: recharge menu, just-do-this, build-menu, swap,
//     rate-activity, energy-match, pattern-check,
//     accountability-nudge, recharge-insights,
//     build-sequence, schedule-checkin, debt-check
// v6: +budget (SpoonBudgeter), +forecast (SocialBatteryForecaster),
//     +decline-message, +radar-checkin (BurnoutBreadcrumbTracker),
//     +radar-analyze, +disruption (RoutineRuptureManager)
// ═══════════════════════════════════════════════════

router.post('/dopamine-menu-builder', rateLimit(), async (req, res) => {
  const { action } = req.body;

  try {
    switch (action || 'generate') {

      // ╔══════════════════════════════════════════════╗
      // ║  RECHARGE MODE — Original DMB (12 routes)   ║
      // ╚══════════════════════════════════════════════╝

      // ────────────────────────────────────────────
      // GENERATE — Full recharge menu
      // ────────────────────────────────────────────
      case 'generate': {
        const { energy, time_available, recent_activities, context, time_of_day, mood, environment, already_tried, curated_menu, userLanguage } = req.body;

        const prompt = withLanguage(`Build a personalized recharge menu for someone right now.

ENERGY: ${energy || 5}/10
TIME: ${time_available || 'flexible'}
RECENT: "${recent_activities || 'not specified'}"
CONTEXT: "${context || 'not specified'}"
TIME OF DAY: ${time_of_day || 'unknown'}
MOOD: ${mood || 'not specified'}
ENVIRONMENT: ${environment || 'not specified'}
${already_tried?.length ? `ALREADY SUGGESTED (don't repeat): ${already_tried.join(', ')}` : ''}
${curated_menu?.length ? `THEIR SAVED MENU: ${curated_menu.map(a => a.name).join(', ')}` : ''}

RULES:
- Activities should RESTORE, not numb. Distinguish between pleasure (restorative) and numbing (scrolling, binging).
- Match effort to energy: low energy = low-barrier activities. Don't suggest a hike to someone at 2/10.
- Be specific: not "go for a walk" but "walk around the block with no phone, notice 3 things."
- If mood is negative, acknowledge it. Don't be relentlessly positive.
- Top pick should be the single best option for their exact state right now.
- Categories: quick_hit (under 15 min), medium_recharge (15-60 min), deep_reset (60+ min).

Return ONLY valid JSON:
{
  "energy_read": "One sentence reflecting their current state back to them.",
  "mood_note": "If mood is notable, a brief acknowledgment. If not, null.",
  "time_note": "If time constraint matters, brief note. If not, null.",
  "transition_tip": "The very first physical action to start the top pick. e.g., 'Stand up and walk to the kitchen.'",
  "pleasure_vs_numbing": "Brief insight about restorative vs numbing if relevant. null if not.",
  "menu": {
    "top_pick": { "activity": "...", "why": "...", "duration": "...", "effort": "low|medium|high", "category": "quick_hit|medium_recharge|deep_reset" },
    "quick_hits": [{ "activity": "...", "why": "...", "duration": "...", "effort": "...", "category": "quick_hit" }],
    "medium_recharges": [{ "activity": "...", "why": "...", "duration": "...", "effort": "...", "category": "medium_recharge" }],
    "deep_resets": [{ "activity": "...", "why": "...", "duration": "...", "effort": "...", "category": "deep_reset" }],
    "avoid_right_now": [{ "activity": "...", "why": "..." }]
  }
}`, userLanguage);

        const parsed = await callClaudeWithRetry(prompt, { label: 'DMB-Generate', max_tokens: 1200 });
        return res.json(parsed);
      }

      // ────────────────────────────────────────────
      // JUST DO THIS — One decision, zero thinking
      // ────────────────────────────────────────────
      case 'just-do-this': {
        const { energy, time_of_day, mood, environment, curated_menu, already_tried, userLanguage } = req.body;

        const prompt = withLanguage(`Someone can't even choose what to do. They're frozen by decision fatigue. Give them ONE thing. No options. No menu. Just: do this.

ENERGY: ${energy || 5}/10
TIME OF DAY: ${time_of_day || 'unknown'}
MOOD: ${mood || 'not specified'}
ENVIRONMENT: ${environment || 'not specified'}
${curated_menu?.length ? `THEIR MENU (prefer from this): ${curated_menu.map(a => a.name).join(', ')}` : ''}
${already_tried?.length ? `ALREADY TRIED: ${already_tried.join(', ')}` : ''}

Return ONLY valid JSON:
{
  "activity": "The one thing. Specific and concrete.",
  "first_move": "The literal first physical action. 'Stand up.' or 'Open the drawer.'",
  "why_this": "One sentence: why this, right now, for you.",
  "duration": "How long.",
  "done_signal": "How they know they're done.",
  "after": "What they'll feel after. Specific.",
  "category": "quick_hit|medium_recharge|deep_reset"
}`, userLanguage);

        const parsed = await callClaudeWithRetry(prompt, { label: 'DMB-JustDo', max_tokens: 400 });
        return res.json(parsed);
      }

      // ────────────────────────────────────────────
      // BUILD MENU — AI suggests for curated list
      // ────────────────────────────────────────────
      case 'build-menu': {
        const { interests, existing_menu, environment, shared, userLanguage } = req.body;

        const prompt = withLanguage(`Suggest recharge activities to add to someone's ${shared ? 'shared/partner' : 'personal'} menu.

INTERESTS: "${interests || 'not specified'}"
ENVIRONMENT: ${environment || 'any'}
${existing_menu?.length ? `ALREADY ON MENU (don't repeat): ${existing_menu.map(a => a.name).join(', ')}` : ''}

Suggest 5-8 activities. Mix categories. Be specific, not generic.

Return ONLY valid JSON:
{
  "menu_balance_note": "Brief note on what's missing or overrepresented.",
  "suggestions": [
    { "activity": "...", "why_add": "Why this belongs on their menu.", "category": "quick_hit|medium_recharge|deep_reset|social|physical|creative|sensory", "effort": "low|medium|high", "duration": "...", "energy_min": 1, "energy_max": 10, "environments": ["home", "office", "outdoors", "commuting", "in_bed"] }
  ]
}`, userLanguage);

        const parsed = await callClaudeWithRetry(prompt, { label: 'DMB-BuildMenu', max_tokens: 1000 });
        return res.json(parsed);
      }

      // ────────────────────────────────────────────
      // SWAP — Alternatives when suggestions don't fit
      // ────────────────────────────────────────────
      case 'swap': {
        const { rejected_activities, energy, time_available, reason, mood, environment, already_tried, userLanguage } = req.body;

        const prompt = withLanguage(`Someone rejected these recharge suggestions: ${(rejected_activities || []).join(', ')}. Generate alternatives that feel different.

ENERGY: ${energy || 5}/10, TIME: ${time_available || 'flexible'}, MOOD: ${mood || '?'}, ENV: ${environment || '?'}
REASON: "${reason || 'not feeling these'}"

Return ONLY valid JSON:
{
  "read": "Brief acknowledgment of why these didn't work.",
  "alternatives": [{ "activity": "...", "why_different": "How this differs from what they rejected.", "duration": "...", "effort": "...", "category": "..." }],
  "wildcard": { "activity": "Something unexpected.", "why": "..." }
}`, userLanguage);

        const parsed = await callClaudeWithRetry(prompt, { label: 'DMB-Swap', max_tokens: 600 });
        return res.json(parsed);
      }

      // ────────────────────────────────────────────
      // RATE ACTIVITY — Log + reflect
      // ────────────────────────────────────────────
      case 'rate-activity': {
        const { activity, rating, energy_before, energy_after, note, sensory_anchor, history, userLanguage } = req.body;

        const prompt = withLanguage(`Someone just rated a recharge activity. Reflect back.

ACTIVITY: "${activity}"
RATING: ${rating}/10
ENERGY: ${energy_before}/10 → ${energy_after}/10 (${energy_after > energy_before ? 'gained' : energy_after < energy_before ? 'lost' : 'same'})
NOTE: "${note || 'none'}"
SENSORY ANCHOR: "${sensory_anchor || 'none'}"
${history?.length ? `RECENT HISTORY: ${history.slice(0, 5).map(h => `${h.activity}: ${h.rating}/10`).join(', ')}` : ''}

Return ONLY valid JSON:
{
  "reflection": "1-2 sentences specific to their experience.",
  "anchor_suggestion": "If they provided a sensory anchor, reinforce it. If not, suggest one. null if not relevant.",
  "pattern_hint": "If history reveals a pattern, mention it. null otherwise."
}`, userLanguage);

        const parsed = await callClaudeWithRetry(prompt, { label: 'DMB-Rate', max_tokens: 300 });
        return res.json(parsed);
      }

      // ────────────────────────────────────────────
      // ENERGY MATCH — From curated menu
      // ────────────────────────────────────────────
      case 'energy-match': {
        const { energy, time_available, curated_menu, mood, environment, userLanguage } = req.body;

        const prompt = withLanguage(`Match activities from this person's curated menu to their current state.

ENERGY: ${energy}/10, TIME: ${time_available || 'flexible'}, MOOD: ${mood || '?'}, ENV: ${environment || '?'}
THEIR MENU: ${JSON.stringify((curated_menu || []).map(a => ({ name: a.name, category: a.category, effort: a.effort, duration: a.duration, avg_rating: a.avg_rating, sensory_anchor: a.sensory_anchor })))}

Rank top 3-5 from their menu. Prioritize highly rated + energy-appropriate.

Return ONLY valid JSON:
{
  "matched": [{ "rank": 1, "activity": "...", "why_now": "Why this fits right now.", "anchor_reminder": "If they have a sensory anchor, remind them. null otherwise." }],
  "gap_note": "Is their menu missing something for this state? Brief note or null."
}`, userLanguage);

        const parsed = await callClaudeWithRetry(prompt, { label: 'DMB-Match', max_tokens: 600 });
        return res.json(parsed);
      }

      // ────────────────────────────────────────────
      // PATTERN CHECK — Analyze activity log
      // ────────────────────────────────────────────
      case 'pattern-check': {
        const { activity_log, userLanguage } = req.body;

        const prompt = withLanguage(`Analyze this recharge activity log for patterns.

LOG (most recent first): ${JSON.stringify((activity_log || []).slice(0, 20).map(a => ({ activity: a.activity, rating: a.rating, energy_before: a.energy_before, energy_after: a.energy_after, mood: a.mood, date: a.date })))}

Return ONLY valid JSON:
{
  "summary": "Overall pattern in 1-2 sentences.",
  "top_restorers": [{ "activity": "...", "avg_rating": 0, "avg_energy_gain": "+X", "times": 0 }],
  "numbing_traps": [{ "activity": "...", "times_chosen": 0, "avg_rating": 0, "nudge": "Gentle observation." }],
  "mood_patterns": [{ "mood": "...", "best_activity": "..." }],
  "best_insight": "The single most useful pattern observation."
}`, userLanguage);

        const parsed = await callClaudeWithRetry(prompt, { label: 'DMB-Patterns', max_tokens: 600 });
        return res.json(parsed);
      }

      // ────────────────────────────────────────────
      // ACCOUNTABILITY NUDGE
      // ────────────────────────────────────────────
      case 'accountability-nudge': {
        const { activity, userLanguage } = req.body;

        const prompt = withLanguage(`Write a short, warm accountability message to invite someone to do "${activity}" together. 2-3 sentences, casual, no pressure.

Return ONLY valid JSON:
{ "message": "The invitation message." }`, userLanguage);

        const parsed = await callClaudeWithRetry(prompt, { label: 'DMB-Nudge', max_tokens: 200 });
        return res.json(parsed);
      }

      // ────────────────────────────────────────────
      // RECHARGE INSIGHTS — Dashboard
      // ────────────────────────────────────────────
      case 'recharge-insights': {
        const { activity_log, curated_menu, userLanguage } = req.body;

        const prompt = withLanguage(`Create an insights dashboard from this recharge activity log.

LOG: ${JSON.stringify((activity_log || []).slice(0, 25).map(a => ({ activity: a.activity, rating: a.rating, energy_before: a.energy_before, energy_after: a.energy_after, category: a.category, mood: a.mood, date: a.date })))}
${curated_menu?.length ? `MENU: ${curated_menu.map(a => a.name).join(', ')}` : ''}

Return ONLY valid JSON:
{
  "dashboard": {
    "avg_rating": "X/10", "avg_energy_gain": "+X.X", "high_rated_pct": "X%",
    "total_sessions": 0, "best_category": "...", "worst_category": "..."
  },
  "trend": "improving|stable|declining",
  "trend_detail": "What's happening over time.",
  "recommendation": "One specific actionable suggestion."
}`, userLanguage);

        const parsed = await callClaudeWithRetry(prompt, { label: 'DMB-Insights', max_tokens: 500 });
        return res.json(parsed);
      }

      // ────────────────────────────────────────────
      // BUILD SEQUENCE — Multi-step recharge routine
      // ────────────────────────────────────────────
      case 'build-sequence': {
        const { energy, time_available, mood, environment, curated_menu, userLanguage } = req.body;

        const prompt = withLanguage(`Build a multi-step recharge sequence — a guided routine that transitions someone through an emotional/energy arc.

ENERGY: ${energy}/10, TIME: ${time_available || '30 minutes'}, MOOD: ${mood || '?'}, ENV: ${environment || 'home'}
${curated_menu?.length ? `PREFER FROM MENU: ${curated_menu.map(a => a.name).join(', ')}` : ''}

Return ONLY valid JSON:
{
  "sequence_name": "Short evocative name.",
  "arc": "wind_down|energize|process|explore",
  "arc_description": "What this sequence does emotionally.",
  "total_time": "~Xm",
  "steps": [
    { "step": 1, "activity": "...", "duration": "...", "effort": "low|medium", "transition_from_previous": "How to move from last step to this one." }
  ],
  "completion_feeling": "How they'll feel when done."
}`, userLanguage);

        const parsed = await callClaudeWithRetry(prompt, { label: 'DMB-Sequence', max_tokens: 700 });
        return res.json(parsed);
      }

      // ────────────────────────────────────────────
      // SCHEDULE CHECKIN
      // ────────────────────────────────────────────
      case 'schedule-checkin': {
        const { checkin_time, current_energy, current_mood, current_activity, curated_menu, userLanguage } = req.body;

        const prompt = withLanguage(`Schedule a recharge check-in for ${checkin_time}. Current energy: ${current_energy}/10, mood: ${current_mood || '?'}, doing: "${current_activity || '?'}".

Return ONLY valid JSON:
{
  "prep_tip": "One sentence to help them prepare.",
  "reminder_message": "The check-in message they'll see.",
  "suggested_activity": { "activity": "...", "why": "...", "duration": "..." }
}`, userLanguage);

        const parsed = await callClaudeWithRetry(prompt, { label: 'DMB-Checkin', max_tokens: 300 });
        return res.json(parsed);
      }

      // ────────────────────────────────────────────
      // DEBT CHECK — Recharge deficit
      // ────────────────────────────────────────────
      case 'debt-check': {
        const { activity_log, recent_energies, userLanguage } = req.body;

        const prompt = withLanguage(`Assess this person's recharge debt — are they running a deficit?

RECENT ENERGIES: ${(recent_energies || []).join(', ')}
RECENT LOG: ${JSON.stringify((activity_log || []).slice(0, 10).map(a => ({ activity: a.activity, rating: a.rating, energy_before: a.energy_before, energy_after: a.energy_after, date: a.date })))}

Return ONLY valid JSON:
{
  "debt_level": "none|mild|moderate|severe",
  "debt_summary": "What the data shows about their recharge habits.",
  "days_since_good_recharge": "Best guess from data, or null.",
  "prescription": "Specific recharge action needed NOW.",
  "gentle_warning": "If severe, a compassionate but honest warning. null if not needed.",
  "first_step": "The literal next thing to do."
}`, userLanguage);

        const parsed = await callClaudeWithRetry(prompt, { label: 'DMB-Debt', max_tokens: 400 });
        return res.json(parsed);
      }

      // ╔══════════════════════════════════════════════╗
      // ║  BUDGET MODE — (absorbs SpoonBudgeter)      ║
      // ╚══════════════════════════════════════════════╝

      case 'budget': {
        const { tasks, available_energy, mood, userLanguage } = req.body;

        if (!tasks?.length) {
          return res.status(400).json({ error: 'Add at least one task.' });
        }

        const taskList = tasks.map((t, i) =>
          `${i + 1}. "${t.task}" — estimated cost: ${t.cost}/10 energy — priority: ${t.priority || 'optional'}`
        ).join('\n');

        const prompt = withLanguage(`Budget this person's energy across their tasks for today.

AVAILABLE ENERGY: ${available_energy || 10}/10
CURRENT MOOD: ${mood || 'not specified'}

TASKS:
${taskList}

RULES:
- Required tasks must happen. Optional tasks only if energy permits.
- If total cost exceeds available energy, be honest: some things won't happen today.
- Give explicit permission to drop optional tasks. This is not laziness — it's math.
- If they're significantly over capacity, don't just trim — acknowledge the situation directly.
- Suggest task order (easiest first if low energy, hardest first if high energy).

Return ONLY valid JSON:
{
  "capacity_status": "within_budget|at_capacity|over_capacity|severely_over",
  "total_cost": 0,
  "available": 0,
  "required_cost": 0,
  "optional_cost": 0,
  "remaining_after_required": 0,
  "energy_read": "Honest assessment of their situation in 1-2 sentences.",
  "task_plan": [
    { "task": "...", "cost": 0, "priority": "required|important|optional", "verdict": "do|defer|delegate|drop", "reason": "Why this verdict.", "order": 1 }
  ],
  "permissions": ["Explicit permission statements. e.g., 'Skipping the gym today isn't failing — it's math.'"],
  "protection_suggestion": "If over capacity: what to protect (sleep, one meal, basic hygiene). null if fine.",
  "tomorrow_note": "What deferred tasks mean for tomorrow. Brief."
}`, userLanguage);

        const parsed = await callClaudeWithRetry(prompt, { label: 'DMB-Budget', max_tokens: 800 });
        return res.json(parsed);
      }

      // ╔══════════════════════════════════════════════╗
      // ║  FORECAST MODE — (absorbs SocialBatteryForecaster) ║
      // ╚══════════════════════════════════════════════╝

      case 'forecast': {
        const { events, energy_type, current_battery, recharge_hours, activity_log, userLanguage } = req.body;

        if (!events?.length) {
          return res.status(400).json({ error: 'Add at least one event.' });
        }

        const eventList = events.map((ev, i) =>
          `${i + 1}. "${ev.name}" — ${ev.day || 'TBD'} ${ev.time || ''}, ${ev.duration || '?'}, ${ev.people || '?'} people, role: ${ev.role || 'attending'}, can leave early: ${ev.canLeave ? 'yes' : 'no'}, type: ${ev.type || 'social'}`
        ).join('\n');

        const historyHint = activity_log?.length > 3
          ? `\nENERGY HISTORY (recent): avg energy ${Math.round(activity_log.slice(0, 10).reduce((s, a) => s + (a.energy_before || 5), 0) / Math.min(activity_log.length, 10))}/10`
          : '';

        const prompt = withLanguage(`Forecast this person's energy across the coming week based on social/work obligations.

ENERGY TYPE: ${energy_type || 50}/100 (0 = extreme introvert, 100 = extreme extrovert)
CURRENT BATTERY: ${current_battery || 80}%
MINIMUM RECHARGE HOURS NEEDED: ${recharge_hours || 3}${historyHint}

UPCOMING EVENTS:
${eventList}

RULES:
- Calculate energy cost per event based on: people count, familiarity, role (hosting > presenting > attending > observing), duration, can-leave-early factor.
- Introverts drain faster from social events. Extroverts drain from isolation.
- Hosting costs ~2x attending. Presenting costs ~1.5x attending.
- Unknown people cost more than familiar. Large groups cost more than small.
- Show cumulative battery across the week.
- Flag any day where battery drops below 20% = BURNOUT RISK.
- Recommend recovery windows between events.
- If total week exceeds capacity, say so directly.

Return ONLY valid JSON:
{
  "weekly_capacity": 100,
  "total_committed": 0,
  "capacity_status": "within_budget|tight|over_committed|danger",
  "forecast": [
    {
      "event": "...", "day": "...", "energy_cost": 0,
      "cost_breakdown": "Brief: why this costs X%",
      "battery_after": 0,
      "warning": "null or warning if battery < 30%",
      "recovery_needed": "Hours of alone/recharge time needed before next event, or null"
    }
  ],
  "critical_days": ["Days where burnout risk is highest"],
  "recovery_plan": "Specific recovery window recommendations.",
  "weekly_summary": "Honest 2-sentence assessment.",
  "permissions": ["Permission statements: 'It's okay to decline Friday's event.'"],
  "capacity_note": "If over-committed: what to cut. If fine: what's still available."
}`, userLanguage);

        const parsed = await callClaudeWithRetry(prompt, { label: 'DMB-Forecast', max_tokens: 1200 });
        return res.json(parsed);
      }

      // ────────────────────────────────────────────
      // DECLINE MESSAGE — Polite decline script
      // ────────────────────────────────────────────
      case 'decline-message': {
        const { event_name, reason, relationship, userLanguage } = req.body;

        const prompt = withLanguage(`Write a polite decline message for "${event_name || 'this event'}".
REASON: ${reason || 'at capacity'}
RELATIONSHIP: ${relationship || 'friend'}

Return ONLY valid JSON:
{
  "message": "The full decline message. Warm, honest, no over-explaining. Suggests alternative if natural.",
  "alternative_offer": "A smaller alternative to suggest, or null."
}`, userLanguage);

        const parsed = await callClaudeWithRetry(prompt, { label: 'DMB-Decline', max_tokens: 300 });
        return res.json(parsed);
      }

      // ╔══════════════════════════════════════════════╗
      // ║  RADAR MODE — (absorbs BurnoutBreadcrumbTracker)  ║
      // ╚══════════════════════════════════════════════╝

      // Daily 15-second check-in
      case 'radar-checkin': {
        const { sleep, mood, productivity, social_energy, physical_symptoms, checkin_history, userLanguage } = req.body;

        const historyContext = checkin_history?.length > 0
          ? `\nRECENT CHECK-INS (last ${Math.min(checkin_history.length, 7)} days):\n${checkin_history.slice(0, 7).map(c => `  ${c.date}: sleep=${c.sleep} mood=${c.mood} prod=${c.productivity} social=${c.social_energy}${c.physical_symptoms ? ` symptoms="${c.physical_symptoms}"` : ''}`).join('\n')}`
          : '';

        const prompt = withLanguage(`Daily energy check-in. Analyze today's readings + recent history for early warning signs.

TODAY:
- Sleep quality: ${sleep || '?'}/5
- Mood: ${mood || '?'}/5
- Productivity: ${productivity || '?'}/5
- Social energy: ${social_energy || '?'}/5
- Physical symptoms: "${physical_symptoms || 'none'}"
${historyContext}

RULES:
- Look for DECLINING TRENDS across multiple metrics. Single bad day = normal. Three days declining = pattern.
- The danger is when MULTIPLE signals decline SIMULTANEOUSLY: sleep + mood + productivity dropping together is a burnout warning.
- Be honest but not alarmist. Most days will be "you're fine."
- If you see a real pattern, be direct: "Three of your four metrics have been declining for 4 days."

Return ONLY valid JSON:
{
  "status": "green|yellow|orange|red",
  "status_label": "All clear | Worth watching | Early warning | Burnout approaching",
  "today_read": "One sentence about today's check-in.",
  "trend": "stable|improving|declining|mixed",
  "trend_detail": "What the trajectory looks like across recent days. null if < 3 check-ins.",
  "cross_signal_alert": "If multiple metrics are declining simultaneously, flag it specifically. null if not.",
  "intervention": "If yellow+: one specific, concrete action to take TODAY. null if green.",
  "encouragement": "Brief, genuine encouragement. Not generic positivity — specific to what you see."
}`, userLanguage);

        const parsed = await callClaudeWithRetry(prompt, { label: 'DMB-RadarCheckin', max_tokens: 500 });
        return res.json(parsed);
      }

      // Full pattern analysis (needs 5+ check-ins)
      case 'radar-analyze': {
        const { checkin_log, userLanguage } = req.body;

        if (!checkin_log?.length || checkin_log.length < 5) {
          return res.status(400).json({ error: 'Need at least 5 daily check-ins for pattern analysis.' });
        }

        const prompt = withLanguage(`Analyze this person's daily energy check-in log for burnout patterns.

CHECK-IN LOG (most recent first):
${JSON.stringify(checkin_log.slice(0, 30), null, 2)}

ANALYZE:
- Overall trajectory for each metric (sleep, mood, productivity, social_energy)
- Cross-signal correlations: which metrics decline together?
- Weekly patterns: which days tend to be worst?
- Physical symptom frequency and timing
- Burnout risk assessment based on the full picture

Return ONLY valid JSON:
{
  "overall_risk": "low|moderate|elevated|high|critical",
  "time_until_concern": "An estimate like 'You have margin' or 'If this continues, 1-2 weeks to burnout' or 'Act now'. Be honest.",
  "metric_trends": {
    "sleep": { "direction": "up|stable|down", "avg": 0, "change": "+/-X over period" },
    "mood": { "direction": "...", "avg": 0, "change": "..." },
    "productivity": { "direction": "...", "avg": 0, "change": "..." },
    "social_energy": { "direction": "...", "avg": 0, "change": "..." }
  },
  "cross_signals": ["Specific correlations observed. e.g., 'Sleep and productivity decline together — sleep is probably the driver.'"],
  "weekly_pattern": "Which days tend to be hardest and why. null if not enough data.",
  "physical_pattern": "Any pattern in physical symptoms. null if none.",
  "biggest_concern": "The single most important thing they should pay attention to.",
  "interventions": [
    { "action": "Specific, concrete intervention.", "priority": "critical|high|medium", "why": "Why this matters." }
  ],
  "bright_spots": "What's going well. Always find something genuine.",
  "reality_check": "The honest overall picture in 2-3 sentences."
}`, userLanguage);

        const parsed = await callClaudeWithRetry(prompt, { label: 'DMB-RadarAnalyze', max_tokens: 1000 });
        return res.json(parsed);
      }

      // ╔══════════════════════════════════════════════╗
      // ║  DISRUPTION MODE — (absorbs RoutineRuptureManager) ║
      // ╚══════════════════════════════════════════════╝

      case 'disruption': {
        const { disruption_type, normal_routine, constraints, critical_tasks, available_energy, duration_estimate, userLanguage } = req.body;

        if (!disruption_type) {
          return res.status(400).json({ error: 'What disrupted your routine?' });
        }

        const prompt = withLanguage(`Someone's routine just broke. Help them build a temporary replacement structure.

DISRUPTION: ${disruption_type}
NORMAL ROUTINE: "${normal_routine || 'not described'}"
CONSTRAINTS: "${constraints || 'not specified'}"
CRITICAL TASKS (must continue): "${critical_tasks || 'not specified'}"
AVAILABLE ENERGY: ${available_energy || '?'}/10
EXPECTED DURATION: "${duration_estimate || 'unknown'}"

RULES:
- Critical tasks are non-negotiable (medication, pet care, urgent deadlines). Everything else is droppable.
- Match the adapted routine to actual energy. If they're sick and at 2/10, the routine is: meds, water, rest. That's it.
- Give explicit keep/simplify/drop for each category of their normal routine.
- Include a "return to normal" trigger — how they'll know when to resume their regular routine.
- Be warm. Disruptions are stressful. Acknowledge the difficulty.

Return ONLY valid JSON:
{
  "acknowledgment": "One warm sentence acknowledging the disruption.",
  "adapted_routine": {
    "keep": [{ "task": "...", "simplification": "How to make it easier during disruption, or 'as normal' if no change needed." }],
    "simplify": [{ "task": "...", "simplified_version": "The minimal version of this task." }],
    "drop": [{ "task": "...", "permission": "Explicit permission to drop this. e.g., 'The dishes will wait. Dirty dishes don't hurt anyone.'" }]
  },
  "survival_schedule": "A rough time structure for the disrupted day. Not rigid — just enough skeleton to feel oriented.",
  "self_care_minimum": "The absolute minimum self-care tasks (water, food, meds). Brief list.",
  "return_trigger": "How they'll know when to resume normal routine.",
  "duration_note": "If they said how long the disruption will last, acknowledge it. If open-ended, reassure that temporary structures work for open-ended situations too.",
  "reality_check": "Honest, warm reassurance. 'You're not failing — your routine is disrupted and you're adapting. That's strength.'"
}`, userLanguage);

        const parsed = await callClaudeWithRetry(prompt, { label: 'DMB-Disruption', max_tokens: 800 });
        return res.json(parsed);
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }

  } catch (err) {
    console.error('DopamineMenuBuilder error:', err);
    res.status(500).json({ error: err.message || 'Something went wrong.' });
  }
});

module.exports = router;
