import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { usePersistentState } from '../hooks/usePersistentState';
import { useTheme } from '../hooks/useTheme';
import { useRegisterActions } from '../components/ActionBarContext';
import { useTranslation } from '../i18n/useTranslation';
import { currencySymbol } from '../utils/formatLocale';

// ════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════
const USAGE_OPTIONS = [
  { value: 'daily', tkey: 'ss_usage_daily', emoji: '🔥' },
  { value: 'weekly', tkey: 'ss_usage_weekly', emoji: '📅' },
  { value: 'monthly', tkey: 'ss_usage_monthly', emoji: '📆' },
  { value: 'rarely', tkey: 'ss_usage_rarely', emoji: '😬' },
  { value: 'forgot', tkey: 'ss_usage_forgot', emoji: '💀' },
];

const CYCLE_OPTIONS = [
  { value: 'monthly', tkey: 'ss_cycle_monthly' },
  { value: 'yearly', tkey: 'ss_cycle_yearly' },
  { value: 'weekly', tkey: 'ss_cycle_weekly' },
];

const STATUS_OPTIONS = [
  { value: 'active', tkey: 'ss_status_active', emoji: '🟢' },
  { value: 'cancelling', tkey: 'ss_status_cancelling', emoji: '🟡' },
  { value: 'paused', tkey: 'ss_status_paused', emoji: '⏸️' },
  { value: 'cancelled', tkey: 'ss_status_cancelled', emoji: '🔴' },
];

const QUICK_ADD = [
  { name: 'Netflix', cost: 15.49, cycle: 'monthly' },
  { name: 'Spotify', cost: 11.99, cycle: 'monthly' },
  { name: 'Amazon Prime', cost: 14.99, cycle: 'monthly' },
  { name: 'Disney+', cost: 13.99, cycle: 'monthly' },
  { name: 'YouTube Premium', cost: 13.99, cycle: 'monthly' },
  { name: 'Apple Music', cost: 10.99, cycle: 'monthly' },
  { name: 'Hulu', cost: 17.99, cycle: 'monthly' },
  { name: 'HBO Max', cost: 16.99, cycle: 'monthly' },
  { name: 'ChatGPT Plus', cost: 20.00, cycle: 'monthly' },
  { name: 'Gym membership', cost: 40.00, cycle: 'monthly' },
  { name: 'iCloud+', cost: 2.99, cycle: 'monthly' },
  { name: 'Adobe CC', cost: 59.99, cycle: 'monthly' },
];

const CURRENCIES = ['$', '€', '£', '¥', '₹', 'R$', '₩', 'A$', 'C$', 'CHF', 'kr', 'zł'];

const CATEGORIES = [
  { value: 'streaming', tkey: 'ss_cat_streaming', emoji: '📺' },
  { value: 'music', tkey: 'ss_cat_music', emoji: '🎵' },
  { value: 'productivity', tkey: 'ss_cat_productivity', emoji: '💻' },
  { value: 'fitness', tkey: 'ss_cat_fitness', emoji: '💪' },
  { value: 'news', tkey: 'ss_cat_news', emoji: '📰' },
  { value: 'cloud', tkey: 'ss_cat_cloud', emoji: '☁️' },
  { value: 'gaming', tkey: 'ss_cat_gaming', emoji: '🎮' },
  { value: 'food', tkey: 'ss_cat_food', emoji: '🍕' },
  { value: 'finance', tkey: 'ss_cat_finance', emoji: '💰' },
  { value: 'other', tkey: 'ss_cat_other', emoji: '📦' },
];

const catTkey = (v) => CATEGORIES.find(cat => cat.value === v)?.tkey;
const catEmoji = (v) => CATEGORIES.find(cat => cat.value === v)?.emoji || '📦';

const STORE_SUBS = 'ss-subs';
const STORE_HISTORY = 'ss-history';
const STORE_TRIALS = 'ss-trials';
const STORE_BUDGETS = 'ss-budgets';
const MAX_SUBS = 50;
const MAX_HISTORY = 24;
const MAX_TRIALS = 20;

function loadStore(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}
function saveStore(key, items, max) {
  try { localStorage.setItem(key, JSON.stringify(items.slice(0, max))); } catch {}
}

function fm(amount, sym) {
  const n = Number(amount) || 0;
  const rounded = n % 1 === 0 ? n.toString() : n.toFixed(2);
  if (['kr', 'zł'].includes(sym)) return `${rounded} ${sym}`;
  return `${sym}${rounded}`;
}

function monthlyEquiv(cost, cycle) {
  const c = Number(cost) || 0;
  if (cycle === 'yearly') return c / 12;
  if (cycle === 'weekly') return c * 4.33;
  return c;
}

function detectCurrency() {
  try {
    const l = (navigator.language || 'en-US').toLowerCase();
    const map = { 'en-us': '$', 'en-gb': '£', 'en-au': 'A$', 'en-ca': 'C$', 'en-in': '₹', 'pt-br': 'R$', 'de-ch': 'CHF', 'sv': 'kr', de: '€', fr: '€', es: '€', it: '€' };
    return map[l] || map[l.split('-')[0]] || '$';
  } catch { return '$'; }
}

let _nextId = Date.now();
function newSub(overrides = {}) {
  return {
    id: _nextId++, name: '', cost: '', cycle: 'monthly', usage: '', status: 'active',
    cancelledDate: null, renewalDate: '', category: '', priceHistory: [],
    shared: false, sharedWith: [], ...overrides,
  };
}

function newTrial(overrides = {}) {
  return {
    id: _nextId++, name: '', endDate: '', cost: '', cycle: 'monthly',
    usageCount: 0, verdict: '', ...overrides,
  };
}

