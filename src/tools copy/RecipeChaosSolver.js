import React, { useState, useRef, useCallback } from 'react';
import { ChefHat, Loader2, AlertCircle, Camera, Upload, X, Check, Sparkles, Clock, AlertTriangle, Flame, ThermometerSun, Beaker, Utensils, Egg, Scale, RefreshCw, ChevronDown, ChevronUp, Lightbulb, Heart, Copy, Zap, Shield, Image as ImageIcon } from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';

const RecipeChaosSolver = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const recipePhotoRef = useRef(null);
  const pantryPhotoRef = useRef(null);

  // ── Input state ──
  const [inputMode, setInputMode] = useState('quick'); // 'quick', 'paste', 'photo'
  const [quickDish, setQuickDish] = useState('');
  const [recipeText, setRecipeText] = useState('');
  const [recipeImagePreview, setRecipeImagePreview] = useState(null);
  const [recipeImageBase64, setRecipeImageBase64] = useState(null);

  // ── Problem state ──
  const [problemCategory, setProblemCategory] = useState('missing_ingredient');
  const [problemDescription, setProblemDescription] = useState('');
  const [missingIngredient, setMissingIngredient] = useState('');
  const [availableSubstitutes, setAvailableSubstitutes] = useState('');

  // ── Context state ──
  const [dietaryRestrictions, setDietaryRestrictions] = useState('');
  const [cookingSkill, setCookingSkill] = useState('beginner');
  const [timeAvailable, setTimeAvailable] = useState('');
  const [timePressure, setTimePressure] = useState('');
  const [embraceChaos, setEmbraceChaos] = useState(false);

  // ── Pantry photo ──
  const [pantryImagePreview, setPantryImagePreview] = useState(null);
  const [pantryImageBase64, setPantryImageBase64] = useState(null);

  // ── Available ingredients (for classic mode) ──
  const [availableIngredients, setAvailableIngredients] = useState('');

  // ── Image compression state ──
  const [compressingRecipe, setCompressingRecipe] = useState(false);
  const [compressingPantry, setCompressingPantry] = useState(false);

  // ── Results ──
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [completedSteps, setCompletedSteps] = useState({});
  const [showScience, setShowScience] = useState({});
  const [copiedRecipe, setCopiedRecipe] = useState(false);

  // Theme colors
  const c = {
    bg: isDark ? 'bg-zinc-900' : 'bg-gradient-to-br from-amber-50 via-orange-50 to-red-50',
    card: isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-slate-200',
    cardHover: isDark ? 'hover:border-zinc-500' : 'hover:border-orange-300',
    input: isDark
      ? 'bg-zinc-900 border-zinc-700 text-zinc-50 placeholder:text-zinc-500 focus:border-orange-500 focus:ring-orange-500/20'
      : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:ring-orange-200',
    text: isDark ? 'text-zinc-50' : 'text-slate-900',
    textSecondary: isDark ? 'text-zinc-400' : 'text-slate-600',
    textMuted: isDark ? 'text-zinc-500' : 'text-slate-500',
    label: isDark ? 'text-zinc-300' : 'text-slate-700',
    accent: isDark ? 'text-orange-400' : 'text-orange-600',
    btnPrimary: isDark
      ? 'bg-orange-600 hover:bg-orange-700 text-white'
      : 'bg-orange-600 hover:bg-orange-700 text-white',
    btnSecondary: isDark
      ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-50'
      : 'bg-slate-100 hover:bg-slate-200 text-slate-700',
    btnEmergency: isDark
      ? 'bg-red-600 hover:bg-red-700 text-white ring-2 ring-red-400/50'
      : 'bg-red-600 hover:bg-red-700 text-white ring-2 ring-red-300',
    tabActive: isDark ? 'bg-orange-600 text-white' : 'bg-orange-600 text-white',
    tabInactive: isDark ? 'bg-zinc-800 text-zinc-400 hover:text-zinc-200' : 'bg-white text-slate-500 hover:text-slate-700',
    dropzone: isDark
      ? 'border-zinc-600 bg-zinc-800/50 hover:border-orange-500'
      : 'border-slate-300 bg-slate-50 hover:border-orange-400 hover:bg-orange-50',
    successBox: isDark ? 'bg-emerald-900/30 border-emerald-700' : 'bg-emerald-50 border-emerald-300',
    warningBox: isDark ? 'bg-amber-900/30 border-amber-700' : 'bg-amber-50 border-amber-300',
    dangerBox: isDark ? 'bg-red-900/30 border-red-700' : 'bg-red-50 border-red-300',
    infoBox: isDark ? 'bg-blue-900/30 border-blue-700' : 'bg-blue-50 border-blue-200',
    scienceBox: isDark ? 'bg-violet-900/30 border-violet-700' : 'bg-violet-50 border-violet-200',
    chaosBox: isDark ? 'bg-fuchsia-900/30 border-fuchsia-700' : 'bg-fuchsia-50 border-fuchsia-200',
    stepDone: isDark ? 'bg-emerald-900/30 border-emerald-600' : 'bg-emerald-50 border-emerald-300',
    stepPending: isDark ? 'bg-zinc-800 border-zinc-600' : 'bg-white border-slate-200',
    pantryBox: isDark ? 'bg-teal-900/30 border-teal-700' : 'bg-teal-50 border-teal-200',
  };

  // ── Problem categories ──
  const problemCategories = [
    { id: 'missing_ingredient', label: 'Missing Ingredient', emoji: '🥚' },
    { id: 'technique_failure', label: 'Technique Failure', emoji: '🔥' },
    { id: 'timing_issue', label: 'Timing / Temperature', emoji: '⏱️' },
    { id: 'consistency', label: 'Consistency Problem', emoji: '🧪' },
    { id: 'equipment_missing', label: 'Equipment Missing', emoji: '🍳' },
    { id: 'quantity_error', label: 'Quantity Error', emoji: '⚖️' },
  ];

  // ── Quick problem buttons ──
  const quickProblems = [
    { label: '🚫 No eggs', problem: 'missing_ingredient', desc: 'I don\'t have eggs', ingredient: 'eggs' },
    { label: '💔 Sauce broke', problem: 'technique_failure', desc: 'My sauce broke/separated' },
    { label: '🔥 It\'s burning!', problem: 'timing_issue', desc: 'My food is burning or overcooking' },
    { label: '🫠 Too thin', problem: 'consistency', desc: 'My sauce/batter is too thin' },
    { label: '🧱 Too thick', problem: 'consistency', desc: 'My sauce/batter is too thick' },
    { label: '🍞 Won\'t rise', problem: 'technique_failure', desc: 'My dough/bread won\'t rise' },
    { label: '🥩 Overcooked', problem: 'technique_failure', desc: 'I overcooked my protein/meat' },
    { label: '🧂 Too salty', problem: 'consistency', desc: 'I added too much salt' },
  ];

  // ══════════════════════════════════════════════════
  // IMAGE COMPRESSION — inline canvas-based resizer
  // Max 1024×1024, JPEG @ 0.8 quality, ≤800KB target
  // Matches project's CompressionPresets.API_UPLOAD
  // ══════════════════════════════════════════════════
  const compressImageFile = (file) => {
    return new Promise((resolve, reject) => {
      if (!file || !file.type.startsWith('image/')) {
        reject(new Error('Invalid file type'));
        return;
      }

      const maxDim = 1024;
      const quality = 0.8;
      const maxSizeKB = 800;
      const origSizeKB = Math.round(file.size / 1024);
      console.log(`[RecipeChaosSolver] Original image: ${origSizeKB}KB (${file.type})`);

      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Failed to read image file'));
      reader.onload = (e) => {
        const img = new Image();
        img.onerror = () => reject(new Error('Failed to load image'));
        img.onload = () => {
          try {
            let width = img.width;
            let height = img.height;

            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height / width) * maxDim);
                width = maxDim;
              } else {
                width = Math.round((width / height) * maxDim);
                height = maxDim;
              }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);

            let dataUrl = canvas.toDataURL('image/jpeg', quality);
            let sizeKB = Math.round((dataUrl.length * 0.75) / 1024);

            // Retry with lower quality if still too large
            if (sizeKB > maxSizeKB) {
              console.log(`[RecipeChaosSolver] First pass ${sizeKB}KB > ${maxSizeKB}KB, retrying at 0.6 quality...`);
              dataUrl = canvas.toDataURL('image/jpeg', 0.6);
              sizeKB = Math.round((dataUrl.length * 0.75) / 1024);
            }

            // Resize further if still too large
            if (sizeKB > maxSizeKB) {
              console.log(`[RecipeChaosSolver] Still ${sizeKB}KB, resizing to 768px...`);
              const smallCanvas = document.createElement('canvas');
              const scale = 768 / Math.max(width, height);
              smallCanvas.width = Math.round(width * scale);
              smallCanvas.height = Math.round(height * scale);
              const sCtx = smallCanvas.getContext('2d');
              sCtx.imageSmoothingEnabled = true;
              sCtx.imageSmoothingQuality = 'high';
              sCtx.drawImage(canvas, 0, 0, smallCanvas.width, smallCanvas.height);
              dataUrl = smallCanvas.toDataURL('image/jpeg', 0.6);
              sizeKB = Math.round((dataUrl.length * 0.75) / 1024);
            }

            const savings = origSizeKB > 0 ? Math.round((1 - sizeKB / origSizeKB) * 100) : 0;
            console.log(`[RecipeChaosSolver] Compressed: ${sizeKB}KB (${savings}% smaller, ${width}×${height}px)`);
            resolve(dataUrl);
          } catch (err) {
            reject(new Error(`Compression failed: ${err.message}`));
          }
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  // ── Compressed upload handlers ──
  const handleRecipePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Please upload an image file'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('Image must be less than 10MB'); return; }

    setError('');
    setCompressingRecipe(true);
    try {
      const compressed = await compressImageFile(file);
      setRecipeImagePreview(compressed);
      setRecipeImageBase64(compressed);
      console.log('[RecipeChaosSolver] Recipe image compressed and ready');
    } catch (err) {
      setError(err.message || 'Failed to process image. Try a different photo.');
      console.error('Recipe image error:', err);
    } finally {
      setCompressingRecipe(false);
    }
  };

  const handlePantryPhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Please upload an image file'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('Image must be less than 10MB'); return; }

    setError('');
    setCompressingPantry(true);
    try {
      const compressed = await compressImageFile(file);
      setPantryImagePreview(compressed);
      setPantryImageBase64(compressed);
      console.log('[RecipeChaosSolver] Pantry image compressed and ready');
    } catch (err) {
      setError(err.message || 'Failed to process image. Try a different photo.');
      console.error('Pantry image error:', err);
    } finally {
      setCompressingPantry(false);
    }
  };

  const handleDrop = useCallback(async (e, type) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    const setCompressing = type === 'recipe' ? setCompressingRecipe : setCompressingPantry;
    const setPreview = type === 'recipe' ? setRecipeImagePreview : setPantryImagePreview;
    const setBase64 = type === 'recipe' ? setRecipeImageBase64 : setPantryImageBase64;

    setCompressing(true);
    try {
      const compressed = await compressImageFile(file);
      setPreview(compressed);
      setBase64(compressed);
    } catch (err) {
      setError(err.message || 'Failed to process dropped image');
    } finally {
      setCompressing(false);
    }
  }, []);

  // ── Quick problem select ──
  const selectQuickProblem = (qp) => {
    setProblemCategory(qp.problem);
    setProblemDescription(qp.desc);
    if (qp.ingredient) setMissingIngredient(qp.ingredient);
  };

  // ── Submit ──
  const handleSolve = async () => {
    let recipeContext = '';
    if (inputMode === 'quick' && quickDish.trim()) {
      recipeContext = `I'm making: ${quickDish.trim()}`;
    } else if (inputMode === 'paste' && recipeText.trim()) {
      recipeContext = recipeText.trim();
    } else if (inputMode === 'photo' && recipeImageBase64) {
      recipeContext = '[Recipe photo provided]';
    } else if (availableIngredients.trim()) {
      recipeContext = `Available ingredients: ${availableIngredients.trim()}`;
    }

    if (!recipeContext && !problemDescription.trim() && !availableIngredients.trim() && !recipeImageBase64 && !pantryImageBase64) {
      setError('Please describe what you\'re making, upload a photo, or describe the problem');
      return;
    }

    setError('');
    setResults(null);
    setCompletedSteps({});

    try {
      const payload = {
        recipeContext,
        recipeImageBase64: inputMode === 'photo' ? recipeImageBase64 : null,
        pantryImageBase64: pantryImageBase64 || null,
        problemCategory,
        problemDescription: problemDescription.trim(),
        missingIngredient: missingIngredient.trim(),
        availableSubstitutes: availableSubstitutes.trim(),
        availableIngredients: availableIngredients.trim(),
        dietaryRestrictions: dietaryRestrictions.trim(),
        cookingSkill,
        timeAvailable: timeAvailable.trim(),
        timePressure: timePressure.trim(),
        embraceChaos,
      };

      console.log('[RecipeChaosSolver] Sending:', {
        hasRecipeImage: !!payload.recipeImageBase64,
        recipeImageKB: payload.recipeImageBase64 ? Math.round((payload.recipeImageBase64.length * 0.75) / 1024) : 0,
        hasPantryImage: !!payload.pantryImageBase64,
        pantryImageKB: payload.pantryImageBase64 ? Math.round((payload.pantryImageBase64.length * 0.75) / 1024) : 0,
        problemCategory,
      });

      const data = await callToolEndpoint('recipe-chaos-solver', payload);
      console.log('[RecipeChaosSolver] Response received:', Object.keys(data));
      setResults(data);
    } catch (err) {
      console.error('[RecipeChaosSolver] API error:', err);
      setError(err.message || 'Failed to generate solution. Please try again.');
    }
  };

  // ── Helpers ──
  const toggleStep = (rIdx, sIdx) => {
    const key = `${rIdx}-${sIdx}`;
    setCompletedSteps(prev => ({ ...prev, [key]: !prev[key] }));
  };
  const toggleScience = (idx) => setShowScience(prev => ({ ...prev, [idx]: !prev[idx] }));

  const copyModifiedRecipe = (recipe) => {
    const text = [
      recipe.name, recipe.description, '',
      'Ingredients:',
      ...(recipe.ingredients_used || []).map(i => `- ${i}`),
      ...(recipe.missing_staples || []).map(i => `- ${i} (you may need)`),
      '', 'Instructions:',
      ...(recipe.instructions || recipe.solution_steps || []).map((s, i) => `${i + 1}. ${s}`),
      '', recipe.tips ? `Tip: ${recipe.tips}` : '',
      recipe.preventive_tip ? `Next time: ${recipe.preventive_tip}` : '',
    ].filter(Boolean).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedRecipe(true);
    setTimeout(() => setCopiedRecipe(false), 2000);
  };

  const getProbabilityConfig = (prob) => {
    const p = parseInt(prob) || 0;
    if (p >= 90) return { label: 'This will work great', color: c.successBox, textColor: isDark ? 'text-emerald-300' : 'text-emerald-800', barColor: 'bg-emerald-500', emoji: '✅' };
    if (p >= 70) return { label: 'Will work, flavor may differ', color: c.warningBox, textColor: isDark ? 'text-amber-300' : 'text-amber-800', barColor: 'bg-amber-500', emoji: '👍' };
    if (p >= 50) return { label: 'Emergency measure — not ideal', color: c.warningBox, textColor: isDark ? 'text-amber-300' : 'text-amber-800', barColor: 'bg-amber-500', emoji: '⚠️' };
    return { label: 'This dish may not be salvageable', color: c.dangerBox, textColor: isDark ? 'text-red-300' : 'text-red-800', barColor: 'bg-red-500', emoji: '😬' };
  };

  const getDifficultyBadge = (diff) => {
    const d = (diff || '').toLowerCase();
    if (d === 'easy' || d === 'beginner') return { label: 'Easy fix', color: isDark ? 'bg-emerald-900/40 text-emerald-300' : 'bg-emerald-100 text-emerald-700' };
    if (d === 'moderate' || d === 'intermediate' || d === 'medium') return { label: 'Some technique needed', color: isDark ? 'bg-amber-900/40 text-amber-300' : 'bg-amber-100 text-amber-700' };
    return { label: 'Advanced technique', color: isDark ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-700' };
  };

  const handleReset = () => {
    setQuickDish(''); setRecipeText('');
    setRecipeImagePreview(null); setRecipeImageBase64(null);
    setPantryImagePreview(null); setPantryImageBase64(null);
    setProblemDescription(''); setMissingIngredient('');
    setAvailableSubstitutes(''); setAvailableIngredients('');
    setTimePressure(''); setResults(null); setError('');
    setCompletedSteps({});
  };

  return (
    <div className={`min-h-screen ${c.bg} py-8 px-4`}>
      <div className="max-w-5xl mx-auto">

        {/* ── Header ── */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-3 mb-2">
            <div className={`p-3 rounded-2xl ${isDark ? 'bg-orange-900/40' : 'bg-orange-100'}`}>
              <ChefHat className={`w-7 h-7 ${c.accent}`} />
            </div>
            <h1 className={`text-3xl font-bold ${c.text}`} style={{ fontFamily: "'Georgia', serif" }}>
              Recipe Chaos Solver
            </h1>
          </div>
          <p className={c.textSecondary}>Cooking rescue — fix mistakes, swap ingredients, save dinner</p>
        </div>

        {/* ══════════════ QUICK PROBLEM BUTTONS ══════════════ */}
        <div className={`${c.card} border rounded-2xl shadow-sm p-5 mb-5`}>
          <div className={`text-sm font-semibold ${c.label} mb-3 flex items-center gap-2`}>
            <Zap className="w-4 h-4" /> Quick Problems
          </div>
          <div className="flex flex-wrap gap-2">
            {quickProblems.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => selectQuickProblem(qp)}
                className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all border ${
                  problemDescription === qp.desc
                    ? (isDark ? 'bg-orange-700 text-white border-orange-600' : 'bg-orange-600 text-white border-orange-600')
                    : (isDark ? 'bg-zinc-800 text-zinc-300 border-zinc-600 hover:border-orange-500' : 'bg-white text-slate-600 border-slate-200 hover:border-orange-400')
                }`}
              >
                {qp.label}
              </button>
            ))}
          </div>
        </div>

        {/* ══════════════ RECIPE INPUT ══════════════ */}
        <div className={`${c.card} border rounded-2xl shadow-sm p-6 mb-5`}>
          <div className={`text-sm font-semibold ${c.label} mb-3`}>What are you making?</div>
          <div className="flex gap-2 mb-4">
            {[
              { id: 'quick', label: 'Quick Entry', icon: <ChefHat className="w-4 h-4" /> },
              { id: 'paste', label: 'Paste Recipe', icon: <Copy className="w-4 h-4" /> },
              { id: 'photo', label: 'Recipe Photo', icon: <Camera className="w-4 h-4" /> },
            ].map(tab => (
              <button key={tab.id} onClick={() => setInputMode(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all ${inputMode === tab.id ? c.tabActive : c.tabInactive}`}>
                {tab.icon}<span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {inputMode === 'quick' && (
            <input type="text" value={quickDish} onChange={(e) => setQuickDish(e.target.value)}
              placeholder='e.g. "Carbonara", "Chocolate cake", "Stir fry with chicken"'
              className={`w-full p-4 border rounded-xl outline-none text-base mb-4 ${c.input}`} />
          )}

          {inputMode === 'paste' && (
            <textarea value={recipeText} onChange={(e) => setRecipeText(e.target.value)}
              placeholder="Paste your full recipe here (ingredients + instructions)..." rows={6}
              className={`w-full p-4 border rounded-xl outline-none text-sm resize-y mb-4 ${c.input}`} />
          )}

          {inputMode === 'photo' && (
            <div className="mb-4">
              {compressingRecipe ? (
                <div className={`border-2 border-dashed rounded-2xl p-8 text-center ${c.dropzone}`}>
                  <Loader2 className={`w-10 h-10 mx-auto mb-3 animate-spin ${c.accent}`} />
                  <p className={`font-medium ${c.text}`}>Compressing image...</p>
                  <p className={`text-xs ${c.textMuted} mt-1`}>Optimizing for analysis</p>
                </div>
              ) : recipeImagePreview ? (
                <div className="relative inline-block">
                  <img src={recipeImagePreview} alt="Recipe" className="max-h-48 rounded-xl border-2 border-slate-200" />
                  <button onClick={() => { setRecipeImagePreview(null); setRecipeImageBase64(null); if (recipePhotoRef.current) recipePhotoRef.current.value = ''; }}
                    className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg">
                    <X className="w-4 h-4" />
                  </button>
                  <div className={`mt-2 text-xs ${isDark ? 'text-emerald-400' : 'text-emerald-600'} flex items-center gap-1`}>
                    <Check className="w-3 h-3" /> Image compressed &amp; ready for analysis
                  </div>
                </div>
              ) : (
                <div onClick={() => recipePhotoRef.current?.click()} onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, 'recipe')}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${c.dropzone}`}>
                  <Camera className={`w-8 h-8 mx-auto mb-2 ${c.textMuted}`} />
                  <p className={`font-medium ${c.text}`}>Snap or upload recipe photo</p>
                  <p className={`text-xs ${c.textMuted} mt-1`}>We'll read the recipe from the image</p>
                </div>
              )}
              <input ref={recipePhotoRef} type="file" accept="image/*" onChange={handleRecipePhotoUpload} className="hidden" />
            </div>
          )}

          {/* Available ingredients */}
          <div className="mb-4">
            <label className={`block text-sm font-semibold ${c.label} mb-2`}>What ingredients do you have on hand?</label>
            <textarea value={availableIngredients} onChange={(e) => setAvailableIngredients(e.target.value)}
              placeholder="e.g. chicken, rice, onion, garlic, soy sauce, eggs, butter, flour..." rows={3}
              className={`w-full p-3 border rounded-xl outline-none text-sm resize-y ${c.input}`} />
          </div>

          {/* ── Pantry photo section ── */}
          <div className="mb-4">
            <label className={`block text-sm font-semibold ${c.label} mb-2`}>
              📸 Pantry / Fridge photo <span className={`font-normal ${c.textMuted}`}>(optional — AI will identify your ingredients)</span>
            </label>
            {compressingPantry ? (
              <div className={`flex items-center gap-3 p-4 rounded-xl border-2 border-dashed ${c.dropzone}`}>
                <Loader2 className={`w-5 h-5 animate-spin ${c.accent}`} />
                <div>
                  <p className={`text-sm font-medium ${c.text}`}>Compressing pantry image...</p>
                  <p className={`text-xs ${c.textMuted}`}>Optimizing for ingredient identification</p>
                </div>
              </div>
            ) : pantryImagePreview ? (
              <div className="flex items-start gap-4">
                <div className="relative flex-shrink-0">
                  <img src={pantryImagePreview} alt="Pantry" className="w-32 h-32 object-cover rounded-xl border-2 border-slate-200" />
                  <button onClick={() => { setPantryImagePreview(null); setPantryImageBase64(null); if (pantryPhotoRef.current) pantryPhotoRef.current.value = ''; }}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow-lg">
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <div className={`flex-1 p-3 rounded-xl border ${isDark ? 'bg-emerald-900/20 border-emerald-700' : 'bg-emerald-50 border-emerald-200'}`}>
                  <div className={`flex items-center gap-1.5 text-sm font-medium ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
                    <Check className="w-4 h-4" /> Pantry image compressed &amp; ready
                  </div>
                  <p className={`text-xs mt-1 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    AI will scan this photo to identify available ingredients when you submit
                  </p>
                </div>
              </div>
            ) : (
              <div onClick={() => pantryPhotoRef.current?.click()} onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, 'pantry')}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${c.dropzone}`}>
                <div className="flex items-center justify-center gap-3">
                  <ImageIcon className={`w-6 h-6 ${c.textMuted}`} />
                  <div className="text-left">
                    <p className={`text-sm font-medium ${c.text}`}>Drop or click to upload pantry photo</p>
                    <p className={`text-xs ${c.textMuted}`}>AI will identify ingredients and suggest substitutes from what it sees</p>
                  </div>
                </div>
              </div>
            )}
            <input ref={pantryPhotoRef} type="file" accept="image/*" onChange={handlePantryPhotoUpload} className="hidden" />
          </div>
        </div>

        {/* ══════════════ PROBLEM DETAILS ══════════════ */}
        <div className={`${c.card} border rounded-2xl shadow-sm p-6 mb-5`}>
          <div className={`text-sm font-semibold ${c.label} mb-3 flex items-center gap-2`}>
            <AlertTriangle className="w-4 h-4" /> What's the problem?
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
            {problemCategories.map(cat => (
              <button key={cat.id} onClick={() => setProblemCategory(cat.id)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                  problemCategory === cat.id
                    ? (isDark ? 'bg-orange-700 text-white border-orange-600' : 'bg-orange-600 text-white border-orange-600')
                    : (isDark ? 'bg-zinc-800 text-zinc-300 border-zinc-600 hover:border-orange-500' : 'bg-white text-slate-600 border-slate-200 hover:border-orange-400')
                }`}>
                <span>{cat.emoji}</span>
                <span className="hidden sm:inline">{cat.label}</span>
                <span className="sm:hidden text-xs">{cat.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>

          <textarea value={problemDescription} onChange={(e) => setProblemDescription(e.target.value)}
            placeholder={
              problemCategory === 'missing_ingredient' ? 'Describe what ingredient you\'re missing...'
              : problemCategory === 'technique_failure' ? 'What went wrong? (sauce broke, didn\'t rise, burned, etc.)'
              : problemCategory === 'timing_issue' ? 'Describe the timing/temperature issue...'
              : problemCategory === 'consistency' ? 'Is it too thick, thin, dry, wet?'
              : problemCategory === 'equipment_missing' ? 'What equipment don\'t you have?'
              : 'Describe the quantity problem...'
            } rows={3} className={`w-full p-3 border rounded-xl outline-none text-sm resize-y mb-4 ${c.input}`} />

          {problemCategory === 'missing_ingredient' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <input type="text" value={missingIngredient} onChange={(e) => setMissingIngredient(e.target.value)}
                placeholder="Specific missing ingredient (e.g. eggs)" className={`p-3 border rounded-xl outline-none text-sm ${c.input}`} />
              <input type="text" value={availableSubstitutes} onChange={(e) => setAvailableSubstitutes(e.target.value)}
                placeholder="What could you use instead? (optional)" className={`p-3 border rounded-xl outline-none text-sm ${c.input}`} />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div>
              <label className={`block text-xs font-medium ${c.textMuted} mb-1`}>Dietary restrictions</label>
              <input type="text" value={dietaryRestrictions} onChange={(e) => setDietaryRestrictions(e.target.value)}
                placeholder="Vegetarian, gluten-free..." className={`w-full p-2.5 border rounded-lg outline-none text-sm ${c.input}`} />
            </div>
            <div>
              <label className={`block text-xs font-medium ${c.textMuted} mb-1`}>Skill level</label>
              <select value={cookingSkill} onChange={(e) => setCookingSkill(e.target.value)}
                className={`w-full p-2.5 border rounded-lg outline-none text-sm ${c.input}`}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div>
              <label className={`block text-xs font-medium ${c.textMuted} mb-1`}>Time pressure</label>
              <input type="text" value={timePressure} onChange={(e) => setTimePressure(e.target.value)}
                placeholder="Guests in 30 min..." className={`w-full p-2.5 border rounded-lg outline-none text-sm ${c.input}`} />
            </div>
          </div>

          {/* Embrace chaos toggle */}
          <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer mb-4 ${embraceChaos ? (isDark ? 'bg-fuchsia-900/30 border-fuchsia-600' : 'bg-fuchsia-50 border-fuchsia-300') : (isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-slate-50 border-slate-200')}`}
            onClick={() => setEmbraceChaos(!embraceChaos)}>
            <div className={`w-10 h-6 rounded-full transition-all flex items-center px-0.5 ${embraceChaos ? 'bg-fuchsia-500 justify-end' : (isDark ? 'bg-zinc-600' : 'bg-slate-300')}`}>
              <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
            </div>
            <div>
              <div className={`text-sm font-semibold ${c.text}`}>🎲 Embrace the Chaos</div>
              <div className={`text-xs ${c.textMuted}`}>Turn mistakes into intentional new dishes</div>
            </div>
          </div>

          {/* Images being sent indicator */}
          {(recipeImageBase64 || pantryImageBase64) && (
            <div className={`mb-4 p-3 rounded-xl border ${isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-slate-50 border-slate-200'}`}>
              <div className={`text-xs font-semibold uppercase tracking-wider ${c.textMuted} mb-1`}>Images included in analysis</div>
              <div className="flex gap-3">
                {recipeImageBase64 && inputMode === 'photo' && (
                  <span className={`inline-flex items-center gap-1 text-xs font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    <Check className="w-3 h-3" /> Recipe photo ({Math.round((recipeImageBase64.length * 0.75) / 1024)}KB)
                  </span>
                )}
                {pantryImageBase64 && (
                  <span className={`inline-flex items-center gap-1 text-xs font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    <Check className="w-3 h-3" /> Pantry photo ({Math.round((pantryImageBase64.length * 0.75) / 1024)}KB)
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Submit */}
          <button onClick={handleSolve} disabled={loading || compressingRecipe || compressingPantry}
            className={`w-full font-semibold py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm text-base ${
              loading || compressingRecipe || compressingPantry
                ? (isDark ? 'bg-zinc-700 text-zinc-400' : 'bg-slate-200 text-slate-400')
                : problemCategory === 'timing_issue' && problemDescription.toLowerCase().includes('burn')
                  ? c.btnEmergency : c.btnPrimary
            }`}>
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin" />{pantryImageBase64 ? 'Scanning pantry & finding solutions...' : 'Finding a solution...'}</>
            ) : (
              <><ChefHat className="w-5 h-5" />Rescue My Dish</>
            )}
          </button>

          {error && (
            <div className={`mt-4 p-4 rounded-xl flex items-start gap-3 ${isDark ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
              <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
              <p className={`text-sm ${isDark ? 'text-red-300' : 'text-red-800'}`}>{error}</p>
            </div>
          )}
        </div>

        {/* ══════════════════ RESULTS ══════════════════ */}
        {results && (
          <div className="space-y-5">

            {results.safety_warning && (
              <div className={`border-2 rounded-2xl p-5 ${c.dangerBox}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Shield className={`w-5 h-5 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                  <h3 className={`font-bold ${isDark ? 'text-red-300' : 'text-red-800'}`}>⚠️ Safety Warning</h3>
                </div>
                <p className={`text-sm ${isDark ? 'text-red-200' : 'text-red-700'}`}>{results.safety_warning}</p>
              </div>
            )}

            {/* ── Pantry Items Identified ── */}
            {results.pantry_items_identified && results.pantry_items_identified.length > 0 && (
              <div className={`border-2 rounded-2xl p-5 ${c.pantryBox}`}>
                <div className="flex items-center gap-2 mb-3">
                  <ImageIcon className={`w-5 h-5 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />
                  <h3 className={`font-bold ${isDark ? 'text-teal-200' : 'text-teal-800'}`}>📸 Identified from your pantry photo</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {results.pantry_items_identified.map((item, i) => (
                    <span key={i} className={`px-2.5 py-1.5 rounded-lg text-sm font-medium ${isDark ? 'bg-teal-900/40 text-teal-200 border border-teal-700' : 'bg-teal-100 text-teal-800'}`}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {results.immediate_action && (
              <div className={`border-2 rounded-2xl p-5 ${(results.success_probability || 0) < 50 ? c.dangerBox : c.warningBox}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Zap className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                  <h3 className={`text-lg font-bold ${isDark ? 'text-amber-200' : 'text-amber-900'}`}>Do this right now</h3>
                </div>
                <p className={`text-base font-medium ${isDark ? 'text-amber-100' : 'text-amber-800'}`}>{results.immediate_action}</p>
              </div>
            )}

            {results.success_probability !== undefined && (
              <div className={`border-2 rounded-2xl p-5 ${getProbabilityConfig(results.success_probability).color}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{getProbabilityConfig(results.success_probability).emoji}</span>
                    <h3 className={`font-bold ${getProbabilityConfig(results.success_probability).textColor}`}>
                      {getProbabilityConfig(results.success_probability).label}
                    </h3>
                  </div>
                  <span className={`text-2xl font-bold ${getProbabilityConfig(results.success_probability).textColor}`}>
                    {results.success_probability}%
                  </span>
                </div>
                <div className={`h-3 rounded-full overflow-hidden ${isDark ? 'bg-zinc-700' : 'bg-white/60'}`}>
                  <div className={`h-full rounded-full transition-all ${getProbabilityConfig(results.success_probability).barColor}`}
                    style={{ width: `${Math.min(100, results.success_probability)}%` }} />
                </div>
                {results.difficulty && (
                  <div className="mt-2">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${getDifficultyBadge(results.difficulty).color}`}>
                      {getDifficultyBadge(results.difficulty).label}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* ── Recipes / Solutions ── */}
            {results.recipes && results.recipes.length > 0 && results.recipes.map((recipe, idx) => (
              <div key={idx} className={`${c.card} border rounded-2xl shadow-sm p-6`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className={`text-xl font-bold ${c.text}`}>{recipe.name}</h3>
                    <p className={`text-sm mt-1 ${c.textSecondary}`}>{recipe.description}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {recipe.time && (
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${isDark ? 'bg-zinc-700 text-zinc-300' : 'bg-slate-100 text-slate-600'}`}>
                        <Clock className="w-3 h-3" /> {recipe.time}
                      </span>
                    )}
                    {recipe.difficulty && (
                      <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${getDifficultyBadge(recipe.difficulty).color}`}>{recipe.difficulty}</span>
                    )}
                  </div>
                </div>

                {recipe.success_probability !== undefined && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-medium ${c.textMuted}`}>Success probability</span>
                      <span className={`text-sm font-bold ${getProbabilityConfig(recipe.success_probability).textColor}`}>{recipe.success_probability}%</span>
                    </div>
                    <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-zinc-700' : 'bg-slate-200'}`}>
                      <div className={`h-full rounded-full ${getProbabilityConfig(recipe.success_probability).barColor}`}
                        style={{ width: `${Math.min(100, recipe.success_probability)}%` }} />
                    </div>
                  </div>
                )}

                {recipe.ingredients_used && recipe.ingredients_used.length > 0 && (
                  <div className="mb-4">
                    <h4 className={`text-sm font-semibold ${c.label} mb-2`}>Ingredients</h4>
                    <div className="flex flex-wrap gap-2">
                      {recipe.ingredients_used.map((ing, i) => (
                        <span key={i} className={`px-2.5 py-1 rounded-lg text-xs font-medium ${isDark ? 'bg-emerald-900/30 text-emerald-300 border border-emerald-700' : 'bg-emerald-100 text-emerald-800'}`}>{ing}</span>
                      ))}
                    </div>
                  </div>
                )}

                {recipe.missing_staples && recipe.missing_staples.length > 0 && (
                  <div className="mb-4">
                    <h4 className={`text-sm font-semibold ${c.label} mb-2`}>You'll also need</h4>
                    <div className="flex flex-wrap gap-2">
                      {recipe.missing_staples.map((s, i) => (
                        <span key={i} className={`px-2.5 py-1 rounded-lg text-xs font-medium ${isDark ? 'bg-amber-900/30 text-amber-300 border border-amber-700' : 'bg-amber-100 text-amber-800'}`}>{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {(recipe.instructions || recipe.solution_steps) && (
                  <div className="mb-4">
                    <h4 className={`text-sm font-semibold ${c.label} mb-2`}>Steps</h4>
                    <div className="space-y-2">
                      {(recipe.instructions || recipe.solution_steps).map((step, sIdx) => {
                        const done = completedSteps[`${idx}-${sIdx}`];
                        return (
                          <div key={sIdx} onClick={() => toggleStep(idx, sIdx)}
                            className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${done ? c.stepDone : c.stepPending}`}>
                            <div className={`flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                              done ? (isDark ? 'bg-emerald-600 text-white' : 'bg-emerald-500 text-white') : (isDark ? 'bg-zinc-700 text-zinc-400' : 'bg-slate-200 text-slate-500')}`}>
                              {done ? <Check className="w-4 h-4" /> : sIdx + 1}
                            </div>
                            <span className={`text-sm ${done ? (isDark ? 'text-emerald-300 line-through opacity-70' : 'text-emerald-700 line-through opacity-70') : c.text}`}>{step}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {recipe.explanation && (
                  <div className="mb-4">
                    <button onClick={() => toggleScience(idx)}
                      className={`flex items-center gap-2 text-sm font-medium ${isDark ? 'text-violet-400' : 'text-violet-600'} mb-2`}>
                      <Beaker className="w-4 h-4" />
                      {showScience[idx] ? 'Hide' : 'Show'} cooking science
                      {showScience[idx] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                    {showScience[idx] && (
                      <div className={`border-2 rounded-xl p-4 ${c.scienceBox}`}>
                        <p className={`text-sm ${isDark ? 'text-violet-200' : 'text-violet-800'}`}>🔬 {recipe.explanation}</p>
                      </div>
                    )}
                  </div>
                )}

                {recipe.tips && (
                  <div className={`rounded-xl p-3 border ${isDark ? 'bg-orange-900/20 border-orange-700' : 'bg-orange-50 border-orange-200'} mb-3`}>
                    <p className={`text-sm ${isDark ? 'text-orange-200' : 'text-orange-800'}`}><strong>💡 Tip:</strong> {recipe.tips}</p>
                  </div>
                )}

                {recipe.preventive_tip && (
                  <div className={`rounded-xl p-3 border ${c.infoBox} mb-3`}>
                    <p className={`text-sm ${isDark ? 'text-blue-200' : 'text-blue-700'}`}><strong>Next time:</strong> {recipe.preventive_tip}</p>
                  </div>
                )}

                {recipe.what_if_you_dont_have && (
                  <div className={`text-sm ${c.textSecondary} mb-3`}><strong>Substitutions:</strong> {recipe.what_if_you_dont_have}</div>
                )}

                <div className="flex justify-end">
                  <button onClick={() => copyModifiedRecipe(recipe)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${c.btnSecondary}`}>
                    {copiedRecipe ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copiedRecipe ? 'Copied!' : 'Copy Recipe'}
                  </button>
                </div>
              </div>
            ))}

            {results.chaos_alternative && (
              <div className={`border-2 rounded-2xl p-5 ${c.chaosBox}`}>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className={`w-5 h-5 ${isDark ? 'text-fuchsia-400' : 'text-fuchsia-600'}`} />
                  <h3 className={`text-lg font-bold ${isDark ? 'text-fuchsia-200' : 'text-fuchsia-900'}`}>🎲 Embrace the Chaos</h3>
                </div>
                {results.chaos_alternative.new_dish_name && (
                  <p className={`text-base font-medium mb-2 ${isDark ? 'text-fuchsia-100' : 'text-fuchsia-800'}`}>
                    Your mistake just became: <strong>{results.chaos_alternative.new_dish_name}</strong>
                  </p>
                )}
                <p className={`text-sm ${isDark ? 'text-fuchsia-200' : 'text-fuchsia-700'}`}>
                  {results.chaos_alternative.description || results.chaos_alternative}
                </p>
                {results.chaos_alternative.instructions && (
                  <div className="mt-3 space-y-1">
                    {results.chaos_alternative.instructions.map((step, i) => (
                      <p key={i} className={`text-sm ${isDark ? 'text-fuchsia-200' : 'text-fuchsia-700'}`}>{i + 1}. {step}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {results.ingredients_not_used && results.ingredients_not_used.length > 0 && (
              <div className={`border-2 rounded-2xl p-5 ${c.infoBox}`}>
                <h3 className={`font-bold mb-2 ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>Ingredients not used</h3>
                <div className="flex flex-wrap gap-2">
                  {results.ingredients_not_used.map((ing, i) => (
                    <span key={i} className={`px-2.5 py-1 rounded-lg text-xs font-medium ${isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>{ing}</span>
                  ))}
                </div>
              </div>
            )}

            {results.meal_plan_suggestion && (
              <div className={`border-2 rounded-2xl p-5 ${c.successBox}`}>
                <h3 className={`font-bold mb-2 ${isDark ? 'text-emerald-300' : 'text-emerald-800'}`}>🍽️ Meal Plan Suggestion</h3>
                <p className={`text-sm ${isDark ? 'text-emerald-200' : 'text-emerald-700'}`}>{results.meal_plan_suggestion}</p>
              </div>
            )}

            <div className={`${c.card} border rounded-2xl shadow-sm p-4 flex flex-wrap items-center gap-3 justify-center`}>
              <button onClick={handleReset}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${c.btnSecondary}`}>
                <RefreshCw className="w-4 h-4" /> New Problem
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipeChaosSolver;
