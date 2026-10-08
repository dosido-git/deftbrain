#!/usr/bin/env node
//
// golden-for-push.js — run check:golden for the tools THIS push touches.
// ───────────────────────────────────────────────────────────────────────────
// check:golden is the only thing that looks at what a tool actually returns.
// It was not in the pre-push gates, and the cost of that showed up on
// 2026-08-30: GriefGuide's golden had been failing since its rewrite landed
// the day before, because the rewrite replaced the whole output schema and
// nobody re-recorded the sample. Nothing said so. Worse, a stale dev backend
// left running on :3001 answered three separate golden runs with the previous
// day's code, so the check reported PASS while testing nothing current.
//
// Running every locked tool on every push is not an option — that is ~120
// live model calls. So this runs only the goldens belonging to route files
// the push actually changes, the same scoping diff-audit.py uses.
//
// The backend has to be up for a golden to mean anything. If it is not, this
// says so loudly and exits 0 rather than blocking a push on a dev server
// nobody promised would be running — but it never reports success it did not
// observe, which is the failure this gate exists to prevent.

// PASSES ARE REMEMBERED (2026-10-08). The gate used to rerun every changed
// tool on every push attempt. A push stopped by an unrelated gate, or by one
// flaky case in one tool, then reran tools whose code had not changed since
// they passed — one retry on 2026-10-08 spent ~$5 rerunning 8 tools to
// re-check 1. Now each passing CASE is recorded with a fingerprint of
// everything the result depends on: the route file, its golden sample, every
// shared file in backend/lib/ and server.js. On the next push, cases that
// passed against the same fingerprint are skipped and only the rest run;
// change any of those files and the tool runs in full. The record lives in
// .git/ (local, untracked). GOLDEN_FORCE=1 ignores it.
//
// SPEND CAP. Each case is one or more live model calls (~$0.15 on average in
// October 2026). If a push would run more than GOLDEN_MAX_CASES (default 12),
// the gate stops before spending anything and says how many and roughly what
// they cost; rerun with a higher GOLDEN_MAX_CASES to proceed.

'use strict';

const { execFileSync, spawnSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PASS_FILE = path.join(__dirname, '..', '.git', 'golden-pass.json');
function fingerprint(slug) {
  const root = path.join(__dirname, '..');
  const lib = path.join(root, 'backend', 'lib');
  const files = [
    path.join(root, 'backend', 'routes', `${slug}.js`),
    path.join(root, 'audit', `${slug}-golden-sample.json`),
    path.join(root, 'backend', 'server.js'),
    ...fs.readdirSync(lib).filter(f => f.endsWith('.js')).sort().map(f => path.join(lib, f)),
  ];
  const h = crypto.createHash('sha256');
  for (const f of files) { h.update(f); h.update(fs.existsSync(f) ? fs.readFileSync(f) : ''); }
  return h.digest('hex');
}
function readPasses() { try { return JSON.parse(fs.readFileSync(PASS_FILE, 'utf8')); } catch { return {}; } }
function writePass(slug, fp, cases) {
  const all = readPasses();
  const prev = all[slug]?.fp === fp ? all[slug].cases || [] : [];
  all[slug] = { fp, cases: [...new Set([...prev, ...cases])], at: new Date().toISOString() };
  try { fs.writeFileSync(PASS_FILE, JSON.stringify(all, null, 1)); } catch (_) { /* a lost record only costs a rerun */ }
}
function caseNames(slug) {
  try {
    const g = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'audit', `${slug}-golden-sample.json`), 'utf8'));
    // Same two shapes check-golden's loadCases accepts.
    if (Array.isArray(g.cases) && g.cases.length) return g.cases.map(x => x && x.name).filter(Boolean);
    if (g.input && g.output) return [slug];
    return [];
  } catch { return []; }
}
const COST_PER_CASE = 0.15;
const MAX_CASES = Number(process.env.GOLDEN_MAX_CASES || 12);

const ROOT = path.join(__dirname, '..');
const BASE = process.env.GOLDEN_BASE_URL || 'http://localhost:3001';

function changedRouteSlugs() {
  let base = '';
  for (const ref of ['@{upstream}', 'origin/main']) {
    const r = spawnSync('git', ['rev-parse', '--verify', '--quiet', ref], { cwd: ROOT, encoding: 'utf8' });
    if (r.status === 0 && r.stdout.trim()) { base = ref; break; }
  }
  if (!base) return [];
  const out = execFileSync('git', ['diff', '--name-only', `${base}...HEAD`, '--', 'backend/routes/*.js'], { cwd: ROOT, encoding: 'utf8' });
  return out.split('\n').map(s => s.trim()).filter(Boolean)
    .map(f => path.basename(f, '.js'));
}

async function backendUp() {
  try {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 3000);
    const r = await fetch(`${BASE}/api/endpoints`, { signal: c.signal });
    clearTimeout(t);
    return r.ok;
  } catch { return false; }
}

(async () => {
  const slugs = changedRouteSlugs().filter(s =>
    fs.existsSync(path.join(ROOT, 'audit', `${s}-golden-sample.json`)));

  if (!slugs.length) {
    console.log('✅ golden-for-push: no changed route has a golden sample.');
    process.exit(0);
  }

  if (!await backendUp()) {
    console.log(`⚠️  golden-for-push: ${slugs.join(', ')} changed and ${slugs.length > 1 ? 'have goldens' : 'has a golden'}, but no backend is answering at ${BASE}.`);
    console.log('   NOT CHECKED — start it with `npm run dev:backend` and re-push to have this verified.');
    process.exit(0);
  }

  let failed = 0;
  const passes = process.env.GOLDEN_FORCE === '1' ? {} : readPasses();
  const plan = slugs.map(slug => {
    const fp = fingerprint(slug);
    const done = passes[slug]?.fp === fp ? new Set(passes[slug].cases || []) : new Set();
    const names = caseNames(slug);
    const todo = names.length ? names.filter(n => !done.has(n)) : null; // null: unknown shape, run it all
    return { slug, fp, done, todo };
  });
  const toRun = plan.reduce((n, p) => n + (p.todo === null ? 3 : p.todo.length), 0);
  if (toRun > MAX_CASES) {
    console.log(`✖ golden-for-push: this push would rerun ${toRun} case(s), about $${(toRun * COST_PER_CASE).toFixed(2)} of API calls — over the cap of ${MAX_CASES}.`);
    plan.forEach(p => console.log(`   ${p.slug}: ${p.todo === null ? 'all' : p.todo.length} to run${p.done.size ? `, ${p.done.size} already passed on this code` : ''}`));
    console.log(`   To proceed: GOLDEN_MAX_CASES=${toRun} git push`);
    process.exit(1);
  }
  for (const p of plan) {
    if (p.todo && !p.todo.length) {
      console.log(`golden-for-push: ${p.slug} — every case passed on this code already, skipped`);
      continue;
    }
    console.log(`golden-for-push: ${p.slug}`);
    const report = path.join(require('os').tmpdir(), `golden-${p.slug}-${process.pid}.json`);
    const r = spawnSync('node', [path.join(__dirname, 'check-golden.js'), p.slug], {
      cwd: ROOT, encoding: 'utf8', stdio: 'inherit',
      env: { ...process.env, GOLDEN_SKIP_CASES: [...p.done].join(','), GOLDEN_REPORT_FILE: report },
    });
    try { writePass(p.slug, p.fp, JSON.parse(fs.readFileSync(report, 'utf8')).passed || []); fs.unlinkSync(report); } catch (_) { /* no report, nothing recorded */ }
    if (r.status !== 0) failed++;
  }
  process.exit(failed ? 1 : 0);
})();
