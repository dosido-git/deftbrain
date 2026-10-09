#!/usr/bin/env node
//
// golden-for-push.js — check what a push changes in a tool's answers, paying
// only for what the change can actually affect.
// ───────────────────────────────────────────────────────────────────────────
// check:golden is the only thing that looks at what a tool actually returns.
// It was not in the pre-push gates, and the cost of that showed up on
// 2026-08-30: GriefGuide's golden had been failing since its rewrite landed
// the day before, because the rewrite replaced the whole output schema and
// nobody re-recorded the sample. Nothing said so.
//
// HOW MUCH IT RUNS (owner rule, 2026-10-09: never spend on a check that a
// cheaper one answers). Until now every changed tool reran ALL its saved cases
// live, ~$0.15 each — a one-line change to 49 tools priced at $19, to
// regenerate answers the change could not touch. Now each changed route is
// sorted by what its diff can affect:
//
//   REPLAY (free). The diff touches no prompt text and no model call — it
//   changes what happens to an answer after it is written (a check, a filter,
//   a repair, wiring). Every saved case is replayed: the real backend runs
//   with a stand-in API that answers with the saved output (scripts/lib/
//   standin.js), at the push's base AND at HEAD. A case that passes at the
//   base and fails at HEAD is a regression. $0.
//
//   LIVE (paid, minimal). The diff touches a prompt, a model, max_tokens, the
//   messages or tools sent, or the file is new. One saved case per endpoint
//   whose handler (or a helper it uses) changed — not every case. ~$0.15 each.
//
// Shared code (backend/lib, server.js) is not rerun here: scripts/smoke-tools.js
// (Gate 12) runs every endpoint against the stand-in for free.
//
// PASSES ARE REMEMBERED (2026-10-08) for live cases, fingerprinted on the route
// file, its golden, server.js and backend/lib. GOLDEN_FORCE=1 ignores the record.
// SPEND CAP: more than GOLDEN_MAX_CASES (default 12) live cases stops before
// spending anything and says what it would cost.
// GOLDEN_LIVE=1 treats every changed route as LIVE (the old behaviour, one
// case per changed endpoint still). GOLDEN_DRY=1 prints the plan and stops.
const { execFileSync, spawnSync, spawn } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { startFakeApi, startBackend, bestCase } = require('./lib/standin');

const ROOT = path.join(__dirname, '..');
const PASS_FILE = path.join(ROOT, '.git', 'golden-pass.json');
const MAX_CASES = Number(process.env.GOLDEN_MAX_CASES || 12);
const BASE_URL = process.env.GOLDEN_BASE_URL || 'http://localhost:3001';
const COST_PER_CASE = 0.15;

// A changed line that matches this can change what the model writes.
const GENERATION_RE = /\bmodel\s*:|max_tokens|\bMODELS\.|\bsystem\s*:|\bmessages\s*:|callClaudeWithRetry|messages\.(create|stream)|withLanguage|withLocaleContext|\btools\s*:|temperature|thinking\s*:|\bPROMPT\b|_PROMPT\b|\bprompt\b/;

function fingerprint(slug) {
  const lib = path.join(ROOT, 'backend', 'lib');
  const files = [
    path.join(ROOT, 'backend', 'routes', `${slug}.js`),
    path.join(ROOT, 'audit', `${slug}-golden-sample.json`),
    path.join(ROOT, 'backend', 'server.js'),
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
function loadCases(slug) {
  try {
    const g = JSON.parse(fs.readFileSync(path.join(ROOT, 'audit', `${slug}-golden-sample.json`), 'utf8'));
    if (Array.isArray(g.cases) && g.cases.length) return g.cases.filter(c => c && c.name && c.endpoint);
    if (g.input && g.output) return [{ name: slug, endpoint: (g._meta && g._meta.endpoint) || g.endpoint, input: g.input, output: g.output }];
  } catch { /* none */ }
  return [];
}

function git(args) { return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }); }
function pushBase() {
  for (const ref of ['@{upstream}', 'origin/main']) {
    const r = spawnSync('git', ['rev-parse', '--verify', '--quiet', ref], { cwd: ROOT, encoding: 'utf8' });
    if (r.status === 0 && r.stdout.trim()) return ref;
  }
  return '';
}

