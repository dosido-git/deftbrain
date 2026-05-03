const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');
const { rateLimit } = require('../lib/rateLimiter');

const PERSONALITY = `You are a sharp, non-judgmental time analyst. You read someone's description of their day and spot the gaps between what they THINK happened and what ACTUALLY happened. You understand that nobody wastes time on purpose — time disappears into transitions, context switches, recovery periods, and invisible overhead that people genuinely can't see.

RULES:
- Never moralize. "You wasted 3 hours" is wrong. "3 hours went to transitions and recovery you didn't notice" is right.
- Be specific about WHERE time vanishes — name the actual mechanism (context switching, task-switching recovery, underestimated prep time, invisible admin, energy depletion, decision fatigue)
- The perception gap is the insight. If someone thinks deep work took 6 hours but the math shows 3, that's not failure — it's normal human time perception
- Always validate what they DID accomplish before showing what they didn't see
- One or two changes max. Not a productivity overhaul. The thing that would actually move the needle.
- Real talk, warm delivery. Like a friend who's good with time telling you something useful.`;

router.post('/where-did-the-time-go', rateLimit(), async (req, res) => {
  try {
    const { dayDescription, perceivedBreakdown, timeframe, userLanguage } = req.body;

    if (!dayDescription?.trim()) {
      return res.status(400).json({ error: 'Describe how you spent your time.' });
    }

    const tf = timeframe || 'today';

    const userPrompt = `WHERE DID THE TIME GO — TIME PERCEPTION ANALYSIS

TIMEFRAME: ${tf}

HOW THEY DESCRIBE THEIR ${tf.toUpperCase()}:
"${dayDescription.trim()}"

${perceivedBreakdown?.trim() ? `WHERE THEY THINK TIME WENT:\n"${perceivedBreakdown.trim()}"` : 'No time perception estimate provided — infer from their description what they probably THINK happened vs. what likely DID happen.'}

Analyze the gap between perceived and actual time use. Be specific, be honest, be kind.

Return ONLY valid JSON:

{
  "what_you_actually_did": "2-3 sentence validation — what they genuinely accomplished. Start here. Make it real, not patronizing.",
  "the_visible_day": {
    "total_hours_described": "Estimated hours their activities actually account for",
    "activities": [
      {
        "activity": "What they described doing",
        "perceived_time": "How long they probably think it took",
        "likely_actual_time": "How long it likely actually took (including setup, transition, recovery)",
        "hidden_overhead": "The invisible time tax on this activity — what they didn't count"
      }
    ]
  },
  "the_invisible_hours": {
    "total_unaccounted": "Estimated hours that vanished into overhead they didn't track",
    "where_it_went": [
      {
        "category": "Specific category (e.g., 'Task-switching recovery', 'Decision fatigue breaks', 'Micro-interruption accumulation', 'Energy depletion pauses', 'Invisible admin')",
        "estimated_time": "How much time this likely consumed",
        "why_you_didnt_see_it": "Why this is invisible — the mechanism that hides it"
      }
    ]
  },
  "the_perception_gap": {
    "biggest_gap": "The single biggest difference between what they think happened and what likely happened — stated clearly and specifically",
    "why_this_is_normal": "1 sentence — why this gap exists for everyone, not just them"
  },
  "the_one_thing": {
    "change": "ONE specific, concrete change that would reclaim the most vanished time. Not 'be more disciplined' — an actual structural change.",
    "why_it_works": "1 sentence — why this specific change addresses the biggest leak",
    "time_reclaimed": "Realistic estimate of time this would free up per day/week"
  },
  "honest_capacity": "1-2 sentences — given their actual patterns, what's a realistic expectation for what they can accomplish in a ${tf}. Not aspirational. Real."
}

Provide 3-5 activities and 2-4 invisible hour categories.`;

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2500,
      system: withLanguage(PERSONALITY, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('WhereDidTheTimeGo error:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze time.' });
  }
});

module.exports = router;
