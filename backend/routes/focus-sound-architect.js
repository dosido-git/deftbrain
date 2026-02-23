const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

router.post('/focus-sound-architect', async (req, res) => {
  try {
    const { task, environment, soundPreferences, sensitivities, energyGoal, feedback, userLanguage } = req.body;

    if (!task) {
      return res.status(400).json({ error: 'Task type is required' });
    }

    // Normalize inputs — may arrive as string or array depending on frontend version
    const envList = Array.isArray(environment) ? environment : (environment ? [environment] : []);
    const prefList = Array.isArray(soundPreferences) ? soundPreferences : (soundPreferences ? [soundPreferences] : []);
    const sensList = Array.isArray(sensitivities) ? sensitivities : (sensitivities ? [sensitivities] : []);

    console.log(`[FocusSoundArchitect] Task: "${task}", energy: ${energyGoal}, prefs: ${prefList.join(', ')}`);

    const prompt = withLanguage(`You are an expert in psychoacoustics and focus optimization. Design a personalized soundscape for someone who needs to focus.

USER PROFILE:
- Task: ${task}
- Environment: ${envList.join(', ') || 'not specified'}
- Sound preferences: ${prefList.join(', ') || 'not specified'}
- Sensitivities: ${sensList.join(', ') || 'none specified'}
- Energy goal: ${energyGoal || 50}/100 (0=very calm, 100=energized)
${feedback ? `- Previous feedback: ${feedback}` : ''}

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
- Keep it practical — this will be synthesized and played immediately`, userLanguage);

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

// ═══════════════════════════════════════════════════════════════
// AI SCENE GENERATION — multi-phase evolving soundscapes
// ═══════════════════════════════════════════════════════════════

router.post('/focus-sound-architect/scene', async (req, res) => {
  try {
    const { task, environment, soundPreferences, sensitivities, energyGoal, totalMinutes, userLanguage } = req.body;

    if (!task) return res.status(400).json({ error: 'Task type is required' });
    const minutes = totalMinutes || 60;

    const envList = Array.isArray(environment) ? environment : (environment ? [environment] : []);
    const prefList = Array.isArray(soundPreferences) ? soundPreferences : (soundPreferences ? [soundPreferences] : []);
    const sensList = Array.isArray(sensitivities) ? sensitivities : (sensitivities ? [sensitivities] : []);

    console.log(`[FocusSoundArchitect/scene] Task: "${task}", ${minutes}min, energy: ${energyGoal}`);

    const prompt = withLanguage(`You are an expert in psychoacoustics and focus optimization. Design an EVOLVING multi-phase soundscape that changes over time for a ${minutes}-minute session.

USER PROFILE:
- Task: ${task}
- Environment: ${envList.join(', ') || 'not specified'}
- Sound preferences: ${prefList.join(', ') || 'not specified'}
- Sensitivities: ${sensList.join(', ') || 'none specified'}
- Energy goal: ${energyGoal || 50}/100 (0=very calm, 100=energized)
- Total session: ${minutes} minutes

AVAILABLE SOUND LAYER TYPES (use ONLY these exact type strings):
"white_noise", "pink_noise", "brown_noise", "rain", "ocean", "wind", "forest", "fire", "cafe", "binaural"

For binaural type, ALWAYS include "hz" (beat frequency 1-50) and "base_hz" (carrier 150-300):
  * 1-4 Hz (delta) = deep relaxation/sleep
  * 4-8 Hz (theta) = meditation, creativity
  * 8-14 Hz (alpha) = calm focus, learning
  * 14-30 Hz (beta) = active focus, alertness
  * 30-50 Hz (gamma) = peak concentration

DESIGN PRINCIPLES FOR EVOLVING SCENES:
1. Each phase should have a clear psychoacoustic purpose (ramp up, sustain, wind down, etc.)
2. Transitions between phases should feel natural — share at least one layer between adjacent phases
3. Energy arc should match the task: deep work needs gradual ramp then sustained plateau; creative work needs varied stimulation; sleep needs steady descent
4. Phase durations should be proportional to the total time (don't make phases too short)
5. Design 2-4 phases (never more)

Return ONLY valid JSON:

{
  "scene_name": "Evocative name for this sound journey",
  "description": "1-2 sentences about the overall arc and why it works",
  "phases": [
    {
      "name": "Short phase name (2-3 words)",
      "durationMin": 15,
      "purpose": "Why this phase exists in the arc",
      "layers": [
        { "type": "brown_noise", "volume": 50, "label": "Deep Foundation", "why": "Reason" },
        { "type": "binaural", "volume": 20, "hz": 18, "base_hz": 250, "label": "Beta Boost", "why": "Reason" }
      ]
    }
  ],
  "arc_explanation": "A sentence explaining the overall energy arc from phase to phase",
  "transition_notes": ["Tip about how the transitions will feel", "Another note"]
}

CRITICAL:
- Phase durations MUST sum to exactly ${minutes} minutes
- Each layer "type" MUST be one of the valid types listed
- Volumes 0-100 (realistic, not all at 100)
- For binaural, ALWAYS include "hz" and "base_hz"
- 2-4 phases, each with 2-5 layers
- Be specific in "why" — reference the user's actual task and preferences`, userLanguage);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }]
    });

    const textContent = message.content.find(item => item.type === 'text')?.text || '';
    console.log(`[FocusSoundArchitect/scene] Response: ${textContent.length} chars`);

    const cleaned = cleanJsonResponse(textContent);
    const parsed = JSON.parse(cleaned);

    // Validate layer types in all phases
    const validTypes = ['white_noise', 'pink_noise', 'brown_noise', 'rain', 'ocean', 'wind', 'forest', 'fire', 'cafe', 'binaural'];
    if (parsed.phases) {
      parsed.phases.forEach(phase => {
        if (phase.layers) {
          phase.layers = phase.layers.filter(l => validTypes.includes(l.type));
        }
      });
    }

    console.log(`[FocusSoundArchitect/scene] Generated: "${parsed.scene_name}", ${parsed.phases?.length || 0} phases`);
    res.json(parsed);

  } catch (error) {
    console.error('[FocusSoundArchitect/scene] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate scene' });
  }
});

