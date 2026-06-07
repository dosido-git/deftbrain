#!/usr/bin/env node
/**
 * Syntax gate — parses every src/ and backend/ JS file with @babel/parser.
 *
 * Catches JSX/ESM syntax errors that `node --check` and ESLint silently miss
 * (e.g. an edit that orphans a function body or drops a brace). Fast: parse-only,
 * no transform. Exits 1 on the first batch of failures, printing file:line:col.
 *
 *   node scripts/check-syntax.js            # checks src/ and backend/
 *   node scripts/check-syntax.js src/tools  # checks an explicit path (CI/local)
 */
const fs = require('fs');
const path = require('path');

let parser;
try {
  parser = require('@babel/parser');
} catch {
  console.error('✖ @babel/parser not found. It ships with react-scripts; if this fails in CI, add it explicitly:\n    npm i -D @babel/parser');
  process.exit(2);
}

const ROOTS = process.argv.slice(2).length ? process.argv.slice(2) : ['src', 'backend'];
const SKIP_DIRS = new Set(['node_modules', 'build', 'dist', '.git', 'coverage']);
const EXTS = new Set(['.js', '.jsx']);
const PLUGINS = ['jsx', 'classProperties', 'optionalChaining', 'nullishCoalescingOperator'];

function walk(dir, out) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch { return; }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) walk(full, out); }
    else if (EXTS.has(path.extname(e.name))) out.push(full);
  }
}

const files = [];
for (const r of ROOTS) {
  const st = fs.existsSync(r) && fs.statSync(r);
  if (st && st.isDirectory()) walk(r, files);
  else if (st) files.push(r);
}

const failures = [];
for (const f of files) {
  try {
    parser.parse(fs.readFileSync(f, 'utf8'), { sourceType: 'module', plugins: PLUGINS });
  } catch (err) {
    const loc = err.loc ? `${err.loc.line}:${err.loc.column}` : '?';
    failures.push(`  ${f}:${loc}  ${err.message.split('\n')[0]}`);
  }
}

if (failures.length) {
  console.error(`\n✖ Syntax check failed — ${failures.length} of ${files.length} file(s):\n`);
  console.error(failures.join('\n') + '\n');
  process.exit(1);
}
console.log(`✓ Syntax OK — ${files.length} files parsed.`);
