import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Loader2, AlertCircle, Play, Pause, Square, RotateCcw,
  Clock, Timer, AlertTriangle, Coffee, Droplets, Eye, Armchair,
  Footprints, Copy, Check, Printer, ChevronDown, Zap, BrainCircuit,
  Bookmark, ArrowRight, Volume2, VolumeX
} from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';
import { usePersistentState } from '../hooks/usePersistentState';
import { getToolById } from '../data/tools';

// ════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════
const PRESETS = [
  { label: '25 min', minutes: 25, sub: 'Pomodoro' },
  { label: '45 min', minutes: 45, sub: 'Deep work' },
  { label: '60 min', minutes: 60, sub: 'Full hour' },
  { label: '90 min', minutes: 90, sub: 'Flow state' },
];

const MAX_SNOOZES = 3;

const BODY_ICONS = {
  hydration: Droplets,
  hunger: Coffee,
  posture: Armchair,
  eyes: Eye,
  movement: Footprints,
};

const BODY_LABELS = {
  hydration: 'Hydration',
  hunger: 'Hunger',
  posture: 'Posture',
  eyes: 'Eyes',
  movement: 'Movement',
};

// ════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════
const fmt = (totalSeconds) => {
  const neg = totalSeconds < 0;
  const abs = Math.abs(totalSeconds);
  const h = Math.floor(abs / 3600);
  const m = Math.floor((abs % 3600) / 60);
  const s = abs % 60;
  const pad = (n) => String(n).padStart(2, '0');
  if (h > 0) return `${neg ? '+' : ''}${h}:${pad(m)}:${pad(s)}`;
  return `${neg ? '+' : ''}${pad(m)}:${pad(s)}`;
};

const urgencyLevel = (overtimeMin) => {
  if (overtimeMin <= 0) return 0;    // on time
  if (overtimeMin <= 5) return 1;    // gentle nudge
  if (overtimeMin <= 15) return 2;   // firm
  if (overtimeMin <= 45) return 3;   // urgent
  return 4;                           // critical
};

const NUDGE_MESSAGES = [
  '', // level 0
  "Your session ended. Good stopping point?",
  "You're past your session. Your body is waiting.",
  "Significantly overtime. Stand up. Drink water. Now.",
  "STOP. You've been ignoring your body for too long.",
];

const QUIT_REBUTTALS = [
  "You said {duration}. You're only at {elapsed}. The hard part is almost over.",
  "The urge to quit peaks right before flow kicks in. Give it 5 more minutes.",
  "Future you will be glad present you stuck with it. Stay.",
  "You can stop after this session. Not during it.",
  "Close your eyes for 10 seconds, take a breath, then keep going.",
];

