import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';
import { usePersistentState } from '../hooks/usePersistentState';
import { getToolById } from '../data/tools';
import { CopyBtn } from '../components/ActionButtons';

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

const BODY_EMOJIS = { hydration: '💧', hunger: '☕', posture: '🪑', eyes: '👁️', movement: '🚶' };
const BODY_LABELS = { hydration: 'Hydration', hunger: 'Hunger', posture: 'Posture', eyes: 'Eyes', movement: 'Movement' };

const POMODORO_CHAINS = [
  { label: '2×25 + break', sessions: [25, 25], breakMin: 5, longBreakMin: 15 },
  { label: '3×25 + break', sessions: [25, 25, 25], breakMin: 5, longBreakMin: 15 },
  { label: '4×25 + break', sessions: [25, 25, 25, 25], breakMin: 5, longBreakMin: 20 },
  { label: '2×45 + break', sessions: [45, 45], breakMin: 10, longBreakMin: 20 },
];

const DISTRACTION_TYPES = [
  { id: 'phone', emoji: '📱', label: 'Phone' },
  { id: 'person', emoji: '🗣️', label: 'Person' },
  { id: 'thought', emoji: '💭', label: 'Thought' },
  { id: 'noise', emoji: '🔊', label: 'Noise' },
  { id: 'other', emoji: '❓', label: 'Other' },
];

// Feature hints — shown contextually at the right moment
const FEATURE_HINTS = {
  chains: 'Run linked focus sessions with auto-breaks between them',
  distractions: 'Track what pulls you out of focus — see patterns over time',
  score: 'Based on completion, overtime, pauses & distractions. 85+ = excellent',
  patterns: 'After 5 sessions, see your peak hours, top distractors & trends',
  accomplishment: 'Tracking goal completion helps you calibrate session length',
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
  if (overtimeMin <= 0) return 0;
  if (overtimeMin <= 5) return 1;
  if (overtimeMin <= 15) return 2;
  if (overtimeMin <= 45) return 3;
  return 4;
};

