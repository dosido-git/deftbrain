import React, { useState } from 'react';
import { Utensils, Loader2, AlertCircle, Plus, X } from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';

const SpoonBudgeter = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  
  const [availableSpoons, setAvailableSpoons] = useState(10);
  const [tasks, setTasks] = useState([
    { task: '', cost: 1, priority: 'required' }
  ]);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const addTask = () => {
    setTasks([...tasks, { task: '', cost: 1, priority: 'optional' }]);
  };

  const removeTask = (index) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const updateTask = (index, field, value) => {
    const newTasks = [...tasks];
    newTasks[index][field] = value;
    setTasks(newTasks);
  };

  const handleBudget = async () => {
    const filledTasks = tasks.filter(t => t.task.trim());
    if (filledTasks.length === 0) {
      setError('Please add at least one task');
      return;
    }

    setError('');
    setResults(null);

    try {
      const data = await callToolEndpoint('spoon-budgeter', {
        availableSpoons,
        tasks: filledTasks
      });
      
      setResults(data);
    } catch (err) {
      setError(err.message || 'Failed to budget spoons. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-cyan-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <Utensils className="w-8 h-8 text-emerald-600" />
            <h1 className="text-4xl font-bold text-slate-900">Spoon Budgeter</h1>
          </div>
          <p className="text-slate-600">Allocate your daily energy realistically</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="mb-6">
            <label className="block text-lg font-semibold text-slate-900 mb-3">
              How many spoons do you have today? {availableSpoons}
            </label>
            <input
              type="range"
              min="1"
              max="20"
              value={availableSpoons}
              onChange={(e) => setAvailableSpoons(parseInt(e.target.value))}
              className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            <div className="flex justify-between text-sm text-slate-600 mt-2">
              <span>Very few</span>
              <span>Average</span>
              <span>High energy</span>
            </div>
          </div>

          <label className="block text-lg font-semibold text-slate-900 mb-3">
            Your tasks for today
          </label>

          <div className="space-y-3 mb-4">
            {tasks.map((task, index) => (
              <div key={index} className="bg-slate-50 rounded-lg p-4 border-2 border-slate-200">
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={task.task}
                    onChange={(e) => updateTask(index, 'task', e.target.value)}
                    placeholder="Task name..."
                    className="flex-1 p-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
                  />
                  {tasks.length > 1 && (
                    <button
                      onClick={() => removeTask(index)}
                      className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Spoon cost: {task.cost}
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={task.cost}
                      onChange={(e) => updateTask(index, 'cost', parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Priority
                    </label>
                    <select
                      value={task.priority}
                      onChange={(e) => updateTask(index, 'priority', e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-sm"
                    >
                      <option value="required">Required (must do)</option>
                      <option value="important">Important</option>
                      <option value="optional">Optional</option>
                    </select>
                  </div>
                </div>
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
            onClick={handleBudget}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Budgeting spoons...
              </>
            ) : (
              <>
                <Utensils className="w-5 h-5" />
                Budget My Spoons
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
            <div className="bg-emerald-50 border-4 border-emerald-400 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-emerald-900 mb-4">Your Spoon Budget</h2>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold text-emerald-900">{results.available_spoons}</div>
                  <div className="text-sm text-emerald-700">Available</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-orange-600">{results.total_required}</div>
                  <div className="text-sm text-orange-700">Required</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-emerald-600">{results.remaining}</div>
                  <div className="text-sm text-emerald-700">Remaining</div>
                </div>
              </div>
            </div>

            {results.budget_analysis && (
              <div className={`border-4 rounded-xl p-6 ${
                results.budget_analysis.verdict?.includes('over') ? 'bg-red-50 border-red-400' :
                results.budget_analysis.verdict?.includes('at capacity') ? 'bg-orange-50 border-orange-400' :
                'bg-emerald-50 border-emerald-400'
              }`}>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Analysis</h3>
                <p className="text-lg font-semibold text-slate-900 mb-2">
                  {results.budget_analysis.verdict}
                </p>
                <p className="text-slate-800 mb-2">
                  <strong>Optional tasks possible:</strong> {results.budget_analysis.optional_tasks_possible}
                </p>
                {results.budget_analysis.recommendation && (
                  <p className="text-slate-800 mb-2">
                    <strong>Recommendation:</strong> {results.budget_analysis.recommendation}
                  </p>
                )}
                {results.budget_analysis.permission && (
                  <p className="text-slate-900 font-semibold mt-3 text-lg">
                    {results.budget_analysis.permission}
                  </p>
                )}
              </div>
            )}

            {results.required_tasks && results.required_tasks.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Task Breakdown</h3>
                <div className="space-y-2">
                  {results.required_tasks.map((task, idx) => (
                    <div key={idx} className={`border-2 rounded-lg p-3 ${
                      task.priority === 'required' ? 'bg-red-50 border-red-200' :
                      task.priority === 'important' ? 'bg-orange-50 border-orange-200' :
                      'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900">{task.task}</span>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-white rounded-full text-xs font-semibold">
                            {task.cost} 🥄
                          </span>
                          <span className="px-2 py-1 bg-white rounded-full text-xs font-semibold capitalize">
                            {task.priority}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SpoonBudgeter;