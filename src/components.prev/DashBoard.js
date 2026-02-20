// src/components/DashBoard.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Star, Clock, ArrowUpDown, ChevronDown,
} from 'lucide-react';

// ════════════════════════════════════════════════════════════
// CATEGORY CONSOLIDATION  (19 → 8)
// ════════════════════════════════════════════════════════════
const CATEGORY_MAP = {
  'Academic':             'Academic',
  'Life':                 'Life & Lifestyle',
  'Lifestyle':            'Life & Lifestyle',
  'Finance':              'Finance',
  'Consumer Rights':      'Finance',
  'Health':               'Health & Wellness',
  'Mental Health':        'Health & Wellness',
  'Neurodivergent Support': 'Neurodivergent Support',
  'Social':               'Social',
  'Social Skills':        'Social',
  'Productivity':         'Productivity & Career',
  'Strategic':            'Productivity & Career',
  'Goals':                'Productivity & Career',
  'Focus & Productivity': 'Productivity & Career',
  'Career':               'Productivity & Career',
  'Document Analysis':    'Productivity & Career',
  'Communication':        'Communication',
  'Conflict Resolution':  'Communication',
  'Content Creation':     'Communication',
};

const CATEGORY_META = [
  { name: 'Academic',              emoji: '📚', color: '#3b82f6' },
  { name: 'Health & Wellness',     emoji: '💪', color: '#10b981' },
  { name: 'Life & Lifestyle',      emoji: '🌟', color: '#f59e0b' },
  { name: 'Finance',               emoji: '💰', color: '#6366f1' },
  { name: 'Productivity & Career', emoji: '⚡', color: '#8b5cf6' },
  { name: 'Neurodivergent Support',emoji: '🧠', color: '#ec4899' },
  { name: 'Social',                emoji: '👥', color: '#14b8a6' },
  { name: 'Communication',         emoji: '💬', color: '#f97316' },
];

