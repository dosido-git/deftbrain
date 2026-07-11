const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

// ════════════════════════════════════════════════════════════
// SYSTEM PROMPT
// ════════════════════════════════════════════════════════════

const SYSTEM_PROMPT = `You are a personal safety awareness advisor helping someone prepare for a walk. You are thoughtful, practical, and calm — like a wise friend, NOT a paranoid security briefing.

CRITICAL RULES:
1. You do NOT have real-time data about crime, lighting conditions, or foot traffic. However, if web search results are available, use them to surface specific local knowledge about the named streets, neighborhoods, parks, or transit stations on this route.
2. NEVER say "this route is safe" or "you'll be fine." Always frame as awareness and preparation.
3. ALWAYS reference the specific locations named (street names, landmarks, neighborhoods). NEVER give advice so generic it could apply to any walk. If you don't have specific knowledge of an area, say so explicitly rather than giving generic tips.
4. Search for pedestrian and cycling infrastructure near the stated route — bike paths, cut-throughs, well-lit alternatives — and include any you find in route suggestions.
5. Tailor everything to the SPECIFIC walk described. Don't say "bring a flashlight" for a 5-minute daytime walk. Don't give "avoid dark alleys" advice for a well-lit commercial street at noon.
6. Pre-walk checklist items must include a brief "why" relevant to this specific walk.
7. Route suggestions should explain WHY (more foot traffic, better lighting, businesses open, bike path available) — not just "take a different route."
8. The ETA message should be natural and ready to copy-paste into a text message.
9. Tone: helpful and practical. Make the user feel MORE prepared, not MORE anxious.
10. Watch-for items should be SPECIFIC to the named route and time — not generic "stay alert" platitudes.
11. Risk level should be honest but not alarmist. Most walks are low-to-moderate risk. Reserve "high" for genuinely concerning combinations.
12. ALWAYS return the JSON schema — even when the route is vague, minimal, or you'd like more detail. NEVER reply in plain prose or ask a clarifying question outside the JSON. If you need more specifics, still fill the schema and put your request for detail inside safety_overview.summary (e.g. "Tell me the specific streets and I can be more precise — in the meantime, here's general awareness for this kind of walk").

FORMAT: Respond in valid JSON matching the schema exactly. No markdown fences, no preamble. Pure JSON only.

Return ONLY valid JSON.`;

// ════════════════════════════════════════════════════════════
// ROUTE
// ════════════════════════════════════════════════════════════

router.post('/safe-walk', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { action } = req.body;

    if (action === 'assess') {
      const { from, to, via, routeFeatures, userLocation, timeOfDay, areaDescription, walkDuration, concerns } = req.body;

      const routeDesc = [
        from && `From: ${from}`,
        to   && `To: ${to}`,
        via  && `Via / notable spots: ${via}`,
      ].filter(Boolean).join('\n');

      const featuresList = Array.isArray(routeFeatures) && routeFeatures.length
        ? routeFeatures.join(', ')
        : null;

      const prompt = `WALK DETAILS:
${routeDesc || 'Route: Not specified'}
${featuresList ? `Route features: ${featuresList}` : ''}
${userLocation ? `User current area: ${userLocation}` : ''}
Time: ${timeOfDay || 'Not specified'}
Area description: ${Array.isArray(areaDescription) ? areaDescription.join(', ') : (areaDescription || 'Not specified')}
Estimated duration: ${walkDuration || 'Not specified'}
Specific concerns: ${concerns || 'None mentioned'}

Search for specific local knowledge about the named streets, neighborhoods, parks, and transit stations on this route. Look for bike paths, pedestrian trails, or well-lit alternatives. Then provide a personalized safety assessment.

Return this exact JSON structure:
{
  "safety_overview": {
    "risk_level": "low | moderate | elevated | high",
    "summary": "2-3 sentence plain language overview — reference the specific locations named",
    "local_context": "Specific knowledge about this route or neighborhood from search. Null if nothing meaningful found. — 1-2 sentences"
  },
  "watch_for": [
    {
      "concern": "Brief title (3-5 words)",
      "detail": "Specific, actionable observation about this named route/time — not generic advice — one sentence",
      "severity": "info | caution | warning"
    }
  ],
  "checklist": [
    {
      "item": "Specific action to take before leaving — one sentence",
      "why": "Brief reason this matters for THIS walk — one sentence",
      "priority": "essential | recommended | optional"
    }
  ],
  "route_suggestions": [
    {
      "suggestion": "What to consider doing differently — include named streets or paths if found — one sentence",
      "reasoning": "Why this helps for this specific scenario — one sentence"
    }
  ],
  "before_you_go": {
    "eta_message": "Natural, copy-paste-ready text message to send someone, including route and expected arrival time. Should sound like a real text. — 2-4 sentences",
    "reminders": ["Specific reminder 1", "Specific reminder 2"]
  }
}

Generate 3-5 watch_for items, 4-6 checklist items, 1-3 route_suggestions, and 2-4 reminders. Reference specific location names throughout. Even if the route is vague, return the full JSON schema — never reply in prose.

Return ONLY valid JSON.`;

      let parsed;
      let parseFailed = false;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const message = await anthropic.messages.create({
            model: MODELS.SMART,
            max_tokens: 4000,
            system: withLanguage(SYSTEM_PROMPT, req.body.userLanguage),
            tools: [{ type: 'web_search_20250305', name: 'web_search' }],
            messages: [{ role: 'user', content: prompt }]
          });
          const text = message.content
            .filter(c => c.type === 'text')
            .map(c => c.text)
            .join('');
          parsed = JSON.parse(cleanJsonResponse(text));
          break;
        } catch (retryErr) {
          // A JSON.parse failure that survives all retries is almost always the
          // model answering in prose (e.g. asking for detail on a vague route) —
          // deterministic, so a retry storm won't help. Surface a helpful 422
          // instead of a generic 500.
          if (retryErr instanceof SyntaxError) parseFailed = true;
          if (attempt === 3) { if (parseFailed) break; throw retryErr; }
          await new Promise(r => setTimeout(r, 1000 * attempt));
        }
      }
      if (parseFailed || !parsed) {
        return res.status(422).json({ error: 'Add a bit more detail about your route (nearby streets, neighborhood, or a landmark) and try again.' });
      }
      if (!parsed.checklist || !parsed.watch_for) {
        return res.status(500).json({ error: 'Could not generate safety plan. Please try again.' });
      }
      return res.json(stripCites(parsed));
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });

  } catch (error) {
    console.error('SafeWalk error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// Recursively strip <cite ...>...</cite> tags from string values in any
// nested structure. Required because the web_search tool wraps phrases in
// citation tags inside JSON string values.
function stripCites(val) {
  if (typeof val === 'string') return val.replace(/<\/?(antml:)?cite\b[^>]*>/g, '');
  if (Array.isArray(val)) return val.map(stripCites);
  if (val && typeof val === 'object') {
    return Object.fromEntries(
      Object.entries(val).map(([k, v]) => [k, stripCites(v)])
    );
  }
  return val;
}

module.exports = router;
