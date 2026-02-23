import React, { useState, useEffect } from 'react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';
import { CopyBtn } from '../components/ActionButtons';

const EmailUrgencyTriager = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Form state
  const [emailContent, setEmailContent] = useState('');
  const [userRole, setUserRole] = useState('Employee');
  const [userTimezone, setUserTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);

  // Results state
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [expandedEmail, setExpandedEmail] = useState(null);

  // Sender learning state
  const [senderHistory, setSenderHistory] = useState({});
  const [showSenderInsights, setShowSenderInsights] = useState(false);

  const roleOptions = [
    'Employee',
    'Manager',
    'Freelancer',
    'Student',
    'Personal',
    'Executive',
    'Academic/Researcher'
  ];

  // Load sender history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('email-sender-history');
    if (saved) {
      try {
        setSenderHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load sender history:', e);
      }
    }
  }, []);

  // Save sender history
  const updateSenderHistory = (sender, wasActuallyUrgent, markedUrgent) => {
    const history = { ...senderHistory };
    if (!history[sender]) {
      history[sender] = {
        total: 0,
        markedUrgent: 0,
        actuallyUrgent: 0,
        cryWolfScore: 0
      };
    }

    history[sender].total++;
    if (markedUrgent) history[sender].markedUrgent++;
    if (wasActuallyUrgent) history[sender].actuallyUrgent++;

    // Calculate cry wolf score (how often they mark urgent but it's not)
    if (history[sender].markedUrgent > 0) {
      history[sender].cryWolfScore = 
        (history[sender].markedUrgent - history[sender].actuallyUrgent) / history[sender].markedUrgent;
    }

    setSenderHistory(history);
    localStorage.setItem('email-sender-history', JSON.stringify(history));
  };

  // Theme-aware colors
  const c = {
    bg: isDark ? 'bg-zinc-900' : 'bg-gradient-to-br from-emerald-50 to-emerald-50',
    card: isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-emerald-200',
    cardAlt: isDark ? 'bg-zinc-700 border-zinc-600' : 'bg-emerald-50 border-emerald-200',
    
    input: isDark 
      ? 'bg-zinc-900 border-zinc-700 text-zinc-50 placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20'
      : 'bg-white border-emerald-300 text-emerald-900 placeholder:text-emerald-400 focus:border-emerald-600 focus:ring-emerald-100',
    
    text: isDark ? 'text-zinc-50' : 'text-emerald-900',
    textSecondary: isDark ? 'text-zinc-400' : 'text-emerald-700',
    textMuted: isDark ? 'text-zinc-500' : 'text-emerald-600',
    label: isDark ? 'text-zinc-300' : 'text-emerald-800',
    
    accent: isDark ? 'text-emerald-400' : 'text-emerald-600',
    
    btnPrimary: isDark
      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
      : 'bg-emerald-600 hover:bg-emerald-700 text-white',
    btnSecondary: isDark
      ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-50'
      : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900',
    btnOutline: isDark
      ? 'border-zinc-600 hover:border-zinc-500 text-zinc-300'
      : 'border-emerald-300 hover:border-emerald-400 text-emerald-700',
    
    // Urgency-specific colors
    urgent: isDark
      ? 'bg-red-900/20 border-red-700 text-red-200'
      : 'bg-red-50 border-red-300 text-red-800',
    urgentBadge: isDark ? 'bg-red-600' : 'bg-red-500',
    
    thisWeek: isDark
      ? 'bg-amber-900/20 border-amber-700 text-amber-200'
      : 'bg-amber-50 border-amber-300 text-amber-800',
    thisWeekBadge: isDark ? 'bg-amber-600' : 'bg-amber-500',
    
    optional: isDark
      ? 'bg-emerald-900/20 border-emerald-700 text-emerald-200'
      : 'bg-emerald-50 border-emerald-300 text-emerald-800',
    optionalBadge: isDark ? 'bg-emerald-600' : 'bg-emerald-500',
    
    infoBox: isDark
      ? 'bg-blue-900/20 border-blue-700 text-blue-200'
      : 'bg-blue-50 border-blue-200 text-blue-900',
    successBox: isDark
      ? 'bg-emerald-900/20 border-emerald-700 text-emerald-200'
      : 'bg-emerald-50 border-emerald-200 text-emerald-800',
    warningBox: isDark
      ? 'bg-red-900/20 border-red-700 text-red-200'
      : 'bg-red-50 border-red-200 text-red-800',
    purpleBox: isDark
      ? 'bg-purple-900/20 border-purple-700 text-purple-200'
      : 'bg-purple-50 border-purple-200 text-purple-900',
  };

  const handleAnalyze = async () => {
    if (!emailContent.trim()) {
      setError('Please paste at least one email to analyze');
      return;
    }

    setError('');
    setResults(null);

    try {
      const data = await callToolEndpoint('email-urgency-triager', {
        emailContent: emailContent.trim(),
        userRole,
        userTimezone,
        senderHistory: senderHistory
      });
      setResults(data);
      setExpandedEmail(null);

      // Update sender history based on results
      if (data.urgency_analysis) {
        data.urgency_analysis.forEach(email => {
          const wasActuallyUrgent = email.urgency_tier === 'now';
          const markedUrgent = email.sender_marked_urgent || false;
          if (email.from) {
            updateSenderHistory(email.from, wasActuallyUrgent, markedUrgent);
          }
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to analyze emails. Please try again.');
    }
  };

  const handleReset = () => {
    setEmailContent('');
    setResults(null);
    setError('');
    setExpandedEmail(null);
  };

  const toggleExpanded = (index) => {
    setExpandedEmail(expandedEmail === index ? null : index);
  };

  const getEmailsByUrgency = (tier) => {
    if (!results?.urgency_analysis) return [];
    return results.urgency_analysis.filter(email => 
      email.urgency_tier?.toLowerCase() === tier.toLowerCase() ||
      (tier === 'this_week' && email.urgency_tier?.toLowerCase() === 'this week') ||
      (tier === 'now' && email.urgency_tier?.toLowerCase() === 'urgent')
    );
  };

  const getCategoryIcon = (category) => {
    switch(category?.toLowerCase()) {
      case 'fyi': return <span className="text-xs">ℹ️</span>;
      case 'action required': return <span className="text-xs">🎯</span>;
      case 'response expected': return <span className="text-xs">💬</span>;
      case 'automated': return <span className="text-xs">🔔</span>;
      case 'newsletter': return <span className="text-xs">✉️</span>;
      default: return <span className="text-xs">✉️</span>;
    }
  };

  const getCategoryColor = (category) => {
    switch(category?.toLowerCase()) {
      case 'fyi': return isDark ? 'bg-blue-600' : 'bg-blue-500';
      case 'action required': return isDark ? 'bg-red-600' : 'bg-red-500';
      case 'response expected': return isDark ? 'bg-amber-600' : 'bg-amber-500';
      case 'automated': return isDark ? 'bg-gray-600' : 'bg-gray-500';
      case 'newsletter': return isDark ? 'bg-purple-600' : 'bg-purple-500';
      default: return isDark ? 'bg-zinc-600' : 'bg-gray-400';
    }
  };

  const getSenderReputation = (sender) => {
    const history = senderHistory[sender];
    if (!history || history.total < 3) return null;

    if (history.cryWolfScore > 0.5) {
      return {
        label: 'Cry Wolf',
        icon: '🐺',
        color: 'text-red-500',
        tip: 'This sender often marks things urgent when they\'re not'
      };
    } else if (history.actuallyUrgent / history.total > 0.7) {
      return {
        label: 'VIP',
        icon: '⭐',
        color: 'text-amber-500',
        tip: 'This sender\'s emails are usually important'
      };
    }
    return null;
  };

  return (
    <div className="space-y-6">
      
      {/* Enhanced Info Banner */}
      <div className={`${c.infoBox} border-l-4 rounded-r-lg p-5 transition-colors duration-200`}>
        <div className="flex items-start gap-3">
          <span className="flex-shrink-0 mt-0.5">ℹ️</span>
          <div>
            <h3 className={`font-bold mb-1 ${c.text}`}>Smart Email Triage with AI Learning</h3>
            <p className={`text-sm ${c.textSecondary}`}>
              Analyzes entire threads, learns sender patterns, detects "cry wolf" behavior, 
              and suggests optimal response times based on recipient timezones.
            </p>
          </div>
        </div>
      </div>

      {/* Sender Insights Toggle */}
      {Object.keys(senderHistory).length > 0 && (
        <div className={`${c.purpleBox} border-l-4 rounded-r-lg p-4 transition-colors duration-200`}>
          <button
            onClick={() => setShowSenderInsights(!showSenderInsights)}
            className={`flex items-center gap-2 w-full ${c.text}`}
          >
            <span>📈</span>
            <span className="font-semibold">
              Sender Learning Active ({Object.keys(senderHistory).length} senders tracked)
            </span>
            {showSenderInsights ? <span className="ml-auto">▲</span> : <span className="ml-auto">▼</span>}
          </button>
          
          {showSenderInsights && (
            <div className="mt-3 space-y-2">
              {Object.entries(senderHistory)
                .sort((a, b) => b[1].total - a[1].total)
                .slice(0, 5)
                .map(([sender, data]) => (
                  <div key={sender} className={`p-2 rounded ${isDark ? 'bg-zinc-700' : 'bg-white'} text-xs`}>
                    <div className="flex items-center justify-between">
                      <span className={`font-medium ${c.text}`}>{sender}</span>
                      <div className="flex items-center gap-2">
                        {data.cryWolfScore > 0.5 && <span title="Cry Wolf">🐺</span>}
                        {data.actuallyUrgent / data.total > 0.7 && <span title="VIP">⭐</span>}
                      </div>
                    </div>
                    <div className={`text-xs mt-1 ${c.textSecondary}`}>
                      {data.total} emails • {data.actuallyUrgent} actually urgent • Cry Wolf: {Math.round(data.cryWolfScore * 100)}%
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Input Form */}
      <div className={`${c.card} border rounded-xl shadow-sm p-6 transition-colors duration-200`}>
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className={`p-3 rounded-lg ${isDark ? 'bg-emerald-900/30' : 'bg-emerald-100'}`}>
            <span className="text-xl">✉️</span>
          </div>
          <div>
            <h2 className={`text-xl font-bold ${c.text}`}>Smart Email Urgency Analysis</h2>
            <p className={`text-sm ${c.textMuted}`}>With thread intelligence & sender learning</p>
          </div>
        </div>

        {/* User Role */}
        <div className="mb-6">
          <label htmlFor="user-role" className={`block text-sm font-medium ${c.label} mb-2`}>
            Your role/context
          </label>
          <select
            id="user-role"
            value={userRole}
            onChange={(e) => setUserRole(e.target.value)}
            className={`w-full p-3 border rounded-lg ${c.input} outline-none focus:ring-2 transition-colors duration-200`}
          >
            {roleOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        {/* Timezone */}
        <div className="mb-6">
          <label htmlFor="timezone" className={`block text-sm font-medium ${c.label} mb-2 flex items-center gap-2`}>
            <span>🌍</span>
            Your timezone
          </label>
          <input
            id="timezone"
            type="text"
            value={userTimezone}
            onChange={(e) => setUserTimezone(e.target.value)}
            className={`w-full p-3 border rounded-lg ${c.input} outline-none focus:ring-2 transition-colors duration-200`}
            placeholder="e.g., America/New_York, Europe/London"
          />
          <p className={`text-xs ${c.textMuted} mt-1`}>
            Used to suggest optimal response times
          </p>
        </div>

        {/* Email Content */}
        <div className="mb-6">
          <label htmlFor="email-content" className={`block text-sm font-medium ${c.label} mb-2`}>
            Paste your emails (including full threads)
          </label>
          <textarea
            id="email-content"
            value={emailContent}
            onChange={(e) => setEmailContent(e.target.value)}
            placeholder={`Paste entire email threads for best analysis. I'll detect:
• Thread escalation patterns
• Whether you're on TO vs CC
• Follow-up count
• Sender urgency patterns

Example with thread:
From: client@company.com
Subject: Re: Re: Project timeline
[Previous message from you: "I'll have this by Friday"]
Thanks, but we actually need it by Wednesday now. Client moved up deadline.

---

From: newsletter@service.com
Subject: Weekly Tips
[Newsletter content...]`}
            className={`w-full p-4 border rounded-lg ${c.input} outline-none focus:ring-2 transition-colors duration-200 font-mono text-sm`}
            rows={12}
          />
          <p className={`text-xs ${c.textMuted} mt-1`}>
            💡 Include full threads for escalation detection. Separate emails with '---'
          </p>
        </div>

        {/* Analyze button */}
        <div className="flex gap-3">
          <button
            onClick={handleAnalyze}
            disabled={loading || !emailContent.trim()}
            className={`flex-1 ${c.btnPrimary} disabled:opacity-50 disabled:cursor-not-allowed font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2`}
          >
            {loading ? (
              <>
                <span className="animate-spin inline-block">⏳</span>
                Analyzing with AI...
              </>
            ) : (
              <>
                <span>⚡</span>
                Analyze Urgency
              </>
            )}
          </button>

          {results && (
            <button
              onClick={handleReset}
              className={`px-6 py-3 border-2 ${c.btnOutline} font-medium rounded-lg transition-all duration-200`}
            >
              New Batch
            </button>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className={`mt-4 p-4 ${c.warningBox} border rounded-lg flex items-start gap-3 transition-colors duration-200`} role="alert">
            <span className="flex-shrink-0 mt-0.5">⚠️</span>
            <p className="text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Results Display */}
      {results && (
        <div className="space-y-6">
          
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className={`${c.card} border rounded-xl p-4 transition-colors duration-200`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className={`text-sm ${c.textMuted}`}>Total Emails</div>
                  <div className={`text-3xl font-bold ${c.text}`}>{results.summary?.total_emails || 0}</div>
                </div>
                <span className="text-2xl">✉️</span>
              </div>
            </div>

            <div className={`${c.urgent} border rounded-xl p-4 transition-colors duration-200`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm opacity-75">Reply Now</div>
                  <div className="text-3xl font-bold">{results.summary?.urgent_count || 0}</div>
                </div>
                <span className="text-2xl opacity-75">🔴</span>
              </div>
            </div>

            <div className={`${c.thisWeek} border rounded-xl p-4 transition-colors duration-200`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm opacity-75">This Week</div>
                  <div className="text-3xl font-bold">{results.summary?.this_week_count || 0}</div>
                </div>
                <span className="text-2xl opacity-75">⏰</span>
              </div>
            </div>

            <div className={`${c.optional} border rounded-xl p-4 transition-colors duration-200`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm opacity-75">Optional</div>
                  <div className="text-3xl font-bold">{results.summary?.optional_count || 0}</div>
                </div>
                <span className="text-2xl opacity-75">☕</span>
              </div>
            </div>
          </div>

          {/* Batch Processing Insights */}
          {results.batch_insights && (
            <div className={`${c.purpleBox} border-l-4 rounded-r-lg p-5 transition-colors duration-200`}>
              <h3 className={`font-bold mb-2 flex items-center gap-2 ${c.text}`}>
                <span>⚡</span>
                Smart Batching Suggestions
              </h3>
              {results.batch_insights.similar_emails && results.batch_insights.similar_emails.length > 0 && (
                <div className="mb-3">
                  <p className={`text-sm font-semibold mb-1 ${c.textSecondary}`}>Batch these together:</p>
                  <ul className={`text-sm space-y-1 ${c.textSecondary}`}>
                    {results.batch_insights.similar_emails.map((batch, idx) => (
                      <li key={idx}>• {batch}</li>
                    ))}
                  </ul>
                </div>
              )}
              {results.batch_insights.delegation_opportunities && (
                <div>
                  <p className={`text-sm font-semibold mb-1 ${c.textSecondary}`}>Can delegate:</p>
                  <p className={`text-sm ${c.textSecondary}`}>{results.batch_insights.delegation_opportunities}</p>
                </div>
              )}
            </div>
          )}

          {/* Anxiety Relief Message */}
          {results.anxiety_relief && (
            <div className={`${c.successBox} border-l-4 rounded-r-lg p-5 transition-colors duration-200`}>
              <h3 className={`font-bold mb-2 flex items-center gap-2 ${c.text}`}>
                <span>✅</span>
                Permission to Breathe
              </h3>
              {results.anxiety_relief.permission_to_wait && (
                <p className={`text-sm mb-3 ${c.textSecondary}`}>
                  <strong>You can relax:</strong> {results.anxiety_relief.permission_to_wait}
                </p>
              )}
              {results.anxiety_relief.what_to_ignore && (
                <p className={`text-sm mb-3 ${c.textSecondary}`}>
                  <strong>What to ignore:</strong> {results.anxiety_relief.what_to_ignore}
                </p>
              )}
              {results.anxiety_relief.batch_processing_tip && (
                <p className={`text-sm ${c.textSecondary}`}>
                  <strong>💡 Tip:</strong> {results.anxiety_relief.batch_processing_tip}
                </p>
              )}
            </div>
          )}

          {/* Urgency Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Reply Now */}
            <div>
              <div className={`${c.urgent} border-2 rounded-t-xl p-4 transition-colors duration-200`}>
                <div className="flex items-center gap-2">
                  <span>⚠️</span>
                  <h3 className="font-bold text-lg">Reply Now</h3>
                </div>
                <p className="text-sm opacity-75 mt-1">Needs response today</p>
              </div>
              <div className="space-y-3 mt-3">
                {getEmailsByUrgency('now').length === 0 ? (
                  <div className={`${c.cardAlt} border rounded-lg p-4 text-center transition-colors duration-200`}>
                    <span className="text-2xl mx-auto mb-2">✅</span>
                    <p className={`text-sm ${c.textMuted}`}>Nothing urgent! 🎉</p>
                  </div>
                ) : (
                  getEmailsByUrgency('now').map((email, idx) => {
                    const reputation = getSenderReputation(email.from);
                    
                    return (
                      <div key={idx} className={`${c.card} border-2 border-red-400 rounded-lg p-4 transition-colors duration-200`}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {email.email_category && (
                                <span className={`px-2 py-0.5 rounded text-xs font-semibold text-white flex items-center gap-1 ${getCategoryColor(email.email_category)}`}>
                                  {getCategoryIcon(email.email_category)}
                                  {email.email_category}
                                </span>
                              )}
                              {reputation && (
                                <span className={`text-xs ${reputation.color}`} title={reputation.tip}>
                                  {reputation.icon} {reputation.label}
                                </span>
                              )}
                            </div>
                            <div className={`text-sm font-semibold ${c.text}`}>{email.email_subject}</div>
                            <div className={`text-xs ${c.textMuted} mt-1`}>From: {email.from}</div>
                            
                            {/* Thread indicators */}
                            {email.thread_analysis && (
                              <div className="flex items-center gap-2 mt-2 text-xs">
                                {email.thread_analysis.is_escalating && (
                                  <span className="text-red-500 font-semibold flex items-center gap-1">
                                    <span className="text-xs">📈</span> Escalating
                                  </span>
                                )}
                                {email.thread_analysis.follow_up_count > 0 && (
                                  <span className="opacity-75">
                                    {email.thread_analysis.follow_up_count} follow-ups
                                  </span>
                                )}
                                {email.thread_analysis.on_cc && (
                                  <span className="opacity-75">(CC)</span>
                                )}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => toggleExpanded(idx + '-now')}
                            className={`p-1 rounded ${c.btnSecondary}`}
                          >
                            {expandedEmail === idx + '-now' ? <span>▲</span> : <span>▼</span>}
                          </button>
                        </div>
                        
                        {email.deadline_detected && (
                          <div className="flex items-center gap-2 text-xs mb-2">
                            <span className="text-xs">📅</span>
                            <span className="font-medium">Deadline: {email.deadline_detected}</span>
                          </div>
                        )}
                        
                        {expandedEmail === idx + '-now' && (
                          <div className="mt-3 pt-3 border-t space-y-2">
                            <div>
                              <div className="text-xs font-semibold mb-1">Why urgent:</div>
                              <p className="text-xs">{email.reasoning}</p>
                            </div>
                            {email.consequence_of_delay && (
                              <div>
                                <div className="text-xs font-semibold mb-1">If you wait:</div>
                                <p className="text-xs">{email.consequence_of_delay}</p>
                              </div>
                            )}
                            {email.thread_analysis?.urgency_trend && (
                              <div>
                                <div className="text-xs font-semibold mb-1">Thread pattern:</div>
                                <p className="text-xs">{email.thread_analysis.urgency_trend}</p>
                              </div>
                            )}
                            {email.response_optimization && (
                              <div className="text-xs bg-red-100 dark:bg-red-900/30 p-2 rounded space-y-1">
                                <div><strong>Best time to respond:</strong> {email.response_optimization.best_time}</div>
                                {email.response_optimization.recipient_timezone && (
                                  <div className="text-xs opacity-75">
                                    (Recipient timezone: {email.response_optimization.recipient_timezone})
                                  </div>
                                )}
                                {email.response_optimization.estimated_time && (
                                  <div><strong>Time needed:</strong> {email.response_optimization.estimated_time}</div>
                                )}
                                {email.response_optimization.can_delegate && (
                                  <div className="text-xs mt-1 pt-1 border-t border-red-300 dark:border-red-700">
                                    💡 Can delegate to: {email.response_optimization.delegate_to}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Reply This Week - Similar structure */}
            <div>
              <div className={`${c.thisWeek} border-2 rounded-t-xl p-4 transition-colors duration-200`}>
                <div className="flex items-center gap-2">
                  <span>⏰</span>
                  <h3 className="font-bold text-lg">Reply This Week</h3>
                </div>
                <p className="text-sm opacity-75 mt-1">Can wait a few days</p>
              </div>
              <div className="space-y-3 mt-3">
                {getEmailsByUrgency('this_week').length === 0 ? (
                  <div className={`${c.cardAlt} border rounded-lg p-4 text-center transition-colors duration-200`}>
                    <span className="text-2xl mx-auto mb-2">⏰</span>
                    <p className={`text-sm ${c.textMuted}`}>Nothing here</p>
                  </div>
                ) : (
                  getEmailsByUrgency('this_week').map((email, idx) => {
                    const reputation = getSenderReputation(email.from);
                    
                    return (
                      <div key={idx} className={`${c.card} border-2 border-amber-400 rounded-lg p-4 transition-colors duration-200`}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {email.email_category && (
                                <span className={`px-2 py-0.5 rounded text-xs font-semibold text-white flex items-center gap-1 ${getCategoryColor(email.email_category)}`}>
                                  {getCategoryIcon(email.email_category)}
                                  {email.email_category}
                                </span>
                              )}
                              {reputation && (
                                <span className={`text-xs ${reputation.color}`} title={reputation.tip}>
                                  {reputation.icon}
                                </span>
                              )}
                            </div>
                            <div className={`text-sm font-semibold ${c.text}`}>{email.email_subject}</div>
                            <div className={`text-xs ${c.textMuted} mt-1`}>From: {email.from}</div>
                          </div>
                          <button
                            onClick={() => toggleExpanded(idx + '-week')}
                            className={`p-1 rounded ${c.btnSecondary}`}
                          >
                            {expandedEmail === idx + '-week' ? <span>▲</span> : <span>▼</span>}
                          </button>
                        </div>
                        
                        {expandedEmail === idx + '-week' && (
                          <div className="mt-3 pt-3 border-t space-y-2">
                            <div>
                              <div className="text-xs font-semibold mb-1">Why this week:</div>
                              <p className="text-xs">{email.reasoning}</p>
                            </div>
                            {email.response_optimization && (
                              <div className="text-xs bg-amber-100 dark:bg-amber-900/30 p-2 rounded">
                                <div><strong>Best time:</strong> {email.response_optimization.best_time}</div>
                                {email.response_optimization.estimated_time && (
                                  <div><strong>Time needed:</strong> {email.response_optimization.estimated_time}</div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Optional/Never */}
            <div>
              <div className={`${c.optional} border-2 rounded-t-xl p-4 transition-colors duration-200`}>
                <div className="flex items-center gap-2">
                  <span>☕</span>
                  <h3 className="font-bold text-lg">Optional/Never</h3>
                </div>
                <p className="text-sm opacity-75 mt-1">No response needed</p>
              </div>
              <div className="space-y-3 mt-3">
                {getEmailsByUrgency('optional').length === 0 ? (
                  <div className={`${c.cardAlt} border rounded-lg p-4 text-center transition-colors duration-200`}>
                    <span className="text-2xl mx-auto mb-2">☕</span>
                    <p className={`text-sm ${c.textMuted}`}>Nothing here</p>
                  </div>
                ) : (
                  getEmailsByUrgency('optional').map((email, idx) => (
                    <div key={idx} className={`${c.card} border-2 border-emerald-400 rounded-lg p-4 transition-colors duration-200`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          {email.email_category && (
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold text-white flex items-center gap-1 mb-1 inline-flex ${getCategoryColor(email.email_category)}`}>
                              {getCategoryIcon(email.email_category)}
                              {email.email_category}
                            </span>
                          )}
                          <div className={`text-sm font-semibold ${c.text}`}>{email.email_subject}</div>
                          <div className={`text-xs ${c.textMuted} mt-1`}>From: {email.from}</div>
                        </div>
                        <button
                          onClick={() => toggleExpanded(idx + '-optional')}
                          className={`p-1 rounded ${c.btnSecondary}`}
                        >
                          {expandedEmail === idx + '-optional' ? <span>▲</span> : <span>▼</span>}
                        </button>
                      </div>
                      
                      {expandedEmail === idx + '-optional' && (
                        <div className="mt-3 pt-3 border-t space-y-2">
                          <div>
                            <div className="text-xs font-semibold mb-1">Why optional:</div>
                            <p className="text-xs">{email.reasoning}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs">📥</span>
                            <span className="text-xs">Safe to archive or ignore</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Response Templates */}
          {results.response_templates && results.response_templates.length > 0 && (
            <div className={`${c.card} border rounded-xl p-6 transition-colors duration-200`}>
              <h3 className={`text-lg font-bold ${c.text} mb-4 flex items-center gap-2`}>
                <span>⚡</span>
                Quick Response Templates
              </h3>
              <div className="space-y-3">
                {results.response_templates.map((template, idx) => (
                  <div key={idx} className={`p-4 rounded-lg ${isDark ? 'bg-zinc-700' : 'bg-emerald-50'} border ${isDark ? 'border-zinc-600' : 'border-emerald-200'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className={`text-xs font-semibold uppercase ${c.textMuted}`}>
                        For: {template.for_urgency}
                      </div>
                      <CopyBtn content={template.template} />
                    </div>
                    <p className={`text-sm ${c.textSecondary}`}>{template.template}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EmailUrgencyTriager;