const NUDGE_MESSAGES = [
  '',
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

const todayKey = () => new Date().toISOString().slice(0, 10);

const scoreSession = ({ plannedMin, actualMin, overtimeMin, pauseCount, distractionCount }) => {
  let score = 100;
  // Didn't finish → penalty
  if (actualMin < plannedMin * 0.9) score -= 30;
  // Overtime penalty (gentle)
  if (overtimeMin > 0) score -= Math.min(20, overtimeMin);
  // Pause penalty
  score -= pauseCount * 5;
  // Distraction penalty
  score -= distractionCount * 3;
  return Math.max(0, Math.min(100, Math.round(score)));
};

const scoreLabel = (s) => s >= 85 ? 'Excellent' : s >= 70 ? 'Good' : s >= 50 ? 'Fair' : 'Rough';
const scoreColor = (s, isDark) => s >= 85
  ? (isDark ? 'text-emerald-400' : 'text-emerald-600')
  : s >= 70 ? (isDark ? 'text-blue-400' : 'text-blue-600')
  : s >= 50 ? (isDark ? 'text-amber-400' : 'text-amber-600')
  : (isDark ? 'text-red-400' : 'text-red-600');

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
  const [phase, setPhase] = usePersistentState('fp-phase', 'setup');
  // setup | active | paused | overtime | break | chainBreak | patterns

  // ── Persisted history & insights ──
  const [sessionHistory, setSessionHistory] = usePersistentState('fp-history', []);
  const [dailyStreak, setDailyStreak] = usePersistentState('fp-streak', { date: '', count: 0, totalMin: 0 });
  const [bodyInsights, setBodyInsights] = usePersistentState('fp-bodyInsights', {});
  const [hasVisited, setHasVisited] = usePersistentState('fp-visited', false);
  const [dismissedHints, setDismissedHints] = usePersistentState('fp-hints', {});

  // ── Session mode: 'single' or 'chain' ──
  const [sessionMode, setSessionMode] = useState('single');

  // ── Pomodoro chain state ──
  const [chainConfig, setChainConfig] = usePersistentState('fp-chainConfig', null);
  const [chainIndex, setChainIndex] = usePersistentState('fp-chainIdx', 0);

  // ── Distraction log (per session) ──
  const [distractions, setDistractions] = usePersistentState('fp-distractions', []);
  const [pauseCount, setPauseCount] = usePersistentState('fp-pauseCount', 0);

  // ── Break timer ──
  const [breakEndTime, setBreakEndTime] = usePersistentState('fp-breakEnd', null);

  // ── Ephemeral state ──
  const [customMinutes, setCustomMinutes] = useState('');
  const [missedNeeds, setMissedNeeds] = useState('');
  const [upcomingObligations, setUpcomingObligations] = useState('');
  const [now, setNow] = useState(Date.now());
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [quitRebuttal, setQuitRebuttal] = useState('');
  const [checkedActions, setCheckedActions] = useState({});
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showOptional, setShowOptional] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [accomplishment, setAccomplishment] = useState(null); // null | 'yes' | 'partial' | 'no'
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

  // ── Break timer calc ──
  const breakRemainingMs = breakEndTime ? Math.max(0, breakEndTime - now) : 0;
  const breakRemainingSec = Math.ceil(breakRemainingMs / 1000);

  // ── Streak for today ──
  const todaySessions = dailyStreak.date === todayKey() ? dailyStreak.count : 0;
  const todayMinutes = dailyStreak.date === todayKey() ? dailyStreak.totalMin : 0;

  // ── Tick ──
  useEffect(() => {
    if (phase === 'active' || phase === 'overtime' || phase === 'chainBreak') {
      intervalRef.current = setInterval(() => setNow(Date.now()), 1000);
      return () => clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [phase]);

  // ── Auto-transition active → overtime ──
  useEffect(() => {
    if (phase === 'active' && remainingMs <= 0) {
      setPhase('overtime');
      if (soundEnabled) {
        try {
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain); gain.connect(ctx.destination);
          osc.frequency.value = 440; gain.gain.value = 0.3;
          osc.start();
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
          osc.stop(ctx.currentTime + 1.5);
        } catch (e) { /* audio not available */ }
      }
    }
  }, [phase, remainingMs, soundEnabled, setPhase]);

  // ── Chain break auto-advance ──
  useEffect(() => {
    if (phase === 'chainBreak' && breakEndTime && now >= breakEndTime) {
      advanceChain();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, breakEndTime, now]);

  // ── Resume on mount ──
  useEffect(() => {
    if ((phase === 'active' || phase === 'overtime' || phase === 'chainBreak') && sessionStartTime) {
      setNow(Date.now());
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ═══════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════

  const startSession = (durationOverride) => {
    const dur = durationOverride || (customMinutes ? parseInt(customMinutes, 10) : sessionDurationMin);
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
    setDistractions([]);
    setPauseCount(0);
    setAccomplishment(null);
    setBreakEndTime(null);
  };

  const startChain = (chain) => {
    setChainConfig(chain);
    setChainIndex(0);
    startSession(chain.sessions[0]);
  };

  const advanceChain = () => {
    if (!chainConfig) return;
    const nextIdx = chainIndex + 1;
    if (nextIdx < chainConfig.sessions.length) {
      setChainIndex(nextIdx);
      startSession(chainConfig.sessions[nextIdx]);
    } else {
      // Chain complete
      setChainConfig(null);
      setChainIndex(0);
      setPhase('break');
      setBreakEndTime(null);
    }
  };

  const pauseSession = () => {
    if (phase === 'active') {
      setSessionPausedElapsed(Date.now() - sessionStartTime);
      setSessionPausedAt(Date.now());
      setPhase('paused');
      setPauseCount(prev => prev + 1);
    }
  };

  const resumeSession = () => {
    if (phase === 'paused') {
      setSessionStartTime(Date.now() - sessionPausedElapsed);
      setSessionPausedAt(null);
      setPhase('active');
      setNow(Date.now());
    }
  };

  const logDistraction = (type) => {
    setDistractions(prev => [...prev, { type, time: Date.now() }]);
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
    const newDuration = Math.ceil(elapsedMs / 60000) + 5;
    setSessionDurationMin(newDuration);
    setPhase('active');
  };

  const recordSession = useCallback((aiResults) => {
    const entry = {
      id: Date.now(),
      date: new Date().toISOString(),
      activity: sessionActivity,
      plannedMin: originalDurationMin,
      actualMin: elapsedMin,
      overtimeMin: overtimeFromOriginalMin,
      pauseCount,
      distractions: distractions.length,
      distractionTypes: distractions.map(d => d.type),
      snoozeCount,
      score: scoreSession({
        plannedMin: originalDurationMin,
        actualMin: elapsedMin,
        overtimeMin: overtimeFromOriginalMin,
        pauseCount,
        distractionCount: distractions.length,
      }),
      accomplishment,
      bodyCheck: aiResults?.body_check || null,
      chain: chainConfig ? { label: chainConfig.label, index: chainIndex, total: chainConfig.sessions.length } : null,
    };
    setSessionHistory(prev => [entry, ...prev].slice(0, 100));

    // Update daily streak
    const today = todayKey();
    setDailyStreak(prev => {
      if (prev.date === today) {
        return { date: today, count: prev.count + 1, totalMin: prev.totalMin + elapsedMin };
      }
      return { date: today, count: 1, totalMin: elapsedMin };
    });

    // Track body insights
    if (aiResults?.body_check) {
      setBodyInsights(prev => {
        const updated = { ...prev };
        Object.entries(aiResults.body_check).forEach(([key, val]) => {
          if (!updated[key]) updated[key] = [];
          updated[key] = [...updated[key], val].slice(-20);
        });
        return updated;
      });
    }
  }, [sessionActivity, originalDurationMin, elapsedMin, overtimeFromOriginalMin, pauseCount, distractions, snoozeCount, accomplishment, chainConfig, chainIndex, setSessionHistory, setDailyStreak, setBodyInsights]);

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
        distractionCount: distractions.length,
        topDistraction: distractions.length > 0
          ? (() => {
              const counts = {};
              distractions.forEach(d => { counts[d.type] = (counts[d.type] || 0) + 1; });
              return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
            })()
          : '',
      });
      setResults(data);
      recordSession(data);

      // If in a chain, set break timer for chain break
      if (chainConfig && chainIndex < chainConfig.sessions.length - 1) {
        const breakMin = chainConfig.breakMin || 5;
        setBreakEndTime(Date.now() + breakMin * 60 * 1000);
        setPhase('chainBreak');
      } else {
        setPhase('break');
      }
    } catch (err) {
      setError(err.message || 'Failed to generate break plan.');
    }
  };

  const forceEndSession = () => {
    recordSession(null);
    if (chainConfig && chainIndex < chainConfig.sessions.length - 1) {
      const breakMin = chainConfig.breakMin || 5;
      setBreakEndTime(Date.now() + breakMin * 60 * 1000);
      setPhase('chainBreak');
    } else {
      setPhase('break');
      setResults(null);
    }
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
    setDistractions([]);
    setPauseCount(0);
    setAccomplishment(null);
    setChainConfig(null);
    setChainIndex(0);
    setBreakEndTime(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && sessionActivity.trim() && phase === 'setup') {
      e.preventDefault();
      startSession();
    }
  };

  // ── Copy helper ──
  const breakPlanText = results ? [
    results.headline, '', results.message, '',
    'ACTIONS:', ...(results.mandatory_actions || []).map((a, i) => `${i + 1}. ${a}`),
    '', 'RE-ENTRY:', results.re_entry, '', 'NEXT SESSION:', results.next_session,
    '', '\n— Generated by DeftBrain · deftbrain.com'
  ].join('\n') : '';

  const printBreakPlan = useCallback(() => {
    if (!results) return;
    const actions = (results.mandatory_actions || []).map((a, i) => `${i + 1}. ${a}`).join('\n');
    const body = [
      results.headline || '', '', results.message || '', '',
      'MANDATORY ACTIONS:', actions, '', 'RE-ENTRY PLAN:', results.re_entry || '',
      '', 'NEXT SESSION:', results.next_session || '',
    ].join('\n');
    const escaped = body.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Focus Pocus - Break Plan</title>
<style>body{font-family:-apple-system,'Segoe UI',sans-serif;max-width:600px;margin:40px auto;padding:0 24px;color:#1c1917;line-height:1.7;font-size:14px}h1{font-size:1.4em;margin-bottom:4px}.sub{color:#78716c;font-size:0.85em;margin-bottom:20px}pre{white-space:pre-wrap;word-wrap:break-word;font-family:inherit;margin:0}.brand{margin-top:40px;padding-top:16px;border-top:1px solid #e7e5e4;color:#a8a29e;font-size:0.75em;text-align:center}@media print{body{margin:16px;font-size:12px}}</style></head><body>
<h1>🎩 Focus Pocus — Break Plan</h1>
<div class="sub">${sessionActivity} · ${elapsedMin} min session</div>
<pre>${escaped}</pre>
<div class="brand">Generated by DeftBrain · deftbrain.com</div>
</body></html>`;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(html); w.document.close();
    setTimeout(() => { try { w.focus(); w.print(); } catch (e) { } }, 300);
  }, [results, sessionActivity, elapsedMin]);

  // ── Focus patterns data ──
  const getPatterns = useCallback(() => {
    if (sessionHistory.length < 5) return null;
    const recent = sessionHistory.slice(0, 50);
    const avgDuration = Math.round(recent.reduce((s, h) => s + h.actualMin, 0) / recent.length);
    const avgScore = Math.round(recent.reduce((s, h) => s + (h.score || 0), 0) / recent.length);
    const totalMin = recent.reduce((s, h) => s + h.actualMin, 0);

    // Hour distribution
    const hourCounts = {};
    recent.forEach(h => {
      const hr = new Date(h.date).getHours();
      hourCounts[hr] = (hourCounts[hr] || 0) + 1;
    });
    const peakHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];

    // Day distribution
    const dayCounts = {};
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    recent.forEach(h => {
      const day = dayNames[new Date(h.date).getDay()];
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });
    const peakDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0];

    // Distraction analysis
    const allDistractions = {};
    recent.forEach(h => {
      (h.distractionTypes || []).forEach(d => { allDistractions[d] = (allDistractions[d] || 0) + 1; });
    });
    const topDistraction = Object.entries(allDistractions).sort((a, b) => b[1] - a[1])[0];

    // Completion rate
    const completed = recent.filter(h => h.actualMin >= h.plannedMin * 0.9).length;
    const completionRate = Math.round((completed / recent.length) * 100);

    // Accomplishment rate
    const withAccomp = recent.filter(h => h.accomplishment);
    const yesCount = withAccomp.filter(h => h.accomplishment === 'yes').length;

    return {
      totalSessions: recent.length,
      totalMin,
      avgDuration,
      avgScore,
      peakHour: peakHour ? `${peakHour[0]}:00` : null,
      peakDay: peakDay?.[0] || null,
      topDistraction: topDistraction?.[0] || null,
      topDistractionCount: topDistraction?.[1] || 0,
      completionRate,
      accomplishmentRate: withAccomp.length > 0 ? Math.round((yesCount / withAccomp.length) * 100) : null,
    };
  }, [sessionHistory]);

  // ── Urgency colors ──
  const urgencyColors = (level) => {
    const maps = [
      { bg: isDark ? 'bg-indigo-900/30' : 'bg-indigo-50', border: isDark ? 'border-indigo-700' : 'border-indigo-200', text: isDark ? 'text-indigo-300' : 'text-indigo-700', timerText: isDark ? 'text-indigo-300' : 'text-indigo-600', ring: isDark ? 'stroke-indigo-400' : 'stroke-indigo-500', ringBg: isDark ? 'stroke-zinc-700' : 'stroke-stone-200' },
      { bg: isDark ? 'bg-amber-900/20' : 'bg-amber-50', border: isDark ? 'border-amber-700' : 'border-amber-200', text: isDark ? 'text-amber-300' : 'text-amber-700', timerText: isDark ? 'text-amber-300' : 'text-amber-600', ring: isDark ? 'stroke-amber-400' : 'stroke-amber-500', ringBg: isDark ? 'stroke-zinc-700' : 'stroke-stone-200' },
      { bg: isDark ? 'bg-orange-900/20' : 'bg-orange-50', border: isDark ? 'border-orange-700' : 'border-orange-200', text: isDark ? 'text-orange-300' : 'text-orange-700', timerText: isDark ? 'text-orange-300' : 'text-orange-600', ring: isDark ? 'stroke-orange-400' : 'stroke-orange-500', ringBg: isDark ? 'stroke-zinc-700' : 'stroke-stone-200' },
      { bg: isDark ? 'bg-red-900/20' : 'bg-red-50', border: isDark ? 'border-red-700' : 'border-red-200', text: isDark ? 'text-red-300' : 'text-red-700', timerText: isDark ? 'text-red-300' : 'text-red-600', ring: isDark ? 'stroke-red-400' : 'stroke-red-500', ringBg: isDark ? 'stroke-zinc-700' : 'stroke-stone-200' },
      { bg: isDark ? 'bg-red-900/40' : 'bg-red-100', border: isDark ? 'border-red-600' : 'border-red-300', text: isDark ? 'text-red-200' : 'text-red-800', timerText: isDark ? 'text-red-200' : 'text-red-700', ring: isDark ? 'stroke-red-400' : 'stroke-red-600', ringBg: isDark ? 'stroke-zinc-700' : 'stroke-stone-200' },
    ];
    return maps[Math.min(level, maps.length - 1)];
  };

  // ════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════

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
          <circle cx="100" cy="100" r={radius} fill="none" strokeWidth="8"
            className={`${uc.ring} transition-all duration-1000`}
            strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashOffset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {isOvertime && <span className={`text-xs font-bold uppercase tracking-wider mb-1 ${uc.text}`}>Overtime</span>}
          <span className={`text-4xl font-mono font-bold tracking-tight ${uc.timerText}`}>{fmt(seconds)}</span>
          {!isOvertime && <span className={`text-xs ${c.textMuted} mt-1`}>remaining</span>}
        </div>
      </div>
    );
  };

  // ── Stat pill ──
  const Pill = ({ emoji, label, value, color }) => (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${isDark ? 'bg-zinc-700/50 border-zinc-600' : 'bg-stone-50 border-stone-200'}`}>
      <span>{emoji}</span>
      <div>
        <div className={`text-xs ${c.textMuted}`}>{label}</div>
        <div className={`text-sm font-bold ${color || c.text}`}>{value}</div>
      </div>
    </div>
  );

  // ── Dismissible hint ──
  const Hint = ({ id, children }) => {
    if (dismissedHints[id]) return null;
    return (
      <div className={`flex items-start gap-2 px-3 py-2 rounded-lg text-xs ${isDark ? 'bg-indigo-900/20 text-indigo-300 border border-indigo-800/40' : 'bg-indigo-50 text-indigo-700 border border-indigo-100'}`}>
        <span className="flex-shrink-0 mt-0.5">💡</span>
        <span className="flex-1">{children}</span>
        <button onClick={() => setDismissedHints(prev => ({ ...prev, [id]: true }))}
          className="flex-shrink-0 opacity-50 hover:opacity-100 ml-1">✕</button>
      </div>
    );
  };

  return (
    <div>

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className={`text-2xl font-bold ${c.text}`}>{toolData?.title || 'Focus Pocus'} 🎩</h2>
          <p className={`text-sm ${c.textMuted}`}>{toolData?.tagline || 'Lock in your focus session, get pulled out when time is up'}</p>
        </div>
        {todaySessions > 0 && phase === 'setup' && (
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${isDark ? 'bg-indigo-900/30 text-indigo-300' : 'bg-indigo-50 text-indigo-700'}`}>
            🔥 {todaySessions} today · {todayMinutes}m
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* SETUP PHASE                                        */}
      {/* ═══════════════════════════════════════════════════ */}
      {phase === 'setup' && (
        <div className="space-y-4">

          {/* First-visit welcome */}
          {!hasVisited && (
            <div className={`${c.card} border rounded-2xl shadow-lg p-5 sm:p-6`}>
              <h3 className={`text-lg font-bold ${c.text} mb-2`}>Welcome to Focus Pocus 🎩</h3>
              <p className={`text-sm ${c.textSec} mb-4`}>
                A focus timer that tracks your habits and helps you take better breaks.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                {[
                  { emoji: '⏱️', title: 'Timed focus sessions', desc: 'Single or linked Pomodoro chains' },
                  { emoji: '📊', title: 'Focus scoring', desc: 'Track quality, not just time' },
                  { emoji: '📱', title: 'Distraction logging', desc: 'See what pulls you out of flow' },
                  { emoji: '🧠', title: 'AI break plans', desc: 'Context-aware recovery advice' },
                ].map((f, i) => (
                  <div key={i} className={`flex items-start gap-2 p-2.5 rounded-xl ${isDark ? 'bg-zinc-700/50' : 'bg-stone-50'}`}>
                    <span className="text-lg">{f.emoji}</span>
                    <div>
                      <p className={`text-sm font-bold ${c.text}`}>{f.title}</p>
                      <p className={`text-xs ${c.textMuted}`}>{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => setHasVisited(true)}
                className={`text-xs font-bold ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                Got it — let's focus →
              </button>
            </div>
          )}

          {/* Activity */}
          <div className={`${c.card} border rounded-2xl shadow-lg p-5 sm:p-6`}>
            <label className={`block text-lg font-bold ${c.text} mb-3`}>What are you focusing on?</label>
            <input
              type="text" value={sessionActivity}
              onChange={e => setSessionActivity(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g., Coding the new dashboard, Studying for chemistry exam…"
              className={`w-full p-3 border rounded-xl outline-none focus:ring-2 transition-colors text-sm ${c.input}`}
            />
            {sessionActivity.trim() && <p className={`text-xs ${c.textMuted} mt-2`}>Press Enter to start</p>}
          </div>

          {/* Session mode tabs + duration */}
          <div className={`${c.card} border rounded-2xl shadow-lg p-5 sm:p-6`}>
            {/* Mode tabs */}
            <div className="flex gap-1 mb-4">
              {[
                { id: 'single', label: '⏱️ Single Session' },
                { id: 'chain', label: '🔗 Pomodoro Chain' },
              ].map(m => (
                <button key={m.id} onClick={() => setSessionMode(m.id)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    sessionMode === m.id
                      ? isDark ? 'bg-indigo-900/40 text-indigo-300 border border-indigo-500' : 'bg-indigo-50 text-indigo-700 border border-indigo-300'
                      : isDark ? 'text-zinc-400 hover:text-zinc-200 border border-transparent' : 'text-stone-400 hover:text-stone-600 border border-transparent'
                  }`}>
                  {m.label}
                </button>
              ))}
            </div>

            {/* Single session duration */}
            {sessionMode === 'single' && (
              <>
                <label className={`block text-sm font-bold ${c.text} mb-3`}>Session Length</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {PRESETS.map(p => (
                    <button key={p.minutes}
                      onClick={() => { setSessionDurationMin(p.minutes); setCustomMinutes(''); }}
                      className={`px-4 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                        sessionDurationMin === p.minutes && !customMinutes
                          ? isDark ? 'border-indigo-500 bg-indigo-900/40 text-indigo-300 ring-1 ring-indigo-500/30' : 'border-indigo-400 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200'
                          : isDark ? 'border-zinc-600 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200' : 'border-stone-200 text-stone-500 hover:border-stone-400 hover:text-gray-700'
                      }`}>
                      <div>{p.label}</div>
                      <div className={`text-[10px] font-medium mt-0.5 ${
                        sessionDurationMin === p.minutes && !customMinutes
                          ? isDark ? 'text-indigo-400' : 'text-indigo-500' : isDark ? 'text-zinc-500' : 'text-stone-400'
                      }`}>{p.sub}</div>
                    </button>
                  ))}
                  <div className="flex items-center gap-1.5">
                    <input type="number" value={customMinutes}
                      onChange={e => { setCustomMinutes(e.target.value); if (e.target.value) setSessionDurationMin(parseInt(e.target.value, 10) || 25); }}
                      onKeyDown={handleKeyDown}
                      placeholder="Custom" min="1" max="480"
                      className={`w-20 px-3 py-2.5 border rounded-xl text-sm font-bold outline-none focus:ring-2 transition-colors ${c.input}`}
                    />
                    <span className={`text-xs font-medium ${c.textMuted}`}>min</span>
                  </div>
                </div>
              </>
            )}

            {/* Pomodoro chain selection */}
            {sessionMode === 'chain' && (
              <>
                <label className={`block text-sm font-bold ${c.text} mb-2`}>Choose a Chain</label>
                <Hint id="chains">{FEATURE_HINTS.chains}</Hint>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {POMODORO_CHAINS.map((ch, i) => (
                    <button key={i}
                      onClick={() => { if (sessionActivity.trim()) startChain(ch); }}
                      disabled={!sessionActivity.trim()}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isDark ? 'border-zinc-600 hover:border-indigo-500 hover:bg-indigo-900/20' : 'border-stone-200 hover:border-indigo-400 hover:bg-indigo-50'
                      } ${!sessionActivity.trim() ? 'opacity-40 cursor-not-allowed' : ''}`}>
                      <div className={`text-sm font-bold ${c.text}`}>🔗 {ch.label}</div>
                      <div className={`text-xs ${c.textMuted} mt-0.5`}>
                        {ch.sessions.length} sessions · {ch.breakMin}m breaks
                      </div>
                    </button>
                  ))}
                </div>
                {!sessionActivity.trim() && (
                  <p className={`text-xs ${c.textMuted} mt-2`}>↑ Enter your activity above first</p>
                )}
              </>
            )}
          </div>

          {/* Optional context */}
          <div className={`${c.card} border rounded-2xl shadow-lg p-5 sm:p-6`}>
            <button onClick={() => setShowOptional(!showOptional)}
              className={`flex items-center gap-2 text-sm font-bold ${c.textSec} w-full`}>
              <span className={`transition-transform ${showOptional ? 'rotate-180' : ''}`}>▼</span>
              Optional: context for smarter breaks
            </button>
            {showOptional && (
              <div className="mt-4 space-y-4">
                <div>
                  <label className={`block text-sm font-medium ${c.textSec} mb-1.5`}>Upcoming obligations</label>
                  <input type="text" value={upcomingObligations} onChange={e => setUpcomingObligations(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="e.g., Meeting at 3pm, Dinner reservation at 7"
                    className={`w-full p-2.5 border rounded-lg text-sm outline-none focus:ring-2 transition-colors ${c.input}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${c.textSec} mb-1.5`}>Already skipped or missed</label>
                  <input type="text" value={missedNeeds} onChange={e => setMissedNeeds(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="e.g., Haven't eaten since breakfast, Skipped gym"
                    className={`w-full p-2.5 border rounded-lg text-sm outline-none focus:ring-2 transition-colors ${c.input}`}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Start button — only for single mode */}
          {sessionMode === 'single' && (
            <button onClick={() => startSession()}
              disabled={!sessionActivity.trim()}
              className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-bold text-lg transition-all shadow-lg ${
                sessionActivity.trim()
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 dark:shadow-indigo-900/40'
                  : isDark ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed' : 'bg-stone-200 text-stone-400 cursor-not-allowed'
              }`}>
              ▶️ Start {sessionDurationMin}-Minute Session
            </button>
          )}

          {/* 🎵 Sound Architect link */}
          <div className={`${c.card} border rounded-2xl p-4 flex items-center gap-3`}>
            <span className="text-2xl">🎵</span>
            <div className="flex-1">
              <p className={`text-sm font-bold ${c.text}`}>Need focus sounds?</p>
              <p className={`text-xs ${c.textMuted}`}>Pair with Focus Sound Architect for AI-designed soundscapes</p>
            </div>
            <a href="/FocusSoundArchitect" target="_blank" rel="noopener noreferrer"
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${isDark ? 'bg-violet-900/40 text-violet-300 hover:bg-violet-900/60' : 'bg-violet-50 text-violet-700 hover:bg-violet-100'}`}>
              Open →
            </a>
          </div>

          {/* Focus Patterns + History — combined card */}
          {sessionHistory.length > 0 && (
            <div className={`${c.card} border rounded-2xl shadow-lg p-5`}>
              <div className="flex items-center justify-between mb-3">
                <h4 className={`text-sm font-bold ${c.text}`}>📊 Your Focus Data</h4>
                {sessionHistory.length >= 5 && (
                  <button onClick={() => setPhase('patterns')}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${isDark ? 'bg-indigo-900/30 text-indigo-300 hover:bg-indigo-900/50' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}>
                    View Patterns →
                  </button>
                )}
              </div>
              {/* Mini stats row */}
              <div className="flex gap-3 mb-3">
                <div className={`text-center px-3 py-2 rounded-lg ${isDark ? 'bg-zinc-700/50' : 'bg-stone-50'}`}>
                  <div className={`text-lg font-bold ${c.text}`}>{sessionHistory.length}</div>
                  <div className={`text-[10px] ${c.textMuted}`}>sessions</div>
                </div>
                <div className={`text-center px-3 py-2 rounded-lg ${isDark ? 'bg-zinc-700/50' : 'bg-stone-50'}`}>
                  <div className={`text-lg font-bold ${c.text}`}>{Math.round(sessionHistory.reduce((s, h) => s + h.actualMin, 0) / 60)}h</div>
                  <div className={`text-[10px] ${c.textMuted}`}>total</div>
                </div>
                <div className={`text-center px-3 py-2 rounded-lg ${isDark ? 'bg-zinc-700/50' : 'bg-stone-50'}`}>
                  <div className={`text-lg font-bold ${scoreColor(Math.round(sessionHistory.slice(0, 10).reduce((s, h) => s + (h.score || 0), 0) / Math.min(10, sessionHistory.length)), isDark)}`}>
                    {Math.round(sessionHistory.slice(0, 10).reduce((s, h) => s + (h.score || 0), 0) / Math.min(10, sessionHistory.length))}
                  </div>
                  <div className={`text-[10px] ${c.textMuted}`}>avg score</div>
                </div>
              </div>
              {/* Recent sessions */}
              <button onClick={() => setShowHistory(!showHistory)}
                className={`flex items-center gap-2 w-full text-xs font-bold ${c.textMuted}`}>
                Recent ({Math.min(sessionHistory.length, 15)})
                <span className={`ml-auto transition-transform ${showHistory ? 'rotate-180' : ''}`}>▼</span>
              </button>
              {showHistory && (
                <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                  {sessionHistory.slice(0, 15).map(h => (
                    <div key={h.id} className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-zinc-700/50' : 'bg-stone-50'}`}>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold truncate ${c.text}`}>{h.activity}</p>
                        <p className={`text-xs ${c.textMuted}`}>
                          {new Date(h.date).toLocaleDateString()} · {h.actualMin}m
                          {h.chain && ` · 🔗 ${h.chain.index + 1}/${h.chain.total}`}
                          {h.distractions > 0 && ` · ${h.distractions} 📱`}
                        </p>
                      </div>
                      <div className={`text-sm font-bold ${scoreColor(h.score, isDark)}`}>{h.score}</div>
                    </div>
                  ))}
                </div>
              )}
              {sessionHistory.length < 5 && (
                <p className={`text-xs ${c.textMuted} mt-2`}>
                  Complete {5 - sessionHistory.length} more session{5 - sessionHistory.length > 1 ? 's' : ''} to unlock Focus Patterns
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* FOCUS PATTERNS DASHBOARD                            */}
      {/* ═══════════════════════════════════════════════════ */}
      {phase === 'patterns' && (() => {
        const p = getPatterns();
        if (!p) return null;
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className={`text-xl font-bold ${c.text}`}>📊 Focus Patterns</h3>
              <button onClick={() => setPhase('setup')} className={`text-sm font-bold ${c.textMuted} hover:${c.text}`}>← Back</button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Pill emoji="🎯" label="Sessions" value={p.totalSessions} />
              <Pill emoji="⏱️" label="Total time" value={`${Math.round(p.totalMin / 60)}h ${p.totalMin % 60}m`} />
              <Pill emoji="📊" label="Avg score" value={`${p.avgScore} — ${scoreLabel(p.avgScore)}`} color={scoreColor(p.avgScore, isDark)} />
              <Pill emoji="⏰" label="Avg duration" value={`${p.avgDuration} min`} />
              <Pill emoji="✅" label="Completion" value={`${p.completionRate}%`} color={p.completionRate >= 70 ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : (isDark ? 'text-amber-400' : 'text-amber-600')} />
              {p.peakHour && <Pill emoji="🕐" label="Peak hour" value={p.peakHour} />}
              {p.peakDay && <Pill emoji="📅" label="Peak day" value={p.peakDay} />}
              {p.topDistraction && <Pill emoji="📱" label="Top distractor" value={`${p.topDistraction} (${p.topDistractionCount}×)`} />}
              {p.accomplishmentRate !== null && <Pill emoji="🎉" label="Goals met" value={`${p.accomplishmentRate}%`} />}
            </div>

            {/* Body insights */}
            {Object.keys(bodyInsights).length > 0 && (
              <div className={`${c.card} border rounded-2xl shadow-lg p-5`}>
                <h4 className={`text-sm font-bold ${c.text} mb-3`}>🧘 Body Check Patterns</h4>
                <div className="space-y-2">
                  {Object.entries(bodyInsights).map(([key, vals]) => (
                    <div key={key} className={`flex items-center gap-2 text-sm ${c.textSec}`}>
                      <span>{BODY_EMOJIS[key] || '📋'}</span>
                      <span className={`font-bold ${c.text}`}>{BODY_LABELS[key] || key}:</span>
                      <span className="truncate">{vals[vals.length - 1]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Insights */}
            <div className={`${c.card} border rounded-2xl shadow-lg p-5`}>
              <h4 className={`text-sm font-bold ${c.text} mb-3`}>💡 Insights</h4>
              <div className="space-y-2">
                {p.avgDuration < 30 && <p className={`text-sm ${c.textSec}`}>Your average session is {p.avgDuration} min — try extending to 35 min for deeper flow.</p>}
                {p.avgDuration > 60 && <p className={`text-sm ${c.textSec}`}>You average {p.avgDuration} min — impressive stamina. Watch for diminishing returns past 90 min.</p>}
                {p.topDistraction === 'phone' && <p className={`text-sm ${c.textSec}`}>Phone is your #1 distractor. Try putting it in another room during sessions.</p>}
                {p.completionRate < 60 && <p className={`text-sm ${c.textSec}`}>You complete {p.completionRate}% of sessions. Try shorter durations — finishing builds momentum.</p>}
                {p.completionRate >= 90 && <p className={`text-sm ${c.textSec}`}>🔥 {p.completionRate}% completion rate — outstanding discipline.</p>}
                {p.peakHour && <p className={`text-sm ${c.textSec}`}>Your peak focus hour is around {p.peakHour}. Schedule your hardest work here.</p>}
              </div>
            </div>

            <button onClick={() => setPhase('setup')}
              className={`w-full px-6 py-3 rounded-2xl font-bold text-sm transition-colors ${isDark ? 'bg-zinc-700 text-zinc-200 hover:bg-zinc-600' : 'bg-stone-100 text-gray-700 hover:bg-stone-200'}`}>
              ← Back to Setup
            </button>
          </div>
        );
      })()}

      {/* ═══════════════════════════════════════════════════ */}
      {/* ACTIVE / PAUSED PHASE                               */}
      {/* ═══════════════════════════════════════════════════ */}
      {(phase === 'active' || phase === 'paused') && (
        <div className="space-y-4">
          <div className={`${c.card} border rounded-2xl shadow-lg p-6 sm:p-8 text-center`}>
            {/* Chain progress */}
            {chainConfig && (
              <div className={`flex items-center justify-center gap-2 mb-4`}>
                {chainConfig.sessions.map((_, i) => (
                  <div key={i} className={`w-8 h-1.5 rounded-full ${
                    i < chainIndex ? (isDark ? 'bg-emerald-500' : 'bg-emerald-500')
                    : i === chainIndex ? (isDark ? 'bg-indigo-400' : 'bg-indigo-500')
                    : (isDark ? 'bg-zinc-600' : 'bg-stone-300')
                  }`} />
                ))}
                <span className={`text-xs font-bold ${c.textMuted} ml-2`}>
                  🔗 {chainIndex + 1}/{chainConfig.sessions.length}
                </span>
              </div>
            )}

            {/* Activity label */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className={isDark ? 'text-indigo-400' : 'text-indigo-600'}>🧠</span>
              <span className={`text-sm font-bold ${c.text}`}>{sessionActivity}</span>
            </div>

            <RingTimer seconds={remainingSec} progressVal={progress} urgency={0} />

            {/* Controls */}
            <div className="flex items-center justify-center gap-3 mt-6">
              {phase === 'active' ? (
                <button onClick={pauseSession}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors ${isDark ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600' : 'bg-stone-100 text-gray-600 hover:bg-stone-200'}`}>
                  ⏸ Pause
                </button>
              ) : (
                <button onClick={resumeSession}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors">
                  ▶️ Resume
                </button>
              )}
              <button onClick={handleWantToQuit}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors ${isDark ? 'text-zinc-400 hover:text-red-400 hover:bg-red-900/20' : 'text-stone-400 hover:text-red-600 hover:bg-red-50'}`}>
                ⏹ I want to stop
              </button>
            </div>

            {/* Distraction logger — always-visible bar */}
            <div className={`mt-4 p-3 rounded-xl ${isDark ? 'bg-zinc-700/30' : 'bg-stone-50'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-bold ${c.textSec}`}>📱 Distraction Log</span>
                {distractions.length > 0 && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isDark ? 'bg-amber-900/30 text-amber-300' : 'bg-amber-50 text-amber-700'}`}>
                    {distractions.length} logged
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {DISTRACTION_TYPES.map(d => (
                  <button key={d.id} onClick={() => logDistraction(d.id)}
                    className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-lg text-xs transition-colors ${isDark ? 'hover:bg-zinc-600' : 'hover:bg-stone-200'}`}>
                    <span className="text-base">{d.emoji}</span>
                    <span className={c.textMuted}>{d.label}</span>
                  </button>
                ))}
              </div>
              {distractions.length === 0 && !dismissedHints.distractions && (
                <p className={`text-xs ${c.textMuted} mt-1.5`}>💡 Tap when something pulls your focus — see patterns over time</p>
              )}
            </div>

            {/* Sound toggle */}
            <button onClick={() => setSoundEnabled(!soundEnabled)}
              className={`mt-3 flex items-center gap-1.5 mx-auto text-xs ${c.textMuted}`}>
              {soundEnabled ? '🔊 Sound on' : '🔇 Sound off'}
            </button>

            {/* Quit rebuttal */}
            {quitRebuttal && (
              <div className={`mt-4 p-4 rounded-xl border-2 text-sm font-medium animate-pulse ${isDark ? 'bg-indigo-900/30 border-indigo-700 text-indigo-300' : 'bg-indigo-50 border-indigo-200 text-indigo-700'}`}>
                {quitRebuttal}
                <button onClick={forceEndSession}
                  className={`block mx-auto mt-3 text-xs font-bold underline ${isDark ? 'text-zinc-400' : 'text-stone-400'}`}>
                  No really, I need to stop
                </button>
              </div>
            )}

            {phase === 'paused' && (
              <div className={`mt-4 p-3 rounded-xl text-sm font-medium ${isDark ? 'bg-amber-900/20 text-amber-300' : 'bg-amber-50 text-amber-700'}`}>
                ⏸ Session paused. Timer is stopped.
              </div>
            )}
          </div>

          <div className={`flex items-center justify-between text-xs ${c.textMuted} px-1`}>
            <span>{elapsedMin} min elapsed</span>
            <span>{sessionDurationMin} min session {distractions.length > 0 && `· ${distractions.length} distractions`}</span>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* OVERTIME PHASE                                      */}
      {/* ═══════════════════════════════════════════════════ */}
      {phase === 'overtime' && (() => {
        const uc = urgencyColors(currentUrgency);
        return (
          <div className="space-y-4">
            <div className={`${uc.bg} border-2 ${uc.border} rounded-2xl shadow-lg p-6 sm:p-8 text-center transition-colors duration-500`}>
              <div className="flex justify-center mb-4">
                <span className={`text-4xl ${currentUrgency >= 3 ? 'animate-bounce' : ''}`}>
                  {currentUrgency >= 3 ? '⚠️' : '⏰'}
                </span>
              </div>
              <p className={`text-lg font-bold mb-4 ${uc.text}`}>
                {NUDGE_MESSAGES[Math.min(currentUrgency, NUDGE_MESSAGES.length - 1)]}
              </p>
              <p className={`text-sm mb-4 ${c.textSec}`}>
                You've been working on <strong className={c.text}>{sessionActivity}</strong> for <strong className={c.text}>{elapsedMin} minutes</strong>.
                {overtimeFromOriginalMin > 0 && <> That's <strong className={uc.text}>{overtimeFromOriginalMin} min past</strong> your planned session.</>}
              </p>
              <RingTimer seconds={-Math.floor(overtimeMs / 1000)} progressVal={1} urgency={currentUrgency} />

              {/* Distraction count during overtime */}
              {distractions.length > 0 && (
                <p className={`text-xs mt-2 ${c.textMuted}`}>📱 {distractions.length} distraction{distractions.length > 1 ? 's' : ''} logged</p>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
                <button onClick={handleTakeBreak} disabled={loading}
                  className={`flex items-center gap-2 px-8 py-3.5 rounded-xl text-base font-bold transition-all shadow-md ${
                    currentUrgency >= 3
                      ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-200 dark:shadow-red-900/40 animate-pulse'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 dark:shadow-emerald-900/40'
                  }`}>
                  {loading ? <>⏳ Generating break plan…</> : <>☕ Take a Break</>}
                </button>
                {snoozeCount < MAX_SNOOZES && (
                  <button onClick={handleSnooze}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-colors ${isDark ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600' : 'bg-stone-100 text-gray-600 hover:bg-stone-200'}`}>
                    ⚡ 5 more min ({MAX_SNOOZES - snoozeCount} left)
                  </button>
                )}
                {snoozeCount >= MAX_SNOOZES && (
                  <p className={`text-xs font-bold ${uc.text}`}>No more extensions. Take the break.</p>
                )}
              </div>
              {error && (
                <div className={`mt-4 p-3 rounded-xl flex items-start gap-2 text-sm ${isDark ? 'bg-red-900/30 text-red-300' : 'bg-red-50 text-red-700'}`}>
                  ⚠️ {error}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ═══════════════════════════════════════════════════ */}
      {/* CHAIN BREAK PHASE                                   */}
      {/* ═══════════════════════════════════════════════════ */}
      {phase === 'chainBreak' && (
        <div className="space-y-4">
          <div className={`${c.card} border rounded-2xl shadow-lg p-6 text-center`}>
            {/* Chain progress */}
            <div className="flex items-center justify-center gap-2 mb-4">
              {chainConfig?.sessions.map((_, i) => (
                <div key={i} className={`w-10 h-2 rounded-full ${
                  i <= chainIndex ? (isDark ? 'bg-emerald-500' : 'bg-emerald-500') : (isDark ? 'bg-zinc-600' : 'bg-stone-300')
                }`} />
              ))}
            </div>
            <h3 className={`text-xl font-bold ${c.text} mb-2`}>
              ☕ Break Time — {chainIndex + 1}/{chainConfig?.sessions.length} complete
            </h3>
            <p className={`text-sm ${c.textSec} mb-4`}>
              Next session starts in {fmt(breakRemainingSec)}
            </p>

            {/* Break countdown ring */}
            {breakEndTime && (() => {
              const totalBreakMs = (chainConfig?.breakMin || 5) * 60 * 1000;
              const breakElapsed = totalBreakMs - breakRemainingMs;
              const breakProgress = Math.min(1, breakElapsed / totalBreakMs);
              return <RingTimer seconds={breakRemainingSec} progressVal={breakProgress} urgency={0} />;
            })()}

            <div className="flex items-center justify-center gap-3 mt-4">
              <button onClick={advanceChain}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors">
                ⏭ Skip break, start next
              </button>
              <button onClick={() => { setChainConfig(null); setChainIndex(0); setPhase('break'); }}
                className={`px-5 py-3 rounded-xl text-sm font-bold transition-colors ${isDark ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600' : 'bg-stone-100 text-gray-600 hover:bg-stone-200'}`}>
                End chain
              </button>
            </div>
          </div>

          {/* Show break results if available */}
          {results && (
            <div className={`${c.card} border rounded-2xl shadow-lg p-5`}>
              <h4 className={`text-sm font-bold ${c.text} mb-2`}>{results.headline}</h4>
              <p className={`text-xs ${c.textSec}`}>{results.message}</p>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* BREAK PHASE                                        */}
      {/* ═══════════════════════════════════════════════════ */}
      {phase === 'break' && (
        <div className="space-y-4">

          {/* Session summary with score */}
          <div className={`${c.card} border rounded-2xl shadow-lg p-5`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-bold ${c.text}`}>{sessionActivity}</p>
                <p className={`text-xs ${c.textMuted}`}>
                  {elapsedMin} min total{overtimeFromOriginalMin > 0 && ` (${overtimeFromOriginalMin} min overtime)`}
                  {snoozeCount > 0 && ` · ${snoozeCount} snooze${snoozeCount > 1 ? 's' : ''}`}
                  {distractions.length > 0 && ` · ${distractions.length} distraction${distractions.length > 1 ? 's' : ''}`}
                </p>
              </div>
              {sessionHistory.length > 0 && (() => {
                const s = sessionHistory[0]?.score;
                return s != null ? (
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${scoreColor(s, isDark)}`}>{s}</div>
                    <div className={`text-[10px] font-bold ${scoreColor(s, isDark)}`}>{scoreLabel(s)}</div>
                  </div>
                ) : null;
              })()}
            </div>

            {/* Score explanation — shown on first few sessions */}
            {sessionHistory.length <= 3 && sessionHistory.length > 0 && (
              <Hint id="score">
                {FEATURE_HINTS.score}
              </Hint>
            )}

            {/* Distraction breakdown if any */}
            {distractions.length > 0 && (
              <div className={`mt-3 pt-3 border-t ${isDark ? 'border-zinc-700' : 'border-stone-200'}`}>
                <p className={`text-xs font-bold ${c.textMuted} mb-1.5`}>Distraction breakdown</p>
                <div className="flex gap-2">
                  {(() => {
                    const counts = {};
                    distractions.forEach(d => { counts[d.type] = (counts[d.type] || 0) + 1; });
                    return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([type, count]) => {
                      const dt = DISTRACTION_TYPES.find(t => t.id === type);
                      return (
                        <span key={type} className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs ${isDark ? 'bg-zinc-700/50' : 'bg-stone-50'}`}>
                          {dt?.emoji} {count}×
                        </span>
                      );
                    });
                  })()}
                </div>
              </div>
            )}

            {/* Accomplishment check */}
            <div className={`mt-3 pt-3 border-t ${isDark ? 'border-zinc-700' : 'border-stone-200'}`}>
              <p className={`text-xs font-bold ${c.textMuted} mb-2`}>Did you accomplish what you set out to do?</p>
              <div className="flex gap-2">
                {[{ v: 'yes', l: '✅ Yes' }, { v: 'partial', l: '🟡 Partially' }, { v: 'no', l: '❌ No' }].map(opt => (
                  <button key={opt.v}
                    onClick={() => {
                      setAccomplishment(opt.v);
                      setSessionHistory(prev => {
                        if (prev.length === 0) return prev;
                        const updated = [...prev];
                        updated[0] = { ...updated[0], accomplishment: opt.v };
                        return updated;
                      });
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                      accomplishment === opt.v
                        ? isDark ? 'border-indigo-500 bg-indigo-900/40 text-indigo-300' : 'border-indigo-400 bg-indigo-50 text-indigo-700'
                        : isDark ? 'border-zinc-600 text-zinc-400 hover:border-zinc-500' : 'border-stone-200 text-stone-500 hover:border-stone-400'
                    }`}>
                    {opt.l}
                  </button>
                ))}
              </div>
              {sessionHistory.length <= 3 && (
                <Hint id="accomplishment">
                  {FEATURE_HINTS.accomplishment}
                </Hint>
              )}
            </div>
          </div>

          {/* Claude's break plan */}
          {results ? (
            <>
              <div className={`${c.card} border rounded-2xl shadow-lg p-6 text-center`}>
                <h3 className={`text-2xl font-bold ${c.text} mb-3`}>{results.headline}</h3>
                <p className={`text-sm ${c.textSec} leading-relaxed max-w-lg mx-auto`}>{results.message}</p>
              </div>

              {results.mandatory_actions?.length > 0 && (
                <div className={`${c.card} border rounded-2xl shadow-lg p-5 sm:p-6`}>
                  <h4 className={`text-sm font-bold ${c.text} mb-3 flex items-center gap-2`}>
                    <span className={isDark ? 'text-amber-400' : 'text-amber-600'}>⚠️</span> Do these before you continue
                  </h4>
                  <div className="space-y-2">
                    {results.mandatory_actions.map((action, idx) => (
                      <label key={idx}
                        className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                          checkedActions[idx]
                            ? isDark ? 'bg-emerald-900/20 border border-emerald-700' : 'bg-emerald-50 border border-emerald-200'
                            : isDark ? 'bg-zinc-700/50 hover:bg-zinc-700 border border-zinc-600' : 'bg-stone-50 hover:bg-stone-100 border border-stone-200'
                        }`}>
                        <input type="checkbox" checked={!!checkedActions[idx]}
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

              {results.body_check && (
                <div className={`${c.card} border rounded-2xl shadow-lg p-5 sm:p-6`}>
                  <h4 className={`text-sm font-bold ${c.text} mb-3`}>🧘 Body Check</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Object.entries(results.body_check).map(([key, val]) => (
                      <div key={key} className={`p-3 rounded-xl border ${isDark ? 'bg-zinc-700/50 border-zinc-600' : 'bg-stone-50 border-stone-200'}`}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-sm">{BODY_EMOJIS[key] || '📋'}</span>
                          <span className={`text-xs font-bold ${c.text}`}>{BODY_LABELS[key] || key}</span>
                        </div>
                        <p className={`text-xs ${c.textSec} leading-relaxed`}>{val}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {results.re_entry && (
                  <div className={`${c.card} border rounded-2xl shadow-lg p-5`}>
                    <h4 className={`text-sm font-bold ${c.text} mb-2 flex items-center gap-2`}>
                      <span className={isDark ? 'text-indigo-400' : 'text-indigo-600'}>🔖</span> Re-Entry Plan
                    </h4>
                    <p className={`text-xs ${c.textSec} leading-relaxed`}>{results.re_entry}</p>
                  </div>
                )}
                {results.next_session && (
                  <div className={`${c.card} border rounded-2xl shadow-lg p-5`}>
                    <h4 className={`text-sm font-bold ${c.text} mb-2 flex items-center gap-2`}>
                      <span className={isDark ? 'text-emerald-400' : 'text-emerald-600'}>→</span> Next Session
                    </h4>
                    <p className={`text-xs ${c.textSec} leading-relaxed`}>{results.next_session}</p>
                  </div>
                )}
              </div>

              {/* Copy / Print */}
              <div className="flex items-center gap-2">
                <CopyBtn content={breakPlanText} label="Copy Plan" />
                <button onClick={printBreakPlan}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${isDark ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600' : 'bg-stone-100 text-gray-600 hover:bg-stone-200'}`}>
                  🖨️ Print
                </button>
              </div>
            </>
          ) : (
            <div className={`${c.card} border rounded-2xl shadow-lg p-6 text-center`}>
              <h3 className={`text-xl font-bold ${c.text} mb-2`}>Session Ended</h3>
              <p className={`text-sm ${c.textSec} mb-4`}>
                Take a moment to stand up, drink water, and rest your eyes before starting again.
              </p>
            </div>
          )}

          {/* New session */}
          <button onClick={resetAll}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 dark:shadow-indigo-900/40">
            🔄 Start New Session
          </button>

          {/* Cross-references */}
          <div className={`${c.card} border rounded-2xl p-4`}>
            <p className={`text-xs font-bold ${c.textMuted} mb-2`}>🔗 Related tools</p>
            <div className="flex flex-wrap gap-2">
              {[
                { name: 'Focus Sound Architect', slug: 'FocusSoundArchitect', emoji: '🎵' },
                { name: 'Brain Dump Structurer', slug: 'BrainDumpStructurer', emoji: '🧠' },
                { name: 'Task Avalanche Breaker', slug: 'TaskAvalancheBreaker', emoji: '🏔️' },
              ].map(t => (
                <a key={t.slug} href={`/${t.slug}`} target="_blank" rel="noopener noreferrer"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${isDark ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>
                  {t.emoji} {t.name}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

FocusPocus.displayName = 'FocusPocus';
export default FocusPocus;
