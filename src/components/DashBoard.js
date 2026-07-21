// src/components/DashBoard.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';

import BrandMark from './BrandMark';
import HeroPitch from './HeroPitch';
import LocaleSelectors from './LocaleSelectors';
import DemoCards from './DemoCards';
import ToolFinderWizard from './ToolFinderWizard';
import IdeaPrompt from './IdeaPrompt';

// ════════════════════════════════════════════════════════════
// BRAND COLORS — Navy / Gold / Sand
// ════════════════════════════════════════════════════════════
const CLR = {
  sand50:  '#faf8f5',
  sand100: '#f3efe8',
  sand200: '#e8e1d5',
  sand300: '#d5cab8',
  navy50:  '#f0f3f7',
  navy100: '#d4dde8',
  navy200: '#a8b9ce',
  navy400: '#4a6a8a',
  navy500: '#2c4a6e',
  navy600: '#1e3a58',
  navy700: '#1e2a3a',
  gold100: '#f9edd8',
  gold300: '#e8be7a',
  gold500: '#c8872e',
  // warm500 is the muted-label ink. It was #8a8275 (3.6:1 on sand — failed
  // WCAG for the 10-11px labels it paints); retoned darker, same warmth.
  warm500: '#6e6659',
  warm700: '#5a544a',
  warm800: '#3d3935',
  // gold500 on light backgrounds fails contrast for small text (2.9:1) —
  // gold700 is the readable ink version for links/CTAs on cream.
  gold700: '#9c691c',
};

// ════════════════════════════════════════════════════════════
// CATEGORY DEFINITIONS — 17 categories
// ════════════════════════════════════════════════════════════
const CATEGORY_META = [
  { name: 'The Grind',     emoji: '🌅', tag: 'home', sub: 'home · household · daily life' },
  { name: 'Out & About',   emoji: '🗺️',  tag: 'travel', sub: 'travel · events · adventure'  },
  { name: 'Humans',        emoji: '👥', tag: 'people', sub: 'relationships · people · bonds' },
  { name: 'Loot',          emoji: '💰', tag: 'money', sub: 'money · finances · consumer'   },
  { name: 'Pursuits',      emoji: '🚀', tag: 'career', sub: 'career · growth · identity'    },
  { name: 'The Office',    emoji: '🏢', tag: 'work', sub: 'work · meetings · tools'       },
  { name: 'Energy',        emoji: '⚡', tag: 'focus', sub: 'focus · stamina · regulation'  },
  { name: 'Body',          emoji: '💪', tag: 'health', sub: 'health · exercise · medical'   },
  { name: 'Discourse',     emoji: '🗣️ ', tag: 'speaking', sub: 'say it well!'           },
  { name: 'Read the Room', emoji: '👁️',  tag: 'subtext', sub: 'subtext · tone · decoding'    },
  { name: 'Go Deep!',      emoji: '🔬', tag: 'learning', sub: 'research · learning · knowledge'},
  { name: 'Diversions',   emoji: '🧩', tag: 'curiosity', sub: 'curiosity · play · intellect'  },
  { name: 'Me',            emoji: '🪞', tag: 'self', sub: 'self · reflection · growth'    },
  { name: 'What If?',      emoji: '✨', tag: 'ideas', sub: 'imagination · creativity'      },
  { name: 'Veer',          emoji: '🧭', tag: 'decisions', sub: 'decisions · direction · choices'},
  { name: 'Do It!',        emoji: '✅', tag: 'tasks', sub: 'execution · unstuck · tasks'   },
  { name: 'Detour',        emoji: '🎲', tag: 'fun', sub: 'fun · play · diversions'       },
];

// Legacy single-category strings → new category name(s)
const LEGACY_MAP = {
  'Academic':              ['Go Deep!'],
  'Communication':         ['Intercourse'],
  'Daily Life':            ['The Grind'],
  'Health':                ['Body'],
  'Mind & Energy':         ['Energy'],
  'Money':                 ['Loot'],
  'Productivity':          ['Do It!'],
  'Diversions':            ['Detour'],
  'Life':                  ['The Grind'],
  'Lifestyle':             ['The Grind'],
  'Finance':               ['Loot'],
  'Consumer Rights':       ['Loot'],
  'Mental Health':         ['Energy'],
  'Health & Wellness':     ['Body'],
  'Neurodivergent Support':['Energy'],
  'Social':                ['Humans'],
  'Social Skills':         ['Humans'],
  'Career':                ['Pursuits'],
  'Strategic':             ['Veer'],
  'Goals':                 ['Do It!'],
  'Focus & Productivity':  ['Energy', 'Do It!'],
  'Document Analysis':     ['Go Deep!'],
  'Conflict Resolution':   ['Intercourse'],
  'Content Creation':      ['Intercourse'],
  'Work':                  ['The Office'],
  'Creative':              ['What If?'],
  'Thinking':              ['Brain Games'],
  'Brain Games':           ['Diversions'],
  'wellness':              ['Energy'],
  'Intercourse':           ['Discourse'],
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

function fuzzyMatch(query, target) {
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  if (t.includes(q)) return true;
  let qi = 0;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) qi++;
  }
  return qi === q.length;
}

