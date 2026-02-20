import React, { useState, useRef } from 'react';
import { AlertTriangle, Shield, FileText, Upload, Loader2, CheckCircle, AlertCircle, Info, X, RefreshCw, Scale, MessageSquare, Building, ChevronDown, ChevronUp, ChevronLeft, DollarSign, Gavel, Users } from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';
import { getToolById } from '../data/tools';

const LeaseTrapDetector = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { callToolEndpoint, loading } = useClaudeAPI();
  const toolData = getToolById('LeaseTrapDetector');
  const fileInputRef = useRef(null);

  // State
  const [inputMethod, setInputMethod] = useState('text'); // text | file
  const [leaseText, setLeaseText] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileBase64, setFileBase64] = useState(null);
  const [location, setLocation] = useState('');
  const [leaseType, setLeaseType] = useState('');
  const [concerns, setConcerns] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [expandedSections, setExpandedSections] = useState({});

  // Theme colors
  const c = {
    card: isDark ? 'bg-zinc-800' : 'bg-white',
    cardAlt: isDark ? 'bg-zinc-700/50' : 'bg-orange-50/50',
    text: isDark ? 'text-zinc-50' : 'text-gray-900',
    textSecondary: isDark ? 'text-zinc-300' : 'text-gray-600',
    textMuted: isDark ? 'text-zinc-500' : 'text-gray-500',
    input: isDark ? 'bg-zinc-700 border-zinc-600 text-zinc-100' : 'bg-white border-stone-300 text-gray-900',
    btnPrimary: isDark ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'bg-orange-600 hover:bg-orange-700 text-white',
    btnSecondary: isDark ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-100' : 'bg-stone-100 hover:bg-stone-200 text-gray-700',
  };

  const toggleSection = (key) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Handle file upload â€” read PDF as base64 on the client
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File too large. Maximum size is 10MB');
      return;
    }

    setError('');

    const reader = new FileReader();
    reader.onerror = () => setError('Failed to read file');
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      setUploadedFile(file);
      setFileBase64(dataUrl);
      console.log(`[LeaseTrapDetector] PDF loaded: ${file.name}, ${Math.round(file.size / 1024)}KB`);
    };
    reader.readAsDataURL(file);
  };

  // Remove uploaded file
  const removeFile = () => {
    setUploadedFile(null);
    setFileBase64(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Analyze lease
  const analyzeLease = async () => {
    if (inputMethod === 'text' && !leaseText.trim()) {
      setError('Please enter lease text');
      return;
    }
    if (inputMethod === 'file' && !fileBase64) {
      setError('Please upload a PDF file');
      return;
    }
    if (!location.trim()) {
      setError('Please enter your location (city and state)');
      return;
    }
    if (!leaseType) {
      setError('Please select lease type');
      return;
    }

    setError('');
    setResults(null);
    setExpandedSections({});

    try {
      const data = await callToolEndpoint('lease-trap-detector', {
        leaseText: inputMethod === 'text' ? leaseText.trim() : null,
        pdfBase64: inputMethod === 'file' ? fileBase64 : null,
        location: location.trim(),
        leaseType,
        concerns: concerns.trim(),
      });

      setResults(data);
    } catch (err) {
      console.error('[LeaseTrapDetector] Error:', err);
      setError(err.message || 'Failed to analyze lease');
    }
  };

  // Reset tool
  const reset = () => {
    setLeaseText('');
    setUploadedFile(null);
    setFileBase64(null);
    setLocation('');
    setLeaseType('');
    setConcerns('');
    setResults(null);
    setError('');
    setExpandedSections({});
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Negotiability badge
  const getNegotiabilityBadge = (neg) => {
    if (!neg) return null;
    const n = neg.toLowerCase();
    if (n.includes('likely negotiable')) return { label: 'Likely Negotiable', color: isDark ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-700' };
    if (n.includes('possible')) return { label: 'Possible w/ Leverage', color: isDark ? 'bg-amber-900/40 text-amber-300' : 'bg-amber-100 text-amber-700' };
    return { label: 'Non-Negotiable', color: isDark ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-700' };
  };

  // Resource type badge
  const getResourceBadge = (type) => {
    if (!type) return { color: isDark ? 'bg-zinc-700 text-zinc-300' : 'bg-stone-100 text-gray-600' };
    const t = type.toLowerCase();
    if (t.includes('legal')) return { color: isDark ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-700' };
    if (t.includes('tenant')) return { color: isDark ? 'bg-purple-900/40 text-purple-300' : 'bg-purple-100 text-purple-700' };
    if (t.includes('housing')) return { color: isDark ? 'bg-orange-900/40 text-orange-300' : 'bg-orange-100 text-orange-700' };
    if (t.includes('mediation')) return { color: isDark ? 'bg-teal-900/40 text-teal-300' : 'bg-teal-100 text-teal-700' };
    if (t.includes('emergency')) return { color: isDark ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-700' };
    return { color: isDark ? 'bg-zinc-700 text-zinc-300' : 'bg-stone-100 text-gray-600' };
  };

  return (
    <div>
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div>
            <h2 className={`text-2xl font-bold ${c.text}`}>{toolData?.title || 'Lease Trap Detector'} {toolData?.icon || '🏠'}</h2>
            <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>{toolData?.tagline || 'Find predatory clauses in your lease'}</p>
          </div>
        </div>

        {/* INPUT VIEW */}
        {!results && (
          <div className="space-y-6">
            
            {/* Input Method Selection */}
            <div className={`${c.card} rounded-xl shadow-lg p-6`}>
              <h3 className={`font-bold ${c.text} mb-4`}>How would you like to provide your lease?</h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => { setInputMethod('text'); setUploadedFile(null); setFileBase64(null); }}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    inputMethod === 'text'
                      ? 'border-orange-600 bg-orange-50 dark:bg-orange-900/20'
                      : 'border-stone-300 dark:border-zinc-600'
                  }`}
                >
                  <FileText className={`w-8 h-8 mx-auto mb-3 ${inputMethod === 'text' ? 'text-orange-600' : c.textMuted}`} />
                  <p className={`font-semibold ${c.text}`}>Paste Text</p>
                  <p className={`text-sm ${c.textMuted} mt-1`}>Copy and paste lease text</p>
                </button>
                
                <button
                  onClick={() => { setInputMethod('file'); setLeaseText(''); }}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    inputMethod === 'file'
                      ? 'border-orange-600 bg-orange-50 dark:bg-orange-900/20'
                      : 'border-stone-300 dark:border-zinc-600'
                  }`}
                >
                  <Upload className={`w-8 h-8 mx-auto mb-3 ${inputMethod === 'file' ? 'text-orange-600' : c.textMuted}`} />
                  <p className={`font-semibold ${c.text}`}>Upload PDF</p>
                  <p className={`text-sm ${c.textMuted} mt-1`}>Upload lease PDF file</p>
                </button>
              </div>
            </div>

            {/* Lease Input */}
            <div className={`${c.card} rounded-xl shadow-lg p-6`}>
              {inputMethod === 'text' ? (
                <>
                  <label className={`block font-semibold ${c.text} mb-2`}>Paste your lease text</label>
                  <textarea
                    value={leaseText}
                    onChange={(e) => setLeaseText(e.target.value)}
                    placeholder="Paste the full text of your lease agreement here..."
                    rows={10}
                    className={`w-full p-4 border rounded-xl outline-none text-sm resize-y focus:ring-2 focus:ring-orange-300 ${c.input}`}
                  />
                  <p className={`text-xs ${c.textMuted} mt-2`}>The more text you include, the more comprehensive the analysis</p>
                </>
              ) : (
                <>
                  <label className={`block font-semibold ${c.text} mb-2`}>Upload lease PDF</label>
                  {!uploadedFile ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                        isDark ? 'border-zinc-600 hover:border-orange-500 hover:bg-zinc-700/50' : 'border-stone-300 hover:border-orange-400 hover:bg-orange-50'
                      }`}
                    >
                      <Upload className={`w-12 h-12 mx-auto mb-3 ${c.textMuted}`} />
                      <p className={`font-medium ${c.text} mb-1`}>Click to upload or drag and drop</p>
                      <p className={`text-sm ${c.textMuted}`}>PDF files only, max 10MB</p>
                    </div>
                  ) : (
                    <div className={`flex items-center justify-between p-4 rounded-xl border ${isDark ? 'bg-zinc-700 border-zinc-600' : 'bg-green-50 border-green-200'}`}>
                      <div className="flex items-center gap-3">
                        <FileText className={`w-8 h-8 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                        <div>
                          <p className={`font-semibold ${c.text}`}>{uploadedFile.name}</p>
                          <p className={`text-xs ${c.textMuted}`}>{(uploadedFile.size / 1024).toFixed(1)} KB â€” Ready for analysis</p>
                        </div>
                      </div>
                      <button onClick={removeFile} className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                        <X className="w-5 h-5 text-red-500" />
                      </button>
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" accept="application/pdf" onChange={handleFileUpload} className="hidden" />
                </>
              )}
            </div>

            {/* Location, Type, Concerns */}
            <div className={`${c.card} rounded-xl shadow-lg p-6 space-y-4`}>
              <div>
                <label className={`block font-semibold ${c.text} mb-2`}>Location <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City and State (e.g., Austin, Texas)"
                  className={`w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-orange-300 ${c.input}`}
                />
                <p className={`text-xs ${c.textMuted} mt-1`}>Used to check against local tenant protection laws and statutes</p>
              </div>

              <div>
                <label className={`block font-semibold ${c.text} mb-2`}>Lease Type <span className="text-red-500">*</span></label>
                <select
                  value={leaseType}
                  onChange={(e) => setLeaseType(e.target.value)}
                  className={`w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-orange-300 ${c.input}`}
                >
                  <option value="">Select lease type</option>
                  <option value="residential">Residential Apartment</option>
                  <option value="house">House Rental</option>
                  <option value="room">Room Rental</option>
                  <option value="commercial">Commercial</option>
                  <option value="sublease">Sublease</option>
                </select>
              </div>

              <div>
                <label className={`block font-semibold ${c.text} mb-2`}>Specific Concerns (optional)</label>
                <textarea
                  value={concerns}
                  onChange={(e) => setConcerns(e.target.value)}
                  placeholder="Anything you're worried about? e.g., pet deposit seems too high, maintenance clause is vague..."
                  rows={3}
                  className={`w-full p-3 border rounded-xl outline-none text-sm resize-y focus:ring-2 focus:ring-orange-300 ${c.input}`}
                />
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={analyzeLease}
              disabled={loading}
              className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2 shadow-lg ${
                loading ? (isDark ? 'bg-zinc-700 text-zinc-400' : 'bg-stone-200 text-zinc-400') : c.btnPrimary
              }`}
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing lease{inputMethod === 'file' ? ' PDF' : ''}...</>
              ) : (
                <><Shield className="w-5 h-5" /> Analyze My Lease</>
              )}
            </button>

            {error && (
              <div className={`p-4 rounded-xl flex items-start gap-3 ${isDark ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
                <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                <p className={`text-sm ${isDark ? 'text-red-300' : 'text-red-800'}`}>{error}</p>
              </div>
            )}

            {/* Disclaimer */}
            <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-zinc-800/50' : 'bg-stone-50'}`}>
              <p className={`text-xs ${c.textMuted}`}>
                âš–ï¸ This tool provides general guidance, not legal advice. Consult a local tenant rights attorney for specific legal questions.
                Your lease text is not stored and is only used for analysis.
              </p>
            </div>
          </div>
        )}

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• RESULTS VIEW â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        {results && (
          <div className="space-y-6">
            
            {/* Back to input + Start Over */}
            <div className={`${c.card} rounded-xl shadow-lg p-4 flex items-center justify-between`}>
              <button
                onClick={reset}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${isDark ? 'text-orange-400 hover:bg-zinc-700' : 'text-orange-600 hover:bg-orange-50'}`}
              >
                <ChevronLeft className="w-4 h-4" /> Back to Lease Input
              </button>
              <button
                onClick={reset}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${c.btnSecondary}`}
              >
                <RefreshCw className="w-4 h-4" /> Analyze Another Lease
              </button>
            </div>

            {/* â”€â”€ Overall Assessment â”€â”€ */}
            {results.overall_assessment && (
              <div className={`${c.card} rounded-xl shadow-lg p-6 border-l-4 ${
                results.overall_assessment.risk_level === 'high' ? 'border-red-500' :
                results.overall_assessment.risk_level === 'medium' ? 'border-yellow-500' : 'border-green-500'
              }`}>
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${
                    results.overall_assessment.risk_level === 'high' ? 'bg-red-100 dark:bg-red-900/30' :
                    results.overall_assessment.risk_level === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-green-100 dark:bg-green-900/30'
                  }`}>
                    {results.overall_assessment.risk_level === 'high' ? (
                      <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
                    ) : results.overall_assessment.risk_level === 'medium' ? (
                      <Info className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                    ) : (
                      <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h2 className={`text-2xl font-bold ${c.text} mb-1`}>
                      {results.overall_assessment.risk_level === 'high' ? 'ðŸš¨ High Risk' :
                       results.overall_assessment.risk_level === 'medium' ? 'âš ï¸ Medium Risk' : 'âœ… Low Risk'}
                    </h2>
                    <p className={`text-sm ${c.textSecondary} mb-2`}>
                      {results.overall_assessment.major_concerns_count} major concern{results.overall_assessment.major_concerns_count !== 1 ? 's' : ''} found
                    </p>
                    <p className={c.text}>{results.overall_assessment.recommendation}</p>

                    {/* Jurisdiction badges */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {results.overall_assessment.jurisdiction_type && (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                          results.overall_assessment.jurisdiction_type.includes('tenant') 
                            ? (isDark ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-700')
                            : results.overall_assessment.jurisdiction_type.includes('landlord')
                            ? (isDark ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-700')
                            : (isDark ? 'bg-zinc-700 text-zinc-300' : 'bg-stone-100 text-gray-600')
                        }`}>
                          <Scale className="w-3 h-3" />
                          {results.overall_assessment.jurisdiction_type} jurisdiction
                        </span>
                      )}
                      {results.overall_assessment.rent_control_applicable && (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${isDark ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                          <Building className="w-3 h-3" /> Rent Control Applies
                        </span>
                      )}
                    </div>
                    {results.overall_assessment.rent_control_details && (
                      <p className={`text-sm mt-2 ${c.textSecondary}`}>{results.overall_assessment.rent_control_details}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* â”€â”€ Security Deposit Analysis â”€â”€ */}
            {results.security_deposit_analysis && (
              <div className={`${c.card} rounded-xl shadow-lg p-6`}>
                <h2 className={`text-2xl font-bold ${c.text} mb-4 flex items-center gap-2`}>
                  <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                  Security Deposit Analysis
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className={`p-4 rounded-lg ${c.cardAlt}`}>
                    <p className={`text-xs font-bold ${c.textMuted} mb-1`}>LEASE CHARGES</p>
                    <p className={`text-lg font-bold ${c.text}`}>{results.security_deposit_analysis.lease_deposit_amount || 'Not specified'}</p>
                  </div>
                  <div className={`p-4 rounded-lg ${results.security_deposit_analysis.is_over_limit
                    ? (isDark ? 'bg-red-900/20 border border-red-700' : 'bg-red-50 border border-red-200')
                    : (isDark ? 'bg-green-900/20 border border-green-700' : 'bg-green-50 border border-green-200')
                  }`}>
                    <p className={`text-xs font-bold ${c.textMuted} mb-1`}>LEGAL MAXIMUM</p>
                    <p className={`text-lg font-bold ${c.text}`}>{results.security_deposit_analysis.legal_maximum || 'N/A'}</p>
                    {results.security_deposit_analysis.is_over_limit && (
                      <p className="text-xs font-bold text-red-600 dark:text-red-400 mt-1">âš ï¸ OVER LEGAL LIMIT</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  <div className={`p-3 rounded-lg ${c.cardAlt}`}>
                    <p className={`text-xs font-bold ${c.textMuted} mb-1`}>RETURN TIMELINE</p>
                    <p className={`text-sm font-semibold ${c.text}`}>{results.security_deposit_analysis.return_timeline_days} days</p>
                    <p className={`text-xs ${c.textMuted}`}>{results.security_deposit_analysis.return_timeline_law}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${c.cardAlt}`}>
                    <p className={`text-xs font-bold ${c.textMuted} mb-1`}>INTEREST REQUIRED</p>
                    <p className={`text-sm font-semibold ${c.text}`}>{results.security_deposit_analysis.interest_required ? 'Yes' : 'No'}</p>
                    {results.security_deposit_analysis.interest_details && (
                      <p className={`text-xs ${c.textMuted}`}>{results.security_deposit_analysis.interest_details}</p>
                    )}
                  </div>
                  <div className={`p-3 rounded-lg ${c.cardAlt}`}>
                    <p className={`text-xs font-bold ${c.textMuted} mb-1`}>WALKTHROUGH REQUIRED</p>
                    <p className={`text-sm font-semibold ${c.text}`}>{results.security_deposit_analysis.walkthrough_required ? 'Yes' : 'No'}</p>
                    {results.security_deposit_analysis.walkthrough_details && (
                      <p className={`text-xs ${c.textMuted}`}>{results.security_deposit_analysis.walkthrough_details}</p>
                    )}
                  </div>
                </div>

                {results.security_deposit_analysis.issues_found && results.security_deposit_analysis.issues_found.length > 0 && (
                  <div className={`p-3 rounded-lg ${isDark ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
                    <p className={`text-xs font-bold text-red-700 dark:text-red-400 mb-2`}>ISSUES FOUND:</p>
                    {results.security_deposit_analysis.issues_found.map((issue, i) => (
                      <p key={i} className={`text-sm ${isDark ? 'text-red-300' : 'text-red-800'} mb-1`}>â€¢ {issue}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* â”€â”€ Red Flags â”€â”€ */}
            {results.red_flags && results.red_flags.length > 0 && (
              <div className={`${c.card} rounded-xl shadow-lg p-6`}>
                <h2 className={`text-2xl font-bold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2`}>
                  <AlertTriangle className="w-6 h-6" />
                  Red Flags ({results.red_flags.length})
                </h2>
                <div className="space-y-6">
                  {results.red_flags.map((flag, idx) => (
                    <div key={idx} className="border-l-4 border-red-500 pl-4">
                      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 mb-3">
                        {flag.lease_reference && (
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-mono font-bold mb-2 ${isDark ? 'bg-red-800/50 text-red-300' : 'bg-red-200 text-red-800'}`}>
                            ðŸ“Œ {flag.lease_reference}
                          </span>
                        )}
                        <p className={`text-sm font-mono ${c.text}`}>"{flag.clause_text}"</p>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <p className={`font-bold text-red-700 dark:text-red-400 mb-1`}>âš ï¸ {flag.concern}</p>
                          {flag.negotiability && getNegotiabilityBadge(flag.negotiability) && (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getNegotiabilityBadge(flag.negotiability).color}`}>
                              {getNegotiabilityBadge(flag.negotiability).label}
                            </span>
                          )}
                        </div>
                        <p className={`text-sm ${c.textSecondary}`}>{flag.why_problematic}</p>

                        {/* Lease Says vs Law Says */}
                        {(flag.what_lease_says || flag.what_law_says) && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {flag.what_lease_says && (
                              <div className={`p-3 rounded-lg ${isDark ? 'bg-red-900/20' : 'bg-red-50'}`}>
                                <p className={`text-xs font-bold text-red-700 dark:text-red-400 mb-1`}>ðŸ“„ LEASE SAYS:</p>
                                <p className={`text-sm ${c.textSecondary}`}>{flag.what_lease_says}</p>
                              </div>
                            )}
                            {flag.what_law_says && (
                              <div className={`p-3 rounded-lg ${isDark ? 'bg-green-900/20' : 'bg-green-50'}`}>
                                <p className={`text-xs font-bold text-green-700 dark:text-green-400 mb-1`}>âš–ï¸ LAW SAYS:</p>
                                <p className={`text-sm ${c.textSecondary}`}>{flag.what_law_says}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {flag.specific_law && (
                          <div className={`p-3 rounded-lg ${isDark ? 'bg-zinc-700' : 'bg-stone-50'}`}>
                            <p className={`text-xs font-bold ${c.textMuted} mb-1`}>LEGAL STATUS: {flag.legal_status}</p>
                            <p className={`text-sm font-mono ${c.text}`}>{flag.specific_law}</p>
                          </div>
                        )}

                        <div className={`p-3 rounded-lg ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                          <p className={`text-xs font-bold text-blue-700 dark:text-blue-400 mb-1`}>YOUR RIGHTS:</p>
                          <p className={`text-sm ${c.textSecondary}`}>{flag.your_rights}</p>
                        </div>

                        {/* Landlord Response Prediction */}
                        {flag.landlord_likely_response && (
                          <div className={`p-3 rounded-lg ${isDark ? 'bg-amber-900/20' : 'bg-amber-50'}`}>
                            <p className={`text-xs font-bold text-amber-700 dark:text-amber-400 mb-1`}>ðŸ  LANDLORD WILL LIKELY SAY:</p>
                            <p className={`text-sm ${c.textSecondary} italic`}>"{flag.landlord_likely_response}"</p>
                          </div>
                        )}

                        {flag.negotiation_script && (
                          <div className={`p-3 rounded-lg ${isDark ? 'bg-green-900/20' : 'bg-green-50'}`}>
                            <p className={`text-xs font-bold text-green-700 dark:text-green-400 mb-1`}>ðŸ’¬ YOUR SCRIPT:</p>
                            <p className={`text-sm ${c.textSecondary}`}>{flag.negotiation_script}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* â”€â”€ Yellow Flags â”€â”€ */}
            {results.yellow_flags && results.yellow_flags.length > 0 && (
              <div className={`${c.card} rounded-xl shadow-lg p-6`}>
                <h2 className={`text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-4 flex items-center gap-2`}>
                  <Info className="w-6 h-6" />
                  Yellow Flags ({results.yellow_flags.length})
                </h2>
                <div className="space-y-4">
                  {results.yellow_flags.map((flag, idx) => (
                    <div key={idx} className="border-l-4 border-yellow-500 pl-4">
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 mb-3">
                        {flag.lease_reference && (
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-mono font-bold mb-2 ${isDark ? 'bg-yellow-800/50 text-yellow-300' : 'bg-yellow-200 text-yellow-800'}`}>
                            ðŸ“Œ {flag.lease_reference}
                          </span>
                        )}
                        <p className={`text-sm font-mono ${c.text}`}>"{flag.clause_text}"</p>
                      </div>
                      <div className="flex items-start justify-between mb-2">
                        <p className={`font-semibold ${c.text}`}>{flag.concern}</p>
                        {flag.negotiability && getNegotiabilityBadge(flag.negotiability) && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getNegotiabilityBadge(flag.negotiability).color}`}>
                            {getNegotiabilityBadge(flag.negotiability).label}
                          </span>
                        )}
                      </div>
                      {flag.why_concerning && <p className={`text-sm ${c.textSecondary} mb-2`}>{flag.why_concerning}</p>}
                      <div className={`p-3 rounded-lg ${isDark ? 'bg-zinc-700' : 'bg-stone-50'} mb-2`}>
                        <p className={`text-xs font-bold ${c.textMuted} mb-2`}>QUESTIONS TO ASK:</p>
                        {flag.questions_to_ask?.map((q, qidx) => (
                          <p key={qidx} className={`text-sm ${c.textSecondary} mb-1`}>â€¢ {q}</p>
                        ))}
                      </div>
                      {flag.landlord_likely_response && (
                        <div className={`p-3 rounded-lg ${isDark ? 'bg-amber-900/20' : 'bg-amber-50'}`}>
                          <p className={`text-xs font-bold text-amber-700 dark:text-amber-400 mb-1`}>ðŸ  EXPECTED RESPONSE:</p>
                          <p className={`text-sm ${c.textSecondary} italic`}>{flag.landlord_likely_response}</p>
                        </div>
                      )}
                      {flag.what_to_watch_for && (
                        <p className={`text-xs mt-2 ${c.textMuted}`}>ðŸ‘ï¸ Watch for: {flag.what_to_watch_for}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* â”€â”€ Unenforceable Clauses â”€â”€ */}
            {results.unenforceable_clauses && results.unenforceable_clauses.length > 0 && (
              <div className={`${c.card} rounded-xl shadow-lg p-6`}>
                <h2 className={`text-2xl font-bold text-purple-600 dark:text-purple-400 mb-4 flex items-center gap-2`}>
                  <Gavel className="w-6 h-6" />
                  Unenforceable Clauses ({results.unenforceable_clauses.length})
                </h2>
                <p className={`text-sm ${c.textSecondary} mb-4`}>
                  These clauses cannot be enforced even if you sign the lease. Knowing this gives you power.
                </p>
                <div className="space-y-4">
                  {results.unenforceable_clauses.map((clause, idx) => (
                    <div key={idx} className={`border-l-4 border-purple-500 pl-4 ${c.cardAlt} rounded-lg p-4`}>
                      {clause.lease_reference && (
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-mono font-bold mb-2 ${isDark ? 'bg-purple-800/50 text-purple-300' : 'bg-purple-200 text-purple-800'}`}>
                          ðŸ“Œ {clause.lease_reference}
                        </span>
                      )}
                      <p className={`text-sm font-mono ${c.textSecondary} mb-2`}>"{clause.clause_text}"</p>
                      <p className={`text-sm font-bold text-purple-700 dark:text-purple-400 mb-1`}>
                        âš–ï¸ {clause.specific_law}
                      </p>
                      <p className={`text-sm ${c.textSecondary} mb-2`}>{clause.explanation}</p>
                      <div className={`p-2 rounded ${isDark ? 'bg-zinc-700' : 'bg-white'}`}>
                        <p className={`text-xs font-bold ${c.textMuted}`}>What to do:</p>
                        <p className={`text-sm ${c.text}`}>{clause.practical_advice}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* â”€â”€ Green Flags â”€â”€ */}
            {results.green_flags && results.green_flags.length > 0 && (
              <div className={`${c.card} rounded-xl shadow-lg p-6`}>
                <h2 className={`text-2xl font-bold text-green-600 dark:text-green-400 mb-4 flex items-center gap-2`}>
                  <CheckCircle className="w-6 h-6" />
                  Green Flags ({results.green_flags.length})
                </h2>
                <div className="space-y-3">
                  {results.green_flags.map((flag, idx) => (
                    <div key={idx} className={`${c.cardAlt} rounded-lg p-4 border-l-4 border-green-500`}>
                      {flag.lease_reference && (
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-mono font-bold mb-2 ${isDark ? 'bg-green-800/50 text-green-300' : 'bg-green-200 text-green-800'}`}>
                          ðŸ“Œ {flag.lease_reference}
                        </span>
                      )}
                      <p className={`text-sm font-mono ${c.textSecondary} mb-2`}>"{flag.clause_text}"</p>
                      <p className={`text-sm ${c.text}`}>âœ“ {flag.why_good}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* â”€â”€ Missing Disclosures â”€â”€ */}
            {results.missing_disclosures && results.missing_disclosures.length > 0 && (
              <div className={`${c.card} rounded-xl shadow-lg p-6`}>
                <h2 className={`text-2xl font-bold ${c.text} mb-4`}>âš ï¸ Missing Required Disclosures</h2>
                <div className="space-y-3">
                  {results.missing_disclosures.map((disc, idx) => (
                    <div key={idx} className={`p-4 rounded-lg border-l-4 border-orange-500 ${isDark ? 'bg-orange-900/20' : 'bg-orange-50'}`}>
                      <p className={`font-bold ${c.text} mb-1`}>{disc.disclosure}</p>
                      <p className={`text-sm font-mono ${c.textMuted} mb-1`}>{disc.legal_requirement}</p>
                      <p className={`text-sm ${isDark ? 'text-orange-300' : 'text-orange-800'}`}>
                        <strong>If missing:</strong> {disc.consequence_if_missing}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* â”€â”€ Missing Protections â”€â”€ */}
            {results.missing_protections && results.missing_protections.length > 0 && (
              <div className={`${c.card} rounded-xl shadow-lg p-6`}>
                <h2 className={`text-2xl font-bold ${c.text} mb-4`}>Missing Protections</h2>
                <div className="space-y-3">
                  {results.missing_protections.map((protection, idx) => (
                    <div key={idx} className={`${c.cardAlt} rounded-lg p-4`}>
                      <div className="flex items-start justify-between mb-2">
                        <p className={`font-bold ${c.text}`}>{protection.protection}</p>
                        {protection.legal_requirement && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            protection.legal_requirement.toLowerCase().includes('required')
                              ? (isDark ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-700')
                              : (isDark ? 'bg-zinc-700 text-zinc-300' : 'bg-stone-100 text-gray-600')
                          }`}>
                            {protection.legal_requirement}
                          </span>
                        )}
                      </div>
                      <p className={`text-sm ${c.textSecondary} mb-2`}>{protection.why_important}</p>
                      <div className={`p-2 rounded ${isDark ? 'bg-zinc-700' : 'bg-white'}`}>
                        <p className={`text-xs font-bold ${c.textMuted}`}>How to add:</p>
                        <p className={`text-sm ${c.text}`}>{protection.how_to_add}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* â”€â”€ Unusual Fees â”€â”€ */}
            {results.unusual_fees && results.unusual_fees.length > 0 && (
              <div className={`${c.card} rounded-xl shadow-lg p-6`}>
                <h2 className={`text-2xl font-bold ${c.text} mb-4`}>Unusual Fees</h2>
                <div className="space-y-3">
                  {results.unusual_fees.map((fee, idx) => (
                    <div key={idx} className={`${c.cardAlt} rounded-lg p-4`}>
                      {fee.lease_reference && (
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-mono font-bold mb-2 ${isDark ? 'bg-gray-600 text-zinc-300' : 'bg-stone-200 text-gray-700'}`}>
                          ðŸ“Œ {fee.lease_reference}
                        </span>
                      )}
                      <div className="flex items-start justify-between mb-2">
                        <p className={`font-bold ${c.text}`}>{fee.fee_name}</p>
                        <p className={`text-lg font-bold ${c.text}`}>{fee.amount}</p>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div>
                          <p className={`text-xs ${c.textMuted}`}>Typical?</p>
                          <p className={`text-sm font-semibold ${fee.is_typical ? 'text-green-600' : 'text-red-600'}`}>
                            {fee.is_typical ? 'Yes' : 'No'}
                          </p>
                        </div>
                        <div>
                          <p className={`text-xs ${c.textMuted}`}>Legal?</p>
                          <p className={`text-sm font-semibold ${c.text}`}>{fee.is_legal}</p>
                        </div>
                        {fee.specific_law && (
                          <div>
                            <p className={`text-xs ${c.textMuted}`}>Law</p>
                            <p className={`text-xs font-mono ${c.text}`}>{fee.specific_law}</p>
                          </div>
                        )}
                      </div>
                      <p className={`text-sm ${c.textSecondary}`}>{fee.negotiation_strategy}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* â”€â”€ Negotiation Strategy â”€â”€ */}
            {results.negotiation_strategy && (
              <div className={`${c.card} rounded-xl shadow-lg p-6 border-l-4 border-blue-500`}>
                <h2 className={`text-2xl font-bold ${c.text} mb-4 flex items-center gap-2`}>
                  <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  Negotiation Strategy
                </h2>

                {results.negotiation_strategy.market_context && (
                  <div className={`p-3 rounded-lg mb-4 ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                    <p className={`text-xs font-bold text-blue-700 dark:text-blue-400 mb-1`}>ðŸ“Š MARKET CONTEXT:</p>
                    <p className={`text-sm ${c.textSecondary}`}>{results.negotiation_strategy.market_context}</p>
                  </div>
                )}

                {results.negotiation_strategy.leverage_points && results.negotiation_strategy.leverage_points.length > 0 && (
                  <div className={`${c.cardAlt} rounded-lg p-4 mb-4`}>
                    <p className={`text-xs font-bold ${c.textMuted} mb-2`}>ðŸ’ª YOUR LEVERAGE POINTS:</p>
                    {results.negotiation_strategy.leverage_points.map((pt, idx) => (
                      <p key={idx} className={`text-sm ${c.textSecondary} mb-1`}>â€¢ {pt}</p>
                    ))}
                  </div>
                )}

                <div className={`${c.cardAlt} rounded-lg p-4 mb-4`}>
                  <p className={`text-xs font-bold ${c.textMuted} mb-2`}>ðŸ“§ OPENING EMAIL:</p>
                  <p className={`text-sm ${c.textSecondary} italic whitespace-pre-line`}>{results.negotiation_strategy.opening_email}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  {results.negotiation_strategy.stand_firm_on && results.negotiation_strategy.stand_firm_on.length > 0 && (
                    <div className={`p-4 rounded-lg ${isDark ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
                      <p className={`text-xs font-bold text-red-700 dark:text-red-400 mb-2`}>ðŸ›‘ STAND FIRM ON:</p>
                      {results.negotiation_strategy.stand_firm_on.map((pt, idx) => (
                        <p key={idx} className={`text-sm ${isDark ? 'text-red-300' : 'text-red-800'} mb-1`}>â€¢ {pt}</p>
                      ))}
                    </div>
                  )}
                  {results.negotiation_strategy.compromise_positions && results.negotiation_strategy.compromise_positions.length > 0 && (
                    <div className={`p-4 rounded-lg ${isDark ? 'bg-green-900/20 border border-green-800' : 'bg-green-50 border border-green-200'}`}>
                      <p className={`text-xs font-bold text-green-700 dark:text-green-400 mb-2`}>ðŸ¤ OK TO COMPROMISE:</p>
                      {results.negotiation_strategy.compromise_positions.map((pt, idx) => (
                        <p key={idx} className={`text-sm ${isDark ? 'text-green-300' : 'text-green-800'} mb-1`}>â€¢ {pt}</p>
                      ))}
                    </div>
                  )}
                </div>

                {results.negotiation_strategy.key_points && results.negotiation_strategy.key_points.length > 0 && (
                  <div className={`${c.cardAlt} rounded-lg p-4 mb-4`}>
                    <p className={`text-xs font-bold ${c.textMuted} mb-2`}>KEY POINTS (priority order):</p>
                    {results.negotiation_strategy.key_points.map((point, idx) => (
                      <p key={idx} className={`text-sm ${c.textSecondary} mb-1`}>{idx + 1}. {point}</p>
                    ))}
                  </div>
                )}

                {/* If-They-Say Scripts */}
                {results.negotiation_strategy.if_they_say_scripts && results.negotiation_strategy.if_they_say_scripts.length > 0 && (
                  <div>
                    <button
                      onClick={() => toggleSection('scripts')}
                      className={`flex items-center gap-2 text-sm font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'} mb-3`}
                    >
                      <MessageSquare className="w-4 h-4" />
                      {expandedSections.scripts ? 'Hide' : 'Show'} Response Scripts ({results.negotiation_strategy.if_they_say_scripts.length})
                      {expandedSections.scripts ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                    {expandedSections.scripts && (
                      <div className="space-y-3">
                        {results.negotiation_strategy.if_they_say_scripts.map((script, idx) => (
                          <div key={idx} className={`rounded-lg overflow-hidden border ${isDark ? 'border-zinc-700' : 'border-gray-200'}`}>
                            <div className={`p-3 ${isDark ? 'bg-red-900/20' : 'bg-red-50'}`}>
                              <p className={`text-xs font-bold text-red-700 dark:text-red-400 mb-1`}>ðŸ  IF LANDLORD SAYS:</p>
                              <p className={`text-sm ${c.textSecondary} italic`}>"{script.landlord_says}"</p>
                            </div>
                            <div className={`p-3 ${isDark ? 'bg-green-900/20' : 'bg-green-50'}`}>
                              <p className={`text-xs font-bold text-green-700 dark:text-green-400 mb-1`}>ðŸ’¬ YOU RESPOND:</p>
                              <p className={`text-sm ${c.textSecondary}`}>{script.you_respond}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* â”€â”€ Local Resources â”€â”€ */}
            {results.resources && results.resources.length > 0 && (
              <div className={`${c.card} rounded-xl shadow-lg p-6`}>
                <h2 className={`text-2xl font-bold ${c.text} mb-4 flex items-center gap-2`}>
                  <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  Local Resources
                </h2>
                <div className="space-y-3">
                  {results.resources.map((resource, idx) => (
                    <div key={idx} className={`${c.cardAlt} rounded-lg p-4`}>
                      <div className="flex items-start justify-between mb-1">
                        <p className={`font-bold ${c.text}`}>{resource.resource}</p>
                        {resource.type && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getResourceBadge(resource.type).color}`}>
                            {resource.type}
                          </span>
                        )}
                      </div>
                      <p className={`text-sm ${c.textSecondary} mb-2`}>{resource.why_useful}</p>
                      {resource.contact && <p className={`text-sm ${c.textMuted}`}>ðŸ“ž {resource.contact}</p>}
                      {resource.notes && <p className={`text-xs ${c.textMuted} mt-1 italic`}>{resource.notes}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Disclaimer */}
            <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-zinc-800/50' : 'bg-stone-50'}`}>
              <p className={`text-xs ${c.textMuted}`}>
                âš–ï¸ This analysis is for informational purposes only and does not constitute legal advice.
                Consult a local tenant rights attorney for specific legal questions.
              </p>
            </div>
          </div>
        )}

    </div>
  );
};

LeaseTrapDetector.displayName = 'LeaseTrapDetector';
export default LeaseTrapDetector;
