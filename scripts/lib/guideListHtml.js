// scripts/lib/guideListHtml.js
//
// One category's guide list for the static pages (2026-10-05): the /guides
// page and the /tools/{slug} category pages. The React toolbox
// (src/components/AllToolsPage.js) draws the same thing its own way; keep the
// behavior the same:
//
//   the first GUIDES_FIRST titles show; "Load more ▼" adds GUIDES_STEP at a
//   time; "Show all" opens the rest; once all show, "Show fewer ▲" folds back.
//
// Every title is in the HTML (the hidden ones carry `hidden`), so crawlers and
// visitors without script see every link: <noscript> unhides them.
//
// Colors come from --gl-* custom properties the page sets (each page has its
// own palette names), so light and dark follow the page.

const GUIDES_FIRST = 6;
const GUIDES_STEP = 12;

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function guideListHtml(guides, indent = '      ') {
  const items = guides.map((g, i) =>
    `${indent}  <li${i >= GUIDES_FIRST ? ' hidden' : ''}><a href="${esc(g.href)}">${esc(g.title)}</a></li>`).join('\n');
  const controls = guides.length > GUIDES_FIRST ? `
${indent}<div class="gl-controls">
${indent}  <button type="button" class="gl-more">Load more <span aria-hidden="true">▼</span></button>
${indent}  <button type="button" class="gl-all">Show all</button>
${indent}  <button type="button" class="gl-fewer" hidden>Show fewer <span aria-hidden="true">▲</span></button>
${indent}</div>` : '';
  return `${indent}<div class="gl" data-gl>
${indent}<ul class="gl-list">
${items}
${indent}</ul>${controls}
${indent}</div>`;
}

const GUIDE_LIST_STYLE = `
    .gl-list{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 28px;border-top:1px solid var(--gl-line)}
    .gl-list li{border-bottom:1px solid var(--gl-line)}
    .gl-list a{display:block;padding:12px 0;color:var(--gl-ink);text-decoration:none;font-size:14px;line-height:1.4}
    .gl-list a:hover{color:var(--gl-link);text-decoration:underline}
    .gl-controls{display:flex;flex-wrap:wrap;align-items:center;gap:6px 18px;margin-top:14px}
    .gl-controls button{display:inline-flex;align-items:center;gap:6px;border:0;background:transparent;padding:0;color:var(--gl-link);font:inherit;font-size:13px;font-weight:800;cursor:pointer}
    .gl-controls .gl-all{font-weight:600;color:var(--gl-muted);text-decoration:underline;text-underline-offset:2px}
    .gl-controls span{font-size:16px;line-height:1}
    .gl-controls [hidden]{display:none}
    @media(max-width:640px){.gl-list{grid-template-columns:1fr}}`;

const GUIDE_LIST_NOSCRIPT = '<noscript><style>.gl-list li[hidden]{display:block!important}.gl-controls{display:none!important}</style></noscript>';

const GUIDE_LIST_SCRIPT = `<script>
  (()=>{
    document.querySelectorAll('[data-gl]').forEach(box=>{
      const items=[...box.querySelectorAll('.gl-list li')];
      const more=box.querySelector('.gl-more'),all=box.querySelector('.gl-all'),fewer=box.querySelector('.gl-fewer');
      if(!more)return;
      let n=${GUIDES_FIRST};
      const show=k=>{n=Math.min(k,items.length);items.forEach((li,i)=>{li.hidden=i>=n});const done=n>=items.length;more.hidden=done;all.hidden=done;fewer.hidden=!done;};
      more.onclick=()=>show(n+${GUIDES_STEP});
      all.onclick=()=>show(items.length);
      fewer.onclick=()=>{show(${GUIDES_FIRST});box.scrollIntoView({block:'nearest'});};
    });
  })();
  </script>`;

module.exports = { guideListHtml, GUIDE_LIST_STYLE, GUIDE_LIST_SCRIPT, GUIDE_LIST_NOSCRIPT, GUIDES_FIRST, GUIDES_STEP };
