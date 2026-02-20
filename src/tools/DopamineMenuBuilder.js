import React, { useState } from 'react';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';

const DopamineMenuBuilder = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  
  const [currentEnergy, setCurrentEnergy] = useState(5);
  const [availableTime, setAvailableTime] = useState('');
  const [recentActivities, setRecentActivities] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const handleBuild = async () => {
    setError('');
    setResults(null);

    try {
      const data = await callToolEndpoint('dopamine-menu-builder', {
        currentEnergy: currentEnergy.toString(),
        availableTime: availableTime.trim(),
        recentActivities: recentActivities.trim()
      });
      
      setResults(data);
    } catch (err) {
      setError(err.message || 'Failed to build menu. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <Sparkles className="w-8 h-8 text-emerald-600" />
            <h1 className="text-4xl font-bold text-slate-900">Dopamine Menu Builder</h1>
          </div>
          <p className="text-slate-600">Activities that actually restore, not just numb</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="mb-6">
            <label className="block text-lg font-semibold text-slate-900 mb-3">
              Current energy level: {currentEnergy}/10
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={currentEnergy}
              onChange={(e) => setCurrentEnergy(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            <div className="flex justify-between text-sm text-slate-600 mt-2">
              <span>Exhausted</span>
              <span>Medium</span>
              <span>Energized</span>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Available time (Optional)
            </label>
            <input
              type="text"
              value={availableTime}
              onChange={(e) => setAvailableTime(e.target.value)}
              placeholder="e.g., '30 minutes', '2 hours', 'All evening'"
              className="w-full p-3 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              What have you been doing lately? (Optional)
            </label>
            <textarea
              value={recentActivities}
              onChange={(e) => setRecentActivities(e.target.value)}
              placeholder="e.g., 'Been scrolling social media a lot but feel worse after'"
              className="w-full h-24 p-3 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none resize-none"
            />
          </div>

          <button
            onClick={handleBuild}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Building your menu...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Build My Dopamine Menu
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

        {results && results.menu && (
          <div className="space-y-6">
            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-6">
              <h2 className="text-xl font-bold text-emerald-900 mb-3">Your Current State</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-emerald-700">Energy</div>
                  <div className="text-2xl font-bold text-emerald-900">{results.current_state?.energy}/10</div>
                </div>
                <div>
                  <div className="text-sm text-emerald-700">Time</div>
                  <div className="text-lg font-semibold text-emerald-900">{results.current_state?.time}</div>
                </div>
              </div>
              <div className="mt-3 text-emerald-800">
                <strong>Recommendation tier:</strong> {results.current_state?.recommendation_tier}
              </div>
            </div>

            {results.menu.optimal_activities && results.menu.optimal_activities.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-2xl font-bold text-slate-900 mb-4">🌟 Optimal Activities (Actually Restorative)</h3>
                <div className="space-y-3">
                  {results.menu.optimal_activities.map((activity, idx) => (
                    <div key={idx} className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-bold text-emerald-900 text-lg">{activity.activity}</h4>
                        <div className="text-xs">
                          <span className="px-2 py-1 bg-emerald-200 text-emerald-800 rounded-full">
                            {activity.effort_required} effort
                          </span>
                        </div>
                      </div>
                      <p className="text-emerald-800 text-sm mb-2">{activity.why_this_helps}</p>
                      {activity.duration && (
                        <p className="text-xs text-emerald-700"><strong>Duration:</strong> {activity.duration}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.menu.lower_effort_options && results.menu.lower_effort_options.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Lower Effort Options</h3>
                <ul className="space-y-2">
                  {results.menu.lower_effort_options.map((option, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-slate-700">
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      <span>{option}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {results.menu.avoid_right_now && results.menu.avoid_right_now.length > 0 && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-red-900 mb-3">⚠️ Avoid Right Now</h3>
                <div className="space-y-2">
                  {results.menu.avoid_right_now.map((item, idx) => (
                    <div key={idx} className="bg-white rounded p-3">
                      <div className="font-semibold text-red-900">{item.activity}</div>
                      <p className="text-sm text-red-700">{item.why}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.intentional_pleasure_vs_numbing && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-blue-900 mb-2">💡 Pleasure vs. Numbing</h3>
                <p className="text-blue-800">{results.intentional_pleasure_vs_numbing}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DopamineMenuBuilder;