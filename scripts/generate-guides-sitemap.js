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
const crypto = require('crypto');

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

// ── Honest hub lastmod (2026-08-08) ──
// This used to stamp `new Date()` on all 18 hubs every build. With ~daily
// deploys that meant every hub claimed to have changed that day, every day,
// since they shipped — while the 108 article URLs alongside them carried real
// article:modified_time dates. Google uses lastmod only while it is
// "consistently and verifiably accurate"; a sitemap that cries wolf on 11% of
// its URLs is how a site gets its lastmod discounted altogether.
//
// Same fix as sitemap-app.xml (e2a3c575): content-hash each hub into a
// COMMITTED state file, and only advance its date when the hash moves.
//
// Hashed from SOURCE, not from the rendered page. The rendered HTML would be
// more precise, but it only exists after a full build, and a pre-push gate
// cannot afford one. The three source inputs that determine a hub are:
//   · the category's guide specs (guides/<cat>/*.js) — the cards it lists
//   · guides/keep-list.json — which of them are advertised
//   · build-guides-indexes.js — CATEGORY_META and the hub template itself
// Hashing the generator means any template edit bumps all 18. That is honest
// (it does change all 18 pages) and rare, and it errs toward over-reporting a
// real change rather than inventing a daily one.
const STATE_PATH = path.join(ROOT, 'src', 'data', 'guides-lastmod.json');
const TODAY = new Date().toISOString().split('T')[0];
const sha = (str) => crypto.createHash('sha1').update(str).digest('hex');

