// The printable list of every tool: public/all-tools.html and its PDF,
// public/all-tools.pdf (linked from the Toolbox, the footer and the
// Organizations page; was /flier until 2026-11-26).
//
//   node scripts/build-all-tools.mjs          rebuild the HTML and print the PDF (needs local Chrome)
//   node scripts/build-all-tools.mjs --check  fail if the list no longer matches the catalog (pre-push)
//
// Only the tool list is generated. The head, styles, embedded fonts, header and
// QR footer stay as they are in public/all-tools.html: edit those there.
// Tools are grouped by their first category in categoryMeta.js order, A–Z
// inside each group; the line under each name is the catalog tagline. No tool
// count is printed, on purpose (counts go stale). If the PDF grows to a third
// page, tighten .desc / .tool in the HTML's styles.
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath, pathToFileURL } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HTML = path.join(root, 'public/all-tools.html');
const PDF = path.join(root, 'public/all-tools.pdf');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

// tools.js / categoryMeta.js are ESM without "type": "module": load copies as .mjs.
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'all-tools-'));
const load = async rel => { const f = path.join(tmp, path.basename(rel).replace(/\.js$/, '.mjs')); fs.copyFileSync(path.join(root, rel), f); return import(pathToFileURL(f)); };
const { tools } = await load('src/data/tools.js');
const meta = await load('src/data/categoryMeta.js');
const cats = (Object.values(meta).find(v => Array.isArray(v) && v[0]?.name && v[0]?.slug) || []).map(c => c.name);

// Heading colour per category, from each category's scheme (owner, 2026-10-27).
const INK = {
  'Money': '#5f7150', 'Learning': '#7a632c', 'Relationships': '#9a4a2e',
  'Home & Daily Life': '#615548', 'Travel & Events': '#267682', 'Career and Business': '#302a7e',
  'Health & Wellness': '#21734d', 'Conversations': '#5c2f79', 'Ideas & Diversions': '#773162', 'Decisions': '#264e82',
};
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const listed = tools.filter(t => !t.hidden && !t.internal);
const groups = cats.map(name => ({ name, list: listed.filter(t => (t.categories || [])[0] === name).sort((a, b) => a.title.localeCompare(b.title)) })).filter(g => g.list.length);
const left = listed.filter(t => !cats.includes((t.categories || [])[0]));
if (left.length) groups.push({ name: 'More', list: left });
const sections = groups.map(g => `<section><h2${INK[g.name] ? ` style="color:${INK[g.name]};border-bottom:1.5px solid ${INK[g.name]};padding-bottom:1.5pt;margin-bottom:4pt;display:table;border-top:0;padding-top:4pt"` : ''}>${esc(g.name)}</h2>${g.list.map(t =>
  `<div class="tool"><div class="name"><span class="ic">${t.icon || ''}</span>${esc(t.title)}</div><div class="desc">${esc(t.tagline)}</div></div>`).join('')}</section>`).join('');

const START = '<div class="cols" id="flow">';
const END = '<div class="end">';
const page = fs.readFileSync(HTML, 'utf8');
const a = page.indexOf(START), b = page.indexOf(END);
if (a < 0 || b < a) { console.error(`build-all-tools: ${path.relative(root, HTML)} lost its ${START} … ${END} markers`); process.exit(1); }
const next = page.slice(0, a + START.length) + sections + page.slice(b);

if (process.argv.includes('--check')) {
  if (next !== page) {
    console.error('❌ all-tools: the printable tool list no longer matches the catalog (a tool was added, renamed, recategorised or retagged).\n   Fix:  node scripts/build-all-tools.mjs   (rebuilds the HTML and the PDF), then commit public/all-tools.html + public/all-tools.pdf');
    process.exit(1);
  }
  console.log(`✅ all-tools: printable list matches the catalog (${listed.length} tools).`);
  process.exit(0);
}

fs.writeFileSync(HTML, next);
if (!fs.existsSync(CHROME)) { console.error(`build-all-tools: HTML written; Chrome not found at ${CHROME}, so the PDF was NOT rebuilt.`); process.exit(1); }
execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-pdf-header-footer', `--print-to-pdf=${PDF}`, pathToFileURL(HTML).href], { stdio: 'ignore' });
let pages = '?';
try { pages = execFileSync('pdfinfo', [PDF]).toString().match(/Pages:\s+(\d+)/)[1]; } catch (_) { /* pdfinfo missing: skip the page check */ }
console.log(`all-tools: ${listed.length} tools in ${groups.length} groups → ${path.relative(root, HTML)}, ${path.relative(root, PDF)} (${pages} pages)`);
if (pages !== '?' && pages !== '2') console.error(`⚠ all-tools.pdf is ${pages} pages, not 2: tighten .desc / .tool in public/all-tools.html.`);
