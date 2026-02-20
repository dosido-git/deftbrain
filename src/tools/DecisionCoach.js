import React, { useState, useCallback } from 'react';
import { Target, Loader2, AlertCircle, Copy, Check, ChevronDown, ChevronUp, RefreshCw, Trash2, BookOpen } from 'lucide-react';
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
    text: d ? 'text-zinc-50' : 'text-gray-900',
    textSec: d ? 'text-zinc-400' : 'text-gray-600',
    textMut: d ? 'text-zinc-500' : 'text-gray-500',
    border: d ? 'border-zinc-700' : 'border-stone-200',
    card: d ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-stone-200',
    inset: d ? 'bg-zinc-700' : 'bg-stone-100',
    input: d ? 'bg-zinc-700 border-zinc-600 text-zinc-100 placeholder-zinc-500 focus:border-amber-500' : 'bg-white border-stone-300 text-gray-900 placeholder-stone-400 focus:border-amber-500',
    btn: d ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-amber-600 hover:bg-amber-700 text-white',
    btnSec: d ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-200' : 'bg-stone-100 hover:bg-stone-200 text-gray-700',
    btnGhost: d ? 'text-zinc-400 hover:text-zinc-100' : 'text-gray-500 hover:text-gray-800',
    btnDis: d ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed' : 'bg-stone-200 text-stone-400 cursor-not-allowed',
    pillActive: d ? 'border-amber-500 bg-amber-900/30 text-amber-300' : 'border-amber-500 bg-amber-50 text-amber-700',
    pillInactive: d ? 'border-zinc-600 text-zinc-400 hover:border-zinc-500' : 'border-stone-200 text-gray-500 hover:border-stone-400',
    decisionBg: d ? 'bg-amber-900/25 border-amber-600' : 'bg-amber-50 border-amber-400',
    decisionText: d ? 'text-amber-200' : 'text-amber-900',
    decisionHighlight: d ? 'text-amber-100' : 'text-amber-950',
    stepNum: d ? 'bg-amber-700 text-white' : 'bg-amber-600 text-white',
    stepText: d ? 'text-zinc-200' : 'text-gray-800',
    warnBg: d ? 'bg-red-900/20 border-red-700/50' : 'bg-red-50 border-red-300',
    warnText: d ? 'text-red-300' : 'text-red-800',
    warnTitle: d ? 'text-red-200' : 'text-red-900',
    altBg: d ? 'bg-zinc-700/50' : 'bg-stone-50',
    errBg: d ? 'bg-red-900/30 border-red-700' : 'bg-red-50 border-red-200',
    errText: d ? 'text-red-300' : 'text-red-700',
    histBg: d ? 'bg-amber-900/15 border-amber-700/40' : 'bg-amber-50/50 border-amber-200',
    histCard: d ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-stone-200',
    histAccent: d ? 'text-amber-400' : 'text-amber-700',
  };
};

// ════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════
const CAPACITY_OPTIONS = [
  { value: 'overwhelmed', label: '😵 Totally stuck' },
  { value: 'low', label: '😓 Low energy' },
  { value: 'medium', label: '🤔 Some bandwidth' },
];

const QUICK_CONSTRAINTS = [
  { value: 'low_effort', label: '🛋️ Low effort' },
  { value: 'cheap', label: '💸 Cheap / free' },
  { value: 'fast', label: '⚡ Quick' },
  { value: 'no_cooking', label: '🚫🍳 No cooking' },
  { value: 'comfort', label: '🧸 Comfort' },
  { value: 'healthy', label: '🥗 Healthy' },
  { value: 'solo', label: '👤 Solo-friendly' },
  { value: 'no_leaving', label: '🏠 Don\'t leave house' },
  { value: 'no_screens', label: '📵 No screens' },
  { value: 'quiet', label: '🤫 Low stimulation' },
];

const DECISION_CATEGORIES = [
  { value: 'food', label: '🍕 What to eat' },
  { value: 'task', label: '📋 What to do next' },
  { value: 'purchase', label: '🛒 What to buy' },
  { value: 'activity', label: '🎯 What to do tonight' },
  { value: 'other', label: '💬 Something else' },
];

