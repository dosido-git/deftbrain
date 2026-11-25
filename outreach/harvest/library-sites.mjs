// Find public library websites for the IMLS Public Libraries Survey list, which has
// names and cities but no web addresses: try likely domains, keep a site only if its
// page title or address says "library" and names the library or its city.
// A same-named library elsewhere can slip through; it is still a library to scan.
// Usage: UV_THREADPOOL_SIZE=64 node library-sites.mjs PLS_FY24_AE_pud24i.csv libraries.tsv
// Output: name<TAB>url<TAB>library, appended as found; re-running skips names already tried.
import fs from 'node:fs';
const [, , csvPath, outPath] = process.argv;
const lines = fs.readFileSync(csvPath, 'latin1').split(/\r?\n/).filter(Boolean);
const split = l => l.match(/("([^"]|"")*"|[^,]*)(,|$)/g).map(x => x.replace(/,$/, '').replace(/^"|"$/g, ''));
const h = split(lines[0]);
const ix = k => h.indexOf(k);
let rows = lines.slice(1).map(split).map(r => ({ name: r[ix('LIBNAME')], city: r[ix('CITY')], st: r[ix('STABR')] }));
const triedPath = outPath + '.tried';
const tried = new Set(fs.existsSync(triedPath) ? fs.readFileSync(triedPath, 'utf8').split('\n') : []);
rows = rows.filter(r => r.name && !tried.has(r.name + '|' + r.st));
const clean = t => t.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9 ]/g, '').trim();
function cands(r) {
  const nm = clean(r.name), city = clean(r.city).replace(/ /g, '');
  const full = nm.replace(/ /g, '');
  const noThe = full.replace(/^the/, '');
  const ini = nm.split(' ').filter(w => !['of', 'the', 'and'].includes(w)).map(w => w[0]).join('');
  const base = [noThe, `${city}library`, `${city}publiclibrary`, `${city}pl`, `${ini}`, `${noThe.replace(/district|memorial|free|township/g, '')}`];
  const out = [];
  for (const b of [...new Set(base)]) if (b.length >= 4) for (const t of ['org', 'com', 'net', 'info', 'us']) out.push(`${b}.${t}`);
  out.push(`${city}.lib.${r.st.toLowerCase()}.us`);
  return out;
}
async function title(host) {
  const c = new AbortController(); const to = setTimeout(() => c.abort(), 6000);
  try {
    const res = await fetch('https://' + host, { signal: c.signal, redirect: 'follow', headers: { 'user-agent': 'Mozilla/5.0 (compatible; link-check)' } });
    const t = (await res.text()).slice(0, 60000);
    return { ok: res.ok, url: res.url, title: (t.match(/<title[^>]*>([^<]*)/i) || [])[1] || '' };
  } catch { return null; } finally { clearTimeout(to); }
}
function matches(r, t) {
  const T = clean(t.title + ' ' + t.url);
  if (!/librar/.test(T)) return false;
  const words = clean(r.name).split(' ').filter(w => w.length > 3 && !/library|public|district|memorial|county|free|city|town|township/.test(w));
  const city = clean(r.city);
  return words.some(w => T.includes(w)) || T.includes(city);
}
let found = 0, done = 0;
const queue = [...rows];
async function worker() {
  for (let r; (r = queue.shift());) {
    for (const hst of cands(r)) {
      const t = await title(hst);
      if (t && t.ok && matches(r, t)) { found++; fs.appendFileSync(outPath, `${r.name}\t${new URL(t.url).origin}\tlibrary\n`); break; }
    }
    fs.appendFileSync(triedPath, r.name + '|' + r.st + '\n');
    if (++done % 250 === 0) console.log(done, 'tried,', found, 'found');
  }
}
await Promise.all(Array.from({ length: 48 }, worker));
console.log('DONE', done, 'tried,', found, 'found');
