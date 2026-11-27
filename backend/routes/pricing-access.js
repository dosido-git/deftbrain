// Organization pricing, behind an access code (owner, 2026-11-26): prices are
// not public. Visitors email sales@deftbrain.com from their organization
// address and get a code of their own; /organizations/pricing posts it here.
//
// One code per organization, so the metrics report can show who looked and
// when ("Pricing page by organization"). Codes live in the Railway variable
//   PRICING_ACCESS_CODES = "code=Organization name|audience; code=..."
// made with `node scripts/pricing-code.js "Organization name" audience`. The
// audience (libraries, credit-unions, campuses, community, employers) is
// optional; it opens the page on that audience's rate. Remove an
// entry to close that organization's access. Unset = the page says to email.
//
// The prices live only in backend/data/pricing.json and leave the server only
// for a valid code, so they are never in the public bundle. Codes are never
// logged; only the organization name they map to.
const express = require('express');
const crypto = require('crypto');
const { rateLimit } = require('../lib/rateLimiter');
const { logMetric } = require('../lib/metricsSink');
const PRICING = require('../data/pricing.json');

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
  const codes = parseCodes(process.env.PRICING_ACCESS_CODES);
  if (!codes.length) return res.status(503).json({ error: 'not_configured' });
  const given = String((req.body || {}).code || '').trim();
  // Compare against every entry (no early exit) so timing says nothing about which matched.
  let match = null;
  for (const entry of codes) if (sameCode(given, entry.code) && !match) match = entry;
  const org = match && match.org;
  if (!org) {
    logMetric('pricing_access', { ok: false });
    return res.status(401).json({ error: 'wrong_code' });
  }
  logMetric('pricing_access', { ok: true, org: org.slice(0, 120) });
  const { _note, ...pricing } = PRICING;
  const audience = pricing.audiences.some(a => a.key === match.audience) ? match.audience : null;
  return res.json({ ...pricing, org, audience });
});

router.parseCodes = parseCodes; // for scripts/pricing-code.js --check
module.exports = router;
