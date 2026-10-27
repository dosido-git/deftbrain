// publicUrl.js — fetching a URL the server did not choose, safely.
//
// assertPublicUrl: the SSRF guard (security review 2026-07-21) — blocks
// private / loopback / link-local / metadata addresses, after DNS too. Callers
// re-check it on every redirect hop (a public URL can 302 to an internal one).
//
// checkSourceLink (2026-10-27, T13 in audit/DEFECT-TYPES.md): does a cited
// source still lead to the page that holds the finding, and what date does
// that page show? Owner's review of Signal vs. Noise: a Payscale link
// redirected to a general research page, so the claim could not be checked,
// and a GMAC page showed April 15 while the answer listed October 9.
const dnsPromises = require('dns').promises;

function isBlockedHost(hostname) {
  const h = (hostname || '').toLowerCase();
  if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.internal') || h.endsWith('.local')) return true;
  // literal IP checks (v4 + common v6)
  const v4 = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const [a,b] = [parseInt(v4[1],10), parseInt(v4[2],10)];
    if (a===10 || a===127 || a===0 || (a===169&&b===254) || (a===172&&b>=16&&b<=31) || (a===192&&b===168) || a>=224) return true;
  }
  if (h === '::1' || h.startsWith('fc') || h.startsWith('fd') || h.startsWith('fe80') || h.startsWith('[::1]') || h.includes('169.254.169.254')) return true;
  return false;
}

async function assertPublicUrl(u) {
  const parsed = new URL(u);
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Only http/https URLs are supported');
  if (isBlockedHost(parsed.hostname)) throw new Error('That URL is not allowed');
  // Resolve DNS and re-check — defeats hostnames that point at private IPs.
  try {
    const addrs = await dnsPromises.lookup(parsed.hostname, { all: true });
    if (addrs.some(a => isBlockedHost(a.address))) throw new Error('That URL is not allowed');
  } catch (e) { if (/not allowed/.test(e.message)) throw e; /* resolution failure handled downstream */ }
  return parsed;
}

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const depth = u => new URL(u).pathname.split('/').filter(Boolean).length;

// The date a page shows for itself: structured data first, then meta tags,
// then the first <time datetime>. YYYY-MM-DD, or null.
function pageDate(html) {
  const pats = [
    /"datePublished"\s*:\s*"([^"]{8,40})"/i,
    /property=["']article:published_time["'][^>]*content=["']([^"']{8,40})/i,
    /content=["']([^"']{8,40})["'][^>]*property=["']article:published_time/i,
    /name=["'](?:citation_publication_date|dc\.date|date)["'][^>]*content=["']([^"']{8,40})/i,
    /"dateModified"\s*:\s*"([^"]{8,40})"/i,
    /<time[^>]*datetime=["']([^"']{8,40})/i,
  ];
  for (const re of pats) {
    const m = html.match(re);
    const d = m && new Date(m[1].replace(/\//g, '-'));
    if (d && !isNaN(d) && d.getFullYear() > 1990) return d.toISOString().slice(0, 10);
  }
  return null;
}

// The words on a page, without markup, scripts or styles.
function pageText(html) {
  return String(html || '')
    .replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/&#8211;|&ndash;/g, '–').replace(/&#37;/g, '%')
    .replace(/\s+/g, ' ').trim();
}

// { status: 'ok' | 'moved' | 'dead' | 'unknown', date, text }
//   moved — a site's home page, or redirected to a shallower page (a home or section page);
//   dead  — 404 / 410;
//   unknown — blocked, timed out, or refused: kept, nothing claimed.
async function checkSourceLink(url, { timeoutMs = 6000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    // A home page cannot hold the finding it is cited for.
    if (depth(url) === 0) return { status: 'moved', date: null, text: '' };
    let current = (await assertPublicUrl(url)).href;
    let res = null;
    for (let hop = 0; hop < 5; hop++) {
      res = await fetch(current, { headers: { 'User-Agent': UA, Accept: 'text/html,*/*;q=0.8' }, signal: controller.signal, redirect: 'manual' });
      if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
        current = new URL(res.headers.get('location'), current).href;
        await assertPublicUrl(current);
        continue;
      }
      break;
    }
    if (res.status === 404 || res.status === 410) return { status: 'dead', date: null, text: '' };
    if (!res.ok) return { status: 'unknown', date: null, text: '' };
    if (current !== url && depth(current) < depth(url)) return { status: 'moved', date: null, text: '' };
    // Read at most 1.5 MB. A PDF or other binary gives no text, so nothing is
    // claimed about it.
    let html = '';
    const reader = /html|text/i.test(res.headers.get('content-type') || 'text/html') ? res.body?.getReader?.() : null;
    if (reader) {
      const dec = new TextDecoder();
      while (html.length < 1_500_000) { const { done, value } = await reader.read(); if (done) break; html += dec.decode(value, { stream: true }); }
      reader.cancel().catch(() => {});
    }
    return { status: 'ok', date: pageDate(html), text: pageText(html) };
  } catch {
    return { status: 'unknown', date: null, text: '' };
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { assertPublicUrl, isBlockedHost, checkSourceLink, pageDate, pageText };

// Self-check: node backend/lib/publicUrl.js
if (require.main === module) {
  const assert = require('assert');
  assert.strictEqual(pageDate('<script type="application/ld+json">{"datePublished":"2026-04-15T09:00:00Z"}</script>'), '2026-04-15');
  assert.strictEqual(pageDate('<meta property="article:published_time" content="2026-01-07">'), '2026-01-07');
  assert.strictEqual(pageDate('<p>no date</p>'), null);
  assert.strictEqual(pageText('<p>Pay grew <b>4.7%</b></p><script>x=1</script>'), 'Pay grew 4.7%');
  assert.strictEqual(isBlockedHost('169.254.169.254'), true);
  assert.strictEqual(depth('https://a.com/research/'), 1);
  console.log('publicUrl ok');
}
