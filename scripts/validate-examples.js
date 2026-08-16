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
  const m = /const EXAMPLES\s*=\s*\[/.exec(src);
  if (!m) continue;

  let depth = 1, i = m.index + m[0].length;
  while (depth && i < src.length) {
    if (src[i] === '[') depth++;
    else if (src[i] === ']') depth--;
    i++;
  }
  const block = src.slice(m.index + m[0].length, i - 1);
  const outside = src.slice(0, m.index) + src.slice(i);

  for (const [, field, value] of block.matchAll(/(\w+)\s*:\s*'([a-z][a-z0-9_-]{1,22})'/g)) {
    if (field.toLowerCase().endsWith('key') || field === 'id') continue;
    if (FREE_TEXT.has(field) || value === 'true' || value === 'false') continue;
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
