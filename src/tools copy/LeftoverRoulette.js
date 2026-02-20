import React, { useState } from 'react';
import { Utensils, Loader2, AlertCircle } from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';

const LeftoverRoulette = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  
  const [leftovers, setLeftovers] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const handleTransform = async () => {
    if (!leftovers.trim()) {
      setError('Please list your leftovers');
      return;
    }

    setError('');
    setResults(null);

    try {
      const data = await callToolEndpoint('leftover-roulette', {
        leftovers: leftovers.trim()
      });
      
      setResults(data);
    } catch (err) {
      setError(err.message || 'Failed to transform leftovers. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <Utensils className="w-8 h-8 text-orange-600" />
            <h1 className="text-4xl font-bold text-slate-900">Leftover Roulette</h1>
          </div>
          <p className="text-slate-600">Transform refrigerator odds and ends into new meals</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="mb-6">
            <label className="block text-lg font-semibold text-slate-900 mb-3">
              What leftovers do you have?
            </label>
            <textarea
              value={leftovers}
              onChange={(e) => setLeftovers(e.target.value)}
              placeholder="e.g., 'Half a rotisserie chicken, white rice, roasted vegetables, some pasta, tomato sauce'"
              className="w-full h-40 p-4 border-2 border-slate-200 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none resize-none"
            />
          </div>

          <button
            onClick={handleTransform}
            disabled={loading || !leftovers.trim()}
            className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-slate-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Transforming leftovers...
              </>
            ) : (
              <>
                <Utensils className="w-5 h-5" />
                Transform My Leftovers
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
            {results.transformation_meals && results.transformation_meals.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-slate-900">New Meals from Your Leftovers</h3>
                {results.transformation_meals.map((meal, idx) => (
                  <div key={idx} className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="text-2xl font-bold text-orange-900">{meal.meal_name}</h4>
                        <p className="text-slate-600 mt-1">{meal.description}</p>
                      </div>
                      <div className="text-right text-sm">
                        <div className="text-slate-600">{meal.time}</div>
                        <div className="text-slate-600 capitalize">{meal.difficulty}</div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h5 className="font-semibold text-slate-900 mb-2">Leftovers used:</h5>
                      <div className="flex flex-wrap gap-2">
                        {meal.leftovers_used.map((item, itemIdx) => (
                          <span key={itemIdx} className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>

                    {meal.additional_ingredients_needed && meal.additional_ingredients_needed.length > 0 && (
                      <div className="mb-4">
                        <h5 className="font-semibold text-slate-900 mb-2">You'll also need:</h5>
                        <div className="flex flex-wrap gap-2">
                          {meal.additional_ingredients_needed.map((ing, ingIdx) => (
                            <span key={ingIdx} className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                              {ing}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mb-4">
                      <h5 className="font-semibold text-slate-900 mb-2">Transformation method:</h5>
                      <p className="text-slate-700">{meal.transformation_method}</p>
                    </div>

                    <div className="mb-4">
                      <h5 className="font-semibold text-slate-900 mb-2">Instructions:</h5>
                      <ol className="space-y-2">
                        {meal.instructions.map((step, stepIdx) => (
                          <li key={stepIdx} className="flex gap-3">
                            <span className="font-bold text-orange-600">{stepIdx + 1}.</span>
                            <span className="text-slate-800">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    {meal.tips && (
                      <div className="bg-orange-50 border-l-4 border-orange-500 rounded-r-lg p-4 mb-4">
                        <p className="text-orange-900"><strong>Tip:</strong> {meal.tips}</p>
                      </div>
                    )}

                    {meal.why_this_works && (
                      <p className="text-sm text-slate-600 italic">{meal.why_this_works}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {results.ingredients_not_used && results.ingredients_not_used.length > 0 && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                <h3 className="font-bold text-blue-900 mb-2">Leftovers not used (save for later):</h3>
                <p className="text-blue-800">{results.ingredients_not_used.join(', ')}</p>
              </div>
            )}

            {results.food_safety && (
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6">
                <h3 className="font-bold text-yellow-900 mb-2">⚠️ Food Safety</h3>
                <p className="text-yellow-800">{results.food_safety}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeftoverRoulette;