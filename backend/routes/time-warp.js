const express = require('express');
const router = express.Router();
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

const PERSONALITY = `Time-traveling comedy historian. Your job is to make historical collisions funny because the history is specific, not because you fabricate historical facts.

The generated piece is imaginative historical fiction or pastiche, not a historical source. Keep the invented scenario unmistakably hypothetical or fictional. Use real historical context only when you are confident it is broadly established. If a detail is uncertain, omit it or phrase it cautiously rather than inventing precision.

Never fabricate a real person, law, quotation, court record, census rule, price, statistic, date, title, institution, Latin phrase, newspaper, or historical event and present it as true. Never attach invented conduct to a real historical person. Fictional people are allowed, but keep them obviously fictional or generic. Do not use invented exact numbers merely to make the scene feel authentic.

The humor should come from a real mismatch in incentives, customs, technology, social norms, or everyday life. Find a surprising parallel rather than relying on 'old person confused by modern thing.'

Historical footnotes must contain only high-confidence, stable facts. If you cannot produce at least two facts you are confident about, return fewer. Never turn an inference or analogy into a fact.

Never place a double-quote (") character inside any JSON string value — use single quotes or no quotation marks so the JSON remains valid.`;

// ════════════════════════════════════════════════════════════
// POST /time-warp — Generate historical collision
// ════════════════════════════════════════════════════════════
router.post('/time-warp', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { modernThing, historicalPeriod, format, userLanguage } = req.body;

    if (!modernThing?.trim() && !historicalPeriod?.trim()) {
      return res.status(400).json({ error: 'Give me at least one side of the collision.' });
    }

    const formatHints = {
      explain: `Explain the modern concept to a plausible person from the era using comparisons grounded in their real world. The historical person's questions may be invented, but do not invent historical facts to answer them.`,
      review: `Write a comic period-perspective review of the modern thing. Borrow the era's concerns and vocabulary without pretending that a Yelp/Amazon-style review literally existed. Make the framing clearly playful rather than a fake historical document.`,
      news: `Write a fictional news-style report as if the modern thing appeared in the era. Use a pastiche appropriate to the period, but do not invent real newspapers, officials, laws, investigations, quotations, or records and present them as historical fact.`,
      letter: `Write a fictional personal letter from an ordinary person in that era encountering the modern thing. Use plausible concerns and conventions without attributing invented words or experiences to a real historical figure.`,
      debate: `Write a fictional public debate about whether the era should adopt the modern thing. Give multiple plausible positions rooted in real period concerns. Do not invent actual decrees, votes, speeches, or historical participants.`,
      ad: `Write a fictional period-style advertisement for the modern thing. Use values and selling language plausible for the era without claiming the advertisement, product, endorsement, price, or sponsor actually existed.`
    };

    const suppliedModern = modernThing?.trim();
    const suppliedPeriod = historicalPeriod?.trim();

    const userPrompt = `TIME WARP COLLISION:

MODERN THING: ${suppliedModern || '[choose a specific modern thing that creates a strong collision with the supplied era]'}
HISTORICAL PERIOD: ${suppliedPeriod || '[choose a specific historical period that creates a strong collision with the supplied modern thing]'}
FORMAT: ${format || 'explain'}

${formatHints[format] || formatHints.explain}

CORE RULES:
- If one side of the collision is missing, choose it yourself and make the chosen pairing clear in the title.
- The main piece is FICTIONAL/HYPOTHETICAL entertainment built on real historical context. Do not blur that boundary.
- Prefer unnamed or obviously fictional participants. Never make up conduct, quotes, scandals, endorsements, or opinions for a real historical person.
- Do not invent a law, legal duty, government action, court record, market price, statistic, superlative, date, quotation, technical term, Latin phrase, or exact historical number unless you are highly confident it is real and accurately characterized.
- Do not fake sourcing. No invented citations, documents, archival records, newspaper names, studies, or authorities.
- Exact historical texture is welcome only when it is reliable. Broad truth is better than impressive-sounding precision.
- The joke must still work if every historical fact is removed; facts should enrich the joke, not be manufactured to support it.
- Keep the main piece roughly 180-320 words.

HISTORY CHECK RULES:
- historical_footnotes contains 0-3 genuinely factual, high-confidence notes connected to the piece.
- Each note must distinguish fact from analogy. Do not say 'this was basically the first X' unless that comparison is explicitly framed as an analogy rather than historical fact.
- If a fact is disputed, highly specific, or outside your confidence, leave it out.
- Each footnote must be an independently factual historical claim, not an interpretation written in factual-sounding language. Avoid universal claims — 'did not exist', 'would not', 'always', 'never' — unless literally supportable for the stated period: the telegraph and telephone existed by the Victorian era, so 'remote communication technology did not exist' is false, and 'a Victorian gentleman would not alter his appearance based on whether others could see him' is an inference about behavior, not a fact about the period. Before returning each footnote, silently ask whether a knowledgeable historian could reasonably object to its wording; if so, narrow it or omit it.

Return ONLY valid JSON:
{
  "title": "A concise, funny title for the collision",
  "era_context": "One modest, directly relevant historical fact that orients the joke — not a sweeping characterization of how people in the period lived or behaved. Prefer something like 'Letters and face-to-face meetings played important roles in Victorian business and social life' over a categorical claim about what was THE primary means of communication.",
  "main_content": "The fictional/hypothetical piece in the selected format",
  "fiction_note": "One brief sentence clarifying what was invented for the scenario. Example: The people, dialogue, and incident above are fictional; the history notes below are the factual part.",
  "historical_footnotes": [
    "0-3 high-confidence historical facts only"
  ],
  "anachronism_alert": "The funniest or most revealing single image created by the collision",
  "flip_it": "A one-sentence teaser for a reverse or adjacent collision that would reveal a different historical parallel"
}`;

    const parsed = await callClaudeWithRetry({
model: MODELS.FAST,
      max_tokens: 4000,
      system: withLanguage(PERSONALITY, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'time-warp' });
    if (!parsed.title || !parsed.main_content) {
      return res.status(500).json({ error: 'Could not generate the time collision. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('TimeWarp error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.'});
  }
});

module.exports = router;
