import React, { useState, useEffect } from 'react';
import { MessageSquare, AlertTriangle, Shield, ThumbsUp, Loader2, Copy, Clock, Eye, EyeOff, Send, Pause, CheckCircle, XCircle, Heart, Lock, Unlock, Target, AlertOctagon, TrendingUp, Lightbulb, RefreshCw } from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';

const ConflictTextCoach = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Form state
  const [receivedMessage, setReceivedMessage] = useState('');
  const [relationship, setRelationship] = useState('Friend');
  const [emotionalState, setEmotionalState] = useState({
    angry: false,
    hurt: false,
    defensive: false,
    frustrated: false,
    calm: false,
    confused: false
  });
  const [goals, setGoals] = useState({
    resolve: false,
    boundary: false,
    disengage: false,
    validate: false,
    schedule_talk: false
  });
  const [userDraft, setUserDraft] = useState('');
  const [showDraft, setShowDraft] = useState(true); // Default to visible now

  // Results state
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [copiedIndex, setCopiedIndex] = useState(null);

  // V2 Enhancement state
  const [mandatoryDelay, setMandatoryDelay] = useState(false);
  const [delaySeconds, setDelaySeconds] = useState(600); // 10 minutes
  const [delayActive, setDelayActive] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [showGoalClarification, setShowGoalClarification] = useState(false);
  const [actualGoal, setActualGoal] = useState('');
  const [emotionCheckDone, setEmotionCheckDone] = useState(false);
  const [showConfirmSend, setShowConfirmSend] = useState(false);

  const relationshipOptions = [
    'Partner',
    'Family',
    'Friend',
    'Coworker',
    'Ex',
    'Customer',
    'Other'
  ];

  // Theme-aware colors
  const c = {
    bg: isDark ? 'bg-zinc-900' : 'bg-gradient-to-br from-yellow-50 to-orange-50',
    card: isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-orange-200',
    cardAlt: isDark ? 'bg-zinc-700 border-zinc-600' : 'bg-yellow-50 border-yellow-200',
    
    input: isDark 
      ? 'bg-zinc-900 border-zinc-700 text-zinc-50 placeholder:text-zinc-500 focus:border-orange-500 focus:ring-orange-500/20'
      : 'bg-white border-orange-300 text-orange-900 placeholder:text-orange-400 focus:border-orange-600 focus:ring-orange-100',
    
    text: isDark ? 'text-zinc-50' : 'text-orange-900',
    textSecondary: isDark ? 'text-zinc-300' : 'text-orange-700',  // Lighter for better contrast
    textMuted: isDark ? 'text-zinc-400' : 'text-orange-600',      // Lighter for better contrast
    label: isDark ? 'text-zinc-200' : 'text-orange-800',          // Lighter for better contrast
    
    accent: isDark ? 'text-orange-400' : 'text-orange-600',
    
    btnPrimary: isDark
      ? 'bg-orange-600 hover:bg-orange-700 text-white'
      : 'bg-orange-600 hover:bg-orange-700 text-white',
    btnSecondary: isDark
      ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-50'
      : 'bg-orange-100 hover:bg-orange-200 text-orange-900',
    btnOutline: isDark
      ? 'border-zinc-600 hover:border-zinc-500 text-zinc-200'  // Lighter text
      : 'border-orange-300 hover:border-orange-400 text-orange-700',
    
    warning: isDark
      ? 'bg-amber-900/20 border-amber-700 text-amber-200'
      : 'bg-amber-50 border-amber-300 text-amber-800',
    danger: isDark
      ? 'bg-red-900/20 border-red-700 text-red-200'
      : 'bg-red-50 border-red-300 text-red-800',
    success: isDark
      ? 'bg-emerald-900/20 border-emerald-700 text-emerald-200'
      : 'bg-emerald-50 border-emerald-300 text-emerald-800',
    info: isDark
      ? 'bg-blue-900/20 border-blue-700 text-blue-200'
      : 'bg-blue-50 border-blue-200 text-blue-900',
  };

  // Delay timer effect
  useEffect(() => {
    let interval;
    if (delayActive && delaySeconds > 0) {
      interval = setInterval(() => {
        setDelaySeconds(prev => {
          if (prev <= 1) {
            setDelayActive(false);
            alert('⏰ Cooling period complete. You may now send your response if you still choose to.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [delayActive, delaySeconds]);

  const handleAnalyze = async () => {
    if (!receivedMessage.trim() || receivedMessage.trim().length < 10) {
      setError('Please paste the message you received (at least 10 characters)');
      return;
    }

    // V2: Show goal clarification first
    if (!showGoalClarification && !actualGoal) {
      setShowGoalClarification(true);
      setError('Before analyzing, please clarify: What outcome do you actually want from this conversation?');
      return;
    }

    setError('');
    setResults(null);

    try {
      const selectedEmotions = Object.keys(emotionalState).filter(key => emotionalState[key]);
      const selectedGoals = Object.keys(goals).filter(key => goals[key]);
      
      const data = await callToolEndpoint('conflict-text-coach', {
        receivedMessage: receivedMessage.trim(),
        relationship,
        emotionalState: selectedEmotions,
        goals: selectedGoals,
        userDraft: userDraft.trim(),
        actualGoal: actualGoal.trim()
      });
      setResults(data);
      
      // V2: Start mandatory delay if high emotion detected
      if (data.message_analysis?.emotional_temperature === 'high' || 
          selectedEmotions.includes('angry') || 
          selectedEmotions.includes('defensive')) {
        setMandatoryDelay(true);
        if (!delayActive) {
          handleStartDelay();
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to analyze message. Please try again.');
    }
  };

  const handleEmotionToggle = (emotion) => {
    setEmotionalState({
      ...emotionalState,
      [emotion]: !emotionalState[emotion]
    });
    setEmotionCheckDone(true);
  };

  const handleGoalToggle = (goal) => {
    setGoals({
      ...goals,
      [goal]: !goals[goal]
    });
  };

  const handleCopyResponse = async (text, index) => {
    // V2: Show confirmation before allowing copy
    if ((mandatoryDelay && delayActive) || !emotionCheckDone) {
      alert('⏸️ Please wait for the cooling period to complete and check your current emotions before copying a response.');
      return;
    }

    setSelectedResponse(text);
    setShowConfirmSend(true);
  };

  const handleConfirmCopy = async () => {
    if (!selectedResponse) return;
    
    try {
      await navigator.clipboard.writeText(selectedResponse);
      setShowConfirmSend(false);
      alert('✅ Response copied. Remember to breathe before you send it.');
      setSelectedResponse(null);
    } catch (err) {
      alert('Failed to copy. Please select and copy manually.');
    }
  };

  const handleStartDelay = () => {
    setDelaySeconds(600); // 10 minutes
    setDelayActive(true);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTemperatureColor = (temp) => {
    switch(temp?.toLowerCase()) {
      case 'high':
        return isDark ? 'bg-red-900/30 border-red-700 text-red-200' : 'bg-red-100 border-red-400 text-red-800';
      case 'medium':
        return isDark ? 'bg-amber-900/30 border-amber-700 text-amber-200' : 'bg-amber-100 border-amber-400 text-amber-800';
      case 'low':
        return isDark ? 'bg-emerald-900/30 border-emerald-700 text-emerald-200' : 'bg-emerald-100 border-emerald-400 text-emerald-800';
      default:
        return c.info;
    }
  };

  const getTemperatureIcon = (temp) => {
    switch(temp?.toLowerCase()) {
      case 'high':
        return '🌡️🔥';
      case 'medium':
        return '🌡️⚠️';
      case 'low':
        return '🌡️✅';
      default:
        return '🌡️';
    }
  };

  const handleReset = () => {
    setReceivedMessage('');
    setRelationship('Friend');
    setEmotionalState({
      angry: false,
      hurt: false,
      defensive: false,
      frustrated: false,
      calm: false,
      confused: false
    });
    setGoals({
      resolve: false,
      boundary: false,
      disengage: false,
      validate: false,
      schedule_talk: false
    });
    setUserDraft('');
    setResults(null);
    setError('');
    setMandatoryDelay(false);
    setDelayActive(false);
    setDelaySeconds(600);
    setSelectedResponse(null);
    setShowGoalClarification(false);
    setActualGoal('');
    setEmotionCheckDone(false);
    setShowConfirmSend(false);
  };

  const exampleMessage = "I can't believe you did that again. You never think about how your actions affect me. This is exactly why we have problems. I'm so sick of this.";

  return (
    <div className="space-y-6">
      
      {/* Warning Banner */}
      <div className={`${c.warning} border-l-4 rounded-r-lg p-5 transition-colors duration-200`}>
        <div className="flex items-start gap-3">
          <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDark ? 'text-amber-300' : 'text-amber-600'}`} />
          <div>
            <h3 className={`font-bold mb-1 ${c.text}`}>Conflict Text Coach V2 - Enhanced</h3>
            <p className={`text-sm ${c.textSecondary} mb-2`}>
              Before you send that angry text... STOP. V2 includes mandatory cooling periods, 
              deep draft analysis, and goal clarification. Built to prevent reactive texting you'll regret.
            </p>
            <p className={`text-xs ${c.textMuted}`}>
              ⚠️ NOT a replacement for therapy. For abusive situations, seek professional help immediately.
            </p>
          </div>
        </div>
      </div>

      {/* Mandatory Delay Notice */}
      {delayActive && (
        <div className={`${c.danger} border-4 rounded-xl p-6 text-center transition-colors duration-200 animate-pulse`}>
          <Lock className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
          <h3 className={`text-2xl font-bold mb-2 ${c.text}`}>🛑 Mandatory Cooling Period Active</h3>
          <div className={`text-5xl font-mono font-bold mb-3 ${c.text}`}>
            {formatTime(delaySeconds)}
          </div>
          <p className={`text-sm mb-4 ${c.text}`}>
            High emotions detected. Response options are locked for 10 minutes. 
            Use this time to breathe, reflect, and make sure you really want to send something.
          </p>
          <p className={`text-xs ${c.textMuted}`}>
            This delay can save relationships. Trust the process.
          </p>
        </div>
      )}

      {/* Goal Clarification Modal */}
      {showGoalClarification && !actualGoal && (
        <div className={`${c.info} border-4 rounded-xl p-6 transition-colors duration-200`}>
          <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${c.text}`}>
            <Target className="w-6 h-6" />
            Before We Analyze: What Do You Actually Want?
          </h3>
          
          <div className="space-y-3 mb-4">
            <p className={`text-sm ${c.textSecondary}`}>
              Be honest with yourself. What's the real outcome you're hoping for?
            </p>
            
            <div className={`space-y-2 text-sm ${c.text}`}>
              <p><strong>Examples of real goals:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>"I want them to understand how their words hurt me"</li>
                <li>"I want to set a boundary about this behavior"</li>
                <li>"I want to preserve the relationship while addressing this"</li>
                <li>"I want to end this conversation without burning bridges"</li>
                <li>"I honestly just want to vent and be heard"</li>
              </ul>
            </div>
          </div>

          <textarea
            value={actualGoal}
            onChange={(e) => setActualGoal(e.target.value)}
            placeholder="What outcome do you actually want from this conversation?"
            className={`w-full p-4 border rounded-lg ${c.input} outline-none focus:ring-2 mb-3`}
            rows={3}
          />

          <button
            onClick={() => setShowGoalClarification(false)}
            disabled={!actualGoal.trim()}
            className={`w-full ${c.btnPrimary} py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Continue with This Goal
          </button>
        </div>
      )}

      {/* Input Form */}
      <div className={`${c.card} border rounded-xl shadow-lg p-6 transition-colors duration-200`}>
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className={`p-3 rounded-lg ${isDark ? 'bg-orange-900/30' : 'bg-orange-100'}`}>
            <MessageSquare className={`w-6 h-6 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
          </div>
          <div>
            <h2 className={`text-xl font-bold ${c.text}`}>What Message Did You Receive?</h2>
            <p className={`text-sm ${c.textMuted}`}>And what were you thinking of saying back?</p>
          </div>
        </div>

        <div className="space-y-6">
          
          {/* Received Message */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="received" className={`block text-sm font-medium ${c.label}`}>
                The message you received
              </label>
              <button
                onClick={() => setReceivedMessage(exampleMessage)}
                className={`text-xs ${c.accent} hover:underline`}
              >
                Try example
              </button>
            </div>
            <textarea
              id="received"
              value={receivedMessage}
              onChange={(e) => setReceivedMessage(e.target.value)}
              placeholder="Paste the tense/upsetting message..."
              className={`w-full p-4 border rounded-lg ${c.input} outline-none focus:ring-2 transition-colors duration-200`}
              rows={4}
            />
          </div>

          {/* V2: User's Draft - Now Prominent */}
          <div className={`border-2 rounded-lg p-4 ${isDark ? 'border-red-700 bg-red-900/20' : 'border-red-300 bg-red-50'}`}>
            <div className="flex items-center gap-2 mb-2">
              <AlertOctagon className={`w-5 h-5 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
              <label htmlFor="draft" className={`text-sm font-bold ${c.label}`}>
                What you're tempted to say back (CRITICAL - we need to analyze this!)
              </label>
            </div>
            <textarea
              id="draft"
              value={userDraft}
              onChange={(e) => setUserDraft(e.target.value)}
              placeholder="Your reactive response... (be honest - this helps us prevent escalation)"
              className={`w-full p-4 border rounded-lg ${c.input} outline-none focus:ring-2 transition-colors duration-200`}
              rows={3}
            />
            <p className={`text-xs ${c.textMuted} mt-2`}>
              ⚠️ This is where we catch escalation BEFORE it happens. Be brutally honest here.
            </p>
          </div>

          {/* Relationship */}
          <div>
            <label htmlFor="relationship" className={`block text-sm font-medium ${c.label} mb-2`}>
              Your relationship to sender
            </label>
            <select
              id="relationship"
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              className={`w-full p-3 border rounded-lg ${c.input} outline-none focus:ring-2`}
            >
              {relationshipOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          {/* V2: Emotion Check (More Prominent) */}
          <div className={`border-2 rounded-lg p-4 ${!emotionCheckDone ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' : ''}`}>
            <label className={`block text-sm font-bold ${c.label} mb-3`}>
              How are you feeling RIGHT NOW? (Be honest - this determines cooling time)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { key: 'angry', label: '😠 Angry', color: 'red' },
                { key: 'hurt', label: '💔 Hurt', color: 'blue' },
                { key: 'defensive', label: '🛡️ Defensive', color: 'orange' },
                { key: 'frustrated', label: '😤 Frustrated', color: 'amber' },
                { key: 'calm', label: '😌 Calm', color: 'green' },
                { key: 'confused', label: '😕 Confused', color: 'purple' }
              ].map(({ key, label, color }) => (
                <label
                  key={key}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                    emotionalState[key]
                      ? `border-${color}-500 bg-${color}-100 dark:bg-${color}-900/30`
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={emotionalState[key]}
                    onChange={() => handleEmotionToggle(key)}
                    className="sr-only"
                  />
                  <span className={`text-sm ${emotionalState[key] ? 'font-bold' : ''}`}>
                    {label}
                  </span>
                </label>
              ))}
            </div>
            {!emotionCheckDone && (
              <p className={`text-xs ${c.textMuted} mt-2 font-semibold`}>
                ⚠️ Checking your emotions is required for accurate analysis
              </p>
            )}
          </div>

          {/* Goals */}
          <div>
            <label className={`block text-sm font-medium ${c.label} mb-3`}>
              What do you want to achieve?
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { key: 'resolve', label: 'Resolve the issue' },
                { key: 'boundary', label: 'Set a boundary' },
                { key: 'disengage', label: 'Disengage gracefully' },
                { key: 'validate', label: 'Validate without conceding' },
                { key: 'schedule_talk', label: 'Schedule face-to-face' }
              ].map(({ key, label }) => (
                <label
                  key={key}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 flex items-center gap-2 ${
                    goals[key]
                      ? isDark ? 'border-orange-500 bg-orange-900/30' : 'border-orange-600 bg-orange-100'
                      : isDark ? 'border-zinc-700 hover:border-zinc-600' : 'border-orange-200 hover:border-orange-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={goals[key]}
                    onChange={() => handleGoalToggle(key)}
                    className="w-4 h-4 rounded text-orange-600"
                  />
                  <span className={`text-sm ${goals[key] ? 'font-semibold' : ''}`}>
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Analyze Button */}
          <div className="flex gap-3">
            <button
              onClick={handleAnalyze}
              disabled={loading || !emotionCheckDone}
              className={`flex-1 ${c.btnPrimary} disabled:opacity-50 disabled:cursor-not-allowed font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  Analyze & Get Thoughtful Responses
                </>
              )}
            </button>

            {results && (
              <button
                onClick={handleReset}
                className={`px-6 py-3 border-2 ${c.btnOutline} font-medium rounded-lg`}
              >
                New Message
              </button>
            )}
          </div>

          {error && (
            <div className={`p-4 ${c.danger} border rounded-lg flex items-start gap-3`} role="alert">
              <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5`} />
              <p className={`text-sm ${c.text}`}>{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Results Display */}
      {results && (
        <div className="space-y-6">
          
          {/* V2: Goal Reality Check */}
          {results.goal_reality_check && (
            <div className={`${c.info} border-l-4 rounded-r-lg p-5`}>
              <h3 className={`font-bold mb-3 flex items-center gap-2`}>
                <Lightbulb className="w-5 h-5" />
                Reality Check: Your Goal
              </h3>
              <p className={`text-sm mb-2`}><strong>You said you want:</strong> "{actualGoal}"</p>
              <p className={`text-sm mb-2`}><strong>Assessment:</strong> {results.goal_reality_check.assessment}</p>
              {results.goal_reality_check.will_this_message_achieve_it !== undefined && (
                <div className={`p-3 rounded mt-2 ${
                  results.goal_reality_check.will_this_message_achieve_it 
                    ? c.success 
                    : c.danger
                }`}>
                  <p className={`text-sm font-bold ${c.text}`}>
                    {results.goal_reality_check.will_this_message_achieve_it 
                      ? '✅ The suggested responses CAN help achieve this goal'
                      : '❌ WARNING: Sending a message right now is UNLIKELY to achieve this goal'
                    }
                  </p>
                  {results.goal_reality_check.alternative_approach && (
                    <p className={`text-sm mt-2 ${c.text}`}>
                      <strong>Better approach:</strong> {results.goal_reality_check.alternative_approach}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Message Analysis */}
          {results.message_analysis && (
            <div className={`${getTemperatureColor(results.message_analysis.emotional_temperature)} border-l-4 rounded-r-lg p-6`}>
              <h3 className={`text-xl font-bold mb-4 flex items-center gap-2 ${c.text}`}>
                {getTemperatureIcon(results.message_analysis.emotional_temperature)} Message Analysis
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className={`text-sm font-semibold mb-1 ${c.label}`}>Emotional Temperature:</div>
                  <div className={`text-2xl font-bold capitalize ${c.text}`}>{results.message_analysis.emotional_temperature}</div>
                </div>
                <div>
                  <div className={`text-sm font-semibold mb-1 ${c.label}`}>Primary Emotion:</div>
                  <div className={`text-xl font-semibold capitalize ${c.text}`}>{results.message_analysis.primary_emotion_detected}</div>
                </div>
              </div>

              {results.message_analysis.triggers_identified && results.message_analysis.triggers_identified.length > 0 && (
                <div className="mt-4">
                  <div className={`text-sm font-semibold mb-2 ${c.label}`}>Triggers Identified:</div>
                  <ul className={`text-sm space-y-1 ${c.text}`}>
                    {results.message_analysis.triggers_identified.map((trigger, idx) => (
                      <li key={idx}>• "{trigger}"</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* V2: ENHANCED Draft Analysis */}
          {userDraft && results.draft_analysis && (
            <div className={`${c.danger} border-4 rounded-xl p-6`}>
              <h3 className={`text-xl font-bold mb-4 flex items-center gap-2`}>
                <AlertOctagon className="w-6 h-6" />
                🚨 Analysis of What You Were Going to Send
              </h3>

              {results.draft_analysis.tone_flags && results.draft_analysis.tone_flags.length > 0 && (
                <div className="mb-4">
                  <p className={`text-sm font-bold mb-2 ${c.text}`}>Tone Flags Detected:</p>
                  <div className="space-y-2">
                    {results.draft_analysis.tone_flags.map((flag, idx) => (
                      <div key={idx} className={`p-3 rounded ${isDark ? 'bg-red-900/30 text-red-100' : 'bg-red-100 text-red-900'}`}>
                        <div className="font-semibold text-sm">{flag.flag}</div>
                        <div className="text-sm mt-1">{flag.why_problematic}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results.draft_analysis.problematic_phrases && results.draft_analysis.problematic_phrases.length > 0 && (
                <div className="mb-4">
                  <p className={`text-sm font-bold mb-2 ${c.text}`}>⚠️ Problematic Phrases:</p>
                  <div className="space-y-2">
                    {results.draft_analysis.problematic_phrases.map((item, idx) => (
                      <div key={idx} className={`p-3 rounded ${isDark ? 'bg-red-900/40 text-red-100' : 'bg-red-200 text-red-900'}`}>
                        <div className="font-mono text-sm mb-1">❌ "{item.phrase}"</div>
                        <div className="text-sm mb-1">Problem: {item.issue}</div>
                        <div className="text-sm font-semibold">✅ Better: "{item.better_version}"</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results.draft_analysis.escalation_risk && (
                <div className={`p-4 rounded ${isDark ? 'bg-red-900/50' : 'bg-red-200'} border-2 border-red-500`}>
                  <p className="font-bold text-lg mb-2">
                    ⚠️ Escalation Risk: {results.draft_analysis.escalation_risk.level.toUpperCase()}
                  </p>
                  <p className={`text-sm ${c.text}`}>{results.draft_analysis.escalation_risk.why}</p>
                </div>
              )}

              <div className={`mt-4 p-4 rounded ${isDark ? 'bg-zinc-900' : 'bg-white'} border-2`}>
                <p className={`text-sm font-bold mb-2 ${c.text}`}>Overall Assessment:</p>
                <p className={`text-sm ${c.text}`}>{results.draft_analysis.overall_assessment}</p>
              </div>
            </div>
          )}

          {/* Pause Prompts */}
          {results.if_youre_about_to_send_something && (
            <div className={`${c.warning} border-2 rounded-xl p-6`}>
              <h3 className={`text-lg font-bold mb-3 flex items-center gap-2`}>
                <Pause className="w-6 h-6" />
                {results.if_youre_about_to_send_something.pause_prompt}
              </h3>

              {results.if_youre_about_to_send_something.reflection_questions && (
                <div className="mb-4">
                  <p className={`text-sm font-semibold mb-2 ${c.text}`}>Ask yourself:</p>
                  <ul className={`text-sm space-y-2 ${c.text}`}>
                    {results.if_youre_about_to_send_something.reflection_questions.map((q, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span>•</span>
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {!delayActive && results.if_youre_about_to_send_something.cooling_off_time && (
                <button
                  onClick={handleStartDelay}
                  className={`${c.btnPrimary} px-6 py-3 rounded flex items-center gap-2`}
                >
                  <Lock className="w-5 h-5" />
                  Start 10-Minute Mandatory Delay
                </button>
              )}
            </div>
          )}

          {/* Response Strategies */}
          {results.response_strategies && results.response_strategies.length > 0 && (
            <div className={`${c.card} border rounded-xl p-6`}>
              <h3 className={`text-lg font-bold ${c.text} mb-4 flex items-center gap-2`}>
                {delayActive && <Lock className="w-6 h-6 text-red-500" />}
                {!delayActive && <Unlock className="w-6 h-6 text-emerald-500" />}
                Suggested Response Strategies
                {delayActive && <span className={`text-sm font-normal ml-2 ${c.textMuted}`}>(Locked until cooling period ends)</span>}
              </h3>
              
              <div className="space-y-4">
                {results.response_strategies.map((strategy, idx) => (
                  <div
                    key={idx}
                    className={`border-2 rounded-lg p-5 ${
                      delayActive 
                        ? 'opacity-50 cursor-not-allowed'
                        : 'cursor-pointer hover:border-orange-500'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className={`font-bold text-lg ${c.text} mb-1`}>{strategy.strategy}</h4>
                        {strategy.tone && (
                          <span className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                            Tone: {strategy.tone}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleCopyResponse(strategy.response_text, idx)}
                        disabled={delayActive}
                        className={`${c.btnSecondary} px-3 py-2 rounded flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {delayActive ? (
                          <>
                            <Lock className="w-4 h-4" />
                            Locked
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>

                    <div className={`p-4 rounded-lg ${isDark ? 'bg-zinc-900' : 'bg-gray-50'} mb-3`}>
                      <p className={`${c.text} font-medium`}>"{strategy.response_text}"</p>
                    </div>

                    {strategy.what_this_does && (
                      <div className={`text-sm mb-2 ${c.text}`}>
                        <strong>What this does:</strong> {strategy.what_this_does}
                      </div>
                    )}

                    {strategy.risks && (
                      <div className={`p-2 rounded ${isDark ? 'bg-amber-900/20 text-amber-200' : 'bg-amber-50 text-amber-900'} text-sm`}>
                        <strong>⚠️ Risk:</strong> {strategy.risks}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* V2: Apology Appropriateness */}
          {results.apology_assessment && (
            <div className={`${c.info} border-l-4 rounded-r-lg p-5`}>
              <h3 className={`font-bold mb-3 ${c.text}`}>🙏 Should You Apologize?</h3>
              <p className={`text-sm mb-2 ${c.text}`}>
                <strong>Assessment:</strong> {results.apology_assessment.is_apology_appropriate ? 'Yes' : 'No'}
              </p>
              <p className={`text-sm mb-3 ${c.text}`}>{results.apology_assessment.reasoning}</p>
              {results.apology_assessment.is_apology_appropriate && (
                <div className={`p-3 rounded ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                  <p className={`text-sm font-semibold mb-1 ${c.text}`}>💡 Suggested Apology:</p>
                  <p className={`text-sm ${c.text}`}>"{results.apology_assessment.suggested_apology}"</p>
                  <p className={`text-xs mt-2 ${c.textMuted}`}>
                    For a calibrated apology, use our Apology Calibrator tool
                  </p>
                </div>
              )}
            </div>
          )}

          {/* What NOT to Say */}
          {results.what_NOT_to_say && results.what_NOT_to_say.length > 0 && (
            <div className={`${c.danger} border-l-4 rounded-r-lg p-5`}>
              <h3 className={`font-bold mb-3 flex items-center gap-2`}>
                <XCircle className="w-5 h-5" />
                What NOT to Say
              </h3>
              <div className="space-y-2">
                {results.what_NOT_to_say.map((item, idx) => (
                  <div key={idx} className={`p-3 rounded ${isDark ? 'bg-red-900/20' : 'bg-red-50'}`}>
                    <div className={`font-semibold text-sm ${c.text}`}>❌ "{item.phrase}"</div>
                    <div className={`text-sm ${c.textSecondary}`}>{item.why_avoid}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Escalation Response */}
          {results.if_they_continue_escalating && (
            <div className={`${c.warning} border-l-4 rounded-r-lg p-5`}>
              <h3 className={`font-bold mb-3 ${c.text}`}>⚠️ If They Continue Escalating</h3>
              <div className={`p-4 rounded ${isDark ? 'bg-zinc-900' : 'bg-white'} border-2 mb-3`}>
                <p className={`${c.text} font-medium`}>"{results.if_they_continue_escalating.script}"</p>
              </div>
              <p className={`text-sm font-bold ${c.text}`}>{results.if_they_continue_escalating.then_what}</p>
            </div>
          )}

          {/* Repair Strategy */}
          {results.repair_strategy_later && (
            <div className={`${c.success} border-l-4 rounded-r-lg p-5`}>
              <h3 className={`font-bold mb-2 flex items-center gap-2 ${c.text}`}>
                <Heart className="w-5 h-5" />
                Repair Strategy (Later)
              </h3>
              <p className={`text-sm ${c.text}`}>{results.repair_strategy_later}</p>
            </div>
          )}
        </div>
      )}

      {/* Confirm Send Modal */}
      {showConfirmSend && selectedResponse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowConfirmSend(false)}>
          <div className={`${c.card} border-4 border-orange-500 rounded-xl p-6 max-w-md w-full`} onClick={(e) => e.stopPropagation()}>
            <h3 className={`text-lg font-bold mb-4 ${c.text}`}>⚠️ Are You Sure?</h3>
            
            <div className={`space-y-3 mb-4 text-sm ${c.text}`}>
              <p>Before you send this, ask yourself:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Have I cooled down enough?</li>
                <li>Will this help or hurt the situation?</li>
                <li>Am I responding or reacting?</li>
                <li>Would I say this to their face?</li>
              </ul>
            </div>

            <div className={`p-3 rounded ${isDark ? 'bg-zinc-900' : 'bg-gray-50'} mb-4`}>
              <p className={`text-sm font-mono ${c.text}`}>"{selectedResponse}"</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleConfirmCopy}
                className={`flex-1 ${c.btnPrimary} py-3 rounded font-semibold`}
              >
                Yes, Copy This Response
              </button>
              <button
                onClick={() => {
                  setShowConfirmSend(false);
                  setSelectedResponse(null);
                }}
                className={`flex-1 ${c.btnSecondary} py-3 rounded`}
              >
                Wait, Let Me Think More
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConflictTextCoach;
