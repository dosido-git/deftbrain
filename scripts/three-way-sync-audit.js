#!/usr/bin/env node
/**
 * three-way-sync-audit.js — the frontend and its route, checked against each other.
 *
 * CLAUDE.md calls three-way sync a non-negotiable: "A tool's frontend tab,
 * backend route, and output renderer must stay in sync — change one, check the
 * other two." audit/REWRITE-INSTALL-KIT.md §2 says what happens when nobody
 * does, and says plainly of it: "Nothing catches this. No gate compares the
 * frontend's payload to the route's destructuring. Do it by hand, every time."
 *
 * The cost of doing it by hand is on record. Concept Coach shipped a prominent
 * "Anything you've tested or learned so far?" textarea whose answer was posted
 * and dropped, because the route never destructured evidenceSoFar. The visitor
 * typed their customer research into a box that changed nothing.
 *
 * WHAT THIS CHECKS
 *
 *   BROKEN     a tool calls an endpoint no route serves. Always fails. This is
 *              the one that reaches a visitor as a dead button.
 *   DEAD PARAM a field is sent and its name appears nowhere in the route file.
 *              Baselined like the i18n conventions: only NEW ones fail, so the
 *              gate can go in today without a 15-tool sweep in front of it.
 *
 * WHAT IT DELIBERATELY DOES NOT CHECK
 *
 * Orphan endpoints — served but seemingly uncalled. The first version reported
 * 84 and nearly all were the probe's own blind spots: endpoints built
 * dynamically (SkillGapMap, ApologyCalibrator), Express route params
 * (/room/:code/join), and callers outside src/tools (/subscribe, /metrics). A
 * gate that cries wolf 84 times gets ignored, so that half is not enforced.
 *
 * HOW THE FIELD EXTRACTOR GOT HERE, because the naive version is wrong in three
 * ways and each one inflated the count:
 *
 *   172 -> ternaries read as keys        cond ? fileBase64 : null
 *    49 -> comment text read as keys     // V2 FIX: pass the original email
 *    36 -> fields read in a helper       handleCompose(req, res)
 *    20 -> the defensible number
 *
 * So the test is deliberately weak: the name appearing ANYWHERE in the route
 * file counts as read. That misses a field destructured and then ignored, and
 * that is the right trade — this gate is here to catch the wiring that was
 * never connected, not to audit whether every value is used well.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const RDIR = path.join(ROOT, 'backend/routes');
const TDIR = path.join(ROOT, 'src/tools');
const STATE = path.join(ROOT, 'src/data/sync-accepted.json');

// Read by withLocaleContext/withLanguage in lib/claude, not by the handler.
const AMBIENT = new Set(['userLanguage', 'userLocale', 'userCurrency', 'userRegion']);

const served = new Map();
for (const f of fs.readdirSync(RDIR).filter(x => x.endsWith('.js') && x !== 'index.js')) {
  const src = fs.readFileSync(path.join(RDIR, f), 'utf8');
  for (const m of src.matchAll(/router\.(?:post|get)\(\s*'([^']+)'/g)) served.set(m[1], f);
}

const calls = [];
for (const f of fs.readdirSync(TDIR).filter(x => x.endsWith('.js'))) {
  const src = fs.readFileSync(path.join(TDIR, f), 'utf8');
  for (const m of src.matchAll(/callToolEndpoint(?:Streaming)?\(\s*'([^']+)'\s*,\s*\{([\s\S]{0,900}?)\}\s*\)/g)) {
    const payload = m[2].replace(/\/\/[^\n]*/g, '').replace(/\?[^:]*:/g, ',');
    const fields = [...new Set([...payload.matchAll(/(?:^|[\s,{])([a-zA-Z_$][\w$]*)\s*:/g)].map(x => x[1]))];
    calls.push({ tool: f.replace('.js', ''), ep: '/' + m[1], fields });
  }
}

const broken = [];
const dead = [];
const fileCache = new Map();
for (const c of calls) {
  const routeFile = served.get(c.ep);
  if (!routeFile) { broken.push(`${c.tool} calls ${c.ep}`); continue; }
  if (!fileCache.has(routeFile)) fileCache.set(routeFile, fs.readFileSync(path.join(RDIR, routeFile), 'utf8'));
  const whole = fileCache.get(routeFile);
  for (const f of c.fields) {
    if (AMBIENT.has(f)) continue;
    if (new RegExp(`\\b${f.replace(/[$]/g, '\\$')}\\b`).test(whole)) continue;
    dead.push(`${c.tool} ${c.ep} ${f}`);
  }
}

const accepted = fs.existsSync(STATE)
  ? new Set(JSON.parse(fs.readFileSync(STATE, 'utf8')).accepted || [])
  : new Set();

if (process.argv.includes('--accept')) {
  fs.writeFileSync(STATE, JSON.stringify({
    note: 'Fields sent to a route that never reads them. Accepted as pre-existing — see scripts/three-way-sync-audit.js. Only NEW findings fail.',
    accepted: [...new Set(dead)].sort(),
  }, null, 2) + '\n');
  console.log(`three-way-sync: baseline written — ${new Set(dead).size} accepted dead param(s).`);
  process.exit(0);
}

const newDead = [...new Set(dead)].filter(d => !accepted.has(d));

if (broken.length) {
  console.error('\n❌ three-way-sync: a tool calls an endpoint no route serves.\n');
  broken.forEach(b => console.error(`     ${b}`));
  console.error('\n   Check the endpoint string against router.post() in backend/routes/.');
  console.error('   The filename does not decide the URL — routes/index.js mounts every');
  console.error('   file at / and each route declares its own path.\n');
  process.exit(1);
}

if (newDead.length) {
  console.error(`\n❌ three-way-sync: ${newDead.length} field(s) sent to a route that never reads them.\n`);
  newDead.forEach(d => console.error(`     ${d}`));
  console.error('\n   Either read it in the handler or stop sending it. A field the route');
  console.error('   ignores is a control the visitor thinks they are using.');
  console.error('   If it is genuinely acceptable: node scripts/three-way-sync-audit.js --accept\n');
  process.exit(1);
}

console.log(`✅ three-way-sync: ${calls.length} call(s) across ${served.size} endpoint(s) — every endpoint exists, ${accepted.size} accepted dead param(s).`);
