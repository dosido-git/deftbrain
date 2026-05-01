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

'use strict';

function getFooterHTML() {
  const year = new Date().getFullYear();
  return `  <footer>
    <a href="/" class="footer-brand" aria-label="DeftBrain — home">
      <img src="/pBrain-r.png" alt="" class="footer-brand-img" height="64" style="width:auto;height:64px;object-fit:contain;">
      <span class="footer-brand-text">Deft<span>Brain</span></span>
    </a>
    <nav class="footer-nav" style="display:flex;gap:1rem;font-family:'DM Sans',system-ui,sans-serif;font-size:0.92rem;">
      <a href="/guides" style="color:#2c4a6e;text-decoration:none;">Guides</a>
    </nav>
    <span class="footer-copy">© ${year} DeftBrain · deftbrain.com</span>
  </footer>`;
}

module.exports = { getFooterHTML };
