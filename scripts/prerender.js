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

const BUILD_DIR  = path.join(__dirname, '..', 'build');
const TOOLS_FILE = path.join(__dirname, '..', 'src', 'data', 'tools.js');
const SITE_NAME  = 'DeftBrain';
const SITE_URL   = 'https://deftbrain.com';
const DEFAULT_DESCRIPTION = 'DeftBrain offers 100+ free AI-powered tools for productivity, communication, health, finance, and more. Get instant, intelligent help for real-life problems.';

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
  const safeTitle = escapeHtml(fullTitle);
  const safeDesc  = escapeHtml(description);
  const safeUrl   = escapeHtml(canonical);

  const metaBlock = [
    `<title>${safeTitle}</title>`,
    `<meta name="description" content="${safeDesc}" />`,
    `<link rel="canonical" href="${safeUrl}" />`,
    `<meta property="og:title" content="${safeTitle}" />`,
    `<meta property="og:description" content="${safeDesc}" />`,
    `<meta property="og:url" content="${safeUrl}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta name="twitter:card" content="summary" />`,
    `<meta name="twitter:title" content="${safeTitle}" />`,
    `<meta name="twitter:description" content="${safeDesc}" />`,
  ].join('\n    ');

  let html = template;
  html = html.replace(/<title>[^<]*<\/title>/, '');
  html = html.replace(/<meta\s+name="description"[^>]*>/gi, '');
  html = html.replace('</head>', `    ${metaBlock}\n  </head>`);

  return html;
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

  console.log(`\nPrerendering ${tools.length} tool pages...\n`);

  let succeeded = 0;
  let failed    = 0;

  for (const tool of tools) {
    try {
      const html = injectMeta(template, tool);
      const dir  = path.join(BUILD_DIR, tool.id);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8');
      console.log(`  OK  /${tool.id}`);
      succeeded++;
    } catch (err) {
      console.error(`  FAIL  /${tool.id}  ->  ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone: ${succeeded} pages generated, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

main();
