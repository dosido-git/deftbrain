import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Heart, Mail, Gift, Loader2, Copy, Send, RefreshCw, Plus, Minus, AlertCircle,
  Sparkles, CheckCircle, ExternalLink, Printer, Share2, Zap, Trash2, Clock,
  ChevronDown, ChevronUp, Check, X, ListChecks, MessageCircle, Edit3 } from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';

// ─── Confetti micro-animation ───
const ConfettiCanvas = ({ active, onDone }) => {
  const canvasRef = useRef(null);
  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const colors = ['#10b981','#f59e0b','#3b82f6','#ec4899','#8b5cf6','#ef4444'];
    const pieces = Array.from({ length: 60 }, () => ({
      x: canvas.width / 2 + (Math.random() - 0.5) * 100,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 12,
      vy: -Math.random() * 14 - 4,
      size: Math.random() * 6 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotV: (Math.random() - 0.5) * 15,
      gravity: 0.35,
    }));
    let frame = 0;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      pieces.forEach(p => {
        p.x += p.vx;
        p.vy += p.gravity;
        p.y += p.vy;
        p.rotation += p.rotV;
        p.vx *= 0.99;
        if (p.y < canvas.height + 20) alive = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, 1 - frame / 80);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      });
      frame++;
      if (alive && frame < 90) requestAnimationFrame(animate);
      else { ctx.clearRect(0, 0, canvas.width, canvas.height); onDone?.(); }
    };
    requestAnimationFrame(animate);
  }, [active, onDone]);
  if (!active) return null;
  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-50" style={{ width: '100%', height: '100%' }} />;
};

// ─── Staggered animation CSS (injected once) ───
const AnimStyles = () => (
  <style>{`
    @keyframes fadeSlideUp { from { opacity:0; transform:translateY(18px) } to { opacity:1; transform:translateY(0) } }
    @keyframes cardFlip { 0% { transform:rotateX(0deg); opacity:1 } 50% { transform:rotateX(90deg); opacity:0 } 100% { transform:rotateX(0deg); opacity:1 } }
    @keyframes popIn { 0% { transform:scale(0.85); opacity:0 } 60% { transform:scale(1.04) } 100% { transform:scale(1); opacity:1 } }
    .anim-stagger-0 { animation: fadeSlideUp 0.45s ease-out 0.05s both }
    .anim-stagger-1 { animation: fadeSlideUp 0.45s ease-out 0.18s both }
    .anim-stagger-2 { animation: fadeSlideUp 0.45s ease-out 0.31s both }
    .anim-stagger-3 { animation: fadeSlideUp 0.45s ease-out 0.44s both }
    .anim-flip { animation: cardFlip 0.5s ease-in-out both }
    .anim-pop { animation: popIn 0.35s ease-out both }
  `}</style>
);

