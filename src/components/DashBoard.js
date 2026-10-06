// src/components/DashBoard.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import SiteHeader from './SiteHeader';
import { useTheme } from '../hooks/useTheme';
import HomeIntro from './HomeIntro';
import ToolFinderWizard from './ToolFinderWizard';
import SearchGuide, { isSentenceQuery } from './SearchGuide';
import { buildSearchIndex, searchTools } from '../utils/toolSearch';
import GuideMatches from './GuideMatches';
import './HomeTheme.css';
import { TOOL_FINDER_PAUSED } from '../data/toolFinderPaused';
import { CATEGORY_META } from '../data/categoryMeta';
import IdeaPrompt from './IdeaPrompt';
import keepList from '../data/tools-keep-list.json';

// ISO-week tag (e.g. "2026-30") — the Spotlight band rotates on this, so the
// pick is deterministic: stable all week, same for every visitor, no backend.
function isoWeekTag() {
  const d = new Date();
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return `${t.getUTCFullYear()}-${Math.ceil(((t - yearStart) / 86400000 + 1) / 7)}`;
}

// ════════════════════════════════════════════════════════════
// BRAND COLORS — Navy / Gold / Sand
// ════════════════════════════════════════════════════════════
// Values live in HomeTheme.css as CSS variables (light values unchanged, plus
// a dark set), so every style={{…CLR.x…}} below follows the theme.
const CLR = {
  sand50: 'var(--db-sand50)',
  sand100: 'var(--db-sand100)',
  sand200: 'var(--db-sand200)',
  sand300: 'var(--db-sand300)',
  navy50: 'var(--db-navy50)',
  navy100: 'var(--db-navy100)',
  navy200: 'var(--db-navy200)',
  navy400: 'var(--db-navy400)',
  navy500: 'var(--db-navy500)',
  navy600: 'var(--db-navy600)',
  navy700: 'var(--db-navy700)',
  gold100: 'var(--db-gold100)',
  gold300: 'var(--db-gold300)',
  gold500: 'var(--db-gold500)',
  // warm500 is the muted-label ink. It was #8a8275 (3.6:1 on sand — failed
  // WCAG for the 10-11px labels it paints); retoned darker, same warmth.
  warm500: 'var(--db-warm500)',
  warm700: 'var(--db-warm700)',
  warm800: 'var(--db-warm800)',
  // gold500 on light backgrounds fails contrast for small text (2.9:1) —
  // gold700 is the readable ink version for links/CTAs on cream.
  gold700: 'var(--db-gold700)',
  // Role tokens (2026-09-27) — surfaces that were a literal '#fff', the navy
  // category band (navy in both themes), and ink on a gold pill.
  surface:  'var(--db-surface)',
  navyBand: 'var(--db-navy-band)',
  onGold:   'var(--db-on-gold)',
};

// ════════════════════════════════════════════════════════════
// CATEGORY DEFINITIONS — 14 categories (count this array, not this comment)
// ════════════════════════════════════════════════════════════
// CATEGORY_META lives in src/data/categoryMeta.js — shared with HomeIntro.js's
// homepage category chips (an import the other way would be circular, since
// HomeIntro is rendered by this component).

// Legacy single-category strings → new category name(s)
// Values updated 2026-09-21 to the new permanent category names (was: Loot,
// Veer, Humans, etc. — see CATEGORY_META). Also fixes a real, if inert, bug
// found during that pass: 'Communication' and 'Conflict Resolution' mapped
// to 'Intercourse', which itself mapped to 'Discourse' — a two-hop chain
// resolveCategories() never follows (it does one lookup, not a walk), so
// either legacy string would have resolved to a name absent from
// CATEGORY_META and silently vanished from every category filter. No tool
// currently uses the old singular `category` field this map serves, so it
// never fired — fixed anyway rather than left as a landmine for the next
// tool that does. Both now point directly at the real resolved value.
const LEGACY_MAP = {
  'Academic':              ['Learning'],
  'Communication':         ['Conversations'],
  'Daily Life':            ['Home & Daily Life'],
  'Health':                ['Health & Wellness'],
  'Mind & Energy':         ['Health & Wellness'],
  'Money':                 ['Money'],
  'Productivity':          ['Tasks'],
  'Detour':                ['Just for Fun'],
  'Body':                  ['Health & Wellness'],
  'Life':                  ['Home & Daily Life'],
  'Lifestyle':             ['Home & Daily Life'],
  'Finance':               ['Money'],
  'Consumer Rights':       ['Money'],
  'Mental Health':         ['Health & Wellness'],
  'Health & Wellness':     ['Health & Wellness'],
  'Neurodivergent Support':['Health & Wellness'],
  'Social':                ['Relationships'],
  'Social Skills':         ['Relationships'],
  'Career':                ['Career'],
  'Strategic':             ['Decisions'],
  'Goals':                 ['Tasks'],
  'Focus & Productivity':  ['Health & Wellness', 'Tasks'],
  'Document Analysis':     ['Learning'],
  'Conflict Resolution':   ['Conversations'],
  'Content Creation':      ['Conversations'],
  'Work':                  ['Work & Meetings'],
  'Creative':              ['Ideas & Imagination'],
  'Thinking':              ['Just for Fun'],
  'Brain Games':           ['Just for Fun'],
  'wellness':              ['Health & Wellness'],
  'Intercourse':           ['Conversations'],
  // Category deleted 2026-07-26 (all members held another home) — resolve any
  // straggler string so a stale reference can't render an unmapped group.
  'Read the Room':         ['Relationships'],
};

// Resolve tool.categories (array) or tool.category (legacy string) → string[]
function resolveCategories(tool) {
  if (Array.isArray(tool.categories) && tool.categories.length > 0) {
    return tool.categories;
  }
  if (tool.category) {
    return LEGACY_MAP[tool.category] || [tool.category];
  }
  return ['The Grind'];
}

// ════════════════════════════════════════════════════════════
// LOCALSTORAGE HELPERS
// ════════════════════════════════════════════════════════════
const STORAGE_KEYS = { favorites: 'deftbrain_favorites', recents: 'deftbrain_recents' };
function loadFromStorage(key, fallback = []) {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; } catch { return fallback; }
}
function saveToStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

// The focus-search shortcut accepts ⌘K or Ctrl K (see the keydown handler);
// the visible hint names the one this device's keyboard actually has.
const SHORTCUT_LABEL = typeof navigator !== 'undefined'
  && /Mac|iPhone|iPad|iPod/i.test((navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || navigator.userAgent || '')
  ? '⌘K' : 'Ctrl K';

// ════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════
export default function DashBoard({ allTools, searchTerm, setSearchTerm }) {
  // Home follows the same light/dark setting as the tool pages (HomeTheme.css
  // does the colors; this only feeds the components that take an isDark prop).
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('All');
  const [showCatalog, setShowCatalog] = useState(false);
  // Homepage finder — draft text only; nothing filters
  // until submit, same submit-not-live pattern the old hero search used.
  // Separate from `searchTerm` (the prop that actually drives filteredTools)
  // so the homepage input isn't fighting the in-catalog SearchBox's own value
  // when both could theoretically be visible.
  const [navQuery, setNavQuery] = useState('');
  const navSearchRef = useRef(null);
  const submitNavSearch = useCallback((e) => {
    e.preventDefault();
    const q = navQuery.trim();
    if (q) setSearchTerm(q);
  }, [navQuery, setSearchTerm]);
  const [favorites, setFavorites]           = useState(() => loadFromStorage(STORAGE_KEYS.favorites));
  const [recents, setRecents]               = useState(() => loadFromStorage(STORAGE_KEYS.recents));
  const searchRef     = useRef(null);
  const resultsRef    = useRef(null);

  // Browsing "all tools" moved to a real route (2026-09-22, /tools —
  // AllToolsPage.js) instead of this plain state flip: the flip had no
  // browser-history entry to Back out of and no shareable/bookmarkable URL
  // for a specific category, both flagged in the earlier IA review. The
  // "Tools" nav link and the homepage's category chips now both `navigate()`
  // there directly (see onBrowse below) instead of calling a local
  // openCatalog() — removed that function since nothing calls it any more.
  // A homepage category pill now lands on that category's own real page
  // (/tools/{slug}, same-day addition — scripts/build-tools-category-pages.js)
  // instead of a filtered view of /tools, so onBrowse takes a slug, not a name.
  // showCatalog itself stays: it still gates the isSearching-independent
  // parts of this component's own inline results view below, it's just
  // permanently false now in normal use (nothing sets it true) rather than
  // toggled by the old Tools link.
  const backToHome = useCallback(() => {
    setShowCatalog(false);
    setSearchTerm('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setSearchTerm]);

  // ⌘K shortcut — focuses whichever search box is actually mounted.
  // searchRef (compact in-catalog SearchBox) and navSearchRef (persistent
  // homepage finder) are mutually exclusive in the DOM (same !isSearching
  // && !showCatalog condition that shows/hides each), so only one of
  // these two calls ever does anything; the other is a no-op on a null ref.
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
        navSearchRef.current?.focus();
        navSearchRef.current?.select();
      }
      if (e.key === 'Escape') setSearchTerm('');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setSearchTerm]);

  // Persist
  useEffect(() => { saveToStorage(STORAGE_KEYS.favorites, favorites); }, [favorites]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.recents,   recents);   }, [recents]);

  // Page background sync — the dashboard owns the body bg while it's mounted,
  // so any dead space between the dashboard container and the footer (or
  // beyond minHeight) inherits the sand tone instead of showing white through.
  // Restored on unmount so tool pages keep their own theming.
  useEffect(() => {
    const previous = document.body.style.background;
    document.body.style.background = CLR.sand50;
    return () => { document.body.style.background = previous; };
  }, []);

  // ── Spotlight: 6 under-discovered tools (not on the SEO keep-list = the
  // buried 85), rotated weekly + deterministically. Validation instrument:
  // surfaces tools we have no demand signal for. ──
  const spotlightTools = useMemo(() => {
    const indexable = new Set([...(keepList.focus || []), ...(keepList.keepers || [])]);
    const pool = (allTools || []).filter(t => t.id && !indexable.has(t.id));
    const week = isoWeekTag();
    const score = (id) => {
      let h = 0;
      const s = `${week}:${id}`;
      for (let i = 0; i < s.length; i++) h = ((h * 31) + s.charCodeAt(i)) >>> 0;
      return h;
    };
    return [...pool].sort((a, b) => score(a.id) - score(b.id)).slice(0, 6);
  }, [allTools]);

  // ── Recents band: pick up where you left off (already tracked for sorting) ──
  // Three, not four. As chips the row is sized by NAME length, and four long
  // ones ("Complaint Escalation Writer") wrapped to three lines at 390px —
  // 146px, barely better than the catalog-row layout this replaced.
  // Truncating was the alternative, but the name is the only thing
  // identifying a chip, so fewer chips beats shorter ones.
  const recentTools = useMemo(() =>
    recents.slice(0, 3)
      .map(id => (allTools || []).find(t => t.id === id))
      .filter(Boolean),
  [recents, allTools]);

  // Augment tools with resolved categories array
  const toolsWithCategories = useMemo(() =>
    (allTools || []).map(tool => ({
      ...tool,
      resolvedCategories: resolveCategories(tool),
      primaryCategory:    resolveCategories(tool)[0],
    })),
  [allTools]);


  const searchIndex = useMemo(() => buildSearchIndex(toolsWithCategories, t => t.resolvedCategories), [toolsWithCategories]);

  // Filtered + sorted tools
  const filteredTools = useMemo(() => {
    let list = toolsWithCategories;

    if (activeCategory === 'Favorites') {
      list = list.filter(t => favorites.includes(t.id));
    } else if (activeCategory !== 'All') {
      list = list.filter(t => t.resolvedCategories.includes(activeCategory));
    }

    // Shared relevance search (src/utils/toolSearch.js, 2026-09-26). Results
    // come back best-first, and a search is shown in that order regardless
    // of the sort control — the old matcher sorted results by category, so
    // the best match could sit at the bottom of the list.
    if (searchTerm.trim()) {
      const allowed = new Set(list.map(t => t.id));
      return searchTools(searchIndex, searchTerm).filter(t => allowed.has(t.id));
    }

    list = [...list];
    const strip = s => String(s || '').replace(/^The\s+/i, '');
    const byTitle = (a, b) => strip(a.title).localeCompare(strip(b.title));
    // Category order, A–Z within each. (The Category / A–Z / Recent control
    // was removed 2026-10-05: this view now only shows search results, which
    // are always best match first, so it never did anything.)
    const catOrder = {};
    CATEGORY_META.forEach((cm, i) => { catOrder[cm.name] = i; });
    list.sort((a, b) => {
      const aCat = catOrder[a.primaryCategory] ?? 999;
      const bCat = catOrder[b.primaryCategory] ?? 999;
      if (aCat !== bCat) return aCat - bCat;
      return byTitle(a, b);
    });
    return list;
  }, [toolsWithCategories, searchIndex, activeCategory, searchTerm, favorites]);

  // Group tools by category for the "All" view.
  //
  // A tool appears under EVERY category it belongs to, not just its first.
  // This used to filter on `primaryCategory`, so 74 of 125 tools — every
  // multi-category one — were invisible under their second and third
  // categories. GriefGuide is tagged Energy AND Me; browsing Me never showed
  // it. The category PILL counts were already computed across all categories,
  // so the count and the list disagreed.
  //
  // Appearing twice while BROWSING is the intent: the whole point of a tool
  // being in two categories is that two different mental routes reach it.
  // Appearing twice while SEARCHING would be a bug, and cannot happen —
  // `showCategoryHeadings` is false whenever there is a search term, so
  // command-K renders the flat `filteredTools`, which is one entry per tool
  // (it is a .filter() over a .map() of allTools; nothing duplicates).
  const showCategoryHeadings = activeCategory === 'All' && !searchTerm.trim();
  const groupedTools = useMemo(() => {
    if (!showCategoryHeadings) return null;
    const groups = [];
    const placed = new Set();
    CATEGORY_META.forEach(cm => {
      const tools = filteredTools.filter(t => t.resolvedCategories.includes(cm.name));
      if (tools.length > 0) {
        groups.push({ ...cm, tools });
        tools.forEach(t => placed.add(t.id));
      }
    });
    // "Other" is now whatever landed in no group at all, rather than whatever
    // had an unmapped FIRST category — a tool whose primary is unmapped but
    // whose second category is real now sits in that real group instead.
    const other = filteredTools.filter(t => !placed.has(t.id));
    if (other.length > 0) groups.push({ name: 'Other', emoji: '📦', tools: other });
    return groups;
  }, [filteredTools, showCategoryHeadings]);

  // Handlers
  const toggleFavorite = useCallback((toolId, e) => {
    e.preventDefault(); e.stopPropagation();
    setFavorites(prev => prev.includes(toolId) ? prev.filter(id => id !== toolId) : [...prev, toolId]);
  }, []);
  const recordRecent  = useCallback((toolId) => {
    setRecents(prev => [toolId, ...prev.filter(id => id !== toolId)].slice(0, 20));
  }, []);
  const selectCategory = useCallback((cat) => setActiveCategory(cat), []);

  // Scroll AFTER React commits the filtered list, not inside the click handler.
  //
  // Two earlier attempts failed for the same underlying reason — the handler
  // measures a layout that is about to change. Filtering drops the list from
  // ~205 rows to a handful, the document gets much shorter, and a scroll
  // issued beforehand is clamped against the new maximum: measured scrollY
  // 1370 -> 1370, i.e. nothing moved. requestAnimationFrame did not help and
  // is actively worse: its callbacks are suspended whenever the tab is not
  // painting, so the scroll silently never happens at all. An effect runs
  // after the commit, when the DOM is real and measurable.
  const didMountRef = useRef(false);
  useEffect(() => {
    if (!didMountRef.current) { didMountRef.current = true; return; }   // not on first paint
    // A category heading in the results filters to that category (or back to
    // all): bring the results header, with its banner, into view. (The
    // category strip this used to land on was removed 2026-10-05.)
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [activeCategory]);

  const isSearching  = searchTerm.trim().length > 0;
  const activeMeta   = CATEGORY_META.find(c => c.name === activeCategory);

  return (
    <div className="db-root w-full max-w-[1200px] mx-auto px-4 sm:px-6 pb-6"
         style={{ background: CLR.sand50, minHeight: '100vh' }}>
      <style>{`
        /* PRINT. Measured three ways before settling here.

           1. break-after:avoid on the heading — Chrome ignores it next to the
              two-column grid, headings still orphaned. 11pp landscape.
           2. break-inside:avoid on the whole group — no orphans, but every
              group that did not fit the remainder jumped to a fresh page.
              11pp -> 14pp landscape, 15 -> 19 portrait. MORE white, not less.
           3. Neither. Groups break where they fall. Fewest pages, least total
              whitespace; the cost is a heading occasionally sitting last on a
              page with its list overleaf.

           (3) wins on the thing actually complained about, so no break rules
           on groups. Individual tool rows already carry an inline
           breakInside:'avoid', so a single tool never splits.

           What IS hidden is the crawlable tool index — a collapsed <details>
           for crawlers, injected by prerender into the built HTML, which
           printed as an almost entirely blank final page. It does not exist
           on the dev server, so this rule only bites in production. */
        @media print {
          .db-tool-index { display: none !important; }
        }`}</style>

      {/* ═══════════ HEADER ═══════════ */}
      {/* The shared site header (SiteHeader.js, 2026-10-04): the same one, at
          the same size, on every page. Here the brand resets the home view
          (it already is "/") and Categories scrolls to the category card. */}
      {(isSearching || showCatalog) && <h1 style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>
        DeftBrain — Interactive guidance for life’s awkward, confusing, and curious moments
      </h1>}
      <SiteHeader
        isDark={isDark}
        onToggleTheme={toggleTheme}
        showCurrency={false}
        large
        onBrandClick={backToHome}
        onCategories={() => { backToHome(); window.setTimeout(() => document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60); }}
      />
        {/* The rethought intro. Replaces HeroPitch's rotating triplet and the
            two-CTA row: both assumed a visitor already knew they wanted a
            tool. Hidden while searching — someone mid-query wants results,
            not the pitch. Categories and the count come from the live
            catalog, so there is one source of truth. */}
        {!isSearching && !showCatalog && (
          <div className="mt-4">
            <HomeIntro
              allTools={allTools}
              finder={
                <form onSubmit={submitNavSearch} className="db-home-finder" role="search" aria-label="Find a DeftBrain tool">
                  <label htmlFor="home-tool-query">What would you like help with?</label>
                  <div className="db-home-finder-controls">
                    <div className="db-home-finder-field">
                    <input
                      id="home-tool-query"
                      ref={navSearchRef}
                      value={navQuery}
                      onChange={e => setNavQuery(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Escape') { setNavQuery(''); e.currentTarget.blur(); } }}
                      placeholder="E.g., a difficult talk, planning a date, detecting a scam, getting ready for a Dr.’s appt., making a decision."
                      aria-describedby="home-tool-process"
                      type="search"
                      required
                      aria-keyshortcuts="Meta+K Control+K"
                    />
                    {/* The ⌘K / Ctrl K shortcut (handler above) was invisible
                        once the header search moved into the page. Shown on
                        pointer devices only and until something is typed. */}
                    {!navQuery && <kbd className="db-home-finder-kbd" aria-hidden="true">{SHORTCUT_LABEL}</kbd>}
                    </div>
                    <button type="submit">Search <span aria-hidden="true">→</span></button>
                  </div>
                  <p id="home-tool-process">Choose a tool <span aria-hidden="true">→</span> Answer a few questions <span aria-hidden="true">→</span> Get practical guidance</p>
                </form>
              }
              // A category slug is a real prerendered static file
              // (build/tools/{slug}/index.html, served by backend/server.js)
              // — not a React Router route, the same reason /guides, /about
              // and /privacy links elsewhere in this file use a plain <a>
              // instead of <Link>. navigate() does client-side SPA routing,
              // which never reaches the server: the URL changes but React
              // Router has no matching <Route>, so it falls through to the
              // catch-all and renders NotFound — a false 404 (2026-09-23,
              // reported live: clicking a category pill 404'd). A hard
              // navigation is required so the browser actually requests the
              // page from the server. Bare "/tools" stays client-routed —
              // that one IS a real <Route path="/tools"> (AllToolsPage.js).
              onBrowse={(slug) => slug ? (window.location.href = `/tools/${slug}`) : navigate('/tools')}
            />
          </div>
        )}

      {(showCatalog || isSearching) && <>
        {/* Search + sort. NOT inside the !isSearching guard — the box must stay
            mounted or it vanishes mid-query, which is why it sits here rather
            than in HomeIntro. Back button is the visible way out of this view
            — see backToHome above. */}
        <div className="flex flex-wrap items-center justify-between gap-2 mt-4">
          <button type="button" onClick={backToHome} className="group flex items-center gap-1.5 text-[12px] font-semibold flex-shrink-0" style={{ color: CLR.navy600 }}>
            <span className="inline-block group-hover:-translate-x-1 transition-transform">←</span>
            <span>Back to home</span>
          </button>
          <div className="flex flex-wrap items-center justify-end gap-2 min-w-0 max-w-full">
            <SearchBox searchRef={searchRef} searchTerm={searchTerm} setSearchTerm={setSearchTerm} setActiveCategory={setActiveCategory} />
          </div>
        </div>

      {/* ═══════════ TOOL FINDER WIZARD ═══════════ */}
      {!isSearching && !TOOL_FINDER_PAUSED && <div className="mt-4"><ToolFinderWizard /></div>}

      {/* ═══════════ RECENTS + SPOTLIGHT BANDS ═══════════ */}
      {!isSearching && activeCategory === 'All' && (
        <>
          {/* Recents as chips, not catalog rows.
              This used to render through ToolColumns — the same treatment the
              catalog gets: full rows with taglines, category badges, favourite
              stars and arrows, ~150px for four entries. All of that is aimed at
              someone DECIDING. A recent tool is one you have already used, so
              the tagline is dead weight; you only need to get back to it. Name
              and icon are the whole job, and it now costs ~40px.

              Still conditional, so a first-time visitor never sees it — which
              is why it is worth keeping at all: it is the only personalisation
              on the page, and it costs nothing to anyone it cannot help. */}
          {recentTools.length > 0 && (
            <div className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1.5" style={{
              border: `1.5px solid ${CLR.sand300}`,
              background: CLR.surface,
              borderRadius: 14,
              padding: '9px 12px',
            }}>
              <span style={{ fontSize: 14, lineHeight: 1 }}>↩️</span>
              {/* The label, not the chip count, was what forced every chip onto
                  its own line at 390px: "PICK UP WHERE YOU LEFT OFF" measured
                  218px of 334px usable — 65% — leaving 86px, which fits no
                  chip. Short form below sm so the label shares a line with the
                  first chip instead of owning one. */}
              <p className="text-[11px] font-extrabold uppercase tracking-[0.15em] me-1"
                 style={{ color: CLR.navy500 }}>
                <span className="sm:hidden">Recent</span>
                <span className="hidden sm:inline">Pick up where you left off</span>
              </p>
              {recentTools.map(tool => (
                <Link
                  key={tool.id}
                  to={`/${tool.id}`}
                  onClick={() => recordRecent(tool.id)}
                  title={tool.tagline || tool.title}
                  className="inline-flex items-center gap-1.5 rounded-lg text-[12px] font-semibold transition-colors"
                  style={{
                    padding: '5px 10px',
                    border: `1px solid ${CLR.sand300}`,
                    background: CLR.sand50,
                    color: CLR.navy600,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = CLR.gold500;
                                       e.currentTarget.style.background = CLR.surface; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = CLR.sand300;
                                       e.currentTarget.style.background = CLR.sand50; }}
                >
                  <span style={{ fontSize: 13, lineHeight: 1 }}>{tool.icon || '🔧'}</span>
                  {tool.title}
                </Link>
              ))}
            </div>
          )}
          {spotlightTools.length > 0 && (
            /* Accent card — same treatment as the 404 IdeaPrompt: brand-gold
               border + faint warm tint (see IdeaPrompt `accent` prop). */
            <div className="mt-5" style={{
              border: `2px solid ${CLR.gold500}`,
              background: 'rgba(200, 135, 46, 0.05)',
              borderRadius: 14,
              padding: '12px 14px 8px',
            }}>
              <div className="flex items-center gap-2 mb-1">
                <span style={{ fontSize: 14, lineHeight: 1 }}>🔦</span>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.15em]"
                   style={{ color: CLR.navy500 }}>Spotlight</p>
                <span style={{ fontSize: 11, color: CLR.warm500, opacity: 0.7 }}>
                  Underrated this week — give one a spin
                </span>
                <div className="flex-1 h-px" style={{ background: CLR.sand200, minWidth: 20 }} />
              </div>
              <ToolColumns tools={spotlightTools} favorites={favorites}
                onToggleFavorite={toggleFavorite} onNavigate={recordRecent} showCategory={true} />
            </div>
          )}
        </>
      )}

      {/* The category strip that sat here (ALL · Faves · 14 category pills,
          filtering the search results) was removed 2026-10-05 (owner): only
          search results reached it, and browsing by category is the toolbox's
          job (/tools). */}

      {/* ═══════════ RESULTS HEADER ═══════════ */}
      <div ref={resultsRef} style={{ scrollMarginTop: 16 }}>

        {/* A search written as a situation gets a guided starting point
            first; the word matches follow as the fallback list. */}
        {isSearching && isSentenceQuery(searchTerm) && <SearchGuide problem={searchTerm} />}

        {/* Search result count — tight below category bar */}
        {isSearching && (
          <p className="text-[11px] font-semibold mt-2 mb-1" style={{ color: CLR.warm500 }}>
            {filteredTools.length === 0
              ? (isSentenceQuery(searchTerm) ? 'No other tools use those words' : 'No tools found — try different words')
              : isSentenceQuery(searchTerm)
                ? `${filteredTools.length} other tool${filteredTools.length !== 1 ? 's' : ''} that mention these words`
                : `${filteredTools.length} tool${filteredTools.length !== 1 ? 's' : ''} for "${searchTerm}"`}
          </p>
        )}

        {/* Category banner — only when a real category is active */}
        {!isSearching && activeCategory !== 'All' && (
          <div className="flex items-center justify-between mb-4 pb-3"
               style={{ borderBottom: `2px solid ${CLR.sand200}` }}>
            <div className="flex items-center gap-3">
              <span style={{ fontSize: 28, lineHeight: 1 }}>
                {activeCategory === 'Favorites' ? '⭐' : activeMeta?.emoji}
              </span>
              <button
                onClick={() => selectCategory('All')}
                title="Clear filter"
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'start' }}
              >
                <h2 className="text-base font-extrabold leading-tight tracking-tight"
                    style={{ color: CLR.navy700 }}>
                  {activeCategory}
                </h2>
                {activeMeta?.sub && (
                  <p className="text-[11px] mt-0.5" style={{ color: CLR.warm500 }}>
                    {activeMeta.sub}
                  </p>
                )}
              </button>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded ms-1"
                    style={{ background: CLR.navy500 + '18', color: CLR.navy500 }}>
                {filteredTools.length}
              </span>
            </div>
            <button
              onClick={() => selectCategory('All')}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-colors"
              style={{ color: CLR.warm500 }}
              title="Clear filter"
            >
              <span>✕</span>
            </button>
          </div>
        )}

      </div>

      {/* ═══════════ EMPTY STATES ═══════════ */}
      {activeCategory === 'Favorites' && favorites.length === 0 && !isSearching && (
        <div className="text-center py-16">
          <span className="text-4xl block mb-3" style={{ filter: 'grayscale(1)', opacity: 0.2 }}>⭐</span>
          <p className="text-sm font-bold" style={{ color: CLR.warm500 }}>No favorites yet</p>
          <p className="text-xs mt-1" style={{ color: CLR.warm500 }}>
            Hover any tool and click ⭐ to pin it here
          </p>
        </div>
      )}
      {filteredTools.length === 0 && (activeCategory !== 'Favorites' || favorites.length > 0) && (
        <div className="text-center py-16">
          <p className="text-3xl mb-3">🔍</p>
          <p className="text-sm font-bold" style={{ color: CLR.warm500 }}>No tools found</p>
          <p className="text-xs mt-1 mb-6" style={{ color: CLR.warm500 }}>
            {isSearching ? 'Try different words' : 'Nothing in this category yet'}
          </p>
          {isSearching && <GuideMatches query={searchTerm} colors={{ muted: CLR.warm500, border: CLR.sand200, text: CLR.warm800, bg: CLR.surface, link: CLR.navy500 }} />}
          {isSearching && <IdeaPrompt source="search-zero" query={searchTerm.trim()} />}
        </div>
      )}

      {/* ═══════════ TOOL LIST ═══════════ */}
      {groupedTools ? (
        groupedTools.map(group => (
          <div key={group.name} className="mb-6 db-cat-group">
            <div className="flex items-center gap-2 mb-1.5 mt-2 db-cat-heading">
              <button
                onClick={() => selectCategory(group.name)}
                title={`Filter by ${group.name}`}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = CLR.gold500;
                  e.currentTarget.style.background = CLR.surface;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = CLR.sand300;
                  e.currentTarget.style.background = CLR.sand100;
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: CLR.sand100,
                  border: `1.5px solid ${CLR.sand300}`,
                  borderRadius: 10,
                  padding: '5px 10px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: 14, lineHeight: 1 }}>{group.emoji}</span>
                <span style={{
                  fontSize: 12, fontWeight: 700,
                  color: CLR.navy700,
                  letterSpacing: '-0.01em',
                }}>
                  {group.name}
                </span>
                <span style={{
                  fontSize: 10, fontWeight: 800,
                  color: '#fff',
                  background: CLR.navy500,
                  borderRadius: 4,
                  padding: '1px 5px',
                  lineHeight: 1.2,
                }}>
                  {group.tools.length}
                </span>
              </button>
              {group.sub && (
                <span style={{
                  fontSize: 11,
                  color: CLR.warm500,
                  opacity: 0.7,
                  flexShrink: 1,
                  minWidth: 0,
                }}>
                  {group.sub}
                </span>
              )}
              <div className="flex-1 h-px" style={{ background: CLR.sand200, minWidth: 20 }} />
            </div>
            <ToolColumns catalog tools={group.tools} favorites={favorites}
              onToggleFavorite={toggleFavorite} onNavigate={recordRecent} showCategory={false} />
          </div>
        ))
      ) : (
        <ToolColumns catalog tools={filteredTools} favorites={favorites}
          onToggleFavorite={toggleFavorite} onNavigate={recordRecent}
          showCategory={isSearching || activeCategory === 'All'} />
      )}

      {/* Demand capture — someone who browsed this far without clicking is
          looking for something the catalog doesn't have. */}
      {filteredTools.length > 0 && (
        <div className="mt-8 mb-4">
          <IdeaPrompt source="catalog-end" compact />
        </div>
      )}
      </>}
    </div>
  );
}




// ════════════════════════════════════════════════════════════
// SORT BUTTON
// ════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════
// COMPACT SEARCH BOX
// ════════════════════════════════════════════════════════════
function SearchBox({ searchRef, searchTerm, setSearchTerm, setActiveCategory }) {
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', minWidth: 0, flex: '1 1 auto', maxWidth: '100%' }}>
      <span style={{
        position: 'absolute', left: 7, fontSize: 11,
        pointerEvents: 'none', color: CLR.warm500, lineHeight: 1,
      }}>🔍</span>
      <input
        ref={searchRef}
        type="text"
        value={searchTerm}
        onChange={e => { setSearchTerm(e.target.value); setActiveCategory('All'); }}
        placeholder="Search tools"
        style={{
          paddingInlineStart: 22, paddingInlineEnd: searchTerm ? 22 : 36,
          paddingTop: 5, paddingBottom: 5,
          // Shrinks on a phone instead of pushing the page sideways (2026-10-05).
          width: searchTerm ? 320 : 160, maxWidth: '100%', minWidth: 0,
          border: `1.5px solid ${CLR.sand300}`,
          borderRadius: 8,
          background: CLR.surface,
          color: CLR.warm800,
          fontSize: 12,
          fontWeight: 600,
          fontFamily: 'inherit',
          outline: 'none',
          transition: 'width 0.2s, border-color 0.15s, box-shadow 0.15s',
        }}
        onKeyDown={e => {
          if (e.key === 'Escape') {
            setSearchTerm('');
            e.target.style.width = '160px';
            e.target.style.borderColor = CLR.sand300;
            e.target.style.boxShadow = 'none';
            e.target.blur();
          }
        }}
        onFocus={e => {
          e.target.style.width = '320px';
          e.target.style.borderColor = CLR.gold500;
          e.target.style.boxShadow = `0 0 0 2px ${CLR.gold100}`;
        }}
        onBlur={e => {
          if (!searchTerm) e.target.style.width = '160px';
          e.target.style.borderColor = CLR.sand300;
          e.target.style.boxShadow = 'none';
        }}
      />
      {searchTerm && (
        <button
          onClick={() => setSearchTerm('')}
          style={{
            position: 'absolute', right: 5,
            background: 'none', border: 'none',
            cursor: 'pointer', color: CLR.warm500,
            fontSize: 10, lineHeight: 1, padding: 2,
          }}
        >✕</button>
      )}
      {!searchTerm && (
        /* hidden on touch widths — there is no Command key on a phone */
        <span className="hidden sm:inline-block" style={{
          position: 'absolute', right: 7,
          fontSize: 10, color: CLR.warm400,
          background: CLR.sand100,
          border: `1px solid ${CLR.sand200}`,
          borderRadius: 4,
          padding: '1px 4px',
          pointerEvents: 'none',
          fontWeight: 600,
          letterSpacing: 0.2,
        }}>⌘K</span>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// TOOL COLUMNS — two-column list that CANNOT split a card across the
// boundary. We used to rely on CSS `columns-2` + `break-inside:avoid`,
// but multi-column break-inside is flaky (esp. WebKit/Safari): a card at
// the column break could split, orphaning its tagline/badge into the next
// column. Instead we slice the list into two column-major halves and put
// each in its own grid cell — structurally impossible to split. Order
// (down the left, then down the right) and mobile single-column stacking
// are preserved.
// ════════════════════════════════════════════════════════════
// `catalog` marks the real catalog list, as opposed to the Spotlight band —
// which renders through this same component, so a class applied here without
// the flag would tag both. Nothing styles db-catalog; it exists so the list
// the sort control actually governs can be identified, by a test or by anyone
// reading the DOM.
function ToolColumns({ tools, favorites, onToggleFavorite, onNavigate, showCategory, catalog }) {
  const row = (tool) => (
    <ToolRow key={tool.id} tool={tool}
      isFavorite={favorites.includes(tool.id)}
      onToggleFavorite={onToggleFavorite}
      onNavigate={onNavigate}
      showCategory={showCategory} />
  );
  const mark = catalog ? 'db-catalog ' : '';
  if (tools.length <= 3) return <div className={mark.trim() || undefined}>{tools.map(row)}</div>;
  const mid = Math.ceil(tools.length / 2);
  return (
    <div className={`${mark}md:grid md:grid-cols-2 md:gap-x-4`}>
      <div>{tools.slice(0, mid).map(row)}</div>
      <div>{tools.slice(mid).map(row)}</div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// TOOL ROW
// ════════════════════════════════════════════════════════════
function ToolRow({ tool, isFavorite, onToggleFavorite, onNavigate, showCategory }) {
  const [hovered, setHovered] = useState(false);
  const primaryCat = tool.primaryCategory || tool.resolvedCategories?.[0];
  return (
    <Link
      to={`/${tool.id}`}
      onClick={() => onNavigate(tool.id)}
      className="no-underline group block"
      style={{ breakInside: 'avoid' }}
    >
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="flex items-center gap-3 py-2.5 px-2.5 -mx-2.5 rounded-xl transition-colors"
        style={{ background: hovered ? CLR.sand100 : 'transparent' }}
      >
        {/* Icon */}
        <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg text-lg"
             style={{ background: tool.headerColor ? tool.headerColor + '22' : CLR.navy50 }}>
          {tool.icon || '✨'}
        </div>

        {/* Title + tagline */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-[13px] font-bold truncate transition-colors"
                style={{ color: hovered ? CLR.navy500 : CLR.navy700 }}>
              {tool.title}
            </h3>
            {showCategory && primaryCat && (
              <span className="hidden sm:inline text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded flex-shrink-0"
                    style={{ color: CLR.navy400, background: CLR.navy50 }}>
                {primaryCat}
              </span>
            )}
          </div>
          <p className="text-[11px] font-medium truncate mt-0.5 leading-snug"
             style={{ color: CLR.warm500 }}>
            {tool.tagline || tool.description}
          </p>
        </div>

        {/* Favorite — outline star (☆) = tap to add, filled gold star (★) =
            tap to remove. Always visible (was hover-only, so invisible and
            undiscoverable on touch, where there is no hover). The empty→filled
            shape change is the affordance that says "this toggles". */}
        <button
          onClick={(e) => onToggleFavorite(tool.id, e)}
          className="p-1 rounded-lg transition-all flex-shrink-0"
          style={{
            color:      isFavorite ? '#f59e0b' : (hovered ? CLR.navy400 : CLR.sand300),
            background: 'transparent',
            lineHeight: 1,
          }}
          aria-pressed={isFavorite}
          aria-label={isFavorite ? `Remove ${tool.title} from favorites` : `Add ${tool.title} to favorites`}
          title={isFavorite ? 'Favorited — tap to remove' : 'Tap to favorite'}
        >
          <span className="text-base leading-none" aria-hidden="true">{isFavorite ? '★' : '☆'}</span>
        </button>

        {/* Arrow */}
        <span className="flex-shrink-0 text-xs transition-colors"
              style={{ color: hovered ? CLR.navy400 : CLR.sand300 }}>→</span>
      </div>
    </Link>
  );
}
