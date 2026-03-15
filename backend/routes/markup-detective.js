/* eslint-disable */
// Server-side only
// const express = require('express');
// const router = express.Router();
// Server-side only — not bundled by webpack
// const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

// ════════════════════════════════════════════════════════════
// POST /markup-detective — Price forensics for any product
// ════════════════════════════════════════════════════════════
router.post('/markup-detective', async (req, res) => {
  try {
    const { product } = req.body;

    if (!product?.trim()) {
      return res.status(400).json({ error: 'Describe a product or service to investigate' });
    }

    const systemPrompt = `You are a pricing forensics expert who reverse-engineers the true cost structure behind everyday products and services. You have deep knowledge of manufacturing economics, retail pricing psychology, supply chains, and industry margins across consumer goods, food & beverage, hospitality, healthcare, fashion, electronics, and more.

Your job is to break down exactly where a consumer's money goes when they buy something — not with vague percentages, but with specific dollar amounts and percentages that add up to the actual price paid (or a representative price if none is given).

Be specific and realistic. Your cost estimates should reflect real industry data:
- Coffee shop latte: ingredients ~$0.80-1.20, labor ~$1.50, rent/overhead ~$1.50, profit ~$1.50-2.00
- Hotel minibar item: wholesale cost is 3-5x retail, total markup 8-12x
- Pharmaceutical: production cost often <1% of price, R&D/marketing/profit make up the rest
- Fashion: manufacturing cost typically 10-20% of retail price
- Concert merchandise: blank shirt ~$4-6, printing ~$2-3, venue cut ~20-30%

PSYCHOLOGICAL PRICING TACTICS to identify:
- Charm pricing ($X.99)
- Anchoring (showing a higher "original" price)
- Bundle obscuring (hiding per-unit cost in packages)
- Scarcity/urgency signals
- Premium location pricing (airport, stadium, hospital)
- Decoy pricing (making one option look like a deal)
- Social proof pricing (implying "everyone pays this")
- Convenience premium (you pay for not having alternatives)

INDUSTRY SECRETS: Reveal insider knowledge consumers don't know — the things companies don't advertise about their pricing structure.

HOW TO PAY LESS: Specific, actionable tactics for this exact product/service — not generic "shop around" advice.`;

    const userPrompt = `Investigate the pricing of: ${product.trim()}

Return ONLY valid JSON with this exact structure:

{
  "product_identified": "What you understood the product/service to be",
  "price_paid": "The price mentioned or a representative retail price (e.g. '$6.00')",
  "true_cost": "What this actually costs to produce/provide (e.g. '$0.85')",
  "fair_price": "What a fair, non-exploitative price would be (e.g. '$2.50')",
  "markup_multiplier": "How many times over cost the consumer pays, as a number (e.g. 7.1)",
  "one_line_verdict": "One punchy sentence summing up the pricing situation",
  "cost_breakdown": [
    {
      "label": "Category name (e.g. 'Raw materials', 'Labor', 'Rent & overhead', 'Marketing', 'Brand premium', 'Profit margin')",
      "amount": "Dollar amount (e.g. '$0.85')",
      "percent": "Percentage of total price as a number without % sign (e.g. 14)"
    }
  ],
  "psychological_tactics": [
    "Specific tactic being used, explained concretely for this product"
  ],
  "industry_secrets": [
    "Insider fact about how this industry actually prices its products"
  ],
  "how_to_pay_less": [
    "Specific, actionable tip for paying less for this exact thing"
  ]
}

Rules:
- cost_breakdown items must sum to 100% and add up to the price_paid
- markup_multiplier should be price_paid divided by true_cost (rounded to 1 decimal)
- Include 4-6 cost_breakdown items
- Include 2-4 psychological_tactics
- Include 2-3 industry_secrets  
- Include 3-5 how_to_pay_less tips
- Be specific with dollar amounts, not ranges
- how_to_pay_less must be actionable for this specific item, not generic advice`;

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1200,
      messages: [{ role: 'user', content: userPrompt }],
      system: systemPrompt,
    });

    const raw = response.content[0]?.text || '';
    const data = JSON.parse(cleanJsonResponse(raw));

    // Validate required fields
    if (!data.cost_breakdown?.length || !data.markup_multiplier) {
      return res.status(500).json({ error: 'Incomplete analysis returned. Please try again.' });
    }

    return res.json(data);

  } catch (err) {
    console.error('markup-detective error:', err);
    if (err instanceof SyntaxError) {
      return res.status(500).json({ error: 'Failed to parse pricing analysis. Please try again.' });
    }
    return res.status(500).json({ error: err.message || 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