// ═══════════════════════════════════════════════════════════════
// SMART FEEDBACK — returns volume adjustments, not regeneration
// ═══════════════════════════════════════════════════════════════

router.post('/focus-sound-architect/adjust', async (req, res) => {
  try {
    const { currentLayers, feedback, task, userLanguage } = req.body;

    if (!currentLayers || !feedback) {
      return res.status(400).json({ error: 'Current layers and feedback are required' });
    }

    console.log(`[FocusSoundArchitect/adjust] Feedback: "${feedback}", ${currentLayers.length} layers`);

    const layerSummary = currentLayers.map((l, i) =>
      `[${i}] ${l.type} — volume: ${l.volume}${l.hz ? `, hz: ${l.hz}` : ''} (label: "${l.label || l.type}")`
    ).join('\n');

    const prompt = withLanguage(`You are a psychoacoustic mixing engineer. The user has been listening to a soundscape and has feedback. Make SPECIFIC volume adjustments — do NOT redesign the soundscape from scratch.

CURRENT LAYERS:
${layerSummary}

USER FEEDBACK: "${feedback}"
TASK: ${task || 'general focus'}

AVAILABLE ACTIONS:
- Adjust volume of existing layers (0-100)
- Suggest adding ONE new layer (optional)
- Suggest removing a layer (optional, by index)

Return ONLY valid JSON:

{
  "adjustments": [
    { "index": 0, "volume": 45, "reason": "Why this change helps" },
    { "index": 1, "volume": 30, "reason": "Why this change helps" }
  ],
  "add_layer": null,
  "remove_index": null,
  "explanation": "Brief explanation of what these changes will do to the overall feel"
}

For "add_layer", use null OR: { "type": "rain", "volume": 25, "label": "Gentle Rain", "why": "Reason" }
For binaural add, include "hz" and "base_hz".
Valid layer types: white_noise, pink_noise, brown_noise, rain, ocean, wind, forest, fire, cafe, binaural.
For "remove_index", use null or the index number to remove.

CRITICAL:
- Be conservative — small changes (5-15 volume points) usually suffice
- If feedback is "too busy", lower busier layers (cafe, rain) and keep foundation (brown_noise)
- If "too sparse", boost variety layers or suggest adding one
- If "too harsh", reduce white_noise/high-frequency layers, boost brown_noise
- Keep the total soundscape balanced`, userLanguage);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
    });

    const textContent = message.content.find(item => item.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(textContent);
    const parsed = JSON.parse(cleaned);

    // Validate add_layer type
    const validTypes = ['white_noise', 'pink_noise', 'brown_noise', 'rain', 'ocean', 'wind', 'forest', 'fire', 'cafe', 'binaural'];
    if (parsed.add_layer && !validTypes.includes(parsed.add_layer.type)) {
      parsed.add_layer = null;
    }

    console.log(`[FocusSoundArchitect/adjust] Adjustments: ${parsed.adjustments?.length || 0}, add: ${parsed.add_layer ? 'yes' : 'no'}`);
    res.json(parsed);

  } catch (error) {
    console.error('[FocusSoundArchitect/adjust] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate adjustments' });
  }
});

module.exports = router;
