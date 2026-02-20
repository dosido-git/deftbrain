import React, { useState, useCallback } from 'react';
import {
  Heart, Loader2, AlertTriangle, Copy, Check, ChevronDown, ChevronUp,
  MapPin, DollarSign, Clock, Sparkles, MessageCircle, RefreshCw,
  Utensils, Wine, Footprints, Music, Star, Lightbulb, Shuffle,
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
      ? 'bg-zinc-900 border-zinc-600 text-zinc-50 placeholder:text-zinc-500 focus:border-rose-500 focus:ring-rose-500/20'
      : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-rose-500 focus:ring-rose-100',
    text: d ? 'text-zinc-50' : 'text-slate-900',
    textSec: d ? 'text-zinc-400' : 'text-slate-600',
    textMuted: d ? 'text-zinc-500' : 'text-slate-500',
    label: d ? 'text-zinc-300' : 'text-slate-700',
    accent: d ? 'text-rose-400' : 'text-rose-600',
    accentBg: d ? 'bg-rose-900/30' : 'bg-rose-100',
    btnPrimary: d ? 'bg-rose-600 hover:bg-rose-500 text-white' : 'bg-rose-600 hover:bg-rose-700 text-white',
    btnSec: d ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-100' : 'bg-slate-100 hover:bg-slate-200 text-slate-800',
    danger: d ? 'bg-red-900/20 border-red-700/50 text-red-200' : 'bg-red-50 border-red-200 text-red-800',
    dangerText: d ? 'text-red-400' : 'text-red-600',
    success: d ? 'bg-emerald-900/20 border-emerald-700/50 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-800',
    successText: d ? 'text-emerald-400' : 'text-emerald-600',
    warning: d ? 'bg-amber-900/20 border-amber-700/50 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-800',
    warningText: d ? 'text-amber-400' : 'text-amber-600',
    info: d ? 'bg-blue-900/20 border-blue-700/50 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-800',
    pillActive: d ? 'bg-rose-600 border-rose-500 text-white' : 'bg-rose-600 border-rose-600 text-white',
    pillInactive: d ? 'bg-zinc-700 border-zinc-600 text-zinc-300 hover:border-zinc-500' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300',
    stopCard: d ? 'bg-zinc-900/60 border-zinc-700' : 'bg-slate-50 border-slate-200',
    quoteBg: d ? 'bg-zinc-900/60' : 'bg-rose-50/60',
    divider: d ? 'border-zinc-700' : 'border-slate-200',
    budgetBar: d ? 'bg-zinc-700' : 'bg-slate-200',
    budgetFill: 'bg-gradient-to-r from-rose-500 to-pink-500',
  };
}

// ════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════
const DATE_TYPES = [
  { id: 'casual', label: 'Casual', emoji: '😊', desc: 'Low-key and comfortable' },
  { id: 'romantic', label: 'Romantic', emoji: '🌹', desc: 'Intimate and special' },
  { id: 'adventurous', label: 'Adventurous', emoji: '🎢', desc: 'Try something new' },
  { id: 'first_date', label: 'First Date', emoji: '✨', desc: 'Impressive but not try-hard' },
  { id: 'anniversary', label: 'Anniversary', emoji: '💍', desc: 'Celebrate your story' },
  { id: 'stay_in', label: 'Stay-In', emoji: '🏠', desc: 'Cozy night at home' },
];

const BUDGET_PRESETS = {
  '$':  [25, 50, 75, 100, 150, 200],
  '€':  [20, 40, 60, 80, 120, 180],
  '£':  [20, 40, 60, 80, 120, 160],
  '¥':  [3000, 5000, 8000, 10000, 15000, 20000],
  '₹':  [500, 1000, 2000, 3000, 5000, 8000],
  'R$': [50, 100, 150, 250, 400, 600],
  '₩':  [20000, 40000, 60000, 80000, 120000, 150000],
  'A$': [30, 50, 80, 120, 170, 250],
  'C$': [30, 50, 80, 120, 170, 250],
  'CHF':[25, 50, 75, 100, 150, 200],
  'kr': [200, 400, 600, 800, 1200, 1800],
  'zł': [80, 150, 250, 400, 600, 800],
  '₱':  [500, 1000, 2000, 3000, 5000, 8000],
  '฿':  [500, 1000, 1500, 2500, 4000, 6000],
  'RM': [50, 100, 150, 250, 400, 600],
};

const CURRENCIES = [
  { symbol: '$',   label: 'USD $',    flag: '🇺🇸' },
  { symbol: '€',   label: 'EUR €',    flag: '🇪🇺' },
  { symbol: '£',   label: 'GBP £',    flag: '🇬🇧' },
  { symbol: '¥',   label: 'JPY ¥',    flag: '🇯🇵' },
  { symbol: '₹',   label: 'INR ₹',    flag: '🇮🇳' },
  { symbol: 'R$',  label: 'BRL R$',   flag: '🇧🇷' },
  { symbol: '₩',   label: 'KRW ₩',    flag: '🇰🇷' },
  { symbol: 'A$',  label: 'AUD A$',   flag: '🇦🇺' },
  { symbol: 'C$',  label: 'CAD C$',   flag: '🇨🇦' },
  { symbol: 'CHF', label: 'CHF',      flag: '🇨🇭' },
  { symbol: 'kr',  label: 'SEK/NOK/DKK kr', flag: '🇸🇪' },
  { symbol: 'zł',  label: 'PLN zł',   flag: '🇵🇱' },
  { symbol: '₱',   label: 'PHP ₱',    flag: '🇵🇭' },
  { symbol: '฿',   label: 'THB ฿',    flag: '🇹🇭' },
  { symbol: 'RM',  label: 'MYR RM',   flag: '🇲🇾' },
];

function getBudgetRange(sym) {
  const presets = BUDGET_PRESETS[sym] || BUDGET_PRESETS['$'];
  return { min: Math.round(presets[0] * 0.5), max: Math.round(presets[presets.length - 1] * 1.5), step: presets[0] <= 100 ? 5 : presets[0] <= 1000 ? 50 : 500 };
}

function formatMoney(amount, sym) {
  // Prefix symbols vs suffix
  if (['kr', 'zł'].includes(sym)) return `${amount} ${sym}`;
  return `${sym}${amount}`;
}

// ════════════════════════════════════════════════════════════
// AUTO-DETECT LOCALE
// ════════════════════════════════════════════════════════════
const LOCALE_TO_CURRENCY = {
  'en-us': '$', 'en-gb': '£', 'en-au': 'A$', 'en-ca': 'C$', 'en-nz': 'A$',
  'en-in': '₹', 'en-sg': '$', 'en-ph': '₱', 'en-my': 'RM', 'en-za': '$',
  'ja': '¥', 'ja-jp': '¥',
  'ko': '₩', 'ko-kr': '₩',
  'zh': '¥', 'zh-cn': '¥', 'zh-tw': '$', 'zh-hk': '$',
  'hi': '₹', 'hi-in': '₹', 'bn': '₹', 'ta': '₹', 'te': '₹', 'mr': '₹',
  'pt-br': 'R$', 'pt': '€', 'pt-pt': '€',
  'es-mx': '$', 'es-ar': '$', 'es-co': '$', 'es-cl': '$', 'es': '€', 'es-es': '€',
  'de': '€', 'de-de': '€', 'de-at': '€', 'de-ch': 'CHF',
  'fr': '€', 'fr-fr': '€', 'fr-ch': 'CHF', 'fr-ca': 'C$',
  'it': '€', 'it-it': '€',
  'nl': '€', 'nl-nl': '€',
  'sv': 'kr', 'sv-se': 'kr', 'nb': 'kr', 'no': 'kr', 'da': 'kr', 'da-dk': 'kr',
  'pl': 'zł', 'pl-pl': 'zł',
  'th': '฿', 'th-th': '฿',
  'ms': 'RM', 'ms-my': 'RM',
  'fil': '₱', 'tl': '₱',
  'tr': '€', 'tr-tr': '€',
  'ru': '€', 'ru-ru': '€',
  'ar': '$', 'ar-sa': '$',
};

function detectCurrency() {
  try {
    const locale = (navigator.language || 'en-US').toLowerCase();
    // Try exact match first, then language-only
    return LOCALE_TO_CURRENCY[locale]
      || LOCALE_TO_CURRENCY[locale.split('-')[0]]
      || '$';
  } catch {
    return '$';
  }
}

