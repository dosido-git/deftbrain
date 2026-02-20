import React, { useState } from 'react';
import { FileText, Loader2, AlertCircle } from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';

const BrainDumpStructurer = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  
  const [rawThoughts, setRawThoughts] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const handleStructure = async () => {
    if (!rawThoughts.trim()) {
      setError('Please dump your thoughts first');
      return;
    }

    setError('');
    setResults(null);

    try {
      const data = await callToolEndpoint('brain-dump-structurer', {
        rawThoughts: rawThoughts.trim()
      });
      
      setResults(data);
    } catch (err) {
      setError(err.message || 'Failed to structure thoughts. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <FileText className="w-8 h-8 text-yellow-600" />
            <h1 className="text-4xl font-bold text-slate-900">Brain Dump Structurer</h1>
          </div>
          <p className="text-slate-600">Transform chaos into clarity</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="mb-6">
            <label className="block text-lg font-semibold text-slate-900 mb-3">
              Dump everything in your head right now
            </label>
            <p className="text-sm text-slate-600 mb-3">
              Don't organize, don't filter. Just type everything swirling around.
            </p>
            <textarea
              value={rawThoughts}
              onChange={(e) => setRawThoughts(e.target.value)}
              placeholder="Need to email Sarah about project and also buy groceries and mom's birthday next week need gift and car needs oil change and presentation Tuesday need to prepare and feeling anxious about everything..."
              className="w-full h-64 p-4 border-2 border-slate-200 rounded-lg focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 outline-none resize-none font-mono text-sm"
              autoFocus
            />
          </div>

          <button
            onClick={handleStructure}
            disabled={loading || !rawThoughts.trim()}
            className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-slate-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Structuring your thoughts...
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" />
                Structure This Chaos
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

        {results && results.structured_output && (
          <div className="space-y-6">
            {results.structured_output.next_step && (
              <div className="bg-yellow-50 border-4 border-yellow-400 rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-yellow-900 mb-3">⚡ Do This First</h2>
                <p className="text-2xl font-semibold text-yellow-900">{results.structured_output.next_step}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {results.structured_output.tasks && results.structured_output.tasks.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-bold text-emerald-900 mb-4">✓ Tasks (Actionable)</h3>
                  <ul className="space-y-2">
                    {results.structured_output.tasks.map((task, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <input type="checkbox" className="mt-1 w-4 h-4" />
                        <span className="text-slate-800">{task}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {results.structured_output.observations && results.structured_output.observations.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-bold text-blue-900 mb-4">📝 Observations (Not Tasks)</h3>
                  <ul className="space-y-2">
                    {results.structured_output.observations.map((obs, idx) => (
                      <li key={idx} className="text-slate-700 flex items-start gap-2">
                        <span className="text-blue-500">•</span>
                        <span>{obs}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {results.structured_output.priorities && results.structured_output.priorities.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Priority Order</h3>
                <div className="space-y-3">
                  {results.structured_output.priorities.map((item, idx) => (
                    <div key={idx} className="bg-gradient-to-r from-orange-50 to-yellow-50 border-l-4 border-orange-500 rounded-r-lg p-4">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl font-bold text-orange-600">#{item.rank || idx + 1}</span>
                        <div className="flex-1">
                          <div className="font-semibold text-slate-900">{item.task || item}</div>
                          {item.why_priority && (
                            <p className="text-sm text-slate-600 mt-1">{item.why_priority}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.categorized && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {results.categorized.urgent && results.categorized.urgent.length > 0 && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                    <h4 className="font-bold text-red-900 mb-2">🔥 Urgent</h4>
                    <ul className="space-y-1">
                      {results.categorized.urgent.map((item, idx) => (
                        <li key={idx} className="text-sm text-red-800">{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {results.categorized.important && results.categorized.important.length > 0 && (
                  <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4">
                    <h4 className="font-bold text-orange-900 mb-2">⚠️ Important</h4>
                    <ul className="space-y-1">
                      {results.categorized.important.map((item, idx) => (
                        <li key={idx} className="text-sm text-orange-800">{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {results.categorized.just_worries && results.categorized.just_worries.length > 0 && (
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                    <h4 className="font-bold text-blue-900 mb-2">💭 Just Worries</h4>
                    <ul className="space-y-1">
                      {results.categorized.just_worries.map((item, idx) => (
                        <li key={idx} className="text-sm text-blue-700">{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {results.relief_message && (
              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-6 text-center">
                <p className="text-emerald-900 text-lg">{results.relief_message}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BrainDumpStructurer;