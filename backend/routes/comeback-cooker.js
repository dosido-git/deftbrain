const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit } = require('../lib/rateLimiter');

const PERSONALITY = `Razor-sharp wit specializing in the comeback someone SHOULD have said — the one they thought of three hours later. Clever, not cruel. Satisfying because it's smart, not mean. Each comeback uses a different technique: callback, reframe, deadpan, escalation, understatement. At least one should be so calm it's devastating. Never punch down. Reference the specific situation, not generic insults. This is cathartic fiction.`

router.post('/comeback-cooker', rateLimit(), async (req, res) => {
  try {
    const { situation, whatTheySaid, relationship, mood, userLanguage } = req.body;

    if (!situation?.trim()) {
      return res.status(400).json({ error: 'Describe what happened.' });
    }

    const moodMap = {
      surgical:  'SURGICAL — Cold, precise, devastating. The kind of response that ends a conversation permanently.',
      witty:     'WITTY — Quick, clever, makes everyone laugh. The comeback you\'d see in a movie.',
      petty:     'PETTY — Unapologetically petty. Not trying to be the bigger person today.',
      dignified: 'DIGNIFIED — Calm and composed but absolutely lethal. Unbothered energy that somehow hurts more.',
    };

    const userPrompt = `COMEBACK COOKER

THE SITUATION:
"${situation.trim()}"
${whatTheySaid?.trim() ? `\nWHAT THEY SAID: "${whatTheySaid.trim()}"` : ''}
${relationship?.trim() ? `RELATIONSHIP: ${relationship.trim()}` : ''}
MOOD: ${moodMap[mood] || moodMap.witty}

Generate 5 comebacks this person WISHES they'd said. Each should use a different technique and feel distinct. These are cathartic fantasies — satisfying, clever, and specific to the situation.

Return ONLY valid JSON:

{
  "situation_read": "1 sentence — your read on what made this moment sting",
  "comebacks": [
    {
      "line": "The exact words they should have said — punchy, quotable, ready to deliver",
      "technique": "Name the technique: callback, reframe, deadpan, rhetorical question, understatement, escalation, agreement-twist, compliment-bomb, exit line, etc.",
      "why_it_works": "1 sentence — why this specific approach lands in this specific situation",
      "delivery_note": "Brief stage direction — tone, pause, eye contact. How to sell it."
    }
  ],
  "the_nuclear_option": {
    "line": "The one that's almost too far — the thing you'd only say if you truly didn't care about consequences",
    "warning": "Why this one lives in the fantasy drawer"
  },
  "the_high_road": {
    "line": "The response that somehow makes you look amazing AND makes them feel small. Unbothered royalty energy.",
    "why_its_devastating": "Why this calm response actually hurts more than any insult"
  }
}

Never place a double-quote (") character inside any JSON string value — quoted remarks must be written plainly or with single quotes, or the JSON breaks.`;

    const lang = withLanguage('', userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);

    const parsed = await callClaudeWithRetry({
      model: MODELS.FAST,
      max_tokens: 4000,
      system: PERSONALITY + (lang ? `\n\n${lang}` : ''),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'ComebackCooker' });

    if (!Array.isArray(parsed.comebacks) || !parsed.comebacks.length) {
      return res.status(500).json({ error: 'Could not cook up comebacks. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('ComebackCooker error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.'});
  }
});

module.exports = router;
