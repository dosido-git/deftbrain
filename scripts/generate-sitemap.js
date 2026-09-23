#!/usr/bin/env node
// scripts/generate-sitemap.js
// Run: node scripts/generate-sitemap.js
// Reads tools.js, generates public/sitemap.xml
// Add to package.json: "prebuild": "node scripts/generate-sitemap.js"

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { categoriesFor } = require('./lib/toolCategories');

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

// --check recomputes every hash and reports whether the COMMITTED state still
// matches the COMMITTED content, without writing anything. Run as a pre-push
// gate, it catches the failure that went unnoticed for three weeks: this file
// is only meaningful if it travels with the content it describes. Railway
// builds from git, so a stale state means every deploy finds all 41 hashes
// mismatched and stamps the deploy date on all of them — the exact "everything
// changed today, daily" pattern that gets lastmod ignored.
//
// It catches both ways in: built locally and forgot to commit the state, and
// edited a tool without ever building. Either way the answer is the same —
// run the generator, commit the result.
const CHECK = process.argv.includes('--check');

const bumped = [];
function lastmodFor(key, hash) {
  const prev = lastmodState[key];
  if (prev && prev.hash === hash) return prev.lastmod;
  lastmodState[key] = { hash, lastmod: TODAY };
  bumped.push(key);
  return TODAY;
}

// Static pages: hash their source files so their dates only move on real edits.
const staticLastmod = {};
for (const p of ['about', 'privacy', 'terms']) {
  const f = path.join(__dirname, '..', 'public', `${p}.html`);
  staticLastmod[p] = fs.existsSync(f) ? lastmodFor(`static:${p}`, sha(fs.readFileSync(f, 'utf-8'))) : TODAY;
}
// /tools (AllToolsPage.js, added 2026-09-22) is client-rendered, not a
// standalone public/*.html file like the three above — hash its component
// source instead so it gets the same "date only moves on a real edit"
// contract rather than re-stamping on every deploy.
{
  const f = path.join(__dirname, '..', 'src', 'components', 'AllToolsPage.js');
  staticLastmod.tools = fs.existsSync(f) ? lastmodFor('static:tools', sha(fs.readFileSync(f, 'utf-8'))) : TODAY;
}
// /organizations (OrganizationsPage.js, added 2026-09-23) — same client-
// rendered contract as /tools above.
{
  const f = path.join(__dirname, '..', 'src', 'components', 'OrganizationsPage.js');
  staticLastmod.organizations = fs.existsSync(f) ? lastmodFor('static:organizations', sha(fs.readFileSync(f, 'utf-8'))) : TODAY;
}

// Tools: hash the serialized tools.js entry (title/description/guide/faq/seo
// fields — everything that feeds the prerendered page body and meta).
const toolLastmod = {};
for (const id of indexableToolIds) {
  toolLastmod[id] = lastmodFor(`tool:${id}`, sha(JSON.stringify(toolObjects[id])));
}

// Tool category pages (/tools/{slug}, 2026-09-22) — same content-hash
// pattern as everything above, one entry per src/data/categoryMeta.js
// category rather than a hub-style separate state file (generate-guides-
// sitemap.js's 18 hubs get their own src/data/guides-lastmod.json; 14
// near-identical generated pages fit fine in this file's own existing
// lastmodState instead of adding a second state file for a page count this
// close to the tool/static entries already tracked here).
//
// Hashed from source, same reasoning as the guides-hub hash: the rendered
// build/tools/{slug}/index.html only exists after a full build, and this
// runs in `prebuild`, before build/ exists at all. What actually determines
// a category page's content is (a) that category's own name/desc/example in
// categoryMeta.js, (b) the SET of tools currently in it (a tool gaining or
// losing that category changes the page even though categoryMeta.js itself
// didn't change), and (c) the generator script's own template — hashing all
// three means a template edit legitimately bumps all 14, same tradeoff
// generate-guides-sitemap.js already accepts for its 18 hubs.
const categoryMetaPath = path.join(__dirname, '..', 'src', 'data', 'categoryMeta.js');
const categoryMetaContent = fs.readFileSync(categoryMetaPath, 'utf-8');
const categoryObjects = (() => {
  const body = categoryMetaContent.replace(/\bexport\s+const\b/g, 'const');
  // eslint-disable-next-line no-new-func
  return new Function(`${body}\n;return typeof CATEGORY_META !== 'undefined' ? CATEGORY_META : [];`)();
})();
const categoryPagesGeneratorHash = (() => {
  try { return sha(fs.readFileSync(path.join(__dirname, 'build-tools-category-pages.js'), 'utf-8')); }
  catch { return ''; }
})();
const categoryLastmod = {};
for (const cat of categoryObjects) {
  if (!cat.slug) continue;
  const toolIdsInCat = Object.values(toolObjects)
    .filter(t => categoriesFor(t).includes(cat.name))
    .map(t => t.id)
    .sort();
  const hash = sha([cat.slug, cat.name, cat.desc || '', cat.example || '', categoryPagesGeneratorHash, ...toolIdsInCat].join('|'));
  categoryLastmod[cat.slug] = lastmodFor(`category:${cat.slug}`, hash);
}

