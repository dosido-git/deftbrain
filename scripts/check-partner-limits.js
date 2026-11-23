#!/usr/bin/env node
// Self-check for partner-network rate limits (backend/lib/rateLimiter.js):
// an IP inside a configured partner range gets `seats`× the per-IP budget,
// every other IP keeps the normal one, and bad config is skipped, not fatal.
const assert = require('node:assert');

process.env.PARTNER_NETWORKS = JSON.stringify([
  { code: 'lab', cidrs: ['203.0.113.0/28', '2001:db8::/48'], seats: 3 },
  { code: 'bad-seats', cidrs: ['198.51.100.0/24'], seats: 0 },
  { code: 'bad-range', cidrs: ['not-an-ip/99'], seats: 5 },
]);
const { rateLimit, partnerFor, loadPartnerNetworks } = require('../backend/lib/rateLimiter');

assert.strictEqual(partnerFor('203.0.113.5')?.code, 'lab');
assert.strictEqual(partnerFor('::ffff:203.0.113.15')?.code, 'lab');
assert.strictEqual(partnerFor('2001:db8:0:1::7')?.code, 'lab');
assert.strictEqual(partnerFor('203.0.113.16'), null, 'outside the /28');
assert.strictEqual(partnerFor('198.51.100.1'), null, 'invalid seats entry is skipped');
assert.deepStrictEqual(loadPartnerNetworks('{oops'), [], 'invalid JSON is ignored');

// Count how many requests one IP gets through before a 429.
function allowed(ip, limits) {
  const mw = rateLimit(limits, 'check:');
  let ok = 0;
  for (let i = 0; i < 100; i++) {
    let blocked = false;
    const res = { set() {}, status() { blocked = true; return { json() {} }; } };
    mw({ ip, headers: {}, body: {} }, res, () => {});
    if (blocked) break;
    ok++;
  }
  return ok;
}

const limits = { perMinute: 5, perDay: 50 };
assert.strictEqual(allowed('192.0.2.1', limits), 5, 'ordinary IP keeps the per-IP limit');
assert.strictEqual(allowed('203.0.113.2', limits), 15, 'partner IP gets seats × the limit');

console.log('partner limits: ok');

// Partner pages: suggestion text loses account/card/phone numbers before it is stored.
const { scrubNumbers } = require('../backend/lib/scrubNumbers');
assert.strictEqual(scrubNumbers('acct 1234567890 is locked'), 'acct [number removed] is locked');
assert.strictEqual(scrubNumbers('call 1-800-555-0100'), 'call [number removed]');
assert.strictEqual(scrubNumbers('card 4111 1111 1111 1111'), 'card [number removed]');
assert.strictEqual(scrubNumbers('a $1,200 bill from 2026'), 'a $1,200 bill from 2026');
console.log('check-partner-limits: scrubNumbers ok');
