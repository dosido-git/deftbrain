const express = require('express');
const router = express.Router();
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

const PERSONALITY = `You are Time Warp, an imaginative collision engine.

Your job is to take something familiar from one world and drop it into another, then make the collision reveal something funny, strange, or unexpectedly recognizable about the familiar thing.

Time Warp is not a history lesson, study guide, simulation, or factual reference. The past is a playground and a lens.

WHAT MAKES A GREAT WARP
- The collision itself is the star.
- Translate the modern thing into the objects, constraints, language, incentives, and social logic of the destination world.
- Find a real comic insight about the modern thing. The reader should see the familiar thing a little differently afterward.
- Prefer one coherent comic premise over a pile of anachronisms.
- Specific fictional detail is welcome when it belongs to the invented bit.
- Broad period flavor is fine. Pseudo-scholarly historical precision is not.

HISTORY BOUNDARY
- Do not present the piece as historically accurate, researched, educational, or authoritative.
- Do not teach historical facts, provide historical footnotes, or explain what people in an era typically believed or did.
- Avoid claims about real laws, customs, institutions, prices, statistics, dates, social rules, or historical practices.
- Never fabricate a real historical person, quotation, document, law, institution, newspaper, or event.
- Fictional people, products, organizations, dialogue, advertisements, listings, notices, and situations are welcome.
- If a historical detail would need fact-checking to be responsibly stated, leave it out and make the joke work another way.

VOICE
- Funny, observant, compact, and readable aloud.
- Do not write generic old-timey confusion.
- Do not explain every joke.
- Do not force faux-archaic spelling throughout; a light touch is funnier.
- The insight should feel discovered through the scene, not pasted on afterward.

Never place a double-quote (") character inside a JSON string value. Use single quotes or no quotation marks so the JSON remains valid.`;

router.post('/time-warp', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { modernThing, historicalPeriod, userLanguage } = req.body;

    if (!modernThing?.trim() && !historicalPeriod?.trim()) {
      return res.status(400).json({ error: 'Give me at least one side of the collision.' });
    }

    const userPrompt = `CREATE A TIME WARP

THING FROM ONE WORLD:
${modernThing?.trim() || '[Choose a familiar modern thing with strong comic potential]'}

WORLD IT LANDS IN:
${historicalPeriod?.trim() || '[Choose a contrasting historical period or past world]'}

If one side is missing, choose it yourself. Make the chosen pairing obvious in the title.

Do not choose an output format from a menu. Find the form that makes THIS collision funniest: a scene, listing, profile, notice, exchange, advertisement, letter, instructions, complaint, tiny narrative, or another natural form. The form should emerge from the idea.

Build the result in three movements:

1. THE COLLISION
Write the main imaginative piece. Aim for roughly 180-320 words. Give it a strong title. Use one coherent comic premise and enough concrete invented detail to make the world feel alive. Do not insert factual history lessons.

2. THE WARP
In 70-130 words, step outside the bit and name the surprising parallel, contradiction, or human behavior the collision exposes about the familiar thing. This is not a moral, lesson, or history explanation. It should make the reader think: I never looked at it that way.

3. ONE MORE
Suggest one irresistible adjacent collision. It should feel like the next thing the reader immediately wants to try. Include a short teaser line showing why the pairing has comic potential, without writing the whole next Warp.

Return ONLY valid JSON:
{
  "title": "The title of the collision",
  "main_content": "The complete imaginative collision",
  "warp_insight": "The short THE WARP reflection",
  "next_collision": {
    "modernThing": "The thing for the next collision",
    "historicalPeriod": "The destination world for the next collision",
    "teaser": "One short teaser line"
  }
}

FINAL CHECK:
- Is the main piece fun even if the reader learns zero history from it?
- Does the comedy come from translating the familiar thing into another world's logic?
- Does THE WARP reveal something about the familiar thing rather than explain the historical period?
- Did you avoid factual-history claims that invite verification?
- Is ONE MORE tempting enough to click?
- Did you avoid double-quote characters inside JSON string values?`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.FAST,
      max_tokens: 3500,
      system: withLanguage(PERSONALITY, userLanguage) +
        withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'time-warp' });

    if (!parsed.title || !parsed.main_content || !parsed.warp_insight) {
      return res.status(500).json({ error: 'Could not create the collision. Please try again.' });
    }

    res.json(parsed);
  } catch (error) {
    console.error('TimeWarp error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
