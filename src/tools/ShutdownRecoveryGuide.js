import React, { useState } from 'react';
import { Power, Loader2, AlertCircle } from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';

const ShutdownRecoveryGuide = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  
  const [shutdownType, setShutdownType] = useState('autistic_shutdown');
  const [severity, setSeverity] = useState('severe');
  const [duration, setDuration] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const shutdownTypes = [
    { id: 'autistic_shutdown', name: 'Autistic Shutdown', icon: '🧠', description: 'Nervous system overload' },
    { id: 'burnout', name: 'Burnout', icon: '🔥', description: 'Extended exhaustion' },
    { id: 'depression_episode', name: 'Depression Episode', icon: '💭', description: 'Major depressive episode' },
    { id: 'overwhelm_collapse', name: 'Overwhelm Collapse', icon: '😵', description: 'Everything too much' }
  ];

  const handleGenerate = async () => {
    setError('');
    setResults(null);

    try {
      const data = await callToolEndpoint('shutdown-recovery-guide', {
        shutdownType,
        severity,
        duration: duration.trim()
      });
      
      setResults(data);
    } catch (err) {
      setError(err.message || 'Failed to generate recovery guide. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <Power className="w-8 h-8 text-slate-600" />
            <h1 className="text-4xl font-bold text-slate-900">Shutdown Recovery Guide</h1>
          </div>
          <p className="text-slate-600">Ultra-simple recovery when you can barely function</p>
        </div>

        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 mb-6">
          <p className="text-red-900 font-medium text-center">
            If you're reading this while shut down: Take three breaths first. You're safe.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="mb-6">
            <label className="block text-lg font-semibold text-slate-900 mb-3">
              What type of shutdown?
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {shutdownTypes.map(type => (
                <button
                  key={type.id}
                  onClick={() => setShutdownType(type.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    shutdownType === type.id
                      ? 'border-slate-600 bg-slate-50'
                      : 'border-slate-200 hover:border-slate-400 bg-white'
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Severity
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-lg focus:border-slate-500 focus:ring-2 focus:ring-slate-200 outline-none"
              >
                <option value="mild">Mild - struggling but functional</option>
                <option value="moderate">Moderate - very difficult to function</option>
                <option value="severe">Severe - can barely move</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Duration so far (Optional)
              </label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g., '2 days', 'just started'"
                className="w-full p-3 border border-slate-300 rounded-lg focus:border-slate-500 focus:ring-2 focus:ring-slate-200 outline-none"
              />
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-slate-600 hover:bg-slate-700 disabled:bg-slate-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating recovery guide...
              </>
            ) : (
              <>
                <Power className="w-5 h-5" />
                Get Recovery Protocol
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

        {results && results.recovery_protocol && (
          <div className="space-y-6">
            <div className="bg-slate-800 text-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-2">Recovery Protocol</h2>
              <p className="text-slate-300">Type: {results.shutdown_type}</p>
              <p className="text-slate-300">Severity: {results.severity}</p>
            </div>

            {results.recovery_protocol.hour_1_survival && (
              <div className="bg-red-50 border-4 border-red-400 rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-red-900 mb-3">Hour 1: Survival Mode</h3>
                <ul className="space-y-2">
                  {results.recovery_protocol.hour_1_survival.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-red-900">
                      <span className="font-bold">{idx + 1}.</span>
                      <span className="text-lg">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {results.recovery_protocol.hour_2_4_basic_function && (
              <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-6">
                <h3 className="text-xl font-bold text-orange-900 mb-3">Hours 2-4: Basic Function</h3>
                <ul className="space-y-2">
                  {results.recovery_protocol.hour_2_4_basic_function.map((step, idx) => (
                    <li key={idx} className="text-orange-800 flex items-start gap-2">
                      <span className="font-bold">•</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {results.recovery_protocol.day_1_minimum && (
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6">
                <h3 className="text-xl font-bold text-yellow-900 mb-3">Day 1: Minimum Requirements</h3>
                <ul className="space-y-2">
                  {results.recovery_protocol.day_1_minimum.map((step, idx) => (
                    <li key={idx} className="text-yellow-800 flex items-start gap-2">
                      <span className="font-bold">•</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {results.recovery_protocol.day_2_3 && (
              <div className="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-6">
                <h3 className="text-lg font-bold text-emerald-900 mb-3">Days 2-3: If Still Shut Down</h3>
                <ul className="space-y-2">
                  {results.recovery_protocol.day_2_3.map((step, idx) => (
                    <li key={idx} className="text-emerald-800 flex items-start gap-2">
                      <span className="font-bold">•</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {results.permission_statements && results.permission_statements.length > 0 && (
              <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6">
                <h3 className="text-lg font-bold text-blue-900 mb-3">💙 Remember</h3>
                <ul className="space-y-2">
                  {results.permission_statements.map((statement, idx) => (
                    <li key={idx} className="text-blue-800 text-lg">{statement}</li>
                  ))}
                </ul>
              </div>
            )}

            {results.recovery_protocol.when_to_seek_help && (
              <div className="bg-purple-50 border-2 border-purple-300 rounded-xl p-6">
                <h3 className="text-lg font-bold text-purple-900 mb-3">When to Seek Help</h3>
                <ul className="space-y-1">
                  {results.recovery_protocol.when_to_seek_help.map((item, idx) => (
                    <li key={idx} className="text-purple-800 flex items-start gap-2">
                      <span className="text-purple-600">⚠️</span>
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

export default ShutdownRecoveryGuide;