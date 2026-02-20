import React, { useState } from 'react';
import { Moon, Eye, TrendingUp, Calendar, Loader2, Plus, Trash2, ChevronDown, ChevronUp, BookOpen, Brain, Heart, Star } from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';

const DreamPatternSpotter = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Theme-aware colors (night theme)
  const c = {
    bg: isDark ? 'bg-slate-900' : 'bg-gradient-to-br from-indigo-50 via-purple-50 to-slate-100',
    card: isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-indigo-200',
    cardAlt: isDark ? 'bg-slate-700 border-slate-600' : 'bg-indigo-50 border-indigo-200',
    
    input: isDark
      ? 'bg-slate-900 border-slate-700 text-slate-50 placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500/20'
      : 'bg-white border-indigo-300 text-indigo-900 placeholder:text-indigo-400 focus:border-indigo-600 focus:ring-indigo-100',
    
    text: isDark ? 'text-slate-50' : 'text-indigo-900',
    textSecondary: isDark ? 'text-slate-300' : 'text-indigo-700',
    textMuted: isDark ? 'text-slate-400' : 'text-indigo-600',
    label: isDark ? 'text-slate-200' : 'text-indigo-800',
    
    btnPrimary: isDark
      ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
      : 'bg-indigo-600 hover:bg-indigo-700 text-white',
    btnSecondary: isDark
      ? 'bg-slate-700 hover:bg-slate-600 text-slate-50'
      : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-900',
    
    theme: isDark
      ? 'bg-purple-900/20 border-purple-700 text-purple-200'
      : 'bg-purple-50 border-purple-300 text-purple-800',
    symbol: isDark
      ? 'bg-indigo-900/20 border-indigo-700 text-indigo-200'
      : 'bg-indigo-50 border-indigo-300 text-indigo-800',
    emotion: isDark
      ? 'bg-pink-900/20 border-pink-700 text-pink-200'
      : 'bg-pink-50 border-pink-300 text-pink-800',
    insight: isDark
      ? 'bg-amber-900/20 border-amber-700 text-amber-200'
      : 'bg-amber-50 border-amber-300 text-amber-800',
  };

  // Mode selection
  const [mode, setMode] = useState('single'); // 'single' or 'pattern'

  // Single dream state
  const [singleDream, setSingleDream] = useState({
    description: '',
    date: new Date().toISOString().split('T')[0],
    emotions: {
      anxious: false,
      happy: false,
      scared: false,
      confused: false,
      excited: false,
      sad: false,
      neutral: false,
    },
    lifeContext: '',
  });

  // Multi-dream state
  const [dreams, setDreams] = useState([
    {
      id: 1,
      description: '',
      date: new Date().toISOString().split('T')[0],
      emotions: [],
      lifeContext: '',
    }
  ]);

  // Results state
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    themes: true,
    symbols: false,
    people: false,
    emotions: false,
    correlations: false,
    preoccupations: false,
    questions: true,
    insights: true,
  });

  const emotionOptions = ['Anxious', 'Happy', 'Scared', 'Confused', 'Excited', 'Sad', 'Neutral'];

  const handleSingleDreamAnalyze = async () => {
    if (!singleDream.description.trim()) {
      setError('Please describe your dream');
      return;
    }

    const selectedEmotions = Object.keys(singleDream.emotions).filter(key => singleDream.emotions[key]);

    setError('');
    setResults(null);

    try {
      const data = await callToolEndpoint('dream-pattern-spotter-single', {
        description: singleDream.description.trim(),
        date: singleDream.date,
        emotions: selectedEmotions,
        lifeContext: singleDream.lifeContext.trim() || null,
      });
      
      setResults(data);
      setExpandedSections(prev => ({
        ...prev,
        themes: true,
        symbols: true,
        questions: true,
        insights: true,
      }));
    } catch (err) {
      setError(err.message || 'Failed to analyze dream. Please try again.');
    }
  };

  const handlePatternAnalyze = async () => {
    const validDreams = dreams.filter(d => d.description.trim());
    
    if (validDreams.length < 2) {
      setError('Please add at least 2 dreams for pattern analysis');
      return;
    }

    setError('');
    setResults(null);

    try {
      const data = await callToolEndpoint('dream-pattern-spotter-pattern', {
        dreams: validDreams.map(d => ({
          description: d.description.trim(),
          date: d.date,
          emotions: d.emotions,
          lifeContext: d.lifeContext.trim() || null,
        })),
      });
      
      setResults(data);
      setExpandedSections(prev => ({
        ...prev,
        themes: true,
        emotions: true,
        preoccupations: true,
        questions: true,
        insights: true,
      }));
    } catch (err) {
      setError(err.message || 'Failed to analyze dreams. Please try again.');
    }
  };

  const addDream = () => {
    setDreams([...dreams, {
      id: Date.now(),
      description: '',
      date: new Date().toISOString().split('T')[0],
      emotions: [],
      lifeContext: '',
    }]);
  };

  const removeDream = (id) => {
    setDreams(dreams.filter(d => d.id !== id));
  };

  const updateDream = (id, field, value) => {
    setDreams(dreams.map(d => d.id === id ? { ...d, [field]: value } : d));
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleReset = () => {
    setSingleDream({
      description: '',
      date: new Date().toISOString().split('T')[0],
      emotions: {
        anxious: false,
        happy: false,
        scared: false,
        confused: false,
        excited: false,
        sad: false,
        neutral: false,
      },
      lifeContext: '',
    });
    setDreams([{
      id: 1,
      description: '',
      date: new Date().toISOString().split('T')[0],
      emotions: [],
      lifeContext: '',
    }]);
    setResults(null);
    setError('');
  };

  return (
    <div className={`min-h-screen ${c.bg} py-8 px-4`}>
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className={`${c.card} border rounded-xl shadow-lg p-6 transition-colors duration-200 relative overflow-hidden`}>
          {/* Decorative stars */}
          <div className="absolute top-2 right-2 opacity-20">
            <Star className="w-4 h-4 fill-current text-indigo-400" />
          </div>
          <div className="absolute top-8 right-12 opacity-10">
            <Star className="w-3 h-3 fill-current text-indigo-400" />
          </div>
          
          <div className="flex items-center gap-3 mb-4">
            
            <div>
              <h2 className={`text-2xl font-bold ${c.text}`}>Dream Pattern Spotter 🌙</h2>
              <p className={`text-sm ${c.textMuted}`}>Discover recurring themes and emotional patterns in your dreams</p>
            </div>
          </div>

          {/* Important notice */}
          <div className={`${c.insight} border-l-4 rounded-r-lg p-4`}>
            <div className="flex items-start gap-2">
              <Brain className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-sm mb-1">Psychological Pattern Recognition</h3>
                <p className="text-xs">
                  This tool analyzes dreams from psychological perspectives (Jungian, Freudian, modern neuroscience). 
                  It's NOT fortune-telling or mysticism - it's pattern recognition for self-reflection and insight.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mode Selection */}
        <div className={`${c.card} border rounded-xl shadow-lg p-6`}>
          <h3 className={`text-lg font-bold ${c.text} mb-4`}>Analysis Mode</h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setMode('single')}
              className={`p-4 border-2 rounded-lg transition-colors ${
                mode === 'single'
                  ? isDark
                    ? 'border-indigo-500 bg-indigo-900/20'
                    : 'border-indigo-500 bg-indigo-50'
                  : isDark
                    ? 'border-slate-700 hover:border-slate-600'
                    : 'border-indigo-200 hover:border-indigo-300'
              }`}
            >
              <Eye className={`w-6 h-6 mx-auto mb-2 ${mode === 'single' ? 'text-indigo-600' : c.textMuted}`} />
              <h4 className={`font-semibold ${c.text} mb-1`}>Single Dream</h4>
              <p className={`text-xs ${c.textMuted}`}>Analyze one dream in depth</p>
            </button>
            
            <button
              onClick={() => setMode('pattern')}
              className={`p-4 border-2 rounded-lg transition-colors ${
                mode === 'pattern'
                  ? isDark
                    ? 'border-indigo-500 bg-indigo-900/20'
                    : 'border-indigo-500 bg-indigo-50'
                  : isDark
                    ? 'border-slate-700 hover:border-slate-600'
                    : 'border-indigo-200 hover:border-indigo-300'
              }`}
            >
              <TrendingUp className={`w-6 h-6 mx-auto mb-2 ${mode === 'pattern' ? 'text-indigo-600' : c.textMuted}`} />
              <h4 className={`font-semibold ${c.text} mb-1`}>Pattern Analysis</h4>
              <p className={`text-xs ${c.textMuted}`}>Find patterns across 2+ dreams</p>
            </button>
          </div>
        </div>

        {/* Single Dream Mode */}
        {mode === 'single' && (
          <div className={`${c.card} border rounded-xl shadow-lg p-6`}>
            <h3 className={`text-lg font-bold ${c.text} mb-4`}>Describe Your Dream</h3>
            
            <div className="space-y-6">
              {/* Dream Description */}
              <div>
                <label htmlFor="dream" className={`block text-sm font-medium ${c.label} mb-2`}>
                  Dream description *
                </label>
                <textarea
                  id="dream"
                  value={singleDream.description}
                  onChange={(e) => setSingleDream(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your dream in as much detail as you remember... Include people, places, emotions, actions, symbols, and anything that stood out to you."
                  className={`w-full h-48 p-4 border-2 rounded-lg ${c.input} outline-none focus:ring-2 resize-none`}
                />
              </div>

              {/* Date */}
              <div>
                <label htmlFor="date" className={`block text-sm font-medium ${c.label} mb-2`}>
                  Date of dream
                </label>
                <input
                  type="date"
                  id="date"
                  value={singleDream.date}
                  onChange={(e) => setSingleDream(prev => ({ ...prev, date: e.target.value }))}
                  className={`p-3 border rounded-lg ${c.input} outline-none focus:ring-2`}
                />
              </div>

              {/* Emotional Tone */}
              <div>
                <label className={`block text-sm font-medium ${c.label} mb-3`}>
                  Emotional tone (select all that apply)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {emotionOptions.map(emotion => (
                    <label
                      key={emotion}
                      className={`flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                        singleDream.emotions[emotion.toLowerCase()]
                          ? isDark
                            ? 'border-indigo-500 bg-indigo-900/20'
                            : 'border-indigo-500 bg-indigo-50'
                          : isDark
                            ? 'border-slate-700 hover:border-slate-600'
                            : 'border-indigo-200 hover:border-indigo-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={singleDream.emotions[emotion.toLowerCase()]}
                        onChange={() => setSingleDream(prev => ({
                          ...prev,
                          emotions: {
                            ...prev.emotions,
                            [emotion.toLowerCase()]: !prev.emotions[emotion.toLowerCase()]
                          }
                        }))}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                      />
                      <span className="text-sm">{emotion}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Life Context */}
              <div>
                <label htmlFor="context" className={`block text-sm font-medium ${c.label} mb-2`}>
                  What was happening in your life? (optional but helpful)
                </label>
                <textarea
                  id="context"
                  value={singleDream.lifeContext}
                  onChange={(e) => setSingleDream(prev => ({ ...prev, lifeContext: e.target.value }))}
                  placeholder="Example: Started new job last week, relationship stress, preparing for exam, family visit..."
                  className={`w-full h-24 p-4 border-2 rounded-lg ${c.input} outline-none focus:ring-2 resize-none`}
                />
              </div>

              {/* Action Button */}
              <button
                onClick={handleSingleDreamAnalyze}
                disabled={loading}
                className={`w-full ${c.btnPrimary} disabled:opacity-50 py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing dream...
                  </>
                ) : (
                  <>
                    <Eye className="w-5 h-5" />
                    Analyze Dream
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Pattern Analysis Mode */}
        {mode === 'pattern' && (
          <div className={`${c.card} border rounded-xl shadow-lg p-6`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-bold ${c.text}`}>Add Your Dreams (2+ for pattern analysis)</h3>
              <button
                onClick={addDream}
                className={`${c.btnSecondary} py-2 px-4 rounded-lg text-sm flex items-center gap-2`}
              >
                <Plus className="w-4 h-4" />
                Add Dream
              </button>
            </div>

            <div className="space-y-6">
              {dreams.map((dream, index) => (
                <div key={dream.id} className={`${c.cardAlt} border rounded-lg p-4`}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className={`font-semibold ${c.text}`}>Dream #{index + 1}</h4>
                    {dreams.length > 1 && (
                      <button
                        onClick={() => removeDream(dream.id)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <textarea
                      value={dream.description}
                      onChange={(e) => updateDream(dream.id, 'description', e.target.value)}
                      placeholder="Describe this dream..."
                      className={`w-full h-32 p-3 border rounded-lg ${c.input} outline-none focus:ring-2 resize-none text-sm`}
                    />

                    <input
                      type="date"
                      value={dream.date}
                      onChange={(e) => updateDream(dream.id, 'date', e.target.value)}
                      className={`p-2 border rounded-lg ${c.input} outline-none focus:ring-2 text-sm`}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Action Button */}
            <button
              onClick={handlePatternAnalyze}
              disabled={loading}
              className={`w-full ${c.btnPrimary} disabled:opacity-50 py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 mt-6`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing patterns...
                </>
              ) : (
                <>
                  <TrendingUp className="w-5 h-5" />
                  Analyze Patterns
                </>
              )}
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="space-y-6">
            
            {/* Reset Button */}
            <div className="flex justify-end">
              <button
                onClick={handleReset}
                className={`${c.btnSecondary} py-2 px-4 rounded-lg text-sm`}
              >
                New Analysis
              </button>
            </div>

            {/* Pattern Analysis Header (for multi-dream) */}
            {results.pattern_analysis && (
              <div className={`${c.card} border rounded-xl shadow-lg p-6`}>
                <h3 className={`text-xl font-bold ${c.text} mb-3`}>Pattern Analysis Summary</h3>
                <div className="grid grid-cols-2 gap-4">
                  {results.pattern_analysis.total_dreams_analyzed && (
                    <div className={`${c.cardAlt} border rounded-lg p-3`}>
                      <p className={`text-xs ${c.textMuted}`}>Dreams Analyzed</p>
                      <p className={`text-2xl font-bold ${c.text}`}>{results.pattern_analysis.total_dreams_analyzed}</p>
                    </div>
                  )}
                  {results.pattern_analysis.date_range && (
                    <div className={`${c.cardAlt} border rounded-lg p-3`}>
                      <p className={`text-xs ${c.textMuted}`}>Date Range</p>
                      <p className={`text-sm font-semibold ${c.text}`}>{results.pattern_analysis.date_range}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Recurring Themes */}
            {((results.pattern_analysis?.recurring_themes && results.pattern_analysis.recurring_themes.length > 0) || results.themes) && (
              <div className={`${c.card} border rounded-xl shadow-lg p-6`}>
                <button
                  onClick={() => toggleSection('themes')}
                  className="flex items-center gap-2 mb-4 w-full"
                >
                  <BookOpen className="w-5 h-5" />
                  <h3 className={`text-xl font-bold ${c.text}`}>Recurring Themes</h3>
                  {expandedSections.themes ? (
                    <ChevronUp className="w-5 h-5 ml-auto" />
                  ) : (
                    <ChevronDown className="w-5 h-5 ml-auto" />
                  )}
                </button>

                {expandedSections.themes && (
                  <div className="space-y-4">
                    {(results.pattern_analysis?.recurring_themes || results.themes || []).map((theme, idx) => (
                      <div key={idx} className={`${c.theme} border rounded-lg p-4`}>
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-bold text-lg">{theme.theme}</h4>
                          {theme.frequency && (
                            <span className="text-sm px-2 py-1 rounded bg-purple-200 dark:bg-purple-900/40 text-purple-900 dark:text-purple-100">
                              {theme.frequency}x
                            </span>
                          )}
                        </div>
                        
                        {theme.emotional_context && (
                          <p className="text-sm mb-2">
                            <strong>Emotional context:</strong> {theme.emotional_context}
                          </p>
                        )}
                        
                        {theme.possible_meaning && (
                          <p className="text-sm mb-2">
                            <strong>Possible meaning:</strong> {theme.possible_meaning}
                          </p>
                        )}

                        {theme.dreams_featuring && theme.dreams_featuring.length > 0 && (
                          <p className="text-xs opacity-75">
                            Featured in: {theme.dreams_featuring.join(', ')}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Recurring Symbols */}
            {results.pattern_analysis?.recurring_symbols && results.pattern_analysis.recurring_symbols.length > 0 && (
              <div className={`${c.card} border rounded-xl shadow-lg p-6`}>
                <button
                  onClick={() => toggleSection('symbols')}
                  className="flex items-center gap-2 mb-4 w-full"
                >
                  <Star className="w-5 h-5" />
                  <h3 className={`text-xl font-bold ${c.text}`}>Recurring Symbols</h3>
                  {expandedSections.symbols ? (
                    <ChevronUp className="w-5 h-5 ml-auto" />
                  ) : (
                    <ChevronDown className="w-5 h-5 ml-auto" />
                  )}
                </button>

                {expandedSections.symbols && (
                  <div className="space-y-4">
                    {results.pattern_analysis.recurring_symbols.map((symbol, idx) => (
                      <div key={idx} className={`${c.symbol} border rounded-lg p-4`}>
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-bold capitalize">{symbol.symbol}</h4>
                          {symbol.frequency && (
                            <span className="text-sm px-2 py-1 rounded bg-indigo-200 dark:bg-indigo-900/40 text-indigo-900 dark:text-indigo-100">
                              {symbol.frequency}x
                            </span>
                          )}
                        </div>

                        {symbol.contexts && symbol.contexts.length > 0 && (
                          <p className="text-sm mb-2">
                            <strong>Contexts:</strong> {symbol.contexts.join(', ')}
                          </p>
                        )}

                        {symbol.emotional_associations && symbol.emotional_associations.length > 0 && (
                          <p className="text-sm mb-2">
                            <strong>Associated emotions:</strong> {symbol.emotional_associations.join(', ')}
                          </p>
                        )}

                        {symbol.interpretation_options && symbol.interpretation_options.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm font-semibold mb-1">Interpretation possibilities:</p>
                            <ul className="text-sm space-y-1">
                              {symbol.interpretation_options.map((interp, iidx) => (
                                <li key={iidx}>• {interp}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Recurring People */}
            {results.pattern_analysis?.recurring_people && results.pattern_analysis.recurring_people.length > 0 && (
              <div className={`${c.card} border rounded-xl shadow-lg p-6`}>
                <button
                  onClick={() => toggleSection('people')}
                  className="flex items-center gap-2 mb-4 w-full"
                >
                  <Heart className="w-5 h-5" />
                  <h3 className={`text-xl font-bold ${c.text}`}>Recurring People/Figures</h3>
                  {expandedSections.people ? (
                    <ChevronUp className="w-5 h-5 ml-auto" />
                  ) : (
                    <ChevronDown className="w-5 h-5 ml-auto" />
                  )}
                </button>

                {expandedSections.people && (
                  <div className="space-y-3">
                    {results.pattern_analysis.recurring_people.map((person, idx) => (
                      <div key={idx} className={`${c.cardAlt} border rounded-lg p-4`}>
                        <h4 className={`font-bold ${c.text} mb-2`}>{person.person_type}</h4>
                        <p className={`text-sm ${c.textSecondary} mb-1`}>
                          <strong>Role:</strong> {person.role_in_dreams}
                        </p>
                        <p className={`text-sm ${c.textSecondary}`}>
                          <strong>Possible connection:</strong> {person.possible_connection}
                        </p>
                        {person.frequency && (
                          <span className="text-xs opacity-75">Appears {person.frequency}x</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Emotional Patterns */}
            {results.pattern_analysis?.emotional_patterns && (
              <div className={`${c.card} border rounded-xl shadow-lg p-6`}>
                <button
                  onClick={() => toggleSection('emotions')}
                  className="flex items-center gap-2 mb-4 w-full"
                >
                  <Heart className="w-5 h-5" />
                  <h3 className={`text-xl font-bold ${c.text}`}>Emotional Patterns</h3>
                  {expandedSections.emotions ? (
                    <ChevronUp className="w-5 h-5 ml-auto" />
                  ) : (
                    <ChevronDown className="w-5 h-5 ml-auto" />
                  )}
                </button>

                {expandedSections.emotions && (
                  <div className={`${c.emotion} border rounded-lg p-4 space-y-3`}>
                    {results.pattern_analysis.emotional_patterns.most_common_emotion && (
                      <p className="text-sm">
                        <strong>Most common emotion:</strong> {results.pattern_analysis.emotional_patterns.most_common_emotion}
                      </p>
                    )}
                    {results.pattern_analysis.emotional_patterns.emotional_trend && (
                      <p className="text-sm">
                        <strong>Trend:</strong> {results.pattern_analysis.emotional_patterns.emotional_trend}
                      </p>
                    )}
                    {results.pattern_analysis.emotional_patterns.correlation_with_life_events && (
                      <p className="text-sm">
                        <strong>Life event correlation:</strong> {results.pattern_analysis.emotional_patterns.correlation_with_life_events}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Life Event Correlations */}
            {results.life_event_correlations && results.life_event_correlations.length > 0 && (
              <div className={`${c.card} border rounded-xl shadow-lg p-6`}>
                <button
                  onClick={() => toggleSection('correlations')}
                  className="flex items-center gap-2 mb-4 w-full"
                >
                  <Calendar className="w-5 h-5" />
                  <h3 className={`text-xl font-bold ${c.text}`}>Life Event Correlations</h3>
                  {expandedSections.correlations ? (
                    <ChevronUp className="w-5 h-5 ml-auto" />
                  ) : (
                    <ChevronDown className="w-5 h-5 ml-auto" />
                  )}
                </button>

                {expandedSections.correlations && (
                  <div className="space-y-3">
                    {results.life_event_correlations.map((corr, idx) => (
                      <div key={idx} className={`${c.cardAlt} border rounded-lg p-4`}>
                        <h4 className={`font-semibold ${c.text} mb-2`}>Event: {corr.life_event}</h4>
                        <p className={`text-sm ${c.textSecondary} mb-2`}>
                          <strong>Dream changes:</strong> {corr.dream_changes}
                        </p>
                        <p className={`text-sm ${c.textSecondary}`}>
                          <strong>Pattern:</strong> {corr.pattern}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Subconscious Preoccupations */}
            {results.subconscious_preoccupations && results.subconscious_preoccupations.length > 0 && (
              <div className={`${c.card} border rounded-xl shadow-lg p-6`}>
                <button
                  onClick={() => toggleSection('preoccupations')}
                  className="flex items-center gap-2 mb-4 w-full"
                >
                  <Brain className="w-5 h-5" />
                  <h3 className={`text-xl font-bold ${c.text}`}>Subconscious Preoccupations</h3>
                  {expandedSections.preoccupations ? (
                    <ChevronUp className="w-5 h-5 ml-auto" />
                  ) : (
                    <ChevronDown className="w-5 h-5 ml-auto" />
                  )}
                </button>

                {expandedSections.preoccupations && (
                  <div className="space-y-4">
                    {results.subconscious_preoccupations.map((preoc, idx) => (
                      <div key={idx} className={`${c.cardAlt} border rounded-lg p-4`}>
                        <h4 className={`font-bold ${c.text} mb-2`}>{preoc.preoccupation}</h4>
                        {preoc.evidence && preoc.evidence.length > 0 && (
                          <p className={`text-sm ${c.textSecondary} mb-2`}>
                            <strong>Evidence:</strong> {preoc.evidence.join(', ')}
                          </p>
                        )}
                        {preoc.reflection_prompt && (
                          <p className={`text-sm italic ${c.textMuted} mt-2`}>
                            💭 {preoc.reflection_prompt}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Reflection Questions */}
            {results.reflection_questions && results.reflection_questions.length > 0 && (
              <div className={`${c.card} border rounded-xl shadow-lg p-6`}>
                <button
                  onClick={() => toggleSection('questions')}
                  className="flex items-center gap-2 mb-4 w-full"
                >
                  <Eye className="w-5 h-5" />
                  <h3 className={`text-xl font-bold ${c.text}`}>Questions for Reflection</h3>
                  {expandedSections.questions ? (
                    <ChevronUp className="w-5 h-5 ml-auto" />
                  ) : (
                    <ChevronDown className="w-5 h-5 ml-auto" />
                  )}
                </button>

                {expandedSections.questions && (
                  <div className={`${c.cardAlt} border rounded-lg p-4`}>
                    <p className={`text-sm ${c.textMuted} mb-3`}>
                      Use these questions in journaling or therapy to explore what your dreams might reveal:
                    </p>
                    <ul className="space-y-2">
                      {results.reflection_questions.map((q, idx) => (
                        <li key={idx} className={`text-sm ${c.textSecondary} flex items-start gap-2`}>
                          <span className="text-indigo-500 mt-0.5">?</span>
                          <span>{q}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Insights */}
            {results.insights && (
              <div className={`${c.card} border rounded-xl shadow-lg p-6`}>
                <button
                  onClick={() => toggleSection('insights')}
                  className="flex items-center gap-2 mb-4 w-full"
                >
                  <Moon className="w-5 h-5" />
                  <h3 className={`text-xl font-bold ${c.text}`}>Overall Insights</h3>
                  {expandedSections.insights ? (
                    <ChevronUp className="w-5 h-5 ml-auto" />
                  ) : (
                    <ChevronDown className="w-5 h-5 ml-auto" />
                  )}
                </button>

                {expandedSections.insights && (
                  <div className="space-y-4">
                    {results.insights.overall_assessment && (
                      <div className={`${c.insight} border rounded-lg p-4`}>
                        <h4 className="font-semibold mb-2">Overall Assessment:</h4>
                        <p className="text-sm">{results.insights.overall_assessment}</p>
                      </div>
                    )}
                    {results.insights.therapeutic_value && (
                      <div className={`${c.cardAlt} border rounded-lg p-4`}>
                        <h4 className={`font-semibold ${c.text} mb-2`}>Therapeutic Value:</h4>
                        <p className={`text-sm ${c.textSecondary}`}>{results.insights.therapeutic_value}</p>
                      </div>
                    )}
                    {results.insights.growth_areas && (
                      <div className={`${c.cardAlt} border rounded-lg p-4`}>
                        <h4 className={`font-semibold ${c.text} mb-2`}>Growth Areas:</h4>
                        <p className={`text-sm ${c.textSecondary}`}>{results.insights.growth_areas}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Disclaimer */}
            <div className={`${c.cardAlt} border-l-4 rounded-r-lg p-4`}>
              <p className="text-xs opacity-75">
                <strong>Remember:</strong> Dreams are personal and interpretations should resonate with YOUR life experience. 
                These patterns are suggestions for self-reflection, not definitive truths. Consider discussing insights 
                with a therapist or counselor for deeper exploration.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DreamPatternSpotter;
