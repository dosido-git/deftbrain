import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';
import { usePersistentState } from '../hooks/usePersistentState';
import { ActionBar, CopyBtn } from '../components/ActionButtons';
import { compressImage, CompressionPresets } from '../utils/imageCompression';

// ════════════════════════════════════════════════════════════
// THEME — Navy & Gold
// ════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════
const DIETARY_OPTIONS = [
  'Vegetarian', 'Vegan', 'Gluten-free', 'Dairy-free', 'Keto/Low-carb',
  'Nut-free', 'Halal', 'Kosher', 'Low-sodium', 'No restrictions',
];

const SKILL_OPTIONS = [
  { value: 'beginner', label: '🔰 Beginner', desc: 'Can boil water and follow basic instructions' },
  { value: 'intermediate', label: '🍳 Intermediate', desc: 'Comfortable with most techniques' },
  { value: 'advanced', label: '👨‍🍳 Advanced', desc: 'Bring on the challenges' },
];

const MEAL_OPTIONS = [
  { value: 'breakfast', label: '🌅 Breakfast' },
  { value: 'lunch', label: '☀️ Lunch' },
  { value: 'dinner', label: '🌙 Dinner' },
  { value: 'snack', label: '🍿 Snack' },
  { value: 'meal-prep', label: '📦 Batch meal prep' },
];

const TIME_OPTIONS = [
  { value: '15', label: '⚡ 15 min' },
  { value: '30', label: '🕐 30 min' },
  { value: '45', label: '🕐 45 min' },
  { value: '60', label: '🕐 1 hour' },
  { value: '90', label: '🕐 1.5 hours' },
  { value: '120+', label: '🕐 2+ hours' },
];

const EQUIPMENT_OPTIONS = [
  'Oven', 'Stovetop', 'Microwave', 'Air fryer', 'Instant Pot / pressure cooker',
  'Slow cooker', 'Blender', 'Food processor', 'Grill',
];

// ════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════
const MiseEnPlace = ({ tool }) => {
  const { isDark } = useTheme();

  const linkStyle = isDark
    ? 'text-cyan-400 hover:text-cyan-300 underline underline-offset-2'
    : 'text-cyan-600 hover:text-cyan-700 underline underline-offset-2';

  const c = {
    card:          isDark ? 'bg-zinc-800' : 'bg-white',
    cardAlt:       isDark ? 'bg-zinc-700/50' : 'bg-slate-50',
    input:         isDark ? 'bg-zinc-900 border-zinc-600 text-zinc-100 placeholder-zinc-400 focus:border-cyan-500 focus:ring-cyan-500/20' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-cyan-500 focus:ring-cyan-100',
    text:          isDark ? 'text-zinc-50' : 'text-gray-900',
    textSecondary: isDark ? 'text-zinc-300' : 'text-gray-600',
    textMuted:     isDark ? 'text-zinc-500' : 'text-gray-400',
    btnPrimary:    isDark ? 'bg-cyan-600 hover:bg-cyan-500 text-white' : 'bg-cyan-600 hover:bg-cyan-700 text-white',
    btnSecondary:  isDark ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    border:        isDark ? 'border-zinc-700' : 'border-gray-200',
    success:       isDark ? 'bg-emerald-900/20 border-emerald-700 text-emerald-200' : 'bg-emerald-50 border-emerald-300 text-emerald-800',
    warning:       isDark ? 'bg-amber-900/20 border-amber-700 text-amber-200' : 'bg-amber-50 border-amber-300 text-amber-800',
    danger:        isDark ? 'bg-red-900/20 border-red-700 text-red-200' : 'bg-red-50 border-red-200 text-red-800',
    deleteHover:   isDark ? '${c.deleteHover}' : '${c.deleteHover}',
  };
  const { callToolEndpoint, loading } = useClaudeAPI();
  const resultsRef = useRef(null);
  const fileInputRef = useRef(null);

  // Persistent
  const [history, setHistory] = usePersistentState('mise-en-place-history', []);
  const [showHistory, setShowHistory] = useState(false);

  // Input
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [ingredients, setIngredients] = useState('');
  const [servings, setServings] = useState('2-4');
  const [dietary, setDietary] = useState([]);
  const [timeAvailable, setTimeAvailable] = useState('60');
  const [skillLevel, setSkillLevel] = useState('intermediate');
  const [equipment, setEquipment] = useState([]);
  const [mealType, setMealType] = useState('dinner');
  const [preferences, setPreferences] = useState('');
  const [compressing, setCompressing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Results
  const [results, setResults] = usePersistentState('miseenplace-results', null);
  const [error, setError] = useState('');
  const [showMeals, setShowMeals] = useState(true);
  const [showShopping, setShowShopping] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [showLeftovers, setShowLeftovers] = useState(false);

  useEffect(() => {
    if (results && resultsRef.current) {
      setTimeout(() => resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
    }
  }, [results]);

  // ══════════════════════════════════════════
  // IMAGE HANDLING
  // ══════════════════════════════════════════
  const processFile = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) { setError('Please upload an image file'); return; }
    setError(''); setCompressing(true);
    try {
      const compressed = await compressImage(file, CompressionPresets.API_UPLOAD);
      setImagePreview(compressed); setImageBase64(compressed);
    } catch (err) { setError(err.message || 'Failed to process image.'); }
    finally { setCompressing(false); }
  }, []);

  const handleImageUpload = useCallback((e) => { if (e.target.files[0]) processFile(e.target.files[0]); }, [processFile]);
  const handleDragOver = useCallback((e) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback(() => setIsDragging(false), []);
  const handleDrop = useCallback((e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]); }, [processFile]);
  const clearImage = useCallback(() => { setImagePreview(null); setImageBase64(null); if (fileInputRef.current) fileInputRef.current.value = ''; }, []);

  // ══════════════════════════════════════════
  // TOGGLES
  // ══════════════════════════════════════════
  const toggleDietary = useCallback((val) => {
    setDietary(prev => prev.includes(val) ? prev.filter(d => d !== val) : [...prev, val]);
  }, []);

  const toggleEquipment = useCallback((val) => {
    setEquipment(prev => prev.includes(val) ? prev.filter(e => e !== val) : [...prev, val]);
  }, []);

  // ══════════════════════════════════════════
  // API
  // ══════════════════════════════════════════
  const plan = useCallback(async () => {
    if (!ingredients.trim() && !imageBase64) { setError('List your ingredients or upload a fridge photo'); return; }
    setError(''); setResults(null);
    try {
      const data = await callToolEndpoint('mise-en-place', {
        imageBase64: imageBase64 || null,
        ingredients: ingredients.trim() || null,
        servings, dietary, timeAvailable: `${timeAvailable} minutes`,
        skillLevel, equipment, mealType,
        preferences: preferences.trim() || null,
      });
      setResults(data);
      saveToHistory(data);
    } catch (err) { setError(err.message || 'Failed to build meal plan.'); }
  }, [ingredients, imageBase64, servings, dietary, timeAvailable, skillLevel, equipment, mealType, preferences, callToolEndpoint]);

  const handleReset = useCallback(() => {
    clearImage(); setIngredients(''); setPreferences('');
    setResults(null); setError('');
  }, [clearImage]);

  // ══════════════════════════════════════════
  // HISTORY
  // ══════════════════════════════════════════
  const saveToHistory = useCallback((data) => {
    const entry = {
      id: `mep_${Date.now()}`, date: new Date().toISOString(),
      meal: data.selected_meal?.name || data.meals?.[0]?.name || 'Meal plan',
      totalTime: data.battle_plan?.total_time || '',
      results: data,
      preview: (data.selected_meal?.name || data.meals?.[0]?.name || 'Meal plan').slice(0, 40),
    };
    setHistory(prev => [entry, ...prev].slice(0, 6));
  }, [setHistory]);

  // ══════════════════════════════════════════
  // COPY
  // ══════════════════════════════════════════
  const buildFullCopy = useCallback(() => {
    if (!results) return '';
    const lines = ['🍳 Mise en Place — Battle Plan', ''];
    if (results.selected_meal) lines.push(`Making: ${results.selected_meal.name}`, results.selected_meal.reason, '');
    if (results.battle_plan?.phases) {
      lines.push('TIMELINE:');
      results.battle_plan.phases.forEach(p => {
        lines.push(`[${p.time_mark}] ${p.action} (${p.duration})`);
        if (p.parallel_task) lines.push(`  ↳ Meanwhile: ${p.parallel_task}`);
      });
      lines.push('');
    }
    if (results.shopping_list?.essential?.length) {
      lines.push('QUICK SHOP:', ...results.shopping_list.essential.map(i => `  • ${i}`), '');
    }
    lines.push('— Generated by DeftBrain · deftbrain.com');
    return lines.join('\n');
  }, [results]);

  // ══════════════════════════════════════════
  // RENDER HELPERS
  // ══════════════════════════════════════════
  const Pill = ({ active, onClick, children }) => (
    <button onClick={onClick}
      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${active ? c.pillActive : c.pillInactive}`}>
      {active && <span className="mr-1">✓</span>}{children}
    </button>
  );

  const Section = ({ title, emoji, open, onToggle, badge, children }) => (
    <div className={`${c.card} border rounded-xl overflow-hidden`}>
      <button onClick={onToggle} className="w-full flex items-center justify-between p-5 text-left hover:opacity-80">
        <div className="flex items-center gap-3">
          <span className="text-lg">{emoji}</span>
          <span className={`text-base font-semibold ${c.text}`}>{title}</span>
          {badge && <span className={`text-xs px-2 py-0.5 rounded-full ${c.badge}`}>{badge}</span>}
        </div>
        <span className={`text-xs ${c.textMuted}`}>{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className={`px-5 pb-5 border-t ${c.border}`}>{children}</div>}
    </div>
  );

  // ══════════════════════════════════════════
  // RENDER: Input
  // ══════════════════════════════════════════
  const renderInput = () => (
    <div className="space-y-4">
      {/* Ingredients */}
      <div className={`${c.card} border rounded-xl p-5`}>
        <label className={`text-base font-bold ${c.text} mb-1 block`}>What's in your kitchen?</label>
        <p className={`text-sm ${c.textMuted} mb-4`}>List what you have, or snap a photo of your fridge — we'll figure out what to make.</p>
        <textarea value={ingredients} onChange={e => setIngredients(e.target.value)}
          placeholder="e.g., chicken thighs, rice, bell peppers, garlic, soy sauce, half an onion, some wilting spinach..."
          className={`w-full h-24 p-4 border-2 rounded-xl ${c.input} outline-none focus:ring-2 resize-none text-sm`} />
      </div>

      {/* Fridge photo */}
      <div className={`${c.card} border rounded-xl p-5`}>
        <label className={`text-xs font-bold ${c.textSecondary} uppercase tracking-wide mb-3 block`}>📷 Fridge photo (optional)</label>
        {compressing ? (
          <div className={`border-2 border-dashed rounded-xl p-6 text-center ${c.dropActive}`}>
            <span className="animate-spin inline-block text-2xl mb-2">{tool?.icon ?? '⚙️'}</span>
            <p className={`text-sm font-semibold ${c.text}`}>Processing...</p>
          </div>
        ) : !imagePreview ? (
          <div className={`border-2 border-dashed rounded-xl p-5 text-center transition-colors ${isDragging ? c.dropActive : c.dropzone}`}
            onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="mep-upload" />
            <span className="text-2xl block mb-2">🥑</span>
            <label htmlFor="mep-upload" className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer ${c.btnPrimary}`}>Upload Photo</label>
            <p className={`text-xs ${c.textMuted} mt-2`}>{isDragging ? 'Drop it!' : 'Snap your fridge or pantry'}</p>
          </div>
        ) : (
          <div className="relative">
            <img src={imagePreview} alt="Fridge" className={`w-full max-h-48 object-contain rounded-xl border ${c.border}`} />
            <button onClick={clearImage} className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded-lg text-xs font-bold">✕</button>
          </div>
        )}
      </div>

      {/* Settings grid */}
      <div className={`${c.card} border rounded-xl p-5 space-y-4`}>
        <div>
          <label className={`text-xs font-bold ${c.textSecondary} uppercase tracking-wide mb-2 block`}>🍽️ Meal type</label>
          <div className="flex flex-wrap gap-1.5">
            {MEAL_OPTIONS.map(opt => (
              <Pill key={opt.value} active={mealType === opt.value} onClick={() => setMealType(opt.value)}>{opt.label}</Pill>
            ))}
          </div>
        </div>

        <div>
          <label className={`text-xs font-bold ${c.textSecondary} uppercase tracking-wide mb-2 block`}>⏱️ Time available</label>
          <div className="flex flex-wrap gap-1.5">
            {TIME_OPTIONS.map(opt => (
              <Pill key={opt.value} active={timeAvailable === opt.value} onClick={() => setTimeAvailable(opt.value)}>{opt.label}</Pill>
            ))}
          </div>
        </div>

        <div>
          <label className={`text-xs font-bold ${c.textSecondary} uppercase tracking-wide mb-2 block`}>🔰 Skill level</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {SKILL_OPTIONS.map(opt => (
              <button key={opt.value} onClick={() => setSkillLevel(opt.value)}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  skillLevel === opt.value ? `${c.pillActive} border-[rgb(74,106,138)]` : `${c.card} hover:border-[rgb(138,130,117)]`
                }`}>
                <span className={`text-sm font-medium ${skillLevel === opt.value ? '' : c.textSecondary}`}>{opt.label}</span>
                <p className={`text-xs mt-0.5 ${c.textMuted}`}>{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={`text-xs font-bold ${c.textSecondary} uppercase tracking-wide mb-2 block`}>🥗 Dietary needs</label>
          <div className="flex flex-wrap gap-1.5">
            {DIETARY_OPTIONS.map(opt => (
              <Pill key={opt} active={dietary.includes(opt)} onClick={() => toggleDietary(opt)}>{opt}</Pill>
            ))}
          </div>
        </div>

        <div>
          <label className={`text-xs font-bold ${c.textSecondary} uppercase tracking-wide mb-2 block`}>🔧 Equipment</label>
          <div className="flex flex-wrap gap-1.5">
            {EQUIPMENT_OPTIONS.map(opt => (
              <Pill key={opt} active={equipment.includes(opt)} onClick={() => toggleEquipment(opt)}>{opt}</Pill>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={`text-xs font-bold ${c.textSecondary} uppercase tracking-wide mb-1 block`}>👥 Servings</label>
            <input type="text" value={servings} onChange={e => setServings(e.target.value)}
              placeholder="e.g., 2-4" className={`w-full px-3 py-2 rounded-xl border text-sm ${c.input} outline-none`} />
          </div>
          <div>
            <label className={`text-xs font-bold ${c.textSecondary} uppercase tracking-wide mb-1 block`}>💬 Preferences</label>
            <input type="text" value={preferences} onChange={e => setPreferences(e.target.value)}
              placeholder="e.g., 'something comforting'" className={`w-full px-3 py-2 rounded-xl border text-sm ${c.input} outline-none`} />
          </div>
        </div>
      </div>

      <button onClick={plan}
        disabled={loading || (!ingredients.trim() && !imageBase64)}
        className={`w-full py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
          loading || (!ingredients.trim() && !imageBase64) ? `${c.btnSecondary} opacity-50` : c.btnPrimary
        }`}>
        {loading ? <><span className="animate-spin inline-block">{tool?.icon ?? '⚙️'}</span> Building your battle plan...</>
          : <><span>🍳</span> Build My Battle Plan</>}
      </button>
    </div>
  );

  // ══════════════════════════════════════════
  // RENDER: Battle Plan Timeline
  // ══════════════════════════════════════════
  const renderBattlePlan = () => {
    const bp = results?.battle_plan;
    if (!bp?.phases?.length) return null;

    return (
      <div className={`${c.card} border rounded-xl p-5`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚔️</span>
            <span className={`text-base font-bold ${c.text}`}>Battle Plan</span>
          </div>
          {bp.total_time && <span className={`text-xs font-bold px-3 py-1 rounded-full ${c.badge}`}>🕐 {bp.total_time}</span>}
        </div>

        <div className="relative">
          {/* Timeline line */}
          <div className={`absolute left-3 top-3 bottom-3 w-0.5 ${c.timelineLine}`} />

          <div className="space-y-3">
            {bp.phases.map((phase, idx) => (
              <div key={idx} className={`relative pl-9 ${phase.critical_timing ? '' : ''}`}>
                {/* Dot */}
                <div className={`absolute left-1.5 top-3 w-3 h-3 rounded-full ${phase.critical_timing ? 'bg-[rgb(181,74,63)]' : c.timelineDot}`} />

                <div className={`p-4 rounded-xl border ${phase.critical_timing ? c.criticalBg : c.timelineBg}`}>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-xs font-mono font-bold ${c.textMuted}`}>{phase.time_mark}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${c.badge}`}>{phase.duration}</span>
                    {phase.critical_timing && <span className={`text-xs font-bold ${c.criticalText}`}>⏰ Timing critical</span>}
                  </div>
                  <p className={`text-sm font-semibold ${c.text} mb-1`}>{phase.action}</p>
                  {phase.details && <p className={`text-xs ${c.textSecondary}`}>{phase.details}</p>}
                  {phase.parallel_task && (
                    <div className={`mt-2 p-2 rounded-lg border ${c.parallelBg}`}>
                      <p className={`text-xs ${c.parallelText}`}>↳ <strong>Meanwhile:</strong> {phase.parallel_task}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Checkpoints */}
        {bp.checkpoints?.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className={`text-xs font-bold ${c.textMuted} uppercase`}>🔍 Checkpoints</p>
            {bp.checkpoints.map((cp, idx) => (
              <div key={idx} className={`p-3 rounded-lg ${c.inset}`}>
                <p className={`text-xs ${c.text}`}>
                  <strong className={c.textMuted}>@{cp.at}:</strong> {cp.check}
                </p>
                {cp.if_not_ready && <p className={`text-xs ${c.textMuted} mt-0.5`}>If not ready: {cp.if_not_ready}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ══════════════════════════════════════════
  // RENDER: Results
  // ══════════════════════════════════════════
  const renderResults = () => {
    if (!results) return null;

    return (
      <div ref={resultsRef} className="space-y-4 mt-4">
        {/* Selected Meal header */}
        {results.selected_meal && (
          <div className={`p-5 rounded-2xl border-2 ${c.tipBg}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">👨‍🍳</span>
              <span className={`text-sm font-bold ${c.tipText}`}>Tonight's move</span>
            </div>
            <p className={`text-lg font-bold ${c.text}`}>{results.selected_meal.name}</p>
            <p className={`text-sm ${c.tipText} mt-1`}>{results.selected_meal.reason}</p>
          </div>
        )}

        {/* Detected ingredients */}
        {results.detected_ingredients?.length > 0 && (
          <div className={`p-4 rounded-xl ${c.inset}`}>
            <p className={`text-xs font-bold ${c.textMuted} mb-2`}>🥑 Working with</p>
            <div className="flex flex-wrap gap-1.5">
              {results.detected_ingredients.map((ing, i) => (
                <span key={i} className={`px-2 py-0.5 rounded text-xs font-medium ${c.badge}`}>{ing}</span>
              ))}
            </div>
          </div>
        )}

        {/* Meal options */}
        {results.meals?.length > 0 && (
          <Section title="Meal Options" emoji="🍽️" open={showMeals} onToggle={() => setShowMeals(!showMeals)}
            badge={`${results.meals.length} ideas`}>
            <div className="space-y-3 mt-4">
              {results.meals.map((meal, idx) => (
                <div key={idx} className={`p-4 rounded-xl border ${c.cardAlt}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-bold ${c.text}`}>{meal.name}</span>
                    <div className="flex gap-1.5">
                      {meal.total_time && <span className={`text-xs px-2 py-0.5 rounded-full ${c.badge}`}>🕐 {meal.total_time}</span>}
                      {meal.difficulty && <span className={`text-xs px-2 py-0.5 rounded-full ${c.badge}`}>{meal.difficulty}</span>}
                    </div>
                  </div>
                  <p className={`text-xs ${c.textSecondary} mb-2`}>{meal.description}</p>
                  <p className={`text-xs ${c.textMuted} italic`}>💡 {meal.why_this_works}</p>
                  {meal.flavor_tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {meal.flavor_tags.map((tag, i) => (
                        <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded ${c.pillInactive}`}>{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* THE BATTLE PLAN */}
        {renderBattlePlan()}

        {/* Shopping list */}
        {results.shopping_list && (
          <Section title="Quick Shopping List" emoji="🛒" open={showShopping}
            onToggle={() => setShowShopping(!showShopping)}>
            <div className="mt-4 space-y-3">
              {results.shopping_list.essential?.length > 0 && (
                <div>
                  <p className={`text-xs font-bold ${c.label} mb-1`}>Essential</p>
                  {results.shopping_list.essential.map((item, i) => (
                    <p key={i} className={`text-sm ${c.text} mb-0.5`}>• {item}</p>
                  ))}
                </div>
              )}
              {results.shopping_list.nice_to_have?.length > 0 && (
                <div>
                  <p className={`text-xs font-bold ${c.textMuted} mb-1`}>Nice to have</p>
                  {results.shopping_list.nice_to_have.map((item, i) => (
                    <p key={i} className={`text-sm ${c.textMuted} mb-0.5`}>• {item}</p>
                  ))}
                </div>
              )}
            </div>
          </Section>
        )}

        {/* Technique Tips */}
        {results.technique_tips?.length > 0 && (
          <Section title="Pro Tips" emoji="💡" open={showTips} onToggle={() => setShowTips(!showTips)}>
            <div className="space-y-3 mt-4">
              {results.technique_tips.map((tip, idx) => (
                <div key={idx} className={`p-4 rounded-xl border ${c.tipBg}`}>
                  <p className={`text-sm font-semibold ${c.tipText} mb-1`}>{tip.tip}</p>
                  <p className={`text-xs ${c.tipText}`}>{tip.why}</p>
                  <span className={`text-[10px] ${c.textMuted} mt-1 block`}>{tip.skill_level} level</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Leftovers */}
        {results.leftovers_strategy && (
          <Section title="Tomorrow's Meal (Leftovers)" emoji="♻️" open={showLeftovers}
            onToggle={() => setShowLeftovers(!showLeftovers)}>
            <div className="mt-4 space-y-2">
              <p className={`text-xs ${c.textMuted}`}>📦 <strong>Storage:</strong> {results.leftovers_strategy.storage}</p>
              <div className={`p-4 rounded-xl border ${c.success}`}>
                <p className={`text-sm font-bold ${c.success} mb-1`}>🔄 Transform into: {results.leftovers_strategy.transform_into}</p>
                <p className={`text-xs ${c.success}`}>{results.leftovers_strategy.instructions}</p>
              </div>
            </div>
          </Section>
        )}

        {results.scaling_notes && (
          <div className={`p-3 rounded-xl ${c.inset}`}>
            <p className={`text-xs ${c.textMuted}`}>📏 <strong>Scaling:</strong> {results.scaling_notes}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <div className="flex-1"><CopyBtn content={buildFullCopy()} label="Copy Battle Plan" />
            <ActionBar copyContent={buildFullCopy()} copyLabel="Copy" /></div>
          <button onClick={handleReset}
            className={`flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 ${c.btnPrimary}`}>
            <span>🔄</span> New Plan
          </button>
        </div>

        {/* Cross-references */}
        <div className={`p-4 rounded-2xl border ${c.card}`}>
          <p className={`text-xs font-bold ${c.textMuted} uppercase tracking-wide mb-2`}>🔗 Related Tools</p>
          <div className={`space-y-1.5 text-xs ${c.textSecondary}`}>
            <p>Stuck on a bigger decision? <a href="/PlotTwist" target="_blank" rel="noopener noreferrer" className={c.textSecondaryStyle}>Plot Twist</a> untangles tough choices with multiple frameworks.</p>
            <p>Need to write a thank-you for dinner? <a href="/GhostWriter" target="_blank" rel="noopener noreferrer" className={c.textSecondaryStyle}>Ghost Writer</a> crafts polished letters from rough notes.</p>
          </div>
        </div>
      </div>
    );
  };

  // History
  const renderHistory = () => {
    if (history.length === 0) return null;
    const formatDate = (iso) => {
      try { const d = new Date(iso); const diff = Math.floor((new Date() - d) / 86400000); return diff === 0 ? 'Today' : diff === 1 ? 'Yesterday' : diff < 7 ? `${diff}d ago` : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); } catch { return ''; }
    };
    return (
      <div className={`mt-6 p-4 rounded-2xl border ${c.histBg}`}>
        <button onClick={() => setShowHistory(!showHistory)} className="w-full flex items-center gap-2 text-left">
          <span className={`text-base ${c.histAccent}`}>🍳</span>
          <span className={`text-sm font-bold ${c.text} flex-1`}>Past Plans</span>
          <span className={`text-xs ${c.textMuted}`}>{history.length}</span>
          <span className={`text-xs ${c.textMuted}`}>{showHistory ? '▲' : '▼'}</span>
        </button>
        {showHistory && (
          <div className="mt-3 space-y-2">
            {history.map(entry => (
              <div key={entry.id} className={`rounded-xl border ${c.histCard} p-3 flex items-center gap-3`}>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-semibold ${c.text} truncate`}>{entry.meal}</div>
                  <div className={`text-xs ${c.textMuted} mt-0.5`}>{formatDate(entry.date)}{entry.totalTime ? ` · ${entry.totalTime}` : ''}</div>
                </div>
                <button onClick={() => { setResults(entry.results); setShowHistory(false); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold ${c.btnSecondary}`}>View</button>
                <button onClick={() => setHistory(prev => prev.filter(h => h.id !== entry.id))}
                  className={`px-2 py-1.5 rounded-lg text-xs ${c.btnSecondary} ${c.deleteHover}`}>🗑️</button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };


  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div>
          <h2 className={`text-2xl font-bold ${c.text}`}>Mise en Place <span className="text-xl">🍳</span></h2>
          <p className={`text-sm ${c.textMuted}`}>Turn whatever's in your kitchen into a meal — with a minute-by-minute battle plan</p>
        </div>
      </div>
      {!results && renderInput()}
      {results && renderResults()}
      {error && (
        <div className={`mt-4 p-4 ${c.danger} border rounded-xl flex items-start gap-3`}>
          <span className={`text-base ${c.danger}`}>⚠️</span>
          <p className={`text-sm ${c.danger}`}>{error}</p>
        </div>
      )}
      {renderHistory()}
        <div className={`mt-6 pt-4 border-t text-sm ${c.border} ${c.textMuted}`}>
          <p className="mb-2 font-medium">You might also like:</p>
          <div className="flex flex-wrap gap-2">
            {[{slug:'recipe-chaos-solver',label:'🍳 Recipe Chaos Solver'},{slug:'batch-flow',label:'📦 Batch Flow'},{slug:'mise-en-place',label:'🔪 Mise en Place'}].map(({slug,label})=>(
              <a key={slug} href={`/tool/${slug}`} className={linkStyle}>{label}</a>
            ))}
          </div>
        </div>
    </div>
  );
};

MiseEnPlace.displayName = 'MiseEnPlace';
export default MiseEnPlace;
