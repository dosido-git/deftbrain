import React, { useState, useRef, useEffect } from 'react';

import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';
import { usePersistentState } from '../hooks/usePersistentState';
import { CopyBtn, ActionBar } from '../components/ActionButtons';

const DifficultTalkCoach = ({ tool }) => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const { isDark } = useTheme();
  const chatEndRef = useRef(null);

  // ─── Theme ───
  const c = {
    card: isDark ? 'bg-zinc-800' : 'bg-white',
    cardAlt: isDark ? 'bg-zinc-700/50' : 'bg-slate-50',
    text: isDark ? 'text-zinc-50' : 'text-gray-900',
    textSecondary: isDark ? 'text-zinc-300' : 'text-gray-600',
    textMuted: isDark ? 'text-zinc-500' : 'text-gray-400',
    input: isDark ? 'bg-zinc-700 border-zinc-600 text-zinc-100 placeholder-zinc-400 focus:ring-cyan-500 focus:border-cyan-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-cyan-500 focus:border-cyan-500',
    btnPrimary: isDark ? 'bg-cyan-600 hover:bg-cyan-500 text-white' : 'bg-cyan-600 hover:bg-cyan-700 text-white',
    btnSecondary: isDark ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-100' : 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    border: isDark ? 'border-zinc-700' : 'border-gray-200',
    success: isDark ? 'bg-green-900/20 border-green-700 text-green-200' : 'bg-green-50 border-green-300 text-green-800',
    warning: isDark ? 'bg-amber-900/20 border-amber-700 text-amber-200' : 'bg-amber-50 border-amber-300 text-amber-800',
    danger: isDark ? 'bg-red-900/20 border-red-700 text-red-200' : 'bg-red-50 border-red-200 text-red-800',
    // Bespoke tool-specific keys
    chipActive: isDark ? 'bg-cyan-900/40 border-cyan-500 text-cyan-200' : 'bg-cyan-50 border-cyan-500 text-cyan-800',
    chipInactive: isDark ? 'border-zinc-600 text-zinc-400 hover:border-zinc-500' : 'border-gray-200 text-gray-600 hover:border-gray-300',
    tabActive: isDark ? 'border-cyan-500 text-cyan-300' : 'border-cyan-600 text-cyan-700',
    tabInactive: isDark ? 'border-transparent text-zinc-500 hover:text-zinc-300' : 'border-transparent text-gray-400 hover:text-gray-600',
    highlight: isDark ? 'bg-cyan-900/20 border-cyan-700 text-cyan-200' : 'bg-cyan-50 border-cyan-200 text-cyan-800',
    simUser: isDark ? 'bg-cyan-900/30 border-cyan-700' : 'bg-cyan-50 border-cyan-200',
    simThem: isDark ? 'bg-zinc-700 border-zinc-600' : 'bg-gray-100 border-gray-200',
    simCoach: isDark ? 'bg-amber-900/20 border-amber-700' : 'bg-amber-50 border-amber-200',
  };

  const chip = (active) => active ? c.chipActive : c.chipInactive;
  const tab = (active) => active ? c.tabActive : c.tabInactive;

  const linkStyle = isDark
    ? 'text-cyan-400 hover:text-cyan-300 underline underline-offset-2'
    : 'text-cyan-600 hover:text-cyan-700 underline underline-offset-2';

  // ─── Input State ───
  const [topic, setTopic] = usePersistentState('dtc-topic', '');
  const [relationship, setRelationship] = useState('');
  const [communicationStyle, setCommunicationStyle] = useState('Direct');
  const [resistanceLevel, setResistanceLevel] = useState(50);
  const [goals, setGoals] = useState([]);
  const [fears, setFears] = useState([]);
  const [biggestFear, setBiggestFear] = useState('');
  const [theirPerspective, setTheirPerspective] = useState('');
  const [previousAttempts, setPreviousAttempts] = useState('');

  // ─── Results State ───
  const [results, setResults] = usePersistentState('dtc-results', null);
  const resultsRef = useRef(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('prepare');
  const [expandedSections, setExpandedSections] = useState({});
  const [expandedApproach, setExpandedApproach] = useState(0);
  const [expandedPushback, setExpandedPushback] = useState(false);

  // ─── Simulation State ───
  const [simMessages, setSimMessages] = useState([]);
  const [simInput, setSimInput] = useState('');
  const [simLoading, setSimLoading] = useState(false);
  const [simStarted, setSimStarted] = useState(false);
  const [simOpenness, setSimOpenness] = useState(50);
  const [practiceResistance, setPracticeResistance] = useState(null); // null = use original

  // ─── Practice Summary State ───
  const [practiceSummary, setPracticeSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [showCorrection, setShowCorrection] = useState(null); // index of message to correct
  const [correctionText, setCorrectionText] = useState('');

  // ─── Debrief State ───
  const [howItWent, setHowItWent] = useState('');
  const [debriefResults, setDebriefResults] = useState(null);
  const [debriefLoading, setDebriefLoading] = useState(false);
  const [debriefMode, setDebriefMode] = useState('real'); // 'real' or 'practice'

  // ─── Persistent State ───
  const [strategyHistory, setStrategyHistory] = usePersistentState('dtc-history', []);

  // ─── Options ───
  const relationships = [
    { value: 'Partner/Spouse', icon: '💕' },
    { value: 'Family Member', icon: '👨‍👩‍👧' },
    { value: 'Friend', icon: '🫂' },
    { value: 'Boss', icon: '👔' },
    { value: 'Coworker', icon: '🤝' },
    { value: 'Direct Report', icon: '📋' },
    { value: 'Client', icon: '💼' },
    { value: 'Landlord', icon: '🏠' },
    { value: 'Roommate', icon: '🏘️' },
    { value: 'Neighbor', icon: '🏡' },
    { value: 'Doctor/Provider', icon: '⚕️' },
    { value: 'Other', icon: '💬' },
  ];

  const goalOptions = [
    { key: 'setBoundary', label: 'Set a boundary', icon: '🛡️' },
    { key: 'requestChange', label: 'Request a change', icon: '🔄' },
    { key: 'addressConflict', label: 'Address a conflict', icon: '⚡' },
    { key: 'giveFeedback', label: 'Give feedback', icon: '💬' },
    { key: 'askForSomething', label: 'Ask for something', icon: '🙋' },
    { key: 'endRelationship', label: 'End or step back', icon: '🚪' },
    { key: 'apologize', label: 'Deliver an apology', icon: '🕊️' },
    { key: 'sayNo', label: 'Say no', icon: '✋' },
    { key: 'addressDisrespect', label: 'Address disrespect', icon: '👊' },
    { key: 'pushBack', label: 'Push back', icon: '🪨' },
    { key: 'declineNoExplain', label: 'Decline (no explanation)', icon: '🚫' },
  ];

  const FEARS = [
    { id: 'angry', label: "They'll get angry" },
    { id: 'selfish', label: "They'll think I'm selfish" },
    { id: 'guilt', label: "They'll guilt-trip me" },
    { id: 'damage', label: "I'll damage the relationship" },
    { id: 'retaliate', label: "They'll retaliate" },
    { id: 'feel_guilty', label: "I'll feel guilty afterward" },
    { id: 'cry', label: "They'll cry" },
    { id: 'deny', label: "They'll deny everything" },
  ];

  const resistanceLabels = [
    { min: 0, max: 20, label: 'Very receptive', color: isDark ? 'text-green-400' : 'text-green-600' },
    { min: 21, max: 40, label: 'Somewhat open', color: isDark ? 'text-emerald-400' : 'text-emerald-600' },
    { min: 41, max: 60, label: 'Defensive', color: isDark ? 'text-amber-400' : 'text-amber-600' },
    { min: 61, max: 80, label: 'Very resistant', color: isDark ? 'text-amber-500' : 'text-amber-700' },
    { min: 81, max: 100, label: 'Hostile / Shutdown', color: isDark ? 'text-red-400' : 'text-red-600' },
  ];

  const getResistanceInfo = (level) => resistanceLabels.find(r => level >= r.min && level <= r.max) || resistanceLabels[2];

  // ─── Handlers ───
  const toggleGoal = (key) => setGoals(prev => prev.includes(key) ? prev.filter(g => g !== key) : [...prev, key]);
  const toggleFear = (id) => setFears(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  const toggleSection = (key) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));

  const handleGenerate = async () => {
    if (!topic.trim()) { setError('Please describe the conversation'); return; }
    if (!relationship) { setError('Please select the relationship'); return; }
    if (goals.length === 0) { setError('Please select at least one goal'); return; }
    setError('');
    setResults(null);
    setSimMessages([]);
    setSimStarted(false);
    setDebriefResults(null);

    try {
      const data = await callToolEndpoint('difficult-talk-coach', {
        topic: topic.trim(),
        relationship,
        communicationStyle,
        resistanceLevel,
        goals,
        fears: fears.map(id => FEARS.find(f => f.id === id)?.label).filter(Boolean),
        biggestFear: biggestFear.trim() || null,
        theirPerspective: theirPerspective.trim() || null,
        previousAttempts: previousAttempts.trim() || null,
        userLanguage: navigator.language || 'en',
      });
      setResults(data);
      setActiveTab('prepare');
      setExpandedApproach(0);
      setSimOpenness(50);
      setPracticeResistance(null);
      setPracticeSummary(null);
      // Save to history
      setStrategyHistory(prev => [{
        id: Date.now().toString(),
        topic: topic.trim().slice(0, 60),
        relationship,
        date: new Date().toISOString(),
        approachCount: data.conversation_approaches?.length || 0,
        preview: topic.trim().slice(0, 40),
      }, ...prev].slice(0, 6));
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      setError(err.message || 'Failed to generate strategy. Please try again.');
    }
  };

  const handleSimSend = async () => {
    if (!simInput.trim() || simLoading) return;
    const userMsg = simInput.trim();
    setSimInput('');
    const newMessages = [...simMessages, { role: 'user', content: userMsg }];
    setSimMessages(newMessages);
    setSimStarted(true);
    setSimLoading(true);

    try {
      const data = await callToolEndpoint('difficult-talk-simulate', {
        topic,
        relationship,
        resistanceLevel: practiceResistance ?? resistanceLevel,
        theirPerspective: theirPerspective || null,
        conversationHistory: newMessages,
        userMessage: userMsg,
        chosenApproach: results?.conversation_approaches?.[expandedApproach] || null,
        emotionalLandmines: results?.emotional_landmines || null,
        currentOpenness: simOpenness,
        userLanguage: navigator.language || 'en',
      });
      // Update openness based on shift
      const newOpenness = Math.max(0, Math.min(100, simOpenness + (data.openness_shift || 0)));
      setSimOpenness(newOpenness);
      setSimMessages(prev => [...prev, {
        role: 'them',
        content: data.their_response,
        emotionalState: data.their_emotional_state,
        coaching: data.coaching_note,
        suggestion: data.suggestion,
        health: data.conversation_health,
        openness_shift: data.openness_shift,
        openness_reason: data.openness_reason,
        technique_used: data.technique_used,
      }]);
    } catch (err) {
      setSimMessages(prev => [...prev, { role: 'system', content: 'Simulation error — please try again.' }]);
    }
    setSimLoading(false);
  };

  // ── Correction mechanism: "They wouldn't say that" ──
  const handleCorrection = async (msgIndex) => {
    if (!correctionText.trim()) return;
    // Replace the AI's response with the user's correction and re-simulate
    const corrected = [...simMessages];
    corrected[msgIndex] = {
      ...corrected[msgIndex],
      content: correctionText.trim(),
      emotionalState: 'corrected by user',
      coaching: null,
      suggestion: null,
      health: corrected[msgIndex].health,
      _corrected: true,
    };
    setSimMessages(corrected);
    setShowCorrection(null);
    setCorrectionText('');
  };

  // ── Practice summary ──
  const handlePracticeSummary = async () => {
    if (simMessages.length < 2) return;
    setSummaryLoading(true);
    setPracticeSummary(null);
    try {
      const data = await callToolEndpoint('difficult-talk-practice-summary', {
        topic,
        relationship,
        resistanceLevel: practiceResistance ?? resistanceLevel,
        chosenApproach: results?.conversation_approaches?.[expandedApproach] || null,
        emotionalLandmines: results?.emotional_landmines || null,
        transcript: simMessages,
        userLanguage: navigator.language || 'en',
      });
      setPracticeSummary(data);
    } catch (err) {
      setError(err.message || 'Failed to generate practice summary');
    }
    setSummaryLoading(false);
  };

  // ── Debrief with practice transcript ──
  const handleDebriefPractice = async () => {
    if (simMessages.length < 2) return;
    setDebriefLoading(true);
    setDebriefResults(null);
    try {
      const data = await callToolEndpoint('difficult-talk-debrief', {
        originalTopic: topic,
        relationship,
        howItWent: null,
        originalStrategy: results?.conversation_approaches?.[expandedApproach] || null,
        practiceTranscript: simMessages,
        userLanguage: navigator.language || 'en',
      });
      setDebriefResults(data);
      setDebriefMode('practice');
    } catch (err) {
      setError(err.message || 'Failed to debrief practice session');
    }
    setDebriefLoading(false);
  };

  const handleDebrief = async () => {
    if (!howItWent.trim()) { setError('Please describe how the conversation went'); return; }
    setError('');
    setDebriefResults(null);
    setDebriefLoading(true);
    try {
      const data = await callToolEndpoint('difficult-talk-debrief', {
        originalTopic: topic,
        relationship,
        howItWent: howItWent.trim(),
        originalStrategy: results?.conversation_approaches?.[expandedApproach] || null,
        userLanguage: navigator.language || 'en',
      });
      setDebriefResults(data);
      setDebriefMode('real');
    } catch (err) {
      setError(err.message || 'Failed to generate debrief.');
    }
    setDebriefLoading(false);
  };

  const reset = () => {
    setTopic(''); setRelationship(''); setGoals([]); setFears([]); setBiggestFear('');
    setTheirPerspective(''); setPreviousAttempts('');
    setResults(null); setError(''); setSimMessages([]); setSimStarted(false);
    setDebriefResults(null); setHowItWent(''); setActiveTab('prepare');
    setSimOpenness(50); setPracticeResistance(null);
    setPracticeSummary(null); setShowCorrection(null); setCorrectionText('');
    setDebriefMode('real'); setExpandedPushback(false);
  };

  // Auto-scroll chat
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [simMessages]);

  const buildFullText = () => {
    if (!results) return '';
    const lines = ['DIFFICULT CONVERSATION STRATEGY', `Topic: ${topic}`, `With: ${relationship}`, ''];
    if (results.validation) { lines.push('💪 YOU HAVE THE RIGHT TO SAY THIS', results.validation, ''); }
    if (results.reality_check) { lines.push('🛡️ EXPECT THIS', results.reality_check, ''); }
    const sr = results.situation_reading;
    if (sr) { lines.push('SITUATION READING', sr.key_insight, `Best case: ${sr.realistic_best_case}`, `Floor: ${sr.realistic_floor}`, ''); }
    results.emotional_landmines?.forEach((lm, i) => {
      lines.push(`LANDMINE ${i + 1}: ${lm.they_might}`, `Your trigger: ${lm.your_trigger}`, `Instead of: ${lm.instinct_response}`, `Say: ${lm.strategic_response}`, '');
    });
    results.conversation_approaches?.forEach(a => {
      lines.push(`═══ ${a.approach_name.toUpperCase()} ═══`, `Opening: ${a.script.opening}`, '', a.script.main_points.join('\n'), '', `Closing: ${a.script.closing}`, '');
    });
    results.firmness_messages?.forEach(msg => {
      lines.push(`── ${msg.label.toUpperCase()} ──`, `"${msg.text}"`, msg.what_this_does || '', '');
    });
    if (results.pushback_scripts) {
      lines.push('IF THEY PUSH BACK');
      Object.entries(results.pushback_scripts).forEach(([key, script]) => {
        lines.push(`${key.replace(/_/g, ' ').toUpperCase()}: ${script}`);
      });
      lines.push('');
    }
    if (results.follow_up_guidance) { lines.push('AFTER YOU SAY IT', results.follow_up_guidance, ''); }
    lines.push('───', 'Generated by DeftBrain · deftbrain.com');
    return lines.join('\n');
  };

  const buildQuickRefText = () => {
    if (!results) return '';
    const approach = results.conversation_approaches?.[expandedApproach];
    if (!approach) return '';
    const lines = [
      `QUICK REFERENCE — ${approach.approach_name.toUpperCase()}`,
      `Topic: ${topic}`,
      `With: ${relationship}`,
      '',
      '🎤 YOUR OPENING LINE',
      `"${approach.script.opening}"`,
      '',
      '✅ PHRASES TO REACH FOR',
      ...approach.script.specific_phrases.slice(0, 6).map(p => `• "${p}"`),
      '',
    ];
    if (approach.what_NOT_to_say?.length > 0) {
      lines.push('🚫 DON\'T SAY', ...approach.what_NOT_to_say.slice(0, 6).map(i => `• ${i}`), '');
    }
    if (results.deescalation_toolkit?.tension_lowering_phrases?.length > 0) {
      lines.push('🛡️ IF THEY GET DEFENSIVE', ...results.deescalation_toolkit.tension_lowering_phrases.slice(0, 6).map(p => `• "${p}"`), '');
    }
    lines.push('🏁 CLOSING LINE', `"${approach.script.closing}"`, '');
    if (results.deescalation_toolkit?.exit_protocol) {
      lines.push('🚨 EXIT IF NEEDED', results.deescalation_toolkit.exit_protocol, '');
    }
    if (results.preparation_plan?.mindset_anchor) {
      lines.push('🧘 REMEMBER', `"${results.preparation_plan.mindset_anchor}"`, '');
    }
    lines.push('───', 'Generated by DeftBrain · deftbrain.com');
    return lines.join('\n');
  };

  const healthColors = {
    on_track: isDark ? 'text-green-400' : 'text-green-600',
    drifting: isDark ? 'text-amber-400' : 'text-amber-600',
    derailing: isDark ? 'text-red-400' : 'text-red-600',
  };

  // ─── RENDER ───
  return (
    <div>
      {/* Range slider thumb styling — needed because appearance:none removes the native thumb */}
      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: rgb(124,58,237);
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
          margin-top: -4px;
        }
        input[type="range"]::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: rgb(124,58,237);
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        }
      `}</style>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className={`text-2xl font-bold ${c.text}`}><span className="mr-2">{tool?.icon ?? '🗣️'}</span>{tool?.title || 'Difficult Talk Coach'}</h2>
          <p className={`text-sm ${c.textMuted}`}>{tool?.tagline || 'Practice hard conversations before they happen'}</p>
        </div>
        {strategyHistory.length > 0 && !results && (
          <button onClick={() => toggleSection('history')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${c.btnSecondary}`}>
            <span>📁</span> Past ({strategyHistory.length})
          </button>
        )}
      </div>

      {/* Strategy History */}
      {!results && expandedSections.history && strategyHistory.length > 0 && (
        <div className={`${c.card} rounded-xl shadow-lg p-5 mb-5`}>
          <h4 className={`text-sm font-bold ${c.text} mb-3`}>📁 Past Strategies</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {strategyHistory.map(h => {
              const rel = relationships.find(r => r.value === h.relationship);
              return (
                <div key={h.id} className={`flex items-center gap-3 p-3 rounded-xl ${c.cardAlt}`}>
                  <span>{rel?.icon || '💬'}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate ${c.text}`}>{h.topic}</p>
                    <p className={`text-xs ${c.textMuted}`}>{new Date(h.date).toLocaleDateString()} · {h.relationship} · {h.approachCount} approaches</p>
                  </div>
                </div>
              );
            })}
          </div>
          <p className={`text-xs ${c.textMuted} mt-2`}>History is saved locally. Strategies can't be re-loaded yet — they're here for reference.</p>
        </div>
      )}

      {/* ═══════════════ INPUT VIEW ═══════════════ */}
      {!results && (
        <div className="space-y-5">

          {/* Topic */}
          <div className={`${c.card} rounded-xl shadow-lg p-6`}>
            <label className={`block font-semibold ${c.text} mb-2`}>What do you need to discuss? <span className="text-red-500">*</span></label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Describe the conversation you need to have. Be specific — the more context you give, the better your scripts will be."
              rows={4}
              className={`w-full p-4 border rounded-xl outline-none text-sm resize-y focus:ring-2 focus:ring-cyan-500 ${c.input}`}
            />
          </div>

          {/* Relationship */}
          <div className={`${c.card} rounded-xl shadow-lg p-6`}>
            <label className={`block font-semibold ${c.text} mb-3`}>Who is this with? <span className="text-red-500">*</span></label>
            <div className="flex flex-wrap gap-2">
              {relationships.map(r => (
                <button key={r.value} onClick={() => setRelationship(r.value)}
                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${chip(relationship === r.value)}`}>
                  {r.icon} {r.value}
                </button>
              ))}
            </div>
          </div>

          {/* Goals */}
          <div className={`${c.card} rounded-xl shadow-lg p-6`}>
            <label className={`block font-semibold ${c.text} mb-3`}>What are you trying to accomplish? <span className="text-red-500">*</span></label>
            <div className="flex flex-wrap gap-2">
              {goalOptions.map(g => (
                <button key={g.key} onClick={() => toggleGoal(g.key)}
                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${chip(goals.includes(g.key))}`}>
                  {g.icon} {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Resistance + Style */}
          <div className={`${c.card} rounded-xl shadow-lg p-6 space-y-5`}>
            <div>
              <label className={`block font-semibold ${c.text} mb-1`}>
                How resistant will they be? <span className={`font-normal text-sm ${getResistanceInfo(resistanceLevel).color}`}>{getResistanceInfo(resistanceLevel).label} ({resistanceLevel}%)</span>
              </label>
              <input type="range" min="0" max="100" value={resistanceLevel} onChange={(e) => setResistanceLevel(parseInt(e.target.value))}
                className="w-full h-2 rounded-lg cursor-pointer"
                style={{
                  WebkitAppearance: 'none',
                  appearance: 'none',
                  background: `linear-gradient(to right, rgb(124,58,237) ${resistanceLevel}%, ${isDark ? '#3f3f46' : '#e2e8f0'} ${resistanceLevel}%)`,
                  borderRadius: '8px',
                }} />
              <div className={`flex justify-between text-xs ${c.textMuted} mt-1`}>
                <span>Receptive</span><span>Hostile</span>
              </div>
            </div>
            <div>
              <label className={`block font-semibold ${c.text} mb-2`}>Your preferred style</label>
              <div className="flex gap-2">
                {['Direct', 'Indirect', 'Collaborative', 'Assertive'].map(s => (
                  <button key={s} onClick={() => setCommunicationStyle(s)}
                    className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${chip(communicationStyle === s)}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Deep Context (optional) */}
          <div className={`${c.card} rounded-xl shadow-lg p-6 space-y-4`}>
            <p className={`text-xs font-bold uppercase tracking-wide ${c.textMuted}`}>Optional — but makes your strategy much better</p>
            <div>
              <label className={`block text-sm font-semibold ${c.textSecondary} mb-2`}>What are you worried will happen?</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {FEARS.map(fear => (
                  <button key={fear.id} onClick={() => toggleFear(fear.id)}
                    className={`px-3 py-2 rounded-lg border text-xs font-semibold transition-all ${chip(fears.includes(fear.id))}`}>
                    {fear.label}
                  </button>
                ))}
              </div>
              <input type="text" value={biggestFear} onChange={(e) => setBiggestFear(e.target.value)}
                placeholder="Anything else you're worried about? e.g., 'They'll bring up something I did years ago'"
                className={`w-full p-3 border rounded-xl outline-none text-sm focus:ring-2 focus:ring-cyan-500 ${c.input}`} />
            </div>
            <div>
              <label className={`block text-sm font-semibold ${c.textSecondary} mb-1`}>What's their side of this?</label>
              <input type="text" value={theirPerspective} onChange={(e) => setTheirPerspective(e.target.value)}
                placeholder="e.g., 'They think they're being helpful', 'They don't realize it bothers me'"
                className={`w-full p-3 border rounded-xl outline-none text-sm focus:ring-2 focus:ring-cyan-500 ${c.input}`} />
            </div>
            <div>
              <label className={`block text-sm font-semibold ${c.textSecondary} mb-1`}>Have you tried raising this before?</label>
              <input type="text" value={previousAttempts} onChange={(e) => setPreviousAttempts(e.target.value)}
                placeholder="e.g., 'Hinted once but backed down', 'Argued about it twice, nothing changed'"
                className={`w-full p-3 border rounded-xl outline-none text-sm focus:ring-2 focus:ring-cyan-500 ${c.input}`} />
            </div>
          </div>

          {/* Submit */}
          <button onClick={handleGenerate} disabled={loading || !topic.trim() || !relationship || goals.length === 0}
            className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2 shadow-lg ${
              loading ? (isDark ? 'bg-zinc-700 text-zinc-400' : 'bg-gray-200 text-gray-400') : c.btnPrimary
            }`}>
            {loading ? (<><span className="inline-block animate-spin">{tool?.icon ?? '🗣️'}</span> Building your strategy...</>)
              : (<><span className="text-lg">{tool?.icon ?? '🗣️'}</span> Build Conversation Strategy</>)}
          </button>

          {error && (
            <div className={`p-4 rounded-xl flex items-start gap-3 ${c.danger} border`}>
              <span className="text-lg flex-shrink-0 mt-0.5">⚠️</span><p className="text-sm">{error}</p>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════ RESULTS VIEW ═══════════════ */}
      {results && (
        <div ref={resultsRef} className="space-y-5">

          {/* Controls */}
          <div className={`${c.card} rounded-xl shadow-lg p-4 flex items-center justify-between flex-wrap gap-3`}>
            <span className={`text-sm font-semibold ${c.text}`}>Strategy: {topic.substring(0, 50)}{topic.length > 50 ? '…' : ''}</span>
            <div className="flex items-center gap-2">
              <ActionBar
                content={buildFullText()}
                title={`Conversation Strategy — ${topic.substring(0, 40)}`}
                copyLabel="Copy All"
              />
              <button onClick={reset} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${c.btnSecondary}`}>
                <span className="text-sm">🔄</span> New Conversation
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className={`flex border-b ${c.border} gap-0 overflow-x-auto`}>
            {[
              { key: 'prepare', label: '🎯 Prepare' },
              { key: 'quickRef', label: '📋 Quick Ref' },
              { key: 'practice', label: '▶️ Practice' },
              { key: 'debrief', label: '💗 Debrief' },
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-5 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${tab(activeTab === tab.key)}`}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* ══════ TAB: PREPARE ══════ */}
          {activeTab === 'prepare' && (
            <div className="space-y-5">

              {/* Validation Banner */}
              {results.validation && (
                <div className={`${c.success} border rounded-xl p-5`}>
                  <div className="flex items-start gap-3">
                    <span className="text-xl flex-shrink-0 mt-0.5">💪</span>
                    <div>
                      <h3 className={`text-sm font-bold mb-1 ${isDark ? 'text-green-200' : 'text-green-800'}`}>
                        You Have the Right to Say This
                      </h3>
                      <p className={`text-sm ${isDark ? 'text-green-300' : 'text-green-700'}`}>{results.validation}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Reality Check */}
              {results.reality_check && (
                <div className={`${c.highlight} border rounded-xl p-5`}>
                  <div className="flex items-start gap-3">
                    <span className="text-xl flex-shrink-0 mt-0.5">🛡️</span>
                    <div>
                      <h3 className={`text-sm font-bold mb-1 ${isDark ? 'text-cyan-200' : 'text-cyan-800'}`}>
                        Expect This — It Doesn't Mean You're Wrong
                      </h3>
                      <p className={`text-sm ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>{results.reality_check}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Situation Reading */}
              {results.situation_reading && (
                <div className={`${c.card} rounded-xl shadow-lg p-6 border-l-4 ${isDark ? 'border-cyan-500' : 'border-cyan-400'}`}>
                  <h3 className={`font-bold ${c.text} mb-3 flex items-center gap-2`}>
                    <span className="text-lg">👁️</span> Situation Reading
                  </h3>
                  <p className={`font-semibold ${c.text} mb-3`}>{results.situation_reading.key_insight}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className={`p-3 rounded-lg ${c.cardAlt}`}>
                      <p className={`text-xs font-bold ${c.textMuted} mb-1`}>THEIR MINDSET</p>
                      <p className={`text-sm ${c.textSecondary}`}>{results.situation_reading.their_likely_mindset}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${c.cardAlt}`}>
                      <p className={`text-xs font-bold ${c.textMuted} mb-1`}>LIKELY DEFENSES</p>
                      {results.situation_reading.defense_mechanisms?.map((d, i) => (
                        <span key={i} className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mr-1 mb-1 ${c.warning} border`}>{d}</span>
                      ))}
                    </div>
                    <div className={`p-3 rounded-lg ${c.success} border`}>
                      <p className="text-xs font-bold mb-1">REALISTIC BEST CASE</p>
                      <p className="text-sm">{results.situation_reading.realistic_best_case}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${c.danger} border`}>
                      <p className="text-xs font-bold mb-1">REALISTIC FLOOR</p>
                      <p className="text-sm">{results.situation_reading.realistic_floor}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Emotional Landmines */}
              {results.emotional_landmines?.length > 0 && (
                <div className={`${c.card} rounded-xl shadow-lg p-6`}>
                  <button onClick={() => toggleSection('landmines')} className={`w-full flex items-center justify-between ${c.text}`}>
                    <h3 className="font-bold flex items-center gap-2">
                      <span className="text-lg">💥</span> Emotional Landmines ({results.emotional_landmines.length})
                    </h3>
                    {expandedSections.landmines ? <span className="text-sm">▲</span> : <span className="text-sm">▼</span>}
                  </button>
                  {(expandedSections.landmines !== false) && (
                    <div className="space-y-4 mt-4">
                      {results.emotional_landmines.map((lm, idx) => (
                        <div key={idx} className={`p-4 rounded-xl border ${c.border} space-y-3`}>
                          <div className={`p-3 rounded-lg ${c.danger} border`}>
                            <p className="text-xs font-bold mb-1">THEY MIGHT SAY</p>
                            <p className="text-sm font-medium italic">"{lm.they_might}"</p>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div className={`p-3 rounded-lg ${c.warning} border`}>
                              <p className="text-xs font-bold mb-1">YOUR TRIGGER</p>
                              <p className="text-sm">{lm.your_trigger}</p>
                            </div>
                            <div className={`p-3 rounded-lg ${isDark ? 'bg-red-900/10 border-red-800' : 'bg-red-50 border-red-200'} border`}>
                              <p className={`text-xs font-bold mb-1 ${isDark ? 'text-red-400' : 'text-red-600'}`}>❌ INSTINCT (DON'T)</p>
                              <p className={`text-sm ${isDark ? 'text-red-300' : 'text-red-700'}`}>{lm.instinct_response}</p>
                            </div>
                          </div>
                          <div className={`p-3 rounded-lg ${c.success} border`}>
                            <p className="text-xs font-bold mb-1">✅ SAY THIS INSTEAD</p>
                            <p className="text-sm font-medium">{lm.strategic_response}</p>
                            <p className={`text-xs ${c.textMuted} mt-1`}>{lm.why_it_works}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Conversation Approaches */}
              {results.conversation_approaches?.length > 0 && (
                <div className={`${c.card} rounded-xl shadow-lg p-6`}>
                  <h3 className={`font-bold ${c.text} mb-4 flex items-center gap-2`}>
                    <span className="text-lg">💬</span> Conversation Scripts
                  </h3>

                  {/* Approach selector */}
                  <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
                    {results.conversation_approaches.map((a, idx) => (
                      <button key={idx} onClick={() => setExpandedApproach(idx)}
                        className={`px-3 py-2 rounded-lg border text-sm font-semibold whitespace-nowrap transition-all ${chip(expandedApproach === idx)}`}>
                        {a.approach_name}
                      </button>
                    ))}
                  </div>

                  {results.conversation_approaches.map((approach, idx) => {
                    if (idx !== expandedApproach) return null;
                    return (
                      <div key={idx} className="space-y-4">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm ${c.textSecondary}`}>{approach.when_to_use}</p>
                          <CopyBtn content={`Opening: ${approach.script.opening}\n\nMain Points:\n${approach.script.main_points.map((p,i) => `${i+1}. ${p}`).join('\n')}\n\nKey Phrases:\n${approach.script.specific_phrases.map(p => `• ${p}`).join('\n')}\n\nClosing: ${approach.script.closing}`} label="Copy Script" />
                        </div>

                        {/* Opening */}
                        <div className={`p-4 rounded-xl ${isDark ? 'bg-cyan-900/20 border-cyan-700' : 'bg-cyan-50 border-cyan-200'} border`}>
                          <p className={`text-xs font-bold ${isDark ? 'text-cyan-400' : 'text-cyan-600'} mb-2`}>OPENING — Say this first</p>
                          <p className={`text-sm ${c.text} leading-relaxed font-medium`}>"{approach.script.opening}"</p>
                        </div>

                        {/* Main Points */}
                        <div>
                          <p className={`text-xs font-bold ${c.textMuted} mb-2`}>MAIN POINTS — Cover these in order</p>
                          {approach.script.main_points.map((point, i) => (
                            <div key={i} className={`flex items-start gap-3 mb-2`}>
                              <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isDark ? 'bg-cyan-900/30 text-cyan-300' : 'bg-cyan-100 text-cyan-700'}`}>{i + 1}</span>
                              <p className={`text-sm ${c.textSecondary} pt-0.5`}>{point}</p>
                            </div>
                          ))}
                        </div>

                        {/* Key Phrases */}
                        <div>
                          <p className={`text-xs font-bold ${c.textMuted} mb-2`}>KEY PHRASES</p>
                          <div className="flex flex-wrap gap-2">
                            {approach.script.specific_phrases.map((phrase, i) => (
                              <span key={i} className={`px-3 py-1.5 rounded-lg text-sm ${c.cardAlt} border ${c.border}`}>"{phrase}"</span>
                            ))}
                          </div>
                        </div>

                        {/* Closing */}
                        <div className={`p-4 rounded-xl ${c.cardAlt} border ${c.border}`}>
                          <p className={`text-xs font-bold ${c.textMuted} mb-2`}>CLOSING — Lock in the outcome</p>
                          <p className={`text-sm ${c.text} leading-relaxed`}>"{approach.script.closing}"</p>
                        </div>

                        {/* Anticipated Responses */}
                        {approach.anticipated_responses?.length > 0 && (
                          <div>
                            <button onClick={() => toggleSection(`responses-${idx}`)} className={`flex items-center gap-2 w-full ${c.text}`}>
                              <p className="text-xs font-bold">WHAT THEY MIGHT SAY ({approach.anticipated_responses.length} scenarios)</p>
                              {expandedSections[`responses-${idx}`] ? <span className="text-xs">▲</span> : <span className="text-xs">▼</span>}
                            </button>
                            {expandedSections[`responses-${idx}`] && (
                              <div className="space-y-3 mt-3">
                                {approach.anticipated_responses.map((ar, i) => (
                                  <div key={i} className={`p-3 rounded-lg border ${c.border} space-y-2`}>
                                    <p className={`text-sm font-medium ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>Them: "{ar.they_might_say}"</p>
                                    {ar.emotional_danger && <p className={`text-xs ${c.textMuted}`}>⚡ Trigger: {ar.emotional_danger}</p>}
                                    <p className={`text-sm ${isDark ? 'text-green-300' : 'text-green-700'}`}>You: "{ar.you_could_say}"</p>
                                    {ar.goal_of_response && <p className={`text-xs ${c.textMuted}`}>→ {ar.goal_of_response}</p>}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* What NOT to say */}
                        {approach.what_NOT_to_say?.length > 0 && (
                          <div className={`p-4 rounded-lg ${c.danger} border`}>
                            <p className="text-xs font-bold mb-2">🚫 DON'T SAY THIS</p>
                            {approach.what_NOT_to_say.map((item, i) => <p key={i} className="text-sm mb-1">• {item}</p>)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── Firmness Messages ── */}
              {results.firmness_messages?.length > 0 && (
                <div className={`${c.card} rounded-xl shadow-lg p-6`}>
                  <h3 className={`font-bold ${c.text} mb-2 flex items-center gap-2`}>
                    <span className="text-lg">📋</span> Copy-Paste Messages — Pick Your Level
                  </h3>
                  <p className={`text-xs ${c.textMuted} mb-4`}>
                    These are standalone messages you can send as-is. Different from the strategic approaches above — these are ready to go.
                  </p>
                  <div className="space-y-4">
                    {results.firmness_messages.map((msg, idx) => {
                      const levelConfig = {
                        gentle: { bg: isDark ? 'bg-cyan-900/20 border-cyan-700' : 'bg-cyan-50 border-cyan-200', accent: isDark ? 'text-cyan-400' : 'text-cyan-600', emoji: '🌊' },
                        balanced: { bg: isDark ? 'bg-emerald-900/20 border-emerald-700' : 'bg-emerald-50 border-emerald-200', accent: isDark ? 'text-emerald-400' : 'text-emerald-600', emoji: '⚖️' },
                        firm: { bg: isDark ? 'bg-amber-900/20 border-amber-700' : 'bg-amber-50 border-amber-200', accent: isDark ? 'text-amber-400' : 'text-amber-600', emoji: '🪨' },
                      };
                      const lc = levelConfig[msg.level] || levelConfig.balanced;
                      const isRecommended = msg.level === 'balanced';
                      return (
                        <div key={idx} className={`${lc.bg} border rounded-xl p-5`}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{lc.emoji}</span>
                              <h4 className={`text-sm font-bold ${lc.accent}`}>{msg.label}</h4>
                              {isRecommended && (
                                <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${isDark ? 'bg-cyan-600 text-white' : 'bg-cyan-600 text-white'}`}>
                                  Recommended
                                </span>
                              )}
                            </div>
                            <CopyBtn content={`${msg.text}\n\n— Generated by DeftBrain · deftbrain.com`} label="Copy" />
                          </div>
                          <div className={`${isDark ? 'bg-zinc-900/60' : 'bg-white/70'} rounded-lg p-4 mb-3`}>
                            <p className={`text-sm ${c.text} whitespace-pre-wrap leading-relaxed`}>"{msg.text}"</p>
                          </div>
                          {msg.what_this_does && (
                            <p className={`text-xs ${c.textSecondary}`}>
                              <span className="font-bold">What this does:</span> {msg.what_this_does}
                            </p>
                          )}
                          {msg.removes?.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              <span className={`text-[10px] font-bold ${c.textMuted}`}>Removes:</span>
                              {msg.removes.map((r, i) => (
                                <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded line-through ${isDark ? 'bg-zinc-700 text-zinc-400' : 'bg-gray-200 text-gray-500'}`}>
                                  {r}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Pushback Scripts ── */}
              {results.pushback_scripts && Object.keys(results.pushback_scripts).length > 0 && (
                <div className={`${c.card} rounded-xl shadow-lg overflow-hidden`}>
                  <button
                    onClick={() => setExpandedPushback(p => !p)}
                    className={`w-full p-5 flex items-center justify-between text-left`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🛡️</span>
                      <h3 className={`font-bold ${c.text}`}>If They Push Back</h3>
                      <span className={`text-[10px] ${c.textMuted}`}>— ready-made responses by reaction type</span>
                    </div>
                    {expandedPushback ? <span className={`text-sm ${c.textMuted}`}>▲</span> : <span className={`text-sm ${c.textMuted}`}>▼</span>}
                  </button>
                  {expandedPushback && (
                    <div className={`px-5 pb-5 space-y-3 border-t ${c.border} pt-4`}>
                      {Object.entries(results.pushback_scripts).map(([key, script], idx) => {
                        const pushbackIcons = {
                          guilt_trip: '😢 If they guilt-trip you',
                          anger: '😡 If they get angry',
                          negotiation: '🤝 If they try to negotiate',
                          silent_treatment: '🤐 If they go silent',
                          deflection: '🪃 If they deflect',
                        };
                        return (
                          <div key={idx} className={`${isDark ? 'bg-zinc-900/60' : 'bg-gray-50'} rounded-lg p-4`}>
                            <p className={`text-xs font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'} uppercase mb-1.5`}>
                              {pushbackIcons[key] || `💬 ${key.replace(/_/g, ' ')}`}
                            </p>
                            <p className={`text-sm ${c.textSecondary} leading-relaxed`}>{script}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── Follow-Up Guidance ── */}
              {results.follow_up_guidance && (
                <div className={`${c.warning} border rounded-xl p-5`}>
                  <div className="flex items-start gap-3">
                    <span className="text-xl flex-shrink-0 mt-0.5">📨</span>
                    <div>
                      <h3 className={`text-sm font-bold mb-1 ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>
                        After You Say It
                      </h3>
                      <p className={`text-sm ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>{results.follow_up_guidance}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Body Language */}
              {results.body_language_guidance && (
                <div className={`${c.card} rounded-xl shadow-lg p-6`}>
                  <button onClick={() => toggleSection('body')} className={`w-full flex items-center justify-between ${c.text}`}>
                    <h3 className="font-bold flex items-center gap-2">
                      <span className="text-lg">⚡</span> Body Language & Delivery
                    </h3>
                    {expandedSections.body ? <span className="text-sm">▲</span> : <span className="text-sm">▼</span>}
                  </button>
                  {expandedSections.body && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                      {Object.entries(results.body_language_guidance).map(([key, val]) => (
                        <div key={key} className={`p-3 rounded-lg ${c.cardAlt}`}>
                          <p className={`text-xs font-bold ${c.textMuted} mb-1`}>{key.replace(/_/g, ' ').toUpperCase()}</p>
                          <p className={`text-sm ${c.textSecondary}`}>{val}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* De-escalation */}
              {results.deescalation_toolkit && (
                <div className={`${c.card} rounded-xl shadow-lg p-6`}>
                  <button onClick={() => toggleSection('deescalation')} className={`w-full flex items-center justify-between ${c.text}`}>
                    <h3 className="font-bold flex items-center gap-2">
                      <span className="text-lg">🛡️</span> De-escalation Toolkit
                    </h3>
                    {expandedSections.deescalation ? <span className="text-sm">▲</span> : <span className="text-sm">▼</span>}
                  </button>
                  {expandedSections.deescalation && (
                    <div className="space-y-3 mt-4">
                      {results.deescalation_toolkit.for_their_likely_defense && (
                        <div className={`p-4 rounded-lg ${c.highlight} border`}>
                          <p className="text-xs font-bold mb-1">FOR THEIR LIKELY DEFENSE</p>
                          <p className="text-sm">{results.deescalation_toolkit.for_their_likely_defense}</p>
                        </div>
                      )}
                      {results.deescalation_toolkit.tension_lowering_phrases?.length > 0 && (
                        <div className={`p-4 rounded-lg ${c.cardAlt}`}>
                          <p className={`text-xs font-bold ${c.textMuted} mb-2`}>TENSION-LOWERING PHRASES</p>
                          {results.deescalation_toolkit.tension_lowering_phrases.map((p, i) => (
                            <p key={i} className={`text-sm ${c.textSecondary} mb-1`}>• "{p}"</p>
                          ))}
                        </div>
                      )}
                      {results.deescalation_toolkit.if_they_shut_down && (
                        <div className={`p-3 rounded-lg ${c.warning} border`}>
                          <p className="text-xs font-bold mb-1">IF THEY SHUT DOWN</p>
                          <p className="text-sm">{results.deescalation_toolkit.if_they_shut_down}</p>
                        </div>
                      )}
                      {results.deescalation_toolkit.if_they_escalate && (
                        <div className={`p-3 rounded-lg ${c.danger} border`}>
                          <p className="text-xs font-bold mb-1">IF THEY ESCALATE</p>
                          <p className="text-sm">{results.deescalation_toolkit.if_they_escalate}</p>
                        </div>
                      )}
                      {results.deescalation_toolkit.exit_protocol && (
                        <div className={`p-3 rounded-lg ${c.danger} border`}>
                          <p className="text-xs font-bold mb-1">🚨 EXIT PROTOCOL</p>
                          <p className="text-sm">{results.deescalation_toolkit.exit_protocol}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Preparation Plan */}
              {results.preparation_plan && (
                <div className={`${c.card} rounded-xl shadow-lg p-6`}>
                  <button onClick={() => toggleSection('prep')} className={`w-full flex items-center justify-between ${c.text}`}>
                    <h3 className="font-bold flex items-center gap-2">
                      <span className="text-lg">🕐</span> Preparation Plan
                    </h3>
                    {expandedSections.prep ? <span className="text-sm">▲</span> : <span className="text-sm">▼</span>}
                  </button>
                  {expandedSections.prep && (
                    <div className="space-y-3 mt-4">
                      {['one_hour_before', 'setting_the_stage', 'grounding_technique'].map(key => (
                        results.preparation_plan[key] && (
                          <div key={key} className={`p-3 rounded-lg ${c.cardAlt}`}>
                            <p className={`text-xs font-bold ${c.textMuted} mb-1`}>{key.replace(/_/g, ' ').toUpperCase()}</p>
                            <p className={`text-sm ${c.textSecondary}`}>{results.preparation_plan[key]}</p>
                          </div>
                        )
                      ))}
                      {results.preparation_plan.have_ready?.length > 0 && (
                        <div className={`p-3 rounded-lg ${c.cardAlt}`}>
                          <p className={`text-xs font-bold ${c.textMuted} mb-1`}>HAVE READY</p>
                          {results.preparation_plan.have_ready.map((item, i) => (
                            <p key={i} className={`text-sm ${c.textSecondary} mb-1`}>• {item}</p>
                          ))}
                        </div>
                      )}
                      {results.preparation_plan.mindset_anchor && (
                        <div className={`p-4 rounded-lg ${c.highlight} border text-center`}>
                          <p className="text-xs font-bold mb-2">🧘 MINDSET ANCHOR</p>
                          <p className="text-lg font-medium italic">"{results.preparation_plan.mindset_anchor}"</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Confidence Note */}
              {results.confidence_note && (
                <div className={`p-5 rounded-xl ${c.highlight} border text-center`}>
                  <p className="text-sm font-medium">{results.confidence_note}</p>
                </div>
              )}

              {/* Follow-Up Plan (generated but previously not rendered) */}
              {results.follow_up_plan && (
                <div className={`${c.card} rounded-xl shadow-lg p-6`}>
                  <h3 className={`font-bold ${c.text} mb-4 flex items-center gap-2`}>
                    <span className="text-lg">📅</span> What Happens Next
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {results.follow_up_plan.if_it_goes_well && (
                      <div className={`p-3 rounded-lg ${c.success} border`}>
                        <p className="text-xs font-bold mb-1">✅ IF IT GOES WELL</p>
                        <p className="text-sm">{results.follow_up_plan.if_it_goes_well}</p>
                      </div>
                    )}
                    {results.follow_up_plan.if_it_goes_poorly && (
                      <div className={`p-3 rounded-lg ${c.danger} border`}>
                        <p className="text-xs font-bold mb-1">⚠️ IF IT GOES POORLY</p>
                        <p className="text-sm">{results.follow_up_plan.if_it_goes_poorly}</p>
                      </div>
                    )}
                    {results.follow_up_plan.if_they_need_time && (
                      <div className={`p-3 rounded-lg ${c.highlight} border`}>
                        <p className="text-xs font-bold mb-1">🕐 IF THEY NEED TIME</p>
                        <p className="text-sm">{results.follow_up_plan.if_they_need_time}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Reassurance Badges */}
              {results.reassurance_badges?.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center">
                  {results.reassurance_badges.map((badge, i) => (
                    <span key={i} className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${c.success}`}>
                      ✓ {badge}
                    </span>
                  ))}
                </div>
              )}

              {/* Cross-references */}
              <div className={`p-4 rounded-2xl border ${c.border} ${isDark ? 'bg-zinc-800/60' : 'bg-slate-50'} mt-2`}>
                <p className={`text-xs ${c.textMuted}`}>
                  💡 Need diplomatic words?{' '}<a href="/VelvetHammer" target="_blank" rel="noopener noreferrer" className={linkStyle}>Velvet Hammer</a>{' '}
                  crafts the message. Conversation calls for an apology?{' '}<a href="/ApologyCalibrator" target="_blank" rel="noopener noreferrer" className={linkStyle}>Apology Calibrator</a>{' '}
                  gets the tone right. Ongoing friction?{' '}<a href="/ConflictCoach" target="_blank" rel="noopener noreferrer" className={linkStyle}>Conflict Coach</a>{' '}
                  maps the dynamic.
                </p>
              </div>
            </div>
          )}

          {/* AI disclaimer */}
          {activeTab === 'prepare' && (
            <p className={`text-xs ${c.textMuted} text-center`}>AI-generated strategies — adapt them to your voice and situation.</p>
          )}

          {/* ══════ TAB: QUICK REFERENCE CARD ══════ */}
          {activeTab === 'quickRef' && (
            <div className="space-y-4">
              <div className={`${c.card} rounded-xl shadow-lg p-6`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`font-bold ${c.text} flex items-center gap-2`}>
                    <span className="text-lg">📋</span> Quick Reference Card
                  </h3>
                  <div className="flex items-center gap-2">
                    <ActionBar
                      content={buildQuickRefText()}
                      title={`Quick Ref — ${topic.substring(0, 40)}`}
                      copyLabel="Copy Card"
                      printLabel="Print Card"
                      printVariant="card"
                    />
                  </div>
                </div>

                <p className={`text-sm ${c.textSecondary} mb-5`}>
                  Everything you need on one screen. Screenshot this, print it, or keep it on your phone during the conversation.
                </p>

                {(() => {
                  const approach = results.conversation_approaches?.[expandedApproach];
                  if (!approach) return <p className={`text-sm ${c.textMuted}`}>No approach selected — go to the Prepare tab first.</p>;
                  return (
                    <div className="space-y-4">
                      {/* Approach name */}
                      <div className={`text-center py-2 px-4 rounded-lg ${isDark ? 'bg-cyan-900/30 border-cyan-700' : 'bg-cyan-50 border-cyan-200'} border`}>
                        <p className={`text-xs font-bold uppercase tracking-wide ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                          Using: {approach.approach_name}
                        </p>
                      </div>

                      {/* Opening Line */}
                      <div className={`p-4 rounded-xl ${isDark ? 'bg-cyan-900/20 border-cyan-700' : 'bg-cyan-50 border-cyan-200'} border`}>
                        <p className={`text-xs font-bold ${isDark ? 'text-cyan-400' : 'text-cyan-600'} mb-2`}>🎤 YOUR OPENING LINE</p>
                        <p className={`text-base ${c.text} font-medium leading-relaxed`}>"{approach.script.opening}"</p>
                      </div>

                      {/* Key Phrases to Reach For */}
                      <div className={`p-4 rounded-lg ${c.success} border`}>
                        <p className="text-xs font-bold mb-2">✅ PHRASES TO REACH FOR</p>
                        <div className="space-y-1.5">
                          {approach.script.specific_phrases.slice(0, 6).map((phrase, i) => (
                            <p key={i} className="text-sm">• "{phrase}"</p>
                          ))}
                        </div>
                      </div>

                      {/* Things NOT to Say */}
                      {approach.what_NOT_to_say?.length > 0 && (
                        <div className={`p-4 rounded-lg ${c.danger} border`}>
                          <p className="text-xs font-bold mb-2">🚫 DON'T SAY</p>
                          <div className="space-y-1.5">
                            {approach.what_NOT_to_say.slice(0, 6).map((item, i) => (
                              <p key={i} className="text-sm">• {item}</p>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* If They Get Defensive */}
                      {results.deescalation_toolkit && (
                        <div className={`p-4 rounded-lg ${c.highlight} border`}>
                          <p className="text-xs font-bold mb-2">🛡️ IF THEY GET DEFENSIVE</p>
                          {results.deescalation_toolkit.tension_lowering_phrases?.slice(0, 6).map((p, i) => (
                            <p key={i} className="text-sm mb-1">• "{p}"</p>
                          ))}
                          {results.deescalation_toolkit.if_they_shut_down && (
                            <p className={`text-xs ${c.textMuted} mt-2`}>If they shut down: {results.deescalation_toolkit.if_they_shut_down}</p>
                          )}
                        </div>
                      )}

                      {/* Closing / Exit */}
                      <div className={`p-4 rounded-lg ${c.cardAlt} border ${c.border}`}>
                        <p className={`text-xs font-bold ${c.textMuted} mb-2`}>🏁 CLOSING LINE</p>
                        <p className={`text-sm ${c.text} font-medium`}>"{approach.script.closing}"</p>
                      </div>

                      {results.deescalation_toolkit?.exit_protocol && (
                        <div className={`p-3 rounded-lg ${c.warning} border`}>
                          <p className="text-xs font-bold mb-1">🚨 EXIT IF NEEDED</p>
                          <p className="text-sm">{results.deescalation_toolkit.exit_protocol}</p>
                        </div>
                      )}

                      {/* Mindset Anchor */}
                      {results.preparation_plan?.mindset_anchor && (
                        <div className={`p-4 rounded-xl ${c.highlight} border text-center`}>
                          <p className="text-xs font-bold mb-2">🧘 REMEMBER</p>
                          <p className="text-lg font-medium italic">"{results.preparation_plan.mindset_anchor}"</p>
                        </div>
                      )}

                      {/* Approach switcher */}
                      {results.conversation_approaches.length > 1 && (
                        <div className={`flex items-center gap-2 pt-2`}>
                          <p className={`text-xs ${c.textMuted}`}>Switch approach:</p>
                          {results.conversation_approaches.map((a, idx) => (
                            <button key={idx} onClick={() => setExpandedApproach(idx)}
                              className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all ${chip(expandedApproach === idx)}`}>
                              {a.approach_name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* ══════ TAB: PRACTICE ══════ */}
          {activeTab === 'practice' && (
            <div className="space-y-4">
              <div className={`${c.card} rounded-xl shadow-lg p-6`}>
                <h3 className={`font-bold ${c.text} mb-2 flex items-center gap-2`}>
                  <span className="text-lg">▶️</span> Practice Mode
                </h3>
                <p className={`text-sm ${c.textSecondary} mb-4`}>
                  Type what you'd say. The AI will respond as {relationship.toLowerCase() || 'them'} at resistance level {practiceResistance ?? resistanceLevel}%. You'll get real-time coaching after each exchange.
                </p>

                {/* Adjustable resistance */}
                <div className={`flex items-center gap-3 mb-4 p-3 rounded-lg ${c.cardAlt}`}>
                  <span className="text-sm">🎚️</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-bold ${c.textMuted}`}>DIFFICULTY</span>
                      <span className={`text-xs font-bold ${getResistanceInfo(practiceResistance ?? resistanceLevel).color}`}>
                        {getResistanceInfo(practiceResistance ?? resistanceLevel).label} ({practiceResistance ?? resistanceLevel}%)
                      </span>
                    </div>
                    <input type="range" min="0" max="100" value={practiceResistance ?? resistanceLevel}
                      onChange={(e) => setPracticeResistance(parseInt(e.target.value))}
                      className="w-full h-1.5 rounded-lg cursor-pointer"
                      style={{
                        WebkitAppearance: 'none', appearance: 'none',
                        background: `linear-gradient(to right, rgb(124,58,237) ${practiceResistance ?? resistanceLevel}%, ${isDark ? '#3f3f46' : '#e2e8f0'} ${practiceResistance ?? resistanceLevel}%)`,
                        borderRadius: '8px',
                      }} />
                  </div>
                </div>

                {/* Openness indicator */}
                {simStarted && (
                  <div className={`flex items-center gap-3 mb-4 p-3 rounded-lg ${
                    simOpenness >= 60 ? (isDark ? 'bg-green-900/15 border border-green-800/40' : 'bg-green-50 border border-green-100')
                      : simOpenness >= 35 ? (isDark ? 'bg-amber-900/15 border border-amber-800/40' : 'bg-amber-50 border border-amber-100')
                      : (isDark ? 'bg-red-900/15 border border-red-800/40' : 'bg-red-50 border border-red-100')
                  }`}>
                    <span className="text-sm">{simOpenness >= 60 ? '💚' : simOpenness >= 35 ? '💛' : '❤️'}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-bold ${c.textMuted}`}>THEIR OPENNESS</span>
                        <span className={`text-xs font-bold ${
                          simOpenness >= 60 ? (isDark ? 'text-green-400' : 'text-green-600')
                            : simOpenness >= 35 ? (isDark ? 'text-amber-400' : 'text-amber-600')
                            : (isDark ? 'text-red-400' : 'text-red-600')
                        }`}>{simOpenness >= 60 ? 'Opening up' : simOpenness >= 35 ? 'Guarded' : 'Shutting down'} ({simOpenness}%)</span>
                      </div>
                      <div className={`w-full h-1.5 rounded-full ${isDark ? 'bg-zinc-600' : 'bg-gray-200'}`}>
                        <div className={`h-full rounded-full transition-all duration-500 ${
                          simOpenness >= 60 ? 'bg-green-500' : simOpenness >= 35 ? 'bg-amber-500' : 'bg-red-500'
                        }`} style={{ width: `${simOpenness}%` }} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Chat Window */}
                <div className={`rounded-xl border ${c.border} overflow-hidden`}>
                  <div className={`h-80 overflow-y-auto p-4 space-y-3 ${isDark ? 'bg-zinc-900' : 'bg-gray-50'}`}>
                    {simMessages.length === 0 && !simStarted && (
                      <div className={`text-center py-12 ${c.textMuted}`}>
                        <span className="text-3xl block text-center mx-auto mb-2 opacity-40">💬</span>
                        <p className="text-sm">Start the conversation. Type your opening line below.</p>
                        {results?.conversation_approaches?.[expandedApproach]?.script?.opening && (
                          <button
                            onClick={() => setSimInput(results.conversation_approaches[expandedApproach].script.opening)}
                            className={`mt-3 text-xs ${isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-600 hover:text-cyan-700'} underline underline-offset-2`}
                          >
                            Use your prepared opening from "{results.conversation_approaches[expandedApproach].approach_name}"
                          </button>
                        )}
                      </div>
                    )}

                    {simMessages.map((msg, idx) => (
                      <div key={idx}>
                        {msg.role === 'user' && (
                          <div className="flex justify-end">
                            <div className={`max-w-[80%] p-3 rounded-xl ${c.simUser} border`}>
                              <p className={`text-xs font-bold ${isDark ? 'text-cyan-400' : 'text-cyan-600'} mb-1`}>YOU</p>
                              <p className={`text-sm ${c.text}`}>{msg.content}</p>
                            </div>
                          </div>
                        )}
                        {msg.role === 'them' && (
                          <div className="space-y-2">
                            <div className="flex justify-start">
                              <div className={`max-w-[80%] p-3 rounded-xl ${c.simThem} border`}>
                                <div className="flex items-center gap-2 mb-1">
                                  <p className={`text-xs font-bold ${c.textMuted}`}>{relationship.toUpperCase()}</p>
                                  {msg.emotionalState && <span className={`text-xs ${c.textMuted}`}>({msg.emotionalState})</span>}
                                  {msg.health && <span className={`text-xs font-bold ${healthColors[msg.health] || c.textMuted}`}>• {msg.health.replace('_', ' ')}</span>}
                                  {msg.openness_shift != null && msg.openness_shift !== 0 && (
                                    <span className={`text-[10px] font-bold ${msg.openness_shift > 0 ? (isDark ? 'text-green-400' : 'text-green-600') : (isDark ? 'text-red-400' : 'text-red-600')}`}>
                                      {msg.openness_shift > 0 ? '↑' : '↓'}{Math.abs(msg.openness_shift)}
                                    </span>
                                  )}
                                </div>
                                <p className={`text-sm ${c.text}`}>{msg.content}</p>
                                {msg._corrected && <p className={`text-[10px] ${c.textMuted} mt-1`}>✏️ Corrected by you</p>}
                                {msg.technique_used && msg.technique_used !== 'none detected' && (
                                  <p className={`text-[10px] ${isDark ? 'text-cyan-400' : 'text-cyan-600'} mt-1`}>🎯 {msg.technique_used}</p>
                                )}
                              </div>
                            </div>
                            {msg.coaching && (
                              <div className={`ml-4 max-w-[85%] p-2.5 rounded-lg ${c.simCoach} border`}>
                                <p className={`text-xs font-bold ${isDark ? 'text-amber-400' : 'text-amber-700'} mb-0.5`}>🎯 COACH</p>
                                <p className={`text-xs ${c.textSecondary}`}>{msg.coaching}</p>
                                {msg.suggestion && <p className={`text-xs ${isDark ? 'text-green-300' : 'text-green-700'} mt-1`}>Try: "{msg.suggestion}"</p>}
                                {msg.openness_reason && <p className={`text-[10px] ${c.textMuted} mt-1`}>{msg.openness_reason}</p>}
                              </div>
                            )}
                            {/* Correction mechanism */}
                            {!msg._corrected && (
                              <div className="ml-4">
                                {showCorrection === idx ? (
                                  <div className={`p-2 rounded-lg ${c.cardAlt} space-y-2`}>
                                    <input type="text" value={correctionText} onChange={e => setCorrectionText(e.target.value)}
                                      onKeyDown={e => e.key === 'Enter' && handleCorrection(idx)}
                                      placeholder="What would they actually say instead?"
                                      className={`w-full p-2 border rounded-lg text-xs outline-none ${c.input}`} />
                                    <div className="flex gap-2">
                                      <button onClick={() => handleCorrection(idx)}
                                        className={`px-2 py-1 rounded text-[10px] font-bold ${c.btnPrimary}`}>Replace</button>
                                      <button onClick={() => { setShowCorrection(null); setCorrectionText(''); }}
                                        className={`text-[10px] ${c.textMuted}`}>Cancel</button>
                                    </div>
                                  </div>
                                ) : (
                                  <button onClick={() => setShowCorrection(idx)}
                                    className={`text-[10px] ${c.textMuted} hover:${isDark ? 'text-zinc-300' : 'text-gray-600'}`}>
                                    🔄 They wouldn't say that…
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                        {msg.role === 'system' && (
                          <p className={`text-xs text-center ${c.textMuted}`}>{msg.content}</p>
                        )}
                      </div>
                    ))}

                    {simLoading && (
                      <div className="flex justify-start">
                        <div className={`p-3 rounded-xl ${c.simThem} border`}>
                          <span className={`inline-block animate-spin ${c.textMuted}`}>{tool?.icon ?? '🗣️'}</span>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Input */}
                  <div className={`flex gap-2 p-3 border-t ${c.border} ${isDark ? 'bg-zinc-800' : 'bg-white'}`}>
                    <input
                      type="text"
                      value={simInput}
                      onChange={(e) => setSimInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSimSend()}
                      placeholder="Type what you'd say..."
                      className={`flex-1 p-2.5 border rounded-lg outline-none text-sm focus:ring-2 focus:ring-cyan-500 ${c.input}`}
                    />
                    <button onClick={handleSimSend} disabled={!simInput.trim() || simLoading}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${c.btnPrimary} disabled:opacity-40`}>
                      <span className="text-sm">📤</span>
                    </button>
                  </div>
                </div>

                {simMessages.length > 0 && (
                  <div className="flex items-center gap-3 mt-3">
                    <button onClick={() => { setSimMessages([]); setSimStarted(false); setSimOpenness(50); setPracticeSummary(null); }}
                      className={`flex items-center gap-1.5 text-sm ${c.textMuted} hover:${c.text}`}>
                      <span className="text-sm">🔄</span> Reset practice
                    </button>
                    {simMessages.filter(m => m.role === 'them').length >= 2 && !practiceSummary && (
                      <button onClick={handlePracticeSummary} disabled={summaryLoading}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold ${c.btnPrimary}`}>
                        {summaryLoading ? (<><span className="inline-block animate-spin">{tool?.icon ?? '🗣️'}</span> Scoring…</>) : (<><span>📊</span> End Practice & Get Score</>)}
                      </button>
                    )}
                    {simMessages.filter(m => m.role === 'them').length >= 2 && (
                      <button onClick={() => { handleDebriefPractice(); setActiveTab('debrief'); }}
                        disabled={debriefLoading}
                        className={`flex items-center gap-1.5 text-sm font-bold ${isDark ? 'text-pink-400 hover:text-pink-300' : 'text-pink-600 hover:text-pink-700'}`}>
                        <span>💗</span> Debrief Practice
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* ── Practice Summary Card ── */}
              {practiceSummary && (
                <div className="space-y-4">
                  {/* Readiness Score */}
                  <div className={`${c.card} rounded-xl shadow-lg p-6 border-l-4 ${
                    practiceSummary.readiness_score >= 7 ? (isDark ? 'border-green-500' : 'border-green-400')
                      : practiceSummary.readiness_score >= 5 ? (isDark ? 'border-amber-500' : 'border-amber-400')
                      : (isDark ? 'border-red-500' : 'border-red-400')
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className={`font-bold ${c.text} flex items-center gap-2`}>
                        <span className="text-lg">📊</span> Practice Summary
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className={`text-3xl font-bold ${
                          practiceSummary.readiness_score >= 7 ? (isDark ? 'text-green-400' : 'text-green-600')
                            : practiceSummary.readiness_score >= 5 ? (isDark ? 'text-amber-400' : 'text-amber-600')
                            : (isDark ? 'text-red-400' : 'text-red-600')
                        }`}>{practiceSummary.readiness_score}</span>
                        <span className={`text-sm ${c.textMuted}`}>/10</span>
                      </div>
                    </div>
                    <p className={`text-xs font-bold uppercase tracking-wide mb-2 ${
                      practiceSummary.readiness_score >= 7 ? (isDark ? 'text-green-400' : 'text-green-600')
                        : practiceSummary.readiness_score >= 5 ? (isDark ? 'text-amber-400' : 'text-amber-600')
                        : (isDark ? 'text-red-400' : 'text-red-600')
                    }`}>{practiceSummary.readiness_label}</p>
                    <p className={`text-sm ${c.textSecondary} leading-relaxed`}>{practiceSummary.overall_assessment}</p>
                  </div>

                  {/* Readiness Breakdown */}
                  {practiceSummary.readiness_breakdown && (
                    <div className={`${c.card} rounded-xl shadow-lg p-5`}>
                      <h4 className={`text-xs font-bold ${c.textMuted} mb-3`}>SKILL BREAKDOWN</h4>
                      <div className="space-y-2">
                        {Object.entries(practiceSummary.readiness_breakdown).map(([key, score]) => (
                          <div key={key} className="flex items-center gap-3">
                            <span className={`text-xs ${c.textSecondary} w-36`}>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                            <div className={`flex-1 h-2 rounded-full ${isDark ? 'bg-zinc-600' : 'bg-gray-200'}`}>
                              <div className={`h-full rounded-full transition-all ${
                                score >= 7 ? 'bg-green-500' : score >= 5 ? 'bg-amber-500' : 'bg-red-500'
                              }`} style={{ width: `${score * 10}%` }} />
                            </div>
                            <span className={`text-xs font-bold w-6 text-right ${
                              score >= 7 ? (isDark ? 'text-green-400' : 'text-green-600')
                                : score >= 5 ? (isDark ? 'text-amber-400' : 'text-amber-600')
                                : (isDark ? 'text-red-400' : 'text-red-600')
                            }`}>{score}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Strategy Adherence */}
                  {practiceSummary.strategy_adherence && (
                    <div className={`${c.card} rounded-xl shadow-lg p-5`}>
                      <h4 className={`text-xs font-bold ${c.textMuted} mb-3`}>📋 STRATEGY ADHERENCE</h4>
                      <p className={`text-sm ${c.textSecondary} mb-3`}>{practiceSummary.strategy_adherence.adherence_note}</p>
                      {practiceSummary.strategy_adherence.key_phrases_used?.length > 0 && (
                        <div className="mb-2">
                          <p className={`text-xs font-bold ${isDark ? 'text-green-400' : 'text-green-600'} mb-1`}>✅ Phrases you used</p>
                          <div className="flex flex-wrap gap-1.5">
                            {practiceSummary.strategy_adherence.key_phrases_used.map((p, i) => (
                              <span key={i} className={`px-2 py-0.5 rounded-full text-[10px] ${c.success} border`}>"{p}"</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {practiceSummary.strategy_adherence.key_phrases_missed?.length > 0 && (
                        <div>
                          <p className={`text-xs font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'} mb-1`}>💡 Phrases you missed</p>
                          <div className="flex flex-wrap gap-1.5">
                            {practiceSummary.strategy_adherence.key_phrases_missed.map((p, i) => (
                              <span key={i} className={`px-2 py-0.5 rounded-full text-[10px] ${c.warning} border`}>"{p}"</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Strengths */}
                  {practiceSummary.strengths?.length > 0 && (
                    <div className={`${c.card} rounded-xl shadow-lg p-5`}>
                      <h4 className={`font-bold ${c.text} mb-3`}>✅ What You Nailed</h4>
                      {practiceSummary.strengths.map((s, i) => (
                        <div key={i} className={`p-3 rounded-lg ${c.success} border mb-2`}>
                          <p className="text-sm font-semibold">{s.moment}</p>
                          <p className="text-xs mt-1">{s.technique} — {s.impact}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Stumbles */}
                  {practiceSummary.stumbles?.length > 0 && (
                    <div className={`${c.card} rounded-xl shadow-lg p-5`}>
                      <h4 className={`font-bold ${c.text} mb-3`}>📈 Where to Improve</h4>
                      {practiceSummary.stumbles.map((s, i) => (
                        <div key={i} className={`p-3 rounded-lg border ${c.border} mb-2`}>
                          <div className="flex items-start justify-between">
                            <p className={`text-sm font-semibold ${c.text}`}>{s.moment}</p>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              s.severity === 'significant' ? (isDark ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-600')
                                : s.severity === 'moderate' ? (isDark ? 'bg-amber-900/40 text-amber-300' : 'bg-amber-100 text-amber-600')
                                : (isDark ? 'bg-zinc-700 text-zinc-400' : 'bg-gray-100 text-gray-500')
                            }`}>{s.severity}</span>
                          </div>
                          <p className={`text-xs ${c.textSecondary} mt-1`}>{s.what_happened}</p>
                          <p className={`text-xs ${isDark ? 'text-green-300' : 'text-green-700'} mt-1`}>→ {s.better_approach}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Conversation Arc */}
                  {practiceSummary.conversation_arc && (
                    <div className={`${c.card} rounded-xl shadow-lg p-5`}>
                      <h4 className={`text-xs font-bold ${c.textMuted} mb-3`}>📈 CONVERSATION ARC</h4>
                      <div className="grid grid-cols-4 gap-2">
                        {['opening', 'middle', 'closing', 'health_trajectory'].map(key => {
                          const val = practiceSummary.conversation_arc[key];
                          const isGood = ['strong', 'maintained', 'improved'].includes(val);
                          const isBad = ['weak', 'lost', 'declined', 'no_closing'].includes(val);
                          return (
                            <div key={key} className={`p-2 rounded-lg text-center ${
                              isGood ? (isDark ? 'bg-green-900/15' : 'bg-green-50')
                                : isBad ? (isDark ? 'bg-red-900/15' : 'bg-red-50')
                                : c.cardAlt
                            }`}>
                              <p className={`text-[10px] font-bold ${c.textMuted}`}>{key.replace(/_/g, ' ').toUpperCase()}</p>
                              <p className={`text-xs font-bold ${
                                isGood ? (isDark ? 'text-green-400' : 'text-green-600')
                                  : isBad ? (isDark ? 'text-red-400' : 'text-red-600')
                                  : c.text
                              }`}>{val?.replace(/_/g, ' ')}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Retry suggestions */}
                  {practiceSummary.retry_suggestions && (
                    <div className={`${c.card} rounded-xl shadow-lg p-5`}>
                      <h4 className={`font-bold ${c.text} mb-3 flex items-center gap-2`}><span>🔁</span> Try Again?</h4>
                      <div className="space-y-3">
                        <div className={`p-3 rounded-lg ${c.cardAlt}`}>
                          <p className={`text-xs font-bold ${c.textMuted} mb-1`}>AT CURRENT DIFFICULTY</p>
                          <p className={`text-sm ${c.textSecondary}`}>{practiceSummary.retry_suggestions.same_difficulty}</p>
                        </div>
                        <div className={`p-3 rounded-lg ${c.warning} border`}>
                          <p className="text-xs font-bold mb-1">⬆️ AT HIGHER DIFFICULTY</p>
                          <p className="text-sm">{practiceSummary.retry_suggestions.higher_difficulty}</p>
                        </div>
                        {practiceSummary.retry_suggestions.specific_moment && (
                          <div className={`p-3 rounded-lg ${c.highlight} border`}>
                            <p className="text-xs font-bold mb-1">🎯 REDO THIS MOMENT</p>
                            <p className="text-sm">{practiceSummary.retry_suggestions.specific_moment}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => { setSimMessages([]); setSimStarted(false); setSimOpenness(50); setPracticeSummary(null); }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold ${c.btnPrimary}`}>🔄 Practice Again (Same Level)</button>
                        <button onClick={() => { setSimMessages([]); setSimStarted(false); setSimOpenness(50); setPracticeSummary(null); setPracticeResistance(Math.min(100, (practiceResistance ?? resistanceLevel) + 15)); }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold ${c.btnSecondary}`}>⬆️ Try Harder (+15%)</button>
                      </div>
                    </div>
                  )}

                  {/* Techniques */}
                  {(practiceSummary.techniques_demonstrated?.length > 0 || practiceSummary.techniques_to_practice?.length > 0) && (
                    <div className={`${c.card} rounded-xl shadow-lg p-5`}>
                      <h4 className={`text-xs font-bold ${c.textMuted} mb-3`}>🎯 TECHNIQUES</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {practiceSummary.techniques_demonstrated?.length > 0 && (
                          <div>
                            <p className={`text-xs font-bold ${isDark ? 'text-green-400' : 'text-green-600'} mb-1`}>✅ Demonstrated</p>
                            <div className="flex flex-wrap gap-1">
                              {practiceSummary.techniques_demonstrated.map((t, i) => (
                                <span key={i} className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${c.success} border`}>{t}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {practiceSummary.techniques_to_practice?.length > 0 && (
                          <div>
                            <p className={`text-xs font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'} mb-1`}>📝 Work on</p>
                            <div className="flex flex-wrap gap-1">
                              {practiceSummary.techniques_to_practice.map((t, i) => (
                                <span key={i} className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${c.warning} border`}>{t}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ══════ TAB: DEBRIEF ══════ */}
          {activeTab === 'debrief' && (
            <div className="space-y-5">
              <div className={`${c.card} rounded-xl shadow-lg p-6`}>
                <h3 className={`font-bold ${c.text} mb-2 flex items-center gap-2`}>
                  <span className="text-lg">💗</span> Post-Conversation Debrief
                </h3>

                {/* Mode toggle */}
                {simMessages.length >= 2 && (
                  <div className="flex gap-2 mb-4">
                    <button onClick={() => setDebriefMode('real')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${chip(debriefMode === 'real')}`}>
                      💬 Real Conversation
                    </button>
                    <button onClick={() => setDebriefMode('practice')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${chip(debriefMode === 'practice')}`}>
                      ▶️ Practice Session ({simMessages.filter(m => m.role === 'user').length} exchanges)
                    </button>
                  </div>
                )}

                {debriefMode === 'real' ? (
                  <>
                    <p className={`text-sm ${c.textSecondary} mb-4`}>
                      Had the conversation? Describe what happened and get constructive feedback.
                    </p>
                    <textarea
                      value={howItWent}
                      onChange={(e) => setHowItWent(e.target.value)}
                      placeholder="What happened? What did you say, how did they respond? How do you feel about it? Be as honest as you want — this is for you."
                      rows={5}
                      className={`w-full p-4 border rounded-xl outline-none text-sm resize-y focus:ring-2 focus:ring-pink-300 ${c.input}`}
                    />
                    <button onClick={handleDebrief} disabled={debriefLoading || !howItWent.trim()}
                      className={`mt-3 px-6 py-2.5 rounded-lg font-semibold text-sm transition-all ${c.btnPrimary} disabled:opacity-40 flex items-center gap-2`}>
                      {debriefLoading ? (<><span className="inline-block animate-spin">{tool?.icon ?? '🗣️'}</span> Analyzing...</>) : (<><span className="text-base">✅</span> Get Debrief</>)}
                    </button>
                  </>
                ) : (
                  <>
                    <p className={`text-sm ${c.textSecondary} mb-3`}>
                      Get structured feedback on your practice session ({simMessages.filter(m => m.role === 'user').length} exchanges at {practiceResistance ?? resistanceLevel}% resistance).
                    </p>
                    <div className={`p-3 rounded-lg ${c.cardAlt} mb-3 max-h-32 overflow-y-auto`}>
                      {simMessages.filter(m => m.role === 'user').slice(0, 6).map((m, i) => (
                        <p key={i} className={`text-xs ${c.textSecondary} mb-1`}>You: "{m.content.slice(0, 6)}{m.content.length > 80 ? '…' : ''}"</p>
                      ))}
                      {simMessages.filter(m => m.role === 'user').length > 5 && (
                        <p className={`text-xs ${c.textMuted}`}>+{simMessages.filter(m => m.role === 'user').length - 5} more exchanges…</p>
                      )}
                    </div>
                    <button onClick={handleDebriefPractice} disabled={debriefLoading}
                      className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all ${c.btnPrimary} disabled:opacity-40 flex items-center gap-2`}>
                      {debriefLoading ? (<><span className="inline-block animate-spin">{tool?.icon ?? '🗣️'}</span> Analyzing...</>) : (<><span className="text-base">✅</span> Debrief Practice Session</>)}
                    </button>
                  </>
                )}
              </div>

              {/* Debrief Results */}
              {debriefResults && (
                <div className="space-y-4">

                  {debriefResults.overall_assessment && (
                    <div className={`${c.card} rounded-xl shadow-lg p-6 border-l-4 ${isDark ? 'border-pink-500' : 'border-pink-400'}`}>
                      <p className={`font-semibold ${c.text}`}>{debriefResults.overall_assessment}</p>
                    </div>
                  )}

                  {debriefResults.plan_vs_reality && (
                    <div className={`${c.card} rounded-xl shadow-lg p-5`}>
                      <h4 className={`font-bold ${c.text} mb-2 flex items-center gap-2`}><span className="text-base">🗺️</span> Plan vs Reality</h4>
                      <p className={`text-sm ${c.textSecondary}`}>{debriefResults.plan_vs_reality}</p>
                    </div>
                  )}

                  {debriefResults.what_went_well?.length > 0 && (
                    <div className={`${c.card} rounded-xl shadow-lg p-6`}>
                      <h4 className={`font-bold ${c.text} mb-3`}>✅ What Went Well</h4>
                      {debriefResults.what_went_well.map((item, idx) => (
                        <div key={idx} className={`p-3 rounded-lg ${c.success} border mb-2`}>
                          <p className="text-sm font-semibold">{item.moment}</p>
                          <p className="text-xs mt-1">{item.why_it_worked}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {debriefResults.growth_areas?.length > 0 && (
                    <div className={`${c.card} rounded-xl shadow-lg p-6`}>
                      <h4 className={`font-bold ${c.text} mb-3`}>📈 Growth Areas</h4>
                      {debriefResults.growth_areas.map((item, idx) => (
                        <div key={idx} className={`p-3 rounded-lg border ${c.border} mb-2`}>
                          <div className="flex items-start justify-between">
                            <p className={`text-sm font-semibold ${c.text}`}>{item.moment}</p>
                            {item.difficulty && (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                item.difficulty === 'easy' ? (isDark ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-700')
                                : item.difficulty === 'advanced' ? (isDark ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-700')
                                : (isDark ? 'bg-amber-900/40 text-amber-300' : 'bg-amber-100 text-amber-700')
                              }`}>{item.difficulty}</span>
                            )}
                          </div>
                          {item.what_happened && <p className={`text-xs ${c.textSecondary} mt-1`}>{item.what_happened}</p>}
                          {item.alternative && <p className={`text-xs ${isDark ? 'text-green-300' : 'text-green-700'} mt-1`}>→ {item.alternative}</p>}
                        </div>
                      ))}
                    </div>
                  )}

                  {debriefResults.their_patterns && (
                    <div className={`${c.card} rounded-xl shadow-lg p-5`}>
                      <h4 className={`font-bold ${c.text} mb-2 flex items-center gap-2`}><span className="text-base">👁️</span> Pattern Noticed</h4>
                      <p className={`text-sm ${c.textSecondary}`}>{debriefResults.their_patterns}</p>
                    </div>
                  )}

                  {debriefResults.emotional_processing && (
                    <div className={`p-5 rounded-xl ${c.highlight} border text-center`}>
                      <p className="text-sm font-medium">{debriefResults.emotional_processing}</p>
                    </div>
                  )}

                  {debriefResults.follow_up && (
                    <div className={`${c.card} rounded-xl shadow-lg p-5`}>
                      <h4 className={`font-bold ${c.text} mb-3`}>Follow Up</h4>
                      {debriefResults.follow_up.timing && <p className={`text-sm ${c.textSecondary} mb-2`}><strong>When:</strong> {debriefResults.follow_up.timing}</p>}
                      {debriefResults.follow_up.what_to_say && <p className={`text-sm ${c.textSecondary} mb-2`}><strong>Say:</strong> "{debriefResults.follow_up.what_to_say}"</p>}
                      {debriefResults.follow_up.if_unresolved && <p className={`text-sm ${c.textSecondary}`}><strong>If unresolved:</strong> {debriefResults.follow_up.if_unresolved}</p>}
                    </div>
                  )}

                  {debriefResults.next_time?.length > 0 && (
                    <div className={`${c.card} rounded-xl shadow-lg p-5`}>
                      <h4 className={`font-bold ${c.text} mb-2`}>Next Time</h4>
                      {debriefResults.next_time.map((item, idx) => (
                        <p key={idx} className={`text-sm ${c.textSecondary} mb-1`}>• {item}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Disclaimer */}
          <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-zinc-800/50' : 'bg-gray-50'}`}>
            <p className={`text-xs ${c.textMuted}`}>
              🎭 This tool provides conversation strategies, not therapy. For relationships involving abuse, control, or safety concerns, please reach out to a professional.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

DifficultTalkCoach.displayName = 'DifficultTalkCoach';

export default DifficultTalkCoach;
