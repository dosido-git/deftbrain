const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

router.post('/leftover-roulette', async (req, res) => {
  try {
    const { leftovers } = req.body;
    if (!leftovers) return res.status(400).json({ error: 'Please list leftovers' });
    const prompt = `You are a leftover transformation specialist.
LEFTOVERS: ${leftovers}
TASK: Create new meals from leftovers.
OUTPUT (JSON only):
{
  "leftover_inventory": ["what they have"],
  "transformation_meals": [
    {
      "meal_name": "new dish",
      "leftovers_used": ["which leftovers"],
      "additional_ingredients_needed": ["staples"],
      "transformation_method": "what you do",
      "instructions": ["steps"],
      "time": "how long",
      "difficulty": "easy/medium",
      "why_this_works": "explanation"
    }
  ],
  "if_you_dont_want_to_transform": {
    "best_reheating_methods": ["methods"],
    "eat_this_order": ["order by freshness"]
  },
  "food_safety": "how long safe"
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
    console.error('Leftover Roulette error:', error);
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;
