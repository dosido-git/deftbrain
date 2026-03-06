// scripts/prerender.js
//
// Prerenders every tool page + homepage into static HTML snapshots.
// Runs automatically after `npm run build` via the postbuild script.
//
// How it works:
//   1. Reads all tool IDs from src/data/tools.js
//   2. Spins up a local static server on port 5050 serving the build/ folder
//   3. Puppeteer (headless Chrome) visits each route, waits for React to render
//   4. Saves the resulting HTML to build/{ToolId}/index.html
//   5. Express's existing express.static() will serve these files directly,
//      bypassing the SPA catch-all — so Google gets real HTML, not a blank shell

'use strict';

const puppeteer = require('puppeteer');
const http      = require('http');
const path      = require('path');
const fs        = require('fs');

// ─── Config ───────────────────────────────────────────────────────────────────

const BUILD_DIR  = path.join(__dirname, '..', 'build');
const TOOLS_FILE = path.join(__dirname, '..', 'src', 'data', 'tools.js');
const PORT       = 5050;
const BASE_URL   = `http://localhost:${PORT}`;

// How long to wait (ms) after React mounts for effects/meta tags to settle.
// Increase if you see missing <title> tags in snapshots.
const SETTLE_MS  = 1500;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Extract all tool IDs from the ES-module tools.js via regex. */
function getToolIds() {
  const content = fs.readFileSync(TOOLS_FILE, 'utf8');
  const ids     = [];
  const regex   = /\bid:\s*['"]([^'"]+)['"]/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    if (match[1]) ids.push(match[1]);
  }
  // Remove empty template placeholder if present
  return [...new Set(ids.filter(Boolean))];
}

/** Write HTML snapshot to build/{route}/index.html (or build/index.html for /). */
function saveSnapshot(route, html) {
  if (route === '/') {
    // Overwrite the root index.html with the prerendered version
    fs.writeFileSync(path.join(BUILD_DIR, 'index.html'), html, 'utf8');
  } else {
    const dir = path.join(BUILD_DIR, route.replace(/^\//, ''));
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8');
  }
}

/**
 * Minimal static file server with SPA fallback.
 * Serves real files from build/ if they exist; otherwise falls back to index.html.
 * No external dependencies needed.
 */
function createStaticServer() {
  const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js':   'text/javascript',
    '.css':  'text/css',
    '.json': 'application/json',
    '.png':  'image/png',
    '.jpg':  'image/jpeg',
    '.svg':  'image/svg+xml',
    '.ico':  'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.txt':  'text/plain',
  };

  return http.createServer((req, res) => {
    // Strip query strings
    const urlPath  = req.url.split('?')[0];
    const filePath = path.join(BUILD_DIR, urlPath === '/' ? 'index.html' : urlPath);

    // Serve real file if it exists
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext         = path.extname(filePath);
      const contentType = MIME[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(filePath).pipe(res);
    } else {
      // SPA fallback: serve index.html so React Router handles the route
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      fs.createReadStream(path.join(BUILD_DIR, 'index.html')).pipe(res);
    }
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {

  // Sanity check
  if (!fs.existsSync(BUILD_DIR)) {
    console.error('❌  build/ directory not found. Run `npm run build` first.');
    process.exit(1);
  }

  // Build route list
  const toolIds = getToolIds();
  const routes  = ['/', ...toolIds.map(id => `/${id}`)];
  console.log(`\n🔍  Prerendering ${routes.length} routes (1 dashboard + ${toolIds.length} tools)...\n`);

  // Start static server
  const server = createStaticServer();
  await new Promise(resolve => server.listen(PORT, resolve));
  console.log(`📡  Static server → ${BASE_URL}\n`);

  // Launch headless Chrome
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',   // Required in Railway/Docker environments
      '--disable-gpu',
    ],
  });

  let succeeded = 0;
  let failed    = 0;
  const errors  = [];

  for (const route of routes) {
    const page = await browser.newPage();

    // Block unnecessary network requests during prerender (images, fonts, analytics)
    await page.setRequestInterception(true);
    page.on('request', req => {
      const type = req.resourceType();
      if (['image', 'font', 'media'].includes(type)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    try {
      await page.goto(`${BASE_URL}${route}`, {
        waitUntil: 'domcontentloaded',
        timeout:   20000,
      });

      // Wait for React to mount something into #root
      await page.waitForSelector('#root > *', { timeout: 10000 });

      // Wait for useEffect / useDocumentHead to fire and set meta tags
      await new Promise(r => setTimeout(r, SETTLE_MS));

      const html = await page.content();
      saveSnapshot(route, html);

      const label = route === '/' ? '/ (dashboard)' : route;
      console.log(`  ✅  ${label}`);
      succeeded++;

    } catch (err) {
      const label = route === '/' ? '/ (dashboard)' : route;
      console.error(`  ❌  ${label}  →  ${err.message}`);
      errors.push({ route, error: err.message });
      failed++;
    } finally {
      await page.close();
    }
  }

  // Teardown
  await browser.close();
  server.close();

  // Summary
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`✨  Prerender complete: ${succeeded} succeeded, ${failed} failed`);

  if (errors.length > 0) {
    console.log('\nFailed routes:');
    errors.forEach(({ route, error }) => console.log(`  ${route}  →  ${error}`));
  }

  console.log('');

  // Exit with error code if any routes failed — useful for CI
  if (failed > 0) process.exit(1);
}

main().catch(err => {
  console.error('\n💥  Prerender script crashed:', err);
  process.exit(1);
});
