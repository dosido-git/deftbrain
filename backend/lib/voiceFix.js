// "The visitor" in a reply (2026-10-08). Tool prompts call the person "the
// visitor", and the model sometimes copies the word into what that person
// reads: "Visitor will be carrying a laptop bag", "the visitor's records".
// Seen in SafeWalk, ConflictCoach, VelvetHammer and SpiralStopper. It reads
// cold and shows the machinery. Rather than chase it route by route, every
// /api JSON reply passes through here and the phrase is turned into "you".
//
// English only, and only when the visitor did not use the word themselves —
// someone asking about a visitor at their door keeps their own word.

const BE = { is: 'are', was: 'were', has: 'have', does: 'do', "isn't": "aren't", "wasn't": "weren't", "hasn't": "haven't", "doesn't": "don't" };

function verbFor(w) {
  const lower = w.toLowerCase();
  if (BE[lower]) return BE[lower];
  if (/(?:ches|shes|sses|xes|zes)$/.test(lower)) return w.slice(0, -2);
  if (/[^aeiou]ies$/.test(lower)) return w.slice(0, -3) + 'y';
  if (/[^s]s$/.test(lower) && lower.length > 3) return w.slice(0, -1);
  return w;
}

function fixText(s) {
  if (!/visitor/i.test(s)) return s;
  return s
    .replace(/\b(the )?visitor's\b/gi, (m) => (/^T|^V/.test(m) ? 'Your' : 'your'))
    .replace(/\b(the )?visitor (will|would|can|could|should|may|might|must|did|had|needs to|wants to)\b/gi, (m, the, aux) => `${/^T|^V/.test(m) ? 'You' : 'you'} ${aux}`)
    .replace(/\b(the )?visitor ([a-z']+)\b/gi, (m, the, verb) => `${/^T|^V/.test(m) ? 'You' : 'you'} ${verbFor(verb)}`)
    .replace(/\b(the )?visitor\b/gi, (m) => (/^T|^V/.test(m) ? 'You' : 'you'));
}

function fixDeep(v, counter) {
  if (typeof v === 'string') { const f = fixText(v); if (f !== v) counter.n++; return f; }
  if (Array.isArray(v)) return v.map(x => fixDeep(x, counter));
  if (v && typeof v === 'object') { for (const k of Object.keys(v)) v[k] = fixDeep(v[k], counter); return v; }
  return v;
}

// Express middleware for /api: wraps res.json.
function voiceFixMiddleware(req, res, next) {
  if (req.method !== 'POST') return next();
  const lang = String(req.body?.userLanguage || 'en').toLowerCase();
  if (!lang.startsWith('en')) return next();
  let typed = '';
  try { typed = JSON.stringify(req.body || {}); } catch (_) { typed = ''; }
  if (/visitor/i.test(typed)) return next();
  const json = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode < 400 && body && typeof body === 'object') {
      const counter = { n: 0 };
      try { body = fixDeep(body, counter); } catch (_) { /* never break a reply */ }
      if (counter.n) console.log(`[voiceFix] ${req.path}: ${counter.n} field(s) said "visitor" — rewritten to "you"`);
    }
    return json(body);
  };
  next();
}

module.exports = { voiceFixMiddleware, fixText };
