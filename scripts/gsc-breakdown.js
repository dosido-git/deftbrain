#!/usr/bin/env node
// ============================================================
// scripts/gsc-breakdown.js
// ============================================================
// Answers "which part of the site did Google change its mind about?"
//
// GSC tells you 591 pages are "Crawled - currently not indexed" and stops
// there. That number is useless on its own: 88 tools are deliberately
// noindexed and 381 guides were deliberately consolidated, so a large
// not-indexed count is partly the plan working. What matters is how many are
// pages you WANTED indexed.
//
// This takes a per-reason URL export from GSC and sorts it against what the
// repo actually intends for each URL.
//
// USAGE
//   node scripts/gsc-breakdown.js ~/Desktop/deftbrain-2/Table.csv
//
// GETTING THE EXPORT
//   Search Console → Indexing → Pages → click the reason row
//   → EXPORT (top right) → Download CSV → use the "Table" sheet.
//
// Works with any reason row, not just Crawled-not-indexed.
// ============================================================

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const file = process.argv[2];

if (!file) {
  console.error('Usage: node scripts/gsc-breakdown.js <exported-table.csv>');
  console.error('  GSC → Indexing → Pages → click a reason → EXPORT → the "Table" sheet.');
  process.exit(1);
}
if (!fs.existsSync(file)) {
  console.error(`Not found: ${file}`);
  process.exit(1);
}

// ── what the repo intends ──────────────────────────────────────────────────
function intent() {
  const indexableTools = new Set();
  const allTools = new Set();
  try {
    // server.js's TOOL_IDS is the curated list of live tool paths — more
    // accurate than regexing tools.js, which also matches non-tool `id:` keys.
    const srv = fs.readFileSync(path.join(ROOT, 'backend', 'server.js'), 'utf8');
    const block = srv.slice(srv.indexOf('const TOOL_IDS'), srv.indexOf('const toolIdMap'));
    for (const m of block.matchAll(/'([A-Za-z0-9]+)'/g)) allTools.add(m[1]);
  } catch { /* fall through — classification still works, intent will be unknown */ }
  try {
    // The sitemap is the authoritative list of what we ask Google to index.
    const sm = fs.readFileSync(path.join(ROOT, 'public', 'sitemap-app.xml'), 'utf8');
    for (const m of sm.matchAll(/<loc>https:\/\/deftbrain\.com\/([A-Za-z0-9]+)<\/loc>/g)) indexableTools.add(m[1]);
  } catch { /* ditto */ }

  const keptGuides = new Set();
  try {
    const keep = JSON.parse(fs.readFileSync(path.join(ROOT, 'guides', 'keep-list.json'), 'utf8'));
    for (const [cat, slugs] of Object.entries(keep.keep || {})) slugs.forEach(s => keptGuides.add(`${cat}/${s}`));
  } catch { /* ditto */ }

  return { allTools, indexableTools, keptGuides };
}

// ── classify one URL ───────────────────────────────────────────────────────
function classify(url, ix) {
  let p;
  try { p = new URL(url).pathname.replace(/\/$/, '') || '/'; } catch { return { kind: 'unparseable', want: null }; }

  if (p === '/') return { kind: 'homepage', want: true };

  const guide = p.match(/^\/guides\/([a-z0-9-]+)\/([a-z0-9-]+)$/);
  if (guide) {
    const key = `${guide[1]}/${guide[2]}`;
    return { kind: 'guide article', want: ix.keptGuides.has(key) };
  }
  if (/^\/guides\/[a-z0-9-]+$/.test(p)) return { kind: 'guide hub', want: true };
  if (p === '/guides' || p === '/guides/by-tool') return { kind: 'guide index', want: true };

  const tool = p.match(/^\/([A-Za-z0-9]+)$/);
  if (tool && ix.allTools.has(tool[1])) {
    return { kind: 'tool page', want: ix.indexableTools.has(tool[1]) };
  }
  if (/^\/(about|privacy|terms|contact)$/i.test(p)) return { kind: 'static page', want: true };
  return { kind: 'other', want: null };
}

// ── minimal CSV reader (GSC exports are simple, but quote-safe anyway) ─────
function parseCsv(text) {
  const rows = [];
  let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else if (c !== '\r') cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter(r => r.some(x => x.trim()));
}

const rows = parseCsv(fs.readFileSync(file, 'utf8'));
const header = rows[0].map(h => h.trim().toLowerCase());
const urlCol = header.findIndex(h => h.includes('url') || h.includes('page'));
if (urlCol === -1) {
  console.error(`No URL column found. Header was: ${rows[0].join(' | ')}`);
  console.error('Make sure you exported the "Table" sheet, not the summary.');
  process.exit(1);
}

const ix = intent();
const urls = rows.slice(1).map(r => (r[urlCol] || '').trim()).filter(u => u.startsWith('http'));

const byKind = new Map();
const wanted = [];
for (const u of urls) {
  const { kind, want } = classify(u, ix);
  const b = byKind.get(kind) || { total: 0, want: 0, notWant: 0, unknown: 0, sample: [] };
  b.total++;
  if (want === true) { b.want++; if (wanted.length < 400) wanted.push(u); }
  else if (want === false) b.notWant++;
  else b.unknown++;
  if (b.sample.length < 3) b.sample.push(new URL(u).pathname);
  byKind.set(kind, b);
}

const pad = (s, n) => String(s).padEnd(n);
const num = (s, n) => String(s).padStart(n);

console.log(`\n${path.basename(file)} — ${urls.length} URL(s)\n`);
console.log(`  ${pad('what it is', 16)}${num('total', 7)}${num('want indexed', 14)}${num('meant to be out', 17)}`);
console.log(`  ${'─'.repeat(54)}`);
for (const [kind, b] of [...byKind.entries()].sort((a, b) => b[1].total - a[1].total)) {
  console.log(`  ${pad(kind, 16)}${num(b.total, 7)}${num(b.want, 14)}${num(b.notWant + (b.unknown ? ` (+${b.unknown}?)` : ''), 17)}`);
}

const totalWant = [...byKind.values()].reduce((n, b) => n + b.want, 0);
const totalOut = [...byKind.values()].reduce((n, b) => n + b.notWant, 0);
console.log(`  ${'─'.repeat(54)}`);
console.log(`  ${pad('', 16)}${num(urls.length, 7)}${num(totalWant, 14)}${num(totalOut, 17)}\n`);

console.log(`${totalOut} of these are pages you deliberately took out of the index —`);
console.log(`noindexed tools or consolidated guides. Those are the plan working.\n`);
console.log(`${totalWant} are pages you ASK Google to index (they are in a sitemap or`);
console.log(`on the keep-list) and it is declining. That is the number that matters.\n`);

if (wanted.length) {
  console.log(`First ${Math.min(15, wanted.length)} of the ${totalWant}:`);
  wanted.slice(0, 15).forEach(u => console.log(`   ${new URL(u).pathname}`));
  if (totalWant > 15) console.log(`   … and ${totalWant - 15} more`);
  console.log('');
}
