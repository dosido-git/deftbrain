const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');
const { rateLimit } = require('../lib/rateLimiter');

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
// MAIN FORECAST ENDPOINT
// ═══════════════════════════════════════════════════════════════

router.post('/recharge-radar', rateLimit(), async (req, res) => {
  try {
    const { description, currentBattery, socialStyle, userLanguage } = req.body;

    if (!description || description.trim().length < 5) {
      return res.status(400).json({ error: 'Please describe your upcoming social commitments' });
    }

    const styleNote = socialStyle === 'introvert'
      ? 'This person identifies as introverted — social events drain them faster, recovery takes longer.'
      : socialStyle === 'extrovert'
      ? 'This person identifies as extroverted — social events are less draining, recovery is faster.'
      : 'This person identifies as an ambivert — moderate drain and recovery.';

    const prompt = withLanguage(`You are a social energy analyst for introverts and anyone who experiences social fatigue. You model social events as energy costs on a battery that starts at ${currentBattery || 70}%.

${styleNote}

The user described their upcoming week in natural language. Parse their events, estimate energy costs, and produce a detailed forecast.

USER'S DESCRIPTION:
"${description}"

ENERGY COST ESTIMATION RULES:
- Large group party / networking: 20-35% drain
- Family gathering / holiday event: 15-30% drain (depends on family dynamics)
- Work meetings / standups: 5-15% per meeting
- Presenting / hosting: 25-40% drain (you're "on")
- 1-on-1 with close friend: 5-10% drain (can even recharge some people)
- 1-on-1 with acquaintance / date: 10-20% drain
- Group activity with friends: 10-20% drain
- Phone/video calls: 5-15% drain
- Overnight recovery: +15-25% per night (more for extroverts, less for introverts)
- Weekend recovery day (no events): +30-40%
- Sub-20% battery = burnout danger zone
- Sub-10% = shutdown/freeze risk

FORECAST RULES:
- Infer dates relative to "this week" if not specified. Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}.
- If they mention "daily standup" or recurring events, include each occurrence.
- Factor in commute/prep time for energy drain.
- Warnings should be specific: "After the networking event Thursday, you'll hit 15% with no recovery window before Friday's team dinner."
- Recovery plan should match the severity — don't say "take a bath" when they need to cancel something.
- Permission statements should feel validating, not preachy.

Return ONLY valid JSON:
{
  "parsed_events": [
    {
      "name": "Event name (inferred from description)",
      "day": "Day of week or date",
      "time": "Approximate time or 'TBD'",
      "duration_hours": 1.5,
      "event_type": "meeting | gathering | party | 1-on-1 | networking | family | presentation | call",
      "estimated_people": 5,
      "energy_cost": 15,
      "notes": "Brief note on why this costs what it does"
    }
  ],
  "energy_forecast": {
    "next_7_days": [
      {
        "date": "Day label (e.g. 'Monday, Feb 24')",
        "start_battery": 70,
        "events": [
          {
            "event": "Event name",
            "time": "Approx time",
            "energy_cost": 15,
            "battery_after": 55
          }
        ],
        "overnight_recovery": 20,
        "end_of_day_battery": 55,
        "warning": "Warning message if battery drops below 25%, null otherwise"
      }
    ]
  },
  "warnings": [
    {
      "type": "Burnout Risk | Overcommitted | No Recovery Window | Back-to-Back Events",
      "when": "Specific day/time",
      "why": "Clear explanation of the danger",
      "battery_prediction": 12,
      "recommendation": "Specific, actionable advice (cancel X, leave Y early, block Z for recovery)"
    }
  ],
  "recovery_plan": {
    "recharge_needed_by": "Specific day/time when recovery is most critical",
    "minimum_hours_alone": 4,
    "recommended_activities": ["Specific recharge suggestions based on the pattern"],
    "what_to_decline": "If overcommitted, what to consider declining or shortening (null if fine)"
  },
  "energy_budgeting": {
    "total_social_hours": 12,
    "already_committed": 75,
    "remaining_capacity": 25,
    "reality_check": "Honest assessment — are they overbooked? Do they have margin? One sentence."
  },
  "permission_statements": {
    "its_okay_to": [
      "Specific permission relevant to their situation (e.g., 'Leave the party by 9pm — you don't owe anyone overtime')",
      "Another relevant permission"
    ],
    "reframe": "A compassionate reframe about protecting energy (not generic — tailored to their specific week)"
  },
  "quick_tip": "One specific, actionable micro-tip for this exact week (e.g., 'Block Thursday 6-9pm as non-negotiable recovery before Friday's event')"
}

CRITICAL: Return ONLY valid JSON. No markdown, no preamble.`, userLanguage);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = message.content.find(item => item.type === 'text')?.text || '';
    const parsed = safeParseJSON(raw);
    res.json(parsed);

  } catch (error) {
    console.error('[RechargeRadar] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate forecast' });
  }
});

