#!/usr/bin/env node
// Codemod (accessibility, 2026-11-27): a visible <label> placed right before its
// field without htmlFor leaves the field unnamed for screen readers (WCAG 1.3.1,
// 4.1.2; axe "label" / "select-name"). This links each such pair:
//
//   <label className="…">Text</label>        <label htmlFor="pr-light" className="…">Text</label>
//   <select value={light} …>          →      <select id="pr-light" value={light} …>
//
// Only a label whose NEXT element is the control is linked. Pairs inside a .map
// (an unclosed .map( just above) are skipped and listed, because one id
// would repeat. Run with --check to list without writing.
//   node scripts/link-labels.js [--check] src/tools/*.js
const fs = require('fs');
const path = require('path');

// Has the .map( call that starts this text closed? Counts parentheses (good
// enough for JSX: a ")" inside text would only make us skip a pair, never link one wrongly).
const closed = text => { let depth = 0; for (const ch of text) { if (ch === '(') depth++; else if (ch === ')' && --depth === 0) return true; } return false; };
const args = process.argv.slice(2);
const check = args.includes('--check');
const files = args.filter(a => !a.startsWith('--'));
let linked = 0; const skipped = [];

for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  const prefix = path.basename(file, '.js').replace(/[a-z]/g, '').toLowerCase() || 'f';
  const used = new Set([...src.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));
  let out = '';
  let last = 0;
  // </label> followed only by whitespace, then a control with no id/aria-label yet.
  const re = /<\/label>(\s*)<(select|input|textarea)\b/g;
  let m;
  while ((m = re.exec(src))) {
    const ctrlStart = m.index + m[0].length - m[2].length - 1;
    const ctrlEnd = src.indexOf('>', ctrlStart);
    const ctrlTag = src.slice(ctrlStart, ctrlEnd);
    if (/\bid=|aria-label/.test(ctrlTag) || /type="(checkbox|radio|hidden)"/.test(ctrlTag)) continue;
    const labelStart = src.lastIndexOf('<label', m.index);
    const labelOpenEnd = src.indexOf('>', labelStart);
    const labelOpen = src.slice(labelStart, labelOpenEnd);
    if (labelStart < last || /htmlFor/.test(labelOpen) || src.slice(labelOpenEnd, m.index).includes('<label')) continue;
    // Inside a list: an unclosed .map( shortly before the label (an <option key=…>
    // list that already closed with "))}" or </select> doesn't count).
    const before = src.slice(Math.max(0, labelStart - 1500), labelStart);
    const lastMap = before.lastIndexOf('.map(');
    const line = src.slice(0, ctrlStart).split('\n').length;
    if (lastMap >= 0 && !closed(before.slice(lastMap + 4))) { skipped.push(`${file}:${line}`); continue; }
    const v = /value=\{([A-Za-z_$][\w$]*)/.exec(ctrlTag);
    let id = `${prefix}-${v ? v[1].replace(/[A-Z]/g, c => `-${c.toLowerCase()}`) : `field-${line}`}`;
    for (let n = 2; used.has(id); n++) id = id.replace(/(-\d+)?$/, `-${n}`);
    used.add(id);
    out += src.slice(last, labelStart) + `<label htmlFor="${id}"` + src.slice(labelStart + 6, ctrlStart) + `<${m[2]} id="${id}"`;
    last = ctrlStart + 1 + m[2].length;
    linked++;
  }
  out += src.slice(last);
  if (!check && out !== src) fs.writeFileSync(file, out); // built fully before writing
}
console.log(`${check ? 'would link' : 'linked'} ${linked} label(s) to their fields`);
if (skipped.length) console.log(`skipped (inside a list, needs a per-item id): ${skipped.join(', ')}`);
