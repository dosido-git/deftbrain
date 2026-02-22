import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  Loader2, AlertCircle, Copy, Check, ChevronDown, ChevronUp, RefreshCw, Printer, Share2,
  Zap, Globe, Star, Search, AlertTriangle, CheckCircle, XCircle, Sparkles, Layers,
  Hash, ExternalLink, ChevronRight, X, Plus, Shuffle, ArrowRight, BarChart3, Shield
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
    link: isDark ? 'text-cyan-400 hover:text-cyan-300 underline underline-offset-2' : 'text-cyan-600 hover:text-cyan-700 underline underline-offset-2',
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
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('namestorm:favorites');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });
  const [showFavOnly, setShowFavOnly] = useState(false);
  const [expandedCats, setExpandedCats] = useState({});
  const [copiedField, setCopiedField] = useState(null);

  // Persist favorites to localStorage
  useEffect(() => {
    try { localStorage.setItem('namestorm:favorites', JSON.stringify([...favorites])); }
    catch { /* storage full or unavailable */ }
  }, [favorites]);

  // Per-name actions
  const [checkingName, setCheckingName] = useState(null);
  const [availabilityResults, setAvailabilityResults] = useState({});
  const [moreLikeLoading, setMoreLikeLoading] = useState(null);
  const [moreLikeResults, setMoreLikeResults] = useState({});
  const [actionErrors, setActionErrors] = useState({}); // { 'name:check': 'msg', 'name:more': 'msg' }

  // Compare view
  const [showCompare, setShowCompare] = useState(false);
  const [compareSortBy, setCompareSortBy] = useState('order'); // order | problems | clean
  const [lastStarred, setLastStarred] = useState(null);
  const compareRef = useRef(null);

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
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
        setLastStarred(name);
        setTimeout(() => setLastStarred(null), 600);
      }
      return next;
    });
  };

  // ——— Collect full data for all favorited names ———
  const getFavoriteData = useMemo(() => {
    if (!results || favorites.size === 0) return [];

    const nameMap = {};

    // Collect from main results
    results.names_by_category?.forEach(cat => {
      cat.names?.forEach(n => {
        if (favorites.has(n.name)) {
          nameMap[n.name] = { ...n, _category: cat.category, _source: 'main' };
        }
      });
    });

    // Collect from "More Like This" expansions
    Object.entries(moreLikeResults).forEach(([parentName, moreData]) => {
      moreData.variations?.forEach(v => {
        if (favorites.has(v.name) && !nameMap[v.name]) {
          nameMap[v.name] = { ...v, _category: 'More Like: ' + parentName, _source: 'expansion' };
        }
      });
    });

    // Attach availability data
    Object.keys(nameMap).forEach(name => {
      if (availabilityResults[name]) {
        nameMap[name]._availability = availabilityResults[name];
      }
    });

    let data = Object.values(nameMap);

    // Sort
    if (compareSortBy === 'problems') {
      data.sort((a, b) => (a.problems?.length || 0) - (b.problems?.length || 0));
    } else if (compareSortBy === 'clean') {
      data.sort((a, b) => (b.clean ? 1 : 0) - (a.clean ? 1 : 0));
    }

    return data;
  }, [results, favorites, moreLikeResults, availabilityResults, compareSortBy]);

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
    setAvailabilityResults({}); setMoreLikeResults({}); setActionErrors({});
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
    } catch (err) {
      const msg = err.message || 'Failed to generate names.';
      setError(msg.includes('rate') || msg.includes('429') || msg.includes('too many')
        ? 'You\'re generating names too fast — wait a moment and try again.'
        : msg);
    }
  };

  const handleBlend = async () => {
    const filled = seedWords.filter(w => w.trim());
    if (filled.length < 2) { setError('Enter at least 2 seed words'); return; }
    if (!vibe.trim() && vibeChips.length === 0) { setError('Describe the vibe or select at least one vibe chip'); return; }
    setError(''); setResults(null); setFavorites(new Set()); setShowFavOnly(false);
    setAvailabilityResults({}); setMoreLikeResults({}); setActionErrors({});
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
    } catch (err) {
      const msg = err.message || 'Failed to generate blends.';
      setError(msg.includes('rate') || msg.includes('429') || msg.includes('too many')
        ? 'You\'re blending too fast — wait a moment and try again.'
        : msg);
    }
  };

  const handleCheckAvailability = useCallback(async (name) => {
    setCheckingName(name);
    setActionErrors(prev => { const n = { ...prev }; delete n[`${name}:check`]; return n; });
    try {
      const data = await callToolEndpoint('namestorm/check', {
        name,
        isDomainMode: category === 'Domain Name',
      });
      setAvailabilityResults(prev => ({ ...prev, [name]: data }));
    } catch (err) {
      console.error('Check failed:', err);
      setActionErrors(prev => ({ ...prev, [`${name}:check`]: err.message?.includes('rate') || err.message?.includes('429')
        ? 'Too many checks — wait a moment and try again'
        : 'Check failed — tap to retry'
      }));
    }
    setCheckingName(null);
  }, [callToolEndpoint, category]);

  const handleMoreLike = useCallback(async (nameObj, catName) => {
    setMoreLikeLoading(nameObj.name);
    setActionErrors(prev => { const n = { ...prev }; delete n[`${nameObj.name}:more`]; return n; });
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
    } catch (err) {
      console.error('More like failed:', err);
      setActionErrors(prev => ({ ...prev, [`${nameObj.name}:more`]: err.message?.includes('rate') || err.message?.includes('429')
        ? 'Too many requests — wait a moment and try again'
        : 'Generation failed — tap to retry'
      }));
    }
    setMoreLikeLoading(null);
  }, [callToolEndpoint, category, vibe, preferredTLDs, primaryLanguage]);

  const reset = () => {
    setCategory(''); setVibe(''); setVibeChips([]); setConstraints('');
    setIndustryContext(''); setResults(null); setError('');
    setFavorites(new Set()); setShowFavOnly(false);
    setPreferredTLDs([]); setMaxChars(''); setPrimaryLanguage('English');
    setTargetLanguages([]); setSeedWords(['', '']); setPairWithDomains(false);
    setAvailabilityResults({}); setMoreLikeResults({}); setActionErrors({});
    setShowCompare(false); setCompareSortBy('order');
  };

  const handleSubmit = mode === 'blend' ? handleBlend : handleGenerate;

  // ——— Pre-submit validation (controls disabled state) ———
  const canSubmit = (() => {
    if (loading) return false;
    const hasVibe = vibe.trim() || vibeChips.length > 0;
    if (mode === 'blend') {
      const filledSeeds = seedWords.filter(w => w.trim()).length;
      return filledSeeds >= 2 && hasVibe;
    }
    if (mode === 'domain') return hasVibe;
    return !!category && hasVibe;
  })();

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
    const checkError = actionErrors[`${nameObj.name}:check`];
    const moreError = actionErrors[`${nameObj.name}:more`];

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
          <button onClick={() => toggleFav(nameObj.name)} className="flex-shrink-0 transition-transform active:scale-125">
            <Star className={`w-4 h-4 transition-all duration-300 ${isFav ? 'fill-amber-400 text-amber-400 scale-110' : c.textMuted} ${lastStarred === nameObj.name ? 'animate-bounce' : ''}`} />
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
          <button onClick={() => handleCheckAvailability(nameObj.name)} disabled={isChecking || (!!avail && !checkError)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
              checkError ? (isDark ? 'bg-red-900/30 text-red-300' : 'bg-red-50 text-red-600')
              : avail ? (isDark ? 'bg-green-900/30 text-green-300' : 'bg-green-50 text-green-700')
              : c.btnSecondary
            }`}>
            {isChecking ? <Loader2 className="w-3 h-3 animate-spin" /> : checkError ? <AlertCircle className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
            {checkError ? 'Retry Check' : avail ? 'Checked' : isChecking ? 'Checking...' : 'Check Availability'}
          </button>
          <button onClick={() => handleMoreLike(nameObj, catName)} disabled={isMoreLoading || (!!moreData && !moreError)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
              moreError ? (isDark ? 'bg-red-900/30 text-red-300' : 'bg-red-50 text-red-600')
              : moreData ? (isDark ? 'bg-amber-900/30 text-amber-300' : 'bg-amber-50 text-amber-700')
              : c.btnSecondary
            }`}>
            {isMoreLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : moreError ? <AlertCircle className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
            {moreError ? 'Retry' : moreData ? 'Expanded' : isMoreLoading ? 'Generating...' : 'More Like This'}
          </button>
        </div>

        {/* Inline action errors */}
        {(checkError || moreError) && (
          <p className={`text-xs mt-1.5 ${isDark ? 'text-red-400' : 'text-red-500'}`}>
            {checkError || moreError}
          </p>
        )}

        {/* Availability results */}
        {avail && <AvailabilityDisplay data={avail} />}

        {/* More Like This results */}
        {moreData && (
          <div className={`mt-3 p-3 rounded-lg ${c.cardAlt} space-y-2`} style={{ animation: 'fadeSlideIn 0.4s ease-out' }}>
            {moreData.liked_name_dna && (
              <p className={`text-xs ${c.textMuted} italic mb-2`}>DNA: {moreData.liked_name_dna}</p>
            )}
            {moreData.variations?.map((v, i) => (
              <div key={i} className={`p-2 rounded border ${c.border}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-semibold ${c.text}`}>{v.name}</span>
                  <div className="flex gap-1">
                    {v.clean && <CheckCircle className={`w-3 h-3 ${isDark ? 'text-green-400' : 'text-green-500'}`} />}
                    <button onClick={() => toggleFav(v.name)} className="transition-transform active:scale-125"><Star className={`w-3 h-3 transition-all duration-300 ${favorites.has(v.name) ? 'fill-amber-400 text-amber-400' : c.textMuted} ${lastStarred === v.name ? 'animate-bounce' : ''}`} /></button>
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

  // ——— Domain availability summary for compare ———
  const domainSummary = (avail) => {
    if (!avail?.domains) return null;
    const available = Object.entries(avail.domains).filter(([, s]) => s === 'likely_available');
    const taken = Object.entries(avail.domains).filter(([, s]) => s === 'taken');
    return { available, taken, total: Object.keys(avail.domains).length };
  };

  // ——— Compare View ———
  const CompareView = () => {
    const data = getFavoriteData;
    if (data.length === 0) return null;

    return (
      <div ref={compareRef} className="space-y-5" style={{ animation: 'fadeSlideIn 0.3s ease-out' }}>
        {/* Compare header */}
        <div className={`${c.card} rounded-xl shadow-lg p-5`}>
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <h3 className={`font-bold ${c.text} flex items-center gap-2`}>
              <BarChart3 className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-500'}`} />
              Compare {data.length} Favorite{data.length !== 1 ? 's' : ''}
            </h3>
            <div className="flex items-center gap-2">
              <span className={`text-xs ${c.textMuted}`}>Sort by:</span>
              {[
                { id: 'order', label: 'Original' },
                { id: 'clean', label: 'Cleanest' },
                { id: 'problems', label: 'Fewest Issues' },
              ].map(s => (
                <button key={s.id} onClick={() => setCompareSortBy(s.id)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-all ${compareSortBy === s.id ? c.chip(true) : c.btnSecondary}`}>
                  {s.label}
                </button>
              ))}
              <button onClick={() => setShowCompare(false)}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${c.btnSecondary}`}>
                <X className="w-3 h-3" /> Close
              </button>
            </div>
          </div>

          {/* Compare grid */}
          <div className="space-y-3">
            {data.map((nameObj, idx) => {
              const avail = nameObj._availability;
              const ds = domainSummary(avail);
              const problemCount = nameObj.problems?.length || 0;
              const warnings = nameObj.problems?.filter(p => p.severity === 'warning').length || 0;
              const cautions = nameObj.problems?.filter(p => p.severity === 'caution').length || 0;

              return (
                <div key={nameObj.name} className={`p-4 rounded-xl border-2 transition-all ${
                  idx === 0 && compareSortBy !== 'order'
                    ? (isDark ? 'border-amber-500/40 bg-amber-900/10' : 'border-amber-400/40 bg-amber-50/50')
                    : `${c.border} ${c.card}`
                }`}>
                  {/* Row 1: Name + Status badges */}
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`text-lg font-bold ${c.text}`}>{nameObj.name}</span>
                      {nameObj.pronunciation && (
                        <span className={`text-xs ${c.textMuted} font-mono`}>{nameObj.pronunciation}</span>
                      )}
                      {nameObj.clean ? (
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs border ${c.success}`}>
                          <CheckCircle className="w-3 h-3" /> Clean
                        </span>
                      ) : (
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs border ${
                          warnings > 0 ? c.danger : c.warning
                        }`}>
                          {warnings > 0 ? <XCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                          {problemCount} issue{problemCount !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button onClick={() => toggleFav(nameObj.name)} className="transition-transform active:scale-125">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      </button>
                      <CopyBtn content={nameObj.name} field={`cmp-${nameObj.name}`} label="" />
                      <a href={`/NameAudit?name=${encodeURIComponent(nameObj.name)}`}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all ${
                          isDark ? 'bg-cyan-900/30 hover:bg-cyan-900/50 text-cyan-300 border border-cyan-700' : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200'
                        }`}>
                        <Shield className="w-3 h-3" /> Audit
                        <ArrowRight className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {/* Row 2: Category + DNA */}
                  <div className="flex items-start gap-3 mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded border flex-shrink-0 ${c.chip(false)}`}>
                      {nameObj._category}
                    </span>
                    {nameObj.why_it_works && (
                      <p className={`text-xs ${c.textSecondary} leading-relaxed line-clamp-2`}>{nameObj.why_it_works}</p>
                    )}
                  </div>

                  {/* Row 3: Domain + Problems detail */}
                  <div className="flex flex-wrap gap-2">
                    {ds && (
                      <div className="flex flex-wrap gap-1">
                        {ds.available.slice(0, 3).map(([domain]) => (
                          <span key={domain} className={`px-1.5 py-0.5 rounded text-xs font-mono border ${
                            isDark ? 'bg-green-900/30 border-green-700 text-green-300' : 'bg-green-50 border-green-300 text-green-700'
                          }`}>{domain} ✓</span>
                        ))}
                        {ds.available.length > 3 && (
                          <span className={`px-1.5 py-0.5 rounded text-xs ${c.textMuted}`}>+{ds.available.length - 3} more</span>
                        )}
                        {ds.available.length === 0 && (
                          <span className={`px-1.5 py-0.5 rounded text-xs border ${c.danger}`}>No domains found</span>
                        )}
                      </div>
                    )}
                    {!ds && (
                      <span className={`text-xs ${c.textMuted} italic`}>Domain not checked yet</span>
                    )}
                    {nameObj.problems?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {nameObj.problems.map((p, i) => <ProblemBadge key={i} problem={p} />)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom actions */}
          <div className={`flex items-center justify-between mt-4 pt-4 border-t ${c.border}`}>
            <p className={`text-xs ${c.textMuted}`}>
              Tip: Run your top pick through{' '}
              <a href="/NameAudit" className={c.link}>NameAudit</a>{' '}
              for a full 12-dimension analysis including trademark risk and cultural fit.
            </p>
            {data.length >= 2 && (
              <a href={`/NameAudit?compare=${encodeURIComponent(data.slice(0, 2).map(d => d.name).join(','))}`}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  isDark ? 'bg-cyan-900/30 hover:bg-cyan-900/50 text-cyan-300 border border-cyan-700' : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200'
                }`}>
                <Shield className="w-4 h-4" /> Compare Top 2 in NameAudit
                <ArrowRight className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ——— Favorites Tray (sticky bottom bar) ———
  const FavoritesTray = () => {
    if (!results || favorites.size === 0) return null;

    const favNames = getFavoriteData.map(d => d.name);

    return (
      <div className={`fixed bottom-0 left-0 right-0 z-40 border-t shadow-2xl transition-all duration-300 ${
        isDark ? 'bg-zinc-900/95 border-zinc-700 backdrop-blur-sm' : 'bg-white/95 border-gray-200 backdrop-blur-sm'
      }`} style={{ animation: 'traySlideUp 0.3s ease-out' }}>
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Fav count */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className={`text-sm font-semibold ${c.text}`}>{favorites.size}</span>
            </div>

            {/* Scrollable name chips */}
            <div className="flex-1 overflow-x-auto flex items-center gap-1.5 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
              {favNames.map(name => (
                <span key={name}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border flex-shrink-0 transition-all ${
                    c.chip(true)
                  } ${lastStarred === name ? 'animate-bounce' : ''}`}>
                  {name}
                  <button onClick={() => toggleFav(name)} className="hover:opacity-70">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            {/* Compare button */}
            {favorites.size >= 2 && (
              <button onClick={() => {
                setShowCompare(true);
                setTimeout(() => compareRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
              }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold flex-shrink-0 transition-all ${
                  isDark ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-amber-500 hover:bg-amber-600 text-white'
                }`}>
                <BarChart3 className="w-4 h-4" /> Compare
              </button>
            )}

            {/* Single audit button when only 1 fav */}
            {favorites.size === 1 && (
              <a href={`/NameAudit?name=${encodeURIComponent(favNames[0])}`}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold flex-shrink-0 transition-all ${
                  isDark ? 'bg-cyan-700 hover:bg-cyan-600 text-white' : 'bg-cyan-600 hover:bg-cyan-700 text-white'
                }`}>
                <Shield className="w-3.5 h-3.5" /> Audit in NameAudit
              </a>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════ RENDER ═══════════════════════════════
  return (
    <div style={{ paddingBottom: results && favorites.size > 0 ? '72px' : '0' }}>
      {/* CSS keyframes for animations */}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes traySlideUp {
          from { opacity: 0; transform: translateY(100%); }
          to { opacity: 1; transform: translateY(0); }
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
      <div className="mb-5">
        <h2 className={`text-2xl font-bold ${c.text}`}>{toolData?.title || 'NameStorm'} {toolData?.icon || '⚡'}</h2>
        <p className={`text-sm ${c.textMuted}`}>{toolData?.tagline || 'Name anything. Know it works before you commit.'}</p>
      </div>

      {/* ═══════════════ INPUT VIEW ═══════════════ */}
      {!results && (
        <div className="space-y-5">

          {/* Empty-state hook: show what the tool produces */}
          <div className={`rounded-xl border ${isDark ? 'border-amber-800/40 bg-gradient-to-r from-amber-900/15 to-zinc-800/50' : 'border-amber-200 bg-gradient-to-r from-amber-50/60 to-white'} p-4`}>
            <div className="flex items-start gap-3">
              <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-amber-900/40' : 'bg-amber-100'}`}>
                <Sparkles className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-semibold ${c.text} mb-1`}>What you'll get</p>
                <div className={`flex items-center gap-2 mb-1.5`}>
                  <span className={`text-base font-bold ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>Verdancy</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded border ${c.chip(false)}`}>Nature / Organic</span>
                  <CheckCircle className={`w-3.5 h-3.5 ${isDark ? 'text-green-400' : 'text-green-500'}`} />
                </div>
                <p className={`text-xs ${c.textSecondary} leading-relaxed`}>
                  Open vowels create warmth, the "-ancy" suffix implies abundance. Clean across 11 languages. <span className={`font-mono ${c.textMuted}`}>verdancy.co ✓</span>
                </p>
                <p className={`text-xs ${c.textMuted} mt-1.5 italic`}>
                  25-35 names per storm · problem-flagged in 10+ languages · domain & social checks · "More Like This" for any name you love
                </p>
              </div>
            </div>
          </div>

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
          <button onClick={handleSubmit} disabled={!canSubmit}
            className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2 shadow-lg ${
              !canSubmit ? (isDark ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed') : c.btnPrimary
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
            Already have a name? Run it through{' '}
            <a href="/NameAudit" className={c.link}>NameAudit</a>{' '}
            for a 12-dimension deep analysis before you commit.
          </p>
        </div>
      )}

      {/* ═══════════════ RESULTS VIEW ═══════════════ */}
      {results && (
        <div className="space-y-5">

          {/* Controls bar */}
          <div className={`${c.card} rounded-xl shadow-lg p-4 space-y-3`}>
            <div className="flex items-center justify-between flex-wrap gap-2">
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
              <button onClick={reset} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${isDark ? 'bg-amber-900/30 text-amber-300' : 'bg-amber-50 text-amber-700'}`}>
                <RefreshCw className="w-3.5 h-3.5" /> New Storm
              </button>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <CopyBtn content={buildFullText()} field="full-export" label="Copy All" />
              <button onClick={handlePrint} className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${c.btnSecondary}`}>
                <Printer className="w-3 h-3" /> Print
              </button>
              <button onClick={handleShare} className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${c.btnSecondary}`}>
                <Share2 className="w-3 h-3" /> Share
              </button>
            </div>
          </div>

          {/* Brief summary */}
          {results.brief_summary && (
            <div className={`p-4 rounded-xl ${c.info} border`}>
              <p className={`text-sm ${c.textSecondary}`}>{results.brief_summary}</p>
            </div>
          )}

          {/* Compare View (shown when triggered from favorites tray) */}
          {showCompare && <CompareView />}

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

          {/* Conditional cross-ref: suggest NameAudit when names have problems */}
          {(() => {
            const totalNames = results.names_by_category?.reduce((sum, cat) => sum + (cat.names?.length || 0), 0) || 0;
            const problemNames = results.names_by_category?.reduce((sum, cat) =>
              sum + (cat.names?.filter(n => n.problems?.length > 0).length || 0), 0) || 0;
            const hasProblems = problemNames > totalNames * 0.4;
            const hasFavorites = favorites.size > 0;

            if (hasProblems) return (
              <div className={`p-4 rounded-xl border ${c.warning} text-center`}>
                <p className={`text-sm`}>
                  ⚠️ Many names flagged with potential issues — run your top pick through{' '}
                  <a href="/NameAudit" className={c.link}>NameAudit</a>{' '}
                  for a full 12-dimension analysis before committing.
                </p>
              </div>
            );
            if (hasFavorites) return (
              <div className={`p-4 rounded-xl border ${c.info} text-center`}>
                <p className={`text-sm`}>
                  ⭐ You've starred {favorites.size} name{favorites.size !== 1 ? 's' : ''} — stress-test {favorites.size === 1 ? 'it' : 'your favorite'} with{' '}
                  <a href="/NameAudit" className={c.link}>NameAudit</a>{' '}
                  to check cultural fit, trademark risk, and domain landscape.
                </p>
              </div>
            );
            return null;
          })()}

          {/* Cross-tool + disclaimer */}
          <p className={`text-xs text-center ${c.textMuted}`}>
            Found a favorite? Stress-test it with{' '}
            <a href="/NameAudit" className={c.link}>NameAudit</a>{' '}
            before you commit.
          </p>
          <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-zinc-800/50' : 'bg-gray-50'}`}>
            <p className={`text-xs ${c.textMuted}`}>
              🔍 Domain and social checks are approximations via DNS — always confirm through official registrars. Problem flags are AI-generated — verify critical findings with native speakers.
            </p>
          </div>
        </div>
      )}

      {/* Sticky Favorites Tray */}
      <FavoritesTray />
    </div>
  );
};

NameStorm.displayName = 'NameStorm';
export default NameStorm;
