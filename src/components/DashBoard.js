// src/components/DashBoard.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import BrandMark from './BrandMark';

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
  { name: 'Brain Games',   emoji: '🧩', sub: 'curiosity · play · intellect'  },
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
  const searchRef = useRef(null);

  // ⌘K shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === 'Escape') setSearchTerm('');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setSearchTerm]);

  // Persist
  useEffect(() => { saveToStorage(STORAGE_KEYS.favorites, favorites); }, [favorites]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.recents,   recents);   }, [recents]);

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
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const isSearching  = searchTerm.trim().length > 0;
  const activeMeta   = CATEGORY_META.find(c => c.name === activeCategory);

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 pb-16"
         style={{ background: CLR.sand50, minHeight: '100vh' }}>

      {/* ═══════════ HEADER ═══════════ */}
      <header className="w-full py-3" style={{ borderBottom: `1px solid ${CLR.sand200}` }}>
        <BrandMark direction="left" size="lg" isDark={false} showTagline={true} />
      </header>

      {/* ═══════════ HERO SEARCH ═══════════ */}
      <div className="w-full max-w-sm mx-auto -mt-2 mb-7 px-2 pt-5">
        <p className="text-center text-[10px] font-extrabold uppercase tracking-[0.15em] mb-3"
           style={{ color: CLR.warm500 }}>
          How can we help…?
        </p>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base pointer-events-none">🔍</span>
          <input
            ref={searchRef}
            type="text"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setActiveCategory('All'); }}
            placeholder="Type a word or two…"
            className="w-full pl-10 pr-10 py-2 rounded-xl text-sm font-medium outline-none transition-all"
            style={{
              border: `2px solid ${CLR.sand300}`,
              background: '#fff',
              color: CLR.warm800,
              fontFamily: 'inherit',
            }}
            onFocus={e  => { e.target.style.borderColor = CLR.gold500; e.target.style.boxShadow = `0 0 0 3px ${CLR.gold100}`; }}
            onBlur={e   => { e.target.style.borderColor = CLR.sand300; e.target.style.boxShadow = 'none'; }}
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
            {searchTerm ? (
              <button onClick={() => setSearchTerm('')}
                      className="p-1 rounded-lg transition-colors"
                      style={{ color: CLR.warm500 }}>
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="hidden sm:flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold"
                   style={{ background: CLR.sand100, border: `1px solid ${CLR.sand300}`, color: CLR.warm500 }}>
                ⌘K
              </kbd>
            )}
          </div>
        </div>
        {isSearching && (
          <p className="text-center text-[11px] mt-2" style={{ color: CLR.warm500 }}>
            {filteredTools.length === 0
              ? 'No tools found — try different words'
              : `${filteredTools.length} tool${filteredTools.length !== 1 ? 's' : ''} found`}
          </p>
        )}
      </div>

      {/* ═══════════ CATEGORY TILES ═══════════ */}
      <section className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] flex-shrink-0"
             style={{ color: CLR.sand300 }}>
            Browse by category
          </p>
          <div className="flex-1 h-px" style={{ background: CLR.sand200 }} />
          {/* All Tools + Favorites pills */}
          <div className="flex gap-1.5">
            <TilePill
              label="All"
              emoji="🏠"
              count={toolsWithCategories.length}
              isActive={activeCategory === 'All'}
              onClick={() => selectCategory('All')}
            />
            <TilePill
              label="Faves"
              emoji="⭐"
              count={favorites.length}
              isActive={activeCategory === 'Favorites'}
              onClick={() => selectCategory('Favorites')}
            />
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(128px, 1fr))',
          gap: 6,
        }}>
          {CATEGORY_META.map(cat => {
            const isActive = activeCategory === cat.name;
            const count    = categoryCounts[cat.name] || 0;
            return (
              <CategoryTile
                key={cat.name}
                cat={cat}
                count={count}
                isActive={isActive}
                isEmpty={count === 0}
                onClick={() => { if (count > 0) selectCategory(isActive ? 'All' : cat.name); }}
              />
            );
          })}
        </div>
      </section>

      {/* ═══════════ RESULTS HEADER ═══════════ */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {activeCategory === 'All'       && <span className="text-base">🏠</span>}
          {activeCategory === 'Favorites' && <span className="text-base">⭐</span>}
          {activeMeta                     && <span className="text-base">{activeMeta.emoji}</span>}
          <h2 className="text-sm font-extrabold tracking-tight" style={{ color: CLR.navy700 }}>
            {activeCategory === 'All' ? 'All Tools' : activeCategory}
          </h2>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                style={{ background: CLR.sand100, color: CLR.warm500 }}>
            {filteredTools.length}
          </span>
          {isSearching && (
            <span className="text-[11px] font-medium" style={{ color: CLR.warm500 }}>
              for "{searchTerm}"
            </span>
          )}
        </div>

        {/* Sort */}
        <button
          onClick={() => setSortMode(prev => prev === 'alpha' ? 'mostUsed' : 'alpha')}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors"
          style={{ color: CLR.warm700 }}
          title={sortMode === 'alpha' ? 'Sorted A–Z' : 'Sorted by most used'}
        >
          <span className="text-xs">↕️</span>
          {sortMode === 'alpha' ? 'A–Z' : 'Most Used'}
        </button>
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
              <span className="text-sm">{group.emoji}</span>
              <h3 className="text-[10px] font-extrabold uppercase tracking-wider"
                  style={{ color: CLR.warm500 }}>{group.name}</h3>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                    style={{ color: CLR.warm500, background: CLR.sand100 }}>{group.tools.length}</span>
              <div className="flex-1 h-px" style={{ background: CLR.sand200 }} />
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
// CATEGORY TILE
// ════════════════════════════════════════════════════════════
function CategoryTile({ cat, count, isActive, isEmpty, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background:   isActive ? CLR.navy500 : hovered && !isEmpty ? CLR.navy50 : '#fff',
        border:       `1.5px solid ${isActive ? CLR.navy500 : hovered && !isEmpty ? CLR.navy200 : CLR.sand200}`,
        borderRadius: 10,
        padding:      '8px 10px',
        textAlign:    'left',
        cursor:       isEmpty ? 'default' : 'pointer',
        transition:   'all 0.13s',
        opacity:      isEmpty ? 0.4 : 1,
        boxShadow:    isActive ? `0 3px 12px ${CLR.navy500}28` : hovered && !isEmpty ? `0 2px 6px ${CLR.navy100}` : 'none',
      }}
    >
      {/* Emoji + count */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 16, lineHeight: 1 }}>{cat.emoji}</span>
        <span style={{
          fontSize: 9, fontWeight: 800, lineHeight: 1.6,
          padding: '1px 5px', borderRadius: 4,
          color:      isActive ? CLR.navy700 : CLR.warm500,
          background: isActive ? CLR.gold300  : CLR.sand100,
        }}>{count}</span>
      </div>
      {/* Name */}
      <div style={{
        fontSize: 11, fontWeight: 800, lineHeight: 1.25, marginBottom: 2,
        color: isActive ? '#fff' : CLR.navy700,
      }}>{cat.name}</div>
      {/* Sub */}
      <div style={{
        fontSize: 9, lineHeight: 1.35,
        color: isActive ? 'rgba(255,255,255,0.6)' : CLR.warm500,
      }}>{cat.sub}</div>
    </button>
  );
}

// ════════════════════════════════════════════════════════════
// TILE PILL (All / Favorites)
// ════════════════════════════════════════════════════════════
function TilePill({ label, emoji, count, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all"
      style={{
        background: isActive ? CLR.navy500 : CLR.sand100,
        color:      isActive ? '#fff'       : CLR.warm700,
        border:     `1.5px solid ${isActive ? CLR.navy500 : CLR.sand200}`,
      }}
    >
      <span>{emoji}</span>
      <span>{label}</span>
      <span style={{
        fontSize: 9, fontWeight: 800, padding: '0 4px',
        borderRadius: 4,
        background: isActive ? CLR.gold300  : CLR.sand200,
        color:      isActive ? CLR.navy700  : CLR.warm500,
      }}>{count}</span>
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
             style={{ background: CLR.navy50 }}>
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
