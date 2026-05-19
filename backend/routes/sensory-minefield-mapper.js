const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

function safeParseJSON(text) {
  let cleaned = cleanJsonResponse(text);
  cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
  try { return JSON.parse(cleaned); } catch {
    cleaned = cleaned.replace(/[\x00-\x1F\x7F]/g, ' ');
    try { return JSON.parse(cleaned); } catch {
      cleaned = cleaned.replace(/([{,]\s*)(\w+)\s*:/g, '$1"$2":');
      return JSON.parse(cleaned);
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// MAIN — preview a location before visiting
// ═══════════════════════════════════════════════════════════════

router.post('/sensory-minefield-mapper', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { location, visitDateTime, placeType, concerns, specificNotes, pastVisits, userLanguage } = req.body;

    if (!location?.trim()) return res.status(400).json({ error: 'Location is required' });
    if (!visitDateTime) return res.status(400).json({ error: 'Visit date and time are required' });
    if (!placeType) return res.status(400).json({ error: 'Place type is required' });
    if (!concerns?.length) return res.status(400).json({ error: 'Select at least one concern' });

    const pastBlock = pastVisits?.length
      ? `\nPAST VISITS TO THIS LOCATION:\n${pastVisits.slice(0, 3).map(v => `- ${v.date}: Rating ${v.rating}/5. Notes: ${v.notes}`).join('\n')}`
      : '';

    const prompt = `You are a location scout helping someone preview what a place will be like before they visit. Many people like to know what to expect — how busy it'll be, how loud, what the vibe is, where to find quiet spots, and what to do if it's more intense than expected. This is practical planning, not medical advice.

LOCATION: ${location}
VISIT TIME: ${visitDateTime}
PLACE TYPE: ${placeType}
WHAT THEY CARE ABOUT: ${concerns.join(', ')}
${specificNotes ? `SPECIFIC NOTES: ${specificNotes}` : ''}
${pastBlock}

Analyze this specific location and time combination. Be concrete and practical — predict actual conditions, not generic advice.

Return ONLY valid JSON:
{
  "location_summary": {
    "name": "Location name — 3-6 words",
    "visit_time": "When they plan to go — one sentence",
    "intensity_rating": "low / moderate / high / intense (number)",
    "intensity_explanation": "One sentence explaining the rating for this specific time",
    "vibe": "Brief 5-7 word vibe description"
  },
  "factors": [
    {
      "factor": "Noise / Crowds / Lighting / Smells / Visual Clutter / Temperature — one sentence",
      "prediction": "Specific prediction for this time (e.g., 'Moderate — background music + espresso machine, ~65dB') — one sentence",
      "concern_level": "low / medium / high — one sentence",
      "peak_zones": ["Areas where this factor is worst"],
      "avoid_times": ["Times when this factor spikes"],
      "tips": ["Practical tip 1", "Practical tip 2"]
    }
  ],
  "best_time": {
    "recommended": "Best day and time to visit (true/false)",
    "why": "Why this time is better — one sentence",
    "crowd_comparison": "How much less busy vs their chosen time — one sentence"
  },
  "layout_intel": {
    "quietest_spots": [
      { "area": "Area name — one sentence", "where": "How to find it — one sentence", "why_quiet": "Why it's calm — one sentence" }
    ],
    "exits": [
      { "name": "Exit name — 3-6 words", "location": "Where it is — one sentence", "note": "Any relevant detail — one sentence" }
    ],
    "restrooms": [
      { "location": "Where", "note": "Private/accessible/etc — one sentence" }
    ],
    "fresh_air": [
      { "spot": "Where to step outside — one sentence", "note": "Covered? Seating? — one sentence" }
    ]
  },
  "game_plan": {
    "before": ["Prep step 1", "Prep step 2", "Prep step 3"],
    "during": ["During tip 1", "During tip 2", "During tip 3"],
    "if_overwhelming": "One clear sentence: what to do if it's too much — one sentence",
    "time_limit": "Suggested max time to spend — one sentence"
  },
  "accommodation_scripts": [
    {
      "situation": "What you might need — one sentence",
      "script": "Exact words to say — 2-4 sentences",
      "likelihood": "high / medium / low — one sentence"
    }
  ],
  "check_in_prompts": [
    "Quick self-check question 1",
    "Quick self-check question 2",
    "Quick self-check question 3",
    "Quick self-check question 4"
  ],
  "backup_plan": "One clear sentence: if this doesn't work, here's plan B — one sentence"
}

Return ONLY valid JSON.`;

    let message;
    for (let _att = 1; _att <= 3; _att++) {
      try {
        message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: withLanguage(prompt, userLanguage) }],
    });
        break;
      } catch (_e) {
        if (_att === 3) throw _e;
        await new Promise(r => setTimeout(r, 1000 * _att));
      }
    }

    const raw = message.content.find(item => item.type === 'text')?.text || '';
    const parsed = safeParseJSON(raw);
    if (!parsed.location_summary && !parsed.risks) {
      return res.status(500).json({ error: 'Could not map sensory risks. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[SceneScout] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// ALTERNATIVES — suggest better times or similar places
// ═══════════════════════════════════════════════════════════════

router.post('/sensory-minefield-mapper/alternatives', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { location, placeType, visitDateTime, concerns, analysisContext, userLanguage } = req.body;

    if (!location?.trim()) return res.status(400).json({ error: 'Location is required' });

    const prompt = `Someone previewed a location and it looks too intense. Suggest alternatives — either different times for the same place, similar places nearby that might be calmer, or online/delivery options.

ORIGINAL PLAN: ${location} (${placeType}) at ${visitDateTime}
THEIR CONCERNS: ${concerns?.join(', ') || 'general comfort'}
INTENSITY RATING: ${analysisContext?.location_summary?.intensity_rating || 'unknown'}

Return ONLY valid JSON:
{
  "better_times": [
    {
      "when": "Specific day and time — one sentence",
      "why_better": "Why this time is calmer — one sentence",
      "estimated_intensity": "low / moderate — one sentence"
    }
  ],
  "alternative_places": [
    {
      "name": "Alternative location name — 3-6 words",
      "type": "What kind of place — one sentence",
      "why_better": "Why it might be less intense — one sentence",
      "trade_off": "What you give up by going here instead — one sentence"
    }
  ],
  "skip_it_options": [
    {
      "option": "Online/delivery/other alternative — one sentence",
      "how": "How to do it — one sentence",
      "note": "Any relevant detail — one sentence"
    }
  ],
  "bottom_line": "One practical recommendation sentence — one sentence"
}

Return ONLY valid JSON.`;

    let message;
    for (let _att = 1; _att <= 3; _att++) {
      try {
        message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [{ role: 'user', content: withLanguage(prompt, userLanguage) }],
    });
        break;
      } catch (_e) {
        if (_att === 3) throw _e;
        await new Promise(r => setTimeout(r, 1000 * _att));
      }
    }

    const raw = message.content.find(item => item.type === 'text')?.text || '';
    const parsed = safeParseJSON(raw);
    if (!parsed.location_summary && !parsed.risks) {
      return res.status(500).json({ error: 'Could not map sensory risks. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[SceneScout/alternatives] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// COMPANION SUMMARY — shareable brief for whoever you're with
// ═══════════════════════════════════════════════════════════════

router.post('/sensory-minefield-mapper/companion-summary', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { name, location, concerns, gamePlan, companionName, userLanguage } = req.body;

    if (!location?.trim()) return res.status(400).json({ error: 'Location is required' });

    const prompt = `Write a short, casual message someone can share with the person they're going to ${location} with. It should explain what they need in a way that's direct and comfortable — not clinical, not apologetic, just practical. Think "hey, heads up about what works for me."

${name ? `FROM: ${name}` : ''}
${companionName ? `TO: ${companionName}` : ''}
LOCATION: ${location}
THEIR CONCERNS: ${concerns?.join(', ') || 'crowds and noise'}
GAME PLAN CONTEXT: ${gamePlan ? JSON.stringify(gamePlan) : 'standard visit plan'}

Return ONLY valid JSON:
{
  "message_casual": "A casual text-style message (2-4 sentences, friendly tone)",
  "message_detailed": "A slightly longer version with specifics (3-5 sentences)",
  "key_asks": ["Specific thing they need from their companion", "Another ask"],
  "signal_system": {
    "description": "A simple signal system they can use during the visit — 1-2 sentences",
    "signals": [
      { "signal": "What to do/say — one sentence", "meaning": "What it means — one sentence" }
    ]
  }
}

Return ONLY valid JSON.`;

    let message;
    for (let _att = 1; _att <= 3; _att++) {
      try {
        message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      messages: [{ role: 'user', content: withLanguage(prompt, userLanguage) }],
    });
        break;
      } catch (_e) {
        if (_att === 3) throw _e;
        await new Promise(r => setTimeout(r, 1000 * _att));
      }
    }

    const raw = message.content.find(item => item.type === 'text')?.text || '';
    const parsed = safeParseJSON(raw);
    if (!parsed.location_summary && !parsed.risks) {
      return res.status(500).json({ error: 'Could not map sensory risks. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[SceneScout/companion] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// QUICK RESCAN — adjust strategy when already at the location
// ═══════════════════════════════════════════════════════════════

router.post('/sensory-minefield-mapper/rescan', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { location, placeType, originalPrediction, currentConditions, concerns, userLanguage } = req.body;

    if (!location?.trim()) return res.status(400).json({ error: 'Location is required' });
    if (!currentConditions?.trim()) return res.status(400).json({ error: 'Describe current conditions' });

    const prompt = `Someone is AT a location right now and conditions are different from what they expected. Give them a quick, calm adjusted strategy. No preamble — they need actionable advice fast.

LOCATION: ${location} (${placeType || 'unknown type'})
ORIGINAL PREDICTION: ${originalPrediction || 'moderate intensity'}
WHAT THEY'RE EXPERIENCING: ${currentConditions}
THEIR CONCERNS: ${concerns?.join(', ') || 'comfort'}

Return ONLY valid JSON:
{
  "quick_assessment": "One sentence: how this compares to what was expected",
  "adjusted_intensity": "low / moderate / high / intense — one sentence",
  "immediate_actions": ["Do this right now", "Then this", "And this"],
  "stay_or_go": "stay_with_adjustments / take_a_break / consider_leaving — one sentence",
  "if_staying": "Practical advice for making it work — one sentence",
  "nearest_relief": "Where to go for a quick reset (bathroom, outside, quiet corner) — one sentence",
  "revised_time_limit": "How long you should plan to stay given conditions — one sentence"
}

Return ONLY valid JSON.`;

    let message;
    for (let _att = 1; _att <= 3; _att++) {
      try {
        message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      messages: [{ role: 'user', content: withLanguage(prompt, userLanguage) }],
    });
        break;
      } catch (_e) {
        if (_att === 3) throw _e;
        await new Promise(r => setTimeout(r, 1000 * _att));
      }
    }

    const raw = message.content.find(item => item.type === 'text')?.text || '';
    const parsed = safeParseJSON(raw);
    if (!parsed.location_summary && !parsed.risks) {
      return res.status(500).json({ error: 'Could not map sensory risks. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[SceneScout/rescan] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// ROUTE — plan a multi-stop trip with cumulative energy modeling
// ═══════════════════════════════════════════════════════════════

router.post('/sensory-minefield-mapper/route', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { stops, concerns, specificNotes, userLanguage } = req.body;

    if (!stops?.length || stops.length < 2) return res.status(400).json({ error: 'Need at least 2 stops' });
    if (stops.length > 5) return res.status(400).json({ error: 'Max 5 stops per route' });

    const stopsBlock = stops.map((s, i) =>
      `${i + 1}. ${s.location} (${s.placeType})${s.time ? ` around ${s.time}` : ''}`
    ).join('\n');

    const prompt = `Someone has multiple stops to make today. Analyze the full route considering that energy is CUMULATIVE — a moderate stop after two other moderate stops feels intense. Your job: optimal order, where to put breaks, and when to call it.

STOPS:
${stopsBlock}

THEIR CONCERNS: ${concerns?.join(', ') || 'general comfort'}
${specificNotes ? `NOTES: ${specificNotes}` : ''}

Return ONLY valid JSON:
{
  "route_summary": {
    "total_stops": ${stops.length},
    "estimated_total_time": "Total hours including travel and breaks — one sentence",
    "overall_difficulty": "manageable / challenging / ambitious — one sentence",
    "recommendation": "One sentence summary"
  },
  "optimal_order": [
    {
      "order": 1,
      "location": "Stop name — one sentence",
      "place_type": "Type",
      "intensity": "low / moderate / high — one sentence",
      "cumulative_energy": "fresh / fine / draining / depleted — one sentence",
      "suggested_time": "When to go — one sentence",
      "time_limit": "Max time here — one sentence",
      "why_this_order": "Brief reason — one sentence",
      "key_tip": "One practical tip — one sentence"
    }
  ],
  "breaks": [
    {
      "after_stop": 1,
      "type": "quick_reset / proper_break / meal_break — one sentence",
      "duration": "5-10 min (number)",
      "suggestion": "What to do during break — one sentence"
    }
  ],
  "cut_point": {
    "after_stop": 2,
    "explanation": "If you're feeling drained after stop 2, skip the rest and do them another day — 1-2 sentences",
    "reschedule_suggestion": "Best time to do remaining stops — one sentence"
  },
  "comfort_items": ["Item to bring for this specific route"],
  "route_backup": "If the whole route feels too much: one sentence plan B"
}

Return ONLY valid JSON.`;

    let message;
    for (let _att = 1; _att <= 3; _att++) {
      try {
        message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{ role: 'user', content: withLanguage(prompt, userLanguage) }],
    });
        break;
      } catch (_e) {
        if (_att === 3) throw _e;
        await new Promise(r => setTimeout(r, 1000 * _att));
      }
    }

    const raw = message.content.find(item => item.type === 'text')?.text || '';
    const parsed = safeParseJSON(raw);
    if (!parsed.location_summary && !parsed.risks) {
      return res.status(500).json({ error: 'Could not map sensory risks. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[SceneScout/route] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// COMFORT KIT — dynamic packing checklist
// ═══════════════════════════════════════════════════════════════

router.post('/sensory-minefield-mapper/comfort-kit', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { concerns, placeType, visitTime, specificNotes, duration, userLanguage } = req.body;

    if (!concerns?.length) return res.status(400).json({ error: 'Concerns are required' });

    const prompt = `Generate a practical packing checklist for someone heading out. This should be specific to what they care about and where they're going — not a generic list.

GOING TO: ${placeType || 'general outing'}
TIME: ${visitTime || 'daytime'}
ESTIMATED DURATION: ${duration || 'unknown'}
THEIR CONCERNS: ${concerns.join(', ')}
${specificNotes ? `NOTES: ${specificNotes}` : ''}

Return ONLY valid JSON:
{
  "essentials": [
    { "item": "Item name — one sentence", "why": "Why for this specific trip — one sentence", "priority": "must_have / nice_to_have (number)" }
  ],
  "comfort_items": [
    { "item": "Item name — one sentence", "why": "Why it helps with their specific concerns — one sentence", "priority": "must_have / nice_to_have (number)" }
  ],
  "just_in_case": [
    { "item": "Item name — one sentence", "why": "When you might need it — one sentence" }
  ],
  "car_stash": [
    { "item": "Item to keep in the car — one sentence", "why": "For recovery after — one sentence" }
  ],
  "quick_note": "One practical packing tip for this type of outing — one sentence"
}

Return ONLY valid JSON.`;

    let message;
    for (let _att = 1; _att <= 3; _att++) {
      try {
        message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      messages: [{ role: 'user', content: withLanguage(prompt, userLanguage) }],
    });
        break;
      } catch (_e) {
        if (_att === 3) throw _e;
        await new Promise(r => setTimeout(r, 1000 * _att));
      }
    }

    const raw = message.content.find(item => item.type === 'text')?.text || '';
    const parsed = safeParseJSON(raw);
    if (!parsed.location_summary && !parsed.risks) {
      return res.status(500).json({ error: 'Could not map sensory risks. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[SceneScout/comfort-kit] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
