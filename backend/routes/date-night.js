const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage } = require('../lib/claude');

// ═══════════════════════════════════════════
// SYSTEM PROMPT
// ═══════════════════════════════════════════

const SYSTEM_PROMPT = `You are a date night planning expert who creates evening plans for people ANYWHERE in the world. You understand local culture, dining customs, pricing, and social norms for each location.

PHILOSOPHY:
- A great date isn't about spending money. It's about intentionality.
- Budget is a HARD constraint in the specified currency. Total must stay UNDER budget with a buffer.
- Every stop should flow into the next. Don't suggest a loud bar followed by a quiet museum.
- Suggest venue TYPES and styles that are REALISTIC and culturally appropriate. Use phrases like "a cozy ramen shop" rather than inventing specific business names.
- For first dates: always include a natural exit point. Suggest venues where conversation is easy.
- For stay-in dates: budget goes toward delivery food, ingredients, streaming, games, or supplies.

CULTURAL AWARENESS:
- Adapt venue types to local culture. An izakaya in Tokyo, a tapas bar in Madrid, a hawker centre in Singapore.
- Be aware of local dating norms. Adapt without assumptions.
- Use locally appropriate transportation.
- Respect local dining customs (tipping, shared plates, course structure).
- Be realistic about local price levels.

FORMAT: Respond in valid JSON matching the schema exactly. No markdown fences, no preamble. Pure JSON only.`;

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

function getSeasonContext() {
  const month = new Date().getMonth();
  const seasons = [
    [11, 0, 1, 'winter', 'Cold weather. Favor cozy indoor venues, warm drinks, heated patios.'],
    [2, 3, 4, 'spring', 'Pleasant weather. Outdoor terraces and evening strolls work well.'],
    [5, 6, 7, 'summer', 'Warm evenings. Rooftop bars, outdoor dining, waterfront walks.'],
    [8, 9, 10, 'fall', 'Cool evenings. Cozy restaurants, wine bars, and scenic walks.']
  ];
  for (const [m1, m2, m3, name, advice] of seasons) {
    if (month === m1 || month === m2 || month === m3) return { season: name, advice };
  }
  return { season: 'unknown', advice: '' };
}

function buildDietaryBlock(dietary) {
  if (!dietary?.length) return '';
  const map = {
    vegetarian: 'Vegetarian — no meat/fish. ALL food stops must have substantial vegetarian options.',
    vegan: 'Vegan — no animal products. Every food stop must have clear vegan options.',
    'gluten-free': 'Gluten-free — avoid wheat/gluten. Note safe dishes.',
    halal: 'Halal dietary requirements. Only halal-certified or halal-friendly venues.',
    kosher: 'Kosher dietary requirements. Only kosher or kosher-style venues.',
    'no-alcohol': 'No alcohol. Do NOT suggest bars or cocktail-focused venues. Suggest cafés, tea houses, dessert spots instead.',
    'dairy-free': 'Dairy-free. Note dairy-free options.',
    'nut-allergy': 'Nut allergy. Avoid nut-heavy cuisine. Note safe options.',
  };
  return '\nDIETARY/RESTRICTIONS (HARD CONSTRAINTS):\n' + dietary.map(d => `- ${map[d] || d}`).join('\n') + '\nNon-negotiable.\n';
}

function buildPreferenceBlock(preferences) {
  if (!preferences?.liked?.length && !preferences?.disliked?.length) return '';
  let block = '\nLEARNED PREFERENCES:\n';
  if (preferences.liked?.length) block += `ENJOYS: ${preferences.liked.join(', ')}\n`;
  if (preferences.disliked?.length) block += `DISLIKES: ${preferences.disliked.join(', ')}\n`;
  return block;
}

