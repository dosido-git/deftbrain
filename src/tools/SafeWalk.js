import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Loader2, Plus, X, Check, ChevronDown, ChevronUp, AlertCircle, Copy, Trash2, Shield, Phone, PhoneCall, PhoneOff, MapPin, Flashlight, Volume2, VolumeX, Clock, Navigation, Settings, CheckCircle2, AlertTriangle, Siren, User, Pause, Play, Timer } from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';
import { usePersistentState } from '../hooks/usePersistentState';

// ════════════════════════════════════════════════════════════
// THEME — darker walking-tab palette for night use
// ════════════════════════════════════════════════════════════
const useColors = () => {
  const { theme } = useTheme();
  const d = theme === 'dark';
  return {
    d,
    bg: d ? 'bg-zinc-900' : 'bg-stone-50',
    bgCard: d ? 'bg-zinc-800' : 'bg-white',
    bgInset: d ? 'bg-zinc-700' : 'bg-stone-100',
    bgHover: d ? 'hover:bg-zinc-700' : 'hover:bg-stone-50',
    text: d ? 'text-zinc-50' : 'text-stone-900',
    textSec: d ? 'text-zinc-400' : 'text-stone-600',
    textMut: d ? 'text-zinc-500' : 'text-stone-400',
    border: d ? 'border-zinc-700' : 'border-stone-200',
    accent: d ? 'text-emerald-400' : 'text-emerald-600',
    accentBg: d ? 'bg-emerald-500/20 border-emerald-600/40' : 'bg-emerald-50 border-emerald-200',
    input: d ? 'bg-zinc-700 border-zinc-600 text-zinc-100 placeholder-zinc-500 focus:border-emerald-500' : 'bg-white border-stone-300 text-stone-900 placeholder-stone-400 focus:border-emerald-500',
    btn: d ? 'bg-emerald-500 hover:bg-emerald-400 text-zinc-900 font-bold' : 'bg-stone-800 hover:bg-stone-900 text-white font-bold',
    btnSec: d ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-200' : 'bg-stone-100 hover:bg-stone-200 text-stone-700',
    btnGhost: d ? 'text-zinc-400 hover:text-zinc-100' : 'text-stone-500 hover:text-stone-800',
    btnDis: d ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed' : 'bg-stone-200 text-stone-400 cursor-not-allowed',
    tabActive: d ? 'bg-emerald-500 text-zinc-900' : 'bg-stone-800 text-white',
    tabInactive: d ? 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 border-zinc-700' : 'bg-white text-stone-500 hover:text-stone-700 border-stone-200',
    pillActive: d ? 'border-emerald-500 bg-emerald-900/30 text-emerald-300' : 'border-emerald-400 bg-emerald-50 text-emerald-700',
    pillInactive: d ? 'border-zinc-600 text-zinc-400' : 'border-stone-200 text-stone-500',
    successBg: d ? 'bg-emerald-900/30 border-emerald-700' : 'bg-emerald-50 border-emerald-200',
    successText: d ? 'text-emerald-300' : 'text-emerald-800',
    warnBg: d ? 'bg-amber-900/30 border-amber-700' : 'bg-amber-50 border-amber-200',
    warnText: d ? 'text-amber-300' : 'text-amber-800',
    dangerBg: d ? 'bg-red-900/30 border-red-700' : 'bg-red-50 border-red-200',
    dangerText: d ? 'text-red-300' : 'text-red-800',
    errBg: d ? 'bg-red-900/30 border-red-700' : 'bg-red-50 border-red-200',
    errText: d ? 'text-red-300' : 'text-red-700',
    infoBg: d ? 'bg-sky-900/30 border-sky-700' : 'bg-sky-50 border-sky-200',
    infoText: d ? 'text-sky-300' : 'text-sky-800',
    // Walking tab (high contrast for night use)
    walkBg: d ? 'bg-zinc-950' : 'bg-slate-900',
    walkCard: d ? 'bg-zinc-900' : 'bg-slate-800',
    walkText: 'text-white',
    walkTextSec: d ? 'text-zinc-400' : 'text-slate-400',
    walkBorder: d ? 'border-zinc-700' : 'border-slate-700',
    walkBtn: d ? 'bg-zinc-800 hover:bg-zinc-700 text-white' : 'bg-slate-700 hover:bg-slate-600 text-white',
  };
};

// ════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════
const TIME_OPTIONS = [
  { id: 'now', label: '☀️ Right now' },
  { id: 'tonight', label: '🌆 Tonight' },
  { id: 'late', label: '🌙 Late night' },
  { id: 'early', label: '🌅 Early morning' },
];

const AREA_OPTIONS = [
  { id: 'well_lit', label: '💡 Well-lit' },
  { id: 'poorly_lit', label: '🌑 Poorly lit' },
  { id: 'campus', label: '🏫 Near campus' },
  { id: 'residential', label: '🏘️ Residential' },
  { id: 'downtown', label: '🏙️ Downtown' },
  { id: 'industrial', label: '🏭 Industrial/quiet' },
  { id: 'park', label: '🌳 Park/trail' },
  { id: 'garage', label: '🅿️ Parking garage' },
];

const DURATION_OPTIONS = [
  { id: '5-10', label: '5-10 min' },
  { id: '10-20', label: '10-20 min' },
  { id: '20-30', label: '20-30 min' },
  { id: '30+', label: '30+ min' },
];

const WALK_TIMER_PRESETS = [
  { min: 5, label: '5m' },
  { min: 10, label: '10m' },
  { min: 15, label: '15m' },
  { min: 20, label: '20m' },
  { min: 30, label: '30m' },
];

const fmtTime = (s) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

// ════════════════════════════════════════════════════════════
// AUDIO HELPERS
// ════════════════════════════════════════════════════════════
let audioCtx = null;
const getAudioCtx = () => {
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
};

