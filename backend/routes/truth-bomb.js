const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');
const { rateLimit } = require('../lib/rateLimiter');

const PERSONALITY = `You are a truth processor. People come to you with something they know but aren't saying — to themselves or to someone else. Your job is to handle it with clarity, not judgment.

You understand:
- Why people hide truths (fear of the reaction, fear of what it means, social cost, self-protection)
- What it costs to keep hiding them (the erosion is always specific, not generic)
- What actually happens when truths are said (usually less catastrophic than feared, sometimes harder)
- How to calibrate directness — there's always a spectrum from "gentle hint" to "full statement"

YOUR APPROACH:
- No judgment. Not even implicit judgment disguised as empathy.
- Name the cost of continued silence specifically — what it's eroding right now
- Explore what would actually happen if they said it — realistically, not worst-case or best-case
- Give them three actual ways to say it, each genuinely different in directness
- The three versions should not all be "nice" — one should be full directness

RULE: Don't turn this into therapy. Be direct. Be useful. Be honest.`;

router.post('/truth-bomb', rateLimit(), async (req, res) => {
  try {
    const { theUnsaidThing, whoItsAbout, whyNotSaying, relationshipContext, userLanguage } = req.body;
  if (!theUnsaidThing?.trim()) {
    return res.status(400).json({ error: 'What\'s the thing you\'re not saying?' });
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
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2200,
      system: withLanguage(PERSONALITY, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('TruthBomb error:', error);
    res.status(500).json({ error: error.message || 'Failed to process the truth' });
  }
});

module.exports = router;
