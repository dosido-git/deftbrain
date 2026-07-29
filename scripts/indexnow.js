#!/usr/bin/env node
// scripts/indexnow.js
//
// Submits CHANGED, INDEXABLE URLs to IndexNow after every production build.
// IndexNow pings Bing and Yandex simultaneously — one submission, two engines.
//
// ── Why "changed" and "indexable" (2026-07-29) ───────────────────────────────
// This script used to submit every id in tools.js on every deploy — all 125,
// including the ~85 that the keep-list deliberately noindexes, whether or not
// anything about them had changed. Two problems: it asked Bing to crawl pages
// we tell Google not to index, and IndexNow's own guidance is to submit
// added/updated/deleted URLs — repeatedly blasting a whole site is the pattern
// that gets a submitter's signal discounted.
//
// Both filters come from state the build already maintains, so there is no new
// source of truth to keep in sync:
//   • WHAT'S INDEXABLE — src/data/sitemap-lastmod.json is keyed ONLY for
//     keep-list tools (generate-sitemap.js writes it from the same
//     tools-keep-list.json that drives the sitemap and prerender's noindex).
//   • WHAT CHANGED — that file stores a content hash per URL and only advances
//     `lastmod` when the hash moves, so `lastmod === today` means "this build
//     genuinely changed this page".
//   • GUIDES — build/guides-sitemap.xml is already keep-list-filtered and
//     carries a per-URL <lastmod>, so the same today-comparison applies.
//
// Nothing changed → nothing submitted (and no ping at all). Set
// INDEXNOW_ALL=1 for a deliberate full resubmit of every indexable URL — the
// right move after a structural change like a keep-list revision, and wrong as
// a habit.
//
// Setup (one-time):
//   1. Copy public/3f1177f637e941e1160f382e43ac87ee.txt to your public/ folder
//   2. Add INDEXNOW_KEY=3f1177f637e941e1160f382e43ac87ee to Railway env vars
//   3. Add "node scripts/indexnow.js" at the END of your postbuild chain
//
// Skips silently in local dev (NODE_ENV !== 'production') so it doesn't
// spam IndexNow on every local build.

'use strict';

const fs   = require('fs');
const path = require('path');
const https = require('https');

// ─── Config ───────────────────────────────────────────────────────────────────

const SITE_URL    = 'https://deftbrain.com';
const KEY         = process.env.INDEXNOW_KEY || '3f1177f637e941e1160f382e43ac87ee';
const KEY_LOC     = `${SITE_URL}/${KEY}.txt`;
const HOST        = 'deftbrain.com';
const ENDPOINT    = 'https://api.indexnow.org/indexnow'; // covers Bing + Yandex
const BATCH_SIZE  = 10000; // IndexNow max per submission

const ROOT      = path.join(__dirname, '..');
const BUILD_DIR = path.join(ROOT, 'build');

// ─── Skip in local dev ────────────────────────────────────────────────────────

if (process.env.NODE_ENV !== 'production' && !process.env.FORCE_INDEXNOW) {
  console.log('IndexNow: skipping in non-production environment.');
  console.log('  Set FORCE_INDEXNOW=1 to run locally.');
  process.exit(0);
}

// ─── Collect URLs ─────────────────────────────────────────────────────────────

const TODAY       = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
const SUBMIT_ALL  = process.env.INDEXNOW_ALL === '1';

// Tool + static URLs, from the sitemap-lastmod state the sitemap build writes.
// Keys are `tool:<Id>` and `static:<page>`, and ONLY for keep-list (indexable)
// pages — so this is both the indexable filter and the change filter.
function getSitemapStateUrls() {
  const statePath = path.join(ROOT, 'src', 'data', 'sitemap-lastmod.json');
  if (!fs.existsSync(statePath)) {
    console.warn('IndexNow: sitemap-lastmod.json not found — tool URLs will be skipped.');
    return { urls: [], considered: 0 };
  }
  let state;
  try {
    state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  } catch (err) {
    console.warn(`IndexNow: sitemap-lastmod.json unreadable (${err.message}) — tool URLs skipped.`);
    return { urls: [], considered: 0 };
  }

  const urls = [];
  let considered = 0;
  for (const [key, entry] of Object.entries(state)) {
    const loc = key.startsWith('tool:')   ? `${SITE_URL}/${key.slice(5)}`
              : key.startsWith('static:') ? `${SITE_URL}/${key.slice(7)}`
              : null;
    if (!loc) continue;              // unknown key shape — never guess a URL
    considered++;
    if (SUBMIT_ALL || entry?.lastmod === TODAY) urls.push(loc);
  }
  return { urls, considered };
}

