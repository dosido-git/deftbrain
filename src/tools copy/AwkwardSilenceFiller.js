import React, { useState } from 'react';
import { MessageCircle, Loader2, AlertCircle } from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';

const AwkwardSilenceFiller = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  
  const [conversationContext, setConversationContext] = useState('');
  const [settingType, setSettingType] = useState('casual');
  const [comfortLevel, setComfortLevel] = useState('medium');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setError('');
    setResults(null);

    try {
      const data = await callToolEndpoint('awkward-silence-filler', {
        conversationContext: conversationContext.trim(),
        settingType,
        comfortLevel
      });
      
      setResults(data);
    } catch (err) {
      setError(err.message || 'Failed to generate conversation fillers. Please try again.');
    }
  };

  const riskColors = {
    low: 'bg-emerald-100 border-emerald-400',
    medium: 'bg-yellow-100 border-yellow-400'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <MessageCircle className="w-8 h-8 text-emerald-600" />
            <h1 className="text-4xl font-bold text-slate-900">Awkward Silence Filler</h1>
          </div>
          <p className="text-slate-600">Context-appropriate things to say when conversation stalls</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="mb-6">
            <label className="block text-lg font-semibold text-slate-900 mb-3">
              Conversation context (Optional)
            </label>
            <input
              type="text"
              value={conversationContext}
              onChange={(e) => setConversationContext(e.target.value)}
              placeholder="e.g., 'Talking to coworker at lunch', 'First date'"
              className="w-full p-3 border-2 border-slate-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Setting type
              </label>
              <select
                value={settingType}
                onChange={(e) => setSettingType(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
              >
                <option value="casual">Casual social</option>
                <option value="work">Work event</option>
                <option value="party">Party/gathering</option>
                <option value="first_date">First date</option>
                <option value="family">Family gathering</option>
                <option value="networking">Networking event</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Comfort level
              </label>
              <select
                value={comfortLevel}
                onChange={(e) => setComfortLevel(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
              >
                <option value="low">Low - very anxious</option>
                <option value="medium">Medium anxiety</option>
                <option value="high">High - fairly comfortable</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating conversation fillers...
              </>
            ) : (
              <>
                <MessageCircle className="w-5 h-5" />
                Get Conversation Fillers
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
            {results.context_analysis && (
              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-6">
                <h2 className="text-xl font-bold text-emerald-900 mb-3">Context</h2>
                <div className="space-y-1 text-emerald-800">
                  <p><strong>Setting:</strong> {results.context_analysis.setting}</p>
                  <p><strong>Anxiety level:</strong> {results.context_analysis.anxiety_level}</p>
                  {results.context_analysis.silence_reason && (
                    <p><strong>Why silence happened:</strong> {results.context_analysis.silence_reason}</p>
                  )}
                </div>
              </div>
            )}

            {results.conversation_fillers && results.conversation_fillers.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Conversation Fillers</h3>
                <div className="space-y-3">
                  {results.conversation_fillers.map((filler, idx) => (
                    <div key={idx} className={`border-2 rounded-lg p-4 ${riskColors[filler.risk_level] || riskColors.low}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="font-semibold text-slate-900 capitalize">{filler.category}</div>
                        <span className="text-xs px-2 py-1 bg-white rounded-full capitalize">
                          {filler.risk_level} risk
                        </span>
                      </div>
                      <p className="text-lg text-slate-900 mb-2 italic">"{filler.line}"</p>
                      <p className="text-sm text-slate-700 mb-1">
                        <strong>Follow-up:</strong> {filler.follow_up}
                      </p>
                      <p className="text-sm text-slate-600">
                        <strong>When to use:</strong> {filler.when_to_use}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.body_language_tips && results.body_language_tips.length > 0 && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-blue-900 mb-3">Body Language Tips</h3>
                <ul className="space-y-1">
                  {results.body_language_tips.map((tip, idx) => (
                    <li key={idx} className="text-blue-800 flex items-start gap-2">
                      <span className="text-blue-600">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {results.what_NOT_to_say && results.what_NOT_to_say.length > 0 && (
              <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6">
                <h3 className="text-lg font-bold text-red-900 mb-3">⚠️ What NOT to Say</h3>
                <ul className="list-disc list-inside space-y-1">
                  {results.what_NOT_to_say.map((avoid, idx) => (
                    <li key={idx} className="text-red-800">{avoid}</li>
                  ))}
                </ul>
              </div>
            )}

            {results.silence_acceptance && (
              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-6 text-center">
                <p className="text-emerald-900">{results.silence_acceptance}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AwkwardSilenceFiller;