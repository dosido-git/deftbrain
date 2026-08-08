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

  const missing = renames.filter(r => !redirected.has(r.from.toLowerCase()));
  if (missing.length === 0) {
    console.log(`✅ renames: all ${renames.length} renamed slug(s) have a server-side 301.`);
    return 0;
  }

  console.error(`\n❌ renames: ${missing.length} renamed slug(s) have NO server-side redirect:\n`);
  missing.forEach(r => console.error(`   /${r.from}  →  should 301 to /${r.to}`));
  console.error(`\n   A client-side alias is not enough: crawlers get the server's 404 and`);
  console.error(`   never run the JS, so the old URL and its signal are lost.\n`);
  console.error(`   Fix: add both cases to LEGACY_REDIRECTS in backend/server.js:`);
  missing.forEach(r => {
    console.error(`     '/${r.from}': '/${r.to}',`);
    console.error(`     '/${r.from.toLowerCase()}': '/${r.to}',`);
  });
  console.error('');
  return 1;
}

process.exit(main());
