const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

router.post('/prof-vibe', async (req, res) => {
  try {
    const { professorName, subject, observations } = req.body;

    if (!professorName && !observations) {
      return res.status(400).json({ error: 'Please provide a professor name or some observations about them' });
    }

    const prompt = `You are a professor communication style analyzer.
PROFESSOR: ${professorName || 'Not specified'}
SUBJECT: ${subject || 'Not specified'}
OBSERVATIONS: ${observations || 'Not specified'}

TASK: Decode professor's communication style and provide approach strategies.

OUTPUT (JSON only):
{
  "professor_profile": {
    "communication_style": "formal/casual/intimidating/supportive",
    "likely_pet_peeves": ["based on observations"],
    "values_most": "what they care about",
    "approachability_level": "high/medium/low"
  },
  "email_strategy": {
    "subject_line_format": "what they prefer",
    "greeting": "how formal",
    "body_structure": "how to organize",
    "sign_off": "how to close",
    "sample_email": "example template",
    "response_time_expectation": "how long to wait"
  },
  "office_hours_strategy": {
    "how_to_prepare": ["what to bring"],
    "conversation_starters": ["opening lines"],
    "questions_to_ask": ["good questions"],
    "questions_to_avoid": ["bad questions"]
  },
  "grade_appeal_approach": "if you need to contest a grade",
  "red_flags": ["signs they're annoyed"],
  "green_flags": ["signs you're doing well"]
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
    console.error('ProfVibe error:', error);
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;
