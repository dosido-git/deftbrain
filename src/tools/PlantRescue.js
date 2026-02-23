import React, { useState, useRef, useEffect } from 'react';
import { CopyBtn } from '../components/ActionButtons';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';
import { compressImage, CompressionPresets } from '../utils/imageCompression';

const PlantRescue = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const fileInputRef = useRef(null);
  const progressInputRef = useRef(null);
  const extraPhotoRefs = [useRef(null), useRef(null)];

  const load = (k) => { try { const s = localStorage.getItem(k); return s ? JSON.parse(s) : null; } catch { return null; } };
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

  // ═══ FORM ═══
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [plantDescription, setPlantDescription] = useState('');
  const [lightLevel, setLightLevel] = useState('');
  const [wateringFreq, setWateringFreq] = useState('');
  const [location, setLocation] = useState('');
  const [ageOfOwnership, setAgeOfOwnership] = useState('');
  const [uploading, setUploading] = useState(false);
  const [hasPets, setHasPets] = useState(false);
  const [hasChildren, setHasChildren] = useState(false);
  const [climateZone, setClimateZone] = useState('');
  const [userLocation, setUserLocation] = useState('');

  // ═══ RESULTS ═══
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [followUpAnswer, setFollowUpAnswer] = useState('');
  const [followUpLoading, setFollowUpLoading] = useState(false);

  // v2: mode, collection, progress
  const [mode, setMode] = useState('rescue'); // 'rescue' | 'care' | 'identify'
  const [plantCollection, setPlantCollection] = useState(() => load('plantCollection') || []);
  const [showCollection, setShowCollection] = useState(false);
  const [plantName, setPlantName] = useState('');
  const [activePlantId, setActivePlantId] = useState(null);
  const [progressUploading, setProgressUploading] = useState(false);

  // ═══ v3 NEW ═══
  // #2 Symptom wizard
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  // #4 Companion planting
  const [companionLoading, setCompanionLoading] = useState(false);
  const [companionResults, setCompanionResults] = useState(null);
  // #6 Multi-photo
  const [extraPhotos, setExtraPhotos] = useState([null, null]); // [closeup, soil/roots]
  const [extraPreviews, setExtraPreviews] = useState([null, null]);

  useEffect(() => { save('plantCollection', plantCollection); }, [plantCollection]);

  const linkStyle = isDark ? 'text-cyan-400 hover:text-cyan-300 underline underline-offset-2' : 'text-cyan-600 hover:text-cyan-700 underline underline-offset-2';

  const c = {
    card: isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-emerald-200',
    cardAlt: isDark ? 'bg-zinc-700 border-zinc-600' : 'bg-emerald-50 border-emerald-200',
    input: isDark ? 'bg-zinc-900 border-zinc-700 text-zinc-50 placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20' : 'bg-white border-emerald-300 text-emerald-900 placeholder:text-emerald-400 focus:border-emerald-600 focus:ring-emerald-100',
    text: isDark ? 'text-zinc-50' : 'text-emerald-900',
    textSecondary: isDark ? 'text-zinc-300' : 'text-emerald-700',
    textMuted: isDark ? 'text-zinc-400' : 'text-emerald-600',
    label: isDark ? 'text-zinc-200' : 'text-emerald-800',
    accent: isDark ? 'text-emerald-400' : 'text-emerald-600',
    btnPrimary: isDark ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white',
    btnSecondary: isDark ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-50' : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900',
    btnDanger: isDark ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white',
    critical: isDark ? 'bg-red-900/20 border-red-700 text-red-200' : 'bg-red-50 border-red-300 text-red-800',
    concerning: isDark ? 'bg-amber-900/20 border-amber-700 text-amber-200' : 'bg-amber-50 border-amber-300 text-amber-800',
    minor: isDark ? 'bg-blue-900/20 border-blue-700 text-blue-200' : 'bg-blue-50 border-blue-300 text-blue-800',
    success: isDark ? 'bg-emerald-900/20 border-emerald-700 text-emerald-200' : 'bg-emerald-50 border-emerald-300 text-emerald-800',
    propagation: isDark ? 'bg-purple-900/20 border-purple-700 text-purple-200' : 'bg-purple-50 border-purple-300 text-purple-800',
  };

  // ═══ IMAGE HANDLING ═══
  const processImage = async (file) => {
    if (!file || !file.type.startsWith('image/')) { setError('Upload an image'); return null; }
    setError('');
    try { return await compressImage(file, CompressionPresets.API_UPLOAD); }
    catch (err) { setError(err.message || 'Image failed.'); return null; }
  };
  const handleFileUpload = async (e) => { const f = e.target.files?.[0]; if (f) { setUploading(true); const r = await processImage(f); if (r) { setImagePreview(r); setImageBase64(r); } setUploading(false); } };
  const handlePaste = async (e) => { const items = e.clipboardData?.items; if (!items) return; for (let i = 0; i < items.length; i++) { if (items[i].type.indexOf('image') !== -1) { setUploading(true); const r = await processImage(items[i].getAsFile()); if (r) { setImagePreview(r); setImageBase64(r); } setUploading(false); break; } } };
  const handleRemoveImage = () => { setImagePreview(null); setImageBase64(null); if (fileInputRef.current) fileInputRef.current.value = ''; };
  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = async (e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) { setUploading(true); const r = await processImage(f); if (r) { setImagePreview(r); setImageBase64(r); } setUploading(false); } };

  // Multi-photo (#6)
  const handleExtraPhoto = async (idx, e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = await processImage(f);
    if (r) { setExtraPhotos(p => { const n = [...p]; n[idx] = r; return n; }); setExtraPreviews(p => { const n = [...p]; n[idx] = r; return n; }); }
    if (extraPhotoRefs[idx]?.current) extraPhotoRefs[idx].current.value = '';
  };
  const handleRemoveExtra = (idx) => { setExtraPhotos(p => { const n = [...p]; n[idx] = null; return n; }); setExtraPreviews(p => { const n = [...p]; n[idx] = null; return n; }); };

  // ═══ HELPERS ═══
  const getSeverityStyles = (s) => { switch (s?.toLowerCase()) { case 'critical': return c.critical; case 'concerning': return c.concerning; case 'minor': return c.minor; default: return c.cardAlt; } };
  const getSeverityEmoji = (s) => { switch (s?.toLowerCase()) { case 'critical': return '🔴'; case 'concerning': return '🟡'; case 'minor': return '🟢'; default: return '🪴'; } };
  const getSeverityLabel = (s) => { switch (s?.toLowerCase()) { case 'critical': return 'CRITICAL'; case 'concerning': return 'CONCERNING'; case 'minor': return 'MINOR'; default: return 'HEALTHY'; } };

  // #2 Symptom definitions
  const symptomOptions = [
    { id: 'yellow_leaves', emoji: '🟡', label: 'Yellowing leaves' },
    { id: 'brown_tips', emoji: '🟤', label: 'Brown tips' },
    { id: 'drooping', emoji: '😞', label: 'Drooping/wilting' },
    { id: 'spots', emoji: '🔵', label: 'Spots on leaves' },
    { id: 'mushy_stem', emoji: '🫠', label: 'Mushy/soft stem' },
    { id: 'white_fuzz', emoji: '🤍', label: 'White fuzz/mold' },
    { id: 'tiny_bugs', emoji: '🐛', label: 'Tiny bugs/pests' },
    { id: 'leggy', emoji: '🌱', label: 'Leggy/stretched' },
    { id: 'no_growth', emoji: '⏸️', label: 'No new growth' },
    { id: 'leaf_drop', emoji: '🍂', label: 'Leaf dropping' },
    { id: 'crispy', emoji: '🥀', label: 'Crispy/dry leaves' },
    { id: 'root_rot', emoji: '💀', label: 'Smells bad/root rot' },
  ];
  const toggleSymptom = (id) => setSelectedSymptoms(p => p.includes(id) ? p.filter(s => s !== id) : [...p, id]);

  // #1 Watering tracker
  const handleMarkWatered = (plantId) => {
    setPlantCollection(p => p.map(pl => pl.id === plantId ? { ...pl, lastWatered: new Date().toISOString() } : pl));
  };
  const getWaterStatus = (plant) => {
    if (!plant.lastWatered || !plant.lastResults?.care_schedule?.watering) return null;
    const last = new Date(plant.lastWatered);
    const now = new Date();
    const daysSince = Math.floor((now - last) / (1000 * 60 * 60 * 24));
    // Parse "every X days" or "every X-Y days" from watering text
    const match = plant.lastResults?.care_schedule?.watering?.match(/every\s+(\d+)(?:\s*-\s*(\d+))?\s*days/i);
    if (!match) return { daysSince, status: 'unknown', nextIn: null };
    const interval = match[2] ? Math.floor((parseInt(match[1]) + parseInt(match[2])) / 2) : parseInt(match[1]);
    const nextIn = interval - daysSince;
    return { daysSince, interval, nextIn, status: nextIn <= 0 ? 'overdue' : nextIn <= 1 ? 'today' : 'ok' };
  };

  // ═══ CORE ═══
  const handleAnalyze = async () => {
    if (!imageBase64 && !plantDescription.trim() && selectedSymptoms.length === 0) { setError('Provide a photo, description, or select symptoms'); return; }
    setError(''); setResults(null); setFollowUpAnswer(''); setFollowUpQuestion(''); setCompanionResults(null);

    // Build symptom text
    const symptomText = selectedSymptoms.length > 0 ? selectedSymptoms.map(id => symptomOptions.find(s => s.id === id)?.label).filter(Boolean).join(', ') : '';
    const fullDescription = [plantDescription.trim(), symptomText ? `Symptoms: ${symptomText}` : ''].filter(Boolean).join('\n');

    try {
      const data = await callToolEndpoint('plant-rescue', {
        imageBase64, extraPhotos: extraPhotos.filter(Boolean),
        plantDescription: fullDescription, symptoms: selectedSymptoms,
        lightLevel, wateringFreq, location, ageOfOwnership: ageOfOwnership.trim(),
        hasPets, hasChildren, climateZone, userLocation: userLocation.trim(),
        mode, plantName: plantName.trim() || null
      });
      setResults(data);
    } catch (err) { setError(err.message || 'Analysis failed.'); }
  };

  const handleFollowUp = async () => {
    if (!followUpQuestion.trim() || !results) return;
    setFollowUpLoading(true); setFollowUpAnswer('');
    try {
      const data = await callToolEndpoint('plant-rescue/followup', {
        question: followUpQuestion.trim(), originalDiagnosis: results,
        plantDescription: plantDescription.trim(), imageProvided: !!imageBase64
      });
      setFollowUpAnswer(data.answer || 'No answer.');
    } catch { setFollowUpAnswer('Follow-up failed.'); }
    setFollowUpLoading(false);
  };

  // #4 Companion planting
  const handleGetCompanions = async () => {
    if (plantCollection.length < 2) return;
    setCompanionLoading(true);
    try {
      const plants = plantCollection.map(p => ({
        name: p.name, species: p.species || p.commonName || 'Unknown',
        lightNeeds: p.lastResults?.environmental_adjustments?.light || '',
        waterNeeds: p.lastResults?.care_schedule?.watering || ''
      }));
      const data = await callToolEndpoint('plant-rescue/companions', { plants, climateZone, location });
      setCompanionResults(data);
    } catch { setError('Companion analysis failed.'); }
    setCompanionLoading(false);
  };

  const handleReset = () => {
    setImagePreview(null); setImageBase64(null); setPlantDescription(''); setLightLevel('');
    setWateringFreq(''); setLocation(''); setAgeOfOwnership(''); setHasPets(false);
    setHasChildren(false); setClimateZone(''); setUserLocation(''); setResults(null);
    setError(''); setFollowUpQuestion(''); setFollowUpAnswer(''); setSelectedSymptoms([]);
    setExtraPhotos([null, null]); setExtraPreviews([null, null]); setCompanionResults(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Collection
  const handleSavePlant = () => {
    if (!results) return;
    const name = plantName.trim() || results.plant_identification?.common_name || results.plant_identification?.species || 'My Plant';
    const entry = {
      id: Date.now().toString(), name, date: new Date().toISOString(),
      species: results.plant_identification?.species, commonName: results.plant_identification?.common_name,
      severity: results.diagnosis?.severity || (mode === 'care' || mode === 'identify' ? 'healthy' : 'unknown'),
      diagnosis: results.diagnosis?.primary_problem || 'General care',
      isSaveable: results.is_saveable, mode, lastWatered: null,
      progressPhotos: imagePreview ? [{ date: new Date().toISOString(), note: mode === 'rescue' ? 'Initial diagnosis' : 'First check-in' }] : [],
      lastResults: results
    };
    setPlantCollection(p => [entry, ...p].slice(0, 30));
    setActivePlantId(entry.id);
  };
  const handleDeletePlant = (id) => { setPlantCollection(p => p.filter(pl => pl.id !== id)); if (activePlantId === id) setActivePlantId(null); };
  const handleLoadPlant = (plant) => { setPlantName(plant.name); setActivePlantId(plant.id); if (plant.lastResults) setResults(plant.lastResults); setShowCollection(false); };

  // Progress
  const handleAddProgressPhoto = async (e) => {
    const file = e.target.files?.[0]; if (!file || !activePlantId) return;
    const compressed = await processImage(file);
    if (compressed) { setPlantCollection(p => p.map(pl => pl.id !== activePlantId ? pl : { ...pl, progressPhotos: [...(pl.progressPhotos || []), { date: new Date().toISOString(), image: compressed, note: '' }] })); }
    if (progressInputRef.current) progressInputRef.current.value = '';
  };
  const getActivePlant = () => plantCollection.find(p => p.id === activePlantId);

  // Build text
  const buildFullText = () => {
    if (!results) return '';
    const l = [`🪴 ${mode === 'identify' ? 'PLANT ID' : mode === 'care' ? 'CARE GUIDE' : 'RESCUE REPORT'}`, '═'.repeat(40)];
    if (results.plant_identification) { const pi = results.plant_identification; l.push('', `📷 ${pi.species || 'Unknown'}`); if (pi.common_name) l.push(`  ${pi.common_name}`); }
    if (results.toxicity_warning) l.push('', `⚠️ TOXIC — ${results.toxicity_warning.level}`);
    if (results.diagnosis) l.push('', `🔍 ${results.diagnosis.severity?.toUpperCase()}: ${results.diagnosis.primary_problem}`);
    if (results.care_schedule) { const cs = results.care_schedule; l.push('', '💧 CARE'); if (cs.watering) l.push(`  Water: ${cs.watering}`); if (cs.fertilizing) l.push(`  Fertilize: ${cs.fertilizing}`); if (cs.misting) l.push(`  Mist: ${cs.misting}`); }
    if (results.seasonal_calendar?.length) { l.push('', '📅 SEASONAL CALENDAR'); results.seasonal_calendar.forEach(m => l.push(`  ${m.month}: ${m.tasks.join(', ')}`)); }
    if (results.action_plan?.length) { l.push('', '🚑 ACTION PLAN'); results.action_plan.forEach(a => l.push(`  [P${a.priority}] ${a.action}`)); }
    if (results.repotting_guide) l.push('', `🏺 SOIL: ${results.repotting_guide.soil_mix || 'See details'}`);
    if (results.propagation_guide) l.push('', `✂️ PROPAGATION: ${results.propagation_guide.method}`);
    if (results.prevention_tips?.length) { l.push('', '✨ PREVENTION'); results.prevention_tips.forEach(t => l.push(`  • ${t}`)); }
    if (followUpAnswer) l.push('', `Q: ${followUpQuestion}`, `A: ${followUpAnswer}`);
    l.push('', '— Generated by DeftBrain · deftbrain.com');
    return l.join('\n');
  };

  const handlePrint = () => {
    if (!results) return; const t = buildFullText();
    const w = window.open('', '_blank'); if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>Plant Report</title><style>body{font-family:system-ui;padding:2rem;max-width:700px;margin:0 auto;line-height:1.6;font-size:14px;}pre{white-space:pre-wrap;}.b{margin-top:2rem;border-top:1px solid #ddd;padding-top:1rem;font-size:12px;color:#999;text-align:center;}</style></head><body><pre>${t.replace(/— Generated.*/, '')}</pre><div class="b">Generated by DeftBrain · deftbrain.com</div></body></html>`);
    w.document.close(); w.print();
  };

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  // ═══ RENDER ═══
  return (
    <div className="space-y-6">

      {/* Header + Mode Toggle */}
      <div className={`${c.card} border rounded-xl shadow-lg p-6`}>
        <div className="flex items-center justify-between mb-4">
          <div><h2 className={`text-2xl font-bold ${c.text}`}>Plant Rescue 🪴</h2><p className={`text-sm ${c.textMuted}`}>Diagnose, identify, care for, and track</p></div>
          <button onClick={() => setShowCollection(!showCollection)} className={`${c.btnSecondary} px-3 py-1.5 rounded text-xs`}>🪴 My Plants ({plantCollection.length})</button>
        </div>

        {/* 3-mode toggle (#3) */}
        <div className="flex gap-2 mb-4">
          <button onClick={() => setMode('rescue')} className={`flex-1 py-2.5 rounded-lg font-medium text-sm ${mode === 'rescue' ? c.btnPrimary : c.btnSecondary}`}>🚑 Rescue</button>
          <button onClick={() => setMode('care')} className={`flex-1 py-2.5 rounded-lg font-medium text-sm ${mode === 'care' ? c.btnPrimary : c.btnSecondary}`}>🌱 Care Guide</button>
          <button onClick={() => setMode('identify')} className={`flex-1 py-2.5 rounded-lg font-medium text-sm ${mode === 'identify' ? c.btnPrimary : c.btnSecondary}`}>🔍 Identify</button>
        </div>

        <div className={`${isDark ? 'bg-emerald-900/20 border-emerald-700' : 'bg-emerald-50 border-emerald-300'} border-l-4 rounded-r-lg p-4`}>
          <p className={`text-sm ${c.textSecondary}`}>{mode === 'rescue' ? 'Upload a photo of your struggling plant. Get diagnosis, rescue plan, and recovery timeline.' : mode === 'care' ? 'Get a personalized care schedule, watering guide, and seasonal calendar.' : 'Upload a photo to identify your plant and get its full care profile.'}</p>
        </div>
      </div>

      {/* Collection with Watering Tracker (#1) */}
      {showCollection && (
        <div className={`${c.card} border rounded-xl p-5`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`font-bold ${c.text}`}>🪴 My Plants</h3>
            {plantCollection.length >= 2 && <button onClick={handleGetCompanions} disabled={companionLoading} className={`${c.btnSecondary} px-3 py-1.5 rounded text-xs disabled:opacity-50`}>{companionLoading ? '⏳' : '🤝 Companion Check'}</button>}
          </div>
          {plantCollection.length > 0 ? <div className="space-y-2">
            {plantCollection.map(pl => {
              const ws = getWaterStatus(pl);
              return (
                <div key={pl.id} className={`p-3 rounded-lg border ${activePlantId === pl.id ? 'border-emerald-500' : isDark ? 'border-zinc-600' : 'border-emerald-200'} ${isDark ? 'bg-zinc-700' : 'bg-emerald-50'}`}>
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1 cursor-pointer" onClick={() => handleLoadPlant(pl)}>
                      <div className="flex items-center gap-2">
                        <h4 className={`font-bold ${c.text} truncate`}>{pl.name}</h4>
                        <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${pl.severity === 'critical' ? 'bg-red-100 text-red-700' : pl.severity === 'concerning' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{pl.severity || 'ok'}</span>
                      </div>
                      <p className={`text-xs ${c.textMuted}`}>{pl.commonName || pl.species || 'Unknown'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Water status indicator (#1) */}
                      {ws ? (
                        <div className="text-center">
                          <button onClick={(e) => { e.stopPropagation(); handleMarkWatered(pl.id); }} className={`px-2 py-1 rounded text-xs font-bold ${ws.status === 'overdue' ? 'bg-red-100 text-red-700 animate-pulse' : ws.status === 'today' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            💧 {ws.status === 'overdue' ? 'OVERDUE' : ws.status === 'today' ? 'TODAY' : `${ws.nextIn}d`}
                          </button>
                          <p className={`text-xs ${c.textMuted}`}>{ws.daysSince}d ago</p>
                        </div>
                      ) : pl.lastResults?.care_schedule ? (
                        <button onClick={(e) => { e.stopPropagation(); handleMarkWatered(pl.id); }} className={`${c.btnSecondary} px-2 py-1 rounded text-xs`}>💧 Watered</button>
                      ) : null}
                      <button onClick={() => handleDeletePlant(pl.id)} className={`text-xs ${c.textMuted} hover:text-red-500`}>✕</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div> : <p className={`text-sm ${c.textMuted}`}>No saved plants yet.</p>}

          {/* Companion Results (#4) */}
          {companionResults && (
            <div className={`mt-4 p-4 rounded-lg border ${isDark ? 'bg-zinc-800 border-zinc-600' : 'bg-white border-emerald-200'}`}>
              <h4 className={`font-bold mb-2 ${c.text}`}>🤝 Companion Analysis</h4>
              {companionResults.groupings?.length > 0 && <div className="space-y-2 mb-3">{companionResults.groupings.map((g, i) => <div key={i} className={`p-2 rounded ${isDark ? 'bg-emerald-900/20' : 'bg-emerald-50'}`}><p className={`text-xs font-bold ${c.accent}`}>{g.group_name}</p><p className={`text-sm ${c.text}`}>{g.plants.join(', ')}</p><p className={`text-xs ${c.textMuted}`}>{g.reason}</p></div>)}</div>}
              {companionResults.conflicts?.length > 0 && <div className="space-y-1 mb-3">{companionResults.conflicts.map((cf, i) => <p key={i} className={`text-sm ${c.textSecondary}`}>⚠️ {cf}</p>)}</div>}
              {companionResults.suggestions?.length > 0 && <div><p className={`text-xs font-bold ${c.label} mb-1`}>💡 Suggestions:</p>{companionResults.suggestions.map((s, i) => <p key={i} className={`text-sm ${c.textSecondary}`}>• {s}</p>)}</div>}
            </div>
          )}
        </div>
      )}

      {/* Input Form */}
      <div className={`${c.card} border rounded-xl shadow-lg p-6`}>
        <h3 className={`text-lg font-semibold ${c.text} mb-4`}>{mode === 'identify' ? 'Upload a Photo to Identify' : 'Plant Information'}</h3>

        <div className="space-y-6">
          {mode !== 'identify' && <div><label className={`block text-sm font-medium ${c.label} mb-1`}>🏷️ Plant Name</label><input type="text" value={plantName} onChange={e => setPlantName(e.target.value)} placeholder="e.g., Kitchen Fern" className={`w-full p-3 border rounded-lg ${c.input}`} /></div>}

          {/* Main photo + Multi-photo (#6) */}
          <div>
            <label className={`block text-sm font-medium ${c.label} mb-2`}>📸 {mode === 'rescue' ? 'Plant Photo — whole plant view' : 'Plant Photo'}</label>
            {!imagePreview ? (
              <div onDragOver={handleDragOver} onDrop={handleDrop} onPaste={handlePaste} className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer ${isDark ? 'border-zinc-600 hover:border-emerald-500 bg-zinc-900/50' : 'border-emerald-300 hover:border-emerald-500 bg-emerald-50/50'}`} onClick={() => fileInputRef.current?.click()}>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                {uploading ? <><span className="animate-spin inline-block text-3xl mb-2">⏳</span><p className={`text-sm ${c.text}`}>Compressing...</p></> : <><span className="text-3xl block mb-2">📤</span><p className={`text-sm ${c.text}`}>Click, drag, or paste</p><p className={`text-xs ${c.textMuted}`}>JPG, PNG, WEBP</p></>}
              </div>
            ) : (
              <div className="relative"><img src={imagePreview} alt="Plant" className="w-full max-h-48 object-contain rounded-lg border" /><button onClick={handleRemoveImage} className={`absolute top-2 right-2 ${c.btnDanger} w-7 h-7 rounded-full flex items-center justify-center text-xs`}>✕</button></div>
            )}
          </div>

          {/* Extra photos for rescue mode (#6) */}
          {mode === 'rescue' && imagePreview && (
            <div className="grid grid-cols-2 gap-3">
              {[['🔍 Close-up of problem area', 0], ['🌱 Soil / roots', 1]].map(([label, idx]) => (
                <div key={idx}>
                  <label className={`block text-xs font-medium ${c.label} mb-1`}>{label}</label>
                  {!extraPreviews[idx] ? (
                    <div onClick={() => extraPhotoRefs[idx]?.current?.click()} className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer ${isDark ? 'border-zinc-600 hover:border-emerald-500' : 'border-emerald-300 hover:border-emerald-500'}`}>
                      <input ref={extraPhotoRefs[idx]} type="file" accept="image/*" onChange={e => handleExtraPhoto(idx, e)} className="hidden" />
                      <span className="text-xl">📸</span><p className={`text-xs ${c.textMuted}`}>Optional</p>
                    </div>
                  ) : (
                    <div className="relative"><img src={extraPreviews[idx]} alt={`Extra ${idx + 1}`} className="w-full h-24 object-cover rounded-lg border" /><button onClick={() => handleRemoveExtra(idx)} className={`absolute top-1 right-1 ${c.btnDanger} w-5 h-5 rounded-full flex items-center justify-center text-xs`}>✕</button></div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Symptom Wizard (#2) — rescue mode */}
          {mode === 'rescue' && (
            <div>
              <label className={`block text-sm font-medium ${c.label} mb-2`}>🩺 What do you see? (click all that apply)</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {symptomOptions.map(s => (
                  <label key={s.id} className={`p-2.5 rounded-lg border-2 cursor-pointer flex items-center gap-2 text-sm ${selectedSymptoms.includes(s.id) ? isDark ? 'border-emerald-500 bg-emerald-900/30' : 'border-emerald-500 bg-emerald-100' : isDark ? 'border-zinc-700' : 'border-gray-200'}`}>
                    <input type="checkbox" checked={selectedSymptoms.includes(s.id)} onChange={() => toggleSymptom(s.id)} className="sr-only" />
                    <span>{s.emoji}</span> <span className={selectedSymptoms.includes(s.id) ? 'font-bold' : ''}>{s.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {mode !== 'identify' && (
            <div><label className={`block text-sm font-medium ${c.label} mb-1`}>📝 {mode === 'rescue' ? 'Additional details' : 'Describe your plant'}</label><textarea value={plantDescription} onChange={e => setPlantDescription(e.target.value)} placeholder={mode === 'rescue' ? "Anything else about the symptoms..." : "Type, size, where you keep it..."} className={`w-full p-3 border rounded-lg ${c.input}`} rows={2} /></div>
          )}

          {mode !== 'identify' && <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><label className={`block text-xs font-medium ${c.label} mb-1`}>☀️ Light</label><select value={lightLevel} onChange={e => setLightLevel(e.target.value)} className={`w-full p-2.5 border rounded-lg text-sm ${c.input}`}><option value="">Select...</option><option value="full-sun">Full Sun (6+h)</option><option value="partial-shade">Partial (3-6h)</option><option value="low-light">Low Light</option></select></div>
              <div><label className={`block text-xs font-medium ${c.label} mb-1`}>💧 Watering</label><select value={wateringFreq} onChange={e => setWateringFreq(e.target.value)} className={`w-full p-2.5 border rounded-lg text-sm ${c.input}`}><option value="">Select...</option><option value="daily">Daily</option><option value="few-days">Few days</option><option value="weekly">Weekly</option><option value="rarely">Rarely</option></select></div>
              <div><label className={`block text-xs font-medium ${c.label} mb-1`}>📍 Location</label><select value={location} onChange={e => setLocation(e.target.value)} className={`w-full p-2.5 border rounded-lg text-sm ${c.input}`}><option value="">Select...</option><option value="indoor">Indoor</option><option value="outdoor">Outdoor</option><option value="greenhouse">Greenhouse</option></select></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className={`block text-xs font-medium ${c.label} mb-1`}>⏳ How long?</label><input type="text" value={ageOfOwnership} onChange={e => setAgeOfOwnership(e.target.value)} placeholder="e.g., 2 months" className={`w-full p-2.5 border rounded-lg text-sm ${c.input}`} /></div>
              <div><label className={`block text-xs font-medium ${c.label} mb-1`}>🌡️ Climate</label><select value={climateZone} onChange={e => setClimateZone(e.target.value)} className={`w-full p-2.5 border rounded-lg text-sm ${c.input}`}><option value="">Select...</option><option value="tropical">Tropical</option><option value="subtropical">Subtropical</option><option value="temperate">Temperate</option><option value="cold">Cold</option><option value="arid">Arid</option></select></div>
            </div>
            <div className="flex gap-4"><label className="flex items-center gap-2 cursor-pointer text-sm"><input type="checkbox" checked={hasPets} onChange={e => setHasPets(e.target.checked)} className="w-4 h-4" /> 🐾 Pets</label><label className="flex items-center gap-2 cursor-pointer text-sm"><input type="checkbox" checked={hasChildren} onChange={e => setHasChildren(e.target.checked)} className="w-4 h-4" /> 👶 Children</label></div>
          </>}

          <p className={`text-xs text-center ${c.textMuted}`}>Bike? <a href="/BikeMedic" target="_blank" rel="noopener noreferrer" className={linkStyle}>Bike Medic</a> diagnoses the same way.</p>

          <div className="flex gap-3">
            <button onClick={handleAnalyze} disabled={loading || uploading || (!imageBase64 && !plantDescription.trim() && selectedSymptoms.length === 0)} className={`flex-1 ${c.btnPrimary} disabled:opacity-50 font-medium py-3 rounded-lg flex items-center justify-center gap-2`}>
              {loading ? <><span className="animate-spin inline-block">⏳</span> Analyzing...</> : <><span>✨</span> {mode === 'rescue' ? 'Diagnose' : mode === 'identify' ? 'Identify' : 'Get Care Guide'}</>}
            </button>
            {results && <button onClick={handleReset} className={`px-6 py-3 border-2 ${isDark ? 'border-zinc-600 text-zinc-300' : 'border-emerald-300 text-emerald-700'} rounded-lg`}>🔄</button>}
          </div>
          {error && <div className={`${c.critical} border rounded-lg p-4 flex items-start gap-3`}><span>⚠️</span><p className="text-sm">{error}</p></div>}
        </div>
      </div>

      {/* ═══════════ RESULTS ═══════════ */}
      {results && (
        <div className="space-y-6">
          <div className="flex justify-center gap-3 flex-wrap">
            <button onClick={handleSavePlant} className={`${c.btnSecondary} px-4 py-2 rounded-lg text-sm`}>🪴 Save</button>
            <CopyBtn content={buildFullText()} label="Copy" />
            <button onClick={handlePrint} className={`${c.btnSecondary} px-4 py-2 rounded-lg text-sm`}>🖨️ Print</button>
          </div>

          {/* Hero badge */}
          {mode === 'rescue' && results.diagnosis ? (
            <div className={`${c.card} border rounded-xl shadow-lg p-6 text-center`}>
              <div className="text-6xl mb-3">{getSeverityEmoji(results.diagnosis.severity)}</div>
              <div className={`text-2xl font-black ${c.text}`}>{getSeverityLabel(results.diagnosis.severity)}</div>
              <p className={`text-sm ${c.textSecondary}`}>{results.diagnosis.primary_problem}</p>
              {results.is_saveable !== undefined && <p className={`text-sm mt-2 font-bold ${results.is_saveable ? 'text-emerald-500' : 'text-red-500'}`}>{results.is_saveable ? '✅ Saveable!' : '⚰️ May be beyond saving'}</p>}
              {results.recovery_timeline && <p className={`text-xs ${c.textMuted} mt-1`}>📅 {results.recovery_timeline}</p>}
            </div>
          ) : (
            <div className={`${c.card} border rounded-xl shadow-lg p-6 text-center`}>
              <div className="text-6xl mb-3">{mode === 'identify' ? '🔍' : '🌿'}</div>
              <div className={`text-2xl font-black ${c.text}`}>{mode === 'identify' ? 'IDENTIFIED' : 'CARE GUIDE'}</div>
              <p className={`text-sm ${c.textSecondary}`}>{results.plant_identification?.common_name || results.plant_identification?.species || ''}</p>
            </div>
          )}

          {/* Toxicity */}
          {results.toxicity_warning && (
            <div className={`${c.critical} border-4 rounded-xl p-6`}>
              <h3 className={`text-xl font-bold mb-2 ${c.text}`}>☠️ TOXICITY</h3>
              <p className="text-sm font-bold">{results.toxicity_warning.level?.toUpperCase()} — {results.toxicity_warning.dangerous_for?.join(' & ')}</p>
              <p className="text-sm"><strong>Symptoms:</strong> {results.toxicity_warning.symptoms}</p>
              <p className="text-sm"><strong>Safety:</strong> {results.toxicity_warning.safety_measures}</p>
              {results.toxicity_warning.alternative_plants && <p className="text-sm mt-2"><strong>Safe alternatives:</strong> {results.toxicity_warning.alternative_plants}</p>}
            </div>
          )}

          {/* Plant ID */}
          {results.plant_identification && (
            <div className={`${c.card} border rounded-xl p-5`}>
              <h3 className={`font-bold mb-2 ${c.text}`}>📷 Identification</h3>
              <p className={`text-lg font-bold ${c.text}`}>{results.plant_identification.species}</p>
              {results.plant_identification.common_name && <p className={`text-sm ${c.textSecondary}`}>{results.plant_identification.common_name}</p>}
              <span className={`text-xs px-2 py-1 rounded mt-2 inline-block ${results.plant_identification.confidence === 'high' ? 'bg-emerald-100 text-emerald-700' : results.plant_identification.confidence === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{results.plant_identification.confidence_score ? `${results.plant_identification.confidence_score}%` : results.plant_identification.confidence?.toUpperCase()}</span>
              {results.plant_identification.alternative_species?.length > 0 && <div className="mt-2">{results.plant_identification.alternative_species.map((a, i) => <p key={i} className={`text-xs ${c.textMuted}`}>• {a.common_name || a.species} ({a.likelihood}%)</p>)}</div>}
            </div>
          )}

          {/* Care Schedule */}
          {results.care_schedule && (
            <div className={`${c.success} border-2 rounded-xl p-6`}>
              <h3 className={`text-lg font-bold mb-3 ${c.text}`}>💧 Care Schedule</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {results.care_schedule.watering && <div className={`p-3 rounded-lg ${isDark ? 'bg-emerald-900/30' : 'bg-emerald-50'}`}><p className="text-xs font-bold mb-1">💧 Watering</p><p className={`text-sm ${c.text}`}>{results.care_schedule.watering}</p></div>}
                {results.care_schedule.fertilizing && <div className={`p-3 rounded-lg ${isDark ? 'bg-emerald-900/30' : 'bg-emerald-50'}`}><p className="text-xs font-bold mb-1">🧪 Fertilizing</p><p className={`text-sm ${c.text}`}>{results.care_schedule.fertilizing}</p></div>}
                {results.care_schedule.misting && <div className={`p-3 rounded-lg ${isDark ? 'bg-emerald-900/30' : 'bg-emerald-50'}`}><p className="text-xs font-bold mb-1">💨 Misting</p><p className={`text-sm ${c.text}`}>{results.care_schedule.misting}</p></div>}
                {results.care_schedule.rotation && <div className={`p-3 rounded-lg ${isDark ? 'bg-emerald-900/30' : 'bg-emerald-50'}`}><p className="text-xs font-bold mb-1">🔄 Rotation</p><p className={`text-sm ${c.text}`}>{results.care_schedule.rotation}</p></div>}
                {results.care_schedule.pruning && <div className={`p-3 rounded-lg ${isDark ? 'bg-emerald-900/30' : 'bg-emerald-50'}`}><p className="text-xs font-bold mb-1">✂️ Pruning</p><p className={`text-sm ${c.text}`}>{results.care_schedule.pruning}</p></div>}
                {results.care_schedule.repot_timing && <div className={`p-3 rounded-lg ${isDark ? 'bg-emerald-900/30' : 'bg-emerald-50'}`}><p className="text-xs font-bold mb-1">🏺 Repotting</p><p className={`text-sm ${c.text}`}>{results.care_schedule.repot_timing}</p></div>}
              </div>
              {results.care_schedule.seasonal_adjustments && <p className={`text-sm mt-3 ${c.textMuted}`}>🌦️ {results.care_schedule.seasonal_adjustments}</p>}
            </div>
          )}

          {/* 📅 Seasonal Calendar (#5) */}
          {results.seasonal_calendar?.length > 0 && (
            <div className={`${c.card} border rounded-xl p-6`}>
              <h3 className={`text-lg font-bold mb-4 ${c.text}`}>📅 Seasonal Care Calendar</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {results.seasonal_calendar.map((m, i) => {
                  const isNow = months[new Date().getMonth()] === m.month?.slice(0, 3);
                  return (
                    <div key={i} className={`p-3 rounded-lg border ${isNow ? 'border-emerald-500 ring-2 ring-emerald-500/30' : isDark ? 'border-zinc-600' : 'border-emerald-200'} ${isDark ? 'bg-zinc-700' : 'bg-white'}`}>
                      <p className={`text-xs font-bold mb-1 ${isNow ? c.accent : c.textMuted}`}>{isNow ? '📍 ' : ''}{m.month}</p>
                      <ul className="space-y-0.5">{m.tasks?.map((t, j) => <li key={j} className={`text-xs ${c.textSecondary}`}>• {t}</li>)}</ul>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Diagnosis (rescue) */}
          {mode === 'rescue' && results.diagnosis && (
            <div className={`${getSeverityStyles(results.diagnosis.severity)} border-l-4 rounded-r-lg p-5`}>
              <h3 className={`font-bold mb-2 ${c.text}`}>{getSeverityEmoji(results.diagnosis.severity)} Diagnosis</h3>
              <p className={`text-sm ${c.text}`}><strong>Primary:</strong> {results.diagnosis.primary_problem}</p>
              {results.diagnosis.secondary_issues?.length > 0 && <div className="mt-1">{results.diagnosis.secondary_issues.map((is, i) => <p key={i} className={`text-sm ${c.textSecondary}`}>• {is}</p>)}</div>}
              {results.diagnosis.uncertainty_note && <p className={`text-xs mt-2 ${c.textMuted}`}>ℹ️ {results.diagnosis.uncertainty_note}</p>}
            </div>
          )}

          {/* Action Plan */}
          {results.action_plan?.length > 0 && (
            <div className={`${c.card} border rounded-xl p-6`}>
              <h3 className={`text-lg font-bold ${c.text} mb-3`}>🚑 Action Plan</h3>
              <div className="space-y-3">{results.action_plan.map((a, idx) => (
                <div key={idx} className={`border-l-4 ${a.priority === 1 ? 'border-red-500' : a.priority === 2 ? 'border-orange-500' : 'border-blue-500'} ${c.cardAlt} border rounded-r-lg p-4`}>
                  <div className="flex items-center gap-2 mb-1"><span className={`px-2 py-0.5 rounded text-xs font-bold ${a.priority === 1 ? c.critical : a.priority === 2 ? c.concerning : c.minor}`}>P{a.priority}</span><span className={`text-xs ${c.textMuted}`}>🕐 {a.timing}</span></div>
                  <h4 className={`font-bold ${c.text} mb-1`}>{a.action}</h4>
                  <p className="text-sm"><strong>Why:</strong> <span className={c.textSecondary}>{a.why}</span></p>
                  <p className="text-sm"><strong>How:</strong> <span className={c.textSecondary}>{a.how}</span></p>
                </div>
              ))}</div>
            </div>
          )}

          {/* Repotting */}
          {results.repotting_guide && (
            <div className={`${c.card} border rounded-xl p-5`}>
              <h3 className={`font-bold mb-3 ${c.text}`}>🏺 Repotting</h3>
              <p className={`text-sm font-bold mb-2 ${c.text}`}>{results.repotting_guide.needs_repotting ? '⚠️ Recommended' : '✅ Not needed now'}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {results.repotting_guide.soil_mix && <div className={`p-3 rounded ${c.cardAlt}`}><p className="text-xs font-bold mb-1">🌱 Soil</p><p className={`text-sm ${c.text}`}>{results.repotting_guide.soil_mix}</p></div>}
                {results.repotting_guide.pot_size && <div className={`p-3 rounded ${c.cardAlt}`}><p className="text-xs font-bold mb-1">📐 Size</p><p className={`text-sm ${c.text}`}>{results.repotting_guide.pot_size}</p></div>}
                {results.repotting_guide.pot_material && <div className={`p-3 rounded ${c.cardAlt}`}><p className="text-xs font-bold mb-1">🏺 Material</p><p className={`text-sm ${c.text}`}>{results.repotting_guide.pot_material}</p></div>}
              </div>
              {results.repotting_guide.drainage && <p className={`text-sm mt-2 ${c.textSecondary}`}>🕳️ {results.repotting_guide.drainage}</p>}
              {results.repotting_guide.steps?.length > 0 && <div className="mt-2">{results.repotting_guide.steps.map((s, i) => <p key={i} className={`text-sm ${c.textSecondary}`}>{i + 1}. {s}</p>)}</div>}
            </div>
          )}

          {/* Propagation */}
          {results.propagation_guide && (
            <div className={`${c.propagation} border-2 rounded-xl p-5`}>
              <h3 className={`font-bold mb-2 ${c.text}`}>✂️ {results.is_saveable === false ? "Save Its Legacy" : "Propagation"}</h3>
              {results.is_saveable === false && <p className={`text-sm mb-2 ${c.textSecondary}`}>The mother plant may not survive, but you can propagate cuttings.</p>}
              <p className={`text-sm font-bold mb-1 ${c.text}`}>Method: {results.propagation_guide.method}</p>
              {results.propagation_guide.steps?.length > 0 && <div className="space-y-1">{results.propagation_guide.steps.map((s, i) => <div key={i} className={`p-2 rounded ${isDark ? 'bg-purple-900/30' : 'bg-purple-50'}`}><p className={`text-sm ${c.text}`}><strong>{i + 1}.</strong> {s}</p></div>)}</div>}
              {results.propagation_guide.success_rate && <p className={`text-sm mt-2 font-semibold ${c.accent}`}>📊 {results.propagation_guide.success_rate}</p>}
              {results.propagation_guide.timeline && <p className={`text-xs ${c.textMuted}`}>⏱️ {results.propagation_guide.timeline}</p>}
            </div>
          )}

          {/* Environment */}
          {results.environmental_adjustments && (
            <div className={`${c.card} border rounded-xl p-5`}>
              <h3 className={`font-bold mb-2 ${c.text}`}>☀️ Environment</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {results.environmental_adjustments.light && <div className={`${c.cardAlt} border rounded-lg p-3`}><p className="text-xs font-bold mb-1">☀️ Light</p><p className="text-sm">{results.environmental_adjustments.light}</p></div>}
                {results.environmental_adjustments.water && <div className={`${c.cardAlt} border rounded-lg p-3`}><p className="text-xs font-bold mb-1">💧 Water</p><p className="text-sm">{results.environmental_adjustments.water}</p></div>}
                {results.environmental_adjustments.location && <div className={`${c.cardAlt} border rounded-lg p-3`}><p className="text-xs font-bold mb-1">📍 Place</p><p className="text-sm">{results.environmental_adjustments.location}</p></div>}
              </div>
            </div>
          )}

          {results.prevention_tips?.length > 0 && <div className={`${c.success} border-l-4 rounded-r-lg p-5`}><h3 className="font-bold mb-2">✨ Prevention</h3><ul className="text-sm space-y-1">{results.prevention_tips.map((t, i) => <li key={i}>• {t}</li>)}</ul></div>}
          {results.climate_recommendations && <div className={`${isDark ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-300'} border-l-4 rounded-r-lg p-5`}><h3 className={`font-bold mb-2 ${isDark ? 'text-blue-200' : 'text-blue-900'}`}>🌡️ Climate</h3>{results.climate_recommendations.seasonal_note && <p className="text-sm">{results.climate_recommendations.seasonal_note}</p>}{results.climate_recommendations.regional_tips?.length > 0 && <ul className="text-sm space-y-1 mt-1">{results.climate_recommendations.regional_tips.map((t, i) => <li key={i}>• {t}</li>)}</ul>}</div>}

          {/* Progress */}
          {activePlantId && (() => { const ap = getActivePlant()?.progressPhotos || []; return (
            <div className={`${c.card} border rounded-xl p-5`}>
              <div className="flex items-center justify-between mb-3"><h3 className={`font-bold ${c.text}`}>📸 Progress</h3><div><input ref={progressInputRef} type="file" accept="image/*" onChange={handleAddProgressPhoto} className="hidden" /><button onClick={() => progressInputRef.current?.click()} className={`${c.btnSecondary} px-3 py-1.5 rounded text-xs`}>📸 Add</button></div></div>
              {ap.length > 0 ? <div className="flex gap-3 overflow-x-auto pb-2">{ap.map((p, i) => <div key={i} className="flex-shrink-0 w-24">{p.image ? <img src={p.image} alt={`P${i + 1}`} className="w-24 h-24 object-cover rounded-lg border" /> : <div className={`w-24 h-24 rounded-lg flex items-center justify-center ${isDark ? 'bg-zinc-700' : 'bg-emerald-100'}`}><span className="text-xl">🪴</span></div>}<p className={`text-xs ${c.textMuted} text-center mt-1`}>{new Date(p.date).toLocaleDateString()}</p></div>)}</div> : <p className={`text-sm ${c.textMuted}`}>Add photos to track recovery.</p>}
            </div>
          ); })()}

          {/* Follow-up */}
          <div className={`${c.card} border rounded-xl p-5`}>
            <h3 className={`font-bold mb-2 ${c.text}`}>💬 Follow-Up</h3>
            <div className="flex gap-2"><input type="text" value={followUpQuestion} onChange={e => setFollowUpQuestion(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleFollowUp()} placeholder="Ask anything..." className={`flex-1 p-3 border rounded-lg ${c.input}`} /><button onClick={handleFollowUp} disabled={followUpLoading || !followUpQuestion.trim()} className={`${c.btnPrimary} px-4 py-2 rounded disabled:opacity-50`}>{followUpLoading ? '⏳' : '❓'}</button></div>
            {followUpAnswer && <div className={`mt-3 p-4 rounded-lg ${c.cardAlt} border`}><p className={`text-sm ${c.textSecondary} whitespace-pre-wrap`}>{followUpAnswer}</p><div className="mt-2"><CopyBtn content={`Q: ${followUpQuestion}\nA: ${followUpAnswer}\n\n— Generated by DeftBrain · deftbrain.com`} label="Copy" /></div></div>}
          </div>

          <div className="text-center space-y-1">
            <p className={`text-xs ${c.textMuted}`}>Health diagnosis? <a href="/DoctorVisitTranslator" target="_blank" rel="noopener noreferrer" className={linkStyle}>Doctor Visit Translator</a></p>
            {results.action_plan?.length > 3 && <p className={`text-xs ${c.textMuted}`}>Overwhelmed? <a href="/TaskAvalancheBreaker" target="_blank" rel="noopener noreferrer" className={linkStyle}>Task Avalanche Breaker</a></p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlantRescue;
