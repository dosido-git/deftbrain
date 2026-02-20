import React, { useState, useCallback } from 'react';
import {
  Loader2, AlertTriangle, Copy, Check, ChevronDown, ChevronUp,
  Award, Plus, X, Star, TrendingUp,
  FileText, Linkedin, MessageSquare, ArrowRight, Zap,
  Shield,
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
      ? 'bg-zinc-900 border-zinc-600 text-zinc-50 placeholder:text-zinc-500 focus:border-amber-500 focus:ring-amber-500/20'
      : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-100',
    text: d ? 'text-zinc-50' : 'text-slate-900',
    textSec: d ? 'text-zinc-400' : 'text-slate-600',
    textMuted: d ? 'text-zinc-500' : 'text-slate-500',
    label: d ? 'text-zinc-300' : 'text-slate-700',
    accent: d ? 'text-amber-400' : 'text-amber-600',
    accentBg: d ? 'bg-amber-900/30 border-amber-700/50' : 'bg-amber-50 border-amber-200',
    btnPrimary: d ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-amber-600 hover:bg-amber-700 text-white',
    btnSec: d ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-100' : 'bg-slate-100 hover:bg-slate-200 text-slate-800',
    danger: d ? 'bg-red-900/20 border-red-700/50 text-red-200' : 'bg-red-50 border-red-200 text-red-800',
    dangerText: d ? 'text-red-400' : 'text-red-600',
    success: d ? 'bg-emerald-900/20 border-emerald-700/50 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-800',
    successText: d ? 'text-emerald-400' : 'text-emerald-600',
    warning: d ? 'bg-amber-900/20 border-amber-700/50 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-800',
    info: d ? 'bg-blue-900/20 border-blue-700/50 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-800',
    purple: d ? 'bg-purple-900/20 border-purple-700/50 text-purple-200' : 'bg-purple-50 border-purple-200 text-purple-800',
    pillActive: d ? 'bg-amber-600 border-amber-500 text-white' : 'bg-amber-600 border-amber-600 text-white',
    pillInactive: d ? 'bg-zinc-700 border-zinc-600 text-zinc-300 hover:border-zinc-500' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300',
    divider: d ? 'border-zinc-700' : 'border-slate-200',
    quoteBg: d ? 'bg-zinc-900/60' : 'bg-slate-50',
    beforeBg: d ? 'bg-zinc-900/40 border-zinc-700' : 'bg-gray-50 border-gray-200',
    afterBg: d ? 'bg-amber-900/20 border-amber-700/40' : 'bg-amber-50/80 border-amber-200',
  };
}

