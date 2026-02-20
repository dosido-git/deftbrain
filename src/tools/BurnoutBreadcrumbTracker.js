import React, { useState } from 'react';
import { AlertOctagon, Loader2, AlertCircle, Plus, X } from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';

const BurnoutBreadcrumbTracker = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  
  const [dailyLogs, setDailyLogs] = useState([
    { date: '', sleepQuality: 5, mood: 5, tasksCompleted: 50, socialEnergy: 5, symptoms: '' }
  ]);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const addLog = () => {
    setDailyLogs([...dailyLogs, { date: '', sleepQuality: 5, mood: 5, tasksCompleted: 50, socialEnergy: 5, symptoms: '' }]);
  };

  const removeLog = (index) => {
    setDailyLogs(dailyLogs.filter((_, i) => i !== index));
  };

  const updateLog = (index, field, value) => {
    const newLogs = [...dailyLogs];
    newLogs[index][field] = value;
    setDailyLogs(newLogs);
  };

  const handleAnalyze = async () => {
    const filledLogs = dailyLogs.filter(log => log.date.trim());
    if (filledLogs.length === 0) {
      setError('Please add at least one daily log');
      return;
    }

    setError('');
    setResults(null);

    try {
      const data = await callToolEndpoint('burnout-breadcrumb-tracker', {
        dailyLogs: filledLogs,
        historicalBurnouts: []
      });
      
      setResults(data);
    } catch (err) {
      setError(err.message || 'Failed to track burnout. Please try again.');
    }
  };

  const riskColors = {
    low: 'bg-emerald-100 border-emerald-400 text-emerald-900',
    medium: 'bg-yellow-100 border-yellow-400 text-yellow-900',
    high: 'bg-orange-100 border-orange-400 text-orange-900',
    critical: 'bg-red-100 border-red-400 text-red-900'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <AlertOctagon className="w-8 h-8 text-orange-600" />
            <h1 className="text-4xl font-bold text-slate-900">Burnout Breadcrumb Tracker</h1>
          </div>
          <p className="text-slate-600">Spot burnout patterns before the crash</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <label className="block text-lg font-semibold text-slate-900 mb-3">
            Daily logs (last 7-14 days)
          </label>

          <div className="space-y-4 mb-4">
            {dailyLogs.map((log, index) => (
              <div key={index} className="bg-slate-50 rounded-lg p-4 border-2 border-slate-200">
                <div className="flex items-start justify-between mb-3">
                  <input
                    type="text"
                    value={log.date}
                    onChange={(e) => updateLog(index, 'date', e.target.value)}
                    placeholder="Date (e.g., 'Jan 1' or 'Monday')"
                    className="flex-1 p-2 border border-slate-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none"
                  />
                  {dailyLogs.length > 1 && (
                    <button
                      onClick={() => removeLog(index)}
                      className="ml-2 p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Sleep quality: {log.sleepQuality}/10
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={log.sleepQuality}
                      onChange={(e) => updateLog(index, 'sleepQuality', parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Mood: {log.mood}/10
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={log.mood}
                      onChange={(e) => updateLog(index, 'mood', parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Tasks completed: {log.tasksCompleted}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={log.tasksCompleted}
                      onChange={(e) => updateLog(index, 'tasksCompleted', parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Social energy: {log.socialEnergy}/10
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={log.socialEnergy}
                      onChange={(e) => updateLog(index, 'socialEnergy', parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
                    />
                  </div>
                </div>

                <input
                  type="text"
                  value={log.symptoms}
                  onChange={(e) => updateLog(index, 'symptoms', e.target.value)}
                  placeholder="Physical symptoms (optional)"
                  className="w-full mt-3 p-2 border border-slate-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none text-sm"
                />
              </div>
            ))}
          </div>

          <button
            onClick={addLog}
            className="w-full mb-6 py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Another Day
          </button>

          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-slate-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing patterns...
              </>
            ) : (
              <>
                <AlertOctagon className="w-5 h-5" />
                Analyze Burnout Risk
              </>
            )}
          </button>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
        </div>

        {results && (
          <div className="space-y-6">
            <div className={`border-4 rounded-xl shadow-lg p-6 ${riskColors[results.burnout_risk] || riskColors.medium}`}>
              <h2 className="text-3xl font-bold mb-3">
                Burnout Risk: {results.burnout_risk?.toUpperCase()}
              </h2>
              {results.time_until_crash && (
                <p className="text-xl font-semibold">
                  Estimated time until crash: {results.time_until_crash}
                </p>
              )}
            </div>

            {results.indicators_present && results.indicators_present.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-2xl font-bold text-slate-900 mb-4">⚠️ Warning Signs Detected</h3>
                <div className="space-y-3">
                  {results.indicators_present.map((indicator, idx) => (
                    <div key={idx} className="bg-red-50 border-l-4 border-red-500 rounded-r-lg p-4">
                      <div className="font-bold text-red-900">{indicator.indicator}</div>
                      <p className="text-red-800 text-sm mt-1">{indicator.pattern}</p>
                      <p className="text-red-700 text-xs mt-1">Severity: {indicator.severity}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.interventions && results.interventions.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-2xl font-bold text-slate-900 mb-4">🛡️ Interventions Needed</h3>
                <div className="space-y-3">
                  {results.interventions.map((intervention, idx) => (
                    <div key={idx} className={`border-2 rounded-lg p-4 ${
                      intervention.priority === 'critical' ? 'bg-red-50 border-red-400' :
                      intervention.priority === 'high' ? 'bg-orange-50 border-orange-400' :
                      'bg-yellow-50 border-yellow-400'
                    }`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="font-bold text-slate-900">{intervention.action}</div>
                        <span className="px-2 py-1 bg-white rounded-full text-xs font-semibold uppercase">
                          {intervention.priority}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 mb-1">{intervention.why}</p>
                      <p className="text-xs text-slate-600"><strong>When:</strong> {intervention.when}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.reality_check && (
              <div className="bg-yellow-50 border-4 border-yellow-400 rounded-xl p-6">
                <h3 className="text-lg font-bold text-yellow-900 mb-2">⚡ Reality Check</h3>
                <p className="text-yellow-900 text-lg">{results.reality_check}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BurnoutBreadcrumbTracker;