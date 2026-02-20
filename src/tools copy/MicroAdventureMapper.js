import React, { useState } from 'react';
import { Map, Loader2, AlertCircle } from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';

const MicroAdventureMapper = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  
  const [location, setLocation] = useState('');
  const [timeAvailable, setTimeAvailable] = useState('');
  const [budget, setBudget] = useState('');
  const [interests, setInterests] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const handleMap = async () => {
    setError('');
    setResults(null);

    try {
      const data = await callToolEndpoint('micro-adventure-mapper', {
        location: location.trim(),
        timeAvailable: timeAvailable.trim(),
        budget: budget.trim(),
        interests: interests.trim()
      });
      
      setResults(data);
    } catch (err) {
      setError(err.message || 'Failed to map adventure. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <Map className="w-8 h-8 text-sky-600" />
            <h1 className="text-4xl font-bold text-slate-900">Micro-Adventure Mapper</h1>
          </div>
          <p className="text-slate-600">Find interesting experiences within ordinary constraints</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Your location (Optional)
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., 'San Francisco', 'Chicago'"
                className="w-full p-3 border border-slate-300 rounded-lg focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Time available (Optional)
              </label>
              <input
                type="text"
                value={timeAvailable}
                onChange={(e) => setTimeAvailable(e.target.value)}
                placeholder="e.g., '2-3 hours', 'Half day'"
                className="w-full p-3 border border-slate-300 rounded-lg focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Budget (Optional)
              </label>
              <input
                type="text"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="e.g., 'Free', 'Under $20'"
                className="w-full p-3 border border-slate-300 rounded-lg focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Interests (Optional)
              </label>
              <input
                type="text"
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                placeholder="e.g., 'Photography', 'Nature'"
                className="w-full p-3 border border-slate-300 rounded-lg focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none"
              />
            </div>
          </div>

          <button
            onClick={handleMap}
            disabled={loading}
            className="w-full bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Mapping adventure...
              </>
            ) : (
              <>
                <Map className="w-5 h-5" />
                Find My Micro-Adventure
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

        {results && results.micro_adventure_plan && (
          <div className="space-y-6">
            <div className="bg-sky-50 border-4 border-sky-400 rounded-xl shadow-lg p-6">
              <h2 className="text-3xl font-bold text-sky-900 mb-3">{results.micro_adventure_plan.adventure_name}</h2>
              <div className="flex flex-wrap gap-3 mb-4">
                <span className="px-3 py-1 bg-sky-200 text-sky-900 rounded-full text-sm font-semibold capitalize">
                  {results.micro_adventure_plan.category}
                </span>
                <span className="px-3 py-1 bg-emerald-200 text-emerald-900 rounded-full text-sm font-semibold">
                  {results.micro_adventure_plan.cost}
                </span>
                <span className="px-3 py-1 bg-purple-200 text-purple-900 rounded-full text-sm font-semibold">
                  {results.micro_adventure_plan.time_required}
                </span>
                <span className="px-3 py-1 bg-orange-200 text-orange-900 rounded-full text-sm font-semibold capitalize">
                  {results.micro_adventure_plan.difficulty}
                </span>
              </div>
              <p className="text-sky-800 text-lg mb-3">{results.micro_adventure_plan.description}</p>
              <p className="text-sky-700 italic">{results.micro_adventure_plan.why_this_is_adventure}</p>
            </div>

            {results.detailed_itinerary && results.detailed_itinerary.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Itinerary</h3>
                <div className="space-y-4">
                  {results.detailed_itinerary.map((item, idx) => (
                    <div key={idx} className="bg-sky-50 border-l-4 border-sky-500 rounded-r-lg p-4">
                      <div className="font-bold text-sky-900 mb-1">{item.time}</div>
                      <div className="text-slate-900 mb-1">{item.activity}</div>
                      <div className="text-sm text-slate-700 mb-1"><strong>Location:</strong> {item.location}</div>
                      {item.pro_tip && (
                        <div className="text-sm text-sky-700 italic mt-2">💡 {item.pro_tip}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {results.what_to_bring && results.what_to_bring.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-3">What to Bring</h3>
                  <ul className="space-y-1">
                    {results.what_to_bring.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-slate-700">
                        <span className="text-sky-600">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {results.how_to_get_there && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-3">How to Get There</h3>
                  <p className="text-slate-700">{results.how_to_get_there}</p>
                </div>
              )}
            </div>

            {results.best_time && (
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6">
                <h3 className="font-bold text-yellow-900 mb-2">⏰ Best Time</h3>
                <p className="text-yellow-800">{results.best_time}</p>
              </div>
            )}

            {results.barrier_removal && (
              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-6 text-center">
                <p className="text-emerald-900 text-lg">{results.barrier_removal}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MicroAdventureMapper;