import React, { useState, useEffect, useCallback } from 'react';
import { Dices, Loader2, AlertCircle, Bookmark, BookmarkCheck, Shuffle, Flame, Sparkles, ArrowRight } from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';
import { getToolById } from '../data/tools';

// ════════════════════════════════════════════════════════════
// INTEREST CATEGORIES
// ════════════════════════════════════════════════════════════
const INTERESTS = [
  { id: 'science',     label: 'Science',        emoji: '🔬' },
  { id: 'history',     label: 'History',         emoji: '🏛️' },
  { id: 'psychology',  label: 'Psychology',      emoji: '🧠' },
  { id: 'philosophy',  label: 'Philosophy',      emoji: '💭' },
  { id: 'technology',  label: 'Technology',      emoji: '💻' },
  { id: 'nature',      label: 'Nature',          emoji: '🌿' },
  { id: 'food',        label: 'Food & Cooking',  emoji: '🍳' },
  { id: 'pop_culture', label: 'Pop Culture',     emoji: '🎬' },
  { id: 'space',       label: 'Space',           emoji: '🚀' },
  { id: 'art',         label: 'Art & Design',    emoji: '🎨' },
  { id: 'language',    label: 'Language & Words', emoji: '📖' },
  { id: 'economics',   label: 'Economics',       emoji: '📊' },
  { id: 'sports',      label: 'Sports',          emoji: '⚽' },
  { id: 'music',       label: 'Music',           emoji: '🎵' },
  { id: 'math',        label: 'Math & Puzzles',  emoji: '🧩' },
  { id: 'weird',       label: 'Weird & Obscure', emoji: '👁️' },
];

const DEPTH_OPTIONS = [
  { id: 'quick',  label: 'Quick Hit',          desc: '2-3 sentences',             icon: '⚡' },
  { id: 'medium', label: 'Short Rabbit Hole',  desc: 'A solid paragraph + twist', icon: '🐇' },
  { id: 'deep',   label: 'Deep Dive',          desc: 'Multi-section exploration', icon: '🌊' },
];

const STORAGE_KEY = 'brain_roulette_state';
const DAILY_SPIN_LIMIT = 25;
const COOLDOWN_MS = 3000;

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveState(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}

