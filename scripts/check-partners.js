#!/usr/bin/env node
// Gate: src/data/partners.json is well formed (owner, 2026-11-27, partner perks).
// A typo here would otherwise show up as a broken partner page or a missing
// contact in every tool, so it fails the push instead.
const PARTNERS = require('../src/data/partners.json');
const TOOLS = new Set(require('fs').readFileSync(require('path').join(__dirname, '../src/data/tools.js'), 'utf8')
  .match(/\bid:\s*['"]([A-Za-z0-9]+)['"]/g).map(m => m.replace(/\bid:\s*['"]|['"]/g, '')));

const errors = [];
const bad = (id, msg) => errors.push(`${id}: ${msg}`);
for (const [id, p] of Object.entries(PARTNERS)) {
  if (!/^[a-z0-9-]+$/.test(id)) bad(id, 'id must be lowercase letters, digits and hyphens');
  if (!p.name) bad(id, 'missing name');
  if (p.retired) continue;
  for (const k of ['packageTitle', 'intro']) if (!p[k]) bad(id, `missing ${k}`);
  if (!Array.isArray(p.tools) || !p.tools.length) bad(id, 'tools must be a non-empty list');
  else for (const t of p.tools) if (!TOOLS.has(t)) bad(id, `unknown tool ${t}`);
  if (p.contacts !== undefined) {
    if (!Array.isArray(p.contacts)) bad(id, 'contacts must be a list');
    else p.contacts.forEach((c, i) => {
      if (!c.label) bad(id, `contact ${i + 1} has no label`);
      if (!c.phone && !c.url) bad(id, `contact ${i + 1} needs a phone or a url`);
      if (c.phone && !/^\+?[\d\s().-]{7,}$/.test(c.phone)) bad(id, `contact ${i + 1} phone looks wrong: ${c.phone}`);
      if (c.url && !/^https:\/\//.test(c.url)) bad(id, `contact ${i + 1} url must start with https://`);
    });
  }
}
if (errors.length) { console.error('❌ partners.json:\n  ' + errors.join('\n  ')); process.exit(1); }
console.log(`✅ partners: ${Object.keys(PARTNERS).length} partner record(s) well formed.`);
