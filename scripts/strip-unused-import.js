#!/usr/bin/env node
/**
 * strip-unused-import.js
 *
 * Removes an unused binding (default: cleanJsonResponse) from single-line
 *   const { ... } = require('...')
 * destructures. Comma-aware: trims the name out of a multi-name destructure,
 * or drops the whole line if it was the only binding.
 *
 * SAFETY: if the name appears ANYWHERE else in a file (i.e. it's actually
 * used), that file is skipped untouched. We never remove a live import.
 *
 * Dry-run by default. Pass --write to apply.
 *
 * Usage:
 *   node scripts/strip-unused-import.js                 # dry-run, backend/routes, cleanJsonResponse
 *   node scripts/strip-unused-import.js --write          # apply
 *   node scripts/strip-unused-import.js --token=foo      # different name
 *   node scripts/strip-unused-import.js path/a.js path/b.js --write   # specific files
 */
const fs = require('fs');
const path = require('path');

const rawArgs = process.argv.slice(2);
const WRITE = rawArgs.includes('--write');
const tokenArg = rawArgs.find(a => a.startsWith('--token='));
const TOKEN = tokenArg ? tokenArg.split('=')[1] : 'cleanJsonResponse';
const fileArgs = rawArgs.filter(a => !a.startsWith('--'));

const DESTRUCTURE_RE =
  /^(\s*)(const|let|var)\s*\{([^{}]*)\}\s*=\s*(require\([^)]*\))\s*;?\s*$/;

function keyName(part) {
  return part.split(':')[0].trim(); // handles `name` and `name: alias`
}

// Returns null if the line isn't a require-destructure containing TOKEN,
// { drop: true } if removing TOKEN empties it, or { line } with TOKEN removed.
function transform(line) {
  const m = line.match(DESTRUCTURE_RE);
  if (!m) return null;
  const [, indent, kw, inside, req] = m;
  const parts = inside.split(',').map(s => s.trim()).filter(Boolean);
  if (!parts.some(p => keyName(p) === TOKEN)) return null;
  const remaining = parts.filter(p => keyName(p) !== TOKEN);
  if (remaining.length === 0) return { drop: true };
  return { line: `${indent}${kw} { ${remaining.join(', ')} } = ${req};` };
}

function gatherFiles() {
  if (fileArgs.length) return fileArgs;
  const dir = path.join(process.cwd(), 'backend', 'routes');
  if (!fs.existsSync(dir)) {
    console.error('No backend/routes/ found and no files given. Pass file paths explicitly.');
    process.exit(1);
  }
  return fs.readdirSync(dir).filter(f => f.endsWith('.js')).map(f => path.join(dir, f));
}

const wordRe = new RegExp(`\\b${TOKEN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);

let changed = 0, dropped = 0, trimmed = 0;
const skippedUsed = [];

for (const file of gatherFiles()) {
  let src;
  try { src = fs.readFileSync(file, 'utf8'); } catch { continue; }
  if (!wordRe.test(src)) continue;

  const lines = src.split('\n');
  const candidate = lines.map((l, i) => (transform(l) ? i : -1)).filter(i => i >= 0);
  if (candidate.length === 0) continue; // token present but not in an import we recognize

  // Does TOKEN appear on any line that ISN'T one of our import candidates?
  const usedElsewhere = lines.some((l, i) => !candidate.includes(i) && wordRe.test(l));
  if (usedElsewhere) { skippedUsed.push(file); continue; }

  const out = [];
  for (let i = 0; i < lines.length; i++) {
    if (!candidate.includes(i)) { out.push(lines[i]); continue; }
    const res = transform(lines[i]);
    if (res.drop) { dropped++; }       // omit the line
    else { out.push(res.line); trimmed++; }
  }
  changed++;
  const rel = path.relative(process.cwd(), file);
  if (WRITE) { fs.writeFileSync(file, out.join('\n')); console.log(`fixed:     ${rel}`); }
  else { console.log(`would fix: ${rel}`); }
}

console.log(`\n${changed} file(s) ${WRITE ? 'changed' : 'to change'} — ` +
  `${dropped} import line(s) removed, ${trimmed} destructure(s) trimmed.`);
if (skippedUsed.length) {
  console.log(`\n⚠ ${skippedUsed.length} file(s) skipped because "${TOKEN}" is used elsewhere ` +
    `(not a dead import there):`);
  skippedUsed.forEach(f => console.log(`   ${path.relative(process.cwd(), f)}`));
}
if (!WRITE) console.log('\nDry run — re-run with --write to apply.');
