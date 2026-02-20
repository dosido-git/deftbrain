import React, { useState } from 'react';
import { AlertCircle, Calendar, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';

const RoutineRuptureManager = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  
  const [normalRoutine, setNormalRoutine] = useState('');
  const [disruptionType, setDisruptionType] = useState('sick');
  const [constraints, setConstraints] = useState('');
  const [duration, setDuration] = useState('');
  const [criticalTasks, setCriticalTasks] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const disruptionTypes = [
    { id: 'sick', name: 'Sick Day', icon: '🤒', description: 'Low energy, need to rest' },
    { id: 'travel', name: 'Travel', icon: '✈️', description: 'Different location, limited resources' },
    { id: 'schedule_change', name: 'Schedule Change', icon: '📅', description: 'External changes to your routine' },
    { id: 'emergency', name: 'Emergency', icon: '🚨', description: 'Crisis requiring immediate attention' }
  ];

  const handleGenerate = async () => {
    if (!normalRoutine.trim()) {
      setError('Please describe your normal routine');
      return;
    }

    setError('');
    setResults(null);

    try {
      const data = await callToolEndpoint('routine-rupture-manager', {
        normalRoutine: normalRoutine.trim(),
        disruptionType,
        constraints: constraints.trim(),
        duration: duration.trim(),
        criticalTasks: criticalTasks.trim()
      });
      
      setResults(data);
    } catch (err) {
      setError(err.message || 'Failed to generate adapted routine. Please try again.');
    }
  };

  const handleReset = () => {
    setNormalRoutine('');
    setConstraints('');
    setDuration('');
    setCriticalTasks('');
    setResults(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-emerald-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <Calendar className="w-8 h-8 text-emerald-600" />
            <h1 className="text-4xl font-bold text-slate-900">Routine Rupture Manager</h1>
          </div>
          <p className="text-slate-600">When life disrupts your routine, get structure for the chaos</p>
          <div className="mt-3 inline-flex items-center gap-2 text-sm text-slate-500 bg-white px-4 py-2 rounded-full shadow-sm">
            <CheckCircle className="w-4 h-4" />
            Neurodivergent-friendly • Maintains critical tasks
          </div>
        </div>

        {/* Input Section */}
        {!results && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            {/* Disruption Type */}
            <div className="mb-6">
              <label className="block text-lg font-semibold text-slate-900 mb-3">
                What's Disrupting Your Routine?
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {disruptionTypes.map(type => (
                  <button
                    key={type.id}
                    onClick={() => setDisruptionType(type.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      disruptionType === type.id
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-200 hover:border-emerald-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">{type.icon}</span>
                      <div className="flex-1">
                        <div className="font-semibold text-slate-900">{type.name}</div>
                        <div className="text-sm text-slate-600 mt-1">{type.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Normal Routine */}
            <div className="mb-6">
              <label className="block text-lg font-semibold text-slate-900 mb-3">
                Your Normal Routine
              </label>
              <textarea
                value={normalRoutine}
                onChange={(e) => setNormalRoutine(e.target.value)}
                placeholder="Describe your typical daily routine... e.g., 'Wake at 6am, shower, breakfast, work 8-5, exercise, dinner, bed by 10pm'"
                className="w-full h-32 p-4 border-2 border-slate-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none resize-none text-slate-900"
              />
            </div>

            {/* Additional Context */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Constraints (Optional)
                </label>
                <input
                  type="text"
                  value={constraints}
                  onChange={(e) => setConstraints(e.target.value)}
                  placeholder="e.g., 'Can't leave house', 'No energy'"
                  className="w-full p-3 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-slate-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Expected Duration (Optional)
                </label>
                <input
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g., '3-5 days', '1 week'"
                  className="w-full p-3 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-slate-900"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Critical Tasks That Must Continue (Optional)
              </label>
              <input
                type="text"
                value={criticalTasks}
                onChange={(e) => setCriticalTasks(e.target.value)}
                placeholder="e.g., 'Take medication, feed pets, work deadline Thursday'"
                className="w-full p-3 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-slate-900"
              />
            </div>

            {/* Action Button */}
            <button
              onClick={handleGenerate}
              disabled={loading || !normalRoutine.trim()}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating adapted routine...
                </>
              ) : (
                <>
                  <Calendar className="w-5 h-5" />
                  Generate Adapted Routine
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
        )}

        {/* Results Section */}
        {results && (
          <div className="space-y-6">
            {/* Reset Button */}
            <div className="flex justify-end">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                New Disruption
              </button>
            </div>

            {/* Disruption Overview */}
            <div className="bg-emerald-100 border-2 border-emerald-300 rounded-xl p-6">
              <h2 className="text-xl font-bold text-emerald-900 mb-3">Disruption Overview</h2>
              <div className="space-y-2 text-emerald-800">
                <p><strong>Type:</strong> {results.disruption?.type}</p>
                <p><strong>Description:</strong> {results.disruption?.description}</p>
                {results.disruption?.duration && (
                  <p><strong>Duration:</strong> {results.disruption.duration}</p>
                )}
                {results.disruption?.constraints && results.disruption.constraints.length > 0 && (
                  <div>
                    <strong>Constraints:</strong>
                    <ul className="list-disc list-inside ml-4 mt-1">
                      {results.disruption.constraints.map((constraint, idx) => (
                        <li key={idx}>{constraint}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Adapted Routine Comparison */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Your Adapted Routine</h2>
              
              {['morning', 'midday', 'evening'].map(period => (
                results.normal_routine_adapted?.[period] && (
                  <div key={period} className="mb-6 last:mb-0">
                    <h3 className="text-lg font-semibold text-slate-900 mb-3 capitalize">
                      {period}
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Normal */}
                      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <div className="text-sm font-medium text-slate-600 mb-2">Normal</div>
                        <p className="text-slate-700 text-sm">
                          {results.normal_routine_adapted[period].normal}
                        </p>
                      </div>

                      {/* Adapted */}
                      <div className="bg-emerald-50 rounded-lg p-4 border-2 border-emerald-300">
                        <div className="text-sm font-medium text-emerald-700 mb-2">Adapted</div>
                        <p className="text-slate-800 text-sm mb-3">
                          {results.normal_routine_adapted[period].adapted}
                        </p>
                        
                        {results.normal_routine_adapted[period].critical_tasks?.length > 0 && (
                          <div className="mb-2">
                            <div className="text-xs font-semibold text-emerald-700 mb-1">✓ Keep:</div>
                            <ul className="text-xs text-emerald-700 space-y-1">
                              {results.normal_routine_adapted[period].critical_tasks.map((task, idx) => (
                                <li key={idx}>• {task}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {results.normal_routine_adapted[period].dropped_tasks?.length > 0 && (
                          <div>
                            <div className="text-xs font-semibold text-slate-500 mb-1">✗ Skip:</div>
                            <ul className="text-xs text-slate-500 space-y-1">
                              {results.normal_routine_adapted[period].dropped_tasks.map((task, idx) => (
                                <li key={idx}>• {task}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              ))}
            </div>

            {/* Modified Structure */}
            {results.modified_structure && results.modified_structure.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Simplified Schedule</h2>
                <div className="space-y-3">
                  {results.modified_structure.map((block, idx) => (
                    <div key={idx} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <div className="flex items-start justify-between mb-2">
                        <div className="font-semibold text-slate-900">{block.time}</div>
                        <div className="text-sm text-slate-600">
                          {block.estimated_duration} • {block.energy_required} energy
                        </div>
                      </div>
                      <ul className="space-y-1">
                        {block.tasks.map((task, taskIdx) => (
                          <li key={taskIdx} className="text-slate-700 text-sm flex items-start gap-2">
                            <span className="text-emerald-500 mt-1">•</span>
                            <span>{task}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Permission Statements */}
            {results.permission_statements && results.permission_statements.length > 0 && (
              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-6">
                <h2 className="text-xl font-bold text-emerald-900 mb-3">💚 Permission to Adapt</h2>
                <ul className="space-y-2">
                  {results.permission_statements.map((statement, idx) => (
                    <li key={idx} className="text-emerald-800 flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <span>{statement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* When to Resume */}
            {results.when_to_resume_normal && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                <h2 className="text-xl font-bold text-blue-900 mb-3">When to Return to Normal</h2>
                
                {results.when_to_resume_normal.signs_youre_ready && (
                  <div className="mb-4">
                    <div className="font-semibold text-blue-800 mb-2">Signs you're ready:</div>
                    <ul className="space-y-1">
                      {results.when_to_resume_normal.signs_youre_ready.map((sign, idx) => (
                        <li key={idx} className="text-blue-700 text-sm flex items-start gap-2">
                          <span className="text-blue-500">✓</span>
                          <span>{sign}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {results.when_to_resume_normal.gradual_return && (
                  <div className="text-blue-800 text-sm">
                    <strong>Gradual return:</strong> {results.when_to_resume_normal.gradual_return}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RoutineRuptureManager;