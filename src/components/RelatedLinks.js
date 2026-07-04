/**
 * RelatedLinks — per-route SEO link blocks (Related guides / Related tools /
 * homepage Guides sample), rendered by React so they UPDATE on SPA navigation.
 * ──────────────────────────────────────────────────────────────────────────
 * Why this exists: the crawlable link blocks are also prerendered into each
 * page's static HTML (scripts/prerender.js) for Googlebot and no-JS clients.
 * Those static blocks live INSIDE #root, so React replaces them on mount; this
 * component renders the equivalent links for the CURRENT route. Before this,
 * the blocks lived outside #root and the first-loaded page's footer persisted
 * (stale) across in-app navigation — e.g. the homepage's guide sample showing
 * on every tool page. Keep this in sync with prerender.js (getRelatedHTML,
 * getRelatedGuidesHTML, getHomepageGuidesHTML, relatedTools).
 *
 * Links are plain <a href> (full navigation): guide pages are static prerendered
 * routes, not React Router routes, so they must not be intercepted by the SPA.
 */
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { tools } from '../data/tools';
import { useTheme } from '../hooks/useTheme';

// Fetch the guides manifest once, cached at module scope across navigations.
let _cache = null;
let _promise = null;
function loadGuides() {
  if (_cache) return Promise.resolve(_cache);
  if (!_promise) {
    _promise = fetch('/guides-manifest.json')
      .then(r => (r.ok ? r.json() : null))
      .then(d => { _cache = d && Array.isArray(d.guides) ? d.guides : []; return _cache; })
      .catch(() => { _cache = []; return _cache; });
  }
  return _promise;
}

// Mirror of prerender.js relatedTools(): tag/category-overlap-ranked siblings.
function relatedTools(tool, all, n = 6) {
  const tags = new Set((tool.tags || []).map(s => s.toLowerCase()));
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

export default function RelatedLinks() {
  const { pathname } = useLocation();
  const { isDark } = useTheme();
  const [guides, setGuides] = useState(_cache);

  useEffect(() => {
    if (_cache) { setGuides(_cache); return; }
    let alive = true;
    loadGuides().then(g => { if (alive) setGuides(g); });
    return () => { alive = false; };
  }, []);

  if (!guides) return null; // manifest not loaded yet

  const seg = pathname.replace(/^\/+/, '').split('/')[0]; // '' on homepage, toolId on a tool page

  // Like Footer, this block carries its OWN background. It renders in the app
  // shell (always white) below pages that don't re-theme with dark mode (the
  // dashboard is hardcoded cream) — so dark-palette text used to land on a
  // light backdrop and read as near-invisible light gray. Giving the block its
  // own themed band keeps it legible in both themes and visually continuous
  // with the Footer right below it.
  const c = {
    bg: isDark ? 'bg-zinc-900' : 'bg-[#faf8f5]',
    head: isDark ? 'text-zinc-500' : 'text-[#8a8275]',
    link: isDark ? 'text-zinc-300 hover:text-zinc-100' : 'text-[#2c4a6e] hover:text-[#1a2e44]',
    border: isDark ? 'border-zinc-800' : 'border-[#e8e1d5]',
  };

  const Block = ({ label, links, hub }) => (links.length === 0 ? null : (
    <nav className="mb-5" aria-label={label}>
      <h2 className={`text-[11px] uppercase tracking-[0.1em] font-bold ${c.head} mb-3`}>
        {label}{hub}
      </h2>
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm leading-relaxed">
        {links.map(l => (
          <a key={l.href} href={l.href} className={`${c.link} no-underline transition-colors`}>{l.text}</a>
        ))}
      </div>
    </nav>
  ));

  let body = null;

  if (seg === '') {
    // Homepage: one guide per tool, up to 10 (mirrors getHomepageGuidesHTML).
    const byTool = {};
    for (const g of guides) (byTool[g.toolId] = byTool[g.toolId] || []).push(g);
    const picks = [];
    for (const list of Object.values(byTool)) if (list[0] && picks.length < 10) picks.push(list[0]);
    const links = picks.map(g => ({ href: `/guides/${g.category}/${g.slug}`, text: g.title }));
    const hub = (
      <> — <a href="/guides" className={c.link}>browse all {guides.length} &rarr;</a></>
    );
    body = <Block label="Guides" links={links} hub={hub} />;
  } else {
    const tool = tools.find(t => t.id === seg);
    if (!tool) return null; // unknown route (e.g. NotFound)
    const relGuides = guides
      .filter(g => g.toolId === tool.id)
      .slice(0, 4)
      .map(g => ({ href: `/guides/${g.category}/${g.slug}`, text: g.title }));
    const relTools = relatedTools(tool, tools).map(t => ({ href: `/${t.id}`, text: t.title }));
    body = (
      <>
        <Block label="Related guides" links={relGuides} />
        <Block label="Related tools" links={relTools} />
      </>
    );
  }

  if (!body) return null;

  return (
    <div className={`${c.bg} border-t ${c.border} mt-2 print:hidden`}>
      <div className="max-w-5xl mx-auto px-5 pt-6">
        {body}
      </div>
    </div>
  );
}
