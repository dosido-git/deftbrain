// datacenterIp — is a request IP a known cloud/hosting provider (AWS, GCP,
// Oracle, DigitalOcean)? Such traffic is bots/monitors/scrapers, not real
// visitors, so metrics exclude it at write time. Data is the committed,
// pre-merged table from scripts/build-datacenter-ranges.js (IPv4 only); we load
// it once and binary-search — no network, no per-request cost beyond O(log n).

let RANGES = [];
try {
  RANGES = require('./datacenter-ranges.json').ranges || [];
} catch (_) {
  RANGES = []; // missing/corrupt table → never excludes (fail open, never throws)
}

function ipv4ToInt(ip) {
  const p = ip.split('.');
  if (p.length !== 4) return null;
  let n = 0;
  for (const o of p) { const x = Number(o); if (!Number.isInteger(x) || x < 0 || x > 255) return null; n = n * 256 + x; }
  return n >>> 0;
}

// True if `ip` falls in any cloud/datacenter range. Handles IPv4 and
// IPv4-mapped IPv6 (::ffff:a.b.c.d); pure IPv6 is unsupported → false.
function isDatacenterIp(ip) {
  if (!ip || !RANGES.length) return false;
  let s = ip;
  const m = /^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/i.exec(ip);
  if (m) s = m[1];
  if (s.includes(':')) return false; // pure IPv6 — not covered
  const n = ipv4ToInt(s);
  if (n == null) return false;
  let lo = 0, hi = RANGES.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const r = RANGES[mid];
    if (n < r[0]) hi = mid - 1;
    else if (n > r[1]) lo = mid + 1;
    else return true;
  }
  return false;
}

module.exports = { isDatacenterIp, rangeCount: RANGES.length };
