import React, { useState } from 'react';
import { Heart, Loader2, AlertCircle } from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';

const EmotionIdentifier = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  
  const [physicalSensations, setPhysicalSensations] = useState('');
  const [situationContext, setSituationContext] = useState('');
  const [behaviors, setBehaviors] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const handleIdentify = async () => {
    if (!physicalSensations.trim() && !situationContext.trim()) {
      setError('Please describe either physical sensations or your situation');
      return;
    }

    setError('');
    setResults(null);

    try {
      const data = await callToolEndpoint('emotion-identifier', {
        physicalSensations: physicalSensations.trim(),
        situationContext: situationContext.trim(),
        behaviors: behaviors.trim()
      });
      
      setResults(data);
    } catch (err) {
      setError(err.message || 'Failed to identify emotions. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <Heart className="w-8 h-8 text-emerald-600" />
            <h1 className="text-4xl font-bold text-slate-900">Emotion Identifier</h1>
          </div>
          <p className="text-slate-600">Turn body signals into emotion words</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="mb-6">
            <label className="block text-lg font-semibold text-slate-900 mb-3">
              What are you feeling in your body?
            </label>
            <textarea
              value={physicalSensations}
              onChange={(e) => setPhysicalSensations(e.target.value)}
              placeholder="e.g., 'Tight chest, can't breathe deeply, restless, can't sit still'"
              className="w-full h-32 p-4 border-2 border-slate-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none resize-none"
            />
          </div>

          <div className="mb-6">
            <label className="block text-lg font-semibold text-slate-900 mb-3">
              What's happening in your life right now?
            </label>
            <textarea
              value={situationContext}
              onChange={(e) => setSituationContext(e.target.value)}
              placeholder="e.g., 'Just got assigned a huge project with impossible deadline'"
              className="w-full h-24 p-4 border-2 border-slate-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none resize-none"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Behaviors or urges (Optional)
            </label>
            <input
              type="text"
              value={behaviors}
              onChange={(e) => setBehaviors(e.target.value)}
              placeholder="e.g., 'Want to hide, can't focus, need to move'"
              className="w-full p-3 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
            />
          </div>

          <button
            onClick={handleIdentify}
            disabled={loading || (!physicalSensations.trim() && !situationContext.trim())}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Identifying emotions...
              </>
            ) : (
              <>
                <Heart className="w-5 h-5" />
                Name My Emotions
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
            {results.likely_emotions && results.likely_emotions.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">You're Likely Feeling:</h2>
                <div className="space-y-4">
                  {results.likely_emotions.map((emotion, idx) => (
                    <div key={idx} className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-xl font-bold text-emerald-900">{emotion.emotion}</h3>
                        <span className="text-sm bg-emerald-200 text-emerald-800 px-3 py-1 rounded-full">
                          {emotion.confidence}% confident
                        </span>
                      </div>
                      <p className="text-emerald-800 mb-3">{emotion.description}</p>
                      <div className="text-sm space-y-1">
                        <p><strong>Physical match:</strong> {emotion.physical_match}</p>
                        <p><strong>Context match:</strong> {emotion.context_match}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.validation && (
              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-6">
                <p className="text-emerald-900 text-lg">{results.validation}</p>
              </div>
            )}

            {results.what_to_do_with_this_emotion && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-blue-900 mb-3">What To Do With This Emotion</h3>
                <ol className="space-y-3">
                  {results.what_to_do_with_this_emotion.map((step, idx) => (
                    <li key={idx} className="flex gap-3">
                      <span className="font-bold text-blue-600">{idx + 1}.</span>
                      <div>
                        <div className="font-semibold text-blue-900">{step.step}</div>
                        <p className="text-blue-800 text-sm mt-1"><strong>Action:</strong> {step.action}</p>
                        <p className="text-blue-700 text-sm italic">{step.why}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmotionIdentifier;