const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

router.post('/ramen-ratio', async (req, res) => {
  try {
    const { monthlyIncome, expenses, savings } = req.body;

    if (!monthlyIncome && !expenses) {
      return res.status(400).json({ error: 'Please provide your monthly income or expenses' });
    }

    const prompt = `You are a college budget optimization specialist.
MONTHLY INCOME: ${monthlyIncome || 'Not specified'}
EXPENSES: ${JSON.stringify(expenses || {})}
SAVINGS: ${savings || 0}

TASK: Create ultra-budget meal plan and spending optimization.

OUTPUT (JSON only):
{
  "budget_analysis": {
    "total_income": "monthly income",
    "total_expenses": "monthly expenses",
    "food_budget_recommended": "realistic food budget",
    "cost_per_meal_target": "how much per meal",
    "monthly_meals_needed": 90
  },
  "ramen_tier_meals": {
    "poverty_tier": {
      "cost_per_meal": "$0.50-1.00",
      "meals": ["actual cheap meal ideas"],
      "shopping_list": ["ingredients"],
      "total_weekly_cost": "cost"
    },
    "student_tier": {
      "cost_per_meal": "$1.50-2.50",
      "meals": ["better meal ideas"],
      "shopping_list": ["ingredients"],
      "total_weekly_cost": "cost"
    },
    "splurge_tier": {
      "cost_per_meal": "$3-5",
      "meals": ["occasional treat meals"],
      "when_to_use": "end of month, celebrations"
    }
  },
  "shopping_strategy": {
    "store_recommendations": ["where to shop"],
    "bulk_buys": ["what to buy in bulk"],
    "never_buy": ["overpriced items to avoid"],
    "free_food_sources": ["campus events, samples, etc."]
  },
  "food_waste_prevention": ["how to use everything"],
  "survival_hacks": ["creative budget stretching"]
}
Return ONLY valid JSON.`;
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
      messages: [{ role: 'user', content: prompt }]
    });
    const textContent = message.content.find(item => item.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(textContent);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);
  } catch (error) {
    console.error('RamenRatio error:', error);
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;
