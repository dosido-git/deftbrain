const express = require('express');
const router = express.Router();
const https = require('https');
const { rateLimit } = require('../lib/rateLimiter');

// ═══════════════════════════════════════════════════════════════
// AUDIO CONTRACT (V2.1, 2026-09-07) — synthesize from IPA, not from spelling.
//
// POST /api/pronounce-it-right-audio
// Body: { source_text: string, ipa?: string, target_language_or_locale?: string }
// (word accepted as an alias for source_text — kept for callers on the
// pre-V2 contract.)
// Returns: audio/mpeg binary
//
// eleven_v3 understands IPA written directly in the text, wrapped in forward
// slashes (no XML/SSML needed) — see
// https://elevenlabs.io/docs/overview/capabilities/text-to-speech/best-practices
// and https://elevenlabs.io/docs/cookbooks/text-to-speech/pronunciation-dictionaries.
// When the analysis endpoint supplied a genuine IPA transcription, we speak
// THAT — the same string the written guide shows — instead of asking a
// multilingual model to guess a reading from raw letters. Whatever the
// visitor sees is exactly what plays; the two cannot disagree, because audio
// is no longer a second, independent guess.
//
// Falls back to plain multilingual synthesis of the raw word when no IPA was
// supplied (older callers, or a genuinely uncertain reading where the
// analysis endpoint left pronunciation.ipa empty on purpose — the frontend
// does not offer "Hear it" in that case, but this route stays usable
// directly). ElevenLabs' own docs put IPA consistency at 80-90%, not 100% —
// still a convenience, not proof, which is why the frontend keeps the
// "AI-generated" disclaimer regardless of which path this took.
//
// Cost: ~$0.003–$0.006 per request (ElevenLabs charges per character).
// ═══════════════════════════════════════════════════════════════

// Sarah — clear, neutral, works well across languages
const VOICE_ID = 'EXAVITQu4vr4xnSDxMaL';

// Best-effort ISO 639-1 extraction from a locale-ish string ("it-IT" -> "it").
// Wrong is not costly here — the field is optional and IPA already carries
// the actual pronunciation — so this only fires on a clean two-letter match.
function isoLanguageCode(locale) {
  const m = /^([a-z]{2})(?:[-_]|$)/i.exec(String(locale || '').trim());
  return m ? m[1].toLowerCase() : null;
}

router.post('/pronounce-it-right-audio', rateLimit(), async (req, res) => {
  const sourceText = req.body.source_text ?? req.body.word;
  const ipa = typeof req.body.ipa === 'string' ? req.body.ipa.trim() : '';

  if (!sourceText?.trim()) {
    return res.status(400).json({ error: 'Word is required' });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Audio service not configured' });
  }

  const languageCode = isoLanguageCode(req.body.target_language_or_locale);

  const body = {
    // IPA path: speak exactly the transcription the visitor already sees, via
    // eleven_v3's native slash-wrapped IPA support. No-IPA path: fall back to
    // eleven_multilingual_v2 guessing from the raw word, as before V2.1.
    text: ipa ? `/${ipa}/` : sourceText.trim(),
    model_id: ipa ? 'eleven_v3' : 'eleven_multilingual_v2',
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0.0,
      use_speaker_boost: true,
    },
  };
  if (languageCode) body.language_code = languageCode;

  const payload = JSON.stringify(body);

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