function detectLocation() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    // Timezone looks like "America/New_York", "Asia/Tokyo", "Europe/London"
    const parts = tz.split('/');
    if (parts.length < 2) return '';
    // Take the city part, replace underscores with spaces
    const city = parts[parts.length - 1].replace(/_/g, ' ');
    // Some timezones have 3 parts like "America/Indiana/Indianapolis"
    return city;
  } catch {
    return '';
  }
}

const STOP_ICONS = {
  drinks: Wine,
  dinner: Utensils,
  walk: Footprints,
  entertainment: Music,
  dessert: Utensils,
  activity: Star,
  default: MapPin,
};

function getStopIcon(type) {
  if (!type) return STOP_ICONS.default;
  const lower = type.toLowerCase();
  for (const [key, Icon] of Object.entries(STOP_ICONS)) {
    if (lower.includes(key)) return Icon;
  }
  if (lower.includes('bar') || lower.includes('cocktail') || lower.includes('wine')) return Wine;
  if (lower.includes('restaurant') || lower.includes('food') || lower.includes('eat')) return Utensils;
  if (lower.includes('park') || lower.includes('stroll') || lower.includes('waterfront')) return Footprints;
  if (lower.includes('show') || lower.includes('concert') || lower.includes('movie') || lower.includes('comedy')) return Music;
  return STOP_ICONS.default;
}

