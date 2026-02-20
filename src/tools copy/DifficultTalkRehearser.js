import React, { useState } from 'react';
import { MessageSquare, Shield, Users, AlertTriangle, Loader2, Copy, CheckCircle, Play, Volume2, Download, RefreshCw, ChevronDown, ChevronUp, Heart, Zap, Target, BookOpen } from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';

const DifficultTalkRehearser = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Theme-aware colors
  const c = {
    bg: isDark ? 'bg-zinc-900' : 'bg-gradient-to-br from-red-50 to-orange-50',
    card: isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-red-200',
    cardAlt: isDark ? 'bg-zinc-700 border-zinc-600' : 'bg-red-50 border-red-200',
    
    input: isDark
      ? 'bg-zinc-900 border-zinc-700 text-zinc-50 placeholder:text-zinc-500 focus:border-red-500 focus:ring-red-500/20'
      : 'bg-white border-red-300 text-red-900 placeholder:text-red-400 focus:border-red-600 focus:ring-red-100',
    
    text: isDark ? 'text-zinc-50' : 'text-red-900',
    textSecondary: isDark ? 'text-zinc-300' : 'text-red-700',
    textMuted: isDark ? 'text-zinc-400' : 'text-red-600',
    label: isDark ? 'text-zinc-200' : 'text-red-800',
    
    btnPrimary: isDark
      ? 'bg-red-600 hover:bg-red-700 text-white'
      : 'bg-red-600 hover:bg-red-700 text-white',
    btnSecondary: isDark
      ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-50'
      : 'bg-red-100 hover:bg-red-200 text-red-900',
    
    success: isDark
      ? 'bg-green-900/20 border-green-700 text-green-200'
      : 'bg-green-50 border-green-300 text-green-800',
    warning: isDark
      ? 'bg-amber-900/20 border-amber-700 text-amber-200'
      : 'bg-amber-50 border-amber-300 text-amber-800',
    error: isDark
      ? 'bg-red-900/20 border-red-700 text-red-200'
      : 'bg-red-50 border-red-200 text-red-800',
    info: isDark
      ? 'bg-blue-900/20 border-blue-700 text-blue-200'
      : 'bg-blue-50 border-blue-200 text-blue-900',
  };

  // Form state
  const [topic, setTopic] = useState('');
  const [relationship, setRelationship] = useState('Friend');
  const [communicationStyle, setCommunicationStyle] = useState('Direct');
  const [resistanceLevel, setResistanceLevel] = useState(50);
  const [goals, setGoals] = useState({
    setBoundary: false,
    requestChange: false,
    addressConflict: false,
    giveFeedback: false,
    askForSomething: false,
  });
  
  // New: Post-conversation features
  const [showDebrief, setShowDebrief] = useState(false);
  const [conversationHappened, setConversationHappened] = useState(false);
  const [howItWent, setHowItWent] = useState('');
  const [recordingFile, setRecordingFile] = useState(null);

  // Results state
  const [results, setResults] = useState(null);
  const [debriefResults, setDebriefResults] = useState(null);
  const [error, setError] = useState('');
  const [copiedItem, setCopiedItem] = useState(null);
  const [expandedApproach, setExpandedApproach] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    preparation: false,
    emotional: true,
    followUp: false,
    deescalation: false,
    bodyLanguage: false,
    postConversation: false,
  });

  const relationships = ['Partner', 'Family', 'Friend', 'Boss', 'Coworker', 'Employee', 'Other'];
  const styles = ['Direct', 'Indirect', 'Collaborative', 'Assertive'];
  
  const conversationGoals = [
    { key: 'setBoundary', label: 'Set a boundary' },
    { key: 'requestChange', label: 'Request a change' },
    { key: 'addressConflict', label: 'Address a conflict' },
    { key: 'giveFeedback', label: 'Give feedback' },
    { key: 'askForSomething', label: 'Ask for something' },
  ];

  const handleGoalToggle = (goal) => {
    setGoals(prev => ({
      ...prev,
      [goal]: !prev[goal]
    }));
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError('Please describe what you need to discuss');
      return;
    }

    const selectedGoals = Object.keys(goals).filter(key => goals[key]);
    if (selectedGoals.length === 0) {
      setError('Please select at least one conversation goal');
      return;
    }

    setError('');
    setResults(null);

    try {
      const data = await callToolEndpoint('difficult-talk-rehearser', {
        topic: topic.trim(),
        relationship,
        communicationStyle,
        resistanceLevel,
        goals: selectedGoals,
        includeEnhancements: true, // Request new features
      });
      
      setResults(data);
      // Auto-expand first approach and key sections
      if (data.conversation_approaches?.length > 0) {
        setExpandedApproach(0);
      }
      setExpandedSections(prev => ({ 
        ...prev, 
        emotional: true,
        bodyLanguage: true,
        deescalation: true,
      }));
    } catch (err) {
      setError(err.message || 'Failed to generate rehearsal scripts. Please try again.');
    }
  };

  const handleDebrief = async () => {
    if (!howItWent.trim()) {
      setError('Please describe how the conversation went');
      return;
    }

    setError('');
    setDebriefResults(null);

    try {
      const data = await callToolEndpoint('difficult-talk-debrief', {
        originalTopic: topic,
        howItWent: howItWent.trim(),
        relationship,
      });
      
      setDebriefResults(data);
      setExpandedSections(prev => ({ ...prev, postConversation: true }));
    } catch (err) {
      setError(err.message || 'Failed to generate debrief. Please try again.');
    }
  };

  const copyText = (text, itemName) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(itemName);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const copyApproachScript = (approach) => {
    const script = `${approach.approach_name}\n\n` +
      `Opening: ${approach.script.opening}\n\n` +
      `Main Points:\n${approach.script.main_points.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\n` +
      `Key Phrases:\n${approach.script.specific_phrases.map(p => `• ${p}`).join('\n')}\n\n` +
      `Closing: ${approach.script.closing}`;
    
    copyText(script, `approach-${approach.approach_name}`);
  };

  const toggleApproach = (index) => {
    setExpandedApproach(expandedApproach === index ? null : index);
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getResistanceLabel = (level) => {
    if (level < 25) return 'Minimal pushback expected';
    if (level < 50) return 'Some resistance likely';
    if (level < 75) return 'Significant pushback likely';
    return 'Major conflict expected';
  };

  const getResistanceColor = (level) => {
    if (level < 25) return isDark ? 'text-green-400' : 'text-green-600';
    if (level < 50) return isDark ? 'text-yellow-400' : 'text-yellow-600';
    if (level < 75) return isDark ? 'text-orange-400' : 'text-orange-600';
    return isDark ? 'text-red-400' : 'text-red-600';
  };

  const handleReset = () => {
    setTopic('');
    setRelationship('Friend');
    setCommunicationStyle('Direct');
    setResistanceLevel(50);
    setGoals({
      setBoundary: false,
      requestChange: false,
      addressConflict: false,
      giveFeedback: false,
      askForSomething: false,
    });
    setResults(null);
    setError('');
    setExpandedApproach(null);
  };

  return (
    <div className={`min-h-screen ${c.bg} py-8 px-4`}>
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className={`${c.card} border rounded-xl shadow-lg p-6 transition-colors duration-200`}>
          <div className="flex items-center gap-3 mb-4">
            <div>
              <h2 className={`text-2xl font-bold ${c.text}`}>Difficult Talk Rehearser 💬</h2>
              <p className={`text-sm ${c.textMuted}`}>Practice scripts and strategies for hard conversations</p>
            </div>
          </div>
        </div>

        {/* Input Form */}
        <div className={`${c.card} border rounded-xl shadow-lg p-6 transition-colors duration-200`}>
          
          {/* Supportive notice */}
          <div className={`${c.info} border-l-4 rounded-r-lg p-4 mb-6`}>
            <div className="flex items-start gap-2">
              <Shield className={`w-4 h-4 flex-shrink-0 mt-0.5`} />
              <div>
                <h3 className={`font-bold text-sm mb-1`}>You've Got This</h3>
                <p className={`text-xs ${c.textSecondary}`}>
                  This tool helps you prepare for difficult conversations with specific scripts, predicted responses, and emotional grounding techniques. You're being brave by preparing.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            
            {/* Topic */}
            <div>
              <label htmlFor="topic" className={`block text-sm font-medium ${c.label} mb-2`}>
                What do you need to discuss? *
              </label>
              <textarea
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., I need to tell my roommate their noise is affecting my sleep, or I need to ask my boss for accommodations, or I need to set a boundary with my parent..."
                className={`w-full h-32 p-4 border-2 rounded-lg ${c.input} outline-none focus:ring-2 resize-none`}
              />
            </div>

            {/* Relationship & Communication Style */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Relationship */}
              <div>
                <label htmlFor="relationship" className={`block text-sm font-medium ${c.label} mb-2`}>
                  Your relationship to this person
                </label>
                <select
                  id="relationship"
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className={`w-full p-3 border rounded-lg ${c.input} outline-none focus:ring-2`}
                >
                  {relationships.map(rel => (
                    <option key={rel} value={rel}>{rel}</option>
                  ))}
                </select>
              </div>

              {/* Communication Style */}
              <div>
                <label className={`block text-sm font-medium ${c.label} mb-2`}>
                  Your preferred communication style
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {styles.map(style => (
                    <button
                      key={style}
                      onClick={() => setCommunicationStyle(style)}
                      className={`p-2 border-2 rounded-lg text-sm font-medium transition-colors ${
                        communicationStyle === style
                          ? isDark
                            ? 'border-red-500 bg-red-900/30 text-red-300'
                            : 'border-red-500 bg-red-50 text-red-700'
                          : isDark
                            ? 'border-zinc-700 hover:border-zinc-600 text-zinc-300'
                            : 'border-red-200 hover:border-red-300 text-red-700'
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Conversation Goals */}
            <div>
              <label className={`block text-sm font-medium ${c.label} mb-3`}>
                What are you trying to achieve? (Select all that apply) *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {conversationGoals.map(({ key, label }) => (
                  <label
                    key={key}
                    className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                      goals[key]
                        ? isDark
                          ? 'border-red-500 bg-red-900/20'
                          : 'border-red-500 bg-red-50'
                        : isDark
                          ? 'border-zinc-700 hover:border-zinc-600'
                          : 'border-red-200 hover:border-red-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={goals[key]}
                      onChange={() => handleGoalToggle(key)}
                      className="w-4 h-4 text-red-600 rounded focus:ring-2 focus:ring-red-500"
                    />
                    <span className={`text-sm ${c.text}`}>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Resistance Level Slider */}
            <div>
              <label htmlFor="resistance" className={`block text-sm font-medium ${c.label} mb-2`}>
                How much resistance do you expect?
              </label>
              <div className="space-y-2">
                <input
                  id="resistance"
                  type="range"
                  min="0"
                  max="100"
                  value={resistanceLevel}
                  onChange={(e) => setResistanceLevel(Number(e.target.value))}
                  className="w-full h-2 bg-red-200 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${isDark ? '#22c55e' : '#16a34a'} 0%, ${isDark ? '#eab308' : '#ca8a04'} 25%, ${isDark ? '#f97316' : '#ea580c'} 50%, ${isDark ? '#ef4444' : '#dc2626'} 75%, ${isDark ? '#b91c1c' : '#991b1b'} 100%)`
                  }}
                />
                <div className="flex items-center justify-between">
                  <span className={`text-xs ${c.textMuted}`}>No pushback</span>
                  <span className={`text-sm font-semibold ${getResistanceColor(resistanceLevel)}`}>
                    {getResistanceLabel(resistanceLevel)}
                  </span>
                  <span className={`text-xs ${c.textMuted}`}>Major conflict</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleGenerate}
                disabled={loading || !topic.trim()}
                className={`flex-1 ${c.btnPrimary} disabled:opacity-50 disabled:cursor-not-allowed py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating scripts...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Rehearse This Conversation
                  </>
                )}
              </button>
              
              {results && (
                <button
                  onClick={handleReset}
                  className={`${c.btnSecondary} py-3 px-6 rounded-lg font-semibold transition-colors`}
                >
                  New Conversation
                </button>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className={`${c.error} border rounded-lg p-4 flex items-start gap-3`}>
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        {results && (
          <div className="space-y-6">
            
            {/* Confidence Builder */}
            {results.confidence_builder && (
              <div className={`${c.success} border-l-4 rounded-r-lg p-6`}>
                <div className="flex items-start gap-3">
                  <Heart className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold mb-2">You're Being Brave</h3>
                    <p className="text-sm">{results.confidence_builder}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Conversation Approaches */}
            {results.conversation_approaches && results.conversation_approaches.length > 0 && (
              <div className={`${c.card} border rounded-xl shadow-lg p-6`}>
                <h3 className={`text-xl font-bold ${c.text} mb-4 flex items-center gap-2`}>
                  <MessageSquare className="w-5 h-5" />
                  Conversation Approaches
                </h3>
                <p className={`text-sm ${c.textMuted} mb-4`}>
                  Choose the approach that feels right for you and the situation
                </p>

                <div className="space-y-4">
                  {results.conversation_approaches.map((approach, idx) => (
                    <div key={idx} className={`${c.cardAlt} border rounded-lg overflow-hidden`}>
                      
                      {/* Approach Header */}
                      <button
                        onClick={() => toggleApproach(idx)}
                        className="w-full p-4 flex items-center justify-between hover:bg-opacity-80 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${isDark ? 'bg-red-600 text-white' : 'bg-red-600 text-white'}`}>
                            {idx + 1}
                          </span>
                          <div className="text-left">
                            <h4 className={`font-bold ${c.text}`}>{approach.approach_name}</h4>
                            <p className={`text-xs ${c.textMuted}`}>Tone: {approach.tone}</p>
                          </div>
                        </div>
                        {expandedApproach === idx ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>

                      {/* Approach Details */}
                      {expandedApproach === idx && (
                        <div className={`p-4 border-t ${isDark ? 'border-zinc-700' : 'border-red-200'} space-y-4`}>
                          
                          {/* When to Use */}
                          <div className={`p-3 rounded ${isDark ? 'bg-zinc-800' : 'bg-white'}`}>
                            <p className={`text-xs font-semibold ${c.textMuted} mb-1`}>WHEN TO USE:</p>
                            <p className={`text-sm ${c.textSecondary}`}>{approach.when_to_use}</p>
                          </div>

                          {/* Script */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h5 className={`font-semibold ${c.text}`}>Script:</h5>
                              <button
                                onClick={() => copyApproachScript(approach)}
                                className={`${c.btnSecondary} py-1 px-3 rounded text-xs flex items-center gap-1`}
                              >
                                {copiedItem === `approach-${approach.approach_name}` ? (
                                  <>
                                    <CheckCircle className="w-3 h-3" />
                                    Copied
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    Copy Script
                                  </>
                                )}
                              </button>
                            </div>

                            <div className={`p-3 rounded ${isDark ? 'bg-zinc-800' : 'bg-white'} space-y-2`}>
                              <div>
                                <p className={`text-xs font-semibold ${c.textMuted} mb-1`}>OPENING:</p>
                                <p className={`text-sm ${c.textSecondary} italic`}>"{approach.script.opening}"</p>
                              </div>
                              
                              <div>
                                <p className={`text-xs font-semibold ${c.textMuted} mb-1`}>MAIN POINTS:</p>
                                <ul className="space-y-1">
                                  {approach.script.main_points.map((point, pidx) => (
                                    <li key={pidx} className={`text-sm ${c.textSecondary} flex items-start gap-2`}>
                                      <span className="text-red-500 mt-0.5">•</span>
                                      <span>{point}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              <div>
                                <p className={`text-xs font-semibold ${c.textMuted} mb-1`}>KEY PHRASES TO USE:</p>
                                <div className="flex flex-wrap gap-2">
                                  {approach.script.specific_phrases.map((phrase, pidx) => (
                                    <span key={pidx} className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-700'}`}>
                                      "{phrase}"
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <p className={`text-xs font-semibold ${c.textMuted} mb-1`}>CLOSING:</p>
                                <p className={`text-sm ${c.textSecondary} italic`}>"{approach.script.closing}"</p>
                              </div>
                            </div>
                          </div>

                          {/* Anticipated Responses */}
                          {approach.anticipated_responses && approach.anticipated_responses.length > 0 && (
                            <div>
                              <h5 className={`font-semibold ${c.text} mb-2`}>If They Push Back:</h5>
                              <div className="space-y-2">
                                {approach.anticipated_responses.map((response, ridx) => (
                                  <div key={ridx} className={`p-3 rounded ${isDark ? 'bg-zinc-800' : 'bg-white'} border ${isDark ? 'border-zinc-700' : 'border-red-200'}`}>
                                    <p className={`text-xs font-semibold ${c.textMuted} mb-1`}>THEY MIGHT SAY:</p>
                                    <p className={`text-sm ${c.textSecondary} italic mb-2`}>"{response.they_might_say}"</p>
                                    <p className={`text-xs font-semibold ${c.textMuted} mb-1`}>YOU COULD RESPOND:</p>
                                    <p className={`text-sm ${c.textSecondary} italic mb-2`}>"{response.you_could_say}"</p>
                                    <p className={`text-xs ${c.textMuted}`}>Goal: {response.goal}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Body Language */}
                          {approach.body_language_tips && approach.body_language_tips.length > 0 && (
                            <div className={`p-3 rounded ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'} border ${isDark ? 'border-blue-700' : 'border-blue-300'}`}>
                              <p className={`text-xs font-semibold ${isDark ? 'text-blue-200' : 'text-blue-900'} mb-2`}>BODY LANGUAGE TIPS:</p>
                              <ul className="space-y-1">
                                {approach.body_language_tips.map((tip, tidx) => (
                                  <li key={tidx} className={`text-xs ${isDark ? 'text-blue-300' : 'text-blue-800'} flex items-start gap-2`}>
                                    <span>•</span>
                                    <span>{tip}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* What NOT to Say */}
                          {approach.what_NOT_to_say && approach.what_NOT_to_say.length > 0 && (
                            <div className={`p-3 rounded ${c.warning} border`}>
                              <p className={`text-xs font-semibold mb-2`}>⚠️ AVOID SAYING:</p>
                              <ul className="space-y-1">
                                {approach.what_NOT_to_say.map((phrase, pidx) => (
                                  <li key={pidx} className={`text-xs flex items-start gap-2`}>
                                    <span>✗</span>
                                    <span>"{phrase}"</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Emotional Preparation */}
            {results.emotional_preparation && (
              <div className={`${c.card} border rounded-xl shadow-lg p-6`}>
                <button
                  onClick={() => toggleSection('emotional')}
                  className="flex items-center gap-2 mb-4 w-full"
                >
                  <Heart className={`w-5 h-5`} />
                  <h3 className={`text-xl font-bold ${c.text}`}>Emotional Preparation</h3>
                  {expandedSections.emotional ? (
                    <ChevronUp className="w-5 h-5 ml-auto" />
                  ) : (
                    <ChevronDown className="w-5 h-5 ml-auto" />
                  )}
                </button>

                {expandedSections.emotional && (
                  <div className="space-y-4">
                    
                    {/* Grounding Technique */}
                    {results.emotional_preparation.grounding_technique && (
                      <div className={`${c.cardAlt} border rounded-lg p-4`}>
                        <h4 className={`font-semibold ${c.text} mb-2 flex items-center gap-2`}>
                          <Zap className="w-4 h-4" />
                          How to Stay Calm:
                        </h4>
                        <p className={`text-sm ${c.textSecondary}`}>{results.emotional_preparation.grounding_technique}</p>
                      </div>
                    )}

                    {/* Worst Case Reframe */}
                    {results.emotional_preparation.worst_case_reframe && (
                      <div className={`${c.cardAlt} border rounded-lg p-4`}>
                        <h4 className={`font-semibold ${c.text} mb-2 flex items-center gap-2`}>
                          <Shield className="w-4 h-4" />
                          Realistic Worst-Case Scenario:
                        </h4>
                        <p className={`text-sm ${c.textSecondary}`}>{results.emotional_preparation.worst_case_reframe}</p>
                      </div>
                    )}

                    {/* Exit Strategy */}
                    {results.emotional_preparation.exit_strategy && (
                      <div className={`${c.cardAlt} border rounded-lg p-4`}>
                        <h4 className={`font-semibold ${c.text} mb-2 flex items-center gap-2`}>
                          <Target className="w-4 h-4" />
                          If You Need to Pause:
                        </h4>
                        <p className={`text-sm ${c.textSecondary}`}>{results.emotional_preparation.exit_strategy}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Preparation Steps */}
            {results.preparation_steps && results.preparation_steps.length > 0 && (
              <div className={`${c.card} border rounded-xl shadow-lg p-6`}>
                <button
                  onClick={() => toggleSection('preparation')}
                  className="flex items-center gap-2 mb-4 w-full"
                >
                  <BookOpen className={`w-5 h-5`} />
                  <h3 className={`text-xl font-bold ${c.text}`}>Before the Conversation</h3>
                  {expandedSections.preparation ? (
                    <ChevronUp className="w-5 h-5 ml-auto" />
                  ) : (
                    <ChevronDown className="w-5 h-5 ml-auto" />
                  )}
                </button>

                {expandedSections.preparation && (
                  <div className="space-y-3">
                    {results.preparation_steps.map((step, idx) => (
                      <div key={idx} className={`${c.cardAlt} border rounded-lg p-4`}>
                        <div className="flex items-start gap-3">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold flex-shrink-0 ${isDark ? 'bg-red-600 text-white' : 'bg-red-600 text-white'}`}>
                            {idx + 1}
                          </span>
                          <div className="flex-1">
                            <h4 className={`font-semibold ${c.text} mb-1`}>{step.step}</h4>
                            <p className={`text-xs ${c.textMuted} mb-2`}>Why: {step.why}</p>
                            <p className={`text-sm ${c.textSecondary}`}>How: {step.how}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Follow-up Plan */}
            {results.follow_up_plan && (
              <div className={`${c.card} border rounded-xl shadow-lg p-6`}>
                <button
                  onClick={() => toggleSection('followUp')}
                  className="flex items-center gap-2 mb-4 w-full"
                >
                  <RefreshCw className={`w-5 h-5`} />
                  <h3 className={`text-xl font-bold ${c.text}`}>After the Conversation</h3>
                  {expandedSections.followUp ? (
                    <ChevronUp className="w-5 h-5 ml-auto" />
                  ) : (
                    <ChevronDown className="w-5 h-5 ml-auto" />
                  )}
                </button>

                {expandedSections.followUp && (
                  <div className={`${c.cardAlt} border rounded-lg p-4`}>
                    <p className={`text-sm ${c.textSecondary}`}>{results.follow_up_plan}</p>
                  </div>
                )}
              </div>
            )}

            {/* Body Language Guidance */}
            {results.body_language_guidance && (
              <div className={`${c.card} border rounded-xl shadow-lg p-6`}>
                <button
                  onClick={() => toggleSection('bodyLanguage')}
                  className="flex items-center gap-2 mb-4 w-full"
                >
                  <Users className={`w-5 h-5`} />
                  <h3 className={`text-xl font-bold ${c.text}`}>Body Language & Non-Verbal Communication</h3>
                  {expandedSections.bodyLanguage ? (
                    <ChevronUp className="w-5 h-5 ml-auto" />
                  ) : (
                    <ChevronDown className="w-5 h-5 ml-auto" />
                  )}
                </button>

                {expandedSections.bodyLanguage && (
                  <div className="space-y-4">
                    {results.body_language_guidance.posture && (
                      <div className={`${c.cardAlt} border rounded-lg p-4`}>
                        <h4 className={`font-semibold ${c.text} mb-2`}>Posture & Position:</h4>
                        <p className={`text-sm ${c.textSecondary}`}>{results.body_language_guidance.posture}</p>
                      </div>
                    )}

                    {results.body_language_guidance.eye_contact && (
                      <div className={`${c.cardAlt} border rounded-lg p-4`}>
                        <h4 className={`font-semibold ${c.text} mb-2`}>Eye Contact:</h4>
                        <p className={`text-sm ${c.textSecondary}`}>{results.body_language_guidance.eye_contact}</p>
                      </div>
                    )}

                    {results.body_language_guidance.hands && (
                      <div className={`${c.cardAlt} border rounded-lg p-4`}>
                        <h4 className={`font-semibold ${c.text} mb-2`}>What to Do With Your Hands:</h4>
                        <p className={`text-sm ${c.textSecondary}`}>{results.body_language_guidance.hands}</p>
                      </div>
                    )}

                    {results.body_language_guidance.facial_expressions && (
                      <div className={`${c.cardAlt} border rounded-lg p-4`}>
                        <h4 className={`font-semibold ${c.text} mb-2`}>Facial Expressions:</h4>
                        <p className={`text-sm ${c.textSecondary}`}>{results.body_language_guidance.facial_expressions}</p>
                      </div>
                    )}

                    {results.body_language_guidance.tone_of_voice && (
                      <div className={`${c.cardAlt} border rounded-lg p-4`}>
                        <h4 className={`font-semibold ${c.text} mb-2`}>Tone of Voice:</h4>
                        <p className={`text-sm ${c.textSecondary}`}>{results.body_language_guidance.tone_of_voice}</p>
                      </div>
                    )}

                    {results.body_language_guidance.physical_distance && (
                      <div className={`${c.cardAlt} border rounded-lg p-4`}>
                        <h4 className={`font-semibold ${c.text} mb-2`}>Physical Distance:</h4>
                        <p className={`text-sm ${c.textSecondary}`}>{results.body_language_guidance.physical_distance}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* De-escalation Protocols */}
            {results.deescalation_protocols && (
              <div className={`${c.card} border rounded-xl shadow-lg p-6`}>
                <button
                  onClick={() => toggleSection('deescalation')}
                  className="flex items-center gap-2 mb-4 w-full"
                >
                  <AlertTriangle className={`w-5 h-5`} />
                  <h3 className={`text-xl font-bold ${c.text}`}>De-escalation Protocols</h3>
                  {expandedSections.deescalation ? (
                    <ChevronUp className="w-5 h-5 ml-auto" />
                  ) : (
                    <ChevronDown className="w-5 h-5 ml-auto" />
                  )}
                </button>

                {expandedSections.deescalation && (
                  <div className="space-y-4">
                    {results.deescalation_protocols.tension_lowering_phrases && (
                      <div className={`${c.cardAlt} border rounded-lg p-4`}>
                        <h4 className={`font-semibold ${c.text} mb-2`}>Phrases That Lower Tension:</h4>
                        <ul className="space-y-2">
                          {results.deescalation_protocols.tension_lowering_phrases.map((phrase, idx) => (
                            <li key={idx} className={`text-sm ${c.textSecondary} flex items-start gap-2`}>
                              <span className="text-green-500 mt-0.5">✓</span>
                              <span className="italic">"{phrase}"</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {results.deescalation_protocols.when_to_pause && (
                      <div className={`${c.warning} border rounded-lg p-4`}>
                        <h4 className={`font-semibold mb-2`}>⚠️ When to Suggest a Break:</h4>
                        <p className={`text-sm`}>{results.deescalation_protocols.when_to_pause}</p>
                      </div>
                    )}

                    {results.deescalation_protocols.pause_phrases && (
                      <div className={`${c.cardAlt} border rounded-lg p-4`}>
                        <h4 className={`font-semibold ${c.text} mb-2`}>How to Pause Without Abandoning:</h4>
                        <ul className="space-y-2">
                          {results.deescalation_protocols.pause_phrases.map((phrase, idx) => (
                            <li key={idx} className={`text-sm ${c.textSecondary} italic`}>
                              "{phrase}"
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {results.deescalation_protocols.exit_when_harmful && (
                      <div className={`${c.error} border rounded-lg p-4`}>
                        <h4 className={`font-semibold mb-2`}>🚨 Exit Strategy (When Conversation Becomes Harmful):</h4>
                        <p className={`text-sm`}>{results.deescalation_protocols.exit_when_harmful}</p>
                      </div>
                    )}

                    {results.deescalation_protocols.timeout_signal && (
                      <div className={`${c.cardAlt} border rounded-lg p-4`}>
                        <h4 className={`font-semibold ${c.text} mb-2`}>Time-Out Signal Agreement:</h4>
                        <p className={`text-sm ${c.textSecondary}`}>{results.deescalation_protocols.timeout_signal}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Post-Conversation Debrief */}
            {!conversationHappened && results && (
              <div className={`${c.card} border rounded-xl shadow-lg p-6`}>
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                  <h3 className={`text-xl font-bold ${c.text}`}>After Your Conversation</h3>
                </div>
                <p className={`text-sm ${c.textMuted} mb-4`}>
                  Come back here after the conversation happens. I'll help you process what went well and what to improve.
                </p>
                <button
                  onClick={() => {
                    setConversationHappened(true);
                    setShowDebrief(true);
                    setExpandedSections(prev => ({ ...prev, postConversation: true }));
                  }}
                  className={`${c.btnSecondary} py-2 px-4 rounded-lg text-sm flex items-center gap-2`}
                >
                  <MessageSquare className="w-4 h-4" />
                  I Had the Conversation - Let's Debrief
                </button>
              </div>
            )}

            {/* Debrief Form */}
            {showDebrief && conversationHappened && (
              <div className={`${c.card} border rounded-xl shadow-lg p-6`}>
                <button
                  onClick={() => toggleSection('postConversation')}
                  className="flex items-center gap-2 mb-4 w-full"
                >
                  <MessageSquare className={`w-5 h-5`} />
                  <h3 className={`text-xl font-bold ${c.text}`}>Post-Conversation Debrief</h3>
                  {expandedSections.postConversation ? (
                    <ChevronUp className="w-5 h-5 ml-auto" />
                  ) : (
                    <ChevronDown className="w-5 h-5 ml-auto" />
                  )}
                </button>

                {expandedSections.postConversation && (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="howItWent" className={`block text-sm font-medium ${c.label} mb-2`}>
                        How did the conversation go?
                      </label>
                      <textarea
                        id="howItWent"
                        value={howItWent}
                        onChange={(e) => setHowItWent(e.target.value)}
                        placeholder="Describe what happened... What did you say? How did they respond? How do you feel about it?"
                        className={`w-full h-32 p-4 border-2 rounded-lg ${c.input} outline-none focus:ring-2 resize-none`}
                      />
                    </div>

                    <button
                      onClick={handleDebrief}
                      disabled={loading || !howItWent.trim()}
                      className={`${c.btnPrimary} disabled:opacity-50 py-2 px-4 rounded-lg flex items-center gap-2`}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Get Debrief & Analysis
                        </>
                      )}
                    </button>

                    {/* Debrief Results */}
                    {debriefResults && (
                      <div className="space-y-4 mt-6">
                        {debriefResults.what_went_well && debriefResults.what_went_well.length > 0 && (
                          <div className={`${c.success} border rounded-lg p-4`}>
                            <h4 className="font-bold mb-2">✓ What Went Well:</h4>
                            <ul className="space-y-1">
                              {debriefResults.what_went_well.map((item, idx) => (
                                <li key={idx} className="text-sm">• {item}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {debriefResults.what_to_improve && debriefResults.what_to_improve.length > 0 && (
                          <div className={`${c.warning} border rounded-lg p-4`}>
                            <h4 className="font-bold mb-2">→ What to Improve Next Time:</h4>
                            <ul className="space-y-1">
                              {debriefResults.what_to_improve.map((item, idx) => (
                                <li key={idx} className="text-sm">• {item}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {debriefResults.follow_up_timing && (
                          <div className={`${c.cardAlt} border rounded-lg p-4`}>
                            <h4 className={`font-semibold ${c.text} mb-2`}>⏰ When to Follow Up:</h4>
                            <p className={`text-sm ${c.textSecondary}`}>{debriefResults.follow_up_timing}</p>
                          </div>
                        )}

                        {debriefResults.repair_strategies && debriefResults.repair_strategies.length > 0 && (
                          <div className={`${c.info} border rounded-lg p-4`}>
                            <h4 className="font-bold mb-2">🔧 Repair Strategies (If Needed):</h4>
                            <ul className="space-y-2">
                              {debriefResults.repair_strategies.map((strategy, idx) => (
                                <li key={idx} className="text-sm">{strategy}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {debriefResults.emotional_processing && (
                          <div className={`${c.purple} border rounded-lg p-4`}>
                            <h4 className="font-bold mb-2">💜 Processing the Aftermath:</h4>
                            <p className="text-sm">{debriefResults.emotional_processing}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DifficultTalkRehearser;
