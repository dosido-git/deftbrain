import React, { useState, useEffect } from 'react';
import { Heart, Mail, Gift, Loader2, Copy, Send, Plus, Minus, AlertCircle, Sparkles, Printer, Trash2, BookOpen, Check } from 'lucide-react';
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
      ? 'bg-zinc-900 border-zinc-600 text-zinc-50 placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20'
      : 'bg-white border-slate-300 text-emerald-900 placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-200',
    select: isDark
      ? 'bg-zinc-900 border-zinc-600 text-zinc-50'
      : 'bg-white border-slate-300 text-emerald-900',
    
    text: isDark ? 'text-zinc-50' : 'text-emerald-900',
    textSecondary: isDark ? 'text-zinc-300' : 'text-emerald-700',
    textMuted: isDark ? 'text-zinc-400' : 'text-emerald-600',
    label: isDark ? 'text-zinc-300' : 'text-slate-700',
    
    btnPrimary: isDark
      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
      : 'bg-emerald-600 hover:bg-emerald-700 text-white',
    btnSecondary: isDark
      ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-100'
      : 'bg-slate-100 hover:bg-slate-200 text-slate-700',
    btnDisabled: isDark
      ? 'bg-zinc-700 text-zinc-500'
      : 'bg-slate-300 text-slate-400',
    
    success: isDark
      ? 'bg-emerald-900/20 border-emerald-700 text-emerald-200'
      : 'bg-emerald-50 border-emerald-200 text-emerald-800',
    warning: isDark
      ? 'bg-amber-900/20 border-amber-700 text-amber-200'
      : 'bg-amber-50 border-amber-200 text-amber-800',
    error: isDark
      ? 'bg-red-900/20 border-red-700 text-red-200'
      : 'bg-red-50 border-red-200 text-red-800',
    info: isDark
      ? 'bg-blue-900/20 border-blue-700 text-blue-200'
      : 'bg-blue-50 border-blue-200 text-blue-800',
    purple: isDark
      ? 'bg-purple-900/20 border-purple-700 text-purple-200'
      : 'bg-purple-50 border-purple-200 text-purple-900',
    
    // Result-specific
    messageCard: isDark
      ? 'bg-zinc-800 border-zinc-600 hover:border-emerald-600'
      : 'bg-white border-slate-200 hover:border-emerald-300',
    messageBody: isDark
      ? 'bg-zinc-900 border-zinc-700'
      : 'bg-slate-50 border-slate-200',
    toneChip: (active) => active
      ? (isDark ? 'border-emerald-500 bg-emerald-900/30 text-emerald-200' : 'border-emerald-500 bg-emerald-50 text-emerald-900')
      : (isDark ? 'border-zinc-600 hover:border-emerald-600 bg-zinc-800 text-zinc-300' : 'border-slate-200 hover:border-emerald-300 bg-white text-slate-700'),
    toneBadge: isDark
      ? 'bg-emerald-900/40 text-emerald-300'
      : 'bg-emerald-100 text-emerald-700',
    giftSection: isDark
      ? 'bg-amber-900/15 border-l-4 border-amber-600 rounded-r-lg'
      : 'bg-amber-50 border-l-4 border-amber-400 rounded-r-lg',
    giftInput: isDark
      ? 'bg-zinc-900 border-zinc-600 text-zinc-50 placeholder:text-zinc-500'
      : 'bg-white border-amber-300 text-emerald-900 placeholder:text-slate-500',
    handwritingCheck: isDark
      ? 'bg-blue-900/15 border-blue-700 hover:bg-blue-900/25'
      : 'bg-blue-50 border-blue-200 hover:bg-blue-100',
    link: isDark
      ? 'text-cyan-400 hover:text-cyan-300 underline underline-offset-2'
      : 'text-cyan-600 hover:text-cyan-700 underline underline-offset-2',
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
  const [copiedAll, setCopiedAll] = useState(false);
  const [validationFailed, setValidationFailed] = useState(false);

  // ── Gratitude Debt Ledger (localStorage-persisted) ──
  const [ledger, setLedger] = useState(() => {
    try {
      const saved = localStorage.getItem('deftbrain-gratitude-ledger');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [newLedgerName, setNewLedgerName] = useState('');
  const [newLedgerReason, setNewLedgerReason] = useState('');
  const [showLedger, setShowLedger] = useState(false);

  // Persist ledger to localStorage
  useEffect(() => {
    try { localStorage.setItem('deftbrain-gratitude-ledger', JSON.stringify(ledger)); } catch {}
  }, [ledger]);

  const addToLedger = () => {
    if (!newLedgerName.trim()) return;
    setLedger(prev => [...prev, {
      id: Date.now(),
      name: newLedgerName.trim(),
      reason: newLedgerReason.trim(),
      done: false,
      addedAt: new Date().toISOString()
    }]);
    setNewLedgerName('');
    setNewLedgerReason('');
  };

  const toggleLedgerItem = (id) => {
    setLedger(prev => prev.map(item => item.id === id ? { ...item, done: !item.done } : item));
  };

  const removeLedgerItem = (id) => {
    setLedger(prev => prev.filter(item => item.id !== id));
  };

  const loadFromLedger = (item) => {
    setRecipientName(item.name);
    setGratitudePoints(item.reason);
    setResults(null);
    setShowLedger(false);
  };

  // Detect and set cultural context on component mount
  useEffect(() => {
    const detectedContext = detectCulturalContext();
    setCulturalContext(detectedContext);
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

  // ── Print helpers ──
  const buildPrintHTML = (title, body) => {
    const escaped = body.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title>
<style>
body{font-family:-apple-system,'Segoe UI',Helvetica,sans-serif;max-width:700px;margin:40px auto;padding:0 24px;color:#1c1917;line-height:1.7;font-size:14px}
h1{font-size:1.3em;margin-bottom:4px}
.sub{color:#78716c;font-size:0.85em;margin-bottom:18px}
pre{white-space:pre-wrap;word-wrap:break-word;font-family:inherit;margin:0}
.branding{margin-top:28px;padding-top:14px;border-top:1px solid #e7e5e4;color:#a8a29e;font-size:0.75em;text-align:center}
@media print{body{margin:16px;font-size:12px}}
</style></head><body>
<h1>${title}</h1>
<div class="sub">For: ${recipientName} · ${context} · ${tone}</div>
<pre>${escaped}</pre>
<div class="branding">Generated by DeftBrain · deftbrain.com</div>
</body></html>`;
  };

  const printSection = (title, content) => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(buildPrintHTML(title, content));
    w.document.close();
    w.onload = () => { w.focus(); w.print(); };
  };

  const printAll = () => {
    if (!results?.thank_you_messages) return;
    const combined = results.thank_you_messages
      .map((m, i) => `── ${m.version} (${m.tone}, ${m.length} words) ──\n\n${m.message_text}\n\nWhy this works: ${m.why_this_works}\nBest for: ${m.best_for}`)
      .join('\n\n────────────────────────────────\n\n');
    const extras = [];
    if (results.delivery_suggestions) {
      extras.push(`\n── Delivery Suggestions ──\nMethod: ${results.delivery_suggestions.method}\nTiming: ${results.delivery_suggestions.timing}${results.delivery_suggestions.additional_gesture ? '\nBonus idea: ' + results.delivery_suggestions.additional_gesture : ''}`);
    }
    if (results.personalization_tips?.length) {
      extras.push(`\n── Personalization Tips ──\n${results.personalization_tips.map(t => '• ' + t).join('\n')}`);
    }
    printSection(`Thank You Messages for ${recipientName}`, combined + extras.join('\n'));
  };

  const copyAll = async () => {
    if (!results?.thank_you_messages) return;
    const combined = results.thank_you_messages
      .map((m, i) => `── ${m.version} (${m.tone}, ${m.length} words) ──\n\n${m.message_text}\n\nWhy this works: ${m.why_this_works}\nBest for: ${m.best_for}`)
      .join('\n\n────────────────────────────────\n\n');
    const extras = [];
    if (results.delivery_suggestions) {
      extras.push(`\n── Delivery Suggestions ──\nMethod: ${results.delivery_suggestions.method}\nTiming: ${results.delivery_suggestions.timing}`);
    }
    if (results.personalization_tips?.length) {
      extras.push(`\n── Personalization Tips ──\n${results.personalization_tips.map(t => '• ' + t).join('\n')}`);
    }
    const full = `Thank You Messages for ${recipientName}\n${'═'.repeat(40)}\n\n${combined}${extras.join('\n')}\n\n— Generated by DeftBrain · deftbrain.com`;
    try {
      await navigator.clipboard.writeText(full);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch { setError('Failed to copy'); }
  };

  // ── Keyboard: Enter = add ledger / Ctrl+Enter = submit ──
  const handleFormKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const handleGenerate = async () => {
    if (!recipientName.trim() || !gratitudePoints.trim()) {
      setError(!recipientName.trim() ? 'Please enter who you\'re thanking' : 'Please list what you\'re grateful for');
      setValidationFailed(true);
      setTimeout(() => setValidationFailed(false), 2500);
      return;
    }

    setError('');
    setResults(null);

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
      const branded = `${text}\n\n— Generated by DeftBrain · deftbrain.com`;
      await navigator.clipboard.writeText(branded);
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
    setCopiedAll(false);
    setValidationFailed(false);
  };

  return (
  <div className={`min-h-screen ${c.bg} py-8 px-4`}>
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className={`${c.card} border rounded-xl shadow-lg p-6 transition-colors duration-200`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className={`text-2xl font-bold ${c.text}`}>Gratitude Debt Clearer 💝</h2>
            <p className={`text-sm ${c.textMuted}`}>Turn your gratitude into heartfelt messages – without the writing paralysis</p>
          </div>
          <button
            onClick={() => setShowLedger(!showLedger)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              showLedger
                ? (isDark ? 'bg-emerald-900/40 text-emerald-300' : 'bg-emerald-100 text-emerald-700')
                : c.btnSecondary
            }`}
            title="Gratitude Debt Ledger"
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Debt Ledger</span>
            {ledger.filter(i => !i.done).length > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold ${isDark ? 'bg-emerald-600 text-white' : 'bg-emerald-600 text-white'}`}>
                {ledger.filter(i => !i.done).length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Gratitude Debt Ledger ── */}
      {showLedger && (
        <div className={`${c.card} border rounded-xl shadow-lg p-5 transition-colors duration-200`}>
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
            <h3 className={`text-lg font-bold ${c.text}`}>Gratitude Debt Ledger</h3>
            <span className={`text-xs ${c.textMuted}`}>
              ({ledger.filter(i => !i.done).length} pending · {ledger.filter(i => i.done).length} cleared)
            </span>
          </div>
          <p className={`text-xs ${c.textMuted} mb-4`}>
            Track everyone you want to thank. Click a name to load it into the form.
          </p>

          {/* Add new entry */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Who do you owe thanks to?"
              value={newLedgerName}
              onChange={(e) => setNewLedgerName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addToLedger(); }}}
              className={`flex-1 px-3 py-2 border rounded-lg text-sm outline-none ${c.input}`}
            />
            <input
              type="text"
              placeholder="For what? (optional)"
              value={newLedgerReason}
              onChange={(e) => setNewLedgerReason(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addToLedger(); }}}
              className={`flex-1 px-3 py-2 border rounded-lg text-sm outline-none ${c.input}`}
            />
            <button
              onClick={addToLedger}
              disabled={!newLedgerName.trim()}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                newLedgerName.trim() ? c.btnPrimary : c.btnDisabled + ' cursor-not-allowed'
              }`}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Ledger items */}
          {ledger.length === 0 ? (
            <p className={`text-sm ${c.textMuted} text-center py-4 italic`}>
              No gratitude debts tracked yet. Add someone above!
            </p>
          ) : (
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {ledger.map(item => (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors ${
                    item.done
                      ? (isDark ? 'bg-zinc-800/50 border-zinc-700/50 opacity-60' : 'bg-slate-50 border-slate-100 opacity-60')
                      : (isDark ? 'bg-zinc-800 border-zinc-700 hover:border-emerald-600' : 'bg-white border-slate-200 hover:border-emerald-300')
                  }`}
                >
                  <button
                    onClick={() => toggleLedgerItem(item.id)}
                    className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      item.done
                        ? (isDark ? 'bg-emerald-600 border-emerald-600' : 'bg-emerald-500 border-emerald-500')
                        : (isDark ? 'border-zinc-500 hover:border-emerald-500' : 'border-slate-300 hover:border-emerald-400')
                    }`}
                    title={item.done ? 'Mark as not sent' : 'Mark as sent'}
                  >
                    {item.done && <Check className="w-3 h-3 text-white" />}
                  </button>
                  <button
                    onClick={() => !item.done && loadFromLedger(item)}
                    className={`flex-1 text-left ${item.done ? 'cursor-default' : 'cursor-pointer'}`}
                    disabled={item.done}
                  >
                    <span className={`text-sm font-medium ${item.done ? 'line-through' : ''} ${c.text}`}>
                      {item.name}
                    </span>
                    {item.reason && (
                      <span className={`text-xs ${c.textMuted} ml-2`}>— {item.reason}</span>
                    )}
                  </button>
                  <button
                    onClick={() => removeLedgerItem(item.id)}
                    className={`flex-shrink-0 p-1 rounded transition-colors ${isDark ? 'hover:bg-red-900/30 text-zinc-500 hover:text-red-400' : 'hover:bg-red-50 text-slate-400 hover:text-red-500'}`}
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty-state hook — show sample before submission */}
      {!results && (
        <div className={`rounded-xl p-4 border ${isDark ? 'border-emerald-800/40 bg-emerald-900/10' : 'border-emerald-200 bg-gradient-to-r from-emerald-50/80 to-white'}`}>
          <div className="flex items-start gap-3">
            <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-emerald-900/40' : 'bg-emerald-100'}`}>
              <Sparkles className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-semibold ${c.text} mb-1`}>What you'll get</p>
              <div className={`rounded-lg p-3 border mb-2 ${c.messageBody}`}>
                <p className={`text-sm ${c.text} leading-relaxed italic`}>
                  "Sarah, I've been meaning to tell you — that afternoon you spent helping me prep for the interview genuinely changed how I walked into the room. I felt prepared in a way I wouldn't have on my own, and I got the offer."
                </p>
              </div>
              <p className={`text-xs ${c.textMuted}`}>
                2-3 message versions · tone-matched to your relationship · cultural etiquette guidance · per-message "Too mushy?" and "More specific?" adjustments
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Input Form */}
      <div className={`${c.card} border rounded-xl shadow-lg p-6`} onKeyDown={handleFormKeyDown}>
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
              onChange={(e) => { setRecipientName(e.target.value); if (validationFailed) setValidationFailed(false); }}
              placeholder="e.g., Sarah, Dr. Martinez, the whole team"
              className={`w-full p-4 border-2 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all ${c.input} ${
                validationFailed && !recipientName.trim() ? 'ring-2 ring-red-500 border-red-400' : ''
              }`}
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
              onChange={(e) => { setGratitudePoints(e.target.value); if (validationFailed) setValidationFailed(false); }}
              placeholder="List the things you're thankful for (bullet points or free-form):&#10;• Helped me move apartments&#10;• Listened when I was stressed&#10;• Recommended me for the job&#10;• Made me feel welcome"
              className={`w-full h-40 p-4 border-2 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none resize-none transition-all ${c.input} ${
                validationFailed && !gratitudePoints.trim() ? 'ring-2 ring-red-500 border-red-400' : ''
              }`}
              aria-required="true"
            />
            <p className={`text-sm ${c.textMuted} mt-2`}>
              💡 Be specific! The more details you give, the more personal your message will be.
            </p>
          </div>

          {/* Gift Specificity Enhancement - Show for gift-related contexts */}
          {(context === 'Gift received' || context === 'Wedding gift' || context === 'Baby shower gift') && (
            <div className={`mb-6 p-4 ${c.giftSection}`}>
              <h3 className={`text-sm font-semibold ${isDark ? 'text-amber-200' : 'text-amber-900'} mb-3 flex items-center gap-2`}>
                <Gift className="w-4 h-4" />
                Make It Extra Personal (Optional)
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label 
                    htmlFor="gift-details"
                    className={`block text-sm font-medium ${isDark ? 'text-amber-200' : 'text-amber-900'} mb-2`}
                  >
                    Specific details about the gift
                  </label>
                  <input
                    id="gift-details"
                    type="text"
                    value={specificGiftDetails}
                    onChange={(e) => setSpecificGiftDetails(e.target.value)}
                    placeholder="e.g., 'the blue scarf', 'the cookbook with Italian recipes', 'the personalized mug'"
                    className={`w-full p-3 border rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none ${c.giftInput}`}
                  />
                </div>
                
                <div>
                  <label 
                    htmlFor="how-use"
                    className={`block text-sm font-medium ${isDark ? 'text-amber-200' : 'text-amber-900'} mb-2`}
                  >
                    How you'll use it or what it means to you
                  </label>
                  <input
                    id="how-use"
                    type="text"
                    value={howYoullUseIt}
                    onChange={(e) => setHowYoullUseIt(e.target.value)}
                    placeholder="e.g., 'I'll wear it to work', 'reminds me of our trip', 'perfect for my morning coffee'"
                    className={`w-full p-3 border rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none ${c.giftInput}`}
                  />
                </div>
              </div>
              
              <p className={`text-xs ${isDark ? 'text-amber-300' : 'text-amber-700'} mt-2`}>
                ✨ These details will make your thank-you feel much more thoughtful and genuine
              </p>
            </div>
          )}

          {/* Context and Relationship Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label 
                htmlFor="context"
                className={`block text-sm font-medium ${c.label} mb-2`}
              >
                Context / Occasion
              </label>
              <select
                id="context"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className={`w-full p-3 border rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none ${c.select}`}
              >
                {contextOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div>
              <label 
                htmlFor="relationship"
                className={`block text-sm font-medium ${c.label} mb-2`}
              >
                Your Relationship
              </label>
              <select
                id="relationship"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className={`w-full p-3 border rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none ${c.select}`}
              >
                {relationshipOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tone Selection */}
          <div className="mb-6">
            <label className={`block text-sm font-medium ${c.label} mb-3`}>
              Tone Preference
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {toneOptions.map(option => (
                <button
                  key={option.id}
                  onClick={() => setTone(option.label)}
                  className={`p-3 rounded-lg border-2 transition-all text-center ${c.toneChip(tone === option.label)}`}
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
              className={`block text-sm font-medium ${c.label} mb-2`}
            >
              Cultural Context (helps with formality and etiquette)
            </label>
            <select
              id="cultural-context"
              value={culturalContext}
              onChange={(e) => setCulturalContext(e.target.value)}
              className={`w-full p-3 border rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none ${c.select}`}
            >
              {culturalContextOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <p className={`text-xs ${c.textMuted} mt-1`}>
              ✨ Auto-detected from your browser settings. Different cultures have different gratitude etiquette — this helps tailor the formality and timing.
            </p>
          </div>

          {/* Delivery Method */}
          <div className="mb-6">
            <label 
              htmlFor="delivery-method"
              className={`block text-sm font-medium ${c.label} mb-2`}
            >
              How will you send this?
            </label>
            <select
              id="delivery-method"
              value={deliveryMethod}
              onChange={(e) => setDeliveryMethod(e.target.value)}
              className={`w-full p-3 border rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none ${c.select}`}
            >
              {deliveryMethodOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Handwriting Template Option */}
          <div className="mb-6">
            <label className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${c.handwritingCheck}`}>
              <input
                type="checkbox"
                checked={needHandwritingTemplate}
                onChange={(e) => setNeedHandwritingTemplate(e.target.checked)}
                className="w-5 h-5 rounded border-zinc-400 text-emerald-600 focus:ring-2 focus:ring-emerald-500"
              />
              <div className="flex-1">
                <div className={`font-medium ${isDark ? 'text-blue-200' : 'text-blue-900'}`}>Generate handwritten card template</div>
                <div className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                  Get layout guidance, font suggestions, and formatting for physical cards
                </div>
              </div>
            </label>
          </div>

          {/* Length Slider */}
          <div className="mb-6">
            <label 
              htmlFor="length-slider"
              className={`block text-sm font-medium ${c.label} mb-3`}
            >
              Message Length: <span className={`font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
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
            <div className={`flex justify-between text-xs ${c.textMuted} mt-1`}>
              <span>Short & sweet</span>
              <span>Detailed & thorough</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className={`flex-1 font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                loading ? c.btnDisabled + ' cursor-not-allowed' : c.btnPrimary
              }`}
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
                className={`px-6 py-3 border-2 font-semibold rounded-lg transition-colors ${
                  isDark ? 'border-zinc-600 hover:border-zinc-500 text-zinc-200' : 'border-slate-300 hover:border-slate-400 text-slate-700'
                }`}
                aria-label="Reset form"
              >
                Reset
              </button>
            )}
          </div>
          <p className={`text-xs text-center ${c.textMuted} mt-2`}>
            <kbd className={`px-1.5 py-0.5 rounded text-xs font-mono ${isDark ? 'bg-zinc-700' : 'bg-slate-100'}`}>Ctrl</kbd>+<kbd className={`px-1.5 py-0.5 rounded text-xs font-mono ${isDark ? 'bg-zinc-700' : 'bg-slate-100'}`}>Enter</kbd> to submit from any field
          </p>

          {/* Error Display */}
          {error && (
            <div 
              className={`mt-4 p-4 border rounded-lg flex items-start gap-3 ${c.error}`}
              role="alert"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Pre-result cross-ref */}
          <p className={`text-xs text-center ${c.textMuted} mt-4`}>
            Need to apologize alongside your thanks?{' '}
            <a href="/ApologyCalibrator" className={c.link}>Apology Calibrator</a>{' '}
            helps you get the tone exactly right.
          </p>
        </div>

        {/* Results Section */}
        {results && (
          <div className="space-y-6">
            {/* Awkwardness Acknowledgment */}
            {results.if_you_feel_awkward && (
              <div className={`border-2 rounded-xl p-5 ${c.purple}`}>
                <div className="flex items-start gap-3">
                  <Gift className="w-5 h-5 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-medium mb-1">
                      {results.if_you_feel_awkward.permission}
                    </p>
                    <p className={`text-sm ${isDark ? 'text-purple-300' : 'text-purple-800'}`}>
                      {results.if_you_feel_awkward.reframe}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Message Options */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-2xl font-bold ${c.text}`}>
                  Your Thank You Messages
                </h2>
                <div className="flex gap-1.5">
                  <button
                    onClick={copyAll}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                      copiedAll
                        ? 'bg-emerald-600 text-white'
                        : c.btnSecondary
                    }`}
                    title="Copy all messages"
                  >
                    {copiedAll ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedAll ? 'Copied!' : 'Copy All'}
                  </button>
                  <button
                    onClick={printAll}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${c.btnSecondary}`}
                    title="Print all messages"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Print All</span>
                  </button>
                </div>
              </div>
              
              <div className="space-y-4">
                {results.thank_you_messages?.map((message, index) => (
                  <div 
                    key={index} 
                    className={`rounded-xl shadow-lg p-6 border-2 transition-colors ${c.messageCard}`}
                  >
                    {/* Message Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className={`text-lg font-bold ${c.text} mb-1`}>
                          {message.version}
                        </h3>
                        <div className={`flex items-center gap-3 text-sm ${c.textSecondary}`}>
                          <span className={`inline-block px-3 py-1 rounded-full font-medium ${c.toneBadge}`}>
                            {message.tone}
                          </span>
                          <span>{message.length} words</span>
                        </div>
                      </div>
                    </div>

                    {/* Why This Works */}
                    <div className={`border-l-4 rounded-r-lg p-3 mb-4 ${c.info}`}>
                      <p className="text-sm">
                        <strong>Why this works:</strong> {message.why_this_works}
                      </p>
                      <p className={`text-sm mt-1 ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>
                        <strong>Best for:</strong> {message.best_for}
                      </p>
                    </div>

                    {/* Message Text */}
                    <div className={`rounded-lg p-4 border mb-4 ${c.messageBody}`}>
                      <p className={`${c.text} text-base leading-relaxed whitespace-pre-wrap`}>
                        {message.message_text}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => copyToClipboard(message.message_text, index)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                          copiedIndex === index
                            ? (isDark ? 'bg-emerald-900/40 text-emerald-300' : 'bg-emerald-100 text-emerald-700')
                            : c.btnPrimary
                        }`}
                        aria-label={`Copy ${message.version} to clipboard`}
                      >
                        <Copy className="w-4 h-4" />
                        {copiedIndex === index ? 'Copied!' : 'Copy'}
                      </button>

                      <button
                        onClick={() => printSection(message.version, message.message_text)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${c.btnSecondary}`}
                        aria-label={`Print ${message.version}`}
                      >
                        <Printer className="w-4 h-4" />
                        Print
                      </button>

                      <button
                        onClick={() => handleAdjust(message, index, 'less-mushy')}
                        disabled={adjustingIndex === index}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                          adjustingIndex === index ? c.btnDisabled + ' cursor-not-allowed' : c.btnSecondary
                        }`}
                        aria-label="Make this message less intense"
                      >
                        {adjustingIndex === index ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Adjusting...</>
                        ) : (
                          <><Minus className="w-4 h-4" /> Too mushy?</>
                        )}
                      </button>

                      <button
                        onClick={() => handleAdjust(message, index, 'more-specific')}
                        disabled={adjustingIndex === index}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                          adjustingIndex === index ? c.btnDisabled + ' cursor-not-allowed' : c.btnSecondary
                        }`}
                        aria-label="Make this message more specific"
                      >
                        {adjustingIndex === index ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Adjusting...</>
                        ) : (
                          <><Plus className="w-4 h-4" /> More specific?</>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Suggestions */}
            {results.delivery_suggestions && (
              <div className={`border-2 rounded-xl p-5 ${c.success}`}>
                <div className="flex items-start gap-3 mb-3">
                  <Send className="w-5 h-5 flex-shrink-0 mt-1" />
                  <h3 className="text-lg font-bold">
                    Delivery Suggestions
                  </h3>
                </div>
                <div className={`space-y-2 ml-8 ${isDark ? 'text-emerald-200' : 'text-emerald-800'}`}>
                  <p>
                    <strong>Method:</strong> {results.delivery_suggestions.method}
                  </p>
                  <p>
                    <strong>Timing:</strong> {results.delivery_suggestions.timing}
                  </p>
                  {results.delivery_suggestions.timing_cultural_note && (
                    <p className={`p-2 rounded ${isDark ? 'bg-emerald-900/30' : 'bg-emerald-100'}`}>
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
              <div className={`border-2 rounded-xl p-5 ${c.warning}`}>
                <div className="flex items-start gap-3 mb-3">
                  <Mail className="w-5 h-5 flex-shrink-0 mt-1" />
                  <h3 className="text-lg font-bold">
                    Make It Even More Personal
                  </h3>
                </div>
                <ul className={`space-y-2 ml-8 list-disc ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>
                  {results.personalization_tips.map((tip, index) => (
                    <li key={index}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Conditional cross-ref — context-aware */}
            {context === 'Post-interview' && (
              <p className={`text-xs text-center ${c.textMuted} mt-2`}>
                Sending a follow-up can feel awkward —{' '}
                <a href="/DifficultTalkRehearser" className={c.link}>Difficult Talk Rehearser</a>{' '}
                can help you prepare if the conversation continues.
              </p>
            )}
            {(context === 'Condolence support' || context === 'Emotional support') && (
              <p className={`text-xs text-center ${c.textMuted} mt-2`}>
                If you're navigating a sensitive relationship,{' '}
                <a href="/VelvetHammer" className={c.link}>Velvet Hammer</a>{' '}
                helps you say hard things with warmth.
              </p>
            )}
          </div>
        )}

        {/* Handwriting Template */}
        {results && results.handwriting_template && (
          <div className={`border-2 rounded-xl p-6 ${c.success}`}>
            <div className="flex items-start gap-3 mb-4">
              <Mail className="w-6 h-6 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-bold mb-1">
                  Handwritten Card Template
                </h3>
                <p className={`text-sm ${c.textSecondary}`}>
                  Follow this layout for a beautiful handwritten thank-you note
                </p>
              </div>
              
            </div>

            <div className={`rounded-lg p-6 border-2 shadow-inner ${isDark ? 'bg-zinc-900 border-emerald-800' : 'bg-white border-emerald-300'}`}>
              {/* Card Layout Visual Guide */}
              <div className="space-y-4">
                <div className={`border-b pb-3 ${isDark ? 'border-zinc-700' : 'border-slate-200'}`}>
                  <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${c.textMuted}`}>
                    Opening (top right or center)
                  </p>
                  <p className={`${c.text} font-serif text-lg`}>
                    {results.handwriting_template.opening_placement}
                  </p>
                </div>

                <div className={`border-b pb-3 ${isDark ? 'border-zinc-700' : 'border-slate-200'}`}>
                  <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${c.textMuted}`}>
                    Main Message (body)
                  </p>
                  <p className={`${c.text} leading-relaxed whitespace-pre-wrap`}>
                    {results.handwriting_template.message_layout}
                  </p>
                </div>

                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${c.textMuted}`}>
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
              <div className={`rounded-lg p-4 border ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-emerald-200'}`}>
                <h4 className={`font-semibold ${c.text} mb-2 text-sm`}>Font Suggestions</h4>
                <ul className={`space-y-1 text-sm ${c.textSecondary}`}>
                  {results.handwriting_template.font_suggestions?.map((font, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className={isDark ? 'text-emerald-500' : 'text-emerald-400'}>•</span>
                      {font}
                    </li>
                  ))}
                </ul>
              </div>

              <div className={`rounded-lg p-4 border ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-emerald-200'}`}>
                <h4 className={`font-semibold ${c.text} mb-2 text-sm`}>Card Tips</h4>
                <ul className={`space-y-1 text-sm ${c.textSecondary}`}>
                  {results.handwriting_template.writing_tips?.map((tip, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className={isDark ? 'text-emerald-500' : 'text-emerald-400'}>•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {results.handwriting_template.length_guidance && (
              <div className={`mt-4 p-3 rounded-lg ${isDark ? 'bg-emerald-900/30' : 'bg-emerald-100'}`}>
                <p className={`text-sm ${c.text}`}>
                  <strong>Length:</strong> {results.handwriting_template.length_guidance}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Post-result cross-ref */}
        {results && (
          <p className={`text-xs text-center ${c.textMuted}`}>
            Message feeling close but not quite right?{' '}
            <a href="/ApologyCalibrator" className={c.link}>Apology Calibrator</a>{' '}
            fine-tunes tone when gratitude mixes with "sorry it took so long."
          </p>
        )}
      </div>
    </div>
  );
};

export default GratitudeDebtClearer;
