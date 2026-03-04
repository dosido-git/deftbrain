import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';
import { usePersistentState } from '../hooks/usePersistentState';
import { CopyBtn, ActionBar } from '../components/ActionButtons';

// ════════════════════════════════════════════════════════════
// THEME — Navy & Gold
// ════════════════════════════════════════════════════════════
const useColors = () => {
  const { theme } = useTheme();
  const d = theme === 'dark';
  return {
    card:        d ? 'bg-[#2a2623] border-[#3d3630]'  : 'bg-white border-[#e8e1d5]',
    cardAlt:     d ? 'bg-[#332e2a] border-[#3d3630]'  : 'bg-[#faf8f5] border-[#e8e1d5]',
    inset:       d ? 'bg-[#1a1816]'                    : 'bg-[#faf8f5]',
    inputBg:     d ? 'bg-[#1a1816] border-[#3d3630] text-[#f0eeea] placeholder-[#8a8275] focus:border-[#4a6a8a] focus:ring-[#4a6a8a]/20'
                    : 'bg-[#faf8f5] border-[#d5cab8] text-[#3d3935] placeholder-[#8a8275] focus:border-[#4a6a8a] focus:ring-[#4a6a8a]/20',
    text:        d ? 'text-[#f0eeea]'  : 'text-[#3d3935]',
    heading:     d ? 'text-[#f3efe8]'  : 'text-[#1e2a3a]',
    textSec:     d ? 'text-[#c8c3b9]'  : 'text-[#5a544a]',
    textMut:     d ? 'text-[#8a8275]'  : 'text-[#8a8275]',
    label:       d ? 'text-[#c8c3b9]'  : 'text-[#5a544a]',
    btn:         d ? 'bg-[#2c4a6e] hover:bg-[#4a6a8a] text-white' : 'bg-[#2c4a6e] hover:bg-[#1e3a58] text-white',
    btnSec:      d ? 'bg-[#332e2a] hover:bg-[#3d3630] text-[#c8c3b9] border border-[#3d3630]' : 'bg-[#f3efe8] hover:bg-[#e8e1d5] text-[#5e5042] border border-[#d5cab8]',
    btnDis:      d ? 'bg-[#332e2a] text-[#5a544a] cursor-not-allowed' : 'bg-[#e8e1d5] text-[#8a8275] cursor-not-allowed',
    pillActive:  d ? 'border-[#4a6a8a] bg-[#2c4a6e]/30 text-[#a8b9ce]' : 'border-[#2c4a6e] bg-[#d4dde8] text-[#1e3a58]',
    pillInactive: d ? 'border-[#3d3630] text-[#8a8275] hover:border-[#5a544a]' : 'border-[#d5cab8] text-[#5a544a] hover:border-[#8a8275]',
    badge:       d ? 'bg-[#2c4a6e]/30 text-[#a8b9ce]' : 'bg-[#d4dde8] text-[#1e3a58]',
    divider:     d ? 'border-[#3d3630]' : 'border-[#e8e1d5]',
    tipBg:       d ? 'bg-[#c8872e]/10 border-[#c8872e]/30' : 'bg-[#f9edd8] border-[#c8872e]/30',
    tipText:     d ? 'text-[#d9a04e]' : 'text-[#93541f]',
    successBg:   d ? 'bg-[#5a8a5c]/10 border-[#5a8a5c]/30' : 'bg-[#e8f0e8] border-[#5a8a5c]/30',
    successText: d ? 'text-[#7aba7c]' : 'text-[#3a6a3c]',
    warnBg:      d ? 'bg-[#b54a3f]/10 border-[#b54a3f]/30' : 'bg-[#fceae8] border-[#e8a8a0]',
    warnText:    d ? 'text-[#e88880]' : 'text-[#b54a3f]',
    infoBg:      d ? 'bg-[#2c4a6e]/15 border-[#4a6a8a]/30' : 'bg-[#d4dde8]/30 border-[#2c4a6e]/15',
    infoText:    d ? 'text-[#a8b9ce]' : 'text-[#1e3a58]',
    errBg:       d ? 'bg-[#b54a3f]/15 border-[#b54a3f]/40' : 'bg-[#fceae8] border-[#e8a8a0]',
    errText:     d ? 'text-[#e88880]' : 'text-[#b54a3f]',
    histBg:      d ? 'bg-[#2c4a6e]/10 border-[#4a6a8a]/30' : 'bg-[#d4dde8]/30 border-[#2c4a6e]/15',
    histCard:    d ? 'bg-[#2a2623] border-[#3d3630]' : 'bg-white border-[#e8e1d5]',
    linkStyle:   d ? 'text-[#6e8aaa] hover:text-[#a8b9ce] underline' : 'text-[#2c4a6e] hover:text-[#1e3a58] underline',
    // Type badges
    defBg:       d ? 'bg-[#2c4a6e]/25' : 'bg-[#d4dde8]/50',
    procBg:      d ? 'bg-[#5a8a5c]/20' : 'bg-[#e8f0e8]',
    factBg:      d ? 'bg-[#c8872e]/15' : 'bg-[#f9edd8]',
  };
};

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
const Recall = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const c = useColors();
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
  const [results, setResults] = useState(null);
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
      };
      setHistory(prev => [entry, ...prev].slice(0, 30));
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
          <span className={'text-xs ' + c.textMut}>{open ? '▲' : '▼'}</span>
        </button>
        {open && <div className={'px-4 pb-4 border-t ' + c.divider}>{children}</div>}
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
              <p className={'text-xs font-bold ' + (mode === m.value ? '' : c.textMut)}>{m.label}</p>
              <p className={'text-[10px] ' + c.textMut}>{m.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Transcript input — shared for all modes except Connect */}
      {mode !== 'connect' ? (
        <div className={c.card + ' border rounded-xl p-5'}>
          <label className={'text-base font-bold ' + c.text + ' mb-1 block'}>📄 Paste lecture transcript or notes</label>
          <p className={'text-xs ' + c.textMut + ' mb-3'}>From Zoom, Teams, Otter.ai, Google Meet — or your own typed notes.</p>
          <textarea value={transcript} onChange={e => setTranscript(e.target.value)}
            placeholder="Paste your transcript here... The more complete, the better the output."
            className={'w-full h-40 p-4 border-2 rounded-xl ' + c.inputBg + ' outline-none focus:ring-2 resize-none text-sm font-mono'} />
          {charCount > 0 && (
            <p className={'text-xs ' + c.textMut + ' mt-1'}>
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
                  className={'flex-1 px-3 py-1.5 rounded-lg border text-xs ' + c.inputBg + ' outline-none'} />
                {lectures.length > 2 && (
                  <button onClick={() => removeLecture(idx)} className={'text-xs px-2 py-1 rounded ' + c.warnText}>✕</button>
                )}
              </div>
              <textarea value={lec.transcript} onChange={e => updateLecture(idx, 'transcript', e.target.value)}
                placeholder="Paste transcript for this lecture..."
                className={'w-full h-24 p-3 border-2 rounded-xl ' + c.inputBg + ' outline-none focus:ring-2 resize-none text-xs font-mono'} />
            </div>
          ))}
          {lectures.length < 5 && (
            <button onClick={addLecture} className={'w-full py-3 rounded-xl border-2 border-dashed text-xs font-bold ' + c.pillInactive}>
              ➕ Add another lecture
            </button>
          )}
          {charCount > 0 && (
            <p className={'text-xs ' + c.textMut}>
              {charCount.toLocaleString()} total characters across {lectures.filter(l => l.transcript?.trim()).length} lectures
            </p>
          )}
        </div>
      )}

      {/* Context */}
      <div className={c.card + ' border rounded-xl p-5 space-y-3'}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={'text-xs font-bold ' + c.textSec + ' uppercase tracking-wide mb-1 block'}>📚 Subject (optional)</label>
            <input type="text" value={subject} onChange={e => setSubject(e.target.value)}
              placeholder="e.g., Biology 101, Econ, History"
              className={'w-full px-3 py-2 rounded-xl border text-sm ' + c.inputBg + ' outline-none'} />
          </div>
          {mode !== 'connect' && (
            <div>
              <label className={'text-xs font-bold ' + c.textSec + ' uppercase tracking-wide mb-1 block'}>📝 Lecture topic (optional)</label>
              <input type="text" value={lectureTitle} onChange={e => setLectureTitle(e.target.value)}
                placeholder="e.g., Mitosis & Meiosis"
                className={'w-full px-3 py-2 rounded-xl border text-sm ' + c.inputBg + ' outline-none'} />
            </div>
          )}
        </div>

        {/* Mode-specific options */}
        {mode === 'distill' && (
          <>
            <div>
              <label className={'text-xs font-bold ' + c.textSec + ' uppercase tracking-wide mb-2 block'}>
                🎯 Bullet points: {bulletCount}
              </label>
              <input type="range" min={5} max={20} value={bulletCount} onChange={e => setBulletCount(Number(e.target.value))}
                className="w-full accent-[#2c4a6e]" />
            </div>
            <div>
              <label className={'text-xs font-bold ' + c.textSec + ' uppercase tracking-wide mb-2 block'}>Priority</label>
              <div className="flex flex-wrap gap-1.5">
                {PRIORITIES.map(p => <Pill key={p.value} active={priority === p.value} onClick={() => setPriority(p.value)}>{p.label}</Pill>)}
              </div>
            </div>
          </>
        )}

        {mode === 'study_guide' && (
          <div>
            <label className={'text-xs font-bold ' + c.textSec + ' uppercase tracking-wide mb-2 block'}>Exam format</label>
            <div className="flex flex-wrap gap-1.5">
              {EXAM_FORMATS.map(f => <Pill key={f.value} active={examFormat === f.value} onClick={() => setExamFormat(f.value)}>{f.label}</Pill>)}
            </div>
          </div>
        )}

        {mode === 'test_prep' && (
          <>
            <div>
              <label className={'text-xs font-bold ' + c.textSec + ' uppercase tracking-wide mb-2 block'}>Question types</label>
              <div className="flex flex-wrap gap-1.5">
                {Q_TYPES.map(qt => <Pill key={qt.value} active={questionTypes.includes(qt.value)} onClick={() => toggleQType(qt.value)}>{qt.label}</Pill>)}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className={'text-xs font-bold ' + c.textSec + ' uppercase tracking-wide mb-1 block'}>Questions: {questionCount}</label>
                <input type="range" min={5} max={20} value={questionCount} onChange={e => setQuestionCount(Number(e.target.value))}
                  className="w-full accent-[#2c4a6e]" />
              </div>
              <div>
                <label className={'text-xs font-bold ' + c.textSec + ' uppercase tracking-wide mb-1 block'}>Difficulty</label>
                <select value={difficulty} onChange={e => setDifficulty(e.target.value)}
                  className={'px-3 py-2 rounded-lg border text-xs ' + c.inputBg + ' outline-none'}>
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
        className={'w-full py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all ' + (loading || !canSubmit ? c.btnDis : c.btn)}>
        {loading ? <><span className="animate-spin inline-block">⏳</span> Processing lecture...</>
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
                <span className={'text-lg font-black ' + (idx < 3 ? c.tipText : c.textMut)}>
                  {b.rank}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={'text-sm ' + c.text + ' mb-1.5'}>{b.point}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {b.type && TYPE_LABELS[b.type] && (
                      <span className={'text-[9px] font-bold px-2 py-0.5 rounded-full ' +
                        (b.type === 'definition' ? c.defBg : b.type === 'process' || b.type === 'formula' ? c.procBg : c.factBg) + ' ' + c.textSec}>
                        {TYPE_LABELS[b.type]}
                      </span>
                    )}
                    {b.testable && <span className={'text-[9px] font-bold px-2 py-0.5 rounded-full ' + c.badge}>📋 Testable</span>}
                  </div>
                  {b.test_hint && <p className={'text-[10px] ' + c.textMut + ' mt-1 italic'}>📝 {b.test_hint}</p>}
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
                  <span className={'text-xs ' + c.textSec}> — {v.definition}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Professor signals */}
        {results.professor_signals?.length > 0 && (
          <div className={'p-4 rounded-xl border ' + c.warnBg}>
            <p className={'text-xs font-bold ' + c.warnText + ' mb-2'}>🚨 Professor flagged as important</p>
            {results.professor_signals.map((s, i) => <p key={i} className={'text-xs ' + c.warnText + ' mb-1'}>• {s}</p>)}
          </div>
        )}

        {/* Connections + Gaps */}
        {results.connections?.length > 0 && (
          <Section title="Connections to Course" emoji="🔗" sKey="conn">
            <div className="space-y-1 mt-3">
              {results.connections.map((c2, i) => <p key={i} className={'text-xs ' + c.textSec}>→ {c2}</p>)}
            </div>
          </Section>
        )}
        {results.gaps?.length > 0 && (
          <Section title="Gaps / Coming Next" emoji="🔮" sKey="gaps">
            <div className="space-y-1 mt-3">
              {results.gaps.map((g, i) => <p key={i} className={'text-xs ' + c.textSec}>• {g}</p>)}
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
          <p className={'text-sm ' + c.textSec}>{results.overview}</p>
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
                  <p className={'text-xs ' + c.textSec + ' mb-1'}>{item.explanation}</p>
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
                  <p className={'text-xs ' + c.textSec}>{d.definition}</p>
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
                  <p className={'text-xs ' + c.textSec + ' mb-1'}>{p.steps_or_formula}</p>
                  {p.when_to_use && <p className={'text-[10px] ' + c.infoText}>📌 When to use: {p.when_to_use}</p>}
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
          <div className={'p-4 rounded-xl border ' + c.successBg}>
            <p className={'text-xs font-bold ' + c.successText + ' mb-2'}>🎯 Exam Strategy</p>
            {results.exam_strategy.likely_questions && <p className={'text-xs ' + c.text + ' mb-1'}>📝 {results.exam_strategy.likely_questions}</p>}
            {results.exam_strategy.trap_warnings && <p className={'text-xs ' + c.warnText + ' mb-1'}>⚠️ {results.exam_strategy.trap_warnings}</p>}
            {results.exam_strategy.time_allocation && <p className={'text-xs ' + c.textMut}>⏱️ {results.exam_strategy.time_allocation}</p>}
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
            className={'text-xs font-bold ' + c.linkStyle}>
            {Object.values(showAnswers).some(v => v) ? 'Hide all answers' : 'Show all answers'}
          </button>
        </div>

        {results.questions.map((q) => (
          <div key={q.number} className={c.card + ' border rounded-xl p-4'}>
            <div className="flex items-center gap-2 mb-2">
              <span className={'text-xs font-bold px-2 py-0.5 rounded-full ' + c.badge}>Q{q.number}</span>
              <span className={'text-[9px] font-bold px-2 py-0.5 rounded-full ' + c.defBg + ' ' + c.textSec}>
                {q.type?.replace('_', ' ')}
              </span>
              {q.difficulty && (
                <span className={'text-[9px] ' + c.textMut}>{DIFF_LABELS[q.difficulty] || q.difficulty}</span>
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
              className={'text-xs font-bold ' + c.linkStyle + ' mt-1'}>
              {showAnswers[q.number] ? '🔽 Hide answer' : '🔼 Show answer'}
            </button>

            {showAnswers[q.number] && (
              <div className={'mt-2 p-3 rounded-lg border ' + c.successBg}>
                <p className={'text-xs font-bold ' + c.successText + ' mb-1'}>✅ Answer</p>
                <p className={'text-xs ' + c.text + ' mb-1'}>{q.answer}</p>
                {q.why_wrong && Object.entries(q.why_wrong).map(([key, val]) => (
                  val ? <p key={key} className={'text-[10px] ' + c.warnText}>❌ {key}: {val}</p> : null
                ))}
                {q.points_hint && <p className={'text-[10px] ' + c.textMut + ' mt-1 italic'}>📝 Grader looks for: {q.points_hint}</p>}
              </div>
            )}
          </div>
        ))}

        {results.study_tips?.length > 0 && (
          <div className={'p-4 rounded-xl border ' + c.infoBg}>
            <p className={'text-xs font-bold ' + c.infoText + ' mb-2'}>💡 Study Tips</p>
            {results.study_tips.map((t, i) => <p key={i} className={'text-xs ' + c.infoText + ' mb-1'}>• {t}</p>)}
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
                  {t.appearances?.map((a, ai) => <p key={ai} className={'text-[10px] ' + c.textSec + ' mb-0.5'}>• {a}</p>)}
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
                  <p className={'text-xs ' + c.textSec + ' mt-0.5'}>{ch.progression}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {results.cumulative_exam_focus?.length > 0 && (
          <div className={'p-4 rounded-xl border ' + c.warnBg}>
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
                  <p className={'text-xs ' + c.textSec + ' mt-0.5'}>{cn.evolution}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {results.gaps_between_lectures?.length > 0 && (
          <Section title="Gaps / Coming Next" emoji="🔮" sKey="lgaps">
            <div className="space-y-1 mt-3">
              {results.gaps_between_lectures.map((g, i) => <p key={i} className={'text-xs ' + c.textSec}>• {g}</p>)}
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
          <span className={'text-xs ' + c.textMut}>{history.length}</span>
          <span className={'text-xs ' + c.textMut}>{showHistory ? '▲' : '▼'}</span>
        </button>
        {showHistory && (
          <div className="mt-3 space-y-2">
            {history.map(entry => (
              <div key={entry.id} className={'rounded-xl border ' + c.histCard + ' p-3 flex items-center gap-3'}>
                <span className="text-lg">{modeEmoji(entry.mode)}</span>
                <div className="flex-1 min-w-0">
                  <div className={'text-sm font-semibold ' + c.text + ' truncate'}>{entry.title}</div>
                  <div className={'text-xs ' + c.textMut + ' mt-0.5'}>{formatDate(entry.date)}{entry.subject ? ` · ${entry.subject}` : ''}</div>
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
          <h2 className={'text-2xl font-bold ' + c.heading}>Recall <span className="text-xl">🧠</span></h2>
          <p className={'text-sm ' + c.textMut}>Paste a lecture transcript — get the signal without the noise</p>
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
            <button onClick={handleReset} className={'flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 ' + c.btn}>
              <span>🧠</span> New Lecture
            </button>
            <button onClick={() => { setResults(null); setError(''); }} className={'flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 ' + c.btnSec}>
              <span>✏️</span> Edit Input
            </button>
          </div>

          <div className={'p-4 rounded-2xl border ' + c.card}>
            <p className={'text-xs font-bold ' + c.textMut + ' uppercase tracking-wide mb-2'}>🔗 Related Tools</p>
            <div className={'space-y-1.5 text-xs ' + c.textSec}>
              <p>Need flashcards from these notes? <a href="/FlashScan" target="_blank" rel="noopener noreferrer" className={c.linkStyle}>FlashScan</a> converts them.</p>
              <p>Struggling with a concept? <a href="/TheGap" target="_blank" rel="noopener noreferrer" className={c.linkStyle}>The Gap</a> traces it back to missing prerequisites.</p>
            </div>
          </div>
        </div>
      )}
      {error && (
        <div className={'mt-4 p-4 ' + c.errBg + ' border rounded-xl flex items-start gap-3'}>
          <span className={'text-base ' + c.errText}>⚠️</span>
          <p className={'text-sm ' + c.errText}>{error}</p>
        </div>
      )}
      {renderHistory()}
    </div>
  );
};

Recall.displayName = 'Recall';
export default Recall;
