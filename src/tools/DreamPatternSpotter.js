import React, { useState } from 'react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useRegisterActions } from '../components/ActionBarContext';
import { usePersistentState } from '../hooks/usePersistentState';
import { useTheme } from '../hooks/useTheme';

const DreamPatternSpotter = ({ tool }) => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const { isDark } = useTheme();

  const c = {
    card:          isDark ? 'bg-zinc-800' : 'bg-white',
    cardAlt:       isDark ? 'bg-zinc-700/50' : 'bg-slate-50',
    text:          isDark ? 'text-zinc-50' : 'text-gray-900',
    textSecondary: isDark ? 'text-zinc-300' : 'text-gray-600',
    textMuted:     isDark ? 'text-zinc-500' : 'text-gray-400',
    required:      isDark ? 'text-amber-400' : 'text-amber-500',
    input:         isDark ? 'bg-zinc-900 border-zinc-700 text-zinc-50 placeholder:text-zinc-500 focus:border-cyan-500 focus:ring-cyan-500/20' : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-cyan-500',
    btnPrimary:    isDark ? 'bg-cyan-600 hover:bg-cyan-500 text-white' : 'bg-cyan-600 hover:bg-cyan-700 text-white',
    btnSecondary:  isDark ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-100' : 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    border:        isDark ? 'border-zinc-700' : 'border-gray-200',
    success:       isDark ? 'bg-green-900/20 border-green-700 text-green-200' : 'bg-green-50 border-green-300 text-green-800',
    warning:       isDark ? 'bg-amber-900/20 border-amber-700 text-amber-200' : 'bg-amber-50 border-amber-300 text-amber-800',
    danger:        isDark ? 'bg-red-900/20 border-red-700 text-red-200' : 'bg-red-50 border-red-200 text-red-800',
    // Bespoke dream-themed keys
    dreamTheme:    isDark ? 'bg-zinc-700/40 border-zinc-600 text-zinc-200' : 'bg-slate-100 border-slate-300 text-zinc-800',
    dreamSymbol:   isDark ? 'bg-cyan-900/20 border-cyan-700 text-cyan-200' : 'bg-cyan-50 border-cyan-200 text-cyan-800',
    dreamEmotion:  isDark ? 'bg-amber-900/20 border-amber-700 text-amber-200' : 'bg-amber-50 border-amber-300 text-amber-800',
    dreamInsight:  isDark ? 'bg-green-900/20 border-green-700 text-green-200' : 'bg-green-50 border-green-300 text-green-800',
    deleteHover: isDark ? 'hover:text-red-400' : 'hover:text-red-600',
  };

  const linkStyle = isDark
    ? 'text-cyan-400 hover:text-cyan-300 underline underline-offset-2'
    : 'text-cyan-600 hover:text-cyan-700 underline underline-offset-2';

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
  const [results, setResults] = usePersistentState('dps-results', null);
  const [history, setHistory] = usePersistentState('dps-history', []);
  const [error, setError] = useState('');
  const resultsRef = React.useRef(null);

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
      
      const entry = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        mode: 'single',
        preview: singleDream.description.trim().slice(0, 60),
        input: { singleDream: { ...singleDream }, dreams: [] },
        results: data,
      };
      setHistory(prev => [entry, ...prev].slice(0, 10));
      setResults(data); setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
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
      
      const entry = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        mode: 'pattern',
        preview: validDreams[0].description.trim().slice(0, 60),
        dreamCount: validDreams.length,
        input: { singleDream: null, dreams: [...dreams] },
        results: data,
      };
      setHistory(prev => [entry, ...prev].slice(0, 10));
      setResults(data); setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
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

  const buildExportText = React.useCallback(() => {
    if (!results) return '';
    const lines = ['DREAM ANALYSIS', ''];
    if (results.core_message) lines.push('CORE MESSAGE', results.core_message, '');
    if (results.plain_english_summary) lines.push('SUMMARY', results.plain_english_summary, '');
    results.recurring_themes?.forEach((t, i) => lines.push(`THEME ${i+1}: ${t.theme}`, t.interpretation || '', ''));
    results.key_symbols?.forEach(s => lines.push(`SYMBOL: ${s.symbol}`, s.interpretation || '', ''));
    results.emotional_landscape?.map(e => `• ${e}`).forEach(e => lines.push(e));
    if (results.questions_for_reflection?.length) {
      lines.push('', 'REFLECTION QUESTIONS');
      results.questions_for_reflection.forEach(q => lines.push(`• ${q}`));
    }
    lines.push('', '— Generated by DeftBrain · deftbrain.com');
    return lines.join('\n');
  }, [results, mode]);

  useRegisterActions(buildExportText(), tool?.title || 'Dream Pattern Spotter');

  // ── Keyboard handler (after handlers to avoid TDZ) ──
  const handleSingleRef = React.useRef(null);
  const handlePatternRef = React.useRef(null);
  const canSubmitRef = React.useRef(false);
  handleSingleRef.current = handleSingleDreamAnalyze;
  handlePatternRef.current = handlePatternAnalyze;
  canSubmitRef.current = !loading;

  React.useEffect(() => {
    const handler = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'SELECT') return;
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && canSubmitRef.current) {
        if (mode === 'pattern') handlePatternRef.current?.();
        else handleSingleRef.current?.();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  return (
    <div className={`space-y-4 ${c.text}`}>
      <div className="max-w-4xl mx-auto space-y-4">

        {/* Header */}
        <div className={`${c.card} border ${c.border} rounded-xl shadow-sm p-5`}>
          <div className="pb-3 border-b border-zinc-500">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className={`text-xl font-bold ${c.text} flex items-center gap-2`}>
                  <span>{tool?.icon ?? '🌙'}</span>{tool?.title ?? 'Dream Pattern Spotter'}
                </h2>
                <p className={`text-sm ${c.textSecondary}`}>{tool?.tagline ?? 'Find recurring themes and emotional patterns in your dreams'}</p>
              </div>
              {(results || singleDream.description.trim() || dreams.some(d => d.description.trim())) && (
                <button onClick={handleReset} className={`${c.btnSecondary} px-3 py-1.5 rounded-lg text-xs font-bold flex-shrink-0`}>
                  ↺ Start Over
                </button>
              )}
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
                    ? 'border-cyan-500 bg-cyan-900/20'
                    : 'border-cyan-500 bg-cyan-50'
                  : isDark
                    ? 'border-zinc-700 hover:border-zinc-600'
                    : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="text-2xl block mb-1">🌙</span>
              <h4 className={`font-semibold ${c.text} mb-1`}>Single Dream</h4>
              <p className={`text-xs ${c.textMuteded}`}>Analyze one dream in depth</p>
            </button>
            
            <button
              onClick={() => setMode('pattern')}
              className={`p-4 border-2 rounded-lg transition-colors ${
                mode === 'pattern'
                  ? isDark
                    ? 'border-cyan-500 bg-cyan-900/20'
                    : 'border-cyan-500 bg-cyan-50'
                  : isDark
                    ? 'border-zinc-700 hover:border-zinc-600'
                    : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="text-2xl block mb-1">📊</span>
              <h4 className={`font-semibold ${c.text} mb-1`}>Pattern Analysis</h4>
              <p className={`text-xs ${c.textMuteded}`}>Find patterns across 2+ dreams</p>
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
                <label htmlFor="dream" className={`block text-sm font-medium ${c.textSecondary} mb-2`}>
                  Dream description *
                </label>
                <textarea
                  id="dream"
                  value={singleDream.description}
                  onChange={(e) => setSingleDream(prev => ({ ...prev, description: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSingleDreamAnalyze(); }}
                  placeholder="Describe your dream in as much detail as you remember... Include people, places, emotions, actions, symbols, and anything that stood out to you."
                  className={`w-full h-48 p-4 border-2 rounded-lg ${c.input} outline-none focus:ring-2 resize-none`}
                />
              </div>

              {/* Date */}
              <div>
                <label htmlFor="date" className={`block text-sm font-medium ${c.textSecondary} mb-2`}>
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
                <label className={`block text-sm font-medium ${c.textSecondary} mb-3`}>
                  Emotional tone (select all that apply)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {emotionOptions.map(emotion => (
                    <label
                      key={emotion}
                      className={`flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                        singleDream.emotions[emotion.toLowerCase()]
                          ? isDark
                            ? 'border-cyan-500 bg-cyan-900/20'
                            : 'border-cyan-500 bg-cyan-50'
                          : isDark
                            ? 'border-zinc-700 hover:border-zinc-600'
                            : 'border-gray-200 hover:border-gray-300'
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
                        className="w-4 h-4 rounded accent-cyan-500"
                      />
                      <span className="text-sm">{emotion}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Life Context */}
              <div>
                <label htmlFor="context" className={`block text-sm font-medium ${c.textSecondary} mb-2`}>
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
                className={`w-full ${c.btnPrimary} disabled:opacity-40 py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2`}
              >
                {loading ? (
                  <>
                    <span className="animate-spin inline-block">{tool?.icon ?? '🌙'}</span>
                    Analyzing dream...
                  </>
                ) : (
                  <>
                    <span>🌙</span>
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
                <span>+</span>
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
                        className="text-red-500 ${c.deleteHover}"
                      >
                        <span>🗑️</span>
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
              className={`w-full ${c.btnPrimary} disabled:opacity-40 py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 mt-6`}
            >
              {loading ? (
                <>
                  <span className="animate-spin inline-block">{tool?.icon ?? '🌙'}</span>
                  Analyzing patterns...
                </>
              ) : (
                <>
                  <span>📊</span>
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
          <div ref={resultsRef} className="space-y-6">

            {/* Pattern Analysis Header (for multi-dream) */}
            {results.pattern_analysis && (
              <div className={`${c.card} border rounded-xl shadow-lg p-6`}>
                <h3 className={`text-xl font-bold ${c.text} mb-3`}>Pattern Analysis Summary</h3>
                <div className="grid grid-cols-2 gap-4">
                  {results.pattern_analysis.total_dreams_analyzed && (
                    <div className={`${c.cardAlt} border rounded-lg p-3`}>
                      <p className={`text-xs ${c.textMuteded}`}>Dreams Analyzed</p>
                      <p className={`text-2xl font-bold ${c.text}`}>{results.pattern_analysis.total_dreams_analyzed}</p>
                    </div>
                  )}
                  {results.pattern_analysis.date_range && (
                    <div className={`${c.cardAlt} border rounded-lg p-3`}>
                      <p className={`text-xs ${c.textMuteded}`}>Date Range</p>
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
                  <span>📖</span>
                  <h3 className={`text-xl font-bold ${c.text}`}>Recurring Themes</h3>
                  {expandedSections.themes ? (
                    <span className="ml-auto">▲</span>
                  ) : (
                    <span className="ml-auto">▼</span>
                  )}
                </button>

                {expandedSections.themes && (
                  <div className="space-y-4">
                    {(results.pattern_analysis?.recurring_themes || results.themes || []).map((theme, idx) => (
                      <div key={idx} className={`${c.dreamTheme} border rounded-lg p-4`}>
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-bold text-lg">{theme.theme}</h4>
                          {theme.frequency && (
                            <span className="text-sm px-2 py-1 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100">
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
                  <span>⭐</span>
                  <h3 className={`text-xl font-bold ${c.text}`}>Recurring Symbols</h3>
                  {expandedSections.symbols ? (
                    <span className="ml-auto">▲</span>
                  ) : (
                    <span className="ml-auto">▼</span>
                  )}
                </button>

                {expandedSections.symbols && (
                  <div className="space-y-4">
                    {results.pattern_analysis.recurring_symbols.map((symbol, idx) => (
                      <div key={idx} className={`${c.dreamSymbol} border rounded-lg p-4`}>
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-bold capitalize">{symbol.symbol}</h4>
                          {symbol.frequency && (
                            <span className="text-sm px-2 py-1 rounded bg-cyan-100 dark:bg-cyan-900/40 text-cyan-900 dark:text-cyan-100">
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
                  <span>💫</span>
                  <h3 className={`text-xl font-bold ${c.text}`}>Recurring People/Figures</h3>
                  {expandedSections.people ? (
                    <span className="ml-auto">▲</span>
                  ) : (
                    <span className="ml-auto">▼</span>
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
                  <span>💫</span>
                  <h3 className={`text-xl font-bold ${c.text}`}>Emotional Patterns</h3>
                  {expandedSections.emotions ? (
                    <span className="ml-auto">▲</span>
                  ) : (
                    <span className="ml-auto">▼</span>
                  )}
                </button>

                {expandedSections.emotions && (
                  <div className={`${c.dreamEmotion} border rounded-lg p-4 space-y-3`}>
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
                  <span>📅</span>
                  <h3 className={`text-xl font-bold ${c.text}`}>Life Event Correlations</h3>
                  {expandedSections.correlations ? (
                    <span className="ml-auto">▲</span>
                  ) : (
                    <span className="ml-auto">▼</span>
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
                  <span>🧠</span>
                  <h3 className={`text-xl font-bold ${c.text}`}>Subconscious Preoccupations</h3>
                  {expandedSections.preoccupations ? (
                    <span className="ml-auto">▲</span>
                  ) : (
                    <span className="ml-auto">▼</span>
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
                          <p className={`text-sm italic ${c.textMuteded} mt-2`}>
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
                  <span>🌙</span>
                  <h3 className={`text-xl font-bold ${c.text}`}>Questions for Reflection</h3>
                  {expandedSections.questions ? (
                    <span className="ml-auto">▲</span>
                  ) : (
                    <span className="ml-auto">▼</span>
                  )}
                </button>

                {expandedSections.questions && (
                  <div className={`${c.cardAlt} border rounded-lg p-4`}>
                    <p className={`text-sm ${c.textMuteded} mb-3`}>
                      Use these questions in journaling or therapy to explore what your dreams might reveal:
                    </p>
                    <ul className="space-y-2">
                      {results.reflection_questions.map((q, idx) => (
                        <li key={idx} className={`text-sm ${c.textSecondary} flex items-start gap-2`}>
                          <span className="text-cyan-500 mt-0.5">?</span>
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
                  <span>🌙</span>
                  <h3 className={`text-xl font-bold ${c.text}`}>Overall Insights</h3>
                  {expandedSections.insights ? (
                    <span className="ml-auto">▲</span>
                  ) : (
                    <span className="ml-auto">▼</span>
                  )}
                </button>

                {expandedSections.insights && (
                  <div className="space-y-4">
                    {results.insights.overall_assessment && (
                      <div className={`${c.dreamInsight} border rounded-lg p-4`}>
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

            {/* Cross-references */}
            <p className={`text-xs ${c.textMuteded} text-center`}>
              AI-generated patterns — trust what resonates.{' '}
              Recurring anxiety in dreams?{' '}<a href="/EgoKiller" target="_blank" rel="noopener noreferrer" className={linkStyle}>Ego Killer</a>{' '}
              surfaces the beliefs worth examining.
            </p>
          </div>
        )}
      </div>
        <div className={`mt-6 pt-4 border-t text-sm ${c.border} ${c.textMuteded}`}>
          <p className="mb-2 font-medium">You might also like:</p>
          <div className="flex flex-wrap gap-2">
            {[{slug:'recall',label:'🧠 Recall'},{slug:'brain-dump-buddy',label:'📤 Brain Dump Buddy'},{slug:'spiral-stopper',label:'🌀 Spiral Stopper'}].map(({slug,label})=>(
              <a key={slug} href={`${slug}`} className={linkStyle}>{label}</a>
            ))}
          </div>
        </div>
        {history.length > 0 && (
          <div className={`mt-6 border-t pt-4 ${c.border}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`text-sm font-semibold ${c.textSecondary}`}>📖 Previous Analyses</h3>
              <button onClick={() => setHistory([])} className={`text-xs ${c.textMuted} ${c.deleteHover}`}>Clear all</button>
            </div>
            <div className="space-y-1.5">
              {history.map((h, i) => (
                <button
                  key={h.id || i}
                  onClick={() => {
                    if (h.results) {
                      setResults(h.results);
                      if (h.input?.singleDream) setSingleDream(h.input.singleDream);
                      if (h.input?.dreams?.length) setDreams(h.input.dreams);
                      if (h.mode) setMode(h.mode);
                      setExpandedSections(prev => ({ ...prev, themes: true, symbols: true, questions: true, insights: true }));
                      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
                    }
                  }}
                  disabled={!h.results}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-colors ${h.results ? `${c.cardAlt} hover:opacity-80 cursor-pointer` : `${c.cardAlt} opacity-50 cursor-default`}`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-xs">{h.mode === 'pattern' ? '🔁' : '🌙'}</span>
                    <span className={`text-xs ${c.text} truncate`}>{h.preview}{h.dreamCount ? ` (+${h.dreamCount - 1} more)` : ''}</span>
                  </div>
                  <span className={`text-xs ${c.textMuted} ml-2 flex-shrink-0`}>{new Date(h.date).toLocaleDateString()}</span>
                </button>
              ))}
            </div>
          </div>
        )}
    </div>
  );
};

DreamPatternSpotter.displayName = 'DreamPatternSpotter';
export default DreamPatternSpotter;
