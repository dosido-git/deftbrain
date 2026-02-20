import React, { useState } from 'react';
import { MapPin, Eye, Volume2, Users, Sun, Loader2, AlertTriangle, Navigation, Clock, Heart, Shield, CheckCircle, Info } from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';

const SensoryMinefieldMapper = () => {
  const { isDark } = useTheme();
  const { callToolEndpoint, loading, error: apiError } = useClaudeAPI();

  // State
  const [location, setLocation] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [visitTime, setVisitTime] = useState('');
  const [placeType, setPlaceType] = useState('');
  const [sensitivities, setSensitivities] = useState({
    loud_noises: false,
    bright_lights: false,
    crowds: false,
    strong_smells: false,
    visual_chaos: false,
    textures: false
  });
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  // Theme colors
  const c = {
    gradient: isDark ? 'from-cyan-900/20 to-blue-900/20' : 'from-cyan-50 to-blue-50',
    card: isDark ? 'bg-gray-800' : 'bg-white',
    cardAlt: isDark ? 'bg-gray-700/50' : 'bg-cyan-50/50',
    text: isDark ? 'text-gray-100' : 'text-gray-900',
    textSecondary: isDark ? 'text-gray-300' : 'text-gray-700',
    textMuted: isDark ? 'text-gray-400' : 'text-gray-500',
    border: isDark ? 'border-gray-700' : 'border-gray-200',
    input: isDark ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900',
    btnPrimary: isDark ? 'bg-cyan-600 hover:bg-cyan-700 text-white' : 'bg-cyan-600 hover:bg-cyan-700 text-white',
  };

  // Toggle sensitivity
  const toggleSensitivity = (key) => {
    setSensitivities(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Get risk color
  const getRiskColor = (level) => {
    const lowerLevel = level?.toLowerCase() || '';
    if (lowerLevel.includes('low') || lowerLevel.includes('minimal')) {
      return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
    }
    if (lowerLevel.includes('moderate') || lowerLevel.includes('medium')) {
      return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30';
    }
    if (lowerLevel.includes('high') || lowerLevel.includes('overwhelming')) {
      return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
    }
    return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30';
  };

  // Analyze location
  const analyzeLocation = async () => {
    setError('');
    setResults(null);

    // Validation
    if (!location.trim()) {
      setError('Please enter a location');
      return;
    }
    if (!visitDate || !visitTime) {
      setError('Please select when you\'re planning to visit');
      return;
    }
    if (!placeType) {
      setError('Please select the type of place');
      return;
    }

    const selectedSensitivities = Object.entries(sensitivities)
      .filter(([_, checked]) => checked)
      .map(([key, _]) => key);

    if (selectedSensitivities.length === 0) {
      setError('Please select at least one sensory sensitivity');
      return;
    }

    try {
      const data = await callToolEndpoint('sensory-minefield-mapper', {
        location,
        visitDateTime: `${visitDate} at ${visitTime}`,
        placeType,
        sensitivities: selectedSensitivities
      });
      setResults(data);
    } catch (err) {
      setError(err.message || 'Failed to analyze location. Please try again.');
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${c.gradient} p-6`}>
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <MapPin className="w-12 h-12 text-cyan-600 dark:text-cyan-400" />
            <h1 className={`text-4xl font-bold ${c.text}`}>Sensory Minefield Mapper</h1>
          </div>
          <p className={`text-lg ${c.textSecondary} max-w-2xl mx-auto`}>
            Predict sensory overwhelm at locations before you go. Know before you go.
          </p>
        </div>

        {/* Input Section */}
        <div className={`${c.card} rounded-xl shadow-lg p-6 mb-6`}>
          
          {/* Location */}
          <div className="mb-6">
            <label className={`block text-sm font-semibold ${c.text} mb-2`}>
              Where are you going?
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Target on Main Street, Starbucks downtown, Museum of Art"
              className={`w-full px-4 py-3 rounded-lg border ${c.input} focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500`}
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className={`block text-sm font-semibold ${c.text} mb-2`}>
                What day?
              </label>
              <input
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border ${c.input} focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500`}
              />
            </div>
            <div>
              <label className={`block text-sm font-semibold ${c.text} mb-2`}>
                What time?
              </label>
              <input
                type="time"
                value={visitTime}
                onChange={(e) => setVisitTime(e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border ${c.input} focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500`}
              />
            </div>
          </div>

          {/* Place Type */}
          <div className="mb-6">
            <label className={`block text-sm font-semibold ${c.text} mb-2`}>
              Type of place
            </label>
            <select
              value={placeType}
              onChange={(e) => setPlaceType(e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border ${c.input} focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500`}
            >
              <option value="">Select type...</option>
              <option value="restaurant">Restaurant</option>
              <option value="store">Store/Shop</option>
              <option value="grocery">Grocery Store</option>
              <option value="mall">Shopping Mall</option>
              <option value="event">Event/Concert</option>
              <option value="park">Park/Outdoor Space</option>
              <option value="airport">Airport</option>
              <option value="movie_theater">Movie Theater</option>
              <option value="gym">Gym/Fitness Center</option>
              <option value="museum">Museum/Gallery</option>
              <option value="library">Library</option>
              <option value="cafe">Cafe/Coffee Shop</option>
              <option value="office">Office Building</option>
              <option value="hospital">Hospital/Medical</option>
            </select>
          </div>

          {/* Sensory Sensitivities */}
          <div className="mb-6">
            <label className={`block text-sm font-semibold ${c.text} mb-3`}>
              Your sensory sensitivities
              <span className={`ml-2 text-xs font-normal ${c.textMuted}`}>
                (Check all that apply)
              </span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { key: 'loud_noises', icon: Volume2, label: 'Loud noises' },
                { key: 'bright_lights', icon: Sun, label: 'Bright/fluorescent lights' },
                { key: 'crowds', icon: Users, label: 'Crowds' },
                { key: 'strong_smells', icon: AlertTriangle, label: 'Strong smells' },
                { key: 'visual_chaos', icon: Eye, label: 'Visual chaos' },
                { key: 'textures', icon: Heart, label: 'Certain textures' },
              ].map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => toggleSensitivity(key)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    sensitivities[key]
                      ? 'border-cyan-500 bg-cyan-100 dark:bg-cyan-900/30'
                      : `border-gray-300 dark:border-gray-600 ${c.card}`
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-2 mx-auto ${sensitivities[key] ? 'text-cyan-600 dark:text-cyan-400' : c.textMuted}`} />
                  <p className={`text-sm font-medium ${sensitivities[key] ? 'text-cyan-700 dark:text-cyan-300' : c.textSecondary}`}>
                    {label}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Analyze Button */}
          <button
            onClick={analyzeLocation}
            disabled={loading}
            className={`w-full ${c.btnPrimary} py-3 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 inline mr-2 animate-spin" />
                Predicting Sensory Environment...
              </>
            ) : (
              <>
                <MapPin className="w-5 h-5 inline mr-2" />
                Predict Sensory Environment
              </>
            )}
          </button>
        </div>

        {/* Error */}
        {(error || apiError) && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-700 dark:text-red-300">{error || apiError}</p>
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="space-y-6">
            
            {/* Location Analysis Summary */}
            {results.location_analysis && (
              <div className={`${c.card} rounded-xl shadow-lg p-6`}>
                <h2 className={`text-2xl font-bold ${c.text} mb-4 flex items-center gap-2`}>
                  <MapPin className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                  {results.location_analysis.location_name}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`${c.cardAlt} rounded-lg p-4`}>
                    <p className={`text-xs ${c.textMuted} mb-1 uppercase`}>Your Visit</p>
                    <p className={`text-lg font-semibold ${c.text}`}>
                      {results.location_analysis.expected_visit_time}
                    </p>
                  </div>
                  <div className={`${c.cardAlt} rounded-lg p-4`}>
                    <p className={`text-xs ${c.textMuted} mb-1 uppercase`}>Overall Sensory Level</p>
                    <p className={`text-lg font-bold px-3 py-1 rounded-full inline-block ${getRiskColor(results.location_analysis.overall_sensory_rating)}`}>
                      {results.location_analysis.overall_sensory_rating.toUpperCase()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Sensory Factors */}
            {results.sensory_factors && results.sensory_factors.length > 0 && (
              <div className={`${c.card} rounded-xl shadow-lg p-6`}>
                <h2 className={`text-2xl font-bold ${c.text} mb-4`}>
                  Sensory Factor Predictions
                </h2>
                <div className="space-y-4">
                  {results.sensory_factors.map((factor, idx) => (
                    <div key={idx} className={`${c.cardAlt} rounded-lg p-4 border-l-4 ${
                      factor.your_sensitivity === 'high' ? 'border-red-500' :
                      factor.your_sensitivity === 'medium' ? 'border-yellow-500' :
                      'border-green-500'
                    }`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className={`font-bold ${c.text} text-lg mb-1`}>{factor.factor}</h3>
                          <p className={`text-sm ${c.textSecondary}`}>
                            Predicted: <span className="font-semibold">{factor.predicted_level}</span>
                          </p>
                          {factor.based_on && (
                            <p className={`text-xs ${c.textMuted} mt-1`}>Based on: {factor.based_on}</p>
                          )}
                          {factor.predicted_type && (
                            <p className={`text-xs ${c.textMuted} mt-1`}>Type: {factor.predicted_type}</p>
                          )}
                          {factor.brightness && (
                            <p className={`text-xs ${c.textMuted} mt-1`}>Brightness: {factor.brightness}</p>
                          )}
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                          factor.your_sensitivity === 'high' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                          factor.your_sensitivity === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                          'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        }`}>
                          Your Sensitivity: {factor.your_sensitivity?.toUpperCase()}
                        </div>
                      </div>

                      {factor.peak_times && factor.peak_times.length > 0 && (
                        <div className="mb-3">
                          <p className={`text-xs font-semibold ${c.text} mb-1`}>Peak Times:</p>
                          <div className="flex flex-wrap gap-2">
                            {factor.peak_times.map((time, tidx) => (
                              <span key={tidx} className="text-xs px-2 py-1 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
                                {time}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {factor.alternative_time && (
                        <div className={`mb-3 p-3 rounded ${isDark ? 'bg-green-900/20' : 'bg-green-50'}`}>
                          <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                            💡 Better Time: {factor.alternative_time}
                          </p>
                        </div>
                      )}

                      {factor.coping_strategies && factor.coping_strategies.length > 0 && (
                        <div>
                          <p className={`text-xs font-semibold ${c.text} mb-2`}>Coping Strategies:</p>
                          <ul className="space-y-1">
                            {factor.coping_strategies.map((strategy, sidx) => (
                              <li key={sidx} className={`text-sm ${c.textSecondary} flex items-start gap-2`}>
                                <CheckCircle className="w-4 h-4 text-cyan-600 dark:text-cyan-400 flex-shrink-0 mt-0.5" />
                                {strategy}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Optimal Visit Time */}
            {results.optimal_visit_time && (
              <div className={`${c.card} rounded-xl shadow-lg p-6 border-2 border-green-400 dark:border-green-600`}>
                <h2 className={`text-2xl font-bold ${c.text} mb-4 flex items-center gap-2`}>
                  <Clock className="w-6 h-6 text-green-600 dark:text-green-400" />
                  Optimal Visit Time
                </h2>
                <div className={`${c.cardAlt} rounded-lg p-4 mb-4`}>
                  <p className={`text-sm ${c.textMuted} mb-1`}>Recommended Time</p>
                  <p className={`text-2xl font-bold text-green-600 dark:text-green-400 mb-2`}>
                    {results.optimal_visit_time.recommended}
                  </p>
                  <p className={`text-sm ${c.textSecondary} mb-2`}>
                    <strong>Why:</strong> {results.optimal_visit_time.why}
                  </p>
                  {results.optimal_visit_time.crowd_reduction && (
                    <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                      📉 {results.optimal_visit_time.crowd_reduction}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Sensory Escape Routes */}
            {results.sensory_escape_routes && results.sensory_escape_routes.length > 0 && (
              <div className={`${c.card} rounded-xl shadow-lg p-6`}>
                <h2 className={`text-2xl font-bold ${c.text} mb-4 flex items-center gap-2`}>
                  <Navigation className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  Sensory Escape Routes
                  <span className={`text-sm font-normal ${c.textMuted}`}>(Scout these first!)</span>
                </h2>
                <div className="space-y-3">
                  {results.sensory_escape_routes.map((route, idx) => (
                    <div key={idx} className={`${c.cardAlt} rounded-lg p-4`}>
                      <h3 className={`font-bold ${c.text} mb-2`}>{route.location}</h3>
                      <p className={`text-sm ${c.textSecondary} mb-1`}>
                        <strong>Why:</strong> {route.why}
                      </p>
                      <p className={`text-xs ${c.textMuted}`}>
                        {route.accessibility || route.when_available}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preparation Strategies */}
            {results.preparation_strategies && (
              <div className={`${c.card} rounded-xl shadow-lg p-6`}>
                <h2 className={`text-2xl font-bold ${c.text} mb-4 flex items-center gap-2`}>
                  <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  Preparation Strategies
                </h2>
                <div className="space-y-4">
                  {results.preparation_strategies.before_you_go && (
                    <div>
                      <h3 className={`font-bold ${c.text} mb-2`}>Before You Go:</h3>
                      <ul className="space-y-1">
                        {results.preparation_strategies.before_you_go.map((item, idx) => (
                          <li key={idx} className={`text-sm ${c.textSecondary} flex items-start gap-2`}>
                            <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {results.preparation_strategies.during_visit && (
                    <div>
                      <h3 className={`font-bold ${c.text} mb-2`}>During Visit:</h3>
                      <ul className="space-y-1">
                        {results.preparation_strategies.during_visit.map((item, idx) => (
                          <li key={idx} className={`text-sm ${c.textSecondary} flex items-start gap-2`}>
                            <CheckCircle className="w-4 h-4 text-cyan-600 dark:text-cyan-400 flex-shrink-0 mt-0.5" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {results.preparation_strategies.exit_strategy && (
                    <div className={`p-4 rounded-lg ${isDark ? 'bg-orange-900/20' : 'bg-orange-50'}`}>
                      <p className="text-sm font-semibold text-orange-700 dark:text-orange-400">
                        🚪 Exit Strategy: {results.preparation_strategies.exit_strategy}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Warning Signs */}
            {results.warning_signs_to_monitor && results.warning_signs_to_monitor.length > 0 && (
              <div className={`${c.card} rounded-xl shadow-lg p-6`}>
                <h2 className={`text-2xl font-bold ${c.text} mb-4 flex items-center gap-2`}>
                  <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  Warning Signs to Monitor
                </h2>
                <p className={`text-sm ${c.textSecondary} mb-3`}>
                  If you notice these signs, use your escape route or exit immediately:
                </p>
                <ul className="space-y-2">
                  {results.warning_signs_to_monitor.map((sign, idx) => (
                    <li key={idx} className={`text-sm ${c.textSecondary} flex items-start gap-2`}>
                      <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                      {sign}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Accommodation Requests */}
            {results.accommodation_requests && results.accommodation_requests.length > 0 && (
              <div className={`${c.card} rounded-xl shadow-lg p-6`}>
                <h2 className={`text-2xl font-bold ${c.text} mb-4 flex items-center gap-2`}>
                  <Info className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  Accommodation Requests (Pre-scripted)
                </h2>
                <div className="space-y-3">
                  {results.accommodation_requests.map((req, idx) => (
                    <div key={idx} className={`${c.cardAlt} rounded-lg p-4`}>
                      <p className={`font-bold ${c.text} mb-2`}>{req.what_to_ask}</p>
                      <p className={`text-sm ${c.textSecondary} mb-2 italic`}>
                        "{req.how_to_ask}"
                      </p>
                      <p className={`text-xs ${c.textMuted}`}>
                        Likelihood: <span className="font-semibold">{req.likelihood_granted}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Backup Plan */}
            {results.backup_plan && (
              <div className={`${c.card} rounded-xl shadow-lg p-6 border-4 border-red-400 dark:border-red-600`}>
                <h2 className={`text-2xl font-bold text-red-700 dark:text-red-400 mb-4 flex items-center gap-2`}>
                  <Shield className="w-8 h-8" />
                  Backup Plan (Always Available)
                </h2>
                <p className={`text-lg font-semibold ${c.text}`}>
                  {results.backup_plan}
                </p>
                <p className={`text-sm ${c.textSecondary} mt-2`}>
                  Using this plan is self-care, not failure. Your wellbeing matters more than any errand.
                </p>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};

export default SensoryMinefieldMapper;