// ═══════════════════════════════════════════════════════════════
// TRIAGE — rank events by skip-ability
// ═══════════════════════════════════════════════════════════════

router.post('/recharge-radar/triage', rateLimit(), async (req, res) => {
  try {
    const { parsedEvents, forecast, socialStyle, userLanguage } = req.body;

    if (!parsedEvents?.length) {
      return res.status(400).json({ error: 'No events to triage' });
    }

    const eventsBlock = parsedEvents.map((e, i) =>
      `${i + 1}. ${e.name} (${e.day}, ${e.event_type}, -${e.energy_cost}%, ~${e.estimated_people || '?'} people, ${e.duration_hours}h)`
    ).join('\n');

    const prompt = withLanguage(`You are a social energy triage advisor. The user is overcommitted and needs to know which events to drop, shorten, or modify to avoid burnout.

SOCIAL STYLE: ${socialStyle || 'introvert'}
EVENTS:
${eventsBlock}

${forecast?.warnings?.length ? `CURRENT WARNINGS:\n${forecast.warnings.map(w => `- ${w.type}: ${w.why}`).join('\n')}` : ''}

For each event, assess:
1. ENERGY SAVED if skipped/shortened
2. SOCIAL COST of skipping (career damage, relationship damage, obligation level)
3. MODIFICATION OPTIONS (leave early, attend virtually, send a gift instead, etc.)

Rank from "easiest to skip" to "hardest to skip."

Return ONLY valid JSON:
{
  "triage": [
    {
      "event_name": "Event name",
      "energy_saved": 25,
      "social_cost": "low | medium | high | very_high",
      "social_cost_reason": "Why skipping this matters (or doesn't)",
      "recommendation": "skip | shorten | modify | keep",
      "modification": "Specific alternative if not 'skip' or 'keep' (e.g., 'Attend for first hour only', 'Send a text instead of going'). Null if skip or keep.",
      "net_benefit": "Brief verdict: is skipping worth it?"
    }
  ],
  "optimal_plan": "If you skip/modify the top recommendations, here's what your week looks like — one paragraph summary",
  "energy_recovered": 35,
  "new_lowest_battery": 40
}

Order triage array from easiest-to-skip first to hardest-to-skip last.
CRITICAL: Return ONLY valid JSON.`, userLanguage);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = message.content.find(item => item.type === 'text')?.text || '';
    const parsed = safeParseJSON(raw);
    res.json(parsed);

  } catch (error) {
    console.error('[RechargeRadar/triage] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to triage events' });
  }
});

// ═══════════════════════════════════════════════════════════════
// ADD EVENT — "what if I add one more thing?"
// ═══════════════════════════════════════════════════════════════

router.post('/recharge-radar/add-event', rateLimit(), async (req, res) => {
  try {
    const { newEventDescription, existingEvents, currentForecast, socialStyle, userLanguage } = req.body;

    if (!newEventDescription?.trim()) {
      return res.status(400).json({ error: 'Describe the new event' });
    }

    const existingBlock = existingEvents?.map(e =>
      `- ${e.name} (${e.day}, -${e.energy_cost}%)`
    ).join('\n') || 'None';

    const lowestBattery = currentForecast?.energy_forecast?.next_7_days
      ? Math.min(...currentForecast.energy_forecast.next_7_days.map(d => d.end_of_day_battery))
      : 50;

    const prompt = withLanguage(`You are a social energy analyst. The user already has a forecast and wants to know: "What happens if I add one more thing?"

SOCIAL STYLE: ${socialStyle || 'introvert'}
CURRENT LOWEST BATTERY: ${lowestBattery}%

EXISTING EVENTS:
${existingBlock}

NEW EVENT TO ADD:
"${newEventDescription}"

Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}.

Parse the new event and assess its impact on the existing forecast.

Return ONLY valid JSON:
{
  "new_event": {
    "name": "Inferred event name",
    "day": "Day of week",
    "time": "Approx time or TBD",
    "duration_hours": 1.5,
    "event_type": "meeting | gathering | party | 1-on-1 | networking | family | presentation | call",
    "estimated_people": 5,
    "energy_cost": 20,
    "notes": "Why this costs what it does"
  },
  "impact": {
    "new_lowest_battery": 15,
    "previous_lowest_battery": ${lowestBattery},
    "danger_level": "safe | caution | danger | critical",
    "verdict": "One clear sentence: can they handle this? E.g., 'Adding this drops you to 15% with no recovery window — that's shutdown territory.' or 'You have margin. This is fine.'",
    "suggestion": "If dangerous: what to adjust. If safe: go for it."
  }
}

CRITICAL: Return ONLY valid JSON.`, userLanguage);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = message.content.find(item => item.type === 'text')?.text || '';
    const parsed = safeParseJSON(raw);
    res.json(parsed);

  } catch (error) {
    console.error('[RechargeRadar/add-event] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to assess new event' });
  }
});

