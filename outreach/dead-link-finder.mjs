#!/usr/bin/env node
// dead-link-finder — find broken outbound links on prospect pages that a
// DeftBrain tool or guide could replace (broken-link outreach, Step 2B–4).
//
//   node outreach/dead-link-finder.mjs [prospects.txt] [options]
//
//   prospects.txt   one page URL per line; blank lines and # comments ignored
//                   (default: outreach/prospects.txt)
//   --out DIR       where CSVs go (default: outreach/results)
//   --concurrency N parallel link checks (default: 8)
//   --no-wayback    skip Wayback Machine lookups
//   --fresh         ignore the link cache and recheck everything
//   --all-links     also check same-site links that don't look relevant
//                   (by default: every outside link, plus same-site links
//                   whose text or URL matches the relevance words below)
//
// Writes, dated by run day:
//   prospects-YYYY-MM-DD.csv   one row per prospect page, with the fields used
//                              to qualify it (last updated, outbound links,
//                              nofollow share, contact) and its dead-link count
//   dead-links-YYYY-MM-DD.csv  one row per dead link on a prospect page, with
//                              anchor text, error, relevance and what the dead
//                              page was (Wayback snapshot and its title)
// and link-cache.json, so a rerun within 7 days skips links already checked.
//
// Node 18+, no dependencies. Run it from your own terminal (it needs normal
// internet access).

import fs from 'node:fs';
import path from 'node:path';

const UA = 'Mozilla/5.0 (compatible; DeftBrainLinkCheck/1.0; +https://deftbrain.com)';
const PAGE_TIMEOUT = 20000;
const LINK_TIMEOUT = 15000;
const CACHE_DAYS = 7;

// Words that make a dead link worth replacing with a deposit/renter resource.
// Edit for other tools.
const STRONG = /security deposit|deposit|move[- ]?in|move[- ]?out|checklist|condition (report|form)|inspection|walk[- ]?through|demand letter|small claims/i;
const WEAK = /tenant|renter|landlord|lease|rental|housing|apartment|eviction/i;

// ── args ────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name, dflt) => { const i = args.indexOf(name); return i >= 0 && args[i + 1] ? args[i + 1] : dflt; };
const positional = args.filter((a, i) => !a.startsWith('--') && !['--out', '--concurrency'].includes(args[i - 1]));
const here = path.dirname(new URL(import.meta.url).pathname);
const prospectsFile = positional[0] || path.join(here, 'prospects.txt');
const outDir = opt('--out', path.join(here, 'results'));
const concurrency = Math.max(1, parseInt(opt('--concurrency', '8'), 10) || 8);
const useWayback = !flag('--no-wayback');
const fresh = flag('--fresh');
const allLinks = flag('--all-links');

// ── helpers ─────────────────────────────────────────────────────────────────
const log = (...m) => process.stderr.write(m.join(' ') + '\n');
const today = new Date().toISOString().slice(0, 10);
const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } };
const decode = (s) => s
  .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"')
  .replace(/&#39;|&apos;/gi, "'").replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
  .replace(/&#(\d+);/g, (m, n) => String.fromCodePoint(Number(n)));
const text = (html) => decode(html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const csvCell = (v) => { const s = v == null ? '' : String(v); return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const writeCsv = (file, rows, cols) => fs.writeFileSync(file,
  [cols.join(','), ...rows.map(r => cols.map(c => csvCell(r[c])).join(','))].join('\n') + '\n');
const errCode = (e) => {
  if (!e) return '';
  if (e.name === 'TimeoutError' || e.name === 'AbortError') return 'timeout';
  const c = e.cause && (e.cause.code || e.cause.name);
  return c || e.code || e.name || 'error';
};

async function get(url, { method = 'GET', timeout = LINK_TIMEOUT, maxBytes = 3_000_000 } = {}) {
  const res = await fetch(url, {
    method, redirect: 'follow', signal: AbortSignal.timeout(timeout),
    headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml,*/*;q=0.8' },
  });
  let body = '';
  if (method === 'GET') {
    const type = res.headers.get('content-type') || '';
    if (/html|xml|text/i.test(type)) {
      const buf = Buffer.from(await res.arrayBuffer());
      body = buf.subarray(0, maxBytes).toString('utf8');
    } else {
      try { await res.body?.cancel(); } catch { /* ignore */ }
    }
  }
  return { status: res.status, finalUrl: res.url || url, headers: res.headers, body };
}

async function pool(items, n, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (next < items.length) { const i = next++; out[i] = await fn(items[i], i); }
  }));
  return out;
}

// ── page parsing ────────────────────────────────────────────────────────────
function parseLinks(html, base) {
  const links = [];
  const re = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html))) {
    const attrs = m[1];
    const hm = attrs.match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    if (!hm) continue;
    const raw = decode((hm[1] ?? hm[2] ?? hm[3] ?? '').trim());
    if (!raw || raw.startsWith('#') || /^(mailto|tel|javascript|data):/i.test(raw)) continue;
    let abs;
    try { abs = new URL(raw, base); } catch { continue; }
    if (!/^https?:$/.test(abs.protocol)) continue;
    abs.hash = '';
    const rel = (attrs.match(/\brel\s*=\s*["']([^"']*)["']/i) || [])[1] || '';
    links.push({ url: abs.href, anchor: text(m[2]).slice(0, 200), rel });
  }
  return links;
}

