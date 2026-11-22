// Deep email hunt for one site: sitemaps, likely pages, security.txt, JSON-LD,
// obfuscated forms, linked PDFs, and the latest Wayback copy of contact pages.
// Usage: node deep.mjs <urls.txt> <out.json>
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const [, , inPath, outPath] = process.argv;
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const KEY = /contact|about|staff|team|leadership|board|directory|people|privacy|accessib|career|employ|media|press|news|connect|reach|help|support|location|branch|feedback|complaint|legal|terms|foia|records/i;
const JUNK = /\.(png|jpe?g|gif|svg|webp|css|js)$|example\.|sentry|wixpress|godaddy|domain\.com|email\.com|yourname|user@|@target|\.png|@2x|wordpress\.org|schema\.org/i;

async function get(url, binary = false) {
  try {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 15000);
    const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow', signal: ctl.signal });
    clearTimeout(t);
    if (!res.ok) return null;
    return binary ? Buffer.from(await res.arrayBuffer()) : await res.text();
  } catch { return null; }
}

function decodeCf(hex) {
  const k = parseInt(hex.slice(0, 2), 16); let s = '';
  for (let i = 2; i < hex.length; i += 2) s += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16) ^ k);
  return s;
}

function emailsIn(text) {
  const out = new Set();
  const t = text
    .replace(/&#0*64;|&#x0*40;|%40/gi, '@').replace(/&#0*46;|&#x0*2e;/gi, '.')
    .replace(/\s*[\[\(\{]\s*at\s*[\]\)\}]\s*/gi, '@').replace(/\s*[\[\(\{]\s*dot\s*[\]\)\}]\s*/gi, '.')
    .replace(/(\w)\s+at\s+(\w[\w-]*)\s+dot\s+(\w+)/gi, '$1@$2.$3');
  for (const m of t.matchAll(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g)) out.add(m[0].replace(/^[.]+|[.]+$/g, '').toLowerCase());
  for (const m of text.matchAll(/data-cfemail="([0-9a-f]+)"/gi)) out.add(decodeCf(m[1]).toLowerCase());
  for (const m of text.matchAll(/\/cdn-cgi\/l\/email-protection#([0-9a-f]+)/gi)) out.add(decodeCf(m[1]).toLowerCase());
  return [...out].filter(e => !JUNK.test(e) && e.length < 70);
}

function links(html, base) {
  const out = [];
  for (const m of html.matchAll(/href=["']([^"'#]+)["']/gi)) {
    try { out.push(new URL(m[1], base).href); } catch {}
  }
  return out;
}

async function site(pageUrl) {
  const origin = new URL(pageUrl).origin;
  const host = new URL(pageUrl).hostname.replace(/^www\./, '');
  const found = {};
  const add = (list, src) => list.forEach(e => { (found[e] ||= new Set()).add(src); });
  const seen = new Set();
  const queue = [pageUrl, origin + '/'];

  // security.txt and robots → sitemaps
  for (const p of ['/.well-known/security.txt', '/security.txt']) { const t = await get(origin + p); if (t && t.length < 20000) add(emailsIn(t), p); }
  const robots = await get(origin + '/robots.txt') || '';
  const sitemaps = [...robots.matchAll(/sitemap:\s*(\S+)/gi)].map(m => m[1]);
  if (!sitemaps.length) sitemaps.push(origin + '/sitemap.xml', origin + '/sitemap_index.xml');
  const smUrls = [];
  for (const sm of sitemaps.slice(0, 4)) {
    const x = await get(sm); if (!x) continue;
    const locs = [...x.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map(m => m[1]);
    for (const l of locs) {
      if (/\.xml(\.gz)?$/i.test(l) && smUrls.length < 4000) {
        if (/page|post|staff|team|people|location/i.test(l)) { const y = await get(l); if (y) smUrls.push(...[...y.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map(m => m[1])); }
      } else smUrls.push(l);
    }
  }
  queue.push(...smUrls.filter(u => KEY.test(new URL(u, origin).pathname)).slice(0, 25));

  const pdfs = new Set();
  let pages = 0;
  while (queue.length && pages < 40) {
    const u = queue.shift(); if (seen.has(u)) continue; seen.add(u);
    const h = await get(u); pages++;
    if (!h) continue;
    add(emailsIn(h), u);
    for (const l of links(h, u)) {
      let p; try { p = new URL(l); } catch { continue; }
      if (p.hostname.replace(/^www\./, '') !== host) { if (/^mailto:/i.test(l)) add(emailsIn(l), u); continue; }
      if (/\.pdf$/i.test(p.pathname)) { if (/report|newsletter|annual|brochure|contact|directory|staff|disclosure|privacy|fee|schedule/i.test(p.pathname)) pdfs.add(p.href); continue; }
      if (KEY.test(p.pathname) && !seen.has(p.href) && queue.length < 80) queue.push(p.href.split('#')[0]);
    }
  }

  // PDFs: text-extract up to 6
  for (const pdf of [...pdfs].slice(0, 6)) {
    const b = await get(pdf, true); if (!b || b.length > 15e6) continue;
    const f = `/tmp/deep-${process.pid}.pdf`; fs.writeFileSync(f, b);
    try { add(emailsIn(execFileSync('pdftotext', ['-l', '15', f, '-'], { encoding: 'utf8', timeout: 20000 })), pdf); } catch {}
  }

  // Wayback: latest archived copy of origin root and /contact pages
  for (const p of ['/', '/contact', '/contact-us', '/about', '/about-us']) {
    const avail = await get(`https://archive.org/wayback/available?url=${encodeURIComponent(host + p)}`);
    try {
      const snap = JSON.parse(avail || '{}').archived_snapshots?.closest;
      if (snap?.available) { const h = await get(snap.url); if (h) add(emailsIn(h), 'wayback:' + snap.timestamp + p); }
    } catch {}
  }

  // DNS SOA responsible-person mailbox
  try {
    const soa = execFileSync('dig', ['+short', 'SOA', host], { encoding: 'utf8', timeout: 8000 }).trim().split(/\s+/);
    if (soa[1]) { const r = soa[1].replace(/\.$/, ''); const i = r.indexOf('.'); if (i > 0) add([(r.slice(0, i) + '@' + r.slice(i + 1)).toLowerCase()], 'dns-soa'); }
  } catch {}

  return { page: pageUrl, host, pagesFetched: pages, pdfs: pdfs.size, found: Object.fromEntries(Object.entries(found).map(([e, s]) => [e, [...s].slice(0, 3)])) };
}

const urls = fs.readFileSync(inPath, 'utf8').split(/\s+/).filter(Boolean);
const results = [];
let i = 0;
async function worker() { while (i < urls.length) { const u = urls[i++]; results.push(await site(u)); process.stderr.write(`${results.length}/${urls.length}\r`); } }
await Promise.all(Array.from({ length: Number(process.env.W || 6) }, worker));
fs.writeFileSync(outPath, JSON.stringify(results, null, 1));
