import React, { useState, useCallback, useMemo } from 'react';
import {
  Loader2, AlertTriangle, Copy, Check, ChevronDown, ChevronUp,
  Plus, Trash2, DollarSign, Scissors, BarChart3, Zap, ArrowRight,
  Search, Sparkles, Calendar, ShieldCheck, RefreshCw, X,
} from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';

// ════════════════════════════════════════════════════════════
// THEME
// ════════════════════════════════════════════════════════════
function useColors() {
  const { theme } = useTheme();
  const d = theme === 'dark';
  return {
    card: d ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-slate-200',
    input: d
      ? 'bg-zinc-900 border-zinc-600 text-zinc-50 placeholder:text-zinc-500 focus:border-indigo-500 focus:ring-indigo-500/20'
      : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-100',
    text: d ? 'text-zinc-50' : 'text-slate-900',
    textSec: d ? 'text-zinc-400' : 'text-slate-600',
    textMuted: d ? 'text-zinc-500' : 'text-slate-500',
    label: d ? 'text-zinc-300' : 'text-slate-700',
    accent: d ? 'text-indigo-400' : 'text-indigo-600',
    accentBg: d ? 'bg-indigo-900/30' : 'bg-indigo-100',
    btnPrimary: d ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white',
    btnSec: d ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-100' : 'bg-slate-100 hover:bg-slate-200 text-slate-800',
    btnDanger: d ? 'bg-red-900/30 hover:bg-red-900/50 text-red-300 border-red-700/50' : 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200',
    danger: d ? 'bg-red-900/20 border-red-700/50 text-red-200' : 'bg-red-50 border-red-200 text-red-800',
    dangerText: d ? 'text-red-400' : 'text-red-600',
    success: d ? 'bg-emerald-900/20 border-emerald-700/50 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-800',
    successText: d ? 'text-emerald-400' : 'text-emerald-600',
    warning: d ? 'bg-amber-900/20 border-amber-700/50 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-800',
    warningText: d ? 'text-amber-400' : 'text-amber-600',
    info: d ? 'bg-blue-900/20 border-blue-700/50 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-800',
    pillActive: d ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-indigo-600 border-indigo-600 text-white',
    pillInactive: d ? 'bg-zinc-700 border-zinc-600 text-zinc-300 hover:border-zinc-500' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300',
    divider: d ? 'border-zinc-700' : 'border-slate-200',
    quoteBg: d ? 'bg-zinc-900/60' : 'bg-slate-50',
    // Donut colors
    used: d ? '#6366f1' : '#4f46e5',
    underused: d ? '#f59e0b' : '#d97706',
    forgotten: d ? '#ef4444' : '#dc2626',
    keepGreen: d ? '#10b981' : '#059669',
  };
}

// ════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════
const USAGE_OPTIONS = [
  { value: 'daily', label: 'Daily', emoji: '🔥' },
  { value: 'weekly', label: 'Weekly', emoji: '📅' },
  { value: 'monthly', label: 'Monthly', emoji: '📆' },
  { value: 'rarely', label: 'Rarely', emoji: '😬' },
  { value: 'forgot', label: 'Forgot I had it', emoji: '💀' },
];

const CYCLE_OPTIONS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'weekly', label: 'Weekly' },
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

let _nextId = 1;
function newSub(overrides = {}) {
  return { id: _nextId++, name: '', cost: '', cycle: 'monthly', usage: '', ...overrides };
}

