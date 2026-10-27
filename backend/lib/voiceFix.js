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

// Prompt words for the tool's own machinery (T6): Signal vs. Noise told a
// reader what "the research packet" held (owner's review, 2026-10-27). The
// reader saw sources, not a packet. English only, and only when the visitor
// did not use the word.
function internalWords(s) {
  if (typeof s !== 'string' || !/packet/i.test(s)) return s;
  return s
    .replace(/\b(?:the|this|our) (?:web )?(?:research )?packet's (\w+)/gi, (m, what) => `${/^T/.test(m) ? 'The' : 'the'} ${what} found here`)
    .replace(/\b(?:the|this|our) (?:web )?research packet\b/gi, m => (/^T/.test(m) ? 'The research found here' : 'the research found here'))
    .replace(/\b(?:the|this) packet\b/gi, m => (/^T/.test(m) ? 'The research found here' : 'the research found here'))
    .replace(/\bresearch packet\b/gi, 'research found here');
}

// The answer's own field names in its prose (T6): Missing Link wrote "the
// mechanism described in likely_gap" (owner's review, 2026-10-27). Prompts
// say never to; this is the code side. Only snake_case names that are keys of
// this very reply are touched, in any language: "in likely_gap" becomes
// "above", a bare one "the part above".
function collectKeys(v, out = new Set()) {
  if (Array.isArray(v)) v.forEach(x => collectKeys(x, out));
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) { if (/^[a-z]+(?:_[a-z0-9]+)+$/.test(k)) out.add(k); collectKeys(x, out); }
  return out;
}
function stripFieldNames(s, keys) {
  if (typeof s !== 'string' || !keys.size || !s.includes('_')) return s;
  let out = s;
  for (const k of keys) {
    if (!out.includes(k)) continue;
    out = out
      .replace(new RegExp(`\\b(?:in|under|see|from)\\s+(?:the\\s+)?${k}(?:\\s+(?:section|field|part))?\\b`, 'g'), 'above')
      .replace(new RegExp(`\\b(?:the\\s+)?${k}(?:\\s+(?:section|field|part))?\\b`, 'g'), 'the part above');
  }
  return out;
}

// A nullable field the model filled with the WORD null (T6): Name Storm
// printed "⚠️ null" under every name because the schema said "null if none"
// and the model wrote the string. A string that is only null/undefined is
// never content in any language, so it becomes a real null (renderers already
// hide null), and inside an array it is dropped. "None" is NOT included — it
// is a real enum value in several routes (severity, impact).
const NULL_WORD_RE = /^\s*(?:null|undefined)\s*$/i;
function dropNullWords(v, hit) {
  if (Array.isArray(v)) {
    const out = [];
    for (const x of v) { if (typeof x === 'string' && NULL_WORD_RE.test(x)) { hit.n++; continue; } out.push(dropNullWords(x, hit)); }
    return out;
  }
  if (v && typeof v === 'object') {
    for (const k of Object.keys(v)) {
      if (typeof v[k] === 'string' && NULL_WORD_RE.test(v[k])) { v[k] = null; hit.n++; } else v[k] = dropNullWords(v[k], hit);
    }
  }
  return v;
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
  const fixInternal = english && !/packet/i.test(typed);
  const json = res.json.bind(res);
  const fixBody = (body) => {
    if (res.statusCode < 400 && body && typeof body === 'object') {
      const visitor = { n: 0 };
      const spelt = { n: 0 };
      const marked = { n: 0 };
      const fix = (s) => {
        let out = s;
        { const f = stripMarkers(out); if (f !== out) marked.n++; out = f; }
        { const f = stripFieldNames(out, keys); if (f !== out) marked.n++; out = f; }
        if (fixVisitor) { const f = fixText(out); if (f !== out) visitor.n++; out = f; }
        if (fixInternal) { const f = internalWords(out); if (f !== out) marked.n++; out = f; }
        if (fixSpelling) { const f = spelling.fixText(out, keep); if (f !== out) spelt.n++; out = f; }
        return out;
      };
      const keys = collectKeys(body);
      const nulls = { n: 0 };
      try { body = dropNullWords(body, nulls); } catch (_) { /* never break a reply */ }
      try { body = mapStrings(body, fix); } catch (_) { /* never break a reply */ }
      if (nulls.n) console.log(`[voiceFix] ${req.path}: ${nulls.n} field(s) said "null" as text — made empty`);
      if (visitor.n) console.log(`[voiceFix] ${req.path}: ${visitor.n} field(s) said "visitor" — rewritten to "you"`);
      if (spelt.n) console.log(`[voiceFix] ${req.path}: ${spelt.n} field(s) had British spelling — made US`);
      if (marked.n) console.log(`[voiceFix] ${req.path}: ${marked.n} field(s) carried a prompt marker or internal word — removed`);
    }
    return body;
  };
  // Streamed (progressive) answers bypass res.json; lib/progressive.js
  // passes each frame through this instead.
  res.locals.fixBody = fixBody;
  res.json = (body) => json(fixBody(body));
  next();
}

module.exports = { voiceFixMiddleware, fixText, stripMarkers, dropNullWords, internalWords, stripFieldNames, collectKeys };
