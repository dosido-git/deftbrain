#!/usr/bin/env node
/**
 * scripts/validate-examples.js
 * ──────────────────────────────────────────────────────────────────────
 * A wrong value in a "Try an example" seed fails SILENTLY. Name a mood the
 * tool does not offer and nothing throws: the chip just never highlights, or a
 * select quietly falls back to its default, and the example demonstrates the
 * tool slightly wrong to every visitor who clicks it. Lint cannot see it —
 * 'composed' is a perfectly good string.
 *
 * The check: any enum-ish literal inside a `const EXAMPLES = [...]` block that
 * appears NOWHERE else in the same file is not a real option. Real option
 * values always appear twice — once in the example, once in the list the UI
 * renders from.
 *
 * Free-text fields are whitelisted below; they legitimately hold prose that
 * exists nowhere else.
 */
const fs = require('fs');
const path = require('path');

const TOOLS = path.join(__dirname, '..', 'src', 'tools');
// Fields that hold free text rather than a choice from a list.
const FREE_TEXT = new Set([
  'who', 'situation', 'context', 'topic', 'preview', 'name', 'notes',
  // Soft markers rather than option lists: `role` is only ever compared
  // against 'primary', and `relationship` is a plain text input.
  'role', 'relationship',
]);

let bad = [];
for (const file of fs.readdirSync(TOOLS).filter(f => f.endsWith('.js'))) {
  const src = fs.readFileSync(path.join(TOOLS, file), 'utf8');
  // Two shapes to cover: a named `const EXAMPLES = [...]`, and an array passed
  // straight into pickExample(). Only checking the named form let
  // TheRunthrough ship audience: 'executive' when the option is 'executives'.
  // A third shape: `const EXAMPLES = { generate: {...}, blend: {...} }`, keyed
  // by whichever mode the visitor picks. Only two tools use it — Bookmark and
  // NameStorm — and neither was ever scanned, which is how NameStorm shipped
  // vibeChips naming two options that do not exist.
  const blocks = [];
  for (const re of [/const EXAMPLES\s*=\s*([[{])/g, /pickExample\([^,]+,\s*(\[)/g]) {
    for (const m of src.matchAll(re)) {
      const open = m[1], close = open === '[' ? ']' : '}';
      let depth = 1, i = m.index + m[0].length;
      while (depth && i < src.length) {
        if (src[i] === open) depth++;
        else if (src[i] === close) depth--;
        i++;
      }
      blocks.push([m.index + m[0].length, i - 1]);
    }
  }
  if (!blocks.length) continue;

  const block = blocks.map(([a, b]) => src.slice(a, b)).join('\n');
  let outside = src, cut = 0;
  for (const [a, b] of blocks.sort((x, y) => x[0] - y[0])) {
    outside = outside.slice(0, a - cut) + outside.slice(b - cut);
    cut += b - a;
  }

  // Boolean-keyed option objects — `concerns: { noise: true, smells: true }` —
  // select by KEY, so a misspelt key fails exactly as silently as a misspelt
  // value. SensoryMinefieldMapper shipped `unpredictable: true` past the
  // value-only version of this check.
  for (const m2 of block.matchAll(/\b(?:concerns|challenges|activities|emotional|symptoms|warningSigns)\s*:\s*\{([^}]*)\}/g)) {
    for (const [, key] of m2[1].matchAll(/(\w+)\s*:\s*(?:true|false)/g)) {
      if (!outside.includes(`'${key}'`) && !outside.includes(`"${key}"`) && !new RegExp(`\\b${key}\\s*:`).test(outside)) {
        bad.push(`   ${file.replace('.js', '').padEnd(24)} { ${key}: true } — not an option`);
      }
    }
  }

  // Arrays of option values — `vibeChips: ['Modern', 'Bold', 'Memorable']` —
  // select by exact match, so a value not on the list highlights nothing.
  //
  // Two things make this delicate. Arrays of OBJECTS are structured data, not
  // option lists, and a naive [^\]]* regex reads their inner properties as
  // elements (WaitingModeLiberator's events: [{ dayOffset: 3, type: '...' }]
  // produced garbage findings). And free-text arrays — seedWords, anecdotes —
  // look identical to option arrays. So: skip anything containing an object,
  // and only report a MIXED array, where some entries resolve to real options
  // and some do not. All-miss means free text; all-hit means it is correct.
  for (const m3 of block.matchAll(/(\w+)\s*:\s*\[/g)) {
    const field = m3[1];
    let depth = 1, i = m3.index + m3[0].length;
    while (depth && i < block.length) {
      if (block[i] === '[') depth++;
      else if (block[i] === ']') depth--;
      i++;
    }
    const inner = block.slice(m3.index + m3[0].length, i - 1);
    if (FREE_TEXT.has(field) || /[{[]/.test(inner)) continue;
    const vals = [...inner.matchAll(/'([^']{2,28})'/g)].map(v => v[1])
      .filter(v => !/[.!?,]|\s{2}/.test(v));          // drop prose; option values are short labels
    if (vals.length < 2) continue;
    const known = v => outside.includes(`'${v}'`) || outside.includes(`"${v}"`);
    const missing = vals.filter(v => !known(v));
    if (!missing.length || missing.length === vals.length) continue;
    for (const v of missing) {
      bad.push(`   ${file.replace('.js', '').padEnd(24)} ${field}: '${v}' — not an option (its siblings are)`);
    }
  }

  for (const [, field, value] of block.matchAll(/(\w+)\s*:\s*'([a-z][a-z0-9_-]{1,22})'/g)) {
    if (field.toLowerCase().endsWith('key') || field === 'id') continue;
    if (FREE_TEXT.has(field) || value === 'true' || value === 'false') continue;
    // A locale key, not an option — these live in the catalogue, not in the
    // tool file, so "appears nowhere else here" is expected and meaningless.
    if (/(^|_)(ex\d*|example\d*)(_|$)/.test(value)) continue;
    if (!outside.includes(`'${value}'`) && !outside.includes(`"${value}"`)) {
      bad.push(`   ${file.replace('.js', '').padEnd(24)} ${field} = '${value}'`);
    }
  }
}

if (bad.length) {
  console.error(`❌ validate-examples: ${bad.length} example value(s) that are not options in their own tool:`);
  console.error(bad.join('\n'));
  console.error('\n   A seed naming an option the tool does not offer fails silently — the');
  console.error('   control never activates and the example teaches the tool wrong.');
  process.exit(1);
}
console.log('✅ validate-examples: every example value is a real option in its tool.');
