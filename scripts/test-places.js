#!/usr/bin/env node
/**
 * Tests for the pure half of backend/lib/places.js — the parts that decide
 * whether a venue is open and how far apart two stops are.
 *
 * These need no API key and no network: they are exactly the logic that would
 * otherwise only be exercised in production, against a paid API, on data we
 * cannot reproduce. Run with `node scripts/test-places.js`.
 */

const assert = require('assert');
const P = require('../backend/lib/places');

let pass = 0;
const t = (name, fn) => { fn(); pass++; console.log(`  ✓ ${name}`); };

// Places' shape: day 0 = Sunday, times as {hour, minute}.
const period = (od, oh, om, cd, ch, cm) => ({
  open: { day: od, hour: oh, minute: om },
  close: cd === null ? undefined : { day: cd, hour: ch, minute: cm },
});

console.log('isOpenAt');

t('open inside a normal evening window', () => {
  const p = [period(5, 17, 0, 5, 23, 0)]; // Friday 5pm-11pm
  assert.strictEqual(P.isOpenAt(p, 5, 19 * 60), true);       // Fri 7pm
});

t('closed before opening on a day it does open', () => {
  const p = [period(5, 17, 0, 5, 23, 0)];
  assert.strictEqual(P.isOpenAt(p, 5, 11 * 60), false);      // Fri 11am
});

t('closed on a day with no period at all', () => {
  const p = [period(5, 17, 0, 5, 23, 0)];
  assert.strictEqual(P.isOpenAt(p, 1, 19 * 60), false);      // Monday
});

t('past-midnight close still counts as open — the case a naive compare fails', () => {
  const p = [period(5, 20, 0, 6, 2, 0)];                     // Fri 8pm - Sat 2am
  assert.strictEqual(P.isOpenAt(p, 6, 1 * 60), true);        // Sat 1am
  assert.strictEqual(P.isOpenAt(p, 5, 21 * 60), true);       // Fri 9pm
  assert.strictEqual(P.isOpenAt(p, 6, 3 * 60), false);       // Sat 3am
});

t('Sunday-night window closing Monday morning wraps the week boundary', () => {
  const p = [period(0, 22, 0, 1, 1, 0)];                     // Sun 10pm - Mon 1am
  assert.strictEqual(P.isOpenAt(p, 1, 0 * 60 + 30), true);   // Mon 00:30
});

t('a period with no close means open 24 hours', () => {
  assert.strictEqual(P.isOpenAt([period(0, 0, 0, null)], 3, 4 * 60), true);
});

t('unknown hours return null, never false', () => {
  assert.strictEqual(P.isOpenAt(null, 5, 600), null);
  assert.strictEqual(P.isOpenAt([], 5, 600), null);
  assert.strictEqual(P.isOpenAt([period(5, 17, 0, 5, 23, 0)], null, 600), null);
});

console.log('closedDays');

t('names the days with no opening period', () => {
  const p = [period(2, 17, 0, 2, 23, 0), period(3, 17, 0, 3, 23, 0)]; // Tue, Wed
  assert.deepStrictEqual(P.closedDays(p), [0, 1, 4, 5, 6]);
});

t('empty when hours are unknown', () => {
  assert.deepStrictEqual(P.closedDays(null), []);
});

console.log('distance and walking time');

t('metres between two known points is about right', () => {
  // Harvard Square -> Central Square, Cambridge. Straight-line 1553 m,
  // confirmed independently; the walk along Mass Ave is a little over 1.6 km,
  // which is the right relationship between the two numbers.
  const m = P.metresBetween({ lat: 42.3736, lng: -71.1190 }, { lat: 42.3654, lng: -71.1037 });
  assert.ok(m > 1450 && m < 1650, `got ${m}`);
});

t('walking minutes is a sane pace for that distance', () => {
  const mins = P.walkMinutes({ lat: 42.3736, lng: -71.1190 }, { lat: 42.3654, lng: -71.1037 });
  assert.ok(mins >= 20 && mins <= 28, `got ${mins}`);
});

t('never returns zero for two different places', () => {
  const mins = P.walkMinutes({ lat: 42.3736, lng: -71.1190 }, { lat: 42.3737, lng: -71.1191 });
  assert.strictEqual(mins, 1);
});

t('null when either coordinate is missing', () => {
  assert.strictEqual(P.walkMinutes({ lat: 1, lng: 2 }, null), null);
  assert.strictEqual(P.walkMinutes({ lat: 1, lng: null }, { lat: 3, lng: 4 }), null);
});

console.log('fails open without a key');

t('enabled() is false and enrich() returns its input untouched', async () => {
  assert.strictEqual(P.enabled(), false);
});

(async () => {
  const input = [{ name: 'A' }, { name: 'B' }];
  const out = await P.enrich(input, 'Austin');
  assert.deepStrictEqual(out, input);
  pass++;
  console.log('  ✓ enrich() is a no-op with no key');
  console.log(`\n${pass} passed`);
})();
