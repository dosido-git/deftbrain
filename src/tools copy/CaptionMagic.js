import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Copy, Loader2, AlertCircle, Check, Sparkles } from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { compressImage, CompressionPresets } from '../utils/imageCompression';

const CaptionMagic = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [imageDescription, setImageDescription] = useState('');
  const [platform, setPlatform] = useState('instagram');
  const [selectedTones, setSelectedTones] = useState(['casual', 'funny']);
  const [context, setContext] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [lessHardIndex, setLessHardIndex] = useState(null);
  const [compressing, setCompressing] = useState(false);
  
  const fileInputRef = useRef(null);

  const platforms = [
    { id: 'instagram', name: 'Instagram', icon: '📷', color: 'from-purple-500 to-emerald-500' },
    { id: 'linkedin', name: 'LinkedIn', icon: '💼', color: 'from-blue-600 to-blue-700' },
    { id: 'facebook', name: 'Facebook', icon: '👥', color: 'from-blue-500 to-blue-600' },
    { id: 'twitter', name: 'Twitter/X', icon: '🐦', color: 'from-sky-400 to-blue-500' }
  ];

  const toneOptions = [
    { id: 'funny', label: 'Self-deprecating humor', example: '"Another coffee pic, groundbreaking"' },
    { id: 'reflective', label: 'Genuine reflection', example: '"Small moments that matter"' },
    { id: 'professional', label: 'Professional insight', example: '"Key learnings from today"' },
    { id: 'casual', label: 'Casual & authentic', example: '"Just vibing"' },
    { id: 'inspirational', label: 'Enthusiastic', example: '"Living my best life!"' },
    { id: 'minimal', label: 'Minimal/aesthetic', example: '"☀️"' }
  ];

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    setError('');
    setCompressing(true);

    try {
      // Compress image for API upload
      const compressed = await compressImage(file, CompressionPresets.API_UPLOAD);
      
      // Log compression results
      const originalSizeKB = Math.round(file.size / 1024);
      const compressedSizeKB = Math.round((compressed.length * 0.75) / 1024);
      const savingsPercent = Math.round((1 - compressedSizeKB / originalSizeKB) * 100);
      
      console.log(`Caption image compressed: ${originalSizeKB}KB → ${compressedSizeKB}KB (${savingsPercent}% smaller)`);
      
      setImagePreview(compressed);
      setImageBase64(compressed);
    } catch (err) {
      setError(err.message || 'Failed to process image. Try a different photo.');
      console.error('Image compression error:', err);
    } finally {
      setCompressing(false);
    }
  };

  const handlePaste = async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        for (const type of item.types) {
          if (type.startsWith('image/')) {
            const blob = await item.getType(type);
            
            setCompressing(true);
            setError('');
            
            try {
              // Convert blob to file for compression
              const file = new File([blob], 'pasted-image.png', { type: blob.type });
              const compressed = await compressImage(file, CompressionPresets.API_UPLOAD);
              
              setImagePreview(compressed);
              setImageBase64(compressed);
            } catch (err) {
              setError(err.message || 'Failed to process pasted image');
              console.error('Paste compression error:', err);
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
  };

  const toggleTone = (toneId) => {
    setSelectedTones(prev => 
      prev.includes(toneId) 
        ? prev.filter(t => t !== toneId)
        : [...prev, toneId]
    );
  };

  const handleGenerate = async () => {
    if (!imageBase64 && !imageDescription.trim()) {
      setError('Please upload an image or describe what\'s in it');
      return;
    }

    if (selectedTones.length === 0) {
      setError('Please select at least one tone');
      return;
    }

    setError('');
    setResults(null);

    try {
      const data = await callToolEndpoint('caption-magic', {
        imageBase64: imageBase64,
        imageDescription: imageDescription.trim() || null,
        platform,
        tones: selectedTones,
        context: context.trim() || null
      });
      
      setResults(data);
    } catch (err) {
      setError(err.message || 'Failed to generate captions. Please try again.');
    }
  };

  const copyToClipboard = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const handleReset = () => {
    setImagePreview(null);
    setImageBase64(null);
    setImageDescription('');
    setContext('');
    setResults(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const makeLessTryHard = async (caption, index) => {
    setLessHardIndex(index);
    try {
      const response = await callToolEndpoint('claude', {
        prompt: `Take this social media caption and make it less try-hard, more authentic and understated:

"${caption.text}"

Return just the revised caption text, nothing else.`,
        maxTokens: 200
      });

      // Update the caption in results
      setResults(prev => ({
        ...prev,
        captions: prev.captions.map((c, i) => 
          i === index ? { ...c, text: response.response.trim() } : c
        )
      }));
    } catch (err) {
      console.error('Failed to revise caption:', err);
    } finally {
      setLessHardIndex(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <Sparkles className="w-8 h-8 text-purple-600" />
            <h1 className="text-4xl font-bold text-slate-900">Photo Caption Generator</h1>
          </div>
          <p className="text-slate-600">Turn mundane photos into engaging social media captions</p>
          <div className="mt-3 inline-flex items-center gap-2 text-sm text-slate-500 bg-white px-4 py-2 rounded-full shadow-sm">
            <ImageIcon className="w-4 h-4" />
            Works with any photo — even boring ones
          </div>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          {/* Image Upload */}
          <div className="mb-6">
            <label className="block text-lg font-semibold text-slate-900 mb-3">
              Your Photo
            </label>
            
            {compressing ? (
              <div className="border-2 border-dashed border-purple-400 rounded-xl p-8 text-center bg-purple-50">
                <Loader2 className="w-12 h-12 text-purple-600 mx-auto mb-4 animate-spin" />
                <p className="text-lg font-semibold text-slate-900">Compressing image...</p>
                <p className="text-sm text-slate-500 mt-1">Large photos may take a moment</p>
              </div>
            ) : !imagePreview ? (
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-purple-400 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                
                <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                
                <label
                  htmlFor="image-upload"
                  className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg cursor-pointer transition-colors mb-3"
                >
                  Upload Image
                </label>
                
                <button
                  onClick={handlePaste}
                  className="ml-3 inline-block bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  Paste from Clipboard
                </button>
                
                <p className="text-sm text-slate-500 mt-4">or describe your photo below</p>
                <p className="text-xs text-slate-400 mt-2">✨ We automatically optimize large images for faster uploads</p>
              </div>
            ) : (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full max-h-96 object-contain rounded-xl border-2 border-slate-200"
                />
                <button
                  onClick={handleReset}
                  className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors"
                >
                  ✕ Remove
                </button>
              </div>
            )}

            <div className="mt-4">
              <input
                type="text"
                value={imageDescription}
                onChange={(e) => setImageDescription(e.target.value)}
                placeholder="Or describe what's in the photo (e.g., 'coffee on my desk with laptop')"
                className="w-full p-3 border border-slate-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none text-slate-900"
              />
            </div>
          </div>

          {/* Platform Selection */}
          <div className="mb-6">
            <label className="block text-lg font-semibold text-slate-900 mb-3">
              Platform
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {platforms.map(p => (
                <button
                  key={p.id}
                  onClick={() => setPlatform(p.id)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    platform === p.id
                      ? `border-purple-500 bg-gradient-to-br ${p.color} text-white shadow-lg`
                      : 'border-slate-200 hover:border-purple-300 bg-white text-slate-700'
                  }`}
                >
                  <div className="text-3xl mb-1">{p.icon}</div>
                  <div className="font-semibold text-sm">{p.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Tone Selection */}
          <div className="mb-6">
            <label className="block text-lg font-semibold text-slate-900 mb-3">
              Tone (select 1-3)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {toneOptions.map(tone => (
                <button
                  key={tone.id}
                  onClick={() => toggleTone(tone.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    selectedTones.includes(tone.id)
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-slate-200 hover:border-purple-300 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      selectedTones.includes(tone.id)
                        ? 'border-purple-500 bg-purple-500'
                        : 'border-slate-300'
                    }`}>
                      {selectedTones.includes(tone.id) && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-slate-900">{tone.label}</div>
                      <div className="text-sm text-slate-500 mt-1">{tone.example}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Optional Context */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <span className="text-purple-600">Optional:</span> Add context
            </label>
            <input
              type="text"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="e.g., 'This was from a team retreat in Colorado'"
              className="w-full p-3 border border-slate-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none text-slate-900"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleGenerate}
              disabled={loading || (!imageBase64 && !imageDescription.trim())}
              className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Crafting captions...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Captions
                </>
              )}
            </button>
            
            {(imagePreview || imageDescription || results) && (
              <button
                onClick={handleReset}
                className="px-6 py-3 border-2 border-slate-300 hover:border-slate-400 text-slate-700 font-semibold rounded-lg transition-colors"
              >
                Reset
              </button>
            )}
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Results Section */}
        {results && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">Your Captions</h2>
              {results.best_posting_time && (
                <div className="text-sm text-slate-600 bg-white px-4 py-2 rounded-full shadow-sm">
                  ⏰ Best time: {results.best_posting_time}
                </div>
              )}
            </div>

            {/* Alt Text */}
            {results.alt_text && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="font-semibold text-blue-900 mb-1">Accessibility (Alt Text)</div>
                <p className="text-blue-800 text-sm">{results.alt_text}</p>
              </div>
            )}
            
            {/* Caption Cards */}
            <div className="grid grid-cols-1 gap-4">
              {results.captions?.map((caption, index) => (
                <div key={index} className="bg-white rounded-xl shadow-lg p-6 border-2 border-slate-200 hover:border-purple-300 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                          {caption.tone}
                        </span>
                        <span className="text-sm text-slate-500">
                          {caption.char_count} characters
                        </span>
                        {caption.emoji_used && (
                          <span className="text-sm text-slate-500">• 😊 Emoji</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600">{caption.why_it_works}</p>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 mb-3">
                    <p className="text-slate-900 text-lg leading-relaxed whitespace-pre-wrap">
                      {caption.text}
                    </p>
                  </div>

                  {caption.hashtags && caption.hashtags.length > 0 && (
                    <div className="mb-3">
                      <div className="text-sm font-medium text-slate-700 mb-1">Suggested hashtags:</div>
                      <div className="flex flex-wrap gap-2">
                        {caption.hashtags.map((tag, i) => (
                          <span key={i} className="inline-block px-2 py-1 bg-slate-100 text-slate-600 rounded text-sm">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => copyToClipboard(caption.text, index)}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                      {copiedIndex === index ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy Caption
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => makeLessTryHard(caption, index)}
                      disabled={lessHardIndex === index}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 text-slate-700 rounded-lg transition-colors text-sm font-medium"
                    >
                      {lessHardIndex === index ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Toning down...
                        </>
                      ) : (
                        '😌 Make it less try-hard'
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CaptionMagic;