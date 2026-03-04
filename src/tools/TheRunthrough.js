import React, { useState, useRef, useEffect } from 'react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';
import { CopyBtn, ActionBar } from '../components/ActionButtons';

const MODES = [
  { id: 'cut',        label: 'Cut',        icon: '✂️', desc: 'Trim to fit your time' },
  { id: 'anticipate', label: 'Anticipate', icon: '🎯', desc: 'Predict tough Q&A' },
  { id: 'hook',       label: 'Hook',       icon: '🪝', desc: 'Rewrite open & close' },
];

const AUDIENCE_OPTIONS = [
  { id: 'executives',    label: 'Executives',     icon: '👔' },
  { id: 'investors',     label: 'Investors / VCs', icon: '💰' },
  { id: 'team',          label: 'Internal Team',   icon: '🤝' },
  { id: 'clients',       label: 'Clients',         icon: '💼' },
  { id: 'academic',      label: 'Academic',        icon: '🎓' },
  { id: 'general',       label: 'General',         icon: '👥' },
];

const TONE_OPTIONS = [
  { id: 'authoritative',  label: 'Authoritative',  icon: '🎤', desc: 'Commanding keynote' },
  { id: 'conversational', label: 'Conversational', icon: '☕', desc: 'Warm fireside chat' },
  { id: 'provocative',    label: 'Provocative',    icon: '⚡', desc: 'Bold and challenging' },
  { id: 'inspirational',  label: 'Inspirational',  icon: '✨', desc: 'Uplifting vision' },
];

const DIFFICULTY_COLORS = {
  hard:      { badge: 'bg-[#c8872e]/15 text-[#c8872e]', label: 'Hard' },
  very_hard: { badge: 'bg-[#b54a3f]/15 text-[#b54a3f]', label: 'Very Hard' },
  killer:    { badge: 'bg-[#8a2030]/20 text-[#d44a5a]', label: 'Killer' },
};

const TheRunthrough = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const resultsRef = useRef(null);

  // ─── Colors: Navy & Gold ───
  const c = {
    pageBg:       isDark ? 'bg-[#1a1816]'    : 'bg-[#faf8f5]',
    card:         isDark ? 'bg-[#2a2623]'     : 'bg-white',
    cardAlt:      isDark ? 'bg-[#332e2a]'     : 'bg-[#faf8f5]',
    cardBorder:   isDark ? 'border-[#3d3630]' : 'border-[#e8e1d5]',
    inputBg:      isDark ? 'bg-[#1a1816]'     : 'bg-[#faf8f5]',
    inputBorder:  isDark ? 'border-[#3d3630]' : 'border-[#d5cab8]',
    inputFocus:   isDark ? 'focus:border-[#4a6a8a] focus:ring-[#2c4a6e]/20'
                         : 'focus:border-[#4a6a8a] focus:ring-[#2c4a6e]/12',
    text:          isDark ? 'text-[#f0eeea]'  : 'text-[#3d3935]',
    textSecondary: isDark ? 'text-[#c8c3b9]'  : 'text-[#5a544a]',
    textMuted:     isDark ? 'text-[#8a8275]'  : 'text-[#8a8275]',
    heading:       isDark ? 'text-[#f3efe8]'  : 'text-[#1e2a3a]',
    btnPrimary:    isDark
      ? 'bg-[#2c4a6e] hover:bg-[#4a6a8a] text-white'
      : 'bg-[#2c4a6e] hover:bg-[#1e3a58] text-white',
    btnSecondary:  isDark
      ? 'bg-[#332e2a] hover:bg-[#3d3630] text-[#c8c3b9] border border-[#3d3630]'
      : 'bg-[#f3efe8] hover:bg-[#e8e1d5] text-[#5e5042] border border-[#d5cab8]',
    btnGold:       isDark
      ? 'bg-[#b06d22] hover:bg-[#c8872e] text-white'
      : 'bg-[#c8872e] hover:bg-[#b06d22] text-white',
    tabActive:     isDark ? 'text-[#a8b9ce] border-b-2 border-[#6e8aaa]' : 'text-[#2c4a6e] border-b-2 border-[#2c4a6e]',
    tabInactive:   isDark ? 'text-[#8a8275] hover:text-[#c8c3b9]' : 'text-[#8a8275] hover:text-[#5a544a]',
    tabBorder:     isDark ? 'border-[#3d3630]' : 'border-[#e8e1d5]',
    chipActive:    isDark
      ? 'bg-[#2c4a6e]/40 border-[#4a6a8a] text-[#a8b9ce]'
      : 'bg-[#d4dde8] border-[#2c4a6e] text-[#1e3a58]',
    chipInactive:  isDark
      ? 'bg-[#2a2623] border-[#3d3630] text-[#8a8275] hover:border-[#5a544a]'
      : 'bg-white border-[#e8e1d5] text-[#8a8275] hover:border-[#d5cab8]',
    accentBg:      isDark ? 'bg-[#2c4a6e]/12' : 'bg-[#e8eef5]',
    accentBorder:  isDark ? 'border-[#4a6a8a]' : 'border-[#b0c4d8]',
    accentText:    isDark ? 'text-[#a8b9ce]'   : 'text-[#2c4a6e]',
    goldBg:        isDark ? 'bg-[#b06d22]/10' : 'bg-[#fdf3e4]',
    goldBorder:    isDark ? 'border-[#b06d22]' : 'border-[#e0c49a]',
    goldText:      isDark ? 'text-[#d9a04e]'   : 'text-[#93541f]',
    successBg:     isDark ? 'bg-[#5a8a5c]/15'  : 'bg-[#e8f0e8]',
    warningBg:     isDark ? 'bg-[#c8872e]/15'  : 'bg-[#fdf3e4]',
    errorBg:       isDark ? 'bg-[#b54a3f]/15'  : 'bg-[#fceae8]',
    divider:       isDark ? 'border-[#3d3630]' : 'border-[#e8e1d5]',
    error:         isDark ? 'bg-[#b54a3f]/15 border-[#b54a3f] text-[#e8a9a3]'
                          : 'bg-[#fceae8] border-[#d4908a] text-[#8a3028]',
  };

  // ─── State ───
  const [mode, setMode] = useState('cut');
  const [content, setContent] = useState('');
  const [timeMinutes, setTimeMinutes] = useState(5);
  const [context, setContext] = useState('');
  const [audience, setAudience] = useState('general');
  const [stakes, setStakes] = useState('');
  const [tone, setTone] = useState('conversational');
  const [goal, setGoal] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [expandedSections, setExpandedSections] = useState({});

  useEffect(() => {
    if (results && resultsRef.current) {
      setTimeout(() => {
        resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 250);
    }
  }, [results]);

  const toggleSection = (key) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // ─── Handlers ───
  const handleSubmit = async () => {
    if (!content.trim()) return;
    setError('');
    setResults(null);
    setExpandedSections({});

    try {
      let endpoint, payload;

      if (mode === 'cut') {
        endpoint = 'the-runthrough-cut';
        payload = { content: content.trim(), timeMinutes, context };
      } else if (mode === 'anticipate') {
        endpoint = 'the-runthrough-anticipate';
        payload = { content: content.trim(), audience, stakes };
      } else {
        endpoint = 'the-runthrough-hook';
        payload = { content: content.trim(), tone, goal };
      }

      const res = await callToolEndpoint(endpoint, payload);
      setResults({ mode, data: res });
    } catch (err) {
      setError(err.message || 'Something went wrong. Try again.');
    }
  };

  const handleReset = () => {
    setResults(null);
    setError('');
    setExpandedSections({});
  };

  const handleModeSwitch = (newMode) => {
    setMode(newMode);
    setResults(null);
    setError('');
    setExpandedSections({});
  };

  // ─── Build text helpers ───
  const buildCutText = (d) => {
    let t = `✂️ THE RUNTHROUGH — CUT MODE\n`;
    t += `Original: ~${d.original_word_count} words (~${d.original_est_minutes} min)\n`;
    t += `Trimmed: ~${d.trimmed_word_count} words (~${d.trimmed_est_minutes} min) → Target: ${d.target_minutes} min\n\n`;
    t += `━━ TRIMMED CONTENT ━━\n${d.trimmed_content}\n\n`;
    if (d.what_was_cut?.length) {
      t += `━━ WHAT WAS CUT ━━\n`;
      d.what_was_cut.forEach(c => { t += `• ${c.section}: ${c.reason}\n`; });
      t += '\n';
    }
    if (d.what_was_kept) t += `━━ CORE THREAD ━━\n${d.what_was_kept}\n\n`;
    if (d.pacing_notes) t += `━━ PACING ━━\n${d.pacing_notes}\n\n`;
    return t + `— Generated by DeftBrain · deftbrain.com`;
  };

  const buildAnticipateText = (d) => {
    let t = `🎯 THE RUNTHROUGH — ANTICIPATE MODE\n`;
    t += `${d.presentation_summary}\n\n`;
    if (d.vulnerability_scan) {
      t += `━━ VULNERABILITY SCAN ━━\n`;
      t += `Weakest claim: ${d.vulnerability_scan.weakest_claim}\n`;
      t += `Missing data: ${d.vulnerability_scan.missing_data}\n`;
      t += `Assumption risk: ${d.vulnerability_scan.assumption_risk}\n\n`;
    }
    t += `━━ TOUGH QUESTIONS ━━\n`;
    (d.tough_questions || []).forEach((q, i) => {
      t += `${i + 1}. [${q.difficulty}] ${q.question}\n`;
      t += `   Answer: ${q.draft_answer}\n`;
      t += `   Trap: ${q.trap_to_avoid}\n\n`;
    });
    if (d.curveball) {
      t += `━━ CURVEBALL ━━\n${d.curveball.question}\nAnswer: ${d.curveball.draft_answer}\n\n`;
    }
    if (d.overall_readiness) t += `━━ READINESS ━━\n${d.overall_readiness}\n\n`;
    return t + `— Generated by DeftBrain · deftbrain.com`;
  };

  const buildHookText = (d) => {
    let t = `🪝 THE RUNTHROUGH — HOOK MODE\n\n`;
    if (d.diagnosis) {
      t += `━━ DIAGNOSIS ━━\n`;
      t += `Opening: ${d.diagnosis.current_opening} — ${d.diagnosis.opening_problem}\n`;
      t += `Closing: ${d.diagnosis.current_closing} — ${d.diagnosis.closing_problem}\n\n`;
    }
    if (d.new_opening) {
      t += `━━ NEW OPENING (${d.new_opening.technique}) ━━\n${d.new_opening.text}\n\n`;
    }
    if (d.new_closing) {
      t += `━━ NEW CLOSING (${d.new_closing.technique}) ━━\n${d.new_closing.text}\n\n`;
    }
    if (d.transitions?.length) {
      t += `━━ TRANSITIONS ━━\n`;
      d.transitions.forEach(tr => { t += `${tr.between}: "${tr.rewritten}"\n`; });
      t += '\n';
    }
    if (d.energy_arc) t += `━━ ENERGY ARC ━━\n${d.energy_arc}\n\n`;
    return t + `— Generated by DeftBrain · deftbrain.com`;
  };

  const buildFullText = () => {
    if (!results) return '';
    const d = results.data;
    if (results.mode === 'cut') return buildCutText(d);
    if (results.mode === 'anticipate') return buildAnticipateText(d);
    return buildHookText(d);
  };

  // ─── Loading messages ───
  const loadingMessages = {
    cut: 'Trimming the fat...',
    anticipate: 'Thinking like your toughest audience member...',
    hook: 'Rewriting your opening to land harder...',
  };

  // ─── Submit button labels ───
  const submitLabels = {
    cut: '✂️ Cut It Down',
    anticipate: '🎯 Predict the Q&A',
    hook: '🪝 Rewrite My Hooks',
  };

  // ─── Render: Cut Results ───
  const CutResults = ({ data: d }) => (
    <div className="space-y-5">
      {/* Stats bar */}
      <div className={`grid grid-cols-3 gap-3`}>
        {[
          { label: 'Original', value: `~${d.original_est_minutes} min`, sub: `${d.original_word_count} words` },
          { label: 'Trimmed', value: `~${d.trimmed_est_minutes} min`, sub: `${d.trimmed_word_count} words` },
          { label: 'Target', value: `${d.target_minutes} min`, sub: d.trimmed_est_minutes <= d.target_minutes ? '✅ Fits!' : '⚠️ Close' },
        ].map((s, i) => (
          <div key={i} className={`${c.cardAlt} ${c.cardBorder} border rounded-xl p-3 text-center`}>
            <p className={`text-xs ${c.textMuted} uppercase font-semibold`}>{s.label}</p>
            <p className={`text-lg font-bold ${c.heading}`}>{s.value}</p>
            <p className={`text-xs ${c.textMuted}`}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Trimmed content */}
      <div className={`${c.card} ${c.cardBorder} border rounded-2xl p-5`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className={`font-bold ${c.heading} flex items-center gap-2`}>
            <span>📄</span> Trimmed Presentation
          </h3>
          <CopyBtn content={`${d.trimmed_content}\n\n— Generated by DeftBrain · deftbrain.com`} label="Copy" />
        </div>
        <div className={`${c.inputBg} ${c.inputBorder} border rounded-xl p-4`}>
          <p className={`text-sm ${c.text} leading-relaxed whitespace-pre-wrap`}>
            {d.trimmed_content}
          </p>
        </div>
      </div>

      {/* What was cut */}
      {d.what_was_cut?.length > 0 && (
        <div className={`${c.card} ${c.cardBorder} border rounded-2xl p-5`}>
          <button onClick={() => toggleSection('cuts')} className="w-full flex items-center justify-between">
            <h3 className={`font-bold ${c.heading} flex items-center gap-2`}>
              <span>🗑️</span> What Was Cut ({d.what_was_cut.length})
            </h3>
            <span className={`text-sm ${c.textMuted}`}>{expandedSections['cuts'] !== false ? '▲' : '▼'}</span>
          </button>
          {expandedSections['cuts'] !== false && (
            <div className="mt-3 space-y-2">
              {d.what_was_cut.map((cut, i) => (
                <div key={i} className={`${c.errorBg} rounded-xl p-3 flex items-start gap-2`}>
                  <span className="text-sm flex-shrink-0">✕</span>
                  <div>
                    <p className={`text-sm font-medium ${c.text}`}>{cut.section}</p>
                    <p className={`text-xs ${c.textMuted} mt-0.5`}>{cut.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Core thread + pacing */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {d.what_was_kept && (
          <div className={`${c.successBg} rounded-2xl p-4`}>
            <p className={`text-xs font-semibold uppercase ${isDark ? 'text-[#8aba8c]' : 'text-[#3d6e3f]'} mb-2 flex items-center gap-1.5`}>
              <span>💎</span> Core Thread
            </p>
            <p className={`text-sm ${c.text} leading-relaxed`}>{d.what_was_kept}</p>
          </div>
        )}
        {d.pacing_notes && (
          <div className={`${c.accentBg} rounded-2xl p-4`}>
            <p className={`text-xs font-semibold uppercase ${c.accentText} mb-2 flex items-center gap-1.5`}>
              <span>🎵</span> Pacing Notes
            </p>
            <p className={`text-sm ${c.text} leading-relaxed`}>{d.pacing_notes}</p>
          </div>
        )}
      </div>
    </div>
  );

  // ─── Render: Anticipate Results ───
  const AnticipateResults = ({ data: d }) => (
    <div className="space-y-5">
      {/* Summary */}
      {d.presentation_summary && (
        <div className={`${c.cardAlt} ${c.cardBorder} border rounded-2xl p-4 text-center`}>
          <p className={`text-xs font-semibold uppercase tracking-wider ${c.textMuted} mb-1`}>Your presentation argues</p>
          <p className={`text-sm font-medium italic ${c.text}`}>"{d.presentation_summary}"</p>
        </div>
      )}

      {/* Vulnerability scan */}
      {d.vulnerability_scan && (
        <div className={`${c.card} ${c.cardBorder} border rounded-2xl p-5`}>
          <h3 className={`font-bold ${c.heading} flex items-center gap-2 mb-4`}>
            <span>🛡️</span> Vulnerability Scan
          </h3>
          <div className="space-y-3">
            {[
              { icon: '⚡', label: 'Weakest Claim', value: d.vulnerability_scan.weakest_claim, bg: c.errorBg },
              { icon: '📊', label: 'Missing Data', value: d.vulnerability_scan.missing_data, bg: c.warningBg },
              { icon: '🧊', label: 'Assumption Risk', value: d.vulnerability_scan.assumption_risk, bg: c.accentBg },
            ].map((v, i) => (
              <div key={i} className={`${v.bg} rounded-xl p-3 flex items-start gap-2.5`}>
                <span className="text-base flex-shrink-0">{v.icon}</span>
                <div>
                  <p className={`text-xs font-semibold uppercase ${c.textMuted} mb-0.5`}>{v.label}</p>
                  <p className={`text-sm ${c.text} leading-relaxed`}>{v.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tough questions */}
      {d.tough_questions?.length > 0 && (
        <div className="space-y-3">
          <h3 className={`font-bold ${c.heading} flex items-center gap-2 px-1`}>
            <span>🎯</span> Tough Questions ({d.tough_questions.length})
          </h3>
          {d.tough_questions.map((q, i) => {
            const isOpen = expandedSections[`q-${i}`] !== false;
            const diff = DIFFICULTY_COLORS[q.difficulty] || DIFFICULTY_COLORS.hard;
            return (
              <div key={i} className={`${c.card} ${c.cardBorder} border rounded-2xl overflow-hidden transition-all`}>
                <button onClick={() => toggleSection(`q-${i}`)} className="w-full p-4 flex items-start gap-3 text-left">
                  <span className={`text-sm font-bold ${c.accentText} mt-0.5 flex-shrink-0`}>{i + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${c.text} leading-snug`}>{q.question}</p>
                    <p className={`text-xs ${c.textMuted} mt-1`}>{q.why_they_ask}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${diff.badge}`}>{diff.label}</span>
                    <span className={`text-sm ${c.textMuted}`}>{isOpen ? '▲' : '▼'}</span>
                  </div>
                </button>
                {isOpen && (
                  <div className={`px-4 pb-4 pt-0 ml-7 space-y-3 border-t ${c.divider}`}>
                    <div className={`${c.successBg} rounded-xl p-3 mt-3`}>
                      <p className={`text-xs font-semibold uppercase ${isDark ? 'text-[#8aba8c]' : 'text-[#3d6e3f]'} mb-1`}>Draft Answer</p>
                      <p className={`text-sm ${c.text} leading-relaxed`}>{q.draft_answer}</p>
                    </div>
                    <div className={`${c.warningBg} rounded-xl p-3`}>
                      <p className={`text-xs font-semibold uppercase ${c.goldText} mb-1`}>⚠️ Trap to Avoid</p>
                      <p className={`text-sm ${c.text} leading-relaxed`}>{q.trap_to_avoid}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Curveball */}
      {d.curveball && (
        <div className={`${c.goldBg} ${c.goldBorder} border rounded-2xl p-5`}>
          <h3 className={`font-bold ${c.goldText} flex items-center gap-2 mb-3`}>
            <span>🃏</span> Curveball
          </h3>
          <p className={`text-sm font-semibold ${c.text} mb-2`}>{d.curveball.question}</p>
          <p className={`text-sm ${c.textSecondary} leading-relaxed`}>{d.curveball.draft_answer}</p>
        </div>
      )}

      {/* Readiness */}
      {d.overall_readiness && (
        <div className={`${c.accentBg} ${c.accentBorder} border rounded-2xl p-4`}>
          <p className={`text-xs font-semibold uppercase ${c.accentText} mb-1 flex items-center gap-1.5`}>
            <span>📊</span> Overall Readiness
          </p>
          <p className={`text-sm ${c.text} leading-relaxed`}>{d.overall_readiness}</p>
        </div>
      )}
    </div>
  );

  // ─── Render: Hook Results ───
  const HookResults = ({ data: d }) => (
    <div className="space-y-5">
      {/* Diagnosis */}
      {d.diagnosis && (
        <div className={`${c.card} ${c.cardBorder} border rounded-2xl p-5`}>
          <h3 className={`font-bold ${c.heading} flex items-center gap-2 mb-4`}>
            <span>🔍</span> Diagnosis
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className={`${c.errorBg} rounded-xl p-3`}>
              <p className={`text-xs font-semibold uppercase ${isDark ? 'text-[#e8a9a3]' : 'text-[#8a3028]'} mb-1`}>Current Opening</p>
              <p className={`text-sm ${c.text} mb-1`}>{d.diagnosis.current_opening}</p>
              <p className={`text-xs ${c.textMuted} italic`}>{d.diagnosis.opening_problem}</p>
            </div>
            <div className={`${c.errorBg} rounded-xl p-3`}>
              <p className={`text-xs font-semibold uppercase ${isDark ? 'text-[#e8a9a3]' : 'text-[#8a3028]'} mb-1`}>Current Closing</p>
              <p className={`text-sm ${c.text} mb-1`}>{d.diagnosis.current_closing}</p>
              <p className={`text-xs ${c.textMuted} italic`}>{d.diagnosis.closing_problem}</p>
            </div>
          </div>
        </div>
      )}

      {/* New opening */}
      {d.new_opening && (
        <div className={`${c.successBg} rounded-2xl p-5`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`font-bold ${isDark ? 'text-[#8aba8c]' : 'text-[#3d6e3f]'} flex items-center gap-2`}>
              <span>🎬</span> New Opening
            </h3>
            <CopyBtn content={`${d.new_opening.text}\n\n— Generated by DeftBrain · deftbrain.com`} label="Copy" />
          </div>
          <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-3 ${isDark ? 'bg-[#5a8a5c]/30 text-[#8aba8c]' : 'bg-[#d0e4d0] text-[#2d5a2f]'}`}>
            {d.new_opening.technique}
          </span>
          <p className={`text-sm ${c.text} leading-relaxed whitespace-pre-wrap`}>{d.new_opening.text}</p>
          <p className={`text-xs ${c.textMuted} mt-2 italic`}>{d.new_opening.why_it_works}</p>
        </div>
      )}

      {/* New closing */}
      {d.new_closing && (
        <div className={`${c.accentBg} rounded-2xl p-5`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`font-bold ${c.accentText} flex items-center gap-2`}>
              <span>🎬</span> New Closing
            </h3>
            <CopyBtn content={`${d.new_closing.text}\n\n— Generated by DeftBrain · deftbrain.com`} label="Copy" />
          </div>
          <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-3 ${isDark ? 'bg-[#2c4a6e]/30 text-[#a8b9ce]' : 'bg-[#d4dde8] text-[#1e3a58]'}`}>
            {d.new_closing.technique}
          </span>
          <p className={`text-sm ${c.text} leading-relaxed whitespace-pre-wrap`}>{d.new_closing.text}</p>
          <p className={`text-xs ${c.textMuted} mt-2 italic`}>{d.new_closing.why_it_works}</p>
        </div>
      )}

      {/* Transitions */}
      {d.transitions?.length > 0 && (
        <div className={`${c.card} ${c.cardBorder} border rounded-2xl p-5`}>
          <h3 className={`font-bold ${c.heading} flex items-center gap-2 mb-4`}>
            <span>🔗</span> Key Transitions ({d.transitions.length})
          </h3>
          <div className="space-y-3">
            {d.transitions.map((tr, i) => (
              <div key={i} className={`${c.cardAlt} ${c.cardBorder} border rounded-xl p-4`}>
                <p className={`text-xs font-semibold ${c.accentText} mb-2`}>{tr.between}</p>
                {tr.original && (
                  <p className={`text-sm ${c.textMuted} line-through mb-1`}>{tr.original}</p>
                )}
                <p className={`text-sm font-medium ${c.text} leading-relaxed`}>"{tr.rewritten}"</p>
                <p className={`text-xs ${c.textMuted} mt-1 italic`}>{tr.why}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Energy arc */}
      {d.energy_arc && (
        <div className={`${c.goldBg} ${c.goldBorder} border rounded-2xl p-4`}>
          <p className={`text-xs font-semibold uppercase ${c.goldText} mb-2 flex items-center gap-1.5`}>
            <span>📈</span> Energy Arc
          </p>
          <p className={`text-sm ${c.text} leading-relaxed`}>{d.energy_arc}</p>
        </div>
      )}
    </div>
  );

  // ─── Main Render ───
  return (
    <div className={`min-h-screen ${c.pageBg} transition-colors duration-200`}>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="text-4xl">🎙️</div>
          <h1 className={`text-2xl font-bold ${c.heading}`}>The Runthrough</h1>
          <p className={`text-sm ${c.textSecondary}`}>
            Presentation coach in your pocket. Cut, prepare, and polish.
          </p>
        </div>

        {/* Mode tabs */}
        <div className={`flex border-b ${c.tabBorder}`}>
          {MODES.map(m => (
            <button
              key={m.id}
              onClick={() => handleModeSwitch(m.id)}
              className={`flex-1 py-3 text-center text-sm font-medium transition-all duration-150
                ${mode === m.id ? c.tabActive : c.tabInactive}`}
            >
              <span className="mr-1.5">{m.icon}</span>
              <span className="hidden sm:inline">{m.label}</span>
              <span className="sm:hidden">{m.label}</span>
            </button>
          ))}
        </div>

        {/* Mode description */}
        <p className={`text-xs ${c.textMuted} text-center italic`}>
          {MODES.find(m => m.id === mode)?.desc}
        </p>

        {/* Input card */}
        <div className={`${c.card} ${c.cardBorder} border rounded-2xl p-5 shadow-sm space-y-4`}>

          {/* Content textarea (all modes) */}
          <div className="space-y-2">
            <label className={`text-sm font-semibold ${c.text}`}>
              <span className="mr-1.5">📝</span> Presentation content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste your presentation text, speaker notes, or outline here..."
              rows={6}
              className={`w-full px-4 py-3 rounded-xl text-sm ${c.inputBg} ${c.inputBorder} ${c.inputFocus} border ${c.text} placeholder:${c.textMuted} resize-y outline-none transition-colors`}
            />
            <p className={`text-xs ${c.textMuted} text-right`}>{content.length > 0 ? `~${Math.round(content.split(/\s+/).filter(Boolean).length / 130)} min at speaking pace` : ''}</p>
          </div>

          {/* Mode-specific inputs */}
          {mode === 'cut' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className={`text-sm font-semibold ${c.text}`}>
                  <span className="mr-1.5">⏱️</span> Time limit (minutes)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={60}
                    value={timeMinutes}
                    onChange={(e) => setTimeMinutes(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className={`text-sm font-bold ${c.heading} w-12 text-center`}>{timeMinutes}m</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className={`text-sm font-semibold ${c.text}`}>
                  <span className="mr-1.5">💡</span> Context <span className={`font-normal ${c.textMuted}`}>(optional)</span>
                </label>
                <input
                  type="text"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="e.g. Conference keynote, team standup, investor pitch..."
                  className={`w-full px-4 py-2.5 rounded-xl text-sm ${c.inputBg} ${c.inputBorder} ${c.inputFocus} border ${c.text} placeholder:${c.textMuted} outline-none transition-colors`}
                />
              </div>
            </div>
          )}

          {mode === 'anticipate' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className={`text-sm font-semibold ${c.text}`}>
                  <span className="mr-1.5">👥</span> Audience
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {AUDIENCE_OPTIONS.map(a => (
                    <button
                      key={a.id}
                      onClick={() => setAudience(a.id)}
                      className={`${audience === a.id ? c.chipActive : c.chipInactive} border rounded-xl px-2 py-2.5 text-center transition-all duration-150`}
                    >
                      <span className="text-lg block mb-0.5">{a.icon}</span>
                      <p className="text-xs font-medium leading-tight">{a.label}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className={`text-sm font-semibold ${c.text}`}>
                  <span className="mr-1.5">🔥</span> Stakes <span className={`font-normal ${c.textMuted}`}>(optional)</span>
                </label>
                <input
                  type="text"
                  value={stakes}
                  onChange={(e) => setStakes(e.target.value)}
                  placeholder="e.g. Asking for $2M funding, proposing a reorg..."
                  className={`w-full px-4 py-2.5 rounded-xl text-sm ${c.inputBg} ${c.inputBorder} ${c.inputFocus} border ${c.text} placeholder:${c.textMuted} outline-none transition-colors`}
                />
              </div>
            </div>
          )}

          {mode === 'hook' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className={`text-sm font-semibold ${c.text}`}>
                  <span className="mr-1.5">🎭</span> Tone
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TONE_OPTIONS.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setTone(t.id)}
                      className={`${tone === t.id ? c.chipActive : c.chipInactive} border rounded-xl px-3 py-2.5 text-left transition-all duration-150`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{t.icon}</span>
                        <div>
                          <p className="text-sm font-medium leading-tight">{t.label}</p>
                          <p className={`text-xs ${c.textMuted} leading-tight mt-0.5`}>{t.desc}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className={`text-sm font-semibold ${c.text}`}>
                  <span className="mr-1.5">🎯</span> Goal <span className={`font-normal ${c.textMuted}`}>(optional)</span>
                </label>
                <input
                  type="text"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="e.g. Get them excited about our roadmap, convince the board..."
                  className={`w-full px-4 py-2.5 rounded-xl text-sm ${c.inputBg} ${c.inputBorder} ${c.inputFocus} border ${c.text} placeholder:${c.textMuted} outline-none transition-colors`}
                />
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading || !content.trim()}
            className={`w-full ${c.btnGold} py-3 rounded-xl font-semibold text-sm shadow-md
              disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2`}
          >
            {loading ? (
              <>
                <span className="animate-spin inline-block">⏳</span>
                {loadingMessages[mode]}
              </>
            ) : (
              submitLabels[mode]
            )}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className={`${c.error} border rounded-xl p-4 text-sm flex items-center gap-2`}>
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Results */}
        {results && (
          <div ref={resultsRef} className="space-y-5">
            {results.mode === 'cut' && <CutResults data={results.data} />}
            {results.mode === 'anticipate' && <AnticipateResults data={results.data} />}
            {results.mode === 'hook' && <HookResults data={results.data} />}

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <ActionBar
                content={buildFullText()}
                title="The Runthrough"
              />
              <button
                onClick={handleReset}
                className={`${c.btnSecondary} px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-1.5`}
              >
                <span>🔄</span> Start Over
              </button>
            </div>

            {/* Cross-references */}
            <div className={`${c.cardAlt} ${c.cardBorder} border rounded-xl p-4 space-y-2`}>
              <p className={`text-xs font-semibold ${c.textMuted} uppercase tracking-wider`}>
                Related tools
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'VelvetHammer', icon: '🔨', label: 'Soften tough messages' },
                  { id: 'GhostWriter', icon: '✍️', label: 'Write recommendations' },
                  { id: 'NoiseCanceler', icon: '🔇', label: 'Filter to what matters' },
                ].map(ref => (
                  <a
                    key={ref.id}
                    href={`/tool/${ref.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${c.btnSecondary} px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1.5`}
                  >
                    <span>{ref.icon}</span> {ref.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

TheRunthrough.displayName = 'TheRunthrough';
export default TheRunthrough;
