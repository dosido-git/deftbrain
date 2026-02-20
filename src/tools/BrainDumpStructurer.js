import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Loader2, AlertTriangle, Copy, Check, ChevronDown, ChevronUp,
  Brain, Plus, X, Target, CheckSquare, HelpCircle, MessageSquare,
  Cloud, Lightbulb, Trash2, Link, Users, Heart, ArrowRight,
  ClipboardList, RotateCcw, Sparkles, Printer, Download,
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
      ? 'bg-zinc-900 border-zinc-600 text-zinc-50 placeholder:text-zinc-500 focus:border-violet-500 focus:ring-violet-500/20'
      : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:ring-violet-100',
    text: d ? 'text-zinc-50' : 'text-slate-900',
    textSec: d ? 'text-zinc-400' : 'text-slate-600',
    textMuted: d ? 'text-zinc-500' : 'text-slate-500',
    label: d ? 'text-zinc-300' : 'text-slate-700',
    accent: d ? 'text-violet-400' : 'text-violet-600',
    accentBg: d ? 'bg-violet-900/30 border-violet-700/50' : 'bg-violet-50 border-violet-200',
    btnPrimary: d ? 'bg-violet-600 hover:bg-violet-500 text-white' : 'bg-violet-600 hover:bg-violet-700 text-white',
    btnSec: d ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-100' : 'bg-slate-100 hover:bg-slate-200 text-slate-800',
    danger: d ? 'bg-red-900/20 border-red-700/50 text-red-200' : 'bg-red-50 border-red-200 text-red-800',
    dangerText: d ? 'text-red-400' : 'text-red-600',
    success: d ? 'bg-emerald-900/20 border-emerald-700/50 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-800',
    successText: d ? 'text-emerald-400' : 'text-emerald-600',
    warning: d ? 'bg-amber-900/20 border-amber-700/50 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-800',
    warningText: d ? 'text-amber-400' : 'text-amber-600',
    info: d ? 'bg-blue-900/20 border-blue-700/50 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-800',
    purple: d ? 'bg-purple-900/20 border-purple-700/50 text-purple-200' : 'bg-purple-50 border-purple-200 text-purple-800',
    rose: d ? 'bg-rose-900/20 border-rose-700/50 text-rose-200' : 'bg-rose-50 border-rose-200 text-rose-800',
    pillActive: d ? 'bg-violet-600 border-violet-500 text-white' : 'bg-violet-600 border-violet-600 text-white',
    pillInactive: d ? 'bg-zinc-700 border-zinc-600 text-zinc-300 hover:border-zinc-500' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300',
    divider: d ? 'border-zinc-700' : 'border-slate-200',
    quoteBg: d ? 'bg-zinc-900/60' : 'bg-slate-50',
    dumpBg: d ? 'bg-zinc-900 border-zinc-600' : 'bg-gray-50 border-slate-200',
  };
}

// ════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════
const CONTEXTS = [
  { value: 'work_overwhelm', label: 'Work overwhelm', emoji: '💼' },
  { value: 'life_chaos', label: 'Life chaos', emoji: '🌪️' },
  { value: 'big_decision', label: 'Big decision', emoji: '🔀' },
  { value: 'anxiety_spiral', label: 'Anxiety spiral', emoji: '🌀' },
  { value: 'new_situation', label: 'New situation', emoji: '🆕' },
  { value: '3am_thoughts', label: '3am thoughts', emoji: '🌙' },
  { value: 'planning', label: 'Planning something', emoji: '📋' },
  { value: 'transition', label: 'Life transition', emoji: '🔄' },
  { value: 'creative', label: 'Creative brainstorm', emoji: '💡' },
  { value: 'grief_logistics', label: 'Grief / loss logistics', emoji: '🕊️' },
];

const INPUT_MODES = [
  { value: 'freetext', label: 'Free dump', desc: 'Type everything at once' },
  { value: 'rapid', label: 'One at a time', desc: 'Add thoughts individually' },
];

const CATEGORY_CONFIG = {
  do_first: { icon: Target, label: 'Do This First', color: 'text-red-500', bg: 'bg-red-900/20 border-red-700/50', bgLight: 'bg-red-50 border-red-200' },
  actions: { icon: CheckSquare, label: 'Action Items', color: 'text-emerald-500', bg: 'bg-emerald-900/20 border-emerald-700/50', bgLight: 'bg-emerald-50 border-emerald-200' },
  decisions: { icon: HelpCircle, label: 'Decisions Needed', color: 'text-amber-500', bg: 'bg-amber-900/20 border-amber-700/50', bgLight: 'bg-amber-50 border-amber-200' },
  tell_someone: { icon: MessageSquare, label: 'Tell Someone', color: 'text-blue-500', bg: 'bg-blue-900/20 border-blue-700/50', bgLight: 'bg-blue-50 border-blue-200' },
  worries: { icon: Cloud, label: 'Worries (Not Tasks)', color: 'text-purple-500', bg: 'bg-purple-900/20 border-purple-700/50', bgLight: 'bg-purple-50 border-purple-200' },
  ideas: { icon: Lightbulb, label: 'Ideas to Capture', color: 'text-yellow-500', bg: 'bg-yellow-900/20 border-yellow-700/50', bgLight: 'bg-yellow-50 border-yellow-200' },
  can_drop: { icon: Trash2, label: 'Can Drop', color: 'text-zinc-400', bg: 'bg-zinc-800/20 border-zinc-600/50', bgLight: 'bg-gray-50 border-gray-200' },
  not_your_problem: { icon: Users, label: 'Not Your Problem', color: 'text-orange-500', bg: 'bg-orange-900/20 border-orange-700/50', bgLight: 'bg-orange-50 border-orange-200' },
  feelings: { icon: Heart, label: 'Feelings to Acknowledge', color: 'text-rose-500', bg: 'bg-rose-900/20 border-rose-700/50', bgLight: 'bg-rose-50 border-rose-200' },
};

// ════════════════════════════════════════════════════════════
// COLLAPSIBLE SECTION
// ════════════════════════════════════════════════════════════
function Section({ icon: Icon, iconColor, title, badge, badgeColor, children, defaultOpen = false, c }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`${c.card} border rounded-xl overflow-hidden`}>
      <button onClick={() => setOpen(p => !p)} className="w-full p-4 flex items-center justify-between text-left min-h-[44px]">
        <div className="flex items-center gap-2.5">
          {Icon && <Icon className={`w-4 h-4 ${iconColor || c.accent}`} />}
          <h3 className={`text-sm font-bold ${c.text}`}>{title}</h3>
          {badge && <span className={`text-[9px] font-black px-2 py-0.5 rounded ${badgeColor || c.accentBg}`}>{badge}</span>}
        </div>
        {open ? <ChevronUp className={`w-4 h-4 ${c.textMuted}`} /> : <ChevronDown className={`w-4 h-4 ${c.textMuted}`} />}
      </button>
      {open && <div className={`px-4 pb-4 border-t ${c.divider} pt-3 space-y-3`}>{children}</div>}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════
const BrainDumpStructurer = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const c = useColors();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const textRef = useRef(null);

  // Input
  const [inputMode, setInputMode] = useState('freetext');
  const [freeText, setFreeText] = useState('');
  const [rapidThoughts, setRapidThoughts] = useState([]);
  const [currentRapid, setCurrentRapid] = useState('');
  const [context, setContext] = useState('');

  // State
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [copiedItems, setCopiedItems] = useState({});
  const [checkedItems, setCheckedItems] = useState({});
  const [doFirstDone, setDoFirstDone] = useState(false);

  // Auto-resize textarea
  useEffect(() => {
    if (textRef.current && inputMode === 'freetext') {
      textRef.current.style.height = 'auto';
      textRef.current.style.height = Math.max(160, Math.min(textRef.current.scrollHeight, 500)) + 'px';
    }
  }, [freeText, inputMode]);

  // ──────────────────────────────────────────
  // RAPID MODE
  // ──────────────────────────────────────────
  const addRapidThought = useCallback(() => {
    const text = currentRapid.trim();
    if (!text) return;
    setRapidThoughts(prev => [...prev, text]);
    setCurrentRapid('');
  }, [currentRapid]);

  const removeRapidThought = useCallback((idx) => {
    setRapidThoughts(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const handleRapidKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addRapidThought(); }
  }, [addRapidThought]);

  // ──────────────────────────────────────────
  // ACTIONS
  // ──────────────────────────────────────────
  const getDumpText = useCallback(() => {
    if (inputMode === 'freetext') return freeText.trim();
    const all = [...rapidThoughts];
    if (currentRapid.trim()) all.push(currentRapid.trim());
    return all.join('\n');
  }, [inputMode, freeText, rapidThoughts, currentRapid]);

  const structure = useCallback(async () => {
    const dump = getDumpText();
    if (!dump) { setError('Dump something first. Anything.'); return; }
    setError(''); setResults(null); setCheckedItems({}); setDoFirstDone(false);

    try {
      const data = await callToolEndpoint('brain-dump-structurer', {
        rawThoughts: dump,
        context: context || null,
        thoughtCount: inputMode === 'rapid'
          ? rapidThoughts.length + (currentRapid.trim() ? 1 : 0)
          : null,
      });
      setResults(data);
    } catch (err) { setError(err.message || 'Failed to structure. Try again.'); }
  }, [getDumpText, context, inputMode, rapidThoughts, currentRapid, callToolEndpoint]);

  const handleReset = useCallback(() => {
    setFreeText(''); setRapidThoughts([]); setCurrentRapid('');
    setContext(''); setResults(null); setError(''); setCheckedItems({}); setDoFirstDone(false);
  }, []);

  const copyText = useCallback((text, key) => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopiedItems(p => ({ ...p, [key]: true }));
      setTimeout(() => setCopiedItems(p => ({ ...p, [key]: false })), 2000);
    }).catch(() => {});
  }, []);

  const toggleCheck = useCallback((key) => {
    setCheckedItems(p => ({ ...p, [key]: !p[key] }));
  }, []);

  // Word / thought count
  const dumpText = getDumpText();
  const wordCount = dumpText ? dumpText.split(/\s+/).filter(Boolean).length : 0;
  const thoughtCount = inputMode === 'rapid'
    ? rapidThoughts.length + (currentRapid.trim() ? 1 : 0)
    : 0;
  const hasDump = dumpText.length > 0;
  const r = results;

  // Build copyable checklist
  const buildChecklist = useCallback(() => {
    if (!r) return '';
    const lines = [];
    if (r.do_first) lines.push(`🎯 DO FIRST: ${r.do_first.task}\n`);
    if (r.actions?.length) {
      lines.push('✅ ACTION ITEMS:');
      r.actions.forEach(a => lines.push(`  [ ] ${a.task}${a.deadline ? ` (${a.deadline})` : ''}`));
      lines.push('');
    }
    if (r.decisions?.length) {
      lines.push('🤔 DECISIONS NEEDED:');
      r.decisions.forEach(d => lines.push(`  - ${d.decision}`));
      lines.push('');
    }
    if (r.tell_someone?.length) {
      lines.push('💬 TELL SOMEONE:');
      r.tell_someone.forEach(t => lines.push(`  [ ] Tell ${t.who}: ${t.what}`));
      lines.push('');
    }
    if (r.ideas?.length) {
      lines.push('💡 IDEAS TO CAPTURE:');
      r.ideas.forEach(i => lines.push(`  - ${i}`));
    }
    return lines.join('\n');
  }, [r]);

  // Progress tracking
  const getProgress = useCallback(() => {
    if (!r) return { done: 0, total: 0 };
    let total = r.do_first ? 1 : 0;
    let done = doFirstDone ? 1 : 0;
    if (r.actions) {
      total += r.actions.length;
      r.actions.forEach((_, i) => { if (checkedItems[`actions-${i}`]) done++; });
    }
    if (r.tell_someone) {
      total += r.tell_someone.length;
      r.tell_someone.forEach((_, i) => { if (checkedItems[`tell_someone-${i}`]) done++; });
    }
    return { done, total };
  }, [r, doFirstDone, checkedItems]);

  const getNextAction = useCallback(() => {
    if (!r?.actions) return null;
    for (let i = 0; i < r.actions.length; i++) {
      if (!checkedItems[`actions-${i}`]) return r.actions[i];
    }
    return null;
  }, [r, checkedItems]);

  // Build full text for save
  const buildFullText = useCallback(() => {
    if (!r) return '';
    const lines = ['BRAIN DUMP — STRUCTURED', '═'.repeat(40), ''];
    if (r.breathe) lines.push(r.breathe, '');
    if (r.overwhelm_meter?.summary) lines.push(r.overwhelm_meter.summary, '');
    if (r.do_first) {
      lines.push('🎯 DO FIRST:', `  ${r.do_first.task}`);
      if (r.do_first.why_this_first) lines.push(`  Why: ${r.do_first.why_this_first}`);
      if (r.do_first.time_estimate) lines.push(`  Time: ~${r.do_first.time_estimate}`);
      lines.push('');
    }
    if (r.actions?.length) {
      lines.push('✅ ACTION ITEMS:');
      r.actions.forEach(a => {
        let line = `  [ ] ${a.task || a}`;
        if (a.deadline) line += ` (${a.deadline})`;
        if (a.time_estimate) line += ` — ~${a.time_estimate}`;
        lines.push(line);
      });
      lines.push('');
    }
    if (r.decisions?.length) {
      lines.push('🤔 DECISIONS NEEDED:');
      r.decisions.forEach(d => {
        lines.push(`  - ${d.decision || d}`);
        if (d.what_you_need) lines.push(`    Need: ${d.what_you_need}`);
      });
      lines.push('');
    }
    if (r.tell_someone?.length) {
      lines.push('💬 TELL SOMEONE:');
      r.tell_someone.forEach(t => lines.push(`  [ ] ${t.who}: ${t.what}`));
      lines.push('');
    }
    if (r.worries?.length) {
      lines.push('☁️ WORRIES (not tasks):');
      r.worries.forEach(w => {
        lines.push(`  - ${w.thought || w}`);
        if (w.reframe) lines.push(`    → ${w.reframe}`);
      });
      lines.push('');
    }
    if (r.ideas?.length) {
      lines.push('💡 IDEAS:');
      r.ideas.forEach(i => lines.push(`  - ${typeof i === 'string' ? i : (i.idea || JSON.stringify(i))}`));
      lines.push('');
    }
    if (r.not_your_problem?.length) {
      lines.push('👥 NOT YOUR PROBLEM:');
      r.not_your_problem.forEach(n => lines.push(`  - ${n.task || n} → ${n.delegate_to || '(delegate)'}`));
      lines.push('');
    }
    if (r.feelings?.length) {
      lines.push('💗 FEELINGS:');
      r.feelings.forEach(f => {
        lines.push(`  - ${f.feeling || f}`);
        if (f.validation) lines.push(`    ${f.validation}`);
      });
      lines.push('');
    }
    if (r.can_drop?.length) {
      lines.push('🗑️ CAN DROP:');
      r.can_drop.forEach(cd => lines.push(`  - ${cd.task || cd}${cd.reason ? ` (${cd.reason})` : ''}`));
      lines.push('');
    }
    if (r.dependencies?.length) {
      lines.push('🔗 DEPENDENCIES:');
      r.dependencies.forEach(d => lines.push(`  ${d.first} → ${d.then}`));
      lines.push('');
    }
    if (r.closing) lines.push('─'.repeat(40), r.closing);
    return lines.join('\n');
  }, [r]);

  const handlePrint = useCallback(() => {
    const text = buildFullText();
    if (!text) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>Brain Dump — Structured</title>
<style>body{font-family:-apple-system,system-ui,sans-serif;max-width:700px;margin:40px auto;padding:20px;font-size:14px;line-height:1.6;color:#1a1a1a}
pre{white-space:pre-wrap;word-wrap:break-word;font-family:inherit}
@media print{body{margin:20px}}</style></head><body><pre>${text.replace(/</g,'&lt;')}</pre></body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 300);
  }, [buildFullText]);

  const handleSave = useCallback(() => {
    const text = buildFullText();
    if (!text) return;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const date = new Date().toISOString().slice(0, 10);
    a.download = `brain-dump-${date}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [buildFullText]);
  return (
    <div className={`space-y-6 ${c.text}`}>

      {/* ── HEADER + INPUT ── */}
      <div className={`${c.card} border rounded-xl p-6`}>
        <div className={`mb-5 pb-4 border-b ${c.divider}`}>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Brain Dump Structurer 🧠</h2>
          <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
            Everything in your head → one clear next step
          </p>
        </div>

        {/* Context */}
        <div className="mb-4">
          <label className={`text-sm font-bold ${c.label} block mb-2`}>
            What's going on? <span className={`font-normal ${c.textMuted}`}>(optional)</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {CONTEXTS.map(ctx => (
              <button key={ctx.value} onClick={() => setContext(ctx.value === context ? '' : ctx.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors min-h-[32px] ${
                  context === ctx.value ? c.pillActive : c.pillInactive}`}>
                {ctx.emoji} {ctx.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input mode toggle */}
        <div className="flex gap-2 mb-3">
          {INPUT_MODES.map(m => (
            <button key={m.value} onClick={() => setInputMode(m.value)}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold border transition-colors ${
                inputMode === m.value ? c.pillActive : c.pillInactive}`}>
              <div>{m.label}</div>
              <div className={`text-[9px] font-normal mt-0.5 ${inputMode === m.value ? 'text-white/70' : c.textMuted}`}>{m.desc}</div>
            </button>
          ))}
        </div>

        {/* ── FREE TEXT MODE ── */}
        {inputMode === 'freetext' && (
          <div className="mb-4">
            <textarea
              ref={textRef}
              value={freeText}
              onChange={e => setFreeText(e.target.value)}
              placeholder={"Just start typing. Don't organize. Don't filter. Don't punctuate.\n\nExamples:\nneed to call dentist mom's birthday is coming up did I send that email the car needs an oil change I'm worried about the presentation should I take that job offer groceries the kitchen is a mess I feel overwhelmed haven't exercised in weeks need to respond to Sarah about Saturday..."}
              className={`w-full px-4 py-4 border-2 rounded-xl text-sm ${c.dumpBg} ${c.text} placeholder:text-sm outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 resize-none leading-relaxed`}
              style={{ minHeight: '160px' }}
            />
            <div className="flex justify-between mt-1">
              <p className={`text-[10px] ${c.textMuted}`}>No structure needed. Stream of consciousness is perfect.</p>
              {wordCount > 0 && <p className={`text-[10px] ${c.textMuted}`}>{wordCount} words</p>}
            </div>
          </div>
        )}

        {/* ── RAPID FIRE MODE ── */}
        {inputMode === 'rapid' && (
          <div className="mb-4">
            {rapidThoughts.length > 0 && (
              <div className="space-y-1.5 mb-3 max-h-60 overflow-y-auto">
                {rapidThoughts.map((t, idx) => (
                  <div key={idx} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${c.quoteBg}`}>
                    <span className={`text-[10px] font-bold ${c.textMuted}`}>{idx + 1}</span>
                    <p className={`flex-1 text-sm ${c.text}`}>{t}</p>
                    <button onClick={() => removeRapidThought(idx)}
                      className={`${c.textMuted} hover:text-red-500 transition-colors p-0.5`}>
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input type="text" value={currentRapid} onChange={e => setCurrentRapid(e.target.value)}
                onKeyDown={handleRapidKeyDown}
                placeholder={rapidThoughts.length === 0
                  ? "Type one thought, press Enter. Repeat."
                  : "Next thought..."}
                className={`flex-1 px-3 py-2.5 border rounded-lg text-sm ${c.input} outline-none focus:ring-2`}
                autoFocus
              />
              <button onClick={addRapidThought} disabled={!currentRapid.trim()}
                className={`${c.btnPrimary} disabled:opacity-30 px-4 rounded-lg font-bold min-h-[42px]`}>
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex justify-between mt-1">
              <p className={`text-[10px] ${c.textMuted}`}>Press Enter after each thought. Keep going until your head feels emptier.</p>
              {thoughtCount > 0 && <p className={`text-[10px] ${c.accent} font-bold`}>{thoughtCount} thoughts</p>}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={structure} disabled={loading || !hasDump}
            className={`flex-1 ${c.btnPrimary} disabled:opacity-40 disabled:cursor-not-allowed font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 min-h-[48px]`}>
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Sorting your brain...</>
            ) : (
              <><Brain className="w-5 h-5" /> Structure This</>
            )}
          </button>
          {(results || hasDump) && (
            <button onClick={handleReset}
              className={`px-4 py-3 border-2 ${isDark ? 'border-zinc-600 text-zinc-300' : 'border-slate-300 text-slate-700'} rounded-lg font-semibold flex items-center gap-1.5`}>
              <RotateCcw className="w-4 h-4" /> New Dump
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

          {/* ── BREATHE ── */}
          {r.breathe && (
            <div className={`${c.accentBg} border-2 rounded-xl p-5 text-center`}>
              <p className={`text-sm ${isDark ? 'text-violet-300' : 'text-violet-700'}`}>{r.breathe}</p>
            </div>
          )}

          {/* ── OVERWHELM METER ── */}
          {r.overwhelm_meter && (
            <div className={`${c.card} border rounded-xl p-5`}>
              <div className="flex items-center gap-3 mb-3">
                <Sparkles className={`w-5 h-5 ${c.accent}`} />
                <h3 className={`text-sm font-bold ${c.text}`}>Your Brain Sorted</h3>
              </div>
              <p className={`text-sm ${c.textSec} mb-3`}>{r.overwhelm_meter.summary}</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {r.overwhelm_meter.counts && Object.entries(r.overwhelm_meter.counts).map(([key, val]) => (
                  <div key={key} className={`${c.quoteBg} rounded-lg p-3 text-center`}>
                    <p className={`text-xl font-black ${c.text}`}>{val}</p>
                    <p className={`text-[9px] font-bold uppercase ${c.textMuted}`}>{key.replace(/_/g, ' ')}</p>
                  </div>
                ))}
              </div>
              {r.overwhelm_meter.relief && (
                <p className={`text-xs ${c.accent} font-semibold mt-3 text-center`}>{r.overwhelm_meter.relief}</p>
              )}
            </div>
          )}

          {/* ── PROGRESS ── */}
          {(() => {
            const { done, total } = getProgress();
            return total > 0 ? (
              <div className="flex items-center gap-3 px-1">
                <div className={`flex-1 h-2 rounded-full ${isDark ? 'bg-zinc-700' : 'bg-slate-200'} overflow-hidden`}>
                  <div className={`h-full rounded-full transition-all duration-500 ${isDark ? 'bg-violet-500' : 'bg-violet-500'}`}
                    style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }} />
                </div>
                <span className={`text-[10px] font-bold ${c.textMuted}`}>{done}/{total} done</span>
              </div>
            ) : null;
          })()}

          {/* ── DO FIRST ── */}
          {r.do_first && (
            <div className={`border-2 rounded-xl p-5 transition-all ${doFirstDone
              ? (isDark ? 'bg-emerald-900/20 border-emerald-700/50' : 'bg-emerald-50 border-emerald-300')
              : (isDark ? 'bg-violet-900/30 border-violet-600' : 'bg-violet-50 border-violet-300')
            }`}>
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <button onClick={() => setDoFirstDone(p => !p)}
                  className={`mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    doFirstDone
                      ? (isDark ? 'bg-emerald-600 border-emerald-600' : 'bg-emerald-500 border-emerald-500')
                      : (isDark ? 'border-violet-400' : 'border-violet-400')
                  }`}>
                  {doFirstDone && <Check className="w-3.5 h-3.5 text-white" />}
                </button>

                <div className="flex-1">
                  <p className={`text-[10px] font-black uppercase mb-1 ${doFirstDone
                    ? (isDark ? 'text-emerald-400' : 'text-emerald-600')
                    : (isDark ? 'text-violet-300' : 'text-violet-600')
                  }`}>{doFirstDone ? 'Done!' : 'Your one next step'}</p>
                  <p className={`text-lg font-bold ${c.text} ${doFirstDone ? 'line-through opacity-50' : ''}`}>
                    {r.do_first.task}
                  </p>
                  {!doFirstDone && r.do_first.why_this_first && (
                    <p className={`text-xs ${c.textSec} mt-1`}>{r.do_first.why_this_first}</p>
                  )}
                  {!doFirstDone && r.do_first.time_estimate && (
                    <span className={`inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded ${c.accentBg} border`}>
                      ~{r.do_first.time_estimate}
                    </span>
                  )}

                  {/* Next up promotion */}
                  {doFirstDone && (() => {
                    const next = getNextAction();
                    return next ? (
                      <div className={`mt-3 pt-3 border-t ${c.divider}`}>
                        <p className={`text-[10px] font-black uppercase ${isDark ? 'text-violet-300' : 'text-violet-600'} mb-0.5`}>
                          Next up
                        </p>
                        <p className={`text-sm font-semibold ${c.text}`}>{next.task || next}</p>
                        {next.time_estimate && (
                          <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded ${c.accentBg} border`}>
                            ~{next.time_estimate}
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className={`mt-2 text-xs font-semibold ${isDark ? 'text-emerald-300' : 'text-emerald-600'}`}>
                        All action items done. You did the thing. ✨
                      </p>
                    );
                  })()}
                </div>

                <button onClick={() => copyText(r.do_first.task, 'do-first')}
                  className={`${c.btnSec} p-2 rounded-lg min-h-[32px] flex-shrink-0`}>
                  {copiedItems['do-first'] ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
          )}

          {/* ── CATEGORY SECTIONS ── */}
          {renderCategory('actions', r.actions, c, isDark)}
          {renderCategory('decisions', r.decisions, c, isDark)}
          {renderCategory('tell_someone', r.tell_someone, c, isDark)}
          {renderCategory('worries', r.worries, c, isDark)}
          {renderCategory('ideas', r.ideas, c, isDark)}
          {renderCategory('not_your_problem', r.not_your_problem, c, isDark)}
          {renderCategory('feelings', r.feelings, c, isDark)}
          {renderCategory('can_drop', r.can_drop, c, isDark)}

          {/* ── DEPENDENCIES ── */}
          {r.dependencies && r.dependencies.length > 0 && (
            <Section icon={Link} title="Dependencies Detected" c={c}>
              <div className="space-y-2">
                {r.dependencies.map((dep, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className={`text-xs ${c.text}`}>{dep.first}</span>
                    <ArrowRight className={`w-3 h-3 flex-shrink-0 ${c.accent}`} />
                    <span className={`text-xs ${c.text}`}>{dep.then}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* ── EXPORT ── */}
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => copyText(buildChecklist(), 'checklist')}
              className={`${c.btnSec} font-bold py-3 rounded-lg flex items-center justify-center gap-2 min-h-[44px] text-sm`}>
              {copiedItems.checklist ? <Check className="w-4 h-4" /> : <ClipboardList className="w-4 h-4" />}
              {copiedItems.checklist ? 'Copied!' : 'Copy'}
            </button>
            <button onClick={handlePrint}
              className={`${c.btnSec} font-bold py-3 rounded-lg flex items-center justify-center gap-2 min-h-[44px] text-sm`}>
              <Printer className="w-4 h-4" /> Print
            </button>
            <button onClick={handleSave}
              className={`${c.btnSec} font-bold py-3 rounded-lg flex items-center justify-center gap-2 min-h-[44px] text-sm`}>
              <Download className="w-4 h-4" /> Save
            </button>
          </div>

          {/* ── CLOSING ── */}
          {r.closing && (
            <div className={`${c.success} border rounded-xl p-4 text-center`}>
              <p className={`text-sm font-semibold ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>{r.closing}</p>
            </div>
          )}

          <p className={`text-[10px] ${c.textMuted} text-center px-4`}>
            Your thoughts were processed in this session only. Nothing is saved or stored.
          </p>
        </div>
      )}
    </div>
  );

  // ──────────────────────────────────────────
  // CATEGORY RENDERER
  // ──────────────────────────────────────────
  function renderCategory(key, items, c, isDark) {
    if (!items || items.length === 0) return null;

    const config = CATEGORY_CONFIG[key];
    if (!config) return null;
    const CatIcon = config.icon;

    return (
      <Section
        icon={CatIcon}
        iconColor={config.color}
        title={config.label}
        badge={`${items.length}`}
        badgeColor={`${isDark ? config.bg : config.bgLight}`}
        defaultOpen={key === 'actions' || key === 'decisions' || key === 'tell_someone'}
        c={c}
      >
        <div className="space-y-2">
          {items.map((item, i) => {
            const isString = typeof item === 'string';
            const text = isString ? item : (item.task || item.decision || item.what || item.feeling || item.thought || item.idea || item.reason || JSON.stringify(item));
            const sub = !isString && (item.why || item.note || item.delegate_to || item.who || item.deadline || item.reframe || item.context);
            const checkKey = `${key}-${i}`;
            const isAction = key === 'actions' || key === 'tell_someone';

            return (
              <div key={i} className={`flex items-start gap-2.5 p-3 rounded-lg ${c.quoteBg} ${
                checkedItems[checkKey] ? 'opacity-50' : ''}`}>
                {/* Checkbox for actionable items */}
                {isAction && (
                  <button onClick={() => toggleCheck(checkKey)}
                    className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      checkedItems[checkKey]
                        ? (isDark ? 'bg-violet-600 border-violet-600' : 'bg-violet-500 border-violet-500')
                        : (isDark ? 'border-zinc-500' : 'border-slate-300')
                    }`}>
                    {checkedItems[checkKey] && <Check className="w-2.5 h-2.5 text-white" />}
                  </button>
                )}

                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${c.text} ${checkedItems[checkKey] ? 'line-through' : ''}`}>{text}</p>
                  {sub && (
                    <p className={`text-[10px] ${c.textMuted} mt-0.5`}>
                      {item.who && `→ ${item.who}`}
                      {item.delegate_to && `→ Can delegate to: ${item.delegate_to}`}
                      {item.deadline && ` · ${item.deadline}`}
                      {item.why && item.why}
                      {item.note && item.note}
                      {item.reframe && item.reframe}
                      {item.context && item.context}
                    </p>
                  )}
                </div>

                <button onClick={() => copyText(text, checkKey)}
                  className={`${c.btnSec} p-1.5 rounded-lg min-h-[24px] flex-shrink-0`}>
                  {copiedItems[checkKey] ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                </button>
              </div>
            );
          })}
        </div>
      </Section>
    );
  }
};

BrainDumpStructurer.displayName = 'BrainDumpStructurer';
export default BrainDumpStructurer;
