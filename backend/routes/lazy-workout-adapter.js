const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

router.post('/lazy-workout-adapter', async (req, res) => {
  try {
    const { currentEnergy, timeAvailable, equipment, limitations } = req.body;

    if (!currentEnergy && !timeAvailable) {
      return res.status(400).json({ error: 'Please provide your energy level or available time' });
    }

    const prompt = `You are a lazy-friendly fitness adapter.
ENERGY: ${currentEnergy || 'Very low'}
TIME: ${timeAvailable || '10-15 min'}
EQUIPMENT: ${equipment || 'None'}
LIMITATIONS: ${limitations || 'None'}
TASK: Create genuinely low-barrier workout.
OUTPUT (JSON only):
{
  "energy_assessment": {
    "current_level": "energy",
    "realistic_tier": "tier",
    "time_commitment": "time"
  },
  "adapted_workout": {
    "workout_name": "name",
    "total_time": "duration",
    "exercises": [
      {
        "exercise": "movement",
        "duration_or_reps": "amount",
        "modifications": ["easier versions"],
        "why_this_helps": "benefit",
        "can_do_while": "what else during"
      }
    ],
    "rest_periods": "rest amount",
    "total_movement_time": "active time"
  },
  "barrier_removal": {
    "no_changing_needed": "can do in current clothes",
    "no_equipment": "bodyweight",
    "no_leaving_house": "anywhere",
    "can_do_during": "TV, work break"
  },
  "progression": {
    "if_this_feels_easy": "how to add difficulty",
    "if_this_feels_hard": "easier version"
  },
  "motivation_reframe": {
    "why_this_counts": "validation",
    "comparison_to_nothing": "this vs nothing",
    "permission": "permission for easy version"
  },
  "consistency_tip": "sustainability"
}
Return ONLY valid JSON.`;
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    });
    const textContent = message.content.find(item => item.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(textContent);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);
  } catch (error) {
    console.error('Lazy Workout Adapter error:', error);
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;
