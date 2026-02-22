import React, { useState, useRef, useEffect } from 'react';

import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';
import { getToolById } from '../data/tools';

const DifficultTalkCoach = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const toolData = getToolById('DifficultTalkCoach');
  const chatEndRef = useRef(null);

  // ─── Theme ───
  const c = {
    card: isDark ? 'bg-zinc-800' : 'bg-white',
    cardAlt: isDark ? 'bg-zinc-700/50' : 'bg-slate-50',
    text: isDark ? 'text-zinc-50' : 'text-gray-900',
    textSecondary: isDark ? 'text-zinc-300' : 'text-gray-600',
    textMuted: isDark ? 'text-zinc-500' : 'text-gray-400',
    label: isDark ? 'text-zinc-200' : 'text-gray-800',
    input: isDark ? 'bg-zinc-700 border-zinc-600 text-zinc-100 placeholder-zinc-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400',
    btnPrimary: isDark ? 'bg-violet-600 hover:bg-violet-500 text-white' : 'bg-violet-600 hover:bg-violet-700 text-white',
    btnSecondary: isDark ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-100' : 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    border: isDark ? 'border-zinc-700' : 'border-gray-200',
    chip: (active) => active
      ? (isDark ? 'bg-violet-900/40 border-violet-500 text-violet-200' : 'bg-violet-100 border-violet-500 text-violet-800')
      : (isDark ? 'border-zinc-600 text-zinc-400 hover:border-zinc-500' : 'border-gray-200 text-gray-600 hover:border-gray-300'),
    tab: (active) => active
      ? (isDark ? 'border-violet-500 text-violet-300' : 'border-violet-600 text-violet-700')
      : (isDark ? 'border-transparent text-zinc-500 hover:text-zinc-300' : 'border-transparent text-gray-400 hover:text-gray-600'),
    success: isDark ? 'bg-green-900/20 border-green-700 text-green-200' : 'bg-green-50 border-green-300 text-green-800',
    warning: isDark ? 'bg-amber-900/20 border-amber-700 text-amber-200' : 'bg-amber-50 border-amber-300 text-amber-800',
    danger: isDark ? 'bg-red-900/20 border-red-700 text-red-200' : 'bg-red-50 border-red-200 text-red-800',
    info: isDark ? 'bg-blue-900/20 border-blue-700 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-800',
    purple: isDark ? 'bg-purple-900/20 border-purple-700 text-purple-200' : 'bg-purple-50 border-purple-200 text-purple-800',
    simUser: isDark ? 'bg-violet-900/30 border-violet-700' : 'bg-violet-50 border-violet-200',
    simThem: isDark ? 'bg-zinc-700 border-zinc-600' : 'bg-gray-100 border-gray-200',
    simCoach: isDark ? 'bg-amber-900/20 border-amber-700' : 'bg-amber-50 border-amber-200',
  };

  // ─── Input State ───
  const [topic, setTopic] = useState('');
  const [relationship, setRelationship] = useState('');
  const [communicationStyle, setCommunicationStyle] = useState('Direct');
  const [resistanceLevel, setResistanceLevel] = useState(50);
  const [goals, setGoals] = useState([]);
  const [biggestFear, setBiggestFear] = useState('');
  const [theirPerspective, setTheirPerspective] = useState('');
  const [previousAttempts, setPreviousAttempts] = useState('');

  // ─── Results State ───
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('prepare');
  const [expandedSections, setExpandedSections] = useState({});
  const [expandedApproach, setExpandedApproach] = useState(0);
  const [copiedField, setCopiedField] = useState(null);

  // ─── Simulation State ───
  const [simMessages, setSimMessages] = useState([]);
  const [simInput, setSimInput] = useState('');
  const [simLoading, setSimLoading] = useState(false);
  const [simStarted, setSimStarted] = useState(false);

  // ─── Debrief State ───
  const [howItWent, setHowItWent] = useState('');
  const [debriefResults, setDebriefResults] = useState(null);
  const [debriefLoading, setDebriefLoading] = useState(false);

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
  ];

  const resistanceLabels = [
    { min: 0, max: 20, label: 'Very receptive', color: isDark ? 'text-green-400' : 'text-green-600' },
    { min: 21, max: 40, label: 'Somewhat open', color: isDark ? 'text-emerald-400' : 'text-emerald-600' },
    { min: 41, max: 60, label: 'Defensive', color: isDark ? 'text-amber-400' : 'text-amber-600' },
    { min: 61, max: 80, label: 'Very resistant', color: isDark ? 'text-orange-400' : 'text-orange-600' },
    { min: 81, max: 100, label: 'Hostile / Shutdown', color: isDark ? 'text-red-400' : 'text-red-600' },
  ];

  const getResistanceInfo = (level) => resistanceLabels.find(r => level >= r.min && level <= r.max) || resistanceLabels[2];

  // ─── Handlers ───
  const toggleGoal = (key) => setGoals(prev => prev.includes(key) ? prev.filter(g => g !== key) : [...prev, key]);
  const toggleSection = (key) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));

  const copyToClipboard = async (text, field) => {
    try { await navigator.clipboard.writeText(text); setCopiedField(field); setTimeout(() => setCopiedField(null), 2000); }
    catch (err) { console.error('Copy failed:', err); }
  };

  const CopyBtn = ({ content, field, label = 'Copy' }) => (
    <button onClick={() => copyToClipboard(content, field)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
      copiedField === field ? (isDark ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-700') : c.btnSecondary
    }`}>
      {copiedField === field ? <span className="text-sm">✅</span> : <span className="text-sm">📋</span>}
      {copiedField === field ? 'Copied' : label}
    </button>
  );

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
        biggestFear: biggestFear.trim() || null,
        theirPerspective: theirPerspective.trim() || null,
        previousAttempts: previousAttempts.trim() || null,
        userLanguage: navigator.language || 'en',
      });
      setResults(data);
      setActiveTab('prepare');
      setExpandedApproach(0);
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
        resistanceLevel,
        theirPerspective: theirPerspective || null,
        conversationHistory: newMessages,
        userMessage: userMsg,
        chosenApproach: results?.conversation_approaches?.[expandedApproach] || null,
        emotionalLandmines: results?.emotional_landmines || null,
      });
      setSimMessages(prev => [...prev, {
        role: 'them',
        content: data.their_response,
        emotionalState: data.their_emotional_state,
        coaching: data.coaching_note,
        suggestion: data.suggestion,
        health: data.conversation_health,
      }]);
    } catch (err) {
      setSimMessages(prev => [...prev, { role: 'system', content: 'Simulation error — please try again.' }]);
    }
    setSimLoading(false);
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
      });
      setDebriefResults(data);
    } catch (err) {
      setError(err.message || 'Failed to generate debrief.');
    }
    setDebriefLoading(false);
  };

  const reset = () => {
    setTopic(''); setRelationship(''); setGoals([]); setBiggestFear('');
    setTheirPerspective(''); setPreviousAttempts('');
    setResults(null); setError(''); setSimMessages([]); setSimStarted(false);
    setDebriefResults(null); setHowItWent(''); setActiveTab('prepare');
  };

  // Auto-scroll chat
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [simMessages]);

  const buildFullText = () => {
    if (!results) return '';
    const lines = ['DIFFICULT CONVERSATION STRATEGY', `Topic: ${topic}`, `With: ${relationship}`, ''];
    const sr = results.situation_reading;
    if (sr) { lines.push('SITUATION READING', sr.key_insight, `Best case: ${sr.realistic_best_case}`, `Floor: ${sr.realistic_floor}`, ''); }
    results.emotional_landmines?.forEach((lm, i) => {
      lines.push(`LANDMINE ${i + 1}: ${lm.they_might}`, `Your trigger: ${lm.your_trigger}`, `Instead of: ${lm.instinct_response}`, `Say: ${lm.strategic_response}`, '');
    });
    results.conversation_approaches?.forEach(a => {
      lines.push(`═══ ${a.approach_name.toUpperCase()} ═══`, `Opening: ${a.script.opening}`, '', a.script.main_points.join('\n'), '', `Closing: ${a.script.closing}`, '');
    });
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
      ...approach.script.specific_phrases.slice(0, 4).map(p => `• "${p}"`),
      '',
    ];
    if (approach.what_NOT_to_say?.length > 0) {
      lines.push('🚫 DON\'T SAY', ...approach.what_NOT_to_say.slice(0, 3).map(i => `• ${i}`), '');
    }
    if (results.deescalation_toolkit?.tension_lowering_phrases?.length > 0) {
      lines.push('🛡️ IF THEY GET DEFENSIVE', ...results.deescalation_toolkit.tension_lowering_phrases.slice(0, 2).map(p => `• "${p}"`), '');
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

  const handlePrint = () => {
    const content = buildFullText();
    const pw = window.open('', '_blank');
    if (!pw) return;
    pw.document.write(`<!DOCTYPE html><html><head><title>Conversation Strategy — ${topic.substring(0, 40)}</title><style>body{font-family:Georgia,serif;max-width:700px;margin:40px auto;padding:0 20px;color:#1a1a1a;line-height:1.6;font-size:14px;}pre{white-space:pre-wrap;word-wrap:break-word;font-family:inherit;margin:0;}@media print{body{margin:20px;}}</style></head><body><pre>${content.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre></body></html>`);
    pw.document.close();
    pw.focus();
    setTimeout(() => pw.print(), 250);
  };

  const healthColors = {
    on_track: isDark ? 'text-green-400' : 'text-green-600',
    drifting: isDark ? 'text-amber-400' : 'text-amber-600',
    derailing: isDark ? 'text-red-400' : 'text-red-600',
  };

  // ─── RENDER ───
  return (
    <div>
      {/* Header */}
      <div className="mb-5">
        <h2 className={`text-2xl font-bold ${c.text}`}>{toolData?.title || 'Difficult Talk Coach'} {toolData?.icon || '🎭'}</h2>
        <p className={`text-sm ${c.textMuted}`}>{toolData?.tagline || 'Rehearse hard conversations before they happen'}</p>
      </div>

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
              className={`w-full p-4 border rounded-xl outline-none text-sm resize-y focus:ring-2 focus:ring-violet-300 ${c.input}`}
            />
          </div>

          {/* Relationship */}
          <div className={`${c.card} rounded-xl shadow-lg p-6`}>
            <label className={`block font-semibold ${c.text} mb-3`}>Who is this with? <span className="text-red-500">*</span></label>
            <div className="flex flex-wrap gap-2">
              {relationships.map(r => (
                <button key={r.value} onClick={() => setRelationship(r.value)}
                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${c.chip(relationship === r.value)}`}>
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
                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${c.chip(goals.includes(g.key))}`}>
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
                className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-violet-600" />
              <div className={`flex justify-between text-xs ${c.textMuted} mt-1`}>
                <span>Receptive</span><span>Hostile</span>
              </div>
            </div>
            <div>
              <label className={`block font-semibold ${c.text} mb-2`}>Your preferred style</label>
              <div className="flex gap-2">
                {['Direct', 'Indirect', 'Collaborative', 'Assertive'].map(s => (
                  <button key={s} onClick={() => setCommunicationStyle(s)}
                    className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${c.chip(communicationStyle === s)}`}>
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
              <label className={`block text-sm font-semibold ${c.label} mb-1`}>What are you most afraid they'll say or do?</label>
              <input type="text" value={biggestFear} onChange={(e) => setBiggestFear(e.target.value)}
                placeholder="e.g., 'They'll cry and make me feel guilty', 'They'll deny it ever happened'"
                className={`w-full p-3 border rounded-xl outline-none text-sm focus:ring-2 focus:ring-violet-300 ${c.input}`} />
            </div>
            <div>
              <label className={`block text-sm font-semibold ${c.label} mb-1`}>What's their side of this?</label>
              <input type="text" value={theirPerspective} onChange={(e) => setTheirPerspective(e.target.value)}
                placeholder="e.g., 'They think they're being helpful', 'They don't realize it bothers me'"
                className={`w-full p-3 border rounded-xl outline-none text-sm focus:ring-2 focus:ring-violet-300 ${c.input}`} />
            </div>
            <div>
              <label className={`block text-sm font-semibold ${c.label} mb-1`}>Have you tried raising this before?</label>
              <input type="text" value={previousAttempts} onChange={(e) => setPreviousAttempts(e.target.value)}
                placeholder="e.g., 'Hinted once but backed down', 'Argued about it twice, nothing changed'"
                className={`w-full p-3 border rounded-xl outline-none text-sm focus:ring-2 focus:ring-violet-300 ${c.input}`} />
            </div>
          </div>

          {/* Submit */}
          <button onClick={handleGenerate} disabled={loading || !topic.trim() || !relationship || goals.length === 0}
            className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2 shadow-lg ${
              loading ? (isDark ? 'bg-zinc-700 text-zinc-400' : 'bg-gray-200 text-gray-400') : c.btnPrimary
            }`}>
            {loading ? (<><span className="inline-block animate-spin text-lg">⏳</span> Building your strategy...</>)
              : (<><span className="text-lg">🧠</span> Build Conversation Strategy</>)}
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
        <div className="space-y-5">

          {/* Controls */}
          <div className={`${c.card} rounded-xl shadow-lg p-4 flex items-center justify-between flex-wrap gap-3`}>
            <span className={`text-sm font-semibold ${c.text}`}>Strategy: {topic.substring(0, 50)}{topic.length > 50 ? '…' : ''}</span>
            <div className="flex items-center gap-2">
              <CopyBtn content={buildFullText()} field="full-strategy" label="Copy All" />
              <button onClick={handlePrint} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${c.btnSecondary}`}>
                <span className="text-sm">🖨️</span> Print
              </button>
              <button onClick={reset} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${isDark ? 'bg-violet-900/30 text-violet-300 hover:bg-violet-800/40' : 'bg-violet-50 text-violet-700 hover:bg-violet-100'}`}>
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
                className={`flex items-center gap-1.5 px-5 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${c.tab(activeTab === tab.key)}`}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* ══════ TAB: PREPARE ══════ */}
          {activeTab === 'prepare' && (
            <div className="space-y-5">

              {/* Situation Reading */}
              {results.situation_reading && (
                <div className={`${c.card} rounded-xl shadow-lg p-6 border-l-4 ${isDark ? 'border-violet-500' : 'border-violet-400'}`}>
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
                        className={`px-3 py-2 rounded-lg border text-sm font-semibold whitespace-nowrap transition-all ${c.chip(expandedApproach === idx)}`}>
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
                          <CopyBtn content={`Opening: ${approach.script.opening}\n\nMain Points:\n${approach.script.main_points.map((p,i) => `${i+1}. ${p}`).join('\n')}\n\nKey Phrases:\n${approach.script.specific_phrases.map(p => `• ${p}`).join('\n')}\n\nClosing: ${approach.script.closing}`} field={`approach-${idx}`} label="Copy Script" />
                        </div>

                        {/* Opening */}
                        <div className={`p-4 rounded-xl ${isDark ? 'bg-violet-900/20 border-violet-700' : 'bg-violet-50 border-violet-200'} border`}>
                          <p className={`text-xs font-bold ${isDark ? 'text-violet-400' : 'text-violet-600'} mb-2`}>OPENING — Say this first</p>
                          <p className={`text-sm ${c.text} leading-relaxed font-medium`}>"{approach.script.opening}"</p>
                        </div>

                        {/* Main Points */}
                        <div>
                          <p className={`text-xs font-bold ${c.textMuted} mb-2`}>MAIN POINTS — Cover these in order</p>
                          {approach.script.main_points.map((point, i) => (
                            <div key={i} className={`flex items-start gap-3 mb-2`}>
                              <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isDark ? 'bg-violet-900/30 text-violet-300' : 'bg-violet-100 text-violet-700'}`}>{i + 1}</span>
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
                        <div className={`p-4 rounded-lg ${c.info} border`}>
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
                        <div className={`p-4 rounded-lg ${c.purple} border text-center`}>
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
                <div className={`p-5 rounded-xl ${c.purple} border text-center`}>
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
                      <div className={`p-3 rounded-lg ${c.info} border`}>
                        <p className="text-xs font-bold mb-1">⏳ IF THEY NEED TIME</p>
                        <p className="text-sm">{results.follow_up_plan.if_they_need_time}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Cross-references */}
              <div className={`flex flex-col sm:flex-row gap-2 mt-2`}>
                <p className={`text-xs text-center sm:text-left ${c.textMuted}`}>
                  Need to say it firmly but diplomatically? <a href="/VelvetHammer" className={`font-semibold ${isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-600 hover:text-cyan-700'}`}>Velvet Hammer</a> crafts the words.
                </p>
                <p className={`text-xs text-center sm:text-left ${c.textMuted}`}>
                  If the conversation calls for an apology, <a href="/ApologyCalibrator" className={`font-semibold ${isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-600 hover:text-cyan-700'}`}>Apology Calibrator</a> helps you get the tone right.
                </p>
              </div>
            </div>
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
                    <CopyBtn content={buildQuickRefText()} field="quick-ref" label="Copy Card" />
                    <button onClick={() => {
                      const content = buildQuickRefText();
                      const pw = window.open('', '_blank');
                      if (!pw) return;
                      pw.document.write(`<!DOCTYPE html><html><head><title>Quick Ref — ${topic.substring(0, 40)}</title><style>body{font-family:Georgia,serif;max-width:500px;margin:30px auto;padding:20px;color:#1a1a1a;line-height:1.6;font-size:13px;border:2px solid #ddd;border-radius:12px;}h2{font-size:16px;margin:0 0 12px;border-bottom:1px solid #eee;padding-bottom:8px;}h3{font-size:12px;text-transform:uppercase;letter-spacing:0.1em;color:#666;margin:14px 0 6px;}p,li{margin:4px 0;}ul{padding-left:18px;}pre{white-space:pre-wrap;font-family:inherit;}@media print{body{border:none;margin:10px;}}</style></head><body><pre>${content.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre></body></html>`);
                      pw.document.close();
                      pw.focus();
                      setTimeout(() => pw.print(), 250);
                    }} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${c.btnSecondary}`}>
                      <span className="text-sm">🖨️</span> Print Card
                    </button>
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
                      <div className={`text-center py-2 px-4 rounded-lg ${isDark ? 'bg-violet-900/30 border-violet-700' : 'bg-violet-50 border-violet-200'} border`}>
                        <p className={`text-xs font-bold uppercase tracking-wide ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>
                          Using: {approach.approach_name}
                        </p>
                      </div>

                      {/* Opening Line */}
                      <div className={`p-4 rounded-xl ${isDark ? 'bg-violet-900/20 border-violet-700' : 'bg-violet-50 border-violet-200'} border`}>
                        <p className={`text-xs font-bold ${isDark ? 'text-violet-400' : 'text-violet-600'} mb-2`}>🎤 YOUR OPENING LINE</p>
                        <p className={`text-base ${c.text} font-medium leading-relaxed`}>"{approach.script.opening}"</p>
                      </div>

                      {/* Key Phrases to Reach For */}
                      <div className={`p-4 rounded-lg ${c.success} border`}>
                        <p className="text-xs font-bold mb-2">✅ PHRASES TO REACH FOR</p>
                        <div className="space-y-1.5">
                          {approach.script.specific_phrases.slice(0, 4).map((phrase, i) => (
                            <p key={i} className="text-sm">• "{phrase}"</p>
                          ))}
                        </div>
                      </div>

                      {/* Things NOT to Say */}
                      {approach.what_NOT_to_say?.length > 0 && (
                        <div className={`p-4 rounded-lg ${c.danger} border`}>
                          <p className="text-xs font-bold mb-2">🚫 DON'T SAY</p>
                          <div className="space-y-1.5">
                            {approach.what_NOT_to_say.slice(0, 3).map((item, i) => (
                              <p key={i} className="text-sm">• {item}</p>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* If They Get Defensive */}
                      {results.deescalation_toolkit && (
                        <div className={`p-4 rounded-lg ${c.info} border`}>
                          <p className="text-xs font-bold mb-2">🛡️ IF THEY GET DEFENSIVE</p>
                          {results.deescalation_toolkit.tension_lowering_phrases?.slice(0, 2).map((p, i) => (
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
                        <div className={`p-4 rounded-xl ${c.purple} border text-center`}>
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
                              className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all ${c.chip(expandedApproach === idx)}`}>
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
                  Type what you'd say. The AI will respond as {relationship.toLowerCase() || 'them'} at resistance level {resistanceLevel}%. You'll get real-time coaching after each exchange.
                </p>

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
                            className={`mt-3 text-xs ${isDark ? 'text-violet-400 hover:text-violet-300' : 'text-violet-600 hover:text-violet-700'} underline underline-offset-2`}
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
                              <p className={`text-xs font-bold ${isDark ? 'text-violet-400' : 'text-violet-600'} mb-1`}>YOU</p>
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
                                </div>
                                <p className={`text-sm ${c.text}`}>{msg.content}</p>
                              </div>
                            </div>
                            {msg.coaching && (
                              <div className={`ml-4 max-w-[85%] p-2.5 rounded-lg ${c.simCoach} border`}>
                                <p className={`text-xs font-bold ${isDark ? 'text-amber-400' : 'text-amber-700'} mb-0.5`}>🎯 COACH</p>
                                <p className={`text-xs ${c.textSecondary}`}>{msg.coaching}</p>
                                {msg.suggestion && <p className={`text-xs ${isDark ? 'text-green-300' : 'text-green-700'} mt-1`}>Try: "{msg.suggestion}"</p>}
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
                          <span className={`inline-block animate-spin text-base ${c.textMuted}`}>⏳</span>
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
                      className={`flex-1 p-2.5 border rounded-lg outline-none text-sm focus:ring-2 focus:ring-violet-300 ${c.input}`}
                    />
                    <button onClick={handleSimSend} disabled={!simInput.trim() || simLoading}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${c.btnPrimary} disabled:opacity-40`}>
                      <span className="text-sm">📤</span>
                    </button>
                  </div>
                </div>

                {simMessages.length > 0 && (
                  <button onClick={() => { setSimMessages([]); setSimStarted(false); }}
                    className={`mt-3 flex items-center gap-1.5 text-sm ${c.textMuted} hover:${c.text}`}>
                    <span className="text-sm">🔄</span> Reset practice
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ══════ TAB: DEBRIEF ══════ */}
          {activeTab === 'debrief' && (
            <div className="space-y-5">
              <div className={`${c.card} rounded-xl shadow-lg p-6`}>
                <h3 className={`font-bold ${c.text} mb-2 flex items-center gap-2`}>
                  <span className="text-lg">💗</span> Post-Conversation Debrief
                </h3>
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
                  {debriefLoading ? (<><span className="inline-block animate-spin text-base">⏳</span> Analyzing...</>) : (<><span className="text-base">✅</span> Get Debrief</>)}
                </button>
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
                    <div className={`p-5 rounded-xl ${c.purple} border text-center`}>
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
