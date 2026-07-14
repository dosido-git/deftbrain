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
      "tactic_name": "The specific name of the sales tactic",
      "what_they_do": "Exactly how they'll deploy this tactic in THIS situation. Be specific.",
      "the_psychology": "Why this works on most people — the cognitive bias being exploited.",
      "your_counter": "The exact words or action to neutralize this tactic. Ready to use.",
      "when_to_expect": "At what point in the interaction this tactic typically appears."
    }
  ],

  "power_questions": [
    {
      "question": "The exact question to ask",
      "what_it_signals": "What this communicates to the salesperson about your sophistication"
    }
  ],

  "walk_away_line": "One rehearsed sentence that ends the conversation cleanly. Firm but not hostile.",

  "the_real_deal": {
    "actual_margins": "What the seller's real margin is on this type of sale.",
    "whats_negotiable": "What can actually be negotiated in this situation.",
    "insider_price": "What an industry insider would pay or negotiate for, expressed in the user's local currency — never assume US dollars.",
    "timing_advantage": "When in the month/quarter/year you have the most leverage."
  },

  "pre_visit_checklist": [
    "4-5 specific things to do BEFORE walking in — research, documents to bring, phone numbers to have ready."
  ],

  "body_language": [
    "3-4 non-verbal tips specific to this sales environment."
  ],

  "the_nuclear_option": "If they absolutely won't budge and you feel pressured, this is the most aggressive consumer power move available to you. Legal, ethical, but maximum leverage."
}

RULES:
1. Generate 5 tactics in their_playbook (at most 5) and 4 power_questions (at most 4).
2. Keep every field to one tight sentence.
3. Never place a double-quote (") character inside any JSON string value — write rehearsed scripts and questions plainly with no inner quote marks, or it breaks the JSON.`;

    const parsed = await callClaudeWithRetry({
model: MODELS.SMART,
      max_tokens: 4500,
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
