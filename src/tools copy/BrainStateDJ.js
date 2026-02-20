import React, { useState } from 'react';
import { Music, Loader2, AlertCircle, Headphones, Volume2 } from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';

const BrainStateDJ = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  
  const [currentState, setCurrentState] = useState('');
  const [desiredState, setDesiredState] = useState('');
  const [taskContext, setTaskContext] = useState('');
  const [musicPreferences, setMusicPreferences] = useState('');
  const [neurodivergentProfile, setNeurodivergentProfile] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const stateOptions = [
    { id: 'anxious', label: 'Anxious/Stressed', emoji: '😰' },
    { id: 'scattered', label: 'Scattered/Unfocused', emoji: '🌀' },
    { id: 'low_energy', label: 'Low Energy/Tired', emoji: '😴' },
    { id: 'overwhelmed', label: 'Overwhelmed', emoji: '😵' },
    { id: 'foggy', label: 'Brain Fog', emoji: '🌫️' }
  ];

  const desiredOptions = [
    { id: 'focused', label: 'Focused/Productive', emoji: '🎯' },
    { id: 'calm', label: 'Calm/Relaxed', emoji: '😌' },
    { id: 'energized', label: 'Energized/Motivated', emoji: '⚡' },
    { id: 'creative', label: 'Creative/Open', emoji: '🎨' },
    { id: 'grounded', label: 'Grounded/Present', emoji: '🧘' }
  ];

  const handleGenerate = async () => {
    if (!currentState || !desiredState) {
      setError('Please select both current and desired states');
      return;
    }

    setError('');
    setResults(null);

    try {
      const data = await callToolEndpoint('brain-state-dj', {
        currentState,
        desiredState,
        taskContext: taskContext.trim(),
        musicPreferences: musicPreferences.trim(),
        neurodivergentProfile: neurodivergentProfile.trim()
      });
      
      setResults(data);
    } catch (err) {
      setError(err.message || 'Failed to generate playlist. Please try again.');
    }
  };

  const handleReset = () => {
    setCurrentState('');
    setDesiredState('');
    setTaskContext('');
    setMusicPreferences('');
    setNeurodivergentProfile('');
    setResults(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-emerald-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <Music className="w-8 h-8 text-purple-600" />
            <h1 className="text-4xl font-bold text-slate-900">Brain State DJ</h1>
          </div>
          <p className="text-slate-600">Science-backed playlists for cognitive state transitions</p>
          <div className="mt-3 inline-flex items-center gap-2 text-sm text-slate-500 bg-white px-4 py-2 rounded-full shadow-sm">
            <Headphones className="w-4 h-4" />
            Personalized for ADHD, autism, anxiety
          </div>
        </div>

        {/* Input Section */}
        {!results && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            {/* Current State */}
            <div className="mb-6">
              <label className="block text-lg font-semibold text-slate-900 mb-3">
                How do you feel right now?
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {stateOptions.map(state => (
                  <button
                    key={state.id}
                    onClick={() => setCurrentState(state.label)}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      currentState === state.label
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-slate-200 hover:border-purple-300 bg-white'
                    }`}
                  >
                    <div className="text-3xl mb-1">{state.emoji}</div>
                    <div className="text-sm font-medium text-slate-700">{state.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Desired State */}
            <div className="mb-6">
              <label className="block text-lg font-semibold text-slate-900 mb-3">
                What state do you need to reach?
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {desiredOptions.map(state => (
                  <button
                    key={state.id}
                    onClick={() => setDesiredState(state.label)}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      desiredState === state.label
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-slate-200 hover:border-purple-300 bg-white'
                    }`}
                  >
                    <div className="text-3xl mb-1">{state.emoji}</div>
                    <div className="text-sm font-medium text-slate-700">{state.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Context */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  What are you working on? (Optional)
                </label>
                <input
                  type="text"
                  value={taskContext}
                  onChange={(e) => setTaskContext(e.target.value)}
                  placeholder="e.g., 'Writing report', 'Deep coding', 'Creative brainstorm'"
                  className="w-full p-3 border border-slate-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none text-slate-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Music preferences (Optional)
                </label>
                <input
                  type="text"
                  value={musicPreferences}
                  onChange={(e) => setMusicPreferences(e.target.value)}
                  placeholder="e.g., 'Love lo-fi, hate heavy metal', 'Only instrumental'"
                  className="w-full p-3 border border-slate-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none text-slate-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Neurodivergent profile (Optional)
                </label>
                <input
                  type="text"
                  value={neurodivergentProfile}
                  onChange={(e) => setNeurodivergentProfile(e.target.value)}
                  placeholder="e.g., 'ADHD - need stimulation', 'Autistic - no sudden sounds'"
                  className="w-full p-3 border border-slate-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none text-slate-900"
                />
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={handleGenerate}
              disabled={loading || !currentState || !desiredState}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating your playlist...
                </>
              ) : (
                <>
                  <Music className="w-5 h-5" />
                  Generate Playlist
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
                <Music className="w-4 h-4" />
                New Playlist
              </button>
            </div>

            {/* Transition Overview */}
            <div className="bg-gradient-to-r from-purple-500 to-emerald-500 rounded-xl shadow-lg p-6 text-white">
              <h2 className="text-2xl font-bold mb-3">Your Playlist Strategy</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-purple-100 text-sm mb-1">From</div>
                  <div className="text-xl font-semibold">{results.state_transition?.from}</div>
                </div>
                <div>
                  <div className="text-purple-100 text-sm mb-1">To</div>
                  <div className="text-xl font-semibold">{results.state_transition?.to}</div>
                </div>
              </div>
              {results.state_transition?.task && (
                <div className="text-purple-100">
                  <strong>For:</strong> {results.state_transition.task}
                </div>
              )}
            </div>

            {/* Strategy Explanation */}
            {results.playlist_strategy && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-3">Approach: {results.playlist_strategy.approach}</h3>
                <p className="text-slate-700 mb-4">{results.playlist_strategy.why}</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <div className="font-semibold text-purple-900 mb-1">Phase 1</div>
                    <p className="text-sm text-purple-700">{results.playlist_strategy.phase_1}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <div className="font-semibold text-purple-900 mb-1">Phase 2</div>
                    <p className="text-sm text-purple-700">{results.playlist_strategy.phase_2}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <div className="font-semibold text-purple-900 mb-1">Phase 3</div>
                    <p className="text-sm text-purple-700">{results.playlist_strategy.phase_3}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Playlist Phases */}
            {results.playlist && results.playlist.length > 0 && (
              <div className="space-y-4">
                {results.playlist.map((phase, idx) => (
                  <div key={idx} className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-slate-900">{phase.phase}</h3>
                      {phase.duration && (
                        <span className="text-sm text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                          {phase.duration}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-slate-700 mb-4">{phase.characteristics}</p>
                    
                    {phase.genre_suggestions && phase.genre_suggestions.length > 0 && (
                      <div className="mb-3">
                        <div className="text-sm font-semibold text-slate-700 mb-2">Genres:</div>
                        <div className="flex flex-wrap gap-2">
                          {phase.genre_suggestions.map((genre, genreIdx) => (
                            <span key={genreIdx} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                              {genre}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {phase.example_artists && phase.example_artists.length > 0 && (
                      <div className="mb-3">
                        <div className="text-sm font-semibold text-slate-700 mb-2">Example Artists:</div>
                        <div className="text-sm text-slate-600">{phase.example_artists.join(', ')}</div>
                      </div>
                    )}
                    
                    {phase.spotify_search && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                        <div className="text-sm font-semibold text-emerald-800 mb-1">🎵 Search on Spotify:</div>
                        <code className="text-sm text-emerald-700">{phase.spotify_search}</code>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Audio Settings */}
            {results.audio_settings && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Volume2 className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-bold text-blue-900">Audio Settings</h3>
                </div>
                <div className="space-y-2 text-blue-800">
                  <p><strong>Volume:</strong> {results.audio_settings.recommended_volume}</p>
                  <p><strong>Headphones:</strong> {results.audio_settings.headphones}</p>
                  {results.audio_settings.avoid && results.audio_settings.avoid.length > 0 && (
                    <div>
                      <strong>Avoid:</strong>
                      <ul className="list-disc list-inside ml-4">
                        {results.audio_settings.avoid.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Alternatives */}
            {results.alternative_playlists && results.alternative_playlists.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">If This Doesn't Feel Right...</h3>
                <div className="space-y-3">
                  {results.alternative_playlists.map((alt, idx) => (
                    <div key={idx} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <div className="font-semibold text-slate-900 mb-1">{alt.name}</div>
                      <p className="text-sm text-slate-700 mb-1"><strong>Change:</strong> {alt.change}</p>
                      <p className="text-sm text-slate-600"><strong>When:</strong> {alt.when}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Science Note */}
            {results.science_note && (
              <div className="bg-slate-100 border border-slate-300 rounded-xl p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-2">💡 Why This Works</h3>
                <p className="text-slate-700">{results.science_note}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BrainStateDJ;