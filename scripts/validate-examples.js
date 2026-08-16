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
  const blocks = [];
  for (const re of [/const EXAMPLES\s*=\s*\[/g, /pickExample\([^,]+,\s*\[/g]) {
    for (const m of src.matchAll(re)) {
      let depth = 1, i = m.index + m[0].length;
      while (depth && i < src.length) {
        if (src[i] === '[') depth++;
        else if (src[i] === ']') depth--;
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
