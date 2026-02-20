import React, { useState } from 'react';
import { ArrowRightLeft, Loader2, AlertCircle } from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';

const TransitionSoftener = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  
  const [transitionFrom, setTransitionFrom] = useState('');
  const [transitionTo, setTransitionTo] = useState('');
  const [timeAvailable, setTimeAvailable] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!transitionFrom.trim() || !transitionTo.trim()) {
      setError('Please specify what you\'re transitioning from and to');
      return;
    }

    setError('');
    setResults(null);

    try {
      const data = await callToolEndpoint('transition-softener', {
        transitionFrom: transitionFrom.trim(),
        transitionTo: transitionTo.trim(),
        timeAvailable: timeAvailable.trim(),
        difficulty
      });
      
      setResults(data);
    } catch (err) {
      setError(err.message || 'Failed to create transition protocol. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <ArrowRightLeft className="w-8 h-8 text-sky-600" />
            <h1 className="text-4xl font-bold text-slate-900">Transition Softener</h1>
          </div>
          <p className="text-slate-600">Buffer rituals for switching between activities</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-lg font-semibold text-slate-900 mb-3">
                Transitioning FROM:
              </label>
              <input
                type="text"
                value={transitionFrom}
                onChange={(e) => setTransitionFrom(e.target.value)}
                placeholder="e.g., 'Intense work focus', 'Alone time'"
                className="w-full p-3 border-2 border-slate-200 rounded-lg focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none"
              />
            </div>

            <div>
              <label className="block text-lg font-semibold text-slate-900 mb-3">
                Transitioning TO:
              </label>
              <input
                type="text"
                value={transitionTo}
                onChange={(e) => setTransitionTo(e.target.value)}
                placeholder="e.g., 'Home/family time', 'Social event'"
                className="w-full p-3 border-2 border-slate-200 rounded-lg focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Time available for transition (Optional)
              </label>
              <input
                type="text"
                value={timeAvailable}
                onChange={(e) => setTimeAvailable(e.target.value)}
                placeholder="e.g., '30 minutes', '10 minutes'"
                className="w-full p-3 border border-slate-300 rounded-lg focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                How difficult is this transition?
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-lg focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="very_hard">Very Hard</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={loading || !transitionFrom.trim() || !transitionTo.trim()}
            className="w-full bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating protocol...
              </>
            ) : (
              <>
                <ArrowRightLeft className="w-5 h-5" />
                Create Transition Protocol
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

        {results && results.transition_protocol && (
          <div className="space-y-6">
            <div className="bg-sky-50 border-2 border-sky-200 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-sky-900 mb-2">Your Transition</h2>
              <p className="text-sky-800 text-lg">
                {results.transition.from} → {results.transition.to}
              </p>
              <p className="text-sky-700 mt-2">{results.transition.challenge}</p>
            </div>

            {['phase_1_warning', 'phase_2_closure', 'phase_3_buffer_ritual', 'phase_4_preparation', 'phase_5_entry'].map((phaseKey, idx) => {
              const phase = results.transition_protocol[phaseKey];
              if (!phase) return null;

              const phaseNames = {
                phase_1_warning: 'Warning Phase',
                phase_2_closure: 'Closure Phase',
                phase_3_buffer_ritual: 'Buffer Ritual',
                phase_4_preparation: 'Preparation',
                phase_5_entry: 'Entry Phase'
              };

              return (
                <div key={phaseKey} className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-sky-600 text-white rounded-full flex items-center justify-center font-bold">
                      {idx + 1}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{phaseNames[phaseKey]}</h3>
                      <p className="text-sm text-slate-600">{phase.timing} • {phase.duration}</p>
                    </div>
                  </div>

                  {phase.action && <p className="text-slate-800 mb-2"><strong>Action:</strong> {phase.action}</p>}
                  {phase.activities && (
                    <div className="mb-2">
                      <strong className="text-slate-900">Activities:</strong>
                      <ul className="list-disc list-inside ml-4 mt-1">
                        {phase.activities.map((activity, actIdx) => (
                          <li key={actIdx} className="text-slate-700">{activity}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {phase.entry_ritual && (
                    <div className="mb-2">
                      <strong className="text-slate-900">Entry ritual:</strong>
                      <ul className="list-disc list-inside ml-4 mt-1">
                        {phase.entry_ritual.map((ritual, ritIdx) => (
                          <li key={ritIdx} className="text-slate-700">{ritual}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <p className="text-sky-700 italic mt-3">{phase.purpose}</p>
                </div>
              );
            })}

            {results.why_this_works && (
              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-emerald-900 mb-2">Why This Works</h3>
                <p className="text-emerald-800">{results.why_this_works}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TransitionSoftener;