import React, { useState, useRef, useCallback } from 'react';
import { CreditCard, Loader2, AlertCircle, Plus, X, Copy, Check, Upload, FileText, Trash2, Download, Mail, ChevronDown, ChevronUp, DollarSign, TrendingDown, AlertTriangle, Shield, Sparkles, BarChart3, Eye, EyeOff } from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';

const SubscriptionGuiltTrip = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const fileInputRef = useRef(null);

  // Input mode
  const [inputMode, setInputMode] = useState('manual'); // 'manual', 'paste', 'upload'

  // Manual subscriptions
  const [subscriptions, setSubscriptions] = useState([
    { name: '', monthlyCost: '', usage: '', category: '' }
  ]);

  // Paste mode
  const [pastedText, setPastedText] = useState('');

  // Upload mode
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [parsedTransactions, setParsedTransactions] = useState(null);

  // Results
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [copiedScripts, setCopiedScripts] = useState({});
  const [expandedCards, setExpandedCards] = useState({});
  const [selectedForCancel, setSelectedForCancel] = useState({});
  const [showEmails, setShowEmails] = useState({});
  const [copiedEmails, setCopiedEmails] = useState({});

  // Theme colors
  const c = {
    bg: isDark ? 'bg-zinc-900' : 'bg-gradient-to-br from-violet-50 via-slate-50 to-emerald-50',
    card: isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-slate-200',
    cardHover: isDark ? 'hover:border-zinc-600' : 'hover:border-violet-300',
    input: isDark
      ? 'bg-zinc-900 border-zinc-700 text-zinc-50 placeholder:text-zinc-500 focus:border-violet-500 focus:ring-violet-500/20'
      : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:ring-violet-200',
    text: isDark ? 'text-zinc-50' : 'text-slate-900',
    textSecondary: isDark ? 'text-zinc-400' : 'text-slate-600',
    textMuted: isDark ? 'text-zinc-500' : 'text-slate-500',
    label: isDark ? 'text-zinc-300' : 'text-slate-700',
    accent: isDark ? 'text-violet-400' : 'text-violet-600',
    btnPrimary: isDark
      ? 'bg-violet-600 hover:bg-violet-700 text-white'
      : 'bg-violet-600 hover:bg-violet-700 text-white',
    btnSecondary: isDark
      ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-50'
      : 'bg-slate-100 hover:bg-slate-200 text-slate-700',
    btnDanger: isDark
      ? 'bg-red-700 hover:bg-red-800 text-white'
      : 'bg-red-600 hover:bg-red-700 text-white',
    dropzone: isDark
      ? 'border-zinc-600 bg-zinc-800/50 hover:border-violet-500 hover:bg-zinc-800'
      : 'border-slate-300 bg-slate-50 hover:border-violet-400 hover:bg-violet-50',
    tabActive: isDark
      ? 'bg-violet-600 text-white'
      : 'bg-violet-600 text-white',
    tabInactive: isDark
      ? 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
      : 'bg-white text-slate-500 hover:text-slate-700',
    savingsBox: isDark
      ? 'bg-gradient-to-r from-violet-900/40 to-emerald-900/40 border-violet-700'
      : 'bg-gradient-to-r from-violet-50 to-emerald-50 border-violet-300',
    cancelCard: isDark
      ? 'bg-red-900/20 border-red-800'
      : 'bg-red-50 border-red-200',
    keepCard: isDark
      ? 'bg-emerald-900/20 border-emerald-800'
      : 'bg-emerald-50 border-emerald-200',
    permissionBox: isDark
      ? 'bg-blue-900/20 border-blue-700'
      : 'bg-blue-50 border-blue-200',
    wasteHigh: isDark ? 'bg-red-900/30 text-red-300 border-red-700' : 'bg-red-100 text-red-800 border-red-300',
    wasteMed: isDark ? 'bg-amber-900/30 text-amber-300 border-amber-700' : 'bg-amber-100 text-amber-800 border-amber-300',
    wasteLow: isDark ? 'bg-emerald-900/30 text-emerald-300 border-emerald-700' : 'bg-emerald-100 text-emerald-800 border-emerald-300',
    scriptBox: isDark ? 'bg-zinc-900 border-red-700' : 'bg-white border-red-300',
    emailBox: isDark ? 'bg-zinc-900 border-violet-700' : 'bg-white border-violet-300',
    guiltFree: isDark ? 'bg-emerald-900/30 border-emerald-700' : 'bg-emerald-50 border-emerald-300',
  };

  // ── Manual entry handlers ──
  const addSubscription = () => {
    setSubscriptions([...subscriptions, { name: '', monthlyCost: '', usage: '', category: '' }]);
  };

  const removeSubscription = (index) => {
    setSubscriptions(subscriptions.filter((_, i) => i !== index));
  };

  const updateSubscription = (index, field, value) => {
    const newSubs = [...subscriptions];
    newSubs[index][field] = value;
    setSubscriptions(newSubs);
  };

  // ── File upload handler ──
  const handleFileUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setUploadedFileName(file.name);

    const isCSV = file.name.toLowerCase().endsWith('.csv') || file.type === 'text/csv';
    const isPDF = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';

    if (!isCSV && !isPDF && !file.type.startsWith('text/')) {
      setError('Please upload a CSV, PDF, or text file');
      setUploadedFileName('');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File must be less than 10MB');
      setUploadedFileName('');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      if (isCSV) {
        parseCSV(content);
      } else {
        // For text/PDF-as-text, store raw content
        setPastedText(content);
        setInputMode('paste');
      }
    };
    reader.readAsText(file);
  }, []);

  const parseCSV = (content) => {
    const lines = content.split('\n').filter(l => l.trim());
    if (lines.length < 2) {
      setError('CSV file appears empty or has no data rows');
      return;
    }

    // Try to identify columns
    const header = lines[0].toLowerCase();
    const hasHeader = header.includes('date') || header.includes('description') || header.includes('amount') || header.includes('merchant');
    const dataLines = hasHeader ? lines.slice(1) : lines;

    const transactions = dataLines.map(line => {
      const parts = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''));
      return parts.join(' | ');
    }).filter(t => t.trim());

    if (transactions.length > 0) {
      setParsedTransactions(transactions);
      setPastedText(transactions.join('\n'));
      setInputMode('paste');
    } else {
      setError('Could not parse transactions from CSV');
    }
  };

  // ── Drag and drop ──
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      const fakeEvent = { target: { files: [file] } };
      handleFileUpload(fakeEvent);
    }
  };

  // ── Analyze ──
  const handleAnalyze = async () => {
    let payload;

    if (inputMode === 'manual') {
      const filledSubs = subscriptions.filter(s => s.name.trim());
      if (filledSubs.length === 0) {
        setError('Please add at least one subscription');
        return;
      }
      payload = { subscriptions: filledSubs, inputType: 'manual' };
    } else if (inputMode === 'paste') {
      if (!pastedText.trim()) {
        setError('Please paste your transaction data');
        return;
      }
      payload = { transactionText: pastedText.trim(), inputType: 'text' };
    } else if (inputMode === 'upload') {
      if (!parsedTransactions && !pastedText.trim()) {
        setError('Please upload a file first');
        return;
      }
      payload = { transactionText: pastedText.trim() || parsedTransactions?.join('\n'), inputType: 'text' };
    }

    setError('');
    setResults(null);
    setSelectedForCancel({});
    setExpandedCards({});
    setShowEmails({});

    try {
      const data = await callToolEndpoint('subscription-guilt-trip', payload);
      setResults(data);

      // Auto-select high-waste subscriptions for cancellation
      if (data.subscriptions_analyzed) {
        const autoSelect = {};
        data.subscriptions_analyzed.forEach((sub) => {
          if (sub.waste_likelihood >= 70 || sub.verdict === 'cancel') {
            autoSelect[sub.name] = true;
          }
        });
        setSelectedForCancel(autoSelect);
      }
    } catch (err) {
      setError(err.message || 'Failed to analyze subscriptions. Please try again.');
    }
  };

  // ── Copy helpers ──
  const copyScript = (name, script) => {
    navigator.clipboard.writeText(script);
    setCopiedScripts({ ...copiedScripts, [name]: true });
    setTimeout(() => setCopiedScripts({ ...copiedScripts, [name]: false }), 2000);
  };

  const copyEmail = (name, email) => {
    navigator.clipboard.writeText(email);
    setCopiedEmails({ ...copiedEmails, [name]: true });
    setTimeout(() => setCopiedEmails({ ...copiedEmails, [name]: false }), 2000);
  };

  const copyAllEmails = () => {
    if (!results?.recommended_cancellations) return;
    const selectedCancellations = results.recommended_cancellations.filter(c => selectedForCancel[c.name]);
    const allEmails = selectedCancellations
      .map(c => `--- ${c.name} ---\n${c.cancellation_email || c.cancellation_script || 'N/A'}`)
      .join('\n\n');
    navigator.clipboard.writeText(allEmails);
  };

  // ── Toggle helpers ──
  const toggleCard = (name) => {
    setExpandedCards(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const toggleCancelSelect = (name) => {
    setSelectedForCancel(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const toggleEmail = (name) => {
    setShowEmails(prev => ({ ...prev, [name]: !prev[name] }));
  };

  // ── Export as CSV ──
  const exportCSV = () => {
    if (!results?.subscriptions_analyzed) return;
    const headers = 'Name,Monthly Cost,Annual Cost,Category,Usage,Waste Likelihood,Verdict,Reasoning';
    const rows = results.subscriptions_analyzed.map(s =>
      `"${s.name}","${s.monthly_cost}","${s.annual_cost || ''}","${s.category || ''}","${s.actual_usage || ''}",${s.waste_likelihood || ''}%,"${s.verdict}","${(s.reasoning || '').replace(/"/g, '""')}"`
    );
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subscription-audit.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Waste badge ──
  const getWasteBadge = (likelihood) => {
    const val = parseInt(likelihood) || 0;
    if (val >= 70) return { label: 'Likely Unused', color: c.wasteHigh, icon: <AlertTriangle className="w-3.5 h-3.5" /> };
    if (val >= 30) return { label: 'Check Usage', color: c.wasteMed, icon: <Eye className="w-3.5 h-3.5" /> };
    return { label: 'Actively Used', color: c.wasteLow, icon: <Check className="w-3.5 h-3.5" /> };
  };

  // ── Difficulty badge ──
  const getDifficultyColor = (difficulty) => {
    const d = (difficulty || '').toLowerCase();
    if (d === 'hard') return isDark ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-700';
    if (d === 'medium') return isDark ? 'bg-amber-900/40 text-amber-300' : 'bg-amber-100 text-amber-700';
    return isDark ? 'bg-emerald-900/40 text-emerald-300' : 'bg-emerald-100 text-emerald-700';
  };

  // Category icons map
  const categoryIcons = {
    streaming: '📺',
    fitness: '💪',
    software: '💻',
    news: '📰',
    gaming: '🎮',
    food: '🍕',
    music: '🎵',
    cloud: '☁️',
    productivity: '📋',
    other: '📦',
  };

  const getCategoryIcon = (category) => {
    return categoryIcons[(category || '').toLowerCase()] || '📦';
  };

  // ── Compute selected savings ──
  const getSelectedSavings = () => {
    if (!results?.recommended_cancellations) return { monthly: 0, annual: 0 };
    let monthly = 0;
    results.recommended_cancellations.forEach(c => {
      if (selectedForCancel[c.name]) {
        const m = parseFloat((c.monthly_savings || '').replace(/[^0-9.]/g, '')) || 0;
        monthly += m;
      }
    });
    return { monthly: monthly.toFixed(2), annual: (monthly * 12).toFixed(2) };
  };

  return (
    <div className={`min-h-screen ${c.bg} py-8 px-4`}>
      <div className="max-w-5xl mx-auto">

        {/* ── Header ── */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-2">
            <div className={`p-3 rounded-2xl ${isDark ? 'bg-violet-900/40' : 'bg-violet-100'}`}>
              <CreditCard className={`w-7 h-7 ${c.accent}`} />
            </div>
            <h1 className={`text-3xl font-bold ${c.text}`} style={{ fontFamily: "'Georgia', serif" }}>
              Subscription Guilt Trip
            </h1>
          </div>
          <p className={c.textSecondary}>
            Audit your subscriptions, spot the waste, and cancel guilt-free
          </p>
        </div>

        {/* ── Privacy Badge ── */}
        <div className="flex justify-center mb-6">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium ${isDark ? 'bg-emerald-900/30 text-emerald-300 border border-emerald-700' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
            <Shield className="w-3.5 h-3.5" />
            Processed in your session — nothing stored
          </div>
        </div>

        {/* ── Input Mode Tabs ── */}
        <div className={`${c.card} border rounded-2xl shadow-sm p-6 mb-6`}>
          <div className="flex gap-2 mb-6">
            {[
              { id: 'manual', label: 'Manual Entry', icon: <Plus className="w-4 h-4" /> },
              { id: 'paste', label: 'Paste Transactions', icon: <FileText className="w-4 h-4" /> },
              { id: 'upload', label: 'Upload CSV', icon: <Upload className="w-4 h-4" /> },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setInputMode(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${inputMode === tab.id ? c.tabActive : c.tabInactive}`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* ── Manual Entry ── */}
          {inputMode === 'manual' && (
            <>
              <label className={`block text-sm font-semibold ${c.label} mb-3`}>
                List your subscriptions
              </label>
              <div className="space-y-3 mb-4">
                {subscriptions.map((sub, index) => (
                  <div key={index} className={`rounded-xl p-4 border-2 ${isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <input
                        type="text"
                        value={sub.name}
                        onChange={(e) => updateSubscription(index, 'name', e.target.value)}
                        placeholder="Service name (e.g. Netflix)"
                        className={`p-3 border rounded-lg outline-none text-sm ${c.input}`}
                      />
                      <input
                        type="text"
                        value={sub.monthlyCost}
                        onChange={(e) => updateSubscription(index, 'monthlyCost', e.target.value)}
                        placeholder="Monthly cost (e.g. $15.99)"
                        className={`p-3 border rounded-lg outline-none text-sm ${c.input}`}
                      />
                      <input
                        type="text"
                        value={sub.usage}
                        onChange={(e) => updateSubscription(index, 'usage', e.target.value)}
                        placeholder="Usage (e.g. 3x/month, daily)"
                        className={`p-3 border rounded-lg outline-none text-sm ${c.input}`}
                      />
                      <div className="flex gap-2">
                        <select
                          value={sub.category}
                          onChange={(e) => updateSubscription(index, 'category', e.target.value)}
                          className={`flex-1 p-3 border rounded-lg outline-none text-sm ${c.input}`}
                        >
                          <option value="">Category</option>
                          <option value="streaming">Streaming</option>
                          <option value="fitness">Fitness</option>
                          <option value="software">Software</option>
                          <option value="news">News/Media</option>
                          <option value="gaming">Gaming</option>
                          <option value="food">Food Delivery</option>
                          <option value="music">Music</option>
                          <option value="cloud">Cloud Storage</option>
                          <option value="productivity">Productivity</option>
                          <option value="other">Other</option>
                        </select>
                        {subscriptions.length > 1 && (
                          <button
                            onClick={() => removeSubscription(index)}
                            className={`p-3 rounded-lg transition-colors ${isDark ? 'bg-red-900/30 hover:bg-red-900/50 text-red-400' : 'bg-red-100 hover:bg-red-200 text-red-600'}`}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={addSubscription}
                className={`w-full mb-4 py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm font-medium ${c.btnSecondary}`}
              >
                <Plus className="w-4 h-4" />
                Add Another Subscription
              </button>
            </>
          )}

          {/* ── Paste Transactions ── */}
          {inputMode === 'paste' && (
            <>
              <label className={`block text-sm font-semibold ${c.label} mb-2`}>
                Paste your transaction data
              </label>
              <p className={`text-xs ${c.textMuted} mb-3`}>
                Paste bank transactions, credit card statements, or any list of recurring charges. The AI will identify subscriptions automatically.
              </p>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder={`Example:\n01/15 NETFLIX.COM  $15.99\n01/15 SPOTIFY USA  $9.99\n01/18 ADOBE CREATIVE  $54.99\n01/20 PLANET FITNESS  $24.99\n02/15 NETFLIX.COM  $15.99\n02/15 SPOTIFY USA  $9.99\n...`}
                rows={10}
                className={`w-full p-4 border rounded-xl outline-none text-sm font-mono resize-y mb-4 ${c.input}`}
              />
              {parsedTransactions && (
                <div className={`text-xs ${c.textMuted} mb-4`}>
                  ✓ Parsed {parsedTransactions.length} transaction rows from {uploadedFileName}
                </div>
              )}
            </>
          )}

          {/* ── Upload CSV ── */}
          {inputMode === 'upload' && (
            <>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all mb-4 ${isDragging ? (isDark ? 'border-violet-400 bg-violet-900/20' : 'border-violet-400 bg-violet-50') : c.dropzone}`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Upload className={`w-10 h-10 mx-auto mb-3 ${c.textMuted}`} />
                <p className={`font-semibold ${c.text} mb-1`}>
                  {uploadedFileName || 'Drop your bank statement here'}
                </p>
                <p className={`text-xs ${c.textMuted}`}>
                  CSV or TXT files up to 10MB • Click or drag to upload
                </p>
              </div>
              <div className={`flex items-start gap-2 text-xs ${c.textMuted} mb-4`}>
                <Shield className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span>Your file is processed locally in this session. We never store or transmit your financial data.</span>
              </div>
            </>
          )}

          {/* ── Sample Data Button ── */}
          <div className="flex gap-3 mb-4">
            <button
              onClick={() => {
                setInputMode('manual');
                setSubscriptions([
                  { name: 'Netflix', monthlyCost: '$15.99', usage: '2x per month', category: 'streaming' },
                  { name: 'Spotify', monthlyCost: '$9.99', usage: 'Daily', category: 'music' },
                  { name: 'Adobe Creative Cloud', monthlyCost: '$54.99', usage: 'Once last quarter', category: 'software' },
                  { name: 'Planet Fitness', monthlyCost: '$24.99', usage: 'Haven\'t gone in 3 months', category: 'fitness' },
                  { name: 'Hulu', monthlyCost: '$17.99', usage: 'Maybe once a month', category: 'streaming' },
                  { name: 'iCloud+', monthlyCost: '$2.99', usage: 'Always (photo backup)', category: 'cloud' },
                  { name: 'NYT Digital', monthlyCost: '$4.25', usage: 'Read daily', category: 'news' },
                  { name: 'Headspace', monthlyCost: '$12.99', usage: 'Used it once', category: 'other' },
                ]);
              }}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${c.btnSecondary}`}
            >
              <Sparkles className="w-3 h-3 inline mr-1" />
              Load sample data
            </button>
          </div>

          {/* ── Analyze Button ── */}
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className={`w-full font-semibold py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm ${loading ? (isDark ? 'bg-zinc-700 text-zinc-400' : 'bg-slate-200 text-slate-400') : c.btnPrimary}`}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing your subscriptions...
              </>
            ) : (
              <>
                <BarChart3 className="w-5 h-5" />
                Audit My Subscriptions
              </>
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
          <div className="space-y-6">

            {/* ── Total Savings Banner ── */}
            {results.total_savings_if_cancel_recommended && (
              <div className={`${c.savingsBox} border-2 rounded-2xl shadow-sm p-6`}>
                <div className="flex items-center gap-2 mb-4 justify-center">
                  <TrendingDown className={c.accent} />
                  <h2 className={`text-xl font-bold ${c.text}`}>Potential Savings</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <div className={`text-xs uppercase tracking-wider font-semibold ${c.textMuted} mb-1`}>Monthly</div>
                    <div className={`text-3xl font-bold ${c.accent}`}>
                      {results.total_savings_if_cancel_recommended.monthly}
                    </div>
                  </div>
                  <div>
                    <div className={`text-xs uppercase tracking-wider font-semibold ${c.textMuted} mb-1`}>Annual</div>
                    <div className={`text-3xl font-bold ${c.text}`}>
                      {results.total_savings_if_cancel_recommended.annual}
                    </div>
                  </div>
                  <div>
                    <div className={`text-xs uppercase tracking-wider font-semibold ${c.textMuted} mb-1`}>Could buy instead</div>
                    <div className={`text-base font-semibold ${c.textSecondary}`}>
                      {results.total_savings_if_cancel_recommended.what_you_could_buy_instead}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Summary Stats Row ── */}
            {(results.total_monthly_cost || results.annual_cost) && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Total Monthly', value: results.total_monthly_cost, icon: <DollarSign className="w-4 h-4" /> },
                  { label: 'Total Annual', value: results.annual_cost, icon: <BarChart3 className="w-4 h-4" /> },
                  { label: 'Est. Monthly Waste', value: results.estimated_waste_monthly, icon: <AlertTriangle className="w-4 h-4" /> },
                  { label: 'Est. Annual Waste', value: results.estimated_waste_annual, icon: <TrendingDown className="w-4 h-4" /> },
                ].filter(s => s.value).map((stat, idx) => (
                  <div key={idx} className={`${c.card} border rounded-xl p-4 text-center`}>
                    <div className={`flex items-center justify-center gap-1 text-xs uppercase tracking-wider font-semibold ${c.textMuted} mb-1`}>
                      {stat.icon} {stat.label}
                    </div>
                    <div className={`text-xl font-bold ${c.text}`}>{stat.value}</div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Full Subscription Analysis Cards ── */}
            {results.subscriptions_analyzed && results.subscriptions_analyzed.length > 0 && (
              <div className={`${c.card} border rounded-2xl shadow-sm p-6`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-bold ${c.text}`}>📊 Subscription Breakdown</h3>
                  <button onClick={exportCSV} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${c.btnSecondary}`}>
                    <Download className="w-3.5 h-3.5" />
                    Export CSV
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {results.subscriptions_analyzed.map((sub, idx) => {
                    const waste = getWasteBadge(sub.waste_likelihood);
                    const isExpanded = expandedCards[sub.name];
                    return (
                      <div
                        key={idx}
                        className={`border-2 rounded-xl p-4 transition-all cursor-pointer ${c.cardHover} ${sub.verdict === 'cancel' ? c.cancelCard : sub.verdict === 'keep' ? c.keepCard : `${c.card} border`}`}
                        onClick={() => toggleCard(sub.name)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{getCategoryIcon(sub.category)}</span>
                            <div>
                              <h4 className={`font-bold ${c.text}`}>{sub.name}</h4>
                              <div className={`text-xs ${c.textMuted}`}>{sub.category || 'Other'}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${waste.color}`}>
                              {waste.icon} {waste.label}
                            </span>
                            {isExpanded ? <ChevronUp className={`w-4 h-4 ${c.textMuted}`} /> : <ChevronDown className={`w-4 h-4 ${c.textMuted}`} />}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 mb-2">
                          <div>
                            <span className={`text-lg font-bold ${c.text}`}>{sub.monthly_cost}</span>
                            <span className={`text-xs ${c.textMuted}`}>/mo</span>
                          </div>
                          {sub.cost_per_use && (
                            <div className={`text-xs ${c.textMuted}`}>
                              {sub.cost_per_use} per use
                            </div>
                          )}
                          <div className={`ml-auto px-2 py-0.5 rounded text-xs font-bold uppercase ${sub.verdict === 'cancel' ? (isDark ? 'bg-red-800 text-red-200' : 'bg-red-200 text-red-800') : sub.verdict === 'keep' ? (isDark ? 'bg-emerald-800 text-emerald-200' : 'bg-emerald-200 text-emerald-800') : (isDark ? 'bg-amber-800 text-amber-200' : 'bg-amber-200 text-amber-800')}`}>
                            {sub.verdict}
                          </div>
                        </div>

                        {sub.waste_likelihood !== undefined && (
                          <div className="mb-2">
                            <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-zinc-700' : 'bg-slate-200'}`}>
                              <div
                                className={`h-full rounded-full transition-all ${sub.waste_likelihood >= 70 ? 'bg-red-500' : sub.waste_likelihood >= 30 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                style={{ width: `${Math.min(100, sub.waste_likelihood)}%` }}
                              />
                            </div>
                            <div className={`text-xs mt-1 ${c.textMuted}`}>{sub.waste_likelihood}% waste likelihood</div>
                          </div>
                        )}

                        {isExpanded && (
                          <div className="mt-3 space-y-2" onClick={(e) => e.stopPropagation()}>
                            {sub.actual_usage && (
                              <p className={`text-sm ${c.textSecondary}`}><strong>Usage:</strong> {sub.actual_usage}</p>
                            )}
                            {sub.reasoning && (
                              <p className={`text-sm ${c.textSecondary}`}><strong>Analysis:</strong> {sub.reasoning}</p>
                            )}
                            {sub.alternatives && (
                              <p className={`text-sm ${c.textSecondary}`}><strong>Alternatives:</strong> {sub.alternatives}</p>
                            )}
                            {sub.annual_cost && (
                              <p className={`text-sm ${c.textSecondary}`}><strong>Annual cost:</strong> {sub.annual_cost}</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Recommended Cancellations ── */}
            {results.recommended_cancellations && results.recommended_cancellations.length > 0 && (
              <div className={`${c.card} border rounded-2xl shadow-sm p-6`}>
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                  <h3 className={`text-lg font-bold ${c.text}`}>🚫 Recommended Cancellations</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={copyAllEmails}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${c.btnSecondary}`}
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copy All Scripts
                    </button>
                  </div>
                </div>

                {/* Selected savings tally */}
                {Object.values(selectedForCancel).some(v => v) && (
                  <div className={`mb-4 px-4 py-3 rounded-xl ${isDark ? 'bg-violet-900/30 border border-violet-700' : 'bg-violet-50 border border-violet-200'}`}>
                    <div className={`text-sm font-medium ${c.accent}`}>
                      Selected savings: <strong>${getSelectedSavings().monthly}/mo</strong> · <strong>${getSelectedSavings().annual}/yr</strong>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {results.recommended_cancellations.map((cancel, idx) => (
                    <div key={idx} className={`border-2 rounded-xl p-5 ${c.cancelCard}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={!!selectedForCancel[cancel.name]}
                            onChange={() => toggleCancelSelect(cancel.name)}
                            className="mt-1.5 w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                          />
                          <div>
                            <h4 className={`text-lg font-bold ${c.text}`}>{cancel.name}</h4>
                            <div className={`text-sm ${c.textSecondary}`}>
                              Save {cancel.monthly_savings}/mo · {cancel.annual_savings}/yr
                            </div>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(cancel.cancellation_difficulty)}`}>
                          {cancel.cancellation_difficulty} to cancel
                        </span>
                      </div>

                      {/* How to cancel */}
                      <div className="mb-3">
                        <div className={`text-xs font-semibold uppercase tracking-wider ${c.textMuted} mb-1`}>How to cancel</div>
                        <p className={`text-sm ${c.textSecondary}`}>{cancel.how_to_cancel}</p>
                      </div>

                      {/* Retention tactics */}
                      {cancel.retention_tactics_to_expect && cancel.retention_tactics_to_expect.length > 0 && (
                        <div className="mb-3">
                          <div className={`text-xs font-semibold uppercase tracking-wider ${c.textMuted} mb-1`}>Expect these retention tactics</div>
                          <div className="flex flex-wrap gap-2">
                            {cancel.retention_tactics_to_expect.map((tactic, tIdx) => (
                              <span key={tIdx} className={`inline-block px-2 py-1 rounded-lg text-xs ${isDark ? 'bg-zinc-700 text-zinc-300' : 'bg-slate-100 text-slate-600'}`}>
                                ⚠️ {tactic}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Cancellation script */}
                      {cancel.cancellation_script && (
                        <div className={`border-2 rounded-xl p-4 mb-3 ${c.scriptBox}`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-red-400' : 'text-red-700'}`}>
                              Cancellation Script
                            </div>
                            <button
                              onClick={() => copyScript(cancel.name, cancel.cancellation_script)}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${isDark ? 'bg-red-800 hover:bg-red-700 text-red-200' : 'bg-red-600 hover:bg-red-700 text-white'}`}
                            >
                              {copiedScripts[cancel.name] ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                              {copiedScripts[cancel.name] ? 'Copied!' : 'Copy'}
                            </button>
                          </div>
                          <p className={`text-sm italic ${c.textSecondary}`}>"{cancel.cancellation_script}"</p>
                        </div>
                      )}

                      {/* Cancellation email */}
                      {cancel.cancellation_email && (
                        <div className="mb-3">
                          <button
                            onClick={() => toggleEmail(cancel.name)}
                            className={`flex items-center gap-1.5 text-xs font-medium ${c.accent} mb-2`}
                          >
                            <Mail className="w-3.5 h-3.5" />
                            {showEmails[cancel.name] ? 'Hide cancellation email' : 'Show cancellation email'}
                          </button>
                          {showEmails[cancel.name] && (
                            <div className={`border-2 rounded-xl p-4 ${c.emailBox}`}>
                              <div className="flex items-center justify-between mb-2">
                                <div className={`text-xs font-semibold uppercase tracking-wider ${c.accent}`}>Email Template</div>
                                <button
                                  onClick={() => copyEmail(cancel.name, cancel.cancellation_email)}
                                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${c.btnPrimary}`}
                                >
                                  {copiedEmails[cancel.name] ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                  {copiedEmails[cancel.name] ? 'Copied!' : 'Copy Email'}
                                </button>
                              </div>
                              <pre className={`text-sm whitespace-pre-wrap font-sans ${c.textSecondary}`}>{cancel.cancellation_email}</pre>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Guilt-free framing */}
                      {cancel.guilt_free_framing && (
                        <div className={`rounded-xl p-3 border ${c.guiltFree}`}>
                          <p className={`text-sm ${isDark ? 'text-emerald-300' : 'text-emerald-800'}`}>
                            💚 {cancel.guilt_free_framing}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Keep These ── */}
            {results.keep_these && results.keep_these.length > 0 && (
              <div className={`${c.card} border rounded-2xl shadow-sm p-6`}>
                <h3 className={`text-lg font-bold ${isDark ? 'text-emerald-300' : 'text-emerald-800'} mb-4`}>✅ Worth Keeping</h3>
                <div className="space-y-3">
                  {results.keep_these.map((keep, idx) => (
                    <div key={idx} className={`border-l-4 rounded-r-xl p-4 ${isDark ? 'border-emerald-500 bg-emerald-900/20' : 'border-emerald-500 bg-emerald-50'}`}>
                      <div className={`font-bold ${c.text}`}>{keep.name}</div>
                      <p className={`text-sm mt-1 ${c.textSecondary}`}>{keep.why}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Permission Statements ── */}
            {results.permission_statements && results.permission_statements.length > 0 && (
              <div className={`border-2 rounded-2xl p-6 ${c.permissionBox}`}>
                <h3 className={`text-lg font-bold mb-3 ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>
                  💙 Permission to Cancel
                </h3>
                <div className="space-y-2">
                  {results.permission_statements.map((statement, idx) => (
                    <p key={idx} className={`text-sm ${isDark ? 'text-blue-200' : 'text-blue-700'}`}>
                      • {statement}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* ── Action Bar ── */}
            <div className={`${c.card} border rounded-2xl shadow-sm p-4 flex flex-wrap items-center gap-3 justify-center`}>
              <button onClick={exportCSV} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${c.btnSecondary}`}>
                <Download className="w-4 h-4" /> Export as CSV
              </button>
              <button onClick={copyAllEmails} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${c.btnSecondary}`}>
                <Copy className="w-4 h-4" /> Copy All Cancellation Scripts
              </button>
              <button
                onClick={() => {
                  setResults(null);
                  setSubscriptions([{ name: '', monthlyCost: '', usage: '', category: '' }]);
                  setPastedText('');
                  setUploadedFileName('');
                  setParsedTransactions(null);
                  setError('');
                }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${c.btnSecondary}`}
              >
                <Trash2 className="w-4 h-4" /> Start Over
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionGuiltTrip;
