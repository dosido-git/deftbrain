#!/usr/bin/env node
// Royalty statement for a consortium (partner build list E6, owner 2026-11-27).
//
//   node scripts/royalty-statement.js <ledger.csv> <consortium> [--from 2026-01-01] [--to 2026-03-31]
//
// The ledger is the owner's record of payments received, one row per payment:
//   paid_on,organization,consortium,amount,currency,royalty_pct,note
// Rows with another consortium (or none) are left out. The rate comes from each
// row, because a consortium's rate is set per deal. Keep the real ledger out of
// git (docs/marketing/organizations/ is untracked); a made-up one is in
// scripts/samples/royalty-ledger-sample.csv.
//
// Writes output/royalties/<consortium>-<from>-to-<to>.html and .pdf (needs local Chrome).
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { pathToFileURL } = require('url');

const root = path.join(__dirname, '..');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const args = process.argv.slice(2);
const opt = name => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : ''; };
const [ledgerPath, consortium] = args.filter((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'));
if (!ledgerPath || !consortium) { console.error('Usage: node scripts/royalty-statement.js <ledger.csv> <consortium> [--from YYYY-MM-DD] [--to YYYY-MM-DD]'); process.exit(1); }
const from = opt('--from') || '0000-01-01';
const to = opt('--to') || '9999-12-31';
for (const d of [from, to]) if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) { console.error(`Dates are YYYY-MM-DD: ${d}`); process.exit(1); }

// Same minimal CSV reader as partner-members.js: commas, "quoted" fields, "" escapes.
function parseCsv(text) {
  return text.split(/\r?\n/).filter(l => l.trim()).map(line => {
    const cells = []; let cur = ''; let q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (q && ch === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = !q;
      else if (ch === ',' && !q) { cells.push(cur.trim()); cur = ''; } else cur += ch;
    }
    cells.push(cur.trim());
    return cells;
  });
}

const [head, ...body] = parseCsv(fs.readFileSync(ledgerPath, 'utf8'));
for (const c of ['paid_on', 'organization', 'consortium', 'amount', 'currency', 'royalty_pct']) if (!head.includes(c)) { console.error(`Ledger is missing the "${c}" column.`); process.exit(1); }
const get = (r, c) => (r[head.indexOf(c)] || '').trim();
const problems = [];
const rows = body.map((r, i) => ({ line: i + 2, paidOn: get(r, 'paid_on'), org: get(r, 'organization'), consortium: get(r, 'consortium'), amount: Number(get(r, 'amount')), currency: get(r, 'currency').toUpperCase(), pct: Number(get(r, 'royalty_pct')), note: head.includes('note') ? get(r, 'note') : '' }))
  .filter(r => r.consortium === consortium && r.paidOn >= from && r.paidOn <= to);
for (const r of rows) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(r.paidOn)) problems.push(`line ${r.line}: paid_on must be YYYY-MM-DD`);
  if (!Number.isFinite(r.amount)) problems.push(`line ${r.line}: amount must be a number (a refund is negative)`);
  if (!Number.isFinite(r.pct) || r.pct < 0 || r.pct > 100) problems.push(`line ${r.line}: royalty_pct must be 0-100 for a consortium sale`);
  if (!/^[A-Z]{3}$/.test(r.currency)) problems.push(`line ${r.line}: currency must be a 3-letter code`);
}
if (problems.length) { console.error('❌ ledger:\n  ' + problems.join('\n  ')); process.exit(1); }
if (!rows.length) { console.error(`No payments for ${consortium} between ${from} and ${to}.`); process.exit(1); }
rows.sort((a, b) => a.paidOn.localeCompare(b.paidOn));

