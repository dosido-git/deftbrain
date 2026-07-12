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
  const { destination, tripPurpose, duration, homeCountry, userLanguage, userLocale, userCurrency, userRegion } = req.body;

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

  const prompt = `You are a cultural intelligence expert. Produce a practical briefing for a traveller visiting ${destination.trim()}.

Context:
${contextParts.join('\n')}

Return ONLY valid JSON in this exact shape — no markdown, no explanation:

{
  "overview": "2–3 sentence cultural snapshot — tone, values, what surprises most visitors",
  "risk_level": "low" | "medium" | "high",
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
  ]
}

Rules:
- Every string must be specific to ${destination.trim()} — no generic travel advice
- dos/donts/notes arrays may be empty [] when not applicable to this destination
- Keep each dos/donts/notes array to AT MOST 3 items; keep insider_tips to 3-4. Each string is ONE short phrase (not a paragraph) — the briefing must be scannable and fit the response budget
- risk_level: "low" = easy cultural adjustment, "medium" = some significant differences, "high" = major cultural differences requiring real preparation
- Tailor content to the stated trip purpose (${purposeLabel})
- CRITICAL: Return ONLY valid JSON. No markdown fences, no commentary.`;

  try {
    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 5000,
      system: withLanguage('You are a cultural intelligence expert. Return only valid JSON.', userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: prompt }],
    }, { label: 'culture-briefing' });

    if (!parsed.sections || !Array.isArray(parsed.sections) || !parsed.overview) {
      return res.status(500).json({ error: 'Briefing generation failed. Please try again.' });
    }

    return res.json(parsed);
  } catch (err) {
    console.error('culture-briefing error:', err);
    return res.status(500).json({ error: 'Failed to generate briefing. Please try again.' });
  }
});

module.exports = router;
