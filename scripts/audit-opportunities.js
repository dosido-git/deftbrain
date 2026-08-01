#!/usr/bin/env node
/**
 * audit-opportunities.js — whole-site sweep for REACHABILITY, not correctness.
 *
 * The five gates verify that code is correct and conventional. They cannot see
 * a capability that exists but is never reached. Three bugs in two days came
 * from exactly that blind spot:
 *   - ShareBtn accepted a `url`; 126 of 126 tools never passed one, so every
 *     native share arrived with no link and no preview card.
 *   - PlainTalk's PDF handler scraped raw bytes; it had never once worked.
 *   - The by-tool guide index labelled 440 summaries as guides.
 *
 * None is a lint error, a schema mismatch, or a golden-sample regression. Each
 * needed someone to actually use the thing. This script automates the part of
 * that which can be automated.
 *
 * Checks (static; the viewport/tap-target half needs a browser — see
 * audit/OPPORTUNITIES.md):
 *   R1  optional props on shared components that ~no tool supplies
 *   R2  tools with no cross-reference out (dead ends)
 *   R3  tools whose results cannot be exported (no registered actions)
 *   R4  guides missing the cite/link block
 *   R5  <a> to a bare "#" or empty href (affordance that goes nowhere)
 *   R6  external links missing rel="noopener" with target="_blank"
 *   R7  images with no alt attribute
 *
 * Usage: node scripts/audit-opportunities.js [--json]
 * Exit 0 always — this reports opportunities, it does not gate.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TOOLS = path.join(ROOT, 'src/tools');
const GUIDES = path.join(ROOT, 'public/guides');
const asJson = process.argv.includes('--json');

const toolFiles = fs.readdirSync(TOOLS).filter(f => f.endsWith('.js'));
const readTool = f => fs.readFileSync(path.join(TOOLS, f), 'utf8');
const findings = [];
const add = (id, severity, title, detail, items = []) =>
  findings.push({ id, severity, title, detail, count: items.length || undefined, items: items.slice(0, 8) });

// ── R1: optional capability never supplied ───────────────────────────────────
// NOTE: do not add `resultsRef` here. PrintBtn's signature is ({ label }) — it
// prints the rendered page through window.print() and the print CSS, and never
// accepted a ref. Counting it as an unsupplied capability produced a false
// finding on 2026-08-01. A prop being declared somewhere is not evidence that a
// capability exists; check the consumer's signature.
const CENTRAL_DEFAULTS = new Set(['shareUrl']); // defaulted in ActionBarContext, so a low per-tool count is fine
const OPTIONAL = [
  ['shareUrl', /shareUrl/, 'ShareBtn/ActionBar accept a url; without it a native share has no link or preview card'],
  ['copyLabel', /copyLabel=/, 'ActionBar copy button says a generic "Copy" instead of naming what is copied'],
  ['printLabel', /printLabel=/, 'ActionBar print button is unlabelled for its content'],
];
for (const [name, re, why] of OPTIONAL) {
  const have = toolFiles.filter(f => re.test(readTool(f)));
  if (CENTRAL_DEFAULTS.has(name)) continue; // supplied centrally, not per tool
  if (have.length <= 2) {
    add('R1', have.length === 0 ? 'medium' : 'low', `\`${name}\` supplied by ${have.length}/${toolFiles.length} tools`, why, have);
  }
}

// ── R2: tools that never link anywhere else ──────────────────────────────────
const noXref = toolFiles.filter(f => {
  const c = readTool(f);
  return !/href=["'`]\/[A-Z]/.test(c);
});
if (noXref.length) add('R2', 'medium', `${noXref.length} tools link to no other tool`,
  'A finished result with no next step is a dead end; cross-refs are how a catalog compounds.', noXref);

// ── R3: results that cannot leave the page ───────────────────────────────────
const noActions = toolFiles.filter(f => !/useRegisterActions|registerActions/.test(readTool(f)));
if (noActions.length) add('R3', 'high', `${noActions.length} tools register no copy/share/print`,
  'The result cannot be copied, shared, or printed — and the branding line that carries deftbrain.com travels with copied text.', noActions);

// ── R4/R5/R6/R7: rendered HTML ───────────────────────────────────────────────
const htmlFiles = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.html')) htmlFiles.push(p);
  }
})(GUIDES);
for (const f of fs.readdirSync(path.join(ROOT, 'public')).filter(x => x.endsWith('.html')))
  htmlFiles.push(path.join(ROOT, 'public', f));

const rel = p => path.relative(ROOT, p);
const noCite = [], deadHref = [], unsafeExt = [], noAlt = [];
for (const f of htmlFiles) {
  const raw = fs.readFileSync(f, 'utf8');
  // Scan MARKUP only. Inline <script> bodies contain HTML-shaped strings
  // (the cite block builds '<a href="' + URL_ + '">'), which otherwise read as
  // 552 dead links.
  const h = raw.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  const isGuideArticle = /\/guides\/[a-z-]+\/[^/]+\.html$/.test(f) && !/index\.html$/.test(f);
  if (isGuideArticle && !raw.includes('cite-box')) noCite.push(rel(f));
  if (/<a[^>]+href=["'](#|)["']/.test(h)) deadHref.push(rel(f));
  for (const m of h.matchAll(/<a\b[^>]*target=["']_blank["'][^>]*>/g))
    if (!/rel=["'][^"']*noopener/.test(m[0])) { unsafeExt.push(rel(f)); break; }
  for (const m of h.matchAll(/<img\b[^>]*>/g))
    if (!/\balt=/.test(m[0])) { noAlt.push(rel(f)); break; }
}
if (noCite.length) add('R4', 'medium', `${noCite.length} guides missing the cite/link block`, 'The block that makes linking one click.', noCite);
if (deadHref.length) add('R5', 'low', `${deadHref.length} pages with an <a> that goes nowhere`, 'href="#" or empty — looks clickable, does nothing.', deadHref);
if (unsafeExt.length) add('R6', 'medium', `${unsafeExt.length} pages with target=_blank and no rel=noopener`, 'The opened page gets a handle on window.opener.', unsafeExt);
if (noAlt.length) add('R7', 'low', `${noAlt.length} pages with an <img> lacking alt`, 'Screen readers announce the filename; also a small SEO signal.', noAlt);

// ── report ───────────────────────────────────────────────────────────────────
const RANK = { high: 0, medium: 1, low: 2 };
findings.sort((a, b) => RANK[a.severity] - RANK[b.severity]);
if (asJson) { console.log(JSON.stringify({ findings }, null, 1)); }
else if (!findings.length) console.log('✅ audit-opportunities: nothing found.');
else {
  console.log(`audit-opportunities — ${toolFiles.length} tools, ${htmlFiles.length} rendered pages\n`);
  for (const f of findings) {
    console.log(`[${f.severity.toUpperCase()}] ${f.id}  ${f.title}`);
    console.log(`        ${f.detail}`);
    if (f.items.length) console.log(`        e.g. ${f.items.slice(0, 4).join(', ')}${f.count > 4 ? ` … +${f.count - 4}` : ''}`);
    console.log();
  }
}