// Homepage: its crawlable content is the featured/keep-list links, the tool
// index, and the blocks prerender.js writes into #root.
//
// Hash the MEANING of the keep-lists, not their bytes. Reading the raw files
// was wrong in both directions: editing a comment in tools-keep-list.json's
// _meta bumped the homepage date though nothing crawlable moved (hit
// 2026-08-08), while adding the 18 category-hub links to the homepage did NOT
// bump it, because that lives in prerender.js and was never an input. A date
// that moves on prose and sits still on real change is worse than no date.
const readJson = (f) => { try { return JSON.parse(fs.readFileSync(f, 'utf-8')); } catch { return {}; } };
const toolsKeep = readJson(keepListPath);
const guidesKeep = readJson(path.join(__dirname, '..', 'guides', 'keep-list.json')).keep || {};
const keepSignature = JSON.stringify({
  focus: [...(toolsKeep.focus || [])].sort(),
  keepers: [...(toolsKeep.keepers || [])].sort(),
  guides: Object.entries(guidesKeep).map(([c, sl]) => [c, [...sl].sort()]).sort(),
});
// The homepage template itself — getFeaturedToolsHTML / getHomepageGuidesHTML /
// getHubsHTML all live here, so a change to any of them is a real change to the
// page Google fetches.
const prerenderHash = (() => {
  try { return sha(fs.readFileSync(path.join(__dirname, 'prerender.js'), 'utf-8')); } catch { return ''; }
})();
const homepageLastmod = lastmodFor('homepage',
  sha(keepSignature + prerenderHash + indexableToolIds.map(id => lastmodState[`tool:${id}`].hash).join('')));

if (CHECK) {
  if (bumped.length === 0) {
    console.log(`✅ sitemap-state: committed lastmod state matches content (${Object.keys(lastmodState).length} URLs).`);
    process.exit(0);
  }
  console.error(`\n❌ sitemap-state: ${bumped.length} URL(s) have content that no longer matches the committed lastmod state:\n`);
  for (const k of bumped.slice(0, 12)) console.error(`     ${k}`);
  if (bumped.length > 12) console.error(`     … and ${bumped.length - 12} more`);
  console.error(`\n   Those dates would be stamped with the deploy date on every Railway build`);
  console.error(`   until the state is committed, which teaches Google to ignore lastmod.\n`);
  console.error(`   Fix:  node scripts/generate-sitemap.js`);
  console.error(`         git add public/sitemap-app.xml src/data/sitemap-lastmod.json\n`);
  process.exit(1);
}

fs.writeFileSync(STATE_PATH, JSON.stringify(lastmodState, null, 1) + '\n');
console.log(`lastmod: ${bumped.length} URL(s) bumped to ${TODAY}; others keep their prior dates`);

// ── Static pages (not tools, not guides — top-level standalone HTML) ──
// Extensible: append new entries as they ship (terms, contact, about, etc.)
const STATIC_PAGES = [
  { loc: `${SITE_URL}/privacy`, changefreq: 'monthly', priority: '0.3', lastmod: staticLastmod.privacy },
  { loc: `${SITE_URL}/about`,   changefreq: 'monthly', priority: '0.5', lastmod: staticLastmod.about },
  { loc: `${SITE_URL}/terms`,   changefreq: 'monthly', priority: '0.3', lastmod: staticLastmod.terms },
  { loc: `${SITE_URL}/tools`,   changefreq: 'weekly',  priority: '0.6', lastmod: staticLastmod.tools },
  { loc: `${SITE_URL}/organizations`, changefreq: 'monthly', priority: '0.5', lastmod: staticLastmod.organizations },
  // Future: { loc: `${SITE_URL}/contact`, changefreq: 'monthly', priority: '0.3' },
];

// Tool category pages (/tools/{slug}) — same priority tier as the guide hubs
// in generate-guides-sitemap.js (0.9): real editorial destination pages, not
// just utility routes like /privacy or /terms.
const CATEGORY_PAGES = categoryObjects
  .filter(cat => cat.slug && categoryLastmod[cat.slug])
  .map(cat => ({ loc: `${SITE_URL}/tools/${cat.slug}`, changefreq: 'weekly', priority: '0.9', lastmod: categoryLastmod[cat.slug] }));

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
  // Tool category pages
  ...CATEGORY_PAGES,
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
console.log(`Total URLs: ${urls.length} (1 homepage + ${STATIC_PAGES.length} static + ${CATEGORY_PAGES.length} categories + ${indexableToolIds.length} tools)`);

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