let hubState = {};
try { hubState = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8')); } catch { /* first run */ }

function hubContentHash(cat, generatorHash, keepData) {
  const specDir = path.join(ROOT, 'guides', cat);
  let specs = [];
  if (fs.existsSync(specDir)) {
    specs = fs.readdirSync(specDir).filter(f => f.endsWith('.js')).sort()
      .map(f => `${f}:${sha(fs.readFileSync(path.join(specDir, f), 'utf8'))}`);
  }
  const keep = (keepData.keep && keepData.keep[cat] ? [...keepData.keep[cat]].sort() : []).join(',');
  return sha([cat, generatorHash, keep, ...specs].join('|'));
}

// Returns the committed date when the hash is unchanged, otherwise today's.
function hubLastmod(cat, hash) {
  const prev = hubState[cat];
  if (prev && prev.hash === hash) return prev.lastmod;
  hubState[cat] = { hash, lastmod: TODAY };
  return TODAY;
}

function hubHashes() {
  const generatorHash = sha(fs.readFileSync(path.join(__dirname, 'build-guides-indexes.js'), 'utf8'));
  const keepData = JSON.parse(fs.readFileSync(path.join(ROOT, 'guides', 'keep-list.json'), 'utf8'));
  return Object.fromEntries(CATEGORIES.map(cat => [cat, hubContentHash(cat, generatorHash, keepData)]));
}

function buildHubEntries() {
  const hashes = hubHashes();
  return CATEGORIES.map(cat => ({
    loc:        `${BASE_URL}/guides/${cat}`,
    lastmod:    hubLastmod(cat, hashes[cat]),
    changefreq: 'weekly',
    priority:   '0.9',
  }));
}

// --check recomputes every hub hash and reports whether the COMMITTED state
// still describes the committed content. Reads only source, so it runs in the
// pre-push hook without a build. A stale state means the next Railway deploy
// re-stamps those hubs with the deploy date — the exact "everything changed
// today, daily" pattern this replaced.
function runCheck() {
  const hashes = hubHashes();
  const bumped = CATEGORIES.filter(cat => !hubState[cat] || hubState[cat].hash !== hashes[cat]);
  if (bumped.length === 0) {
    console.log(`✅ guides-sitemap-state: committed lastmod state matches content (${CATEGORIES.length} hubs).`);
    return 0;
  }
  console.error(`\n❌ guides-sitemap-state: ${bumped.length} hub(s) have content that no longer matches the committed lastmod state:\n`);
  bumped.forEach(cat => console.error(`   /guides/${cat}`));
  console.error(`\n   Every deploy will re-stamp these with the deploy date until the state is`);
  console.error(`   committed, which teaches Google to ignore lastmod site-wide.\n`);
  console.error(`   Fix: npm run build   (or: node scripts/generate-guides-sitemap.js --write-state)`);
  console.error(`        git add src/data/guides-lastmod.json\n`);
  return 1;
}

function writeState() {
  fs.writeFileSync(STATE_PATH, JSON.stringify(hubState, null, 1) + '\n');
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
  // --check and --write-state read SOURCE only, so they run before the guard
  // below that requires a completed build.
  if (process.argv.includes('--check')) process.exit(runCheck());
  if (process.argv.includes('--write-state')) {
    buildHubEntries();
    writeState();
    console.log(`✓ Wrote hub lastmod state for ${CATEGORIES.length} hubs to ${path.relative(process.cwd(), STATE_PATH)}`);
    return;
  }

  // Fail fast if build-guides-indexes.js didn't run. Without this, walk()
  // returns [] silently and we ship a stub sitemap with only hub entries.
  if (!fs.existsSync(GUIDES_DIR)) {
    throw new Error(
      `generate-guides-sitemap: ${GUIDES_DIR} does not exist.\n` +
      `  build-guides-indexes.js must run before this script in the postbuild chain.\n` +
      `  Check: package.json postbuild order.`
    );
  }

  const files = walk(GUIDES_DIR);
  const articleEntries = [];
  const problems = [];

  // SEO footprint prune (2026-07): only keep-list guides are advertised in the
  // sitemap. Consolidated guides 301 to their category hub, and a sitemap must
  // never list redirecting URLs. See guides/keep-list.json.
  const keepData = JSON.parse(fs.readFileSync(path.join(ROOT, 'guides', 'keep-list.json'), 'utf8'));
  const keepSet = new Set();
  for (const [cat, slugs] of Object.entries(keepData.keep)) {
    slugs.forEach(slug => keepSet.add(`${cat}/${slug}`));
  }
  let consolidated = 0;

  for (const file of files) {
    const html = fs.readFileSync(file, 'utf8');
    const { loc, lastmod } = extractMeta(html);
    const rel = path.relative(GUIDES_DIR, file);

    if (!loc) { problems.push(`${rel}: missing <link rel="canonical">`); continue; }
    if (!lastmod) { problems.push(`${rel}: missing article:modified_time`); continue; }

    // A twin page whose canonical points at another URL (canonicalOverride)
    // must not appear in the sitemap — only self-canonical pages are listed.
    const selfUrl = `https://deftbrain.com/guides/${rel.replace(/\.html$/, '')}`;
    if (loc !== selfUrl) { consolidated++; continue; }

    const m = loc.match(/\/guides\/([a-z-]+)\/([a-z0-9-]+)$/);
    if (m && !keepSet.has(`${m[1]}/${m[2]}`)) { consolidated++; continue; }

    articleEntries.push({
      loc,
      lastmod,
      changefreq: 'monthly',
      priority:   '0.8',
    });
  }

  console.log(`  · ${consolidated} consolidated guide(s) excluded from the sitemap (301 → category hubs)`);
  const hubEntries = buildHubEntries();

  // Guard: if no articles were collected, build-guides-indexes.js either
  // didn't run or produced nothing. A sitemap with only hub pages looks
  // valid but advertises no spec pages — worse than a loud failure.
  if (articleEntries.length === 0) {
    throw new Error(
      `generate-guides-sitemap: walked ${GUIDES_DIR} but found 0 article pages.\n` +
      `  build-guides-indexes.js may not have run, or produced no output.\n` +
      `  problems: ${problems.length ? problems.map(p => `\n    ${p}`).join('') : 'none'}`
    );
  }

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
  // Persist any hub whose hash moved, so the next build reuses the date rather
  // than inventing a new one. Must be committed alongside the content change.
  writeState();

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
