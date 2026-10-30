#!/usr/bin/env node
/**
 * Gate 9 — category style (audit/CONVENTIONS.md "Category-colour pages").
 *
 * Why this exists: the category style is opt-in per tool (PROTOTYPE_TOOLS in
 * src/data/toolSchemes.js) and every piece of it is a `sv ?` branch. A tool
 * left out of the list, or a branch that is never written, renders fine in the
 * old style and nothing says so. The 2026-10 rollout also hit two bugs no other
 * gate sees: white text on the category ink (unreadable in midnight, where the
 * ink is light) and the old tinted header band left on under the new header.
 *
 * Fails on:
 *   1. a catalog tool with a page that is not in PROTOTYPE_TOOLS;
 *   2. a tool that wears a scheme other than its first category's, or none;
 *   3. a tool page that never calls schemeStyle();
 *   4. no answer card (ANSWER_CARD / AnswerCard / AnswerHeader) or no form
 *      panel (FORM_PANEL / FormPanel / --sc-field), unless listed below;
 *   5. `bg-[var(--sc-strong)]` and `text-white` in one class string — use
 *      text-[var(--sc-on-strong)];
 *   6. the tinted header band (`tool?.headerColor` background) not switched
 *      off with `!sv &&`;
 *   7. collapsible sections (SvSection, useOnExpandAll) with no <ExpandAll />.
 */
const path = require('path');
const fs = require('fs');
const os = require('os');

const ROOT = path.join(__dirname, '..');

// Pages without a form panel or answer card, and why. Keep the reason honest.
const NO_FORM_PANEL = {
  BillRescue: 'reference design: its tab panel is the form panel',
  ResearchDecoder: 'reference design: tab panel, like Bill Rescue',
  BikeMedic: 'a decision tree of taps, no form to put in a panel',
};
const NO_ANSWER_CARD = {
  FinalWish: 'a guided wizard whose output is the printed document itself',
};

// tools.js / toolSchemes.js are ES modules; strip the module syntax and require.
function load(rel, names) {
  const src = fs
    .readFileSync(path.join(ROOT, rel), 'utf8')
    .replace(/^import[^;]*;/gm, '')
    .replace(/export (const|function)/g, '$1');
  const tmp = path.join(os.tmpdir(), `db-category-style-${process.pid}-${names.length}.cjs`);
  fs.writeFileSync(tmp, `${src}\nmodule.exports = { ${names.join(', ')} };`);
  try {
    return require(tmp);
  } finally {
    fs.unlinkSync(tmp);
  }
}

const { tools } = load('src/data/tools.js', ['tools']);
const { PROTOTYPE_TOOLS, schemeCategory } = load('src/data/toolSchemes.js', ['PROTOTYPE_TOOLS', 'schemeCategory']);

const failures = [];
const fail = (id, msg) => failures.push(`${id}: ${msg}`);

for (const tool of tools) {
  const file = path.join(ROOT, 'src', 'tools', `${tool.id}.js`);
  if (!fs.existsSync(file)) continue;
  const src = fs.readFileSync(file, 'utf8');

  if (!PROTOTYPE_TOOLS.has(tool.id)) fail(tool.id, 'not in PROTOTYPE_TOOLS (src/data/toolSchemes.js)');
  const wears = schemeCategory(tool);
  if (!wears) fail(tool.id, `no colour scheme for "${tool.categories?.[0]}"`);
  else if (wears !== tool.categories[0]) fail(tool.id, `wears ${wears}, but its first category is ${tool.categories[0]}`);

  if (!/schemeStyle\(/.test(src)) fail(tool.id, 'never calls schemeStyle()');
  if (!NO_ANSWER_CARD[tool.id] && !/\b(ANSWER_CARD|AnswerCard|AnswerHeader)\b/.test(src)) fail(tool.id, 'no answer card (ANSWER_CARD / AnswerHeader)');
  if (!NO_FORM_PANEL[tool.id] && !/\b(FORM_PANEL|FormPanel)\b|--sc-field/.test(src)) fail(tool.id, 'no form panel (FORM_PANEL)');

  // Collapsible sections come with one Expand all (CONVENTIONS, rule 8); the
  // control itself shows only past two sections, so placing it is always right.
  if (/<SvSection\b|<SchemeSection\b|useOnExpandAll\(/.test(src) && !/<ExpandAll\b/.test(src)) {
    fail(tool.id, 'collapsible sections without an Expand all (<ExpandAll />)');
  }

  const lines = src.split('\n');
  lines.forEach((line, i) => {
    // The scheme's own text: a quoted class string, or a template literal with
    // its quoted sub-strings (the `sv ? 'a' : 'b'` branches) removed.
    for (const str of line.match(/'[^'\n]*'|"[^"\n]*"|`[^`\n]*`/g) || []) {
      const outer = str.startsWith('`') ? str.replace(/'[^'\n]*'/g, "''") : str;
      if (str.includes('bg-[var(--sc-strong)]') && /\btext-white\b/.test(outer)) {
        fail(tool.id, `line ${i + 1}: text-white on the ink — use text-[var(--sc-on-strong)]`);
      }
    }
    // The band may also be skipped wholesale: `if (sv) return <ToolTopRow …>`
    // or `{!sv && (`, `sv ? (` or `sv ? <ToolTopRow` just above it.
    if (/style=\{\s*\/\^#\[0-9a-f\]\{6\}\$\/i\.test\(tool\?\.headerColor/.test(line)
        && !/if \(!?sv\) return|return sv \?|!sv &&|sv \? \(|sv \? <ToolTopRow/.test(lines.slice(Math.max(0, i - 30), i).join('\n'))) {
      fail(tool.id, `line ${i + 1}: header band colour not switched off — style={!sv && …}`);
    }
  });
}

for (const id of [...Object.keys(NO_FORM_PANEL), ...Object.keys(NO_ANSWER_CARD)]) {
  if (!tools.some(t => t.id === id)) fail(id, 'exemption for a tool that is no longer in the catalog — remove it');
}

if (failures.length) {
  console.error(`✗ category-style-audit: ${failures.length} problem(s)`);
  failures.forEach(f => console.error(`  ${f}`));
  console.error('\nRules: audit/CONVENTIONS.md, "Category-colour pages".');
  process.exit(1);
}
console.log(`✅ category-style-audit: ${tools.length} tools in the category style.`);
