const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

const NO_INVENTED_AUTHORITY = `NEVER USE CONFIDENT SPECIFICITY YOU CANNOT SUPPORT. Not "consistently fresh", not "nearly always empty at 9 AM", not "signal is stronger there", not "consistently rated the top lounge". Those read as observed fact and none of them is checkable. Say what a place reliably IS, not what it is reliably like on a Tuesday.

LOUNGE ACCESS IS SAFETY-CRITICAL, because a traveller will walk across a terminal on your word. Name the lounge and its terminal, and describe access only in terms you are sure of. Do not summarise a card or airline's access rules into a short list — they change and they are full of exceptions. Point them at the operator to confirm eligibility instead.`;

const PERSONALITY = `Expert travel advisor specializing in airport layovers. Deep knowledge of terminal layouts, immigration timing, visa-free transit, lounges, city connections, and realistic time estimates. Time-aware and risk-conscious: every recommendation accounts for actual available time and builds in buffer. Missing a connection is the worst outcome.

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.

Never place a double-quote (") character inside any JSON string value — write quoted names or phrases plainly or with single quotes, or it breaks the JSON.`

// ════════════════════════════════════════════════════════════
// POST /layover-maximizer — Main analysis (Should I leave?)
// ════════════════════════════════════════════════════════════
router.post('/layover-maximizer', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const {
      airport, layoverHours, nationality, hasCheckedBags,
      hasPreCheck, connectionTerminal, arrivalTerminal,
      arrivalTime, travelStyle, userLanguage
    } = req.body;

    if (!airport?.trim()) {
      return res.status(400).json({ error: 'Enter an airport code or name.' });
    }
    if (!layoverHours || layoverHours < 0.5) {
      return res.status(400).json({ error: 'Enter your layover duration.' });
    }

    const systemPrompt = `${PERSONALITY}

Plan this layover specifically — real terminal names, real restaurants, real transit times. Worst-case estimates only. Add 15-20 min buffer to immigration.

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.

CONSISTENT NUMBERS: time_math.available_city_minutes MUST equal total_layover_minutes minus every deduction (deplane_and_walk_minutes + immigration_exit_minutes + transit_to_city_minutes + transit_from_city_minutes + security_reentry_minutes + buffer_minutes). Do the subtraction explicitly and reconcile — breakdown_explanation must state the same figure. Never let the available-time number disagree with the breakdown. If any deduction is null because you were not told the fact behind it, available_city_minutes is null too — an unknown minus something is not a number, and breakdown_explanation must say which missing fact is blocking it. Never write 0 to mean unknown — 0 means you did the arithmetic and the honest answer is no usable time.

EVERY FIELD IS READ BY A TRAVELLER, NOT A PROGRAMMER. Never name a JSON field in any text you write — not available_city_minutes, not immigration_exit_minutes, not return_by_time. Say 'your time in the city', 'immigration', 'the time to be back by'. A sentence that mentions a field name has leaked the plumbing into the answer. The same arithmetic discipline applies to return_by_time: it MUST be the latest clock time that still leaves transit_from_city_minutes + security_reentry_minutes + buffer_minutes before the departure time — compute it explicitly, never estimate.

${NO_INVENTED_AUTHORITY}`;

    // One 12-key schema at max_tokens 4000 measured 67-68s — past the ~60s where
    // Safari abandons the fetch. The tool already asks two questions (do I leave,
    // or do I stay?), so that is the seam. The time math and the verdict it
    // decides stay in the same call, or the two halves could disagree about how
    // long the traveller actually has. Merged back to the original shape.
    const brief = `LAYOVER ANALYSIS:
Airport: ${airport}
Layover duration: ${layoverHours} hours
${nationality ? `Nationality/passport: ${nationality}` : 'Nationality/passport: NOT PROVIDED'}
${hasCheckedBags !== undefined ? `Checked bags: ${hasCheckedBags ? 'Yes (checked through to final destination)' : 'No / carry-on only'}` : 'Checked bags: NOT PROVIDED'}
${hasPreCheck ? 'Has TSA PreCheck / Global Entry' : ''}
${arrivalTerminal ? `Arriving at: Terminal ${arrivalTerminal}` : 'Arrival terminal: NOT PROVIDED'}
${connectionTerminal ? `Departing from: Terminal ${connectionTerminal}` : 'Departure terminal: NOT PROVIDED'}
${arrivalTime ? `Landing time: ${arrivalTime}` : 'Landing time: NOT PROVIDED'}
${travelStyle ? `Travel style: ${travelStyle}` : ''}

NEVER CONVERT A MISSING FACT INTO AN ASSUMPTION. Anything marked NOT PROVIDED is unknown to you, and several of these decide whether this traveller makes their flight:

- Nationality/passport decides whether immigration and customs apply at all. Unknown passport means immigration_exit_minutes MUST be null, never 0. "No immigration" is a claim, and you cannot make it.
- Landing time is the only thing that can produce a clock time to be back by. Unknown landing time means return_by_time MUST be null. Do not compute one from a typical schedule.
- Terminals decide whether they re-clear security. Unknown terminals mean you must not assert either way.
- Checked bags decide whether they can leave at all at some airports.

For every NOT PROVIDED item that would change your verdict or your arithmetic, add an entry to need_to_know. Give the best answer you honestly can from what you were told, and be explicit about what would sharpen it. A preliminary answer with a stated gap is worth more than a confident answer built on an invented fact.

You are answering ONE HALF of this question. Another planner is answering the other half — return only your own keys.`;

    // ── Part A: can they leave, and what does the clock actually allow ──
    const leavePrompt = `${brief}

YOUR PART: the verdict, the time arithmetic behind it, and the plan for leaving the airport.

Return ONLY valid JSON with EXACTLY these nine top-level keys:
{
  "airport_name": "Full airport name — 3-6 words",
  "airport_code": "IATA code — one sentence",
  "city": "City name. Nothing else.",

  "verdict": "YES|NO|RISKY",
  "verdict_emoji": "✅|❌|⚠️",
  "verdict_summary": "One-sentence summary of the decision — 1-2 sentences",

  "time_math": {
    "total_layover_minutes": 300,
    "deplane_and_walk_minutes": 15,
    "immigration_exit_minutes": 25,
    "transit_to_city_minutes": 35,
    "transit_from_city_minutes": 35,
    "security_reentry_minutes": 40,
    "buffer_minutes": 30,
    "available_city_minutes": 120,
    "return_by_time": "A clock time ONLY if a landing time was provided. null otherwise — never computed from a typical schedule.",
    "breakdown_explanation": "Plain English explanation of the math — 1-2 sentences",
    "provenance": {
      "told_us": ["Which figures came from the traveller, e.g. 'Layover duration'"],
      "estimated": ["Which are conservative estimates, e.g. 'Deplaning', 'Transit', 'Security'"],
      "unknown": ["Which could not be computed and why, e.g. 'Immigration — need your passport'"]
    }
  },

  "need_to_know": [
    {
      "question": "The single missing fact, as a question you would ask them — 'Are your arriving and departing flights in the same terminal?'",
      "why": "What it would change about the answer — one sentence",
      "changes_verdict": true
    }
  ],

  "leave_the_airport": {
    "can_leave": true,
    "visa_info": "Visa/transit requirements for this nationality at this airport. null if not applicable. — one sentence",
    "transit_options": [
      {
        "mode": "Exactly one of these and nothing else: Train, Metro, Bus, Taxi, Rideshare",
        "name": "Specific line or service name — 3-6 words",
        "time_minutes": 35,
        "cost_estimate": "Approx fare in the traveler's local currency — short range",
        "notes": "Where to catch it, frequency, tips — one sentence"
      }
    ],
    "explore_itinerary": {
      "theme": "Quick description of the vibe — 3-6 words",
      "stops": [
        {
          "name": "Place name — 3-6 words",
          "what": "What to do/see here — one sentence",
          "time_needed": "30 min (number)",
          "distance_from_previous": "5 min walk (number)",
          "tip": "Insider tip — one sentence"
        }
      ],
      "total_explore_time": "2h 20min — one sentence",
      "food_recommendation": "Where and what to eat along the route — one sentence"
    },
    "warnings": ["Any important warnings about leaving (visa, bags, terminal change, etc.)"]
  },

  "terminal_change_warning": "If arriving and departing from different terminals, explain how to transfer and how long it takes. null if same terminal or unknown. — one sentence"
}

AT MOST 3 need_to_know — only facts that would actually change the verdict or the arithmetic, most consequential first. AT MOST 3 transit_options, 4 stops, 3 warnings.`;

    // ── Part B: what the airport itself offers if they stay ──
    const stayPrompt = `${brief}

YOUR PART: what is inside the airport, for a traveller who stays airside.

LEAD WITH ONE RECOMMENDATION, NOT A DIRECTORY. This traveller wants to know what to DO, not what facts you hold about this airport. best_plan is your answer to 'if you were my traveller, this is what I would do' — one route through the layover, chosen for the travel style they gave you, ordered the way they will live it. Everything else in stay_in_airport is the alternatives shelf they can browse afterwards, and best_plan must name specific places that also appear there.

Return ONLY valid JSON with EXACTLY these three top-level keys:
{
  "best_plan": {
    "headline": "The recommendation in one short imperative line — 'Stay in Terminal 4.' — 3-8 words",
    "steps": [
      {
        "when": "A clock time ONLY if a landing time was provided; otherwise a relative marker like First, Then, After that — 1-3 words",
        "do": "One concrete action naming a specific place — one sentence"
      }
    ],
    "why": "Why this plan suits THIS traveller's stated style and time — 1-2 sentences",
    "leave_for_gate": "When to start heading for the gate. A clock time ONLY if a landing time was provided, otherwise say how long before boarding. null if you cannot say."
  },

  "stay_in_airport": {
    "terminal_info": "Which terminal(s) you'll be in and whether you can move between them — one sentence",
    "food": [
      {
        "name": "Restaurant/bar name — 3-6 words",
        "terminal": "Terminal/gate area — one sentence",
        "type": "Type of food — one sentence",
        "price_range": "$-$$$$ — one sentence",
        "tip": "What to order or know — one sentence"
      }
    ],
    "lounges": [
      {
        "name": "Lounge name — 3-6 words",
        "terminal": "Terminal — one sentence",
        "access": "How to get in (card, day pass, airline status) — one sentence",
        "day_pass_price": "Day pass price in the traveler's local currency, or null",
        "highlights": "Showers, food quality, views, etc. — one sentence",
        "worth_it": true
      }
    ],
    "sleep_spots": "Best places to rest/nap — specific locations — one sentence",
    "hidden_gems": ["Things most travelers don't know about this airport"],
    "practical": {
      "wifi": "WiFi quality and how to connect — one sentence",
      "charging": "Where to find outlets/charging stations — one sentence",
      "showers": "Shower availability and cost — one sentence",
      "walking_path": "Best walking route for exercise if available — one sentence",
      "kids_area": "Family-friendly spots if applicable — one sentence"
    }
  },

  "pro_tips": ["3-5 airport-specific pro tips that frequent travelers would know"]
}

AT MOST 4 steps in best_plan, 4 food, 3 lounges, 3 hidden_gems, 5 pro_tips.`;

    const locale = withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);
    const [leavePart, stayPart] = await Promise.all([
      callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: 3000,
        system: withLanguage(systemPrompt, userLanguage) + locale,
        messages: [{ role: 'user', content: leavePrompt }],
      }, { label: 'layover-maximizer:leave' }),
      callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: 3200,
        system: withLanguage(systemPrompt, userLanguage) + locale,
        messages: [{ role: 'user', content: stayPrompt }],
      }, { label: 'layover-maximizer:stay' }),
    ]);
    const parsed = { ...stayPart, ...leavePart };
    if (!parsed.verdict) {
      return res.status(500).json({ error: 'Could not plan your layover. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('LayoverMaximizer error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /layover-maximizer/lounge — Lounge deep dive
// ════════════════════════════════════════════════════════════
router.post('/layover-maximizer/lounge', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { airport, terminal, cards, airline, status, userLanguage } = req.body;

    if (!airport?.trim()) {
      return res.status(400).json({ error: 'Enter an airport.' });
    }

    const systemPrompt = `${PERSONALITY}

Lounge expert for this specific airport — real names, access rules, honest quality assessment.

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`;

    const userPrompt = `LOUNGE FINDER:
Airport: ${airport}
${terminal ? `Terminal: ${terminal}` : ''}
${cards?.length ? `Credit cards: ${cards.join(', ')}` : ''}
${airline ? `Flying: ${airline}` : ''}
${status ? `Status: ${status}` : ''}

Return ONLY valid JSON:
{
  "airport": "${airport}",
  "lounges": [
    {
      "name": "Lounge name — 3-6 words",
      "terminal": "Terminal/concourse — one sentence",
      "network": "Exactly one of these and nothing else: Priority Pass, Amex Centurion, Airline, Independent",
      "access_methods": [
        {
          "method": "Exactly one of these and nothing else: Priority Pass, Amex Platinum, Day Pass, Airline Status",
          "eligible": true,
          "cost": "Free with card / day pass price in the traveler's local currency / etc."
        }
      ],
      "quality_rating": "1-5 stars (number)",
      "food_quality": "Description of food offerings — one sentence",
      "drinks": "Bar situation — one sentence",
      "has_showers": true,
      "has_sleeping": false,
      "crowding": "Exactly one of these and nothing else: Usually crowded, Usually quiet, Peak hours busy",
      "best_feature": "The one thing that makes this lounge worth it — one sentence",
      "worst_feature": "The main complaint — one sentence",
      "worth_day_pass": true,
      "tip": "Insider advice — one sentence"
    }
  ],
  "best_overall": "The best lounge, named, plus why it wins, in one short sentence",
  "best_value": "Best for day pass purchasers — one sentence",
  "best_for_sleep": "Best if you need to rest — one sentence",
  "no_lounge_alternative": "If no lounges are accessible, what's the next best option (quiet gate area, restaurant with outlets, etc.) — one sentence"
}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 5000,
      system: withLanguage(systemPrompt, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'layover-maximizer-2' });
    if (!parsed.lounges) {
      return res.status(500).json({ error: 'Could not plan your layover. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('LayoverMaximizer lounge error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /layover-maximizer/risk — Risk calculator
// ════════════════════════════════════════════════════════════
router.post('/layover-maximizer/risk', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const {
      airport, airline, layoverHours, scenario,
      delayMinutes, isInternational, userLanguage
    } = req.body;

    if (!airport?.trim()) {
      return res.status(400).json({ error: 'Enter an airport.' });
    }

    const systemPrompt = `${PERSONALITY}

Analyze layover risk. What happens if things go wrong? Include rebooking policies and practical next steps.

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`;

    const userPrompt = `RISK ANALYSIS:
Airport: ${airport}
${airline ? `Airline: ${airline}` : ''}
Layover: ${layoverHours || '?'} hours
${scenario ? `Scenario: ${scenario}` : ''}
${delayMinutes ? `Current delay: ${delayMinutes} minutes` : ''}
${isInternational ? 'International connection' : 'Domestic connection'}

Return ONLY valid JSON:
{
  "risk_level": "LOW|MEDIUM|HIGH|CRITICAL",
  "risk_emoji": "🟢|🟡|🟠|🔴",
  "risk_summary": "One sentence summary",

  "if_you_miss_it": {
    "next_flight_likely": "When the next available flight typically is — one sentence",
    "rebooking_policy": "What the airline will do (rebook free, charge fee, etc.) — one sentence",
    "overnight_needed": true,
    "hotel_situation": "Will airline provide hotel? Airport hotel options and costs? — one sentence",
    "estimated_cost": "Total potential out-of-pocket cost if things go wrong (number)"
  },

  "delay_cascade": {
    "current_buffer": "How much buffer remains given any reported delay — one sentence",
    "still_feasible": true,
    "adjusted_plan": "What to do differently given the delay. null if no delay. — one sentence",
    "when_to_worry": "At what point should you abandon the exploration plan — one sentence"
  },

  "mitigation": [
    {
      "action": "What to do — one sentence",
      "why": "Why this helps — one sentence",
      "when": "When to do it — one sentence"
    }
  ],

  "worst_case_timeline": "Step by step: what happens from missing the flight to getting to your destination — one sentence",

  "gamble_verdict": "Should they push it? Honest assessment with the risk/reward tradeoff clearly stated. — one sentence"
}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2000,
      system: withLanguage(systemPrompt, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'layover-maximizer-3' });
    if (!parsed.risk_level) {
      return res.status(500).json({ error: 'Could not plan your layover. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('LayoverMaximizer risk error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /layover-maximizer/gate-to-gate — Terminal transfer
// ════════════════════════════════════════════════════════════
router.post('/layover-maximizer/gate-to-gate', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { airport, arrivalGate, departureGate, hasPreCheck, minutesAvailable, userLanguage } = req.body;

    if (!airport?.trim()) return res.status(400).json({ error: 'Enter an airport.' });

    const systemPrompt = `${PERSONALITY}

Terminal transfer expert for this airport — step-by-step directions with realistic times.

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`;

    const userPrompt = `GATE-TO-GATE TRANSFER:
Airport: ${airport}
Arrival gate/terminal: ${arrivalGate || 'unknown'}
Departure gate/terminal: ${departureGate || 'unknown'}
${hasPreCheck ? 'Has TSA PreCheck / Global Entry' : 'Standard security'}
${minutesAvailable ? `Minutes available: ${minutesAvailable}` : ''}

Return ONLY valid JSON:
{
  "airport": "${airport}",
  "arrival": "${arrivalGate || 'unknown'}",
  "departure": "${departureGate || 'unknown'}",
  "same_terminal": true,
  "requires_security_recheck": false,
  "total_estimated_minutes": 15,
  "difficulty": "EASY|MODERATE|TIGHT|DANGEROUS",
  "difficulty_emoji": "🟢|🟡|🟠|🔴",
  "steps": [
    {
      "step": 1,
      "instruction": "Step-by-step direction — one sentence",
      "time_minutes": 3,
      "tip": "Insider tip if applicable, null otherwise — one sentence"
    }
  ],
  "fastest_route": "Description of the fastest way — one sentence",
  "shuttle_or_train": {
    "available": true,
    "name": "Name of inter-terminal transport — 3-6 words",
    "frequency": "Every X minutes (number)",
    "travel_time": "X minutes — one sentence",
    "where_to_catch": "Specific location — one sentence"
  },
  "security_info": "What to expect at security if re-screening is needed. null if not needed. — one sentence",
  "tight_connection_tips": ["Tips if time is short"],
  "feasibility": "Given available time, is this doable? What's the verdict? — one sentence"
}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2000,
      system: withLanguage(systemPrompt, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'layover-maximizer-4' });
    if (!parsed.steps) {
      return res.status(500).json({ error: 'Could not plan your layover. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('LayoverMaximizer gate-to-gate error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /layover-maximizer/compare — Side-by-side layover comparison
// ════════════════════════════════════════════════════════════
router.post('/layover-maximizer/compare', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { options, nationality, travelStyle, userLanguage } = req.body;

    if (!options?.length || options.length < 2) {
      return res.status(400).json({ error: 'Need at least 2 layover options to compare.' });
    }

    const systemPrompt = `${PERSONALITY}

Compare layover options. Give a clear winner. Consider: leaving the airport, food, lounges, comfort, things to do.

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`;

    const optionsList = options.map((o, i) =>
      `Option ${i + 1}: ${o.airport} — ${o.hours} hours${o.notes ? ` (${o.notes})` : ''}`
    ).join('\n');

    const userPrompt = `COMPARE LAYOVERS:
${optionsList}
${nationality ? `Nationality: ${nationality}` : ''}
${travelStyle ? `Travel style: ${travelStyle}` : ''}

Return ONLY valid JSON:
{
  "options": [
    {
      "airport": "Airport code — one sentence",
      "airport_name": "Full name — 3-6 words",
      "hours": 5,
      "can_leave": true,
      "leave_verdict": "YES|NO|RISKY",
      "city_time_minutes": 120,
      "airport_rating": "1-5 stars (number)",
      "food_rating": "1-5 stars (number)",
      "lounge_options": "Brief summary — one sentence",
      "best_thing": "The single best thing about this layover — one sentence",
      "worst_thing": "The main downside — one sentence",
      "explore_highlight": "If you leave: the one thing you'd do — one sentence",
      "stay_highlight": "If you stay: the one thing you'd do — one sentence",
      "overall_score": 85
    }
  ],
  "winner": "Airport code of the best option — one sentence",
  "winner_reason": "2-3 sentences on why this is the better layover",
  "runner_up_case": "When you might prefer the other option instead — one sentence",
  "travel_hack": "Any booking tip — e.g., 'The 6h layover at IST is actually better than the 4h at FRA because you can visit the city visa-free' — one sentence"
}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 3000,
      system: withLanguage(systemPrompt, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'layover-maximizer-5' });
    if (!parsed.winner) {
      return res.status(500).json({ error: 'Could not plan your layover. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('LayoverMaximizer compare error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /layover-maximizer/packing — Layover-specific packing list
// ════════════════════════════════════════════════════════════
router.post('/layover-maximizer/packing', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { airport, hours, leavingAirport, scenario, userLanguage } = req.body;

    if (!airport?.trim()) return res.status(400).json({ error: 'Enter an airport.' });

    const systemPrompt = `${PERSONALITY}

Generate a grab-list for this layover — things to pull from carry-on before deplaning. Context-specific, not generic.

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`;

    const userPrompt = `LAYOVER PACKING LIST:
Airport: ${airport}
Duration: ${hours || '?'} hours
${leavingAirport ? 'Plan: Leaving the airport to explore' : 'Plan: Staying in the airport'}
${scenario ? `Details: ${scenario}` : ''}

Return ONLY valid JSON:
{
  "airport": "${airport}",
  "grab_before_deplaning": [
    {
      "item": "Item name. Nothing else.",
      "why": "Why you need this for THIS specific layover — one sentence",
      "priority": "essential|recommended|nice_to_have"
    }
  ],
  "leave_in_bag": ["Items you can leave in your carry-on/overhead"],
  "weather_note": "Current typical weather and what to wear — one sentence",
  "currency_tip": "Local currency situation — do you need cash? Where to get it? — one sentence",
  "cultural_note": "Any cultural considerations (dress code, customs, etc.) — null if not applicable — one sentence",
  "phone_tip": "SIM/eSIM/WiFi situation for the layover — one sentence",
  "pro_tip": "One specific packing tip for this layover — one sentence"
}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 4000,
      system: withLanguage(systemPrompt, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'layover-maximizer-6' });
    if (!parsed.grab_before_deplaning) {
      return res.status(500).json({ error: 'Could not plan your layover. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('LayoverMaximizer packing error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /layover-maximizer/survival-kit — Offline-ready one-pager
// ════════════════════════════════════════════════════════════
router.post('/layover-maximizer/survival-kit', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { airport, airline, hours, plan, userLanguage } = req.body;

    if (!airport?.trim()) return res.status(400).json({ error: 'Enter an airport.' });

    const systemPrompt = `${PERSONALITY}

Compact offline survival kit for this airport — real phone numbers, WiFi networks, currency info.

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`;

    const userPrompt = `SURVIVAL KIT:
Airport: ${airport}
${airline ? `Airline: ${airline}` : ''}
Duration: ${hours || '?'} hours
${plan ? `Plan: ${plan}` : ''}

Return ONLY valid JSON:
{
  "airport": "${airport}",
  "airport_name": "Full name — 3-6 words",
  "emergency_numbers": { "local_emergency": "Number — one sentence", "airport_info": "Number — one sentence" },
  "airline_desk": "Where to find your airline's customer service desk + phone number if known — one sentence",
  "wifi": { "network_name": "WiFi network name — 3-6 words", "password": "Password or 'free/no password' — one sentence", "how_to_connect": "Any steps needed — one sentence" },
  "currency": { "local_currency": "Name + code. Nothing else.", "exchange_rate_approx": "vs USD — one sentence", "atm_locations": "Where to find ATMs — one sentence", "card_acceptance": "How widely accepted are cards? — one sentence" },
  "key_phrases": [
    { "english": "Where is gate X? — one sentence", "local": "Translation — one sentence", "pronunciation": "Phonetic guide — one sentence" }
  ],
  "transport_from_airport": { "to_city": "Fastest way + cost — one sentence", "taxi_tip": "How to avoid scams / what to expect — one sentence" },
  "time_zone": "Local time zone and UTC offset — one sentence",
  "power_outlets": "Outlet type and whether you need an adapter — one sentence",
  "quick_contacts": { "airline_phone": "Phone number if known — one sentence", "embassy_note": "How to find your embassy if needed — one sentence" },
  "one_thing_to_know": "The single most important thing about this airport that every traveler should know — one sentence"
}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2000,
      system: withLanguage(systemPrompt, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'layover-maximizer-7' });
    if (!parsed.one_thing_to_know) {
      return res.status(500).json({ error: 'Could not plan your layover. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('LayoverMaximizer survival-kit error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
