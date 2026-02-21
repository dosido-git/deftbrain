import React, { useState, useCallback } from 'react';
import {
  Loader2, AlertCircle, Copy, Check, ChevronDown, ChevronUp, RefreshCw, Printer, Share2,
  Zap, Globe, Star, Search, AlertTriangle, CheckCircle, XCircle, Sparkles, Layers,
  Hash, ExternalLink, ChevronRight, X, Plus, Shuffle
} from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';
import { getToolById } from '../data/tools';

const NameStorm = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const toolData = getToolById('NameStorm');

  // ——— Theme ———
  const c = {
    card: isDark ? 'bg-zinc-800' : 'bg-white',
    cardAlt: isDark ? 'bg-zinc-700/50' : 'bg-slate-50',
    text: isDark ? 'text-zinc-50' : 'text-gray-900',
    textSecondary: isDark ? 'text-zinc-300' : 'text-gray-600',
    textMuted: isDark ? 'text-zinc-500' : 'text-gray-400',
    input: isDark ? 'bg-zinc-700 border-zinc-600 text-zinc-100 placeholder-zinc-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400',
    btnPrimary: isDark ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-amber-500 hover:bg-amber-600 text-white',
    btnSecondary: isDark ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-100' : 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    border: isDark ? 'border-zinc-700' : 'border-gray-200',
    chip: (active) => active
      ? (isDark ? 'bg-amber-900/40 border-amber-500 text-amber-200' : 'bg-amber-100 border-amber-500 text-amber-800')
      : (isDark ? 'border-zinc-600 text-zinc-400 hover:border-zinc-500' : 'border-gray-200 text-gray-500 hover:border-gray-300'),
    success: isDark ? 'bg-green-900/20 border-green-700 text-green-200' : 'bg-green-50 border-green-300 text-green-800',
    warning: isDark ? 'bg-amber-900/20 border-amber-700 text-amber-200' : 'bg-amber-50 border-amber-300 text-amber-800',
    danger: isDark ? 'bg-red-900/20 border-red-700 text-red-200' : 'bg-red-50 border-red-200 text-red-800',
    info: isDark ? 'bg-blue-900/20 border-blue-700 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-800',
  };

  // ——— Input state ———
  const [mode, setMode] = useState('generate'); // generate | domain | blend
  const [category, setCategory] = useState('');
  const [vibe, setVibe] = useState('');
  const [vibeChips, setVibeChips] = useState([]);
  const [constraints, setConstraints] = useState('');
  const [industryContext, setIndustryContext] = useState('');
  // Domain mode
  const [preferredTLDs, setPreferredTLDs] = useState([]);
  const [tldInput, setTldInput] = useState('');
  const [maxChars, setMaxChars] = useState('');
  const [primaryLanguage, setPrimaryLanguage] = useState('English');
  const [targetLanguages, setTargetLanguages] = useState([]);
  // Blend mode
  const [seedWords, setSeedWords] = useState(['', '']);
  const [pairWithDomains, setPairWithDomains] = useState(false);

  // ——— Results state ———
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [favorites, setFavorites] = useState(new Set());
  const [showFavOnly, setShowFavOnly] = useState(false);
  const [expandedCats, setExpandedCats] = useState({});
  const [copiedField, setCopiedField] = useState(null);

  // Per-name actions
  const [checkingName, setCheckingName] = useState(null);
  const [availabilityResults, setAvailabilityResults] = useState({});
  const [moreLikeLoading, setMoreLikeLoading] = useState(null);
  const [moreLikeResults, setMoreLikeResults] = useState({});

  // ——— Options ———
  const categories = [
    { value: 'Business', icon: '🏢' }, { value: 'Product', icon: '📦' },
    { value: 'App', icon: '📱' }, { value: 'Domain Name', icon: '🌐' },
    { value: 'Band / Music Project', icon: '🎸' }, { value: 'Pet', icon: '🐾' },
    { value: 'Baby', icon: '👶' }, { value: 'Character (D&D/Fiction)', icon: '⚔️' },
    { value: 'Creative Project', icon: '🎨' }, { value: 'Event', icon: '🎪' },
    { value: 'Username / Handle', icon: '📱' }, { value: 'Other', icon: '✨' },
  ];

  const vibeOptions = [
    'Bold / Punchy', 'Minimal / Clean', 'Playful / Fun', 'Sophisticated / Premium',
    'Earthy / Natural', 'Techy / Modern', 'Warm / Nostalgic', 'Edgy / Fierce',
    'Whimsical / Magical', 'Professional / Corporate',
  ];

  const languages = [
    'English', 'Spanish', 'French', 'German', 'Portuguese', 'Italian', 'Dutch',
    'Japanese', 'Korean', 'Chinese', 'Arabic', 'Hindi', 'Russian', 'Turkish',
    'Polish', 'Swedish', 'Thai', 'Vietnamese', 'Indonesian',
  ];

  // ——— Handlers ———
  const toggleChip = (chip) => {
    setVibeChips(prev => prev.includes(chip) ? prev.filter(c => c !== chip) : [...prev, chip]);
  };

  const toggleFav = (name) => {
    setFavorites(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const copyToClipboard = async (text, field) => {
    try { await navigator.clipboard.writeText(text); setCopiedField(field); setTimeout(() => setCopiedField(null), 2000); }
    catch (err) { console.error('Copy failed:', err); }
  };

  const CopyBtn = ({ content, field, label = 'Copy' }) => (
    <button onClick={() => copyToClipboard(content, field)} className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all ${
      copiedField === field ? (isDark ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-700') : c.btnSecondary
    }`}>
      {copiedField === field ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copiedField === field ? 'Copied' : label}
    </button>
  );

  const addTLD = () => {
    const tld = tldInput.trim().replace(/^\./, '');
    if (tld && !preferredTLDs.includes(tld)) {
      setPreferredTLDs([...preferredTLDs, tld]);
      setTldInput('');
    }
  };

  // ——— API calls ———
  const handleGenerate = async () => {
    if (!category) { setError('Please select what needs a name'); return; }
    if (!vibe.trim() && vibeChips.length === 0) { setError('Describe the vibe or select at least one vibe chip'); return; }
    setError(''); setResults(null); setFavorites(new Set()); setShowFavOnly(false);
    setAvailabilityResults({}); setMoreLikeResults({});
    try {
      const payload = {
        category, vibe: vibe.trim(), vibeChips,
        constraints: constraints.trim() || null,
        industryContext: industryContext.trim() || null,
        primaryLanguage: primaryLanguage !== 'English' ? primaryLanguage : undefined,
        targetLanguages: targetLanguages.length > 0 ? targetLanguages : undefined,
      };
      if (category === 'Domain Name') {
        payload.preferredTLDs = preferredTLDs.length > 0 ? preferredTLDs : undefined;
        payload.maxChars = maxChars ? parseInt(maxChars) : undefined;
      }
      const data = await callToolEndpoint('namestorm', payload);
      setResults(data);
      setExpandedCats(Object.fromEntries((data.categories_selected || []).slice(0, 2).map(c => [c, true])));
    } catch (err) { setError(err.message || 'Failed to generate names.'); }
  };

  const handleBlend = async () => {
    const filled = seedWords.filter(w => w.trim());
    if (filled.length < 2) { setError('Enter at least 2 seed words'); return; }
    if (!vibe.trim() && vibeChips.length === 0) { setError('Describe the vibe or select at least one vibe chip'); return; }
    setError(''); setResults(null); setFavorites(new Set()); setShowFavOnly(false);
    setAvailabilityResults({}); setMoreLikeResults({});
    try {
      const data = await callToolEndpoint('namestorm/blend', {
        seedWords: filled.map(w => w.trim()),
        vibe: vibe.trim(), vibeChips,
        constraints: constraints.trim() || null,
        industryContext: industryContext.trim() || null,
        primaryLanguage: primaryLanguage !== 'English' ? primaryLanguage : undefined,
        pairWithDomains,
        preferredTLDs: pairWithDomains && preferredTLDs.length > 0 ? preferredTLDs : undefined,
      });
      setResults(data);
      setExpandedCats(Object.fromEntries((data.categories_selected || []).slice(0, 2).map(c => [c, true])));
    } catch (err) { setError(err.message || 'Failed to generate blends.'); }
  };

  const handleCheckAvailability = useCallback(async (name) => {
    setCheckingName(name);
    try {
      const data = await callToolEndpoint('namestorm/check', {
        name,
        isDomainMode: category === 'Domain Name',
      });
      setAvailabilityResults(prev => ({ ...prev, [name]: data }));
    } catch (err) { console.error('Check failed:', err); }
    setCheckingName(null);
  }, [callToolEndpoint, category]);

  const handleMoreLike = useCallback(async (nameObj, catName) => {
    setMoreLikeLoading(nameObj.name);
    try {
      const data = await callToolEndpoint('namestorm/more', {
        name: nameObj.name,
        category,
        vibe: vibe.trim(),
        namingCategory: catName,
        whyItWorks: nameObj.why_it_works,
        isDomainMode: category === 'Domain Name',
        preferredTLDs: preferredTLDs.length > 0 ? preferredTLDs : undefined,
        primaryLanguage: primaryLanguage !== 'English' ? primaryLanguage : undefined,
      });
      setMoreLikeResults(prev => ({ ...prev, [nameObj.name]: data }));
    } catch (err) { console.error('More like failed:', err); }
    setMoreLikeLoading(null);
  }, [callToolEndpoint, category, vibe, preferredTLDs, primaryLanguage]);

  const reset = () => {
    setCategory(''); setVibe(''); setVibeChips([]); setConstraints('');
    setIndustryContext(''); setResults(null); setError('');
    setFavorites(new Set()); setShowFavOnly(false);
    setPreferredTLDs([]); setMaxChars(''); setPrimaryLanguage('English');
    setTargetLanguages([]); setSeedWords(['', '']); setPairWithDomains(false);
    setAvailabilityResults({}); setMoreLikeResults({});
  };

  const handleSubmit = mode === 'blend' ? handleBlend : handleGenerate;

  // ——— Build export text ———
  const buildFullText = () => {
    if (!results) return '';
    const lines = [`NAMESTORM RESULTS`, results.brief_summary || '', ''];
    if (results.top_picks?.length > 0) {
      lines.push('TOP PICKS');
      results.top_picks.forEach(p => lines.push(`${p.rank}. ${p.name} — ${p.why_top_pick}`));
      lines.push('');
    }
    if (favorites.size > 0) {
      lines.push('YOUR FAVORITES');
      [...favorites].forEach(n => lines.push(`⭐ ${n}`));
      lines.push('');
    }
    results.names_by_category?.forEach(cat => {
      lines.push(`— ${cat.category} —`);
      cat.names?.forEach(n => {
        lines.push(`  ${n.name}${n.pronunciation ? ` (${n.pronunciation})` : ''}`);
        if (n.why_it_works) lines.push(`    ${n.why_it_works}`);
        if (n.problems?.length > 0) n.problems.forEach(p => lines.push(`    ⚠ ${p.detail}`));
      });
      lines.push('');
    });
    lines.push('———', 'Generated by DeftBrain · deftbrain.com');
    return lines.join('\n');
  };

  const handlePrint = () => {
    const content = buildFullText();
    const pw = window.open('', '_blank');
    if (!pw) return;
    pw.document.write(`<!DOCTYPE html><html><head><title>NameStorm Results</title><style>body{font-family:Georgia,serif;max-width:700px;margin:40px auto;padding:0 20px;color:#1a1a1a;line-height:1.6;font-size:14px;}pre{white-space:pre-wrap;word-wrap:break-word;font-family:inherit;margin:0;}@media print{body{margin:20px;}}</style></head><body><pre>${content.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre></body></html>`);
    pw.document.close(); pw.focus(); setTimeout(() => pw.print(), 250);
  };

  const handleShare = async () => {
    const text = buildFullText();
    if (navigator.share) {
      try { await navigator.share({ title: 'NameStorm Results', text, url: window.location.href }); }
      catch (err) { if (err.name !== 'AbortError') console.error('Share failed:', err); }
    } else { copyToClipboard(text, 'share-fallback'); }
  };

  // ——— Problem badge ———
  const ProblemBadge = ({ problem }) => {
    const sevColor = problem.severity === 'warning' ? c.danger : problem.severity === 'caution' ? c.warning : c.info;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border ${sevColor}`}>
        {problem.severity === 'warning' ? <XCircle className="w-3 h-3" /> :
          problem.severity === 'caution' ? <AlertTriangle className="w-3 h-3" /> :
          <AlertCircle className="w-3 h-3" />}
        {problem.detail}
      </span>
    );
  };

  // ——— Availability display ———
  const AvailabilityDisplay = ({ data }) => {
    if (!data) return null;
    return (
      <div className={`mt-2 p-3 rounded-lg ${c.cardAlt} space-y-2`}>
        {data.domains && (
          <div>
            <p className={`text-xs font-bold ${c.textMuted} mb-1`}>DOMAINS</p>
            <div className="flex flex-wrap gap-1">
              {Object.entries(data.domains).map(([domain, status]) => (
                <span key={domain} className={`px-2 py-0.5 rounded text-xs font-mono border ${
                  status === 'likely_available' ? (isDark ? 'bg-green-900/30 border-green-700 text-green-300' : 'bg-green-50 border-green-300 text-green-700')
                  : status === 'taken' ? (isDark ? 'bg-red-900/20 border-red-800 text-red-400' : 'bg-red-50 border-red-200 text-red-500')
                  : (isDark ? 'bg-zinc-700 border-zinc-600 text-zinc-400' : 'bg-gray-100 border-gray-200 text-gray-400')
                }`}>{domain} {status === 'likely_available' ? '✓' : status === 'taken' ? '✗' : '?'}</span>
              ))}
            </div>
          </div>
        )}
        {data.social && (
          <div>
            <p className={`text-xs font-bold ${c.textMuted} mb-1`}>SOCIAL: {data.social.handle}</p>
            <div className="flex flex-wrap gap-1">
              {Object.entries(data.social.platforms).map(([platform, status]) => (
                <span key={platform} className={`px-2 py-0.5 rounded text-xs border ${
                  status === 'likely_available' ? (isDark ? 'bg-green-900/30 border-green-700 text-green-300' : 'bg-green-50 border-green-300 text-green-700')
                  : status === 'likely_taken' ? (isDark ? 'bg-red-900/20 border-red-800 text-red-400' : 'bg-red-50 border-red-200 text-red-500')
                  : (isDark ? 'bg-zinc-700 border-zinc-600 text-zinc-400' : 'bg-gray-100 border-gray-200 text-gray-400')
                }`}>{platform} {status === 'likely_available' ? '✓' : status === 'likely_taken' ? '✗' : '?'}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ——— Single name card ———
  const NameCard = ({ nameObj, catName }) => {
    const isFav = favorites.has(nameObj.name);
    const avail = availabilityResults[nameObj.name];
    const moreData = moreLikeResults[nameObj.name];
    const isChecking = checkingName === nameObj.name;
    const isMoreLoading = moreLikeLoading === nameObj.name;

    return (
      <div className={`p-4 rounded-lg border ${isFav ? (isDark ? 'border-amber-600 bg-amber-900/10' : 'border-amber-400 bg-amber-50/50') : c.border} ${c.card}`}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <h4 className={`text-base font-bold ${c.text} truncate`}>{nameObj.name}</h4>
            {nameObj.pronunciation && (
              <span className={`text-xs ${c.textMuted} font-mono flex-shrink-0`}>{nameObj.pronunciation}</span>
            )}
            {nameObj.clean && <CheckCircle className={`w-3.5 h-3.5 flex-shrink-0 ${isDark ? 'text-green-400' : 'text-green-500'}`} />}
          </div>
          <button onClick={() => toggleFav(nameObj.name)} className="flex-shrink-0">
            <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400 text-amber-400' : c.textMuted}`} />
          </button>
        </div>

        {/* Name DNA */}
        {nameObj.why_it_works && (
          <p className={`text-sm ${c.textSecondary} mb-2 leading-relaxed`}>{nameObj.why_it_works}</p>
        )}

        {/* Blend components (blend mode) */}
        {nameObj.blend_components && (
          <p className={`text-xs ${c.textMuted} mb-2 font-mono`}>{nameObj.blend_components}</p>
        )}

        {/* Domain extras */}
        {nameObj.verbal_form && (
          <p className={`text-xs ${c.textMuted} mb-1`}>Say it: "{nameObj.verbal_form}"</p>
        )}
        {nameObj.email_appearance && (
          <p className={`text-xs ${c.textMuted} mb-1 font-mono`}>{nameObj.email_appearance}</p>
        )}
        {nameObj.tld_rationale && (
          <p className={`text-xs ${c.textSecondary} mb-2 italic`}>TLD: {nameObj.tld_rationale}</p>
        )}

        {/* Domain note */}
        {nameObj.domain_note && (
          <p className={`text-xs ${c.textMuted} mb-2`}>🌐 {nameObj.domain_note}</p>
        )}

        {/* Problem flags */}
        {nameObj.problems?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {nameObj.problems.map((p, i) => <ProblemBadge key={i} problem={p} />)}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          <CopyBtn content={nameObj.name} field={`name-${nameObj.name}`} label="Copy" />
          <button onClick={() => handleCheckAvailability(nameObj.name)} disabled={isChecking || !!avail}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${avail ? (isDark ? 'bg-green-900/30 text-green-300' : 'bg-green-50 text-green-700') : c.btnSecondary}`}>
            {isChecking ? <Loader2 className="w-3 h-3 animate-spin" /> : <Globe className="w-3 h-3" />}
            {avail ? 'Checked' : isChecking ? 'Checking...' : 'Check Availability'}
          </button>
          <button onClick={() => handleMoreLike(nameObj, catName)} disabled={isMoreLoading || !!moreData}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${moreData ? (isDark ? 'bg-amber-900/30 text-amber-300' : 'bg-amber-50 text-amber-700') : c.btnSecondary}`}>
            {isMoreLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            {moreData ? 'Expanded' : isMoreLoading ? 'Generating...' : 'More Like This'}
          </button>
        </div>

        {/* Availability results */}
        {avail && <AvailabilityDisplay data={avail} />}

        {/* More Like This results */}
        {moreData && (
          <div className={`mt-3 p-3 rounded-lg ${c.cardAlt} space-y-2`}>
            {moreData.liked_name_dna && (
              <p className={`text-xs ${c.textMuted} italic mb-2`}>DNA: {moreData.liked_name_dna}</p>
            )}
            {moreData.variations?.map((v, i) => (
              <div key={i} className={`p-2 rounded border ${c.border}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-semibold ${c.text}`}>{v.name}</span>
                  <div className="flex gap-1">
                    {v.clean && <CheckCircle className={`w-3 h-3 ${isDark ? 'text-green-400' : 'text-green-500'}`} />}
                    <button onClick={() => toggleFav(v.name)}><Star className={`w-3 h-3 ${favorites.has(v.name) ? 'fill-amber-400 text-amber-400' : c.textMuted}`} /></button>
                    <CopyBtn content={v.name} field={`var-${v.name}`} label="" />
                  </div>
                </div>
                {v.why_it_works && <p className={`text-xs ${c.textSecondary} mt-1`}>{v.why_it_works}</p>}
                {v.problems?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {v.problems.map((p, j) => <ProblemBadge key={j} problem={p} />)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ——— Key handler for Enter ———
  const onKeySubmit = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !loading) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // ═══════════════════════════════ RENDER ═══════════════════════════════
  return (
    <div>
      <div className="mb-5">
        <h2 className={`text-2xl font-bold ${c.text}`}>{toolData?.title || 'NameStorm'} {toolData?.icon || '⚡'}</h2>
        <p className={`text-sm ${c.textMuted}`}>{toolData?.tagline || 'Name anything. Know it works before you commit.'}</p>
      </div>

      {/* ═══════════════ INPUT VIEW ═══════════════ */}
      {!results && (
        <div className="space-y-5">

          {/* Mode Toggle */}
          <div className="flex gap-2 flex-wrap">
            {[
              { id: 'generate', label: 'Generate Names', icon: Zap },
              { id: 'domain', label: 'Domain Storm', icon: Globe },
              { id: 'blend', label: 'Blend Mode', icon: Shuffle },
            ].map(m => (
              <button key={m.id} onClick={() => { setMode(m.id); if (m.id === 'domain') setCategory('Domain Name'); else if (category === 'Domain Name') setCategory(''); }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg border text-sm font-semibold transition-all ${c.chip(mode === m.id)}`}>
                <m.icon className="w-4 h-4" /> {m.label}
              </button>
            ))}
          </div>

          {/* Blend mode: seed words */}
          {mode === 'blend' && (
            <div className={`${c.card} rounded-xl shadow-lg p-6 space-y-3`}>
              <label className={`block font-semibold ${c.text} mb-1`}>Seed words to blend <span className="text-red-500">*</span></label>
              <p className={`text-xs ${c.textMuted} mb-2`}>Enter 2-5 concept words. We'll expand each into synonyms and blend across all of them.</p>
              {seedWords.map((w, idx) => (
                <div key={idx} className="flex gap-2">
                  <input type="text" value={w} onChange={(e) => {
                    const updated = [...seedWords]; updated[idx] = e.target.value; setSeedWords(updated);
                  }}
                    onKeyDown={onKeySubmit}
                    placeholder={`Seed word ${idx + 1}`}
                    className={`flex-1 p-3 border rounded-lg outline-none text-sm font-semibold focus:ring-2 focus:ring-amber-300 ${c.input}`} />
                  {seedWords.length > 2 && (
                    <button onClick={() => setSeedWords(seedWords.filter((_, i) => i !== idx))}
                      className={`p-2 rounded-lg ${c.btnSecondary}`}><X className="w-4 h-4" /></button>
                  )}
                </div>
              ))}
              {seedWords.length < 5 && (
                <button onClick={() => setSeedWords([...seedWords, ''])}
                  className={`flex items-center gap-1 text-sm ${c.textMuted}`}>
                  <Plus className="w-4 h-4" /> Add seed word
                </button>
              )}
              <label className={`flex items-center gap-2 text-sm ${c.textSecondary} mt-2`}>
                <input type="checkbox" checked={pairWithDomains} onChange={(e) => setPairWithDomains(e.target.checked)}
                  className="rounded" />
                Pair blends with domain TLDs
              </label>
            </div>
          )}

          {/* Category (not shown in domain or blend mode) */}
          {mode === 'generate' && (
            <div className={`${c.card} rounded-xl shadow-lg p-6`}>
              <label className={`block font-semibold ${c.text} mb-3`}>What needs a name? <span className="text-red-500">*</span></label>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <button key={cat.value} onClick={() => setCategory(cat.value)}
                    className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${c.chip(category === cat.value)}`}>
                    {cat.icon} {cat.value}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Vibe */}
          <div className={`${c.card} rounded-xl shadow-lg p-6`}>
            <label className={`block font-semibold ${c.text} mb-3`}>What's the vibe? <span className="text-red-500">*</span></label>
            <div className="flex flex-wrap gap-2 mb-3">
              {vibeOptions.map(v => (
                <button key={v} onClick={() => toggleChip(v)}
                  className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${c.chip(vibeChips.includes(v))}`}>
                  {v}
                </button>
              ))}
            </div>
            <input type="text" value={vibe} onChange={(e) => setVibe(e.target.value)}
              onKeyDown={onKeySubmit}
              placeholder="Describe the energy in your own words..."
              className={`w-full p-3 border rounded-xl outline-none text-sm focus:ring-2 focus:ring-amber-300 ${c.input}`} />
          </div>

          {/* Domain-mode extras */}
          {(mode === 'domain' || pairWithDomains) && (
            <div className={`${c.card} rounded-xl shadow-lg p-6 space-y-4`}>
              <p className={`text-xs font-bold uppercase tracking-wide ${c.textMuted}`}>Domain Options</p>
              <div>
                <label className={`block text-sm font-semibold ${c.text} mb-1`}>Preferred TLDs</label>
                <div className="flex gap-2">
                  <input type="text" value={tldInput} onChange={(e) => setTldInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTLD(); } }}
                    placeholder=".app, .io, .now..."
                    className={`flex-1 p-2 border rounded-lg outline-none text-sm ${c.input}`} />
                  <button onClick={addTLD} className={`px-3 py-2 rounded-lg text-sm font-medium ${c.btnSecondary}`}>Add</button>
                </div>
                {preferredTLDs.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {preferredTLDs.map(t => (
                      <span key={t} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border ${c.chip(true)}`}>
                        .{t} <button onClick={() => setPreferredTLDs(preferredTLDs.filter(x => x !== t))}><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {mode === 'domain' && (
                <div>
                  <label className={`block text-sm font-semibold ${c.text} mb-1`}>Max characters (name + TLD)</label>
                  <input type="number" value={maxChars} onChange={(e) => setMaxChars(e.target.value)}
                    placeholder="e.g., 10"
                    className={`w-32 p-2 border rounded-lg outline-none text-sm ${c.input}`} />
                </div>
              )}
            </div>
          )}

          {/* Language */}
          <div className={`${c.card} rounded-xl shadow-lg p-6 space-y-4`}>
            <p className={`text-xs font-bold uppercase tracking-wide ${c.textMuted}`}>Language & Context</p>
            <div>
              <label className={`block text-sm font-semibold ${c.text} mb-1`}>Primary audience language</label>
              <select value={primaryLanguage} onChange={(e) => setPrimaryLanguage(e.target.value)}
                className={`p-2 border rounded-lg outline-none text-sm ${c.input}`}>
                {languages.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className={`block text-sm font-semibold ${c.text} mb-1`}>Industry / Context</label>
              <input type="text" value={industryContext} onChange={(e) => setIndustryContext(e.target.value)}
                onKeyDown={onKeySubmit}
                placeholder="e.g., Fintech, organic skincare, indie game studio"
                className={`w-full p-3 border rounded-xl outline-none text-sm focus:ring-2 focus:ring-amber-300 ${c.input}`} />
            </div>
            <div>
              <label className={`block text-sm font-semibold ${c.text} mb-1`}>Constraints</label>
              <input type="text" value={constraints} onChange={(e) => setConstraints(e.target.value)}
                onKeyDown={onKeySubmit}
                placeholder="e.g., Under 8 letters, must start with S, no X's"
                className={`w-full p-3 border rounded-xl outline-none text-sm focus:ring-2 focus:ring-amber-300 ${c.input}`} />
            </div>
          </div>

          {/* Submit */}
          <button onClick={handleSubmit} disabled={loading}
            className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2 shadow-lg ${
              loading ? (isDark ? 'bg-zinc-700 text-zinc-400' : 'bg-gray-200 text-gray-400') : c.btnPrimary
            }`}>
            {loading ? (<><Loader2 className="w-5 h-5 animate-spin" /> Generating...</>)
              : (<><Zap className="w-5 h-5" /> {mode === 'blend' ? 'Blend These Words' : mode === 'domain' ? 'Storm Domains' : 'Storm Names'}</>)}
          </button>

          {error && (
            <div className={`p-4 rounded-xl flex items-start gap-3 ${c.danger} border`}>
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" /><p className="text-sm">{error}</p>
            </div>
          )}

          <p className={`text-xs text-center ${c.textMuted}`}>
            Have a name already? Use <strong>NameAudit</strong> to stress-test it across 12 dimensions.
          </p>
        </div>
      )}

      {/* ═══════════════ RESULTS VIEW ═══════════════ */}
      {results && (
        <div className="space-y-5">

          {/* Controls bar */}
          <div className={`${c.card} rounded-xl shadow-lg p-4 flex items-center justify-between flex-wrap gap-3`}>
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`text-sm font-semibold ${c.text}`}>
                {results.names_by_category?.reduce((sum, cat) => sum + (cat.names?.length || 0), 0) || 0} names generated
              </span>
              {favorites.size > 0 && (
                <button onClick={() => setShowFavOnly(!showFavOnly)}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${showFavOnly ? c.chip(true) : c.btnSecondary}`}>
                  <Star className={`w-3 h-3 ${showFavOnly ? 'fill-amber-400 text-amber-400' : ''}`} />
                  {favorites.size} favorite{favorites.size !== 1 ? 's' : ''}
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <CopyBtn content={buildFullText()} field="full-export" label="Copy All" />
              <button onClick={handlePrint} className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${c.btnSecondary}`}>
                <Printer className="w-3 h-3" /> Print
              </button>
              <button onClick={handleShare} className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${c.btnSecondary}`}>
                <Share2 className="w-3 h-3" /> Share
              </button>
              <button onClick={reset} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${isDark ? 'bg-amber-900/30 text-amber-300' : 'bg-amber-50 text-amber-700'}`}>
                <RefreshCw className="w-3.5 h-3.5" /> New Storm
              </button>
            </div>
          </div>

          {/* Brief summary */}
          {results.brief_summary && (
            <div className={`p-4 rounded-xl ${c.info} border`}>
              <p className={`text-sm ${c.textSecondary}`}>{results.brief_summary}</p>
            </div>
          )}

          {/* Top Picks */}
          {results.top_picks?.length > 0 && (
            <div className={`${c.card} rounded-xl shadow-lg p-6`}>
              <h3 className={`font-bold ${c.text} mb-4 flex items-center gap-2`}>
                <Zap className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-500'}`} /> Top Picks
              </h3>
              <div className="space-y-3">
                {results.top_picks.map((pick, idx) => (
                  <div key={idx} className={`p-3 rounded-lg border ${c.border} flex items-start gap-3`}>
                    <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      idx === 0 ? (isDark ? 'bg-amber-900/40 text-amber-300' : 'bg-amber-100 text-amber-700') : c.cardAlt + ' ' + c.textMuted
                    }`}>{pick.rank || idx + 1}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-base font-bold ${c.text}`}>{pick.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded border ${c.chip(false)}`}>{pick.from_category}</span>
                        <button onClick={() => toggleFav(pick.name)}>
                          <Star className={`w-3.5 h-3.5 ${favorites.has(pick.name) ? 'fill-amber-400 text-amber-400' : c.textMuted}`} />
                        </button>
                        <CopyBtn content={pick.name} field={`top-${pick.name}`} label="" />
                      </div>
                      <p className={`text-sm ${c.textSecondary} mt-1`}>{pick.why_top_pick}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Say It Out Loud */}
          {results.say_it_out_loud?.length > 0 && (
            <div className={`${c.card} rounded-xl shadow-lg p-6`}>
              <h3 className={`font-bold ${c.text} mb-3 flex items-center gap-2`}>
                <AlertTriangle className={`w-5 h-5 ${isDark ? 'text-orange-400' : 'text-orange-500'}`} /> Say It Out Loud
              </h3>
              <div className="space-y-2">
                {results.say_it_out_loud.map((item, idx) => (
                  <div key={idx} className={`p-2 rounded-lg ${c.warning} border flex items-start gap-2`}>
                    <span className="font-semibold text-sm">{item.name}:</span>
                    <span className="text-sm">{item.issue}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Seed expansion (blend mode) */}
          {results.seed_expansion?.length > 0 && (
            <div className={`${c.card} rounded-xl shadow-lg p-6`}>
              <h3 className={`font-bold ${c.text} mb-3 flex items-center gap-2`}>
                <Layers className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-500'}`} /> Seed Expansion
              </h3>
              <div className="flex flex-wrap gap-3">
                {results.seed_expansion.map((s, idx) => (
                  <div key={idx} className={`p-3 rounded-lg ${c.cardAlt}`}>
                    <p className={`text-xs font-bold ${c.textMuted} mb-1`}>{s.original}</p>
                    <div className="flex flex-wrap gap-1">
                      {s.expanded?.map((w, i) => (
                        <span key={i} className={`px-2 py-0.5 rounded text-xs border ${c.chip(false)}`}>{w}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Names by category */}
          {results.names_by_category?.map((cat, catIdx) => {
            const isOpen = expandedCats[cat.category];
            const names = showFavOnly ? cat.names?.filter(n => favorites.has(n.name)) : cat.names;
            if (showFavOnly && (!names || names.length === 0)) return null;

            return (
              <div key={catIdx} className={`${c.card} rounded-xl shadow-lg`}>
                <button onClick={() => setExpandedCats(prev => ({ ...prev, [cat.category]: !prev[cat.category] }))}
                  className={`w-full p-5 flex items-center justify-between ${c.text}`}>
                  <h3 className="font-bold flex items-center gap-2">
                    <Layers className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-500'}`} />
                    {cat.category}
                    <span className={`text-xs font-normal ${c.textMuted}`}>{cat.names?.length || 0} names</span>
                  </h3>
                  {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
                {isOpen && names && (
                  <div className="px-5 pb-5 space-y-3">
                    {names.map((nameObj, nIdx) => (
                      <NameCard key={nIdx} nameObj={nameObj} catName={cat.category} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Naming notes */}
          {results.naming_notes && (
            <div className={`p-4 rounded-xl ${c.cardAlt}`}>
              <p className={`text-xs font-bold ${c.textMuted} mb-1`}>NAMING NOTES</p>
              <p className={`text-sm ${c.textSecondary}`}>{results.naming_notes}</p>
            </div>
          )}

          {/* Cross-tool + disclaimer */}
          <p className={`text-xs text-center ${c.textMuted}`}>
            Found a favorite? Run it through <strong>NameAudit</strong> for a 12-dimension deep analysis before you commit.
          </p>
          <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-zinc-800/50' : 'bg-gray-50'}`}>
            <p className={`text-xs ${c.textMuted}`}>
              🔍 Domain and social checks are approximations via DNS — always confirm through official registrars. Problem flags are AI-generated — verify critical findings with native speakers.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

NameStorm.displayName = 'NameStorm';
export default NameStorm;
