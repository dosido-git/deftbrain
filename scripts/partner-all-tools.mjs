// A partner's own copy of the printable all-tools list (partner perk, owner
// 2026-11-27): same two pages as public/all-tools.html, plus "Provided by
// <partner>" under the header, and the QR code and address pointing at the
// partner's page with a tracked print link (?ref=<partner>-print, which the
// partner's usage report shows under "Where visits came from").
//
//   node scripts/partner-all-tools.mjs example-cu          (or <consortium>/<member>)
//
// Writes output/partners/<id>-all-tools.html and .pdf (needs local Chrome).
// Nothing is committed: send the PDF to the partner.
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { execFileSync } from 'child_process';
import { fileURLToPath, pathToFileURL } from 'url';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { resolvePartner } = require(path.join(root, 'backend/lib/partners.js'));
const qrcode = require('qrcode-generator');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const id = (process.argv[2] || '').trim();
const partner = resolvePartner(id);
if (!partner || partner.retired) { console.error('Usage: node scripts/partner-all-tools.mjs <partner id>'); process.exit(1); }

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const page = `deftbrain.com/for/${id}`;
const link = `https://${page}?ref=${id}-print`;

// QR code as one SVG path, same drawing as the public list's.
const qr = qrcode(0, 'M');
qr.addData(link);
qr.make();
const n = qr.getModuleCount();
let d = '';
for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`;
const svg = `<svg viewBox="0 0 ${n} ${n}" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges"><path d="${d}" fill="currentColor"/></svg>`;

let html = fs.readFileSync(path.join(root, 'public/all-tools.html'), 'utf8');
const swap = (from, to, what) => { if (!from.test(html)) throw new Error(`all-tools.html changed: can't find the ${what}`); html = html.replace(from, to); };
swap(/\s*<a class="dl"[^>]*>[^<]*<\/a>/, '', 'download link');
swap(/<p class="intro" style="text-align:right">Free to use, no sign-up\.<\/p>/,
  `<p class="intro" style="text-align:right"><b>Provided by ${esc(partner.name)}.</b> Free to use, no sign-up.</p>`, 'intro line');
swap(/<span class="qr"><svg[\s\S]*?<\/svg><\/span>/, `<span class="qr">${svg}</span>`, 'QR code');
// Partner addresses are longer than deftbrain.com: smaller, and allowed to wrap at a slash.
swap(/<div class="url">deftbrain\.com<\/div>/, `<div class="url" style="font-size:${page.length > 24 ? '9pt' : 'inherit'}">${esc(page).replace(/\//g, '/<wbr>')}</div>`, 'address');

const outDir = path.join(root, 'output/partners');
fs.mkdirSync(outDir, { recursive: true });
const base = id.replace(/\//g, '--');
const HTML = path.join(outDir, `${base}-all-tools.html`);
const PDF = path.join(outDir, `${base}-all-tools.pdf`);
fs.writeFileSync(HTML, html);
execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-pdf-header-footer', `--print-to-pdf=${PDF}`, pathToFileURL(HTML).href], { stdio: 'ignore' });
console.log(`${partner.name}: ${path.relative(root, PDF)} (QR → ${link})`);
