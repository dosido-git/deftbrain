const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

// ════════════════════════════════════════════════════════════
// SHARED
// ════════════════════════════════════════════════════════════
const PERSONALITY = `You are a brutally honest pre-purchase research assistant. You give people the advice a knowledgeable friend would give — specific, opinionated, and practical. Not a coupon blog. Not a generic "do your research." You tell them exactly what they need to know.

YOUR PERSONALITY:
- Talk like a friend who happens to be weirdly knowledgeable about shopping
- Be specific: "Check the manufacturer's refurb store" not "shop around"
- Be honest: "You probably don't need this" when true
- Use short, punchy sentences. No corporate speak.
- When you don't know exact current prices, say "typically" or "around" — never fabricate specific prices with false precision`;

// ════════════════════════════════════════════════════════════
// POST /buy-wise — Main analysis
// ════════════════════════════════════════════════════════════
router.post('/buy-wise', async (req, res) => {
  try {
    const { product, price, currency, urgency, isImpulse, isGift, giftRecipient, priority, context, comparison, userLanguage } = req.body;

    if (!product || !product.trim()) {
      return res.status(400).json({ error: 'Please enter what you want to buy' });
    }

    const sym = currency || '$';
    const hasPrice = price != null && price > 0;
    const hasComparison = comparison && comparison.product;
    const compProducts = hasComparison ? (Array.isArray(comparison) ? comparison : [comparison]) : [];
    const isMultiCompare = compProducts.length > 1;

    const systemPrompt = `${PERSONALITY}

ADDITIONAL RULES:
- Use the user's currency (${sym}) for ALL prices and estimates
- Calibrate prices to realistic market rates — a mixer in Tokyo costs differently than in Ohio
- Every section must contain specific, actionable information — no filler
- If a section doesn't apply to this product, return null for that section (don't force it)
- Negotiation only applies to products where haggling is realistic (cars, furniture, services, electronics at independent stores, rent, medical bills) — NOT for standard retail
- Buy vs Subscribe vs Rent only when subscription or rental models actually exist for this product
- Quality tier advice should be category-specific: some categories reward premium (mattresses, shoes, cookware), others don't (HDMI cables, basic tools)
- Be culturally aware of where the user might be based on their currency
${isGift ? `\nGIFT MODE ACTIVE: The user is buying this as a gift${giftRecipient ? ` for: ${giftRecipient}` : ''}. Evaluate everything through a gift-giving lens: perceived value, presentation quality, "wow factor," thoughtfulness signal, and whether the recipient would actually want/use this. Include the gift_analysis section.` : ''}`;

    let userPrompt = `RESEARCH THIS PURCHASE:
Product: ${product}
${hasPrice ? `Price seen: ${sym}${price}` : 'No price specified — estimate typical range'}
Currency: ${sym}
Urgency: ${urgency === 'today' ? 'Need it today — skip "wait for sale" advice, focus on best price NOW' : urgency === 'this_week' ? 'This week — mention upcoming sales only if imminent' : 'Flexible timing — include sale calendar and wait recommendations'}
Priority: ${priority} (weight your advice toward this)
${isImpulse ? 'USER FLAGGED THIS AS IMPULSE BUY — include impulse_check section with honest evaluation' : ''}
${isGift ? `GIFT MODE: Buying as a gift${giftRecipient ? ` for ${giftRecipient}` : ''}` : ''}
${context ? `Additional context: ${context}` : ''}
${compProducts.length > 0 ? `\nCOMPARISON REQUESTED:\n${compProducts.map((cp, i) => `  Option ${i + 2}: "${cp.product}"${cp.price ? ` (${sym}${cp.price})` : ''}`).join('\n')}` : ''}

Return ONLY valid JSON with ALL applicable sections. Set sections to null if they don't apply.

{
  "verdict": "One bold sentence: the overall recommendation",
  "verdict_emoji": "Single emoji summarizing the verdict (👍 🟡 🛑 ⏳ ✅ etc.)",
  "verdict_summary": "2-3 sentences expanding on the verdict with the key reasoning",
  "product_category": "detected category: tech | kitchen | fashion | vehicle | furniture | subscription | fitness | beauty | home | outdoor | gaming | tools | office | baby | pet | other"${isImpulse ? `,

  "impulse_check": {
    "do_you_need_it": "Honest answer: do they actually need this or is it a want? Be specific.",
    "what_else_could_you_do": "What else could this money buy? Be specific and vivid.",
    "already_own_something": "Could something they likely already own do this job?",
    "wait_recommendation": "Specific recommendation with timeframe."
  }` : `,"impulse_check": null`}${isGift ? `,

  "gift_analysis": {
    "wow_factor": "1-10 rating with explanation. How impressive is this as a gift?",
    "practical_vs_fun": "Is this a practical gift or a fun one? Which does the recipient likely prefer?",
    "perceived_value": "Will the recipient think this cost more or less than it did?",
    "alternatives_at_price": "2-3 alternative gifts at a similar price point that might be even better",
    "presentation_tip": "How to present/wrap this to maximize impact",
    "risk_level": "LOW / MEDIUM / HIGH — risk they won't like it. With explanation."
  }` : `,"gift_analysis": null`},

  "fair_price": {
    "verdict_badge": "GOOD PRICE | FAIR PRICE | HIGH | OVERPAYING | CHECK",
    "analysis": "Is this a good price? What do these typically sell for? Where are they cheapest? Be specific with price ranges in ${sym}.",
    "typical_range": "${sym}X - ${sym}Y for [condition: new/used/refurb]",
    "where_to_find_cheaper": "Specific platform or strategy to get a better price. Not 'shop around' — name the place."
  },

  "timing": ${urgency === 'today' ? 'null' : `{
    "verdict_badge": "BUY NOW | WAIT | GOOD TIME",
    "analysis": "Is now a good time to buy this? What's the product release cycle? Any upcoming sales?",
    "next_sale": "Specific sale event and approximate date. null if nothing upcoming.",
    "price_cycle_note": "Does this product have a known price cycle?"
  }`},

  "total_cost": {
    "summary": "What will this ACTUALLY cost over time? Include consumables, maintenance, accessories, and hidden costs.",
    "breakdown": [
      {"item": "Purchase price", "cost": "${sym}X"},
      {"item": "Essential accessory/consumable", "cost": "${sym}Y/year"},
      {"item": "Maintenance or replacement part", "cost": "${sym}Z over N years"}
    ],
    "year_1_total": "${sym}X (purchase + first year costs)",
    "year_5_total": "${sym}X (if applicable — skip for short-life products)",
    "price_per_use": null
  },

  "cheaper_alternative": {
    "suggestion": "A specific cheaper product that does 80-95% of the same job. Name the product, include approximate price.",
    "tradeoffs": "What you give up with the cheaper option. Be honest.",
    "refurbished_tip": "Can this be bought refurbished or open-box? Where? Typical savings? null if not applicable."
  },

  "used_refurb_deep_dive": {
    "viable": true,
    "where_to_buy_used": ["Specific platforms/stores for used/refurb versions"],
    "what_to_inspect": ["What to check when buying used — product-specific"],
    "typical_used_price": "${sym}X - ${sym}Y",
    "risk_assessment": "What's the risk of buying used for this specific product? Be honest.",
    "platform_trust": [{"name": "Platform", "trust": "HIGH/MEDIUM/LOW", "why": "reason"}]
  },

  "warranty_returns": {
    "typical_warranty": "How long is the typical manufacturer warranty for this product?",
    "extended_worth_it": "Is an extended warranty worth it? Be honest — usually no, but some categories yes.",
    "return_tips": "Best return policies by retailer for this product category.",
    "credit_card_protection": "Many credit cards double manufacturer warranties. Worth checking."
  },

  "buy_vs_subscribe": ${`null if no subscription or rental model exists, otherwise: {
    "analysis": "Compare buying outright vs subscribing vs renting. Include real prices.",
    "breakeven": "At what point does buying become cheaper?",
    "recommendation": "Clear recommendation based on their context."
  }`},

  "quality_tier": {
    "recommended_tier": "Budget | Mid-Range | Premium",
    "analysis": "Is this a category where spending more actually matters? Be specific.",
    "spend_vs_save": "One sentence summary."
  },

  "regret_predictor": {
    "common_regrets": "What do people who buy this most commonly regret?",
    "usage_reality": "How much do people actually use this after buying?",
    "avoid_regret_tip": "One specific thing to check or consider before buying."
  },

  "watch_out": [
    "2-4 specific gotchas, hidden costs, or things that commonly surprise buyers."
  ],

  "negotiation": ${`null unless haggling is realistic. If applicable: {
    "context": "Is negotiation realistic here? What's the typical margin?",
    "script": "Exact words to say to negotiate.",
    "leverage_points": ["Specific leverage points"]
  }`}${compProducts.length > 0 ? `,

  "comparison": {
    "winner": "Product name or 'It depends'",
    "analysis": "Detailed practical comparison.",
    "for_your_priority": "Based on the user's stated priority (${priority}), which one wins and why?",
    "products": [${[`{"name": "${product}", "pros": ["2-3 advantages"], "cons": ["1-2 drawbacks"]}`].concat(compProducts.map(cp => `{"name": "${cp.product}", "pros": ["2-3 advantages"], "cons": ["1-2 drawbacks"]}`)).join(', ')}]
  }` : ''},

  "where_to_buy": [
    {"platform": "Store/platform name", "why": "Why this platform for this specific product"}
  ],

  "followup_questions": [
    "2-3 natural follow-up questions the user might want answered, phrased as the user would ask them (e.g., 'Is the base model enough or should I upgrade?', 'What accessories are actually worth buying?')"
  ],

  "bottom_line": "2-3 sentences. The friend-level honest summary. End with a clear action step."
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
    console.error('BuyWise error:', error);
    res.status(500).json({ error: error.message || 'Research failed' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /buy-wise/budget — Budget mode
// ════════════════════════════════════════════════════════════
router.post('/buy-wise/budget', async (req, res) => {
  try {
    const { budget, category, needs, currency, userLanguage } = req.body;

    if (!budget || !category) {
      return res.status(400).json({ error: 'Please provide a budget and category' });
    }

    const sym = currency || '$';

    const systemPrompt = `${PERSONALITY}

You are in BUDGET MODE. The user has a specific budget and needs help finding the best option within it. Use currency ${sym}. Be specific with product names and model numbers when possible.`;

    const userPrompt = `BUDGET MODE:
Budget: ${sym}${budget}
Category: ${category}
${needs ? `What they need it for: ${needs}` : ''}

Recommend the best option(s) within this budget. Return ONLY valid JSON:

{
  "top_pick": {
    "product": "Specific product name with model if applicable",
    "price": "${sym}X",
    "why": "Why this is the best option at this budget. Be specific.",
    "where": "Where to buy it"
  },
  "runner_up": {
    "product": "Second best option",
    "price": "${sym}X",
    "why": "Why someone might prefer this over the top pick",
    "where": "Where to buy it"
  },
  "stretch_pick": {
    "product": "Worth spending 15-25% more for this",
    "price": "${sym}X",
    "why": "What the extra money gets you. Is it worth it?",
    "worth_the_stretch": "YES / MAYBE / NO — with one-sentence reason"
  },
  "avoid": "What to specifically avoid at this price point. Name brands/models if applicable.",
  "budget_verdict": "Is ${sym}${budget} a realistic budget for ${category}? What should they expect at this price point?",
  "save_more_tip": "How to stretch the budget further (refurb, older model, sales, etc.)"
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
    console.error('BuyWise budget error:', error);
    res.status(500).json({ error: error.message || 'Budget analysis failed' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /buy-wise/followup — Follow-up questions
// ════════════════════════════════════════════════════════════
router.post('/buy-wise/followup', async (req, res) => {
  try {
    const { product, question, originalVerdict, currency, userLanguage } = req.body;

    if (!product || !question) {
      return res.status(400).json({ error: 'Missing product or question' });
    }

    const sym = currency || '$';

    const systemPrompt = `${PERSONALITY}

You are answering a follow-up question about a purchase the user is researching. Use currency ${sym}. Be thorough but concise.`;

    const userPrompt = `The user is researching: ${product}
${originalVerdict ? `Original verdict: ${originalVerdict}` : ''}

Their follow-up question: "${question}"

Answer thoroughly. Return ONLY valid JSON:

{
  "answer": "Detailed, specific answer to their question. 3-5 sentences. Be practical and actionable.",
  "key_takeaway": "One bold sentence: the most important thing to know.",
  "sources_to_check": ["1-2 specific places they can verify this info (YouTube channel, subreddit, review site, etc.)"]
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
    console.error('BuyWise followup error:', error);
    res.status(500).json({ error: error.message || 'Follow-up failed' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /buy-wise/calendar — Deal season calendar
// ════════════════════════════════════════════════════════════
router.post('/buy-wise/calendar', async (req, res) => {
  try {
    const { category, currency, userLanguage } = req.body;

    if (!category) {
      return res.status(400).json({ error: 'Please specify a product category' });
    }

    const sym = currency || '$';

    const systemPrompt = `${PERSONALITY}

You are generating a deal calendar for a product category. This should tell the user the best and worst times of year to buy. Use currency ${sym}. Be specific about sale events, not just months.`;

    const userPrompt = `DEAL CALENDAR for: ${category}

When is the best time to buy ${category}? Map out the full year. Return ONLY valid JSON:

{
  "category": "${category}",
  "best_month": "The single best month to buy, with reason",
  "worst_month": "The worst month (highest prices), with reason",
  "calendar": [
    {
      "month": "January",
      "rating": "GREAT | GOOD | AVERAGE | BAD",
      "events": "Specific sale events this month (e.g., 'New Year sales, CES announcements drop last-gen prices')",
      "typical_discount": "Typical % off or savings range"
    }
  ],
  "pro_tips": [
    "3-4 insider tips for getting the best deal on ${category} (e.g., 'Buy last year's model right after new model announcements', 'Manufacturer refurb stores have the best deals in March')"
  ],
  "price_cycle": "Does this category have a predictable price cycle? Explain it."
}

Include all 12 months in the calendar array.`;

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
    console.error('BuyWise calendar error:', error);
    res.status(500).json({ error: error.message || 'Calendar generation failed' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /buy-wise/photo — Photo Mode: identify product from image
// ════════════════════════════════════════════════════════════
router.post('/buy-wise/photo', async (req, res) => {
  try {
    const { image, currency, userLanguage } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Please provide an image' });
    }

    const sym = currency || '$';

    const systemPrompt = `${PERSONALITY}

You are identifying a product from an image. Look at the image carefully and determine:
1. What the product is (brand, model, condition if visible)
2. Its approximate market value
3. Whether the price is fair if shown on a price tag
Use currency ${sym}.`;

    const userPrompt = `Look at this product image and identify it. Return ONLY valid JSON:

{
  "identified": true,
  "product_name": "Full product name including brand and model if identifiable",
  "confidence": "HIGH | MEDIUM | LOW — how confident you are in the identification",
  "condition": "New | Like New | Good | Fair | Poor — based on what's visible",
  "estimated_value": "${sym}X - ${sym}Y",
  "price_tag_visible": false,
  "price_tag_amount": null,
  "price_verdict": null,
  "quick_verdict": "One sentence: is this a good deal / fair price / overpriced?",
  "red_flags": ["Any visible issues: damage, counterfeits signs, missing parts, etc. Empty array if none."],
  "recommendation": "2-3 sentences of practical advice. What should they do?",
  "search_terms": "What to search online to compare prices for this exact item"
}

If you cannot identify the product, set identified to false and explain in recommendation.`;

    const content = [
      {
        type: 'image',
        source: { type: 'base64', media_type: 'image/jpeg', data: image },
      },
      { type: 'text', text: userPrompt },
    ];

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('BuyWise photo error:', error);
    res.status(500).json({ error: error.message || 'Photo identification failed' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /buy-wise/convince — Convince My Partner mode
// ════════════════════════════════════════════════════════════
router.post('/buy-wise/convince', async (req, res) => {
  try {
    const { product, price, currency, direction, context, verdict, userLanguage } = req.body;

    if (!product) {
      return res.status(400).json({ error: 'Please specify the product' });
    }

    const sym = currency || '$';
    const forBuying = direction === 'for';

    const systemPrompt = `${PERSONALITY}

You are helping someone ${forBuying ? 'make the case FOR buying' : 'make the case AGAINST buying'} a product to share with their partner or decision-making partner. Be persuasive but HONEST — don't fabricate benefits or exaggerate risks. Use currency ${sym}.

The goal is to give them a well-structured argument they can share. Think of it as "here's what I'd say if I were presenting this to the household budget meeting."`;

    const userPrompt = `Product: ${product}
${price ? `Price: ${sym}${price}` : ''}
Direction: ${forBuying ? 'MAKE THE CASE FOR BUYING' : 'MAKE THE CASE AGAINST BUYING'}
${verdict ? `Previous research verdict: ${verdict}` : ''}
${context ? `Additional context: ${context}` : ''}

Return ONLY valid JSON:

{
  "headline": "${forBuying ? 'Why we should get this' : 'Why we should skip this'} — one compelling sentence",
  "practical_case": "The logical/practical argument. Facts, numbers, utility. 2-3 sentences.",
  "emotional_case": "The feeling-based argument. Quality of life, enjoyment, peace of mind. 2-3 sentences.",
  "financial_case": "The money argument. ${forBuying ? 'Cost-per-use, long-term savings, value retention' : 'What else we could do with the money, hidden costs, depreciation'}. 2-3 sentences.",
  "counter_argument": "The strongest argument the OTHER side would make, with your rebuttal. 2 sentences.",
  "compromise": "A middle-ground option if full agreement isn't reached. 1-2 sentences.",
  "one_liner": "The single most persuasive sentence to close with — something they can text."
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
    console.error('BuyWise convince error:', error);
    res.status(500).json({ error: error.message || 'Convince mode failed' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /buy-wise/haul — Haul Review: analyze multiple items
// ════════════════════════════════════════════════════════════
router.post('/buy-wise/haul', async (req, res) => {
  try {
    const { items, totalBudget, currency, occasion, userLanguage } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ error: 'Please add at least one item' });
    }

    const sym = currency || '$';

    const systemPrompt = `${PERSONALITY}

You are reviewing a shopping haul — multiple items someone is planning to buy. Evaluate the list as a whole: redundancies, priorities, better alternatives, missing items. Use currency ${sym}. Be specific and practical.`;

    const itemList = items.map((item, i) => `${i + 1}. ${item.name}${item.price ? ` — ${sym}${item.price}` : ''}`).join('\n');
    const totalEstimate = items.reduce((sum, i) => sum + (Number(i.price) || 0), 0);

    const userPrompt = `HAUL REVIEW:
${itemList}

Estimated total: ${sym}${totalEstimate}
${totalBudget ? `Budget: ${sym}${totalBudget}` : ''}
${occasion ? `Occasion/purpose: ${occasion}` : ''}

Review this haul as a whole. Return ONLY valid JSON:

{
  "haul_verdict": "One sentence overall assessment (e.g., 'Solid list with one questionable pick', 'Way over budget — here's what to cut')",
  "haul_emoji": "Single emoji for the overall haul",
  "total_estimated": "${sym}${totalEstimate}",
  "items": [
    {
      "name": "Item name",
      "verdict": "✅ KEEP | ⚠️ RECONSIDER | ❌ SKIP | 🔄 SWAP",
      "note": "Why — one sentence. Be specific.",
      "better_alternative": "null or a specific better option at similar price"
    }
  ],
  "redundancies": ["Any items that overlap or duplicate function. null if none."],
  "missing": ["1-2 things they probably need but didn't include. null if the list is complete."],
  "priority_order": ["If they can only buy some items, which order? List item names from most to least important."],
  "budget_note": "${totalBudget ? `Are they within budget? What to cut if not?` : 'Is this total spend reasonable for what they are getting?'}",
  "save_tip": "One specific way to reduce the total spend without losing value"
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
    console.error('BuyWise haul error:', error);
    res.status(500).json({ error: error.message || 'Haul review failed' });
  }
});

module.exports = router;
