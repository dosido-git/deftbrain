import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';
import { usePersistentState } from '../hooks/usePersistentState';
import { CopyBtn } from '../components/ActionButtons';

// ════════════════════════════════════════════════════════════
// THEME — Navy & Gold
// ════════════════════════════════════════════════════════════
const useColors = () => {
  const { theme } = useTheme();
  const d = theme === 'dark';
  return {
    d,
    card:        d ? 'bg-[#2a2623] border-[#3d3630]'  : 'bg-white border-[#e8e1d5]',
    cardAlt:     d ? 'bg-[#332e2a] border-[#3d3630]'  : 'bg-[#faf8f5] border-[#e8e1d5]',
    inset:       d ? 'bg-[#1a1816]'                    : 'bg-[#faf8f5]',
    inputBg:     d ? 'bg-[#1a1816] border-[#3d3630] text-[#f0eeea] placeholder-[#8a8275] focus:border-[#4a6a8a] focus:ring-[#4a6a8a]/20'
                    : 'bg-[#faf8f5] border-[#d5cab8] text-[#3d3935] placeholder-[#8a8275] focus:border-[#4a6a8a] focus:ring-[#4a6a8a]/20',
    text:        d ? 'text-[#f0eeea]'  : 'text-[#3d3935]',
    heading:     d ? 'text-[#f3efe8]'  : 'text-[#1e2a3a]',
    textSec:     d ? 'text-[#c8c3b9]'  : 'text-[#5a544a]',
    textMut:     d ? 'text-[#8a8275]'  : 'text-[#8a8275]',
    label:       d ? 'text-[#c8c3b9]'  : 'text-[#5a544a]',
    border:      d ? 'border-[#3d3630]' : 'border-[#e8e1d5]',
    divider:     d ? 'border-[#3d3630]' : 'border-[#e8e1d5]',
    btn:         d ? 'bg-[#2c4a6e] hover:bg-[#4a6a8a] text-white' : 'bg-[#2c4a6e] hover:bg-[#1e3a58] text-white',
    btnSec:      d ? 'bg-[#332e2a] hover:bg-[#3d3630] text-[#c8c3b9] border border-[#3d3630]'
                    : 'bg-[#f3efe8] hover:bg-[#e8e1d5] text-[#5e5042] border border-[#d5cab8]',
    btnGhost:    d ? 'text-[#8a8275] hover:text-[#f0eeea]' : 'text-[#8a8275] hover:text-[#3d3935]',
    btnDis:      d ? 'bg-[#332e2a] text-[#5a544a] cursor-not-allowed' : 'bg-[#e8e1d5] text-[#8a8275] cursor-not-allowed',
    pillActive:  d ? 'border-[#4a6a8a] bg-[#2c4a6e]/30 text-[#a8b9ce]' : 'border-[#2c4a6e] bg-[#d4dde8] text-[#1e3a58]',
    pillInactive: d ? 'border-[#3d3630] text-[#8a8275] hover:border-[#5a544a]' : 'border-[#d5cab8] text-[#5a544a] hover:border-[#8a8275]',
    badge:       d ? 'bg-[#2c4a6e]/30 text-[#a8b9ce]' : 'bg-[#d4dde8] text-[#1e3a58]',
    tipBg:       d ? 'bg-[#c8872e]/10 border-[#c8872e]/30' : 'bg-[#f9edd8] border-[#c8872e]/30',
    tipText:     d ? 'text-[#d9a04e]' : 'text-[#93541f]',
    successBg:   d ? 'bg-[#5a8a5c]/10 border-[#5a8a5c]/30' : 'bg-[#e8f0e8] border-[#5a8a5c]/30',
    successText: d ? 'text-[#7aba7c]' : 'text-[#3a6a3c]',
    warnBg:      d ? 'bg-[#b54a3f]/10 border-[#b54a3f]/30' : 'bg-[#fceae8] border-[#e8a8a0]',
    warnText:    d ? 'text-[#e88880]' : 'text-[#b54a3f]',
    errBg:       d ? 'bg-[#b54a3f]/15 border-[#b54a3f]/40' : 'bg-[#fceae8] border-[#e8a8a0]',
    errText:     d ? 'text-[#e88880]' : 'text-[#b54a3f]',
    histBg:      d ? 'bg-[#2c4a6e]/10 border-[#4a6a8a]/30' : 'bg-[#d4dde8]/30 border-[#2c4a6e]/15',
    histCard:    d ? 'bg-[#2a2623] border-[#3d3630]' : 'bg-white border-[#e8e1d5]',
    histAccent:  d ? 'text-[#a8b9ce]' : 'text-[#2c4a6e]',
    linkStyle:   d ? 'text-[#6e8aaa] hover:text-[#a8b9ce] underline' : 'text-[#2c4a6e] hover:text-[#1e3a58] underline',
    modeActive:  d ? 'bg-[#2c4a6e] text-white border-[#4a6a8a]' : 'bg-[#2c4a6e] text-white border-[#1e3a58]',
    modeInactive: d ? 'bg-[#2a2623] text-[#8a8275] border-[#3d3630] hover:text-[#c8c3b9]' : 'bg-white text-[#8a8275] border-[#e8e1d5] hover:text-[#5a544a]',
    // Character cards
    charCard:    d ? 'bg-[#332e2a] border-[#3d3630]' : 'bg-[#faf8f5] border-[#e8e1d5]',
    // Thread cards
    threadCard:  d ? 'bg-[#1a1816] border-[#3d3630]' : 'bg-white border-[#e8e1d5]',
    // Sports must-watch
    mustWatchBg: d ? 'bg-[#c8872e]/10 border-[#c8872e]/40' : 'bg-[#f9edd8] border-[#c8872e]/40',
  };
};

// ════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════
const MEDIA_TYPES = [
  { id: 'show', label: '📺 Show', desc: 'TV series', placeholder: 'e.g., Breaking Bad, Succession, The Bear', stoppedPlaceholder: 'e.g., Season 3, Episode 4' },
  { id: 'book', label: '📖 Book', desc: 'Novel / nonfiction', placeholder: 'e.g., Project Hail Mary, Dune, The Count of Monte Cristo', stoppedPlaceholder: 'e.g., Chapter 12, page 180, about 40% through' },
  { id: 'game', label: '🎮 Game', desc: 'Video game', placeholder: 'e.g., Elden Ring, Zelda: TotK, Baldur\'s Gate 3', stoppedPlaceholder: 'e.g., After the Water Temple, just reached Act 2, level 30' },
  { id: 'sports', label: '🏟️ Sports', desc: 'Season catch-up', placeholder: 'e.g., Boston Celtics, Premier League, F1 2024', stoppedPlaceholder: 'e.g., January 2025, after Week 8, end of group stage' },
];

const SPOILER_LEVELS = [
  { value: 'strict', label: '🔒 Strict', desc: 'Nothing after where I stopped' },
  { value: 'moderate', label: '🔓 Moderate', desc: 'Hints are fine, no specifics' },
  { value: 'don\'t-care', label: '🔓 Open', desc: 'Spoil away, I just want context' },
];

const EXAMPLES = {
  show: { title: 'Succession', stoppedAt: 'Season 2, Episode 7', whatYouRemember: 'Something about a shareholder meeting? Kendall was trying to take over.' },
  book: { title: 'Project Hail Mary', stoppedAt: 'Chapter 15, around page 200', whatYouRemember: 'He just figured out how to communicate with the alien.' },
  game: { title: 'Elden Ring', stoppedAt: 'Just beat Rennala at the Academy', whatYouRemember: 'Open world is huge, I think I need to go to some red area next?' },
  sports: { title: 'Boston Celtics', stoppedAt: 'December 2024', whatYouRemember: 'They were doing well early in the season. Tatum was playing great.' },
};

// ════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════
const Bookmark = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const c = useColors();
  const resultsRef = useRef(null);

  const [history, setHistory] = usePersistentState('bookmark-history', []);
  const [showHistory, setShowHistory] = useState(false);

  // Input
  const [mediaType, setMediaType] = useState('show');
  const [title, setTitle] = useState('');
  const [stoppedAt, setStoppedAt] = useState('');
  const [whatYouRemember, setWhatYouRemember] = useState('');
  const [spoilerLevel, setSpoilerLevel] = useState('strict');
  const [specificQuestions, setSpecificQuestions] = useState('');

  // Results
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  // Sections
  const [showChars, setShowChars] = useState(true);
  const [showThreads, setShowThreads] = useState(true);
  const [showAnswers, setShowAnswers] = useState(true);
  const [showMustWatch, setShowMustWatch] = useState(true);
  const [showRoster, setShowRoster] = useState(false);
  const [showStorylines, setShowStorylines] = useState(true);

  useEffect(() => {
    if (results && resultsRef.current) {
      setTimeout(() => resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
    }
  }, [results]);

  // ══════════════════════════════════════════
  // API
  // ══════════════════════════════════════════
  const recall = useCallback(async () => {
    if (!title.trim() || !stoppedAt.trim()) { setError('Tell us what you were into and where you stopped'); return; }
    setError(''); setResults(null);
    try {
      const data = await callToolEndpoint('bookmark', {
        mediaType, title: title.trim(), stoppedAt: stoppedAt.trim(),
        whatYouRemember: whatYouRemember.trim() || null,
        spoilerLevel,
        specificQuestions: specificQuestions.trim() || null,
      });
      setResults(data);
      saveToHistory(data);
    } catch (err) { setError(err.message || 'Failed to generate recap.'); }
  }, [mediaType, title, stoppedAt, whatYouRemember, spoilerLevel, specificQuestions, callToolEndpoint]);

  const handleReset = useCallback(() => {
    setTitle(''); setStoppedAt(''); setWhatYouRemember(''); setSpecificQuestions('');
    setResults(null); setError('');
  }, []);

  const loadExample = useCallback(() => {
    const ex = EXAMPLES[mediaType];
    if (ex) { setTitle(ex.title); setStoppedAt(ex.stoppedAt); setWhatYouRemember(ex.whatYouRemember || ''); }
  }, [mediaType]);

  // ══════════════════════════════════════════
  // HISTORY
  // ══════════════════════════════════════════
  const saveToHistory = useCallback((data) => {
    const entry = { id: 'bm_' + Date.now(), date: new Date().toISOString(), type: mediaType, title: data.title || title, stoppedAt: data.stopped_at || stoppedAt, results: data };
    setHistory(prev => [entry, ...prev].slice(0, 20));
  }, [mediaType, title, stoppedAt, setHistory]);

  // ══════════════════════════════════════════
  // COPY
  // ══════════════════════════════════════════
  const buildFullCopy = useCallback(() => {
    if (!results) return '';
    const emoji = { show: '📺', book: '📖', game: '🎮', sports: '🏟️' }[results.media_type] || '🔖';
    const lines = [emoji + ' Bookmark — ' + results.title, 'Stopped at: ' + results.stopped_at, ''];
    if (results.the_story_so_far) lines.push('RECAP:', results.the_story_so_far, '');
    if (results.where_you_left_off) lines.push('LAST SCENE: ' + results.where_you_left_off, '');
    if (results.characters?.length) {
      lines.push('CHARACTERS:');
      results.characters.forEach(ch => lines.push('  • ' + ch.name + ': ' + ch.refresher));
      lines.push('');
    }
    if (results.active_threads?.length) {
      lines.push('ACTIVE THREADS:');
      results.active_threads.forEach(t => lines.push('  • ' + t.thread + ': ' + t.status));
      lines.push('');
    }
    if (results.conversation_ready) lines.push('TALKING POINTS: ' + results.conversation_ready, '');
    lines.push('— Generated by DeftBrain · deftbrain.com');
    return lines.join('\n');
  }, [results]);

  // ══════════════════════════════════════════
  // RENDER HELPERS
  // ══════════════════════════════════════════
  const Section = ({ title: t, emoji, open, onToggle, badge, children }) => (
    <div className={c.card + ' border rounded-xl overflow-hidden'}>
      <button onClick={onToggle} className="w-full flex items-center justify-between p-5 text-left hover:opacity-80">
        <div className="flex items-center gap-3">
          <span className="text-lg">{emoji}</span>
          <span className={'text-base font-semibold ' + c.text}>{t}</span>
          {badge && <span className={'text-xs px-2 py-0.5 rounded-full ' + c.badge}>{badge}</span>}
        </div>
        <span className={'text-xs ' + c.textMut}>{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className={'px-5 pb-5 border-t ' + c.divider}>{children}</div>}
    </div>
  );

  const mt = MEDIA_TYPES.find(m => m.id === mediaType) || MEDIA_TYPES[0];

  // ══════════════════════════════════════════
  // INPUT
  // ══════════════════════════════════════════
  const renderInput = () => (
    <div className="space-y-4">
      {/* Media type selector */}
      <div className="grid grid-cols-4 gap-2">
        {MEDIA_TYPES.map(m => (
          <button key={m.id} onClick={() => { setMediaType(m.id); setError(''); }}
            className={'py-3 px-2 rounded-xl border-2 text-center transition-all ' + (mediaType === m.id ? c.modeActive : c.modeInactive)}>
            <span className="text-sm font-bold block">{m.label}</span>
            <span className={'text-[10px] block mt-0.5 ' + (mediaType === m.id ? 'text-white/70' : c.textMut)}>{m.desc}</span>
          </button>
        ))}
      </div>

      {/* Main inputs */}
      <div className={c.card + ' border rounded-xl p-5 space-y-3'}>
        <div>
          <label className={'text-xs font-bold ' + c.textSec + ' uppercase tracking-wide mb-1 block'}>
            {mediaType === 'sports' ? '🏟️ Team or league' : mt.label.split(' ')[0] + ' Title'}
          </label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)}
            placeholder={mt.placeholder} className={'w-full px-4 py-3 border-2 rounded-xl ' + c.inputBg + ' outline-none focus:ring-2 text-base'} />
        </div>
        <div>
          <label className={'text-xs font-bold ' + c.textSec + ' uppercase tracking-wide mb-1 block'}>
            {mediaType === 'sports' ? '📅 When did you stop following?' : '🔖 Where did you stop?'}
          </label>
          <input type="text" value={stoppedAt} onChange={e => setStoppedAt(e.target.value)}
            placeholder={mt.stoppedPlaceholder} className={'w-full px-4 py-2.5 rounded-xl border text-sm ' + c.inputBg + ' outline-none'} />
        </div>
        <div>
          <label className={'text-xs font-bold ' + c.textSec + ' uppercase tracking-wide mb-1 block'}>🧠 What do you remember? (optional)</label>
          <input type="text" value={whatYouRemember} onChange={e => setWhatYouRemember(e.target.value)}
            placeholder="Anything you recall — helps us calibrate the recap" className={'w-full px-4 py-2.5 rounded-xl border text-sm ' + c.inputBg + ' outline-none'} />
        </div>
        <div>
          <label className={'text-xs font-bold ' + c.textSec + ' uppercase tracking-wide mb-1 block'}>❓ Specific questions? (optional)</label>
          <input type="text" value={specificQuestions} onChange={e => setSpecificQuestions(e.target.value)}
            placeholder={mediaType === 'sports' ? 'e.g., "Did they make any trades?"' : 'e.g., "Who is the guy with the scar?"'}
            className={'w-full px-4 py-2.5 rounded-xl border text-sm ' + c.inputBg + ' outline-none'} />
        </div>
      </div>

      {/* Spoiler level */}
      <div className={c.card + ' border rounded-xl p-5'}>
        <label className={'text-xs font-bold ' + c.textSec + ' uppercase tracking-wide mb-2 block'}>🛡️ Spoiler level</label>
        <div className="grid grid-cols-3 gap-2">
          {SPOILER_LEVELS.map(s => (
            <button key={s.value} onClick={() => setSpoilerLevel(s.value)}
              className={'p-3 rounded-xl border-2 text-left transition-all ' + (spoilerLevel === s.value ? c.pillActive + ' border-[#4a6a8a]' : c.card + ' hover:border-[#8a8275]')}>
              <span className={'text-sm font-medium block ' + (spoilerLevel === s.value ? '' : c.textSec)}>{s.label}</span>
              <span className={'text-[10px] ' + c.textMut}>{s.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={recall} disabled={loading || !title.trim() || !stoppedAt.trim()}
          className={'flex-1 py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all ' + (loading || !title.trim() || !stoppedAt.trim() ? c.btnDis : c.btn)}>
          {loading ? <><span className="animate-spin inline-block">⏳</span> Recalling...</> : <><span>🔖</span> Where Was I?</>}
        </button>
        <button onClick={loadExample} className={'px-4 py-4 rounded-2xl text-xs font-bold ' + c.btnSec}>Try example</button>
      </div>
    </div>
  );

  // ══════════════════════════════════════════
  // RESULTS — shared
  // ══════════════════════════════════════════
  const renderResults = () => {
    if (!results) return null;
    const isSports = results.media_type === 'sports';
    const isGame = results.media_type === 'game';
    const emoji = { show: '📺', book: '📖', game: '🎮', sports: '🏟️' }[results.media_type] || '🔖';

    return (
      <div ref={resultsRef} className="space-y-4 mt-4">
        {/* Header */}
        <div className={'p-5 rounded-2xl border-2 ' + c.tipBg}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{emoji}</span>
            <span className={'text-sm font-bold ' + c.tipText}>{results.title}</span>
            {results.confidence && results.confidence !== 'high' && (
              <span className={'text-xs px-2 py-0.5 rounded-full ' + c.badge}>⚠️ {results.confidence} confidence</span>
            )}
          </div>
          <p className={'text-xs ' + c.tipText + ' mb-2'}>Stopped at: {results.stopped_at}</p>
          {results.confidence_note && <p className={'text-xs ' + c.textMut + ' italic'}>{results.confidence_note}</p>}
        </div>

        {/* The story so far */}
        {results.the_story_so_far && (
          <div className={c.card + ' border rounded-xl p-5'}>
            <p className={'text-xs font-bold ' + c.textMut + ' uppercase mb-3'}>📖 {isSports ? 'The Season So Far' : 'The Story So Far'}</p>
            <p className={'text-sm leading-relaxed whitespace-pre-wrap ' + c.text}>{results.the_story_so_far}</p>
          </div>
        )}

        {/* Where you left off */}
        {results.where_you_left_off && (
          <div className={'p-4 rounded-xl border ' + c.successBg}>
            <p className={'text-xs font-bold ' + c.successText + ' mb-1'}>🎬 Last scene you saw</p>
            <p className={'text-sm ' + c.successText + ' italic'}>{results.where_you_left_off}</p>
          </div>
        )}

        {/* Vibe check */}
        {results.vibe_check && (
          <div className={'p-4 rounded-xl ' + c.inset}>
            <p className={'text-xs font-bold ' + c.textMut + ' mb-1'}>🎭 Vibe check</p>
            <p className={'text-sm ' + c.text}>{results.vibe_check}</p>
          </div>
        )}

        {/* Characters */}
        {results.characters?.length > 0 && (
          <Section title="Characters" emoji="👥" open={showChars} onToggle={() => setShowChars(!showChars)} badge={results.characters.length + ''}>
            <div className="space-y-3 mt-4">
              {results.characters.map((ch, idx) => (
                <div key={idx} className={'p-4 rounded-xl border ' + c.charCard}>
                  <p className={'text-sm font-bold ' + c.text + ' mb-1'}>{ch.name}</p>
                  <p className={'text-xs ' + c.textSec + ' mb-1'}>{ch.refresher}</p>
                  {ch.relationships && <p className={'text-xs ' + c.textMut}>🔗 {ch.relationships}</p>}
                  {ch.last_seen && <p className={'text-xs ' + c.textMut + ' mt-1'}>📍 Last seen: {ch.last_seen}</p>}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Active threads */}
        {results.active_threads?.length > 0 && (
          <Section title="Active Threads" emoji="🧵" open={showThreads} onToggle={() => setShowThreads(!showThreads)} badge={results.active_threads.length + ''}>
            <div className="space-y-3 mt-4">
              {results.active_threads.map((t, idx) => (
                <div key={idx} className={'p-4 rounded-xl border ' + c.threadCard}>
                  <p className={'text-sm font-bold ' + c.text + ' mb-1'}>{t.thread}</p>
                  <p className={'text-xs ' + c.textSec}>{t.status}</p>
                  {t.tension && <p className={'text-xs ' + c.tipText + ' mt-1 italic'}>❓ {t.tension}</p>}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Game-specific: Gameplay refresh */}
        {isGame && results.gameplay_refresh && (
          <div className={c.card + ' border rounded-xl p-5'}>
            <p className={'text-xs font-bold ' + c.textMut + ' uppercase mb-3'}>🎮 Gameplay Refresh</p>
            {results.gameplay_refresh.mechanics_unlocked && <p className={'text-sm ' + c.text + ' mb-2'}>🔓 <strong>Unlocked:</strong> {results.gameplay_refresh.mechanics_unlocked}</p>}
            {results.gameplay_refresh.current_objective && <p className={'text-sm ' + c.text + ' mb-2'}>🎯 <strong>Objective:</strong> {results.gameplay_refresh.current_objective}</p>}
            {results.gameplay_refresh.difficulty_note && <p className={'text-xs ' + c.textMut + ' italic'}>⚠️ {results.gameplay_refresh.difficulty_note}</p>}
          </div>
        )}

        {/* Book-specific: World building */}
        {results.world_building_refresh && (
          <div className={c.card + ' border rounded-xl p-5'}>
            <p className={'text-xs font-bold ' + c.textMut + ' uppercase mb-3'}>🌍 World Refresh</p>
            <p className={'text-sm ' + c.text}>{results.world_building_refresh}</p>
          </div>
        )}

        {/* Sports-specific: Standings */}
        {isSports && results.standings_context && (
          <div className={c.card + ' border rounded-xl p-5'}>
            <p className={'text-xs font-bold ' + c.textMut + ' uppercase mb-3'}>📊 Standings</p>
            <p className={'text-sm ' + c.text}>{results.standings_context}</p>
          </div>
        )}

        {/* Sports: Key storylines */}
        {isSports && results.key_storylines?.length > 0 && (
          <Section title="Key Storylines" emoji="📰" open={showStorylines} onToggle={() => setShowStorylines(!showStorylines)} badge={results.key_storylines.length + ''}>
            <div className="space-y-3 mt-4">
              {results.key_storylines.map((s, idx) => (
                <div key={idx} className={'p-4 rounded-xl border ' + c.threadCard}>
                  <p className={'text-sm font-bold ' + c.text + ' mb-1'}>{s.storyline}</p>
                  <p className={'text-xs ' + c.textSec}>{s.what_happened}</p>
                  {s.why_it_matters && <p className={'text-xs ' + c.tipText + ' mt-1'}>💡 {s.why_it_matters}</p>}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Sports: Roster changes */}
        {isSports && results.roster_changes?.length > 0 && (
          <Section title="Roster Changes" emoji="🔄" open={showRoster} onToggle={() => setShowRoster(!showRoster)} badge={results.roster_changes.length + ''}>
            <div className="space-y-2 mt-4">
              {results.roster_changes.map((r, idx) => (
                <div key={idx} className={'p-3 rounded-lg ' + c.inset}>
                  <p className={'text-sm font-semibold ' + c.text}>{r.change}</p>
                  <p className={'text-xs ' + c.textMut}>{r.impact}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Sports: Must-watch games */}
        {isSports && results.must_watch_games?.length > 0 && (
          <Section title="Must-Watch Games" emoji="🔥" open={showMustWatch} onToggle={() => setShowMustWatch(!showMustWatch)} badge={results.must_watch_games.length + ''}>
            <div className="space-y-3 mt-4">
              {results.must_watch_games.map((g, idx) => (
                <div key={idx} className={'p-4 rounded-xl border ' + c.mustWatchBg}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={'text-sm font-bold ' + c.text}>{g.game}</span>
                    {g.spoiler_level === 'outcome_unknown' && <span className={'text-[10px] px-2 py-0.5 rounded-full ' + c.badge}>🔒 Watch blind</span>}
                  </div>
                  <p className={'text-xs ' + c.tipText}>{g.why}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Sports: Conversation ready */}
        {isSports && results.conversation_ready && (
          <div className={'p-4 rounded-xl border ' + c.successBg}>
            <p className={'text-xs font-bold ' + c.successText + ' mb-1'}>🗣️ Conversation-ready talking points</p>
            <p className={'text-sm ' + c.successText}>{results.conversation_ready}</p>
          </div>
        )}

        {/* Answers to specific questions */}
        {results.answers?.length > 0 && (
          <Section title="Your Questions" emoji="❓" open={showAnswers} onToggle={() => setShowAnswers(!showAnswers)}>
            <div className="space-y-3 mt-4">
              {results.answers.map((a, idx) => (
                <div key={idx} className={'p-4 rounded-xl border ' + c.cardAlt}>
                  <p className={'text-xs font-bold ' + c.textMut + ' mb-1'}>Q: {a.question}</p>
                  <p className={'text-sm ' + c.text}>{a.answer}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Worth continuing */}
        {results.worth_continuing && (
          <div className={'p-4 rounded-xl border ' + c.tipBg}>
            <p className={'text-xs font-bold ' + c.tipText + ' mb-1'}>🤔 Worth continuing?</p>
            <p className={'text-sm ' + c.tipText}>{results.worth_continuing}</p>
          </div>
        )}

        {/* Re-entry tips */}
        {(results.reading_tip || results['re-entry_tip']) && (
          <div className={'p-4 rounded-xl ' + c.inset}>
            <p className={'text-xs font-bold ' + c.textMut + ' mb-1'}>💡 Getting back in</p>
            <p className={'text-sm ' + c.text}>{results.reading_tip || results['re-entry_tip']}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <div className="flex-1"><CopyBtn content={buildFullCopy()} label="Copy Recap" /></div>
          <button onClick={handleReset} className={'flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 ' + c.btn}><span>🔖</span> New Bookmark</button>
        </div>

        {/* Cross-references */}
        <div className={'p-4 rounded-2xl border ' + c.card}>
          <p className={'text-xs font-bold ' + c.textMut + ' uppercase tracking-wide mb-2'}>🔗 Related Tools</p>
          <div className={'space-y-1.5 text-xs ' + c.textSec}>
            <p>Trying to decide if something's worth finishing? <a href="/PlotTwist" target="_blank" rel="noopener noreferrer" className={c.linkStyle}>Plot Twist</a> untangles tough decisions.</p>
            <p>Got a confusing message about a show? <a href="/DecoderRing" target="_blank" rel="noopener noreferrer" className={c.linkStyle}>Decoder Ring</a> decodes what people actually mean.</p>
          </div>
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════
  // HISTORY
  // ══════════════════════════════════════════
  const renderHistory = () => {
    if (history.length === 0) return null;
    const formatDate = (iso) => { try { const d = new Date(iso); const diff = Math.floor((new Date() - d) / 86400000); return diff === 0 ? 'Today' : diff === 1 ? 'Yesterday' : diff < 7 ? diff + 'd ago' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); } catch { return ''; } };
    const typeEmoji = { show: '📺', book: '📖', game: '🎮', sports: '🏟️' };
    return (
      <div className={'mt-6 p-4 rounded-2xl border ' + c.histBg}>
        <button onClick={() => setShowHistory(!showHistory)} className="w-full flex items-center gap-2 text-left">
          <span className={'text-base ' + c.histAccent}>🔖</span>
          <span className={'text-sm font-bold ' + c.text + ' flex-1'}>Past Bookmarks</span>
          <span className={'text-xs ' + c.textMut}>{history.length}</span>
          <span className={'text-xs ' + c.textMut}>{showHistory ? '▲' : '▼'}</span>
        </button>
        {showHistory && (
          <div className="mt-3 space-y-2">
            {history.map(entry => (
              <div key={entry.id} className={'rounded-xl border ' + c.histCard + ' p-3 flex items-center gap-3'}>
                <span className="text-base">{typeEmoji[entry.type] || '🔖'}</span>
                <div className="flex-1 min-w-0">
                  <div className={'text-sm font-semibold ' + c.text + ' truncate'}>{entry.title}</div>
                  <div className={'text-xs ' + c.textMut + ' mt-0.5'}>{formatDate(entry.date)} · {entry.stoppedAt}</div>
                </div>
                <button onClick={() => { setResults(entry.results); setShowHistory(false); }}
                  className={'px-3 py-1.5 rounded-lg text-xs font-bold ' + c.btnSec}>View</button>
                <button onClick={() => setHistory(prev => prev.filter(h => h.id !== entry.id))}
                  className={'px-2 py-1.5 rounded-lg text-xs ' + c.btnGhost + ' hover:text-red-500'}>🗑️</button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div>
          <h2 className={'text-2xl font-bold ' + c.heading}>Bookmark <span className="text-xl">🔖</span></h2>
          <p className={'text-sm ' + c.textMut}>Pick up where you left off — spoiler-free recaps for shows, books, games, and sports</p>
        </div>
      </div>
      {!results && renderInput()}
      {results && renderResults()}
      {error && (
        <div className={'mt-4 p-4 ' + c.errBg + ' border rounded-xl flex items-start gap-3'}>
          <span className={'text-base ' + c.errText}>⚠️</span>
          <p className={'text-sm ' + c.errText}>{error}</p>
        </div>
      )}
      {renderHistory()}
    </div>
  );
};

Bookmark.displayName = 'Bookmark';
export default Bookmark;
