import React, { useState, useRef } from 'react';
import { Leaf, Upload, Camera, Loader2, AlertCircle, CheckCircle, Droplets, Sun, X, Clock, AlertTriangle, Heart, Calendar, Sparkles } from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';

const PlantRescue = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const fileInputRef = useRef(null);

  // Form state
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [plantDescription, setPlantDescription] = useState('');
  const [lightLevel, setLightLevel] = useState('');
  const [wateringFreq, setWateringFreq] = useState('');
  const [location, setLocation] = useState('');
  const [ageOfOwnership, setAgeOfOwnership] = useState('');
  
  // Safety and regional inputs
  const [hasPets, setHasPets] = useState(false);
  const [hasChildren, setHasChildren] = useState(false);
  const [climateZone, setClimateZone] = useState('');
  const [userLocation, setUserLocation] = useState('');

  // Results state
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  // Theme-aware colors
  const c = {
    bg: isDark ? 'bg-zinc-900' : 'bg-gradient-to-br from-emerald-50 to-emerald-50',
    card: isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-emerald-200',
    cardAlt: isDark ? 'bg-zinc-700 border-zinc-600' : 'bg-emerald-50 border-emerald-200',
    
    input: isDark 
      ? 'bg-zinc-900 border-zinc-700 text-zinc-50 placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20'
      : 'bg-white border-emerald-300 text-emerald-900 placeholder:text-emerald-400 focus:border-emerald-600 focus:ring-emerald-100',
    
    text: isDark ? 'text-zinc-50' : 'text-emerald-900',
    textSecondary: isDark ? 'text-zinc-300' : 'text-emerald-700',
    textMuted: isDark ? 'text-zinc-400' : 'text-emerald-600',
    label: isDark ? 'text-zinc-200' : 'text-emerald-800',
    
    accent: isDark ? 'text-emerald-400' : 'text-emerald-600',
    
    btnPrimary: isDark
      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
      : 'bg-emerald-600 hover:bg-emerald-700 text-white',
    btnSecondary: isDark
      ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-50'
      : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900',
    btnDanger: isDark
      ? 'bg-red-600 hover:bg-red-700 text-white'
      : 'bg-red-500 hover:bg-red-600 text-white',
    
    critical: isDark
      ? 'bg-red-900/20 border-red-700 text-red-200'
      : 'bg-red-50 border-red-300 text-red-800',
    concerning: isDark
      ? 'bg-amber-900/20 border-amber-700 text-amber-200'
      : 'bg-amber-50 border-amber-300 text-amber-800',
    minor: isDark
      ? 'bg-blue-900/20 border-blue-700 text-blue-200'
      : 'bg-blue-50 border-blue-300 text-blue-800',
    success: isDark
      ? 'bg-emerald-900/20 border-emerald-700 text-emerald-200'
      : 'bg-emerald-50 border-emerald-300 text-emerald-800',
  };

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64String = e.target.result;
      setImagePreview(base64String);
      setImageBase64(base64String);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handlePaste = (event) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64String = e.target.result;
          setImagePreview(base64String);
          setImageBase64(base64String);
          setError('');
        };
        reader.readAsDataURL(blob);
        break;
      }
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageBase64(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target.result;
      setImagePreview(base64String);
      setImageBase64(base64String);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!imageBase64 && !plantDescription.trim()) {
      setError('Please provide either a photo or description of your plant');
      return;
    }

    setError('');
    setResults(null);

    try {
      const data = await callToolEndpoint('plant-rescue', {
        imageBase64,
        plantDescription: plantDescription.trim(),
        lightLevel,
        wateringFreq,
        location,
        ageOfOwnership: ageOfOwnership.trim(),
        hasPets,
        hasChildren,
        climateZone,
        userLocation: userLocation.trim()
      });
      setResults(data);
    } catch (err) {
      setError(err.message || 'Failed to analyze plant. Please try again.');
    }
  };

  const handleReset = () => {
    setImagePreview(null);
    setImageBase64(null);
    setPlantDescription('');
    setLightLevel('');
    setWateringFreq('');
    setLocation('');
    setAgeOfOwnership('');
    setHasPets(false);
    setHasChildren(false);
    setClimateZone('');
    setUserLocation('');
    setResults(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getSeverityStyles = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return c.critical;
      case 'concerning':
        return c.concerning;
      case 'minor':
        return c.minor;
      default:
        return c.cardAlt;
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return <AlertTriangle className="w-5 h-5" />;
      case 'concerning':
        return <AlertCircle className="w-5 h-5" />;
      case 'minor':
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <Leaf className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className={`${c.card} border rounded-xl shadow-lg p-6 transition-colors duration-200`}>
        <div className="flex items-center gap-3 mb-4">
          <div>
            <h2 className={`text-2xl font-bold ${c.text}`}>Plant Rescue 🪴</h2>
            <p className={`text-sm ${c.textMuted}`}>Diagnose and rescue your struggling plants</p>
          </div>
        </div>

        <div className={`${isDark ? 'bg-emerald-900/20 border-emerald-700' : 'bg-emerald-50 border-emerald-300'} border-l-4 rounded-r-lg p-4`}>
          <p className={`text-sm ${c.textSecondary}`}>
            Upload a photo of your plant or describe its symptoms. Get expert diagnosis and step-by-step rescue plan.
          </p>
        </div>
      </div>

      {/* Input Form */}
      <div className={`${c.card} border rounded-xl shadow-lg p-6 transition-colors duration-200`}>
        
        <h3 className={`text-lg font-semibold ${c.text} mb-4`}>Plant Information</h3>

        <div className="space-y-6">
          
          {/* Image Upload */}
          <div>
            <label className={`block text-sm font-medium ${c.label} mb-2`}>
              📸 Plant Photo (Optional but recommended)
            </label>
            
            {!imagePreview ? (
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onPaste={handlePaste}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-200 ${
                  isDark 
                    ? 'border-zinc-600 hover:border-emerald-500 bg-zinc-900/50' 
                    : 'border-emerald-300 hover:border-emerald-500 bg-emerald-50/50'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Upload className={`w-12 h-12 mx-auto mb-3 ${c.textMuted}`} />
                <p className={`text-sm ${c.text} mb-2`}>
                  Click to upload, drag & drop, or paste image
                </p>
                <p className={`text-xs ${c.textMuted}`}>
                  JPG, PNG, or WEBP • Clear photo of affected areas
                </p>
              </div>
            ) : (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Plant preview"
                  className="w-full h-64 object-contain rounded-lg border-2 border-emerald-500"
                />
                <button
                  onClick={handleRemoveImage}
                  className={`absolute top-2 right-2 ${c.btnDanger} p-2 rounded-full shadow-lg`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* OR Divider */}
          <div className="relative">
            <div className={`absolute inset-0 flex items-center`}>
              <div className={`w-full border-t ${isDark ? 'border-zinc-700' : 'border-emerald-200'}`}></div>
            </div>
            <div className="relative flex justify-center">
              <span className={`px-4 text-sm ${c.textMuted} ${isDark ? 'bg-zinc-800' : 'bg-white'}`}>
                OR describe your plant
              </span>
            </div>
          </div>

          {/* Text Description */}
          <div>
            <label htmlFor="description" className={`block text-sm font-medium ${c.label} mb-2`}>
              🪴 Plant & Symptoms Description
            </label>
            <textarea
              id="description"
              value={plantDescription}
              onChange={(e) => setPlantDescription(e.target.value)}
              placeholder="e.g., My fiddle leaf fig has yellowing leaves with brown spots. The leaves are drooping and some are falling off. I've noticed the soil stays wet for a long time..."
              className={`w-full p-4 border rounded-lg ${c.input} outline-none focus:ring-2 transition-colors duration-200`}
              rows={4}
            />
          </div>

          {/* Environmental Factors */}
          <div>
            <h4 className={`text-sm font-semibold ${c.text} mb-3`}>🌍 Environmental Conditions</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Light Level */}
              <div>
                <label htmlFor="light" className={`block text-sm font-medium ${c.label} mb-2`}>
                  ☀️ Light Level
                </label>
                <select
                  id="light"
                  value={lightLevel}
                  onChange={(e) => setLightLevel(e.target.value)}
                  className={`w-full p-3 border rounded-lg ${c.input} outline-none focus:ring-2`}
                >
                  <option value="">Select...</option>
                  <option value="full-sun">Full Sun (6+ hours direct)</option>
                  <option value="partial-shade">Partial Shade (3-6 hours)</option>
                  <option value="low-light">Low Light (indirect/shade)</option>
                </select>
              </div>

              {/* Watering Frequency */}
              <div>
                <label htmlFor="watering" className={`block text-sm font-medium ${c.label} mb-2`}>
                  💧 Watering Frequency
                </label>
                <select
                  id="watering"
                  value={wateringFreq}
                  onChange={(e) => setWateringFreq(e.target.value)}
                  className={`w-full p-3 border rounded-lg ${c.input} outline-none focus:ring-2`}
                >
                  <option value="">Select...</option>
                  <option value="daily">Daily</option>
                  <option value="few-days">Every Few Days</option>
                  <option value="weekly">Weekly</option>
                  <option value="rarely">Rarely (bi-weekly or less)</option>
                </select>
              </div>

              {/* Location */}
              <div>
                <label htmlFor="location" className={`block text-sm font-medium ${c.label} mb-2`}>
                  📍 Location
                </label>
                <select
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className={`w-full p-3 border rounded-lg ${c.input} outline-none focus:ring-2`}
                >
                  <option value="">Select...</option>
                  <option value="indoor">Indoor</option>
                  <option value="outdoor">Outdoor</option>
                  <option value="greenhouse">Greenhouse</option>
                </select>
              </div>
            </div>
          </div>

          {/* Age of Ownership */}
          <div>
            <label htmlFor="age" className={`block text-sm font-medium ${c.label} mb-2`}>
              ⏳ How long have you had this plant? (Optional)
            </label>
            <input
              id="age"
              type="text"
              value={ageOfOwnership}
              onChange={(e) => setAgeOfOwnership(e.target.value)}
              placeholder="e.g., 2 months, 1 year, just bought it"
              className={`w-full p-3 border rounded-lg ${c.input} outline-none focus:ring-2`}
            />
          </div>

          {/* Safety Checkboxes */}
          <div>
            <h4 className={`text-sm font-semibold ${c.text} mb-3`}>⚠️ Household Safety</h4>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasPets}
                  onChange={(e) => setHasPets(e.target.checked)}
                  className="w-4 h-4 rounded border-emerald-400 text-emerald-600 focus:ring-emerald-500"
                />
                <span className={`text-sm ${c.text}`}>🐾 I have pets</span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasChildren}
                  onChange={(e) => setHasChildren(e.target.checked)}
                  className="w-4 h-4 rounded border-emerald-400 text-emerald-600 focus:ring-emerald-500"
                />
                <span className={`text-sm ${c.text}`}>👶 I have children</span>
              </label>
            </div>
            <p className={`text-xs ${c.textMuted} mt-2`}>
              We'll warn you if the plant is toxic to pets or children
            </p>
          </div>

          {/* Climate Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="climate" className={`block text-sm font-medium ${c.label} mb-2`}>
                🌡️ Climate Zone (Optional)
              </label>
              <select
                id="climate"
                value={climateZone}
                onChange={(e) => setClimateZone(e.target.value)}
                className={`w-full p-3 border rounded-lg ${c.input} outline-none focus:ring-2`}
              >
                <option value="">Select zone...</option>
                <option value="tropical">Tropical (Year-round warm)</option>
                <option value="subtropical">Subtropical (Hot summers, mild winters)</option>
                <option value="temperate">Temperate (Four distinct seasons)</option>
                <option value="cold">Cold (Long cold winters)</option>
                <option value="arid">Arid/Desert (Low rainfall)</option>
              </select>
            </div>

            <div>
              <label htmlFor="userLocation" className={`block text-sm font-medium ${c.label} mb-2`}>
                📍 General Location (Optional)
              </label>
              <input
                id="userLocation"
                type="text"
                value={userLocation}
                onChange={(e) => setUserLocation(e.target.value)}
                placeholder="e.g., Southern California, UK, Australia"
                className={`w-full p-3 border rounded-lg ${c.input} outline-none focus:ring-2`}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleAnalyze}
              disabled={loading || (!imageBase64 && !plantDescription.trim())}
              className={`flex-1 ${c.btnPrimary} disabled:opacity-50 disabled:cursor-not-allowed font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing Plant...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Diagnose Plant
                </>
              )}
            </button>

            {results && (
              <button
                onClick={handleReset}
                className={`px-6 py-3 border-2 ${isDark ? 'border-zinc-600 hover:border-zinc-500 text-zinc-300' : 'border-emerald-300 hover:border-emerald-400 text-emerald-700'} font-medium rounded-lg`}
              >
                New Analysis
              </button>
            )}
          </div>

          {error && (
            <div className={`${c.critical} border rounded-lg p-4 flex items-start gap-3`} role="alert">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      {results && (
        <div className="space-y-6">
          
          {/* Toxicity Warning (if applicable) */}
          {results.toxicity_warning && (
            <div className={`${isDark ? 'bg-red-900/30 border-red-600' : 'bg-red-50 border-red-500'} border-4 rounded-xl p-6 animate-pulse`}>
              <div className="flex items-start gap-4">
                <AlertTriangle className={`w-8 h-8 flex-shrink-0 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                <div>
                  <h3 className={`text-xl font-bold ${isDark ? 'text-red-200' : 'text-red-900'} mb-2`}>
                    ⚠️ TOXICITY WARNING
                  </h3>
                  <p className={`font-semibold ${isDark ? 'text-red-300' : 'text-red-800'} mb-3`}>
                    {results.toxicity_warning.level === 'highly-toxic' && '🚨 HIGHLY TOXIC - '}
                    {results.toxicity_warning.level === 'toxic' && '⚠️ TOXIC - '}
                    {results.toxicity_warning.level === 'mildly-toxic' && '⚡ MILDLY TOXIC - '}
                    This plant is dangerous for {results.toxicity_warning.dangerous_for.join(' and ')}
                  </p>
                  <div className={`text-sm ${isDark ? 'text-red-200' : 'text-red-900'} space-y-2`}>
                    <p><strong>Symptoms if ingested:</strong> {results.toxicity_warning.symptoms}</p>
                    <p><strong>Safety measures:</strong> {results.toxicity_warning.safety_measures}</p>
                    {results.toxicity_warning.alternative_plants && (
                      <p><strong>Safe alternatives:</strong> {results.toxicity_warning.alternative_plants}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Plant Identification */}
          {results.plant_identification && (
            <div className={`${c.card} border rounded-xl p-6`}>
              <h3 className={`text-lg font-bold ${c.text} mb-4 flex items-center gap-2`}>
                <Camera className="w-5 h-5" />
                Plant Identification
              </h3>
              
              <div className="space-y-3">
                <div>
                  <span className={`text-sm ${c.textMuted}`}>Most Likely Species: </span>
                  <span className={`text-lg font-semibold ${c.text}`}>
                    {results.plant_identification.species}
                  </span>
                </div>
                
                {results.plant_identification.common_name && (
                  <div>
                    <span className={`text-sm ${c.textMuted}`}>Common Name: </span>
                    <span className={`font-medium ${c.text}`}>
                      {results.plant_identification.common_name}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${c.textMuted}`}>Confidence: </span>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    results.plant_identification.confidence === 'high' 
                      ? c.success
                      : results.plant_identification.confidence === 'medium'
                      ? c.concerning
                      : c.critical
                  }`}>
                    {results.plant_identification.confidence_score 
                      ? `${results.plant_identification.confidence_score}%`
                      : results.plant_identification.confidence?.toUpperCase()}
                  </span>
                </div>

                {/* Alternative Species (shown when confidence is low) */}
                {results.plant_identification.alternative_species && results.plant_identification.alternative_species.length > 0 && (
                  <div className={`mt-4 p-4 rounded-lg border ${isDark ? 'bg-amber-900/20 border-amber-700' : 'bg-amber-50 border-amber-300'}`}>
                    <p className={`text-sm font-semibold ${isDark ? 'text-amber-200' : 'text-amber-900'} mb-2`}>
                      ⚠️ Uncertain Identification - Could Also Be:
                    </p>
                    <ul className={`text-sm ${isDark ? 'text-amber-300' : 'text-amber-800'} space-y-1`}>
                      {results.plant_identification.alternative_species.map((alt, idx) => (
                        <li key={idx}>
                          • <strong>{alt.species}</strong> {alt.common_name && `(${alt.common_name})`} - {alt.likelihood}% likely
                        </li>
                      ))}
                    </ul>
                    <p className={`text-xs ${isDark ? 'text-amber-400' : 'text-amber-700'} mt-2`}>
                      The advice below covers all possibilities. Confirm species before taking critical actions.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Diagnosis */}
          {results.diagnosis && (
            <div className={`${getSeverityStyles(results.diagnosis.severity)} border-l-4 rounded-r-lg p-6`}>
              <div className="flex items-start gap-3 mb-4">
                {getSeverityIcon(results.diagnosis.severity)}
                <div>
                  <h3 className="text-lg font-bold mb-1">
                    Diagnosis: {results.diagnosis.severity?.toUpperCase()}
                  </h3>
                  <p className="text-sm font-semibold">
                    Primary Problem: {results.diagnosis.primary_problem}
                  </p>
                </div>
              </div>
              
              {results.diagnosis.secondary_issues && results.diagnosis.secondary_issues.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-semibold mb-2">Secondary Issues:</p>
                  <ul className="text-sm space-y-1">
                    {results.diagnosis.secondary_issues.map((issue, idx) => (
                      <li key={idx}>• {issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              {results.is_saveable !== undefined && (
                <div className={`mt-4 p-3 rounded ${
                  results.is_saveable 
                    ? isDark ? 'bg-emerald-900/30' : 'bg-emerald-100'
                    : isDark ? 'bg-red-900/30' : 'bg-red-100'
                }`}>
                  <p className="text-sm font-bold flex items-center gap-2">
                    {results.is_saveable ? (
                      <>
                        <Heart className="w-4 h-4" />
                        Good news: This plant is saveable!
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4" />
                        This plant may be beyond saving
                      </>
                    )}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Action Plan */}
          {results.action_plan && results.action_plan.length > 0 && (
            <div className={`${c.card} border rounded-xl p-6`}>
              <h3 className={`text-lg font-bold ${c.text} mb-4 flex items-center gap-2`}>
                <CheckCircle className="w-5 h-5" />
                Rescue Action Plan
              </h3>
              
              <div className="space-y-4">
                {results.action_plan.map((action, idx) => (
                  <div
                    key={idx}
                    className={`border-l-4 ${
                      action.priority === 1 
                        ? 'border-red-500' 
                        : action.priority === 2 
                        ? 'border-orange-500' 
                        : 'border-blue-500'
                    } ${c.cardAlt} border rounded-r-lg p-4`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          action.priority === 1 
                            ? c.critical
                            : action.priority === 2 
                            ? c.concerning 
                            : c.minor
                        }`}>
                          PRIORITY {action.priority}
                        </span>
                        <span className={`text-xs ${c.textMuted} flex items-center gap-1`}>
                          <Clock className="w-3 h-3" />
                          {action.timing}
                        </span>
                      </div>
                    </div>
                    
                    <h4 className={`font-bold ${c.text} mb-2`}>{action.action}</h4>
                    
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-semibold">Why: </span>
                        <span className={c.textSecondary}>{action.why}</span>
                      </div>
                      
                      <div>
                        <span className="font-semibold">How: </span>
                        <span className={c.textSecondary}>{action.how}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {results.recovery_timeline && (
                <div className={`mt-4 p-4 rounded ${isDark ? 'bg-blue-900/20 border border-blue-700' : 'bg-blue-50 border border-blue-300'}`}>
                  <p className={`text-sm font-semibold ${isDark ? 'text-blue-200' : 'text-blue-900'} flex items-center gap-2`}>
                    <Calendar className="w-4 h-4" />
                    Recovery Timeline: {results.recovery_timeline}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Environmental Adjustments */}
          {results.environmental_adjustments && (
            <div className={`${c.card} border rounded-xl p-6`}>
              <h3 className={`text-lg font-bold ${c.text} mb-4 flex items-center gap-2`}>
                <Sun className="w-5 h-5" />
                Environmental Adjustments
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {results.environmental_adjustments.light && (
                  <div className={`${c.cardAlt} border rounded-lg p-4`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Sun className="w-4 h-4" />
                      <span className="font-semibold text-sm">Light</span>
                    </div>
                    <p className="text-sm">{results.environmental_adjustments.light}</p>
                  </div>
                )}
                
                {results.environmental_adjustments.water && (
                  <div className={`${c.cardAlt} border rounded-lg p-4`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Droplets className="w-4 h-4" />
                      <span className="font-semibold text-sm">Water</span>
                    </div>
                    <p className="text-sm">{results.environmental_adjustments.water}</p>
                  </div>
                )}
                
                {results.environmental_adjustments.location && (
                  <div className={`${c.cardAlt} border rounded-lg p-4`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Leaf className="w-4 h-4" />
                      <span className="font-semibold text-sm">Location</span>
                    </div>
                    <p className="text-sm">{results.environmental_adjustments.location}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Prevention Tips */}
          {results.prevention_tips && results.prevention_tips.length > 0 && (
            <div className={`${c.success} border-l-4 rounded-r-lg p-6`}>
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Prevention Tips for the Future
              </h3>
              
              <ul className="text-sm space-y-2">
                {results.prevention_tips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-600">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Climate-Specific Recommendations */}
          {results.climate_recommendations && (
            <div className={`${isDark ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-300'} border-l-4 rounded-r-lg p-6`}>
              <h3 className={`text-lg font-bold ${isDark ? 'text-blue-200' : 'text-blue-900'} mb-3 flex items-center gap-2`}>
                <Sun className="w-5 h-5" />
                Climate-Specific Advice
              </h3>
              
              {results.climate_recommendations.seasonal_note && (
                <div className="mb-3">
                  <p className={`text-sm font-semibold ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>
                    🌍 Seasonal Note: {results.climate_recommendations.seasonal_note}
                  </p>
                </div>
              )}
              
              {results.climate_recommendations.regional_tips && results.climate_recommendations.regional_tips.length > 0 && (
                <ul className={`text-sm ${isDark ? 'text-blue-200' : 'text-blue-900'} space-y-2`}>
                  {results.climate_recommendations.regional_tips.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span>•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PlantRescue;
