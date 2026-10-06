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
  // head: zinc-400 / #6e675c (not zinc-500 / #8a8275) — the 11px section
  // headers need ≥4.5:1 contrast; the old pair sat at ~3.6:1 in both themes.
  const c = {
    bg: isDark ? 'bg-zinc-900' : 'bg-[#faf8f5]',
    head: isDark ? 'text-zinc-400' : 'text-[#6e675c]',
    link: isDark ? 'text-zinc-300 hover:text-zinc-100' : 'text-[#165b9a] hover:text-[#1a2e44]',
    border: isDark ? 'border-zinc-800' : 'border-[#e8e1d5]',
  };

  const Block = ({ label, links, hub }) => (links.length === 0 ? null : (
    <nav className="mb-5" aria-label={label}>
      <h2 className={`text-[11px] uppercase tracking-[0.1em] font-bold ${c.head} mb-3`}>
        {label}{hub}
      </h2>
      {/* py-1.5 pads each link to a ≥32px tap target (was 23px); gap-y-0
          compensates so the visual rhythm barely changes. */}
      <div className="flex flex-wrap gap-x-4 gap-y-0 text-sm leading-relaxed">
        {links.map(l => (
          // A new tab (2026-10-05): these sit under a tool's results, and leaving
          // in the same tab would lose them. ↗ comes from .db-newtab's CSS.
          <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className={`db-newtab ${c.link} no-underline transition-colors inline-block py-1.5`}>{l.text}</a>
        ))}
      </div>
    </nav>
  ));

  // Category slugs are all single lowercase words, so the display name is just
  // the capitalised slug — no second copy of CATEGORY_META to drift.
  const hubName = (cat) => cat.charAt(0).toUpperCase() + cat.slice(1);
  const hubLinks = (cats) => cats.map(cat => ({ href: `/guides/${cat}`, text: hubName(cat) }));

  let body = null;

  if (seg === '') {
    // Homepage: nothing (2026-10-04, owner). The three collapsed blocks that
    // were here (popular tools, a guide sample, guides by topic) repeated what
    // the page already shows — Explore by category, the header's Guides link —
    // and the home page now ends with its FAQ, then SiteEnd and the footer.
    return null;
  } else {
    const tool = tools.find(t => t.id === seg);
    if (!tool) return null; // unknown route (e.g. NotFound)
    const relGuides = guides
      .filter(g => g.toolId === tool.id)
      .slice(0, 4)
      .map(g => ({ href: `/guides/${g.category}/${g.slug}`, text: g.title }));
    const relTools = relatedTools(tool, tools).map(t => ({ href: `/${t.id}`, text: t.title }));
    // The hub(s) this tool's own guides live in — topically relevant by
    // construction, never hand-mapped. Mirrors getToolHubsHTML in prerender.js.
    const toolHubs = hubLinks(
      [...new Set(guides.filter(g => g.toolId === tool.id).map(g => g.category))].slice(0, 3)
    );
    body = (
      <>
        <Block label="Related guides" links={relGuides} />
        <Block label="Related tools" links={relTools} />
        {toolHubs.length > 0 && <Block label="More guides like this" links={toolHubs} />}
      </>
    );
  }

  if (!body) return null;

  return (
    // data-site-tail: omitted from a tool's printed handout (printStyles);
    // still prints everywhere else, per the note above.
    <div data-site-tail className={`${c.bg} border-t ${c.border} mt-2`}>
      <div className="max-w-5xl mx-auto px-5 pt-6">
        {body}
      </div>
    </div>
  );
}
