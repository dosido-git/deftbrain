const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

router.post('/buy-wise', async (req, res) => {
  try {
    const { product, price, currency, urgency, isImpulse, priority, context, comparison, userLanguage } = req.body;

    if (!product || !product.trim()) {
      return res.status(400).json({ error: 'Please enter what you want to buy' });
    }

    const sym = currency || '$';
    const hasPrice = price != null && price > 0;
    const hasComparison = comparison && comparison.product;

    const systemPrompt = `You are a brutally honest pre-purchase research assistant. You give people the advice a knowledgeable friend would give — specific, opinionated, and practical. Not a coupon blog. Not a generic "do your research." You tell them exactly what they need to know.

YOUR PERSONALITY:
- Talk like a friend who happens to be weirdly knowledgeable about shopping
- Be specific: "Check the manufacturer's refurb store" not "shop around"
- Be honest: "You probably don't need this" when true
- Use the user's currency (${sym}) for ALL prices and estimates
- Calibrate prices to realistic market rates — a mixer in Tokyo costs differently than in Ohio
- When you don't know exact current prices, say "typically" or "around" — never fabricate specific prices with false precision

YOUR RULES:
- Every section must contain specific, actionable information — no filler
- If a section doesn't apply to this product, return null for that section (don't force it)
- Negotiation only applies to products where haggling is realistic (cars, furniture, services, electronics at independent stores, rent, medical bills) — NOT for standard retail
- Buy vs Subscribe vs Rent only when subscription or rental models actually exist for this product
- Quality tier advice should be category-specific: some categories reward premium (mattresses, shoes, cookware), others don't (HDMI cables, basic tools)
- Be culturally aware of where the user might be based on their currency`;

    let userPrompt = `RESEARCH THIS PURCHASE:
Product: ${product}
${hasPrice ? `Price seen: ${sym}${price}` : 'No price specified — estimate typical range'}
Currency: ${sym}
Urgency: ${urgency === 'today' ? 'Need it today — skip "wait for sale" advice, focus on best price NOW' : urgency === 'this_week' ? 'This week — mention upcoming sales only if imminent' : 'Flexible timing — include sale calendar and wait recommendations'}
Priority: ${priority} (weight your advice toward this)
${isImpulse ? 'USER FLAGGED THIS AS IMPULSE BUY — include impulse_check section with honest evaluation' : ''}
${context ? `Additional context: ${context}` : ''}
${hasComparison ? `\nCOMPARISON REQUESTED: "${product}" vs "${comparison.product}"${comparison.price ? ` (${sym}${comparison.price})` : ''}` : ''}

Return ONLY valid JSON. Include ALL applicable sections. Set sections to null if they don't apply.

{
  "verdict": "One bold sentence: the overall recommendation (e.g., 'Buy it, but not at that price.', 'Skip it. Here's why.', 'Great purchase — but wait 3 weeks.')",
  "verdict_emoji": "Single emoji summarizing the verdict (👍 🟡 🛑 ⏳ ✅ etc.)",
  "verdict_summary": "2-3 sentences expanding on the verdict with the key reasoning"${isImpulse ? `,

  "impulse_check": {
    "do_you_need_it": "Honest answer: do they actually need this or is it a want? Be specific to the product and their context.",
    "what_else_could_you_do": "What else could this money buy? Be specific and vivid. '${hasPrice ? `${sym}${price}` : 'That amount'} is also [concrete alternatives].'",
    "already_own_something": "Could something they likely already own do this job? Be honest — sometimes the answer is no.",
    "wait_recommendation": "Specific recommendation: 'Add it to a wishlist and revisit in 48 hours. If you still want it, buy it guilt-free.'"
  }` : `,"impulse_check": null`},

  "fair_price": {
    "verdict_badge": "GOOD PRICE | FAIR PRICE | HIGH | OVERPAYING | CHECK",
    "analysis": "Is this a good price? What do these typically sell for? Where are they cheapest? Be specific with price ranges in ${sym}.",
    "typical_range": "${sym}X - ${sym}Y for [condition: new/used/refurb]",
    "where_to_find_cheaper": "Specific platform or strategy to get a better price. Not 'shop around' — name the place."
  },

  "timing": ${urgency === 'today' ? 'null' : `{
    "verdict_badge": "BUY NOW | WAIT | GOOD TIME",
    "analysis": "Is now a good time to buy this? What's the product release cycle? Any upcoming sales?",
    "next_sale": "Specific sale event and approximate date (e.g., 'Amazon Prime Day in July', 'Black Friday', 'End of model year clearance in September'). null if nothing upcoming.",
    "price_cycle_note": "Does this product have a known price cycle? (e.g., 'New iPhones launch in Sep, last-gen drops 20-30%')"
  }`},

  "total_cost": {
    "summary": "What will this ACTUALLY cost over time? Include consumables, maintenance, accessories, and hidden costs. Be specific.",
    "breakdown": [
      {"item": "Purchase price", "cost": "${sym}X"},
      {"item": "Essential accessory/consumable", "cost": "${sym}Y/year"},
      {"item": "Maintenance or replacement part", "cost": "${sym}Z over N years"}
    ],
    "year_1_total": "${sym}X (purchase + first year costs)",
    "year_5_total": "${sym}X (if applicable — skip for short-life products)"
  },

  "cheaper_alternative": {
    "suggestion": "A specific cheaper product that does 80-95% of the same job. Name the product, not just the category. Include approximate price.",
    "tradeoffs": "What you give up with the cheaper option. Be honest — sometimes the premium is worth it.",
    "refurbished_tip": "Can this be bought refurbished or open-box? Where? Typical savings? null if not applicable."
  },

  "buy_vs_subscribe": ${`null if no subscription or rental model exists for this product, otherwise: {
    "analysis": "Compare buying outright vs subscribing vs renting. Include real prices.",
    "breakeven": "At what point does buying become cheaper than subscribing? Be specific: 'If you'll use it for more than X months, buy.'",
    "recommendation": "Clear recommendation based on their context."
  }`},

  "quality_tier": {
    "recommended_tier": "Budget | Mid-Range | Premium",
    "analysis": "Is this a category where spending more actually matters? Be specific about WHY premium helps or doesn't.",
    "spend_vs_save": "One sentence: 'This is a category where [spending more / saving money] makes sense because [reason].'"
  },

  "regret_predictor": {
    "common_regrets": "What do people who buy this most commonly regret? Be specific to this product category.",
    "usage_reality": "How much do people actually use this after buying? 'People who buy X typically use it Y times in the first year.' Be honest.",
    "avoid_regret_tip": "One specific thing to check or consider before buying to avoid the most common regret."
  },

  "watch_out": [
    "2-4 specific gotchas, hidden costs, or things that commonly surprise buyers. Not generic warnings — product-specific.",
    "e.g., 'This laptop has soldered RAM — you can't upgrade later'",
    "e.g., 'The base model doesn't include the X feature shown in ads — that's the Y model'"
  ],

  "negotiation": ${`null unless haggling is realistic for this product (cars, furniture, services, independent stores, rent, medical bills). If applicable: {
    "context": "Is negotiation realistic here? What's the typical margin?",
    "script": "Exact words to say to negotiate. Be specific: 'I've seen this for [price] at [competitor]. Can you match that?'",
    "leverage_points": ["Specific leverage: time of year, competitor prices, bulk, loyalty, etc."]
  }`}${hasComparison ? `,

  "comparison": {
    "winner": "Product A | Product B | It depends",
    "analysis": "Detailed comparison. Not just specs — practical differences that matter day-to-day.",
    "for_your_priority": "Based on the user's stated priority (${priority}), which one wins and why?",
    "pros_a": ["2-3 specific advantages of ${product}"],
    "pros_b": ["2-3 specific advantages of ${comparison.product}"]
  }` : ''},

  "where_to_buy": [
    {
      "platform": "Specific store or platform name",
      "why": "Why this platform is good for this specific product (best price, best warranty, best return policy, etc.)"
    }
  ],

  "bottom_line": "2-3 sentences. The friend-level honest summary. What would you tell them over a beer? End with a clear action step."
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3500,
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

module.exports = router;
