import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';
import { usePersistentState } from '../hooks/usePersistentState';
import { CopyBtn } from '../components/ActionButtons';

// ════════════════════════════════════════════════════════════
// THEME — Navy & Gold palette
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
    // Validation
    validBg:     d ? 'bg-[#2c4a6e]/15 border-[#4a6a8a]' : 'bg-[#d4dde8]/40 border-[#2c4a6e]/40',
    validText:   d ? 'text-[#a8b9ce]' : 'text-[#1e3a58]',
    // Warning / harshness
    warnBg:      d ? 'bg-[#c8872e]/10 border-[#c8872e]/40' : 'bg-[#f9edd8] border-[#c8872e]/40',
    warnText:    d ? 'text-[#d9a04e]' : 'text-[#93541f]',
    // Info
    infoBg:      d ? 'bg-[#2c4a6e]/10 border-[#4a6a8a]/40' : 'bg-[#e6f0f5] border-[#b8d0e0]',
    infoText:    d ? 'text-[#8ab8d4]' : 'text-[#2c5a7e]',
    // Error
    errBg:       d ? 'bg-[#b54a3f]/15 border-[#b54a3f]/40' : 'bg-[#fceae8] border-[#e8a8a0]',
    errText:     d ? 'text-[#e88880]' : 'text-[#b54a3f]',
    // Success
    successBg:   d ? 'bg-[#5a8a5c]/15 border-[#5a8a5c]/40' : 'bg-[#e8f0e8] border-[#5a8a5c]/30',
    successText: d ? 'text-[#7aba7c]' : 'text-[#3a6a3c]',
    // Version-specific
    vCollab:     d ? 'border-[#4a6a8a] bg-[#2c4a6e]/10' : 'border-[#4a6a8a]/40 bg-[#d4dde8]/30',
    vBalanced:   d ? 'border-[#c8872e]/60 bg-[#c8872e]/10' : 'border-[#c8872e]/40 bg-[#f9edd8]/50',
    vFirm:       d ? 'border-[#b54a3f]/60 bg-[#b54a3f]/10' : 'border-[#b54a3f]/30 bg-[#fceae8]/50',
    // Before/after
    beforeBg:    d ? 'bg-[#b54a3f]/10 border-[#b54a3f]/30' : 'bg-[#fceae8] border-[#e8a8a0]',
    afterBg:     d ? 'bg-[#5a8a5c]/10 border-[#5a8a5c]/30' : 'bg-[#e8f0e8] border-[#5a8a5c]/30',
    // Rage
    rageBg:      d ? 'bg-[#b54a3f]/30' : 'bg-[#fceae8]',
    rageInact:   d ? 'bg-[#332e2a] opacity-40 hover:opacity-70' : 'bg-[#f3efe8] opacity-40 hover:opacity-70',
    // Score bar
    barBg:       d ? 'bg-[#332e2a]' : 'bg-[#e8e1d5]',
    barNavy:     'bg-[#2c4a6e]',
    barGold:     'bg-[#c8872e]',
    // Cooling
    coolBg:      d ? 'bg-[#2c4a6e]/15' : 'bg-[#d4dde8]/40',
    coolText:    d ? 'text-[#a8b9ce]' : 'text-[#2c4a6e]',
    // History
    histBg:      d ? 'bg-[#2c4a6e]/10 border-[#4a6a8a]/30' : 'bg-[#d4dde8]/30 border-[#2c4a6e]/15',
    histCard:    d ? 'bg-[#2a2623] border-[#3d3630]' : 'bg-white border-[#e8e1d5]',
    histAccent:  d ? 'text-[#a8b9ce]' : 'text-[#2c4a6e]',
    // Tabs
    tabActive:   d ? 'bg-[#332e2a] text-[#d9a04e] border-b-2 border-[#c8872e]' : 'bg-[#faf8f5] text-[#1e3a58] border-b-2 border-[#2c4a6e]',
    tabInactive: d ? 'text-[#8a8275] hover:text-[#c8c3b9] hover:bg-[#332e2a]/50' : 'text-[#8a8275] hover:text-[#5a544a] hover:bg-[#faf8f5]',
    // Badge
    badge:       d ? 'bg-[#2c4a6e]/30 text-[#a8b9ce]' : 'bg-[#d4dde8] text-[#1e3a58]',
    linkStyle:   d ? 'text-[#6e8aaa] hover:text-[#a8b9ce] underline' : 'text-[#2c4a6e] hover:text-[#1e3a58] underline',
  };
};