// ════════════════════════════════════════════════════════════
// SEARCH TAGS
// ════════════════════════════════════════════════════════════
const SEARCH_TAGS = {
  ChoiceParalyzerHelper:    ['anxiety', 'decision', 'stuck', 'overwhelm', 'options', 'indecisive'],
  ConfrontationAvoider:     ['anxiety', 'conflict', 'avoid', 'scared', 'uncomfortable', 'difficult conversation'],
  EmotionIdentifier:        ['feelings', 'mood', 'sad', 'angry', 'confused', 'emotional', 'anxiety'],
  CriticismBuffer:          ['feedback', 'hurt', 'sensitive', 'rejection', 'anxiety', 'criticism'],
  ExecutiveFunctionProsthetic: ['adhd', 'focus', 'procrastination', 'executive function', 'start', 'task'],
  HyperfocusInterrupter:    ['adhd', 'hyperfocus', 'time blind', 'lost track', 'obsessed'],
  TransitionSoftener:       ['adhd', 'change', 'routine', 'switch', 'transition', 'stuck'],
  TaskAvalancheBreaker:     ['overwhelm', 'todo', 'too much', 'prioritize', 'anxiety', 'procrastination'],
  MeetingBullshitDetector:  ['meeting', 'waste time', 'unnecessary', 'decline', 'calendar'],
  RecipeChaosSolver:        ['cooking', 'food', 'recipe', 'kitchen', 'ingredients', 'dinner'],
  LeftoverRoulette:         ['cooking', 'food', 'leftovers', 'fridge', 'meal', 'dinner'],
  BillGuiltEraser:          ['bills', 'money', 'guilt', 'spending', 'budget', 'financial'],
  MoneyShameRemover:        ['money', 'shame', 'financial', 'debt', 'spending', 'embarrassed'],
  SubscriptionGuiltTrip:    ['subscription', 'cancel', 'waste', 'recurring', 'money'],
  LazyWorkoutAdapter:       ['exercise', 'workout', 'lazy', 'fitness', 'motivation', 'gym'],
  PlantDeathPreventer:      ['plant', 'garden', 'water', 'dying', 'care', 'houseplant'],
  BragSheetBuilder:         ['resume', 'achievements', 'career', 'promotion', 'accomplishments'],
  ApologyCalibrator:        ['sorry', 'apology', 'apologize', 'mistake', 'forgiveness'],
  DoubleBookingDiplomat:    ['schedule', 'conflict', 'calendar', 'cancel', 'reschedule'],
  AwkwardSilenceFiller:     ['conversation', 'awkward', 'small talk', 'social', 'anxiety'],
  MicroAdventureMapper:     ['bored', 'adventure', 'explore', 'fun', 'weekend', 'activity'],
  LeaseTrapDetector:        ['lease', 'rent', 'apartment', 'landlord', 'tenant', 'housing'],
  ComplaintEscalationWriter:['complaint', 'customer service', 'escalate', 'refund', 'manager'],
  VelvetHammer:             ['negotiate', 'persuade', 'firm', 'boundary', 'pushback', 'assertive'],
  ConflictTextCoach:        ['text', 'argument', 'fight', 'respond', 'message', 'conflict'],
  ReplyUrgencyTriager:      ['email', 'reply', 'urgent', 'inbox', 'prioritize', 'respond'],
  NameAnxietyDestroyer:     ['name', 'forget', 'remember', 'embarrassed', 'social'],
  BelievableExcuseGenerator:['excuse', 'cancel', 'avoid', 'bail', 'decline', 'skip'],
  GratitudeDebtClearer:     ['thank you', 'gratitude', 'owe', 'appreciate', 'thank'],
  ReviewParanoiaHelper:     ['review', 'paranoid', 'feedback', 'rating', 'worried'],
  AntiGiftPanic:            ['gift', 'present', 'birthday', 'holiday', 'shopping', 'what to buy'],
  ClosetChaosResolver:      ['clothes', 'outfit', 'closet', 'wardrobe', 'wear', 'fashion'],
  PetWeirdnessDecoder:      ['pet', 'dog', 'cat', 'behavior', 'weird', 'animal'],
  FridgeAlchemy:            ['cooking', 'fridge', 'ingredients', 'meal', 'food'],
  SpiralStopper:            ['anxiety', 'spiral', 'panic', 'worry', 'catastrophize'],
  ZenMode:                  ['calm', 'relax', 'meditation', 'stress', 'breathe'],
  SleepDebt:                ['sleep', 'tired', 'insomnia', 'rest', 'fatigue'],
  DrinkWater:               ['water', 'hydration', 'dehydrated', 'drink', 'health'],
  MedsCheck:                ['medication', 'drugs', 'interaction', 'prescription', 'pharmacy'],
  SymptomSolver:            ['symptoms', 'sick', 'diagnosis', 'health', 'doctor'],
  CodeFix:                  ['code', 'bug', 'programming', 'debug', 'error'],
  SpeedReader:              ['reading', 'speed', 'study', 'comprehension', 'textbook'],
  GradeGraveyard:           ['grades', 'gpa', 'failing', 'academic', 'school'],
  TheCurve:                 ['grades', 'curve', 'exam', 'test', 'academic'],
  FlashScan:                ['flashcards', 'study', 'memorize', 'quiz', 'exam'],
  Recall:                   ['memory', 'remember', 'study', 'review', 'retention'],
};

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
  const [sortMode, setSortMode] = useState('alpha');
  const [favorites, setFavorites] = useState(() => loadFromStorage(STORAGE_KEYS.favorites));
  const [recents, setRecents] = useState(() => loadFromStorage(STORAGE_KEYS.recents));
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const mobileNavRef = useRef(null);

  // Close mobile nav on outside click
  useEffect(() => {
    if (!mobileNavOpen) return;
    const handler = (e) => {
      if (mobileNavRef.current && !mobileNavRef.current.contains(e.target)) {
        setMobileNavOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [mobileNavOpen]);

  // Persist
  useEffect(() => { saveToStorage(STORAGE_KEYS.favorites, favorites); }, [favorites]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.recents, recents); }, [recents]);

  // Usage frequency from recents
  const usageFrequency = useMemo(() => {
    const freq = {};
    recents.forEach((id, idx) => {
      freq[id] = (freq[id] || 0) + (recents.length - idx);
    });
    return freq;
  }, [recents]);

  // Consolidate categories
  const toolsWithCategory = useMemo(() =>
    (allTools || []).map(tool => ({
      ...tool,
      consolidatedCategory: CATEGORY_MAP[tool.category] || tool.category,
    })),
  [allTools]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts = {};
    toolsWithCategory.forEach(t => {
      counts[t.consolidatedCategory] = (counts[t.consolidatedCategory] || 0) + 1;
    });
    return counts;
  }, [toolsWithCategory]);

  // Filtered + sorted tools
  const filteredTools = useMemo(() => {
    let list = toolsWithCategory;

    if (activeCategory === 'Favorites') {
      list = list.filter(t => favorites.includes(t.id));
    } else if (activeCategory !== 'All') {
      list = list.filter(t => t.consolidatedCategory === activeCategory);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(t => {
        if (t.title.toLowerCase().includes(q)) return true;
        if (t.description.toLowerCase().includes(q)) return true;
        const tags = SEARCH_TAGS[t.id] || [];
        if (tags.some(tag => tag.includes(q) || q.includes(tag))) return true;
        if (q.length >= 3 && fuzzyMatch(q, t.title)) return true;
        return false;
      });
    }

    list = [...list];
    if (sortMode === 'mostUsed') {
      list.sort((a, b) => (usageFrequency[b.id] || 0) - (usageFrequency[a.id] || 0));
    } else {
      list.sort((a, b) => a.title.localeCompare(b.title));
    }

    return list;
  }, [toolsWithCategory, activeCategory, searchTerm, favorites, sortMode, usageFrequency]);

  // Recent tools for sidebar (max 3)
  const sidebarRecents = useMemo(() =>
    recents.slice(0, 3).map(id => toolsWithCategory.find(t => t.id === id)).filter(Boolean),
  [recents, toolsWithCategory]);

  // Handlers
  const toggleFavorite = useCallback((toolId, e) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites(prev =>
      prev.includes(toolId) ? prev.filter(id => id !== toolId) : [...prev, toolId]
    );
  }, []);

  const recordRecent = useCallback((toolId) => {
    setRecents(prev => [toolId, ...prev.filter(id => id !== toolId)].slice(0, 20));
  }, []);

  const selectCategory = useCallback((cat) => {
    setActiveCategory(cat);
    setMobileNavOpen(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const isSearching = searchTerm.trim().length > 0;
  const getAccent = (tool) =>
    CATEGORY_META.find(c => c.name === tool.consolidatedCategory)?.color || '#64748b';
  const activeMeta = CATEGORY_META.find(c => c.name === activeCategory);

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pb-20 lg:pb-8">

      {/* ═══════════ LAYOUT: SIDEBAR + CONTENT ═══════════ */}
      <div className="flex gap-8 mt-2">

        {/* ── SIDEBAR (desktop) ── */}
        <aside className="hidden lg:block w-52 flex-shrink-0">
          <nav className="sticky top-4 space-y-0.5">

            {/* All */}
            <SidebarItem
              emoji="🏠"
              label="All Tools"
              count={toolsWithCategory.length}
              isActive={activeCategory === 'All'}
              onClick={() => selectCategory('All')}
            />

            {/* Favorites */}
            <SidebarItem
              icon={<Star className={`w-4 h-4 ${favorites.length > 0 ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />}
              label="Favorites"
              count={favorites.length}
              isActive={activeCategory === 'Favorites'}
              onClick={() => selectCategory('Favorites')}
            />

            <div className="border-t border-slate-100 my-2" />

            {/* Categories */}
            {CATEGORY_META.filter(cm => (categoryCounts[cm.name] || 0) > 0).map(cm => (
              <SidebarItem
                key={cm.name}
                emoji={cm.emoji}
                label={cm.name}
                count={categoryCounts[cm.name]}
                isActive={activeCategory === cm.name}
                onClick={() => selectCategory(cm.name)}
              />
            ))}

            {/* Recently Used (bottom of sidebar) */}
            {sidebarRecents.length > 0 && (
              <>
                <div className="border-t border-slate-100 mt-4 mb-3" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3 h-3" /> Recent
                </p>
                {sidebarRecents.map(tool => (
                  <Link
                    key={`sr-${tool.id}`}
                    to={`/${tool.id}`}
                    onClick={() => recordRecent(tool.id)}
                    className="no-underline flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors truncate"
                  >
                    <span className="text-sm flex-shrink-0">{tool.icon || '✨'}</span>
                    <span className="truncate">{tool.title}</span>
                  </Link>
                ))}
              </>
            )}
          </nav>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 min-w-0">

          {/* Title bar + sort */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {activeCategory === 'All' && <span className="text-lg">🏠</span>}
              {activeCategory === 'Favorites' && <Star className="w-5 h-5 fill-amber-400 text-amber-400" />}
              {activeMeta && <span className="text-lg">{activeMeta.emoji}</span>}
              <h2 className="text-base font-extrabold text-slate-800 tracking-tight">
                {activeCategory === 'All' ? 'All Tools' : activeCategory}
              </h2>
              <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                {filteredTools.length}
              </span>
              {isSearching && (
                <span className="text-xs text-slate-400 font-medium ml-1">
                  for "{searchTerm}"
                </span>
              )}
            </div>

            <button
              onClick={() => setSortMode(prev => prev === 'alpha' ? 'mostUsed' : 'alpha')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors"
              title={sortMode === 'alpha' ? 'Sorted A–Z. Click for most used.' : 'Sorted by most used. Click for A–Z.'}
            >
              <ArrowUpDown className="w-3 h-3" />
              {sortMode === 'alpha' ? 'A–Z' : 'Most Used'}
            </button>
          </div>

          {/* Empty favorites prompt */}
          {activeCategory === 'Favorites' && favorites.length === 0 && !isSearching && (
            <div className="text-center py-14">
              <Star className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-400">No favorites yet</p>
              <p className="text-xs text-slate-400 mt-1">
                Hover over any tool and click the <Star className="w-3 h-3 inline text-amber-400 fill-amber-400 -mt-0.5" /> to pin it here
              </p>
            </div>
          )}

          {/* Empty search state */}
          {filteredTools.length === 0 && (activeCategory !== 'Favorites' || favorites.length > 0) && (
            <div className="text-center py-14">
              <p className="text-3xl mb-3">🔍</p>
              <p className="text-sm font-bold text-slate-400">No tools found</p>
              <p className="text-xs text-slate-400 mt-1">
                {isSearching ? 'Try a different search term' : 'Nothing in this category'}
              </p>
            </div>
          )}

          {/* Tool list */}
          <div className="divide-y divide-slate-50">
            {filteredTools.map(tool => (
              <ToolRow
                key={tool.id}
                tool={tool}
                isFavorite={favorites.includes(tool.id)}
                onToggleFavorite={toggleFavorite}
                onNavigate={recordRecent}
                accentColor={getAccent(tool)}
                showCategory={isSearching}
              />
            ))}
          </div>
        </main>
      </div>

      {/* ── Mobile bottom nav (dropdown) ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40" ref={mobileNavRef}>
        {mobileNavOpen && (
          <div className="bg-white border-t border-slate-200 shadow-lg px-4 py-3 grid grid-cols-2 gap-1.5 max-h-64 overflow-y-auto">
            <MobileNavOption
              label="All Tools"
              emoji="🏠"
              count={toolsWithCategory.length}
              isActive={activeCategory === 'All'}
              onClick={() => selectCategory('All')}
            />
            <MobileNavOption
              label="Favorites"
              icon={<Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />}
              count={favorites.length}
              isActive={activeCategory === 'Favorites'}
              onClick={() => selectCategory('Favorites')}
            />
            {CATEGORY_META.filter(cm => (categoryCounts[cm.name] || 0) > 0).map(cm => (
              <MobileNavOption
                key={cm.name}
                label={cm.name}
                emoji={cm.emoji}
                count={categoryCounts[cm.name]}
                isActive={activeCategory === cm.name}
                onClick={() => selectCategory(cm.name)}
              />
            ))}
          </div>
        )}

        <button
          onClick={() => setMobileNavOpen(prev => !prev)}
          className="w-full bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2.5 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            {activeCategory === 'All' && <span>🏠</span>}
            {activeCategory === 'Favorites' && <Star className="w-4 h-4 fill-amber-400 text-amber-400" />}
            {activeMeta && <span>{activeMeta.emoji}</span>}
            <span className="text-sm font-bold text-slate-700">
              {activeCategory === 'All' ? 'All Tools' : activeCategory}
            </span>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
              {filteredTools.length}
            </span>
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${mobileNavOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// SIDEBAR ITEM
// ════════════════════════════════════════════════════════════
function SidebarItem({ emoji, icon, label, count, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-colors group ${
        isActive
          ? 'bg-blue-50 text-blue-700 font-semibold'
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-semibold'
      }`}
    >
      {icon || <span className="text-base flex-shrink-0 w-5 text-center">{emoji}</span>}
      <span className="flex-1 truncate text-[13px]">{label}</span>
      <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md min-w-[24px] text-center ${
        isActive
          ? 'bg-blue-100 text-blue-600'
          : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-500'
      }`}>
        {count}
      </span>
    </button>
  );
}

// ════════════════════════════════════════════════════════════
// TOOL ROW (compact list item — emoji icon from tool.icon)
// ════════════════════════════════════════════════════════════
function ToolRow({ tool, isFavorite, onToggleFavorite, onNavigate, accentColor, showCategory }) {
  return (
    <Link
      to={`/${tool.id}`}
      onClick={() => onNavigate(tool.id)}
      className="no-underline group"
    >
      <div className="flex items-center gap-3.5 py-2.5 px-2.5 -mx-2.5 rounded-xl hover:bg-slate-50 transition-colors">
        {/* Emoji icon */}
        <div
          className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg text-lg"
          style={{ backgroundColor: accentColor ? `${accentColor}10` : '#f1f5f9' }}
        >
          {tool.icon || '✨'}
        </div>

        {/* Title + description */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-[13px] font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
              {tool.title}
            </h3>
            {showCategory && (
              <span
                className="hidden sm:inline text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded flex-shrink-0"
                style={{ color: accentColor, backgroundColor: `${accentColor}12` }}
              >
                {tool.consolidatedCategory}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5 leading-snug">
            {tool.description}
          </p>
        </div>

        {/* Favorite star */}
        <button
          onClick={(e) => onToggleFavorite(tool.id, e)}
          className={`p-1 rounded-lg transition-[color,background-color,opacity] duration-150 flex-shrink-0 ${
            isFavorite
              ? 'text-amber-400 hover:bg-amber-50'
              : 'text-slate-200 hover:text-slate-400 hover:bg-slate-100 opacity-0 group-hover:opacity-100'
          }`}
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-amber-400' : ''}`} />
        </button>

        {/* Arrow */}
        <span className="text-slate-300 group-hover:text-blue-400 transition-colors flex-shrink-0 text-xs">
          →
        </span>
      </div>
    </Link>
  );
}

// ════════════════════════════════════════════════════════════
// MOBILE NAV OPTION
// ════════════════════════════════════════════════════════════
function MobileNavOption({ label, emoji, icon, count, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-colors ${
        isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
      }`}
    >
      {icon || <span className="text-sm">{emoji}</span>}
      <span className="flex-1 truncate">{label}</span>
      <span className={`text-[10px] font-bold px-1 py-0.5 rounded min-w-[20px] text-center ${
        isActive ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'
      }`}>
        {count}
      </span>
    </button>
  );
}
