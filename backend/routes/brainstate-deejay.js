const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

// ── Main playlist generation ──
router.post('/brainstate-deejay', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  const { currentState, desiredState, taskContext, musicPreferences, sensitivities, userLanguage } = req.body;

  if (!currentState || !desiredState) {
    return res.status(400).json({ error: 'Current state and desired state are required' });
  }

  const sensitivityList = Array.isArray(sensitivities) && sensitivities.length > 0
    ? sensitivities.join(', ')
    : 'None specified';

  const prompt = withLanguage(`You are a music therapy specialist who creates science-backed playlists for cognitive state transitions.

CURRENT STATE: ${currentState}
DESIRED STATE: ${desiredState}
TASK CONTEXT: ${taskContext || 'Not specified'}
MUSIC PREFERENCES: ${musicPreferences || 'Not specified'}
LISTENING SENSITIVITIES: ${sensitivityList}

STATE TRANSITION SCIENCE:
- Anxious/Stressed -> Calm: 60-80 BPM, predictable patterns, nature sounds, no surprises
- Scattered/Unfocused -> Focused: 90-110 BPM, instrumental, progressive builds
- Low Energy/Tired -> Energized: 120-140 BPM, major keys, familiar songs
- Overwhelmed -> Grounded: Minimalist, repetitive, no lyrics, low complexity
- Restless/Fidgety -> Focused: Moderate tempo with strong rhythm, satisfying patterns
- Irritable -> Calm: Slow descent from moderate tempo, warm tones, no sharp edges

LISTENING SENSITIVITY CONSIDERATIONS:
- "No sudden sounds": Ensure all transitions are gradual, no sharp attacks
- "Need predictability": Consistent patterns, no genre-hopping, steady tempo
- "Need novelty": Varied within genre, unexpected but pleasant shifts
- "Sensitive to heavy bass": Lighter low end, emphasize mid/high frequencies
- "Can't handle silence": Continuous ambient texture, no gaps between tracks
- "Need strong rhythm": Clear beat, percussion-forward selections
- "Vocals are distracting": Instrumental only, or non-English vocals as texture
- "Repetition is soothing": Loop-friendly, minimal variation, drone elements

PLAYLIST STRUCTURE:
Create progressive 3-phase playlist:
1. Transition In (10-15 min): Bridge from current to desired state
2. Main State (30-60 min): Sustain desired state for task
3. Maintenance (as needed): Keep state without cognitive load

OUTPUT (JSON only):
{
  "state_transition": {
    "from": "current state — one sentence",
    "to": "desired state — one sentence",
    "task": "task context if any — one sentence"
  },
  "playlist_strategy": {
    "approach": "strategy name. Nothing else.",
    "phase_1": "transition strategy — one sentence",
    "phase_2": "main work strategy — one sentence",
    "phase_3": "maintenance strategy — one sentence",
    "why": "explanation for this approach — one sentence"
  },
  "playlist": [
    {
      "phase": "Transition In — 2-4 words",
      "duration": "10-15 min",
      "bpm_range": "60-80 BPM",
      "characteristics": "tempo, style, why — one sentence",
      "genre_suggestions": ["genres that work"],
      "example_artists": ["Two or three artists whose catalogue sits in this sound, as reference points for the search rather than a prescription. Only artists you are certain both exist and fit — one that contradicts the characteristics above undermines the phase."],
      "search_recipe": "The sound to look for, written as terms someone can paste into a music service: instrumentation, texture, tempo band, and the exclusions that matter — for example warm instrumental lo-fi, soft drums, 70-85 BPM, no vocals. This is this phase's deliverable, not a track list."
    },
    {
      "phase": "Main State — 2-4 words",
      "duration": "30-60 min",
      "bpm_range": "90-110 BPM",
      "characteristics": "what makes this effective — one sentence",
      "genre_suggestions": ["genres"],
      "example_artists": ["artists"],
      "search_recipe": "The sound to look for, as pasteable search terms: instrumentation, texture, tempo band, exclusions. Not a track list."
    },
    {
      "phase": "Maintenance — 2-4 words",
      "duration": "ongoing",
      "bpm_range": "80-100 BPM",
      "characteristics": "sustaining properties — one sentence",
      "genre_suggestions": ["genres"],
      "search_recipe": "The sound to look for, as pasteable search terms: instrumentation, texture, tempo band, exclusions. Not a track list."
    }
  ],
  "audio_settings": {
    "recommended_volume": "How loud, described by what it should achieve rather than as a percentage — loud enough to soften what is around them without asking for attention of its own. A number would be false precision: it depends on the headphones, the device, the room and the recording, none of which you know. — one sentence",
    "headphones": "recommended or not — one sentence",
    "avoid": ["Things that break the effect — lyrics in a language they think in, sudden tempo changes, dramatic dynamic swings, ads or spoken interruptions. Do NOT tell them to avoid shuffle: nothing here is a playable ordered playlist, so there is no sequence for shuffle to disturb."]
  },
  "alternative_playlists": [
    {
      "name": "If you need MORE stimulation — 3-6 words",
      "change": "what to adjust — one sentence",
      "when": "when to use this — one sentence"
    },
    {
      "name": "If this is TOO stimulating — 3-6 words",
      "change": "what to adjust — one sentence",
      "when": "when to use this — one sentence"
    }
  ],
  "why_this_may_help": "Why this PROGRESSION may help, in plain language and without borrowing scientific authority. Describe what the music is doing — starting near where their energy already is so the change is not abrupt, then shifting tempo, rhythm and complexity toward the destination sound — and say music affects people differently, so it is a starting point to adjust. Never cite research, neural oscillations, entrainment, frequency bands or any named effect: nothing was retrieved, and a specific mechanism stated confidently is this tool sounding most authoritative exactly where it knows least. If you mention a tempo change, get its direction right and keep it consistent with the phase bpm_ranges. — 2-3 sentences"
}

CRITICAL — NAME NOTHING YOU CANNOT STAND BEHIND. In example_artists, name only artists you are certain exist and whose work actually matches that phase's characteristics. An artist who contradicts the phase — vocals where you said no vocals, solo piano where you said steady percussion — is worse than naming none, because the reader trusts the pairing. Fewer is always allowed. The search_recipe is the deliverable and carries the phase on its own.

Never place a double-quote (") character inside any JSON string value — write track or album titles plainly or with single quotes, or it breaks the JSON.

Return ONLY valid JSON. No preamble, no markdown.`, userLanguage);

  try {
    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    }, { label: 'BrainstateDeejay' });
    // Normalize: Claude occasionally returns playlist as a keyed object instead of array
    if (parsed.playlist && !Array.isArray(parsed.playlist) && typeof parsed.playlist === 'object') {
      parsed.playlist = Object.values(parsed.playlist);
    }
    if (!parsed.playlist || !Array.isArray(parsed.playlist) || parsed.playlist.length === 0) {
      return res.status(500).json({ error: 'Could not create playlist. Please try again.' });
    }
    res.json(parsed);
  } catch (error) {
    console.error('Brainstate Deejay error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.'});
  }
});

