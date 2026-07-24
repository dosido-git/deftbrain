// Shared grounded-facts pre-pass with a jurisdiction-keyed TTL cache.
//
// Pattern (BuyWise → lease-trap-detector → bill-rescue): one small bounded
// web-search call verifies the volatile facts BEFORE the big main call, which
// stays ungrounded (a single search+long generation held the connection open
// past the API limit). The returned block is appended to the main prompt and
// OVERRIDES training knowledge; empty string on any failure so the tool's
// hedge rules take over. Best-effort by design — never throws.
//
// The cache is what makes this affordable: facts like "the CA deposit cap"
// don't change between requests, so one (topic × jurisdiction) fetch serves
// every user for the TTL window. In-memory only — empties on deploy, first
// user re-warms it. Facts are fetched in ENGLISH regardless of userLanguage
// (the block is prompt input, not user-facing output; the main call renders
// in the user's language) so one cache entry serves all 13 languages.

const { callClaudeWithRetry } = require('./claude');
const { MODELS } = require('./models');

const DAY_MS = 24 * 60 * 60 * 1000;
const FAILURE_TTL_MS = 5 * 60 * 1000; // brief negative-cache so a flaky search isn't hammered
const MAX_ENTRIES = 500;

const cache = new Map();    // key → { block, expires }
const inFlight = new Map(); // key → Promise<string> (dedupes concurrent cold-cache stampedes)

// web_search responses wrap phrases in <cite> tags; strip them anywhere in the parsed JSON.
function stripCites(val) {
  if (typeof val === 'string') return val.replace(/<\/?cite[^>]*>/g, '');
  if (Array.isArray(val)) return val.map(stripCites);
  if (val && typeof val === 'object') {
    const out = {};
    for (const k of Object.keys(val)) out[k] = stripCites(val[k]);
    return out;
  }
  return val;
}

// Normalize free-text jurisdiction input ("Berlin, Deutschland ") into a stable cache key part.
function normalizeKeyPart(s) {
  return String(s || '').trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 80) || 'unknown';
}

/**
 * @param {object} opts
 * @param {string} opts.cacheKey   e.g. `deposit-law:${normalizeKeyPart(location)}`
 * @param {string} opts.label      log label, e.g. 'renters-deposit-saver-facts'
 * @param {string} opts.userPrompt the verification request (ask for ONLY valid JSON)
 * @param {function} opts.render   parsed JSON → facts block string ('' if unusable)
 * @param {number} [opts.ttlMs]    default 14 days
 * @param {number} [opts.maxTokens] default 2500 (1500 truncated on Arabic — 2026-07-23 audit)
 * @param {string} [opts.system]   override the default verifier system prompt
 * @returns {Promise<string>} facts block, or '' on any failure
 */
async function groundedFacts({ cacheKey, label, userPrompt, render, ttlMs = 14 * DAY_MS, maxTokens = 2500, system }) {
  const hit = cache.get(cacheKey);
  if (hit && hit.expires > Date.now()) return hit.block;
  if (inFlight.has(cacheKey)) return inFlight.get(cacheKey);

  const p = (async () => {
    try {
      const facts = await callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: maxTokens,
        tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 3 }],
        system: system || 'You verify current legal and regulatory facts with web search. Prefer official sources (legislature, courts, regulators, government portals). Note effective dates and any recent changes or repeals. Return ONLY valid JSON.',
        messages: [{ role: 'user', content: userPrompt }],
      }, { label });
      const block = render(stripCites(facts)) || '';
      store(cacheKey, block, block ? ttlMs : FAILURE_TTL_MS);
      return block;
    } catch (err) {
      console.error(`[${label}] grounding pre-pass failed, proceeding unverified:`, err.message);
      store(cacheKey, '', FAILURE_TTL_MS);
      return '';
    } finally {
      inFlight.delete(cacheKey);
    }
  })();
  inFlight.set(cacheKey, p);
  return p;
}

function store(key, block, ttlMs) {
  if (cache.size >= MAX_ENTRIES) {
    // drop the oldest-expiring entry — bounded memory beats LRU precision here
    let oldestKey, oldestExp = Infinity;
    for (const [k, v] of cache) if (v.expires < oldestExp) { oldestExp = v.expires; oldestKey = k; }
    if (oldestKey !== undefined) cache.delete(oldestKey);
  }
  cache.set(key, { block, expires: Date.now() + ttlMs });
}

module.exports = { groundedFacts, normalizeKeyPart, stripCites };
