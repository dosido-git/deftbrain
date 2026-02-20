import React, { useState, useCallback, useRef } from 'react';
import { Loader2, Plus, X, Camera, Check, ChevronDown, ChevronUp, Clock, Copy, RefreshCw, Sparkles, ChevronLeft, AlertCircle, Flame, Utensils, Zap, Mic, FlaskConical, Printer } from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';

// ════════════════════════════════════════════════════════════
// THEME
// ════════════════════════════════════════════════════════════
const useColors = () => {
  const { theme } = useTheme();
  const d = theme === 'dark';
  return {
    d,
    bg: d ? 'bg-zinc-900' : 'bg-stone-50',
    bgCard: d ? 'bg-zinc-800' : 'bg-white',
    bgInset: d ? 'bg-zinc-700' : 'bg-stone-100',
    bgHover: d ? 'hover:bg-zinc-700' : 'hover:bg-stone-50',
    text: d ? 'text-zinc-50' : 'text-stone-900',
    textSec: d ? 'text-zinc-400' : 'text-stone-600',
    textMut: d ? 'text-zinc-500' : 'text-stone-400',
    border: d ? 'border-zinc-700' : 'border-stone-200',
    accent: d ? 'text-amber-400' : 'text-amber-600',
    accentBg: d ? 'bg-amber-500/20 border-amber-600/40' : 'bg-amber-50 border-amber-200',
    accentText: d ? 'text-amber-300' : 'text-amber-700',
    input: d ? 'bg-zinc-700 border-zinc-600 text-zinc-100 placeholder-zinc-500 focus:border-amber-500' : 'bg-white border-stone-300 text-stone-900 placeholder-stone-400 focus:border-amber-500',
    btn: d ? 'bg-amber-500 hover:bg-amber-400 text-zinc-900 font-bold' : 'bg-stone-800 hover:bg-stone-900 text-white font-bold',
    btnSec: d ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-200' : 'bg-stone-100 hover:bg-stone-200 text-stone-700',
    btnGhost: d ? 'text-zinc-400 hover:text-zinc-100' : 'text-stone-500 hover:text-stone-800',
    btnDis: d ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed' : 'bg-stone-200 text-stone-400 cursor-not-allowed',
    chipProtein: d ? 'bg-orange-900/40 text-orange-300 border-orange-700/50' : 'bg-orange-100 text-orange-800 border-orange-200',
    chipVeg: d ? 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50' : 'bg-emerald-100 text-emerald-800 border-emerald-200',
    chipDairy: d ? 'bg-yellow-900/40 text-yellow-300 border-yellow-700/50' : 'bg-yellow-100 text-yellow-800 border-yellow-200',
    chipGrain: d ? 'bg-blue-900/40 text-blue-300 border-blue-700/50' : 'bg-blue-100 text-blue-800 border-blue-200',
    chipSauce: d ? 'bg-red-900/40 text-red-300 border-red-700/50' : 'bg-red-100 text-red-800 border-red-200',
    chipOther: d ? 'bg-zinc-700 text-zinc-300 border-zinc-600' : 'bg-stone-100 text-stone-700 border-stone-200',
    successBg: d ? 'bg-emerald-900/30 border-emerald-700 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800',
    errBg: d ? 'bg-red-900/30 border-red-700' : 'bg-red-50 border-red-200',
    errText: d ? 'text-red-300' : 'text-red-700',
    dropzone: d ? 'border-zinc-600 bg-zinc-800/50 hover:border-amber-500' : 'border-stone-300 bg-stone-50 hover:border-amber-400',
    stepDone: d ? 'bg-emerald-900/30 border-emerald-600' : 'bg-emerald-50 border-emerald-300',
    stepPending: d ? 'bg-zinc-800 border-zinc-600' : 'bg-white border-stone-200',
    oneThing: d ? 'bg-violet-900/30 border-violet-600/50 text-violet-300' : 'bg-violet-50 border-violet-200 text-violet-800',
  };
};

