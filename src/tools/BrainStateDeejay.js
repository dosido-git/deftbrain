import React, { useState, useCallback } from 'react';
import { Loader2, AlertCircle, Headphones, Volume2, Copy, Check, ChevronDown, ChevronUp, RefreshCw, Trash2, Music } from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';
import { usePersistentState } from '../hooks/usePersistentState';

// ════════════════════════════════════════════════════════════
// THEME
// ════════════════════════════════════════════════════════════
const useColors = () => {
  const { theme } = useTheme();
  const d = theme === 'dark';
  return {
    d,
    text: d ? 'text-zinc-50' : 'text-gray-900',
    textSec: d ? 'text-zinc-400' : 'text-gray-600',
    textMut: d ? 'text-zinc-500' : 'text-gray-500',
    border: d ? 'border-zinc-700' : 'border-stone-200',
    card: d ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-stone-200',
    inset: d ? 'bg-zinc-700' : 'bg-stone-100',
    input: d ? 'bg-zinc-700 border-zinc-600 text-zinc-100 placeholder-zinc-500 focus:border-violet-500' : 'bg-white border-stone-300 text-gray-900 placeholder-stone-400 focus:border-violet-500',
    label: d ? 'text-zinc-300' : 'text-gray-700',
    btn: d ? 'bg-violet-600 hover:bg-violet-500 text-white' : 'bg-violet-600 hover:bg-violet-700 text-white',
    btnSec: d ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-200' : 'bg-stone-100 hover:bg-stone-200 text-gray-700',
    btnGhost: d ? 'text-zinc-400 hover:text-zinc-100' : 'text-gray-500 hover:text-gray-800',
    btnDis: d ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed' : 'bg-stone-200 text-stone-400 cursor-not-allowed',
    pillActive: d ? 'border-violet-500 bg-violet-900/30 text-violet-300' : 'border-violet-500 bg-violet-50 text-violet-700',
    pillInactive: d ? 'border-zinc-600 text-zinc-400 hover:border-zinc-500' : 'border-stone-200 text-gray-500 hover:border-stone-400',
    // Result-specific
    heroBg: d ? 'bg-gradient-to-r from-violet-900/50 to-emerald-900/50 border-violet-700' : 'bg-gradient-to-r from-violet-500 to-emerald-500 border-violet-300',
    heroText: d ? 'text-zinc-50' : 'text-white',
    heroSub: d ? 'text-violet-300' : 'text-violet-100',
    phaseBg: d ? 'bg-violet-900/20 border-violet-700/40' : 'bg-violet-50 border-violet-200',
    phaseTitle: d ? 'text-violet-300' : 'text-violet-900',
    phaseText: d ? 'text-violet-200' : 'text-violet-700',
    genrePill: d ? 'bg-violet-800/40 text-violet-300' : 'bg-violet-100 text-violet-700',
    spotifyBg: d ? 'bg-emerald-900/20 border-emerald-700/40' : 'bg-emerald-50 border-emerald-200',
    spotifyText: d ? 'text-emerald-300' : 'text-emerald-800',
    spotifyCode: d ? 'text-emerald-400' : 'text-emerald-700',
    audioBg: d ? 'bg-sky-900/20 border-sky-700/40' : 'bg-sky-50 border-sky-200',
    audioTitle: d ? 'text-sky-300' : 'text-sky-900',
    audioText: d ? 'text-sky-200' : 'text-sky-800',
    altBg: d ? 'bg-zinc-700 border-zinc-600' : 'bg-stone-50 border-stone-200',
    scienceBg: d ? 'bg-zinc-700 border-zinc-600' : 'bg-stone-100 border-stone-300',
    errBg: d ? 'bg-red-900/30 border-red-700' : 'bg-red-50 border-red-200',
    errText: d ? 'text-red-300' : 'text-red-700',
    histBg: d ? 'bg-violet-900/15 border-violet-700/40' : 'bg-violet-50/50 border-violet-200',
    histCard: d ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-stone-200',
    histAccent: d ? 'text-violet-400' : 'text-violet-700',
  };
};

