const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage, withLocaleContext } = require('../lib/claude');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

async function withRetry(fn, { retries = 3, baseDelayMs = 1500 } = {}) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const status = err?.status ?? err?.error?.status;
      const isOverloaded = status === 529 || err?.error?.error?.type === 'overloaded_error';
      if (isOverloaded && attempt < retries) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        console.warn(`[buy-wise] Overloaded (529), retrying in ${delay}ms (attempt ${attempt + 1}/${retries})`);
        await new Promise(r => setTimeout(r, delay));
      } else {
        throw err;
      }
    }
  }
}

// ════════════════════════════════════════════════════════════
// SHARED
// ════════════════════════════════════════════════════════════
const PERSONALITY = `Consumer purchasing advisor. Help people make smarter buying decisions with honest, specific analysis: whether they actually need it, real total cost of ownership, best timing and price strategies, what to watch out for. Never generic — specific tactics for this exact purchase.

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.

CONSISTENT NUMBERS: Anchor on ONE canonical figure for the headline savings/price gap and keep every related number consistent with it across all fields. Do not state conflicting amounts (e.g. a price as $43K in one field and $44K in another) or blur distinct quantities (total price gap vs. first-year depreciation) — label which is which.

CHALLENGE THE PREMISE OUT LOUD: If your recommendation contradicts a constraint the user explicitly stated (model year, spec, brand, budget, timing), say so plainly at the start of the verdict — name the constraint and why you're pushing back — instead of quietly substituting a different option.

ESTIMATES ARE ESTIMATES: Prices, discounts, and sale dates are your best estimates from general market knowledge, not live data. Phrase specific dollar figures as approximate (ranges or "~"), and never imply real-time pricing certainty.`

