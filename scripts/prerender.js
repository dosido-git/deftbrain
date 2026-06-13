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

// tools.js is ESM data (export const tools = [...]) with no imports/JSX. We
// evaluate it as plain JS — strip the `export` keywords and return the array —
// rather than import()ing it. A dynamic import of a typeless .js relies on
// Node's ESM auto-detection, which Node < 22 lacks (it parses the file as
// CommonJS and throws on `export`), so import() broke the Railway build on
// Node 18/20. This eval path is Node-version-independent and gives the same
// clean structured access to nested fields (notably `guide`) that a regex
// can't reliably extract from multiline objects.
function loadTools() {
  const src  = fs.readFileSync(TOOLS_FILE, 'utf8');
  const body = src.replace(/\bexport\s+const\b/g, 'const');
  // eslint-disable-next-line no-new-func
  const tools = new Function(`${body}\n;return typeof tools !== 'undefined' ? tools : [];`)();
  const seen = new Set();
  return (tools || [])
    .filter(t => t && t.id && !seen.has(t.id) && seen.add(t.id))
    .map(t => ({
      id:             t.id,
      title:          (t.title || t.id).trim(),
      tagline:        (t.tagline || '').trim(),
      description:    (t.description || DEFAULT_DESCRIPTION).trim(),
      seoTitle:       t.seoTitle || '',
      seoDescription: t.seoDescription || '',
      guide:          t.guide || null,
      tags:           Array.isArray(t.tags) ? t.tags : [],
      categories:     Array.isArray(t.categories) ? t.categories : [],
    }));
}

// Pick a tool's most relevant siblings for a visible "Related tools" block.
// Relevance = shared tags (weighted) + shared category. To avoid noise, a tool
// only qualifies on real topical overlap — ≥2 shared tags, or 1 shared tag
// reinforced by a shared category. Category-alone matches are excluded (the
// catch-all categories would surface the same handful of tools everywhere).
// Returns up to `n`, or [] when nothing genuinely related — better no block
// than irrelevant links (the full index below still covers every tool).
function relatedTools(tool, all, n = 6) {
  const tags = new Set((tool.tags || []).map(s => s.toLowerCase()));
  const cats = new Set(tool.categories || []);
  return all
    .filter(t => t.id !== tool.id)
    .map(t => {
      const tg = (t.tags || []).map(s => s.toLowerCase()).filter(x => tags.has(x)).length;
      const ct = (t.categories || []).filter(c => cats.has(c)).length;
      return { t, tg, ct, score: tg * 3 + ct };
    })
    .filter(x => x.tg >= 2 || (x.tg >= 1 && x.ct >= 1))
    .sort((a, b) => b.score - a.score || a.t.title.localeCompare(b.t.title))
    .slice(0, n)
    .map(x => x.t);
}

