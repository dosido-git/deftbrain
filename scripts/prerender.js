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
const GUIDES_DIR = path.join(ROOT, 'guides');
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
// Load guide specs (guides/{category}/{slug}.js) and group them by the tool they
// relate to (spec.cta.toolId). This is the inverse of the guide→tool CTA, and it
// lets each tool page link to its own topically-relevant guides — feeding internal
// authority into the guides cluster, which the SPA otherwise left orphaned (the
// homepage and tool pages linked to ZERO guides, so Google declined to index them).
function loadGuidesByTool() {
  const byTool = {};
  if (!fs.existsSync(GUIDES_DIR)) return byTool;
  // Only link guides on the keep-list: consolidated guides 301 to a hub anchor
  // now, so these crawlable blocks shouldn't point Google at redirects (nor
  // count them — the static homepage said "browse all 551" while the hub and
  // the React twin, whose manifest is keep-list-filtered, both say 170).
  let keepSet = null;
  try {
    const keep = JSON.parse(fs.readFileSync(path.join(GUIDES_DIR, 'keep-list.json'), 'utf8')).keep;
    keepSet = new Set();
    for (const [cat, slugs] of Object.entries(keep)) slugs.forEach(sl => keepSet.add(`${cat}/${sl}`));
  } catch { /* no keep-list — link everything, as before */ }
  for (const cat of fs.readdirSync(GUIDES_DIR, { withFileTypes: true })) {
    if (!cat.isDirectory()) continue;
    const catDir = path.join(GUIDES_DIR, cat.name);
    for (const file of fs.readdirSync(catDir).filter(f => f.endsWith('.js'))) {
      const fp = path.join(catDir, file);
      try {
        delete require.cache[require.resolve(fp)];
        const spec = require(fp);
        const toolId = spec && spec.cta && spec.cta.toolId;
        if (!toolId || !spec.slug || !spec.category || !spec.title) continue;
        if (keepSet && !keepSet.has(`${spec.category}/${spec.slug}`)) continue;
        (byTool[toolId] = byTool[toolId] || []).push({
          slug: spec.slug,
          category: spec.category,
          // Use the full descriptive title for these crawlable guide links —
          // navTitle is a terse nav label ("ask for a discount") that reads as
          // ambiguous out of context and makes weaker SEO anchor text. The full
          // title ("How to Ask for a Discount Without Seeming Cheap") is clearer
          // for users and a stronger keyword signal for crawlers.
          title: spec.title || spec.shortTitle || spec.navTitle,
        });
      } catch { /* skip unparseable spec */ }
    }
  }
  return byTool;
}

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

// Visible "Related guides" block — mirrors getRelatedHTML (Related tools) for
// visual consistency. Links a tool page to a few of its own guides so authority
// flows from the (higher-authority) tool pages into the guides cluster. Capped at
// `n` and only rendered when the tool actually has guides, to keep the footer tidy.
function getRelatedGuidesHTML(guides, n = 4) {
  if (!guides || !guides.length) return '';
  const links = guides.slice(0, n)
    .map(g => `<a href="/guides/${g.category}/${g.slug}" style="color:#2c4a6e;text-decoration:none;font-weight:500">${escapeHtml(g.title)}</a>`)
    .join('\n        ');
  return `<nav class="db-related-guides" aria-label="Related guides" style="margin:0 0 20px">
      <h2 style="font-size:12px;text-transform:uppercase;letter-spacing:.1em;color:#8a8275;margin:0 0 12px;font-weight:700">Related guides</h2>
      <div style="display:flex;flex-wrap:wrap;gap:10px 16px;font-size:14px;line-height:1.5">
        ${links}
      </div>
    </nav>`;
}

