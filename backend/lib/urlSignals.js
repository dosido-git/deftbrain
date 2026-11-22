// urlSignals.js — what a link's own text shows, computed in code (2026-11-22).
//
// Scam Radar used to leave links to the model ("domains and URLs as text").
// A model reading `paypa1` or `xn--pypal-4ve.com` from memory is T1/T2 in
// audit/DEFECT-TYPES.md; the facts below are exact, so code finds them and the
// model only explains them. Nothing here ever opens the link.
//
// Signals and their sources:
// - userinfo before "@": RFC 9110 §4.2.4 says recipients of untrusted http(s)
//   URIs should treat userinfo as an error, since it is used to hide the host.
// - IP-literal host, URL shortener, unusual port, punycode: the four most
//   common URL obfuscations in 15 years of phishing URLs (IEEE 10432841).
// - Brand lookalike / brand in subdomain: PhishMatch (arXiv 2112.02226).
// - Newly registered domain: phishing domains lived 8.6 days on average
//   (UCL, WEIS 2025). Read from RDAP via the IANA bootstrap (RFC 9224).
// Deliberately NOT here: "suspicious TLD" lists (they shift month to month, no
// stable source), and Google Safe Browsing (its free API is non-commercial
// only; Web Risk is paid — an owner decision, not a code one).
const psl = require('psl');
const { domainToUnicode } = require('url');

const MAX_LINKS = 5;

// Impersonated brands (Check Point brand-phishing reports, 2024-2026). Only
// the name is listed: a domain whose own label IS the name (amazon.de) is
// never flagged, so no list of official domains has to be kept true.
const BRANDS = ['paypal', 'apple', 'icloud', 'amazon', 'microsoft', 'office365', 'outlook', 'google', 'gmail', 'netflix',
  'facebook', 'instagram', 'whatsapp', 'linkedin', 'chase', 'wellsfargo', 'bankofamerica', 'citibank', 'usps', 'fedex',
  'dhl', 'ups', 'irs', 'coinbase', 'binance', 'ebay', 'dropbox', 'docusign', 'adobe', 'steam', 'walmart', 'spotify',
  'roblox', 'telegram', 'royalmail', 'hmrc', 'santander', 'barclays', 'hsbc', 'amex', 'venmo', 'zelle', 'cashapp'];

const SHORTENERS = new Set(['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'is.gd', 'buff.ly', 'rebrand.ly', 'cutt.ly',
  'shorturl.at', 'tiny.cc', 'rb.gy', 't.ly', 's.id', 'bl.ink', 'short.io', 'v.gd', 'qrco.de', 'tr.ee', 'shorte.st', 'adf.ly']);

// Digits and look-alike pairs read as letters (paypa1 → paypal, rn → m).
const deLeet = s => s.replace(/rn/g, 'm').replace(/vv/g, 'w').replace(/0/g, 'o').replace(/1/g, 'l').replace(/3/g, 'e')
  .replace(/5/g, 's').replace(/4/g, 'a').replace(/7/g, 't');

function oneEditApart(a, b) {
  if (a === b || Math.abs(a.length - b.length) > 1) return false;
  let i = 0, j = 0, edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++edits > 1) return false;
    if (a.length > b.length) i++; else if (b.length > a.length) j++; else { i++; j++; }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