const createRingtone = () => {
  const ctx = getAudioCtx();
  const gain = ctx.createGain();
  gain.gain.value = 0.3;
  gain.connect(ctx.destination);

  const osc1 = ctx.createOscillator();
  osc1.frequency.value = 440;
  osc1.type = 'sine';
  osc1.connect(gain);

  const osc2 = ctx.createOscillator();
  osc2.frequency.value = 480;
  osc2.type = 'sine';
  osc2.connect(gain);

  // Pulsing pattern via gain scheduling
  const now = ctx.currentTime;
  for (let i = 0; i < 20; i++) {
    const t = now + i * 3;
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.setValueAtTime(0, t + 1);
  }

  osc1.start(); osc2.start();
  return { stop: () => { try { osc1.stop(); osc2.stop(); gain.disconnect(); } catch {} } };
};

const createAlarm = () => {
  const ctx = getAudioCtx();
  const gain = ctx.createGain();
  gain.gain.value = 0.8;
  gain.connect(ctx.destination);

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.connect(gain);

  // Siren sweep 800-1200Hz
  const now = ctx.currentTime;
  for (let i = 0; i < 120; i++) {
    const t = now + i * 0.5;
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.linearRampToValueAtTime(1200, t + 0.25);
    osc.frequency.linearRampToValueAtTime(800, t + 0.5);
  }

  osc.start();
  return { stop: () => { try { osc.stop(); gain.disconnect(); } catch {} } };
};

