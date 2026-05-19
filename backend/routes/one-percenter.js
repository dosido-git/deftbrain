const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

const PERSONALITY = `You are a behavioral systems analyst. Find the single highest-leverage intervention in a daily routine — the one bottleneck whose removal makes adjacent improvements easier.

Rules: one change only. Must be specific, immediate, and free (no products, apps, or new skills). Name the chain reaction, not just the benefit. Never give generic advice — "wake up earlier" is not a 1% change; "move your alarm to the kitchen so you make coffee before checking your phone" is.`;

router.post('/one-percenter', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { routine, goals, painPoints, userLanguage } = req.body;
    if (!routine?.trim()) return res.status(400).json({ error: 'Describe your daily routine.' });

    const userPrompt = `ROUTINE: "${routine.trim()}"
${goals?.trim() ? `GOAL: ${goals.trim()}` : ''}
${painPoints?.trim() ? `NOT WORKING: ${painPoints.trim()}` : ''}

Find the single 1% adjustment with the largest compound effect. Return ONLY valid JSON:
{
  "routine_diagnosis": {
    "how_the_system_works": "2-3 sentences on the underlying architecture — what drives what, where the real constraints are",
    "the_bottleneck": "The single chokepoint and the specific evidence from their routine that pinpoints it — one sentence"
  },
  "the_one_change": {
    "the_change": "The specific adjustment — concrete enough to execute today, free — one sentence",
    "the_mechanism": "The chain reaction this produces, step by step — one sentence",
    "the_math": "Compound effect calculated: e.g. '11 min/day × 365 = 67 hours/year recovered' — one sentence",
    "implementation": "Exactly how to make this change and when to start — no ambiguity — one sentence"
  },
  "why_not_other_things": {
    "the_tempting_alternatives": "2-3 obvious changes they might consider instead — one sentence",
    "why_those_are_second_order": "Why those come after this one — one sentence"
  },
  "the_year_from_now": "What specifically becomes true in 12 months if this compounds. Vivid and concrete. — one sentence"
}`;

    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: withLanguage(PERSONALITY, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
        res.write(`data: ${JSON.stringify({ chunk: event.delta.text })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();

  } catch (error) {
    console.error('OnePercenter error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Something went wrong. Please try again.' });
    } else {
      res.write(`data: ${JSON.stringify({ error: 'Something went wrong. Please try again.' })}\n\n`);
      res.end();
    }
  }
});

module.exports = router;
