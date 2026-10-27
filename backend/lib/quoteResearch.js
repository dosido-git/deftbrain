// Verified quotation retrieval for Someone Said It Better.
// Uses the shared groundedFacts web-search/cache primitive. The main generation
// call never invents quotation text; it may only choose from this packet.

const { groundedFacts, groundedData, groundedStatus, normalizeKeyPart } = require('./groundedFacts');
const { NO_QUOTE_RULE } = require('./factCheck');
const { checkSourceLink } = require('./publicUrl');

const TTL_MS = Number(process.env.QUOTE_RESEARCH_TTL_MS || 30 * 24 * 60 * 60 * 1000);
const COLD_WAIT_MS = Number(process.env.QUOTE_RESEARCH_COLD_WAIT_MS || 45_000);
const TIMEOUT_MS = Number(process.env.QUOTE_RESEARCH_TIMEOUT_MS || 90_000);
// 5 -> 6, and the packet target below 5-8 -> 6-10: a request that lands one
// verifiable quote short of the 2-quote minimum fails the whole search, so a
// slightly wider net lowers how often that happens. Cost is one more
// possible search per request, on a call the cache already amortizes across
// everyone asking about the same situation.
const MAX_USES = Number(process.env.QUOTE_RESEARCH_MAX_USES || 6);

function compact(s, n = 300) { return String(s || '').trim().replace(/\s+/g, ' ').slice(0, n); }
function keyFor({ situation, voice }) {
  return `quote-fit:${normalizeKeyPart(compact(situation, 180))}:${normalizeKeyPart(compact(voice, 40))}`;
}

// 2026-10-07 second sample: a known paraphrase (Plutarch's "fire to be
// kindled") reached the page as an exact quote although the packet's own
// context_note said it was a paraphrase, and a Goodreads page was labelled
// authoritative because that was the default. The research prompt already
// forbade both; these checks are the code half.
const AGGREGATOR = /(^|\.)(goodreads\.com|brainyquote\.com|azquotes\.com|quotefancy\.com|quotes\.net|wisdomquotes\.com|passiton\.com|quotemaster\.org|everydaypower\.com|inspiringquotes\.us|quotegarden\.com|quotery\.com|quotepark\.com|quotlr\.com|quotationspage\.com|thequotes\.in|quotescosmos\.com|keepinspiring\.me|quotestats\.com|pinterest\.[a-z.]+|facebook\.com|instagram\.com|twitter\.com|x\.com|tiktok\.com|reddit\.com|tumblr\.com|quora\.com|medium\.com|linkedin\.com)$/i;
const NOT_EXACT = /paraphras|misattribut|apocryph|spurious|not (?:a |an )?(?:direct|exact|verbatim|literal)|loosely|adapted from|condensed|summari[sz]|commonly attributed|often attributed|widely attributed|popularly attributed|no (?:known|reliable|verifiable) source|cannot be (?:verified|confirmed|traced)|could not be (?:verified|confirmed|traced)|unverified|disputed|modern (?:rendering|version)|approximat/i;

function hostOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, '').toLowerCase(); } catch { return ''; }
}

function cleanPacket(raw, { log = false } = {}) {
  if (!raw || typeof raw !== 'object') return null;
  const dropped = { aggregator: 0, not_exact: 0, too_long: 0, no_url: 0 };
  const quotes = (Array.isArray(raw.quotes) ? raw.quotes : []).slice(0, 10).map(q => {
    const text = compact(q?.text, 360);
    const words = text.split(/\s+/).filter(Boolean);
    const url = compact(q?.url, 700);
    if (!text || !url) { dropped.no_url++; return null; }
    if (words.length > 25) { dropped.too_long++; return null; }
    const host = hostOf(url);
    if (!host || AGGREGATOR.test(host)) { dropped.aggregator++; return null; }
    const context_note = compact(q?.context_note, 500) || null;
    if (q?.exact === false || NOT_EXACT.test(`${context_note || ''} ${q?.source_title || ''}`)) { dropped.not_exact++; return null; }
    return {
      text,
      author: compact(q?.author, 120),
      work: compact(q?.work, 180) || null,
      date: compact(q?.date, 60) || null,
      source_title: compact(q?.source_title, 220),
      publisher: compact(q?.publisher, 140),
      url,
      verification: q?.verification === 'primary' ? 'primary' : 'secondary',
      context_note,
      themes: (Array.isArray(q?.themes) ? q.themes : []).map(x => compact(x, 60)).filter(Boolean).slice(0, 6),
      // Set by checkOnPage (below), never by the model.
      ...(q?.page_check ? { page_check: q.page_check, excerpt: Boolean(q.excerpt), source_passage: compact(q.source_passage, 900) || null } : {}),
    };
  }).filter(Boolean).map((q, i) => ({ id: `Q${i + 1}`, ...q }));
  if (log) console.log(`[quoteResearch] ${quotes.length} of ${Array.isArray(raw.quotes) ? raw.quotes.length : 0} kept; dropped ${dropped.aggregator} aggregator, ${dropped.not_exact} not-exact, ${dropped.too_long} over 25 words, ${dropped.no_url} no text/URL`);
  return quotes.length >= 2 ? { researched_at: compact(raw.researched_at, 60) || new Date().toISOString(), quotes } : null;
}

