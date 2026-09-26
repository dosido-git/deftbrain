// scripts/search-widget.js — BROWSER code, not a Node script.
//
// scripts/build-search-assets.js appends this to a browser copy of
// src/utils/searchCore.js and writes the result to public/search/deft-search.js.
// Everything below runs inside that file's closure, so the core's functions
// (makeDoc, rankDocs, TOOL_WEIGHTS, GUIDE_WEIGHTS) are in scope here.
//
// It powers search on the static guide pages, which are plain HTML with no
// React. Two uses:
//
//   1. <form data-deft-search data-tools="4" data-guides="5"> — a search box
//      (in the guide pages' and guide hubs' masthead) whose results open in a
//      panel beneath it: tools that can help first, then guides. The counts
//      set how many of each: a guide page leans on tools (the reader already
//      has a guide), a guide hub leans on guides (the reader came to read)
//      but still leads with the best tool or two.
//   2. window.DeftSearch.search(query) → Promise<{ tools, guides }> — for
//      the /guides library, which renders its own results.
//
// The indexes (public/search/tools.json, guides.json) load on first use —
// focusing a search box — not on page load, so a reader who never searches
// never downloads them.

var toolsP = null;
var guidesP = null;

function fetchJson(url) {
  return fetch(url, { credentials: 'same-origin' }).then(function (r) {
    if (!r.ok) throw new Error(url + ' ' + r.status);
    return r.json();
  });
}

function loadTools() {
  if (!toolsP) {
    toolsP = fetchJson('/search/tools.json').then(function (rows) {
      return rows.map(function (t) { return makeDoc(t, t.f, t.tags); });
    });
    toolsP.catch(function () { toolsP = null; });
  }
  return toolsP;
}

function loadGuides() {
  if (!guidesP) {
    guidesP = fetchJson('/search/guides.json').then(function (rows) {
      return rows.map(function (g) { return makeDoc(g, g.f, []); });
    });
    guidesP.catch(function () { guidesP = null; });
  }
  return guidesP;
}

function search(query) {
  return Promise.all([loadTools(), loadGuides()]).then(function (docs) {
    return {
      tools: rankDocs(docs[0], query, TOOL_WEIGHTS),
      guides: rankDocs(docs[1], query, GUIDE_WEIGHTS),
    };
  });
}

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

var CSS = [
  '.ds-form{position:relative;flex:1 1 280px;max-width:460px;margin:0 20px}',
  '.ds-box{display:flex;align-items:center;gap:8px;background:#fff;border:1px solid var(--rule,#e0dbd2);border-radius:999px;padding:0 14px}',
  '.ds-box:focus-within{border-color:var(--deft-blue,#165b9a);box-shadow:0 0 0 3px rgba(22,91,154,.12)}',
  '.ds-box span{color:var(--ink3,#6b6760);font-size:14px}',
  '.ds-input{flex:1;min-width:0;border:0;outline:0;background:transparent;font:inherit;font-size:14px;padding:9px 0;color:var(--ink,#1a1816)}',
  '.ds-panel{position:absolute;top:calc(100% + 6px);left:0;right:0;background:#fff;border:1px solid var(--rule,#e0dbd2);border-radius:12px;box-shadow:0 12px 32px rgba(26,24,22,.14);max-height:70vh;overflow:auto;z-index:50;padding:6px 0;text-align:start}',
  '.ds-panel[hidden]{display:none}',
  '.ds-head{font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;font-weight:600;color:var(--ink3,#6b6760);padding:10px 16px 4px}',
  '.ds-item{display:block;padding:8px 16px;text-decoration:none;color:var(--ink,#1a1816);line-height:1.35}',
  '.ds-item:hover,.ds-item:focus{background:var(--warm,#f0ebe2);outline:0}',
  '.ds-item b{font-weight:600;font-size:14px}',
  '.ds-item small{display:block;font-size:12.5px;color:var(--ink3,#6b6760);margin-top:1px}',
  '.ds-more{display:block;padding:6px 16px 8px;font-size:12.5px;color:var(--deft-blue,#165b9a);text-decoration:none;font-weight:500}',
  '.ds-more:hover{text-decoration:underline}',
  '.ds-note{padding:12px 16px;font-size:13px;color:var(--ink3,#6b6760)}',
  '.ds-rule{height:1px;background:var(--rule,#e0dbd2);margin:6px 0}',
  '@media (max-width:640px){.ds-form{order:3;flex-basis:100%;max-width:none;margin:10px 0 0}}'
].join('\n');