// Lines of `src` inside the text of a template literal long enough to be a
// prompt (120+ characters) — where this codebase writes its prompts. A short
// template ("about ${secs} seconds") is output formatting, not a prompt. A
// rough scanner (strings, comments, `${}` nesting); good enough to tell
// prompt text from code.
function templateLines(src) {
  const lines = new Set();
  let line = 1, i = 0;
  const braces = [];
  const open = []; // per open template: { lines: Set, chars }
  let mode = 'code';
  const close = () => {
    const t = open.pop();
    if (t && t.chars >= 120) t.lines.forEach(n => lines.add(n));
  };
  while (i < src.length) {
    const ch = src[i], nx = src[i + 1];
    if (ch === '\n') line++;
    if (mode === 'line') { if (ch === '\n') mode = 'code'; i++; continue; }
    if (mode === 'block') { if (ch === '*' && nx === '/') { mode = 'code'; i += 2; continue; } i++; continue; }
    if (mode === "'" || mode === '"') { if (ch === '\\') { i += 2; continue; } if (ch === mode || ch === '\n') mode = 'code'; i++; continue; }
    if (mode === 'tpl') {
      const t = open[open.length - 1];
      t.lines.add(line); t.chars++;
      if (ch === '\\') { i += 2; continue; }
      if (ch === '`') { close(); mode = 'code'; i++; continue; }
      if (ch === '$' && nx === '{') { braces.push(0); mode = 'code'; i += 2; continue; }
      i++; continue;
    }
    if (ch === '/' && nx === '/') { mode = 'line'; i += 2; continue; }
    if (ch === '/' && nx === '*') { mode = 'block'; i += 2; continue; }
    if (ch === "'" || ch === '"') { mode = ch; i++; continue; }
    if (ch === '`') { open.push({ lines: new Set([line]), chars: 0 }); mode = 'tpl'; i++; continue; }
    if (braces.length) {
      if (ch === '{') braces[braces.length - 1]++;
      else if (ch === '}') {
        if (braces[braces.length - 1] === 0) { braces.pop(); mode = 'tpl'; i++; continue; }
        braces[braces.length - 1]--;
      }
    }
    i++;
  }
  return lines;
}

