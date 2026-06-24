#!/usr/bin/env node
//
// check-golden.js — opt-in OUTPUT-QUALITY regression check for "locked" tools.
// ───────────────────────────────────────────────────────────────────────────
// The 5 pre-push gates check structure, not output quality — so a prompt / model
// / max_tokens change can truncate JSON, drop a section, or corrupt a PDF payload
// while every gate stays green (exactly how DVT regressed). This re-runs each
// locked tool's known-good inputs against the LOCAL dev backend and asserts the
// invariants the gates miss:
//   • HTTP 200 with no `error` field
//   • every section the known-good output had is still present
//   • every section that was a non-empty array is still non-empty
//   • diagrams still close (</svg> / </div>) — i.e. not truncated
// LLM wording/numbers vary run-to-run, so it checks structure + invariants, not
// exact text. A green run means "no structural regression"; still eyeball the
// wording against the golden sample for subtle quality drift.
//
// Usage:   node scripts/check-golden.js <tool>     check one tool (e.g. dvt, buywise)
//          node scripts/check-golden.js            check ALL locked tools (auto-discovered)
//          node scripts/check-golden.js all        same as no arg
//          npm run check:golden dvt   |   npm run check:golden:all
// Needs the dev backend up:  npm run dev:backend   (or: cd backend && node server.js)
// Reads:   audit/<tool>-golden-sample.json  ({ _meta, cases:[{name,endpoint,input,output}] }
//          or the legacy single-case { _meta:{endpoint}, input, output }).
// Exit:    0 all passed · 1 a case regressed · 2 setup error (no file / bad usage).

const fs = require('fs');
const path = require('path');

const AUDIT_DIR = path.join(__dirname, '..', 'audit');
const BASE = process.env.GOLDEN_BASE_URL || 'http://localhost:3001';
const CASE_TIMEOUT_MS = 180000; // LLM calls can run long (large schemas / SVGs)

function findGoldenFile(tool) {
  for (const name of [`${tool}-golden-sample.json`, `${tool}-golden.json`]) {
    const p = path.join(AUDIT_DIR, name);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

// Every locked tool = an audit/<tool>-golden-sample.json (or -golden.json).
function discoverTools() {
  const seen = new Set();
  for (const f of fs.readdirSync(AUDIT_DIR)) {
    const m = f.match(/^(.+?)-golden(?:-sample)?\.json$/);
    if (m) seen.add(m[1]);
  }
  return [...seen].sort();
}

// Normalize either golden format → [{ name, endpoint, input, output }]
function loadCases(golden, tool) {
  if (Array.isArray(golden.cases) && golden.cases.length) return golden.cases;
  const endpoint = (golden._meta && golden._meta.endpoint) || golden.endpoint;
  if (golden.input && golden.output && endpoint) {
    return [{ name: tool, endpoint, input: golden.input, output: golden.output }];
  }
  return null;
}

async function post(endpoint, input) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), CASE_TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
      signal: ctrl.signal,
    });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* leave null */ }
    return { status: res.status, json };
  } finally {
    clearTimeout(timer);
  }
}

const isDiagram = (o) => o && typeof o === 'object' && typeof o.html === 'string' && 'type' in o;

// Derive invariants from the known-good output, assert against the fresh one.
function diffCase(goldenOut, fresh) {
  const fails = [];
  if (fresh.status !== 200) fails.push(`HTTP ${fresh.status} (expected 200)`);
  const out = fresh.json;
  if (!out || typeof out !== 'object') { fails.push('response was not valid JSON'); return fails; }
  if (out.error) fails.push(`error response: "${out.error}"`);

  if (isDiagram(goldenOut)) {
    if (typeof out.html !== 'string' || !out.html.trim()) fails.push('diagram html missing/empty');
    else if (!/<\/svg>|<\/div>/i.test(out.html)) fails.push('diagram not closed (no </svg> or </div> — truncated?)');
  } else {
    for (const k of Object.keys(goldenOut)) {
      if (k.startsWith('_')) continue; // skip debug/meta keys like _grounded
      if (!(k in out)) { fails.push(`missing section: "${k}"`); continue; }
      const gv = goldenOut[k];
      const nv = out[k];
      if (Array.isArray(gv) && gv.length > 0 && (!Array.isArray(nv) || nv.length === 0)) {
        fails.push(`section "${k}" was a non-empty array, now empty/absent`);
      }
    }
  }
  return fails;
}

