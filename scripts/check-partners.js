#!/usr/bin/env node
// Gate: src/data/partners.json is well formed (owner, 2026-11-27, partner perks).
// A typo here would otherwise show up as a broken partner page or a missing
// contact in every tool, so it fails the push instead.
const PARTNERS = require('../src/data/partners.json');
const TOOLS = new Set(require('fs').readFileSync(require('path').join(__dirname, '../src/data/tools.js'), 'utf8')
  .match(/\bid:\s*['"]([A-Za-z0-9]+)['"]/g).map(m => m.replace(/\bid:\s*['"]|['"]/g, '')));

const errors = [];
const bad = (id, msg) => errors.push(`${id}: ${msg}`);
// embedOrigins: the partner's own websites allowed to frame DeftBrain. Each one
// goes into the frame-ancestors header as written, so only a bare https origin.
const checkEmbed = (id, p) => {
  if (p.embedOrigins === undefined) return;
  if (!Array.isArray(p.embedOrigins)) { bad(id, 'embedOrigins must be a list'); return; }
  for (const o of p.embedOrigins) if (!/^https:\/\/[a-z0-9-]+(\.[a-z0-9-]+)+(:\d+)?$/.test(o)) bad(id, `embedOrigins: "${o}" must be just https://host (no path, no wildcard)`);
};
for (const [id, p] of Object.entries(PARTNERS)) {
  if (!/^[a-z0-9-]+$/.test(id)) bad(id, 'id must be lowercase letters, digits and hyphens');
  if (!p.name) bad(id, 'missing name');
  if (p.retired) continue;
  for (const k of ['packageTitle', 'intro']) if (!p[k]) bad(id, `missing ${k}`);
  if (p.accent !== undefined && !/^#[0-9a-fA-F]{6}$/.test(p.accent)) bad(id, 'accent must be a #rrggbb colour');
  if (!Array.isArray(p.tools) || !p.tools.length) bad(id, 'tools must be a non-empty list');
  else for (const t of p.tools) if (!TOOLS.has(t)) bad(id, `unknown tool ${t}`);
  checkEmbed(id, p);
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
// Consortium members: same rules as a partner, after inheriting the consortium's record.
for (const [id, p] of Object.entries(PARTNERS)) {
  if (p.members === undefined) continue;
  if (!p.members || typeof p.members !== 'object' || Array.isArray(p.members)) { bad(id, 'members must be an object keyed by member id'); continue; }
  for (const [mid, m] of Object.entries(p.members)) {
    if (!/^[a-z0-9-]+$/.test(mid)) bad(`${id}/${mid}`, 'member id must be lowercase letters, digits and hyphens');
    if (!m.name) bad(`${id}/${mid}`, 'missing name');
    if (m.tools) for (const t of m.tools) if (!TOOLS.has(t)) bad(`${id}/${mid}`, `unknown tool ${t}`);
    checkEmbed(`${id}/${mid}`, m);
    (m.contacts || []).forEach((c, i) => {
      if (!c.label) bad(`${id}/${mid}`, `contact ${i + 1} has no label`);
      if (!c.phone && !c.url) bad(`${id}/${mid}`, `contact ${i + 1} needs a phone or a url`);
      if (c.url && !/^https:\/\//.test(c.url)) bad(`${id}/${mid}`, `contact ${i + 1} url must start with https://`);
    });
  }
}

// The browser (src/hooks/usePartner.js) and the server (backend/lib/partners.js)
// must resolve every id the same way, or a page and its 200/404 disagree.
{
  const { resolvePartner: server, allPartnerIds } = require('../backend/lib/partners');
  const src = require('fs').readFileSync(require('path').join(__dirname, '../src/hooks/usePartner.js'), 'utf8')
    .replace(/^import PARTNERS.*$/m, '')
    .replace(/^export /gm, '');
  // eslint-disable-next-line no-new-func
  const browser = new Function('PARTNERS', 'sessionStorage', `${src}\nreturn resolvePartner;`)(PARTNERS, { getItem() { return null; }, setItem() {} });
  const pick = p => p && { id: p.id, name: p.name, tools: p.tools, retired: Boolean(p.retired), parentId: p.parentId };
  for (const id of [...allPartnerIds(), 'nope', 'example-cu/nope', 'a/b/c']) {
    const a = JSON.stringify(pick(server(id))); const b = JSON.stringify(pick(browser(id)));
    if (a !== b) bad(id, `server and browser resolve differently: ${a} vs ${b}`);
  }
}

if (errors.length) { console.error('❌ partners.json:\n  ' + errors.join('\n  ')); process.exit(1); }
console.log(`✅ partners: ${Object.keys(PARTNERS).length} partner record(s) well formed.`);