// ════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════
export default function DashBoard({ allTools, searchTerm, setSearchTerm }) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortMode, setSortMode]             = useState('alpha');
  const [favorites, setFavorites]           = useState(() => loadFromStorage(STORAGE_KEYS.favorites));
  const [recents, setRecents]               = useState(() => loadFromStorage(STORAGE_KEYS.recents));
  const searchRef     = useRef(null);
  const resultsRef    = useRef(null);
  const stripScrollRef = useRef(null);
  const pillRefsMap    = useRef({});
  const catalogRef     = useRef(null); // hero CTA scroll target (category strip)

  // ⌘K shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
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

  // Usage frequency from recents
  const usageFrequency = useMemo(() => {
    const freq = {};
    recents.forEach((id, idx) => { freq[id] = (freq[id] || 0) + (recents.length - idx); });
    return freq;
  }, [recents]);

  // Augment tools with resolved categories array
  const toolsWithCategories = useMemo(() =>
    (allTools || []).map(tool => ({
      ...tool,
      resolvedCategories: resolveCategories(tool),
      primaryCategory:    resolveCategories(tool)[0],
    })),
  [allTools]);

  // Category counts (tool counted once per category it belongs to)
  const categoryCounts = useMemo(() => {
    const counts = {};
    toolsWithCategories.forEach(t => {
      t.resolvedCategories.forEach(cat => {
        counts[cat] = (counts[cat] || 0) + 1;
      });
    });
    return counts;
  }, [toolsWithCategories]);

  // Filtered + sorted tools
  const filteredTools = useMemo(() => {
    let list = toolsWithCategories;

    if (activeCategory === 'Favorites') {
      list = list.filter(t => favorites.includes(t.id));
    } else if (activeCategory !== 'All') {
      list = list.filter(t => t.resolvedCategories.includes(activeCategory));
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(t => {
        if (t.title.toLowerCase().includes(q)) return true;
        if ((t.description || '').toLowerCase().includes(q)) return true;
        if ((t.tagline || '').toLowerCase().includes(q)) return true;
        const tags = t.tags || [];
        if (tags.some(tag => tag.includes(q) || q.includes(tag))) return true;
        if (q.length >= 3 && fuzzyMatch(q, t.title)) return true;
        return false;
      });
    }

    list = [...list];
    const strip = s => String(s || '').replace(/^The\s+/i, '');
    if (sortMode === 'mostUsed') {
      list.sort((a, b) => (usageFrequency[b.id] || 0) - (usageFrequency[a.id] || 0));
    } else {
      const catOrder = {};
      CATEGORY_META.forEach((cm, i) => { catOrder[cm.name] = i; });
      list.sort((a, b) => {
        const aCat = catOrder[a.primaryCategory] ?? 999;
        const bCat = catOrder[b.primaryCategory] ?? 999;
        if (aCat !== bCat) return aCat - bCat;
        return strip(a.title).localeCompare(strip(b.title));
      });
    }
    return list;
  }, [toolsWithCategories, activeCategory, searchTerm, favorites, sortMode, usageFrequency]);

  // Group tools by primary category for "All" view
  const showCategoryHeadings = activeCategory === 'All' && sortMode === 'alpha' && !searchTerm.trim();
  const groupedTools = useMemo(() => {
    if (!showCategoryHeadings) return null;
    const groups = [];
    CATEGORY_META.forEach(cm => {
      const tools = filteredTools.filter(t => t.primaryCategory === cm.name);
      if (tools.length > 0) groups.push({ ...cm, tools });
    });
    const mapped = new Set(CATEGORY_META.map(cm => cm.name));
    const other = filteredTools.filter(t => !mapped.has(t.primaryCategory));
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
  const selectCategory = useCallback((cat) => {
    setActiveCategory(cat);
    if (cat !== 'All') {
      setTimeout(() => {
        // Scroll the strip to show the active pill
        const scroll = stripScrollRef.current;
        const pill   = pillRefsMap.current[cat];
        if (scroll && pill) {
          scroll.scrollTo({ left: pill.offsetLeft - 8, behavior: 'smooth' });
        }
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const isSearching  = searchTerm.trim().length > 0;
  const activeMeta   = CATEGORY_META.find(c => c.name === activeCategory);

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 pb-6"
         style={{ background: CLR.sand50, minHeight: '100vh' }}>
      <style>{`.db-strip-scroll::-webkit-scrollbar{display:none}`}</style>

      {/* ═══════════ HEADER ═══════════ */}
      <header className="w-full py-3" style={{ borderBottom: `1px solid ${CLR.sand200}` }}>
        <h1 style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>
          DeftBrain — AI-Powered Tools for Everyday Life
        </h1>
        {/* Brand left, locale controls right — the header is now the single,
            consistent home for language/currency everywhere (tool pages carry
            their own via ToolPageWrapper; the footer copy was removed). */}
        <div className="flex items-center justify-between gap-3">
          <BrandMark direction="left" size="md" isDark={false} showTagline={true} />
          <LocaleSelectors dark={false} />
        </div>
        <div className="mt-4">
          {!isSearching && <HeroPitch isDark={false} />}
        </div>
        {/* The fold's next step. The catalog is the product, but it starts
            2+ screens down on mobile — without this, a visitor who doesn't
            scroll past the demos never learns the breadth exists. */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4">
          <button
            onClick={() => catalogRef.current && catalogRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="px-4 py-2 rounded-xl text-[13px] font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: CLR.navy500 }}
          >
            Browse Categories ↓
          </button>
          <Link to="/ToolFinder" className="text-[13px] font-semibold hover:underline" style={{ color: CLR.gold700 }}>
            or describe your problem — we&rsquo;ll find the tool &rarr;
          </Link>
        </div>
      </header>

      {/* ═══════════ DEMO CARDS ═══════════ */}
      {/* Persistent controls row: search + sort right-justified — stays mounted
          so search never disappears. The "Examples" label lives directly above
          the first card (not in this row) so it labels the cards, not the
          search box — on mobile the row wraps and the old placement left the
          label orphaned far from its content. */}
      <div className="flex items-center justify-end gap-3 mt-4 mb-3" style={{ paddingInlineStart: 12, paddingInlineEnd: 12 }}>
        <div className="flex items-center gap-2 flex-shrink-0">
          <SearchBox searchRef={searchRef} searchTerm={searchTerm} setSearchTerm={setSearchTerm} setActiveCategory={setActiveCategory} />
          <SortBtn sortMode={sortMode} setSortMode={setSortMode} />
        </div>
      </div>
      {!isSearching && (
        <>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] mb-2"
             style={{ color: CLR.navy500, paddingInlineStart: 12 }}>Examples</p>
          <DemoCards isDark={false} />
        </>
      )}

      {/* ═══════════ TOOL FINDER WIZARD ═══════════ */}
      {!isSearching && <div className="mt-4"><ToolFinderWizard /></div>}

      {/* ═══════════ CATEGORY STRIP ═══════════ */}
      <div ref={catalogRef} className="flex items-center mb-1 mt-3" style={{ paddingInlineStart: 12, scrollMarginTop: 12 }}>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.15em]"
           style={{ color: CLR.navy500 }}>Categories</p>
      </div>
      <div className="mb-3" style={{
        background: CLR.navy500,
        borderRadius: 14,
        padding: '10px 12px',
        boxShadow: `0 2px 12px ${CLR.navy500}40`,
        overflow: 'hidden',
      }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        {/* Fixed anchors — never scroll */}
        <div style={{ display: 'flex', gap: 5, flexShrink: 0, alignItems: 'center' }}>
          <TilePill label="ALL"   emoji="🏠" count={toolsWithCategories.length} hideCount highlight
            isActive={activeCategory === 'All'}       onClick={() => selectCategory('All')} />
          {/* "Faves ⭐ 0" is a dead pill for every first-time visitor and eats
              scarce strip width on mobile — it appears once something's faved. */}
          {favorites.length > 0 && (
            <TilePill label="Faves" emoji="⭐" count={favorites.length}
              isActive={activeCategory === 'Favorites'} onClick={() => selectCategory('Favorites')} />
          )}
          <div style={{ width: 1, background: 'rgba(255,255,255,0.12)', flexShrink: 0, margin: '0 3px', alignSelf: 'stretch' }} />
        </div>
        {/* Scrollable categories + fade hint */}
        <div style={{ position: 'relative', flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <div ref={stripScrollRef} className="db-strip-scroll" style={{
            display: 'flex',
            gap: 5,
            overflowX: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            paddingInlineEnd: 40,
          }}>
            {CATEGORY_META.map(cat => {
              const count = categoryCounts[cat.name] || 0;
              if (!count) return null;
              return (
                <span key={cat.name} ref={el => { if (el) pillRefsMap.current[cat.name] = el; }}
                      style={{ display: 'inline-flex', flexShrink: 0 }}>
                  <TilePill
                    label={cat.name}
                    emoji={cat.emoji}
                    tag={cat.tag}
                    count={count}
                    title={cat.sub}
                    isActive={activeCategory === cat.name}
                    onClick={() => selectCategory(activeCategory === cat.name ? 'All' : cat.name)}
                  />
                </span>
              );
            })}
          </div>
          {/* Fade-to-container + chevron scroll hint */}
          <div style={{
            position: 'absolute', right: 0, top: 0, bottom: 0, width: 48,
            background: `linear-gradient(to right, ${CLR.navy500}00, ${CLR.navy500} 65%)`,
            pointerEvents: 'none', zIndex: 2,
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
            paddingInlineEnd: 2,
          }}>
            {/* 13px @ 45% was invisible in practice — 9 of 12 categories hide
                behind this scroll on a phone, so the hint has to be seen. */}
            <span style={{ fontSize: 17, fontWeight: 700, color: 'rgba(255,255,255,0.85)', lineHeight: 1 }}>›</span>
          </div>
        </div>
      </div>
      </div>

      {/* ═══════════ RESULTS HEADER ═══════════ */}
      <div ref={resultsRef} style={{ scrollMarginTop: 16 }}>

        {/* Search result count — tight below category bar */}
        {isSearching && (
          <p className="text-[11px] font-semibold mt-2 mb-1" style={{ color: CLR.warm500 }}>
            {filteredTools.length === 0
              ? 'No tools found — try different words'
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
          {isSearching && <IdeaPrompt source="search-zero" query={searchTerm.trim()} />}
        </div>
      )}

      {/* ═══════════ TOOL LIST ═══════════ */}
      {groupedTools ? (
        groupedTools.map(group => (
          <div key={group.name} className="mb-6">
            <div className="flex items-center gap-2 mb-1.5 mt-2">
              <button
                onClick={() => selectCategory(group.name)}
                title={`Filter by ${group.name}`}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = CLR.gold500;
                  e.currentTarget.style.background = '#ffffff';
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
            <ToolColumns tools={group.tools} favorites={favorites}
              onToggleFavorite={toggleFavorite} onNavigate={recordRecent} showCategory={false} />
          </div>
        ))
      ) : (
        <ToolColumns tools={filteredTools} favorites={favorites}
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
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
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
          width: searchTerm ? 320 : 160,
          border: `1.5px solid ${CLR.sand300}`,
          borderRadius: 8,
          background: '#fff',
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

function SortBtn({ sortMode, setSortMode }) {
  return (
    <button
      onClick={() => setSortMode(prev => prev === 'alpha' ? 'mostUsed' : 'alpha')}
      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors"
      style={{ color: CLR.warm700 }}
      title={sortMode === 'alpha' ? 'Sorted A–Z' : 'Sorted by most used'}
    >
      <span className="text-xs">↕️</span>
      {sortMode === 'alpha' ? 'A–Z' : 'Most Used'}
    </button>
  );
}

// ════════════════════════════════════════════════════════════
// TILE PILL (All / Favorites)
// ════════════════════════════════════════════════════════════
function TilePill({ label, emoji, count, isActive, onClick, hideCount = false, highlight = false, title, tag }) {
  return (
    <button
      onClick={onClick}
      title={title || label}
      className="flex flex-col justify-center px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex-shrink-0"
      style={{
        background: isActive ? CLR.gold300   : CLR.navy600,
        color:      isActive ? CLR.navy700   : 'rgba(255,255,255,0.85)',
        border:     `1.5px solid ${isActive ? CLR.gold500 : highlight ? CLR.gold500 : 'rgba(255,255,255,0.08)'}`,
      }}
    >
      <span className="flex items-center gap-1.5">
        <span style={{ whiteSpace: 'nowrap' }}>{emoji} {label}</span>
        {!hideCount && <span style={{
          fontSize: 9, fontWeight: 800, padding: '0 4px',
          borderRadius: 4,
          background: isActive ? CLR.gold500           : 'rgba(255,255,255,0.12)',
          color:      isActive ? '#fff'                : 'rgba(255,255,255,0.55)',
        }}>{count}</span>}
      </span>
      {/* Plain-language tag under the playful name — lets a first-time visitor
          scan without tapping. Reserves the second line even when absent
          (ALL/Faves) so pill heights stay uniform across the row. */}
      <span style={{
        fontSize: 8.5, fontWeight: 600, lineHeight: 1.1, marginTop: 1,
        letterSpacing: '0.02em', textTransform: 'lowercase',
        color: isActive ? 'rgba(30,42,58,0.62)' : 'rgba(255,255,255,0.5)',
        minHeight: 10, whiteSpace: 'nowrap', textAlign: 'start',
      }}>{tag || ''}</span>
    </button>
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
function ToolColumns({ tools, favorites, onToggleFavorite, onNavigate, showCategory }) {
  const row = (tool) => (
    <ToolRow key={tool.id} tool={tool}
      isFavorite={favorites.includes(tool.id)}
      onToggleFavorite={onToggleFavorite}
      onNavigate={onNavigate}
      showCategory={showCategory} />
  );
  if (tools.length <= 3) return <div>{tools.map(row)}</div>;
  const mid = Math.ceil(tools.length / 2);
  return (
    <div className="md:grid md:grid-cols-2 md:gap-x-4">
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
