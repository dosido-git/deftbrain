const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

// ════════════════════════════════════════════════════════════
// SYSTEM PROMPT
// ════════════════════════════════════════════════════════════

const SYSTEM_PROMPT = `You are a personal driving safety advisor helping someone prepare for a solo drive. You are calm, direct, and practical — like a trusted friend who happens to know a lot about road safety, NOT an alarmist liability lawyer.

CRITICAL RULES:
1. You do NOT have real-time traffic, road condition, or weather data. Never pretend you do.
2. NEVER say "you'll be fine" or "this route is safe." Always frame as awareness and preparation.
3. Your value is in: applying driving safety principles to THIS specific scenario (route, time, conditions, how the driver is feeling), surfacing things the driver might not have thought of, and helping them feel prepared — not frightened.
4. Tailor everything to the SPECIFIC drive described. A highway drive in snow at midnight gets very different advice from a city drive on a Tuesday afternoon.
5. The "honest_assessment" field is ONLY for genuinely concerning states — tired, not great, or multiple compounding risk factors. If the driver says they're fine and conditions are normal, omit it or set it to null. If it exists, be direct and honest without being preachy. One paragraph. No lecturing.
6. Pre-drive checklist items must include a brief "why" relevant to this specific drive and conditions.
7. Watch-for items must be SPECIFIC to the stated route, conditions, and time — not generic "watch for other drivers" advice.
8. The ETA message should sound like a real text, not a form letter.
9. Risk level: most drives are low or moderate. Reserve "elevated" for meaningful combinations of factors. Reserve "high" for genuinely dangerous scenarios (impaired + storm + unfamiliar road + late night, etc.).
10. If web search results are available about the specific route or current conditions, reference them specifically. If not, work from stated conditions and general knowledge of driving safety.
11. Do NOT mention psychological conditions or diagnoses. Use plain language: "tired" not "fatigued driver syndrome."

FORMAT: Respond in valid JSON matching the schema exactly. No markdown fences, no preamble. Pure JSON only.`;

// ════════════════════════════════════════════════════════════
// ROUTE
// ════════════════════════════════════════════════════════════

router.post('/drive-home', async (req, res) => {
  try {
    const { action } = req.body;

    if (action === 'assess') {
      const { from, to, timeOfDay, conditions, feelingState, roadType } = req.body;

      const conditionsList = Array.isArray(conditions) && conditions.length
        ? conditions.join(', ')
        : 'Clear';

      const prompt = `DRIVE DETAILS:
From: ${from || 'Not specified'}
To: ${to || 'Not specified'}
Time of day: ${timeOfDay || 'Not specified'}
Conditions: ${conditionsList}
Road type: ${roadType || 'Not specified'}
How the driver is feeling: ${feelingState || 'Not specified'}

Provide a personalized safety assessment for this drive.

Return this exact JSON structure:
{
  "safety_overview": {
    "risk_level": "low | moderate | elevated | high",
    "summary": "2-3 sentence plain language overview tailored to this specific drive",
    "local_context": "Optional: specific knowledge about this route, region, or road type that's relevant. Null if nothing meaningful to add."
  },
  "honest_assessment": "Only include if driver is tired, not feeling great, or risk factors are genuinely compounding. Be direct and honest — one paragraph. Null otherwise.",
  "watch_for": [
    {
      "concern": "Brief title (3-5 words)",
      "detail": "Specific, actionable observation about this drive — not generic advice",
      "severity": "info | caution | warning"
    }
  ],
  "checklist": [
    {
      "item": "Specific action to take before leaving",
      "why": "Brief reason this matters for THIS drive and conditions",
      "priority": "essential | recommended | optional"
    }
  ],
  "before_you_go": {
    "eta_message": "Natural, copy-paste-ready text to send someone before leaving. Include from/to and expected arrival. Should sound like a real text.",
    "reminders": ["Specific reminder 1", "Specific reminder 2"]
  }
}

Generate 3-5 watch_for items, 4-6 checklist items, and 2-3 reminders. Tailor everything to this specific drive and conditions.`;

      // Enable web search for route/condition awareness
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: withLanguage(SYSTEM_PROMPT, req.body.userLanguage),
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{ role: 'user', content: prompt }]
      });

      // Extract the final text response (may follow tool use blocks)
      const text = message.content
        .filter(c => c.type === 'text')
        .map(c => c.text)
        .join('');

      const cleaned = cleanJsonResponse(text);
      const parsed = JSON.parse(cleaned);
      return res.json(parsed);
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });

  } catch (error) {
    console.error('DriveHome error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
