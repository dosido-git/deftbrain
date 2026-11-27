#!/usr/bin/env node
// Add a consortium's members from a list (owner, 2026-11-27):
//   node scripts/partner-members.js example-union members.csv
// CSV header: id,name,contact_label,phone,url,hours   (id optional: made from
// the name; contact columns optional: the member then uses the consortium's).
// Each row becomes src/data/partners.json → <consortium>.members.<id>, with its
// own page at /for/<consortium>/<id>. Existing members are updated, never
// removed. Run `node scripts/check-partners.js` after, then commit and push.
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'src', 'data', 'partners.json');
const [consortium, csvPath] = process.argv.slice(2);
const partners = JSON.parse(fs.readFileSync(FILE, 'utf8'));
if (!consortium || !csvPath || !partners[consortium]) {
  console.error(`Usage: node scripts/partner-members.js <consortium id> <members.csv>   (consortia: ${Object.keys(partners).join(', ')})`);
  process.exit(1);
}

// Minimal CSV: commas, double-quoted fields with "" escapes, one record per line.
function parseCsv(text) {
  const rows = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const cells = []; let cur = ''; let q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (q && ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') q = !q;
      else if (ch === ',' && !q) { cells.push(cur.trim()); cur = ''; }
      else cur += ch;
    }
    cells.push(cur.trim());
    rows.push(cells);
  }
  return rows;
}

const [head, ...body] = parseCsv(fs.readFileSync(csvPath, 'utf8'));
const col = name => head.indexOf(name);
if (col('name') < 0) { console.error('The CSV needs at least a "name" column.'); process.exit(1); }
const slug = s => s.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-');
const get = (r, name) => (col(name) >= 0 ? (r[col(name)] || '').trim() : '');

const members = partners[consortium].members || {};
let added = 0; let updated = 0;
for (const r of body) {
  const name = get(r, 'name');
  if (!name) continue;
  const id = slug(get(r, 'id') || name);
  const entry = { ...(members[id] || {}), name };
  const label = get(r, 'contact_label'); const phone = get(r, 'phone'); const url = get(r, 'url'); const hours = get(r, 'hours');
  if (label && (phone || url)) entry.contacts = [{ label, ...(phone && { phone }), ...(url && { url }), ...(hours && { hours }) }];
  if (members[id]) updated++; else added++;
  members[id] = entry;
}
partners[consortium].members = members;
const out = `${JSON.stringify(partners, null, 2)}\n`; // built fully before the file is opened
fs.writeFileSync(FILE, out);
console.log(`${consortium}: ${added} member(s) added, ${updated} updated, ${Object.keys(members).length} in all.`);
