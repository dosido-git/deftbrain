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
    d,
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
    border:      d ? 'border-[#3d3630]' : 'border-[#e8e1d5]',
    divider:     d ? 'border-[#3d3630]' : 'border-[#e8e1d5]',
    btn:         d ? 'bg-[#2c4a6e] hover:bg-[#4a6a8a] text-white' : 'bg-[#2c4a6e] hover:bg-[#1e3a58] text-white',
    btnGold:     d ? 'bg-[#b06d22] hover:bg-[#c8872e] text-white' : 'bg-[#c8872e] hover:bg-[#b06d22] text-white',
    btnSec:      d ? 'bg-[#332e2a] hover:bg-[#3d3630] text-[#c8c3b9] border border-[#3d3630]'
                    : 'bg-[#f3efe8] hover:bg-[#e8e1d5] text-[#5e5042] border border-[#d5cab8]',
    btnOutline:  d ? 'border border-[#3d3630] hover:border-[#4a6a8a] text-[#c8c3b9] hover:text-[#a8b9ce]'
                    : 'border border-[#d5cab8] hover:border-[#2c4a6e] text-[#5a544a] hover:text-[#1e3a58]',
    btnGhost:    d ? 'text-[#8a8275] hover:text-[#f0eeea]' : 'text-[#8a8275] hover:text-[#3d3935]',
    btnDis:      d ? 'bg-[#332e2a] text-[#5a544a] cursor-not-allowed' : 'bg-[#e8e1d5] text-[#8a8275] cursor-not-allowed',
    pillActive:  d ? 'border-[#4a6a8a] bg-[#2c4a6e]/30 text-[#a8b9ce]' : 'border-[#2c4a6e] bg-[#d4dde8] text-[#1e3a58]',
    pillInactive: d ? 'border-[#3d3630] text-[#8a8275] hover:border-[#5a544a]' : 'border-[#d5cab8] text-[#5a544a] hover:border-[#8a8275]',
    badge:       d ? 'bg-[#2c4a6e]/30 text-[#a8b9ce]' : 'bg-[#d4dde8] text-[#1e3a58]',
    // Version tabs
    tabActive:   d ? 'bg-[#332e2a] text-[#d9a04e] border-b-2 border-[#c8872e]' : 'bg-[#faf8f5] text-[#1e3a58] border-b-2 border-[#2c4a6e]',
    tabInactive: d ? 'text-[#8a8275] hover:text-[#c8c3b9] hover:bg-[#332e2a]/50' : 'text-[#8a8275] hover:text-[#5a544a] hover:bg-[#faf8f5]',
    // Letter body
    letterBg:    d ? 'bg-[#1a1816] border-[#3d3630]' : 'bg-[#faf8f5] border-[#e8e1d5]',
    // Tips
    tipBg:       d ? 'bg-[#c8872e]/10 border-[#c8872e]/30' : 'bg-[#f9edd8] border-[#c8872e]/30',
    tipText:     d ? 'text-[#d9a04e]' : 'text-[#93541f]',
    // Placeholder highlights
    placeholderBg: d ? 'bg-[#2c4a6e]/15 border-[#4a6a8a]/30' : 'bg-[#d4dde8]/40 border-[#2c4a6e]/20',
    placeholderText: d ? 'text-[#a8b9ce]' : 'text-[#1e3a58]',
    // Power phrases
    powerBg:     d ? 'bg-[#5a8a5c]/10 border-[#5a8a5c]/30' : 'bg-[#e8f0e8] border-[#5a8a5c]/30',
    powerText:   d ? 'text-[#7aba7c]' : 'text-[#3a6a3c]',
    errBg:       d ? 'bg-[#b54a3f]/15 border-[#b54a3f]/40' : 'bg-[#fceae8] border-[#e8a8a0]',
    errText:     d ? 'text-[#e88880]' : 'text-[#b54a3f]',
    histBg:      d ? 'bg-[#2c4a6e]/10 border-[#4a6a8a]/30' : 'bg-[#d4dde8]/30 border-[#2c4a6e]/15',
    histCard:    d ? 'bg-[#2a2623] border-[#3d3630]' : 'bg-white border-[#e8e1d5]',
    histAccent:  d ? 'text-[#a8b9ce]' : 'text-[#2c4a6e]',
    linkStyle:   d ? 'text-[#6e8aaa] hover:text-[#a8b9ce] underline' : 'text-[#2c4a6e] hover:text-[#1e3a58] underline',
  };
};

