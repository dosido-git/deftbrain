import React, { useState, useRef } from 'react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';
import { usePersistentState } from '../hooks/usePersistentState';
import { getToolById } from '../data/tools';
import { CopyBtn } from '../components/ActionButtons';

const PlainTalk = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { callToolEndpoint, loading } = useClaudeAPI();
  const toolData = getToolById('PlainTalk');
  const fileInputRef = useRef(null);

  // Input state
  const [inputMethod, setInputMethod] = useState('text');
  const [text, setText] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileBase64, setFileBase64] = useState(null);
  const [textType, setTextType] = useState('auto');
  const [context, setContext] = useState('');
  const [readingLevel, setReadingLevel] = useState('auto');

  // Results state
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [fontSize, setFontSize] = useState('base');
  const [expandedSections, setExpandedSections] = useState({});

  // Persisted state
  const [analysisHistory, setAnalysisHistory] = usePersistentState('pt-history', []);
  const [hasVisited, setHasVisited] = usePersistentState('pt-visited', false);
  const [dismissedHints, setDismissedHints] = usePersistentState('pt-hints', {});
  const [showHistory, setShowHistory] = useState(false);

  // Theme colors — follows LeaseTrapDetector pattern
  const c = {
    card: isDark ? 'bg-zinc-800' : 'bg-white',
    cardAlt: isDark ? 'bg-zinc-700/50' : 'bg-slate-50',
    text: isDark ? 'text-zinc-50' : 'text-gray-900',
    textSecondary: isDark ? 'text-zinc-300' : 'text-gray-600',
    textMuted: isDark ? 'text-zinc-500' : 'text-gray-400',
    input: isDark ? 'bg-zinc-700 border-zinc-600 text-zinc-100 placeholder-zinc-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400',
    btnPrimary: isDark ? 'bg-sky-600 hover:bg-sky-700 text-white' : 'bg-sky-600 hover:bg-sky-700 text-white',
    btnSecondary: isDark ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-100' : 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    accent: isDark ? 'text-sky-400' : 'text-sky-600',
    accentBg: isDark ? 'bg-sky-900/30' : 'bg-sky-50',
    accentBorder: isDark ? 'border-sky-700' : 'border-sky-200',
    border: isDark ? 'border-zinc-700' : 'border-gray-200',
  };

  const fontSizes = { small: 'text-sm', base: 'text-base', large: 'text-lg', xl: 'text-xl' };

  const textTypes = [
    { id: 'auto', label: 'Auto-detect', icon: '🔍' },
    { id: 'legal', label: 'Legal', icon: '⚖️' },
    { id: 'medical', label: 'Medical', icon: '🏥' },
    { id: 'academic', label: 'Academic', icon: '🎓' },
    { id: 'literary', label: 'Literary', icon: '📖' },
    { id: 'financial', label: 'Financial', icon: '💰' },
    { id: 'technical', label: 'Technical', icon: '🔧' },
    { id: 'government', label: 'Government', icon: '🏛️' },
    { id: 'business', label: 'Business', icon: '💼' },
    { id: 'persuasive', label: 'Persuasive', icon: '📢' },
  ];

  const importanceBadge = (imp) => {
    const map = {
      essential: { label: 'Essential', color: isDark ? 'bg-red-900/40 text-red-300 border-red-700' : 'bg-red-50 text-red-700 border-red-200' },
      important: { label: 'Important', color: isDark ? 'bg-amber-900/40 text-amber-300 border-amber-700' : 'bg-amber-50 text-amber-700 border-amber-200' },
      context: { label: 'Context', color: isDark ? 'bg-blue-900/40 text-blue-300 border-blue-700' : 'bg-blue-50 text-blue-700 border-blue-200' },
      boilerplate: { label: 'Boilerplate', color: isDark ? 'bg-zinc-700 text-zinc-400 border-zinc-600' : 'bg-gray-100 text-gray-500 border-gray-200' },
    };
    return map[imp] || map.context;
  };

  const strengthColor = (s) => {
    const map = {
      strong: isDark ? 'text-green-400' : 'text-green-600',
      moderate: isDark ? 'text-amber-400' : 'text-amber-600',
      weak: isDark ? 'text-orange-400' : 'text-orange-600',
      unsupported: isDark ? 'text-red-400' : 'text-red-600',
    };
    return map[s] || map.moderate;
  };

  const strengthBar = (s) => {
    const map = { strong: 'w-full bg-green-500', moderate: 'w-2/3 bg-amber-500', weak: 'w-1/3 bg-orange-500', unsupported: 'w-1/6 bg-red-500' };
    return map[s] || map.moderate;
  };

  const loadingMessages = {
    auto: 'Reading and analyzing...',
    legal: 'Analyzing the legal structure...',
    medical: 'Translating the medical language...',
    academic: 'Examining the research framework...',
    literary: 'Exploring the narrative architecture...',
    financial: 'Mapping the financial structure...',
    technical: 'Decoding the technical content...',
    government: 'Navigating the bureaucratic language...',
    business: 'Analyzing the business communication...',
    persuasive: 'Deconstructing the argument...',
    general: 'Reading and analyzing...',
  };

  const readingLevels = [
    { id: 'auto', label: 'Auto', desc: 'AI picks the best level' },
    { id: '5th', label: '5th grade', desc: 'Simple words, short sentences' },
    { id: '8th', label: '8th grade', desc: 'Clear everyday language' },
    { id: 'high_school', label: 'High school', desc: 'Standard plain English' },
    { id: 'professional', label: 'Professional', desc: 'Simplified but detailed' },
  ];

  // Handlers
  const toggleSection = (key) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !loading) {
      e.preventDefault();
      if (inputMethod === 'text' && text.trim().length >= 50) analyze();
      if (inputMethod === 'file' && fileBase64) analyze();
    }
  };

  const Hint = ({ id, children }) => {
    if (dismissedHints[id]) return null;
    return (
      <div className={`flex items-start gap-2 px-3 py-2 mt-2 rounded-lg text-xs ${isDark ? 'bg-sky-900/20 text-sky-300 border border-sky-800/40' : 'bg-sky-50 text-sky-700 border border-sky-100'}`}>
        <span className="flex-shrink-0 mt-0.5">💡</span>
        <span className="flex-1">{children}</span>
        <button onClick={() => setDismissedHints(prev => ({ ...prev, [id]: true }))} className="flex-shrink-0 opacity-50 hover:opacity-100 ml-1">✕</button>
      </div>
    );
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { setError('Please upload a PDF file'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('File too large. Maximum size is 10MB'); return; }
    setError('');
    const reader = new FileReader();
    reader.onerror = () => setError('Failed to read file');
    reader.onload = (event) => {
      setUploadedFile(file);
      setFileBase64(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const removeFile = () => {
    setUploadedFile(null);
    setFileBase64(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const analyze = async () => {
    if (inputMethod === 'text' && (!text || text.trim().length < 50)) {
      setError(text.trim().length > 0 ? 'PlainTalk works best with at least a few sentences. Try adding more text.' : 'Please enter some text to analyze');
      return;
    }
    if (inputMethod === 'file' && !fileBase64) { setError('Please upload a PDF file'); return; }

    setError('');
    setResults(null);
    setExpandedSections({});

    try {
      const data = await callToolEndpoint('plaintalk', {
        text: inputMethod === 'text' ? text.trim() : null,
        pdfBase64: inputMethod === 'file' ? fileBase64 : null,
        textType: textType === 'auto' ? null : textType,
        context: context.trim() || null,
        readingLevel: readingLevel === 'auto' ? null : readingLevel,
      });
      setResults(data);
      setActiveTab('overview');

      // Save to history
      setAnalysisHistory(prev => [{
        id: Date.now().toString(),
        type: data.detected_type_label || data.detected_type || 'Document',
        core: (data.the_core || '').slice(0, 100),
        date: new Date().toISOString(),
        inputMethod,
        textType,
      }, ...prev].slice(0, 20));
    } catch (err) {
      console.error('[PlainTalk] Error:', err);
      setError(err.message || 'Analysis failed. Please try again.');
    }
  };

  const reset = () => {
    setText('');
    setUploadedFile(null);
    setFileBase64(null);
    setTextType('auto');
    setContext('');
    setReadingLevel('auto');
    setResults(null);
    setError('');
    setExpandedSections({});
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Build full-text version for copy/print
  const buildFullText = () => {
    if (!results) return '';
    const lines = [];
    lines.push('PLAINTALK — DOCUMENT ANALYSIS');
    lines.push(`Type: ${results.detected_type_label || results.detected_type}`);
    if (results.reading_level) lines.push(`Reading Level: ${results.reading_level.original} → ${results.reading_level.translated}`);
    lines.push('');
    lines.push('═══ THE CORE ═══');
    lines.push(results.the_core);
    lines.push('');
    lines.push('═══ SUMMARY ═══');
    lines.push(results.summary);
    lines.push('');
    if (results.what_matters_most?.length > 0) {
      lines.push('═══ WHAT MATTERS MOST ═══');
      results.what_matters_most.forEach((item, i) => lines.push(`${i + 1}. ${item}`));
      lines.push('');
    }
    lines.push('═══ PLAIN-ENGLISH TRANSLATION ═══');
    lines.push(results.translation);
    lines.push('');
    if (results.structural_xray?.sections?.length > 0) {
      lines.push('═══ STRUCTURAL X-RAY ═══');
      if (results.structural_xray.architecture_summary) lines.push(results.structural_xray.architecture_summary);
      lines.push('');
      results.structural_xray.sections.forEach(s => {
        lines.push(`[${(s.importance || '').toUpperCase()}] ${s.title} (${s.original_location || ''})`);
        lines.push(`Purpose: ${s.purpose}`);
        lines.push(`Key Content: ${s.key_content}`);
        if (s.notes) lines.push(`Note: ${s.notes}`);
        lines.push('');
      });
    }
    if (results.obligations_and_commitments?.applicable) {
      lines.push('═══ OBLIGATIONS & COMMITMENTS ═══');
      if (results.obligations_and_commitments.yours?.length > 0) {
        lines.push('YOUR OBLIGATIONS:');
        results.obligations_and_commitments.yours.forEach(item => lines.push(`  • ${item}`));
      }
      if (results.obligations_and_commitments.theirs?.length > 0) {
        lines.push('THEIR OBLIGATIONS:');
        results.obligations_and_commitments.theirs.forEach(item => lines.push(`  • ${item}`));
      }
      if (results.obligations_and_commitments.asymmetry_notes) lines.push(`ASYMMETRY: ${results.obligations_and_commitments.asymmetry_notes}`);
      if (results.obligations_and_commitments.deadlines?.length > 0) {
        lines.push('DEADLINES:');
        results.obligations_and_commitments.deadlines.forEach(d => lines.push(`  • ${d}`));
      }
      lines.push('');
    }
    if (results.internal_contradictions?.length > 0) {
      lines.push('═══ INTERNAL CONTRADICTIONS ═══');
      results.internal_contradictions.forEach(con => {
        lines.push(`${con.section_a}: ${con.says_a}`);
        lines.push(`${con.section_b}: ${con.says_b}`);
        lines.push(`Implication: ${con.implication}`);
        lines.push('');
      });
    }
    if (results.glossary?.length > 0) {
      lines.push('═══ GLOSSARY ═══');
      results.glossary.forEach(g => lines.push(`${g.term}: ${g.definition}${g.context ? ` (${g.context})` : ''}`));
      lines.push('');
    }
    lines.push('───');
    lines.push('PlainTalk provides comprehension assistance. For domain-specific legal, medical, or financial advice, consult a qualified professional.');
    lines.push('\n— Generated by DeftBrain · deftbrain.com');
    return lines.join('\n');
  };

  const handlePrint = () => {
    const content = buildFullText();
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html><html><head><title>PlainTalk Analysis — ${results?.detected_type_label || 'Document'}</title><style>
      body { font-family: Georgia, 'Times New Roman', serif; max-width: 700px; margin: 40px auto; padding: 0 20px; color: #1a1a1a; line-height: 1.6; font-size: 14px; }
      pre { white-space: pre-wrap; word-wrap: break-word; font-family: inherit; margin: 0; }
      .branding { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc; text-align: center; font-size: 12px; color: #888; }
      @media print { body { margin: 20px; } }
    </style></head><body><pre>${content.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre><div class="branding">Generated by DeftBrain · deftbrain.com</div></body></html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 250);
  };

  // ─── RENDER ───
  return (
    <div>

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className={`text-2xl font-bold ${c.text}`}>{toolData?.title || 'PlainTalk — Document Analyst'} {toolData?.icon || '🔍'}</h2>
          <p className={`text-sm ${c.textMuted}`}>{toolData?.tagline || 'See through any text — plain language plus structural X-ray'}</p>
        </div>
        {analysisHistory.length > 0 && !results && (
          <button onClick={() => setShowHistory(!showHistory)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${isDark ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-100' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
            <span>📁</span> History ({analysisHistory.length})
          </button>
        )}
      </div>

      {/* ═══════════════ INPUT VIEW ═══════════════ */}
      {!results && (
        <div className="space-y-6">

          {/* First-visit welcome */}
          {!hasVisited && (
            <div className={`${c.card} border ${c.border} rounded-xl shadow-lg p-5 sm:p-6`}>
              <h3 className={`text-lg font-bold ${c.text} mb-2`}>See through any text 🔍</h3>
              <p className={`text-sm ${c.textSecondary} mb-4`}>Paste complex text or upload a PDF — get a plain-English translation plus a structural X-ray.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                {[
                  { emoji: '📖', title: 'Plain-English translation', desc: 'Every sentence simplified, nothing lost' },
                  { emoji: '🏗️', title: 'Structural X-ray', desc: 'See how the text is built and what each part does' },
                  { emoji: '⚖️', title: 'Obligations & rights', desc: 'Who owes what, deadlines, asymmetries' },
                  { emoji: '📝', title: 'Glossary + key terms', desc: 'Jargon defined in context' },
                ].map((f, i) => (
                  <div key={i} className={`flex items-start gap-2 p-2.5 rounded-xl ${c.cardAlt}`}>
                    <span className="text-lg">{f.emoji}</span>
                    <div>
                      <p className={`text-sm font-bold ${c.text}`}>{f.title}</p>
                      <p className={`text-xs ${c.textMuted}`}>{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => setHasVisited(true)} className={`text-xs font-bold ${c.accent}`}>Got it — let me paste something →</button>
            </div>
          )}

          {/* Analysis History */}
          {showHistory && analysisHistory.length > 0 && (
            <div className={`${c.card} border ${c.border} rounded-xl shadow-lg p-5`}>
              <h4 className={`text-sm font-bold ${c.text} mb-3`}>📁 Past Analyses</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {analysisHistory.map(h => (
                  <div key={h.id} className={`flex items-center gap-3 p-3 rounded-xl ${c.cardAlt}`}>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold truncate ${c.text}`}>{h.type}</p>
                      <p className={`text-xs ${c.textMuted} truncate`}>{new Date(h.date).toLocaleDateString()} · {h.core}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isDark ? 'bg-sky-900/40 text-sky-300' : 'bg-sky-100 text-sky-700'}`}>{h.inputMethod === 'file' ? 'PDF' : 'Text'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Input Method Toggle */}
          <div className={`${c.card} rounded-xl shadow-lg p-6`}>
            <h3 className={`font-bold ${c.text} mb-4`}>What would you like to analyze?</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => { setInputMethod('text'); setUploadedFile(null); setFileBase64(null); }}
                className={`p-6 rounded-xl border-2 transition-all ${
                  inputMethod === 'text'
                    ? `border-sky-500 ${isDark ? 'bg-sky-900/20' : 'bg-sky-50'}`
                    : `${isDark ? 'border-zinc-600' : 'border-gray-200'}`
                }`}
              >
                <span className="text-3xl block mx-auto mb-3">📄</span>
                <p className={`font-semibold ${c.text}`}>Paste Text</p>
                <p className={`text-sm ${c.textMuted} mt-1`}>Paste any text directly</p>
              </button>
              <button
                onClick={() => { setInputMethod('file'); setText(''); }}
                className={`p-6 rounded-xl border-2 transition-all ${
                  inputMethod === 'file'
                    ? `border-sky-500 ${isDark ? 'bg-sky-900/20' : 'bg-sky-50'}`
                    : `${isDark ? 'border-zinc-600' : 'border-gray-200'}`
                }`}
              >
                <span className="text-3xl block mx-auto mb-3">📤</span>
                <p className={`font-semibold ${c.text}`}>Upload PDF</p>
                <p className={`text-sm ${c.textMuted} mt-1`}>Upload a PDF document</p>
              </button>
            </div>
          </div>

          {/* Text/File Input */}
          <div className={`${c.card} rounded-xl shadow-lg p-6`}>
            {inputMethod === 'text' ? (
              <>
                <label className={`block font-semibold ${c.text} mb-2`}>Paste your text</label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste anything — a contract clause, a chapter of a novel, a research abstract, an insurance policy, a political speech, a technical manual, a medical form..."
                  rows={12}
                  className={`w-full p-4 border rounded-xl outline-none text-sm resize-y focus:ring-2 focus:ring-sky-300 ${c.input}`}
                />
                <p className={`text-xs ${c.textMuted} mt-2`}>{text.length} characters {text.length > 0 && text.length < 50 ? '· Add more text for a thorough analysis' : ''}</p>
              </>
            ) : (
              <>
                <label className={`block font-semibold ${c.text} mb-2`}>Upload PDF</label>
                {!uploadedFile ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                      isDark ? 'border-zinc-600 hover:border-sky-500 hover:bg-zinc-700/50' : 'border-gray-300 hover:border-sky-400 hover:bg-sky-50'
                    }`}
                  >
                    <span className="text-4xl block mx-auto mb-3">📤</span>
                    <p className={`font-medium ${c.text} mb-1`}>Click to upload or drag and drop</p>
                    <p className={`text-sm ${c.textMuted}`}>PDF files only, max 10MB</p>
                  </div>
                ) : (
                  <div className={`flex items-center justify-between p-4 rounded-xl border ${isDark ? 'bg-zinc-700 border-zinc-600' : 'bg-green-50 border-green-200'}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📄</span>
                      <div>
                        <p className={`font-semibold ${c.text}`}>{uploadedFile.name}</p>
                        <p className={`text-xs ${c.textMuted}`}>{(uploadedFile.size / 1024).toFixed(1)} KB — Ready for analysis</p>
                      </div>
                    </div>
                    <button onClick={removeFile} className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                      <span>❌</span>
                    </button>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="application/pdf" onChange={handleFileUpload} className="hidden" />
              </>
            )}
          </div>

          {/* Options: Text Type + Context */}
          <div className={`${c.card} rounded-xl shadow-lg p-6 space-y-4`}>
            <div>
              <label className={`block font-semibold ${c.text} mb-3`}>Text type <span className={`text-xs font-normal ${c.textMuted}`}>(optional — PlainTalk can auto-detect)</span></label>
              <div className="flex flex-wrap gap-2">
                {textTypes.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTextType(t.id)}
                    className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                      textType === t.id
                        ? `border-sky-500 ${isDark ? 'bg-sky-900/30 text-sky-300' : 'bg-sky-50 text-sky-700'}`
                        : `${isDark ? 'border-zinc-600 text-zinc-300 hover:border-zinc-500' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`
                    }`}
                  >
                    <span className="mr-1.5">{t.icon}</span>{t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={`block font-semibold ${c.text} mb-2`}>What do you want to understand? <span className={`text-xs font-normal ${c.textMuted}`}>(optional)</span></label>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g., 'What am I actually agreeing to?', 'What's the main argument?', 'I need to understand the symbolism', 'What are my obligations?'"
                rows={2}
                className={`w-full p-3 border rounded-xl outline-none text-sm resize-y focus:ring-2 focus:ring-sky-300 ${c.input}`}
              />
            </div>

            {/* Reading Level Selector */}
            <div>
              <label className={`block font-semibold ${c.text} mb-2`}>Simplify to <span className={`text-xs font-normal ${c.textMuted}`}>(reading level)</span></label>
              <div className="flex flex-wrap gap-2">
                {readingLevels.map(rl => (
                  <button key={rl.id} onClick={() => setReadingLevel(rl.id)}
                    className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                      readingLevel === rl.id
                        ? `border-sky-500 ${isDark ? 'bg-sky-900/30 text-sky-300' : 'bg-sky-50 text-sky-700'}`
                        : `${isDark ? 'border-zinc-600 text-zinc-300 hover:border-zinc-500' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`
                    }`}>
                    {rl.label}
                  </button>
                ))}
              </div>
              <Hint id="readingLevel">Controls how simple the translation is. 5th grade uses the simplest words; Professional keeps more nuance.</Hint>
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={analyze}
            disabled={loading}
            className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2 shadow-lg ${
              loading ? (isDark ? 'bg-zinc-700 text-zinc-400' : 'bg-gray-200 text-gray-400') : c.btnPrimary
            }`}
          >
            {loading ? (
              <><span className="animate-spin inline-block">⏳</span> {loadingMessages[textType] || loadingMessages.auto}</>
            ) : (
              <><span>🔍</span> Analyze This Text</>
            )}
          </button>

          {error && (
            <div className={`p-4 rounded-xl flex items-start gap-3 ${isDark ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
              <span className="flex-shrink-0 mt-0.5">⚠️</span>
              <p className={`text-sm ${isDark ? 'text-red-300' : 'text-red-800'}`}>{error}</p>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════ RESULTS VIEW ═══════════════ */}
      {results && (
        <div className="space-y-6">

          {/* Controls Bar */}
          <div className={`${c.card} rounded-xl shadow-lg p-4`}>
            <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
              <div className="flex gap-2 flex-wrap">
                {[
                  { id: 'overview', label: 'Overview', icon: '👁️' },
                  { id: 'translation', label: 'Translation', icon: '📖' },
                  { id: 'xray', label: 'X-Ray', icon: '🏗️' },
                  { id: 'sidebyside', label: 'Side-by-Side', icon: '📊' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'bg-sky-600 text-white'
                        : (isDark ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')
                    }`}
                  >
                    <span>{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={fontSize}
                  onChange={(e) => setFontSize(e.target.value)}
                  className={`px-2 py-1.5 border rounded-lg text-xs ${c.input}`}
                  aria-label="Text size"
                >
                  <option value="small">Small</option>
                  <option value="base">Medium</option>
                  <option value="large">Large</option>
                  <option value="xl">X-Large</option>
                </select>
                <CopyBtn content={buildFullText()} label="Copy All" />
                <button
                  onClick={handlePrint}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${c.btnSecondary}`}
                  aria-label="Print or save as PDF"
                >
                  <span>🖨️</span> Print
                </button>
                <button onClick={reset} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${isDark ? 'bg-sky-900/40 text-sky-300 hover:bg-sky-800/50' : 'bg-sky-100 text-sky-700 hover:bg-sky-200'}`}>
                  <span>🔄</span> Analyze Another Text
                </button>
              </div>
            </div>

            {/* Type Badge + Core */}
            <div className={`p-4 rounded-xl ${isDark ? 'bg-sky-900/20 border border-sky-800' : 'bg-sky-50 border border-sky-200'}`}>
              <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${isDark ? 'bg-sky-800/50 text-sky-300' : 'bg-sky-100 text-sky-700'}`}>
                  {results.detected_type_label || results.detected_type}
                </span>
                {results.reading_level && (
                  <span className={`text-xs ${c.textMuted}`}>
                    📖 {results.reading_level.original} → {results.reading_level.translated}
                  </span>
                )}
              </div>
              <p className={`font-semibold ${c.text} leading-relaxed`}>{results.the_core}</p>
            </div>
          </div>

          {/* ─── TAB: OVERVIEW ─── */}
          {activeTab === 'overview' && (
            <div className="space-y-6">

              {/* Summary */}
              <div className={`${c.card} rounded-xl shadow-lg p-6`}>
                <h3 className={`font-bold ${c.text} mb-3 flex items-center gap-2`}>
                  <span>📖</span> Summary
                </h3>
                <p className={`${c.textSecondary} leading-relaxed`}>{results.summary}</p>
              </div>

              {/* What Matters Most */}
              {results.what_matters_most && results.what_matters_most.length > 0 && (
                <div className={`${c.card} rounded-xl shadow-lg p-6`}>
                  <h3 className={`font-bold ${c.text} mb-4 flex items-center gap-2`}>
                    <span>⚡</span> What Matters Most
                  </h3>
                  <div className="space-y-3">
                    {results.what_matters_most.map((item, idx) => (
                      <div key={idx} className={`flex items-start gap-3 p-3 rounded-lg ${idx === 0 ? (isDark ? 'bg-amber-900/20 border border-amber-800' : 'bg-amber-50 border border-amber-200') : c.cardAlt}`}>
                        <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                          idx === 0
                            ? (isDark ? 'bg-amber-600 text-white' : 'bg-amber-500 text-white')
                            : (isDark ? 'bg-zinc-600 text-zinc-300' : 'bg-gray-200 text-gray-600')
                        }`}>{idx + 1}</span>
                        <p className={`text-sm ${c.text} leading-relaxed pt-0.5`}>{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Obligations & Commitments */}
              {results.obligations_and_commitments?.applicable && (
                <div className={`${c.card} rounded-xl shadow-lg p-6`}>
                  <h3 className={`font-bold ${c.text} mb-4 flex items-center gap-2`}>
                    <span>⚖️</span> Obligations & Commitments
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Yours */}
                    {results.obligations_and_commitments.yours?.length > 0 && (
                      <div className={`p-4 rounded-xl border ${isDark ? 'bg-orange-900/15 border-orange-800' : 'bg-orange-50 border-orange-200'}`}>
                        <p className={`text-xs font-bold uppercase tracking-wide mb-3 ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>Your Obligations</p>
                        <ul className="space-y-2">
                          {results.obligations_and_commitments.yours.map((item, i) => (
                            <li key={i} className={`text-sm ${c.textSecondary} flex items-start gap-2`}>
                              <span className={`mt-1 flex-shrink-0 ${isDark ? 'text-orange-400' : 'text-orange-500'}`}>•</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Theirs */}
                    {results.obligations_and_commitments.theirs?.length > 0 && (
                      <div className={`p-4 rounded-xl border ${isDark ? 'bg-green-900/15 border-green-800' : 'bg-green-50 border-green-200'}`}>
                        <p className={`text-xs font-bold uppercase tracking-wide mb-3 ${isDark ? 'text-green-400' : 'text-green-600'}`}>Their Obligations</p>
                        <ul className="space-y-2">
                          {results.obligations_and_commitments.theirs.map((item, i) => (
                            <li key={i} className={`text-sm ${c.textSecondary} flex items-start gap-2`}>
                              <span className={`mt-1 flex-shrink-0 ${isDark ? 'text-green-400' : 'text-green-500'}`}>•</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Asymmetry Note */}
                  {results.obligations_and_commitments.asymmetry_notes && (
                    <div className={`p-3 rounded-lg mb-4 ${isDark ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
                      <p className={`text-xs font-bold mb-1 ${isDark ? 'text-red-400' : 'text-red-600'}`}>⚖️ ASYMMETRY NOTE</p>
                      <p className={`text-sm ${c.textSecondary}`}>{results.obligations_and_commitments.asymmetry_notes}</p>
                    </div>
                  )}

                  {/* Decisions + Deadlines */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {results.obligations_and_commitments.decisions_required?.length > 0 && (
                      <div className={`p-4 rounded-lg ${c.cardAlt}`}>
                        <p className={`text-xs font-bold ${c.textMuted} uppercase tracking-wide mb-2`}>Decisions Required</p>
                        {results.obligations_and_commitments.decisions_required.map((d, i) => (
                          <div key={i} className="flex items-start gap-2 mb-2">
                            <input type="checkbox" className={`mt-1 w-4 h-4 rounded ${isDark ? 'accent-sky-500' : 'accent-sky-600'}`} readOnly />
                            <span className={`text-sm ${c.textSecondary}`}>{d}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {results.obligations_and_commitments.deadlines?.length > 0 && (
                      <div className={`p-4 rounded-lg ${c.cardAlt}`}>
                        <p className={`text-xs font-bold ${c.textMuted} uppercase tracking-wide mb-2`}>🕐 Deadlines & Timeframes</p>
                        {results.obligations_and_commitments.deadlines.map((d, i) => (
                          <p key={i} className={`text-sm ${c.textSecondary} mb-1`}>• {d}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Narrative Analysis */}
              {results.narrative_analysis?.applicable && (
                <div className={`${c.card} rounded-xl shadow-lg p-6`}>
                  <h3 className={`font-bold ${c.text} mb-4 flex items-center gap-2`}>
                    <span>✨</span> Narrative Analysis
                  </h3>

                  {/* Themes */}
                  {results.narrative_analysis.themes?.length > 0 && (
                    <div className="mb-4">
                      <p className={`text-xs font-bold ${c.textMuted} uppercase tracking-wide mb-2`}>Themes</p>
                      <div className="flex flex-wrap gap-2">
                        {results.narrative_analysis.themes.map((t, i) => (
                          <span key={i} className={`px-3 py-1 rounded-full text-sm font-medium ${isDark ? 'bg-purple-900/30 text-purple-300 border border-purple-700' : 'bg-purple-50 text-purple-700 border border-purple-200'}`}>{t}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Techniques */}
                  {results.narrative_analysis.techniques?.length > 0 && (
                    <div className="mb-4">
                      <p className={`text-xs font-bold ${c.textMuted} uppercase tracking-wide mb-2`}>Techniques</p>
                      <div className="space-y-2">
                        {results.narrative_analysis.techniques.map((t, i) => (
                          <div key={i} className={`p-3 rounded-lg ${c.cardAlt}`}>
                            <p className={`text-sm font-semibold ${c.text} mb-1`}>{t.technique}</p>
                            <p className={`text-xs ${c.textMuted} italic mb-1`}>"{t.example}"</p>
                            <p className={`text-sm ${c.textSecondary}`}>{t.effect}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Subtext */}
                  {results.narrative_analysis.subtext?.length > 0 && (
                    <div className="mb-4">
                      <p className={`text-xs font-bold ${c.textMuted} uppercase tracking-wide mb-2`}>Subtext</p>
                      <div className="space-y-2">
                        {results.narrative_analysis.subtext.map((s, i) => (
                          <div key={i} className={`grid grid-cols-2 gap-2 rounded-lg overflow-hidden border ${c.border}`}>
                            <div className={`p-3 ${c.cardAlt}`}>
                              <p className={`text-xs font-bold ${c.textMuted} mb-1`}>ON THE SURFACE</p>
                              <p className={`text-sm ${c.textSecondary}`}>{s.surface}</p>
                            </div>
                            <div className={`p-3 ${isDark ? 'bg-purple-900/15' : 'bg-purple-50'}`}>
                              <p className={`text-xs font-bold ${isDark ? 'text-purple-400' : 'text-purple-600'} mb-1`}>UNDERNEATH</p>
                              <p className={`text-sm ${c.textSecondary}`}>{s.underneath}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Structural Purpose */}
                  {results.narrative_analysis.structural_purpose && (
                    <div className={`p-4 rounded-lg ${isDark ? 'bg-purple-900/15 border border-purple-800' : 'bg-purple-50 border border-purple-200'}`}>
                      <p className={`text-xs font-bold ${isDark ? 'text-purple-400' : 'text-purple-600'} mb-1`}>STRUCTURAL PURPOSE</p>
                      <p className={`text-sm ${c.textSecondary}`}>{results.narrative_analysis.structural_purpose}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Argument Analysis */}
              {results.argument_analysis?.applicable && (
                <div className={`${c.card} rounded-xl shadow-lg p-6`}>
                  <h3 className={`font-bold ${c.text} mb-4 flex items-center gap-2`}>
                    <span>💬</span> Argument Analysis
                  </h3>

                  {/* Core thesis */}
                  {results.argument_analysis.core_thesis && (
                    <div className={`p-4 rounded-lg mb-4 ${isDark ? 'bg-teal-900/15 border border-teal-800' : 'bg-teal-50 border border-teal-200'}`}>
                      <p className={`text-xs font-bold ${isDark ? 'text-teal-400' : 'text-teal-600'} mb-1`}>CORE THESIS</p>
                      <p className={`text-sm font-semibold ${c.text}`}>{results.argument_analysis.core_thesis}</p>
                    </div>
                  )}

                  {/* Evidence Quality */}
                  {results.argument_analysis.evidence_quality?.length > 0 && (
                    <div className="mb-4">
                      <p className={`text-xs font-bold ${c.textMuted} uppercase tracking-wide mb-2`}>Evidence Strength</p>
                      <div className="space-y-3">
                        {results.argument_analysis.evidence_quality.map((eq, i) => (
                          <div key={i} className={`p-3 rounded-lg ${c.cardAlt}`}>
                            <p className={`text-sm font-semibold ${c.text} mb-1`}>{eq.claim}</p>
                            <p className={`text-xs ${c.textSecondary} mb-2`}>{eq.evidence}</p>
                            <div className="flex items-center gap-2">
                              <div className={`h-2 rounded-full ${isDark ? 'bg-zinc-600' : 'bg-gray-200'} flex-1`}>
                                <div className={`h-2 rounded-full ${strengthBar(eq.strength)}`} />
                              </div>
                              <span className={`text-xs font-bold uppercase ${strengthColor(eq.strength)}`}>{eq.strength}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Hidden Assumptions */}
                  {results.argument_analysis.hidden_assumptions?.length > 0 && (
                    <div className="mb-4">
                      <p className={`text-xs font-bold ${c.textMuted} uppercase tracking-wide mb-2`}>Hidden Assumptions</p>
                      {results.argument_analysis.hidden_assumptions.map((a, i) => (
                        <div key={i} className={`flex items-start gap-2 mb-2 p-2 rounded-lg ${isDark ? 'bg-amber-900/15' : 'bg-amber-50'}`}>
                          <span className="flex-shrink-0 mt-0.5">⚠️</span>
                          <p className={`text-sm ${c.textSecondary}`}>{a}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Rhetorical Strategies */}
                  {results.argument_analysis.rhetorical_strategies?.length > 0 && (
                    <div className="mb-4">
                      <p className={`text-xs font-bold ${c.textMuted} uppercase tracking-wide mb-2`}>Rhetorical Strategies</p>
                      <div className="flex flex-wrap gap-2">
                        {results.argument_analysis.rhetorical_strategies.map((s, i) => (
                          <span key={i} className={`px-3 py-1 rounded-full text-sm ${isDark ? 'bg-teal-900/30 text-teal-300 border border-teal-700' : 'bg-teal-50 text-teal-700 border border-teal-200'}`}>{s}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* What's Missing */}
                  {results.argument_analysis.what_is_missing?.length > 0 && (
                    <div>
                      <p className={`text-xs font-bold ${c.textMuted} uppercase tracking-wide mb-2`}>What's Missing</p>
                      {results.argument_analysis.what_is_missing.map((m, i) => (
                        <p key={i} className={`text-sm ${c.textSecondary} mb-1`}>• {m}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Internal Contradictions */}
              {results.internal_contradictions?.length > 0 && (
                <div className={`${c.card} rounded-xl shadow-lg p-6 border-l-4 border-red-500`}>
                  <h3 className={`font-bold ${isDark ? 'text-red-400' : 'text-red-600'} mb-4 flex items-center gap-2`}>
                    <span>⚠️</span> Internal Contradictions ({results.internal_contradictions.length})
                  </h3>
                  <div className="space-y-4">
                    {results.internal_contradictions.map((con, idx) => (
                      <div key={idx} className={`rounded-lg overflow-hidden border ${isDark ? 'border-red-800' : 'border-red-200'}`}>
                        <div className="grid grid-cols-1 md:grid-cols-2">
                          <div className={`p-3 ${isDark ? 'bg-zinc-700/50' : 'bg-gray-50'}`}>
                            <p className={`text-xs font-bold ${c.textMuted} mb-1`}>📌 {con.section_a}</p>
                            <p className={`text-sm ${c.textSecondary}`}>{con.says_a}</p>
                          </div>
                          <div className={`p-3 ${isDark ? 'bg-red-900/15' : 'bg-red-50'}`}>
                            <p className={`text-xs font-bold ${isDark ? 'text-red-400' : 'text-red-600'} mb-1`}>📌 {con.section_b}</p>
                            <p className={`text-sm ${c.textSecondary}`}>{con.says_b}</p>
                          </div>
                        </div>
                        <div className={`p-3 border-t ${isDark ? 'border-red-800 bg-red-900/10' : 'border-red-200 bg-red-50/50'}`}>
                          <p className={`text-sm ${c.textSecondary}`}><strong>Why this matters:</strong> {con.implication}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Glossary */}
              {results.glossary?.length > 0 && (
                <div className={`${c.card} rounded-xl shadow-lg p-6`}>
                  <button onClick={() => toggleSection('glossary')} className={`w-full flex items-center justify-between ${c.text}`}>
                    <h3 className="font-bold flex items-center gap-2">
                      <span>📝</span> Glossary ({results.glossary.length} terms)
                    </h3>
                    {expandedSections.glossary ? <span>▲</span> : <span>▼</span>}
                  </button>
                  {expandedSections.glossary && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                      {results.glossary.map((g, i) => (
                        <div key={i} className={`p-3 rounded-lg ${c.cardAlt}`}>
                          <p className={`font-bold ${c.text} text-sm mb-1`}>{g.term}</p>
                          <p className={`text-sm ${c.textSecondary} mb-1`}>{g.definition}</p>
                          {g.context && <p className={`text-xs ${c.textMuted} italic`}>In this text: {g.context}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ─── TAB: FULL TRANSLATION ─── */}
          {activeTab === 'translation' && (
            <div className={`${c.card} rounded-xl shadow-lg p-6`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-bold ${c.text}`}>Plain-English Translation</h3>
                <CopyBtn content={results.translation} label="Copy Translation" />
              </div>
              <div className={`rounded-xl p-6 border ${isDark ? 'bg-zinc-700/30 border-zinc-600' : 'bg-slate-50 border-gray-200'} ${fontSizes[fontSize]}`}>
                <p className={`${c.text} leading-relaxed whitespace-pre-wrap`}>{results.translation}</p>
              </div>
            </div>
          )}

          {/* ─── TAB: X-RAY ─── */}
          {activeTab === 'xray' && results.structural_xray && (
            <div className="space-y-4">
              {/* Architecture Summary */}
              {results.structural_xray.architecture_summary && (
                <div className={`${c.card} rounded-xl shadow-lg p-6`}>
                  <h3 className={`font-bold ${c.text} mb-3 flex items-center gap-2`}>
                    <span>🏗️</span> How This Text Is Built
                  </h3>
                  <p className={`${c.textSecondary} leading-relaxed`}>{results.structural_xray.architecture_summary}</p>
                </div>
              )}

              {/* Section Cards — timeline style */}
              <div className="relative">
                {/* Vertical line */}
                <div className={`absolute left-5 top-0 bottom-0 w-0.5 ${isDark ? 'bg-zinc-700' : 'bg-gray-200'}`} />

                <div className="space-y-4">
                  {results.structural_xray.sections?.map((section, idx) => {
                    const badge = importanceBadge(section.importance);
                    return (
                      <div key={idx} className="relative pl-12">
                        {/* Timeline dot */}
                        <div className={`absolute left-3 top-5 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          section.importance === 'essential'
                            ? (isDark ? 'bg-red-900/50 border-red-500' : 'bg-red-100 border-red-400')
                            : section.importance === 'important'
                            ? (isDark ? 'bg-amber-900/50 border-amber-500' : 'bg-amber-100 border-amber-400')
                            : section.importance === 'boilerplate'
                            ? (isDark ? 'bg-zinc-700 border-zinc-500' : 'bg-gray-200 border-gray-300')
                            : (isDark ? 'bg-blue-900/50 border-blue-500' : 'bg-blue-100 border-blue-400')
                        }`}>
                          <div className={`w-2 h-2 rounded-full ${
                            section.importance === 'essential' ? 'bg-red-500'
                            : section.importance === 'important' ? 'bg-amber-500'
                            : section.importance === 'boilerplate' ? (isDark ? 'bg-zinc-500' : 'bg-gray-400')
                            : 'bg-blue-500'
                          }`} />
                        </div>

                        <div className={`${c.card} rounded-xl shadow-lg p-5 border ${c.border}`}>
                          <div className="flex items-start justify-between flex-wrap gap-2 mb-2">
                            <div>
                              <h4 className={`font-bold ${c.text}`}>{section.title}</h4>
                              {section.original_location && (
                                <p className={`text-xs ${c.textMuted} mt-0.5`}>📌 {section.original_location}</p>
                              )}
                            </div>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${badge.color}`}>{badge.label}</span>
                          </div>

                          <p className={`text-xs font-semibold ${c.accent} uppercase tracking-wide mb-1`}>Purpose</p>
                          <p className={`text-sm ${c.textSecondary} mb-3`}>{section.purpose}</p>

                          <p className={`text-xs font-semibold ${c.textMuted} uppercase tracking-wide mb-1`}>Key Content</p>
                          <p className={`text-sm ${c.textSecondary} ${fontSizes[fontSize]}`}>{section.key_content}</p>

                          {section.notes && (
                            <div className={`mt-3 p-3 rounded-lg ${isDark ? 'bg-amber-900/15' : 'bg-amber-50'}`}>
                              <p className={`text-xs ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>📝 {section.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB: SIDE-BY-SIDE ─── */}
          {activeTab === 'sidebyside' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className={`${c.card} rounded-xl shadow-lg p-5`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`font-bold ${c.text}`}>Original Text</h3>
                  <span className={`text-xs ${c.textMuted}`}>
                    {results.reading_level?.original || 'Complex'}
                  </span>
                </div>
                <div className={`rounded-lg p-4 border overflow-y-auto max-h-[600px] ${isDark ? 'bg-zinc-700/30 border-zinc-600' : 'bg-gray-50 border-gray-200'} ${fontSizes[fontSize]}`}>
                  <pre className={`whitespace-pre-wrap font-sans ${c.textSecondary} leading-relaxed`}>
                    {inputMethod === 'text' ? text : '(PDF document — original text in uploaded file)'}
                  </pre>
                </div>
              </div>

              <div className={`${c.card} rounded-xl shadow-lg p-5`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`font-bold ${c.text}`}>Plain-English Translation</h3>
                  <CopyBtn content={results.translation} label="Copy" />
                </div>
                <div className={`rounded-lg p-4 border overflow-y-auto max-h-[600px] ${isDark ? 'bg-sky-900/10 border-sky-800' : 'bg-sky-50 border-sky-200'} ${fontSizes[fontSize]}`}>
                  <p className={`${c.text} leading-relaxed whitespace-pre-wrap`}>
                    {results.translation}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tool Suggestion — visible on all tabs */}
          {results.tool_suggestion?.suggested && results.tool_suggestion?.tool_name && (
            <div className={`rounded-xl p-5 border-2 border-dashed ${isDark ? 'border-sky-700 bg-sky-900/10' : 'border-sky-300 bg-sky-50/50'}`}>
              <div className="flex items-start gap-3">
                <span className="text-xl flex-shrink-0 mt-0.5">💡</span>
                <div className="flex-1">
                  <p className={`font-bold ${c.text} mb-1`}>Want to go deeper?</p>
                  <p className={`text-sm ${c.textSecondary} mb-3`}>{results.tool_suggestion.reason}</p>
                  <a href={`/${results.tool_suggestion.tool_id || results.tool_suggestion.tool_name}`} target="_blank" rel="noopener noreferrer"
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${isDark ? 'bg-sky-800/50 text-sky-300 hover:bg-sky-700/50' : 'bg-sky-100 text-sky-700 hover:bg-sky-200'}`}>
                    Try {results.tool_suggestion.tool_name} <span>→</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Cross-references */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a href="/ComplaintEscalationWriter" className={`${c.card} border ${c.border} rounded-xl p-4 flex items-center gap-3 hover:shadow-md transition-shadow`}>
              <span className="text-xl">📨</span>
              <div className="flex-1">
                <p className={`text-sm font-bold ${c.text}`}>Complaint Escalation</p>
                <p className={`text-xs ${c.textMuted}`}>Need to escalate after reading the fine print?</p>
              </div>
              <span className={c.textMuted}>→</span>
            </a>
            <a href="/DecisionCoach" className={`${c.card} border ${c.border} rounded-xl p-4 flex items-center gap-3 hover:shadow-md transition-shadow`}>
              <span className="text-xl">🧭</span>
              <div className="flex-1">
                <p className={`text-sm font-bold ${c.text}`}>Decision Coach</p>
                <p className={`text-xs ${c.textMuted}`}>Not sure what to do with what you've learned?</p>
              </div>
              <span className={c.textMuted}>→</span>
            </a>
          </div>

          {/* Disclaimer */}
          <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-zinc-800/50' : 'bg-gray-50'}`}>
            <p className={`text-xs ${c.textMuted}`}>
              PlainTalk provides comprehension assistance. For domain-specific legal, medical, or financial advice, consult a qualified professional.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

PlainTalk.displayName = 'PlainTalk';
export default PlainTalk;
