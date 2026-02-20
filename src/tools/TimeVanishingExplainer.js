import React, { useState } from 'react';
import { Clock, PieChart, TrendingUp, AlertCircle, Calendar, Loader2, Upload, Plus, X, CheckCircle, Info, BarChart3, Zap } from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';

const TimeVanishingExplainer = () => {
  const { isDark } = useTheme();
  const { callToolEndpoint, loading, error: apiError } = useClaudeAPI();

  // State
  const [timePeriod, setTimePeriod] = useState('this_week');
  const [comparisonMode, setComparisonMode] = useState('none'); // none, last_week, last_month
  const [inputMethod, setInputMethod] = useState('calendar'); // calendar, manual, csv
  const [calendarText, setCalendarText] = useState('');
  const [comparisonCalendarText, setComparisonCalendarText] = useState('');
  const [manualEntries, setManualEntries] = useState([{ activity: '', duration: '', type: 'work' }]);
  const [perception, setPerception] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  // Theme colors
  const c = {
    gradient: isDark ? 'from-blue-900/20 to-indigo-900/20' : 'from-blue-50 to-indigo-50',
    card: isDark ? 'bg-gray-800' : 'bg-white',
    cardAlt: isDark ? 'bg-gray-700/50' : 'bg-blue-50/50',
    text: isDark ? 'text-gray-100' : 'text-gray-900',
    textSecondary: isDark ? 'text-gray-300' : 'text-gray-700',
    textMuted: isDark ? 'text-gray-400' : 'text-gray-500',
    border: isDark ? 'border-gray-700' : 'border-gray-200',
    input: isDark ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900',
    btnPrimary: isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white',
    btnSecondary: isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-100' : 'bg-gray-100 hover:bg-gray-200 text-gray-700',
  };

  // Add manual entry
  const addManualEntry = () => {
    setManualEntries([...manualEntries, { activity: '', duration: '', type: 'work' }]);
  };

  // Remove manual entry
  const removeManualEntry = (index) => {
    setManualEntries(manualEntries.filter((_, i) => i !== index));
  };

  // Update manual entry
  const updateManualEntry = (index, field, value) => {
    const updated = [...manualEntries];
    updated[index][field] = value;
    setManualEntries(updated);
  };

  // Handle CSV upload
  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCalendarText(event.target.result);
      };
      reader.readAsText(file);
    }
  };

  // Analyze time
  const analyzeTime = async () => {
    setError('');
    setResults(null);

    // Validate input
    if (inputMethod === 'calendar' && !calendarText.trim()) {
      setError('Please paste your calendar or time log data');
      return;
    }
    if (inputMethod === 'manual' && manualEntries.every(e => !e.activity)) {
      setError('Please add at least one activity');
      return;
    }
    if (comparisonMode !== 'none' && !comparisonCalendarText.trim()) {
      setError('Please provide comparison period data for trend analysis');
      return;
    }

    // Prepare time log data
    let timeLogData = '';
    if (inputMethod === 'calendar' || inputMethod === 'csv') {
      timeLogData = calendarText;
    } else {
      timeLogData = manualEntries
        .filter(e => e.activity)
        .map(e => `${e.activity}: ${e.duration} [${e.type}]`)
        .join('\n');
    }

    try {
      const data = await callToolEndpoint('time-vanishing-explainer', {
        timePeriod,
        timeLogData,
        comparisonData: comparisonMode !== 'none' ? comparisonCalendarText : null,
        comparisonMode,
        perception: perception.trim() || null,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null
      });
      setResults(data);
    } catch (err) {
      setError(err.message || 'Failed to analyze time. Please try again.');
    }
  };

  // Get percentage color
  const getPercentageColor = (percentage) => {
    if (percentage >= 30) return 'text-blue-600 dark:text-blue-400';
    if (percentage >= 20) return 'text-indigo-600 dark:text-indigo-400';
    if (percentage >= 10) return 'text-purple-600 dark:text-purple-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${c.gradient} p-6`}>
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Clock className="w-12 h-12 text-blue-600 dark:text-blue-400" />
            <h1 className={`text-4xl font-bold ${c.text}`}>Time Vanishing Explainer</h1>
          </div>
          <p className={`text-lg ${c.textSecondary} max-w-2xl mx-auto`}>
            Understand where time actually went vs where you thought it went. No judgment, just insights.
          </p>
        </div>

        {/* Input Section */}
        <div className={`${c.card} rounded-xl shadow-lg p-6 mb-6`}>
          
          {/* Time Period */}
          <div className="mb-6">
            <label className={`block text-sm font-semibold ${c.text} mb-2`}>
              Time Period
            </label>
            <select
              value={timePeriod}
              onChange={(e) => setTimePeriod(e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border ${c.input} focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
            >
              <option value="today">Today</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
            </select>
          </div>

          {/* Comparison Mode */}
          <div className="mb-6">
            <label className={`block text-sm font-semibold ${c.text} mb-2`}>
              Comparison & Trends
            </label>
            <select
              value={comparisonMode}
              onChange={(e) => setComparisonMode(e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border ${c.input} focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
            >
              <option value="none">No Comparison (Single Period)</option>
              <option value="last_week">Compare to Last Week</option>
              <option value="last_month">Compare to Last Month</option>
              <option value="best_week">Compare to Best Week</option>
            </select>
            {comparisonMode !== 'none' && (
              <p className={`text-xs ${c.textMuted} mt-1`}>
                You'll need to provide data for the comparison period below
              </p>
            )}
          </div>

          {/* Hourly Rate (Optional) */}
          <div className="mb-6">
            <label className={`block text-sm font-semibold ${c.text} mb-2`}>
              Your Hourly Rate (Optional)
              <span className={`ml-2 text-xs font-normal ${c.textMuted}`}>
                For economic analysis & meeting tax calculator
              </span>
            </label>
            <div className="relative">
              <span className={`absolute left-4 top-1/2 -translate-y-1/2 ${c.textMuted}`}>
                $
              </span>
              <input
                type="number"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                placeholder="75"
                className={`w-full pl-8 pr-4 py-2 rounded-lg border ${c.input} focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
              />
            </div>
            <p className={`text-xs ${c.textMuted} mt-1`}>
              Enables: Meeting cost calculator, context switching tax, economic impact analysis
            </p>
          </div>

          {/* Input Method Tabs */}
          <div className="mb-6">
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setInputMethod('calendar')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  inputMethod === 'calendar'
                    ? 'bg-blue-600 text-white'
                    : c.btnSecondary
                }`}
              >
                <Calendar className="w-4 h-4 inline mr-2" />
                Paste Calendar
              </button>
              <button
                onClick={() => setInputMethod('manual')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  inputMethod === 'manual'
                    ? 'bg-blue-600 text-white'
                    : c.btnSecondary
                }`}
              >
                <Plus className="w-4 h-4 inline mr-2" />
                Manual Log
              </button>
              <button
                onClick={() => setInputMethod('csv')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  inputMethod === 'csv'
                    ? 'bg-blue-600 text-white'
                    : c.btnSecondary
                }`}
              >
                <Upload className="w-4 h-4 inline mr-2" />
                Upload CSV
              </button>
            </div>

            {/* Calendar/CSV Input */}
            {(inputMethod === 'calendar' || inputMethod === 'csv') && (
              <div>
                {inputMethod === 'csv' && (
                  <div className="mb-3">
                    <input
                      type="file"
                      accept=".csv,.txt,.ics"
                      onChange={handleCSVUpload}
                      className={`block w-full text-sm ${c.text} file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100`}
                    />
                  </div>
                )}
                <textarea
                  value={calendarText}
                  onChange={(e) => setCalendarText(e.target.value)}
                  placeholder="Paste your calendar export or time log entries here...

Example:
9:00 AM - 10:00 AM: Team standup
10:00 AM - 12:00 PM: Work on project
12:00 PM - 1:00 PM: Lunch
1:00 PM - 3:00 PM: Emails and admin"
                  className={`w-full px-4 py-3 rounded-lg border ${c.input} focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm`}
                  rows={8}
                />
              </div>
            )}

            {/* Manual Input */}
            {inputMethod === 'manual' && (
              <div className="space-y-3">
                {manualEntries.map((entry, index) => (
                  <div key={index} className="flex gap-3">
                    <input
                      type="text"
                      value={entry.activity}
                      onChange={(e) => updateManualEntry(index, 'activity', e.target.value)}
                      placeholder="Activity (e.g., Email, Meetings, Project work)"
                      className={`flex-1 px-4 py-2 rounded-lg border ${c.input} focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                    />
                    <input
                      type="text"
                      value={entry.duration}
                      onChange={(e) => updateManualEntry(index, 'duration', e.target.value)}
                      placeholder="Duration (e.g., 2 hours, 30 min)"
                      className={`w-32 px-4 py-2 rounded-lg border ${c.input} focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                    />
                    <select
                      value={entry.type}
                      onChange={(e) => updateManualEntry(index, 'type', e.target.value)}
                      className={`w-40 px-4 py-2 rounded-lg border ${c.input} focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                    >
                      <option value="deep_work">Deep Work</option>
                      <option value="shallow_work">Shallow Work</option>
                      <option value="meeting">Meeting</option>
                      <option value="break">Break</option>
                    </select>
                    {manualEntries.length > 1 && (
                      <button
                        onClick={() => removeManualEntry(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addManualEntry}
                  className={`${c.btnSecondary} px-4 py-2 rounded-lg text-sm font-medium`}
                >
                  <Plus className="w-4 h-4 inline mr-2" />
                  Add Activity
                </button>
              </div>
            )}
          </div>

          {/* Comparison Period Data */}
          {comparisonMode !== 'none' && (
            <div className="mb-6">
              <label className={`block text-sm font-semibold ${c.text} mb-2`}>
                Comparison Period Data ({comparisonMode === 'last_week' ? 'Last Week' : comparisonMode === 'last_month' ? 'Last Month' : 'Best Week'})
              </label>
              <textarea
                value={comparisonCalendarText}
                onChange={(e) => setComparisonCalendarText(e.target.value)}
                placeholder="Paste your calendar or time log for the comparison period..."
                className={`w-full px-4 py-3 rounded-lg border ${c.input} focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm`}
                rows={6}
              />
            </div>
          )}

          {/* Perception Input */}
          <div className="mb-6">
            <label className={`block text-sm font-semibold ${c.text} mb-2`}>
              Your Perception (Optional)
              <span className={`ml-2 text-xs font-normal ${c.textMuted}`}>
                e.g., "I thought I spent 30 minutes on email"
              </span>
            </label>
            <input
              type="text"
              value={perception}
              onChange={(e) => setPerception(e.target.value)}
              placeholder="I thought I spent..."
              className={`w-full px-4 py-2 rounded-lg border ${c.input} focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
            />
          </div>

          {/* Analyze Button */}
          <button
            onClick={analyzeTime}
            disabled={loading}
            className={`w-full ${c.btnPrimary} py-3 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 inline mr-2 animate-spin" />
                Analyzing Time...
              </>
            ) : (
              <>
                <TrendingUp className="w-5 h-5 inline mr-2" />
                Analyze Time
              </>
            )}
          </button>
        </div>

        {/* Error */}
        {(error || apiError) && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-700 dark:text-red-300">{error || apiError}</p>
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="space-y-6">
            
            {/* Summary */}
            {results.time_analysis_summary && (
              <div className={`${c.card} rounded-xl shadow-lg p-6`}>
                <h2 className={`text-2xl font-bold ${c.text} mb-4 flex items-center gap-2`}>
                  <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  Time Analysis Summary
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className={`${c.cardAlt} rounded-lg p-4`}>
                    <p className={`text-xs ${c.textMuted} mb-1 uppercase`}>Total Time Period</p>
                    <p className={`text-2xl font-bold ${c.text}`}>{results.time_analysis_summary.total_time_period}</p>
                  </div>
                  <div className={`${c.cardAlt} rounded-lg p-4`}>
                    <p className={`text-xs ${c.textMuted} mb-1 uppercase`}>Accounted For</p>
                    <p className={`text-2xl font-bold text-green-600 dark:text-green-400`}>
                      {results.time_analysis_summary.time_accounted_for}
                    </p>
                  </div>
                  <div className={`${c.cardAlt} rounded-lg p-4`}>
                    <p className={`text-xs ${c.textMuted} mb-1 uppercase`}>Time Vanished</p>
                    <p className={`text-2xl font-bold text-orange-600 dark:text-orange-400`}>
                      {results.time_analysis_summary.time_vanished}
                    </p>
                  </div>
                  <div className={`${c.cardAlt} rounded-lg p-4`}>
                    <p className={`text-xs ${c.textMuted} mb-1 uppercase`}>Biggest Gap</p>
                    <p className={`text-sm font-semibold ${c.text}`}>
                      {results.time_analysis_summary.biggest_discrepancy}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Perception vs Reality */}
            {results.perception_vs_reality && results.perception_vs_reality.length > 0 && (
              <div className={`${c.card} rounded-xl shadow-lg p-6`}>
                <h2 className={`text-2xl font-bold ${c.text} mb-4 flex items-center gap-2`}>
                  <AlertCircle className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  Perception vs Reality
                </h2>
                <div className="space-y-4">
                  {results.perception_vs_reality.map((item, idx) => (
                    <div key={idx} className={`${c.cardAlt} rounded-lg p-4`}>
                      <h3 className={`font-bold ${c.text} mb-2`}>{item.activity}</h3>
                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div>
                          <p className={`text-xs ${c.textMuted}`}>You thought</p>
                          <p className={`text-lg font-semibold ${c.text}`}>{item.you_thought}</p>
                        </div>
                        <div>
                          <p className={`text-xs ${c.textMuted}`}>Actually was</p>
                          <p className={`text-lg font-semibold text-blue-600 dark:text-blue-400`}>
                            {item.actually_was}
                          </p>
                        </div>
                        <div>
                          <p className={`text-xs ${c.textMuted}`}>Difference</p>
                          <p className={`text-lg font-semibold text-orange-600 dark:text-orange-400`}>
                            {item.difference}
                          </p>
                        </div>
                      </div>
                      <div className={`text-sm ${c.textSecondary} italic`}>
                        <Info className="w-4 h-4 inline mr-1" />
                        {item.why_the_gap}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Time Leaks */}
            {results.time_leaks && results.time_leaks.length > 0 && (
              <div className={`${c.card} rounded-xl shadow-lg p-6`}>
                <h2 className={`text-2xl font-bold ${c.text} mb-4 flex items-center gap-2`}>
                  <TrendingUp className="w-6 h-6 text-red-600 dark:text-red-400" />
                  Time Leaks Identified
                </h2>
                <div className="space-y-4">
                  {results.time_leaks.map((leak, idx) => (
                    <div key={idx} className={`${c.cardAlt} rounded-lg p-4 border-l-4 border-red-500`}>
                      <div className="flex items-start justify-between mb-3">
                        <h3 className={`font-bold ${c.text}`}>{leak.leak_type}</h3>
                        <span className="text-xl font-bold text-red-600 dark:text-red-400">
                          {leak.time_lost}
                        </span>
                      </div>
                      {leak.instances && (
                        <p className={`text-sm ${c.textSecondary} mb-2`}>
                          {leak.instances} instances • {leak.pattern}
                        </p>
                      )}
                      {leak.impact && (
                        <p className={`text-sm ${c.textSecondary} mb-2`}>
                          <strong>Impact:</strong> {leak.impact}
                        </p>
                      )}
                      {leak.how_to_reduce && (
                        <div className={`mt-3 p-3 rounded ${isDark ? 'bg-green-900/20' : 'bg-green-50'}`}>
                          <p className={`text-sm font-medium text-green-700 dark:text-green-400`}>
                            💡 {leak.how_to_reduce}
                          </p>
                        </div>
                      )}
                      {leak.tasks_affected && (
                        <p className={`text-sm ${c.textSecondary} mt-2`}>
                          <strong>Tasks affected:</strong> {leak.tasks_affected.join(', ')}
                        </p>
                      )}
                      {leak.average_underestimate && (
                        <p className={`text-sm ${c.textSecondary} mt-2`}>
                          <strong>Pattern:</strong> {leak.average_underestimate}
                        </p>
                      )}
                      {leak.planning_adjustment && (
                        <p className={`text-sm font-medium text-blue-600 dark:text-blue-400 mt-2`}>
                          📝 {leak.planning_adjustment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actual Time Breakdown */}
            {results.actual_time_breakdown && (
              <div className={`${c.card} rounded-xl shadow-lg p-6`}>
                <h2 className={`text-2xl font-bold ${c.text} mb-4 flex items-center gap-2`}>
                  <PieChart className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  Actual Time Breakdown
                </h2>
                <div className="space-y-3">
                  {results.actual_time_breakdown.categories.map((cat, idx) => (
                    <div key={idx}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-semibold ${c.text}`}>{cat.category}</span>
                        <span className={`${getPercentageColor(cat.percentage)} font-bold`}>
                          {cat.time_spent} ({cat.percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all"
                          style={{ width: `${cat.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Time Blindness Insights */}
            {results.time_blindness_insights && (
              <div className={`${c.card} rounded-xl shadow-lg p-6 border-2 border-blue-300 dark:border-blue-700`}>
                <h2 className={`text-2xl font-bold ${c.text} mb-4`}>
                  Understanding Your Time Experience
                </h2>
                <div className="space-y-4">
                  <div className={`${c.cardAlt} rounded-lg p-4`}>
                    <p className={`text-sm ${c.textMuted} mb-1`}>Your Pattern</p>
                    <p className={`font-semibold ${c.text}`}>
                      {results.time_blindness_insights.your_pattern}
                    </p>
                  </div>
                  <div className={`${c.cardAlt} rounded-lg p-4`}>
                    <p className={`text-sm ${c.textMuted} mb-1`}>Realistic Capacity</p>
                    <p className={`font-semibold ${c.text}`}>
                      {results.time_blindness_insights.realistic_capacity}
                    </p>
                  </div>
                  <div className={`${c.cardAlt} rounded-lg p-4`}>
                    <p className={`text-sm ${c.textMuted} mb-1`}>Planning Adjustment</p>
                    <p className={`font-semibold ${c.text}`}>
                      {results.time_blindness_insights.planning_adjustment}
                    </p>
                  </div>
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                    <p className={`text-sm ${c.text} italic`}>
                      💙 {results.time_blindness_insights.non_judgmental_reality}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Future Scheduling Help */}
            {results.future_scheduling_help && (
              <div className={`${c.card} rounded-xl shadow-lg p-6`}>
                <h2 className={`text-2xl font-bold ${c.text} mb-4`}>
                  Future Scheduling Help
                </h2>
                
                {results.future_scheduling_help.realistic_estimates && (
                  <div className="mb-4">
                    <h3 className={`font-bold ${c.text} mb-3`}>Realistic Estimates (Use These!)</h3>
                    <div className="space-y-3">
                      {results.future_scheduling_help.realistic_estimates.map((est, idx) => (
                        <div key={idx} className={`${c.cardAlt} rounded-lg p-4`}>
                          <p className={`font-semibold ${c.text} mb-2`}>{est.task_type}</p>
                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <div>
                              <p className={`${c.textMuted}`}>You think</p>
                              <p className={c.text}>{est.you_usually_think}</p>
                            </div>
                            <div>
                              <p className={`${c.textMuted}`}>Actually takes</p>
                              <p className="text-orange-600 dark:text-orange-400">{est.actually_takes}</p>
                            </div>
                            <div>
                              <p className={`${c.textMuted}`}>Use this</p>
                              <p className="text-green-600 dark:text-green-400 font-bold">
                                {est.use_this_estimate}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {results.future_scheduling_help.capacity_planning && (
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-purple-900/20' : 'bg-purple-50'} mb-3`}>
                    <p className="font-semibold text-purple-700 dark:text-purple-400">
                      📅 {results.future_scheduling_help.capacity_planning}
                    </p>
                  </div>
                )}

                {results.future_scheduling_help.buffer_recommendations && (
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-indigo-900/20' : 'bg-indigo-50'}`}>
                    <p className="font-semibold text-indigo-700 dark:text-indigo-400">
                      ⏱️ {results.future_scheduling_help.buffer_recommendations}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Celebration */}
            {results.celebration && (
              <div className={`${c.card} rounded-xl shadow-lg p-6 border-4 border-green-400 dark:border-green-600`}>
                <h2 className={`text-2xl font-bold text-green-700 dark:text-green-400 mb-4 flex items-center gap-2`}>
                  <CheckCircle className="w-8 h-8" />
                  You Did Great!
                </h2>
                <div className="space-y-3">
                  <p className={`text-lg font-semibold ${c.text}`}>
                    {results.celebration.what_you_actually_accomplished}
                  </p>
                  <p className={`text-lg ${c.textSecondary} italic`}>
                    {results.celebration.reframe}
                  </p>
                </div>
              </div>
            )}

            {/* Economic Analysis */}
            {results.economic_analysis && (
              <div className={`${c.card} rounded-xl shadow-lg p-6 border-2 border-yellow-400 dark:border-yellow-600`}>
                <h2 className={`text-2xl font-bold ${c.text} mb-4 flex items-center gap-2`}>
                  <TrendingUp className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                  Economic Impact Analysis
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className={`${c.cardAlt} rounded-lg p-4`}>
                    <p className={`text-xs ${c.textMuted} mb-1 uppercase`}>Your Hourly Rate</p>
                    <p className={`text-2xl font-bold text-green-600 dark:text-green-400`}>
                      ${results.economic_analysis.hourly_rate}
                    </p>
                  </div>
                  <div className={`${c.cardAlt} rounded-lg p-4`}>
                    <p className={`text-xs ${c.textMuted} mb-1 uppercase`}>Meeting Cost</p>
                    <p className={`text-2xl font-bold text-red-600 dark:text-red-400`}>
                      ${results.economic_analysis.total_meeting_cost}
                    </p>
                  </div>
                  <div className={`${c.cardAlt} rounded-lg p-4`}>
                    <p className={`text-xs ${c.textMuted} mb-1 uppercase`}>Context Switch Tax</p>
                    <p className={`text-2xl font-bold text-orange-600 dark:text-orange-400`}>
                      ${results.economic_analysis.context_switching_cost}
                    </p>
                  </div>
                  <div className={`${c.cardAlt} rounded-lg p-4`}>
                    <p className={`text-xs ${c.textMuted} mb-1 uppercase`}>Total Cost</p>
                    <p className={`text-2xl font-bold ${c.text}`}>
                      ${results.economic_analysis.total_economic_cost}
                    </p>
                  </div>
                </div>

                {results.economic_analysis.expensive_meetings && results.economic_analysis.expensive_meetings.length > 0 && (
                  <div>
                    <h3 className={`font-bold ${c.text} mb-3`}>Most Expensive Meetings</h3>
                    <div className="space-y-2">
                      {results.economic_analysis.expensive_meetings.map((meeting, idx) => (
                        <div key={idx} className={`${c.cardAlt} rounded-lg p-3 flex items-center justify-between`}>
                          <div>
                            <p className={`font-semibold ${c.text}`}>{meeting.name}</p>
                            <p className={`text-xs ${c.textMuted}`}>
                              {meeting.duration} • {meeting.attendees} people
                            </p>
                          </div>
                          <p className="text-xl font-bold text-red-600 dark:text-red-400">
                            ${meeting.cost}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className={`mt-4 p-4 rounded-lg ${isDark ? 'bg-yellow-900/20' : 'bg-yellow-50'}`}>
                  <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-400">
                    💰 {results.economic_analysis.economic_insight}
                  </p>
                </div>
              </div>
            )}

            {/* Work Type Classification */}
            {results.work_type_breakdown && (
              <div className={`${c.card} rounded-xl shadow-lg p-6`}>
                <h2 className={`text-2xl font-bold ${c.text} mb-4 flex items-center gap-2`}>
                  <BarChart3 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  Work Type Classification
                </h2>
                <div className="space-y-4 mb-6">
                  {results.work_type_breakdown.types.map((type, idx) => (
                    <div key={idx}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${c.text}`}>{type.type}</span>
                          {type.optimal && (
                            <span className="text-xs px-2 py-1 rounded bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                              Optimal
                            </span>
                          )}
                          {type.too_much && (
                            <span className="text-xs px-2 py-1 rounded bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300">
                              Too Much
                            </span>
                          )}
                        </div>
                        <span className={`font-bold ${getPercentageColor(type.percentage)}`}>
                          {type.hours} ({type.percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full ${type.type === 'Deep Work' ? 'bg-blue-500' : type.type === 'Shallow Work' ? 'bg-purple-500' : type.type === 'Meetings' ? 'bg-orange-500' : 'bg-gray-500'}`}
                          style={{ width: `${type.percentage}%` }}
                        />
                      </div>
                      {type.recommendation && (
                        <p className={`text-sm ${c.textMuted} mt-1 italic`}>{type.recommendation}</p>
                      )}
                    </div>
                  ))}
                </div>

                <div className={`p-4 rounded-lg ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                  <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                    📊 {results.work_type_breakdown.overall_assessment}
                  </p>
                </div>
              </div>
            )}

            {/* Peak Productivity Hours */}
            {results.peak_productivity && (
              <div className={`${c.card} rounded-xl shadow-lg p-6`}>
                <h2 className={`text-2xl font-bold ${c.text} mb-4 flex items-center gap-2`}>
                  <Zap className="w-6 h-6 text-yellow-500" />
                  Peak Productivity Hours
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className={`${c.cardAlt} rounded-lg p-4 border-2 border-green-400`}>
                    <p className={`text-xs ${c.textMuted} mb-1`}>Peak Hours</p>
                    <p className={`text-xl font-bold text-green-600 dark:text-green-400`}>
                      {results.peak_productivity.peak_hours}
                    </p>
                    <p className={`text-xs ${c.textMuted} mt-1`}>Highest output</p>
                  </div>
                  <div className={`${c.cardAlt} rounded-lg p-4`}>
                    <p className={`text-xs ${c.textMuted} mb-1`}>Good Hours</p>
                    <p className={`text-xl font-bold ${c.text}`}>
                      {results.peak_productivity.good_hours}
                    </p>
                    <p className={`text-xs ${c.textMuted} mt-1`}>Above average</p>
                  </div>
                  <div className={`${c.cardAlt} rounded-lg p-4 border-2 border-orange-400`}>
                    <p className={`text-xs ${c.textMuted} mb-1`}>Low Energy</p>
                    <p className={`text-xl font-bold text-orange-600 dark:text-orange-400`}>
                      {results.peak_productivity.low_energy_hours}
                    </p>
                    <p className={`text-xs ${c.textMuted} mt-1`}>Lowest output</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-green-900/20' : 'bg-green-50'}`}>
                    <p className="text-sm font-semibold text-green-700 dark:text-green-400 mb-2">
                      ✅ Protect These Hours
                    </p>
                    <p className={`text-sm ${c.textSecondary}`}>
                      {results.peak_productivity.protect_recommendation}
                    </p>
                  </div>

                  <div className={`p-4 rounded-lg ${isDark ? 'bg-purple-900/20' : 'bg-purple-50'}`}>
                    <p className="text-sm font-semibold text-purple-700 dark:text-purple-400 mb-2">
                      📋 Schedule During Low Energy
                    </p>
                    <p className={`text-sm ${c.textSecondary}`}>
                      {results.peak_productivity.low_energy_tasks}
                    </p>
                  </div>

                  <div className={`p-4 rounded-lg ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                    <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                      ⚡ {results.peak_productivity.energy_insight}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Trend Comparison */}
            {results.trend_comparison && (
              <div className={`${c.card} rounded-xl shadow-lg p-6`}>
                <h2 className={`text-2xl font-bold ${c.text} mb-4 flex items-center gap-2`}>
                  <TrendingUp className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  Trend Analysis
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {results.trend_comparison.metrics.map((metric, idx) => (
                    <div key={idx} className={`${c.cardAlt} rounded-lg p-4`}>
                      <p className={`text-xs ${c.textMuted} mb-1 uppercase`}>{metric.metric}</p>
                      <p className={`text-2xl font-bold ${c.text} mb-1`}>
                        {metric.current_value}
                      </p>
                      <div className="flex items-center gap-1">
                        {metric.trend === 'improving' && (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        )}
                        {metric.trend === 'declining' && (
                          <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />
                        )}
                        <span className={`text-xs font-semibold ${metric.trend === 'improving' ? 'text-green-600' : metric.trend === 'declining' ? 'text-red-600' : c.textMuted}`}>
                          {metric.change}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={`p-4 rounded-lg ${isDark ? 'bg-indigo-900/20' : 'bg-indigo-50'}`}>
                  <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-400">
                    📈 {results.trend_comparison.overall_trend}
                  </p>
                </div>
              </div>
            )}

            {/* Ideal Week Generator */}
            {results.ideal_week && (
              <div className={`${c.card} rounded-xl shadow-lg p-6 border-2 border-purple-400 dark:border-purple-600`}>
                <h2 className={`text-2xl font-bold ${c.text} mb-4 flex items-center gap-2`}>
                  <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  Your Ideal Week (Based on Reality)
                </h2>
                <p className={`${c.textSecondary} mb-6`}>
                  {results.ideal_week.intro}
                </p>

                <div className="space-y-4">
                  {results.ideal_week.daily_template.map((day, idx) => (
                    <div key={idx} className={`${c.cardAlt} rounded-lg p-4`}>
                      <h3 className={`font-bold ${c.text} mb-3`}>{day.day}</h3>
                      <div className="space-y-2">
                        {day.blocks.map((block, bidx) => (
                          <div key={bidx} className="flex items-start gap-3">
                            <span className={`text-sm font-mono ${c.textMuted} w-24`}>
                              {block.time}
                            </span>
                            <div className="flex-1">
                              <p className={`text-sm font-semibold ${c.text}`}>{block.activity}</p>
                              {block.note && (
                                <p className={`text-xs ${c.textMuted} italic`}>{block.note}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 space-y-3">
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-purple-900/20' : 'bg-purple-50'}`}>
                    <p className="text-sm font-semibold text-purple-700 dark:text-purple-400 mb-2">
                      🎯 Key Principles
                    </p>
                    <ul className="space-y-1">
                      {results.ideal_week.key_principles.map((principle, idx) => (
                        <li key={idx} className={`text-sm ${c.textSecondary}`}>• {principle}</li>
                      ))}
                    </ul>
                  </div>

                  <div className={`p-4 rounded-lg ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                    <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                      💡 {results.ideal_week.reality_check}
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};

export default TimeVanishingExplainer;
