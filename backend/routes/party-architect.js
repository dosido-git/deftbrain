const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

// ════════════════════════════════════════════════════════════
// POST /party-architect — Design Events People Remember
// ════════════════════════════════════════════════════════════
router.post('/party-architect', async (req, res) => {
  try {
    const { occasion, guestCount, guestMix, space, budget, vibe, duration, constraints, userLanguage } = req.body;

    if (!occasion?.trim()) {
      return res.status(400).json({ error: 'Tell us what kind of event you\'re hosting.' });
    }

    const systemPrompt = `You are an event experience designer — part party planner, part social psychologist, part improv director. You don't plan parties. You engineer memorable experiences that feel effortless.

YOUR PHILOSOPHY:
1. ENERGY CURVE. Great events aren't one mood. They build, peak, and wind down. Design the arc: warm arrival (low energy) → social mixing (building) → peak moment (high energy) → gentle wind-down (closing). Flat-energy events feel boring.
2. MIXING IS ENGINEERED. When groups don't know each other, you need STRUCTURAL reasons for people to interact — not just "mingle." Design activities, seating, food stations, or conversation prompts that force organic mixing.
3. FOOD AND DRINK ARE SOCIAL ARCHITECTURE. When food arrives, where it's placed, whether it's served or self-serve — all of this shapes how people move and who talks to whom.
4. THE CONVERSATION PROBLEM. The hardest part of any gathering isn't logistics — it's that moment when two strangers stand next to each other and have nothing to say. Solve this with environmental conversation starters, not forced icebreakers.
5. BUDGET-CONSCIOUS BY DEFAULT. A $100 dinner party can be more memorable than a $5,000 catered event. Focus on experience design, not spending.
6. THE GRACEFUL EXIT. How the event ends matters. Design a clear wind-down signal so people don't drift away awkwardly.
7. Be specific with timing. "Around 8pm" is useless. "7:45 — put the playlist on low, dim lights slightly, set out dessert" is actionable.
8. Tailor EVERYTHING to the space, guest count, and guest dynamics they described.`;

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
      "time": "Specific time or offset (e.g., '7:00 PM' or '+0:00')",
      "phase": "Arrival | Warm-up | Building | Peak | Wind-down | Exit",
      "action": "What's happening at this moment. Be specific — music volume, lighting, food timing, activity launch.",
      "host_note": "What the host should be doing at this exact moment.",
      "why": "Why this moment matters in the overall arc."
    }
  ],

  "mixing_strategies": [
    {
      "strategy": "Name of the mixing technique",
      "how": "Exactly how to execute it — step by step. Not 'play a game' but the specific game with rules.",
      "when": "When in the timeline to deploy this",
      "why_it_works": "The social psychology behind it"
    }
  ],

  "conversation_starters": [
    "5-6 environmental or structural conversation catalysts — things that create conversation without anyone being told to 'go talk to people'. Objects on tables, music choices, food that requires interaction, visual surprises."
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

  "the_exit": {
    "signal": "How to signal the event is winding down without saying 'get out'",
    "script": "The exact thing to say when it's time"
  },

  "budget_breakdown": {
    "total_estimate": "Rough total for the budget level they stated",
    "biggest_expense": "Where the money goes",
    "where_to_save": "Where most people overspend unnecessarily",
    "free_upgrades": "2-3 things that make a big impact and cost nothing"
  },

  "disaster_prevention": [
    "3-4 things that commonly go wrong at this type of event and how to prevent each one."
  ]
}

Generate 8-12 timeline entries and 2-3 mixing strategies.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    return res.json(parsed);

  } catch (error) {
    console.error('PartyArchitect error:', error);
    res.status(500).json({ error: error.message || 'Failed to design event' });
  }
});

module.exports = router;