// ════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════
const CURRENT_STATES = [
  { value: 'anxious', label: '😰 Anxious / Stressed' },
  { value: 'scattered', label: '🌀 Scattered / Unfocused' },
  { value: 'low_energy', label: '😴 Low Energy / Tired' },
  { value: 'overwhelmed', label: '😵 Overwhelmed' },
  { value: 'foggy', label: '🌫️ Brain Fog' },
  { value: 'restless', label: '🦗 Restless / Fidgety' },
  { value: 'irritable', label: '😤 Irritable / On Edge' },
];

const DESIRED_STATES = [
  { value: 'focused', label: '🎯 Focused' },
  { value: 'calm', label: '😌 Calm' },
  { value: 'energized', label: '⚡ Energized' },
  { value: 'creative', label: '🎨 Creative' },
  { value: 'grounded', label: '🧘 Grounded' },
  { value: 'social', label: '🗣️ Socially Ready' },
  { value: 'sleepy', label: '😴 Winding Down' },
];

const TASK_OPTIONS = [
  { value: 'deep_work', label: '🧠 Deep Work' },
  { value: 'writing', label: '✍️ Writing' },
  { value: 'coding', label: '💻 Coding' },
  { value: 'creative', label: '🎨 Creative Work' },
  { value: 'admin', label: '📋 Admin / Email' },
  { value: 'studying', label: '📖 Studying' },
  { value: 'exercise', label: '🏃 Exercise' },
  { value: 'chores', label: '🧹 Chores' },
  { value: 'unwinding', label: '🛋️ Unwinding' },
];

const GENRE_PREFS = [
  { value: 'lofi', label: 'Lo-fi' },
  { value: 'classical', label: 'Classical' },
  { value: 'electronic', label: 'Electronic' },
  { value: 'ambient', label: 'Ambient' },
  { value: 'jazz', label: 'Jazz' },
  { value: 'indie', label: 'Indie' },
  { value: 'hiphop', label: 'Hip Hop' },
  { value: 'rock', label: 'Rock' },
  { value: 'world', label: 'World' },
  { value: 'instrumental_only', label: '🚫 No Lyrics' },
];

const SENSITIVITY_OPTIONS = [
  { value: 'no_sudden_sounds', label: '🔇 No sudden sounds' },
  { value: 'need_predictability', label: '🔄 Need predictability' },
  { value: 'need_novelty', label: '✨ Need novelty / variety' },
  { value: 'sensitive_to_bass', label: '🔊 Sensitive to heavy bass' },
  { value: 'no_silence', label: '🤫 Can\'t handle silence' },
  { value: 'need_rhythm', label: '🥁 Need strong rhythm' },
  { value: 'vocals_distracting', label: '🗣️ Vocals are distracting' },
  { value: 'repetition_soothing', label: '♻️ Repetition is soothing' },
];