// Visible "Related tools" block (NOT collapsed, NOT display:none — genuine
// user-facing UI, same content crawlers see). Rendered inside the db-tool-index
// footer, above the collapsed full index.
function getRelatedHTML(related) {
  if (!related.length) return '';
  const links = related
    .map(t => `<a href="/${t.id}" style="color:#2c4a6e;text-decoration:none;font-weight:500">${escapeHtml(t.title)}</a>`)
    .join('\n        ');
  return `<nav class="db-related" aria-label="Related tools" style="margin:0 0 20px">
      <h2 style="font-size:12px;text-transform:uppercase;letter-spacing:.1em;color:#8a8275;margin:0 0 12px;font-weight:700">Related tools</h2>
      <div style="display:flex;flex-wrap:wrap;gap:10px 16px;font-size:14px;line-height:1.5">
        ${links}
      </div>
    </nav>`;
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
function buildJsonLd({ id, title, description }) {
  const obj = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: title,
    description,
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
  // Meta/social descriptions cap at ~160 chars; the full description goes in the body.
  const metaDesc  = (seoDescription || description).slice(0, 160);
  const safeTitle = escapeHtml(fullTitle);
  const safeDesc  = escapeHtml(metaDesc);
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

  const jsonLd = buildJsonLd({ id, title, description: metaDesc });

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
  // Idempotent: strip any previously-injected index first. prerender writes the
  // footer into build/index.html (the homepage), which is ALSO the template for
  // tool pages — so if prerender runs against a build/ that already has a footer
  // (a re-run, or Railway caching the build dir across deploys), it would double
  // up. Removing existing copies first guarantees exactly one, every time.
  const cleaned = html.replace(/\s*<footer class="db-tool-index"[\s\S]*?<\/footer>/g, '');
  return cleaned.replace('</body>', `${indexHtml}\n</body>`);
}

// Static, tool-specific body content. The CRA shell ships an empty <div id="root">,
// so crawlers' first pass (and JS-off clients) saw no on-page content — only the
// shared footer index, identical across all tools. This mirrors the guide section
// ToolPageWrapper already renders (h1 → description → overview → how-to → example →
// tips → pitfalls), so it's the SAME content the page shows (no cloaking). Injected
// INSIDE #root: the app mounts with createRoot().render(), which REPLACES the
// container's contents on load — so there's no hydration mismatch; React simply
// swaps this for the live app. Keep in sync with ToolPageWrapper's guide layout.
function buildBodyContent({ title, tagline, description, guide }) {
  const e = escapeHtml;
  const H2 = 'font-size:1.15rem;font-weight:600;margin:1.75rem 0 .5rem;color:#0f172a';
  const LI = 'margin:.4rem 0;line-height:1.55';
  const out = [];

  out.push(`<h1 style="font-size:2rem;font-weight:600;margin:0 0 .35rem;color:#0f172a">${e(title)}</h1>`);
  if (tagline)     out.push(`<p style="font-size:1.1rem;color:#475569;margin:0 0 1rem">${e(tagline)}</p>`);
  if (description) out.push(`<p style="line-height:1.6;margin:0 0 1rem">${e(description)}</p>`);

  const g = guide || {};
  if (g.overview) {
    out.push(`<h2 style="${H2}">Overview</h2><p style="line-height:1.6;margin:0">${e(g.overview)}</p>`);
  }
  if (Array.isArray(g.howToUse) && g.howToUse.length) {
    const items = g.howToUse.map(s => `<li style="${LI}">${e(String(s))}</li>`).join('');
    out.push(`<h2 style="${H2}">How to use it</h2><ol style="padding-left:1.25rem;margin:0">${items}</ol>`);
  }
  if (g.example) {
    let body = '';
    if (typeof g.example === 'string') {
      body = `<p style="line-height:1.6;margin:0">${e(g.example)}</p>`;
    } else {
      const rows = [];
      if (g.example.scenario) rows.push(`<p style="margin:.3rem 0;line-height:1.55"><strong>Scenario:</strong> ${e(g.example.scenario)}</p>`);
      if (g.example.action)   rows.push(`<p style="margin:.3rem 0;line-height:1.55"><strong>What you do:</strong> ${e(g.example.action)}</p>`);
      if (g.example.result)   rows.push(`<p style="margin:.3rem 0;line-height:1.55"><strong>Result:</strong> ${e(g.example.result)}</p>`);
      body = rows.join('');
    }
    if (body) out.push(`<h2 style="${H2}">Example</h2>${body}`);
  }
  if (Array.isArray(g.tips) && g.tips.length) {
    const items = g.tips.map(t => `<li style="${LI}">${e(String(t))}</li>`).join('');
    out.push(`<h2 style="${H2}">Tips</h2><ul style="padding-left:1.25rem;margin:0">${items}</ul>`);
  }
  if (Array.isArray(g.pitfalls) && g.pitfalls.length) {
    const items = g.pitfalls.map(p => `<li style="${LI}">${e(String(p))}</li>`).join('');
    out.push(`<h2 style="${H2}">Common pitfalls</h2><ul style="padding-left:1.25rem;margin:0">${items}</ul>`);
  }

  return `<div class="seo-prerender" style="max-width:760px;margin:0 auto;padding:2rem 1.25rem;`
    + `font-family:system-ui,-apple-system,'Segoe UI',sans-serif;color:#1e293b">\n  `
    + out.join('\n  ')
    + `\n</div>`;
}

// Inject the static content INTO #root (React replaces it on mount — see above).
function injectBody(html, tool) {
  return html.replace('<div id="root"></div>', `<div id="root">${buildBodyContent(tool)}</div>`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
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
  const tools    = loadTools();
  // Homepage/guides get the index alone; tool pages also get a per-tool
  // "Related tools" block (computed in the loop below).
  const homepageIndex = getToolIndexHTML(tools);

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
      const idxHtml = getToolIndexHTML(tools, getRelatedHTML(relatedTools(tool, tools)));
      const html = injectToolIndex(injectBody(injectMeta(template, tool), tool), idxHtml);
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
    fs.writeFileSync(templatePath, injectToolIndex(template, homepageIndex), 'utf8');
    console.log('  OK  / (homepage tool index)');
    succeeded++;
  } catch (err) {
    console.error(`  FAIL  / homepage  ->  ${err.message}`);
    failed++;
  }

  console.log(`\nDone: ${succeeded} pages generated, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

main().catch(err => {
  console.error('prerender failed:', err);
  process.exit(1);
});
