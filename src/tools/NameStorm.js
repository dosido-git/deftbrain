import React, { useState } from 'react';
import {
  Loader2, AlertCircle, Copy, Check, ChevronDown, ChevronUp, RefreshCw, Printer,
  Star, Zap, Globe, AlertTriangle, CheckCircle, Search, Sparkles, Volume2, Heart,
  ExternalLink, Shield, Hash, X, Share2, Lock
} from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';
import { getToolById } from '../data/tools';

const NameStorm = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const toolData = getToolById('NameStorm');

  // ─── Theme ───
  const c = {
    card: isDark ? 'bg-zinc-800' : 'bg-white',
    cardAlt: isDark ? 'bg-zinc-700/50' : 'bg-slate-50',
    text: isDark ? 'text-zinc-50' : 'text-gray-900',
    textSecondary: isDark ? 'text-zinc-300' : 'text-gray-600',
    textMuted: isDark ? 'text-zinc-500' : 'text-gray-400',
    input: isDark ? 'bg-zinc-700 border-zinc-600 text-zinc-100 placeholder-zinc-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400',
    btnPrimary: isDark ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-amber-600 hover:bg-amber-700 text-white',
    btnSecondary: isDark ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-100' : 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    border: isDark ? 'border-zinc-700' : 'border-gray-200',
    chip: (active) => active
      ? (isDark ? 'bg-amber-900/40 border-amber-500 text-amber-200' : 'bg-amber-100 border-amber-500 text-amber-800')
      : (isDark ? 'border-zinc-600 text-zinc-400 hover:border-zinc-500' : 'border-gray-200 text-gray-500 hover:border-gray-300'),
    tab: (active) => active
      ? (isDark ? 'bg-amber-900/30 border-amber-500 text-amber-200' : 'bg-amber-50 border-amber-500 text-amber-800')
      : (isDark ? 'border-zinc-700 text-zinc-500 hover:text-zinc-300' : 'border-gray-200 text-gray-400 hover:text-gray-600'),
    warning: isDark ? 'bg-amber-900/20 border-amber-700 text-amber-200' : 'bg-amber-50 border-amber-300 text-amber-800',
    danger: isDark ? 'bg-red-900/20 border-red-700 text-red-200' : 'bg-red-50 border-red-200 text-red-800',
    success: isDark ? 'bg-green-900/20 border-green-700 text-green-200' : 'bg-green-50 border-green-300 text-green-800',
    info: isDark ? 'bg-blue-900/20 border-blue-700 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-800',
    starActive: isDark ? 'text-amber-400' : 'text-amber-500',
    starInactive: isDark ? 'text-zinc-600' : 'text-gray-300',
  };

  // ─── Input State ───
  const [mode, setMode] = useState('generate'); // 'generate' | 'blend'
  const [category, setCategory] = useState('');
  const [vibe, setVibe] = useState('');
  const [vibeChips, setVibeChips] = useState([]);
  const [constraints, setConstraints] = useState('');
  const [industryContext, setIndustryContext] = useState('');

  // ─── Blend Mode State ───
  const [seedWords, setSeedWords] = useState(['', '', '', '']);
  const [pairWithDomains, setPairWithDomains] = useState(false);

  // ─── Results State ───
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState(0);
  const [favorites, setFavorites] = useState([]);
  const [copiedField, setCopiedField] = useState(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // ─── Availability Check State ───
  const [checkingName, setCheckingName] = useState(null);
  const [availabilityResults, setAvailabilityResults] = useState({});

  // ─── More Like This State ───
  const [moreLikeLoading, setMoreLikeLoading] = useState(null);
  const [moreLikeResults, setMoreLikeResults] = useState({});

  // ─── Domain Mode State ───
  const [preferredTLDs, setPreferredTLDs] = useState([]);
  const [tldInput, setTldInput] = useState('');
  const [targetLanguages, setTargetLanguages] = useState([]);
  const [maxChars, setMaxChars] = useState('');
  const [primaryLanguage, setPrimaryLanguage] = useState('English');

  // ─── Options ───
  const categories = [
    { value: 'Business', icon: '🏢' },
    { value: 'Product', icon: '📦' },
    { value: 'Band / Music Project', icon: '🎸' },
    { value: 'Pet', icon: '🐾' },
    { value: 'Baby', icon: '👶' },
    { value: 'Character (D&D/Fiction)', icon: '⚔️' },
    { value: 'Creative Project', icon: '🎨' },
    { value: 'Event', icon: '🎪' },
    { value: 'Domain Name', icon: '🌐' },
    { value: 'WiFi Network', icon: '📶' },
    { value: 'Social Media Handle', icon: '📱' },
    { value: 'Other', icon: '✨' },
  ];

  const vibeOptions = [
    'Playful', 'Sophisticated', 'Edgy', 'Warm', 'Techy', 'Earthy',
    'Luxurious', 'Nerdy', 'Minimalist', 'Rebellious', 'Whimsical',
    'Bold', 'Cozy', 'Mysterious', 'Friendly', 'Powerful',
  ];

  const tldOptions = [
    '.com', '.net', '.co', '.io', '.app', '.me', '.now', '.tips', '.guide',
    '.one', '.today', '.tools', '.space', '.run', '.how', '.fyi', '.live',
    '.works', '.care', '.plus', '.site', '.top', '.info', '.direct', '.fast',
    '.free', '.show', '.spot', '.talk', '.tech', '.world', '.win', '.you',
  ];

  const languageOptions = [
    'English', 'Spanish', 'German', 'French', 'Mandarin',
    'Portuguese', 'Italian', 'Japanese', 'Korean', 'Arabic', 'Hindi',
  ];

  // ─── Mode Helpers ───
  const isBlendMode = mode === 'blend';
  const isDomainMode = category === 'Domain Name' || (isBlendMode && pairWithDomains);
  const showIndustry = ['Business', 'Product', 'Domain Name'].includes(category) || isBlendMode;
  const showDomainFeatures = ['Business', 'Product', 'Band / Music Project', 'Creative Project', 'Event', 'Domain Name'].includes(category) || (isBlendMode && pairWithDomains);
  const filledSeeds = seedWords.filter(w => w.trim());

  // ─── Handlers ───
  const toggleVibe = (v) => setVibeChips(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);
  const toggleFavorite = (name) => setFavorites(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);

  const addCustomTLD = () => {
    const raw = tldInput.trim().toLowerCase().replace(/^\./, '');
    if (!raw) return;
    const tld = '.' + raw;
    if (!preferredTLDs.includes(tld)) setPreferredTLDs(prev => [...prev, tld]);
    setTldInput('');
  };

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

  const handleGenerate = async () => {
    if (isBlendMode) {
      if (filledSeeds.length < 2) { setError('Enter at least 2 seed words or concepts'); return; }
    } else {
      if (!category) { setError('Please select what needs a name'); return; }
    }
    if (!isBlendMode && !vibe.trim() && vibeChips.length === 0) { setError('Please describe the vibe or select at least one vibe chip'); return; }
    setError('');
    setResults(null);
    setFavorites([]);
    setAvailabilityResults({});
    setMoreLikeResults({});

    try {
      if (isBlendMode) {
        const payload = {
          seedWords: filledSeeds,
          vibe: vibe.trim() || null,
          vibeChips: vibeChips.length > 0 ? vibeChips : null,
          constraints: constraints.trim() || null,
          industryContext: industryContext.trim() || null,
          primaryLanguage: primaryLanguage !== 'English' ? primaryLanguage : null,
          pairWithDomains,
          preferredTLDs: pairWithDomains && preferredTLDs.length > 0 ? preferredTLDs : null,
        };
        const data = await callToolEndpoint('namestorm/blend', payload);
        setResults(data);
        setActiveCategory(0);
      } else {
        const payload = {
          category,
          vibe: vibe.trim() || null,
          vibeChips: vibeChips.length > 0 ? vibeChips : null,
          constraints: constraints.trim() || null,
          industryContext: industryContext.trim() || null,
          primaryLanguage: primaryLanguage !== 'English' ? primaryLanguage : null,
        };
        if (isDomainMode) {
          payload.preferredTLDs = preferredTLDs.length > 0 ? preferredTLDs : null;
          payload.targetLanguages = targetLanguages.length > 0 ? targetLanguages : null;
          payload.maxChars = maxChars ? parseInt(maxChars) : null;
        }
        const data = await callToolEndpoint('namestorm', payload);
        setResults(data);
        setActiveCategory(0);
      }
    } catch (err) {
      setError(err.message || 'Failed to generate names. Please try again.');
    }
  };

  const handleCheckAvailability = async (name) => {
    if (checkingName) return;
    setCheckingName(name);
    try {
      const data = await callToolEndpoint('namestorm/check', { name, isDomainMode });
      setAvailabilityResults(prev => ({ ...prev, [name]: data }));
    } catch (err) {
      setAvailabilityResults(prev => ({ ...prev, [name]: { error: true } }));
    }
    setCheckingName(null);
  };

  const handleMoreLike = async (nameObj, categoryName) => {
    const key = nameObj.name;
    if (moreLikeLoading) return;
    setMoreLikeLoading(key);
    try {
      const data = await callToolEndpoint('namestorm/more', {
        name: nameObj.name,
        category,
        vibe: [vibeChips.join(', '), vibe].filter(Boolean).join('. '),
        namingCategory: categoryName,
        whyItWorks: nameObj.why_it_works,
        isDomainMode,
        preferredTLDs: isDomainMode && preferredTLDs.length > 0 ? preferredTLDs : null,
        primaryLanguage: primaryLanguage !== 'English' ? primaryLanguage : null,
      });
      setMoreLikeResults(prev => ({ ...prev, [key]: data }));
    } catch (err) {
      console.error('More like this failed:', err);
    }
    setMoreLikeLoading(null);
  };

  const reset = () => {
    setCategory(''); setVibe(''); setVibeChips([]); setConstraints(''); setIndustryContext('');
    setResults(null); setError(''); setFavorites([]);
    setAvailabilityResults({}); setMoreLikeResults({});
    setPreferredTLDs([]); setTargetLanguages([]); setMaxChars(''); setPrimaryLanguage('English'); setTldInput('');
    setSeedWords(['', '', '', '']); setPairWithDomains(false);
  };

  const buildFullText = () => {
    if (!results) return '';
    const lines = [
      isBlendMode ? `NAMESTORM BLEND — Seeds: ${filledSeeds.join(' + ')}` : `NAMESTORM ${isDomainMode ? 'DOMAINS' : ''} — ${category}`,
      `Vibe: ${vibeChips.join(', ')}${vibe ? ' — ' + vibe : ''}`,
      ''
    ];
    if (results.seed_expansion?.length > 0) {
      lines.push('SEED EXPANSION');
      results.seed_expansion.forEach(s => {
        const expanded = Array.isArray(s.expanded) ? s.expanded.join(', ') : s.expanded;
        lines.push(`  ${s.original} → ${expanded}`);
      });
      lines.push('');
    }
    if (results.top_picks?.length > 0) {
      lines.push('TOP PICKS');
      results.top_picks.forEach((p, i) => lines.push(`${i + 1}. ${p.name} — ${p.why_top_pick}`));
      lines.push('');
    }
    results.names_by_category?.forEach(cat => {
      lines.push(`═══ ${cat.category.toUpperCase()} ═══`);
      cat.names.forEach(n => {
        lines.push(`${favorites.includes(n.name) ? '★ ' : ''}${n.name}${n.pronunciation ? ` (${n.pronunciation})` : ''}`);
        if (n.verbal_form) lines.push(`  🗣️ "${n.verbal_form}"${n.email_appearance ? `  ✉️ ${n.email_appearance}` : ''}`);
        if (n.tld_rationale) lines.push(`  🔗 ${n.tld_rationale}`);
        lines.push(`  ${n.why_it_works}`);
        if (Array.isArray(n.problems) && n.problems.length > 0) n.problems.forEach(p => lines.push(`  \u26A0 ${p.detail}`));
        if (n.domain_note) lines.push(`  🌐 ${n.domain_note}`);
        lines.push('');
      });
    });
    if (favorites.length > 0) {
      lines.push('FAVORITES: ' + favorites.join(', '));
    }
    return lines.join('\n');
  };

  const handlePrint = () => {
    const content = buildFullText();
    const pw = window.open('', '_blank');
    if (!pw) return;
    pw.document.write(`<!DOCTYPE html><html><head><title>NameStorm — ${category}</title><style>body{font-family:Georgia,serif;max-width:700px;margin:40px auto;padding:0 20px;color:#1a1a1a;line-height:1.6;font-size:14px;}pre{white-space:pre-wrap;word-wrap:break-word;font-family:inherit;margin:0;}@media print{body{margin:20px;}}</style></head><body><pre>${content.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre></body></html>`);
    pw.document.close(); pw.focus(); setTimeout(() => pw.print(), 250);
  };

  const handleShare = async () => {
    const text = buildFullText();
    if (navigator.share) {
      try { await navigator.share({ title: 'NameStorm Results', text, url: window.location.href }); }
      catch (err) { if (err.name !== 'AbortError') console.error('Share failed:', err); }
    } else { copyToClipboard(text, 'share-fallback'); }
  };

  // Problem severity colors
  const severityStyle = (sev) => {
    if (sev === 'warning') return c.danger;
    if (sev === 'caution') return c.warning;
    return c.info;
  };

  // ─── Name Card Component ───
  const NameCard = ({ nameObj, categoryName, compact = false }) => {
    const isFav = favorites.includes(nameObj.name);
    const avail = availabilityResults[nameObj.name];
    const moreData = moreLikeResults[nameObj.name];
    const isChecking = checkingName === nameObj.name;
    const isLoadingMore = moreLikeLoading === nameObj.name;

    return (
      <div className={`p-4 rounded-xl border transition-all ${isFav ? (isDark ? 'border-amber-600 bg-amber-900/10' : 'border-amber-400 bg-amber-50/50') : c.border} ${c.card}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className={`text-lg font-bold ${c.text}`}>{nameObj.name}</h4>
              {nameObj.pronunciation && (
                <span className={`text-xs font-mono ${c.textMuted}`}>/{nameObj.pronunciation}/</span>
              )}
              {nameObj.clean && <CheckCircle className={`w-4 h-4 flex-shrink-0 ${isDark ? 'text-green-400' : 'text-green-500'}`} />}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={() => copyToClipboard(nameObj.name, `name-${nameObj.name}`)}
              className={`p-1.5 rounded-lg transition-all ${c.btnSecondary}`} title="Copy name">
              {copiedField === `name-${nameObj.name}` ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button onClick={() => toggleFavorite(nameObj.name)}
              className="p-1.5 rounded-lg transition-all" title={isFav ? 'Remove from favorites' : 'Add to favorites'}>
              <Star className={`w-4 h-4 ${isFav ? c.starActive + ' fill-current' : c.starInactive}`} />
            </button>
          </div>
        </div>

        {/* Blend components */}
        {nameObj.blend_components && (
          <p className={`text-xs ${isDark ? 'text-purple-300' : 'text-purple-600'} mt-1.5 font-medium`}>
            {nameObj.blend_components}
          </p>
        )}

        {/* Why it works */}
        <p className={`text-sm ${c.textSecondary} mt-2 leading-relaxed`}>{nameObj.why_it_works}</p>

        {/* Domain-specific details */}
        {nameObj.tld_rationale && (
          <div className={`mt-2 flex flex-wrap gap-x-4 gap-y-1`}>
            {nameObj.verbal_form && (
              <span className={`text-xs ${c.textMuted}`}>🗣️ <span className="font-medium">"{nameObj.verbal_form}"</span></span>
            )}
            {nameObj.email_appearance && (
              <span className={`text-xs font-mono ${c.textMuted}`}>✉️ {nameObj.email_appearance}</span>
            )}
          </div>
        )}
        {nameObj.tld_rationale && (
          <p className={`text-xs ${c.textMuted} mt-1`}>🔗 <span className="italic">{nameObj.tld_rationale}</span></p>
        )}

        {/* Problem Flags */}
        {Array.isArray(nameObj.problems) && nameObj.problems.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {nameObj.problems.map((prob, i) => (
              <span key={i} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${severityStyle(prob.severity)}`}>
                <AlertTriangle className="w-3 h-3" /> {prob.detail}
              </span>
            ))}
          </div>
        )}

        {/* Domain Note */}
        {nameObj.domain_note && showDomainFeatures && (
          <p className={`text-xs ${c.textMuted} mt-2`}>🌐 {nameObj.domain_note}</p>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {showDomainFeatures && (
            <button onClick={() => handleCheckAvailability(nameObj.name)} disabled={isChecking || !!avail}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${avail ? (isDark ? 'bg-zinc-700 text-zinc-400' : 'bg-gray-100 text-gray-400') : c.btnSecondary}`}>
              {isChecking ? <Loader2 className="w-3 h-3 animate-spin" /> : <Globe className="w-3 h-3" />}
              {avail ? 'Checked' : isChecking ? 'Checking...' : isDomainMode ? 'Check Domain' : 'Check Availability'}
              {!avail && !isChecking && <span className={`text-[9px] px-1 py-0.5 rounded font-bold ${isDark ? 'bg-amber-900/50 text-amber-300' : 'bg-amber-100 text-amber-700'}`}>PRO</span>}
            </button>
          )}
          <button onClick={() => handleMoreLike(nameObj, categoryName)} disabled={isLoadingMore || !!moreData}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${moreData ? (isDark ? 'bg-zinc-700 text-zinc-400' : 'bg-gray-100 text-gray-400') : c.btnSecondary}`}>
            {isLoadingMore ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            {moreData ? 'See below' : isLoadingMore ? 'Generating...' : 'More Like This'}
            {!moreData && !isLoadingMore && <span className={`text-[9px] px-1 py-0.5 rounded font-bold ${isDark ? 'bg-amber-900/50 text-amber-300' : 'bg-amber-100 text-amber-700'}`}>PRO</span>}
          </button>
        </div>

        {/* Availability Results */}
        {avail && !avail.error && (
          <div className={`mt-3 p-3 rounded-lg ${c.cardAlt} space-y-2`}>
            <p className={`text-xs font-bold ${c.textMuted}`}>{isDomainMode ? 'DOMAIN & COMPETING TLDs' : 'DOMAIN AVAILABILITY'}</p>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(avail.domains || {}).sort(([a], [b]) => {
                // In domain mode, put the exact domain first
                if (isDomainMode && nameObj.name) {
                  const exactDomain = nameObj.name.toLowerCase();
                  if (a === exactDomain) return -1;
                  if (b === exactDomain) return 1;
                }
                return 0;
              }).map(([domain, status]) => {
                const isExact = isDomainMode && domain === nameObj.name?.toLowerCase();
                return (
                  <span key={domain} className={`px-2 py-0.5 rounded text-xs font-mono border ${
                    isExact
                      ? (status === 'likely_available'
                        ? (isDark ? 'bg-green-900/50 border-green-500 text-green-200 ring-1 ring-green-500' : 'bg-green-100 border-green-500 text-green-800 ring-1 ring-green-500')
                        : status === 'taken'
                        ? (isDark ? 'bg-red-900/40 border-red-500 text-red-200 ring-1 ring-red-500' : 'bg-red-100 border-red-500 text-red-800 ring-1 ring-red-500')
                        : (isDark ? 'bg-zinc-700 border-zinc-500 text-zinc-300 ring-1 ring-zinc-500' : 'bg-gray-200 border-gray-400 text-gray-600 ring-1 ring-gray-400'))
                      : (status === 'likely_available' ? (isDark ? 'bg-green-900/30 border-green-700 text-green-300' : 'bg-green-50 border-green-300 text-green-700')
                        : status === 'taken' ? (isDark ? 'bg-red-900/20 border-red-800 text-red-400' : 'bg-red-50 border-red-200 text-red-500')
                        : (isDark ? 'bg-zinc-700 border-zinc-600 text-zinc-400' : 'bg-gray-100 border-gray-200 text-gray-400'))
                  }`}>
                    {isExact && '→ '}{domain} {status === 'likely_available' ? '✓' : status === 'taken' ? '✗' : '?'}
                  </span>
                );
              })}
            </div>
            {avail.social && (
              <>
                <p className={`text-xs font-bold ${c.textMuted} mt-2`}>SOCIAL: {avail.social.handle}</p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(avail.social.platforms || {}).map(([platform, status]) => (
                    <span key={platform} className={`px-2 py-0.5 rounded text-xs border ${
                      status === 'likely_available' ? (isDark ? 'bg-green-900/30 border-green-700 text-green-300' : 'bg-green-50 border-green-300 text-green-700')
                      : status === 'likely_taken' ? (isDark ? 'bg-red-900/20 border-red-800 text-red-400' : 'bg-red-50 border-red-200 text-red-500')
                      : (isDark ? 'bg-zinc-700 border-zinc-600 text-zinc-400' : 'bg-gray-100 border-gray-200 text-gray-400')
                    }`}>
                      {platform} {status === 'likely_available' ? '✓' : status === 'likely_taken' ? '✗' : '?'}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* More Like This Results */}
        {moreData && moreData.variations && (
          <div className={`mt-3 p-3 rounded-lg ${c.cardAlt} space-y-2`}>
            <p className={`text-xs font-bold ${c.textMuted}`}>MORE LIKE "{nameObj.name.toUpperCase()}"</p>
            {moreData.liked_name_dna && <p className={`text-xs ${c.textSecondary} italic mb-2`}>{moreData.liked_name_dna}</p>}
            <div className="space-y-2">
              {moreData.variations.map((v, i) => (
                <div key={i} className={`flex items-start justify-between gap-2 p-2 rounded-lg ${isDark ? 'bg-zinc-800' : 'bg-white'}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-sm ${c.text}`}>{v.name}</span>
                      {v.pronunciation && <span className={`text-xs font-mono ${c.textMuted}`}>/{v.pronunciation}/</span>}
                      {v.clean && <CheckCircle className={`w-3 h-3 ${isDark ? 'text-green-400' : 'text-green-500'}`} />}
                    </div>
                    <p className={`text-xs ${c.textSecondary} mt-0.5`}>{v.why_it_works}</p>
                    {v.tld_rationale && (
                      <p className={`text-[10px] ${c.textMuted} mt-0.5 italic`}>🔗 {v.tld_rationale}</p>
                    )}
                    {Array.isArray(v.problems) && v.problems.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {v.problems.map((p, j) => (
                          <span key={j} className={`text-[10px] px-1.5 py-0.5 rounded border ${severityStyle(p.severity)}`}>
                            ⚠ {p.detail}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => copyToClipboard(v.name, `more-${v.name}`)} className={`p-1 rounded ${c.btnSecondary}`}>
                      {copiedField === `more-${v.name}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </button>
                    <button onClick={() => toggleFavorite(v.name)} className="p-1 rounded">
                      <Star className={`w-3 h-3 ${favorites.includes(v.name) ? c.starActive + ' fill-current' : c.starInactive}`} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ─── RENDER ───
  return (
    <div>
      <div className="mb-5">
        <h2 className={`text-2xl font-bold ${c.text}`}>{toolData?.title || 'NameStorm'} {toolData?.icon || '⚡'}</h2>
        <p className={`text-sm ${c.textMuted}`}>{toolData?.tagline || 'AI-powered name generation with cultural and linguistic problem flagging'}</p>
      </div>

      {/* ═══════════════ INPUT VIEW ═══════════════ */}
      {!results && (
        <div className="space-y-5">

          {/* Mode Toggle */}
          <div className="flex gap-2">
            <button onClick={() => { setMode('generate'); setCategory(''); }}
              className={`flex-1 py-3 px-4 rounded-xl border text-sm font-semibold transition-all flex items-center justify-center gap-2 ${c.tab(mode === 'generate')}`}>
              <Zap className="w-4 h-4" /> Generate
            </button>
            <button onClick={() => { setMode('blend'); setCategory(''); }}
              className={`flex-1 py-3 px-4 rounded-xl border text-sm font-semibold transition-all flex items-center justify-center gap-2 ${c.tab(mode === 'blend')}`}>
              <Sparkles className="w-4 h-4" /> Blend <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${isDark ? 'bg-amber-900/50 text-amber-300 border border-amber-700' : 'bg-amber-100 text-amber-700 border border-amber-300'}`}>PRO</span>
            </button>
          </div>

          {/* Generate Mode: Category */}
          {!isBlendMode && (
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

          {/* Blend Mode: Seed Words */}
          {isBlendMode && (
            <div className={`${c.card} rounded-xl shadow-lg p-6 space-y-4`}>
              <div>
                <label className={`block font-semibold ${c.text} mb-1`}>Seed words or concepts <span className="text-red-500">*</span> <span className={`font-normal text-xs ${c.textMuted}`}>(2-4 ingredients to blend)</span></label>
                <p className={`text-xs ${c.textMuted} mb-3`}>Enter the ideas you want mashed together. The AI will also expand each word into synonyms and related words before blending.</p>
                <div className="grid grid-cols-2 gap-2">
                  {seedWords.map((word, idx) => (
                    <input key={idx} type="text" value={word}
                      onChange={(e) => setSeedWords(prev => prev.map((w, i) => i === idx ? e.target.value : w))}
                      placeholder={['e.g., clever', 'e.g., toolkit', 'e.g., speed (optional)', 'e.g., friendly (optional)'][idx]}
                      className={`p-3 border rounded-xl outline-none text-sm focus:ring-2 focus:ring-amber-300 ${c.input}`} />
                  ))}
                </div>
              </div>

              {/* Pair with domains toggle */}
              <div className="flex items-center gap-3">
                <button onClick={() => setPairWithDomains(!pairWithDomains)}
                  className={`relative w-11 h-6 rounded-full transition-all ${pairWithDomains ? (isDark ? 'bg-amber-600' : 'bg-amber-500') : (isDark ? 'bg-zinc-600' : 'bg-gray-300')}`}>
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${pairWithDomains ? 'left-5.5' : 'left-0.5'}`}
                    style={{ left: pairWithDomains ? '22px' : '2px' }} />
                </button>
                <span className={`text-sm ${c.text}`}>Pair blends with domain TLDs</span>
              </div>
            </div>
          )}

          {/* Vibe */}
          <div className={`${c.card} rounded-xl shadow-lg p-6 space-y-4`}>
            <div>
              <label className={`block font-semibold ${c.text} mb-3`}>What vibe are you going for? {!isBlendMode && <span className="text-red-500">*</span>}{isBlendMode && <span className={`font-normal text-xs ${c.textMuted}`}>(optional — steers the blend's personality)</span>}</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {vibeOptions.map(v => (
                  <button key={v} onClick={() => toggleVibe(v)}
                    className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${c.chip(vibeChips.includes(v))}`}>
                    {v}
                  </button>
                ))}
              </div>
              <textarea
                value={vibe}
                onChange={(e) => setVibe(e.target.value)}
                placeholder={isBlendMode ? "Optional: describe the personality you want the blended names to have..." : isDomainMode ? "Describe the feeling you want the domain to convey — e.g., clever but approachable, works across English and Spanish..." : "Describe the feeling, personality, or energy you want the name to convey..."}
                rows={3}
                className={`w-full p-3 border rounded-xl outline-none text-sm resize-y focus:ring-2 focus:ring-amber-300 ${c.input}`}
              />
            </div>
          </div>

          {/* Constraints + Industry + Language */}
          <div className={`${c.card} rounded-xl shadow-lg p-6 space-y-4`}>
            <p className={`text-xs font-bold uppercase tracking-wide ${c.textMuted}`}>Optional refinements</p>
            <div>
              <label className={`block text-sm font-semibold ${c.text} mb-1`}>Constraints</label>
              <input type="text" value={constraints} onChange={(e) => setConstraints(e.target.value)}
                placeholder={isDomainMode ? "e.g., No more than 8 characters, must end in a vowel, avoid 'th' sounds" : "e.g., Must be under 8 letters, needs to start with 'S', no hard consonants"}
                className={`w-full p-3 border rounded-xl outline-none text-sm focus:ring-2 focus:ring-amber-300 ${c.input}`} />
            </div>
            {showIndustry && (
              <div>
                <label className={`block text-sm font-semibold ${c.text} mb-1`}>Industry / Context</label>
                <input type="text" value={industryContext} onChange={(e) => setIndustryContext(e.target.value)}
                  placeholder={isDomainMode ? "e.g., Consumer AI tools, productivity, daily problem-solving" : "e.g., Sustainable fashion, B2B SaaS, artisan coffee"}
                  className={`w-full p-3 border rounded-xl outline-none text-sm focus:ring-2 focus:ring-amber-300 ${c.input}`} />
              </div>
            )}

            {/* Primary audience language */}
            <div>
              <label className={`block text-sm font-semibold ${c.text} mb-2`}>Primary audience language</label>
              <p className={`text-xs ${c.textMuted} mb-2`}>Names will be generated to resonate with speakers of this language first</p>
              <div className="flex flex-wrap gap-1.5">
                {languageOptions.map(lang => (
                  <button key={`primary-${lang}`} onClick={() => setPrimaryLanguage(lang)}
                    className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${c.chip(primaryLanguage === lang)}`}>
                    {lang}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Domain-specific inputs */}
          {(isDomainMode || (isBlendMode && pairWithDomains)) && (
            <div className={`${c.card} rounded-xl shadow-lg p-6 space-y-4`}>
              <p className={`text-xs font-bold uppercase tracking-wide ${c.textMuted}`}>Domain preferences</p>

              {/* Preferred TLDs */}
              <div>
                <label className={`block text-sm font-semibold ${c.text} mb-2`}>Preferred TLDs <span className={`font-normal ${c.textMuted}`}>(select any — leave blank for all)</span></label>
                <div className="flex flex-wrap gap-1.5">
                  {tldOptions.map(tld => (
                    <button key={tld} onClick={() => setPreferredTLDs(prev => prev.includes(tld) ? prev.filter(t => t !== tld) : [...prev, tld])}
                      className={`px-2.5 py-1 rounded-lg border text-xs font-mono font-medium transition-all ${c.chip(preferredTLDs.includes(tld))}`}>
                      {tld}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <input type="text" value={tldInput} onChange={(e) => setTldInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomTLD(); } }}
                    placeholder="Other TLD, e.g. .xyz"
                    className={`flex-1 max-w-[200px] p-2 border rounded-lg outline-none text-xs font-mono ${c.input}`} />
                  <button onClick={addCustomTLD} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${c.btnSecondary}`}>Add</button>
                </div>
                {preferredTLDs.filter(t => !tldOptions.includes(t)).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {preferredTLDs.filter(t => !tldOptions.includes(t)).map(tld => (
                      <span key={tld} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-mono font-medium ${c.chip(true)}`}>
                        {tld} <button onClick={() => setPreferredTLDs(prev => prev.filter(t => t !== tld))}><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                )}
                {preferredTLDs.length > 0 && (
                  <button onClick={() => setPreferredTLDs([])} className={`mt-2 text-xs ${c.textMuted} hover:underline`}>Clear TLD selection</button>
                )}
              </div>

              {/* Target languages */}
              <div>
                <label className={`block text-sm font-semibold ${c.text} mb-2`}>Also sound good in <span className={`font-normal ${c.textMuted}`}>(secondary languages, optional)</span></label>
                <div className="flex flex-wrap gap-1.5">
                  {languageOptions.map(lang => (
                    <button key={lang} onClick={() => setTargetLanguages(prev => prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang])}
                      className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${c.chip(targetLanguages.includes(lang))}`}>
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              {/* Max characters */}
              <div>
                <label className={`block text-sm font-semibold ${c.text} mb-1`}>Max total characters <span className={`font-normal ${c.textMuted}`}>(name + dot + TLD)</span></label>
                <input type="number" value={maxChars} onChange={(e) => setMaxChars(e.target.value)}
                  placeholder="e.g., 10"
                  min="4" max="30"
                  className={`w-24 p-3 border rounded-xl outline-none text-sm focus:ring-2 focus:ring-amber-300 ${c.input}`} />
              </div>
            </div>
          )}

          {/* Submit */}
          <button onClick={handleGenerate} disabled={loading || (isBlendMode ? filledSeeds.length < 2 : (!category || (!vibe.trim() && vibeChips.length === 0)))}
            className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2 shadow-lg ${
              loading ? (isDark ? 'bg-zinc-700 text-zinc-400' : 'bg-gray-200 text-gray-400') : c.btnPrimary
            }`}>
            {loading ? (<><Loader2 className="w-5 h-5 animate-spin" /> {isBlendMode ? 'Blending names...' : isDomainMode ? 'Brainstorming domains...' : 'Brainstorming names...'}</>)
              : (<><Zap className="w-5 h-5" /> {isBlendMode ? 'Blend Names' : isDomainMode ? 'Storm Domains' : 'Storm Names'}</>)}
          </button>

          {error && (
            <div className={`p-4 rounded-xl flex items-start gap-3 ${c.danger} border`}>
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" /><p className="text-sm">{error}</p>
            </div>
          )}

          <p className={`text-xs text-center ${c.textMuted}`}>
            Have a name already? <a href="/NameAudit" className={`font-semibold underline ${isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-600 hover:text-cyan-700'}`}>NameAudit</a> stress-tests it across 12 dimensions.
          </p>
        </div>
      )}

      {/* ═══════════════ RESULTS VIEW ═══════════════ */}
      {results && (
        <div className="space-y-5">

          {/* Controls */}
          <div className={`${c.card} rounded-xl shadow-lg p-4 flex items-center justify-between flex-wrap gap-3`}>
            <div className="flex items-center gap-3">
              <span className={`text-sm font-semibold ${c.text}`}>{isBlendMode ? `Blends from: ${filledSeeds.join(' + ')}` : isDomainMode ? 'Domains' : 'Names'}{!isBlendMode ? ` for: ${category}` : ''}</span>
              {favorites.length > 0 && (
                <button onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                    showFavoritesOnly ? c.chip(true) : c.chip(false)
                  }`}>
                  <Star className={`w-3 h-3 ${showFavoritesOnly ? 'fill-current' : ''}`} /> {favorites.length} Favorites
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <CopyBtn content={buildFullText()} field="full-list" label="Copy All" />
              <button onClick={handlePrint} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${c.btnSecondary}`}>
                <Printer className="w-3.5 h-3.5" /> Print
              </button>
              <button onClick={handleShare} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${c.btnSecondary}`}>
                <Share2 className="w-3.5 h-3.5" /> Share
              </button>
              <button onClick={reset} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${isDark ? 'bg-amber-900/30 text-amber-300 hover:bg-amber-800/40' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}>
                <RefreshCw className="w-3.5 h-3.5" /> New Storm
              </button>
            </div>
          </div>

          {/* Brief Summary */}
          {results.brief_summary && (
            <p className={`text-sm ${c.textSecondary} italic px-1`}>{results.brief_summary}</p>
          )}

          {/* Seed Expansion (blend mode) */}
          {results.seed_expansion && !showFavoritesOnly && (
            <div className={`${c.card} rounded-xl shadow-lg p-5`}>
              <h3 className={`font-bold ${c.text} mb-3 flex items-center gap-2`}>
                <Sparkles className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-500'}`} /> Seed Expansion
              </h3>
              <p className={`text-xs ${c.textMuted} mb-3`}>Your seeds were expanded into synonyms and related words before blending:</p>
              <div className="space-y-2">
                {results.seed_expansion.map((seed, idx) => (
                  <div key={idx} className={`flex items-start gap-2 p-2 rounded-lg ${c.cardAlt}`}>
                    <span className={`font-bold text-sm ${isDark ? 'text-amber-300' : 'text-amber-700'} whitespace-nowrap`}>{seed.original}</span>
                    <span className={`text-xs ${c.textMuted}`}>→</span>
                    <span className={`text-sm ${c.textSecondary}`}>{Array.isArray(seed.expanded) ? seed.expanded.join(', ') : seed.expanded}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Picks */}
          {results.top_picks?.length > 0 && !showFavoritesOnly && (
            <div className={`${c.card} rounded-xl shadow-lg p-6 border-l-4 ${isDark ? 'border-amber-500' : 'border-amber-400'}`}>
              <h3 className={`font-bold ${c.text} mb-4 flex items-center gap-2`}>
                <Zap className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} /> Top Picks
              </h3>
              <div className="space-y-3">
                {results.top_picks.map((pick, idx) => {
                  const nameData = results.names_by_category
                    ?.flatMap(cat => cat.names)
                    .find(n => n.name === pick.name);
                  return (
                    <div key={idx} className={`flex items-start gap-3 p-3 rounded-lg ${c.cardAlt}`}>
                      <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${isDark ? 'bg-amber-900/40 text-amber-300' : 'bg-amber-100 text-amber-700'}`}>{pick.rank}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-bold ${c.text}`}>{pick.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${c.chip(false)}`}>{pick.from_category}</span>
                          <button onClick={() => toggleFavorite(pick.name)} className="ml-auto">
                            <Star className={`w-4 h-4 ${favorites.includes(pick.name) ? c.starActive + ' fill-current' : c.starInactive}`} />
                          </button>
                        </div>
                        <p className={`text-sm ${c.textSecondary} mt-1`}>{pick.why_top_pick}</p>
                        {Array.isArray(nameData?.problems) && nameData.problems.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {nameData.problems.map((p, i) => (
                              <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded border ${severityStyle(p.severity)}`}>⚠ {p.detail}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Say It Out Loud */}
          {results.say_it_out_loud?.length > 0 && !showFavoritesOnly && (
            <div className={`${c.card} rounded-xl shadow-lg p-5`}>
              <h3 className={`font-bold ${c.text} mb-3 flex items-center gap-2`}>
                <Volume2 className={`w-5 h-5 ${isDark ? 'text-red-400' : 'text-red-500'}`} /> Say It Out Loud Test
              </h3>
              <p className={`text-xs ${c.textMuted} mb-3`}>These names look good on paper but have issues when spoken aloud:</p>
              {results.say_it_out_loud.map((item, idx) => (
                <div key={idx} className={`flex items-start gap-2 mb-2 p-2 rounded-lg ${c.danger} border`}>
                  <span className="font-semibold text-sm">{item.name}</span>
                  <span className="text-sm">— {item.issue}</span>
                </div>
              ))}
            </div>
          )}

          {/* Favorites View */}
          {showFavoritesOnly && (
            <div className={`${c.card} rounded-xl shadow-lg p-6`}>
              <h3 className={`font-bold ${c.text} mb-4 flex items-center gap-2`}>
                <Star className={`w-5 h-5 ${c.starActive} fill-current`} /> Your Favorites ({favorites.length})
              </h3>
              {favorites.length === 0 ? (
                <p className={`text-sm ${c.textMuted}`}>Star some names to add them to your shortlist.</p>
              ) : (
                <div className="space-y-3">
                  {favorites.map(favName => {
                    const nameData = results.names_by_category
                      ?.flatMap(cat => ({ ...cat, names: cat.names }))
                      .flatMap(cat => cat.names.map(n => ({ ...n, _cat: cat.category })))
                      .find(n => n.name === favName);
                    // Also check more-like-this results
                    const moreVariation = !nameData ? Object.values(moreLikeResults)
                      .flatMap(m => m.variations || [])
                      .find(v => v.name === favName) : null;
                    const obj = nameData || moreVariation || { name: favName, why_it_works: '', problems: [], clean: true };
                    return <NameCard key={favName} nameObj={obj} categoryName={obj._cat || ''} />;
                  })}
                </div>
              )}
              <button onClick={() => { if (favorites.length > 0) copyToClipboard(favorites.join('\n'), 'fav-list'); }}
                className={`mt-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${c.btnSecondary}`}>
                <Copy className="w-3.5 h-3.5" /> Copy Favorites List
              </button>
            </div>
          )}

          {/* Names By Category */}
          {!showFavoritesOnly && results.names_by_category?.length > 0 && (
            <div className={`${c.card} rounded-xl shadow-lg p-6`}>
              <h3 className={`font-bold ${c.text} mb-4 flex items-center gap-2`}>
                <Hash className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} /> {isBlendMode ? 'Blends by Strategy' : isDomainMode ? 'Domains by Style' : 'Names by Style'}
              </h3>

              {/* Category Tabs */}
              <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1">
                {results.names_by_category.map((cat, idx) => (
                  <button key={idx} onClick={() => setActiveCategory(idx)}
                    className={`px-3 py-2 rounded-lg border text-sm font-semibold whitespace-nowrap transition-all ${c.tab(activeCategory === idx)}`}>
                    {cat.category}
                  </button>
                ))}
              </div>

              {/* Active Category Names */}
              {results.names_by_category[activeCategory] && (
                <div className="space-y-3">
                  {results.names_by_category[activeCategory].names.map((nameObj, idx) => (
                    <NameCard key={idx} nameObj={nameObj} categoryName={results.names_by_category[activeCategory].category} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Naming Notes */}
          {results.naming_notes && !showFavoritesOnly && (
            <div className={`p-5 rounded-xl ${c.info} border`}>
              <p className={`text-xs font-bold mb-1`}>💡 NAMING NOTES</p>
              <p className="text-sm">{results.naming_notes}</p>
            </div>
          )}

          {/* Cross-tool reference */}
          <p className={`text-xs text-center ${c.textMuted}`}>
            {isDomainMode
              ? <>Found a favorite? Run it through <a href="/NameAudit" className={`font-semibold underline ${isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-600 hover:text-cyan-700'}`}>NameAudit</a> (Domain Name mode) for a deep-dive on TLD trust, verbal shareability, and .com competition risk.</>
              : <>Found a favorite? Run it through <a href="/NameAudit" className={`font-semibold underline ${isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-600 hover:text-cyan-700'}`}>NameAudit</a> for a 12-dimension deep-dive before you commit.</>
            }
          </p>

          {/* Disclaimer */}
          <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-zinc-800/50' : 'bg-gray-50'}`}>
            <p className={`text-xs ${c.textMuted}`}>
              ⚡ Domain and social availability checks are approximations based on DNS lookups and profile page checks. Confirm availability through official registrars before purchasing. Trademark analysis is informational — consult a trademark attorney for legal clearance.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

NameStorm.displayName = 'NameStorm';
export default NameStorm;