// ═══════════════════════════════════════════════════════════════
// REFLECT — "How did the week actually go?"
// ═══════════════════════════════════════════════════════════════

router.post('/recharge-radar/reflect', rateLimit(), async (req, res) => {
  try {
    const { events, reflections, pastReflections, socialStyle, userLanguage } = req.body;

    if (!events?.length || !reflections?.length) {
      return res.status(400).json({ error: 'Need events and reflections' });
    }

    const eventsBlock = events.map((e, i) => {
      const r = reflections[i];
      return `${i + 1}. ${e.name} (predicted -${e.energy_cost}%) → Actual: ${r?.actual || 'not reported'} | ${r?.notes || 'no notes'}`;
    }).join('\n');

    const pastBlock = pastReflections?.length
      ? `\nPAST REFLECTION PATTERNS (from previous weeks):\n${pastReflections.slice(0, 5).map(p => `- ${p.event}: predicted -${p.predicted}%, actual was "${p.actual}" (${p.adjustment || 'no adjustment'})`).join('\n')}`
      : '';

    const prompt = withLanguage(`You are a social energy coach analyzing how a user's week ACTUALLY went vs their forecast. Use this to calibrate future predictions.

SOCIAL STYLE: ${socialStyle || 'introvert'}

EVENTS + ACTUAL RESULTS:
${eventsBlock}
${pastBlock}

ANALYSIS RULES:
- Compare predicted vs actual drain for each event
- Identify patterns: which types of events does this person consistently under/overestimate?
- If past reflections show a pattern, call it out specifically
- Give calibration adjustments: "Increase family event estimates by ~10%" or "Your close-friend coffee meetings are actually restorative — mark them as +5% next time"
- Be specific and data-driven, not generic
- Celebrate if they managed their energy well

Return ONLY valid JSON:
{
  "event_calibrations": [
    {
      "event_name": "Event name",
      "predicted_cost": 15,
      "actual_assessment": "more_draining | as_expected | less_draining | restorative",
      "suggested_adjustment": "+5% for future similar events" or "-10%" or "accurate — no change",
      "insight": "Brief explanation of why this might have been different (1 sentence)"
    }
  ],
  "patterns_detected": [
    "Specific pattern, e.g., 'You consistently underestimate family events by about 10%'",
    "Another pattern if found"
  ],
  "energy_profile_updates": [
    {
      "category": "family | work_meetings | 1-on-1_friends | parties | networking | presentations",
      "current_estimate": "default range",
      "suggested_estimate": "adjusted range based on their data",
      "confidence": "low | medium | high"
    }
  ],
  "week_summary": "One paragraph: how did they do? Did they protect their energy? Did they crash? Compassionate and specific.",
  "next_week_advice": "One concrete suggestion for next week based on what we learned"
}

CRITICAL: Return ONLY valid JSON.`, userLanguage);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = message.content.find(item => item.type === 'text')?.text || '';
    const parsed = safeParseJSON(raw);
    res.json(parsed);

  } catch (error) {
    console.error('[RechargeRadar/reflect] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to process reflection' });
  }
});

// ═══════════════════════════════════════════════════════════════
// DECLINE MESSAGE — draft a decline for a specific event
// ═══════════════════════════════════════════════════════════════

router.post('/recharge-radar/decline-message', rateLimit(), async (req, res) => {
  try {
    const { eventName, eventType, relationship, reason, userLanguage } = req.body;

    if (!eventName) {
      return res.status(400).json({ error: 'Need event name' });
    }

    const prompt = withLanguage(`Write a short, natural decline message for someone who needs to skip a social event to protect their energy. NOT a formal letter — a real text/message a person would actually send.

EVENT: ${eventName}
TYPE: ${eventType || 'social event'}
RELATIONSHIP: ${relationship || 'friend/acquaintance'}
REASON GIVEN (optional): ${reason || 'need to recharge / overwhelmed'}

RULES:
- Keep it SHORT (2-4 sentences max)
- Sound human, not like a template
- Don't over-explain or over-apologize
- Include a brief positive note (looking forward to next time, etc.)
- Match formality to the relationship
- Never mention "social battery" or "energy levels" — just sound like a normal person

Return ONLY valid JSON:
{
  "messages": [
    {
      "tone": "warm",
      "text": "The decline message",
      "best_for": "When you want to (keep it brief)"
    },
    {
      "tone": "brief",
      "text": "Even shorter version",
      "best_for": "When you want minimal explanation"
    },
    {
      "tone": "rain_check",
      "text": "Version that suggests rescheduling",
      "best_for": "When you genuinely want to see them later"
    }
  ]
}

CRITICAL: Return ONLY valid JSON.`, userLanguage);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = message.content.find(item => item.type === 'text')?.text || '';
    const parsed = safeParseJSON(raw);
    res.json(parsed);

  } catch (error) {
    console.error('[RechargeRadar/decline] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate decline message' });
  }
});

module.exports = router;
