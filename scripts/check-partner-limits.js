#!/usr/bin/env node
// Self-check for partner-network rate limits (backend/lib/rateLimiter.js):
// an IP inside a configured partner range gets `seats`× the per-IP budget,
// every other IP keeps the normal one, and bad config is skipped, not fatal.
const assert = require('node:assert');
// The limiter logs refusals to the metrics sink; keep test rows out of the real log.
process.env.METRICS_LOG_FILE = require('node:path').join(require('node:os').tmpdir(), 'check-partner-limits.jsonl');

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

// Refusals and near misses reach the metrics sink without the IP.
{
  const logged = [];
  const sink = require('../backend/lib/metricsSink');
  const real = sink.logMetric;
  sink.logMetric = (kind, data) => logged.push({ kind, ...data });
  try {
    // rateLimiter captured logMetric at require time, so re-require it fresh.
    delete require.cache[require.resolve('../backend/lib/rateLimiter')];
    const rl = require('../backend/lib/rateLimiter');
    const mw = rl.rateLimit({ perMinute: 100, perDay: 10 }, 'sink:');
    for (let i = 0; i < 12; i++) {
      mw({ ip: '192.0.2.9', headers: {}, body: {}, originalUrl: '/api/x?y=1' }, { set() {}, status() { return { json() {} }; } }, () => {});
    }
    const near = logged.filter(r => r.kind === 'rate_limit_near');
    const refused = logged.filter(r => r.kind === 'rate_limit');
    assert.strictEqual(near.length, 1, 'one near miss per visitor per day');
    assert.strictEqual(refused.length, 2);
    assert.deepStrictEqual(refused.map(r => r.first), [true, false], 'first refusal marked once');
    assert.strictEqual(refused[0].path, '/api/x', 'query string dropped');
    assert.ok(!JSON.stringify(logged).includes('192.0.2.9'), 'no IP in metrics');
    const sum = rl.summarizeRateLimits([
      ...refused.map(r => ({ ...r, at: '2026-11-24T15:00:00Z' })), ...near,
      { kind: 'event', event: 'tool_error', props: { limitType: 'daily' } },
      { kind: 'event', event: 'limit_recovered', props: {} },
    ]);
    assert.deepStrictEqual(sum.table, [{ path: '/api/x', tier: 'custom', minute: 0, daily: 2, visitors: 1, partner: 0, near: 1 }]);
    assert.strictEqual(sum.limited, 1); assert.strictEqual(sum.recovered, 1); assert.strictEqual(sum.firstDailyHours.length, 1);
  } finally { sink.logMetric = real; }
  console.log('rate-limit metrics: ok');
}

// Partner pages: suggestion text loses account/card/phone numbers before it is stored.
const { scrubNumbers } = require('../backend/lib/scrubNumbers');
assert.strictEqual(scrubNumbers('acct 1234567890 is locked'), 'acct [number removed] is locked');
assert.strictEqual(scrubNumbers('call 1-800-555-0100'), 'call [number removed]');
assert.strictEqual(scrubNumbers('card 4111 1111 1111 1111'), 'card [number removed]');
assert.strictEqual(scrubNumbers('a $1,200 bill from 2026'), 'a $1,200 bill from 2026');
console.log('check-partner-limits: scrubNumbers ok');
