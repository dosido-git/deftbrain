// scripts/lib/guideShelves.js
//
// Which guides a TOOL category shows (2026-10-05): each tool category page —
// the static /tools/{slug} pages and the /tools page filtered to a category —
// lists its tools, then a few related guides, so one subject has one place.
//
// Guides keep their own 18 folders and URLs (moving them would mean 500+
// redirects); this only decides where they are SHOWN. A guide belongs to a
// tool category two ways:
//   - its folder maps there (FOLDER_TO_CATEGORY), and/or
//   - the tool its call-to-action points at (spec.cta.toolId) is in it.
// Both is the strongest match, the tool link alone next, the folder alone
// last; then guides with their own page (guides/keep-list.json) before the
// consolidated ones, then A–Z. The tool link is what gives Relationships and
// Self & Reflection guides although no folder maps to them.
//
// Consumed by scripts/build-search-assets.js (public/search/guide-shelves.json,
// which src/components/AllToolsPage.js fetches) and
// scripts/build-tools-category-pages.js.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');

const FOLDER_TO_CATEGORY = {
  money: 'Money',
  decisions: 'Decisions',
  planning: 'Decisions',
  home: 'Home & Daily Life',
  practical: 'Home & Daily Life',
  cooking: 'Home & Daily Life',
  pets: 'Home & Daily Life',
  travel: 'Travel & Events',
  health: 'Health & Wellness',
  wellness: 'Health & Wellness',
  conversations: 'Conversations',
  apologies: 'Conversations',
  speeches: 'Conversations',
  career: 'Career',
  workplace: 'Work & Meetings',
  meetings: 'Work & Meetings',
  presentations: 'Work & Meetings',
  learning: 'Learning',
};


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

// Same rule as build-guides-indexes.js hrefFor(): a consolidated guide lives
// as an anchored section on its folder's hub, never at a URL that 301s.
function hrefFor(spec, keepSet) {
  return keepSet.has(`${spec.category}/${spec.slug}`)
    ? `/guides/${spec.category}/${spec.slug}`
    : `/guides/${spec.category}#${spec.slug}`;
}

/**
 * { [toolCategoryName]: { guides: [{title, href}] } }, every matching guide in
 * order; the pages show the first few and put the rest behind a disclosure.
 */
function buildGuideShelves(tools, categoriesFor) {
  const keepSet = loadKeepSet();
  // A guide filed in two folders counts once: its copy with its own page first.
  const isKept = spec => keepSet.has(`${spec.category}/${spec.slug}`);
  const specs = loadSpecs().sort((a, b) => isKept(b) - isKept(a));
  const toolCats = new Map(tools.map(tool => [tool.id, categoriesFor(tool)]));
  const names = new Set([...tools.flatMap(categoriesFor), ...Object.values(FOLDER_TO_CATEGORY)]);
  const strip = s => String(s).replace(/^(The|A|An)\s+/i, '');

  const shelves = {};
  for (const name of names) {
    const seen = new Set();
    const ranked = [];
    for (const spec of specs) {
      if (seen.has(spec.slug)) continue; // same guide filed in two folders
      const inFolder = FOLDER_TO_CATEGORY[spec.category] === name;
      const viaTool = (toolCats.get(spec.cta && spec.cta.toolId) || []).includes(name);
      if (!inFolder && !viaTool) continue;
      seen.add(spec.slug);
      const kept = keepSet.has(`${spec.category}/${spec.slug}`);
      ranked.push({ spec, rank: inFolder && viaTool ? 0 : viaTool ? 1 : 2, kept });
    }
    ranked.sort((a, b) => a.rank - b.rank || (b.kept - a.kept) || strip(a.spec.title).localeCompare(strip(b.spec.title)));
    if (!ranked.length) continue;
    shelves[name] = {
      guides: ranked.map(({ spec }) => ({ title: spec.title, href: hrefFor(spec, keepSet) })),
    };
  }
  return shelves;
}

module.exports = { buildGuideShelves, FOLDER_TO_CATEGORY };
