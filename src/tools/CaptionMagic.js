import React, { useState, useRef, useCallback, useMemo } from 'react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';
import { usePersistentState } from '../hooks/usePersistentState';
import { CopyBtn } from '../components/ActionButtons';
import { compressImage, CompressionPresets } from '../utils/imageCompression';

// ════════════════════════════════════════════════════════════
// THEME — Navy & Gold palette
// ════════════════════════════════════════════════════════════
const useColors = () => {
  const { theme } = useTheme();
  const d = theme === 'dark';
  return {
    d,
    card:        d ? 'bg-[#2a2623] border-[#3d3630]'  : 'bg-white border-[#e8e1d5]',
    inset:       d ? 'bg-[#1a1816]'                    : 'bg-[#faf8f5]',
    inputBg:     d ? 'bg-[#1a1816] border-[#3d3630] text-[#f0eeea] placeholder-[#8a8275] focus:border-[#4a6a8a]'
                    : 'bg-[#faf8f5] border-[#d5cab8] text-[#3d3935] placeholder-[#8a8275] focus:border-[#4a6a8a]',
    text:        d ? 'text-[#f0eeea]'  : 'text-[#3d3935]',
    heading:     d ? 'text-[#f3efe8]'  : 'text-[#1e2a3a]',
    textSec:     d ? 'text-[#c8c3b9]'  : 'text-[#5a544a]',
    textMut:     d ? 'text-[#8a8275]'  : 'text-[#8a8275]',
    label:       d ? 'text-[#c8c3b9]'  : 'text-[#5a544a]',
    border:      d ? 'border-[#3d3630]' : 'border-[#e8e1d5]',
    btn:         d ? 'bg-[#2c4a6e] hover:bg-[#4a6a8a] text-white' : 'bg-[#2c4a6e] hover:bg-[#1e3a58] text-white',
    btnGold:     d ? 'bg-[#b06d22] hover:bg-[#c8872e] text-white' : 'bg-[#c8872e] hover:bg-[#b06d22] text-white',
    btnSec:      d ? 'bg-[#332e2a] hover:bg-[#3d3630] text-[#c8c3b9] border border-[#3d3630]'
                    : 'bg-[#f3efe8] hover:bg-[#e8e1d5] text-[#5e5042] border border-[#d5cab8]',
    btnGhost:    d ? 'text-[#8a8275] hover:text-[#f0eeea]' : 'text-[#8a8275] hover:text-[#3d3935]',
    btnDis:      d ? 'bg-[#332e2a] text-[#5a544a] cursor-not-allowed' : 'bg-[#e8e1d5] text-[#8a8275] cursor-not-allowed',
    pillActive:  d ? 'border-[#4a6a8a] bg-[#2c4a6e]/30 text-[#a8b9ce]' : 'border-[#2c4a6e] bg-[#d4dde8] text-[#1e3a58]',
    pillInactive: d ? 'border-[#3d3630] text-[#8a8275] hover:border-[#5a544a]' : 'border-[#d5cab8] text-[#5a544a] hover:border-[#8a8275]',
    dropzone:    d ? 'border-[#3d3630] hover:border-[#4a6a8a] bg-[#2a2623]' : 'border-[#d5cab8] hover:border-[#2c4a6e] bg-white',
    dropActive:  d ? 'border-[#4a6a8a] bg-[#2c4a6e]/10' : 'border-[#2c4a6e] bg-[#d4dde8]/30',
    captionBg:   d ? 'bg-[#1a1816] border-[#3d3630]' : 'bg-[#faf8f5] border-[#e8e1d5]',
    tonePill:    d ? 'bg-[#2c4a6e]/30 text-[#a8b9ce]' : 'bg-[#d4dde8] text-[#1e3a58]',
    // Hashtag categories (#5)
    htTrending:  d ? 'bg-[#b06d22]/20 text-[#d9a04e] border-[#b06d22]/30' : 'bg-[#f9edd8] text-[#93541f] border-[#c8872e]/30',
    htNiche:     d ? 'bg-[#2c4a6e]/20 text-[#a8b9ce] border-[#4a6a8a]/30' : 'bg-[#d4dde8] text-[#1e3a58] border-[#2c4a6e]/30',
    htBranded:   d ? 'bg-[#5a8a5c]/15 text-[#7aba7c] border-[#5a8a5c]/30' : 'bg-[#e8f0e8] text-[#3a6a3c] border-[#5a8a5c]/30',
    charWarn:    d ? 'text-[#e88880]' : 'text-[#b54a3f]',
    charOk:      d ? 'text-[#7aba7c]' : 'text-[#3a6a3c]',
    altBg:       d ? 'bg-[#1a2a3a] border-[#2a4a5a]' : 'bg-[#e6f0f5] border-[#b8d0e0]',
    altTitle:    d ? 'text-[#6eaacc]' : 'text-[#1e4a6e]',
    altText:     d ? 'text-[#8ab8d4]' : 'text-[#2c5a7e]',
    tipBg:       d ? 'bg-[#c8872e]/10 border-[#c8872e]/30' : 'bg-[#f9edd8] border-[#c8872e]/30',
    tipText:     d ? 'text-[#d9a04e]' : 'text-[#93541f]',
    errBg:       d ? 'bg-[#b54a3f]/15 border-[#b54a3f]/40' : 'bg-[#fceae8] border-[#e8a8a0]',
    errText:     d ? 'text-[#e88880]' : 'text-[#b54a3f]',
    histBg:      d ? 'bg-[#2c4a6e]/10 border-[#4a6a8a]/30' : 'bg-[#d4dde8]/30 border-[#2c4a6e]/15',
    histCard:    d ? 'bg-[#2a2623] border-[#3d3630]' : 'bg-white border-[#e8e1d5]',
    histAccent:  d ? 'text-[#a8b9ce]' : 'text-[#2c4a6e]',
    successBg:   d ? 'bg-[#5a8a5c]/15 border-[#5a8a5c]/40' : 'bg-[#e8f0e8] border-[#5a8a5c]/30',
    successText: d ? 'text-[#7aba7c]' : 'text-[#3a6a3c]',
    // Schedule heat
    heatLow:     d ? 'bg-[#332e2a]' : 'bg-[#f3efe8]',
    heatMed:     d ? 'bg-[#4a6a8a]/40' : 'bg-[#d4dde8]',
    heatHigh:    d ? 'bg-[#c8872e]/60' : 'bg-[#c8872e]/40',
    linkStyle:   d ? 'text-[#6e8aaa] hover:text-[#a8b9ce] underline' : 'text-[#2c4a6e] hover:text-[#1e3a58] underline',
  };
};

