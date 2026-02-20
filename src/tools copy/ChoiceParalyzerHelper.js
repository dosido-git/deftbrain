import React, { useState } from 'react';
import { Target, Loader2, AlertCircle } from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';

const ChoiceParalyzerHelper = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  
  const [decisionNeeded, setDecisionNeeded] = useState('');
  const [preferences, setPreferences] = useState('');
  const [capacityLevel, setCapacityLevel] = useState('overwhelmed');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const handleDecide = async () => {
    if (!decisionNeeded.trim()) {
      setError('Please describe what decision you need made');
      return;
    }

    setError('');
    setResults(null);

    try {
      const data = await callToolEndpoint('choice-paralyzer-helper', {
        decisionNeeded: decisionNeeded.trim(),
        preferences: preferences.trim(),
        capacityLevel
      });
      
      setResults(data);
    } catch (err) {
      setError(err.message || 'Failed to make decision. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-yellow-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <Target className="w-8 h-8 text-amber-600" />
            <h1 className="text-4xl font-bold text-slate-900">Choice Paralyzer Helper</h1>
          </div>
          <p className="text-slate-600">Make decisions FOR you when you're too overwhelmed to choose</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="mb-6">
            <label className="block text-lg font-semibold text-slate-900 mb-3">
              What decision do you need made?
            </label>
            <input
              type="text"
              value={decisionNeeded}
              onChange={(e) => setDecisionNeeded(e.target.value)}
              placeholder="e.g., 'What to eat for dinner', 'Which task to start with'"
              className="w-full p-3 border-2 border-slate-200 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Your preferences/constraints (Optional)
            </label>
            <textarea
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
              placeholder="e.g., 'Vegetarian, under $15, no cooking energy, comfort food mood'"
              className="w-full h-24 p-3 border border-slate-300 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none resize-none"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Current capacity level
            </label>
            <select
              value={capacityLevel}
              onChange={(e) => setCapacityLevel(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
            >
              <option value="overwhelmed">Completely overwhelmed</option>
              <option value="low">Low capacity</option>
              <option value="medium">Medium capacity</option>
            </select>
          </div>

          <button
            onClick={handleDecide}
            disabled={loading || !decisionNeeded.trim()}
            className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Making decision...
              </>
            ) : (
              <>
                <Target className="w-5 h-5" />
                Decide For Me
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

        {results && results.decision_made_for_you && (
          <div className="space-y-6">
            <div className="bg-amber-50 border-4 border-amber-400 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-amber-900 mb-4">Your Decision:</h2>
              <div className="bg-white rounded-lg p-6 mb-4">
                <p className="text-3xl font-bold text-amber-900 text-center">
                  {results.decision_made_for_you.choice}
                </p>
              </div>
              <p className="text-amber-800 mb-4">
                <strong>Why this choice:</strong> {results.decision_made_for_you.why}
              </p>
              {results.decision_made_for_you.alternatives_eliminated && (
                <div className="text-sm text-amber-700">
                  <strong>Alternatives ruled out:</strong>
                  <ul className="list-disc list-inside ml-4 mt-1">
                    {results.decision_made_for_you.alternatives_eliminated.map((alt, idx) => (
                      <li key={idx}>{alt}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {results.execution_instructions && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-4">How To Execute:</h3>
                <ol className="space-y-3">
                  {Object.entries(results.execution_instructions).filter(([key]) => key.startsWith('step_')).map(([key, value]) => (
                    <li key={key} className="flex gap-3">
                      <span className="font-bold text-amber-600">{key.replace('step_', '')}.</span>
                      <span className="text-slate-800">{value}</span>
                    </li>
                  ))}
                </ol>
                {results.execution_instructions.done && (
                  <p className="mt-4 text-emerald-800 font-semibold">{results.execution_instructions.done}</p>
                )}
              </div>
            )}

            {results.no_second_guessing && (
              <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6">
                <h3 className="text-lg font-bold text-red-900 mb-2">⚠️ No Second-Guessing</h3>
                <p className="text-red-800">{results.no_second_guessing}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChoiceParalyzerHelper;