#!/usr/bin/env node
/**
 * latency-sweep — how long does each tool actually take, in browser terms?
 * ─────────────────────────────────────────────────────────────────────────
 * Crisis Prioritizer was reported as "Load failed" on every submission. The
 * endpoint was fine; it answered in 82s, and Safari abandons a fetch at around
 * 60. Nothing we had could see that:
 *
 *   - the seven pre-push gates are all static — none times a request
 *   - check:golden verifies STRUCTURE, and passes at whatever speed
 *   - the July latency campaign set its own target at "≤70s", which is ABOVE
 *     the browser's limit, so a route could be measured, declared fixed, and
 *     still be broken for every Safari user
 *
 * This measures the one number that decides whether a user sees an answer.
 *
 * BUDGET: every case is a real model call with real cost. Defaults to ONE case
 * per tool (~120 calls). --all runs every golden case (~318).
 *
 * Runs against a LOCAL backend by default. The rate limiter allows 12 calls a
 * minute per IP, so a sweep against production returns an instant 429 for
 * almost every tool — which the first version of this script recorded as a
 * 0-second success, making 103 of 124 tools look instantaneous. The limiter
 * has a development-only bypass (x-perf-probe), which is what this uses.
 *
 * Usage:
 *   node scripts/latency-sweep.js                  # primary case per tool, vs localhost:3001
 *   node scripts/latency-sweep.js --local          # vs http://localhost:3001
 *   node scripts/latency-sweep.js --all            # every golden case
 *   node scripts/latency-sweep.js --only skill-gap-map,bill-rescue
 *   node scripts/latency-sweep.js --concurrency 4
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const argv = process.argv.slice(2);
const flag = (name, def) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? def : (argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true);
};

// Local by default: the perf-probe bypass is refused in production, and without
// it a sweep measures the rate limiter rather than the tools.
const BASE = flag('prod', false) ? 'https://deftbrain.com'
  : (process.env.GOLDEN_BASE_URL || 'http://localhost:3001');
const ALL = !!flag('all', false);
const ONLY = typeof flag('only', null) === 'string' ? String(flag('only')).split(',') : null;
const CONCURRENCY = Number(flag('concurrency', 4)) || 4;

// Safari abandons a fetch at roughly 60s and reports "Load failed"; Firefox and
// Chrome are more forgiving but intermediaries are not. 45s is the point where
// a slightly larger input than the fixture would cross the line — the fixtures
// are small, and that is exactly how Crisis Prioritizer stayed hidden.
const FAIL_AT = 60;
const WARN_AT = 45;

const cases = [];
for (const file of fs.readdirSync(path.join(ROOT, 'audit')).sort()) {
  const m = file.match(/^(.+)-golden-sample\.json$/);
  if (!m) continue;
  const tool = m[1];
  if (ONLY && !ONLY.includes(tool)) continue;
  let doc;
  try { doc = JSON.parse(fs.readFileSync(path.join(ROOT, 'audit', file), 'utf8')); }
  catch { console.error(`  skipped ${file} — unreadable`); continue; }
  const list = Array.isArray(doc.cases) ? doc.cases : [];
  for (const c of (ALL ? list : list.slice(0, 1))) {
    if (c && c.endpoint && c.input) cases.push({ tool, name: c.name || '?', endpoint: c.endpoint, input: c.input });
  }
}

if (!cases.length) {
  console.error('No golden cases matched. Nothing to measure.');
  process.exit(1);
}

async function time(c) {
  const t0 = Date.now();
  try {
    const res = await fetch(BASE + c.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-perf-probe': '1' },
      body: JSON.stringify(c.input),
    });
    const body = await res.text();
    // A streaming endpoint returns 200 and then reports its failure inside the
    // stream, so status alone would score a broken run as a fast one.
    const streamed = /text\/event-stream/i.test(res.headers.get('content-type') || '');
    const streamFailed = streamed && (/"error"/.test(body) || !/"done"\s*:\s*true/.test(body));
    // A non-200 is NOT a fast tool. 429 and 400 both return in milliseconds and
    // will quietly masquerade as the best result in the run if counted.
    const ok = res.status === 200 && !streamFailed;
    return { ...c, ms: Date.now() - t0, status: streamFailed ? 'STREAM' : res.status, measured: ok,
             detail: ok ? '' : body.slice(0, 60).replace(/\s+/g, ' ') };
  } catch (e) {
    return { ...c, ms: Date.now() - t0, status: 'ERR', error: String(e.message || e).slice(0, 60) };
  }
}

(async () => {
  console.log(`latency-sweep — ${cases.length} case(s) vs ${BASE}, ${CONCURRENCY} at a time`);
  console.log(`warn at ${WARN_AT}s, fail at ${FAIL_AT}s (Safari abandons a fetch near 60s)\n`);

  const results = [];
  let next = 0;
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    while (next < cases.length) {
      const c = cases[next++];
      const r = await time(c);
      results.push(r);
      const s = (r.ms / 1000).toFixed(0);
      const mark = !r.measured ? `HTTP ${r.status}`.padEnd(4)
        : r.ms / 1000 >= FAIL_AT ? 'FAIL' : r.ms / 1000 >= WARN_AT ? 'warn' : '    ';
      const shown = r.measured ? `${s.padStart(4)}s` : '   —';
      console.log(`  ${mark} ${shown}  ${r.tool}  ${r.name}${r.detail ? '  ' + r.detail : ''}${r.error ? '  ' + r.error : ''}`);
    }
  }));

  const ok = results.filter(r => r.measured).sort((a, b) => b.ms - a.ms);
  const over = ok.filter(r => r.ms / 1000 >= FAIL_AT);
  const warn = ok.filter(r => r.ms / 1000 >= WARN_AT && r.ms / 1000 < FAIL_AT);
  const unmeasured = results.filter(r => !r.measured);

  console.log(`\n── slowest 10 ──`);
  for (const r of ok.slice(0, 10)) console.log(`  ${(r.ms / 1000).toFixed(0).padStart(4)}s  ${r.tool}  ${r.name}`);

  if (unmeasured.length) {
    console.log(`\n── NOT measured (${unmeasured.length}) — these are unknown, not fast ──`);
    for (const r of unmeasured.slice(0, 20)) console.log(`  HTTP ${r.status}  ${r.tool}  ${r.detail || r.error || ''}`);
    if (unmeasured.length > 20) console.log(`  … and ${unmeasured.length - 20} more`);
  }

  console.log(`\n${ok.length} measured · ${over.length} over ${FAIL_AT}s · ${warn.length} over ${WARN_AT}s · ${unmeasured.length} unmeasured`);
  if (over.length) {
    console.log(`\nOver the browser's limit — these fail in Safari with "Load failed":`);
    for (const r of over) console.log(`  ${(r.ms / 1000).toFixed(0)}s  ${r.tool}  (${r.endpoint})`);
  }
  // Informational by design. The fixtures are small, so a pass here is not
  // proof a real user's larger input is safe — it is the floor, not the ceiling.
  process.exit(0);
})();