// ════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════
const PLATFORMS = [
  { value: 'instagram', label: '📷 Instagram', limit: 2200 },
  { value: 'linkedin', label: '💼 LinkedIn', limit: 3000 },
  { value: 'facebook', label: '👥 Facebook', limit: 63206 },
  { value: 'twitter', label: '🐦 Twitter/X', limit: 280 },
  { value: 'tiktok', label: '🎵 TikTok', limit: 2200 },
  { value: 'threads', label: '🧵 Threads', limit: 500 },
];

const TONES = [
  { value: 'funny', label: '😂 Self-deprecating humor' },
  { value: 'reflective', label: '💭 Genuine reflection' },
  { value: 'professional', label: '💼 Professional insight' },
  { value: 'casual', label: '🤙 Casual & authentic' },
  { value: 'inspirational', label: '✨ Enthusiastic' },
  { value: 'minimal', label: '🔲 Minimal / aesthetic' },
  { value: 'storytelling', label: '📖 Storytelling' },
  { value: 'witty', label: '🧠 Clever / witty' },
];

const LENGTH_OPTIONS = [
  { value: 'short', label: 'Short (1-2 lines)' },
  { value: 'medium', label: 'Medium (2-4 lines)' },
  { value: 'long', label: 'Long (4-8 lines)' },
];

const REVISE_OPTIONS = [
  { value: 'less_tryhard', label: '😌 Less try-hard' },
  { value: 'more_engaging', label: '🔥 More engaging' },
  { value: 'shorter', label: '✂️ Shorter' },
  { value: 'longer', label: '📝 Longer' },
  { value: 'more_professional', label: '💼 Professional' },
];

const HASHTAG_CATEGORY_STYLES = {
  trending: { emoji: '🔥', label: 'Trending' },
  niche:    { emoji: '🎯', label: 'Niche' },
  branded:  { emoji: '🏷️', label: 'Branded' },
};

