const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

router.post('/liquid-courage', async (req, res) => {
  try {
    const { situation, currentConfidence } = req.body;

    if (!situation) {
      return res.status(400).json({ error: 'Please describe the situation you need confidence for' });
    }

    const prompt = `You are a confidence-building specialist (no alcohol needed).
SITUATION: ${situation || 'Not specified'}
CURRENT CONFIDENCE: ${currentConfidence || 'Low'}

TASK: Provide genuine confidence boost and preparation.

OUTPUT (JSON only):
{
  "confidence_reframe": {
    "what_youre_worried_about": "fear identification",
    "realistic_assessment": "actual risk vs perceived",
    "youve_got_this_because": ["genuine reasons for confidence"]
  },
  "preparation_checklist": [
    {
      "action": "specific prep step",
      "why_this_helps": "confidence boost",
      "time_needed": "duration"
    }
  ],
  "in_the_moment_tactics": {
    "power_pose": "2-minute confidence hack",
    "self_talk_script": "what to tell yourself",
    "physical_grounding": "techniques",
    "emergency_exit": "how to leave if needed"
  },
  "worst_case_scenario": {
    "actual_worst_case": "realistic worst outcome",
    "survivability": "you'll be okay because",
    "recovery_plan": "what to do if it goes badly"
  },
  "permission_statement": "validation that nervous is normal"
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
    console.error('LiquidCourage error:', error);
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;
