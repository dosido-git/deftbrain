import React, { useState, useCallback } from 'react';
import {
  Loader2, AlertTriangle, Copy, Check, ChevronDown, ChevronUp,
  Calendar, Clock, Shield, Heart, ArrowRight, RotateCcw,
  AlertCircle, MessageSquare,
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
      ? 'bg-zinc-900 border-zinc-600 text-zinc-50 placeholder:text-zinc-500 focus:border-sky-500 focus:ring-sky-500/20'
      : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-sky-100',
    text: d ? 'text-zinc-50' : 'text-slate-900',
    textSec: d ? 'text-zinc-400' : 'text-slate-600',
    textMuted: d ? 'text-zinc-500' : 'text-slate-500',
    label: d ? 'text-zinc-300' : 'text-slate-700',
    accent: d ? 'text-sky-400' : 'text-sky-600',
    accentBg: d ? 'bg-sky-900/30 border-sky-700/50' : 'bg-sky-50 border-sky-200',
    btnPrimary: d ? 'bg-sky-600 hover:bg-sky-500 text-white' : 'bg-sky-600 hover:bg-sky-700 text-white',
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
    pillActive: d ? 'bg-sky-600 border-sky-500 text-white' : 'bg-sky-600 border-sky-600 text-white',
    pillInactive: d ? 'bg-zinc-700 border-zinc-600 text-zinc-300 hover:border-zinc-500' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300',
    divider: d ? 'border-zinc-700' : 'border-slate-200',
    quoteBg: d ? 'bg-zinc-900/60' : 'bg-slate-50',
    keepBg: d ? 'bg-emerald-900/20 border-emerald-700/50' : 'bg-emerald-50 border-emerald-200',
    dropBg: d ? 'bg-zinc-800/60 border-zinc-600' : 'bg-gray-50 border-gray-200',
    simplifyBg: d ? 'bg-amber-900/20 border-amber-700/50' : 'bg-amber-50 border-amber-200',
  };
}

// ════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════
const DISRUPTIONS = [
  { value: 'sick_day', label: 'Sick day', emoji: '🤒' },
  { value: 'insomnia', label: 'Bad sleep / insomnia', emoji: '😴' },
  { value: 'mental_health', label: 'Mental health day', emoji: '🧠' },
  { value: 'pain_flare', label: 'Pain / chronic flare', emoji: '⚡' },
  { value: 'travel', label: 'Travel', emoji: '✈️' },
  { value: 'visitors', label: 'House guests / visitors', emoji: '🏠' },
  { value: 'kid_home', label: 'Kid(s) home unexpectedly', emoji: '👶' },
  { value: 'partner_away', label: 'Partner away', emoji: '💼' },
  { value: 'wfh_change', label: 'WFH when usually in office', emoji: '🏡' },
  { value: 'office_change', label: 'In office when usually WFH', emoji: '🏢' },
  { value: 'power_outage', label: 'Power outage / no internet', emoji: '🔌' },
  { value: 'holiday', label: 'Holiday / day off', emoji: '🎄' },
  { value: 'schedule_change', label: 'Schedule changed', emoji: '📅' },
  { value: 'emergency', label: 'Emergency / crisis', emoji: '🚨' },
  { value: 'other', label: 'Something else', emoji: '❓' },
];

const ENERGY_LEVELS = [
  { value: 'survival', label: 'Survival', emoji: '🔴', desc: 'Bare minimum only' },
  { value: 'low', label: 'Low', emoji: '🟠', desc: 'Can do essentials' },
  { value: 'moderate', label: 'Moderate', emoji: '🟡', desc: 'Modified but functional' },
  { value: 'near_normal', label: 'Near normal', emoji: '🟢', desc: 'Mostly okay, some limits' },
];

