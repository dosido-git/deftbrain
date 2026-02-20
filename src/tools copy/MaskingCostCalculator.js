import React, { useState } from 'react';
import { Eye, Loader2, AlertCircle, Plus, X } from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';

const MaskingCostCalculator = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  
  const [interactions, setInteractions] = useState([
    { situation: '', maskingEffort: 5, energyBefore: 10, energyAfter: 5 }
  ]);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const addInteraction = () => {
    setInteractions([...interactions, { situation: '', maskingEffort: 5, energyBefore: 10, energyAfter: 5 }]);
  };

  const removeInteraction = (index) => {
    setInteractions(interactions.filter((_, i) => i !== index));
  };

  const updateInteraction = (index, field, value) => {
    const newInteractions = [...interactions];
    newInteractions[index][field] = value;
    setInteractions(newInteractions);
  };

  const handleCalculate = async () => {
    const filledInteractions = interactions.filter(i => i.situation.trim());
    if (filledInteractions.length === 0) {
      setError('Please add at least one interaction');
      return;
    }

    setError('');
    setResults(null);

    try {
      const data = await callToolEndpoint('masking-cost-calculator', {
        interactions: filledInteractions
      });
      
      setResults(data);
    } catch (err) {
      setError(err.message || 'Failed to calculate masking cost. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-emerald-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <Eye className="w-8 h-8 text-purple-600" />
            <h1 className="text-4xl font-bold text-slate-900">Masking Cost Calculator</h1>
          </div>
          <p className="text-slate-600">Track the energy cost of hiding your neurodivergence</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <label className="block text-lg font-semibold text-slate-900 mb-3">
            Log your social interactions this week
          </label>

          <div className="space-y-4 mb-4">
            {interactions.map((interaction, index) => (
              <div key={index} className="bg-slate-50 rounded-lg p-4 border-2 border-slate-200">
                <div className="flex items-start justify-between mb-3">
                  <input
                    type="text"
                    value={interaction.situation}
                    onChange={(e) => updateInteraction(index, 'situation', e.target.value)}
                    placeholder="e.g., 'Work meeting with boss', 'Networking event', 'Dinner with friends'"
                    className="flex-1 p-2 border border-slate-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                  />
                  {interactions.length > 1 && (
                    <button
                      onClick={() => removeInteraction(index)}
                      className="ml-2 p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Masking effort: {interaction.maskingEffort}/10
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={interaction.maskingEffort}
                      onChange={(e) => updateInteraction(index, 'maskingEffort', parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Energy before: {interaction.energyBefore}/10
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={interaction.energyBefore}
                      onChange={(e) => updateInteraction(index, 'energyBefore', parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Energy after: {interaction.energyAfter}/10
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={interaction.energyAfter}
                      onChange={(e) => updateInteraction(index, 'energyAfter', parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-600"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={addInteraction}
            className="w-full mb-6 py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Another Interaction
          </button>

          <button
            onClick={handleCalculate}
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Calculating costs...
              </>
            ) : (
              <>
                <Eye className="w-5 h-5" />
                Calculate Masking Cost
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

        {results && results.masking_patterns && (
          <div className="space-y-6">
            {results.masking_patterns.total_weekly_masking_cost && (
              <div className="bg-purple-50 border-4 border-purple-400 rounded-xl shadow-lg p-6 text-center">
                <h2 className="text-xl font-bold text-purple-900 mb-2">Your Weekly Masking Cost</h2>
                <p className="text-4xl font-bold text-purple-900 mb-2">
                  {results.masking_patterns.total_weekly_masking_cost}
                </p>
                {results.masking_patterns.recovery_days_needed && (
                  <p className="text-purple-800">
                    Recovery needed: {results.masking_patterns.recovery_days_needed}
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {results.masking_patterns.highest_cost_situations && results.masking_patterns.highest_cost_situations.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-bold text-red-900 mb-4">🔴 Highest Cost Situations</h3>
                  <div className="space-y-3">
                    {results.masking_patterns.highest_cost_situations.map((situation, idx) => (
                      <div key={idx} className="bg-red-50 border-2 border-red-200 rounded-lg p-3">
                        <div className="font-semibold text-red-900">{situation.situation}</div>
                        <div className="text-sm text-red-700 mt-1">
                          Masking effort: {situation.masking_effort} • Energy drain: {situation.energy_drain}
                        </div>
                        {situation.why_costly && (
                          <p className="text-sm text-red-600 mt-1">{situation.why_costly}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results.masking_patterns.lower_cost_situations && results.masking_patterns.lower_cost_situations.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-bold text-emerald-900 mb-4">✅ Lower Cost Situations</h3>
                  <div className="space-y-3">
                    {results.masking_patterns.lower_cost_situations.map((situation, idx) => (
                      <div key={idx} className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-3">
                        <div className="font-semibold text-emerald-900">{situation.situation}</div>
                        <div className="text-sm text-emerald-700 mt-1">
                          Masking effort: {situation.masking_effort} • Energy drain: {situation.energy_drain}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {results.validation && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-blue-900 mb-2">💙 Validation</h3>
                <p className="text-blue-800 text-lg">{results.validation}</p>
              </div>
            )}

            {results.insights && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Insights</h3>
                <div className="space-y-2 text-slate-800">
                  {results.insights.most_draining && (
                    <p><strong>Most draining:</strong> {results.insights.most_draining}</p>
                  )}
                  {results.insights.safest_spaces && (
                    <p><strong>Safest spaces:</strong> {results.insights.safest_spaces}</p>
                  )}
                  {results.insights.recommendations && (
                    <div>
                      <strong>Recommendations:</strong>
                      <ul className="list-disc list-inside ml-4 mt-1">
                        {results.insights.recommendations.map((rec, idx) => (
                          <li key={idx}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MaskingCostCalculator;