// ════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════
const BrainRoulette = () => {
  const { callClaude, loading } = useClaudeAPI();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const toolData = getToolById('BrainRoulette');

  // Theme-aware colors
  const c = {
    bg: isDark ? 'bg-zinc-900' : 'bg-gradient-to-br from-rose-50 to-amber-50',
    card: isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-rose-200',
    cardAlt: isDark ? 'bg-zinc-700 border-zinc-600' : 'bg-rose-50 border-rose-200',

    input: isDark
      ? 'bg-zinc-900 border-zinc-700 text-zinc-50 placeholder:text-zinc-500 focus:border-rose-500 focus:ring-rose-500/20'
      : 'bg-white border-rose-300 text-rose-900 placeholder:text-rose-400 focus:border-rose-600 focus:ring-rose-100',

    text: isDark ? 'text-zinc-50' : 'text-slate-900',
    textSecondary: isDark ? 'text-zinc-300' : 'text-slate-700',
    textMuted: isDark ? 'text-zinc-400' : 'text-slate-500',
    label: isDark ? 'text-zinc-200' : 'text-slate-800',

    accent: isDark ? 'text-rose-400' : 'text-rose-600',

    btnPrimary: isDark
      ? 'bg-rose-600 hover:bg-rose-700 text-white'
      : 'bg-rose-600 hover:bg-rose-700 text-white',
    btnSecondary: isDark
      ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-50'
      : 'bg-amber-500 hover:bg-amber-600 text-white',

    pillActive: isDark
      ? 'bg-rose-900/40 text-rose-300 ring-2 ring-rose-500 shadow-sm'
      : 'bg-rose-100 text-rose-700 ring-2 ring-rose-300 shadow-sm',
    pillInactive: isDark
      ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-800',

    depthActive: isDark
      ? 'border-rose-500 bg-rose-900/20 shadow-sm'
      : 'border-rose-300 bg-rose-50 shadow-sm',
    depthInactive: isDark
      ? 'border-zinc-700 hover:border-zinc-600 bg-zinc-800'
      : 'border-slate-100 hover:border-slate-200 bg-white',

    resultHeader: isDark
      ? 'bg-gradient-to-r from-rose-700 to-amber-600'
      : 'bg-gradient-to-r from-rose-600 to-amber-500',
    resultBorder: isDark ? 'border-zinc-700' : 'border-slate-100',

    deeperCard: isDark
      ? 'bg-zinc-800 border-zinc-600 hover:border-rose-500'
      : 'bg-white border-slate-200 hover:border-rose-300 hover:shadow-sm',

    savedCard: isDark ? 'bg-zinc-700' : 'bg-slate-50',
    savedPill: isDark ? 'bg-rose-900/30 text-rose-300' : 'bg-rose-100 text-rose-600',

    streak: isDark ? 'bg-amber-900/30 text-amber-300' : 'bg-amber-100 text-amber-800',
    limitBar: isDark ? 'bg-zinc-700' : 'bg-slate-100',
    limitFill: isDark ? 'bg-rose-500' : 'bg-rose-400',
    limitBox: isDark ? 'bg-amber-900/20 border-amber-700' : 'bg-amber-50 border-amber-200',

    errorBox: isDark ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200',
    errorText: isDark ? 'text-red-300' : 'text-red-800',

    mindBlown: isDark ? 'bg-amber-900/20 border-amber-700' : 'bg-amber-50 border-amber-200',
    mindBlownText: isDark ? 'text-amber-300' : 'text-amber-800',

    footerText: isDark ? 'text-zinc-500' : 'text-slate-400',
  };

  // ── Persisted state ──
  const [selectedInterests, setSelectedInterests] = useState(() => {
    const saved = loadState();
    return saved?.selectedInterests || [];
  });
  const [seenTopics, setSeenTopics] = useState(() => {
    const saved = loadState();
    return saved?.seenTopics || [];
  });
  const [savedItems, setSavedItems] = useState(() => {
    const saved = loadState();
    return saved?.savedItems || [];
  });
  const [streak, setStreak] = useState(() => {
    const saved = loadState();
    if (!saved?.lastSpinDate) return 0;
    const last = new Date(saved.lastSpinDate).toDateString();
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (last === today) return saved.streak || 0;
    if (last === yesterday) return saved.streak || 0;
    return 0;
  });
  const [dailySpins, setDailySpins] = useState(() => {
    const saved = loadState();
    if (!saved?.dailySpinDate) return 0;
    if (new Date(saved.dailySpinDate).toDateString() !== new Date().toDateString()) return 0;
    return saved.dailySpins || 0;
  });

  // ── Session state ──
  const [depth, setDepth] = useState('medium');
  const [result, setResult] = useState(null);
  const [deeperResults, setDeeperResults] = useState(null);
  const [error, setError] = useState('');
  const [showSaved, setShowSaved] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [cooldownTick, setCooldownTick] = useState(0);

  // ── Cooldown timer ──
  useEffect(() => {
    if (cooldownUntil <= Date.now()) return;
    const interval = setInterval(() => {
      if (Date.now() >= cooldownUntil) {
        setCooldownTick(0);
        clearInterval(interval);
      } else {
        setCooldownTick(Math.ceil((cooldownUntil - Date.now()) / 1000));
      }
    }, 200);
    return () => clearInterval(interval);
  }, [cooldownUntil]);

  // ── Persist on change ──
  useEffect(() => {
    saveState({
      selectedInterests,
      seenTopics: seenTopics.slice(0, 100),
      savedItems,
      streak,
      lastSpinDate: new Date().toISOString(),
      dailySpins,
      dailySpinDate: new Date().toISOString(),
    });
  }, [selectedInterests, seenTopics, savedItems, streak, dailySpins]);

  const toggleInterest = (id) => {
    setSelectedInterests(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // ── Build the system prompt ──
  const buildSystemPrompt = useCallback((isSurprise = false) => {
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const month = today.toLocaleDateString('en-US', { month: 'long' });

    const activeInterests = isSurprise
      ? []
      : selectedInterests.map(id => INTERESTS.find(i => i.id === id)?.label).filter(Boolean);

    const unselected = INTERESTS.filter(i => !selectedInterests.includes(i.id));
    const wildcard = unselected.length > 0
      ? unselected[Math.floor(Math.random() * unselected.length)].label
      : null;

    const depthInstruction = {
      quick: 'Respond with a fascinating 2-3 sentence nugget. Punchy, surprising, memorable.',
      medium: 'Respond with a compelling paragraph (4-6 sentences) that builds to a surprising twist or connection. Include one "wait, really?" moment.',
      deep: 'Respond with a multi-section exploration (3-4 short sections with bold headers). Start with the hook, go deeper into the "why", then land on a surprising connection or implication. About 200-300 words total.',
    }[depth];

    return `You are Brain Roulette — a brilliant, endlessly curious friend who always has the most fascinating thing to say at a dinner party. Your job is to generate a single captivating rabbit hole that the user can't stop thinking about.

TODAY'S DATE: ${dateStr}
CURRENT MONTH: ${month}

${activeInterests.length > 0
  ? `USER'S INTERESTS: ${activeInterests.join(', ')}
IMPORTANT: Don't just pick ONE interest — find the unexpected INTERSECTION between 2+ of their interests. That's where the magic happens. For example, if they like "History" and "Food", don't just give a history fact or a food fact — find where they collide (e.g., the bizarre diet of Roman gladiators, or how spice trade shaped empires).`
  : `The user wants a SURPRISE — pick any fascinating topic from any domain. Go wild.`}

${wildcard ? `SECRET WILDCARD: Subtly weave in a connection to "${wildcard}" even though the user didn't select it. Don't announce the wildcard — just let it naturally appear.` : ''}

DEPTH: ${depthInstruction}

ALREADY COVERED TOPICS (do NOT repeat or closely resemble these):
${seenTopics.length > 0 ? seenTopics.slice(0, 30).join(', ') : 'None yet — this is their first spin!'}

TIME-AWARENESS: If relevant, connect to something about today's date, this season (${month}), or "on this day in history". This is optional — only if it genuinely adds interest, don't force it.

TONE: Enthusiastic but not corny. Like a smart friend, not a textbook. Use "you" language. Start with something that immediately hooks — no preamble, no "Did you know...?" cliché.

Respond ONLY with valid JSON in this exact format:
{
  "title": "A short, intriguing title (5-8 words max)",
  "hook": "The main content — the fascinating rabbit hole itself",
  "topic_tag": "A 2-3 word tag for tracking (e.g., 'Roman gladiator diets')",
  "interest_connections": ["interest1", "interest2"],
  "deeper_threads": [
    {"label": "Thread title (compelling question format)", "prompt_hint": "What to explore if they click Go Deeper"},
    {"label": "Thread title", "prompt_hint": "What to explore"},
    {"label": "Thread title", "prompt_hint": "What to explore"}
  ],
  "share_snippet": "A single punchy sentence version perfect for texting a friend"
}`;
  }, [selectedInterests, seenTopics, depth]);

  // ── Throttle check ──
  const isOnCooldown = cooldownUntil > Date.now();
  const isAtDailyLimit = dailySpins >= DAILY_SPIN_LIMIT;

  const startCooldown = () => {
    const until = Date.now() + COOLDOWN_MS;
    setCooldownUntil(until);
    setCooldownTick(Math.ceil(COOLDOWN_MS / 1000));
  };

  // ── Spin! ──
  const handleSpin = async (isSurprise = false) => {
    if (isOnCooldown || isAtDailyLimit) return;

    setError('');
    setResult(null);
    setDeeperResults(null);
    setIsSpinning(true);
    startCooldown();

    try {
      const systemPrompt = buildSystemPrompt(isSurprise);
      const userPrompt = isSurprise
        ? 'Surprise me with something completely unexpected and fascinating.'
        : 'Spin the roulette! Give me something amazing.';

      const raw = await callClaude(userPrompt, {
        systemPrompt,
        maxTokens: 1500,
      });

      const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      const parsed = JSON.parse(cleaned);

      setResult(parsed);
      setSeenTopics(prev => [parsed.topic_tag, ...prev].slice(0, 100));
      setStreak(prev => prev + 1);
      setDailySpins(prev => prev + 1);
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('Daily limit') || msg.includes('Too many requests')) {
        setError(msg);
      } else {
        setError('The roulette wheel got stuck. Give it another spin!');
      }
    } finally {
      setIsSpinning(false);
    }
  };

  // ── Go Deeper ──
  const handleGoDeeper = async (thread) => {
    if (isOnCooldown || isAtDailyLimit) return;

    setError('');
    setDeeperResults(null);
    startCooldown();

    try {
      const raw = await callClaude(
        `The user was reading about: "${result.title}" — specifically "${result.hook}"\n\nNow they want to go deeper into: "${thread.label}"\n\nHint: ${thread.prompt_hint}`,
        {
          systemPrompt: `You are Brain Roulette's "Go Deeper" mode. The user found something fascinating and wants more. Give them a rich, engaging exploration of this specific thread. Write 150-250 words in a conversational, compelling style. Use bold text for key terms. End with one more surprising connection or implication they probably didn't see coming.\n\nRespond ONLY with valid JSON:\n{"title": "Section title", "content": "The deeper exploration", "mind_blown": "One final 'whoa' sentence"}`,
          maxTokens: 1200,
        }
      );

      const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      const parsed = JSON.parse(cleaned);
      setDeeperResults(parsed);
      setDailySpins(prev => prev + 1);
    } catch (err) {
      setError('Couldn\'t dig deeper. Try again!');
    }
  };

  // ── Save/unsave ──
  const toggleSave = () => {
    if (!result) return;
    setSavedItems(prev => {
      const exists = prev.find(s => s.topic_tag === result.topic_tag);
      if (exists) return prev.filter(s => s.topic_tag !== result.topic_tag);
      return [{ ...result, savedAt: new Date().toISOString() }, ...prev];
    });
  };

  const isSaved = result && savedItems.some(s => s.topic_tag === result.topic_tag);
  const hasInterests = selectedInterests.length > 0;

  return (
    <div className={c.text}>

      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-5">
        <div>
          <h2 className={`text-2xl font-bold ${c.text}`}>{toolData?.title || 'Brain Roulette'} {toolData?.icon || '🎲'}</h2>
          <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>{toolData?.tagline || 'Spin for a random fascinating topic'}</p>
        </div>
      </div>

      {/* ── Streak + Saved bar ── */}
      <div className="flex items-center justify-between mb-5">
        {streak > 0 ? (
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold ${c.streak}`}>
            <Flame className="w-4 h-4" />
            {streak} spin streak
          </div>
        ) : <div />}
        {savedItems.length > 0 && (
          <button
            onClick={() => setShowSaved(!showSaved)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold ${c.accent} ${isDark ? 'hover:bg-zinc-700' : 'hover:bg-rose-50'} transition-colors`}
          >
            <Bookmark className="w-4 h-4" />
            Saved ({savedItems.length})
          </button>
        )}
      </div>

      {/* ── Interest Picker ── */}
      <div className="mb-5">
        <div className="mb-4">
          <h3 className={`text-sm font-bold ${c.text} mb-1`}>Your Interests</h3>
          <p className={`text-xs ${c.textMuted}`}>
            Pick 2+ and we'll find the surprising intersections
          </p>
        </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {INTERESTS.map(interest => {
              const active = selectedInterests.includes(interest.id);
              return (
                <button
                  key={interest.id}
                  onClick={() => toggleInterest(interest.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                    active ? c.pillActive : c.pillInactive
                  }`}
                >
                  <span>{interest.emoji}</span>
                  <span>{interest.label}</span>
                </button>
              );
            })}
          </div>

          {/* ── Depth Selector ── */}
          <div className="mb-5">
            <label className={`block text-xs font-semibold mb-2 ${c.textMuted}`}>Rabbit hole depth</label>
            <div className="grid grid-cols-3 gap-2">
              {DEPTH_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setDepth(opt.id)}
                  className={`text-left p-3 rounded-xl border-2 transition-all ${
                    depth === opt.id ? c.depthActive : c.depthInactive
                  }`}
                >
                  <div className="text-lg mb-0.5">{opt.icon}</div>
                  <div className={`text-xs font-bold ${c.label}`}>{opt.label}</div>
                  <div className={`text-[10px] mt-0.5 ${c.textMuted}`}>{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* ── Spin Buttons ── */}
          {isAtDailyLimit ? (
            <div className={`text-center py-4 px-6 border-2 rounded-xl ${c.limitBox}`}>
              <p className={`font-bold ${c.mindBlownText}`}>🎉 You've explored {DAILY_SPIN_LIMIT} rabbit holes today!</p>
              <p className={`text-sm mt-1 ${c.textMuted}`}>Your curiosity is impressive. Come back tomorrow for more!</p>
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => handleSpin(false)}
                disabled={loading || !hasInterests || isOnCooldown}
                className={`flex-1 disabled:bg-slate-300 font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 ${c.btnPrimary}`}
              >
                {loading && !result ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Spinning...
                  </>
                ) : cooldownTick > 0 ? (
                  <>Wait {cooldownTick}s...</>
                ) : (
                  <>
                    <Dices className={`w-5 h-5 ${isSpinning ? 'animate-bounce' : ''}`} />
                    Spin!
                  </>
                )}
              </button>
              <button
                onClick={() => handleSpin(true)}
                disabled={loading || isOnCooldown}
                className={`px-4 disabled:bg-slate-300 font-semibold py-3 rounded-lg transition-colors flex items-center gap-2 ${c.btnSecondary}`}
                title="Ignore interests — surprise me!"
              >
                <Shuffle className="w-5 h-5" />
                <span className="hidden sm:inline">Surprise</span>
              </button>
            </div>
          )}

          {/* Daily usage indicator */}
          {dailySpins > 0 && !isAtDailyLimit && (
            <div className="mt-3 flex items-center justify-center gap-2">
              <div className={`flex-1 max-w-48 h-1.5 rounded-full overflow-hidden ${c.limitBar}`}>
                <div
                  className={`h-full rounded-full transition-all duration-500 ${c.limitFill}`}
                  style={{ width: `${(dailySpins / DAILY_SPIN_LIMIT) * 100}%` }}
                />
              </div>
              <span className={`text-[11px] font-medium ${c.textMuted}`}>
                {dailySpins}/{DAILY_SPIN_LIMIT} today
              </span>
            </div>
          )}

          {!hasInterests && !result && !isAtDailyLimit && (
            <p className={`text-center text-sm mt-3 ${c.textMuted}`}>
              Pick at least one interest to spin, or hit <strong>Surprise</strong> to go blind!
            </p>
          )}

          {error && (
            <div className={`mt-4 p-4 border rounded-lg flex items-start gap-3 ${c.errorBox}`}>
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className={`text-sm ${c.errorText}`}>{error}</p>
            </div>
          )}
        </div>

        {/* ── Result Card ── */}
        {result && (
          <div className={`rounded-2xl overflow-hidden mb-5 border ${c.card}`}>
            {/* Title bar */}
            <div className={`px-6 py-4 ${c.resultHeader}`}>
              <h2 className="text-xl font-bold text-white">{result.title}</h2>
              {result.interest_connections && result.interest_connections.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {result.interest_connections.map((conn, i) => (
                    <span key={i} className="text-[10px] font-bold uppercase tracking-wider bg-white/20 text-white px-2 py-0.5 rounded-full">
                      {conn}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Main content */}
            <div className="px-6 py-5">
              <p className={`text-base leading-relaxed whitespace-pre-line ${c.textSecondary}`}>{result.hook}</p>
            </div>

            {/* Action bar */}
            <div className={`px-6 py-4 border-t flex items-center justify-between ${c.resultBorder}`}>
              <div className="flex gap-2">
                <button
                  onClick={toggleSave}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                    isSaved
                      ? (isDark ? 'bg-rose-900/30 text-rose-300' : 'bg-rose-100 text-rose-700')
                      : (isDark ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600' : 'bg-slate-50 text-slate-500 hover:bg-slate-100')
                  }`}
                >
                  {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                  {isSaved ? 'Saved' : 'Save'}
                </button>
                {result.share_snippet && (
                  <button
                    onClick={() => { navigator.clipboard?.writeText(result.share_snippet); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                      isDark ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    📤 Share
                  </button>
                )}
              </div>
              <button
                onClick={() => handleSpin(false)}
                disabled={loading || isOnCooldown || isAtDailyLimit}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors disabled:opacity-40 ${c.accent} ${isDark ? 'hover:bg-zinc-700' : 'hover:bg-rose-50'}`}
              >
                <Dices className="w-4 h-4" />
                {cooldownTick > 0 ? `${cooldownTick}s` : 'Spin Again'}
              </button>
            </div>

            {/* ── Go Deeper Threads ── */}
            {result.deeper_threads && result.deeper_threads.length > 0 && (
              <div className={`px-6 py-4 border-t ${isDark ? 'bg-zinc-800/50 border-zinc-700' : 'bg-slate-50 border-slate-100'}`}>
                <h3 className={`text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5 ${c.textMuted}`}>
                  <Sparkles className="w-3.5 h-3.5" />
                  Go Deeper
                </h3>
                <div className="space-y-2">
                  {result.deeper_threads.map((thread, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleGoDeeper(thread)}
                      disabled={loading || isOnCooldown || isAtDailyLimit}
                      className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border transition-all disabled:opacity-50 group ${c.deeperCard}`}
                    >
                      <span className={`${c.accent} transition-colors`}>
                        <ArrowRight className="w-4 h-4" />
                      </span>
                      <span className={`text-sm font-semibold ${c.textSecondary}`}>
                        {thread.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Deeper Result ── */}
        {deeperResults && (
          <div className={`rounded-2xl overflow-hidden mb-5 border-l-4 border border-rose-400 ${c.card}`}>
            <div className="px-6 py-5">
              <h3 className={`text-lg font-bold mb-3 ${c.text}`}>{deeperResults.title}</h3>
              <p className={`leading-relaxed whitespace-pre-line ${c.textSecondary}`}>{deeperResults.content}</p>
              {deeperResults.mind_blown && (
                <div className={`mt-4 p-3 border rounded-lg ${c.mindBlown}`}>
                  <p className={`text-sm font-semibold ${c.mindBlownText}`}>
                    🤯 {deeperResults.mind_blown}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Loading overlay for Go Deeper ── */}
        {loading && result && !isSpinning && (
          <div className={`rounded-2xl p-6 mb-5 text-center border ${c.card}`}>
            <Loader2 className={`w-6 h-6 animate-spin mx-auto mb-3 ${c.accent}`} />
            <p className={`text-sm font-semibold ${c.textMuted}`}>Digging deeper...</p>
          </div>
        )}

        {/* ── Saved Collection ── */}
        {showSaved && savedItems.length > 0 && (
          <div className={`rounded-2xl p-5 mb-5 border ${c.card}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-bold flex items-center gap-2 ${c.text}`}>
                <Bookmark className={`w-5 h-5 ${c.accent}`} />
                Your Collection
              </h3>
              <button
                onClick={() => setShowSaved(false)}
                className={`text-sm ${c.textMuted} ${isDark ? 'hover:text-zinc-200' : 'hover:text-slate-600'}`}
              >
                Close
              </button>
            </div>
            <div className="space-y-3">
              {savedItems.map((item, idx) => (
                <div key={idx} className={`p-4 rounded-xl ${c.savedCard}`}>
                  <h4 className={`font-bold text-sm mb-1 ${c.label}`}>{item.title}</h4>
                  <p className={`text-xs leading-relaxed line-clamp-3 ${c.textMuted}`}>{item.hook}</p>
                  {item.interest_connections && (
                    <div className="flex gap-1.5 mt-2">
                      {item.interest_connections.map((conn, i) => (
                        <span key={i} className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${c.savedPill}`}>
                          {conn}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Stats footer ── */}
        {seenTopics.length > 0 && (
          <div className={`text-center text-xs font-medium mt-4 ${c.footerText}`}>
            {seenTopics.length} rabbit holes explored
            {savedItems.length > 0 && ` · ${savedItems.length} saved`}
          </div>
        )}
    </div>
  );
};

BrainRoulette.displayName = 'BrainRoulette';
export default BrainRoulette;
