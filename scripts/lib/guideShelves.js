// scripts/lib/guideShelves.js
//
// Which guides a TOOL category shows (2026-10-05): each tool category page —
// the static /tools/{slug} pages and the /tools page filtered to a category —
// lists its tools, then a few related guides, so one subject has one place.
//
// Guides keep their own 18 folders and URLs (moving them would mean 500+
// redirects); this only decides where they are SHOWN: each guide's main and
// optional second category, from src/data/guide-categories.json.
//
// Consumed by scripts/build-search-assets.js (public/search/guide-shelves.json,
// which src/components/AllToolsPage.js fetches) and
// scripts/build-tools-category-pages.js.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');

const { categoriesForGuide } = require('./guideCategories');


function loadSpecs() {
  const dir = path.join(ROOT, 'guides');
  const specs = [];
  for (const cat of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!cat.isDirectory()) continue;
    for (const file of fs.readdirSync(path.join(dir, cat.name)).filter(f => f.endsWith('.js'))) {
      const filepath = path.join(dir, cat.name, file);
      delete require.cache[require.resolve(filepath)];
      try {
        const spec = require(filepath);
        if (spec.slug && spec.category && spec.title) specs.push(spec);
      } catch { /* build-guides.js reports a broken spec; skip it here */ }
    }
  }
  return specs;
}

function loadKeepSet() {
  const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'guides', 'keep-list.json'), 'utf8'));
  const set = new Set();
  for (const [cat, slugs] of Object.entries(data.keep)) slugs.forEach(slug => set.add(`${cat}/${slug}`));
  return set;
}

// Every guide links to its own page. Non-keep-list guides are live but
// noindexed (the old 301 to a hub summary was retired 2026-07-31), so a
// link labelled as a guide must land on the guide, not the hub.
function hrefFor(spec) {
  return `/guides/${spec.category}/${spec.slug}`;
}

/**
 * { [toolCategoryName]: { guides: [{title, href}] } }, every guide in that
 * category (src/data/guide-categories.json, via guideCategories.js): guides
 * whose MAIN category it is first, then those filed there second; within
 * each, guides with their own page (keep-list) first, then A–Z. Since
 * 2026-10-24 — it used to match on the folder or ANY category of the linked
 * tool, which put a tipping guide under Conversations.
 */
function buildGuideShelves() {
  const keepSet = loadKeepSet();
  const isKept = spec => keepSet.has(`${spec.category}/${spec.slug}`);
  const strip = s => String(s).replace(/^(The|A|An)\s+/i, '');
  const shelves = {};
  const seen = new Set();
  for (const spec of loadSpecs().sort((a, b) => isKept(b) - isKept(a))) {
    if (seen.has(spec.slug)) continue; // same guide filed in two folders
    seen.add(spec.slug);
    categoriesForGuide(spec).forEach((name, rank) => {
      (shelves[name] = shelves[name] || []).push({ spec, rank, kept: isKept(spec) });
    });
  }
  return Object.fromEntries(Object.entries(shelves).map(([name, list]) => {
    list.sort((a, b) => a.rank - b.rank || (b.kept - a.kept) || strip(a.spec.title).localeCompare(strip(b.spec.title)));
    return [name, { guides: list.map(({ spec }) => ({ title: spec.title, href: hrefFor(spec) })) }];
  }));
}

module.exports = { buildGuideShelves };
