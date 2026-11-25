#!/usr/bin/env node
// ============================================================
// scripts/build-tools-category-pages.js
// ============================================================
// Generates the 14 prerendered tool-category pages:
//   build/tools/{slug}/index.html
//
// One page per src/data/categoryMeta.js entry — additive to /tools
// (AllToolsPage.js, the flat search/browse React page), NOT a replacement
// for it. /tools stays the searchable catalog; each of these is a real,
// crawlable, editorial destination for one category (masthead + eyebrow +
// H1 + desc + example + an alphabetical tool grid styled like AllToolsPage's
// own .at-card), the same "a category gets its own page" role /guides'
// 18 hub pages already play for guides (see scripts/build-guides-indexes.js
// — this script is the direct architectural twin of that one, just for
// tools instead of guides, and with no on-page search: same choice the
// guide hubs made, since the flat searchable view already exists at /tools).
//
// Reads:  src/data/categoryMeta.js (name/emoji/slug/desc/example per category)
//         src/data/tools.js        (the full tool catalog)
// Writes: build/tools/{slug}/index.html — 14 files
//
// Hooked into package.json's postbuild, after build-guides-indexes.js and
// before check-sitemap-urls.js / check-orphans.js (both need these files to
// already exist on disk to verify against).
// ============================================================

const fs   = require('fs');
const path = require('path');
const { getFooterHTML, getSiteHeaderHTML } = require('../src/seo/chrome');
const { categoriesFor } = require('./lib/toolCategories');
const { buildGuideShelves } = require('./lib/guideShelves');
const FAQ_PAGES = require('../faq/pages');
const FAQ_TOPICS = require('../faq/topics');
const { guideListHtml, GUIDE_LIST_STYLE, GUIDE_LIST_SCRIPT, GUIDE_LIST_NOSCRIPT } = require('./lib/guideListHtml');
const { GA_SNIPPET } = require('./lib/gaSnippet');
const { THEME_SNIPPET } = require('./lib/themeSnippet');
const { linksToHtml } = require('../src/utils/inlineLinks');

const ROOT      = path.join(__dirname, '..');
const BUILD_DIR = path.join(ROOT, 'build', 'tools');
const BASE_URL  = 'https://deftbrain.com';

function escHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// categoryMeta.js and tools.js are plain ES-module data files with no
// imports — same "strip `export const` then new Function(...)-eval" load
// used by scripts/generate-sitemap.js and scripts/generate-llms.js, so a
// change to either file is picked up without a bundler.
function loadModuleData(relPath, exportName) {
  const file = path.join(ROOT, relPath);
  const body = fs.readFileSync(file, 'utf8').replace(/\bexport\s+const\b/g, 'const');
  // eslint-disable-next-line no-new-func
  return new Function(`${body}\n;return typeof ${exportName} !== 'undefined' ? ${exportName} : [];`)();
}

function loadCategories() {
  return loadModuleData(path.join('src', 'data', 'categoryMeta.js'), 'CATEGORY_META');
}

function loadOverviews() {
  return loadModuleData(path.join('src', 'data', 'categoryOverviews.js'), 'CATEGORY_OVERVIEWS');
}

function loadTools() {
  return loadModuleData(path.join('src', 'data', 'tools.js'), 'tools');
}

// A real image ships for ~124 of the ~150 tools (public/scramble/{id}.webp —
// the same art AllToolsPage.js's own ToolCard uses). AllToolsPage.js can
// check this at RUNTIME via an <img onError> handler because it's a live
// React page; this is a static generator with no client JS to fall back
// with, so the equivalent check happens at BUILD time instead — read the
// file straight off disk and only ever emit an <img> tag when it's there.
// The page's heading (owner, 2026-10-04): "<Category> Tools", nothing more —
// no description or example line under it. Plural category names read better
// singular in front of "Tools" ("Relationship Tools", not "Relationships
// tools"); the description still feeds the meta description for search.
const SINGULAR = { Relationships: 'Relationship', Conversations: 'Conversation', Decisions: 'Decision', Tasks: 'Task' };
function heading(name) {
  return `${SINGULAR[name] || name} Tools`;
}

function hasScrambleArt(toolId) {
  return fs.existsSync(path.join(ROOT, 'public', 'scramble', `${toolId}.webp`));
}

