// scripts/prerender.js
//
// Generates static HTML snapshots for every tool page + homepage.
// No headless browser needed — injects meta tags directly into the
// build/index.html template and writes per-route index.html files.
//
// How it works:
//   1. Reads build/index.html (the React shell)
//   2. Reads all tool IDs, titles, and descriptions from src/data/tools.js
//   3. For each tool, clones the shell and injects:
//        - <title>Tool Title | DeftBrain</title>
//        - <meta name="description"> with the tool's description
//        - Open Graph tags (og:title, og:description, og:url)
//        - <link rel="canonical">
//   4. Writes the result to build/{ToolId}/index.html
//
// Express's existing express.static() serves these files directly to crawlers.
// React still hydrates normally for real users — no change to runtime behavior.

'use strict';

const fs   = require('fs');
const path = require('path');

// ─── Config ───────────────────────────────────────────────────────────────────

// ── Find project root by walking up from this file ───────────────────────────
function findProjectRoot(start) {
  let dir = start;
  while (true) {
    if (fs.existsSync(path.join(dir, 'package.json')) &&
        fs.existsSync(path.join(dir, 'src'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error('Could not find project root above ' + start);
    dir = parent;
  }
}
const ROOT       = findProjectRoot(__dirname);
const BUILD_DIR  = path.join(ROOT, 'build');
const TOOLS_FILE = path.join(ROOT, 'src', 'data', 'tools.js');
const SITE_NAME  = 'DeftBrain';
const SITE_URL   = 'https://deftbrain.com';
const DEFAULT_DESCRIPTION = 'DeftBrain offers 100+ free AI-powered tools for productivity, communication, health, finance, and more. Get instant, intelligent help for real-life problems.';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og/default.png`;

// Source of truth: src/data/tool-og-slugs.json — single shared map
// imported by prerender.js, useDocumentHead.js, and generate-og.py.
// Adding a new tool? Add its slug entry there.
const TOOL_OG_SLUGS = require(path.join(ROOT, 'src', 'data', 'tool-og-slugs.json'));

function getOgImage(toolId) {
  const slug = TOOL_OG_SLUGS[toolId];
  return slug ? `${SITE_URL}/og/${slug}.png` : DEFAULT_OG_IMAGE;
}

// ─── Parse tools.js ───────────────────────────────────────────────────────────

function getTools() {
  const content = fs.readFileSync(TOOLS_FILE, 'utf8');
  const tools   = [];

  const titleRegex   = /\btitle:\s*['"]([^'"]+)['"]/;
  const descRegex    = /\bdescription:\s*['"`]([\s\S]*?)['"`]\s*(?:,|\n\s*\w)/;
  const taglineRegex = /\btagline:\s*['"]([^'"]+)['"]/;

  const idSearch = /\bid:\s*['"]([^'"]+)['"]/g;
  let match;

  while ((match = idSearch.exec(content)) !== null) {
    const id = match[1];
    if (!id) continue;

    const windowStart = Math.max(0, match.index - 50);
    const windowEnd   = Math.min(content.length, match.index + 1500);
    const chunk       = content.slice(windowStart, windowEnd);

    const titleMatch   = titleRegex.exec(chunk);
    const descMatch    = descRegex.exec(chunk);
    const taglineMatch = taglineRegex.exec(chunk);

    const title       = titleMatch   ? titleMatch[1].trim() : id;
    const description = descMatch
      ? descMatch[1].replace(/\s+/g, ' ').replace(/\\n/g, ' ').trim().slice(0, 160)
      : DEFAULT_DESCRIPTION;
    const tagline     = taglineMatch ? taglineMatch[1].trim() : '';

    tools.push({ id, title, description, tagline });
  }

  // Remove duplicates — keep first occurrence
  const seen = new Set();
  return tools.filter(t => {
    if (seen.has(t.id)) return false;
    seen.add(t.id);
    return true;
  });
}

// ─── HTML injection ───────────────────────────────────────────────────────────

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function injectMeta(template, { id, title, description }) {
  const fullTitle = `${title} | ${SITE_NAME}`;
  const canonical = `${SITE_URL}/${id}`;
  const ogImage   = getOgImage(id);
  const safeTitle = escapeHtml(fullTitle);
  const safeDesc  = escapeHtml(description);
  const safeUrl   = escapeHtml(canonical);
  const safeImage = escapeHtml(ogImage);

  const metaBlock = [
    `<title>${safeTitle}</title>`,
    `<meta name="description" content="${safeDesc}" />`,
    `<link rel="canonical" href="${safeUrl}" />`,
    `<meta property="og:title" content="${safeTitle}" />`,
    `<meta property="og:description" content="${safeDesc}" />`,
    `<meta property="og:url" content="${safeUrl}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:image" content="${safeImage}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${safeTitle}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${safeTitle}" />`,
    `<meta name="twitter:description" content="${safeDesc}" />`,
    `<meta name="twitter:image" content="${safeImage}" />`,
    `<meta name="twitter:site" content="@deftbrain" />`,
    `<meta name="author" content="DeftBrain.com" />`,
  ].join('\n    ');

  let html = template;

  // Strip existing tags that we'll replace with tool-specific versions
  html = html.replace(/<title>[^<]*<\/title>/gi, '');
  html = html.replace(/<meta\s+name="description"[^>]*>/gi, '');
  html = html.replace(/<meta\s+name="author"[^>]*>/gi, '');
  html = html.replace(/<meta\s+property="og:[^"]*"[^>]*>/gi, '');
  html = html.replace(/<meta\s+name="twitter:[^"]*"[^>]*>/gi, '');
  html = html.replace(/<link\s+rel="canonical"[^>]*>/gi, '');
  html = html.replace('</head>', `    ${metaBlock}\n  </head>`);

  return html;
}

// ─── Crawlable tool index (internal-linking fix) ──────────────────────────────
// The SPA renders its homepage tool links client-side, so Googlebot received an
// empty shell with no links to any tool — every internal link it found pointed
// back at the homepage, leaving all ~128 tool pages internally orphaned. Inject a
// REAL <a href> index of every tool into the static HTML of every page, placed
// OUTSIDE #root so React ignores it on hydration (no cloaking — the links are
// genuinely served and visible). This distributes internal authority to all tools.
function buildToolIndex(tools) {
  const links = tools
    .map(t => `<a href="/${t.id}" style="color:#2c4a6e;text-decoration:none">${escapeHtml(t.title)}</a>`)
    .join('\n        ');
  return `
  <footer class="db-tool-index" aria-label="All DeftBrain tools" style="max-width:1100px;margin:56px auto 24px;padding:24px 20px;border-top:1px solid #e8e1d5;font-family:system-ui,-apple-system,sans-serif">
    <h2 style="font-size:12px;text-transform:uppercase;letter-spacing:.1em;color:#8a8275;margin:0 0 14px;font-weight:700">All DeftBrain tools</h2>
    <nav style="display:flex;flex-wrap:wrap;gap:10px 18px;font-size:13px;line-height:1.5">
        ${links}
    </nav>
  </footer>`;
}

function injectToolIndex(html, indexHtml) {
  return html.replace('</body>', `${indexHtml}\n</body>`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  if (!fs.existsSync(BUILD_DIR)) {
    console.error('build/ directory not found. Run npm run build first.');
    process.exit(1);
  }

  const templatePath = path.join(BUILD_DIR, 'index.html');
  if (!fs.existsSync(templatePath)) {
    console.error('build/index.html not found.');
    process.exit(1);
  }

  const template = fs.readFileSync(templatePath, 'utf8');
  const tools    = getTools();
  const toolIndex = buildToolIndex(tools);

  console.log(`\nPrerendering ${tools.length} tool pages...\n`);

  // Clean up legacy directory-based prerender output before writing flat files.
  // Directories named after tool IDs (e.g. build/SpiralStopper/index.html) cause
  // static servers to serve /SpiralStopper/ as 200, creating trailing-slash duplicates
  // that confuse Google. Flat files (build/SpiralStopper.html) have no slash variant.
  const protectedDirs = new Set(['static', 'og', 'guides']);
  for (const entry of fs.readdirSync(BUILD_DIR)) {
    if (protectedDirs.has(entry)) continue;
    const full = path.join(BUILD_DIR, entry);
    if (fs.statSync(full).isDirectory()) {
      fs.rmSync(full, { recursive: true, force: true });
      console.log(`  CLEANED  ${entry}/`);
    }
  }

  let succeeded = 0;
  let failed    = 0;

  for (const tool of tools) {
    try {
      const html = injectToolIndex(injectMeta(template, tool), toolIndex);
      fs.writeFileSync(path.join(BUILD_DIR, `${tool.id}.html`), html, 'utf8');
      console.log(`  OK  /${tool.id}`);
      succeeded++;
    } catch (err) {
      console.error(`  FAIL  /${tool.id}  ->  ${err.message}`);
      failed++;
    }
  }

  // Inject the same crawlable tool index into the homepage's static HTML — the
  // highest-authority page, and the one Google saw with zero outbound tool links.
  try {
    fs.writeFileSync(templatePath, injectToolIndex(template, toolIndex), 'utf8');
    console.log('  OK  / (homepage tool index)');
    succeeded++;
  } catch (err) {
    console.error(`  FAIL  / homepage  ->  ${err.message}`);
    failed++;
  }

  console.log(`\nDone: ${succeeded} pages generated, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

main();