// ════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════
const DateNight = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const c = useColors();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Form — auto-detect defaults from browser locale
  const [currency, setCurrency] = useState(() => detectCurrency());
  const [budget, setBudget] = useState(() => {
    const sym = detectCurrency();
    const p = BUDGET_PRESETS[sym] || BUDGET_PRESETS['$'];
    return p[2]; // 3rd preset = medium default
  });
  const [dateType, setDateType] = useState('');
  const [location, setLocation] = useState(() => detectLocation());
  const [restrictions, setRestrictions] = useState('');
  const [lastTime, setLastTime] = useState('');
  const [startTime, setStartTime] = useState('7:00 PM');

  const presets = BUDGET_PRESETS[currency] || BUDGET_PRESETS['$'];
  const budgetRange = getBudgetRange(currency);
  const fm = useCallback((amt) => formatMoney(amt, currency), [currency]);

  const handleCurrencyChange = useCallback((sym) => {
    setCurrency(sym);
    const newPresets = BUDGET_PRESETS[sym] || BUDGET_PRESETS['$'];
    setBudget(newPresets[2]); // default to 3rd preset (medium)
  }, []);

  // Results
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [copiedItinerary, setCopiedItinerary] = useState(false);
  const [expandedPlanB, setExpandedPlanB] = useState(false);
  const [expandedConvo, setExpandedConvo] = useState(false);

  const handleGenerate = useCallback(async () => {
    if (!location.trim()) {
      setError('Please enter your city or neighborhood.');
      return;
    }
    if (!dateType) {
      setError('Please select a date type.');
      return;
    }
    setError('');
    setResults(null);
    setCopiedItinerary(false);

    try {
      const data = await callToolEndpoint('date-night', {
        budget,
        currency,
        dateType,
        location: location.trim(),
        restrictions: restrictions.trim(),
        lastTime: lastTime.trim(),
        startTime,
      });
      setResults(data);
    } catch (err) {
      setError(err.message || 'Failed to plan your date night. Please try again.');
    }
  }, [budget, currency, dateType, location, restrictions, lastTime, startTime, callToolEndpoint]);

  const handleShuffle = useCallback(() => {
    setResults(null);
    setCopiedItinerary(false);
    handleGenerate();
  }, [handleGenerate]);

  const handleReset = useCallback(() => {
    const detectedCurrency = detectCurrency();
    setCurrency(detectedCurrency);
    const p = BUDGET_PRESETS[detectedCurrency] || BUDGET_PRESETS['$'];
    setBudget(p[2]);
    setDateType('');
    setLocation(detectLocation());
    setRestrictions('');
    setLastTime('');
    setStartTime('7:00 PM');
    setResults(null);
    setError('');
    setCopiedItinerary(false);
    setExpandedPlanB(false);
    setExpandedConvo(false);
  }, []);

  const copyItinerary = useCallback(() => {
    if (!results?.itinerary) return;
    const stops = results.itinerary.map(s =>
      `${s.time} — ${s.venue_name}: ${s.description} (~${fm(s.estimated_cost)})`
    ).join('\n');
    const text = `Date Night Plan (${results.vibe_title || 'Tonight'})\nBudget: ${fm(budget)}\n\n${stops}\n\nTotal: ~${fm(results.total_estimated)}${results.buffer ? ` | Buffer: ~${fm(results.buffer)}` : ''}`;
    navigator.clipboard?.writeText(text).then(() => {
      setCopiedItinerary(true);
      setTimeout(() => setCopiedItinerary(false), 2000);
    }).catch(() => {});
  }, [results, budget, fm]);

  const totalSpent = results?.total_estimated || 0;
  const bufferAmount = results?.buffer || (budget - totalSpent);
  const spentPct = budget > 0 ? Math.min(100, (totalSpent / budget) * 100) : 0;
  const canGenerate = location.trim().length > 0 && dateType && !loading;

  // ════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════
  return (
    <div className={`space-y-6 ${c.text}`}>

      {/* ── HEADER ── */}
      <div className={`${c.card} border rounded-xl p-6`}>
        <div className={`mb-5 pb-4 border-b ${c.divider}`}>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>DateNight 💘</h2>
          <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>Budget-smart evening plans that feel intentional, not improvised</p>
        </div>

        {/* Currency + Budget */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <label className={`text-sm font-bold ${c.label}`}>
              Budget: <span className={c.accent}>{fm(budget)}</span>
            </label>
            <select
              value={currency}
              onChange={e => handleCurrencyChange(e.target.value)}
              className={`py-1 px-2 border rounded-lg text-xs font-semibold ${c.input} outline-none`}
            >
              {CURRENCIES.map(cur => (
                <option key={cur.symbol} value={cur.symbol}>{cur.flag} {cur.label}</option>
              ))}
            </select>
          </div>
          <input
            type="range"
            min={budgetRange.min}
            max={budgetRange.max}
            step={budgetRange.step}
            value={budget}
            onChange={e => setBudget(Number(e.target.value))}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-rose-500"
          />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {presets.map(p => (
              <button
                key={p}
                onClick={() => setBudget(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors min-h-[36px] ${
                  budget === p ? c.pillActive : c.pillInactive
                }`}
              >
                {fm(p)}
              </button>
            ))}
          </div>
        </div>

        {/* Date Type */}
        <div className="mb-5">
          <label className={`text-sm font-bold ${c.label} block mb-2`}>What kind of date?</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {DATE_TYPES.map(dt => (
              <button
                key={dt.id}
                onClick={() => setDateType(dateType === dt.id ? '' : dt.id)}
                className={`p-3 rounded-lg border text-left transition-colors min-h-[44px] ${
                  dateType === dt.id ? c.pillActive : c.pillInactive
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{dt.emoji}</span>
                  <span className="text-xs font-bold">{dt.label}</span>
                </div>
                <p className={`text-[10px] mt-0.5 ${dateType === dt.id ? 'text-white/70' : c.textMuted}`}>{dt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Location + Start Time */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <div className="sm:col-span-2">
            <label className={`text-sm font-bold ${c.label} block mb-1.5`}>City or neighborhood</label>
            <div className="relative">
              <MapPin className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${c.textMuted}`} />
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g., Brooklyn, Downtown Austin, Shibuya..."
                className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm ${c.input} outline-none focus:ring-2`}
              />
            </div>
          </div>
          <div>
            <label className={`text-sm font-bold ${c.label} block mb-1.5`}>Start time</label>
            <select
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              className={`w-full py-2.5 px-3 border rounded-lg text-sm ${c.input} outline-none focus:ring-2`}
            >
              {['5:00 PM','5:30 PM','6:00 PM','6:30 PM','7:00 PM','7:30 PM','8:00 PM','8:30 PM','9:00 PM','9:30 PM','10:00 PM'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Restrictions */}
        <div className="mb-5">
          <label className={`text-sm font-bold ${c.label} block mb-1.5`}>
            Dietary restrictions or dealbreakers <span className={`font-normal ${c.textMuted}`}>(optional)</span>
          </label>
          <input
            type="text"
            value={restrictions}
            onChange={e => setRestrictions(e.target.value)}
            placeholder="e.g., vegetarian, no loud venues, wheelchair accessible..."
            className={`w-full py-2.5 px-3 border rounded-lg text-sm ${c.input} outline-none focus:ring-2`}
          />
        </div>

        {/* Last time */}
        <div className="mb-5">
          <label className={`text-sm font-bold ${c.label} block mb-1.5`}>
            What did you do last time? <span className={`font-normal ${c.textMuted}`}>(optional — helps avoid repeats)</span>
          </label>
          <input
            type="text"
            value={lastTime}
            onChange={e => setLastTime(e.target.value)}
            placeholder="e.g., Sushi and a movie, stayed in and cooked..."
            className={`w-full py-2.5 px-3 border rounded-lg text-sm ${c.input} outline-none focus:ring-2`}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className={`flex-1 ${c.btnPrimary} disabled:opacity-40 disabled:cursor-not-allowed font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 min-h-[48px]`}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Planning your evening...
              </>
            ) : (
              <>
                <Heart className="w-5 h-5" />
                Plan My Date Night
              </>
            )}
          </button>
          {results && (
            <>
              <button onClick={handleShuffle} disabled={loading} className={`px-4 py-3 ${c.btnSec} font-semibold rounded-lg flex items-center gap-1.5 min-h-[48px]`}>
                <Shuffle className="w-4 h-4" />
                <span className="hidden sm:inline">New Plan</span>
              </button>
              <button onClick={handleReset} className={`px-4 py-3 border-2 ${isDark ? 'border-zinc-600 text-zinc-300' : 'border-slate-300 text-slate-700'} font-semibold rounded-lg min-h-[48px]`}>
                Reset
              </button>
            </>
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

          {/* ── VIBE TITLE ── */}
          {results.vibe_title && (
            <div className={`${c.quoteBg} border ${c.divider} rounded-xl p-5 text-center`}>
              <p className={`text-lg font-bold ${c.text}`}>{results.vibe_title}</p>
              {results.vibe_description && (
                <p className={`text-sm ${c.textSec} mt-1`}>{results.vibe_description}</p>
              )}
            </div>
          )}

          {/* ── BUDGET BAR ── */}
          <div className={`${c.card} border rounded-xl p-5`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className={`text-sm font-bold ${c.text} flex items-center gap-2`}>
                <DollarSign className={`w-4 h-4 ${c.accent}`} />
                Budget Breakdown
              </h3>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-bold ${c.text}`}>~{fm(totalSpent)} of {fm(budget)}</span>
                <button
                  onClick={copyItinerary}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold ${c.btnSec} min-h-[28px]`}
                >
                  {copiedItinerary ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copiedItinerary ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
            <div className={`w-full h-3 rounded-full ${c.budgetBar} overflow-hidden`}>
              <div
                className={`h-full rounded-full ${c.budgetFill}`}
                style={{ width: `${spentPct}%`, transition: 'width 0.5s ease' }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className={`text-[10px] font-bold ${c.textMuted}`}>Planned</span>
              {bufferAmount > 0 && (
                <span className={`text-[10px] font-bold ${c.successText}`}>~{fm(bufferAmount)} buffer for surprises</span>
              )}
            </div>
          </div>

          {/* ── ITINERARY ── */}
          {results.itinerary && results.itinerary.length > 0 && (
            <div className="space-y-3">
              <h3 className={`text-sm font-bold ${c.text} flex items-center gap-2`}>
                <Clock className={`w-4 h-4 ${c.accent}`} />
                Your Evening
              </h3>

              {/* Timeline */}
              <div className="relative">
                {/* Vertical line */}
                <div className={`absolute left-5 top-6 bottom-6 w-px ${isDark ? 'bg-zinc-700' : 'bg-rose-200'}`} />

                <div className="space-y-4">
                  {results.itinerary.map((stop, idx) => {
                    const StopIcon = getStopIcon(stop.stop_type || stop.venue_name);
                    return (
                      <div key={idx} className="flex gap-4 relative">
                        {/* Timeline dot */}
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center z-10 ${
                          isDark ? 'bg-rose-900/40 border-rose-700' : 'bg-rose-100 border-rose-300'
                        } border-2`}>
                          <StopIcon className={`w-4 h-4 ${c.accent}`} />
                        </div>

                        {/* Stop card */}
                        <div className={`flex-1 ${c.stopCard} border rounded-xl p-4`}>
                          <div className="flex items-start justify-between mb-1">
                            <div>
                              <span className={`text-[10px] font-bold ${c.accent} uppercase`}>{stop.time}</span>
                              <h4 className={`text-sm font-bold ${c.text}`}>{stop.venue_name}</h4>
                            </div>
                            <span className={`text-sm font-black ${c.accent} whitespace-nowrap`}>
                              ~{fm(stop.estimated_cost)}
                            </span>
                          </div>
                          <p className={`text-xs ${c.textSec} leading-relaxed`}>{stop.description}</p>
                          {stop.pro_tip && (
                            <p className={`text-[10px] ${c.warningText} mt-1.5 flex items-start gap-1`}>
                              <Lightbulb className="w-3 h-3 flex-shrink-0 mt-0.5" />
                              {stop.pro_tip}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── GETTING THERE ── */}
          {results.transportation && (
            <div className={`${c.info} border rounded-xl p-4`}>
              <p className={`text-xs font-bold ${isDark ? 'text-blue-200' : 'text-blue-800'} mb-1`}>Getting Around</p>
              <p className={`text-xs ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>{results.transportation}</p>
            </div>
          )}

          {/* ── CONVERSATION STARTERS ── */}
          {results.conversation_starters && results.conversation_starters.length > 0 && (
            <div className={`${c.card} border rounded-xl overflow-hidden`}>
              <button
                onClick={() => setExpandedConvo(p => !p)}
                className="w-full p-4 flex items-center justify-between text-left min-h-[44px]"
              >
                <div className="flex items-center gap-2">
                  <MessageCircle className={`w-4 h-4 ${c.accent}`} />
                  <h3 className={`text-sm font-bold ${c.text}`}>Conversation Starters</h3>
                  <span className={`text-[10px] ${c.textMuted}`}>— never stare at your phone</span>
                </div>
                {expandedConvo ? <ChevronUp className={`w-4 h-4 ${c.textMuted}`} /> : <ChevronDown className={`w-4 h-4 ${c.textMuted}`} />}
              </button>
              {expandedConvo && (
                <div className={`px-4 pb-4 space-y-2 border-t ${c.divider} pt-3`}>
                  {results.conversation_starters.map((q, i) => (
                    <div key={i} className={`${c.quoteBg} rounded-lg p-3`}>
                      <p className={`text-xs ${c.textSec}`}>💬 {q}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── PLAN B ── */}
          {results.plan_b && (
            <div className={`${c.card} border rounded-xl overflow-hidden`}>
              <button
                onClick={() => setExpandedPlanB(p => !p)}
                className="w-full p-4 flex items-center justify-between text-left min-h-[44px]"
              >
                <div className="flex items-center gap-2">
                  <RefreshCw className={`w-4 h-4 ${c.warningText}`} />
                  <h3 className={`text-sm font-bold ${c.text}`}>Plan B</h3>
                  <span className={`text-[10px] ${c.textMuted}`}>— if there's a wait or it's closed</span>
                </div>
                {expandedPlanB ? <ChevronUp className={`w-4 h-4 ${c.textMuted}`} /> : <ChevronDown className={`w-4 h-4 ${c.textMuted}`} />}
              </button>
              {expandedPlanB && (
                <div className={`px-4 pb-4 border-t ${c.divider} pt-3`}>
                  <p className={`text-sm ${c.textSec}`}>{results.plan_b}</p>
                </div>
              )}
            </div>
          )}

          {/* ── PRO TIPS ── */}
          {results.tips && results.tips.length > 0 && (
            <div className={`${c.warning} border rounded-xl p-4`}>
              <p className={`text-xs font-bold ${isDark ? 'text-amber-200' : 'text-amber-800'} mb-2 flex items-center gap-1.5`}>
                <Sparkles className="w-3.5 h-3.5" /> Make It Better
              </p>
              <div className="space-y-1">
                {results.tips.map((tip, i) => (
                  <p key={i} className={`text-xs ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>• {tip}</p>
                ))}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <p className={`text-[10px] ${c.textMuted} text-center px-4`}>
            Venue suggestions are AI-generated based on local culture and budget. Confirm availability and prices before going — menus, hours, and customs vary.
          </p>
        </div>
      )}
    </div>
  );
};

DateNight.displayName = 'DateNight';
export default DateNight;
