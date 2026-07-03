#!/usr/bin/env node
//
// check-sitemap-urls.js — sitemap-integrity guard (postbuild).
// ─────────────────────────────────────────────────────────────
// Every URL a sitemap declares must resolve to a real, directly-servable file
// in build/ — no redirects, no 404s, no "the sitemap says it exists but the
// build doesn't." Sitemap-vs-build drift is exactly how removed guides or
// renamed tools linger in Google's queue as 404/redirect entries.
//
// Checks every <loc> in build/sitemap-app.xml + build/guides-sitemap.xml:
//   /Foo                         → build/Foo.html            (prerendered tool)
//   /guides/{cat}/{slug}         → build/guides/{cat}/{slug}.html
//   /guides | /guides/{cat} etc. → the matching index.html
//   /                            → build/index.html
// Exits 1 (fails the build) listing every unresolvable URL.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BUILD = path.join(ROOT, 'build');
const SITE = 'https://deftbrain.com';

function locs(file) {
  if (!fs.existsSync(file)) return null;
  const xml = fs.readFileSync(file, 'utf8');
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].trim());
}

function fileFor(urlPath) {
  if (urlPath === '/' || urlPath === '') return path.join(BUILD, 'index.html');
  const p = urlPath.replace(/^\//, '').replace(/\/$/, '');
  const candidates = [
    path.join(BUILD, `${p}.html`),        // flat prerendered page
    path.join(BUILD, p, 'index.html'),    // directory index (guide hubs/categories)
    path.join(BUILD, p),                  // literal file (e.g. static .html already in path)
  ];
  return candidates.find(fs.existsSync) || null;
}

const sitemaps = ['sitemap-app.xml', 'guides-sitemap.xml'];
let total = 0;
const missing = [];

for (const sm of sitemaps) {
  const urls = locs(path.join(BUILD, sm));
  if (urls === null) { console.error(`check-sitemap-urls: build/${sm} not found — run the build first.`); process.exit(2); }
  for (const url of urls) {
    total++;
    if (!url.startsWith(SITE)) { missing.push(`${url}  (not on ${SITE})`); continue; }
    const urlPath = url.slice(SITE.length) || '/';
    if (url.endsWith('/') && urlPath !== '/') { missing.push(`${url}  (trailing slash — sitemap URLs must be canonical, slashless)`); continue; }
    if (!fileFor(urlPath)) missing.push(`${url}  (no build file)`);
  }
}

if (missing.length) {
  console.error(`✗ check-sitemap-urls: ${missing.length}/${total} sitemap URL(s) do not resolve to a build file:`);
  missing.slice(0, 40).forEach(u => console.error(`   ${u}`));
  if (missing.length > 40) console.error(`   … and ${missing.length - 40} more`);
  process.exit(1);
}
console.log(`✅ check-sitemap-urls: all ${total} sitemap URL(s) resolve to real build files.`);
