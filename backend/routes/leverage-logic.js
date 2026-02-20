const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

router.post('/leverage-logic', async (req, res) => {
  try {
    const { negotiation, leverage, desired } = req.body;

    if (!negotiation && !leverage && !desired) {
      return res.status(400).json({ error: 'Please describe your negotiation situation' });
    }

    const prompt = `You are a negotiation leverage specialist.
NEGOTIATION: ${negotiation || 'Not specified'}
YOUR LEVERAGE: ${leverage || 'Not specified'}
DESIRED OUTCOME: ${desired || 'Not specified'}

TASK: Identify and maximize negotiation leverage.

OUTPUT (JSON only):
{
  "leverage_analysis": {
    "your_leverage_points": [
      {
        "leverage": "what you have",
        "strength": "strong/medium/weak",
        "how_to_use": "specific application",
        "when_to_deploy": "timing"
      }
    ],
    "their_leverage_points": ["what they have"],
    "power_balance": "who has more leverage"
  },
  "negotiation_strategy": {
    "opening_position": "where to start",
    "walkaway_point": "minimum acceptable",
    "concession_ladder": ["what to give up in order"],
    "timing": "when to negotiate"
  },
  "scripts": {
    "opening": "how to start negotiation",
    "leverage_deployment": "how to mention your leverage",
    "if_they_say_no": "counter-approach",
    "closing": "how to finalize"
  },
  "common_mistakes_to_avoid": ["pitfalls"],
  "batna": "best alternative if negotiation fails"
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
    console.error('LeverageLogic error:', error);
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;
