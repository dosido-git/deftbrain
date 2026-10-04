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
// The fallback meta description for any page without its own. Kept in step
// with public/index.html, and free of the machinery — the homepage already
// says "guided experiences", and the machinery stays out of it.
const DEFAULT_DESCRIPTION = "Interactive guidance for life's awkward, confusing, and curious moments. 120+ free guided experiences — read a lease, check a repair quote, spot a scam, prepare for a doctor visit. No signup, nothing stored.";
// ?v=2: the image was redrawn 2026-10-02; the query makes social sites,
// which cache share images by URL, fetch the new one.
const DEFAULT_OG_IMAGE = `${SITE_URL}/og/default.png?v=2`;

// Source of truth: src/data/tool-og-slugs.json — single shared map
// imported by prerender.js, useDocumentHead.js, and generate-og.py.
// Adding a new tool? Add its slug entry there.
const TOOL_OG_SLUGS = require(path.join(ROOT, 'src', 'data', 'tool-og-slugs.json'));

// ── Tools keep-list (SEO concentration, 2026-07) ──
// Union of focus+keepers = the INDEXABLE tool set. Every other tool page stays
// fully live for users but gets <meta name="googlebot" content="noindex"> so
// Google sees a small, deliberate footprint instead of 122 template siblings.
// generate-sitemap.js filters the sitemap from the SAME file, and
// check-sitemap-urls.js asserts sitemap ∩ noindex = ∅. Missing file = hard
// fail (a build that noindexes nothing while the sitemap assumes it would).
const TOOLS_KEEP_LIST = require(path.join(ROOT, 'src', 'data', 'tools-keep-list.json'));
const INDEXABLE_TOOLS = new Set([...(TOOLS_KEEP_LIST.focus || []), ...(TOOLS_KEEP_LIST.keepers || [])]);

function getOgImage(toolId) {
  const slug = TOOL_OG_SLUGS[toolId];
  return slug ? `${SITE_URL}/og/${slug}.png` : DEFAULT_OG_IMAGE;
}

// ─── Static React routes: /tools and /organizations (2026-10-03) ─────────────
// These two pages are React routes with no file of their own, so the server
// used to send build/index.html — the HOMEPAGE variant — for them. Crawlers
// therefore saw the homepage's title and description, a canonical pointing at
// the homepage, and no <h1>: /tools (the page that links every category) read
// as a duplicate of /. Each now gets its own file with its own head and a
// static body that mirrors what the React page renders (no cloaking); React
// replaces #root on load as it does for tool pages.
// MUST match the runtime titles in AllToolsPage.js / OrganizationsPage.js.
function loadCategoryMeta() {
  const src  = fs.readFileSync(path.join(ROOT, 'src', 'data', 'categoryMeta.js'), 'utf8');
  const body = src.replace(/\bexport\s+const\b/g, 'const');
  // eslint-disable-next-line no-new-func
  return new Function(`${body}\n;return typeof CATEGORY_META !== 'undefined' ? CATEGORY_META : [];`)();
}

function injectPageMeta(template, { pathName, title, description }) {
  const canonical = `${SITE_URL}/${pathName}`;
  const t = escapeHtml(title), d = escapeHtml(description), u = escapeHtml(canonical), img = escapeHtml(DEFAULT_OG_IMAGE);
  const metaBlock = [
    `<title>${t}</title>`,
    `<meta name="robots" content="index, follow" />`,
    `<meta name="description" content="${d}" />`,
    `<link rel="canonical" href="${u}" />`,
    `<meta property="og:title" content="${t}" />`,
    `<meta property="og:description" content="${d}" />`,
    `<meta property="og:url" content="${u}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:image" content="${img}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${t}" />`,
    `<meta name="twitter:description" content="${d}" />`,
    `<meta name="twitter:image" content="${img}" />`,
    `<meta name="twitter:site" content="@deftbrain" />`,
    `<meta name="author" content="DeftBrain.com" />`,
  ].join('\n    ');
  let html = template;
  html = html.replace(/<title>[^<]*<\/title>/gi, '');
  html = html.replace(/<meta\s+name="description"[^>]*>/gi, '');
  html = html.replace(/<meta\s+name="author"[^>]*>/gi, '');
  html = html.replace(/<meta\s+name="(robots|googlebot)"[^>]*>/gi, '');
  html = html.replace(/<meta\s+property="og:[^"]*"[^>]*>/gi, '');
  html = html.replace(/<meta\s+name="twitter:[^"]*"[^>]*>/gi, '');
  html = html.replace(/<link\s+rel="canonical"[^>]*>/gi, '');
  html = html.replace(/<script\s+type="application\/ld\+json">[\s\S]*?<\/script>/gi, '');
  return html.replace('</head>', `    ${metaBlock}\n  </head>`);
}

