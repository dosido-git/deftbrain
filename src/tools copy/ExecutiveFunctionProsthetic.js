import React, { useState } from 'react';
import { Brain, Loader2, AlertCircle, Clock, List } from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';

const ExecutiveFunctionProsthetic = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  
  const [queryType, setQueryType] = useState('what_was_i_doing');
  const [currentTask, setCurrentTask] = useState('');
  const [taskSequence, setTaskSequence] = useState('');
  const [forgettingPoint, setForgettingPoint] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const queryTypes = [
    { id: 'what_was_i_doing', name: 'What was I doing?', icon: '❓', description: 'Recover interrupted task' },
    { id: 'why_came_here', name: 'Why did I come here?', icon: '🚪', description: 'Location memory recovery' },
    { id: 'whats_next', name: "What's next?", icon: '➡️', description: 'Next step in sequence' },
    { id: 'leaving_house', name: 'Leaving house checklist', icon: '🏠', description: 'Pre-departure items' }
  ];

  const handleQuery = async () => {
    setError('');
    setResults(null);

    try {
      const data = await callToolEndpoint('executive-function-prosthetic', {
        queryType,
        currentTask: currentTask.trim(),
        taskSequence: taskSequence.trim(),
        forgettingPoint: forgettingPoint.trim()
      });
      
      setResults(data);
    } catch (err) {
      setError(err.message || 'Failed to process query. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-fuchsia-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <Brain className="w-8 h-8 text-emerald-600" />
            <h1 className="text-4xl font-bold text-slate-900">Executive Function Prosthetic</h1>
          </div>
          <p className="text-slate-600">Your external working memory when your brain won't hold things</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="mb-6">
            <label className="block text-lg font-semibold text-slate-900 mb-3">
              What do you need help remembering?
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {queryTypes.map(type => (
                <button
                  key={type.id}
                  onClick={() => setQueryType(type.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    queryType === type.id
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-slate-200 hover:border-emerald-300 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{type.icon}</span>
                    <div>
                      <div className="font-semibold text-slate-900">{type.name}</div>
                      <div className="text-sm text-slate-600">{type.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                What were you doing? (Optional)
              </label>
              <input
                type="text"
                value={currentTask}
                onChange={(e) => setCurrentTask(e.target.value)}
                placeholder="e.g., 'Making breakfast, then phone rang...'"
                className="w-full p-3 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Task sequence context (Optional)
              </label>
              <input
                type="text"
                value={taskSequence}
                onChange={(e) => setTaskSequence(e.target.value)}
                placeholder="e.g., 'Step 1: boil water, Step 2: add coffee grounds...'"
                className="w-full p-3 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Where did you get stuck? (Optional)
              </label>
              <input
                type="text"
                value={forgettingPoint}
                onChange={(e) => setForgettingPoint(e.target.value)}
                placeholder="e.g., 'Walked to bedroom and forgot why'"
                className="w-full p-3 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
              />
            </div>
          </div>

          <button
            onClick={handleQuery}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Recovering memory...
              </>
            ) : (
              <>
                <Brain className="w-5 h-5" />
                Help Me Remember
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
            {results.current_state_tracking && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">What You Were Doing</h2>
                <div className="space-y-3">
                  <p><strong>Active task:</strong> {results.current_state_tracking.active_task}</p>
                  {results.current_state_tracking.steps_completed && (
                    <div>
                      <strong>Steps completed:</strong>
                      <ul className="list-disc list-inside ml-4 mt-1">
                        {results.current_state_tracking.steps_completed.map((step, idx) => (
                          <li key={idx} className="text-slate-700">{step}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="bg-emerald-50 border-2 border-emerald-300 rounded-lg p-4 mt-4">
                    <p className="text-lg font-semibold text-emerald-900">
                      Next step: {results.current_state_tracking.next_step}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {results.interruption_recovery && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-blue-900 mb-3">Recovery Context</h3>
                <div className="space-y-2 text-blue-800">
                  <p><strong>What you were doing:</strong> {results.interruption_recovery.what_you_were_doing}</p>
                  <p><strong>Last complete thought:</strong> {results.interruption_recovery.last_complete_thought}</p>
                  <p><strong>Next action:</strong> {results.interruption_recovery.next_action}</p>
                </div>
              </div>
            )}

            {results.pre_loaded_sequences && results.pre_loaded_sequences.leaving_house && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-3">Leaving House Checklist</h3>
                <ul className="space-y-2">
                  {results.pre_loaded_sequences.leaving_house.checklist.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <input type="checkbox" className="w-4 h-4" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExecutiveFunctionProsthetic;