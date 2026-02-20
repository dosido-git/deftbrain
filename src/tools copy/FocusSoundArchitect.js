import React, { useState, useEffect } from 'react';
import { Music, Volume2, Headphones, Sliders, Loader2, Play, Pause, Download, Save, RefreshCw, ChevronDown, ChevronUp, AlertCircle, Clock } from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';

const FocusSoundArchitect = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Theme-aware colors
  const c = {
    bg: isDark ? 'bg-zinc-900' : 'bg-gradient-to-br from-purple-50 to-indigo-50',
    card: isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-purple-200',
    cardAlt: isDark ? 'bg-zinc-700 border-zinc-600' : 'bg-purple-50 border-purple-200',
    
    input: isDark
      ? 'bg-zinc-900 border-zinc-700 text-zinc-50 placeholder:text-zinc-500 focus:border-purple-500 focus:ring-purple-500/20'
      : 'bg-white border-purple-300 text-purple-900 placeholder:text-purple-400 focus:border-purple-600 focus:ring-purple-100',
    
    text: isDark ? 'text-zinc-50' : 'text-purple-900',
    textSecondary: isDark ? 'text-zinc-300' : 'text-purple-700',
    textMuted: isDark ? 'text-zinc-400' : 'text-purple-600',
    label: isDark ? 'text-zinc-200' : 'text-purple-800',
    
    btnPrimary: isDark
      ? 'bg-purple-600 hover:bg-purple-700 text-white'
      : 'bg-purple-600 hover:bg-purple-700 text-white',
    btnSecondary: isDark
      ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-50'
      : 'bg-purple-100 hover:bg-purple-200 text-purple-900',
    
    success: isDark
      ? 'bg-green-900/20 border-green-700 text-green-200'
      : 'bg-green-50 border-green-300 text-green-800',
    info: isDark
      ? 'bg-blue-900/20 border-blue-700 text-blue-200'
      : 'bg-blue-50 border-blue-200 text-blue-900',
  };

  // Form state
  const [currentTask, setCurrentTask] = useState('Deep work');
  const [environment, setEnvironment] = useState({
    noisyOffice: false,
    quietHome: false,
    coffeeShop: false,
    openPlan: false,
    bedroom: false,
  });
  const [soundPreferences, setSoundPreferences] = useState({
    whiteNoise: false,
    pinkNoise: false,
    brownNoise: true,
    rain: false,
    ocean: false,
    forest: false,
    ambientMusic: false,
    binauralBeats: false,
    asmr: false,
  });
  const [sensitivities, setSensitivities] = useState({
    suddenSounds: false,
    needVariety: false,
    preferConsistency: true,
    highFrequencySensitive: false,
    needLowBass: false,
  });
  const [energyGoal, setEnergyGoal] = useState(50);

  // Audio playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [masterVolume, setMasterVolume] = useState(70);
  const [elementVolumes, setElementVolumes] = useState({});

  // Results state
  const [soundscape, setSoundscape] = useState(null);
  const [error, setError] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    instructions: true,
    elements: true,
    variations: false,
    tips: false,
    troubleshooting: false,
  });

  const tasks = [
    'Deep work',
    'Creative',
    'Reading',
    'Studying',
    'Tedious tasks',
    'Relaxing',
  ];

  const handleGenerate = async () => {
    setError('');
    setSoundscape(null);

    const selectedEnv = Object.keys(environment).filter(key => environment[key]);
    const selectedSounds = Object.keys(soundPreferences).filter(key => soundPreferences[key]);
    const selectedSensitivities = Object.keys(sensitivities).filter(key => sensitivities[key]);

    if (selectedSounds.length === 0) {
      setError('Please select at least one sound preference');
      return;
    }

    try {
      const data = await callToolEndpoint('focus-sound-architect', {
        task: currentTask,
        environment: selectedEnv,
        soundPreferences: selectedSounds,
        sensitivities: selectedSensitivities,
        energyGoal,
      });
      
      setSoundscape(data);
      
      // Initialize element volumes
      if (data.soundscape_recipe?.elements) {
        const volumes = {};
        data.soundscape_recipe.elements.forEach((el, idx) => {
          volumes[`element-${idx}`] = el.volume_level;
        });
        setElementVolumes(volumes);
      }

      setExpandedSections(prev => ({
        ...prev,
        instructions: true,
        elements: true,
      }));
    } catch (err) {
      setError(err.message || 'Failed to generate soundscape. Please try again.');
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleReset = () => {
    setCurrentTask('Deep work');
    setEnvironment({
      noisyOffice: false,
      quietHome: false,
      coffeeShop: false,
      openPlan: false,
      bedroom: false,
    });
    setSoundPreferences({
      whiteNoise: false,
      pinkNoise: false,
      brownNoise: true,
      rain: false,
      ocean: false,
      forest: false,
      ambientMusic: false,
      binauralBeats: false,
      asmr: false,
    });
    setSensitivities({
      suddenSounds: false,
      needVariety: false,
      preferConsistency: true,
      highFrequencySensitive: false,
      needLowBass: false,
    });
    setEnergyGoal(50);
    setSoundscape(null);
    setIsPlaying(false);
  };

  const getEnergyLabel = (level) => {
    if (level < 25) return 'Very Calm';
    if (level < 50) return 'Calm';
    if (level < 75) return 'Balanced';
    return 'Energized';
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    // In real implementation, would control Web Audio API here
  };

  const handleElementVolumeChange = (elementKey, newVolume) => {
    setElementVolumes(prev => ({
      ...prev,
      [elementKey]: newVolume
    }));
    // In real implementation, would adjust Web Audio API gain nodes
  };

  return (
    <div className={`min-h-screen ${c.bg} py-8 px-4`}>
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className={`${c.card} border rounded-xl shadow-lg p-6 transition-colors duration-200`}>
          <div className="flex items-center gap-3 mb-4">

            <div>
              <h2 className={`text-2xl font-bold ${c.text}`}>Focus Sound Architect 🎧</h2>
              <p className={`text-sm ${c.textMuted}`}>Generate personalized soundscapes for concentration</p>
            </div>
          </div>

          {/* Info notice */}
          <div className={`${c.info} border-l-4 rounded-r-lg p-4`}>
            <div className="flex items-start gap-2">
              <Music className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-sm mb-1">Built for Neurodivergent Brains</h3>
                <p className="text-xs">
                  This tool generates custom soundscape recipes calibrated to your sensory needs, task type, 
                  and environment. Designed especially for ADHD and autistic users.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Input Form */}
        <div className={`${c.card} border rounded-xl shadow-lg p-6 transition-colors duration-200`}>
          
          <div className="space-y-6">
            
            {/* Current Task */}
            <div>
              <label htmlFor="task" className={`block text-sm font-medium ${c.label} mb-2`}>
                What are you working on?
              </label>
              <select
                id="task"
                value={currentTask}
                onChange={(e) => setCurrentTask(e.target.value)}
                className={`w-full p-3 border rounded-lg ${c.input} outline-none focus:ring-2`}
              >
                {tasks.map(task => (
                  <option key={task} value={task}>{task}</option>
                ))}
              </select>
            </div>

            {/* Environment */}
            <div>
              <label className={`block text-sm font-medium ${c.label} mb-3`}>
                Current environment (select all that apply)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { key: 'noisyOffice', label: 'Noisy office' },
                  { key: 'quietHome', label: 'Quiet home' },
                  { key: 'coffeeShop', label: 'Coffee shop' },
                  { key: 'openPlan', label: 'Open plan' },
                  { key: 'bedroom', label: 'Bedroom' },
                ].map(({ key, label }) => (
                  <label
                    key={key}
                    className={`flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                      environment[key]
                        ? isDark
                          ? 'border-purple-500 bg-purple-900/20'
                          : 'border-purple-500 bg-purple-50'
                        : isDark
                          ? 'border-zinc-700 hover:border-zinc-600'
                          : 'border-purple-200 hover:border-purple-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={environment[key]}
                      onChange={() => setEnvironment(prev => ({ ...prev, [key]: !prev[key] }))}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Sound Preferences */}
            <div>
              <label className={`block text-sm font-medium ${c.label} mb-3`}>
                Sound preferences (select what you like) *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { key: 'whiteNoise', label: 'White noise' },
                  { key: 'pinkNoise', label: 'Pink noise' },
                  { key: 'brownNoise', label: 'Brown noise' },
                  { key: 'rain', label: 'Rain' },
                  { key: 'ocean', label: 'Ocean waves' },
                  { key: 'forest', label: 'Forest sounds' },
                  { key: 'ambientMusic', label: 'Ambient music' },
                  { key: 'binauralBeats', label: 'Binaural beats' },
                  { key: 'asmr', label: 'ASMR triggers' },
                ].map(({ key, label }) => (
                  <label
                    key={key}
                    className={`flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                      soundPreferences[key]
                        ? isDark
                          ? 'border-purple-500 bg-purple-900/20'
                          : 'border-purple-500 bg-purple-50'
                        : isDark
                          ? 'border-zinc-700 hover:border-zinc-600'
                          : 'border-purple-200 hover:border-purple-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={soundPreferences[key]}
                      onChange={() => setSoundPreferences(prev => ({ ...prev, [key]: !prev[key] }))}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Sensory Sensitivities */}
            <div>
              <label className={`block text-sm font-medium ${c.label} mb-3`}>
                Sensory sensitivities (helps us customize)
              </label>
              <div className="space-y-2">
                {[
                  { key: 'suddenSounds', label: 'Sudden sounds startle me' },
                  { key: 'needVariety', label: 'I need variety/stimulation' },
                  { key: 'preferConsistency', label: 'I prefer consistency' },
                  { key: 'highFrequencySensitive', label: 'Sensitive to high frequencies' },
                  { key: 'needLowBass', label: 'I need low bass/rumble' },
                ].map(({ key, label }) => (
                  <label
                    key={key}
                    className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                      sensitivities[key]
                        ? isDark
                          ? 'border-purple-500 bg-purple-900/20'
                          : 'border-purple-500 bg-purple-50'
                        : isDark
                          ? 'border-zinc-700 hover:border-zinc-600'
                          : 'border-purple-200 hover:border-purple-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={sensitivities[key]}
                      onChange={() => setSensitivities(prev => ({ ...prev, [key]: !prev[key] }))}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Energy Goal Slider */}
            <div>
              <label htmlFor="energy" className={`block text-sm font-medium ${c.label} mb-2`}>
                Energy goal: {getEnergyLabel(energyGoal)}
              </label>
              <div className="space-y-2">
                <input
                  id="energy"
                  type="range"
                  min="0"
                  max="100"
                  value={energyGoal}
                  onChange={(e) => setEnergyGoal(Number(e.target.value))}
                  className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-purple-600">😴 Very Calm</span>
                  <span className="text-xs text-purple-600">⚡ Energized</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleGenerate}
                disabled={loading}
                className={`flex-1 ${c.btnPrimary} disabled:opacity-50 py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating soundscape...
                  </>
                ) : (
                  <>
                    <Music className="w-5 h-5" />
                    Generate Soundscape
                  </>
                )}
              </button>
              
              {soundscape && (
                <button
                  onClick={handleReset}
                  className={`${c.btnSecondary} py-3 px-6 rounded-lg font-semibold transition-colors`}
                >
                  New Soundscape
                </button>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 flex items-start gap-3`}>
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        {soundscape && soundscape.soundscape_recipe && (
          <div className="space-y-6">
            
            {/* Soundscape Header with Playback */}
            <div className={`${c.card} border rounded-xl shadow-lg p-6`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className={`text-2xl font-bold ${c.text}`}>{soundscape.soundscape_recipe.name}</h3>
                  {soundscape.soundscape_recipe.duration_recommendation && (
                    <p className={`text-sm ${c.textMuted} flex items-center gap-1 mt-1`}>
                      <Clock className="w-3 h-3" />
                      Recommended: {soundscape.soundscape_recipe.duration_recommendation}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handlePlayPause}
                    className={`${c.btnPrimary} p-4 rounded-full`}
                  >
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                  </button>
                </div>
              </div>

              {/* Master Volume */}
              <div className="mt-4">
                <label className={`block text-sm font-medium ${c.label} mb-2 flex items-center gap-2`}>
                  <Volume2 className="w-4 h-4" />
                  Master Volume: {masterVolume}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={masterVolume}
                  onChange={(e) => setMasterVolume(Number(e.target.value))}
                  className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Playback Note */}
              <div className={`${c.info} border rounded-lg p-3 mt-4`}>
                <p className="text-xs">
                  <strong>Note:</strong> Full audio playback requires external audio files or Web Audio API implementation. 
                  This shows the soundscape recipe and mixing instructions.
                </p>
              </div>
            </div>

            {/* Sound Elements */}
            {soundscape.soundscape_recipe.elements && soundscape.soundscape_recipe.elements.length > 0 && (
              <div className={`${c.card} border rounded-xl shadow-lg p-6`}>
                <button
                  onClick={() => toggleSection('elements')}
                  className="flex items-center gap-2 mb-4 w-full"
                >
                  <Sliders className="w-5 h-5" />
                  <h3 className={`text-xl font-bold ${c.text}`}>Sound Elements ({soundscape.soundscape_recipe.elements.length})</h3>
                  {expandedSections.elements ? (
                    <ChevronUp className="w-5 h-5 ml-auto" />
                  ) : (
                    <ChevronDown className="w-5 h-5 ml-auto" />
                  )}
                </button>

                {expandedSections.elements && (
                  <div className="space-y-4">
                    {soundscape.soundscape_recipe.elements.map((element, idx) => (
                      <div key={idx} className={`${c.cardAlt} border rounded-lg p-4`}>
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className={`font-bold ${c.text} capitalize`}>
                              {element.sound_type.replace(/_/g, ' ')}
                            </h4>
                            {element.frequency_range && (
                              <span className={`text-xs px-2 py-0.5 rounded ${isDark ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-700'} mt-1 inline-block`}>
                                {element.frequency_range} frequency
                              </span>
                            )}
                          </div>
                          <span className={`text-sm font-semibold ${c.textMuted}`}>
                            {elementVolumes[`element-${idx}`] || element.volume_level}%
                          </span>
                        </div>

                        <p className={`text-sm ${c.textSecondary} mb-3`}>
                          <strong>Why:</strong> {element.why_included}
                        </p>

                        {element.pattern && (
                          <p className={`text-xs ${c.textMuted} mb-3`}>
                            Pattern: {element.pattern}
                          </p>
                        )}

                        <div>
                          <label className={`block text-xs ${c.label} mb-1`}>Volume</label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={elementVolumes[`element-${idx}`] || element.volume_level}
                            onChange={(e) => handleElementVolumeChange(`element-${idx}`, Number(e.target.value))}
                            className="w-full h-1 bg-purple-200 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Binaural Beats */}
            {soundscape.soundscape_recipe.binaural_beats && (
              <div className={`${c.card} border rounded-xl shadow-lg p-6`}>
                <h3 className={`text-lg font-bold ${c.text} mb-3 flex items-center gap-2`}>
                  <Headphones className="w-5 h-5" />
                  Binaural Beats
                </h3>
                <div className={`${c.cardAlt} border rounded-lg p-4 space-y-2`}>
                  <p className={`text-sm ${c.textSecondary}`}>
                    <strong>Frequency:</strong> {soundscape.soundscape_recipe.binaural_beats.frequency}
                  </p>
                  <p className={`text-sm ${c.textSecondary}`}>
                    <strong>Purpose:</strong> {soundscape.soundscape_recipe.binaural_beats.purpose}
                  </p>
                  <p className={`text-sm ${c.textSecondary}`}>
                    <strong>When to use:</strong> {soundscape.soundscape_recipe.binaural_beats.when_to_use}
                  </p>
                </div>
              </div>
            )}

            {/* Usage Instructions */}
            {soundscape.usage_instructions && (
              <div className={`${c.card} border rounded-xl shadow-lg p-6`}>
                <button
                  onClick={() => toggleSection('instructions')}
                  className="flex items-center gap-2 mb-4 w-full"
                >
                  <Music className="w-5 h-5" />
                  <h3 className={`text-xl font-bold ${c.text}`}>How to Use This Soundscape</h3>
                  {expandedSections.instructions ? (
                    <ChevronUp className="w-5 h-5 ml-auto" />
                  ) : (
                    <ChevronDown className="w-5 h-5 ml-auto" />
                  )}
                </button>

                {expandedSections.instructions && (
                  <div className="space-y-3">
                    {soundscape.usage_instructions.optimal_volume && (
                      <div className={`${c.cardAlt} border rounded-lg p-3`}>
                        <p className={`text-xs font-semibold ${c.textMuted} mb-1`}>OPTIMAL VOLUME:</p>
                        <p className={`text-sm ${c.textSecondary}`}>{soundscape.usage_instructions.optimal_volume}</p>
                      </div>
                    )}
                    {soundscape.usage_instructions.how_to_start && (
                      <div className={`${c.cardAlt} border rounded-lg p-3`}>
                        <p className={`text-xs font-semibold ${c.textMuted} mb-1`}>HOW TO START:</p>
                        <p className={`text-sm ${c.textSecondary}`}>{soundscape.usage_instructions.how_to_start}</p>
                      </div>
                    )}
                    {soundscape.usage_instructions.when_to_adjust && (
                      <div className={`${c.cardAlt} border rounded-lg p-3`}>
                        <p className={`text-xs font-semibold ${c.textMuted} mb-1`}>WHEN TO ADJUST:</p>
                        <p className={`text-sm ${c.textSecondary}`}>{soundscape.usage_instructions.when_to_adjust}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Variations */}
            {soundscape.variations && soundscape.variations.length > 0 && (
              <div className={`${c.card} border rounded-xl shadow-lg p-6`}>
                <button
                  onClick={() => toggleSection('variations')}
                  className="flex items-center gap-2 mb-4 w-full"
                >
                  <RefreshCw className="w-5 h-5" />
                  <h3 className={`text-xl font-bold ${c.text}`}>Variations to Try</h3>
                  {expandedSections.variations ? (
                    <ChevronUp className="w-5 h-5 ml-auto" />
                  ) : (
                    <ChevronDown className="w-5 h-5 ml-auto" />
                  )}
                </button>

                {expandedSections.variations && (
                  <div className="space-y-3">
                    {soundscape.variations.map((variation, idx) => (
                      <div key={idx} className={`${c.cardAlt} border rounded-lg p-4`}>
                        <h4 className={`font-bold ${c.text} mb-2`}>{variation.variation_name}</h4>
                        <p className={`text-sm ${c.textSecondary} mb-2`}>
                          <strong>Changes:</strong> {variation.changes}
                        </p>
                        <p className={`text-xs ${c.textMuted}`}>
                          <strong>When to use:</strong> {variation.when_to_use}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Neurodivergent Tips */}
            {soundscape.neurodivergent_tips && soundscape.neurodivergent_tips.length > 0 && (
              <div className={`${c.card} border rounded-xl shadow-lg p-6`}>
                <button
                  onClick={() => toggleSection('tips')}
                  className="flex items-center gap-2 mb-4 w-full"
                >
                  <Headphones className="w-5 h-5" />
                  <h3 className={`text-xl font-bold ${c.text}`}>Neurodivergent Tips</h3>
                  {expandedSections.tips ? (
                    <ChevronUp className="w-5 h-5 ml-auto" />
                  ) : (
                    <ChevronDown className="w-5 h-5 ml-auto" />
                  )}
                </button>

                {expandedSections.tips && (
                  <div className={`${c.success} border rounded-lg p-4`}>
                    <ul className="space-y-3">
                      {soundscape.neurodivergent_tips.map((item, idx) => (
                        <li key={idx}>
                          <p className={`text-sm font-semibold mb-1`}>{item.tip}</p>
                          <p className={`text-xs`}><strong>Why:</strong> {item.why}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Troubleshooting */}
            {soundscape.troubleshooting && (
              <div className={`${c.card} border rounded-xl shadow-lg p-6`}>
                <button
                  onClick={() => toggleSection('troubleshooting')}
                  className="flex items-center gap-2 mb-4 w-full"
                >
                  <AlertCircle className="w-5 h-5" />
                  <h3 className={`text-xl font-bold ${c.text}`}>Troubleshooting</h3>
                  {expandedSections.troubleshooting ? (
                    <ChevronUp className="w-5 h-5 ml-auto" />
                  ) : (
                    <ChevronDown className="w-5 h-5 ml-auto" />
                  )}
                </button>

                {expandedSections.troubleshooting && (
                  <div className="space-y-3">
                    {soundscape.troubleshooting.if_too_distracting && (
                      <div className={`${c.cardAlt} border rounded-lg p-3`}>
                        <p className={`text-xs font-semibold ${c.textMuted} mb-1`}>IF TOO DISTRACTING:</p>
                        <p className={`text-sm ${c.textSecondary}`}>{soundscape.troubleshooting.if_too_distracting}</p>
                      </div>
                    )}
                    {soundscape.troubleshooting.if_not_enough && (
                      <div className={`${c.cardAlt} border rounded-lg p-3`}>
                        <p className={`text-xs font-semibold ${c.textMuted} mb-1`}>IF NOT ENOUGH STIMULATION:</p>
                        <p className={`text-sm ${c.textSecondary}`}>{soundscape.troubleshooting.if_not_enough}</p>
                      </div>
                    )}
                    {soundscape.troubleshooting.if_causes_anxiety && (
                      <div className={`${c.cardAlt} border rounded-lg p-3`}>
                        <p className={`text-xs font-semibold ${c.textMuted} mb-1`}>IF IT CAUSES ANXIETY:</p>
                        <p className={`text-sm ${c.textSecondary}`}>{soundscape.troubleshooting.if_causes_anxiety}</p>
                      </div>
                    )}
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

export default FocusSoundArchitect;
