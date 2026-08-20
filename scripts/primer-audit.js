#!/usr/bin/env node
/**
 * Gate 6 — preamble ("In a Nutshell") completeness.
 *
 * Why this exists: `tool?.primer &&` makes the whole block optional, and the
 * renderer filters empty fields. That is deliberate — but it also means a tool
 * with no primer, or a primer missing half its fields, renders perfectly and
 * says nothing. Same blind spot as every other bug in audit/OPPORTUNITIES.md:
 * the capability exists, nothing reaches it, and no gate notices.
 *
 * `edge` is intentionally optional. It is a claim about how this tool differs
 * from the other 124 and from what someone would otherwise do, and a padded
 * one is worse than none. Missing `edge` is reported as a TODO, never a failure.
 *
 * Fails on: a tool with no primer, a primer missing when/give/get, an empty or
 * whitespace string, prose long enough to defeat the point, or a `give` that
 * never says what to supply.
 */
const path = require('path');
const fs = require('fs');
const os = require('os');

const MAX = { when: 120, give: 220, get: 260, edge: 300 };
const REQUIRED = ['when', 'give', 'get'];

function loadTools() {
  // tools.js is an ES module; strip the module syntax and require the result.
  const src = fs
    .readFileSync(path.join(__dirname, '..', 'src', 'data', 'tools.js'), 'utf8')
    .replace(/^import[^;]*;/gm, '')
    .replace(/export const/g, 'const');
  const tmp = path.join(os.tmpdir(), `db-primer-audit-${process.pid}.cjs`);
  fs.writeFileSync(tmp, `${src}\nmodule.exports = { tools };`);
  try {
    return require(tmp).tools;
  } finally {
    fs.unlinkSync(tmp);
  }
}

const tools = loadTools();
const errors = [];
const todos = [];

for (const t of tools) {
  const id = t.id || '(no id)';
  if (!t.primer) {
    errors.push(`${id}: no primer — the In a Nutshell card will not render`);
    continue;
  }
  for (const k of REQUIRED) {
    const v = t.primer[k];
    if (typeof v !== 'string' || !v.trim()) {
      errors.push(`${id}: primer.${k} is missing or empty`);
    }
  }
  for (const [k, v] of Object.entries(t.primer)) {
    if (!(k in MAX)) {
      errors.push(`${id}: primer.${k} is not a known field (when/give/get/edge)`);
    } else if (typeof v === 'string' && v.length > MAX[k]) {
      errors.push(`${id}: primer.${k} is ${v.length} chars, over the ${MAX[k]} limit — it is a preamble, not the guide`);
    }
  }
  // A keyword test for "does `give` name an input" was tried and removed: it
  // flagged 16 perfectly good lines ("Who it's for, what kind of loss, and
  // roughly when it happened") for opening with a noun rather than a verb.
  // Whether a sentence names an input is not a regex question. These two are.
  if (typeof t.primer.give === 'string' && t.primer.give.trim().length < 20) {
    errors.push(`${id}: primer.give is too short to state the input burden`);
  }
  const seen = new Map();
  for (const [k, v] of Object.entries(t.primer)) {
    const norm = String(v).trim().toLowerCase();
    if (seen.has(norm)) {
      errors.push(`${id}: primer.${k} repeats primer.${seen.get(norm)} verbatim`);
    }
    seen.set(norm, k);
    if (t.tagline && norm === String(t.tagline).trim().toLowerCase()) {
      errors.push(`${id}: primer.${k} is just the tagline — it adds nothing`);
    }
  }
  if (!t.primer.edge || !String(t.primer.edge).trim()) todos.push(id);
}

// ── Structural fields ────────────────────────────────────────────────────────
// The preamble is not the only thing a catalog entry has to carry. Four fields
// are load-bearing and silent when absent: `icon` renders throughout the tool
// and in its copy header, `categories` places it in the taxonomy and the hub
// pages, `tags` feed Tool Finder's matching, and `headerColor` is the
// Try-an-example button's background — missing, it falls back to #888888 and
// the tool gets a grey button nobody notices is wrong.
//
// Reading the required module rather than the file text, deliberately: an
// earlier hand-rolled check regexed `^  headerColor:` and reported VelvetHammer
// as missing one, when it was present and indented four spaces. A field check
// that can be fooled by whitespace is worse than none, because it is believed.
const REQUIRED_FIELDS = ['title', 'tagline', 'description', 'icon', 'categories', 'tags', 'headerColor'];
for (const t of tools) {
  const id = t.id || '(no id)';
  for (const f of REQUIRED_FIELDS) {
    const v = t[f];
    const empty = v === undefined || v === null || v === ''
      || (Array.isArray(v) && v.length === 0)
      || (typeof v === 'string' && !v.trim());
    if (empty) errors.push(`${id}: missing \`${f}\` — see the note above primer-audit's REQUIRED list`);
  }
  if (t.headerColor && !/^#[0-9a-fA-F]{6}$/.test(String(t.headerColor).trim())) {
    errors.push(`${id}: headerColor "${t.headerColor}" is not a 6-digit hex — the button concatenates '80' for alpha`);
  }
}

if (errors.length) {
  console.error(`\n❌ primer-audit: ${errors.length} problem(s)\n`);
  errors.forEach((e) => console.error(`   ${e}`));
  console.error('');
  process.exitCode = 1;
} else {
  console.log(`✅ primer-audit: ${tools.length} tool(s) have a complete preamble and every structural field.`);
}

if (todos.length) {
  console.log(`\n   TODO — ${todos.length} tool(s) have no \`edge\` line yet (optional, never blocking):`);
  console.log(`   ${todos.join(', ')}\n`);
}
