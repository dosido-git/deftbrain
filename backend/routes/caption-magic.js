const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

router.post('/caption-magic', async (req, res) => {
  try {
    const { imageDescription, platform, tone, audience } = req.body;
    if (!imageDescription) return res.status(400).json({ error: 'Image description required' });
    const prompt = `You are a social media caption specialist.
IMAGE: ${imageDescription}
PLATFORM: ${platform || 'Instagram'}
TONE: ${tone || 'casual'}
AUDIENCE: ${audience || 'general'}

TASK: Create 3 caption variations with strategic hashtag use.

OUTPUT (JSON only):
{
  "captions": [
    {
      "style": "engaging/funny/inspirational/minimalist",
      "caption": "full caption text with emojis",
      "hashtags": ["10-15 relevant hashtags"],
      "character_count": 150,
      "call_to_action": "specific CTA",
      "best_for": "when to use this version"
    }
  ],
  "posting_strategy": {
    "best_time": "optimal posting time for platform",
    "engagement_tips": ["tips to boost engagement"],
    "avoid": ["common caption mistakes"]
  },
  "alt_text_suggestion": "accessibility description"
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
    console.error('CaptionMagic error:', error);
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;
