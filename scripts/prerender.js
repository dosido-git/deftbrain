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
const { getToolIndexHTML } = require(path.join(ROOT, 'src', 'seo', 'chrome'));

function getOgImage(toolId) {
  const slug = TOOL_OG_SLUGS[toolId];
  return slug ? `${SITE_URL}/og/${slug}.png` : DEFAULT_OG_IMAGE;
}

// ─── Parse tools.js ───────────────────────────────────────────────────────────

function getTools() {
  const content = fs.readFileSync(TOOLS_FILE, 'utf8');
  const tools   = [];

  // Keys may be quoted ("title":) or unquoted (title:) — tolerate both.
  const titleRegex   = /["']?\btitle\b["']?\s*:\s*['"]([^'"]+)['"]/;
  const descRegex    = /["']?\bdescription\b["']?\s*:\s*['"`]([\s\S]*?)['"`]\s*(?:,|\n\s*["']?\w)/;
  const taglineRegex = /["']?\btagline\b["']?\s*:\s*(['"])((?:\\.|(?!\1).)*)\1/;

  const idSearch = /["']?\bid\b["']?\s*:\s*['"]([^'"]+)['"]/g;
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
    // unquote: collapse whitespace + unescape \' \" (taglines may use either delimiter).
    const unq = (s) => s.replace(/\\(['"])/g, '$1').replace(/\s+/g, ' ').trim();
    const tagline     = taglineMatch ? unq(taglineMatch[2]) : '';
    // Optional per-tool SEO overrides (add seoTitle/seoDescription to a tool in tools.js).
    const seoTitleMatch = /["']?\bseoTitle\b["']?\s*:\s*(['"])((?:\\.|(?!\1).)*)\1/.exec(chunk);
    const seoDescMatch  = /["']?\bseoDescription\b["']?\s*:\s*(['"])((?:\\.|(?!\1).)*)\1/.exec(chunk);
    const seoTitle       = seoTitleMatch ? unq(seoTitleMatch[2]) : '';
    const seoDescription = seoDescMatch  ? unq(seoDescMatch[2]).slice(0, 160) : '';

    tools.push({ id, title, description, tagline, seoTitle, seoDescription });
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

// Per-tool structured data. The CRA shell ships a single site-level
// WebApplication block (correct for the homepage); without this, every tool
// page would inherit that identical block and tell crawlers it's the same app.
// Emit a tool-specific SoftwareApplication instead so each page is distinct and
// rich-result eligible (free offer). `<` is escaped to < so a stray "</"
// in any field can't break out of the <script> element.
function buildJsonLd({ id, title, description, seoDescription }) {
  const obj = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: title,
    description: seoDescription || description,
    url: `${SITE_URL}/${id}`,
    applicationCategory: 'UtilityApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: SITE_URL },
    publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
  };
  const json = JSON.stringify(obj, null, 2).replace(/</g, '\\u003c');
  return `<script type="application/ld+json">${json}</script>`;
}

function injectMeta(template, { id, title, description, tagline, seoTitle, seoDescription }) {
  // Title leads with the tool name, then its tagline (functional keywords users
  // actually search), unless a bespoke seoTitle override is set.
  const pageTitle = seoTitle || (tagline ? `${title} — ${tagline}` : title);
  const fullTitle = `${pageTitle} | ${SITE_NAME}`;
  const canonical = `${SITE_URL}/${id}`;
  const ogImage   = getOgImage(id);
  const safeTitle = escapeHtml(fullTitle);
  const safeDesc  = escapeHtml(seoDescription || description);
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

  const jsonLd = buildJsonLd({ id, title, description, seoDescription });

  let html = template;

  // Strip existing tags that we'll replace with tool-specific versions
  html = html.replace(/<title>[^<]*<\/title>/gi, '');
  html = html.replace(/<meta\s+name="description"[^>]*>/gi, '');
  html = html.replace(/<meta\s+name="author"[^>]*>/gi, '');
  html = html.replace(/<meta\s+property="og:[^"]*"[^>]*>/gi, '');
  html = html.replace(/<meta\s+name="twitter:[^"]*"[^>]*>/gi, '');
  html = html.replace(/<link\s+rel="canonical"[^>]*>/gi, '');
  // Drop the inherited site-level WebApplication JSON-LD; replace with per-tool.
  html = html.replace(/<script\s+type="application\/ld\+json">[\s\S]*?<\/script>/gi, '');
  html = html.replace('</head>', `    ${metaBlock}\n    ${jsonLd}\n  </head>`);

  return html;
}

// Crawlable all-tools index — see src/seo/chrome.js getToolIndexHTML(). Injected
// OUTSIDE #root so React ignores it on hydration (no cloaking). Fixes the
// orphaned-tools internal-linking problem the SPA created.
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
  const toolIndex = getToolIndexHTML(tools);

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
