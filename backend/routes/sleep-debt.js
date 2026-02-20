const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

router.post('/sleep-debt', async (req, res) => {
  try {
    const { hoursSlept, daysTracked, upcomingCommitments } = req.body;

    if (!hoursSlept || (Array.isArray(hoursSlept) && hoursSlept.length === 0)) {
      return res.status(400).json({ error: 'Please provide your sleep hours' });
    }

    const prompt = `You are a sleep debt recovery specialist.
HOURS SLEPT: ${hoursSlept || 'Not specified'}
DAYS TRACKED: ${daysTracked || 7}
UPCOMING: ${upcomingCommitments || 'Normal week'}

TASK: Calculate sleep debt and create recovery plan.

OUTPUT (JSON only):
{
  "sleep_debt_analysis": {
    "total_hours_needed": "ideal sleep needed",
    "total_hours_actual": "actual sleep gotten",
    "sleep_debt": "hours in deficit",
    "debt_level": "mild/moderate/severe/crisis"
  },
  "immediate_effects": {
    "what_youre_experiencing": ["symptoms"],
    "cognitive_impact": "how it affects you",
    "when_it_gets_dangerous": "warning signs"
  },
  "recovery_plan": {
    "tonight": "what to do today",
    "this_week": "weekly recovery strategy",
    "this_month": "long-term fixes",
    "realistic_timeline": "how long to recover"
  },
  "damage_control": {
    "if_you_cant_sleep_more": ["harm reduction strategies"],
    "strategic_naps": "when and how long to nap",
    "caffeine_strategy": "optimal caffeine timing"
  },
  "sleep_hygiene_fixes": {
    "quick_wins": ["easy changes"],
    "harder_changes": ["bigger lifestyle fixes"],
    "dont_do_this": ["common mistakes"]
  },
  "reality_check": "honest assessment of sustainability"
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
    console.error('SleepDebt error:', error);
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;
