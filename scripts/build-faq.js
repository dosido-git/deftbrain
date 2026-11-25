#!/usr/bin/env node
// Renders faq/pages.js → public/faq/<slug>.html + public/sitemap-faq.xml.
// Generated files are committed (same convention as privacy.html).
//
//   node scripts/build-faq.js          # write
//   node scripts/build-faq.js --check  # fail if committed output is stale (pre-push)
//
// Page rules (the point of the test — see faq/pages.js): title = the question,
// no brand suffix, no JSON-LD, answer first.

const fs = require('fs');
const path = require('path');
const { getFooterHTML, getSiteHeaderHTML } = require('../src/seo/chrome');
const { GA_SNIPPET } = require('./lib/gaSnippet');
const { THEME_SNIPPET } = require('./lib/themeSnippet');
const { linksToHtml } = require('../src/utils/inlineLinks');
const pages = require('../faq/pages');
const TOPICS = require('../faq/topics');

const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'public', 'faq');
const SITEMAP = path.join(ROOT, 'public', 'sitemap-faq.xml');
const SITE = 'https://deftbrain.com';

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fmtDate = iso => new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });

function validate(p) {
  const bad = [];
  if (!/^[a-z0-9-]+$/.test(p.slug)) bad.push('slug');
  if (!p.question.endsWith('?')) bad.push('question must end with ?');
  if (!p.answer || !p.paras.length || !p.sources.length) bad.push('answer/paras/sources required');
  if (!TOPICS[p.topic]) bad.push(`unknown topic "${p.topic}" (add it to faq/topics.js)`);
  if (bad.length) throw new Error(`faq/${p.slug}: ${bad.join(', ')}`);
}
const slugs = new Set();
for (const p of pages) {
  validate(p);
  if (slugs.has(p.slug)) throw new Error(`duplicate slug ${p.slug}`);
  slugs.add(p.slug);
}

function render(p) {
  const url = `${SITE}/faq/${p.slug}`;
  const topic = TOPICS[p.topic];
  const others = pages.filter(o => o.topic === p.topic && o.slug !== p.slug)
    .map(o => `          <li><a href="/faq/${o.slug}">${esc(o.question)}</a></li>`).join('\n');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  ${GA_SNIPPET}
  ${THEME_SNIPPET}

  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>${esc(p.question)}</title>
  <meta name="description" content="${esc(p.answer)}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${url}">

  <meta property="og:type"        content="article">
  <meta property="og:title"       content="${esc(p.question)}">
  <meta property="og:description" content="${esc(p.answer)}">
  <meta property="og:url"         content="${url}">
  <meta property="og:site_name"   content="DeftBrain">
  <meta property="article:modified_time" content="${p.modified}">

  <link rel="stylesheet" href="/fonts/playfair-display/playfair-display.css">
  <link rel="stylesheet" href="/fonts/dm-sans/dm-sans.css">
  <link rel="stylesheet" href="/guides/guide.css">
  <style>
    .faq-more { margin: 40px 0 0; }
    .faq-more ul { padding-inline-start: 1.2rem; line-height: 1.8; }
    .faq-more a, .lede a { color: var(--deft-blue, #165b9a); text-decoration: underline; text-underline-offset: 2px; }
  </style>
</head>
<body>

  ${getSiteHeaderHTML()}

  <main>
    <div class="container">

      <div class="eyebrow">
        <a class="tag" href="${topic.eyebrowHref}">${esc(topic.eyebrow)}</a>
        <div class="eyebrow-rule"></div>
      </div>

      <h1>${esc(p.question)}</h1>

      <p class="deck">${esc(p.answer)}</p>

      <p class="meta-line">Updated ${fmtDate(p.modified)} · By the DeftBrain team</p>

${p.paras.map(t => `      <p class="lede">${linksToHtml(t, esc)}</p>`).join('\n')}
      <p class="lede">${linksToHtml(topic.close, esc)}</p>

      <div class="guide-sources">
        <p class="guide-sources-label">Sources</p>
        <ul>
${p.sources.map(s => `          <li><a href="${esc(s.url)}" rel="noopener" target="_blank">${esc(s.label)}</a></li>`).join('\n')}
        </ul>
      </div>

      <div class="faq-more">
        <p class="guide-sources-label">${esc(topic.more)}</p>
        <ul>
${others}
        </ul>
      </div>

    </div>
  </main>

${getFooterHTML()}

</body>
</html>
`;
}

const files = new Map(pages.map(p => [path.join(OUT_DIR, `${p.slug}.html`), render(p)]));
files.set(SITEMAP, `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(p => `  <url>
    <loc>${SITE}/faq/${p.slug}</loc>
    <lastmod>${p.modified}</lastmod>
  </url>`).join('\n')}
</urlset>
`);

if (process.argv.includes('--check')) {
  const stale = [...files].filter(([f, html]) => !fs.existsSync(f) || fs.readFileSync(f, 'utf8') !== html);
  const known = new Set(files.keys());
  const extra = fs.existsSync(OUT_DIR) ? fs.readdirSync(OUT_DIR).map(f => path.join(OUT_DIR, f)).filter(f => !known.has(f)) : [];
  if (stale.length || extra.length) {
    console.error('\n❌ public/faq is out of date with faq/pages.js:');
    for (const [f] of stale) console.error('   stale: ' + path.relative(ROOT, f));
    for (const f of extra) console.error('   not in faq/pages.js: ' + path.relative(ROOT, f));
    console.error('   Fix: node scripts/build-faq.js && git add faq public/faq public/sitemap-faq.xml\n');
    process.exit(1);
  }
  console.log(`✓ public/faq matches faq/pages.js (${pages.length} pages)`);
  process.exit(0);
}

fs.rmSync(OUT_DIR, { recursive: true, force: true });
fs.mkdirSync(OUT_DIR, { recursive: true });
for (const [f, html] of files) fs.writeFileSync(f, html);
console.log(`✓ ${pages.length} FAQ pages → public/faq/, sitemap-faq.xml`);