// ════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════
const INDUSTRIES = [
  { value: 'tech', label: 'Tech / Software' },
  { value: 'finance', label: 'Finance / Banking' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education', label: 'Education' },
  { value: 'marketing', label: 'Marketing / Creative' },
  { value: 'sales', label: 'Sales / BD' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'nonprofit', label: 'Nonprofit / NGO' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'government', label: 'Government' },
  { value: 'retail', label: 'Retail / Hospitality' },
  { value: 'other', label: 'Other' },
];

const LEVELS = [
  { value: 'entry', label: 'Entry-level', emoji: '🌱' },
  { value: 'mid', label: 'Mid-level', emoji: '📈' },
  { value: 'senior', label: 'Senior / Lead', emoji: '⭐' },
  { value: 'manager', label: 'Manager / Director', emoji: '🎯' },
  { value: 'executive', label: 'VP / Executive', emoji: '👔' },
  { value: 'student', label: 'Student / New grad', emoji: '🎓' },
];

const PURPOSES = [
  { value: 'resume', label: 'Resume', icon: FileText },
  { value: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { value: 'interview', label: 'Interview Prep', icon: MessageSquare },
  { value: 'review', label: 'Performance Review', icon: Star },
  { value: 'raise', label: 'Raise / Promotion', icon: TrendingUp },
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
const BragSheetBuilder = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const c = useColors();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [accomplishments, setAccomplishments] = useState([]);
  const [currentEntry, setCurrentEntry] = useState('');
  const [industry, setIndustry] = useState('');
  const [level, setLevel] = useState('');
  const [purposes, setPurposes] = useState(['resume']);
  const [roleTitle, setRoleTitle] = useState('');
  const [yearsExp, setYearsExp] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [copiedItems, setCopiedItems] = useState({});

  const addAccomplishment = useCallback(() => {
    const text = currentEntry.trim();
    if (!text) return;
    setAccomplishments(prev => [...prev, text]);
    setCurrentEntry('');
  }, [currentEntry]);

  const removeAccomplishment = useCallback((idx) => {
    setAccomplishments(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addAccomplishment(); }
  }, [addAccomplishment]);

  const togglePurpose = useCallback((p) => {
    setPurposes(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  }, []);

  const build = useCallback(async () => {
    const all = [...accomplishments];
    if (currentEntry.trim()) all.push(currentEntry.trim());
    if (all.length === 0) { setError('Add at least one accomplishment.'); return; }
    setError(''); setResults(null);
    try {
      const data = await callToolEndpoint('brag-sheet-builder', {
        accomplishments: all, industry: industry || 'general', level: level || 'mid',
        purposes: purposes.length > 0 ? purposes : ['resume'],
        roleTitle: roleTitle.trim() || null, yearsExp: yearsExp ? Number(yearsExp) : null,
      });
      setResults(data);
    } catch (err) { setError(err.message || 'Failed to build. Try again.'); }
  }, [accomplishments, currentEntry, industry, level, purposes, roleTitle, yearsExp, callToolEndpoint]);

  const handleReset = useCallback(() => {
    setAccomplishments([]); setCurrentEntry(''); setResults(null); setError('');
  }, []);

  const copyText = useCallback((text, key) => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopiedItems(p => ({ ...p, [key]: true }));
      setTimeout(() => setCopiedItems(p => ({ ...p, [key]: false })), 2000);
    }).catch(() => {});
  }, []);

  const canBuild = (accomplishments.length > 0 || currentEntry.trim()) && !loading;
  const r = results;

  return (
    <div className={`space-y-6 ${c.text}`}>
      {/* ── HEADER + FORM ── */}
      <div className={`${c.card} border rounded-xl p-6`}>
        <div className={`mb-5 pb-4 border-b ${c.divider}`}>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Brag Sheet Builder ✨</h2>
          <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
            {"Turn \"I helped with a project\" into \"Spearheaded a cross-functional initiative that drove 40% revenue growth\""}
          </p>
        </div>

        {/* Role + Experience */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div>
            <label className={`text-sm font-bold ${c.label} block mb-1.5`}>Your role <span className={`font-normal ${c.textMuted}`}>(optional)</span></label>
            <input type="text" value={roleTitle} onChange={e => setRoleTitle(e.target.value)}
              placeholder="e.g., Product Manager, Nurse, Teacher..."
              className={`w-full px-3 py-2.5 border rounded-lg text-sm ${c.input} outline-none focus:ring-2`} />
          </div>
          <div>
            <label className={`text-sm font-bold ${c.label} block mb-1.5`}>Years of experience <span className={`font-normal ${c.textMuted}`}>(optional)</span></label>
            <input type="number" value={yearsExp} onChange={e => setYearsExp(e.target.value)} placeholder="e.g., 3"
              className={`w-full px-3 py-2.5 border rounded-lg text-sm ${c.input} outline-none focus:ring-2`} />
          </div>
        </div>

        {/* Industry */}
        <div className="mb-4">
          <label className={`text-sm font-bold ${c.label} block mb-2`}>Industry</label>
          <div className="flex flex-wrap gap-1.5">
            {INDUSTRIES.map(ind => (
              <button key={ind.value} onClick={() => setIndustry(ind.value === industry ? '' : ind.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors min-h-[32px] ${industry === ind.value ? c.pillActive : c.pillInactive}`}>
                {ind.label}
              </button>
            ))}
          </div>
        </div>

        {/* Level */}
        <div className="mb-4">
          <label className={`text-sm font-bold ${c.label} block mb-2`}>Career level</label>
          <div className="flex flex-wrap gap-1.5">
            {LEVELS.map(lv => (
              <button key={lv.value} onClick={() => setLevel(lv.value === level ? '' : lv.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors min-h-[32px] ${level === lv.value ? c.pillActive : c.pillInactive}`}>
                {lv.emoji} {lv.label}
              </button>
            ))}
          </div>
        </div>

        {/* Purpose */}
        <div className="mb-5">
          <label className={`text-sm font-bold ${c.label} block mb-2`}>What is this for? <span className={`font-normal ${c.textMuted}`}>(pick all that apply)</span></label>
          <div className="flex flex-wrap gap-1.5">
            {PURPOSES.map(p => {
              const PIcon = p.icon;
              return (
                <button key={p.value} onClick={() => togglePurpose(p.value)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold border transition-colors min-h-[36px] flex items-center gap-1.5 ${purposes.includes(p.value) ? c.pillActive : c.pillInactive}`}>
                  <PIcon className="w-3.5 h-3.5" /> {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── ACCOMPLISHMENTS ── */}
        <div className="mb-5">
          <label className={`text-sm font-bold ${c.label} block mb-2`}>
            Your accomplishments <span className={`font-normal ${c.textMuted}`}>(be as humble as you want)</span>
          </label>
          {accomplishments.length > 0 && (
            <div className="space-y-2 mb-3">
              {accomplishments.map((acc, idx) => (
                <div key={idx} className={`flex items-start gap-2 p-3 rounded-lg ${c.quoteBg}`}>
                  <span className={`text-xs font-bold ${c.accent} mt-0.5`}>{idx + 1}.</span>
                  <p className={`flex-1 text-sm ${c.text}`}>{acc}</p>
                  <button onClick={() => removeAccomplishment(idx)} className={`${c.textMuted} hover:text-red-500 transition-colors p-1`}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input type="text" value={currentEntry} onChange={e => setCurrentEntry(e.target.value)} onKeyDown={handleKeyDown}
              placeholder={accomplishments.length === 0 ? "e.g., I helped improve our onboarding process..." : "Add another accomplishment..."}
              className={`flex-1 px-3 py-2.5 border rounded-lg text-sm ${c.input} outline-none focus:ring-2`} />
            <button onClick={addAccomplishment} disabled={!currentEntry.trim()}
              className={`${c.btnPrimary} disabled:opacity-30 px-4 rounded-lg font-bold min-h-[42px]`}>
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <p className={`text-[10px] ${c.textMuted} mt-1`}>Press Enter to add. Be as vague as you want.</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={build} disabled={!canBuild}
            className={`flex-1 ${c.btnPrimary} disabled:opacity-40 disabled:cursor-not-allowed font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 min-h-[48px]`}>
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Transforming...</> : <><Award className="w-5 h-5" /> Build My Brag Sheet</>}
          </button>
          {results && (
            <button onClick={handleReset} className={`px-5 py-3 border-2 ${isDark ? 'border-zinc-600 text-zinc-300' : 'border-slate-300 text-slate-700'} font-semibold rounded-lg`}>
              Start Over
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

          {/* ── BEFORE → AFTER ── */}
          {r.transformations && r.transformations.length > 0 && (
            <div className="space-y-3">
              <h3 className={`text-sm font-bold ${c.text} flex items-center gap-2`}>
                <Zap className={`w-4 h-4 ${c.accent}`} /> Before → After
              </h3>
              {r.transformations.map((t, idx) => (
                <div key={idx} className={`${c.card} border rounded-xl p-4 space-y-3`}>
                  <div className={`${c.beforeBg} border rounded-lg p-3`}>
                    <p className={`text-[10px] font-bold ${c.textMuted} uppercase mb-1`}>You said:</p>
                    <p className={`text-sm ${c.textSec} italic`}>{t.original}</p>
                  </div>
                  <div className="flex items-center gap-2 px-2">
                    <ArrowRight className={`w-3.5 h-3.5 ${c.accent}`} />
                    <span className={`text-[10px] font-bold ${c.accent}`}>{t.what_changed}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className={`flex-1 ${c.afterBg} border rounded-lg p-3`}>
                      <p className={`text-[10px] font-bold ${c.accent} uppercase mb-1`}>Power version:</p>
                      <p className={`text-sm font-semibold ${c.text}`}>{t.improved}</p>
                    </div>
                    <button onClick={() => copyText(t.improved, `transform-${idx}`)}
                      className={`${c.btnSec} p-2 rounded-lg min-h-[32px] flex-shrink-0`}>
                      {copiedItems[`transform-${idx}`] ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  {t.verb_upgrades && t.verb_upgrades.length > 0 && (
                    <div className="flex flex-wrap gap-2 px-1">
                      {t.verb_upgrades.map((vu, i) => (
                        <span key={i} className={`text-[10px] px-2 py-0.5 rounded-full ${c.accentBg} border font-bold`}>
                          <span className={c.textMuted}>{vu.from}</span> → <span className={c.accent}>{vu.to}</span>
                        </span>
                      ))}
                    </div>
                  )}
                  {t.why_you_deserve_this && (
                    <div className={`${c.purple} border rounded-lg p-3 flex items-start gap-2`}>
                      <Shield className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                      <p className={`text-xs ${isDark ? 'text-purple-200' : 'text-purple-800'}`}>{t.why_you_deserve_this}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── METRICS EXCAVATOR ── */}
          {r.metrics_to_find && r.metrics_to_find.length > 0 && (
            <Section icon={TrendingUp} title="Metrics Excavator" badge="DIG DEEPER" defaultOpen={true} c={c}>
              <p className={`text-xs ${c.textMuted} mb-2`}>Answer these to make your bullets even stronger:</p>
              <div className="space-y-2">
                {r.metrics_to_find.map((mq, i) => (
                  <div key={i} className={`${c.quoteBg} rounded-lg p-3`}>
                    <p className={`text-xs font-bold ${c.text}`}>{mq.question}</p>
                    <p className={`text-[10px] ${c.textMuted} mt-1`}>Why: {mq.why}</p>
                    {mq.example && <p className={`text-[10px] ${c.accent} mt-1`}>e.g., "{mq.example}"</p>}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* ── STAR STORIES ── */}
          {r.star_stories && r.star_stories.length > 0 && (
            <Section icon={Star} title="STAR Interview Stories" defaultOpen={purposes.includes('interview')} c={c}>
              {r.star_stories.map((story, idx) => (
                <div key={idx} className="space-y-2">
                  {idx > 0 && <div className={`border-t ${c.divider} my-3`} />}
                  <p className={`text-xs font-bold ${c.accent}`}>Story {idx + 1}: {story.title}</p>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { key: 'S', label: 'Situation', val: story.situation },
                      { key: 'T', label: 'Task', val: story.task },
                      { key: 'A', label: 'Action', val: story.action },
                      { key: 'R', label: 'Result', val: story.result },
                    ].map(s => s.val ? (
                      <div key={s.key} className={`flex items-start gap-2 ${c.quoteBg} rounded-lg p-2.5`}>
                        <span className={`text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isDark ? 'bg-amber-700 text-amber-100' : 'bg-amber-100 text-amber-700'}`}>{s.key}</span>
                        <div>
                          <p className={`text-[10px] font-bold ${c.textMuted}`}>{s.label}</p>
                          <p className={`text-xs ${c.text}`}>{s.val}</p>
                        </div>
                      </div>
                    ) : null)}
                  </div>
                  <button onClick={() => copyText(
                    `Situation: ${story.situation}\nTask: ${story.task}\nAction: ${story.action}\nResult: ${story.result}`, `star-${idx}`
                  )} className={`${c.btnSec} px-3 py-1.5 rounded-lg flex items-center gap-1 text-xs min-h-[28px]`}>
                    {copiedItems[`star-${idx}`] ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copiedItems[`star-${idx}`] ? 'Copied' : 'Copy story'}
                  </button>
                </div>
              ))}
            </Section>
          )}

          {/* ── RESUME BULLETS ── */}
          {r.resume_bullets && r.resume_bullets.length > 0 && (
            <Section icon={FileText} title="Resume Bullets" defaultOpen={purposes.includes('resume')} c={c}>
              <div className="space-y-2">
                {r.resume_bullets.map((bullet, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <p className={`flex-1 text-sm ${c.text}`}>{"• " + bullet}</p>
                    <button onClick={() => copyText(bullet, `bullet-${i}`)}
                      className={`${c.btnSec} p-1.5 rounded-lg min-h-[28px] flex-shrink-0`}>
                      {copiedItems[`bullet-${i}`] ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                ))}
              </div>
              <button onClick={() => copyText(r.resume_bullets.map(b => `\u2022 ${b}`).join('\n'), 'all-bullets')}
                className={`${c.btnSec} px-3 py-1.5 rounded-lg flex items-center gap-1 text-xs min-h-[28px]`}>
                {copiedItems['all-bullets'] ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copiedItems['all-bullets'] ? 'Copied all' : 'Copy all bullets'}
              </button>
            </Section>
          )}

          {/* ── LINKEDIN ── */}
          {r.linkedin_about && (
            <Section icon={Linkedin} title="LinkedIn About Section" defaultOpen={purposes.includes('linkedin')} c={c}>
              <div className="flex items-start gap-2">
                <div className={`flex-1 ${c.quoteBg} rounded-lg p-4`}>
                  <p className={`text-sm ${c.text} whitespace-pre-wrap leading-relaxed`}>{r.linkedin_about}</p>
                </div>
                <button onClick={() => copyText(r.linkedin_about, 'linkedin')}
                  className={`${c.btnSec} p-2 rounded-lg min-h-[32px] flex-shrink-0`}>
                  {copiedItems.linkedin ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </Section>
          )}

          {/* ── PERFORMANCE REVIEW ── */}
          {r.performance_review && (
            <Section icon={Star} title="Performance Review Self-Assessment" defaultOpen={purposes.includes('review')} c={c}>
              <div className="flex items-start gap-2">
                <div className={`flex-1 ${c.quoteBg} rounded-lg p-4`}>
                  <p className={`text-sm ${c.text} whitespace-pre-wrap leading-relaxed`}>{r.performance_review}</p>
                </div>
                <button onClick={() => copyText(r.performance_review, 'review')}
                  className={`${c.btnSec} p-2 rounded-lg min-h-[32px] flex-shrink-0`}>
                  {copiedItems.review ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </Section>
          )}

          {/* ── RAISE / PROMOTION ── */}
          {r.raise_ammunition && (
            <Section icon={TrendingUp} title="Raise / Promotion Ammunition" badge="BUSINESS VALUE"
              badgeColor={c.success} defaultOpen={purposes.includes('raise')} c={c}>
              <p className={`text-sm ${c.textSec} mb-2`}>{r.raise_ammunition.summary}</p>
              {r.raise_ammunition.value_statements && r.raise_ammunition.value_statements.length > 0 && (
                <div className="space-y-2">
                  {r.raise_ammunition.value_statements.map((vs, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className={`flex-1 ${c.success} border rounded-lg p-3`}>
                        <p className={`text-xs font-bold ${c.successText}`}>{vs}</p>
                      </div>
                      <button onClick={() => copyText(vs, `raise-${i}`)}
                        className={`${c.btnSec} p-1.5 rounded-lg min-h-[28px] flex-shrink-0`}>
                        {copiedItems[`raise-${i}`] ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {r.raise_ammunition.script && (
                <div>
                  <p className={`text-[10px] font-bold ${c.label} uppercase mb-1`}>Say this in the meeting:</p>
                  <div className="flex items-start gap-2">
                    <div className={`flex-1 ${c.quoteBg} rounded-lg p-3`}>
                      <p className={`text-xs ${c.text}`}>"{r.raise_ammunition.script}"</p>
                    </div>
                    <button onClick={() => copyText(r.raise_ammunition.script, 'raise-script')}
                      className={`${c.btnSec} p-2 rounded-lg min-h-[32px] flex-shrink-0`}>
                      {copiedItems['raise-script'] ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              )}
            </Section>
          )}

          {/* ── CONFIDENCE ── */}
          {r.confidence && (
            <div className={`${c.accentBg} border-2 rounded-xl p-5`}>
              <div className="flex items-start gap-3">
                <Shield className={`w-5 h-5 flex-shrink-0 mt-0.5 ${c.accent}`} />
                <div>
                  <h3 className={`text-sm font-bold ${c.text} mb-1`}>Permission to Brag</h3>
                  {r.confidence.reframe && <p className={`text-sm ${c.textSec} mb-2`}>{r.confidence.reframe}</p>}
                  {r.confidence.imposter_killer && (
                    <p className={`text-xs ${isDark ? 'text-amber-300' : 'text-amber-700'} font-semibold`}>{r.confidence.imposter_killer}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <p className={`text-[10px] ${c.textMuted} text-center px-4`}>
            Your accomplishments are real. Describing them accurately is not bragging. It is clarity.
          </p>
        </div>
      )}
    </div>
  );
};

BragSheetBuilder.displayName = 'BragSheetBuilder';
export default BragSheetBuilder;
