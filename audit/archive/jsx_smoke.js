#!/usr/bin/env node
/**
 * jsx_smoke.js — JSX integrity smoke check across tool files.
 *
 * Uses @babel/parser (already in node_modules via react-scripts) to parse
 * every file as a JSX module. Reports every broken file in one pass.
 * Much faster than `npm run build` (which is slow, bundles, and stops at
 * the first error).
 *
 * USAGE
 *   node audit/jsx_smoke.js                      # check src/tools/*.js
 *   node audit/jsx_smoke.js path/to/file.js ...  # check specific files
 *
 * OUTPUT
 *   FAIL  <file>          followed by parser error
 *   <summary line>        clean/failed counts at the end
 *
 * Exit codes
 *   0 — all files clean
 *   1 — at least one file failed
 *   2 — @babel/parser not found (install: npm install --save-dev @babel/parser)
 */

const fs = require('fs');
const path = require('path');

let parser;
try {
  parser = require('@babel/parser');
} catch (e) {
  console.error('ERROR: Cannot find @babel/parser.');
  console.error('Install with: npm install --save-dev @babel/parser');
  console.error('(it is usually already a transitive dep of react-scripts;');
  console.error(' check node_modules/@babel/parser before installing)');
  process.exit(2);
}

// File list: argv if given, otherwise glob src/tools/*.js
let files = process.argv.slice(2);
if (files.length === 0) {
  const dir = 'src/tools';
  if (!fs.existsSync(dir)) {
    console.error(`No files specified and ${dir} not found. Run from repo root.`);
    process.exit(1);
  }
  files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.js'))
    .map((f) => path.join(dir, f));
}

let failCount = 0;
const failed = [];

for (const f of files) {
  if (!fs.existsSync(f)) {
    console.error(`SKIP ${f} (not a file)`);
    continue;
  }
  let src;
  try {
    src = fs.readFileSync(f, 'utf8');
  } catch (e) {
    console.log(`FAIL  ${f}`);
    console.log(`      ${e.message}`);
    failCount++;
    failed.push(f);
    continue;
  }
  try {
    parser.parse(src, {
      sourceType: 'module',
      plugins: ['jsx'],
      // Be permissive on syntax features so we focus on real breakage,
      // not on plugins that CRA's full Babel chain would have enabled.
      errorRecovery: false,
    });
    // silent on success
  } catch (e) {
    console.log(`FAIL  ${f}`);
    // Babel errors include line/column embedded in the message — print as-is
    console.log(`      ${e.message}`);
    failCount++;
    failed.push(f);
  }
}

const total = files.length;
const clean = total - failCount;
console.log();
console.log('----------------------------------------');
console.log(`JSX smoke: ${clean}/${total} clean, ${failCount} failed`);
if (failCount > 0) {
  console.log('Failed files:');
  for (const f of failed) console.log(`  ${f}`);
  process.exit(1);
}
process.exit(0);
