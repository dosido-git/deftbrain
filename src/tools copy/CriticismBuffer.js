import React, { useState } from 'react';
import { Shield, Loader2, AlertCircle, Copy } from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';

const CriticismBuffer = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  
  const [harshFeedback, setHarshFeedback] = useState('');
  const [sourceContext, setSourceContext] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleBuffer = async () => {
    if (!harshFeedback.trim()) {
      setError('Please paste the harsh feedback');
      return;
    }

    setError('');
    setResults(null);

    try {
      const data = await callToolEndpoint('criticism-buffer', {
        harshFeedback: harshFeedback.trim(),
        sourceContext: sourceContext.trim()
      });
      
      setResults(data);
    } catch (err) {
      setError(err.message || 'Failed to buffer criticism. Please try again.');
    }
  };

  const copyBufferedVersion = () => {
    if (results?.buffered_version?.professional_rewrite) {
      navigator.clipboard.writeText(results.buffered_version.professional_rewrite);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <Shield className="w-8 h-8 text-emerald-600" />
            <h1 className="text-4xl font-bold text-slate-900">Criticism Buffer</h1>
          </div>
          <p className="text-slate-600">Extract useful feedback, remove unnecessary cruelty</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="mb-6">
            <label className="block text-lg font-semibold text-slate-900 mb-3">
              Paste the harsh feedback you received
            </label>
            <textarea
              value={harshFeedback}
              onChange={(e) => setHarshFeedback(e.target.value)}
              placeholder="Paste the mean email, critical comment, or harsh review here..."
              className="w-full h-40 p-4 border-2 border-slate-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none resize-none"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Who is this from? (Optional)
            </label>
            <input
              type="text"
              value={sourceContext}
              onChange={(e) => setSourceContext(e.target.value)}
              placeholder="e.g., 'My boss', 'Client', 'Internet stranger'"
              className="w-full p-3 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
            />
          </div>

          <button
            onClick={handleBuffer}
            disabled={loading || !harshFeedback.trim()}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Buffering criticism...
              </>
            ) : (
              <>
                <Shield className="w-5 h-5" />
                Buffer This Feedback
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
            {results.buffered_version && (
              <div className="bg-emerald-50 border-2 border-emerald-300 rounded-xl shadow-lg p-6">
                <div className="flex items-start justify-between mb-3">
                  <h2 className="text-2xl font-bold text-emerald-900">Buffered Version</h2>
                  <button
                    onClick={copyBufferedVersion}
                    className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="text-lg text-emerald-900 leading-relaxed">
                  {results.buffered_version.professional_rewrite}
                </p>
                <div className="mt-4 pt-4 border-t border-emerald-200">
                  <p className="text-sm text-emerald-800"><strong>What was removed:</strong> {results.buffered_version.what_was_removed}</p>
                  <p className="text-sm text-emerald-800 mt-1"><strong>What was kept:</strong> {results.buffered_version.what_was_kept}</p>
                </div>
              </div>
            )}

            {results.what_you_actually_need_to_know && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-4">What You Actually Need To Know</h3>
                {results.what_you_actually_need_to_know.actionable_points && results.what_you_actually_need_to_know.actionable_points.length > 0 && (
                  <div className="mb-4">
                    <div className="font-semibold text-emerald-800 mb-2">✓ Actionable points:</div>
                    <ul className="space-y-1">
                      {results.what_you_actually_need_to_know.actionable_points.map((point, idx) => (
                        <li key={idx} className="text-emerald-700 flex items-start gap-2">
                          <span>•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {results.what_you_actually_need_to_know.non_actionable_attacks && results.what_you_actually_need_to_know.non_actionable_attacks.length > 0 && (
                  <div>
                    <div className="font-semibold text-red-800 mb-2">✗ Non-actionable attacks (ignore these):</div>
                    <ul className="space-y-1">
                      {results.what_you_actually_need_to_know.non_actionable_attacks.map((attack, idx) => (
                        <li key={idx} className="text-red-600 flex items-start gap-2 line-through">
                          <span>•</span>
                          <span>{attack}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {results.action_steps && results.action_steps.length > 0 && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-blue-900 mb-3">Action Steps</h3>
                <div className="space-y-3">
                  {results.action_steps.map((step, idx) => (
                    <div key={idx} className="bg-white rounded-lg p-3">
                      <div className="font-semibold text-blue-900">{step.task}</div>
                      <p className="text-sm text-blue-800 mt-1">{step.specific}</p>
                      <p className="text-sm text-blue-700 italic mt-1">{step.why}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.your_worth_is_not_this_feedback && (
              <div className="bg-purple-50 border-2 border-purple-300 rounded-xl p-6">
                <p className="text-purple-900 text-lg font-medium">{results.your_worth_is_not_this_feedback}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CriticismBuffer;