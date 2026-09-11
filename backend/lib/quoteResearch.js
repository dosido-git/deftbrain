// Verified quotation retrieval for Someone Said It Better.
// Uses the shared groundedFacts web-search/cache primitive. The main generation
// call never invents quotation text; it may only choose from this packet.

const { groundedFacts, groundedData, normalizeKeyPart } = require('./groundedFacts');
const { NO_QUOTE_RULE } = require('./factCheck');

const TTL_MS = Number(process.env.QUOTE_RESEARCH_TTL_MS || 30 * 24 * 60 * 60 * 1000);
const COLD_WAIT_MS = Number(process.env.QUOTE_RESEARCH_COLD_WAIT_MS || 45_000);
const TIMEOUT_MS = Number(process.env.QUOTE_RESEARCH_TIMEOUT_MS || 90_000);
const MAX_USES = Number(process.env.QUOTE_RESEARCH_MAX_USES || 5);

function compact(s, n = 300) { return String(s || '').trim().replace(/\s+/g, ' ').slice(0, n); }
function keyFor({ situation, voice }) {
  return `quote-fit:${normalizeKeyPart(compact(situation, 180))}:${normalizeKeyPart(compact(voice, 40))}`;
}

function cleanPacket(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const quotes = (Array.isArray(raw.quotes) ? raw.quotes : []).slice(0, 10).map((q, i) => {
    const text = compact(q?.text, 360);
    const words = text.split(/\s+/).filter(Boolean);
    const url = compact(q?.url, 700);
    if (!text || words.length > 25 || !url) return null;
    return {
      id: `Q${i + 1}`,
      text,
      author: compact(q?.author, 120),
      work: compact(q?.work, 180) || null,
      date: compact(q?.date, 60) || null,
      source_title: compact(q?.source_title, 220),
      publisher: compact(q?.publisher, 140),
      url,
      verification: ['primary', 'authoritative_secondary'].includes(q?.verification) ? q.verification : 'authoritative_secondary',
      context_note: compact(q?.context_note, 500) || null,
      themes: (Array.isArray(q?.themes) ? q.themes : []).map(x => compact(x, 60)).filter(Boolean).slice(0, 6),
    };
  }).filter(Boolean);
  return quotes.length >= 2 ? { researched_at: compact(raw.researched_at, 60) || new Date().toISOString(), quotes } : null;
}

function render(packet) {
  return `\n\nVERIFIED QUOTE PACKET — quotation wording and attribution may ONLY come from this packet. Do not alter quotation text, author, work, or source. If a candidate is not a good fit, omit it.\n${JSON.stringify(packet)}`;
}

async function quoteResearch({ situation, voice = 'any', force = false }) {
  const cacheKey = keyFor({ situation, voice });
  const block = await groundedFacts({
    cacheKey,
    label: 'someone-said-it-better-quotes',
    ttlMs: TTL_MS,
    coldWaitMs: COLD_WAIT_MS,
    timeoutMs: TIMEOUT_MS,
    maxTokens: 5500,
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
- If a famous saying is commonly misattributed or the wording cannot be verified, exclude it.
- Do not force inspiration. Witty, bracing, humane, skeptical, literary, or surprising quotes are welcome when they fit.
- Return only candidates you can verify. Return ONLY valid JSON.

${NO_QUOTE_RULE}`,
    userPrompt: `Find 5-8 verified short quotations that could illuminate this situation:\n${compact(situation, 1800)}\n\nDESIRED VOICE: ${compact(voice, 60)}\n\nReturn ONLY:\n{\n  "researched_at": "ISO date/time",\n  "quotes": [\n    {\n      "text": "exact quotation, 25 words maximum",\n      "author": "verified speaker/author",\n      "work": "original work/speech/letter if established, otherwise null",\n      "date": "date if established, otherwise null",\n      "source_title": "title of page actually visited",\n      "publisher": "archive/publisher/institution",\n      "url": "full URL actually visited",\n      "verification": "primary | authoritative_secondary",\n      "context_note": "brief provenance/context only if established by source",\n      "themes": ["short theme labels"]\n    }\n  ]\n}`,
    render: raw => {
      const packet = cleanPacket(raw);
      return packet ? { block: render(packet), data: packet } : { block: '', data: null };
    },
  });
  const packet = block ? cleanPacket(groundedData(cacheKey)) : null;
  return { packet, block: packet ? render(packet) : '', cacheKey };
}

module.exports = { quoteResearch, cleanPacket };
