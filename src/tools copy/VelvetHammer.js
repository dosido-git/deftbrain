import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Loader2, AlertCircle, Copy, Check, ChevronDown, ChevronUp, Shield, Handshake, Scale, Clock, TrendingUp, Heart, Wind, RotateCcw, Pencil, X, Zap, Eye, EyeOff, ArrowRight, MessageSquare, AlertTriangle, Lightbulb } from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';

const VelvetHammer = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const resultsRef = useRef(null);

  // ─── Theme-aware colors ───
  const c = {
    bg: isDark ? 'bg-zinc-900' : 'bg-gradient-to-br from-emerald-50 via-teal-50 to-purple-50',
    card: isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-emerald-200',
    cardAlt: isDark ? 'bg-zinc-700/60 border-zinc-600' : 'bg-emerald-50/70 border-emerald-200',
    cardHighlight: isDark ? 'bg-zinc-700 border-emerald-600' : 'bg-white border-emerald-400 shadow-emerald-100',
    input: isDark
      ? 'bg-zinc-900 border-zinc-600 text-zinc-50 placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20'
      : 'bg-white border-emerald-300 text-emerald-900 placeholder:text-emerald-400 focus:border-emerald-500 focus:ring-emerald-200/60',
    text: isDark ? 'text-zinc-50' : 'text-emerald-950',
    textSecondary: isDark ? 'text-zinc-300' : 'text-emerald-700',
    textMuted: isDark ? 'text-zinc-400' : 'text-emerald-600',
    label: isDark ? 'text-zinc-200' : 'text-emerald-800',
    btnPrimary: isDark
      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30'
      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200',
    btnSecondary: isDark
      ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-50 border border-zinc-600'
      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200',
    btnOutline: isDark
      ? 'border border-zinc-600 hover:border-emerald-500 text-zinc-300 hover:text-emerald-400'
      : 'border border-emerald-300 hover:border-emerald-500 text-emerald-700 hover:text-emerald-800',
    chipActive: isDark
      ? 'bg-emerald-700 border-emerald-500 text-emerald-100'
      : 'bg-emerald-100 border-emerald-500 text-emerald-800',
    chipInactive: isDark
      ? 'bg-zinc-800 border-zinc-600 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300'
      : 'bg-white border-emerald-200 text-emerald-600 hover:border-emerald-400 hover:text-emerald-700',
    success: isDark
      ? 'bg-emerald-900/30 border-emerald-700 text-emerald-200'
      : 'bg-emerald-50 border-emerald-300 text-emerald-800',
    warning: isDark
      ? 'bg-amber-900/25 border-amber-700 text-amber-200'
      : 'bg-amber-50 border-amber-300 text-amber-800',
    info: isDark
      ? 'bg-blue-900/25 border-blue-700 text-blue-200'
      : 'bg-blue-50 border-blue-200 text-blue-900',
    error: isDark
      ? 'bg-red-900/25 border-red-700 text-red-200'
      : 'bg-red-50 border-red-200 text-red-800',
    validation: isDark
      ? 'bg-teal-900/30 border-teal-600 text-teal-200'
      : 'bg-teal-50 border-teal-300 text-teal-800',
    beforeBg: isDark ? 'bg-red-900/20' : 'bg-red-50',
    afterBg: isDark ? 'bg-emerald-900/20' : 'bg-emerald-50',
    divider: isDark ? 'border-zinc-700' : 'border-emerald-100',
  };

  // ─── Input state ───
  const [harshMessage, setHarshMessage] = useState('');
  const [relationship, setRelationship] = useState('');
  const [channel, setChannel] = useState('Email');
  const [goals, setGoals] = useState([]);
  const [powerDynamic, setPowerDynamic] = useState('equals');
  const [rageLevel, setRageLevel] = useState(3);
  const [history, setHistory] = useState('');
  const [showContext, setShowContext] = useState(true);

  // ─── Results state ───
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [activeVersion, setActiveVersion] = useState('balanced');
  const [copiedVersion, setCopiedVersion] = useState(null);

  // ─── Collapsible sections ───
  const [showConcerns, setShowConcerns] = useState(true);
  const [showBeforeAfter, setShowBeforeAfter] = useState(false);
  const [showFairness, setShowFairness] = useState(false);
  const [showInflammatory, setShowInflammatory] = useState(false);

  // ─── Refinement state ───
  const [refiningVersion, setRefiningVersion] = useState(null);
  const [refinementText, setRefinementText] = useState('');
  const [refinedVersions, setRefinedVersions] = useState({});
  const [refineLoading, setRefineLoading] = useState(false);

  // ─── Cooling period state ───
  const [showCoolingPeriod, setShowCoolingPeriod] = useState(false);
  const [coolingSeconds, setCoolingSeconds] = useState(60);
  const [resultsRevealed, setResultsRevealed] = useState(false);
  const [pendingResults, setPendingResults] = useState(null);

  // ─── Options data ───
  const relationshipOptions = [
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

  const channelOptions = [
    { value: 'Email', icon: '📧' },
    { value: 'Slack/Teams', icon: '💬' },
    { value: 'Text Message', icon: '📱' },
    { value: 'In-person script', icon: '🗣️' },
    { value: 'Letter/Formal', icon: '📝' },
    { value: 'Social Media', icon: '🌐' },
  ];

  const goalOptions = [
    { value: 'Get an apology', label: 'Get an apology' },
    { value: 'Change their behavior', label: 'Change behavior' },
    { value: 'Set a boundary', label: 'Set a boundary' },
    { value: 'Get compensation/resolution', label: 'Get resolution' },
    { value: 'Preserve the relationship', label: 'Preserve relationship' },
    { value: 'End professionally', label: 'End professionally' },
    { value: 'Document for the record', label: 'Document it' },
    { value: 'Just be heard', label: 'Just be heard' },
  ];

  const powerOptions = [
    { value: 'they_have_power', label: 'They have power over me', icon: '⬆️', desc: 'Boss, landlord, authority' },
    { value: 'equals', label: "We're equals", icon: '↔️', desc: 'Peer, friend, neighbor' },
    { value: 'i_have_leverage', label: 'I have leverage', icon: '⬇️', desc: "Client, they need something" },
  ];

  const rageEmojis = ['😤', '😠', '🤬', '💢', '🌋'];

  // ─── Cooling timer ───
  useEffect(() => {
    let interval;
    if (showCoolingPeriod && coolingSeconds > 0) {
      interval = setInterval(() => {
        setCoolingSeconds(prev => {
          if (prev <= 1) {
            setShowCoolingPeriod(false);
            setResultsRevealed(true);
            if (pendingResults) {
              setResults(pendingResults);
              setPendingResults(null);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showCoolingPeriod, coolingSeconds, pendingResults]);

  // scroll to results
  useEffect(() => {
    if (results && resultsRef.current) {
      setTimeout(() => {
        resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 200);
    }
  }, [results]);

  // ─── Handlers ───
  const toggleGoal = (goalValue) => {
    setGoals(prev =>
      prev.includes(goalValue) ? prev.filter(g => g !== goalValue) : [...prev, goalValue]
    );
  };

  const handleTransform = async () => {
    if (!harshMessage.trim()) {
      setError('Please enter a message to transform');
      return;
    }
    setError('');
    setResults(null);
    setRefinedVersions({});
    setRefiningVersion(null);
    setResultsRevealed(false);
    setActiveVersion('balanced');

    try {
      const data = await callToolEndpoint('velvet-hammer', {
        harshMessage: harshMessage.trim(),
        relationship: relationship || 'Not specified',
        channel,
        goals,
        powerDynamic,
        rageLevel,
        history: history.trim(),
      });

      // High rage → cooling period
      if (rageLevel >= 4) {
        setPendingResults(data);
        setCoolingSeconds(60);
        setShowCoolingPeriod(true);
      } else {
        setResults(data);
        setResultsRevealed(true);
      }
    } catch (err) {
      setError(err.message || 'Failed to transform message. Please try again.');
    }
  };

  const skipCooling = () => {
    setShowCoolingPeriod(false);
    setResultsRevealed(true);
    if (pendingResults) {
      setResults(pendingResults);
      setPendingResults(null);
    }
  };

  const handleCopy = async (version) => {
    const v = refinedVersions[version.style] ? { ...version, message: refinedVersions[version.style] } : version;
    let text = '';
    if (channel === 'Email' && v.subject_line) {
      text = `Subject: ${v.subject_line}\n\n${v.message}`;
    } else {
      text = v.message;
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopiedVersion(v.style);
      setTimeout(() => setCopiedVersion(null), 2200);
    } catch {
      setError('Failed to copy. Please select and copy manually.');
    }
  };

  const handleRefine = async (version) => {
    if (!refinementText.trim()) return;
    setRefineLoading(true);
    try {
      const data = await callToolEndpoint('velvet-hammer', {
        harshMessage: harshMessage.trim(),
        relationship: relationship || 'Not specified',
        channel,
        goals,
        powerDynamic,
        rageLevel,
        history: history.trim(),
        refinementRequest: refinementText.trim(),
        selectedVersion: version.style,
        originalVersion: version.message,
      });
      if (data.refined_message) {
        setRefinedVersions(prev => ({ ...prev, [version.style]: data.refined_message }));
      }
      setRefiningVersion(null);
      setRefinementText('');
    } catch (err) {
      setError(err.message || 'Failed to refine message.');
    } finally {
      setRefineLoading(false);
    }
  };

  const revertRefinement = (style) => {
    setRefinedVersions(prev => {
      const next = { ...prev };
      delete next[style];
      return next;
    });
  };

  const handleReset = () => {
    setHarshMessage('');
    setRelationship('');
    setChannel('Email');
    setGoals([]);
    setPowerDynamic('equals');
    setRageLevel(3);
    setHistory('');
    setResults(null);
    setError('');
    setRefinedVersions({});
    setRefiningVersion(null);
    setShowCoolingPeriod(false);
    setResultsRevealed(false);
    setPendingResults(null);
  };

  const exampleMessage = "I'm done covering for you. You missed ANOTHER deadline and guess who has to clean up your mess? Me, again. I've told you a hundred times and you clearly don't give a damn. This is the last time.";

  const versionIcons = {
    collaborative: <Handshake className="w-5 h-5" />,
    balanced: <Scale className="w-5 h-5" />,
    firm: <Shield className="w-5 h-5" />,
  };

  const versionColors = {
    collaborative: isDark ? 'border-teal-600 bg-teal-900/20' : 'border-teal-400 bg-teal-50/60',
    balanced: isDark ? 'border-emerald-600 bg-emerald-900/20' : 'border-emerald-400 bg-emerald-50/60',
    firm: isDark ? 'border-orange-600 bg-orange-900/20' : 'border-orange-400 bg-orange-50/60',
  };

  // ─── Chip component ───
  const Chip = ({ active, onClick, children, className = '' }) => (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all duration-150 ${
        active ? c.chipActive : c.chipInactive
      } ${className}`}
    >
      {children}
    </button>
  );

  // ─── Collapsible section ───
  const Collapsible = ({ title, icon, open, onToggle, children, badge }) => (
    <div className={`${c.card} border rounded-xl shadow-sm overflow-hidden transition-colors duration-200`}>
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between p-5 text-left hover:opacity-80 transition-opacity`}
      >
        <div className="flex items-center gap-3">
          {icon}
          <span className={`text-lg font-semibold ${c.text}`}>{title}</span>
          {badge && <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-emerald-800 text-emerald-200' : 'bg-emerald-100 text-emerald-700'}`}>{badge}</span>}
        </div>
        {open ? <ChevronUp className={`w-5 h-5 ${c.textMuted}`} /> : <ChevronDown className={`w-5 h-5 ${c.textMuted}`} />}
      </button>
      {open && <div className={`px-5 pb-5 border-t ${c.divider}`}>{children}</div>}
    </div>
  );

  // ─── Score bar ───
  const ScoreBar = ({ label, value, max = 10, color = 'emerald' }) => (
    <div className="flex items-center gap-3">
      <span className={`text-xs font-medium ${c.textMuted} w-24 shrink-0`}>{label}</span>
      <div className={`flex-1 h-2 rounded-full ${isDark ? 'bg-zinc-700' : 'bg-gray-200'}`}>
        <div
          className={`h-2 rounded-full transition-all duration-500 ${
            color === 'emerald'
              ? 'bg-emerald-500'
              : color === 'amber'
              ? 'bg-amber-500'
              : 'bg-blue-500'
          }`}
          style={{ width: `${(value / max) * 100}%` }}
        />
      </div>
      <span className={`text-xs font-mono ${c.textMuted} w-6 text-right`}>{value}</span>
    </div>
  );

  // ─── RENDER ───
  return (
    <div className="space-y-6">

      {/* ═══ Header ═══ */}
      <div className={`${c.card} border rounded-xl shadow-lg p-6 transition-colors duration-200`}>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl ${isDark ? 'bg-emerald-900/40' : 'bg-gradient-to-br from-emerald-100 to-teal-100'}`}>
            <Sparkles className={`w-7 h-7 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
          </div>
          <div>
            <h2 className={`text-2xl font-bold ${c.text}`}>Velvet Hammer ✨</h2>
            <p className={`text-sm ${c.textMuted}`}>
              Transform furious drafts into professional, assertive messages — without losing your point
            </p>
          </div>
        </div>
      </div>

      {/* ═══ Raw Message Input ═══ */}
      <div className={`${c.card} border rounded-xl shadow-lg p-6 transition-colors duration-200`}>
        <div className="mb-1">
          <div className="flex items-center justify-between mb-1">
            <label className={`text-lg font-bold ${c.text}`}>
              Say what you REALLY want to say
            </label>
            <button
              onClick={() => setHarshMessage(exampleMessage)}
              className={`text-xs ${isDark ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-600 hover:text-emerald-700'} hover:underline`}
            >
              Try example
            </button>
          </div>
          <p className={`text-sm ${c.textMuted} mb-4`}>
            No one will ever see this version. Get it all out — profanity, sarcasm, and all.
          </p>
        </div>

        <textarea
          value={harshMessage}
          onChange={(e) => setHarshMessage(e.target.value)}
          placeholder={`e.g., "You're completely incompetent and I'm sick of doing your job for you. This is the third time you've dropped the ball and I'm done."`}
          className={`w-full h-36 p-4 border-2 rounded-xl ${c.input} outline-none focus:ring-2 resize-none text-base transition-colors duration-200`}
        />

        <div className="flex items-center justify-between mt-3">
          <span className={`text-xs ${c.textMuted}`}>{harshMessage.length} characters</span>
          {/* Rage Level */}
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium ${c.textMuted}`}>How angry?</span>
            <div className="flex gap-1">
              {rageEmojis.map((emoji, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setRageLevel(idx + 1)}
                  className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center transition-all duration-150 ${
                    rageLevel >= idx + 1
                      ? isDark
                        ? 'bg-red-900/40 scale-110'
                        : 'bg-red-100 scale-110'
                      : isDark
                      ? 'bg-zinc-800 opacity-40 hover:opacity-70'
                      : 'bg-gray-100 opacity-40 hover:opacity-70'
                  }`}
                  title={`Rage level ${idx + 1}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Context Panel ═══ */}
      <div className={`${c.card} border rounded-xl shadow-lg overflow-hidden transition-colors duration-200`}>
        <button
          onClick={() => setShowContext(!showContext)}
          className="w-full flex items-center justify-between p-5 hover:opacity-80 transition-opacity"
        >
          <div className="flex items-center gap-3">
            <Lightbulb className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
            <span className={`font-semibold ${c.text}`}>Context &amp; Calibration</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-zinc-700 text-zinc-400' : 'bg-emerald-100 text-emerald-600'}`}>
              Better results with context
            </span>
          </div>
          {showContext
            ? <ChevronUp className={`w-5 h-5 ${c.textMuted}`} />
            : <ChevronDown className={`w-5 h-5 ${c.textMuted}`} />
          }
        </button>

        {showContext && (
          <div className={`px-5 pb-6 space-y-6 border-t ${c.divider}`}>
            
            {/* Relationship */}
            <div className="pt-4">
              <label className={`block text-sm font-semibold ${c.label} mb-2`}>Who is this to?</label>
              <div className="flex flex-wrap gap-2">
                {relationshipOptions.map(opt => (
                  <Chip
                    key={opt.value}
                    active={relationship === opt.value}
                    onClick={() => setRelationship(relationship === opt.value ? '' : opt.value)}
                  >
                    {opt.icon} {opt.value}
                  </Chip>
                ))}
              </div>
            </div>

            {/* Channel */}
            <div>
              <label className={`block text-sm font-semibold ${c.label} mb-2`}>How will you send it?</label>
              <div className="flex flex-wrap gap-2">
                {channelOptions.map(opt => (
                  <Chip
                    key={opt.value}
                    active={channel === opt.value}
                    onClick={() => setChannel(opt.value)}
                  >
                    {opt.icon} {opt.value}
                  </Chip>
                ))}
              </div>
            </div>

            {/* Goals */}
            <div>
              <label className={`block text-sm font-semibold ${c.label} mb-1`}>What do you want to achieve?</label>
              <p className={`text-xs ${c.textMuted} mb-2`}>Select all that apply</p>
              <div className="flex flex-wrap gap-2">
                {goalOptions.map(opt => (
                  <Chip
                    key={opt.value}
                    active={goals.includes(opt.value)}
                    onClick={() => toggleGoal(opt.value)}
                  >
                    {opt.label}
                  </Chip>
                ))}
              </div>
            </div>

            {/* Power Dynamic */}
            <div>
              <label className={`block text-sm font-semibold ${c.label} mb-2`}>Power dynamic</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {powerOptions.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPowerDynamic(opt.value)}
                    className={`p-3 rounded-xl border-2 text-left transition-all duration-150 ${
                      powerDynamic === opt.value
                        ? c.chipActive + ' border-emerald-500'
                        : (isDark ? 'bg-zinc-800 border-zinc-600 hover:border-zinc-500' : 'bg-white border-emerald-200 hover:border-emerald-400')
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{opt.icon}</span>
                      <span className={`text-sm font-medium ${powerDynamic === opt.value ? '' : c.textSecondary}`}>{opt.label}</span>
                    </div>
                    <p className={`text-xs mt-1 ${c.textMuted}`}>{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* History */}
            <div>
              <label className={`block text-sm font-semibold ${c.label} mb-2`}>Backstory (optional)</label>
              <textarea
                value={history}
                onChange={(e) => setHistory(e.target.value)}
                placeholder={`e.g., "This is the 3rd time they've missed a deadline" or "We used to be close but things have been tense"`}
                className={`w-full p-3 border rounded-xl ${c.input} outline-none focus:ring-2 resize-none text-sm transition-colors duration-200`}
                rows={2}
              />
            </div>
          </div>
        )}
      </div>

      {/* ═══ Transform Button ═══ */}
      <div className="flex gap-3">
        <button
          onClick={handleTransform}
          disabled={loading || !harshMessage.trim()}
          className={`flex-1 ${c.btnPrimary} disabled:opacity-50 disabled:cursor-not-allowed font-bold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 text-lg`}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Translating your rage into eloquence...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Transform Message
            </>
          )}
        </button>
        {results && (
          <button
            onClick={handleReset}
            className={`${c.btnOutline} px-4 rounded-xl transition-colors duration-200`}
            title="Start over"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className={`p-4 ${c.error} border rounded-xl flex items-start gap-3 transition-colors duration-200`}>
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* ═══ Cooling Period ═══ */}
      {showCoolingPeriod && (
        <div className={`${c.card} border-2 rounded-xl shadow-xl p-8 text-center transition-colors duration-200`}>
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-5 ${isDark ? 'bg-teal-900/40' : 'bg-teal-100'}`}>
            <Wind className={`w-10 h-10 ${isDark ? 'text-teal-400' : 'text-teal-600'} animate-pulse`} />
          </div>
          <h3 className={`text-xl font-bold ${c.text} mb-2`}>Your results are ready.</h3>
          <p className={`${c.textSecondary} mb-6`}>
            Before you copy and send, take a breath. Messages sent at peak anger have a much higher chance of escalating conflict.
          </p>
          <div className={`text-5xl font-mono font-bold mb-6 ${isDark ? 'text-teal-400' : 'text-teal-600'}`}>
            0:{coolingSeconds.toString().padStart(2, '0')}
          </div>
          <div className={`flex items-center justify-center gap-2 mb-6 text-sm ${c.textMuted}`}>
            <Clock className="w-4 h-4" />
            <span>Breathe in for 4 seconds... hold for 4... out for 4...</span>
          </div>
          <button
            onClick={skipCooling}
            className={`${c.btnOutline} px-6 py-2 rounded-lg text-sm transition-colors duration-200`}
          >
            I'm calm — show results
          </button>
        </div>
      )}

      {/* ═══ RESULTS ═══ */}
      {results && resultsRevealed && (
        <div ref={resultsRef} className="space-y-5">

          {/* ── Emotional Validation ── */}
          {results.emotional_validation && (
            <div className={`${c.validation} border-2 rounded-xl p-5 transition-colors duration-200`}>
              <div className="flex items-start gap-3">
                <Heart className={`w-6 h-6 flex-shrink-0 mt-0.5 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />
                <div>
                  <p className={`font-semibold mb-1 ${isDark ? 'text-teal-100' : 'text-teal-900'}`}>We hear you</p>
                  <p className="text-sm leading-relaxed">{results.emotional_validation}</p>
                </div>
              </div>
            </div>
          )}

          {/* ── Harshness Score ── */}
          {results.original_harshness && (
            <div className={`${c.warning} border rounded-xl p-4 transition-colors duration-200`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Original harshness</span>
                <span className="text-sm font-bold">{results.original_harshness}/10</span>
              </div>
              <div className={`mt-2 h-2 rounded-full ${isDark ? 'bg-zinc-700' : 'bg-amber-200'}`}>
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-amber-400 to-red-500 transition-all duration-700"
                  style={{ width: `${(results.original_harshness / 10) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* ── Legitimate Concerns ── */}
          {results.legitimate_concerns && results.legitimate_concerns.length > 0 && (
            <Collapsible
              title="Your Valid Points"
              icon={<Check className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />}
              open={showConcerns}
              onToggle={() => setShowConcerns(!showConcerns)}
              badge={`${results.legitimate_concerns.length} preserved`}
            >
              <p className={`text-xs ${c.textMuted} mb-3 mt-3`}>These are kept in every version below</p>
              <ul className="space-y-2">
                {results.legitimate_concerns.map((concern, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                    <span className={`text-sm ${c.textSecondary}`}>{concern}</span>
                  </li>
                ))}
              </ul>
            </Collapsible>
          )}

          {/* ── Version Tabs + Cards (Main Event) ── */}
          {results.versions && results.versions.length > 0 && (
            <div className={`${c.card} border rounded-xl shadow-lg overflow-hidden transition-colors duration-200`}>
              {/* Tab bar */}
              <div className={`flex border-b ${c.divider}`}>
                {results.versions.map((v) => (
                  <button
                    key={v.style}
                    onClick={() => setActiveVersion(v.style)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-semibold transition-all duration-200 ${
                      activeVersion === v.style
                        ? isDark
                          ? 'bg-zinc-700 text-emerald-400 border-b-2 border-emerald-500'
                          : 'bg-emerald-50 text-emerald-700 border-b-2 border-emerald-600'
                        : isDark
                        ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-750'
                        : 'text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50/50'
                    }`}
                  >
                    {versionIcons[v.style]}
                    <span className="hidden sm:inline">{v.label?.split('—')[0]?.trim() || v.style}</span>
                    <span className="sm:hidden capitalize">{v.style}</span>
                  </button>
                ))}
              </div>

              {/* Active version content */}
              {results.versions.map((v) => {
                if (v.style !== activeVersion) return null;
                const displayMessage = refinedVersions[v.style] || v.message;
                const isRefined = !!refinedVersions[v.style];
                return (
                  <div key={v.style} className="p-6 space-y-5">
                    {/* Best for */}
                    {v.best_for && (
                      <div className={`text-sm ${c.textMuted} flex items-center gap-2`}>
                        <Lightbulb className="w-4 h-4" />
                        <span><strong>Best for:</strong> {v.best_for}</span>
                      </div>
                    )}

                    {/* Subject line for email */}
                    {channel === 'Email' && v.subject_line && (
                      <div className={`${c.cardAlt} border rounded-lg px-4 py-2 text-sm`}>
                        <span className={`font-semibold ${c.label}`}>Subject: </span>
                        <span className={c.textSecondary}>{v.subject_line}</span>
                      </div>
                    )}

                    {/* The message */}
                    <div className={`${versionColors[v.style]} border-2 rounded-xl p-5`}>
                      {isRefined && (
                        <div className={`text-xs font-medium mb-2 flex items-center gap-1 ${isDark ? 'text-purple-300' : 'text-purple-600'}`}>
                          <Pencil className="w-3 h-3" /> Refined version
                          <button onClick={() => revertRefinement(v.style)} className="ml-2 underline hover:no-underline">Revert</button>
                        </div>
                      )}
                      <p className={`text-base leading-relaxed whitespace-pre-wrap ${c.text}`}>
                        {displayMessage}
                      </p>
                    </div>

                    {/* Scores */}
                    {(v.tone_score || v.assertiveness_score) && (
                      <div className="space-y-2">
                        {v.tone_score && <ScoreBar label="Warmth" value={v.tone_score} color="emerald" />}
                        {v.assertiveness_score && <ScoreBar label="Assertiveness" value={v.assertiveness_score} color="amber" />}
                      </div>
                    )}

                    {/* Key techniques */}
                    {v.key_techniques && v.key_techniques.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {v.key_techniques.map((tech, idx) => (
                          <span key={idx} className={`text-xs px-2.5 py-1 rounded-full ${isDark ? 'bg-zinc-700 text-zinc-300' : 'bg-emerald-100 text-emerald-700'}`}>
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-3 pt-2">
                      <button
                        onClick={() => handleCopy(v)}
                        className={`${c.btnPrimary} px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all duration-200`}
                      >
                        {copiedVersion === v.style ? (
                          <><Check className="w-4 h-4" /> Copied!</>
                        ) : (
                          <><Copy className="w-4 h-4" /> Copy{channel === 'Email' ? ' with subject' : ''}</>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setRefiningVersion(refiningVersion === v.style ? null : v.style);
                          setRefinementText('');
                        }}
                        className={`${c.btnOutline} px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors duration-200`}
                      >
                        <Pencil className="w-4 h-4" /> Refine
                      </button>
                    </div>

                    {/* Refinement input */}
                    {refiningVersion === v.style && (
                      <div className={`${c.cardAlt} border rounded-xl p-4 space-y-3`}>
                        <label className={`text-sm font-semibold ${c.label}`}>How should I adjust this?</label>
                        <textarea
                          value={refinementText}
                          onChange={(e) => setRefinementText(e.target.value)}
                          placeholder={`e.g., "Make it shorter", "Mention the March 15 deadline", "Sound less apologetic", "Add that this is the 3rd time"`}
                          className={`w-full p-3 border rounded-lg ${c.input} outline-none focus:ring-2 resize-none text-sm`}
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRefine(v)}
                            disabled={refineLoading || !refinementText.trim()}
                            className={`${c.btnPrimary} px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {refineLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            Refine
                          </button>
                          <button
                            onClick={() => { setRefiningVersion(null); setRefinementText(''); }}
                            className={`${c.btnSecondary} px-4 py-2 rounded-lg text-sm`}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Before → After Breakdown ── */}
          {results.before_after && results.before_after.length > 0 && (
            <Collapsible
              title="Before → After"
              icon={<ArrowRight className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />}
              open={showBeforeAfter}
              onToggle={() => setShowBeforeAfter(!showBeforeAfter)}
              badge={`${results.before_after.length} changes`}
            >
              <div className="space-y-4 mt-4">
                {results.before_after.map((item, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className={`${c.beforeBg} rounded-lg p-3 border ${isDark ? 'border-red-800' : 'border-red-200'}`}>
                        <span className={`text-xs font-semibold ${isDark ? 'text-red-400' : 'text-red-500'} block mb-1`}>BEFORE</span>
                        <p className={`text-sm line-through opacity-80 ${c.textSecondary}`}>{item.original_snippet}</p>
                      </div>
                      <div className={`${c.afterBg} rounded-lg p-3 border ${isDark ? 'border-emerald-800' : 'border-emerald-200'}`}>
                        <span className={`text-xs font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-600'} block mb-1`}>AFTER</span>
                        <p className={`text-sm ${c.textSecondary}`}>{item.transformed_to}</p>
                      </div>
                    </div>
                    {item.why && (
                      <p className={`text-xs ${c.textMuted} pl-1`}>↳ {item.why}</p>
                    )}
                  </div>
                ))}
              </div>
            </Collapsible>
          )}

          {/* ── Fairness Check ── */}
          {results.fairness_check && (
            <Collapsible
              title="Fairness Check"
              icon={<Scale className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />}
              open={showFairness}
              onToggle={() => setShowFairness(!showFairness)}
            >
              <div className="space-y-4 mt-4">
                {results.fairness_check.valid_claims && results.fairness_check.valid_claims.length > 0 && (
                  <div>
                    <p className={`text-sm font-semibold ${c.label} mb-2`}>✓ Defensible claims (kept as-is)</p>
                    <ul className="space-y-1">
                      {results.fairness_check.valid_claims.map((claim, idx) => (
                        <li key={idx} className={`text-sm ${c.textSecondary} flex items-start gap-2`}>
                          <Check className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                          {claim}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {results.fairness_check.exaggerations && results.fairness_check.exaggerations.length > 0 && (
                  <div>
                    <p className={`text-sm font-semibold ${c.label} mb-2`}>⚠ Exaggerations (toned down)</p>
                    <ul className="space-y-1">
                      {results.fairness_check.exaggerations.map((ex, idx) => (
                        <li key={idx} className={`text-sm ${c.textSecondary} flex items-start gap-2`}>
                          <AlertTriangle className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                          {ex}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {results.fairness_check.missing_perspective && (
                  <div className={`${c.info} border rounded-lg p-3`}>
                    <p className={`text-sm font-semibold mb-1`}>Their possible perspective</p>
                    <p className="text-sm">{results.fairness_check.missing_perspective}</p>
                  </div>
                )}
              </div>
            </Collapsible>
          )}

          {/* ── Inflammatory Elements ── */}
          {results.inflammatory_elements && results.inflammatory_elements.length > 0 && (
            <Collapsible
              title="Why the Original Would Backfire"
              icon={<Zap className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />}
              open={showInflammatory}
              onToggle={() => setShowInflammatory(!showInflammatory)}
              badge={`${results.inflammatory_elements.length} issues`}
            >
              <div className="space-y-3 mt-4">
                {results.inflammatory_elements.map((el, idx) => (
                  <div key={idx} className={`${c.cardAlt} border rounded-lg p-4`}>
                    <p className={`text-sm font-mono ${isDark ? 'text-red-300' : 'text-red-700'} mb-2`}>
                      "{el.original_phrase}"
                    </p>
                    <p className={`text-xs ${c.textSecondary} mb-1`}>
                      <strong>Problem:</strong> {el.problem}
                    </p>
                    <p className={`text-xs ${c.textMuted}`}>
                      <strong>Risk:</strong> {el.risk}
                    </p>
                  </div>
                ))}
              </div>
            </Collapsible>
          )}

          {/* ── Strategic Notes ── */}
          {results.strategic_notes && (
            <div className={`${c.card} border rounded-xl shadow-sm p-5 transition-colors duration-200`}>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                <span className={`text-lg font-semibold ${c.text}`}>Strategic Notes</span>
              </div>
              <div className="space-y-3">
                {results.strategic_notes.timing_advice && (
                  <div className="flex items-start gap-3">
                    <Clock className={`w-4 h-4 mt-0.5 flex-shrink-0 ${c.textMuted}`} />
                    <div>
                      <span className={`text-xs font-semibold uppercase ${c.textMuted}`}>Timing</span>
                      <p className={`text-sm ${c.textSecondary}`}>{results.strategic_notes.timing_advice}</p>
                    </div>
                  </div>
                )}
                {results.strategic_notes.escalation_warning && (
                  <div className={`flex items-start gap-3 ${c.warning} border rounded-lg p-3`}>
                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className={`text-xs font-semibold uppercase`}>Escalation note</span>
                      <p className="text-sm">{results.strategic_notes.escalation_warning}</p>
                    </div>
                  </div>
                )}
                {results.strategic_notes.follow_up && (
                  <div className="flex items-start gap-3">
                    <MessageSquare className={`w-4 h-4 mt-0.5 flex-shrink-0 ${c.textMuted}`} />
                    <div>
                      <span className={`text-xs font-semibold uppercase ${c.textMuted}`}>If they don't respond well</span>
                      <p className={`text-sm ${c.textSecondary}`}>{results.strategic_notes.follow_up}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default VelvetHammer;
