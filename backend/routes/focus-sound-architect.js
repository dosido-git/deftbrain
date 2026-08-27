const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');
const { runOutputGuard } = require('../lib/outputGuard');

// The soundscape is finished before the guard runs; never hold it hostage.
const GUARD_ENTRY_MS = Number(process.env.FSA_GUARD_ENTRY_MS || 60_000);

// Only the prose. Layer types, volumes and frequencies are the synth's contract
// with the browser and are not the guard's business.
async function guardProse(parsed, body, startedAt) {
  if (Date.now() - startedAt > GUARD_ENTRY_MS) {
    console.log('[focus-sound-architect-v2] v2 guard: skipped — out of time, answer returned unguarded');
    return;
  }
  const fields = [];
  const push = (path, v) => { if (typeof v === 'string' && v.trim().length > 15) fields.push([path, v]); };
  push('description', parsed.description);
  (parsed.usage_tips || []).forEach((x, i) => push(`usage_tips[${i}]`, x));
  (parsed.layers || []).forEach((l, i) => push(`layers[${i}].why`, l && l.why));
  push('adjustment_guide', parsed.adjustment_guide);
  if (!fields.length) return;

  await runOutputGuard(parsed, {
    label: 'focus-sound-architect-v2',
    fields,
    supplied: `WHAT THE LISTENER TOLD US, IN FULL — nothing else about them is known:
Task: ${body.task || '(not given)'}
What is interfering: ${body.interference || '(not given)'}
Where they are: ${body.environment || '(not given)'}
Sounds they asked for: ${(body.soundPreferences || []).join(', ') || 'NONE — they left it to you'}
Sounds they cannot stand: ${(body.sensitivities || []).join(', ') || 'none given'}
How energised they want to feel: ${body.energyGoal ?? '(not given)'}/100
How long they will listen: ${body.sessionMinutes || body.minutes || '(not given)'} minutes

Nothing about their room, their headphones, their diagnosis, their history, or how well they usually concentrate.

WHAT FAILS:
1. A cognitive effect attributed to a frequency or band. Alpha, theta, beta and gamma are NAMES FOR FREQUENCY RANGES. Saying one produces learning, creativity, insight, alertness or focus is a claim the evidence does not support.
2. A clinical or therapeutic claim — that a sound helps anxiety, ADHD, insomnia, pain or any condition.
3. Research or studies invoked without being real and named.
4. A detail about the listener nobody supplied.
5. Promising a mental state, including when the promise hides inside the purpose — "designed to keep you alert" is the same claim as "keeps you alert". Describe how it will SOUND and what it will mask; let them judge the rest.
6. Narrating its own constraints at the reader — "without claiming guaranteed cognitive effects" is a rule the writer was given, not something the listener asked about.`,
    promise: 'Focus Sound Architect builds a soundscape for the thing the listener said is interfering with them, and explains how it will sound.',
    guard: router.outputGuard,
    userLanguage: body.userLanguage,
  });
}

const NO_QUOTE_RULE = 'Never place a double-quote (") character inside any JSON string value — write quoted phrases plainly or with single quotes, or it breaks the JSON.';

// Sudden-sound sensitivity: rain and fire have sharp transients — the prompt asks
// the model to avoid them, but enforce it in code too.
const hasSuddenSensitivity = (sensitivities) => {
  const text = Array.isArray(sensitivities) ? sensitivities.join(' ') : String(sensitivities || '');
  return /sudden/i.test(text);
};
const SHARP_TRANSIENT_TYPES = ['rain', 'fire'];

