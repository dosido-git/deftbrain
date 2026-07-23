#!/usr/bin/env node
// Build backend/lib/datacenter-ranges.json — a compact, sorted, merged list of
// [startUint32, endUint32] IPv4 ranges for the major cloud/hosting providers
// (AWS, GCP, Oracle, DigitalOcean). Used at metric write-time to drop
// datacenter traffic (bots/monitors/scrapers wearing a browser UA) so the
// dashboard reflects real visitors.
//
// Run:  node scripts/build-datacenter-ranges.js            (fetches live ranges)
//       node scripts/build-datacenter-ranges.js <src-dir>  (reads pre-downloaded
//         files: aws.json gcp.json oci.json do.csv — for offline/repro builds)
//
// Re-run periodically (ranges drift); commit the regenerated JSON. Runtime does
// NOT fetch — it loads the committed file. IPv4 only (the observed noise is
// IPv4; IPv6 cloud ranges can be added later if needed).

const fs = require('fs');
const nodePath = require('path');

const SOURCES = {
  aws: 'https://ip-ranges.amazonaws.com/ip-ranges.json',
  gcp: 'https://www.gstatic.com/ipranges/cloud.json',
  oci: 'https://docs.oracle.com/en-us/iaas/tools/public_ip_ranges.json',
  do:  'https://www.digitalocean.com/geo/google.csv',
  // Azure's JSON lives at a rotating download URL — discovered from the details
  // page at fetch time (see readSource). Offline builds use a saved azure.json.
  azure: 'https://www.microsoft.com/en-us/download/details.aspx?id=56519',
  linode: 'https://geoip.linode.com/',
  vultr: 'https://geofeed.constant.com/?json',
};

function ipv4ToInt(ip) {
  const p = ip.split('.');
  if (p.length !== 4) return null;
  let n = 0;
  for (const o of p) { const x = Number(o); if (!Number.isInteger(x) || x < 0 || x > 255) return null; n = n * 256 + x; }
  return n >>> 0;
}

function cidrToRange(cidr) {
  if (!cidr || cidr.includes(':')) return null; // IPv6 — skip
  const [ip, bitsStr] = cidr.trim().split('/');
  const base = ipv4ToInt(ip);
  if (base == null) return null;
  const bits = bitsStr == null ? 32 : Number(bitsStr);
  if (!Number.isInteger(bits) || bits < 0 || bits > 32) return null;
  const mask = bits === 0 ? 0 : (0xFFFFFFFF << (32 - bits)) >>> 0;
  const start = (base & mask) >>> 0;
  const size = Math.pow(2, 32 - bits);
  return [start, start + size - 1];
}

async function readSource(name, srcDir) {
  const file = { aws: 'aws.json', gcp: 'gcp.json', oci: 'oci.json', do: 'do.csv', azure: 'azure.json', linode: 'linode.csv', vultr: 'vultr.json' }[name];
  if (srcDir) return fs.readFileSync(nodePath.join(srcDir, file), 'utf8');
  let url = SOURCES[name];
  if (name === 'azure') {
    // Resolve the rotating ServiceTags_Public_<date>.json link from the details page.
    const page = await (await fetch(url)).text();
    const m = page.match(/https:\/\/download\.microsoft\.com\/download\/[^"]+\.json/);
    if (!m) throw new Error('azure: could not discover ServiceTags download URL');
    url = m[0];
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
  return res.text();
}

function parseAws(txt) { return (JSON.parse(txt).prefixes || []).map(p => p.ip_prefix).filter(Boolean); }
function parseGcp(txt) { return (JSON.parse(txt).prefixes || []).map(p => p.ipv4Prefix).filter(Boolean); }
function parseOci(txt) {
  const out = [];
  for (const r of (JSON.parse(txt).regions || [])) for (const c of (r.cidrs || [])) if (c.cidr) out.push(c.cidr);
  return out;
}
function parseDo(txt) {
  // CSV: network,country,region,city,postal — first column is the CIDR.
  return txt.split('\n').map(l => l.split(',')[0].trim()).filter(Boolean);
}
function parseAzure(txt) {
  // ServiceTags JSON: values[].properties.addressPrefixes (mixed v4/v6; v6 skipped downstream)
  const out = [];
  for (const v of (JSON.parse(txt).values || [])) {
    for (const p of ((v.properties && v.properties.addressPrefixes) || [])) out.push(p);
  }
  return out;
}
function parseLinode(txt) {
  // Geofeed CSV (RFC 8805): CIDR,country,region,city — comment lines start with #
  return txt.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#')).map(l => l.split(',')[0].trim()).filter(Boolean);
}
function parseVultr(txt) {
  // {subnets:[{ip_prefix:"x.x.x.x/nn"},…]}
  return (JSON.parse(txt).subnets || []).map(s => s.ip_prefix).filter(Boolean);
}

(async () => {
  const srcDir = process.argv[2] || null;
  const parsers = { aws: parseAws, gcp: parseGcp, oci: parseOci, do: parseDo, azure: parseAzure, linode: parseLinode, vultr: parseVultr };
  const perSource = {};
  let ranges = [];

  for (const name of Object.keys(SOURCES)) {
    try {
      const txt = await readSource(name, srcDir);
      const cidrs = parsers[name](txt);
      const rs = cidrs.map(cidrToRange).filter(Boolean);
      perSource[name] = rs.length;
      ranges.push(...rs);
      console.log(`  ${name}: ${cidrs.length} CIDRs → ${rs.length} IPv4 ranges`);
    } catch (e) {
      console.error(`  ${name}: FAILED — ${e.message}`);
      perSource[name] = 0;
    }
  }

  // Sort + merge overlapping/adjacent ranges → non-overlapping, binary-searchable.
  ranges.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const merged = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (last && r[0] <= last[1] + 1) last[1] = Math.max(last[1], r[1]);
    else merged.push(r.slice());
  }

  const out = {
    generated: new Date().toISOString().slice(0, 10),
    sources: SOURCES,
    perSource,
    ipsCovered: merged.reduce((a, [s, e]) => a + (e - s + 1), 0),
    count: merged.length,
    ranges: merged,
  };
  const dest = nodePath.join(__dirname, '..', 'backend', 'lib', 'datacenter-ranges.json');
  fs.writeFileSync(dest, JSON.stringify(out));
  console.log(`\n✓ ${merged.length} merged ranges (${(fs.statSync(dest).size / 1024).toFixed(0)} KB) → ${dest}`);
})();
