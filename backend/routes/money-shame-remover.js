const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

router.post('/money-shame-remover', async (req, res) => {
  try {
    const { moneyShame, situation } = req.body;
    if (!moneyShame) return res.status(400).json({ error: 'Please describe money shame' });
    const prompt = `You are a financial shame elimination specialist.
MONEY SHAME: ${moneyShame}
SITUATION: ${situation || 'Not specified'}
TASK: Remove shame and provide practical steps.
OUTPUT (JSON only):
{
  "shame_analysis": {
    "what_youre_ashamed_of": "the shame",
    "systemic_factors": ["larger issues"],
    "personal_factors": ["within control"],
    "shame_vs_reality": "reframe"
  },
  "shame_removal_reframe": {
    "the_truth": "non-shameful truth",
    "why_this_isnt_failure": "explanation",
    "others_in_same_boat": "normalization"
  },
  "practical_solutions": [
    {
      "approach": "what to do",
      "how": "steps",
      "resources": ["resources"],
      "no_shame_script": "how to ask"
    }
  ],
  "social_situations": {
    "declining_expensive_invites": "scripts",
    "suggesting_free_alternatives": "how to propose",
    "being_honest_about_budget": "when/how"
  },
  "permission_statements": ["permissions"],
  "when_to_seek_help": {
    "financial_counseling": "free resources",
    "assistance_programs": ["programs"],
    "community_resources": ["local help"]
  }
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
    console.error('Money Shame Remover error:', error);
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;
