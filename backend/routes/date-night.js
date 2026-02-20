const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

router.post('/date-night', async (req, res) => {
  try {
    const { budget, currency, dateType, location, restrictions, lastTime, startTime, userLanguage } = req.body;

    if (!location || !location.trim()) {
      return res.status(400).json({ error: 'Please enter a city or neighborhood' });
    }
    if (!dateType) {
      return res.status(400).json({ error: 'Please select a date type' });
    }

    const currencySymbol = currency || '$';

    const dateTypeLabels = {
      casual: 'Casual — low-key, comfortable, no pressure',
      romantic: 'Romantic — intimate, special, memorable',
      adventurous: 'Adventurous — try something new, unexpected',
      first_date: 'First Date — impressive but not try-hard, easy exit points, conversation-friendly',
      anniversary: 'Anniversary — celebrate the relationship, nostalgic or aspirational',
      stay_in: 'Stay-In — cozy night at home, delivery/cooking/activities at home',
    };

    const systemPrompt = `You are a date night planning expert who creates evening plans for people ANYWHERE in the world. You understand local culture, dining customs, pricing, and social norms for the specified location.

YOUR PHILOSOPHY:
- A great date isn't about spending money. It's about intentionality. A modest-budget date with a plan feels better than an expensive one where you're winging it.
- Budget is a HARD constraint in the specified currency. The total must stay UNDER the budget with a buffer.
- Every stop should flow into the next. Don't suggest a loud bar followed by a quiet museum.
- Suggest venue TYPES and styles that are REALISTIC and culturally appropriate for the location. Use phrases like "a cozy ramen shop" or "a rooftop café" rather than inventing specific business names.
- For first dates: always include a natural exit point. Suggest venues where conversation is easy.
- For stay-in dates: the budget goes toward delivery food, ingredients, streaming, games, or supplies.

CULTURAL AWARENESS — CRITICAL:
- Adapt venue types to local culture. An izakaya in Tokyo, a tapas bar in Madrid, a hawker centre in Singapore, a biergarten in Munich, a dhaba in Delhi, a braai spot in Johannesburg.
- Be aware of local dating norms. In some cultures, public displays of affection are uncommon. In some places, alcohol is not widely consumed or available. Adapt accordingly without making assumptions about the specific couple.
- Use locally appropriate transportation (tuk-tuks, metro, trams, walking, etc.)
- Suggest conversation starters that are culturally relevant and sensitive
- Respect local dining customs (tipping culture varies, shared plates vs individual, course structure, etc.)
- Use the correct currency symbol throughout. All costs must be in ${currencySymbol}.
- Be realistic about local price levels. A dinner in central Tokyo costs very differently than in Chiang Mai or rural Poland.

BUDGET RULES:
- All costs in ${currencySymbol} — do NOT use any other currency symbol
- Leave at least 10% of the budget as a buffer (tips where customary, transport surcharges, impulse buys)
- Include estimated cost PER stop
- Factor in transportation if stops aren't walkable
- For stay-in dates, include delivery fees and tips (where applicable) in the budget`;

    const userPrompt = `PLAN A DATE NIGHT:
- Budget: ${currencySymbol}${budget} (hard cap — plan to spend ~${currencySymbol}${Math.round(budget * 0.85)} to leave buffer)
- Currency: ${currencySymbol} — use ONLY this symbol for all costs
- Date type: ${dateTypeLabels[dateType] || dateType}
- Location: ${location}
- Start time: ${startTime || '7:00 PM'}
${restrictions ? `- Restrictions/dealbreakers: ${restrictions}` : ''}
${lastTime ? `- What we did last time (avoid repeating): ${lastTime}` : ''}

Generate a complete evening plan with 2-4 stops that are culturally appropriate for ${location}. Return ONLY valid JSON:
{
  "vibe_title": "A catchy, location-specific name for this evening (e.g., 'Twilight Tacos & Rooftop Stars', 'Shibuya Izakaya Crawl', 'Canal-Side Aperitivo')",
  "vibe_description": "One sentence setting the mood — what this evening FEELS like",

  "itinerary": [
    {
      "time": "7:00 PM",
      "venue_name": "Descriptive venue type appropriate to ${location} (e.g., 'A cozy wine bar with dim lighting', NOT a made-up business name)",
      "stop_type": "drinks | dinner | dessert | walk | entertainment | activity",
      "description": "What you'll do here, why it fits the vibe, what to order/try. Culturally specific suggestions.",
      "estimated_cost": 25,
      "pro_tip": "Insider tip — best seat, what to order, local custom to be aware of"
    }
  ],

  "total_estimated": 65,
  "buffer": 10,

  "transportation": "How to get between stops using LOCAL transportation options. Be specific about distances and costs in ${currencySymbol}.",

  "conversation_starters": [
    "3-5 conversation prompts tailored to the date type. For first dates: getting-to-know-you. For anniversaries: reflection and future. For casual: fun and light."
  ],

  "plan_b": "What to do if the main venue has a wait or is closed. A specific alternative that fits the same budget and vibe, appropriate for ${location}.",

  "tips": [
    "2-3 specific tips to elevate this evening, including any local customs or etiquette worth knowing"
  ]
}

IMPORTANT: All estimated_cost values, total_estimated, and buffer must be numbers in ${currencySymbol}. Do not use any other currency.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const textContent = message.content.find(item => item.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(textContent);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('DateNight error:', error);
    res.status(500).json({ error: error.message || 'Failed to plan date night' });
  }
});

module.exports = router;
