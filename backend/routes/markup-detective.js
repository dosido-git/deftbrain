/* eslint-disable */
// Server-side only
const express = require('express');
const router = express.Router();
// Server-side only — not bundled by webpack
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
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

    const systemPrompt = `Pricing forensics expert. Reverse-engineer the true cost structure of products and services. Break down where money goes with specific dollar amounts that sum to the actual price — not vague percentages. Use real industry data (e.g. coffee ingredients ~$1, labor ~$1.50, rent ~$1.50, profit ~$1.50). Identify psychological pricing tactics, reveal insider facts consumers don't know, give specific tactics to pay less. Return ONLY valid JSON.`;

    const userPrompt = `Investigate the pricing of: ${product.trim()}

Return ONLY valid JSON with this exact structure:

{
  "product_identified": "What you understood the product/service to be — one sentence",
  "price_paid": "The price mentioned or a representative retail price (e.g. '$6.00') — one sentence",
  "true_cost": "What this actually costs to produce/provide (e.g. '$0.85') (number)",
  "fair_price": "What a fair, non-exploitative price would be (e.g. '$2.50') (number)",
  "markup_multiplier": "How many times over cost the consumer pays, as a number (e.g. 7.1) — one sentence",
  "one_line_verdict": "One punchy sentence summing up the pricing situation — one sentence",
  "cost_breakdown": [
    {
      "label": "Category name (e.g. 'Raw materials', 'Labor', 'Rent & overhead', 'Marketing', 'Brand premium', 'Profit margin') — one sentence",
      "amount": "Dollar amount (e.g. '$0.85') (number)",
      "percent": "Percentage of total price as a number without % sign (e.g. 14) — one sentence"
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

    const data = await callClaudeWithRetry({
      model: 'claude-opus-4-7',
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
