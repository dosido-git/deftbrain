// src/seo/chrome.js
//
// Shared HTML chrome for build-time HTML generators.
// Consumed by:
//   - src/seo/PageTemplate.js          (tool prerender)
//   - scripts/build-guides.js          (guide articles)
//   - scripts/build-guides-indexes.js  (guide hub pages)
//
// React pages render src/components/Footer.js, which produces the same
// visual design via React. The two have to stay visually aligned by hand —
// they are different beasts (runtime JSX vs. build-time HTML strings) and
// don't share code. If you change one, change the other.
//
// This module exists to eliminate footer-markup drift across the three
// build-time generators. Edit getFooterHTML() once, all three pick it up.


const fs = require('fs');
const path = require('path');

// Parse src/data/tools.js for { id, title } of every tool. Shared by the tool
// prerenderer and the guide builder so the crawlable tool index stays identical.
function getToolList() {
  const file = path.join(__dirname, '..', 'data', 'tools.js');
  const content = fs.readFileSync(file, 'utf8');
  // Key may be quoted ("id":) or unquoted (id:) — tolerate both.
  const titleRe = /["']?\btitle\b["']?\s*:\s*['"]([^'"]+)['"]/;
  const idRe = /["']?\bid\b["']?\s*:\s*['"]([^'"]+)['"]/g;
  const out = [];
  const seen = new Set();
  let m;
  while ((m = idRe.exec(content)) !== null) {
    const id = m[1];
    if (!id || seen.has(id)) continue;
    const chunk = content.slice(m.index, Math.min(content.length, m.index + 600));
    const tm = titleRe.exec(chunk);
    seen.add(id);
    out.push({ id, title: (tm ? tm[1] : id).trim() });
  }
  return out;
}

// A real, crawlable <a href> index of every tool. Injected into the static HTML
// of the homepage, every tool page, and every guide — placed OUTSIDE the React
// root so hydration ignores it. Fixes the orphaned-tools internal-linking problem
// (the SPA's homepage tool links are client-rendered, so crawlers saw none).
function getToolIndexHTML(tools) {
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const links = tools
    .map(t => `<a href="/${t.id}" style="color:#2c4a6e;text-decoration:none">${esc(t.title)}</a>`)
    .join('\n        ');
  return `
  <footer class="db-tool-index" aria-label="All DeftBrain tools" style="max-width:1100px;margin:56px auto 24px;padding:24px 20px;border-top:1px solid #e8e1d5;font-family:system-ui,-apple-system,sans-serif">
    <h2 style="font-size:12px;text-transform:uppercase;letter-spacing:.1em;color:#8a8275;margin:0 0 14px;font-weight:700">All DeftBrain tools</h2>
    <nav style="display:flex;flex-wrap:wrap;gap:10px 18px;font-size:13px;line-height:1.5">
        ${links}
    </nav>
  </footer>`;
}

function getFooterHTML() {
  const year = new Date().getFullYear();
  return `  <footer>
    <a href="/" class="footer-brand" aria-label="DeftBrain — home">
      <img src="/pBrain-r.png" alt="" class="footer-brand-img" height="64" style="width:auto;height:64px;object-fit:contain;">
      <span class="footer-brand-text">Deft<span>Brain</span></span>
    </a>
    <nav class="footer-nav" style="display:flex;gap:1rem;font-family:'DM Sans',system-ui,sans-serif;font-size:0.92rem;">
      <a href="/guides" style="color:#2c4a6e;text-decoration:none;">Guides</a>
      <a href="/privacy" style="color:#2c4a6e;text-decoration:none;">Privacy</a>
    </nav>
    <span class="footer-copy">© ${year} DeftBrain · deftbrain.com</span>
  </footer>`;
}

module.exports = { getFooterHTML, getToolList, getToolIndexHTML };
