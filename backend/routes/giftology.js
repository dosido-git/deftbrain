const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage } = require('../lib/claude');
const { rateLimit } = require('../lib/rateLimiter');

const PERSONALITY = `You are the friend who always gives impossibly thoughtful gifts — the ones that make people say "how did you KNOW?" You understand that great gifts aren't about price. They're about proving you pay attention. You connect small details about a person into gift ideas that feel personal, not algorithmic.

RULES:
- Every suggestion must connect to something SPECIFIC about the recipient — never generic "nice candle" suggestions
- Include the reasoning chain: what detail about them → what gift idea → why it lands
- Price ranges must be honest and realistic (include tax/shipping if relevant)
- Where to get it must be actionable: specific store, website, or "any [type of store]" — not "search online"
- The card message is critical — it should reference why you chose this specific gift, making a generic item feel intentional
- If the deadline is tight, prioritize things they can get TODAY (local stores, digital gifts, experiences)
- If budget is very low, lean into handmade, experiential, or "I noticed this about you" gifts that cost nothing
- Never suggest gift cards unless specifically asked — they're the opposite of thoughtful
- Read the relationship dynamics: a gift for your boss is different from a gift for your best friend`;

router.post('/giftology', rateLimit(), async (req, res) => {
  try {
    const {
      recipient,        // Who they are, what you know about them
      occasion,         // Birthday, holiday, thank you, just because, etc.
      budget,           // Price range or "any"
      deadline,         // How soon: today, this week, no rush
      alreadyGiven,     // Past gifts or things already considered
      avoid,            // Things to NOT get
      userLanguage,
    } = req.body;

    if (!recipient?.trim()) {
      return res.status(400).json({ error: 'Tell me about the person you\'re shopping for.' });
    }

    const userPrompt = `GIFT PANIC — HELP ME FIND THE PERFECT GIFT

WHO IS THIS PERSON:
"${recipient.trim()}"

OCCASION: ${occasion?.trim() || 'Not specified'}
BUDGET: ${budget?.trim() || 'Not specified'}
DEADLINE: ${deadline?.trim() || 'Not specified'}
${alreadyGiven?.trim() ? `ALREADY GIVEN/CONSIDERED: "${alreadyGiven.trim()}"` : ''}
${avoid?.trim() ? `AVOID THESE: "${avoid.trim()}"` : ''}

Find gifts that feel personal and thoughtful for THIS specific person. Not generic. Not algorithmic. Gifts that make them feel seen.

Return ONLY valid JSON:

{
  "situation_read": "1-2 sentences showing you understand the gift challenge — the person, the pressure, the constraints. Be warm, not clinical.",

  "perfect_picks": [
    {
      "gift": "Specific gift name — be precise (not 'a nice book' but 'Kitchen Confidential by Anthony Bourdain')",
      "price_range": "$XX - $XX",
      "why_its_perfect": "The reasoning chain: what you noticed about them → why this gift connects → the moment they'll have when they open it. 2-3 sentences.",
      "where_to_get": "Specific store, website, or type of shop. If deadline is tight, prioritize local/same-day options.",
      "presentation_tip": "How to wrap, present, or pair this to elevate it (e.g., 'wrap it in brown paper with a sprig of rosemary' or 'pair with a handwritten note about...')",
      "card_message": "What to write in the card — should reference why you chose THIS gift for THEM. Make a $20 gift feel like you spent weeks thinking about it."
    }
  ],

  "the_wildcard": {
    "gift": "One unexpected/creative option they'd never think of — experience, handmade, or something unusual",
    "price_range": "$XX - $XX",
    "why_its_perfect": "Why this unexpected choice actually nails it",
    "where_to_get": "How to make it happen",
    "card_message": "What to write"
  },

  "if_deadline_is_now": {
    "instant_option": "Something they can do/get TODAY — digital, local store, experiential, or handmade",
    "how": "Exact steps to make it happen in the next few hours",
    "card_message": "What to write to make a last-minute gift feel intentional"
  },

  "never_do_this": "One specific gift mistake to avoid for THIS person — the thing that seems safe but would actually land wrong. 1 sentence."
}

Provide 3-4 perfect_picks. Each should feel genuinely different — not 4 variations of the same idea.`;

    const parsed = await callClaudeWithRetry(userPrompt, {
      model: 'claude-sonnet-4-6',
      label: 'giftology',
      max_tokens: 3000,
      system: withLanguage(PERSONALITY, userLanguage),
    });
    res.json(parsed);

  } catch (error) {
    console.error('Giftology error:', error);
    res.status(500).json({ error: error.message || 'Gift search failed.' });
  }
});

module.exports = router;
