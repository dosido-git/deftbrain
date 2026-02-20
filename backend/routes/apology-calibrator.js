const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

router.post('/apology-calibrator', async (req, res) => {
  try {
    const { situation, relationship, whatHappened } = req.body;
    if (!whatHappened) return res.status(400).json({ error: 'Please describe what happened' });
    const prompt = `You are an apology calibration specialist.
SITUATION: ${situation || 'Not specified'}
RELATIONSHIP: ${relationship || 'Not specified'}
WHAT HAPPENED: ${whatHappened}
TASK: Determine appropriate apology level (1-5).
LEVELS: 1=no apology, 2=brief acknowledgment, 3=simple apology, 4=full apology, 5=major repair
OUTPUT (JSON only):
{
  "situation_analysis": {
    "what_happened": "summary",
    "actual_harm_caused": "assessment",
    "your_responsibility_level": "high/medium/low/none",
    "relationship_context": "context"
  },
  "appropriate_apology_level": 3,
  "why_this_level": "explanation",
  "apology_templates": [
    {
      "option": "template text",
      "tone": "brief/sincere/formal",
      "when_to_use": "context"
    }
  ],
  "what_NOT_to_say": ["phrases to avoid"],
  "if_youre_over_apologizing": {
    "reality_check": "statement",
    "reframe": "what to say instead",
    "permission": "permission"
  },
  "if_youre_under_apologizing": {
    "reality_check": "statement",
    "what_to_add": "requirements",
    "repair_actions": "what to do"
  },
  "follow_up_needed": "whether and how"
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
    console.error('Apology Calibrator error:', error);
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;
