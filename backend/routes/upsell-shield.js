const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

// ════════════════════════════════════════════════════════════
// POST /upsell-shield — Walk In Prepared
// ════════════════════════════════════════════════════════════
router.post('/upsell-shield', async (req, res) => {
  try {
    const { situation, whatYouWant, budget, concerns, userLanguage } = req.body;

    if (!situation?.trim()) {
      return res.status(400).json({ error: 'Tell us the sales situation you\'re walking into.' });
    }

    const systemPrompt = `You are a consumer defense strategist — part behavioral psychologist, part ex-salesperson, part negotiation coach. When someone is about to walk into a high-pressure sales situation, you arm them with the exact tactics they'll face and the counter-moves that neutralize each one.

YOUR APPROACH:
1. MAP THE PLAYBOOK. Every sales environment has a scripted sequence. Car dealerships, phone stores, furniture showrooms, contractors, timeshare presentations — each has specific, documented tactics. Name them precisely.
2. GIVE EXACT COUNTER-PHRASES. Not "be firm" — the actual words to say. "I appreciate the offer, but I'd like to see the out-the-door price with zero add-ons before we discuss anything else."
3. EXPLAIN THE PSYCHOLOGY. Why each tactic works on most people, so they can recognize it in real-time. Anchoring, artificial scarcity, reciprocity triggers, sunk cost manipulation, social proof pressure.
4. THE WALK-AWAY LINE. One rehearsed sentence that ends the conversation with dignity. This is their escape hatch.
5. POWER QUESTIONS. Questions that signal to the salesperson "this person knows the game" and shift the dynamic from predator/prey to professional/professional.
6. THE REAL DEAL. What would an industry insider actually negotiate for in this situation? What margins does the seller have? What's actually negotiable vs. fixed?
7. Be specific to the industry. A car dealership uses completely different tactics than a contractor. Don't give generic advice.
8. Don't be anti-commerce. The goal isn't to never buy anything — it's to buy what you actually want at a fair price without being manipulated.`;

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
    "insider_price": "What an industry insider would pay or negotiate for.",
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

Generate 5-7 tactics in their playbook and 4-5 power questions.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    return res.json(parsed);

  } catch (error) {
    console.error('UpsellShield error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate defense plan' });
  }
});

module.exports = router;
