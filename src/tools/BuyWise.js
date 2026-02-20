import React, { useState, useCallback, useMemo } from 'react';
import {
  Loader2, AlertTriangle, Copy, Check, ChevronDown, ChevronUp,
  DollarSign, Clock, Sparkles, ShieldCheck, TrendingDown,
  Scale, AlertCircle, Zap, Heart, ArrowRight, Search,
  Calendar, ShoppingCart, RefreshCw, ThumbsUp, ThumbsDown, Timer,
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
      ? 'bg-zinc-900 border-zinc-600 text-zinc-50 placeholder:text-zinc-500 focus:border-cyan-500 focus:ring-cyan-500/20'
      : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:ring-cyan-100',
    text: d ? 'text-zinc-50' : 'text-slate-900',
    textSec: d ? 'text-zinc-400' : 'text-slate-600',
    textMuted: d ? 'text-zinc-500' : 'text-slate-500',
    label: d ? 'text-zinc-300' : 'text-slate-700',
    accent: d ? 'text-cyan-400' : 'text-cyan-600',
    accentBg: d ? 'bg-cyan-900/30 border-cyan-700/50' : 'bg-cyan-50 border-cyan-200',
    btnPrimary: d ? 'bg-cyan-600 hover:bg-cyan-500 text-white' : 'bg-cyan-600 hover:bg-cyan-700 text-white',
    btnSec: d ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-100' : 'bg-slate-100 hover:bg-slate-200 text-slate-800',
    danger: d ? 'bg-red-900/20 border-red-700/50 text-red-200' : 'bg-red-50 border-red-200 text-red-800',
    dangerText: d ? 'text-red-400' : 'text-red-600',
    success: d ? 'bg-emerald-900/20 border-emerald-700/50 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-800',
    successText: d ? 'text-emerald-400' : 'text-emerald-600',
    warning: d ? 'bg-amber-900/20 border-amber-700/50 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-800',
    warningText: d ? 'text-amber-400' : 'text-amber-600',
    info: d ? 'bg-blue-900/20 border-blue-700/50 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-800',
    pillActive: d ? 'bg-cyan-600 border-cyan-500 text-white' : 'bg-cyan-600 border-cyan-600 text-white',
    pillInactive: d ? 'bg-zinc-700 border-zinc-600 text-zinc-300 hover:border-zinc-500' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300',
    divider: d ? 'border-zinc-700' : 'border-slate-200',
    quoteBg: d ? 'bg-zinc-900/60' : 'bg-slate-50',
    verdict: d ? 'bg-cyan-900/40 border-cyan-700/50' : 'bg-cyan-50 border-cyan-200',
  };
}

// ════════════════════════════════════════════════════════════
// CURRENCY DETECTION (shared pattern from DateNight)
// ════════════════════════════════════════════════════════════
const CURRENCIES = ['$', '€', '£', '¥', '₹', 'R$', '₩', 'A$', 'C$', 'CHF', 'kr', 'zł'];

const LOCALE_CURRENCY = {
  'en-us': '$', 'en-gb': '£', 'en-au': 'A$', 'en-ca': 'C$',
  'en-in': '₹', 'ja': '¥', 'ko': '₩', 'pt-br': 'R$',
  'de': '€', 'fr': '€', 'es': '€', 'it': '€', 'nl': '€',
  'de-ch': 'CHF', 'sv': 'kr', 'no': 'kr', 'da': 'kr', 'pl': 'zł',
};

function detectCurrency() {
  try {
    const l = (navigator.language || 'en-US').toLowerCase();
    return LOCALE_CURRENCY[l] || LOCALE_CURRENCY[l.split('-')[0]] || '$';
  } catch { return '$'; }
}

function fm(amount, sym) {
  if (amount == null || amount === '') return '';
  const n = Number(amount) || 0;
  const rounded = n % 1 === 0 ? n.toString() : n.toFixed(2);
  if (['kr', 'zł'].includes(sym)) return `${rounded} ${sym}`;
  return `${sym}${rounded}`;
}

// ════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════
const URGENCY = [
  { value: 'today', label: 'Need it today', emoji: '🔴' },
  { value: 'this_week', label: 'This week', emoji: '🟡' },
  { value: 'flexible', label: 'Can wait', emoji: '🟢' },
];

const PRIORITIES = [
  { value: 'budget', label: 'Lowest price' },
  { value: 'durability', label: 'Durability' },
  { value: 'features', label: 'Best features' },
  { value: 'quality', label: 'Quality' },
  { value: 'convenience', label: 'Convenience' },
];