const DURATIONS = [
  { value: 'few_hours', label: 'Few hours' },
  { value: 'today_only', label: 'Today only' },
  { value: 'few_days', label: '2-3 days' },
  { value: 'a_week', label: 'About a week' },
  { value: 'ongoing', label: 'Ongoing / unknown' },
];

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
const RoutineRuptureManager = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const c = useColors();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Input
  const [disruption, setDisruption] = useState('');
  const [customDisruption, setCustomDisruption] = useState('');
  const [energy, setEnergy] = useState('low');
  const [duration, setDuration] = useState('');
  const [normalRoutine, setNormalRoutine] = useState('');
  const [criticalTasks, setCriticalTasks] = useState('');
  const [constraints, setConstraints] = useState('');

  // State
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [copiedItems, setCopiedItems] = useState({});

  const generate = useCallback(async () => {
    if (!disruption) { setError('What disrupted your routine?'); return; }
    setError(''); setResults(null);

    try {
      const data = await callToolEndpoint('routine-rupture-manager', {
        disruption,
        customDisruption: disruption === 'other' ? customDisruption.trim() : null,
        energy,
        duration: duration || 'today_only',
        normalRoutine: normalRoutine.trim() || null,
        criticalTasks: criticalTasks.trim() || null,
        constraints: constraints.trim() || null,
      });
      setResults(data);
    } catch (err) { setError(err.message || 'Failed to generate. Try again.'); }
  }, [disruption, customDisruption, energy, duration, normalRoutine, criticalTasks, constraints, callToolEndpoint]);

  const handleReset = useCallback(() => {
    setDisruption(''); setCustomDisruption(''); setEnergy('low');
    setDuration(''); setResults(null); setError('');
  }, []);

  const copyText = useCallback((text, key) => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopiedItems(p => ({ ...p, [key]: true }));
      setTimeout(() => setCopiedItems(p => ({ ...p, [key]: false })), 2000);
    }).catch(() => {});
  }, []);

  const r = results;

  return (
    <div className={`space-y-6 ${c.text}`}>

      {/* ── HEADER + FORM ── */}
      <div className={`${c.card} border rounded-xl p-6`}>
        <div className={`mb-5 pb-4 border-b ${c.divider}`}>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Routine Rupture Manager 🔄</h2>
          <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
            Your routine broke. Here is your temporary replacement.
          </p>
        </div>

        {/* Disruption type */}
        <div className="mb-4">
          <label className={`text-sm font-bold ${c.label} block mb-2`}>What happened?</label>
          <div className="flex flex-wrap gap-1.5">
            {DISRUPTIONS.map(d => (
              <button key={d.value} onClick={() => setDisruption(d.value === disruption ? '' : d.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors min-h-[32px] ${
                  disruption === d.value ? c.pillActive : c.pillInactive}`}>
                {d.emoji} {d.label}
              </button>
            ))}
          </div>
          {disruption === 'other' && (
            <input type="text" value={customDisruption} onChange={e => setCustomDisruption(e.target.value)}
              placeholder="Describe what's disrupting your routine..."
              className={`w-full mt-2 px-3 py-2.5 border rounded-lg text-sm ${c.input} outline-none focus:ring-2`} />
          )}
        </div>

        {/* Energy level */}
        <div className="mb-4">
          <label className={`text-sm font-bold ${c.label} block mb-2`}>How much energy do you have?</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {ENERGY_LEVELS.map(el => (
              <button key={el.value} onClick={() => setEnergy(el.value)}
                className={`py-2.5 px-3 rounded-lg text-xs font-bold border transition-colors min-h-[44px] flex flex-col items-center gap-0.5 ${
                  energy === el.value ? c.pillActive : c.pillInactive}`}>
                <span className="text-base">{el.emoji}</span>
                <span>{el.label}</span>
                <span className={`text-[9px] font-normal ${energy === el.value ? 'text-white/70' : c.textMuted}`}>{el.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div className="mb-4">
          <label className={`text-sm font-bold ${c.label} block mb-2`}>How long will this last?</label>
          <div className="flex flex-wrap gap-1.5">
            {DURATIONS.map(d => (
              <button key={d.value} onClick={() => setDuration(d.value === duration ? '' : d.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors min-h-[32px] ${
                  duration === d.value ? c.pillActive : c.pillInactive}`}>
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Normal routine */}
        <div className="mb-4">
          <label className={`text-sm font-bold ${c.label} block mb-1.5`}>
            Your normal routine <span className={`font-normal ${c.textMuted}`}>(optional but helps a lot)</span>
          </label>
          <textarea value={normalRoutine} onChange={e => setNormalRoutine(e.target.value)}
            placeholder={"Describe your typical day, even roughly:\ne.g., Wake 7am, coffee, work 9-5, gym after work, cook dinner, bed by 11pm"}
            rows={3}
            className={`w-full px-3 py-2.5 border rounded-lg text-sm ${c.input} outline-none focus:ring-2 resize-none`} />
        </div>

        {/* Critical tasks + constraints */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          <div>
            <label className={`text-sm font-bold ${c.label} block mb-1.5`}>
              Non-negotiables <span className={`font-normal ${c.textMuted}`}>(optional)</span>
            </label>
            <input type="text" value={criticalTasks} onChange={e => setCriticalTasks(e.target.value)}
              placeholder="Medication, feed pets, pick up kids at 3pm..."
              className={`w-full px-3 py-2.5 border rounded-lg text-sm ${c.input} outline-none focus:ring-2`} />
          </div>
          <div>
            <label className={`text-sm font-bold ${c.label} block mb-1.5`}>
              Constraints <span className={`font-normal ${c.textMuted}`}>(optional)</span>
            </label>
            <input type="text" value={constraints} onChange={e => setConstraints(e.target.value)}
              placeholder="Can't leave house, no car, deadline Friday..."
              className={`w-full px-3 py-2.5 border rounded-lg text-sm ${c.input} outline-none focus:ring-2`} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={generate} disabled={loading || !disruption}
            className={`flex-1 ${c.btnPrimary} disabled:opacity-40 disabled:cursor-not-allowed font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 min-h-[48px]`}>
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Building your adapted day...</> : <><Calendar className="w-5 h-5" /> Build My Adapted Routine</>}
          </button>
          {results && (
            <button onClick={handleReset} className={`px-4 py-3 border-2 ${isDark ? 'border-zinc-600 text-zinc-300' : 'border-slate-300 text-slate-700'} rounded-lg font-semibold flex items-center gap-1.5`}>
              <RotateCcw className="w-4 h-4" /> New
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

          {/* ── FIRST WORDS ── */}
          {r.acknowledgment && (
            <div className={`${c.accentBg} border-2 rounded-xl p-5 text-center`}>
              <p className={`text-sm ${isDark ? 'text-sky-300' : 'text-sky-700'}`}>{r.acknowledgment}</p>
            </div>
          )}

          {/* ── SELF-CARE ANCHORS ── */}
          {r.self_care_anchors && r.self_care_anchors.length > 0 && (
            <div className={`${c.rose} border-2 rounded-xl p-5`}>
              <div className="flex items-center gap-2 mb-3">
                <Heart className={`w-4 h-4 ${isDark ? 'text-rose-400' : 'text-rose-600'}`} />
                <h3 className={`text-sm font-bold ${c.text}`}>Self-Care Anchors — Non-Negotiable Today</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {r.self_care_anchors.map((anchor, i) => (
                  <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDark ? 'bg-rose-900/30' : 'bg-rose-100/60'}`}>
                    <span className="text-base">{anchor.emoji || '💚'}</span>
                    <p className={`text-xs font-semibold ${c.text}`}>{anchor.task}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── ADAPTED SCHEDULE ── */}
          {r.adapted_schedule && r.adapted_schedule.length > 0 && (
            <div className="space-y-2">
              <h3 className={`text-sm font-bold ${c.text} flex items-center gap-2 px-1`}>
                <Clock className={`w-4 h-4 ${c.accent}`} /> Your Adapted Day
              </h3>
              {r.adapted_schedule.map((block, idx) => (
                <div key={idx} className={`${c.card} border rounded-xl p-4`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className={`text-xs font-bold ${c.accent}`}>{block.time}</span>
                      {block.label && <span className={`text-xs ${c.textMuted} ml-2`}>— {block.label}</span>}
                    </div>
                    {block.energy && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        block.energy === 'none' ? (isDark ? 'bg-zinc-700 text-zinc-300' : 'bg-gray-100 text-gray-600')
                        : block.energy === 'low' ? c.warning
                        : c.success
                      }`}>{block.energy} energy</span>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    {block.tasks.map((task, ti) => (
                      <div key={ti} className="flex items-start gap-2">
                        <span className={`text-xs mt-0.5 ${task.type === 'keep' ? c.successText : task.type === 'simplified' ? c.warningText : c.textMuted}`}>
                          {task.type === 'keep' ? '✅' : task.type === 'simplified' ? '🔄' : '⏭️'}
                        </span>
                        <div className="flex-1">
                          <p className={`text-xs ${c.text} ${task.type === 'skip' ? 'line-through opacity-50' : ''}`}>{task.text}</p>
                          {task.note && <p className={`text-[10px] ${c.textMuted}`}>{task.note}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── WHAT CHANGES / WHAT STAYS ── */}
          {r.summary && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {r.summary.keep && r.summary.keep.length > 0 && (
                <div className={`${c.keepBg} border rounded-xl p-4`}>
                  <p className={`text-[10px] font-black uppercase ${c.successText} mb-2`}>✅ Keep</p>
                  <div className="space-y-1">
                    {r.summary.keep.map((item, i) => (
                      <p key={i} className={`text-xs ${c.text}`}>{item}</p>
                    ))}
                  </div>
                </div>
              )}
              {r.summary.simplify && r.summary.simplify.length > 0 && (
                <div className={`${c.simplifyBg} border rounded-xl p-4`}>
                  <p className={`text-[10px] font-black uppercase ${c.warningText} mb-2`}>🔄 Simplify</p>
                  <div className="space-y-1">
                    {r.summary.simplify.map((item, i) => (
                      <p key={i} className={`text-xs ${c.text}`}>{item}</p>
                    ))}
                  </div>
                </div>
              )}
              {r.summary.drop && r.summary.drop.length > 0 && (
                <div className={`${c.dropBg} border rounded-xl p-4`}>
                  <p className={`text-[10px] font-black uppercase ${c.textMuted} mb-2`}>⏭️ Drop Today</p>
                  <div className="space-y-1">
                    {r.summary.drop.map((item, i) => (
                      <p key={i} className={`text-xs ${c.textSec} line-through`}>{item}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── WHAT TO TELL PEOPLE ── */}
          {r.what_to_tell_people && r.what_to_tell_people.length > 0 && (
            <Section icon={MessageSquare} title="What to Tell People" c={c}>
              <div className="space-y-2">
                {r.what_to_tell_people.map((script, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className={`flex-1 ${c.quoteBg} rounded-lg p-3`}>
                      <p className={`text-[10px] font-bold ${c.textMuted} mb-1`}>To {script.who}:</p>
                      <p className={`text-xs ${c.text}`}>"{script.say}"</p>
                    </div>
                    <button onClick={() => copyText(script.say, `script-${i}`)}
                      className={`${c.btnSec} p-2 rounded-lg min-h-[32px] flex-shrink-0`}>
                      {copiedItems[`script-${i}`] ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* ── PERMISSION ── */}
          {r.permissions && r.permissions.length > 0 && (
            <Section icon={Shield} iconColor={c.successText} title="Permission to Adapt" defaultOpen={true} c={c}>
              <div className="space-y-2">
                {r.permissions.map((p, i) => (
                  <div key={i} className={`flex items-start gap-2 ${c.success} border rounded-lg p-3`}>
                    <Check className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${c.successText}`} />
                    <p className={`text-xs ${isDark ? 'text-emerald-200' : 'text-emerald-800'}`}>{p}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* ── DANGER SIGNS ── */}
          {r.watch_for && r.watch_for.length > 0 && (
            <Section icon={AlertCircle} iconColor={c.warningText} title="Watch For" c={c}>
              <div className="space-y-2">
                {r.watch_for.map((sign, i) => (
                  <div key={i} className={`${c.warning} border rounded-lg p-3`}>
                    <p className={`text-xs ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>⚠️ {sign}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* ── RE-ENTRY PLAN ── */}
          {r.reentry && (
            <Section icon={ArrowRight} title="Getting Back to Normal" c={c}>
              {r.reentry.signs_ready && r.reentry.signs_ready.length > 0 && (
                <div>
                  <p className={`text-[10px] font-bold ${c.label} uppercase mb-1.5`}>Signs you are ready:</p>
                  <div className="space-y-1">
                    {r.reentry.signs_ready.map((sign, i) => (
                      <p key={i} className={`text-xs ${c.text}`}>✓ {sign}</p>
                    ))}
                  </div>
                </div>
              )}
              {r.reentry.phases && r.reentry.phases.length > 0 && (
                <div>
                  <p className={`text-[10px] font-bold ${c.label} uppercase mb-1.5`}>Gradual return:</p>
                  <div className="space-y-2">
                    {r.reentry.phases.map((phase, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-black ${
                          isDark ? 'bg-sky-700 text-sky-100' : 'bg-sky-100 text-sky-700'}`}>{i + 1}</span>
                        <div>
                          <p className={`text-xs font-bold ${c.text}`}>{phase.name}</p>
                          <p className={`text-[10px] ${c.textSec}`}>{phase.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {r.reentry.warning && (
                <p className={`text-xs ${c.textMuted} italic`}>💡 {r.reentry.warning}</p>
              )}
            </Section>
          )}

          {/* ── CLOSING ── */}
          {r.closing && (
            <div className={`${c.success} border rounded-xl p-4 text-center`}>
              <p className={`text-sm font-semibold ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>{r.closing}</p>
            </div>
          )}

          <p className={`text-[10px] ${c.textMuted} text-center px-4`}>
            This is a temporary plan. Your normal routine is still there waiting for you.
          </p>
        </div>
      )}
    </div>
  );
};

RoutineRuptureManager.displayName = 'RoutineRuptureManager';
export default RoutineRuptureManager;
