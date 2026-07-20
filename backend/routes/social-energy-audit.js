const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

// ════════════════════════════════════════════════════════════
// SHARED
// ════════════════════════════════════════════════════════════
const PERSONALITY = `Social energy analyst. Map what drains vs replenishes and build a sustainable social calendar. Be honest about reciprocity and the real cost of over-commitment. Give permission to protect energy alongside specific strategies for maintaining relationships that matter.`

// ════════════════════════════════════════════════════════════
// POST /social-energy-audit — Main analysis
// ════════════════════════════════════════════════════════════
router.post('/social-energy-audit', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { interactions, weekLabel, userLanguage } = req.body;

    if (!interactions || !interactions.length) {
      return res.status(400).json({ error: 'Please log at least one interaction' });
    }

    const interactionList = interactions.map((int, i) =>
      `${i + 1}. "${int.situation}" [${int.category || 'general'}] — Performance: ${int.performance}/10, Energy before: ${int.energyBefore}/10, Energy after: ${int.energyAfter}/10${int.duration ? `, Duration: ${int.duration}` : ''}`
    ).join('\n');

    const systemPrompt = `${PERSONALITY}

Analyze this person's social/professional interactions for energy patterns. Assess performance level (1 = fully yourself; 10 = full impression-management mode), energy before/after each interaction, and duration. Identify what costs most, what restores, and patterns worth changing.

CONSISTENT NUMBERS: weekly_budget.spent must equal energy_score.total_energy_spent, and weekly_budget.remaining must equal total_capacity minus spent. net_energy_change must reflect the actual before/after totals. Keep every figure reconciled. EVERY logged interaction must appear in exactly one of drains or rechargers (zero-change ones go to whichever is closer with a note) — never drop one.

SHORT VALUES vs PROSE: fields described as "just the number" or "short" must contain ONLY that value (e.g. "47/100", "-10", "6/10") — no explanation. The dedicated prose fields (one_liner, verdict, why_costly, why_good) carry the reasoning. Return ONLY valid JSON.`;

    const userPrompt = `ENERGY AUDIT for ${weekLabel || 'this week'}:

${interactionList}

Analyze these interactions and return ONLY valid JSON:

{
  "energy_score": {
    "total_energy_spent": "Just the number out of 100, e.g. '47/100' — NO explanation (one_liner carries the summary)",
    "net_energy_change": "Short SIGNED string only, e.g. '-10' or '+8' (always a string with a leading + or -)",
    "sustainability_verdict": "SUSTAINABLE | STRETCHED | RUNNING ON EMPTY | BURNOUT RISK",
    "one_liner": "One vivid sentence summarizing their energy week (e.g., 'You spent Thursday's energy on Tuesday's meetings.') — one sentence"
  },

  "drains": [
    {
      "situation": "Name of the interaction — one sentence",
      "energy_cost": "Short signed number string, e.g. '-3' (energy before minus after)",
      "performance_tax": "Just 'X/10' — the effort level only, NO explanation (why_costly carries the reasoning)",
      "why_costly": "One sentence explaining WHY this costs so much. Be specific to the situation.",
      "cost_per_hour": "If duration provided, energy cost per hour. Otherwise null. — one sentence"
    }
  ],

  "rechargers": [
    {
      "situation": "Name of any interaction where energy stayed flat or increased — one sentence",
      "energy_effect": "+X or 0 — how it affected energy — one sentence",
      "why_good": "One sentence on why this works for them"
    }
  ],

  "patterns": {
    "biggest_surprise": "Something they might not realize about their energy patterns. Be insightful. — one sentence",
    "performance_vs_drain": "Is there a correlation between high performance and high drain? What does that mean for them? — one sentence",
    "category_breakdown": "Which categories (work, social, family, errands) cost the most? Quick ranking. — 1-2 sentences",
    "optimal_ratio": "Based on their data, what's a good ratio of high-performance to low-performance interactions per week? — one sentence"
  },

  "restructure_suggestions": [
    "3-5 SPECIFIC, actionable suggestions for restructuring their week based on the actual data. Not generic advice. Reference their specific situations.",
    "e.g., 'Move the team standup to after lunch instead of 9am — your energy data shows morning interactions cost 40% more than afternoon ones'",
    "e.g., 'That weekly networking event costs you 5 energy points for 2 hours. Consider going biweekly instead of weekly.'"
  ],

  "recovery_time": {
    "estimated_hours": "Short figure only, e.g. '6-8 hrs' or '0' — no sentence (best_recovery_day / recovery_type carry the detail)",
    "best_recovery_day": "Based on their heaviest days, when should they protect recovery time? — one sentence",
    "recovery_type": "What kind of recovery? Solo time? Low-key social? Physical activity? Be specific to their patterns. — one sentence"
  },

  "weekly_budget": {
    "total_capacity": "Just the number out of 100, e.g. '80/100' — no explanation",
    "spent": "Just the number out of 100, e.g. '42/100' — MUST equal total_energy_spent",
    "remaining": "Short SIGNED string, e.g. '+38' or '-5' (= total_capacity minus spent)",
    "verdict": "One sentence: are they living within their energy budget? (this carries the prose)"
  }
}

Return ONLY valid JSON.`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.FAST,
      // drains/rechargers grow 1 per interaction; 3000 truncated a 14-interaction
      // week (JSON parse-fail → retry storm → 500 for heavy users). 8000 fits a
      // full week with headroom (Haiku supports 64K).
      max_tokens: 8000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'social-energy-audit' });
    if (!parsed.energy_score) {
      return res.status(500).json({ error: 'Could not audit your social energy. Please try again.' });
    }
    // Hero stat is consumed by the UI (+/- coloring) — pin it to the actual
    // input arithmetic rather than trusting model math (audit 2026-07-19
    // caught "+2" reported for an actual net of -5).
    const net = interactions.reduce((sum, int) => {
      const b = Number(int.energyBefore ?? int.energy_before ?? int.before);
      const a = Number(int.energyAfter ?? int.energy_after ?? int.after);
      return (Number.isFinite(b) && Number.isFinite(a)) ? sum + (a - b) : sum;
    }, 0);
    if (Number.isFinite(net)) {
      parsed.energy_score.net_energy_change = (net >= 0 ? '+' : '') + net;
    }
    res.json(parsed);

  } catch (error) {
    console.error('SocialEnergyAudit error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /social-energy-audit/plan — Week Planner
// ════════════════════════════════════════════════════════════
router.post('/social-energy-audit/plan', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { upcoming, pastPatterns, userLanguage } = req.body;

    if (!upcoming || !upcoming.length) {
      return res.status(400).json({ error: 'Please add upcoming commitments' });
    }

    const commitmentList = upcoming.map((c, i) =>
      `${i + 1}. "${c.situation}" [${c.category || 'general'}] on ${c.day || 'TBD'}${c.duration ? `, ~${c.duration}` : ''}${c.performance ? `, expected performance: ${c.performance}/10` : ''}`
    ).join('\n');

    const systemPrompt = `${PERSONALITY}

You are helping someone plan their upcoming week by predicting energy costs and suggesting schedule optimizations. ${pastPatterns ? `They have past energy data you can reference for accuracy.` : 'No past data available — use reasonable estimates based on the situation types.'}

Return ONLY valid JSON.`;

    const userPrompt = `WEEK PLAN — Upcoming commitments:

${commitmentList}

${pastPatterns ? `PAST PATTERNS (from previous audits):\n${pastPatterns}` : ''}

Predict energy costs and suggest optimizations. Return ONLY valid JSON:

{
  "predicted_total_cost": "Just the number, e.g. '65/100' — no explanation",
  "risk_level": "LIGHT WEEK | MANAGEABLE | HEAVY | OVERLOADED",
  "day_breakdown": [
    {
      "day": "Day name — one sentence",
      "commitments": ["List of commitments this day"],
      "predicted_cost": "Short, just the number of points, e.g. '8'",
      "risk": "LOW | MEDIUM | HIGH",
      "note": "One sentence: how this day will feel"
    }
  ],
  "danger_zones": ["Days or combinations that will be especially draining. Be specific."],
  "optimization_suggestions": [
    "3-5 specific schedule changes that would reduce total energy cost. Be practical — 'Move X to Y' or 'Cancel Z if possible' or 'Add 30 min buffer between A and B'."
  ],
  "protection_plan": "What recovery time should they absolutely protect this week? Be specific about when. — one sentence"
}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.FAST,
      max_tokens: 4000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'social-energy-audit-2' });
    if (!parsed.predicted_total_cost) {
      return res.status(500).json({ error: 'Could not audit your social energy. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('SocialEnergyAudit plan error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /social-energy-audit/recharge — Recharge Plan
// ════════════════════════════════════════════════════════════
router.post('/social-energy-audit/recharge', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { currentEnergy, topDrains, preferences, userLanguage } = req.body;

    if (currentEnergy == null) {
      return res.status(400).json({ error: 'Please rate your current energy level' });
    }

    const systemPrompt = `${PERSONALITY}

You are creating a personalized recharge plan. The person is drained and needs specific, actionable recovery suggestions — not generic "take a bath" advice. Tailor everything to what specifically drained them and what they enjoy.

CRITICAL: drains and preferences are OPTIONAL. If they are missing, infer reasonable, specific recovery advice from the energy level alone — do the best you can with what you have. NEVER ask for more information, NEVER reply with a question or any prose. Your entire response must be the JSON object below and nothing else.`;

    const userPrompt = `RECHARGE PLAN:
Current energy level: ${currentEnergy}/10
${topDrains ? `What drained them most: ${topDrains}` : ''}
${preferences ? `They enjoy / find restorative: ${preferences}` : ''}

Create a personalized recharge plan. Return ONLY valid JSON:

{
  "energy_assessment": "One sentence: how depleted are they? Use a vivid metaphor.",
  "immediate": {
    "do_now": "Something they can do in the next 5 minutes to start recovery — one sentence",
    "avoid": "One thing to specifically avoid right now (be specific to their drains) — one sentence"
  },
  "tonight": {
    "activity": "One specific restorative activity for this evening — one sentence",
    "why": "Why this works for their specific type of drain — one sentence",
    "duration": "How long to spend on it (number)"
  },
  "this_week": [
    "3-4 specific recovery activities spread across the week. Not generic — tailored to their drain type and preferences."
  ],
  "boundaries_to_set": [
    "2-3 specific boundaries or schedule changes to prevent this level of drain next week. Reference their actual drains."
  ],
  "recharge_ratio": "For every X hours of [their top drain], they need Y hours of recovery. Be specific. — one sentence"
}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.FAST,
      max_tokens: 4000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'social-energy-audit-3' });
    if (!parsed.energy_assessment) {
      return res.status(500).json({ error: 'Could not audit your social energy. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('SocialEnergyAudit recharge error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /social-energy-audit/quick-check — "Should I Say Yes?"
// ════════════════════════════════════════════════════════════
router.post('/social-energy-audit/quick-check', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { commitment, currentEnergy, weekSoFar, upcomingToday, userLanguage } = req.body;

    if (!commitment) {
      return res.status(400).json({ error: 'What is the commitment?' });
    }

    const systemPrompt = `${PERSONALITY}

You are giving a quick, decisive answer about whether someone should say yes to a social or professional commitment. They need an answer in 3 seconds, not a therapy session. Be direct. Consider their current energy level, what they've already done this week, and what's still ahead today.

Return ONLY valid JSON.`;

    const userPrompt = `QUICK CHECK — Should I say yes?

The commitment: "${commitment}"
My current energy: ${currentEnergy || 5}/10
${weekSoFar ? `Already this week: ${weekSoFar}` : 'No context on the week so far.'}
${upcomingToday ? `Still ahead today: ${upcomingToday}` : ''}

Give a fast, decisive answer. Return ONLY valid JSON:

{
  "verdict": "YES | PROBABLY | ONLY IF... | SKIP IT",
  "verdict_emoji": "✅ | 🟡 | ⚠️ | 🛑",
  "one_liner": "One bold sentence — the friend-level answer. No hedging. — one sentence",
  "energy_impact": "What this will cost you: -X energy points estimated — one sentence",
  "condition": "If the answer is conditional, what's the condition? null if straightforward yes/no. — one sentence",
  "if_you_say_yes": "One practical tip for managing your energy if you go (e.g., 'Leave by 9pm', 'Skip the afterparty', 'Eat before you go') — one sentence",
  "if_you_say_no": "A graceful way to decline — actual words they can text or say — one sentence",
  "recovery_note": "What you'll need after this to bounce back. null if low-cost commitment. — one sentence"
}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.FAST,
      max_tokens: 4000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'social-energy-audit-4' });
    if (!parsed.verdict) {
      return res.status(500).json({ error: 'Could not audit your social energy. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('SocialEnergyAudit quick-check error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /social-energy-audit/forecast — Energy Forecast
// ════════════════════════════════════════════════════════════
router.post('/social-energy-audit/forecast', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { template, dailyLogs, pastWeekSummaries, userLanguage } = req.body;

    if (!template?.length && !dailyLogs?.length) {
      return res.status(400).json({ error: 'Need template or daily logs for forecast' });
    }

    const systemPrompt = `${PERSONALITY}

You are generating an energy forecast for someone's week. If they have a typical week template, predict the energy curve. If they have daily check-in logs, show reality vs. prediction and warn about upcoming danger zones.

Return ONLY valid JSON.`;

    const templateStr = template ? template.map((t, i) =>
      `${i + 1}. "${t.situation}" [${t.category}] perf: ${t.performance}/10${t.duration ? `, ${t.duration}` : ''}`
    ).join('\n') : 'No template saved.';

    const logsStr = dailyLogs?.length ? dailyLogs.map(d =>
      `${d.day}: energy ${d.energy}/10${d.biggestDrain ? `, drain: ${d.biggestDrain}` : ''}${d.biggestRecharge ? `, recharge: ${d.biggestRecharge}` : ''}`
    ).join('\n') : '';

    const userPrompt = `ENERGY FORECAST:

TYPICAL WEEK TEMPLATE:
${templateStr}

${logsStr ? `DAILY CHECK-INS SO FAR:\n${logsStr}\n` : ''}
${pastWeekSummaries ? `PAST WEEKS:\n${pastWeekSummaries}` : ''}

Generate an energy forecast. Return ONLY valid JSON:

{
  "forecast_type": "${logsStr ? 'mid-week update' : 'full week prediction'}",
  "predicted_curve": [
    {"day": "Monday — one sentence", "predicted_energy": 8, "risk": "LOW | MEDIUM | HIGH", "note": "Short note about the day — one sentence"},
    {"day": "Tuesday — one sentence", "predicted_energy": 6, "risk": "MEDIUM — one sentence", "note": "..."}
  ],
  "worst_day": "Day name — why it's the hardest — one sentence",
  "best_day": "Day name — why it's the easiest — one sentence",
  "weekly_energy_budget": "Just the number, e.g. '65/100' — no explanation",
  "danger_zones": ["Specific combinations or sequences that will drain the most"],
  "strategic_advice": ["2-3 specific suggestions for navigating the week based on the forecast"],
  ${logsStr ? '"reality_check": "How does the week so far compare to prediction? On track, better, or worse? — one sentence",' : ''}
  "protect_this": "One specific time slot they should guard for recovery — one sentence"
}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.FAST,
      max_tokens: 4000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'social-energy-audit-5' });
    if (!parsed.forecast_type) {
      return res.status(500).json({ error: 'Could not audit your social energy. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('SocialEnergyAudit forecast error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /social-energy-audit/ideal-week — Ideal Week Structure
// ════════════════════════════════════════════════════════════
router.post('/social-energy-audit/ideal-week', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { weekSummaries, recurringInteractions, userLanguage } = req.body;

    if (!weekSummaries?.length) {
      return res.status(400).json({ error: 'Need at least 3 weeks of data' });
    }

    const systemPrompt = `${PERSONALITY}

You are designing someone's ideal week structure based on their actual energy data. Not a fantasy schedule — a realistic rearrangement of their real commitments that distributes energy costs more evenly and places rechargers strategically. Think of it as energy-aware scheduling.

Return ONLY valid JSON.`;

    const summaryStr = weekSummaries.map((w, i) =>
      `Week ${i + 1} (${w.label}): ${w.interactionCount} interactions, score ${w.energyScore}, verdict: ${w.verdict}\n  Interactions: ${w.interactions?.map(int => `${int.situation} [perf ${int.performance}, ${int.energyBefore}→${int.energyAfter}]`).join(', ') || 'no detail'}`
    ).join('\n');

    const userPrompt = `IDEAL WEEK DESIGN — Based on this data:

${summaryStr}

${recurringInteractions ? `RECURRING COMMITMENTS:\n${recurringInteractions}` : ''}

Design their ideal week. Return ONLY valid JSON:

{
  "key_insight": "The single most important thing you learned from their data. One vivid sentence. — one sentence",
  "rules": [
    "3-5 personal energy rules derived from their data. Specific, not generic. e.g., 'Never put client calls and your manager 1-on-1 on the same day — that combination costs you 8 energy points.'"
  ],
  "ideal_week": [
    {
      "day": "Monday — one sentence",
      "energy_budget": "Just 'X/10' — no explanation (what_goes_here carries the detail)",
      "what_goes_here": "What types of interactions fit this day and why — one sentence",
      "avoid": "What should NOT go on this day — one sentence",
      "recharge_window": "When to protect recovery time — one sentence"
    }
  ],
  "golden_rule": "Their one personal golden rule for energy management. Make it memorable and specific to them. — one sentence",
  "biggest_change": "The single schedule change that would make the biggest difference. Be very specific. — one sentence",
  "warning_pattern": "A recurring pattern in their data that leads to burnout. Name it so they can recognize it. — one sentence"
}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.FAST,
      max_tokens: 4000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'social-energy-audit-6' });
    if (!parsed.key_insight) {
      return res.status(500).json({ error: 'Could not audit your social energy. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('SocialEnergyAudit ideal-week error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
