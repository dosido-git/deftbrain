import React, { useState } from 'react';
import { TrendingUp, Loader2, AlertCircle } from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';

const GentlePushGenerator = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  
  const [comfortZone, setComfortZone] = useState('');
  const [growthArea, setGrowthArea] = useState('');
  const [currentCapacity, setCurrentCapacity] = useState('medium');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setError('');
    setResults(null);

    try {
      const data = await callToolEndpoint('gentle-push-generator', {
        comfortZone: comfortZone.trim(),
        growthArea: growthArea.trim(),
        currentCapacity
      });
      
      setResults(data);
    } catch (err) {
      setError(err.message || 'Failed to generate push. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <TrendingUp className="w-8 h-8 text-emerald-600" />
            <h1 className="text-4xl font-bold text-slate-900">Gentle Push Generator</h1>
          </div>
          <p className="text-slate-600">Micro-challenges calibrated to your capacity</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="mb-6">
            <label className="block text-lg font-semibold text-slate-900 mb-3">
              What's your comfort zone?
            </label>
            <input
              type="text"
              value={comfortZone}
              onChange={(e) => setComfortZone(e.target.value)}
              placeholder="e.g., 'Comfortable texting friends, scared of phone calls'"
              className="w-full p-3 border-2 border-slate-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
            />
          </div>

          <div className="mb-6">
            <label className="block text-lg font-semibold text-slate-900 mb-3">
              Where do you want to grow?
            </label>
            <input
              type="text"
              value={growthArea}
              onChange={(e) => setGrowthArea(e.target.value)}
              placeholder="e.g., 'Social connection', 'Public speaking', 'Trying new things'"
              className="w-full p-3 border-2 border-slate-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Current capacity
            </label>
            <select
              value={currentCapacity}
              onChange={(e) => setCurrentCapacity(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
            >
              <option value="low">Low - struggling right now</option>
              <option value="medium">Medium - doing okay</option>
              <option value="high">High - feeling strong</option>
            </select>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating push...
              </>
            ) : (
              <>
                <TrendingUp className="w-5 h-5" />
                Generate Gentle Push
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

        {results && results.gentle_push && (
          <div className="space-y-6">
            <div className="bg-emerald-50 border-4 border-emerald-400 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-emerald-900 mb-4">Your Gentle Challenge</h2>
              <p className="text-2xl text-emerald-900 font-semibold mb-4">
                {results.gentle_push.challenge}
              </p>
              <p className="text-emerald-800">
                <strong>Why this size:</strong> {results.gentle_push.why_this_size}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {results.gentle_push.if_too_much && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-bold text-orange-900 mb-3">If This Feels Too Big</h3>
                  <p className="text-orange-800">{results.gentle_push.if_too_much}</p>
                </div>
              )}

              {results.gentle_push.if_not_enough && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-bold text-blue-900 mb-3">If You Want More</h3>
                  <p className="text-blue-800">{results.gentle_push.if_not_enough}</p>
                </div>
              )}
            </div>

            {results.what_counts_as_success && (
              <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-purple-900 mb-2">What Counts As Success</h3>
                <p className="text-purple-800 text-lg">{results.what_counts_as_success}</p>
              </div>
            )}

            {results.gentle_push.celebration && (
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6">
                <h3 className="text-lg font-bold text-yellow-900 mb-2">🎉 Celebration</h3>
                <p className="text-yellow-800">{results.gentle_push.celebration}</p>
              </div>
            )}

            {results.if_you_dont_do_it && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 text-center">
                <p className="text-blue-900">{results.if_you_dont_do_it}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GentlePushGenerator;