router.post('/focus-sound-architect', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  const startedAt = Date.now();
  try {
    const { task, environment, interference, soundPreferences, sensitivities, energyGoal, feedback, sessionMinutes, userLanguage } = req.body;

    if (!task) {
      return res.status(400).json({ error: 'Task type is required' });
    }

    // Normalize inputs — may arrive as string or array depending on frontend version
    const envList = Array.isArray(environment) ? environment : (environment ? [environment] : []);
    const prefList = Array.isArray(soundPreferences) ? soundPreferences : (soundPreferences ? [soundPreferences] : []);
    const sensList = Array.isArray(sensitivities) ? sensitivities : (sensitivities ? [sensitivities] : []);

    const prompt = withLanguage(`You are an expert in psychoacoustics and focus optimization. Design a personalized soundscape for someone who needs to focus.

USER PROFILE:
- Task: ${task}
- Environment: ${envList.join(', ') || 'not specified'}
- What is interfering: ${interference || 'not specified'}
- Planned listening time: ${sessionMinutes ? `${sessionMinutes} minutes` : 'open-ended'}
- Sound preferences: ${prefList.join(', ') || 'not specified'}
- Sensitivities: ${sensList.join(', ') || 'none specified'}
- Energy goal: ${energyGoal || 50}/100 (0=very calm, 100=energized)
${feedback ? `- Previous feedback: ${feedback}` : ''}

AVAILABLE SOUND LAYER TYPES (you MUST only use these exact type strings):
- "white_noise" — Equal energy across all frequencies. Good for masking speech.
- "pink_noise" — Lower frequencies louder. Warmer, less harsh. Good default.
- "brown_noise" — Deep, rumbling and warm. Useful when the listener prefers a low-frequency, less bright texture.
- "rain" — Rhythmic rain pattern. Masks distractions naturally.
- "ocean" — Slow wave patterns. Calming, good for creative work.
- "wind" — Gentle wind texture. Subtle, organic.
- "forest" — Layered nature sounds with gentle high-frequency texture.
- "fire" — Crackling fireplace. Warm, cozy, slightly stimulating.
- "cafe" — Coffee shop murmur. Low-level social noise for those who focus better with it.
- "binaural" — Binaural beats (requires headphones). Must include "hz" field (frequency difference):
    * Beat frequency may change the perceived rhythmic quality, but do NOT claim a specific mental-state, focus, learning, creativity, or sleep effect.
    * Treat binaural beats as an optional preference, not an evidence-backed performance enhancer.
    * "base_hz" should be between 150-300 Hz

Design a soundscape with 2-5 layers. Consider:
- The user's task (deep work needs fewer layers, creative work can handle more variety)
- What is interfering is more important than location: voices may call for stronger steady masking; too-quiet environments may need gentle atmosphere; restlessness may benefit from modest variation; sleepiness may call for a lighter, less soporific texture.
- Their environment (noisy office may need stronger masking, quiet home usually needs less)
- Sensitivities (sudden sound sensitivity = avoid fire/rain with sharp transients, high frequency sensitivity = prefer brown/pink over white)
- Energy goal (use texture, brightness, density and variation; do not claim binaural frequencies reliably create particular mental states)
- Prefer 2-3 layers unless there is a clear reason for more. Simpler mixes are easier to ignore while working.
- If soundPreferences is empty, choose appropriate layers yourself.
- If the planned session is 60+ minutes, include a practical after_30_minutes adjustment rather than making the user choose a separate evolving-scene mode.

Return ONLY valid JSON (no markdown, no preamble, no code fences):

{
  "soundscape_name": "A short evocative name for this soundscape — 3-6 words",
  "description": "1-2 sentences describing the overall feel and why it works for this person",
  "layers": [
    {
      "type": "brown_noise",
      "volume": 65,
      "label": "Deep Foundation",
      "why": "Why this layer was chosen for this specific user/task — one sentence"
    },
    {
      "type": "binaural",
      "volume": 25,
      "hz": 10,
      "base_hz": 200,
      "label": "Alpha Focus",
      "why": "Why this optional binaural texture may suit the user preference — do not claim proven cognitive effects"
    }
  ],
  "usage_tips": [
    "Specific, actionable tip about using this soundscape",
    "Another tip"
  ],
  "adjustment_guide": {
    "if_too_distracting": "What to adjust if it's too much — one sentence",
    "if_not_enough": "What to adjust if it's not enough stimulation — one sentence",
    "after_30_minutes": "How to adjust after the initial focus period — one sentence"
  }
}

CRITICAL:
- Each layer's "type" MUST be one of the exact strings listed above
- Volume is 0-100 (suggest realistic values, not all at 100)
- The total shouldn't be overwhelming — if using 4+ layers, keep individual volumes lower
- For binaural type, ALWAYS include "hz" (beat frequency 1-30) and "base_hz" (carrier 150-300)
- Be specific in "why" — reference the user's actual task and preferences
- Keep it practical — this will be synthesized and played immediately
- Never make medical, therapeutic, neurological, sleep-treatment, or guaranteed performance claims
- When binaural beats are included, say evidence for specific cognitive effects is mixed and headphones are required
- ${NO_QUOTE_RULE}`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: MODELS.FAST,
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'focus-sound-architect' });

    // Validate layer types
    const validTypes = ['white_noise', 'pink_noise', 'brown_noise', 'rain', 'ocean', 'wind', 'forest', 'fire', 'cafe', 'binaural'];
    if (parsed.layers) {
      parsed.layers = parsed.layers.filter(l => validTypes.includes(l.type));
      if (hasSuddenSensitivity(sensitivities)) {
        parsed.layers = parsed.layers.filter(l => !SHARP_TRANSIENT_TYPES.includes(l.type));
      }
    }

    // Fail-open: it wraps a working answer.
    try { await guardProse(parsed, req.body, startedAt); }
    catch (e) { console.error('[focus-sound-architect] guard skipped:', e.message); }

    res.json(parsed);

  } catch (error) {
    console.error('[FocusSoundArchitect] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// AI SCENE GENERATION — multi-phase evolving soundscapes
// ═══════════════════════════════════════════════════════════════

router.post('/focus-sound-architect/scene', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { task, environment, soundPreferences, sensitivities, energyGoal, totalMinutes, userLanguage } = req.body;

    if (!task) return res.status(400).json({ error: 'Task type is required' });
    const minutes = totalMinutes || 60;

    const envList = Array.isArray(environment) ? environment : (environment ? [environment] : []);
    const prefList = Array.isArray(soundPreferences) ? soundPreferences : (soundPreferences ? [soundPreferences] : []);
    const sensList = Array.isArray(sensitivities) ? sensitivities : (sensitivities ? [sensitivities] : []);

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

For binaural type, ALWAYS include "hz" (beat frequency 1-50) and "base_hz" (carrier 150-300).
The bands are named, and that is all they are — a name for a frequency range:
  * 1-4 Hz (delta), 4-8 Hz (theta), 8-14 Hz (alpha), 14-30 Hz (beta), 30-50 Hz (gamma)

Slower beats are experienced by many people as calmer and faster ones as more
stimulating, and that is the whole basis for choosing one. Do NOT tell the user
a frequency produces meditation, creativity, learning, alertness, peak
concentration or any other cognitive state — the evidence does not support it,
and a soundscape that promises a mental state it cannot deliver is worse than
one that just sounds right. Describe how it is likely to SOUND and let them
judge. If the visitor did not ask for binaural, you do not have to include it.

Two ways this goes wrong even when you are trying to be careful:
- Smuggling the claim into the purpose. "Designed to mask conversation while
  maintaining alertness" still promises a mental state; it has only moved the
  promise into the word "designed". Say what the sound DOES — masks speech
  frequencies, stays steady, has no sudden events — and stop there.
- Narrating the disclaimer. "This beat provides texture without claiming
  guaranteed cognitive effects" tells the reader about a rule you were given.
  They did not ask about your constraints. Just describe the texture.

DESIGN PRINCIPLES FOR EVOLVING SCENES:
1. Each phase should have a clear psychoacoustic purpose (ramp up, sustain, wind down, etc.)
2. Transitions between phases should feel natural — share at least one layer between adjacent phases
3. Energy arc should match the task: deep work needs gradual ramp then sustained plateau; creative work needs varied stimulation; sleep needs steady descent
4. Phase durations should be proportional to the total time (don't make phases too short)
5. Design 2-4 phases (never more)

Return ONLY valid JSON:

{
  "scene_name": "Evocative name for this sound journey — 3-6 words",
  "description": "1-2 sentences about the overall arc and why it works",
  "phases": [
    {
      "name": "Short phase name (2-3 words)",
      "durationMin": 15,
      "purpose": "Why this phase exists in the arc — one sentence",
      "layers": [
        { "type": "brown_noise", "volume": 50, "label": "Deep Foundation", "why": "Reason — one sentence" },
        { "type": "binaural", "volume": 20, "hz": 18, "base_hz": 250, "label": "Beta Boost", "why": "Reason — one sentence" }
      ]
    }
  ],
  "arc_explanation": "A sentence explaining the overall energy arc from phase to phase — 1-2 sentences",
  "transition_notes": ["Tip about how the transitions will feel", "Another note"]
}

CRITICAL:
- Phase durations MUST sum to exactly ${minutes} minutes
- Each layer "type" MUST be one of the valid types listed
- Volumes 0-100 (realistic, not all at 100)
- For binaural, ALWAYS include "hz" and "base_hz"
- 2-4 phases, each with 2-5 layers
- Be specific in "why" — reference the user's actual task and preferences
- ${NO_QUOTE_RULE}`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: MODELS.FAST,
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'focus-sound-architect-2' });

    // Validate layer types in all phases
    const validTypes = ['white_noise', 'pink_noise', 'brown_noise', 'rain', 'ocean', 'wind', 'forest', 'fire', 'cafe', 'binaural'];
    if (parsed.phases) {
      parsed.phases.forEach(phase => {
        if (phase.layers) {
          phase.layers = phase.layers.filter(l => validTypes.includes(l.type));
          if (hasSuddenSensitivity(sensitivities)) {
            phase.layers = phase.layers.filter(l => !SHARP_TRANSIENT_TYPES.includes(l.type));
          }
        }
      });
    }

    res.json(parsed);

  } catch (error) {
    console.error('[FocusSoundArchitect/scene] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// SMART FEEDBACK — returns volume adjustments, not regeneration
// ═══════════════════════════════════════════════════════════════

router.post('/focus-sound-architect/adjust', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { currentLayers, feedback, task, userLanguage } = req.body;

    if (!currentLayers || !feedback) {
      return res.status(400).json({ error: 'Current layers and feedback are required' });
    }

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
    { "index": 0, "volume": 45 },
    { "index": 1, "volume": 30 }
  ],
  "add_layer": null,
  "remove_index": null,
  "explanation": "Brief explanation of what these changes will do to the overall feel — 1-2 sentences"
}

For "add_layer", use null OR: { "type": "rain", "volume": 25, "label": "Gentle Rain", "why": "Reason — one sentence" }
For binaural add, include "hz" and "base_hz".
Valid layer types: white_noise, pink_noise, brown_noise, rain, ocean, wind, forest, fire, cafe, binaural.
For "remove_index", use null or the index number to remove.

CRITICAL:
- Be conservative — small changes (5-15 volume points) usually suffice
- If feedback is "too_distracting", simplify the mix: lower or remove busier layers and preserve one steady foundation
- If feedback is "too_sleepy", slightly reduce very low/dark layers and modestly increase a brighter steady texture; do not claim this treats fatigue
- If feedback is "not_enough", modestly increase the masking or variation most relevant to the user problem
- If "too harsh", reduce white_noise/high-frequency layers, boost brown_noise
- Keep the total soundscape balanced
- ${NO_QUOTE_RULE}`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: MODELS.FAST,
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'focus-sound-architect-3' });

    // Validate add_layer type
    const validTypes = ['white_noise', 'pink_noise', 'brown_noise', 'rain', 'ocean', 'wind', 'forest', 'fire', 'cafe', 'binaural'];
    if (parsed.add_layer && !validTypes.includes(parsed.add_layer.type)) {
      parsed.add_layer = null;
    }

    res.json(parsed);

  } catch (error) {
    console.error('[FocusSoundArchitect/adjust] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

router.outputStandard = 'v2';
// focus-sound-architect-v2. Reviewed 2026-08-26. Sound is subjective and the
// tool's job is to make something that sounds right for a stated interference.
// What it must not do is borrow authority it has not got: the frequency-band
// names are names, not mechanisms, and no noise colour treats anything.
router.outputGuard = {
  prohibit: [
    'cognitive_effect_claimed_for_a_frequency',   // "alpha for learning", "gamma for insight"
    'clinical_or_therapeutic_claim',              // "best for anxiety", "helps ADHD"
    'research_backing_that_was_not_cited',
    'invented_detail_about_the_listener',         // their room, their gear, their diagnosis
    'promise_of_a_mental_state',              // incl. "designed to keep you alert"
    'narrates_its_own_disclaimer',
  ],
  require: [
    'addresses_the_interference_they_named',
    'fulfills_tool_promise',
  ],
};

module.exports = router;
