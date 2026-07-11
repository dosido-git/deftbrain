const express = require('express');
const router = express.Router();
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

// ════════════════════════════════════════════════════════════
// POST /party-architect — Design Events People Remember
// ════════════════════════════════════════════════════════════
router.post('/party-architect', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { occasion, guestCount, guestMix, space, budget, vibe, duration, constraints, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!occasion?.trim()) {
      return res.status(400).json({ error: 'Tell us what kind of event you\'re hosting.' });
    }

    const systemPrompt = `You are an event experience designer — part party planner, part social psychologist, part improv director. You don't plan parties. You engineer memorable experiences that feel effortless.`;

    const userPrompt = `THE OCCASION: ${occasion}
GUEST COUNT: ${guestCount || 'not specified'}
GUEST MIX: ${guestMix || 'not specified'}
SPACE: ${space || 'not specified'}
BUDGET: ${budget || 'moderate'}
VIBE: ${vibe || 'fun and relaxed'}
DURATION: ${duration || '3-4 hours'}
${constraints ? `CONSTRAINTS: ${constraints}` : ''}

Design the event. Return ONLY valid JSON:
{
  "event_read": "1-2 sentences showing you understand the social challenge of this specific gathering.",

  "energy_curve": "One sentence describing the emotional arc of the evening: where it starts, where it peaks, how it closes.",

  "timeline": [
    {
      "time": "Specific time or offset (e.g., '7:00 PM' or '+0:00') — one sentence",
      "phase": "Arrival | Warm-up | Building | Peak | Wind-down | Exit",
      "action": "What's happening at this moment. Be specific — music volume, lighting, food timing, activity launch. — one sentence",
      "host_note": "What the host should be doing at this exact moment. — one sentence",
      "why": "Why this moment matters in the overall arc. — one sentence"
    }
  ],

  "mixing_strategies": [
    {
      "strategy": "Name of the mixing technique — one sentence",
      "how": "Exactly how to execute it — step by step. Not 'play a game' but the specific game with rules. — one sentence",
      "when": "When in the timeline to deploy this — one sentence",
      "why_it_works": "The social psychology behind it — one sentence"
    }
  ],

  "conversation_starters": [
    "One environmental or structural conversation catalyst (object on a table, food that requires interaction, a visual surprise, a music choice — anything that creates conversation without telling people to mingle)",
    "Another conversation catalyst"
  ],

  "food_and_drink_strategy": {
    "approach": "Served vs. stations vs. potluck vs. interactive. WHY this format works for this event. — one sentence",
    "timing": "When food appears and why the timing matters for energy. — one sentence",
    "budget_option": "A way to do this well on a tight budget. — one sentence",
    "signature_touch": "One memorable food/drink detail that makes this feel special. — one sentence"
  },

  "music_plan": {
    "arrival": "Genre/vibe and volume for arrival — one sentence",
    "peak": "Genre/vibe and volume for peak energy — one sentence",
    "wind_down": "Genre/vibe for closing — one sentence"
  },

  "the_exit": {
    "signal": "How to signal the event is winding down without saying 'get out' — one sentence",
    "script": "The exact thing to say when it's time — 2-4 sentences"
  },

  "budget_breakdown": {
    "total_estimate": "Rough total for the budget level they stated — one sentence",
    "biggest_expense": "Where the money goes — one sentence",
    "where_to_save": "Where most people overspend unnecessarily — one sentence",
    "free_upgrades": [
      "One thing that makes a big impact and costs nothing",
      "Another free upgrade"
    ]
  },

  "disaster_prevention": [
    "One thing that commonly goes wrong at this type of event and how to prevent it",
    "Another disaster prevention tip"
  ]
}

Generate 6-8 timeline entries, 2 mixing strategies, 4 conversation starters, 2 free_upgrades, and 3 disaster_prevention items. Return ONLY the JSON object — no markdown, no backticks, no explanation. All array fields must be arrays, not strings.`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 3750,
      system: withLanguage(systemPrompt, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'party-architect' });

    // Sanitize: coerce any array fields that came back as strings
    const toArray = (val) => {
      if (Array.isArray(val)) return val;
      if (typeof val === 'string' && val.trim()) return [val];
      return [];
    };
    parsed.timeline            = toArray(parsed.timeline);
    parsed.mixing_strategies   = toArray(parsed.mixing_strategies);
    parsed.conversation_starters = toArray(parsed.conversation_starters);
    parsed.disaster_prevention = toArray(parsed.disaster_prevention);
    if (parsed.budget_breakdown) {
      parsed.budget_breakdown.free_upgrades = toArray(parsed.budget_breakdown?.free_upgrades);
    }

    return res.json(parsed);

  } catch (error) {
    console.error('PartyArchitect error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
