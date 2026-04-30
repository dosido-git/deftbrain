#!/usr/bin/env node
// ============================================================
// scripts/generate-guides-sitemap.js
// ============================================================
// Walks build/guides/**/*.html, extracts <link rel="canonical">
// and <meta property="article:modified_time">, emits
// build/guides-sitemap.xml.
//
// Also includes hub pages (the /guides index, /guides/by-tool,
// and the 18 per-category pages) which are real SEO assets but
// don't carry article:modified_time meta. Hub pages get higher
// priority (0.9) than individual articles (0.8).
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

const ROOT       = path.join(__dirname, '..');
const GUIDES_DIR = path.join(ROOT, 'build', 'guides');
const OUTPUT     = path.join(ROOT, 'build', 'guides-sitemap.xml');
const BASE_URL   = 'https://deftbrain.com';

// Categories with hub pages at /guides/{category}.
// Keep in sync with CATEGORY_META in scripts/build-guides-indexes.js.
const CATEGORIES = [
  'apologies','career','conversations','cooking','decisions','health',
  'home','learning','meetings','money','pets','planning','practical',
  'presentations','speeches','travel','wellness','workplace',
];

// Files to ignore when walking build/guides/.
// index.html appears as the by-category landing page at build/guides/index.html
// and as each category's hub at build/guides/{category}/index.html — both are
// collection pages, not individual articles, so they don't carry an
// article:modified_time meta tag and shouldn't be in the article sitemap.
// by-tool.html is the by-tool collection view, same reasoning.
// All these hub pages are added back to the sitemap separately, with
// higher priority and weekly changefreq, since they're still SEO assets.
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

function buildHubEntries() {
  // Hubs regenerate on every build; use today's date as lastmod.
  const today = new Date().toISOString().split('T')[0];
  const hubs = [
    { loc: `${BASE_URL}/guides`,         lastmod: today, changefreq: 'weekly', priority: '0.9' },
    { loc: `${BASE_URL}/guides/by-tool`, lastmod: today, changefreq: 'weekly', priority: '0.9' },
  ];
  for (const cat of CATEGORIES) {
    hubs.push({
      loc:        `${BASE_URL}/guides/${cat}`,
      lastmod:    today,
      changefreq: 'weekly',
      priority:   '0.9',
    });
  }
  return hubs;
}

function urlEntry(e) {
  return `  <url>
    <loc>${e.loc}</loc>
    <lastmod>${e.lastmod}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`;
}

function main() {
  const files = walk(GUIDES_DIR);
  const articleEntries = [];
  const problems = [];

  for (const file of files) {
    const html = fs.readFileSync(file, 'utf8');
    const { loc, lastmod } = extractMeta(html);
    const rel = path.relative(GUIDES_DIR, file);

    if (!loc) { problems.push(`${rel}: missing <link rel="canonical">`); continue; }
    if (!lastmod) { problems.push(`${rel}: missing article:modified_time`); continue; }

    articleEntries.push({
      loc,
      lastmod,
      changefreq: 'monthly',
      priority:   '0.8',
    });
  }

  const hubEntries = buildHubEntries();

  // Hubs first (higher priority), then articles. Within each group, sort by URL
  // for deterministic output that produces clean git diffs.
  hubEntries.sort((a, b) => a.loc.localeCompare(b.loc));
  articleEntries.sort((a, b) => a.loc.localeCompare(b.loc));
  const allEntries = [...hubEntries, ...articleEntries];

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    allEntries.map(urlEntry).join('\n') +
    `\n</urlset>\n`;

  fs.writeFileSync(OUTPUT, xml);

  console.log(`✓ Wrote ${allEntries.length} URLs to ${path.relative(process.cwd(), OUTPUT)}`);
  console.log(`  • ${hubEntries.length} hub pages (priority 0.9)`);
  console.log(`  • ${articleEntries.length} article pages (priority 0.8)`);

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
// /sitemap.xml is a sitemap index pointing at both:
//
//   <?xml version="1.0" encoding="UTF-8"?>
//   <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
//     <sitemap>
//       <loc>https://deftbrain.com/sitemap-app.xml</loc>
//     </sitemap>
//     <sitemap>
//       <loc>https://deftbrain.com/guides-sitemap.xml</loc>
//     </sitemap>
//   </sitemapindex>
//
// This lets each sitemap regenerate independently and keeps
// Google Search Console reporting clean per-section.
// ============================================================
