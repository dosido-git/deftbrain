// Organization pricing, behind an access code (owner, 2026-11-26): prices are
// not public. Visitors email sales@deftbrain.com from their organization
// address and get a code of their own; /organizations/pricing posts it here.
//
// One code per organization, so the metrics report can show who looked and
// when ("Pricing page by organization"). The list is backend/data/pricing-codes.json
// (hashed codes, see backend/lib/pricingCodes.js), checked with the Railway
// secret PRICING_CODE_SECRET; add an organization with
// `node scripts/pricing-code.js "Organization name" audience`. With an audience
// (libraries, credit-unions, campuses, community, employers) the page shows only
// that audience's price; without one, all of them. No secret or no entries =
// the page says to email.
//
// Transition: entries in the old PRICING_ACCESS_CODES variable
// ("code=Organization name|audience; ...") still work until it is removed.
//
const express = require('express');
const crypto = require('crypto');
const { rateLimit } = require('../lib/rateLimiter');
const { logMetric } = require('../lib/metricsSink');
const PRICING = require('../data/pricing.json');
const { FILE, findEntry } = require('../lib/pricingCodes');

function fileEntries() {
  try { return JSON.parse(require('fs').readFileSync(FILE, 'utf8')).codes || []; } catch (_) { return []; }
}

const router = express.Router();

// Tight: a person types a code a few times; anything more is guessing.
const PRICING_LIMITS = { perMinute: 5, perDay: 30 };

function parseCodes(raw) {
  const out = [];
  for (const part of String(raw || '').split(';')) {
    const i = part.indexOf('=');
    if (i < 1) continue;
    const code = part.slice(0, i).trim();
    const [org, audience] = part.slice(i + 1).split('|').map(x => (x || '').trim());
    if (code && org) out.push({ code, org, audience: audience || null });
  }
  return out;
}

function sameCode(given, expected) {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

router.post('/pricing-access', rateLimit(PRICING_LIMITS, 'pricing-access:'), (req, res) => {
  res.set('Cache-Control', 'no-store');
  const legacy = parseCodes(process.env.PRICING_ACCESS_CODES);
  const secret = process.env.PRICING_CODE_SECRET;
  const entries = secret ? fileEntries() : [];
  if (!legacy.length && !entries.length) return res.status(503).json({ error: 'not_configured' });
  const given = String((req.body || {}).code || '').trim();
  let match = entries.length ? findEntry(given, secret, entries) : null;
  // Compare against every entry (no early exit) so timing says nothing about which matched.
  for (const entry of legacy) if (sameCode(given, entry.code) && !match) match = entry;
  const org = match && match.org;
  if (!org) {
    logMetric('pricing_access', { ok: false });
    return res.status(401).json({ error: 'wrong_code' });
  }
  logMetric('pricing_access', { ok: true, org: org.slice(0, 120) });
  const { _note, ...pricing } = PRICING;
  // A code with an audience sees only that audience's price (owner, 2026-11-26);
  // the others never leave the server. A code without one sees them all.
  const own = pricing.audiences.filter(a => a.key === match.audience);
  const audience = own.length ? match.audience : null;
  return res.json({ ...pricing, audiences: own.length ? own : pricing.audiences, org, audience });
});

module.exports = router;
