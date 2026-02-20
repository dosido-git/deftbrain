const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

router.post('/confrontation-avoider', async (req, res) => {
  try {
    const { issue, person, relationshipType } = req.body;
    if (!issue) return res.status(400).json({ error: 'Please describe the issue' });
    const prompt = `You are a conflict avoidance specialist.
ISSUE: ${issue}
PERSON: ${person || 'Not specified'}
RELATIONSHIP: ${relationshipType || 'Not specified'}
TASK: Provide non-confrontational ways to address this.
OUTPUT (JSON only):
{
  "issue_analysis": {
    "the_problem": "what's happening",
    "why_avoiding_confrontation": "valid reasons",
    "relationship_context": "context"
  },
  "non_confrontational_approaches": [
    {
      "strategy": "name",
      "how_it_works": "what you do",
      "script_or_action": "exact words/actions",
      "pros": ["benefits"],
      "cons": ["limitations"],
      "best_for": "when this works"
    }
  ],
  "boundary_setting_without_confrontation": {
    "soft_boundaries": ["approaches"],
    "scripts": ["phrases"]
  },
  "if_issue_persists": {
    "escalation_options": ["what to try"],
    "when_confrontation_necessary": "signs"
  },
  "self_protection": {
    "emotional_boundaries": "how to protect",
    "distance_strategies": "how to create space",
    "exit_plan": "when/how to leave"
  },
  "validation": "statement"
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
    console.error('Confrontation Avoider error:', error);
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;
