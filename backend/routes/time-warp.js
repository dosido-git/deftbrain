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

THE WARP: Notice an irony, resemblance, tension, or absurdity exposed by the collision. Do not declare the modern thing's hidden truth, real purpose, or universal meaning. Avoid unsupported claims about either world. Invite the reader to notice; don't tell them what the collision proves.

ONE MORE: Tease the next collision through an amusing image, predicament, or question. Do not explain the joke with historical claims or assertions about what has 'always' been true.

Point at a specific detail already in the piece rather than zooming out to a claim about institutions, systems, power, economies, trust, or human nature in general — a generalization is a verdict no matter how it's dressed, and an unsupported claim about how either world actually works ('the entire economy runs on reputation,' 'trust was never quantified') is exactly that, whether it's phrased as a discovery about the modern world or a fact about the historical one. Watch especially for the DEBUNKING MOVE: "X isn't really A — it's actually B" (fair/official, neutral/power, pretends to flatten/here it just makes visible — any such swap), including through connectives like "isn't really," "in reality," "dressed up as," "pretends to," or "all it really does is." That shape is a verdict regardless of which nouns fill it in.

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
In 40-70 words — short on purpose, so there's no room to build a thesis — point at ONE specific detail, image, or moment already in the piece above, and say what's funny or strange about it landing in the other world. Do this the way you'd point something out to a friend, not the way you'd deliver a finding. Do not zoom out to a general claim about institutions, systems, human nature, power, control, or fairness. Test: if the sentence would still make sense with this piece's specific details swapped out for any other bureaucratic or institutional example, it is too general — anchor it to something that exists only in THIS piece (a phrase from the form, a specific character's specific act, a specific object).
Watch for the DEBUNKING MOVE creeping back in through any connective — "isn't really/actually," "in reality," "dressed up as," "the truth is," "what's really happening is," "all it really does is," or "X isn't that ___; it's that ___." Any of those means you have drifted from pointing at a detail to delivering a verdict — cut back to the concrete detail.

3. ONE MORE
Suggest one irresistible adjacent collision. It should feel like the next thing the reader immediately wants to try. Tease it through an amusing image, predicament, or question — do not explain the joke with a historical claim or an assertion about what has 'always' been true (e.g. not 'X and Y have been the same transaction for two thousand years,' just the funny scenario itself).

Return ONLY valid JSON:
{
  "title": "The title of the collision",
  "main_content": "The complete imaginative collision",
  "warp_insight": "The short THE WARP reflection — 40-70 words pointing at one specific detail already in the piece, not a verdict about what the modern thing really is",
  "next_collision": {
    "modernThing": "The thing for the next collision",
    "historicalPeriod": "The destination world for the next collision",
    "teaser": "One short teaser line — an amusing image, predicament, or question, never a historical claim or an 'always been true' assertion"
  }
}

FINAL CHECK:
- Is the main piece fun even if the reader learns zero history from it?
- Does the comedy come from translating the familiar thing into another world's logic?
- Does THE WARP point at one specific detail from the piece, rather than zoom out to a general claim about institutions, power, economies, trust, or human nature?
- Does THE WARP avoid the debunking move ("X isn't really A — it's actually B") under any wording?
- Did you avoid factual-history claims that invite verification, in both THE WARP and the ONE MORE teaser?
- Is ONE MORE tempting enough to click, and does it tease through an image or question rather than an "always been true" claim?
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
