import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Loader2, Plus, X, Camera, Check, Clock, AlertCircle, Sparkles, Play, Pause, Trash2, Bell, BellOff, ChevronDown, ChevronUp, Droplets, Shirt, ShieldAlert, Timer, Printer, ThermometerSun, Wind, AlertTriangle, Copy, Volume2, VolumeX, ScanLine, Pencil, Zap } from 'lucide-react';
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
    bg: d ? 'bg-zinc-900' : 'bg-stone-50',
    bgCard: d ? 'bg-zinc-800' : 'bg-white',
    bgInset: d ? 'bg-zinc-700' : 'bg-stone-100',
    bgHover: d ? 'hover:bg-zinc-700' : 'hover:bg-stone-50',
    text: d ? 'text-zinc-50' : 'text-stone-900',
    textSec: d ? 'text-zinc-400' : 'text-stone-600',
    textMut: d ? 'text-zinc-500' : 'text-stone-400',
    border: d ? 'border-zinc-700' : 'border-stone-200',
    accent: d ? 'text-sky-400' : 'text-sky-600',
    accentBg: d ? 'bg-sky-500/20 border-sky-600/40' : 'bg-sky-50 border-sky-200',
    input: d ? 'bg-zinc-700 border-zinc-600 text-zinc-100 placeholder-zinc-500 focus:border-sky-500' : 'bg-white border-stone-300 text-stone-900 placeholder-stone-400 focus:border-sky-500',
    btn: d ? 'bg-sky-500 hover:bg-sky-400 text-zinc-900 font-bold' : 'bg-stone-800 hover:bg-stone-900 text-white font-bold',
    btnSec: d ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-200' : 'bg-stone-100 hover:bg-stone-200 text-stone-700',
    btnGhost: d ? 'text-zinc-400 hover:text-zinc-100' : 'text-stone-500 hover:text-stone-800',
    btnDis: d ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed' : 'bg-stone-200 text-stone-400 cursor-not-allowed',
    tabActive: d ? 'bg-sky-500 text-white' : 'bg-stone-800 text-white',
    tabInactive: d ? 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 border-zinc-700' : 'bg-white text-stone-500 hover:text-stone-700 border-stone-200',
    successBg: d ? 'bg-emerald-900/30 border-emerald-700 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800',
    warnBg: d ? 'bg-amber-900/30 border-amber-700 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800',
    dangerBg: d ? 'bg-red-900/30 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-800',
    errBg: d ? 'bg-red-900/30 border-red-700' : 'bg-red-50 border-red-200',
    errText: d ? 'text-red-300' : 'text-red-700',
    dropzone: d ? 'border-zinc-600 bg-zinc-800/50 hover:border-sky-500' : 'border-stone-300 bg-stone-50 hover:border-sky-400',
    pillActive: d ? 'border-sky-500 bg-sky-900/30 text-sky-300' : 'border-sky-400 bg-sky-50 text-sky-700',
    pillInactive: d ? 'border-zinc-600 text-zinc-400' : 'border-stone-200 text-stone-500',
    riskHigh: d ? 'bg-red-900/30 border-red-600 text-red-300' : 'bg-red-50 border-red-300 text-red-800',
    riskLow: d ? 'bg-emerald-900/20 border-emerald-700 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-700',
    timerGreen: d ? 'text-emerald-400' : 'text-emerald-600',
    timerAmber: d ? 'text-amber-400' : 'text-amber-600',
    timerRed: d ? 'text-red-400' : 'text-red-500',
    ringGreen: d ? 'stroke-emerald-400' : 'stroke-emerald-500',
    ringAmber: d ? 'stroke-amber-400' : 'stroke-amber-500',
    ringRed: d ? 'stroke-red-400' : 'stroke-red-500',
    ringBg: d ? 'stroke-zinc-700' : 'stroke-stone-200',
    scanBg: d ? 'bg-violet-900/20 border-violet-700/40' : 'bg-violet-50 border-violet-200',
    scanAccent: d ? 'text-violet-400' : 'text-violet-600',
    scanBtn: d ? 'bg-violet-600 hover:bg-violet-500 text-white font-bold' : 'bg-violet-600 hover:bg-violet-700 text-white font-bold',
    savedBg: d ? 'bg-zinc-800/80 border-zinc-700' : 'bg-stone-50 border-stone-200',
  };
};

// ════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════
const DURATION_PRESETS = [
  { label: '25m', min: 25 },
  { label: '30m', min: 30 },
  { label: '35m', min: 35 },
  { label: '45m', min: 45 },
  { label: '60m', min: 60 },
  { label: '90m', min: 90 },
];

const ALERT_PRESETS = [
  { label: '2 min', min: 2 },
  { label: '5 min', min: 5 },
  { label: '10 min', min: 10 },
];

const STAIN_TYPES = [
  { id: 'coffee', label: '☕ Coffee' },
  { id: 'red_wine', label: '🍷 Red wine' },
  { id: 'grease', label: '🛢️ Grease/Oil' },
  { id: 'blood', label: '🩸 Blood' },
  { id: 'ink', label: '🖊️ Ink' },
  { id: 'grass', label: '🌿 Grass' },
  { id: 'tomato', label: '🍅 Tomato sauce' },
  { id: 'chocolate', label: '🍫 Chocolate' },
  { id: 'sweat', label: '💛 Sweat/yellowing' },
  { id: 'makeup', label: '💄 Makeup' },
  { id: 'mud', label: '🟤 Mud' },
  { id: 'berry', label: '🫐 Berry' },
];

const FABRIC_TYPES = ['Cotton', 'Polyester', 'Silk', 'Wool', 'Denim', 'Linen', 'Unknown'];
const STAIN_AGES = [
  { value: 'just_happened', label: 'Just happened' },
  { value: 'few_hours', label: 'Few hours ago' },
  { value: 'dried', label: 'Dried / set' },
  { value: 'old', label: 'Old stain' },
];

// ════════════════════════════════════════════════════════════
// AUDIO — Web Audio API tone generator
// ════════════════════════════════════════════════════════════
const playAlertTone = (urgent = false) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = urgent ? 880 : 660;
    osc.type = 'sine';
    gain.gain.value = 0.3;
    osc.start();
    const dur = urgent ? 0.8 : 0.5;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    setTimeout(() => { osc.stop(); ctx.close(); }, (dur + 0.1) * 1000);
  } catch { /* audio not available */ }
};

