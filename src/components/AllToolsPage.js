import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import BrandMark from './BrandMark';
import LocaleSelectors from './LocaleSelectors';
import { CATEGORY_META } from '../data/categoryMeta';
import { toolFinderMetadata } from '../data/toolFinderMetadata';
import './AllToolsPage.css';

const GENERIC_TAGS = new Set(['return', 'security']);

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

function normalizedWords(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2);
}

function finderText(tool) {
  const meta = toolFinderMetadata[tool.id];
  if (!meta) return '';
  return [
    ...(meta.problems || []), ...(meta.capabilities || []), ...(meta.accepts || []),
    meta.primaryIntent, meta.whenToRecommend,
  ].filter(Boolean).join(' ');
}

function relevance(tool, query) {
  const q = query.toLowerCase().trim();
  if (!q) return 0;
  const words = normalizedWords(q);
  const title = (tool.title || '').toLowerCase();
  const tagline = (tool.tagline || '').toLowerCase();
  const description = (tool.description || '').toLowerCase();
  const tags = (tool.tags || []).map(t => String(t).toLowerCase());
  const cats = categoriesFor(tool).join(' ').toLowerCase();
  const finder = finderText(tool).toLowerCase();
  let score = 0;
  if (title.includes(q)) score += 100;
  if (tagline.includes(q)) score += 55;
  if (description.includes(q)) score += 45;
  if (finder.includes(q)) score += 70;
  tags.forEach(tag => {
    if (tag.includes(q)) score += 35;
    if (!GENERIC_TAGS.has(tag) && q.includes(tag)) score += 24;
  });
  if (cats.includes(q) || q.includes(cats)) score += 20;
  words.forEach(word => {
    if (title.includes(word)) score += 14;
    if (tagline.includes(word)) score += 10;
    if (description.includes(word)) score += 6;
    if (finder.includes(word)) score += 9;
    if (tags.some(tag => tag.includes(word))) score += 8;
  });
  return score;
}

function alpha(a, b) {
  const strip = s => String(s || '').replace(/^The\s+/i, '');
  return strip(a.title).localeCompare(strip(b.title));
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
          <h2>{tool.title}</h2><span className="at-arrow" aria-hidden="true">→</span>
        </div>
        <p>{tool.tagline || tool.description}</p>
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
  const [mode, setMode] = useState('forme');
  const [categoryOpen, setCategoryOpen] = useState(false);
  // Matches the homepage's persistent nav search exactly (narrow-then-
  // expand on focus/content) — owner asked for the same box, same
  // location, same action, not just a similar-looking one.
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const previous = document.body.style.background;
    document.body.style.background = '#faf8f5';
    return () => { document.body.style.background = previous; };
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

  const visible = useMemo(() => {
    let list = allTools.map(tool => ({ ...tool, _categories: categoriesFor(tool), _score: relevance(tool, query) }));
    if (category !== 'All') list = list.filter(tool => tool._categories.includes(category));
    if (query.trim()) list = list.filter(tool => tool._score > 0);

    if (mode === 'az') return list.sort(alpha);
    if (query.trim()) return list.sort((a,b) => b._score - a._score || alpha(a,b));

    const catOrder = Object.fromEntries(CATEGORY_META.map((cat, i) => [cat.name, i]));
    return list.sort((a,b) => {
      const ai = Math.min(...a._categories.map(c => catOrder[c] ?? 999), 999);
      const bi = Math.min(...b._categories.map(c => catOrder[c] ?? 999), 999);
      return ai - bi || alpha(a,b);
    });
  }, [allTools, category, mode, query]);

  const syncUrl = (nextQ, nextCategory) => {
    const next = {};
    if (nextQ.trim()) next.q = nextQ.trim();
    if (nextCategory !== 'All') next.category = nextCategory;
    setParams(next, { replace: true });
  };

  const submitSearch = e => { e.preventDefault(); syncUrl(query, category); };
  const chooseCategory = next => { setCategory(next); setCategoryOpen(false); syncUrl(query, next); };

  return (
    <main className="at-page">
      <header className="at-site-header">
        <div className="at-shell at-site-header-inner">
          {/* BrandMark only wraps itself in a clickable <button> when given
              onClick — plain, it's an inert <div>. Unlike the homepage's own
              header (DashBoard.js), this page really is somewhere else, so
              it needs a real navigation, not a state reset. */}
          <Link to="/" aria-label="DeftBrain — home"><BrandMark direction="left" size="md" isDark={false} showTagline={true} /></Link>
          <div className="at-header-right">
            <nav className="at-nav" aria-label="Primary">
              <Link to="/tools" aria-current="page">Tools</Link>
              {/* In-page anchor, not a route — there's no dedicated
                  /categories page anywhere in the app, and this page
                  already has the category picker built in a few hundred
                  pixels down. Scrolls straight to it. */}
              <a href="#categories">Categories</a>
              <a href="/guides">Guides</a>
              <a href="/about">About</a>
            </nav>
            <LocaleSelectors dark={false} showCurrency={false} />
          </div>
        </div>
      </header>

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
                placeholder="Describe what you’re dealing with…"
                aria-label="What do you need help with?"
              />
              {!query && <span className="at-kbd">⌘K</span>}
            </div>
            <button type="submit" className="at-nav-search-btn">Find a tool →</button>
          </form>
        </div>
        <p className="at-eyebrow">THE WHOLE TOOLBOX</p>
        <h1>DeftBrain Toolbox</h1>
        {/* Styled like the homepage's own intro line ("DeftBrain is a
            collection of...") — same size/weight/color/max-width — not
            the page's pre-existing --muted lede treatment. */}
        <p className="at-lede">“There’s probably a tool for that!”</p>
      </section>

      <div id="categories" className="at-controls-sticky">
        <div className="at-shell at-controls">
          <div className="at-category-row" aria-label="Filter tools by category">
            <button className={`at-chip ${category === 'All' ? 'is-active' : ''}`} onClick={() => chooseCategory('All')}>All <span>{allTools.length}</span></button>
            {CATEGORY_META.slice(0, 6).map(cat => categoryCounts[cat.name] ? (
              <button key={cat.name} className={`at-chip ${category === cat.name ? 'is-active' : ''}`} onClick={() => chooseCategory(cat.name)}>{cat.emoji} {cat.name}</button>
            ) : null)}
            <div className="at-more-wrap">
              <button className={`at-chip ${CATEGORY_META.slice(6).some(c => c.name === category) ? 'is-active' : ''}`} onClick={() => setCategoryOpen(v => !v)}>More <span aria-hidden="true">⌄</span></button>
              {categoryOpen && <div className="at-more-menu">
                {CATEGORY_META.slice(6).map(cat => categoryCounts[cat.name] ? (
                  <button key={cat.name} className={category === cat.name ? 'is-active' : ''} onClick={() => chooseCategory(cat.name)}><span>{cat.emoji}</span>{cat.name}<small>{categoryCounts[cat.name]}</small></button>
                ) : null)}
              </div>}
            </div>
          </div>
          <div className="at-mode" aria-label="Browse order">
            <span>Browse by</span>
            <button className={mode === 'forme' ? 'is-active' : ''} onClick={() => setMode('forme')}>For me</button>
            <button className={mode === 'az' ? 'is-active' : ''} onClick={() => setMode('az')}>A–Z</button>
          </div>
        </div>
      </div>

      <section className="at-shell at-results">
        <div className="at-results-heading">
          <div>
            <h2>{query.trim() ? 'Tools that may help with that' : category === 'All' ? 'Explore the toolbox' : category}</h2>
            <p>{query.trim() ? `${visible.length} possible match${visible.length === 1 ? '' : 'es'} for “${query.trim()}”` : `${visible.length} tool${visible.length === 1 ? '' : 's'}`}</p>
          </div>
          {(query || category !== 'All') && <button className="at-reset" onClick={() => { setQuery(''); chooseCategory('All'); }}>Clear filters</button>}
        </div>

        {visible.length ? (
          <div className="at-grid">{visible.map(tool => <ToolCard key={tool.id} tool={tool} />)}</div>
        ) : (
          <div className="at-empty"><div>⌕</div><h2>No close match yet.</h2><p>Try describing the situation in different words, or browse the categories above.</p></div>
        )}
      </section>

      <section className="at-shell at-last-call">
        <div>
          <p className="at-eyebrow">STILL LOOKING?</p>
          <h2>Didn’t find what you needed?</h2>
          <p>Tell DeftBrain what’s going on. You don’t need to know which tool to ask for.</p>
        </div>
        <form onSubmit={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); syncUrl(query, 'All'); }} className="at-bottom-search">
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Describe your situation…" aria-label="Describe your situation" />
          <button type="submit">Find a tool →</button>
        </form>
      </section>
    </main>
  );
}