// ════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════
const CATEGORY_MAP = {
  protein: { emoji: '🟤', keywords: ['chicken', 'beef', 'pork', 'fish', 'salmon', 'tuna', 'shrimp', 'tofu', 'tempeh', 'egg', 'eggs', 'turkey', 'bacon', 'sausage', 'ham', 'lamb', 'steak', 'ground beef', 'ground turkey', 'beans', 'lentils', 'chickpeas', 'black beans'] },
  vegetable: { emoji: '🟢', keywords: ['onion', 'garlic', 'tomato', 'potato', 'carrot', 'broccoli', 'spinach', 'lettuce', 'pepper', 'bell pepper', 'mushroom', 'zucchini', 'corn', 'peas', 'celery', 'cucumber', 'cabbage', 'kale', 'avocado', 'sweet potato', 'green beans', 'asparagus', 'cauliflower', 'eggplant', 'jalapeño', 'ginger', 'lemon', 'lime', 'banana', 'apple', 'berries', 'strawberries'] },
  dairy: { emoji: '🟡', keywords: ['cheese', 'cheddar', 'mozzarella', 'parmesan', 'cream cheese', 'milk', 'cream', 'butter', 'yogurt', 'sour cream', 'heavy cream', 'ricotta', 'feta'] },
  grain: { emoji: '🔵', keywords: ['rice', 'pasta', 'bread', 'tortilla', 'tortillas', 'noodles', 'flour', 'oats', 'cereal', 'couscous', 'quinoa', 'crackers', 'pita', 'bun', 'buns', 'wrap', 'wraps', 'ramen', 'spaghetti', 'penne', 'macaroni'] },
  sauce: { emoji: '🟠', keywords: ['soy sauce', 'hot sauce', 'ketchup', 'mustard', 'mayo', 'mayonnaise', 'sriracha', 'vinegar', 'olive oil', 'salsa', 'bbq sauce', 'teriyaki', 'fish sauce', 'worcestershire', 'pesto', 'ranch', 'honey', 'maple syrup', 'jam', 'peanut butter', 'nutella'] },
};

const DEFAULT_STAPLES = [
  { id: 'salt', label: 'Salt', default: true },
  { id: 'pepper', label: 'Pepper', default: true },
  { id: 'oil', label: 'Cooking oil', default: true },
  { id: 'water', label: 'Water', default: true },
  { id: 'butter', label: 'Butter', default: false },
  { id: 'garlic', label: 'Garlic', default: false },
  { id: 'sugar', label: 'Sugar', default: false },
  { id: 'flour', label: 'Flour', default: false },
  { id: 'vinegar', label: 'Vinegar', default: false },
  { id: 'soy_sauce', label: 'Soy sauce', default: false },
  { id: 'hot_sauce', label: 'Hot sauce', default: false },
  { id: 'onion_powder', label: 'Onion powder', default: false },
  { id: 'garlic_powder', label: 'Garlic powder', default: false },
  { id: 'paprika', label: 'Paprika', default: false },
  { id: 'cumin', label: 'Cumin', default: false },
];

const VIBE_STYLES = {
  '🔥 Actually good': { bg: 'bg-orange-500', text: 'text-white' },
  '😌 Comfort classic': { bg: 'bg-amber-500', text: 'text-white' },
  '⚡ 5-minute save': { bg: 'bg-yellow-400', text: 'text-yellow-900' },
  '🎭 Secretly impressive': { bg: 'bg-purple-500', text: 'text-white' },
  '🏕️ Survival mode': { bg: 'bg-stone-500', text: 'text-white' },
  '🤌 Minimal but elegant': { bg: 'bg-rose-500', text: 'text-white' },
};

// ════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════
const categorizeIngredient = (name) => {
  const lower = name.toLowerCase().trim();
  for (const [cat, { keywords }] of Object.entries(CATEGORY_MAP)) {
    if (keywords.some(k => lower.includes(k) || k.includes(lower))) return cat;
  }
  return 'other';
};

const getChipClass = (category, c) => {
  const map = { protein: c.chipProtein, vegetable: c.chipVeg, dairy: c.chipDairy, grain: c.chipGrain, sauce: c.chipSauce, other: c.chipOther };
  return map[category] || c.chipOther;
};

const getCatEmoji = (category) => {
  const map = { protein: '🟤', vegetable: '🟢', dairy: '🟡', grain: '🔵', sauce: '🟠', other: '⚪' };
  return map[category] || '⚪';
};

