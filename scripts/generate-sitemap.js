#!/usr/bin/env node
// scripts/generate-sitemap.js
// Run: node scripts/generate-sitemap.js
// Reads tools.js, generates public/sitemap.xml
// Add to package.json: "prebuild": "node scripts/generate-sitemap.js"

const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://deftbrain.com'; // Update to your production URL
const TODAY = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

// ── Read tools.js and extract tool IDs ──
const toolsPath = path.join(__dirname, '..', 'src', 'data', 'tools.js');
const toolsContent = fs.readFileSync(toolsPath, 'utf-8');

// Extract all id values (handles both id: "Foo" and id: 'Foo')
const idRegex = /id:\s*["']([A-Za-z][\w-]+)["']/g;
const toolIds = [];
let match;
while ((match = idRegex.exec(toolsContent)) !== null) {
  const id = match[1];
  // Skip duplicates and empty-looking IDs
  if (id && !toolIds.includes(id) && id.length > 1) {
    toolIds.push(id);
  }
}

console.log(`Found ${toolIds.length} tools for sitemap`);

// ── Generate sitemap.xml ──
const urls = [
  // Homepage — highest priority
  {
    loc: SITE_URL + '/',
    changefreq: 'weekly',
    priority: '1.0',
  },
  // Tool pages
  ...toolIds.map(id => ({
    loc: `${SITE_URL}/${id}`,
    changefreq: 'monthly',
    priority: '0.8',
  })),
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;

// ── Write to public/ ──
// Writes to sitemap-app.xml — sitemap.xml is a sitemapindex referencing both
// sitemap-app.xml (app tools) and guides-sitemap.xml (SEO guide pages).
const outputPath = path.join(__dirname, '..', 'public', 'sitemap-app.xml');
fs.writeFileSync(outputPath, sitemap);
console.log(`Sitemap written to ${outputPath}`);
console.log(`Total URLs: ${urls.length} (1 homepage + ${toolIds.length} tools)`);

// ── Also generate robots.txt if it doesn't exist ──
const robotsPath = path.join(__dirname, '..', 'public', 'robots.txt');
if (!fs.existsSync(robotsPath)) {
  const robots = `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml

# Crawl-delay for polite crawling
Crawl-delay: 1
`;
  fs.writeFileSync(robotsPath, robots);
  console.log(`robots.txt written to ${robotsPath}`);
}
