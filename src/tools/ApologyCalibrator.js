import React, { useState } from 'react';
import { Heart, Loader2, AlertCircle } from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';

const ApologyCalibrator = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  
  const [whatHappened, setWhatHappened] = useState('');
  const [relationship, setRelationship] = useState('');
  const [situation, setSituation] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const handleCalibrate = async () => {
    if (!whatHappened.trim()) {
      setError('Please describe what happened');
      return;
    }

    setError('');
    setResults(null);

    try {
      const data = await callToolEndpoint('apology-calibrator', {
        whatHappened: whatHappened.trim(),
        relationship: relationship.trim(),
        situation: situation.trim()
      });
      
      setResults(data);
    } catch (err) {
      setError(err.message || 'Failed to calibrate apology. Please try again.');
    }
  };

  const levelColors = {
    1: 'bg-emerald-100 border-emerald-400 text-emerald-900',
    2: 'bg-blue-100 border-blue-400 text-blue-900',
    3: 'bg-yellow-100 border-yellow-400 text-yellow-900',
    4: 'bg-orange-100 border-orange-400 text-orange-900',
    5: 'bg-red-100 border-red-400 text-red-900'
  };

  const levelNames = {
    1: 'No apology needed',
    2: 'Brief acknowledgment',
    3: 'Simple apology',
    4: 'Full apology with accountability',
    5: 'Major repair apology'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <Heart className="w-8 h-8 text-emerald-600" />
            <h1 className="text-4xl font-bold text-slate-900">Apology Calibrator</h1>
          </div>
          <p className="text-slate-600">Find the right level of apology for the situation</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="mb-6">
            <label className="block text-lg font-semibold text-slate-900 mb-3">
              What happened?
            </label>
            <textarea
              value={whatHappened}
              onChange={(e) => setWhatHappened(e.target.value)}
              placeholder="Describe the situation that might require an apology..."
              className="w-full h-32 p-4 border-2 border-slate-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Relationship to person (Optional)
              </label>
              <input
                type="text"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                placeholder="e.g., 'Close friend', 'Boss', 'Acquaintance'"
                className="w-full p-3 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Situation context (Optional)
              </label>
              <input
                type="text"
                value={situation}
                onChange={(e) => setSituation(e.target.value)}
                placeholder="e.g., 'Work', 'Personal', 'Public'"
                className="w-full p-3 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
              />
            </div>
          </div>

          <button
            onClick={handleCalibrate}
            disabled={loading || !whatHappened.trim()}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Calibrating...
              </>
            ) : (
              <>
                <Heart className="w-5 h-5" />
                Calibrate Apology
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
            {results.appropriate_apology_level && (
              <div className={`border-4 rounded-xl shadow-lg p-6 ${levelColors[results.appropriate_apology_level] || levelColors[3]}`}>
                <h2 className="text-3xl font-bold mb-2">
                  Level {results.appropriate_apology_level}: {levelNames[results.appropriate_apology_level]}
                </h2>
                {results.why_this_level && (
                  <p className="text-lg mt-3">{results.why_this_level}</p>
                )}
              </div>
            )}

            {results.situation_analysis && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Situation Analysis</h3>
                <div className="space-y-2 text-slate-800">
                  {results.situation_analysis.actual_harm_caused && (
                    <p><strong>Actual harm:</strong> {results.situation_analysis.actual_harm_caused}</p>
                  )}
                  {results.situation_analysis.your_responsibility_level && (
                    <p><strong>Your responsibility:</strong> {results.situation_analysis.your_responsibility_level}</p>
                  )}
                  {results.situation_analysis.relationship_context && (
                    <p><strong>Context:</strong> {results.situation_analysis.relationship_context}</p>
                  )}
                </div>
              </div>
            )}

            {results.apology_templates && results.apology_templates.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Apology Templates</h3>
                <div className="space-y-4">
                  {results.apology_templates.map((template, idx) => (
                    <div key={idx} className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="font-semibold text-emerald-900 capitalize">{template.tone}</div>
                        {template.when_to_use && (
                          <div className="text-xs text-emerald-700">{template.when_to_use}</div>
                        )}
                      </div>
                      <p className="text-slate-800 italic">"{template.option}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.what_NOT_to_say && results.what_NOT_to_say.length > 0 && (
              <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6">
                <h3 className="text-lg font-bold text-red-900 mb-3">⚠️ What NOT to Say</h3>
                <ul className="list-disc list-inside space-y-1">
                  {results.what_NOT_to_say.map((phrase, idx) => (
                    <li key={idx} className="text-red-800">{phrase}</li>
                  ))}
                </ul>
              </div>
            )}

            {results.if_youre_over_apologizing && (
              <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6">
                <h3 className="text-lg font-bold text-blue-900 mb-3">If You're Over-Apologizing</h3>
                {results.if_youre_over_apologizing.reality_check && (
                  <p className="text-blue-800 mb-2">{results.if_youre_over_apologizing.reality_check}</p>
                )}
                {results.if_youre_over_apologizing.reframe && (
                  <p className="text-blue-800 mb-2">
                    <strong>Say instead:</strong> {results.if_youre_over_apologizing.reframe}
                  </p>
                )}
                {results.if_youre_over_apologizing.permission && (
                  <p className="text-blue-900 font-semibold mt-3">{results.if_youre_over_apologizing.permission}</p>
                )}
              </div>
            )}

            {results.if_youre_under_apologizing && (
              <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-6">
                <h3 className="text-lg font-bold text-orange-900 mb-3">If You're Under-Apologizing</h3>
                {results.if_youre_under_apologizing.reality_check && (
                  <p className="text-orange-800 mb-2">{results.if_youre_under_apologizing.reality_check}</p>
                )}
                {results.if_youre_under_apologizing.what_to_add && (
                  <p className="text-orange-800 mb-2">
                    <strong>What to add:</strong> {results.if_youre_under_apologizing.what_to_add}
                  </p>
                )}
                {results.if_youre_under_apologizing.repair_actions && (
                  <div className="mt-2">
                    <strong className="text-orange-900">Repair actions:</strong>
                    <p className="text-orange-800">{results.if_youre_under_apologizing.repair_actions}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApologyCalibrator;