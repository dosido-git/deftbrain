// culture-briefing.js
const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage, cleanJsonResponse } = require('../lib/claude');
const { rateLimit } = require('../middleware/rateLimit');

const PURPOSE_LABELS = {
  tourism:  'tourism / sightseeing',
  business: 'business travel',
  family:   'visiting family or friends',
  living:   'moving to / living in',
  study:    'study or research',
  remote:   'remote work / digital nomad',
};

router.post('/stream', rateLimit(), async (req, res) => {
  const { destination, tripPurpose, duration, homeCountry, userLanguage } = req.body;

  if (!destination?.trim()) {
    return res.status(400).json({ error: 'Destination is required.' });
  }

  const purposeLabel = PURPOSE_LABELS[tripPurpose] ?? 'travel';
  const durationNote = duration ? ` for ${duration}` : '';
  const homeNote     = homeCountry ? ` The traveler is from ${homeCountry}.` : '';

  const systemPrompt = withLanguage(
    `You are an expert cultural intelligence advisor with deep knowledge of customs, etiquette, social norms, and practical travel realities in countries worldwide. Your briefings are accurate, specific, actionable, and free of stereotypes. You highlight genuine cultural differences that matter in practice — not superficial tourist tips. You always return only valid JSON with no markdown, no code blocks, and no explanation outside the JSON object.`,
    userLanguage
  );

  const prompt = `Create a comprehensive cultural briefing for someone traveling to ${destination.trim()} for ${purposeLabel}${durationNote}.${homeNote}

Return ONLY valid JSON with this exact structure:
{
  "overview": <2-3 sentence honest summary of what a newcomer needs to understand about this culture — the most important mindset shift>,
  "risk_level": "high" | "medium" | "low",
  "sections": [
    {
      "id": <one of: "greetings", "taboos", "dining", "dress", "tipping", "business_etiquette", "religion", "transport", "safety", "phrases">,
      "icon": <single emoji>,
      "title": <short section name>,
      "dos": [<specific thing to DO — concrete, actionable — max 5>],
      "donts": [<specific thing to AVOID — concrete, not vague — max 5>],
      "notes": [<nuanced context or explanation that doesn't fit do/don't — max 3>]
    }
  ],
  "insider_tips": [<practical tip that guidebooks miss — specific, genuinely useful — max 6>],
  "key_phrases": [
    {
      "phrase": <word or phrase in local language>,
      "meaning": <what it means and when to use it>,
      "pronunciation": <phonetic guide — optional, null if destination is English-speaking>
    }
  ]
}

Guidelines:
- Include sections most relevant to ${purposeLabel} — always include greetings, taboos, dining; add business_etiquette if business travel; always add religion for destinations where it's culturally central
- risk_level reflects how much cultural adjustment a Western traveler typically needs: high = significant differences requiring active attention, medium = noticeable differences but manageable, low = broadly familiar norms
- Be specific: "Don't point with your index finger — use your whole hand" not "be respectful of local customs"
- Avoid stereotypes — focus on genuine majority cultural norms with appropriate nuance
- key_phrases: 4-6 phrases that actually matter beyond "hello" and "thank you"
- insider_tips: things that save embarrassment or money that most travelers discover the hard way
- Return ONLY the JSON object`;

  try {
    const result = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = cleanJsonResponse(result);
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return res.status(500).json({ error: 'Failed to parse briefing. Please try again.' });
    }

    if (!parsed?.overview || !Array.isArray(parsed?.sections)) {
      return res.status(500).json({ error: 'Unexpected response format. Please try again.' });
    }

    res.json({
      overview:      parsed.overview,
      risk_level:    parsed.risk_level ?? 'medium',
      sections:      parsed.sections,
      insider_tips:  Array.isArray(parsed.insider_tips) ? parsed.insider_tips : [],
      key_phrases:   Array.isArray(parsed.key_phrases) ? parsed.key_phrases : [],
    });
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: 'Briefing failed. Please try again.' });
    }
  }
});

module.exports = router;
