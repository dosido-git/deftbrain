import React, { useState } from 'react';
import { AlertCircle, Loader2, Shield, Heart, Wind } from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';

const SpiralStopper = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  
  const [anxiousThoughts, setAnxiousThoughts] = useState('');
  const [physicalSymptoms, setPhysicalSymptoms] = useState('');
  const [trigger, setTrigger] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!anxiousThoughts.trim()) {
      setError('Please describe your anxious thoughts');
      return;
    }

    setError('');
    setResults(null);

    try {
      const data = await callToolEndpoint('spiral-stopper', {
        anxiousThoughts: anxiousThoughts.trim(),
        physicalSymptoms: physicalSymptoms.trim(),
        trigger: trigger.trim()
      });
      
      setResults(data);
    } catch (err) {
      setError(err.message || 'Failed to analyze spiral. Please try again.');
    }
  };

  const handleReset = () => {
    setAnxiousThoughts('');
    setPhysicalSymptoms('');
    setTrigger('');
    setResults(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-cyan-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <Shield className="w-8 h-8 text-emerald-600" />
            <h1 className="text-4xl font-bold text-slate-900">Spiral Stopper</h1>
          </div>
          <p className="text-slate-600">Break the anxiety spiral with grounding and reality checks</p>
          <div className="mt-3 inline-flex items-center gap-2 text-sm text-slate-500 bg-white px-4 py-2 rounded-full shadow-sm">
            <Heart className="w-4 h-4" />
            Recognize distortions • Ground in reality
          </div>
        </div>

        {/* Emergency Mode Indicator */}
        {!results && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6 text-center">
            <p className="text-red-800 font-medium">🚨 If you're spiraling right now, take 3 deep breaths before continuing</p>
            <p className="text-sm text-red-600 mt-1">Breathe in for 4... Hold for 4... Out for 6... You're safe.</p>
          </div>
        )}

        {/* Input Section */}
        {!results && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="mb-6">
              <label className="block text-lg font-semibold text-slate-900 mb-3">
                What are you thinking right now?
              </label>
              <p className="text-sm text-slate-600 mb-3">Type everything that's going through your head. Don't filter it.</p>
              <textarea
                value={anxiousThoughts}
                onChange={(e) => setAnxiousThoughts(e.target.value)}
                placeholder="e.g., 'I made a mistake at work and now everyone thinks I'm incompetent and I'll get fired and lose everything...'"
                className="w-full h-40 p-4 border-2 border-slate-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none resize-none text-slate-900"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Physical symptoms (Optional)
                </label>
                <input
                  type="text"
                  value={physicalSymptoms}
                  onChange={(e) => setPhysicalSymptoms(e.target.value)}
                  placeholder="e.g., 'Racing heart, tight chest, can't breathe'"
                  className="w-full p-3 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-slate-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  What triggered this? (Optional)
                </label>
                <input
                  type="text"
                  value={trigger}
                  onChange={(e) => setTrigger(e.target.value)}
                  placeholder="e.g., 'Sent email with typo'"
                  className="w-full p-3 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-slate-900"
                />
              </div>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={loading || !anxiousThoughts.trim()}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing your spiral...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  Stop the Spiral
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
                New Analysis
              </button>
            </div>

            {/* Spiral Detection */}
            {results.spiral_analysis && (
              <div className={`rounded-xl shadow-lg p-6 border-2 ${
                results.spiral_analysis.detected_spiral 
                  ? 'bg-orange-50 border-orange-300' 
                  : 'bg-emerald-50 border-emerald-300'
              }`}>
                <h2 className="text-2xl font-bold mb-3 flex items-center gap-2">
                  {results.spiral_analysis.detected_spiral ? (
                    <>
                      <AlertCircle className="w-6 h-6 text-orange-600" />
                      <span className="text-orange-900">Spiral Detected</span>
                    </>
                  ) : (
                    <>
                      <Shield className="w-6 h-6 text-emerald-600" />
                      <span className="text-emerald-900">Not a Spiral</span>
                    </>
                  )}
                </h2>
                <div className={results.spiral_analysis.detected_spiral ? 'text-orange-800' : 'text-emerald-800'}>
                  <p className="mb-2">
                    <strong>Primary pattern:</strong> {results.spiral_analysis.primary_distortion}
                  </p>
                  <p><strong>Level:</strong> {results.spiral_analysis.spiral_level}</p>
                </div>
              </div>
            )}

            {/* Distortions Found */}
            {results.your_thoughts_analyzed?.distortions_present && results.your_thoughts_analyzed.distortions_present.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-4">🧠 Cognitive Distortions Found</h3>
                <div className="space-y-4">
                  {results.your_thoughts_analyzed.distortions_present.map((distortion, idx) => (
                    <div key={idx} className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                      <div className="font-semibold text-red-900 mb-2 capitalize">
                        {distortion.type.replace(/_/g, ' ')}
                      </div>
                      <p className="text-sm text-red-800 mb-2">
                        <strong>Evidence:</strong> {distortion.evidence}
                      </p>
                      <div className="bg-emerald-100 border border-emerald-300 rounded p-3 mt-2">
                        <p className="text-sm text-emerald-900">
                          <strong>✓ Reality check:</strong> {distortion.reality_check}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reality Checks */}
            {results.reality_checks && results.reality_checks.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-4">✅ Reality vs. Anxiety</h3>
                <div className="space-y-4">
                  {results.reality_checks.map((check, idx) => (
                    <div key={idx} className="border-2 border-slate-200 rounded-lg p-4">
                      <div className="bg-red-50 rounded p-3 mb-3">
                        <div className="text-sm font-semibold text-red-900 mb-1">What anxiety says:</div>
                        <p className="text-red-800">{check.anxious_prediction}</p>
                      </div>
                      
                      <div className="mb-3">
                        <div className="text-sm font-semibold text-slate-700 mb-2">Evidence against:</div>
                        <ul className="space-y-1">
                          {check.evidence_against.map((evidence, evidenceIdx) => (
                            <li key={evidenceIdx} className="text-sm text-slate-700 flex items-start gap-2">
                              <span className="text-emerald-600 font-bold">✓</span>
                              <span>{evidence}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="bg-emerald-50 rounded p-3">
                        <div className="text-sm font-semibold text-emerald-900 mb-1">Realistic outcome:</div>
                        <p className="text-emerald-800 font-medium">{check.realistic_outcome}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Grounding Exercises */}
            {results.grounding_exercises && results.grounding_exercises.length > 0 && (
              <div className="bg-cyan-50 border-2 border-cyan-200 rounded-xl shadow-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Wind className="w-6 h-6 text-cyan-600" />
                  <h3 className="text-xl font-bold text-cyan-900">Grounding Exercises</h3>
                </div>
                <p className="text-cyan-800 mb-4">Do one of these right now to break the spiral:</p>
                <div className="space-y-4">
                  {results.grounding_exercises.map((exercise, idx) => (
                    <div key={idx} className="bg-white rounded-lg p-4 border-2 border-cyan-300">
                      <div className="font-bold text-cyan-900 mb-2">{exercise.name}</div>
                      <p className="text-sm text-cyan-800 mb-3 italic">{exercise.why}</p>
                      <ol className="space-y-2">
                        {exercise.steps.map((step, stepIdx) => (
                          <li key={stepIdx} className="text-sm text-slate-800 flex items-start gap-2">
                            <span className="font-bold text-cyan-600">{stepIdx + 1}.</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                      {exercise.duration && (
                        <div className="mt-3 text-sm text-cyan-700">
                          <strong>Duration:</strong> {exercise.duration}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Spiral Interruption */}
            {results.spiral_interruption && (
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-yellow-900 mb-3">⚡ Break the Spiral NOW</h3>
                <div className="space-y-3 text-yellow-900">
                  <div>
                    <div className="font-semibold mb-1">Immediate action:</div>
                    <p className="text-lg">{results.spiral_interruption.immediate_action}</p>
                  </div>
                  <div>
                    <div className="font-semibold mb-1">Why this helps:</div>
                    <p>{results.spiral_interruption.why}</p>
                  </div>
                  <div>
                    <div className="font-semibold mb-1">After grounding:</div>
                    <p>{results.spiral_interruption.after_grounding}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Compassionate Reality */}
            {results.compassionate_reality && (
              <div className="bg-gradient-to-r from-purple-500 to-emerald-500 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center gap-2 mb-3">
                  <Heart className="w-6 h-6" />
                  <h3 className="text-xl font-bold">The Truth</h3>
                </div>
                <p className="text-lg leading-relaxed">{results.compassionate_reality}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SpiralStopper;