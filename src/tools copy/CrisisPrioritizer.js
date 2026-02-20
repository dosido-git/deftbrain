import React, { useState } from 'react';
import { Flame, Loader2, AlertCircle, Plus, X } from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';

const CrisisPrioritizer = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  
  const [tasks, setTasks] = useState(['']);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const addTask = () => setTasks([...tasks, '']);
  const removeTask = (index) => setTasks(tasks.filter((_, i) => i !== index));
  const updateTask = (index, value) => {
    const newTasks = [...tasks];
    newTasks[index] = value;
    setTasks(newTasks);
  };

  const handlePrioritize = async () => {
    const filledTasks = tasks.filter(t => t.trim());
    if (filledTasks.length === 0) {
      setError('Please add at least one task');
      return;
    }

    setError('');
    setResults(null);

    try {
      const data = await callToolEndpoint('crisis-prioritizer', {
        tasks: filledTasks.map((task, idx) => ({ id: idx + 1, task }))
      });
      
      setResults(data);
    } catch (err) {
      setError(err.message || 'Failed to prioritize tasks. Please try again.');
    }
  };

  const urgencyColors = {
    critical: 'bg-red-100 border-red-400 text-red-900',
    important: 'bg-orange-100 border-orange-400 text-orange-900',
    medium: 'bg-yellow-100 border-yellow-400 text-yellow-900',
    low: 'bg-emerald-100 border-emerald-400 text-emerald-900',
    optional: 'bg-slate-100 border-slate-400 text-slate-700'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <Flame className="w-8 h-8 text-red-600" />
            <h1 className="text-4xl font-bold text-slate-900">Crisis Prioritizer</h1>
          </div>
          <p className="text-slate-600">Separate actual urgency from anxiety-driven urgency</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <label className="block text-lg font-semibold text-slate-900 mb-3">
            What tasks feel urgent right now?
          </label>
          
          <div className="space-y-3 mb-4">
            {tasks.map((task, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={task}
                  onChange={(e) => updateTask(index, e.target.value)}
                  placeholder={`Task ${index + 1}...`}
                  className="flex-1 p-3 border border-slate-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none"
                />
                {tasks.length > 1 && (
                  <button
                    onClick={() => removeTask(index)}
                    className="p-3 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={addTask}
            className="w-full mb-6 py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Another Task
          </button>

          <button
            onClick={handlePrioritize}
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing urgency...
              </>
            ) : (
              <>
                <Flame className="w-5 h-5" />
                Prioritize These Tasks
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
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
              <h2 className="text-xl font-bold text-blue-900 mb-3">Reality Check</h2>
              <p className="text-blue-800 text-lg">{results.reality_check}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-900">{results.tasks_analyzed}</div>
                  <div className="text-sm text-blue-700">Tasks analyzed</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">{results.actual_crisis_tasks}</div>
                  <div className="text-sm text-red-700">Actually urgent</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-emerald-600">{results.can_wait}</div>
                  <div className="text-sm text-emerald-700">Can wait</div>
                </div>
              </div>
            </div>

            {results.todays_actual_must_dos && results.todays_actual_must_dos.length > 0 && (
              <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6">
                <h3 className="text-xl font-bold text-red-900 mb-3">🔥 Today's Actual Must-Dos</h3>
                <ul className="space-y-2">
                  {results.todays_actual_must_dos.map((task, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <input type="checkbox" className="w-5 h-5" />
                      <span className="text-red-800 font-medium">{task}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {results.objective_priorities && results.objective_priorities.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Prioritized Task List</h3>
                <div className="space-y-3">
                  {results.objective_priorities.map((item, idx) => (
                    <div key={idx} className={`border-2 rounded-lg p-4 ${urgencyColors[item.actual_urgency] || urgencyColors.medium}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-bold">#{item.rank}</span>
                          <h4 className="font-bold text-lg">{item.task}</h4>
                        </div>
                        <span className="px-3 py-1 bg-white rounded-full text-sm font-semibold capitalize">
                          {item.actual_urgency}
                        </span>
                      </div>
                      <p className="text-sm mb-2"><strong>Deadline:</strong> {item.deadline}</p>
                      <p className="text-sm mb-2"><strong>If missed:</strong> {item.consequence_if_missed}</p>
                      <p className="text-sm mb-2"><strong>Reality:</strong> {item.anxiety_vs_reality}</p>
                      <p className="text-sm font-semibold mt-3">→ {item.do_this}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.guilt_free_deferrals && results.guilt_free_deferrals.length > 0 && (
              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-emerald-900 mb-3">✓ Permission to Defer</h3>
                <ul className="space-y-2">
                  {results.guilt_free_deferrals.map((statement, idx) => (
                    <li key={idx} className="text-emerald-800 flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">•</span>
                      <span>{statement}</span>
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

export default CrisisPrioritizer;