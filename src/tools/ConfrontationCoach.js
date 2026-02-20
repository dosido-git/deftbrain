import React, { useState, useCallback } from 'react';
import {
  Shield, Loader2, AlertTriangle, Copy, Check, ChevronDown, ChevronUp,
  MessageSquare, Ban, Fence, HeartCrack, HandCoins, ThumbsDown, HelpCircle,
  Sparkles, ArrowRight,
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
    bg: d ? 'bg-zinc-900' : 'bg-gradient-to-br from-teal-50 to-emerald-50',
    card: d ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-slate-200',
    input: d
      ? 'bg-zinc-900 border-zinc-600 text-zinc-50 placeholder:text-zinc-500 focus:border-teal-500 focus:ring-teal-500/20'
      : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:ring-teal-100',
    text: d ? 'text-zinc-50' : 'text-slate-900',
    textSec: d ? 'text-zinc-400' : 'text-slate-600',
    textMuted: d ? 'text-zinc-500' : 'text-slate-500',
    label: d ? 'text-zinc-300' : 'text-slate-700',
    accent: d ? 'text-teal-400' : 'text-teal-600',
    accentBg: d ? 'bg-teal-900/30' : 'bg-teal-100',
    btnPrimary: d ? 'bg-teal-600 hover:bg-teal-500 text-white' : 'bg-teal-600 hover:bg-teal-700 text-white',
    btnSec: d ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-100' : 'bg-slate-100 hover:bg-slate-200 text-slate-800',
    danger: d ? 'bg-red-900/20 border-red-700/50 text-red-200' : 'bg-red-50 border-red-200 text-red-800',
    dangerText: d ? 'text-red-400' : 'text-red-600',
    success: d ? 'bg-emerald-900/20 border-emerald-700/50 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-800',
    successText: d ? 'text-emerald-400' : 'text-emerald-600',
    warning: d ? 'bg-amber-900/20 border-amber-700/50 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-800',
    warningText: d ? 'text-amber-400' : 'text-amber-600',
    info: d ? 'bg-blue-900/20 border-blue-700/50 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-800',
    gentle: d ? 'bg-sky-900/20 border-sky-700/50' : 'bg-sky-50 border-sky-200',
    gentleText: d ? 'text-sky-300' : 'text-sky-700',
    gentleAccent: d ? 'text-sky-400' : 'text-sky-600',
    balanced: d ? 'bg-teal-900/20 border-teal-700/50' : 'bg-teal-50 border-teal-200',
    balancedText: d ? 'text-teal-300' : 'text-teal-700',
    balancedAccent: d ? 'text-teal-400' : 'text-teal-600',
    firm: d ? 'bg-orange-900/20 border-orange-700/50' : 'bg-orange-50 border-orange-200',
    firmText: d ? 'text-orange-300' : 'text-orange-700',
    firmAccent: d ? 'text-orange-400' : 'text-orange-600',
    pillActive: d ? 'bg-teal-600 border-teal-500 text-white' : 'bg-teal-600 border-teal-600 text-white',
    pillInactive: d ? 'bg-zinc-700 border-zinc-600 text-zinc-300 hover:border-zinc-500' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300',
    checkActive: d ? 'bg-teal-600 border-teal-500 text-white' : 'bg-teal-600 border-teal-600 text-white',
    checkInactive: d ? 'bg-zinc-800 border-zinc-600' : 'bg-white border-slate-300',
    quoteBg: d ? 'bg-zinc-900/60' : 'bg-slate-50',
    barBg: d ? 'bg-zinc-700' : 'bg-slate-200',
    divider: d ? 'border-zinc-700' : 'border-slate-200',
  };
}

// ════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════
const COMM_TYPES = [
  { id: 'say_no', label: 'Say No', icon: Ban, desc: 'Decline a request' },
  { id: 'set_boundary', label: 'Set a Boundary', icon: Fence, desc: 'Establish limits' },
  { id: 'address_disrespect', label: 'Address Disrespect', icon: ThumbsDown, desc: 'Call out mistreatment' },
  { id: 'end_relationship', label: 'End a Relationship', icon: HeartCrack, desc: 'Part ways' },
  { id: 'negotiate', label: 'Negotiate a Need', icon: HandCoins, desc: 'Ask for what you need' },
  { id: 'push_back', label: 'Push Back', icon: Shield, desc: 'Resist unreasonable demands' },
  { id: 'decline_no_explain', label: 'Decline Without Explaining', icon: HelpCircle, desc: 'No is a complete sentence' },
];

