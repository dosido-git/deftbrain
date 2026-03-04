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
    label:       d ? 'text-[#c8c3b9]'  : 'text-[#5a544a]',
    btn:         d ? 'bg-[#2c4a6e] hover:bg-[#4a6a8a] text-white' : 'bg-[#2c4a6e] hover:bg-[#1e3a58] text-white',
    btnSec:      d ? 'bg-[#332e2a] hover:bg-[#3d3630] text-[#c8c3b9] border border-[#3d3630]' : 'bg-[#f3efe8] hover:bg-[#e8e1d5] text-[#5e5042] border border-[#d5cab8]',
    btnGhost:    d ? 'text-[#8a8275] hover:text-[#f0eeea]' : 'text-[#8a8275] hover:text-[#3d3935]',
    btnDis:      d ? 'bg-[#332e2a] text-[#5a544a] cursor-not-allowed' : 'bg-[#e8e1d5] text-[#8a8275] cursor-not-allowed',
    pillActive:  d ? 'border-[#4a6a8a] bg-[#2c4a6e]/30 text-[#a8b9ce]' : 'border-[#2c4a6e] bg-[#d4dde8] text-[#1e3a58]',
    pillInactive: d ? 'border-[#3d3630] text-[#8a8275] hover:border-[#5a544a]' : 'border-[#d5cab8] text-[#5a544a] hover:border-[#8a8275]',
    badge:       d ? 'bg-[#2c4a6e]/30 text-[#a8b9ce]' : 'bg-[#d4dde8] text-[#1e3a58]',
    divider:     d ? 'border-[#3d3630]' : 'border-[#e8e1d5]',
    tipBg:       d ? 'bg-[#c8872e]/10 border-[#c8872e]/30' : 'bg-[#f9edd8] border-[#c8872e]/30',
    tipText:     d ? 'text-[#d9a04e]' : 'text-[#93541f]',
    errBg:       d ? 'bg-[#b54a3f]/15 border-[#b54a3f]/40' : 'bg-[#fceae8] border-[#e8a8a0]',
    errText:     d ? 'text-[#e88880]' : 'text-[#b54a3f]',
    // Priority cards
    actionBg:    d ? 'bg-[#b54a3f]/15 border-[#b54a3f]/40' : 'bg-[#fceae8] border-[#b54a3f]/30',
    actionText:  d ? 'text-[#e88880]' : 'text-[#b54a3f]',
    costBg:      d ? 'bg-[#c8872e]/10 border-[#c8872e]/30' : 'bg-[#f9edd8] border-[#c8872e]/30',
    costText:    d ? 'text-[#d9a04e]' : 'text-[#93541f]',
    saveBg:      d ? 'bg-[#5a8a5c]/10 border-[#5a8a5c]/30' : 'bg-[#e8f0e8] border-[#5a8a5c]/30',
    saveText:    d ? 'text-[#7aba7c]' : 'text-[#3a6a3c]',
    infoBg:      d ? 'bg-[#2c4a6e]/15 border-[#4a6a8a]/30' : 'bg-[#d4dde8]/30 border-[#2c4a6e]/15',
    infoText:    d ? 'text-[#a8b9ce]' : 'text-[#1e3a58]',
    histBg:      d ? 'bg-[#2c4a6e]/10 border-[#4a6a8a]/30' : 'bg-[#d4dde8]/30 border-[#2c4a6e]/15',
    histCard:    d ? 'bg-[#2a2623] border-[#3d3630]' : 'bg-white border-[#e8e1d5]',
    linkStyle:   d ? 'text-[#6e8aaa] hover:text-[#a8b9ce] underline' : 'text-[#2c4a6e] hover:text-[#1e3a58] underline',
  };
};

const DOC_TYPES = [
  { value: 'insurance_eob', label: '🏥 Insurance EOB' },
  { value: 'school_newsletter', label: '🏫 School Newsletter' },
  { value: 'hoa_notice', label: '🏠 HOA / Condo Notice' },
  { value: 'lease', label: '📄 Lease / Amendment' },
  { value: 'policy_update', label: '🏢 Company Policy Update' },
  { value: 'benefits', label: '💼 Benefits Enrollment' },
  { value: 'government', label: '🏛️ Government Notice' },
  { value: 'medical', label: '⚕️ Medical / Billing' },
  { value: 'legal', label: '⚖️ Legal Document' },
  { value: 'other', label: '📎 Other' },
];

// ════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════
const NoiseCanceler = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const c = useColors();
  const resultsRef = useRef(null);

  const [history, setHistory] = usePersistentState('noise-canceler-history', []);
  const [showHistory, setShowHistory] = useState(false);

  // Input
  const [document, setDocument] = useState('');
  const [documentType, setDocumentType] = useState('other');
  const [mySituation, setMySituation] = useState('');
  const [concerns, setConcerns] = useState('');

  // Results
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [showAffects, setShowAffects] = useState(true);
  const [showBuried, setShowBuried] = useState(true);
  const [showQuestions, setShowQuestions] = useState(false);

  useEffect(() => {
    if (results && resultsRef.current) {
      setTimeout(() => resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
    }
  }, [results]);

  const filter = useCallback(async () => {
    if (!document.trim()) { setError('Paste the document you received'); return; }
    if (!mySituation.trim()) { setError('Tell us your situation so we can filter what\'s relevant'); return; }
    setError(''); setResults(null);
    try {
      const data = await callToolEndpoint('noise-canceler', {
        document: document.trim(), documentType, mySituation: mySituation.trim(),
        concerns: concerns.trim() || null,
      });
      setResults(data);
      const entry = { id: 'nc_' + Date.now(), date: new Date().toISOString(), type: data.document_type || documentType, tldr: data.tldr?.substring(0, 60) || '...', results: data };
      setHistory(prev => [entry, ...prev].slice(0, 20));
    } catch (err) { setError(err.message || 'Failed to filter document.'); }
  }, [document, documentType, mySituation, concerns, callToolEndpoint, setHistory]);

  const handleReset = useCallback(() => {
    setDocument(''); setMySituation(''); setConcerns(''); setResults(null); setError('');
  }, []);

  const buildCopy = useCallback(() => {
    if (!results) return '';
    const lines = ['🔇 Noise Canceler — What Matters to You', '', 'TL;DR: ' + (results.tldr || ''), ''];
    if (results.action_required?.length) {
      lines.push('⚡ ACTION REQUIRED:');
      results.action_required.forEach(a => lines.push('  • ' + a.what + (a.deadline ? ' (by ' + a.deadline + ')' : '')));
      lines.push('');
    }
    if (results.costs_you_money?.length) {
      lines.push('💸 COSTS YOU MONEY:');
      results.costs_you_money.forEach(c => lines.push('  • ' + c.what + (c.amount ? ': ' + c.amount : '')));
      lines.push('');
    }
    if (results.saves_you_money?.length) {
      lines.push('💚 SAVES YOU MONEY:');
      results.saves_you_money.forEach(s => lines.push('  • ' + s.what + (s.amount ? ': ' + s.amount : '')));
      lines.push('');
    }
    lines.push('— Generated by DeftBrain · deftbrain.com');
    return lines.join('\n');
  }, [results]);

  const Section = ({ title, emoji, open, onToggle, badge, children }) => (
    <div className={c.card + ' border rounded-xl overflow-hidden'}>
      <button onClick={onToggle} className="w-full flex items-center justify-between p-5 text-left hover:opacity-80">
        <div className="flex items-center gap-3">
          <span className="text-lg">{emoji}</span>
          <span className={'text-base font-semibold ' + c.text}>{title}</span>
          {badge && <span className={'text-xs px-2 py-0.5 rounded-full ' + c.badge}>{badge}</span>}
        </div>
        <span className={'text-xs ' + c.textMut}>{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className={'px-5 pb-5 border-t ' + c.divider}>{children}</div>}
    </div>
  );

  const Pill = ({ active, onClick, children }) => (
    <button onClick={onClick} className={'px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ' + (active ? c.pillActive : c.pillInactive)}>
      {active && <span className="mr-1">✓</span>}{children}
    </button>
  );

  const effortBadge = (e) => {
    if (e === 'quick') return '⚡ Quick';
    if (e === 'moderate') return '🕐 ~30 min';
    return '📋 Involved';
  };

  // ══════════════════════════════════════════
  // INPUT
  // ══════════════════════════════════════════
  const renderInput = () => (
    <div className="space-y-4">
      <div className={c.card + ' border rounded-xl p-5'}>
        <label className={'text-base font-bold ' + c.text + ' mb-1 block'}>📄 Paste the document</label>
        <p className={'text-sm ' + c.textMut + ' mb-4'}>Insurance EOB, HOA notice, policy update, lease amendment — whatever wall of text you received.</p>
        <textarea value={document} onChange={e => setDocument(e.target.value)}
          placeholder="Paste the full text here..."
          className={'w-full h-40 p-4 border-2 rounded-xl ' + c.inputBg + ' outline-none focus:ring-2 resize-none text-sm font-mono'} />
        {document.length > 0 && <p className={'text-xs ' + c.textMut + ' mt-1'}>{document.length.toLocaleString()} characters</p>}
      </div>

      <div className={c.card + ' border rounded-xl p-5 space-y-4'}>
        <div>
          <label className={'text-xs font-bold ' + c.textSec + ' uppercase tracking-wide mb-2 block'}>📎 Document type</label>
          <div className="flex flex-wrap gap-1.5">
            {DOC_TYPES.map(dt => <Pill key={dt.value} active={documentType === dt.value} onClick={() => setDocumentType(dt.value)}>{dt.label}</Pill>)}
          </div>
        </div>
        <div>
          <label className={'text-xs font-bold ' + c.textSec + ' uppercase tracking-wide mb-1 block'}>👤 Your situation</label>
          <p className={'text-xs ' + c.textMut + ' mb-2'}>The more specific, the better we can filter.</p>
          <textarea value={mySituation} onChange={e => setMySituation(e.target.value)}
            placeholder="e.g., 'Renter, no kids, have a dog, work from home' or 'Single, 28, on the basic health plan, no dependents'"
            className={'w-full h-16 p-4 border-2 rounded-xl ' + c.inputBg + ' outline-none focus:ring-2 resize-none text-sm'} />
        </div>
        <div>
          <label className={'text-xs font-bold ' + c.textSec + ' uppercase tracking-wide mb-1 block'}>🔍 Anything specific you're worried about? (optional)</label>
          <input type="text" value={concerns} onChange={e => setConcerns(e.target.value)}
            placeholder="e.g., 'Did they raise the rent?', 'Am I covered for this procedure?'"
            className={'w-full px-4 py-2.5 rounded-xl border text-sm ' + c.inputBg + ' outline-none'} />
        </div>
      </div>

      <button onClick={filter} disabled={loading || !document.trim() || !mySituation.trim()}
        className={'w-full py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all ' + (loading || !document.trim() || !mySituation.trim() ? c.btnDis : c.btn)}>
        {loading ? <><span className="animate-spin inline-block">⏳</span> Filtering for you...</> : <><span>🔇</span> Filter for What Matters</>}
      </button>
    </div>
  );

  // ══════════════════════════════════════════
  // RESULTS
  // ══════════════════════════════════════════
  const renderResults = () => {
    if (!results) return null;
    const hasActions = results.action_required?.length > 0;
    const hasCosts = results.costs_you_money?.length > 0;
    const hasSaves = results.saves_you_money?.length > 0;

    return (
      <div ref={resultsRef} className="space-y-4 mt-4">
        {/* TL;DR */}
        <div className={'p-5 rounded-2xl border-2 ' + (hasActions ? c.actionBg : c.tipBg)}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{hasActions ? '⚡' : '✅'}</span>
            <span className={'text-sm font-bold ' + (hasActions ? c.actionText : c.tipText)}>
              {results.document_type || 'Document'}
            </span>
            {results.confidence && results.confidence !== 'high' && (
              <span className={'text-xs px-2 py-0.5 rounded-full ' + c.badge}>⚠️ {results.confidence} confidence</span>
            )}
          </div>
          <p className={'text-sm font-bold ' + c.text}>{results.tldr}</p>
          {results.confidence_note && <p className={'text-xs ' + c.textMut + ' mt-2 italic'}>{results.confidence_note}</p>}
        </div>

        {/* Action Required */}
        {hasActions && (
          <div className="space-y-2">
            <p className={'text-xs font-bold ' + c.actionText + ' uppercase'}>⚡ Action Required</p>
            {results.action_required.map((a, idx) => (
              <div key={idx} className={'p-4 rounded-xl border-2 ' + c.actionBg}>
                <div className="flex items-center justify-between mb-1">
                  <span className={'text-sm font-bold ' + c.text}>{a.what}</span>
                  {a.effort && <span className={'text-[10px] px-2 py-0.5 rounded-full ' + c.badge}>{effortBadge(a.effort)}</span>}
                </div>
                {a.deadline && <p className={'text-xs font-bold ' + c.actionText + ' mb-1'}>📅 Deadline: {a.deadline}</p>}
                {a.consequence && <p className={'text-xs ' + c.textSec + ' mb-1'}>⚠️ If you don't: {a.consequence}</p>}
                {a.how && <p className={'text-xs ' + c.textMut}>📝 How: {a.how}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Costs you money */}
        {hasCosts && (
          <div className="space-y-2">
            <p className={'text-xs font-bold ' + c.costText + ' uppercase'}>💸 Costs You Money</p>
            {results.costs_you_money.map((item, idx) => (
              <div key={idx} className={'p-4 rounded-xl border ' + c.costBg}>
                <div className="flex items-center justify-between mb-1">
                  <span className={'text-sm font-bold ' + c.text}>{item.what}</span>
                  {item.amount && <span className={'text-sm font-bold ' + c.costText}>{item.amount}</span>}
                </div>
                {item.when && <p className={'text-xs ' + c.textSec}>Effective: {item.when}</p>}
                {item.avoidable && <p className={'text-xs ' + c.tipText + ' mt-1'}>💡 {item.avoidable}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Saves you money */}
        {hasSaves && (
          <div className="space-y-2">
            <p className={'text-xs font-bold ' + c.saveText + ' uppercase'}>💚 Saves You Money</p>
            {results.saves_you_money.map((item, idx) => (
              <div key={idx} className={'p-4 rounded-xl border ' + c.saveBg}>
                <div className="flex items-center justify-between mb-1">
                  <span className={'text-sm font-bold ' + c.text}>{item.what}</span>
                  {item.amount && <span className={'text-sm font-bold ' + c.saveText}>{item.amount}</span>}
                </div>
                {item.how_to_claim && <p className={'text-xs ' + c.textSec}>How: {item.how_to_claim}</p>}
                {item.deadline && <p className={'text-xs ' + c.saveText + ' mt-1'}>📅 By: {item.deadline}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Affects you */}
        {results.affects_you?.length > 0 && (
          <Section title="Also Relevant" emoji="📌" open={showAffects} onToggle={() => setShowAffects(!showAffects)} badge={results.affects_you.length + ''}>
            <div className="space-y-2 mt-4">
              {results.affects_you.map((item, idx) => (
                <div key={idx} className={'p-3 rounded-lg border ' + c.cardAlt}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={'text-xs font-bold px-2 py-0.5 rounded-full ' + (item.priority === 'high' ? c.badge : c.inset + ' ' + c.textMut)}>{item.priority}</span>
                    <span className={'text-sm font-semibold ' + c.text}>{item.what}</span>
                  </div>
                  <p className={'text-xs ' + c.textSec}>{item.why_it_matters}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Doesn't affect you */}
        {results.does_not_affect_you && (
          <div className={'p-4 rounded-xl ' + c.inset}>
            <p className={'text-xs font-bold ' + c.textMut + ' mb-1'}>🔇 Safely ignore</p>
            <p className={'text-sm ' + c.text}>{results.does_not_affect_you}</p>
          </div>
        )}

        {/* Buried important */}
        {results.buried_important?.length > 0 && (
          <Section title="Buried but Important" emoji="🔍" open={showBuried} onToggle={() => setShowBuried(!showBuried)} badge={results.buried_important.length + ''}>
            <div className="space-y-2 mt-4">
              {results.buried_important.map((item, idx) => (
                <div key={idx} className={'p-3 rounded-lg border ' + c.tipBg}>
                  <p className={'text-xs font-bold ' + c.tipText + ' mb-1'}>{item.what}</p>
                  <p className={'text-[10px] ' + c.textMut}>Found: {item.where}</p>
                  <p className={'text-xs ' + c.tipText + ' mt-1'}>Why it's easy to miss: {item.why_buried}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Questions to ask */}
        {results.questions_to_ask?.length > 0 && (
          <Section title="Questions to Ask" emoji="❓" open={showQuestions} onToggle={() => setShowQuestions(!showQuestions)}>
            <div className="space-y-1 mt-4">
              {results.questions_to_ask.map((q, idx) => (
                <div key={idx} className={'p-2 rounded-lg ' + c.inset}>
                  <p className={'text-xs ' + c.text}>"{q}"</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Consult professional */}
        {results.consult_professional?.length > 0 && (
          <div className={'p-4 rounded-xl border ' + c.infoBg}>
            <p className={'text-xs font-bold ' + c.infoText + ' mb-2'}>👨‍⚖️ Consider consulting a professional</p>
            {results.consult_professional.map((item, idx) => (
              <div key={idx} className="mb-2 last:mb-0">
                <p className={'text-xs font-semibold ' + c.text}>{item.topic}</p>
                <p className={'text-[10px] ' + c.textSec}>{item.why} → Talk to a {item.who}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <div className="flex-1"><CopyBtn content={buildCopy()} label="Copy Summary" /></div>
          <button onClick={handleReset} className={'flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 ' + c.btn}><span>🔇</span> New Document</button>
        </div>

        <div className={'p-4 rounded-2xl border ' + c.card}>
          <p className={'text-xs font-bold ' + c.textMut + ' uppercase tracking-wide mb-2'}>🔗 Related Tools</p>
          <div className={'space-y-1.5 text-xs ' + c.textSec}>
            <p>Need jargon translated? <a href="/JargonAssassin" target="_blank" rel="noopener noreferrer" className={c.linkStyle}>Jargon Assassin</a> breaks down dense language.</p>
            <p>Checking a lease? <a href="/LeaseTrapDetector" target="_blank" rel="noopener noreferrer" className={c.linkStyle}>Lease Trap Detector</a> finds predatory clauses.</p>
          </div>
        </div>
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
          <span>🔇</span>
          <span className={'text-sm font-bold ' + c.text + ' flex-1'}>Past Filters</span>
          <span className={'text-xs ' + c.textMut}>{history.length}</span>
          <span className={'text-xs ' + c.textMut}>{showHistory ? '▲' : '▼'}</span>
        </button>
        {showHistory && (
          <div className="mt-3 space-y-2">
            {history.map(entry => (
              <div key={entry.id} className={'rounded-xl border ' + c.histCard + ' p-3 flex items-center gap-3'}>
                <div className="flex-1 min-w-0">
                  <div className={'text-sm font-semibold ' + c.text + ' truncate'}>{entry.tldr}</div>
                  <div className={'text-xs ' + c.textMut + ' mt-0.5'}>{formatDate(entry.date)} · {entry.type}</div>
                </div>
                <button onClick={() => { setResults(entry.results); setShowHistory(false); }}
                  className={'px-3 py-1.5 rounded-lg text-xs font-bold ' + c.btnSec}>View</button>
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
          <h2 className={'text-2xl font-bold ' + c.heading}>Noise Canceler <span className="text-xl">🔇</span></h2>
          <p className={'text-sm ' + c.textMut}>Paste a long document, tell us your situation — we'll extract only what affects you</p>
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

NoiseCanceler.displayName = 'NoiseCanceler';
export default NoiseCanceler;
