const express = require('express');
const router = express.Router();
const https = require('https');
const { rateLimit } = require('../lib/rateLimiter');

// ═══════════════════════════════════════════════════════════════
// AUDIO — Generate spoken pronunciation via ElevenLabs
//
// POST /api/pronounce-it-right-audio
// Body: { word: string, languageOfOrigin?: string }
// Returns: audio/mpeg binary
//
// Uses eleven_multilingual_v2 — handles 29 languages natively.
// Sends the original word (not the phonetic string) so the model
// applies correct phonology for the language of origin.
//
// Cost: ~$0.003–$0.006 per request (ElevenLabs charges per character).
// ═══════════════════════════════════════════════════════════════

// Sarah — clear, neutral, works well across languages
const VOICE_ID = 'EXAVITQu4vr4xnSDxMaL';

router.post('/pronounce-it-right-audio', rateLimit(), async (req, res) => {
  const { word, languageOfOrigin } = req.body;

  if (!word?.trim()) {
    return res.status(400).json({ error: 'Word is required' });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Audio service not configured' });
  }

  const payload = JSON.stringify({
    text: word.trim(),
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