// ════════════════════════════════════════════════════════════
// POST /buy-wise — Main analysis
// ════════════════════════════════════════════════════════════
router.post('/buy-wise', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { product, price, currency, urgency, isImpulse, isGift, giftRecipient, priority, context, comparison, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!product || !product.trim()) {
      return res.status(400).json({ error: 'Please enter what you want to buy' });
    }

    const sym = currency || '$';
    const hasPrice = price != null && price > 0;
    const hasComparison = comparison && comparison.product;
    const compProducts = hasComparison ? (Array.isArray(comparison) ? comparison : [comparison]) : [];

    const systemPrompt = `${PERSONALITY}

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`;

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
  "verdict": "One bold sentence: the overall recommendation — one sentence",
  "verdict_emoji": "Single emoji summarizing the verdict (👍 🟡 🛑 ⏳ ✅ etc.) (one emoji)",
  "verdict_summary": "2-3 sentences expanding on the verdict with the key reasoning",
  "product_category": "detected category: tech | kitchen | fashion | vehicle | furniture | subscription | fitness | beauty | home | outdoor | gaming | tools | office | baby | pet | other"${isImpulse ? `,

  "impulse_check": {
    "do_you_need_it": "Honest answer: do they actually need this or is it a want? Be specific. — one sentence",
    "what_else_could_you_do": "What else could this money buy? Be specific and vivid. — one sentence",
    "already_own_something": "Could something they likely already own do this job? — one sentence",
    "wait_recommendation": "Specific recommendation with timeframe. — one sentence"
  }` : `,"impulse_check": null`}${isGift ? `,

  "gift_analysis": {
    "wow_factor": "1-10 rating with explanation. How impressive is this as a gift? — one sentence",
    "practical_vs_fun": "Is this a practical gift or a fun one? Which does the recipient likely prefer? — one sentence",
    "perceived_value": "Will the recipient think this cost more or less than it did? — one sentence",
    "alternatives_at_price": "2-3 alternatives at a similar price — one sentence each",
    "presentation_tip": "How to present/wrap this to maximize impact — one sentence",
    "risk_level": "LOW / MEDIUM / HIGH — risk they won't like it. With explanation. — one sentence"
  }` : `,"gift_analysis": null`},

  "fair_price": {
    "verdict_badge": "GOOD PRICE | FAIR PRICE | HIGH | OVERPAYING | CHECK",
    "analysis": "Is this a good price? What do these typically sell for? Where are they cheapest? Be specific with price ranges in ${sym}. — 1-2 sentences",
    "typical_range": "${sym}X - ${sym}Y for [condition: new/used/refurb]",
    "where_to_find_cheaper": "Specific platform or strategy to get a better price. Not 'shop around' — name the place. — one sentence"
  },

  "timing": ${urgency === 'today' ? 'null' : `{
    "verdict_badge": "BUY NOW | WAIT | GOOD TIME",
    "analysis": "Is now a good time to buy this? What's the product release cycle? Any upcoming sales? — 1-2 sentences",
    "next_sale": "Specific sale event and approximate date. null if nothing upcoming. — one sentence",
    "price_cycle_note": "Does this product have a known price cycle? — one sentence"
  }`},

  "total_cost": {
    "summary": "What will this ACTUALLY cost over time? Include consumables, maintenance, accessories, and hidden costs. — 1-2 sentences",
    "breakdown": [
      {"item": "Purchase price — one sentence", "cost": "${sym}X"},
      {"item": "Essential accessory/consumable — one sentence", "cost": "${sym}Y/year"},
      {"item": "Maintenance or replacement part — one sentence", "cost": "${sym}Z over N years"}
    ],
    "year_1_total": "${sym}X (purchase + first year costs)",
    "year_5_total": "${sym}X (if applicable — skip for short-life products)",
    "price_per_use": null
  },

  "cheaper_alternative": {
    "suggestion": "A specific cheaper product that does 80-95% of the same job. Name the product, include approximate price. — one sentence",
    "tradeoffs": "What you give up with the cheaper option. Be honest. — one sentence",
    "refurbished_tip": "Can this be bought refurbished or open-box? Where? Typical savings? null if not applicable. — one sentence"
  },

  "used_refurb_deep_dive": {
    "viable": true,
    "where_to_buy_used": ["Specific platforms/stores for used/refurb versions"],
    "what_to_inspect": ["What to check when buying used — product-specific"],
    "typical_used_price": "${sym}X - ${sym}Y",
    "risk_assessment": "What's the risk of buying used for this specific product? Be honest. — 1-2 sentences",
    "platform_trust": [{"name": "Platform — 3-6 words", "trust": "HIGH/MEDIUM/LOW — one sentence", "why": "reason — one sentence"}]
  },

  "warranty_returns": {
    "typical_warranty": "How long is the typical manufacturer warranty for this product? — one sentence",
    "extended_worth_it": "Is an extended warranty worth it? Be honest — usually no, but some categories yes. — one sentence",
    "return_tips": "Best return policies by retailer for this product category. — one sentence",
    "credit_card_protection": "Many credit cards double manufacturer warranties. Worth checking. — one sentence"
  },

  "buy_vs_subscribe": ${`null if no subscription or rental model exists, otherwise: {
    "analysis": "Compare buying outright vs subscribing vs renting. Include real prices. — 1-2 sentences",
    "breakeven": "At what point does buying become cheaper? — one sentence",
    "recommendation": "Clear recommendation based on their context. — one sentence"
  }`},

  "quality_tier": {
    "recommended_tier": "Budget | Mid-Range | Premium",
    "analysis": "Is this a category where spending more actually matters? Be specific. — 1-2 sentences",
    "spend_vs_save": "One sentence summary."
  },

  "regret_predictor": {
    "common_regrets": "What do people who buy this most commonly regret? — one sentence",
    "usage_reality": "How much do people actually use this after buying? — one sentence",
    "avoid_regret_tip": "One specific thing to check or consider before buying. — one sentence"
  },

  "watch_out": [
    "2-4 specific gotchas, hidden costs, or things that commonly surprise buyers."
  ],

  "negotiation": ${`null unless haggling is realistic. If applicable: {
    "context": "Is negotiation realistic here? What's the typical margin? — 1-2 sentences",
    "script": "Exact words to say to negotiate. — 2-4 sentences",
    "leverage_points": ["Specific leverage points"]
  }`}${compProducts.length > 0 ? `,

  "comparison": {
    "winner": "Product name or 'It depends' — one sentence",
    "analysis": "Detailed practical comparison. — 1-2 sentences",
    "for_your_priority": "Based on the user's stated priority (${priority}), which one wins and why? (number)",
    "products": [${[`{"name": "${product}", "pros": ["2-3 advantages"], "cons": ["1-2 drawbacks"]}`].concat(compProducts.map(cp => `{"name": "${cp.product}", "pros": ["2-3 advantages"], "cons": ["1-2 drawbacks"]}`)).join(', ')}]
  }` : ''},

  "where_to_buy": [
    {"platform": "Store/platform name — one sentence", "why": "Why this platform for this specific product — one sentence"}
  ],

  "followup_questions": [
    "2-3 natural follow-up questions the user might want answered, phrased as the user would ask them (e.g., 'Is the base model enough or should I upgrade?', 'What accessories are actually worth buying?')"
  ],

  "bottom_line": "2-3 sentences. The friend-level honest summary. End with a clear action step."
}`;

    const msg = await withRetry(() => anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      system: withLanguage(systemPrompt, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: userPrompt }],
    }));
    if (msg.stop_reason === 'max_tokens') {
      console.error('[buy-wise] Response truncated at max_tokens — schema too large for budget');
      return res.status(500).json({ error: 'That analysis ran long. Please try again.' });
    }
    const rawText = msg.content.find(i => i.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(rawText);
    let parsed; try { parsed = JSON.parse(cleaned); } catch (_) { const _m = cleaned.match(/\{[\s\S]*\}/); if (!_m) throw new Error('Response was not valid JSON'); parsed = JSON.parse(_m[0]); }
    if (!parsed.verdict) {
      return res.status(500).json({ error: 'Could not analyze this purchase. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('BuyWise error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.'});
  }
});

// ════════════════════════════════════════════════════════════
// POST /buy-wise/stream — Main analysis, streamed in two waves.
// CORE = the always-visible verdict/price/where-to-buy/bottom-line
// panels (smaller call → lands first). DETAIL = the collapsible
// secondary panels (TCO, alternatives, warranty, regret, …) which
// stream in after. Both calls run concurrently and each emits its
// sections as it resolves. The client falls back to POST /buy-wise
// if this route errors, so behaviour degrades to the single-shot path.
// ════════════════════════════════════════════════════════════
router.post('/buy-wise/stream', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  const { product, price, currency, urgency, isImpulse, isGift, giftRecipient, priority, context, comparison, userLanguage, userLocale, userCurrency, userRegion } = req.body;

  if (!product || !product.trim()) {
    return res.status(400).json({ error: 'Please enter what you want to buy' });
  }

  const sym = currency || '$';
  const hasPrice = price != null && price > 0;
  const hasComparison = comparison && comparison.product;
  const compProducts = hasComparison ? (Array.isArray(comparison) ? comparison : [comparison]) : [];

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  const sendEvent = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  const system = withLanguage(PERSONALITY, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion);

  const contextHeader = `RESEARCH THIS PURCHASE:
Product: ${product}
${hasPrice ? `Price seen: ${sym}${price}` : 'No price specified — estimate typical range'}
Currency: ${sym}
Urgency: ${urgency === 'today' ? 'Need it today — skip "wait for sale" advice, focus on best price NOW' : urgency === 'this_week' ? 'This week — mention upcoming sales only if imminent' : 'Flexible timing — include sale calendar and wait recommendations'}
Priority: ${priority} (weight your advice toward this)
${isImpulse ? 'USER FLAGGED THIS AS IMPULSE BUY — include impulse_check section with honest evaluation' : ''}
${isGift ? `GIFT MODE: Buying as a gift${giftRecipient ? ` for ${giftRecipient}` : ''}` : ''}
${context ? `Additional context: ${context}` : ''}
${compProducts.length > 0 ? `\nCOMPARISON REQUESTED:\n${compProducts.map((cp, i) => `  Option ${i + 2}: "${cp.product}"${cp.price ? ` (${sym}${cp.price})` : ''}`).join('\n')}` : ''}`;

  // CORE — the panels shown immediately (verdict + price + where-to-buy + bottom line).
  const CORE_SCHEMA = `{
  "verdict": "One bold sentence: the overall recommendation — one sentence",
  "verdict_emoji": "Single emoji summarizing the verdict (👍 🟡 🛑 ⏳ ✅ etc.) (one emoji)",
  "verdict_summary": "2-3 sentences expanding on the verdict with the key reasoning",
  "product_category": "detected category: tech | kitchen | fashion | vehicle | furniture | subscription | fitness | beauty | home | outdoor | gaming | tools | office | baby | pet | other"${isImpulse ? `,
  "impulse_check": {
    "do_you_need_it": "Honest answer: do they actually need this or is it a want? Be specific. — one sentence",
    "what_else_could_you_do": "What else could this money buy? Be specific and vivid. — one sentence",
    "already_own_something": "Could something they likely already own do this job? — one sentence",
    "wait_recommendation": "Specific recommendation with timeframe. — one sentence"
  }` : `,"impulse_check": null`}${isGift ? `,
  "gift_analysis": {
    "wow_factor": "1-10 rating with explanation. How impressive is this as a gift? — one sentence",
    "practical_vs_fun": "Is this a practical gift or a fun one? Which does the recipient likely prefer? — one sentence",
    "perceived_value": "Will the recipient think this cost more or less than it did? — one sentence",
    "alternatives_at_price": "2-3 alternatives at a similar price — one sentence each",
    "presentation_tip": "How to present/wrap this to maximize impact — one sentence",
    "risk_level": "LOW / MEDIUM / HIGH — risk they won't like it. With explanation. — one sentence"
  }` : `,"gift_analysis": null`},
  "fair_price": {
    "verdict_badge": "GOOD PRICE | FAIR PRICE | HIGH | OVERPAYING | CHECK",
    "analysis": "Is this a good price? What do these typically sell for? Where are they cheapest? Be specific with price ranges in ${sym}. — 1-2 sentences",
    "typical_range": "${sym}X - ${sym}Y for [condition: new/used/refurb]",
    "where_to_find_cheaper": "Specific platform or strategy to get a better price. Not 'shop around' — name the place. — one sentence"
  }${compProducts.length > 0 ? `,
  "comparison": {
    "winner": "Product name or 'It depends' — one sentence",
    "analysis": "Detailed practical comparison. — 1-2 sentences",
    "for_your_priority": "Based on the user's stated priority (${priority}), which one wins and why? (number)",
    "products": [${[`{"name": "${product}", "pros": ["2-3 advantages"], "cons": ["1-2 drawbacks"]}`].concat(compProducts.map(cp => `{"name": "${cp.product}", "pros": ["2-3 advantages"], "cons": ["1-2 drawbacks"]}`)).join(', ')}]
  }` : ''},
  "where_to_buy": [
    {"platform": "Store/platform name — one sentence", "why": "Why this platform for this specific product — one sentence"}
  ],
  "followup_questions": [
    "2-3 natural follow-up questions the user might want answered, phrased as the user would ask them (e.g., 'Is the base model enough or should I upgrade?', 'What accessories are actually worth buying?')"
  ],
  "bottom_line": "2-3 sentences. The friend-level honest summary. End with a clear action step."
}`;

  // DETAIL — the collapsible secondary panels that stream in after CORE.
  const DETAIL_SCHEMA = `{
  "timing": ${urgency === 'today' ? 'null' : `{
    "verdict_badge": "BUY NOW | WAIT | GOOD TIME",
    "analysis": "Is now a good time to buy this? What's the product release cycle? Any upcoming sales? — 1-2 sentences",
    "next_sale": "Specific sale event and approximate date. null if nothing upcoming. — one sentence",
    "price_cycle_note": "Does this product have a known price cycle? — one sentence"
  }`},
  "total_cost": {
    "summary": "What will this ACTUALLY cost over time? Include consumables, maintenance, accessories, and hidden costs. — 1-2 sentences",
    "breakdown": [
      {"item": "Purchase price — one sentence", "cost": "${sym}X"},
      {"item": "Essential accessory/consumable — one sentence", "cost": "${sym}Y/year"},
      {"item": "Maintenance or replacement part — one sentence", "cost": "${sym}Z over N years"}
    ],
    "year_1_total": "${sym}X (purchase + first year costs)",
    "year_5_total": "${sym}X (if applicable — skip for short-life products)",
    "price_per_use": null
  },
  "cheaper_alternative": {
    "suggestion": "A specific cheaper product that does 80-95% of the same job. Name the product, include approximate price. — one sentence",
    "tradeoffs": "What you give up with the cheaper option. Be honest. — one sentence",
    "refurbished_tip": "Can this be bought refurbished or open-box? Where? Typical savings? null if not applicable. — one sentence"
  },
  "used_refurb_deep_dive": {
    "viable": true,
    "where_to_buy_used": ["Specific platforms/stores for used/refurb versions"],
    "what_to_inspect": ["What to check when buying used — product-specific"],
    "typical_used_price": "${sym}X - ${sym}Y",
    "risk_assessment": "What's the risk of buying used for this specific product? Be honest. — 1-2 sentences",
    "platform_trust": [{"name": "Platform — 3-6 words", "trust": "HIGH/MEDIUM/LOW — one sentence", "why": "reason — one sentence"}]
  },
  "warranty_returns": {
    "typical_warranty": "How long is the typical manufacturer warranty for this product? — one sentence",
    "extended_worth_it": "Is an extended warranty worth it? Be honest — usually no, but some categories yes. — one sentence",
    "return_tips": "Best return policies by retailer for this product category. — one sentence",
    "credit_card_protection": "Many credit cards double manufacturer warranties. Worth checking. — one sentence"
  },
  "buy_vs_subscribe": ${`null if no subscription or rental model exists, otherwise: {
    "analysis": "Compare buying outright vs subscribing vs renting. Include real prices. — 1-2 sentences",
    "breakeven": "At what point does buying become cheaper? — one sentence",
    "recommendation": "Clear recommendation based on their context. — one sentence"
  }`},
  "quality_tier": {
    "recommended_tier": "Budget | Mid-Range | Premium",
    "analysis": "Is this a category where spending more actually matters? Be specific. — 1-2 sentences",
    "spend_vs_save": "One sentence summary."
  },
  "regret_predictor": {
    "common_regrets": "What do people who buy this most commonly regret? — one sentence",
    "usage_reality": "How much do people actually use this after buying? — one sentence",
    "avoid_regret_tip": "One specific thing to check or consider before buying. — one sentence"
  },
  "watch_out": [
    "2-4 specific gotchas, hidden costs, or things that commonly surprise buyers."
  ],
  "negotiation": ${`null unless haggling is realistic. If applicable: {
    "context": "Is negotiation realistic here? What's the typical margin? — 1-2 sentences",
    "script": "Exact words to say to negotiate. — 2-4 sentences",
    "leverage_points": ["Specific leverage points"]
  }`}
}`;

  async function callGroup(schema, label) {
    const msg = await withRetry(() => anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 6000,
      system,
      messages: [{ role: 'user', content: `${contextHeader}

