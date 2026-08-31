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

'use strict';

const { execFileSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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
  for (const slug of slugs) {
    console.log(`golden-for-push: ${slug}`);
    const r = spawnSync('node', [path.join(__dirname, 'check-golden.js'), slug],
      { cwd: ROOT, encoding: 'utf8', stdio: 'inherit' });
    if (r.status !== 0) failed++;
  }
  process.exit(failed ? 1 : 0);
})();
