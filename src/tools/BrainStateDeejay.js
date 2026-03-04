import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';
import { usePersistentState } from '../hooks/usePersistentState';
import { CopyBtn } from '../components/ActionButtons';

// ════════════════════════════════════════════════════════════
// THEME — Navy & Gold palette
// ════════════════════════════════════════════════════════════
const useColors = () => {
  const { theme } = useTheme();
  const d = theme === 'dark';
  return {
    d,
    // Surfaces
    card:        d ? 'bg-[#2a2623] border-[#3d3630]'  : 'bg-white border-[#e8e1d5]',
    inset:       d ? 'bg-[#1a1816]'                    : 'bg-[#faf8f5]',
    inputBg:     d ? 'bg-[#1a1816] border-[#3d3630] text-[#f0eeea] placeholder-[#8a8275] focus:border-[#4a6a8a]'
                    : 'bg-[#faf8f5] border-[#d5cab8] text-[#3d3935] placeholder-[#8a8275] focus:border-[#4a6a8a]',
    // Text
    text:        d ? 'text-[#f0eeea]'  : 'text-[#3d3935]',
    heading:     d ? 'text-[#f3efe8]'  : 'text-[#1e2a3a]',
    textSec:     d ? 'text-[#c8c3b9]'  : 'text-[#5a544a]',
    textMut:     d ? 'text-[#8a8275]'  : 'text-[#8a8275]',
    label:       d ? 'text-[#c8c3b9]'  : 'text-[#5a544a]',
    border:      d ? 'border-[#3d3630]' : 'border-[#e8e1d5]',
    // Buttons
    btn:         d ? 'bg-[#2c4a6e] hover:bg-[#4a6a8a] text-white' : 'bg-[#2c4a6e] hover:bg-[#1e3a58] text-white',
    btnGold:     d ? 'bg-[#b06d22] hover:bg-[#c8872e] text-white' : 'bg-[#c8872e] hover:bg-[#b06d22] text-white',
    btnSec:      d ? 'bg-[#332e2a] hover:bg-[#3d3630] text-[#c8c3b9] border border-[#3d3630]'
                    : 'bg-[#f3efe8] hover:bg-[#e8e1d5] text-[#5e5042] border border-[#d5cab8]',
    btnGhost:    d ? 'text-[#8a8275] hover:text-[#f0eeea]' : 'text-[#8a8275] hover:text-[#3d3935]',
    btnDis:      d ? 'bg-[#332e2a] text-[#5a544a] cursor-not-allowed' : 'bg-[#e8e1d5] text-[#8a8275] cursor-not-allowed',
    // Pills
    pillActive:  d ? 'border-[#4a6a8a] bg-[#2c4a6e]/30 text-[#a8b9ce]' : 'border-[#2c4a6e] bg-[#d4dde8] text-[#1e3a58]',
    pillInactive: d ? 'border-[#3d3630] text-[#8a8275] hover:border-[#5a544a]' : 'border-[#d5cab8] text-[#5a544a] hover:border-[#8a8275]',
    // Result-specific
    heroBg:      d ? 'bg-gradient-to-r from-[#1e2a3a] to-[#2c4a6e] border-[#4a6a8a]' : 'bg-gradient-to-r from-[#2c4a6e] to-[#4a6a8a] border-[#2c4a6e]',
    heroText:    d ? 'text-[#f0eeea]' : 'text-white',
    heroSub:     d ? 'text-[#a8b9ce]' : 'text-[#d4dde8]',
    phaseBg:     d ? 'bg-[#2c4a6e]/15 border-[#4a6a8a]/30' : 'bg-[#d4dde8]/50 border-[#2c4a6e]/20',
    phaseTitle:  d ? 'text-[#a8b9ce]' : 'text-[#1e3a58]',
    phaseText:   d ? 'text-[#8aa4c0]' : 'text-[#2c4a6e]',
    genrePill:   d ? 'bg-[#2c4a6e]/30 text-[#a8b9ce]' : 'bg-[#d4dde8] text-[#1e3a58]',
    bpmBadge:    d ? 'bg-[#b06d22]/20 text-[#d9a04e]' : 'bg-[#f9edd8] text-[#93541f]',
    spotifyBg:   d ? 'bg-[#1a3a2a] border-[#2a5a3a]' : 'bg-[#e8f5ee] border-[#b8d8c8]',
    spotifyText: d ? 'text-[#4ade80]' : 'text-[#166534]',
    trackBg:     d ? 'bg-[#332e2a] border-[#3d3630]' : 'bg-[#f3efe8] border-[#e8e1d5]',
    trackText:   d ? 'text-[#c8c3b9]' : 'text-[#5a544a]',
    audioBg:     d ? 'bg-[#1a2a3a] border-[#2a4a5a]' : 'bg-[#e6f0f5] border-[#b8d0e0]',
    audioTitle:  d ? 'text-[#6eaacc]' : 'text-[#1e4a6e]',
    audioText:   d ? 'text-[#8ab8d4]' : 'text-[#2c5a7e]',
    altBg:       d ? 'bg-[#332e2a] border-[#3d3630]' : 'bg-[#faf8f5] border-[#e8e1d5]',
    scienceBg:   d ? 'bg-[#332e2a] border-[#3d3630]' : 'bg-[#f3efe8] border-[#d5cab8]',
    errBg:       d ? 'bg-[#b54a3f]/15 border-[#b54a3f]/40' : 'bg-[#fceae8] border-[#e8a8a0]',
    errText:     d ? 'text-[#e88880]' : 'text-[#b54a3f]',
    histBg:      d ? 'bg-[#2c4a6e]/10 border-[#4a6a8a]/30' : 'bg-[#d4dde8]/30 border-[#2c4a6e]/15',
    histCard:    d ? 'bg-[#2a2623] border-[#3d3630]' : 'bg-white border-[#e8e1d5]',
    histAccent:  d ? 'text-[#a8b9ce]' : 'text-[#2c4a6e]',
    adjustBg:    d ? 'bg-[#c8872e]/10 border-[#c8872e]/30' : 'bg-[#f9edd8] border-[#c8872e]/30',
    adjustText:  d ? 'text-[#d9a04e]' : 'text-[#93541f]',
    timelineBg:  d ? 'bg-[#3d3630]' : 'bg-[#e8e1d5]',
    timelineFill: d ? 'bg-[#4a6a8a]' : 'bg-[#2c4a6e]',
    timelineGold: d ? 'bg-[#c8872e]' : 'bg-[#c8872e]',
    presetBg:    d ? 'bg-[#2a2623] border-[#3d3630] hover:border-[#4a6a8a] hover:bg-[#332e2a]'
                    : 'bg-white border-[#e8e1d5] hover:border-[#2c4a6e] hover:bg-[#faf8f5]',
    presetActive: d ? 'text-[#d9a04e]' : 'text-[#c8872e]',
    linkStyle:   d ? 'text-[#6e8aaa] hover:text-[#a8b9ce] underline' : 'text-[#2c4a6e] hover:text-[#1e3a58] underline',
    // Breathing guide
    breathRing:  d ? '#4a6a8a' : '#2c4a6e',
    breathGlow:  d ? 'rgba(74,106,138,0.3)' : 'rgba(44,74,110,0.2)',
    // Check-in / success
    checkinBg:   d ? 'bg-[#2c4a6e]/20 border-[#4a6a8a]/50' : 'bg-[#d4dde8]/60 border-[#2c4a6e]/30',
    checkinText: d ? 'text-[#a8b9ce]' : 'text-[#1e3a58]',
    successBg:   d ? 'bg-[#5a8a5c]/15 border-[#5a8a5c]/40' : 'bg-[#e8f0e8] border-[#5a8a5c]/30',
    successText: d ? 'text-[#7aba7c]' : 'text-[#3a6a3c]',
    shareCopied: d ? 'text-[#7aba7c]' : 'text-[#3a6a3c]',
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

const QUICK_PRESETS = [
  { label: '☀️ Morning Focus',   from: 'low_energy',  to: 'focused',   task: 'deep_work',  hours: [5,6,7,8,9,10] },
  { label: '🎨 Creative Flow',   from: 'scattered',   to: 'creative',  task: 'creative',    hours: [10,11,14,15] },
  { label: '🌙 Wind Down',       from: 'restless',    to: 'sleepy',    task: 'unwinding',   hours: [20,21,22,23,0] },
  { label: '📖 Study Mode',      from: 'scattered',   to: 'focused',   task: 'studying',    hours: [13,14,15,16,17,18,19] },
  { label: '😌 Calm My Nerves',  from: 'anxious',     to: 'calm',      task: '',            hours: [] },
  { label: '⚡ Energy Boost',    from: 'low_energy',  to: 'energized', task: 'exercise',    hours: [11,12,13,14,15,16] },
];

const ADJUSTMENT_OPTIONS = [
  { value: 'too_stimulating',  label: '📉 Too stimulating / intense' },
  { value: 'not_enough',       label: '📈 Not enough energy / too boring' },
  { value: 'wrong_genre',      label: '🎵 Wrong genre / style' },
  { value: 'tempo_off',        label: '🥁 Tempo feels off' },
];

// ════════════════════════════════════════════════════════════
// HELPERS (outside component for stability)
// ════════════════════════════════════════════════════════════
const getLabelFor = (options, value) => {
  const opt = options.find(o => o.value === value);
  return opt ? opt.label.replace(/^[^\s]+\s/, '') : value;
};

const makeSpotifyUrl = (query) => `https://open.spotify.com/search/${encodeURIComponent(query)}`;
const makeYouTubeUrl = (query) => `https://music.youtube.com/search?q=${encodeURIComponent(query)}`;

const parseBpm = (bpmStr) => {
  if (!bpmStr) return 80;
  const match = bpmStr.match(/(\d+)/);
  return match ? parseInt(match[1]) : 80;
};

const parseDuration = (dur) => {
  if (!dur) return 15;
  const match = dur.match(/(\d+)/);
  if (match) return parseInt(match[1]);
  if (dur.toLowerCase().includes('ongoing')) return 30;
  return 15;
};

const formatTimer = (secs) => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

// ════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════
const BrainstateDeejay = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const c = useColors();

  // ── Persistent ──
  const [history, setHistory] = usePersistentState('brainstate-deejay-history', []);
  const [winningCombos, setWinningCombos] = usePersistentState('brainstate-deejay-wins', []);

  // ── UI ──
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

  // ── Adjustment ──
  const [showAdjust, setShowAdjust] = useState(false);
  const [adjustFeedback, setAdjustFeedback] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  // ── Listening session timer (#1) ──
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionElapsed, setSessionElapsed] = useState(0);
  const [showCheckin, setShowCheckin] = useState(false);
  const [checkinPhase, setCheckinPhase] = useState(0);
  const [checkinDismissed, setCheckinDismissed] = useState([]);
  const [rated, setRated] = useState(false);
  const timerRef = useRef(null);

  // ── Breathing guide (#4) ──
  const [breathingActive, setBreathingActive] = useState(false);

  // ── Share link copied feedback (#6) ──
  const [shareCopied, setShareCopied] = useState(false);

  // ══════════════════════════════════════════
  // TIME-OF-DAY SUGGESTED PRESET (#5)
  // ══════════════════════════════════════════
  const suggestedPresetIdx = useMemo(() => {
    const hour = new Date().getHours();
    const idx = QUICK_PRESETS.findIndex(p => p.hours.includes(hour));
    return idx >= 0 ? idx : -1;
  }, []);

  // ══════════════════════════════════════════
  // COLLABORATIVE SHARE: decode on mount (#6)
  // ══════════════════════════════════════════
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const shared = params.get('djshare');
      if (shared) {
        const decoded = JSON.parse(atob(shared));
        if (decoded.from) setCurrentState(decoded.from);
        if (decoded.to) setDesiredState(decoded.to);
        if (decoded.task) setTask(decoded.task);
        if (decoded.genres) setGenres(decoded.genres);
        if (decoded.sensitivities) setSensitivities(decoded.sensitivities);
        window.history.replaceState({}, '', window.location.pathname);
      }
    } catch { /* ignore malformed share data */ }
  }, []);

  // ══════════════════════════════════════════
  // LISTENING SESSION TIMER (#1)
  // ══════════════════════════════════════════
  useEffect(() => {
    if (sessionActive) {
      timerRef.current = setInterval(() => {
        setSessionElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [sessionActive]);

  // Check for phase transitions → trigger check-in
  useEffect(() => {
    if (!sessionActive || !results?.playlist) return;
    const phases = results.playlist;
    let cumulative = 0;
    for (let i = 0; i < phases.length - 1; i++) {
      cumulative += parseDuration(phases[i].duration) * 60;
      if (sessionElapsed >= cumulative + 30 && sessionElapsed < cumulative + 35 && !checkinDismissed.includes(i)) {
        setShowCheckin(true);
        setCheckinPhase(i + 1);
        break;
      }
    }
  }, [sessionElapsed, sessionActive, results, checkinDismissed]);

  const startSession = useCallback(() => {
    setSessionActive(true);
    setSessionElapsed(0);
    setCheckinDismissed([]);
    setRated(false);
  }, []);

  const stopSession = useCallback(() => {
    setSessionActive(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const dismissCheckin = useCallback((response) => {
    setShowCheckin(false);
    setCheckinDismissed(prev => [...prev, checkinPhase - 1]);
    if (response === 'worse') setShowAdjust(true);
  }, [checkinPhase]);

  // ══════════════════════════════════════════
  // WHAT WORKED LEARNING (#3)
  // ══════════════════════════════════════════
  const markAsWinner = useCallback(() => {
    if (!results?.state_transition) return;
    const st = results.state_transition;
    const combo = {
      from: st.from,
      to: st.to,
      task: st.task || '',
      genres: genres.slice(),
      sensitivities: sensitivities.slice(),
      strategy: results.playlist_strategy?.approach || '',
      date: new Date().toISOString(),
    };
    setWinningCombos(prev => {
      const key = `${combo.from}->${combo.to}`;
      const filtered = prev.filter(w => `${w.from}->${w.to}` !== key);
      return [combo, ...filtered].slice(0, 20);
    });
    setRated(true);
  }, [results, genres, sensitivities, setWinningCombos]);

  const getWinningCombo = useCallback((from, to) => {
    const fromLabel = getLabelFor(CURRENT_STATES, from);
    const toLabel = getLabelFor(DESIRED_STATES, to);
    return winningCombos.find(w => w.from === fromLabel && w.to === toLabel);
  }, [winningCombos]);

  // ══════════════════════════════════════════
  // COLLABORATIVE SHARE: encode (#6)
  // ══════════════════════════════════════════
  const copyShareUrl = useCallback(() => {
    const data = { from: currentState, to: desiredState, task, genres, sensitivities };
    const encoded = btoa(JSON.stringify(data));
    const url = `${window.location.origin}${window.location.pathname}?djshare=${encoded}`;
    navigator.clipboard.writeText(url).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    });
  }, [currentState, desiredState, task, genres, sensitivities]);

  // ══════════════════════════════════════════
  // TOGGLE HELPERS
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

  // ══════════════════════════════════════════
  // COPY TEXT BUILDERS
  // ══════════════════════════════════════════
  const buildCopyText = useCallback(() => {
    if (!results) return '';
    const st = results.state_transition || {};
    const lines = [
      '🎧 Brainstate Deejay',
      `${st.from || ''} → ${st.to || ''}`,
      st.task ? `Task: ${st.task}` : '', '',
      `Strategy: ${results.playlist_strategy?.approach || ''}`,
      results.playlist_strategy?.why || '', '',
    ];
    (results.playlist || []).forEach(phase => {
      lines.push(`── ${phase.phase} (${phase.duration || ''}) ──`);
      if (phase.bpm_range) lines.push(`BPM: ${phase.bpm_range}`);
      lines.push(phase.characteristics || '');
      if (phase.genre_suggestions) lines.push(`Genres: ${phase.genre_suggestions.join(', ')}`);
      if (phase.example_artists) lines.push(`Artists: ${phase.example_artists.join(', ')}`);
      if (phase.specific_tracks?.length > 0) lines.push(`Tracks: ${phase.specific_tracks.join(' | ')}`);
      if (phase.spotify_search) lines.push(`Spotify: ${makeSpotifyUrl(phase.spotify_search)}`);
      lines.push('');
    });
    if (results.audio_settings) {
      lines.push('🔊 Audio Settings');
      lines.push(`Volume: ${results.audio_settings.recommended_volume || ''}`);
      lines.push(`Headphones: ${results.audio_settings.headphones || ''}`);
    }
    lines.push('', '— Generated by DeftBrain · deftbrain.com');
    return lines.filter(l => l !== undefined).join('\n');
  }, [results]);

  // Track list only — paste-ready for creating playlists (#2)
  const buildTrackList = useCallback(() => {
    if (!results?.playlist) return '';
    const lines = ['🎧 Brainstate Deejay — Track List', ''];
    (results.playlist || []).forEach(phase => {
      if (phase.specific_tracks?.length > 0) {
        lines.push(`── ${phase.phase} ──`);
        phase.specific_tracks.forEach(t => lines.push(t));
        lines.push('');
      }
    });
    lines.push('— Generated by DeftBrain · deftbrain.com');
    return lines.join('\n');
  }, [results]);

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
    setShowAdjust(false);
    setAdjustFeedback('');
    stopSession();
    setRated(false);
  }, [stopSession]);

  // ══════════════════════════════════════════
  // API
  // ══════════════════════════════════════════
  const generate = useCallback(async () => {
    if (!currentState || !desiredState) return;
    setError(''); setResults(null); setShowAdjust(false); setAdjustFeedback('');
    stopSession(); setRated(false);
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
  }, [currentState, desiredState, task, genres, musicTaste, sensitivities, callToolEndpoint, saveToHistory, stopSession]);

  const regenerate = useCallback(() => {
    setShowInputs(true);
    setResults(null);
    setShowAdjust(false);
    setAdjustFeedback('');
    stopSession(); setRated(false);
  }, [stopSession]);

  const submitAdjustment = useCallback(async () => {
    if (!adjustFeedback || !results) return;
    setError(''); setAdjusting(true);
    try {
      const st = results.state_transition || {};
      const res = await callToolEndpoint('brainstate-deejay/adjust', {
        currentState: st.from || '',
        desiredState: st.to || '',
        taskContext: st.task || '',
        musicPreferences: [
          genres.map(g => getLabelFor(GENRE_PREFS, g)).join(', '),
          musicTaste.trim()
        ].filter(Boolean).join('. '),
        sensitivities: sensitivities.map(s => getLabelFor(SENSITIVITY_OPTIONS, s)),
        feedback: adjustFeedback,
      });
      setResults(res);
      setShowAdjust(false);
      setAdjustFeedback('');
      stopSession(); setRated(false);
      saveToHistory(res, st.from || '', `${st.to || ''} (adjusted)`);
    } catch (err) {
      setError(err.message || 'Failed to adjust playlist. Try again.');
    } finally {
      setAdjusting(false);
    }
  }, [adjustFeedback, results, genres, musicTaste, sensitivities, callToolEndpoint, saveToHistory, stopSession]);

  const applyPreset = useCallback((preset) => {
    setCurrentState(preset.from);
    setDesiredState(preset.to);
    setTask(preset.task);
  }, []);

  // ══════════════════════════════════════════
  // RENDER: Reusable Pills
  // ══════════════════════════════════════════
  const renderPills = (options, value, setter, multi = false) => (
    <div className="flex flex-wrap gap-1.5">
      {options.map(opt => {
        const active = multi ? value.includes(opt.value) : value === opt.value;
        return (
          <button key={opt.value}
            onClick={() => setter(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${active ? c.pillActive : c.pillInactive}`}>
            {active && <span className="mr-1">✓</span>}
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
        <h2 className={`text-2xl font-bold ${c.heading}`}>Brainstate Deejay <span className="text-xl">🎧</span></h2>
        <p className={`text-sm ${c.textMut}`}>Science-backed playlists for cognitive state transitions</p>
      </div>
    </div>
  );

  // ══════════════════════════════════════════
  // RENDER: Quick Presets (with time-of-day #5)
  // ══════════════════════════════════════════
  const renderPresets = () => (
    <div className="mb-4">
      <p className={`text-xs font-bold ${c.textMut} uppercase tracking-wide mb-2`}>⚡ Quick Start</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {QUICK_PRESETS.map((preset, idx) => {
          const isActive = currentState === preset.from && desiredState === preset.to && task === preset.task;
          const isSuggested = idx === suggestedPresetIdx;
          return (
            <button key={preset.label}
              onClick={() => applyPreset(preset)}
              className={`p-3 rounded-xl text-xs font-semibold text-left border transition-all relative ${c.presetBg} ${isActive ? 'ring-2 ring-[#2c4a6e]/40' : ''} ${isSuggested && !isActive ? 'ring-1 ring-[#c8872e]/40' : ''}`}>
              {isSuggested && !isActive && (
                <span className={`absolute -top-1.5 -right-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${c.d ? 'bg-[#b06d22] text-white' : 'bg-[#c8872e] text-white'}`}>
                  Now
                </span>
              )}
              <span className={`block text-sm mb-0.5 ${isActive ? c.presetActive : ''}`}>{preset.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  // ══════════════════════════════════════════
  // RENDER: "What Worked" suggestion (#3)
  // ══════════════════════════════════════════
  const renderWinningSuggestion = () => {
    if (!currentState || !desiredState) return null;
    const combo = getWinningCombo(currentState, desiredState);
    if (!combo) return null;
    return (
      <div className={`p-3 rounded-xl border ${c.successBg} mb-4`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm">✨</span>
          <span className={`text-xs font-bold ${c.successText}`}>This worked for you before</span>
        </div>
        <p className={`text-xs ${c.successText}`}>
          Strategy: "{combo.strategy}"{combo.genres.length > 0 ? ` · Genres: ${combo.genres.join(', ')}` : ''}
        </p>
      </div>
    );
  };

  // ══════════════════════════════════════════
  // RENDER: Input Form
  // ══════════════════════════════════════════
  const renderInputForm = () => (
    <div className="space-y-4">
      {renderPresets()}
      {renderWinningSuggestion()}

      <div className={`p-5 rounded-2xl border ${c.card}`}>
        <label className={`text-xs font-bold ${c.textSec} uppercase tracking-wide mb-2 block`}>😰 How do you feel right now?</label>
        {renderPills(CURRENT_STATES, currentState, setCurrentState)}
      </div>

      <div className={`p-5 rounded-2xl border ${c.card}`}>
        <label className={`text-xs font-bold ${c.textSec} uppercase tracking-wide mb-2 block`}>🎯 Where do you need to be?</label>
        {renderPills(DESIRED_STATES, desiredState, setDesiredState)}
      </div>

      <div className={`p-5 rounded-2xl border ${c.card}`}>
        <label className={`text-xs font-bold ${c.textSec} uppercase tracking-wide mb-1 block`}>📋 What are you doing?</label>
        <p className={`text-xs ${c.textMut} mb-2`}>Optional — helps tailor the playlist</p>
        {renderPills(TASK_OPTIONS, task, setTask)}
      </div>

      <div className={`p-5 rounded-2xl border ${c.card}`}>
        <label className={`text-xs font-bold ${c.textSec} uppercase tracking-wide mb-1 block`}>🎵 Music preferences</label>
        <p className={`text-xs ${c.textMut} mb-2`}>Pick up to 4 genres you enjoy</p>
        {renderPills(GENRE_PREFS, genres, toggleGenre, true)}
        <input type="text" value={musicTaste} onChange={e => setMusicTaste(e.target.value)}
          placeholder="Artists you love, e.g. 'Tycho, Nils Frahm, Bonobo'..."
          className={`w-full mt-3 px-4 py-2.5 rounded-xl border text-sm ${c.inputBg} outline-none`} />
      </div>

      <div className={`p-5 rounded-2xl border ${c.card}`}>
        <button onClick={() => setShowSensitivities(!showSensitivities)}
          className={`flex items-center gap-2 text-xs font-bold ${c.textSec} uppercase tracking-wide`}>
          <span className="text-xs">{showSensitivities ? '▲' : '▼'}</span>
          🧠 Listening sensitivities
          {sensitivities.length > 0 && <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] ${c.pillActive}`}>{sensitivities.length}</span>}
        </button>
        <p className={`text-xs ${c.textMut} mt-1`}>Help us avoid sounds that don't work for you</p>
        {showSensitivities && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {SENSITIVITY_OPTIONS.map(opt => (
              <button key={opt.value} onClick={() => toggleSensitivity(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${sensitivities.includes(opt.value) ? c.pillActive : c.pillInactive}`}>
                {sensitivities.includes(opt.value) && <span className="mr-1">✓</span>}
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <button onClick={generate}
        disabled={loading || !currentState || !desiredState}
        className={`w-full py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all
          ${loading || !currentState || !desiredState ? c.btnDis : c.btn}`}>
        {loading ? (
          <><span className="animate-spin inline-block">⏳</span> Creating your playlist...</>
        ) : (
          <><span>🎵</span> Generate Playlist</>
        )}
      </button>
    </div>
  );

  // ══════════════════════════════════════════
  // RENDER: BPM Breathing Guide (#4)
  // ══════════════════════════════════════════
  const renderBreathingGuide = () => {
    if (!results?.playlist) return null;
    const phases = results.playlist;
    let activePhaseIdx = 0;
    let cumulative = 0;
    for (let i = 0; i < phases.length; i++) {
      const dur = parseDuration(phases[i].duration) * 60;
      if (sessionElapsed < cumulative + dur) { activePhaseIdx = i; break; }
      cumulative += dur;
      if (i === phases.length - 1) activePhaseIdx = i;
    }
    const bpm = parseBpm(phases[activePhaseIdx]?.bpm_range);
    // 4 beats per breath cycle: inhale 2 beats, exhale 2 beats
    const cycleSec = (60 / bpm) * 4;

    return (
      <div className={`p-5 rounded-2xl border ${c.card}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-base">🫁</span>
            <h3 className={`text-sm font-bold ${c.text}`}>Breathing Guide</h3>
          </div>
          <button onClick={() => setBreathingActive(!breathingActive)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold ${breathingActive ? c.btnGold : c.btnSec}`}>
            {breathingActive ? 'Pause' : 'Start'}
          </button>
        </div>
        <p className={`text-xs ${c.textMut} mb-4`}>
          Breathe with the circle — synced to {bpm} BPM ({phases[activePhaseIdx]?.phase || 'Phase'})
        </p>
        <div className="flex justify-center">
          <div className="relative flex items-center justify-center" style={{ width: 130, height: 130 }}>
            {/* Inject keyframes once */}
            <style>{`
              @keyframes breathPulse_${Math.round(cycleSec * 10)} {
                0%, 100% { transform: scale(0.75); opacity: 0.5; }
                50% { transform: scale(1.35); opacity: 1; }
              }
              @keyframes breathText_${Math.round(cycleSec * 10)} {
                0%, 24% { opacity: 1; }
                25%, 49% { opacity: 0; }
                50%, 74% { opacity: 1; }
                75%, 100% { opacity: 0; }
              }
            `}</style>
            <div
              style={{
                width: 80, height: 80,
                borderRadius: '50%',
                border: `3px solid ${c.breathRing}`,
                boxShadow: breathingActive ? `0 0 24px ${c.breathGlow}, 0 0 48px ${c.breathGlow}` : 'none',
                animation: breathingActive ? `breathPulse_${Math.round(cycleSec * 10)} ${cycleSec}s ease-in-out infinite` : 'none',
                transition: 'box-shadow 0.5s ease',
              }}
            />
            {breathingActive && (
              <span className={`absolute text-[11px] font-bold ${c.textMut} pointer-events-none`}>Breathe</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════
  // RENDER: Listening Session (#1)
  // ══════════════════════════════════════════
  const renderListeningSession = () => {
    if (!results?.playlist) return null;
    const phases = results.playlist;

    let activePhaseIdx = 0;
    if (sessionActive) {
      let cumulative = 0;
      for (let i = 0; i < phases.length; i++) {
        const dur = parseDuration(phases[i].duration) * 60;
        if (sessionElapsed < cumulative + dur) { activePhaseIdx = i; break; }
        cumulative += dur;
        if (i === phases.length - 1) activePhaseIdx = i;
      }
    }

    return (
      <div className={`p-4 rounded-2xl border ${c.card}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-base">{sessionActive ? '🔴' : '⏱️'}</span>
            <h3 className={`text-sm font-bold ${c.text}`}>Listening Session</h3>
          </div>
          <div className="flex items-center gap-2">
            {sessionActive && (
              <span className={`text-sm font-mono font-bold ${c.text}`}>{formatTimer(sessionElapsed)}</span>
            )}
            <button onClick={sessionActive ? stopSession : startSession}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold ${sessionActive ? c.btnSec : c.btnGold}`}>
              {sessionActive ? 'Stop' : 'Start Listening'}
            </button>
          </div>
        </div>
        {sessionActive && (
          <div className="flex gap-1 mt-2">
            {phases.map((phase, idx) => (
              <div key={idx} className={`flex-1 py-1.5 rounded text-center text-[10px] font-bold transition-all ${
                idx === activePhaseIdx
                  ? (c.d ? 'bg-[#4a6a8a] text-white' : 'bg-[#2c4a6e] text-white')
                  : `${c.inset} ${c.textMut}`
              }`}>
                {phase.phase.replace('Transition ', '')}
              </div>
            ))}
          </div>
        )}

        {/* Check-in prompt */}
        {showCheckin && (
          <div className={`mt-3 p-3 rounded-xl border ${c.checkinBg}`}>
            <p className={`text-xs font-bold ${c.checkinText} mb-2`}>
              🎵 Phase {checkinPhase + 1} starting — how's it going?
            </p>
            <div className="flex gap-2">
              {[
                { label: '👍 Better', val: 'better' },
                { label: '😐 Same', val: 'same' },
                { label: '👎 Not working', val: 'worse' },
              ].map(opt => (
                <button key={opt.val} onClick={() => dismissCheckin(opt.val)}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold ${c.btnSec}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ══════════════════════════════════════════
  // RENDER: Phase Timeline
  // ══════════════════════════════════════════
  const renderTimeline = (phases) => {
    const durations = phases.map(p => parseDuration(p.duration));
    const total = durations.reduce((a, b) => a + b, 0);
    return (
      <div className={`p-4 rounded-2xl border ${c.card}`}>
        <p className={`text-xs font-bold ${c.textMut} uppercase tracking-wide mb-3`}>🕐 Listening Arc</p>
        <div className={`flex rounded-full overflow-hidden h-3 ${c.timelineBg}`}>
          {phases.map((phase, idx) => (
            <div key={idx}
              className={`h-full ${idx === 0 ? c.timelineFill : idx === 1 ? c.timelineGold : c.timelineFill} ${idx === 0 ? 'rounded-l-full' : ''} ${idx === phases.length - 1 ? 'rounded-r-full' : ''}`}
              style={{ width: `${(durations[idx] / total) * 100}%`, opacity: idx === 2 ? 0.5 : 1 }}
              title={`${phase.phase}: ${phase.duration}`}
            />
          ))}
        </div>
        <div className="flex justify-between mt-2">
          {phases.map((phase, idx) => (
            <div key={idx} className="text-center" style={{ width: `${(durations[idx] / total) * 100}%` }}>
              <p className={`text-[10px] font-bold ${c.textMut} truncate`}>{phase.phase}</p>
              <p className={`text-[10px] ${c.textMut}`}>{phase.duration}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

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
        <button onClick={() => setShowInputs(!showInputs)}
          className={`flex items-center gap-2 text-xs font-semibold ${c.btnGhost}`}>
          <span>{showInputs ? '▲' : '▼'}</span>
          {showInputs ? 'Hide settings' : 'Show settings'}
        </button>

        {/* Hero */}
        <div className={`rounded-2xl border-2 p-5 ${c.heroBg}`}>
          <h3 className={`text-xl font-bold mb-2 ${c.heroText}`}>Your Playlist Strategy</h3>
          <div className="flex items-center gap-3 mb-3">
            <span className={`text-sm font-semibold ${c.heroSub}`}>{st.from}</span>
            <span className={c.heroText}>→</span>
            <span className={`text-sm font-semibold ${c.heroText}`}>{st.to}</span>
          </div>
          {st.task && <p className={`text-sm ${c.heroSub}`}>For: {st.task}</p>}
        </div>

        {/* Listening Session + Breathing */}
        {renderListeningSession()}
        {sessionActive && renderBreathingGuide()}

        {/* Timeline */}
        {phases.length > 1 && renderTimeline(phases)}

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
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h3 className={`text-sm font-bold ${c.text}`}>🎵 {phase.phase}</h3>
              <div className="flex items-center gap-2">
                {phase.bpm_range && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.bpmBadge}`}>
                    {phase.bpm_range}
                  </span>
                )}
                {phase.duration && <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${c.inset} ${c.textMut}`}>{phase.duration}</span>}
              </div>
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

            {/* Specific Tracks */}
            {phase.specific_tracks?.length > 0 && (
              <div className="mb-3">
                <div className={`text-xs font-semibold ${c.label} mb-1.5`}>🎧 Tracks to Start With</div>
                <div className="space-y-1">
                  {phase.specific_tracks.map((track, i) => (
                    <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs ${c.trackBg}`}>
                      <span className={c.textMut}>{i + 1}.</span>
                      <span className={`font-medium ${c.trackText}`}>{track}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Music Service Links */}
            {(phase.spotify_search || phase.youtube_search) && (
              <div className="flex flex-wrap gap-2">
                {phase.spotify_search && (
                  <a href={makeSpotifyUrl(phase.spotify_search)} target="_blank" rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${c.spotifyBg} ${c.spotifyText} hover:opacity-80 transition-opacity`}>
                    <span>🟢</span> Open in Spotify
                  </a>
                )}
                {phase.youtube_search && (
                  <a href={makeYouTubeUrl(phase.youtube_search)} target="_blank" rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${c.altBg} ${c.textSec} hover:opacity-80 transition-opacity`}>
                    <span>▶️</span> YouTube Music
                  </a>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Audio Settings */}
        {(audio.recommended_volume || audio.headphones) && (
          <div className={`p-5 rounded-2xl border ${c.audioBg}`}>
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-base ${c.audioTitle}`}>🔊</span>
              <h3 className={`text-sm font-bold ${c.audioTitle}`}>Audio Settings</h3>
            </div>
            <div className={`space-y-1.5 text-sm ${c.audioText}`}>
              {audio.recommended_volume && <p><strong>Volume:</strong> {audio.recommended_volume}</p>}
              {audio.headphones && <p><strong>Headphones:</strong> {audio.headphones}</p>}
              {audio.avoid?.length > 0 && <p><strong>Avoid:</strong> {audio.avoid.join(', ')}</p>}
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

        {/* Science */}
        {results.science_note && (
          <div className={`p-5 rounded-2xl border ${c.scienceBg}`}>
            <h3 className={`text-sm font-bold mb-2 ${c.text}`}>💡 Why This Works</h3>
            <p className={`text-sm ${c.textSec}`}>{results.science_note}</p>
          </div>
        )}

        {/* Adjustment Panel */}
        {renderAdjustPanel()}

        {/* Rate & Actions */}
        <div className="space-y-3">
          {/* Rate this playlist — What Worked Learning (#3) */}
          {!rated ? (
            <button onClick={markAsWinner}
              className={`w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 ${c.btnSec}`}>
              <span>👍</span> This playlist worked — remember it
            </button>
          ) : (
            <div className={`py-3 rounded-xl text-xs font-bold text-center border ${c.successBg} ${c.successText}`}>
              ✅ Saved! We'll suggest this combo next time.
            </div>
          )}

          {/* Copy Full / Copy Tracks (#2) */}
          <div className="flex gap-2">
            <div className="flex-1">
              <CopyBtn content={buildCopyText()} label="Copy Full" />
            </div>
            <div className="flex-1">
              <CopyBtn content={buildTrackList()} label="Copy Tracks" />
            </div>
          </div>

          {/* New Playlist / Share Settings (#6) */}
          <div className="flex gap-2">
            <button onClick={regenerate}
              className={`flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 ${c.btn}`}>
              <span>🔄</span> New Playlist
            </button>
            <button onClick={copyShareUrl}
              className={`flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 ${shareCopied ? '' : c.btnSec} ${shareCopied ? c.successBg + ' border ' + c.successText : ''}`}>
              {shareCopied ? <><span>✅</span> Link Copied!</> : <><span>📤</span> Share Settings</>}
            </button>
          </div>
        </div>

        {/* Cross-references */}
        {renderCrossRefs()}
      </div>
    );
  };

  // ══════════════════════════════════════════
  // RENDER: Adjustment Panel
  // ══════════════════════════════════════════
  const renderAdjustPanel = () => (
    <div className={`p-4 rounded-2xl border ${c.adjustBg}`}>
      <button onClick={() => setShowAdjust(!showAdjust)}
        className={`flex items-center gap-2 text-xs font-bold ${c.adjustText} w-full text-left`}>
        <span>{showAdjust ? '▲' : '▼'}</span>
        <span>🎛️ This isn't quite right?</span>
      </button>
      {showAdjust && (
        <div className="mt-3 space-y-3">
          <p className={`text-xs ${c.textMut}`}>Tell us what's off and we'll adjust without starting over</p>
          <div className="flex flex-wrap gap-1.5">
            {ADJUSTMENT_OPTIONS.map(opt => (
              <button key={opt.value}
                onClick={() => setAdjustFeedback(opt.label.replace(/^[^\s]+\s/, ''))}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  adjustFeedback === opt.label.replace(/^[^\s]+\s/, '') ? c.pillActive : c.pillInactive
                }`}>
                {opt.label}
              </button>
            ))}
          </div>
          <input type="text" value={adjustFeedback} onChange={e => setAdjustFeedback(e.target.value)}
            placeholder="Or describe what's not working..."
            className={`w-full px-4 py-2.5 rounded-xl border text-sm ${c.inputBg} outline-none`} />
          <button onClick={submitAdjustment}
            disabled={!adjustFeedback || adjusting}
            className={`w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              !adjustFeedback || adjusting ? c.btnDis : c.btnGold
            }`}>
            {adjusting ? (
              <><span className="animate-spin inline-block">⏳</span> Adjusting...</>
            ) : (
              <><span>🎛️</span> Adjust Playlist</>
            )}
          </button>
        </div>
      )}
    </div>
  );

  // ══════════════════════════════════════════
  // RENDER: Cross-References
  // ══════════════════════════════════════════
  const renderCrossRefs = () => (
    <div className={`p-4 rounded-2xl border ${c.card} mt-2`}>
      <p className={`text-xs font-bold ${c.textMut} uppercase tracking-wide mb-2`}>🔗 Related Tools</p>
      <div className={`space-y-1.5 text-xs ${c.textSec}`}>
        <p>Need more than music? Build a full <a href="/DopamineMenuBuilder" target="_blank" rel="noopener noreferrer" className={c.linkStyle}>Dopamine Menu</a> of feel-good activities.</p>
        <p>Want to track your energy patterns? <a href="/SpoonBudgeter" target="_blank" rel="noopener noreferrer" className={c.linkStyle}>Spoon Budgeter</a> helps allocate what you have.</p>
        <p>Thoughts spiraling? <a href="/SpiralStopper" target="_blank" rel="noopener noreferrer" className={c.linkStyle}>Spiral Stopper</a> breaks the loop so you can think clearly.</p>
      </div>
    </div>
  );

  // ══════════════════════════════════════════
  // RENDER: Error
  // ══════════════════════════════════════════
  const renderError = () => error ? (
    <div className={`mt-4 p-4 ${c.errBg} border rounded-xl flex items-start gap-3`}>
      <span className={`text-base ${c.errText} flex-shrink-0`}>⚠️</span>
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
          <span className={`text-base ${c.histAccent}`}>🎧</span>
          <span className={`text-sm font-bold ${c.text} flex-1`}>Past Playlists</span>
          <span className={`text-xs ${c.textMut}`}>{history.length}</span>
          <span className={`text-xs ${c.textMut}`}>{showHistory ? '▲' : '▼'}</span>
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
                    <span className={`text-xs ${c.textMut} flex-shrink-0`}>{isExp ? '▲' : '▼'}</span>
                  </button>
                  {isExp && (
                    <div className={`px-3 pb-3 border-t ${c.border} flex gap-2`}>
                      <button onClick={() => loadFromHistory(entry)}
                        className={`flex-1 mt-2 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 ${c.btn}`}>
                        <span>🎵</span> View Again
                      </button>
                      <button onClick={() => removeFromHistory(entry.id)}
                        className={`mt-2 px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${c.btnSec} hover:text-red-500`}>
                        <span>🗑️</span>
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
