import React, { useState, useRef, useCallback } from 'react';
import { Upload, Image as ImageIcon, Copy, Loader2, AlertCircle, Check, Sparkles, RefreshCw, X } from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';
import { compressImage, CompressionPresets } from '../utils/imageCompression';

// ════════════════════════════════════════════════════════════
// THEME
// ════════════════════════════════════════════════════════════
const useColors = () => {
  const { theme } = useTheme();
  const d = theme === 'dark';
  return {
    d,
    text: d ? 'text-zinc-50' : 'text-gray-900',
    textSec: d ? 'text-zinc-400' : 'text-gray-600',
    textMut: d ? 'text-zinc-500' : 'text-gray-500',
    border: d ? 'border-zinc-700' : 'border-stone-200',
    card: d ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-stone-200',
    inset: d ? 'bg-zinc-700' : 'bg-stone-100',
    input: d ? 'bg-zinc-700 border-zinc-600 text-zinc-100 placeholder-zinc-500 focus:border-fuchsia-500' : 'bg-white border-stone-300 text-gray-900 placeholder-stone-400 focus:border-fuchsia-500',
    btn: d ? 'bg-fuchsia-600 hover:bg-fuchsia-500 text-white' : 'bg-fuchsia-600 hover:bg-fuchsia-700 text-white',
    btnSec: d ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-200' : 'bg-stone-100 hover:bg-stone-200 text-gray-700',
    btnDis: d ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed' : 'bg-stone-200 text-stone-400 cursor-not-allowed',
    pillActive: d ? 'border-fuchsia-500 bg-fuchsia-900/30 text-fuchsia-300' : 'border-fuchsia-500 bg-fuchsia-50 text-fuchsia-700',
    pillInactive: d ? 'border-zinc-600 text-zinc-400 hover:border-zinc-500' : 'border-stone-200 text-gray-500 hover:border-stone-400',
    // Upload zone
    dropzone: d ? 'border-zinc-600 hover:border-fuchsia-500 bg-zinc-800' : 'border-stone-300 hover:border-fuchsia-400 bg-white',
    dropzoneActive: d ? 'border-fuchsia-500 bg-fuchsia-900/20' : 'border-fuchsia-400 bg-fuchsia-50',
    // Result cards
    captionBg: d ? 'bg-zinc-700/50' : 'bg-stone-50',
    captionBorder: d ? 'border-zinc-600' : 'border-stone-200',
    tonePill: d ? 'bg-fuchsia-900/30 text-fuchsia-300' : 'bg-fuchsia-100 text-fuchsia-700',
    hashtagPill: d ? 'bg-zinc-700 text-zinc-300' : 'bg-stone-100 text-stone-600',
    altBg: d ? 'bg-sky-900/20 border-sky-700/40' : 'bg-sky-50 border-sky-200',
    altText: d ? 'text-sky-300' : 'text-sky-800',
    altTitle: d ? 'text-sky-200' : 'text-sky-900',
    errBg: d ? 'bg-red-900/30 border-red-700' : 'bg-red-50 border-red-200',
    errText: d ? 'text-red-300' : 'text-red-700',
  };
};

// ════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════
const PLATFORMS = [
  { value: 'instagram', label: '📷 Instagram' },
  { value: 'linkedin', label: '💼 LinkedIn' },
  { value: 'facebook', label: '👥 Facebook' },
  { value: 'twitter', label: '🐦 Twitter/X' },
  { value: 'tiktok', label: '🎵 TikTok' },
  { value: 'threads', label: '🧵 Threads' },
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

// ════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════
const CaptionMagic = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const c = useColors();

  // ── Inputs ──
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [imageDescription, setImageDescription] = useState('');
  const [platform, setPlatform] = useState('instagram');
  const [selectedTones, setSelectedTones] = useState(['casual']);
  const [context, setContext] = useState('');
  const [compressing, setCompressing] = useState(false);
  const fileInputRef = useRef(null);

  // ── Results ──
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [lessHardIndex, setLessHardIndex] = useState(null);

  // ══════════════════════════════════════════
  // IMAGE HANDLING
  // ══════════════════════════════════════════
  const handleImageUpload = useCallback(async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }
    setError('');
    setCompressing(true);
    try {
      const compressed = await compressImage(file, CompressionPresets.API_UPLOAD);
      setImagePreview(compressed);
      setImageBase64(compressed);
    } catch (err) {
      setError(err.message || 'Failed to process image. Try a different photo.');
    } finally {
      setCompressing(false);
    }
  }, []);

  const handlePaste = useCallback(async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        for (const type of item.types) {
          if (type.startsWith('image/')) {
            const blob = await item.getType(type);
            setCompressing(true);
            setError('');
            try {
              const file = new File([blob], 'pasted-image.png', { type: blob.type });
              const compressed = await compressImage(file, CompressionPresets.API_UPLOAD);
              setImagePreview(compressed);
              setImageBase64(compressed);
            } catch (err) {
              setError(err.message || 'Failed to process pasted image');
            } finally {
              setCompressing(false);
            }
            return;
          }
        }
      }
      setError('No image found in clipboard');
    } catch (err) {
      setError('Failed to paste image. Try uploading instead.');
    }
  }, []);

  const clearImage = useCallback(() => {
    setImagePreview(null);
    setImageBase64(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  // ══════════════════════════════════════════
  // TONE TOGGLE
  // ══════════════════════════════════════════
  const toggleTone = useCallback((toneId) => {
    setSelectedTones(prev => {
      if (prev.includes(toneId)) return prev.filter(t => t !== toneId);
      if (prev.length >= 3) return prev;
      return [...prev, toneId];
    });
  }, []);

  // ══════════════════════════════════════════
  // API
  // ══════════════════════════════════════════
  const generate = useCallback(async () => {
    if (!imageBase64 && !imageDescription.trim()) {
      setError('Upload an image or describe what\'s in it');
      return;
    }
    if (selectedTones.length === 0) {
      setError('Select at least one tone');
      return;
    }
    setError(''); setResults(null);
    try {
      const data = await callToolEndpoint('caption-magic', {
        imageBase64,
        imageDescription: imageDescription.trim() || null,
        platform,
        tones: selectedTones,
        context: context.trim() || null,
      });
      setResults(data);
    } catch (err) {
      setError(err.message || 'Failed to generate captions. Try again.');
    }
  }, [imageBase64, imageDescription, platform, selectedTones, context, callToolEndpoint]);

  const makeLessTryHard = useCallback(async (caption, index) => {
    setLessHardIndex(index);
    try {
      const response = await callToolEndpoint('claude', {
        prompt: `Take this social media caption and make it less try-hard, more authentic and understated:\n\n"${caption.text}"\n\nReturn just the revised caption text, nothing else.`,
        maxTokens: 200,
      });
      setResults(prev => ({
        ...prev,
        captions: prev.captions.map((c, i) =>
          i === index ? { ...c, text: response.response.trim() } : c
        ),
      }));
    } catch (err) {
      console.error('Failed to revise caption:', err);
    } finally {
      setLessHardIndex(null);
    }
  }, [callToolEndpoint]);

  const copyCaption = useCallback(async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  }, []);

  const handleReset = useCallback(() => {
    clearImage();
    setImageDescription('');
    setContext('');
    setResults(null);
    setError('');
    setSelectedTones(['casual']);
  }, [clearImage]);

  // ══════════════════════════════════════════
  // RENDER: Pills
  // ══════════════════════════════════════════
  const renderPills = (options, value, setter, multi = false) => (
    <div className="flex flex-wrap gap-1.5">
      {options.map(opt => {
        const active = multi ? value.includes(opt.value) : value === opt.value;
        return (
          <button key={opt.value}
            onClick={() => multi ? setter(opt.value) : setter(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${active ? c.pillActive : c.pillInactive}`}>
            {active && <Check className="w-3 h-3 inline mr-1" />}
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
        <h2 className={`text-2xl font-bold ${c.text}`}>Caption Magic ✨</h2>
        <p className={`text-sm ${c.textMut}`}>Turn any photo into an engaging social media caption</p>
      </div>
    </div>
  );

  // ══════════════════════════════════════════
  // RENDER: Image Upload
  // ══════════════════════════════════════════
  const renderImageUpload = () => (
    <div className={`p-5 rounded-2xl border ${c.border} ${c.card}`}>
      <label className={`text-xs font-bold ${c.textSec} uppercase tracking-wide mb-3 block`}>📷 Your photo</label>

      {compressing ? (
        <div className={`border-2 border-dashed rounded-xl p-8 text-center ${c.dropzoneActive}`}>
          <Loader2 className={`w-8 h-8 mx-auto mb-3 animate-spin ${c.textMut}`} />
          <p className={`text-sm font-semibold ${c.text}`}>Compressing image...</p>
        </div>
      ) : !imagePreview ? (
        <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${c.dropzone}`}>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="image-upload" />
          <Upload className={`w-8 h-8 mx-auto mb-3 ${c.textMut}`} />
          <div className="flex items-center justify-center gap-2 mb-3">
            <label htmlFor="image-upload"
              className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer ${c.btn}`}>
              Upload Image
            </label>
            <button onClick={handlePaste}
              className={`px-4 py-2 rounded-lg text-xs font-bold ${c.btnSec}`}>
              Paste from Clipboard
            </button>
          </div>
          <p className={`text-xs ${c.textMut}`}>or describe your photo below</p>
        </div>
      ) : (
        <div className="relative">
          <img src={imagePreview} alt="Preview"
            className={`w-full max-h-72 object-contain rounded-xl border ${c.border}`} />
          <button onClick={clearImage}
            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-lg transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <input type="text" value={imageDescription} onChange={e => setImageDescription(e.target.value)}
        placeholder="Or describe what's in the photo (e.g., 'coffee on my desk with laptop')"
        className={`w-full mt-3 px-4 py-2.5 rounded-xl border text-sm ${c.input} outline-none`} />
    </div>
  );

  // ══════════════════════════════════════════
  // RENDER: Input Form
  // ══════════════════════════════════════════
  const renderInputForm = () => (
    <div className="space-y-4">
      {renderImageUpload()}

      {/* Platform */}
      <div className={`p-5 rounded-2xl border ${c.border} ${c.card}`}>
        <label className={`text-xs font-bold ${c.textSec} uppercase tracking-wide mb-2 block`}>📱 Platform</label>
        {renderPills(PLATFORMS, platform, setPlatform)}
      </div>

      {/* Tone */}
      <div className={`p-5 rounded-2xl border ${c.border} ${c.card}`}>
        <label className={`text-xs font-bold ${c.textSec} uppercase tracking-wide mb-1 block`}>🎭 Tone</label>
        <p className={`text-xs ${c.textMut} mb-2`}>Pick up to 3</p>
        {renderPills(TONES, selectedTones, toggleTone, true)}
      </div>

      {/* Context */}
      <div className={`p-5 rounded-2xl border ${c.border} ${c.card}`}>
        <label className={`text-xs font-bold ${c.textSec} uppercase tracking-wide mb-1 block`}>💬 Context</label>
        <p className={`text-xs ${c.textMut} mb-2`}>Optional — backstory helps craft better captions</p>
        <input type="text" value={context} onChange={e => setContext(e.target.value)}
          placeholder="e.g., 'Team retreat in Colorado' or 'First time making sourdough'"
          className={`w-full px-4 py-2.5 rounded-xl border text-sm ${c.input} outline-none`} />
      </div>

      {/* Generate */}
      <button onClick={generate}
        disabled={loading || (!imageBase64 && !imageDescription.trim())}
        className={`w-full py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all
          ${loading || (!imageBase64 && !imageDescription.trim()) ? c.btnDis : c.btn}`}>
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Crafting captions...</>
        ) : (
          <><Sparkles className="w-4 h-4" /> Generate Captions</>
        )}
      </button>
    </div>
  );

  // ══════════════════════════════════════════
  // RENDER: Results
  // ══════════════════════════════════════════
  const renderResults = () => {
    if (!results) return null;
    const captions = results.captions || [];

    return (
      <div className="space-y-4 mt-4">
        {/* Results header */}
        <div className="flex items-center justify-between">
          <h3 className={`text-sm font-bold ${c.text}`}>Your Captions</h3>
          <div className="flex gap-2">
            {results.best_posting_time && (
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${c.inset} ${c.textMut}`}>
                Best time: {results.best_posting_time}
              </span>
            )}
            <button onClick={handleReset}
              className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 ${c.btnSec}`}>
              <RefreshCw className="w-3 h-3" /> New
            </button>
          </div>
        </div>

        {/* Alt text */}
        {results.alt_text && (
          <div className={`p-4 rounded-xl border ${c.altBg}`}>
            <div className={`text-xs font-bold mb-1 ${c.altTitle}`}>Accessibility (Alt Text)</div>
            <p className={`text-sm ${c.altText}`}>{results.alt_text}</p>
          </div>
        )}

        {/* Caption cards */}
        {captions.map((caption, index) => (
          <div key={index} className={`p-5 rounded-2xl border ${c.card}`}>
            {/* Meta row */}
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${c.tonePill}`}>{caption.tone}</span>
              {caption.char_count && <span className={`text-xs ${c.textMut}`}>{caption.char_count} chars</span>}
            </div>
            {caption.why_it_works && <p className={`text-xs ${c.textSec} mb-3`}>{caption.why_it_works}</p>}

            {/* Caption text */}
            <div className={`p-4 rounded-xl border ${c.captionBg} ${c.captionBorder} mb-3`}>
              <p className={`text-sm leading-relaxed whitespace-pre-wrap ${c.text}`}>{caption.text}</p>
            </div>

            {/* Hashtags */}
            {caption.hashtags?.length > 0 && (
              <div className="mb-3">
                <div className={`text-xs font-semibold ${c.textSec} mb-1.5`}>Hashtags</div>
                <div className="flex flex-wrap gap-1.5">
                  {caption.hashtags.map((tag, i) => (
                    <span key={i} className={`px-2 py-0.5 rounded text-xs font-medium ${c.hashtagPill}`}>#{tag}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <button onClick={() => copyCaption(caption.text + (caption.hashtags?.length ? '\n\n' + caption.hashtags.map(h => '#' + h).join(' ') : ''), index)}
                className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 ${c.btn}`}>
                {copiedIndex === index ? <><Check className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy</>}
              </button>
              <button onClick={() => makeLessTryHard(caption, index)}
                disabled={lessHardIndex === index}
                className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 ${c.btnSec}`}>
                {lessHardIndex === index ? (
                  <><Loader2 className="w-3 h-3 animate-spin" /> Toning down...</>
                ) : (
                  '😌 Less try-hard'
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

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
  // MAIN RENDER
  // ══════════════════════════════════════════
  return (
    <div>
      {renderHeader()}
      {renderInputForm()}
      {renderResults()}
      {renderError()}
    </div>
  );
};

CaptionMagic.displayName = 'CaptionMagic';
export default CaptionMagic;
