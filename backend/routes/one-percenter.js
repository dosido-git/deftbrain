const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

const PERSONALITY = `You are a behavioral systems analyst. You study daily routines the way engineers study systems — looking for the single highest-leverage intervention that produces the largest compound effect.

You understand:
- How habits chain together and how one keystone habit shifts adjacent behaviors
- The physics of attention: what depletes it, what restores it, what steals it before it's used
- Environmental design: how small physical or temporal changes produce outsized behavioral outcomes
- The compounding math of daily decisions: a 1% improvement in a core system compounds to 37x over a year

YOUR METHOD:
- Analyze the routine as a system, not a list of tasks
- Identify the single bottleneck that, if removed, makes adjacent improvements easier
- The change must be specific, immediate, and free (no new products, apps, or skills required)
- Name the mechanism: don't just say "do X" — explain the chain reaction X produces
- Avoid generic advice. "Wake up earlier" is not a 1% change. "Move your alarm to the kitchen so you make coffee before checking your phone" is.

ONE CHANGE ONLY. The discipline is in the single recommendation, not a menu.`;

router.post('/one-percenter', async (req, res) => {
  try {
    const { routine, goals, painPoints, userLanguage } = req.body;
    if (!routine?.trim()) return res.status(400).json({ error: 'Describe your daily routine.' });

    const userPrompt = `ONE PERCENTER — THE HIGHEST-LEVERAGE 1% CHANGE

THEIR DAILY ROUTINE:
"${routine.trim()}"
${goals?.trim() ? `\nWHAT THEY'RE TRYING TO IMPROVE: ${goals.trim()}` : ''}
${painPoints?.trim() ? `\nWHAT THEY NOTICE ISN'T WORKING: ${painPoints.trim()}` : ''}

Analyze this routine as a system. Find the single 1% adjustment with the largest compound effect.

Return ONLY valid JSON:
{
  "routine_diagnosis": {
    "how_the_system_works": "2-3 sentences on the underlying architecture of their routine — what's driving what, where the energy flows, what the real constraints are",
    "the_bottleneck": "The single choke point where a small change produces the most downstream relief",
    "what_the_data_shows": "The specific pattern in their described routine that reveals the bottleneck — point to it precisely"
  },

  "the_one_change": {
    "the_change": "The single, specific adjustment — concrete enough to execute today without buying anything or learning anything new",
    "the_mechanism": "The chain reaction this change produces — step by step, how it compounds. This is the key section: show the math of the compounding, not just the benefit.",
    "the_math": "The compound effect over time — specific and calculated. e.g. '11 minutes per day × 365 = 67 hours per year of recovered X'",
    "implementation": "Exactly how to make this change — the specific environmental or behavioral adjustment. No ambiguity.",
    "when_to_start": "The exact moment to implement this — today, tomorrow morning, next Monday — and why that timing"
  },

  "why_not_other_things": {
    "the_tempting_alternatives": "The 2-3 obvious changes they might be considering instead",
    "why_those_are_second_order": "Why those changes are downstream of this one — fix this first"
  },

  "the_year_from_now": "If this single change compounds for 12 months, what specifically becomes true that isn't true today? Vivid and concrete.",

  "the_resistance": "The specific reason they haven't already done this — and why that reason is wrong"
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1800,
      system: withLanguage(PERSONALITY, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('OnePercenter error:', error);
    res.status(500).json({ error: error.message || 'Failed to find your 1% change' });
  }
});

module.exports = router;
