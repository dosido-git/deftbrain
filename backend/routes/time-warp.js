const express = require('express');
const router = express.Router();
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

const PERSONALITY = `Time-traveling comedy historian — expert in historical accuracy AND absurd humor. Create collisions between modern life and historical periods that are both funny and educational. The humor comes from specificity: you know exactly how a medieval peasant reacts to a Roomba because you know their life precisely.

Historical details must be accurate — real history makes it funnier. Modern details must be specific ('LinkedIn influencer' not 'social media'). Find surprising parallels, not just 'old person confused by tech.' Match format perfectly. Include one detail that surprises the reader.`

// ════════════════════════════════════════════════════════════
// POST /time-warp — Generate historical collision
// ════════════════════════════════════════════════════════════
router.post('/time-warp', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { modernThing, historicalPeriod, format, userLanguage } = req.body;

    if (!modernThing?.trim() && !historicalPeriod?.trim()) {
      return res.status(400).json({ error: 'Pick a modern thing and a historical period!' });
    }

    const formatHints = {
      explain: `Write as if genuinely trying to explain the modern concept to someone from that era, using only references they'd understand. Include their likely follow-up questions.`,
      review: `Write as a period-authentic review (Yelp, Amazon, newspaper critique) of the modern thing, in the voice of someone from that era. Include star rating and specific complaints.`,
      news: `Write as a newspaper article from that historical period reporting on the modern thing as breaking news. Match the writing style, vocabulary, and concerns of that era's journalism.`,
      letter: `Write as a personal letter from someone in that era to a friend/family member describing their encounter with the modern thing. Match the letter-writing conventions of the period.`,
      debate: `Write as a historical debate or public forum discussing whether this modern thing should be adopted. Include multiple period-authentic perspectives arguing for and against.`,
      ad: `Write as a period-authentic advertisement selling the modern thing using the marketing language, values, and persuasion techniques of that era.`
    };

    const userPrompt = `TIME WARP COLLISION:

MODERN THING: "${modernThing?.trim() || 'something modern'}"
HISTORICAL PERIOD: "${historicalPeriod?.trim() || 'a historical period'}"
FORMAT: ${format || 'explain'}

${formatHints[format] || formatHints.explain}

Return ONLY valid JSON:

{
  "title": "A catchy, funny title for this collision — 3-6 words",
  "era_context": "One sentence of real historical context that makes the collision funnier (e.g., 'In 1347, the average peasant had never traveled more than 7 miles from their birthplace')",
  "main_content": "The full piece — 200-400 words. This is the star of the show. Make it specific, historically accurate, and genuinely funny.",
  "historical_footnotes": [
    "2-3 real historical facts referenced in the piece that the reader might not know. These are the 'huh, I didn't know that' moments."
  ],
  "anachronism_alert": "The funniest specific moment of cultural collision in the piece — the single image that's hardest to get out of your head — one sentence",
  "flip_it": "A one-sentence teaser for the REVERSE collision — what if someone from that era encountered our world? (e.g., 'Next: A Roman senator discovers LinkedIn influencer culture') — one sentence"
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