// ════════════════════════════════════════════════════════════
// SECTION COMPONENT
// ════════════════════════════════════════════════════════════
function Section({ icon: Icon, iconColor, title, badge, badgeColor, children, defaultOpen = false, c }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`${c.card} border rounded-xl overflow-hidden`}>
      <button
        onClick={() => setOpen(p => !p)}
        className="w-full p-4 flex items-center justify-between text-left min-h-[44px]"
      >
        <div className="flex items-center gap-2.5">
          {Icon && <Icon className={`w-4 h-4 ${iconColor || c.accent}`} />}
          <h3 className={`text-sm font-bold ${c.text}`}>{title}</h3>
          {badge && (
            <span className={`text-[9px] font-black px-2 py-0.5 rounded ${badgeColor || c.accentBg}`}>
              {badge}
            </span>
          )}
        </div>
        {open ? <ChevronUp className={`w-4 h-4 ${c.textMuted}`} /> : <ChevronDown className={`w-4 h-4 ${c.textMuted}`} />}
      </button>
      {open && (
        <div className={`px-4 pb-4 border-t ${c.divider} pt-3 space-y-3`}>
          {children}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════
const BuyWise = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const c = useColors();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Input
  const [product, setProduct] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState(() => detectCurrency());
  const [urgency, setUrgency] = useState('flexible');
  const [isImpulse, setIsImpulse] = useState(false);
  const [compareProduct, setCompareProduct] = useState('');
  const [comparePrice, setComparePrice] = useState('');
  const [showCompare, setShowCompare] = useState(false);
  const [priority, setPriority] = useState('budget');
  const [context, setContext] = useState(''); // optional extra context

  // Results
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [copiedItems, setCopiedItems] = useState({});

  const canAnalyze = product.trim().length > 0 && !loading;

  const analyze = useCallback(async () => {
    if (!product.trim()) { setError('What are you looking to buy?'); return; }
    setError('');
    setResults(null);

    try {
      const payload = {
        product: product.trim(),
        price: price ? Number(price) : null,
        currency,
        urgency,
        isImpulse,
        priority,
        context: context.trim() || null,
        comparison: showCompare && compareProduct.trim() ? {
          product: compareProduct.trim(),
          price: comparePrice ? Number(comparePrice) : null,
        } : null,
      };
      const data = await callToolEndpoint('buy-wise', payload);
      setResults(data);
    } catch (err) {
      setError(err.message || 'Analysis failed. Try again.');
    }
  }, [product, price, currency, urgency, isImpulse, priority, context, showCompare, compareProduct, comparePrice, callToolEndpoint]);

  const handleReset = useCallback(() => {
    setProduct(''); setPrice(''); setUrgency('flexible');
    setIsImpulse(false); setCompareProduct(''); setComparePrice('');
    setShowCompare(false); setPriority('budget'); setContext('');
    setResults(null); setError('');
  }, []);

  const copyText = useCallback((text, key) => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopiedItems(p => ({ ...p, [key]: true }));
      setTimeout(() => setCopiedItems(p => ({ ...p, [key]: false })), 2000);
    }).catch(() => {});
  }, []);

  const r = results; // shorthand

  // ════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════
  return (
    <div className={`space-y-6 ${c.text}`}>

      {/* ── HEADER + FORM ── */}
      <div className={`${c.card} border rounded-xl p-6`}>
        <div className={`mb-5 pb-4 border-b ${c.divider}`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>BuyWise 🧠</h2>
              <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>The research you'd do if you had an hour — done in seconds</p>
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

        {/* Product */}
        <div className="mb-4">
          <label className={`text-sm font-bold ${c.label} block mb-1.5`}>What are you buying?</label>
          <div className="relative">
            <ShoppingCart className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${c.textMuted}`} />
            <input
              type="text"
              value={product}
              onChange={e => setProduct(e.target.value)}
              placeholder='e.g., "KitchenAid stand mixer", "MacBook Air M3", "running shoes"...'
              className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm ${c.input} outline-none focus:ring-2`}
            />
          </div>
        </div>

        {/* Price + Urgency row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div>
            <label className={`text-sm font-bold ${c.label} block mb-1.5`}>
              Price you've seen <span className={`font-normal ${c.textMuted}`}>(optional)</span>
            </label>
            <div className="flex items-center gap-1">
              <span className={`text-sm font-bold ${c.textMuted}`}>{currency}</span>
              <input
                type="number"
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="0.00"
                className={`flex-1 px-3 py-2.5 border rounded-lg text-sm ${c.input} outline-none focus:ring-2`}
              />
            </div>
          </div>
          <div>
            <label className={`text-sm font-bold ${c.label} block mb-1.5`}>How soon?</label>
            <div className="flex gap-2">
              {URGENCY.map(u => (
                <button
                  key={u.value}
                  onClick={() => setUrgency(u.value)}
                  className={`flex-1 py-2 rounded-lg text-[11px] font-bold border transition-colors min-h-[36px] ${
                    urgency === u.value ? c.pillActive : c.pillInactive
                  }`}
                >
                  {u.emoji} {u.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Priority */}
        <div className="mb-4">
          <label className={`text-sm font-bold ${c.label} block mb-1.5`}>What matters most?</label>
          <div className="flex flex-wrap gap-1.5">
            {PRIORITIES.map(p => (
              <button
                key={p.value}
                onClick={() => setPriority(p.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors min-h-[32px] ${
                  priority === p.value ? c.pillActive : c.pillInactive
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Impulse check */}
        <div className="mb-4">
          <label className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg border transition-colors ${
            isImpulse ? (isDark ? 'bg-amber-900/20 border-amber-700/50' : 'bg-amber-50 border-amber-200') : `${isDark ? 'border-zinc-700' : 'border-slate-200'}`
          }`}>
            <input
              type="checkbox"
              checked={isImpulse}
              onChange={() => setIsImpulse(p => !p)}
              className="sr-only"
            />
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
              isImpulse ? 'bg-amber-500 border-amber-500' : (isDark ? 'border-zinc-600' : 'border-slate-300')
            }`}>
              {isImpulse && <Check className="w-3 h-3 text-white" />}
            </div>
            <div>
              <span className={`text-sm font-bold ${c.text}`}>⚡ This might be an impulse buy</span>
              <p className={`text-[10px] ${c.textMuted}`}>Honest mode — I'll help you decide if you really need it</p>
            </div>
          </label>
        </div>

        {/* Comparison toggle */}
        <div className="mb-4">
          <button onClick={() => setShowCompare(p => !p)} className={`text-xs font-bold ${c.accent} flex items-center gap-1`}>
            <Scale className="w-3 h-3" />
            {showCompare ? 'Remove comparison' : 'Compare with another product'}
          </button>
          {showCompare && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              <input
                type="text"
                value={compareProduct}
                onChange={e => setCompareProduct(e.target.value)}
                placeholder="Alternative product name"
                className={`px-3 py-2.5 border rounded-lg text-sm ${c.input} outline-none focus:ring-2`}
              />
              <div className="flex items-center gap-1">
                <span className={`text-sm font-bold ${c.textMuted}`}>{currency}</span>
                <input
                  type="number"
                  value={comparePrice}
                  onChange={e => setComparePrice(e.target.value)}
                  placeholder="Price (optional)"
                  className={`flex-1 px-3 py-2.5 border rounded-lg text-sm ${c.input} outline-none focus:ring-2`}
                />
              </div>
            </div>
          )}
        </div>

        {/* Extra context */}
        <div className="mb-5">
          <label className={`text-sm font-bold ${c.label} block mb-1.5`}>
            Anything else I should know? <span className={`font-normal ${c.textMuted}`}>(optional)</span>
          </label>
          <input
            type="text"
            value={context}
            onChange={e => setContext(e.target.value)}
            placeholder='e.g., "I bake once a month", "replacing a 5-year-old laptop", "gift for my partner"...'
            className={`w-full px-3 py-2.5 border rounded-lg text-sm ${c.input} outline-none focus:ring-2`}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={analyze}
            disabled={!canAnalyze}
            className={`flex-1 ${c.btnPrimary} disabled:opacity-40 disabled:cursor-not-allowed font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 min-h-[48px]`}
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Researching...</>
            ) : (
              <><Search className="w-5 h-5" /> Research This Purchase</>
            )}
          </button>
          {results && (
            <button onClick={handleReset} className={`px-5 py-3 border-2 ${isDark ? 'border-zinc-600 text-zinc-300' : 'border-slate-300 text-slate-700'} font-semibold rounded-lg`}>
              New Item
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
      {r && (
        <div className="space-y-4">

          {/* ── TOP VERDICT ── */}
          {r.verdict && (
            <div className={`${c.verdict} border-2 rounded-xl p-5`}>
              <div className="flex items-start gap-3">
                <div className={`text-2xl flex-shrink-0`}>{r.verdict_emoji || '🧠'}</div>
                <div>
                  <h3 className={`text-base font-black ${c.text} mb-1`}>{r.verdict}</h3>
                  <p className={`text-sm ${c.textSec}`}>{r.verdict_summary}</p>
                </div>
              </div>
            </div>
          )}

          {/* ── IMPULSE CHECK ── */}
          {r.impulse_check && (
            <div className={`${c.warning} border-2 rounded-xl p-5`}>
              <h3 className={`text-sm font-bold ${c.warningText} mb-2 flex items-center gap-2`}>
                <Zap className="w-4 h-4" /> Impulse Check
              </h3>
              {r.impulse_check.do_you_need_it && (
                <p className={`text-sm ${isDark ? 'text-amber-300' : 'text-amber-700'} mb-2`}>
                  <strong>Do you need it?</strong> {r.impulse_check.do_you_need_it}
                </p>
              )}
              {r.impulse_check.what_else_could_you_do && (
                <p className={`text-sm ${isDark ? 'text-amber-300' : 'text-amber-700'} mb-2`}>
                  <strong>What else is {price ? fm(price, currency) : 'that money'}?</strong> {r.impulse_check.what_else_could_you_do}
                </p>
              )}
              {r.impulse_check.already_own_something && (
                <p className={`text-sm ${isDark ? 'text-amber-300' : 'text-amber-700'} mb-2`}>
                  <strong>Do you already own something that does this?</strong> {r.impulse_check.already_own_something}
                </p>
              )}
              {r.impulse_check.wait_recommendation && (
                <div className={`mt-3 p-3 rounded-lg ${isDark ? 'bg-amber-900/30' : 'bg-amber-100'} flex items-center gap-2`}>
                  <Timer className={`w-4 h-4 ${c.warningText}`} />
                  <p className={`text-xs font-bold ${c.warningText}`}>{r.impulse_check.wait_recommendation}</p>
                </div>
              )}
            </div>
          )}

          {/* ── FAIR PRICE ── */}
          {r.fair_price && (
            <Section icon={DollarSign} title="Is This Price Fair?" badge={r.fair_price.verdict_badge} badgeColor={
              r.fair_price.verdict_badge?.toLowerCase().includes('good') || r.fair_price.verdict_badge?.toLowerCase().includes('fair') ? c.success
              : r.fair_price.verdict_badge?.toLowerCase().includes('high') || r.fair_price.verdict_badge?.toLowerCase().includes('over') ? c.danger
              : c.warning
            } defaultOpen={true} c={c}>
              <p className={`text-sm ${c.textSec}`}>{r.fair_price.analysis}</p>
              {r.fair_price.typical_range && (
                <div className={`${c.quoteBg} rounded-lg p-3`}>
                  <p className={`text-xs font-bold ${c.text}`}>Typical range: {r.fair_price.typical_range}</p>
                </div>
              )}
              {r.fair_price.where_to_find_cheaper && (
                <p className={`text-xs ${c.textSec}`}>💡 {r.fair_price.where_to_find_cheaper}</p>
              )}
            </Section>
          )}

          {/* ── TIMING ── */}
          {r.timing && (
            <Section icon={Calendar} title="Buy Now or Wait?" badge={r.timing.verdict_badge} badgeColor={
              r.timing.verdict_badge?.toLowerCase().includes('buy') ? c.success
              : r.timing.verdict_badge?.toLowerCase().includes('wait') ? c.warning
              : c.info
            } c={c}>
              <p className={`text-sm ${c.textSec}`}>{r.timing.analysis}</p>
              {r.timing.next_sale && (
                <div className={`${c.success} border rounded-lg p-3`}>
                  <p className={`text-xs font-bold ${c.successText}`}>📅 Next likely sale: {r.timing.next_sale}</p>
                </div>
              )}
              {r.timing.price_cycle_note && (
                <p className={`text-xs ${c.textMuted}`}>{r.timing.price_cycle_note}</p>
              )}
            </Section>
          )}

          {/* ── TOTAL COST OF OWNERSHIP ── */}
          {r.total_cost && (
            <Section icon={TrendingDown} title="Total Cost of Ownership" c={c}>
              <p className={`text-sm ${c.textSec}`}>{r.total_cost.summary}</p>
              {r.total_cost.breakdown && r.total_cost.breakdown.length > 0 && (
                <div className="space-y-1.5">
                  {r.total_cost.breakdown.map((item, i) => (
                    <div key={i} className={`flex justify-between items-center p-2 rounded-lg ${c.quoteBg}`}>
                      <span className={`text-xs ${c.text}`}>{item.item}</span>
                      <span className={`text-xs font-bold ${c.text}`}>{item.cost}</span>
                    </div>
                  ))}
                  {r.total_cost.year_1_total && (
                    <div className={`flex justify-between items-center p-2.5 rounded-lg ${c.accentBg} border`}>
                      <span className={`text-xs font-bold ${c.text}`}>Year 1 Total</span>
                      <span className={`text-sm font-black ${c.accent}`}>{r.total_cost.year_1_total}</span>
                    </div>
                  )}
                  {r.total_cost.year_5_total && (
                    <div className={`flex justify-between items-center p-2 rounded-lg ${c.quoteBg}`}>
                      <span className={`text-xs font-bold ${c.text}`}>5-Year Total</span>
                      <span className={`text-sm font-bold ${c.text}`}>{r.total_cost.year_5_total}</span>
                    </div>
                  )}
                </div>
              )}
            </Section>
          )}

          {/* ── CHEAPER ALTERNATIVE ── */}
          {r.cheaper_alternative && (
            <Section icon={Sparkles} title="The Cheaper Version" c={c}>
              <p className={`text-sm ${c.textSec}`}>{r.cheaper_alternative.suggestion}</p>
              {r.cheaper_alternative.tradeoffs && (
                <p className={`text-xs ${c.textMuted}`}>⚖️ Tradeoffs: {r.cheaper_alternative.tradeoffs}</p>
              )}
              {r.cheaper_alternative.refurbished_tip && (
                <div className={`${c.success} border rounded-lg p-3`}>
                  <p className={`text-xs ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>♻️ {r.cheaper_alternative.refurbished_tip}</p>
                </div>
              )}
            </Section>
          )}

          {/* ── BUY vs SUBSCRIBE vs RENT ── */}
          {r.buy_vs_subscribe && (
            <Section icon={RefreshCw} title="Buy vs Subscribe vs Rent" c={c}>
              <p className={`text-sm ${c.textSec}`}>{r.buy_vs_subscribe.analysis}</p>
              {r.buy_vs_subscribe.breakeven && (
                <div className={`${c.quoteBg} rounded-lg p-3`}>
                  <p className={`text-xs font-bold ${c.text}`}>⏱️ {r.buy_vs_subscribe.breakeven}</p>
                </div>
              )}
              {r.buy_vs_subscribe.recommendation && (
                <p className={`text-xs font-bold ${c.accent}`}>→ {r.buy_vs_subscribe.recommendation}</p>
              )}
            </Section>
          )}

          {/* ── QUALITY TIER ── */}
          {r.quality_tier && (
            <Section icon={ShieldCheck} title="Quality Tier Advice" badge={r.quality_tier.recommended_tier} badgeColor={c.accentBg} c={c}>
              <p className={`text-sm ${c.textSec}`}>{r.quality_tier.analysis}</p>
              {r.quality_tier.spend_vs_save && (
                <p className={`text-xs ${c.textMuted}`}>{r.quality_tier.spend_vs_save}</p>
              )}
            </Section>
          )}

          {/* ── REGRET PREDICTOR ── */}
          {r.regret_predictor && (
            <Section icon={AlertCircle} iconColor={c.warningText} title="Regret Predictor" c={c}>
              <p className={`text-sm ${c.textSec}`}>{r.regret_predictor.common_regrets}</p>
              {r.regret_predictor.usage_reality && (
                <div className={`${c.warning} border rounded-lg p-3`}>
                  <p className={`text-xs ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>📊 {r.regret_predictor.usage_reality}</p>
                </div>
              )}
              {r.regret_predictor.avoid_regret_tip && (
                <p className={`text-xs ${c.textSec}`}>✓ {r.regret_predictor.avoid_regret_tip}</p>
              )}
            </Section>
          )}

          {/* ── WATCH OUT ── */}
          {r.watch_out && r.watch_out.length > 0 && (
            <Section icon={AlertTriangle} iconColor={c.dangerText} title="Watch Out For" c={c}>
              <div className="space-y-2">
                {r.watch_out.map((item, i) => (
                  <p key={i} className={`text-xs ${c.textSec}`}>⚠️ {item}</p>
                ))}
              </div>
            </Section>
          )}

          {/* ── NEGOTIATION COACH ── */}
          {r.negotiation && (
            <Section icon={Zap} title="Negotiation Playbook" c={c}>
              <p className={`text-sm ${c.textSec}`}>{r.negotiation.context}</p>
              {r.negotiation.script && (
                <div className="flex items-start gap-2">
                  <div className={`flex-1 ${c.quoteBg} rounded-lg p-3`}>
                    <p className={`text-[10px] font-bold ${c.textMuted} mb-1`}>Say this:</p>
                    <p className={`text-xs ${c.text} leading-relaxed`}>{r.negotiation.script}</p>
                  </div>
                  <button
                    onClick={() => copyText(r.negotiation.script, 'negotiation')}
                    className={`${c.btnSec} p-2 rounded-lg min-h-[32px]`}
                  >
                    {copiedItems.negotiation ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              )}
              {r.negotiation.leverage_points && r.negotiation.leverage_points.length > 0 && (
                <div className="space-y-1">
                  <p className={`text-[10px] font-bold ${c.label} uppercase`}>Your leverage:</p>
                  {r.negotiation.leverage_points.map((lp, i) => (
                    <p key={i} className={`text-xs ${c.textSec}`}>• {lp}</p>
                  ))}
                </div>
              )}
            </Section>
          )}

          {/* ── COMPARISON ── */}
          {r.comparison && (
            <Section icon={Scale} title={`${product} vs ${compareProduct}`} badge={r.comparison.winner} badgeColor={c.success} defaultOpen={true} c={c}>
              <p className={`text-sm ${c.textSec}`}>{r.comparison.analysis}</p>
              {r.comparison.for_your_priority && (
                <div className={`${c.accentBg} border rounded-lg p-3`}>
                  <p className={`text-xs font-bold ${c.accent}`}>Based on your priority ({priority}): {r.comparison.for_your_priority}</p>
                </div>
              )}
              {r.comparison.pros_a && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className={`text-[10px] font-bold ${c.successText} uppercase mb-1`}>
                      {product.length > 20 ? product.substring(0, 20) + '…' : product}
                    </p>
                    {r.comparison.pros_a.map((p, i) => (
                      <p key={i} className={`text-[11px] ${c.textSec}`}>+ {p}</p>
                    ))}
                  </div>
                  <div>
                    <p className={`text-[10px] font-bold ${c.successText} uppercase mb-1`}>
                      {compareProduct.length > 20 ? compareProduct.substring(0, 20) + '…' : compareProduct}
                    </p>
                    {r.comparison.pros_b && r.comparison.pros_b.map((p, i) => (
                      <p key={i} className={`text-[11px] ${c.textSec}`}>+ {p}</p>
                    ))}
                  </div>
                </div>
              )}
            </Section>
          )}

          {/* ── WHERE TO BUY ── */}
          {r.where_to_buy && r.where_to_buy.length > 0 && (
            <Section icon={ShoppingCart} title="Where to Buy" defaultOpen={true} c={c}>
              <div className="space-y-2">
                {r.where_to_buy.map((rec, i) => (
                  <div key={i} className={`flex items-start gap-2 p-2.5 rounded-lg ${c.quoteBg}`}>
                    <ArrowRight className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${c.accent}`} />
                    <div>
                      <p className={`text-xs font-bold ${c.text}`}>{rec.platform}</p>
                      <p className={`text-[10px] ${c.textMuted}`}>{rec.why}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* ── BOTTOM LINE ── */}
          {r.bottom_line && (
            <div className={`${c.info} border-2 rounded-xl p-5`}>
              <div className="flex items-start gap-3">
                <ThumbsUp className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                <div>
                  <h3 className={`text-sm font-bold mb-1 ${isDark ? 'text-blue-200' : 'text-blue-800'}`}>Bottom Line</h3>
                  <p className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>{r.bottom_line}</p>
                </div>
              </div>
            </div>
          )}

          <p className={`text-[10px] ${c.textMuted} text-center px-4`}>
            Prices, availability, and sale dates are AI estimates based on general market knowledge. Always verify before purchasing. Your data stays in this session only.
          </p>
        </div>
      )}
    </div>
  );
};

BuyWise.displayName = 'BuyWise';
export default BuyWise;
