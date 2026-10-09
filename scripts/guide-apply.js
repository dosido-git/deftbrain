#!/usr/bin/env node
//
// guide-apply.js — apply a batch of reviewed guide rewrites (guide review,
// 2026-10-09). One JSON file of patches per batch, so every rewrite goes
// through the same path and the same checks:
//
//   { "health/how-to-x": {
//       "deck": "…direct answer, ≤50 words…",
//       "answerList": ["…"],
//       "ledes": ["…citation-ready intro…", "…"],
//       "steps": [{ "name": "What … ?", "body": "…optional new body…" }, …5],
//       "replace": [["old text", "new text"]],     // edits anywhere in ledes/steps
//       "sources": [{ "label": "…", "url": "https://…" }],
//       "description": "…optional new meta description…"
//   } }
//
// Sets reviewed: true and modified: today, rewrites the spec file as plain
// JSON-in-JS, and refuses a patch that would fail the index-ready standard
// (deck over 50 words, fewer than 3 question headings, a replace that finds
// nothing). Usage: node scripts/guide-apply.js <patches.json>

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const today = new Date().toISOString().slice(0, 10);
const patches = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const Q = /\?\s*$|^(how|what|why|when|where|which|who|can|should|is|are|do|does|will)\b/i;
let ok = 0;
const errors = [];

for (const [key, p] of Object.entries(patches)) {
  const file = path.join(ROOT, 'guides', `${key}.js`);
  if (!fs.existsSync(file)) { errors.push(`${key}: no such guide`); continue; }
  delete require.cache[require.resolve(file)];
  const g = JSON.parse(JSON.stringify(require(file)));
  if (p.deck) g.deck = p.deck;
  if (p.answerList) g.answerList = p.answerList;
  if (p.description) g.description = p.description;
  if (p.ledes) g.ledes = p.ledes;
  if (p.steps) {
    if (p.steps.length !== g.steps.length) { errors.push(`${key}: steps patch has ${p.steps.length}, guide has ${g.steps.length}`); continue; }
    g.steps = g.steps.map((s, i) => ({ ...s, name: p.steps[i].name || s.name, body: p.steps[i].body || s.body }));
  }
  let bad = false;
  for (const [from, to] of p.replace || []) {
    let hit = false;
    g.ledes = g.ledes.map(l => (l.includes(from) ? (hit = true, l.replace(from, to)) : l));
    g.steps = g.steps.map(s => (s.body.includes(from) ? (hit = true, { ...s, body: s.body.replace(from, to) }) : s));
    if (!hit) { errors.push(`${key}: replace found nothing: "${from.slice(0, 60)}"`); bad = true; }
  }
  if (bad) continue;
  if (p.sources) g.sources = p.sources;
  const deckWords = String(g.deck).split(/\s+/).filter(Boolean).length;
  if (deckWords > 50) { errors.push(`${key}: deck is ${deckWords} words (max 50)`); continue; }
  if (g.steps.filter(s => Q.test(s.name)).length < 3) { errors.push(`${key}: fewer than 3 question headings`); continue; }
  if (!Array.isArray(g.answerList) || g.answerList.length < 3) { errors.push(`${key}: answerList needs 3+ items`); continue; }
  g.reviewed = true;
  g.modified = today;
  // Keep the familiar key order: everything as it was, reviewed/sources near the end.
  const order = ['slug', 'category', 'categoryLabel', 'title', 'titleHtml', 'shortTitle', 'navTitle', 'description', 'deck', 'answerList', 'ledes', 'steps', 'callout', 'sources', 'cta', 'published', 'modified', 'reviewed'];
  const out = {};
  for (const k of order) if (g[k] !== undefined) out[k] = g[k];
  for (const k of Object.keys(g)) if (!(k in out)) out[k] = g[k];
  fs.writeFileSync(file, `module.exports = ${JSON.stringify(out, null, 2)};\n`);
  ok++;
}
console.log(`guide-apply: ${ok} guide(s) updated.`);
if (errors.length) { console.error(errors.map(e => '  ✗ ' + e).join('\n')); process.exit(1); }