// ── Playlist adjustment ──
router.post('/brainstate-deejay/adjust', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  const { currentState, desiredState, taskContext, musicPreferences, sensitivities, feedback, userLanguage } = req.body;

  if (!feedback) {
    return res.status(400).json({ error: 'Feedback is required for adjustment' });
  }

  const sensitivityList = Array.isArray(sensitivities) && sensitivities.length > 0
    ? sensitivities.join(', ')
    : 'None specified';

  const prompt = withLanguage(`You are a music therapy specialist adjusting an existing playlist recommendation.

CURRENT STATE: ${currentState || 'Not specified'}
DESIRED STATE: ${desiredState || 'Not specified'}
TASK CONTEXT: ${taskContext || 'Not specified'}
MUSIC PREFERENCES: ${musicPreferences || 'Not specified'}
LISTENING SENSITIVITIES: ${sensitivityList}

USER FEEDBACK ON PREVIOUS PLAYLIST: "${feedback}"

Based on this feedback, generate an adjusted playlist that addresses the issue. Keep what was working; fix what wasn't.

Return the same JSON structure as the original playlist, adjusted for the feedback. CRITICAL — NAME NOTHING YOU CANNOT STAND BEHIND. In example_artists, name only artists you are certain exist and whose work actually matches that phase's characteristics. An artist who contradicts the phase — vocals where you said no vocals, solo piano where you said steady percussion — is worse than naming none, because the reader trusts the pairing. Fewer is always allowed. The search_recipe is the deliverable and carries the phase on its own.

Never place a double-quote (") character inside any JSON string value — write track or album titles plainly or with single quotes, or it breaks the JSON.

Return ONLY valid JSON. No preamble, no markdown.`, userLanguage);

  try {
    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    }, { label: 'BrainstateDeejayAdjust' });
    if (!parsed.playlist) {
      return res.status(500).json({ error: 'Could not adjust playlist. Please try again.' });
    }
    res.json(parsed);
  } catch (error) {
    console.error('Brainstate Deejay adjust error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.'});
  }
});

module.exports = router;
