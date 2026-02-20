const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse } = require('../lib/claude');

router.post('/focus-sound-architect', async (req, res) => {
  try {
    const { task, environment, soundPreferences, sensitivities, energyGoal } = req.body;

    if (!task) {
      return res.status(400).json({ error: 'Task type is required' });
    }

    // Normalize inputs — may arrive as string or array depending on frontend version
    const envList = Array.isArray(environment) ? environment : (environment ? [environment] : []);
    const prefList = Array.isArray(soundPreferences) ? soundPreferences : (soundPreferences ? [soundPreferences] : []);
    const sensList = Array.isArray(sensitivities) ? sensitivities : (sensitivities ? [sensitivities] : []);

    console.log(`[FocusSoundArchitect] Task: "${task}", energy: ${energyGoal}, prefs: ${prefList.join(', ')}`);

    const prompt = `You are an expert in psychoacoustics and focus optimization. Design a personalized soundscape for someone who needs to focus.

USER PROFILE:
- Task: ${task}
- Environment: ${envList.join(', ') || 'not specified'}
- Sound preferences: ${prefList.join(', ') || 'not specified'}
- Sensitivities: ${sensList.join(', ') || 'none specified'}
- Energy goal: ${energyGoal || 50}/100 (0=very calm, 100=energized)

AVAILABLE SOUND LAYER TYPES (you MUST only use these exact type strings):
- "white_noise" — Equal energy across all frequencies. Good for masking speech.
- "pink_noise" — Lower frequencies louder. Warmer, less harsh. Good default.
- "brown_noise" — Deep, rumbling. Very warm. Best for deep focus and anxiety.
- "rain" — Rhythmic rain pattern. Masks distractions naturally.
- "ocean" — Slow wave patterns. Calming, good for creative work.
- "wind" — Gentle wind texture. Subtle, organic.
- "forest" — Layered nature sounds with gentle high-frequency texture.
- "fire" — Crackling fireplace. Warm, cozy, slightly stimulating.
- "cafe" — Coffee shop murmur. Low-level social noise for those who focus better with it.
- "binaural" — Binaural beats (requires headphones). Must include "hz" field (frequency difference):
    * 1-4 Hz (delta) = deep relaxation
    * 4-8 Hz (theta) = meditation, creativity
    * 8-14 Hz (alpha) = calm focus, learning
    * 14-30 Hz (beta) = active focus, alertness
    * "base_hz" should be between 150-300 Hz

Design a soundscape with 2-5 layers. Consider:
- The user's task (deep work needs fewer layers, creative work can handle more variety)
- Their environment (noisy office needs stronger masking, quiet home needs less)
- Sensitivities (sudden sound sensitivity = avoid fire/rain with sharp transients, high frequency sensitivity = prefer brown/pink over white)
- Energy goal (low = brown noise, ocean, theta binaural; high = pink noise, cafe, beta binaural)

Return ONLY valid JSON (no markdown, no preamble, no code fences):

{
  "soundscape_name": "A short evocative name for this soundscape",
  "description": "1-2 sentences describing the overall feel and why it works for this person",
  "layers": [
    {
      "type": "brown_noise",
      "volume": 65,
      "label": "Deep Foundation",
      "why": "Why this layer was chosen for this specific user/task"
    },
    {
      "type": "binaural",
      "volume": 25,
      "hz": 10,
      "base_hz": 200,
      "label": "Alpha Focus",
      "why": "Why binaural at this frequency helps"
    }
  ],
  "usage_tips": [
    "Specific, actionable tip about using this soundscape",
    "Another tip"
  ],
  "adjustment_guide": {
    "if_too_distracting": "What to adjust if it's too much",
    "if_not_enough": "What to adjust if it's not enough stimulation",
    "after_30_minutes": "How to adjust after initial focus period"
  }
}

CRITICAL:
- Each layer's "type" MUST be one of the exact strings listed above
- Volume is 0-100 (suggest realistic values, not all at 100)
- The total shouldn't be overwhelming — if using 4+ layers, keep individual volumes lower
- For binaural type, ALWAYS include "hz" (beat frequency 1-30) and "base_hz" (carrier 150-300)
- Be specific in "why" — reference the user's actual task and preferences
- Keep it practical — this will be synthesized and played immediately`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    });

    const textContent = message.content.find(item => item.type === 'text')?.text || '';
    console.log(`[FocusSoundArchitect] Response: ${textContent.length} chars`);

    const cleaned = cleanJsonResponse(textContent);
    const parsed = JSON.parse(cleaned);

    // Validate layer types
    const validTypes = ['white_noise', 'pink_noise', 'brown_noise', 'rain', 'ocean', 'wind', 'forest', 'fire', 'cafe', 'binaural'];
    if (parsed.layers) {
      parsed.layers = parsed.layers.filter(l => validTypes.includes(l.type));
    }

    console.log(`[FocusSoundArchitect] Generated: "${parsed.soundscape_name}", ${parsed.layers?.length || 0} layers`);
    res.json(parsed);

  } catch (error) {
    console.error('[FocusSoundArchitect] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate soundscape' });
  }
});

module.exports = router;
