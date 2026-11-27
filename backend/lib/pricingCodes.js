// Organization access codes for /organizations/pricing (owner, 2026-11-27).
//
// The list lives in backend/data/pricing-codes.json: one entry per organization
// with its name, optional audience and a keyed hash of its code. The codes
// themselves are never stored. The key is the Railway variable
// PRICING_CODE_SECRET, set once; without it the hashes can't be checked or
// guessed offline. Add an organization with scripts/pricing-code.js, remove one
// by deleting its entry; either takes effect on the next deploy.
const crypto = require('crypto');
const path = require('path');

const FILE = path.join(__dirname, '..', 'data', 'pricing-codes.json');
// Partner usage-report codes use the same scheme and key (owner, 2026-11-27).
const REPORT_FILE = path.join(__dirname, '..', 'data', 'report-codes.json');

const hashCode = (code, secret) => crypto.createHmac('sha256', secret).update(String(code).trim()).digest('hex');

// Compare against every entry (no early exit) so timing says nothing about which matched.
function findEntry(code, secret, entries) {
  const given = Buffer.from(hashCode(code, secret), 'hex');
  let match = null;
  for (const e of entries) {
    const h = Buffer.from(String(e.hash || ''), 'hex');
    if (h.length === given.length && crypto.timingSafeEqual(h, given) && !match) match = e;
  }
  return match;
}

module.exports = { FILE, REPORT_FILE, hashCode, findEntry };