// ════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════
const BrainstateDeejay = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const c = useColors();

  // ── History (persistent) ──
  const [history, setHistory] = usePersistentState('brainstate-deejay-history', []);
  const [showHistory, setShowHistory] = useState(false);
  const [expandedHistId, setExpandedHistId] = useState(null);

  // ── Inputs ──
  const [currentState, setCurrentState] = useState('');
  const [desiredState, setDesiredState] = useState('');
  const [task, setTask] = useState('');
  const [genres, setGenres] = useState([]);
  const [musicTaste, setMusicTaste] = useState('');
  const [sensitivities, setSensitivities] = useState([]);
  const [showSensitivities, setShowSensitivities] = useState(false);

  // ── Results ──
  const [results, setResults] = useState(null);
  const [showInputs, setShowInputs] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // ══════════════════════════════════════════
  // HELPERS
  // ══════════════════════════════════════════
  const toggleGenre = useCallback((val) => {
    setGenres(prev => {
      if (prev.includes(val)) return prev.filter(g => g !== val);
      if (prev.length >= 4) return prev;
      return [...prev, val];
    });
  }, []);

  const toggleSensitivity = useCallback((val) => {
    setSensitivities(prev => prev.includes(val) ? prev.filter(s => s !== val) : [...prev, val]);
  }, []);

  const getLabelFor = (options, value) => {
    const opt = options.find(o => o.value === value);
    return opt ? opt.label.replace(/^[^\s]+\s/, '') : value; // strip emoji prefix
  };

  // ══════════════════════════════════════════
  // HISTORY
  // ══════════════════════════════════════════
  const saveToHistory = useCallback((res, from, to) => {
    const entry = {
      id: `dj_${Date.now()}`,
      date: new Date().toISOString(),
      from, to,
      strategy: res.playlist_strategy?.approach || '',
      phases: (res.playlist || []).length,
      results: res,
    };
    setHistory(prev => [entry, ...prev].slice(0, 30));
  }, [setHistory]);

  const removeFromHistory = useCallback((id) => {
    setHistory(prev => prev.filter(h => h.id !== id));
    if (expandedHistId === id) setExpandedHistId(null);
  }, [setHistory, expandedHistId]);

  const loadFromHistory = useCallback((entry) => {
    setResults(entry.results);
    setShowInputs(false);
    setShowHistory(false);
    setCopied(false);
  }, []);

  // ══════════════════════════════════════════
  // API
  // ══════════════════════════════════════════
  const generate = useCallback(async () => {
    if (!currentState || !desiredState) return;
    setError(''); setResults(null); setCopied(false);
    try {
      const res = await callToolEndpoint('brainstate-deejay', {
        currentState: getLabelFor(CURRENT_STATES, currentState),
        desiredState: getLabelFor(DESIRED_STATES, desiredState),
        taskContext: task ? getLabelFor(TASK_OPTIONS, task) : '',
        musicPreferences: [
          genres.map(g => getLabelFor(GENRE_PREFS, g)).join(', '),
          musicTaste.trim()
        ].filter(Boolean).join('. '),
        sensitivities: sensitivities.map(s => getLabelFor(SENSITIVITY_OPTIONS, s)),
      });
      setResults(res);
      setShowInputs(false);
      saveToHistory(res, getLabelFor(CURRENT_STATES, currentState), getLabelFor(DESIRED_STATES, desiredState));
    } catch (err) {
      setError(err.message || 'Failed to generate playlist. Try again.');
    }
  }, [currentState, desiredState, task, genres, musicTaste, sensitivities, callToolEndpoint, saveToHistory]);

  const regenerate = useCallback(async () => {
    setShowInputs(true);
    setResults(null);
    setCopied(false);
  }, []);

  // ══════════════════════════════════════════
  // COPY
  // ══════════════════════════════════════════
  const copyPlaylist = useCallback(() => {
    if (!results) return;
    const st = results.state_transition || {};
    const lines = [
      `🎧 Brainstate Deejay`,
      `${st.from || ''} → ${st.to || ''}`,
      st.task ? `Task: ${st.task}` : '', '',
      `Strategy: ${results.playlist_strategy?.approach || ''}`,
      results.playlist_strategy?.why || '', '',
    ];
    (results.playlist || []).forEach(phase => {
      lines.push(`── ${phase.phase} (${phase.duration || ''}) ──`);
      lines.push(phase.characteristics || '');
      if (phase.genre_suggestions) lines.push(`Genres: ${phase.genre_suggestions.join(', ')}`);
      if (phase.example_artists) lines.push(`Artists: ${phase.example_artists.join(', ')}`);
      if (phase.spotify_search) lines.push(`Spotify: ${phase.spotify_search}`);
      lines.push('');
    });
    if (results.audio_settings) {
      lines.push('🔊 Audio Settings');
      lines.push(`Volume: ${results.audio_settings.recommended_volume || ''}`);
      lines.push(`Headphones: ${results.audio_settings.headphones || ''}`);
    }
    navigator.clipboard.writeText(lines.filter(l => l !== undefined).join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [results]);

  // ══════════════════════════════════════════
  // RENDER: Pills (reusable)
  // ══════════════════════════════════════════
  const renderPills = (options, value, setter, multi = false) => (
    <div className="flex flex-wrap gap-1.5">
      {options.map(opt => {
        const active = multi ? value.includes(opt.value) : value === opt.value;
        return (
          <button key={opt.value}
            onClick={() => multi ? setter(opt.value) : setter(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${active ? c.pillActive : c.pillInactive}`}>
            {active && <Check className="w-3 h-3 inline mr-1" />}
            {opt.label}
          </button>
        );
      })}
    </div>
  );

  // ══════════════════════════════════════════
  // RENDER: Header
  // ══════════════════════════════════════════
  const renderHeader = () => (
    <div className="flex items-center gap-3 mb-5">
      <div>
        <h2 className={`text-2xl font-bold ${c.text}`}>Brainstate Deejay 🎧</h2>
        <p className={`text-sm ${c.textMut}`}>Science-backed playlists for cognitive state transitions</p>
      </div>
    </div>
  );

  // ══════════════════════════════════════════
  // RENDER: Input Form
  // ══════════════════════════════════════════
  const renderInputForm = () => (
    <div className="space-y-4">
      {/* Current State */}
      <div className={`p-5 rounded-2xl border ${c.border} ${c.card}`}>
        <label className={`text-xs font-bold ${c.textSec} uppercase tracking-wide mb-2 block`}>😰 How do you feel right now?</label>
        {renderPills(CURRENT_STATES, currentState, setCurrentState)}
      </div>

      {/* Desired State */}
      <div className={`p-5 rounded-2xl border ${c.border} ${c.card}`}>
        <label className={`text-xs font-bold ${c.textSec} uppercase tracking-wide mb-2 block`}>🎯 Where do you need to be?</label>
        {renderPills(DESIRED_STATES, desiredState, setDesiredState)}
      </div>

      {/* Task */}
      <div className={`p-5 rounded-2xl border ${c.border} ${c.card}`}>
        <label className={`text-xs font-bold ${c.textSec} uppercase tracking-wide mb-1 block`}>📋 What are you doing?</label>
        <p className={`text-xs ${c.textMut} mb-2`}>Optional — helps tailor the playlist</p>
        {renderPills(TASK_OPTIONS, task, setTask)}
      </div>

      {/* Genre Preferences */}
      <div className={`p-5 rounded-2xl border ${c.border} ${c.card}`}>
        <label className={`text-xs font-bold ${c.textSec} uppercase tracking-wide mb-1 block`}>🎵 Music preferences</label>
        <p className={`text-xs ${c.textMut} mb-2`}>Pick up to 4 genres you enjoy</p>
        {renderPills(GENRE_PREFS, genres, toggleGenre, true)}
        <input type="text" value={musicTaste} onChange={e => setMusicTaste(e.target.value)}
          placeholder="Artists you love, e.g. 'Tycho, Nils Frahm, Bonobo'..."
          className={`w-full mt-3 px-4 py-2.5 rounded-xl border text-sm ${c.input} outline-none`} />
      </div>

      {/* Sensitivities */}
      <div className={`p-5 rounded-2xl border ${c.border} ${c.card}`}>
        <button onClick={() => setShowSensitivities(!showSensitivities)}
          className={`flex items-center gap-2 text-xs font-bold ${c.textSec} uppercase tracking-wide`}>
          {showSensitivities ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          🧠 Listening sensitivities
          {sensitivities.length > 0 && <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] ${c.pillActive}`}>{sensitivities.length}</span>}
        </button>
        <p className={`text-xs ${c.textMut} mt-1`}>Help us avoid sounds that don't work for you</p>
        {showSensitivities && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {SENSITIVITY_OPTIONS.map(opt => (
              <button key={opt.value} onClick={() => toggleSensitivity(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${sensitivities.includes(opt.value) ? c.pillActive : c.pillInactive}`}>
                {sensitivities.includes(opt.value) && <Check className="w-3 h-3 inline mr-1" />}
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Generate */}
      <button onClick={generate}
        disabled={loading || !currentState || !desiredState}
        className={`w-full py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all
          ${loading || !currentState || !desiredState ? c.btnDis : c.btn}`}>
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Creating your playlist...</>
        ) : (
          <><Music className="w-4 h-4" /> Generate Playlist</>
        )}
      </button>
    </div>
  );

  // ══════════════════════════════════════════
  // RENDER: Results
  // ══════════════════════════════════════════
  const renderResults = () => {
    if (!results) return null;
    const st = results.state_transition || {};
    const strategy = results.playlist_strategy || {};
    const phases = results.playlist || [];
    const audio = results.audio_settings || {};
    const alts = results.alternative_playlists || [];

    return (
      <div className="space-y-4">
        {/* Collapse/expand inputs */}
        <button onClick={() => setShowInputs(!showInputs)}
          className={`flex items-center gap-2 text-xs font-semibold ${c.btnGhost}`}>
          {showInputs ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {showInputs ? 'Hide settings' : 'Show settings'}
        </button>

        {/* Hero: Transition */}
        <div className={`rounded-2xl border-2 p-5 ${c.heroBg}`}>
          <h3 className={`text-xl font-bold mb-2 ${c.heroText}`}>Your Playlist Strategy</h3>
          <div className="flex items-center gap-3 mb-3">
            <span className={`text-sm font-semibold ${c.heroSub}`}>{st.from}</span>
            <span className={c.heroText}>→</span>
            <span className={`text-sm font-semibold ${c.heroText}`}>{st.to}</span>
          </div>
          {st.task && <p className={`text-sm ${c.heroSub}`}>For: {st.task}</p>}
        </div>

        {/* Strategy */}
        {strategy.approach && (
          <div className={`p-5 rounded-2xl border ${c.card}`}>
            <h3 className={`text-sm font-bold mb-2 ${c.text}`}>🎶 {strategy.approach}</h3>
            <p className={`text-sm ${c.textSec} mb-3`}>{strategy.why}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {['phase_1', 'phase_2', 'phase_3'].map((key, i) => strategy[key] && (
                <div key={key} className={`p-3 rounded-xl border ${c.phaseBg}`}>
                  <div className={`text-xs font-bold mb-1 ${c.phaseTitle}`}>Phase {i + 1}</div>
                  <p className={`text-xs ${c.phaseText}`}>{strategy[key]}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Playlist Phases */}
        {phases.map((phase, idx) => (
          <div key={idx} className={`p-5 rounded-2xl border ${c.card}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`text-sm font-bold ${c.text}`}>🎵 {phase.phase}</h3>
              {phase.duration && <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${c.inset} ${c.textMut}`}>{phase.duration}</span>}
            </div>
            <p className={`text-sm ${c.textSec} mb-3`}>{phase.characteristics}</p>

            {phase.genre_suggestions?.length > 0 && (
              <div className="mb-3">
                <div className={`text-xs font-semibold ${c.label} mb-1.5`}>Genres</div>
                <div className="flex flex-wrap gap-1.5">
                  {phase.genre_suggestions.map((g, i) => (
                    <span key={i} className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${c.genrePill}`}>{g}</span>
                  ))}
                </div>
              </div>
            )}

            {phase.example_artists?.length > 0 && (
              <div className="mb-3">
                <div className={`text-xs font-semibold ${c.label} mb-1`}>Example Artists</div>
                <p className={`text-xs ${c.textSec}`}>{phase.example_artists.join(', ')}</p>
              </div>
            )}

            {phase.spotify_search && (
              <div className={`p-3 rounded-xl border ${c.spotifyBg}`}>
                <div className={`text-xs font-semibold mb-1 ${c.spotifyText}`}>🎵 Search on Spotify</div>
                <code className={`text-xs ${c.spotifyCode}`}>{phase.spotify_search}</code>
              </div>
            )}
          </div>
        ))}

        {/* Audio Settings */}
        {(audio.recommended_volume || audio.headphones) && (
          <div className={`p-5 rounded-2xl border ${c.audioBg}`}>
            <div className="flex items-center gap-2 mb-3">
              <Volume2 className={`w-4 h-4 ${c.audioTitle}`} />
              <h3 className={`text-sm font-bold ${c.audioTitle}`}>Audio Settings</h3>
            </div>
            <div className={`space-y-1.5 text-sm ${c.audioText}`}>
              {audio.recommended_volume && <p><strong>Volume:</strong> {audio.recommended_volume}</p>}
              {audio.headphones && <p><strong>Headphones:</strong> {audio.headphones}</p>}
              {audio.avoid?.length > 0 && (
                <p><strong>Avoid:</strong> {audio.avoid.join(', ')}</p>
              )}
            </div>
          </div>
        )}

        {/* Alternatives */}
        {alts.length > 0 && (
          <div className={`p-5 rounded-2xl border ${c.card}`}>
            <h3 className={`text-sm font-bold mb-3 ${c.text}`}>🔄 If This Doesn't Feel Right</h3>
            <div className="space-y-2">
              {alts.map((alt, idx) => (
                <div key={idx} className={`p-3 rounded-xl border ${c.altBg}`}>
                  <div className={`text-xs font-bold mb-1 ${c.text}`}>{alt.name}</div>
                  <p className={`text-xs ${c.textSec}`}><strong>Change:</strong> {alt.change}</p>
                  <p className={`text-xs ${c.textMut}`}><strong>When:</strong> {alt.when}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Science Note */}
        {results.science_note && (
          <div className={`p-5 rounded-2xl border ${c.scienceBg}`}>
            <h3 className={`text-sm font-bold mb-2 ${c.text}`}>💡 Why This Works</h3>
            <p className={`text-sm ${c.textSec}`}>{results.science_note}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button onClick={copyPlaylist}
            className={`flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 ${c.btnSec}`}>
            {copied ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy Playlist</>}
          </button>
          <button onClick={regenerate}
            className={`flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 ${c.btn}`}>
            <RefreshCw className="w-3.5 h-3.5" /> New Playlist
          </button>
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════
  // RENDER: Error
  // ══════════════════════════════════════════
  const renderError = () => error ? (
    <div className={`mt-4 p-4 ${c.errBg} border rounded-xl flex items-start gap-3`}>
      <AlertCircle className={`w-5 h-5 ${c.errText} flex-shrink-0 mt-0.5`} />
      <p className={`text-sm ${c.errText}`}>{error}</p>
    </div>
  ) : null;

  // ══════════════════════════════════════════
  // RENDER: History
  // ══════════════════════════════════════════
  const renderHistory = () => {
    if (history.length === 0) return null;

    const formatDate = (iso) => {
      try {
        const d = new Date(iso);
        const now = new Date();
        const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
        if (diff === 0) return 'Today';
        if (diff === 1) return 'Yesterday';
        if (diff < 7) return `${diff} days ago`;
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } catch { return ''; }
    };

    return (
      <div className={`mt-6 p-4 rounded-2xl border ${c.histBg}`}>
        <button onClick={() => setShowHistory(!showHistory)}
          className="w-full flex items-center gap-2 text-left">
          <Headphones className={`w-4 h-4 ${c.histAccent}`} />
          <span className={`text-sm font-bold ${c.text} flex-1`}>Past Playlists</span>
          <span className={`text-xs ${c.textMut}`}>{history.length}</span>
          {showHistory ? <ChevronUp className={`w-4 h-4 ${c.textMut}`} /> : <ChevronDown className={`w-4 h-4 ${c.textMut}`} />}
        </button>

        {showHistory && (
          <div className="mt-3 space-y-2">
            {history.map(entry => {
              const isExp = expandedHistId === entry.id;
              return (
                <div key={entry.id} className={`rounded-xl border ${c.histCard} overflow-hidden`}>
                  <button onClick={() => setExpandedHistId(isExp ? null : entry.id)}
                    className="w-full flex items-center gap-3 p-3 text-left">
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-semibold ${c.text} truncate`}>{entry.from} → {entry.to}</div>
                      <div className={`text-xs ${c.textMut} mt-0.5`}>
                        {formatDate(entry.date)} · {entry.strategy} · {entry.phases} phases
                      </div>
                    </div>
                    {isExp ? <ChevronUp className={`w-4 h-4 ${c.textMut} flex-shrink-0`} /> : <ChevronDown className={`w-4 h-4 ${c.textMut} flex-shrink-0`} />}
                  </button>
                  {isExp && (
                    <div className={`px-3 pb-3 border-t ${c.border} flex gap-2`}>
                      <button onClick={() => loadFromHistory(entry)}
                        className={`flex-1 mt-2 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 ${c.btn}`}>
                        <Music className="w-3 h-3" /> View Again
                      </button>
                      <button onClick={() => removeFromHistory(entry.id)}
                        className={`mt-2 px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${c.btnSec} hover:text-red-500`}>
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            {history.length > 1 && (
              <button onClick={() => { setHistory([]); setExpandedHistId(null); }}
                className={`w-full mt-1 text-center text-xs font-semibold ${c.btnGhost} hover:text-red-500 py-1.5`}>
                Clear all history
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  // ══════════════════════════════════════════
  // MAIN RENDER
  // ══════════════════════════════════════════
  return (
    <div>
      {renderHeader()}
      {(!results || showInputs) && renderInputForm()}
      {results && renderResults()}
      {renderError()}
      {renderHistory()}
    </div>
  );
};

BrainstateDeejay.displayName = 'BrainstateDeejay';
export default BrainstateDeejay;