// Run one locked tool's cases. Returns { ok, total, passed, setupError }.
async function runTool(tool) {
  const file = findGoldenFile(tool);
  if (!file) { console.log(`  ! ${tool}: no golden file (audit/${tool}-golden-sample.json)`); return { ok: false, total: 0, passed: 0, setupError: true }; }
  let golden;
  try { golden = JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (e) { console.log(`  ! ${tool}: could not parse ${path.basename(file)} — ${e.message}`); return { ok: false, total: 0, passed: 0, setupError: true }; }
  const cases = loadCases(golden, tool);
  if (!cases) { console.log(`  ! ${tool}: ${path.basename(file)} has no usable cases`); return { ok: false, total: 0, passed: 0, setupError: true }; }

  console.log(`${tool} — ${cases.length} case(s):`);
  let passed = 0;
  for (const c of cases) {
    process.stdout.write(`  • ${c.name}  ${c.endpoint}  … `);
    let fresh;
    try {
      fresh = await post(c.endpoint, c.input);
    } catch (e) {
      const why = e.name === 'AbortError' ? `timed out after ${CASE_TIMEOUT_MS / 1000}s` : (e.message || String(e));
      console.log(`ERROR — ${why}`);
      if (/ECONNREFUSED|fetch failed|ENOTFOUND/i.test(why)) console.log(`     ↳ backend not reachable on ${BASE} — start it: npm run dev:backend`);
      continue;
    }
    const fails = diffCase(c.output, fresh);
    if (fails.length === 0) { console.log('PASS'); passed++; }
    else { console.log('FAIL'); fails.forEach(f => console.log(`     ✖ ${f}`)); }
  }
  return { ok: passed === cases.length, total: cases.length, passed, setupError: false };
}

async function main() {
  const arg = process.argv[2];
  const all = !arg || arg === 'all';

  if (!all) {
    if (!findGoldenFile(arg)) { console.error(`No golden file for "${arg}" (looked for audit/${arg}-golden-sample.json). Lock the tool first.`); process.exit(2); }
    console.log(`check:golden ${arg} — vs ${BASE}  (re-running known-good inputs)\n`);
    const r = await runTool(arg);
    if (r.setupError) process.exit(2);
    console.log(`\n${r.ok ? '✅' : '✖'} check:golden ${arg}: ${r.passed}/${r.total} case(s) passed.`);
    if (r.ok) console.log('   No structural regression. Still eyeball wording/numbers against the golden sample for subtle drift.');
    process.exit(r.ok ? 0 : 1);
  }

  const tools = discoverTools();
  if (!tools.length) { console.log('No locked tools (no audit/*-golden-sample.json). Nothing to check.'); process.exit(0); }
  console.log(`check:golden ALL — ${tools.length} locked tool(s) [${tools.join(', ')}] vs ${BASE}\n`);
  let anyFail = false;
  let totC = 0, passC = 0;
  for (const t of tools) {
    const r = await runTool(t);
    totC += r.total; passC += r.passed;
    if (!r.ok) anyFail = true;
    console.log('');
  }
  console.log(`${anyFail ? '✖' : '✅'} check:golden ALL: ${passC}/${totC} case(s) across ${tools.length} tool(s).`);
  if (!anyFail) console.log('   No structural regression in any locked tool. Still eyeball wording/numbers for subtle drift.');
  process.exit(anyFail ? 1 : 0);
}

main().catch(e => { console.error('check-golden crashed:', e); process.exit(2); });
