#!/usr/bin/env node
/**
 * Generate / refresh backend/data/grounded-seed.json — the committed warm start
 * for Date Night's real-venue grounding.
 *
 * WHY THIS EXISTS
 * The grounding cache is in-memory, so it empties on every deploy, and the
 * web search behind it takes ~50s while a plan takes ~12s. Measured in
 * production on 2026-08-11, three consecutive requests for the same location
 * returned 0, 0 and then 3 verified venues — i.e. after each deploy a burst of
 * early visitors all got descriptive types instead of real places. Shipping a
 * seed inside the image makes the common locations warm the moment a container
 * boots, at no runtime cost.
 *
 * Entries load already-expired on purpose (see groundedFacts): the seed is
 * served immediately and refreshed once in the background, so it can never go
 * quietly stale.
 *
 * USAGE
 *   node scripts/warm-venue-cache.js                 # refresh the default list
 *   node scripts/warm-venue-cache.js "Lisbon" "Oslo" # add / refresh specific ones
 *   node scripts/warm-venue-cache.js --list          # show what is seeded now
 *
 * Needs ANTHROPIC_API_KEY. Costs one web search per location; existing entries
 * are kept, so re-running only pays for what you ask for.
 */

const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });

const { venueFacts, verifiedNamesFrom } = require('../backend/lib/venues');
const { normalizeKeyPart } = require('../backend/lib/groundedFacts');

const SEED_PATH = path.join(__dirname, '..', 'backend', 'data', 'grounded-seed.json');

// A starter spread rather than a guess at traffic: we have no location
// analytics, deliberately — the metrics sink records response shape, never
// request bodies. So this covers the big metros across the regions our 13
// languages serve. Extend it by passing locations on the command line.
const DEFAULT_LOCATIONS = [
  'Downtown Austin', 'Brooklyn, New York', 'Manhattan, New York',
  'San Francisco', 'Chicago Loop', 'Central London', 'Paris',
  'Berlin Mitte', 'Barcelona', 'Rome', 'Amsterdam', 'Lisbon',
  'Toronto', 'Sydney CBD', 'Tokyo Shibuya', 'Seoul Gangnam',
  'Shanghai French Concession', 'Mumbai', 'Sao Paulo', 'Mexico City',
  'Dubai Marina', 'Bangkok Sukhumvit', 'Ho Chi Minh City District 1',
  'Singapore', 'Moscow',
];

const CONCURRENCY = 4;

function readSeed() {
  try { return JSON.parse(fs.readFileSync(SEED_PATH, 'utf8')); } catch { return {}; }
}

function writeSeed(obj) {
  fs.mkdirSync(path.dirname(SEED_PATH), { recursive: true });
  // Sorted keys so a re-run produces a minimal, reviewable diff instead of a
  // reshuffled file.
  const sorted = Object.fromEntries(Object.keys(obj).sort().map(k => [k, obj[k]]));
  fs.writeFileSync(SEED_PATH, JSON.stringify(sorted, null, 2) + '\n');
}

async function warm(location) {
  const key = `date-venues:${normalizeKeyPart(location)}`;
  // groundedFacts never awaits its own fetch — it returns what it has and
  // refreshes behind the scenes. So the first call kicks the search off and the
  // block arrives on a later one; poll the same call until it lands.
  await venueFacts(location);
  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 3000));
    const block = await venueFacts(location);
    if (block) return { key, block, names: verifiedNamesFrom(block).length };
  }
  return { key, block: '', names: 0 };
}

(async () => {
  const args = process.argv.slice(2);

  if (args.includes('--list')) {
    const seed = readSeed();
    const keys = Object.keys(seed);
    console.log(`${keys.length} location(s) seeded in ${path.relative(process.cwd(), SEED_PATH)}:`);
    for (const k of keys) {
      console.log(`  ${String(verifiedNamesFrom(seed[k].block).length).padStart(3)} venues  ${k.replace('date-venues:', '')}`);
    }
    return;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY is not set — nothing to do.');
    process.exit(1);
  }

  const locations = args.length ? args : DEFAULT_LOCATIONS;
  const seed = readSeed();
  console.log(`Warming ${locations.length} location(s), ${CONCURRENCY} at a time…\n`);

  let ok = 0, failed = 0;
  const queue = [...locations];
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length) {
      const loc = queue.shift();
      try {
        const { key, block, names } = await warm(loc);
        if (block) {
          seed[key] = { block, savedAt: new Date().toISOString(), location: loc };
          ok++;
          console.log(`  ✓ ${String(names).padStart(3)} venues  ${loc}`);
          writeSeed(seed); // write as we go — a crash at location 20 keeps the first 19
        } else {
          failed++;
          console.log(`  ✗   no result  ${loc}`);
        }
      } catch (err) {
        failed++;
        console.log(`  ✗      failed  ${loc} — ${err.message}`);
      }
    }
  }));

  writeSeed(seed);
  console.log(`\n${ok} warmed, ${failed} failed. ${Object.keys(seed).length} total in the seed.`);
  console.log(`Commit ${path.relative(process.cwd(), SEED_PATH)} so it ships in the image.`);
  process.exit(0);
})();
