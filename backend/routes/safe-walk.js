const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

// ════════════════════════════════════════════════════════════
// SYSTEM PROMPT
// ════════════════════════════════════════════════════════════

const SYSTEM_PROMPT = `You are a personal safety awareness advisor helping someone prepare for a walk. You are thoughtful, practical, and calm — like a wise friend, NOT a paranoid security briefing.

CRITICAL RULES:
1. You do NOT have real-time data about crime, lighting conditions, foot traffic, or current events. Never pretend you do.
2. NEVER say "this route is safe" or "you'll be fine." Always frame as awareness and preparation.
3. Your value is in: applying general urban safety principles to the specific scenario, time-of-day awareness (darkness, business hours, bar closing time), asking questions the user might not have thought of, and helping them feel prepared (not scared).
4. Tailor everything to the SPECIFIC walk described. Don't say "bring a flashlight" for a 5-minute daytime walk. Don't give "avoid dark alleys" advice for a well-lit commercial street at noon.
5. Pre-walk checklist items must include a brief "why" so the user understands the reasoning.
6. Route suggestions should explain WHY (more foot traffic, better lighting, businesses open) — not just "take a different route."
7. The ETA message should be natural and ready to copy-paste into a text message.
8. Tone: helpful and practical. Make the user feel MORE prepared, not MORE anxious. People using this tool may already be nervous — your job is to turn anxiety into actionable preparation.
9. Watch-for items should be SPECIFIC to the scenario described, not generic "stay alert" platitudes.
10. Risk level should be honest but not alarmist. Most walks are low-to-moderate risk. Reserve "high" for genuinely concerning combinations (isolated area + late night + long walk + specific concerns).

FORMAT: Respond in valid JSON matching the schema exactly. No markdown fences, no preamble. Pure JSON only.`;

// ════════════════════════════════════════════════════════════
// ROUTE
// ════════════════════════════════════════════════════════════

router.post('/safe-walk', async (req, res) => {
  try {
    const { action } = req.body;

    if (action === 'assess') {
      const { route, timeOfDay, areaDescription, walkDuration, concerns } = req.body;

      const prompt = `WALK DETAILS:
Route: ${route || 'Not specified'}
Time: ${timeOfDay || 'Not specified'}
Area description: ${Array.isArray(areaDescription) ? areaDescription.join(', ') : (areaDescription || 'Not specified')}
Estimated duration: ${walkDuration || 'Not specified'}
Specific concerns: ${concerns || 'None mentioned'}

Provide a personalized safety assessment for this walk.

Return this exact JSON structure:
{
  "safety_overview": {
    "risk_level": "low | moderate | elevated | high",
    "summary": "2-3 sentence plain language overview of what to expect on this walk"
  },
  "watch_for": [
    {
      "concern": "Brief title (3-5 words)",
      "detail": "Specific, actionable observation about this route/time — not generic advice",
      "severity": "info | caution | warning"
    }
  ],
  "checklist": [
    {
      "item": "Specific action to take before leaving",
      "why": "Brief reason this matters for THIS walk",
      "priority": "essential | recommended | optional"
    }
  ],
  "route_suggestions": [
    {
      "suggestion": "What to consider doing differently",
      "reasoning": "Why this helps for this specific scenario"
    }
  ],
  "before_you_go": {
    "eta_message": "Natural, copy-paste-ready text message to send someone, including route and expected arrival time. Should sound like a real text, not a form letter.",
    "reminders": ["Specific reminder 1", "Specific reminder 2"]
  }
}

Generate 3-5 watch_for items, 4-6 checklist items, 1-3 route_suggestions, and 2-4 reminders. Tailor everything to this specific walk.`;

      console.log(`[SafeWalk] Assessing: ${timeOfDay || 'unknown time'}, ${walkDuration || 'unknown duration'}`);

      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: withLanguage(SYSTEM_PROMPT, req.body.userLanguage),
        messages: [{ role: 'user', content: prompt }]
      });

      const text = message.content.find(c => c.type === 'text')?.text || '';
      const cleaned = cleanJsonResponse(text);
      const parsed = JSON.parse(cleaned);
      return res.json(parsed);
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });

  } catch (error) {
    console.error('SafeWalk error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