function render(packet) {
  return `\n\nVERIFIED QUOTE PACKET — quotation wording and attribution may ONLY come from this packet. Do not alter quotation text, author, work, or source. If a candidate is not a good fit, omit it.\n${JSON.stringify(packet)}`;
}

// T13 (audit/DEFECT-TYPES.md), owner's review 2026-10-27: the research pass's
// own notes are not verification. Our Town's Act III line was placed "at a
// wedding" (the play has one earlier) and "Does anyone…" printed for "Do any
// human beings…"; George Eliot's sentence was cut mid-way with a question
// mark added; a Seneca line about ending one's life was offered for quitting
// a job. Each quote's cited page is fetched (free, SSRF-guarded) and:
//   - its wording is looked for on the page: found -> page_check 'wording';
//     not found on a readable page -> dropped; unreadable -> 'attribution';
//   - a quote that starts or stops mid-sentence on the page is an excerpt
//     (shown with … and labelled);
//   - the page text around it is kept as source_passage, the only context the
//     matching stage and its check may use.
// Once per cached packet; the main request waits at most 4s for it.
const norm = t => String(t || '').toLowerCase().replace(/[‘’`´]/g, "'").replace(/[“”«»„]/g, '"').replace(/[–—]/g, '-').replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();
const SENTENCE_END = /[.!?;:]['"”’)\]]*\s*$/;

function locate(quote, pageText) {
  // Map each normalized character back to its place in the page text, so the
  // match can be read in the original (punctuation included).
  const map = []; let out = '';
  const src = pageText.replace(/[‘’`´]/g, "'").replace(/[–—]/g, '-');
  let lastSpace = true;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i].toLowerCase();
    if (/[a-z0-9']/.test(ch)) { out += ch; map.push(i); lastSpace = false; }
    else if (!lastSpace) { out += ' '; map.push(i); lastSpace = true; }
  }
  const q = norm(quote);
  const at = q.length > 12 ? out.indexOf(q) : -1;
  if (at < 0) return null;
  const start = map[at], end = map[at + q.length - 1] + 1;
  const after = src.slice(end, end + 3);
  const startsMid = !/(^|[.!?:;"”'“‘\n]\s*)$/.test(src.slice(0, start).slice(-4)) && !/^\s*$/.test(src.slice(0, start));
  const endsMid = !SENTENCE_END.test(quote.trim()) && /^\s*[a-z,]/i.test(after) && !/^\s*["”’)]/.test(after);
  return { start, end, excerpt: Boolean(startsMid || endsMid), passage: src.slice(Math.max(0, start - 450), Math.min(src.length, end + 450)).replace(/\s+/g, ' ').trim() };
}

async function checkOnPage(stored) {
  if (!stored || stored.pages_checked || !Array.isArray(stored.quotes)) return;
  if (stored.pages_checking) return stored.pages_checking;
  stored.pages_checking = (async () => {
    const pages = await Promise.all(stored.quotes.map(q => checkSourceLink(q.url, { timeoutMs: 5000 })));
    let dropped = 0;
    const kept = stored.quotes.filter((q, i) => {
      const pg = pages[i];
      if (pg.status === 'dead' || pg.status === 'moved') { dropped++; return false; }
      if (pg.status !== 'ok' || !pg.text || pg.text.length < 400) { q.page_check = 'attribution'; return true; }
      const hit = locate(q.text, pg.text);
      if (!hit) { dropped++; return false; } // readable page, words not on it
      q.page_check = 'wording';
      q.excerpt = hit.excerpt;
      q.source_passage = hit.passage;
      return true;
    });
    // Never leave fewer than two: then the unconfirmed ones stay, labelled.
    if (kept.length >= 2) stored.quotes = kept;
    else stored.quotes.forEach(q => { if (!q.page_check) q.page_check = 'attribution'; });
    console.log(`[quoteResearch] page check: ${stored.quotes.filter(q => q.page_check === 'wording').length} wording confirmed, ${stored.quotes.filter(q => q.excerpt).length} excerpt(s), ${dropped} dropped`);
    stored.pages_checked = true;
  })();
  return stored.pages_checking;
}

// `coldWaitMs` overrides the default synchronous wait. The main route keeps
// the default (a researched answer or a 503 for a direct caller); the
// /research readiness endpoint passes 0 so a poll returns immediately —
// cached packet or "pending" — while the fetch it just started runs on in
// the background. Same split as claimResearch.js.
// Searches that finished but left fewer than two verifiable quotes, by cache
// key. groundedStatus calls both this and a crashed fetch 'failed'; the visitor
// needs to hear which one happened (2026-10-13: a 56s search found 8 quotes,
// all from aggregators or too long, and the page said it 'did not finish in
// time' — and a retry inside the 5-minute negative cache would fail again).
const emptyAt = new Map();

async function quoteResearch({ situation, voice = 'any', force = false, coldWaitMs = COLD_WAIT_MS }) {
  const cacheKey = keyFor({ situation, voice });
  const block = await groundedFacts({
    cacheKey,
    label: 'someone-said-it-better-quotes',
    ttlMs: TTL_MS,
    coldWaitMs,
    timeoutMs: TIMEOUT_MS,
    maxTokens: 6500,
    maxUses: MAX_USES,
    // `force`: "Find different words for this" wants a genuinely fresh
    // research pass, not the same 30-day-cached candidate set re-served —
    // see backend/server's groundedFacts force option.
    force,
    system: `You retrieve and verify short, well-known quotations for a DeftBrain tool. Use web_search. Find candidate quotations that illuminate the visitor's situation without pretending to know their feelings or biography.

HARD RULES:
- Verify the exact wording and attribution against a page you actually visit.
- Prefer primary or authoritative sources: original books/speeches/letters in reputable archives, official transcripts, university/library/museum collections, Project Gutenberg for public-domain works, or authoritative quotation references that identify the original work.
- Do not use quote-image sites, social posts, Pinterest, anonymous quote aggregators, SEO quote lists, or pages that merely repeat an attribution without provenance.
- Never repair, modernize, paraphrase, translate, or complete a quotation from memory.
- Maximum 25 words per quotation. Shorter is better.
- If a famous saying is commonly misattributed, is a paraphrase or condensed version of the original, or the wording cannot be verified, exclude it. A paraphrase is never a quotation, however well known.
- Do not force inspiration. Witty, bracing, humane, skeptical, literary, or surprising quotes are welcome when they fit.
- Return only candidates you can verify. Return ONLY valid JSON.

${NO_QUOTE_RULE}`,
    userPrompt: `Find 6-10 verified short quotations that could illuminate this situation:\n${compact(situation, 1800)}\n\nDESIRED VOICE: ${compact(voice, 60)}\n\nReturn ONLY:\n{\n  "quotes": [\n    {\n      "text": "exact quotation, 25 words maximum",\n      "author": "verified speaker/author",\n      "work": "original work/speech/letter if established, otherwise null",\n      "date": "date if established, otherwise null",\n      "source_title": "title of page actually visited",\n      "publisher": "archive/publisher/institution",\n      "url": "full URL actually visited",\n      "verification": "primary | secondary",\n      "exact": true only if the page shows these exact words as the author's own; false for a paraphrase, translation variant or condensed version,\n      "context_note": "where and when the words were written or said, only if the source establishes it — provenance only, never an interpretation",\n      "themes": ["short theme labels"]\n    }\n  ]\n}`,
    render: raw => {
      // The research time is a fact about this fetch, so code writes it —
      // the model's "researched_at" was whatever date it chose to type.
      if (raw && typeof raw === 'object') raw.researched_at = new Date().toISOString();
      const packet = cleanPacket(raw, { log: true });
      if (packet) emptyAt.delete(cacheKey); else emptyAt.set(cacheKey, Date.now());
      return packet ? { block: render(packet), data: packet } : { block: '', data: null };
    },
  });
  const stored = block ? groundedData(cacheKey) : null;
  if (stored) await Promise.race([checkOnPage(stored), new Promise(r => setTimeout(r, 4000))]);
  const packet = stored ? cleanPacket(stored) : null;
  return { packet, block: packet ? render(packet) : '', cacheKey };
}

// 'ready' | 'in_flight' | 'failed' | 'none' for this situation — see
// groundedStatus. Lets the readiness endpoint say "failed" instead of
// "pending" while the negative cache holds after a failed fetch.
function quoteResearchState({ situation, voice = 'any' }) {
  return groundedStatus(keyFor({ situation, voice }));
}

// True when the last search for this situation finished and found nothing
// verifiable (as opposed to failing or still running).
function quoteResearchEmpty({ situation, voice = 'any' }) {
  const key = keyFor({ situation, voice });
  const at = emptyAt.get(key);
  if (!at) return false;
  if (Date.now() - at > 10 * 60 * 1000) { emptyAt.delete(key); return false; }
  return groundedStatus(key) === 'failed';
}

module.exports = { quoteResearch, quoteResearchState, quoteResearchEmpty, cleanPacket, locate };

// Self-check: node backend/lib/quoteResearch.js --check
if (require.main === module && process.argv.includes('--check')) {
  const assert = require('assert');
  const page = 'He said: "Do any human beings ever realize life while they live it?" Then silence. Love is the joy of being joined for life, to strengthen each other in all labour.';
  assert.ok(locate('Do any human beings ever realize life while they live it?', page) && !locate('Do any human beings ever realize life while they live it?', page).excerpt);
  assert.strictEqual(locate('Does anyone ever realize life while they live it?', page), null);
  assert.strictEqual(locate('Love is the joy of being joined for life', page).excerpt, true);
  console.log('quoteResearch ok');
  process.exit(0);
}
