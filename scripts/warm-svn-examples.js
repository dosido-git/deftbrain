#!/usr/bin/env node
/**
 * Store the source search for Signal vs. Noise's five examples in
 * backend/data/grounded-seed.json, pinned so they never expire.
 *
 * WHY: a new topic waits ~60-100s on its web search before anything shows.
 * The examples are evergreen and the first thing many visitors run, so their
 * searches ship inside the image and an example answer starts at once. The
 * translated examples all use these entries (exampleId, lib/claimResearch.js).
 * The "Researched <date>" line on the result shows when this was run.
 *
 * USAGE   node scripts/warm-svn-examples.js        # all five
 *         node scripts/warm-svn-examples.js 2 4    # just these
 * Needs ANTHROPIC_API_KEY. Costs about $0.36 per example (one search pass).
 */
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });

const { claimResearch, researchKey } = require('../backend/lib/claimResearch');

const SEED_PATH = path.join(__dirname, '..', 'backend', 'data', 'grounded-seed.json');
const EN = require('../src/i18n/locales/generated/en.json'); // npm run build:locales first

(async () => {
  if (!process.env.ANTHROPIC_API_KEY) { console.error('ANTHROPIC_API_KEY is not set.'); process.exit(1); }
  const ids = process.argv.slice(2).map(Number).filter(Boolean);
  const which = ids.length ? ids : [1, 2, 3, 4, 5];
  const seed = JSON.parse(fs.readFileSync(SEED_PATH, 'utf8'));

  const results = await Promise.all(which.map(async n => {
    const topic = EN[`svn_ex${n}_topic`];
    const conflictingAdvice = EN[`svn_ex${n}_conflict`];
    if (!topic) return console.log(`  ✗ example ${n}: no svn_ex${n}_topic in en.json`);
    const { block, packet } = await claimResearch({ topic, conflictingAdvice, exampleId: n, coldWaitMs: 180_000 });
    if (!packet) return console.log(`  ✗ example ${n} (${topic}): search failed — run again`);
    seed[researchKey({ exampleId: n })] = { block, data: packet, pinned: true, savedAt: new Date().toISOString(), topic };
    console.log(`  ✓ example ${n} (${topic}): ${packet.sources.length} sources, ${packet.claims.length} claims`);
    return true;
  }));

  const sorted = Object.fromEntries(Object.keys(seed).sort().map(k => [k, seed[k]]));
  fs.writeFileSync(SEED_PATH, JSON.stringify(sorted, null, 2) + '\n');
  console.log(`\n${results.filter(Boolean).length}/${which.length} stored. Commit ${path.relative(process.cwd(), SEED_PATH)} so it ships.`);
  process.exit(0);
})();
