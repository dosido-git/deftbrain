// customsResearch.js — what a visitor should know about a place's customs,
// from official sources, before anything is written (Culture Briefing).
//
// Owner's review, 2026-10-27: the briefing was written from the model's
// memory and spot-checked afterwards, so it said to avoid "standing in the
// priority seating area", to remove shoes by table height, to switch back to
// family names when invited to use a given name, and called declining a drink
// a higher-stakes misstep. Accuracy and speed are the first priorities
// (CLAUDE.md): research first, write only from what was found.
//
// One web-search pass per destination (and region), cached 30 days and shared
// by every visitor. Each finding says what the source says, how strongly the
// source puts it, where it applies, and which page it came from. Only findings
// whose page web_search actually retrieved are kept; pages that are dead or
// now redirect to a home page are dropped once, in the background.
//
//   const pack = await customsResearch({ destination, region });
//   pack → { findings: [{ id, topic, practice, strength, scope, source_id }], sources: [{ id, publisher, title, url, date, type }] } | null
const { groundedFacts, groundedData, normalizeKeyPart, stripCites } = require('./groundedFacts');
const { checkSourceLink } = require('./publicUrl');

const TTL_MS = 30 * 24 * 60 * 60 * 1000;
const COLD_WAIT_MS = Number(process.env.CUSTOMS_RESEARCH_WAIT_MS || 120000);
const TOPICS = ['greetings', 'names', 'occasions', 'dining', 'dietary', 'alcohol', 'indoors', 'religious_sites', 'transport', 'money', 'gifts', 'business', 'dress', 'photography', 'safety', 'law', 'language'];
const STRENGTHS = ['required', 'common', 'varies', 'ask', 'offence'];
const host = u => { try { return new URL(u).hostname.replace(/^www\./, '').toLowerCase(); } catch { return ''; } };
const compact = (s, n = 400) => String(stripCites(s || '')).trim().replace(/\s+/g, ' ').slice(0, n);

// A citation must support the claim's strength as well as the claim (owner's
// review 2026-10-27: a general etiquette guide made 'accept at least a small
// portion' a rule for every family). Only an official page can make
// something required; a commercial page cannot say a thing causes offence —
// at most that it varies.
function capStrength(strength, type) {
  if (strength === 'required' && type !== 'official') return 'common';
  if (strength === 'offence' && type === 'commercial') return 'varies';
  return strength;
}

function clean(raw, searchResults) {
  const seen = new Set((searchResults || []).map(r => r.url));
  const seenHosts = new Set((searchResults || []).map(r => host(r.url)).filter(Boolean));
  const sources = []; const byUrl = new Map();
  const findings = (Array.isArray(raw?.findings) ? raw.findings : []).slice(0, 36).map(f => {
    const url = compact(f?.source_url, 600);
    // Only a page the search actually retrieved (exact URL, or its site).
    if (!url || !(seen.has(url) || seenHosts.has(host(url)))) return null;
    const practice = compact(f?.practice, 360);
    if (!practice) return null;
    const type = ['official', 'reference', 'commercial'].includes(f?.source_type) ? f.source_type : 'commercial';
    // Date and title come from the page itself (verifyPack), never the
    // writer's reading of it: a source listed as June was dated 30 April.
    if (!byUrl.has(url)) { const id = `S${sources.length + 1}`; byUrl.set(url, id); sources.push({ id, publisher: compact(f?.publisher, 120) || host(url), title: null, url, date: null, type }); }
    return {
      topic: TOPICS.includes(f?.topic) ? f.topic : 'greetings',
      practice,
      strength: capStrength(STRENGTHS.includes(f?.strength) ? f.strength : 'common', type),
      scope: compact(f?.scope, 160) || null,
      source_id: byUrl.get(url),
    };
  }).filter(Boolean);
  // Official first, in code (owner's review 2026-10-27: a briefing built on
  // travel-agency blogs kept "stand right, walk left" against the official
  // stand-still guidance). A commercial page counts only for a topic no
  // official or reference page covers.
  const typeOf = new Map(sources.map(src => [src.id, src.type]));
  const covered = new Set(findings.filter(f => typeOf.get(f.source_id) !== 'commercial').map(f => f.topic));
  const kept = findings.filter(f => typeOf.get(f.source_id) !== 'commercial' || !covered.has(f.topic)).map((f, i) => ({ id: `F${i + 1}`, ...f }));
  const usedSources = new Set(kept.map(f => f.source_id));
  return kept.length >= 6 ? { findings: kept, sources: sources.filter(src => usedSources.has(src.id)) } : null;
}

// A page that would not load still needs telling apart from its neighbours
// from one publisher: its address's last part, as words ('how-do-i-dress-
// respectfully-in-nigeria' → 'How do I dress respectfully in Nigeria'),
// when that reads as a title (three words or more).
function slugTitle(url) {
  try {
    const seg = new URL(url).pathname.split('/').filter(Boolean).pop() || '';
    const words = decodeURIComponent(seg).replace(/\.[a-z]{2,5}$/i, '').split(/[-_]+/).filter(w => /^[a-z0-9]+$/i.test(w));
    if (words.length < 3) return null;
    const s = words.join(' ').replace(/\bi\b/g, 'I');
    return s.charAt(0).toUpperCase() + s.slice(1);
  } catch { return null; }
}

// Dead or moved pages, checked once per cached pack (free, SSRF-guarded),
// never holding a request for more than 2.5s; the cached object is fixed in
// place for the next visitor.
async function verifyPack(pack) {
  // v2 (2026-10-27): page dates and titles; packs checked before then are
  // checked again once, free.
  if (!pack || pack.links_checked4) return;
  if (pack.links_checking) return pack.links_checking;
  pack.links_checking = (async () => {
    const results = await Promise.all(pack.sources.map(s => checkSourceLink(s.url)));
    const bad = new Set(pack.sources.filter((s, i) => ['dead', 'moved'].includes(results[i].status)).map(s => s.id));
    // The later of published and updated (an advisory first published in 2013
    // and revised this month shows this month).
    pack.sources.forEach((s, i) => { const r = results[i]; s.date = [r.date, r.updated].filter(Boolean).sort().pop() || null; s.title = r.title || s.title || slugTitle(s.url); });
    const kept = pack.findings.filter(f => !bad.has(f.source_id));
    if (bad.size && kept.length >= 6) {
      pack.findings = kept;
      pack.sources = pack.sources.filter(s => !bad.has(s.id));
      console.log(`[customs-research] dropped ${bad.size} source(s) whose link is dead or moved`);
    }
    pack.links_checked4 = true;
  })();
  return pack.links_checking;
}

async function customsResearch({ destination, region }) {
  const place = [region, destination].filter(x => x && String(x).trim()).join(', ');
  // v3: occasions, travel advisories for safety and law, strength capped by
  // source type, dates and titles from the page.
  const cacheKey = `customs3:${normalizeKeyPart(destination)}:${normalizeKeyPart(region || '')}`;
  await groundedFacts({
    cacheKey,
    label: 'customs-research',
    ttlMs: TTL_MS,
    coldWaitMs: COLD_WAIT_MS,
    maxUses: 5,
    maxTokens: 7000,
    system: 'You research what a visitor should know about customs and practical rules in a place, with web search. Prefer official sources in this order: the national or city tourism board, transit operators, government pages (for safety and law: national travel advisories such as the UK FCDO, Canada or the US State Department), the venues or institutions themselves; then established travel references. Never social posts, forums or blogs. Report only what the pages you retrieve say — never fill a gap from memory. Keep each finding as strong as the source puts it, no stronger: a courtesy is not a rule, and something is a cause of offence only if the source says so. Return ONLY valid JSON. Never place a double-quote (") character inside any JSON string value.',
    userPrompt: `Research visitor customs and practical rules for: ${place}

Cover what visitors most often get wrong, across: greetings and how to address people (names, titles); family occasions such as weddings and funerals (attire, gifts or cash contributions, arrival, photography); dining and table manners; dietary needs (hidden animal ingredients such as stocks, vegetarian and halal options); alcohol (including declining it); indoor spaces and shoes; religious sites; public transport manners (priority seats, escalators, phones); money (tipping, payment, extra charges); gifts; business meetings (cards, language, interpreters); dress; photography (photographing people is a matter of consent; photographing government, military or airport sites can be a legal and security matter — keep them separate); safety (including transport risks such as motorcycle taxis, from travel advisories); laws visitors break by accident; language help.

Return ONLY valid JSON:
{ "findings": [ {
  "topic": "one of: ${TOPICS.join(' | ')}",
  "practice": "what the source says, in one plain sentence, scoped to where it applies",
  "strength": "required (a law, rule or venue requirement) | common (a usual courtesy) | varies (the source says it depends) | ask (the source advises asking or following your host) | offence (the source says it can cause offence or is taboo)",
  "scope": "where or when it applies (a setting, region or kind of venue), or null",
  "source_url": "the exact page URL it came from",
  "publisher": "who publishes that page",
  "source_type": "official (government, national or city tourism board, transit operator, the venue or institution itself) | reference (established guidebook, encyclopedia, major news) | commercial (company blog, travel agency, shop, personal site)"
} ] }
18-26 findings, each from a page you retrieved. At least half from official pages; use a commercial page only for something no official or reference page covers.`,
    render: (out, searchResults) => {
      const pack = clean(out, searchResults);
      if (!pack) return { block: '', data: null };
      return { block: 'customs', data: { ...pack, searched_at: new Date().toISOString() } };
    },
  });
  const pack = groundedData(cacheKey);
  if (pack) await Promise.race([verifyPack(pack), new Promise(r => setTimeout(r, 2500))]);
  return pack && pack.findings?.length ? pack : null;
}

module.exports = { customsResearch, clean, capStrength, STRENGTHS };

// Self-check: node backend/lib/customsResearch.js --check
if (require.main === module && process.argv.includes('--check')) {
  const assert = require('assert');
  const sr = [{ url: 'https://www.japan.travel/en/guide/vegetarian-guide/' }, { url: 'https://metronine.osaka/en/manners/' }];
  const f = (u, s) => ({ topic: 'dining', practice: 'p ' + u, strength: s, source_url: u, source_type: 'official' });
  const raw = { findings: [f(sr[0].url, 'common'), f(sr[1].url, 'bogus'), f('https://random-blog.example/x', 'offence'), f(sr[0].url, 'varies'), f(sr[1].url, 'ask'), f(sr[1].url, 'required'), f(sr[0].url, 'offence')] };
  const pack = clean(raw, sr);
  assert.strictEqual(pack.findings.length, 6);                    // the unretrieved blog is gone
  assert.strictEqual(pack.findings[1].strength, 'common');        // unknown strength → common, never offence
  assert.strictEqual(capStrength('required', 'reference'), 'common'); // only an official page makes a rule
  assert.strictEqual(capStrength('offence', 'commercial'), 'varies');
  assert.strictEqual(capStrength('offence', 'reference'), 'offence');
  assert.strictEqual(pack.sources[0].date, null);                 // never the writer's date
  assert.strictEqual(slugTitle('https://guardian.ng/nigerian/how-do-i-dress-respectfully-in-nigeria/'), 'How do I dress respectfully in nigeria');
  assert.strictEqual(slugTitle('https://example.com/en/manners/'), null);
  assert.deepStrictEqual(pack.sources.map(s => s.id), ['S1', 'S2']);
  // A commercial page is dropped where an official one covers the topic.
  const mixed = clean({ findings: [...raw.findings, { topic: 'dining', practice: 'blog', strength: 'common', source_url: 'https://www.japan.travel/x', source_type: 'commercial' }] }, [...sr, { url: 'https://www.japan.travel/x' }]);
  assert.ok(!mixed.findings.some(x => x.practice === 'blog'));
  console.log('customsResearch ok');
  process.exit(0);
}
