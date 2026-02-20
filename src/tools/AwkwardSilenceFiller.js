import React, { useState, useCallback } from 'react';
import {
  Loader2, AlertTriangle, Copy, Check, ChevronDown, ChevronUp,
  MessageCircle, RefreshCw, Zap, AlertCircle, ArrowRight,
  Shield, Heart, Users, VolumeX,
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
      ? 'bg-zinc-900 border-zinc-600 text-zinc-50 placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20'
      : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-emerald-100',
    text: d ? 'text-zinc-50' : 'text-slate-900',
    textSec: d ? 'text-zinc-400' : 'text-slate-600',
    textMuted: d ? 'text-zinc-500' : 'text-slate-500',
    label: d ? 'text-zinc-300' : 'text-slate-700',
    accent: d ? 'text-emerald-400' : 'text-emerald-600',
    accentBg: d ? 'bg-emerald-900/30 border-emerald-700/50' : 'bg-emerald-50 border-emerald-200',
    btnPrimary: d ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white',
    btnPanic: d ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-red-600 hover:bg-red-700 text-white',
    btnSec: d ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-100' : 'bg-slate-100 hover:bg-slate-200 text-slate-800',
    danger: d ? 'bg-red-900/20 border-red-700/50 text-red-200' : 'bg-red-50 border-red-200 text-red-800',
    dangerText: d ? 'text-red-400' : 'text-red-600',
    success: d ? 'bg-emerald-900/20 border-emerald-700/50 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-800',
    successText: d ? 'text-emerald-400' : 'text-emerald-600',
    warning: d ? 'bg-amber-900/20 border-amber-700/50 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-800',
    warningText: d ? 'text-amber-400' : 'text-amber-600',
    info: d ? 'bg-blue-900/20 border-blue-700/50 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-800',
    pillActive: d ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-emerald-600 border-emerald-600 text-white',
    pillInactive: d ? 'bg-zinc-700 border-zinc-600 text-zinc-300 hover:border-zinc-500' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300',
    divider: d ? 'border-zinc-700' : 'border-slate-200',
    quoteBg: d ? 'bg-zinc-900/60' : 'bg-slate-50',
    chainBg: d ? 'bg-zinc-900/40 border-zinc-700' : 'bg-emerald-50/50 border-emerald-100',
  };
}

// ════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════
const SCENARIOS = [
  { value: 'elevator_boss', label: 'Elevator with boss', emoji: '🏢' },
  { value: 'first_date', label: 'First date', emoji: '💘' },
  { value: 'uber', label: 'Uber / taxi', emoji: '🚗' },
  { value: 'hairdresser', label: 'Hairdresser', emoji: '💇' },
  { value: 'friend_of_friend', label: "Friend's friend at dinner", emoji: '🍽️' },
  { value: 'networking', label: 'Networking event', emoji: '🤝' },
  { value: 'family_gathering', label: 'Family gathering', emoji: '👨‍👩‍👧‍👦' },
  { value: 'waiting_room', label: 'Waiting room', emoji: '🪑' },
  { value: 'neighbors', label: 'Running into neighbor', emoji: '🏡' },
  { value: 'work_lunch', label: 'Work lunch', emoji: '🥗' },
];

const RELATIONSHIPS = [
  { value: 'stranger', label: 'Stranger', emoji: '👤' },
  { value: 'acquaintance', label: 'Acquaintance', emoji: '🙂' },
  { value: 'coworker', label: 'Coworker', emoji: '💼' },
  { value: 'boss', label: 'Boss / authority', emoji: '👔' },
  { value: 'date', label: 'Date / crush', emoji: '💕' },
  { value: 'in_laws', label: 'In-laws / partner family', emoji: '👪' },
  { value: 'old_friend', label: 'Old friend', emoji: '🫂' },
  { value: 'new_friend', label: 'New friend', emoji: '✨' },
];

const COMFORT_LEVELS = [
  { value: 'panicking', label: 'Panicking', emoji: '😰' },
  { value: 'nervous', label: 'Nervous', emoji: '😬' },
  { value: 'slightly_awkward', label: 'Slightly awkward', emoji: '😅' },
  { value: 'fine', label: 'Mostly fine', emoji: '🙂' },
];

