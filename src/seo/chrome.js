// src/seo/chrome.js
//
// Shared HTML chrome for build-time HTML generators.
// Consumed by:
//   - src/seo/PageTemplate.js               (tool prerender)
//   - scripts/build-guides.js               (guide articles)
//   - scripts/build-guides-indexes.js       (guide hub pages)
//   - scripts/build-tools-category-pages.js (tool category pages)
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
//
// Splits on top-level tool-object boundaries (a line that is exactly "{") rather
// than scanning a fixed character window after `id:` — some tools carry a long
// `faq:` block immediately after `id:` (the 2026-07 focus-tools enrichment), which
// pushed `title:` past a previous 600-char lookahead and silently fell back to
// rendering the raw PascalCase id as the title across every prerendered/guide
// "All DeftBrain tools" footer for those tools. Block-splitting has no window to
// outgrow.
function getToolList() {
  const file = path.join(__dirname, '..', 'data', 'tools.js');
  const content = fs.readFileSync(file, 'utf8');
  // Key may be quoted ("id":) or unquoted (id:) — tolerate both.
  const idRe = /["']?\bid\b["']?\s*:\s*['"]([^'"]+)['"]/;
  const titleRe = /["']?\btitle\b["']?\s*:\s*['"]([^'"]+)['"]/;
  const blocks = content.split(/\n(?=\{\n)/);
  const out = [];
  const seen = new Set();
  for (const block of blocks) {
    const idM = idRe.exec(block);
    if (!idM) continue;
    const id = idM[1];
    if (!id || seen.has(id)) continue;
    const titleM = titleRe.exec(block);
    seen.add(id);
    out.push({ id, title: (titleM ? titleM[1] : id).trim() });
  }
  return out;
}

function getFooterHTML() {
  return `${getSiteEndHTML()}\n  ${getSiteFooterBar()}`;
}

// The band every page ends with, just above the footer (2026-10-04): the
// ideas box on the left, the newsletter on the right; stacked on a phone.
// Same markup as src/components/SiteEnd.js; styled by public/site-footer.css.
// Copy here and in SiteEnd.js must match.
function getSiteEndHTML() {
  return `<section class="site-end" aria-label="Ideas and newsletter">
    <div class="site-end-inner">
      <div class="site-end-part">
        <p class="site-end-kicker">&#128161; Missing something?</p>
        <p class="site-end-text"><strong>Didn&rsquo;t find what you need?</strong> Suggest a tool. We read every suggestion, and the best become new tools.</p>
        <form class="site-end-form" id="db-idea-form">
          <label class="sr-only-se" for="db-idea-input">What are you trying to deal with?</label>
          <input id="db-idea-input" type="text" required maxlength="1000" placeholder="What are you trying to deal with?">
          <button id="db-idea-btn" type="submit">Send</button>
        </form>
        <p class="site-end-msg" id="db-idea-msg" role="status"></p>
      </div>
      <div class="site-end-part">
        <p class="site-end-kicker">&#128238; Newsletter</p>
        <p class="site-end-text"><strong>One useful tool a month</strong> &mdash; the one worth knowing about before life demands it.</p>
        <form class="site-end-form" id="db-cap-form">
          <label class="sr-only-se" for="db-cap-email">Email address</label>
          <input id="db-cap-email" type="email" required placeholder="you@anywhere.com" autocomplete="email">
          <button id="db-cap-btn" type="submit">Subscribe</button>
        </form>
        <p class="site-end-msg" id="db-cap-msg" role="status"></p>
      </div>
    </div>
  </section>
  <script>
  (function(){
    function wire(formId, btnId, msgId, label, send, done, resetAfter){
      var f=document.getElementById(formId); if(!f) return;
      f.addEventListener('submit', function(e){
        e.preventDefault();
        var btn=document.getElementById(btnId), msg=document.getElementById(msgId);
        btn.disabled=true; btn.textContent='Sending\\u2026';
        send().then(function(x){
          if(x.ok){
            f.style.display='none'; msg.textContent=done(x.d);
            if(resetAfter) setTimeout(function(){ f.reset(); f.style.display=''; msg.textContent=''; btn.disabled=false; btn.textContent=label; }, resetAfter);
          }
          else { msg.textContent=(x.d&&x.d.error)||'Something went wrong \\u2014 try again.'; btn.disabled=false; btn.textContent=label; }
        }).catch(function(){ msg.textContent='Something went wrong \\u2014 try again.'; btn.disabled=false; btn.textContent=label; });
      });
    }
    function post(url, body){
      return fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
        .then(function(r){return r.json().catch(function(){return {};}).then(function(d){return {ok:r.ok&&(d.ok!==false),d:d};});});
    }
    wire('db-idea-form','db-idea-btn','db-idea-msg','Send',
      function(){ return post('/api/idea',{problem:document.getElementById('db-idea-input').value.trim(),source:'site-end',path:location.pathname}); },
      function(){ return '\\uD83D\\uDE4F Got it \\u2014 thank you.'; }, 6000);
    wire('db-cap-form','db-cap-btn','db-cap-msg','Subscribe',
      function(){ return post('/api/subscribe',{email:document.getElementById('db-cap-email').value,source:location.pathname}); },
      function(d){ return d&&d.already ? 'You\\u2019re already on the list. The Operator admires the enthusiasm.' : 'Check your inbox \\u2014 confirm the email and you\\u2019re in.'; });
  })();
  </script>`;
}

// Whether the Tool Finder link shows, read from the same flag Footer.js uses.
function toolFinderPaused() {
  try {
    const src = fs.readFileSync(path.join(__dirname, '..', 'data', 'toolFinderPaused.js'), 'utf8');
    return /TOOL_FINDER_PAUSED\s*=\s*true/.test(src);
  } catch { return false; }
}

// The footer bar (2026-10-04): the same links, order, layout and colors as
// src/components/Footer.js, so a static page and a React page end the same
// way. Styles in public/guides/guide.css (.site-footer); keep both in sync.
function getSiteFooterBar(year = new Date().getFullYear()) {
  const paused = toolFinderPaused();
  const links = require('../data/siteNav.json').footer
    .filter(l => !(l.key === 'toolFinder' && paused))
    .map(l => l.external
      ? `<a href="${l.href}" target="_blank" rel="me noopener noreferrer">${l.label}</a>`
      : `<a href="${l.href}">${l.label}</a>`).join('');
  return `<footer class="site-footer">
    <div class="site-footer-inner">
      <a href="/" class="site-footer-brand" aria-label="DeftBrain — home">
        <img src="/pBrain-r.png" alt="" height="64">
        <span class="site-footer-word">Deft<span>Brain</span></span>
      </a>
      <div class="site-footer-end">
        <nav class="site-footer-nav" aria-label="Footer">${links}</nav>
        <span class="site-footer-dot" aria-hidden="true">·</span>
        <span>© ${year} DeftBrain · deftbrain.com</span>
      </div>
    </div>
  </footer>`;
}

// Masthead search box for the static guide pages (2026-09-26). Results open in
// a panel beneath it — tools that can help first, then guides — drawn by
// /search/deft-search.js (built by scripts/build-search-assets.js from the same
// matcher the React app uses). `tools`/`guides` = how many of each to show: a
// guide page leans on tools (the reader already has a guide); a guide hub
// leans on guides (the reader came to read) but still leads with a tool or two.
function getSearchFormHTML({ tools = 3, guides = 6, placeholder = 'Search tools and guides…' } = {}) {
  return `<form class="ds-form" role="search" data-deft-search data-tools="${Number(tools)}" data-guides="${Number(guides)}" action="/tools">
      <div class="ds-box"><span aria-hidden="true">⌕</span><input class="ds-input" type="search" name="q" autocomplete="off" placeholder="${placeholder.replace(/"/g, '&quot;')}" aria-label="Search tools and guides" aria-expanded="false" aria-controls="ds-panel"><span class="ds-kbd" aria-hidden="true">⌘K</span></div>
      <div class="ds-panel" id="ds-panel" role="region" aria-label="Search results" hidden></div>
    </form>
    <script src="/search/deft-search.js" defer></script>`;
}

// Site header for every static page — the same markup src/components/SiteHeader.js
// renders on the React pages, from the same link list (src/data/siteNav.json),
// styled by the one stylesheet both use (public/site-header.css). Keep this
// markup and SiteHeader.js's identical. No language selector: these pages
// exist in English only. The light/dark switch is wired by
// scripts/lib/themeSnippet.js via [data-theme-toggle].
function getSiteHeaderHTML() {
  const nav = require('../data/siteNav.json').links
    .map(l => `<a href="${l.href}">${l.label}</a>`).join('');
  return `<header class="site-header">
    <div class="site-header-inner">
      <a href="/" class="site-header-brand" aria-label="DeftBrain home">
        <img src="/pBrain-r.png" alt="" class="sh-brand-img" height="64">
        <span class="sh-brand-word">
          <span class="sh-brand-text">Deft<span>Brain</span></span>
          <span class="sh-brand-tag"><b>deft</b> <i>(adj.)</i> — skillful, nimble, clever.</span>
        </span>
      </a>
      <div class="site-header-end">
        <nav class="site-header-nav" aria-label="Primary">${nav}</nav>
        <div class="site-header-controls">
          <button type="button" class="site-header-theme" data-theme-toggle aria-label="Switch between light and dark mode" title="Switch between light and dark mode"></button>
        </div>
        <details class="site-header-menu">
          <summary aria-label="Navigation menu"><span aria-hidden="true">☰</span></summary>
          <nav aria-label="Mobile navigation">${nav}</nav>
        </details>
      </div>
    </div>
  </header>
  <script>
  (function(){
    // Keep --site-header-h (public/site-header.css scroll-padding-top) equal
    // to the pinned header's height, so jumps land below it, not under it.
    var h=document.querySelector('.site-header'); if(!h) return;
    function set(){ document.documentElement.style.setProperty('--site-header-h', h.getBoundingClientRect().height+'px'); }
    set();
    if(window.ResizeObserver) new ResizeObserver(set).observe(h); else window.addEventListener('resize', set);
  })();
  </script>`;
}

// The search box that used to sit in the guide pages' masthead, now at the
// top of the page body (the header carries navigation only, as on the home
// page and the toolbox).
function getPageSearchHTML(opts) {
  return `<div class="page-search">${getSearchFormHTML(opts)}</div>`;
}

module.exports = { getFooterHTML, getToolList, getSearchFormHTML, getSiteHeaderHTML, getPageSearchHTML, getSiteFooterBar, getSiteEndHTML };