// Comments and require lines change nothing a case can see on their own.
const INERT = /^\s*(\/\/|\*|\/\*)|^\s*const\s+\{[^}]*\}\s*=\s*require\(|^\s*const\s+[\w$]+\s*=\s*require\(/;

// { tier, reason, newLines } for one route file's diff since the push base.
function classify(slug, base) {
  const rel = `backend/routes/${slug}.js`;
  const oldSrc = spawnSync('git', ['show', `${base}:${rel}`], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (oldSrc.status !== 0) return { tier: 'live', reason: 'new route file', newLines: [] };
  if (process.env.GOLDEN_LIVE === '1') return { tier: 'live', reason: 'GOLDEN_LIVE=1', newLines: changedLines(base, rel).added.map(a => a.n) };
  const newSrc = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const { added: allAdded, removed: allRemoved } = changedLines(base, rel);
  const added = allAdded.filter(a => !INERT.test(a.text));
  const removed = allRemoved.filter(r => !INERT.test(r.text));
  const tplNew = templateLines(newSrc), tplOld = templateLines(oldSrc.stdout);
  for (const a of added) {
    if (tplNew.has(a.n)) return { tier: 'live', reason: `prompt text changed (line ${a.n})`, newLines: added.map(x => x.n) };
    if (GENERATION_RE.test(a.text)) return { tier: 'live', reason: `model call changed (line ${a.n})`, newLines: added.map(x => x.n) };
  }
  for (const r of removed) {
    if (tplOld.has(r.n)) return { tier: 'live', reason: 'prompt text removed', newLines: added.map(x => x.n) };
    if (GENERATION_RE.test(r.text)) return { tier: 'live', reason: 'model call changed', newLines: added.map(x => x.n) };
  }
  return { tier: 'replay', reason: 'after-generation change only', newLines: added.map(x => x.n) };
}

function changedLines(base, rel) {
  const diff = git(['diff', '-U0', `${base}...HEAD`, '--', rel]);
  const added = [], removed = [];
  let oldN = 0, newN = 0;
  for (const l of diff.split('\n')) {
    const h = l.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
    if (h) { oldN = Number(h[1]); newN = Number(h[2]); continue; }
    if (l.startsWith('+++') || l.startsWith('---')) continue;
    if (l.startsWith('+')) { if (l.slice(1).trim()) added.push({ n: newN, text: l.slice(1) }); newN++; }
    else if (l.startsWith('-')) { if (l.slice(1).trim()) removed.push({ n: oldN, text: l.slice(1) }); oldN++; }
  }
  return { added, removed };
}

// Endpoints whose handler contains a changed line, or uses a top-level
// declaration that contains one.
function touchedEndpoints(slug, newLines) {
  const src = fs.readFileSync(path.join(ROOT, 'backend', 'routes', `${slug}.js`), 'utf8');
  const lines = src.split('\n');
  const handlers = [];
  lines.forEach((l, i) => {
    const m = l.match(/^router\.(post|get)\(\s*['"`]([^'"`]+)/);
    if (m) handlers.push({ endpoint: '/api' + m[2], start: i + 1 });
  });
  handlers.forEach((h, i) => { h.end = i + 1 < handlers.length ? handlers[i + 1].start - 1 : lines.length; });
  const hit = new Set(), names = new Set();
  for (const n of newLines) {
    const h = handlers.find(x => n >= x.start && n <= x.end);
    if (h) { hit.add(h.endpoint); continue; }
    for (let k = n - 1; k >= 0; k--) {
      const d = lines[k].match(/^(?:async\s+)?function\s+([\w$]+)|^(?:const|let|var)\s+([\w$]+)\s*=/);
      if (d) { names.add(d[1] || d[2]); break; }
    }
  }
  for (const name of names) {
    for (const h of handlers) if (lines.slice(h.start - 1, h.end).join('\n').match(new RegExp(`\\b${name.replace(/\$/g, '\\$')}\\b`))) hit.add(h.endpoint);
  }
  return hit;
}

function runCheckGolden(slug, baseUrl, skip, quiet) {
  const report = path.join(os.tmpdir(), `golden-${slug}-${process.pid}-${Date.now()}.json`);
  return new Promise(resolve => {
    const child = spawn('node', [path.join(__dirname, 'check-golden.js'), slug], {
      cwd: ROOT, stdio: quiet ? 'ignore' : 'inherit',
      env: { ...process.env, GOLDEN_BASE_URL: baseUrl, GOLDEN_SKIP_CASES: [...skip].join(','), GOLDEN_REPORT_FILE: report, ...(baseUrl !== BASE_URL ? { GOLDEN_PERF_PROBE: '1' } : {}) },
    });
    child.on('close', () => {
      let passed = [];
      try { passed = JSON.parse(fs.readFileSync(report, 'utf8')).passed || []; fs.unlinkSync(report); } catch (_) { /* none */ }
      resolve(new Set(passed));
    });
  });
}

async function backendUp() {
  try {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 3000);
    const r = await fetch(`${BASE_URL}/api/endpoints`, { signal: c.signal });
    clearTimeout(t);
    return r.ok;
  } catch { return false; }
}

// Replay every case of the replay-tier tools, at the push base and at HEAD,
// against the stand-in. Returns the number of tools with a regression.
async function replay(slugs, base) {
  let current = [];
  const api = await startFakeApi(body => { const c = bestCase(body, current); return c ? JSON.stringify(c.output) : null; });
  const wt = path.join(os.tmpdir(), `golden-base-${process.pid}`);
  let head, old, failed = 0;
  try {
    git(['worktree', 'add', '--detach', '--quiet', wt, base]);
    for (const nm of ['node_modules', path.join('backend', 'node_modules')]) {
      if (fs.existsSync(path.join(ROOT, nm)) && !fs.existsSync(path.join(wt, nm))) fs.symlinkSync(path.join(ROOT, nm), path.join(wt, nm));
    }
    [head, old] = await Promise.all([
      startBackend(path.join(ROOT, 'backend'), api.address().port),
      startBackend(path.join(wt, 'backend'), api.address().port),
    ]);
    for (const slug of slugs) {
      current = loadCases(slug);
      const atBase = await runCheckGolden(slug, `http://127.0.0.1:${old.port}`, [], true);
      const atHead = await runCheckGolden(slug, `http://127.0.0.1:${head.port}`, [], process.env.GOLDEN_REPLAY_VERBOSE !== '1');
      const broke = current.filter(c => atBase.has(c.name) && !atHead.has(c.name)).map(c => c.name);
      const fixed = current.filter(c => !atBase.has(c.name) && atHead.has(c.name)).length;
      if (broke.length) {
        failed++;
        console.log(`✖ golden-for-push: ${slug} — replay regression in ${broke.join(', ')} (passes at the base, fails now). Detail: GOLDEN_BASE_URL=<replay> node scripts/check-golden.js ${slug}`);
      } else {
        console.log(`  ${slug}: replayed ${current.length} saved case(s) (${atHead.size} pass), no regression${fixed ? `, ${fixed} newly passing` : ''} — $0`);
      }
    }
  } finally {
    if (head) head.child.kill('SIGTERM');
    if (old) old.child.kill('SIGTERM');
    api.close();
    spawnSync('git', ['worktree', 'remove', '--force', wt], { cwd: ROOT });
  }
  return failed;
}

(async () => {
  const base = pushBase();
  if (!base) { console.log('golden-for-push: no upstream to compare with — skipped.'); process.exit(0); }
  const slugs = git(['diff', '--name-only', `${base}...HEAD`, '--', 'backend/routes/*.js'])
    .split('\n').map(s => s.trim()).filter(Boolean).map(f => path.basename(f, '.js'))
    .filter(s => fs.existsSync(path.join(ROOT, 'audit', `${s}-golden-sample.json`)));
  if (!slugs.length) {
    console.log('✅ golden-for-push: no changed route has a golden sample.');
    process.exit(0);
  }

  const sorted = slugs.map(slug => ({ slug, ...classify(slug, base) }));
  const replaySlugs = sorted.filter(x => x.tier === 'replay').map(x => x.slug);
  const live = sorted.filter(x => x.tier === 'live');

  // Live plan: one case per touched endpoint, skipping cases already passed on this code.
  const passes = process.env.GOLDEN_FORCE === '1' ? {} : readPasses();
  const plan = live.map(x => {
    const cases = loadCases(x.slug);
    const fp = fingerprint(x.slug);
    const done = passes[x.slug]?.fp === fp ? new Set(passes[x.slug].cases || []) : new Set();
    let endpoints = touchedEndpoints(x.slug, x.newLines);
    if (!endpoints.size || x.reason === 'new route file') endpoints = new Set(cases.map(c => c.endpoint));
    const pick = [];
    for (const ep of endpoints) {
      const forEp = cases.filter(c => c.endpoint === ep);
      if (!forEp.length || forEp.some(c => done.has(c.name))) continue;
      pick.push(forEp[0].name);
    }
    // A changed endpoint with no saved case is reported, not substituted: a
    // case for a different endpoint would cost money and test nothing changed.
    const uncovered = [...endpoints].filter(ep => !cases.some(c => c.endpoint === ep));
    return { ...x, fp, cases, pick, uncovered };
  });
  const toRun = plan.reduce((n, p) => n + p.pick.length, 0);

  console.log(`golden-for-push: ${replaySlugs.length} tool(s) replayed free, ${toRun} live case(s) (~$${(toRun * COST_PER_CASE).toFixed(2)}).`);
  for (const p of plan) console.log(`  ${p.slug}: LIVE — ${p.reason}; ${p.pick.length ? `${p.pick.length} case(s): ${p.pick.join(', ')}` : 'nothing to run'}${p.uncovered.length ? ` (no saved case for ${p.uncovered.join(', ')} — not checked)` : ''}`);

  if (process.env.GOLDEN_DRY === '1') { console.log(`  replay: ${replaySlugs.join(', ') || 'none'}`); process.exit(0); }

  if (toRun > MAX_CASES) {
    console.log(`✖ golden-for-push: ${toRun} live case(s), about $${(toRun * COST_PER_CASE).toFixed(2)} — over the cap of ${MAX_CASES}.`);
    console.log(`   To proceed: GOLDEN_MAX_CASES=${toRun} git push`);
    process.exit(1);
  }

  let failed = 0;
  if (replaySlugs.length) failed += await replay(replaySlugs, base);

  if (toRun) {
    if (!await backendUp()) {
      console.log(`⚠️  golden-for-push: ${toRun} live case(s) need the dev backend, and nothing is answering at ${BASE_URL}.`);
      console.log('   NOT CHECKED — start it with `npm run dev:backend` and re-push to have this verified.');
    } else {
      for (const p of plan) {
        if (!p.pick.length) continue;
        const skip = p.cases.map(c => c.name).filter(n => !p.pick.includes(n));
        console.log(`golden-for-push: ${p.slug} (live)`);
        const passed = await runCheckGolden(p.slug, BASE_URL, skip, false);
        const ran = p.pick.filter(n => passed.has(n));
        writePass(p.slug, p.fp, ran);
        if (ran.length < p.pick.length) failed++;
      }
    }
  }
  process.exit(failed ? 1 : 0);
})();
