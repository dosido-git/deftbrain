import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';
import { usePersistentState } from '../hooks/usePersistentState';
import { CopyBtn } from '../components/ActionButtons';

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
    // Chain node colors
    gapHigh:     d ? 'bg-[#b54a3f]/20 border-[#b54a3f]/50' : 'bg-[#fceae8] border-[#b54a3f]/40',
    gapHighText: d ? 'text-[#e88880]' : 'text-[#b54a3f]',
    gapMed:      d ? 'bg-[#c8872e]/15 border-[#c8872e]/40' : 'bg-[#f9edd8] border-[#c8872e]/30',
    gapMedText:  d ? 'text-[#d9a04e]' : 'text-[#93541f]',
    gapLow:      d ? 'bg-[#5a8a5c]/10 border-[#5a8a5c]/30' : 'bg-[#e8f0e8] border-[#5a8a5c]/30',
    gapLowText:  d ? 'text-[#7aba7c]' : 'text-[#3a6a3c]',
  };
};

const LEVELS = [
  { value: 'high_school', label: '🏫 High School' },
  { value: 'undergrad', label: '🎓 Undergrad' },
  { value: 'grad', label: '🎓 Graduate' },
  { value: 'self_taught', label: '📚 Self-Taught' },
];

const EXAMPLES = [
  { concept: 'Integration by parts', subject: 'Calculus', level: 'undergrad' },
  { concept: 'Recursion', subject: 'Computer Science', level: 'undergrad' },
  { concept: 'Supply and demand equilibrium', subject: 'Economics', level: 'high_school' },
  { concept: 'CRISPR gene editing', subject: 'Biology', level: 'undergrad' },
  { concept: 'Statistical significance / p-values', subject: 'Statistics', level: 'undergrad' },
];

const GAP_TYPE_LABELS = {
  conceptual: '🧠 Conceptual — you don\'t get WHY',
  procedural: '⚙️ Procedural — you can\'t DO the steps',
  definitional: '📖 Definitional — you don\'t know WHAT it means',
  notational: '✏️ Notational — the symbols/language are blocking you',
};

// ════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════
const TheGap = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const c = useColors();
  const resultsRef = useRef(null);

  const [history, setHistory] = usePersistentState('the-gap-history', []);
  const [showHistory, setShowHistory] = useState(false);

  // Input
  const [concept, setConcept] = useState('');
  const [subject, setSubject] = useState('');
  const [whatIKnow, setWhatIKnow] = useState('');
  const [whereItBroke, setWhereItBroke] = useState('');
  const [level, setLevel] = useState('undergrad');

  // Results
  const [results, setResults] = useState(null);
  const [digResults, setDigResults] = useState(null);
  const [digTarget, setDigTarget] = useState(null);
  const [error, setError] = useState('');
  const [expandedNodes, setExpandedNodes] = useState({});
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [showPlan, setShowPlan] = useState(true);

  useEffect(() => {
    if (results && resultsRef.current) {
      setTimeout(() => resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
    }
  }, [results]);

  const trace = useCallback(async () => {
    if (!concept.trim()) { setError('What concept are you struggling with?'); return; }
    setError(''); setResults(null); setDigResults(null); setDigTarget(null); setExpandedNodes({});
    try {
      const data = await callToolEndpoint('the-gap', {
        concept: concept.trim(), subject: subject.trim() || null,
        whatIKnow: whatIKnow.trim() || null, whereItBroke: whereItBroke.trim() || null, level,
      });
      setResults(data);
      const entry = { id: 'tg_' + Date.now(), date: new Date().toISOString(), concept: concept.trim(), subject: subject.trim(), likelyGap: data.likely_gap?.concept };
      setHistory(prev => [entry, ...prev].slice(0, 30));
    } catch (err) { setError(err.message || 'Failed to trace the gap.'); }
  }, [concept, subject, whatIKnow, whereItBroke, level, callToolEndpoint, setHistory]);

  const dig = useCallback(async (prerequisite, testResult) => {
    setDigTarget(prerequisite); setDigResults(null);
    try {
      const data = await callToolEndpoint('the-gap/dig', {
        originalConcept: concept.trim(), prerequisite, testResult: testResult || 'failed',
      });
      setDigResults(data);
    } catch (err) { setError(err.message || 'Dig deeper failed.'); }
  }, [concept, callToolEndpoint]);

  const handleReset = useCallback(() => {
    setConcept(''); setSubject(''); setWhatIKnow(''); setWhereItBroke('');
    setResults(null); setDigResults(null); setDigTarget(null); setError(''); setExpandedNodes({});
  }, []);

  const loadExample = useCallback((ex) => {
    setConcept(ex.concept); setSubject(ex.subject); setLevel(ex.level);
    setResults(null); setDigResults(null); setError('');
  }, []);

  const toggleNode = useCallback((idx) => setExpandedNodes(prev => ({ ...prev, [idx]: !prev[idx] })), []);

  const gapStyle = (likelihood) => {
    if (likelihood === 'high') return { bg: c.gapHigh, text: c.gapHighText, emoji: '🔴' };
    if (likelihood === 'medium') return { bg: c.gapMed, text: c.gapMedText, emoji: '🟡' };
    return { bg: c.gapLow, text: c.gapLowText, emoji: '🟢' };
  };

  const buildCopy = useCallback(() => {
    if (!results) return '';
    const lines = ['📝 The Gap — Prerequisite Chain', '', `Struggling with: ${concept}`, ''];
    if (results.chain_visualization) lines.push(results.chain_visualization, '');
    if (results.likely_gap) {
      lines.push(`LIKELY GAP: ${results.likely_gap.concept}`);
      lines.push(`Type: ${GAP_TYPE_LABELS[results.likely_gap.gap_type] || results.likely_gap.gap_type}`);
      lines.push('', results.likely_gap.refresher?.core_idea || '');
    }
    if (results.study_plan) {
      lines.push('', 'STUDY PLAN:');
      lines.push('1. ' + results.study_plan.step_1);
      lines.push('2. ' + results.study_plan.step_2);
      lines.push('3. ' + results.study_plan.step_3);
    }
    lines.push('', '— Generated by DeftBrain · deftbrain.com');
    return lines.join('\n');
  }, [results, concept]);

  const Pill = ({ active, onClick, children }) => (
    <button onClick={onClick} className={'px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ' + (active ? c.pillActive : c.pillInactive)}>
      {active && <span className="mr-1">✓</span>}{children}
    </button>
  );

  // ══════════════════════════════════════════
  // INPUT
  // ══════════════════════════════════════════
  const renderInput = () => (
    <div className="space-y-4">
      <div className={c.card + ' border rounded-xl p-5'}>
        <label className={'text-base font-bold ' + c.text + ' mb-1 block'}>📝 What concept are you stuck on?</label>
        <p className={'text-xs ' + c.textMut + ' mb-3'}>We'll trace backwards through prerequisites to find where your understanding broke.</p>
        <input type="text" value={concept} onChange={e => setConcept(e.target.value)}
          placeholder="e.g., Integration by parts, Recursion, CRISPR, p-values..."
          className={'w-full px-4 py-3 border-2 rounded-xl ' + c.inputBg + ' outline-none focus:ring-2 text-sm'}
          onKeyDown={e => { if (e.key === 'Enter' && concept.trim()) trace(); }} />
      </div>

      <div className={c.card + ' border rounded-xl p-5 space-y-3'}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={'text-xs font-bold ' + c.textSec + ' uppercase tracking-wide mb-1 block'}>📚 Subject</label>
            <input type="text" value={subject} onChange={e => setSubject(e.target.value)}
              placeholder="e.g., Calculus, Biology, CS"
              className={'w-full px-3 py-2 rounded-xl border text-sm ' + c.inputBg + ' outline-none'} />
          </div>
          <div>
            <label className={'text-xs font-bold ' + c.textSec + ' uppercase tracking-wide mb-2 block'}>🎓 Level</label>
            <div className="flex flex-wrap gap-1">
              {LEVELS.map(l => <Pill key={l.value} active={level === l.value} onClick={() => setLevel(l.value)}>{l.label}</Pill>)}
            </div>
          </div>
        </div>
        <div>
          <label className={'text-xs font-bold ' + c.textSec + ' uppercase tracking-wide mb-1 block'}>✅ What DO you understand? (optional)</label>
          <input type="text" value={whatIKnow} onChange={e => setWhatIKnow(e.target.value)}
            placeholder="e.g., 'I get basic derivatives but not integrals', 'I understand variables but not functions'"
            className={'w-full px-3 py-2 rounded-xl border text-sm ' + c.inputBg + ' outline-none'} />
        </div>
        <div>
          <label className={'text-xs font-bold ' + c.textSec + ' uppercase tracking-wide mb-1 block'}>🔍 Where did it break? (optional)</label>
          <input type="text" value={whereItBroke} onChange={e => setWhereItBroke(e.target.value)}
            placeholder="e.g., 'I was fine until the professor introduced u-substitution'"
            className={'w-full px-3 py-2 rounded-xl border text-sm ' + c.inputBg + ' outline-none'} />
        </div>
      </div>

      {/* Examples */}
      <div className={'p-4 rounded-xl ' + c.inset}>
        <p className={'text-xs font-bold ' + c.textMut + ' mb-2'}>💡 Try an example:</p>
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLES.map((ex, i) => (
            <button key={i} onClick={() => loadExample(ex)}
              className={'px-3 py-1.5 rounded-lg border text-xs font-semibold ' + c.pillInactive}>
              {ex.concept}
            </button>
          ))}
        </div>
      </div>

      <button onClick={trace} disabled={loading || !concept.trim()}
        className={'w-full py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all ' + (loading || !concept.trim() ? c.btnDis : c.btn)}>
        {loading ? <><span className="animate-spin inline-block">⏳</span> Tracing prerequisites...</> : <><span>📝</span> Find the Gap</>}
      </button>
    </div>
  );

  // ══════════════════════════════════════════
  // RESULTS
  // ══════════════════════════════════════════
  const renderResults = () => {
    if (!results) return null;
    const chain = results.prerequisite_chain || [];
    const gap = results.likely_gap;

    return (
      <div ref={resultsRef} className="space-y-4 mt-4">
        {/* Analysis */}
        {results.concept_analysis && (
          <div className={'p-5 rounded-2xl border-2 ' + c.tipBg}>
            <p className={'text-xs font-bold ' + c.tipText + ' uppercase mb-1'}>Why "{concept}" is confusing</p>
            <p className={'text-sm ' + c.text}>{results.concept_analysis}</p>
          </div>
        )}

        {/* Chain visualization */}
        {results.chain_visualization && (
          <div className={'p-4 rounded-xl ' + c.inset + ' text-center'}>
            <p className={'text-xs font-bold ' + c.textMut + ' mb-2'}>🔗 Prerequisite Chain</p>
            <p className={'text-sm font-mono ' + c.text + ' break-words'}>{results.chain_visualization}</p>
          </div>
        )}

        {/* Chain nodes */}
        <div className="space-y-2">
          <p className={'text-xs font-bold ' + c.textMut + ' uppercase'}>Prerequisites (click to explore)</p>
          {chain.map((node, idx) => {
            const gs = gapStyle(node.gap_likelihood);
            const expanded = expandedNodes[idx];
            return (
              <div key={idx} className={'rounded-xl border-2 overflow-hidden transition-all ' + gs.bg}>
                <button onClick={() => toggleNode(idx)} className="w-full text-left p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center">
                      <span className="text-base">{gs.emoji}</span>
                      <span className={'text-[9px] font-bold ' + gs.text}>L{node.level_in_chain}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={'text-sm font-bold ' + c.text}>{node.concept}</p>
                      <p className={'text-xs ' + c.textSec + ' mt-0.5'}>{node.why_needed}</p>
                    </div>
                    <span className={'text-[10px] font-bold px-2 py-0.5 rounded-full ' + c.badge}>
                      {node.gap_likelihood} risk
                    </span>
                  </div>
                </button>
                {expanded && (
                  <div className={'px-4 pb-4 border-t ' + c.divider}>
                    <div className={'mt-3 p-3 rounded-lg ' + c.inset}>
                      <p className={'text-xs font-bold ' + c.textMut + ' mb-1'}>🧪 Quick test</p>
                      <p className={'text-sm ' + c.text + ' italic'}>{node.quick_test}</p>
                    </div>
                    <div className="flex gap-1.5 mt-3">
                      <button onClick={() => dig(node.concept, 'failed')}
                        className={'flex-1 py-2 rounded-lg text-xs font-bold border ' + c.pillInactive + ' hover:border-[#b54a3f]'}>
                        ❌ Can't answer
                      </button>
                      <button onClick={() => dig(node.concept, 'unsure')}
                        className={'flex-1 py-2 rounded-lg text-xs font-bold border ' + c.pillInactive + ' hover:border-[#c8872e]'}>
                        🤔 Unsure
                      </button>
                      <button onClick={() => dig(node.concept, 'passed')}
                        className={'flex-1 py-2 rounded-lg text-xs font-bold border ' + c.pillInactive + ' hover:border-[#5a8a5c]'}>
                        ✅ Got it
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Likely gap */}
        {gap && (
          <div className={'p-5 rounded-2xl border-2 ' + c.gapHigh}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🎯</span>
              <div>
                <p className={'text-base font-bold ' + c.text}>Likely gap: {gap.concept}</p>
                <p className={'text-xs ' + c.textSec}>{GAP_TYPE_LABELS[gap.gap_type] || gap.gap_type_explanation}</p>
              </div>
            </div>
            <p className={'text-xs ' + c.textSec + ' mb-3'}>{gap.why_this_one}</p>

            {/* Refresher */}
            {gap.refresher && (
              <div className={'rounded-xl border ' + c.card + ' p-4 space-y-3'}>
                <div>
                  <p className={'text-xs font-bold ' + c.textMut + ' uppercase mb-1'}>📖 Quick refresher</p>
                  <p className={'text-sm ' + c.text}>{gap.refresher.core_idea}</p>
                </div>
                {gap.refresher.common_confusion && (
                  <div className={'p-3 rounded-lg ' + c.warnBg}>
                    <p className={'text-xs font-bold ' + c.warnText}>⚠️ Common confusion: {gap.refresher.common_confusion}</p>
                  </div>
                )}
                {gap.refresher.practice && (
                  <div className={'p-3 rounded-lg ' + c.inset}>
                    <p className={'text-xs font-bold ' + c.textMut + ' mb-1'}>✏️ Practice</p>
                    <p className={'text-xs ' + c.text}>{gap.refresher.practice}</p>
                  </div>
                )}
                {gap.refresher.time_estimate && (
                  <p className={'text-xs ' + c.tipText}>⏱️ Time to fill this gap: {gap.refresher.time_estimate}</p>
                )}
              </div>
            )}

            <button onClick={() => dig(gap.concept, 'failed')}
              className={'w-full mt-3 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 ' + c.btn}>
              <span>🔍</span> Deep Dive Into This Gap
            </button>
          </div>
        )}

        {/* Forward connection */}
        {results.forward_connection && (
          <div className={'p-4 rounded-xl border ' + c.successBg}>
            <p className={'text-xs font-bold ' + c.successText + ' mb-1'}>🔗 How this connects back to {concept}</p>
            <p className={'text-sm ' + c.successText}>{results.forward_connection}</p>
          </div>
        )}

        {/* Study plan */}
        {results.study_plan && (
          <div className={c.card + ' border rounded-xl overflow-hidden'}>
            <button onClick={() => setShowPlan(!showPlan)} className="w-full flex items-center justify-between p-4 hover:opacity-80">
              <div className="flex items-center gap-2">
                <span>📋</span>
                <span className={'text-sm font-semibold ' + c.text}>Study Plan</span>
                {results.study_plan.total_time && <span className={'text-xs px-2 py-0.5 rounded-full ' + c.badge}>⏱️ {results.study_plan.total_time}</span>}
              </div>
              <span className={'text-xs ' + c.textMut}>{showPlan ? '▲' : '▼'}</span>
            </button>
            {showPlan && (
              <div className={'px-4 pb-4 border-t ' + c.divider + ' space-y-2 mt-3'}>
                {['step_1', 'step_2', 'step_3'].map((key, i) => results.study_plan[key] && (
                  <div key={key} className={'p-3 rounded-lg ' + c.inset + ' flex items-start gap-3'}>
                    <span className={'text-xs font-black ' + c.tipText}>{i + 1}</span>
                    <p className={'text-xs ' + c.text}>{results.study_plan[key]}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Alternatives */}
        {results.if_thats_not_it?.length > 0 && (
          <div>
            <button onClick={() => setShowAlternatives(!showAlternatives)}
              className={'w-full flex items-center gap-2 p-3 rounded-xl ' + c.cardAlt + ' border hover:opacity-80'}>
              <span>🤔</span>
              <span className={'text-xs font-bold ' + c.text + ' flex-1'}>That's not the gap?</span>
              <span className={'text-xs ' + c.textMut}>{showAlternatives ? '▲' : '▼'}</span>
            </button>
            {showAlternatives && (
              <div className="mt-2 space-y-2">
                {results.if_thats_not_it.map((alt, i) => (
                  <div key={i} className={'p-3 rounded-lg border ' + c.cardAlt}>
                    <p className={'text-xs font-bold ' + c.text}>{alt.alternative_gap}</p>
                    <p className={'text-[10px] ' + c.textSec + ' mt-0.5'}>Symptom: {alt.symptom}</p>
                    <button onClick={() => dig(alt.alternative_gap, 'failed')}
                      className={'mt-2 text-[10px] font-bold ' + c.linkStyle}>Dig into this instead →</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Encouragement */}
        {results.encouragement && (
          <div className={'p-4 rounded-xl border ' + c.successBg}>
            <p className={'text-sm ' + c.successText}>💚 {results.encouragement}</p>
          </div>
        )}

        {/* Dig results */}
        {digResults && renderDig()}

        <div className="flex gap-2">
          <div className="flex-1"><CopyBtn content={buildCopy()} label="Copy Study Plan" /></div>
          <button onClick={handleReset} className={'flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 ' + c.btn}><span>📝</span> New Concept</button>
        </div>

        <div className={'p-4 rounded-2xl border ' + c.card}>
          <p className={'text-xs font-bold ' + c.textMut + ' uppercase tracking-wide mb-2'}>🔗 Related Tools</p>
          <div className={'space-y-1.5 text-xs ' + c.textSec}>
            <p>Have lecture notes to distill? <a href="/Recall" target="_blank" rel="noopener noreferrer" className={c.linkStyle}>Recall</a> extracts the key points.</p>
            <p>Need practice questions? <a href="/Recall" target="_blank" rel="noopener noreferrer" className={c.linkStyle}>Recall's Test Prep</a> mode generates them from your notes.</p>
          </div>
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════
  // DIG RESULTS
  // ══════════════════════════════════════════
  const renderDig = () => {
    if (!digResults?.refresher) return null;
    const r = digResults.refresher;
    return (
      <div className={'p-5 rounded-2xl border-2 ' + c.infoBg}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🔍</span>
          <p className={'text-base font-bold ' + c.text}>Deep Dive: {digResults.concept || digTarget}</p>
        </div>

        {r.in_plain_english && (
          <div className={'p-4 rounded-xl ' + c.card + ' border mb-3'}>
            <p className={'text-xs font-bold ' + c.textMut + ' uppercase mb-1'}>In plain English</p>
            <p className={'text-sm ' + c.text}>{r.in_plain_english}</p>
          </div>
        )}

        {r.key_insight && (
          <div className={'p-3 rounded-lg ' + c.tipBg + ' mb-3'}>
            <p className={'text-xs font-bold ' + c.tipText + ' mb-1'}>💡 Key insight</p>
            <p className={'text-sm ' + c.tipText}>{r.key_insight}</p>
          </div>
        )}

        {r.visual_or_analogy && (
          <div className={'p-3 rounded-lg ' + c.inset + ' mb-3'}>
            <p className={'text-xs font-bold ' + c.textMut + ' mb-1'}>🎨 Analogy</p>
            <p className={'text-xs ' + c.text}>{r.visual_or_analogy}</p>
          </div>
        )}

        {r.formal_definition && (
          <div className={'p-3 rounded-lg ' + c.inset + ' mb-3'}>
            <p className={'text-xs font-bold ' + c.textMut + ' mb-1'}>📖 Formal definition</p>
            <p className={'text-xs ' + c.text + ' font-mono'}>{r.formal_definition}</p>
          </div>
        )}

        {r.worked_example && (
          <div className={c.card + ' border rounded-xl p-4 mb-3'}>
            <p className={'text-xs font-bold ' + c.textMut + ' uppercase mb-1'}>📝 Worked example</p>
            <p className={'text-sm ' + c.text + ' whitespace-pre-wrap'}>{r.worked_example}</p>
          </div>
        )}

        {r.practice_problems?.length > 0 && (
          <div className="space-y-2 mb-3">
            <p className={'text-xs font-bold ' + c.textMut + ' uppercase'}>✏️ Practice</p>
            {r.practice_problems.map((pp, i) => (
              <div key={i} className={c.card + ' border rounded-xl p-3'}>
                <p className={'text-xs font-semibold ' + c.text + ' mb-1'}>Problem {i + 1}: {pp.problem}</p>
                <details className="mt-1">
                  <summary className={'text-[10px] font-bold cursor-pointer ' + c.linkStyle}>Show hint & answer</summary>
                  <div className="mt-2 space-y-1">
                    {pp.hint && <p className={'text-[10px] ' + c.tipText}>💡 Hint: {pp.hint}</p>}
                    <p className={'text-[10px] ' + c.successText}>✅ {pp.answer}</p>
                  </div>
                </details>
              </div>
            ))}
          </div>
        )}

        {r.common_mistakes?.length > 0 && (
          <div className="space-y-1 mb-3">
            {r.common_mistakes.map((m, i) => (
              <div key={i} className={'p-2 rounded-lg ' + c.warnBg}>
                <p className={'text-[10px] ' + c.warnText}>⚠️ {m}</p>
              </div>
            ))}
          </div>
        )}

        {digResults.connects_forward && (
          <div className={'p-3 rounded-lg ' + c.successBg}>
            <p className={'text-xs font-bold ' + c.successText + ' mb-1'}>🔗 Now it connects</p>
            <p className={'text-xs ' + c.successText}>{digResults.connects_forward}</p>
          </div>
        )}
      </div>
    );
  };

  // History
  const renderHistory = () => {
    if (history.length === 0) return null;
    const formatDate = (iso) => { try { const d = new Date(iso); const diff = Math.floor((new Date() - d) / 86400000); return diff === 0 ? 'Today' : diff === 1 ? 'Yesterday' : diff < 7 ? diff + 'd ago' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); } catch { return ''; } };
    return (
      <div className={'mt-6 p-4 rounded-2xl border ' + c.histBg}>
        <button onClick={() => setShowHistory(!showHistory)} className="w-full flex items-center gap-2 text-left">
          <span>📝</span>
          <span className={'text-sm font-bold ' + c.text + ' flex-1'}>Past Gaps</span>
          <span className={'text-xs ' + c.textMut}>{history.length}</span>
          <span className={'text-xs ' + c.textMut}>{showHistory ? '▲' : '▼'}</span>
        </button>
        {showHistory && (
          <div className="mt-3 space-y-2">
            {history.map(entry => (
              <div key={entry.id} className={'rounded-xl border ' + c.histCard + ' p-3'}>
                <div className={'text-sm font-semibold ' + c.text}>{entry.concept}</div>
                <div className={'text-xs ' + c.textMut + ' mt-0.5'}>
                  {formatDate(entry.date)}{entry.subject ? ` · ${entry.subject}` : ''}{entry.likelyGap ? ` · Gap: ${entry.likelyGap}` : ''}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div>
          <h2 className={'text-2xl font-bold ' + c.heading}>The Gap <span className="text-xl">📝</span></h2>
          <p className={'text-sm ' + c.textMut}>Stuck on a concept? We'll trace back to find where your understanding broke.</p>
        </div>
      </div>
      {!results && renderInput()}
      {renderResults()}
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

TheGap.displayName = 'TheGap';
export default TheGap;
