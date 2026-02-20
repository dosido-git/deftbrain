import React, { useState } from 'react';
import { Calendar, Loader2, AlertCircle } from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';

const DoubleBookingDiplomat = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  
  const [event1, setEvent1] = useState('');
  const [event2, setEvent2] = useState('');
  const [preference, setPreference] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const handleResolve = async () => {
    if (!event1.trim() || !event2.trim()) {
      setError('Please describe both conflicting events');
      return;
    }

    setError('');
    setResults(null);

    try {
      const data = await callToolEndpoint('double-booking-diplomat', {
        event1: event1.trim(),
        event2: event2.trim(),
        preference: preference.trim()
      });
      
      setResults(data);
    } catch (err) {
      setError(err.message || 'Failed to resolve conflict. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <Calendar className="w-8 h-8 text-emerald-600" />
            <h1 className="text-4xl font-bold text-slate-900">Double-Booking Diplomat</h1>
          </div>
          <p className="text-slate-600">Gracefully handle scheduling conflicts</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="mb-6">
            <label className="block text-lg font-semibold text-slate-900 mb-3">
              First event
            </label>
            <textarea
              value={event1}
              onChange={(e) => setEvent1(e.target.value)}
              placeholder="e.g., 'Dinner with Sarah at 7pm Saturday'"
              className="w-full h-24 p-4 border-2 border-slate-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none resize-none"
            />
          </div>

          <div className="mb-6">
            <label className="block text-lg font-semibold text-slate-900 mb-3">
              Second event (conflicting)
            </label>
            <textarea
              value={event2}
              onChange={(e) => setEvent2(e.target.value)}
              placeholder="e.g., 'Work happy hour at 6:30pm Saturday'"
              className="w-full h-24 p-4 border-2 border-slate-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none resize-none"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Which would you prefer to attend? (Optional)
            </label>
            <input
              type="text"
              value={preference}
              onChange={(e) => setPreference(e.target.value)}
              placeholder="e.g., 'Prefer the dinner with Sarah'"
              className="w-full p-3 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
            />
          </div>

          <button
            onClick={handleResolve}
            disabled={loading || !event1.trim() || !event2.trim()}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Resolving conflict...
              </>
            ) : (
              <>
                <Calendar className="w-5 h-5" />
                Resolve Double-Booking
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
            {results.conflict_analysis && (
              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-6">
                <h2 className="text-xl font-bold text-emerald-900 mb-3">Conflict Analysis</h2>
                <div className="space-y-2 text-emerald-800">
                  <p><strong>Event 1:</strong> {results.conflict_analysis.event_1}</p>
                  <p><strong>Event 2:</strong> {results.conflict_analysis.event_2}</p>
                  <p className="text-lg font-semibold mt-3">
                    <strong>Recommendation:</strong> Prioritize {results.conflict_analysis.which_to_prioritize}
                  </p>
                  <p className="text-sm">{results.conflict_analysis.reasoning}</p>
                </div>
              </div>
            )}

            {results.recommended_approach && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Recommended Approach</h3>
                <div className="space-y-3">
                  <p className="text-slate-800">
                    <strong>Attend:</strong> {results.recommended_approach.attend}
                  </p>
                  <p className="text-slate-800">
                    <strong>Decline:</strong> {results.recommended_approach.decline}
                  </p>
                  <p className="text-slate-800">
                    <strong>Strategy:</strong> <span className="capitalize">{results.recommended_approach.strategy?.replace(/_/g, ' ')}</span>
                  </p>
                  <p className="text-slate-700 text-sm">{results.recommended_approach.why_this_strategy}</p>
                </div>
              </div>
            )}

            {results.decline_scripts && results.decline_scripts.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Decline Scripts</h3>
                <div className="space-y-4">
                  {results.decline_scripts.map((script, idx) => (
                    <div key={idx} className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                      <div className="font-bold text-purple-900 mb-2 capitalize">
                        {script.approach?.replace(/_/g, ' ')}
                      </div>
                      <div className="bg-white rounded p-3 mb-3">
                        <p className="text-slate-800 italic">"{script.script}"</p>
                      </div>
                      <p className="text-sm text-purple-800 mb-2">
                        <strong>When to use:</strong> {script.when_to_use}
                      </p>
                      {script.pros && script.pros.length > 0 && (
                        <div className="text-sm">
                          <strong className="text-emerald-700">Pros:</strong>
                          <ul className="list-disc list-inside text-emerald-700">
                            {script.pros.map((pro, proIdx) => (
                              <li key={proIdx}>{pro}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {script.cons && script.cons.length > 0 && (
                        <div className="text-sm mt-1">
                          <strong className="text-orange-700">Cons:</strong>
                          <ul className="list-disc list-inside text-orange-700">
                            {script.cons.map((con, conIdx) => (
                              <li key={conIdx}>{con}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.if_you_want_to_reschedule && (
              <div className="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-6">
                <h3 className="text-lg font-bold text-emerald-900 mb-3">Want to Reschedule Instead?</h3>
                <p className="text-emerald-800 mb-2">
                  <strong>Reschedule:</strong> {results.if_you_want_to_reschedule.event_to_reschedule}
                </p>
                <div className="bg-white rounded p-3 mb-2">
                  <p className="text-slate-800">"{results.if_you_want_to_reschedule.script}"</p>
                </div>
                {results.if_you_want_to_reschedule.alternative_times_suggestion && (
                  <p className="text-emerald-700 text-sm">{results.if_you_want_to_reschedule.alternative_times_suggestion}</p>
                )}
              </div>
            )}

            {results.prevention_tips && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-blue-900 mb-2">Prevention Tips</h3>
                <p className="text-blue-800">{results.prevention_tips}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoubleBookingDiplomat;