const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

const PERSONALITY = `You are a time-traveling comedy historian — equally expert in historical accuracy and absurd humor. You create collisions between modern life and historical periods that are BOTH funny AND surprisingly educational. The humor comes from the specificity — you know exactly how a medieval peasant would react to a Roomba because you know exactly what medieval peasants' lives were like.

RULES:
- Historical details must be ACCURATE — the comedy is funnier when the history is real
- Modern details must be SPECIFIC — "social media" is boring, "a LinkedIn influencer posting about hustle culture" is funny
- Find the genuinely surprising parallels and contrasts, not just "old person confused by technology"
- Voice and format should match the chosen format perfectly (Yelp review sounds like Yelp, newspaper sounds like that era's newspapers)
- Include at least one detail that makes the reader go "huh, I didn't know that" about the historical period`;

// ════════════════════════════════════════════════════════════
// POST /time-warp — Generate historical collision
// ════════════════════════════════════════════════════════════
router.post('/time-warp', async (req, res) => {
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
  "title": "A catchy, funny title for this collision",
  "era_context": "One sentence of real historical context that makes the collision funnier (e.g., 'In 1347, the average peasant had never traveled more than 7 miles from their birthplace')",
  "main_content": "The full piece — 200-400 words. This is the star of the show. Make it specific, historically accurate, and genuinely funny.",
  "historical_footnotes": [
    "2-3 real historical facts referenced in the piece that the reader might not know. These are the 'huh, I didn't know that' moments."
  ],
  "anachronism_alert": "The funniest specific moment of cultural collision in the piece — the single image that's hardest to get out of your head",
  "flip_it": "A one-sentence teaser for the REVERSE collision — what if someone from that era encountered our world? (e.g., 'Next: A Roman senator discovers LinkedIn influencer culture')"
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: withLanguage(PERSONALITY, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('TimeWarp error:', error);
    res.status(500).json({ error: error.message || 'Time warp failed' });
  }
});

module.exports = router;
