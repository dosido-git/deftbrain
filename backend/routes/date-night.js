const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');
const { TOOL_CATALOG, isRealTool } = require('../lib/toolCatalog');
const { venueBlockFor, verifiedNamesFrom, markVerified, attachPlaceFacts } = require('../lib/venues');
const { groundedData, normalizeKeyPart } = require('../lib/groundedFacts');

// ═══════════════════════════════════════════
// SYSTEM PROMPT
// ═══════════════════════════════════════════

const NO_QUOTE_RULE = 'Never place a double-quote (") character inside any JSON string value — write venue names, invite text, or any quoted phrases plainly or with single quotes, or it breaks the JSON.';

const SYSTEM_PROMPT = `You are a date night planning expert who creates evening plans for people ANYWHERE in the world. You understand local culture, dining customs, pricing, and social norms for each location. Keep every field concise — one short sentence; outputs render in compact cards, so long text overflows the layout and the response budget.

LOCAL SHORTHAND: write neighbourhood and district names out in full, with the local abbreviation after it in brackets if it is worth knowing — "the River North Art District (RiNo)", never just "RiNo". The reader may be visiting, may have moved last week, or may be planning this from another country; an abbreviation only locals know tells them nothing about where they are going.

${NO_QUOTE_RULE}`;

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
    'no-alcohol': 'No alcohol. Do NOT suggest bars or cocktail-focused venues. Suggest cafés, tea houses, dessert spots instead. Never mention wine lists, wine pairings, or any alcoholic drink at ANY stop — not even as optional.',
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

const durationMapFor = (d) => ({ quick: '~2 hours', standard: '~3-4 hours', long: '~5+ hours' }[d] || '~3-4 hours');

const RESPONSE_SCHEMA = `{
  "vibe_title": "Creative, location-specific name for this evening",
  "vibe_description": "One sentence setting the mood",
  "itinerary": [
    {
      "time": "7:00 PM",
      "venue_name": __VENUE_NAME__,
      "stop_type": "drinks|dinner|dessert|walk|entertainment|activity|coffee|tea",
      "description": "What you'll do here (2-3 sentences)",
      "estimated_cost": 25,
      "pro_tip": "Insider tip",
      "dress_vibe": "Smart casual|Come as you are|Dress up a bit|Cozy layers",
      "plan_b": __PLAN_B__,
      "for_the_two_of_you": "One thing to DO or SAY together at this stop — a toast, a question, an exchange. Specific to this venue and to their occasion, never generic. One sentence.",
      "stop_number": 1
    }
  ],
  "total_estimated": 65,
  "buffer": 10,
  "one_thing_now": "The single action to take BEFORE the date, in 2-4 words (e.g. 'Reserve dinner', 'Check the forecast', 'Buy tickets'). The one thing that breaks the evening if skipped.",
  "transportation": "How you get around, as a SHORT phrase of 2 to 5 words — 'Mostly walkable', 'Rideshare, about $10 total', 'One short bus ride'. This renders in a narrow column beside four other facts; a sentence breaks the layout.",
  "conversation_starters": ["3-5 prompts tailored to date type"],
  "overall_dress_code": "What to wear, as a SHORT phrase of 3 to 6 words — 'Light, polished, summer-ready'. Same narrow column; never a sentence.",
  "plan_b": __PLAN_B_OVERALL__,
  "tips": ["2-3 tips to elevate this evening"]
}`;

// The venue_name rule is the one part of the schema that depends on whether we
// managed to verify anything for this location, so it is substituted per call
// rather than baked in. Everything else about the shape is identical.
// plan_b names places too. Pinning venue_name to the verified list while
// leaving the backup as free prose let an unverified restaurant in through the
// side door — and phrased as if it had already been introduced ("if Bar Enza
// is booked and Harvest is too..."), when Harvest appeared nowhere else.
const PLAN_B_RULE = {
  verified: `"Backup if this stop is full or closed. Any place you name MUST come from the VERIFIED VENUES list above, and must be introduced as a new suggestion — never referred to as if already mentioned"`,
  unverified: `"Backup if this stop is full or closed — describe the kind of place, never a real or real-sounding business name"`,
};
const PLAN_B_OVERALL_RULE = {
  verified: `"Backup for the evening as a whole. Any place you name MUST come from the VERIFIED VENUES list above, introduced as a new suggestion"`,
  unverified: `"Backup for the evening as a whole — describe the kind of place, never a real or real-sounding business name"`,
};
const VENUE_NAME_RULE = {
  verified: `"EXACT name from the VERIFIED VENUES list above — copy it character for character. Only if none of those can fill this stop, a descriptive venue type instead"`,
  unverified: `"Descriptive venue TYPE (e.g. 'Cozy vegetarian bistro') — NEVER a real or real-sounding business name; the user finds the actual venue themselves"`,
};
const responseSchema = (grounded) => {
  const pick = (rule) => grounded ? rule.verified : rule.unverified;
  return RESPONSE_SCHEMA
    .replace('__VENUE_NAME__', pick(VENUE_NAME_RULE))
    .replace('__PLAN_B__', pick(PLAN_B_RULE))
    .replace('__PLAN_B_OVERALL__', pick(PLAN_B_OVERALL_RULE));
};

// ═══════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════

