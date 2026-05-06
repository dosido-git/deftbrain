const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');
const { rateLimit } = require('../lib/rateLimiter');

router.post('/subscription-guilt-trip', rateLimit(), async (req, res) => {
  try {
    const { subscriptions, transactionText, inputType } = req.body;

    if (inputType === 'manual') {
      if (!subscriptions || subscriptions.length === 0) {
        return res.status(400).json({ error: 'Please list at least one subscription' });
      }
    } else if (inputType === 'text') {
      if (!transactionText || !transactionText.trim()) {
        return res.status(400).json({ error: 'Please provide transaction data' });
      }
    } else {
      return res.status(400).json({ error: 'Invalid input type' });
    }

    const inputBlock = inputType === 'manual'
      ? `SUBSCRIPTIONS PROVIDED BY USER:\n${JSON.stringify(subscriptions, null, 2)}`
      : `RAW TRANSACTION DATA (identify recurring subscription charges from this):\n${transactionText}`;

    const prompt = `You are a financial pattern analyst specializing in subscription identification and auditing. You help people with ADHD and subscription fatigue identify forgotten or underused recurring charges and cancel them guilt-free.

${inputBlock}

TASK:
1. ${inputType === 'text' ? 'First, identify all recurring subscription charges from the transaction data. Look for same merchant names (even with slight variations like "NETFLIX.COM" vs "Netflix Subscription"), similar amounts at regular intervals (monthly, quarterly, annual).' : 'Analyze each subscription based on cost and stated usage.'}
2. Calculate cost-per-use for each subscription.
3. Assign a waste_likelihood score (0-100) based on:
   - 90-100%: No activity for 3+ months, or similar redundant services detected
   - 50-89%: Infrequent usage relative to cost
   - 0-49%: Regular usage suggesting active value
4. Give a verdict: "keep", "cancel", or "downgrade"
5. For cancellations, provide:
   - Step-by-step cancellation instructions
   - Common retention tactics the company uses
   - An exact script to say/type when canceling
   - A professional cancellation email template
   - A guilt-free reframing statement
6. Calculate total potential savings

EDGE CASES:
- Annual subscriptions: calculate monthly equivalent
- Variable amounts: flag for manual review
- Refunds/credits: do not count as subscriptions
- Multiple subscriptions to same service: group together

OUTPUT (JSON only, no markdown, no preamble):
{
  "total_monthly_cost": "$XX.XX",
  "annual_cost": "$XXX.XX",
  "estimated_waste_monthly": "$XX.XX",
  "estimated_waste_annual": "$XXX.XX",
  "subscriptions_analyzed": [
    {
      "name": "Service Name",
      "monthly_cost": "$XX.XX",
      "annual_cost": "$XXX.XX",
      "category": "streaming|fitness|software|news|gaming|food|music|cloud|productivity|other",
      "actual_usage": "description of usage",
      "cost_per_use": "$X.XX per use",
      "waste_likelihood": 75,
      "verdict": "keep|cancel|downgrade",
      "reasoning": "why this verdict",
      "alternatives": "free or cheaper alternatives if applicable"
    }
  ],
  "recommended_cancellations": [
    {
      "name": "Service Name",
      "monthly_savings": "$XX.XX",
      "annual_savings": "$XXX.XX",
      "cancellation_difficulty": "easy|medium|hard",
      "how_to_cancel": "step by step instructions",
      "retention_tactics_to_expect": ["tactic1", "tactic2"],
      "cancellation_script": "exact words to say when canceling by phone or chat",
      "cancellation_email": "Subject: Subscription Cancellation Request - [Service]\\n\\nHello [Service] Support,\\n\\nI would like to cancel my subscription effective immediately...\\n\\nThank you,\\n[Your Name]",
      "guilt_free_framing": "reassuring statement about why it's okay to cancel"
    }
  ],
  "keep_these": [
    {
      "name": "Service Name",
      "why": "justification for keeping"
    }
  ],
  "total_savings_if_cancel_recommended": {
    "monthly": "$XX.XX",
    "annual": "$XXX.XX",
    "what_you_could_buy_instead": "fun comparison"
  },
  "permission_statements": [
    "Reassuring statement 1",
    "Reassuring statement 2",
    "Reassuring statement 3"
  ]
}

IMPORTANT:
- Be conservative with waste scoring — don't flag active subscriptions
- Generate polite, professional cancellation emails with Subject line included
- Make cancellation scripts assertive but kind
- Permission statements should genuinely help people who feel guilty about canceling
- Make the "what you could buy instead" comparison fun and motivating
- All dollar amounts should include the $ sign
- waste_likelihood must be an integer 0-100
Return ONLY valid JSON.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      messages: [{ role: 'user', content: withLanguage(prompt, userLanguage) }]
    });

    const textContent = message.content.find(item => item.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(textContent);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);
  } catch (error) {
    console.error('Subscription Guilt Trip error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
