import React, { useState } from 'react';
import { Clock, Loader2, AlertCircle } from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';

const WaitingModeLiberator = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  
  const [appointmentTime, setAppointmentTime] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [preparationNeeds, setPreparationNeeds] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const handleLiberate = async () => {
    if (!appointmentTime.trim()) {
      setError('Please specify appointment time');
      return;
    }

    setError('');
    setResults(null);

    try {
      const data = await callToolEndpoint('waiting-mode-liberator', {
        appointmentTime: appointmentTime.trim(),
        currentTime: currentTime.trim() || 'Now',
        preparationNeeds: preparationNeeds.trim()
      });
      
      setResults(data);
    } catch (err) {
      setError(err.message || 'Failed to liberate waiting mode. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-lime-50 to-emerald-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <Clock className="w-8 h-8 text-lime-600" />
            <h1 className="text-4xl font-bold text-slate-900">Waiting Mode Liberator</h1>
          </div>
          <p className="text-slate-600">Reclaim the hours before appointments</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="mb-6">
            <label className="block text-lg font-semibold text-slate-900 mb-3">
              When is your appointment?
            </label>
            <input
              type="text"
              value={appointmentTime}
              onChange={(e) => setAppointmentTime(e.target.value)}
              placeholder="e.g., '2:00 PM', 'Doctor at 3pm', '4:30 PM meeting'"
              className="w-full p-3 border-2 border-slate-200 rounded-lg focus:border-lime-500 focus:ring-2 focus:ring-lime-200 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Current time (Optional)
              </label>
              <input
                type="text"
                value={currentTime}
                onChange={(e) => setCurrentTime(e.target.value)}
                placeholder="e.g., '10:30 AM' (or leave blank for now)"
                className="w-full p-3 border border-slate-300 rounded-lg focus:border-lime-500 focus:ring-2 focus:ring-lime-200 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Preparation needs (Optional)
              </label>
              <input
                type="text"
                value={preparationNeeds}
                onChange={(e) => setPreparationNeeds(e.target.value)}
                placeholder="e.g., '20 min to get ready, 15 min drive'"
                className="w-full p-3 border border-slate-300 rounded-lg focus:border-lime-500 focus:ring-2 focus:ring-lime-200 outline-none"
              />
            </div>
          </div>

          <button
            onClick={handleLiberate}
            disabled={loading || !appointmentTime.trim()}
            className="w-full bg-lime-600 hover:bg-lime-700 disabled:bg-slate-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Calculating usable time...
              </>
            ) : (
              <>
                <Clock className="w-5 h-5" />
                Liberate My Time
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
            <div className="bg-lime-50 border-2 border-lime-300 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-lime-900 mb-4">Your Time Analysis</h2>
              <div className="space-y-2 text-lime-800">
                <p><strong>Appointment:</strong> {results.appointment}</p>
                <p><strong>Current time:</strong> {results.current_time}</p>
                <p className="text-2xl font-bold text-lime-900 mt-4">{results.time_available}</p>
              </div>
            </div>

            {results.waiting_mode_intervention && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Usable Time Blocks</h3>
                
                {results.waiting_mode_intervention.usable_time_blocks && (
                  <div className="space-y-4 mb-6">
                    {results.waiting_mode_intervention.usable_time_blocks.map((block, idx) => (
                      <div key={idx} className="bg-lime-50 border-2 border-lime-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="font-bold text-lime-900 text-lg">{block.time_range}</div>
                            <div className="text-sm text-lime-700">{block.duration}</div>
                          </div>
                        </div>
                        {block.suggested_tasks && (
                          <div className="mt-3">
                            <div className="font-semibold text-slate-900 mb-2">Suggested tasks:</div>
                            <ul className="list-disc list-inside space-y-1">
                              {block.suggested_tasks.map((task, taskIdx) => (
                                <li key={taskIdx} className="text-slate-700">{task}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {block.why_this_fits && (
                          <p className="text-sm text-lime-700 italic mt-2">{block.why_this_fits}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {results.waiting_mode_intervention.permission && (
                  <div className="bg-emerald-50 border-2 border-emerald-300 rounded-lg p-4">
                    <p className="text-emerald-900 font-semibold text-lg">
                      ✓ {results.waiting_mode_intervention.permission}
                    </p>
                  </div>
                )}
              </div>
            )}

            {results.tasks_that_fit && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Tasks That Fit Your Time</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(results.tasks_that_fit).map(([category, tasks]) => (
                    <div key={category} className="bg-slate-50 rounded-lg p-3">
                      <div className="font-semibold text-slate-900 mb-2 capitalize">
                        {category.replace(/_/g, ' ')}
                      </div>
                      <p className="text-sm text-slate-700">{tasks}</p>
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

export default WaitingModeLiberator;