import React, { useState } from 'react';
import { AlertTriangle, Loader2, AlertCircle, Clock } from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';

const HyperfocusInterrupter = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  
  const [activity, setActivity] = useState('');
  const [duration, setDuration] = useState('');
  const [missedNeeds, setMissedNeeds] = useState('');
  const [upcomingObligations, setUpcomingObligations] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const handleCheck = async () => {
    if (!activity.trim()) {
      setError('Please describe what you\'re hyperfocusing on');
      return;
    }

    setError('');
    setResults(null);

    try {
      const data = await callToolEndpoint('hyperfocus-interrupter', {
        activity: activity.trim(),
        duration: duration.trim(),
        missedNeeds: missedNeeds.trim(),
        upcomingObligations: upcomingObligations.trim()
      });
      
      setResults(data);
    } catch (err) {
      setError(err.message || 'Failed to generate interruption. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <AlertTriangle className="w-8 h-8 text-orange-600" />
            <h1 className="text-4xl font-bold text-slate-900">Hyperfocus Interrupter</h1>
          </div>
          <p className="text-slate-600">Break deep focus before you forget to eat, drink, or move</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="mb-6">
            <label className="block text-lg font-semibold text-slate-900 mb-3">
              What are you hyperfocusing on?
            </label>
            <input
              type="text"
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              placeholder="e.g., 'Coding a new feature', 'Playing video game', 'Research rabbit hole'"
              className="w-full p-3 border-2 border-slate-200 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                How long have you been doing this?
              </label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g., '4 hours', '30 minutes'"
                className="w-full p-3 border border-slate-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                What have you missed? (Optional)
              </label>
              <input
                type="text"
                value={missedNeeds}
                onChange={(e) => setMissedNeeds(e.target.value)}
                placeholder="e.g., 'Haven\'t eaten since breakfast'"
                className="w-full p-3 border border-slate-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Any upcoming obligations? (Optional)
            </label>
            <input
              type="text"
              value={upcomingObligations}
              onChange={(e) => setUpcomingObligations(e.target.value)}
              placeholder="e.g., 'Meeting at 3pm', 'Need to pick up kids at 5pm'"
              className="w-full p-3 border border-slate-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none"
            />
          </div>

          <button
            onClick={handleCheck}
            disabled={loading || !activity.trim()}
            className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-slate-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Checking your state...
              </>
            ) : (
              <>
                <AlertTriangle className="w-5 h-5" />
                Check If I Need A Break
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
            {results.current_interruption && (
              <div className="bg-red-50 border-4 border-red-400 rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-red-900 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-8 h-8" />
                  BREAK REQUIRED
                </h2>
                <div className="bg-white rounded-lg p-4 mb-4">
                  <p className="text-lg text-slate-900 whitespace-pre-wrap">
                    {results.current_interruption.message}
                  </p>
                </div>

                {results.current_interruption.mandatory_actions && (
                  <div className="mb-4">
                    <h3 className="font-bold text-red-900 mb-3">You must do these before continuing:</h3>
                    <div className="space-y-2">
                      {results.current_interruption.mandatory_actions.map((action, idx) => (
                        <label key={idx} className="flex items-start gap-3 bg-white rounded p-3 cursor-pointer hover:bg-red-50">
                          <input type="checkbox" className="mt-1 w-5 h-5" />
                          <span className="text-slate-900">{action}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {results.current_interruption.gentle_re_entry && (
                  <div className="bg-emerald-50 border-2 border-emerald-300 rounded-lg p-4">
                    <p className="text-emerald-900">
                      <strong>After your break:</strong> {results.current_interruption.gentle_re_entry}
                    </p>
                  </div>
                )}
              </div>
            )}

            {results.needs_assessment && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Your Physical Needs</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {results.needs_assessment.last_ate && (
                    <div className="bg-orange-50 rounded-lg p-3">
                      <div className="text-sm font-semibold text-orange-900">Food</div>
                      <p className="text-orange-800">{results.needs_assessment.last_ate}</p>
                    </div>
                  )}
                  {results.needs_assessment.last_drank && (
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="text-sm font-semibold text-blue-900">Water</div>
                      <p className="text-blue-800">{results.needs_assessment.last_drank}</p>
                    </div>
                  )}
                  {results.needs_assessment.last_moved && (
                    <div className="bg-emerald-50 rounded-lg p-3">
                      <div className="text-sm font-semibold text-emerald-900">Movement</div>
                      <p className="text-emerald-800">{results.needs_assessment.last_moved}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {results.why_this_matters && (
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6">
                <h3 className="text-lg font-bold text-yellow-900 mb-2">Why This Matters</h3>
                <p className="text-yellow-800">{results.why_this_matters}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HyperfocusInterrupter;