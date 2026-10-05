import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import SiteHeader from './SiteHeader';
import { isPlainClick } from './HomeIntro';
import { useTheme } from '../hooks/useTheme';
import { useDocumentHead } from '../hooks/useDocumentHead';
import { TOOL_COUNT_LABEL } from '../data/toolCount';
import { TOOL_FINDER_PAUSED } from '../data/toolFinderPaused';
import { CATEGORY_META } from '../data/categoryMeta';
import KEEP_LIST from '../data/tools-keep-list.json';
import { buildSearchIndex, searchTools } from '../utils/toolSearch';
import './AllToolsPage.css';

const LEGACY_MAP = {
  Academic:['Learning'], Communication:['Conversations'], 'Daily Life':['Home & Daily Life'],
  Health:['Health & Wellness'], 'Mind & Energy':['Health & Wellness'], Money:['Money'],
  Productivity:['Tasks'], Detour:['Just for Fun'], Body:['Health & Wellness'], Life:['Home & Daily Life'],
  Lifestyle:['Home & Daily Life'], Finance:['Money'], 'Consumer Rights':['Money'],
  'Mental Health':['Health & Wellness'], 'Health & Wellness':['Health & Wellness'],
  'Neurodivergent Support':['Health & Wellness'], Social:['Relationships'], 'Social Skills':['Relationships'],
  Career:['Career'], Strategic:['Decisions'], Goals:['Tasks'],
  'Focus & Productivity':['Health & Wellness','Tasks'], 'Document Analysis':['Learning'],
  'Conflict Resolution':['Conversations'], 'Content Creation':['Conversations'], Work:['Work & Meetings'],
  Creative:['Ideas & Imagination'], Thinking:['Just for Fun'], 'Brain Games':['Just for Fun'],
  wellness:['Health & Wellness'], Intercourse:['Conversations'], 'Read the Room':['Relationships'],
};

function categoriesFor(tool) {
  if (Array.isArray(tool.categories) && tool.categories.length) return tool.categories;
  if (tool.category) return LEGACY_MAP[tool.category] || [tool.category];
  return [];
}

function alpha(a, b) {
  const strip = s => String(s || '').replace(/^The\s+/i, '');
  return strip(a.title).localeCompare(strip(b.title));
}

// Shelf order (2026-10-05): the focus tools first, then the keepers, then the
// rest A–Z — the same tools tools-keep-list.json already ranks as the best.
const SHELF_RANK = new Map([...(KEEP_LIST.focus || []), ...(KEEP_LIST.keepers || [])].map((id, i) => [id, i]));
const SHELF_SIZE = 4;
function shelfOrder(a, b) {
  const ra = SHELF_RANK.has(a.id) ? SHELF_RANK.get(a.id) : Infinity;
  const rb = SHELF_RANK.has(b.id) ? SHELF_RANK.get(b.id) : Infinity;
  return ra === rb ? alpha(a, b) : ra - rb;
}

function ToolCard({ tool }) {
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <Link to={`/${tool.id}`} className="at-card">
      <div className="at-card-image-wrap">
        {!imageFailed ? (
          <img
            src={`/scramble/${tool.id}.webp`}
            alt=""
            className="at-card-image"
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="at-card-fallback" aria-hidden="true"><span>{tool.icon || '✦'}</span></div>
        )}
      </div>
      <div className="at-card-copy">
        <div className="at-card-title-row">
          {/* What it does first, its name second (2026-10-05): a coined name
              like "Not So Fast!" says nothing to someone with a problem. */}
          <h2>{tool.tagline || tool.title}</h2><span className="at-arrow" aria-hidden="true">→</span>
        </div>
        <p>{tool.title}</p>
      </div>
    </Link>
  );
}

export default function AllToolsPage({ allTools = [] }) {
  const [params, setParams] = useSearchParams();
  const initialQ = params.get('q') || '';
  const initialCategory = params.get('category') || 'All';
  const [query, setQuery] = useState(initialQ);
  const [category, setCategory] = useState(initialCategory);
  // Matches the homepage's persistent nav search exactly (narrow-then-
  // expand on focus/content) — owner asked for the same box, same
  // location, same action, not just a similar-looking one.
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef(null);


  // Arriving from a link lower on another page (the home page's "Browse all
  // tools"), client-side navigation kept that page's scroll offset and
  // landed mid-catalog. Start at the top.
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const { isDark, toggleTheme } = useTheme();
  // Same head as scripts/prerender.js STATIC_PAGES.tools — keep in sync. This
  // page used to set none, so it kept the homepage's title after navigation.
  useDocumentHead({
    title: 'DeftBrain Toolbox — Free Guided Experiences, A–Z',
    description: `Browse ${TOOL_COUNT_LABEL} free guided experiences, A–Z or by topic: read a lease, check a repair quote, spot a scam, prepare for a hard conversation.`,
    canonicalPath: '/tools',
  });
  // The sand page color reaches the body (and overscroll) through a class;
  // src/styles/index.css gives it its light and dark values.
  useEffect(() => {
    document.body.classList.add('db-sand-page');
    return () => { document.body.classList.remove('db-sand-page'); };
  }, []);

  // ⌘K focuses the search box — same shortcut the homepage's own copy of
  // this box supports; the ⌘K badge inside it would be a lie otherwise.
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // query/category were only ever read from the URL once, via the useState
  // initializers above — a category chip or the search box updates the URL
  // (syncUrl below), but nothing updated local state back FROM the URL, so
  // the browser's Back/Forward buttons (or an external link to a different
  // /tools?category=… while this page is already mounted, same route so
  // React Router won't remount it) left the visible filter stuck on
  // whatever it was when the page first loaded. Re-sync local state
  // whenever the URL's own params change.
  useEffect(() => {
    setQuery(params.get('q') || '');
    setCategory(params.get('category') || 'All');
  }, [params]);

  const categoryCounts = useMemo(() => {
    const counts = {};
    allTools.forEach(tool => categoriesFor(tool).forEach(cat => { counts[cat] = (counts[cat] || 0) + 1; }));
    return counts;
  }, [allTools]);

  // Shared relevance search (src/utils/toolSearch.js) — same matcher as the
  // home page search, so the two can't disagree about what "boss" finds.
  const searchIndex = useMemo(() => buildSearchIndex(allTools, categoriesFor), [allTools]);

  const visible = useMemo(() => {
    const base = query.trim() ? searchTools(searchIndex, query) : allTools;
    let list = base.map(tool => ({ ...tool, _categories: categoriesFor(tool) }));
    if (category !== 'All') list = list.filter(tool => tool._categories.includes(category));

    // A search lists best matches first; otherwise A–Z, the one order a
    // visitor needs no explanation for. The category chips above do the
    // browsing by topic (a topic-grouped sort with no visible groups,
    // labelled "For me", was removed 2026-10-02 as confusing).
    if (query.trim()) return list;
    return list.sort(alpha);
  }, [allTools, searchIndex, category, query]);

  // "All" with no search is a set of shelves, one per category (2026-10-05):
  // the whole range at a glance, a few tools each, rather than 124 cards A–Z.
  // A tool on an earlier shelf is passed over on later ones where possible,
  // so the shelves show more different tools.
  const shelves = useMemo(() => {
    const shown = new Set();
    return CATEGORY_META.map(cat => {
      const tools = allTools.filter(tool => categoriesFor(tool).includes(cat.name)).sort(shelfOrder);
      if (!tools.length) return null;
      const fresh = tools.filter(tool => !shown.has(tool.id));
      const picked = [...fresh, ...tools.filter(tool => shown.has(tool.id))].slice(0, SHELF_SIZE);
      picked.forEach(tool => shown.add(tool.id));
      return { cat, tools: picked, total: tools.length };
    }).filter(Boolean);
  }, [allTools]);
  const showShelves = category === 'All' && !query.trim();
  const finderHref = q => `/ToolFinder${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`;

  const syncUrl = (nextQ, nextCategory) => {
    const next = {};
    if (nextQ.trim()) next.q = nextQ.trim();
    if (nextCategory !== 'All') next.category = nextCategory;
    setParams(next, { replace: true });
  };

  const submitSearch = e => { e.preventDefault(); syncUrl(query, category); };
  const chooseCategory = next => { setCategory(next); syncUrl(query, next); };

  return (
    <main className="at-page">
      {/* The shared site header (SiteHeader.js, 2026-10-04). Categories
          scrolls to this page's own category picker below. */}
      <SiteHeader
        isDark={isDark}
        onToggleTheme={toggleTheme}
        showCurrency={false}
        current="/tools"
        onCategories={() => document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
      />

      <section className="at-hero at-shell">
        {/* Home + search share one row (owner asked for Home kept
            left-justified but vertically aligned with the search box,
            rather than sitting alone on its own line above everything).
            The search box itself is a straight port of the homepage's
            persistent nav search (DashBoard.js) — same 220->420px
            narrow-then-expand behavior, same input/button sizing and
            copy, same Escape-to-clear, same ⌘K shortcut — not a
            similar-looking one built separately. It still filters this
            page (query state already drives `visible` below) and still
            syncs ?q= on submit; "same action" is about the box's own
            behavior, not about leaving /tools. */}
        <div className="at-hero-top-row">
          <Link to="/" className="at-home-link">← Home</Link>
          <form className="at-nav-search" onSubmit={submitSearch}>
            <div className="at-nav-search-field" style={{ width: (query || searchFocused) ? 420 : 220 }}>
              <input
                ref={searchRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                onKeyDown={e => { if (e.key === 'Escape') { setQuery(''); e.currentTarget.blur(); } }}
                placeholder="Describe a situation…"
                aria-label="What do you need help with?"
              />
              {!query && <span className="at-kbd">⌘K</span>}
            </div>
            <button type="submit" className="at-nav-search-btn">Search</button>
          </form>
        </div>
        <h1>DeftBrain Toolbox</h1>
        {/* Styled like the homepage's own intro line ("DeftBrain is a
            collection of...") — same size/weight/color/max-width — not
            the page's pre-existing --muted lede treatment. */}
        <p className="at-lede">“There’s probably a tool for that!”</p>
      </section>

      <div id="categories" className="at-controls-sticky">
        <div className="at-shell at-controls">
          <div className="at-category-row" aria-label="Filter tools by category">
            {/* Every category as a chip, wrapping onto two rows — no More
                menu (owner, 2026-10-04): the home page's category buttons land
                here filtered, and the chosen one has to be visible. */}
            {/* Real links to each category page (/tools/{slug}) for crawlers
                and new tabs; a plain click filters this page instead. */}
            <a href="/tools" className={`at-chip at-chip-all ${category === 'All' ? 'is-active' : ''}`} aria-current={category === 'All' ? 'true' : undefined}
              onClick={e => { if (!isPlainClick(e)) return; e.preventDefault(); chooseCategory('All'); }}>All</a>
            {CATEGORY_META.map(cat => categoryCounts[cat.name] ? (
              <a key={cat.name} href={`/tools/${cat.slug}`} className={`at-chip ${category === cat.name ? 'is-active' : ''}`} aria-current={category === cat.name ? 'true' : undefined}
                onClick={e => { if (!isPlainClick(e)) return; e.preventDefault(); chooseCategory(cat.name); }}>{cat.emoji} {cat.name}</a>
            ) : null)}
          </div>
        </div>
      </div>

      <section className="at-shell at-results">
        {showShelves ? shelves.map(({ cat, tools, total }) => (
          <div key={cat.name} className="at-shelf">
            <div className="at-results-heading">
              <h2>{cat.emoji} {cat.name}</h2>
              {total > tools.length && (
                <a href={`/tools/${cat.slug}`} className="at-reset"
                  onClick={e => { if (!isPlainClick(e)) return; e.preventDefault(); chooseCategory(cat.name); window.scrollTo(0, 0); }}>
                  See all {cat.name} tools →
                </a>
              )}
            </div>
            <div className="at-grid">{tools.map(tool => <ToolCard key={tool.id} tool={tool} />)}</div>
          </div>
        )) : (
          <>
            <div className="at-results-heading">
              <div>
                {!query.trim() && <h2>{category}</h2>}
                <p>{query.trim() ? `${visible.length} possible match${visible.length === 1 ? '' : 'es'} for “${query.trim()}”` : `${visible.length} tool${visible.length === 1 ? '' : 's'}`}</p>
              </div>
              <button className="at-reset" onClick={() => { setQuery(''); chooseCategory('All'); }}>{query.trim() ? 'Clear search' : 'Show all categories'}</button>
            </div>
            {visible.length ? (
              <div className="at-grid">{visible.map(tool => <ToolCard key={tool.id} tool={tool} />)}</div>
            ) : (
              <div className="at-empty"><div>⌕</div><h2>No close match yet.</h2><p>Try describing the situation in different words, or browse the categories above.</p></div>
            )}
            {/* One search box (2026-10-05): the bottom Tool Finder box is gone,
                and Tool Finder is offered here, carrying what was typed. */}
            {query.trim() && !TOOL_FINDER_PAUSED && (
              <p className="at-finder-hint">
                Not quite it? <Link to={finderHref(query)}>Ask Tool Finder →</Link> Describe the situation in your own words and it suggests the tools that fit.
              </p>
            )}
          </>
        )}
      </section>
    </main>
  );
}