// ════════════════════════════════════════════════════════════
// IMAGE COMPRESSION — canvas-based, ≤800KB target
// ════════════════════════════════════════════════════════════
const compressImageFile = (file) => {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) { reject(new Error('Invalid file type')); return; }
    const maxDim = 1024, quality = 0.8, maxSizeKB = 800;
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image'));
      img.onload = () => {
        try {
          let w = img.width, h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) { h = Math.round((h / w) * maxDim); w = maxDim; }
            else { w = Math.round((w / h) * maxDim); h = maxDim; }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, w, h);
          let dataUrl = canvas.toDataURL('image/jpeg', quality);
          let sizeKB = Math.round((dataUrl.length * 0.75) / 1024);
          if (sizeKB > maxSizeKB) { dataUrl = canvas.toDataURL('image/jpeg', 0.6); sizeKB = Math.round((dataUrl.length * 0.75) / 1024); }
          if (sizeKB > maxSizeKB) {
            const sc = 768 / Math.max(w, h);
            const sc2 = document.createElement('canvas');
            sc2.width = Math.round(w * sc); sc2.height = Math.round(h * sc);
            const sCtx = sc2.getContext('2d');
            sCtx.imageSmoothingEnabled = true; sCtx.imageSmoothingQuality = 'high';
            sCtx.drawImage(canvas, 0, 0, sc2.width, sc2.height);
            dataUrl = sc2.toDataURL('image/jpeg', 0.6);
          }
          resolve(dataUrl);
        } catch (err) { reject(new Error(`Compression failed: ${err.message}`)); }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

