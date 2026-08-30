#!/usr/bin/env node
/**
 * i18n-literal-audit.js — English prose hiding in module-level constants.
 *
 * Gate 5 reads JSX. It sees `<p>Hello</p>` and it sees `t('key')`. What it
 * cannot see is this:
 *
 *   const EXAMPLES = [
 *     { mode: 'single', description: "My dad died three weeks ago..." },
 *   ];
 *
 * That string is a module-level constant, never a JSX child, and it reaches the
 * screen through `setState(ex.description)`. Every locale check in this repo
 * reports the tool as fully localized while a Spanish visitor who clicks "Try
 * an example" is handed English.
 *
 * Found four times in one day (2026-08-29), all by human-equivalent review
 * rather than by tooling: DreamPatternSpotter's two example dreams,
 * GriefGuide's three, AnalogyEngine's six "Try one" chips, and
 * FocusSoundArchitect's layer names — which leak the moment anyone adds a
 * layer or opens a shared link, because the component copies `label` over
 * `labelKey`. A catalog sweep then found the same shape in twelve more tools.
 *
 * WHAT IT FLAGS: a string literal, in a property whose name is one a user
 * reads (label, description, placeholder, ...), inside a module-level const,
 * in a tool that Gate 5 considers localized — where the string is English
 * prose rather than a key, a code, or a token.
 *
 * WHAT IT DOES NOT FLAG: the INVARIANTS list below. Brand names, airports and
 * film titles are supposed to stay English, and listing each one by name makes
 * that a decision somebody made rather than a hole somebody fell into.
 *
 * Usage:
 *   node scripts/i18n-literal-audit.js            # report, exit 0
 *   node scripts/i18n-literal-audit.js --strict   # exit 1 on any finding
 *   node scripts/i18n-literal-audit.js --json
 */

const fs = require('fs');
const path = require('path');

let parser;
try { parser = require('@babel/parser'); }
catch { console.error('i18n-literal-audit: @babel/parser not found (npm i -D @babel/parser).'); process.exit(2); }

const ROOT = path.join(__dirname, '..');
const TOOLS = path.join(ROOT, 'src', 'tools');
const argv = process.argv.slice(2);
const STRICT = argv.includes('--strict');
const JSON_OUT = argv.includes('--json');

// Property names whose value a visitor reads. Deliberately not `id`, `value`,
// `key`, `type`, `icon`, `color` — those are machine-side and must stay English.
const USER_FACING = new Set([
  'label', 'description', 'desc', 'text', 'title', 'placeholder', 'hint',
  'body', 'example', 'freeform', 'subtitle', 'caption', 'question', 'answer',
  'tip', 'note', 'summary', 'prompt', 'heading', 'message',
]);

// Genuinely invariant strings: brands, real places, published titles. A name
// belongs here only if translating it would be WRONG, not merely unnecessary.
const INVARIANTS = new Set([
  'YouTube Premium', 'YouTube Music', 'Apple Music', 'Amazon Prime',
  'Chicago O’Hare', 'Chicago O\'Hare', 'The Dark Knight Rises',
  'General Knowledge',
]);

