// Builds flier.html (and tools.csv for layout apps) from the live catalog.
// Fonts and the QR code are taken from the business card so the two match.
// Run: node docs/brand/flier/build-flier.mjs, then print flier.html to PDF
// (see README.md).
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../../..');
// tools.js / categoryMeta.js are ESM without "type": "module" — load copies as .mjs.
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'flier-'));
const load = async (rel) => { const f = path.join(tmp, path.basename(rel).replace(/\.js$/, '.mjs')); fs.copyFileSync(path.join(root, rel), f); return import(pathToFileURL(f)); };
const { tools } = await load('src/data/tools.js');
const meta = await load('src/data/categoryMeta.js');
const cats = (Object.values(meta).find(v => Array.isArray(v) && v[0]?.name && v[0]?.slug) || []).map(c => c.name);

const card = fs.readFileSync(path.join(root, 'docs/brand/business-card/card-press.html'), 'utf8');
const fonts = card.match(/@font-face\{[^}]*\}/g).join('\n');
const qr = card.match(/<svg.*?<\/svg>/s)[0];

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const groups = cats.map(name => ({ name, list: tools.filter(t => (t.categories || [])[0] === name).sort((a, b) => a.title.localeCompare(b.title)) })).filter(g => g.list.length);
const left = tools.filter(t => !cats.includes((t.categories || [])[0]));
if (left.length) groups.push({ name: 'More', list: left });

const sections = groups.map(g => `<section><h2>${esc(g.name)}</h2>${g.list.map(t =>
  `<div class="tool"><div class="name"><span class="ic">${t.icon || ''}</span>${esc(t.title)}</div><div class="desc">${esc(t.tagline)}</div></div>`).join('')}</section>`).join('');

const html = `<!doctype html><html><head><meta charset="utf-8"><title>DeftBrain flier</title><style>
${fonts}
/* US Letter, white stock: nothing bleeds, so no bleed is needed. */
@page { size: 8.5in 11in; margin: 0.45in 0.5in 0.5in; }
:root { --navy:#1a2e44; --ink:#2b2823; --muted:#5a544a; --amber:#c8872e; --paper:#ffffff; }
* { box-sizing: border-box; }
html, body { margin: 0; background: var(--paper); -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { font-family: 'DM Sans', sans-serif; color: var(--ink); }
header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid var(--navy); padding-bottom: 0.14in; margin-bottom: 0.12in; }
.word { font-family: 'Playfair Display', serif; font-weight: 700; font-size: 32pt; color: var(--navy); line-height: 1; }
.word b { color: var(--amber); }
.def { font-size: 9pt; color: var(--muted); margin-top: 4pt; }
.def i { font-style: italic; }
.tag { font-size: 11pt; color: var(--navy); text-align: end; line-height: 1.35; font-weight: 500; }
.intro { font-size: 9pt; color: var(--muted); margin: 0 0 0.1in; }
.cols { column-count: 3; column-gap: 0.24in; column-fill: balance; }
section { break-inside: auto; }
h2 { font-family: 'Playfair Display', serif; font-size: 10.5pt; color: var(--navy); margin: 2pt 0 3pt; padding-top: 4pt; border-top: 1px solid #d9d3c7; break-after: avoid; }
section:first-child h2 { border-top: 0; padding-top: 0; }
.tool { break-inside: avoid; margin: 0 0 3.6pt; }
.name { font-weight: 700; font-size: 8.1pt; color: var(--navy); line-height: 1.2; }
.ic { display: inline-block; width: 13pt; font-size: 8pt; }
.desc { font-size: 7.3pt; line-height: 1.24; color: var(--ink); padding-inline-start: 13pt; }
.site { font-weight: 700; color: var(--amber); margin-top: 3pt; }
.end { break-inside: avoid; display: flex; gap: 8pt; align-items: center; margin-top: 10pt; padding-top: 8pt; border-top: 2px solid var(--navy); font-size: 8pt; color: var(--muted); line-height: 1.35; }
.end .url { font-weight: 700; color: var(--navy); font-size: 11pt; }
.end .qr { width: 0.75in; height: 0.75in; flex: none; }
.end .qr svg { width: 100%; height: 100%; display: block; }
</style></head><body>

  <header>
    <div><div class="word">Deft<b>Brain</b></div><div class="def"><b>deft</b> <i>(adj.)</i> — skillful, nimble, clever.</div></div>
    <div class="tag">Interactive guidance for life’s<br>awkward, confusing, and curious moments.<div class="site">deftbrain.com</div></div>
  </header>
  <p class="intro">Each one helps you understand a situation, get ready for it, and weigh what to do. Free to use, no sign-up.</p>
  <div class="cols" id="flow">${sections}<div class="end"><span class="qr">${qr}</span><div><div class="url">deftbrain.com</div><div>hello@deftbrain.com</div><div>Scan to try one now.</div></div></div></div>

</body></html>`;
fs.writeFileSync(path.join(here, 'flier.html'), html);

const csvq = s => `"${String(s).replace(/"/g, '""')}"`;
fs.writeFileSync(path.join(here, 'tools.csv'), ['Category,Icon,Tool,Description', ...groups.flatMap(g => g.list.map(t => [g.name, t.icon || '', t.title, t.tagline].map(csvq).join(',')))].join('\n') + '\n');
console.log(`${groups.reduce((n, g) => n + g.list.length, 0)} tools in ${groups.length} groups`);
