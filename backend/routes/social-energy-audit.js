const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

// ════════════════════════════════════════════════════════════
// SHARED
// ════════════════════════════════════════════════════════════
const PERSONALITY = `You are a perceptive energy management advisor. You help people understand where their social and professional energy goes — not with clinical labels, but with practical, relatable insight. Everyone has limited energy. Some situations cost more than others. Your job is to help people see the patterns they can't see themselves, and give them concrete ways to restructure their week so they aren't running on empty.

YOUR PERSONALITY:
- Warm but direct. Like a friend who's also weirdly good at time management.
- Never clinical or diagnostic. This isn't therapy — it's practical self-knowledge.
- Use vivid, concrete language: "That 2-hour networking event costs you as much energy as a full workday" not "social interactions can be draining."
- Validate without patronizing. Everyone's energy budget is different and that's fine.`;

// ════════════════════════════════════════════════════════════
// POST /social-energy-audit — Main analysis
// ════════════════════════════════════════════════════════════
router.post('/social-energy-audit', async (req, res) => {
  try {
    const { interactions, weekLabel, userLanguage } = req.body;

    if (!interactions || !interactions.length) {
      return res.status(400).json({ error: 'Please log at least one interaction' });
    }

    const interactionList = interactions.map((int, i) =>
      `${i + 1}. "${int.situation}" [${int.category || 'general'}] — Performance: ${int.performance}/10, Energy before: ${int.energyBefore}/10, Energy after: ${int.energyAfter}/10${int.duration ? `, Duration: ${int.duration}` : ''}`
    ).join('\n');

    const systemPrompt = `${PERSONALITY}

You are analyzing someone's social/professional interactions to calculate their energy budget. Look at the performance level (how much they had to be "on" vs natural), energy before/after each interaction, and duration to find patterns.

Performance level means: 1 = completely yourself, relaxed, no effort. 10 = full performance mode — smiling when you don't feel like it, being "on," managing impressions, filtering every word.

This is NOT about neurodivergence or masking. This is about the universal human experience of social energy management. Everyone from introverts to extroverts, CEOs to students, has interactions that cost more energy than others.`;

    const userPrompt = `ENERGY AUDIT for ${weekLabel || 'this week'}:

${interactionList}

Analyze these interactions and return ONLY valid JSON:

{
  "energy_score": {
    "total_energy_spent": "X/100 — sum of energy drops across all interactions, normalized to 100",
    "net_energy_change": "+X or -X — did they end the week with more or less energy than they started?",
    "sustainability_verdict": "SUSTAINABLE | STRETCHED | RUNNING ON EMPTY | BURNOUT RISK",
    "one_liner": "One vivid sentence summarizing their energy week (e.g., 'You spent Thursday's energy on Tuesday's meetings.')"
  },

  "drains": [
    {
      "situation": "Name of the interaction",
      "energy_cost": "X points (energy before minus energy after)",
      "performance_tax": "X/10 — how much performance effort this required",
      "why_costly": "One sentence explaining WHY this costs so much. Be specific to the situation.",
      "cost_per_hour": "If duration provided, energy cost per hour. Otherwise null."
    }
  ],

  "rechargers": [
    {
      "situation": "Name of any interaction where energy stayed flat or increased",
      "energy_effect": "+X or 0 — how it affected energy",
      "why_good": "One sentence on why this works for them"
    }
  ],

  "patterns": {
    "biggest_surprise": "Something they might not realize about their energy patterns. Be insightful.",
    "performance_vs_drain": "Is there a correlation between high performance and high drain? What does that mean for them?",
    "category_breakdown": "Which categories (work, social, family, errands) cost the most? Quick ranking.",
    "optimal_ratio": "Based on their data, what's a good ratio of high-performance to low-performance interactions per week?"
  },

  "restructure_suggestions": [
    "3-5 SPECIFIC, actionable suggestions for restructuring their week based on the actual data. Not generic advice. Reference their specific situations.",
    "e.g., 'Move the team standup to after lunch instead of 9am — your energy data shows morning interactions cost 40% more than afternoon ones'",
    "e.g., 'That weekly networking event costs you 5 energy points for 2 hours. Consider going biweekly instead of weekly.'"
  ],

  "recovery_time": {
    "estimated_hours": "How many hours of downtime do they need to recover from this week's interactions?",
    "best_recovery_day": "Based on their heaviest days, when should they protect recovery time?",
    "recovery_type": "What kind of recovery? Solo time? Low-key social? Physical activity? Be specific to their patterns."
  },

  "weekly_budget": {
    "total_capacity": "Estimated weekly energy capacity based on their data (out of 100)",
    "spent": "How much they spent this week",
    "remaining": "What's left (can be negative)",
    "verdict": "One sentence: are they living within their energy budget?"
  }
}`;

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 3000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('SocialEnergyAudit error:', error);
    res.status(500).json({ error: error.message || 'Energy audit failed' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /social-energy-audit/plan — Week Planner
// ════════════════════════════════════════════════════════════
router.post('/social-energy-audit/plan', async (req, res) => {
  try {
    const { upcoming, pastPatterns, userLanguage } = req.body;

    if (!upcoming || !upcoming.length) {
      return res.status(400).json({ error: 'Please add upcoming commitments' });
    }

    const commitmentList = upcoming.map((c, i) =>
      `${i + 1}. "${c.situation}" [${c.category || 'general'}] on ${c.day || 'TBD'}${c.duration ? `, ~${c.duration}` : ''}${c.performance ? `, expected performance: ${c.performance}/10` : ''}`
    ).join('\n');

    const systemPrompt = `${PERSONALITY}

You are helping someone plan their upcoming week by predicting energy costs and suggesting schedule optimizations. ${pastPatterns ? `They have past energy data you can reference for accuracy.` : 'No past data available — use reasonable estimates based on the situation types.'}`;

    const userPrompt = `WEEK PLAN — Upcoming commitments:

${commitmentList}

${pastPatterns ? `PAST PATTERNS (from previous audits):\n${pastPatterns}` : ''}

Predict energy costs and suggest optimizations. Return ONLY valid JSON:

{
  "predicted_total_cost": "X/100 estimated total energy cost for the week",
  "risk_level": "LIGHT WEEK | MANAGEABLE | HEAVY | OVERLOADED",
  "day_breakdown": [
    {
      "day": "Day name",
      "commitments": ["List of commitments this day"],
      "predicted_cost": "X energy points",
      "risk": "LOW | MEDIUM | HIGH",
      "note": "One sentence: how this day will feel"
    }
  ],
  "danger_zones": ["Days or combinations that will be especially draining. Be specific."],
  "optimization_suggestions": [
    "3-5 specific schedule changes that would reduce total energy cost. Be practical — 'Move X to Y' or 'Cancel Z if possible' or 'Add 30 min buffer between A and B'."
  ],
  "protection_plan": "What recovery time should they absolutely protect this week? Be specific about when."
}`;

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('SocialEnergyAudit plan error:', error);
    res.status(500).json({ error: error.message || 'Week planning failed' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /social-energy-audit/recharge — Recharge Plan
// ════════════════════════════════════════════════════════════
router.post('/social-energy-audit/recharge', async (req, res) => {
  try {
    const { currentEnergy, topDrains, preferences, userLanguage } = req.body;

    if (currentEnergy == null) {
      return res.status(400).json({ error: 'Please rate your current energy level' });
    }

    const systemPrompt = `${PERSONALITY}

You are creating a personalized recharge plan. The person is drained and needs specific, actionable recovery suggestions — not generic "take a bath" advice. Tailor everything to what specifically drained them and what they enjoy.`;

    const userPrompt = `RECHARGE PLAN:
Current energy level: ${currentEnergy}/10
${topDrains ? `What drained them most: ${topDrains}` : ''}
${preferences ? `They enjoy / find restorative: ${preferences}` : ''}

Create a personalized recharge plan. Return ONLY valid JSON:

{
  "energy_assessment": "One sentence: how depleted are they? Use a vivid metaphor.",
  "immediate": {
    "do_now": "Something they can do in the next 5 minutes to start recovery",
    "avoid": "One thing to specifically avoid right now (be specific to their drains)"
  },
  "tonight": {
    "activity": "One specific restorative activity for this evening",
    "why": "Why this works for their specific type of drain",
    "duration": "How long to spend on it"
  },
  "this_week": [
    "3-4 specific recovery activities spread across the week. Not generic — tailored to their drain type and preferences."
  ],
  "boundaries_to_set": [
    "2-3 specific boundaries or schedule changes to prevent this level of drain next week. Reference their actual drains."
  ],
  "recharge_ratio": "For every X hours of [their top drain], they need Y hours of recovery. Be specific."
}`;

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('SocialEnergyAudit recharge error:', error);
    res.status(500).json({ error: error.message || 'Recharge plan failed' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /social-energy-audit/quick-check — "Should I Say Yes?"
// ════════════════════════════════════════════════════════════
router.post('/social-energy-audit/quick-check', async (req, res) => {
  try {
    const { commitment, currentEnergy, weekSoFar, upcomingToday, userLanguage } = req.body;

    if (!commitment) {
      return res.status(400).json({ error: 'What is the commitment?' });
    }

    const systemPrompt = `${PERSONALITY}

You are giving a quick, decisive answer about whether someone should say yes to a social or professional commitment. They need an answer in 3 seconds, not a therapy session. Be direct. Consider their current energy level, what they've already done this week, and what's still ahead today.`;

    const userPrompt = `QUICK CHECK — Should I say yes?

The commitment: "${commitment}"
My current energy: ${currentEnergy || 5}/10
${weekSoFar ? `Already this week: ${weekSoFar}` : 'No context on the week so far.'}
${upcomingToday ? `Still ahead today: ${upcomingToday}` : ''}

Give a fast, decisive answer. Return ONLY valid JSON:

{
  "verdict": "YES | PROBABLY | ONLY IF... | SKIP IT",
  "verdict_emoji": "✅ | 🟡 | ⚠️ | 🛑",
  "one_liner": "One bold sentence — the friend-level answer. No hedging.",
  "energy_impact": "What this will cost you: -X energy points estimated",
  "condition": "If the answer is conditional, what's the condition? null if straightforward yes/no.",
  "if_you_say_yes": "One practical tip for managing your energy if you go (e.g., 'Leave by 9pm', 'Skip the afterparty', 'Eat before you go')",
  "if_you_say_no": "A graceful way to decline — actual words they can text or say",
  "recovery_note": "What you'll need after this to bounce back. null if low-cost commitment."
}`;

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('SocialEnergyAudit quick-check error:', error);
    res.status(500).json({ error: error.message || 'Quick check failed' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /social-energy-audit/forecast — Energy Forecast
// ════════════════════════════════════════════════════════════
router.post('/social-energy-audit/forecast', async (req, res) => {
  try {
    const { template, dailyLogs, pastWeekSummaries, userLanguage } = req.body;

    if (!template?.length && !dailyLogs?.length) {
      return res.status(400).json({ error: 'Need template or daily logs for forecast' });
    }

    const systemPrompt = `${PERSONALITY}

You are generating an energy forecast for someone's week. If they have a typical week template, predict the energy curve. If they have daily check-in logs, show reality vs. prediction and warn about upcoming danger zones.`;

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
    {"day": "Monday", "predicted_energy": 8, "risk": "LOW | MEDIUM | HIGH", "note": "Short note about the day"},
    {"day": "Tuesday", "predicted_energy": 6, "risk": "MEDIUM", "note": "..."}
  ],
  "worst_day": "Day name — why it's the hardest",
  "best_day": "Day name — why it's the easiest",
  "weekly_energy_budget": "Predicted total energy spend out of 100",
  "danger_zones": ["Specific combinations or sequences that will drain the most"],
  "strategic_advice": ["2-3 specific suggestions for navigating the week based on the forecast"],
  ${logsStr ? '"reality_check": "How does the week so far compare to prediction? On track, better, or worse?",' : ''}
  "protect_this": "One specific time slot they should guard for recovery"
}`;

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('SocialEnergyAudit forecast error:', error);
    res.status(500).json({ error: error.message || 'Forecast failed' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /social-energy-audit/ideal-week — Ideal Week Structure
// ════════════════════════════════════════════════════════════
router.post('/social-energy-audit/ideal-week', async (req, res) => {
  try {
    const { weekSummaries, recurringInteractions, userLanguage } = req.body;

    if (!weekSummaries?.length) {
      return res.status(400).json({ error: 'Need at least 3 weeks of data' });
    }

    const systemPrompt = `${PERSONALITY}

You are designing someone's ideal week structure based on their actual energy data. Not a fantasy schedule — a realistic rearrangement of their real commitments that distributes energy costs more evenly and places rechargers strategically. Think of it as energy-aware scheduling.`;

    const summaryStr = weekSummaries.map((w, i) =>
      `Week ${i + 1} (${w.label}): ${w.interactionCount} interactions, score ${w.energyScore}, verdict: ${w.verdict}\n  Interactions: ${w.interactions?.map(int => `${int.situation} [perf ${int.performance}, ${int.energyBefore}→${int.energyAfter}]`).join(', ') || 'no detail'}`
    ).join('\n');

    const userPrompt = `IDEAL WEEK DESIGN — Based on this data:

${summaryStr}

${recurringInteractions ? `RECURRING COMMITMENTS:\n${recurringInteractions}` : ''}

Design their ideal week. Return ONLY valid JSON:

{
  "key_insight": "The single most important thing you learned from their data. One vivid sentence.",
  "rules": [
    "3-5 personal energy rules derived from their data. Specific, not generic. e.g., 'Never put client calls and your manager 1-on-1 on the same day — that combination costs you 8 energy points.'"
  ],
  "ideal_week": [
    {
      "day": "Monday",
      "energy_budget": "X/10 — how much this day should cost",
      "what_goes_here": "What types of interactions fit this day and why",
      "avoid": "What should NOT go on this day",
      "recharge_window": "When to protect recovery time"
    }
  ],
  "golden_rule": "Their one personal golden rule for energy management. Make it memorable and specific to them.",
  "biggest_change": "The single schedule change that would make the biggest difference. Be very specific.",
  "warning_pattern": "A recurring pattern in their data that leads to burnout. Name it so they can recognize it."
}`;

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2500,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('SocialEnergyAudit ideal-week error:', error);
    res.status(500).json({ error: error.message || 'Ideal week generation failed' });
  }
});

module.exports = router;
