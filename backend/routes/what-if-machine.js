const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

// ════════════════════════════════════════════════════════════
// POST /what-if-machine — The Road Not Taken
// ════════════════════════════════════════════════════════════
router.post('/what-if-machine', async (req, res) => {
  try {
    const { decision, optionNotChosen, context, timeframe, userLanguage } = req.body;

    if (!decision?.trim()) {
      return res.status(400).json({ error: 'Describe the decision you\'re facing.' });
    }

    const systemPrompt = `You are a narrative futurist — part novelist, part life strategist, part psychologist. When someone tells you about a decision they're facing, you write a vivid, realistic "what if" scenario for the path they're NOT choosing.

YOUR APPROACH:
1. VIVID AND SPECIFIC. Not "you might feel regret." Instead: "It's a Tuesday in October. You're making coffee in your new apartment. The kitchen is smaller than you expected. Your phone buzzes — it's your old coworker asking if you've heard the news about the project you left behind."
2. REALISTIC, NOT OPTIMISTIC OR PESSIMISTIC. Show the genuine texture of this path — the unexpected good parts AND the real costs. Life is never all-upside or all-downside.
3. SHOW, DON'T TELL. Write scenes, not summaries. Let the person feel what this path would be like, not just understand it intellectually.
4. Include SECOND-ORDER EFFECTS. The obvious consequences everyone sees, AND the subtle ripple effects nobody thinks about until they're living them.
5. Write in second person ("you") and present tense to make it immersive.
6. Be emotionally honest. If this path would involve grief, loneliness, excitement, or boredom — show it. Don't sanitize.
7. The goal isn't to push them toward or away from the option. It's to help them FEEL what they'd be choosing, so the decision becomes clearer.
8. Tailor the timeframe to what they requested, but always show at least 3 distinct moments in time.`;

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
      "timepoint": "When this scene takes place (e.g., '2 weeks later', '3 months in', '1 year later')",
      "scene": "A vivid, specific scene — 4-6 sentences written in second person, present tense. Show a moment in this alternate life. Include sensory details, emotional texture, and the small things that make it feel real.",
      "the_good": "What's genuinely better about this path at this moment.",
      "the_cost": "What you've lost or given up that you feel at this moment."
    }
  ],

  "the_surprise": "The one thing about this path that would genuinely surprise you — the consequence nobody talks about, positive or negative.",

  "what_you_keep": "What stays the same on this path — the parts of your life this decision doesn't change. Important for perspective.",

  "what_you_lose": "The specific thing you'd mourn most on this path. Not the obvious loss — the subtle one.",

  "clarity_question": "One question to ask yourself that cuts through the noise and gets to the real reason you're stuck on this decision.",

  "honest_take": "A final, balanced 2-3 sentence take — not advice, but an honest observation about what this simulation reveals about your values and priorities."
}

Generate ${timeframe === 'five_years' ? '4-5' : timeframe === 'one_month' ? '2-3' : '3-4'} scenarios across the timeframe.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    return res.json(parsed);

  } catch (error) {
    console.error('WhatIfMachine error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate simulation' });
  }
});

module.exports = router;
