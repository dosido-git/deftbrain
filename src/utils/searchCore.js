// src/utils/searchCore.js
//
// The matching and ranking behind every DeftBrain search: the home page and
// /tools (via toolSearch.js), and the static guide pages (via
// public/search/deft-search.js, which scripts/build-search-assets.js builds
// from THIS file). One file, so a tool and a guide are judged the same way
// wherever someone searches.
//
// CONSTRAINT: no imports, and top-level `export` only on `export function` /
// `export const` — the build step strips the word `export` and wraps the file
// for the browser. Anything else here would break the static pages' search.
//
// How it ranks (2026-09-26):
//   - Splits the query into words, drops filler ("my", "how", "what"),
//     matches whole words with ordinary endings (so "boss" never hits
//     "embossed", "rent" hits "rental"), and falls back to a short list of
//     everyday synonyms (boss → manager, supervisor).
//   - Ranks by how many of the query's words a document uses literally (a
//     synonym match helps a document qualify but never outranks the real
//     word), then by where they matched — each caller supplies field weights
//     (a title hit outweighs a hit deep in long descriptive text).
//   - Drops the long tail: with several words, a document must cover at
//     least half of them; partial and synonym-only matches go when enough
//     full / literal matches exist; and with several words, anything under a
//     fifth of the best score is incidental.

// Tags that are also common English words — a sentence containing them is not
// about the tool. Same discipline as RelatedLinks' GENERIC_TAGS: add a tag
// only after a real query false-positived on it (2026-09-21: "won't RETURN my
// SECURITY deposit" surfaced Bookmark and ScamRadar).
const GENERIC_TAGS = new Set(['return', 'security']);

const STOPWORDS = new Set((
  'a an the and or but if so of to in on at for with from by about into over after before per via ' +
  'i im me my mine we our you your he she it its they them their his her this that these those ' +
  'is am are was were be been being do does did doing have has had having will would should could can cant ' +
  'not no dont doesnt didnt wont just really very too also still even ' +
  'what whats how hows why when where which who whom whose ' +
  'want need help get got make some any all more most much many out up ' +
  'tool tools thing things something someone somebody'
).split(/\s+/));

// Everyday words people search with → the words the catalog actually uses.
// One direction per entry; each list includes the original word implicitly.
// Kept deliberately short: add a pair only when a real query misses.
const SYNONYMS = {
  boss: ['manager', 'supervisor', 'workplace'],
  manager: ['boss', 'supervisor'],
  supervisor: ['boss', 'manager'],
  coworker: ['colleague', 'workplace'],
  colleague: ['coworker', 'workplace'],
  job: ['work', 'career', 'workplace'],
  raise: ['salary', 'negotiation', 'promotion'],
  salary: ['raise', 'pay', 'negotiation'],
  fired: ['laid', 'layoff', 'termination'],
  landlord: ['rental', 'lease', 'tenant', 'rent'],
  apartment: ['rental', 'lease', 'tenant'],
  doctor: ['medical', 'appointment', 'health'],
  sick: ['health', 'symptoms', 'medical'],
  partner: ['relationship', 'spouse'],
  girlfriend: ['relationship', 'partner', 'dating'],
  boyfriend: ['relationship', 'partner', 'dating'],
  husband: ['relationship', 'partner', 'spouse'],
  wife: ['relationship', 'partner', 'spouse'],
  date: ['dating'],
  fight: ['conflict', 'argument'],
  argument: ['conflict', 'argue', 'debate'],
  sorry: ['apology', 'apologize'],
  apologize: ['apology', 'sorry'],
  anxious: ['anxiety', 'nervous', 'worry'],
  nervous: ['anxiety', 'nerves'],
  stressed: ['stress', 'overwhelmed'],
  overwhelmed: ['stress', 'burnout'],
  tired: ['energy', 'fatigue', 'burnout'],
  money: ['budget', 'finances', 'cost'],
  expensive: ['price', 'cost', 'markup'],
  scam: ['fraud', 'fake', 'suspicious'],
  email: ['message', 'inbox'],
  text: ['message', 'texting'],
  speech: ['presentation', 'toast', 'speaking'],
  presentation: ['speech', 'pitch', 'presenting'],
  interview: ['job', 'hiring'],
  cook: ['cooking', 'recipe', 'meal'],
  dinner: ['meal', 'recipe', 'cooking'],
  trip: ['travel', 'vacation'],
  vacation: ['travel', 'trip'],
  flight: ['travel', 'airport', 'layover'],
  gift: ['present', 'gifts'],
  mom: ['mother', 'parent', 'family'],
  dad: ['father', 'parent', 'family'],
  focus: ['concentration', 'distracted', 'procrastination'],
  procrastinating: ['procrastination', 'focus', 'stuck'],
  decide: ['decision', 'choice', 'choose'],
  choose: ['decision', 'choice', 'decide'],
};