// Homepage guides block — the homepage is the highest-authority page and linked to
// ZERO guides. This surfaces a topically-varied sample (one guide per tool) plus a
// prominent link to the /guides hub, so authority flows home → hub → all guides.
function getHomepageGuidesHTML(guidesByTool, n = 10) {
  const picks = [];
  let total = 0;
  for (const list of Object.values(guidesByTool)) {
    total += list.length;
    if (list[0] && picks.length < n) picks.push(list[0]); // one per tool → topic variety
  }
  if (!picks.length) return '';
  const links = picks
    .map(g => `<a href="/guides/${g.category}/${g.slug}" style="color:#2c4a6e;text-decoration:none;font-weight:500">${escapeHtml(g.title)}</a>`)
    .join('\n        ');
  return `<nav class="db-home-guides" aria-label="Guides" style="margin:0 0 20px">
      <h2 style="font-size:12px;text-transform:uppercase;letter-spacing:.1em;color:#8a8275;margin:0 0 12px;font-weight:700">Guides — <a href="/guides" style="color:#2c4a6e">browse all ${total} &rarr;</a></h2>
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
  // Title leads with the distinctive tool NAME (kept for tabs/history/bookmarks
  // and branded search), then the keyword phrase: "Name — seoTitle" (or
  // "Name — tagline"). Skip the prefix if seoTitle already contains the name.
  // MUST match the runtime title in src/components/ToolRenderer.js.
  const pageTitle = seoTitle
    ? (seoTitle.includes(title) ? seoTitle : `${title} — ${seoTitle}`)
    : (tagline ? `${title} — ${tagline}` : title);
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
// `extra` (per-page Related-tools/guides, or the homepage Guides block) goes
// inside #root too, so React's <RelatedLinks> replaces it per-route. That stops
// the old failure mode where these blocks lived OUTSIDE #root and persisted
// (stale) across SPA navigation — e.g. the homepage's guide sample leaking onto
// every tool page. The static copy here remains crawlable for no-JS / first-pass.
function injectBody(html, tool, extra = '') {
  return html.replace('<div id="root"></div>', `<div id="root">${buildBodyContent(tool)}${extra}</div>`);
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

  // ── Idempotency guard ──────────────────────────────────────────────────────
  // prerender MUTATES build/index.html (it writes the homepage variant there).
  // If prerender runs twice in a single build — e.g. the `postbuild` hook runs it
  // AND the deploy command appends an explicit `node scripts/prerender.js` — the
  // second run would read the already-injected homepage as its template, fail to
  // find the empty `<div id="root"></div>`, and stamp EVERY tool page with the
  // homepage body (db-home-guides, no seo-prerender). That is the exact corruption
  // that shipped to production. To make re-runs safe, snapshot the pristine CRA
  // template on the first run and always render from that snapshot. The snapshot
  // lives in build/ (which react-scripts wipes each build, so it is always fresh)
  // and is a dotfile with no .html extension, so it is neither served nor scanned
  // by the *.html postbuild steps.
  const pristinePath = path.join(BUILD_DIR, '.prerender-source');
  let template;
  if (fs.existsSync(pristinePath)) {
    template = fs.readFileSync(pristinePath, 'utf8');
  } else {
    template = fs.readFileSync(templatePath, 'utf8');
    fs.writeFileSync(pristinePath, template, 'utf8');
  }
  const tools    = loadTools();
  const guidesByTool = loadGuidesByTool();
  const guideCount = Object.values(guidesByTool).reduce((s, l) => s + l.length, 0);
  console.log(`Loaded ${guideCount} guides across ${Object.keys(guidesByTool).length} tools.`);
  // Homepage gets the all-tools index + a guides block (home → /guides hub);
  // tool pages also get per-tool "Related tools" + "Related guides" blocks.
  const homeGuides = getHomepageGuidesHTML(guidesByTool);

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
      // Per-page Related-tools / Related-guides blocks go INSIDE #root (React's
      // <RelatedLinks> replaces them per-route → no SPA-nav leak); the global
      // all-tools index stays OUTSIDE #root (identical on every page, harmless).
      const relatedBlocks = getRelatedHTML(relatedTools(tool, tools))
        + getRelatedGuidesHTML(guidesByTool[tool.id]);
      const html = injectToolIndex(
        injectBody(injectMeta(template, tool), tool, relatedBlocks),
        getToolIndexHTML(tools));
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
    // Home "Guides" block goes INSIDE #root (React replaces it per-route → it no
    // longer leaks onto tool pages); the all-tools index stays outside #root.
    const homepageHtml = injectToolIndex(
      template.replace('<div id="root"></div>', `<div id="root">${homeGuides}</div>`),
      getToolIndexHTML(tools));
    fs.writeFileSync(templatePath, homepageHtml, 'utf8');
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
