import React, { useState } from 'react';
import {
  FileText, Loader2, AlertCircle, Copy, Check, RefreshCw, ChevronDown, ChevronUp,
  Shield, AlertTriangle, Scale, Send, Megaphone, Gavel, Clock, Printer,
  ArrowRight, ExternalLink, CheckCircle, Target, Eye, Clipboard, Zap
} from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';
import { getToolById } from '../data/tools';

const ComplaintEscalationWriter = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { callToolEndpoint, loading } = useClaudeAPI();
  const toolData = getToolById('ComplaintEscalationWriter');

  // Input state
  const [company, setCompany] = useState('');
  const [industry, setIndustry] = useState('auto');
  const [issue, setIssue] = useState('');
  const [previousAttempts, setPreviousAttempts] = useState('');
  const [desiredOutcome, setDesiredOutcome] = useState('');
  const [amountAtStake, setAmountAtStake] = useState('');
  const [hasDocumentation, setHasDocumentation] = useState('');

  // Results state
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [activeStage, setActiveStage] = useState(1);
  const [expandedSections, setExpandedSections] = useState({});
  const [copiedField, setCopiedField] = useState(null);

  // Theme colors
  const c = {
    card: isDark ? 'bg-zinc-800' : 'bg-white',
    cardAlt: isDark ? 'bg-zinc-700/50' : 'bg-slate-50',
    text: isDark ? 'text-zinc-50' : 'text-gray-900',
    textSecondary: isDark ? 'text-zinc-300' : 'text-gray-600',
    textMuted: isDark ? 'text-zinc-500' : 'text-gray-400',
    input: isDark ? 'bg-zinc-700 border-zinc-600 text-zinc-100 placeholder-zinc-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400',
    btnPrimary: isDark ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white',
    btnSecondary: isDark ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-100' : 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    border: isDark ? 'border-zinc-700' : 'border-gray-200',
  };

  const industries = [
    { id: 'auto', label: 'Auto-detect' },
    { id: 'airline', label: 'Airlines' },
    { id: 'telecom', label: 'Telecom / Internet' },
    { id: 'banking', label: 'Banking / Finance' },
    { id: 'insurance', label: 'Insurance' },
    { id: 'retail', label: 'Retail / E-commerce' },
    { id: 'utility', label: 'Utilities' },
    { id: 'healthcare', label: 'Healthcare' },
    { id: 'auto_dealer', label: 'Auto Dealers' },
    { id: 'subscription', label: 'Subscriptions / SaaS' },
    { id: 'contractor', label: 'Contractors / Home Services' },
    { id: 'other', label: 'Other' },
  ];

  const stageConfig = [
    { num: 1, key: 'stage_1_direct', label: 'Direct Complaint', icon: Send, color: 'blue' },
    { num: 2, key: 'stage_2_regulatory', label: 'Regulatory Filing', icon: Shield, color: 'purple' },
    { num: 3, key: 'stage_3_executive', label: 'Executive Escalation', icon: Target, color: 'orange' },
    { num: 4, key: 'stage_4_public', label: 'Public Pressure', icon: Megaphone, color: 'pink' },
    { num: 5, key: 'stage_5_financial_legal', label: 'Legal Remedies', icon: Gavel, color: 'red' },
  ];

  const stageColors = (color, type) => {
    const map = {
      blue: {
        badge: isDark ? 'bg-blue-900/40 text-blue-300 border-blue-700' : 'bg-blue-100 text-blue-700 border-blue-200',
        bg: isDark ? 'bg-blue-900/15' : 'bg-blue-50',
        border: isDark ? 'border-blue-700' : 'border-blue-300',
        accent: isDark ? 'text-blue-400' : 'text-blue-600',
        dot: 'bg-blue-500',
      },
      purple: {
        badge: isDark ? 'bg-purple-900/40 text-purple-300 border-purple-700' : 'bg-purple-100 text-purple-700 border-purple-200',
        bg: isDark ? 'bg-purple-900/15' : 'bg-purple-50',
        border: isDark ? 'border-purple-700' : 'border-purple-300',
        accent: isDark ? 'text-purple-400' : 'text-purple-600',
        dot: 'bg-purple-500',
      },
      orange: {
        badge: isDark ? 'bg-orange-900/40 text-orange-300 border-orange-700' : 'bg-orange-100 text-orange-700 border-orange-200',
        bg: isDark ? 'bg-orange-900/15' : 'bg-orange-50',
        border: isDark ? 'border-orange-700' : 'border-orange-300',
        accent: isDark ? 'text-orange-400' : 'text-orange-600',
        dot: 'bg-orange-500',
      },
      pink: {
        badge: isDark ? 'bg-pink-900/40 text-pink-300 border-pink-700' : 'bg-pink-100 text-pink-700 border-pink-200',
        bg: isDark ? 'bg-pink-900/15' : 'bg-pink-50',
        border: isDark ? 'border-pink-700' : 'border-pink-300',
        accent: isDark ? 'text-pink-400' : 'text-pink-600',
        dot: 'bg-pink-500',
      },
      red: {
        badge: isDark ? 'bg-red-900/40 text-red-300 border-red-700' : 'bg-red-100 text-red-700 border-red-200',
        bg: isDark ? 'bg-red-900/15' : 'bg-red-50',
        border: isDark ? 'border-red-700' : 'border-red-300',
        accent: isDark ? 'text-red-400' : 'text-red-600',
        dot: 'bg-red-500',
      },
    };
    return map[color]?.[type] || '';
  };

  const severityConfig = {
    low: { label: 'Low Severity', color: isDark ? 'text-green-400' : 'text-green-600', bg: isDark ? 'bg-green-900/20' : 'bg-green-50', border: isDark ? 'border-green-700' : 'border-green-200' },
    medium: { label: 'Medium Severity', color: isDark ? 'text-amber-400' : 'text-amber-600', bg: isDark ? 'bg-amber-900/20' : 'bg-amber-50', border: isDark ? 'border-amber-700' : 'border-amber-200' },
    high: { label: 'High Severity', color: isDark ? 'text-orange-400' : 'text-orange-600', bg: isDark ? 'bg-orange-900/20' : 'bg-orange-50', border: isDark ? 'border-orange-700' : 'border-orange-200' },
    critical: { label: 'Critical', color: isDark ? 'text-red-400' : 'text-red-600', bg: isDark ? 'bg-red-900/20' : 'bg-red-50', border: isDark ? 'border-red-700' : 'border-red-200' },
  };

  // Handlers
  const toggleSection = (key) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));

  const copyToClipboard = async (content, field) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) { console.error('Copy failed:', err); }
  };

  const CopyBtn = ({ content, field, label = 'Copy' }) => (
    <button
      onClick={() => copyToClipboard(content, field)}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
        copiedField === field
          ? (isDark ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-700')
          : (isDark ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700')
      }`}
    >
      {copiedField === field ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copiedField === field ? 'Copied' : label}
    </button>
  );

  const handleSubmit = async () => {
    if (!company.trim() || !issue.trim()) {
      setError('Please provide company name and issue description');
      return;
    }
    setError('');
    setResults(null);

    try {
      const data = await callToolEndpoint('complaint-escalation-writer', {
        company: company.trim(),
        industry: industry === 'auto' ? null : industry,
        issue: issue.trim(),
        previousAttempts: previousAttempts.trim() || null,
        desiredOutcome: desiredOutcome.trim() || null,
        amountAtStake: amountAtStake.trim() || null,
        hasDocumentation: hasDocumentation.trim() || null,
      });
      setResults(data);
      setActiveStage(1);
    } catch (err) {
      setError(err.message || 'Failed to build escalation campaign. Please try again.');
    }
  };

  const reset = () => {
    setCompany('');
    setIndustry('auto');
    setIssue('');
    setPreviousAttempts('');
    setDesiredOutcome('');
    setAmountAtStake('');
    setHasDocumentation('');
    setResults(null);
    setError('');
    setActiveStage(1);
    setExpandedSections({});
  };

  const buildFullText = () => {
    if (!results) return '';
    const lines = ['COMPLAINT ESCALATION CAMPAIGN', `Company: ${company}`, ''];
    const sa = results.situation_assessment;
    if (sa) { lines.push(`Severity: ${sa.severity}`, `Legal Strength: ${sa.legal_strength}`, sa.key_insight, ''); }
    const s1 = results.escalation_stages?.stage_1_direct;
    if (s1) { lines.push('═══ STAGE 1: DIRECT COMPLAINT ═══', `Subject: ${s1.subject_line}`, '', s1.letter_body, ''); }
    const s2 = results.escalation_stages?.stage_2_regulatory;
    if (s2) { lines.push('═══ STAGE 2: REGULATORY COMPLAINT ═══', `Agency: ${s2.agency}`, `URL: ${s2.agency_url}`, '', s2.complaint_text, ''); }
    const s3 = results.escalation_stages?.stage_3_executive;
    if (s3) { lines.push('═══ STAGE 3: EXECUTIVE ESCALATION ═══', `Subject: ${s3.subject_line}`, '', s3.letter_body, ''); }
    const s4 = results.escalation_stages?.stage_4_public;
    if (s4) { lines.push('═══ STAGE 4: PUBLIC PRESSURE ═══', s4.social_media_post, '', s4.social_media_long, ''); }
    lines.push('───', 'This is strategic guidance, not legal advice. Consult an attorney for legal questions.');
    return lines.join('\n');
  };

  const handlePrint = () => {
    const content = buildFullText();
    const pw = window.open('', '_blank');
    if (!pw) return;
    pw.document.write(`<!DOCTYPE html><html><head><title>Escalation Campaign — ${company}</title><style>body{font-family:Georgia,serif;max-width:700px;margin:40px auto;padding:0 20px;color:#1a1a1a;line-height:1.6;font-size:14px;}pre{white-space:pre-wrap;word-wrap:break-word;font-family:inherit;margin:0;}@media print{body{margin:20px;}}</style></head><body><pre>${content.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre></body></html>`);
    pw.document.close();
    pw.focus();
    setTimeout(() => pw.print(), 250);
  };

  // ─── RENDER ───
  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div>
          <h2 className={`text-2xl font-bold ${c.text}`}>{toolData?.title || 'Complaint Escalation Writer'} {toolData?.icon || '📝'}</h2>
          <p className={`text-sm ${c.textMuted}`}>{toolData?.tagline || 'Professional escalation campaigns that get results'}</p>
        </div>
      </div>

      {/* ═══════════════ INPUT VIEW ═══════════════ */}
      {!results && (
        <div className="space-y-6">

          {/* Company + Industry */}
          <div className={`${c.card} rounded-xl shadow-lg p-6 space-y-4`}>
            <div>
              <label className={`block font-semibold ${c.text} mb-2`}>Company <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g., Delta Airlines, Comcast, Chase Bank"
                className={`w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-red-300 ${c.input}`}
              />
            </div>
            <div>
              <label className={`block font-semibold ${c.text} mb-2`}>Industry <span className={`text-xs font-normal ${c.textMuted}`}>(helps identify the right regulations)</span></label>
              <div className="flex flex-wrap gap-2">
                {industries.map(ind => (
                  <button
                    key={ind.id}
                    onClick={() => setIndustry(ind.id)}
                    className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                      industry === ind.id
                        ? `border-red-500 ${isDark ? 'bg-red-900/30 text-red-300' : 'bg-red-50 text-red-700'}`
                        : `${isDark ? 'border-zinc-600 text-zinc-300' : 'border-gray-200 text-gray-600'}`
                    }`}
                  >
                    {ind.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Issue Description */}
          <div className={`${c.card} rounded-xl shadow-lg p-6`}>
            <label className={`block font-semibold ${c.text} mb-2`}>What happened? <span className="text-red-500">*</span></label>
            <textarea
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              placeholder="Be specific: dates, amounts, what was promised vs. delivered, names of reps you spoke to, reference/case numbers. The more detail you provide, the stronger your campaign will be."
              rows={6}
              className={`w-full p-4 border rounded-xl outline-none text-sm resize-y focus:ring-2 focus:ring-red-300 ${c.input}`}
            />
          </div>

          {/* Details Grid */}
          <div className={`${c.card} rounded-xl shadow-lg p-6`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-semibold ${c.text} mb-2`}>Previous attempts</label>
                <input
                  type="text"
                  value={previousAttempts}
                  onChange={(e) => setPreviousAttempts(e.target.value)}
                  placeholder="e.g., Called 3 times, chatted, sent email"
                  className={`w-full p-3 border rounded-xl outline-none text-sm focus:ring-2 focus:ring-red-300 ${c.input}`}
                />
              </div>
              <div>
                <label className={`block text-sm font-semibold ${c.text} mb-2`}>Desired outcome</label>
                <input
                  type="text"
                  value={desiredOutcome}
                  onChange={(e) => setDesiredOutcome(e.target.value)}
                  placeholder="e.g., Full refund of $459, service restored"
                  className={`w-full p-3 border rounded-xl outline-none text-sm focus:ring-2 focus:ring-red-300 ${c.input}`}
                />
              </div>
              <div>
                <label className={`block text-sm font-semibold ${c.text} mb-2`}>Amount at stake</label>
                <input
                  type="text"
                  value={amountAtStake}
                  onChange={(e) => setAmountAtStake(e.target.value)}
                  placeholder="e.g., $459, $2,300, ongoing $89/mo"
                  className={`w-full p-3 border rounded-xl outline-none text-sm focus:ring-2 focus:ring-red-300 ${c.input}`}
                />
              </div>
              <div>
                <label className={`block text-sm font-semibold ${c.text} mb-2`}>Documentation you have</label>
                <input
                  type="text"
                  value={hasDocumentation}
                  onChange={(e) => setHasDocumentation(e.target.value)}
                  placeholder="e.g., Screenshots, emails, receipts, chat logs"
                  className={`w-full p-3 border rounded-xl outline-none text-sm focus:ring-2 focus:ring-red-300 ${c.input}`}
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading || !company.trim() || !issue.trim()}
            className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2 shadow-lg ${
              loading ? (isDark ? 'bg-zinc-700 text-zinc-400' : 'bg-gray-200 text-gray-400') : c.btnPrimary
            }`}
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Building your escalation campaign...</>
            ) : (
              <><Zap className="w-5 h-5" /> Build Escalation Campaign</>
            )}
          </button>

          {error && (
            <div className={`p-4 rounded-xl flex items-start gap-3 ${isDark ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
              <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
              <p className={`text-sm ${isDark ? 'text-red-300' : 'text-red-800'}`}>{error}</p>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════ RESULTS VIEW ═══════════════ */}
      {results && (
        <div className="space-y-6">

          {/* Controls Bar */}
          <div className={`${c.card} rounded-xl shadow-lg p-4 flex items-center justify-between flex-wrap gap-3`}>
            <span className={`text-sm font-semibold ${c.text}`}>Escalation Campaign: {company}</span>
            <div className="flex items-center gap-2">
              <CopyBtn content={buildFullText()} field="full-campaign" label="Copy All" />
              <button onClick={handlePrint} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${c.btnSecondary}`}>
                <Printer className="w-3.5 h-3.5" /> Print
              </button>
              <button onClick={reset} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${isDark ? 'bg-red-900/30 text-red-300 hover:bg-red-800/40' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}>
                <RefreshCw className="w-3.5 h-3.5" /> New Complaint
              </button>
            </div>
          </div>

          {/* Situation Assessment */}
          {results.situation_assessment && (() => {
            const sev = severityConfig[results.situation_assessment.severity] || severityConfig.medium;
            return (
              <div className={`${c.card} rounded-xl shadow-lg p-6 border-l-4 ${sev.border}`}>
                <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
                  <div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${sev.bg} ${sev.color} border ${sev.border}`}>
                      {sev.label}
                    </span>
                  </div>
                  <div className="flex gap-3 text-sm">
                    {results.situation_assessment.legal_strength && (
                      <span className={c.textSecondary}>Legal position: <strong className={c.text}>{results.situation_assessment.legal_strength}</strong></span>
                    )}
                    {results.situation_assessment.estimated_resolution_likelihood && (
                      <span className={c.textSecondary}>Success est: <strong className={c.text}>{results.situation_assessment.estimated_resolution_likelihood}</strong></span>
                    )}
                  </div>
                </div>
                <p className={`font-semibold ${c.text} mb-2`}>{results.situation_assessment.key_insight}</p>
                {results.situation_assessment.company_reputation && (
                  <p className={`text-sm ${c.textSecondary}`}>{results.situation_assessment.company_reputation}</p>
                )}
              </div>
            );
          })()}

          {/* Legal Leverage */}
          {results.legal_leverage?.length > 0 && (
            <div className={`${c.card} rounded-xl shadow-lg p-6`}>
              <button onClick={() => toggleSection('legal')} className={`w-full flex items-center justify-between ${c.text}`}>
                <h3 className="font-bold flex items-center gap-2">
                  <Scale className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} /> Your Legal Leverage ({results.legal_leverage.length})
                </h3>
                {expandedSections.legal ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
              {expandedSections.legal && (
                <div className="space-y-3 mt-4">
                  {results.legal_leverage.map((law, idx) => (
                    <div key={idx} className={`p-4 rounded-lg border ${c.border}`}>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className={`font-bold ${c.text} text-sm`}>{law.law_or_regulation}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          law.strength === 'strong' ? (isDark ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-700')
                          : law.strength === 'moderate' ? (isDark ? 'bg-amber-900/40 text-amber-300' : 'bg-amber-100 text-amber-700')
                          : (isDark ? 'bg-zinc-700 text-zinc-400' : 'bg-gray-100 text-gray-500')
                        }`}>{law.strength}</span>
                      </div>
                      <p className={`text-sm ${c.textSecondary} mb-1`}>{law.how_it_applies}</p>
                      <p className={`text-xs ${c.textMuted}`}>Company risk: {law.consequence_for_company}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Evidence Checklist */}
          {results.evidence_checklist?.length > 0 && (
            <div className={`${c.card} rounded-xl shadow-lg p-6`}>
              <button onClick={() => toggleSection('evidence')} className={`w-full flex items-center justify-between ${c.text}`}>
                <h3 className="font-bold flex items-center gap-2">
                  <Clipboard className={`w-5 h-5 ${isDark ? 'text-sky-400' : 'text-sky-600'}`} /> Evidence Checklist ({results.evidence_checklist.length})
                </h3>
                {expandedSections.evidence ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
              {expandedSections.evidence && (
                <div className="space-y-2 mt-4">
                  {results.evidence_checklist.map((item, idx) => (
                    <div key={idx} className={`flex items-start gap-3 p-3 rounded-lg ${c.cardAlt}`}>
                      <input type="checkbox" className={`mt-1 w-4 h-4 rounded ${isDark ? 'accent-sky-500' : 'accent-sky-600'}`} readOnly />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-semibold ${c.text}`}>{item.item}</p>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                            item.priority === 'critical' ? (isDark ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-600')
                            : item.priority === 'important' ? (isDark ? 'bg-amber-900/40 text-amber-300' : 'bg-amber-100 text-amber-600')
                            : (isDark ? 'bg-zinc-700 text-zinc-400' : 'bg-gray-100 text-gray-500')
                          }`}>{item.priority}</span>
                        </div>
                        <p className={`text-xs ${c.textSecondary} mt-0.5`}>{item.how}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── ESCALATION LADDER ── */}
          <div className={`${c.card} rounded-xl shadow-lg p-6`}>
            <h3 className={`font-bold ${c.text} mb-4 flex items-center gap-2`}>
              <Zap className={`w-5 h-5 ${isDark ? 'text-red-400' : 'text-red-600'}`} /> Escalation Ladder
            </h3>
            <p className={`text-sm ${c.textSecondary} mb-5`}>Start at Stage 1. Only move to the next stage if the previous one fails.</p>

            {/* Stage Tabs */}
            <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
              {stageConfig.map(stage => {
                const isActive = activeStage === stage.num;
                const sc = stageColors(stage.color, 'badge');
                return (
                  <button
                    key={stage.num}
                    onClick={() => setActiveStage(stage.num)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap border transition-all ${
                      isActive ? sc : (isDark ? 'border-zinc-700 text-zinc-400 hover:text-zinc-200' : 'border-gray-200 text-gray-500 hover:text-gray-700')
                    }`}
                  >
                    <stage.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{stage.num}.</span> {stage.label}
                  </button>
                );
              })}
            </div>

            {/* Stage 1: Direct Complaint */}
            {activeStage === 1 && results.escalation_stages?.stage_1_direct && (() => {
              const s = results.escalation_stages.stage_1_direct;
              const sc = stageColors('blue', 'bg');
              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className={`font-bold ${c.text}`}>Stage 1: Direct Company Complaint</h4>
                    <CopyBtn content={`Subject: ${s.subject_line}\n\n${s.letter_body}`} field="stage1-letter" label="Copy Letter" />
                  </div>

                  {/* Letter */}
                  <div className={`rounded-xl p-5 border ${isDark ? 'bg-zinc-700/30 border-zinc-600' : 'bg-slate-50 border-gray-200'}`}>
                    <p className={`text-xs font-bold ${c.textMuted} mb-1`}>SUBJECT</p>
                    <p className={`font-semibold ${c.text} mb-4`}>{s.subject_line}</p>
                    <div className={`whitespace-pre-wrap text-sm ${c.textSecondary} leading-relaxed`}>{s.letter_body}</div>
                  </div>

                  {/* Send To */}
                  {s.send_to?.length > 0 && (
                    <div className={`p-4 rounded-lg ${sc}`}>
                      <p className={`text-xs font-bold ${stageColors('blue', 'accent')} mb-2`}>SEND TO</p>
                      {s.send_to.map((r, i) => (
                        <div key={i} className={`text-sm ${c.textSecondary} mb-2`}>
                          <span className={`font-semibold ${c.text}`}>{r.role}</span> — {r.how_to_find}
                          {r.email_pattern && <span className={`ml-1 ${c.textMuted}`}>({r.email_pattern})</span>}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {s.send_via && (
                      <div className={`p-3 rounded-lg ${c.cardAlt}`}>
                        <p className={`text-xs font-bold ${c.textMuted} mb-1`}>SEND VIA</p>
                        <p className={`text-sm ${c.textSecondary}`}>{s.send_via}</p>
                      </div>
                    )}
                    {s.deadline_to_set && (
                      <div className={`p-3 rounded-lg ${c.cardAlt}`}>
                        <p className={`text-xs font-bold ${c.textMuted} mb-1`}>RESPONSE DEADLINE</p>
                        <p className={`text-sm ${c.textSecondary}`}>{s.deadline_to_set}</p>
                      </div>
                    )}
                  </div>

                  {s.leverage_points_used?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {s.leverage_points_used.map((lp, i) => (
                        <span key={i} className={`px-2.5 py-1 rounded-full text-xs font-medium ${stageColors('blue', 'badge')}`}>{lp}</span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Stage 2: Regulatory */}
            {activeStage === 2 && results.escalation_stages?.stage_2_regulatory && (() => {
              const s = results.escalation_stages.stage_2_regulatory;
              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className={`font-bold ${c.text}`}>Stage 2: Regulatory Complaint</h4>
                    <CopyBtn content={s.complaint_text} field="stage2-complaint" label="Copy Complaint" />
                  </div>

                  <div className={`p-4 rounded-xl ${stageColors('purple', 'bg')} border ${stageColors('purple', 'border')}`}>
                    <p className={`text-xs font-bold ${stageColors('purple', 'accent')} mb-1`}>FILE WITH</p>
                    <p className={`font-bold ${c.text} text-lg`}>{s.agency}</p>
                    {s.agency_url && <p className={`text-sm ${stageColors('purple', 'accent')} mt-1`}>{s.agency_url}</p>}
                    <p className={`text-sm ${c.textSecondary} mt-2`}>{s.why_this_agency}</p>
                  </div>

                  <div className={`rounded-xl p-5 border ${isDark ? 'bg-zinc-700/30 border-zinc-600' : 'bg-slate-50 border-gray-200'}`}>
                    <p className={`text-xs font-bold ${c.textMuted} mb-2`}>PRE-WRITTEN COMPLAINT TEXT</p>
                    <div className={`whitespace-pre-wrap text-sm ${c.textSecondary} leading-relaxed`}>{s.complaint_text}</div>
                  </div>

                  {s.what_happens_after && (
                    <div className={`p-4 rounded-lg ${c.cardAlt}`}>
                      <p className={`text-xs font-bold ${c.textMuted} mb-1`}>WHAT HAPPENS AFTER FILING</p>
                      <p className={`text-sm ${c.textSecondary}`}>{s.what_happens_after}</p>
                    </div>
                  )}
                  {s.company_impact && (
                    <div className={`p-4 rounded-lg ${c.cardAlt}`}>
                      <p className={`text-xs font-bold ${c.textMuted} mb-1`}>WHY COMPANIES TAKE THIS SERIOUSLY</p>
                      <p className={`text-sm ${c.textSecondary}`}>{s.company_impact}</p>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Stage 3: Executive */}
            {activeStage === 3 && results.escalation_stages?.stage_3_executive && (() => {
              const s = results.escalation_stages.stage_3_executive;
              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className={`font-bold ${c.text}`}>Stage 3: Executive Escalation</h4>
                    <CopyBtn content={`Subject: ${s.subject_line}\n\n${s.letter_body}`} field="stage3-letter" label="Copy Letter" />
                  </div>

                  <div className={`rounded-xl p-5 border ${isDark ? 'bg-zinc-700/30 border-zinc-600' : 'bg-slate-50 border-gray-200'}`}>
                    <p className={`text-xs font-bold ${c.textMuted} mb-1`}>SUBJECT</p>
                    <p className={`font-semibold ${c.text} mb-4`}>{s.subject_line}</p>
                    <div className={`whitespace-pre-wrap text-sm ${c.textSecondary} leading-relaxed`}>{s.letter_body}</div>
                  </div>

                  {s.target_contacts?.length > 0 && (
                    <div className={`p-4 rounded-lg ${stageColors('orange', 'bg')} border ${stageColors('orange', 'border')}`}>
                      <p className={`text-xs font-bold ${stageColors('orange', 'accent')} mb-2`}>TARGET CONTACTS</p>
                      {s.target_contacts.map((tc, i) => (
                        <div key={i} className={`text-sm ${c.textSecondary} mb-2`}>
                          <span className={`font-semibold ${c.text}`}>{tc.title}</span>
                          {tc.email_pattern && <span className={`ml-2 font-mono text-xs ${c.textMuted}`}>{tc.email_pattern}</span>}
                          {tc.why && <p className={`text-xs ${c.textMuted} mt-0.5`}>{tc.why}</p>}
                        </div>
                      ))}
                    </div>
                  )}

                  {s.timing && (
                    <div className={`p-3 rounded-lg ${c.cardAlt}`}>
                      <p className={`text-xs font-bold ${c.textMuted} mb-1`}>TIMING</p>
                      <p className={`text-sm ${c.textSecondary}`}>{s.timing}</p>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Stage 4: Public Pressure */}
            {activeStage === 4 && results.escalation_stages?.stage_4_public && (() => {
              const s = results.escalation_stages.stage_4_public;
              return (
                <div className="space-y-4">
                  <h4 className={`font-bold ${c.text}`}>Stage 4: Public Pressure Campaign</h4>

                  {/* Short post */}
                  {s.social_media_post && (
                    <div className={`rounded-xl p-5 border ${isDark ? 'bg-zinc-700/30 border-zinc-600' : 'bg-slate-50 border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <p className={`text-xs font-bold ${c.textMuted}`}>X / TWITTER POST</p>
                        <CopyBtn content={s.social_media_post} field="stage4-tweet" label="Copy" />
                      </div>
                      <p className={`text-sm ${c.text} leading-relaxed`}>{s.social_media_post}</p>
                      <p className={`text-xs ${c.textMuted} mt-2`}>{s.social_media_post.length} characters</p>
                    </div>
                  )}

                  {/* Long post */}
                  {s.social_media_long && (
                    <div className={`rounded-xl p-5 border ${isDark ? 'bg-zinc-700/30 border-zinc-600' : 'bg-slate-50 border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <p className={`text-xs font-bold ${c.textMuted}`}>DETAILED POST (Facebook / LinkedIn / Reddit)</p>
                        <CopyBtn content={s.social_media_long} field="stage4-long" label="Copy" />
                      </div>
                      <div className={`whitespace-pre-wrap text-sm ${c.textSecondary} leading-relaxed`}>{s.social_media_long}</div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {s.platforms_to_target?.length > 0 && (
                      <div className={`p-4 rounded-lg ${stageColors('pink', 'bg')} border ${stageColors('pink', 'border')}`}>
                        <p className={`text-xs font-bold ${stageColors('pink', 'accent')} mb-2`}>POST ON</p>
                        {s.platforms_to_target.map((p, i) => <p key={i} className={`text-sm ${c.textSecondary}`}>• {p}</p>)}
                      </div>
                    )}
                    {s.review_sites?.length > 0 && (
                      <div className={`p-4 rounded-lg ${stageColors('pink', 'bg')} border ${stageColors('pink', 'border')}`}>
                        <p className={`text-xs font-bold ${stageColors('pink', 'accent')} mb-2`}>LEAVE REVIEWS ON</p>
                        {s.review_sites.map((r, i) => <p key={i} className={`text-sm ${c.textSecondary}`}>• {r}</p>)}
                      </div>
                    )}
                  </div>

                  {s.hashtags?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {s.hashtags.map((h, i) => (
                        <span key={i} className={`px-2 py-1 rounded-full text-xs font-medium ${stageColors('pink', 'badge')}`}>{h}</span>
                      ))}
                    </div>
                  )}

                  {s.media_tip && (
                    <div className={`p-3 rounded-lg ${c.cardAlt}`}>
                      <p className={`text-xs font-bold ${c.textMuted} mb-1`}>📺 MEDIA TIP</p>
                      <p className={`text-sm ${c.textSecondary}`}>{s.media_tip}</p>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Stage 5: Financial & Legal */}
            {activeStage === 5 && results.escalation_stages?.stage_5_financial_legal && (() => {
              const s = results.escalation_stages.stage_5_financial_legal;
              return (
                <div className="space-y-4">
                  <h4 className={`font-bold ${c.text}`}>Stage 5: Financial & Legal Remedies</h4>

                  {/* Chargeback */}
                  {s.chargeback?.applicable && (
                    <div className={`p-5 rounded-xl border ${stageColors('red', 'border')} ${stageColors('red', 'bg')}`}>
                      <p className={`text-xs font-bold ${stageColors('red', 'accent')} mb-2`}>💳 CREDIT CARD CHARGEBACK</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                        {s.chargeback.reason_code && (
                          <div><p className={`text-xs ${c.textMuted}`}>Reason Code</p><p className={`text-sm font-semibold ${c.text}`}>{s.chargeback.reason_code}</p></div>
                        )}
                        {s.chargeback.time_window && (
                          <div><p className={`text-xs ${c.textMuted}`}>Time Window</p><p className={`text-sm font-semibold ${c.text}`}>{s.chargeback.time_window}</p></div>
                        )}
                      </div>
                      {s.chargeback.how_to_file && <p className={`text-sm ${c.textSecondary} mb-2`}><strong>How to file:</strong> {s.chargeback.how_to_file}</p>}
                      {s.chargeback.documentation_needed && <p className={`text-sm ${c.textSecondary} mb-2`}><strong>Documentation:</strong> {s.chargeback.documentation_needed}</p>}
                      {s.chargeback.success_likelihood && <p className={`text-sm ${c.textSecondary}`}><strong>Likelihood:</strong> {s.chargeback.success_likelihood}</p>}
                    </div>
                  )}

                  {/* Small Claims */}
                  {s.small_claims?.applicable && (
                    <div className={`p-5 rounded-xl border ${c.border} ${c.cardAlt}`}>
                      <p className={`text-xs font-bold ${stageColors('red', 'accent')} mb-2`}>⚖️ SMALL CLAIMS COURT</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                        {s.small_claims.filing_fee_range && (
                          <div><p className={`text-xs ${c.textMuted}`}>Filing Fee</p><p className={`text-sm font-semibold ${c.text}`}>{s.small_claims.filing_fee_range}</p></div>
                        )}
                        {s.small_claims.max_claim_amount && (
                          <div><p className={`text-xs ${c.textMuted}`}>Max Claim</p><p className={`text-sm font-semibold ${c.text}`}>{s.small_claims.max_claim_amount}</p></div>
                        )}
                        {s.small_claims.jurisdiction && (
                          <div><p className={`text-xs ${c.textMuted}`}>Jurisdiction</p><p className={`text-sm font-semibold ${c.text}`}>{s.small_claims.jurisdiction}</p></div>
                        )}
                      </div>
                      {s.small_claims.typical_outcome && <p className={`text-sm ${c.textSecondary} mb-1`}><strong>Typical outcome:</strong> {s.small_claims.typical_outcome}</p>}
                      {s.small_claims.company_response && <p className={`text-sm ${c.textSecondary}`}><strong>Company usually:</strong> {s.small_claims.company_response}</p>}
                    </div>
                  )}

                  {/* Attorney General */}
                  {s.attorney_general?.applicable && (
                    <div className={`p-5 rounded-xl border ${c.border} ${c.cardAlt}`}>
                      <p className={`text-xs font-bold ${stageColors('red', 'accent')} mb-2`}>🏛️ STATE ATTORNEY GENERAL</p>
                      {s.attorney_general.how_to_file && <p className={`text-sm ${c.textSecondary} mb-1`}><strong>How to file:</strong> {s.attorney_general.how_to_file}</p>}
                      {s.attorney_general.what_it_triggers && <p className={`text-sm ${c.textSecondary}`}><strong>What it triggers:</strong> {s.attorney_general.what_it_triggers}</p>}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Next Stage Nudge */}
            {activeStage < 5 && (
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setActiveStage(activeStage + 1)}
                  className={`flex items-center gap-1.5 text-sm font-medium ${c.textSecondary} hover:${c.text} transition-colors`}
                >
                  If this doesn't work: Stage {activeStage + 1} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Timeline */}
          {results.timeline && (
            <div className={`${c.card} rounded-xl shadow-lg p-6`}>
              <h3 className={`font-bold ${c.text} mb-4 flex items-center gap-2`}>
                <Clock className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} /> Campaign Timeline
              </h3>
              <div className="relative pl-6">
                <div className={`absolute left-2 top-0 bottom-0 w-0.5 ${isDark ? 'bg-zinc-700' : 'bg-gray-200'}`} />
                {Object.entries(results.timeline).map(([key, value], idx) => (
                  <div key={key} className="relative mb-4 last:mb-0">
                    <div className={`absolute -left-4 top-1 w-3 h-3 rounded-full border-2 ${
                      idx === 0 ? 'bg-green-500 border-green-300' : (isDark ? 'bg-zinc-600 border-zinc-500' : 'bg-gray-300 border-gray-200')
                    }`} />
                    <p className={`text-xs font-bold uppercase tracking-wide ${idx === 0 ? (isDark ? 'text-green-400' : 'text-green-600') : c.textMuted} mb-0.5`}>{key.replace(/_/g, ' ')}</p>
                    <p className={`text-sm ${c.textSecondary}`}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Tips */}
          {results.quick_tips?.length > 0 && (
            <div className={`${c.card} rounded-xl shadow-lg p-6`}>
              <h3 className={`font-bold ${c.text} mb-3 flex items-center gap-2`}>
                <Zap className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-500'}`} /> Tactical Tips
              </h3>
              {results.quick_tips.map((tip, idx) => (
                <p key={idx} className={`text-sm ${c.textSecondary} mb-2`}>• {tip}</p>
              ))}
            </div>
          )}

          {/* Disclaimer */}
          <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-zinc-800/50' : 'bg-gray-50'}`}>
            <p className={`text-xs ${c.textMuted}`}>
              ⚖️ This tool provides strategic guidance for consumer complaints. It does not constitute legal advice. Consult an attorney for specific legal questions. All letters and complaints should be reviewed for accuracy before sending.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

ComplaintEscalationWriter.displayName = 'ComplaintEscalationWriter';
export default ComplaintEscalationWriter;