// ════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════
const FocusPocus = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { callToolEndpoint, loading } = useClaudeAPI();
  const toolData = getToolById('FocusPocus');

  // ── Persisted session state ──
  const [sessionActivity, setSessionActivity] = usePersistentState('fp-activity', '');
  const [sessionDurationMin, setSessionDurationMin] = usePersistentState('fp-duration', 25);
  const [sessionStartTime, setSessionStartTime] = usePersistentState('fp-startTime', null);
  const [sessionPausedAt, setSessionPausedAt] = usePersistentState('fp-pausedAt', null);
  const [sessionPausedElapsed, setSessionPausedElapsed] = usePersistentState('fp-pausedElapsed', 0);
  const [originalDurationMin, setOriginalDurationMin] = usePersistentState('fp-origDuration', 25);
  const [snoozeCount, setSnoozeCount] = usePersistentState('fp-snoozes', 0);
  const [phase, setPhase] = usePersistentState('fp-phase', 'setup'); // setup | active | paused | overtime | break

  // ── Ephemeral state ──
  const [customMinutes, setCustomMinutes] = useState('');
  const [missedNeeds, setMissedNeeds] = useState('');
  const [upcomingObligations, setUpcomingObligations] = useState('');
  const [now, setNow] = useState(Date.now());
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState({});
  const [quitRebuttal, setQuitRebuttal] = useState('');
  const [checkedActions, setCheckedActions] = useState({});
  const [soundEnabled, setSoundEnabled] = useState(true);
  const intervalRef = useRef(null);

  // ── Theme ──
  const c = {
    card: isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-stone-200',
    text: isDark ? 'text-zinc-50' : 'text-gray-900',
    textSec: isDark ? 'text-zinc-300' : 'text-gray-600',
    textMuted: isDark ? 'text-zinc-500' : 'text-gray-500',
    input: isDark
      ? 'bg-zinc-700 border-zinc-600 text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500 focus:ring-indigo-500/20'
      : 'bg-white border-stone-300 text-gray-900 placeholder:text-stone-400 focus:border-indigo-500 focus:ring-indigo-500/20',
  };

  // ── Timer calculations ──
  const totalDurationMs = sessionDurationMin * 60 * 1000;

  const elapsedMs = (() => {
    if (!sessionStartTime) return 0;
    if (phase === 'paused') return sessionPausedElapsed;
    return now - sessionStartTime;
  })();

  const remainingMs = totalDurationMs - elapsedMs;
  const remainingSec = Math.ceil(remainingMs / 1000);
  const elapsedMin = Math.floor(elapsedMs / 60000);
  const overtimeMs = Math.max(0, elapsedMs - totalDurationMs);
  const totalOvertimeFromOriginal = Math.max(0, elapsedMs - (originalDurationMin * 60 * 1000));
  const overtimeFromOriginalMin = Math.floor(totalOvertimeFromOriginal / 60000);
  const progress = Math.min(1, elapsedMs / totalDurationMs);
  const currentUrgency = phase === 'overtime' ? urgencyLevel(overtimeFromOriginalMin) : 0;

  // ── Tick ──
  useEffect(() => {
    if (phase === 'active' || phase === 'overtime') {
      intervalRef.current = setInterval(() => setNow(Date.now()), 1000);
      return () => clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [phase]);

  // ── Auto-transition active → overtime ──
  useEffect(() => {
    if (phase === 'active' && remainingMs <= 0) {
      setPhase('overtime');
      // Play a notification sound
      if (soundEnabled) {
        try {
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = 440;
          gain.gain.value = 0.3;
          osc.start();
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
          osc.stop(ctx.currentTime + 1.5);
        } catch (e) { /* audio not available */ }
      }
    }
  }, [phase, remainingMs, soundEnabled]);

  // ── Resume on mount (if session was active) ──
  useEffect(() => {
    if ((phase === 'active' || phase === 'overtime') && sessionStartTime) {
      setNow(Date.now());
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ═══════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════

  const startSession = () => {
    const dur = customMinutes ? parseInt(customMinutes, 10) : sessionDurationMin;
    if (!dur || dur < 1) return;
    setSessionDurationMin(dur);
    setOriginalDurationMin(dur);
    setSessionStartTime(Date.now());
    setSessionPausedAt(null);
    setSessionPausedElapsed(0);
    setSnoozeCount(0);
    setQuitRebuttal('');
    setPhase('active');
    setResults(null);
    setError('');
    setCheckedActions({});
  };

  const pauseSession = () => {
    if (phase === 'active') {
      setSessionPausedElapsed(Date.now() - sessionStartTime);
      setSessionPausedAt(Date.now());
      setPhase('paused');
    }
  };

  const resumeSession = () => {
    if (phase === 'paused') {
      // Set new start time so elapsed picks up where it left off
      setSessionStartTime(Date.now() - sessionPausedElapsed);
      setSessionPausedAt(null);
      setPhase('active');
      setNow(Date.now());
    }
  };

  const handleWantToQuit = () => {
    const idx = Math.floor(Math.random() * QUIT_REBUTTALS.length);
    let msg = QUIT_REBUTTALS[idx];
    msg = msg.replace('{duration}', `${sessionDurationMin} minutes`);
    msg = msg.replace('{elapsed}', `${elapsedMin} minutes`);
    setQuitRebuttal(msg);
    setTimeout(() => setQuitRebuttal(''), 8000);
  };

  const handleSnooze = () => {
    if (snoozeCount >= MAX_SNOOZES) return;
    setSnoozeCount(prev => prev + 1);
    // Extend so there's 5 real minutes from NOW
    const newDuration = Math.ceil(elapsedMs / 60000) + 5;
    setSessionDurationMin(newDuration);
    setPhase('active');
  };

  const handleTakeBreak = async () => {
    setError('');
    try {
      const data = await callToolEndpoint('focus-pocus', {
        activity: sessionActivity,
        plannedMinutes: originalDurationMin,
        actualMinutes: elapsedMin,
        overtimeMinutes: overtimeFromOriginalMin,
        missedNeeds,
        upcomingObligations,
        snoozeCount,
      });
      setResults(data);
      setPhase('break');
    } catch (err) {
      setError(err.message || 'Failed to generate break plan.');
    }
  };

  const forceEndSession = () => {
    // Direct end without API call
    setPhase('break');
    setResults(null);
  };

  const resetAll = () => {
    setPhase('setup');
    setSessionActivity('');
    setSessionDurationMin(25);
    setOriginalDurationMin(25);
    setSessionStartTime(null);
    setSessionPausedAt(null);
    setSessionPausedElapsed(0);
    setSnoozeCount(0);
    setResults(null);
    setError('');
    setQuitRebuttal('');
    setCheckedActions({});
    setCustomMinutes('');
    setMissedNeeds('');
    setUpcomingObligations('');
  };

  // ── Copy / Print ──
  const copyText = useCallback((key, text) => {
    navigator.clipboard.writeText(text);
    setCopied(prev => ({ ...prev, [key]: true }));
    setTimeout(() => setCopied(prev => ({ ...prev, [key]: false })), 2000);
  }, []);

  const printBreakPlan = useCallback(() => {
    if (!results) return;
    const actions = (results.mandatory_actions || []).map((a, i) => `${i + 1}. ${a}`).join('\n');
    const body = [
      results.headline || '',
      '',
      results.message || '',
      '',
      'MANDATORY ACTIONS:',
      actions,
      '',
      'RE-ENTRY PLAN:',
      results.re_entry || '',
      '',
      'NEXT SESSION:',
      results.next_session || '',
    ].join('\n');

    const escaped = body.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Focus Pocus - Break Plan</title>
<style>
body{font-family:-apple-system,'Segoe UI',sans-serif;max-width:600px;margin:40px auto;padding:0 24px;color:#1c1917;line-height:1.7;font-size:14px}
h1{font-size:1.4em;margin-bottom:4px}
.sub{color:#78716c;font-size:0.85em;margin-bottom:20px}
pre{white-space:pre-wrap;word-wrap:break-word;font-family:inherit;margin:0}
@media print{body{margin:16px;font-size:12px}}
</style></head><body>
<h1>🎩 Focus Pocus — Break Plan</h1>
<div class="sub">${sessionActivity} · ${elapsedMin} min session</div>
<pre>${escaped}</pre>
</body></html>`;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(html);
    w.document.close();
    setTimeout(() => { try { w.focus(); w.print(); } catch(e) {} }, 300);
  }, [results, sessionActivity, elapsedMin]);

  const breakPlanText = results ? [
    results.headline, '', results.message, '',
    'ACTIONS:', ...(results.mandatory_actions || []).map((a,i) => `${i+1}. ${a}`),
    '', 'RE-ENTRY:', results.re_entry, '', 'NEXT SESSION:', results.next_session
  ].join('\n') : '';

  // ── Urgency colors ──
  const urgencyColors = (level) => {
    if (level <= 0) return {
      bg: isDark ? 'bg-indigo-900/30' : 'bg-indigo-50',
      border: isDark ? 'border-indigo-700' : 'border-indigo-200',
      text: isDark ? 'text-indigo-300' : 'text-indigo-700',
      timerText: isDark ? 'text-indigo-300' : 'text-indigo-600',
      ring: isDark ? 'stroke-indigo-400' : 'stroke-indigo-500',
      ringBg: isDark ? 'stroke-zinc-700' : 'stroke-stone-200',
    };
    if (level === 1) return {
      bg: isDark ? 'bg-amber-900/20' : 'bg-amber-50',
      border: isDark ? 'border-amber-700' : 'border-amber-200',
      text: isDark ? 'text-amber-300' : 'text-amber-700',
      timerText: isDark ? 'text-amber-300' : 'text-amber-600',
      ring: isDark ? 'stroke-amber-400' : 'stroke-amber-500',
      ringBg: isDark ? 'stroke-zinc-700' : 'stroke-stone-200',
    };
    if (level === 2) return {
      bg: isDark ? 'bg-orange-900/20' : 'bg-orange-50',
      border: isDark ? 'border-orange-700' : 'border-orange-200',
      text: isDark ? 'text-orange-300' : 'text-orange-700',
      timerText: isDark ? 'text-orange-300' : 'text-orange-600',
      ring: isDark ? 'stroke-orange-400' : 'stroke-orange-500',
      ringBg: isDark ? 'stroke-zinc-700' : 'stroke-stone-200',
    };
    if (level === 3) return {
      bg: isDark ? 'bg-red-900/20' : 'bg-red-50',
      border: isDark ? 'border-red-700' : 'border-red-200',
      text: isDark ? 'text-red-300' : 'text-red-700',
      timerText: isDark ? 'text-red-300' : 'text-red-600',
      ring: isDark ? 'stroke-red-400' : 'stroke-red-500',
      ringBg: isDark ? 'stroke-zinc-700' : 'stroke-stone-200',
    };
    return {
      bg: isDark ? 'bg-red-900/40' : 'bg-red-100',
      border: isDark ? 'border-red-600' : 'border-red-300',
      text: isDark ? 'text-red-200' : 'text-red-800',
      timerText: isDark ? 'text-red-200' : 'text-red-700',
      ring: isDark ? 'stroke-red-400' : 'stroke-red-600',
      ringBg: isDark ? 'stroke-zinc-700' : 'stroke-stone-200',
    };
  };

  // ════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════

  // ── SVG ring timer ──
  const RingTimer = ({ seconds, progressVal, urgency }) => {
    const uc = urgencyColors(urgency);
    const radius = 90;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference * (1 - Math.min(1, progressVal));
    const isOvertime = seconds < 0;

    return (
      <div className="relative w-56 h-56 mx-auto">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r={radius} fill="none" strokeWidth="8" className={uc.ringBg} />
          <circle
            cx="100" cy="100" r={radius} fill="none" strokeWidth="8"
            className={`${uc.ring} transition-all duration-1000`}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {isOvertime && (
            <span className={`text-xs font-bold uppercase tracking-wider mb-1 ${uc.text}`}>Overtime</span>
          )}
          <span className={`text-4xl font-mono font-bold tracking-tight ${uc.timerText}`}>
            {fmt(seconds)}
          </span>
          {!isOvertime && (
            <span className={`text-xs ${c.textMuted} mt-1`}>remaining</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div>

      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-5">
        <div>
          <h2 className={`text-2xl font-bold ${c.text}`}>{toolData?.title || 'Focus Pocus'} {toolData?.icon || '🎩'}</h2>
          <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>{toolData?.tagline || 'Lock in your focus session, get pulled out when time is up'}</p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* SETUP PHASE                                        */}
      {/* ═══════════════════════════════════════════════════ */}
      {phase === 'setup' && (
        <div className="space-y-4">
          {/* Activity */}
          <div className={`${c.card} border rounded-2xl shadow-lg p-5 sm:p-6`}>
            <label className={`block text-lg font-bold ${c.text} mb-3`}>
              What are you focusing on?
            </label>
            <input
              type="text"
              value={sessionActivity}
              onChange={e => setSessionActivity(e.target.value)}
              placeholder="e.g., Coding the new dashboard, Studying for chemistry exam, Writing chapter 3…"
              className={`w-full p-3 border rounded-xl outline-none focus:ring-2 transition-colors text-sm ${c.input}`}
            />
          </div>

          {/* Duration */}
          <div className={`${c.card} border rounded-2xl shadow-lg p-5 sm:p-6`}>
            <label className={`block text-sm font-bold ${c.text} mb-3`}>
              <Timer className={`w-4 h-4 inline-block mr-1.5 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
              Session Length
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {PRESETS.map(p => (
                <button
                  key={p.minutes}
                  onClick={() => { setSessionDurationMin(p.minutes); setCustomMinutes(''); }}
                  className={`px-4 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                    sessionDurationMin === p.minutes && !customMinutes
                      ? isDark
                        ? 'border-indigo-500 bg-indigo-900/40 text-indigo-300 ring-1 ring-indigo-500/30'
                        : 'border-indigo-400 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200'
                      : isDark
                        ? 'border-zinc-600 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
                        : 'border-stone-200 text-stone-500 hover:border-stone-400 hover:text-gray-700'
                  }`}
                >
                  <div>{p.label}</div>
                  <div className={`text-[10px] font-medium mt-0.5 ${
                    sessionDurationMin === p.minutes && !customMinutes
                      ? isDark ? 'text-indigo-400' : 'text-indigo-500'
                      : isDark ? 'text-zinc-500' : 'text-stone-400'
                  }`}>{p.sub}</div>
                </button>
              ))}

              {/* Custom */}
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={customMinutes}
                  onChange={e => { setCustomMinutes(e.target.value); if (e.target.value) setSessionDurationMin(parseInt(e.target.value, 10) || 25); }}
                  placeholder="Custom"
                  min="1" max="480"
                  className={`w-20 px-3 py-2.5 border rounded-xl text-sm font-bold outline-none focus:ring-2 transition-colors ${c.input}`}
                />
                <span className={`text-xs font-medium ${c.textMuted}`}>min</span>
              </div>
            </div>
          </div>

          {/* Optional context */}
          <div className={`${c.card} border rounded-2xl shadow-lg p-5 sm:p-6`}>
            <button
              onClick={() => document.getElementById('fp-optional').classList.toggle('hidden')}
              className={`flex items-center gap-2 text-sm font-bold ${c.textSec} w-full`}
            >
              <ChevronDown className="w-4 h-4" />
              Optional: context for smarter breaks
            </button>
            <div id="fp-optional" className="hidden mt-4 space-y-4">
              <div>
                <label className={`block text-sm font-medium ${c.textSec} mb-1.5`}>
                  Upcoming obligations
                </label>
                <input
                  type="text"
                  value={upcomingObligations}
                  onChange={e => setUpcomingObligations(e.target.value)}
                  placeholder="e.g., Meeting at 3pm, Dinner reservation at 7"
                  className={`w-full p-2.5 border rounded-lg text-sm outline-none focus:ring-2 transition-colors ${c.input}`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${c.textSec} mb-1.5`}>
                  Already skipped or missed
                </label>
                <input
                  type="text"
                  value={missedNeeds}
                  onChange={e => setMissedNeeds(e.target.value)}
                  placeholder="e.g., Haven't eaten since breakfast, Skipped gym"
                  className={`w-full p-2.5 border rounded-lg text-sm outline-none focus:ring-2 transition-colors ${c.input}`}
                />
              </div>
            </div>
          </div>

          {/* Start button */}
          <button
            onClick={startSession}
            disabled={!sessionActivity.trim()}
            className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-bold text-lg transition-all shadow-lg ${
              sessionActivity.trim()
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 dark:shadow-indigo-900/40'
                : isDark ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed' : 'bg-stone-200 text-stone-400 cursor-not-allowed'
            }`}
          >
            <Play className="w-5 h-5" />
            Start {sessionDurationMin}-Minute Session
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* ACTIVE / PAUSED PHASE (FocusWall)                  */}
      {/* ═══════════════════════════════════════════════════ */}
      {(phase === 'active' || phase === 'paused') && (
        <div className="space-y-4">
          <div className={`${c.card} border rounded-2xl shadow-lg p-6 sm:p-8 text-center`}>
            {/* Activity label */}
            <div className={`flex items-center justify-center gap-2 mb-6`}>
              <BrainCircuit className={`w-5 h-5 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
              <span className={`text-sm font-bold ${c.text}`}>{sessionActivity}</span>
            </div>

            {/* Ring timer */}
            <RingTimer
              seconds={remainingSec}
              progressVal={progress}
              urgency={0}
            />

            {/* Controls */}
            <div className="flex items-center justify-center gap-3 mt-6">
              {phase === 'active' ? (
                <button
                  onClick={pauseSession}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                    isDark ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600' : 'bg-stone-100 text-gray-600 hover:bg-stone-200'
                  }`}
                >
                  <Pause className="w-4 h-4" />
                  Pause
                </button>
              ) : (
                <button
                  onClick={resumeSession}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
                >
                  <Play className="w-4 h-4" />
                  Resume
                </button>
              )}
              <button
                onClick={handleWantToQuit}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                  isDark ? 'text-zinc-400 hover:text-red-400 hover:bg-red-900/20' : 'text-stone-400 hover:text-red-600 hover:bg-red-50'
                }`}
              >
                <Square className="w-4 h-4" />
                I want to stop
              </button>
            </div>

            {/* Sound toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`mt-3 flex items-center gap-1.5 mx-auto text-xs ${c.textMuted} hover:${c.textSec} transition-colors`}
            >
              {soundEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
              {soundEnabled ? 'Sound on' : 'Sound off'}
            </button>

            {/* Quit rebuttal */}
            {quitRebuttal && (
              <div className={`mt-4 p-4 rounded-xl border-2 text-sm font-medium animate-pulse ${
                isDark ? 'bg-indigo-900/30 border-indigo-700 text-indigo-300' : 'bg-indigo-50 border-indigo-200 text-indigo-700'
              }`}>
                {quitRebuttal}
                <button
                  onClick={forceEndSession}
                  className={`block mx-auto mt-3 text-xs font-bold underline ${isDark ? 'text-zinc-400' : 'text-stone-400'}`}
                >
                  No really, I need to stop
                </button>
              </div>
            )}

            {/* Paused state */}
            {phase === 'paused' && (
              <div className={`mt-4 p-3 rounded-xl text-sm font-medium ${
                isDark ? 'bg-amber-900/20 text-amber-300' : 'bg-amber-50 text-amber-700'
              }`}>
                ⏸ Session paused. Timer is stopped.
              </div>
            )}
          </div>

          {/* Progress footer */}
          <div className={`flex items-center justify-between text-xs ${c.textMuted} px-1`}>
            <span>{elapsedMin} min elapsed</span>
            <span>{sessionDurationMin} min session</span>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* OVERTIME PHASE (HyperfocusInterrupter)              */}
      {/* ═══════════════════════════════════════════════════ */}
      {phase === 'overtime' && (
        <div className="space-y-4">
          {(() => {
            const uc = urgencyColors(currentUrgency);
            return (
              <div className={`${uc.bg} border-2 ${uc.border} rounded-2xl shadow-lg p-6 sm:p-8 text-center transition-colors duration-500`}>
                {/* Urgency icon */}
                <div className="flex justify-center mb-4">
                  {currentUrgency >= 3 ? (
                    <AlertTriangle className={`w-10 h-10 ${uc.text} animate-bounce`} />
                  ) : (
                    <Clock className={`w-10 h-10 ${uc.text}`} />
                  )}
                </div>

                {/* Nudge message */}
                <p className={`text-lg font-bold mb-4 ${uc.text}`}>
                  {NUDGE_MESSAGES[Math.min(currentUrgency, NUDGE_MESSAGES.length - 1)]}
                </p>

                {/* Activity reminder */}
                <p className={`text-sm mb-4 ${c.textSec}`}>
                  You've been working on <strong className={c.text}>{sessionActivity}</strong> for <strong className={c.text}>{elapsedMin} minutes</strong>.
                  {overtimeFromOriginalMin > 0 && <> That's <strong className={uc.text}>{overtimeFromOriginalMin} min past</strong> your planned session.</>}
                </p>

                {/* Ring timer (overtime) */}
                <RingTimer
                  seconds={-Math.floor(overtimeMs / 1000)}
                  progressVal={1}
                  urgency={currentUrgency}
                />

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
                  {/* Take a Break — always visible, primary action */}
                  <button
                    onClick={handleTakeBreak}
                    disabled={loading}
                    className={`flex items-center gap-2 px-8 py-3.5 rounded-xl text-base font-bold transition-all shadow-md ${
                      currentUrgency >= 3
                        ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-200 dark:shadow-red-900/40 animate-pulse'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 dark:shadow-emerald-900/40'
                    }`}
                  >
                    {loading ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> Generating break plan…</>
                    ) : (
                      <><Coffee className="w-5 h-5" /> Take a Break</>
                    )}
                  </button>

                  {/* Snooze — limited uses */}
                  {snoozeCount < MAX_SNOOZES && (
                    <button
                      onClick={handleSnooze}
                      className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-colors ${
                        isDark ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600' : 'bg-stone-100 text-gray-600 hover:bg-stone-200'
                      }`}
                    >
                      <Zap className="w-4 h-4" />
                      5 more min ({MAX_SNOOZES - snoozeCount} left)
                    </button>
                  )}
                  {snoozeCount >= MAX_SNOOZES && (
                    <p className={`text-xs font-bold ${uc.text}`}>
                      No more extensions. Take the break.
                    </p>
                  )}
                </div>

                {error && (
                  <div className={`mt-4 p-3 rounded-xl flex items-start gap-2 text-sm ${isDark ? 'bg-red-900/30 text-red-300' : 'bg-red-50 text-red-700'}`}>
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    {error}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* BREAK PHASE                                        */}
      {/* ═══════════════════════════════════════════════════ */}
      {phase === 'break' && (
        <div className="space-y-4">

          {/* Session summary */}
          <div className={`${c.card} border rounded-2xl shadow-lg p-5 flex items-center justify-between`}>
            <div>
              <p className={`text-sm font-bold ${c.text}`}>{sessionActivity}</p>
              <p className={`text-xs ${c.textMuted}`}>
                {elapsedMin} min total{overtimeFromOriginalMin > 0 && ` (${overtimeFromOriginalMin} min overtime)`}
                {snoozeCount > 0 && ` · ${snoozeCount} snooze${snoozeCount > 1 ? 's' : ''}`}
              </p>
            </div>
            <div className={`text-sm font-bold px-3 py-1.5 rounded-full ${
              overtimeFromOriginalMin === 0
                ? isDark ? 'bg-emerald-900/30 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
                : overtimeFromOriginalMin <= 15
                ? isDark ? 'bg-amber-900/30 text-amber-300' : 'bg-amber-50 text-amber-700'
                : isDark ? 'bg-red-900/30 text-red-300' : 'bg-red-50 text-red-700'
            }`}>
              {overtimeFromOriginalMin === 0 ? 'On Time ✓' : overtimeFromOriginalMin <= 15 ? 'Slightly Over' : 'Way Over'}
            </div>
          </div>

          {/* Claude's break plan */}
          {results ? (
            <>
              {/* Headline */}
              <div className={`${c.card} border rounded-2xl shadow-lg p-6 text-center`}>
                <h3 className={`text-2xl font-bold ${c.text} mb-3`}>{results.headline}</h3>
                <p className={`text-sm ${c.textSec} leading-relaxed max-w-lg mx-auto`}>{results.message}</p>
              </div>

              {/* Mandatory actions */}
              {results.mandatory_actions && results.mandatory_actions.length > 0 && (
                <div className={`${c.card} border rounded-2xl shadow-lg p-5 sm:p-6`}>
                  <h4 className={`text-sm font-bold ${c.text} mb-3 flex items-center gap-2`}>
                    <AlertTriangle className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                    Do these before you continue
                  </h4>
                  <div className="space-y-2">
                    {results.mandatory_actions.map((action, idx) => (
                      <label
                        key={idx}
                        className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                          checkedActions[idx]
                            ? isDark ? 'bg-emerald-900/20 border border-emerald-700' : 'bg-emerald-50 border border-emerald-200'
                            : isDark ? 'bg-zinc-700/50 hover:bg-zinc-700 border border-zinc-600' : 'bg-stone-50 hover:bg-stone-100 border border-stone-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={!!checkedActions[idx]}
                          onChange={() => setCheckedActions(prev => ({ ...prev, [idx]: !prev[idx] }))}
                          className="mt-0.5 w-5 h-5 rounded accent-emerald-600"
                        />
                        <span className={`text-sm ${checkedActions[idx] ? (isDark ? 'text-emerald-300 line-through' : 'text-emerald-700 line-through') : c.text}`}>
                          {action}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Body check */}
              {results.body_check && (
                <div className={`${c.card} border rounded-2xl shadow-lg p-5 sm:p-6`}>
                  <h4 className={`text-sm font-bold ${c.text} mb-3`}>Body Check</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Object.entries(results.body_check).map(([key, val]) => {
                      const Icon = BODY_ICONS[key] || Footprints;
                      return (
                        <div
                          key={key}
                          className={`p-3 rounded-xl border ${isDark ? 'bg-zinc-700/50 border-zinc-600' : 'bg-stone-50 border-stone-200'}`}
                        >
                          <div className={`flex items-center gap-1.5 mb-1`}>
                            <Icon className={`w-3.5 h-3.5 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
                            <span className={`text-xs font-bold ${c.text}`}>{BODY_LABELS[key] || key}</span>
                          </div>
                          <p className={`text-xs ${c.textSec} leading-relaxed`}>{val}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Re-entry + Next session */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {results.re_entry && (
                  <div className={`${c.card} border rounded-2xl shadow-lg p-5`}>
                    <h4 className={`text-sm font-bold ${c.text} mb-2 flex items-center gap-2`}>
                      <Bookmark className={`w-4 h-4 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
                      Re-Entry Plan
                    </h4>
                    <p className={`text-xs ${c.textSec} leading-relaxed`}>{results.re_entry}</p>
                  </div>
                )}
                {results.next_session && (
                  <div className={`${c.card} border rounded-2xl shadow-lg p-5`}>
                    <h4 className={`text-sm font-bold ${c.text} mb-2 flex items-center gap-2`}>
                      <ArrowRight className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                      Next Session
                    </h4>
                    <p className={`text-xs ${c.textSec} leading-relaxed`}>{results.next_session}</p>
                  </div>
                )}
              </div>

              {/* Copy / Print */}
              <div className={`flex items-center gap-2`}>
                <button
                  onClick={() => copyText('break', breakPlanText)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                    copied.break
                      ? 'bg-emerald-600 text-white'
                      : isDark ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600' : 'bg-stone-100 text-gray-600 hover:bg-stone-200'
                  }`}
                >
                  {copied.break ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied.break ? 'Copied' : 'Copy Plan'}
                </button>
                <button
                  onClick={printBreakPlan}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                    isDark ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600' : 'bg-stone-100 text-gray-600 hover:bg-stone-200'
                  }`}
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print
                </button>
              </div>
            </>
          ) : (
            /* Manual end (no API call) — simple break message */
            <div className={`${c.card} border rounded-2xl shadow-lg p-6 text-center`}>
              <h3 className={`text-xl font-bold ${c.text} mb-2`}>Session Ended</h3>
              <p className={`text-sm ${c.textSec} mb-4`}>
                Take a moment to stand up, drink water, and rest your eyes before starting again.
              </p>
            </div>
          )}

          {/* New session */}
          <button
            onClick={resetAll}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 dark:shadow-indigo-900/40"
          >
            <RotateCcw className="w-4 h-4" />
            Start New Session
          </button>
        </div>
      )}
    </div>
  );
};

FocusPocus.displayName = 'FocusPocus';
export default FocusPocus;
