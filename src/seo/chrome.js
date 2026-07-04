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
  return `
  <footer class="db-tool-index" aria-label="All DeftBrain tools" style="max-width:1100px;margin:40px auto 24px;padding:0 20px;font-family:system-ui,-apple-system,sans-serif">
    ${related}<details style="border-top:1px solid #e8e1d5;padding-top:14px">
      <summary style="font-size:12px;text-transform:uppercase;letter-spacing:.1em;color:#8a8275;font-weight:700;cursor:pointer">All DeftBrain tools</summary>
      <nav style="display:flex;flex-wrap:wrap;gap:10px 18px;font-size:13px;line-height:1.5;margin-top:14px">
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
  return getCaptureHTML() + `\n  <footer>
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