// ════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════
const FridgeAlchemy = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const c = useColors();
  const photoRef = useRef(null);

  // Ingredients
  const [ingredients, setIngredients] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [staples, setStaples] = useState(() => DEFAULT_STAPLES.filter(s => s.default).map(s => s.id));
  const [showStaples, setShowStaples] = useState(false);

  // Photo
  const [fridgeImage, setFridgeImage] = useState(null);
  const [fridgePreview, setFridgePreview] = useState(null);
  const [compressing, setCompressing] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [detectedItems, setDetectedItems] = useState([]);

  // Constraints
  const [timeLimit, setTimeLimit] = useState('any');
  const [equipment, setEquipment] = useState('full');
  const [diet, setDiet] = useState('none');
  const [vibe, setVibe] = useState('feed-me');

  // Results
  const [results, setResults] = useState(null);
  const [completedSteps, setCompletedSteps] = useState({});
  const [copiedRecipe, setCopiedRecipe] = useState(null);
  const [error, setError] = useState('');
  const [refining, setRefining] = useState(null); // index of recipe being refined
  const [bubbling, setBubbling] = useState(false);

  // ══════════════════════════════════════════
  // INGREDIENT MANAGEMENT
  // ══════════════════════════════════════════
  const addIngredient = useCallback((name) => {
    const trimmed = name.trim().toLowerCase();
    if (!trimmed || ingredients.some(i => i.name === trimmed)) return;
    const cat = categorizeIngredient(trimmed);
    setIngredients(prev => [...prev, { name: trimmed, category: cat, source: 'manual' }]);
  }, [ingredients]);

  const removeIngredient = useCallback((name) => {
    setIngredients(prev => prev.filter(i => i.name !== name));
  }, []);

  const handleInputKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = inputValue.replace(/,/g, '').trim();
      if (val) { addIngredient(val); setInputValue(''); }
    }
  }, [inputValue, addIngredient]);

  const handleInputBlur = useCallback(() => {
    const val = inputValue.replace(/,/g, '').trim();
    if (val) { addIngredient(val); setInputValue(''); }
  }, [inputValue, addIngredient]);

  const toggleStaple = useCallback((id) => {
    setStaples(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  }, []);

  // ══════════════════════════════════════════
  // FRIDGE PHOTO
  // ══════════════════════════════════════════
  const handlePhotoUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Please upload an image file'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('Image must be under 10MB'); return; }
    setError('');
    setCompressing(true);
    try {
      const compressed = await compressImageFile(file);
      setFridgePreview(compressed);
      setFridgeImage(compressed);
    } catch (err) {
      setError('Failed to process image: ' + err.message);
    } finally {
      setCompressing(false);
    }
  }, []);

  const clearPhoto = useCallback(() => {
    setFridgeImage(null);
    setFridgePreview(null);
    setDetectedItems([]);
    if (photoRef.current) photoRef.current.value = '';
  }, []);

  const scanFridge = useCallback(async () => {
    if (!fridgeImage) return;
    setScanning(true);
    setError('');
    try {
      const res = await callToolEndpoint('fridge-alchemy', {
        action: 'scan',
        fridgeImageBase64: fridgeImage,
      });
      const detected = res.detected_ingredients || [];
      setDetectedItems(detected);
      detected.forEach(name => {
        const trimmed = name.trim().toLowerCase();
        if (!ingredients.some(i => i.name === trimmed)) {
          setIngredients(prev => [...prev, { name: trimmed, category: categorizeIngredient(trimmed), source: 'photo' }]);
        }
      });
    } catch (err) {
      setError('Failed to scan image: ' + err.message);
    } finally {
      setScanning(false);
    }
  }, [fridgeImage, callToolEndpoint, ingredients]);

  // ══════════════════════════════════════════
  // ALCHEMIZE — Generate recipes
  // ══════════════════════════════════════════
  const alchemize = useCallback(async () => {
    if (ingredients.length < 2) return;
    setError('');
    setResults(null);
    setCompletedSteps({});
    setBubbling(true);
    setTimeout(() => setBubbling(false), 800);
    try {
      const stapleLabels = DEFAULT_STAPLES.filter(s => staples.includes(s.id)).map(s => s.label);
      const res = await callToolEndpoint('fridge-alchemy', {
        action: 'generate',
        ingredients: ingredients.map(i => i.name),
        staples: stapleLabels,
        constraints: { timeLimit, equipment, diet, vibe },
      });
      setResults(res);
    } catch (err) {
      setError(err.message || 'Failed to generate recipes. Please try again.');
    }
  }, [ingredients, staples, timeLimit, equipment, diet, vibe, callToolEndpoint]);

  // ══════════════════════════════════════════
  // REFINE — Adjust a single recipe
  // ══════════════════════════════════════════
  const refineRecipe = useCallback(async (recipeIndex, refinementType) => {
    if (!results?.recipes?.[recipeIndex]) return;
    setRefining(recipeIndex);
    setError('');
    try {
      const stapleLabels = DEFAULT_STAPLES.filter(s => staples.includes(s.id)).map(s => s.label);
      const res = await callToolEndpoint('fridge-alchemy', {
        action: 'refine',
        ingredients: ingredients.map(i => i.name),
        staples: stapleLabels,
        constraints: { timeLimit, equipment, diet, vibe },
        refinement: { type: refinementType, originalRecipe: results.recipes[recipeIndex] },
      });
      if (res.recipes?.[0]) {
        setResults(prev => ({
          ...prev,
          recipes: prev.recipes.map((r, i) => i === recipeIndex ? res.recipes[0] : r),
        }));
      }
    } catch (err) {
      setError('Failed to refine recipe. Try again.');
    } finally {
      setRefining(null);
    }
  }, [results, ingredients, staples, timeLimit, equipment, diet, vibe, callToolEndpoint]);

  // ══════════════════════════════════════════
  // COPY RECIPE
  // ══════════════════════════════════════════
  const copyRecipe = useCallback((recipe, idx) => {
    const text = [
      recipe.name, recipe.honest_take || '', '',
      'Ingredients:',
      ...(recipe.ingredients_used || []).map(i => `- ${i}`),
      ...(recipe.staples_used || []).map(i => `- ${i} (staple)`),
      '', 'Instructions:',
      ...(recipe.steps || []).map((s, i) => `${i + 1}. ${s}`),
      '', recipe.why_it_works ? `Why it works: ${recipe.why_it_works}` : '',
    ].filter(Boolean).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedRecipe(idx);
    setTimeout(() => setCopiedRecipe(null), 2000);
  }, []);

  const printRecipe = useCallback((recipe) => {
    const stepsHtml = (recipe.steps || []).map((s, i) => `<li style="margin-bottom:8px">${s}</li>`).join('');
    const ingredientsHtml = [
      ...(recipe.ingredients_used || []).map(i => `<li>${i}</li>`),
      ...(recipe.staples_used || []).map(i => `<li>${i} <span style="color:#999">(staple)</span></li>`),
    ].join('');
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${recipe.name}</title>
<style>
  body { font-family: -apple-system, 'Segoe UI', sans-serif; max-width: 600px; margin: 40px auto; padding: 0 20px; color: #1c1917; line-height: 1.6; }
  h1 { font-size: 1.6em; margin-bottom: 4px; }
  .meta { color: #78716c; font-size: 0.9em; margin-bottom: 16px; }
  h2 { font-size: 1.1em; margin-top: 24px; border-bottom: 1px solid #e7e5e4; padding-bottom: 4px; }
  ol { padding-left: 20px; } li { margin-bottom: 6px; }
  .note { font-style: italic; color: #57534e; margin-top: 16px; font-size: 0.9em; }
  @media print { body { margin: 20px; } }
</style></head><body>
  <h1>${recipe.name}</h1>
  <div class="meta">${recipe.vibe_tag || ''} · ${recipe.time_minutes ? recipe.time_minutes + ' min' : ''} · ${recipe.difficulty || ''}</div>
  <h2>Ingredients</h2><ul>${ingredientsHtml}</ul>
  <h2>Instructions</h2><ol>${stepsHtml}</ol>
  ${recipe.why_it_works ? `<p class="note">💡 ${recipe.why_it_works}</p>` : ''}
  ${recipe.honest_take ? `<p class="note">⭐ ${recipe.honest_take}</p>` : ''}
</body></html>`;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(html);
    w.document.close();
    // setTimeout is more reliable than onload after document.write across browsers
    setTimeout(() => { try { w.focus(); w.print(); } catch (e) { /* popup blocked */ } }, 300);
  }, []);

  const toggleStep = useCallback((rIdx, sIdx) => {
    const key = `${rIdx}-${sIdx}`;
    setCompletedSteps(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const resetAll = useCallback(() => {
    setResults(null);
    setCompletedSteps({});
    setError('');
  }, []);

  // ══════════════════════════════════════════
  // RENDER: Header
  // ══════════════════════════════════════════
  const renderHeader = () => (
    <div className="flex items-center gap-3 mb-6">
      <div>
        <h2 className={`text-2xl font-bold ${c.text}`}>FridgeAlchemy 🧪</h2>
        <p className={`text-sm ${c.textMut}`}>A meal from whatever's left</p>
      </div>
    </div>
  );

  // ══════════════════════════════════════════
  // RENDER: Ingredient Chips
  // ══════════════════════════════════════════
  const renderChips = () => (
    ingredients.length > 0 && (
      <div className="flex flex-wrap gap-2 mb-3">
        {ingredients.map(ing => (
          <span key={ing.name}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all animate-[fadeIn_0.2s_ease-out] ${getChipClass(ing.category, c)}`}>
            <span>{getCatEmoji(ing.category)}</span>
            <span className="capitalize">{ing.name}</span>
            {ing.source === 'photo' && <Camera className="w-3 h-3 opacity-60" />}
            <button onClick={() => removeIngredient(ing.name)} className="ml-0.5 opacity-60 hover:opacity-100">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
    )
  );

  // ══════════════════════════════════════════
  // RENDER: Input Area
  // ══════════════════════════════════════════
  const renderInput = () => (
    <div className={`p-5 rounded-2xl border ${c.border} ${c.bgCard} mb-4`}>
      <label className={`text-xs font-bold ${c.textSec} uppercase tracking-wide mb-2 block`}>
        What's in your fridge?
      </label>

      {renderChips()}

      <div className="flex gap-2 mb-4">
        <input type="text" value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleInputKeyDown}
          onBlur={handleInputBlur}
          placeholder={ingredients.length === 0 ? 'e.g. eggs, cheese, tortillas...' : 'Add more...'}
          className={`flex-1 px-4 py-2.5 rounded-xl border text-sm ${c.input} outline-none transition-colors`} />
        <button onClick={() => { const val = inputValue.replace(/,/g, '').trim(); if (val) { addIngredient(val); setInputValue(''); } }}
          disabled={!inputValue.trim()}
          className={`px-3 py-2.5 rounded-xl ${inputValue.trim() ? c.btn : c.btnDis}`}>
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Fridge Photo */}
      <div className="mb-4">
        {compressing ? (
          <div className={`flex items-center gap-3 p-4 rounded-xl border-2 border-dashed ${c.dropzone}`}>
            <Loader2 className={`w-5 h-5 animate-spin ${c.accent}`} />
            <span className={`text-sm ${c.textSec}`}>Compressing image...</span>
          </div>
        ) : fridgePreview ? (
          <div className="flex items-start gap-3">
            <div className="relative flex-shrink-0">
              <img src={fridgePreview} alt="Fridge" className="w-24 h-24 object-cover rounded-xl border" />
              <button onClick={clearPhoto} className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow">
                <X className="w-3 h-3" />
              </button>
            </div>
            <div className="flex-1">
              {detectedItems.length > 0 ? (
                <div className={`p-3 rounded-xl border ${c.successBg}`}>
                  <p className={`text-xs font-semibold flex items-center gap-1.5 ${c.d ? 'text-emerald-300' : 'text-emerald-800'}`}>
                    <Check className="w-3.5 h-3.5" /> Found {detectedItems.length} ingredients
                  </p>
                </div>
              ) : (
                <button onClick={scanFridge} disabled={scanning}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold ${!scanning ? c.btn : c.btnDis}`}>
                  {scanning ? <><Loader2 className="w-4 h-4 animate-spin inline mr-2" />Scanning...</> : <><Sparkles className="w-4 h-4 inline mr-2" />Scan for ingredients</>}
                </button>
              )}
            </div>
          </div>
        ) : (
          <button onClick={() => photoRef.current?.click()}
            className={`w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed text-sm font-medium transition-all ${c.dropzone} ${c.textMut}`}>
            <Camera className="w-4 h-4" /> Snap your fridge (optional)
          </button>
        )}
        <input ref={photoRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
      </div>

      {/* Staples */}
      <div>
        <button onClick={() => setShowStaples(!showStaples)}
          className={`flex items-center gap-2 text-xs font-semibold ${c.textSec} ${c.bgHover} px-2 py-1.5 rounded-lg transition-colors`}>
          {showStaples ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          What's always in your kitchen? <span className={`${c.textMut}`}>({staples.length} selected)</span>
        </button>
        {showStaples && (
          <div className="flex flex-wrap gap-2 mt-3">
            {DEFAULT_STAPLES.map(s => (
              <button key={s.id} onClick={() => toggleStaple(s.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${staples.includes(s.id) ? (c.d ? 'border-amber-500 bg-amber-900/30 text-amber-300' : 'border-amber-400 bg-amber-50 text-amber-700') : `${c.border} ${c.textMut}`}`}>
                {staples.includes(s.id) && <Check className="w-3 h-3 inline mr-1" />}{s.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ══════════════════════════════════════════
  // RENDER: Constraints
  // ══════════════════════════════════════════
  const renderConstraints = () => {
    const renderToggleRow = (label, icon, options, value, setter) => (
      <div className="mb-3">
        <span className={`text-xs font-semibold ${c.textSec} flex items-center gap-1.5 mb-1.5`}>{icon} {label}</span>
        <div className="flex flex-wrap gap-1.5">
          {options.map(opt => (
            <button key={opt.value} onClick={() => setter(opt.value)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${value === opt.value ? (c.d ? 'border-amber-500 bg-amber-900/30 text-amber-300' : 'border-amber-400 bg-amber-50 text-amber-700') : `${c.border} ${c.textMut}`}`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    );

    return (
      <div className={`p-5 rounded-2xl border ${c.border} ${c.bgCard} mb-4`}>
        <span className={`text-xs font-bold ${c.textSec} uppercase tracking-wide mb-3 block`}>Constraints (optional)</span>
        {renderToggleRow('Time', '⏱️', [
          { value: 'any', label: 'Any' }, { value: '15', label: '15 min' }, { value: '30', label: '30 min' }, { value: '45', label: '45 min' },
        ], timeLimit, setTimeLimit)}
        {renderToggleRow('Equipment', '🍳', [
          { value: 'full', label: 'Full kitchen' }, { value: 'stovetop', label: 'Stovetop only' }, { value: 'microwave', label: 'Microwave only' }, { value: 'nofire', label: 'No cook' },
        ], equipment, setEquipment)}
        {renderToggleRow('Diet', '🥗', [
          { value: 'none', label: 'None' }, { value: 'vegetarian', label: 'Vegetarian' }, { value: 'vegan', label: 'Vegan' }, { value: 'gluten-free', label: 'Gluten-free' },
        ], diet, setDiet)}
        {renderToggleRow('Vibe', '🎯', [
          { value: 'feed-me', label: 'Feed me anything' }, { value: 'try', label: 'Actually try' }, { value: 'impress', label: 'Impress someone' },
        ], vibe, setVibe)}
      </div>
    );
  };

  // ══════════════════════════════════════════
  // RENDER: Alchemize Button
  // ══════════════════════════════════════════
  const renderAlchemizeButton = () => (
    <button onClick={alchemize}
      disabled={loading || ingredients.length < 2}
      className={`w-full py-4 rounded-2xl text-base font-bold flex items-center justify-center gap-3 transition-all shadow-lg
        ${ingredients.length >= 2 && !loading ? `${c.btn} hover:scale-[1.01] active:scale-[0.99]` : c.btnDis}
        ${bubbling ? 'animate-[pulse_0.4s_ease-out]' : ''}`}>
      {loading ? (
        <><Loader2 className="w-5 h-5 animate-spin" /> Alchemizing...</>
      ) : (
        <><FlaskConical className="w-5 h-5" /> Alchemize{ingredients.length >= 2 ? ` (${ingredients.length} ingredients)` : ' — add at least 2'}</>
      )}
    </button>
  );

  // ══════════════════════════════════════════
  // RENDER: Error
  // ══════════════════════════════════════════
  const renderError = () => error ? (
    <div className={`mt-4 p-4 ${c.errBg} border rounded-xl flex items-start gap-3`}>
      <AlertCircle className={`w-5 h-5 ${c.errText} flex-shrink-0 mt-0.5`} />
      <p className={`text-sm ${c.errText}`}>{error}</p>
    </div>
  ) : null;

  // ══════════════════════════════════════════
  // RENDER: Results
  // ══════════════════════════════════════════
  const renderResults = () => {
    if (!results) return null;

    const renderIngredientBar = () => (
      <div className={`p-4 rounded-xl border ${c.accentBg} mb-5`}>
        <span className={`text-xs font-bold ${c.accentText} uppercase tracking-wide`}>Working with:</span>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {ingredients.map(ing => (
            <span key={ing.name} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getChipClass(ing.category, c)}`}>
              {getCatEmoji(ing.category)} <span className="capitalize">{ing.name}</span>
            </span>
          ))}
          {staples.length > 0 && (
            <span className={`text-xs ${c.textMut} flex items-center`}>
              + {DEFAULT_STAPLES.filter(s => staples.includes(s.id)).map(s => s.label.toLowerCase()).join(', ')}
            </span>
          )}
        </div>
      </div>
    );

    const renderRecipeCard = (recipe, idx) => {
      const vibeStyle = VIBE_STYLES[recipe.vibe_tag] || { bg: 'bg-stone-500', text: 'text-white' };
      const isRefiningThis = refining === idx;

      return (
        <div key={idx} className={`p-5 rounded-2xl border ${c.border} ${c.bgCard} mb-4 transition-all ${isRefiningThis ? 'opacity-60' : ''}`}>
          {/* Title row */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1">
              <h4 className={`text-lg font-bold ${c.text}`}>{recipe.name}</h4>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                {recipe.vibe_tag && (
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${vibeStyle.bg} ${vibeStyle.text}`}>
                    {recipe.vibe_tag}
                  </span>
                )}
                {recipe.time_minutes && (
                  <span className={`flex items-center gap-1 text-xs ${c.textSec}`}>
                    <Clock className="w-3.5 h-3.5" /> {recipe.time_minutes} min
                  </span>
                )}
                {recipe.difficulty && (
                  <span className={`flex items-center gap-1 text-xs ${c.textSec}`}>
                    <Flame className="w-3.5 h-3.5" /> {recipe.difficulty}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Ingredients used */}
          {(recipe.ingredients_used || recipe.staples_used) && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {(recipe.ingredients_used || []).map((ing, i) => (
                <span key={i} className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getChipClass(categorizeIngredient(ing), c)}`}>
                  {getCatEmoji(categorizeIngredient(ing))} {ing}
                </span>
              ))}
              {(recipe.staples_used || []).map((s, i) => (
                <span key={`s-${i}`} className={`px-2 py-0.5 rounded-full text-xs ${c.textMut} border ${c.border}`}>{s}</span>
              ))}
            </div>
          )}

          {/* Steps */}
          {recipe.steps && (
            <div className="space-y-2 mb-4">
              {recipe.steps.map((step, si) => {
                const done = completedSteps[`${idx}-${si}`];
                return (
                  <button key={si} onClick={() => toggleStep(idx, si)}
                    className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${done ? c.stepDone : c.stepPending}`}>
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 transition-all
                      ${done ? 'bg-emerald-500 border-emerald-500 text-white' : c.border}`}>
                      {done ? <Check className="w-3.5 h-3.5" /> : <span className={`text-xs font-bold ${c.textMut}`}>{si + 1}</span>}
                    </div>
                    <span className={`text-sm ${done ? `line-through ${c.textMut}` : c.text}`}>{step}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Why / Honest take */}
          {recipe.why_it_works && (
            <p className={`text-xs italic ${c.textSec} mb-2`}>💡 {recipe.why_it_works}</p>
          )}
          {recipe.honest_take && (
            <p className={`text-sm font-medium ${c.accentText} mb-4`}>⭐ {recipe.honest_take}</p>
          )}

          {/* Refine buttons */}
          <div className="flex flex-wrap gap-2">
            <button onClick={() => refineRecipe(idx, 'spicier')} disabled={isRefiningThis}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${c.btnSec}`}>🌶️ Spicier</button>
            <button onClick={() => refineRecipe(idx, 'different')} disabled={isRefiningThis}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${c.btnSec}`}>
              <RefreshCw className="w-3 h-3 inline mr-1" />Different
            </button>
            <button onClick={() => refineRecipe(idx, `microwave only, no stovetop`)} disabled={isRefiningThis}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${c.btnSec}`}>📡 Microwave</button>
            <button onClick={() => copyRecipe(recipe, idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${c.btnSec} ml-auto`}>
              {copiedRecipe === idx ? <><Check className="w-3 h-3 inline mr-1" />Copied!</> : <><Copy className="w-3 h-3 inline mr-1" />Copy</>}
            </button>
            <button onClick={() => printRecipe(recipe)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${c.btnSec}`}>
              <Printer className="w-3 h-3 inline mr-1" />Print
            </button>
          </div>
          {isRefiningThis && (
            <div className="flex items-center gap-2 mt-3 justify-center">
              <Loader2 className={`w-4 h-4 animate-spin ${c.accent}`} />
              <span className={`text-xs ${c.textSec}`}>Remixing...</span>
            </div>
          )}
        </div>
      );
    };

    const renderOneMoreThing = () => {
      const omt = results.one_more_thing;
      if (!omt) return null;
      return (
        <div className={`p-5 rounded-2xl border-2 ${c.oneThing} mb-4`}>
          <h4 className={`text-sm font-bold flex items-center gap-2 mb-2 ${c.d ? 'text-violet-300' : 'text-violet-800'}`}>
            <Sparkles className="w-4 h-4" /> What if you had ONE more thing?
          </h4>
          <p className={`text-sm mb-1 ${c.d ? 'text-violet-200' : 'text-violet-900'}`}>
            If you also had <strong className="capitalize">{omt.ingredient}</strong>:
          </p>
          <p className={`text-sm ${c.d ? 'text-violet-400' : 'text-violet-600'}`}>{omt.unlocks}</p>
        </div>
      );
    };

    return (
      <div>
        {/* Back button */}
        <button onClick={resetAll} className={`flex items-center gap-2 mb-5 text-sm font-semibold ${c.btnGhost}`}>
          <ChevronLeft className="w-4 h-4" /> New ingredients
        </button>

        {/* Intro */}
        {results.intro && (
          <p className={`text-sm ${c.textSec} mb-4 italic`}>{results.intro}</p>
        )}

        {renderIngredientBar()}

        {/* Recipes */}
        {(results.recipes || []).map((recipe, idx) => renderRecipeCard(recipe, idx))}

        {renderOneMoreThing()}
      </div>
    );
  };

  // ══════════════════════════════════════════
  // MAIN RENDER
  // ══════════════════════════════════════════
  return (
    <div className={c.text}>
      {renderHeader()}
      {results ? renderResults() : (
        <>
          {renderInput()}
          {renderConstraints()}
          {renderAlchemizeButton()}
        </>
      )}
      {renderError()}

      {/* fadeIn keyframe */}
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }`}</style>
    </div>
  );
};

FridgeAlchemy.displayName = 'FridgeAlchemy';
export default FridgeAlchemy;
