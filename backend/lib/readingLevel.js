// readingLevel.js — a reading level computed by a named formula, not guessed.
//
// Owner's review of Plain Talk, 2026-10-27: "Graduate / Professional → 8th
// Grade" read as a measurement when the model made it up. The Flesch-Kincaid
// grade level is a published formula, so the page can say what it is and call
// it an estimate. English only — the formula's constants are fitted to
// English syllable and sentence lengths.
//
//   fleschKincaid(text) → 11.4 (US school grade, 1–18), or null for too little text

// Syllables by vowel groups, the usual approximation: a silent final e drops
// one, every word has at least one.
function syllables(word) {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 0;
  if (w.length <= 3) return 1;
  const groups = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '').match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups ? groups.length : 1);
}

function fleschKincaid(text) {
  const t = String(text || '').trim();
  const words = t.match(/[A-Za-z][A-Za-z'’-]*/g) || [];
  if (words.length < 30) return null; // too little text for a stable number
  const sentences = Math.max(1, (t.match(/[.!?]+(?=\s|$)/g) || []).length);
  const syl = words.reduce((n, w) => n + syllables(w), 0);
  const grade = 0.39 * (words.length / sentences) + 11.8 * (syl / words.length) - 15.59;
  // Clamped to grades 1–18: past that the formula only says "very hard".
  return Math.round(Math.min(18, Math.max(1, grade)) * 10) / 10;
}

module.exports = { fleschKincaid, syllables };

// Self-check: node backend/lib/readingLevel.js
if (require.main === module) {
  const assert = require('assert');
  assert.strictEqual(syllables('the'), 1);
  assert.strictEqual(syllables('computer'), 3);
  const easy = 'The cat sat on the mat. It was a good day. The sun was out and the sky was blue. We had fun. The dog ran to the park and back again with a ball in its mouth.';
  const hard = 'Autoregressive transformer architectures exhibit predictable performance improvements as a power-law function of computational resources, notwithstanding discontinuous emergent capabilities observed at particular parameter thresholds, suggesting considerable implications for the allocation of research expenditure.';
  assert.ok(fleschKincaid(easy) < 5, `easy ${fleschKincaid(easy)}`);
  assert.ok(fleschKincaid(hard) > 15, `hard ${fleschKincaid(hard)}`);
  assert.strictEqual(fleschKincaid('Too short.'), null);
  console.log('readingLevel ok', fleschKincaid(easy), fleschKincaid(hard));
}