let name = consortium;
try { const p = require('../src/data/partners.json')[consortium]; if (p) name = p.name; } catch (_) { /* not a partner record: use the id */ }
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const money = (n, cur) => new Intl.NumberFormat('en-US', { style: 'currency', currency: cur }).format(n);
// Cents, rounded once per payment, so the lines add up to the total shown.
const royaltyOf = r => Math.round(r.amount * r.pct) / 100;
const totals = {};
for (const r of rows) { const t = totals[r.currency] = totals[r.currency] || { paid: 0, royalty: 0 }; t.paid += r.amount; t.royalty += royaltyOf(r); }
const period = `${from === '0000-01-01' ? rows[0].paidOn : from} to ${to === '9999-12-31' ? rows[rows.length - 1].paidOn : to}`;
const sample = /sample/.test(path.basename(ledgerPath));

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Royalty statement: ${esc(name)}, ${esc(period)}</title><style>
@page { size: 8.5in 11in; margin: 0.7in; }
body { font-family: Georgia, serif; color: #222; font-size: 11pt; }
h1 { font-size: 20pt; color: #1a2e44; margin: 0 0 4pt; }
.sub { color: #555; margin: 0 0 18pt; }
table { width: 100%; border-collapse: collapse; margin: 12pt 0; font-family: system-ui, sans-serif; font-size: 10pt; }
th, td { text-align: start; padding: 6pt 8pt; border-bottom: 1px solid #ddd; vertical-align: top; }
th { color: #1a2e44; border-bottom: 2px solid #1a2e44; }
td:first-child { white-space: nowrap; }
td.n, th.n { text-align: end; font-variant-numeric: tabular-nums; white-space: nowrap; }
tr.total td { font-weight: 700; border-top: 2px solid #1a2e44; border-bottom: 0; }
.note { font-size: 9.5pt; color: #555; margin-top: 18pt; line-height: 1.45; }
.sample { border: 2px solid #b3261e; color: #b3261e; padding: 6pt 10pt; font-family: system-ui, sans-serif; font-weight: 700; margin-bottom: 14pt; }
</style></head><body>
${sample ? '<div class="sample">SAMPLE: made-up organizations and payments, to show what a statement looks like.</div>' : ''}
<h1>Royalty statement</h1>
<p class="sub"><b>${esc(name)}</b> · ${esc(period)} · from DeftBrain (deftbrain.com)</p>
<table><thead><tr><th>Paid on</th><th>Organization</th><th>Note</th><th class="n">Amount paid</th><th class="n">Rate</th><th class="n">Royalty</th></tr></thead><tbody>
${rows.map(r => `<tr><td>${esc(r.paidOn)}</td><td>${esc(r.org)}</td><td>${esc(r.note)}</td><td class="n">${money(r.amount, r.currency)}</td><td class="n">${r.pct}%</td><td class="n">${money(royaltyOf(r), r.currency)}</td></tr>`).join('\n')}
${Object.entries(totals).map(([cur, t]) => `<tr class="total"><td colspan="3">Total${Object.keys(totals).length > 1 ? ` (${cur})` : ''}</td><td class="n">${money(t.paid, cur)}</td><td></td><td class="n">${money(t.royalty, cur)}</td></tr>`).join('\n')}
</tbody></table>
<p class="note">Counts payments DeftBrain received in this period from organizations that came through ${esc(name)}, at the rate agreed for each. Refunds, if any, appear as their own lines. Questions about this statement: Org@deftbrain.com.</p>
</body></html>`;

const outDir = path.join(root, 'output/royalties');
fs.mkdirSync(outDir, { recursive: true });
const base = path.join(outDir, `${consortium}-${period.replace(' to ', '-to-')}`);
fs.writeFileSync(`${base}.html`, html);
if (fs.existsSync(CHROME)) execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-pdf-header-footer', `--print-to-pdf=${base}.pdf`, pathToFileURL(`${base}.html`).href], { stdio: 'ignore' });
console.log(`${name}: ${rows.length} payment(s), royalty ${Object.entries(totals).map(([c, t]) => money(t.royalty, c)).join(' + ')} → ${path.relative(root, base)}.pdf`);
