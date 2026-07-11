const express = require('express');
const router = express.Router();
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

// ════════════════════════════════════════════════════════════
// POST /upsell-shield — Walk In Prepared
// ════════════════════════════════════════════════════════════
router.post('/upsell-shield', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { situation, whatYouWant, budget, concerns, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!situation?.trim()) {
      return res.status(400).json({ error: 'Tell us the sales situation you\'re walking into.' });
    }

    const systemPrompt = `You are a consumer defense strategist — part behavioral psychologist, part ex-salesperson, part negotiation coach. When someone is about to walk into a high-pressure sales situation, you arm them with the exact tactics they'll face and the counter-moves that neutralize each one.`;

    const userPrompt = `THE SITUATION: ${situation}
${whatYouWant ? `WHAT I ACTUALLY WANT: ${whatYouWant}` : ''}
${budget ? `MY BUDGET: ${budget}` : ''}
${concerns ? `MY CONCERNS: ${concerns}` : ''}

Prepare me. Return ONLY valid JSON:
{
  "situation_read": "1-2 sentences showing you understand the power dynamic they're walking into.",

  "their_playbook": [
    {
      "tactic_name": "The specific name of the sales tactic — 3-6 words",
      "what_they_do": "Exactly how they'll deploy this tactic in THIS situation. Be specific. — one sentence",
      "the_psychology": "Why this works on most people — the cognitive bias being exploited. — one sentence",
      "your_counter": "The exact words or action to neutralize this tactic. Ready to use. — one sentence",
      "when_to_expect": "At what point in the interaction this tactic typically appears. — one sentence"
    }
  ],

  "power_questions": [
    {
      "question": "The exact question to ask — one sentence",
      "what_it_signals": "What this communicates to the salesperson about your sophistication — one sentence"
    }
  ],

  "walk_away_line": "One rehearsed sentence that ends the conversation cleanly. Firm but not hostile. — one sentence",

  "the_real_deal": {
    "actual_margins": "What the seller's real margin is on this type of sale. — one sentence",
    "whats_negotiable": "What can actually be negotiated in this situation. — one sentence",
    "insider_price": "What an industry insider would pay or negotiate for. (number)",
    "timing_advantage": "When in the month/quarter/year you have the most leverage. — one sentence"
  },

  "pre_visit_checklist": [
    "4-5 specific things to do BEFORE walking in — research, documents to bring, phone numbers to have ready."
  ],

  "body_language": [
    "3-4 non-verbal tips specific to this sales environment."
  ],

  "the_nuclear_option": "If they absolutely won't budge and you feel pressured, this is the most aggressive consumer power move available to you. Legal, ethical, but maximum leverage. — one sentence"
}

Generate 5-7 tactics in their playbook and 4-5 power questions.`;

    const parsed = await callClaudeWithRetry({
model: MODELS.SMART,
      max_tokens: 3750,
      system: withLanguage(systemPrompt, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'upsell-shield' });
    if (!parsed.situation_read || !Array.isArray(parsed.their_playbook)) {
      return res.status(500).json({ error: 'Could not build your shield. Please try again.' });
    }
    return res.json(parsed);

  } catch (error) {
    console.error('UpsellShield error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.'});
  }
});

module.exports = router;
