const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

router.post('/curve-calculator', async (req, res) => {
  try {
    const { scores, targetGrade } = req.body;
    if (!scores) return res.status(400).json({ error: 'Scores required' });
    const prompt = `You are a grade curve calculator.
SCORES: ${scores}
TARGET GRADE: ${targetGrade || 'B'}

TASK: Calculate what curve would get student to target grade.

OUTPUT (JSON only):
{
  "current_analysis": {
    "raw_score": "current score",
    "class_average": "estimated average",
    "percentile": "where you rank",
    "current_letter_grade": "without curve"
  },
  "curve_scenarios": [
    {
      "curve_type": "add points/scale up/drop lowest",
      "calculation": "how curve works",
      "your_new_score": "score after curve",
      "new_letter_grade": "grade after curve",
      "points_needed_to_reach_target": "if doesn't reach target"
    }
  ],
  "reality_check": "honest assessment of likelihood",
  "what_you_can_control": ["actionable next steps"],
  "grade_appeal_template": "if you think grading was unfair"
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
    console.error('CurveCalculator error:', error);
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;