// Field weights: [whole-phrase hit, per-word hit]. A tool's title is the
// strongest evidence; the finder/SEO text is broad, so it counts but less.
export const TOOL_WEIGHTS = {
  title:       [100, 30],
  tags:        [60, 18],
  tagline:     [55, 14],
  description: [45, 10],
  primer:      [45, 9],
  finder:      [60, 8],
  seo:         [30, 6],
  categories:  [25, 8],
};

// A guide's fields. Its title and deck say what it's about; the step names
// are its outline; the tool is the one its call-to-action points to.
export const GUIDE_WEIGHTS = {
  title:       [100, 30],
  description: [45, 10],
  steps:       [30, 8],
  category:    [25, 8],
  tool:        [20, 6],
};

export function norm(s) {
  return String(s || '').toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}

// Light stemmer — enough that "negotiating"/"negotiation"/"negotiate",
// "apology"/"apologize" and "bills"/"bill" reduce to the same stem.
const SUFFIXES = ['ions', 'ion', 'ings', 'ing', 'izes', 'ize', 'ises', 'ise',
  'ies', 'ied', 'ers', 'er', 'ed', 'es', 'als', 'al', 'ments', 'ment', 'ly', 'y', 's', 'e'];
function stem(w) {
  if (w.length <= 3) return w;
  for (const suf of SUFFIXES) {
    if (w.endsWith(suf) && w.length - suf.length >= 3) return w.slice(0, w.length - suf.length);
  }
  return w;
}

export function queryTerms(query) {
  const words = norm(query).split(' ').filter(w => w.length > 1 && !STOPWORDS.has(w));
  return [...new Set(words)];
}

// Same word, allowing ordinary endings — "rent" meets "rental"/"renting",
// "boss" never meets "embossed", "yell" never meets "yellow". `prefix` (a
// single word still being typed) also accepts any word it starts — from 4
// letters, or 3 in a title ("bil" → Bill Rescue, but "cat" ≠ "category").
function hitsWord(field, term, prefix) {
  const s = stem(term);
  return field.words.some(w => stem(w) === s || (prefix && w.startsWith(term)));
}

function scoreEntry(entry, phrase, terms, prefix, weights) {
  let score = 0;
  let covered = 0;
  let direct = 0;
  const { fields } = entry;
  // A caller may weight a field this document doesn't have.
  const has = k => !!fields[k];

  if (phrase.length >= 3) {
    for (const [k, [pw]] of Object.entries(weights)) {
      if (has(k) && fields[k].text.includes(` ${phrase}`)) score += pw;
    }
    // A sentence that CONTAINS one of the document's tags ("my landlord kept my
    // deposit" ⊃ "deposit") — the direction the old search handled.
    for (const tag of entry.tags) {
      if (tag.length >= 4 && !GENERIC_TAGS.has(tag) && ` ${phrase} `.includes(` ${tag} `)) score += 24;
    }
  }

  for (const term of terms) {
    // Strongest field it appears in, plus a little for each extra field —
    // a word a tool mentions everywhere is more central to it.
    let best = 0;
    let fieldsHit = 0;
    for (const [k, [, ww]] of Object.entries(weights)) {
      if (has(k) && hitsWord(fields[k], term, prefix && (term.length >= 4 || (k === 'title' && term.length >= 3)))) { best = Math.max(best, ww); fieldsHit += 1; }
    }
    if (fieldsHit > 1) best += 2 * (fieldsHit - 1);
    let viaSynonym = 0;
    if (!best) {
      for (const syn of SYNONYMS[term] || []) {
        for (const [k, [, ww]] of Object.entries(weights)) {
          if (has(k) && hitsWord(fields[k], syn, false)) viaSynonym = Math.max(viaSynonym, Math.round(ww * 0.6));
        }
      }
    }
    if (best || viaSynonym) { covered += 1; score += best || viaSynonym; }
    if (best) direct += 1;
  }
  return { score, covered, direct };
}