Return ONLY valid JSON with EXACTLY these keys (set any that don't apply to null). No markdown, no preamble:

${schema}` }],
    }));
    const rawText = msg.content.find(i => i.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(rawText);
    try { return JSON.parse(cleaned); }
    catch (_) {
      const m = cleaned.match(/\{[\s\S]*\}/);
      if (!m) throw new Error(`[buy-wise/stream:${label}] non-JSON response`);
      return JSON.parse(m[0]);
    }
  }

  try {
    const coreP = callGroup(CORE_SCHEMA, 'core').then(r => {
      Object.entries(r).forEach(([section, content]) => sendEvent({ section, content }));
    });
    const detailP = callGroup(DETAIL_SCHEMA, 'detail').then(r => {
      Object.entries(r).forEach(([section, content]) => sendEvent({ section, content }));
    });
    await Promise.all([coreP, detailP]);
    sendEvent({ done: true });
    res.end();
  } catch (error) {
    console.error('[buy-wise/stream] error:', error);
    sendEvent({ error: 'Something went wrong. Please try again.' });
    res.end();
  }
});

// ════════════════════════════════════════════════════════════
// POST /buy-wise/budget — Budget mode
// ════════════════════════════════════════════════════════════
router.post('/buy-wise/budget', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { budget, category, needs, currency, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!budget || !category) {
      return res.status(400).json({ error: 'Please provide a budget and category' });
    }

    const sym = currency || '$';

    const systemPrompt = `${PERSONALITY}

BUDGET MODE: Best option within their budget. Use ${sym}. Specific product names and model numbers.

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`;

    const userPrompt = `BUDGET MODE:
Budget: ${sym}${budget}
Category: ${category}
${needs ? `What they need it for: ${needs}` : ''}

Recommend the best option(s) within this budget. Return ONLY valid JSON:

{
  "top_pick": {
    "product": "Specific product name with model if applicable — one sentence",
    "price": "${sym}X",
    "why": "Why this is the best option at this budget. Be specific. — one sentence",
    "where": "Where to buy it — one sentence"
  },
  "runner_up": {
    "product": "Second best option — one sentence",
    "price": "${sym}X",
    "why": "Why someone might prefer this over the top pick — one sentence",
    "where": "Where to buy it — one sentence"
  },
  "stretch_pick": {
    "product": "Worth spending 15-25% more for this — one sentence",
    "price": "${sym}X",
    "why": "What the extra money gets you. Is it worth it? — one sentence",
    "worth_the_stretch": "YES / MAYBE / NO — with one-sentence reason — one sentence"
  },
  "avoid": "What to specifically avoid at this price point. Name brands/models if applicable. — one sentence",
  "budget_verdict": "Is ${sym}${budget} a realistic budget for ${category}? What should they expect at this price point? — one sentence",
  "save_more_tip": "How to stretch the budget further (refurb, older model, sales, etc.) — one sentence"
}`;

    const msg = await withRetry(() => anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2500,
      system: withLanguage(systemPrompt, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: userPrompt }],
    }));
    const rawText = msg.content.find(i => i.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(rawText);
    let parsed; try { parsed = JSON.parse(cleaned); } catch (_) { const _m = cleaned.match(/\{[\s\S]*\}/); if (!_m) throw new Error('Response was not valid JSON'); parsed = JSON.parse(_m[0]); }
    if (!parsed.top_pick) {
      return res.status(500).json({ error: 'Could not analyze the budget. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('BuyWise budget error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.'});
  }
});

// ════════════════════════════════════════════════════════════
// POST /buy-wise/followup — Follow-up questions
// ════════════════════════════════════════════════════════════
router.post('/buy-wise/followup', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { product, question, originalVerdict, currency, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!product || !question) {
      return res.status(400).json({ error: 'Missing product or question' });
    }

    const sym = currency || '$';

    const systemPrompt = `${PERSONALITY}

Follow-up on a purchase being researched. Use ${sym}. Thorough but concise.

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`;

    const userPrompt = `The user is researching: ${product}
${originalVerdict ? `Original verdict: ${originalVerdict}` : ''}

Their follow-up question: "${question}"

Answer thoroughly. Return ONLY valid JSON:

{
  "answer": "Detailed, specific answer to their question. 3-5 sentences. Be practical and actionable.",
  "key_takeaway": "One bold sentence: the most important thing to know. — one sentence",
  "sources_to_check": ["1-2 specific places they can verify this info (YouTube channel, subreddit, review site, etc.)"]
}`;

    const msg = await withRetry(() => anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: withLanguage(systemPrompt, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: userPrompt }],
    }));
    const rawText = msg.content.find(i => i.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(rawText);
    let parsed; try { parsed = JSON.parse(cleaned); } catch (_) { const _m = cleaned.match(/\{[\s\S]*\}/); if (!_m) throw new Error('Response was not valid JSON'); parsed = JSON.parse(_m[0]); }
    if (!parsed.answer) {
      return res.status(500).json({ error: 'Could not answer your question. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('BuyWise followup error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.'});
  }
});

// ════════════════════════════════════════════════════════════
// POST /buy-wise/calendar — Deal season calendar
// ════════════════════════════════════════════════════════════
router.post('/buy-wise/calendar', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { category, currency, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!category) {
      return res.status(400).json({ error: 'Please specify a product category' });
    }

    const sym = currency || '$';

    const systemPrompt = `${PERSONALITY}

Deal calendar for this category. Best and worst times to buy. Use ${sym}. Specific sale events, not just months.

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`;

    const userPrompt = `DEAL CALENDAR for: ${category}

When is the best time to buy ${category}? Map out the full year. Return ONLY valid JSON:

{
  "category": "${category}",
  "best_month": "The single best month to buy, with reason — one sentence",
  "worst_month": "The worst month (highest prices), with reason — one sentence",
  "calendar": [
    {
      "month": "January — one sentence",
      "rating": "GREAT | GOOD | AVERAGE | BAD",
      "events": "Specific sale events this month (e.g., 'New Year sales, CES announcements drop last-gen prices') — one sentence",
      "typical_discount": "Typical % off or savings range — one sentence"
    }
  ],
  "pro_tips": [
    "3-4 insider tips for getting the best deal on ${category} (e.g., 'Buy last year's model right after new model announcements', 'Manufacturer refurb stores have the best deals in March')"
  ],
  "price_cycle": "Does this category have a predictable price cycle? Explain it. — one sentence"
}

Include all 12 months in the calendar array.`;

    const msg = await withRetry(() => anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 5000,
      system: withLanguage(systemPrompt, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: userPrompt }],
    }));
    const rawText = msg.content.find(i => i.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(rawText);
    let parsed; try { parsed = JSON.parse(cleaned); } catch (_) { const _m = cleaned.match(/\{[\s\S]*\}/); if (!_m) throw new Error('Response was not valid JSON'); parsed = JSON.parse(_m[0]); }
    if (!parsed.category) {
      return res.status(500).json({ error: 'Could not check the timing. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('BuyWise calendar error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.'});
  }
});

// ════════════════════════════════════════════════════════════
// POST /buy-wise/photo — Photo Mode: identify product from image
// ════════════════════════════════════════════════════════════
router.post('/buy-wise/photo', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { image, currency, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Please provide an image' });
    }

    const sym = currency || '$';

    const systemPrompt = `${PERSONALITY}

Identify this product from the image: brand, model, condition, market value, price fairness. Use ${sym}.

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`;

    const userPrompt = `Look at this product image and identify it. Return ONLY valid JSON:

{
  "identified": true,
  "product_name": "Full product name including brand and model if identifiable — 3-6 words",
  "confidence": "HIGH | MEDIUM | LOW — how confident you are in the identification",
  "condition": "New | Like New | Good | Fair | Poor — based on what's visible",
  "estimated_value": "${sym}X - ${sym}Y",
  "price_tag_visible": false,
  "price_tag_amount": null,
  "price_verdict": null,
  "quick_verdict": "One sentence: is this a good deal / fair price / overpriced?",
  "red_flags": ["Any visible issues: damage, counterfeits signs, missing parts, etc. Empty array if none."],
  "recommendation": "2-3 sentences of practical advice. What should they do?",
  "search_terms": "What to search online to compare prices for this exact item — one sentence"
}

If you cannot identify the product, set identified to false and explain in recommendation.`;

    const content = [
      {
        type: 'image',
        source: { type: 'base64', media_type: 'image/jpeg', data: image },
      },
      { type: 'text', text: userPrompt },
    ];

    const message = await withRetry(() => anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: withLanguage(systemPrompt, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content }],
    }));

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    if (!parsed.identified) {
      return res.status(500).json({ error: 'Could not analyze this item. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('BuyWise photo error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.'});
  }
});

// ════════════════════════════════════════════════════════════
// POST /buy-wise/convince — Convince My Partner mode
// ════════════════════════════════════════════════════════════
router.post('/buy-wise/convince', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { product, price, currency, direction, context, verdict, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!product) {
      return res.status(400).json({ error: 'Please specify the product' });
    }

    const sym = currency || '$';
    const forBuying = direction === 'for';

    const systemPrompt = `${PERSONALITY}

${forBuying ? 'Case FOR buying' : 'Case AGAINST buying'} to share with a partner. Persuasive but honest. Use ${sym}.

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`;

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
  "counter_argument": "The strongest argument the OTHER side would make, with your rebuttal. 2 sentences. — 1-2 sentences",
  "compromise": "A middle-ground option if full agreement isn't reached. 1-2 sentences.",
  "one_liner": "The single most persuasive sentence to close with — something they can text. — one sentence"
}`;

    const msg = await withRetry(() => anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2500,
      system: withLanguage(systemPrompt, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: userPrompt }],
    }));
    const rawText = msg.content.find(i => i.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(rawText);
    let parsed; try { parsed = JSON.parse(cleaned); } catch (_) { const _m = cleaned.match(/\{[\s\S]*\}/); if (!_m) throw new Error('Response was not valid JSON'); parsed = JSON.parse(_m[0]); }
    if (!parsed.headline) {
      return res.status(500).json({ error: 'Could not generate the case. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('BuyWise convince error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.'});
  }
});

// ════════════════════════════════════════════════════════════
// POST /buy-wise/haul — Haul Review: analyze multiple items
// ════════════════════════════════════════════════════════════
router.post('/buy-wise/haul', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { items, totalBudget, currency, occasion, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ error: 'Please add at least one item' });
    }

    const sym = currency || '$';

    const systemPrompt = `${PERSONALITY}

Review a shopping haul as a whole: redundancies, priorities, better alternatives, missing items. Use ${sym}.

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`;

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
  "haul_emoji": "Single emoji for the overall haul (one emoji)",
  "total_estimated": "${sym}${totalEstimate}",
  "items": [
    {
      "name": "Item name — 3-6 words",
      "verdict": "✅ KEEP | ⚠️ RECONSIDER | ❌ SKIP | 🔄 SWAP",
      "note": "Why — one sentence. Be specific.",
      "better_alternative": "null or a specific better option at similar price — one sentence"
    }
  ],
  "redundancies": ["Any items that overlap or duplicate function. null if none."],
  "missing": ["1-2 things they probably need but didn't include. null if the list is complete."],
  "priority_order": ["If they can only buy some items, which order? List item names from most to least important."],
  "budget_note": "${totalBudget ? `Are they within budget? What to cut if not?` : 'Is this total spend reasonable for what they are getting?'}",
  "save_tip": "One specific way to reduce the total spend without losing value — one sentence"
}`;

    const msg = await withRetry(() => anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 5000,
      system: withLanguage(systemPrompt, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: userPrompt }],
    }));
    const rawText = msg.content.find(i => i.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(rawText);
    let parsed; try { parsed = JSON.parse(cleaned); } catch (_) { const _m = cleaned.match(/\{[\s\S]*\}/); if (!_m) throw new Error('Response was not valid JSON'); parsed = JSON.parse(_m[0]); }
    if (!parsed.verdict || !Array.isArray(parsed.items)) {
      return res.status(500).json({ error: 'Could not analyze the haul. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('BuyWise haul error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.'});
  }
});

// ════════════════════════════════════════════════════════════
// POST /buy-wise/quote — Service/Contractor Quote Check
// ════════════════════════════════════════════════════════════
router.post('/buy-wise/quote', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { service, amount, details, location, urgency, currency, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!service || !service.trim()) {
      return res.status(400).json({ error: 'Please describe the service you were quoted for' });
    }

    const sym = currency || '$';
    const hasAmount = amount != null && amount > 0;

    const systemPrompt = `${PERSONALITY}

