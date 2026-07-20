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

// A real, crawlable <a href> index of every tool. Injected into the static HTML
// of the homepage, every tool page, and every guide — placed OUTSIDE the React
// root so hydration ignores it. Fixes the orphaned-tools internal-linking problem
// (the SPA's homepage tool links are client-rendered, so crawlers saw none).
function getToolIndexHTML(tools, relatedHTML = '') {
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const links = tools
    .map(t => `<a href="/${t.id}" style="color:#2c4a6e;text-decoration:none">${esc(t.title)}</a>`)
    .join('\n        ');
  // Optional per-page "Related tools" block (visible) renders above the full
  // index — see prerender.js getRelatedHTML(). When empty (homepage, guides),
  // the footer is byte-identical to the index-only version, so those outputs
  // don't change. Tool pages pass a relevance-ranked set.
  const related = relatedHTML ? `${relatedHTML}\n    ` : '';
  // Collapsed <details> disclosure: visually one tidy line ("All DeftBrain tools ▸"),
  // but every link stays in the DOM and crawlable (Google indexes and follows links
  // inside collapsed <details>). User-accessible, not hidden — so it keeps the
  // internal-linking SEO value without the wall-of-links look on every page.
  // The <nav> must NOT carry an inline `display` — an inline style always wins over
  // the browser's default `details:not([open]) > *:not(summary){display:none}` rule,
  // which silently forced this open (full link wall visible) on every single page
  // load site-wide. The flex layout is applied only for the [open] state instead.
  return `
  <footer class="db-tool-index" aria-label="All DeftBrain tools" style="max-width:1100px;margin:40px auto 24px;padding:0 20px;font-family:system-ui,-apple-system,sans-serif">
    <style>.db-tool-index details[open]>nav{display:flex;flex-wrap:wrap;gap:10px 18px}</style>
    ${related}<details style="border-top:1px solid #e8e1d5;padding-top:14px">
      <summary style="font-size:12px;text-transform:uppercase;letter-spacing:.1em;color:#8a8275;font-weight:700;cursor:pointer">All DeftBrain tools</summary>
      <nav style="font-size:13px;line-height:1.5;margin-top:14px">
        ${links}
      </nav>
    </details>
  </footer>`;
}

// Static twin of src/components/EmailCapture.js — same copy, same endpoint,
// vanilla JS (these pages have no React). Keep the two in sync.
function getCaptureHTML() {
  return `  <div class="db-capture" style="border-top:1px solid #e8e1d5;background:#faf8f5">
    <div style="max-width:1100px;margin:0 auto;padding:32px 20px;font-family:'DM Sans',system-ui,sans-serif">
      <div style="max-width:560px">
        <p style="font-size:11px;text-transform:uppercase;letter-spacing:.18em;font-weight:700;color:#c8872e;margin:0">&#128238; The Deft Brief</p>
        <p style="font-size:14px;line-height:1.6;color:#5a544a;margin:8px 0 0">A short email about once a month: what shipped, and one tool worth knowing before life demands it. No spam &mdash; The Operator hates it more than you do. Unsubscribe in one click.</p>
        <form id="db-cap-form" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:16px">
          <label for="db-cap-email" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)">Email address</label>
          <input id="db-cap-email" type="email" required placeholder="you@anywhere.com" autocomplete="email"
            style="flex:1;min-width:220px;padding:10px 16px;border-radius:12px;border:1px solid #e8e1d5;background:#fff;color:#1a2e44;font-size:14px;font-family:inherit;outline:none">
          <button id="db-cap-btn" type="submit"
            style="padding:10px 24px;border-radius:12px;border:0;background:#1a2e44;color:#fff;font-size:14px;font-weight:600;font-family:inherit;cursor:pointer">Subscribe</button>
        </form>
        <p id="db-cap-msg" style="font-size:14px;font-weight:500;color:#1a2e44;margin:8px 0 0"></p>
      </div>
    </div>
  </div>
  <script>
  (function(){
    var f=document.getElementById('db-cap-form'); if(!f) return;
    f.addEventListener('submit', function(e){
      e.preventDefault();
      var btn=document.getElementById('db-cap-btn'), msg=document.getElementById('db-cap-msg');
      btn.disabled=true; btn.textContent='Sending\\u2026';
      fetch('/api/subscribe',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({email:document.getElementById('db-cap-email').value,source:location.pathname})})
        .then(function(r){return r.json().then(function(d){return {ok:r.ok,d:d};});})
        .then(function(x){
          if(x.ok&&x.d.ok){ f.style.display='none';
            msg.textContent = x.d.already ? 'You\\u2019re already on the list. The Operator admires the enthusiasm.'
                                          : 'Check your inbox \\u2014 confirm the email and you\\u2019re in.'; }
          else { msg.textContent=(x.d&&x.d.error)||'Something went wrong \\u2014 try again.';
            btn.disabled=false; btn.textContent='Subscribe'; }
        })
        .catch(function(){ msg.textContent='Something went wrong \\u2014 try again.';
          btn.disabled=false; btn.textContent='Subscribe'; });
    });
  })();
  </script>`;
}

function getFooterHTML() {
  const year = new Date().getFullYear();
  return getCaptureHTML() + `\n  <div style="text-align:center;margin:2.5rem auto 0;max-width:34rem;padding:0 1rem;font-family:'DM Sans',system-ui,sans-serif;">
    <p style="font-size:1rem;font-weight:700;color:#1a2e44;margin:0;">No tool for your problem?</p>
    <p style="font-size:0.9rem;color:#5a544a;margin:0.25rem 0 0.6rem;">Describe it — we build fast.</p>
    <a href="/ToolFinder" style="display:inline-block;padding:0.55rem 1.1rem;border:1px solid #e8e1d5;border-radius:0.75rem;color:#1a2e44;text-decoration:none;font-size:0.9rem;font-weight:600;">Tell us what you're stuck on →</a>
  </div>\n  <footer>
    <a href="/" class="footer-brand" aria-label="DeftBrain — home">
      <img src="/pBrain-r.png" alt="" class="footer-brand-img" height="64" style="width:auto;height:64px;object-fit:contain;">
      <span class="footer-brand-text">Deft<span>Brain</span></span>
    </a>
    <nav class="footer-nav" style="display:flex;gap:1rem;font-family:'DM Sans',system-ui,sans-serif;font-size:0.92rem;">
      <a href="/guides" style="color:#2c4a6e;text-decoration:none;">Guides</a>
      <a href="/about" style="color:#2c4a6e;text-decoration:none;">About</a>
      <a href="/privacy" style="color:#2c4a6e;text-decoration:none;">Privacy</a>
      <a href="/terms" style="color:#2c4a6e;text-decoration:none;">Terms</a>
      <a href="mailto:hello@deftbrain.com" style="color:#2c4a6e;text-decoration:none;">Contact</a>
    </nav>
    <span class="footer-copy">© ${year} DeftBrain · deftbrain.com</span>
  </footer>`;
}

module.exports = { getFooterHTML, getCaptureHTML, getToolList, getToolIndexHTML };