// ════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════
const SubSweep = ({ tool }) => {
  const { callToolEndpoint, loading, userLocale, userCurrency, userRegion } = useClaudeAPI();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const sym = currencySymbol(userLocale, userCurrency);
  const catLabel = (v) => { const k = catTkey(v); return k ? t(k) : v; };

  const c = {
    card:          isDark ? 'bg-zinc-800' : 'bg-white',
    input: isDark
      ? 'bg-zinc-900 border-zinc-600 text-zinc-50 placeholder:text-zinc-500 focus:border-cyan-500 focus:ring-cyan-500/20'
      : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:ring-cyan-100',
    text: isDark ? 'text-zinc-50' : 'text-slate-900',
    labelText: isDark ? 'text-zinc-300' : 'text-slate-700',
    btnPrimary: isDark ? 'bg-cyan-600 hover:bg-cyan-500 text-white' : 'bg-cyan-600 hover:bg-cyan-700 text-white',
    btnDanger: isDark ? 'bg-red-900/30 hover:bg-red-900/50 text-red-300 border-red-700/50' : 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200',
    danger: isDark ? 'bg-red-900/20 border-red-700/50 text-red-200' : 'bg-red-50 border-red-200 text-red-800',
    success: isDark ? 'bg-emerald-900/20 border-emerald-700/50 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-800',
    warning: isDark ? 'bg-amber-900/20 border-amber-700/50 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-800',
    pillActive: isDark ? 'bg-cyan-600 border-cyan-500 text-white' : 'bg-cyan-600 border-cyan-600 text-white',
    pillInactive: isDark ? 'bg-zinc-700 border-zinc-600 text-zinc-300 hover:border-zinc-500' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300',
    quoteBg: isDark ? 'bg-zinc-900/60' : 'bg-slate-50',
    badge: isDark ? 'bg-zinc-700 text-zinc-300' : 'bg-slate-100 text-slate-600',
    used: isDark ? 'rgb(99,102,241)' : 'rgb(79,70,229)',
    underused: isDark ? 'rgb(245,158,11)' : 'rgb(217,119,6)',
    forgotten: isDark ? 'rgb(239,68,68)' : 'rgb(220,38,38)',
    cardAlt:       isDark ? 'bg-zinc-700/50' : 'bg-slate-50',
    textSecondary: isDark ? 'text-zinc-300' : 'text-gray-600',
    textMuted:     isDark ? 'text-zinc-500' : 'text-gray-400',
    required:      isDark ? 'text-amber-400' : 'text-amber-500',
    btnSecondary:  isDark ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    border:        isDark ? 'border-zinc-700' : 'border-gray-200',
  };
  c.textMuteded = c.textMuted;
  c.label = c.labelText;

  const linkStyle = isDark
    ? 'text-cyan-400 hover:text-cyan-300 underline underline-offset-2'
    : 'text-cyan-600 hover:text-cyan-700 underline underline-offset-2';

  // ── View ──
  const [view, setView] = useState('sweep');
  const [error, setError] = useState('');

  // ── Currency ── seed from the user's locale symbol when it matches an option,
  // else fall back to navigator-based detection.
  const [currency, setCurrency] = useState(() => (CURRENCIES.includes(sym) ? sym : detectCurrency()));

  // ── Input mode ──
  const [inputMode, setInputMode] = useState('manual');
  const [statementText, setStatementText] = useState('');
  const [scanning, setScanning] = useState(false);

  // ── Persistent subscription stack ──
  const [subs, setSubs] = useState(() => {
    const saved = loadStore(STORE_SUBS);
    return saved.length > 0 ? saved : [newSub()];
  });

  // ── Spending sessionHistory (monthly snapshots) ──
  const [sessionHistory, setSessionHistory] = useState(() => loadStore(STORE_HISTORY));

  // ── Results ──
  const [cutList, setCutList] = useState({});
  const [expandedCards, setExpandedCards] = useState({});
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  // ── Optimizer ──
  const [optResults, setOptResults] = useState(null);

  // ── Negotiate ──
  const [negService, setNegService] = useState('');
  const [negCost, setNegCost] = useState('');
  const [negCycle, setNegCycle] = useState('monthly');
  const [negResults, setNegResults] = useState(null);

  // ── Trials ──
  const [trials, setTrials] = useState(() => loadStore(STORE_TRIALS));
  const [trialName, setTrialName] = useState('');
  const [trialEnd, setTrialEnd] = useState('');
  const [trialCost, setTrialCost] = useState('');
  const [trialCycle, setTrialCycle] = useState('monthly');

  // ── Category budgets ──
  const [catBudgets, setCatBudgets] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORE_BUDGETS) || '{}'); } catch { return {}; }
  });

  // ── Split member input ──
  const [splitMember, setSplitMember] = useState('');

  // ── Refs ──
  const resultsRef = useRef(null);
  const negResultsRef = useRef(null);

  // ── Persistent results ──
  const [results, setResults] = usePersistentState('subsweep-results', null);
  const [_historyLog, _setHistoryLog] = usePersistentState('ss-historyLog', null); // sessionHistory persistence marker

  // ── Persist subs on change ──
  const persistSubs = useCallback((updated) => {
    setSubs(updated);
    saveStore(STORE_SUBS, updated, MAX_SUBS);
  }, []);

  const persistTrials = useCallback((updated) => {
    setTrials(updated);
    saveStore(STORE_TRIALS, updated, MAX_TRIALS);
  }, []);

  const persistBudgets = useCallback((updated) => {
    setCatBudgets(updated);
    try { localStorage.setItem(STORE_BUDGETS, JSON.stringify(updated)); } catch {}
  }, []);

  // ── Sub management ──
  const updateSub = useCallback((id, field, value) => {
    const updated = subs.map(s => {
      if (s.id !== id) return s;
      const u = { ...s, [field]: value };
      // Auto-set cancelledDate
      if (field === 'status' && value === 'cancelled' && !s.cancelledDate) {
        u.cancelledDate = new Date().toISOString();
      }
      if (field === 'status' && value === 'active') {
        u.cancelledDate = null;
      }
      // Track price changes
      if (field === 'cost' && s.cost && value && Number(value) !== Number(s.cost)) {
        const hist = [...(s.priceHistory || [])];
        if (hist.length === 0 || hist[hist.length - 1].cost !== Number(s.cost)) {
          hist.push({ cost: Number(s.cost), date: new Date().toISOString() });
        }
        u.priceHistory = hist.slice(-12);
      }
      return u;
    });
    persistSubs(updated);
  }, [subs, persistSubs]);

  const addSub = useCallback(() => {
    persistSubs([...subs, newSub()]);
  }, [subs, persistSubs]);

  const removeSub = useCallback((id) => {
    if (subs.length <= 1) return;
    persistSubs(subs.filter(s => s.id !== id));
  }, [subs, persistSubs]);

  const quickAddSub = useCallback((item) => {
    const empty = subs.find(s => !s.name.trim());
    if (empty) {
      persistSubs(subs.map(s => s.id === empty.id ? { ...s, name: item.name, cost: item.cost, cycle: item.cycle } : s));
    } else {
      persistSubs([...subs, newSub({ name: item.name, cost: item.cost, cycle: item.cycle })]);
    }
  }, [subs, persistSubs]);

  // ── Statement scanner ──
  const scanStatement = useCallback(async () => {
    if (!statementText.trim() || statementText.trim().length < 30) {
      setError(t('ss_err_scan_short'));
      return;
    }
    setError('');
    setScanning(true);
    try {
      const data = await callToolEndpoint('sub-sweep', {
        action: 'parse',
        statement: statementText.trim(),
        currency,
        userLocale, userCurrency, userRegion,
      });
      if (data.subscriptions?.length > 0) {
        const parsed = data.subscriptions.map(s => newSub({
          name: s.name, cost: s.cost, cycle: s.cycle || 'monthly', usage: s.usage_guess || '',
        }));
        persistSubs(parsed);
        setInputMode('manual');
      } else {
        setError(t('ss_err_scan_none'));
      }
    } catch (err) {
      setError(err.message || t('ss_err_scan_fail'));
    }
    setScanning(false);
  }, [statementText, currency, callToolEndpoint, persistSubs, userLocale, userCurrency, userRegion, t]);

  // ── Computed values ──
  const activeSubs = useMemo(() => subs.filter(s => s.status === 'active' || s.status === 'cancelling'), [subs]);
  const validSubs = useMemo(() => activeSubs.filter(s => s.name.trim() && Number(s.cost) > 0), [activeSubs]);
  const cancelledSubs = useMemo(() => subs.filter(s => s.status === 'cancelled' || s.status === 'paused'), [subs]);

  const totalMonthly = useMemo(() => validSubs.reduce((sum, s) => sum + monthlyEquiv(s.cost, s.cycle), 0), [validSubs]);
  const totalAnnual = totalMonthly * 12;

  // ── Savings from cancelled subs ──
  const cancelSavings = useMemo(() => {
    return cancelledSubs.reduce((acc, s) => {
      if (!s.cancelledDate || !s.cost) return acc;
      const mo = monthlyEquiv(s.cost, s.cycle);
      const days = Math.floor((Date.now() - new Date(s.cancelledDate).getTime()) / 86400000);
      const saved = mo * (days / 30);
      return acc + saved;
    }, 0);
  }, [cancelledSubs]);

  // ── What-if simulator ──
  const cutSavingsMonthly = useMemo(() => {
    return validSubs.reduce((sum, s) => cutList[s.name] ? sum + monthlyEquiv(s.cost, s.cycle) : sum, 0);
  }, [validSubs, cutList]);
  const cutSavingsAnnual = cutSavingsMonthly * 12;
  const cutCount = Object.values(cutList).filter(Boolean).length;

  // ── Donut chart ──
  const donutData = useMemo(() => {
    if (!results?.breakdown) return [];
    const cats = results.breakdown;
    const total = (cats.used || 0) + (cats.underused || 0) + (cats.forgotten || 0);
    if (total === 0) return [];
    const segments = [];
    let offset = 0;
    if (cats.used > 0) segments.push({ pct: cats.used / total * 100, color: c.used, label: t('ss_seg_used'), amount: cats.used });
    if (cats.underused > 0) segments.push({ pct: cats.underused / total * 100, color: c.underused, label: t('ss_seg_underused'), amount: cats.underused });
    if (cats.forgotten > 0) segments.push({ pct: cats.forgotten / total * 100, color: c.forgotten, label: t('ss_seg_forgotten'), amount: cats.forgotten });
    segments.forEach(seg => { seg.offset = offset; offset += seg.pct; });
    return segments;
  }, [results, c.used, c.underused, c.forgotten, t]);

  // ── Renewal radar ──
  const renewalAlerts = useMemo(() => {
    const now = new Date();
    return activeSubs
      .filter(s => s.renewalDate)
      .map(s => {
        const rd = new Date(s.renewalDate);
        const daysUntil = Math.ceil((rd - now) / 86400000);
        return { ...s, daysUntil, renewalDateObj: rd };
      })
      .filter(s => s.daysUntil >= -7 && s.daysUntil <= 90) // past week to 90 days out
      .sort((a, b) => a.daysUntil - b.daysUntil);
  }, [activeSubs]);

  // ── Price change alerts ──
  const priceAlerts = useMemo(() => {
    return subs.filter(s => {
      const hist = s.priceHistory || [];
      if (hist.length === 0 || !s.cost) return false;
      const lastRecorded = hist[hist.length - 1].cost;
      return Number(s.cost) > lastRecorded;
    }).map(s => {
      const prev = s.priceHistory[s.priceHistory.length - 1].cost;
      const curr = Number(s.cost);
      const pctIncrease = ((curr - prev) / prev * 100).toFixed(0);
      return { ...s, prevCost: prev, pctIncrease };
    });
  }, [subs]);

  // ── Category spending ──
  const categorySpending = useMemo(() => {
    const cats = {};
    validSubs.forEach(s => {
      const cat = s.category || 'other';
      if (!cats[cat]) cats[cat] = { total: 0, count: 0, subs: [] };
      const mo = monthlyEquiv(s.cost, s.cycle);
      cats[cat].total += mo;
      cats[cat].count++;
      cats[cat].subs.push(s);
    });
    return cats;
  }, [validSubs]);

  // ── Trial countdown ──
  const trialAlerts = useMemo(() => {
    const now = new Date();
    return trials
      .filter(tr => tr.endDate)
      .map(tr => {
        const end = new Date(tr.endDate);
        const daysLeft = Math.ceil((end - now) / 86400000);
        return { ...tr, daysLeft };
      })
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [trials]);

  // ── Snapshot sessionHistory for timeline ──
  const takeSnapshot = useCallback(() => {
    const now = new Date();
    const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const existing = sessionHistory.findIndex(h => h.key === key);
    const snap = { key, date: now.toISOString(), total: Math.round(totalMonthly * 100) / 100, count: validSubs.length, preview: `${validSubs.length} subs · $${Math.round(totalMonthly)}/mo`.slice(0, 40) };
    let updated;
    if (existing >= 0) {
      updated = [...sessionHistory];
      updated[existing] = snap;
    } else {
      updated = [...sessionHistory, snap];
    }
    updated.sort((a, b) => a.key.localeCompare(b.key));
    setSessionHistory(updated);
    saveStore(STORE_HISTORY, updated, MAX_HISTORY);
  }, [sessionHistory, totalMonthly, validSubs.length]);

  // ── Main analysis ──
  const runAnalysis = useCallback(async () => {
    if (validSubs.length === 0) {
      setError(t('ss_err_need_active'));
      return;
    }
    setError('');
    setResults(null);
    setCutList({});
    setExpandedCards({});

    try {
      const data = await callToolEndpoint('sub-sweep', {
        action: 'analyze',
        subscriptions: validSubs.map(s => ({
          name: s.name, cost: Number(s.cost), cycle: s.cycle,
          monthly_cost: monthlyEquiv(s.cost, s.cycle), usage: s.usage || 'unknown',
        })),
        currency,
        userLocale, userCurrency, userRegion,
      });
      setResults(data);
      takeSnapshot();
    } catch (err) {
      setError(err.message || t('ss_err_analysis_fail'));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validSubs, currency, callToolEndpoint, takeSnapshot, userLocale, userCurrency, userRegion, t]);

  // ── Optimize ──
  const runOptimize = useCallback(async () => {
    if (validSubs.length === 0) {
      setError(t('ss_err_need_active_first'));
      return;
    }
    setError('');
    setOptResults(null);
    try {
      const data = await callToolEndpoint('sub-sweep', {
        action: 'optimize',
        subscriptions: validSubs.map(s => ({
          name: s.name, cost: Number(s.cost), cycle: s.cycle,
        })),
        currency,
        userLocale, userCurrency, userRegion,
      });
      setOptResults(data);
    } catch (err) {
      setError(err.message || t('ss_err_optimize_fail'));
    }
  }, [validSubs, currency, callToolEndpoint, userLocale, userCurrency, userRegion, t]);

  // ── Negotiate ──
  const runNegotiate = useCallback(async () => {
    if (!negService.trim()) return;
    setError('');
    setNegResults(null);
    try {
      const data = await callToolEndpoint('sub-sweep', {
        action: 'negotiate',
        serviceName: negService.trim(),
        cost: negCost ? Number(negCost) : null,
        cycle: negCycle,
        currency,
        userLocale, userCurrency, userRegion,
      });
      setNegResults(data);
    } catch (err) {
      setError(err.message || t('ss_err_script_fail'));
    }
  }, [negService, negCost, negCycle, currency, callToolEndpoint, userLocale, userCurrency, userRegion, t]);

  // ── Reset ──
  const handleReset = useCallback(() => {
    setResults(null);
    setOptResults(null);
    setError('');
    setCutList({});
    setExpandedCards({});
    setStatementText('');
    setInputMode('manual');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Try Example: load 5 sample subs the user can analyze right away ──
  const loadExample = useCallback(() => {
    const sample = [
      newSub({ name: 'Netflix',         cost: 15.49, cycle: 'monthly', usage: 'weekly',  category: 'streaming' }),
      newSub({ name: 'Spotify',         cost: 11.99, cycle: 'monthly', usage: 'daily',   category: 'music' }),
      newSub({ name: 'Hulu',            cost: 17.99, cycle: 'monthly', usage: 'rarely',  category: 'streaming' }),
      newSub({ name: 'Adobe CC',        cost: 59.99, cycle: 'monthly', usage: 'monthly', category: 'productivity' }),
      newSub({ name: 'Gym membership',  cost: 40.00, cycle: 'monthly', usage: 'forgot',  category: 'fitness' }),
    ];
    persistSubs(sample);
    setInputMode('manual');
    setError('');
  }, [persistSubs]);

  // ── Build copy text ──
  const buildSummaryText = useCallback(() => {
    let out = `SUBSWEEP AUDIT\n`;
    out += `Active: ${validSubs.length} subs — ${fm(totalMonthly.toFixed(2), currency)}/mo (${fm(totalAnnual.toFixed(0), currency)}/yr)\n`;
    if (cancelledSubs.length > 0) {
      out += `Cancelled: ${cancelledSubs.length} — saved ${fm(cancelSavings.toFixed(0), currency)} so far\n`;
    }
    if (results) {
      out += `\nWasted/mo: ${fm((results.wasted_monthly || 0).toFixed(2), currency)}\n`;
      if (results.subscriptions) {
        out += '\nVERDICTS:\n';
        results.subscriptions.forEach(s => {
          out += `${s.verdict === 'keep' ? '✓' : s.verdict === 'cancel' ? '✕' : '?'} ${s.name} — ${s.honesty || ''}\n`;
        });
      }
      if (results.overall) out += `\nBottom line: ${results.overall}\n`;
    }
    out += '\n— Generated by DeftBrain · deftbrain.com';
    return out;
  }, [validSubs, totalMonthly, totalAnnual, cancelledSubs, cancelSavings, results, currency]);

  const isRunning = loading || scanning;

  // ─── Register export content ───
  useRegisterActions(buildSummaryText(), tool?.title);

  // ─── Scroll to results when ready ───
  useEffect(() => {
    if (results && resultsRef.current) {
      const timer = setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results]);

  // ─── Global Cmd/Ctrl+Enter — placed after all state/functions to avoid TDZ ───
  useEffect(() => {
    const handler = (e) => {
      if (e.key !== 'Enter' || !(e.metaKey || e.ctrlKey)) return;
      const tag = document.activeElement?.tagName;
      if (tag === 'SELECT') return;
      if (loading) return;
      if (view === 'sweep') runAnalysis();
      else if (view === 'optimize') runOptimize();
      else if (view === 'negotiate') runNegotiate();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, view]);


  // ════════════════════════════════════════════════════════════
  // NAV
  // ════════════════════════════════════════════════════════════
  const renderNav = () => (
    <div className="flex flex-wrap gap-1.5 mb-5">
      {[
        { key: 'sweep', label: t('ss_nav_sweep') },
        { key: 'radar', label: `${t('ss_nav_radar')}${renewalAlerts.filter(r => r.daysUntil <= 30).length ? ` (${renewalAlerts.filter(r => r.daysUntil <= 30).length})` : ''}` },
        { key: 'optimize', label: t('ss_nav_optimize') },
        { key: 'negotiate', label: t('ss_nav_negotiate') },
        { key: 'splits', label: t('ss_nav_splits') },
        { key: 'trials', label: `${t('ss_nav_trials')}${trialAlerts.filter(tr => tr.daysLeft <= 7 && tr.daysLeft >= 0).length ? ` (${trialAlerts.filter(tr => tr.daysLeft <= 7 && tr.daysLeft >= 0).length})` : ''}` },
        { key: 'budgets', label: t('ss_nav_budgets') },
        { key: 'tracker', label: `${t('ss_nav_tracker')}${cancelledSubs.length ? ` (${cancelledSubs.length})` : ''}` },
        { key: 'timeline', label: t('ss_nav_timeline') },
      ].map(tab => (
        <button key={tab.key} onClick={() => { setView(tab.key); setError(''); }}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors min-h-[32px] ${
            view === tab.key ? c.pillActive : c.pillInactive
          }`}>{tab.label}</button>
      ))}
    </div>
  );

  // ════════════════════════════════════════════════════════════
  // RENDER: SWEEP (main form + results)
  // ════════════════════════════════════════════════════════════
  const renderSweep = () => (
    <div className="space-y-5">
      <div className={`${c.card} border rounded-xl p-5`}>
        {/* Currency selector */}
        <div className="flex items-center justify-between mb-4">
          <select value={currency} onChange={e => setCurrency(e.target.value)}
            className={`py-1 px-2 border rounded-lg text-xs font-bold ${c.input} outline-none`}>
            {CURRENCIES.map(cur => <option key={cur} value={cur}>{cur}</option>)}
          </select>
        </div>

        {/* Input mode tabs */}
        <div className="flex gap-2 mb-4">
          <button onClick={() => setInputMode('manual')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors min-h-[32px] ${
              inputMode === 'manual' ? c.pillActive : c.pillInactive}`}>
            {t('ss_mode_manual')}
          </button>
          <button onClick={() => setInputMode('scan')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors min-h-[32px] ${
              inputMode === 'scan' ? c.pillActive : c.pillInactive}`}>
            {t('ss_mode_scan')}
          </button>
        </div>

        {/* Scan mode */}
        {inputMode === 'scan' && (
          <div className="mb-4 space-y-3">
            <div>
              <label className={`text-xs font-bold ${c.labelText} block mb-1.5`}>{t('ss_scan_label')} <span className={c.required}>*</span></label>
              <textarea value={statementText} onChange={e => setStatementText(e.target.value)}
                placeholder={t('ss_scan_ph')}
                className={`w-full p-3 border rounded-lg ${c.input} outline-none focus:ring-2 font-mono text-xs`} rows={6} />
              <p className={`text-[10px] ${c.textMuted} mt-1`}>{t('ss_scan_privacy')}</p>
            </div>
            <button onClick={scanStatement} disabled={!statementText.trim() || scanning}
              className={`${c.btnPrimary} disabled:opacity-40 font-bold py-2.5 px-5 rounded-lg flex items-center gap-2 text-xs min-h-[40px]`}>
              {scanning ? <span className="animate-spin">{tool?.icon ?? '🧹'}</span> : <span>🔍</span>}
              {scanning ? t('ss_scanning') : t('ss_find_subs')}
            </button>
          </div>
        )}

        {/* Manual mode */}
        {inputMode === 'manual' && (
          <div className="space-y-3">
            {/* Quick add */}
            <div>
              <button onClick={() => setShowQuickAdd(p => !p)}
                className={`text-xs font-bold ${c.textSecondary} flex items-center gap-1 min-h-[28px]`}>
                <span>⚡</span> {t('ss_quick_add')} <span>{showQuickAdd ? '▲' : '▼'}</span>
              </button>
              {showQuickAdd && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {QUICK_ADD.map(item => (
                    <button key={item.name} onClick={() => quickAddSub(item)}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-colors min-h-[28px] ${c.pillInactive}`}>
                      {item.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sub rows */}
            <div className="space-y-2">
              {subs.filter(s => s.status === 'active' || s.status === 'cancelling').map((sub) => (
                <div key={sub.id} className={`p-3 rounded-lg border ${isDark ? 'border-zinc-700 bg-zinc-900/40' : 'border-slate-100 bg-slate-50/50'}`}>
                  <div className="flex flex-wrap gap-2">
                    <input type="text" value={sub.name} onChange={e => updateSub(sub.id, 'name', e.target.value)}
                      placeholder={t('ss_ph_service')}
                      className={`flex-1 min-w-[120px] px-3 py-2 border rounded-lg text-xs ${c.input} outline-none focus:ring-1`} />
                    <div className="flex items-center gap-1">
                      <span className={`text-xs font-bold ${c.textMuted}`}>{currency}</span>
                      <input type="number" value={sub.cost} onChange={e => updateSub(sub.id, 'cost', e.target.value)}
                        placeholder="0.00"
                        className={`w-20 px-2 py-2 border rounded-lg text-xs text-right ${c.input} outline-none focus:ring-1`} />
                    </div>
                    <select value={sub.cycle} onChange={e => updateSub(sub.id, 'cycle', e.target.value)}
                      className={`px-2 py-2 border rounded-lg text-xs ${c.input} outline-none`}>
                      {CYCLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{t(o.tkey)}</option>)}
                    </select>
                    <select value={sub.usage} onChange={e => updateSub(sub.id, 'usage', e.target.value)}
                      className={`px-2 py-2 border rounded-lg text-xs ${c.input} outline-none`}>
                      <option value="">{t('ss_how_often')}</option>
                      {USAGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.emoji} {t(o.tkey)}</option>)}
                    </select>
                    <button onClick={() => removeSub(sub.id)} disabled={subs.length === 1}
                      className={`px-2 py-2 rounded-lg ${c.btnDanger} border min-h-[36px] text-xs`}>
                      🗑️
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <select value={sub.category || ''} onChange={e => updateSub(sub.id, 'category', e.target.value)}
                      className={`px-2 py-1 border rounded text-[10px] ${c.input} outline-none`}>
                      <option value="">{t('ss_category')}</option>
                      {CATEGORIES.map(cat => <option key={cat.value} value={cat.value}>{cat.emoji} {t(cat.tkey)}</option>)}
                    </select>
                    <input type="date" value={sub.renewalDate || ''} onChange={e => updateSub(sub.id, 'renewalDate', e.target.value)}
                      title={t('ss_renewal_title')}
                      className={`px-2 py-1 border rounded text-[10px] ${c.input} outline-none`} />
                    {sub.priceHistory?.length > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${c.warning} font-bold`}>
                        📈 {t('ss_was')} {fm(sub.priceHistory[sub.priceHistory.length - 1].cost, currency)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button onClick={addSub} className={`${c.btnSecondary} font-bold py-2 px-4 rounded-lg flex items-center gap-1.5 text-xs min-h-[36px]`}>
              ➕ {t('ss_add_another')}
            </button>
          </div>
        )}

        {/* Analyze + Example buttons */}
        <div className="flex flex-wrap gap-3 mt-5">
          <button onClick={runAnalysis} disabled={validSubs.length === 0 || isRunning}
            className={`flex-1 ${c.btnPrimary} disabled:opacity-40 font-bold py-3 rounded-lg flex items-center justify-center gap-2 min-h-[48px]`}>
            {loading && !scanning ? <><span className="animate-spin">{tool?.icon ?? '🧹'}</span> {t('ss_analyzing')}</> : <><span className="mr-1">{tool?.icon ?? '🧹'}</span> {t('ss_analyze_btn')}</>}
          </button>
        </div>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════
  // RENDER: SWEEP RESULTS
  // ════════════════════════════════════════════════════════════
  const renderResults = () => {
    if (!results || view !== 'sweep') return null;
    return (
      <div ref={resultsRef} className="space-y-5">
        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className={`${c.card} border rounded-xl p-4 text-center`}>
            <p className={`text-[10px] font-bold uppercase ${c.textMuted}`}>{t('ss_res_monthly')}</p>
            <p className={`text-lg font-black ${c.text}`}>{fm(totalMonthly.toFixed(2), currency)}</p>
          </div>
          <div className={`${c.card} border rounded-xl p-4 text-center`}>
            <p className={`text-[10px] font-bold uppercase ${c.textMuted}`}>{t('ss_res_annual')}</p>
            <p className={`text-lg font-black ${c.text}`}>{fm(totalAnnual.toFixed(0), currency)}</p>
          </div>
          <div className={`border rounded-xl p-4 text-center ${c.warning}`}>
            <p className={`text-[10px] font-bold uppercase ${c.warning}`}>{t('ss_res_wasted')}</p>
            <p className={`text-lg font-black ${c.warning}`}>{fm((results.wasted_monthly || 0).toFixed(2), currency)}</p>
          </div>
          <div className={`border rounded-xl p-4 text-center ${c.success}`}>
            <p className={`text-[10px] font-bold uppercase ${c.success}`}>{t('ss_res_could_save')}</p>
            <p className={`text-lg font-black ${c.success}`}>{fm(((results.wasted_monthly || 0) * 12).toFixed(0), currency)}</p>
          </div>
        </div>

        {/* Donut chart */}
        {donutData.length > 0 && (
          <div className={`${c.card} border rounded-xl p-5`}>
            <h3 className={`text-sm font-bold ${c.text} flex items-center gap-2 mb-4`}>
              <span>📊</span> {t('ss_donut_title')}
            </h3>
            <div className="flex items-center gap-6 flex-wrap">
              <svg viewBox="0 0 100 100" className="w-32 h-32 flex-shrink-0 -rotate-90">
                {donutData.map((seg, i) => {
                  const circumference = Math.PI * 70;
                  const strokeLen = (seg.pct / 100) * circumference;
                  const gapLen = circumference - strokeLen;
                  const dashOffset = -(seg.offset / 100) * circumference;
                  return (
                    <circle key={i} cx="50" cy="50" r="35" fill="none" stroke={seg.color}
                      strokeWidth="12" strokeDasharray={`${strokeLen} ${gapLen}`}
                      strokeDashoffset={dashOffset} strokeLinecap="round" />
                  );
                })}
              </svg>
              <div className="space-y-2">
                {donutData.map((seg, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
                    <span className={`text-xs font-bold ${c.text}`}>{seg.label}</span>
                    <span className={`text-xs ${c.textMuted}`}>{fm(seg.amount.toFixed(2), currency)}{t('ss_per_mo')} ({Math.round(seg.pct)}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* What-if simulator */}
        <div className={`${c.card} border rounded-xl p-5`}>
          <h3 className={`text-sm font-bold ${c.text} flex items-center gap-2 mb-1`}>
            <span>✨</span> {t('ss_whatif_title')}
          </h3>
          <p className={`text-[10px] ${c.textMuted} mb-3`}>{t('ss_whatif_sub')}</p>

          <div className="space-y-1.5 mb-4">
            {validSubs.map(sub => {
              const mo = monthlyEquiv(sub.cost, sub.cycle);
              const checked = !!cutList[sub.name];
              const analysis = results.subscriptions?.find(r => r.name === sub.name);
              const verdict = analysis?.verdict || '';
              return (
                <label key={sub.id} className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${
                  checked ? (isDark ? 'bg-red-900/20' : 'bg-red-50') : (isDark ? 'hover:bg-zinc-700/50' : 'hover:bg-slate-50')
                }`}>
                  <input type="checkbox" checked={checked}
                    onChange={() => setCutList(p => ({ ...p, [sub.name]: !p[sub.name] }))} className="sr-only" />
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    checked ? 'bg-red-500 border-red-500' : (isDark ? 'border-zinc-600' : 'border-slate-300')
                  }`}>
                    {checked && <span className="text-white text-[10px]">✕</span>}
                  </div>
                  <span className={`text-sm flex-1 ${checked ? 'line-through opacity-60' : ''} ${c.text}`}>{sub.name}</span>
                  {verdict && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      verdict === 'keep' ? c.success : verdict === 'cancel' ? c.danger : c.warning
                    }`}>
                      {verdict === 'keep' ? t('ss_verdict_keep') : verdict === 'cancel' ? t('ss_verdict_cut') : t('ss_verdict_maybe')}
                    </span>
                  )}
                  <span className={`text-xs font-bold ${c.textMuted} whitespace-nowrap`}>{fm(mo.toFixed(2), currency)}{t('ss_per_mo')}</span>
                </label>
              );
            })}
          </div>

          <div className={`rounded-xl p-4 text-center ${cutCount > 0 ? c.success : c.quoteBg} border ${c.border}`}>
            {cutCount > 0 ? (
              <>
                <p className={`text-2xl font-black ${c.success}`}>{t('ss_saved_year', { amount: fm(cutSavingsAnnual.toFixed(0), currency) })}</p>
                <p className={`text-xs ${isDark ? 'text-emerald-300' : 'text-emerald-700'} mt-1`}>
                  {t('ss_saved_detail', { monthly: fm(cutSavingsMonthly.toFixed(2), currency), count: cutCount })}
                </p>
                {results.savings_equivalents?.length > 0 && (
                  <p className={`text-xs font-bold ${isDark ? 'text-emerald-200' : 'text-emerald-800'} mt-2`}>
                    ≈ {results.savings_equivalents[0]}
                  </p>
                )}
              </>
            ) : (
              <p className={`text-sm ${c.textMuted}`}>{t('ss_whatif_empty')}</p>
            )}
          </div>
        </div>

        {/* Per-subscription analysis */}
        {results.subscriptions?.length > 0 && (
          <div className="space-y-3">
            <h3 className={`text-sm font-bold ${c.text} flex items-center gap-2`}>
              <span>💰</span> {t('ss_sub_by_sub')}
            </h3>
            {results.subscriptions.map((sub, idx) => {
              const expanded = !!expandedCards[idx];
              const verdictColor = sub.verdict === 'keep' ? c.success : sub.verdict === 'cancel' ? c.danger : c.warning;
              return (
                <div key={idx} className={`${c.card} border rounded-xl overflow-hidden`}>
                  <button onClick={() => setExpandedCards(p => ({ ...p, [idx]: !p[idx] }))}
                    className="w-full p-4 flex items-center justify-between text-left min-h-[44px]">
                    <div className="flex items-center gap-3">
                      <span className={`text-[9px] font-black px-2 py-1 rounded ${verdictColor}`}>
                        {sub.verdict === 'keep' ? t('ss_v_keep') : sub.verdict === 'cancel' ? t('ss_v_cut') : t('ss_v_maybe')}
                      </span>
                      <span className={`text-sm font-bold ${c.text}`}>{sub.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {sub.cancellation_difficulty && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded hidden sm:inline ${
                          sub.cancellation_difficulty === 'easy' ? c.success : sub.cancellation_difficulty === 'hard' ? c.danger : c.warning
                        }`}>
                          {sub.cancellation_difficulty === 'easy' ? t('ss_cancel_easy') : sub.cancellation_difficulty === 'hard' ? t('ss_cancel_hard') : t('ss_cancel_medium')} {t('ss_cancel_suffix')}
                        </span>
                      )}
                      {sub.cost_per_use && (
                        <span className={`text-[10px] font-bold ${c.textMuted} hidden sm:inline`}>{fm(sub.cost_per_use, currency)}{t('ss_per_use')}</span>
                      )}
                      <span className={`text-xs ${c.textMuted}`}>{expanded ? '▲' : '▼'}</span>
                    </div>
                  </button>
                  {expanded && (
                    <div className={`px-4 pb-4 border-t ${c.border} pt-3 space-y-3`}>
                      {sub.honesty && <p className={`text-sm ${c.textMuted} italic`}>"{sub.honesty}"</p>}
                      {sub.cost_per_use && (
                        <div className={`${c.quoteBg} rounded-lg p-3`}>
                          <p className={`text-xs font-bold ${c.warning}`}>💰 {t('ss_cost_per_use')} {fm(sub.cost_per_use, currency)}</p>
                          {sub.would_you_pay && <p className={`text-[10px] ${c.textMuted} mt-1`}>{sub.would_you_pay}</p>}
                        </div>
                      )}
                      {sub.free_alternative && (
                        <div className={`${c.cardAlt} border rounded-lg p-3`}>
                          <p className={`text-xs font-bold ${isDark ? 'text-sky-200' : 'text-sky-800'}`}>🔄 {t('ss_free_alt')} {sub.free_alternative}</p>
                        </div>
                      )}
                      {sub.cancellation_steps && (
                        <div>
                          <p className={`text-[10px] font-bold ${c.labelText} uppercase mb-1`}>{t('ss_how_to_cancel')}</p>
                          <p className={`text-xs ${c.textMuted} leading-relaxed`}>{sub.cancellation_steps}</p>
                          {sub.cancellation_script && (
                            <div className={`mt-2 ${c.quoteBg} rounded-lg p-3`}>
                              <p className={`text-[10px] font-bold ${c.textMuted} mb-1`}>{t('ss_cancel_message')}</p>
                              <p className={`text-xs ${c.text}`}>{sub.cancellation_script}</p>
                              <div className="mt-2">
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {sub.seasonal_note && (
                        <div className={`${c.warning} border rounded-lg p-3 flex items-start gap-2`}>
                          <span className="flex-shrink-0 mt-0.5">📅</span>
                          <p className={`text-xs ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>{sub.seasonal_note}</p>
                        </div>
                      )}
                      {sub.retention_tactics?.length > 0 && (
                        <div className={`${c.success} border rounded-lg p-3`}>
                          <p className={`text-[10px] font-bold ${c.success} uppercase mb-1.5 flex items-center gap-1`}>
                            🛡️ {t('ss_expect_retention')}
                          </p>
                          {sub.retention_tactics.map((tactic, ti) => (
                            <p key={ti} className={`text-xs ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>• {tactic}</p>
                          ))}
                        </div>
                      )}
                      {/* Mark as cancelled */}
                      {(sub.verdict === 'cancel' || sub.verdict === 'consider') && (
                        <button onClick={() => {
                          const match = subs.find(s => s.name === sub.name && s.status === 'active');
                          if (match) updateSub(match.id, 'status', 'cancelled');
                        }}
                          className={`text-xs font-bold ${c.danger} underline min-h-[28px]`}>
                          {t('ss_mark_cancelled')}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Overall */}
        {results.overall && (
          <div className={`${c.cardAlt} border rounded-xl p-5`}>
            <div className="flex items-start gap-3">
              <span className="text-lg flex-shrink-0">→</span>
              <div>
                <h3 className={`text-sm font-bold mb-1 ${isDark ? 'text-sky-200' : 'text-sky-800'}`}>{t('ss_bottom_line')}</h3>
                <p className={`text-sm ${isDark ? 'text-sky-300' : 'text-sky-700'}`}>{results.overall}</p>
              </div>
            </div>
          </div>
        )}

        {/* Permission */}
        {results.permission_statements?.length > 0 && (
          <div className={`${c.success} border-2 rounded-xl p-5`}>
            <h3 className={`text-sm font-bold ${c.success} mb-3`}>💚 {t('ss_permission_granted')}</h3>
            {results.permission_statements.map((perm, i) => (
              <p key={i} className={`text-sm ${isDark ? 'text-emerald-300' : 'text-emerald-700'} mb-1`}>{perm}</p>
            ))}
          </div>
        )}

        {/* Post-result cross-ref */}
        <div className={`${c.cardAlt} border ${c.border} rounded-xl p-4`}>
          <p className={`text-xs ${c.text} mb-1 font-bold`}>{t('ss_next_step')}</p>
          <p className={`text-xs ${c.textMuted}`}>
            {t('ss_next_step_body_pre')} <a href="/UpsellShield" className={linkStyle}>🛡️ {t('ss_upsellshield')}</a> {t('ss_next_step_body_post')}
          </p>
        </div>

        <p className={`text-[10px] ${c.textMuted} text-center px-4`}>
          {t('ss_sweep_disclaimer')}
        </p>
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════
  // RENDER: OPTIMIZE
  // ════════════════════════════════════════════════════════════
  const renderOptimize = () => (
    <div className="space-y-4">
      <div className={`${c.card} border rounded-xl p-5`}>
        <h3 className={`text-sm font-bold ${c.text} mb-1`}>⚡ {t('ss_opt_title')}</h3>
        <p className={`text-xs ${c.textMuted} mb-4`}>{t('ss_opt_sub')}</p>

        {validSubs.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-2xl mb-2">⚡</p>
            <p className={`text-xs ${c.textMuted}`}>{t('ss_opt_empty')}</p>
            <button onClick={() => setView('sweep')} className={`${c.btnPrimary} px-4 py-2 rounded-lg text-xs font-bold mt-3 min-h-[36px]`}>{t('ss_go_to_sweep')}</button>
          </div>
        ) : (
          <>
            <div className={`${c.quoteBg} rounded-lg p-3 mb-4`}>
              <p className={`text-[10px] font-bold ${c.labelText} uppercase mb-1.5`}>{t('ss_opt_your_subs')}</p>
              {validSubs.map((s, i) => (
                <p key={i} className="text-xs">{s.name} — {fm(s.cost, currency)}/{s.cycle}</p>
              ))}
            </div>
            <button onClick={runOptimize} disabled={loading}
              className={`w-full ${c.btnPrimary} disabled:opacity-40 font-bold py-3 rounded-lg flex items-center justify-center gap-2 min-h-[48px]`}>
              {loading ? <><span className="animate-spin">{tool?.icon ?? '🧹'}</span> {t('ss_optimizing')}</> : <><span>⚡</span> {t('ss_find_savings')}</>}
            </button>
          </>
        )}
      </div>

      {optResults && (
        <div className="space-y-4">
          {/* Total potential */}
          {optResults.total_potential_savings_annual > 0 && (
            <div className={`${c.success} border-2 rounded-xl p-5 text-center`}>
              <p className={`text-2xl font-black ${c.success}`}>{t('ss_opt_per_year', { amount: fm((optResults.total_potential_savings_annual || 0).toFixed(0), currency) })}</p>
              {optResults.total_potential_savings_monthly && (
                <p className={`text-sm ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>{t('ss_opt_per_month', { amount: fm(optResults.total_potential_savings_monthly, currency) })}</p>
              )}
              <p className={`text-xs ${isDark ? 'text-emerald-300' : 'text-emerald-700'} mt-1`}>{t('ss_opt_potential')}</p>
              {optResults.top_move && <p className="text-xs font-bold mt-2">🏆 {optResults.top_move}</p>}
            </div>
          )}

          {/* Per-service optimizations */}
          {optResults.optimizations?.map((opt, idx) => (
            opt.opportunities?.length > 0 && (
              <Section key={idx} icon="💡" title={opt.service} badge={`${opt.opportunities.length} ${opt.opportunities.length !== 1 ? t('ss_opt_options') : t('ss_opt_option')}`} defaultOpen c={c}>
                <div className="space-y-3">
                  {opt.current_plan && (
                    <p className={`text-xs ${c.textMuted}`}>{t('ss_opt_current')} {opt.current_plan} — {fm(opt.current_cost, currency)}{t('ss_opt_per_mo_short')}</p>
                  )}
                  {opt.opportunities.map((opp, oi) => (
                    <div key={oi} className={`${c.quoteBg} rounded-lg p-3`}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-bold">{opp.description}</p>
                          <p className={`text-[10px] ${c.textMuted} mt-0.5`}>{opp.type?.replace(/_/g, ' ')}</p>
                        </div>
                        {opp.savings_annual > 0 && (
                          <span className={`text-xs font-black ${c.success} whitespace-nowrap`}>-{fm(opp.savings_annual.toFixed(0), currency)}{t('ss_opt_per_yr_short')}</span>
                        )}
                        {opp.new_cost && (
                          <span className={`text-xs ${c.textMuted} whitespace-nowrap`}>{fm(opp.new_cost, currency)}{t('ss_opt_per_mo_short')}</span>
                        )}
                      </div>
                      {opp.how && <p className={`text-xs ${c.textMuted} mt-2`}>📋 {opp.how}</p>}
                      {opp.caveat && <p className={`text-[10px] ${c.warning} mt-1`}>⚠️ {opp.caveat}</p>}
                    </div>
                  ))}
                </div>
              </Section>
            )
          ))}

          {/* Bundle opportunities */}
          {optResults.bundle_opportunities?.length > 0 && (
            <Section icon="📦" title={t('ss_bundle_title')} badge={`${optResults.bundle_opportunities.length}`} defaultOpen c={c}>
              <div className="space-y-3">
                {optResults.bundle_opportunities.map((b, i) => (
                  <div key={i} className={`${c.success} border rounded-lg p-3`}>
                    <p className="text-xs font-bold">{b.bundle_name}</p>
                    <p className={`text-xs ${isDark ? 'text-emerald-300' : 'text-emerald-700'} mt-1`}>
                      {b.services_involved?.join(' + ')} — {fm(b.bundle_cost, currency)}{t('ss_opt_per_mo_short')} {t('ss_bundle_instead')} {fm(b.current_separate_cost, currency)}{t('ss_opt_per_mo_short')}
                    </p>
                    <p className={`text-xs font-black ${c.success} mt-1`}>{t('ss_bundle_saves', { amount: fm(b.savings_monthly, currency) })}</p>
                    {b.how && <p className={`text-[10px] ${c.textMuted} mt-1`}>📋 {b.how}</p>}
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>
      )}
    </div>
  );

  // ════════════════════════════════════════════════════════════
  // RENDER: NEGOTIATE
  // ════════════════════════════════════════════════════════════
  const renderNegotiate = () => (
    <div className="space-y-4">
      <div className={`${c.card} border rounded-xl p-5`}>
        <h3 className={`text-sm font-bold ${c.text} mb-1`}>📞 {t('ss_neg_title')}</h3>
        <p className={`text-xs ${c.textMuted} mb-4`}>{t('ss_neg_sub')}</p>

        <div className="space-y-3">
          {/* Quick pick from existing subs */}
          {validSubs.length > 0 && (
            <div>
              <p className={`text-[10px] font-bold ${c.labelText} uppercase mb-1.5`}>{t('ss_neg_pick')}</p>
              <div className="flex flex-wrap gap-1.5">
                {validSubs.map(s => (
                  <button key={s.id} onClick={() => { setNegService(s.name); setNegCost(String(s.cost)); setNegCycle(s.cycle); }}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-colors min-h-[28px] ${
                      negService === s.name ? c.pillActive : c.pillInactive
                    }`}>
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className={`text-xs font-bold ${c.labelText} block mb-1.5`}>{t('ss_neg_service_label')} <span className={c.required}>*</span></label>
            <input value={negService} onChange={e => setNegService(e.target.value)}
              placeholder={t('ss_neg_service_ph')}
              className={`w-full px-3 py-2 border rounded-lg text-xs ${c.input} outline-none focus:ring-2`} />
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className={`text-xs font-bold ${c.labelText} block mb-1.5`}>{t('ss_neg_current_cost')}</label>
              <input type="number" value={negCost} onChange={e => setNegCost(e.target.value)} placeholder={t('ss_neg_optional')}
                className={`w-full px-2 py-1.5 border rounded-lg text-xs ${c.input} outline-none`} />
            </div>
            <div className="flex-1">
              <label className={`text-xs font-bold ${c.labelText} block mb-1.5`}>{t('ss_neg_billing_cycle')}</label>
              <select value={negCycle} onChange={e => setNegCycle(e.target.value)}
                className={`w-full py-1.5 px-2 border rounded-lg text-xs ${c.input}`}>
                {CYCLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{t(o.tkey)}</option>)}
              </select>
            </div>
          </div>

          <button onClick={runNegotiate} disabled={loading || !negService.trim()}
            className={`w-full ${c.btnPrimary} disabled:opacity-40 font-bold py-3 rounded-lg flex items-center justify-center gap-2 min-h-[48px]`}>
            {loading ? <><span className="animate-spin">{tool?.icon ?? '🧹'}</span> {t('ss_neg_generating')}</> : <><span>📞</span> {t('ss_neg_get_script')}</>}
          </button>
        </div>
      </div>

      {negResults && (
        <div ref={negResultsRef} className="space-y-4">
          {/* eslint-disable-next-line no-unused-vars */}
          <span ref={resultsRef} className="sr-only" aria-hidden="true" />
          {/* Contact method */}
          {negResults.contact_method && (
            <div className={`${c.cardAlt} border rounded-xl p-4`}>
              <p className={`text-[10px] font-bold ${c.labelText} uppercase mb-1`}>📞 {t('ss_neg_reach')}</p>
              <p className="text-xs">{negResults.contact_method}</p>
              {negResults.best_time_to_call && (
                <p className={`text-xs ${c.textMuted} mt-1`}>⏰ {t('ss_neg_best_time')} {negResults.best_time_to_call}</p>
              )}
            </div>
          )}

          {/* Opening line */}
          {negResults.opening_line && (
            <div className={`${c.card} border rounded-xl p-4`}>
              <p className={`text-[10px] font-bold ${c.labelText} uppercase mb-1`}>{t('ss_neg_opening')}</p>
              <p className="text-sm font-bold italic">"{negResults.opening_line}"</p>
              <div className="mt-2">
              </div>
            </div>
          )}

          {/* Script steps */}
          {negResults.script_steps?.length > 0 && (
            <Section icon="📝" title={t('ss_neg_full_script')} defaultOpen c={c}>
              <div className="space-y-4">
                {negResults.script_steps.map((step, i) => (
                  <div key={i} className="space-y-2">
                    <p className={`text-[10px] font-bold ${c.textSecondary}`}>{t('ss_neg_step')} {step.step || i + 1}</p>
                    <div className={`${isDark ? 'bg-sky-900/20 border-sky-800' : 'bg-sky-50 border-sky-200'} border rounded-lg p-3`}>
                      <p className={`text-[10px] font-bold ${c.labelText} mb-0.5`}>{t('ss_neg_you_say')}</p>
                      <p className="text-xs font-bold">"{step.you_say}"</p>
                    </div>
                    <div className={`${c.quoteBg} rounded-lg p-3`}>
                      <p className={`text-[10px] font-bold ${c.labelText} mb-0.5`}>{t('ss_neg_theyll_say')}</p>
                      <p className="text-xs italic">{step.they_will_say}</p>
                    </div>
                    <div className={`${isDark ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200'} border rounded-lg p-3`}>
                      <p className={`text-[10px] font-bold ${c.labelText} mb-0.5`}>{t('ss_neg_your_response')}</p>
                      <p className="text-xs font-bold">"{step.your_response}"</p>
                    </div>
                    {step.tip && <p className={`text-[10px] ${c.textMuted}`}>💡 {step.tip}</p>}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Known offers */}
          {negResults.known_offers?.length > 0 && (
            <Section icon="🎁" title={t('ss_neg_known_offers')} c={c}>
              <div className="space-y-2">
                {negResults.known_offers.map((offer, i) => (
                  <div key={i} className={`${c.quoteBg} rounded-lg p-3`}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-bold">{offer.offer}</p>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        offer.should_accept ? c.success : c.warning
                      }`}>
                        {offer.should_accept ? t('ss_neg_accept') : t('ss_neg_wait')}
                      </span>
                    </div>
                    <p className={`text-[10px] ${c.textMuted} mt-0.5`}>{t('ss_neg_likelihood')} {offer.likelihood} — {offer.why}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Magic phrases */}
          {negResults.magic_phrases?.length > 0 && (
            <div className={`${isDark ? 'bg-cyan-900/20 border-cyan-800' : 'bg-cyan-50 border-cyan-200'} border rounded-xl p-4`}>
              <p className={`text-[10px] font-bold ${c.labelText} uppercase mb-2`}>🪄 {t('ss_neg_magic')}</p>
              {negResults.magic_phrases.map((p, i) => (
                <p key={i} className="text-xs font-bold mb-1">• "{p}"</p>
              ))}
              <div className="mt-2">
              </div>
            </div>
          )}

          {/* Walk away + nuclear */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {negResults.walk_away_threshold && (
              <div className={`${c.warning} border rounded-lg p-3`}>
                <p className={`text-[10px] font-bold ${c.warning} uppercase mb-1`}>🚶 {t('ss_neg_walk_away')}</p>
                <p className="text-xs">{negResults.walk_away_threshold}</p>
              </div>
            )}
            {negResults.nuclear_option && (
              <div className={`${c.danger} border rounded-lg p-3`}>
                <p className={`text-[10px] font-bold ${c.danger} uppercase mb-1`}>☢️ {t('ss_neg_nuclear')}</p>
                <p className="text-xs">{negResults.nuclear_option}</p>
              </div>
            )}
          </div>

          {/* Full script copy - actions at top */}
        </div>
      )}
    </div>
  );

  // ════════════════════════════════════════════════════════════
  // RENDER: TRACKER
  // ════════════════════════════════════════════════════════════
  const renderTracker = () => (
    <div className="space-y-4">
      {/* Savings hero */}
      {cancelSavings > 0 && (
        <div className={`${c.success} border-2 rounded-xl p-5 text-center`}>
          <p className="text-3xl mb-1">🎉</p>
          <p className={`text-3xl font-black ${c.success}`}>{fm(cancelSavings.toFixed(0), currency)}</p>
          <p className={`text-xs ${isDark ? 'text-emerald-300' : 'text-emerald-700'} mt-1`}>
            {t('ss_track_saved_since')}
          </p>
        </div>
      )}

      {/* Status management */}
      <div className={`${c.card} border rounded-xl p-5`}>
        <h3 className={`text-sm font-bold ${c.text} mb-1`}>📋 {t('ss_track_title')}</h3>
        <p className={`text-xs ${c.textMuted} mb-4`}>{t('ss_track_sub')}</p>

        {subs.length === 0 ? (
          <p className={`text-xs ${c.textMuted} text-center py-6`}>{t('ss_track_empty')}</p>
        ) : (
          <div className="space-y-2">
            {subs.map(sub => {
              const mo = monthlyEquiv(sub.cost, sub.cycle);
              const statusInfo = STATUS_OPTIONS.find(s => s.value === sub.status) || STATUS_OPTIONS[0];
              const daysSinceCancelled = sub.cancelledDate
                ? Math.floor((Date.now() - new Date(sub.cancelledDate).getTime()) / 86400000)
                : 0;
              const savedSoFar = sub.cancelledDate ? mo * (daysSinceCancelled / 30) : 0;

              return (
                <div key={sub.id} className={`flex flex-wrap items-center gap-2 px-3 py-2.5 rounded-lg border ${c.card} ${
                  sub.status === 'cancelled' ? (isDark ? 'opacity-70' : 'opacity-80') : ''
                }`}>
                  <span className="text-sm">{statusInfo.emoji}</span>
                  <span className={`text-xs font-bold flex-1 min-w-[80px] ${sub.status === 'cancelled' ? 'line-through' : ''} ${c.text}`}>
                    {sub.name || t('ss_track_unnamed')}
                  </span>
                  {sub.cost && (
                    <span className={`text-xs ${c.textMuted} whitespace-nowrap`}>{fm(mo.toFixed(2), currency)}{t('ss_opt_per_mo_short')}</span>
                  )}
                  {sub.status === 'cancelled' && savedSoFar > 0 && (
                    <span className={`text-[10px] font-bold ${c.success}`}>+{fm(savedSoFar.toFixed(0), currency)} {t('ss_track_saved')}</span>
                  )}
                  <select value={sub.status} onChange={e => updateSub(sub.id, 'status', e.target.value)}
                    className={`px-2 py-1 border rounded text-[10px] font-bold ${c.input}`}>
                    {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.emoji} {t(s.tkey)}</option>)}
                  </select>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <div className={`flex-1 text-center py-2 rounded-lg border ${c.card}`}>
            <p className={`text-xs font-black ${c.text}`}>{activeSubs.length}</p>
            <p className={`text-[10px] ${c.textMuted}`}>{t('ss_track_active')}</p>
          </div>
          <div className={`flex-1 text-center py-2 rounded-lg border ${c.success}`}>
            <p className={`text-xs font-black ${c.success}`}>{cancelledSubs.filter(s => s.status === 'cancelled').length}</p>
            <p className={`text-[10px] ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>{t('ss_track_cancelled')}</p>
          </div>
          <div className={`flex-1 text-center py-2 rounded-lg border ${c.warning}`}>
            <p className={`text-xs font-black ${c.warning}`}>{cancelledSubs.filter(s => s.status === 'paused').length}</p>
            <p className={`text-[10px] ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>{t('ss_track_paused')}</p>
          </div>
        </div>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════
  // RENDER: TIMELINE
  // ════════════════════════════════════════════════════════════
  const renderTimeline = () => {
    const sortedHistory = [...sessionHistory].sort((a, b) => a.key.localeCompare(b.key));
    const maxTotal = Math.max(...sortedHistory.map(h => h.total), totalMonthly, 1);

    return (
      <div className="space-y-4">
        <div className={`${c.card} border rounded-xl p-5`}>
          <h3 className={`text-sm font-bold ${c.text} mb-1`}>📈 {t('ss_tl_title')}</h3>
          <p className={`text-xs ${c.textMuted} mb-4`}>
            {t('ss_tl_sub')}
          </p>

          {sortedHistory.length < 2 ? (
            <div className="text-center py-8">
              <p className="text-2xl mb-2">📈</p>
              <p className={`text-xs ${c.textMuted} mb-1`}>{t('ss_tl_need_two')}</p>
              <p className={`text-[10px] ${c.textMuted}`}>{t('ss_tl_need_two_sub')}</p>
              {sortedHistory.length === 0 && (
                <button onClick={() => { takeSnapshot(); }} className={`${c.btnPrimary} px-4 py-2 rounded-lg text-xs font-bold mt-3 min-h-[36px]`}>
                  {t('ss_tl_take_now')}
                </button>
              )}
              {sortedHistory.length === 1 && (
                <p className={`text-xs ${c.textSecondary} font-bold mt-2`}>{t('ss_tl_one_recorded', { key: sortedHistory[0].key })}</p>
              )}
            </div>
          ) : (
            <>
              {/* Bar chart */}
              <div className="flex items-end gap-1" style={{ height: '160px' }}>
                {sortedHistory.map((snap, i) => {
                  const pct = (snap.total / maxTotal) * 100;
                  const isLatest = i === sortedHistory.length - 1;
                  const prev = i > 0 ? sortedHistory[i - 1].total : snap.total;
                  const diff = snap.total - prev;
                  return (
                    <div key={snap.key} className="flex-1 flex flex-col items-center justify-end h-full">
                      {/* Diff indicator */}
                      {i > 0 && (
                        <span className={`text-[8px] font-bold mb-0.5 ${diff > 0 ? c.danger : diff < 0 ? c.success : c.textMuted}`}>
                          {diff > 0 ? '+' : ''}{fm(diff.toFixed(0), currency)}
                        </span>
                      )}
                      {/* Bar */}
                      <div className={`w-full rounded-t transition-all ${isLatest
                        ? (isDark ? 'bg-cyan-500' : 'bg-cyan-600')
                        : (isDark ? 'bg-zinc-600' : 'bg-slate-300')
                      }`}
                        style={{ height: `${Math.max(pct, 5)}%` }}
                        title={`${snap.key}: ${fm(snap.total, currency)}/mo`}
                      />
                      {/* Label */}
                      <p className={`text-[8px] ${c.textMuted} mt-1 text-center`}>
                        {snap.key.split('-')[1]}/{snap.key.split('-')[0].slice(2)}
                      </p>
                      <p className={`text-[9px] font-bold ${c.text}`}>{fm(snap.total.toFixed(0), currency)}</p>
                    </div>
                  );
                })}
              </div>

              {/* Trend summary */}
              {sortedHistory.length >= 2 && (() => {
                const first = sortedHistory[0];
                const last = sortedHistory[sortedHistory.length - 1];
                const diff = last.total - first.total;
                const pctChange = first.total > 0 ? ((diff / first.total) * 100).toFixed(0) : 0;
                return (
                  <div className={`mt-4 ${diff > 0 ? c.warning : diff < 0 ? c.success : c.cardAlt} border rounded-lg p-3 text-center`}>
                    <p className="text-xs font-bold">
                      {diff > 0
                        ? t('ss_tl_increased', { amount: fm(Math.abs(diff).toFixed(0), currency), pct: pctChange, key: first.key })
                        : diff < 0
                        ? t('ss_tl_cut', { amount: fm(Math.abs(diff).toFixed(0), currency), pct: Math.abs(pctChange), key: first.key })
                        : t('ss_tl_flat', { key: first.key })
                      }
                    </p>
                  </div>
                );
              })()}
            </>
          )}
        </div>

        {/* Manual snapshot */}
        <div className={`${c.card} border rounded-xl p-4 flex items-center justify-between`}>
          <div>
            <p className={`text-xs font-bold ${c.text}`}>{t('ss_tl_manual')}</p>
            <p className={`text-[10px] ${c.textMuted}`}>{t('ss_tl_current', { amount: fm(totalMonthly.toFixed(2), currency), count: validSubs.length })}</p>
          </div>
          <button onClick={takeSnapshot} className={`${c.btnPrimary} px-4 py-2 rounded-lg text-xs font-bold min-h-[36px]`}>
            {t('ss_tl_snapshot')}
          </button>
        </div>

        {/* History list */}
        {sortedHistory.length > 0 && (
          <div className={`${c.card} border rounded-xl p-4`}>
            <div className="flex items-center justify-between mb-2">
              <p className={`text-[10px] font-bold ${c.labelText} uppercase`}>{t('ss_tl_history')}</p>
              <button onClick={() => {
                if (window.confirm(t('ss_tl_clear_confirm'))) {
                  setSessionHistory([]);
                  saveStore(STORE_HISTORY, [], MAX_HISTORY);
                }
              }} className={`text-[10px] ${c.danger} min-h-[24px]`}>{t('ss_tl_clear')}</button>
            </div>
            {sortedHistory.map(snap => (
              <div key={snap.key} className="flex items-center justify-between text-xs py-1">
                <span className={c.textMuted}>{snap.key}</span>
                <span className={`font-bold ${c.text}`}>{fm(snap.total, currency)}{t('ss_opt_per_mo_short')}</span>
                <span className={c.textMuted}>{snap.count} {t('ss_tl_subs_suffix')}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════
  // RENDER: RENEWAL RADAR
  // ════════════════════════════════════════════════════════════
  const renderRadar = () => {
    const overdue = renewalAlerts.filter(r => r.daysUntil < 0);
    const thisWeek = renewalAlerts.filter(r => r.daysUntil >= 0 && r.daysUntil <= 7);
    const thisMonth = renewalAlerts.filter(r => r.daysUntil > 7 && r.daysUntil <= 30);
    const later = renewalAlerts.filter(r => r.daysUntil > 30);

    const formatDate = (d) => {
      try { return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); } catch { return d; }
    };

    const RenewalRow = ({ sub, urgent }) => {
      const mo = monthlyEquiv(sub.cost, sub.cycle);
      return (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${c.card} text-xs`}>
          <span>{catEmoji(sub.category)}</span>
          <span className={`font-bold flex-1 ${c.text}`}>{sub.name}</span>
          <span className={`font-bold ${urgent ? c.danger : c.textMuted}`}>
            {sub.daysUntil < 0 ? t('ss_radar_ago', { n: Math.abs(sub.daysUntil) }) : sub.daysUntil === 0 ? t('ss_radar_today') : t('ss_radar_days', { n: sub.daysUntil })}
          </span>
          <span className={c.textMuted}>{formatDate(sub.renewalDate)}</span>
          <span className={`font-bold ${c.text}`}>
            {sub.cycle === 'yearly' ? fm(sub.cost, currency) : fm(mo.toFixed(2), currency)}
          </span>
        </div>
      );
    };

    return (
      <div className="space-y-4">
        <div className={`${c.card} border rounded-xl p-5`}>
          <h3 className={`text-sm font-bold ${c.text} mb-1`}>🔔 {t('ss_radar_title')}</h3>
          <p className={`text-xs ${c.textMuted} mb-4`}>{t('ss_radar_sub')}</p>

          {renewalAlerts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-2xl mb-2">🔔</p>
              <p className={`text-xs ${c.textMuted}`}>{t('ss_radar_empty')}</p>
              <button onClick={() => setView('sweep')} className={`${c.btnPrimary} px-4 py-2 rounded-lg text-xs font-bold mt-3 min-h-[36px]`}>{t('ss_go_to_sweep')}</button>
            </div>
          ) : (
            <div className="space-y-4">
              {overdue.length > 0 && (
                <div>
                  <p className={`text-[10px] font-bold ${c.danger} uppercase mb-2`}>{t('ss_radar_overdue')}</p>
                  <div className="space-y-1.5">{overdue.map(s => <RenewalRow key={s.id} sub={s} urgent />)}</div>
                </div>
              )}
              {thisWeek.length > 0 && (
                <div>
                  <p className={`text-[10px] font-bold ${c.warning} uppercase mb-2`}>{t('ss_radar_this_week')}</p>
                  <div className="space-y-1.5">{thisWeek.map(s => <RenewalRow key={s.id} sub={s} urgent />)}</div>
                </div>
              )}
              {thisMonth.length > 0 && (
                <div>
                  <p className={`text-[10px] font-bold ${c.labelText} uppercase mb-2`}>{t('ss_radar_this_month')}</p>
                  <div className="space-y-1.5">{thisMonth.map(s => <RenewalRow key={s.id} sub={s} />)}</div>
                </div>
              )}
              {later.length > 0 && (
                <div>
                  <p className={`text-[10px] font-bold ${c.textMuted} uppercase mb-2`}>{t('ss_radar_coming')}</p>
                  <div className="space-y-1.5">{later.map(s => <RenewalRow key={s.id} sub={s} />)}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Price hike alerts */}
        {priceAlerts.length > 0 && (
          <div className={`${c.warning} border-2 rounded-xl p-5`}>
            <h3 className={`text-sm font-bold ${c.warning} mb-3`}>📈 {t('ss_radar_price_hikes')}</h3>
            <div className="space-y-2">
              {priceAlerts.map(s => (
                <div key={s.id} className="flex items-center gap-2 text-xs">
                  <span className="font-bold">{s.name}</span>
                  <span className={c.textMuted}>{fm(s.prevCost, currency)} → {fm(s.cost, currency)}</span>
                  <span className={`font-black ${c.danger}`}>+{s.pctIncrease}%</span>
                  <button onClick={() => { setNegService(s.name); setNegCost(String(s.cost)); setView('negotiate'); }}
                    className={`ml-auto text-[10px] font-bold ${c.textSecondary} underline min-h-[24px]`}>
                    {t('ss_radar_negotiate')}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming cost summary */}
        {renewalAlerts.length > 0 && (
          <div className={`${c.card} border rounded-xl p-4`}>
            <p className={`text-[10px] font-bold ${c.labelText} uppercase mb-2`}>{t('ss_radar_next30')}</p>
            <p className={`text-xl font-black ${c.text}`}>
              {fm([...overdue, ...thisWeek, ...thisMonth].reduce((sum, s) => {
                return sum + (s.cycle === 'yearly' ? Number(s.cost) : monthlyEquiv(s.cost, s.cycle));
              }, 0).toFixed(2), currency)}
            </p>
          </div>
        )}
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════
  // RENDER: SPLITS
  // ════════════════════════════════════════════════════════════
  const renderSplits = () => {
    const sharedSubs = subs.filter(s => s.shared && s.sharedWith?.length > 0 && s.status === 'active');

    // Compute per-person totals
    const personTotals = {};
    sharedSubs.forEach(s => {
      const mo = monthlyEquiv(s.cost, s.cycle);
      const splitCount = (s.sharedWith?.length || 0) + 1; // +1 for the user
      const perPerson = mo / splitCount;
      s.sharedWith.forEach(name => {
        if (!personTotals[name]) personTotals[name] = { total: 0, subs: [] };
        personTotals[name].total += perPerson;
        personTotals[name].subs.push({ name: s.name, share: perPerson });
      });
    });

    return (
      <div className="space-y-4">
        <div className={`${c.card} border rounded-xl p-5`}>
          <h3 className={`text-sm font-bold ${c.text} mb-1`}>👥 {t('ss_split_title')}</h3>
          <p className={`text-xs ${c.textMuted} mb-4`}>{t('ss_split_sub')}</p>

          {/* Mark subs as shared */}
          <div className="space-y-2 mb-4">
            <p className={`text-[10px] font-bold ${c.labelText} uppercase`}>{t('ss_split_your_subs')}</p>
            {activeSubs.filter(s => s.name.trim()).map(sub => (
              <div key={sub.id} className={`px-3 py-2 rounded-lg border ${c.card}`}>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={!!sub.shared}
                    onChange={() => updateSub(sub.id, 'shared', !sub.shared)}
                    className="accent-cyan-500" />
                  <span className={`text-xs font-bold flex-1 ${c.text}`}>{sub.name}</span>
                  <span className={`text-xs ${c.textMuted}`}>{fm(monthlyEquiv(sub.cost, sub.cycle).toFixed(2), currency)}{t('ss_opt_per_mo_short')}</span>
                </div>
                {sub.shared && (
                  <div className="mt-2 ml-6">
                    <div className="flex flex-wrap gap-1 mb-1.5">
                      {(sub.sharedWith || []).map((name, i) => (
                        <span key={i} className={`text-[10px] px-2 py-0.5 rounded-full ${c.badge} font-bold flex items-center gap-1`}>
                          {name}
                          <button onClick={() => {
                            const updated = (sub.sharedWith || []).filter((_, idx) => idx !== i);
                            updateSub(sub.id, 'sharedWith', updated);
                          }} className={`${c.danger} font-bold`}>✕</button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-1">
                      <input value={splitMember} onChange={e => setSplitMember(e.target.value)}
                        placeholder={t('ss_split_add_person')}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && splitMember.trim()) {
                            updateSub(sub.id, 'sharedWith', [...(sub.sharedWith || []), splitMember.trim()]);
                            setSplitMember('');
                          }
                        }}
                        className={`flex-1 px-2 py-1 border rounded text-[10px] ${c.input} outline-none`} />
                      <button onClick={() => {
                        if (splitMember.trim()) {
                          updateSub(sub.id, 'sharedWith', [...(sub.sharedWith || []), splitMember.trim()]);
                          setSplitMember('');
                        }
                      }} className={`${c.btnPrimary} px-2 py-1 rounded text-[10px] font-bold min-h-[24px]`}>+</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Per-person breakdown */}
        {Object.keys(personTotals).length > 0 && (
          <div className={`${c.card} border rounded-xl p-5`}>
            <h3 className={`text-sm font-bold ${c.text} mb-3`}>💸 {t('ss_split_who_owes')}</h3>
            <div className="space-y-3">
              {Object.entries(personTotals).map(([name, data]) => (
                <div key={name} className={`${c.quoteBg} rounded-lg p-3`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-bold">{name}</span>
                    <span className={`text-sm font-black ${c.textSecondary}`}>{fm(data.total.toFixed(2), currency)}{t('ss_opt_per_mo_short')}</span>
                  </div>
                  {data.subs.map((s, i) => (
                    <p key={i} className={`text-[10px] ${c.textMuted}`}>• {s.name}: {fm(s.share.toFixed(2), currency)}{t('ss_opt_per_mo_short')}</p>
                  ))}
                </div>
              ))}
            </div>

            <div className="mt-4">
            </div>
          </div>
        )}

        {/* Your share */}
        {sharedSubs.length > 0 && (
          <div className={`${c.success} border rounded-xl p-4 text-center`}>
            <p className={`text-[10px] font-bold ${c.success} uppercase mb-1`}>{t('ss_split_your_savings')}</p>
            <p className={`text-lg font-black ${c.success}`}>
              {fm(sharedSubs.reduce((sum, s) => {
                const mo = monthlyEquiv(s.cost, s.cycle);
                const splitCount = (s.sharedWith?.length || 0) + 1;
                return sum + (mo - mo / splitCount);
              }, 0).toFixed(2), currency)}{t('ss_opt_per_mo_short')}
            </p>
            <p className={`text-[10px] ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
              {t('ss_split_vs_full', { count: sharedSubs.length })}
            </p>
          </div>
        )}
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════
  // RENDER: FREE TRIAL TRACKER
  // ════════════════════════════════════════════════════════════
  const renderTrials = () => {
    const addTrial = () => {
      if (!trialName.trim() || !trialEnd) return;
      const updated = [newTrial({ name: trialName.trim(), endDate: trialEnd, cost: trialCost, cycle: trialCycle }), ...trials];
      persistTrials(updated);
      setTrialName(''); setTrialEnd(''); setTrialCost(''); setTrialCycle('monthly');
    };

    const removeTrial = (id) => persistTrials(trials.filter(tr => tr.id !== id));

    const updateTrialUsage = (id, delta) => {
      persistTrials(trials.map(tr => tr.id === id ? { ...tr, usageCount: Math.max(0, (tr.usageCount || 0) + delta) } : tr));
    };

    const convertToSub = (trial) => {
      persistSubs([...subs, newSub({ name: trial.name, cost: trial.cost, cycle: trial.cycle })]);
      removeTrial(trial.id);
      setView('sweep');
    };

    return (
      <div className="space-y-4">
        <div className={`${c.card} border rounded-xl p-5`}>
          <h3 className={`text-sm font-bold ${c.text} mb-1`}>🆓 {t('ss_trial_title')}</h3>
          <p className={`text-xs ${c.textMuted} mb-4`}>{t('ss_trial_sub')}</p>

          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <div className="flex-1 min-w-[180px]">
                <label className={`text-xs font-bold ${c.labelText} block mb-1.5`}>{t('ss_trial_service_label')} <span className={c.required}>*</span></label>
                <input value={trialName} onChange={e => setTrialName(e.target.value)} placeholder={t('ss_trial_service_ph')}
                  className={`w-full px-3 py-2 border rounded-lg text-xs ${c.input} outline-none focus:ring-1`} />
              </div>
              <div>
                <label className={`text-xs font-bold ${c.labelText} block mb-1.5`}>{t('ss_trial_end_label')} <span className={c.required}>*</span></label>
                <input type="date" value={trialEnd} onChange={e => setTrialEnd(e.target.value)}
                  className={`px-2 py-2 border rounded-lg text-xs ${c.input} outline-none`} />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-1 flex-1">
                <span className={`text-xs ${c.textMuted}`}>{currency}</span>
                <input type="number" value={trialCost} onChange={e => setTrialCost(e.target.value)}
                  placeholder={t('ss_trial_cost_ph')} className={`flex-1 px-2 py-2 border rounded-lg text-xs ${c.input} outline-none`} />
              </div>
              <select value={trialCycle} onChange={e => setTrialCycle(e.target.value)}
                className={`px-2 py-2 border rounded-lg text-xs ${c.input}`}>
                {CYCLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{t(o.tkey)}</option>)}
              </select>
              <button onClick={addTrial} disabled={!trialName.trim() || !trialEnd}
                className={`${c.btnPrimary} px-4 py-2 rounded-lg text-xs font-bold min-h-[36px] disabled:opacity-40`}>
                {t('ss_trial_add')}
              </button>
            </div>
          </div>
        </div>

        {/* Active trials */}
        {trialAlerts.length > 0 && (
          <div className="space-y-3">
            {trialAlerts.map(trial => {
              const expired = trial.daysLeft < 0;
              const urgent = trial.daysLeft >= 0 && trial.daysLeft <= 3;
              const mo = trial.cost ? monthlyEquiv(trial.cost, trial.cycle || 'monthly') : 0;
              const costPerUse = trial.usageCount > 0 && mo > 0 ? mo / trial.usageCount : null;
              const trialDays = trial.endDate ? Math.ceil((new Date(trial.endDate) - (new Date(trial.endDate).getTime() - 14 * 86400000)) / 86400000) : 14;

              return (
                <div key={trial.id} className={`${c.card} border rounded-xl p-4 ${
                  expired ? 'opacity-60' : urgent ? (isDark ? 'border-red-700' : 'border-red-300') : ''
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm">{expired ? '⏰' : urgent ? '🔴' : trial.daysLeft <= 7 ? '🟡' : '🟢'}</span>
                    <span className={`text-sm font-bold flex-1 ${c.text}`}>{trial.name}</span>
                    <span className={`text-xs font-black ${expired ? c.danger : urgent ? c.warning : c.textMuted}`}>
                      {expired ? t('ss_trial_expired', { n: Math.abs(trial.daysLeft) }) : trial.daysLeft === 0 ? t('ss_trial_last_day') : t('ss_trial_days_left', { n: trial.daysLeft })}
                    </span>
                  </div>

                  {/* Progress bar */}
                  {!expired && trial.daysLeft >= 0 && (
                    <div className={`w-full h-2 rounded ${isDark ? 'bg-zinc-700' : 'bg-slate-200'} mb-2`}>
                      <div className={`h-full rounded transition-all ${trial.daysLeft <= 3 ? 'bg-red-500' : trial.daysLeft <= 7 ? 'bg-amber-500' : 'bg-green-500'}`}
                        style={{ width: `${Math.max(5, 100 - (trial.daysLeft / trialDays * 100))}%` }} />
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    {/* Usage counter */}
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateTrialUsage(trial.id, -1)}
                        className={`${c.btnSecondary} w-6 h-6 rounded text-xs font-bold flex items-center justify-center`}>−</button>
                      <span className={`text-xs font-bold ${c.text} w-6 text-center`}>{trial.usageCount || 0}</span>
                      <button onClick={() => updateTrialUsage(trial.id, 1)}
                        className={`${c.btnSecondary} w-6 h-6 rounded text-xs font-bold flex items-center justify-center`}>+</button>
                      <span className={`text-[10px] ${c.textMuted}`}>{t('ss_trial_uses')}</span>
                    </div>

                    {costPerUse !== null && (
                      <span className={`text-[10px] font-bold ${costPerUse > 10 ? c.danger : costPerUse > 5 ? c.warning : c.success}`}>
                        {t('ss_trial_per_use_keep', { amount: fm(costPerUse.toFixed(2), currency) })}
                      </span>
                    )}

                    <div className="ml-auto flex gap-1">
                      {!expired && (
                        <button onClick={() => convertToSub(trial)}
                          className={`text-[10px] font-bold ${c.textSecondary} underline min-h-[24px]`}>{t('ss_trial_keep')}</button>
                      )}
                      <button onClick={() => removeTrial(trial.id)}
                        className={`text-[10px] ${c.danger} min-h-[24px]`}>✕</button>
                    </div>
                  </div>

                  {/* Verdict */}
                  {!expired && trial.daysLeft <= 7 && (
                    <div className={`mt-2 text-xs ${c.textMuted} italic`}>
                      {trial.usageCount >= 5 ? t('ss_trial_v_worth', { n: trial.usageCount })
                        : trial.usageCount >= 2 ? t('ss_trial_v_marginal', { n: trial.usageCount, cost: costPerUse ? fm(costPerUse.toFixed(2), currency) + t('ss_per_use') : t('ss_trial_v_marginal_word') })
                        : trial.usageCount === 1 ? t('ss_trial_v_once')
                        : trial.daysLeft === 0 ? t('ss_trial_v_zero_today') : t('ss_trial_v_zero_days', { n: trial.daysLeft })
                      }
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {trialAlerts.length === 0 && trials.length === 0 && (
          <div className={`${c.cardAlt} border rounded-lg p-3 text-xs text-center`}>
            {t('ss_trial_protip')}
          </div>
        )}
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════
  // RENDER: CATEGORY BUDGETS
  // ════════════════════════════════════════════════════════════
  const renderBudgets = () => {
    const activeCats = Object.keys(categorySpending);

    return (
      <div className="space-y-4">
        <div className={`${c.card} border rounded-xl p-5`}>
          <h3 className={`text-sm font-bold ${c.text} mb-1`}>📊 {t('ss_budget_title')}</h3>
          <p className={`text-xs ${c.textMuted} mb-4`}>{t('ss_budget_sub')}</p>

          {/* Budget inputs */}
          <div className="space-y-2 mb-4">
            <p className={`text-[10px] font-bold ${c.labelText} uppercase`}>{t('ss_budget_set_limits')}</p>
            {CATEGORIES.map(cat => {
              const spending = categorySpending[cat.value];
              const budget = catBudgets[cat.value] || '';
              const over = spending && budget && spending.total > Number(budget);
              return (
                <div key={cat.value} className="flex items-center gap-2">
                  <span className="text-sm w-6 text-center">{cat.emoji}</span>
                  <span className={`text-xs flex-1 ${c.text}`}>{t(cat.tkey)}</span>
                  {spending && (
                    <span className={`text-[10px] font-bold ${over ? c.danger : c.success}`}>
                      {fm(spending.total.toFixed(2), currency)}
                    </span>
                  )}
                  <span className={`text-[10px] ${c.textMuted}`}>/</span>
                  <div className="flex items-center gap-0.5">
                    <span className={`text-[10px] ${c.textMuted}`}>{currency}</span>
                    <input type="number" value={budget} onChange={e => {
                      const updated = { ...catBudgets, [cat.value]: e.target.value };
                      persistBudgets(updated);
                    }}
                      placeholder="—"
                      className={`w-16 px-1.5 py-1 border rounded text-[10px] text-right ${c.input} outline-none ${
                        over ? (isDark ? 'border-red-600' : 'border-red-400') : ''
                      }`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Visual breakdown */}
        {activeCats.length > 0 && (
          <div className={`${c.card} border rounded-xl p-5`}>
            <h3 className={`text-sm font-bold ${c.text} mb-3`}>{t('ss_budget_by_category')}</h3>
            <div className="space-y-3">
              {activeCats.sort((a, b) => categorySpending[b].total - categorySpending[a].total).map(cat => {
                const data = categorySpending[cat];
                const budget = Number(catBudgets[cat]) || 0;
                const pct = budget > 0 ? Math.min((data.total / budget) * 100, 100) : 0;
                const over = budget > 0 && data.total > budget;

                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold">{catEmoji(cat)} {catLabel(cat)}</span>
                      <span className={`text-xs font-bold ${over ? c.danger : c.text}`}>
                        {fm(data.total.toFixed(2), currency)}
                        {budget > 0 && <span className={c.textMuted}> / {fm(budget, currency)}</span>}
                      </span>
                    </div>
                    {budget > 0 && (
                      <div className={`w-full h-2 rounded ${isDark ? 'bg-zinc-700' : 'bg-slate-200'}`}>
                        <div className={`h-full rounded transition-all ${over ? 'bg-red-500' : pct > 80 ? 'bg-amber-500' : 'bg-green-500'}`}
                          style={{ width: `${pct}%` }} />
                      </div>
                    )}
                    {over && (
                      <p className={`text-[10px] ${c.danger} mt-0.5`}>
                        ⚠️ {t('ss_budget_over_by', { amount: fm((data.total - budget).toFixed(2), currency), name: data.subs.sort((a, b) => monthlyEquiv(b.cost, b.cycle) - monthlyEquiv(a.cost, a.cycle))[0]?.name })}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {data.subs.map(s => (
                        <span key={s.id} className={`text-[9px] px-1.5 py-0.5 rounded ${c.badge}`}>
                          {s.name} {fm(monthlyEquiv(s.cost, s.cycle).toFixed(2), currency)}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Uncategorized warning */}
            {validSubs.some(s => !s.category) && (
              <div className={`${c.warning} border rounded-lg p-3 mt-4`}>
                <p className="text-xs">
                  ⚠️ {t('ss_budget_uncategorized', { count: validSubs.filter(s => !s.category).length })}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Total budget summary */}
        {Object.values(catBudgets).some(v => Number(v) > 0) && (
          <div className={`${c.card} border rounded-xl p-4`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-[10px] font-bold ${c.labelText} uppercase`}>{t('ss_budget_total')}</p>
                <p className={`text-lg font-black ${c.text}`}>
                  {fm(Object.values(catBudgets).reduce((sum, v) => sum + (Number(v) || 0), 0), currency)}{t('ss_opt_per_mo_short')}
                </p>
              </div>
              <div className="text-right">
                <p className={`text-[10px] font-bold ${c.labelText} uppercase`}>{t('ss_budget_total_spending')}</p>
                <p className={`text-lg font-black ${totalMonthly > Object.values(catBudgets).reduce((s, v) => s + (Number(v) || 0), 0) ? c.danger : c.success}`}>
                  {fm(totalMonthly.toFixed(2), currency)}{t('ss_opt_per_mo_short')}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════
  // MAIN RETURN
  // ════════════════════════════════════════════════════════════
  return (
    <div className={`space-y-4 ${c.text}`}>
      <div className={`${c.card} border ${c.border} rounded-xl shadow-sm p-5`}>
        <div className="pb-3 border-b border-zinc-500">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className={`text-xl font-bold ${c.text}`}>
                <span className="mr-2">{tool?.icon ?? '🧹'}</span>{tool?.title ?? 'SubSweep'}
              </h2>
              <p className={`text-sm ${c.textSecondary}`}>{tool?.tagline ?? t('ss_tagline')}</p>
              <button onClick={loadExample} disabled={isRunning} style={{ backgroundColor: (tool?.headerColor ?? '#888888') + '80' }} className={`mt-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border disabled:opacity-40 ${isDark ? 'text-white border-white/40' : 'text-gray-800 border-transparent'}`}>{t('try_example')}</button>
            </div>
            {(results || statementText.trim() || subs.some(s => s.name?.trim())) && (
              <button onClick={handleReset} className={`${c.btnSecondary} px-3 py-1.5 rounded-lg text-xs font-bold flex-shrink-0`}>
                ↺ {t('start_over')}
              </button>
            )}
          </div>
        </div>
      </div>
      {renderNav()}

      <p className={`text-[11px] ${c.textMuted} text-center -mt-2 mb-3`}>
        {t('ss_xref_pre')} <a href="/BillRescue" className={linkStyle}>💸 {t('ss_billrescue')}</a> {t('ss_xref_post')}
      </p>

      {error && (
        <div className={`${c.danger} border rounded-lg p-3 flex items-start gap-2 mb-3`}>
          <span className="flex-shrink-0">⚠️</span>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {view === 'sweep' && renderSweep()}
      {view === 'sweep' && renderResults()}
      {view === 'radar' && renderRadar()}
      {view === 'optimize' && renderOptimize()}
      {view === 'negotiate' && renderNegotiate()}
      {view === 'splits' && renderSplits()}
      {view === 'trials' && renderTrials()}
      {view === 'budgets' && renderBudgets()}
      {view === 'tracker' && renderTracker()}
      {view === 'timeline' && renderTimeline()}
    </div>
  );
};

SubSweep.displayName = 'SubSweep';

// ════════════════════════════════════════════════════════════
// COLLAPSIBLE SECTION (declared after SubSweep so PF-14's first-useState
// scan lands inside the main component, not this helper)
// ════════════════════════════════════════════════════════════
function Section({ icon, title, badge, badgeColor, children, defaultOpen = false, c }) {
  const [open, setOpen] = useState(defaultOpen);
  const ui = (
    <div className={`${c.card} border rounded-xl overflow-hidden`}>
      <button onClick={() => setOpen(!open)} className="w-full px-4 py-3 flex items-center gap-2 text-left min-h-[44px]">
        <span>{icon}</span>
        <span className={`text-xs font-bold flex-1 ${c.text}`}>{title}</span>
        {badge && <span className={`text-[9px] font-black px-2 py-0.5 rounded ${badgeColor || c.badge}`}>{badge}</span>}
        <span className={`text-xs ${c.textMuted}`}>{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className={`px-4 pb-4 border-t ${c.border} pt-3`}>{children}</div>}
    </div>
  );
  return ui;
}

export default SubSweep;
