'use strict';

// src/seo/buildSitemap.js
//
// Generates public/guides-sitemap.xml from the full list of published records.
// Called automatically by generatePages.js after a successful build.
// Can also be run standalone: node src/seo/buildSitemap.js
//
// To wire into your main sitemap, add this line to public/sitemap.xml:
//   <sitemap>
//     <loc>https://deftbrain.com/guides-sitemap.xml</loc>
//   </sitemap>
// And convert sitemap.xml to a sitemapindex format (see comment at bottom).

const fs   = require('fs');
const path = require('path');

// ── Find project root by walking up from this file ───────────────────────────
function findProjectRoot(start) {
  let dir = start;
  while (true) {
    if (fs.existsSync(path.join(dir, 'package.json')) &&
        fs.existsSync(path.join(dir, 'src'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error('Could not find project root — no package.json + src/ found above ' + start);
    dir = parent;
  }
}
const ROOT        = findProjectRoot(__dirname);
const CONTENT_DIR = path.join(ROOT, 'content');
const SITEMAP_OUT = path.join(ROOT, 'public', 'guides-sitemap.xml');
const BASE_URL    = 'https://deftbrain.com';



// ── Helpers ───────────────────────────────────────────────────────────────────

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Load all published records from content/ directory if called standalone
function loadAllRecords(dir) {
  const records = [];
  if (!fs.existsSync(dir)) return records;

  function walk(d) {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) { walk(full); continue; }
      if (!entry.name.endsWith('.json')) continue;
      try {
        const r = JSON.parse(fs.readFileSync(full, 'utf8'));
        if (r.published !== false && r.slug && r.category) records.push(r);
      } catch (_) { /* skip malformed */ }
    }
  }
  walk(dir);
  return records;
}

// ── Sitemap builder ───────────────────────────────────────────────────────────

function buildSitemap(records) {
  // Sort: high-volume first, then alphabetical within category
  const tierOrder = { high: 0, medium: 1, low: 2 };
  const sorted = [...records].sort((a, b) => {
    const ta = tierOrder[a.search_volume_tier] ?? 1;
    const tb = tierOrder[b.search_volume_tier] ?? 1;
    if (ta !== tb) return ta - tb;
    return `${a.category}/${a.slug}`.localeCompare(`${b.category}/${b.slug}`);
  });

  const today = new Date().toISOString().slice(0, 10);

  const urlEntries = sorted.map(r => {
    const loc        = `${BASE_URL}/guides/${esc(r.category)}/${esc(r.slug)}`;
    const lastmod    = r.modified || today;
    const priority   = r.search_volume_tier === 'high' ? '0.8'
                     : r.search_volume_tier === 'low'  ? '0.5'
                     : '0.6';

    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${priority}</priority>
  </url>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;

  fs.mkdirSync(path.dirname(SITEMAP_OUT), { recursive: true });
  fs.writeFileSync(SITEMAP_OUT, xml, 'utf8');

  const relPath = path.relative(ROOT, SITEMAP_OUT);
  console.log(`  ✅  ${relPath} — ${sorted.length} URL(s)`);
}

module.exports = { buildSitemap };

// ── Standalone entry point ────────────────────────────────────────────────────

if (require.main === module) {
  console.log('\n🗺️   Building guides-sitemap.xml...\n');
  const records = loadAllRecords(CONTENT_DIR);
  if (!records.length) {
    console.warn('  ⚠️  No published records found. Sitemap will be empty.');
  }
  buildSitemap(records);
  console.log('\n✨  Done.\n');
}

// ── How to wire into your main sitemap ───────────────────────────────────────
//
// Convert public/sitemap.xml from a <urlset> to a <sitemapindex>:
//
// <?xml version="1.0" encoding="UTF-8"?>
// <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
//   <sitemap>
//     <loc>https://deftbrain.com/sitemap-app.xml</loc>
//   </sitemap>
//   <sitemap>
//     <loc>https://deftbrain.com/guides-sitemap.xml</loc>
//   </sitemap>
// </sitemapindex>
//
// Move the existing <urlset> content to public/sitemap-app.xml.
// Google handles both formats. Search Console accepts sitemapindex URLs directly.
