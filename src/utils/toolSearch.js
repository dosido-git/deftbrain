// src/utils/toolSearch.js
//
// One relevance search for the tool catalog, shared by the home page search
// (DashBoard) and /tools (AllToolsPage). Before 2026-09-26 the two had
// separate matchers: the home one checked only title/description/tagline/tags
// for the WHOLE query as one substring, so "boss" found Giftology alone and a
// three-word query like "boss yells at me" found nothing. It also sorted by
// category, so the best match could sit at the bottom.
//
// What this does instead:
//   - Reads everything a tool says about the situations it handles: title,
//     tagline, description, tags, categories, the preamble (primer.when /
//     primer.get), the SEO title/description, and the Tool Finder metadata
//     (problems, capabilities, primary intent, when to recommend).
//   - Splits the query into words, drops filler ("my", "how", "what"),
//     matches word STARTS (so "boss" never hits "embossed", "rent" hits
//     "rental" and "renting"), and expands a small set of everyday synonyms
//     (boss → manager, supervisor).
//   - Ranks by how many of the query's words a tool covers, then by where
//     they matched (a title hit outweighs a hit deep in the finder text).
//   - Drops the long tail: with several words, a tool must cover at least
//     half of them; and anything scoring under a fifth of the best match is
//     noise from long descriptive fields, not a lead.
//
// Pure functions, no React — the index is built once per tool list.

import { toolFinderMetadata } from '../data/toolFinderMetadata';

// Tags that are also common English words — a sentence containing them is not
// about the tool. Same discipline as RelatedLinks' GENERIC_TAGS: add a tag
// only after a real query false-positived on it (2026-09-21: "won't RETURN my
// SECURITY deposit" surfaced Bookmark and ScamRadar).
const GENERIC_TAGS = new Set(['return', 'security']);

const STOPWORDS = new Set((
  'a an the and or but if so of to in on at for with from by about into over after before ' +
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
const WEIGHTS = {
  title:       [100, 30],
  tags:        [60, 18],
  tagline:     [55, 14],
  description: [45, 10],
  primer:      [45, 9],
  finder:      [60, 8],
  seo:         [30, 6],
  categories:  [25, 8],
};

function norm(s) {
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

function finderText(id) {
  const m = toolFinderMetadata[id];
  if (!m) return '';
  return [...(m.problems || []), ...(m.capabilities || []), ...(m.accepts || []), m.primaryIntent, m.whenToRecommend]
    .filter(Boolean).join(' ');
}

function buildEntry(tool, categories) {
  const p = tool.primer || {};
  const raw = {
    title: tool.title,
    tags: (tool.tags || []).join(' | '),
    tagline: tool.tagline,
    description: tool.description,
    primer: [p.when, p.get].filter(Boolean).join(' '),
    finder: finderText(tool.id),
    seo: [tool.seoTitle, tool.seoDescription].filter(Boolean).join(' '),
    categories: (categories || []).join(' | '),
  };
  const fields = {};
  for (const k of Object.keys(raw)) {
    const text = norm(raw[k]);
    fields[k] = { text: ` ${text} `, words: text ? text.split(' ') : [] };
  }
  return { tool, fields, tags: (tool.tags || []).map(t => norm(t)).filter(Boolean) };
}

// Build once per tool list: [{ tool, fields, tags }].
export function buildSearchIndex(tools, categoriesOf = t => t.categories || []) {
  return (tools || []).map(t => buildEntry(t, categoriesOf(t)));
}

// Same word, allowing ordinary endings — "rent" meets "rental"/"renting",
// "boss" never meets "embossed", "yell" never meets "yellow". `prefix` (a
// single word still being typed) also accepts any word it starts.
function hitsWord(field, term, prefix) {
  const s = stem(term);
  return field.words.some(w => stem(w) === s || (prefix && term.length >= 3 && w.startsWith(term)));
}

function scoreEntry(entry, phrase, terms, prefix) {
  let score = 0;
  let covered = 0;
  let direct = 0;
  const { fields } = entry;

  if (phrase.length >= 3) {
    for (const [k, [pw]] of Object.entries(WEIGHTS)) {
      if (fields[k].text.includes(` ${phrase}`)) score += pw;
    }
    // A sentence that CONTAINS one of the tool's tags ("my landlord kept my
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
    for (const [k, [, ww]] of Object.entries(WEIGHTS)) {
      if (hitsWord(fields[k], term, prefix)) { best = Math.max(best, ww); fieldsHit += 1; }
    }
    if (fieldsHit > 1) best += 2 * (fieldsHit - 1);
    let viaSynonym = 0;
    if (!best) {
      for (const syn of SYNONYMS[term] || []) {
        for (const [k, [, ww]] of Object.entries(WEIGHTS)) {
          if (hitsWord(fields[k], syn, false)) viaSynonym = Math.max(viaSynonym, Math.round(ww * 0.6));
        }
      }
    }
    if (best || viaSynonym) { covered += 1; score += best || viaSynonym; }
    if (best) direct += 1;
  }
  return { score, covered, direct };
}

// Typo tolerance for short single-word queries: "giftolgy" still finds
// Giftology. Only consulted when nothing matched normally.
function looseTitleMatch(query, title) {
  const q = norm(query).replace(/ /g, '');
  const t = norm(title).replace(/ /g, '');
  if (q.length < 4) return false;
  let qi = 0;
  for (let i = 0; i < t.length && qi < q.length; i++) if (t[i] === q[qi]) qi++;
  return qi === q.length;
}

// Returns tools ordered best-first. Empty query → [].
export function searchTools(index, query) {
  const phrase = norm(query);
  if (!phrase) return [];
  const effective = queryTerms(query);
  // Only filler ("how do I") — nothing to match on yet.
  if (!effective.length) return [];
  const need = effective.length <= 2 ? 1 : Math.ceil(effective.length / 2);
  // One word, possibly half-typed (the in-catalog box searches per keystroke).
  const prefix = effective.length === 1;

  const scored = [];
  for (const entry of index) {
    const { score, covered, direct } = scoreEntry(entry, phrase, effective, prefix);
    if (score > 0 && covered >= need) scored.push({ tool: entry.tool, score, covered, direct });
  }

  if (!scored.length) {
    return index.filter(e => looseTitleMatch(phrase, e.tool.title)).map(e => e.tool);
  }

  scored.sort((a, b) => b.covered - a.covered || b.score - a.score ||
    String(a.tool.title).localeCompare(String(b.tool.title)));
  // When enough tools match every word, partial matches are just noise
  // ("gift for my mom" should not list tools that only mention a mom).
  // Likewise a synonym is a fallback: one word with 3+ tools that use it
  // literally ("boss") doesn't need tools that only say "workplace".
  const full = scored.filter(s => s.covered === effective.length);
  const literal = scored.filter(s => s.direct > 0);
  const pool = effective.length > 1 ? (full.length >= 3 ? full : scored)
    : (literal.length >= 3 ? literal : scored);
  // Several words: a weak score means the matches were incidental words in
  // long descriptive text. One word: every tool that uses it is fair game.
  const floor = effective.length > 1 ? pool[0].score * 0.2 : 0;
  return pool.filter(s => s.score >= floor).map(s => s.tool);
}
