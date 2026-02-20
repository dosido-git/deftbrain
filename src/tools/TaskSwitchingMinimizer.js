import React, { useState } from 'react';
import { Zap, Loader2, AlertCircle, Plus, X } from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';

const TaskSwitchingMinimizer = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  
  const [tasks, setTasks] = useState(['']);
  const [timeAvailable, setTimeAvailable] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const addTask = () => setTasks([...tasks, '']);
  const removeTask = (index) => setTasks(tasks.filter((_, i) => i !== index));
  const updateTask = (index, value) => {
    const newTasks = [...tasks];
    newTasks[index] = value;
    setTasks(newTasks);
  };

  const handleBatch = async () => {
    const filledTasks = tasks.filter(t => t.trim());
    if (filledTasks.length === 0) {
      setError('Please add at least one task');
      return;
    }

    setError('');
    setResults(null);

    try {
      const data = await callToolEndpoint('task-switching-minimizer', {
        tasks: filledTasks,
        timeAvailable: timeAvailable.trim()
      });
      
      setResults(data);
    } catch (err) {
      setError(err.message || 'Failed to batch tasks. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-purple-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <Zap className="w-8 h-8 text-emerald-600" />
            <h1 className="text-4xl font-bold text-slate-900">Task Switching Minimizer</h1>
          </div>
          <p className="text-slate-600">Batch similar tasks to reduce context switching</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <label className="block text-lg font-semibold text-slate-900 mb-3">
            Your to-do list:
          </label>
          
          <div className="space-y-3 mb-4">
            {tasks.map((task, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={task}
                  onChange={(e) => updateTask(index, e.target.value)}
                  placeholder={`Task ${index + 1}...`}
                  className="flex-1 p-3 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
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

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Time available (Optional)
            </label>
            <input
              type="text"
              value={timeAvailable}
              onChange={(e) => setTimeAvailable(e.target.value)}
              placeholder="e.g., '4 hours', 'Full day'"
              className="w-full p-3 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
            />
          </div>

          <button
            onClick={handleBatch}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Batching tasks...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                Batch My Tasks
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
            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-6">
              <h2 className="text-xl font-bold text-emerald-900 mb-3">Efficiency Gains</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-sm text-emerald-700">Before batching</div>
                  <div className="text-2xl font-bold text-emerald-900">{results.switching_cost_current_order}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-emerald-700">After batching</div>
                  <div className="text-2xl font-bold text-emerald-600">{results.switching_cost_batched}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-purple-700">Time saved</div>
                  <div className="text-2xl font-bold text-purple-600">{results.time_saved}</div>
                </div>
              </div>
            </div>

            {results.batched_schedule && results.batched_schedule.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-slate-900">Your Batched Schedule</h3>
                {results.batched_schedule.map((batch, idx) => (
                  <div key={idx} className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="text-xl font-bold text-emerald-900">{batch.batch_name}</h4>
                        <p className="text-sm text-slate-600">{batch.suggested_time} • {batch.estimated_duration}</p>
                      </div>
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold">
                        {batch.energy_level_required} energy
                      </span>
                    </div>
                    
                    <p className="text-emerald-700 mb-3 italic">{batch.why_batched}</p>
                    
                    <div className="mb-3">
                      <strong className="text-slate-900">Tasks in this batch:</strong>
                      <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                        {batch.tasks.map((task, taskIdx) => (
                          <li key={taskIdx} className="text-slate-700">{task}</li>
                        ))}
                      </ul>
                    </div>
                    
                    {batch.tools_needed && batch.tools_needed.length > 0 && (
                      <div className="text-sm text-slate-600">
                        <strong>Tools needed:</strong> {batch.tools_needed.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {results.benefits && (
              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-emerald-900 mb-2">Why This Helps</h3>
                <p className="text-emerald-800">{results.benefits}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskSwitchingMinimizer;