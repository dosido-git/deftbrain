import React, { useState } from 'react';
import { Activity, Loader2, AlertCircle } from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';

const LazyWorkoutAdapter = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  
  const [currentEnergy, setCurrentEnergy] = useState(3);
  const [timeAvailable, setTimeAvailable] = useState('');
  const [equipment, setEquipment] = useState('');
  const [limitations, setLimitations] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    setError('');
    setResults(null);

    try {
      const data = await callToolEndpoint('lazy-workout-adapter', {
        currentEnergy: currentEnergy.toString(),
        timeAvailable: timeAvailable.trim(),
        equipment: equipment.trim(),
        limitations: limitations.trim()
      });
      
      setResults(data);
    } catch (err) {
      setError(err.message || 'Failed to create workout. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-lime-50 to-emerald-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <Activity className="w-8 h-8 text-lime-600" />
            <h1 className="text-4xl font-bold text-slate-900">Lazy Workout Adapter</h1>
          </div>
          <p className="text-slate-600">Low-barrier workouts that meet you where you are</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="mb-6">
            <label className="block text-lg font-semibold text-slate-900 mb-3">
              Current energy level: {currentEnergy}/10
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={currentEnergy}
              onChange={(e) => setCurrentEnergy(parseInt(e.target.value))}
              className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-lime-600"
            />
            <div className="flex justify-between text-sm text-slate-600 mt-2">
              <span>Exhausted</span>
              <span>Medium</span>
              <span>Energized</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Time available (Optional)
              </label>
              <input
                type="text"
                value={timeAvailable}
                onChange={(e) => setTimeAvailable(e.target.value)}
                placeholder="e.g., '10 minutes', '5 minutes'"
                className="w-full p-3 border border-slate-300 rounded-lg focus:border-lime-500 focus:ring-2 focus:ring-lime-200 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Equipment (Optional)
              </label>
              <input
                type="text"
                value={equipment}
                onChange={(e) => setEquipment(e.target.value)}
                placeholder="e.g., 'None', 'Resistance bands'"
                className="w-full p-3 border border-slate-300 rounded-lg focus:border-lime-500 focus:ring-2 focus:ring-lime-200 outline-none"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Physical limitations (Optional)
            </label>
            <input
              type="text"
              value={limitations}
              onChange={(e) => setLimitations(e.target.value)}
              placeholder="e.g., 'Bad knees', 'No jumping'"
              className="w-full p-3 border border-slate-300 rounded-lg focus:border-lime-500 focus:ring-2 focus:ring-lime-200 outline-none"
            />
          </div>

          <button
            onClick={handleCreate}
            disabled={loading}
            className="w-full bg-lime-600 hover:bg-lime-700 disabled:bg-slate-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating workout...
              </>
            ) : (
              <>
                <Activity className="w-5 h-5" />
                Create Low-Effort Workout
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

        {results && results.adapted_workout && (
          <div className="space-y-6">
            {results.energy_assessment && (
              <div className="bg-lime-50 border-2 border-lime-200 rounded-xl p-6">
                <h2 className="text-xl font-bold text-lime-900 mb-3">Your Current State</h2>
                <div className="space-y-1 text-lime-800">
                  <p><strong>Energy level:</strong> {results.energy_assessment.current_level}</p>
                  <p><strong>Realistic tier:</strong> {results.energy_assessment.realistic_tier}</p>
                  <p><strong>Time commitment:</strong> {results.energy_assessment.time_commitment}</p>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-2xl font-bold text-slate-900 mb-4">{results.adapted_workout.workout_name}</h3>
              <p className="text-lg text-slate-700 mb-4">Total time: {results.adapted_workout.total_time}</p>

              <div className="space-y-4 mb-6">
                {results.adapted_workout.exercises && results.adapted_workout.exercises.map((exercise, idx) => (
                  <div key={idx} className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-4">
                    <div className="font-bold text-emerald-900 text-lg mb-2">{exercise.exercise}</div>
                    <p className="text-emerald-800 mb-2">
                      <strong>Duration/Reps:</strong> {exercise.duration_or_reps}
                    </p>
                    <p className="text-emerald-700 text-sm mb-2">{exercise.why_this_helps}</p>
                    {exercise.modifications && exercise.modifications.length > 0 && (
                      <div className="mt-2">
                        <strong className="text-emerald-900 text-sm">Easier versions:</strong>
                        <ul className="list-disc list-inside text-emerald-700 text-sm">
                          {exercise.modifications.map((mod, modIdx) => (
                            <li key={modIdx}>{mod}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {exercise.can_do_while && (
                      <p className="text-emerald-600 text-sm mt-2">
                        <strong>Can do while:</strong> {exercise.can_do_while}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {results.adapted_workout.rest_periods && (
                <p className="text-slate-700 mb-2">
                  <strong>Rest:</strong> {results.adapted_workout.rest_periods}
                </p>
              )}
            </div>

            {results.barrier_removal && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-blue-900 mb-3">Zero Barriers</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-blue-800 text-sm">
                  {results.barrier_removal.no_changing_needed && (
                    <p>✓ {results.barrier_removal.no_changing_needed}</p>
                  )}
                  {results.barrier_removal.no_equipment && (
                    <p>✓ {results.barrier_removal.no_equipment}</p>
                  )}
                  {results.barrier_removal.no_leaving_house && (
                    <p>✓ {results.barrier_removal.no_leaving_house}</p>
                  )}
                  {results.barrier_removal.can_do_during && (
                    <p>✓ {results.barrier_removal.can_do_during}</p>
                  )}
                </div>
              </div>
            )}

            {results.motivation_reframe && (
              <div className="bg-purple-50 border-2 border-purple-300 rounded-xl p-6">
                <h3 className="text-lg font-bold text-purple-900 mb-3">💜 Motivation Reframe</h3>
                <div className="space-y-2 text-purple-800">
                  {results.motivation_reframe.why_this_counts && (
                    <p>{results.motivation_reframe.why_this_counts}</p>
                  )}
                  {results.motivation_reframe.permission && (
                    <p className="font-semibold">{results.motivation_reframe.permission}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LazyWorkoutAdapter;