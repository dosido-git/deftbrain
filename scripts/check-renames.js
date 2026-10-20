#!/usr/bin/env node
// ============================================================
// scripts/check-renames.js
// ============================================================
// Every row in audit/RENAMES.md must have a server-side 301.
//
// Why this exists: Recall → TheCrux shipped on 2026-07-16 with a CLIENT-side
// alias only (TOOL_ALIASES in src/components/ToolRenderer.js). A browser
// follows that fine. A crawler never sees it — the server 404s first and the
// React redirect never runs. So /Recall returned 404 for three weeks, every
// old link pointed at nothing, and any accrued signal was dropped. Nothing
// said a word, because a client-side alias LOOKS like a redirect when you
// click it yourself.
//
// The ledger is otherwise well kept — 34 renames, 33 of them redirected. This
// catches the one that slips.
//
// Reads source only. Fast enough for the pre-push hook.
// ============================================================

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function main() {
  const md = fs.readFileSync(path.join(ROOT, 'audit', 'RENAMES.md'), 'utf8');
  const srv = fs.readFileSync(path.join(ROOT, 'backend', 'server.js'), 'utf8');

  const start = srv.indexOf('const LEGACY_REDIRECTS');
  const end = srv.indexOf('Object.entries(LEGACY_REDIRECTS)');
  if (start === -1 || end === -1) {
    console.error('❌ check-renames: could not find LEGACY_REDIRECTS in backend/server.js.');
    console.error('   If it was renamed or moved, update this script — do not delete the gate.');
    process.exit(1);
  }
  const redirected = new Set(
    [...srv.slice(start, end).matchAll(/'\/([A-Za-z0-9-]+)'\s*:/g)].map(m => m[1].toLowerCase())
  );

  // Ledger rows look like: | OldName | NewName | notes |
  const renames = [];
  for (const line of md.split('\n')) {
    const m = line.match(/^\|\s*([A-Za-z][A-Za-z0-9]+)\s*\|\s*([A-Za-z][A-Za-z0-9]+)\s*\|/);
    if (m && m[1] !== 'Old' && m[1] !== 'Oldname') renames.push({ from: m[1], to: m[2] });
  }
  if (renames.length === 0) {
    console.error('❌ check-renames: parsed 0 rows from audit/RENAMES.md — the table format changed.');
    process.exit(1);
  }

  // server.js keeps its own copy of the catalog's tool ids (src/ is not
  // deployed). A tool missing from it loses its case-insensitive redirect —
  // QuoteCheck went unlisted for three months and /quotecheck answered 404.
  const ids = s => [...s].sort().join(', ');
  const srvIds = new Set((srv.match(/const TOOL_IDS = \[([\s\S]*?)\];/) || [, ''])[1].match(/'([^']+)'/g)?.map(x => x.slice(1, -1)) || []);
  const catIds = new Set([...fs.readFileSync(path.join(ROOT, 'src', 'data', 'tools.js'), 'utf8').matchAll(/^\s*id:\s*"([^"]+)"/gm)].map(m => m[1]));
  const unlisted = [...catIds].filter(i => !srvIds.has(i));
  const stale = [...srvIds].filter(i => !catIds.has(i));
  if (!srvIds.size || !catIds.size || unlisted.length || stale.length) {
    console.error(`\n❌ renames: TOOL_IDS in backend/server.js does not match src/data/tools.js.`);
    if (unlisted.length) console.error(`   Add: ${ids(unlisted)}`);
    if (stale.length) console.error(`   Remove (no longer a tool id): ${ids(stale)}`);
    if (!srvIds.size || !catIds.size) console.error('   Could not read one of the two lists — update this script, do not delete the gate.');
    return 1;
  }

  const missing = renames.filter(r => !redirected.has(r.from.toLowerCase()));
  if (missing.length === 0) {
    console.log(`✅ renames: all ${renames.length} renamed slug(s) have a server-side 301; TOOL_IDS matches the catalog (${catIds.size}).`);
    return 0;
  }

  console.error(`\n❌ renames: ${missing.length} renamed slug(s) have NO server-side redirect:\n`);
  missing.forEach(r => console.error(`   /${r.from}  →  should 301 to /${r.to}`));
  console.error(`\n   A client-side alias is not enough: crawlers get the server's 404 and`);
  console.error(`   never run the JS, so the old URL and its signal are lost.\n`);
  console.error(`   Fix: add to LEGACY_REDIRECTS in backend/server.js (Express matches it in any case):`);
  missing.forEach(r => console.error(`     '/${r.from}': '/${r.to}',`));
  console.error('');
  return 1;
}

process.exit(main());
