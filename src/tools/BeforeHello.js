import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '../hooks/useTheme';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useRegisterActions } from '../components/ActionBarContext';
import { usePersistentState } from '../hooks/usePersistentState';
import { useTranslation } from '../i18n/useTranslation';
import { pickExample } from '../utils/exampleRotation';

const EXAMPLES = [
  {
    targetType: 'investor',
    targetDescriptionKey: 'bh_ex1_target',
    whyThemContextKey: 'bh_ex1_why',
    yourBackgroundKey: 'bh_ex1_background',
  },
  {
    targetType: 'mentor',
    targetDescriptionKey: 'bh_ex2_target',
    whyThemContextKey: 'bh_ex2_why',
    yourBackgroundKey: 'bh_ex2_background',
  },
];
const TARGET_TYPES = [
  { id: 'mentor', labelKey: 'bh_type_mentor', icon: '🧭' },
  { id: 'investor', labelKey: 'bh_type_investor', icon: '💰' },
  { id: 'collaborator', labelKey: 'bh_type_collaborator', icon: '🤝' },
  { id: 'employer', labelKey: 'bh_type_employer', icon: '💼' },
  { id: 'peer', labelKey: 'bh_type_peer', icon: '👥' },
  { id: 'client', labelKey: 'bh_type_client', icon: '📦' },
  { id: 'connector', labelKey: 'bh_type_connector', icon: '🌐' },
];

const BeforeHello = ({ tool }) => {
  const { callToolEndpoint, loading, userLocale, userCurrency, userRegion } = useClaudeAPI();
  const { isDark } = useTheme();
  const { t } = useTranslation();


  const c = {
    card:          isDark ? 'bg-zinc-800' : 'bg-white',
    cardAlt:       isDark ? 'bg-zinc-700/50' : 'bg-slate-50',
    input:         isDark ? 'bg-zinc-900 border-zinc-600 text-zinc-100 placeholder-zinc-400 focus:border-cyan-500 focus:ring-cyan-500/20' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-cyan-500 focus:ring-cyan-100',
    text:          isDark ? 'text-zinc-50' : 'text-gray-900',
    textSecondary: isDark ? 'text-zinc-300' : 'text-gray-600',
    textMuted:     isDark ? 'text-zinc-400' : 'text-gray-500',
    labelText:     isDark ? 'text-zinc-200' : 'text-gray-700',
    accentTxt:     isDark ? 'text-cyan-400' : 'text-cyan-600',
    btnPrimary:    isDark ? 'bg-cyan-600 hover:bg-cyan-500 text-white' : 'bg-cyan-600 hover:bg-cyan-700 text-white',
    // Waiting for input: an outline, not a smudge. Empty fill keeps "filled"
    // meaning "ready"; the border and label carry the visibility. Important
    // modifiers because tools carry their own border/text utilities on the
    // submit and Tailwind resolves conflicts by stylesheet order, not class
    // order. See the PF-13 exception in audit/audit_v2-3-2.py.
    btnIdle:       isDark ? '!bg-transparent !border-2 !border-cyan-500/85 !text-cyan-300 cursor-not-allowed'
                          : '!bg-transparent !border-2 !border-cyan-600/85 !text-cyan-800 cursor-not-allowed',
    btnSecondary:  isDark ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    border:        isDark ? 'border-zinc-700' : 'border-gray-200',
    success:       isDark ? 'bg-emerald-900/20 border-emerald-700 text-emerald-200' : 'bg-emerald-50 border-emerald-300 text-emerald-800',
    warning:       isDark ? 'bg-amber-900/20 border-amber-700 text-amber-200' : 'bg-amber-50 border-amber-300 text-amber-800',
    danger:        isDark ? 'bg-red-900/20 border-red-700 text-red-200' : 'bg-red-50 border-red-200 text-red-800',
    required:      isDark ? 'text-amber-400' : 'text-amber-700',
  };
  c.textMuteded = c.textMuted;
  c.label = c.labelText;

  const linkStyle = isDark
    ? 'text-cyan-400 hover:text-cyan-300 underline underline-offset-2'
    : 'text-cyan-700 hover:text-cyan-800 underline underline-offset-2';

  const [targetType, setTargetType] = useState('');
  const [whyThemContext, setWhyThemContext] = useState('');
  const [yourBackground, setYourBackground] = useState('');
  const [targetDescription, setTargetDescription] = usePersistentState('gw-target-desc', '');
  const [sessionHistory, setSessionHistory] = usePersistentState('gravitywell-history', []);
  const resultsRef = React.useRef(null);
  const [results, setResults] = usePersistentState('gravitywell-results', null);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!targetDescription.trim()) return;
    setError(''); setResults(null);
    try {
      const data = await callToolEndpoint('gravity-well', {
        targetDescription: targetDescription.trim(),
        targetType: targetType || undefined,
        whyThemContext: whyThemContext.trim() || undefined,
        yourBackground: yourBackground.trim() || undefined,
        userLocale,
        userCurrency,
        userRegion,
      });
      setResults(data);
      // PF-25 exception: 40-char preview-text truncation; session history is capped at 6.
      setSessionHistory(prev => [{ id: Date.now(), date: new Date().toISOString(), preview: targetDescription.slice(0, 40) }, ...prev].slice(0, 6));
    } catch (e) { setError(t('bh_error_generate')); }
  };

  const loadExample = useCallback(() => {
    const ex = pickExample('GravityWell', EXAMPLES);
    setTargetType(ex.targetType);
    setTargetDescription(t(ex.targetDescriptionKey));
    setWhyThemContext(t(ex.whyThemContextKey));
    setYourBackground(t(ex.yourBackgroundKey));
    setResults(null);
  }, [t, setTargetType, setTargetDescription, setWhyThemContext, setYourBackground, setResults]);

  const buildFullText = useCallback(() => {
    if (!results) return '';
    let txt = `${t('bh_title').toUpperCase()}\n\n${t('bh_export_professional_connection')}: ${targetDescription}\n\n`;
    if (results.starting_position) {
      txt += `${t('bh_starting_position').toUpperCase()}\n${t('bh_what_you_bring')}: ${results.starting_position.what_you_bring || ''}\n${t('bh_whats_missing')}: ${results.starting_position.what_is_missing || ''}\n${t('bh_why_connect')}: ${results.starting_position.connection_case || ''}\n\n`;
    }
    if (results.strengthen_your_position) {
      txt += `${t('bh_strengthen').toUpperCase()}\n${results.strengthen_your_position.summary || ''}\n`;
      results.strengthen_your_position.actions?.forEach(a => { txt += `• ${a.action} — ${a.why_it_matters_anyway}\n`; });
      txt += '\n';
    }
    if (results.ready_to_say_hello) txt += `${t('bh_ready_heading').toUpperCase()} ${t(`bh_status_${results.ready_to_say_hello.status}`)}\n${results.ready_to_say_hello.why || ''}\n\n`;
    if (results.first_contact?.what_to_say) txt += `${t('bh_first_contact').toUpperCase()}\n${results.first_contact.what_to_say}\n\n`;
    if (results.do_today) txt += `${t('bh_do_today').toUpperCase()}\n${results.do_today}\n`;
    return txt + '\n\n— Generated by DeftBrain · deftbrain.com';
  }, [results, targetDescription, t]);

  useRegisterActions(buildFullText(), t('bh_title'));

  const handleSubmitRef = useRef(null);
  const canSubmitRef = useRef(false);
  handleSubmitRef.current = handleSubmit;
  canSubmitRef.current = !!targetDescription.trim();

  useEffect(() => {
    if (!results || !resultsRef.current) return;
    const timer = setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results]);

  useEffect(() => {
    const handler = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'SELECT') return;
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !loading && canSubmitRef.current) {
        e.preventDefault();
        handleSubmitRef.current?.();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const actions = results?.strengthen_your_position?.actions || [];

  return (
    <div className={`space-y-4 ${c.text}`}>

      {/* ── Persistent Header ── */}
      <div className={`${c.card} border ${c.border} rounded-xl shadow-sm`}>
        <div className="px-5 pt-2.5">
          <div className="pb-3 border-b border-zinc-500">
            <div className="flex items-start justify-between gap-3">
              <div>
                {/* PF-30 — the wrapper already prints the tool name as the page heading. */}
                <p className={`text-base ${c.textSecondary}`}>
                  <span className="me-2 text-lg">{tool?.icon ?? '🌀'}</span>{t('bh_tagline')}
                </p>
                <button onClick={loadExample} disabled={loading} style={{ backgroundColor: (tool?.headerColor ?? '#888888') + '80' }} className="mt-2 px-4 py-2 rounded-full text-sm font-semibold border border-black/25 text-zinc-900 shadow-sm hover:brightness-105 hover:shadow transition disabled:opacity-40 whitespace-nowrap">✨ {t('try_example')}</button>
              </div>
              {/* PF-16: the tool's one reset, on the title row, from the first keystroke. */}
              {(results || targetDescription.trim() || targetType.trim() || whyThemContext.trim() || yourBackground.trim()) ? (
                <button onClick={() => { setResults(null); setTargetDescription(''); setTargetType(''); setWhyThemContext(''); setYourBackground(''); }} className={`${c.btnSecondary} px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0 whitespace-nowrap`}>
                  {t('bh_new_target')}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

        {!results && (
          <div className={`rounded-2xl border p-6 shadow-sm space-y-4 ${c.card} ${c.border}`}>
            <div>
              <label className={`block text-sm font-semibold mb-1.5 ${c.text}`}>
                {t('bh_target_label')} <span className={c.required}>*</span>
              </label>
              <textarea value={targetDescription} onChange={e => setTargetDescription(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && targetDescription.trim()) handleSubmit(); }}
                placeholder={t('bh_target_ph')}
                rows={3} maxLength={500}
                className={`w-full px-4 py-3 rounded-xl border text-sm resize-none ${c.input}`} />
            </div>

            <div>
              <label className={`block text-sm font-semibold mb-2 ${c.text}`}>{t('bh_type_label')}<br /><span className={`font-normal ${c.textMuteded}`}>{t('bh_optional')}</span></label>
              <div className="flex flex-wrap gap-2">
                {TARGET_TYPES.map(tt => (
                  <button key={tt.id} onClick={() => setTargetType(targetType === tt.id ? '' : tt.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      targetType === tt.id ? 'bg-cyan-700 text-white border-cyan-700' : c.btnSecondary
                    }`}>
                    {t(tt.labelKey)}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={`block text-sm font-semibold mb-1.5 ${c.text}`}>{t('bh_why_label')} <span className={`font-normal ${c.textMuteded}`}>{t('bh_optional')}</span></label>
                <textarea value={whyThemContext} onChange={e => setWhyThemContext(e.target.value)}
                  placeholder={t('bh_why_ph')}
                  rows={2} maxLength={300}
                  className={`w-full px-4 py-3 rounded-xl border text-sm resize-none ${c.input}`} />
              </div>
              <div>
                <label className={`block text-sm font-semibold mb-1.5 ${c.text}`}>{t('bh_bring_label')} <span className={`font-normal ${c.textMuteded}`}>{t('bh_optional')}</span></label>
                <textarea value={yourBackground} onChange={e => setYourBackground(e.target.value)}
                  placeholder={t('bh_bring_ph')}
                  rows={2} maxLength={300}
                  className={`w-full px-4 py-3 rounded-xl border text-sm resize-none ${c.input}`} />
              </div>
            </div>

            {error && <div className={`p-3 rounded-xl border text-sm ${c.danger}`}><span className="me-1">⚠️</span>{error}</div>}

          <button title={t('cmd_enter')} onClick={handleSubmit} disabled={loading || !targetDescription.trim()}
            className={`relative w-full py-3 rounded-xl font-bold ${(!targetDescription.trim()) ? c.btnIdle : c.btnPrimary}`}>
            {loading ? <><span className="animate-spin inline-block me-2">{tool?.icon ?? '🌀'}</span>{t('bh_thinking')}</> : <><span className="me-1">{tool?.icon ?? '🌀'}</span>{t('bh_build_plan')}</>}
            {!loading && (
            <kbd aria-hidden="true"
              className="hidden sm:flex items-center absolute end-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded border border-white/30 bg-white/15 text-[10px] font-bold tracking-wide">
              ⌘↵
            </kbd>
          )}
          </button>

            <p className={`text-xs text-center ${c.textMuteded}`}>{t('bh_no_target_note')}</p>

            <div className={`rounded-xl border p-4 ${c.cardAlt} ${c.border}`}>
              <p className={`text-[10px] font-bold ${c.textMuted} uppercase mb-2`}>🔗 {t('bh_related')}</p>
              <div className="flex flex-wrap gap-3">
                <a href="/VelvetHammer" className={`text-xs ${linkStyle}`}>🔨 {t('bh_xref_velvet')}</a>
                <a href="/HecklerPrep" className={`text-xs ${linkStyle}`}>🎤 {t('bh_xref_heckler')}</a>
                <a href="/LuckSurface" className={`text-xs ${linkStyle}`}>🧲 {t('bh_xref_luck')}</a>
              </div>
            </div>
          </div>
        )}

        {results && (
          <div className="space-y-4">
            {results.starting_position && (
              <div className={`rounded-2xl border p-5 ${c.card} ${c.border}`}>
                <p className={`text-xs font-black uppercase tracking-widest mb-3 ${c.textMuted}`}>🧭 {t('bh_starting_position')}</p>
                <p className={`text-sm mb-2 ${c.textSecondary}`}><span className={`font-semibold ${c.text}`}>{t('bh_what_you_bring')}:</span> {results.starting_position.what_you_bring}</p>
                <p className={`text-sm mb-2 ${c.textSecondary}`}><span className={`font-semibold ${c.text}`}>{t('bh_whats_missing')}:</span> {results.starting_position.what_is_missing}</p>
                <p className={`text-sm ${c.textSecondary}`}><span className={`font-semibold ${c.text}`}>{t('bh_why_connect')}:</span> {results.starting_position.connection_case}</p>
              </div>
            )}

            {results.strengthen_your_position && (
              <div className={`rounded-2xl border overflow-hidden ${c.card} ${c.border}`}>
                <div className={`px-5 py-4 ${isDark ? 'bg-amber-900/10' : 'bg-amber-50'}`}>
                  <p className={`text-xs font-black uppercase tracking-widest mb-1 ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>1 · {t('bh_strengthen')}</p>
                  <p className={`text-sm font-semibold ${c.text}`}>{results.strengthen_your_position.summary}</p>
                </div>
                <div className="px-5 py-4 space-y-3">
                  {actions.map((a, i) => (
                    <div key={i} className={`p-3 rounded-xl border ${c.cardAlt} ${c.border}`}>
                      <p className={`text-sm font-semibold ${c.text}`}>{a.action}</p>
                      <p className={`text-xs mt-1 ${c.textMuted}`}><span className="font-semibold">{t('bh_worth_doing_anyway')}:</span> {a.why_it_matters_anyway}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.genuine_overlap && (
              <div className={`rounded-2xl border p-5 ${c.card} ${c.border}`}>
                <p className={`text-xs font-black uppercase tracking-widest mb-3 ${c.textMuted}`}>2 · {t('bh_genuine_overlap')}</p>
                <p className={`text-sm mb-2 ${c.textSecondary}`}><span className={`font-semibold ${c.text}`}>{t('bh_where_exists')}:</span> {results.genuine_overlap.where_it_exists}</p>
                <p className={`text-sm mb-2 ${c.textSecondary}`}><span className={`font-semibold ${c.text}`}>{t('bh_how_deepen')}:</span> {results.genuine_overlap.how_to_deepen_it}</p>
                <p className={`text-sm ${isDark ? 'text-amber-200' : 'text-amber-800'}`}><span className="font-semibold">{t('bh_dont_manufacture')}:</span> {results.genuine_overlap.what_not_to_manufacture}</p>
              </div>
            )}

            {results.ready_to_say_hello && (
              <div className={`rounded-2xl border-2 p-5 ${isDark ? 'border-cyan-700 bg-cyan-900/10' : 'border-cyan-300 bg-cyan-50'}`}>
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <p className={`text-xs font-black uppercase tracking-widest ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>3 · {t('bh_ready_heading')}</p>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-black ${c.card} border ${c.border}`}>{t(`bh_status_${results.ready_to_say_hello.status}`)}</span>
                </div>
                <p className={`text-sm mb-2 ${c.text}`}>{results.ready_to_say_hello.why}</p>
                {results.ready_to_say_hello.conditions?.filter(Boolean).length > 0 && (
                  <div className={`text-xs ${c.textSecondary}`}>
                    <span className="font-semibold">{t('bh_useful_conditions')}:</span> {results.ready_to_say_hello.conditions.filter(Boolean).join(' · ')}
                  </div>
                )}
              </div>
            )}

            {results.first_contact && (
              <div className={`rounded-2xl border p-5 ${c.card} ${c.border}`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${c.textMuted}`}>✉ {t('bh_first_contact')}</p>
                <p className={`text-sm mb-2 ${c.textSecondary}`}><span className={`font-semibold ${c.text}`}>{t('bh_when')}:</span> {results.first_contact.when_to_reach_out}</p>
                <p className={`text-sm mb-3 ${c.textSecondary}`}><span className={`font-semibold ${c.text}`}>{t('bh_frame')}:</span> {results.first_contact.the_frame}</p>
                <div className={`p-3 rounded-xl border font-mono text-sm mb-2 ${isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-slate-50 border-gray-200'} ${c.textSecondary}`}>{results.first_contact.what_to_say}</div>
                <p className={`text-xs ${isDark ? 'text-red-300' : 'text-red-700'}`}><span className="font-semibold">{t('bh_dont_say')}:</span> {results.first_contact.what_not_to_say}</p>
              </div>
            )}

            {results.do_today && (
              <div className={`rounded-2xl border-2 p-5 ${isDark ? 'border-emerald-700 bg-emerald-900/10' : 'border-emerald-300 bg-emerald-50'}`}>
                <p className={`text-xs font-black uppercase tracking-widest mb-2 ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>⚡ {t('bh_do_today')}</p>
                <p className={`text-sm font-medium ${c.text}`}>{results.do_today}</p>
              </div>
            )}

            <div className={`rounded-xl border p-4 ${c.cardAlt} ${c.border}`}>
              <p className={`text-[10px] font-bold ${c.textMuted} uppercase mb-2`}>🔗 {t('bh_related')}</p>
              <div className="flex flex-wrap gap-3">
                <a href="/LuckSurface" className={`text-xs ${linkStyle}`}>🧲 {t('bh_xref_luck')}</a>
                <a href="/VelvetHammer" className={`text-xs ${linkStyle}`}>🔨 {t('bh_xref_velvet')}</a>
                <a href="/HecklerPrep" className={`text-xs ${linkStyle}`}>🎤 {t('bh_xref_heckler')}</a>
              </div>
            </div>
          </div>
        )}
      {sessionHistory.length > 0 && (
        <div className={`${c.cardAlt} border ${c.border} rounded-xl p-4`}>
          <p className={`text-xs font-bold ${c.textMuted} mb-2`}>{t('bh_recent')}</p>
          <div className="space-y-1">
            {sessionHistory.map(s => (
              <div key={s.id} className="flex items-center justify-between">
                <span className={`text-xs ${c.textSecondary} truncate`}>{s.preview || t('bh_session')}</span>
                <span className={`text-xs ${c.textMuted} ms-2`}>{new Date(s.date).toLocaleDateString(userLocale || undefined)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className={`${c.cardAlt} border ${c.border} rounded-xl p-3 text-center`}>
        <p className={`text-xs ${c.textMuted}`}>
          {t('bh_disclaimer')}
        </p>
      </div>

    </div>
  );
};

BeforeHello.displayName = 'BeforeHello';
export default BeforeHello;