// ════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════
const RELATIONSHIP_OPTIONS = [
  { value: 'Boss', icon: '👔' },
  { value: 'Direct Report', icon: '📋' },
  { value: 'Coworker', icon: '🤝' },
  { value: 'Client', icon: '💼' },
  { value: 'Vendor', icon: '📦' },
  { value: 'Partner/Spouse', icon: '💕' },
  { value: 'Family', icon: '👨‍👩‍👧' },
  { value: 'Friend', icon: '🫂' },
  { value: 'Landlord', icon: '🏠' },
  { value: 'Neighbor', icon: '🏘️' },
  { value: 'Customer Service', icon: '📞' },
  { value: 'Other', icon: '💬' },
];

const CHANNEL_OPTIONS = [
  { value: 'Email', icon: '📧' },
  { value: 'Slack/Teams', icon: '💬' },
  { value: 'Text Message', icon: '📱' },
  { value: 'In-person script', icon: '🗣️' },
  { value: 'Letter/Formal', icon: '📝' },
  { value: 'Social Media', icon: '🌐' },
];

const GOAL_OPTIONS = [
  { value: 'Get an apology', label: 'Get an apology' },
  { value: 'Change their behavior', label: 'Change behavior' },
  { value: 'Set a boundary', label: 'Set a boundary' },
  { value: 'Get compensation/resolution', label: 'Get resolution' },
  { value: 'Preserve the relationship', label: 'Preserve relationship' },
  { value: 'End professionally', label: 'End professionally' },
  { value: 'Document for the record', label: 'Document it' },
  { value: 'Just be heard', label: 'Just be heard' },
];

const POWER_OPTIONS = [
  { value: 'they_have_power', label: 'They have power over me', icon: '⬆️', desc: 'Boss, landlord, authority' },
  { value: 'equals', label: "We're equals", icon: '↔️', desc: 'Peer, friend, neighbor' },
  { value: 'i_have_leverage', label: 'I have leverage', icon: '⬇️', desc: "Client, they need something" },
];

const RAGE_EMOJIS = ['😤', '😠', '🤬', '💢', '🌋'];

const VERSION_ICONS = { collaborative: '🤝', balanced: '⚖️', firm: '🛡️' };

const EXAMPLE_MESSAGE = "I'm done covering for you. You missed ANOTHER deadline and guess who has to clean up your mess? Me, again. I've told you a hundred times and you clearly don't give a damn. This is the last time.";