Evaluate a service quote or contractor estimate — not a product purchase.

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`;

    const userPrompt = `SERVICE QUOTE CHECK:
Service: ${service}
${hasAmount ? `Quoted amount: ${sym}${amount}` : 'No amount specified — provide typical range'}
${details ? `Quote details/line items: ${details}` : 'No details provided'}
${location ? `Location: ${location}` : 'Location not specified'}
Urgency: ${urgency === 'today' ? 'Emergency/urgent — they need this done ASAP' : urgency === 'this_week' ? 'Soon but not emergency' : 'Flexible timing — can shop around'}

Return ONLY valid JSON:

{
  "verdict": "One bold sentence: is this a fair quote? — one sentence",
  "verdict_emoji": "Single emoji (✅ 🟡 🚩 ⚠️ 💰 etc.) (one emoji)",
  "verdict_summary": "2-3 sentences explaining the assessment with key reasoning",

  "fair_range": {
    "range": "${sym}X - ${sym}Y typical range for this service",
    "what_drives_cost": "What makes this service more or less expensive (specifics, not generalities) (number)",
    "regional_note": "How location affects pricing for this service, or null if not applicable — one sentence"
  },

  "line_items": [
    {
      "item": "Line item or cost component name — one sentence",
      "amount": "${sym}X or null if not broken out",
      "verdict": "fair | high | low | red_flag | info",
      "note": "Why — one specific sentence — one sentence"
    }
  ],

  "negotiable": [
    {
      "item": "What can be negotiated — one sentence",
      "how_to_negotiate": "Specific tactic for THIS industry — one sentence",
      "typical_discount": "How much you can typically save, e.g. '10-15%' or '${sym}200-500' — one sentence"
    }
  ] or [],

  "red_flags": ["Specific warning signs in this quote. Empty array if clean."],

  "questions_to_ask": [
    "Exact question phrased as the customer would ask it — 5-8 questions"
  ],

  "timing_tip": "Is now a good or bad time to get this service done? Seasonal pricing patterns? null if not relevant. — one sentence",

  "competing_quotes": {
    "how_many": "How many quotes to get and why — one sentence",
    "where_to_look": "Specific places to find competing providers for THIS service — one sentence",
    "script": "Exact words to say when calling for a competing quote — including how to mention you have another quote without being pushy — 2-4 sentences"
  },

  "diy_option": "Could any part of this be done yourself to save money? Be honest — some things are dangerous or require licensing. null if DIY isn't realistic. — one sentence",

  "insurance_licensing": "What insurance, licensing, or certifications should this provider have? What to ask for. null if not applicable (e.g., tutoring). — one sentence",

  "bottom_line": "2-3 sentences: final recommendation. Be specific about what to do next."
}`;

    const msg = await withRetry(() => anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 5000,
      system: withLanguage(systemPrompt, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: userPrompt }],
    }));
    const rawText = msg.content.find(i => i.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(rawText);
    let parsed; try { parsed = JSON.parse(cleaned); } catch (_) { const _m = cleaned.match(/\{[\s\S]*\}/); if (!_m) throw new Error('Response was not valid JSON'); parsed = JSON.parse(_m[0]); }
    if (!parsed.verdict) {
      return res.status(500).json({ error: 'Could not analyze the quote. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('BuyWise quote error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.'});
  }
});

module.exports = router;