function renderHead({ title, description, canonicalPath }) {
  const canonical = `${BASE_URL}${canonicalPath}`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  ${GA_SNIPPET}
  ${THEME_SNIPPET}

  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>${escHtml(title)}</title>
  <meta name="description" content="${escHtml(description)}">
  <link rel="canonical" href="${escHtml(canonical)}">

  <meta property="og:type"        content="website">
  <meta property="og:title"       content="${escHtml(title)}">
  <meta property="og:description" content="${escHtml(description)}">
  <meta property="og:url"         content="${escHtml(canonical)}">
  <meta property="og:site_name"   content="DeftBrain">

  <meta name="twitter:card"        content="summary_large_image">
  <meta name="twitter:title"       content="${escHtml(title)}">
  <meta name="twitter:description" content="${escHtml(description)}">

  <!-- Self-hosted fonts (no third-party request) — see public/fonts/ -->
  <link rel="stylesheet" href="/fonts/playfair-display/playfair-display.css">
  <link rel="stylesheet" href="/fonts/dm-sans/dm-sans.css">

  <!-- guide.css supplies the shared .masthead / footer chrome every static
       page on the site uses (about/privacy/terms/guides) — reused here
       rather than restated so this page's header/footer never drifts from
       theirs. Everything below is this page's own, tcp-prefixed. -->
  <link rel="stylesheet" href="/guides/guide.css">

  <style>
    /* Tool category pages (2026-09-22) — "tcp-" prefixed and scoped under
       .tcp-page rather than :root, same reason build-guides-indexes.js's
       own "gh-" home-page style is scoped under .gh-page: this block shares
       the page with guide.css's global :root variables (--ink, --paper, …)
       that the masthead/footer depend on, so redefining those names here
       would recolor them too.

       The card design (.tcp-card and friends) is a straight port of
       src/components/AllToolsPage.css's .at-card — same colors, same
       proportions — since that's the established visual language for "a
       tool in a grid" on this site and the design brief here was to match
       it, not invent a second one. Ported by hand, not shared: this is a
       static generator emitting HTML strings, that's a CSS file scoped to
       a React component. If you change one card design, change the other.
       Ported color constants: --navy/--blue/--gold/--muted/--line/--sand2
       from .at-page in AllToolsPage.css. */
    .tcp-page{--tcp-navy:#1e2a3a;--tcp-blue:#165b9a;--tcp-gold:#c8872e;--tcp-muted:#6e6659;--tcp-line:#e3dbcf;--tcp-sand2:#f3efe8;color:var(--tcp-navy)}
    .tcp-shell{width:min(1240px,calc(100% - 40px));margin-inline:auto;padding:20px 0 64px}
    .tcp-back{display:inline-block;margin-bottom:22px;color:var(--tcp-blue);font-family:'DM Sans',system-ui,sans-serif;font-size:12px;font-weight:700;text-decoration:none}
    .tcp-back:hover{text-decoration:underline}
    .tcp-eyebrow{display:flex;align-items:center;gap:8px;font-family:'DM Sans',system-ui,sans-serif;font-size:10px;font-weight:900;letter-spacing:.18em;text-transform:uppercase;color:var(--tcp-gold);margin:0 0 10px}
    .tcp-eyebrow .tcp-emoji{font-size:16px;letter-spacing:normal}
    .tcp-page h1{font-family:'Playfair Display',Georgia,'Times New Roman',serif;font-weight:700;font-size:32px;line-height:1.05;letter-spacing:-.03em;margin:0}
    @media(min-width:640px){.tcp-page h1{font-size:40px}}
    .tcp-count{font-family:'DM Sans',system-ui,sans-serif;font-size:14px;color:var(--tcp-muted);margin:26px 0 14px;text-transform:uppercase;letter-spacing:.08em;font-weight:700}
    .tcp-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:22px 18px;margin-top:8px}
    .tcp-card{display:block;background:#fff;border:1px solid #e5ded4;border-radius:16px;overflow:hidden;text-decoration:none;color:inherit;box-shadow:0 2px 10px rgba(30,42,58,.035);transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease}
    .tcp-card:hover{transform:translateY(-3px);border-color:#cfc3b3;box-shadow:0 12px 28px rgba(30,42,58,.10)}
    .tcp-card-image-wrap{aspect-ratio:640/566;background:#e9e2d8;overflow:hidden}
    .tcp-card-image{display:block;width:100%;height:100%;object-fit:cover;transition:transform .35s ease}
    /* Art zooms inside its frame on hover — hover-capable pointers only (a tap
       on touch would leave it stuck zoomed), and off under reduced motion.
       Twin of AllToolsPage.css's .at-card-image rule; keep them in step. */
    @media(hover:hover){.tcp-card:hover .tcp-card-image{transform:scale(1.05)}}
    @media(prefers-reduced-motion:reduce){.tcp-card,.tcp-card-image{transition:none!important}.tcp-card:hover .tcp-card-image{transform:none}}
    .tcp-card-fallback{height:100%;display:grid;place-items:center;background:linear-gradient(145deg,#e7edf3,#f2e8da)}
    .tcp-card-fallback span{font-size:48px;filter:grayscale(.25)}
    .tcp-card-copy{padding:15px 16px 17px;min-height:108px}
    .tcp-card-title-row{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
    .tcp-card h2{font-family:'DM Sans',system-ui,sans-serif;font-size:15px;line-height:1.25;margin:0;font-weight:850;letter-spacing:-.015em;color:var(--tcp-navy)}
    .tcp-arrow{color:var(--tcp-gold);font-size:18px;line-height:1}
    .tcp-card p{font-family:'DM Sans',system-ui,sans-serif;font-size:11.5px;line-height:1.45;color:var(--tcp-muted);margin:7px 0 0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
    .tcp-outro{margin-top:44px;padding-top:20px;border-top:1px solid var(--tcp-line);font-family:'DM Sans',system-ui,sans-serif;font-size:14px;color:var(--tcp-muted);line-height:1.6}
    .tcp-outro a{color:var(--tcp-blue);text-decoration:underline;text-underline-offset:2px}
    @media(max-width:1050px){.tcp-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
    @media(max-width:760px){.tcp-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:14px 12px}.tcp-card-copy{padding:12px;min-height:102px}.tcp-card h2{font-size:14px}}
    @media(max-width:470px){.tcp-grid{grid-template-columns:1fr}.tcp-card{display:grid;grid-template-columns:42% 58%;min-height:140px}.tcp-card-image-wrap{aspect-ratio:auto;height:100%}.tcp-card-copy{min-height:0;display:flex;flex-direction:column;justify-content:center}}
    .tcp-about{margin-top:48px;max-width:720px;font-family:'DM Sans',system-ui,sans-serif;font-size:16px;line-height:1.65;color:var(--tcp-navy)}
    .tcp-about h2{font-family:Georgia,'Times New Roman',serif;font-size:25px;line-height:1.25;margin:0 0 14px;color:var(--tcp-navy)}
    .tcp-about p{margin:0 0 14px}
    .tcp-about a{color:var(--tcp-blue);text-decoration:underline;text-underline-offset:2px}
    .tcp-sources{margin-top:20px;font-size:13px;color:var(--tcp-muted)}
    .tcp-sources-label{font-weight:700;text-transform:uppercase;letter-spacing:.08em;font-size:11px;margin:0 0 6px}
    .tcp-sources ul{margin:0;padding-inline-start:1.1rem}
    .tcp-sources a{color:var(--tcp-muted)}
    .tcp-faq{margin-top:48px;max-width:720px;font-family:'DM Sans',system-ui,sans-serif;font-size:16px;line-height:1.8}
    .tcp-faq h2{font-family:Georgia,'Times New Roman',serif;font-size:25px;line-height:1.25;margin:0 0 14px;color:var(--tcp-navy)}
    .tcp-faq ul{margin:0;padding-inline-start:1.2rem}
    .tcp-faq a{color:var(--tcp-blue);text-decoration:underline;text-underline-offset:2px}
    .tcp-guides{margin-top:48px;font-family:'DM Sans',system-ui,sans-serif}
    .tcp-guides h2{font-family:Georgia,'Times New Roman',serif;font-size:25px;margin:0 0 14px;color:var(--tcp-navy)}
    .tcp-page{--gl-ink:var(--tcp-navy);--gl-link:var(--tcp-blue);--gl-muted:var(--tcp-muted);--gl-line:var(--tcp-line)}${GUIDE_LIST_STYLE}
  </style>
</head>
<body>

  ${getSiteHeaderHTML()}`;
}

function renderFooter() {
  return `
${getFooterHTML()}

</body>
</html>`;
}

// The topic overview, between the tools and the guides (owner, 2026-11-20):
// the category page is the topic's pillar. Kept below the grid so the page
// still opens on the heading and the tools (owner, 2026-10-04).
function renderOverview(ov, toolIds) {
  if (!ov) return '';
  for (const p of ov.paras) {
    for (const m of p.matchAll(/\]\(\/([A-Za-z]+)\)/g)) {
      if (!toolIds.has(m[1])) throw new Error(`categoryOverviews: link to unknown tool /${m[1]}`);
    }
  }
  const sources = ov.sources && ov.sources.length ? `
        <div class="tcp-sources">
          <p class="tcp-sources-label">Sources</p>
          <ul>
${ov.sources.map(s => `            <li><a href="${escHtml(s.url)}" rel="noopener" target="_blank">${escHtml(s.label)}</a></li>`).join('\n')}
          </ul>
        </div>` : '';
  return `
      <section class="tcp-about" aria-labelledby="tcp-about-h">
        <h2 id="tcp-about-h">${escHtml(ov.heading)}</h2>
${ov.paras.map(p => `        <p>${linksToHtml(p, escHtml)}</p>`).join('\n')}${sources}
      </section>
`;
}

// Single-question answer pages (/faq/, faq/pages.js) whose topic belongs to
// this category: the category page is how a crawler and a visitor reach them.
function renderFaq(meta) {
  const qs = FAQ_PAGES.filter(p => FAQ_TOPICS[p.topic].category === meta.name);
  if (!qs.length) return '';
  return `
      <section class="tcp-faq" aria-labelledby="tcp-faq-h">
        <h2 id="tcp-faq-h">Quick answers</h2>
        <ul>
${qs.map(p => `          <li><a href="/faq/${p.slug}">${escHtml(p.question)}</a></li>`).join('\n')}
        </ul>
      </section>
`;
}

// The category's related guides, under its tools (2026-10-05) — the same list
// the /tools page shows for the category (scripts/lib/guideShelves.js).
function renderGuides(meta, shelf) {
  if (!shelf || !shelf.guides.length) return '';
  return `
      <section class="tcp-guides" aria-labelledby="tcp-guides-h">
        <h2 id="tcp-guides-h">${escHtml(meta.name)} guides</h2>
${guideListHtml(shelf.guides, '        ')}
      </section>
`;
}

function renderCategoryPage(meta, toolsInCat, guideShelf, overview, toolIds) {
  const sorted = [...toolsInCat].sort((a, b) => a.title.localeCompare(b.title));
  const cardsHtml = sorted.map(t => {
    const image = hasScrambleArt(t.id)
      ? `<img src="/scramble/${escHtml(t.id)}.webp" alt="" class="tcp-card-image" loading="lazy">`
      : `<div class="tcp-card-fallback" aria-hidden="true"><span>${escHtml(t.icon || '✦')}</span></div>`;
    return `        <a href="/${escHtml(t.id)}" class="tcp-card">
          <div class="tcp-card-image-wrap">${image}</div>
          <div class="tcp-card-copy">
            <div class="tcp-card-title-row">
              <h2>${escHtml(t.title)}</h2><span class="tcp-arrow" aria-hidden="true">→</span>
            </div>
            <p>${escHtml(t.tagline || t.description || '')}</p>
          </div>
        </a>`;
  }).join('\n');

  return renderHead({
    title: `${heading(meta.name)} — DeftBrain`,
    description: meta.desc,
    canonicalPath: `/tools/${meta.slug}`,
  }) + `

  <main class="tcp-page">
    <div class="tcp-shell">

      <a href="/tools" class="tcp-back">← All tools</a>

      <div class="tcp-eyebrow"><span class="tcp-emoji" aria-hidden="true">${escHtml(meta.emoji)}</span><span>${escHtml(meta.name)}</span></div>

      <h1>${escHtml(heading(meta.name))}</h1>

      <p class="tcp-count">${sorted.length} tool${sorted.length === 1 ? '' : 's'}</p>

      <div class="tcp-grid">
${cardsHtml}
      </div>

${renderOverview(overview, toolIds)}${renderFaq(meta)}${renderGuides(meta, guideShelf)}
      <p class="tcp-outro"><a href="/ToolFinder">Try Tool Finder →</a></p>

    </div>
  </main>
  ${GUIDE_LIST_NOSCRIPT}
  ${GUIDE_LIST_SCRIPT}
${renderFooter()}`;
}

function main() {
  console.log('🗂️  Building tool category pages...');
  const categories = loadCategories();
  const tools = loadTools();
  if (!categories.length) { console.warn('  ⚠ No categories found in categoryMeta.js.'); return; }
  if (!tools.length) { console.warn('  ⚠ No tools found in tools.js.'); return; }

  const guideShelves = buildGuideShelves(tools, categoriesFor);
  const overviews = loadOverviews();
  const toolIds = new Set(tools.map(t => t.id));
  fs.mkdirSync(BUILD_DIR, { recursive: true });

  let count = 0;
  for (const meta of categories) {
    if (!meta.slug) { console.warn(`  ⚠ Skipping "${meta.name}" — no slug in categoryMeta.js.`); continue; }
    const toolsInCat = tools.filter(t => categoriesFor(t).includes(meta.name));
    const guideShelf = guideShelves[meta.name];
    if (!toolsInCat.length) { console.warn(`  ⚠ Skipping /tools/${meta.slug} — no tools in "${meta.name}".`); continue; }

    const dir = path.join(BUILD_DIR, meta.slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), renderCategoryPage(meta, toolsInCat, guideShelf, overviews[meta.name], toolIds), 'utf8');
    console.log(`  ✓ build/tools/${meta.slug}/index.html — ${toolsInCat.length} tools`);
    count++;
  }

  console.log(`📑  Wrote ${count} tool category page(s).`);
}

main();
