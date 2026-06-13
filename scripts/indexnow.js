#!/usr/bin/env node
// scripts/indexnow.js
//
// Submits all tool and guide URLs to IndexNow after every production build.
// IndexNow pings Bing and Yandex simultaneously — one submission, two engines.
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

function getToolUrls() {
  const toolsFile = path.join(ROOT, 'src', 'data', 'tools.js');
  if (!fs.existsSync(toolsFile)) return [];
  const content = fs.readFileSync(toolsFile, 'utf8');
  const ids = [];
  // Key may be quoted ("id":) or unquoted (id:) — tolerate both, else
  // quoted-key tools (e.g. LaundroMat) never get submitted to IndexNow.
  const re = /["']?\bid\b["']?\s*:\s*['"]([A-Za-z][\w-]+)['"]/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    if (!ids.includes(m[1])) ids.push(m[1]);
  }
  return ids.map(id => `${SITE_URL}/${id}`);
}

function getGuideUrls() {
  // Read from the generated guides-sitemap.xml in build/
  const sitemapPath = path.join(BUILD_DIR, 'guides-sitemap.xml');
  if (!fs.existsSync(sitemapPath)) {
    console.warn('IndexNow: guides-sitemap.xml not found — guide URLs will be skipped.');
    return [];
  }
  const xml  = fs.readFileSync(sitemapPath, 'utf8');
  const re   = /<loc>([^<]+)<\/loc>/g;
  const urls = [];
  let m;
  while ((m = re.exec(xml)) !== null) {
    urls.push(m[1]);
  }
  return urls;
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
  const toolUrls  = getToolUrls();
  const guideUrls = getGuideUrls();

  // Always include homepage
  const allUrls = [
    `${SITE_URL}/`,
    ...toolUrls,
    ...guideUrls,
  ];

  // Deduplicate
  const urls = [...new Set(allUrls)];

  console.log(`\nIndexNow: submitting ${urls.length} URLs`);
  console.log(`  • 1 homepage`);
  console.log(`  • ${toolUrls.length} tool pages`);
  console.log(`  • ${guideUrls.length} guide pages`);

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
