const express = require('express');
const router = express.Router();
const https = require('https');
const { rateLimit } = require('../lib/rateLimiter');

// ═══════════════════════════════════════════════════════════════
// AUDIO CONTRACT (V2, 2026-09-07) — Generate spoken pronunciation via
// ElevenLabs, ONLY for readings the frontend has already judged safe.
//
// POST /api/pronounce-it-right-audio
// Body: { source_text: string, target_language_or_locale?: string, selected_reading?: string }
// (word / languageOfOrigin accepted as aliases for source_text /
// target_language_or_locale — kept for callers on the pre-V2 contract.)
// Returns: audio/mpeg binary
//
// Audio is a convenience, not evidence. The pronunciation-analysis endpoint
// (`/api/pronounce-it-right`) decides whether a reading is safe to voice at
// all — it sets `audio.safe_to_offer` and `audio.reading_is_constrained`, and
// the frontend must NOT render the "Hear it" control unless both are true
// (names, brands, places, acronyms, homographs, and anything with more than
// one established reading default to unavailable). This route does not
// re-derive that judgment — it trusts the caller already gated on it.
//
// HONEST LIMITATION: eleven_multilingual_v2 has no reading/locale override —
// it auto-detects pronunciation language from the text itself, so
// `target_language_or_locale` and `selected_reading` are accepted and logged
// for the day this (or a future TTS backend) supports constraining playback,
// but are NOT currently able to force a specific reading. That is exactly
// why the frontend gate above — not this route — is what keeps written guide
// and audio from disagreeing: when we can't be sure the two would agree, we
// don't call this endpoint at all.
//
// Cost: ~$0.003–$0.006 per request (ElevenLabs charges per character).
// ═══════════════════════════════════════════════════════════════

// Sarah — clear, neutral, works well across languages
const VOICE_ID = 'EXAVITQu4vr4xnSDxMaL';

router.post('/pronounce-it-right-audio', rateLimit(), async (req, res) => {
  const sourceText = req.body.source_text ?? req.body.word;

  if (!sourceText?.trim()) {
    return res.status(400).json({ error: 'Word is required' });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Audio service not configured' });
  }

  const payload = JSON.stringify({
    text: sourceText.trim(),
    model_id: 'eleven_multilingual_v2',
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0.0,
      use_speaker_boost: true,
    },
  });

  const options = {
    hostname: 'api.elevenlabs.io',
    path: `/v1/text-to-speech/${VOICE_ID}`,
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
      'Accept': 'audio/mpeg',
    },
  };

  try {
    const audioBuffer = await new Promise((resolve, reject) => {
      const externalReq = https.request(options, (externalRes) => {
        if (externalRes.statusCode !== 200) {
          reject(new Error(`ElevenLabs returned ${externalRes.statusCode}`));
          return;
        }
        const chunks = [];
        externalRes.on('data', chunk => chunks.push(chunk));
        externalRes.on('end', () => resolve(Buffer.concat(chunks)));
      });
      externalReq.on('error', reject);
      externalReq.write(payload);
      externalReq.end();
    });

    res.set('Content-Type', 'audio/mpeg');
    res.set('Content-Length', audioBuffer.length);
    res.set('Cache-Control', 'no-store'); // audio is per-word, no benefit to caching
    res.send(audioBuffer);

  } catch (err) {
    console.error('[PronounceItRight/audio] Failed:', err.message);
    res.status(500).json({ error: 'Audio generation failed' });
  }
});

module.exports = router;
