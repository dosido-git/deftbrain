import React, { useState } from 'react';
import { Dog, Cat, Bird, Rabbit, Heart, Loader2, AlertTriangle, CheckCircle, Camera, Clock, Activity, MessageSquare, BookOpen, HelpCircle, PawPrint, TrendingUp, Sparkles, AlertOctagon, FileText, Video, Calendar } from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';

const PetWeirdnessDecoder = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Form state
  const [petType, setPetType] = useState('Dog');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [behavior, setBehavior] = useState('');
  const [duration, setDuration] = useState('Just started');
  const [frequency, setFrequency] = useState('Occasionally');
  const [otherChanges, setOtherChanges] = useState({
    eating: false,
    energy: false,
    bathroom: false,
    sleep: false,
    mood: false
  });

  // Results state
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [showDiary, setShowDiary] = useState(false);

  const petTypes = [
    { name: 'Dog', icon: Dog },
    { name: 'Cat', icon: Cat },
    { name: 'Bird', icon: Bird },
    { name: 'Rabbit', icon: Rabbit },
    { name: 'Other', icon: PawPrint }
  ];

  const durationOptions = [
    'Just started (today)',
    'Few days',
    'About a week',
    'Weeks',
    'Months',
    'As long as I can remember'
  ];

  const frequencyOptions = [
    'Constant',
    'Multiple times daily',
    'Once or twice a day',
    'Occasionally',
    'Rare (once a week or less)'
  ];

  // Theme-aware colors
  const c = {
    bg: isDark ? 'bg-zinc-900' : 'bg-gradient-to-br from-yellow-50 to-amber-50',
    card: isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-amber-200',
    cardAlt: isDark ? 'bg-zinc-700 border-zinc-600' : 'bg-amber-50 border-amber-200',
    
    input: isDark 
      ? 'bg-zinc-900 border-zinc-700 text-zinc-50 placeholder:text-zinc-500 focus:border-amber-500 focus:ring-amber-500/20'
      : 'bg-white border-amber-300 text-amber-900 placeholder:text-amber-400 focus:border-amber-600 focus:ring-amber-100',
    
    text: isDark ? 'text-zinc-50' : 'text-amber-900',
    textSecondary: isDark ? 'text-zinc-400' : 'text-amber-700',
    textMuted: isDark ? 'text-zinc-500' : 'text-amber-600',
    label: isDark ? 'text-zinc-300' : 'text-amber-800',
    
    accent: isDark ? 'text-amber-400' : 'text-amber-600',
    
    btnPrimary: isDark
      ? 'bg-amber-600 hover:bg-amber-700 text-white'
      : 'bg-amber-600 hover:bg-amber-700 text-white',
    btnSecondary: isDark
      ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-50'
      : 'bg-amber-100 hover:bg-amber-200 text-amber-900',
    btnOutline: isDark
      ? 'border-zinc-600 hover:border-zinc-500 text-zinc-300'
      : 'border-amber-300 hover:border-amber-400 text-amber-700',
    
    danger: isDark
      ? 'bg-red-900/20 border-red-700 text-red-200'
      : 'bg-red-50 border-red-300 text-red-800',
    success: isDark
      ? 'bg-emerald-900/20 border-emerald-700 text-emerald-200'
      : 'bg-emerald-50 border-emerald-300 text-emerald-800',
    warning: isDark
      ? 'bg-amber-900/20 border-amber-700 text-amber-200'
      : 'bg-amber-50 border-amber-300 text-amber-800',
    info: isDark
      ? 'bg-blue-900/20 border-blue-700 text-blue-200'
      : 'bg-blue-50 border-blue-200 text-blue-900',
    emergency: isDark
      ? 'bg-red-900/40 border-red-600 text-red-100'
      : 'bg-red-100 border-red-400 text-red-900',
  };

  const handleAnalyze = async () => {
    if (!petType) {
      setError('Please select a pet type');
      return;
    }

    if (!age || age < 0 || age > 50) {
      setError('Please enter a valid age');
      return;
    }

    if (!behavior.trim() || behavior.trim().length < 20) {
      setError('Please describe the behavior in detail (at least 20 characters)');
      return;
    }

    setError('');
    setResults(null);

    try {
      const selectedChanges = Object.keys(otherChanges).filter(key => otherChanges[key]);
      
      const data = await callToolEndpoint('pet-weirdness-decoder', {
        petType,
        breed: breed.trim(),
        age: parseInt(age),
        behavior: behavior.trim(),
        duration,
        frequency,
        otherChanges: selectedChanges
      });
      setResults(data);
    } catch (err) {
      setError(err.message || 'Failed to analyze behavior. Please try again.');
    }
  };

  const handleOtherChangesToggle = (change) => {
    setOtherChanges({
      ...otherChanges,
      [change]: !otherChanges[change]
    });
  };

  const getUrgencyColor = (level) => {
    switch(level) {
      case 'not_urgent':
        return c.success;
      case 'monitor':
        return c.info;
      case 'vet_soon':
        return c.warning;
      case 'vet_now':
        return c.emergency;
      default:
        return c.info;
    }
  };

  const getUrgencyLabel = (level) => {
    switch(level) {
      case 'not_urgent':
        return 'Quirky & Normal';
      case 'monitor':
        return 'Worth Monitoring';
      case 'vet_soon':
        return 'Vet Consultation Recommended';
      case 'vet_now':
        return 'CALL VET NOW';
      default:
        return 'Unknown';
    }
  };

  const handleReset = () => {
    setPetType('Dog');
    setBreed('');
    setAge('');
    setBehavior('');
    setDuration('Just started');
    setFrequency('Occasionally');
    setOtherChanges({
      eating: false,
      energy: false,
      bathroom: false,
      sleep: false,
      mood: false
    });
    setResults(null);
    setError('');
    setShowDiary(false);
  };

  const generateBehaviorDiary = () => {
    const today = new Date().toISOString().split('T')[0];
    return `BEHAVIOR DIARY - ${petType} - ${breed || 'Mixed breed'} - ${age} years

Behavior: ${behavior}

DATE | TIME | DURATION | WHAT HAPPENED | TRIGGERS | OTHER NOTES
-----|------|----------|---------------|----------|-------------
${today} |      |          |               |          |
${today} |      |          |               |          |
${today} |      |          |               |          |

FREQUENCY TRACKING:
Week 1: ___ times
Week 2: ___ times  
Week 3: ___ times
Week 4: ___ times

PATTERNS NOTICED:
- Time of day: 
- Situation/trigger:
- Before behavior:
- After behavior:

OTHER CHANGES:
- Eating: ${otherChanges.eating ? 'YES - describe:' : 'No changes'}
- Energy: ${otherChanges.energy ? 'YES - describe:' : 'No changes'}
- Bathroom: ${otherChanges.bathroom ? 'YES - describe:' : 'No changes'}
- Sleep: ${otherChanges.sleep ? 'YES - describe:' : 'No changes'}
- Mood: ${otherChanges.mood ? 'YES - describe:' : 'No changes'}

VET APPOINTMENT DATE: ___________
`;
  };

  const copyDiary = async () => {
    try {
      await navigator.clipboard.writeText(generateBehaviorDiary());
      setShowDiary(false);
      alert('Behavior diary template copied to clipboard!');
    } catch (err) {
      alert('Failed to copy. Please select and copy manually.');
    }
  };

  const exampleBehavior = "My dog has started spinning in circles before lying down. She does it 3-4 times before settling into her bed. She's always done this but it seems more frequent lately. Otherwise she's eating normally and seems happy.";

  return (
    <div className="space-y-6">
      
      {/* EMERGENCY CRITERIA - VERY PROMINENT */}
      <div className={`${c.emergency} border-4 rounded-xl p-6 transition-colors duration-200 shadow-lg`}>
        <div className="flex items-start gap-4">
          <AlertOctagon className={`w-10 h-10 flex-shrink-0 mt-1 ${isDark ? 'text-red-300' : 'text-red-700'} animate-pulse`} />
          <div className="flex-1">
            <h2 className={`text-2xl font-bold mb-3 ${isDark ? 'text-red-100' : 'text-red-900'}`}>
              🚨 CALL VET IMMEDIATELY IF YOU SEE:
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <ul className="text-sm space-y-2 font-semibold">
                <li className="flex items-start gap-2">
                  <span className="text-red-500">●</span>
                  <span>Difficulty breathing or choking</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500">●</span>
                  <span>Seizures or collapse</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500">●</span>
                  <span>Bloated stomach + retching (esp. large dogs)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500">●</span>
                  <span>Bleeding that won't stop</span>
                </li>
              </ul>
              <ul className="text-sm space-y-2 font-semibold">
                <li className="flex items-start gap-2">
                  <span className="text-red-500">●</span>
                  <span>Suspected poisoning/toxin ingestion</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500">●</span>
                  <span>Unable to urinate or defecate</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500">●</span>
                  <span>Unconsciousness or extreme lethargy</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500">●</span>
                  <span>Pale/white gums or severe pain</span>
                </li>
              </ul>
            </div>
            <p className={`text-sm mt-4 font-bold ${isDark ? 'text-red-200' : 'text-red-800'}`}>
              Don't wait - go to emergency vet or call your regular vet's emergency line NOW.
            </p>
          </div>
        </div>
      </div>

      {/* Veterinary Disclaimer */}
      <div className={`${c.warning} border-l-4 rounded-r-lg p-5 transition-colors duration-200`}>
        <div className="flex items-start gap-3">
          <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDark ? 'text-amber-300' : 'text-amber-600'}`} />
          <div>
            <h3 className={`font-bold mb-1 ${c.text}`}>Important Veterinary Disclaimer</h3>
            <p className={`text-sm ${c.textSecondary}`}>
              This tool provides educational information only and is <strong>NOT</strong> a substitute for 
              professional veterinary care. When in doubt, always consult your vet. This tool helps you 
              organize observations and assess urgency, but your vet's expertise is irreplaceable. 💚
            </p>
          </div>
        </div>
      </div>

      {/* Input Form */}
      <div className={`${c.card} border rounded-xl shadow-lg p-6 transition-colors duration-200`}>
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className={`p-3 rounded-lg ${isDark ? 'bg-amber-900/30' : 'bg-amber-100'}`}>
            <PawPrint className={`w-6 h-6 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
          </div>
          <div>
            <h2 className={`text-xl font-bold ${c.text}`}>Pet Weirdness Decoder V2</h2>
            <p className={`text-sm ${c.textMuted}`}>Is it quirky or concerning? Let's find out! 🐾</p>
          </div>
        </div>

        <div className="space-y-6">
          
          {/* Pet Type Selection */}
          <div>
            <label className={`block text-sm font-medium ${c.label} mb-3`}>
              What kind of pet?
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {petTypes.map(({ name, icon: Icon }) => (
                <button
                  key={name}
                  onClick={() => setPetType(name)}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                    petType === name
                      ? isDark 
                        ? 'border-amber-500 bg-amber-900/30' 
                        : 'border-amber-600 bg-amber-100'
                      : isDark
                        ? 'border-zinc-700 hover:border-zinc-600'
                        : 'border-amber-200 hover:border-amber-300'
                  }`}
                >
                  <Icon className={`w-6 h-6 ${petType === name ? c.accent : c.textMuted}`} />
                  <span className={`text-sm font-medium ${petType === name ? c.accent : c.textMuted}`}>
                    {name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Breed and Age */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="breed" className={`block text-sm font-medium ${c.label} mb-2`}>
                Breed (helps identify breed-specific behaviors)
              </label>
              <input
                id="breed"
                type="text"
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                placeholder={`e.g., ${petType === 'Dog' ? 'Golden Retriever, Husky, mixed' : petType === 'Cat' ? 'Siamese, Maine Coon, mixed' : petType === 'Bird' ? 'Cockatiel, Parrot' : 'Mixed breed'}`}
                className={`w-full p-3 border rounded-lg ${c.input} outline-none focus:ring-2 transition-colors duration-200`}
              />
              <p className={`text-xs ${c.textMuted} mt-1`}>
                Helps identify breed-typical behaviors and genetic predispositions
              </p>
            </div>

            <div>
              <label htmlFor="age" className={`block text-sm font-medium ${c.label} mb-2`}>
                Age (years) - important for life stage context
              </label>
              <input
                id="age"
                type="number"
                min="0"
                max="50"
                step="0.5"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g., 3"
                className={`w-full p-3 border rounded-lg ${c.input} outline-none focus:ring-2 transition-colors duration-200`}
              />
              <p className={`text-xs ${c.textMuted} mt-1`}>
                Puppy/kitten vs adult vs senior behaviors differ greatly
              </p>
            </div>
          </div>

          {/* Behavior Description */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="behavior" className={`block text-sm font-medium ${c.label}`}>
                Describe the weird behavior in detail
              </label>
              <button
                onClick={() => setBehavior(exampleBehavior)}
                className={`text-xs ${c.accent} hover:underline`}
              >
                Try example
              </button>
            </div>
            <textarea
              id="behavior"
              value={behavior}
              onChange={(e) => setBehavior(e.target.value)}
              placeholder="Be specific! What exactly happens? When? Any triggers? What happens before/after? How does your pet seem during it? Any patterns?"
              className={`w-full p-4 border rounded-lg ${c.input} outline-none focus:ring-2 transition-colors duration-200`}
              rows={6}
            />
            <p className={`text-xs ${c.textMuted} mt-1`}>
              💡 Good details help: exact actions, timing, triggers, duration, your pet's mood, context
            </p>
          </div>

          {/* Duration and Frequency */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="duration" className={`block text-sm font-medium ${c.label} mb-2`}>
                How long has this been happening?
              </label>
              <select
                id="duration"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className={`w-full p-3 border rounded-lg ${c.input} outline-none focus:ring-2 transition-colors duration-200`}
              >
                {durationOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="frequency" className={`block text-sm font-medium ${c.label} mb-2`}>
                How often does it happen?
              </label>
              <select
                id="frequency"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className={`w-full p-3 border rounded-lg ${c.input} outline-none focus:ring-2 transition-colors duration-200`}
              >
                {frequencyOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Other Changes */}
          <div>
            <label className={`block text-sm font-medium ${c.label} mb-3`}>
              Have you noticed any other changes? (Select all that apply)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { key: 'eating', label: 'Eating differently' },
                { key: 'energy', label: 'Energy level changed' },
                { key: 'bathroom', label: 'Bathroom habits changed' },
                { key: 'sleep', label: 'Sleep pattern changed' },
                { key: 'mood', label: 'Mood/personality changed' }
              ].map(({ key, label }) => (
                <label
                  key={key}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 flex items-center gap-2 ${
                    otherChanges[key]
                      ? isDark 
                        ? 'border-amber-500 bg-amber-900/30' 
                        : 'border-amber-600 bg-amber-100'
                      : isDark
                        ? 'border-zinc-700 hover:border-zinc-600'
                        : 'border-amber-200 hover:border-amber-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={otherChanges[key]}
                    onChange={() => handleOtherChangesToggle(key)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className={`text-sm ${otherChanges[key] ? c.accent : c.textMuted}`}>
                    {label}
                  </span>
                </label>
              ))}
            </div>
            <p className={`text-xs ${c.textMuted} mt-2`}>
              ⚠️ Multiple changes usually mean higher urgency - your pet is telling you something
            </p>
          </div>

          {/* Analyze Button */}
          <div className="flex gap-3">
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className={`flex-1 ${c.btnPrimary} disabled:opacity-50 disabled:cursor-not-allowed font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing behavior...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Decode This Weirdness
                </>
              )}
            </button>

            {results && (
              <button
                onClick={handleReset}
                className={`px-6 py-3 border-2 ${c.btnOutline} font-medium rounded-lg transition-all duration-200`}
              >
                New Behavior
              </button>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className={`p-4 ${c.danger} border rounded-lg flex items-start gap-3 transition-colors duration-200`} role="alert">
              <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Results Display */}
      {results && (
        <div className="space-y-6">
          
          {/* Behavior Analysis Summary */}
          {results.behavior_analysis && (
            <div className={`${getUrgencyColor(results.behavior_analysis.urgency_level)} border-l-4 rounded-r-lg p-6 transition-colors duration-200 shadow-lg`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-4xl">{results.behavior_analysis.urgency_emoji}</span>
                    <div>
                      <h3 className="text-2xl font-bold">
                        {getUrgencyLabel(results.behavior_analysis.urgency_level)}
                      </h3>
                      <p className="text-sm opacity-75 capitalize">
                        {results.behavior_analysis.behavior_category?.replace(/_/g, ' ')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Breed-Specific Intelligence */}
          {results.breed_specific_info && (
            <div className={`${c.info} border-l-4 rounded-r-lg p-5 transition-colors duration-200`}>
              <h3 className={`font-bold mb-3 flex items-center gap-2`}>
                <Dog className="w-5 h-5" />
                Breed-Specific Intelligence
              </h3>
              
              {results.breed_specific_info.is_breed_typical && (
                <div className="mb-3">
                  <p className={`text-sm font-semibold mb-1 ${c.text}`}>This is typical for {breed || petType}s!</p>
                  <p className="text-sm">{results.breed_specific_info.breed_explanation}</p>
                </div>
              )}

              {results.breed_specific_info.genetic_predispositions && results.breed_specific_info.genetic_predispositions.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm font-semibold mb-2">Genetic predispositions to be aware of:</p>
                  <ul className="text-sm space-y-1">
                    {results.breed_specific_info.genetic_predispositions.map((item, idx) => (
                      <li key={idx}>• {item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {results.breed_specific_info.common_breed_behaviors && results.breed_specific_info.common_breed_behaviors.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2">Common {breed || petType} behaviors:</p>
                  <ul className="text-sm space-y-1">
                    {results.breed_specific_info.common_breed_behaviors.map((behavior, idx) => (
                      <li key={idx}>• {behavior}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Life Stage Context */}
          {results.life_stage_context && (
            <div className={`${c.success} border-l-4 rounded-r-lg p-5 transition-colors duration-200`}>
              <h3 className={`font-bold mb-3 flex items-center gap-2`}>
                <Clock className="w-5 h-5" />
                Life Stage Context
              </h3>
              
              <div className="mb-3">
                <p className={`text-sm font-semibold ${c.text}`}>
                  {results.life_stage_context.life_stage} ({age} years old)
                </p>
                <p className="text-sm mt-1">{results.life_stage_context.stage_explanation}</p>
              </div>

              {results.life_stage_context.age_appropriate && (
                <div className={`p-3 rounded ${isDark ? 'bg-emerald-900/20' : 'bg-emerald-100'}`}>
                  <p className="text-sm font-semibold mb-1">✓ Age-Appropriate Behavior</p>
                  <p className="text-sm">{results.life_stage_context.age_context}</p>
                </div>
              )}
            </div>
          )}

          {/* Most Likely Explanation */}
          {results.most_likely_explanation && (
            <div className={`${c.card} border rounded-xl p-6 transition-colors duration-200`}>
              <h3 className={`text-lg font-bold ${c.text} mb-4 flex items-center gap-2`}>
                <CheckCircle className="w-6 h-6 text-emerald-500" />
                Most Likely Explanation
              </h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className={`text-sm font-semibold ${c.label} mb-2`}>What it is:</h4>
                  <p className={`${c.textSecondary}`}>{results.most_likely_explanation.what_it_is}</p>
                </div>

                <div>
                  <h4 className={`text-sm font-semibold ${c.label} mb-2`}>Why they do it:</h4>
                  <p className={`${c.textSecondary}`}>{results.most_likely_explanation.why_they_do_it}</p>
                </div>
              </div>
            </div>
          )}

          {/* Vet Visit Preparation */}
          {results.vet_visit_prep && (results.behavior_analysis?.urgency_level === 'vet_soon' || results.behavior_analysis?.urgency_level === 'vet_now') && (
            <div className={`${c.warning} border rounded-xl p-6 transition-colors duration-200`}>
              <h3 className={`text-lg font-bold mb-4 flex items-center gap-2`}>
                <MessageSquare className="w-6 h-6" />
                Vet Visit Preparation
              </h3>

              {results.vet_visit_prep.questions_to_ask && results.vet_visit_prep.questions_to_ask.length > 0 && (
                <div className="mb-4">
                  <p className={`text-sm font-semibold ${c.label} mb-2 flex items-center gap-2`}>
                    <HelpCircle className="w-4 h-4" />
                    Questions to ask your vet:
                  </p>
                  <ul className={`text-sm ${c.textSecondary} space-y-2`}>
                    {results.vet_visit_prep.questions_to_ask.map((question, idx) => (
                      <li key={idx} className="pl-2">• {question}</li>
                    ))}
                  </ul>
                </div>
              )}

              {results.vet_visit_prep.what_to_observe && results.vet_visit_prep.what_to_observe.length > 0 && (
                <div className="mb-4">
                  <p className={`text-sm font-semibold ${c.label} mb-2 flex items-center gap-2`}>
                    <Activity className="w-4 h-4" />
                    What to observe before visit:
                  </p>
                  <ul className={`text-sm ${c.textSecondary} space-y-1`}>
                    {results.vet_visit_prep.what_to_observe.map((item, idx) => (
                      <li key={idx}>• {item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {results.vet_visit_prep.documentation_tips && (
                <div className={`p-4 rounded ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                  <p className={`text-sm font-semibold ${c.label} mb-2 flex items-center gap-2`}>
                    <Camera className="w-4 h-4" />
                    How to document:
                  </p>
                  <p className="text-sm">{results.vet_visit_prep.documentation_tips}</p>
                  
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => setShowDiary(true)}
                      className={`text-xs ${c.btnSecondary} px-3 py-2 rounded flex items-center gap-2`}
                    >
                      <FileText className="w-3 h-3" />
                      Get Behavior Diary Template
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* When to Worry */}
          {results.when_to_worry && (
            <div className={`${c.danger} border-l-4 rounded-r-lg p-5 transition-colors duration-200`}>
              <h3 className={`font-bold mb-3 ${c.text} flex items-center gap-2`}>
                <AlertTriangle className="w-5 h-5" />
                When to Worry - Call Vet If You See:
              </h3>
              {results.when_to_worry.red_flags && results.when_to_worry.red_flags.length > 0 && (
                <div className="mb-4">
                  <ul className="text-sm space-y-2 font-semibold">
                    {results.when_to_worry.red_flags.map((flag, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-red-500">🚨</span>
                        <span>{flag}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {results.when_to_worry.timeline && (
                <div className={`p-3 rounded ${isDark ? 'bg-red-900/30' : 'bg-red-100'}`}>
                  <p className="text-sm font-semibold mb-1">⏰ Timeline:</p>
                  <p className="text-sm">{results.when_to_worry.timeline}</p>
                </div>
              )}
            </div>
          )}

          {/* If It's Just Quirky */}
          {results.if_its_just_quirky && results.behavior_analysis?.urgency_level === 'not_urgent' && (
            <div className={`${c.success} border rounded-lg p-5 transition-colors duration-200`}>
              <h3 className={`font-bold mb-3 flex items-center gap-2`}>
                <Heart className="w-5 h-5" />
                If It's Just a Quirk (Good News!)
              </h3>
              
              {results.if_its_just_quirky.why_normal && (
                <div className="mb-4">
                  <p className="text-sm font-semibold mb-1">Why this is normal:</p>
                  <p className="text-sm">{results.if_its_just_quirky.why_normal}</p>
                </div>
              )}

              {results.if_its_just_quirky.enrichment_suggestions && results.if_its_just_quirky.enrichment_suggestions.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-semibold mb-2">Enrichment ideas:</p>
                  <ul className="text-sm space-y-1">
                    {results.if_its_just_quirky.enrichment_suggestions.map((suggestion, idx) => (
                      <li key={idx}>• {suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}

              {results.if_its_just_quirky.enjoy_it && (
                <div className={`p-3 rounded ${isDark ? 'bg-emerald-900/20' : 'bg-emerald-100'}`}>
                  <p className="text-sm font-semibold mb-1">💚 Enjoy the quirk:</p>
                  <p className="text-sm">{results.if_its_just_quirky.enjoy_it}</p>
                </div>
              )}
            </div>
          )}

          {/* Other Possibilities */}
          {results.other_possibilities && results.other_possibilities.length > 0 && (
            <div className={`${c.card} border rounded-xl p-6 transition-colors duration-200`}>
              <h3 className={`text-lg font-bold ${c.text} mb-4 flex items-center gap-2`}>
                <HelpCircle className="w-6 h-6" />
                Other Possibilities to Consider
              </h3>
              <div className="space-y-4">
                {results.other_possibilities.map((possibility, idx) => (
                  <div key={idx} className={`p-4 rounded-lg ${isDark ? 'bg-zinc-700' : 'bg-amber-50'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className={`font-semibold ${c.text}`}>{possibility.explanation}</h4>
                      <span className={`text-xs px-2 py-1 rounded font-semibold ${
                        possibility.likelihood === 'high' 
                          ? 'bg-red-100 text-red-700' 
                          : possibility.likelihood === 'medium'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {possibility.likelihood} likelihood
                      </span>
                    </div>
                    {possibility.signs_that_suggest_this && possibility.signs_that_suggest_this.length > 0 && (
                      <div>
                        <p className={`text-xs font-semibold ${c.label} mb-1`}>Signs that suggest this:</p>
                        <ul className={`text-sm ${c.textSecondary} space-y-1`}>
                          {possibility.signs_that_suggest_this.map((sign, signIdx) => (
                            <li key={signIdx}>• {sign}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Behavioral Modification */}
          {results.behavioral_modification && results.behavioral_modification.length > 0 && (
            <div className={`${c.card} border rounded-xl p-6 transition-colors duration-200`}>
              <h3 className={`text-lg font-bold ${c.text} mb-4 flex items-center gap-2`}>
                <TrendingUp className="w-6 h-6" />
                Can You Change This Behavior?
              </h3>
              {results.behavioral_modification.map((mod, idx) => (
                <div key={idx} className="space-y-3">
                  {mod.if_you_want_to_change_it && (
                    <div>
                      <p className={`text-sm font-semibold ${c.label} mb-1`}>Is it possible/advisable?</p>
                      <p className={`text-sm ${c.textSecondary}`}>{mod.if_you_want_to_change_it}</p>
                    </div>
                  )}
                  {mod.how && (
                    <div>
                      <p className={`text-sm font-semibold ${c.label} mb-1`}>How to approach it:</p>
                      <p className={`text-sm ${c.textSecondary}`}>{mod.how}</p>
                    </div>
                  )}
                  {mod.patience_required && (
                    <div className={`p-3 rounded ${isDark ? 'bg-amber-900/20' : 'bg-amber-50'}`}>
                      <p className="text-sm">
                        <strong>⏰ Timeline:</strong> {mod.patience_required}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Similar Pet Stories */}
          {results.similar_pet_stories && (
            <div className={`${c.info} border-l-4 rounded-r-lg p-5 transition-colors duration-200`}>
              <h3 className={`font-bold mb-2 flex items-center gap-2`}>
                <BookOpen className="w-5 h-5" />
                Community Experience
              </h3>
              <p className="text-sm">{results.similar_pet_stories}</p>
            </div>
          )}
        </div>
      )}

      {/* Behavior Diary Modal */}
      {showDiary && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowDiary(false)}>
          <div className={`${c.card} border rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-auto`} onClick={(e) => e.stopPropagation()}>
            <h3 className={`text-lg font-bold ${c.text} mb-4 flex items-center gap-2`}>
              <FileText className="w-6 h-6" />
              Behavior Diary Template
            </h3>
            <pre className={`${isDark ? 'bg-zinc-900' : 'bg-gray-50'} p-4 rounded text-xs overflow-auto ${c.text}`}>
              {generateBehaviorDiary()}
            </pre>
            <div className="flex gap-3 mt-4">
              <button
                onClick={copyDiary}
                className={`${c.btnPrimary} px-4 py-2 rounded flex items-center gap-2`}
              >
                <Calendar className="w-4 h-4" />
                Copy to Clipboard
              </button>
              <button
                onClick={() => setShowDiary(false)}
                className={`${c.btnSecondary} px-4 py-2 rounded`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PetWeirdnessDecoder;
