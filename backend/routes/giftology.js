const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

const PERSONALITY = `The friend who always gives impossibly thoughtful gifts. Great gifts aren't about price — they prove you pay attention. Connect specific details about the person into ideas that feel personal, not algorithmic.

RULES: Every suggestion must tie to something SPECIFIC about the recipient. Include the reasoning chain: what detail → what gift → why it lands. Price ranges must be realistic. Where to get it must be actionable (specific store/site, not "search online"). Card message should reference why you chose this. Tight deadline: prioritize local stores or digital gifts. Low budget: handmade or experiential. Never suggest gift cards unless asked.`;

router.post('/giftology', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const {
      recipient,        // Who they are, what you know about them
      occasion,         // Birthday, holiday, thank you, just because, etc.
      budget,           // Price range or "any"
      deadline,         // How soon: today, this week, no rush
      alreadyGiven,     // Past gifts or things already considered
      avoid,            // Things to NOT get
      userLanguage,
      userLocale, userCurrency, userRegion,
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
      "price_range": "a realistic low–high price range in the user's local currency",
      "why_its_perfect": "The reasoning chain: what you noticed about them → why this gift connects → the moment they'll have when they open it. 2-3 sentences.",
      "where_to_get": "Specific store, website, or type of shop. If deadline is tight, prioritize local/same-day options.",
      "presentation_tip": "How to wrap, present, or pair this to elevate it (e.g., 'wrap it in brown paper with a sprig of rosemary' or 'pair with a handwritten note about...')",
      "card_message": "What to write in the card — should reference why you chose THIS gift for THEM. Make an inexpensive gift feel like you spent weeks thinking about it. — 2-4 sentences"
    }
  ],

  "the_wildcard": {
    "gift": "One unexpected/creative option they'd never think of — experience, handmade, or something unusual. The wildcard MUST still respect every stated avoid/dislike and must not contradict never_do_this",
    "price_range": "a realistic low–high price range in the user's local currency",
    "why_its_perfect": "Why this unexpected choice actually nails it",
    "where_to_get": "How to make it happen",
    "card_message": "What to write — 2-4 sentences"
  },

  "if_deadline_is_now": {
    "instant_option": "Something they can do/get TODAY — digital, local store, experiential, or handmade",
    "how": "Exact steps to make it happen in the next few hours",
    "card_message": "What to write to make a last-minute gift feel intentional — 2-4 sentences"
  },

  "never_do_this": "One specific gift mistake to avoid for THIS person — the thing that seems safe but would actually land wrong."
}

Provide EXACTLY 3-4 perfect_picks. Each should feel genuinely different — not 4 variations of the same idea.
price_range values must be in the user's local currency (never assume US dollars). Keep every field within its stated length — be concise, no padding.`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 3500,
      system: withLanguage(PERSONALITY, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'giftology' });
    if (!parsed.perfect_picks && !parsed.gifts) {
      return res.status(500).json({ error: 'Could not generate gift ideas. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('Giftology error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