// ════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════
const SafeWalk = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const c = useColors();

  // Tabs
  const [activeTab, setActiveTab] = useState('plan');

  // ── Persistent state ──
  const [contacts, setContacts] = usePersistentState('safewalk-contacts', []);
  const [savedRoutes, setSavedRoutes] = usePersistentState('safewalk-routes', []);
  const [walkTimer, setWalkTimer] = usePersistentState('safewalk-active-timer', null);

  // ── Plan tab ──
  const [route, setRoute] = useState('');
  const [timeOfDay, setTimeOfDay] = useState('');
  const [areaDesc, setAreaDesc] = useState([]);
  const [walkDuration, setWalkDuration] = useState('');
  const [concerns, setConcerns] = useState('');
  const [assessResult, setAssessResult] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    overview: true, watch: true, checklist: false, routes: false, before: false,
  });
  const [checkedItems, setCheckedItems] = useState({});

  // ── Walking tab ──
  const [selectedTimerMin, setSelectedTimerMin] = useState(15);
  const [customTimerMin, setCustomTimerMin] = useState('');
  const [timerExpired, setTimerExpired] = useState(false);

  // ── Overlays ──
  const [fakeCallState, setFakeCallState] = useState(null); // null | 'ringing' | 'active'
  const [fakeCallSeconds, setFakeCallSeconds] = useState(0);
  const [emergencyActive, setEmergencyActive] = useState(false);
  const [emergencyEscalated, setEmergencyEscalated] = useState(false);
  const [emergencyCountdown, setEmergencyCountdown] = useState(15);
  const [emergencyLocation, setEmergencyLocation] = useState('');
  const [emergencyAlertCopied, setEmergencyAlertCopied] = useState(false);
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // ── Settings ──
  const [newContactName, setNewContactName] = useState('');
  const [newContactRelation, setNewContactRelation] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');

  // Shared
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [locationMsg, setLocationMsg] = useState('');

  // Refs
  const [pendingLocationMsg, setPendingLocationMsg] = useState('');

  // Refs
  const ringtoneRef = useRef(null);
  const alarmRef = useRef(null);
  const flashStreamRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const fakeCallIntervalRef = useRef(null);
  const redialTimeoutRef = useRef(null);
  const emergencyIntervalRef = useRef(null);
  const hasReconciled = useRef(false);

  // ══════════════════════════════════════════
  // TIMER LOGIC (persistent, reconcile on mount)
  // ══════════════════════════════════════════
  useEffect(() => {
    if (hasReconciled.current || !walkTimer) return;
    hasReconciled.current = true;
    if (!walkTimer.running) return;
    const now = Date.now();
    const elapsed = Math.floor((now - walkTimer.lastTick) / 1000);
    if (elapsed <= 1) return;
    const newRemaining = walkTimer.remainingSec - elapsed;
    if (newRemaining <= 0) {
      setWalkTimer(prev => ({ ...prev, remainingSec: 0, running: false, lastTick: now }));
      setTimerExpired(true);
    } else {
      setWalkTimer(prev => ({ ...prev, remainingSec: newRemaining, lastTick: now }));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Tick timer
  useEffect(() => {
    if (!walkTimer?.running) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      return;
    }
    timerIntervalRef.current = setInterval(() => {
      setWalkTimer(prev => {
        if (!prev || !prev.running) return prev;
        const next = prev.remainingSec - 1;
        if (next <= 0) {
          setTimerExpired(true);
          try { navigator.vibrate?.([200, 100, 200, 100, 200, 100, 200]); } catch {}
          return { ...prev, remainingSec: 0, running: false, lastTick: Date.now() };
        }
        return { ...prev, remainingSec: next, lastTick: Date.now() };
      });
    }, 1000);
    return () => clearInterval(timerIntervalRef.current);
  }, [walkTimer?.running, setWalkTimer]);

  const startWalkTimer = useCallback(() => {
    const min = customTimerMin ? parseInt(customTimerMin, 10) : selectedTimerMin;
    if (!min || min < 1) return;
    const totalSec = min * 60;
    setWalkTimer({
      totalSec,
      remainingSec: totalSec,
      running: true,
      lastTick: Date.now(),
      startedAt: Date.now(),
    });
    setTimerExpired(false);
    setCustomTimerMin('');
  }, [selectedTimerMin, customTimerMin, setWalkTimer]);

  const extendWalkTimer = useCallback((min) => {
    setWalkTimer(prev => prev ? {
      ...prev,
      remainingSec: prev.remainingSec + min * 60,
      totalSec: prev.totalSec + min * 60,
      running: true,
      lastTick: Date.now(),
    } : prev);
    setTimerExpired(false);
  }, [setWalkTimer]);

  const endWalk = useCallback(() => {
    setWalkTimer(null);
    setTimerExpired(false);
    hasReconciled.current = false;
  }, [setWalkTimer]);

  const imSafe = useCallback(() => {
    setTimerExpired(false);
    endWalk();
  }, [endWalk]);

  // ══════════════════════════════════════════
  // FAKE CALL LOGIC
  // ══════════════════════════════════════════
  const primaryContact = contacts.find(c => c.isPrimary) || contacts[0] || { name: 'Mom', relation: '' };

  const startFakeCall = useCallback(() => {
    if (redialTimeoutRef.current) { clearTimeout(redialTimeoutRef.current); redialTimeoutRef.current = null; }
    setFakeCallState('ringing');
    setFakeCallSeconds(0);
    try { navigator.vibrate?.([200, 100, 200, 100, 200]); } catch {}
    ringtoneRef.current = createRingtone();
  }, []);

  const acceptFakeCall = useCallback(() => {
    if (ringtoneRef.current) { ringtoneRef.current.stop(); ringtoneRef.current = null; }
    setFakeCallState('active');
    setFakeCallSeconds(0);
    fakeCallIntervalRef.current = setInterval(() => {
      setFakeCallSeconds(s => s + 1);
    }, 1000);
  }, []);

  const endFakeCall = useCallback(() => {
    if (ringtoneRef.current) { ringtoneRef.current.stop(); ringtoneRef.current = null; }
    if (fakeCallIntervalRef.current) { clearInterval(fakeCallIntervalRef.current); fakeCallIntervalRef.current = null; }
    if (redialTimeoutRef.current) { clearTimeout(redialTimeoutRef.current); redialTimeoutRef.current = null; }
    setFakeCallState(null);
    setFakeCallSeconds(0);
  }, []);

  const declineFakeCall = useCallback(() => {
    if (ringtoneRef.current) { ringtoneRef.current.stop(); ringtoneRef.current = null; }
    setFakeCallState(null);
    // "Call back" in 10 seconds — store ref so it can be cancelled
    if (redialTimeoutRef.current) clearTimeout(redialTimeoutRef.current);
    redialTimeoutRef.current = setTimeout(() => {
      redialTimeoutRef.current = null;
      setFakeCallState('ringing');
      try { navigator.vibrate?.([200, 100, 200, 100, 200]); } catch {}
      ringtoneRef.current = createRingtone();
    }, 10000);
  }, []);

  // ══════════════════════════════════════════
  // EMERGENCY LOGIC — two-tier
  // ══════════════════════════════════════════
  const triggerEmergency = useCallback(() => {
    // Tier 1: immediate — alarm, vibrate, GPS grab, countdown starts
    setEmergencyActive(true);
    setEmergencyEscalated(false);
    setEmergencyCountdown(15);
    setEmergencyLocation('');
    setEmergencyAlertCopied(false);

    // Start alarm sound
    alarmRef.current = createAlarm();
    try { navigator.vibrate?.(30000); } catch {}

    // Grab GPS in background
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setEmergencyLocation(`https://maps.google.com/maps?q=${latitude},${longitude}`);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    );

    // Start 15-second countdown
    if (emergencyIntervalRef.current) clearInterval(emergencyIntervalRef.current);
    let count = 15;
    emergencyIntervalRef.current = setInterval(() => {
      count -= 1;
      setEmergencyCountdown(count);
      if (count <= 0) {
        clearInterval(emergencyIntervalRef.current);
        emergencyIntervalRef.current = null;
        setEmergencyEscalated(true);
      }
    }, 1000);
  }, []);

  const cancelEmergency = useCallback(() => {
    setEmergencyActive(false);
    setEmergencyEscalated(false);
    setEmergencyCountdown(15);
    setEmergencyLocation('');
    setEmergencyAlertCopied(false);
    if (alarmRef.current) { alarmRef.current.stop(); alarmRef.current = null; }
    if (emergencyIntervalRef.current) { clearInterval(emergencyIntervalRef.current); emergencyIntervalRef.current = null; }
    try { navigator.vibrate?.(0); } catch {}
  }, []);

  const copyEmergencyAlert = useCallback(() => {
    const loc = emergencyLocation || 'Location unavailable';
    const time = new Date().toLocaleTimeString();
    const primary = contacts.find(ct => ct.isPrimary) || contacts[0];
    const msg = `🚨 SAFETY ALERT — ${time}\nI triggered an emergency alert on SafeWalk. My location: ${loc}\nPlease try calling me immediately.${primary?.phone ? `\nMy number: ${primary.phone}` : ''}`;
    // Direct click handler — clipboard should work
    navigator.clipboard?.writeText(msg).then(() => {
      setEmergencyAlertCopied(true);
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = msg; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select(); document.execCommand('copy');
      document.body.removeChild(ta);
      setEmergencyAlertCopied(true);
    });
  }, [emergencyLocation, contacts]);

  // ══════════════════════════════════════════
  // FLASHLIGHT
  // ══════════════════════════════════════════
  const toggleFlashlight = useCallback(async () => {
    if (flashlightOn) {
      if (flashStreamRef.current) {
        flashStreamRef.current.getTracks().forEach(t => t.stop());
        flashStreamRef.current = null;
      }
      setFlashlightOn(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      const track = stream.getVideoTracks()[0];
      await track.applyConstraints({ advanced: [{ torch: true }] });
      flashStreamRef.current = stream;
      setFlashlightOn(true);
    } catch {
      // Fallback: just toggle state, render will show white screen
      setFlashlightOn(true);
    }
  }, [flashlightOn]);

  // ══════════════════════════════════════════
  // SHARE LOCATION
  // ══════════════════════════════════════════
  const shareLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationMsg('Location not available in this browser');
      return;
    }
    setLocationMsg('Getting location...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const link = `https://maps.google.com/maps?q=${latitude},${longitude}`;
        const eta = walkTimer ? `${Math.ceil(walkTimer.remainingSec / 60)} min` : 'unknown';
        const msg = `I'm at ${link}\nWalking home, should arrive in ~${eta}. Check on me if you don't hear from me soon.`;
        setPendingLocationMsg(msg);
        setLocationMsg('Tap to copy');
      },
      () => { setLocationMsg('Location denied'); setTimeout(() => setLocationMsg(''), 3000); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [walkTimer]);

  const copyPendingLocation = useCallback(() => {
    // This runs inside a direct click handler — clipboard works
    if (!pendingLocationMsg) return;
    navigator.clipboard?.writeText(pendingLocationMsg).then(() => {
      setLocationMsg('Copied! Paste into a text.');
      setPendingLocationMsg('');
      setTimeout(() => setLocationMsg(''), 3000);
    }).catch(() => {
      // Fallback: textarea copy
      const ta = document.createElement('textarea');
      ta.value = pendingLocationMsg;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setLocationMsg('Copied! Paste into a text.');
      setPendingLocationMsg('');
      setTimeout(() => setLocationMsg(''), 3000);
    });
  }, [pendingLocationMsg]);

  // ══════════════════════════════════════════
  // CONTACTS
  // ══════════════════════════════════════════
  const addContact = useCallback(() => {
    const name = newContactName.trim();
    if (!name) return;
    const contact = {
      id: Date.now(),
      name,
      relation: newContactRelation.trim(),
      phone: newContactPhone.trim(),
      isPrimary: contacts.length === 0,
    };
    setContacts(prev => [...prev, contact]);
    setNewContactName(''); setNewContactRelation(''); setNewContactPhone('');
  }, [newContactName, newContactRelation, newContactPhone, contacts.length, setContacts]);

  const removeContact = useCallback((id) => {
    setContacts(prev => prev.filter(c => c.id !== id));
  }, [setContacts]);

  const setPrimary = useCallback((id) => {
    setContacts(prev => prev.map(c => ({ ...c, isPrimary: c.id === id })));
  }, [setContacts]);

  // ══════════════════════════════════════════
  // PLAN TAB — AI ASSESS
  // ══════════════════════════════════════════
  const submitAssessment = useCallback(async () => {
    if (!route.trim()) return;
    setError(''); setAssessResult(null); setCheckedItems({});
    try {
      const res = await callToolEndpoint('safe-walk', {
        action: 'assess',
        route: route.trim(),
        timeOfDay: TIME_OPTIONS.find(t => t.id === timeOfDay)?.label.replace(/^..\s/, '') || timeOfDay,
        areaDescription: areaDesc.map(id => AREA_OPTIONS.find(a => a.id === id)?.label.replace(/^..\s/, '') || id),
        walkDuration: DURATION_OPTIONS.find(d => d.id === walkDuration)?.label || walkDuration,
        concerns: concerns.trim(),
      });
      setAssessResult(res);
      setExpandedSections({ overview: true, watch: true, checklist: true, routes: false, before: false });
    } catch (err) { setError(err.message || 'Failed to assess route'); }
  }, [route, timeOfDay, areaDesc, walkDuration, concerns, callToolEndpoint]);

  const copyText = useCallback((text) => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  const toggleSection = (key) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  const toggleArea = (id) => setAreaDesc(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);

  // ══════════════════════════════════════════
  // Cleanup on unmount
  // ══════════════════════════════════════════
  useEffect(() => {
    return () => {
      if (ringtoneRef.current) ringtoneRef.current.stop();
      if (alarmRef.current) alarmRef.current.stop();
      if (fakeCallIntervalRef.current) clearInterval(fakeCallIntervalRef.current);
      if (redialTimeoutRef.current) clearTimeout(redialTimeoutRef.current);
      if (emergencyIntervalRef.current) clearInterval(emergencyIntervalRef.current);
      if (flashStreamRef.current) flashStreamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  // ══════════════════════════════════════════
  // RENDER: FAKE CALL OVERLAY
  // ══════════════════════════════════════════
  if (fakeCallState === 'ringing') {
    return (
      <div className="fixed inset-0 z-[9999] bg-gradient-to-b from-slate-900 to-black flex flex-col items-center justify-between py-16 px-8">
        <div />
        <div className="text-center">
          <div className="w-24 h-24 rounded-full bg-slate-700 flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl font-bold text-white">{primaryContact.name.charAt(0).toUpperCase()}</span>
          </div>
          <p className="text-3xl font-bold text-white mb-1">{primaryContact.name}</p>
          <p className="text-lg text-slate-400">{primaryContact.relation || 'mobile'}</p>
          <p className="text-sm text-slate-500 mt-2 animate-pulse">incoming call...</p>
        </div>
        <div className="flex items-center justify-center gap-16">
          <button onClick={declineFakeCall}
            className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/30 active:scale-95">
            <PhoneOff className="w-7 h-7 text-white" />
          </button>
          <button onClick={acceptFakeCall}
            className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-pulse active:scale-95">
            <Phone className="w-7 h-7 text-white" />
          </button>
        </div>
      </div>
    );
  }

  if (fakeCallState === 'active') {
    return (
      <div className="fixed inset-0 z-[9999] bg-gradient-to-b from-slate-900 to-black flex flex-col items-center justify-between py-16 px-8">
        <div className="text-center">
          <p className="text-sm text-emerald-400 font-semibold mb-1">Connected</p>
          <p className="text-lg font-mono text-white">{fmtTime(fakeCallSeconds)}</p>
        </div>
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-slate-700 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl font-bold text-white">{primaryContact.name.charAt(0).toUpperCase()}</span>
          </div>
          <p className="text-2xl font-bold text-white mb-1">{primaryContact.name}</p>
          <p className="text-sm text-slate-400">{primaryContact.relation || 'mobile'}</p>
        </div>
        <div className="flex items-center justify-center gap-10">
          <div className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center">
              <VolumeX className="w-5 h-5 text-white" />
            </div>
            <span className="text-[10px] text-slate-500">mute</span>
          </div>
          <button onClick={endFakeCall}
            className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/30 active:scale-95">
            <PhoneOff className="w-7 h-7 text-white" />
          </button>
          <div className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center">
              <Volume2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-[10px] text-slate-500">speaker</span>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════
  // RENDER: EMERGENCY OVERLAY (two-tier)
  // ══════════════════════════════════════════
  if (emergencyActive) {
    const primary = contacts.find(ct => ct.isPrimary) || contacts[0];
    return (
      <div className="fixed inset-0 z-[9999] bg-red-700 flex flex-col items-center justify-between py-12 px-6">
        {/* Top — alarm indicator */}
        <div className="text-center">
          <Siren className="w-14 h-14 text-white mx-auto mb-3 animate-bounce" />
          <p className="text-3xl font-black text-white">ALARM ACTIVE</p>
          {!emergencyEscalated && (
            <p className="text-base text-red-200 mt-2 font-mono font-bold">
              Escalating in {emergencyCountdown}s...
            </p>
          )}
        </div>

        {/* Middle — action buttons */}
        <div className="w-full max-w-sm space-y-3">
          {/* Always visible: Call 911 */}
          <a href="tel:911"
            className="w-full py-5 rounded-2xl text-xl font-black bg-white text-red-700 flex items-center justify-center gap-3 active:scale-95 block text-center no-underline shadow-lg">
            <Phone className="w-6 h-6" /> Call 911
          </a>

          {/* Escalated tier: alert copied + call contact */}
          {emergencyEscalated && (
            <>
              <button onClick={copyEmergencyAlert}
                className={`w-full py-4 rounded-2xl text-base font-bold flex items-center justify-center gap-2 active:scale-95 shadow-lg
                  ${emergencyAlertCopied ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-black'}`}>
                {emergencyAlertCopied
                  ? <><CheckCircle2 className="w-5 h-5" /> Alert Copied — Paste to text</>
                  : <><Copy className="w-5 h-5" /> Copy Emergency Alert</>}
              </button>

              {primary?.phone && (
                <a href={`tel:${primary.phone}`}
                  className="w-full py-4 rounded-2xl text-base font-bold bg-white/20 text-white flex items-center justify-center gap-2 active:scale-95 block text-center no-underline border-2 border-white/30">
                  <PhoneCall className="w-5 h-5" /> Call {primary.name}
                </a>
              )}

              {emergencyLocation && (
                <p className="text-xs text-red-200 text-center break-all">
                  📍 {emergencyLocation}
                </p>
              )}
            </>
          )}
        </div>

        {/* Bottom — cancel */}
        <button onClick={cancelEmergency}
          className="w-full max-w-sm py-4 rounded-2xl text-base font-bold bg-white/10 text-white border-2 border-white/20 flex items-center justify-center gap-2 active:scale-95">
          <Shield className="w-5 h-5" /> I'm OK — False Alarm
        </button>
      </div>
    );
  }

  // ══════════════════════════════════════════
  // RENDER: FLASHLIGHT FALLBACK
  // ══════════════════════════════════════════
  if (flashlightOn && !flashStreamRef.current) {
    return (
      <div className="fixed inset-0 z-[9998] bg-white flex flex-col items-center justify-center"
        onClick={toggleFlashlight}>
        <Flashlight className="w-16 h-16 text-slate-300 mb-4" />
        <p className="text-slate-500 font-bold">Tap to turn off</p>
        <p className="text-xs text-slate-400 mt-2">Hardware flashlight not available — using screen light</p>
      </div>
    );
  }

  // ══════════════════════════════════════════
  // RENDER: SETTINGS PANEL
  // ══════════════════════════════════════════
  const renderSettings = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className={`text-sm font-bold ${c.text}`}>⚙️ Emergency Contacts</h3>
        <button onClick={() => setShowSettings(false)} className={c.btnGhost}><X className="w-5 h-5" /></button>
      </div>

      <div className={`p-4 rounded-xl border ${c.border} ${c.bgCard} space-y-3`}>
        <input type="text" value={newContactName} onChange={e => setNewContactName(e.target.value)}
          placeholder="Name" className={`w-full px-3 py-2.5 rounded-lg border text-sm ${c.input} outline-none`} />
        <div className="flex gap-2">
          <input type="text" value={newContactRelation} onChange={e => setNewContactRelation(e.target.value)}
            placeholder="Relation (optional)" className={`flex-1 px-3 py-2.5 rounded-lg border text-sm ${c.input} outline-none`} />
          <input type="tel" value={newContactPhone} onChange={e => setNewContactPhone(e.target.value)}
            placeholder="Phone (optional)" className={`flex-1 px-3 py-2.5 rounded-lg border text-sm ${c.input} outline-none`} />
        </div>
        <button onClick={addContact} disabled={!newContactName.trim()}
          className={`w-full py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 ${newContactName.trim() ? c.btn : c.btnDis}`}>
          <Plus className="w-4 h-4" /> Add Contact
        </button>
      </div>

      {contacts.length > 0 && (
        <div className="space-y-2">
          {contacts.map(ct => (
            <div key={ct.id} className={`p-3 rounded-xl border ${c.border} ${c.bgCard} flex items-center gap-3`}>
              <button onClick={() => setPrimary(ct.id)}
                className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-black
                  ${ct.isPrimary ? 'bg-emerald-500 text-white' : `${c.bgInset} ${c.textMut}`}`}>
                {ct.name.charAt(0).toUpperCase()}
              </button>
              <div className="flex-1 min-w-0">
                <span className={`text-sm font-bold ${c.text} block truncate`}>{ct.name}</span>
                <span className={`text-xs ${c.textMut} truncate block`}>
                  {ct.relation}{ct.relation && ct.phone ? ' · ' : ''}{ct.phone}
                  {ct.isPrimary && <span className={`ml-1.5 ${c.accent} font-bold`}>★ Primary</span>}
                </span>
              </div>
              <button onClick={() => removeContact(ct.id)} className={`p-1.5 rounded-lg ${c.btnSec} hover:text-red-500`}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {contacts.length === 0 && (
        <p className={`text-xs ${c.textMut} text-center py-3`}>
          Add someone who should know when you're walking. They'll be used for fake calls and check-in alerts.
        </p>
      )}
    </div>
  );

  // ══════════════════════════════════════════
  // RENDER: PLAN TAB
  // ══════════════════════════════════════════
  const renderPlanTab = () => {
    const renderCollapsible = (key, icon, title, children) => {
      const isOpen = expandedSections[key];
      return (
        <div className={`rounded-xl border ${c.border} ${c.bgCard} overflow-hidden mb-3`}>
          <button onClick={() => toggleSection(key)} className="w-full flex items-center gap-2 p-4 text-left">
            <span>{icon}</span>
            <span className={`text-sm font-bold ${c.text} flex-1`}>{title}</span>
            {isOpen ? <ChevronUp className={`w-4 h-4 ${c.textMut}`} /> : <ChevronDown className={`w-4 h-4 ${c.textMut}`} />}
          </button>
          {isOpen && <div className="px-4 pb-4">{children}</div>}
        </div>
      );
    };

    // Results
    if (assessResult) {
      const r = assessResult;
      const riskColors = {
        low: { bg: c.successBg, text: c.successText },
        moderate: { bg: c.warnBg, text: c.warnText },
        elevated: { bg: `${c.d ? 'bg-orange-900/30 border-orange-700' : 'bg-orange-50 border-orange-200'}`, text: c.d ? 'text-orange-300' : 'text-orange-800' },
        high: { bg: c.dangerBg, text: c.dangerText },
      };
      const risk = riskColors[r.safety_overview?.risk_level] || riskColors.moderate;

      return (
        <div className="space-y-3">
          {/* Safety Overview */}
          {renderCollapsible('overview', '🚦', 'Safety Overview', (
            <div className={`p-4 rounded-xl border ${risk.bg}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-black uppercase px-2 py-1 rounded ${risk.bg} ${risk.text} border`}>
                  {r.safety_overview?.risk_level || 'moderate'}
                </span>
              </div>
              <p className={`text-sm ${risk.text}`}>{r.safety_overview?.summary}</p>
            </div>
          ))}

          {/* Watch For */}
          {r.watch_for?.length > 0 && renderCollapsible('watch', '👀', 'What to Watch For', (
            <div className="space-y-2">
              {r.watch_for.map((item, i) => {
                const sevColors = {
                  info: { icon: c.infoText, bg: c.infoBg },
                  caution: { icon: c.warnText, bg: c.warnBg },
                  warning: { icon: c.dangerText, bg: c.dangerBg },
                };
                const sev = sevColors[item.severity] || sevColors.info;
                return (
                  <div key={i} className={`p-3 rounded-lg border ${sev.bg}`}>
                    <span className={`text-xs font-bold ${sev.icon} uppercase block mb-1`}>{item.concern}</span>
                    <p className={`text-sm ${sev.icon}`}>{item.detail}</p>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Checklist */}
          {r.checklist?.length > 0 && renderCollapsible('checklist', '✅', 'Pre-Walk Checklist', (
            <div className="space-y-2">
              {r.checklist.map((item, i) => (
                <button key={i} onClick={() => setCheckedItems(prev => ({ ...prev, [i]: !prev[i] }))}
                  className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-all
                    ${checkedItems[i] ? (c.d ? 'bg-emerald-900/20 border-emerald-700' : 'bg-emerald-50 border-emerald-200') : `${c.bgInset} ${c.border}`}`}>
                  <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5
                    ${checkedItems[i] ? 'bg-emerald-500 border-emerald-500 text-white' : c.border}`}>
                    {checkedItems[i] && <Check className="w-3 h-3" />}
                  </div>
                  <div className="flex-1">
                    <span className={`text-sm font-semibold ${checkedItems[i] ? `line-through ${c.textMut}` : c.text}`}>{item.item}</span>
                    <p className={`text-xs ${c.textMut} mt-0.5`}>{item.why}</p>
                  </div>
                  {item.priority === 'essential' && (
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${c.d ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600'}`}>
                      Essential
                    </span>
                  )}
                </button>
              ))}
            </div>
          ))}

          {/* Route suggestions */}
          {r.route_suggestions?.length > 0 && renderCollapsible('routes', '🔀', 'Route Suggestions', (
            <div className="space-y-2">
              {r.route_suggestions.map((item, i) => (
                <div key={i} className={`p-3 rounded-lg border ${c.border} ${c.bgInset}`}>
                  <span className={`text-sm font-semibold ${c.text} block mb-1`}>{item.suggestion}</span>
                  <p className={`text-xs ${c.textSec}`}>{item.reasoning}</p>
                </div>
              ))}
            </div>
          ))}

          {/* Before you go */}
          {r.before_you_go && renderCollapsible('before', '📱', 'Before You Go', (
            <div className="space-y-3">
              {r.before_you_go.eta_message && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-xs font-bold ${c.textSec} uppercase`}>Share ETA</span>
                    <button onClick={() => copyText(r.before_you_go.eta_message)}
                      className={`flex items-center gap-1 text-xs font-semibold ${c.btnGhost}`}>
                      {copied ? <><CheckCircle2 className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                    </button>
                  </div>
                  <div className={`p-3 rounded-lg border ${c.bgInset} ${c.border} text-sm ${c.text}`}>
                    {r.before_you_go.eta_message}
                  </div>
                </div>
              )}
              {r.before_you_go.reminders?.length > 0 && (
                <div className="space-y-1.5">
                  {r.before_you_go.reminders.map((rem, i) => (
                    <div key={i} className={`flex items-center gap-2 text-sm ${c.text}`}>
                      <CheckCircle2 className={`w-4 h-4 ${c.accent} flex-shrink-0`} />
                      <span>{rem}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Disclaimer */}
          <p className={`text-[10px] ${c.textMut} text-center px-4`}>
            SafeWalk provides general safety awareness, not real-time safety data. Always trust your instincts. In an emergency, call 911.
          </p>

          {/* Start walking button */}
          <button onClick={() => { setActiveTab('walking'); }}
            className={`w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 ${c.btn}`}>
            <Navigation className="w-4 h-4" /> Ready — Start Walking
          </button>

          <button onClick={() => { setAssessResult(null); setCheckedItems({}); }}
            className={`w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 ${c.btnSec}`}>
            Assess a different walk
          </button>
        </div>
      );
    }

    // Input form
    return (
      <div>
        <div className={`p-5 rounded-2xl border ${c.border} ${c.bgCard} mb-4`}>
          <span className={`text-xs font-bold ${c.textSec} uppercase tracking-wide mb-3 block`}>Plan your walk</span>

          <span className={`text-xs font-semibold ${c.textSec} mb-1.5 block`}>Where are you walking?</span>
          <textarea value={route} onChange={e => setRoute(e.target.value)}
            placeholder="e.g. From my apartment on Oak St to the 7-Eleven on Main, through the park"
            rows={2} className={`w-full px-4 py-2.5 rounded-xl border text-sm ${c.input} outline-none mb-3 resize-none`} />

          <span className={`text-xs font-semibold ${c.textSec} mb-1.5 block`}>When?</span>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {TIME_OPTIONS.map(opt => (
              <button key={opt.id} onClick={() => setTimeOfDay(timeOfDay === opt.id ? '' : opt.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all
                  ${timeOfDay === opt.id ? c.pillActive : c.pillInactive}`}>
                {opt.label}
              </button>
            ))}
          </div>

          <span className={`text-xs font-semibold ${c.textSec} mb-1.5 block`}>Area type (select all that apply)</span>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {AREA_OPTIONS.map(opt => (
              <button key={opt.id} onClick={() => toggleArea(opt.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all
                  ${areaDesc.includes(opt.id) ? c.pillActive : c.pillInactive}`}>
                {opt.label}
              </button>
            ))}
          </div>

          <span className={`text-xs font-semibold ${c.textSec} mb-1.5 block`}>How long?</span>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {DURATION_OPTIONS.map(opt => (
              <button key={opt.id} onClick={() => setWalkDuration(walkDuration === opt.id ? '' : opt.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all
                  ${walkDuration === opt.id ? c.pillActive : c.pillInactive}`}>
                {opt.label}
              </button>
            ))}
          </div>

          <span className={`text-xs font-semibold ${c.textSec} mb-1.5 block`}>Specific concerns? (optional)</span>
          <textarea value={concerns} onChange={e => setConcerns(e.target.value)}
            placeholder="e.g. Construction with no sidewalk, stray dogs, that underpass feels sketchy"
            rows={2} className={`w-full px-4 py-2.5 rounded-xl border text-sm ${c.input} outline-none resize-none`} />
        </div>

        <button onClick={submitAssessment} disabled={loading || !route.trim()}
          className={`w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2
            ${route.trim() && !loading ? c.btn : c.btnDis}`}>
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Assessing your route...</>
            : <><Shield className="w-4 h-4" /> Assess My Walk</>}
        </button>
      </div>
    );
  };

  // ══════════════════════════════════════════
  // RENDER: WALKING TAB
  // ══════════════════════════════════════════
  const renderWalkingTab = () => {
    const progress = walkTimer ? (walkTimer.totalSec - walkTimer.remainingSec) / walkTimer.totalSec : 0;

    return (
      <div className="space-y-4">

        {/* Timer card */}
        <div className={`p-5 rounded-2xl ${c.walkCard} ${c.walkBorder} border`}>

          {!walkTimer && !timerExpired ? (
            <>
              <span className={`text-xs font-bold ${c.walkTextSec} uppercase tracking-wide mb-3 block`}>Check-in timer</span>
              <div className="flex flex-wrap gap-2 mb-3">
                {WALK_TIMER_PRESETS.map(p => (
                  <button key={p.min} onClick={() => { setSelectedTimerMin(p.min); setCustomTimerMin(''); }}
                    className={`px-4 py-3 rounded-xl text-sm font-bold border-2 transition-all
                      ${!customTimerMin && selectedTimerMin === p.min
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                        : `${c.walkBorder} text-slate-400`}`}>
                    {p.label}
                  </button>
                ))}
                <input type="number" value={customTimerMin} onChange={e => setCustomTimerMin(e.target.value)}
                  placeholder="Custom" min="1" max="120"
                  className={`w-20 px-3 py-3 rounded-xl border-2 text-sm text-center font-bold bg-transparent ${c.walkBorder} text-white outline-none focus:border-emerald-500`} />
              </div>
              <button onClick={startWalkTimer}
                className="w-full py-4 rounded-xl text-base font-black flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black active:scale-95 transition-all">
                <Navigation className="w-5 h-5" /> Start Walk
              </button>
              <p className={`text-xs text-center mt-2 ${c.walkTextSec}`}>
                You'll be asked to check in when time is up
              </p>
            </>
          ) : timerExpired ? (
            <div className="text-center">
              <div className="animate-pulse mb-4">
                <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-2" />
                <p className="text-xl font-black text-white">Time's up!</p>
                <p className={`text-sm ${c.walkTextSec}`}>Are you safe?</p>
              </div>
              <div className="flex gap-3">
                <button onClick={imSafe}
                  className="flex-1 py-4 rounded-xl text-base font-black bg-emerald-500 hover:bg-emerald-400 text-black active:scale-95 flex items-center justify-center gap-2">
                  <Check className="w-5 h-5" /> I'm Safe
                </button>
                <button onClick={triggerEmergency}
                  className="flex-1 py-4 rounded-xl text-base font-black bg-red-500 hover:bg-red-400 text-white active:scale-95 flex items-center justify-center gap-2">
                  <AlertTriangle className="w-5 h-5" /> I Need Help
                </button>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => extendWalkTimer(5)}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold ${c.walkBtn}`}>+5 min</button>
                <button onClick={() => extendWalkTimer(10)}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold ${c.walkBtn}`}>+10 min</button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              {/* Progress ring */}
              <div className="relative inline-block mb-4">
                <svg width="160" height="160" className="transform -rotate-90">
                  <circle cx="80" cy="80" r="68" fill="none" strokeWidth="6" className="stroke-slate-700" />
                  <circle cx="80" cy="80" r="68" fill="none" strokeWidth="6" className="stroke-emerald-400"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 68}
                    strokeDashoffset={(2 * Math.PI * 68) - progress * (2 * Math.PI * 68)}
                    style={{ transition: 'stroke-dashoffset 1s linear' }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-mono font-black text-white tracking-tight">
                    {fmtTime(walkTimer?.remainingSec || 0)}
                  </span>
                  <span className={`text-xs ${c.walkTextSec} mt-1`}>remaining</span>
                </div>
              </div>

              <div className="flex gap-2 mb-3">
                <button onClick={() => extendWalkTimer(5)}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold ${c.walkBtn}`}>+5 min</button>
                <button onClick={endWalk}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold ${c.walkBtn}`}>End Walk</button>
              </div>
            </div>
          )}
        </div>

        {/* Quick action grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Fake Call */}
          <button onClick={startFakeCall}
            className={`p-5 rounded-2xl border-2 ${c.walkBorder} ${c.walkCard} flex flex-col items-center gap-2 active:scale-95 transition-all`}>
            <PhoneCall className="w-7 h-7 text-emerald-400" />
            <span className="text-sm font-bold text-white">Fake Call</span>
            <span className={`text-[10px] ${c.walkTextSec}`}>Look busy</span>
          </button>

          {/* Flashlight */}
          <button onClick={toggleFlashlight}
            className={`p-5 rounded-2xl border-2 ${flashlightOn ? 'border-amber-400 bg-amber-500/20' : `${c.walkBorder} ${c.walkCard}`}
              flex flex-col items-center gap-2 active:scale-95 transition-all`}>
            <Flashlight className={`w-7 h-7 ${flashlightOn ? 'text-amber-400' : 'text-slate-400'}`} />
            <span className="text-sm font-bold text-white">{flashlightOn ? 'Light On' : 'Flashlight'}</span>
            <span className={`text-[10px] ${c.walkTextSec}`}>{flashlightOn ? 'Tap to off' : 'Illuminate'}</span>
          </button>

          {/* Share Location */}
          <button onClick={pendingLocationMsg ? copyPendingLocation : shareLocation}
            className={`p-5 rounded-2xl border-2 ${pendingLocationMsg ? 'border-sky-400 bg-sky-500/20' : `${c.walkBorder} ${c.walkCard}`}
              flex flex-col items-center gap-2 active:scale-95 transition-all`}>
            <MapPin className={`w-7 h-7 ${pendingLocationMsg ? 'text-sky-300' : 'text-sky-400'}`} />
            <span className="text-sm font-bold text-white">{pendingLocationMsg ? 'Tap to Copy' : 'Share Location'}</span>
            <span className={`text-[10px] ${c.walkTextSec}`}>{locationMsg || 'Copy to text'}</span>
          </button>

          {/* Emergency */}
          <button onClick={triggerEmergency}
            className="p-5 rounded-2xl border-2 border-red-500/50 bg-red-500/10 flex flex-col items-center gap-2 active:scale-95 transition-all">
            <Siren className="w-7 h-7 text-red-400" />
            <span className="text-sm font-bold text-red-300">Emergency</span>
            <span className="text-[10px] text-red-400/70">Alarm + SOS</span>
          </button>
        </div>

        {/* Open in Maps (convenience) */}
        <div className={`p-3 rounded-xl border ${c.walkBorder} ${c.walkCard} flex items-center gap-3`}>
          <Navigation className={`w-4 h-4 ${c.walkTextSec}`} />
          <span className={`text-xs ${c.walkTextSec} flex-1`}>Need directions? Open your map app for navigation.</span>
          <button onClick={() => {
            if (route.trim()) {
              const enc = encodeURIComponent(route.trim());
              const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
              window.open(isIOS ? `maps://maps.apple.com/?daddr=${enc}&dirflg=w` : `https://www.google.com/maps/dir/?api=1&destination=${enc}&travelmode=walking`, '_blank');
            }
          }}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-600 hover:bg-slate-500 text-white">
            Open Maps
          </button>
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════
  // MAIN RENDER
  // ══════════════════════════════════════════
  const renderHeader = () => (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className={`text-2xl font-bold ${c.text}`}>SafeWalk 🚶🏽‍♀️</h2>
          <p className={`text-sm ${c.textMut}`}>Prepare smart, walk safe</p>
        </div>
        <button onClick={() => setShowSettings(!showSettings)}
          className={`p-2.5 rounded-xl ${c.btnSec}`}>
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {!showSettings && (
        <div className="flex gap-1.5">
          {[
            { id: 'plan', label: '🗺️ Plan' },
            { id: 'walking', label: '🚶🏽‍♀️ Walking', pulse: walkTimer?.running },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5
                ${activeTab === tab.id ? c.tabActive : `${c.tabInactive} border`}`}>
              {tab.label}
              {tab.pulse && (
                <span className="relative flex h-2.5 w-2.5 ml-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className={c.text}>
      {renderHeader()}
      {showSettings ? renderSettings() : (
        <>
          {activeTab === 'plan' && renderPlanTab()}
          {activeTab === 'walking' && renderWalkingTab()}
        </>
      )}
      {error && (
        <div className={`mt-4 p-4 ${c.errBg} border rounded-xl flex items-start gap-3`}>
          <AlertCircle className={`w-5 h-5 ${c.errText} flex-shrink-0 mt-0.5`} />
          <p className={`text-sm ${c.errText}`}>{error}</p>
        </div>
      )}
    </div>
  );
};

SafeWalk.displayName = 'SafeWalk';
export default SafeWalk;
