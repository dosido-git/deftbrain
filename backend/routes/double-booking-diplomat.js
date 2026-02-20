const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

router.post('/double-booking-diplomat', async (req, res) => {
  try {
    const { event1, event2, preference } = req.body;
    if (!event1 || !event2) return res.status(400).json({ error: 'Please describe both events' });
    const prompt = `You are a scheduling conflict diplomat.
EVENT 1: ${event1}
EVENT 2: ${event2}
PREFERENCE: ${preference || 'Not specified'}
TASK: Provide diplomatic scripts for resolving double-booking.
OUTPUT (JSON only):
{
  "conflict_analysis": {
    "event_1": "description",
    "event_2": "description",
    "which_to_prioritize": "event 1 or 2",
    "reasoning": "why"
  },
  "recommended_approach": {
    "attend": "which event",
    "decline": "which event",
    "strategy": "honest/partial_truth/white_lie",
    "why_this_strategy": "reasoning"
  },
  "decline_scripts": [
    {
      "approach": "name",
      "script": "exact message",
      "when_to_use": "context",
      "pros": ["benefits"],
      "cons": ["downsides"]
    }
  ],
  "if_you_want_to_reschedule": {
    "event_to_reschedule": "which",
    "script": "message",
    "alternative_times_suggestion": "how to suggest"
  },
  "if_confronted": {
    "scenario": "if they find out",
    "response": "how to handle"
  },
  "prevention_tips": "how to avoid future"
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
    console.error('Double-Booking Diplomat error:', error);
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;
