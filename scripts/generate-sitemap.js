#!/usr/bin/env node
// scripts/generate-sitemap.js
// Run: node scripts/generate-sitemap.js
// Reads tools.js, generates public/sitemap.xml
// Add to package.json: "prebuild": "node scripts/generate-sitemap.js"

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SITE_URL = 'https://deftbrain.com'; // Update to your production URL
const TODAY = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

// ── Read tools.js and extract tool IDs ──
const toolsPath = path.join(__dirname, '..', 'src', 'data', 'tools.js');
const toolsContent = fs.readFileSync(toolsPath, 'utf-8');

// Extract all id values. Key may be quoted ("id":) or unquoted (id:) and
// value may use either delimiter — tolerate all (matches prerender.js/chrome.js).
const idRegex = /["']?\bid\b["']?\s*:\s*["']([A-Za-z][\w-]+)["']/g;
const toolIds = [];
let match;
while ((match = idRegex.exec(toolsContent)) !== null) {
  const id = match[1];
  // Skip duplicates and empty-looking IDs
  if (id && !toolIds.includes(id) && id.length > 1) {
    toolIds.push(id);
  }
}

console.log(`Found ${toolIds.length} tools in catalog`);

// ── Tools keep-list (SEO concentration, 2026-07) ──
// Google's June 1 purge left ~15% of tool pages indexed on a low-authority
// domain. Strategy: concentrate — sitemap only the focus/keeper tools from
// src/data/tools-keep-list.json; everything else stays live for users but is
// noindexed by prerender.js. Sitemap and noindex are driven by the SAME file,
// and check-sitemap-urls.js asserts they never contradict each other.
// If the keep-list is missing/unreadable, fail the build rather than silently
// shipping a full-catalog sitemap that contradicts prerender's noindex set.
const keepListPath = path.join(__dirname, '..', 'src', 'data', 'tools-keep-list.json');
const keepList = JSON.parse(fs.readFileSync(keepListPath, 'utf-8'));
const INDEXABLE = new Set([...(keepList.focus || []), ...(keepList.keepers || [])]);
const unknown = [...INDEXABLE].filter(id => !toolIds.includes(id));
if (unknown.length) {
  console.error(`tools-keep-list.json lists IDs not present in tools.js: ${unknown.join(', ')}`);
  process.exit(1);
}
const indexableToolIds = toolIds.filter(id => INDEXABLE.has(id));
console.log(`Keep-list: ${indexableToolIds.length} indexable tools in sitemap (${toolIds.length - indexableToolIds.length} live-but-noindexed)`);

// ── Honest per-URL lastmod (2026-07) ──
// Google IGNORES changefreq and priority, but USES lastmod — if and only if
// it's consistently accurate. This script used to stamp every URL with the
// build date on every deploy ("all 37 tools changed today", daily), which is
// exactly the pattern that gets a site's lastmod distrusted and ignored.
// Instead: content-hash each tool's entry (and each static page's file) into
// src/data/sitemap-lastmod.json — a URL's lastmod only advances when its hash
// actually changes. The guides sitemap already does this honestly (per-article
// article:modified_time); this brings the app sitemap up to the same standard.
// Self-healing: if a change ships without the state file being refreshed, the
// Railway prebuild recomputes hashes and stamps the deploy date — still honest.
// After editing tools.js (or static pages), run `node scripts/generate-sitemap.js`
// and commit the updated sitemap-lastmod.json so dates stay stable.
const STATE_PATH = path.join(__dirname, '..', 'src', 'data', 'sitemap-lastmod.json');
let lastmodState = {};
try { lastmodState = JSON.parse(fs.readFileSync(STATE_PATH, 'utf-8')); } catch { /* first run */ }
const sha = s => crypto.createHash('sha1').update(s).digest('hex');

// Full tool objects (the regex above only extracts ids) — same eval approach
// as prerender.js loadTools(): tools.js is plain ESM data with no imports.
const toolObjects = (() => {
  const body = toolsContent.replace(/\bexport\s+const\b/g, 'const');
  // eslint-disable-next-line no-new-func
  const tools = new Function(`${body}\n;return typeof tools !== 'undefined' ? tools : [];`)();
  const map = {};
  for (const t of tools || []) if (t && t.id && !map[t.id]) map[t.id] = t;
  return map;
})();

let bumped = 0;
function lastmodFor(key, hash) {
  const prev = lastmodState[key];
  if (prev && prev.hash === hash) return prev.lastmod;
  lastmodState[key] = { hash, lastmod: TODAY };
  bumped++;
  return TODAY;
}

// Static pages: hash their source files so their dates only move on real edits.
const staticLastmod = {};
for (const p of ['about', 'privacy', 'terms']) {
  const f = path.join(__dirname, '..', 'public', `${p}.html`);
  staticLastmod[p] = fs.existsSync(f) ? lastmodFor(`static:${p}`, sha(fs.readFileSync(f, 'utf-8'))) : TODAY;
}

// Tools: hash the serialized tools.js entry (title/description/guide/faq/seo
// fields — everything that feeds the prerendered page body and meta).
const toolLastmod = {};
for (const id of indexableToolIds) {
  toolLastmod[id] = lastmodFor(`tool:${id}`, sha(JSON.stringify(toolObjects[id])));
}

// Homepage: its crawlable content is the featured/keep-list links + the tool
// index, so its hash is the keep-lists + the union of tool hashes.
const keepFiles = [keepListPath, path.join(__dirname, '..', 'guides', 'keep-list.json')]
  .map(f => (fs.existsSync(f) ? fs.readFileSync(f, 'utf-8') : ''));
const homepageLastmod = lastmodFor('homepage',
  sha(keepFiles.join('') + indexableToolIds.map(id => lastmodState[`tool:${id}`].hash).join('')));

fs.writeFileSync(STATE_PATH, JSON.stringify(lastmodState, null, 1) + '\n');
console.log(`lastmod: ${bumped} URL(s) bumped to ${TODAY}; others keep their prior dates`);

// ── Static pages (not tools, not guides — top-level standalone HTML) ──
// Extensible: append new entries as they ship (terms, contact, about, etc.)
const STATIC_PAGES = [
  { loc: `${SITE_URL}/privacy`, changefreq: 'monthly', priority: '0.3', lastmod: staticLastmod.privacy },
  { loc: `${SITE_URL}/about`,   changefreq: 'monthly', priority: '0.5', lastmod: staticLastmod.about },
  { loc: `${SITE_URL}/terms`,   changefreq: 'monthly', priority: '0.3', lastmod: staticLastmod.terms },
  // Future: { loc: `${SITE_URL}/contact`, changefreq: 'monthly', priority: '0.3' },
];

// ── Generate sitemap.xml ──
const urls = [
  // Homepage — highest priority
  {
    loc: SITE_URL,
    changefreq: 'weekly',
    priority: '1.0',
    lastmod: homepageLastmod,
  },
  // Static pages
  ...STATIC_PAGES,
  // Tool pages — keep-list only (see above). Focus tools get a higher priority
  // hint than keepers (documentation of intent — Google ignores priority).
  ...indexableToolIds.map(id => ({
    loc: `${SITE_URL}/${id}`,
    changefreq: 'monthly',
    priority: (keepList.focus || []).includes(id) ? '0.9' : '0.8',
    lastmod: toolLastmod[id],
  })),
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod || TODAY}</lastmod>
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
console.log(`Total URLs: ${urls.length} (1 homepage + ${STATIC_PAGES.length} static + ${indexableToolIds.length} tools)`);

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
