import React, { useState } from 'react';
import {
  Loader2, AlertCircle, Copy, Check, ChevronDown, ChevronUp, RefreshCw, Printer, Share2,
  Search, Globe, Eye, Ear, MessageSquare, Shield, Clock, Heart, Zap, AlertTriangle,
  CheckCircle, XCircle, MinusCircle, Plus, X, ArrowRight, Trophy, BarChart3, Hash
} from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';
import { getToolById } from '../data/tools';

const NameAudit = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const toolData = getToolById('NameAudit');

  // ─── Theme ───
  const c = {
    card: isDark ? 'bg-zinc-800' : 'bg-white',
    cardAlt: isDark ? 'bg-zinc-700/50' : 'bg-slate-50',
    text: isDark ? 'text-zinc-50' : 'text-gray-900',
    textSecondary: isDark ? 'text-zinc-300' : 'text-gray-600',
    textMuted: isDark ? 'text-zinc-500' : 'text-gray-400',
    input: isDark ? 'bg-zinc-700 border-zinc-600 text-zinc-100 placeholder-zinc-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400',
    btnPrimary: isDark ? 'bg-cyan-600 hover:bg-cyan-500 text-white' : 'bg-cyan-600 hover:bg-cyan-700 text-white',
    btnSecondary: isDark ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-100' : 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    border: isDark ? 'border-zinc-700' : 'border-gray-200',
    chip: (active) => active
      ? (isDark ? 'bg-cyan-900/40 border-cyan-500 text-cyan-200' : 'bg-cyan-100 border-cyan-500 text-cyan-800')
      : (isDark ? 'border-zinc-600 text-zinc-400 hover:border-zinc-500' : 'border-gray-200 text-gray-500 hover:border-gray-300'),
    success: isDark ? 'bg-green-900/20 border-green-700 text-green-200' : 'bg-green-50 border-green-300 text-green-800',
    warning: isDark ? 'bg-amber-900/20 border-amber-700 text-amber-200' : 'bg-amber-50 border-amber-300 text-amber-800',
    danger: isDark ? 'bg-red-900/20 border-red-700 text-red-200' : 'bg-red-50 border-red-200 text-red-800',
    info: isDark ? 'bg-blue-900/20 border-blue-700 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-800',
    purple: isDark ? 'bg-purple-900/20 border-purple-700 text-purple-200' : 'bg-purple-50 border-purple-200 text-purple-800',
    cyan: isDark ? 'bg-cyan-900/20 border-cyan-700 text-cyan-200' : 'bg-cyan-50 border-cyan-200 text-cyan-800',
  };

  // ─── State ───
  const [mode, setMode] = useState('analyze'); // 'analyze' | 'compare'
  const [name, setName] = useState('');
  const [context, setContext] = useState('');
  const [industry, setIndustry] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [expandedSections, setExpandedSections] = useState({});
  const [copiedField, setCopiedField] = useState(null);

  // Compare mode state
  const [compareNames, setCompareNames] = useState(['', '']);
  const [compareResults, setCompareResults] = useState(null);
  const [compareLoading, setCompareLoading] = useState(false);

  // ─── Options ───
  const contexts = [
    { value: 'Business', icon: '🏢' },
    { value: 'Product', icon: '📦' },
    { value: 'App', icon: '📱' },
    { value: 'Domain Name', icon: '🌐' },
    { value: 'Band / Music Project', icon: '🎸' },
    { value: 'Pet', icon: '🐾' },
    { value: 'Baby', icon: '👶' },
    { value: 'Character (D&D/Fiction)', icon: '⚔️' },
    { value: 'Creative Project', icon: '🎨' },
    { value: 'Event', icon: '🎪' },
    { value: 'Username / Handle', icon: '📱' },
    { value: 'Other', icon: '✨' },
  ];

  // ─── Handlers ───
  const toggleSection = (key) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));

  const copyToClipboard = async (text, field) => {
    try { await navigator.clipboard.writeText(text); setCopiedField(field); setTimeout(() => setCopiedField(null), 2000); }
    catch (err) { console.error('Copy failed:', err); }
  };

  const CopyBtn = ({ content, field, label = 'Copy' }) => (
    <button onClick={() => copyToClipboard(content, field)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
      copiedField === field ? (isDark ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-700') : c.btnSecondary
    }`}>
      {copiedField === field ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copiedField === field ? 'Copied' : label}
    </button>
  );

  const handleAnalyze = async () => {
    if (!name.trim()) { setError('Please enter a name to analyze'); return; }
    if (!context) { setError('Please select what this name is for'); return; }
    setError(''); setResults(null);
    try {
      const data = await callToolEndpoint('nameaudit', {
        name: name.trim(), context,
        industry: industry.trim() || null,
        targetAudience: targetAudience.trim() || null,
      });
      setResults(data);
      setExpandedSections({ phonetic: true, memorability: true, language: true });
    } catch (err) {
      setError(err.message || 'Failed to analyze name.');
    }
  };

  const handleCompare = async () => {
    const filled = compareNames.filter(n => n.trim());
    if (filled.length < 2) { setError('Enter at least 2 names to compare'); return; }
    setError(''); setCompareResults(null); setCompareLoading(true);
    try {
      const data = await callToolEndpoint('nameaudit/compare', {
        names: filled.map(n => n.trim()), context,
        industry: industry.trim() || null,
      });
      setCompareResults(data);
    } catch (err) {
      setError(err.message || 'Failed to compare names.');
    }
    setCompareLoading(false);
  };

  const reset = () => {
    setName(''); setContext(''); setIndustry(''); setTargetAudience('');
    setResults(null); setError(''); setCompareResults(null);
    setCompareNames(['', '']);
  };

  const gradeColors = {
    STRONG: isDark ? 'bg-green-900/30 border-green-600 text-green-300' : 'bg-green-100 border-green-400 text-green-800',
    GOOD: isDark ? 'bg-emerald-900/30 border-emerald-600 text-emerald-300' : 'bg-emerald-100 border-emerald-400 text-emerald-800',
    FAIR: isDark ? 'bg-amber-900/30 border-amber-600 text-amber-300' : 'bg-amber-100 border-amber-400 text-amber-800',
    WEAK: isDark ? 'bg-orange-900/30 border-orange-600 text-orange-300' : 'bg-orange-100 border-orange-400 text-orange-800',
    RECONSIDER: isDark ? 'bg-red-900/30 border-red-600 text-red-300' : 'bg-red-100 border-red-400 text-red-800',
  };

  const PassFail = ({ pass, notes }) => (
    <div className="flex items-start gap-2">
      {pass ? <CheckCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isDark ? 'text-green-400' : 'text-green-500'}`} />
        : <XCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isDark ? 'text-red-400' : 'text-red-500'}`} />}
      <span className={`text-sm ${c.textSecondary}`}>{notes}</span>
    </div>
  );

  const langSeverityStyle = (sev) => {
    if (sev === 'positive') return c.success;
    if (sev === 'problem') return c.danger;
    if (sev === 'caution') return c.warning;
    return c.cardAlt;
  };

  const langSeverityIcon = (sev) => {
    if (sev === 'positive') return <CheckCircle className="w-3.5 h-3.5" />;
    if (sev === 'problem') return <XCircle className="w-3.5 h-3.5" />;
    if (sev === 'caution') return <AlertTriangle className="w-3.5 h-3.5" />;
    return <MinusCircle className="w-3.5 h-3.5" />;
  };

  const buildFullText = () => {
    if (!results) return '';
    const lines = [`NAMEAUDIT ANALYSIS: "${results.name_analyzed}"`, `Grade: ${results.overall_grade}`, '', results.overall_summary, ''];
    if (results.strengths?.length > 0) { lines.push('STRENGTHS'); results.strengths.forEach(s => lines.push(`  \u2713 ${s}`)); lines.push(''); }
    if (results.weaknesses?.length > 0) { lines.push('WEAKNESSES'); results.weaknesses.forEach(w => lines.push(`  \u2717 ${w}`)); lines.push(''); }
    if (results.deal_breakers?.length > 0) { lines.push('DEAL BREAKERS'); results.deal_breakers.forEach(d => lines.push(`  ${d}`)); lines.push(''); }
    if (results.tld_analysis) {
      lines.push('TLD ANALYSIS');
      ['tld_choice', 'trust_signal', 'confusion_risk', 'competing_com', 'alternative_tlds'].forEach(k => {
        if (results.tld_analysis[k]) lines.push(`${k.replace(/_/g, ' ').toUpperCase()}: ${results.tld_analysis[k]}`);
      });
      lines.push('');
    }
    if (results.domain_specific_tests) {
      lines.push('DOMAIN-SPECIFIC TESTS');
      ['browser_bar', 'typosquatting_risk', 'verbal_sharing', 'email_test'].forEach(k => {
        if (results.domain_specific_tests[k]) lines.push(`${k.replace(/_/g, ' ').toUpperCase()}: ${results.domain_specific_tests[k]}`);
      });
      lines.push('');
    }
    if (results.live_availability?.domains) {
      lines.push('LIVE AVAILABILITY', 'DOMAINS:');
      Object.entries(results.live_availability.domains).forEach(([d, s]) => {
        lines.push(`  ${s === 'likely_available' ? '\u2713' : '\u2717'} ${d}`);
      });
      if (results.live_availability?.social) {
        lines.push(`SOCIAL HANDLE: ${results.live_availability.social.handle}`);
        Object.entries(results.live_availability.social.platforms).forEach(([p, s]) => {
          lines.push(`  ${s === 'likely_available' ? '\u2713' : '\u2717'} ${p}`);
        });
      }
      lines.push('');
    }
    lines.push('\u2500\u2500\u2500', 'Generated by DeftBrain \u00b7 deftbrain.com');
    return lines.join('\n');
  };

  const handlePrint = () => {
    const content = buildFullText();
    const pw = window.open('', '_blank');
    if (!pw) return;
    pw.document.write(`<!DOCTYPE html><html><head><title>NameAudit — ${name}</title><style>body{font-family:Georgia,serif;max-width:700px;margin:40px auto;padding:0 20px;color:#1a1a1a;line-height:1.6;font-size:14px;}pre{white-space:pre-wrap;word-wrap:break-word;font-family:inherit;margin:0;}@media print{body{margin:20px;}}</style></head><body><pre>${content.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre></body></html>`);
    pw.document.close(); pw.focus(); setTimeout(() => pw.print(), 250);
  };


  const handleShare = async () => {
    const text = buildFullText();
    if (navigator.share) {
      try { await navigator.share({ title: 'NameAudit Results', text, url: window.location.href }); }
      catch (err) { if (err.name !== 'AbortError') console.error('Share failed:', err); }
    } else { copyToClipboard(text, 'share-fallback'); }
  };

  // Collapsible section helper
  const Section = ({ id, title, icon: Icon, iconColor, children, defaultOpen = false }) => {
    const isOpen = expandedSections[id] !== undefined ? expandedSections[id] : defaultOpen;
    return (
      <div className={`${c.card} rounded-xl shadow-lg p-6`}>
        <button onClick={() => toggleSection(id)} className={`w-full flex items-center justify-between ${c.text}`}>
          <h3 className="font-bold flex items-center gap-2">
            <Icon className={`w-5 h-5 ${iconColor}`} /> {title}
          </h3>
          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
        {isOpen && <div className="mt-4">{children}</div>}
      </div>
    );
  };

  // ─── RENDER ───
  return (
    <div>
      <div className="mb-5">
        <h2 className={`text-2xl font-bold ${c.text}`}>{toolData?.title || 'NameAudit'} {toolData?.icon || '🔍'}</h2>
        <p className={`text-sm ${c.textMuted}`}>{toolData?.tagline || 'Stress-test any name before you commit'}</p>
      </div>

      {/* ═══ INPUT VIEW ═══ */}
      {!results && !compareResults && (
        <div className="space-y-5">

          {/* Mode Toggle */}
          <div className="flex gap-2">
            <button onClick={() => setMode('analyze')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg border text-sm font-semibold transition-all ${c.chip(mode === 'analyze')}`}>
              <Search className="w-4 h-4" /> Analyze a Name
            </button>
            <button onClick={() => setMode('compare')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg border text-sm font-semibold transition-all ${c.chip(mode === 'compare')}`}>
              <BarChart3 className="w-4 h-4" /> Compare Names
            </button>
          </div>

          {/* Analyze Mode */}
          {mode === 'analyze' && (
            <div className={`${c.card} rounded-xl shadow-lg p-6`}>
              <label className={`block font-semibold ${c.text} mb-2`}>The name <span className="text-red-500">*</span></label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && name.trim() && context) handleAnalyze(); }}
                placeholder="Enter the name you want analyzed"
                className={`w-full p-4 border rounded-xl outline-none text-lg font-semibold focus:ring-2 focus:ring-cyan-300 ${c.input}`} />
            </div>
          )}

          {/* Compare Mode */}
          {mode === 'compare' && (
            <div className={`${c.card} rounded-xl shadow-lg p-6 space-y-3`}>
              <label className={`block font-semibold ${c.text} mb-1`}>Names to compare <span className="text-red-500">*</span></label>
              {compareNames.map((n, idx) => (
                <div key={idx} className="flex gap-2">
                  <input type="text" value={n} onChange={(e) => {
                    const updated = [...compareNames]; updated[idx] = e.target.value; setCompareNames(updated);
                  }}
                    placeholder={`Name ${idx + 1}`}
                    onKeyDown={(e) => { if (e.key === 'Enter' && compareNames.filter(n => n.trim()).length >= 2 && context) handleCompare(); }}
                    className={`flex-1 p-3 border rounded-lg outline-none text-sm font-semibold focus:ring-2 focus:ring-cyan-300 ${c.input}`} />
                  {compareNames.length > 2 && (
                    <button onClick={() => setCompareNames(compareNames.filter((_, i) => i !== idx))}
                      className={`p-2 rounded-lg ${c.btnSecondary}`}><X className="w-4 h-4" /></button>
                  )}
                </div>
              ))}
              {compareNames.length < 4 && (
                <button onClick={() => setCompareNames([...compareNames, ''])}
                  className={`flex items-center gap-1 text-sm ${c.textMuted} hover:${c.text}`}>
                  <Plus className="w-4 h-4" /> Add another
                </button>
              )}
            </div>
          )}

          {/* Context */}
          <div className={`${c.card} rounded-xl shadow-lg p-6`}>
            <label className={`block font-semibold ${c.text} mb-3`}>What is this name for? <span className="text-red-500">*</span></label>
            <div className="flex flex-wrap gap-2">
              {contexts.map(ct => (
                <button key={ct.value} onClick={() => setContext(ct.value)}
                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${c.chip(context === ct.value)}`}>
                  {ct.icon} {ct.value}
                </button>
              ))}
            </div>
          </div>

          {/* Optional */}
          <div className={`${c.card} rounded-xl shadow-lg p-6 space-y-4`}>
            <p className={`text-xs font-bold uppercase tracking-wide ${c.textMuted}`}>Optional — improves analysis accuracy</p>
            <div>
              <label className={`block text-sm font-semibold ${c.text} mb-1`}>Industry / Context</label>
              <input type="text" value={industry} onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g., Fintech, organic skincare, indie game studio"
                onKeyDown={(e) => { if (e.key === 'Enter') { mode === 'analyze' ? handleAnalyze() : handleCompare(); } }}
                className={`w-full p-3 border rounded-xl outline-none text-sm focus:ring-2 focus:ring-cyan-300 ${c.input}`} />
            </div>
            {mode === 'analyze' && (
              <div>
                <label className={`block text-sm font-semibold ${c.text} mb-1`}>Target audience</label>
                <input type="text" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="e.g., Gen Z professionals, parents of toddlers, enterprise IT buyers"
                  onKeyDown={(e) => { if (e.key === 'Enter' && name.trim() && context) handleAnalyze(); }}
                  className={`w-full p-3 border rounded-xl outline-none text-sm focus:ring-2 focus:ring-cyan-300 ${c.input}`} />
              </div>
            )}
          </div>

          {/* Submit */}
          <button onClick={mode === 'analyze' ? handleAnalyze : handleCompare}
            disabled={loading || compareLoading || (mode === 'analyze' ? (!name.trim() || !context) : (compareNames.filter(n => n.trim()).length < 2 || !context))}
            className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2 shadow-lg ${
              (loading || compareLoading) ? (isDark ? 'bg-zinc-700 text-zinc-400' : 'bg-gray-200 text-gray-400') : c.btnPrimary
            }`}>
            {(loading || compareLoading) ? (<><Loader2 className="w-5 h-5 animate-spin" /> {mode === 'analyze' ? 'Analyzing...' : 'Comparing...'}</>)
              : (<><Search className="w-5 h-5" /> {mode === 'analyze' ? 'Analyze This Name' : 'Compare These Names'}</>)}
          </button>

          {error && (
            <div className={`p-4 rounded-xl flex items-start gap-3 ${c.danger} border`}>
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" /><p className="text-sm">{error}</p>
            </div>
          )}

          {/* NameStorm mention */}
          <p className={`text-xs text-center ${c.textMuted}`}>
            Need name ideas first? Try <strong>NameStorm</strong> to generate names, then bring your favorites here.
          </p>
        </div>
      )}

      {/* ═══ COMPARE RESULTS ═══ */}
      {compareResults && (
        <div className="space-y-5">
          <div className={`${c.card} rounded-xl shadow-lg p-4 flex items-center justify-between flex-wrap gap-3`}>
            <span className={`text-sm font-semibold ${c.text}`}>Comparison: {compareNames.filter(n => n.trim()).join(' vs ')}</span>
            <button onClick={reset} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${isDark ? 'bg-cyan-900/30 text-cyan-300' : 'bg-cyan-50 text-cyan-700'}`}>
              <RefreshCw className="w-3.5 h-3.5" /> New Analysis
            </button>
          </div>

          {/* Winner */}
          {compareResults.winner && (
            <div className={`${c.card} rounded-xl shadow-lg p-6 border-l-4 ${isDark ? 'border-amber-500' : 'border-amber-400'}`}>
              <div className="flex items-center gap-3 mb-3">
                <Trophy className={`w-6 h-6 ${isDark ? 'text-amber-400' : 'text-amber-500'}`} />
                <h3 className={`text-xl font-bold ${c.text}`}>{compareResults.winner.name}</h3>
                <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${c.warning} border`}>{compareResults.winner.margin.replace(/_/g, ' ')}</span>
              </div>
              <p className={`text-sm ${c.textSecondary}`}>{compareResults.winner.why}</p>
              <p className={`text-xs ${c.textMuted} mt-3 italic`}>💡 Run this comparison 2-3 times — if the same name wins consistently, you've got your answer! If it's a toss-up, your finalists are genuinely close and you can trust your instincts.</p>
            </div>
          )}

          {/* Side by side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {compareResults.candidates?.map((cand, idx) => {
              const isWinner = cand.name === compareResults.winner?.name;
              return (
                <div key={idx} className={`${c.card} rounded-xl shadow-lg p-5 border-2 ${isWinner ? (isDark ? 'border-amber-600' : 'border-amber-400') : c.border}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className={`text-lg font-bold ${c.text}`}>{cand.name}</h4>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${gradeColors[cand.grade] || c.warning}`}>{cand.grade}</span>
                  </div>
                  <p className={`text-sm ${c.textSecondary} mb-3`}>{cand.one_liner}</p>
                  <div className="space-y-2">
                    <div className={`p-2 rounded-lg ${c.success} border`}>
                      <p className="text-xs font-bold mb-0.5">Best quality</p><p className="text-sm">{cand.best_quality}</p>
                    </div>
                    <div className={`p-2 rounded-lg ${c.danger} border`}>
                      <p className="text-xs font-bold mb-0.5">Biggest risk</p><p className="text-sm">{cand.biggest_risk}</p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-xs border ${c.chip(false)}`}>Memorability: {cand.memorability}</span>
                      <span className={`px-2 py-0.5 rounded text-xs border ${cand.radio_test === 'pass' ? c.success : cand.radio_test === 'fail' ? c.danger : c.warning}`}>Radio: {cand.radio_test}</span>
                      <span className={`px-2 py-0.5 rounded text-xs border ${cand.global_safety === 'clean' ? c.success : cand.global_safety === 'problem' ? c.danger : c.warning}`}>Global: {cand.global_safety}</span>
                    </div>
                    <p className={`text-xs ${c.textMuted} italic`}>Personality: {cand.personality}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {compareResults.comparison_insight && (
            <div className={`p-4 rounded-xl ${c.info} border text-center`}>
              <p className="text-sm font-medium">{compareResults.comparison_insight}</p>
            </div>
          )}
        </div>
      )}

      {/* ═══ ANALYSIS RESULTS ═══ */}
      {results && (
        <div className="space-y-5">

          {/* Controls */}
          <div className={`${c.card} rounded-xl shadow-lg p-4 flex items-center justify-between flex-wrap gap-3`}>
            <span className={`text-sm font-semibold ${c.text}`}>Analysis: "{results.name_analyzed}"</span>
            <div className="flex items-center gap-2">
              <CopyBtn content={buildFullText()} field="full-analysis" label="Copy All" />
              <button onClick={handlePrint} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${c.btnSecondary}`}>
                <Printer className="w-3.5 h-3.5" /> Print
              </button>
              <button onClick={handleShare} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${c.btnSecondary}`}>
                <Share2 className="w-3.5 h-3.5" /> Share
              </button>
              <button onClick={reset} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${isDark ? 'bg-cyan-900/30 text-cyan-300' : 'bg-cyan-50 text-cyan-700'}`}>
                <RefreshCw className="w-3.5 h-3.5" /> New Analysis
              </button>
            </div>
          </div>

          {/* Overall Verdict */}
          <div className={`${c.card} rounded-xl shadow-lg p-6 border-l-4 ${
            results.overall_grade === 'STRONG' || results.overall_grade === 'GOOD' ? (isDark ? 'border-green-500' : 'border-green-400')
            : results.overall_grade === 'FAIR' ? (isDark ? 'border-amber-500' : 'border-amber-400')
            : (isDark ? 'border-red-500' : 'border-red-400')
          }`}>
            <div className="flex items-center gap-3 mb-3">
              <span className={`px-3 py-1.5 rounded-full text-sm font-bold border ${gradeColors[results.overall_grade] || c.warning}`}>
                {results.overall_grade}
              </span>
              <h3 className={`text-lg font-bold ${c.text}`}>"{results.name_analyzed}"</h3>
            </div>
            <p className={`text-sm ${c.textSecondary} leading-relaxed`}>{results.overall_summary}</p>
          </div>

          {/* Strengths + Weaknesses + Deal Breakers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {results.strengths?.length > 0 && (
              <div className={`p-5 rounded-xl ${c.success} border`}>
                <p className="text-xs font-bold mb-2">STRENGTHS</p>
                {results.strengths.map((s, i) => <p key={i} className="text-sm mb-1">✓ {s}</p>)}
              </div>
            )}
            {results.weaknesses?.length > 0 && (
              <div className={`p-5 rounded-xl ${c.warning} border`}>
                <p className="text-xs font-bold mb-2">WEAKNESSES</p>
                {results.weaknesses.map((w, i) => <p key={i} className="text-sm mb-1">⚠ {w}</p>)}
              </div>
            )}
          </div>

          {results.deal_breakers?.length > 0 && (
            <div className={`p-5 rounded-xl ${c.danger} border`}>
              <p className="text-xs font-bold mb-2">🚨 DEAL BREAKERS</p>
              {results.deal_breakers.map((d, i) => <p key={i} className="text-sm mb-1 font-medium">{d}</p>)}
            </div>
          )}

          {/* First Impression */}
          {results.first_impression && (
            <Section id="impression" title="First Impression" icon={Eye} iconColor={isDark ? 'text-violet-400' : 'text-violet-600'} defaultOpen>
              <div className="space-y-3">
                <p className={`text-sm ${c.textSecondary}`}>{results.first_impression.gut_reaction}</p>
                <div className="flex flex-wrap gap-1.5">
                  {results.first_impression.associations?.map((a, i) => (
                    <span key={i} className={`px-2.5 py-1 rounded-full text-xs border ${c.chip(false)}`}>{a}</span>
                  ))}
                </div>
                <p className={`text-sm ${c.textMuted} italic`}>Personality: {results.first_impression.personality_projected}</p>
              </div>
            </Section>
          )}

          {/* Phonetic Profile */}
          {results.phonetic_profile && (
            <Section id="phonetic" title="Phonetic Profile" icon={Ear} iconColor={isDark ? 'text-cyan-400' : 'text-cyan-600'}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {['syllables', 'mouth_feel', 'accent_notes', 'sound_psychology', 'rhythm'].map(key => (
                  results.phonetic_profile[key] && (
                    <div key={key} className={`p-3 rounded-lg ${c.cardAlt}`}>
                      <p className={`text-xs font-bold ${c.textMuted} mb-1`}>{key.replace(/_/g, ' ').toUpperCase()}</p>
                      <p className={`text-sm ${c.textSecondary}`}>{results.phonetic_profile[key]}</p>
                    </div>
                  )
                ))}
              </div>
            </Section>
          )}

          {/* Memorability */}
          {results.memorability && (
            <Section id="memorability" title="Memorability Tests" icon={Zap} iconColor={isDark ? 'text-amber-400' : 'text-amber-600'}>
              <div className="space-y-3">
                {[
                  { key: 'day_after_test', label: 'Day-After Test' },
                  { key: 'tell_a_friend_test', label: 'Tell-A-Friend Test' },
                  { key: 'phone_test', label: 'Phone Test' },
                  { key: 'drunk_test', label: 'Drunk Test 🍺' },
                  { key: 'shout_test', label: 'Shout Test' },
                ].map(({ key, label }) => results.memorability[key] && (
                  <div key={key} className="flex items-start gap-3">
                    <span className={`text-xs font-bold w-32 flex-shrink-0 pt-0.5 ${c.textMuted}`}>{label}</span>
                    <PassFail pass={results.memorability[key].pass} notes={results.memorability[key].notes} />
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Radio Test */}
          {results.radio_test && (
            <Section id="radio" title="Radio Test (Spell From Hearing)" icon={MessageSquare} iconColor={isDark ? 'text-pink-400' : 'text-pink-600'}>
              <div className="space-y-3">
                <PassFail pass={results.radio_test.pass} notes={results.radio_test.notes} />
                {results.radio_test.likely_misspellings?.length > 0 && (
                  <div className={`p-3 rounded-lg ${c.warning} border`}>
                    <p className="text-xs font-bold mb-1">LIKELY MISSPELLINGS</p>
                    <div className="flex flex-wrap gap-1.5">
                      {results.radio_test.likely_misspellings.map((m, i) => (
                        <span key={i} className={`px-2 py-0.5 rounded text-xs font-mono ${isDark ? 'bg-zinc-800' : 'bg-white'}`}>{m}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Visual Analysis */}
          {results.visual_analysis && (
            <Section id="visual" title="Visual Analysis" icon={Eye} iconColor={isDark ? 'text-purple-400' : 'text-purple-600'}>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-3 mb-3">
                  {[
                    { label: 'lowercase', val: results.visual_analysis.lowercase },
                    { label: 'UPPERCASE', val: results.visual_analysis.uppercase },
                    { label: 'Title Case', val: results.visual_analysis.title_case },
                  ].map(({ label, val }) => val && (
                    <div key={label} className={`p-3 rounded-lg ${c.cardAlt} text-center`}>
                      <p className={`text-xs ${c.textMuted} mb-1`}>{label}</p>
                      <p className={`text-lg font-bold ${c.text}`}>{val}</p>
                    </div>
                  ))}
                </div>
                {['url_appearance', 'logo_potential', 'visual_issues'].map(key => (
                  results.visual_analysis[key] && (
                    <div key={key} className={`p-3 rounded-lg ${c.cardAlt}`}>
                      <p className={`text-xs font-bold ${c.textMuted} mb-1`}>{key.replace(/_/g, ' ').toUpperCase()}</p>
                      <p className={`text-sm ${c.textSecondary}`}>{results.visual_analysis[key]}</p>
                    </div>
                  )
                ))}
              </div>
            </Section>
          )}

          {/* Global Language Scan */}
          {results.global_language_scan?.length > 0 && (
            <Section id="language" title={`Global Language Scan (${results.global_language_scan.length} languages)`} icon={Globe} iconColor={isDark ? 'text-green-400' : 'text-green-600'}>
              <div className="flex flex-wrap gap-2">
                {results.global_language_scan.map((lang, idx) => (
                  <div key={idx} className={`px-3 py-2 rounded-lg border text-sm flex items-center gap-1.5 ${langSeverityStyle(lang.severity)}`}>
                    {langSeverityIcon(lang.severity)}
                    <span className="font-semibold">{lang.language}:</span>
                    <span>{lang.finding}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Abbreviation Audit */}
          {results.abbreviation_audit && (
            <Section id="abbreviation" title="Abbreviation & Nickname Audit" icon={Hash} iconColor={isDark ? 'text-orange-400' : 'text-orange-600'}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {['natural_shortening', 'initials', 'hashtag', 'issues'].map(key => (
                  results.abbreviation_audit[key] && (
                    <div key={key} className={`p-3 rounded-lg ${key === 'issues' && results.abbreviation_audit[key] !== 'Clean' ? c.warning : c.cardAlt} ${key === 'issues' && results.abbreviation_audit[key] !== 'Clean' ? 'border' : ''}`}>
                      <p className={`text-xs font-bold ${c.textMuted} mb-1`}>{key.replace(/_/g, ' ').toUpperCase()}</p>
                      <p className={`text-sm ${c.textSecondary} ${key === 'hashtag' ? 'font-mono' : ''}`}>{results.abbreviation_audit[key]}</p>
                    </div>
                  )
                ))}
              </div>
            </Section>
          )}

          {/* Competitive Landscape */}
          {results.competitive_landscape && (
            <Section id="competitive" title="Competitive Landscape" icon={Shield} iconColor={isDark ? 'text-red-400' : 'text-red-600'}>
              <div className="space-y-3">
                {results.competitive_landscape.similar_names?.length > 0 && (
                  <div className={`p-3 rounded-lg ${c.warning} border`}>
                    <p className="text-xs font-bold mb-1">SIMILAR EXISTING NAMES</p>
                    {results.competitive_landscape.similar_names.map((n, i) => <p key={i} className="text-sm mb-0.5">• {n}</p>)}
                  </div>
                )}
                <div className={`p-3 rounded-lg ${c.cardAlt}`}>
                  <p className={`text-xs font-bold ${c.textMuted} mb-1`}>DIFFERENTIATION</p>
                  <p className={`text-sm ${c.textSecondary}`}>{results.competitive_landscape.differentiation}</p>
                </div>
              </div>
            </Section>
          )}

          {/* SEO / Searchability */}
          {results.searchability && (
            <Section id="seo" title="SEO & Searchability" icon={Search} iconColor={isDark ? 'text-blue-400' : 'text-blue-600'}>
              <div className="space-y-3">
                {['uniqueness', 'google_competition', 'seo_assessment'].map(key => (
                  results.searchability[key] && (
                    <div key={key} className={`p-3 rounded-lg ${c.cardAlt}`}>
                      <p className={`text-xs font-bold ${c.textMuted} mb-1`}>{key.replace(/_/g, ' ').toUpperCase()}</p>
                      <p className={`text-sm ${c.textSecondary}`}>{results.searchability[key]}</p>
                    </div>
                  )
                ))}
              </div>
            </Section>
          )}

          {/* Longevity */}
          {results.longevity && (
            <Section id="longevity" title="Longevity Check" icon={Clock} iconColor={isDark ? 'text-teal-400' : 'text-teal-600'}>
              <div className="space-y-3">
                {['trend_dependency', 'aging_risk', 'verdict'].map(key => (
                  results.longevity[key] && (
                    <div key={key} className={`p-3 rounded-lg ${c.cardAlt}`}>
                      <p className={`text-xs font-bold ${c.textMuted} mb-1`}>{key.replace(/_/g, ' ').toUpperCase()}</p>
                      <p className={`text-sm ${c.textSecondary}`}>{results.longevity[key]}</p>
                    </div>
                  )
                ))}
              </div>
            </Section>
          )}


          {/* TLD Analysis (domain names) */}
          {results.tld_analysis && (
            <Section id="tld" title="TLD Analysis" icon={Globe} iconColor={isDark ? 'text-cyan-400' : 'text-cyan-600'}>
              <div className="space-y-3">
                {['tld_choice', 'trust_signal', 'confusion_risk', 'competing_com', 'alternative_tlds'].map(key => (
                  results.tld_analysis[key] && (
                    <div key={key} className={`p-3 rounded-lg ${c.cardAlt}`}>
                      <p className={`text-xs font-bold ${c.textMuted} mb-1`}>{key.replace(/_/g, ' ').toUpperCase()}</p>
                      <p className={`text-sm ${c.textSecondary}`}>{results.tld_analysis[key]}</p>
                    </div>
                  )
                ))}
              </div>
            </Section>
          )}

          {/* Domain-Specific Tests */}
          {results.domain_specific_tests && (
            <Section id="domain-tests" title="Domain-Specific Tests" icon={Search} iconColor={isDark ? 'text-indigo-400' : 'text-indigo-600'}>
              <div className="space-y-3">
                {['browser_bar', 'typosquatting_risk', 'verbal_sharing', 'email_test'].map(key => (
                  results.domain_specific_tests[key] && (
                    <div key={key} className={`p-3 rounded-lg ${c.cardAlt}`}>
                      <p className={`text-xs font-bold ${c.textMuted} mb-1`}>{key.replace(/_/g, ' ').toUpperCase()}</p>
                      <p className={`text-sm ${c.textSecondary}`}>{results.domain_specific_tests[key]}</p>
                    </div>
                  )
                ))}
              </div>
            </Section>
          )}

          {/* Emotional Resonance */}
          {results.emotional_resonance && (
            <Section id="emotion" title="Emotional Resonance" icon={Heart} iconColor={isDark ? 'text-pink-400' : 'text-pink-600'}>
              <div className="space-y-3">
                {results.emotional_resonance.personality_match && (
                  <p className={`text-sm ${c.textSecondary}`}>{results.emotional_resonance.personality_match}</p>
                )}
                {results.emotional_resonance.sensory_associations && (
                  <div className={`p-3 rounded-lg ${c.purple} border`}>
                    <p className="text-xs font-bold mb-1">SENSORY ASSOCIATIONS</p>
                    <p className="text-sm">{results.emotional_resonance.sensory_associations}</p>
                  </div>
                )}
                {results.emotional_resonance.if_it_were_a_person && (
                  <div className={`p-3 rounded-lg ${c.cardAlt}`}>
                    <p className={`text-xs font-bold ${c.textMuted} mb-1`}>IF THIS NAME WERE A PERSON</p>
                    <p className={`text-sm ${c.textSecondary} italic`}>{results.emotional_resonance.if_it_were_a_person}</p>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Live Availability */}
          {results.live_availability && (
            <Section id="availability" title="Live Availability" icon={Globe} iconColor={isDark ? 'text-emerald-400' : 'text-emerald-600'}>
              <div className="space-y-3">
                {results.live_availability.domains && (
                  <div>
                    <p className={`text-xs font-bold ${c.textMuted} mb-2`}>DOMAINS</p>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(results.live_availability.domains).map(([domain, status]) => (
                        <span key={domain} className={`px-2.5 py-1 rounded text-xs font-mono border ${
                          status === 'likely_available' ? (isDark ? 'bg-green-900/30 border-green-700 text-green-300' : 'bg-green-50 border-green-300 text-green-700')
                          : status === 'taken' ? (isDark ? 'bg-red-900/20 border-red-800 text-red-400' : 'bg-red-50 border-red-200 text-red-500')
                          : (isDark ? 'bg-zinc-700 border-zinc-600 text-zinc-400' : 'bg-gray-100 border-gray-200 text-gray-400')
                        }`}>
                          {domain} {status === 'likely_available' ? '✓' : status === 'taken' ? '✗' : '?'}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {results.live_availability.social && (
                  <div>
                    <p className={`text-xs font-bold ${c.textMuted} mb-2`}>SOCIAL: {results.live_availability.social.handle}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(results.live_availability.social.platforms).map(([platform, status]) => (
                        <span key={platform} className={`px-2.5 py-1 rounded text-xs border ${
                          status === 'likely_available' ? (isDark ? 'bg-green-900/30 border-green-700 text-green-300' : 'bg-green-50 border-green-300 text-green-700')
                          : status === 'likely_taken' ? (isDark ? 'bg-red-900/20 border-red-800 text-red-400' : 'bg-red-50 border-red-200 text-red-500')
                          : (isDark ? 'bg-zinc-700 border-zinc-600 text-zinc-400' : 'bg-gray-100 border-gray-200 text-gray-400')
                        }`}>
                          {platform} {status === 'likely_available' ? '✓' : status === 'likely_taken' ? '✗' : '?'}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Suggestions */}
          {results.suggestions && (
            <div className={`${c.card} rounded-xl shadow-lg p-6`}>
              <h3 className={`font-bold ${c.text} mb-3 flex items-center gap-2`}>
                <ArrowRight className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} /> Next Steps
              </h3>
              {results.suggestions.to_strengthen && (
                <div className={`p-3 rounded-lg ${c.success} border mb-3`}>
                  <p className="text-xs font-bold mb-1">TO STRENGTHEN THIS NAME</p>
                  <p className="text-sm">{results.suggestions.to_strengthen}</p>
                </div>
              )}
              {results.suggestions.alternatives_direction && (
                <div className={`p-3 rounded-lg ${c.info} border`}>
                  <p className="text-xs font-bold mb-1">IF RECONSIDERING</p>
                  <p className="text-sm">{results.suggestions.alternatives_direction}</p>
                </div>
              )}
            </div>
          )}

          {/* Cross-tool mention */}
          <p className={`text-xs text-center ${c.textMuted}`}>
            Want alternatives? Use <strong>NameStorm</strong> to generate names, then bring your favorites back here.
          </p>

          {/* Disclaimer */}
          <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-zinc-800/50' : 'bg-gray-50'}`}>
            <p className={`text-xs ${c.textMuted}`}>
              🔍 Domain and social availability checks are approximations via DNS. Language analysis is AI-generated — verify critical findings with native speakers. Trademark analysis is informational, not legal advice.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

NameAudit.displayName = 'NameAudit';
export default NameAudit;
