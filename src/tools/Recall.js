import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';
import { usePersistentState } from '../hooks/usePersistentState';
import { CopyBtn, ActionBar } from '../components/ActionButtons';

// ════════════════════════════════════════════════════════════
// THEME — Navy & Gold
// ════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════
const MODES = [
  { value: 'distill',     emoji: '🎯', label: 'Distill',     desc: 'Key bullet points' },
  { value: 'study_guide', emoji: '📝', label: 'Study Guide', desc: 'Structured review' },
  { value: 'test_prep',   emoji: '🧪', label: 'Test Prep',   desc: 'Practice questions' },
  { value: 'connect',     emoji: '🔗', label: 'Connect',     desc: 'Cross-lecture themes' },
];

const PRIORITIES = [
  { value: 'balanced', label: '⚖️ Balanced' },
  { value: 'conceptual', label: '🧠 Concepts' },
  { value: 'factual', label: '📋 Facts' },
  { value: 'applied', label: '🔧 Applied' },
];

const EXAM_FORMATS = [
  { value: 'mixed', label: '📝 Mixed' },
  { value: 'multiple_choice', label: '🔘 Multiple Choice' },
  { value: 'short_answer', label: '✏️ Short Answer' },
  { value: 'essay', label: '📄 Essay' },
  { value: 'problem_solving', label: '🔢 Problem Solving' },
];

const Q_TYPES = [
  { value: 'multiple_choice', label: '🔘 Multiple Choice' },
  { value: 'short_answer', label: '✏️ Short Answer' },
  { value: 'essay', label: '📄 Essay' },
  { value: 'true_false', label: '✅ True / False' },
  { value: 'fill_blank', label: '📝 Fill in Blank' },
];

const TYPE_LABELS = {
  definition: '📖 Definition', process: '⚙️ Process', cause_effect: '🔗 Cause/Effect',
  comparison: '⚖️ Comparison', application: '🔧 Application', framework: '🏗️ Framework',
  fact: '📋 Fact', formula: '🔢 Formula',
};

const DIFF_LABELS = { easy: '🟢 Easy', medium: '🟡 Medium', hard: '🔴 Hard' };

// ════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════
const Recall = ({ tool }) => {
  const { isDark } = useTheme();

  const linkStyle = isDark
    ? 'text-cyan-400 hover:text-cyan-300 underline underline-offset-2'
    : 'text-cyan-600 hover:text-cyan-700 underline underline-offset-2';

  const c = {
    card:          isDark ? 'bg-zinc-800' : 'bg-white',
    cardAlt:       isDark ? 'bg-zinc-700/50' : 'bg-slate-50',
    input:         isDark ? 'bg-zinc-900 border-zinc-600 text-zinc-100 placeholder-zinc-400 focus:border-cyan-500 focus:ring-cyan-500/20' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-cyan-500 focus:ring-cyan-100',
    text:          isDark ? 'text-zinc-50' : 'text-gray-900',
    textSecondary: isDark ? 'text-zinc-300' : 'text-gray-600',
    textMuted:     isDark ? 'text-zinc-500' : 'text-gray-400',
    btnPrimary:    isDark ? 'bg-cyan-600 hover:bg-cyan-500 text-white' : 'bg-cyan-600 hover:bg-cyan-700 text-white',
    btnSecondary:  isDark ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    border:        isDark ? 'border-zinc-700' : 'border-gray-200',
    success:       isDark ? 'bg-emerald-900/20 border-emerald-700 text-emerald-200' : 'bg-emerald-50 border-emerald-300 text-emerald-800',
    warning:       isDark ? 'bg-amber-900/20 border-amber-700 text-amber-200' : 'bg-amber-50 border-amber-300 text-amber-800',
    danger:        isDark ? 'bg-red-900/20 border-red-700 text-red-200' : 'bg-red-50 border-red-200 text-red-800',
    deleteHover:   isDark ? '${c.deleteHover}' : '${c.deleteHover}',
  };
  const { callToolEndpoint, loading } = useClaudeAPI();
  const resultsRef = useRef(null);

  const [history, setHistory] = usePersistentState('recall-history', []);
  const [showHistory, setShowHistory] = useState(false);

  // Mode
  const [mode, setMode] = useState('distill');

  // Shared input
  const [transcript, setTranscript] = useState('');
  const [subject, setSubject] = useState('');
  const [lectureTitle, setLectureTitle] = useState('');

  // Distill options
  const [bulletCount, setBulletCount] = useState(10);
  const [priority, setPriority] = useState('balanced');

  // Study guide options
  const [examFormat, setExamFormat] = useState('mixed');

  // Test prep options
  const [questionTypes, setQuestionTypes] = useState(['multiple_choice', 'short_answer']);
  const [difficulty, setDifficulty] = useState('mixed');
  const [questionCount, setQuestionCount] = useState(10);

  // Connect mode
  const [lectures, setLectures] = useState([
    { title: '', transcript: '' },
    { title: '', transcript: '' },
  ]);

  // Results
  const [results, setResults] = usePersistentState('recall-results', null);
  const [error, setError] = useState('');

  // UI state
  const [showAnswers, setShowAnswers] = useState({});
  const [expandedSections, setExpandedSections] = useState({});

  useEffect(() => {
    if (results && resultsRef.current) {
      setTimeout(() => resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
    }
  }, [results]);

  const charCount = useMemo(() => {
    if (mode === 'connect') return lectures.reduce((sum, l) => sum + (l.transcript?.length || 0), 0);
    return transcript.length;
  }, [mode, transcript, lectures]);

  // Connect helpers
  const addLecture = useCallback(() => { if (lectures.length < 5) setLectures(p => [...p, { title: '', transcript: '' }]); }, [lectures.length]);
  const removeLecture = useCallback((i) => { if (lectures.length > 2) setLectures(p => p.filter((_, idx) => idx !== i)); }, [lectures.length]);
  const updateLecture = useCallback((i, field, val) => setLectures(p => p.map((l, idx) => idx === i ? { ...l, [field]: val } : l)), []);

  // Question type toggle
  const toggleQType = useCallback((val) => {
    setQuestionTypes(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  }, []);

  const toggleSection = useCallback((key) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // ── API CALLS ──
  const submit = useCallback(async () => {
    setError(''); setResults(null); setShowAnswers({});
    try {
      let data;
      if (mode === 'distill') {
        if (!transcript.trim()) { setError('Paste your lecture transcript'); return; }
        data = await callToolEndpoint('recall', {
          transcript: transcript.trim(), subject: subject.trim() || null,
          lectureTitle: lectureTitle.trim() || null, bulletCount, priority,
        });
      } else if (mode === 'study_guide') {
        if (!transcript.trim()) { setError('Paste your lecture transcript'); return; }
        data = await callToolEndpoint('recall/study-guide', {
          transcript: transcript.trim(), subject: subject.trim() || null,
          lectureTitle: lectureTitle.trim() || null, examFormat,
        });
      } else if (mode === 'test_prep') {
        if (!transcript.trim()) { setError('Paste your lecture transcript'); return; }
        data = await callToolEndpoint('recall/test-prep', {
          transcript: transcript.trim(), subject: subject.trim() || null,
          lectureTitle: lectureTitle.trim() || null, questionTypes, difficulty, questionCount,
        });
      } else if (mode === 'connect') {
        const valid = lectures.filter(l => l.transcript?.trim());
        if (valid.length < 2) { setError('Need at least 2 lectures'); return; }
        data = await callToolEndpoint('recall/connect', {
          lectures: valid.map(l => ({ title: l.title.trim() || null, transcript: l.transcript.trim() })),
          subject: subject.trim() || null,
        });
      }
      setResults(data);
      const entry = {
        id: 'rc_' + Date.now(), date: new Date().toISOString(), mode,
        title: lectureTitle.trim() || subject.trim() || data?.lecture_summary?.substring(0, 40) || mode,
        subject: data?.subject_detected || subject.trim() || '',
        preview: (lectureTitle.trim() || subject.trim() || mode).slice(0, 40),
      };
      setHistory(prev => [entry, ...prev].slice(0, 6));
    } catch (err) { setError(err.message || 'Processing failed.'); }
  }, [mode, transcript, subject, lectureTitle, bulletCount, priority, examFormat, questionTypes, difficulty, questionCount, lectures, callToolEndpoint, setHistory]);

  const handleReset = useCallback(() => {
    setTranscript(''); setSubject(''); setLectureTitle('');
    setResults(null); setError(''); setShowAnswers({});
    setLectures([{ title: '', transcript: '' }, { title: '', transcript: '' }]);
  }, []);

  const canSubmit = mode === 'connect'
    ? lectures.filter(l => l.transcript?.trim()).length >= 2
    : transcript.trim().length > 0;

  // ── Copy builders ──
  const buildDistillCopy = useCallback(() => {
    if (!results?.bullets?.length) return '';
    const lines = [`🧠 Recall — ${results.lecture_summary || 'Lecture Notes'}`, ''];
    results.bullets.forEach(b => lines.push(`${b.rank}. ${b.point}`));
    if (results.vocabulary?.length) {
      lines.push('', 'KEY TERMS:');
      results.vocabulary.forEach(v => lines.push(`• ${v.term}: ${v.definition}`));
    }
    lines.push('', '— Generated by DeftBrain · deftbrain.com');
    return lines.join('\n');
  }, [results]);

  const buildStudyCopy = useCallback(() => {
    if (!results) return '';
    const lines = [`📝 Study Guide — ${results.title || 'Lecture'}`, '', results.overview || '', ''];
    results.concepts_to_know?.forEach(c => lines.push(`■ ${c.concept}: ${c.explanation}`));
    if (results.key_definitions?.length) {
      lines.push('', 'DEFINITIONS:');
      results.key_definitions.forEach(d => lines.push(`• ${d.term}: ${d.definition}`));
    }
    lines.push('', '— Generated by DeftBrain · deftbrain.com');
    return lines.join('\n');
  }, [results]);

  const buildTestCopy = useCallback(() => {
    if (!results?.questions?.length) return '';
    const lines = ['🧪 Practice Questions', ''];
    results.questions.forEach(q => {
      lines.push(`Q${q.number}. ${q.question}`);
      if (q.options) q.options.forEach(o => lines.push(`  ${o}`));
      lines.push(`  Answer: ${q.answer}`, '');
    });
    lines.push('— Generated by DeftBrain · deftbrain.com');
    return lines.join('\n');
  }, [results]);

  // ── Shared components ──
  const Pill = ({ active, onClick, children }) => (
    <button onClick={onClick} className={'px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ' + (active ? c.pillActive : c.pillInactive)}>
      {active && <span className="mr-1">✓</span>}{children}
    </button>
  );

  const Section = ({ title, emoji, sKey, badge, defaultOpen = false, children }) => {
    const open = expandedSections[sKey] ?? defaultOpen;
    return (
      <div className={c.card + ' border rounded-xl overflow-hidden'}>
        <button onClick={() => toggleSection(sKey)} className="w-full flex items-center justify-between p-4 text-left hover:opacity-80">
          <div className="flex items-center gap-2">
            <span className="text-base">{emoji}</span>
            <span className={'text-sm font-semibold ' + c.text}>{title}</span>
            {badge && <span className={'text-xs px-2 py-0.5 rounded-full ' + c.badge}>{badge}</span>}
          </div>
          <span className={'text-xs ' + c.textMuted}>{open ? '▲' : '▼'}</span>
        </button>
        {open && <div className={'px-4 pb-4 border-t ' + c.border}>{children}</div>}
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════
  // INPUT
  // ════════════════════════════════════════════════════════════
  const renderInput = () => (
    <div className="space-y-4">
      {/* Mode tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {MODES.map(m => (
          <button key={m.value} onClick={() => { setMode(m.value); setResults(null); setError(''); }}
            className={'flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all flex-shrink-0 ' +
              (mode === m.value ? c.pillActive + ' border-2' : c.pillInactive)}>
            <span className="text-lg">{m.emoji}</span>
            <div className="text-left">
              <p className={'text-xs font-bold ' + (mode === m.value ? '' : c.textMuted)}>{m.label}</p>
              <p className={'text-[10px] ' + c.textMuted}>{m.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Transcript input — shared for all modes except Connect */}
      {mode !== 'connect' ? (
        <div className={c.card + ' border rounded-xl p-5'}>
          <label className={'text-base font-bold ' + c.text + ' mb-1 block'}>📄 Paste lecture transcript or notes</label>
          <p className={'text-xs ' + c.textMuted + ' mb-3'}>From Zoom, Teams, Otter.ai, Google Meet — or your own typed notes.</p>
          <textarea value={transcript} onChange={e => setTranscript(e.target.value)}
            placeholder="Paste your transcript here... The more complete, the better the output."
            className={'w-full h-40 p-4 border-2 rounded-xl ' + c.input + ' outline-none focus:ring-2 resize-none text-sm font-mono'} />
          {charCount > 0 && (
            <p className={'text-xs ' + c.textMuted + ' mt-1'}>
              {charCount.toLocaleString()} characters · ~{Math.round(charCount / 750)} min of lecture
            </p>
          )}
        </div>
      ) : (
        /* Connect mode — multiple lectures */
        <div className="space-y-3">
          {lectures.map((lec, idx) => (
            <div key={idx} className={c.card + ' border rounded-xl p-4'}>
              <div className="flex items-center gap-2 mb-2">
                <span className={'text-xs font-bold ' + c.badge + ' px-2 py-0.5 rounded-full'}>Lecture {idx + 1}</span>
                <input type="text" value={lec.title} onChange={e => updateLecture(idx, 'title', e.target.value)}
                  placeholder="Lecture title (optional)"
                  className={'flex-1 px-3 py-1.5 rounded-lg border text-xs ' + c.input + ' outline-none'} />
                {lectures.length > 2 && (
                  <button onClick={() => removeLecture(idx)} className={'text-xs px-2 py-1 rounded ' + c.warnText}>✕</button>
                )}
              </div>
              <textarea value={lec.transcript} onChange={e => updateLecture(idx, 'transcript', e.target.value)}
                placeholder="Paste transcript for this lecture..."
                className={'w-full h-24 p-3 border-2 rounded-xl ' + c.input + ' outline-none focus:ring-2 resize-none text-xs font-mono'} />
            </div>
          ))}
          {lectures.length < 5 && (
            <button onClick={addLecture} className={'w-full py-3 rounded-xl border-2 border-dashed text-xs font-bold ' + c.pillInactive}>
              ➕ Add another lecture
            </button>
          )}
          {charCount > 0 && (
            <p className={'text-xs ' + c.textMuted}>
              {charCount.toLocaleString()} total characters across {lectures.filter(l => l.transcript?.trim()).length} lectures
            </p>
          )}
        </div>
      )}

      {/* Context */}
      <div className={c.card + ' border rounded-xl p-5 space-y-3'}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={'text-xs font-bold ' + c.textSecondary + ' uppercase tracking-wide mb-1 block'}>📚 Subject (optional)</label>
            <input type="text" value={subject} onChange={e => setSubject(e.target.value)}
              placeholder="e.g., Biology 101, Econ, History"
              className={'w-full px-3 py-2 rounded-xl border text-sm ' + c.input + ' outline-none'} />
          </div>
          {mode !== 'connect' && (
            <div>
              <label className={'text-xs font-bold ' + c.textSecondary + ' uppercase tracking-wide mb-1 block'}>📝 Lecture topic (optional)</label>
              <input type="text" value={lectureTitle} onChange={e => setLectureTitle(e.target.value)}
                placeholder="e.g., Mitosis & Meiosis"
                className={'w-full px-3 py-2 rounded-xl border text-sm ' + c.input + ' outline-none'} />
            </div>
          )}
        </div>

        {/* Mode-specific options */}
        {mode === 'distill' && (
          <>
            <div>
              <label className={'text-xs font-bold ' + c.textSecondary + ' uppercase tracking-wide mb-2 block'}>
                🎯 Bullet points: {bulletCount}
              </label>
              <input type="range" min={5} max={20} value={bulletCount} onChange={e => setBulletCount(Number(e.target.value))}
                className="w-full accent-[rgb(44,74,110)]" />
            </div>
            <div>
              <label className={'text-xs font-bold ' + c.textSecondary + ' uppercase tracking-wide mb-2 block'}>Priority</label>
              <div className="flex flex-wrap gap-1.5">
                {PRIORITIES.map(p => <Pill key={p.value} active={priority === p.value} onClick={() => setPriority(p.value)}>{p.label}</Pill>)}
              </div>
            </div>
          </>
        )}

        {mode === 'study_guide' && (
          <div>
            <label className={'text-xs font-bold ' + c.textSecondary + ' uppercase tracking-wide mb-2 block'}>Exam format</label>
            <div className="flex flex-wrap gap-1.5">
              {EXAM_FORMATS.map(f => <Pill key={f.value} active={examFormat === f.value} onClick={() => setExamFormat(f.value)}>{f.label}</Pill>)}
            </div>
          </div>
        )}

        {mode === 'test_prep' && (
          <>
            <div>
              <label className={'text-xs font-bold ' + c.textSecondary + ' uppercase tracking-wide mb-2 block'}>Question types</label>
              <div className="flex flex-wrap gap-1.5">
                {Q_TYPES.map(qt => <Pill key={qt.value} active={questionTypes.includes(qt.value)} onClick={() => toggleQType(qt.value)}>{qt.label}</Pill>)}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className={'text-xs font-bold ' + c.textSecondary + ' uppercase tracking-wide mb-1 block'}>Questions: {questionCount}</label>
                <input type="range" min={5} max={20} value={questionCount} onChange={e => setQuestionCount(Number(e.target.value))}
                  className="w-full accent-[rgb(44,74,110)]" />
              </div>
              <div>
                <label className={'text-xs font-bold ' + c.textSecondary + ' uppercase tracking-wide mb-1 block'}>Difficulty</label>
                <select value={difficulty} onChange={e => setDifficulty(e.target.value)}
                  className={'px-3 py-2 rounded-lg border text-xs ' + c.input + ' outline-none'}>
                  <option value="mixed">Mixed</option>
                  <option value="easy">Easy</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>
          </>
        )}
      </div>

      <button onClick={submit} disabled={loading || !canSubmit}
        className={'w-full py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all ' + (loading || !canSubmit ? `${c.btnSecondary} opacity-50` : c.btnPrimary)}>
        {loading ? <><span className="animate-spin inline-block">{tool?.icon ?? '⚙️'}</span> Processing lecture...</>
          : mode === 'distill' ? <><span>🎯</span> Distill Key Points</>
          : mode === 'study_guide' ? <><span>📝</span> Generate Study Guide</>
          : mode === 'test_prep' ? <><span>🧪</span> Generate Practice Questions</>
          : <><span>🔗</span> Find Connections</>}
      </button>
    </div>
  );

  // ════════════════════════════════════════════════════════════
  // RESULTS — DISTILL
  // ════════════════════════════════════════════════════════════
  const renderDistill = () => {
    if (!results?.bullets?.length) return null;
    return (
      <div className="space-y-4">
        {/* Summary */}
        <div className={'p-5 rounded-2xl border-2 ' + c.tipBg}>
          <p className={'text-xs font-bold ' + c.tipText + ' uppercase mb-1'}>{results.subject_detected || subject || 'Lecture'}</p>
          <p className={'text-sm font-bold ' + c.text}>{results.lecture_summary}</p>
        </div>

        {/* Bullets */}
        <div className="space-y-2">
          {results.bullets.map((b, idx) => (
            <div key={idx} className={c.card + ' border rounded-xl p-4'}>
              <div className="flex items-start gap-3">
                <span className={'text-lg font-black ' + (idx < 3 ? c.tipText : c.textMuted)}>
                  {b.rank}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={'text-sm ' + c.text + ' mb-1.5'}>{b.point}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {b.type && TYPE_LABELS[b.type] && (
                      <span className={'text-[9px] font-bold px-2 py-0.5 rounded-full ' +
                        (b.type === 'definition' ? c.defBg : b.type === 'process' || b.type === 'formula' ? c.procBg : c.factBg) + ' ' + c.textSecondary}>
                        {TYPE_LABELS[b.type]}
                      </span>
                    )}
                    {b.testable && <span className={'text-[9px] font-bold px-2 py-0.5 rounded-full ' + c.badge}>📋 Testable</span>}
                  </div>
                  {b.test_hint && <p className={'text-[10px] ' + c.textMuted + ' mt-1 italic'}>📝 {b.test_hint}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Vocabulary */}
        {results.vocabulary?.length > 0 && (
          <Section title="Key Terms" emoji="📖" sKey="vocab" badge={results.vocabulary.length + ''} defaultOpen>
            <div className="space-y-2 mt-3">
              {results.vocabulary.map((v, i) => (
                <div key={i} className={'p-3 rounded-lg ' + c.inset}>
                  <span className={'text-xs font-bold ' + c.text}>{v.term}</span>
                  <span className={'text-xs ' + c.textSecondary}> — {v.definition}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Professor signals */}
        {results.professor_signals?.length > 0 && (
          <div className={'p-4 rounded-xl border ' + c.warning}>
            <p className={'text-xs font-bold ' + c.warnText + ' mb-2'}>🚨 Professor flagged as important</p>
            {results.professor_signals.map((s, i) => <p key={i} className={'text-xs ' + c.warnText + ' mb-1'}>• {s}</p>)}
          </div>
        )}

        {/* Connections + Gaps */}
        {results.connections?.length > 0 && (
          <Section title="Connections to Course" emoji="🔗" sKey="conn">
            <div className="space-y-1 mt-3">
              {results.connections.map((c2, i) => <p key={i} className={'text-xs ' + c.textSecondary}>→ {c2}</p>)}
            </div>
          </Section>
        )}
        {results.gaps?.length > 0 && (
          <Section title="Gaps / Coming Next" emoji="🔮" sKey="gaps">
            <div className="space-y-1 mt-3">
              {results.gaps.map((g, i) => <p key={i} className={'text-xs ' + c.textSecondary}>• {g}</p>)}
            </div>
          </Section>
        )}

        <ActionBar content={buildDistillCopy()} title={`Recall: ${results.lecture_summary?.substring(0, 40) || 'Notes'}`} />
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════
  // RESULTS — STUDY GUIDE
  // ════════════════════════════════════════════════════════════
  const renderStudyGuide = () => {
    if (!results) return null;
    return (
      <div className="space-y-4">
        <div className={'p-5 rounded-2xl border-2 ' + c.tipBg}>
          <p className={'text-base font-bold ' + c.text + ' mb-1'}>📝 {results.title}</p>
          <p className={'text-sm ' + c.textSecondary}>{results.overview}</p>
        </div>

        {/* Concepts */}
        {results.concepts_to_know?.length > 0 && (
          <Section title="Concepts to Know" emoji="🧠" sKey="concepts" badge={results.concepts_to_know.length + ''} defaultOpen>
            <div className="space-y-3 mt-3">
              {results.concepts_to_know.map((item, i) => (
                <div key={i} className={'p-3 rounded-lg border ' + c.cardAlt}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={'text-sm font-bold ' + c.text}>{item.concept}</span>
                    <span className={'text-[9px] font-bold px-2 py-0.5 rounded-full ' + c.badge}>
                      {item.memorize_vs_understand === 'memorize' ? '🔒 Memorize' : item.memorize_vs_understand === 'understand' ? '💡 Understand' : '🔒+💡 Both'}
                    </span>
                  </div>
                  <p className={'text-xs ' + c.textSecondary + ' mb-1'}>{item.explanation}</p>
                  {item.mnemonic && <p className={'text-[10px] ' + c.tipText + ' italic'}>💡 {item.mnemonic}</p>}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Definitions */}
        {results.key_definitions?.length > 0 && (
          <Section title="Key Definitions" emoji="📖" sKey="defs" badge={results.key_definitions.length + ''}>
            <div className="space-y-2 mt-3">
              {results.key_definitions.map((d, i) => (
                <div key={i} className={'p-3 rounded-lg ' + c.inset}>
                  <p className={'text-xs font-bold ' + c.text}>{d.term}</p>
                  <p className={'text-xs ' + c.textSecondary}>{d.definition}</p>
                  {d.distinguish_from && <p className={'text-[10px] ' + c.tipText + ' mt-0.5'}>⚠️ Don't confuse with: {d.distinguish_from}</p>}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Processes */}
        {results.processes_and_formulas?.length > 0 && (
          <Section title="Processes & Formulas" emoji="⚙️" sKey="procs">
            <div className="space-y-3 mt-3">
              {results.processes_and_formulas.map((p, i) => (
                <div key={i} className={'p-3 rounded-lg border ' + c.cardAlt}>
                  <p className={'text-xs font-bold ' + c.text + ' mb-1'}>{p.name}</p>
                  <p className={'text-xs ' + c.textSecondary + ' mb-1'}>{p.steps_or_formula}</p>
                  {p.when_to_use && <p className={'text-[10px] ' + c.cardAltText}>📌 When to use: {p.when_to_use}</p>}
                  {p.common_mistake && <p className={'text-[10px] ' + c.warnText + ' mt-0.5'}>⚠️ Common mistake: {p.common_mistake}</p>}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Relationships */}
        {results.relationships?.length > 0 && (
          <Section title="Relationships" emoji="🔗" sKey="rels">
            <div className="space-y-2 mt-3">
              {results.relationships.map((r, i) => (
                <div key={i} className={'p-2 rounded-lg ' + c.inset + ' flex items-center gap-2'}>
                  <span className={'text-[9px] font-bold px-2 py-0.5 rounded-full ' + c.badge}>{r.type?.replace('_', ' ')}</span>
                  <p className={'text-xs ' + c.text}>{r.relationship}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Exam strategy */}
        {results.exam_strategy && (
          <div className={'p-4 rounded-xl border ' + c.success}>
            <p className={'text-xs font-bold ' + c.success + ' mb-2'}>🎯 Exam Strategy</p>
            {results.exam_strategy.likely_questions && <p className={'text-xs ' + c.text + ' mb-1'}>📝 {results.exam_strategy.likely_questions}</p>}
            {results.exam_strategy.trap_warnings && <p className={'text-xs ' + c.warnText + ' mb-1'}>⚠️ {results.exam_strategy.trap_warnings}</p>}
            {results.exam_strategy.time_allocation && <p className={'text-xs ' + c.textMuted}>⏱️ {results.exam_strategy.time_allocation}</p>}
          </div>
        )}

        <ActionBar content={buildStudyCopy()} title={`Study Guide: ${results.title || 'Lecture'}`} />
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════
  // RESULTS — TEST PREP
  // ════════════════════════════════════════════════════════════
  const renderTestPrep = () => {
    if (!results?.questions?.length) return null;
    return (
      <div className="space-y-4">
        <div className={'p-4 rounded-xl ' + c.inset + ' flex items-center justify-between'}>
          <p className={'text-sm font-bold ' + c.text}>🧪 {results.questions.length} Practice Questions</p>
          <button onClick={() => setShowAnswers(results.questions.reduce((acc, q) => ({ ...acc, [q.number]: !Object.values(showAnswers).some(v => v) }), {}))}
            className={'text-xs font-bold ' + c.textSecondaryStyle}>
            {Object.values(showAnswers).some(v => v) ? 'Hide all answers' : 'Show all answers'}
          </button>
        </div>

        {results.questions.map((q) => (
          <div key={q.number} className={c.card + ' border rounded-xl p-4'}>
            <div className="flex items-center gap-2 mb-2">
              <span className={'text-xs font-bold px-2 py-0.5 rounded-full ' + c.badge}>Q{q.number}</span>
              <span className={'text-[9px] font-bold px-2 py-0.5 rounded-full ' + c.defBg + ' ' + c.textSecondary}>
                {q.type?.replace('_', ' ')}
              </span>
              {q.difficulty && (
                <span className={'text-[9px] ' + c.textMuted}>{DIFF_LABELS[q.difficulty] || q.difficulty}</span>
              )}
            </div>
            <p className={'text-sm font-semibold ' + c.text + ' mb-2'}>{q.question}</p>

            {/* MC options */}
            {q.options?.length > 0 && (
              <div className="space-y-1 mb-2">
                {q.options.map((opt, oi) => (
                  <p key={oi} className={'text-xs px-3 py-1.5 rounded-lg ' + c.inset + ' ' + c.text}>{opt}</p>
                ))}
              </div>
            )}

            {/* Answer toggle */}
            <button onClick={() => setShowAnswers(prev => ({ ...prev, [q.number]: !prev[q.number] }))}
              className={'text-xs font-bold ' + c.textSecondaryStyle + ' mt-1'}>
              {showAnswers[q.number] ? '🔽 Hide answer' : '🔼 Show answer'}
            </button>

            {showAnswers[q.number] && (
              <div className={'mt-2 p-3 rounded-lg border ' + c.success}>
                <p className={'text-xs font-bold ' + c.success + ' mb-1'}>✅ Answer</p>
                <p className={'text-xs ' + c.text + ' mb-1'}>{q.answer}</p>
                {q.why_wrong && Object.entries(q.why_wrong).map(([key, val]) => (
                  val ? <p key={key} className={'text-[10px] ' + c.warnText}>❌ {key}: {val}</p> : null
                ))}
                {q.points_hint && <p className={'text-[10px] ' + c.textMuted + ' mt-1 italic'}>📝 Grader looks for: {q.points_hint}</p>}
              </div>
            )}
          </div>
        ))}

        {results.study_tips?.length > 0 && (
          <div className={'p-4 rounded-xl border ' + c.cardAltBg}>
            <p className={'text-xs font-bold ' + c.cardAltText + ' mb-2'}>💡 Study Tips</p>
            {results.study_tips.map((t, i) => <p key={i} className={'text-xs ' + c.cardAltText + ' mb-1'}>• {t}</p>)}
          </div>
        )}

        <ActionBar content={buildTestCopy()} title="Practice Questions" />
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════
  // RESULTS — CONNECT
  // ════════════════════════════════════════════════════════════
  const renderConnect = () => {
    if (!results) return null;
    return (
      <div className="space-y-4">
        {results.course_narrative && (
          <div className={'p-5 rounded-2xl border-2 ' + c.tipBg}>
            <p className={'text-xs font-bold ' + c.tipText + ' uppercase mb-1'}>🔗 Course Narrative</p>
            <p className={'text-sm font-bold ' + c.text}>{results.course_narrative}</p>
          </div>
        )}

        {results.recurring_themes?.length > 0 && (
          <Section title="Recurring Themes" emoji="🔄" sKey="themes" badge={results.recurring_themes.length + ''} defaultOpen>
            <div className="space-y-3 mt-3">
              {results.recurring_themes.map((t, i) => (
                <div key={i} className={'p-3 rounded-lg border ' + c.cardAlt}>
                  <p className={'text-xs font-bold ' + c.text + ' mb-1'}>{t.theme}</p>
                  {t.appearances?.map((a, ai) => <p key={ai} className={'text-[10px] ' + c.textSecondary + ' mb-0.5'}>• {a}</p>)}
                  <p className={'text-[10px] ' + c.tipText + ' mt-1 italic'}>📋 {t.why_recurring}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {results.concept_chain?.length > 0 && (
          <Section title="Concept Chain" emoji="⛓️" sKey="chain">
            <div className="space-y-2 mt-3">
              {results.concept_chain.map((ch, i) => (
                <div key={i} className={'p-3 rounded-lg ' + c.inset}>
                  <p className={'text-xs font-bold ' + c.text}>{ch.concept}</p>
                  <p className={'text-xs ' + c.textSecondary + ' mt-0.5'}>{ch.progression}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {results.cumulative_exam_focus?.length > 0 && (
          <div className={'p-4 rounded-xl border ' + c.warning}>
            <p className={'text-xs font-bold ' + c.warnText + ' mb-2'}>📋 Cumulative Exam Focus</p>
            {results.cumulative_exam_focus.map((f, i) => <p key={i} className={'text-xs ' + c.warnText + ' mb-1'}>• {f}</p>)}
          </div>
        )}

        {results.contradictions_or_nuance?.length > 0 && (
          <Section title="Evolving Ideas" emoji="💭" sKey="nuance">
            <div className="space-y-2 mt-3">
              {results.contradictions_or_nuance.map((cn, i) => (
                <div key={i} className={'p-3 rounded-lg ' + c.inset}>
                  <p className={'text-xs font-bold ' + c.text}>{cn.topic}</p>
                  <p className={'text-xs ' + c.textSecondary + ' mt-0.5'}>{cn.evolution}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {results.gaps_between_lectures?.length > 0 && (
          <Section title="Gaps / Coming Next" emoji="🔮" sKey="lgaps">
            <div className="space-y-1 mt-3">
              {results.gaps_between_lectures.map((g, i) => <p key={i} className={'text-xs ' + c.textSecondary}>• {g}</p>)}
            </div>
          </Section>
        )}
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════
  // HISTORY
  // ════════════════════════════════════════════════════════════
  const renderHistory = () => {
    if (history.length === 0) return null;
    const modeEmoji = (m) => MODES.find(mo => mo.value === m)?.emoji || '🧠';
    const formatDate = (iso) => { try { const d = new Date(iso); const diff = Math.floor((new Date() - d) / 86400000); return diff === 0 ? 'Today' : diff === 1 ? 'Yesterday' : diff < 7 ? diff + 'd ago' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); } catch { return ''; } };
    return (
      <div className={'mt-6 p-4 rounded-2xl border ' + c.histBg}>
        <button onClick={() => setShowHistory(!showHistory)} className="w-full flex items-center gap-2 text-left">
          <span>🧠</span>
          <span className={'text-sm font-bold ' + c.text + ' flex-1'}>Past Sessions</span>
          <span className={'text-xs ' + c.textMuted}>{history.length}</span>
          <span className={'text-xs ' + c.textMuted}>{showHistory ? '▲' : '▼'}</span>
        </button>
        {showHistory && (
          <div className="mt-3 space-y-2">
            {history.map(entry => (
              <div key={entry.id} className={'rounded-xl border ' + c.histCard + ' p-3 flex items-center gap-3'}>
                <span className="text-lg">{modeEmoji(entry.mode)}</span>
                <div className="flex-1 min-w-0">
                  <div className={'text-sm font-semibold ' + c.text + ' truncate'}>{entry.title}</div>
                  <div className={'text-xs ' + c.textMuted + ' mt-0.5'}>{formatDate(entry.date)}{entry.subject ? ` · ${entry.subject}` : ''}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════
  // MAIN RENDER
  // ════════════════════════════════════════════════════════════

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div>
          <h2 className={'text-2xl font-bold ' + c.text}>Recall <span className="text-xl">🧠</span></h2>
          <p className={'text-sm ' + c.textMuted}>Paste a lecture transcript — get the signal without the noise</p>
        </div>
      </div>
      {!results && renderInput()}
      {results && (
        <div ref={resultsRef} className="space-y-4 mt-4">
          {mode === 'distill' && renderDistill()}
          {mode === 'study_guide' && renderStudyGuide()}
          {mode === 'test_prep' && renderTestPrep()}
          {mode === 'connect' && renderConnect()}

          <div className="flex gap-2">
            <button onClick={handleReset} className={'flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 ' + c.btnPrimary}>
              <span>🧠</span> New Lecture
            </button>
            <button onClick={() => { setResults(null); setError(''); }} className={'flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 ' + c.btnPrimarySecondary}>
              <span>✏️</span> Edit Input
            </button>
          </div>

          <div className={'p-4 rounded-2xl border ' + c.card}>
            <p className={'text-xs font-bold ' + c.textMuted + ' uppercase tracking-wide mb-2'}>🔗 Related Tools</p>
            <div className={'space-y-1.5 text-xs ' + c.textSecondary}>
              <p>Need flashcards from these notes? <a href="/FlashScan" target="_blank" rel="noopener noreferrer" className={c.textSecondaryStyle}>FlashScan</a> converts them.</p>
              <p>Struggling with a concept? <a href="/TheGap" target="_blank" rel="noopener noreferrer" className={c.textSecondaryStyle}>The Gap</a> traces it back to missing prerequisites.</p>
            </div>
          </div>
        </div>
      )}
      {error && (
        <div className={'mt-4 p-4 ' + c.danger + ' border rounded-xl flex items-start gap-3'}>
          <span className={'text-base ' + c.danger}>⚠️</span>
          <p className={'text-sm ' + c.danger}>{error}</p>
        </div>
      )}
      {renderHistory()}
        <div className={`mt-6 pt-4 border-t text-sm ${c.border} ${c.textMuted}`}>
          <p className="mb-2 font-medium">You might also like:</p>
          <div className="flex flex-wrap gap-2">
            {[{slug:'brain-dump-buddy',label:'🧠 Brain Dump Buddy'},{slug:'dream-pattern-spotter',label:'🌙 Dream Pattern Spotter'},{slug:'focus-pocus',label:'🎯 Focus Pocus'}].map(({slug,label})=>(
              <a key={slug} href={`${slug}`} className={linkStyle}>{label}</a>
            ))}
          </div>
        </div>
    </div>
  );
};

Recall.displayName = 'Recall';
export default Recall;
