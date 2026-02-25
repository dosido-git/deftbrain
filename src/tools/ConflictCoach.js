import React, { useState, useEffect, useRef } from 'react';
import { CopyBtn } from '../components/ActionButtons';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';

const ConflictCoach = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const load = (k) => { try { const s = localStorage.getItem(k); return s ? JSON.parse(s) : null; } catch { return null; } };
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

  // Form state
  const [receivedMessage, setReceivedMessage] = useState('');
  const [relationship, setRelationship] = useState('Friend');
  const [emotionalState, setEmotionalState] = useState({ angry: false, hurt: false, defensive: false, frustrated: false, calm: false, confused: false });
  const [goals, setGoals] = useState({ resolve: false, boundary: false, disengage: false, validate: false, schedule_talk: false });
  const [userDraft, setUserDraft] = useState('');

  // Results + UI
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const showToast = (msg, dur = 4000) => { setToast(msg); setTimeout(() => setToast(null), dur); };

  // v2: delay, goal clarification, confirm send
  const [mandatoryDelay, setMandatoryDelay] = useState(false);
  const [delaySeconds, setDelaySeconds] = useState(600);
  const [delayActive, setDelayActive] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [showGoalClarification, setShowGoalClarification] = useState(false);
  const [actualGoal, setActualGoal] = useState('');
  const [emotionCheckDone, setEmotionCheckDone] = useState(false);
  const [showConfirmSend, setShowConfirmSend] = useState(false);

  // ═══ v3 NEW FEATURES ═══
  // #1 Conversation thread
  const [threadMessages, setThreadMessages] = useState([]);
  const [threadInput, setThreadInput] = useState('');
  const [threadSender, setThreadSender] = useState('them');
  const [useThread, setUseThread] = useState(false);

  // #3 Follow-up coaching
  const [followupQuestion, setFollowupQuestion] = useState('');
  const [followupHistory, setFollowupHistory] = useState([]);
  const [followupLoading, setFollowupLoading] = useState(false);
  const followupRef = useRef(null);

  // #4 Tone adjustment
  const [selectedStrategyIdx, setSelectedStrategyIdx] = useState(null);
  const [toneLevel, setToneLevel] = useState(50);
  const [adjustedResponse, setAdjustedResponse] = useState(null);
  const [toneLoading, setToneLoading] = useState(false);

  // #5 Conflict history
  const [conflictHistory, setConflictHistory] = useState(() => load('conflictHistory') || []);
  const [showHistory, setShowHistory] = useState(false);
  const [personLabel, setPersonLabel] = useState('');

  useEffect(() => { save('conflictHistory', conflictHistory); }, [conflictHistory]);

  const relationshipOptions = ['Partner', 'Family', 'Friend', 'Coworker', 'Ex', 'Customer', 'Other'];
  const linkStyle = isDark ? 'text-cyan-400 hover:text-cyan-300 underline underline-offset-2' : 'text-cyan-600 hover:text-cyan-700 underline underline-offset-2';

  const c = {
    card: isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-orange-200',
    cardAlt: isDark ? 'bg-zinc-700 border-zinc-600' : 'bg-yellow-50 border-yellow-200',
    input: isDark ? 'bg-zinc-900 border-zinc-700 text-zinc-50 placeholder:text-zinc-500 focus:border-orange-500 focus:ring-orange-500/20' : 'bg-white border-orange-300 text-orange-900 placeholder:text-orange-400 focus:border-orange-600 focus:ring-orange-100',
    text: isDark ? 'text-zinc-50' : 'text-orange-900',
    textSecondary: isDark ? 'text-zinc-300' : 'text-orange-700',
    textMuted: isDark ? 'text-zinc-400' : 'text-orange-600',
    label: isDark ? 'text-zinc-200' : 'text-orange-800',
    accent: isDark ? 'text-orange-400' : 'text-orange-600',
    btnPrimary: isDark ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'bg-orange-600 hover:bg-orange-700 text-white',
    btnSecondary: isDark ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-50' : 'bg-orange-100 hover:bg-orange-200 text-orange-900',
    btnOutline: isDark ? 'border-zinc-600 hover:border-zinc-500 text-zinc-200' : 'border-orange-300 hover:border-orange-400 text-orange-700',
    warning: isDark ? 'bg-amber-900/20 border-amber-700 text-amber-200' : 'bg-amber-50 border-amber-300 text-amber-800',
    danger: isDark ? 'bg-red-900/20 border-red-700 text-red-200' : 'bg-red-50 border-red-300 text-red-800',
    success: isDark ? 'bg-emerald-900/20 border-emerald-700 text-emerald-200' : 'bg-emerald-50 border-emerald-300 text-emerald-800',
    info: isDark ? 'bg-blue-900/20 border-blue-700 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-900',
    manipulation: isDark ? 'bg-purple-900/20 border-purple-700 text-purple-200' : 'bg-purple-50 border-purple-300 text-purple-800',
  };

  // ═══ DELAY TIMER ═══
  useEffect(() => {
    let iv;
    if (delayActive && delaySeconds > 0) {
      iv = setInterval(() => setDelaySeconds(p => {
        if (p <= 1) { setDelayActive(false); showToast('⏰ Cooling period complete.', 6000); return 0; }
        return p - 1;
      }), 1000);
    }
    return () => clearInterval(iv);
  }, [delayActive, delaySeconds]);

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const getTemperatureColor = (t) => { switch (t?.toLowerCase()) { case 'high': return isDark ? 'bg-red-900/30 border-red-700 text-red-200' : 'bg-red-100 border-red-400 text-red-800'; case 'medium': return isDark ? 'bg-amber-900/30 border-amber-700 text-amber-200' : 'bg-amber-100 border-amber-400 text-amber-800'; case 'low': return isDark ? 'bg-emerald-900/30 border-emerald-700 text-emerald-200' : 'bg-emerald-100 border-emerald-400 text-emerald-800'; default: return c.info; } };
  const getTemperatureEmoji = (t) => { switch (t?.toLowerCase()) { case 'high': return '🔥'; case 'medium': return '⚠️'; case 'low': return '✅'; default: return '🌡️'; } };

  // ═══ CORE ACTIONS ═══
  const handleAnalyze = async () => {
    const msg = useThread ? threadMessages.map(m => `[${m.sender}]: ${m.text}`).join('\n') : receivedMessage.trim();
    if (!msg || msg.length < 10) { setError('Paste the message (10+ chars) or add thread messages'); return; }
    if (!showGoalClarification && !actualGoal) { setShowGoalClarification(true); setError('Please clarify your goal first.'); return; }
    setError(''); setResults(null); setFollowupHistory([]); setSelectedStrategyIdx(null); setAdjustedResponse(null);
    try {
      const data = await callToolEndpoint('conflict-coach', {
        receivedMessage: msg, relationship,
        emotionalState: Object.keys(emotionalState).filter(k => emotionalState[k]),
        goals: Object.keys(goals).filter(k => goals[k]),
        userDraft: userDraft.trim(), actualGoal: actualGoal.trim(),
        isThread: useThread, personLabel: personLabel.trim() || null
      });
      setResults(data);
      if (data.message_analysis?.emotional_temperature === 'high' || emotionalState.angry || emotionalState.defensive) {
        setMandatoryDelay(true);
        if (!delayActive) { setDelaySeconds(600); setDelayActive(true); }
      }
      handleSaveConflict(data);
    } catch (err) { setError(err.message || 'Analysis failed.'); }
  };

  const handleEmotionToggle = (e) => { setEmotionalState(p => ({ ...p, [e]: !p[e] })); setEmotionCheckDone(true); };
  const handleGoalToggle = (g) => setGoals(p => ({ ...p, [g]: !p[g] }));

  const handleCopyResponse = (text) => {
    if ((mandatoryDelay && delayActive) || !emotionCheckDone) { showToast('⏸️ Wait for cooling period & check emotions first.'); return; }
    setSelectedResponse(text); setShowConfirmSend(true);
  };
  const handleConfirmCopy = async () => {
    if (!selectedResponse) return;
    try { await navigator.clipboard.writeText(`${selectedResponse}\n\n— Generated by DeftBrain · deftbrain.com`); setShowConfirmSend(false); showToast('✅ Copied. Breathe before you send.'); setSelectedResponse(null); }
    catch { showToast('Copy failed.'); }
  };

  const handleReset = () => {
    setReceivedMessage(''); setRelationship('Friend');
    setEmotionalState({ angry: false, hurt: false, defensive: false, frustrated: false, calm: false, confused: false });
    setGoals({ resolve: false, boundary: false, disengage: false, validate: false, schedule_talk: false });
    setUserDraft(''); setResults(null); setError('');
    setMandatoryDelay(false); setDelayActive(false); setDelaySeconds(600);
    setSelectedResponse(null); setShowGoalClarification(false); setActualGoal('');
    setEmotionCheckDone(false); setShowConfirmSend(false);
    setThreadMessages([]); setFollowupHistory([]); setSelectedStrategyIdx(null); setAdjustedResponse(null);
  };

  // ═══ #1: Thread builder ═══
  const handleAddThreadMessage = () => {
    if (!threadInput.trim()) return;
    setThreadMessages(p => [...p, { sender: threadSender, text: threadInput.trim(), id: Date.now() }]);
    setThreadInput(''); setThreadSender(threadSender === 'them' ? 'me' : 'them');
  };
  const handleRemoveThreadMessage = (id) => setThreadMessages(p => p.filter(m => m.id !== id));

  // ═══ #3: Follow-up coaching ═══
  const handleFollowup = async () => {
    if (!followupQuestion.trim() || !results) return;
    setFollowupLoading(true); const q = followupQuestion.trim(); setFollowupQuestion('');
    try {
      const data = await callToolEndpoint('conflict-coach/followup', {
        question: q, originalAnalysis: results, relationship, receivedMessage: receivedMessage.trim(),
        actualGoal: actualGoal.trim(), personLabel: personLabel.trim() || null
      });
      setFollowupHistory(p => [...p, { question: q, answer: data.answer }]);
      setTimeout(() => followupRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch { showToast('❌ Follow-up failed.'); }
    setFollowupLoading(false);
  };

  // ═══ #4: Tone adjustment ═══
  const handleAdjustTone = async () => {
    if (selectedStrategyIdx === null || !results?.response_strategies?.[selectedStrategyIdx]) return;
    setToneLoading(true);
    const strategy = results.response_strategies[selectedStrategyIdx];
    try {
      const data = await callToolEndpoint('conflict-coach/adjust-tone', {
        originalResponse: strategy.response_text, originalStrategy: strategy.strategy,
        toneLevel, relationship, receivedMessage: receivedMessage.trim(), actualGoal: actualGoal.trim()
      });
      setAdjustedResponse(data);
    } catch { showToast('❌ Tone adjustment failed.'); }
    setToneLoading(false);
  };

  // ═══ #5: Conflict history ═══
  const handleSaveConflict = (data) => {
    const entry = {
      id: Date.now().toString(), date: new Date().toISOString(),
      person: personLabel.trim() || relationship, relationship,
      topic: receivedMessage.trim().slice(0, 80),
      temperature: data?.message_analysis?.emotional_temperature || 'unknown',
      tactics: data?.manipulation_tactics?.map(t => t.tactic) || [],
    };
    setConflictHistory(p => [entry, ...p].slice(0, 50));
  };

  const detectPatterns = () => {
    if (conflictHistory.length < 2) return null;
    const person = personLabel.trim() || relationship;
    const withPerson = conflictHistory.filter(e => e.person === person);
    if (withPerson.length < 2) return null;
    const thirtyDays = new Date(); thirtyDays.setDate(thirtyDays.getDate() - 30);
    const recent = withPerson.filter(e => new Date(e.date) > thirtyDays);
    if (recent.length < 2) return null;
    const allTactics = recent.flatMap(e => e.tactics || []);
    const tacticCounts = {}; allTactics.forEach(t => { tacticCounts[t] = (tacticCounts[t] || 0) + 1; });
    const repeatedTactics = Object.entries(tacticCounts).filter(([, ct]) => ct >= 2).map(([t]) => t);
    return { count: recent.length, person, repeatedTactics, timeframe: '30 days' };
  };

  // ═══ BUILD TEXTS ═══
  const buildFullText = () => {
    if (!results) return '';
    const l = ['💬 CONFLICT COACH', '═'.repeat(40)];
    if (results.message_analysis) {
      l.push('', `🌡️ TEMPERATURE: ${results.message_analysis.emotional_temperature?.toUpperCase()}`, `Emotion: ${results.message_analysis.primary_emotion_detected}`);
      if (results.message_analysis.triggers_identified?.length) l.push(`Triggers: ${results.message_analysis.triggers_identified.join('; ')}`);
      if (results.message_analysis.underlying_need) l.push(`Need: ${results.message_analysis.underlying_need}`);
    }
    if (results.manipulation_tactics?.length) { l.push('', '🎭 MANIPULATION DETECTED:'); results.manipulation_tactics.forEach(t => l.push(`  ⚠️ ${t.tactic}: ${t.description}`)); }
    if (results.goal_reality_check) { l.push('', '🎯 GOAL CHECK', results.goal_reality_check.assessment); if (results.goal_reality_check.alternative_approach) l.push(`Alternative: ${results.goal_reality_check.alternative_approach}`); }
    if (results.draft_analysis) { l.push('', '🚨 DRAFT ANALYSIS', results.draft_analysis.overall_assessment); if (results.draft_analysis.escalation_risk) l.push(`Escalation: ${results.draft_analysis.escalation_risk.level?.toUpperCase()} — ${results.draft_analysis.escalation_risk.why}`); }
    if (results.response_strategies?.length) { l.push('', '💡 STRATEGIES'); results.response_strategies.forEach((s, i) => { l.push(`\n  ${i + 1}. ${s.strategy} (${s.tone})`, `  "${s.response_text}"`, s.risks ? `  Risk: ${s.risks}` : ''); }); }
    if (results.what_NOT_to_say?.length) { l.push('', '❌ LANDMINES'); results.what_NOT_to_say.forEach(i => l.push(`  ❌ "${i.phrase}" — ${i.why_avoid}`)); }
    if (results.timing_landmines?.length) { l.push('', '⏰ TIMING'); results.timing_landmines.forEach(t => l.push(`  ⏰ ${t}`)); }
    if (followupHistory.length) { l.push('', 'FOLLOW-UP:'); followupHistory.forEach(f => l.push(`  Q: ${f.question}`, `  A: ${f.answer}`, '')); }
    l.push('', '— Generated by DeftBrain · deftbrain.com');
    return l.join('\n');
  };

  const handlePrint = () => {
    if (!results) return;
    const t = buildFullText();
    const w = window.open('', '_blank'); if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>Conflict Analysis</title><style>body{font-family:system-ui;padding:2rem;max-width:700px;margin:0 auto;line-height:1.6;font-size:14px;}pre{white-space:pre-wrap;}.b{margin-top:2rem;border-top:1px solid #ddd;padding-top:1rem;font-size:12px;color:#999;text-align:center;}</style></head><body><pre>${t.replace(/— Generated.*/, '')}</pre><div class="b">Generated by DeftBrain · deftbrain.com</div></body></html>`);
    w.document.close(); w.print();
  };

  const exampleMessage = "I can't believe you did that again. You never think about how your actions affect me. This is exactly why we have problems. I'm so sick of this.";

  // ═══ RENDER ═══
  return (
    <div className="space-y-6">
      {toast && <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg text-sm font-medium max-w-md text-center ${isDark ? 'bg-zinc-700 text-zinc-50 border border-zinc-600' : 'bg-white text-gray-900 border border-gray-200'}`}>{toast}</div>}

      {/* Warning Banner */}
      <div className={`${c.warning} border-l-4 rounded-r-lg p-5`}>
        <div className="flex items-start gap-3">
          <div>
            <h3 className={`font-bold mb-1 ${c.text}`}>Conflict Coach ⚠️</h3>
            <p className={`text-sm ${c.textSecondary}`}>Before you send that angry text... STOP. Includes mandatory cooling periods, manipulation detection, deep draft analysis, and goal clarification.</p>
            <p className={`text-xs ${c.textMuted} mt-1`}>NOT a replacement for therapy. For abusive situations, seek professional help.</p>
          </div>
        </div>
      </div>

      {/* Pattern Alert (#5) */}
      {(() => { const p = detectPatterns(); return p ? (
        <div className={`${c.manipulation} border-2 rounded-xl p-5`}>
          <h3 className={`font-bold mb-2 ${c.text}`}>🔗 Pattern Detected</h3>
          <p className={`text-sm ${c.textSecondary}`}>You've logged <strong>{p.count} conflicts</strong> with <strong>{p.person}</strong> in the past {p.timeframe}.</p>
          {p.repeatedTactics.length > 0 && <p className={`text-sm mt-1 ${c.textSecondary}`}>Recurring tactics: <strong>{p.repeatedTactics.join(', ')}</strong>. This is a pattern, not an incident.</p>}
          <p className={`text-xs mt-2 ${c.textMuted}`}>Consider whether this relationship dynamic needs professional support.</p>
        </div>
      ) : null; })()}

      {/* Delay */}
      {delayActive && (
        <div className={`${c.danger} border-4 rounded-xl p-6 text-center`}>
          <span className="text-6xl block mb-4">🔒</span>
          <h3 className={`text-2xl font-bold mb-2 ${c.text}`}>Mandatory Cooling Period</h3>
          <div className={`text-5xl font-mono font-bold mb-3 ${c.text}`}>{formatTime(delaySeconds)}</div>
          <p className={`text-sm ${c.text}`}>High emotions detected. Responses locked. Breathe.</p>
        </div>
      )}

      {/* Goal Clarification */}
      {showGoalClarification && !actualGoal && (
        <div className={`${c.info} border-4 rounded-xl p-6`}>
          <h3 className={`text-lg font-bold mb-4 ${c.text}`}>🎯 What Do You Actually Want?</h3>
          <p className={`text-sm mb-3 ${c.textSecondary}`}>Not "what do I want to say" — what <em>outcome</em> do I want?</p>
          <div className={`space-y-2 mb-4 text-sm ${c.textSecondary}`}>
            <p>Examples that help:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>"I want them to understand how this affected me"</li>
              <li>"I want to set a boundary about this behavior"</li>
              <li>"I want to end this conversation without it blowing up"</li>
              <li>"I want to preserve the relationship while being honest"</li>
            </ul>
          </div>
          <textarea value={actualGoal} onChange={e => setActualGoal(e.target.value)} placeholder="What outcome do you want from this conversation?" className={`w-full p-4 border rounded-lg ${c.input} mb-3`} rows={3} />
          <button onClick={() => setShowGoalClarification(false)} disabled={!actualGoal.trim()} className={`w-full ${c.btnPrimary} py-3 rounded-lg font-semibold disabled:opacity-50`}>Continue</button>
        </div>
      )}

      {/* ═══ INPUT FORM ═══ */}
      <div className={`${c.card} border rounded-xl shadow-lg p-6`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${isDark ? 'bg-orange-900/30' : 'bg-orange-100'}`}><span className="text-2xl">💬</span></div>
            <div><h2 className={`text-xl font-bold ${c.text}`}>What Happened?</h2><p className={`text-sm ${c.textMuted}`}>Paste the message or build a thread</p></div>
          </div>
          <button onClick={() => setShowHistory(!showHistory)} className={`${c.btnSecondary} px-3 py-1.5 rounded text-xs`}>📋 History</button>
        </div>

        {/* History (#5) */}
        {showHistory && (
          <div className={`mb-5 p-4 rounded-lg border max-h-64 overflow-y-auto ${isDark ? 'bg-zinc-700 border-zinc-600' : 'bg-yellow-50 border-yellow-200'}`}>
            <h4 className={`font-bold mb-2 ${c.text}`}>📋 Past Conflicts</h4>
            {conflictHistory.length > 0 ? <div className="space-y-2">{conflictHistory.slice(0, 15).map(e => (
              <div key={e.id} className={`flex items-center justify-between p-2 rounded ${isDark ? 'bg-zinc-800' : 'bg-white'}`}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${e.temperature === 'high' ? 'bg-red-100 text-red-700' : e.temperature === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{e.temperature}</span>
                    <span className={`text-xs ${c.textMuted}`}>{e.person} · {new Date(e.date).toLocaleDateString()}</span>
                  </div>
                  <p className={`text-sm truncate ${c.text}`}>{e.topic}</p>
                  {e.tactics?.length > 0 && <p className={`text-xs ${c.textMuted}`}>Tactics: {e.tactics.join(', ')}</p>}
                </div>
              </div>
            ))}</div> : <p className={`text-sm ${c.textMuted}`}>No past conflicts.</p>}
          </div>
        )}

        <div className="space-y-5">
          {/* Person label + relationship */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className={`block text-sm font-medium ${c.label} mb-1`}>Who is this person? (optional)</label><input type="text" value={personLabel} onChange={e => setPersonLabel(e.target.value)} placeholder="Name or nickname for tracking" className={`w-full p-3 border rounded-lg ${c.input}`} /></div>
            <div><label className={`block text-sm font-medium ${c.label} mb-1`}>Relationship</label><select value={relationship} onChange={e => setRelationship(e.target.value)} className={`w-full p-3 border rounded-lg ${c.input}`}>{relationshipOptions.map(o => <option key={o} value={o}>{o}</option>)}</select></div>
          </div>

          {/* Thread toggle (#1) */}
          <label className={`flex items-center gap-2 cursor-pointer text-sm ${c.label}`}>
            <input type="checkbox" checked={useThread} onChange={e => setUseThread(e.target.checked)} className="w-4 h-4" />
            📜 Build conversation thread (multiple back-and-forth messages)
          </label>

          {/* Thread builder (#1) */}
          {useThread ? (
            <div>
              <label className={`block text-sm font-medium ${c.label} mb-2`}>Build the conversation</label>
              {threadMessages.length > 0 && (
                <div className={`mb-3 p-3 rounded-lg border ${isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-gray-50 border-gray-200'} max-h-48 overflow-y-auto space-y-2`}>
                  {threadMessages.map(m => (
                    <div key={m.id} className={`flex ${m.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] p-2 rounded-lg text-sm ${m.sender === 'me' ? isDark ? 'bg-orange-900/30 border border-orange-700' : 'bg-orange-100 border border-orange-300' : isDark ? 'bg-zinc-700 border border-zinc-600' : 'bg-white border border-gray-300'}`}>
                        <p className={`text-xs font-bold mb-0.5 ${c.textMuted}`}>{m.sender === 'me' ? 'You' : 'Them'}</p>
                        <p className={c.text}>{m.text}</p>
                        <button onClick={() => handleRemoveThreadMessage(m.id)} className={`text-xs ${c.textMuted} mt-1 hover:underline`}>✕ remove</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <select value={threadSender} onChange={e => setThreadSender(e.target.value)} className={`p-2 border rounded text-sm ${c.input} w-24`}>
                  <option value="them">Them</option><option value="me">Me</option>
                </select>
                <input type="text" value={threadInput} onChange={e => setThreadInput(e.target.value)} placeholder="Type message..." className={`flex-1 p-2 border rounded text-sm ${c.input}`} onKeyDown={e => { if (e.key === 'Enter') handleAddThreadMessage(); }} />
                <button onClick={handleAddThreadMessage} className={`${c.btnPrimary} px-3 py-2 rounded text-sm`}>Add</button>
              </div>
              <p className={`text-xs ${c.textMuted} mt-1`}>Add messages in order. The AI analyzes the full dynamic.</p>
            </div>
          ) : (
            <div>
              <div className="flex justify-between mb-1"><label className={`text-sm font-medium ${c.label}`}>The message you received</label><button onClick={() => setReceivedMessage(exampleMessage)} className={`text-xs ${c.accent} hover:underline`}>Example</button></div>
              <textarea value={receivedMessage} onChange={e => setReceivedMessage(e.target.value)} placeholder="Paste the tense/upsetting message..." className={`w-full p-4 border rounded-lg ${c.input}`} rows={4} />
            </div>
          )}

          {/* User draft */}
          <div className={`border-2 rounded-lg p-4 ${isDark ? 'border-red-700 bg-red-900/20' : 'border-red-300 bg-red-50'}`}>
            <div className="flex items-center gap-2 mb-1"><span>🛑</span><label className={`text-sm font-bold ${c.label}`}>What you're tempted to say (CRITICAL)</label></div>
            <textarea value={userDraft} onChange={e => setUserDraft(e.target.value)} placeholder="Your reactive response... be honest" className={`w-full p-3 border rounded-lg ${c.input}`} rows={3} />
            <p className={`text-xs ${c.textMuted} mt-1`}>We catch escalation BEFORE it happens. Honesty helps.</p>
          </div>

          {/* Emotions */}
          <div className={`border-2 rounded-lg p-4 ${!emotionCheckDone ? isDark ? 'border-orange-500 bg-orange-900/20' : 'border-orange-500 bg-orange-50' : ''}`}>
            <label className={`block text-sm font-bold ${c.label} mb-2`}>How are you feeling RIGHT NOW?</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[['angry', '😠 Angry', 'border-red-500 bg-red-100 dark:bg-red-900/30'], ['hurt', '💔 Hurt', 'border-blue-500 bg-blue-100 dark:bg-blue-900/30'], ['defensive', '🛡️ Defensive', 'border-orange-500 bg-orange-100 dark:bg-orange-900/30'], ['frustrated', '😤 Frustrated', 'border-amber-500 bg-amber-100 dark:bg-amber-900/30'], ['calm', '😌 Calm', 'border-green-500 bg-green-100 dark:bg-green-900/30'], ['confused', '😕 Confused', 'border-purple-500 bg-purple-100 dark:bg-purple-900/30']].map(([key, label, active]) => (
                <label key={key} className={`p-2.5 rounded-lg border-2 cursor-pointer ${emotionalState[key] ? active : isDark ? 'border-zinc-700' : 'border-gray-300'}`}>
                  <input type="checkbox" checked={emotionalState[key]} onChange={() => handleEmotionToggle(key)} className="sr-only" />
                  <span className={`text-sm ${emotionalState[key] ? 'font-bold' : ''}`}>{label}</span>
                </label>
              ))}
            </div>
            {!emotionCheckDone && <p className={`text-xs ${c.textMuted} mt-2 font-semibold`}>⚠️ Required for accurate analysis</p>}
          </div>

          {/* Goals */}
          <div>
            <label className={`block text-sm font-medium ${c.label} mb-2`}>Goal</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[['resolve', 'Resolve the issue'], ['boundary', 'Set a boundary'], ['disengage', 'Disengage gracefully'], ['validate', 'Validate without conceding'], ['schedule_talk', 'Schedule face-to-face']].map(([key, label]) => (
                <label key={key} className={`p-2.5 rounded-lg border-2 cursor-pointer flex items-center gap-2 ${goals[key] ? isDark ? 'border-orange-500 bg-orange-900/30' : 'border-orange-600 bg-orange-100' : isDark ? 'border-zinc-700' : 'border-orange-200'}`}>
                  <input type="checkbox" checked={goals[key]} onChange={() => handleGoalToggle(key)} className="w-4 h-4" />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <p className={`text-xs text-center ${c.textMuted}`}>Need to rehearse? <a href="/DifficultTalkCoach" target="_blank" rel="noopener noreferrer" className={linkStyle}>Difficult Talk Coach</a> lets you practice.</p>

          <div className="flex gap-3">
            <button onClick={handleAnalyze} disabled={loading || !emotionCheckDone} className={`flex-1 ${c.btnPrimary} disabled:opacity-50 font-medium py-3 rounded-lg flex items-center justify-center gap-2`}>
              {loading ? <><span className="animate-spin inline-block">⏳</span> Analyzing...</> : <><span>🛡️</span> Analyze</>}
            </button>
            {results && <button onClick={handleReset} className={`px-6 py-3 border-2 ${c.btnOutline} rounded-lg`}>New</button>}
          </div>
          {error && <div className={`p-4 ${c.danger} border rounded-lg flex items-start gap-3`}><span>⚠️</span><p className="text-sm">{error}</p></div>}
        </div>
      </div>

      {/* ═══════════ RESULTS ═══════════ */}
      {results && (
        <div className="space-y-6">
          {/* Temperature */}
          {results.message_analysis && (
            <div className={`${c.card} border rounded-xl shadow-lg p-6 text-center`}>
              <div className="text-6xl mb-3">{getTemperatureEmoji(results.message_analysis.emotional_temperature)}</div>
              <div className={`text-2xl font-black ${c.text} mb-1`}>{results.message_analysis.emotional_temperature?.toUpperCase()} TEMPERATURE</div>
              <p className={`text-sm ${c.textSecondary}`}>Primary: <strong>{results.message_analysis.primary_emotion_detected}</strong></p>
              {results.message_analysis.underlying_need && <p className={`text-xs ${c.textMuted} mt-1`}>Need: {results.message_analysis.underlying_need}</p>}
            </div>
          )}

          {/* Action bar */}
          <div className="flex flex-wrap gap-2 justify-center">
            <CopyBtn content={buildFullText()} label="Copy Analysis" />
            <button onClick={handlePrint} className={`${c.btnSecondary} px-4 py-2 rounded-lg text-sm flex items-center gap-2`}><span>🖨️</span> Print</button>
          </div>

          {/* 🎭 Manipulation Detector (#2) */}
          {results.manipulation_tactics?.length > 0 && (
            <div className={`${c.manipulation} border-2 rounded-xl p-6`}>
              <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${c.text}`}><span>🎭</span> Manipulation Tactics Detected</h3>
              <p className={`text-sm mb-4 ${c.textSecondary}`}>These patterns in their message may be attempts to control the conversation:</p>
              <div className="space-y-3">
                {results.manipulation_tactics.map((t, i) => (
                  <div key={i} className={`p-4 rounded-lg ${isDark ? 'bg-purple-900/30' : 'bg-purple-50'}`}>
                    <div className="flex items-center gap-2 mb-1"><span className="text-lg">{t.icon || '🚩'}</span><h4 className={`font-bold ${c.text}`}>{t.tactic}</h4></div>
                    <p className={`text-sm mb-2 ${c.textSecondary}`}>{t.description}</p>
                    {t.example_phrase && <p className={`text-xs italic ${c.textMuted}`}>From their message: "{t.example_phrase}"</p>}
                    {t.healthy_response && <p className={`text-sm mt-2 font-semibold ${c.text}`}>💡 Healthy response: {t.healthy_response}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Goal Reality Check */}
          {results.goal_reality_check && (
            <div className={`${c.info} border-l-4 rounded-r-lg p-5`}>
              <h3 className={`font-bold mb-2 ${c.text}`}>🎯 Reality Check</h3>
              {actualGoal && <p className={`text-sm mb-2 ${c.text}`}><strong>You want:</strong> "{actualGoal}"</p>}
              <p className={`text-sm ${c.text}`}>{results.goal_reality_check.assessment}</p>
              {results.goal_reality_check.will_this_message_achieve_it !== undefined && (
                <div className={`p-3 rounded mt-2 ${results.goal_reality_check.will_this_message_achieve_it ? c.success : c.danger}`}>
                  <p className={`text-sm font-bold`}>{results.goal_reality_check.will_this_message_achieve_it ? '✅ Responses CAN help achieve this' : '❌ Messaging now UNLIKELY to achieve this'}</p>
                  {results.goal_reality_check.alternative_approach && <p className={`text-sm mt-1`}><strong>Better:</strong> {results.goal_reality_check.alternative_approach}</p>}
                </div>
              )}
            </div>
          )}

          {/* Triggers */}
          {results.message_analysis?.triggers_identified?.length > 0 && (
            <div className={`${getTemperatureColor(results.message_analysis.emotional_temperature)} border-l-4 rounded-r-lg p-5`}>
              <h3 className={`font-bold mb-3 ${c.text}`}>{getTemperatureEmoji(results.message_analysis.emotional_temperature)} Triggers</h3>
              <ul className={`text-sm space-y-1 ${c.text}`}>{results.message_analysis.triggers_identified.map((t, i) => <li key={i}>• "{t}"</li>)}</ul>
              {results.message_analysis.communication_style && <p className={`text-sm mt-2 ${c.textMuted}`}>Style: {results.message_analysis.communication_style}</p>}
            </div>
          )}

          {/* Draft Analysis */}
          {results.draft_analysis && userDraft && (
            <div className={`${c.card} border rounded-xl p-6`}>
              <h3 className={`text-lg font-bold mb-3 ${c.text}`}>🚨 Your Draft — Honest Analysis</h3>
              <p className={`text-sm mb-3 ${c.textSecondary}`}>{results.draft_analysis.overall_assessment}</p>
              {results.draft_analysis.tone_flags?.length > 0 && (
                <div className="mb-3"><p className={`text-sm font-bold mb-2 ${c.text}`}>Tone Flags:</p>{results.draft_analysis.tone_flags.map((f, i) => <div key={i} className={`p-2 rounded mb-1 ${isDark ? 'bg-amber-900/20' : 'bg-amber-50'}`}><p className="text-sm"><strong>{f.flag}</strong>: {f.why_problematic}</p></div>)}</div>
              )}
              {results.draft_analysis.escalation_risk && (
                <div className={`p-3 rounded ${results.draft_analysis.escalation_risk.level === 'high' || results.draft_analysis.escalation_risk.level === 'extreme' ? c.danger : c.warning}`}>
                  <p className="text-sm font-bold">⚠️ Escalation: {results.draft_analysis.escalation_risk.level?.toUpperCase()}</p>
                  <p className="text-sm">{results.draft_analysis.escalation_risk.why}</p>
                </div>
              )}
            </div>
          )}

          {/* Response Strategies with Tone Slider (#4) */}
          {results.response_strategies?.length > 0 && (
            <div className={`${c.card} border rounded-xl p-6`}>
              <h3 className={`text-lg font-bold ${c.text} mb-4 flex items-center gap-2`}>
                {delayActive ? <span className="text-red-500">🔒</span> : <span className="text-emerald-500">🔓</span>} Strategies
                {delayActive && <span className={`text-sm font-normal ${c.textMuted}`}>(Locked)</span>}
              </h3>
              <div className="space-y-4">{results.response_strategies.map((s, idx) => (
                <div key={idx} className={`border-2 rounded-lg p-5 ${delayActive ? 'opacity-50' : selectedStrategyIdx === idx ? isDark ? 'border-orange-500' : 'border-orange-500' : 'hover:border-orange-400'}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div><h4 className={`font-bold ${c.text}`}>{s.strategy}</h4>{s.tone && <span className={`text-xs px-2 py-0.5 rounded ${isDark ? 'bg-blue-900/30' : 'bg-blue-100'}`}>Tone: {s.tone}</span>}</div>
                    <button onClick={() => handleCopyResponse(s.response_text)} disabled={delayActive} className={`${c.btnSecondary} px-3 py-1.5 rounded text-sm disabled:opacity-50`}>{delayActive ? '🔒' : '📋'} Copy</button>
                  </div>
                  <div className={`p-3 rounded ${isDark ? 'bg-zinc-900' : 'bg-gray-50'} mb-2`}><p className={`${c.text} font-medium`}>"{s.response_text}"</p></div>
                  {s.what_this_does && <p className={`text-sm ${c.textSecondary} mb-1`}><strong>Effect:</strong> {s.what_this_does}</p>}
                  {s.risks && <p className={`text-sm ${c.textMuted}`}><strong>⚠️ Risk:</strong> {s.risks}</p>}

                  {/* Tone slider (#4) */}
                  {!delayActive && (
                    <div className="mt-3">
                      <button onClick={() => { setSelectedStrategyIdx(selectedStrategyIdx === idx ? null : idx); setAdjustedResponse(null); setToneLevel(50); }} className={`text-xs ${c.accent} hover:underline`}>
                        {selectedStrategyIdx === idx ? '▲ Hide tone slider' : '🎚️ Adjust tone'}
                      </button>
                      {selectedStrategyIdx === idx && (
                        <div className={`mt-2 p-3 rounded ${isDark ? 'bg-zinc-700' : 'bg-orange-50'}`}>
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-xs">🕊️ Gentle</span>
                            <input type="range" min="0" max="100" value={toneLevel} onChange={e => setToneLevel(parseInt(e.target.value))} className="flex-1" />
                            <span className="text-xs">💪 Firm</span>
                          </div>
                          <button onClick={handleAdjustTone} disabled={toneLoading} className={`${c.btnPrimary} px-4 py-2 rounded text-sm w-full disabled:opacity-50`}>
                            {toneLoading ? <span className="animate-spin inline-block">⏳</span> : `Regenerate at ${toneLevel}% firmness`}
                          </button>
                          {adjustedResponse && (
                            <div className="mt-2">
                              <div className={`p-3 rounded ${isDark ? 'bg-zinc-900' : 'bg-white'} border`}><p className={`text-sm ${c.text}`}>"{adjustedResponse.adjusted_text}"</p></div>
                              {adjustedResponse.tone_note && <p className={`text-xs mt-1 ${c.textMuted}`}>{adjustedResponse.tone_note}</p>}
                              <button onClick={() => handleCopyResponse(adjustedResponse.adjusted_text)} className={`${c.btnSecondary} px-3 py-1 rounded text-xs mt-2`}>📋 Copy adjusted</button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}</div>
            </div>
          )}

          {/* Apology */}
          {results.apology_assessment && (
            <div className={`${c.info} border-l-4 rounded-r-lg p-5`}>
              <h3 className={`font-bold mb-2 ${c.text}`}>🙏 Should You Apologize?</h3>
              <p className={`text-sm ${c.text}`}><strong>{results.apology_assessment.is_apology_appropriate ? 'Yes' : 'No'}</strong> — {results.apology_assessment.reasoning}</p>
              {results.apology_assessment.is_apology_appropriate && results.apology_assessment.suggested_apology && (
                <div className={`p-3 rounded mt-2 ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                  <p className={`text-sm ${c.text}`}>"{results.apology_assessment.suggested_apology}"</p>
                  <p className={`text-xs mt-1 ${c.textMuted}`}>Fine-tune → <a href="/ApologyCalibrator" target="_blank" rel="noopener noreferrer" className={linkStyle}>Apology Calibrator</a></p>
                </div>
              )}
            </div>
          )}

          {/* Enhanced Landmines (#6) */}
          {(results.what_NOT_to_say?.length > 0 || results.timing_landmines?.length > 0 || results.channel_landmines?.length > 0) && (
            <div className={`${c.danger} border-2 rounded-xl p-6`}>
              <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${c.text}`}>💣 Landmines — Avoid These</h3>
              {results.what_NOT_to_say?.length > 0 && (
                <div className="mb-4"><p className={`text-sm font-bold mb-2 ${c.text}`}>❌ Phrases:</p><div className="space-y-2">{results.what_NOT_to_say.map((it, i) => <div key={i} className={`p-3 rounded ${isDark ? 'bg-red-900/20' : 'bg-red-50'}`}><p className={`font-semibold text-sm ${c.text}`}>"{it.phrase}"</p><p className={`text-sm ${c.textSecondary}`}>{it.why_avoid}</p></div>)}</div></div>
              )}
              {results.timing_landmines?.length > 0 && (
                <div className="mb-4"><p className={`text-sm font-bold mb-2 ${c.text}`}>⏰ Timing:</p><ul className="space-y-1">{results.timing_landmines.map((t, i) => <li key={i} className={`text-sm ${c.textSecondary}`}>⏰ {t}</li>)}</ul></div>
              )}
              {results.channel_landmines?.length > 0 && (
                <div><p className={`text-sm font-bold mb-2 ${c.text}`}>📱 Channel:</p><ul className="space-y-1">{results.channel_landmines.map((ch, i) => <li key={i} className={`text-sm ${c.textSecondary}`}>📱 {ch}</li>)}</ul></div>
              )}
            </div>
          )}

          {/* Escalation */}
          {results.if_they_continue_escalating && (
            <div className={`${c.warning} border-l-4 rounded-r-lg p-5`}>
              <h3 className={`font-bold mb-2 ${c.text}`}>⚠️ If They Escalate</h3>
              <div className={`p-3 rounded ${isDark ? 'bg-zinc-900' : 'bg-white'} border-2 mb-2`}><p className={`${c.text} font-medium`}>"{results.if_they_continue_escalating.script}"</p></div>
              <p className={`text-sm font-bold ${c.text}`}>{results.if_they_continue_escalating.then_what}</p>
            </div>
          )}

          {/* Repair */}
          {results.repair_strategy_later && (
            <div className={`${c.success} border-l-4 rounded-r-lg p-5`}>
              <h3 className={`font-bold mb-1 ${c.text}`}>💚 Repair (Later)</h3>
              <p className={`text-sm ${c.text}`}>{results.repair_strategy_later}</p>
            </div>
          )}

          {/* Follow-up Q&A (#3) */}
          <div className={`${c.card} border rounded-xl p-5`}>
            <h3 className={`font-bold mb-3 ${c.text}`}>💬 Follow-up Coaching</h3>
            <p className={`text-xs mb-3 ${c.textMuted}`}>"They responded with X, now what?" or "What if they bring up Y?"</p>
            {followupHistory.length > 0 && <div className="space-y-3 mb-4">{followupHistory.map((f, i) => <div key={i} className="space-y-1"><div className={`p-3 rounded ${isDark ? 'bg-orange-900/20' : 'bg-orange-50'}`}><p className={`text-xs font-semibold ${c.accent}`}>You:</p><p className={`text-sm ${c.text}`}>{f.question}</p></div><div className={`p-3 rounded ${isDark ? 'bg-zinc-700' : 'bg-gray-50'}`}><p className={`text-sm ${c.textSecondary}`}>{f.answer}</p></div></div>)}</div>}
            <div className="flex gap-2" ref={followupRef}>
              <input type="text" value={followupQuestion} onChange={e => setFollowupQuestion(e.target.value)} placeholder="They said this back..." className={`flex-1 p-3 border rounded-lg ${c.input}`} onKeyDown={e => { if (e.key === 'Enter') handleFollowup(); }} />
              <button onClick={handleFollowup} disabled={followupLoading || !followupQuestion.trim()} className={`${c.btnPrimary} px-4 py-2 rounded disabled:opacity-50`}>{followupLoading ? <span className="animate-spin inline-block">⏳</span> : '➤'}</button>
            </div>
          </div>

          {/* Cross-refs */}
          <div className="text-center space-y-1">
            <p className={`text-xs ${c.textMuted}`}>Firm response → <a href="/VelvetHammer" target="_blank" rel="noopener noreferrer" className={linkStyle}>Velvet Hammer</a></p>
            {results.apology_assessment?.is_apology_appropriate && <p className={`text-xs ${c.textMuted}`}>Calibrate apology → <a href="/ApologyCalibrator" target="_blank" rel="noopener noreferrer" className={linkStyle}>Apology Calibrator</a></p>}
            {results.message_analysis?.emotional_temperature === 'high' && <p className={`text-xs ${c.textMuted}`}>Spiraling? → <a href="/SpiralStopper" target="_blank" rel="noopener noreferrer" className={linkStyle}>Spiral Stopper</a></p>}
          </div>
        </div>
      )}

      {/* Confirm Send Modal */}
      {showConfirmSend && selectedResponse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowConfirmSend(false)}>
          <div className={`${c.card} border-4 border-orange-500 rounded-xl p-6 max-w-md w-full`} onClick={e => e.stopPropagation()}>
            <h3 className={`text-lg font-bold mb-4 ${c.text}`}>⚠️ Are You Sure?</h3>
            <ul className={`text-sm space-y-1 mb-4 ${c.text}`}><li>• Have I cooled down?</li><li>• Will this help or hurt?</li><li>• Am I responding or reacting?</li><li>• Would I say this face-to-face?</li></ul>
            <div className={`p-3 rounded ${isDark ? 'bg-zinc-900' : 'bg-gray-50'} mb-4`}><p className={`text-sm ${c.text}`}>"{selectedResponse}"</p></div>
            <div className="flex gap-3">
              <button onClick={handleConfirmCopy} className={`flex-1 ${c.btnPrimary} py-3 rounded font-semibold`}>Yes, Copy</button>
              <button onClick={() => { setShowConfirmSend(false); setSelectedResponse(null); }} className={`flex-1 ${c.btnSecondary} py-3 rounded`}>Wait, Think More</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConflictCoach;