// ════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════
const DecisionCoach = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const c = useColors();

  // ── History ──
  const [history, setHistory] = usePersistentState('decision-coach-history', []);
  const [showHistory, setShowHistory] = useState(false);
  const [expandedHistId, setExpandedHistId] = useState(null);

  // ── Inputs ──
  const [category, setCategory] = useState('');
  const [decisionNeeded, setDecisionNeeded] = useState('');
  const [constraints, setConstraints] = useState([]);
  const [extraContext, setExtraContext] = useState('');
  const [capacity, setCapacity] = useState('overwhelmed');

  // ── Results ──
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // ══════════════════════════════════════════
  // HELPERS
  // ══════════════════════════════════════════
  const toggleConstraint = useCallback((val) => {
    setConstraints(prev => prev.includes(val) ? prev.filter(c => c !== val) : [...prev, val]);
  }, []);

  const getLabelFor = (options, value) => {
    const opt = options.find(o => o.value === value);
    return opt ? opt.label.replace(/^[^\s]+\s/, '') : value;
  };

  // ══════════════════════════════════════════
  // HISTORY
  // ══════════════════════════════════════════
  const saveToHistory = useCallback((res, question) => {
    const choice = res.decision_made_for_you?.choice || res.decision || 'Decision';
    const entry = {
      id: `dc_${Date.now()}`,
      date: new Date().toISOString(),
      question,
      choice,
      results: res,
    };
    setHistory(prev => [entry, ...prev].slice(0, 30));
  }, [setHistory]);

  const removeFromHistory = useCallback((id) => {
    setHistory(prev => prev.filter(h => h.id !== id));
    if (expandedHistId === id) setExpandedHistId(null);
  }, [setHistory, expandedHistId]);

  const loadFromHistory = useCallback((entry) => {
    setResults(entry.results);
    setShowHistory(false);
    setCopied(false);
  }, []);

  // ══════════════════════════════════════════
  // API
  // ══════════════════════════════════════════
  const generate = useCallback(async () => {
    if (!decisionNeeded.trim()) {
      setError('Describe the decision you need made');
      return;
    }
    setError(''); setResults(null); setCopied(false);
    try {
      const constraintLabels = constraints.map(c => getLabelFor(QUICK_CONSTRAINTS, c));
      const prefString = [
        ...constraintLabels,
        extraContext.trim()
      ].filter(Boolean).join(', ');

      // Send recent decisions so the AI avoids repeats
      const recentChoices = history
        .slice(0, 5)
        .map(h => h.choice)
        .filter(Boolean);

      const res = await callToolEndpoint('decision-coach', {
        decisionNeeded: decisionNeeded.trim(),
        category: category ? getLabelFor(DECISION_CATEGORIES, category) : '',
        preferences: prefString,
        capacityLevel: capacity,
        recentDecisions: recentChoices,
      });
      setResults(res);
      saveToHistory(res, decisionNeeded.trim());
    } catch (err) {
      setError(err.message || 'Failed to decide. Try again.');
    }
  }, [decisionNeeded, category, constraints, extraContext, capacity, history, callToolEndpoint, saveToHistory]);

  const decideAgain = useCallback(() => {
    setResults(null);
    setCopied(false);
  }, []);

  // ══════════════════════════════════════════
  // COPY
  // ══════════════════════════════════════════
  const copyDecision = useCallback(() => {
    if (!results) return;
    const d = results.decision_made_for_you || {};
    const lines = [
      `🎯 Decision: ${d.choice || ''}`,
      '',
      `Why: ${d.why || ''}`,
      '',
    ];
    const steps = results.execution_instructions;
    if (steps) {
      lines.push('Steps:');
      if (Array.isArray(steps)) {
        steps.forEach((s, i) => lines.push(`${i + 1}. ${s}`));
      } else {
        Object.entries(steps)
          .filter(([k]) => k.startsWith('step_'))
          .forEach(([k, v]) => lines.push(`${k.replace('step_', '')}. ${v}`));
        if (steps.done) lines.push(`\n${steps.done}`);
      }
    }
    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [results]);

  // ══════════════════════════════════════════
  // RENDER: Pills
  // ══════════════════════════════════════════
  const renderPills = (options, value, setter, multi = false) => (
    <div className="flex flex-wrap gap-1.5">
      {options.map(opt => {
        const active = multi ? value.includes(opt.value) : value === opt.value;
        return (
          <button key={opt.value}
            onClick={() => multi ? setter(opt.value) : setter(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${active ? c.pillActive : c.pillInactive}`}>
            {active && <Check className="w-3 h-3 inline mr-1" />}
            {opt.label}
          </button>
        );
      })}
    </div>
  );

  // ══════════════════════════════════════════
  // RENDER: Header
  // ══════════════════════════════════════════
  const renderHeader = () => (
    <div className="flex items-center gap-3 mb-5">
      <div>
        <h2 className={`text-2xl font-bold ${c.text}`}>Decision Coach 🎯</h2>
        <p className={`text-sm ${c.textMut}`}>Makes the decision for you when you're too stuck to choose</p>
      </div>
    </div>
  );

  // ══════════════════════════════════════════
  // RENDER: Input Form
  // ══════════════════════════════════════════
  const renderInputForm = () => (
    <div className="space-y-4">
      {/* Category */}
      <div className={`p-5 rounded-2xl border ${c.border} ${c.card}`}>
        <label className={`text-xs font-bold ${c.textSec} uppercase tracking-wide mb-1 block`}>🏷️ What kind of decision?</label>
        <p className={`text-xs ${c.textMut} mb-2`}>Optional — helps focus the answer</p>
        {renderPills(DECISION_CATEGORIES, category, setCategory)}
      </div>

      {/* Decision needed */}
      <div className={`p-5 rounded-2xl border ${c.border} ${c.card}`}>
        <label className={`text-xs font-bold ${c.textSec} uppercase tracking-wide mb-2 block`}>❓ What do you need decided?</label>
        <input type="text" value={decisionNeeded} onChange={e => setDecisionNeeded(e.target.value)}
          placeholder="e.g., 'What to eat for dinner' or 'Which task to start with'"
          className={`w-full px-4 py-2.5 rounded-xl border text-sm ${c.input} outline-none`} />
      </div>

      {/* Quick Constraints */}
      <div className={`p-5 rounded-2xl border ${c.border} ${c.card}`}>
        <label className={`text-xs font-bold ${c.textSec} uppercase tracking-wide mb-1 block`}>⚡ Quick constraints</label>
        <p className={`text-xs ${c.textMut} mb-2`}>Tap all that apply — helps narrow it to one answer</p>
        {renderPills(QUICK_CONSTRAINTS, constraints, toggleConstraint, true)}
        <input type="text" value={extraContext} onChange={e => setExtraContext(e.target.value)}
          placeholder="Anything else? e.g., 'vegetarian, under $15, no spicy food'"
          className={`w-full mt-3 px-4 py-2.5 rounded-xl border text-sm ${c.input} outline-none`} />
      </div>

      {/* Capacity */}
      <div className={`p-5 rounded-2xl border ${c.border} ${c.card}`}>
        <label className={`text-xs font-bold ${c.textSec} uppercase tracking-wide mb-2 block`}>🔋 Current capacity</label>
        {renderPills(CAPACITY_OPTIONS, capacity, setCapacity)}
      </div>

      {/* Generate */}
      <button onClick={generate}
        disabled={loading || !decisionNeeded.trim()}
        className={`w-full py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all
          ${loading || !decisionNeeded.trim() ? c.btnDis : c.btn}`}>
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Deciding for you...</>
        ) : (
          <><Target className="w-4 h-4" /> Decide For Me</>
        )}
      </button>
    </div>
  );

  // ══════════════════════════════════════════
  // RENDER: Results
  // ══════════════════════════════════════════
  const renderResults = () => {
    if (!results) return null;
    const d = results.decision_made_for_you || {};
    const steps = results.execution_instructions;
    const alts = d.alternatives_eliminated || [];

    // Normalize steps to array
    let stepList = [];
    if (Array.isArray(steps)) {
      stepList = steps;
    } else if (steps && typeof steps === 'object') {
      stepList = Object.entries(steps)
        .filter(([k]) => k.startsWith('step_'))
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([, v]) => v);
    }
    const doneMsg = !Array.isArray(steps) && steps?.done;

    return (
      <div className="space-y-4 mt-4">
        {/* THE Decision */}
        <div className={`p-6 rounded-2xl border-2 ${c.decisionBg}`}>
          <div className={`text-xs font-bold uppercase tracking-wide mb-3 ${c.decisionText}`}>Your Decision</div>
          <p className={`text-2xl font-bold ${c.decisionHighlight} mb-3`}>{d.choice}</p>
          {d.why && <p className={`text-sm ${c.decisionText}`}><strong>Why:</strong> {d.why}</p>}
        </div>

        {/* Execution Steps */}
        {stepList.length > 0 && (
          <div className={`p-5 rounded-2xl border ${c.card}`}>
            <h3 className={`text-sm font-bold mb-3 ${c.text}`}>📋 Do this now</h3>
            <div className="space-y-2.5">
              {stepList.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-black ${c.stepNum}`}>{i + 1}</span>
                  <p className={`text-sm ${c.stepText} pt-0.5`}>{step}</p>
                </div>
              ))}
            </div>
            {doneMsg && (
              <p className={`mt-4 text-sm font-semibold ${c.d ? 'text-emerald-400' : 'text-emerald-700'}`}>{doneMsg}</p>
            )}
          </div>
        )}

        {/* Alternatives Eliminated */}
        {alts.length > 0 && (
          <div className={`p-5 rounded-2xl border ${c.card}`}>
            <h3 className={`text-sm font-bold mb-2 ${c.text}`}>🚫 Ruled out for you</h3>
            <div className="space-y-1.5">
              {alts.map((alt, i) => (
                <p key={i} className={`text-xs ${c.textSec} flex items-start gap-2`}>
                  <span className="line-through opacity-60">{alt}</span>
                </p>
              ))}
            </div>
          </div>
        )}

        {/* No Second-Guessing */}
        {results.no_second_guessing && (
          <div className={`p-5 rounded-2xl border ${c.warnBg}`}>
            <h3 className={`text-sm font-bold mb-2 ${c.warnTitle}`}>⚠️ No Second-Guessing</h3>
            <p className={`text-sm ${c.warnText}`}>{results.no_second_guessing}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button onClick={copyDecision}
            className={`flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 ${c.btnSec}`}>
            {copied ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy Decision</>}
          </button>
          <button onClick={decideAgain}
            className={`flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 ${c.btn}`}>
            <RefreshCw className="w-3.5 h-3.5" /> Decide Something Else
          </button>
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════
  // RENDER: Error
  // ══════════════════════════════════════════
  const renderError = () => error ? (
    <div className={`mt-4 p-4 ${c.errBg} border rounded-xl flex items-start gap-3`}>
      <AlertCircle className={`w-5 h-5 ${c.errText} flex-shrink-0 mt-0.5`} />
      <p className={`text-sm ${c.errText}`}>{error}</p>
    </div>
  ) : null;

  // ══════════════════════════════════════════
  // RENDER: History
  // ══════════════════════════════════════════
  const renderHistory = () => {
    if (history.length === 0) return null;

    const formatDate = (iso) => {
      try {
        const dt = new Date(iso);
        const now = new Date();
        const diff = Math.floor((now - dt) / (1000 * 60 * 60 * 24));
        if (diff === 0) return 'Today';
        if (diff === 1) return 'Yesterday';
        if (diff < 7) return `${diff} days ago`;
        return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } catch { return ''; }
    };

    return (
      <div className={`mt-6 p-4 rounded-2xl border ${c.histBg}`}>
        <button onClick={() => setShowHistory(!showHistory)}
          className="w-full flex items-center gap-2 text-left">
          <BookOpen className={`w-4 h-4 ${c.histAccent}`} />
          <span className={`text-sm font-bold ${c.text} flex-1`}>Past Decisions</span>
          <span className={`text-xs ${c.textMut}`}>{history.length}</span>
          {showHistory ? <ChevronUp className={`w-4 h-4 ${c.textMut}`} /> : <ChevronDown className={`w-4 h-4 ${c.textMut}`} />}
        </button>

        {showHistory && (
          <div className="mt-3 space-y-2">
            {history.map(entry => {
              const isExp = expandedHistId === entry.id;
              return (
                <div key={entry.id} className={`rounded-xl border ${c.histCard} overflow-hidden`}>
                  <button onClick={() => setExpandedHistId(isExp ? null : entry.id)}
                    className="w-full flex items-center gap-3 p-3 text-left">
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-semibold ${c.text} truncate`}>{entry.question}</div>
                      <div className={`text-xs ${c.textMut} mt-0.5`}>
                        {formatDate(entry.date)} · {entry.choice}
                      </div>
                    </div>
                    {isExp ? <ChevronUp className={`w-4 h-4 ${c.textMut} flex-shrink-0`} /> : <ChevronDown className={`w-4 h-4 ${c.textMut} flex-shrink-0`} />}
                  </button>
                  {isExp && (
                    <div className={`px-3 pb-3 border-t ${c.border} flex gap-2`}>
                      <button onClick={() => loadFromHistory(entry)}
                        className={`flex-1 mt-2 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 ${c.btn}`}>
                        <Target className="w-3 h-3" /> View Decision
                      </button>
                      <button onClick={() => removeFromHistory(entry.id)}
                        className={`mt-2 px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${c.btnSec} hover:text-red-500`}>
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            {history.length > 1 && (
              <button onClick={() => { setHistory([]); setExpandedHistId(null); }}
                className={`w-full mt-1 text-center text-xs font-semibold ${c.btnGhost} hover:text-red-500 py-1.5`}>
                Clear all history
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  // ══════════════════════════════════════════
  // MAIN RENDER
  // ══════════════════════════════════════════
  return (
    <div>
      {renderHeader()}
      {!results && renderInputForm()}
      {renderResults()}
      {renderError()}
      {renderHistory()}
    </div>
  );
};

DecisionCoach.displayName = 'DecisionCoach';
export default DecisionCoach;