const STATIC_H1 = 'font-size:2rem;font-weight:600;margin:0 0 .35rem;color:#0f172a';
const STATIC_H2 = 'font-size:1.15rem;font-weight:600;margin:1.75rem 0 .5rem;color:#0f172a';

function toolsPageHTML(categories, countLabel) {
  const e = escapeHtml;
  const cats = categories.map(c =>
    `<li style="margin:.4rem 0;line-height:1.55"><a href="/tools/${e(c.slug)}">${e(c.name)}</a> — ${e(c.desc || '')}</li>`).join('');
  return `<main class="seo-prerender" style="max-width:860px;margin:0 auto;padding:2rem 1rem">`
    + `<h1 style="${STATIC_H1}">DeftBrain Toolbox</h1>`
    + `<p style="font-size:1.1rem;color:#475569;margin:0 0 1rem">There’s probably a tool for that! ${e(countLabel)} free guided experiences for life’s awkward, confusing, and curious moments.</p>`
    + `<h2 style="${STATIC_H2}">Browse by topic</h2><ul style="padding-left:1.25rem;margin:0">${cats}</ul>`
    + `</main>`;
}

function organizationsPageHTML() {
  return `<main class="seo-prerender" style="max-width:860px;margin:0 auto;padding:2rem 1rem">`
    + `<h1 style="${STATIC_H1}">Practical help for the things life throws at your people.</h1>`
    + `<p style="line-height:1.6;margin:0 0 1rem">DeftBrain gives employees, members, patrons, and communities an easy way to explore everyday situations they're facing — the possibilities, alternatives, things they might not have considered.</p>`
    + `<h2 style="${STATIC_H2}">Help that doesn't fit neatly into a benefits category.</h2>`
    + `<p style="line-height:1.6;margin:0">People bring the rest of their lives with them—to work, to school, to the library, and everywhere else. A confusing bill. A difficult conversation. A suspicious message. A major purchase. A medical appointment. A problem with a landlord. DeftBrain gives them somewhere to start.</p>`
    + `<h2 style="${STATIC_H2}">Simple enough for anyone to use.</h2>`
    + `<ol style="padding-left:1.25rem;margin:0"><li>Choose what's going on. No prompt writing.</li><li>Answer a few thoughtful questions.</li><li>Get practical guidance: clear thinking, useful questions, and real options to weigh.</li></ol>`
    + `<p style="line-height:1.6;margin:1rem 0 0"><a href="/tools">Explore all DeftBrain tools</a> · <a href="mailto:Org@deftbrain.com?subject=DeftBrain%20for%20Organizations">Bring DeftBrain to your organization</a></p>`
    + `</main>`;
}

// Runtime twins: useDocumentHead calls in AllToolsPage.js / OrganizationsPage.js.
const STATIC_PAGES = {
  tools: {
    title: 'DeftBrain Toolbox — Free Guided Experiences, A–Z | DeftBrain',
    description: (count) => `Browse ${count} free guided experiences, A–Z or by topic: read a lease, check a repair quote, spot a scam, prepare for a hard conversation.`,
  },
  organizations: {
    title: 'For Organizations — Practical Everyday Guidance | DeftBrain',
    description: () => 'Give employees, members, patrons, and communities an easy way to explore everyday situations: confusing bills, hard conversations, suspicious messages.',
  },
};

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
      faq:            Array.isArray(t.faq) ? t.faq : null,
      exampleOutput:  t.exampleOutput || null,
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