const GratitudeDebtClearer = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // ─── Theme tokens (all dark-mode aware) ───
  const c = {
    bg: isDark ? 'bg-zinc-900' : 'bg-gradient-to-br from-emerald-50 to-emerald-50',
    card: isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-emerald-200',
    cardAlt: isDark ? 'bg-zinc-700 border-zinc-600' : 'bg-emerald-50 border-emerald-200',
    input: isDark
      ? 'bg-zinc-900 border-zinc-600 text-zinc-50 placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20'
      : 'bg-white border-slate-300 text-emerald-900 placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-200',
    select: isDark ? 'bg-zinc-900 border-zinc-600 text-zinc-50' : 'bg-white border-slate-300 text-emerald-900',
    text: isDark ? 'text-zinc-50' : 'text-emerald-900',
    textSecondary: isDark ? 'text-zinc-300' : 'text-emerald-700',
    textMuted: isDark ? 'text-zinc-400' : 'text-emerald-600',
    label: isDark ? 'text-zinc-300' : 'text-slate-700',
    btnPrimary: isDark ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white',
    btnSecondary: isDark ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-100' : 'bg-slate-100 hover:bg-slate-200 text-slate-700',
    btnDisabled: isDark ? 'bg-zinc-700 text-zinc-500' : 'bg-slate-300 text-slate-400',
    success: isDark ? 'bg-emerald-900/20 border-emerald-700 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-800',
    warning: isDark ? 'bg-amber-900/20 border-amber-700 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-800',
    error: isDark ? 'bg-red-900/20 border-red-700 text-red-200' : 'bg-red-50 border-red-200 text-red-800',
    info: isDark ? 'bg-blue-900/20 border-blue-700 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-800',
    purple: isDark ? 'bg-purple-900/20 border-purple-700 text-purple-200' : 'bg-purple-50 border-purple-200 text-purple-900',
    messageCard: isDark ? 'bg-zinc-800 border-zinc-600 hover:border-emerald-600' : 'bg-white border-slate-200 hover:border-emerald-300',
    messageBody: isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-slate-50 border-slate-200',
    toneChip: (a) => a
      ? (isDark ? 'border-emerald-500 bg-emerald-900/30 text-emerald-200' : 'border-emerald-500 bg-emerald-50 text-emerald-900')
      : (isDark ? 'border-zinc-600 hover:border-emerald-600 bg-zinc-800 text-zinc-300' : 'border-slate-200 hover:border-emerald-300 bg-white text-slate-700'),
    toneBadge: isDark ? 'bg-emerald-900/40 text-emerald-300' : 'bg-emerald-100 text-emerald-700',
    giftSection: isDark ? 'bg-amber-900/15 border-l-4 border-amber-600 rounded-r-lg' : 'bg-amber-50 border-l-4 border-amber-400 rounded-r-lg',
    giftInput: isDark ? 'bg-zinc-900 border-zinc-600 text-zinc-50 placeholder:text-zinc-500' : 'bg-white border-amber-300 text-emerald-900 placeholder:text-slate-500',
    handwritingCheck: isDark ? 'bg-blue-900/15 border-blue-700 hover:bg-blue-900/25' : 'bg-blue-50 border-blue-200 hover:bg-blue-100',
    link: isDark ? 'text-cyan-400 hover:text-cyan-300 underline underline-offset-2' : 'text-cyan-600 hover:text-cyan-700 underline underline-offset-2',
    tab: (a) => a
      ? (isDark ? 'bg-emerald-600 text-white shadow-md' : 'bg-emerald-600 text-white shadow-md')
      : (isDark ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600' : 'bg-white text-slate-600 hover:bg-slate-50'),
    urgency: {
      high: isDark ? 'bg-red-900/30 text-red-300 border-red-700' : 'bg-red-50 text-red-700 border-red-200',
      medium: isDark ? 'bg-amber-900/30 text-amber-300 border-amber-700' : 'bg-amber-50 text-amber-700 border-amber-200',
      low: isDark ? 'bg-zinc-700 text-zinc-300 border-zinc-600' : 'bg-slate-50 text-slate-600 border-slate-200',
    },
    status: {
      pending: isDark ? 'bg-zinc-700 text-zinc-300' : 'bg-slate-100 text-slate-600',
      drafted: isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700',
      sent: isDark ? 'bg-emerald-900/30 text-emerald-300' : 'bg-emerald-50 text-emerald-700',
      done: isDark ? 'bg-emerald-900/40 text-emerald-200' : 'bg-emerald-100 text-emerald-800',
    },
  };

  // ─── Cultural context auto-detect ───
  const detectCulturalContext = () => {
    const lc = (navigator.language || 'en-US').toLowerCase();
    if (lc.startsWith('ja') || lc.startsWith('ko') || lc.startsWith('zh')) return 'East Asian (Japanese, Korean, Chinese)';
    if (['hi','ur','pa','bn','ta','te'].some(p => lc.startsWith(p))) return 'South Asian (Indian, Pakistani)';
    if (['ar','fa','he','tr'].some(p => lc.startsWith(p))) return 'Middle Eastern';
    if (['es-mx','es-co','es-ar','pt-br','es-cl','es-pe'].some(p => lc.startsWith(p))) return 'Latin American';
    if (['en-gb','en-au','en-nz','en-ca','en-ie','en-za'].some(p => lc.startsWith(p))) return 'British/Commonwealth';
    if (['af','sw','am','ha'].some(p => lc.startsWith(p))) return 'African';
    return 'American/Western';
  };

  // ─── Mode: 'full' | 'quick' ───
  const [mode, setMode] = useState('full');

  // ─── Full-form state ───
  const [recipientName, setRecipientName] = useState('');
  const [gratitudePoints, setGratitudePoints] = useState('');
  const [context, setContext] = useState('General kindness');
  const [relationship, setRelationship] = useState('Personal');
  const [tone, setTone] = useState('Warm & casual');
  const [length, setLength] = useState(5);
  const [specificGiftDetails, setSpecificGiftDetails] = useState('');
  const [howYoullUseIt, setHowYoullUseIt] = useState('');
  const [culturalContext, setCulturalContext] = useState('American/Western');
  const [deliveryMethod, setDeliveryMethod] = useState('Let AI suggest');
  const [needHandwritingTemplate, setNeedHandwritingTemplate] = useState(false);

  // ─── Quick-thanks state ───
  const [quickName, setQuickName] = useState('');
  const [quickSituation, setQuickSituation] = useState('');
  const [quickResult, setQuickResult] = useState(null);
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickCopied, setQuickCopied] = useState(false);

  // ─── Results state ───
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [adjustingIndex, setAdjustingIndex] = useState(null);
  const [flipIndex, setFlipIndex] = useState(null);

  // ─── Confetti state ───
  const [confettiActive, setConfettiActive] = useState(false);
  const confettiContainerRef = useRef(null);

  // ─── Debt ledger state ───
  const [ledger, setLedger] = useState(() => {
    try { return JSON.parse(localStorage.getItem('gdc:ledger') || '[]'); } catch { return []; }
  });
  const [showLedger, setShowLedger] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null); // null | 'new' | id
  const [newEntry, setNewEntry] = useState({ who: '', what: '', urgency: 'medium', status: 'pending' });
  const [activeLedgerId, setActiveLedgerId] = useState(null); // pre-populate form from ledger

  // ─── Persist ledger ───
  useEffect(() => { localStorage.setItem('gdc:ledger', JSON.stringify(ledger)); }, [ledger]);

  // ─── Detect cultural context on mount ───
  useEffect(() => { setCulturalContext(detectCulturalContext()); }, []);

  // ─── Ledger helpers ───
  const ledgerStats = {
    total: ledger.length,
    cleared: ledger.filter(e => e.status === 'sent' || e.status === 'done').length,
  };

  const addLedgerEntry = () => {
    if (!newEntry.who.trim()) return;
    const entry = { ...newEntry, id: Date.now().toString(), createdAt: new Date().toISOString() };
    setLedger(prev => [entry, ...prev]);
    setNewEntry({ who: '', what: '', urgency: 'medium', status: 'pending' });
    setEditingEntry(null);
  };

  const updateLedgerStatus = (id, status) => {
    setLedger(prev => prev.map(e => e.id === id
      ? { ...e, status, ...(status === 'sent' ? { sentAt: new Date().toISOString() } : {}) }
      : e
    ));
    if (status === 'sent' || status === 'done') setConfettiActive(true);
  };

  const deleteLedgerEntry = (id) => {
    setLedger(prev => prev.filter(e => e.id !== id));
    if (activeLedgerId === id) setActiveLedgerId(null);
  };

  const loadFromLedger = (entry) => {
    setRecipientName(entry.who);
    setGratitudePoints(entry.what);
    setActiveLedgerId(entry.id);
    setMode('full');
    setShowLedger(false);
    setResults(null);
    setError('');
  };

  // ─── Option lists ───
  const contextOptions = ['Post-interview','Gift received','Emotional support','Mentorship','Hospitality','General kindness','Professional help','Personal favor','Condolence support','Wedding gift','Baby shower gift','Get well soon','Recommendation/Reference','Business opportunity'];
  const relationshipOptions = ['Professional','Personal','Family','Casual acquaintance'];
  const culturalContextOptions = ['American/Western','British/Commonwealth','East Asian (Japanese, Korean, Chinese)','South Asian (Indian, Pakistani)','Middle Eastern','Latin American','African','Southern US','Not sure/Mixed'];
  const deliveryMethodOptions = ['Let AI suggest','Email','Handwritten card','Text message','In-person','Social media message'];
  const toneOptions = [
    { id: 'warm', label: 'Warm & casual', icon: '\u{1F60A}' },
    { id: 'heartfelt', label: 'Heartfelt & emotional', icon: '\u{2764}\u{FE0F}' },
    { id: 'professional', label: 'Professional', icon: '\u{1F4BC}' },
    { id: 'brief', label: 'Brief', icon: '\u{2728}' }
  ];

  // ─── Handlers ───
  const handleGenerate = async () => {
    if (!recipientName.trim()) { setError('Please enter who you\'re thanking'); return; }
    if (!gratitudePoints.trim()) { setError('Please list what you\'re grateful for'); return; }
    setError(''); setResults(null);
    try {
      const data = await callToolEndpoint('gratitude-debt-clearer', {
        recipientName: recipientName.trim(), gratitudePoints: gratitudePoints.trim(),
        context, relationship, tone, length,
        specificGiftDetails: specificGiftDetails.trim() || null,
        howYoullUseIt: howYoullUseIt.trim() || null,
        culturalContext, deliveryMethod, needHandwritingTemplate,
      });
      setResults(data);
      // Update ledger status if loaded from ledger
      if (activeLedgerId) updateLedgerStatus(activeLedgerId, 'drafted');
    } catch (err) {
      const msg = err.message || '';
      if (/rate|429|too fast/i.test(msg)) setError('You\'re generating too fast \u2014 wait a moment and try again.');
      else setError(msg || 'Failed to generate messages. Please try again.');
    }
  };

  const handleQuickThanks = async () => {
    if (!quickName.trim() || !quickSituation.trim()) return;
    setQuickLoading(true); setQuickResult(null);
    try {
      const data = await callToolEndpoint('gratitude-debt-clearer/quick', {
        recipientName: quickName.trim(), situation: quickSituation.trim(),
      });
      setQuickResult(data);
    } catch (err) {
      setError(err.message || 'Failed to generate quick thanks');
    } finally { setQuickLoading(false); }
  };

  const handleAdjust = async (message, index, adjustment) => {
    setAdjustingIndex(index); setFlipIndex(index); setError('');
    try {
      let adjustmentPrompt = adjustment === 'less-mushy'
        ? 'Make this thank you message less intense and more understated while keeping it sincere'
        : 'Make this thank you message more specific by elaborating on the details';
      const data = await callToolEndpoint('gratitude-debt-clearer', {
        recipientName: recipientName.trim(), gratitudePoints: gratitudePoints.trim(),
        context, relationship, tone, length,
        specificGiftDetails: specificGiftDetails.trim() || null,
        howYoullUseIt: howYoullUseIt.trim() || null,
        culturalContext, deliveryMethod, needHandwritingTemplate,
        adjustmentPrompt, originalMessage: message.message_text,
      });
      setResults(prev => ({
        ...prev,
        thank_you_messages: prev.thank_you_messages.map((msg, i) =>
          i === index ? data.thank_you_messages[0] : msg)
      }));
    } catch (err) { setError('Failed to adjust message. Please try again.'); }
    finally { setAdjustingIndex(null); setTimeout(() => setFlipIndex(null), 550); }
  };

  const copyToClipboard = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setConfettiActive(true);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch { setError('Failed to copy to clipboard'); }
  };

  const copyQuickResult = async () => {
    if (!quickResult?.message) return;
    try {
      await navigator.clipboard.writeText(quickResult.message);
      setQuickCopied(true);
      setConfettiActive(true);
      setTimeout(() => setQuickCopied(false), 2000);
    } catch { setError('Failed to copy'); }
  };

  // ─── Full output builders ───
  const buildFullText = useCallback(() => {
    if (!results) return '';
    let text = `Thank You Messages for ${recipientName}\n${'='.repeat(40)}\n\n`;
    results.thank_you_messages?.forEach((m, i) => {
      text += `--- ${m.version} (${m.tone}, ${m.length} words) ---\n${m.message_text}\n\nWhy this works: ${m.why_this_works}\nBest for: ${m.best_for}\n\n`;
    });
    if (results.delivery_suggestions) {
      const ds = results.delivery_suggestions;
      text += `Delivery Suggestions\n${'='.repeat(40)}\nMethod: ${ds.method}\nTiming: ${ds.timing}\n`;
      if (ds.timing_cultural_note) text += `Cultural Note: ${ds.timing_cultural_note}\n`;
      if (ds.additional_gesture) text += `Bonus idea: ${ds.additional_gesture}\n`;
    }
    if (results.personalization_tips?.length) {
      text += `\nPersonalization Tips\n${'='.repeat(40)}\n`;
      results.personalization_tips.forEach(t => { text += `- ${t}\n`; });
    }
    return text;
  }, [results, recipientName]);

  const handleCopyAll = async () => {
    try { await navigator.clipboard.writeText(buildFullText()); setConfettiActive(true); } catch { setError('Failed to copy'); }
  };

  const handlePrint = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<html><head><title>Thank You - ${recipientName}</title><style>body{font-family:Georgia,serif;max-width:700px;margin:40px auto;line-height:1.6;color:#1a1a1a}h1{color:#047857}h2{color:#065f46;border-bottom:1px solid #d1fae5;padding-bottom:8px}pre{white-space:pre-wrap;font-family:inherit}</style></head><body><pre>${buildFullText()}</pre></body></html>`);
    w.document.close();
    w.print();
  };

  const handleShare = async () => {
    const text = buildFullText();
    if (navigator.share) {
      try { await navigator.share({ title: `Thank You - ${recipientName}`, text }); } catch {}
    } else {
      await navigator.clipboard.writeText(text);
      setConfettiActive(true);
    }
  };

  const handleMarkSent = () => {
    if (activeLedgerId) { updateLedgerStatus(activeLedgerId, 'sent'); }
    setConfettiActive(true);
  };

  const handleReset = () => {
    setRecipientName(''); setGratitudePoints(''); setContext('General kindness');
    setRelationship('Personal'); setTone('Warm & casual'); setLength(5);
    setSpecificGiftDetails(''); setHowYoullUseIt('');
    setCulturalContext(detectCulturalContext()); setDeliveryMethod('Let AI suggest');
    setNeedHandwritingTemplate(false); setResults(null); setError('');
    setActiveLedgerId(null);
  };

  // ─── RENDER ───
  return (
    <div className={`min-h-screen ${c.bg} py-8 px-4`}>
      <AnimStyles />
      <div className="max-w-4xl mx-auto space-y-6" ref={confettiContainerRef}>

        {/* ═══ HEADER ═══ */}
        <div className={`${c.card} border rounded-xl shadow-lg p-6 transition-colors duration-200 relative overflow-hidden`}>
          <ConfettiCanvas active={confettiActive} onDone={() => setConfettiActive(false)} />
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className={`text-2xl font-bold ${c.text}`}>Gratitude Debt Clearer</h2>
              <p className={`text-sm ${c.textMuted}`}>Turn your gratitude into heartfelt messages &ndash; without the writing paralysis</p>
            </div>
            <button onClick={() => setShowLedger(!showLedger)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${c.btnSecondary}`}>
              <ListChecks className="w-4 h-4" />
              Ledger
              {ledgerStats.total > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${isDark ? 'bg-emerald-900/40 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}>
                  {ledgerStats.cleared}/{ledgerStats.total}
                </span>
              )}
            </button>
          </div>

          {/* Progress bar */}
          {ledgerStats.total > 0 && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className={c.textMuted}>{ledgerStats.cleared} of {ledgerStats.total} debts cleared</span>
                <span className={`font-semibold ${ledgerStats.cleared === ledgerStats.total ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : c.textMuted}`}>
                  {ledgerStats.total > 0 ? Math.round((ledgerStats.cleared / ledgerStats.total) * 100) : 0}%
                </span>
              </div>
              <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-zinc-700' : 'bg-slate-200'}`}>
                <div className="h-full rounded-full bg-emerald-500 transition-all duration-700 ease-out"
                  style={{ width: `${ledgerStats.total > 0 ? (ledgerStats.cleared / ledgerStats.total) * 100 : 0}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* ═══ DEBT LEDGER (collapsible) ═══ */}
        {showLedger && (
          <div className={`${c.card} border rounded-xl shadow-lg p-5 anim-pop`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-bold ${c.text} flex items-center gap-2`}>
                <ListChecks className="w-5 h-5" /> Gratitude Ledger
              </h3>
              <button onClick={() => setEditingEntry(editingEntry === 'new' ? null : 'new')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${c.btnPrimary}`}>
                <Plus className="w-4 h-4" /> Add Debt
              </button>
            </div>

            {/* New entry form */}
            {editingEntry === 'new' && (
              <div className={`p-4 rounded-lg border mb-4 space-y-3 ${c.cardAlt}`}>
                <input value={newEntry.who} onChange={e => setNewEntry(p => ({ ...p, who: e.target.value }))}
                  placeholder="Who do you owe thanks to?" className={`w-full p-2.5 border rounded-lg text-sm ${c.input}`} />
                <input value={newEntry.what} onChange={e => setNewEntry(p => ({ ...p, what: e.target.value }))}
                  placeholder="What for? (brief)" className={`w-full p-2.5 border rounded-lg text-sm ${c.input}`} />
                <div className="flex gap-2 items-center">
                  <span className={`text-xs font-medium ${c.label}`}>Urgency:</span>
                  {['low','medium','high'].map(u => (
                    <button key={u} onClick={() => setNewEntry(p => ({ ...p, urgency: u }))}
                      className={`px-2.5 py-1 rounded text-xs font-medium border capitalize ${newEntry.urgency === u ? c.urgency[u] : c.btnSecondary}`}>
                      {u}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={addLedgerEntry} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium ${c.btnPrimary}`}>
                    <Check className="w-3.5 h-3.5" /> Save
                  </button>
                  <button onClick={() => setEditingEntry(null)} className={`px-3 py-1.5 rounded-lg text-sm ${c.btnSecondary}`}>Cancel</button>
                </div>
              </div>
            )}

            {/* Ledger entries */}
            {ledger.length === 0 ? (
              <p className={`text-sm text-center py-6 ${c.textMuted}`}>
                No gratitude debts tracked yet. Add someone you've been meaning to thank!
              </p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {ledger.map(entry => (
                  <div key={entry.id} className={`p-3 rounded-lg border flex items-center gap-3 transition-all ${
                    activeLedgerId === entry.id ? (isDark ? 'border-emerald-500 bg-emerald-900/10' : 'border-emerald-400 bg-emerald-50/50') : `${c.card}`
                  }`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-sm font-semibold ${c.text} truncate`}>{entry.who}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded capitalize border ${c.urgency[entry.urgency]}`}>{entry.urgency}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded capitalize ${c.status[entry.status]}`}>{entry.status}</span>
                      </div>
                      {entry.what && <p className={`text-xs ${c.textMuted} truncate`}>{entry.what}</p>}
                      {entry.sentAt && <p className={`text-xs ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>Sent {new Date(entry.sentAt).toLocaleDateString()}</p>}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {entry.status !== 'sent' && entry.status !== 'done' && (
                        <button onClick={() => loadFromLedger(entry)} title="Load into form"
                          className={`p-1.5 rounded ${c.btnSecondary}`}><Edit3 className="w-3.5 h-3.5" /></button>
                      )}
                      <select value={entry.status} onChange={e => updateLedgerStatus(entry.id, e.target.value)}
                        className={`text-xs p-1 rounded border ${c.select}`}>
                        <option value="pending">Pending</option>
                        <option value="drafted">Drafted</option>
                        <option value="sent">Sent</option>
                        <option value="done">Done</option>
                      </select>
                      <button onClick={() => deleteLedgerEntry(entry.id)} title="Delete"
                        className={`p-1.5 rounded ${isDark ? 'hover:bg-red-900/30 text-zinc-500 hover:text-red-400' : 'hover:bg-red-50 text-slate-400 hover:text-red-500'}`}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ MODE TOGGLE ═══ */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: isDark ? '#27272a' : '#e2e8f0' }}>
          {[{ id: 'full', label: 'Full Form', icon: Heart }, { id: 'quick', label: 'Quick Thanks', icon: Zap }].map(m => (
            <button key={m.id} onClick={() => { setMode(m.id); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${c.tab(mode === m.id)}`}>
              <m.icon className="w-4 h-4" /> {m.label}
            </button>
          ))}
        </div>

        {/* ═══ QUICK THANKS MODE ═══ */}
        {mode === 'quick' && (
          <div className={`${c.card} border rounded-xl shadow-lg p-6 anim-pop`}>
            <p className={`text-sm ${c.textMuted} mb-4`}>
              For quick situations &mdash; get a ready-to-send one-liner in seconds.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <input value={quickName} onChange={e => setQuickName(e.target.value)}
                placeholder="Who? (e.g., Mike)" className={`sm:w-1/3 p-3 border-2 rounded-lg ${c.input}`} />
              <input value={quickSituation} onChange={e => setQuickSituation(e.target.value)}
                placeholder="What happened? (e.g., covered my shift)" className={`flex-1 p-3 border-2 rounded-lg ${c.input}`}
                onKeyDown={e => e.key === 'Enter' && handleQuickThanks()} />
              <button onClick={handleQuickThanks}
                disabled={quickLoading || !quickName.trim() || !quickSituation.trim()}
                className={`px-5 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors ${
                  quickLoading || !quickName.trim() || !quickSituation.trim() ? c.btnDisabled + ' cursor-not-allowed' : c.btnPrimary
                }`}>
                {quickLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                Go
              </button>
            </div>

            {quickResult && (
              <div className={`p-4 rounded-lg border ${c.messageBody} anim-pop relative overflow-hidden`}>
                <ConfettiCanvas active={quickCopied} onDone={() => {}} />
                <p className={`${c.text} text-base leading-relaxed mb-3`}>
                  {quickResult.emoji_suggestion} {quickResult.message}
                </p>
                <button onClick={copyQuickResult}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${quickCopied ? c.success + ' border' : c.btnSecondary}`}>
                  {quickCopied ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ═══ FULL FORM MODE ═══ */}
        {mode === 'full' && (
          <div className={`${c.card} border rounded-xl shadow-lg p-6`}>

            {/* Active ledger indicator */}
            {activeLedgerId && (
              <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${c.info} border`}>
                <ListChecks className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm flex-1">Loaded from your ledger. Results will update the entry status.</span>
                <button onClick={() => setActiveLedgerId(null)} className="opacity-60 hover:opacity-100"><X className="w-4 h-4" /></button>
              </div>
            )}

            {/* Recipient Name */}
            <div className="mb-6">
              <label htmlFor="recipient-name" className={`block text-lg font-semibold ${c.text} mb-3`}>Who are you thanking?</label>
              <input id="recipient-name" type="text" value={recipientName} onChange={e => setRecipientName(e.target.value)}
                placeholder="e.g., Sarah, Dr. Martinez, the whole team"
                className={`w-full p-4 border-2 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none ${c.input}`} />
            </div>

            {/* Gratitude Points */}
            <div className="mb-6">
              <label htmlFor="gratitude-points" className={`block text-lg font-semibold ${c.text} mb-3`}>What are you grateful for?</label>
              <textarea id="gratitude-points" value={gratitudePoints} onChange={e => setGratitudePoints(e.target.value)}
                placeholder={"List the things you're thankful for (bullet points or free-form):\n\u2022 Helped me move apartments\n\u2022 Listened when I was stressed\n\u2022 Recommended me for the job"}
                className={`w-full h-40 p-4 border-2 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none resize-none ${c.input}`} />
              <p className={`text-sm ${c.textMuted} mt-2`}>
                Be specific! The more details you give, the more personal your message will be.
              </p>
            </div>

            {/* Gift Specificity Enhancement */}
            {(context === 'Gift received' || context === 'Wedding gift' || context === 'Baby shower gift') && (
              <div className={`mb-6 p-4 ${c.giftSection}`}>
                <h3 className={`text-sm font-semibold ${isDark ? 'text-amber-200' : 'text-amber-900'} mb-3 flex items-center gap-2`}>
                  <Gift className="w-4 h-4" /> Make It Extra Personal (Optional)
                </h3>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="gift-details" className={`block text-sm font-medium ${isDark ? 'text-amber-200' : 'text-amber-900'} mb-2`}>
                      Specific details about the gift
                    </label>
                    <input id="gift-details" type="text" value={specificGiftDetails} onChange={e => setSpecificGiftDetails(e.target.value)}
                      placeholder="e.g., 'the blue scarf', 'the cookbook with Italian recipes'"
                      className={`w-full p-3 border rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none ${c.giftInput}`} />
                  </div>
                  <div>
                    <label htmlFor="how-use" className={`block text-sm font-medium ${isDark ? 'text-amber-200' : 'text-amber-900'} mb-2`}>
                      How you'll use it or what it means to you
                    </label>
                    <input id="how-use" type="text" value={howYoullUseIt} onChange={e => setHowYoullUseIt(e.target.value)}
                      placeholder="e.g., 'I'll wear it to work', 'reminds me of our trip'"
                      className={`w-full p-3 border rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none ${c.giftInput}`} />
                  </div>
                </div>
                <p className={`text-xs ${isDark ? 'text-amber-300' : 'text-amber-700'} mt-2`}>
                  These details will make your thank-you feel much more thoughtful and genuine
                </p>
              </div>
            )}

            {/* Context and Relationship Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label htmlFor="context" className={`block text-sm font-medium ${c.label} mb-2`}>Context / Occasion</label>
                <select id="context" value={context} onChange={e => setContext(e.target.value)}
                  className={`w-full p-3 border rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none ${c.select}`}>
                  {contextOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="relationship" className={`block text-sm font-medium ${c.label} mb-2`}>Your Relationship</label>
                <select id="relationship" value={relationship} onChange={e => setRelationship(e.target.value)}
                  className={`w-full p-3 border rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none ${c.select}`}>
                  {relationshipOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            </div>

            {/* Tone Selection */}
            <div className="mb-6">
              <label className={`block text-sm font-medium ${c.label} mb-3`}>Tone Preference</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {toneOptions.map(option => (
                  <button key={option.id} onClick={() => setTone(option.label)}
                    className={`p-3 rounded-lg border-2 transition-all text-center ${c.toneChip(tone === option.label)}`}
                    aria-pressed={tone === option.label}>
                    <div className="text-2xl mb-1">{option.icon}</div>
                    <div className="text-sm font-medium">{option.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Cultural Context */}
            <div className="mb-6">
              <label htmlFor="cultural-context" className={`block text-sm font-medium ${c.label} mb-2`}>
                Cultural Context (helps with formality and etiquette)
              </label>
              <select id="cultural-context" value={culturalContext} onChange={e => setCulturalContext(e.target.value)}
                className={`w-full p-3 border rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none ${c.select}`}>
                {culturalContextOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              <p className={`text-xs ${c.textMuted} mt-1`}>
                Auto-detected from your browser settings. Different cultures have different gratitude etiquette.
              </p>
            </div>

            {/* Delivery Method */}
            <div className="mb-6">
              <label htmlFor="delivery-method" className={`block text-sm font-medium ${c.label} mb-2`}>How will you send this?</label>
              <select id="delivery-method" value={deliveryMethod} onChange={e => setDeliveryMethod(e.target.value)}
                className={`w-full p-3 border rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none ${c.select}`}>
                {deliveryMethodOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>

            {/* Handwriting Template Option */}
            <div className="mb-6">
              <label className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${c.handwritingCheck}`}>
                <input type="checkbox" checked={needHandwritingTemplate} onChange={e => setNeedHandwritingTemplate(e.target.checked)}
                  className="w-5 h-5 rounded border-zinc-400 text-emerald-600 focus:ring-2 focus:ring-emerald-500" />
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
              <label htmlFor="length-slider" className={`block text-sm font-medium ${c.label} mb-3`}>
                Message Length: <span className={`font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                  {length <= 3 ? 'Concise' : length <= 7 ? 'Moderate' : 'Detailed'}
                </span>
              </label>
              <input id="length-slider" type="range" min="1" max="10" value={length}
                onChange={e => setLength(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" />
              <div className={`flex justify-between text-xs ${c.textMuted} mt-1`}>
                <span>Short &amp; sweet</span><span>Detailed &amp; thorough</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button onClick={handleGenerate}
                disabled={loading || !recipientName.trim() || !gratitudePoints.trim()}
                className={`flex-1 font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                  loading || !recipientName.trim() || !gratitudePoints.trim() ? c.btnDisabled + ' cursor-not-allowed' : c.btnPrimary
                }`}>
                {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Crafting messages...</>
                  : <><Heart className="w-5 h-5" /> Generate Thank You Messages</>}
              </button>
              {results && (
                <button onClick={handleReset}
                  className={`px-6 py-3 border-2 font-semibold rounded-lg transition-colors ${isDark ? 'border-zinc-600 hover:border-zinc-500 text-zinc-200' : 'border-slate-300 hover:border-slate-400 text-slate-700'}`}>
                  Reset
                </button>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className={`mt-4 p-4 border rounded-lg flex items-start gap-3 ${c.error}`} role="alert">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" /><p className="text-sm">{error}</p>
              </div>
            )}

            {/* Pre-result cross-ref */}
            <p className={`text-xs text-center ${c.textMuted} mt-4`}>
              Need to apologize alongside your thanks?{' '}
              <a href="/ApologyCalibrator" className={c.link}>Apology Calibrator</a>{' '}
              helps you get the tone exactly right.
            </p>
          </div>
        )}

        {/* ═══ RESULTS ═══ */}
        {results && mode === 'full' && (
          <div className="space-y-6">

            {/* Controls bar — Copy All / Print / Share / Mark Sent */}
            <div className={`${c.card} border rounded-xl shadow-lg p-4 anim-stagger-0`}>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <span className={`text-sm font-semibold ${c.text}`}>
                  {results.thank_you_messages?.length || 0} versions generated
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <button onClick={handleCopyAll} className={`flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium ${c.btnSecondary}`}>
                    <Copy className="w-3 h-3" /> Copy All
                  </button>
                  <button onClick={handlePrint} className={`flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium ${c.btnSecondary}`}>
                    <Printer className="w-3 h-3" /> Print
                  </button>
                  <button onClick={handleShare} className={`flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium ${c.btnSecondary}`}>
                    <Share2 className="w-3 h-3" /> Share
                  </button>
                  {activeLedgerId && (
                    <button onClick={handleMarkSent}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold ${isDark ? 'bg-emerald-700 hover:bg-emerald-600 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}>
                      <CheckCircle className="w-3.5 h-3.5" /> Mark Sent
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Awkwardness Acknowledgment */}
            {results.if_you_feel_awkward && (
              <div className={`border-2 rounded-xl p-5 ${c.purple} anim-stagger-1`}>
                <div className="flex items-start gap-3">
                  <Gift className="w-5 h-5 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-medium mb-1">{results.if_you_feel_awkward.permission}</p>
                    <p className="text-sm">{results.if_you_feel_awkward.reframe}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Message Cards */}
            <div>
              <h2 className={`text-2xl font-bold ${c.text} mb-4 anim-stagger-1`}>Your Thank You Messages</h2>
              <div className="space-y-4">
                {results.thank_you_messages?.map((message, index) => (
                  <div key={index}
                    className={`rounded-xl shadow-lg p-6 border-2 transition-all ${c.messageCard} anim-stagger-${Math.min(index + 1, 3)} ${flipIndex === index ? 'anim-flip' : ''}`}
                    style={{ perspective: '600px' }}>

                    {/* Message Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className={`text-lg font-bold ${c.text} mb-1`}>{message.version}</h3>
                        <div className="flex items-center gap-3 text-sm">
                          <span className={`inline-block px-3 py-1 rounded-full font-medium ${c.toneBadge}`}>{message.tone}</span>
                          <span className={c.textMuted}>{message.length} words</span>
                        </div>
                      </div>
                    </div>

                    {/* Why This Works */}
                    <div className={`border-l-4 rounded-r-lg p-3 mb-4 ${c.info} border`}>
                      <p className="text-sm"><strong>Why this works:</strong> {message.why_this_works}</p>
                      <p className="text-sm mt-1"><strong>Best for:</strong> {message.best_for}</p>
                    </div>

                    {/* Message Text */}
                    <div className={`rounded-lg p-4 border mb-4 ${c.messageBody}`}>
                      <p className={`${c.text} text-base leading-relaxed whitespace-pre-wrap`}>{message.message_text}</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => copyToClipboard(message.message_text, index)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${copiedIndex === index ? c.success + ' border' : c.btnPrimary}`}>
                        {copiedIndex === index ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Message</>}
                      </button>
                      <button onClick={() => handleAdjust(message, index, 'less-mushy')} disabled={adjustingIndex === index}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                          adjustingIndex === index ? c.btnDisabled + ' cursor-not-allowed' : c.btnSecondary}`}>
                        {adjustingIndex === index ? <><Loader2 className="w-4 h-4 animate-spin" /> Adjusting...</>
                          : <><Minus className="w-4 h-4" /> Too mushy?</>}
                      </button>
                      <button onClick={() => handleAdjust(message, index, 'more-specific')} disabled={adjustingIndex === index}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                          adjustingIndex === index ? c.btnDisabled + ' cursor-not-allowed' : c.btnSecondary}`}>
                        {adjustingIndex === index ? <><Loader2 className="w-4 h-4 animate-spin" /> Adjusting...</>
                          : <><Plus className="w-4 h-4" /> More specific?</>}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Suggestions */}
            {results.delivery_suggestions && (
              <div className={`border-2 rounded-xl p-5 ${c.success} anim-stagger-2`}>
                <div className="flex items-start gap-3 mb-3">
                  <Send className="w-5 h-5 flex-shrink-0 mt-1" />
                  <h3 className="text-lg font-bold">Delivery Suggestions</h3>
                </div>
                <div className={`space-y-2 ml-8 ${isDark ? 'text-emerald-200' : 'text-emerald-800'}`}>
                  <p><strong>Method:</strong> {results.delivery_suggestions.method}</p>
                  <p><strong>Timing:</strong> {results.delivery_suggestions.timing}</p>
                  {results.delivery_suggestions.timing_cultural_note && (
                    <p className={`p-2 rounded ${isDark ? 'bg-emerald-900/30' : 'bg-emerald-100'}`}>
                      <strong>Cultural Note:</strong> {results.delivery_suggestions.timing_cultural_note}
                    </p>
                  )}
                  {results.delivery_suggestions.additional_gesture && (
                    <p><strong>Bonus idea:</strong> {results.delivery_suggestions.additional_gesture}</p>
                  )}
                </div>
              </div>
            )}

            {/* Personalization Tips */}
            {results.personalization_tips?.length > 0 && (
              <div className={`border-2 rounded-xl p-5 ${c.warning} anim-stagger-3`}>
                <div className="flex items-start gap-3 mb-3">
                  <Mail className="w-5 h-5 flex-shrink-0 mt-1" />
                  <h3 className="text-lg font-bold">Make It Even More Personal</h3>
                </div>
                <ul className={`space-y-2 ml-8 list-disc ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>
                  {results.personalization_tips.map((tip, i) => <li key={i}>{tip}</li>)}
                </ul>
              </div>
            )}

            {/* Conditional cross-refs */}
            {context === 'Post-interview' && (
              <p className={`text-xs text-center ${c.textMuted} mt-2`}>
                Sending a follow-up can feel awkward &mdash;{' '}
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
        {results && results.handwriting_template && mode === 'full' && (
          <div className={`border-2 rounded-xl p-6 ${c.success} anim-stagger-3`}>
            <div className="flex items-start gap-3 mb-4">
              <Mail className="w-6 h-6 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-bold mb-1">Handwritten Card Template</h3>
                <p className={`text-sm ${c.textSecondary}`}>Follow this layout for a beautiful handwritten thank-you note</p>
              </div>
            </div>
            <div className={`rounded-lg p-6 border-2 shadow-inner ${isDark ? 'bg-zinc-900 border-emerald-800' : 'bg-white border-emerald-300'}`}>
              <div className="space-y-4">
                <div className={`border-b pb-3 ${isDark ? 'border-zinc-700' : 'border-slate-200'}`}>
                  <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${c.textMuted}`}>Opening (top right or center)</p>
                  <p className={`${c.text} font-serif text-lg`}>{results.handwriting_template.opening_placement}</p>
                </div>
                <div className={`border-b pb-3 ${isDark ? 'border-zinc-700' : 'border-slate-200'}`}>
                  <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${c.textMuted}`}>Main Message (body)</p>
                  <p className={`${c.text} leading-relaxed whitespace-pre-wrap`}>{results.handwriting_template.message_layout}</p>
                </div>
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${c.textMuted}`}>Closing (bottom right)</p>
                  <p className={`${c.text} font-serif`}>{results.handwriting_template.closing_placement}</p>
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`rounded-lg p-4 border ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-emerald-200'}`}>
                <h4 className={`font-semibold ${c.text} mb-2 text-sm`}>Font Suggestions</h4>
                <ul className={`space-y-1 text-sm ${c.textSecondary}`}>
                  {results.handwriting_template.font_suggestions?.map((font, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className={isDark ? 'text-emerald-500' : 'text-emerald-400'}>&bull;</span>{font}
                    </li>
                  ))}
                </ul>
              </div>
              <div className={`rounded-lg p-4 border ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-emerald-200'}`}>
                <h4 className={`font-semibold ${c.text} mb-2 text-sm`}>Card Tips</h4>
                <ul className={`space-y-1 text-sm ${c.textSecondary}`}>
                  {results.handwriting_template.writing_tips?.map((tip, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className={isDark ? 'text-emerald-500' : 'text-emerald-400'}>&bull;</span>{tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {results.handwriting_template.length_guidance && (
              <div className={`mt-4 p-3 rounded-lg ${isDark ? 'bg-emerald-900/30' : 'bg-emerald-100'}`}>
                <p className={`text-sm ${c.text}`}><strong>Length:</strong> {results.handwriting_template.length_guidance}</p>
              </div>
            )}
          </div>
        )}

        {/* Post-result cross-ref */}
        {results && mode === 'full' && (
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
