import React, { useState, useEffect } from 'react';
import { Heart, Mail, Gift, Loader2, Copy, Send, RefreshCw, Plus, Minus, AlertCircle } from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';

/**
 * TypeScript-style interfaces (for documentation)
 * 
 * interface GratitudeInput {
 *   recipientName: string;
 *   gratitudePoints: string;
 *   context: string;
 *   relationship: string;
 *   tone: string;
 *   length: number; // 1-10 scale
 *   specificGiftDetails?: string; // NEW: Specific details about gift
 *   howYoullUseIt?: string; // NEW: How recipient will use the gift
 *   culturalContext: string; // NEW: Cultural background for etiquette
 *   deliveryMethod: string; // NEW: How message will be sent
 *   needHandwritingTemplate: boolean; // NEW: Generate handwriting layout
 * }
 * 
 * interface ThankYouMessage {
 *   version: string;
 *   message_text: string;
 *   tone: string;
 *   length: number;
 *   why_this_works: string;
 *   best_for: string;
 * }
 * 
 * interface HandwritingTemplate {
 *   opening_placement: string;
 *   message_layout: string;
 *   closing_placement: string;
 *   font_suggestions: string[];
 *   writing_tips: string[];
 *   length_guidance: string;
 * }
 * 
 * interface APIResponse {
 *   thank_you_messages: ThankYouMessage[];
 *   delivery_suggestions: {
 *     method: string;
 *     timing: string;
 *     timing_cultural_note?: string; // NEW
 *     additional_gesture: string;
 *   };
 *   personalization_tips: string[];
 *   if_you_feel_awkward: {
 *     permission: string;
 *     reframe: string;
 *   };
 *   handwriting_template?: HandwritingTemplate; // NEW: Optional
 * }
 */

