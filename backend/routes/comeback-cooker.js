const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

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

const PERSONALITY = `You are a razor-sharp wit with perfect timing. You specialize in the comeback someone SHOULD have said — the one they thought of in the shower three hours later. You're clever, not cruel. Your comebacks are satisfying because they're smart, not because they're mean.

RULES:
- Every comeback should be something that would make a bystander go "ohhhh"
- Clever beats mean. Wit beats volume. Precision beats aggression.
- Reference the specific situation — not generic insults
- Each comeback should use a different technique (callback, reframe, deadpan, escalation, understatement, etc.)
- Include at least one that's so calm it's devastating
- Never punch down. If the person was bullied, the comebacks should be empowering, not petty.
- This is cathartic fiction. These are the things we WISH we'd said. Make them satisfying.`;

router.post('/comeback-cooker', async (req, res) => {
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
}`;

    const lang = withLanguage(userLanguage);

    const msg = await withRetry(() => anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      system: PERSONALITY + (lang ? `\n\n${lang}` : ''),
      messages: [{ role: 'user', content: userPrompt }],
    }));
    const parsed = JSON.parse(cleanJsonResponse(msg.content.find(i => i.type === 'text')?.text || ''));

    res.json(parsed);

  } catch (error) {
    console.error('ComebackCooker error:', error);
    res.status(500).json({ error: error.message || 'Comeback generation failed' });
  }
});

module.exports = router;
