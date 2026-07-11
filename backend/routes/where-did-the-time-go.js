const express = require('express');
const router = express.Router();
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

const PERSONALITY = `Time perception analyst. Help people understand the gap between how long they think things take and how long they actually take.

Be specific: name the hidden overhead categories (transition time, decision fatigue, context-switching costs, micro-interruptions). Calculate the real time cost. Show the pattern without moralizing — the goal is clarity, not shame.`;

router.post('/where-did-the-time-go', rateLimit(DEFAULT_LIMITS), async (req, res) => {
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
    "total_hours_described": "Estimated hours their activities actually account for — one sentence",
    "activities": [
      {
        "activity": "What they described doing — one sentence",
        "perceived_time": "How long they probably think it took — one sentence",
        "likely_actual_time": "How long it likely actually took (including setup, transition, recovery) — one sentence",
        "hidden_overhead": "The invisible time tax on this activity — what they didn't count — one sentence"
      }
    ]
  },
  "the_invisible_hours": {
    "total_unaccounted": "Estimated hours that vanished into overhead they didn't track — one sentence",
    "where_it_went": [
      {
        "category": "Specific category (e.g., 'Task-switching recovery', 'Decision fatigue breaks', 'Micro-interruption accumulation', 'Energy depletion pauses', 'Invisible admin') — one sentence",
        "estimated_time": "How much time this likely consumed — one sentence",
        "why_you_didnt_see_it": "Why this is invisible — the mechanism that hides it — one sentence"
      }
    ]
  },
  "the_perception_gap": {
    "biggest_gap": "The single biggest difference between what they think happened and what likely happened — stated clearly and specifically — one sentence",
    "why_this_is_normal": "1 sentence — why this gap exists for everyone, not just them — one sentence"
  },
  "the_one_thing": {
    "change": "ONE specific, concrete change that would reclaim the most vanished time. Not 'be more disciplined' — an actual structural change. — one sentence",
    "why_it_works": "1 sentence — why this specific change addresses the biggest leak — one sentence",
    "time_reclaimed": "Realistic estimate of time this would free up per day/week — one sentence"
  },
  "honest_capacity": "1-2 sentences — given their actual patterns, what's a realistic expectation for what they can accomplish in a ${tf}. Not aspirational. Real."
}

Provide 3-5 activities and 2-4 invisible hour categories.`;

    const parsed = await callClaudeWithRetry({
model: MODELS.FAST,
      max_tokens: 2500,
      system: withLanguage(PERSONALITY, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'where-did-the-time-go' });
    if (!parsed.what_you_actually_did) {
      return res.status(500).json({ error: 'Could not analyze your day. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('WhereDidTheTimeGo error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.'});
  }
});

module.exports = router;