const GratitudeDebtClearer = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
    const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Theme-aware colors
  const c = {
    bg: isDark ? 'bg-zinc-900' : 'bg-gradient-to-br from-emerald-50 to-emerald-50',
    card: isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-emerald-200',
    cardAlt: isDark ? 'bg-zinc-700 border-zinc-600' : 'bg-emerald-50 border-emerald-200',
    
    input: isDark
      ? 'bg-zinc-900 border-zinc-700 text-zinc-50 placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20'
      : 'bg-white border-emerald-300 text-emerald-900 placeholder:text-emerald-400 focus:border-emerald-600 focus:ring-emerald-100',
    
    text: isDark ? 'text-zinc-50' : 'text-emerald-900',
    textSecondary: isDark ? 'text-zinc-300' : 'text-emerald-700',
    textMuted: isDark ? 'text-zinc-400' : 'text-emerald-600',
    label: isDark ? 'text-zinc-200' : 'text-emerald-800',
    
    btnPrimary: isDark
      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
      : 'bg-emerald-600 hover:bg-emerald-700 text-white',
    btnSecondary: isDark
      ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-100'
      : 'bg-slate-100 hover:bg-slate-200 text-slate-800',
    
    success: isDark
      ? 'bg-emerald-900/20 border-emerald-700 text-emerald-200'
      : 'bg-emerald-50 border-emerald-200 text-emerald-800',
    warning: isDark
      ? 'bg-amber-900/20 border-amber-700 text-amber-200'
      : 'bg-amber-50 border-amber-200 text-amber-800',
    error: isDark
      ? 'bg-red-900/20 border-red-700 text-red-200'
      : 'bg-red-50 border-red-200 text-red-800',
  };
  // Helper function to detect cultural context from browser locale
  const detectCulturalContext = () => {
    const locale = navigator.language || navigator.userLanguage || 'en-US';
    const lowercaseLocale = locale.toLowerCase();
    
    // Map browser locales to cultural contexts
    if (lowercaseLocale.startsWith('ja') || lowercaseLocale.startsWith('ko') || 
        lowercaseLocale.startsWith('zh')) {
      return 'East Asian (Japanese, Korean, Chinese)';
    }
    if (lowercaseLocale.startsWith('hi') || lowercaseLocale.startsWith('ur') || 
        lowercaseLocale.startsWith('pa') || lowercaseLocale.startsWith('bn') ||
        lowercaseLocale.startsWith('ta') || lowercaseLocale.startsWith('te')) {
      return 'South Asian (Indian, Pakistani)';
    }
    if (lowercaseLocale.startsWith('ar') || lowercaseLocale.startsWith('fa') || 
        lowercaseLocale.startsWith('he') || lowercaseLocale.startsWith('tr')) {
      return 'Middle Eastern';
    }
    if (lowercaseLocale.startsWith('es-mx') || lowercaseLocale.startsWith('es-co') || 
        lowercaseLocale.startsWith('es-ar') || lowercaseLocale.startsWith('pt-br') ||
        lowercaseLocale.startsWith('es-cl') || lowercaseLocale.startsWith('es-pe')) {
      return 'Latin American';
    }
    if (lowercaseLocale.startsWith('en-gb') || lowercaseLocale.startsWith('en-au') || 
        lowercaseLocale.startsWith('en-nz') || lowercaseLocale.startsWith('en-ca') ||
        lowercaseLocale.startsWith('en-ie') || lowercaseLocale.startsWith('en-za')) {
      return 'British/Commonwealth';
    }
    if (lowercaseLocale.startsWith('af') || lowercaseLocale.startsWith('sw') ||
        lowercaseLocale.startsWith('am') || lowercaseLocale.startsWith('ha')) {
      return 'African';
    }
    
    // Default to American/Western for en-US and other locales
    return 'American/Western';
  };
  
  // Form state
  const [recipientName, setRecipientName] = useState('');
  const [gratitudePoints, setGratitudePoints] = useState('');
  const [context, setContext] = useState('General kindness');
  const [relationship, setRelationship] = useState('Personal');
  const [tone, setTone] = useState('Warm & casual');
  const [length, setLength] = useState(5); // 1-10 scale
  
  // New: Enhanced specificity fields
  const [specificGiftDetails, setSpecificGiftDetails] = useState('');
  const [howYoullUseIt, setHowYoullUseIt] = useState('');
  
  // New: Cultural context - will be set by useEffect
  const [culturalContext, setCulturalContext] = useState('American/Western');
  
  // New: Delivery preferences
  const [deliveryMethod, setDeliveryMethod] = useState('Let AI suggest');
  const [needHandwritingTemplate, setNeedHandwritingTemplate] = useState(false);
  
  // Results state
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [adjustingIndex, setAdjustingIndex] = useState(null);

  // Detect and set cultural context on component mount
  useEffect(() => {
    const detectedContext = detectCulturalContext();
    setCulturalContext(detectedContext);
    console.log('Detected cultural context:', detectedContext, 'from locale:', navigator.language);
  }, []);

  const contextOptions = [
    'Post-interview',
    'Gift received',
    'Emotional support',
    'Mentorship',
    'Hospitality',
    'General kindness',
    'Professional help',
    'Personal favor',
    'Condolence support',
    'Wedding gift',
    'Baby shower gift',
    'Get well soon',
    'Recommendation/Reference',
    'Business opportunity'
  ];

  const relationshipOptions = [
    'Professional',
    'Personal',
    'Family',
    'Casual acquaintance'
  ];

  const culturalContextOptions = [
    'American/Western',
    'British/Commonwealth',
    'East Asian (Japanese, Korean, Chinese)',
    'South Asian (Indian, Pakistani)',
    'Middle Eastern',
    'Latin American',
    'African',
    'Southern US',
    'Not sure/Mixed'
  ];

  const deliveryMethodOptions = [
    'Let AI suggest',
    'Email',
    'Handwritten card',
    'Text message',
    'In-person',
    'Social media message'
  ];

  const toneOptions = [
    { id: 'warm', label: 'Warm & casual', icon: '😊' },
    { id: 'heartfelt', label: 'Heartfelt & emotional', icon: '❤️' },
    { id: 'professional', label: 'Professional', icon: '💼' },
    { id: 'brief', label: 'Brief', icon: '✨' }
  ];

  const handleGenerate = async () => {
    if (!recipientName.trim()) {
      setError('Please enter who you\'re thanking');
      return;
    }

    if (!gratitudePoints.trim()) {
      setError('Please list what you\'re grateful for');
      return;
    }

    setError('');
    setResults(null);

 console.log('Sending to API:', {
    recipientName,
    gratitudePoints,
    needHandwritingTemplate,  // ← Should log true when checked
    // ... other fields
  });
  
    try {
      const data = await callToolEndpoint('gratitude-debt-clearer', {
        recipientName: recipientName.trim(),
        gratitudePoints: gratitudePoints.trim(),
        context,
        relationship,
        tone,
        length,
        specificGiftDetails: specificGiftDetails.trim() || null,
        howYoullUseIt: howYoullUseIt.trim() || null,
        culturalContext,
        deliveryMethod,
        needHandwritingTemplate,
      });
 
      
      setResults(data);
    } catch (err) {
      setError(err.message || 'Failed to generate messages. Please try again.');
    }
  };

  const handleAdjust = async (message, index, adjustment) => {
    setAdjustingIndex(index);
    setError('');

    try {
      let adjustmentPrompt = '';
      if (adjustment === 'less-mushy') {
        adjustmentPrompt = 'Make this thank you message less intense and more understated while keeping it sincere';
      } else if (adjustment === 'more-specific') {
        adjustmentPrompt = 'Make this thank you message more specific by elaborating on the details';
      }

      const data = await callToolEndpoint('gratitude-debt-clearer', {
        recipientName: recipientName.trim(),
        gratitudePoints: gratitudePoints.trim(),
        context,
        relationship,
        tone,
        length,
        specificGiftDetails: specificGiftDetails.trim() || null,
        howYoullUseIt: howYoullUseIt.trim() || null,
        culturalContext,
        deliveryMethod,
        needHandwritingTemplate,
        adjustmentPrompt,
        originalMessage: message.message_text
      });

      // Update just this message
      setResults(prev => ({
        ...prev,
        thank_you_messages: prev.thank_you_messages.map((msg, i) => 
          i === index ? data.thank_you_messages[0] : msg
        )
      }));
    } catch (err) {
      setError('Failed to adjust message. Please try again.');
    } finally {
      setAdjustingIndex(null);
    }
  };

  const copyToClipboard = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      setError('Failed to copy to clipboard');
    }
  };

  const handleReset = () => {
    setRecipientName('');
    setGratitudePoints('');
    setContext('General kindness');
    setRelationship('Personal');
    setTone('Warm & casual');
    setLength(5);
    setSpecificGiftDetails('');
    setHowYoullUseIt('');
    setCulturalContext('American/Western');
    setDeliveryMethod('Let AI suggest');
    setNeedHandwritingTemplate(false);
    setResults(null);
    setError('');
  };

  return (
  <div className={`min-h-screen ${c.bg} py-8 px-4`}>
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className={`${c.card} border rounded-xl shadow-lg p-6 transition-colors duration-200`}>
        <div className="flex items-center gap-3 mb-4">
          <div>
            <h2 className={`text-2xl font-bold ${c.text}`}>Gratitude Debt Clearer 💝</h2>
            <p className={`text-sm ${c.textMuted}`}>Turn your gratitude into heartfelt messages – without the writing paralysis</p>
          </div>
        </div>
      </div>

      {/* Input Form */}
      <div className={`${c.card} border rounded-xl shadow-lg p-6`}>
          {/* Recipient Name */}
          <div className="mb-6">
            <label 
              htmlFor="recipient-name"
              className={`block text-lg font-semibold ${c.text} mb-3`}
            >
              Who are you thanking?
            </label>
            <input
              id="recipient-name"
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="e.g., Sarah, Dr. Martinez, the whole team"
              className={`w-full p-4 border-2 border-slate-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none ${c.text} placeholder:text-slate-500`}
              aria-required="true"
            />
          </div>

          {/* Gratitude Points */}
          <div className="mb-6">
            <label 
              htmlFor="gratitude-points"
              className={`block text-lg font-semibold ${c.text} mb-3`}
            >
              What are you grateful for?
            </label>
            <textarea
              id="gratitude-points"
              value={gratitudePoints}
              onChange={(e) => setGratitudePoints(e.target.value)}
              placeholder="List the things you're thankful for (bullet points or free-form):&#10;• Helped me move apartments&#10;• Listened when I was stressed&#10;• Recommended me for the job&#10;• Made me feel welcome"
              className={`w-full h-40 p-4 border-2 border-slate-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none resize-none ${c.text} placeholder:text-slate-500`}
              aria-required="true"
            />
            <p className="text-sm text-slate-500 mt-2">
              💡 Be specific! The more details you give, the more personal your message will be.
            </p>
          </div>

          {/* Gift Specificity Enhancement - Show for gift-related contexts */}
          {(context === 'Gift received' || context === 'Wedding gift' || context === 'Baby shower gift') && (
            <div className="mb-6 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg">
              <h3 className="text-sm font-semibold text-amber-900 mb-3 flex items-center gap-2">
                <Gift className="w-4 h-4" />
                Make It Extra Personal (Optional)
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label 
                    htmlFor="gift-details"
                    className="block text-sm font-medium text-amber-900 mb-2"
                  >
                    Specific details about the gift
                  </label>
                  <input
                    id="gift-details"
                    type="text"
                    value={specificGiftDetails}
                    onChange={(e) => setSpecificGiftDetails(e.target.value)}
                    placeholder="e.g., 'the blue scarf', 'the cookbook with Italian recipes', 'the personalized mug'"
                    className={`w-full p-3 border border-amber-300 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none ${c.text} placeholder:text-slate-500 bg-white`}
                  />
                </div>
                
                <div>
                  <label 
                    htmlFor="how-use"
                    className="block text-sm font-medium text-amber-900 mb-2"
                  >
                    How you'll use it or what it means to you
                  </label>
                  <input
                    id="how-use"
                    type="text"
                    value={howYoullUseIt}
                    onChange={(e) => setHowYoullUseIt(e.target.value)}
                    placeholder="e.g., 'I'll wear it to work', 'reminds me of our trip', 'perfect for my morning coffee'"
                    className={`w-full p-3 border border-amber-300 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none ${c.text} placeholder:text-slate-500 bg-white`}
                  />
                </div>
              </div>
              
              <p className="text-xs text-amber-700 mt-2">
                ✨ These details will make your thank-you feel much more thoughtful and genuine
              </p>
            </div>
          )}

          {/* Context and Relationship Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label 
                htmlFor="context"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Context / Occasion
              </label>
              <select
                id="context"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className={`w-full p-3 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none ${c.text} bg-white`}
              >
                {contextOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div>
              <label 
                htmlFor="relationship"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Your Relationship
              </label>
              <select
                id="relationship"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className={`w-full p-3 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none ${c.text} bg-white`}
              >
                {relationshipOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tone Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Tone Preference
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {toneOptions.map(option => (
                <button
                  key={option.id}
                  onClick={() => setTone(option.label)}
                  className={`p-3 rounded-lg border-2 transition-all text-center ${
                    tone === option.label
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                      : 'border-slate-200 hover:border-emerald-300 bg-white text-slate-700'
                  }`}
                  aria-pressed={tone === option.label}
                >
                  <div className="text-2xl mb-1">{option.icon}</div>
                  <div className="text-sm font-medium">{option.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Cultural Context */}
          <div className="mb-6">
            <label 
              htmlFor="cultural-context"
              className="block text-sm font-medium text-slate-700 mb-2"
            >
              Cultural Context (helps with formality and etiquette)
            </label>
            <select
              id="cultural-context"
              value={culturalContext}
              onChange={(e) => setCulturalContext(e.target.value)}
              className={`w-full p-3 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none ${c.text} bg-white`}
            >
              {culturalContextOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-1">
              ✨ Auto-detected from your browser settings. Different cultures have different gratitude etiquette — this helps tailor the formality and timing.
            </p>
          </div>

          {/* Delivery Method */}
          <div className="mb-6">
            <label 
              htmlFor="delivery-method"
              className="block text-sm font-medium text-slate-700 mb-2"
            >
              How will you send this?
            </label>
            <select
              id="delivery-method"
              value={deliveryMethod}
              onChange={(e) => setDeliveryMethod(e.target.value)}
              className={`w-full p-3 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none ${c.text} bg-white`}
            >
              {deliveryMethodOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Handwriting Template Option */}
          <div className="mb-6">
            <label className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors">
              <input
                type="checkbox"
                checked={needHandwritingTemplate}
                onChange={(e) => setNeedHandwritingTemplate(e.target.checked)}
                className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500"
              />
              <div className="flex-1">
                <div className="font-medium text-blue-900">Generate handwritten card template</div>
                <div className="text-sm text-blue-700">
                  Get layout guidance, font suggestions, and formatting for physical cards
                </div>
              </div>
            </label>
          </div>

          {/* Length Slider */}
          <div className="mb-6">
            <label 
              htmlFor="length-slider"
              className="block text-sm font-medium text-slate-700 mb-3"
            >
              Message Length: <span className="text-emerald-600 font-semibold">
                {length <= 3 ? 'Concise' : length <= 7 ? 'Moderate' : 'Detailed'}
              </span>
            </label>
            <input
              id="length-slider"
              type="range"
              min="1"
              max="10"
              value={length}
              onChange={(e) => setLength(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              aria-valuemin="1"
              aria-valuemax="10"
              aria-valuenow={length}
              aria-label="Message length slider"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>Short & sweet</span>
              <span>Detailed & thorough</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleGenerate}
              disabled={loading || !recipientName.trim() || !gratitudePoints.trim()}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
              aria-label="Generate thank you messages"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Crafting messages...
                </>
              ) : (
                <>
                  <Heart className="w-5 h-5" />
                  Generate Thank You Messages
                </>
              )}
            </button>
            
            {results && (
              <button
                onClick={handleReset}
                className="px-6 py-3 border-2 border-slate-300 hover:border-slate-400 text-slate-700 font-semibold rounded-lg transition-colors"
                aria-label="Reset form"
              >
                Reset
              </button>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div 
              className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
              role="alert"
            >
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Results Section */}
        {results && (
          <div className="space-y-6">
            {/* Awkwardness Acknowledgment */}
            {results.if_you_feel_awkward && (
              <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <Gift className="w-5 h-5 text-purple-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-purple-900 font-medium mb-1">
                      {results.if_you_feel_awkward.permission}
                    </p>
                    <p className="text-purple-800 text-sm">
                      {results.if_you_feel_awkward.reframe}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Message Options */}
            <div>
              <h2 className={`text-2xl font-bold ${c.text} mb-4`}>
                Your Thank You Messages
              </h2>
              
              <div className="space-y-4">
                {results.thank_you_messages?.map((message, index) => (
                  <div 
                    key={index} 
                    className="bg-white rounded-xl shadow-lg p-6 border-2 border-slate-200 hover:border-emerald-300 transition-colors"
                  >
                    {/* Message Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className={`text-lg font-bold ${c.text} mb-1`}>
                          {message.version}
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-slate-700">
                          <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full font-medium">
                            {message.tone}
                          </span>
                          <span>{message.length} words</span>
                        </div>
                      </div>
                    </div>

                    {/* Why This Works */}
                    <div className="bg-blue-50 border-l-4 border-blue-400 rounded-r-lg p-3 mb-4">
                      <p className="text-sm text-blue-900">
                        <strong>Why this works:</strong> {message.why_this_works}
                      </p>
                      <p className="text-sm text-blue-800 mt-1">
                        <strong>Best for:</strong> {message.best_for}
                      </p>
                    </div>

                    {/* Message Text */}
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 mb-4">
                      <p className={`${c.text} text-base leading-relaxed whitespace-pre-wrap`}>
                        {message.message_text}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => copyToClipboard(message.message_text, index)}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-medium"
                        aria-label={`Copy ${message.version} to clipboard`}
                      >
                        {copiedIndex === index ? (
                          <>
                            <Copy className="w-4 h-4" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copy Message
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleAdjust(message, index, 'less-mushy')}
                        disabled={adjustingIndex === index}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 text-slate-700 rounded-lg transition-colors text-sm font-medium"
                        aria-label="Make this message less intense"
                      >
                        {adjustingIndex === index ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Adjusting...
                          </>
                        ) : (
                          <>
                            <Minus className="w-4 h-4" />
                            Too mushy?
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleAdjust(message, index, 'more-specific')}
                        disabled={adjustingIndex === index}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 text-slate-700 rounded-lg transition-colors text-sm font-medium"
                        aria-label="Make this message more specific"
                      >
                        {adjustingIndex === index ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Adjusting...
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            More specific?
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Suggestions */}
            {results.delivery_suggestions && (
              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-5">
                <div className="flex items-start gap-3 mb-3">
                  <Send className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-1" />
                  <h3 className="text-lg font-bold text-emerald-900">
                    Delivery Suggestions
                  </h3>
                </div>
                <div className="space-y-2 text-emerald-800 ml-8">
                  <p>
                    <strong>Method:</strong> {results.delivery_suggestions.method}
                  </p>
                  <p>
                    <strong>Timing:</strong> {results.delivery_suggestions.timing}
                  </p>
                  {results.delivery_suggestions.timing_cultural_note && (
                    <p className="bg-emerald-100 p-2 rounded">
                      <strong>Cultural Note:</strong> {results.delivery_suggestions.timing_cultural_note}
                    </p>
                  )}
                  {results.delivery_suggestions.additional_gesture && (
                    <p>
                      <strong>Bonus idea:</strong> {results.delivery_suggestions.additional_gesture}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Personalization Tips */}
            {results.personalization_tips && results.personalization_tips.length > 0 && (
              <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-5">
                <div className="flex items-start gap-3 mb-3">
                  <Mail className="w-5 h-5 text-amber-600 flex-shrink-0 mt-1" />
                  <h3 className="text-lg font-bold text-amber-900">
                    Make It Even More Personal
                  </h3>
                </div>
                <ul className="space-y-2 text-amber-800 ml-8 list-disc">
                  {results.personalization_tips.map((tip, index) => (
                    <li key={index}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Handwriting Template */}
        {results && results.handwriting_template && (
          <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-6">
            <div className="flex items-start gap-3 mb-4">
              <Mail className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-bold text-emerald-900 mb-1">
                  Handwritten Card Template
                </h3>
                <p className="text-sm text-emerald-700">
                  Follow this layout for a beautiful handwritten thank-you note
                </p>
              </div>
              
            </div>

            <div className="bg-white rounded-lg p-6 border-2 border-emerald-300 shadow-inner">
              {/* Card Layout Visual Guide */}
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                    Opening (top right or center)
                  </p>
                  <p className={`${c.text} font-serif text-lg`}>
                    {results.handwriting_template.opening_placement}
                  </p>
                </div>

                <div className="border-b border-slate-200 pb-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                    Main Message (body)
                  </p>
                  <p className={`${c.text} leading-relaxed whitespace-pre-wrap`}>
                    {results.handwriting_template.message_layout}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                    Closing (bottom right)
                  </p>
                  <p className={`${c.text} font-serif`}>
                    {results.handwriting_template.closing_placement}
                  </p>
                </div>
              </div>
            </div>

            {/* Font & Style Suggestions */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 border border-emerald-200">
                <h4 className="font-semibold text-emerald-900 mb-2 text-sm">Font Suggestions</h4>
                <ul className="space-y-1 text-sm text-emerald-800">
                  {results.handwriting_template.font_suggestions?.map((font, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="text-emerald-400">•</span>
                      {font}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white rounded-lg p-4 border border-emerald-200">
                <h4 className="font-semibold text-emerald-900 mb-2 text-sm">Card Tips</h4>
                <ul className="space-y-1 text-sm text-emerald-800">
                  {results.handwriting_template.writing_tips?.map((tip, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="text-emerald-400">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {results.handwriting_template.length_guidance && (
              <div className="mt-4 p-3 bg-emerald-100 rounded-lg">
                <p className="text-sm text-emerald-900">
                  <strong>Length:</strong> {results.handwriting_template.length_guidance}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GratitudeDebtClearer;
