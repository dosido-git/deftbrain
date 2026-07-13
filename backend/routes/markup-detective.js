/* eslint-disable */
// Server-side only
const express = require('express');
const router = express.Router();
// Server-side only — not bundled by webpack
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit } = require('../lib/rateLimiter');

// ════════════════════════════════════════════════════════════
// POST /markup-detective — Price forensics for any product
// ════════════════════════════════════════════════════════════
router.post('/markup-detective', rateLimit(), async (req, res) => {
  try {
    const { product, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!product?.trim()) {
      return res.status(400).json({ error: 'Describe a product or service to investigate' });
    }

    const systemPrompt = `Pricing forensics expert. Reverse-engineer the true cost structure of products and services. Break down where money goes with specific amounts (in the user's local currency) that sum to the actual price — not vague percentages. Use real industry data (e.g. for a coffee: ingredients a small share, labor and rent larger, profit a healthy slice). Identify psychological pricing tactics, reveal insider facts consumers don't know, give specific tactics to pay less. Return ONLY valid JSON.`;

    const userPrompt = `Investigate the pricing of: ${product.trim()}

Return ONLY valid JSON with this exact structure:

{
  "product_identified": "What you understood the product/service to be",
  "price_paid": "The price mentioned or a representative retail price, formatted in the user's local currency (e.g. a coffee ~6 units)",
  "true_cost": "What this actually costs to produce/provide, in the user's local currency",
  "fair_price": "What a fair, non-exploitative price would be, in the user's local currency",
  "markup_multiplier": 7.1,
  "one_line_verdict": "One punchy sentence summing up the pricing situation",
  "cost_breakdown": [
    {
      "label": "Category name (e.g. 'Raw materials', 'Labor', 'Rent & overhead', 'Marketing', 'Brand premium', 'Profit margin')",
      "amount": "This category's cost, in the user's local currency",
      "percent": 14
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
- Be specific with amounts (in the user's local currency), not ranges
- markup_multiplier and each cost_breakdown.percent must be BARE NUMBERS (e.g. 7.1 and 14), NOT strings and NOT with a % sign — they are rendered as a numeric multiplier and a bar width
- all amount fields (price_paid, true_cost, fair_price, cost_breakdown.amount) are short currency strings in the user's local currency (never assume US dollars)
- how_to_pay_less must be actionable for this specific item, not generic advice`;

    const data = await callClaudeWithRetry({
      model: MODELS.DEEP,
      max_tokens: 2500,
      system: systemPrompt + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: withLanguage(userPrompt, userLanguage) }],
    }, { label: 'markup-detective' });

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
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