// ════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════
const AwkwardSilenceFiller = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const c = useColors();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Inputs
  const [scenario, setScenario] = useState('');
  const [customContext, setCustomContext] = useState('');
  const [relationship, setRelationship] = useState('');
  const [comfort, setComfort] = useState('nervous');
  const [landmines, setLandmines] = useState('');

  // State
  const [results, setResults] = useState(null);
  const [panicResult, setPanicResult] = useState(null);
  const [error, setError] = useState('');
  const [copiedItems, setCopiedItems] = useState({});
  const [expandedSections, setExpandedSections] = useState({});
  const [panicLoading, setPanicLoading] = useState(false);

  // ──────────────────────────────────────────
  // ACTIONS
  // ──────────────────────────────────────────
  const generate = useCallback(async () => {
    setError('');
    setResults(null);
    setPanicResult(null);

    const context = customContext.trim() ||
      (scenario ? SCENARIOS.find(s => s.value === scenario)?.label : '') || '';

    try {
      const data = await callToolEndpoint('awkward-silence-filler', {
        action: 'full',
        context,
        scenario,
        relationship: relationship || 'acquaintance',
        comfort: comfort || 'nervous',
        landmines: landmines.trim() || null,
      });
      setResults(data);
      setExpandedSections({});
    } catch (err) {
      setError(err.message || 'Failed to generate. Try again.');
    }
  }, [customContext, scenario, relationship, comfort, landmines, callToolEndpoint]);

  const panicMode = useCallback(async () => {
    setPanicResult(null);
    setError('');
    setPanicLoading(true);

    const context = customContext.trim() ||
      (scenario ? SCENARIOS.find(s => s.value === scenario)?.label : '') || '';

    try {
      const data = await callToolEndpoint('awkward-silence-filler', {
        action: 'panic',
        context: context || 'general social situation',
        relationship: relationship || 'acquaintance',
      });
      setPanicResult(data);
    } catch (err) {
      setError(err.message || 'Panic mode failed. Deep breath.');
    }
    setPanicLoading(false);
  }, [customContext, scenario, relationship, callToolEndpoint]);

  const refresh = useCallback(async () => {
    if (results) await generate();
  }, [results, generate]);

  const handleReset = useCallback(() => {
    setScenario(''); setCustomContext(''); setRelationship('');
    setComfort('nervous'); setLandmines('');
    setResults(null); setPanicResult(null); setError('');
  }, []);

  const copyText = useCallback((text, key) => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopiedItems(p => ({ ...p, [key]: true }));
      setTimeout(() => setCopiedItems(p => ({ ...p, [key]: false })), 2000);
    }).catch(() => {});
  }, []);

  const toggleSection = useCallback((key) => {
    setExpandedSections(p => ({ ...p, [key]: !p[key] }));
  }, []);

  const isRunning = loading || panicLoading;
  const hasContext = customContext.trim() || scenario;

  const r = results;

  // ════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════
  return (
    <div className={`space-y-6 ${c.text}`}>

      {/* ── HEADER ── */}
      <div className={`${c.card} border rounded-xl p-6`}>
        <div className={`mb-5 pb-4 border-b ${c.divider}`}>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Awkward Silence Filler 💬</h2>
          <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>Context-smart things to say when conversation stalls</p>
        </div>

        {/* ── PANIC MODE BUTTON ── */}
        <div className="mb-5">
          <button
            onClick={panicMode}
            disabled={isRunning}
            className={`w-full ${c.btnPanic} disabled:opacity-40 font-black py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 text-base min-h-[52px] shadow-lg`}
          >
            {panicLoading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Hold on...</>
            ) : (
              <><Zap className="w-5 h-5" /> 🚨 I'M IN AN AWKWARD SILENCE RIGHT NOW</>
            )}
          </button>
          <p className={`text-[10px] ${c.textMuted} text-center mt-1`}>One tap, one line, no form required</p>
        </div>

        {/* ── PANIC RESULT ── */}
        {panicResult && (
          <div className={`mb-5 p-5 rounded-xl border-2 ${isDark ? 'bg-emerald-900/30 border-emerald-600' : 'bg-emerald-50 border-emerald-300'}`}>
            <p className={`text-[10px] font-bold uppercase ${c.successText} mb-2`}>Say this right now:</p>
            <p className={`text-lg font-bold ${c.text} mb-3`}>"{panicResult.line}"</p>
            {panicResult.they_say && (
              <div className={`${isDark ? 'bg-zinc-700/50' : 'bg-white/70'} rounded-lg p-3 mb-2`}>
                <p className={`text-[10px] font-bold ${c.textMuted} mb-1`}>They'll probably say:</p>
                <p className={`text-xs ${c.textSec} italic`}>"{panicResult.they_say}"</p>
              </div>
            )}
            {panicResult.follow_up && (
              <div className={`${c.chainBg} border rounded-lg p-3 mb-2`}>
                <p className={`text-[10px] font-bold ${c.accent} mb-1`}>Then you say:</p>
                <p className={`text-sm font-semibold ${c.text}`}>"{panicResult.follow_up}"</p>
              </div>
            )}
            {panicResult.silence_ok && (
              <p className={`text-xs ${isDark ? 'text-emerald-300' : 'text-emerald-700'} italic mt-2`}>💚 {panicResult.silence_ok}</p>
            )}
            <button
              onClick={() => copyText(panicResult.line, 'panic')}
              className={`mt-2 ${c.btnSec} px-3 py-1.5 rounded-lg flex items-center gap-1 text-xs min-h-[28px]`}
            >
              {copiedItems.panic ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copiedItems.panic ? 'Copied' : 'Copy opener'}
            </button>
          </div>
        )}

        <div className={`text-center ${c.textMuted} text-xs mb-4`}>— or plan ahead —</div>

        {/* ── SCENARIO QUICK PICKS ── */}
        <div className="mb-4">
          <label className={`text-sm font-bold ${c.label} block mb-2`}>Quick scenario</label>
          <div className="flex flex-wrap gap-1.5">
            {SCENARIOS.map(s => (
              <button
                key={s.value}
                onClick={() => { setScenario(s.value === scenario ? '' : s.value); setCustomContext(''); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors min-h-[32px] ${
                  scenario === s.value ? c.pillActive : c.pillInactive
                }`}
              >
                {s.emoji} {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── CUSTOM CONTEXT ── */}
        <div className="mb-4">
          <label className={`text-sm font-bold ${c.label} block mb-1.5`}>
            Or describe the situation <span className={`font-normal ${c.textMuted}`}>(optional if you picked a scenario)</span>
          </label>
          <input
            type="text"
            value={customContext}
            onChange={e => { setCustomContext(e.target.value); if (e.target.value.trim()) setScenario(''); }}
            placeholder="e.g., Stuck at coworker's BBQ, don't know anyone else"
            className={`w-full px-3 py-2.5 border rounded-lg text-sm ${c.input} outline-none focus:ring-2`}
          />
        </div>

        {/* ── RELATIONSHIP ── */}
        <div className="mb-4">
          <label className={`text-sm font-bold ${c.label} block mb-2`}>Who are you talking to?</label>
          <div className="flex flex-wrap gap-1.5">
            {RELATIONSHIPS.map(r => (
              <button
                key={r.value}
                onClick={() => setRelationship(r.value === relationship ? '' : r.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors min-h-[32px] ${
                  relationship === r.value ? c.pillActive : c.pillInactive
                }`}
              >
                {r.emoji} {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── COMFORT LEVEL ── */}
        <div className="mb-4">
          <label className={`text-sm font-bold ${c.label} block mb-2`}>How are you feeling?</label>
          <div className="flex gap-2">
            {COMFORT_LEVELS.map(cl => (
              <button
                key={cl.value}
                onClick={() => setComfort(cl.value)}
                className={`flex-1 py-2.5 rounded-lg text-[11px] font-bold border transition-colors min-h-[40px] flex flex-col items-center gap-0.5 ${
                  comfort === cl.value ? c.pillActive : c.pillInactive
                }`}
              >
                <span className="text-base">{cl.emoji}</span>
                {cl.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── TOPIC LANDMINES ── */}
        <div className="mb-5">
          <label className={`text-sm font-bold ${c.label} block mb-1.5`}>
            Topic landmines <span className={`font-normal ${c.textMuted}`}>(optional — things to avoid)</span>
          </label>
          <input
            type="text"
            value={landmines}
            onChange={e => setLandmines(e.target.value)}
            placeholder='e.g., "politics, their divorce, my job search, kids"'
            className={`w-full px-3 py-2.5 border rounded-lg text-sm ${c.input} outline-none focus:ring-2`}
          />
        </div>

        {/* ── ACTIONS ── */}
        <div className="flex gap-3">
          <button
            onClick={generate}
            disabled={isRunning}
            className={`flex-1 ${c.btnPrimary} disabled:opacity-40 disabled:cursor-not-allowed font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 min-h-[48px]`}
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Generating...</>
            ) : (
              <><MessageCircle className="w-5 h-5" /> Get Conversation Lines</>
            )}
          </button>
          {results && (
            <>
              <button
                onClick={refresh}
                disabled={isRunning}
                className={`px-4 py-3 ${c.btnSec} rounded-lg`}
                title="Different suggestions"
              >
                <RefreshCw className={`w-5 h-5 ${isRunning ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={handleReset}
                className={`px-4 py-3 border-2 ${isDark ? 'border-zinc-600 text-zinc-300' : 'border-slate-300 text-slate-700'} rounded-lg`}
              >
                New
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
      {r && (
        <div className="space-y-4">

          {/* ── SILENCE REFRAME (prominent) ── */}
          {r.silence_reframe && (
            <div className={`${c.accentBg} border rounded-xl p-5 flex items-start gap-3`}>
              <VolumeX className={`w-5 h-5 flex-shrink-0 mt-0.5 ${c.accent}`} />
              <div>
                <h3 className={`text-sm font-bold ${c.text} mb-1`}>First: Is This Silence Actually a Problem?</h3>
                <p className={`text-sm ${c.textSec}`}>{r.silence_reframe}</p>
              </div>
            </div>
          )}

          {/* ── READ THE ROOM ── */}
          {r.read_the_room && (
            <div className={`${c.card} border rounded-xl p-4`}>
              <div className="flex items-start gap-2.5">
                <Users className={`w-4 h-4 flex-shrink-0 mt-0.5 ${c.accent}`} />
                <div>
                  <p className={`text-xs font-bold ${c.label} mb-1`}>Read the Room</p>
                  <p className={`text-sm ${c.textSec}`}>{r.read_the_room}</p>
                </div>
              </div>
            </div>
          )}

          {/* ── CONVERSATION CHAINS ── */}
          {r.conversation_chains && r.conversation_chains.length > 0 && (
            <div className="space-y-3">
              <h3 className={`text-sm font-bold ${c.text} flex items-center gap-2`}>
                <MessageCircle className={`w-4 h-4 ${c.accent}`} /> Conversation Starters
              </h3>
              {r.conversation_chains.map((chain, idx) => {
                const expanded = expandedSections[`chain-${idx}`];
                return (
                  <div key={idx} className={`${c.card} border rounded-xl overflow-hidden`}>
                    {/* Header */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-1">
                        <span className={`text-[10px] font-bold uppercase ${c.textMuted}`}>{chain.category}</span>
                        {chain.risk_level && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            chain.risk_level === 'low' ? c.success
                              : chain.risk_level === 'high' ? c.danger
                              : c.warning
                          }`}>
                            {chain.risk_level === 'low' ? '🟢 Safe' : chain.risk_level === 'high' ? '🔴 Bold' : '🟡 Medium'}
                          </span>
                        )}
                      </div>

                      {/* YOUR OPENER */}
                      <div className="flex items-start gap-2 mt-2">
                        <div className={`flex-1 ${c.quoteBg} rounded-lg p-3`}>
                          <p className={`text-[10px] font-bold ${c.accent} mb-1`}>You say:</p>
                          <p className={`text-sm font-semibold ${c.text}`}>"{chain.opener}"</p>
                        </div>
                        <button
                          onClick={() => copyText(chain.opener, `opener-${idx}`)}
                          className={`${c.btnSec} p-2 rounded-lg min-h-[32px] flex-shrink-0`}
                        >
                          {copiedItems[`opener-${idx}`] ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>

                      {/* CONVERSATION CHAIN (collapsible) */}
                      {(chain.likely_response || chain.your_follow_up) && (
                        <button
                          onClick={() => toggleSection(`chain-${idx}`)}
                          className={`mt-2 text-[10px] font-bold ${c.accent} flex items-center gap-1`}
                        >
                          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          {expanded ? 'Hide conversation flow' : 'See how it plays out →'}
                        </button>
                      )}
                    </div>

                    {/* EXPANDED CHAIN */}
                    {expanded && (chain.likely_response || chain.your_follow_up) && (
                      <div className={`px-4 pb-4 border-t ${c.divider} pt-3 space-y-2`}>
                        {/* Their likely response */}
                        {chain.likely_response && (
                          <div className={`${isDark ? 'bg-zinc-700/50' : 'bg-gray-100'} rounded-lg p-3`}>
                            <p className={`text-[10px] font-bold ${c.textMuted} mb-1`}>They'll probably say something like:</p>
                            <p className={`text-xs ${c.textSec} italic`}>"{chain.likely_response}"</p>
                          </div>
                        )}
                        {/* Arrow */}
                        <div className="flex justify-center">
                          <ArrowRight className={`w-3 h-3 rotate-90 ${c.textMuted}`} />
                        </div>
                        {/* Your follow-up */}
                        {chain.your_follow_up && (
                          <div className="flex items-start gap-2">
                            <div className={`flex-1 ${c.chainBg} border rounded-lg p-3`}>
                              <p className={`text-[10px] font-bold ${c.accent} mb-1`}>Then you say:</p>
                              <p className={`text-xs font-semibold ${c.text}`}>"{chain.your_follow_up}"</p>
                            </div>
                            <button
                              onClick={() => copyText(chain.your_follow_up, `follow-${idx}`)}
                              className={`${c.btnSec} p-1.5 rounded-lg min-h-[28px] flex-shrink-0`}
                            >
                              {copiedItems[`follow-${idx}`] ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        )}
                        {/* Where it goes */}
                        {chain.where_it_leads && (
                          <p className={`text-[10px] ${c.textMuted}`}>→ {chain.where_it_leads}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── BODY LANGUAGE ── */}
          {r.body_language && r.body_language.length > 0 && (
            <div className={`${c.card} border rounded-xl overflow-hidden`}>
              <button
                onClick={() => toggleSection('body')}
                className="w-full p-4 flex items-center justify-between text-left min-h-[44px]"
              >
                <h3 className={`text-sm font-bold ${c.text} flex items-center gap-2`}>
                  <Shield className={`w-4 h-4 ${c.accent}`} /> Body Language Tips
                </h3>
                {expandedSections.body ? <ChevronUp className={`w-4 h-4 ${c.textMuted}`} /> : <ChevronDown className={`w-4 h-4 ${c.textMuted}`} />}
              </button>
              {expandedSections.body && (
                <div className={`px-4 pb-4 border-t ${c.divider} pt-3 space-y-2`}>
                  {r.body_language.map((tip, i) => (
                    <p key={i} className={`text-xs ${c.textSec}`}>• {tip}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── EXIT STRATEGIES ── */}
          {r.exit_strategies && r.exit_strategies.length > 0 && (
            <div className={`${c.card} border rounded-xl overflow-hidden`}>
              <button
                onClick={() => toggleSection('exit')}
                className="w-full p-4 flex items-center justify-between text-left min-h-[44px]"
              >
                <h3 className={`text-sm font-bold ${c.text} flex items-center gap-2`}>
                  🚪 Graceful Exits
                </h3>
                {expandedSections.exit ? <ChevronUp className={`w-4 h-4 ${c.textMuted}`} /> : <ChevronDown className={`w-4 h-4 ${c.textMuted}`} />}
              </button>
              {expandedSections.exit && (
                <div className={`px-4 pb-4 border-t ${c.divider} pt-3 space-y-3`}>
                  {r.exit_strategies.map((exit, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className={`flex-1 ${c.quoteBg} rounded-lg p-3`}>
                        <p className={`text-[10px] font-bold ${c.textMuted} mb-1`}>{exit.scenario}</p>
                        <p className={`text-xs ${c.text}`}>"{exit.script}"</p>
                      </div>
                      <button
                        onClick={() => copyText(exit.script, `exit-${i}`)}
                        className={`${c.btnSec} p-1.5 rounded-lg min-h-[28px] flex-shrink-0`}
                      >
                        {copiedItems[`exit-${i}`] ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── WHAT NOT TO SAY ── */}
          {r.what_not_to_say && r.what_not_to_say.length > 0 && (
            <div className={`${c.card} border rounded-xl overflow-hidden`}>
              <button
                onClick={() => toggleSection('avoid')}
                className="w-full p-4 flex items-center justify-between text-left min-h-[44px]"
              >
                <h3 className={`text-sm font-bold ${c.text} flex items-center gap-2`}>
                  <AlertCircle className={`w-4 h-4 ${c.dangerText}`} /> What NOT to Say
                </h3>
                {expandedSections.avoid ? <ChevronUp className={`w-4 h-4 ${c.textMuted}`} /> : <ChevronDown className={`w-4 h-4 ${c.textMuted}`} />}
              </button>
              {expandedSections.avoid && (
                <div className={`px-4 pb-4 border-t ${c.divider} pt-3 space-y-2`}>
                  {r.what_not_to_say.map((item, i) => (
                    <p key={i} className={`text-xs ${c.textSec}`}>⚠️ {item}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── ENCOURAGEMENT ── */}
          {r.encouragement && (
            <div className={`${c.success} border rounded-xl p-4 flex items-start gap-3`}>
              <Heart className={`w-4 h-4 flex-shrink-0 mt-0.5 ${c.successText}`} />
              <p className={`text-sm ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>{r.encouragement}</p>
            </div>
          )}

          <p className={`text-[10px] ${c.textMuted} text-center px-4`}>
            Every conversation is different. Use these as starting points, not scripts. It's okay to be quiet sometimes.
          </p>
        </div>
      )}
    </div>
  );
};

AwkwardSilenceFiller.displayName = 'AwkwardSilenceFiller';
export default AwkwardSilenceFiller;