function pageSignals(html, url) {
  const title = text((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '');
  const body = text(html);
  const upd = body.match(/(last\s+(?:updated|modified|reviewed|revised)|updated|reviewed)\s*(?:on|:)?\s*((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{4}|\d{4})/i);
  const years = [...body.matchAll(/\b(20[0-3]\d)\b/g)].map(x => Number(x[1])).filter(y => y <= new Date().getFullYear());
  const emails = [...new Set([...html.matchAll(/mailto:([^"'?\s>]+)/gi)].map(x => decode(x[1])))].slice(0, 3);
  const contact = parseLinks(html, url).find(l => /contact|feedback|webmaster/i.test(l.anchor + ' ' + l.url));
  return {
    title,
    last_updated_text: upd ? `${upd[1]} ${upd[2]}`.replace(/\s+/g, ' ') : '',
    newest_year: years.length ? Math.max(...years) : '',
    emails: emails.join(' '),
    contact_url: contact ? contact.url : '',
  };
}

// ── link checking ───────────────────────────────────────────────────────────
const SOFT404_TITLE = /\b(404|page not found|not found|no longer available|page (?:has been )?(?:moved|removed)|doesn'?t exist|does not exist|cannot be found|can'?t be found)\b/i;

async function checkLink(url) {
  // GET, not HEAD: many servers mishandle HEAD, and a soft 404 ("200 OK" with
  // a "Page not found" title) only shows in the body. Bodies are capped.
  let r;
  try {
    r = await get(url, { method: 'GET', maxBytes: 300_000 });
  } catch (e) {
    const code = errCode(e);
    // Timeouts, resets and temporary DNS failures may be a slow or bot-shy
    // server, not a dead page.
    const verdict = /timeout|ECONNRESET|UND_ERR_SOCKET|EAI_AGAIN/i.test(code) ? 'uncertain' : 'dead';
    return { verdict, status: '', error: code, final_url: '' };
  }
  const res = { status: r.status, error: '', final_url: r.finalUrl !== url ? r.finalUrl : '' };
  if (r.status === 401 || r.status === 403 || r.status === 429 || r.status === 999) return { ...res, verdict: 'uncertain' };
  if (r.status >= 400) return { ...res, verdict: 'dead' };
  // Soft 404: redirected to a home page, or a page titled "not found".
  const from = new URL(url), to = new URL(r.finalUrl);
  const toRoot = (to.pathname === '/' || to.pathname === '') && from.pathname.length > 1;
  const title = text((r.body.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '');
  if (toRoot || /\/(404|not-?found|error)(\/|\.|$)/i.test(to.pathname) || SOFT404_TITLE.test(title)) {
    return { ...res, verdict: 'soft404', page_title: title };
  }
  return { ...res, verdict: 'ok' };
}

async function wayback(url) {
  try {
    const api = `https://archive.org/wayback/available?url=${encodeURIComponent(url)}`;
    const r = await get(api, { timeout: 20000 });
    const snap = JSON.parse(r.body || '{}').archived_snapshots?.closest;
    if (!snap || !snap.available) return { wayback_url: '', wayback_date: '', wayback_title: '' };
    let title = '';
    try {
      const s = await get(snap.url, { timeout: 25000, maxBytes: 500_000 });
      title = text((s.body.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '');
    } catch { /* title is optional */ }
    const t = snap.timestamp || '';
    return { wayback_url: snap.url, wayback_date: t ? `${t.slice(0, 4)}-${t.slice(4, 6)}-${t.slice(6, 8)}` : '', wayback_title: title };
  } catch (e) {
    return { wayback_url: '', wayback_date: '', wayback_title: '', wayback_error: errCode(e) };
  }
}

// ── main ────────────────────────────────────────────────────────────────────
async function main() {
  if (!fs.existsSync(prospectsFile)) { log(`No prospects file: ${prospectsFile}`); process.exit(1); }
  const prospects = [...new Set(fs.readFileSync(prospectsFile, 'utf8').split('\n')
    .map(l => l.replace(/#.*$/, '').trim()).filter(l => /^https?:\/\//i.test(l)))];
  fs.mkdirSync(outDir, { recursive: true });
  const cacheFile = path.join(outDir, 'link-cache.json');
  const cache = !fresh && fs.existsSync(cacheFile) ? JSON.parse(fs.readFileSync(cacheFile, 'utf8')) : {};
  const maxAge = CACHE_DAYS * 864e5;

  log(`Fetching ${prospects.length} prospect page(s)…`);
  const pages = await pool(prospects, Math.min(concurrency, 4), async (url) => {
    try {
      const r = await get(url, { timeout: PAGE_TIMEOUT });
      if (r.status >= 400 || !r.body) return { url, status: r.status, error: r.body ? '' : 'not html', links: [] };
      const self = host(r.finalUrl);
      const links = parseLinks(r.body, r.finalUrl)
        .filter(l => allLinks || host(l.url) !== self || STRONG.test(l.anchor + ' ' + l.url) || WEAK.test(l.anchor + ' ' + l.url));
      return { url, status: r.status, final_url: r.finalUrl, last_modified: r.headers.get('last-modified') || '', links, ...pageSignals(r.body, r.finalUrl) };
    } catch (e) {
      return { url, status: '', error: errCode(e), links: [] };
    }
  });

  const unique = [...new Set(pages.flatMap(p => p.links.map(l => l.url)))];
  const toCheck = unique.filter(u => !(cache[u] && Date.now() - cache[u].checked < maxAge));
  log(`Checking ${toCheck.length} link(s) (${unique.length - toCheck.length} from cache)…`);
  let done = 0;
  await pool(toCheck, concurrency, async (u) => {
    cache[u] = { ...(await checkLink(u)), checked: Date.now() };
    if (++done % 50 === 0) log(`  ${done}/${toCheck.length}`);
  });

  const deadUrls = unique.filter(u => ['dead', 'soft404'].includes(cache[u].verdict));
  if (useWayback) {
    const need = deadUrls.filter(u => cache[u].wayback_url === undefined || cache[u].wayback_error);
    log(`Looking up ${need.length} dead link(s) in the Wayback Machine…`);
    await pool(need, 2, async (u) => { delete cache[u].wayback_error; Object.assign(cache[u], await wayback(u)); });
  }
  fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 1));

  const deadRows = [];
  const prospectRows = pages.map(p => {
    const ext = p.links.filter(l => host(l.url) !== host(p.final_url || p.url));
    const extUrls = [...new Set(ext.map(l => l.url))];
    const nofollow = ext.filter(l => /nofollow|sponsored|ugc/i.test(l.rel)).length;
    const seen = new Set();
    let dead = 0, relevantDead = 0, uncertain = 0;
    for (const l of p.links) {
      const c = cache[l.url];
      if (!c || seen.has(l.url)) continue;
      seen.add(l.url);
      if (c.verdict === 'uncertain') uncertain++;
      if (!['dead', 'soft404'].includes(c.verdict)) continue;
      const hay = `${l.anchor} ${l.url} ${c.wayback_title || ''}`;
      const relevance = STRONG.test(hay) ? 'strong' : WEAK.test(hay) ? 'weak' : '';
      dead++; if (relevance) relevantDead++;
      deadRows.push({
        relevance, prospect_url: p.url, prospect_title: p.title, dead_url: l.url, anchor_text: l.anchor,
        verdict: c.verdict, status: c.status, error: c.error, final_url: c.final_url,
        internal: host(l.url) === host(p.final_url || p.url) ? 'yes' : '', rel: l.rel,
        wayback_url: c.wayback_url || '', wayback_date: c.wayback_date || '', wayback_title: c.wayback_title || '', wayback_error: c.wayback_error || '',
        contact_url: p.contact_url, emails: p.emails,
      });
    }
    return {
      prospect_url: p.url, status: p.status, error: p.error || '', title: p.title || '',
      last_updated_text: p.last_updated_text || '', newest_year: p.newest_year || '', last_modified_header: p.last_modified || '',
      outbound_external: extUrls.length, nofollow_share: ext.length ? `${Math.round(100 * nofollow / ext.length)}%` : '',
      dead_links: dead, relevant_dead_links: relevantDead, uncertain_links: uncertain,
      contact_url: p.contact_url || '', emails: p.emails || '',
    };
  });
  const rank = { strong: 0, weak: 1, '': 2 };
  deadRows.sort((a, b) => rank[a.relevance] - rank[b.relevance] || a.prospect_url.localeCompare(b.prospect_url));
  prospectRows.sort((a, b) => b.relevant_dead_links - a.relevant_dead_links || b.dead_links - a.dead_links);

  const pf = path.join(outDir, `prospects-${today}.csv`);
  const df = path.join(outDir, `dead-links-${today}.csv`);
  writeCsv(pf, prospectRows, ['prospect_url', 'status', 'error', 'title', 'last_updated_text', 'newest_year', 'last_modified_header', 'outbound_external', 'nofollow_share', 'dead_links', 'relevant_dead_links', 'uncertain_links', 'contact_url', 'emails']);
  writeCsv(df, deadRows, ['relevance', 'prospect_url', 'prospect_title', 'dead_url', 'anchor_text', 'verdict', 'status', 'error', 'final_url', 'internal', 'rel', 'wayback_url', 'wayback_date', 'wayback_title', 'wayback_error', 'contact_url', 'emails']);
  const strong = deadRows.filter(r => r.relevance === 'strong').length;
  log(`\nDone. ${pages.length} page(s), ${unique.length} link(s) checked, ${deadRows.length} dead (${strong} strongly relevant).`);
  log(`  ${pf}\n  ${df}`);
}

main().catch(e => { log(e.stack || String(e)); process.exit(1); });
