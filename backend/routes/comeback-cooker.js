const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage, withLocaleContext } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit } = require('../lib/rateLimiter');

// ── Retry helper — handles Anthropic 529 overloaded errors ──
async function withRetry(fn, { retries = 3, baseDelayMs = 1500 } = {}) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const status = err?.status ?? err?.error?.status;
      const isOverloaded = status === 529 || err?.error?.error?.type === 'overloaded_error';
      if (isOverloaded && attempt < retries) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        console.warn(`[comeback-cooker] Overloaded (529), retrying in ${delay}ms (attempt ${attempt + 1}/${retries})`);
        await new Promise(r => setTimeout(r, delay));
      } else {
        throw err;
      }
    }
  }
}

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
  "situation_read": "1 sentence — your read on what made this moment sting — one sentence",
  "comebacks": [
    {
      "line": "The exact words they should have said — punchy, quotable, ready to deliver — one sentence",
      "technique": "Name the technique: callback, reframe, deadpan, rhetorical question, understatement, escalation, agreement-twist, compliment-bomb, exit line, etc. — one sentence",
      "why_it_works": "1 sentence — why this specific approach lands in this specific situation — one sentence",
      "delivery_note": "Brief stage direction — tone, pause, eye contact. How to sell it. — one sentence"
    }
  ],
  "the_nuclear_option": {
    "line": "The one that's almost too far — the thing you'd only say if you truly didn't care about consequences — one sentence",
    "warning": "Why this one lives in the fantasy drawer — one sentence"
  },
  "the_high_road": {
    "line": "The response that somehow makes you look amazing AND makes them feel small. Unbothered royalty energy. — one sentence",
    "why_its_devastating": "Why this calm response actually hurts more than any insult — one sentence"
  }
}`;

    const lang = withLanguage('', userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);

    const msg = await withRetry(() => anthropic.messages.create({
      model: MODELS.FAST,
      max_tokens: 4000,
      system: PERSONALITY + (lang ? `\n\n${lang}` : ''),
      messages: [{ role: 'user', content: userPrompt }],
    }));
    const parsed = JSON.parse(cleanJsonResponse(msg.content.find(i => i.type === 'text')?.text || ''));

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