// Guide URLs from the generated guides-sitemap.xml — already keep-list-filtered
// by generate-guides-sitemap.js, and each <url> carries its own <lastmod>.
// NOTE: category hub pages are stamped with today's date on every build (they
// regenerate each time), so they always qualify. That is correct-ish — their
// content really is rebuilt — but it means hubs get resubmitted on every deploy.
// Acceptable: there are ~18 of them, versus 125 before this change.
function getGuideUrls() {
  const sitemapPath = path.join(BUILD_DIR, 'guides-sitemap.xml');
  if (!fs.existsSync(sitemapPath)) {
    console.warn('IndexNow: guides-sitemap.xml not found — guide URLs will be skipped.');
    return { urls: [], considered: 0 };
  }
  const xml  = fs.readFileSync(sitemapPath, 'utf8');
  const urls = [];
  let considered = 0;
  // Match each <url> block so a <loc> is paired with ITS OWN <lastmod>
  const blockRe = /<url>([\s\S]*?)<\/url>/g;
  let block;
  while ((block = blockRe.exec(xml)) !== null) {
    const loc     = /<loc>([^<]+)<\/loc>/.exec(block[1]);
    const lastmod = /<lastmod>([^<]+)<\/lastmod>/.exec(block[1]);
    if (!loc) continue;
    considered++;
    if (SUBMIT_ALL || (lastmod && lastmod[1] === TODAY)) urls.push(loc[1]);
  }
  return { urls, considered };
}

// ─── Submit ───────────────────────────────────────────────────────────────────

function post(urlList) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      host:        HOST,
      key:         KEY,
      keyLocation: KEY_LOC,
      urlList,
    });

    const url    = new URL(ENDPOINT);
    const opts   = {
      hostname: url.hostname,
      path:     url.pathname,
      method:   'POST',
      headers:  {
        'Content-Type':   'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(opts, res => {
      let data = '';
      res.on('data', d => { data += d; });
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const tools  = getSitemapStateUrls();
  const guides = getGuideUrls();

  // The homepage lists the catalog, so it legitimately changes whenever a tool
  // page does — but submitting it alone, when nothing else moved, would be a
  // ping with no news in it.
  const changed = [...tools.urls, ...guides.urls];
  const allUrls = changed.length ? [`${SITE_URL}/`, ...changed] : [];

  const urls = [...new Set(allUrls)];

  if (!urls.length) {
    console.log('\nIndexNow: nothing changed this build — no submission sent.');
    console.log(`  (${tools.considered} indexable tool/static + ${guides.considered} guide URLs unchanged)`);
    console.log('  Set INDEXNOW_ALL=1 to force a full resubmit.');
    return;
  }

  console.log(`\nIndexNow: submitting ${urls.length} URL(s)${SUBMIT_ALL ? ' [FULL RESUBMIT]' : ''}`);
  console.log(`  • 1 homepage`);
  console.log(`  • ${tools.urls.length} of ${tools.considered} tool/static pages`);
  console.log(`  • ${guides.urls.length} of ${guides.considered} guide pages`);

  // Submit in batches
  const batches = [];
  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    batches.push(urls.slice(i, i + BATCH_SIZE));
  }

  let succeeded = 0;
  let failed    = 0;

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    try {
      const { status, body } = await post(batch);
      if (status === 200 || status === 202) {
        console.log(`  ✓ Batch ${i + 1}/${batches.length} — ${batch.length} URLs accepted (HTTP ${status})`);
        succeeded += batch.length;
      } else if (status === 422) {
        // 422 = URLs already submitted recently — not an error
        console.log(`  ✓ Batch ${i + 1}/${batches.length} — already up to date (HTTP 422)`);
        succeeded += batch.length;
      } else {
        console.warn(`  ⚠ Batch ${i + 1}/${batches.length} — HTTP ${status}: ${body}`);
        failed += batch.length;
      }
    } catch (err) {
      console.warn(`  ⚠ Batch ${i + 1}/${batches.length} — network error: ${err.message}`);
      failed += batch.length;
    }
  }

  console.log(`\nIndexNow done: ${succeeded} submitted, ${failed} failed`);

  // Don't fail the build if IndexNow is down — it's not critical path
  if (failed > 0 && succeeded === 0) {
    console.warn('IndexNow: all batches failed — check network or key validity');
    // Exit 0 intentionally: IndexNow failure should not block deployment
  }
}

main().catch(err => {
  console.error('IndexNow error:', err.message);
  process.exit(0); // non-critical — don't block deployment
});