// ════════════════════════════════════════════════════════════
// IMAGE COMPRESSION
// ════════════════════════════════════════════════════════════
const compressImageFile = (file) => {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) { reject(new Error('Invalid file type')); return; }
    const maxDim = 1024, quality = 0.8, maxSizeKB = 800;
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Read failed'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Load failed'));
      img.onload = () => {
        try {
          let w = img.width, h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) { h = Math.round((h / w) * maxDim); w = maxDim; }
            else { w = Math.round((w / h) * maxDim); h = maxDim; }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, w, h);
          let dataUrl = canvas.toDataURL('image/jpeg', quality);
          let sizeKB = Math.round((dataUrl.length * 0.75) / 1024);
          if (sizeKB > maxSizeKB) { dataUrl = canvas.toDataURL('image/jpeg', 0.6); sizeKB = Math.round((dataUrl.length * 0.75) / 1024); }
          if (sizeKB > maxSizeKB) {
            const sc = 768 / Math.max(w, h), sc2 = document.createElement('canvas');
            sc2.width = Math.round(w * sc); sc2.height = Math.round(h * sc);
            const sCtx = sc2.getContext('2d');
            sCtx.imageSmoothingEnabled = true; sCtx.imageSmoothingQuality = 'high';
            sCtx.drawImage(canvas, 0, 0, sc2.width, sc2.height);
            dataUrl = sc2.toDataURL('image/jpeg', 0.6);
          }
          resolve(dataUrl);
        } catch (err) { reject(err); }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

