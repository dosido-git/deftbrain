const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

const SYSTEM_PROMPT = `You are Micro-Adventure Mapper, a local exploration expert who creates specific, actionable adventure plans. You know hidden gems, lesser-known spots, and interesting corners that most people walk past.

TONE: Enthusiastic but practical. You're a well-traveled friend who always knows a cool spot, not a tourism brochure. Specific over generic — real street names, real business names, real details.

RULES:
1. Every stop must be SPECIFIC — real places, real addresses when possible, real details. Never say "find a local cafe" — name the cafe.
2. Timing must be realistic. Walking pace is ~3 min per block / ~20 min per mile. Don't cram 5 stops into 2 hours.
3. Pro tips should be genuinely useful insider knowledge, not generic advice.
4. Budget estimates must be specific and honest. Don't say "$" — say "$8 for two tacos and a drink."
5. Photo opportunities should describe the specific shot composition, not just "take photos here."
6. The rainy day backup should be a REAL alternative in the same neighborhood, not a vague suggestion.
7. If companions include "family" or kids, every stop must be kid-appropriate and include engagement ideas.
8. If accessibility needs are specified, every stop and route must be accessible. No stairs or rough terrain.
9. The "extend it" suggestion should connect naturally to the main itinerary.
10. For "surprise" interests, choose something genuinely unexpected — not the city's most famous landmark.
11. Generate 2-4 stops depending on time available (1hr=2 stops, 2hrs=3, 3hrs+=4).

FORMAT: Respond in valid JSON matching the schema exactly. No markdown fences, no preamble. Pure JSON only.`;

function buildConstraintNotes(body) {
  const notes = [];
  if (body.timeAvailable) notes.push(`Time available: ${body.timeAvailable}`);
  if (body.when) {
    const whenMap = { right_now: 'Right now', later_today: `Later today (${body.timeOfDay || 'afternoon'})`, weekend: 'This weekend (flexible)' };
    notes.push(`When: ${whenMap[body.when] || body.when}`);
  }
  if (body.interests?.length) notes.push(`Interests: ${body.interests.join(', ')}`);
  if (body.vibe) notes.push(`Vibe: ${body.vibe}`);
  if (body.budget) {
    const budgetMap = { free: 'Free only', low: '$0-20', moderate: '$20-50', any: 'Any budget' };
    notes.push(`Budget: ${budgetMap[body.budget] || body.budget}`);
  }
  if (body.transport) notes.push(`Transportation: ${body.transport}`);
  if (body.companions) {
    const compMap = { solo: 'Solo', partner: 'With a partner/friend', family: 'Family with kids', group: 'Group' };
    notes.push(`Companions: ${compMap[body.companions] || body.companions}`);
  }
  if (body.accessibility?.length) notes.push(`Accessibility: ${body.accessibility.join(', ')}`);
  return notes.join('\n');
}

const RESPONSE_SCHEMA = `{
  "adventure": {
    "name": "Creative adventure name",
    "tagline": "One sentence hook",
    "category": "Primary category (e.g. Art & Food, Nature & Photography)",
    "total_time": "~2 hours",
    "total_cost": "Free – $15",
    "difficulty": "Easy|Moderate|Active",
    "why_adventure": "What makes this genuinely interesting (1-2 sentences)"
  },
  "stops": [
    {
      "number": 1,
      "name": "Specific place name",
      "location": "Address or cross-streets",
      "time_start": "2:00 PM",
      "time_end": "2:30 PM",
      "duration_min": 30,
      "description": "What to do here — specific and actionable (2-3 sentences)",
      "pro_tip": "Genuine insider tip for this spot",
      "photo_op": "Specific photo composition to capture here",
      "cost": "Free or specific amount"
    }
  ],
  "transit_between": [
    {
      "from_stop": 1,
      "to_stop": 2,
      "method": "Walk south on X St, turn right on Y Ave",
      "duration": "5 min",
      "distance": "0.3 mi"
    }
  ],
  "what_to_bring": ["Item 1", "Item 2", "Item 3"],
  "rainy_backup": {
    "description": "Complete alternative plan using indoor spots in the same area (2-3 sentences)",
    "stops": "Place A → Place B",
    "time": "1.5 hrs",
    "cost": "$5-15"
  },
  "extend_it": {
    "extra_time": "1-2 hrs",
    "suggestion": "How to naturally extend the adventure (2-3 sentences)"
  }
}`;

