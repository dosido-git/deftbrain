// src/components/DashBoard.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';

import BrandMark from './BrandMark';
import HeroPitch from './HeroPitch';
import DemoCards from './DemoCards';
import ToolFinderWizard from './ToolFinderWizard';

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
  warm500: '#8a8275',
  warm700: '#5a544a',
  warm800: '#3d3935',
};

// ════════════════════════════════════════════════════════════
// CATEGORY DEFINITIONS — 17 categories
// ════════════════════════════════════════════════════════════
const CATEGORY_META = [
  { name: 'The Grind',     emoji: '🌅', sub: 'home · household · daily life' },
  { name: 'Out & About',   emoji: '🗺️',  sub: 'travel · events · adventure'  },
  { name: 'Humans',        emoji: '👥', sub: 'relationships · people · bonds' },
  { name: 'Loot',          emoji: '💰', sub: 'money · finances · consumer'   },
  { name: 'Pursuits',      emoji: '🚀', sub: 'career · growth · identity'    },
  { name: 'The Office',    emoji: '🏢', sub: 'work · meetings · tools'       },
  { name: 'Energy',        emoji: '⚡', sub: 'focus · stamina · regulation'  },
  { name: 'Body',          emoji: '💪', sub: 'health · exercise · medical'   },
  { name: 'Discourse',     emoji: '🗣️ ', sub: 'say it well!'           },
  { name: 'Read the Room', emoji: '👁️',  sub: 'subtext · tone · decoding'    },
  { name: 'Go Deep!',      emoji: '🔬', sub: 'research · learning · knowledge'},
  { name: 'Diversions',   emoji: '🧩', sub: 'curiosity · play · intellect'  },
  { name: 'Me',            emoji: '🪞', sub: 'self · reflection · growth'    },
  { name: 'What If?',      emoji: '✨', sub: 'imagination · creativity'      },
  { name: 'Veer',          emoji: '🧭', sub: 'decisions · direction · choices'},
  { name: 'Do It!',        emoji: '✅', sub: 'execution · unstuck · tasks'   },
  { name: 'Detour',        emoji: '🎲', sub: 'fun · play · diversions'       },
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
        <BrandMark direction="left" size="lg" isDark={false} showTagline={true} />
        {!isSearching && (
          <HeroPitch
            isDark={false}
            className="mt-4"
          />
        )}
      </header>

      {/* ═══════════ SEARCH + SORT — top-level affordance ═══════════ */}
      {/* Always rendered so SearchBox stays mounted through isSearching transitions. */}
      <div className="flex items-center justify-between mt-3 mb-1">
        {isSearching ? (
          <p className="text-[11px] font-semibold" style={{ color: CLR.warm500 }}>
            {filteredTools.length === 0
              ? 'No tools found — try different words'
              : `${filteredTools.length} tool${filteredTools.length !== 1 ? 's' : ''} for "${searchTerm}"`}
          </p>
        ) : <div />}
        <div className="flex items-center gap-2">
          <SearchBox searchRef={searchRef} searchTerm={searchTerm} setSearchTerm={setSearchTerm} setActiveCategory={setActiveCategory} />
          <SortBtn sortMode={sortMode} setSortMode={setSortMode} />
        </div>
      </div>

      {/* ═══════════ DEMO CARDS — see what tools actually do ═══════════ */}
      {!isSearching && <DemoCards isDark={false} className="mt-6" />}

      {/* ═══════════ TOOL FINDER WIZARD ═══════════ */}
      {!isSearching && <ToolFinderWizard />}

      {/* ═══════════ CATEGORY STRIP ═══════════ */}
      <div className="flex items-center mb-1" style={{ paddingLeft: 12 }}>
        <div style={{ width: 163, flexShrink: 0 }} />
        <p className="text-[10px] font-extrabold uppercase tracking-[0.15em]"
           style={{ color: CLR.warm500 }}>Categories</p>
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
          <TilePill label="Faves" emoji="⭐" count={favorites.length}
            isActive={activeCategory === 'Favorites'} onClick={() => selectCategory('Favorites')} />
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
            paddingRight: 40,
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
            paddingRight: 2,
          }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1 }}>›</span>
          </div>
        </div>
      </div>
      </div>

      {/* ═══════════ RESULTS HEADER ═══════════ */}
      <div ref={resultsRef} style={{ scrollMarginTop: 16 }}>

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
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
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
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded ml-1"
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
          <p className="text-xs mt-1" style={{ color: CLR.warm500 }}>
            {isSearching ? 'Try different words' : 'Nothing in this category yet'}
          </p>
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
            <div className={`${group.tools.length > 3 ? 'md:columns-2' : ''} gap-x-4`}>
              {group.tools.map(tool => (
                <ToolRow key={tool.id} tool={tool}
                  isFavorite={favorites.includes(tool.id)}
                  onToggleFavorite={toggleFavorite}
                  onNavigate={recordRecent}
                  showCategory={false} />
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className={`${filteredTools.length > 3 ? 'md:columns-2' : ''} gap-x-4`}>
          {filteredTools.map(tool => (
            <ToolRow key={tool.id} tool={tool}
              isFavorite={favorites.includes(tool.id)}
              onToggleFavorite={toggleFavorite}
              onNavigate={recordRecent}
              showCategory={isSearching || activeCategory === 'All'} />
          ))}
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
        placeholder="Find"
        style={{
          paddingLeft: 22, paddingRight: searchTerm ? 22 : 8,
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
function TilePill({ label, emoji, count, isActive, onClick, hideCount = false, highlight = false, title }) {
  return (
    <button
      onClick={onClick}
      title={title || label}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex-shrink-0"
      style={{
        background: isActive ? CLR.gold300   : CLR.navy600,
        color:      isActive ? CLR.navy700   : 'rgba(255,255,255,0.85)',
        border:     `1.5px solid ${isActive ? CLR.gold500 : highlight ? CLR.gold500 : 'rgba(255,255,255,0.08)'}`,
      }}
    >
      <span style={{ whiteSpace: 'nowrap' }}>{emoji} {label}</span>
      {!hideCount && <span style={{
        fontSize: 9, fontWeight: 800, padding: '0 4px',
        borderRadius: 4,
        background: isActive ? CLR.gold500           : 'rgba(255,255,255,0.12)',
        color:      isActive ? '#fff'                : 'rgba(255,255,255,0.55)',
      }}>{count}</span>}
    </button>
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
      className="no-underline group"
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

        {/* Favorite */}
        <button
          onClick={(e) => onToggleFavorite(tool.id, e)}
          className="p-1 rounded-lg transition-all flex-shrink-0"
          style={{
            color:      isFavorite ? '#f59e0b' : CLR.sand300,
            opacity:    isFavorite ? 1 : hovered ? 1 : 0,
            background: 'transparent',
          }}
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <span className="text-sm leading-none">⭐</span>
        </button>

        {/* Arrow */}
        <span className="flex-shrink-0 text-xs transition-colors"
              style={{ color: hovered ? CLR.navy400 : CLR.sand300 }}>→</span>
      </div>
    </Link>
  );
}