// ════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════
const LaundroMat = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const c = useColors();

  // Tabs
  const [activeTab, setActiveTab] = useState('timers');

  // ── Timers (persistent — survives navigation) ──
  const [timers, setTimers] = usePersistentState('laundromat-timers', []);
  const [newLabel, setNewLabel] = useState('');
  const [newDuration, setNewDuration] = useState(30);
  const [customDuration, setCustomDuration] = useState('');
  const [alertBefore, setAlertBefore] = useState(5);
  const [showCustomTimer, setShowCustomTimer] = useState(false);
  const [notifPermission, setNotifPermission] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'denied');
  const [showNotifBanner, setShowNotifBanner] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const intervalRefs = useRef({});
  const alertFiredRefs = useRef({});
  const doneFiredRefs = useRef({});
  const repeatAlertRefs = useRef({});

  // ── Load Advisor ──
  const [loadDesc, setLoadDesc] = useState('');
  const [machineType, setMachineType] = useState('home');
  const [labelImage, setLabelImage] = useState(null);
  const [labelPreview, setLabelPreview] = useState(null);
  const [compressing, setCompressing] = useState(false);
  const [adviceResults, setAdviceResults] = useState(null);
  const labelPhotoRef = useRef(null);

  // ── Stain SOS ──
  const [stainType, setStainType] = useState('');
  const [stainCustom, setStainCustom] = useState('');
  const [fabric, setFabric] = useState('Cotton');
  const [stainAge, setStainAge] = useState('just_happened');
  const [stainImage, setStainImage] = useState(null);
  const [stainPreview, setStainPreview] = useState(null);
  const [compressingStain, setCompressingStain] = useState(false);
  const [stainResults, setStainResults] = useState(null);
  const [checkedSteps, setCheckedSteps] = useState({});
  const stainPhotoRef = useRef(null);

  // Shared
  const [error, setError] = useState('');

  // ── Quick Scan / Saved Machines ──
  const [savedMachines, setSavedMachines] = usePersistentState('laundromat-machines', []);
  const [showScanner, setShowScanner] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null); // { code, matched: machine|null }
  const [manualMachineId, setManualMachineId] = useState('');
  const [newMachineLabel, setNewMachineLabel] = useState('');
  const [newMachineDuration, setNewMachineDuration] = useState(30);
  const [showSavedMachines, setShowSavedMachines] = useState(false);
  const [editingMachineId, setEditingMachineId] = useState(null);
  const [editLabel, setEditLabel] = useState('');
  const [editDuration, setEditDuration] = useState(30);
  const videoRef = useRef(null);
  const scanStreamRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const hasBarcodeDetector = typeof window !== 'undefined' && 'BarcodeDetector' in window;

  // ══════════════════════════════════════════
  // TIMER LOGIC
  // ══════════════════════════════════════════
  const sendNotification = useCallback((title, body) => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try { new Notification(title, { body, icon: '🧺' }); } catch { /* mobile fallback */ }
    }
  }, []);

  // Reconcile timers on mount — fast-forward running timers based on elapsed time
  const hasReconciled = useRef(false);
  useEffect(() => {
    if (hasReconciled.current || timers.length === 0) return;
    hasReconciled.current = true;
    const now = Date.now();
    let anyChanged = false;
    const reconciled = timers.map(t => {
      if (!t.running || t.done || !t.lastTick) return t;
      const elapsedSec = Math.floor((now - t.lastTick) / 1000);
      if (elapsedSec <= 1) return t;
      anyChanged = true;
      const newRemaining = t.remainingSec - elapsedSec;
      if (newRemaining <= 0) {
        // Timer finished while away
        doneFiredRefs.current[t.id] = true;
        return { ...t, remainingSec: 0, done: true, running: false, lastTick: now };
      }
      // Fast-forward alert-fired flag if we crossed the threshold
      if (newRemaining <= t.alertBeforeSec && t.remainingSec > t.alertBeforeSec) {
        alertFiredRefs.current[t.id] = true;
      }
      return { ...t, remainingSec: newRemaining, lastTick: now };
    });
    if (anyChanged) setTimers(reconciled);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addTimer = useCallback(() => {
    const durMin = customDuration ? parseInt(customDuration, 10) : newDuration;
    if (!durMin || durMin < 1) return;
    const id = `timer_${Date.now()}`;
    const label = newLabel.trim() || `Machine ${timers.length + 1}`;
    const totalSec = durMin * 60;
    setTimers(prev => [...prev, {
      id, label, totalSec, remainingSec: totalSec,
      alertBeforeSec: alertBefore * 60, running: true, done: false, dismissed: false,
      lastTick: Date.now(),
    }]);
    setNewLabel('');
    setCustomDuration('');

    // Prompt for notifications on first timer if not yet granted
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      setShowNotifBanner(true);
    }
  }, [newLabel, newDuration, customDuration, alertBefore, timers.length]);

  const quickAddTimer = useCallback((type, durMin) => {
    // Auto-number: count existing timers of this type that aren't dismissed
    const prefix = type === 'washer' ? 'Washer' : 'Dryer';
    const existingCount = timers.filter(t => t.label.startsWith(prefix) && !t.dismissed).length;
    const label = `${prefix} ${existingCount + 1}`;
    const id = `timer_${Date.now()}_qa`;
    const totalSec = durMin * 60;
    setTimers(prev => [...prev, {
      id, label, totalSec, remainingSec: totalSec,
      alertBeforeSec: 5 * 60, running: true, done: false, dismissed: false,
      lastTick: Date.now(),
    }]);
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      setShowNotifBanner(true);
    }
  }, [timers]);

  const requestNotifPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return;
    const perm = await Notification.requestPermission();
    setNotifPermission(perm);
    setShowNotifBanner(false);
  }, []);

  // Tick timers every second
  useEffect(() => {
    const activeTimers = timers.filter(t => t.running && !t.done);
    if (activeTimers.length === 0) return;

    const interval = setInterval(() => {
      const now = Date.now();
      setTimers(prev => prev.map(t => {
        if (!t.running || t.done) return t;
        const next = t.remainingSec - 1;

        // Alert window reached
        if (next === t.alertBeforeSec && !alertFiredRefs.current[t.id]) {
          alertFiredRefs.current[t.id] = true;
          sendNotification('🧺 Almost done!', `${t.label} finishes in ${t.alertBeforeSec / 60} minutes! Go grab your clothes.`);
          if (soundEnabled) playAlertTone(false);
        }

        // Timer done
        if (next <= 0 && !doneFiredRefs.current[t.id]) {
          doneFiredRefs.current[t.id] = true;
          sendNotification('🧺 DONE!', `${t.label} is done! Go now before someone moves your stuff.`);
          if (soundEnabled) playAlertTone(true);
          // Repeat alert every 30s
          repeatAlertRefs.current[t.id] = setInterval(() => {
            if (soundEnabled) playAlertTone(true);
          }, 30000);
          return { ...t, remainingSec: 0, done: true, running: false, lastTick: now };
        }

        return { ...t, remainingSec: Math.max(0, next), lastTick: now };
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [timers, soundEnabled, sendNotification]);

  const togglePause = useCallback((id) => {
    setTimers(prev => prev.map(t => t.id === id ? { ...t, running: !t.running, lastTick: !t.running ? Date.now() : t.lastTick } : t));
  }, []);

  const extendTimer = useCallback((id, extraMin) => {
    setTimers(prev => prev.map(t => t.id === id ? {
      ...t, remainingSec: t.remainingSec + extraMin * 60, totalSec: t.totalSec + extraMin * 60,
      done: false, running: true, dismissed: false, lastTick: Date.now(),
    } : t));
    // Clear done state if extended
    doneFiredRefs.current[id] = false;
    if (repeatAlertRefs.current[id]) {
      clearInterval(repeatAlertRefs.current[id]);
      delete repeatAlertRefs.current[id];
    }
  }, []);

  const dismissTimer = useCallback((id) => {
    setTimers(prev => prev.map(t => t.id === id ? { ...t, dismissed: true, running: false } : t));
    if (repeatAlertRefs.current[id]) {
      clearInterval(repeatAlertRefs.current[id]);
      delete repeatAlertRefs.current[id];
    }
  }, []);

  const removeTimer = useCallback((id) => {
    setTimers(prev => prev.filter(t => t.id !== id));
    if (repeatAlertRefs.current[id]) {
      clearInterval(repeatAlertRefs.current[id]);
      delete repeatAlertRefs.current[id];
    }
    delete alertFiredRefs.current[id];
    delete doneFiredRefs.current[id];
  }, []);

  // Cleanup repeating alerts on unmount
  useEffect(() => {
    return () => {
      Object.values(repeatAlertRefs.current).forEach(clearInterval);
    };
  }, []);

  // ══════════════════════════════════════════
  // QUICK SCAN / SAVED MACHINES
  // ══════════════════════════════════════════
  const stopScanner = useCallback(() => {
    if (scanIntervalRef.current) { clearInterval(scanIntervalRef.current); scanIntervalRef.current = null; }
    if (scanStreamRef.current) {
      scanStreamRef.current.getTracks().forEach(t => t.stop());
      scanStreamRef.current = null;
    }
    setScanning(false);
  }, []);

  const startScanner = useCallback(async () => {
    if (!hasBarcodeDetector) return;
    setScanning(true); setScanResult(null); setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      scanStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      const detector = new window.BarcodeDetector({ formats: ['qr_code', 'ean_13', 'ean_8', 'code_128', 'code_39', 'code_93', 'upc_a', 'upc_e'] });
      scanIntervalRef.current = setInterval(async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) return;
        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes.length > 0) {
            const code = barcodes[0].rawValue;
            const matched = savedMachines.find(m => m.code === code) || null;
            setScanResult({ code, matched });
            stopScanner();
            if (matched) {
              // Auto-create timer for known machine
              quickStartFromMachine(matched);
            } else {
              setNewMachineLabel('');
              setNewMachineDuration(30);
            }
          }
        } catch { /* detection frame error, continue */ }
      }, 500);
    } catch (err) {
      setError('Camera access denied or not available');
      setScanning(false);
    }
  }, [hasBarcodeDetector, savedMachines, stopScanner]);

  // Cleanup scanner on unmount
  useEffect(() => { return () => stopScanner(); }, [stopScanner]);

  const lookupManualId = useCallback(() => {
    const code = manualMachineId.trim();
    if (!code) return;
    const matched = savedMachines.find(m => m.code === code) || null;
    setScanResult({ code, matched });
    if (matched) {
      quickStartFromMachine(matched);
    } else {
      setNewMachineLabel('');
      setNewMachineDuration(30);
    }
    setManualMachineId('');
  }, [manualMachineId, savedMachines]);

  const quickStartFromMachine = useCallback((machine) => {
    const id = `timer_${Date.now()}_qs`;
    setTimers(prev => [...prev, {
      id, label: machine.label, totalSec: machine.duration * 60, remainingSec: machine.duration * 60,
      alertBeforeSec: 5 * 60, running: true, done: false, dismissed: false,
      lastTick: Date.now(),
    }]);
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') setShowNotifBanner(true);
  }, []);

  const saveNewMachine = useCallback(() => {
    if (!scanResult?.code) return;
    const label = newMachineLabel.trim() || `Machine #${scanResult.code.slice(-4)}`;
    const machine = { code: scanResult.code, label, duration: newMachineDuration, createdAt: Date.now() };
    setSavedMachines(prev => [...prev, machine]);
    quickStartFromMachine(machine);
    setScanResult(null);
    setShowScanner(false);
  }, [scanResult, newMachineLabel, newMachineDuration, setSavedMachines, quickStartFromMachine]);

  const deleteSavedMachine = useCallback((code) => {
    setSavedMachines(prev => prev.filter(m => m.code !== code));
    if (editingMachineId === code) setEditingMachineId(null);
  }, [setSavedMachines, editingMachineId]);

  const startEditMachine = useCallback((machine) => {
    setEditingMachineId(machine.code);
    setEditLabel(machine.label);
    setEditDuration(machine.duration);
  }, []);

  const saveEditMachine = useCallback((code) => {
    setSavedMachines(prev => prev.map(m => m.code === code ? { ...m, label: editLabel.trim() || m.label, duration: editDuration } : m));
    setEditingMachineId(null);
  }, [setSavedMachines, editLabel, editDuration]);

  // ══════════════════════════════════════════
  // LOAD ADVISOR
  // ══════════════════════════════════════════
  const handleLabelPhoto = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Please upload an image'); return; }
    setCompressing(true); setError('');
    try {
      const compressed = await compressImageFile(file);
      setLabelPreview(compressed);
      setLabelImage(compressed);
    } catch (err) { setError('Failed to process image'); }
    finally { setCompressing(false); }
  }, []);

  const getLoadAdvice = useCallback(async () => {
    if (!loadDesc.trim() && !labelImage) return;
    setError(''); setAdviceResults(null);
    try {
      const res = await callToolEndpoint('laundro-mat', {
        action: labelImage && !loadDesc.trim() ? 'label' : 'advise',
        loadDescription: loadDesc,
        machineType,
        imageBase64: labelImage || null,
      });
      setAdviceResults(res);
    } catch (err) { setError(err.message || 'Failed to get advice'); }
  }, [loadDesc, machineType, labelImage, callToolEndpoint]);

  // Bridge: set timers from advice
  const setTimersFromAdvice = useCallback((washMin, dryMin) => {
    const ts = [];
    const now = Date.now();
    if (washMin) {
      const id1 = `timer_${now}_w`;
      ts.push({ id: id1, label: 'Washer', totalSec: washMin * 60, remainingSec: washMin * 60, alertBeforeSec: 5 * 60, running: true, done: false, dismissed: false, lastTick: now });
    }
    if (dryMin) {
      const id2 = `timer_${now}_d`;
      ts.push({ id: id2, label: 'Dryer', totalSec: dryMin * 60, remainingSec: dryMin * 60, alertBeforeSec: 5 * 60, running: true, done: false, dismissed: false, lastTick: now });
    }
    setTimers(prev => [...prev, ...ts]);
    setActiveTab('timers');
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') setShowNotifBanner(true);
  }, []);

  // ══════════════════════════════════════════
  // STAIN SOS
  // ══════════════════════════════════════════
  const handleStainPhoto = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Please upload an image'); return; }
    setCompressingStain(true); setError('');
    try {
      const compressed = await compressImageFile(file);
      setStainPreview(compressed);
      setStainImage(compressed);
    } catch (err) { setError('Failed to process image'); }
    finally { setCompressingStain(false); }
  }, []);

  const getStainHelp = useCallback(async () => {
    if (!stainType && !stainCustom.trim() && !stainImage) return;
    setError(''); setStainResults(null); setCheckedSteps({});
    try {
      const res = await callToolEndpoint('laundro-mat', {
        action: 'stain',
        stainType: stainType || stainCustom.trim(),
        stainCustom: stainCustom.trim(),
        fabric,
        stainAge,
        imageBase64: stainImage || null,
      });
      setStainResults(res);
    } catch (err) { setError(err.message || 'Failed to get stain advice'); }
  }, [stainType, stainCustom, fabric, stainAge, stainImage, callToolEndpoint]);

  // ══════════════════════════════════════════
  // FORMAT HELPERS
  // ══════════════════════════════════════════
  const fmtTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // ══════════════════════════════════════════
  // RENDER: Header + Tabs
  // ══════════════════════════════════════════
  const renderHeader = () => (
    <div className="mb-5">
      <div className="flex items-center gap-3 mb-4">
        <div>
          <h2 className={`text-2xl font-bold ${c.text}`}>LaundroMat 🧺</h2>
          <p className={`text-sm ${c.textMut}`}>Never lose track of your laundry again</p>
        </div>
      </div>
      <div className="flex gap-1.5">
        {[
          { id: 'timers', label: '⏱️ Timers', badge: timers.filter(t => t.running || (t.done && !t.dismissed)).length },
          { id: 'advisor', label: '🧠 Load Advisor' },
          { id: 'stain', label: '🆘 Stain SOS' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5
              ${activeTab === tab.id ? c.tabActive : `${c.tabInactive} border`}`}>
            {tab.label}
            {tab.badge > 0 && (
              <span className={`ml-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black
                ${activeTab === tab.id ? 'bg-white/20' : (c.d ? 'bg-amber-500/30 text-amber-300' : 'bg-amber-100 text-amber-700')}`}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );

  const renderError = () => error ? (
    <div className={`mt-4 p-4 ${c.errBg} border rounded-xl flex items-start gap-3`}>
      <AlertCircle className={`w-5 h-5 ${c.errText} flex-shrink-0 mt-0.5`} />
      <p className={`text-sm ${c.errText}`}>{error}</p>
    </div>
  ) : null;

  // ══════════════════════════════════════════
  // RENDER: TIMERS TAB
  // ══════════════════════════════════════════
  const renderTimersTab = () => {
    const renderProgressRing = (timer) => {
      const radius = 52, stroke = 6, circ = 2 * Math.PI * radius;
      const progress = timer.totalSec > 0 ? (timer.totalSec - timer.remainingSec) / timer.totalSec : 0;
      const offset = circ - progress * circ;
      const inAlert = !timer.done && timer.remainingSec <= timer.alertBeforeSec;
      const ringColor = timer.done ? c.ringRed : inAlert ? c.ringAmber : c.ringGreen;

      return (
        <svg width="120" height="120" className="transform -rotate-90">
          <circle cx="60" cy="60" r={radius} fill="none" strokeWidth={stroke} className={c.ringBg} />
          <circle cx="60" cy="60" r={radius} fill="none" strokeWidth={stroke} className={ringColor}
            strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s linear' }} />
        </svg>
      );
    };

    const renderTimerCard = (timer) => {
      const inAlert = !timer.done && timer.remainingSec > 0 && timer.remainingSec <= timer.alertBeforeSec;
      const isDone = timer.done && !timer.dismissed;
      const timerColor = isDone ? c.timerRed : inAlert ? c.timerAmber : c.timerGreen;
      const cardBorder = isDone ? (c.d ? 'border-red-600' : 'border-red-400') : inAlert ? (c.d ? 'border-amber-600' : 'border-amber-400') : c.border;
      const pulseClass = isDone ? 'animate-pulse' : inAlert ? 'animate-[pulse_2s_ease-in-out_infinite]' : '';

      return (
        <div key={timer.id}
          className={`p-5 rounded-2xl border-2 ${cardBorder} ${c.bgCard} mb-4 transition-all ${pulseClass}`}>

          {/* Label + status */}
          <div className="flex items-center justify-between mb-3">
            <span className={`text-sm font-bold ${c.text}`}>{timer.label}</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isDone ? c.dangerBg + ' border' : inAlert ? c.warnBg + ' border' : c.successBg + ' border'}`}>
              {isDone ? '✅ Done!' : inAlert ? '⚠️ Almost done!' : timer.running ? 'Running' : timer.dismissed ? 'Dismissed' : 'Paused'}
            </span>
          </div>

          {/* Ring + countdown */}
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              {renderProgressRing(timer)}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-2xl font-mono font-black tracking-tight ${timerColor}`}>
                  {fmtTime(timer.remainingSec)}
                </span>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {isDone ? (
              <button onClick={() => dismissTimer(timer.id)}
                className={`px-4 py-2 rounded-xl text-sm font-bold ${c.btn}`}>
                Dismiss
              </button>
            ) : !timer.dismissed && (
              <>
                <button onClick={() => togglePause(timer.id)}
                  className={`p-2 rounded-xl ${c.btnSec}`} title={timer.running ? 'Pause' : 'Resume'}>
                  {timer.running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button onClick={() => extendTimer(timer.id, 5)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold ${c.btnSec}`}>+5 min</button>
              </>
            )}
            <button onClick={() => removeTimer(timer.id)}
              className={`p-2 rounded-xl ${c.btnSec} hover:text-red-500`} title="Delete">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      );
    };

    return (
      <div>
        {/* Notification banner */}
        {showNotifBanner && notifPermission !== 'granted' && (
          <div className={`p-4 rounded-xl border mb-4 ${c.accentBg} flex items-center gap-3`}>
            <Bell className={`w-5 h-5 ${c.accent} flex-shrink-0`} />
            <div className="flex-1">
              <p className={`text-sm font-semibold ${c.text}`}>Enable notifications?</p>
              <p className={`text-xs ${c.textSec}`}>Get alerted even if you switch tabs or lock your phone.</p>
            </div>
            <button onClick={requestNotifPermission} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${c.btn}`}>Enable</button>
            <button onClick={() => setShowNotifBanner(false)} className={`p-1 ${c.btnGhost}`}><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Sound toggle */}
        <div className="flex items-center justify-end mb-3">
          <button onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center gap-1.5 text-xs font-semibold ${c.btnGhost}`}>
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            Sound {soundEnabled ? 'on' : 'off'}
          </button>
        </div>

        {/* ── Quick Scan ── */}
        <div className={`p-4 rounded-2xl border ${c.scanBg} mb-4`}>
          <button onClick={() => { setShowScanner(!showScanner); if (showScanner) { stopScanner(); setScanResult(null); } }}
            className="w-full flex items-center gap-2 text-left">
            <Zap className={`w-4 h-4 ${c.scanAccent}`} />
            <span className={`text-sm font-bold ${c.text} flex-1`}>Quick Scan</span>
            {savedMachines.length > 0 && <span className={`text-xs ${c.textMut}`}>{savedMachines.length} saved</span>}
            {showScanner ? <ChevronUp className={`w-4 h-4 ${c.textMut}`} /> : <ChevronDown className={`w-4 h-4 ${c.textMut}`} />}
          </button>

          {showScanner && (
            <div className="mt-3 space-y-3">
              <p className={`text-xs ${c.textSec}`}>
                Scan or type a machine's barcode/sticker number. First time saves it — next time, one tap starts the timer.
              </p>

              {/* Camera scanner (Chrome/Edge/Android only) */}
              {hasBarcodeDetector && !scanResult && (
                <div>
                  {scanning ? (
                    <div className="space-y-2">
                      <div className="relative rounded-xl overflow-hidden bg-black" style={{ aspectRatio: '4/3' }}>
                        <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className={`w-48 h-48 border-2 border-dashed rounded-xl ${c.d ? 'border-violet-400/60' : 'border-violet-500/60'}`} />
                        </div>
                        <div className="absolute bottom-2 left-0 right-0 text-center">
                          <span className="text-xs text-white/70 bg-black/50 px-2 py-1 rounded">Point at barcode or QR code</span>
                        </div>
                      </div>
                      <button onClick={stopScanner}
                        className={`w-full py-2 rounded-xl text-xs font-semibold ${c.btnSec}`}>
                        Cancel scan
                      </button>
                    </div>
                  ) : (
                    <button onClick={startScanner}
                      className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 ${c.scanBtn}`}>
                      <ScanLine className="w-4 h-4" /> Scan Machine Barcode
                    </button>
                  )}
                </div>
              )}

              {/* Manual fallback (always available) */}
              {!scanning && !scanResult && (
                <div>
                  {!hasBarcodeDetector && (
                    <p className={`text-xs italic ${c.textMut} mb-2`}>
                      QR scanning isn't supported in this browser — type the machine number instead.
                    </p>
                  )}
                  <div className="flex gap-2">
                    <input type="text" value={manualMachineId} onChange={e => setManualMachineId(e.target.value)}
                      placeholder="Type machine # or sticker ID"
                      onKeyDown={e => { if (e.key === 'Enter') lookupManualId(); }}
                      className={`flex-1 px-3 py-2.5 rounded-xl border text-sm ${c.input} outline-none`} />
                    <button onClick={lookupManualId} disabled={!manualMachineId.trim()}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold ${manualMachineId.trim() ? c.scanBtn : c.btnDis}`}>
                      Go
                    </button>
                  </div>
                </div>
              )}

              {/* Scan result: unknown machine → save it */}
              {scanResult && !scanResult.matched && (
                <div className={`p-4 rounded-xl border ${c.border} ${c.bgCard}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <ScanLine className={`w-4 h-4 ${c.scanAccent}`} />
                    <span className={`text-sm font-bold ${c.text}`}>New machine!</span>
                    <span className={`text-xs ${c.textMut}`}>ID: {scanResult.code.length > 20 ? scanResult.code.slice(0, 20) + '...' : scanResult.code}</span>
                  </div>
                  <input type="text" value={newMachineLabel} onChange={e => setNewMachineLabel(e.target.value)}
                    placeholder={`Label (e.g. "Washer #3 — Heavy")`}
                    className={`w-full px-3 py-2.5 rounded-xl border text-sm ${c.input} outline-none mb-2`} />
                  <span className={`text-xs font-semibold ${c.textSec} mb-1.5 block`}>Cycle duration</span>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {DURATION_PRESETS.map(p => (
                      <button key={p.min} onClick={() => setNewMachineDuration(p.min)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${newMachineDuration === p.min ? c.pillActive : c.pillInactive}`}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={saveNewMachine}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 ${c.btn}`}>
                      <Timer className="w-4 h-4" /> Save & Start Timer
                    </button>
                    <button onClick={() => setScanResult(null)}
                      className={`px-3 py-2.5 rounded-xl text-xs font-semibold ${c.btnSec}`}>Cancel</button>
                  </div>
                </div>
              )}

              {/* Saved machines list */}
              {savedMachines.length > 0 && !scanResult && !scanning && (
                <div>
                  <button onClick={() => setShowSavedMachines(!showSavedMachines)}
                    className={`flex items-center gap-1.5 text-xs font-semibold ${c.btnGhost} mb-2`}>
                    {showSavedMachines ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    My Machines ({savedMachines.length})
                  </button>
                  {showSavedMachines && (
                    <div className="space-y-1.5">
                      {savedMachines.map(m => (
                        <div key={m.code} className={`p-3 rounded-xl border ${c.savedBg}`}>
                          {editingMachineId === m.code ? (
                            <div className="space-y-2">
                              <input type="text" value={editLabel} onChange={e => setEditLabel(e.target.value)}
                                className={`w-full px-3 py-2 rounded-lg border text-xs ${c.input} outline-none`} />
                              <div className="flex flex-wrap gap-1">
                                {DURATION_PRESETS.map(p => (
                                  <button key={p.min} onClick={() => setEditDuration(p.min)}
                                    className={`px-2 py-1 rounded text-[10px] font-semibold border ${editDuration === p.min ? c.pillActive : c.pillInactive}`}>
                                    {p.label}
                                  </button>
                                ))}
                              </div>
                              <div className="flex gap-1.5">
                                <button onClick={() => saveEditMachine(m.code)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${c.btn}`}>Save</button>
                                <button onClick={() => setEditingMachineId(null)} className={`px-3 py-1.5 rounded-lg text-xs ${c.btnSec}`}>Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button onClick={() => quickStartFromMachine(m)}
                                className={`flex-1 text-left`}>
                                <span className={`text-sm font-semibold ${c.text}`}>{m.label}</span>
                                <span className={`text-xs ${c.textMut} ml-2`}>{m.duration}m</span>
                              </button>
                              <button onClick={() => quickStartFromMachine(m)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold ${c.scanBtn}`}>
                                <Zap className="w-3 h-3" />
                              </button>
                              <button onClick={() => startEditMachine(m)}
                                className={`p-1.5 rounded-lg ${c.btnSec}`}><Pencil className="w-3 h-3" /></button>
                              <button onClick={() => deleteSavedMachine(m.code)}
                                className={`p-1.5 rounded-lg ${c.btnSec} hover:text-red-500`}><Trash2 className="w-3 h-3" /></button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Quick Add Presets ── */}
        <div className={`p-4 rounded-2xl border ${c.border} ${c.bgCard} mb-4`}>
          <span className={`text-xs font-bold ${c.textSec} uppercase tracking-wide mb-3 block`}>Quick Add</span>
          <div className="grid grid-cols-2 gap-2 mb-2">
            {[
              { type: 'washer', min: 30, icon: '🫧' },
              { type: 'washer', min: 45, icon: '🫧' },
              { type: 'dryer', min: 45, icon: '🔥' },
              { type: 'dryer', min: 60, icon: '🔥' },
            ].map((preset, i) => (
              <button key={i} onClick={() => quickAddTimer(preset.type, preset.min)}
                className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl border-2 text-sm font-bold transition-all
                  ${c.border} ${c.bgInset} ${c.bgHover} active:scale-95`}>
                <span>{preset.icon}</span>
                <span className={c.text}>{preset.type === 'washer' ? 'Washer' : 'Dryer'} {preset.min}m</span>
                <Plus className={`w-3.5 h-3.5 ${c.textMut}`} />
              </button>
            ))}
          </div>
          <p className={`text-[11px] ${c.textMut} text-center`}>Tap to start — auto-labels Washer 1, Washer 2, Dryer 1…</p>
        </div>

        {/* ── Custom Timer (collapsible) ── */}
        <div className={`rounded-2xl border ${c.border} ${c.bgCard} mb-5 overflow-hidden`}>
          <button onClick={() => setShowCustomTimer(!showCustomTimer)}
            className={`w-full flex items-center gap-2 p-4 text-left`}>
            <Timer className={`w-4 h-4 ${c.textMut}`} />
            <span className={`text-xs font-bold ${c.textSec} uppercase tracking-wide flex-1`}>Custom Timer</span>
            {showCustomTimer ? <ChevronUp className={`w-4 h-4 ${c.textMut}`} /> : <ChevronDown className={`w-4 h-4 ${c.textMut}`} />}
          </button>
          {showCustomTimer && (
            <div className="px-5 pb-5">
              <input type="text" value={newLabel} onChange={e => setNewLabel(e.target.value)}
                placeholder={`Label (e.g. "Delicates — Cold")`}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm ${c.input} outline-none mb-3`} />

              <span className={`text-xs font-semibold ${c.textSec} mb-2 block`}>Duration</span>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {DURATION_PRESETS.map(p => (
                  <button key={p.min} onClick={() => { setNewDuration(p.min); setCustomDuration(''); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${!customDuration && newDuration === p.min ? c.pillActive : c.pillInactive}`}>
                    {p.label}
                  </button>
                ))}
                <input type="number" value={customDuration} onChange={e => setCustomDuration(e.target.value)}
                  placeholder="Custom" min="1" max="180"
                  className={`w-20 px-2 py-1.5 rounded-lg border text-xs text-center ${c.input} outline-none`} />
              </div>

              <span className={`text-xs font-semibold ${c.textSec} mb-2 block`}>Alert me before</span>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {ALERT_PRESETS.map(p => (
                  <button key={p.min} onClick={() => setAlertBefore(p.min)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${alertBefore === p.min ? c.pillActive : c.pillInactive}`}>
                    {p.label}
                  </button>
                ))}
              </div>

              <button onClick={addTimer}
                className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 ${c.btn}`}>
                <Timer className="w-4 h-4" /> Start Timer
              </button>
            </div>
          )}
        </div>

        {/* Active timers */}
        {timers.length > 0 && (
          <div>
            <span className={`text-xs font-bold ${c.textSec} uppercase tracking-wide mb-3 block`}>
              Active Timers ({timers.filter(t => !t.dismissed).length})
            </span>
            {timers.filter(t => !t.dismissed).map(renderTimerCard)}
            {timers.some(t => t.dismissed) && (
              <button onClick={() => setTimers(prev => prev.filter(t => !t.dismissed))}
                className={`w-full text-center text-xs font-semibold ${c.btnGhost} py-2`}>
                Clear dismissed timers
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  // ══════════════════════════════════════════
  // RENDER: LOAD ADVISOR TAB
  // ══════════════════════════════════════════
  const renderAdvisorTab = () => {

    const renderAdviceResults = () => {
      if (!adviceResults) return null;
      const r = adviceResults;
      return (
        <div className="space-y-4 mt-5">
          {/* Assessment */}
          {r.load_assessment && (
            <div className={`p-4 rounded-xl border ${c.accentBg}`}>
              <p className={`text-sm font-semibold ${c.text}`}>🧠 {r.load_assessment}</p>
            </div>
          )}

          {/* Separate these — high risk */}
          {r.separate_these && r.separate_these.length > 0 && (
            <div className={`p-4 rounded-xl border-2 ${c.riskHigh}`}>
              <h4 className={`text-sm font-bold flex items-center gap-2 mb-2 ${c.d ? 'text-red-300' : 'text-red-800'}`}>
                <ShieldAlert className="w-4 h-4" /> Separate These
              </h4>
              {r.separate_these.map((item, i) => (
                <div key={i} className="mb-2 last:mb-0">
                  <span className={`text-sm font-semibold ${c.d ? 'text-red-200' : 'text-red-900'}`}>{item.item}</span>
                  <p className={`text-xs ${c.textSec} mt-0.5`}>{item.reason}</p>
                </div>
              ))}
            </div>
          )}

          {/* Safe together */}
          {r.safe_together && r.safe_together.length > 0 && (
            <div className={`p-4 rounded-xl border ${c.riskLow}`}>
              <h4 className={`text-sm font-bold flex items-center gap-2 mb-2 ${c.d ? 'text-emerald-300' : 'text-emerald-700'}`}>
                <Check className="w-4 h-4" /> Safe Together
              </h4>
              <p className={`text-sm ${c.d ? 'text-emerald-300' : 'text-emerald-700'}`}>{r.safe_together.join(', ')}</p>
            </div>
          )}

          {/* Recommended settings */}
          {r.recommended_settings && (
            <div className={`p-4 rounded-xl border ${c.border} ${c.bgCard}`}>
              <h4 className={`text-sm font-bold ${c.text} mb-3 flex items-center gap-2`}>
                <Shirt className="w-4 h-4" /> Recommended Settings
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {r.recommended_settings.cycle && (
                  <div><span className={`text-xs ${c.textMut}`}>Cycle</span><p className={`text-sm font-semibold ${c.text}`}>{r.recommended_settings.cycle}</p></div>
                )}
                {r.recommended_settings.temperature && (
                  <div><span className={`text-xs ${c.textMut}`}>Temperature</span><p className={`text-sm font-semibold ${c.text}`}><ThermometerSun className="w-3.5 h-3.5 inline mr-1" />{r.recommended_settings.temperature}</p></div>
                )}
                {r.recommended_settings.spin && (
                  <div><span className={`text-xs ${c.textMut}`}>Spin</span><p className={`text-sm font-semibold ${c.text}`}>{r.recommended_settings.spin}</p></div>
                )}
              </div>
              {r.recommended_settings.detergent_notes && (
                <p className={`text-xs ${c.textSec} mt-2`}>💧 {r.recommended_settings.detergent_notes}</p>
              )}
            </div>
          )}

          {/* Drying advice */}
          {r.drying_advice && r.drying_advice.length > 0 && (
            <div className={`p-4 rounded-xl border ${c.border} ${c.bgCard}`}>
              <h4 className={`text-sm font-bold ${c.text} mb-3 flex items-center gap-2`}>
                <Wind className="w-4 h-4" /> Drying
              </h4>
              {r.drying_advice.map((d, i) => (
                <div key={i} className={`flex items-start gap-2 mb-2 last:mb-0 ${d.risk === 'high' ? 'font-semibold' : ''}`}>
                  {d.risk === 'high' && <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />}
                  <p className={`text-sm ${c.text}`}><strong>{d.item}:</strong> {d.method}</p>
                </div>
              ))}
            </div>
          )}

          {/* Pre-treatment */}
          {r.pre_treatment && r.pre_treatment.length > 0 && (
            <div className={`p-4 rounded-xl border ${c.warnBg}`}>
              <h4 className={`text-sm font-bold mb-2 ${c.d ? 'text-amber-300' : 'text-amber-800'}`}>💡 Pre-Treatment Tips</h4>
              {r.pre_treatment.map((p, i) => (
                <p key={i} className={`text-sm mb-1 ${c.d ? 'text-amber-200' : 'text-amber-900'}`}><strong>{p.item}:</strong> {p.tip}</p>
              ))}
            </div>
          )}

          {/* Quick tip */}
          {r.quick_tip && (
            <p className={`text-xs italic ${c.textSec}`}>✨ {r.quick_tip}</p>
          )}

          {/* Care label symbols */}
          {r.care_symbols && r.care_symbols.length > 0 && (
            <div className={`p-4 rounded-xl border ${c.border} ${c.bgCard}`}>
              <h4 className={`text-sm font-bold ${c.text} mb-3`}>🏷️ Care Label Translation</h4>
              <div className="space-y-2">
                {r.care_symbols.map((sym, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className={`text-lg ${c.text}`}>{sym.symbol || '•'}</span>
                    <p className={`text-sm ${c.text}`}><strong>{sym.name}:</strong> {sym.meaning}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Set timers from estimate */}
          {r.time_estimate && (
            <button onClick={() => setTimersFromAdvice(r.time_estimate.wash_minutes, r.time_estimate.dry_minutes)}
              className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 ${c.btn}`}>
              <Timer className="w-4 h-4" />
              Set timers ({r.time_estimate.wash_minutes}m wash{r.time_estimate.dry_minutes ? ` + ${r.time_estimate.dry_minutes}m dry` : ''})
            </button>
          )}
        </div>
      );
    };

    return (
      <div>
        <div className={`p-5 rounded-2xl border ${c.border} ${c.bgCard} mb-4`}>
          <h3 className={`text-sm font-bold ${c.text} mb-3 flex items-center gap-2`}>
            <Shirt className="w-4 h-4" /> What are you washing?
          </h3>

          <textarea value={loadDesc} onChange={e => setLoadDesc(e.target.value)}
            placeholder='e.g. "dark jeans, a few t-shirts, my new wool sweater, and gym socks"'
            rows={3} className={`w-full px-4 py-3 rounded-xl border text-sm ${c.input} outline-none mb-3`} />

          {/* Care label photo */}
          <div className="mb-3">
            {compressing ? (
              <div className={`flex items-center gap-2 p-3 rounded-xl border-2 border-dashed ${c.dropzone}`}>
                <Loader2 className={`w-4 h-4 animate-spin ${c.accent}`} />
                <span className={`text-xs ${c.textSec}`}>Compressing...</span>
              </div>
            ) : labelPreview ? (
              <div className="flex items-center gap-3">
                <img src={labelPreview} alt="Label" className="w-16 h-16 object-cover rounded-lg border" />
                <span className={`text-xs ${c.textSec}`}>📸 Care label attached</span>
                <button onClick={() => { setLabelPreview(null); setLabelImage(null); if (labelPhotoRef.current) labelPhotoRef.current.value = ''; }}
                  className={`p-1 ${c.btnGhost} hover:text-red-500`}><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <button onClick={() => labelPhotoRef.current?.click()}
                className={`w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed text-xs font-medium ${c.dropzone} ${c.textMut}`}>
                <Camera className="w-4 h-4" /> Snap a care label (optional)
              </button>
            )}
            <input ref={labelPhotoRef} type="file" accept="image/*" onChange={handleLabelPhoto} className="hidden" />
          </div>

          {/* Machine type */}
          <span className={`text-xs font-semibold ${c.textSec} mb-2 block`}>Machine type</span>
          <div className="flex gap-1.5 mb-4">
            {[
              { v: 'home', l: '🏠 Home' }, { v: 'laundromat', l: '🏪 Laundromat' }, { v: 'handwash', l: '🤲 Hand wash' },
            ].map(m => (
              <button key={m.v} onClick={() => setMachineType(m.v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex-1 ${machineType === m.v ? c.pillActive : c.pillInactive}`}>
                {m.l}
              </button>
            ))}
          </div>

          <button onClick={getLoadAdvice} disabled={loading || (!loadDesc.trim() && !labelImage)}
            className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2
              ${(loadDesc.trim() || labelImage) && !loading ? c.btn : c.btnDis}`}>
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</> : <><Sparkles className="w-4 h-4" /> Advise Me</>}
          </button>
        </div>

        {renderAdviceResults()}
      </div>
    );
  };

  // ══════════════════════════════════════════
  // RENDER: STAIN SOS TAB
  // ══════════════════════════════════════════
  const renderStainTab = () => {
    const renderStainResults = () => {
      if (!stainResults) return null;
      const r = stainResults;
      return (
        <div className="space-y-4 mt-5">
          {/* Urgency */}
          {r.urgency && (
            <div className={`p-4 rounded-xl border-2 ${c.warnBg}`}>
              <p className={`text-sm font-bold flex items-center gap-2 ${c.d ? 'text-amber-300' : 'text-amber-800'}`}>
                <AlertTriangle className="w-4 h-4" /> {r.urgency}
              </p>
            </div>
          )}

          {/* What you need */}
          {r.what_you_need && r.what_you_need.length > 0 && (
            <div className={`p-4 rounded-xl border ${c.border} ${c.bgCard}`}>
              <h4 className={`text-sm font-bold ${c.text} mb-2`}>🧴 Grab these</h4>
              <div className="flex flex-wrap gap-2">
                {r.what_you_need.map((item, i) => (
                  <span key={i} className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${c.pillActive}`}>{item}</span>
                ))}
              </div>
            </div>
          )}

          {/* Steps */}
          {r.steps && r.steps.length > 0 && (
            <div className={`p-4 rounded-xl border ${c.border} ${c.bgCard}`}>
              <h4 className={`text-sm font-bold ${c.text} mb-3`}>Steps</h4>
              <div className="space-y-2">
                {r.steps.map((step, i) => {
                  const done = checkedSteps[i];
                  return (
                    <button key={i} onClick={() => setCheckedSteps(prev => ({ ...prev, [i]: !prev[i] }))}
                      className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all
                        ${done ? (c.d ? 'bg-emerald-900/30 border-emerald-600' : 'bg-emerald-50 border-emerald-300') : `${c.bgInset} ${c.border}`}`}>
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5
                        ${done ? 'bg-emerald-500 border-emerald-500 text-white' : c.border}`}>
                        {done ? <Check className="w-3.5 h-3.5" /> : <span className={`text-xs font-bold ${c.textMut}`}>{i + 1}</span>}
                      </div>
                      <span className={`text-sm ${done ? `line-through ${c.textMut}` : c.text}`}>{step}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Do NOT */}
          {r.do_not && r.do_not.length > 0 && (
            <div className={`p-4 rounded-xl border-2 ${c.riskHigh}`}>
              <h4 className={`text-sm font-bold mb-2 flex items-center gap-2 ${c.d ? 'text-red-300' : 'text-red-800'}`}>
                <ShieldAlert className="w-4 h-4" /> Do NOT
              </h4>
              <ul className="space-y-1">
                {r.do_not.map((item, i) => (
                  <li key={i} className={`text-sm flex items-start gap-2 ${c.d ? 'text-red-200' : 'text-red-900'}`}>
                    <X className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-red-500" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* If stain is set */}
          {r.if_stain_is_set && (
            <div className={`p-4 rounded-xl border ${c.warnBg}`}>
              <h4 className={`text-sm font-bold mb-1 ${c.d ? 'text-amber-300' : 'text-amber-800'}`}>🕐 If the stain is already set</h4>
              <p className={`text-sm ${c.d ? 'text-amber-200' : 'text-amber-900'}`}>{r.if_stain_is_set}</p>
            </div>
          )}

          {/* Success probability + pro tip */}
          {r.success_probability && (
            <p className={`text-sm ${c.successBg} border p-3 rounded-xl font-medium`}>📊 {r.success_probability}</p>
          )}
          {r.pro_tip && (
            <p className={`text-xs italic ${c.textSec}`}>💡 {r.pro_tip}</p>
          )}
        </div>
      );
    };

    return (
      <div>
        <div className={`p-5 rounded-2xl border ${c.border} ${c.bgCard} mb-4`}>
          <h3 className={`text-sm font-bold ${c.text} mb-3 flex items-center gap-2`}>
            <Droplets className="w-4 h-4" /> What's the stain?
          </h3>

          {/* Quick-select stains */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {STAIN_TYPES.map(s => (
              <button key={s.id} onClick={() => { setStainType(s.id); setStainCustom(''); }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all
                  ${stainType === s.id ? c.pillActive : c.pillInactive}`}>
                {s.label}
              </button>
            ))}
          </div>

          <input type="text" value={stainCustom}
            onChange={e => { setStainCustom(e.target.value); if (e.target.value) setStainType(''); }}
            placeholder="Or describe the stain..."
            className={`w-full px-4 py-2.5 rounded-xl border text-sm ${c.input} outline-none mb-3`} />

          {/* Fabric */}
          <span className={`text-xs font-semibold ${c.textSec} mb-2 block`}>Fabric</span>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {FABRIC_TYPES.map(f => (
              <button key={f} onClick={() => setFabric(f)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${fabric === f ? c.pillActive : c.pillInactive}`}>
                {f}
              </button>
            ))}
          </div>

          {/* Stain age */}
          <span className={`text-xs font-semibold ${c.textSec} mb-2 block`}>How old?</span>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {STAIN_AGES.map(a => (
              <button key={a.value} onClick={() => setStainAge(a.value)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${stainAge === a.value ? c.pillActive : c.pillInactive}`}>
                {a.label}
              </button>
            ))}
          </div>

          {/* Stain photo */}
          <div className="mb-4">
            {compressingStain ? (
              <div className={`flex items-center gap-2 p-3 rounded-xl border-2 border-dashed ${c.dropzone}`}>
                <Loader2 className={`w-4 h-4 animate-spin ${c.accent}`} />
                <span className={`text-xs ${c.textSec}`}>Compressing...</span>
              </div>
            ) : stainPreview ? (
              <div className="flex items-center gap-3">
                <img src={stainPreview} alt="Stain" className="w-16 h-16 object-cover rounded-lg border" />
                <span className={`text-xs ${c.textSec}`}>📸 Stain photo attached</span>
                <button onClick={() => { setStainPreview(null); setStainImage(null); if (stainPhotoRef.current) stainPhotoRef.current.value = ''; }}
                  className={`p-1 ${c.btnGhost} hover:text-red-500`}><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <button onClick={() => stainPhotoRef.current?.click()}
                className={`w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed text-xs font-medium ${c.dropzone} ${c.textMut}`}>
                <Camera className="w-4 h-4" /> Snap the stain (optional)
              </button>
            )}
            <input ref={stainPhotoRef} type="file" accept="image/*" onChange={handleStainPhoto} className="hidden" />
          </div>

          <button onClick={getStainHelp}
            disabled={loading || (!stainType && !stainCustom.trim() && !stainImage)}
            className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2
              ${(stainType || stainCustom.trim() || stainImage) && !loading ? c.btn : c.btnDis}`}>
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</> : <><Sparkles className="w-4 h-4" /> Help!</>}
          </button>
        </div>

        {renderStainResults()}
      </div>
    );
  };

  // ══════════════════════════════════════════
  // MAIN RENDER
  // ══════════════════════════════════════════
  return (
    <div className={c.text}>
      {renderHeader()}
      {activeTab === 'timers' && renderTimersTab()}
      {activeTab === 'advisor' && renderAdvisorTab()}
      {activeTab === 'stain' && renderStainTab()}
      {renderError()}
    </div>
  );
};

LaundroMat.displayName = 'LaundroMat';
export default LaundroMat;