// n was 6. Six naked tool names at the end of a focused result read as a menu
// the reader has to work through, and dilute the one transition the tool
// actually wants to offer. Two keeps the interlink without the noise — the
// guide and hub blocks above it are where the internal linking really lives,
// and they are untouched.
//
// This function is mirrored in the other file of this pair (src/components/
// RelatedLinks.js and scripts/prerender.js). Users and crawlers must see the
// same links, so change n in BOTH or not at all.
//
// GENERIC_TAGS: excluded from counting toward `tg` because a single shared
// occurrence of one of these, combined with one shared broad category (Me,
// The Grind), was enough to pass tg>=1 && ct>=1 for tools with nothing
// substantively in common — SensoryScout <-> FinalWish via "planning" + "Me"
// (found 2026-09-09; SensoryScout is about sensory prep for an outing,
// FinalWish is end-of-life/estate planning). Verified via a full pairwise
// catalog audit that every OTHER single-shared-tag match in the catalog is
// thematically coherent, including ones sharing an equally broad category —
// e.g. "death" + "Me" between GriefGuide/FinalWish is a genuinely sensible
// pairing, because "death" (unlike "planning") is specific to both tools'
// actual subject matter. Extend this list only when a re-run of that same
// audit turns up another offender, not preemptively — removing a tag here
// silently weakens every genuine connection that tag was carrying too.
// 'my boss' / 'my manager' (2026-09-26) are search-only tags on six
// workplace tools — shared by all six, so without this they'd re-pair those
// tools as each other's related links on a thin "both involve a boss" basis.
const GENERIC_TAGS = new Set(['planning', 'my boss', 'my manager']);

function relatedTools(tool, all, n = 2) {
  const tags = new Set((tool.tags || []).map(s => s.toLowerCase()).filter(t => !GENERIC_TAGS.has(t)));
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
    .map(t => `<a href="/${t.id}" style="color:#165b9a;text-decoration:none;font-weight:500">${escapeHtml(t.title)}</a>`)
    .join('\n        ');
  return `<nav class="db-related" aria-label="Related tools" style="margin:0 0 20px">
      <h2 style="font-size:12px;text-transform:uppercase;letter-spacing:.1em;color:#6e675c;margin:0 0 12px;font-weight:700">Related tools</h2>
      <div style="display:flex;flex-wrap:wrap;gap:10px 16px;font-size:14px;line-height:1.5">
        ${links}
      </div>
    </nav>`;
}

// Visible "Related guides" block — mirrors getRelatedHTML (Related tools) for
// ─── Category hubs ────────────────────────────────────────────────────────────
// The 18 hubs absorb 381 consolidation redirects and, before 2026-08-08, had
// exactly ONE inbound internal link each — from /guides. The homepage linked
// ten individual articles and zero hubs; no tool page linked one at all. The
// redirects told Google these pages matter while the link graph said they did
// not. These two blocks resolve that contradiction.
//
// Names are read from build-guides-indexes.js rather than restated here, so a
// renamed category cannot silently desync the two files.
function loadHubNames() {
  try {
    const src = fs.readFileSync(path.join(__dirname, 'build-guides-indexes.js'), 'utf8');
    const block = src.slice(src.indexOf('const CATEGORY_META'), src.indexOf('\n};', src.indexOf('const CATEGORY_META')));
    const out = {};
    for (const m of block.matchAll(/(\w+):\s*\{\s*\n\s*name:\s*'([^']+)'/g)) out[m[1]] = m[2];
    return out;
  } catch { return {}; }
}
const HUB_NAMES = loadHubNames();

// Tool page → the hub(s) its own guides live in. Derived from the guides
// themselves, so the link is always topically relevant and never hand-mapped.
function getToolHubsHTML(guides) {
  if (!guides || !guides.length) return '';
  const cats = [...new Set(guides.map(g => g.category))].filter(c => HUB_NAMES[c]).slice(0, 3);
  if (!cats.length) return '';
  const links = cats
    .map(c => `<a href="/guides/${c}" style="color:#165b9a;text-decoration:none;font-weight:600">${escapeHtml(HUB_NAMES[c])} guides &rarr;</a>`)
    .join('\n        ');
  return `<nav class="db-tool-hubs" aria-label="Guide categories for this tool" style="margin:0 0 20px">
      <div style="display:flex;flex-wrap:wrap;gap:10px 16px;font-size:14px;line-height:1.5">
        ${links}
      </div>
    </nav>`;
}

// visual consistency. Links a tool page to a few of its own guides so authority
// flows from the (higher-authority) tool pages into the guides cluster. Capped at
// `n` and only rendered when the tool actually has guides, to keep the footer tidy.
function getRelatedGuidesHTML(guides, n = 4) {
  if (!guides || !guides.length) return '';
  const links = guides.slice(0, n)
    .map(g => `<a href="/guides/${g.category}/${g.slug}" style="color:#165b9a;text-decoration:none;font-weight:500">${escapeHtml(g.title)}</a>`)
    .join('\n        ');
  return `<nav class="db-related-guides" aria-label="Related guides" style="margin:0 0 20px">
      <h2 style="font-size:12px;text-transform:uppercase;letter-spacing:.1em;color:#6e675c;margin:0 0 12px;font-weight:700">Related guides</h2>
      <div style="display:flex;flex-wrap:wrap;gap:10px 16px;font-size:14px;line-height:1.5">
        ${links}
      </div>
    </nav>`;
}

// Homepage featured-tools block — link-equity concentration for the focus tools
// (tools-keep-list.json). The homepage is the highest-authority page; the 18
// focus tools get first-position, keyword-adjacent links ahead of the guides
// sample and the global all-tools index. Mirrored by RelatedLinks.js for SPA
// parity (same pattern as the guides sample below).
//
// The heading was "Start here" until 2026-08-08, which was written for the
// crawler's view and wrong for everyone else's. This block IS first inside
// #root, so Googlebot reads it first — but React replaces #root on mount and
// RelatedLinks re-renders it in the FOOTER, so a reader met "Start here" at the
// very bottom, under the whole catalog it was meant to introduce, offering 18
// choices. The links carry the SEO value; the heading text carries none, so
// naming it honestly costs nothing.
// The homepage's static HTML had no <h1> (Bing Site Scan, 2026-10-04) — the
// React hero has one, but React replaces #root on load. Same text as
// HomeIntro.js's <h1 id="home-title"> plus its positioning line; keep in sync.
const HOME_H1 = '<h1 style="font-size:2rem;font-weight:600;margin:0 0 .35rem;color:#0f172a">Life doesn’t come with instructions.</h1>'
  + '<p style="font-size:1.1rem;color:#475569;margin:0 0 1rem">Interactive guidance for life’s awkward, confusing, and curious moments: understanding a document, preparing for a conversation, making a decision, or exploring an idea.</p>';

function getHomeStaticHTML(categories) {
  const e = escapeHtml;
  const cats = categories.map(c =>
    `<li style="margin:.3rem 0"><a href="/tools/${e(c.slug)}">${e(c.name)}</a></li>`).join('');
  return `<nav aria-label="Primary" style="margin:0 0 1.5rem"><a href="/tools">Tools</a> · <a href="/guides">Guides</a> · <a href="/about">About</a> · <a href="/organizations">Organizations</a></nav>`
    + `<h2 style="font-size:1.15rem;font-weight:600;margin:1.75rem 0 .5rem;color:#0f172a">Explore by category</h2><ul style="padding-left:1.25rem;margin:0">${cats}</ul>`;
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
function buildJsonLd({ id, title, description, faq }) {
  const obj = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: title,
    description,
    url: `${SITE_URL}/${id}`,
    applicationCategory: 'UtilityApplication',
    operatingSystem: 'Web',
    inLanguage: ['en', 'es', 'zh', 'hi', 'ar', 'pt', 'fr', 'de', 'ja', 'ko', 'ru', 'th', 'vi'],
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD',
              availability: 'https://schema.org/InStock' },
    // Reference the canonical entities by @id rather than restating a
    // name+url stub on all 125 pages. The nodes themselves are defined once,
    // in the homepage @graph (public/index.html). Repeating a stub per page
    // invites a crawler to treat each as a separate publisher; an @id
    // reference resolves to one entity across the whole site, which is what
    // an AI retrieval system needs to answer "what is DeftBrain".
    isPartOf:  { '@id': `${SITE_URL}/#website` },
    publisher: { '@id': `${SITE_URL}/#organization` },
  };
  const json = JSON.stringify(obj, null, 2).replace(/</g, '\\u003c');
  let out = `<script type="application/ld+json">${json}</script>`;
  // FAQPage markup for enriched tools. Google restricts FAQ *rich results* to
  // high-authority sites, but the markup is valid and makes the question
  // coverage machine-readable.
  //
  // This is only legitimate while the same Q&As are VISIBLE on the rendered
  // page. They were not, between 3ca6667a and today: the static block below
  // lives inside #root and React replaces it, and the React copy lived in the
  // guide sidebar until that sidebar was distilled to the nutshell. Structured
  // data then described content neither a visitor nor a JS-rendering crawler
  // could see. src/components/ToolFaq.js is the mirror that makes this honest —
  // if it is ever removed, remove this block with it.
  if (Array.isArray(faq) && faq.length) {
    const faqObj = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faq.map(f => ({
        '@type': 'Question',
        name: String(f.q),
        acceptedAnswer: { '@type': 'Answer', text: String(f.a) },
      })),
    };
    const faqJson = JSON.stringify(faqObj, null, 2).replace(/</g, '\\u003c');
    out += `\n    <script type="application/ld+json">${faqJson}</script>`;
  }
  return out;
}