// ════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════
const SubSweep = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const c = useColors();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Currency
  const [currency, setCurrency] = useState('$');

  // Input mode
  const [inputMode, setInputMode] = useState('manual'); // manual | scan
  const [statementText, setStatementText] = useState('');
  const [scanning, setScanning] = useState(false);

  // Subscriptions
  const [subs, setSubs] = useState([newSub()]);

  // Results
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  // What-If simulator
  const [cutList, setCutList] = useState({});

  // UI
  const [expandedCards, setExpandedCards] = useState({});
  const [copiedItems, setCopiedItems] = useState({});
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  // ──────────────────────────────────────────
  // SUBSCRIPTION MANAGEMENT
  // ──────────────────────────────────────────
  const updateSub = useCallback((id, field, value) => {
    setSubs(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  }, []);

  const addSub = useCallback(() => {
    setSubs(prev => [...prev, newSub()]);
  }, []);

  const removeSub = useCallback((id) => {
    setSubs(prev => prev.length > 1 ? prev.filter(s => s.id !== id) : prev);
  }, []);

  const quickAdd = useCallback((item) => {
    setSubs(prev => {
      const empty = prev.find(s => !s.name.trim());
      if (empty) {
        return prev.map(s => s.id === empty.id ? { ...s, name: item.name, cost: item.cost, cycle: item.cycle } : s);
      }
      return [...prev, newSub({ name: item.name, cost: item.cost, cycle: item.cycle })];
    });
  }, []);

  // ──────────────────────────────────────────
  // STATEMENT SCANNER
  // ──────────────────────────────────────────
  const scanStatement = useCallback(async () => {
    if (!statementText.trim() || statementText.trim().length < 30) {
      setError('Please paste at least a few lines from your statement.');
      return;
    }
    setError('');
    setScanning(true);
    try {
      const data = await callToolEndpoint('sub-sweep', {
        action: 'parse',
        statement: statementText.trim(),
        currency,
      });
      if (data.subscriptions && data.subscriptions.length > 0) {
        const parsed = data.subscriptions.map(s => newSub({
          name: s.name,
          cost: s.cost,
          cycle: s.cycle || 'monthly',
          usage: s.usage_guess || '',
        }));
        setSubs(parsed);
        setInputMode('manual'); // switch to manual view so they see the list
      } else {
        setError('No recurring charges detected. Try pasting more lines or add manually.');
      }
    } catch (err) {
      setError(err.message || 'Failed to scan statement.');
    }
    setScanning(false);
  }, [statementText, currency, callToolEndpoint]);

  // ──────────────────────────────────────────
  // MAIN ANALYSIS
  // ──────────────────────────────────────────
  const validSubs = useMemo(() => subs.filter(s => s.name.trim() && Number(s.cost) > 0), [subs]);

  const runAnalysis = useCallback(async () => {
    if (validSubs.length === 0) {
      setError('Add at least one subscription with a name and cost.');
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
          name: s.name,
          cost: Number(s.cost),
          cycle: s.cycle,
          monthly_cost: monthlyEquiv(s.cost, s.cycle),
          usage: s.usage || 'unknown',
        })),
        currency,
      });
      setResults(data);
    } catch (err) {
      setError(err.message || 'Analysis failed.');
    }
  }, [validSubs, currency, callToolEndpoint]);

  const handleReset = useCallback(() => {
    setSubs([newSub()]);
    setResults(null);
    setError('');
    setCutList({});
    setExpandedCards({});
    setStatementText('');
    setInputMode('manual');
  }, []);

  const copyText = useCallback((text, key) => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopiedItems(p => ({ ...p, [key]: true }));
      setTimeout(() => setCopiedItems(p => ({ ...p, [key]: false })), 2000);
    }).catch(() => {});
  }, []);

  // ──────────────────────────────────────────
  // WHAT-IF CALCULATIONS
  // ──────────────────────────────────────────
  const totalMonthly = useMemo(() => validSubs.reduce((sum, s) => sum + monthlyEquiv(s.cost, s.cycle), 0), [validSubs]);
  const totalAnnual = totalMonthly * 12;

  const cutSavingsMonthly = useMemo(() => {
    return validSubs.reduce((sum, s) => {
      if (cutList[s.name]) return sum + monthlyEquiv(s.cost, s.cycle);
      return sum;
    }, 0);
  }, [validSubs, cutList]);
  const cutSavingsAnnual = cutSavingsMonthly * 12;
  const cutCount = Object.values(cutList).filter(Boolean).length;

  // ──────────────────────────────────────────
  // DONUT CHART (SVG)
  // ──────────────────────────────────────────
  const donutData = useMemo(() => {
    if (!results?.breakdown) return [];
    const cats = results.breakdown; // {used: X, underused: Y, forgotten: Z}
    const total = (cats.used || 0) + (cats.underused || 0) + (cats.forgotten || 0);
    if (total === 0) return [];
    const segments = [];
    let offset = 0;
    if (cats.used > 0) { segments.push({ pct: cats.used / total * 100, color: c.used, label: 'Used', amount: cats.used }); }
    if (cats.underused > 0) { segments.push({ pct: cats.underused / total * 100, color: c.underused, label: 'Underused', amount: cats.underused }); }
    if (cats.forgotten > 0) { segments.push({ pct: cats.forgotten / total * 100, color: c.forgotten, label: 'Forgotten', amount: cats.forgotten }); }
    segments.forEach(seg => { seg.offset = offset; offset += seg.pct; });
    return segments;
  }, [results, c.used, c.underused, c.forgotten]);

  const isRunning = loading || scanning;
  const canAnalyze = validSubs.length > 0 && !isRunning;

  // ════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════
  return (
    <div className={`space-y-6 ${c.text}`}>

      {/* ── HEADER ── */}
      <div className={`${c.card} border rounded-xl p-6`}>
        <div className={`mb-5 pb-4 border-b ${c.divider}`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>SubSweep 🧹</h2>
              <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>Find what you're wasting and sweep it away</p>
            </div>
            <select
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              className={`py-1 px-2 border rounded-lg text-xs font-semibold ${c.input} outline-none`}
            >
              {CURRENCIES.map(cur => <option key={cur} value={cur}>{cur}</option>)}
            </select>
          </div>
        </div>

        {/* ── INPUT MODE TABS ── */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setInputMode('manual')}
            className={`px-4 py-2 rounded-lg text-xs font-bold border transition-colors min-h-[36px] ${
              inputMode === 'manual' ? c.pillActive : c.pillInactive}`}
          >
            Add Manually
          </button>
          <button
            onClick={() => setInputMode('scan')}
            className={`px-4 py-2 rounded-lg text-xs font-bold border transition-colors min-h-[36px] ${
              inputMode === 'scan' ? c.pillActive : c.pillInactive}`}
          >
            Scan Statement
          </button>
        </div>

        {/* ── SCAN MODE ── */}
        {inputMode === 'scan' && (
          <div className="mb-4 space-y-3">
            <div>
              <label className={`text-sm font-bold ${c.label} block mb-1.5`}>
                Paste your bank or credit card statement
              </label>
              <textarea
                value={statementText}
                onChange={e => setStatementText(e.target.value)}
                placeholder={"03/01 NETFLIX.COM          15.49\n03/01 SPOTIFY USA           11.99\n03/03 AMZN*Prime            14.99\n03/05 GOOGLE *YouTubePrem   13.99\n03/07 PLANET FITNESS        24.99\n..."}
                className={`w-full p-4 border rounded-lg ${c.input} outline-none focus:ring-2 font-mono text-xs`}
                rows={7}
              />
              <p className={`text-[10px] ${c.textMuted} mt-1`}>
                We never store your data. The AI reads it once to find subscriptions, then forgets it.
              </p>
            </div>
            <button
              onClick={scanStatement}
              disabled={!statementText.trim() || scanning}
              className={`${c.btnPrimary} disabled:opacity-40 font-bold py-2.5 px-5 rounded-lg flex items-center gap-2 text-sm min-h-[44px]`}
            >
              {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {scanning ? 'Scanning...' : 'Find Subscriptions'}
            </button>
          </div>
        )}

        {/* ── MANUAL MODE ── */}
        {inputMode === 'manual' && (
          <div className="space-y-3">
            {/* Quick add */}
            <div>
              <button
                onClick={() => setShowQuickAdd(p => !p)}
                className={`text-xs font-bold ${c.accent} flex items-center gap-1`}
              >
                <Zap className="w-3 h-3" />
                Quick add common services
                {showQuickAdd ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              {showQuickAdd && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {QUICK_ADD.map(item => (
                    <button
                      key={item.name}
                      onClick={() => quickAdd(item)}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-colors min-h-[28px] ${c.pillInactive}`}
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Subscription rows */}
            <div className="space-y-2">
              {subs.map((sub) => (
                <div key={sub.id} className={`flex flex-wrap gap-2 p-3 rounded-lg border ${isDark ? 'border-zinc-700 bg-zinc-900/40' : 'border-slate-100 bg-slate-50/50'}`}>
                  <input
                    type="text"
                    value={sub.name}
                    onChange={e => updateSub(sub.id, 'name', e.target.value)}
                    placeholder="Service name"
                    className={`flex-1 min-w-[120px] px-3 py-2 border rounded-lg text-sm ${c.input} outline-none focus:ring-1`}
                  />
                  <div className="flex items-center gap-1">
                    <span className={`text-sm font-bold ${c.textMuted}`}>{currency}</span>
                    <input
                      type="number"
                      value={sub.cost}
                      onChange={e => updateSub(sub.id, 'cost', e.target.value)}
                      placeholder="0.00"
                      className={`w-20 px-2 py-2 border rounded-lg text-sm text-right ${c.input} outline-none focus:ring-1`}
                    />
                  </div>
                  <select
                    value={sub.cycle}
                    onChange={e => updateSub(sub.id, 'cycle', e.target.value)}
                    className={`px-2 py-2 border rounded-lg text-xs ${c.input} outline-none`}
                  >
                    {CYCLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <select
                    value={sub.usage}
                    onChange={e => updateSub(sub.id, 'usage', e.target.value)}
                    className={`px-2 py-2 border rounded-lg text-xs ${c.input} outline-none`}
                  >
                    <option value="">How often?</option>
                    {USAGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.emoji} {o.label}</option>)}
                  </select>
                  <button
                    onClick={() => removeSub(sub.id)}
                    className={`p-2 rounded-lg ${c.btnDanger} border min-h-[36px]`}
                    disabled={subs.length === 1}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <button onClick={addSub} className={`${c.btnSec} font-semibold py-2 px-4 rounded-lg flex items-center gap-1.5 text-xs min-h-[36px]`}>
              <Plus className="w-3.5 h-3.5" /> Add another
            </button>
          </div>
        )}

        {/* ── ANALYZE BUTTON ── */}
        <div className="flex gap-3 mt-5">
          <button
            onClick={runAnalysis}
            disabled={!canAnalyze}
            className={`flex-1 ${c.btnPrimary} disabled:opacity-40 disabled:cursor-not-allowed font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 min-h-[48px]`}
          >
            {loading && !scanning ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing...</>
            ) : (
              <><Scissors className="w-5 h-5" /> Analyze My Subscriptions</>
            )}
          </button>
          {results && (
            <button onClick={handleReset} className={`px-5 py-3 border-2 ${isDark ? 'border-zinc-600 text-zinc-300' : 'border-slate-300 text-slate-700'} font-semibold rounded-lg`}>
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className={`${c.danger} border rounded-lg p-4 flex items-start gap-3`}>
          <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${c.dangerText}`} />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* RESULTS                                                  */}
      {/* ══════════════════════════════════════════════════════════ */}
      {results && (
        <div className="space-y-5">

          {/* ── SUMMARY CARDS ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className={`${c.card} border rounded-xl p-4 text-center`}>
              <p className={`text-[10px] font-bold uppercase ${c.textMuted}`}>Monthly</p>
              <p className={`text-lg font-black ${c.text}`}>{fm(totalMonthly.toFixed(2), currency)}</p>
            </div>
            <div className={`${c.card} border rounded-xl p-4 text-center`}>
              <p className={`text-[10px] font-bold uppercase ${c.textMuted}`}>Annual</p>
              <p className={`text-lg font-black ${c.text}`}>{fm(totalAnnual.toFixed(0), currency)}</p>
            </div>
            <div className={`border rounded-xl p-4 text-center ${c.warning}`}>
              <p className={`text-[10px] font-bold uppercase ${c.warningText}`}>Wasted/mo</p>
              <p className={`text-lg font-black ${c.warningText}`}>{fm((results.wasted_monthly || 0).toFixed(2), currency)}</p>
            </div>
            <div className={`border rounded-xl p-4 text-center ${c.success}`}>
              <p className={`text-[10px] font-bold uppercase ${c.successText}`}>Could save/yr</p>
              <p className={`text-lg font-black ${c.successText}`}>{fm(((results.wasted_monthly || 0) * 12).toFixed(0), currency)}</p>
            </div>
          </div>

          {/* ── DONUT CHART + BREAKDOWN ── */}
          {donutData.length > 0 && (
            <div className={`${c.card} border rounded-xl p-5`}>
              <h3 className={`text-sm font-bold ${c.text} flex items-center gap-2 mb-4`}>
                <BarChart3 className={`w-4 h-4 ${c.accent}`} /> Where Your Money Goes
              </h3>
              <div className="flex items-center gap-6 flex-wrap">
                {/* SVG Donut */}
                <svg viewBox="0 0 100 100" className="w-32 h-32 flex-shrink-0 -rotate-90">
                  {donutData.map((seg, i) => {
                    const circumference = Math.PI * 70; // r=35
                    const strokeLen = (seg.pct / 100) * circumference;
                    const gapLen = circumference - strokeLen;
                    const dashOffset = -(seg.offset / 100) * circumference;
                    return (
                      <circle
                        key={i}
                        cx="50" cy="50" r="35"
                        fill="none"
                        stroke={seg.color}
                        strokeWidth="12"
                        strokeDasharray={`${strokeLen} ${gapLen}`}
                        strokeDashoffset={dashOffset}
                        strokeLinecap="round"
                      />
                    );
                  })}
                </svg>
                {/* Legend */}
                <div className="space-y-2">
                  {donutData.map((seg, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
                      <span className={`text-xs font-bold ${c.text}`}>{seg.label}</span>
                      <span className={`text-xs ${c.textMuted}`}>{fm(seg.amount.toFixed(2), currency)}/mo ({Math.round(seg.pct)}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── WHAT-IF SIMULATOR ── */}
          <div className={`${c.card} border rounded-xl p-5`}>
            <h3 className={`text-sm font-bold ${c.text} flex items-center gap-2 mb-1`}>
              <Sparkles className={`w-4 h-4 ${c.accent}`} /> What If You Cut These?
            </h3>
            <p className={`text-[10px] ${c.textMuted} mb-3`}>Toggle subscriptions to see real-time savings</p>

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
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => setCutList(p => ({ ...p, [sub.name]: !p[sub.name] }))}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      checked ? 'bg-red-500 border-red-500' : (isDark ? 'border-zinc-600' : 'border-slate-300')
                    }`}>
                      {checked && <X className="w-3 h-3 text-white" />}
                    </div>
                    <span className={`text-sm flex-1 ${checked ? 'line-through opacity-60' : ''} ${c.text}`}>{sub.name}</span>
                    {verdict && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        verdict === 'keep' ? c.success
                          : verdict === 'cancel' ? c.danger
                          : c.warning
                      }`}>
                        {verdict === 'keep' ? 'KEEP' : verdict === 'cancel' ? 'CUT' : 'MAYBE'}
                      </span>
                    )}
                    <span className={`text-xs font-bold ${c.textMuted} whitespace-nowrap`}>{fm(mo.toFixed(2), currency)}/mo</span>
                  </label>
                );
              })}
            </div>

            {/* Savings display */}
            <div className={`rounded-xl p-4 text-center ${cutCount > 0 ? c.success : c.quoteBg} border ${c.divider}`}>
              {cutCount > 0 ? (
                <>
                  <p className={`text-2xl font-black ${c.successText}`}>{fm(cutSavingsAnnual.toFixed(0), currency)}/year saved</p>
                  <p className={`text-xs ${isDark ? 'text-emerald-300' : 'text-emerald-700'} mt-1`}>
                    That's {fm(cutSavingsMonthly.toFixed(2), currency)}/month from {cutCount} subscription{cutCount !== 1 ? 's' : ''}
                  </p>
                  {results.savings_equivalents && results.savings_equivalents.length > 0 && (
                    <p className={`text-xs font-bold ${isDark ? 'text-emerald-200' : 'text-emerald-800'} mt-2`}>
                      ≈ {results.savings_equivalents[0]}
                    </p>
                  )}
                </>
              ) : (
                <p className={`text-sm ${c.textMuted}`}>Toggle subscriptions above to see how much you'd save</p>
              )}
            </div>
          </div>

          {/* ── PER-SUBSCRIPTION ANALYSIS ── */}
          {results.subscriptions && results.subscriptions.length > 0 && (
            <div className="space-y-3">
              <h3 className={`text-sm font-bold ${c.text} flex items-center gap-2`}>
                <DollarSign className={`w-4 h-4 ${c.accent}`} /> Subscription-by-Subscription
              </h3>
              {results.subscriptions.map((sub, idx) => {
                const expanded = !!expandedCards[idx];
                const verdictColor = sub.verdict === 'keep' ? c.success
                  : sub.verdict === 'cancel' ? c.danger : c.warning;
                return (
                  <div key={idx} className={`${c.card} border rounded-xl overflow-hidden`}>
                    <button
                      onClick={() => setExpandedCards(p => ({ ...p, [idx]: !p[idx] }))}
                      className="w-full p-4 flex items-center justify-between text-left min-h-[44px]"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-[9px] font-black px-2 py-1 rounded ${verdictColor}`}>
                          {sub.verdict === 'keep' ? '✓ KEEP' : sub.verdict === 'cancel' ? '✕ CUT' : '? MAYBE'}
                        </span>
                        <span className={`text-sm font-bold ${c.text}`}>{sub.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {sub.cancellation_difficulty && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded hidden sm:inline ${
                            sub.cancellation_difficulty === 'easy' ? c.success
                              : sub.cancellation_difficulty === 'hard' ? c.danger
                              : c.warning
                          }`}>
                            {sub.cancellation_difficulty === 'easy' ? '🟢 Easy' : sub.cancellation_difficulty === 'hard' ? '🔴 Hard' : '🟡 Medium'} cancel
                          </span>
                        )}
                        {sub.cost_per_use && (
                          <span className={`text-[10px] font-bold ${c.textMuted} hidden sm:inline`}>
                            {fm(sub.cost_per_use, currency)}/use
                          </span>
                        )}
                        {expanded ? <ChevronUp className={`w-4 h-4 ${c.textMuted}`} /> : <ChevronDown className={`w-4 h-4 ${c.textMuted}`} />}
                      </div>
                    </button>
                    {expanded && (
                      <div className={`px-4 pb-4 border-t ${c.divider} pt-3 space-y-3`}>
                        {/* Honesty line */}
                        {sub.honesty && (
                          <p className={`text-sm ${c.textSec} italic`}>"{sub.honesty}"</p>
                        )}
                        {/* Cost per use */}
                        {sub.cost_per_use && (
                          <div className={`${c.quoteBg} rounded-lg p-3`}>
                            <p className={`text-xs font-bold ${c.warningText}`}>
                              💰 Cost per use: {fm(sub.cost_per_use, currency)}
                            </p>
                            {sub.would_you_pay && (
                              <p className={`text-[10px] ${c.textMuted} mt-1`}>{sub.would_you_pay}</p>
                            )}
                          </div>
                        )}
                        {/* Free alternative */}
                        {sub.free_alternative && (
                          <div className={`${c.info} border rounded-lg p-3`}>
                            <p className={`text-xs font-bold ${isDark ? 'text-blue-200' : 'text-blue-800'}`}>
                              🔄 Free/cheaper alternative: {sub.free_alternative}
                            </p>
                          </div>
                        )}
                        {/* Cancellation */}
                        {sub.cancellation_steps && (
                          <div>
                            <p className={`text-[10px] font-bold ${c.label} uppercase mb-1`}>How to cancel:</p>
                            <p className={`text-xs ${c.textSec} leading-relaxed`}>{sub.cancellation_steps}</p>
                            {sub.cancellation_script && (
                              <div className="mt-2 flex items-start gap-2">
                                <div className={`flex-1 ${c.quoteBg} rounded-lg p-3`}>
                                  <p className={`text-[10px] font-bold ${c.textMuted} mb-1`}>Cancellation message:</p>
                                  <p className={`text-xs ${c.text}`}>{sub.cancellation_script}</p>
                                </div>
                                <button
                                  onClick={() => copyText(sub.cancellation_script, `cancel-${idx}`)}
                                  className={`${c.btnSec} p-2 rounded-lg min-h-[32px]`}
                                >
                                  {copiedItems[`cancel-${idx}`] ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                        {/* Seasonal note */}
                        {sub.seasonal_note && (
                          <div className={`${c.warning} border rounded-lg p-3 flex items-start gap-2`}>
                            <Calendar className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${c.warningText}`} />
                            <p className={`text-xs ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>{sub.seasonal_note}</p>
                          </div>
                        )}
                        {/* Retention tactics */}
                        {sub.retention_tactics && sub.retention_tactics.length > 0 && (
                          <div className={`${c.success} border rounded-lg p-3`}>
                            <p className={`text-[10px] font-bold ${c.successText} uppercase mb-1.5 flex items-center gap-1`}>
                              <ShieldCheck className="w-3 h-3" /> When you call to cancel, expect:
                            </p>
                            <div className="space-y-1">
                              {sub.retention_tactics.map((tactic, ti) => (
                                <p key={ti} className={`text-xs ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>• {tactic}</p>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── OVERALL RECOMMENDATION ── */}
          {results.overall && (
            <div className={`${c.info} border rounded-xl p-5`}>
              <div className="flex items-start gap-3">
                <ArrowRight className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                <div>
                  <h3 className={`text-sm font-bold mb-1 ${isDark ? 'text-blue-200' : 'text-blue-800'}`}>Bottom Line</h3>
                  <p className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>{results.overall}</p>
                </div>
              </div>
            </div>
          )}

          {/* ── PERMISSION TO CANCEL ── */}
          {results.permission_statements && results.permission_statements.length > 0 && (
            <div className={`${c.success} border-2 rounded-xl p-5`}>
              <h3 className={`text-sm font-bold ${c.successText} mb-3 flex items-center gap-2`}>
                💚 Permission Granted
              </h3>
              <div className="space-y-2">
                {results.permission_statements.map((perm, i) => (
                  <p key={i} className={`text-sm ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>{perm}</p>
                ))}
              </div>
            </div>
          )}

          <p className={`text-[10px] ${c.textMuted} text-center px-4`}>
            Prices and cancellation steps may vary — always verify before cancelling. Your subscription data stays in this session only — nothing is saved, stored, or shared.
          </p>
        </div>
      )}
    </div>
  );
};

SubSweep.displayName = 'SubSweep';
export default SubSweep;
