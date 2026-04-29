#!/usr/bin/env node
// ============================================================
// scripts/build-sitemap-guides.js
// ============================================================
// Generates public/guides-sitemap.xml from spec files in guides/.
//
// Usage:
//   node scripts/build-sitemap-guides.js
//
// Reads:  guides/{category}/{slug}.js
// Writes: public/guides-sitemap.xml
//
// Wired into package.json prebuild as "build:sitemap:guides".
// Run after build:guides so we know all specs already passed validation.
// ============================================================

const fs   = require('fs');
const path = require('path');

const ROOT        = path.join(__dirname, '..');
const SPECS_DIR   = path.join(ROOT, 'guides');
const SITEMAP_OUT = path.join(ROOT, 'public', 'guides-sitemap.xml');
const BASE_URL    = 'https://deftbrain.com';

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function loadSpecs() {
  if (!fs.existsSync(SPECS_DIR)) {
    throw new Error(`Specs directory not found: ${SPECS_DIR}`);
  }
  const specs = [];
  const categories = fs.readdirSync(SPECS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  for (const cat of categories) {
    const catDir = path.join(SPECS_DIR, cat);
    const files = fs.readdirSync(catDir).filter(f => f.endsWith('.js'));
    for (const file of files) {
      const filepath = path.join(catDir, file);
      delete require.cache[require.resolve(filepath)];
      const spec = require(filepath);
      if (!spec.slug || !spec.category || !spec.modified) {
        console.warn(`  ⚠  Skipping ${path.relative(ROOT, filepath)} — missing slug/category/modified`);
        continue;
      }
      specs.push(spec);
    }
  }
  return specs;
}

function buildSitemapXml(specs) {
  const sorted = [...specs].sort((a, b) =>
    `${a.category}/${a.slug}`.localeCompare(`${b.category}/${b.slug}`)
  );

  const urlEntries = sorted.map(s => {
    const loc = `${BASE_URL}/guides/${esc(s.category)}/${esc(s.slug)}`;
    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${s.modified}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>
`;
}

function main() {
  console.log('🗺️   Building guides-sitemap.xml...');
  const specs = loadSpecs();
  if (!specs.length) {
    console.warn('  ⚠  No specs found.');
    return;
  }
  const xml = buildSitemapXml(specs);
  fs.mkdirSync(path.dirname(SITEMAP_OUT), { recursive: true });
  fs.writeFileSync(SITEMAP_OUT, xml, 'utf8');
  console.log(`  ✓ ${path.relative(ROOT, SITEMAP_OUT)} — ${specs.length} URL(s)`);
}

try {
  main();
} catch (err) {
  console.error(`✗ ${err.message}`);
  console.error(err.stack);
  process.exit(1);
}