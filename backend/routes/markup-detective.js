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
    const { product, motive, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!product?.trim()) {
      return res.status(400).json({ error: 'Describe a product or service to investigate' });
    }

    const MOTIVE_STEER = {
      overpriced: 'They already suspect this is overpriced. Confirm or correct that plainly, and be specific about which part of the price is doing the damage — vindication without a number is not useful.',
      deciding:   'They have not bought it yet. Say what the price actually buys and what it does not, so the decision is easier — not what a purchase would say about them.',
      curious:    'They are reading for interest, not about to spend. Lead with what is genuinely surprising about how this is priced rather than with how to pay less.',
      negotiate:  'They intend to negotiate. Say where the real slack sits, what the seller can and cannot move on, and what a reasonable ask sounds like out loud.',
      unfair:     'They feel taken advantage of. Take that seriously and answer it honestly, in either direction — sometimes the price is ordinary and the relief is knowing that. Where the pricing IS designed to exploit an unequal position, say so plainly and say what recourse exists.',
    };
    const motiveNote = motive && MOTIVE_STEER[motive]
      ? `\n\nWHY THEY ARE ASKING: ${MOTIVE_STEER[motive]}`
      : '';

    const systemPrompt = `Pricing forensics expert. Reverse-engineer the true cost structure of products and services. Break down where money goes with specific amounts (in the user's local currency) that sum to the actual price — not vague percentages. Use real industry data (e.g. for a coffee: ingredients a small share, labor and rent larger, profit a healthy slice). Identify psychological pricing tactics, reveal insider facts consumers don't know, give specific tactics to pay less. ARITHMETIC TIES: true_cost and fair_price must reconcile with the breakdown subtotals (fair_price ≥ implied full cost unless you explain the discount inline).

Return ONLY valid JSON. Never place a double-quote (") character inside any JSON string value — write quoted phrases or product names plainly or with single quotes, or it breaks the JSON.`;

    const userPrompt = `Investigate the pricing of: ${product.trim()}

Return ONLY valid JSON with this exact structure:

{
  "product_identified": "What you understood the product/service to be",
  "price_paid": "The price mentioned or a representative retail price, formatted in the user's local currency (e.g. a coffee ~6 units)",
  "true_cost": "Roughly what it costs to make or provide one of these — an outside estimate, so give a round number rather than a suspiciously exact one. In the user's local currency.",
  "fair_price": "What this same item typically costs somewhere ordinary — the usual retail or online price away from this particular venue, channel or moment. A COMPARISON, not a verdict on what the reader ought to pay: report what the thing goes for elsewhere and let them decide whether being here was worth the difference. In the user's local currency.",
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
    {
      "name": "What the technique is called, in plain words a person would repeat — 'paying for the walk you did not take', 'the middle option that exists to be rejected'. Not a textbook term.",
      "how_it_works": "How it is being used on THIS product specifically, and what it is worth to the seller — one or two sentences"
    }
  ],
  "industry_secrets": [
    "Something true about how this industry sets prices that an outsider would not know — a norm, a margin convention, a structural reason. State it as a fact about the trade, not as a revelation somebody is hiding."
  ],
  "how_to_pay_less": [
    "Specific, actionable tip for paying less for this exact thing"
  ]
}

Rules:
- cost_breakdown items must sum to 100% and add up to the price_paid
- markup_multiplier should be price_paid divided by true_cost (rounded to 1 decimal)
- Include 4-6 cost_breakdown items
- Include 3-5 psychological_tactics. This is the part people remember and repeat, so give it real attention: convenience, scarcity, prestige, brand signalling, anchoring, emotional and situational pricing. Materials and labour explain where the money went; these explain why the number worked on someone. Describe the mechanism, not a wrongdoing. People pay premiums willingly all the time — for the seat, the timing, the occasion — and a technique that works is not by itself a trick. Explain why the price lands, and leave whether it was worth it to the reader.
- Include 2-3 industry_secrets  
- Include 3-5 how_to_pay_less tips
- Be specific with amounts (in the user's local currency), not ranges
- markup_multiplier and each cost_breakdown.percent must be BARE NUMBERS (e.g. 7.1 and 14), NOT strings and NOT with a % sign — they are rendered as a numeric multiplier and a bar width
- all amount fields (price_paid, true_cost, fair_price, cost_breakdown.amount) are short currency strings in the user's local currency (never assume US dollars)
- how_to_pay_less must be actionable for this specific item, not generic advice${motiveNote}`;

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
