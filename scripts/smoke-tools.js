#!/usr/bin/env node
//
// smoke-tools.js — call every tool endpoint once, for free (T9 in
// audit/DEFECT-TYPES.md).
// ───────────────────────────────────────────────────────────────────────────
// A change in backend/lib/ can break tools whose own files never changed, so
// their goldens never run. That is how the surge wrapper (2026-10-05) broke
// every streaming tool for three days: withSurge returned a plain Promise, the
// SDK's messages.stream() called .withResponse() on it, and nothing noticed.
//
// This starts the real backend (server.js, every route, every lib layer) on a
// spare port, with the Anthropic SDK pointed at a stand-in API server run by
// this script. The real SDK talks to the stand-in over HTTP, so its request
// building, APIPromise, streaming and retries are the real thing; only the
// model's words are canned. No request leaves this machine and nothing is
// billed: every key-like environment variable is blanked for the child.
//
// What the stand-in answers: the tool's golden output (audit/*-golden*.json)
// when the endpoint has one, otherwise the largest JSON example found in the
// prompt itself. Either way the answer is plausible, not right — this checks
// that tools RUN, not that they answer well.
//
// Every endpoint's outcome is compared with scripts/smoke-tools-baseline.json.
// It fails on:
//   • an endpoint that worked in the baseline and now doesn't
//   • a crash-class error (TypeError, "is not a function", …) the baseline
//     didn't have
//   • a route file that fails to load, or a golden endpoint nothing serves
// Endpoints that already failed in the baseline (the canned answer doesn't
// fit them) are reported as known, not failures.
//
// Usage:  node scripts/smoke-tools.js                 run and compare
//         node scripts/smoke-tools.js --update        run and rewrite the baseline
//         node scripts/smoke-tools.js --only a,b      just these endpoint paths (substring)
//         node scripts/smoke-tools.js --if-changed <base>
//                 run only if backend/lib/, backend/server.js or backend/routes/index.js
//                 changed since <base> (used by the pre-push hook)
// Exit: 0 pass · 1 regression · 2 setup error.

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { startFakeApi, startBackend } = require('./lib/standin');

const ROOT = path.join(__dirname, '..');
const BACKEND = path.join(ROOT, 'backend');
const AUDIT_DIR = path.join(ROOT, 'audit');
const BASELINE = path.join(__dirname, 'smoke-tools-baseline.json');
const CASE_TIMEOUT_MS = 45000;
const CRASH_RE = /\b(TypeError|ReferenceError|RangeError)\b|is not a function|is not defined|Cannot read propert|Cannot destructure|is not iterable|Cannot set propert/;
// Non-tool endpoints: email/newsletter/metrics plumbing and file uploads.
const SKIP_RE = /^\/api\/(metrics|subscribe|newsletter|feedback|errors?|client-error|health|alerts?)\b/;

const args = process.argv.slice(2);
const UPDATE = args.includes('--update');
const onlyArg = args.includes('--only') ? args[args.indexOf('--only') + 1] : '';
const ONLY = onlyArg ? onlyArg.split(',').map(s => s.trim()).filter(Boolean) : [];

if (args.includes('--if-changed')) {
  const base = args[args.indexOf('--if-changed') + 1];
  let changed = '';
  try {
    changed = execSync(`git diff --name-only ${base}...HEAD -- backend/lib backend/server.js backend/routes/index.js`, { cwd: ROOT }).toString().trim();
  } catch (_) { changed = 'unknown'; }
  if (!changed) { console.log('smoke-tools: no shared backend code changed — skipped.'); process.exit(0); }
  console.log(`smoke-tools: shared backend code changed:\n${changed.split('\n').map(l => '  ' + l).join('\n')}`);
}

// ── Endpoints and their inputs ─────────────────────────────────────────────
function goldenCases() {
  const byEndpoint = new Map();
  for (const f of fs.readdirSync(AUDIT_DIR)) {
    if (!/-golden(-sample)?\.json$/.test(f)) continue;
    let g;
    try { g = JSON.parse(fs.readFileSync(path.join(AUDIT_DIR, f), 'utf8')); } catch (_) { continue; }
    const cases = Array.isArray(g.cases) && g.cases.length ? g.cases
      : (g.input && g.output ? [{ endpoint: (g._meta && g._meta.endpoint) || g.endpoint, input: g.input, output: g.output }] : []);
    for (const c of cases) {
      if (!c || !c.endpoint || byEndpoint.has(c.endpoint)) continue;
      byEndpoint.set(c.endpoint, { input: c.input || {}, output: c.output, golden: f });
    }
  }
  return byEndpoint;
}

// endpoint → route file, so an endpoint with no golden of its own can borrow
// a sibling's golden input (same tool, usually the same fields).
const FILE_OF = new Map();
function routeEndpoints() {
  const out = new Set();
  for (const f of fs.readdirSync(path.join(BACKEND, 'routes'))) {
    if (!f.endsWith('.js') || f === 'index.js') continue;
    const src = fs.readFileSync(path.join(BACKEND, 'routes', f), 'utf8');
    for (const m of src.matchAll(/router\.post\(\s*['"`](\/[^'"`]*)['"`]/g)) {
      if (m[1].includes(':')) continue; // parameterized paths need real ids
      out.add('/api' + m[1]);
      FILE_OF.set('/api' + m[1], f);
    }
  }
  return out;
}

// A body most validators accept far enough to reach the model call.
const GENERIC_BODY = {
  text: 'My landlord says I owe $400 for cleaning after I moved out last month.',
  input: 'My landlord says I owe $400 for cleaning after I moved out last month.',
  situation: 'My landlord says I owe $400 for cleaning after I moved out last month.',
  description: 'A weekly 30-minute team meeting with six people.',
  question: 'Should I take the new job?',
  topic: 'Moving to a new city', name: 'Loomly', goal: 'Get my deposit back',
  userLanguage: 'en', userLocale: 'en-US', userCurrency: 'USD', userRegion: 'US',
};

// Endpoints with no golden whose fields the generic body doesn't cover.
const INPUTS = {
  '/api/paperwork-path': { lifeEvent: 'Moving to a new state', location: 'Austin, Texas' },
  '/api/whats-that-mean': { phrase: 'circle back', context: 'Let\'s circle back on this next week.' },
  '/api/whats-that-mean/equivalent': { phrase: 'circle back', plainMeaning: 'talk about it again later', contextualMeaning: 'postpone the topic', targetLanguage: 'es' },
};

// ── The stand-in API (scripts/lib/standin.js) ──────────────────────────────
let current = null; // { output } for the case in flight
const apiCalls = { total: 0, stream: 0 };
const pick = () => (current && current.output !== undefined
  ? (typeof current.output === 'string' ? current.output : JSON.stringify(current.output))
  : null);
let backend = null;
const logBuf = () => (backend ? backend.logs() : '');

function parseSse(text) {
  const events = [];
  for (const block of text.split('\n\n')) {
    const ev = (block.match(/^event: (.*)$/m) || [])[1] || '';
    const data = block.split('\n').filter(l => l.startsWith('data: ')).map(l => l.slice(6)).join('\n');
    if (!data) continue;
    let d = null;
    try { d = JSON.parse(data); } catch (_) { /* text */ }
    events.push({ ev, d });
  }
  return events;
}

async function runCase(port, endpoint, input) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), CASE_TIMEOUT_MS);
  const mark = logBuf().length;
  let status = 0, error = '';
  try {
    const res = await fetch(`http://127.0.0.1:${port}${endpoint}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-perf-probe': '1', 'user-agent': 'Mozilla/5.0 smoke-tools' },
      body: JSON.stringify({ userLanguage: 'en', userLocale: 'en-US', userCurrency: 'USD', userRegion: 'US', ...input }),
      signal: ctrl.signal,
    });
    status = res.status;
    const text = await res.text();
    if (/event-stream/.test(res.headers.get('content-type') || '')) {
      const errs = parseSse(text).filter(e => e.ev === 'error' || (e.d && (e.d.error || e.d.type === 'error')));
      if (errs.length) error = String((errs[0].d && (errs[0].d.error || errs[0].d.message)) || 'stream error').slice(0, 200);
    } else if (status >= 400) {
      try { const j = JSON.parse(text); error = String(j.error || j.message || '').slice(0, 200); } catch (_) { error = text.slice(0, 200); }
    }
  } catch (e) {
    error = e.name === 'AbortError' ? 'timeout' : String(e.message || e).slice(0, 200);
  } finally {
    clearTimeout(timer);
  }
  // Let late log lines for this request land before reading them.
  await new Promise(r => setTimeout(r, 30));
  const logs = logBuf().slice(mark);
  const crashLine = logs.split('\n').find(l => CRASH_RE.test(l)) || '';
  const ok = status >= 200 && status < 300 && !error;
  return { status, ok, error, crash: crashLine ? crashLine.trim().slice(0, 240) : '' };
}

async function main() {
  const golden = goldenCases();
  const routes = routeEndpoints();
  let endpoints = [...new Set([...golden.keys(), ...routes])].filter(e => !SKIP_RE.test(e)).sort();
  if (ONLY.length) endpoints = endpoints.filter(e => ONLY.some(o => e.includes(o)));

  const api = await startFakeApi(pick, apiCalls);
  let port, child;
  try {
    backend = await startBackend(BACKEND, api.address().port);
    ({ port, child } = backend);
  } catch (e) {
    console.error('smoke-tools: ' + e.message);
    api.close();
    process.exit(2);
  }

  const failures = [];
  const loadErrors = logBuf().split('\n').filter(l => /Failed to load route/.test(l));
  for (const l of loadErrors) failures.push(`route file failed to load: ${l.trim()}`);

  // Sibling inputs: every golden input from the same route file, merged.
  const siblingInput = new Map();
  for (const [ep, g] of golden) {
    const f = FILE_OF.get(ep);
    if (f) siblingInput.set(f, { ...(siblingInput.get(f) || {}), ...g.input });
  }

  const results = {};
  const t0 = Date.now();
  for (const ep of endpoints) {
    const g = golden.get(ep);
    current = g ? { output: g.output } : null;
    results[ep] = await runCase(port, ep, g ? g.input : { ...GENERIC_BODY, ...(siblingInput.get(FILE_OF.get(ep)) || {}), ...(INPUTS[ep] || {}) });
  }
  current = null;
  child.kill('SIGTERM');
  api.close();

  let baseline = {};
  try { baseline = JSON.parse(fs.readFileSync(BASELINE, 'utf8')).endpoints || {}; } catch (_) { /* first run */ }

  let okCount = 0, known = 0;
  for (const ep of endpoints) {
    const r = results[ep];
    const b = baseline[ep];
    if (r.ok) okCount++;
    if (r.status === 404 && golden.has(ep)) { failures.push(`${ep}: 404 — a golden endpoint that nothing serves`); continue; }
    if (!b) { if (!r.ok) known++; continue; } // new endpoint: recorded on --update
    if (b.ok && !r.ok) failures.push(`${ep}: worked in the baseline, now ${r.status} ${r.error}${r.crash ? `\n      log: ${r.crash}` : ''}`);
    else if (r.crash && !b.crash) failures.push(`${ep}: new crash — ${r.crash}`);
    else if (!r.ok) known++;
  }

  const secs = Math.round((Date.now() - t0) / 1000);
  console.log(`smoke-tools: ${endpoints.length} endpoints in ${secs}s, ${okCount} ran clean, ${known} known not to fit the canned answer. ${apiCalls.total} stand-in API calls (${apiCalls.stream} streaming), $0.`);

  if (UPDATE) {
    if (ONLY.length) { console.error('smoke-tools: --update needs a full run (drop --only).'); process.exit(2); }
    const out = {};
    for (const ep of endpoints) {
      const r = results[ep];
      out[ep] = { ok: r.ok, status: r.status, ...(r.error ? { error: r.error } : {}), ...(r.crash ? { crash: r.crash } : {}) };
    }
    fs.writeFileSync(BASELINE, JSON.stringify({ _meta: { updated: new Date().toISOString().slice(0, 10), note: 'Per-endpoint outcome against the stand-in API. Regenerate with node scripts/smoke-tools.js --update' }, endpoints: out }, null, 1) + '\n');
    console.log(`smoke-tools: baseline written (${endpoints.length} endpoints).`);
    if (loadErrors.length) { console.error(loadErrors.join('\n')); process.exit(1); }
    process.exit(0);
  }

  if (failures.length) {
    console.error(`\nsmoke-tools: ${failures.length} regression(s):`);
    for (const f of failures) console.error('  ✗ ' + f);
    console.error('\nA shared-code change broke tools whose own files did not change (T9, audit/DEFECT-TYPES.md).');
    process.exit(1);
  }
  console.log('smoke-tools: no regressions.');
}

main().catch(e => { console.error(e); process.exit(2); });
