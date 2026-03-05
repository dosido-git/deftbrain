import React, { useState } from 'react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';
import { usePersistentState } from '../hooks/usePersistentState';
import { getToolById } from '../data/tools';
import { CopyBtn } from '../components/ActionButtons';

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
  const [mode, setMode] = useState('generate'); // 'generate' | 'blend' | 'quick'
  const [category, setCategory] = useState('');
  const [vibe, setVibe] = useState('');
  const [vibeChips, setVibeChips] = useState([]);
  const [constraints, setConstraints] = useState('');
  const [industryContext, setIndustryContext] = useState('');

  // ─── Blend Mode State ───
  const [seedWords, setSeedWords] = useState(['', '', '', '']);
  const [pairWithDomains, setPairWithDomains] = useState(false);

  // ─── Quick Mode State (ThingNamer) ───
  const [quickWhatIsIt, setQuickWhatIsIt] = useState('');
  const [quickVibe, setQuickVibe] = useState('');
  const [quickConstraints, setQuickConstraints] = useState('');
  const [quickAvoid, setQuickAvoid] = useState('');
  const [quickResults, setQuickResults] = useState(null);

  // ─── Results State ───
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState(0);
  const [favorites, setFavorites] = usePersistentState('namestorm-favorites', []);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // ─── Availability Check State ───
  const [checkingName, setCheckingName] = useState(null);
  const [availabilityResults, setAvailabilityResults] = useState({});

  // ─── More Like This State ───
  const [moreLikeLoading, setMoreLikeLoading] = useState(null);
  const [moreLikeResults, setMoreLikeResults] = useState({});

  // ─── Filter / Sort / Dismiss State ───
  const [filterCleanOnly, setFilterCleanOnly] = useState(false);
  const [sortByProblems, setSortByProblems] = useState(false);
  const [dismissed, setDismissed] = useState([]);
  const [hideDismissed, setHideDismissed] = useState(true);

  // ─── Compare View State ───
  const [showCompare, setShowCompare] = useState(false);

  // ─── Storm History (persistent) ───
  const [stormHistory, setStormHistory] = usePersistentState('namestorm-history', []);
  const [showHistory, setShowHistory] = useState(false);

  // ─── Competitor-Aware Generation ───
  const [competitors, setCompetitors] = useState('');

  // ─── Iterative Refinement State ───
  const [refineOpen, setRefineOpen] = useState(null); // name string or null
  const [refineInput, setRefineInput] = useState('');
  const [refineLoading, setRefineLoading] = useState(null);
  const [refineResults, setRefineResults] = useState({}); // { [name]: { variations: [...] } }

  // ─── Brand Story State ───
  const [storyLoading, setStoryLoading] = useState(null);
  const [storyResults, setStoryResults] = useState({}); // { [name]: { story, tagline, elevator } }

  // ─── Visual Preview State ───
  const [previewOpen, setPreviewOpen] = useState(null); // name string or null

  // ─── Sort by Score ───
  const [sortByScore, setSortByScore] = useState(false);

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
  const toggleDismiss = (name) => setDismissed(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);

  // ─── Filter + Sort Logic ───
  const filterAndSortNames = (names) => {
    let filtered = [...names];
    if (filterCleanOnly) filtered = filtered.filter(n => n.clean);
    if (hideDismissed) filtered = filtered.filter(n => !dismissed.includes(n.name));
    if (sortByScore) {
      filtered.sort((a, b) => computeScore(b) - computeScore(a));
    } else if (sortByProblems) {
      filtered.sort((a, b) => (a.problems?.length || 0) - (b.problems?.length || 0));
    }
    return filtered;
  };

  // ─── Lookup helpers ───
  const findNameData = (favName) => {
    const fromCategories = results?.names_by_category
      ?.flatMap(cat => cat.names.map(n => ({ ...n, _cat: cat.category })))
      .find(n => n.name === favName);
    if (fromCategories) return fromCategories;
    const fromMore = Object.values(moreLikeResults)
      .flatMap(m => m.variations || [])
      .find(v => v.name === favName);
    return fromMore || { name: favName, why_it_works: '', problems: [], clean: true };
  };

  // ─── Detailed Favorites Export ───
  const buildFavoritesText = () => {
    if (favorites.length === 0) return '';
    const lines = ['NAMESTORM SHORTLIST', `${favorites.length} favorited names`, ''];
    favorites.forEach((favName, i) => {
      const obj = findNameData(favName);
      lines.push(`${i + 1}. ${obj.name}${obj.pronunciation ? ` (/${obj.pronunciation}/)` : ''}${obj.clean ? ' ✅' : ''}`);
      if (obj.why_it_works) lines.push(`   ${obj.why_it_works}`);
      if (obj.blend_components) lines.push(`   Blend: ${obj.blend_components}`);
      if (obj.tld_rationale) lines.push(`   TLD: ${obj.tld_rationale}`);
      if (Array.isArray(obj.problems) && obj.problems.length > 0)
        obj.problems.forEach(p => lines.push(`   ⚠ ${p.detail}`));
      if (obj.domain_note) lines.push(`   🌐 ${obj.domain_note}`);
      lines.push('');
    });
    return lines.join('\n');
  };

  const addCustomTLD = () => {
    const raw = tldInput.trim().toLowerCase().replace(/^\./, '');
    if (!raw) return;
    const tld = '.' + raw;
    if (!preferredTLDs.includes(tld)) setPreferredTLDs(prev => [...prev, tld]);
    setTldInput('');
  };

  const handleGenerate = async (preserveFavorites = false) => {
    if (isBlendMode) {
      if (filledSeeds.length < 2) { setError('Enter at least 2 seed words or concepts'); return; }
    } else {
      if (!category) { setError('Please select what needs a name'); return; }
    }
    if (!isBlendMode && !vibe.trim() && vibeChips.length === 0) { setError('Please describe the vibe or select at least one vibe chip'); return; }
    setError('');
    setResults(null);
    if (!preserveFavorites) setFavorites(prev => prev); // keep persistent favorites
    setAvailabilityResults({});
    setMoreLikeResults({});
    setDismissed([]);

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
          competitors: competitors.trim() || null,
        };
        const data = await callToolEndpoint('namestorm/blend', payload);
        setResults(data);
        setActiveCategory(0);
        // Save to history
        saveToHistory(data, `Blend: ${filledSeeds.join(' + ')}`);
      } else {
        const payload = {
          category,
          vibe: vibe.trim() || null,
          vibeChips: vibeChips.length > 0 ? vibeChips : null,
          constraints: constraints.trim() || null,
          industryContext: industryContext.trim() || null,
          primaryLanguage: primaryLanguage !== 'English' ? primaryLanguage : null,
          competitors: competitors.trim() || null,
        };
        if (isDomainMode) {
          payload.preferredTLDs = preferredTLDs.length > 0 ? preferredTLDs : null;
          payload.targetLanguages = targetLanguages.length > 0 ? targetLanguages : null;
          payload.maxChars = maxChars ? parseInt(maxChars) : null;
        }
        const data = await callToolEndpoint('namestorm', payload);
        setResults(data);
        setActiveCategory(0);
        // Save to history
        saveToHistory(data, `${category}${vibe ? ' — ' + vibe.slice(0, 40) : ''}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to generate names. Please try again.');
    }
  };

  const handleRegenerate = () => handleGenerate(true);

  const handleQuick = async () => {
    if (!quickWhatIsIt.trim()) return;
    setError(''); setQuickResults(null);
    try {
      const data = await callToolEndpoint('namestorm/quick', {
        whatIsIt: quickWhatIsIt.trim(),
        vibe: quickVibe.trim() || undefined,
        constraints: quickConstraints.trim() || undefined,
        avoid: quickAvoid.trim() || undefined,
      });
      setQuickResults(data);
    } catch (e) { setError(e.message || 'Failed to generate names.'); }
  };

  const saveToHistory = (data, label) => {
    const topNames = data.top_picks?.map(p => p.name).slice(0, 5) || 
                     data.names_by_category?.[0]?.names?.map(n => n.name).slice(0, 5) || [];
    const entry = {
      id: Date.now(),
      label,
      timestamp: new Date().toISOString(),
      topNames,
      mode: isBlendMode ? 'blend' : 'generate',
      category: isBlendMode ? null : category,
      vibeChips: [...vibeChips],
      vibe: vibe.trim(),
      seedWords: isBlendMode ? [...filledSeeds] : null,
    };
    setStormHistory(prev => [entry, ...prev].slice(0, 20)); // Keep last 20
  };

  const loadFromHistory = (entry) => {
    if (entry.mode === 'blend') {
      setMode('blend');
      const padded = [...(entry.seedWords || []), '', '', '', ''].slice(0, 4);
      setSeedWords(padded);
    } else {
      setMode('generate');
      setCategory(entry.category || '');
    }
    setVibeChips(entry.vibeChips || []);
    setVibe(entry.vibe || '');
    setShowHistory(false);
  };

  const clearHistory = () => { setStormHistory([]); setShowHistory(false); };

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
    setResults(null); setError(''); setCompetitors('');
    setAvailabilityResults({}); setMoreLikeResults({});
    setPreferredTLDs([]); setTargetLanguages([]); setMaxChars(''); setPrimaryLanguage('English'); setTldInput('');
    setSeedWords(['', '', '', '']); setPairWithDomains(false);
    setDismissed([]); setFilterCleanOnly(false); setSortByProblems(false); setSortByScore(false);
    setShowCompare(false); setShowFavoritesOnly(false);
    setRefineResults({}); setStoryResults({}); setRefineOpen(null); setPreviewOpen(null);
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
    } else { try { await navigator.clipboard.writeText(text); } catch(e) { console.error('Copy failed:', e); } }
  };

  // Problem severity colors
  const severityStyle = (sev) => {
    if (sev === 'warning') return c.danger;
    if (sev === 'caution') return c.warning;
    return c.info;
  };

  // ─── Name Score (1-100) ───
  const computeScore = (nameObj) => {
    let score = 60; // baseline
    // Clean bonus
    if (nameObj.clean) score += 20;
    // Problem penalties
    const problems = nameObj.problems || [];
    problems.forEach(p => {
      if (p.severity === 'warning') score -= 12;
      else if (p.severity === 'caution') score -= 6;
      else score -= 3;
    });
    // Pronunciation guide present (AI thought about it)
    if (nameObj.pronunciation) score += 5;
    // Short names get a bonus (memorability)
    const len = nameObj.name?.replace(/[^a-zA-Z]/g, '').length || 10;
    if (len <= 6) score += 8;
    else if (len <= 8) score += 4;
    else if (len >= 14) score -= 5;
    // Domain availability bonus
    const avail = availabilityResults[nameObj.name];
    if (avail && !avail.error) {
      const domains = Object.values(avail.domains || {});
      const available = domains.filter(d => d === 'likely_available').length;
      score += Math.min(available * 3, 10);
    }
    return Math.max(1, Math.min(100, Math.round(score)));
  };

  const scoreColor = (score) => {
    if (score >= 80) return isDark ? 'text-green-400 bg-green-900/30 border-green-700' : 'text-green-700 bg-green-50 border-green-300';
    if (score >= 60) return isDark ? 'text-amber-400 bg-amber-900/30 border-amber-700' : 'text-amber-700 bg-amber-50 border-amber-300';
    return isDark ? 'text-red-400 bg-red-900/30 border-red-700' : 'text-red-600 bg-red-50 border-red-300';
  };

  // ─── Pronunciation Audio ───
  const speakName = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.85;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  };

  // ─── Iterative Refinement ("Almost Love") ───
  const handleRefine = async (nameObj, instruction) => {
    if (!instruction.trim() || refineLoading) return;
    const key = nameObj.name;
    setRefineLoading(key);
    try {
      const data = await callToolEndpoint('namestorm/refine', {
        name: nameObj.name,
        whyItWorks: nameObj.why_it_works,
        pronunciation: nameObj.pronunciation,
        problems: nameObj.problems,
        instruction: instruction.trim(),
        category,
        vibe: [vibeChips.join(', '), vibe].filter(Boolean).join('. '),
        isDomainMode,
        competitors: competitors.trim() || null,
        preferredTLDs: isDomainMode && preferredTLDs.length > 0 ? preferredTLDs : null,
        primaryLanguage: primaryLanguage !== 'English' ? primaryLanguage : null,
      });
      setRefineResults(prev => ({ ...prev, [key]: data }));
      setRefineOpen(null);
      setRefineInput('');
    } catch (err) {
      console.error('Refine failed:', err);
    }
    setRefineLoading(null);
  };

  // ─── Brand Story Generator ───
  const handleGenerateStory = async (nameObj) => {
    if (storyLoading) return;
    const key = nameObj.name;
    setStoryLoading(key);
    try {
      const data = await callToolEndpoint('namestorm/story', {
        name: nameObj.name,
        whyItWorks: nameObj.why_it_works,
        pronunciation: nameObj.pronunciation,
        blendComponents: nameObj.blend_components,
        category,
        industryContext: industryContext.trim() || null,
        vibe: [vibeChips.join(', '), vibe].filter(Boolean).join('. '),
      });
      setStoryResults(prev => ({ ...prev, [key]: data }));
    } catch (err) {
      console.error('Brand story failed:', err);
    }
    setStoryLoading(null);
  };

  // ─── Visual Preview Fonts ───
  const previewFonts = [
    { name: 'Clean Sans', family: 'Inter, system-ui, sans-serif', weight: '600' },
    { name: 'Bold Display', family: 'Georgia, serif', weight: '700', transform: 'uppercase', letterSpacing: '0.12em' },
    { name: 'Handwritten', family: 'Segoe Script, Brush Script MT, cursive', weight: '400' },
    { name: 'Monospace', family: 'SF Mono, Consolas, monospace', weight: '500', transform: 'lowercase' },
    { name: 'Compact', family: 'system-ui, sans-serif', weight: '800', transform: 'uppercase', letterSpacing: '0.2em', fontSize: '0.75em' },
  ];

  // ─── Name Card Component ───
  const NameCard = ({ nameObj, categoryName, compact = false }) => {
    const isFav = favorites.includes(nameObj.name);
    const isDismissedName = dismissed.includes(nameObj.name);
    const avail = availabilityResults[nameObj.name];
    const moreData = moreLikeResults[nameObj.name];
    const isChecking = checkingName === nameObj.name;
    const isLoadingMore = moreLikeLoading === nameObj.name;
    const score = computeScore(nameObj);
    const refineData = refineResults[nameObj.name];
    const storyData = storyResults[nameObj.name];
    const isRefineOpen = refineOpen === nameObj.name;
    const isPreviewOpen = previewOpen === nameObj.name;
    const isRefining = refineLoading === nameObj.name;
    const isStorying = storyLoading === nameObj.name;
    const showStoryButton = ['Business', 'Product', 'Band / Music Project', 'Creative Project', 'Event', 'Domain Name'].includes(category) || isBlendMode;

    return (
      <div className={`p-4 rounded-xl border transition-all ${isFav ? (isDark ? 'border-amber-600 bg-amber-900/10' : 'border-amber-400 bg-amber-50/50') : c.border} ${c.card}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className={`text-lg font-bold ${c.text}`}>{nameObj.name}</h4>
              {nameObj.pronunciation && (
                <span className={`text-xs font-mono ${c.textMuted}`}>/{nameObj.pronunciation}/</span>
              )}
              {/* Audio button */}
              <button onClick={() => speakName(nameObj.name)}
                className={`p-0.5 rounded transition-all ${isDark ? 'hover:bg-zinc-700' : 'hover:bg-gray-100'}`}
                title="Hear pronunciation">
                <span className="text-sm">🔊</span>
              </button>
              {nameObj.clean && <span className="flex-shrink-0">✅</span>}
              {/* Score badge */}
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded border ${scoreColor(score)}`} title={`Quality score: ${score}/100`}>
                {score}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <CopyBtn content={nameObj.name} />
            <button onClick={() => toggleFavorite(nameObj.name)}
              className="p-1.5 rounded-lg transition-all" title={isFav ? 'Remove from favorites' : 'Add to favorites'}>
              <span className="text-lg">{isFav ? '⭐' : '☆'}</span>
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
                <span>⚠️</span> {prob.detail}
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
              {isChecking ? <span className="animate-spin inline-block text-xs">⏳</span> : <span className="text-xs">🌐</span>}
              {avail ? 'Checked' : isChecking ? 'Checking...' : isDomainMode ? 'Check Domain' : 'Check Availability'}
              {!avail && !isChecking && <span className={`text-[9px] px-1 py-0.5 rounded font-bold ${isDark ? 'bg-amber-900/50 text-amber-300' : 'bg-amber-100 text-amber-700'}`}>PRO</span>}
            </button>
          )}
          <button onClick={() => handleMoreLike(nameObj, categoryName)} disabled={isLoadingMore || !!moreData}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${moreData ? (isDark ? 'bg-zinc-700 text-zinc-400' : 'bg-gray-100 text-gray-400') : c.btnSecondary}`}>
            {isLoadingMore ? <span className="animate-spin inline-block text-xs">⏳</span> : <span className="text-xs">✨</span>}
            {moreData ? 'See below' : isLoadingMore ? 'Generating...' : 'More Like This'}
            {!moreData && !isLoadingMore && <span className={`text-[9px] px-1 py-0.5 rounded font-bold ${isDark ? 'bg-amber-900/50 text-amber-300' : 'bg-amber-100 text-amber-700'}`}>PRO</span>}
          </button>
          {/* Refine button */}
          <button onClick={() => { setRefineOpen(isRefineOpen ? null : nameObj.name); setRefineInput(''); }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${isRefineOpen ? c.chip(true) : c.btnSecondary}`}>
            <span className="text-xs">🎯</span> {refineData ? 'Refine Again' : 'Refine'}
            {!refineData && <span className={`text-[9px] px-1 py-0.5 rounded font-bold ${isDark ? 'bg-amber-900/50 text-amber-300' : 'bg-amber-100 text-amber-700'}`}>PRO</span>}
          </button>
          {/* Visual Preview toggle */}
          <button onClick={() => setPreviewOpen(isPreviewOpen ? null : nameObj.name)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${isPreviewOpen ? c.chip(true) : c.btnSecondary}`}>
            <span className="text-xs">🎨</span> Preview
          </button>
          {/* Brand Story (for business-oriented categories) */}
          {showStoryButton && !compact && (
            <button onClick={() => handleGenerateStory(nameObj)} disabled={isStorying || !!storyData}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${storyData ? (isDark ? 'bg-zinc-700 text-zinc-400' : 'bg-gray-100 text-gray-400') : c.btnSecondary}`}>
              {isStorying ? <span className="animate-spin inline-block text-xs">⏳</span> : <span className="text-xs">📖</span>}
              {storyData ? 'Story below' : isStorying ? 'Writing...' : 'Brand Story'}
              {!storyData && !isStorying && <span className={`text-[9px] px-1 py-0.5 rounded font-bold ${isDark ? 'bg-amber-900/50 text-amber-300' : 'bg-amber-100 text-amber-700'}`}>PRO</span>}
            </button>
          )}
          <a href={`/NameAudit?name=${encodeURIComponent(nameObj.name)}`} target="_blank" rel="noopener noreferrer"
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${c.btnSecondary}`}>
            <span className="text-xs">🔍</span> Audit
          </a>
          {!compact && (
            <button onClick={() => toggleDismiss(nameObj.name)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                isDismissedName ? (isDark ? 'bg-zinc-600 text-zinc-300' : 'bg-gray-200 text-gray-500') : (isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-gray-400 hover:text-gray-600')
              }`}>
              <span className="text-xs">{isDismissedName ? '↩️' : '👎'}</span> {isDismissedName ? 'Restore' : 'Dismiss'}
            </button>
          )}
        </div>

        {/* ─── Visual Preview Panel ─── */}
        {isPreviewOpen && (
          <div className={`mt-3 p-4 rounded-lg ${c.cardAlt} space-y-3`}>
            <p className={`text-xs font-bold ${c.textMuted}`}>VISUAL PREVIEW</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {previewFonts.map((font, idx) => (
                <div key={idx} className={`p-4 rounded-lg border ${c.border} ${isDark ? 'bg-zinc-800' : 'bg-white'} text-center`}>
                  <p className={`text-xs ${c.textMuted} mb-2`}>{font.name}</p>
                  <p style={{
                    fontFamily: font.family,
                    fontWeight: font.weight,
                    textTransform: font.transform || 'none',
                    letterSpacing: font.letterSpacing || 'normal',
                    fontSize: font.fontSize || '1.5em',
                    lineHeight: 1.2,
                  }} className={c.text}>
                    {nameObj.name}
                  </p>
                </div>
              ))}
              {/* Favicon mockup */}
              <div className={`p-4 rounded-lg border ${c.border} ${isDark ? 'bg-zinc-800' : 'bg-white'} text-center`}>
                <p className={`text-xs ${c.textMuted} mb-2`}>Favicon / App Icon</p>
                <div className="flex justify-center gap-3 items-center">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg ${isDark ? 'bg-amber-600 text-white' : 'bg-amber-500 text-white'}`}>
                    {nameObj.name.charAt(0).toUpperCase()}
                  </div>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${isDark ? 'bg-zinc-600 text-zinc-100' : 'bg-gray-800 text-white'}`}>
                    {nameObj.name.charAt(0).toUpperCase()}
                  </div>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs border-2 ${isDark ? 'border-amber-500 text-amber-400' : 'border-amber-600 text-amber-700'}`}
                    style={{ fontFamily: 'system-ui, sans-serif', letterSpacing: '0.05em' }}>
                    {nameObj.name.slice(0, 3).toUpperCase()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── Refinement Input ─── */}
        {isRefineOpen && (
          <div className={`mt-3 p-3 rounded-lg ${c.cardAlt} space-y-2`}>
            <p className={`text-xs font-bold ${c.textMuted}`}>🎯 WHAT WOULD MAKE "{nameObj.name.toUpperCase()}" BETTER?</p>
            <p className={`text-xs ${c.textSecondary}`}>Describe what to change — shorter, less corporate, fix the pronunciation, works in Spanish, more playful, etc.</p>
            <div className="flex gap-2">
              <input type="text" value={refineInput} onChange={(e) => setRefineInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleRefine(nameObj, refineInput); } }}
                placeholder="e.g., Make it shorter and more playful"
                className={`flex-1 p-2.5 border rounded-lg outline-none text-sm focus:ring-2 focus:ring-amber-300 ${c.input}`}
                disabled={isRefining} />
              <button onClick={() => handleRefine(nameObj, refineInput)} disabled={isRefining || !refineInput.trim()}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${isRefining ? (isDark ? 'bg-zinc-700 text-zinc-400' : 'bg-gray-200 text-gray-400') : c.btnPrimary}`}>
                {isRefining ? <span className="animate-spin inline-block">⏳</span> : 'Refine'}
              </button>
            </div>
            {/* Quick refinement chips */}
            <div className="flex flex-wrap gap-1.5">
              {['Make it shorter', 'Less corporate', 'More playful', 'Fix pronunciation', 'Works internationally', 'More unique'].map(chip => (
                <button key={chip} onClick={() => { setRefineInput(chip); }}
                  className={`px-2 py-1 rounded-lg border text-xs font-medium transition-all ${c.chip(refineInput === chip)}`}>
                  {chip}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ─── Refinement Results ─── */}
        {refineData && refineData.variations && (
          <div className={`mt-3 p-3 rounded-lg ${c.cardAlt} space-y-2`}>
            <p className={`text-xs font-bold ${c.textMuted}`}>🎯 REFINED FROM "{nameObj.name.toUpperCase()}"</p>
            {refineData.refinement_note && <p className={`text-xs ${c.textSecondary} italic mb-2`}>{refineData.refinement_note}</p>}
            <div className="space-y-2">
              {refineData.variations.map((v, i) => (
                <div key={i} className={`flex items-start justify-between gap-2 p-2 rounded-lg ${isDark ? 'bg-zinc-800' : 'bg-white'}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-sm ${c.text}`}>{v.name}</span>
                      {v.pronunciation && <span className={`text-xs font-mono ${c.textMuted}`}>/{v.pronunciation}/</span>}
                      <button onClick={() => speakName(v.name)} className="p-0.5 rounded" title="Hear it"><span className="text-xs">🔊</span></button>
                      {v.clean && <span>✅</span>}
                    </div>
                    <p className={`text-xs ${c.textSecondary} mt-0.5`}>{v.why_it_works}</p>
                    {v.how_it_addresses_feedback && (
                      <p className={`text-[10px] ${isDark ? 'text-amber-300' : 'text-amber-700'} mt-0.5 font-medium`}>→ {v.how_it_addresses_feedback}</p>
                    )}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <CopyBtn content={v.name} />
                    <button onClick={() => toggleFavorite(v.name)} className="p-1 rounded">
                      <span className="text-sm">{favorites.includes(v.name) ? '⭐' : '☆'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Brand Story ─── */}
        {storyData && (
          <div className={`mt-3 p-4 rounded-lg border-l-4 ${isDark ? 'border-purple-500 bg-purple-900/15' : 'border-purple-400 bg-purple-50/50'}`}>
            <p className={`text-xs font-bold ${c.textMuted} mb-2`}>📖 BRAND STORY</p>
            {storyData.origin_story && (
              <p className={`text-sm ${c.text} leading-relaxed`}>{storyData.origin_story}</p>
            )}
            {storyData.tagline && (
              <p className={`text-sm font-semibold ${isDark ? 'text-purple-300' : 'text-purple-700'} mt-3 italic`}>"{storyData.tagline}"</p>
            )}
            {storyData.elevator_pitch && (
              <div className="mt-3">
                <p className={`text-xs font-bold ${c.textMuted} mb-1`}>ELEVATOR PITCH</p>
                <p className={`text-sm ${c.textSecondary} leading-relaxed`}>{storyData.elevator_pitch}</p>
              </div>
            )}
            {storyData.introduction_script && (
              <div className="mt-3">
                <p className={`text-xs font-bold ${c.textMuted} mb-1`}>HOW TO INTRODUCE IT</p>
                <p className={`text-sm ${c.textSecondary} leading-relaxed italic`}>"{storyData.introduction_script}"</p>
              </div>
            )}
            <div className="mt-2">
              <CopyBtn content={`${nameObj.name}\n\n${storyData.origin_story || ''}\n\nTagline: "${storyData.tagline || ''}"\n\n${storyData.elevator_pitch || ''}`} label="Copy Story" />
            </div>
          </div>
        )}

        {/* Availability Results */}
        {avail && !avail.error && (
          <div className={`mt-3 p-3 rounded-lg ${c.cardAlt} space-y-2`}>
            <p className={`text-xs font-bold ${c.textMuted}`}>{isDomainMode ? 'DOMAIN & COMPETING TLDs' : 'DOMAIN AVAILABILITY'}</p>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(avail.domains || {}).sort(([a], [b]) => {
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
                      <button onClick={() => speakName(v.name)} className="p-0.5 rounded" title="Hear it"><span className="text-xs">🔊</span></button>
                      {v.clean && <span>✅</span>}
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
                    <CopyBtn content={v.name} />
                    <button onClick={() => toggleFavorite(v.name)} className="p-1 rounded">
                      <span className="text-sm">{favorites.includes(v.name) ? '⭐' : '☆'}</span>
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
      {!results && !quickResults && (
        <div className="space-y-5">

          {/* Persistent Favorites Banner */}
          {favorites.length > 0 && (
            <div className={`p-4 rounded-xl border ${isDark ? 'border-amber-700 bg-amber-900/15' : 'border-amber-300 bg-amber-50'} flex items-center justify-between flex-wrap gap-2`}>
              <span className={`text-sm ${c.text}`}>
                <span>⭐</span> You have <strong>{favorites.length}</strong> saved favorite{favorites.length !== 1 ? 's' : ''} from previous storms
              </span>
              <div className="flex gap-2">
                <CopyBtn content={favorites.join('\n')} label="Copy Names" />
                <button onClick={() => { if (window.confirm('Clear all favorites?')) setFavorites([]); }}
                  className={`text-xs px-2 py-1 rounded-lg ${c.btnSecondary}`}>Clear</button>
              </div>
            </div>
          )}

          {/* Mode Toggle */}
          <div className="flex gap-2">
            <button onClick={() => { setMode('generate'); setCategory(''); }}
              className={`flex-1 py-3 px-4 rounded-xl border text-sm font-semibold transition-all flex items-center justify-center gap-2 ${c.tab(mode === 'generate')}`}>
              <span>⚡</span> Generate
            </button>
            <button onClick={() => { setMode('blend'); setCategory(''); }}
              className={`flex-1 py-3 px-4 rounded-xl border text-sm font-semibold transition-all flex items-center justify-center gap-2 ${c.tab(mode === 'blend')}`}>
              <span>✨</span> Blend <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${isDark ? 'bg-amber-900/50 text-amber-300 border border-amber-700' : 'bg-amber-100 text-amber-700 border border-amber-300'}`}>PRO</span>
            </button>
            <button onClick={() => { setMode('quick'); setCategory(''); setResults(null); }}
              className={`flex-1 py-3 px-4 rounded-xl border text-sm font-semibold transition-all flex items-center justify-center gap-2 ${c.tab(mode === 'quick')}`}>
              <span>🏷️</span> Quick
            </button>
          </div>

          {/* ─── Quick Mode (ThingNamer) ─── */}
          {mode === 'quick' && (
            <div className={`${c.card} rounded-xl shadow-lg p-6 space-y-4`}>
              <div>
                <p className={`text-sm font-semibold ${c.text} mb-1`}>🏷️ What needs a name? <span className="text-red-500">*</span></p>
                <textarea value={quickWhatIsIt} onChange={e => setQuickWhatIsIt(e.target.value)}
                  placeholder="e.g. My new rescue dog — medium-sized, scruffy, total chaos gremlin but sweet… / A Wi-Fi network for my home office / A group chat for my 4 college friends who all became engineers / A small-batch hot sauce company"
                  rows={3} maxLength={500}
                  className={`w-full px-4 py-3 rounded-xl border text-sm resize-none outline-none ${c.input}`} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className={`text-sm font-semibold ${c.text} mb-1`}>Vibe / personality <span className={`font-normal ${c.textMuted}`}>(optional)</span></p>
                  <input type="text" value={quickVibe} onChange={e => setQuickVibe(e.target.value)}
                    placeholder="e.g. funny, mysterious, wholesome, nerdy…"
                    className={`w-full px-3 py-2 rounded-xl border text-sm outline-none ${c.input}`} />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${c.text} mb-1`}>Constraints <span className={`font-normal ${c.textMuted}`}>(optional)</span></p>
                  <input type="text" value={quickConstraints} onChange={e => setQuickConstraints(e.target.value)}
                    placeholder="e.g. short, one word, can't start with S…"
                    className={`w-full px-3 py-2 rounded-xl border text-sm outline-none ${c.input}`} />
                </div>
              </div>
              <div>
                <p className={`text-sm font-semibold ${c.text} mb-1`}>What to avoid <span className={`font-normal ${c.textMuted}`}>(optional)</span></p>
                <input type="text" value={quickAvoid} onChange={e => setQuickAvoid(e.target.value)}
                  placeholder="e.g. anything too obvious, no food puns, no names ending in -ify…"
                  className={`w-full px-3 py-2 rounded-xl border text-sm outline-none ${c.input}`} />
              </div>
              {error && <div className={`p-3 rounded-xl flex items-start gap-2 ${c.danger} border`}><span>⚠️</span><p className="text-sm">{error}</p></div>}
              <button onClick={handleQuick} disabled={loading || !quickWhatIsIt.trim()}
                className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2 shadow-lg ${loading ? (isDark ? 'bg-zinc-700 text-zinc-400' : 'bg-gray-200 text-gray-400') : c.btnPrimary}`}>
                {loading ? <><span className="animate-spin inline-block">⏳</span> Thinking…</> : <><span>🏷️</span> Name It</>}
              </button>
            </div>
          )}

          {/* ─── Generate / Blend Mode Form ─── */}
          {mode !== 'quick' && (
          <div>

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

          {/* Constraints + Industry + Competitors + Language */}
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

            {/* Competitor-Aware Generation */}
            <div>
              <label className={`block text-sm font-semibold ${c.text} mb-1`}>
                Competitors / Names to avoid sounding like
                <span className={`font-normal text-xs ${c.textMuted} ml-1`}>(optional)</span>
              </label>
              <input type="text" value={competitors} onChange={(e) => setCompetitors(e.target.value)}
                placeholder="e.g., Stripe, Square, Plaid — generated names will deliberately contrast"
                className={`w-full p-3 border rounded-xl outline-none text-sm focus:ring-2 focus:ring-amber-300 ${c.input}`} />
              {competitors.trim() && (
                <p className={`text-xs ${isDark ? 'text-amber-300' : 'text-amber-700'} mt-1`}>
                  ⚡ Names will be generated to stand apart from: {competitors}
                </p>
              )}
            </div>

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
                        {tld} <button onClick={() => setPreferredTLDs(prev => prev.filter(t => t !== tld))}><span>✕</span></button>
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

          {/* Storm History */}
          {stormHistory.length > 0 && (
            <div className={`${c.card} rounded-xl shadow-lg p-5`}>
              <button onClick={() => setShowHistory(!showHistory)}
                className={`w-full flex items-center justify-between ${c.text}`}>
                <span className="flex items-center gap-2 font-semibold text-sm">
                  <span>📜</span> Previous Storms ({stormHistory.length})
                </span>
                <span>{showHistory ? '▲' : '▼'}</span>
              </button>
              {showHistory && (
                <div className="mt-3 space-y-2">
                  {stormHistory.map((entry) => (
                    <div key={entry.id} className={`flex items-start gap-3 p-3 rounded-lg border ${c.border} ${c.cardAlt}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs px-1.5 py-0.5 rounded-full border ${c.chip(false)}`}>
                            {entry.mode === 'blend' ? '✨ Blend' : `⚡ ${entry.category}`}
                          </span>
                          <span className={`text-xs ${c.textMuted}`}>
                            {new Date(entry.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className={`text-sm font-medium ${c.text} mt-1`}>{entry.label}</p>
                        {entry.vibeChips?.length > 0 && (
                          <p className={`text-xs ${c.textMuted} mt-0.5`}>{entry.vibeChips.join(', ')}</p>
                        )}
                        {entry.topNames?.length > 0 && (
                          <p className={`text-xs ${c.textSecondary} mt-1`}>Top: {entry.topNames.join(', ')}</p>
                        )}
                      </div>
                      <button onClick={() => loadFromHistory(entry)}
                        className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium ${c.btnSecondary}`}>
                        <span>↩️</span> Reuse Settings
                      </button>
                    </div>
                  ))}
                  <button onClick={clearHistory} className={`text-xs ${c.textMuted} hover:underline mt-1`}>Clear history</button>
                </div>
              )}
            </div>
          )}

          {/* Submit */}
          <button onClick={handleGenerate} disabled={loading || (isBlendMode ? filledSeeds.length < 2 : (!category || (!vibe.trim() && vibeChips.length === 0)))}
            className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2 shadow-lg ${
              loading ? (isDark ? 'bg-zinc-700 text-zinc-400' : 'bg-gray-200 text-gray-400') : c.btnPrimary
            }`}>
            {loading ? (<><span className="animate-spin inline-block">⏳</span> {isBlendMode ? 'Blending names...' : isDomainMode ? 'Brainstorming domains...' : 'Brainstorming names...'}</>)
              : (<><span>⚡</span> {isBlendMode ? 'Blend Names' : isDomainMode ? 'Storm Domains' : 'Storm Names'}</>)}
          </button>

          {error && (
            <div className={`p-4 rounded-xl flex items-start gap-3 ${c.danger} border`}>
              <span className="flex-shrink-0 mt-0.5">⚠️</span><p className="text-sm">{error}</p>
            </div>
          )}

          <p className={`text-xs text-center ${c.textMuted}`}>
            Have a name already? <a href="/NameAudit" className={`font-semibold underline ${isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-600 hover:text-cyan-700'}`}>NameAudit</a> stress-tests it across 12 dimensions.
          </p>
          </div>
          )} {/* end mode !== quick wrapper */}
          </div>
          )} {/* end inner card wrapper */}
      

      {/* ═══════════════ RESULTS VIEW ═══════════════ */}
      {results && (
        <div className="space-y-5">

          {/* Controls */}
          <div className={`${c.card} rounded-xl shadow-lg p-4 space-y-3`}>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <span className={`text-sm font-semibold ${c.text}`}>{isBlendMode ? `Blends from: ${filledSeeds.join(' + ')}` : isDomainMode ? 'Domains' : 'Names'}{!isBlendMode ? ` for: ${category}` : ''}</span>
                {favorites.length > 0 && (
                  <button onClick={() => { setShowFavoritesOnly(!showFavoritesOnly); setShowCompare(false); }}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                      showFavoritesOnly ? c.chip(true) : c.chip(false)
                    }`}>
                    <span className="text-sm">{showFavoritesOnly ? '⭐' : '☆'}</span> {favorites.length} Favorites
                  </button>
                )}
                {favorites.length >= 2 && (
                  <button onClick={() => { setShowCompare(!showCompare); setShowFavoritesOnly(false); }}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                      showCompare ? c.chip(true) : c.chip(false)
                    }`}>
                    <span className="text-xs">⚖️</span> Compare
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <CopyBtn content={buildFullText()} field="full-list" label="Copy All" />
                <button onClick={handlePrint} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${c.btnSecondary}`}>
                  <span>🖨️</span> Print
                </button>
                <button onClick={handleShare} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${c.btnSecondary}`}>
                  <span>📤</span> Share
                </button>
                <button onClick={handleRegenerate} disabled={loading}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${isDark ? 'bg-amber-900/30 text-amber-300 hover:bg-amber-800/40' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}>
                  {loading ? <span className="animate-spin inline-block">⏳</span> : <span>⚡</span>} Storm Again
                </button>
                <button onClick={reset} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${c.btnSecondary}`}>
                  <span>🔄</span> New Storm
                </button>
              </div>
            </div>

            {/* Filter / Sort Row */}
            <div className={`flex items-center gap-2 pt-2 border-t ${c.border} flex-wrap`}>
              <span className={`text-xs font-semibold ${c.textMuted}`}>Filters:</span>
              <button onClick={() => setFilterCleanOnly(!filterCleanOnly)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border transition-all ${c.chip(filterCleanOnly)}`}>
                <span>✅</span> Clean Only
              </button>
              <button onClick={() => { setSortByScore(!sortByScore); if (!sortByScore) setSortByProblems(false); }}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border transition-all ${c.chip(sortByScore)}`}>
                <span>🏆</span> Best Score First
              </button>
              <button onClick={() => { setSortByProblems(!sortByProblems); if (!sortByProblems) setSortByScore(false); }}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border transition-all ${c.chip(sortByProblems)}`}>
                <span>⚠️</span> Fewest Issues First
              </button>
              <button onClick={() => setHideDismissed(!hideDismissed)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border transition-all ${c.chip(hideDismissed)}`}>
                <span>👎</span> {hideDismissed ? `Hide Dismissed${dismissed.length ? ` (${dismissed.length})` : ''}` : `Show Dismissed (${dismissed.length})`}
              </button>
              {dismissed.length > 0 && (
                <button onClick={() => setDismissed([])} className={`text-xs ${c.textMuted} hover:underline`}>Clear dismissed</button>
              )}
            </div>
          </div>

          {/* Brief Summary */}
          {results.brief_summary && (
            <p className={`text-sm ${c.textSecondary} italic px-1`}>{results.brief_summary}</p>
          )}

          {/* Seed Expansion (blend mode) */}
          {results.seed_expansion && !showFavoritesOnly && !showCompare && (
            <div className={`${c.card} rounded-xl shadow-lg p-5`}>
              <h3 className={`font-bold ${c.text} mb-3 flex items-center gap-2`}>
                <span>✨</span> Seed Expansion
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
          {results.top_picks?.length > 0 && !showFavoritesOnly && !showCompare && (
            <div className={`${c.card} rounded-xl shadow-lg p-6 border-l-4 ${isDark ? 'border-amber-500' : 'border-amber-400'}`}>
              <h3 className={`font-bold ${c.text} mb-4 flex items-center gap-2`}>
                <span>⚡</span> Top Picks
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
                            <span className="text-lg">{favorites.includes(pick.name) ? '⭐' : '☆'}</span>
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
          {results.say_it_out_loud?.length > 0 && !showFavoritesOnly && !showCompare && (
            <div className={`${c.card} rounded-xl shadow-lg p-5`}>
              <h3 className={`font-bold ${c.text} mb-3 flex items-center gap-2`}>
                <span>🔊</span> Say It Out Loud Test
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

          {/* Compare View */}
          {showCompare && favorites.length >= 2 && (
            <div className={`${c.card} rounded-xl shadow-lg p-6`}>
              <h3 className={`font-bold ${c.text} mb-4 flex items-center gap-2`}>
                <span>⚖️</span> Compare Favorites ({favorites.length})
              </h3>
              <div className="overflow-x-auto">
                <div className={`grid gap-3`} style={{ gridTemplateColumns: `repeat(${Math.min(favorites.length, 3)}, minmax(220px, 1fr))` }}>
                  {favorites.map(favName => {
                    const obj = findNameData(favName);
                    const avail = availabilityResults[favName];
                    return (
                      <div key={favName} className={`p-4 rounded-xl border ${c.border} ${c.cardAlt} space-y-2`}>
                        <div className="flex items-center justify-between gap-2">
                          <h4 className={`font-bold ${c.text} text-base`}>{obj.name}</h4>
                          <button onClick={() => toggleFavorite(favName)} className="flex-shrink-0">
                            <span className="text-lg">⭐</span>
                          </button>
                        </div>
                        {obj.pronunciation && <p className={`text-xs font-mono ${c.textMuted}`}>/{obj.pronunciation}/</p>}
                        
                        {/* Status badges */}
                        <div className="flex flex-wrap gap-1">
                          {obj.clean && <span className={`text-xs px-1.5 py-0.5 rounded border ${c.success}`}>✅ Clean</span>}
                          {Array.isArray(obj.problems) && obj.problems.length > 0
                            ? <span className={`text-xs px-1.5 py-0.5 rounded border ${c.warning}`}>⚠️ {obj.problems.length} issue{obj.problems.length > 1 ? 's' : ''}</span>
                            : !obj.clean && <span className={`text-xs px-1.5 py-0.5 rounded border ${c.info}`}>No flags</span>
                          }
                        </div>

                        {/* Rationale */}
                        <p className={`text-xs ${c.textSecondary} leading-relaxed`}>{obj.why_it_works}</p>

                        {/* Blend components */}
                        {obj.blend_components && (
                          <p className={`text-xs ${isDark ? 'text-purple-300' : 'text-purple-600'} font-medium`}>{obj.blend_components}</p>
                        )}

                        {/* Domain info */}
                        {obj.tld_rationale && (
                          <p className={`text-[10px] ${c.textMuted} italic`}>🔗 {obj.tld_rationale}</p>
                        )}
                        {obj.verbal_form && (
                          <p className={`text-[10px] ${c.textMuted}`}>🗣️ "{obj.verbal_form}"</p>
                        )}

                        {/* Problems detail */}
                        {Array.isArray(obj.problems) && obj.problems.length > 0 && (
                          <div className="space-y-1">
                            {obj.problems.map((p, i) => (
                              <span key={i} className={`block text-[10px] px-1.5 py-0.5 rounded border ${severityStyle(p.severity)}`}>⚠ {p.detail}</span>
                            ))}
                          </div>
                        )}

                        {/* Availability if checked */}
                        {avail && !avail.error && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {Object.entries(avail.domains || {}).slice(0, 4).map(([domain, status]) => (
                              <span key={domain} className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${
                                status === 'likely_available' ? (isDark ? 'bg-green-900/30 border-green-700 text-green-300' : 'bg-green-50 border-green-300 text-green-700')
                                : status === 'taken' ? (isDark ? 'bg-red-900/20 border-red-800 text-red-400' : 'bg-red-50 border-red-200 text-red-500')
                                : (isDark ? 'bg-zinc-700 border-zinc-600 text-zinc-400' : 'bg-gray-100 border-gray-200 text-gray-400')
                              }`}>{domain} {status === 'likely_available' ? '✓' : status === 'taken' ? '✗' : '?'}</span>
                            ))}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-1 pt-1">
                          <a href={`/NameAudit?name=${encodeURIComponent(obj.name)}`} target="_blank" rel="noopener noreferrer"
                            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${c.btnSecondary}`}>
                            <span>🔍</span> Audit
                          </a>
                          <CopyBtn content={obj.name} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="mt-4">
                <CopyBtn content={buildFavoritesText()} label="Copy Detailed Shortlist" />
              </div>
            </div>
          )}

          {/* Favorites View */}
          {showFavoritesOnly && (
            <div className={`${c.card} rounded-xl shadow-lg p-6`}>
              <h3 className={`font-bold ${c.text} mb-4 flex items-center gap-2`}>
                <span>⭐</span> Your Favorites ({favorites.length})
              </h3>
              {favorites.length === 0 ? (
                <p className={`text-sm ${c.textMuted}`}>Star some names to add them to your shortlist.</p>
              ) : (
                <div className="space-y-3">
                  {favorites.map(favName => {
                    const obj = findNameData(favName);
                    return <NameCard key={favName} nameObj={obj} categoryName={obj._cat || ''} />;
                  })}
                </div>
              )}
              <div className="flex flex-wrap gap-2 mt-4">
                <CopyBtn content={favorites.join('\n')} label="Copy Names" />
                <CopyBtn content={buildFavoritesText()} label="Copy Detailed Shortlist" />
              </div>
              {favorites.length > 0 && (
                <button onClick={() => { if (window.confirm('Clear all favorites? This cannot be undone.')) setFavorites([]); }}
                  className={`mt-3 text-xs ${c.textMuted} hover:underline`}>Clear all favorites</button>
              )}
            </div>
          )}

          {/* Names By Category */}
          {!showFavoritesOnly && !showCompare && results.names_by_category?.length > 0 && (
            <div className={`${c.card} rounded-xl shadow-lg p-6`}>
              <h3 className={`font-bold ${c.text} mb-4 flex items-center gap-2`}>
                <span>#️⃣</span> {isBlendMode ? 'Blends by Strategy' : isDomainMode ? 'Domains by Style' : 'Names by Style'}
              </h3>

              {/* Category Tabs */}
              <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1">
                {results.names_by_category.map((cat, idx) => {
                  const filteredCount = filterAndSortNames(cat.names).length;
                  return (
                    <button key={idx} onClick={() => setActiveCategory(idx)}
                      className={`px-3 py-2 rounded-lg border text-sm font-semibold whitespace-nowrap transition-all ${c.tab(activeCategory === idx)}`}>
                      {cat.category} {filteredCount !== cat.names.length && <span className={`text-xs ${c.textMuted}`}>({filteredCount})</span>}
                    </button>
                  );
                })}
              </div>

              {/* Active Category Names */}
              {results.names_by_category[activeCategory] && (() => {
                const filtered = filterAndSortNames(results.names_by_category[activeCategory].names);
                return filtered.length > 0 ? (
                  <div className="space-y-3">
                    {filtered.map((nameObj, idx) => (
                      <NameCard key={idx} nameObj={nameObj} categoryName={results.names_by_category[activeCategory].category} />
                    ))}
                  </div>
                ) : (
                  <p className={`text-sm ${c.textMuted} text-center py-4`}>All names in this category have been filtered out. Try adjusting your filters.</p>
                );
              })()}
            </div>
          )}

          {/* Naming Notes */}
          {results.naming_notes && !showFavoritesOnly && !showCompare && (
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
      )}

      {/* ═══════════════ QUICK RESULTS ═══════════════ */}
      {quickResults && (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <button onClick={() => { setQuickResults(null); setError(''); }}
              className={`text-sm font-semibold px-4 py-2 rounded-xl ${c.btnSecondary}`}>
              ← Try Again
            </button>
            {quickResults.top_pick && (
              <div className={`text-sm px-4 py-2 rounded-xl font-medium ${isDark ? 'bg-amber-900/30 text-amber-300' : 'bg-amber-50 text-amber-800'}`}>
                ⭐ Top pick: <strong>{quickResults.top_pick.split(' — ')[0]}</strong>
              </div>
            )}
          </div>

          {quickResults.directions?.map((dir, di) => (
            <div key={di} className={`${c.card} rounded-xl shadow-lg p-6`}>
              <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 ${c.textMuted}`}>{dir.direction}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {dir.names?.map((nameObj, ni) => (
                  <div key={ni} className={`p-4 rounded-xl border transition-all ${c.cardInner || (isDark ? 'bg-zinc-700/40 border-zinc-600' : 'bg-stone-50 border-stone-200')}`}>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className={`text-base font-bold ${c.text}`}>{nameObj.name}</span>
                      {nameObj.score && (
                        <span className={`flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${nameObj.score >= 80 ? (isDark ? 'bg-emerald-900/50 text-emerald-300' : 'bg-emerald-100 text-emerald-700') : nameObj.score >= 60 ? (isDark ? 'bg-amber-900/50 text-amber-300' : 'bg-amber-100 text-amber-700') : (isDark ? 'bg-zinc-600 text-zinc-300' : 'bg-stone-200 text-stone-600')}`}>{nameObj.score}</span>
                      )}
                    </div>
                    {nameObj.note && <p className={`text-xs mb-2 ${isDark ? 'text-zinc-400' : 'text-stone-500'}`}>{nameObj.note}</p>}
                    {nameObj.flag && <p className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-red-900/30 text-red-300' : 'bg-red-50 text-red-600'}`}>⚠️ {nameObj.flag}</p>}
                    <div className="mt-2 flex gap-2">
                      <button onClick={() => { const fav = { name: nameObj.name, source: quickWhatIsIt.slice(0, 40), date: new Date().toISOString() }; if (!favorites.find(f => f.name === nameObj.name)) setFavorites(prev => [fav, ...prev].slice(0, 50)); }}
                        className={`text-xs px-2.5 py-1 rounded-lg ${isDark ? 'bg-zinc-600 hover:bg-zinc-500 text-zinc-200' : 'bg-stone-200 hover:bg-stone-300 text-stone-700'}`}>
                        {favorites.find(f => f.name === nameObj.name) ? '★ Saved' : '☆ Save'}
                      </button>
                      <CopyBtn content={nameObj.name} label="Copy" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {quickResults.top_pick && (
            <div className={`p-5 rounded-xl text-center ${isDark ? 'bg-amber-900/20 border border-amber-700/40' : 'bg-amber-50 border border-amber-200'}`}>
              <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>⭐ Top Pick</p>
              <p className={`text-lg font-black ${c.text}`}>{quickResults.top_pick}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

NameStorm.displayName = 'NameStorm';
export default NameStorm;