const RELATIONSHIPS = [
  'Partner', 'Friend', 'Family member', 'Boss', 'Colleague',
  'Client', 'Acquaintance', 'Roommate', 'Neighbor', 'Other',
];

const FEARS = [
  { id: 'angry', label: "They'll be angry" },
  { id: 'selfish', label: "They'll think I'm selfish or mean" },
  { id: 'guilt', label: "They'll argue or guilt-trip me" },
  { id: 'damage', label: "I'll damage the relationship" },
  { id: 'retaliate', label: "They'll retaliate" },
  { id: 'feel_guilty', label: "I'll feel guilty afterward" },
];

// ════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════
const ConfrontationCoach = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const c = useColors();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Form
  const [commType, setCommType] = useState('');
  const [situation, setSituation] = useState('');
  const [relationship, setRelationship] = useState('');
  const [fears, setFears] = useState([]);
  const [hardPart, setHardPart] = useState('');
  const [recurring, setRecurring] = useState(false);
  const [triedBefore, setTriedBefore] = useState(false);

  // Results
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [copiedMsg, setCopiedMsg] = useState(null);
  const [expandedPushback, setExpandedPushback] = useState(false);

  const toggleFear = useCallback((id) => {
    setFears(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!situation.trim()) {
      setError('Please describe what you need to communicate.');
      return;
    }
    setError('');
    setResults(null);
    setCopiedMsg(null);

    try {
      const data = await callToolEndpoint('confrontation-coach', {
        commType: commType || 'general',
        situation: situation.trim(),
        relationship: relationship || 'Not specified',
        fears: fears.map(id => FEARS.find(f => f.id === id)?.label).filter(Boolean),
        hardPart: hardPart.trim(),
        recurring,
        triedBefore,
      });
      setResults(data);
    } catch (err) {
      setError(err.message || 'Failed to generate messages. Please try again.');
    }
  }, [commType, situation, relationship, fears, hardPart, recurring, triedBefore, callToolEndpoint]);

  const handleReset = useCallback(() => {
    setCommType('');
    setSituation('');
    setRelationship('');
    setFears([]);
    setHardPart('');
    setRecurring(false);
    setTriedBefore(false);
    setResults(null);
    setError('');
    setCopiedMsg(null);
    setExpandedPushback(false);
  }, []);

  const copyMessage = useCallback((text, id) => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopiedMsg(id);
      setTimeout(() => setCopiedMsg(null), 2000);
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select(); document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedMsg(id);
      setTimeout(() => setCopiedMsg(null), 2000);
    });
  }, []);

  const canGenerate = situation.trim().length > 0 && !loading;

  const levelStyles = {
    gentle: { bg: c.gentle, text: c.gentleText, accent: c.gentleAccent, label: 'Gentle but Clear', emoji: '🌊' },
    balanced: { bg: c.balanced, text: c.balancedText, accent: c.balancedAccent, label: 'Balanced Assertiveness', emoji: '⚖️' },
    firm: { bg: c.firm, text: c.firmText, accent: c.firmAccent, label: 'Very Firm', emoji: '🪨' },
  };

  // ════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════
  return (
    <div className={`space-y-6 ${c.text}`}>

      {/* ── INPUT FORM ── */}
      <div className={`${c.card} border rounded-xl p-6`}>

        {/* Header */}
        <div className={`mb-5 pb-4 border-b ${c.divider}`}>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Confrontation Coach 🛡️</h2>
          <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>Firm, kind words for things you need to say</p>
        </div>

        {/* Communication Type */}
        <div className="mb-5">
          <label className={`text-sm font-bold ${c.label} block mb-2`}>What do you need to do?</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {COMM_TYPES.map(ct => {
              const Icon = ct.icon;
              const active = commType === ct.id;
              return (
                <button
                  key={ct.id}
                  onClick={() => setCommType(active ? '' : ct.id)}
                  className={`p-3 rounded-lg border text-left transition-colors min-h-[44px] ${
                    active ? c.pillActive : c.pillInactive
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs font-bold">{ct.label}</span>
                  </div>
                  <p className={`text-[10px] mt-0.5 ${active ? 'text-white/70' : c.textMuted}`}>{ct.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Situation */}
        <div className="mb-5">
          <label className={`text-sm font-bold ${c.label} block mb-1.5`}>
            Describe the situation and what you need to say
          </label>
          <textarea
            value={situation}
            onChange={e => setSituation(e.target.value)}
            placeholder="Every time I see my aunt, she criticizes my career choice and asks when I'm going to get a 'real job.' It's been going on for years and I dread family gatherings because of it. I need to tell her to stop but I don't want to cause a scene or hurt our relationship..."
            className={`w-full p-4 border rounded-lg ${c.input} outline-none focus:ring-2 text-sm`}
            rows={5}
          />
        </div>

        {/* Relationship + Context row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div>
            <label className={`text-sm font-bold ${c.label} block mb-1.5`}>Relationship</label>
            <select
              value={relationship}
              onChange={e => setRelationship(e.target.value)}
              className={`w-full p-3 border rounded-lg ${c.input} outline-none focus:ring-2 text-sm`}
            >
              <option value="">Select...</option>
              {RELATIONSHIPS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-2 justify-end">
            <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
              <span
                onClick={() => setRecurring(p => !p)}
                className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${recurring ? c.checkActive : c.checkInactive}`}
              >
                {recurring && <Check className="w-3 h-3" />}
              </span>
              <span className={`text-sm ${c.textSec}`}>This is a recurring issue</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
              <span
                onClick={() => setTriedBefore(p => !p)}
                className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${triedBefore ? c.checkActive : c.checkInactive}`}
              >
                {triedBefore && <Check className="w-3 h-3" />}
              </span>
              <span className={`text-sm ${c.textSec}`}>I've tried to bring this up before</span>
            </label>
          </div>
        </div>

        {/* Fears */}
        <div className="mb-5">
          <label className={`text-sm font-bold ${c.label} block mb-2`}>What are you worried will happen?</label>
          <div className="flex flex-wrap gap-2">
            {FEARS.map(fear => {
              const active = fears.includes(fear.id);
              return (
                <button
                  key={fear.id}
                  onClick={() => toggleFear(fear.id)}
                  className={`px-3 py-2 rounded-lg border text-xs font-semibold transition-colors min-h-[36px] ${
                    active ? c.pillActive : c.pillInactive
                  }`}
                >
                  {fear.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* What makes this hard */}
        <div className="mb-5">
          <label className={`text-sm font-bold ${c.label} block mb-1.5`}>
            What makes this hard to say? <span className={`font-normal ${c.textMuted}`}>(optional)</span>
          </label>
          <textarea
            value={hardPart}
            onChange={e => setHardPart(e.target.value)}
            placeholder="I always end up apologizing even when I haven't done anything wrong..."
            className={`w-full p-3 border rounded-lg ${c.input} outline-none focus:ring-2 text-sm`}
            rows={2}
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
                Writing your words...
              </>
            ) : (
              <>
                <MessageSquare className="w-5 h-5" />
                Write My Message
              </>
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
          <p className={`text-sm`}>{error}</p>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* RESULTS                                                  */}
      {/* ══════════════════════════════════════════════════════════ */}
      {results && (
        <div className="space-y-5">

          {/* ── VALIDATION ── */}
          {results.validation && (
            <div className={`${c.success} border rounded-xl p-5`}>
              <div className="flex items-start gap-3">
                <Sparkles className={`w-5 h-5 flex-shrink-0 mt-0.5 ${c.successText}`} />
                <div>
                  <h3 className={`text-sm font-bold mb-1 ${isDark ? 'text-emerald-200' : 'text-emerald-800'}`}>
                    💪 You Have the Right to Say This
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>{results.validation}</p>
                </div>
              </div>
            </div>
          )}

          {/* ── REALITY CHECK ── */}
          {results.reality_check && (
            <div className={`${c.info} border rounded-xl p-5`}>
              <div className="flex items-start gap-3">
                <Shield className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                <div>
                  <h3 className={`text-sm font-bold mb-1 ${isDark ? 'text-blue-200' : 'text-blue-800'}`}>
                    Expect This — It Doesn't Mean You're Wrong
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>{results.reality_check}</p>
                </div>
              </div>
            </div>
          )}

          {/* ── THREE FIRMNESS LEVELS ── */}
          {results.messages && results.messages.length > 0 && (
            <div className="space-y-4">
              <h3 className={`text-sm font-bold ${c.text} flex items-center gap-2`}>
                <MessageSquare className={`w-4 h-4 ${c.accent}`} />
                Your Messages — Pick the Level That Fits
              </h3>

              {results.messages.map((msg, idx) => {
                const style = levelStyles[msg.level] || levelStyles.balanced;
                const isRecommended = msg.level === 'balanced';
                return (
                  <div key={idx} className={`${style.bg} border rounded-xl p-5 relative`}>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{style.emoji}</span>
                        <h4 className={`text-sm font-bold ${style.accent}`}>
                          {msg.label || style.label}
                        </h4>
                        {isRecommended && (
                          <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                            isDark ? 'bg-teal-600 text-white' : 'bg-teal-600 text-white'
                          }`}>
                            Recommended
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => copyMessage(msg.text, msg.level)}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold min-h-[36px] ${c.btnSec}`}
                      >
                        {copiedMsg === msg.level ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copiedMsg === msg.level ? 'Copied!' : 'Copy'}
                      </button>
                    </div>

                    {/* The message */}
                    <div className={`${c.quoteBg} rounded-lg p-4 mb-3`}>
                      <p className={`text-sm ${c.text} whitespace-pre-wrap leading-relaxed`}>"{msg.text}"</p>
                    </div>

                    {/* What this does */}
                    {msg.what_this_does && (
                      <p className={`text-xs ${style.text}`}>
                        <span className="font-bold">What this does:</span> {msg.what_this_does}
                      </p>
                    )}

                    {/* Removes */}
                    {msg.removes && msg.removes.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className={`text-[10px] font-bold ${c.textMuted}`}>Removes:</span>
                        {msg.removes.map((r, i) => (
                          <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded line-through ${
                            isDark ? 'bg-zinc-700 text-zinc-400' : 'bg-slate-200 text-slate-500'
                          }`}>
                            {r}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── PUSHBACK SCRIPTS ── */}
          {results.pushback_scripts && Object.keys(results.pushback_scripts).length > 0 && (
            <div className={`${c.card} border rounded-xl overflow-hidden`}>
              <button
                onClick={() => setExpandedPushback(p => !p)}
                className={`w-full p-5 flex items-center justify-between text-left min-h-[44px]`}
              >
                <div className="flex items-center gap-2">
                  <Shield className={`w-4 h-4 ${c.accent}`} />
                  <h3 className={`text-sm font-bold ${c.text}`}>If They Push Back</h3>
                  <span className={`text-[10px] ${c.textMuted}`}>— ready-made responses</span>
                </div>
                {expandedPushback
                  ? <ChevronUp className={`w-4 h-4 ${c.textMuted}`} />
                  : <ChevronDown className={`w-4 h-4 ${c.textMuted}`} />}
              </button>
              {expandedPushback && (
                <div className={`px-5 pb-5 space-y-3 border-t ${c.divider} pt-4`}>
                  {Object.entries(results.pushback_scripts).map(([key, script], idx) => (
                    <div key={idx} className={`${c.quoteBg} rounded-lg p-4`}>
                      <p className={`text-xs font-bold ${c.warningText} uppercase mb-1.5`}>
                        {key === 'guilt_trip' ? '😢 If they guilt-trip you'
                          : key === 'anger' ? '😡 If they get angry'
                          : key === 'negotiation' ? '🤝 If they try to negotiate'
                          : key === 'silent_treatment' ? '🤐 If they give the silent treatment'
                          : key === 'deflection' ? '🪃 If they deflect'
                          : `💬 ${key.replace(/_/g, ' ')}`}
                      </p>
                      <p className={`text-sm ${c.textSec} leading-relaxed`}>{script}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── FOLLOW-UP GUIDANCE ── */}
          {results.follow_up_guidance && (
            <div className={`${c.warning} border rounded-xl p-5`}>
              <div className="flex items-start gap-3">
                <ArrowRight className={`w-5 h-5 flex-shrink-0 mt-0.5 ${c.warningText}`} />
                <div>
                  <h3 className={`text-sm font-bold mb-1 ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>
                    After You Send It
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>{results.follow_up_guidance}</p>
                </div>
              </div>
            </div>
          )}

          {/* ── REMINDERS ── */}
          <div className={`flex flex-wrap gap-2 justify-center`}>
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${c.success}`}>
              ✓ This is reasonable
            </span>
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${c.success}`}>
              ✓ You're not being mean
            </span>
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${c.success}`}>
              ✓ Their discomfort ≠ you're wrong
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

ConfrontationCoach.displayName = 'ConfrontationCoach';
export default ConfrontationCoach;