// Typo tolerance: "giftolgy" still finds Giftology. Only consulted when
// nothing matched normally, and only against the `title` field — each query
// word must be within one or two edits (by length) of some title word, or the
// whole query of the whole title run together.
function editDistance(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, k) => k);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let k = 1; k <= b.length; k++) {
      cur[k] = Math.min(prev[k] + 1, cur[k - 1] + 1, prev[k - 1] + (a[i - 1] === b[k - 1] ? 0 : 1));
      rowMin = Math.min(rowMin, cur[k]);
    }
    if (rowMin > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}
function close(a, b) {
  if (a.length < 4) return false;
  const max = a.length >= 7 ? 2 : 1;
  return editDistance(a, b, max) <= max;
}
function looseTitleMatch(terms, titleField) {
  const joined = titleField.words.join('');
  if (terms.length && close(terms.join(''), joined)) return true;
  return terms.length > 0 && terms.every(t => titleField.words.some(w => close(t, w)));
}

// One searchable document. `item` is whatever the caller wants back (a tool,
// a guide); `raw` maps field name → text; `tags` are matched whole.
export function makeDoc(item, raw, tags) {
  const fields = {};
  for (const k of Object.keys(raw)) {
    const text = norm(raw[k]);
    fields[k] = { text: ` ${text} `, words: text ? text.split(' ') : [] };
  }
  return { item, fields, tags: (tags || []).map(t => norm(t)).filter(Boolean) };
}

// Documents best-first as their `item`s. Empty or filler-only query → [].
// `weights` maps field name → [whole-phrase hit, per-word hit].
export function rankDocs(docs, query, weights) {
  const phrase = norm(query);
  if (!phrase) return [];
  const effective = queryTerms(query);
  // Only filler ("how do I") — nothing to match on yet.
  if (!effective.length) return [];
  const need = effective.length <= 2 ? 1 : Math.ceil(effective.length / 2);
  // One word, possibly half-typed (the in-catalog box searches per keystroke).
  const prefix = effective.length === 1;

  const scored = [];
  for (const doc of docs) {
    const { score, covered, direct } = scoreEntry(doc, phrase, effective, prefix, weights);
    if (score > 0 && covered >= need) scored.push({ item: doc.item, title: doc.fields.title ? doc.fields.title.text : '', score, covered, direct });
  }

  if (!scored.length) {
    return docs.filter(d => d.fields.title && looseTitleMatch(effective, d.fields.title)).map(d => d.item);
  }

  // Words matched literally outrank words matched only through a synonym:
  // "per my last email" is about email, not about Giftology's gift MESSAGE.
  scored.sort((a, b) => b.direct - a.direct || b.score - a.score || a.title.localeCompare(b.title));
  // When enough documents match every word, partial matches are just noise
  // ("gift for my mom" should not list tools that only mention a mom).
  // Likewise a synonym is a fallback: one word with 3+ documents that use it
  // literally ("boss") doesn't need ones that only say "workplace".
  const full = scored.filter(s => s.covered === effective.length);
  const literal = scored.filter(s => s.direct > 0);
  const pool = effective.length > 1 ? (full.length >= 3 ? full : scored)
    : (literal.length >= 3 ? literal : scored);
  // Several words: a weak score means the matches were incidental words in
  // long descriptive text. One word: everything that uses it is fair game.
  const floor = effective.length > 1 ? pool[0].score * 0.2 : 0;
  return pool.filter(s => s.score >= floor).map(s => s.item);
}
