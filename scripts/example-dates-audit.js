#!/usr/bin/env node
//
// example-dates-audit.js — built-in examples that name a fixed date (T8 in
// audit/DEFECT-TYPES.md).
// ───────────────────────────────────────────────────────────────────────────
// A "Try an example" that asks about "a Sept 12 hard date instead of Oct 1"
// reads as nonsense from Sept 13 on, and nothing said so: Email Urgency
// Triager carried one for weeks. A fixed date in an example goes stale the
// day it passes; compute it instead (src/utils/formatLocale.js
// dayMonthFromToday) or phrase it relatively ("next Thursday", "in three
// weeks").
//
// Scans the English block of every per-tool locale file (the other twelve
// languages mirror it) for example keys, and every EXAMPLE-ish string literal
// in src/tools/*.js. Existing hits are baselined in src/data/example-dates.json
// so only a NEW dated example fails; accept a deliberate one with --write-state.
//
// Usage: node scripts/example-dates-audit.js [--write-state] [--list]

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const STATE = path.join(ROOT, 'src', 'data', 'example-dates.json');
const MONTH = '(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|June?|July?|Aug(?:ust)?|Sept?(?:ember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)';
const DATED = new RegExp(`\\b${MONTH}\\.?\\s+\\d{1,2}(?:st|nd|rd|th)?\\b|\\b\\d{1,2}(?:st|nd|rd|th)?\\s+(?:of\\s+)?${MONTH}\\b|\\b(?:19|20)\\d{2}\\b|\\b\\d{1,2}/\\d{1,2}/\\d{2,4}\\b`, 'g');

function hits() {
  const out = [];
  const locDir = path.join(ROOT, 'src', 'i18n', 'locales', 'tools');
  for (const f of fs.readdirSync(locDir).filter(x => x.endsWith('.js'))) {
    const src = fs.readFileSync(path.join(locDir, f), 'utf8');
    // English block: from the first "en: {" to the next top-level language key.
    const start = src.search(/\ben\s*:\s*\{/);
    if (start < 0) continue;
    const rest = src.slice(start + 3);
    const stop = rest.search(/\n\s{2}[a-z]{2}\s*:\s*\{/);
    const en = stop < 0 ? rest : rest.slice(0, stop);
    for (const m of en.matchAll(/^\s*([\w$]*(?:example|_ex\d|sample)[\w$]*)\s*:\s*(['"`])((?:\\.|(?!\2).)*)\2/gim)) {
      const found = [...m[3].matchAll(DATED)].map(x => x[0]);
      if (found.length) out.push({ where: `${f}:${m[1]}`, dates: [...new Set(found)] });
    }
  }
  const toolDir = path.join(ROOT, 'src', 'tools');
  for (const f of fs.readdirSync(toolDir).filter(x => x.endsWith('.js'))) {
    const src = fs.readFileSync(path.join(toolDir, f), 'utf8');
    const block = src.match(/const\s+\w*EXAMPLES?\w*\s*=\s*[[{][\s\S]*?\n\];?|const\s+\w*EXAMPLES?\w*\s*=\s*\{[\s\S]*?\n\};?/g) || [];
    for (const b of block) {
      const found = [...b.matchAll(DATED)].map(x => x[0]);
      if (found.length) out.push({ where: `${f}:EXAMPLES`, dates: [...new Set(found)] });
    }
  }
  return out;
}

const all = hits();
const key = h => `${h.where} | ${h.dates.join(', ')}`;
if (process.argv.includes('--list')) { all.forEach(h => console.log(key(h))); process.exit(0); }
if (process.argv.includes('--write-state')) {
  fs.writeFileSync(STATE, JSON.stringify({ _note: 'Accepted dated examples. Regenerate: node scripts/example-dates-audit.js --write-state', accepted: all.map(key).sort() }, null, 1) + '\n');
  console.log(`example-dates-audit: ${all.length} accepted.`);
  process.exit(0);
}
let accepted = new Set();
try { accepted = new Set(JSON.parse(fs.readFileSync(STATE, 'utf8')).accepted); } catch (_) { /* none yet */ }
const fresh = all.filter(h => !accepted.has(key(h)));
if (fresh.length) {
  console.log(`✖ example-dates-audit: ${fresh.length} built-in example(s) name a fixed date, which goes stale once it passes:`);
  fresh.forEach(h => console.log(`   ${key(h)}`));
  console.log('   Compute it (formatLocale dayMonthFromToday) or phrase it relatively. Deliberate? node scripts/example-dates-audit.js --write-state');
  process.exit(1);
}
console.log(`✅ example-dates-audit: no new dated examples (${accepted.size} accepted).`);
