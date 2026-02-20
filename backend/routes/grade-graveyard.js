const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

router.post('/grade-graveyard', async (req, res) => {
  try {
    const { failedAssignment, grade, whatHappened } = req.body;

    if (!failedAssignment && !whatHappened) {
      return res.status(400).json({ error: 'Please describe the assignment or what happened' });
    }

    const prompt = `You are a grade recovery specialist.
FAILED ASSIGNMENT: ${failedAssignment || 'Not specified'}
GRADE: ${grade || 'Not specified'}
WHAT HAPPENED: ${whatHappened || 'Not specified'}

TASK: Help process failure and create recovery plan.

OUTPUT (JSON only):
{
  "eulogy": {
    "what_this_grade_meant": "acknowledgment",
    "lessons_learned": ["takeaways"],
    "permission_to_move_on": "it's okay statement"
  },
  "damage_control": {
    "impact_on_final_grade": "realistic calculation",
    "recovery_possible": true/false,
    "what_needs_to_happen": ["specific actions"]
  },
  "professor_email_template": {
    "subject": "subject line",
    "body": "professional email asking for feedback/opportunities",
    "when_to_send": "timing advice"
  },
  "next_assignment_strategy": {
    "what_to_do_differently": ["changes"],
    "how_to_prevent_repeat": ["prevention"],
    "realistic_goal": "achievable target"
  },
  "perspective": "this doesn't define you statement"
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
    console.error('GradeGraveyard error:', error);
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;
