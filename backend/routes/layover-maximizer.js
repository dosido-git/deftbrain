const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

const PERSONALITY = `You are an expert travel advisor who specializes in airport layovers and transit logistics. You have deep knowledge of:
- International airports: terminal layouts, immigration/customs processing times, transit options
- Visa-free transit policies by nationality
- Airport amenities: lounges, restaurants, sleep pods, showers, quiet zones
- City transit connections from major airports
- Realistic time estimates for clearing security, immigration, and customs
- Risk factors: delays, rebooking, seasonal congestion

You are practical, specific, and time-aware. Every recommendation accounts for the user's actual available time. You never suggest something that can't realistically fit the time window. When in doubt, you add buffer time — missing a connection is the worst outcome.`;

// ════════════════════════════════════════════════════════════
// POST /layover-maximizer — Main analysis (Should I leave?)
// ════════════════════════════════════════════════════════════
router.post('/layover-maximizer', async (req, res) => {
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

Analyze this layover and provide a complete plan. Be specific about THIS airport — don't give generic advice. Include real terminal names, real restaurant names, real transit options with actual travel times.

IMPORTANT: All time estimates should be realistic worst-case, not best-case. Add 15-20min buffer to immigration estimates during peak hours. Be conservative — a missed flight is far worse than unused time.`;

    const userPrompt = `LAYOVER ANALYSIS:
Airport: ${airport}
Layover duration: ${layoverHours} hours
${nationality ? `Nationality/passport: ${nationality}` : ''}
${hasCheckedBags !== undefined ? `Checked bags: ${hasCheckedBags ? 'Yes (checked through to final destination)' : 'No / carry-on only'}` : ''}
${hasPreCheck ? 'Has TSA PreCheck / Global Entry' : ''}
${arrivalTerminal ? `Arriving at: Terminal ${arrivalTerminal}` : ''}
${connectionTerminal ? `Departing from: Terminal ${connectionTerminal}` : ''}
${arrivalTime ? `Arrival time: ${arrivalTime}` : ''}
${travelStyle ? `Travel style: ${travelStyle}` : ''}

Return ONLY valid JSON:
{
  "airport_name": "Full airport name",
  "airport_code": "IATA code",
  "city": "City name",

  "verdict": "YES|NO|RISKY",
  "verdict_emoji": "✅|❌|⚠️",
  "verdict_summary": "One-sentence summary of the decision",

  "time_math": {
    "total_layover_minutes": 300,
    "deplane_and_walk_minutes": 15,
    "immigration_exit_minutes": 25,
    "transit_to_city_minutes": 35,
    "transit_from_city_minutes": 35,
    "security_reentry_minutes": 40,
    "buffer_minutes": 30,
    "available_city_minutes": 120,
    "return_by_time": "2:15 PM (if arrival time was provided, otherwise null)",
    "breakdown_explanation": "Plain English explanation of the math"
  },

  "leave_the_airport": {
    "can_leave": true,
    "visa_info": "Visa/transit requirements for this nationality at this airport. null if not applicable.",
    "transit_options": [
      {
        "mode": "Train / Metro / Bus / Taxi / Rideshare",
        "name": "Specific line or service name",
        "time_minutes": 35,
        "cost_estimate": "$5-8",
        "notes": "Where to catch it, frequency, tips"
      }
    ],
    "explore_itinerary": {
      "theme": "Quick description of the vibe",
      "stops": [
        {
          "name": "Place name",
          "what": "What to do/see here",
          "time_needed": "30 min",
          "distance_from_previous": "5 min walk",
          "tip": "Insider tip"
        }
      ],
      "total_explore_time": "2h 20min",
      "food_recommendation": "Where and what to eat along the route"
    },
    "warnings": ["Any important warnings about leaving (visa, bags, terminal change, etc.)"]
  },

  "stay_in_airport": {
    "terminal_info": "Which terminal(s) you'll be in and whether you can move between them",
    "food": [
      {
        "name": "Restaurant/bar name",
        "terminal": "Terminal/gate area",
        "type": "Type of food",
        "price_range": "$-$$$$",
        "tip": "What to order or know"
      }
    ],
    "lounges": [
      {
        "name": "Lounge name",
        "terminal": "Terminal",
        "access": "How to get in (card, day pass, airline status)",
        "day_pass_price": "$50 or null",
        "highlights": "Showers, food quality, views, etc.",
        "worth_it": true
      }
    ],
    "sleep_spots": "Best places to rest/nap — specific locations",
    "hidden_gems": ["Things most travelers don't know about this airport"],
    "practical": {
      "wifi": "WiFi quality and how to connect",
      "charging": "Where to find outlets/charging stations",
      "showers": "Shower availability and cost",
      "walking_path": "Best walking route for exercise if available",
      "kids_area": "Family-friendly spots if applicable"
    }
  },

  "terminal_change_warning": "If arriving and departing from different terminals, explain how to transfer and how long it takes. null if same terminal or unknown.",

  "pro_tips": ["3-5 airport-specific pro tips that frequent travelers would know"]
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('LayoverMaximizer error:', error);
    res.status(500).json({ error: error.message || 'Analysis failed' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /layover-maximizer/lounge — Lounge deep dive
// ════════════════════════════════════════════════════════════
router.post('/layover-maximizer/lounge', async (req, res) => {
  try {
    const { airport, terminal, cards, airline, status, userLanguage } = req.body;

    if (!airport?.trim()) {
      return res.status(400).json({ error: 'Enter an airport.' });
    }

    const systemPrompt = `${PERSONALITY}

You are specifically an airport lounge expert. You know which lounges exist at every major airport, their access policies, quality, and whether they're worth the money. Be specific about THIS airport's lounges — real names, real access rules, real quality assessments.`;

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
      "name": "Lounge name",
      "terminal": "Terminal/concourse",
      "network": "Priority Pass / Amex Centurion / Airline / Independent",
      "access_methods": [
        {
          "method": "Priority Pass / Amex Platinum / Day Pass / Airline Status",
          "eligible": true,
          "cost": "Free with card / $50 day pass / etc."
        }
      ],
      "quality_rating": "1-5 stars",
      "food_quality": "Description of food offerings",
      "drinks": "Bar situation",
      "has_showers": true,
      "has_sleeping": false,
      "crowding": "Usually crowded / Usually quiet / Peak hours busy",
      "best_feature": "The one thing that makes this lounge worth it",
      "worst_feature": "The main complaint",
      "worth_day_pass": true,
      "tip": "Insider advice"
    }
  ],
  "best_overall": "Name of the best lounge and why",
  "best_value": "Best for day pass purchasers",
  "best_for_sleep": "Best if you need to rest",
  "no_lounge_alternative": "If no lounges are accessible, what's the next best option (quiet gate area, restaurant with outlets, etc.)"
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('LayoverMaximizer lounge error:', error);
    res.status(500).json({ error: error.message || 'Lounge search failed' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /layover-maximizer/risk — Risk calculator
// ════════════════════════════════════════════════════════════
router.post('/layover-maximizer/risk', async (req, res) => {
  try {
    const {
      airport, airline, layoverHours, scenario,
      delayMinutes, isInternational, userLanguage
    } = req.body;

    if (!airport?.trim()) {
      return res.status(400).json({ error: 'Enter an airport.' });
    }

    const systemPrompt = `${PERSONALITY}

You are analyzing the RISK of a layover scenario. The user wants to know: what happens if things go wrong? Be honest about worst cases. Include real rebooking policies and practical next steps.`;

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
    "next_flight_likely": "When the next available flight typically is",
    "rebooking_policy": "What the airline will do (rebook free, charge fee, etc.)",
    "overnight_needed": true,
    "hotel_situation": "Will airline provide hotel? Airport hotel options and costs?",
    "estimated_cost": "Total potential out-of-pocket cost if things go wrong"
  },

  "delay_cascade": {
    "current_buffer": "How much buffer remains given any reported delay",
    "still_feasible": true,
    "adjusted_plan": "What to do differently given the delay. null if no delay.",
    "when_to_worry": "At what point should you abandon the exploration plan"
  },

  "mitigation": [
    {
      "action": "What to do",
      "why": "Why this helps",
      "when": "When to do it"
    }
  ],

  "worst_case_timeline": "Step by step: what happens from missing the flight to getting to your destination",

  "gamble_verdict": "Should they push it? Honest assessment with the risk/reward tradeoff clearly stated."
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('LayoverMaximizer risk error:', error);
    res.status(500).json({ error: error.message || 'Risk analysis failed' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /layover-maximizer/gate-to-gate — Terminal transfer
// ════════════════════════════════════════════════════════════
router.post('/layover-maximizer/gate-to-gate', async (req, res) => {
  try {
    const { airport, arrivalGate, departureGate, hasPreCheck, minutesAvailable, userLanguage } = req.body;

    if (!airport?.trim()) return res.status(400).json({ error: 'Enter an airport.' });

    const systemPrompt = `${PERSONALITY}

You are specifically a terminal transfer expert. You know the layouts of major airports — how to get between terminals, concourses, and gates. Give step-by-step walking directions with realistic time estimates. Be specific about THIS airport.`;

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
      "instruction": "Step-by-step direction",
      "time_minutes": 3,
      "tip": "Insider tip if applicable, null otherwise"
    }
  ],
  "fastest_route": "Description of the fastest way",
  "shuttle_or_train": {
    "available": true,
    "name": "Name of inter-terminal transport",
    "frequency": "Every X minutes",
    "travel_time": "X minutes",
    "where_to_catch": "Specific location"
  },
  "security_info": "What to expect at security if re-screening is needed. null if not needed.",
  "tight_connection_tips": ["Tips if time is short"],
  "feasibility": "Given available time, is this doable? What's the verdict?"
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('LayoverMaximizer gate-to-gate error:', error);
    res.status(500).json({ error: error.message || 'Gate transfer failed' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /layover-maximizer/compare — Side-by-side layover comparison
// ════════════════════════════════════════════════════════════
router.post('/layover-maximizer/compare', async (req, res) => {
  try {
    const { options, nationality, travelStyle, userLanguage } = req.body;

    if (!options?.length || options.length < 2) {
      return res.status(400).json({ error: 'Need at least 2 layover options to compare.' });
    }

    const systemPrompt = `${PERSONALITY}

You are comparing layover options to help someone choose the best connection when booking a flight. Be opinionated — give a clear winner with reasoning. Consider: can they leave the airport, food quality, lounge access, airport comfort, things to do, and overall experience.`;

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
      "airport": "Airport code",
      "airport_name": "Full name",
      "hours": 5,
      "can_leave": true,
      "leave_verdict": "YES|NO|RISKY",
      "city_time_minutes": 120,
      "airport_rating": "1-5 stars",
      "food_rating": "1-5 stars",
      "lounge_options": "Brief summary",
      "best_thing": "The single best thing about this layover",
      "worst_thing": "The main downside",
      "explore_highlight": "If you leave: the one thing you'd do",
      "stay_highlight": "If you stay: the one thing you'd do",
      "overall_score": 85
    }
  ],
  "winner": "Airport code of the best option",
  "winner_reason": "2-3 sentences on why this is the better layover",
  "runner_up_case": "When you might prefer the other option instead",
  "travel_hack": "Any booking tip — e.g., 'The 6h layover at IST is actually better than the 4h at FRA because you can visit the city visa-free'"
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('LayoverMaximizer compare error:', error);
    res.status(500).json({ error: error.message || 'Comparison failed' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /layover-maximizer/packing — Layover-specific packing list
// ════════════════════════════════════════════════════════════
router.post('/layover-maximizer/packing', async (req, res) => {
  try {
    const { airport, hours, leavingAirport, scenario, userLanguage } = req.body;

    if (!airport?.trim()) return res.status(400).json({ error: 'Enter an airport.' });

    const systemPrompt = `${PERSONALITY}

Generate a context-aware packing/grab list for this specific layover. Think about: weather at the destination, what they'll need if leaving the airport, overnight essentials, cultural considerations, and practical items. The list should be things to pull from their carry-on BEFORE deplaning — not a general packing list.`;

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
      "item": "Item name",
      "why": "Why you need this for THIS specific layover",
      "priority": "essential|recommended|nice_to_have"
    }
  ],
  "leave_in_bag": ["Items you can leave in your carry-on/overhead"],
  "weather_note": "Current typical weather and what to wear",
  "currency_tip": "Local currency situation — do you need cash? Where to get it?",
  "cultural_note": "Any cultural considerations (dress code, customs, etc.) — null if not applicable",
  "phone_tip": "SIM/eSIM/WiFi situation for the layover",
  "pro_tip": "One specific packing tip for this layover"
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('LayoverMaximizer packing error:', error);
    res.status(500).json({ error: error.message || 'Packing list failed' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /layover-maximizer/survival-kit — Offline-ready one-pager
// ════════════════════════════════════════════════════════════
router.post('/layover-maximizer/survival-kit', async (req, res) => {
  try {
    const { airport, airline, hours, plan, userLanguage } = req.body;

    if (!airport?.trim()) return res.status(400).json({ error: 'Enter an airport.' });

    const systemPrompt = `${PERSONALITY}

Generate a compact, screenshot-ready survival kit for this layover. Everything a traveler needs when they land and might not have WiFi yet. Be specific to THIS airport — real phone numbers, real WiFi networks, real currency info.`;

    const userPrompt = `SURVIVAL KIT:
Airport: ${airport}
${airline ? `Airline: ${airline}` : ''}
Duration: ${hours || '?'} hours
${plan ? `Plan: ${plan}` : ''}

Return ONLY valid JSON:
{
  "airport": "${airport}",
  "airport_name": "Full name",
  "emergency_numbers": { "local_emergency": "Number", "airport_info": "Number" },
  "airline_desk": "Where to find your airline's customer service desk + phone number if known",
  "wifi": { "network_name": "WiFi network name", "password": "Password or 'free/no password'", "how_to_connect": "Any steps needed" },
  "currency": { "local_currency": "Name + code", "exchange_rate_approx": "vs USD", "atm_locations": "Where to find ATMs", "card_acceptance": "How widely accepted are cards?" },
  "key_phrases": [
    { "english": "Where is gate X?", "local": "Translation", "pronunciation": "Phonetic guide" }
  ],
  "transport_from_airport": { "to_city": "Fastest way + cost", "taxi_tip": "How to avoid scams / what to expect" },
  "time_zone": "Local time zone and UTC offset",
  "power_outlets": "Outlet type and whether you need an adapter",
  "quick_contacts": { "airline_phone": "Phone number if known", "embassy_note": "How to find your embassy if needed" },
  "one_thing_to_know": "The single most important thing about this airport that every traveler should know"
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('LayoverMaximizer survival-kit error:', error);
    res.status(500).json({ error: error.message || 'Survival kit failed' });
  }
});

module.exports = router;