// English prose: starts like a word, contains a space, and is long enough that
// it cannot be a unit, a code, or an enum value.
const PROSE = /^["'‘“]?[A-Za-z][A-Za-z0-9'’.,!?:;()\-/&+% ]{11,}$/;
const LOOKS_LIKE_KEY = /^[a-z0-9]+(_[a-z0-9]+)+$/;
const HAS_NON_LATIN = /[^\x00-\x7F]/;
// PlainTalk keeps Tailwind classes in a property called `label`. A colour
// utility is not prose, however much it looks like words to a regex.
const LOOKS_LIKE_CSS = /(^|\s)(dark:|hover:|focus:|text-|bg-|border-|ring-|from-|to-|via-)/;

function localizedTools() {
  // Reuse Gate 5's allowlist rather than keeping a second copy that drifts.
  const src = fs.readFileSync(path.join(ROOT, 'scripts', 'localization-audit.js'), 'utf8');
  const block = src.slice(src.indexOf('const LOCALIZED_TOOLS'), src.indexOf(']', src.indexOf('const LOCALIZED_TOOLS')));
  return new Set([...block.matchAll(/'src\/tools\/([A-Za-z0-9]+)\.js'/g)].map(m => m[1] + '.js'));
}

function scan(file) {
  let ast;
  try {
    ast = parser.parse(fs.readFileSync(path.join(TOOLS, file), 'utf8'), {
      sourceType: 'module',
      plugins: ['jsx', 'optionalChaining', 'nullishCoalescingOperator', 'objectRestSpread'],
    });
  } catch { return []; }

  const out = [];
  // Module scope only. A literal inside a component is usually a className, a
  // fetch path, or a comparison — the leak shape is a top-level table.
  for (const node of ast.program.body) {
    if (node.type !== 'VariableDeclaration') continue;
    walk(node, (n) => {
      if (n.type !== 'ObjectProperty' || !n.key || !n.value) return;
      const name = n.key.name || n.key.value;
      if (!USER_FACING.has(name) || n.value.type !== 'StringLiteral') return;
      const v = n.value.value;
      if (!v || INVARIANTS.has(v) || LOOKS_LIKE_KEY.test(v) || HAS_NON_LATIN.test(v) || LOOKS_LIKE_CSS.test(v)) return;
      if (!PROSE.test(v) || !/\s/.test(v.trim())) return;
      out.push({ file, line: n.loc && n.loc.start.line, prop: name, value: v });
    });
  }
  return out;
}

function walk(node, cb) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) return node.forEach(n => walk(n, cb));
  cb(node);
  for (const k of Object.keys(node)) {
    if (k === 'loc' || k === 'start' || k === 'end' || k === 'leadingComments' || k === 'trailingComments') continue;
    walk(node[k], cb);
  }
}

function main() {
  const localized = localizedTools();
  const files = fs.readdirSync(TOOLS).filter(f => f.endsWith('.js'));
  const findings = [];
  for (const f of files) {
    const hits = scan(f);
    if (!hits.length) continue;
    // A tool Gate 5 has not accepted yet is mid-rollout; its English is
    // expected. Report it, but do not let it fail the build.
    const inScope = localized.has(f);
    hits.forEach(h => findings.push({ ...h, inScope }));
  }

  if (JSON_OUT) { console.log(JSON.stringify(findings, null, 2)); return 0; }

  const blocking = findings.filter(f => f.inScope);
  const byFile = new Map();
  for (const f of findings) {
    if (!byFile.has(f.file)) byFile.set(f.file, []);
    byFile.get(f.file).push(f);
  }
  const sorted = [...byFile.entries()].sort((a, b) => b[1].length - a[1].length);

  console.log('i18n-literal-audit — English prose in module-level constants\n');
  for (const [file, hits] of sorted) {
    const mark = hits[0].inScope ? '⚠️ ' : '  ';
    console.log(`${mark} ${String(hits.length).padStart(3)}  src/tools/${file}${hits[0].inScope ? '' : '   (not yet in Gate 5 — reported, not blocking)'}`);
    for (const h of hits.slice(0, 4)) console.log(`         :${h.line} ${h.prop} = ${JSON.stringify(h.value.slice(0, 62))}`);
    if (hits.length > 4) console.log(`         … and ${hits.length - 4} more`);
  }
  console.log(`\n${blocking.length ? '⚠️ ' : '✅'} ${blocking.length} literal(s) in ${new Set(blocking.map(f => f.file)).size} localized tool(s)` +
    (findings.length - blocking.length ? `; ${findings.length - blocking.length} more in tools not yet localized.` : '.'));
  if (blocking.length) {
    console.log('\n   Each of these reaches a non-English visitor as English. Move it to the');
    console.log('   tool\'s locale file and resolve it through t() at the point of use — or, if');
    console.log('   it is genuinely invariant, add it to INVARIANTS in this script with a reason.');
  }
  return STRICT && blocking.length ? 1 : 0;
}

process.exit(main());
