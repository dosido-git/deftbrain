#!/usr/bin/env node
// ============================================================
// scripts/build-search-assets.js
// ============================================================
// Builds what the static guide pages need to search tools AND guides, and
// what the home page needs to fall back to guides when no tool matches:
//
//   public/search/tools.json      every tool, with the text it's searched on
//   public/search/guides.json     every guide, likewise, plus where it lives
//   public/search/deft-search.js  the browser search: src/utils/searchCore.js
//                                 (the same matcher the React app uses) +
//                                 scripts/search-widget.js
//
// Generated, not committed (public/search/ is gitignored): runs in prebuild
// and predev:frontend, so the files always match the current catalog.
//
// Tools are searched on exactly the fields toolSearch.js uses — this script
// reads toolSearchFields() out of that file rather than restating it.
//
// Loads the ESM source files the same Node-version-independent way
// prerender.js loads tools.js (strip `export`, evaluate): Railway builds on
// Node 18/20, which can't import() these files.
// ============================================================

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'public', 'search');
const SPECS_DIR = path.join(ROOT, 'guides');

function evalModule(file, names, stripImports) {
  let src = fs.readFileSync(path.join(ROOT, file), 'utf8');
  if (stripImports) src = src.replace(/^import .*$/gm, '');
  src = src.replace(/^export\s+(const|function)\b/gm, '$1');
  // eslint-disable-next-line no-new-func
  return new Function(`${src}\n;return { ${names.join(', ')} };`)();
}

function loadSpecs() {
  const specs = [];
  for (const cat of fs.readdirSync(SPECS_DIR, { withFileTypes: true })) {
    if (!cat.isDirectory()) continue;
    for (const file of fs.readdirSync(path.join(SPECS_DIR, cat.name)).filter(f => f.endsWith('.js'))) {
      try {
        const spec = require(path.join(SPECS_DIR, cat.name, file));
        if (spec.slug && spec.category && spec.title) specs.push(spec);
      } catch (err) {
        console.warn(`  ⚠ search: skipping guides/${cat.name}/${file} — ${err.message}`);
      }
    }
  }
  return specs;
}

// Same rule as build-guides-indexes.js hrefFor(): kept guides have their own
// page; consolidated ones live as an anchored section on their category hub.
function loadKeepSet() {
  const data = JSON.parse(fs.readFileSync(path.join(SPECS_DIR, 'keep-list.json'), 'utf8'));
  const set = new Set();
  for (const [cat, slugs] of Object.entries(data.keep)) slugs.forEach(s => set.add(`${cat}/${s}`));
  return set;
}

function main() {
  const { tools } = evalModule('src/data/tools.js', ['tools']);
  const { toolFinderMetadata } = evalModule('src/data/toolFinderMetadata.js', ['toolFinderMetadata']);
  const { toolSearchFields } = evalModule('src/utils/toolSearch.js', ['toolSearchFields'], true);

  const seen = new Set();
  const toolRows = tools
    .filter(t => t && t.id && t.title && !seen.has(t.id) && seen.add(t.id))
    .map(t => ({
      id: t.id,
      title: t.title,
      tagline: t.tagline || t.description || '',
      icon: t.icon || '',
      tags: t.tags || [],
      f: toolSearchFields(t, t.categories || [], toolFinderMetadata[t.id]),
    }));

  const keep = loadKeepSet();
  const toolNames = Object.fromEntries(toolRows.map(t => [t.id, t.title]));
  const hrefOf = g => keep.has(`${g.category}/${g.slug}`) ? `/guides/${g.category}/${g.slug}` : `/guides/${g.category}#${g.slug}`;

  // A guide can live in two categories on purpose (~29 slugs, e.g. meetings/
  // and workplace/ — owner call 2026-09-26). Search lists it ONCE: the copy
  // with its own indexed page (keep-list) wins, else the first category
  // alphabetically. `alt` keeps the other copies' links so the /guides
  // library can still find it under either category filter, and the category
  // field carries both names so either one matches.
  const bySlug = new Map();
  for (const g of loadSpecs()) {
    if (!bySlug.has(g.slug)) bySlug.set(g.slug, []);
    bySlug.get(g.slug).push(g);
  }
  const guideRows = [...bySlug.values()]
    .map(copies => copies.sort((a, b) =>
      keep.has(`${b.category}/${b.slug}`) - keep.has(`${a.category}/${a.slug}`) || a.category.localeCompare(b.category)))
    .map(([g, ...others]) => ({
      title: g.title,
      href: hrefOf(g),
      alt: others.map(hrefOf),
      category: g.categoryLabel || g.category,
      f: {
        title: g.title,
        description: g.deck || g.description || '',
        steps: (g.steps || []).map(s => s.name).join(' | '),
        category: [g, ...others].map(c => c.categoryLabel || c.category).join(' | '),
        tool: g.cta ? [g.cta.toolName || toolNames[g.cta.toolId], g.cta.headline].filter(Boolean).join(' | ') : '',
      },
    }))
    .sort((a, b) => a.title.localeCompare(b.title));

  const core = fs.readFileSync(path.join(ROOT, 'src/utils/searchCore.js'), 'utf8');
  if (/^import /m.test(core)) throw new Error('searchCore.js must not import anything — the browser copy has no bundler');
  const widget = fs.readFileSync(path.join(__dirname, 'search-widget.js'), 'utf8');
  const browserJs = `/* Generated by scripts/build-search-assets.js — do not edit. */\n(function () {\n'use strict';\n${
    core.replace(/^export\s+(const|function)\b/gm, '$1')}\n${widget}\n})();\n`;

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'tools.json'), JSON.stringify(toolRows));
  fs.writeFileSync(path.join(OUT_DIR, 'guides.json'), JSON.stringify(guideRows));
  fs.writeFileSync(path.join(OUT_DIR, 'deft-search.js'), browserJs);
  console.log(`🔎  Search assets: ${toolRows.length} tools, ${guideRows.length} guides (one entry per guide, cross-listed ones once) → public/search/`);
}

try {
  main();
} catch (err) {
  console.error(`✗ build-search-assets: ${err.message}`);
  process.exit(1);
}
