#!/usr/bin/env node
// scripts/generate-tool-cards.js — link-preview cards for tools that have an
// `ogCard` in src/data/tools.js, drawn with the shared template in
// backend/lib/shareCard.js (the same one shared-result cards use).
//
// Writes public/og/<slug>.png (slug from src/data/tool-og-slugs.json), over
// the older dark card that generate-og.py drew; generate-og.py skips tools
// with an ogCard so the two never fight.
//
//   node scripts/generate-tool-cards.js              every tool with an ogCard
//   node scripts/generate-tool-cards.js WhereDidTheTimeGo

const fs = require('fs');
const path = require('path');
const { renderCard } = require('../backend/lib/shareCard');

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
  const tools = loadTools().filter(t => t.ogCard && (!only || t.id === only));
  if (!tools.length) { console.log('No tools with an ogCard' + (only ? ` matching ${only}` : '') + '.'); return; }
  for (const t of tools) {
    const slug = slugs[t.id];
    if (!slug) { console.warn(`  ⚠ ${t.id}: no slug in tool-og-slugs.json, skipped`); continue; }
    const png = await renderCard({
      kicker: t.title,
      headline: t.ogCard.headline,
      sub: t.ogCard.sub,
      foot: 'Free on DeftBrain · no sign-up',
    });
    fs.writeFileSync(path.join(ROOT, 'public', 'og', `${slug}.png`), png);
    console.log(`  ✓ public/og/${slug}.png`);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
