const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

router.post('/habit-chain', async (req, res) => {
  try {
    const { habit, currentStreak, motivation } = req.body;

    if (!habit) {
      return res.status(400).json({ error: 'Please specify which habit you\'re tracking' });
    }

    const prompt = `You are a habit streak motivation specialist.
HABIT: ${habit || 'Not specified'}
CURRENT STREAK: ${currentStreak || 0} days
MOTIVATION: ${motivation || 'Not specified'}

TASK: Provide motivation and streak protection strategies.

OUTPUT (JSON only):
{
  "streak_status": {
    "current_streak": ${currentStreak || 0},
    "milestone_reached": "achievement if any",
    "next_milestone": "days until next milestone",
    "total_impact": "cumulative effect calculation"
  },
  "motivation_boost": {
    "celebrate_this": "specific acknowledgment",
    "why_this_matters": "long-term benefit reminder",
    "progress_visualization": "concrete progress metric"
  },
  "streak_protection": {
    "common_break_points": ["when streaks usually break"],
    "if_you_miss_a_day": "how to recover without quitting",
    "vacation_mode": "how to maintain during disruption",
    "dont_break_the_chain_hacks": ["practical tips"]
  },
  "scaling_strategy": {
    "if_getting_too_easy": "how to level up",
    "if_burning_out": "how to scale back sustainably"
  }
}
Return ONLY valid JSON.`;
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }]
    });
    const textContent = message.content.find(item => item.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(textContent);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);
  } catch (error) {
    console.error('HabitChain error:', error);
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;