// Links in free text: with a scheme, starting www., or a bare name.tld/path,
// plus the domain of any email address (a sender domain is a link too).
const URL_RE = /(?:https?:\/\/[^\s<>"'`]+|(?:[\p{L}\p{N}-]+\.)+[\p{L}]{2,24}(?:[:/?#][^\s<>"'`]*)?)/giu;

function extractLinks(text) {
  const out = [];
  const seen = new Set();
  for (const m of String(text || '').matchAll(URL_RE)) {
    let raw = m[0].replace(/[.,;:!?)\]}'"»”’]+$/u, '');
    const before = text[m.index - 1];
    const email = before === '@';
    if (before && /[\p{L}\p{N}.]/u.test(before) && !email) continue; // mid-word, e.g. a file.name
    if (email) raw = raw.split(/[/?#]/)[0];
    const hasScheme = /^https?:\/\//i.test(raw);
    let url;
    try { url = new URL(hasScheme ? raw : `http://${raw}`); } catch { continue; }
    const isIp = /^\d+\.\d+\.\d+\.\d+$/.test(url.hostname) || url.hostname.startsWith('[');
    // A bare word.word with no known suffix (e.g. "file.txt", "Mr.Smith") is not a link.
    if (!hasScheme && !isIp && !psl.parse(url.hostname).listed) continue;
    const key = (email ? '@' : '') + url.href;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ raw, url, hasScheme, email, isIp });
    if (out.length >= MAX_LINKS) break;
  }
  return out;
}

// Code-only signals for one link. Each is { code, ...params }; params are
// literal strings from the link itself, never a judgement.
function linkSignals({ raw, url, hasScheme, isIp }) {
  const host = url.hostname.replace(/^\[|\]$/g, '');
  const signals = [];
  const domain = isIp ? host : (psl.get(host) || host);

  if (url.username || url.password) {
    const shown = decodeURIComponent(url.username + (url.password ? `:${url.password}` : ''));
    signals.push({ code: 'userinfo', shown: shown.slice(0, 80), host });
  }
  if (isIp) signals.push({ code: 'ip', host });
  if (!isIp && host.split('.').some(l => l.startsWith('xn--'))) signals.push({ code: 'punycode', unicode: domainToUnicode(host), host });
  if (SHORTENERS.has(domain)) signals.push({ code: 'shortener', domain });
  if (url.port && !['80', '443'].includes(url.port)) signals.push({ code: 'port', port: url.port });

  if (!isIp) {
    const label = domain.split('.')[0];
    const sub = host.slice(0, Math.max(0, host.length - domain.length - 1));
    const tokens = s => s.split(/[.\-_]+/).filter(Boolean);
    const brandIn = (s, b) => b.length >= 5 ? s.includes(b) : tokens(s).includes(b);
    let found = false;
    for (const b of BRANDS) {
      if (label === b) break; // the brand's own name as the domain: nothing to say
      if (brandIn(label, b) || brandIn(sub, b)) { signals.push({ code: 'brand', brand: b, domain }); found = true; break; }
      const norm = deLeet(label);
      if (b.length >= 5 && (norm === b || tokens(norm).includes(b) || (norm.includes(b) && norm !== label) || tokens(label).some(t => oneEditApart(t, b)))) {
        signals.push({ code: 'lookalike', brand: b, domain }); found = true; break;
      }
    }
    if (!found && sub.split('.').filter(Boolean).length >= 3) signals.push({ code: 'deep', domain });
  }
  if (hasScheme && url.protocol === 'http:') signals.push({ code: 'http' });
  return { url: raw.slice(0, 200), host, domain, signals };
}

// ── Domain age from RDAP ──
// Hosts come from IANA's bootstrap file only (https, registry servers), the
// domain goes in the path, and redirects are never followed — so a visitor's
// link can't steer the server to an internal address (SSRF review 2026-07-21).
const BOOT_URL = 'https://data.iana.org/rdap/dns.json';
const DAY = 86400000;
let boot = null, bootAt = 0, bootLoading = null;
const ages = new Map(); // domain -> { registered, at }

async function getJson(url, ms) {
  const res = await fetch(url, { headers: { Accept: 'application/rdap+json, application/json' }, redirect: 'manual', signal: AbortSignal.timeout(ms) });
  if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function loadBoot() {
  if (boot && Date.now() - bootAt < DAY) return Promise.resolve(boot);
  if (!bootLoading) {
    bootLoading = getJson(BOOT_URL, 4000).then(j => {
      boot = new Map();
      for (const [tlds, urls] of j.services || []) {
        const base = (urls || []).find(u => u.startsWith('https://'));
        if (base) for (const t of tlds) boot.set(t.toLowerCase(), base.endsWith('/') ? base : `${base}/`);
      }
      bootAt = Date.now();
      return boot;
    }).finally(() => { bootLoading = null; });
  }
  return bootLoading;
}

async function registeredOn(domain, ms = 2000) {
  const hit = ages.get(domain);
  if (hit && Date.now() - hit.at < DAY) return hit.registered;
  const work = (async () => {
    const map = await loadBoot();
    const base = map.get(domain.split('.').pop());
    if (!base) return null;
    const j = await getJson(`${base}domain/${encodeURIComponent(domain)}`, ms);
    const ev = (j.events || []).find(e => e.eventAction === 'registration');
    const d = ev && new Date(ev.eventDate);
    return d && !isNaN(d) ? d.toISOString().slice(0, 10) : null;
  })();
  // Never blocks longer than `ms`, cold bootstrap included; a miss is "unknown".
  const registered = await Promise.race([work, new Promise(r => setTimeout(() => r(undefined), ms))]).catch(() => undefined);
  if (registered !== undefined) ages.set(domain, { registered, at: Date.now() });
  if (ages.size > 5000) ages.delete(ages.keys().next().value);
  return registered ?? null;
}

// Every link in the text, its signals, and its domain's registration date,
// looked up side by side. `lookup: false` skips the network (tests).
async function checkLinks(text, { lookup = true, now = Date.now() } = {}) {
  const links = extractLinks(text).map(l => ({ ...linkSignals(l), email: l.email, isIp: l.isIp }));
  await Promise.all(links.map(async l => {
    if (!lookup || l.isIp || !l.domain.includes('.')) return;
    const registered = await registeredOn(l.domain);
    if (!registered) return;
    l.registered = registered;
    const days = Math.floor((now - Date.parse(registered)) / DAY);
    if (days >= 0 && days <= 90) l.signals.push({ code: 'new', date: registered, days: String(days) });
  }));
  return links.map(({ isIp, ...l }) => l);
}

// The block the model reads: plain English facts, one per line.
const SAY = {
  userinfo: s => `the text before "@" ("${s.shown}") is not where the link goes; a browser goes to ${s.host}`,
  ip: s => `the host is a bare IP address (${s.host}), not a name`,
  punycode: s => `the name is punycode: it displays as ${s.unicode} but is really ${s.host}`,
  shortener: s => `${s.domain} is a link shortener; the real destination is not visible`,
  port: s => `it uses an unusual port (${s.port})`,
  brand: s => `the name "${s.brand}" appears in it, but the site's actual registered domain is ${s.domain}`,
  lookalike: s => `the domain ${s.domain} resembles "${s.brand}" through a character swap or near-spelling`,
  deep: s => `several layers of subdomain sit in front of the actual domain ${s.domain}`,
  http: () => 'it uses http, not https (by itself proves nothing either way)',
  new: s => `public registration records show the domain was registered ${s.date} (${s.days} days ago)`,
};

function linkFactsBlock(links) {
  if (!links.length) return '';
  const lines = links.map(l => {
    const facts = l.signals.map(s => (SAY[s.code] || (() => s.code))(s));
    if (l.registered && !l.signals.some(s => s.code === 'new')) facts.push(`public registration records show it registered ${l.registered}`);
    return `- ${l.email ? 'email address domain' : 'link'} ${l.url}: ${facts.length ? facts.join('; ') : 'no warning signs in the link text itself'}`;
  });
  return `LINK CHECKS (computed by code from the link text and public domain-registration records; the links were never opened):\n${lines.join('\n')}`;
}

// warmRdap: fetch the bootstrap file at route load, so the first visitor's lookup isn't the cold one.
const warmRdap = () => loadBoot().catch(() => {});

module.exports = { checkLinks, extractLinks, linkSignals, linkFactsBlock, registeredOn, warmRdap };

// Self-check: node backend/lib/urlSignals.js
if (require.main === module) {
  const assert = require('assert');
  (async () => {
    const codes = async t => (await checkLinks(t, { lookup: false })).map(l => l.signals.map(s => s.code).join(','));
    assert.deepStrictEqual(await codes('Click http://secure-paypa1-verify.com/restore now.'), ['lookalike,http']);
    assert.deepStrictEqual(await codes('From: security@paypa1-alerts.net'), ['lookalike']);
    assert.deepStrictEqual(await codes('https://paypal.com.account-check.net/login'), ['brand']);
    assert.deepStrictEqual(await codes('https://www.paypal.com/signin'), ['']);
    assert.deepStrictEqual(await codes('https://amazon.co.uk/x and https://amazom.com'), ['', 'lookalike']);
    assert.deepStrictEqual(await codes('see bit.ly/3xYz'), ['shortener']);
    assert.deepStrictEqual(await codes('http://192.168.0.1:8080/a'), ['ip,port,http']);
    assert.deepStrictEqual(await codes('https://www.google.com@evil.example.com/'), ['userinfo']);
    assert.deepStrictEqual(await codes('https://xn--pypal-4ve.com/'), ['punycode,lookalike']);
    assert.deepStrictEqual(await codes('track-your-parcel-now.info/confirm'), ['']);
    assert.deepStrictEqual(await codes('Hi Mr.Smith, see file.txt and groups.io'), ['']); // only groups.io
    assert.strictEqual((await checkLinks('https://ups.com', { lookup: false }))[0].signals.length, 0);
    assert.strictEqual((await checkLinks('nothing here', { lookup: false })).length, 0);
    assert.ok(linkFactsBlock(await checkLinks('bit.ly/a', { lookup: false })).includes('link shortener'));
    console.log('urlSignals self-check: ok');
  })().catch(e => { console.error(e); process.exit(1); });
}
