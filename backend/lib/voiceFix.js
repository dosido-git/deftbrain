// "The visitor" in a reply (2026-10-08). Tool prompts call the person "the
// visitor", and the model sometimes copies the word into what that person
// reads: "Visitor will be carrying a laptop bag", "the visitor's records".
// Seen in SafeWalk, ConflictCoach, VelvetHammer and SpiralStopper. It reads
// cold and shows the machinery. Rather than chase it route by route, every
// /api JSON reply passes through here and the phrase is turned into "you".
//
// English only, and only when the visitor did not use the word themselves —
// someone asking about a visitor at their door keeps their own word.

const spelling = require('./usSpelling');

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

function mapStrings(v, fn) {
  if (typeof v === 'string') return fn(v);
  if (Array.isArray(v)) return v.map(x => mapStrings(x, fn));
  if (v && typeof v === 'object') { for (const k of Object.keys(v)) v[k] = mapStrings(v[k], fn); return v; }
  return v;
}

// Prompt-internal labels that reach the page as prose (T6, audit/DEFECT-
// TYPES.md): Future Proof printed "INFERRED: these signals are consistent
// with…". Prompts write evidence tags and worked-example labels in capitals
// with a colon; the visitor should see the sentence, not the tag. Only a tag
// FOLLOWED BY TEXT is removed — a field whose whole value is "INFERRED" is an
// enum a renderer may switch on, and stays. Any language: the tags stay
// English inside translated prose.
const MARKER_RE = /(^|[.!?]\s+|\n\s*)(?:OBSERVED|INFERRED|ASSUMED|EMERGING|PLAUSIBLE|SPECULATIVE|UNVERIFIED|VERIFIED|ESTABLISHED|ESTIMATED|HYPOTHESIS|UNKNOWN|GOOD|BAD|BETTER|VIOLATION|NOT A VIOLATION|RULE|NOTE TO SELF|INTERNAL)\s*:\s+(\S)/g;
function stripMarkers(s) {
  if (typeof s !== 'string' || !/[A-Z]{4,}[^:]*:/.test(s)) return s;
  return s.replace(MARKER_RE, (m, pre, first) => pre + first.toUpperCase());
}

// Express middleware for /api: wraps res.json. Strips prompt markers from
// every reply; for English replies also fixes "the visitor" and applies US
// spelling (lib/usSpelling.js) for US visitors.
function voiceFixMiddleware(req, res, next) {
  if (req.method !== 'POST') return next();
  const lang = String(req.body?.userLanguage || 'en').toLowerCase();
  const english = lang.startsWith('en');
  let typed = '';
  try { typed = JSON.stringify(req.body || {}); } catch (_) { typed = ''; }
  const fixVisitor = english && !/visitor/i.test(typed);
  const fixSpelling = english && spelling.wantsUS(req.body);
  const keep = fixSpelling ? spelling.typedBritish(req.body) : null;
  const json = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode < 400 && body && typeof body === 'object') {
      const visitor = { n: 0 };
      const spelt = { n: 0 };
      const marked = { n: 0 };
      const fix = (s) => {
        let out = s;
        { const f = stripMarkers(out); if (f !== out) marked.n++; out = f; }
        if (fixVisitor) { const f = fixText(out); if (f !== out) visitor.n++; out = f; }
        if (fixSpelling) { const f = spelling.fixText(out, keep); if (f !== out) spelt.n++; out = f; }
        return out;
      };
      try { body = mapStrings(body, fix); } catch (_) { /* never break a reply */ }
      if (visitor.n) console.log(`[voiceFix] ${req.path}: ${visitor.n} field(s) said "visitor" — rewritten to "you"`);
      if (spelt.n) console.log(`[voiceFix] ${req.path}: ${spelt.n} field(s) had British spelling — made US`);
      if (marked.n) console.log(`[voiceFix] ${req.path}: ${marked.n} field(s) carried a prompt marker (INFERRED: …) — removed`);
    }
    return json(body);
  };
  next();
}

module.exports = { voiceFixMiddleware, fixText, stripMarkers };
