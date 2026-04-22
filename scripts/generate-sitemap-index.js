#!/usr/bin/env node
// ============================================================
// scripts/generate-sitemap-index.js
// ============================================================
// Writes build/sitemap.xml as a SITEMAP INDEX pointing at every
// individual sitemap file on the site. Must run AFTER the
// individual sitemap generators so their output exists.
//
// Detects sitemaps by convention: any file named '*sitemap*.xml'
// (except sitemap.xml itself) inside build/ at any depth.
//
// Hook into package.json AFTER the per-section generators:
//   "postbuild": "node scripts/prerender.js
//                  && node scripts/generate-guides-sitemap.js
//                  && node scripts/generate-tools-sitemap.js
//                  && node scripts/generate-sitemap-index.js"
//
// Submit https://deftbrain.com/sitemap.xml to Google Search
// Console ONCE. The index tells Google to crawl all sub-sitemaps.
// ============================================================

const fs = require('fs');
const path = require('path');

const BUILD_DIR = path.join(__dirname, '..', 'build');
const OUTPUT    = path.join(BUILD_DIR, 'sitemap.xml');
const BASE_URL  = 'https://deftbrain.com';

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
    } else if (entry.isFile() && /sitemap.*\.xml$/i.test(entry.name) && entry.name !== 'sitemap.xml') {
      out.push(full);
    }
  }
  return out;
}

function extractLastmod(xmlContent) {
  // Pick the most recent <lastmod> inside the sitemap so the
  // index reflects when its underlying content last changed.
  const matches = xmlContent.match(/<lastmod>([^<]+)<\/lastmod>/gi) || [];
  const dates = matches
    .map(m => m.replace(/<\/?lastmod>/gi, '').trim())
    .filter(Boolean)
    .sort();
  return dates.length ? dates[dates.length - 1] : new Date().toISOString().slice(0, 10);
}

function main() {
  const sitemapFiles = walk(BUILD_DIR);

  if (!sitemapFiles.length) {
    console.warn('⚠ No sub-sitemaps found in build/. Index will be empty.');
  }

  const entries = sitemapFiles.map(file => {
    const rel = path.relative(BUILD_DIR, file).replace(/\\/g, '/');
    const xml = fs.readFileSync(file, 'utf8');
    return {
      loc: `${BASE_URL}/${rel}`,
      lastmod: extractLastmod(xml),
    };
  });

  entries.sort((a, b) => a.loc.localeCompare(b.loc));

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    entries.map(e =>
      `  <sitemap>\n` +
      `    <loc>${e.loc}</loc>\n` +
      `    <lastmod>${e.lastmod}</lastmod>\n` +
      `  </sitemap>`
    ).join('\n') +
    `\n</sitemapindex>\n`;

  fs.writeFileSync(OUTPUT, xml);

  console.log(`✓ Wrote sitemap index with ${entries.length} sub-sitemap(s) to ${path.relative(process.cwd(), OUTPUT)}`);
  for (const e of entries) console.log(`    · ${e.loc}  (lastmod ${e.lastmod})`);
}

main();
