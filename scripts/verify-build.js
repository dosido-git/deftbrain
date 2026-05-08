#!/usr/bin/env node
/**
 * verify-build.js — final postbuild guard
 *
 * Asserts that critical build artifacts exist on disk. If any are missing,
 * exits nonzero so Railway fails the deploy rather than shipping a broken
 * sitemap or 404'd guides.
 *
 * Runs LAST in the postbuild chain. If you remove this script, you have
 * no defense against a future refactor silently dropping prerender.js or
 * build-guides-indexes.js (which is exactly how /guides/* broke for months
 * in early 2026).
 *
 * Coverage:
 *   - Guide hub pages (index, by-tool)
 *   - Per-category index pages (one per directory under guides/)
 *   - Per-spec guide pages (one HTML per .js spec)
 *   - Sitemaps (root, guides, index)
 *   - Tool prerender (one HTML per top-level entry in tools.js)
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BUILD = path.join(ROOT, 'build');
const GUIDES_SRC = path.join(ROOT, 'guides');
const TOOLS_JS = path.join(ROOT, 'src', 'data', 'tools.js');

const failures = [];

function check(relPath, label) {
  const full = path.join(BUILD, relPath);
  if (!fs.existsSync(full)) {
    failures.push(`MISSING: ${relPath}${label ? `  (${label})` : ''}`);
  }
}

// --- 1. Guide hub pages -----------------------------------------------------
check('guides/index.html', 'guides hub');

// --- 2. Categories (discovered from source dir) -----------------------------
let categories = [];
if (fs.existsSync(GUIDES_SRC)) {
  categories = fs.readdirSync(GUIDES_SRC, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);
}
if (categories.length === 0) {
  failures.push('FATAL: no categories discovered in guides/ source dir');
}

// --- 3. Per-category index pages --------------------------------------------
for (const cat of categories) {
  check(`guides/${cat}/index.html`, `${cat} index`);
}

// --- 4. Per-spec guide pages ------------------------------------------------
let specCount = 0;
for (const cat of categories) {
  const specs = fs.readdirSync(path.join(GUIDES_SRC, cat))
    .filter(f => f.endsWith('.js'));
  for (const spec of specs) {
    const slug = spec.replace(/\.js$/, '');
    check(`guides/${cat}/${slug}.html`, `${cat}/${slug}`);
    specCount++;
  }
}

// --- 5. Sitemaps ------------------------------------------------------------
check('sitemap.xml', 'sitemap index');
check('guides-sitemap.xml', 'guides sitemap');
check('sitemap-app.xml', 'app sitemap');

// --- 6. Tool prerender ------------------------------------------------------
// Match top-level tool entries only. Cross-ref entries like
// `{ id: 'ChaosPilot', reason: '...' }` have additional fields on the same
// line and are filtered out by the end-of-line anchor.
let toolCount = 0;
if (fs.existsSync(TOOLS_JS)) {
  const src = fs.readFileSync(TOOLS_JS, 'utf8');
  const ids = [...src.matchAll(/^\s*id:\s*['"]([A-Za-z][A-Za-z0-9]*)['"]\s*,?\s*$/gm)]
    .map(m => m[1]);
  const unique = [...new Set(ids)];
  for (const id of unique) {
    check(`${id}.html`, `prerender ${id}`);
    toolCount++;
  }
} else {
  failures.push(`WARN: ${TOOLS_JS} not found — skipping prerender check`);
}

// --- Report -----------------------------------------------------------------
if (failures.length > 0) {
  console.error('\n❌ verify-build FAILED — postbuild chain produced incomplete artifacts:\n');
  for (const f of failures) console.error(`  ${f}`);
  console.error(`\n${failures.length} missing file(s). Refusing to ship.\n`);
  process.exit(1);
}

console.log(
  `✅ verify-build OK — ${categories.length} categories, ${specCount} guide specs, ${toolCount} tools.`
);