router.post('/date-night', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { action = 'generate' } = req.body;
    const { season, advice: seasonAdvice } = getSeasonContext();

    // ─── GENERATE ───
    if (action === 'generate') {
      const { budget, currency = '$', dateType, location, restrictions, lastTime, startTime,
              dietary, duration, weather, pastDates, preferences, partnerPrefs,
              favorites, plannedDate, isFuturePlan, userLanguage, userLocale, userCurrency, userRegion } = req.body;

      if (!location?.trim()) return res.status(400).json({ error: 'Please enter a city or neighborhood.' });
      if (!dateType) return res.status(400).json({ error: 'Please select a date type.' });

      const sym = currency;
      const durationMap = { quick: 'Quick — 2 stops, done by ~9:30 PM', standard: 'Standard — 2-3 stops, done by ~11 PM', long: 'Long — 3-4 stops, past midnight' };
      const futureDateStr = plannedDate ? new Date(plannedDate + 'T12:00:00').toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' }) : null;

      const venuesBlock = await venueBlockFor(location);
      const verified = verifiedNamesFrom(venuesBlock);

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
${buildDietaryBlock(dietary)}${buildPreferenceBlock(preferences)}${buildPartnerBlock(partnerPrefs)}${buildDedupBlock(pastDates)}${buildFavoritesBlock(favorites)}${venuesBlock}

Return ONLY valid JSON:
${responseSchema(!!venuesBlock)}
${isFuturePlan ? '\nAlso include: "advance_booking": ["Tip 1 about reservations/booking", "Tip 2", "Tip 3"] — specific actions to take now for the planned date.' : ''}

All costs in ${sym}. dress_vibe per stop + overall_dress_code. plan_b per stop AND overall.`;

      const parsed = await callClaudeWithRetry({
        model: MODELS.FAST,
        max_tokens: 3000,
        system: withLanguage(`${SYSTEM_PROMPT}\n\nAll costs in ${sym}.`, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
        messages: [{ role: 'user', content: prompt }],
      }, { label: 'DateNightGenerate' });
      if (!parsed.itinerary) {
      return res.status(500).json({ error: 'Could not plan your date night. Please try again.' });
    }
    markVerified(parsed.itinerary, verified);
    attachPlaceFacts(parsed.itinerary, groundedData(`date-venues:${normalizeKeyPart(location || '')}`), req.body.plannedDate);
    return res.json(parsed);
    }

    // ─── REGENERATE ───
    if (action === 'regenerate') {
      const { budget, currency = '$', dateType, location, restrictions, startTime,
              dietary, duration, weather, previousTitle, pastDates, preferences,
              partnerPrefs, favorites, feel, userLanguage, userLocale, userCurrency, userRegion } = req.body;

      if (!location?.trim()) return res.status(400).json({ error: 'Location required.' });

      const venuesBlock = await venueBlockFor(location);
      const verified = verifiedNamesFrom(venuesBlock);
      const sym = currency;
      const durationMap = { quick: '~2 hours', standard: '~3-4 hours', long: '~5+ hours' };

      // "Something different" told the model to shuffle. A direction tells it
      // what to change TOWARD, which is the difference between a reroll and a
      // choice the reader can predict before clicking.
      const FEEL = {
        relaxed:     'Make it MORE RELAXED: fewer stops, lower-key venues, less structure, more room to linger.',
        romantic:    'Make it MORE ROMANTIC: prioritise atmosphere, intimacy and moments for just the two of them.',
        adventurous: 'Make it MORE ADVENTUROUS: something they would not ordinarily do, further from the obvious.',
      };
      const feelLine = FEEL[feel] ? `\n${FEEL[feel]}` : '';

      const prompt = `Create a COMPLETELY DIFFERENT date night. Previous: "${previousTitle || 'unknown'}". Different theme, venues, vibe.${feelLine}

- Budget: ${sym}${budget}, Currency: ${sym}, Type: ${DATE_TYPE_LABELS[dateType] || dateType}
- Location: ${location.trim()}, Start: ${startTime || '7:00 PM'}, Duration: ${durationMap[duration] || '~3-4 hours'}
- Season: ${season} — ${seasonAdvice}
${weather ? `- Weather: ${weather}` : ''}${restrictions ? `\n- Restrictions: ${restrictions}` : ''}
${buildDietaryBlock(dietary)}${buildPreferenceBlock(preferences)}${buildPartnerBlock(partnerPrefs)}${buildDedupBlock(pastDates)}${buildFavoritesBlock(favorites)}

${venuesBlock}

Return ONLY valid JSON: ${responseSchema(!!venuesBlock)}`;

      const parsed = await callClaudeWithRetry({
        model: MODELS.FAST,
        max_tokens: 3000,
        system: withLanguage(`${SYSTEM_PROMPT}\n\nAll costs in ${sym}.`, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
        messages: [{ role: 'user', content: prompt }],
      }, { label: 'DateNightRegenerate' });
      if (!parsed.itinerary && !parsed.plan) {
      return res.status(500).json({ error: 'Could not plan your date night. Please try again.' });
    }
    markVerified(parsed.itinerary, verified);
    attachPlaceFacts(parsed.itinerary, groundedData(`date-venues:${normalizeKeyPart(location || '')}`), req.body.plannedDate);
    return res.json(parsed);
    }

    // ─── NEXT HELP ───
    // "Anything else you want help with before tonight?" — replaces a related-
    // tools strip that recommended by taxonomy, which is how someone planning
    // an anniversary got sent to Apology Calibrator.
    //
    // The model picks from the real catalog and writes the framing, so the
    // answer is about THIS evening rather than a category. It is a separate
    // action, fired after the plan renders, so it adds nothing to the wait.
    //
    // EVERY id is validated against the catalog before it leaves the server. A
    // model asked to name a tool will invent a plausible one, and an invented
    // id is a dead link on a results page. Unknown ids are dropped, not fixed.
    if (action === 'next-help') {
      const { dateType, location, vibeTitle, itinerary, yearsTogether,
              userLanguage, userLocale, userCurrency, userRegion } = req.body;

      const plan = Array.isArray(itinerary) && itinerary.length
        ? itinerary.map(x => `${x.time} ${x.venue_name} (${x.stop_type})`).join('; ')
        : '(no itinerary)';
      const menu = TOOL_CATALOG
        .filter(t => t.id !== 'DateNight')
        .map(t => `${t.id}: ${t.tagline || t.description || ''}`.slice(0, 130))
        .join('\n');

      const prompt = `Someone has just planned this evening and is getting ready for it.

OCCASION: ${DATE_TYPE_LABELS[dateType] || dateType || 'a date'}${yearsTogether ? ` (${yearsTogether} years together)` : ''}
PLACE: ${location || 'unspecified'}
THE EVENING: ${vibeTitle || ''}
STOPS: ${plan}

Pick AT MOST 3 tools that this specific person plausibly needs BEFORE OR DURING tonight.
Judge by what the evening actually demands — a dress code implies deciding what to wear, an
unfamiliar cuisine implies reading a menu, a milestone implies writing something. Do NOT pick a
tool because it shares a topic with dating or relationships. If fewer than 3 genuinely fit,
return fewer. If none fit, return an empty array.

Never suggest a tool that solves a problem this evening does not have.

TOOLS (choose by exact id, only from this list):
${menu}

Return ONLY valid JSON:
{ "suggestions": [ { "id": "ExactToolId", "label": "What it does for them tonight, imperative, max 6 words", "why": "One short sentence, specific to this evening" } ] }`;

      const parsed = await callClaudeWithRetry({
        model: MODELS.FAST,
        max_tokens: 700,
        system: withLanguage('You recommend the next useful tool, never the merely related one. Return ONLY valid JSON.', userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
        messages: [{ role: 'user', content: prompt }],
      }, { label: 'DateNightNextHelp' });

      const clean = (Array.isArray(parsed.suggestions) ? parsed.suggestions : [])
        .filter(x => x && typeof x.id === 'string' && isRealTool(x.id))
        .slice(0, 3);
      const dropped = (parsed.suggestions || []).length - clean.length;
      if (dropped > 0) console.warn(`[date-night:next-help] dropped ${dropped} suggestion(s) naming tools that do not exist`);
      return res.json({ suggestions: clean });
    }

    // ─── ADAPT ───
    // "If something changes" — the three ways an evening actually goes wrong,
    // answered in place rather than as a wall of alternatives up front. One
    // action with a `change` rather than three endpoints: same inputs, same
    // schema back, only the instruction differs.
    if (action === 'adapt') {
      const { change, budget, currency = '$', dateType, location, startTime, duration,
              weather, dietary, restrictions, itinerary, userLanguage, userLocale,
              userCurrency, userRegion } = req.body;

      if (!location?.trim()) return res.status(400).json({ error: 'Location required.' });

      const venuesBlock = await venueBlockFor(location);
      const verified = verifiedNamesFrom(venuesBlock);
      const CHANGE = {
        restaurant: 'The DINNER stop fell through — it is unavailable. Replace that one stop with a different place of the same kind at a similar price. Keep every other stop and the timings exactly as they are.',
        indoors:    'The WEATHER has turned. Move the ending indoors: replace any outdoor stop with an indoor one nearby at a similar price, and keep the rest of the evening intact.',
        timing:     'They are RUNNING LATE by about an hour. Rework the timings so the evening still finishes sensibly — shorten or drop the least essential stop rather than rushing all of them, and say which you changed.',
      };
      if (!CHANGE[change]) return res.status(400).json({ error: 'Unknown change.' });

      const sym = currency;
      const current = Array.isArray(itinerary) && itinerary.length
        ? itinerary.map(x => `${x.time} — ${x.venue_name} (~${sym}${x.estimated_cost})`).join('\n')
        : '(not supplied)';

      const prompt = `${CHANGE[change]}

CURRENT PLAN:
${current}

- Budget: ${sym}${budget}, Currency: ${sym}, Type: ${DATE_TYPE_LABELS[dateType] || dateType}
- Location: ${location.trim()}, Start: ${startTime || '7:00 PM'}, Duration: ${durationMapFor(duration)}
- Season: ${season} — ${seasonAdvice}
${weather ? `- Weather: ${weather}` : ''}${restrictions ? `\n- Restrictions: ${restrictions}` : ''}
${buildDietaryBlock(dietary)}

${venuesBlock}

Return the WHOLE revised evening. Return ONLY valid JSON: ${responseSchema(!!venuesBlock)}`;

      const parsed = await callClaudeWithRetry({
        model: MODELS.FAST,
        max_tokens: 3000,
        system: withLanguage(`${SYSTEM_PROMPT}\n\nAll costs in ${sym}.`, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
        messages: [{ role: 'user', content: prompt }],
      }, { label: 'DateNightAdapt' });
      if (!parsed.itinerary) {
        return res.status(500).json({ error: 'Could not rework the evening. Please try again.' });
      }
      markVerified(parsed.itinerary, verified);
    attachPlaceFacts(parsed.itinerary, groundedData(`date-venues:${normalizeKeyPart(location || '')}`), req.body.plannedDate);
      return res.json(parsed);
    }

    // ─── SWAP ───
    if (action === 'swap') {
      const { currency = '$', dateType, location, dietary, currentItinerary,
              swapStopNumber, preferences, partnerPrefs, userLanguage, userLocale, userCurrency, userRegion } = req.body;

      if (!currentItinerary || !swapStopNumber) return res.status(400).json({ error: 'Itinerary and stop number required.' });
      const sym = currency;
      const currentStop = (currentItinerary.itinerary || []).find(s => s.stop_number === swapStopNumber);
      const otherStops = (currentItinerary.itinerary || []).filter(s => s.stop_number !== swapStopNumber).map(s => s.venue_name);
      // The replacement has to be as real as the stop it replaces, or swapping
      // silently downgrades a verified evening into an invented one.
      const venuesBlock = await venueBlockFor(location);
      const verified = verifiedNamesFrom(venuesBlock);

      const prompt = `Replace ONE stop. Evening: "${currentItinerary.vibe_title}" in ${location}
Type: ${DATE_TYPE_LABELS[dateType] || dateType}
KEEP: ${otherStops.join(', ')}
REPLACE: #${swapStopNumber} "${currentStop?.venue_name}" at ${currentStop?.time} (~${sym}${currentStop?.estimated_cost})
${buildDietaryBlock(dietary)}${buildPreferenceBlock(preferences)}${buildPartnerBlock(partnerPrefs)}${venuesBlock}
${venuesBlock ? 'The replacement MUST be one of the verified venues above, and MUST NOT be one of the KEEP venues.' : ''}

Return ONLY valid JSON:
{
  "stop": {
    "time": "${currentStop?.time || '8:00 PM'}", "venue_name": ${venuesBlock ? '"EXACT name from the VERIFIED VENUES list above"' : '"Descriptive venue TYPE — never a real or real-sounding business name"'},
    "stop_type": "type", "description": "What to do (2-3 sentences)",
    "estimated_cost": ${currentStop?.estimated_cost || 25}, "pro_tip": "Tip",
    "dress_vibe": "Dress code", "plan_b": ${venuesBlock ? '"Backup if this stop is full or closed. Any place you name MUST come from the VERIFIED VENUES list above, introduced as a new suggestion"' : '"Backup if this stop is full or closed — describe the kind of place, never a real business name"'}, "stop_number": ${swapStopNumber}
  }
}`;

      const parsed = await callClaudeWithRetry({
        model: MODELS.FAST,
        max_tokens: 1000,
        system: withLanguage(`${SYSTEM_PROMPT}\n\nAll costs in ${sym}.`, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
        messages: [{ role: 'user', content: prompt }],
      }, { label: 'DateNightSwap' });
      if (!parsed.stop) {
      return res.status(500).json({ error: 'Could not plan your date night. Please try again.' });
    }
    markVerified([parsed.stop], verified);
    return res.json(parsed);
    }

    // ─── RATE ───
    if (action === 'rate') {
      // `evening` replaced stopRatings / notes / actualSpend when the rating
      // section was cut back to stars: all three asked the visitor for work
      // and then discarded it. stopRatings is still accepted so a client that
      // is mid-session on the previous bundle keeps working.
      const { vibeTitle, location, dateType, overallRating, evening, stopRatings,
              userLanguage, userLocale, userCurrency, userRegion } = req.body;
      if (!overallRating) return res.status(400).json({ error: 'Please rate your date.' });

      const stops = (Array.isArray(evening) && evening.length) ? evening : (stopRatings || []);

      const prompt = withLanguage(`Analyze date feedback.

DATE: "${vibeTitle}" in ${location || 'unknown'} | Type: ${dateType || '?'} | OVERALL: ${overallRating}/5
THE EVENING THEY RATED:
${stops.map(s => `  - "${s.venue_name}" (${s.stop_type || '?'})`).join('\n')}

Infer what this couple likes from that rating and the kinds of places above — a high rating means more like these, a low one means fewer.

Return ONLY valid JSON:
{
  "summary": "One sentence insight",
  "liked_types": ["types they enjoy"],
  "disliked_types": ["types they skip"],
  "liked_qualities": ["qualities they enjoy"],
  "pace_preference": "quick|standard|long",
  "next_suggestion": "Specific idea for next date",
  "encouragement": "Warm one-sentence note"
}`, userLanguage);

      const parsed = await callClaudeWithRetry({
      model: MODELS.FAST,
      max_tokens: 4000,
      system: withLanguage(`Date feedback analyst. Warm, encouraging. Return ONLY valid JSON. ${NO_QUOTE_RULE}`, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: prompt }],
    }, { label: 'DateNightRate' });
      if (!parsed.summary) {
      return res.status(500).json({ error: 'Could not plan your date night. Please try again.' });
    }
    return res.json(parsed);
    }

    // ─── SHARE ───
    if (action === 'share') {
      const { vibeTitle, dateType, location, itinerary, startTime, budget, currency,
              surprise, userLanguage, userLocale, userCurrency, userRegion } = req.body;
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

        const parsed = await callClaudeWithRetry({
      model: MODELS.FAST,
      max_tokens: 4000,
      system: withLanguage(`Charming friend who creates excitement about mystery dates. Return ONLY valid JSON. ${NO_QUOTE_RULE}`, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: prompt }],
    }, { label: 'DateNightSurprise' });
        return res.json({ ...parsed, isSurprise: true });
      }

      // Regular share
      const prompt = withLanguage(`Write a SHORT flirty text inviting your partner.

DATE: "${vibeTitle}" in ${location} | Type: ${dateType || '?'}
PLAN: ${stopsList} | START: ${startTime || '7:00 PM'} | BUDGET: ${sym}${budget || '?'}

4-5 lines max. Match tone to date type. Keep some mystery. End invitingly.

Return ONLY valid JSON:
{ "message": "The text", "tone": "Tone used" }`, userLanguage);

      const parsed = await callClaudeWithRetry({
      model: MODELS.FAST,
      max_tokens: 1500,
      system: withLanguage(`Charming invite writer. Match tone to date type. Return ONLY valid JSON. ${NO_QUOTE_RULE}`, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: prompt }],
    }, { label: 'DateNightShare' });
      if (!parsed.message) {
      return res.status(500).json({ error: 'Could not plan your date night. Please try again.' });
    }
    return res.json(parsed);
    }

    // ─── SIMILAR ───
    if (action === 'similar') {
      const { venueName, stopType, location, dateType, budget, currency, userLanguage, userLocale, userCurrency, userRegion } = req.body;
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

      const parsed = await callClaudeWithRetry({
        model: MODELS.FAST,
        max_tokens: 4000,
        system: withLanguage(`${SYSTEM_PROMPT}\n\nAll costs in ${sym}.`, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
        messages: [{ role: 'user', content: prompt }],
      }, { label: 'DateNightSimilar' });
      if (!parsed.original) {
      return res.status(500).json({ error: 'Could not plan your date night. Please try again.' });
    }
    return res.json(parsed);
    }

    // ─── ANNIVERSARY DEEP ───
    if (action === 'anniversary-deep') {
      const { location, budget, currency, yearsTogether, startTime, dietary,
              preferences, partnerPrefs, userLanguage, userLocale, userCurrency, userRegion } = req.body;
      if (!yearsTogether) return res.status(400).json({ error: 'How many years?' });
      const sym = currency || '$';
      const venuesBlock = await venueBlockFor(location);
      const verified = verifiedNamesFrom(venuesBlock);

      const prompt = withLanguage(`Plan a special ${yearsTogether}-year anniversary date.

LOCATION: ${location || '?'} | BUDGET: ${sym}${budget || 100} | START: ${startTime || '7:00 PM'}
SEASON: ${season} — ${seasonAdvice}
${buildDietaryBlock(dietary)}${buildPreferenceBlock(preferences)}${buildPartnerBlock(partnerPrefs)}${venuesBlock}

Create a narrative arc — thoughtful opening → signature memory moment → intimate closing.

Return ONLY valid JSON:
{
  "vibe_title": "Evocative name", "vibe_description": "Mood sentence",
  "narrative_arc": "Emotional journey (2 sentences)",
  "itinerary": [
    { "time": "7:00 PM", "venue_name": ${venuesBlock ? '"EXACT name from the VERIFIED VENUES list above"' : '"Descriptive venue TYPE — never a real or real-sounding business name"'}, "stop_type": "type",
      "description": "What to do (2-3 sentences)", "estimated_cost": 30,
      "pro_tip": "Tip", "dress_vibe": "Dress code",
      "anniversary_touch": "Something specific for an anniversary at this stop",
      "for_the_two_of_you": "One thing to DO or SAY together at this stop — a toast, a question, an exchange. Specific to this venue and to ${yearsTogether} years. One sentence.",
      "plan_b": "Specific alternative if this stop has a wait or is closed",
      "stop_number": 1 }
  ],
  "total_estimated": 80, "buffer": 15,
  "one_thing_now": "The single action to take BEFORE the date, in 2-4 words (e.g. 'Reserve dinner'). The one thing that breaks the evening if skipped.",
  "transportation": "How you get around, as a SHORT phrase of 2 to 5 words — never a sentence.",
  "nostalgia_prompts": ["3-4 reflection questions for ${yearsTogether} years"],
  "milestone_gesture": "Meaningful gesture for ${yearsTogether} years",
  "overall_dress_code": "What to wear, as a SHORT phrase of 3 to 6 words — never a sentence.",
  "tips": ["2-3 anniversary-specific tips"]
}`, userLanguage);

      const parsed = await callClaudeWithRetry({
        model: MODELS.FAST,
        max_tokens: 2500,
        system: withLanguage(`${SYSTEM_PROMPT}\n\nAll costs in ${sym}. Special anniversary — bring warmth.`, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
        messages: [{ role: 'user', content: prompt }],
      }, { label: 'DateNightAnniversary' });
      if (!parsed.itinerary && !parsed.plan) {
      return res.status(500).json({ error: 'Could not plan your date night. Please try again.' });
    }
    markVerified(parsed.itinerary, verified);
    attachPlaceFacts(parsed.itinerary, groundedData(`date-venues:${normalizeKeyPart(location || '')}`), req.body.plannedDate);
    return res.json(parsed);
    }

    // ─── DATE JAR (generate 10-12 date concepts) ───
    if (action === 'date-jar') {
      const { location, budget, currency = '$', dietary, preferences, partnerPrefs,
              pastDates, userLanguage, userLocale, userCurrency, userRegion } = req.body;
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

      const parsed = await callClaudeWithRetry({
        model: MODELS.FAST,
        max_tokens: 3000,
        system: withLanguage(`${SYSTEM_PROMPT}\n\nAll budgets in ${sym}. Be creative — surprise them.`, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
        messages: [{ role: 'user', content: prompt }],
      }, { label: 'DateNightJar' });
      if (!parsed.location) {
      return res.status(500).json({ error: 'Could not plan your date night. Please try again.' });
    }
    return res.json(parsed);
    }

    // ─── RUT DETECT (analyze patterns, suggest variety) ───
    if (action === 'rut-detect') {
      const { pastDates, location, userLanguage, userLocale, userCurrency, userRegion } = req.body;
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
  "missing_categories": ["Stop types they've never tried"],
  "suggestions": [
    { "idea": "Specific suggestion to break the pattern", "why": "Why this would be refreshing (1 sentence)" }
  ],
  "encouragement": "Warm note about their dating life"
}`, userLanguage);

      const parsed = await callClaudeWithRetry({
      model: MODELS.FAST,
      max_tokens: 4000,
      system: withLanguage(`Relationship pattern analyst. Encouraging, not judgmental. Return ONLY valid JSON. ${NO_QUOTE_RULE}`, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: prompt }],
    }, { label: 'DateNightRutDetect' });
      if (!parsed.pattern_summary) {
      return res.status(500).json({ error: 'Could not plan your date night. Please try again.' });
    }
    return res.json(parsed);
    }

    // ─── CHECKLIST (pre-date preparation) ───
    if (action === 'checklist') {
      const { dateType, startTime, weather, dietary, hasReservation, userLanguage, userLocale, userCurrency, userRegion } = req.body;
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
    { "item": "What to do", "timing": "When to do it", "priority": "must|nice" }
  ],
  "last_minute_reminder": "One thing to remember walking out the door"
}`, userLanguage);

      const parsed = await callClaudeWithRetry({
      model: MODELS.FAST,
      max_tokens: 4000,
      system: withLanguage(`Pre-date preparation expert. Practical + thoughtful. Return ONLY valid JSON. ${NO_QUOTE_RULE}`, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: prompt }],
    }, { label: 'DateNightChecklist' });
      if (!parsed.checklist) {
      return res.status(500).json({ error: 'Could not plan your date night. Please try again.' });
    }
    return res.json(parsed);
    }

    return res.status(400).json({ error: 'Invalid action. Use: generate, regenerate, swap, rate, share, similar, anniversary-deep, date-jar, rut-detect, checklist' });
  } catch (error) {
    console.error('[DateNight]', error.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
