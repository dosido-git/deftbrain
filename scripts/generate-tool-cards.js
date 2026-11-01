#!/usr/bin/env node
// scripts/generate-tool-cards.js — every tool's link-preview card, drawn
// with the shared template in backend/lib/shareCard.js (the same one
// shared-result cards use). The headline is the moment the tool is for
// (primer.when), or a tool's own `ogCard.headline` where one is set — a line
// a person would say, not the product's slogan.
//
// Writes public/og/<slug>.png (slug from src/data/tool-og-slugs.json).
// generate-og.py now draws only default.png. After redrawing, bump ?v= in
// scripts/prerender.js and src/hooks/useDocumentHead.js so platforms refetch.
//
//   node scripts/generate-tool-cards.js              every tool
//   node scripts/generate-tool-cards.js WhereDidTheTimeGo

const fs = require('fs');
const path = require('path');
const { renderCard, canDraw } = require('../backend/lib/shareCard');

const ROOT = path.join(__dirname, '..');

// Same Node-version-independent load as build-search-assets.js.
function loadTools() {
  const src = fs.readFileSync(path.join(ROOT, 'src/data/tools.js'), 'utf8')
    .replace(/^export\s+(const|function)\b/gm, '$1');
  // eslint-disable-next-line no-new-func
  return new Function(`${src}\n;return tools;`)();
}

async function main() {
  const only = process.argv[2];
  const slugs = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/tool-og-slugs.json'), 'utf8'));
  const tools = loadTools().filter(t => !only || t.id === only);
  if (!tools.length) { console.log(`No tool ${only}.`); return; }
  for (const t of tools) {
    const slug = slugs[t.id];
    if (!slug) { console.warn(`  ⚠ ${t.id}: no slug in tool-og-slugs.json, skipped`); continue; }
    const card = {
      kicker: t.title,
      headline: t.ogCard?.headline || t.primer?.when || t.tagline,
      sub: t.ogCard?.sub || t.tagline,
    };
    if (!card.headline || !canDraw(card.kicker, card.headline, card.sub)) {
      console.warn(`  ⚠ ${t.id}: text the card fonts can't draw, kept the old card`);
      continue;
    }
    const png = await renderCard(card);
    fs.writeFileSync(path.join(ROOT, 'public', 'og', `${slug}.png`), png);
    console.log(`  ✓ public/og/${slug}.png`);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
