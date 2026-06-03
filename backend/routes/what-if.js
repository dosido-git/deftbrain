const express = require('express');
const router = express.Router();
const { withLanguage, callClaudeWithRetry } = require('../lib/claude');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

// ════════════════════════════════════════════════════════════
// POST /what-if — The Road Not Taken
// ════════════════════════════════════════════════════════════
router.post('/what-if', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { decision, optionNotChosen, context, timeframe, userLanguage } = req.body;

    if (!decision?.trim()) {
      return res.status(400).json({ error: 'Describe the decision you\'re facing.' });
    }

    const systemPrompt = `Narrative futurist — part novelist, part life strategist. Write a vivid, realistic "what if" scenario for the path someone is NOT choosing.

APPROACH: Be specific, not generic ("It's a Tuesday in October..." not "you might feel regret"). Show realistic texture — both the unexpected good parts AND the real costs. Write scenes, not summaries. Include second-order effects nobody thinks about until they're living them. Second person, present tense. Emotionally honest — don't sanitize grief, loneliness, excitement. The goal is to help them FEEL the path so the decision becomes clearer, not to push them either way.`;

    const userPrompt = `THE DECISION: ${decision}
THE OPTION I'M NOT CHOOSING (simulate this path): ${optionNotChosen || 'the opposite of what I\'m leaning toward'}
${context ? `CONTEXT ABOUT MY LIFE: ${context}` : ''}
TIMEFRAME TO SIMULATE: ${timeframe || 'one_year'}

Write the alternate-path simulation. Return ONLY valid JSON:
{
  "decision_read": "1-2 sentences showing you understand the real weight of this decision — not just the surface choice, but what's underneath it.",

  "the_path_not_taken": "${optionNotChosen || 'the other option'}",

  "scenarios": [
    {
      "timepoint": "When this scene takes place (e.g., '2 weeks later', '3 months in', '1 year later') — one sentence",
      "scene": "A vivid, specific scene — 4-6 sentences written in second person, present tense. Show a moment in this alternate life. Include sensory details, emotional texture, and the small things that make it feel real.",
      "the_good": "What's genuinely better about this path at this moment. — one sentence",
      "the_cost": "What you've lost or given up that you feel at this moment. — one sentence"
    }
  ],

  "the_surprise": "The one thing about this path that would genuinely surprise you — the consequence nobody talks about, positive or negative. — one sentence",

  "what_you_keep": "What stays the same on this path — the parts of your life this decision doesn't change. Important for perspective. — one sentence",

  "what_you_lose": "The specific thing you'd mourn most on this path. Not the obvious loss — the subtle one. — one sentence",

  "clarity_question": "One question to ask yourself that cuts through the noise and gets to the real reason you're stuck on this decision. — one sentence",

  "honest_take": "A final, balanced 2-3 sentence take — not advice, but an honest observation about what this simulation reveals about your values and priorities."
}

Generate ${timeframe === 'five_years' ? '4-5' : timeframe === 'one_month' ? '2-3' : '3-4'} scenarios across the timeframe.`;

    const parsed = await callClaudeWithRetry({
model: 'claude-haiku-4-5-20251001',
      max_tokens: 3500,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'what-if' });
    if (!parsed.decision_read) {
      return res.status(500).json({ error: 'Could not explore this decision. Please try again.' });
    }
    return res.json(parsed);

  } catch (error) {
    console.error('WhatIf error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.'});
  }
});

module.exports = router;
