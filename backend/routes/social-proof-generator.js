const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

router.post('/social-proof-generator', async (req, res) => {
  try {
    const { request, context, audience } = req.body;

    if (!request && !context && !audience) {
      return res.status(400).json({ error: 'Please describe what you need social proof for' });
    }

    const prompt = `You are a social proof framing specialist.
REQUEST: ${request || 'Not specified'}
CONTEXT: ${context || 'General'}
AUDIENCE: ${audience || 'General'}

TASK: Generate credible social proof framing.

OUTPUT (JSON only):
{
  "proof_statements": [
    {
      "statement": "social proof phrase",
      "type": "popularity/authority/scarcity/urgency/testimonial",
      "strength": "strong/medium/subtle",
      "when_to_use": "appropriate context",
      "why_this_works": "psychological principle"
    }
  ],
  "credibility_boosters": {
    "numbers_to_mention": ["specific metrics"],
    "names_to_drop": ["authorities to reference"],
    "affiliations": ["groups/orgs to mention"]
  },
  "framing_templates": {
    "bandwagon": "everyone else is doing it template",
    "authority": "experts recommend template",
    "scarcity": "limited availability template",
    "social_validation": "others succeeded template"
  },
  "authenticity_check": {
    "truthful_claims_only": ["what you can honestly say"],
    "avoid_exaggeration": ["what not to claim"],
    "ethical_boundaries": "staying honest"
  }
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
    console.error('SocialProofGenerator error:', error);
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;
