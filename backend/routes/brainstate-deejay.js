const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

async function withRetry(fn, { retries = 3, baseDelayMs = 1500 } = {}) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const status = err?.status ?? err?.error?.status;
      const isOverloaded = status === 529 || err?.error?.error?.type === 'overloaded_error';
      if (isOverloaded && attempt < retries) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        console.warn(`[brainstate-deejay] Overloaded (529), retrying in ${delay}ms (attempt ${attempt + 1}/${retries})`);
        await new Promise(r => setTimeout(r, delay));
      } else {
        throw err;
      }
    }
  }
}

// ── Main playlist generation ──
router.post('/brainstate-deejay', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  const { currentState, desiredState, taskContext, musicPreferences, sensitivities, locale } = req.body;

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
    "from": "current state",
    "to": "desired state",
    "task": "task context if any"
  },
  "playlist_strategy": {
    "approach": "strategy name",
    "phase_1": "transition strategy",
    "phase_2": "main work strategy",
    "phase_3": "maintenance strategy",
    "why": "explanation for this approach"
  },
  "playlist": [
    {
      "phase": "Transition In",
      "duration": "10-15 min",
      "bpm_range": "60-80 BPM",
      "characteristics": "tempo, style, why",
      "genre_suggestions": ["genres that work"],
      "example_artists": ["artist examples"],
      "spotify_search": "search terms for this phase"
    },
    {
      "phase": "Main State",
      "duration": "30-60 min",
      "bpm_range": "90-110 BPM",
      "characteristics": "what makes this effective",
      "genre_suggestions": ["genres"],
      "example_artists": ["artists"],
      "spotify_search": "search terms"
    },
    {
      "phase": "Maintenance",
      "duration": "ongoing",
      "bpm_range": "80-100 BPM",
      "characteristics": "sustaining properties",
      "genre_suggestions": ["genres"],
      "spotify_search": "search terms"
    }
  ],
  "audio_settings": {
    "recommended_volume": "level and why",
    "headphones": "recommended or not",
    "avoid": ["what not to do"]
  },
  "alternative_playlists": [
    {
      "name": "If you need MORE stimulation",
      "change": "what to adjust",
      "when": "when to use this"
    },
    {
      "name": "If this is TOO stimulating",
      "change": "what to adjust",
      "when": "when to use this"
    }
  ],
  "science_note": "Brief explanation of why this works"
}

CRITICAL: Return ONLY valid JSON. No preamble, no markdown.`, locale);

  try {
    const msg = await withRetry(() => anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    }));
    const parsed = JSON.parse(cleanJsonResponse(msg.content.find(i => i.type === 'text')?.text || ''));
    res.json(parsed);
  } catch (error) {
    console.error('Brainstate Deejay error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate playlist' });
  }
});

// ── Playlist adjustment ──
router.post('/brainstate-deejay/adjust', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  const { currentState, desiredState, taskContext, musicPreferences, sensitivities, feedback, locale } = req.body;

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

Return the same JSON structure as the original playlist, adjusted for the feedback. CRITICAL: Return ONLY valid JSON. No preamble, no markdown.`, locale);

  try {
    const msg = await withRetry(() => anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    }));
    const parsed = JSON.parse(cleanJsonResponse(msg.content.find(i => i.type === 'text')?.text || ''));
    res.json(parsed);
  } catch (error) {
    console.error('Brainstate Deejay adjust error:', error);
    res.status(500).json({ error: error.message || 'Failed to adjust playlist' });
  }
});

module.exports = router;