function buildPartnerBlock(partnerPrefs) {
  if (!partnerPrefs) return '';
  const parts = [];
  if (partnerPrefs.partnerLikes) parts.push(`Partner enjoys: ${partnerPrefs.partnerLikes}`);
  if (partnerPrefs.partnerDislikes) parts.push(`Partner dislikes: ${partnerPrefs.partnerDislikes}`);
  if (partnerPrefs.noiseLevel) parts.push(`Noise preference: ${partnerPrefs.noiseLevel}`);
  if (partnerPrefs.energyLevel) parts.push(`Energy preference: ${partnerPrefs.energyLevel}`);
  if (!parts.length) return '';
  return '\nPARTNER PREFERENCES:\n' + parts.join('\n') + '\nPlan stops that work for BOTH people.\n';
}

function buildDedupBlock(pastDates) {
  if (!pastDates?.length) return '';
  const list = pastDates.slice(0, 10).map((d, i) =>
    `  ${i + 1}. "${d.title}" — stops: ${(d.stops || []).join(', ')}`
  ).join('\n');
  return `\nAVOID REPEATS:\n${list}\nDo NOT reuse the same venue types or themes.\n`;
}

function buildFavoritesBlock(favorites) {
  if (!favorites?.length) return '';
  const list = favorites.slice(0, 8).map(f => `"${f.venue_name}" (${f.stop_type || '?'})`).join(', ');
  return `\nCOUPLE'S FAVORITE VENUES: ${list}\nYou may INCLUDE 1-2 of these if they fit, mixed with new discoveries.\n`;
}

const DATE_TYPE_LABELS = {
  casual: 'Casual — low-key, comfortable, no pressure',
  romantic: 'Romantic — intimate, special, memorable',
  adventurous: 'Adventurous — try something new, unexpected',
  first_date: 'First Date — impressive but not try-hard, easy exit points',
  anniversary: 'Anniversary — celebrate the relationship',
  stay_in: 'Stay-In — cozy night at home',
};

const RESPONSE_SCHEMA = `{
  "vibe_title": "Creative, location-specific name for this evening",
  "vibe_description": "One sentence setting the mood",
  "itinerary": [
    {
      "time": "7:00 PM",
      "venue_name": "Descriptive venue type",
      "stop_type": "drinks|dinner|dessert|walk|entertainment|activity|coffee|tea",
      "description": "What you'll do here (2-3 sentences)",
      "estimated_cost": 25,
      "pro_tip": "Insider tip",
      "dress_vibe": "Smart casual|Come as you are|Dress up a bit|Cozy layers",
      "plan_b": "Specific alternative if this stop has a wait or is closed",
      "stop_number": 1
    }
  ],
  "total_estimated": 65,
  "buffer": 10,
  "transportation": "How to get between stops with costs",
  "conversation_starters": ["3-5 prompts tailored to date type"],
  "overall_dress_code": "One sentence — what to wear",
  "plan_b": "General backup plan",
  "tips": ["2-3 tips to elevate this evening"]
}`;

// ═══════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════

