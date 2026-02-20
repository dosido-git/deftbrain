import React, { useState } from 'react';
import { Users, Loader2, AlertCircle, Play } from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';

const VirtualBodyDouble = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  
  const [task, setTask] = useState('');
  const [duration, setDuration] = useState('');
  const [checkInFrequency, setCheckInFrequency] = useState('15');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const handleStart = async () => {
    if (!task.trim() || !duration.trim()) {
      setError('Please specify task and duration');
      return;
    }

    setError('');
    setResults(null);

    try {
      const data = await callToolEndpoint('virtual-body-double', {
        task: task.trim(),
        duration: duration.trim(),
        checkInFrequency: `Every ${checkInFrequency} minutes`
      });
      
      setResults(data);
    } catch (err) {
      setError(err.message || 'Failed to create session. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <Users className="w-8 h-8 text-cyan-600" />
            <h1 className="text-4xl font-bold text-slate-900">Virtual Body Double</h1>
          </div>
          <p className="text-slate-600">Gentle accountability presence, no judgment</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="mb-6">
            <label className="block text-lg font-semibold text-slate-900 mb-3">
              What are you working on?
            </label>
            <input
              type="text"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="e.g., 'Writing report', 'Cleaning kitchen', 'Studying for exam'"
              className="w-full p-3 border-2 border-slate-200 rounded-lg focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                How long will you work?
              </label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g., '50 minutes', '2 hours'"
                className="w-full p-3 border border-slate-300 rounded-lg focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Check-in frequency
              </label>
              <select
                value={checkInFrequency}
                onChange={(e) => setCheckInFrequency(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-lg focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 outline-none"
              >
                <option value="10">Every 10 minutes</option>
                <option value="15">Every 15 minutes</option>
                <option value="20">Every 20 minutes</option>
                <option value="30">Every 30 minutes</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleStart}
            disabled={loading || !task.trim() || !duration.trim()}
            className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating session...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Start Work Session
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
            <div className="bg-cyan-50 border-2 border-cyan-200 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-cyan-900 mb-3">Your Work Session</h2>
              <div className="space-y-2 text-cyan-800">
                <p><strong>Task:</strong> {results.session?.task}</p>
                <p><strong>Duration:</strong> {results.session?.duration}</p>
                <p><strong>Check-ins:</strong> {results.session?.check_ins}</p>
              </div>
            </div>

            {results.presence_messages && results.presence_messages.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Presence Messages</h3>
                <div className="space-y-3">
                  {results.presence_messages.map((msg, idx) => (
                    <div key={idx} className="bg-cyan-50 border-l-4 border-cyan-500 rounded-r-lg p-4">
                      <div className="text-sm text-cyan-700 mb-1">
                        {msg.time || `Message ${idx + 1}`}
                      </div>
                      <p className="text-cyan-900 font-medium">{msg.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.completion_celebration && (
              <div className="bg-gradient-to-r from-purple-500 to-emerald-500 rounded-xl shadow-lg p-6 text-white text-center">
                <h3 className="text-2xl font-bold mb-2">🎉</h3>
                <p className="text-xl font-semibold">{results.completion_celebration}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VirtualBodyDouble;