// ════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════
const LETTER_TYPES = [
  { value: 'job', label: '💼 Job recommendation' },
  { value: 'grad-school', label: '🎓 Graduate school' },
  { value: 'linkedin', label: '💬 LinkedIn recommendation' },
  { value: 'scholarship', label: '🏆 Scholarship' },
  { value: 'rental', label: '🏠 Rental/housing reference' },
  { value: 'character', label: '🤝 Character reference' },
  { value: 'other', label: '📝 Other' },
];

const FORMALITY_OPTIONS = [
  { value: 'casual', label: 'Casual (LinkedIn, brief reference)' },
  { value: 'professional', label: 'Professional (job rec, standard)' },
  { value: 'formal', label: 'Formal (grad school, legal, scholarship)' },
];

const QUALITY_OPTIONS = [
  'Leadership', 'Problem-solving', 'Communication', 'Work ethic',
  'Creativity', 'Teamwork', 'Technical skills', 'Reliability',
  'Initiative', 'Empathy', 'Attention to detail', 'Adaptability',
  'Mentorship', 'Strategic thinking', 'Resilience',
];

const VERSION_ICONS = { narrative: '📖', structured: '📋', concise: '⚡' };


// ════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════
const GhostWriter = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const c = useColors();
  const resultsRef = useRef(null);

  // Persistent
  const [history, setHistory] = usePersistentState('ghost-writer-history', []);
  const [showHistory, setShowHistory] = useState(false);

  // Input
  const [recipientName, setRecipientName] = useState('');
  const [yourRelationship, setYourRelationship] = useState('');
  const [whatFor, setWhatFor] = useState('');
  const [letterType, setLetterType] = useState('job');
  const [formalityLevel, setFormalityLevel] = useState('professional');
  const [qualities, setQualities] = useState([]);
  const [anecdotes, setAnecdotes] = useState(['']);
  const [duration, setDuration] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');

  // Results
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [activeVersion, setActiveVersion] = useState('narrative');

  // Refinement
  const [refiningVersion, setRefiningVersion] = useState(null);
  const [refinementText, setRefinementText] = useState('');
  const [refinedVersions, setRefinedVersions] = useState({});
  const [refineLoading, setRefineLoading] = useState(false);

  // Sections
  const [showPlaceholders, setShowPlaceholders] = useState(true);
  const [showPowerPhrases, setShowPowerPhrases] = useState(false);
  const [showWritingTips, setShowWritingTips] = useState(false);

  useEffect(() => {
    if (results && resultsRef.current) {
      setTimeout(() => resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
    }
  }, [results]);

  // ══════════════════════════════════════════
  // HANDLERS
  // ══════════════════════════════════════════
  const toggleQuality = useCallback((val) => {
    setQualities(prev => prev.includes(val) ? prev.filter(q => q !== val) : [...prev, val]);
  }, []);

  const updateAnecdote = useCallback((idx, val) => {
    setAnecdotes(prev => prev.map((a, i) => i === idx ? val : a));
  }, []);

  const addAnecdote = useCallback(() => {
    if (anecdotes.length < 5) setAnecdotes(prev => [...prev, '']);
  }, [anecdotes.length]);

  const removeAnecdote = useCallback((idx) => {
    if (anecdotes.length > 1) setAnecdotes(prev => prev.filter((_, i) => i !== idx));
  }, [anecdotes.length]);

  const generate = useCallback(async () => {
    if (!recipientName.trim() || !yourRelationship.trim()) {
      setError('We need the person\'s name and your relationship to them'); return;
    }
    setError(''); setResults(null); setRefinedVersions({});
    setRefiningVersion(null); setActiveVersion('narrative');
    try {
      const data = await callToolEndpoint('ghost-writer', {
        recipientName: recipientName.trim(),
        yourRelationship: yourRelationship.trim(),
        whatTheyreApplyingFor: whatFor.trim() || null,
        letterType: LETTER_TYPES.find(t => t.value === letterType)?.label || letterType,
        qualities: qualities.length > 0 ? qualities : null,
        anecdotes: anecdotes.filter(a => a.trim()).length > 0 ? anecdotes.filter(a => a.trim()) : null,
        duration: duration.trim() || null,
        formalityLevel,
        additionalContext: additionalContext.trim() || null,
      });
      setResults(data);
      saveToHistory(data);
    } catch (err) { setError(err.message || 'Failed to generate letter.'); }
  }, [recipientName, yourRelationship, whatFor, letterType, qualities, anecdotes, duration, formalityLevel, additionalContext, callToolEndpoint]);

  const handleRefine = useCallback(async (version) => {
    if (!refinementText.trim()) return;
    setRefineLoading(true);
    try {
      const data = await callToolEndpoint('ghost-writer/refine', {
        letterText: version.letter,
        refinementRequest: refinementText.trim(),
        letterType, formalityLevel,
      });
      if (data.refined_letter) {
        setRefinedVersions(prev => ({ ...prev, [version.style]: data.refined_letter }));
      }
      setRefiningVersion(null); setRefinementText('');
    } catch (err) { setError(err.message || 'Failed to refine.'); }
    finally { setRefineLoading(false); }
  }, [refinementText, letterType, formalityLevel, callToolEndpoint]);

  const revertRefinement = useCallback((style) => {
    setRefinedVersions(prev => { const n = { ...prev }; delete n[style]; return n; });
  }, []);

  const handleReset = useCallback(() => {
    setRecipientName(''); setYourRelationship(''); setWhatFor('');
    setQualities([]); setAnecdotes(['']); setDuration('');
    setAdditionalContext(''); setResults(null); setError('');
    setRefinedVersions({}); setRefiningVersion(null);
  }, []);

  // ══════════════════════════════════════════
  // HISTORY
  // ══════════════════════════════════════════
  const saveToHistory = useCallback((data) => {
    const entry = {
      id: `gw_${Date.now()}`, date: new Date().toISOString(),
      preview: `Letter for ${recipientName}`,
      type: letterType, results: data,
    };
    setHistory(prev => [entry, ...prev].slice(0, 20));
  }, [recipientName, letterType, setHistory]);

  // ══════════════════════════════════════════
  // COPY
  // ══════════════════════════════════════════
  const buildLetterCopy = useCallback((version) => {
    const text = refinedVersions[version.style] || version.letter;
    return `${text}\n\n— Generated by DeftBrain · deftbrain.com`;
  }, [refinedVersions]);

  const buildAllCopy = useCallback(() => {
    if (!results?.versions) return '';
    const lines = ['✍️ Ghost Writer — Recommendation Letters', ''];
    results.versions.forEach(v => {
      const text = refinedVersions[v.style] || v.letter;
      lines.push(`══ ${v.label || v.style} ══`, text, '');
    });
    lines.push('— Generated by DeftBrain · deftbrain.com');
    return lines.join('\n');
  }, [results, refinedVersions]);

  // ══════════════════════════════════════════
  // RENDER HELPERS
  // ══════════════════════════════════════════
  const Pill = ({ active, onClick, children }) => (
    <button onClick={onClick}
      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${active ? c.pillActive : c.pillInactive}`}>
      {active && <span className="mr-1">✓</span>}{children}
    </button>
  );

  const Section = ({ title, emoji, open, onToggle, badge, children }) => (
    <div className={`${c.card} border rounded-xl overflow-hidden`}>
      <button onClick={onToggle} className="w-full flex items-center justify-between p-5 text-left hover:opacity-80">
        <div className="flex items-center gap-3">
          <span className="text-lg">{emoji}</span>
          <span className={`text-base font-semibold ${c.text}`}>{title}</span>
          {badge && <span className={`text-xs px-2 py-0.5 rounded-full ${c.badge}`}>{badge}</span>}
        </div>
        <span className={`text-xs ${c.textMut}`}>{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className={`px-5 pb-5 border-t ${c.divider}`}>{children}</div>}
    </div>
  );

  // ══════════════════════════════════════════
  // RENDER: Input
  // ══════════════════════════════════════════
  const renderInput = () => (
    <div className="space-y-4">
      <div className={`${c.card} border rounded-xl p-5 space-y-4`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={`text-xs font-bold ${c.textSec} uppercase tracking-wide mb-1 block`}>👤 Who is this for?</label>
            <input type="text" value={recipientName} onChange={e => setRecipientName(e.target.value)}
              placeholder="Their name" className={`w-full px-4 py-2.5 rounded-xl border text-sm ${c.inputBg} outline-none`} />
          </div>
          <div>
            <label className={`text-xs font-bold ${c.textSec} uppercase tracking-wide mb-1 block`}>🤝 Your relationship</label>
            <input type="text" value={yourRelationship} onChange={e => setYourRelationship(e.target.value)}
              placeholder="e.g., 'their manager for 2 years'" className={`w-full px-4 py-2.5 rounded-xl border text-sm ${c.inputBg} outline-none`} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={`text-xs font-bold ${c.textSec} uppercase tracking-wide mb-1 block`}>🎯 What they're applying for</label>
            <input type="text" value={whatFor} onChange={e => setWhatFor(e.target.value)}
              placeholder="e.g., 'Senior Product Manager at Google'" className={`w-full px-4 py-2.5 rounded-xl border text-sm ${c.inputBg} outline-none`} />
          </div>
          <div>
            <label className={`text-xs font-bold ${c.textSec} uppercase tracking-wide mb-1 block`}>⏱️ How long you've known them</label>
            <input type="text" value={duration} onChange={e => setDuration(e.target.value)}
              placeholder="e.g., '3 years'" className={`w-full px-4 py-2.5 rounded-xl border text-sm ${c.inputBg} outline-none`} />
          </div>
        </div>
      </div>

      {/* Letter type */}
      <div className={`${c.card} border rounded-xl p-5`}>
        <label className={`text-xs font-bold ${c.textSec} uppercase tracking-wide mb-2 block`}>📄 Letter type</label>
        <div className="flex flex-wrap gap-1.5">
          {LETTER_TYPES.map(opt => (
            <Pill key={opt.value} active={letterType === opt.value} onClick={() => setLetterType(opt.value)}>{opt.label}</Pill>
          ))}
        </div>
        <label className={`text-xs font-bold ${c.textSec} uppercase tracking-wide mt-4 mb-2 block`}>📏 Formality</label>
        <div className="flex flex-wrap gap-1.5">
          {FORMALITY_OPTIONS.map(opt => (
            <Pill key={opt.value} active={formalityLevel === opt.value} onClick={() => setFormalityLevel(opt.value)}>{opt.label}</Pill>
          ))}
        </div>
      </div>

      {/* Qualities */}
      <div className={`${c.card} border rounded-xl p-5`}>
        <label className={`text-xs font-bold ${c.textSec} uppercase tracking-wide mb-1 block`}>⭐ Qualities to highlight</label>
        <p className={`text-xs ${c.textMut} mb-2`}>Select the traits that stand out about this person</p>
        <div className="flex flex-wrap gap-1.5">
          {QUALITY_OPTIONS.map(q => (
            <Pill key={q} active={qualities.includes(q)} onClick={() => toggleQuality(q)}>{q}</Pill>
          ))}
        </div>
      </div>

      {/* Anecdotes */}
      <div className={`${c.card} border rounded-xl p-5`}>
        <label className={`text-xs font-bold ${c.textSec} uppercase tracking-wide mb-1 block`}>📝 Specific examples or stories</label>
        <p className={`text-xs ${c.textMut} mb-3`}>Even rough bullet points work — we'll turn them into compelling mini-stories</p>
        <div className="space-y-2">
          {anecdotes.map((a, idx) => (
            <div key={idx} className="flex gap-2">
              <input type="text" value={a} onChange={e => updateAnecdote(idx, e.target.value)}
                placeholder={`e.g., "${idx === 0 ? 'Led the Q3 product launch that exceeded targets by 20%' : 'Mentored two junior team members who both got promoted'}"`}
                className={`flex-1 px-4 py-2.5 rounded-xl border text-sm ${c.inputBg} outline-none`} />
              {anecdotes.length > 1 && (
                <button onClick={() => removeAnecdote(idx)} className={`px-3 rounded-lg text-xs ${c.btnGhost} hover:text-red-500`}>✕</button>
              )}
            </div>
          ))}
        </div>
        {anecdotes.length < 5 && (
          <button onClick={addAnecdote} className={`mt-2 text-xs font-semibold ${c.linkStyle}`}>➕ Add another</button>
        )}
      </div>

      {/* Context */}
      <div className={`${c.card} border rounded-xl p-5`}>
        <label className={`text-xs font-bold ${c.textSec} uppercase tracking-wide mb-1 block`}>💬 Anything else?</label>
        <input type="text" value={additionalContext} onChange={e => setAdditionalContext(e.target.value)}
          placeholder="e.g., 'They're career-switching from marketing to product management'"
          className={`w-full px-4 py-2.5 rounded-xl border text-sm ${c.inputBg} outline-none`} />
      </div>

      <button onClick={generate}
        disabled={loading || !recipientName.trim() || !yourRelationship.trim()}
        className={`w-full py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
          loading || !recipientName.trim() || !yourRelationship.trim() ? c.btnDis : c.btn
        }`}>
        {loading ? <><span className="animate-spin inline-block">⏳</span> Writing your letter...</>
          : <><span>✍️</span> Generate Letter</>}
      </button>
    </div>
  );

  // ══════════════════════════════════════════
  // RENDER: Results
  // ══════════════════════════════════════════
  const renderResults = () => {
    if (!results?.versions?.length) return null;

    return (
      <div ref={resultsRef} className="space-y-4 mt-4">
        {/* Version tabs */}
        <div className={`${c.card} border rounded-xl overflow-hidden`}>
          <div className={`flex border-b ${c.divider}`}>
            {results.versions.map(v => (
              <button key={v.style} onClick={() => setActiveVersion(v.style)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-semibold transition-all ${
                  activeVersion === v.style ? c.tabActive : c.tabInactive
                }`}>
                <span>{VERSION_ICONS[v.style] || '📝'}</span>
                <span className="hidden sm:inline">{v.label?.split('—')[0]?.trim() || v.style}</span>
                <span className="sm:hidden capitalize">{v.style}</span>
              </button>
            ))}
          </div>

          {results.versions.map(v => {
            if (v.style !== activeVersion) return null;
            const displayText = refinedVersions[v.style] || v.letter;
            const isRefined = !!refinedVersions[v.style];

            return (
              <div key={v.style} className="p-6 space-y-4">
                {/* Best for + word count */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  {v.best_for && <span className={`text-sm ${c.textMut}`}>💡 {v.best_for}</span>}
                  {v.word_count && <span className={`text-xs px-2 py-0.5 rounded-full ${c.badge}`}>{v.word_count} words</span>}
                </div>

                {/* Strengths */}
                {v.strengths?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {v.strengths.map((s, i) => (
                      <span key={i} className={`text-xs px-2.5 py-1 rounded-full ${c.badge}`}>{s}</span>
                    ))}
                  </div>
                )}

                {/* The letter */}
                <div className={`p-5 rounded-xl border ${c.letterBg}`}>
                  {isRefined && (
                    <div className={`text-xs font-medium mb-2 flex items-center gap-1 ${c.tipText}`}>
                      <span>✏️</span> Refined version
                      <button onClick={() => revertRefinement(v.style)} className="ml-2 underline hover:no-underline">Revert</button>
                    </div>
                  )}
                  <p className={`text-sm leading-relaxed whitespace-pre-wrap ${c.text}`}>{displayText}</p>
                </div>

                {/* Customize prompts */}
                {v.customize_prompts?.length > 0 && (
                  <div className={`p-4 rounded-xl border ${c.placeholderBg}`}>
                    <p className={`text-xs font-bold ${c.placeholderText} mb-2`}>✏️ Personalize these parts</p>
                    {v.customize_prompts.map((prompt, i) => (
                      <p key={i} className={`text-xs ${c.placeholderText} mb-1`}>• {prompt}</p>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                  <CopyBtn content={buildLetterCopy(v)} label="Copy Letter" />
                  <button onClick={() => { setRefiningVersion(refiningVersion === v.style ? null : v.style); setRefinementText(''); }}
                    className={`${c.btnOutline} px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2`}>
                    <span>✏️</span> Refine
                  </button>
                </div>

                {/* Refinement input */}
                {refiningVersion === v.style && (
                  <div className={`${c.cardAlt} border rounded-xl p-4 space-y-3`}>
                    <label className={`text-sm font-semibold ${c.label}`}>How should I adjust this?</label>
                    <textarea value={refinementText} onChange={e => setRefinementText(e.target.value)}
                      placeholder='e.g., "Make it shorter", "Add the client presentation story", "Sound warmer"'
                      className={`w-full p-3 border rounded-lg ${c.inputBg} outline-none focus:ring-2 resize-none text-sm`} rows={2} />
                    <div className="flex gap-2">
                      <button onClick={() => handleRefine(v)}
                        disabled={refineLoading || !refinementText.trim()}
                        className={`${refineLoading || !refinementText.trim() ? c.btnDis : c.btn} px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2`}>
                        {refineLoading ? <span className="animate-spin inline-block">⏳</span> : <span>✨</span>} Refine
                      </button>
                      <button onClick={() => { setRefiningVersion(null); setRefinementText(''); }}
                        className={`${c.btnSec} px-4 py-2 rounded-lg text-sm`}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Placeholders */}
        {results.placeholders_to_fill?.length > 0 && (
          <Section title="Fill In These Details" emoji="📝" open={showPlaceholders}
            onToggle={() => setShowPlaceholders(!showPlaceholders)} badge={`${results.placeholders_to_fill.length} items`}>
            <div className="space-y-2 mt-4">
              {results.placeholders_to_fill.map((p, idx) => (
                <div key={idx} className={`p-3 rounded-lg ${c.inset} flex items-start gap-3`}>
                  <code className={`text-xs font-mono px-1.5 py-0.5 rounded ${c.badge} flex-shrink-0`}>{p.placeholder}</code>
                  <span className={`text-xs ${c.textSec}`}>→ {p.suggestion}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Power Phrases */}
        {results.power_phrases?.length > 0 && (
          <Section title="Power Phrases" emoji="💪" open={showPowerPhrases}
            onToggle={() => setShowPowerPhrases(!showPowerPhrases)}>
            <div className="space-y-2 mt-4">
              {results.power_phrases.map((phrase, idx) => (
                <div key={idx} className={`p-3 rounded-lg border ${c.powerBg}`}>
                  <p className={`text-sm ${c.powerText} italic`}>"{phrase}"</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Writing Tips */}
        {results.writing_tips?.length > 0 && (
          <Section title="Writing Tips" emoji="💡" open={showWritingTips}
            onToggle={() => setShowWritingTips(!showWritingTips)}>
            <div className="space-y-2 mt-4">
              {results.writing_tips.map((tip, idx) => (
                <p key={idx} className={`text-sm ${c.textSec}`}>• {tip}</p>
              ))}
            </div>
          </Section>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <div className="flex-1"><CopyBtn content={buildAllCopy()} label="Copy All Versions" /></div>
          <button onClick={handleReset}
            className={`flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 ${c.btn}`}>
            <span>🔄</span> New Letter
          </button>
        </div>

        {/* Cross-references */}
        <div className={`p-4 rounded-2xl border ${c.card}`}>
          <p className={`text-xs font-bold ${c.textMut} uppercase tracking-wide mb-2`}>🔗 Related Tools</p>
          <div className={`space-y-1.5 text-xs ${c.textSec}`}>
            <p>Writing a tough message instead? <a href="/VelvetHammer" target="_blank" rel="noopener noreferrer" className={c.linkStyle}>Velvet Hammer</a> transforms angry drafts into professional messages.</p>
            <p>Need to craft a social caption about your team? <a href="/CaptionMagic" target="_blank" rel="noopener noreferrer" className={c.linkStyle}>Caption Magic</a> generates authentic social media captions.</p>
          </div>
        </div>
      </div>
    );
  };

  // History
  const renderHistory = () => {
    if (history.length === 0) return null;
    const formatDate = (iso) => {
      try { const d = new Date(iso); const diff = Math.floor((new Date() - d) / 86400000); return diff === 0 ? 'Today' : diff === 1 ? 'Yesterday' : diff < 7 ? `${diff}d ago` : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); } catch { return ''; }
    };
    return (
      <div className={`mt-6 p-4 rounded-2xl border ${c.histBg}`}>
        <button onClick={() => setShowHistory(!showHistory)} className="w-full flex items-center gap-2 text-left">
          <span className={`text-base ${c.histAccent}`}>✍️</span>
          <span className={`text-sm font-bold ${c.text} flex-1`}>Past Letters</span>
          <span className={`text-xs ${c.textMut}`}>{history.length}</span>
          <span className={`text-xs ${c.textMut}`}>{showHistory ? '▲' : '▼'}</span>
        </button>
        {showHistory && (
          <div className="mt-3 space-y-2">
            {history.map(entry => (
              <div key={entry.id} className={`rounded-xl border ${c.histCard} p-3 flex items-center gap-3`}>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-semibold ${c.text} truncate`}>{entry.preview}</div>
                  <div className={`text-xs ${c.textMut} mt-0.5`}>{formatDate(entry.date)} · {entry.type}</div>
                </div>
                <button onClick={() => { setResults(entry.results); setShowHistory(false); setRefinedVersions({}); setActiveVersion('narrative'); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold ${c.btnSec}`}>View</button>
                <button onClick={() => setHistory(prev => prev.filter(h => h.id !== entry.id))}
                  className={`px-2 py-1.5 rounded-lg text-xs ${c.btnGhost} hover:text-red-500`}>🗑️</button>
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
          <h2 className={`text-2xl font-bold ${c.heading}`}>Ghost Writer <span className="text-xl">✍️</span></h2>
          <p className={`text-sm ${c.textMut}`}>Turn rough notes into polished recommendation letters in seconds</p>
        </div>
      </div>
      {!results && renderInput()}
      {results && renderResults()}
      {error && (
        <div className={`mt-4 p-4 ${c.errBg} border rounded-xl flex items-start gap-3`}>
          <span className={`text-base ${c.errText}`}>⚠️</span>
          <p className={`text-sm ${c.errText}`}>{error}</p>
        </div>
      )}
      {renderHistory()}
    </div>
  );
};

GhostWriter.displayName = 'GhostWriter';
export default GhostWriter;