function injectMeta(template, { id, title, description, tagline, seoTitle, seoDescription, faq }) {
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

  // Keep-list gate: non-indexable tools stay live for users but tell crawlers
  // not to index them. Everything else (title/OG/canonical) is kept so shared
  // links still unfurl correctly — noindex only affects search inclusion.
  // Exactly ONE robots tag per page: the template's base tag is stripped below,
  // so noindexed pages no longer ship a conflicting "index, follow" alongside
  // the noindex (Google resolved it correctly — most restrictive wins — but
  // one unambiguous directive beats relying on conflict resolution).
  // Scoped to GOOGLEBOT, not all robots (2026-08-02). The keep-list exists to
  // protect Google's site-quality signal — that is where indexing collapsed to
  // ~67 pages. A bare `robots` directive applies to every crawler, so it also
  // cost Bing, which was indexing the whole catalogue happily and which feeds
  // ChatGPT Search and Copilot. Naming googlebot keeps the Google-facing
  // concentration exactly as it was and gives the other engines their pages
  // back. Indexable pages keep the all-crawler "index, follow": there is
  // nothing to scope when the answer is yes to everyone.
  const robotsTag = INDEXABLE_TOOLS.has(id)
    ? [`<meta name="robots" content="index, follow" />`]
    : [`<meta name="googlebot" content="noindex" />`];

  const metaBlock = [
    `<title>${safeTitle}</title>`,
    ...robotsTag,
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

  const jsonLd = buildJsonLd({ id, title, description: metaDesc, faq });

  let html = template;

  // Strip existing tags that we'll replace with tool-specific versions
  html = html.replace(/<title>[^<]*<\/title>/gi, '');
  html = html.replace(/<meta\s+name="description"[^>]*>/gi, '');
  html = html.replace(/<meta\s+name="author"[^>]*>/gi, '');
  html = html.replace(/<meta\s+name="(robots|googlebot)"[^>]*>/gi, '');
  html = html.replace(/<meta\s+property="og:[^"]*"[^>]*>/gi, '');
  html = html.replace(/<meta\s+name="twitter:[^"]*"[^>]*>/gi, '');
  html = html.replace(/<link\s+rel="canonical"[^>]*>/gi, '');
  // Drop the inherited site-level WebApplication JSON-LD; replace with per-tool.
  html = html.replace(/<script\s+type="application\/ld\+json">[\s\S]*?<\/script>/gi, '');
  html = html.replace('</head>', `    ${metaBlock}\n    ${jsonLd}\n  </head>`);

  return html;
}

// The crawlable all-tools index that used to follow every footer is gone
// (2026-10-04, owner: "everything unnecessary or repetitive"). Every page's
// header links Tools and Categories, the home page's HTML links the 14
// category pages, each category page links its tools, and the sitemaps list
// everything. This only strips a copy a cached build/ may still hold.
function stripToolIndex(html) {
  return html.replace(/\s*<footer class="db-tool-index"[\s\S]*?<\/footer>/g, '');
}

// Static, tool-specific body content. The CRA shell ships an empty <div id="root">,
// so crawlers' first pass (and JS-off clients) saw no on-page content — only the
// shared footer index, identical across all tools. This mirrors the guide section
// ToolPageWrapper already renders (h1 → description → overview → how-to → example →
// tips → pitfalls), so it's the SAME content the page shows (no cloaking). Injected
// INSIDE #root: the app mounts with createRoot().render(), which REPLACES the
// container's contents on load — so there's no hydration mismatch; React simply
// swaps this for the live app. Keep in sync with ToolPageWrapper's guide layout.
function buildBodyContent({ title, tagline, description, guide, faq, exampleOutput }) {
  const e = escapeHtml;
  const H2 = 'font-size:1.15rem;font-weight:600;margin:1.75rem 0 .5rem;color:#0f172a';
  const LI = 'margin:.4rem 0;line-height:1.55';
  const out = [];

  out.push(`<h1 style="font-size:2rem;font-weight:600;margin:0 0 .35rem;color:#0f172a">${e(title)}</h1>`);
  if (tagline)     out.push(`<p style="font-size:1.1rem;color:#475569;margin:0 0 1rem">${e(tagline)}</p>`);
  if (description) out.push(`<p style="line-height:1.6;margin:0 0 1rem">${e(description)}</p>`);

  const g = guide || {};
  // A reviewed, public demonstration of the product's actual output. This is
  // sourced from the same tools.js object the React tool renders.
  if (exampleOutput) {
    const x = exampleOutput;
    const sections = Array.isArray(x.sections) ? x.sections.map(section => {
      const body = Array.isArray(section.items)
        ? `<ul style="padding-left:1.25rem;margin:.35rem 0 0">${section.items.map(item => `<li style="${LI}">${e(String(item))}</li>`).join('')}</ul>`
        : `<p style="line-height:1.6;margin:.25rem 0 0">${e(String(section.text || ''))}</p>`;
      return `<h3 style="font-size:1rem;font-weight:600;margin:1.1rem 0 .2rem;color:#0f172a">${e(String(section.label || ''))}</h3>${body}`;
    }).join('') : '';
    out.push(`<section aria-label="Example tool analysis">`
      + `<h2 style="${H2}">${e(String(x.title || 'Example analysis'))}</h2>`
      + (x.intro ? `<p style="line-height:1.6;margin:0 0 .8rem">${e(x.intro)}</p>` : '')
      + (x.sampleText ? `<p style="font-size:.9rem;font-weight:600;margin:.8rem 0 .2rem">${e(x.sampleLabel || 'Sample input')}</p><blockquote style="line-height:1.6;margin:.2rem 0 1rem;padding:.75rem 1rem;border-left:3px solid #94a3b8;background:#f8fafc">${e(x.sampleText)}</blockquote>` : '')
      + (x.context ? `<p style="font-size:.85rem;color:#64748b;margin:-.5rem 0 .75rem">${e(x.context)}</p>` : '')
      + sections
      + (x.nextStep ? `<h3 style="font-size:1rem;font-weight:600;margin:1.1rem 0 .2rem;color:#0f172a">${e(x.nextStepLabel || 'What happens with your lease')}</h3><p style="line-height:1.6;margin:.25rem 0 0">${e(x.nextStep)}</p>` : '')
      + (x.disclaimer ? `<p style="font-size:.82rem;color:#64748b;line-height:1.5;margin:1rem 0 0">${e(x.disclaimer)}</p>` : '')
      + `</section>`);
  }

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
  // FAQ — focus-tools enrichment (2026-07). Mirrored by
  // src/components/ToolFaq.js, so crawler and user see identical copy. It used
  // to say "the React guide aside" and that stopped being true when the
  // sidebar was stripped; the mirror moved, the guarantee did not.
  if (Array.isArray(faq) && faq.length) {
    const items = faq.map(f =>
      `<h3 style="font-size:1rem;font-weight:600;margin:1.1rem 0 .3rem;color:#0f172a">${e(String(f.q))}</h3>`
      + `<p style="line-height:1.6;margin:0">${e(String(f.a))}</p>`).join('');
    out.push(`<h2 style="${H2}">Frequently asked questions</h2>${items}`);
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

  console.log(`\nPrerendering ${tools.length} tool pages...\n`);

  // Clean up legacy directory-based prerender output before writing flat files.
  // Directories named after tool IDs (e.g. build/SpiralStopper/index.html) cause
  // static servers to serve /SpiralStopper/ as 200, creating trailing-slash duplicates
  // that confuse Google. Flat files (build/SpiralStopper.html) have no slash variant.
  //
  // Only removes a directory whose name is an ACTUAL tool id — the literal
  // legacy artifact this exists to clean — never a blanket "delete anything
  // we don't recognize" pass. An allowlist-based version of this (protect
  // 'static' + every directory that came from public/, delete everything
  // else) used to live here; it silently ate any OTHER legitimate directory
  // a later postbuild script writes with no public/ counterpart. build/tools/
  // {slug} (build-tools-category-pages.js) has none, so when this script
  // runs a SECOND time, standalone, after the full `npm run build` pipeline
  // already completed once (a redundant leftover in Railway's own configured
  // build command — "npm run build && node scripts/prerender.js" — predating
  // prerender.js's move into package.json's postbuild chain), that second
  // pass deleted the whole directory and nothing after it in that standalone
  // invocation ever regenerated it: 14 live category pages silently 404ing
  // in production while every other page on the site looked fine
  // (2026-09-23). Matching against real tool ids can't reproduce that
  // failure — it has no opinion on directories it doesn't know are tool
  // output, so it only ever removes what it actually put there.
  const toolIds = new Set(tools.map(t => t.id));
  for (const entry of fs.readdirSync(BUILD_DIR)) {
    if (!toolIds.has(entry)) continue;
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
        + getRelatedGuidesHTML(guidesByTool[tool.id])
        + getToolHubsHTML(guidesByTool[tool.id]);
      const html = stripToolIndex(injectBody(injectMeta(template, tool), tool, relatedBlocks));
      fs.writeFileSync(path.join(BUILD_DIR, `${tool.id}.html`), html, 'utf8');
      console.log(`  OK  /${tool.id}`);
      succeeded++;
    } catch (err) {
      console.error(`  FAIL  /${tool.id}  ->  ${err.message}`);
      failed++;
    }
  }

  // The homepage's static HTML: what the page itself shows a reader (its
  // heading, the site's sections, Explore by category), so a crawler's first
  // read links what a person can see — and the 14 category pages, from which
  // every tool is one more link away (2026-10-04).
  try {
    const homepageHtml = stripToolIndex(
      template.replace('<div id="root"></div>', `<div id="root">${HOME_H1}${getHomeStaticHTML(loadCategoryMeta())}</div>`));
    fs.writeFileSync(templatePath, homepageHtml, 'utf8');
    console.log('  OK  / (homepage)');
    succeeded++;
  } catch (err) {
    console.error(`  FAIL  / homepage  ->  ${err.message}`);
    failed++;
  }

  // /tools and /organizations — see STATIC_PAGES above.
  const countLabel = `${Math.floor(tools.length / 10) * 10}+`;
  const categories = loadCategoryMeta();
  for (const [pathName, body] of [['tools', toolsPageHTML(categories, countLabel)], ['organizations', organizationsPageHTML()]]) {
    try {
      const meta = STATIC_PAGES[pathName];
      const html = stripToolIndex(
        injectPageMeta(template, { pathName, title: meta.title, description: meta.description(countLabel) })
          .replace('<div id="root"></div>', `<div id="root">${body}</div>`));
      fs.writeFileSync(path.join(BUILD_DIR, `${pathName}.html`), html, 'utf8');
      console.log(`  OK  /${pathName}`);
      succeeded++;
    } catch (err) {
      console.error(`  FAIL  /${pathName}  ->  ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone: ${succeeded} pages generated, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

main().catch(err => {
  console.error('prerender failed:', err);
  process.exit(1);
});