// ════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════
const CaptionMagic = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const c = useColors();

  // ── Persistent ──
  const [history, setHistory] = usePersistentState('caption-magic-history', []);
  const [brandProfile, setBrandProfile] = usePersistentState('caption-magic-brand', { generations: 0, toneFreq: {}, lengthFreq: {}, platformFreq: {} });
  const [abResults, setAbResults] = usePersistentState('caption-magic-ab', []);
  const [showHistory, setShowHistory] = useState(false);

  // ── Inputs ──
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [imageDescription, setImageDescription] = useState('');
  const [platform, setPlatform] = useState('instagram');
  const [selectedTones, setSelectedTones] = useState(['casual']);
  const [captionLength, setCaptionLength] = useState('medium');
  const [context, setContext] = useState('');
  const [useBrandVoice, setUseBrandVoice] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // ── Results ──
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [revisingIndex, setRevisingIndex] = useState(null);

  // ── Multi-platform export (#4) ──
  const [adaptResults, setAdaptResults] = useState(null);
  const [adapting, setAdapting] = useState(false);

  // ── Remix (#6) ──
  const [remixSelections, setRemixSelections] = useState([]);
  const [remixInstructions, setRemixInstructions] = useState('');
  const [remixResult, setRemixResult] = useState(null);
  const [remixing, setRemixing] = useState(false);
  const [showRemix, setShowRemix] = useState(false);

  // ── A/B Testing (#3) ──
  const [showAbPanel, setShowAbPanel] = useState(false);

  // ══════════════════════════════════════════
  // BRAND VOICE MEMORY (#1)
  // ══════════════════════════════════════════
  const brandReady = brandProfile.generations >= 3;

  const brandVoiceSummary = useMemo(() => {
    if (!brandReady) return '';
    const topTones = Object.entries(brandProfile.toneFreq || {})
      .sort(([,a], [,b]) => b - a).slice(0, 3).map(([t]) => t);
    const topLength = Object.entries(brandProfile.lengthFreq || {})
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'medium';
    return `Preferred tones: ${topTones.join(', ')}. Preferred length: ${topLength}.`;
  }, [brandProfile, brandReady]);

  const updateBrandProfile = useCallback((tones, length, plat) => {
    setBrandProfile(prev => {
      const next = { ...prev, generations: (prev.generations || 0) + 1 };
      const tf = { ...(prev.toneFreq || {}) };
      tones.forEach(t => { tf[t] = (tf[t] || 0) + 1; });
      next.toneFreq = tf;
      const lf = { ...(prev.lengthFreq || {}) };
      lf[length] = (lf[length] || 0) + 1;
      next.lengthFreq = lf;
      const pf = { ...(prev.platformFreq || {}) };
      pf[plat] = (pf[plat] || 0) + 1;
      next.platformFreq = pf;
      return next;
    });
  }, [setBrandProfile]);

  // ══════════════════════════════════════════
  // A/B TESTING INSIGHTS (#3)
  // ══════════════════════════════════════════
  const abInsights = useMemo(() => {
    if (abResults.length < 3) return null;
    const toneWins = {};
    const lengthWins = {};
    abResults.forEach(r => {
      if (r.winnerTone) toneWins[r.winnerTone] = (toneWins[r.winnerTone] || 0) + 1;
      if (r.winnerLength) lengthWins[r.winnerLength] = (lengthWins[r.winnerLength] || 0) + 1;
    });
    const topTone = Object.entries(toneWins).sort(([,a],[,b]) => b - a)[0];
    const topLength = Object.entries(lengthWins).sort(([,a],[,b]) => b - a)[0];
    return {
      topTone: topTone ? topTone[0] : null,
      topLength: topLength ? topLength[0] : null,
      totalTests: abResults.length,
    };
  }, [abResults]);

  const markAbWinner = useCallback((captionIndex) => {
    if (!results?.captions?.[captionIndex]) return;
    const cap = results.captions[captionIndex];
    setAbResults(prev => [...prev, {
      date: new Date().toISOString(),
      winnerTone: cap.tone,
      winnerLength: captionLength,
      platform,
    }].slice(-50));
  }, [results, captionLength, platform, setAbResults]);

  // ══════════════════════════════════════════
  // IMAGE HANDLING
  // ══════════════════════════════════════════
  const processFile = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }
    setError(''); setCompressing(true);
    try {
      const compressed = await compressImage(file, CompressionPresets.API_UPLOAD);
      setImagePreview(compressed);
      setImageBase64(compressed);
    } catch (err) {
      setError(err.message || 'Failed to process image.');
    } finally {
      setCompressing(false);
    }
  }, []);

  const handleImageUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handlePaste = useCallback(async () => {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        for (const type of item.types) {
          if (type.startsWith('image/')) {
            const blob = await item.getType(type);
            await processFile(new File([blob], 'pasted.png', { type: blob.type }));
            return;
          }
        }
      }
      setError('No image found in clipboard');
    } catch { setError('Failed to paste. Try uploading instead.'); }
  }, [processFile]);

  const handleDragOver = useCallback((e) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback(() => setIsDragging(false), []);
  const handleDrop = useCallback((e) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const clearImage = useCallback(() => {
    setImagePreview(null); setImageBase64(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  // ══════════════════════════════════════════
  // TOGGLES
  // ══════════════════════════════════════════
  const toggleTone = useCallback((val) => {
    setSelectedTones(prev => {
      if (prev.includes(val)) return prev.filter(t => t !== val);
      if (prev.length >= 3) return prev;
      return [...prev, val];
    });
  }, []);

  // ══════════════════════════════════════════
  // API: Generate
  // ══════════════════════════════════════════
  const generate = useCallback(async () => {
    if (!imageBase64 && !imageDescription.trim()) { setError('Upload an image or describe it'); return; }
    if (selectedTones.length === 0) { setError('Select at least one tone'); return; }
    setError(''); setResults(null); setAdaptResults(null); setRemixResult(null); setShowRemix(false);
    try {
      const data = await callToolEndpoint('caption-magic', {
        imageBase64,
        imageDescription: imageDescription.trim() || null,
        platform,
        tones: selectedTones,
        captionLength,
        context: context.trim() || null,
        brandVoice: useBrandVoice && brandReady ? brandVoiceSummary : null,
      });
      setResults(data);
      updateBrandProfile(selectedTones, captionLength, platform);
      saveToHistory(data);
    } catch (err) {
      setError(err.message || 'Failed to generate captions.');
    }
  }, [imageBase64, imageDescription, platform, selectedTones, captionLength, context, useBrandVoice, brandReady, brandVoiceSummary, callToolEndpoint, updateBrandProfile]);

  // API: Revise
  const reviseCaption = useCallback(async (text, index, direction) => {
    setRevisingIndex(index);
    try {
      const data = await callToolEndpoint('caption-magic/revise', { captionText: text, direction, platform });
      if (data.revised_text) {
        setResults(prev => ({
          ...prev,
          captions: prev.captions.map((cap, i) =>
            i === index ? { ...cap, text: data.revised_text, char_count: data.char_count || data.revised_text.length, revision_note: data.what_changed } : cap
          ),
        }));
      }
    } catch (err) { console.error('Revise failed:', err); }
    finally { setRevisingIndex(null); }
  }, [callToolEndpoint, platform]);

  // API: Multi-platform adapt (#4)
  const adaptAllPlatforms = useCallback(async (captionText, hashtags) => {
    setAdapting(true); setAdaptResults(null);
    try {
      const data = await callToolEndpoint('caption-magic/adapt', {
        captionText,
        hashtags,
        sourcePlatform: platform,
      });
      setAdaptResults(data);
    } catch (err) { setError(err.message || 'Failed to adapt.'); }
    finally { setAdapting(false); }
  }, [callToolEndpoint, platform]);

  // API: Remix (#6)
  const submitRemix = useCallback(async () => {
    if (remixSelections.length < 2) return;
    setRemixing(true); setRemixResult(null);
    try {
      const selectedCaptions = remixSelections.map(i => results.captions[i]);
      const data = await callToolEndpoint('caption-magic/remix', {
        captions: selectedCaptions,
        remixInstructions: remixInstructions.trim() || null,
        platform,
      });
      setRemixResult(data.remixed_caption || data);
    } catch (err) { setError(err.message || 'Failed to remix.'); }
    finally { setRemixing(false); }
  }, [remixSelections, remixInstructions, results, platform, callToolEndpoint]);

  const handleReset = useCallback(() => {
    clearImage(); setImageDescription(''); setContext('');
    setResults(null); setError(''); setSelectedTones(['casual']);
    setCaptionLength('medium'); setAdaptResults(null);
    setRemixResult(null); setShowRemix(false); setRemixSelections([]);
  }, [clearImage]);

  // ══════════════════════════════════════════
  // HISTORY
  // ══════════════════════════════════════════
  const saveToHistory = useCallback((data) => {
    const entry = {
      id: `cm_${Date.now()}`, date: new Date().toISOString(), platform,
      captionCount: (data.captions || []).length,
      preview: (data.captions?.[0]?.text || '').slice(0, 60),
      results: data,
    };
    setHistory(prev => [entry, ...prev].slice(0, 20));
  }, [platform, setHistory]);

  const loadFromHistory = useCallback((entry) => {
    setResults(entry.results); setShowHistory(false);
    setAdaptResults(null); setRemixResult(null);
  }, []);

  const removeFromHistory = useCallback((id) => {
    setHistory(prev => prev.filter(h => h.id !== id));
  }, [setHistory]);

  // ══════════════════════════════════════════
  // COPY HELPERS
  // ══════════════════════════════════════════
  const getTagText = (h) => typeof h === 'object' ? h.tag : h;

  const buildCaptionCopy = (caption) => {
    const parts = [caption.text];
    if (caption.hashtags?.length > 0) parts.push('', caption.hashtags.map(h => '#' + getTagText(h)).join(' '));
    parts.push('', '— Generated by DeftBrain · deftbrain.com');
    return parts.join('\n');
  };

  const buildAllCopy = () => {
    if (!results?.captions) return '';
    const lines = ['✨ Caption Magic Results', ''];
    results.captions.forEach((cap, i) => {
      lines.push(`── Option ${i + 1}: ${cap.tone} ──`);
      lines.push(cap.text);
      if (cap.hashtags?.length > 0) lines.push(cap.hashtags.map(h => '#' + getTagText(h)).join(' '));
      lines.push('');
    });
    if (results.alt_text) lines.push(`Alt text: ${results.alt_text}`, '');
    lines.push('— Generated by DeftBrain · deftbrain.com');
    return lines.join('\n');
  };

  // ══════════════════════════════════════════
  // RENDER: Reusable Pills
  // ══════════════════════════════════════════
  const renderPills = (options, value, setter, multi = false) => (
    <div className="flex flex-wrap gap-1.5">
      {options.map(opt => {
        const active = multi ? value.includes(opt.value) : value === opt.value;
        return (
          <button key={opt.value} onClick={() => setter(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${active ? c.pillActive : c.pillInactive}`}>
            {active && <span className="mr-1">✓</span>}
            {opt.label}
          </button>
        );
      })}
    </div>
  );

  // ══════════════════════════════════════════
  // RENDER: Header
  // ══════════════════════════════════════════
  const renderHeader = () => (
    <div className="flex items-center gap-3 mb-5">
      <div>
        <h2 className={`text-2xl font-bold ${c.heading}`}>Caption Magic <span className="text-xl">✨</span></h2>
        <p className={`text-sm ${c.textMut}`}>Turn any photo into an engaging social media caption</p>
      </div>
    </div>
  );

  // ══════════════════════════════════════════
  // RENDER: Image Upload
  // ══════════════════════════════════════════
  const renderImageUpload = () => (
    <div className={`p-5 rounded-2xl border ${c.card}`}>
      <label className={`text-xs font-bold ${c.textSec} uppercase tracking-wide mb-3 block`}>📷 Your photo</label>
      {compressing ? (
        <div className={`border-2 border-dashed rounded-xl p-8 text-center ${c.dropActive}`}>
          <span className="animate-spin inline-block text-2xl mb-3">⏳</span>
          <p className={`text-sm font-semibold ${c.text}`}>Compressing image...</p>
        </div>
      ) : !imagePreview ? (
        <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${isDragging ? c.dropActive : c.dropzone}`}
          onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="cm-image-upload" />
          <span className="text-3xl block mb-3">📷</span>
          <div className="flex items-center justify-center gap-2 mb-3">
            <label htmlFor="cm-image-upload" className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer ${c.btn}`}>Upload Image</label>
            <button onClick={handlePaste} className={`px-4 py-2 rounded-lg text-xs font-bold ${c.btnSec}`}>📋 Paste</button>
          </div>
          <p className={`text-xs ${c.textMut}`}>{isDragging ? 'Drop your image here!' : 'Drag & drop, paste, or upload — or describe it below'}</p>
        </div>
      ) : (
        <div className="relative">
          <img src={imagePreview} alt="Preview" className={`w-full max-h-72 object-contain rounded-xl border ${c.border}`} />
          <button onClick={clearImage} className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded-lg text-xs font-bold">✕</button>
        </div>
      )}
      <input type="text" value={imageDescription} onChange={e => setImageDescription(e.target.value)}
        placeholder="Or describe what's in the photo (e.g., 'coffee on my desk with laptop')"
        className={`w-full mt-3 px-4 py-2.5 rounded-xl border text-sm ${c.inputBg} outline-none`} />
    </div>
  );

  // ══════════════════════════════════════════
  // RENDER: Input Form
  // ══════════════════════════════════════════
  const renderInputForm = () => (
    <div className="space-y-4">
      {renderImageUpload()}

      <div className={`p-5 rounded-2xl border ${c.card}`}>
        <label className={`text-xs font-bold ${c.textSec} uppercase tracking-wide mb-2 block`}>📱 Platform</label>
        {renderPills(PLATFORMS, platform, setPlatform)}
        <p className={`text-xs ${c.textMut} mt-2`}>Character limit: {PLATFORMS.find(p => p.value === platform)?.limit?.toLocaleString()}</p>
      </div>

      <div className={`p-5 rounded-2xl border ${c.card}`}>
        <label className={`text-xs font-bold ${c.textSec} uppercase tracking-wide mb-1 block`}>🎭 Tone</label>
        <p className={`text-xs ${c.textMut} mb-2`}>Pick up to 3</p>
        {renderPills(TONES, selectedTones, toggleTone, true)}
      </div>

      <div className={`p-5 rounded-2xl border ${c.card}`}>
        <label className={`text-xs font-bold ${c.textSec} uppercase tracking-wide mb-2 block`}>📏 Caption Length</label>
        {renderPills(LENGTH_OPTIONS, captionLength, setCaptionLength)}
      </div>

      <div className={`p-5 rounded-2xl border ${c.card}`}>
        <label className={`text-xs font-bold ${c.textSec} uppercase tracking-wide mb-1 block`}>💬 Context</label>
        <p className={`text-xs ${c.textMut} mb-2`}>Optional — backstory helps craft better captions</p>
        <input type="text" value={context} onChange={e => setContext(e.target.value)}
          placeholder="e.g., 'Team retreat in Colorado' or 'First time making sourdough'"
          className={`w-full px-4 py-2.5 rounded-xl border text-sm ${c.inputBg} outline-none`} />
      </div>

      {/* Brand Voice Toggle (#1) */}
      {brandReady && (
        <div className={`p-4 rounded-2xl border ${c.successBg}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm">🎙️</span>
              <div>
                <span className={`text-xs font-bold ${c.successText}`}>Your Voice</span>
                <p className={`text-xs ${c.successText} opacity-80`}>{brandVoiceSummary}</p>
              </div>
            </div>
            <button onClick={() => setUseBrandVoice(!useBrandVoice)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold ${useBrandVoice ? c.btnGold : c.btnSec}`}>
              {useBrandVoice ? '✓ On' : 'Use'}
            </button>
          </div>
        </div>
      )}

      {/* A/B Insights (#3) */}
      {abInsights && (
        <div className={`p-4 rounded-2xl border ${c.tipBg}`}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm">📊</span>
            <span className={`text-xs font-bold ${c.tipText}`}>Your Audience Insights ({abInsights.totalTests} tests)</span>
          </div>
          <p className={`text-xs ${c.tipText}`}>
            {abInsights.topTone && `Best-performing tone: ${abInsights.topTone}`}
            {abInsights.topTone && abInsights.topLength && ' · '}
            {abInsights.topLength && `Preferred length: ${abInsights.topLength}`}
          </p>
        </div>
      )}

      <button onClick={generate}
        disabled={loading || (!imageBase64 && !imageDescription.trim())}
        className={`w-full py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all
          ${loading || (!imageBase64 && !imageDescription.trim()) ? c.btnDis : c.btn}`}>
        {loading ? <><span className="animate-spin inline-block">⏳</span> Crafting captions...</>
          : <><span>✨</span> Generate Captions</>}
      </button>
    </div>
  );

  // ══════════════════════════════════════════
  // RENDER: Hashtag with intelligence (#5)
  // ══════════════════════════════════════════
  const renderHashtags = (hashtags) => {
    if (!hashtags?.length) return null;
    // Group by category
    const grouped = { trending: [], niche: [], branded: [], uncategorized: [] };
    hashtags.forEach(h => {
      if (typeof h === 'object' && h.category) {
        (grouped[h.category] || grouped.uncategorized).push(h.tag);
      } else {
        grouped.uncategorized.push(typeof h === 'object' ? h.tag : h);
      }
    });

    const hasCats = grouped.trending.length || grouped.niche.length || grouped.branded.length;

    return (
      <div className="mb-3">
        <div className={`text-xs font-semibold ${c.textSec} mb-1.5`}>Hashtags</div>
        {hasCats ? (
          <div className="space-y-1.5">
            {Object.entries(grouped).filter(([,tags]) => tags.length > 0).map(([cat, tags]) => {
              const meta = HASHTAG_CATEGORY_STYLES[cat];
              const pillClass = cat === 'trending' ? c.htTrending : cat === 'niche' ? c.htNiche : cat === 'branded' ? c.htBranded : c.pillInactive;
              return (
                <div key={cat} className="flex flex-wrap gap-1.5 items-center">
                  {meta && <span className={`text-[10px] font-bold ${c.textMut} mr-1`}>{meta.emoji} {meta.label}</span>}
                  {tags.map((tag, i) => (
                    <span key={i} className={`px-2 py-0.5 rounded text-xs font-medium border ${pillClass}`}>#{tag}</span>
                  ))}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {hashtags.map((h, i) => (
              <span key={i} className={`px-2 py-0.5 rounded text-xs font-medium ${c.pillInactive}`}>#{getTagText(h)}</span>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ══════════════════════════════════════════
  // RENDER: Character count
  // ══════════════════════════════════════════
  const renderCharCount = (count) => {
    const limit = PLATFORMS.find(p => p.value === platform)?.limit || 2200;
    const isOver = count > limit;
    return (
      <span className={`text-xs font-semibold ${isOver ? c.charWarn : c.charOk}`}>
        {count?.toLocaleString()} / {limit.toLocaleString()} {isOver ? '⚠️' : ''}
      </span>
    );
  };

  // ══════════════════════════════════════════
  // RENDER: Posting Schedule (#2)
  // ══════════════════════════════════════════
  const renderPostingSchedule = () => {
    const sched = results?.posting_schedule;
    if (!sched) return null;

    return (
      <div className={`p-4 rounded-2xl border ${c.card}`}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">📅</span>
          <h3 className={`text-sm font-bold ${c.text}`}>Best Posting Times</h3>
        </div>
        <div className="flex gap-2 flex-wrap mb-2">
          {(sched.best_days || []).map((day, i) => (
            <span key={i} className={`px-2.5 py-1 rounded-lg text-xs font-bold ${c.heatHigh} ${c.text}`}>{day}</span>
          ))}
          {(sched.best_hours || []).map((hour, i) => (
            <span key={i} className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${c.heatMed} ${c.text}`}>🕐 {hour}</span>
          ))}
        </div>
        {sched.why && <p className={`text-xs ${c.textMut}`}>{sched.why}</p>}
      </div>
    );
  };

  // ══════════════════════════════════════════
  // RENDER: Multi-Platform Export (#4)
  // ══════════════════════════════════════════
  const renderAdaptResults = () => {
    if (!adaptResults?.adaptations) return null;
    return (
      <div className={`p-5 rounded-2xl border ${c.card}`}>
        <h3 className={`text-sm font-bold mb-3 ${c.text}`}>🌐 Adapted for All Platforms</h3>
        <div className="space-y-3">
          {adaptResults.adaptations.map((adapt, idx) => (
            <div key={idx} className={`p-4 rounded-xl border ${c.captionBg}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-bold ${c.text}`}>{adapt.platform_name || adapt.platform}</span>
                {adapt.char_count != null && renderCharCount(adapt.char_count)}
              </div>
              <p className={`text-sm whitespace-pre-wrap mb-2 ${c.text}`}>{adapt.text}</p>
              {adapt.hashtags?.length > 0 && (
                <p className={`text-xs ${c.textMut} mb-2`}>{adapt.hashtags.map(h => '#' + h).join(' ')}</p>
              )}
              <div className="flex items-center gap-2">
                <CopyBtn content={`${adapt.text}${adapt.hashtags?.length ? '\n\n' + adapt.hashtags.map(h => '#' + h).join(' ') : ''}\n\n— Generated by DeftBrain · deftbrain.com`} label="Copy" />
                {adapt.adaptation_note && <span className={`text-[10px] ${c.textMut} italic`}>{adapt.adaptation_note}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════
  // RENDER: Caption Remix (#6)
  // ══════════════════════════════════════════
  const renderRemixPanel = () => {
    if (!results?.captions || results.captions.length < 2) return null;

    const toggleRemixSelection = (idx) => {
      setRemixSelections(prev =>
        prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
      );
    };

    return (
      <div className={`p-4 rounded-2xl border ${c.card}`}>
        <button onClick={() => setShowRemix(!showRemix)}
          className={`flex items-center gap-2 text-xs font-bold ${c.textSec} w-full text-left`}>
          <span>{showRemix ? '▲' : '▼'}</span>
          <span>🎰 Remix Captions</span>
        </button>
        {showRemix && (
          <div className="mt-3 space-y-3">
            <p className={`text-xs ${c.textMut}`}>Select 2+ captions to blend, then tell us what to combine</p>
            <div className="flex gap-2">
              {results.captions.map((cap, idx) => (
                <button key={idx} onClick={() => toggleRemixSelection(idx)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                    remixSelections.includes(idx) ? c.pillActive : c.pillInactive
                  }`}>
                  {remixSelections.includes(idx) && <span className="mr-1">✓</span>}
                  Option {idx + 1}
                </button>
              ))}
            </div>
            <input type="text" value={remixInstructions} onChange={e => setRemixInstructions(e.target.value)}
              placeholder="e.g., 'Opening from #1, tone from #3, hashtags from #2'"
              className={`w-full px-4 py-2.5 rounded-xl border text-sm ${c.inputBg} outline-none`} />
            <button onClick={submitRemix}
              disabled={remixSelections.length < 2 || remixing}
              className={`w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 ${
                remixSelections.length < 2 || remixing ? c.btnDis : c.btnGold
              }`}>
              {remixing ? <><span className="animate-spin inline-block">⏳</span> Remixing...</>
                : <><span>🎰</span> Remix Selected</>}
            </button>

            {/* Remix result */}
            {remixResult && (
              <div className={`p-4 rounded-xl border ${c.successBg}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${c.tonePill}`}>{remixResult.tone || 'Remixed'}</span>
                  {remixResult.char_count != null && renderCharCount(remixResult.char_count)}
                </div>
                <p className={`text-sm whitespace-pre-wrap mb-2 ${c.text}`}>{remixResult.text}</p>
                {remixResult.remix_explanation && (
                  <p className={`text-xs ${c.successText} mb-2 italic`}>🎰 {remixResult.remix_explanation}</p>
                )}
                {renderHashtags(remixResult.hashtags)}
                <CopyBtn content={buildCaptionCopy(remixResult)} label="Copy Remix" />
              </div>
            )}
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
    const captions = results.captions || [];

    return (
      <div className="space-y-4 mt-4">
        {/* Results header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className={`text-sm font-bold ${c.text}`}>Your Captions</h3>
          <div className="flex gap-2 flex-wrap">
            {results.best_posting_time && (
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${c.inset} ${c.textMut}`}>🕐 {results.best_posting_time}</span>
            )}
            <button onClick={handleReset} className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 ${c.btnSec}`}>
              <span>🔄</span> New
            </button>
          </div>
        </div>

        {/* Image read */}
        {results.image_read && (
          <div className={`p-3 rounded-xl ${c.inset}`}>
            <p className={`text-xs ${c.textMut}`}>📷 <strong>What I see:</strong> {results.image_read}</p>
          </div>
        )}

        {/* Alt text */}
        {results.alt_text && (
          <div className={`p-4 rounded-xl border ${c.altBg}`}>
            <div className="flex items-center justify-between mb-1">
              <span className={`text-xs font-bold ${c.altTitle}`}>♿ Alt Text</span>
              <CopyBtn content={results.alt_text} label="Copy" />
            </div>
            <p className={`text-sm ${c.altText}`}>{results.alt_text}</p>
          </div>
        )}

        {/* Caption cards with A/B framing (#3) */}
        {captions.map((caption, index) => (
          <div key={index} className={`p-5 rounded-2xl border ${c.card}`}>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${c.tonePill}`}>
                {caption.tone}
              </span>
              {caption.char_count != null && renderCharCount(caption.char_count)}
              {caption.best_for && <span className={`text-xs ${c.textMut}`}>· {caption.best_for}</span>}
            </div>
            {caption.why_it_works && <p className={`text-xs ${c.textSec} mb-3 italic`}>{caption.why_it_works}</p>}
            {caption.revision_note && <p className={`text-xs ${c.tipText} mb-2`}>🎛️ {caption.revision_note}</p>}

            {/* Caption text */}
            <div className={`p-4 rounded-xl border ${c.captionBg} mb-3`}>
              <p className={`text-sm leading-relaxed whitespace-pre-wrap ${c.text}`}>{caption.text}</p>
            </div>

            {/* Hashtags with intelligence (#5) */}
            {renderHashtags(caption.hashtags)}

            {/* Actions row */}
            <div className="flex gap-2 flex-wrap">
              <CopyBtn content={buildCaptionCopy(caption)} label="Copy" />
              {REVISE_OPTIONS.map(opt => (
                <button key={opt.value}
                  onClick={() => reviseCaption(caption.text, index, opt.value)}
                  disabled={revisingIndex === index}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold ${c.btnSec} ${revisingIndex === index ? 'opacity-50' : ''}`}>
                  {revisingIndex === index ? <span className="animate-spin inline-block">⏳</span> : opt.label}
                </button>
              ))}
            </div>

            {/* A/B winner + adapt row */}
            <div className="flex gap-2 mt-2">
              <button onClick={() => markAbWinner(index)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold ${c.btnSec}`}>
                📊 This one won
              </button>
              <button onClick={() => adaptAllPlatforms(caption.text, caption.hashtags)}
                disabled={adapting}
                className={`px-3 py-2 rounded-lg text-xs font-semibold ${adapting ? c.btnDis : c.btnGold}`}>
                {adapting ? <span className="animate-spin inline-block">⏳</span> : '🌐 Adapt to all platforms'}
              </button>
            </div>
          </div>
        ))}

        {/* Multi-platform results (#4) */}
        {renderAdaptResults()}

        {/* Posting Schedule (#2) */}
        {renderPostingSchedule()}

        {/* Engagement Tips */}
        {(results.engagement_tips?.length > 0 || results.avoid?.length > 0) && (
          <div className={`p-5 rounded-2xl border ${c.tipBg}`}>
            <h3 className={`text-sm font-bold mb-3 ${c.tipText}`}>💡 Engagement Tips</h3>
            {results.engagement_tips?.map((tip, i) => (
              <p key={i} className={`text-xs ${c.tipText} mb-1`}>✓ {tip}</p>
            ))}
            {results.avoid?.length > 0 && (
              <>
                <p className={`text-xs font-bold ${c.tipText} mt-2`}>Avoid:</p>
                {results.avoid.map((a, i) => <p key={i} className={`text-xs ${c.tipText} opacity-80`}>✕ {a}</p>)}
              </>
            )}
          </div>
        )}

        {/* Caption Remix (#6) */}
        {renderRemixPanel()}

        {/* Copy All / Reset */}
        <div className="flex gap-2">
          <div className="flex-1"><CopyBtn content={buildAllCopy()} label="Copy All Captions" /></div>
          <button onClick={handleReset}
            className={`flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 ${c.btn}`}>
            <span>🔄</span> Start Over
          </button>
        </div>

        {renderCrossRefs()}
      </div>
    );
  };

  // ══════════════════════════════════════════
  // RENDER: Cross-References
  // ══════════════════════════════════════════
  const renderCrossRefs = () => (
    <div className={`p-4 rounded-2xl border ${c.card} mt-2`}>
      <p className={`text-xs font-bold ${c.textMut} uppercase tracking-wide mb-2`}>🔗 Related Tools</p>
      <div className={`space-y-1.5 text-xs ${c.textSec}`}>
        <p>Want to explore unexpected connections? <a href="/SixDegreesOfMe" target="_blank" rel="noopener noreferrer" className={c.linkStyle}>Six Degrees of Me</a> maps how you connect to anything.</p>
        <p>Need help with a tricky reply? <a href="/VelvetHammer" target="_blank" rel="noopener noreferrer" className={c.linkStyle}>Velvet Hammer</a> writes tough messages with tact.</p>
      </div>
    </div>
  );

  const renderError = () => error ? (
    <div className={`mt-4 p-4 ${c.errBg} border rounded-xl flex items-start gap-3`}>
      <span className={`text-base ${c.errText} flex-shrink-0`}>⚠️</span>
      <p className={`text-sm ${c.errText}`}>{error}</p>
    </div>
  ) : null;

  // ══════════════════════════════════════════
  // RENDER: History
  // ══════════════════════════════════════════
  const renderHistory = () => {
    if (history.length === 0) return null;
    const formatDate = (iso) => {
      try {
        const d = new Date(iso); const now = new Date();
        const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
        if (diff === 0) return 'Today';
        if (diff === 1) return 'Yesterday';
        if (diff < 7) return `${diff} days ago`;
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } catch { return ''; }
    };

    return (
      <div className={`mt-6 p-4 rounded-2xl border ${c.histBg}`}>
        <button onClick={() => setShowHistory(!showHistory)} className="w-full flex items-center gap-2 text-left">
          <span className={`text-base ${c.histAccent}`}>✨</span>
          <span className={`text-sm font-bold ${c.text} flex-1`}>Past Captions</span>
          <span className={`text-xs ${c.textMut}`}>{history.length}</span>
          <span className={`text-xs ${c.textMut}`}>{showHistory ? '▲' : '▼'}</span>
        </button>
        {showHistory && (
          <div className="mt-3 space-y-2">
            {history.map(entry => (
              <div key={entry.id} className={`rounded-xl border ${c.histCard} p-3 flex items-center gap-3`}>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-semibold ${c.text} truncate`}>{entry.preview}...</div>
                  <div className={`text-xs ${c.textMut} mt-0.5`}>{formatDate(entry.date)} · {entry.platform} · {entry.captionCount} captions</div>
                </div>
                <button onClick={() => loadFromHistory(entry)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${c.btnSec}`}>View</button>
                <button onClick={() => removeFromHistory(entry.id)} className={`px-2 py-1.5 rounded-lg text-xs ${c.btnGhost} hover:text-red-500`}>🗑️</button>
              </div>
            ))}
            {history.length > 1 && (
              <button onClick={() => setHistory([])}
                className={`w-full mt-1 text-center text-xs font-semibold ${c.btnGhost} hover:text-red-500 py-1.5`}>Clear all history</button>
            )}
          </div>
        )}
      </div>
    );
  };

  // ══════════════════════════════════════════
  // MAIN RENDER
  // ══════════════════════════════════════════
  return (
    <div>
      {renderHeader()}
      {!results && renderInputForm()}
      {results && renderResults()}
      {renderError()}
      {renderHistory()}
    </div>
  );
};

CaptionMagic.displayName = 'CaptionMagic';
export default CaptionMagic;