router.post('/date-night', async (req, res) => {
  try {
    const { action = 'generate' } = req.body;
    const { season, advice: seasonAdvice } = getSeasonContext();

    // ─── GENERATE ───
    if (action === 'generate') {
      const { budget, currency = '$', dateType, location, restrictions, lastTime, startTime,
              dietary, duration, weather, pastDates, preferences, partnerPrefs,
              favorites, plannedDate, isFuturePlan, userLanguage } = req.body;

      if (!location?.trim()) return res.status(400).json({ error: 'Please enter a city or neighborhood.' });
      if (!dateType) return res.status(400).json({ error: 'Please select a date type.' });

      const sym = currency;
      const durationMap = { quick: 'Quick — 2 stops, done by ~9:30 PM', standard: 'Standard — 2-3 stops, done by ~11 PM', long: 'Long — 3-4 stops, past midnight' };
      const futureDateStr = plannedDate ? new Date(plannedDate + 'T12:00:00').toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' }) : null;

      const prompt = `PLAN A DATE NIGHT:
- Budget: ${sym}${budget} (hard cap — plan ~${sym}${Math.round((budget || 100) * 0.85)})
- Currency: ${sym} only
- Type: ${DATE_TYPE_LABELS[dateType] || dateType}
- Location: ${location.trim()}
- Start: ${startTime || '7:00 PM'}
- Duration: ${durationMap[duration] || durationMap.standard}
- Season: ${season} — ${seasonAdvice}
${isFuturePlan && futureDateStr ? `- FUTURE DATE: Planning for ${futureDateStr}. Include advance_booking tips (which stops need reservations, how far in advance). Frame recommendations for planning ahead, not tonight.` : ''}
${weather ? `- Weather: ${weather}` : ''}
${restrictions ? `- Restrictions: ${restrictions}` : ''}
${lastTime ? `- Last time (avoid): ${lastTime}` : ''}
${buildDietaryBlock(dietary)}${buildPreferenceBlock(preferences)}${buildPartnerBlock(partnerPrefs)}${buildDedupBlock(pastDates)}${buildFavoritesBlock(favorites)}

Return ONLY valid JSON:
${RESPONSE_SCHEMA}
${isFuturePlan ? '\nAlso include: "advance_booking": ["Tip 1 about reservations/booking", "Tip 2", "Tip 3"] — specific actions to take now for the planned date.' : ''}

All costs in ${sym}. dress_vibe per stop + overall_dress_code. plan_b per stop AND overall.`;

      const parsed = await callClaudeWithRetry(prompt, {
        model: 'claude-haiku-4-5-20251001',

        label: 'DateNightGenerate', max_tokens: 3000,
        system: withLanguage(`${SYSTEM_PROMPT}\n\nAll costs in ${sym}.`, userLanguage)
      });
      return res.json(parsed);
    }

    // ─── REGENERATE ───
    if (action === 'regenerate') {
      const { budget, currency = '$', dateType, location, restrictions, lastTime, startTime,
              dietary, duration, weather, previousTitle, pastDates, preferences,
              partnerPrefs, favorites, userLanguage } = req.body;

      if (!location?.trim()) return res.status(400).json({ error: 'Location required.' });
      const sym = currency;
      const durationMap = { quick: '~2 hours', standard: '~3-4 hours', long: '~5+ hours' };

      const prompt = `Create a COMPLETELY DIFFERENT date night. Previous: "${previousTitle || 'unknown'}". Different theme, venues, vibe.

- Budget: ${sym}${budget}, Currency: ${sym}, Type: ${DATE_TYPE_LABELS[dateType] || dateType}
- Location: ${location.trim()}, Start: ${startTime || '7:00 PM'}, Duration: ${durationMap[duration] || '~3-4 hours'}
- Season: ${season} — ${seasonAdvice}
${weather ? `- Weather: ${weather}` : ''}${restrictions ? `\n- Restrictions: ${restrictions}` : ''}
${buildDietaryBlock(dietary)}${buildPreferenceBlock(preferences)}${buildPartnerBlock(partnerPrefs)}${buildDedupBlock(pastDates)}${buildFavoritesBlock(favorites)}

Return ONLY valid JSON: ${RESPONSE_SCHEMA}`;

      const parsed = await callClaudeWithRetry(prompt, {
        model: 'claude-haiku-4-5-20251001',

        label: 'DateNightRegenerate', max_tokens: 3000,
        system: withLanguage(`${SYSTEM_PROMPT}\n\nAll costs in ${sym}.`, userLanguage)
      });
      return res.json(parsed);
    }

    // ─── SWAP ───
    if (action === 'swap') {
      const { budget, currency = '$', dateType, location, dietary, currentItinerary,
              swapStopNumber, preferences, partnerPrefs, userLanguage } = req.body;

      if (!currentItinerary || !swapStopNumber) return res.status(400).json({ error: 'Itinerary and stop number required.' });
      const sym = currency;
      const currentStop = (currentItinerary.itinerary || []).find(s => s.stop_number === swapStopNumber);
      const otherStops = (currentItinerary.itinerary || []).filter(s => s.stop_number !== swapStopNumber).map(s => s.venue_name);

      const prompt = `Replace ONE stop. Evening: "${currentItinerary.vibe_title}" in ${location}
Type: ${DATE_TYPE_LABELS[dateType] || dateType}
KEEP: ${otherStops.join(', ')}
REPLACE: #${swapStopNumber} "${currentStop?.venue_name}" at ${currentStop?.time} (~${sym}${currentStop?.estimated_cost})
${buildDietaryBlock(dietary)}${buildPreferenceBlock(preferences)}${buildPartnerBlock(partnerPrefs)}

Return ONLY valid JSON:
{
  "stop": {
    "time": "${currentStop?.time || '8:00 PM'}", "venue_name": "New venue",
    "stop_type": "type", "description": "What to do (2-3 sentences)",
    "estimated_cost": ${currentStop?.estimated_cost || 25}, "pro_tip": "Tip",
    "dress_vibe": "Dress code", "plan_b": "Alternative", "stop_number": ${swapStopNumber}
  }
}`;

      const parsed = await callClaudeWithRetry(prompt, {
        model: 'claude-haiku-4-5-20251001',

        label: 'DateNightSwap', max_tokens: 1000,
        system: withLanguage(`${SYSTEM_PROMPT}\n\nAll costs in ${sym}.`, userLanguage)
      });
      return res.json(parsed);
    }

    // ─── RATE ───
    if (action === 'rate') {
      const { vibeTitle, location, dateType, overallRating, stopRatings, notes,
              actualSpend, userLanguage } = req.body;
      if (!overallRating) return res.status(400).json({ error: 'Please rate your date.' });

      const spendNote = actualSpend ? `\nACTUAL SPEND: ${actualSpend} (compare to estimates for accuracy insight)` : '';

      const prompt = withLanguage(`Analyze date feedback.

DATE: "${vibeTitle}" in ${location || 'unknown'} | Type: ${dateType || '?'} | OVERALL: ${overallRating}/5
STOPS:
${(stopRatings || []).map(s => `  - "${s.venue_name}" (${s.stop_type || '?'}): ${s.rating}${s.note ? ` — "${s.note}"` : ''}`).join('\n')}
${notes ? `NOTES: "${notes}"` : ''}${spendNote}

Return ONLY valid JSON:
{
  "summary": "One sentence insight",
  "liked_types": ["types they enjoy"],
  "disliked_types": ["types they skip"],
  "liked_qualities": ["qualities they enjoy"],
  "pace_preference": "quick|standard|long",
  "next_suggestion": "Specific idea for next date",
  "encouragement": "Warm one-sentence note"${actualSpend ? ',\n  "budget_accuracy": "How accurate were the estimates vs actual spend (1 sentence)"' : ''}
}`, userLanguage);

      const parsed = await callClaudeWithRetry(prompt, {
        model: 'claude-haiku-4-5-20251001',

        label: 'DateNightRate', max_tokens: 800,
        system: withLanguage('Date feedback analyst. Warm, encouraging. Return ONLY valid JSON.', userLanguage)
      });
      return res.json(parsed);
    }

    // ─── SHARE ───
    if (action === 'share') {
      const { vibeTitle, dateType, location, itinerary, startTime, budget, currency,
              surprise, userLanguage } = req.body;
      if (!vibeTitle) return res.status(400).json({ error: 'Need date details.' });

      const sym = currency || '$';
      const stopsList = (itinerary || []).map(s => `${s.time} — ${s.venue_name}`).join(', ');
      const dressCode = itinerary?.[0]?.dress_vibe || 'smart casual';

      if (surprise) {
        // SURPRISE MODE — mystery invite with no venue details
        const prompt = withLanguage(`Write a MYSTERY date invite. The sender is planning a surprise — the recipient should NOT know where they're going.

DATE TYPE: ${dateType || 'romantic'}
START TIME: ${startTime || '7:00 PM'}
DRESS CODE: ${dressCode}
LOCATION AREA: ${location} (DON'T reveal specific venues)

RULES:
- 4-5 lines max. Text message format.
- Build excitement and mystery — "I've got something planned..."
- Include ONLY: when to be ready, what to wear, and a hint about the vibe
- Do NOT mention any venue names or specific activities
- Match tone to date type (first date = confident, anniversary = warm, etc.)
- End with something that builds anticipation

Return ONLY valid JSON:
{
  "message": "The mystery invite text",
  "what_to_tell_them": "Dress: ${dressCode}. Be ready by ${startTime || '7:00 PM'}.",
  "tone": "The tone used"
}`, userLanguage);

        const parsed = await callClaudeWithRetry(prompt, {
          model: 'claude-haiku-4-5-20251001',

          label: 'DateNightSurprise', max_tokens: 500,
          system: withLanguage('Charming friend who creates excitement about mystery dates. Return ONLY valid JSON.', userLanguage)
        });
        return res.json({ ...parsed, isSurprise: true });
      }

      // Regular share
      const prompt = withLanguage(`Write a SHORT flirty text inviting your partner.

DATE: "${vibeTitle}" in ${location} | Type: ${dateType || '?'}
PLAN: ${stopsList} | START: ${startTime || '7:00 PM'} | BUDGET: ${sym}${budget || '?'}

4-5 lines max. Match tone to date type. Keep some mystery. End invitingly.

Return ONLY valid JSON:
{ "message": "The text", "tone": "Tone used" }`, userLanguage);

      const parsed = await callClaudeWithRetry(prompt, {
        model: 'claude-haiku-4-5-20251001',

        label: 'DateNightShare', max_tokens: 500,
        system: withLanguage('Charming invite writer. Match tone to date type. Return ONLY valid JSON.', userLanguage)
      });
      return res.json(parsed);
    }

    // ─── SIMILAR ───
    if (action === 'similar') {
      const { venueName, stopType, location, dateType, budget, currency, userLanguage } = req.body;
      if (!venueName) return res.status(400).json({ error: 'Which venue?' });
      const sym = currency || '$';

      const prompt = withLanguage(`Couple LOVED "${venueName}" (${stopType || '?'}) for a ${dateType || ''} date in ${location || '?'}.
Find 3 similar venue types — same energy, different places. Budget: ~${sym}${Math.round((budget || 100) * 0.3)}/stop.

Return ONLY valid JSON:
{
  "original": "${venueName}",
  "what_worked": "One sentence about what makes this great for dates",
  "similar": [
    { "venue_name": "Type", "stop_type": "${stopType || '?'}", "why_similar": "Why (1 sentence)", "estimated_cost": 25, "pro_tip": "Date tip" }
  ]
}`, userLanguage);

      const parsed = await callClaudeWithRetry(prompt, {
        model: 'claude-haiku-4-5-20251001',

        label: 'DateNightSimilar', max_tokens: 1000,
        system: withLanguage(`${SYSTEM_PROMPT}\n\nAll costs in ${sym}.`, userLanguage)
      });
      return res.json(parsed);
    }

    // ─── ANNIVERSARY DEEP ───
    if (action === 'anniversary-deep') {
      const { location, budget, currency, yearsTogether, startTime, dietary,
              preferences, partnerPrefs, userLanguage } = req.body;
      if (!yearsTogether) return res.status(400).json({ error: 'How many years?' });
      const sym = currency || '$';

      const prompt = withLanguage(`Plan a special ${yearsTogether}-year anniversary date.

LOCATION: ${location || '?'} | BUDGET: ${sym}${budget || 100} | START: ${startTime || '7:00 PM'}
SEASON: ${season} — ${seasonAdvice}
${buildDietaryBlock(dietary)}${buildPreferenceBlock(preferences)}${buildPartnerBlock(partnerPrefs)}

Create a narrative arc — thoughtful opening → signature memory moment → intimate closing.

Return ONLY valid JSON:
{
  "vibe_title": "Evocative name", "vibe_description": "Mood sentence",
  "narrative_arc": "Emotional journey (2 sentences)",
  "itinerary": [
    { "time": "7:00 PM", "venue_name": "Venue type", "stop_type": "type",
      "description": "What to do (2-3 sentences)", "estimated_cost": 30,
      "pro_tip": "Tip", "dress_vibe": "Dress code",
      "anniversary_touch": "Something specific for an anniversary at this stop",
      "stop_number": 1 }
  ],
  "total_estimated": 80, "buffer": 15,
  "transportation": "Getting between stops",
  "nostalgia_prompts": ["3-4 reflection questions for ${yearsTogether} years"],
  "milestone_gesture": "Meaningful gesture for ${yearsTogether} years",
  "overall_dress_code": "What to wear",
  "tips": ["2-3 anniversary-specific tips"]
}`, userLanguage);

      const parsed = await callClaudeWithRetry(prompt, {
        model: 'claude-haiku-4-5-20251001',

        label: 'DateNightAnniversary', max_tokens: 3500,
        system: withLanguage(`${SYSTEM_PROMPT}\n\nAll costs in ${sym}. Special anniversary — bring warmth.`, userLanguage)
      });
      return res.json(parsed);
    }

    // ─── DATE JAR (generate 10-12 date concepts) ───
    if (action === 'date-jar') {
      const { location, budget, currency = '$', dietary, preferences, partnerPrefs,
              pastDates, userLanguage } = req.body;
      if (!location?.trim()) return res.status(400).json({ error: 'Location required.' });
      const sym = currency;

      const prompt = withLanguage(`Generate 10-12 diverse date night CONCEPTS for this couple. Not full itineraries — just ideas with enough detail to get excited about.

LOCATION: ${location.trim()} | BUDGET RANGE: ${sym}${Math.round((budget || 100) * 0.5)}-${sym}${budget || 100}
SEASON: ${season} — ${seasonAdvice}
${buildDietaryBlock(dietary)}${buildPreferenceBlock(preferences)}${buildPartnerBlock(partnerPrefs)}${buildDedupBlock(pastDates)}

RULES:
- MIX of types: at least 2 active/adventurous, 2 romantic/intimate, 2 casual/low-key, 2 unique/unexpected, 2 budget-friendly
- Each concept: catchy name, 1-2 sentence description, estimated budget, date type tag
- Include at least 1 stay-in option and 1 free/nearly-free option
- Culturally appropriate for ${location.trim()}
- AVOID anything similar to past dates listed above

Return ONLY valid JSON:
{
  "location": "${location.trim()}",
  "concepts": [
    {
      "id": 1, "name": "Catchy concept name", "description": "1-2 exciting sentences",
      "type": "casual|romantic|adventurous|first_date|stay_in",
      "estimated_budget": "${sym}30-50", "vibe": "One word energy — 'cozy'|'electric'|'chill'|'adventurous'",
      "best_for": "When to do this — 'rainy evening'|'summer night'|'any time'"
    }
  ]
}`, userLanguage);

      const parsed = await callClaudeWithRetry(prompt, {
        model: 'claude-haiku-4-5-20251001',

        label: 'DateNightJar', max_tokens: 3000,
        system: withLanguage(`${SYSTEM_PROMPT}\n\nAll budgets in ${sym}. Be creative — surprise them.`, userLanguage)
      });
      return res.json(parsed);
    }

    // ─── RUT DETECT (analyze patterns, suggest variety) ───
    if (action === 'rut-detect') {
      const { pastDates, location, preferences, userLanguage } = req.body;
      if (!pastDates?.length || pastDates.length < 3) return res.status(400).json({ error: 'Need at least 3 past dates to detect patterns.' });

      const dateList = pastDates.slice(0, 15).map((d, i) =>
        `  ${i + 1}. "${d.title}" (${d.dateType || '?'}) — stops: ${(d.stops || []).join(', ')} — rated: ${d.rating || '?'}/5`
      ).join('\n');

      const prompt = withLanguage(`Analyze this couple's date history for patterns and suggest how to break out of ruts.

PAST DATES (most recent first):
${dateList}
LOCATION: ${location || 'unknown'}

Look for:
- Repeating venue types (always restaurants? always bars?)
- Repeating date types (always casual? never adventurous?)
- Missing categories (never done active? never done stay-in?)
- Budget patterns (always cheap? always splurging?)
- What they rate highest vs lowest

Return ONLY valid JSON:
{
  "pattern_summary": "2-3 sentences about their dating patterns",
  "rut_detected": true/false,
  "rut_description": "If rut detected: what the rut is (1 sentence). Null if no rut.",
  "top_categories": ["Their most frequent stop types"],
  "missing_categories": ["Stop types they've never tried"],
  "suggestions": [
    { "idea": "Specific suggestion to break the pattern", "why": "Why this would be refreshing (1 sentence)" }
  ],
  "encouragement": "Warm note about their dating life"
}`, userLanguage);

      const parsed = await callClaudeWithRetry(prompt, {
        model: 'claude-haiku-4-5-20251001',

        label: 'DateNightRutDetect', max_tokens: 1000,
        system: withLanguage('Relationship pattern analyst. Encouraging, not judgmental. Return ONLY valid JSON.', userLanguage)
      });
      return res.json(parsed);
    }

    // ─── CHECKLIST (pre-date preparation) ───
    if (action === 'checklist') {
      const { dateType, startTime, weather, dietary, hasReservation, userLanguage } = req.body;
      if (!dateType) return res.status(400).json({ error: 'Date type needed.' });

      const prompt = withLanguage(`Generate a pre-date checklist for a ${DATE_TYPE_LABELS[dateType] || dateType} date.

START TIME: ${startTime || '7:00 PM'}
WEATHER: ${weather || 'unknown'}
${dietary?.length ? `DIETARY: ${dietary.join(', ')}` : ''}
${hasReservation ? 'Has a reservation' : 'No reservation yet'}

RULES:
- 8-12 items, in chronological order (earliest prep first)
- Include timing hints ("2 hours before", "30 min before")
- Mix practical (charge phone, cash) with thoughtful (playlist, small gift)
- Adapt to date type:
  * First date: confidence boosters, backup topics, breath mints, easy exit plan
  * Romantic: ambiance items, thoughtful touch, playlist
  * Anniversary: gift, photos from past, meaningful gesture
  * Stay-in: ingredients, candles, streaming queue, phone away
  * Adventurous: comfortable shoes, charged phone, sense of humor
  * Casual: keep it low-key, don't overthink

Return ONLY valid JSON:
{
  "checklist": [
    { "item": "What to do", "timing": "When to do it", "category": "practical|thoughtful|appearance|logistics", "priority": "must|nice" }
  ],
  "last_minute_reminder": "One thing to remember walking out the door"
}`, userLanguage);

      const parsed = await callClaudeWithRetry(prompt, {
        model: 'claude-haiku-4-5-20251001',

        label: 'DateNightChecklist', max_tokens: 1000,
        system: withLanguage('Pre-date preparation expert. Practical + thoughtful. Return ONLY valid JSON.', userLanguage)
      });
      return res.json(parsed);
    }

    return res.status(400).json({ error: 'Invalid action. Use: generate, regenerate, swap, rate, share, similar, anniversary-deep, date-jar, rut-detect, checklist' });
  } catch (error) {
    console.error('[DateNight]', error.message);
    res.status(500).json({ error: error.message || 'Failed to plan date night.' });
  }
});

module.exports = router;
