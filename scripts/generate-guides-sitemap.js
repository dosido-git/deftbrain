#!/usr/bin/env node
// ============================================================
// scripts/generate-guides-sitemap.js
// ============================================================
// Walks build/guides/**/*.html, extracts <link rel="canonical">
// and <meta property="article:modified_time">, emits
// build/guides/guides-sitemap.xml.
//
// Hook into package.json so it runs after every build:
//   "scripts": {
//     "build": "react-scripts build",
//     "postbuild": "node scripts/prerender.js && node scripts/generate-guides-sitemap.js"
//   }
//
// Also update the top-level sitemap index (sitemap.xml) to
// reference this one. See SITEMAP_INDEX_NOTE below.
// ============================================================

const fs = require('fs');
const path = require('path');

const GUIDES_DIR = path.join(__dirname, '..', 'build', 'guides');
const OUTPUT     = path.join(__dirname, '..', 'build', 'guides-sitemap.xml');

// Files to ignore when walking build/guides/.
// index.html appears as the by-category landing page at build/guides/index.html
// and as each category's hub at build/guides/{category}/index.html — both are
// collection pages, not individual articles, so they don't carry an
// article:modified_time meta tag and shouldn't be in the article sitemap.
// by-tool.html is the by-tool collection view, same reasoning.
const IGNORE = new Set(['_template.html', '404.html', 'index.html', 'by-tool.html']);

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(full));
    } else if (entry.isFile() && entry.name.endsWith('.html') && !IGNORE.has(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

function extractMeta(html) {
  const canonical = /<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i.exec(html);
  const modified  = /<meta\s+property=["']article:modified_time["']\s+content=["']([^"']+)["']/i.exec(html);
  return {
    loc:     canonical ? canonical[1] : null,
    lastmod: modified  ? modified[1]  : null,
  };
}

function main() {
  const files = walk(GUIDES_DIR);
  const entries = [];
  const problems = [];

  for (const file of files) {
    const html = fs.readFileSync(file, 'utf8');
    const { loc, lastmod } = extractMeta(html);
    const rel = path.relative(GUIDES_DIR, file);

    if (!loc) { problems.push(`${rel}: missing <link rel="canonical">`); continue; }
    if (!lastmod) { problems.push(`${rel}: missing article:modified_time`); continue; }

    entries.push({ loc, lastmod });
  }

  // Stable sort — deterministic sitemap output keeps git diffs meaningful.
  entries.sort((a, b) => a.loc.localeCompare(b.loc));

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    entries.map(e =>
      `  <url>\n` +
      `    <loc>${e.loc}</loc>\n` +
      `    <lastmod>${e.lastmod}</lastmod>\n` +
      `    <changefreq>monthly</changefreq>\n` +
      `    <priority>0.8</priority>\n` +
      `  </url>`
    ).join('\n') +
    `\n</urlset>\n`;

  fs.writeFileSync(OUTPUT, xml);

  console.log(`✓ Wrote ${entries.length} guides to ${path.relative(process.cwd(), OUTPUT)}`);
  if (problems.length) {
    console.warn(`⚠ ${problems.length} file(s) skipped:`);
    problems.forEach(p => console.warn(`  - ${p}`));
    process.exit(1); // non-zero so CI/Railway deploys fail loud on missing meta
  }
}

main();

// ============================================================
// SITEMAP_INDEX_NOTE
// ============================================================
// For a multi-sitemap setup (tools + guides), your top-level
// /sitemap.xml should be a sitemap index pointing at both:
//
//   <?xml version="1.0" encoding="UTF-8"?>
//   <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
//     <sitemap>
//       <loc>https://deftbrain.com/sitemap-tools.xml</loc>
//     </sitemap>
//     <sitemap>
//       <loc>https://deftbrain.com/guides/guides-sitemap.xml</loc>
//     </sitemap>
//   </sitemapindex>
//
// This lets each sitemap regenerate independently and keeps
// Google Search Console reporting clean per-section.
// ============================================================