function injectCss() {
  if (document.getElementById('ds-css')) return;
  var st = document.createElement('style');
  st.id = 'ds-css';
  st.textContent = CSS;
  document.head.appendChild(st);
}

function renderPanel(res, query, toolLimit, guideLimit) {
  var q = encodeURIComponent(query);
  var out = [];
  var tools = res.tools.slice(0, toolLimit);
  var guides = res.guides.slice(0, guideLimit);
  if (!tools.length && !guides.length) {
    return '<div class="ds-note">Nothing matched those words. Try fewer, or different ones.</div>';
  }
  if (tools.length) {
    out.push('<div class="ds-head">Tools that can help</div>');
    tools.forEach(function (t) {
      out.push('<a class="ds-item" href="/' + esc(t.id) + '"><b>' + esc(t.icon ? t.icon + ' ' : '') + esc(t.title) + '</b><small>' + esc(t.tagline) + '</small></a>');
    });
    if (res.tools.length > tools.length) {
      out.push('<a class="ds-more" href="/tools?q=' + q + '">All ' + res.tools.length + ' matching tools →</a>');
    }
  }
  if (guides.length) {
    if (tools.length) out.push('<div class="ds-rule"></div>');
    out.push('<div class="ds-head">Guides</div>');
    guides.forEach(function (g) {
      out.push('<a class="ds-item" href="' + esc(g.href) + '"><b>' + esc(g.title) + '</b><small>' + esc(g.category) + '</small></a>');
    });
    if (res.guides.length > guides.length) {
      out.push('<a class="ds-more" href="/guides?q=' + q + '#library">All ' + res.guides.length + ' matching guides →</a>');
    }
  }
  return out.join('');
}

function mount(form) {
  var input = form.querySelector('input');
  var panel = form.querySelector('.ds-panel');
  if (!input || !panel) return;
  var toolLimit = parseInt(form.getAttribute('data-tools'), 10) || 3;
  var guideLimit = parseInt(form.getAttribute('data-guides'), 10) || 6;
  var timer = null;
  var seq = 0;

  function close() { panel.hidden = true; input.setAttribute('aria-expanded', 'false'); }
  function open() { panel.hidden = false; input.setAttribute('aria-expanded', 'true'); }

  function run() {
    var query = input.value.trim();
    var mine = ++seq;
    if (!query) { panel.innerHTML = ''; close(); return; }
    search(query).then(function (res) {
      if (mine !== seq) return; // a newer keystroke already asked
      panel.innerHTML = renderPanel(res, query, toolLimit, guideLimit);
      open();
    }).catch(function () {
      if (mine !== seq) return;
      panel.innerHTML = '<div class="ds-note">Search isn’t available right now. <a href="/tools">Browse all tools</a> or <a href="/guides">all guides</a>.</div>';
      open();
    });
  }

  input.addEventListener('focus', function () {
    loadTools(); loadGuides(); // warm up while they finish typing
    if (input.value.trim() && panel.innerHTML) open();
  });
  input.addEventListener('input', function () {
    clearTimeout(timer);
    timer = setTimeout(run, 120);
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    clearTimeout(timer);
    run();
    var first = panel.querySelector('a');
    if (first) first.focus();
  });
  form.addEventListener('keydown', function (e) {
    var links = Array.prototype.slice.call(panel.querySelectorAll('a'));
    var i = links.indexOf(document.activeElement);
    if (e.key === 'Escape') { close(); input.focus(); }
    else if (e.key === 'ArrowDown' && links.length) { e.preventDefault(); links[Math.min(i + 1, links.length - 1)].focus(); }
    else if (e.key === 'ArrowUp' && i >= 0) { e.preventDefault(); if (i === 0) input.focus(); else links[i - 1].focus(); }
  });
  document.addEventListener('click', function (e) { if (!form.contains(e.target)) close(); });
}

window.DeftSearch = { search: search, loadTools: loadTools, loadGuides: loadGuides };

function init() {
  var forms = document.querySelectorAll('form[data-deft-search]');
  if (!forms.length) return;
  injectCss();
  Array.prototype.forEach.call(forms, mount);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
