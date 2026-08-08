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

    // One 10-key schema at max_tokens 5000 measured 82s — past the ~60s where
    // Safari abandons the fetch. The timeline alone is 8 entries x 5 fields, so
    // it goes in one half and everything else in the other; the halves emit
    // disjoint top-level keys and merge back to the original response shape.
    const brief = `THE OCCASION: ${occasion}
GUEST COUNT: ${guestCount || 'not specified'}
GUEST MIX: ${guestMix || 'not specified'}
SPACE: ${space || 'not specified'}
BUDGET: ${budget || 'moderate'}
VIBE: ${vibe || 'fun and relaxed'}
DURATION: ${duration || '3-4 hours'}
${constraints ? `CONSTRAINTS: ${constraints}` : ''}

You are writing ONE PART of the event design. Another designer is handling the other part — cover only your own keys, and do not restate theirs.`;

    // ── Part A: the read and the minute-by-minute arc ──
    const arcPrompt = `${brief}

YOUR PART: the read on the gathering, the energy arc, the timeline, and the exit.

Return ONLY valid JSON with EXACTLY these four top-level keys:
{
  "event_read": "1-2 sentences showing you understand the social challenge of this specific gathering.",

  "energy_curve": "One sentence describing the emotional arc of the evening: where it starts, where it peaks, how it closes.",

  "timeline": [
    {
      "time": "Specific time or offset (e.g., '7:00 PM' or '+0:00')",
      "phase": "Arrival | Warm-up | Building | Peak | Wind-down | Exit",
      "action": "What's happening at this moment. Be specific — music volume, lighting, food timing, activity launch.",
      "host_note": "What the host should be doing at this exact moment.",
      "why": "Why this moment matters in the overall arc."
    }
  ],

  "the_exit": {
    "signal": "How to signal the event is winding down without saying 'get out'",
    "script": "The exact thing to say when it's time"
  }
}

Generate AT MOST 8 timeline entries (6-8) spanning the stated duration. Keep every field to one concise sentence — the_exit.script may be 2-4 short sentences. Never place a double-quote (") character inside any string value — it breaks the JSON. Return ONLY the JSON object — no markdown, no backticks, no explanation. All array fields must be arrays, not strings.`;

    // ── Part B: the mechanics that make the arc happen ──
    const elementsPrompt = `${brief}

YOUR PART: the mixing mechanics, the food and music, the budget, and what can go wrong.

Return ONLY valid JSON with EXACTLY these six top-level keys:
{
  "mixing_strategies": [
    {
      "strategy": "Name of the mixing technique",
      "how": "Exactly how to execute it — step by step. Not 'play a game' but the specific game with rules.",
      "when": "When in the timeline to deploy this",
      "why_it_works": "The social psychology behind it"
    }
  ],

  "conversation_starters": [
    "One environmental or structural conversation catalyst (object on a table, food that requires interaction, a visual surprise, a music choice — anything that creates conversation without telling people to mingle)",
    "Another conversation catalyst"
  ],

  "food_and_drink_strategy": {
    "approach": "Served vs. stations vs. potluck vs. interactive. WHY this format works for this event.",
    "timing": "When food appears and why the timing matters for energy.",
    "budget_option": "A way to do this well on a tight budget.",
    "signature_touch": "One memorable food/drink detail that makes this feel special."
  },

  "music_plan": {
    "arrival": "Genre/vibe and volume for arrival",
    "peak": "Genre/vibe and volume for peak energy",
    "wind_down": "Genre/vibe for closing"
  },

  "budget_breakdown": {
    "total_estimate": "Rough total for the budget level they stated",
    "biggest_expense": "Where the money goes",
    "where_to_save": "Where most people overspend unnecessarily",
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

Generate 2 mixing strategies, 4 conversation starters, 2 free_upgrades, and 3 disaster_prevention items. Keep every field to one concise sentence. Express all money amounts (total_estimate, biggest_expense, etc.) in the user's local currency — never assume US dollars. Never place a double-quote (") character inside any string value — it breaks the JSON. Return ONLY the JSON object — no markdown, no backticks, no explanation. All array fields must be arrays, not strings.`;

    const locale = withLocaleContext(userLocale, userCurrency, userRegion);
    const [arcPart, elementsPart] = await Promise.all([
      callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: 3000,
        system: withLanguage(systemPrompt, userLanguage) + locale,
        messages: [{ role: 'user', content: arcPrompt }],
      }, { label: 'party-architect:arc' }),
      callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: 3000,
        system: withLanguage(systemPrompt, userLanguage) + locale,
        messages: [{ role: 'user', content: elementsPrompt }],
      }, { label: 'party-architect:elements' }),
    ]);

    const parsed = { ...elementsPart, ...arcPart };

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
