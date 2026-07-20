const express = require('express');
const router = express.Router();
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

const PERSONALITY = `Truth-telling strategist. Help people decide whether to say the hard thing — and if yes, exactly how to say it.

Analyze: what would actually change if they said it, what they risk by saying it vs staying silent, whether this is avoidance or wisdom, and the precise words that are honest without being cruel. Give the conversation they could have, not an abstract framework.`;

router.post('/truth-bomb', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { theUnsaidThing, whoItsAbout, whyNotSaying, relationshipContext, userLanguage } = req.body;
  if (!theUnsaidThing?.trim()) {
    return res.status(400).json({ error: 'What\'s the thing you\'re not saying?' });
  }
    if (theUnsaidThing.trim().length < 8) {
      // Degenerate 1-char input made the model answer in prose -> JSON parse
      // failed through all retries -> hard 500 (audit 2026-07-19).
      return res.status(400).json({ error: 'Give a bit more detail — a sentence or two works best.' });
    }

    const userPrompt = `TRUTH BOMB — THE UNSAID THING, HANDLED

THE THING THEY'RE NOT SAYING:
"${theUnsaidThing.trim()}"
${whoItsAbout?.trim() ? `WHO IT'S ABOUT / TO: ${whoItsAbout.trim()}` : ''}
${whyNotSaying?.trim() ? `WHY THEY HAVEN'T SAID IT: ${whyNotSaying.trim()}` : ''}
${relationshipContext?.trim() ? `RELATIONSHIP CONTEXT: ${relationshipContext.trim()}` : ''}

Explore it. Name the cost. Show the three ways to say it.

Return ONLY valid JSON:
{
  "the_thing_examined": {
    "what_its_really_about": "The deeper truth underneath the surface statement — what they're really grappling with",
    "why_its_hard_to_say": "The specific fear or cost driving the silence — not generic, not 'it's complicated'",
    "what_hiding_it_costs": "The specific, concrete cost of continued silence — what it's eroding right now in their life or relationship"
  },

  "what_would_actually_happen": {
    "most_likely_scenario": "The realistic outcome if they said it — not catastrophic, not rosy. What would probably actually happen.",
    "the_fear_vs_reality_gap": "Where the feared outcome diverges from the likely outcome — what they're overestimating",
    "what_it_would_change": "What would actually shift if this truth was in the open — in them, in the relationship, in the situation",
    "what_wouldnt_change": "What would stay the same — for better or worse"
  },

  "three_ways_to_say_it": [
    {
      "version": "The Gentle Opening",
      "directness": 1,
      "when_to_use": "When you want to open the door without walking all the way through it",
      "the_words": "The actual thing to say — written as a real sentence or two they could use verbatim",
      "what_it_accomplishes": "What this version does and doesn't resolve"
    },
    {
      "version": "The Direct Statement",
      "directness": 2,
      "when_to_use": "When you want to say it clearly without softening it to meaninglessness",
      "the_words": "The actual thing to say — written as a real sentence or two they could use verbatim",
      "what_it_accomplishes": "What this version does and doesn't resolve"
    },
    {
      "version": "The Full Truth",
      "directness": 3,
      "when_to_use": "When you're done managing their reaction and just need it said",
      "the_words": "The actual thing to say — the unfiltered version. No softening.",
      "what_it_accomplishes": "What this version does and doesn't resolve"
    }
  ],

  "the_timing": {
    "when_to_say_it": "The optimal conditions for saying this — not a date, but the right moment and context",
    "what_to_avoid": "The conditions that make this conversation go worse",
    "if_they_dont_respond_well": "How to handle the likely difficult immediate reaction — what to say next"
  },

  "permission_to_not_say_it": {
    "is_silence_legitimate": true,
    "when_silence_is_okay": "The conditions under which not saying this is a legitimate choice, not just avoidance",
    "the_honest_cost": "If they choose silence, the honest cost they're accepting — no judgment, just clarity"
  }
}

RULES:
1. EXACTLY 3 items in three_ways_to_say_it (Gentle Opening, Direct Statement, Full Truth)
2. Keep every field to one tight sentence
3. Never place a double-quote (") character inside any JSON string value — the words to say must be written plainly with no quote marks, or it breaks the JSON`;

    const parsed = await callClaudeWithRetry({
model: MODELS.SMART,
      max_tokens: 3500,
      system: withLanguage(PERSONALITY, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'truth-bomb' });
    if (!parsed.the_thing_examined) {
      return res.status(500).json({ error: 'Could not analyze this. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('TruthBomb error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.'});
  }
});

module.exports = router;
