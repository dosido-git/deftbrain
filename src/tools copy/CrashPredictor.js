import React, { useState, useEffect } from 'react';
import { Battery, TrendingDown, AlertTriangle, Moon, Activity, Loader2, Calendar, Check, X, Save, ChevronDown, ChevronUp, BarChart3, Clock } from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';

const CrashPredictor = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Theme-aware colors (warning red/orange)
  const c = {
    bg: isDark ? 'bg-zinc-900' : 'bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50',
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
    
    urgent: isDark
      ? 'bg-red-900/30 border-red-700 text-red-200'
      : 'bg-red-100 border-red-400 text-red-900',
    high: isDark
      ? 'bg-orange-900/30 border-orange-700 text-orange-200'
      : 'bg-orange-100 border-orange-400 text-orange-900',
    moderate: isDark
      ? 'bg-yellow-900/30 border-yellow-700 text-yellow-200'
      : 'bg-yellow-100 border-yellow-400 text-yellow-900',
    low: isDark
      ? 'bg-green-900/30 border-green-700 text-green-200'
      : 'bg-green-100 border-green-400 text-green-900',
  };

  // Mode
  const [mode, setMode] = useState('checkin'); // 'checkin' or 'analysis'

  // Daily check-in state
  const [currentEntry, setCurrentEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    energy: 5,
    sleep: 5,
    stress: 5,
    activities: {
      work: false,
      social: false,
      exercise: false,
      rest: false,
      obligations: false,
    },
    physicalSymptoms: {
      headache: false,
      fatigue: false,
      tension: false,
      appetiteChanges: false,
      sleepIssues: false,
    },
    warningSigns: {
      irritability: false,
      brainFog: false,
      difficultyDeciding: false,
      cryingEasily: false,
      withdrawing: false,
    },
  });

  // Stored logs (localStorage)
  const [logs, setLogs] = useState([]);

  // Analysis results
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    pattern: true,
    warnings: true,
    interventions: true,
    capacity: true,
    crashed: false,
    interoception: true,
  });
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load logs from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('crashPredictorLogs');
    if (stored) {
      setLogs(JSON.parse(stored));
    }
  }, []);

  // Save log entry
  const handleSaveEntry = () => {
    const newLog = {
      ...currentEntry,
      timestamp: new Date().toISOString(),
    };

    // Check if entry for today already exists
    const existingIndex = logs.findIndex(log => log.date === currentEntry.date);
    let updatedLogs;
    
    if (existingIndex >= 0) {
      // Update existing entry
      updatedLogs = [...logs];
      updatedLogs[existingIndex] = newLog;
    } else {
      // Add new entry
      updatedLogs = [...logs, newLog];
    }

    // Sort by date (newest first)
    updatedLogs.sort((a, b) => new Date(b.date) - new Date(a.date));

    setLogs(updatedLogs);
    localStorage.setItem('crashPredictorLogs', JSON.stringify(updatedLogs));
    
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  // Analyze patterns
  const handleAnalyze = async () => {
    if (logs.length < 3) {
      setError('Need at least 3 days of logs for pattern analysis. Keep checking in!');
      return;
    }

    setError('');
    setAnalysis(null);

    try {
      const data = await callToolEndpoint('crash-predictor-analyze', {
        logs: logs.slice(0, 30), // Last 30 days max
      });
      
      setAnalysis(data);
      setMode('analysis');
      setExpandedSections(prev => ({
        ...prev,
        pattern: true,
        warnings: true,
        interventions: true,
        capacity: true,
        interoception: true,
      }));
    } catch (err) {
      setError(err.message || 'Failed to analyze patterns. Please try again.');
    }
  };

  // Quick crash check
  const handleQuickCheck = () => {
    if (logs.length === 0) {
      setError('No logs yet. Complete a daily check-in first!');
      return;
    }

    // Use last 3 entries for quick check
    const recentLogs = logs.slice(0, 3);
    const avgEnergy = recentLogs.reduce((sum, log) => sum + log.energy, 0) / recentLogs.length;
    const avgSleep = recentLogs.reduce((sum, log) => sum + log.sleep, 0) / recentLogs.length;
    const avgStress = recentLogs.reduce((sum, log) => sum + log.stress, 0) / recentLogs.length;

    let message = '';
    if (avgEnergy < 4 || avgSleep < 5 || avgStress > 7) {
      message = '⚠️ Quick check shows concerning patterns. Run full analysis for details.';
    } else if (avgEnergy < 6 || avgSleep < 6 || avgStress > 6) {
      message = '⚠️ Moderate concerns detected. Consider running full analysis.';
    } else {
      message = '✓ Recent patterns look stable. Keep monitoring.';
    }

    alert(message);
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getEnergyEmoji = (level) => {
    if (level >= 9) return '🔋';
    if (level >= 7) return '😊';
    if (level >= 5) return '😐';
    if (level >= 3) return '😓';
    return '🪫';
  };

  const getRiskColor = (level) => {
    switch(level) {
      case 'high': return c.urgent;
      case 'moderate': return c.high;
      case 'low': return c.low;
      default: return c.moderate;
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'urgent': return c.urgent;
      case 'high': return c.high;
      case 'medium': return c.moderate;
      default: return c.low;
    }
  };

  return (
    <div className={`min-h-screen ${c.bg} py-8 px-4`}>
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className={`${c.card} border rounded-xl shadow-lg p-6 transition-colors duration-200`}>
          <div className="flex items-center gap-3 mb-4">
            <div>
              <h2 className={`text-2xl font-bold ${c.text}`}>Crash Predictor ⚠️</h2>
              <p className={`text-sm ${c.textMuted}`}>Track patterns and prevent burnout before it happens</p>
            </div>
          </div>

          {/* Important Info */}
          <div className={`${c.urgent} border-l-4 rounded-r-lg p-4`}>
            <div className="flex items-start gap-2">
              <Battery className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-sm mb-1">For People Who Push Through Everything</h3>
                <p className="text-xs">
                  This tool recognizes YOUR crash patterns before YOU do. It's for people who mask symptoms, 
                  have poor interoception, or can't trust their own assessment. Let the data speak.
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            <div className={`${c.cardAlt} border rounded-lg p-3`}>
              <p className={`text-xs ${c.textMuted}`}>Days Logged</p>
              <p className={`text-2xl font-bold ${c.text}`}>{logs.length}</p>
            </div>
            <div className={`${c.cardAlt} border rounded-lg p-3`}>
              <p className={`text-xs ${c.textMuted}`}>Today's Check-in</p>
              <p className={`text-2xl font-bold ${c.text}`}>
                {logs.some(l => l.date === new Date().toISOString().split('T')[0]) ? '✓' : '—'}
              </p>
            </div>
            <div className={`${c.cardAlt} border rounded-lg p-3`}>
              <p className={`text-xs ${c.textMuted}`}>Streak</p>
              <p className={`text-2xl font-bold ${c.text}`}>{logs.length > 0 ? '🔥' : '—'}</p>
            </div>
            <div className={`${c.cardAlt} border rounded-lg p-3`}>
              <button
                onClick={handleQuickCheck}
                className={`text-xs ${c.btnSecondary} px-3 py-1 rounded w-full`}
              >
                Quick Check
              </button>
            </div>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className={`${c.card} border rounded-xl shadow-lg p-6`}>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setMode('checkin')}
              className={`p-4 border-2 rounded-lg transition-colors ${
                mode === 'checkin'
                  ? isDark
                    ? 'border-red-500 bg-red-900/20'
                    : 'border-red-500 bg-red-50'
                  : isDark
                    ? 'border-zinc-700 hover:border-zinc-600'
                    : 'border-red-200 hover:border-red-300'
              }`}
            >
              <Calendar className={`w-6 h-6 mx-auto mb-2 ${mode === 'checkin' ? 'text-red-600' : c.textMuted}`} />
              <h4 className={`font-semibold ${c.text} mb-1`}>Daily Check-In</h4>
              <p className={`text-xs ${c.textMuted}`}>Log today's status</p>
            </button>
            
            <button
              onClick={() => setMode('analysis')}
              disabled={logs.length < 3}
              className={`p-4 border-2 rounded-lg transition-colors ${
                mode === 'analysis'
                  ? isDark
                    ? 'border-red-500 bg-red-900/20'
                    : 'border-red-500 bg-red-50'
                  : isDark
                    ? 'border-zinc-700 hover:border-zinc-600'
                    : 'border-red-200 hover:border-red-300'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <BarChart3 className={`w-6 h-6 mx-auto mb-2 ${mode === 'analysis' ? 'text-red-600' : c.textMuted}`} />
              <h4 className={`font-semibold ${c.text} mb-1`}>Pattern Analysis</h4>
              <p className={`text-xs ${c.textMuted}`}>
                {logs.length < 3 ? `Need ${3 - logs.length} more days` : 'View trends'}
              </p>
            </button>
          </div>
        </div>

        {/* Daily Check-In Mode */}
        {mode === 'checkin' && (
          <div className={`${c.card} border rounded-xl shadow-lg p-6`}>
            <h3 className={`text-lg font-bold ${c.text} mb-4`}>Today's Check-In</h3>
            
            <div className="space-y-6">
              
              {/* Energy Level */}
              <div>
                <label className={`block text-sm font-medium ${c.label} mb-2 flex items-center justify-between`}>
                  <span>Energy Level {getEnergyEmoji(currentEntry.energy)}</span>
                  <span className={`text-2xl font-bold ${c.text}`}>{currentEntry.energy}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={currentEntry.energy}
                  onChange={(e) => setCurrentEntry(prev => ({ ...prev, energy: Number(e.target.value) }))}
                  className="w-full h-2 bg-red-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs mt-1">
                  <span className={c.textMuted}>Depleted</span>
                  <span className={c.textMuted}>Full</span>
                </div>
              </div>

              {/* Sleep Quality */}
              <div>
                <label className={`block text-sm font-medium ${c.label} mb-2 flex items-center justify-between`}>
                  <span>Sleep Quality 😴</span>
                  <span className={`text-2xl font-bold ${c.text}`}>{currentEntry.sleep}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={currentEntry.sleep}
                  onChange={(e) => setCurrentEntry(prev => ({ ...prev, sleep: Number(e.target.value) }))}
                  className="w-full h-2 bg-red-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs mt-1">
                  <span className={c.textMuted}>Terrible</span>
                  <span className={c.textMuted}>Excellent</span>
                </div>
              </div>

              {/* Stress Level */}
              <div>
                <label className={`block text-sm font-medium ${c.label} mb-2 flex items-center justify-between`}>
                  <span>Stress Level 😰</span>
                  <span className={`text-2xl font-bold ${c.text}`}>{currentEntry.stress}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={currentEntry.stress}
                  onChange={(e) => setCurrentEntry(prev => ({ ...prev, stress: Number(e.target.value) }))}
                  className="w-full h-2 bg-red-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs mt-1">
                  <span className={c.textMuted}>None</span>
                  <span className={c.textMuted}>Extreme</span>
                </div>
              </div>

              {/* Activities */}
              <div>
                <label className={`block text-sm font-medium ${c.label} mb-3`}>
                  Activities today
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { key: 'work', label: 'Work', icon: '💼' },
                    { key: 'social', label: 'Social', icon: '👥' },
                    { key: 'exercise', label: 'Exercise', icon: '💪' },
                    { key: 'rest', label: 'Rest', icon: '🛋️' },
                    { key: 'obligations', label: 'Obligations', icon: '📋' },
                  ].map(({ key, label, icon }) => (
                    <label
                      key={key}
                      className={`flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                        currentEntry.activities[key]
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
                        checked={currentEntry.activities[key]}
                        onChange={() => setCurrentEntry(prev => ({
                          ...prev,
                          activities: {
                            ...prev.activities,
                            [key]: !prev.activities[key]
                          }
                        }))}
                        className="w-4 h-4 text-red-600 rounded focus:ring-2 focus:ring-red-500"
                      />
                      <span className="text-sm">{icon} {label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Physical Symptoms */}
              <div>
                <label className={`block text-sm font-medium ${c.label} mb-3`}>
                  Physical symptoms
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { key: 'headache', label: 'Headache' },
                    { key: 'fatigue', label: 'Fatigue' },
                    { key: 'tension', label: 'Tension' },
                    { key: 'appetiteChanges', label: 'Appetite changes' },
                    { key: 'sleepIssues', label: 'Sleep issues' },
                  ].map(({ key, label }) => (
                    <label
                      key={key}
                      className={`flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                        currentEntry.physicalSymptoms[key]
                          ? isDark
                            ? 'border-orange-500 bg-orange-900/20'
                            : 'border-orange-500 bg-orange-50'
                          : isDark
                            ? 'border-zinc-700 hover:border-zinc-600'
                            : 'border-red-200 hover:border-red-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={currentEntry.physicalSymptoms[key]}
                        onChange={() => setCurrentEntry(prev => ({
                          ...prev,
                          physicalSymptoms: {
                            ...prev.physicalSymptoms,
                            [key]: !prev.physicalSymptoms[key]
                          }
                        }))}
                        className="w-4 h-4 text-orange-600 rounded focus:ring-2 focus:ring-orange-500"
                      />
                      <span className="text-sm">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Warning Signs */}
              <div>
                <label className={`block text-sm font-medium ${c.label} mb-3`}>
                  Warning signs (emotional/cognitive)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'irritability', label: 'Irritability' },
                    { key: 'brainFog', label: 'Brain fog' },
                    { key: 'difficultyDeciding', label: 'Difficulty deciding' },
                    { key: 'cryingEasily', label: 'Crying easily' },
                    { key: 'withdrawing', label: 'Withdrawing' },
                  ].map(({ key, label }) => (
                    <label
                      key={key}
                      className={`flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                        currentEntry.warningSigns[key]
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
                        checked={currentEntry.warningSigns[key]}
                        onChange={() => setCurrentEntry(prev => ({
                          ...prev,
                          warningSigns: {
                            ...prev.warningSigns,
                            [key]: !prev.warningSigns[key]
                          }
                        }))}
                        className="w-4 h-4 text-red-600 rounded focus:ring-2 focus:ring-red-500"
                      />
                      <span className="text-sm">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleSaveEntry}
                  className={`flex-1 ${c.btnPrimary} py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2`}
                >
                  <Save className="w-5 h-5" />
                  {saveSuccess ? 'Saved!' : 'Save Check-In'}
                </button>
                
                {logs.length >= 3 && (
                  <button
                    onClick={handleAnalyze}
                    disabled={loading}
                    className={`${c.btnSecondary} py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2`}
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <BarChart3 className="w-5 h-5" />}
                    Analyze
                  </button>
                )}
              </div>

              {saveSuccess && (
                <div className={`${c.low} border rounded-lg p-3 text-center`}>
                  <p className="text-sm font-semibold">✓ Check-in saved! Keep tracking daily.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Analysis Results */}
        {mode === 'analysis' && analysis && (
          <div className="space-y-6">
            
            {/* Burnout Risk Assessment */}
            {analysis.burnout_risk_assessment && (
              <div className={`${c.card} border rounded-xl shadow-lg p-6`}>
                <h3 className={`text-xl font-bold ${c.text} mb-4`}>Burnout Risk Assessment</h3>
                
                <div className={`${getRiskColor(analysis.burnout_risk_assessment.current_risk_level)} border-2 rounded-xl p-6 mb-4`}>
                  <div className="text-center">
                    <p className="text-sm font-medium mb-2">Current Risk Level</p>
                    <p className="text-4xl font-bold uppercase mb-2">
                      {analysis.burnout_risk_assessment.current_risk_level}
                    </p>
                    {analysis.burnout_risk_assessment.confidence && (
                      <p className="text-sm opacity-75">
                        {analysis.burnout_risk_assessment.confidence}% confidence
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {analysis.burnout_risk_assessment.days_until_likely_crash && (
                    <div className={`${c.cardAlt} border rounded-lg p-4`}>
                      <p className={`text-xs ${c.textMuted} mb-1`}>Days Until Likely Crash</p>
                      <p className={`text-3xl font-bold ${c.text}`}>
                        {analysis.burnout_risk_assessment.days_until_likely_crash}
                      </p>
                    </div>
                  )}
                  {analysis.burnout_risk_assessment.trajectory && (
                    <div className={`${c.cardAlt} border rounded-lg p-4`}>
                      <p className={`text-xs ${c.textMuted} mb-1`}>Trajectory</p>
                      <p className={`text-lg font-bold ${c.text} capitalize`}>
                        {analysis.burnout_risk_assessment.trajectory}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Crash Pattern */}
            {analysis.your_crash_pattern && (
              <div className={`${c.card} border rounded-xl shadow-lg p-6`}>
                <button
                  onClick={() => toggleSection('pattern')}
                  className="flex items-center gap-2 mb-4 w-full"
                >
                  <TrendingDown className="w-5 h-5" />
                  <h3 className={`text-xl font-bold ${c.text}`}>Your Crash Pattern</h3>
                  {expandedSections.pattern ? (
                    <ChevronUp className="w-5 h-5 ml-auto" />
                  ) : (
                    <ChevronDown className="w-5 h-5 ml-auto" />
                  )}
                </button>

                {expandedSections.pattern && (
                  <div className="space-y-4">
                    {analysis.your_crash_pattern.pattern_recognition && (
                      <div className={`${c.urgent} border rounded-lg p-4`}>
                        <h4 className="font-semibold mb-2">Pattern Recognition:</h4>
                        <p className="text-sm">{analysis.your_crash_pattern.pattern_recognition}</p>
                      </div>
                    )}

                    {analysis.your_crash_pattern.identified_indicators && 
                     analysis.your_crash_pattern.identified_indicators.length > 0 && (
                      <div className={`${c.cardAlt} border rounded-lg p-4`}>
                        <h4 className={`font-semibold ${c.text} mb-3`}>Your Crash Indicators:</h4>
                        <ul className="space-y-2">
                          {analysis.your_crash_pattern.identified_indicators.map((indicator, idx) => (
                            <li key={idx} className={`text-sm ${c.textSecondary} flex items-start gap-2`}>
                              <span className="text-red-500 mt-0.5">⚠️</span>
                              <span>{indicator}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {analysis.your_crash_pattern.current_status && (
                      <div className={`${c.cardAlt} border rounded-lg p-4`}>
                        <h4 className={`font-semibold ${c.text} mb-3`}>Current Status:</h4>
                        <div className="space-y-2 text-sm">
                          {Object.entries(analysis.your_crash_pattern.current_status).map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between">
                              <span className="capitalize">{key}:</span>
                              <span className={`font-semibold ${value.includes('below') || value.includes('deficit') ? 'text-red-600' : ''}`}>
                                {value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Warning Signs Present */}
            {analysis.warning_signs_present && analysis.warning_signs_present.length > 0 && (
              <div className={`${c.card} border rounded-xl shadow-lg p-6`}>
                <button
                  onClick={() => toggleSection('warnings')}
                  className="flex items-center gap-2 mb-4 w-full"
                >
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <h3 className={`text-xl font-bold ${c.text}`}>Warning Signs Present</h3>
                  {expandedSections.warnings ? (
                    <ChevronUp className="w-5 h-5 ml-auto" />
                  ) : (
                    <ChevronDown className="w-5 h-5 ml-auto" />
                  )}
                </button>

                {expandedSections.warnings && (
                  <div className="space-y-3">
                    {analysis.warning_signs_present.map((warning, idx) => (
                      <div key={idx} className={`${c.high} border rounded-lg p-4`}>
                        <h4 className="font-bold mb-2">{warning.sign}</h4>
                        {warning.your_typical_timeline && (
                          <p className="text-sm mb-1">
                            <strong>Your timeline:</strong> {warning.your_typical_timeline}
                          </p>
                        )}
                        {warning.current_status && (
                          <p className="text-sm">
                            <strong>Status:</strong> {warning.current_status}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Preventive Interventions */}
            {analysis.preventive_interventions && analysis.preventive_interventions.length > 0 && (
              <div className={`${c.card} border rounded-xl shadow-lg p-6`}>
                <button
                  onClick={() => toggleSection('interventions')}
                  className="flex items-center gap-2 mb-4 w-full"
                >
                  <Activity className="w-5 h-5" />
                  <h3 className={`text-xl font-bold ${c.text}`}>Preventive Actions (Do These Now)</h3>
                  {expandedSections.interventions ? (
                    <ChevronUp className="w-5 h-5 ml-auto" />
                  ) : (
                    <ChevronDown className="w-5 h-5 ml-auto" />
                  )}
                </button>

                {expandedSections.interventions && (
                  <div className="space-y-4">
                    {analysis.preventive_interventions.map((intervention, idx) => (
                      <div key={idx} className={`${getPriorityColor(intervention.priority)} border-2 rounded-lg p-4`}>
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-bold text-lg">{intervention.action}</h4>
                          <span className="text-xs px-2 py-1 rounded bg-black/10 uppercase font-semibold">
                            {intervention.priority}
                          </span>
                        </div>

                        {intervention.why && (
                          <p className="text-sm mb-2">
                            <strong>Why:</strong> {intervention.why}
                          </p>
                        )}

                        {intervention.how && (
                          <p className="text-sm mb-2">
                            <strong>How:</strong> {intervention.how}
                          </p>
                        )}

                        {intervention.when && (
                          <p className="text-sm mb-2">
                            <strong>When:</strong> {intervention.when}
                          </p>
                        )}

                        {intervention.resistance_you_might_feel && (
                          <p className="text-sm mb-2">
                            <strong>Resistance you might feel:</strong> {intervention.resistance_you_might_feel}
                          </p>
                        )}

                        {intervention.reframe && (
                          <div className="bg-black/10 rounded p-3 mt-3">
                            <p className="text-sm font-semibold">💭 Reframe: {intervention.reframe}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Capacity Reality Check */}
            {analysis.capacity_reality_check && (
              <div className={`${c.card} border rounded-xl shadow-lg p-6`}>
                <button
                  onClick={() => toggleSection('capacity')}
                  className="flex items-center gap-2 mb-4 w-full"
                >
                  <Battery className="w-5 h-5" />
                  <h3 className={`text-xl font-bold ${c.text}`}>Capacity Reality Check</h3>
                  {expandedSections.capacity ? (
                    <ChevronUp className="w-5 h-5 ml-auto" />
                  ) : (
                    <ChevronDown className="w-5 h-5 ml-auto" />
                  )}
                </button>

                {expandedSections.capacity && (
                  <div className="space-y-3">
                    {analysis.capacity_reality_check.your_current_capacity && (
                      <div className={`${c.high} border rounded-lg p-4`}>
                        <p className="font-bold mb-2">Your Current Capacity:</p>
                        <p className="text-lg">{analysis.capacity_reality_check.your_current_capacity}</p>
                      </div>
                    )}

                    {analysis.capacity_reality_check.what_this_means && (
                      <div className={`${c.cardAlt} border rounded-lg p-4`}>
                        <p className={`text-sm ${c.textSecondary}`}>
                          <strong>What this means:</strong> {analysis.capacity_reality_check.what_this_means}
                        </p>
                      </div>
                    )}

                    {analysis.capacity_reality_check.permission && (
                      <div className={`${c.low} border rounded-lg p-4`}>
                        <p className="text-sm font-semibold">
                          ✓ {analysis.capacity_reality_check.permission}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* If You're Already Crashed */}
            {analysis.if_youre_already_crashed && (
              <div className={`${c.card} border rounded-xl shadow-lg p-6`}>
                <button
                  onClick={() => toggleSection('crashed')}
                  className="flex items-center gap-2 mb-4 w-full"
                >
                  <X className="w-5 h-5" />
                  <h3 className={`text-xl font-bold ${c.text}`}>If You're Already Crashed</h3>
                  {expandedSections.crashed ? (
                    <ChevronUp className="w-5 h-5 ml-auto" />
                  ) : (
                    <ChevronDown className="w-5 h-5 ml-auto" />
                  )}
                </button>

                {expandedSections.crashed && (
                  <div className="space-y-4">
                    {analysis.if_youre_already_crashed.recognition && (
                      <div className={`${c.urgent} border rounded-lg p-4`}>
                        <p className="font-semibold">{analysis.if_youre_already_crashed.recognition}</p>
                      </div>
                    )}

                    {analysis.if_youre_already_crashed.immediate_actions && 
                     analysis.if_youre_already_crashed.immediate_actions.length > 0 && (
                      <div className={`${c.cardAlt} border rounded-lg p-4`}>
                        <h4 className={`font-semibold ${c.text} mb-3`}>Immediate Actions:</h4>
                        <ul className="space-y-1">
                          {analysis.if_youre_already_crashed.immediate_actions.map((action, idx) => (
                            <li key={idx} className={`text-sm ${c.textSecondary}`}>• {action}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {analysis.if_youre_already_crashed.recovery_timeline && (
                      <div className={`${c.cardAlt} border rounded-lg p-4`}>
                        <p className={`text-sm ${c.textSecondary}`}>
                          <strong>Recovery timeline:</strong> {analysis.if_youre_already_crashed.recovery_timeline}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Poor Interoception Support */}
            {analysis.poor_interoception_support && (
              <div className={`${c.card} border rounded-xl shadow-lg p-6`}>
                <button
                  onClick={() => toggleSection('interoception')}
                  className="flex items-center gap-2 mb-4 w-full"
                >
                  <Check className="w-5 h-5" />
                  <h3 className={`text-xl font-bold ${c.text}`}>Trust the Data (Not Your Feelings)</h3>
                  {expandedSections.interoception ? (
                    <ChevronUp className="w-5 h-5 ml-auto" />
                  ) : (
                    <ChevronDown className="w-5 h-5 ml-auto" />
                  )}
                </button>

                {expandedSections.interoception && (
                  <div className={`${c.high} border rounded-lg p-4`}>
                    {analysis.poor_interoception_support.objective_data && (
                      <p className="text-sm mb-3">
                        <strong>Objective Data:</strong> {analysis.poor_interoception_support.objective_data}
                      </p>
                    )}
                    {analysis.poor_interoception_support.trust_the_data && (
                      <p className="text-sm font-semibold">
                        ⚠️ {analysis.poor_interoception_support.trust_the_data}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Back to Check-in */}
            <div className="flex justify-center">
              <button
                onClick={() => setMode('checkin')}
                className={`${c.btnSecondary} py-3 px-6 rounded-lg font-semibold`}
              >
                Back to Check-In
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CrashPredictor;
