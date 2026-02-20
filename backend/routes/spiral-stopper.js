const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

router.post('/spiral-stopper', async (req, res) => {
  try {
    const { anxiousThoughts, physicalSymptoms, trigger } = req.body;

    if (!anxiousThoughts) {
      return res.status(400).json({ error: 'Anxious thoughts are required' });
    }

    const prompt = `You are a cognitive behavioral therapy specialist who identifies anxiety spirals and cognitive distortions.

ANXIOUS THOUGHTS:
"${anxiousThoughts}"

PHYSICAL SYMPTOMS: ${physicalSymptoms || 'Not specified'}
TRIGGER: ${trigger || 'Not specified'}

COGNITIVE DISTORTIONS TO DETECT:
- Catastrophizing: "This will ruin everything"
- All-or-nothing: "I always fail" / "Everyone hates me"
- Fortune-telling: "I know this will go badly"
- Mind-reading: "They think I'm stupid"
- Overgeneralization: One event → permanent pattern
- Emotional reasoning: "I feel it, so it must be true"

SPIRAL DETECTION:
- Repetitive thoughts
- Escalating worst-case scenarios
- Disconnection from present reality
- Time distortion ("this will last forever")

YOUR TASK:
1. Identify which cognitive distortions are present
2. Provide reality checks with evidence against anxious predictions
3. Suggest grounding exercises to interrupt the spiral
4. Distinguish between anxiety's narrative and actual reality

OUTPUT (JSON only):
{
  "spiral_analysis": {
    "detected_spiral": true/false,
    "confidence": 0-100,
    "primary_distortion": "main distortion type",
    "spiral_level": "mild/moderate/severe"
  },
  "your_thoughts_analyzed": {
    "thought": "the thought they shared",
    "distortions_present": [
      {
        "type": "distortion type",
        "evidence": "why this is that distortion",
        "reality_check": "what's actually true"
      }
    ]
  },
  "reality_checks": [
    {
      "anxious_prediction": "what anxiety says will happen",
      "evidence_against": ["facts contradicting this prediction"],
      "realistic_outcome": "what will likely actually happen"
    }
  ],
  "grounding_exercises": [
    {
      "name": "exercise name",
      "why": "why this helps",
      "steps": ["step by step instructions"],
      "duration": "how long"
    }
  ],
  "spiral_interruption": {
    "immediate_action": "what to do right now",
    "why": "why this helps break the spiral",
    "after_grounding": "next step after calming down"
  },
  "compassionate_reality": "Kind, truthful statement about what's actually happening vs anxiety's story"
}

CRITICAL: Return ONLY valid JSON. No markdown, no explanation outside JSON.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
      messages: [{ role: 'user', content: prompt }]
    });

    const textContent = message.content.find(item => item.type === 'text')?.text || '';
    
    let jsonText = textContent.trim();
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    const firstBrace = jsonText.indexOf('{');
    if (firstBrace > 0) {
      jsonText = jsonText.substring(firstBrace);
    }
    
    const lastBrace = jsonText.lastIndexOf('}');
    if (lastBrace !== -1 && lastBrace < jsonText.length - 1) {
      jsonText = jsonText.substring(0, lastBrace + 1);
    }
    
    jsonText = jsonText.trim();
    const parsed = JSON.parse(jsonText);
    res.json(parsed);

  } catch (error) {
    console.error('Spiral Stopper error:', error);
    if (error instanceof SyntaxError) {
      console.error('JSON Parse Error:', error.message);
    }
    res.status(500).json({ 
      error: error.message || 'Failed to analyze spiral' 
    });
  }
});


module.exports = router;