// ════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════
const VelvetHammer = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const c = useColors();
  const resultsRef = useRef(null);

  // ── Persistent ──
  const [savedHistory, setSavedHistory] = usePersistentState('velvet-hammer-history', []);
  const [showSavedHistory, setShowSavedHistory] = useState(false);

  // ── Input ──
  const [harshMessage, setHarshMessage] = useState('');
  const [relationship, setRelationship] = useState('');
  const [channel, setChannel] = useState('Email');
  const [goals, setGoals] = useState([]);
  const [powerDynamic, setPowerDynamic] = useState('equals');
  const [rageLevel, setRageLevel] = useState(3);
  const [history, setHistory] = useState('');
  const [showContext, setShowContext] = useState(true);

  // ── Results ──
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [activeVersion, setActiveVersion] = useState('balanced');

  // ── Collapsible sections ──
  const [showConcerns, setShowConcerns] = useState(true);
  const [showBeforeAfter, setShowBeforeAfter] = useState(false);
  const [showFairness, setShowFairness] = useState(false);
  const [showInflammatory, setShowInflammatory] = useState(false);

  // ── Refinement ──
  const [refiningVersion, setRefiningVersion] = useState(null);
  const [refinementText, setRefinementText] = useState('');
  const [refinedVersions, setRefinedVersions] = useState({});
  const [refineLoading, setRefineLoading] = useState(false);

  // ── Cooling period ──
  const [showCoolingPeriod, setShowCoolingPeriod] = useState(false);
  const [coolingSeconds, setCoolingSeconds] = useState(60);
  const [resultsRevealed, setResultsRevealed] = useState(false);
  const [pendingResults, setPendingResults] = useState(null);

  // ══════════════════════════════════════════
  // COOLING TIMER
  // ══════════════════════════════════════════
  useEffect(() => {
    let interval;
    if (showCoolingPeriod && coolingSeconds > 0) {
      interval = setInterval(() => {
        setCoolingSeconds(prev => {
          if (prev <= 1) {
            setShowCoolingPeriod(false);
            setResultsRevealed(true);
            if (pendingResults) { setResults(pendingResults); setPendingResults(null); }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showCoolingPeriod, coolingSeconds, pendingResults]);

  // Scroll to results
  useEffect(() => {
    if (results && resultsRef.current) {
      setTimeout(() => resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
    }
  }, [results]);

  // ══════════════════════════════════════════
  // HANDLERS
  // ══════════════════════════════════════════
  const toggleGoal = useCallback((val) => {
    setGoals(prev => prev.includes(val) ? prev.filter(g => g !== val) : [...prev, val]);
  }, []);

  const handleTransform = useCallback(async () => {
    if (!harshMessage.trim()) { setError('Please enter a message to transform'); return; }
    setError(''); setResults(null); setRefinedVersions({}); setRefiningVersion(null);
    setResultsRevealed(false); setActiveVersion('balanced');
    try {
      const data = await callToolEndpoint('velvet-hammer', {
        harshMessage: harshMessage.trim(), relationship: relationship || 'Not specified',
        channel, goals, powerDynamic, rageLevel, history: history.trim(),
      });
      if (rageLevel >= 4) {
        setPendingResults(data); setCoolingSeconds(60); setShowCoolingPeriod(true);
      } else {
        setResults(data); setResultsRevealed(true);
      }
      saveToHistory(data);
    } catch (err) {
      setError(err.message || 'Failed to transform message.');
    }
  }, [harshMessage, relationship, channel, goals, powerDynamic, rageLevel, history, callToolEndpoint]);

  const skipCooling = useCallback(() => {
    setShowCoolingPeriod(false); setResultsRevealed(true);
    if (pendingResults) { setResults(pendingResults); setPendingResults(null); }
  }, [pendingResults]);

  const handleRefine = useCallback(async (version) => {
    if (!refinementText.trim()) return;
    setRefineLoading(true);
    try {
      const data = await callToolEndpoint('velvet-hammer/refine', {
        originalVersion: version.message,
        selectedVersion: version.style,
        refinementRequest: refinementText.trim(),
        channel, relationship,
      });
      if (data.refined_message) {
        setRefinedVersions(prev => ({ ...prev, [version.style]: data.refined_message }));
      }
      setRefiningVersion(null); setRefinementText('');
    } catch (err) {
      setError(err.message || 'Failed to refine message.');
    } finally {
      setRefineLoading(false);
    }
  }, [refinementText, channel, relationship, callToolEndpoint]);

  const revertRefinement = useCallback((style) => {
    setRefinedVersions(prev => { const next = { ...prev }; delete next[style]; return next; });
  }, []);

  const handleReset = useCallback(() => {
    setHarshMessage(''); setRelationship(''); setChannel('Email');
    setGoals([]); setPowerDynamic('equals'); setRageLevel(3); setHistory('');
    setResults(null); setError(''); setRefinedVersions({});
    setRefiningVersion(null); setShowCoolingPeriod(false);
    setResultsRevealed(false); setPendingResults(null);
  }, []);

  // ══════════════════════════════════════════
  // HISTORY
  // ══════════════════════════════════════════
  const saveToHistory = useCallback((data) => {
    const entry = {
      id: `vh_${Date.now()}`,
      date: new Date().toISOString(),
      preview: harshMessage.trim().slice(0, 60),
      relationship, channel,
      harshness: data.original_harshness,
      results: data,
    };
    setSavedHistory(prev => [entry, ...prev].slice(0, 20));
  }, [harshMessage, relationship, channel, setSavedHistory]);

  const loadFromHistory = useCallback((entry) => {
    setResults(entry.results); setResultsRevealed(true);
    setShowSavedHistory(false); setRefinedVersions({});
    setActiveVersion('balanced');
  }, []);

  const removeFromHistory = useCallback((id) => {
    setSavedHistory(prev => prev.filter(h => h.id !== id));
  }, [setSavedHistory]);

  // ══════════════════════════════════════════
  // COPY HELPERS
  // ══════════════════════════════════════════
  const buildVersionCopy = useCallback((version) => {
    const v = refinedVersions[version.style] ? { ...version, message: refinedVersions[version.style] } : version;
    const parts = [];
    if (channel === 'Email' && v.subject_line) parts.push(`Subject: ${v.subject_line}`, '');
    parts.push(v.message);
    parts.push('', '— Generated by DeftBrain · deftbrain.com');
    return parts.join('\n');
  }, [channel, refinedVersions]);

  const buildAllVersionsCopy = useCallback(() => {
    if (!results?.versions) return '';
    const lines = ['🔨 Velvet Hammer — All Versions', ''];
    results.versions.forEach(v => {
      const display = refinedVersions[v.style] || v.message;
      lines.push(`══ ${v.label || v.style} ══`);
      if (channel === 'Email' && v.subject_line) lines.push(`Subject: ${v.subject_line}`);
      lines.push(display, '');
    });
    lines.push('— Generated by DeftBrain · deftbrain.com');
    return lines.join('\n');
  }, [results, channel, refinedVersions]);

  // ══════════════════════════════════════════
  // RENDER: Chip
  // ══════════════════════════════════════════
  const Chip = ({ active, onClick, children }) => (
    <button type="button" onClick={onClick}
      className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${active ? c.pillActive : c.pillInactive}`}>
      {active && <span className="mr-1">✓</span>}
      {children}
    </button>
  );

  // ══════════════════════════════════════════
  // RENDER: Collapsible
  // ══════════════════════════════════════════
  const Collapsible = ({ title, emoji, open, onToggle, children, badge }) => (
    <div className={`${c.card} border rounded-xl overflow-hidden`}>
      <button onClick={onToggle} className="w-full flex items-center justify-between p-5 text-left hover:opacity-80 transition-opacity">
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
  // RENDER: Score Bar
  // ══════════════════════════════════════════
  const ScoreBar = ({ label, value, max = 10, variant = 'navy' }) => (
    <div className="flex items-center gap-3">
      <span className={`text-xs font-medium ${c.textMut} w-24 shrink-0`}>{label}</span>
      <div className={`flex-1 h-2 rounded-full ${c.barBg}`}>
        <div className={`h-2 rounded-full transition-all duration-500 ${variant === 'gold' ? c.barGold : c.barNavy}`}
          style={{ width: `${(value / max) * 100}%` }} />
      </div>
      <span className={`text-xs font-mono ${c.textMut} w-6 text-right`}>{value}</span>
    </div>
  );

  // ══════════════════════════════════════════
  // RENDER: Header
  // ══════════════════════════════════════════
  const renderHeader = () => (
    <div className="flex items-center gap-3 mb-5">
      <div>
        <h2 className={`text-2xl font-bold ${c.heading}`}>Velvet Hammer <span className="text-xl">🔨</span></h2>
        <p className={`text-sm ${c.textMut}`}>Transform furious drafts into professional, assertive messages — without losing your point</p>
      </div>
    </div>
  );

  // ══════════════════════════════════════════
  // RENDER: Raw Message Input
  // ══════════════════════════════════════════
  const renderMessageInput = () => (
    <div className={`${c.card} border rounded-xl p-5`}>
      <div className="flex items-center justify-between mb-1">
        <label className={`text-base font-bold ${c.text}`}>Say what you REALLY want to say</label>
        <button onClick={() => setHarshMessage(EXAMPLE_MESSAGE)}
          className={`text-xs ${c.linkStyle}`}>Try example</button>
      </div>
      <p className={`text-sm ${c.textMut} mb-4`}>No one will ever see this version. Get it all out — profanity, sarcasm, and all.</p>
      <textarea value={harshMessage} onChange={e => setHarshMessage(e.target.value)}
        placeholder='e.g., "You&apos;re completely incompetent and I&apos;m sick of doing your job for you..."'
        className={`w-full h-36 p-4 border-2 rounded-xl ${c.inputBg} outline-none focus:ring-2 resize-none text-base`} />
      <div className="flex items-center justify-between mt-3">
        <span className={`text-xs ${c.textMut}`}>{harshMessage.length} characters</span>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium ${c.textMut}`}>How angry?</span>
          <div className="flex gap-1">
            {RAGE_EMOJIS.map((emoji, idx) => (
              <button key={idx} type="button" onClick={() => setRageLevel(idx + 1)}
                className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center transition-all ${
                  rageLevel >= idx + 1 ? `${c.rageBg} scale-110` : c.rageInact
                }`} title={`Rage level ${idx + 1}`}>
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // ══════════════════════════════════════════
  // RENDER: Context Panel
  // ══════════════════════════════════════════
  const renderContextPanel = () => (
    <div className={`${c.card} border rounded-xl overflow-hidden`}>
      <button onClick={() => setShowContext(!showContext)}
        className="w-full flex items-center justify-between p-5 hover:opacity-80 transition-opacity">
        <div className="flex items-center gap-3">
          <span className="text-lg">💡</span>
          <span className={`font-semibold ${c.text}`}>Context & Calibration</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${c.badge}`}>Better results with context</span>
        </div>
        <span className={`text-xs ${c.textMut}`}>{showContext ? '▲' : '▼'}</span>
      </button>
      {showContext && (
        <div className={`px-5 pb-6 space-y-6 border-t ${c.divider}`}>
          {/* Relationship */}
          <div className="pt-4">
            <label className={`block text-sm font-semibold ${c.label} mb-2`}>Who is this to?</label>
            <div className="flex flex-wrap gap-2">
              {RELATIONSHIP_OPTIONS.map(opt => (
                <Chip key={opt.value} active={relationship === opt.value}
                  onClick={() => setRelationship(relationship === opt.value ? '' : opt.value)}>
                  {opt.icon} {opt.value}
                </Chip>
              ))}
            </div>
          </div>

          {/* Channel */}
          <div>
            <label className={`block text-sm font-semibold ${c.label} mb-2`}>How will you send it?</label>
            <div className="flex flex-wrap gap-2">
              {CHANNEL_OPTIONS.map(opt => (
                <Chip key={opt.value} active={channel === opt.value}
                  onClick={() => setChannel(opt.value)}>
                  {opt.icon} {opt.value}
                </Chip>
              ))}
            </div>
          </div>

          {/* Goals */}
          <div>
            <label className={`block text-sm font-semibold ${c.label} mb-1`}>What do you want to achieve?</label>
            <p className={`text-xs ${c.textMut} mb-2`}>Select all that apply</p>
            <div className="flex flex-wrap gap-2">
              {GOAL_OPTIONS.map(opt => (
                <Chip key={opt.value} active={goals.includes(opt.value)}
                  onClick={() => toggleGoal(opt.value)}>
                  {opt.label}
                </Chip>
              ))}
            </div>
          </div>

          {/* Power Dynamic */}
          <div>
            <label className={`block text-sm font-semibold ${c.label} mb-2`}>Power dynamic</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {POWER_OPTIONS.map(opt => (
                <button key={opt.value} type="button" onClick={() => setPowerDynamic(opt.value)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    powerDynamic === opt.value
                      ? `${c.pillActive} border-[#4a6a8a]`
                      : `${c.card} hover:border-[#8a8275]`
                  }`}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{opt.icon}</span>
                    <span className={`text-sm font-medium ${powerDynamic === opt.value ? '' : c.textSec}`}>{opt.label}</span>
                  </div>
                  <p className={`text-xs mt-1 ${c.textMut}`}>{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Backstory */}
          <div>
            <label className={`block text-sm font-semibold ${c.label} mb-2`}>Backstory (optional)</label>
            <textarea value={history} onChange={e => setHistory(e.target.value)}
              placeholder='e.g., "This is the 3rd time they&apos;ve missed a deadline"'
              className={`w-full p-3 border rounded-xl ${c.inputBg} outline-none focus:ring-2 resize-none text-sm`}
              rows={2} />
          </div>
        </div>
      )}
    </div>
  );

  // ══════════════════════════════════════════
  // RENDER: Transform Button
  // ══════════════════════════════════════════
  const renderTransformButton = () => (
    <div className="flex gap-3">
      <button onClick={handleTransform}
        disabled={loading || !harshMessage.trim()}
        className={`flex-1 py-4 px-6 rounded-xl text-base font-bold flex items-center justify-center gap-3 transition-all
          ${loading || !harshMessage.trim() ? c.btnDis : c.btn}`}>
        {loading ? (
          <><span className="animate-spin inline-block">⏳</span> Translating your rage into eloquence...</>
        ) : (
          <><span>✨</span> Transform Message</>
        )}
      </button>
      {results && (
        <button onClick={handleReset} className={`${c.btnOutline} px-4 rounded-xl`} title="Start over">
          <span className="text-lg">🔄</span>
        </button>
      )}
    </div>
  );

  // ══════════════════════════════════════════
  // RENDER: Cooling Period
  // ══════════════════════════════════════════
  const renderCoolingPeriod = () => {
    if (!showCoolingPeriod) return null;
    return (
      <div className={`${c.card} border-2 rounded-xl p-8 text-center`}>
        <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-5 ${c.coolBg}`}>
          <span className="text-4xl animate-pulse">🌬️</span>
        </div>
        <h3 className={`text-xl font-bold ${c.text} mb-2`}>Your results are ready.</h3>
        <p className={`${c.textSec} mb-6`}>
          Before you copy and send, take a breath. Messages sent at peak anger have a much higher chance of escalating conflict.
        </p>
        <div className={`text-5xl font-mono font-bold mb-6 ${c.coolText}`}>
          0:{coolingSeconds.toString().padStart(2, '0')}
        </div>
        <div className={`flex items-center justify-center gap-2 mb-6 text-sm ${c.textMut}`}>
          <span>🕐</span> Breathe in for 4 seconds... hold for 4... out for 4...
        </div>
        <button onClick={skipCooling} className={`${c.btnOutline} px-6 py-2 rounded-lg text-sm`}>
          I'm calm — show results
        </button>
      </div>
    );
  };

  // ══════════════════════════════════════════
  // RENDER: Version Tab Card
  // ══════════════════════════════════════════
  const renderVersionTabs = () => {
    if (!results?.versions?.length) return null;
    return (
      <div className={`${c.card} border rounded-xl overflow-hidden`}>
        {/* Tab bar */}
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

        {/* Active version */}
        {results.versions.map(v => {
          if (v.style !== activeVersion) return null;
          const displayMessage = refinedVersions[v.style] || v.message;
          const isRefined = !!refinedVersions[v.style];
          const vColor = v.style === 'collaborative' ? c.vCollab : v.style === 'firm' ? c.vFirm : c.vBalanced;

          return (
            <div key={v.style} className="p-6 space-y-5">
              {/* Best for */}
              {v.best_for && (
                <div className={`text-sm ${c.textMut} flex items-center gap-2`}>
                  <span>💡</span> <strong>Best for:</strong> {v.best_for}
                </div>
              )}

              {/* Subject line */}
              {channel === 'Email' && v.subject_line && (
                <div className={`${c.cardAlt} border rounded-lg px-4 py-2 text-sm`}>
                  <span className={`font-semibold ${c.label}`}>Subject: </span>
                  <span className={c.textSec}>{v.subject_line}</span>
                </div>
              )}

              {/* Message body */}
              <div className={`${vColor} border-2 rounded-xl p-5`}>
                {isRefined && (
                  <div className={`text-xs font-medium mb-2 flex items-center gap-1 ${c.warnText}`}>
                    <span>✏️</span> Refined version
                    <button onClick={() => revertRefinement(v.style)} className="ml-2 underline hover:no-underline">Revert</button>
                  </div>
                )}
                <p className={`text-base leading-relaxed whitespace-pre-wrap ${c.text}`}>{displayMessage}</p>
              </div>

              {/* Scores */}
              {(v.tone_score || v.assertiveness_score) && (
                <div className="space-y-2">
                  {v.tone_score != null && <ScoreBar label="Warmth" value={v.tone_score} variant="navy" />}
                  {v.assertiveness_score != null && <ScoreBar label="Assertiveness" value={v.assertiveness_score} variant="gold" />}
                </div>
              )}

              {/* Key techniques */}
              {v.key_techniques?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {v.key_techniques.map((tech, idx) => (
                    <span key={idx} className={`text-xs px-2.5 py-1 rounded-full ${c.badge}`}>{tech}</span>
                  ))}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3 pt-2">
                <CopyBtn content={buildVersionCopy(v)} label={channel === 'Email' ? 'Copy with subject' : 'Copy'} />
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
                    placeholder='e.g., "Make it shorter", "Mention the March 15 deadline", "Sound less apologetic"'
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
    );
  };

  // ══════════════════════════════════════════
  // RENDER: Results
  // ══════════════════════════════════════════
  const renderResults = () => {
    if (!results || !resultsRevealed) return null;

    return (
      <div ref={resultsRef} className="space-y-5">
        {/* Emotional Validation */}
        {results.emotional_validation && (
          <div className={`${c.validBg} border-2 rounded-xl p-5`}>
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">❤️</span>
              <div>
                <p className={`font-semibold mb-1 ${c.validText}`}>We hear you</p>
                <p className={`text-sm leading-relaxed ${c.validText}`}>{results.emotional_validation}</p>
              </div>
            </div>
          </div>
        )}

        {/* Harshness Score */}
        {results.original_harshness != null && (
          <div className={`${c.warnBg} border rounded-xl p-4`}>
            <div className="flex items-center justify-between">
              <span className={`text-sm font-medium ${c.warnText}`}>Original harshness</span>
              <span className={`text-sm font-bold ${c.warnText}`}>{results.original_harshness}/10</span>
            </div>
            <div className={`mt-2 h-2 rounded-full ${c.barBg}`}>
              <div className="h-2 rounded-full bg-gradient-to-r from-[#c8872e] to-[#b54a3f] transition-all duration-700"
                style={{ width: `${(results.original_harshness / 10) * 100}%` }} />
            </div>
          </div>
        )}

        {/* Legitimate Concerns */}
        {results.legitimate_concerns?.length > 0 && (
          <Collapsible title="Your Valid Points" emoji="✅" open={showConcerns}
            onToggle={() => setShowConcerns(!showConcerns)} badge={`${results.legitimate_concerns.length} preserved`}>
            <p className={`text-xs ${c.textMut} mb-3 mt-3`}>These are kept in every version below</p>
            <ul className="space-y-2">
              {results.legitimate_concerns.map((concern, idx) => (
                <li key={idx} className={`text-sm ${c.textSec} flex items-start gap-2`}>
                  <span className={`flex-shrink-0 mt-0.5 ${c.successText}`}>✓</span>
                  {concern}
                </li>
              ))}
            </ul>
          </Collapsible>
        )}

        {/* Version Tabs (Main Event) */}
        {renderVersionTabs()}

        {/* Before → After */}
        {results.before_after?.length > 0 && (
          <Collapsible title="Before → After" emoji="🔄" open={showBeforeAfter}
            onToggle={() => setShowBeforeAfter(!showBeforeAfter)} badge={`${results.before_after.length} changes`}>
            <div className="space-y-4 mt-4">
              {results.before_after.map((item, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className={`${c.beforeBg} rounded-lg p-3 border`}>
                      <span className={`text-xs font-semibold ${c.errText} block mb-1`}>BEFORE</span>
                      <p className={`text-sm line-through opacity-80 ${c.textSec}`}>{item.original_snippet}</p>
                    </div>
                    <div className={`${c.afterBg} rounded-lg p-3 border`}>
                      <span className={`text-xs font-semibold ${c.successText} block mb-1`}>AFTER</span>
                      <p className={`text-sm ${c.textSec}`}>{item.transformed_to}</p>
                    </div>
                  </div>
                  {item.why && <p className={`text-xs ${c.textMut} pl-1`}>↳ {item.why}</p>}
                </div>
              ))}
            </div>
          </Collapsible>
        )}

        {/* Fairness Check */}
        {results.fairness_check && (
          <Collapsible title="Fairness Check" emoji="⚖️" open={showFairness}
            onToggle={() => setShowFairness(!showFairness)}>
            <div className="space-y-4 mt-4">
              {results.fairness_check.valid_claims?.length > 0 && (
                <div>
                  <p className={`text-sm font-semibold ${c.label} mb-2`}>✓ Defensible claims (kept)</p>
                  <ul className="space-y-1">
                    {results.fairness_check.valid_claims.map((claim, idx) => (
                      <li key={idx} className={`text-sm ${c.textSec} flex items-start gap-2`}>
                        <span className={`flex-shrink-0 mt-0.5 ${c.successText}`}>✓</span> {claim}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {results.fairness_check.exaggerations?.length > 0 && (
                <div>
                  <p className={`text-sm font-semibold ${c.label} mb-2`}>⚠️ Exaggerations (toned down)</p>
                  <ul className="space-y-1">
                    {results.fairness_check.exaggerations.map((ex, idx) => (
                      <li key={idx} className={`text-sm ${c.textSec} flex items-start gap-2`}>
                        <span className="flex-shrink-0 mt-0.5">⚠️</span> {ex}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {results.fairness_check.missing_perspective && (
                <div className={`${c.infoBg} border rounded-lg p-3`}>
                  <p className={`text-sm font-semibold mb-1 ${c.infoText}`}>Their possible perspective</p>
                  <p className={`text-sm ${c.infoText}`}>{results.fairness_check.missing_perspective}</p>
                </div>
              )}
            </div>
          </Collapsible>
        )}

        {/* Inflammatory Elements */}
        {results.inflammatory_elements?.length > 0 && (
          <Collapsible title="Why the Original Would Backfire" emoji="⚡" open={showInflammatory}
            onToggle={() => setShowInflammatory(!showInflammatory)} badge={`${results.inflammatory_elements.length} issues`}>
            <div className="space-y-3 mt-4">
              {results.inflammatory_elements.map((el, idx) => (
                <div key={idx} className={`${c.cardAlt} border rounded-lg p-4`}>
                  <p className={`text-sm font-mono ${c.errText} mb-2`}>"{el.original_phrase}"</p>
                  <p className={`text-xs ${c.textSec} mb-1`}><strong>Problem:</strong> {el.problem}</p>
                  <p className={`text-xs ${c.textMut}`}><strong>Risk:</strong> {el.risk}</p>
                </div>
              ))}
            </div>
          </Collapsible>
        )}

        {/* Strategic Notes */}
        {results.strategic_notes && (
          <div className={`${c.card} border rounded-xl p-5`}>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">📈</span>
              <span className={`text-base font-semibold ${c.text}`}>Strategic Notes</span>
            </div>
            <div className="space-y-3">
              {results.strategic_notes.timing_advice && (
                <div className="flex items-start gap-3">
                  <span className={`flex-shrink-0 mt-0.5 ${c.textMut}`}>🕐</span>
                  <div>
                    <span className={`text-xs font-semibold uppercase ${c.textMut}`}>Timing</span>
                    <p className={`text-sm ${c.textSec}`}>{results.strategic_notes.timing_advice}</p>
                  </div>
                </div>
              )}
              {results.strategic_notes.escalation_warning && (
                <div className={`flex items-start gap-3 ${c.warnBg} border rounded-lg p-3`}>
                  <span className="flex-shrink-0 mt-0.5">⚠️</span>
                  <div>
                    <span className={`text-xs font-semibold uppercase ${c.warnText}`}>Escalation note</span>
                    <p className={`text-sm ${c.warnText}`}>{results.strategic_notes.escalation_warning}</p>
                  </div>
                </div>
              )}
              {results.strategic_notes.follow_up && (
                <div className="flex items-start gap-3">
                  <span className={`flex-shrink-0 mt-0.5 ${c.textMut}`}>💬</span>
                  <div>
                    <span className={`text-xs font-semibold uppercase ${c.textMut}`}>If they don't respond well</span>
                    <p className={`text-sm ${c.textSec}`}>{results.strategic_notes.follow_up}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Copy All + Reset */}
        <div className="flex gap-2">
          <div className="flex-1"><CopyBtn content={buildAllVersionsCopy()} label="Copy All Versions" /></div>
          <button onClick={handleReset}
            className={`flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 ${c.btn}`}>
            <span>🔄</span> Start Over
          </button>
        </div>

        {/* Cross-references */}
        {renderCrossRefs()}
      </div>
    );
  };

  // ══════════════════════════════════════════
  // RENDER: Error
  // ══════════════════════════════════════════
  const renderError = () => error ? (
    <div className={`p-4 ${c.errBg} border rounded-xl flex items-start gap-3`}>
      <span className={`text-base ${c.errText} flex-shrink-0`}>⚠️</span>
      <p className={`text-sm ${c.errText}`}>{error}</p>
    </div>
  ) : null;

  // ══════════════════════════════════════════
  // RENDER: Cross-References
  // ══════════════════════════════════════════
  const renderCrossRefs = () => (
    <div className={`p-4 rounded-2xl border ${c.card} mt-2`}>
      <p className={`text-xs font-bold ${c.textMut} uppercase tracking-wide mb-2`}>🔗 Related Tools</p>
      <div className={`space-y-1.5 text-xs ${c.textSec}`}>
        <p>Need to craft a social media post instead? <a href="/CaptionMagic" target="_blank" rel="noopener noreferrer" className={c.linkStyle}>Caption Magic</a> generates authentic captions for any photo.</p>
        <p>Feeling overwhelmed by the situation? <a href="/SpiralStopper" target="_blank" rel="noopener noreferrer" className={c.linkStyle}>Spiral Stopper</a> breaks anxiety loops so you can think clearly.</p>
        <p>Need to recharge after a tough conversation? <a href="/DopamineMenuBuilder" target="_blank" rel="noopener noreferrer" className={c.linkStyle}>Dopamine Menu</a> builds a recovery plan.</p>
      </div>
    </div>
  );

  // ══════════════════════════════════════════
  // RENDER: History
  // ══════════════════════════════════════════
  const renderHistory = () => {
    if (savedHistory.length === 0) return null;
    const formatDate = (iso) => {
      try {
        const d = new Date(iso); const now = new Date();
        const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
        if (diff === 0) return 'Today';
        if (diff === 1) return 'Yesterday';
        if (diff < 7) return `${diff} days ago`;
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } catch { return ''; }
    };

    return (
      <div className={`mt-6 p-4 rounded-2xl border ${c.histBg}`}>
        <button onClick={() => setShowSavedHistory(!showSavedHistory)} className="w-full flex items-center gap-2 text-left">
          <span className={`text-base ${c.histAccent}`}>🔨</span>
          <span className={`text-sm font-bold ${c.text} flex-1`}>Past Transformations</span>
          <span className={`text-xs ${c.textMut}`}>{savedHistory.length}</span>
          <span className={`text-xs ${c.textMut}`}>{showSavedHistory ? '▲' : '▼'}</span>
        </button>
        {showSavedHistory && (
          <div className="mt-3 space-y-2">
            {savedHistory.map(entry => (
              <div key={entry.id} className={`rounded-xl border ${c.histCard} p-3 flex items-center gap-3`}>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-semibold ${c.text} truncate`}>{entry.preview}...</div>
                  <div className={`text-xs ${c.textMut} mt-0.5`}>
                    {formatDate(entry.date)} · {entry.channel} · {entry.relationship || 'general'} · harshness {entry.harshness}/10
                  </div>
                </div>
                <button onClick={() => loadFromHistory(entry)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${c.btnSec}`}>View</button>
                <button onClick={() => removeFromHistory(entry.id)} className={`px-2 py-1.5 rounded-lg text-xs ${c.btnGhost} hover:text-red-500`}>🗑️</button>
              </div>
            ))}
            {savedHistory.length > 1 && (
              <button onClick={() => setSavedHistory([])}
                className={`w-full mt-1 text-center text-xs font-semibold ${c.btnGhost} hover:text-red-500 py-1.5`}>
                Clear all history
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  // ══════════════════════════════════════════
  // MAIN RENDER
  // ══════════════════════════════════════════
  return (
    <div className="space-y-6">
      {renderHeader()}
      {renderMessageInput()}
      {renderContextPanel()}
      {renderTransformButton()}
      {renderError()}
      {renderCoolingPeriod()}
      {renderResults()}
      {renderHistory()}
    </div>
  );
};

VelvetHammer.displayName = 'VelvetHammer';
export default VelvetHammer;
