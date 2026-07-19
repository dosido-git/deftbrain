const express = require('express');
const router  = express.Router();
const { callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

// POST /api/culture-briefing/stream
// Generates a cultural intelligence briefing for a destination.
// Despite the /stream suffix (matching frontend callToolEndpoint path), this
// returns a standard JSON response — the name was set by the frontend author.
router.post('/culture-briefing', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  const { destination, tripPurpose, duration, homeCountry, region, context, userLanguage, userLocale, userCurrency, userRegion } = req.body;

  if (!destination || !destination.trim()) {
    return res.status(400).json({ error: 'destination is required' });
  }

  const purposeLabel = {
    tourism:  'tourism / leisure',
    business: 'business travel',
    family:   'family or social visit',
    living:   'moving or long-term living',
    study:    'study or research',
    remote:   'remote work',
  }[tripPurpose] || tripPurpose || 'general travel';

  const contextParts = [];
  if (homeCountry) contextParts.push(`Traveller is from: ${homeCountry}`);
  if (duration)    contextParts.push(`Trip length: ${duration}`);
  contextParts.push(`Purpose: ${purposeLabel}`);
  if (region && region.trim())   contextParts.push(`Specific region/city within ${destination.trim()}: ${region.trim()}`);
  if (context && context.trim())  contextParts.push(`Traveller's own context & constraints (HONOR these): ${context.trim()}`);

  const prompt = `You are a cultural intelligence expert. Produce a practical briefing for a traveller visiting ${destination.trim()}.

Context:
${contextParts.join('\n')}

Return ONLY valid JSON in this exact shape — no markdown, no explanation:

{
  "overview": "2–3 sentence cultural snapshot — tone, values, what surprises most visitors",
  "cultural_gap": <integer 0-100 — how different daily & business etiquette is from the traveler's home country (${homeCountry || 'their home'}): 0-24 minimal (e.g. US↔Canada), 25-54 significant (e.g. US↔Japan for business), 55-100 major (e.g. secular-Western↔conservative-Gulf). When unsure, round UP>,
  "sections": [
    {
      "id": "greetings",
      "icon": "🤝",
      "title": "Greetings & introductions",
      "dos": ["specific do #1", "specific do #2"],
      "donts": ["specific don't #1", "specific don't #2"],
      "notes": ["nuance or context note"]
    },
    {
      "id": "taboos",
      "icon": "🚫",
      "title": "Taboos & common mistakes",
      "dos": [],
      "donts": ["mistake #1", "mistake #2", "mistake #3"],
      "notes": ["why this matters"]
    },
    {
      "id": "dining",
      "icon": "🍽️",
      "title": "Dining etiquette",
      "dos": ["do #1", "do #2"],
      "donts": ["don't #1"],
      "notes": []
    },
    {
      "id": "dress",
      "icon": "👗",
      "title": "Dress & appearance",
      "dos": ["do #1"],
      "donts": ["don't #1"],
      "notes": []
    },
    {
      "id": "tipping",
      "icon": "💰",
      "title": "Tipping & payment",
      "dos": ["do #1"],
      "donts": ["don't #1"],
      "notes": ["note on local norms"]
    },
    {
      "id": "business_etiquette",
      "icon": "💼",
      "title": "Business etiquette",
      "dos": ["do #1", "do #2"],
      "donts": ["don't #1"],
      "notes": []
    },
    {
      "id": "gift_giving",
      "icon": "🎁",
      "title": "Gifts & hospitality",
      "dos": [],
      "donts": [],
      "notes": []
    },
    {
      "id": "religion",
      "icon": "🕌",
      "title": "Religion & customs",
      "dos": [],
      "donts": ["don't #1"],
      "notes": ["context note"]
    },
    {
      "id": "transport",
      "icon": "🚌",
      "title": "Getting around",
      "dos": ["do #1"],
      "donts": [],
      "notes": ["practical tip"]
    },
    {
      "id": "safety",
      "icon": "🛡️",
      "title": "Safety & scams",
      "dos": ["do #1"],
      "donts": ["don't #1"],
      "notes": []
    },
    {
      "id": "phrases",
      "icon": "💬",
      "title": "Key phrases & attitude",
      "dos": ["phrase or attitude tip #1", "phrase or attitude tip #2"],
      "donts": [],
      "notes": []
    }
  ],
  "insider_tips": [
    "Specific, non-obvious tip #1",
    "Specific, non-obvious tip #2",
    "Specific, non-obvious tip #3"
  ],
  "forgiveness": {
    "forgiven": ["a minor slip locals graciously overlook in a foreign visitor", "another honest mistake that carries no real consequence"],
    "serious": ["a mistake that genuinely damages trust or the relationship — say what it signals to them"]
  },
  "confidence": "high | medium | low — YOUR confidence in the specifics of THIS briefing; use 'low' for places you have thin or uncertain knowledge of"
}

Rules:
- Every string must be specific to ${destination.trim()} — no generic travel advice
- Frame advice RELATIVE to the traveler's home country (${homeCountry || 'their home country'}) — emphasize where norms DIFFER from home, not just absolute rules
- Where an etiquette rule has a specific named or local-language concept, NAME it with a brief gloss (e.g. the Japanese business-card ritual = meishi) — but ONLY include a local-language word or phrase when you are CERTAIN of its meaning and usage; if not certain, describe the concept in English instead. A wrong phrase confidently delivered is worse than no phrase. Same for physical customs (which escalator side, which hand): state them only if certain, and never invert regional variations.
- Use realistic, specific numbers — never inflate quantities
- If the traveller context includes constraints (dietary, religious, alcohol, accessibility, travelling with children), TAILOR the relevant sections to them (e.g. vegetarian to dining; non-drinker to business-drinking customs)
- gift_giving: leave its arrays [] if gift-giving is not culturally significant for this destination/purpose
- forgiveness: distinguish minor slips locals forgive in visitors from mistakes that seriously damage trust
- confidence: be honest — use 'low' for less-documented destinations rather than inventing specifics
- dos/donts/notes arrays may be empty [] when not applicable to this destination
- Keep each dos/donts/notes array to AT MOST 3 items; keep insider_tips to 3-4. Each string is ONE short phrase (not a paragraph) — the briefing must be scannable and fit the response budget
- cultural_gap: score the etiquette distance from the home culture honestly using the schema rubric — do NOT default to a low, reassuring number
- Weight DEPTH toward the sections most relevant to the trip purpose (${purposeLabel}) — for business, go deeper on meetings, hierarchy, and gift-giving
- CRITICAL: Return ONLY valid JSON. No markdown fences, no commentary.`;

  try {
    const parsed = await callClaudeWithRetry({
      model: MODELS.FAST,
      max_tokens: 5000,
      system: withLanguage('You are a cultural intelligence expert. Return only valid JSON.', userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: prompt }],
    }, { label: 'culture-briefing' });

    if (!parsed.sections || !Array.isArray(parsed.sections) || !parsed.overview) {
      return res.status(500).json({ error: 'Briefing generation failed. Please try again.' });
    }

    // risk_level is computed in code from the model's cultural_gap score (0-100) so the
    // low/medium/high label is deterministic and can't be under-rated by the model.
    const gap = Number(parsed.cultural_gap);
    parsed.risk_level = Number.isFinite(gap)
      ? (gap >= 55 ? 'high' : gap >= 25 ? 'medium' : 'low')
      : (parsed.risk_level || 'medium');
    delete parsed.cultural_gap;

    return res.json(parsed);
  } catch (err) {
    console.error('culture-briefing error:', err);
    return res.status(500).json({ error: 'Failed to generate briefing. Please try again.' });
  }
});

module.exports = router;
