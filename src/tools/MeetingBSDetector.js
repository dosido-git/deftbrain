import React, { useState, useEffect } from 'react';
import { AlertTriangle, Check, X, Clock, Users, TrendingUp, Share2, Copy, Download, BarChart3, RefreshCw, Zap, Loader2 } from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';

const MeetingBSDetector = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Theme colors
  const c = {
    bg: isDark ? 'bg-zinc-900' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50',
    card: isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-indigo-200',
    cardAlt: isDark ? 'bg-zinc-700 border-zinc-600' : 'bg-indigo-50 border-indigo-200',
    
    input: isDark
      ? 'bg-zinc-900 border-zinc-700 text-zinc-50 placeholder:text-zinc-500 focus:border-indigo-500 focus:ring-indigo-500/20'
      : 'bg-white border-indigo-300 text-indigo-900 placeholder:text-indigo-400 focus:border-indigo-600 focus:ring-indigo-100',
    
    text: isDark ? 'text-zinc-50' : 'text-indigo-900',
    textSecondary: isDark ? 'text-zinc-300' : 'text-indigo-700',
    textMuted: isDark ? 'text-zinc-400' : 'text-indigo-600',
    label: isDark ? 'text-zinc-200' : 'text-indigo-800',
    
    btnPrimary: isDark
      ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
      : 'bg-indigo-600 hover:bg-indigo-700 text-white',
    btnSecondary: isDark
      ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-50'
      : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-900',
    
    green: isDark
      ? 'bg-green-900/30 border-green-700 text-green-200'
      : 'bg-green-100 border-green-400 text-green-900',
    yellow: isDark
      ? 'bg-yellow-900/30 border-yellow-700 text-yellow-200'
      : 'bg-yellow-100 border-yellow-400 text-yellow-900',
    red: isDark
      ? 'bg-red-900/30 border-red-700 text-red-200'
      : 'bg-red-100 border-red-400 text-red-900',
  };

  // State
  const [meetingText, setMeetingText] = useState('');
  const [rescueMode, setRescueMode] = useState(false);
  const [manualDuration, setManualDuration] = useState('');
  const [manualAttendees, setManualAttendees] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalAnalyzed: 0,
    hoursSaved: 0,
    percentUnnecessary: 0,
    thisWeek: 0,
    thisMonth: 0,
  });
  const [copySuccess, setCopySuccess] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Load stats from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('meetingBSDetectorStats');
    if (saved) {
      try {
        setStats(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load stats', e);
      }
    }
  }, []);

  // Save stats to localStorage
  const saveStats = (newStats) => {
    setStats(newStats);
    localStorage.setItem('meetingBSDetectorStats', JSON.stringify(newStats));
  };

  // Analyze meeting
  const handleAnalyze = async () => {
    if (!meetingText.trim()) {
      setError('Please paste a meeting invitation or description');
      return;
    }

    setError('');
    setResults(null);

    // Debug: Log what we're sending
    console.log('📤 Sending to API:', {
      meetingText: meetingText.substring(0, 50) + '...',
      rescueMode,
      manualDuration: manualDuration ? parseFloat(manualDuration) : null,
      manualAttendees: manualAttendees ? parseInt(manualAttendees) : null,
    });

    try {
      const data = await callToolEndpoint('meeting-bs-detector', {
        meetingText: meetingText.trim(),
        rescueMode,
        manualDuration: manualDuration ? parseFloat(manualDuration) : null,
        manualAttendees: manualAttendees ? parseInt(manualAttendees) : null,
      });
      
      // Debug: Log what we received
      console.log('📥 Received from API:', {
        verdict: data.verdict,
        time_estimate: data.time_estimate,
      });
      
      setResults(data);

      // Update stats if not in rescue mode
      if (!rescueMode && data.time_estimate) {
        const newStats = {
          totalAnalyzed: stats.totalAnalyzed + 1,
          hoursSaved: stats.hoursSaved + (data.verdict === 'async_recommended' ? data.time_estimate.could_save_hours || 0 : 0),
          percentUnnecessary: Math.round(
            ((stats.totalAnalyzed * (stats.percentUnnecessary / 100)) + (data.verdict === 'async_recommended' ? 1 : 0)) /
            (stats.totalAnalyzed + 1) * 100
          ),
          thisWeek: stats.thisWeek + (data.verdict === 'async_recommended' ? data.time_estimate.could_save_hours || 0 : 0),
          thisMonth: stats.thisMonth + (data.verdict === 'async_recommended' ? data.time_estimate.could_save_hours || 0 : 0),
        };
        saveStats(newStats);
      }
    } catch (err) {
      setError(err.message || 'Failed to analyze meeting. Please try again.');
    }
  };

  // Copy decline message
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // Export results
  const handleExport = () => {
    if (!results) return;
    
    const exportText = `MEETING ANALYSIS RESULTS
Generated: ${new Date().toLocaleString()}

${results.verdict ? `VERDICT: ${results.verdict.replace('_', ' ').toUpperCase()}` : ''}
${results.confidence ? `Confidence: ${results.confidence}%` : ''}
${results.quality_score ? `Quality Score: ${results.quality_score}/10` : ''}

${results.reasoning && results.reasoning.length > 0 ? `REASONING:
${results.reasoning.map(r => `• ${r}`).join('\n')}
` : ''}

${results.red_flags && results.red_flags.length > 0 ? `RED FLAGS:
${results.red_flags.map(f => f).join('\n')}
` : ''}

${results.alternative ? `ALTERNATIVE SUGGESTION:
${results.alternative}
` : ''}

${results.decline_template ? `DECLINE MESSAGE:
${results.decline_template}
` : ''}

${results.time_estimate ? `TIME IMPACT:
Meeting duration: ${results.time_estimate.meeting_duration_hours}h
Participants: ${results.time_estimate.participant_count}
Total person-hours: ${results.time_estimate.total_person_hours}h
Could save: ${results.time_estimate.could_save_hours}h
` : ''}

${results.rescue_suggestions && results.rescue_suggestions.length > 0 ? `RESCUE SUGGESTIONS:
${results.rescue_suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}
` : ''}

---
Analysis by Meeting BS Detector
`;

    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meeting-analysis-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getColorClass = (color) => {
    switch(color) {
      case 'green': return c.green;
      case 'yellow': return c.yellow;
      case 'red': return c.red;
      default: return c.cardAlt;
    }
  };

  const getVerdictIcon = (verdict) => {
    switch(verdict) {
      case 'meeting_justified': return <Check className="w-8 h-8" />;
      case 'async_recommended': return <X className="w-8 h-8" />;
      default: return <AlertTriangle className="w-8 h-8" />;
    }
  };

  const getVerdictText = (verdict) => {
    switch(verdict) {
      case 'meeting_justified': return 'This meeting is justified';
      case 'async_recommended': return 'This should be async';
      case 'unclear': return 'Unclear - need more info';
      default: return verdict;
    }
  };

  return (
    <div className={`min-h-screen ${c.bg} py-8 px-4`}>
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className={`${c.card} border rounded-xl shadow-lg p-6`}>
          <div className="flex items-start gap-4 mb-4">
            <div className={`p-3 rounded-lg ${isDark ? 'bg-indigo-900/30' : 'bg-indigo-100'}`}>
              <AlertTriangle className={`w-6 h-6 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
            </div>
            <div className="flex-1">
              <h2 className={`text-2xl font-bold ${c.text}`}>Meeting BS Detector 🚨</h2>
              <p className={`text-sm ${c.textMuted} mt-1`}>
                Evidence-based analysis of meeting necessity. Because not everything needs to be synchronous.
              </p>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className={`${c.cardAlt} border rounded-lg p-3`}>
              <p className={`text-xs ${c.textMuted}`}>Analyzed</p>
              <p className={`text-2xl font-bold ${c.text}`}>{stats.totalAnalyzed}</p>
            </div>
            <div className={`${c.cardAlt} border rounded-lg p-3`}>
              <p className={`text-xs ${c.textMuted}`}>Hours Saved</p>
              <p className={`text-2xl font-bold ${c.text}`}>{stats.hoursSaved.toFixed(1)}</p>
            </div>
            <div className={`${c.cardAlt} border rounded-lg p-3`}>
              <p className={`text-xs ${c.textMuted}`}>This Week</p>
              <p className={`text-2xl font-bold ${c.text}`}>{stats.thisWeek.toFixed(1)}h</p>
            </div>
            <div className={`${c.cardAlt} border rounded-lg p-3`}>
              <p className={`text-xs ${c.textMuted}`}>Unnecessary</p>
              <p className={`text-2xl font-bold ${c.text}`}>{stats.percentUnnecessary}%</p>
            </div>
          </div>

          {stats.hoursSaved > 0 && (
            <div className={`${c.green} border rounded-lg p-3 mt-3`}>
              <p className="text-sm font-semibold">
                🎉 You've reclaimed {stats.hoursSaved.toFixed(1)} hours this month!
              </p>
              <p className="text-xs mt-1">
                At $75/hour average, that's ${(stats.hoursSaved * 75).toFixed(0)} in recovered value.
              </p>
            </div>
          )}
        </div>

        {/* Input Section */}
        <div className={`${c.card} border rounded-xl shadow-lg p-6`}>
          <h3 className={`text-lg font-bold ${c.text} mb-4`}>
            Paste Meeting Details
          </h3>

          <div className="space-y-4">
            <div>
              <label htmlFor="meetingText" className={`block text-sm font-medium ${c.label} mb-2`}>
                Meeting invitation, calendar entry, or agenda
              </label>
              <textarea
                id="meetingText"
                value={meetingText}
                onChange={(e) => setMeetingText(e.target.value)}
                placeholder="Paste meeting invitation here...

Examples:
• Calendar invite subject + body
• Email with meeting details
• Agenda document
• Slack message proposing meeting

The more details, the better the analysis!"
                rows={10}
                className={`w-full p-4 border rounded-lg ${c.input} outline-none focus:ring-2 font-mono text-sm`}
              />
              <p className={`text-xs ${c.textMuted} mt-2`}>
                Include: title, attendees, duration, agenda, and purpose
              </p>
            </div>

            {/* Optional Manual Overrides */}
            <div className={`${c.cardAlt} border rounded-lg p-4`}>
              <h4 className={`text-sm font-semibold ${c.text} mb-3`}>
                Optional: Manual Duration & Attendees (if not in text above)
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="manualDuration" className={`block text-xs font-medium ${c.label} mb-2`}>
                    Duration (hours)
                  </label>
                  <input
                    type="number"
                    id="manualDuration"
                    value={manualDuration}
                    onChange={(e) => setManualDuration(e.target.value)}
                    placeholder="e.g., 1 or 0.5"
                    step="0.5"
                    min="0"
                    className={`w-full p-3 border rounded-lg ${c.input} outline-none focus:ring-2`}
                  />
                </div>
                <div>
                  <label htmlFor="manualAttendees" className={`block text-xs font-medium ${c.label} mb-2`}>
                    Attendee count
                  </label>
                  <input
                    type="number"
                    id="manualAttendees"
                    value={manualAttendees}
                    onChange={(e) => setManualAttendees(e.target.value)}
                    placeholder="e.g., 8"
                    min="1"
                    className={`w-full p-3 border rounded-lg ${c.input} outline-none focus:ring-2`}
                  />
                </div>
              </div>
              <p className={`text-xs ${c.textMuted} mt-2`}>
                Leave blank to auto-detect from meeting text
              </p>
            </div>

            {/* Rescue Mode Toggle */}
            <div className={`${c.cardAlt} border rounded-lg p-4`}>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rescueMode}
                  onChange={() => setRescueMode(!rescueMode)}
                  className="w-5 h-5 text-indigo-600 rounded mt-0.5 focus:ring-2 focus:ring-indigo-500"
                />
                <div>
                  <span className="font-semibold">Rescue Mode</span>
                  <p className="text-xs opacity-75 mt-1">
                    The meeting IS happening - suggest improvements to make it more effective
                  </p>
                </div>
              </label>
            </div>

            {/* Analyze Button */}
            <button
              onClick={handleAnalyze}
              disabled={loading || !meetingText.trim()}
              className={`w-full ${c.btnPrimary} py-4 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing meeting necessity...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  {rescueMode ? 'Get Improvement Suggestions' : 'Analyze Meeting'}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Results */}
        {results && !rescueMode && (
          <div className="space-y-6">
            
            {/* Verdict Card */}
            {results.verdict && (
              <div className={`${getColorClass(results.color)} border-2 rounded-xl shadow-lg p-6`}>
              <div className="flex items-center gap-4 mb-4">
                {getVerdictIcon(results.verdict)}
                <div className="flex-1">
                  <h3 className="text-2xl font-bold">
                    {getVerdictText(results.verdict)}
                  </h3>
                  <p className="text-sm mt-1">
                    {results.confidence}% confident • Quality score: {results.quality_score}/10
                  </p>
                </div>
              </div>

              {/* Meeting Details Summary */}
              {results.time_estimate ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="bg-black/10 rounded-lg p-3">
                    <p className="text-xs font-semibold mb-1">Duration</p>
                    <p className="text-xl font-bold">
                      {results.time_estimate.meeting_duration_hours}h
                    </p>
                  </div>
                  <div className="bg-black/10 rounded-lg p-3">
                    <p className="text-xs font-semibold mb-1">Attendees</p>
                    <p className="text-xl font-bold">
                      {results.time_estimate.participant_count}
                    </p>
                  </div>
                  <div className="bg-black/10 rounded-lg p-3">
                    <p className="text-xs font-semibold mb-1">Total Time</p>
                    <p className="text-xl font-bold">
                      {results.time_estimate.total_person_hours}h
                    </p>
                  </div>
                  <div className="bg-black/10 rounded-lg p-3">
                    <p className="text-xs font-semibold mb-1">Could Save</p>
                    <p className="text-xl font-bold">
                      {results.time_estimate.could_save_hours}h
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-black/10 rounded-lg p-3 mb-4">
                  <p className="text-xs">
                    💡 Include meeting duration and attendee count in your input for time impact analysis
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 mt-4">
                {results.decline_template && (
                  <button
                    onClick={() => handleCopy(results.decline_template)}
                    className={`${c.btnSecondary} py-2 px-4 rounded-lg text-sm font-semibold flex items-center gap-2`}
                  >
                    <Copy className="w-4 h-4" />
                    {copySuccess ? 'Copied!' : 'Copy Decline'}
                  </button>
                )}
                <button
                  onClick={handleExport}
                  className={`${c.btnSecondary} py-2 px-4 rounded-lg text-sm font-semibold flex items-center gap-2`}
                >
                  <Download className="w-4 h-4" />
                  Export Analysis
                </button>
                <button
                  onClick={() => setShowShareModal(true)}
                  className={`${c.btnSecondary} py-2 px-4 rounded-lg text-sm font-semibold flex items-center gap-2`}
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
              </div>
            </div>
            )}

            {/* Reasoning */}
            {results.reasoning && results.reasoning.length > 0 && (
              <div className={`${c.card} border rounded-xl shadow-lg p-6`}>
                <h4 className={`text-lg font-bold ${c.text} mb-4`}>Why This Verdict</h4>
                <ul className="space-y-2">
                  {results.reasoning.map((reason, idx) => (
                    <li key={idx} className={`flex items-start gap-3 text-sm ${c.textSecondary}`}>
                      <span className="text-indigo-500 mt-0.5">•</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Red Flags */}
            {results.red_flags && results.red_flags.length > 0 && (
              <div className={`${c.red} border rounded-lg p-4`}>
                <h4 className="font-semibold mb-3">🚩 Red Flags Detected:</h4>
                <div className="space-y-2">
                  {results.red_flags.map((flag, idx) => (
                    <p key={idx} className="text-sm">{flag}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Analysis Breakdown */}
            {results.analysis_breakdown && (
              <div className={`${c.card} border rounded-xl shadow-lg p-6`}>
                <h4 className={`text-lg font-bold ${c.text} mb-4`}>Analysis Breakdown</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(results.analysis_breakdown).map(([key, value]) => (
                    <div key={key} className={`${c.cardAlt} border rounded-lg p-3`}>
                      <p className={`text-xs ${c.textMuted} mb-1 capitalize`}>
                        {key.replace('_', ' ')}
                      </p>
                      <p className={`text-sm font-semibold ${c.text}`}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Alternative */}
            {results.alternative && (
              <div className={`${c.green} border rounded-lg p-4`}>
                <h4 className="font-semibold mb-2">💡 Better Alternative:</h4>
                <p className="text-sm">{results.alternative}</p>
              </div>
            )}

            {/* Decline Template */}
            {results.decline_template && (
              <div className={`${c.card} border rounded-xl shadow-lg p-6`}>
                <h4 className={`text-lg font-bold ${c.text} mb-4`}>Decline Message Template</h4>
                <div className="bg-black/5 dark:bg-white/5 rounded-lg p-4 mb-3">
                  <p className="text-sm whitespace-pre-wrap font-mono">
                    {results.decline_template}
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(results.decline_template)}
                  className={`${c.btnPrimary} py-2 px-4 rounded-lg text-sm font-semibold flex items-center gap-2`}
                >
                  <Copy className="w-4 h-4" />
                  {copySuccess ? 'Copied to clipboard!' : 'Copy to clipboard'}
                </button>
              </div>
            )}

            {/* Time Impact */}
            {results.time_estimate && (
              <div className={`${c.card} border rounded-xl shadow-lg p-6`}>
                <h4 className={`text-lg font-bold ${c.text} mb-4 flex items-center gap-2`}>
                  <Clock className="w-5 h-5" />
                  Time Impact Analysis
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className={`${c.cardAlt} border-2 rounded-lg p-4`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 opacity-50" />
                      <p className={`text-xs ${c.textMuted} font-semibold uppercase`}>Meeting Duration</p>
                    </div>
                    <p className={`text-3xl font-bold ${c.text}`}>
                      {results.time_estimate.meeting_duration_hours}h
                    </p>
                  </div>
                  <div className={`${c.cardAlt} border-2 rounded-lg p-4`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 opacity-50" />
                      <p className={`text-xs ${c.textMuted} font-semibold uppercase`}>Participants</p>
                    </div>
                    <p className={`text-3xl font-bold ${c.text}`}>
                      {results.time_estimate.participant_count}
                    </p>
                  </div>
                  <div className={`${c.cardAlt} border-2 rounded-lg p-4`}>
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 opacity-50" />
                      <p className={`text-xs ${c.textMuted} font-semibold uppercase`}>Person-Hours</p>
                    </div>
                    <p className={`text-3xl font-bold ${c.text}`}>
                      {results.time_estimate.total_person_hours}h
                    </p>
                  </div>
                  <div className={`${results.verdict === 'async_recommended' ? c.green : c.cardAlt} border-2 rounded-lg p-4`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Check className="w-4 h-4 opacity-50" />
                      <p className={`text-xs font-semibold uppercase`}>Could Save</p>
                    </div>
                    <p className={`text-3xl font-bold`}>
                      {results.time_estimate.could_save_hours}h
                    </p>
                  </div>
                </div>
                
                {/* Calculation Explanation */}
                <div className={`${isDark ? 'bg-zinc-900' : 'bg-indigo-50'} rounded-lg p-4 mt-4`}>
                  <p className="text-xs">
                    <strong>How we calculated this:</strong> {results.time_estimate.meeting_duration_hours}h meeting × {results.time_estimate.participant_count} people = {results.time_estimate.total_person_hours}h total time investment.
                    {results.verdict === 'async_recommended' && ` Async alternative would take ~${(results.time_estimate.participant_count * 0.25).toFixed(1)}h (15 min per person), saving ${results.time_estimate.could_save_hours}h.`}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Rescue Mode Results */}
        {results && rescueMode && (
          <div className="space-y-6">
            <div className={`${c.card} border rounded-xl shadow-lg p-6`}>
              <h3 className={`text-xl font-bold ${c.text} mb-4 flex items-center gap-2`}>
                <RefreshCw className="w-5 h-5" />
                How to Rescue This Meeting
              </h3>

              {/* Rescue Suggestions */}
              {results.rescue_suggestions && results.rescue_suggestions.length > 0 && (
                <div className="space-y-3 mb-6">
                  <h4 className={`font-semibold ${c.text}`}>Improvement Suggestions:</h4>
                  <ul className="space-y-2">
                    {results.rescue_suggestions.map((suggestion, idx) => (
                      <li key={idx} className={`flex items-start gap-3 text-sm ${c.textSecondary} ${c.cardAlt} border rounded-lg p-3`}>
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Improved Agenda */}
              {results.improved_agenda_template && (
                <div className="mb-6">
                  <h4 className={`font-semibold ${c.text} mb-3`}>Suggested Agenda:</h4>
                  <div className="bg-black/5 dark:bg-white/5 rounded-lg p-4">
                    <p className="text-sm whitespace-pre-wrap">{results.improved_agenda_template}</p>
                  </div>
                </div>
              )}

              {/* Other Optimizations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.participant_optimization && (
                  <div className={`${c.cardAlt} border rounded-lg p-4`}>
                    <h5 className={`font-semibold ${c.text} mb-2 text-sm`}>Participant Optimization:</h5>
                    <p className="text-sm">{results.participant_optimization}</p>
                  </div>
                )}
                {results.time_optimization && (
                  <div className={`${c.cardAlt} border rounded-lg p-4`}>
                    <h5 className={`font-semibold ${c.text} mb-2 text-sm`}>Time Optimization:</h5>
                    <p className="text-sm">{results.time_optimization}</p>
                  </div>
                )}
                {results.pre_work_needed && (
                  <div className={`${c.cardAlt} border rounded-lg p-4`}>
                    <h5 className={`font-semibold ${c.text} mb-2 text-sm`}>Pre-Work Needed:</h5>
                    <p className="text-sm">{results.pre_work_needed}</p>
                  </div>
                )}
                {results.success_metrics && (
                  <div className={`${c.cardAlt} border rounded-lg p-4`}>
                    <h5 className={`font-semibold ${c.text} mb-2 text-sm`}>Success Metrics:</h5>
                    <p className="text-sm">{results.success_metrics}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Share Modal */}
        {showShareModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className={`${c.card} border rounded-xl shadow-2xl p-6 max-w-md w-full`}>
              <h3 className={`text-lg font-bold ${c.text} mb-4`}>Share Analysis</h3>
              <p className={`text-sm ${c.textMuted} mb-4`}>
                Share this analysis with the meeting organizer?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    handleExport();
                    setShowShareModal(false);
                  }}
                  className={`flex-1 ${c.btnPrimary} py-2 px-4 rounded-lg font-semibold`}
                >
                  Download to Share
                </button>
                <button
                  onClick={() => setShowShareModal(false)}
                  className={`flex-1 ${c.btnSecondary} py-2 px-4 rounded-lg font-semibold`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MeetingBSDetector;