router.post('/micro-adventure-mapper', async (req, res) => {
  try {
    const { action } = req.body;

    // ─── GENERATE: New adventure ───
    if (action === 'generate') {
      const { location, previousAdventures } = req.body;
      if (!location || location.trim().length < 2) {
        return res.status(400).json({ error: 'Location is required' });
      }

      const constraints = buildConstraintNotes(req.body);

      let dedupBlock = '';
      if (previousAdventures && previousAdventures.length > 0) {
        const pastList = previousAdventures.map((a, i) =>
          `  ${i + 1}. "${a.name}" — stops: ${(a.stops || []).join(', ')}`
        ).join('\n');
        dedupBlock = `\nIMPORTANT — AVOID REPEATS: The user has already done these adventures in this area:\n${pastList}\nDo NOT reuse any of these adventure themes or specific stops. Find genuinely different places and angles.\n`;
      }

      const prompt = `Create a specific micro-adventure itinerary.

LOCATION: ${location}
${constraints}
${dedupBlock}
Return ONLY valid JSON matching this schema:
${RESPONSE_SCHEMA}`;

      const message = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 3000,
        system: withLanguage(SYSTEM_PROMPT, req.body.userLanguage),
        messages: [{ role: 'user', content: prompt }]
      });

      const responseText = message.content.filter(b => b.type === 'text').map(b => b.text).join('\n');
      const cleaned = cleanJsonResponse(responseText);

      try {
        const data = JSON.parse(cleaned);
        return res.json(data);
      } catch (e) {
        console.error('🗺️ MicroAdventureMapper: Parse error:', e.message);
        return res.status(500).json({ error: 'Failed to parse adventure response' });
      }
    }

    // ─── REGENERATE: Different adventure, same inputs ───
    if (action === 'regenerate') {
      const { location, previousAdventureName, previousAdventures } = req.body;
      if (!location) return res.status(400).json({ error: 'Location is required' });

      const constraints = buildConstraintNotes(req.body);

      let dedupBlock = '';
      if (previousAdventures && previousAdventures.length > 0) {
        const pastList = previousAdventures.map((a, i) =>
          `  ${i + 1}. "${a.name}" — stops: ${(a.stops || []).join(', ')}`
        ).join('\n');
        dedupBlock = `\nThe user has already done ALL of these adventures in this area:\n${pastList}\nDo NOT reuse ANY of these adventure themes, names, or specific stops. Find completely fresh places and a new angle.\n`;
      }

      const prompt = `Create a COMPLETELY DIFFERENT micro-adventure itinerary for the same location.

LOCATION: ${location}
${constraints}

IMPORTANT: The previous adventure was "${previousAdventureName || 'unknown'}". Generate something with a DIFFERENT theme, different stops, different vibe. Don't repeat any of the same places.
${dedupBlock}
Return ONLY valid JSON matching this schema:
${RESPONSE_SCHEMA}`;

      const message = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 3000,
        system: withLanguage(SYSTEM_PROMPT, req.body.userLanguage),
        messages: [{ role: 'user', content: prompt }]
      });

      const responseText = message.content.filter(b => b.type === 'text').map(b => b.text).join('\n');
      const cleaned = cleanJsonResponse(responseText);

      try {
        const data = JSON.parse(cleaned);
        return res.json(data);
      } catch (e) {
        console.error('🗺️ MicroAdventureMapper: Regenerate parse error:', e.message);
        return res.status(500).json({ error: 'Failed to parse regenerated adventure' });
      }
    }

    // ─── SWAP: Replace one stop ───
    if (action === 'swap') {
      const { location, currentItinerary, swapStopNumber } = req.body;
      if (!currentItinerary || !swapStopNumber) {
        return res.status(400).json({ error: 'Current itinerary and stop number required' });
      }

      const constraints = buildConstraintNotes(req.body);
      const currentStop = (currentItinerary.stops || []).find(s => s.number === swapStopNumber);
      const otherStops = (currentItinerary.stops || []).filter(s => s.number !== swapStopNumber).map(s => s.name);

      const prompt = `Replace ONE stop in an existing itinerary with a different alternative.

LOCATION: ${location || 'same area'}
${constraints}

EXISTING ITINERARY THEME: "${currentItinerary.adventure?.name || 'Local adventure'}"
OTHER STOPS (keep these): ${otherStops.join(', ')}
STOP TO REPLACE: Stop #${swapStopNumber} — "${currentStop?.name || 'unknown'}" at "${currentStop?.location || 'unknown'}"
TIME SLOT: ${currentStop?.time_start || ''} – ${currentStop?.time_end || ''} (${currentStop?.duration_min || 30} min)

Generate a DIFFERENT stop that:
1. Fits the same time slot and duration
2. Is in the same general area (reachable from adjacent stops)
3. Matches the overall adventure theme
4. Is NOT any of the other stops already in the itinerary

Return ONLY valid JSON with the replacement stop and updated transit:
{
  "stops": [
    {
      "number": ${swapStopNumber},
      "name": "New place name",
      "location": "Address",
      "time_start": "${currentStop?.time_start || ''}",
      "time_end": "${currentStop?.time_end || ''}",
      "duration_min": ${currentStop?.duration_min || 30},
      "description": "What to do here",
      "pro_tip": "Insider tip",
      "photo_op": "Photo opportunity",
      "cost": "Cost"
    }
  ],
  "transit_between": [
    {
      "from_stop": ${swapStopNumber > 1 ? swapStopNumber - 1 : swapStopNumber},
      "to_stop": ${swapStopNumber},
      "method": "Directions to new stop",
      "duration": "X min",
      "distance": "X mi"
    }
  ]
}`;

      const message = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        system: withLanguage(SYSTEM_PROMPT, req.body.userLanguage),
        messages: [{ role: 'user', content: prompt }]
      });

      const responseText = message.content.filter(b => b.type === 'text').map(b => b.text).join('\n');
      const cleaned = cleanJsonResponse(responseText);

      try {
        const data = JSON.parse(cleaned);
        return res.json(data);
      } catch (e) {
        console.error('🗺️ MicroAdventureMapper: Swap parse error:', e.message);
        return res.status(500).json({ error: 'Failed to parse swapped stop' });
      }
    }

    return res.status(400).json({ error: 'Invalid action. Use: generate, regenerate, or swap' });

  } catch (error) {
    console.error('❌ MicroAdventureMapper error:', error.message);
    res.status(500).json({ error: error.message || 'Failed to process request' });
  }
});

module.exports = router;
