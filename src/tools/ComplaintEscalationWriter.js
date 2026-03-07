import React, { useState } from 'react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';
import { usePersistentState } from '../hooks/usePersistentState';
import { getToolById } from '../data/tools';
import { CopyBtn } from '../components/ActionButtons';

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
  const [tone, setTone] = useState('firm');

  // Results state
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [activeStage, setActiveStage] = useState(1);
  const [expandedSections, setExpandedSections] = useState({});

  // Response analysis
  const [responseText, setResponseText] = useState('');
  const [responseAnalysis, setResponseAnalysis] = useState(null);
  const [responseLoading, setResponseLoading] = useState(false);
  const [showResponseInput, setShowResponseInput] = useState(null); // stage number or null

  // Editable letters
  const [editingLetter, setEditingLetter] = useState(null); // stage key or null
  const [editedLetters, setEditedLetters] = useState({}); // { stage_key: edited_text }

  // Campaign context threading
  const [campaignHistory, setCampaignHistory] = usePersistentState('cew-campaign', {}); // { complaintId: [{ stage, sentDate, companyResponse, analysisResult, outcome }] }
  const [regeneratedStages, setRegeneratedStages] = useState({}); // { stage_key: regenerated_data }
  const [regenerating, setRegenerating] = useState(null); // stage number or null
  const [showCallScript, setShowCallScript] = useState(false);

  // Persisted state
  const [complaintHistory, setComplaintHistory] = usePersistentState('cew-history', []);
  const [stageProgress, setStageProgress] = usePersistentState('cew-progress', {});
  const [checkedEvidence, setCheckedEvidence] = usePersistentState('cew-evidence', {});
  const [hasVisited, setHasVisited] = usePersistentState('cew-visited', false);
  const [dismissedHints, setDismissedHints] = usePersistentState('cew-hints', {});
  const [showHistory, setShowHistory] = useState(false);
  const [activeComplaintId, setActiveComplaintId] = useState(null);

  // Theme colors
  const c = {
    card: isDark ? 'bg-zinc-800' : 'bg-white',
    cardAlt: isDark ? 'bg-zinc-700/50' : 'bg-slate-50',
    text: isDark ? 'text-zinc-50' : 'text-gray-900',
    textSec: isDark ? 'text-zinc-300' : 'text-gray-600',
    textMuted: isDark ? 'text-zinc-500' : 'text-gray-400',
    input: isDark ? 'bg-zinc-700 border-zinc-600 text-zinc-100 placeholder-zinc-400 focus:ring-red-500/30' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-red-300',
    btnPrimary: isDark ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white',
    btnSecondary: isDark ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-100' : 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    border: isDark ? 'border-zinc-700' : 'border-gray-200',
  };

  const industries = [
    { id: 'auto', label: 'Auto-detect' }, { id: 'airline', label: 'Airlines' },
    { id: 'telecom', label: 'Telecom / Internet' }, { id: 'banking', label: 'Banking / Finance' },
    { id: 'insurance', label: 'Insurance' }, { id: 'retail', label: 'Retail / E-commerce' },
    { id: 'utility', label: 'Utilities' }, { id: 'healthcare', label: 'Healthcare' },
    { id: 'auto_dealer', label: 'Auto Dealers' }, { id: 'subscription', label: 'Subscriptions / SaaS' },
    { id: 'contractor', label: 'Contractors / Home Services' }, { id: 'other', label: 'Other' },
  ];

  const tones = [
    { id: 'firm', label: '📋 Firm & Professional', desc: 'Clear, business-like, references rights calmly' },
    { id: 'aggressive', label: '⚡ Assertive', desc: 'Direct legal language, shorter deadlines, urgent' },
    { id: 'empathetic', label: '🤝 Empathetic', desc: "Acknowledges reps aren't at fault, seeks resolution" },
  ];

  const stageConfig = [
    { num: 1, key: 'stage_1_direct', label: 'Direct Complaint', icon: '📨', color: 'blue' },
    { num: 2, key: 'stage_2_regulatory', label: 'Regulatory Filing', icon: '🛡️', color: 'purple' },
    { num: 3, key: 'stage_3_executive', label: 'Executive Escalation', icon: '🎯', color: 'orange' },
    { num: 4, key: 'stage_4_public', label: 'Public Pressure', icon: '📢', color: 'pink' },
    { num: 5, key: 'stage_5_financial_legal', label: 'Legal Remedies', icon: '⚖️', color: 'red' },
  ];

  const stageColors = (color, type) => {
    const map = {
      blue: { badge: isDark ? 'bg-blue-900/40 text-blue-300 border-blue-700' : 'bg-blue-100 text-blue-700 border-blue-200', bg: isDark ? 'bg-blue-900/15' : 'bg-blue-50', border: isDark ? 'border-blue-700' : 'border-blue-300', accent: isDark ? 'text-blue-400' : 'text-blue-600' },
      purple: { badge: isDark ? 'bg-purple-900/40 text-purple-300 border-purple-700' : 'bg-purple-100 text-purple-700 border-purple-200', bg: isDark ? 'bg-purple-900/15' : 'bg-purple-50', border: isDark ? 'border-purple-700' : 'border-purple-300', accent: isDark ? 'text-purple-400' : 'text-purple-600' },
      orange: { badge: isDark ? 'bg-orange-900/40 text-orange-300 border-orange-700' : 'bg-orange-100 text-orange-700 border-orange-200', bg: isDark ? 'bg-orange-900/15' : 'bg-orange-50', border: isDark ? 'border-orange-700' : 'border-orange-300', accent: isDark ? 'text-orange-400' : 'text-orange-600' },
      pink: { badge: isDark ? 'bg-pink-900/40 text-pink-300 border-pink-700' : 'bg-pink-100 text-pink-700 border-pink-200', bg: isDark ? 'bg-pink-900/15' : 'bg-pink-50', border: isDark ? 'border-pink-700' : 'border-pink-300', accent: isDark ? 'text-pink-400' : 'text-pink-600' },
      red: { badge: isDark ? 'bg-red-900/40 text-red-300 border-red-700' : 'bg-red-100 text-red-700 border-red-200', bg: isDark ? 'bg-red-900/15' : 'bg-red-50', border: isDark ? 'border-red-700' : 'border-red-300', accent: isDark ? 'text-red-400' : 'text-red-600' },
    };
    return map[color]?.[type] || '';
  };

  const severityConfig = {
    low: { label: 'Low Severity', color: isDark ? 'text-green-400' : 'text-green-600', bg: isDark ? 'bg-green-900/20' : 'bg-green-50', border: isDark ? 'border-green-700' : 'border-green-200' },
    medium: { label: 'Medium Severity', color: isDark ? 'text-amber-400' : 'text-amber-600', bg: isDark ? 'bg-amber-900/20' : 'bg-amber-50', border: isDark ? 'border-amber-700' : 'border-amber-200' },
    high: { label: 'High Severity', color: isDark ? 'text-orange-400' : 'text-orange-600', bg: isDark ? 'bg-orange-900/20' : 'bg-orange-50', border: isDark ? 'border-orange-700' : 'border-orange-200' },
    critical: { label: 'Critical', color: isDark ? 'text-red-400' : 'text-red-600', bg: isDark ? 'bg-red-900/20' : 'bg-red-50', border: isDark ? 'border-red-700' : 'border-red-200' },
  };

  // ── Helpers ──
  const toggleSection = (key) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !loading) {
      e.preventDefault();
      if (company.trim() && issue.trim()) handleSubmit();
    }
  };

  const Hint = ({ id, children }) => {
    if (dismissedHints[id]) return null;
    return (
      <div className={`flex items-start gap-2 px-3 py-2 mt-2 rounded-lg text-xs ${isDark ? 'bg-red-900/15 text-red-300 border border-red-800/40' : 'bg-red-50 text-red-700 border border-red-100'}`}>
        <span className="flex-shrink-0 mt-0.5">💡</span>
        <span className="flex-1">{children}</span>
        <button onClick={() => setDismissedHints(prev => ({ ...prev, [id]: true }))} className="flex-shrink-0 opacity-50 hover:opacity-100 ml-1">✕</button>
      </div>
    );
  };

  // ── Stage progress ──
  const markStageSent = (stageNum) => {
    if (!activeComplaintId) return;
    setStageProgress(prev => ({ ...prev, [activeComplaintId]: { ...(prev[activeComplaintId] || {}), [stageNum]: { sent: new Date().toISOString(), outcome: 'pending' } } }));
    // Log to campaign history
    addCampaignEntry(stageNum, { sentDate: new Date().toISOString() });
  };

  const markStageOutcome = (stageNum, outcome) => {
    if (!activeComplaintId) return;
    setStageProgress(prev => ({ ...prev, [activeComplaintId]: { ...(prev[activeComplaintId] || {}), [stageNum]: { ...(prev[activeComplaintId]?.[stageNum] || {}), outcome } } }));
    // Update campaign history
    updateCampaignEntry(stageNum, { outcome });
  };

  // ── Campaign history ──
  const addCampaignEntry = (stageNum, data) => {
    if (!activeComplaintId) return;
    setCampaignHistory(prev => {
      const existing = prev[activeComplaintId] || [];
      const entryIdx = existing.findIndex(e => e.stage === stageNum);
      if (entryIdx >= 0) {
        const updated = [...existing];
        updated[entryIdx] = { ...updated[entryIdx], ...data };
        return { ...prev, [activeComplaintId]: updated };
      }
      return { ...prev, [activeComplaintId]: [...existing, { stage: stageNum, ...data }] };
    });
  };

  const updateCampaignEntry = (stageNum, data) => {
    if (!activeComplaintId) return;
    setCampaignHistory(prev => {
      const existing = prev[activeComplaintId] || [];
      const entryIdx = existing.findIndex(e => e.stage === stageNum);
      if (entryIdx >= 0) {
        const updated = [...existing];
        updated[entryIdx] = { ...updated[entryIdx], ...data };
        return { ...prev, [activeComplaintId]: updated };
      }
      return { ...prev, [activeComplaintId]: [...existing, { stage: stageNum, ...data }] };
    });
  };

  const getCampaignEntries = () => {
    if (!activeComplaintId) return [];
    return campaignHistory[activeComplaintId] || [];
  };

  const getStageStatus = (stageNum) => {
    if (!activeComplaintId) return null;
    return stageProgress[activeComplaintId]?.[stageNum] || null;
  };

  const toggleEvidence = (idx) => {
    const key = activeComplaintId || 'temp';
    setCheckedEvidence(prev => ({ ...prev, [key]: { ...(prev[key] || {}), [idx]: !prev[key]?.[idx] } }));
  };

  const isEvidenceChecked = (idx) => {
    const key = activeComplaintId || 'temp';
    return !!checkedEvidence[key]?.[idx];
  };

  const getFollowUpDate = (daysFromNow) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStreamStage = (text) => {
    if (text.includes('"timeline"') || text.includes('"quick_tips"')) return 'Finishing';
    if (text.includes('"escalation_stages"') || text.includes('"stage_1_direct"')) return 'Building campaign';
    return 'Researching';
  };

  // ── Handlers ──
  const handleSubmit = async () => {
    if (!company.trim() || !issue.trim()) { setError('Please provide company name and issue description'); return; }
    setError('');
    setResults(null);

    try {
      const data = await callToolEndpoint('complaint-escalation-writer', {
        company: company.trim(), industry: industry === 'auto' ? null : industry, issue: issue.trim(),
        previousAttempts: previousAttempts.trim() || null, desiredOutcome: desiredOutcome.trim() || null,
        amountAtStake: amountAtStake.trim() || null, hasDocumentation: hasDocumentation.trim() || null, tone,
      });
      setResults(data);
      setActiveStage(1);
      const id = Date.now().toString();
      setActiveComplaintId(id);
      setComplaintHistory(prev => [{ id, company: company.trim(), industry, issue: issue.trim().slice(0, 120), severity: data.situation_assessment?.severity || 'medium', date: new Date().toISOString(), tone }, ...prev].slice(0, 20));
    } catch (err) {
      setError(err.message || 'Failed to build escalation campaign. Please try again.');
    }
  };

  const reset = () => {
    setCompany(''); setIndustry('auto'); setIssue(''); setPreviousAttempts(''); setDesiredOutcome('');
    setAmountAtStake(''); setHasDocumentation(''); setTone('firm'); setResults(null); setError('');
    setActiveStage(1); setExpandedSections({}); setActiveComplaintId(null);
    setResponseText(''); setResponseAnalysis(null); setShowResponseInput(null);
    setEditingLetter(null); setEditedLetters({}); setRegeneratedStages({});
    setRegenerating(null); setShowCallScript(false);
  };

  // ── Response analysis ──
  const handleAnalyzeResponse = async (stageNum) => {
    if (!responseText.trim()) { setError('Paste the company\'s response first'); return; }
    setResponseLoading(true); setError(''); setResponseAnalysis(null);
    try {
      const data = await callToolEndpoint('complaint-escalation-writer/analyze-response', {
        company: company.trim(),
        originalIssue: issue.trim(),
        stage: stageNum,
        companyResponse: responseText.trim(),
        desiredOutcome: desiredOutcome.trim() || null,
      });
      setResponseAnalysis(data);
      // Save response + analysis to campaign history
      updateCampaignEntry(stageNum, {
        companyResponse: responseText.trim(),
        analysisResult: data,
      });
    } catch (err) {
      setError(err.message || 'Failed to analyze response');
    } finally {
      setResponseLoading(false);
    }
  };

  // ── Context-aware escalation ──
  const handleContextEscalate = async (fromStage, toStage) => {
    markStageOutcome(fromStage, 'failed');
    setShowResponseInput(null);
    setActiveStage(toStage);

    // Check if we have campaign history worth regenerating with
    const entries = getCampaignEntries();
    const hasContext = entries.some(e => e.companyResponse || e.analysisResult);

    if (hasContext && toStage >= 2 && toStage <= 5) {
      setRegenerating(toStage);
      try {
        const stageKey = `stage_${toStage}_${toStage === 2 ? 'regulatory' : toStage === 3 ? 'executive' : toStage === 4 ? 'public' : 'financial_legal'}`;
        const data = await callToolEndpoint('complaint-escalation-writer/regenerate-stage', {
          company: company.trim(),
          issue: issue.trim(),
          industry: industry === 'auto' ? null : industry,
          desiredOutcome: desiredOutcome.trim() || null,
          amountAtStake: amountAtStake.trim() || null,
          tone,
          targetStage: toStage,
          campaignHistory: entries,
        });
        setRegeneratedStages(prev => ({ ...prev, [stageKey]: data }));
        // Clear edited letters for this stage since we have fresh context
        setEditedLetters(prev => { const next = { ...prev }; delete next[stageKey]; return next; });
      } catch (err) {
        console.error('Stage regeneration failed, using original:', err);
        // Silently fall back to original stage content
      } finally {
        setRegenerating(null);
      }
    }
    setResponseAnalysis(null);
    setResponseText('');
  };

  // ── Get stage data (regenerated or original) ──
  const getStageData = (stageKey, original) => {
    return regeneratedStages[stageKey] || original;
  };

  // ── Editable letters ──
  const getLetterText = (stageKey, originalText) => {
    return editedLetters[stageKey] ?? originalText;
  };

  const startEditingLetter = (stageKey, originalText) => {
    if (!editedLetters[stageKey]) {
      setEditedLetters(prev => ({ ...prev, [stageKey]: originalText }));
    }
    setEditingLetter(stageKey);
  };

  const cancelEditingLetter = (stageKey, originalText) => {
    setEditedLetters(prev => ({ ...prev, [stageKey]: originalText }));
    setEditingLetter(null);
  };

  // ── Deadline tracking ──
  const getDeadlineInfo = (stageNum) => {
    if (!activeComplaintId) return null;
    const status = stageProgress[activeComplaintId]?.[stageNum];
    if (!status?.sent) return null;
    const sentDate = new Date(status.sent);
    const deadlineDays = stageNum === 1 ? 14 : stageNum === 2 ? 21 : stageNum === 3 ? 10 : 7;
    const deadline = new Date(sentDate);
    deadline.setDate(deadline.getDate() + deadlineDays);
    const now = new Date();
    const daysRemaining = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
    return {
      sentDate: sentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      deadlineDate: deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      daysRemaining,
      isOverdue: daysRemaining < 0,
      deadlineDays,
    };
  };

  const buildFullText = () => {
    if (!results) return '';
    const lines = ['COMPLAINT ESCALATION CAMPAIGN', `Company: ${company}`, `Tone: ${tone}`, ''];
    const sa = results.situation_assessment;
    if (sa) { lines.push(`Severity: ${sa.severity}`, `Legal Strength: ${sa.legal_strength}`, sa.key_insight, ''); }
    const s1 = results.escalation_stages?.stage_1_direct;
    if (s1) { lines.push('═══ STAGE 1: DIRECT COMPLAINT ═══', `Subject: ${s1.subject_line}`, '', getLetterText('stage_1_direct', s1.letter_body), ''); }
    const s2 = results.escalation_stages?.stage_2_regulatory;
    if (s2) { lines.push('═══ STAGE 2: REGULATORY COMPLAINT ═══', `Agency: ${s2.agency}`, `URL: ${s2.agency_url}`, '', getLetterText('stage_2_regulatory', s2.complaint_text), ''); }
    const s3 = results.escalation_stages?.stage_3_executive;
    if (s3) { lines.push('═══ STAGE 3: EXECUTIVE ESCALATION ═══', `Subject: ${s3.subject_line}`, '', getLetterText('stage_3_executive', s3.letter_body), ''); }
    const s4 = results.escalation_stages?.stage_4_public;
    if (s4) { lines.push('═══ STAGE 4: PUBLIC PRESSURE ═══', s4.social_media_post, '', s4.social_media_long, ''); }
    if (results.evidence_checklist?.length > 0) {
      lines.push('═══ EVIDENCE CHECKLIST ═══');
      results.evidence_checklist.forEach((item, i) => {
        lines.push(`${isEvidenceChecked(i) ? '✅' : '☐'} [${item.priority}] ${item.item} — ${item.how}`);
      });
      lines.push('');
    }
    if (results.timeline) {
      lines.push('═══ TIMELINE ═══');
      Object.entries(results.timeline).forEach(([key, value]) => {
        lines.push(`${key.replace(/_/g, ' ')}: ${value}`);
      });
      lines.push('');
    }
    lines.push('───', 'This is strategic guidance, not legal advice. Consult an attorney for legal questions.');
    lines.push('\n— Generated by DeftBrain · deftbrain.com');
    return lines.join('\n');
  };

  const handlePrint = () => {
    const content = buildFullText();
    const pw = window.open('', '_blank');
    if (!pw) return;
    pw.document.write(`<!DOCTYPE html><html><head><title>Escalation Campaign — ${company}</title><style>body{font-family:Georgia,serif;max-width:700px;margin:40px auto;padding:0 20px;color:#1a1a1a;line-height:1.6;font-size:14px;}pre{white-space:pre-wrap;word-wrap:break-word;font-family:inherit;margin:0;}.branding{margin-top:40px;padding-top:20px;border-top:1px solid #ccc;text-align:center;font-size:12px;color:#888;}@media print{body{margin:20px;}}</style></head><body><pre>${content.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre><div class="branding">Generated by DeftBrain · deftbrain.com</div></body></html>`);
    pw.document.close();
    pw.focus();
    setTimeout(() => pw.print(), 250);
  };

  // ── Stage action bar (reusable) ──
  const StageActionBar = ({ stageNum, sentLabel, nextStage }) => {
    const status = getStageStatus(stageNum);
    const deadlineInfo = getDeadlineInfo(stageNum);

    if (!status) {
      return (
        <div className={`p-4 rounded-xl border ${c.border} ${c.cardAlt}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-bold ${c.text}`}>Ready to send?</p>
              <p className={`text-xs ${c.textMuted}`}>Mark as sent to track deadlines and follow-up dates</p>
            </div>
            <button onClick={() => markStageSent(stageNum)} className={`px-4 py-2 rounded-lg text-sm font-bold ${c.btnPrimary}`}>✅ {sentLabel || 'Mark as Sent'}</button>
          </div>
        </div>
      );
    }
    if (status.outcome === 'pending') {
      return (
        <div className="space-y-3">
          {/* Deadline tracker */}
          {deadlineInfo && (
            <div className={`p-3 rounded-xl border ${
              deadlineInfo.isOverdue
                ? isDark ? 'border-red-700 bg-red-900/15' : 'border-red-200 bg-red-50'
                : deadlineInfo.daysRemaining <= 3
                  ? isDark ? 'border-amber-700 bg-amber-900/15' : 'border-amber-200 bg-amber-50'
                  : isDark ? 'border-zinc-600 bg-zinc-700/30' : 'border-gray-200 bg-gray-50'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{deadlineInfo.isOverdue ? '🚨' : deadlineInfo.daysRemaining <= 3 ? '⏰' : '📅'}</span>
                  <div>
                    <p className={`text-xs font-bold ${c.text}`}>
                      Sent {deadlineInfo.sentDate} · Deadline: {deadlineInfo.deadlineDate}
                    </p>
                    <p className={`text-xs ${
                      deadlineInfo.isOverdue ? (isDark ? 'text-red-400' : 'text-red-600')
                        : deadlineInfo.daysRemaining <= 3 ? (isDark ? 'text-amber-400' : 'text-amber-600')
                        : c.textMuted
                    }`}>
                      {deadlineInfo.isOverdue
                        ? `${Math.abs(deadlineInfo.daysRemaining)} days overdue — time to escalate`
                        : `${deadlineInfo.daysRemaining} day${deadlineInfo.daysRemaining !== 1 ? 's' : ''} remaining`}
                    </p>
                  </div>
                </div>
                {/* Progress bar */}
                <div className={`w-24 h-1.5 rounded-full ${isDark ? 'bg-zinc-600' : 'bg-gray-200'}`}>
                  <div className={`h-full rounded-full transition-all ${
                    deadlineInfo.isOverdue ? 'bg-red-500' : deadlineInfo.daysRemaining <= 3 ? 'bg-amber-500' : 'bg-green-500'
                  }`} style={{ width: `${Math.min(100, Math.max(0, ((deadlineInfo.deadlineDays - deadlineInfo.daysRemaining) / deadlineInfo.deadlineDays) * 100))}%` }} />
                </div>
              </div>
            </div>
          )}

          {/* Outcome buttons */}
          <div className={`p-4 rounded-xl border ${c.border} ${c.cardAlt}`}>
            <p className={`text-xs ${c.textMuted} mb-3`}>Did the company respond?</p>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => markStageOutcome(stageNum, 'resolved')} className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${isDark ? 'border-green-700 text-green-300 hover:bg-green-900/20' : 'border-green-300 text-green-700 hover:bg-green-50'}`}>✅ Resolved</button>
              <button onClick={() => setShowResponseInput(stageNum)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${isDark ? 'border-sky-700 text-sky-300 hover:bg-sky-900/20' : 'border-sky-300 text-sky-700 hover:bg-sky-50'}`}>📨 They Responded — Analyze It</button>
              {nextStage && (
                <button onClick={() => handleContextEscalate(stageNum, nextStage)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${isDark ? 'border-red-700 text-red-300 hover:bg-red-900/20' : 'border-red-300 text-red-700 hover:bg-red-50'}`}>❌ No response → Stage {nextStage}</button>
              )}
              {!nextStage && (
                <button onClick={() => markStageOutcome(stageNum, 'failed')} className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${isDark ? 'border-red-700 text-red-300' : 'border-red-300 text-red-700'}`}>❌ Not resolved</button>
              )}
            </div>
          </div>

          {/* Response analysis input */}
          {showResponseInput === stageNum && (
            <div className={`p-4 rounded-xl border ${isDark ? 'border-sky-800 bg-sky-900/10' : 'border-sky-200 bg-sky-50'}`}>
              <p className={`text-sm font-bold ${c.text} mb-2`}>📨 Paste the company's response</p>
              <textarea
                value={responseText}
                onChange={e => setResponseText(e.target.value)}
                placeholder="Paste the email, letter, or message you received from the company…"
                rows={5}
                className={`w-full p-3 border rounded-xl text-sm resize-y outline-none focus:ring-2 ${c.input}`}
              />
              <div className="flex items-center gap-2 mt-2">
                <button onClick={() => handleAnalyzeResponse(stageNum)}
                  disabled={responseLoading || !responseText.trim()}
                  className={`px-4 py-2 rounded-lg text-sm font-bold ${responseText.trim() ? c.btnPrimary : isDark ? 'bg-zinc-700 text-zinc-500' : 'bg-gray-200 text-gray-400'}`}>
                  {responseLoading ? '⏳ Analyzing…' : '🔍 Analyze Response'}
                </button>
                <button onClick={() => { setShowResponseInput(null); setResponseText(''); setResponseAnalysis(null); }}
                  className={`text-xs font-bold ${c.textMuted}`}>Cancel</button>
              </div>

              {/* Response analysis results */}
              {responseAnalysis && (
                <div className="space-y-3 mt-4">
                  {/* Type + Assessment */}
                  <div className={`p-3 rounded-xl border ${
                    responseAnalysis.recommendation === 'accept' ? (isDark ? 'border-green-700 bg-green-900/15' : 'border-green-200 bg-green-50')
                      : responseAnalysis.recommendation === 'escalate' ? (isDark ? 'border-red-700 bg-red-900/15' : 'border-red-200 bg-red-50')
                      : isDark ? 'border-amber-700 bg-amber-900/15' : 'border-amber-200 bg-amber-50'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        responseAnalysis.recommendation === 'accept' ? (isDark ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-700')
                          : responseAnalysis.recommendation === 'escalate' ? (isDark ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-700')
                          : (isDark ? 'bg-amber-900/40 text-amber-300' : 'bg-amber-100 text-amber-700')
                      }`}>
                        {responseAnalysis.recommendation === 'accept' ? '✅ Accept' : responseAnalysis.recommendation === 'counter' ? '🤝 Counter' : responseAnalysis.recommendation === 'escalate' ? '⬆️ Escalate' : '⏳ Wait'}
                      </span>
                      <span className={`text-xs ${c.textMuted}`}>{responseAnalysis.response_type_label}</span>
                    </div>
                    <p className={`text-sm leading-relaxed ${c.text}`}>{responseAnalysis.assessment}</p>
                  </div>

                  <p className={`text-sm leading-relaxed ${c.textSec}`}>{responseAnalysis.recommendation_explanation}</p>

                  {/* Tactics used */}
                  {responseAnalysis.tactics_used?.length > 0 && (
                    <div>
                      <p className={`text-xs font-bold ${c.textMuted} mb-1.5`}>🎭 Corporate Tactics Identified</p>
                      <div className="flex flex-wrap gap-1.5">
                        {responseAnalysis.tactics_used.map((t, i) => (
                          <span key={i} className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isDark ? 'bg-violet-900/30 text-violet-300' : 'bg-violet-50 text-violet-700'}`}>{t}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Offer analysis */}
                  {responseAnalysis.offer_analysis?.what_they_offered && (
                    <div className={`p-3 rounded-lg ${c.cardAlt}`}>
                      <p className={`text-xs font-bold ${c.textMuted} mb-2`}>💰 Offer Analysis</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div><span className={c.textMuted}>Offered: </span><span className={`font-bold ${c.text}`}>{responseAnalysis.offer_analysis.what_they_offered}</span></div>
                        <div><span className={c.textMuted}>You asked: </span><span className={`font-bold ${c.text}`}>{responseAnalysis.offer_analysis.what_you_asked_for}</span></div>
                        {responseAnalysis.offer_analysis.gap && <div className="col-span-2"><span className={c.textMuted}>Gap: </span><span className={`font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>{responseAnalysis.offer_analysis.gap}</span></div>}
                        {responseAnalysis.offer_analysis.fair_market_value && <div className="col-span-2"><span className={c.textMuted}>Fair value: </span><span className={c.textSec}>{responseAnalysis.offer_analysis.fair_market_value}</span></div>}
                      </div>
                    </div>
                  )}

                  {/* Counter offer */}
                  {responseAnalysis.if_counter?.counter_offer_text && responseAnalysis.recommendation === 'counter' && (
                    <div className={`p-3 rounded-xl border ${isDark ? 'border-sky-800 bg-sky-900/10' : 'border-sky-200 bg-sky-50/50'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <p className={`text-xs font-bold ${isDark ? 'text-sky-400' : 'text-sky-700'}`}>🤝 Suggested Counter-Offer</p>
                        <CopyBtn content={responseAnalysis.if_counter.counter_offer_text + '\n\n— Generated by DeftBrain · deftbrain.com'} label="Copy" />
                      </div>
                      <div className={`whitespace-pre-wrap text-xs ${c.textSec} leading-relaxed`}>{responseAnalysis.if_counter.counter_offer_text}</div>
                    </div>
                  )}

                  {/* Red flags */}
                  {responseAnalysis.red_flags?.length > 0 && (
                    <div className={`p-3 rounded-lg ${isDark ? 'bg-red-900/15' : 'bg-red-50'}`}>
                      <p className={`text-xs font-bold ${isDark ? 'text-red-400' : 'text-red-700'} mb-1`}>🚩 Red Flags in Their Response</p>
                      {responseAnalysis.red_flags.map((f, i) => <p key={i} className={`text-xs ${c.textSec}`}>• {f}</p>)}
                    </div>
                  )}

                  {/* Things to get in writing */}
                  {responseAnalysis.things_to_get_in_writing?.length > 0 && (
                    <div className={`p-3 rounded-lg ${c.cardAlt}`}>
                      <p className={`text-xs font-bold ${c.textMuted} mb-1`}>📝 Get In Writing</p>
                      {responseAnalysis.things_to_get_in_writing.map((t, i) => <p key={i} className={`text-xs ${c.textSec}`}>• {t}</p>)}
                    </div>
                  )}

                  {/* Action buttons based on recommendation */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {responseAnalysis.recommendation === 'accept' && (
                      <button onClick={() => markStageOutcome(stageNum, 'resolved')} className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${isDark ? 'border-green-700 text-green-300 hover:bg-green-900/20' : 'border-green-300 text-green-700 hover:bg-green-50'}`}>✅ Accept & Mark Resolved</button>
                    )}
                    {responseAnalysis.recommendation === 'escalate' && nextStage && (
                      <button onClick={() => handleContextEscalate(stageNum, nextStage)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${isDark ? 'border-red-700 text-red-300 hover:bg-red-900/20' : 'border-red-300 text-red-700 hover:bg-red-50'}`}>
                        ⬆️ Escalate to Stage {nextStage}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }
    return (
      <div className={`p-4 rounded-xl border ${c.border} ${c.cardAlt}`}>
        <p className={`text-sm font-bold ${status.outcome === 'resolved' ? (isDark ? 'text-green-400' : 'text-green-600') : (isDark ? 'text-red-400' : 'text-red-600')}`}>
          {status.outcome === 'resolved' ? '✅ Resolved! Campaign complete.' : `❌ Not resolved${nextStage ? ` — see Stage ${nextStage}` : ''}`}
        </p>
      </div>
    );
  };

  // ─── RENDER ───
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className={`text-2xl font-bold ${c.text}`}>{toolData?.title || 'Complaint Escalation Writer'} {toolData?.icon || '📝'}</h2>
          <p className={`text-sm ${c.textMuted}`}>{toolData?.tagline || 'Professional escalation campaigns that get results'}</p>
        </div>
        {complaintHistory.length > 0 && !results && (
          <button onClick={() => setShowHistory(!showHistory)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${c.btnSecondary}`}>
            <span>📁</span> History ({complaintHistory.length})
          </button>
        )}
      </div>

      {/* ═══════════════ INPUT VIEW ═══════════════ */}
      {!results && (
        <div className="space-y-6">

          {/* First-visit welcome */}
          {!hasVisited && (
            <div className={`${c.card} border ${c.border} rounded-xl shadow-lg p-5 sm:p-6`}>
              <h3 className={`text-lg font-bold ${c.text} mb-2`}>Your escalation strategist 📨</h3>
              <p className={`text-sm ${c.textSec} mb-4`}>Builds a complete, multi-stage campaign to resolve complaints that companies are ignoring.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                {[
                  { emoji: '📨', title: '5-stage escalation ladder', desc: 'Direct → Regulatory → Executive → Public → Legal' },
                  { emoji: '⚖️', title: 'Legal leverage analysis', desc: 'Laws, regulations & consumer protections that apply' },
                  { emoji: '📋', title: 'Ready-to-send letters', desc: 'Complete letters, complaint texts & social posts' },
                  { emoji: '📊', title: 'Progress tracking', desc: 'Track sent stages, outcomes & follow-up dates' },
                ].map((f, i) => (
                  <div key={i} className={`flex items-start gap-2 p-2.5 rounded-xl ${c.cardAlt}`}>
                    <span className="text-lg">{f.emoji}</span>
                    <div>
                      <p className={`text-sm font-bold ${c.text}`}>{f.title}</p>
                      <p className={`text-xs ${c.textMuted}`}>{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => setHasVisited(true)} className={`text-xs font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>Got it — let's build my campaign →</button>
            </div>
          )}

          {/* Complaint History */}
          {showHistory && complaintHistory.length > 0 && (
            <div className={`${c.card} border ${c.border} rounded-xl shadow-lg p-5`}>
              <h4 className={`text-sm font-bold ${c.text} mb-3`}>📁 Past Complaints</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {complaintHistory.map(h => {
                  const sev = severityConfig[h.severity] || severityConfig.medium;
                  const progress = stageProgress[h.id];
                  const stagesCompleted = progress ? Object.keys(progress).length : 0;
                  return (
                    <div key={h.id} className={`flex items-center gap-3 p-3 rounded-xl ${c.cardAlt}`}>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold truncate ${c.text}`}>{h.company}</p>
                        <p className={`text-xs ${c.textMuted} truncate`}>{new Date(h.date).toLocaleDateString()} · {h.issue}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${sev.bg} ${sev.color} border ${sev.border}`}>{sev.label}</span>
                      {stagesCompleted > 0 && <span className={`text-xs ${c.textMuted}`}>{stagesCompleted}/5</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Company + Industry */}
          <div className={`${c.card} border ${c.border} rounded-xl shadow-lg p-6 space-y-4`}>
            <div>
              <label className={`block font-semibold ${c.text} mb-2`}>Company <span className="text-red-500">*</span></label>
              <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} onKeyDown={handleKeyDown}
                placeholder="e.g., Delta Airlines, Comcast, Chase Bank"
                className={`w-full p-3 border rounded-xl outline-none focus:ring-2 ${c.input}`} />
            </div>
            <div>
              <label className={`block font-semibold ${c.text} mb-2`}>Industry <span className={`text-xs font-normal ${c.textMuted}`}>(helps identify the right regulations)</span></label>
              <div className="flex flex-wrap gap-2">
                {industries.map(ind => (
                  <button key={ind.id} onClick={() => setIndustry(ind.id)}
                    className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                      industry === ind.id ? `border-red-500 ${isDark ? 'bg-red-900/30 text-red-300' : 'bg-red-50 text-red-700'}` : `${isDark ? 'border-zinc-600 text-zinc-300' : 'border-gray-200 text-gray-600'}`
                    }`}>{ind.label}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Issue Description */}
          <div className={`${c.card} border ${c.border} rounded-xl shadow-lg p-6`}>
            <label className={`block font-semibold ${c.text} mb-2`}>What happened? <span className="text-red-500">*</span></label>
            <textarea value={issue} onChange={(e) => setIssue(e.target.value)}
              placeholder="Be specific: dates, amounts, what was promised vs. delivered, names of reps you spoke to, reference/case numbers. The more detail you provide, the stronger your campaign will be."
              rows={6} className={`w-full p-4 border rounded-xl outline-none text-sm resize-y focus:ring-2 ${c.input}`} />
            {issue.length > 0 && issue.length < 100 && (
              <p className={`text-xs ${isDark ? 'text-amber-400' : 'text-amber-600'} mt-2`}>Tip: More detail = stronger letters. Include dates, dollar amounts, names of reps, and reference numbers.</p>
            )}
          </div>

          {/* Tone Selector */}
          <div className={`${c.card} border ${c.border} rounded-xl shadow-lg p-6`}>
            <label className={`block font-semibold ${c.text} mb-3`}>Campaign Tone</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {tones.map(t => (
                <button key={t.id} onClick={() => setTone(t.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    tone === t.id ? isDark ? 'border-red-500 bg-red-900/20' : 'border-red-400 bg-red-50' : isDark ? 'border-zinc-600 hover:border-zinc-500' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                  <p className={`text-sm font-bold ${c.text}`}>{t.label}</p>
                  <p className={`text-xs ${c.textMuted} mt-0.5`}>{t.desc}</p>
                </button>
              ))}
            </div>
            <Hint id="tone">Tone affects the language of all 5 stages. Assertive uses stronger legal phrasing; Empathetic acknowledges front-line staff.</Hint>
          </div>

          {/* Details Grid */}
          <div className={`${c.card} border ${c.border} rounded-xl shadow-lg p-6`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-semibold ${c.text} mb-2`}>Previous attempts</label>
                <input type="text" value={previousAttempts} onChange={(e) => setPreviousAttempts(e.target.value)} onKeyDown={handleKeyDown}
                  placeholder="e.g., Called 3 times, chatted, sent email" className={`w-full p-3 border rounded-xl outline-none text-sm focus:ring-2 ${c.input}`} />
              </div>
              <div>
                <label className={`block text-sm font-semibold ${c.text} mb-2`}>Desired outcome</label>
                <input type="text" value={desiredOutcome} onChange={(e) => setDesiredOutcome(e.target.value)} onKeyDown={handleKeyDown}
                  placeholder="e.g., Full refund of $459, service restored" className={`w-full p-3 border rounded-xl outline-none text-sm focus:ring-2 ${c.input}`} />
              </div>
              <div>
                <label className={`block text-sm font-semibold ${c.text} mb-2`}>Amount at stake</label>
                <input type="text" value={amountAtStake} onChange={(e) => setAmountAtStake(e.target.value)} onKeyDown={handleKeyDown}
                  placeholder="e.g., $459, $2,300, ongoing $89/mo" className={`w-full p-3 border rounded-xl outline-none text-sm focus:ring-2 ${c.input}`} />
              </div>
              <div>
                <label className={`block text-sm font-semibold ${c.text} mb-2`}>Documentation you have</label>
                <input type="text" value={hasDocumentation} onChange={(e) => setHasDocumentation(e.target.value)} onKeyDown={handleKeyDown}
                  placeholder="e.g., Screenshots, emails, receipts, chat logs" className={`w-full p-3 border rounded-xl outline-none text-sm focus:ring-2 ${c.input}`} />
              </div>
            </div>
          </div>

          {/* Submit */}
          <button onClick={handleSubmit} disabled={loading || !company.trim() || !issue.trim()}
            className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2 shadow-lg ${
              loading ? (isDark ? 'bg-zinc-700 text-zinc-400' : 'bg-gray-200 text-gray-400') : c.btnPrimary
            }`}>
            {loading ? (<><span className="animate-spin inline-block">⏳</span> Building your escalation campaign...</>) : (<><span>⚡</span> Build Escalation Campaign</>)}
          </button>

          {error && (
            <div className={`p-4 rounded-xl flex items-start gap-3 ${isDark ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
              <span className="flex-shrink-0 mt-0.5">⚠️</span>
              <p className={`text-sm ${isDark ? 'text-red-300' : 'text-red-800'}`}>{error}</p>
            </div>
          )}

          {/* PlainTalk cross-reference */}
          <div className={`${c.card} border ${c.border} rounded-2xl p-4 flex items-center gap-3`}>
            <span className="text-2xl">📖</span>
            <div className="flex-1">
              <p className={`text-sm font-bold ${c.text}`}>Got a confusing response from a company?</p>
              <p className={`text-xs ${c.textMuted}`}>Use PlainTalk to decode corporate/legal language before escalating</p>
            </div>
            <a href="/PlainTalk" target="_blank" rel="noopener noreferrer"
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${isDark ? 'bg-sky-900/40 text-sky-300 hover:bg-sky-900/60' : 'bg-sky-50 text-sky-700 hover:bg-sky-100'}`}>Open →</a>
          </div>
        </div>
      )}

      {/* ═══════════════ RESULTS VIEW ═══════════════ */}
      {results && (
        <div className="space-y-6">

          {/* Controls Bar */}
          <div className={`${c.card} border ${c.border} rounded-xl shadow-lg p-4 flex items-center justify-between flex-wrap gap-3`}>
            <span className={`text-sm font-semibold ${c.text}`}>Escalation Campaign: {company}</span>
            <div className="flex items-center gap-2">
              <CopyBtn content={buildFullText()} label="Copy All" />
              <button onClick={handlePrint} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${c.btnSecondary}`}><span>🖨️</span> Print</button>
              <button onClick={reset} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${isDark ? 'bg-red-900/30 text-red-300 hover:bg-red-800/40' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}><span>🔄</span> New Complaint</button>
            </div>
          </div>

          {/* Situation Assessment */}
          {results.situation_assessment && (() => {
            const sev = severityConfig[results.situation_assessment.severity] || severityConfig.medium;
            return (
              <div className={`${c.card} border ${c.border} rounded-xl shadow-lg p-6 border-l-4 ${sev.border}`}>
                <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${sev.bg} ${sev.color} border ${sev.border}`}>{sev.label}</span>
                  <div className="flex gap-3 text-sm">
                    {results.situation_assessment.legal_strength && <span className={c.textSec}>Legal position: <strong className={c.text}>{results.situation_assessment.legal_strength}</strong></span>}
                    {results.situation_assessment.estimated_resolution_likelihood && <span className={c.textSec}>Success est: <strong className={c.text}>{results.situation_assessment.estimated_resolution_likelihood}</strong></span>}
                  </div>
                </div>
                <p className={`font-semibold ${c.text} mb-2`}>{results.situation_assessment.key_insight}</p>
                {results.situation_assessment.company_reputation && <p className={`text-sm ${c.textSec}`}>{results.situation_assessment.company_reputation}</p>}
              </div>
            );
          })()}

          {/* Legal Leverage */}
          {results.legal_leverage?.length > 0 && (
            <div className={`${c.card} border ${c.border} rounded-xl shadow-lg p-6`}>
              <button onClick={() => toggleSection('legal')} className={`w-full flex items-center justify-between ${c.text}`}>
                <h3 className="font-bold flex items-center gap-2"><span>⚖️</span> Your Legal Leverage ({results.legal_leverage.length})</h3>
                {expandedSections.legal ? <span>▲</span> : <span>▼</span>}
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
                      <p className={`text-sm ${c.textSec} mb-1`}>{law.how_it_applies}</p>
                      <p className={`text-xs ${c.textMuted}`}>Company risk: {law.consequence_for_company}</p>
                      {law.time_limit_days && (
                        <div className={`mt-2 flex items-center gap-2 px-2.5 py-1.5 rounded-lg ${
                          law.time_limit_days <= 30
                            ? isDark ? 'bg-red-900/15 border border-red-800/40' : 'bg-red-50 border border-red-100'
                            : law.time_limit_days <= 90
                              ? isDark ? 'bg-amber-900/15 border border-amber-800/40' : 'bg-amber-50 border border-amber-100'
                              : isDark ? 'bg-zinc-700/50' : 'bg-gray-50'
                        }`}>
                          <span className="text-xs">{law.time_limit_days <= 30 ? '🚨' : law.time_limit_days <= 90 ? '⏰' : '📅'}</span>
                          <span className={`text-xs font-bold ${
                            law.time_limit_days <= 30 ? (isDark ? 'text-red-400' : 'text-red-600')
                              : law.time_limit_days <= 90 ? (isDark ? 'text-amber-400' : 'text-amber-600')
                              : c.textMuted
                          }`}>
                            Filing window: {law.time_limit_note || `~${law.time_limit_days} days`}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Evidence Checklist — Interactive */}
          {results.evidence_checklist?.length > 0 && (
            <div className={`${c.card} border ${c.border} rounded-xl shadow-lg p-6`}>
              <button onClick={() => toggleSection('evidence')} className={`w-full flex items-center justify-between ${c.text}`}>
                <h3 className="font-bold flex items-center gap-2"><span>📋</span> Evidence Checklist ({results.evidence_checklist.filter((_, i) => isEvidenceChecked(i)).length}/{results.evidence_checklist.length})</h3>
                {expandedSections.evidence ? <span>▲</span> : <span>▼</span>}
              </button>
              {expandedSections.evidence && (
                <div className="space-y-2 mt-4">
                  <Hint id="evidence">Check off items as you gather them. Your progress is saved.</Hint>
                  {results.evidence_checklist.map((item, idx) => (
                    <div key={idx} onClick={() => toggleEvidence(idx)}
                      className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        isEvidenceChecked(idx) ? isDark ? 'bg-green-900/15 border border-green-800' : 'bg-green-50 border border-green-200' : c.cardAlt
                      }`}>
                      <input type="checkbox" checked={isEvidenceChecked(idx)} readOnly className={`mt-1 w-4 h-4 rounded ${isDark ? 'accent-green-500' : 'accent-green-600'}`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-semibold ${isEvidenceChecked(idx) ? `${c.textMuted} line-through` : c.text}`}>{item.item}</p>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                            item.priority === 'critical' ? (isDark ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-600')
                            : item.priority === 'important' ? (isDark ? 'bg-amber-900/40 text-amber-300' : 'bg-amber-100 text-amber-600')
                            : (isDark ? 'bg-zinc-700 text-zinc-400' : 'bg-gray-100 text-gray-500')
                          }`}>{item.priority}</span>
                        </div>
                        <p className={`text-xs ${c.textSec} mt-0.5`}>{item.how}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── ESCALATION LADDER ── */}
          <div className={`${c.card} border ${c.border} rounded-xl shadow-lg p-6`}>
            <h3 className={`font-bold ${c.text} mb-4 flex items-center gap-2`}><span>⚡</span> Escalation Ladder</h3>
            <p className={`text-sm ${c.textSec} mb-5`}>Start at Stage 1. Only move to the next stage if the previous one fails.</p>

            {/* Stage Tabs with progress dots */}
            <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
              {stageConfig.map(stage => {
                const isActive = activeStage === stage.num;
                const sc = stageColors(stage.color, 'badge');
                const status = getStageStatus(stage.num);
                return (
                  <button key={stage.num} onClick={() => setActiveStage(stage.num)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap border transition-all relative ${
                      isActive ? sc : (isDark ? 'border-zinc-700 text-zinc-400 hover:text-zinc-200' : 'border-gray-200 text-gray-500 hover:text-gray-700')
                    }`}>
                    <span>{stage.icon}</span>
                    <span className="hidden sm:inline">{stage.num}.</span> {stage.label}
                    {status && <span className={`w-2 h-2 rounded-full absolute -top-0.5 -right-0.5 ${status.outcome === 'resolved' ? 'bg-green-500' : status.outcome === 'failed' ? 'bg-red-500' : 'bg-amber-500'}`} />}
                  </button>
                );
              })}
            </div>

            {/* Campaign Progress Bar */}
            {activeComplaintId && Object.keys(stageProgress[activeComplaintId] || {}).length > 0 && (
              <div className={`mb-5 p-3 rounded-lg ${c.cardAlt}`}>
                <span className={`text-xs font-bold ${c.textMuted}`}>CAMPAIGN PROGRESS</span>
                <div className="flex gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map(n => {
                    const st = getStageStatus(n);
                    return <div key={n} className={`flex-1 h-2 rounded-full ${st?.outcome === 'resolved' ? 'bg-green-500' : st?.outcome === 'failed' ? 'bg-red-500' : st ? 'bg-amber-500' : isDark ? 'bg-zinc-600' : 'bg-gray-200'}`} />;
                  })}
                </div>
              </div>
            )}

            {/* Stage 1: Direct Complaint */}
            {activeStage === 1 && results.escalation_stages?.stage_1_direct && (() => {
              const s = results.escalation_stages.stage_1_direct;
              const stageKey = 'stage_1_direct';
              const letterText = getLetterText(stageKey, s.letter_body);
              const isEditing = editingLetter === stageKey;
              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className={`font-bold ${c.text}`}>Stage 1: Direct Company Complaint</h4>
                    <div className="flex items-center gap-2">
                      {!isEditing && (
                        <button onClick={() => startEditingLetter(stageKey, s.letter_body)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold ${c.btnSecondary}`}>✏️ Edit</button>
                      )}
                      <CopyBtn content={`Subject: ${s.subject_line}\n\n${letterText}\n\n— Generated by DeftBrain · deftbrain.com`} label="Copy Letter" />
                    </div>
                  </div>
                  <div className={`rounded-xl p-5 border ${isDark ? 'bg-zinc-700/30 border-zinc-600' : 'bg-slate-50 border-gray-200'}`}>
                    <p className={`text-xs font-bold ${c.textMuted} mb-1`}>SUBJECT</p>
                    <p className={`font-semibold ${c.text} mb-4`}>{s.subject_line}</p>
                    {isEditing ? (
                      <div>
                        <textarea
                          value={editedLetters[stageKey] || s.letter_body}
                          onChange={e => setEditedLetters(prev => ({ ...prev, [stageKey]: e.target.value }))}
                          rows={16}
                          className={`w-full p-3 border rounded-xl text-sm resize-y outline-none focus:ring-2 leading-relaxed ${c.input}`}
                        />
                        <div className="flex items-center gap-2 mt-2">
                          <button onClick={() => setEditingLetter(null)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold ${isDark ? 'bg-green-900/30 text-green-300' : 'bg-green-50 text-green-700'}`}>✅ Done Editing</button>
                          <button onClick={() => cancelEditingLetter(stageKey, s.letter_body)}
                            className={`text-xs font-bold ${c.textMuted}`}>Reset to Original</button>
                          {editedLetters[stageKey] !== s.letter_body && (
                            <span className={`text-[10px] ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>✏️ Modified</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className={`whitespace-pre-wrap text-sm ${c.textSec} leading-relaxed`}>
                        {letterText}
                        {editedLetters[stageKey] && editedLetters[stageKey] !== s.letter_body && (
                          <p className={`text-[10px] mt-2 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>✏️ You've edited this letter</p>
                        )}
                      </div>
                    )}
                  </div>
                  {s.send_to?.length > 0 && (
                    <div className={`p-4 rounded-lg ${stageColors('blue', 'bg')}`}>
                      <p className={`text-xs font-bold ${stageColors('blue', 'accent')} mb-2`}>SEND TO</p>
                      {s.send_to.map((r, i) => (
                        <div key={i} className={`text-sm ${c.textSec} mb-2`}>
                          <span className={`font-semibold ${c.text}`}>{r.role}</span> — {r.how_to_find}
                          {r.email_pattern && <span className={`ml-1 ${c.textMuted}`}>({r.email_pattern})</span>}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {s.send_via && <div className={`p-3 rounded-lg ${c.cardAlt}`}><p className={`text-xs font-bold ${c.textMuted} mb-1`}>SEND VIA</p><p className={`text-sm ${c.textSec}`}>{s.send_via}</p></div>}
                    {s.deadline_to_set && <div className={`p-3 rounded-lg ${c.cardAlt}`}><p className={`text-xs font-bold ${c.textMuted} mb-1`}>RESPONSE DEADLINE</p><p className={`text-sm ${c.textSec}`}>{s.deadline_to_set}</p></div>}
                  </div>
                  {s.leverage_points_used?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {s.leverage_points_used.map((lp, i) => <span key={i} className={`px-2.5 py-1 rounded-full text-xs font-medium ${stageColors('blue', 'badge')}`}>{lp}</span>)}
                    </div>
                  )}
                  <StageActionBar stageNum={1} sentLabel="Mark as Sent" nextStage={2} />
                </div>
              );
            })()}

            {/* Stage 2: Regulatory */}
            {activeStage === 2 && results.escalation_stages?.stage_2_regulatory && (() => {
              const s = getStageData('stage_2_regulatory', results.escalation_stages.stage_2_regulatory);
              const stageKey = 'stage_2_regulatory';
              const isRegenerated = !!regeneratedStages[stageKey];
              const complaintText = getLetterText(stageKey, s.complaint_text);
              const isEditing = editingLetter === stageKey;
              if (regenerating === 2) return (
                <div className={`p-8 text-center ${c.cardAlt} rounded-xl`}>
                  <p className="text-lg mb-2"><span className="animate-spin inline-block">⏳</span></p>
                  <p className={`text-sm font-bold ${c.text}`}>Regenerating Stage 2 with campaign context…</p>
                  <p className={`text-xs ${c.textMuted} mt-1`}>Weaving in what happened at Stage 1 to make this complaint more powerful</p>
                </div>
              );
              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className={`font-bold ${c.text}`}>Stage 2: Regulatory Complaint</h4>
                      {isRegenerated && <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isDark ? 'bg-sky-900/40 text-sky-300' : 'bg-sky-50 text-sky-700'}`}>🔄 Context-aware</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      {!isEditing && (
                        <button onClick={() => startEditingLetter(stageKey, s.complaint_text)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold ${c.btnSecondary}`}>✏️ Edit</button>
                      )}
                      <CopyBtn content={`${complaintText}\n\n— Generated by DeftBrain · deftbrain.com`} label="Copy Complaint" />
                    </div>
                  </div>
                  <div className={`p-4 rounded-xl ${stageColors('purple', 'bg')} border ${stageColors('purple', 'border')}`}>
                    <p className={`text-xs font-bold ${stageColors('purple', 'accent')} mb-1`}>FILE WITH</p>
                    <p className={`font-bold ${c.text} text-lg`}>{s.agency}</p>
                    {s.agency_url && <p className={`text-sm ${stageColors('purple', 'accent')} mt-1`}>{s.agency_url}</p>}
                    <p className={`text-sm ${c.textSec} mt-2`}>{s.why_this_agency}</p>
                  </div>
                  <div className={`rounded-xl p-5 border ${isDark ? 'bg-zinc-700/30 border-zinc-600' : 'bg-slate-50 border-gray-200'}`}>
                    <p className={`text-xs font-bold ${c.textMuted} mb-2`}>PRE-WRITTEN COMPLAINT TEXT</p>
                    {isEditing ? (
                      <div>
                        <textarea
                          value={editedLetters[stageKey] || s.complaint_text}
                          onChange={e => setEditedLetters(prev => ({ ...prev, [stageKey]: e.target.value }))}
                          rows={12}
                          className={`w-full p-3 border rounded-xl text-sm resize-y outline-none focus:ring-2 leading-relaxed ${c.input}`}
                        />
                        <div className="flex items-center gap-2 mt-2">
                          <button onClick={() => setEditingLetter(null)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold ${isDark ? 'bg-green-900/30 text-green-300' : 'bg-green-50 text-green-700'}`}>✅ Done</button>
                          <button onClick={() => cancelEditingLetter(stageKey, s.complaint_text)}
                            className={`text-xs font-bold ${c.textMuted}`}>Reset</button>
                        </div>
                      </div>
                    ) : (
                      <div className={`whitespace-pre-wrap text-sm ${c.textSec} leading-relaxed`}>
                        {complaintText}
                        {editedLetters[stageKey] && editedLetters[stageKey] !== s.complaint_text && (
                          <p className={`text-[10px] mt-2 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>✏️ You've edited this text</p>
                        )}
                      </div>
                    )}
                  </div>
                  {s.what_happens_after && <div className={`p-4 rounded-lg ${c.cardAlt}`}><p className={`text-xs font-bold ${c.textMuted} mb-1`}>WHAT HAPPENS AFTER FILING</p><p className={`text-sm ${c.textSec}`}>{s.what_happens_after}</p></div>}
                  {s.company_impact && <div className={`p-4 rounded-lg ${c.cardAlt}`}><p className={`text-xs font-bold ${c.textMuted} mb-1`}>WHY COMPANIES TAKE THIS SERIOUSLY</p><p className={`text-sm ${c.textSec}`}>{s.company_impact}</p></div>}
                  <StageActionBar stageNum={2} sentLabel="Mark as Filed" nextStage={3} />
                </div>
              );
            })()}

            {/* Stage 3: Executive */}
            {activeStage === 3 && results.escalation_stages?.stage_3_executive && (() => {
              const s = getStageData('stage_3_executive', results.escalation_stages.stage_3_executive);
              const stageKey = 'stage_3_executive';
              const isRegenerated = !!regeneratedStages[stageKey];
              const letterText = getLetterText(stageKey, s.letter_body);
              const isEditing = editingLetter === stageKey;
              if (regenerating === 3) return (
                <div className={`p-8 text-center ${c.cardAlt} rounded-xl`}>
                  <p className="text-lg mb-2"><span className="animate-spin inline-block">⏳</span></p>
                  <p className={`text-sm font-bold ${c.text}`}>Regenerating Stage 3 with campaign context…</p>
                  <p className={`text-xs ${c.textMuted} mt-1`}>Incorporating company responses and failed resolution attempts</p>
                </div>
              );
              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className={`font-bold ${c.text}`}>Stage 3: Executive Escalation</h4>
                      {isRegenerated && <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isDark ? 'bg-sky-900/40 text-sky-300' : 'bg-sky-50 text-sky-700'}`}>🔄 Context-aware</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      {!isEditing && (
                        <button onClick={() => startEditingLetter(stageKey, s.letter_body)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold ${c.btnSecondary}`}>✏️ Edit</button>
                      )}
                      <CopyBtn content={`Subject: ${s.subject_line}\n\n${letterText}\n\n— Generated by DeftBrain · deftbrain.com`} label="Copy Letter" />
                    </div>
                  </div>
                  <div className={`rounded-xl p-5 border ${isDark ? 'bg-zinc-700/30 border-zinc-600' : 'bg-slate-50 border-gray-200'}`}>
                    <p className={`text-xs font-bold ${c.textMuted} mb-1`}>SUBJECT</p>
                    <p className={`font-semibold ${c.text} mb-4`}>{s.subject_line}</p>
                    {isEditing ? (
                      <div>
                        <textarea
                          value={editedLetters[stageKey] || s.letter_body}
                          onChange={e => setEditedLetters(prev => ({ ...prev, [stageKey]: e.target.value }))}
                          rows={12}
                          className={`w-full p-3 border rounded-xl text-sm resize-y outline-none focus:ring-2 leading-relaxed ${c.input}`}
                        />
                        <div className="flex items-center gap-2 mt-2">
                          <button onClick={() => setEditingLetter(null)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold ${isDark ? 'bg-green-900/30 text-green-300' : 'bg-green-50 text-green-700'}`}>✅ Done</button>
                          <button onClick={() => cancelEditingLetter(stageKey, s.letter_body)}
                            className={`text-xs font-bold ${c.textMuted}`}>Reset</button>
                        </div>
                      </div>
                    ) : (
                      <div className={`whitespace-pre-wrap text-sm ${c.textSec} leading-relaxed`}>
                        {letterText}
                        {editedLetters[stageKey] && editedLetters[stageKey] !== s.letter_body && (
                          <p className={`text-[10px] mt-2 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>✏️ You've edited this letter</p>
                        )}
                      </div>
                    )}
                  </div>
                  {s.target_contacts?.length > 0 && (
                    <div className={`p-4 rounded-lg ${stageColors('orange', 'bg')} border ${stageColors('orange', 'border')}`}>
                      <p className={`text-xs font-bold ${stageColors('orange', 'accent')} mb-2`}>TARGET CONTACTS</p>
                      {s.target_contacts.map((tc, i) => (
                        <div key={i} className={`text-sm ${c.textSec} mb-2`}>
                          <span className={`font-semibold ${c.text}`}>{tc.title}</span>
                          {tc.email_pattern && <span className={`ml-2 font-mono text-xs ${c.textMuted}`}>{tc.email_pattern}</span>}
                          {tc.why && <p className={`text-xs ${c.textMuted} mt-0.5`}>{tc.why}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                  {s.timing && <div className={`p-3 rounded-lg ${c.cardAlt}`}><p className={`text-xs font-bold ${c.textMuted} mb-1`}>TIMING</p><p className={`text-sm ${c.textSec}`}>{s.timing}</p></div>}
                  <StageActionBar stageNum={3} sentLabel="Mark as Sent" nextStage={4} />
                </div>
              );
            })()}

            {/* Stage 4: Public Pressure */}
            {activeStage === 4 && results.escalation_stages?.stage_4_public && (() => {
              const s = getStageData('stage_4_public', results.escalation_stages.stage_4_public);
              const isRegenerated = !!regeneratedStages['stage_4_public'];
              if (regenerating === 4) return (
                <div className={`p-8 text-center ${c.cardAlt} rounded-xl`}>
                  <p className="text-lg mb-2"><span className="animate-spin inline-block">⏳</span></p>
                  <p className={`text-sm font-bold ${c.text}`}>Regenerating Stage 4 with campaign context…</p>
                  <p className={`text-xs ${c.textMuted} mt-1`}>Building a fact-based public post from your documented campaign history</p>
                </div>
              );
              return (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <h4 className={`font-bold ${c.text}`}>Stage 4: Public Pressure Campaign</h4>
                    {isRegenerated && <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isDark ? 'bg-sky-900/40 text-sky-300' : 'bg-sky-50 text-sky-700'}`}>🔄 Context-aware</span>}
                  </div>
                  {s.social_media_post && (
                    <div className={`rounded-xl p-5 border ${isDark ? 'bg-zinc-700/30 border-zinc-600' : 'bg-slate-50 border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <p className={`text-xs font-bold ${c.textMuted}`}>X / TWITTER POST</p>
                        <CopyBtn content={s.social_media_post} label="Copy" />
                      </div>
                      <p className={`text-sm ${c.text} leading-relaxed`}>{s.social_media_post}</p>
                      <p className={`text-xs ${c.textMuted} mt-2`}>{s.social_media_post.length} characters</p>
                    </div>
                  )}
                  {s.social_media_long && (
                    <div className={`rounded-xl p-5 border ${isDark ? 'bg-zinc-700/30 border-zinc-600' : 'bg-slate-50 border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <p className={`text-xs font-bold ${c.textMuted}`}>DETAILED POST (Facebook / LinkedIn / Reddit)</p>
                        <CopyBtn content={s.social_media_long} label="Copy" />
                      </div>
                      <div className={`whitespace-pre-wrap text-sm ${c.textSec} leading-relaxed`}>{s.social_media_long}</div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {s.platforms_to_target?.length > 0 && (
                      <div className={`p-4 rounded-lg ${stageColors('pink', 'bg')} border ${stageColors('pink', 'border')}`}>
                        <p className={`text-xs font-bold ${stageColors('pink', 'accent')} mb-2`}>POST ON</p>
                        {s.platforms_to_target.map((p, i) => <p key={i} className={`text-sm ${c.textSec}`}>• {p}</p>)}
                      </div>
                    )}
                    {s.review_sites?.length > 0 && (
                      <div className={`p-4 rounded-lg ${stageColors('pink', 'bg')} border ${stageColors('pink', 'border')}`}>
                        <p className={`text-xs font-bold ${stageColors('pink', 'accent')} mb-2`}>LEAVE REVIEWS ON</p>
                        {s.review_sites.map((r, i) => <p key={i} className={`text-sm ${c.textSec}`}>• {r}</p>)}
                      </div>
                    )}
                  </div>
                  {s.hashtags?.length > 0 && <div className="flex flex-wrap gap-2">{s.hashtags.map((h, i) => <span key={i} className={`px-2 py-1 rounded-full text-xs font-medium ${stageColors('pink', 'badge')}`}>{h}</span>)}</div>}
                  {s.media_tip && <div className={`p-3 rounded-lg ${c.cardAlt}`}><p className={`text-xs font-bold ${c.textMuted} mb-1`}>📺 MEDIA TIP</p><p className={`text-sm ${c.textSec}`}>{s.media_tip}</p></div>}
                  <StageActionBar stageNum={4} sentLabel="Mark as Posted" nextStage={5} />
                </div>
              );
            })()}

            {/* Stage 5: Financial & Legal */}
            {activeStage === 5 && results.escalation_stages?.stage_5_financial_legal && (() => {
              const s = getStageData('stage_5_financial_legal', results.escalation_stages.stage_5_financial_legal);
              const isRegenerated = !!regeneratedStages['stage_5_financial_legal'];
              if (regenerating === 5) return (
                <div className={`p-8 text-center ${c.cardAlt} rounded-xl`}>
                  <p className="text-lg mb-2"><span className="animate-spin inline-block">⏳</span></p>
                  <p className={`text-sm font-bold ${c.text}`}>Regenerating Stage 5 with campaign context…</p>
                  <p className={`text-xs ${c.textMuted} mt-1`}>Building your legal case from documented campaign evidence</p>
                </div>
              );
              return (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <h4 className={`font-bold ${c.text}`}>Stage 5: Financial & Legal Remedies</h4>
                    {isRegenerated && <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isDark ? 'bg-sky-900/40 text-sky-300' : 'bg-sky-50 text-sky-700'}`}>🔄 Context-aware</span>}
                  </div>
                  {s.chargeback?.applicable && (
                    <div className={`p-5 rounded-xl border ${stageColors('red', 'border')} ${stageColors('red', 'bg')}`}>
                      <p className={`text-xs font-bold ${stageColors('red', 'accent')} mb-2`}>💳 CREDIT CARD CHARGEBACK</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                        {s.chargeback.reason_code && <div><p className={`text-xs ${c.textMuted}`}>Reason Code</p><p className={`text-sm font-semibold ${c.text}`}>{s.chargeback.reason_code}</p></div>}
                        {s.chargeback.time_window && <div><p className={`text-xs ${c.textMuted}`}>Time Window</p><p className={`text-sm font-semibold ${c.text}`}>{s.chargeback.time_window}</p></div>}
                      </div>
                      {s.chargeback.how_to_file && <p className={`text-sm ${c.textSec} mb-2`}><strong>How to file:</strong> {s.chargeback.how_to_file}</p>}
                      {s.chargeback.documentation_needed && <p className={`text-sm ${c.textSec} mb-2`}><strong>Documentation:</strong> {s.chargeback.documentation_needed}</p>}
                      {s.chargeback.success_likelihood && <p className={`text-sm ${c.textSec}`}><strong>Likelihood:</strong> {s.chargeback.success_likelihood}</p>}
                    </div>
                  )}
                  {s.small_claims?.applicable && (
                    <div className={`p-5 rounded-xl border ${c.border} ${c.cardAlt}`}>
                      <p className={`text-xs font-bold ${stageColors('red', 'accent')} mb-2`}>⚖️ SMALL CLAIMS COURT</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                        {s.small_claims.filing_fee_range && <div><p className={`text-xs ${c.textMuted}`}>Filing Fee</p><p className={`text-sm font-semibold ${c.text}`}>{s.small_claims.filing_fee_range}</p></div>}
                        {s.small_claims.max_claim_amount && <div><p className={`text-xs ${c.textMuted}`}>Max Claim</p><p className={`text-sm font-semibold ${c.text}`}>{s.small_claims.max_claim_amount}</p></div>}
                        {s.small_claims.jurisdiction && <div><p className={`text-xs ${c.textMuted}`}>Jurisdiction</p><p className={`text-sm font-semibold ${c.text}`}>{s.small_claims.jurisdiction}</p></div>}
                      </div>
                      {s.small_claims.typical_outcome && <p className={`text-sm ${c.textSec} mb-1`}><strong>Typical outcome:</strong> {s.small_claims.typical_outcome}</p>}
                      {s.small_claims.company_response && <p className={`text-sm ${c.textSec}`}><strong>Company usually:</strong> {s.small_claims.company_response}</p>}
                    </div>
                  )}
                  {s.attorney_general?.applicable && (
                    <div className={`p-5 rounded-xl border ${c.border} ${c.cardAlt}`}>
                      <p className={`text-xs font-bold ${stageColors('red', 'accent')} mb-2`}>🏛️ STATE ATTORNEY GENERAL</p>
                      {s.attorney_general.how_to_file && <p className={`text-sm ${c.textSec} mb-1`}><strong>How to file:</strong> {s.attorney_general.how_to_file}</p>}
                      {s.attorney_general.what_it_triggers && <p className={`text-sm ${c.textSec}`}><strong>What it triggers:</strong> {s.attorney_general.what_it_triggers}</p>}
                    </div>
                  )}
                  <StageActionBar stageNum={5} sentLabel="Mark as Filed" nextStage={null} />
                </div>
              );
            })()}

            {/* Next Stage Nudge */}
            {activeStage < 5 && !getStageStatus(activeStage) && (
              <div className="flex justify-end mt-4">
                <button onClick={() => setActiveStage(activeStage + 1)} className={`flex items-center gap-1.5 text-sm font-medium ${c.textSec} transition-colors`}>
                  Preview Stage {activeStage + 1} <span>→</span>
                </button>
              </div>
            )}
          </div>

          {/* Timeline */}
          {results.timeline && (
            <div className={`${c.card} border ${c.border} rounded-xl shadow-lg p-6`}>
              <h3 className={`font-bold ${c.text} mb-4 flex items-center gap-2`}><span>⏰</span> Campaign Timeline</h3>
              <div className="relative pl-6">
                <div className={`absolute left-2 top-0 bottom-0 w-0.5 ${isDark ? 'bg-zinc-700' : 'bg-gray-200'}`} />
                {Object.entries(results.timeline).map(([key, value], idx) => (
                  <div key={key} className="relative mb-4 last:mb-0">
                    <div className={`absolute -left-4 top-1 w-3 h-3 rounded-full border-2 ${idx === 0 ? 'bg-green-500 border-green-300' : (isDark ? 'bg-zinc-600 border-zinc-500' : 'bg-gray-300 border-gray-200')}`} />
                    <p className={`text-xs font-bold uppercase tracking-wide ${idx === 0 ? (isDark ? 'text-green-400' : 'text-green-600') : c.textMuted} mb-0.5`}>{key.replace(/_/g, ' ')}</p>
                    <p className={`text-sm ${c.textSec}`}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Tips */}
          {results.quick_tips?.length > 0 && (
            <div className={`${c.card} border ${c.border} rounded-xl shadow-lg p-6`}>
              <h3 className={`font-bold ${c.text} mb-3 flex items-center gap-2`}><span>⚡</span> Tactical Tips</h3>
              {results.quick_tips.map((tip, idx) => <p key={idx} className={`text-sm ${c.textSec} mb-2`}>• {tip}</p>)}
            </div>
          )}

          {/* Call Script */}
          {results.call_script && (
            <div className={`${c.card} border ${c.border} rounded-xl shadow-lg p-6`}>
              <button onClick={() => setShowCallScript(!showCallScript)} className={`w-full flex items-center justify-between ${c.text}`}>
                <h3 className="font-bold flex items-center gap-2"><span>📞</span> If They Call You (Phone Script)</h3>
                {showCallScript ? <span>▲</span> : <span>▼</span>}
              </button>
              {showCallScript && (
                <div className="space-y-4 mt-4">
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-sky-900/15 border border-sky-800/40' : 'bg-sky-50 border border-sky-100'}`}>
                    <p className={`text-xs font-bold ${isDark ? 'text-sky-400' : 'text-sky-700'} mb-1`}>📋 OPEN WITH</p>
                    <p className={`text-sm ${c.text} leading-relaxed`}>{results.call_script.opening}</p>
                  </div>

                  {results.call_script.key_phrases?.length > 0 && (
                    <div>
                      <p className={`text-xs font-bold ${isDark ? 'text-green-400' : 'text-green-700'} mb-2`}>✅ KEY PHRASES TO USE</p>
                      {results.call_script.key_phrases.map((phrase, i) => (
                        <div key={i} className={`flex items-start gap-2 mb-2 p-2 rounded-lg ${isDark ? 'bg-green-900/10' : 'bg-green-50/50'}`}>
                          <span className="text-xs mt-0.5">💬</span>
                          <p className={`text-sm italic ${c.text}`}>"{phrase}"</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {results.call_script.things_to_avoid_saying?.length > 0 && (
                    <div>
                      <p className={`text-xs font-bold ${isDark ? 'text-red-400' : 'text-red-700'} mb-2`}>🚫 NEVER SAY</p>
                      {results.call_script.things_to_avoid_saying.map((phrase, i) => (
                        <div key={i} className={`flex items-start gap-2 mb-2 p-2 rounded-lg ${isDark ? 'bg-red-900/10' : 'bg-red-50/50'}`}>
                          <span className="text-xs mt-0.5">✕</span>
                          <p className={`text-sm ${c.textSec}`}>"{phrase}"</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {results.call_script.redirect_to_writing && (
                    <div className={`p-4 rounded-xl border ${c.border} ${c.cardAlt}`}>
                      <p className={`text-xs font-bold ${c.textMuted} mb-1`}>📝 REDIRECT TO WRITING</p>
                      <p className={`text-sm italic ${c.text}`}>"{results.call_script.redirect_to_writing}"</p>
                      <p className={`text-xs ${c.textMuted} mt-1`}>Companies prefer phone calls because there's no paper trail. Always redirect.</p>
                    </div>
                  )}

                  {results.call_script.if_they_pressure && (
                    <div className={`p-4 rounded-xl ${isDark ? 'bg-amber-900/15 border border-amber-800/40' : 'bg-amber-50 border border-amber-100'}`}>
                      <p className={`text-xs font-bold ${isDark ? 'text-amber-400' : 'text-amber-700'} mb-1`}>⚡ IF THEY PRESSURE YOU</p>
                      <p className={`text-sm italic ${c.text}`}>"{results.call_script.if_they_pressure}"</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Campaign Context Summary */}
          {getCampaignEntries().length > 0 && (
            <div className={`${c.card} border ${c.border} rounded-xl shadow-lg p-6`}>
              <button onClick={() => toggleSection('campaign')} className={`w-full flex items-center justify-between ${c.text}`}>
                <h3 className="font-bold flex items-center gap-2"><span>📜</span> Campaign Log ({getCampaignEntries().length} stage{getCampaignEntries().length !== 1 ? 's' : ''})</h3>
                {expandedSections.campaign ? <span>▲</span> : <span>▼</span>}
              </button>
              {expandedSections.campaign && (
                <div className="space-y-3 mt-4">
                  {getCampaignEntries().sort((a, b) => a.stage - b.stage).map(entry => {
                    const stg = stageConfig[entry.stage - 1];
                    return (
                      <div key={entry.stage} className={`p-3 rounded-xl border ${c.border}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span>{stg?.icon || '📨'}</span>
                          <p className={`text-sm font-bold ${c.text}`}>Stage {entry.stage}: {stg?.label || 'Unknown'}</p>
                          {entry.sentDate && <span className={`text-xs ${c.textMuted}`}>Sent {new Date(entry.sentDate).toLocaleDateString()}</span>}
                          {entry.outcome && <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            entry.outcome === 'resolved' ? (isDark ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-700')
                              : (isDark ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-700')
                          }`}>{entry.outcome}</span>}
                        </div>
                        {entry.companyResponse && (
                          <p className={`text-xs ${c.textSec} mt-1`}>📨 Response: {entry.companyResponse.slice(0, 120)}…</p>
                        )}
                        {entry.analysisResult?.recommendation && (
                          <p className={`text-xs ${c.textMuted} mt-0.5`}>AI said: {entry.analysisResult.recommendation} — {entry.analysisResult.assessment?.slice(0, 100)}…</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Cross-references */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <a href="/PlainTalk" target="_blank" rel="noopener noreferrer" className={`${c.card} border ${c.border} rounded-xl p-4 flex items-center gap-3 hover:shadow-md transition-shadow`}>
              <span className="text-xl">📖</span>
              <div className="flex-1"><p className={`text-sm font-bold ${c.text}`}>PlainTalk</p><p className={`text-xs ${c.textMuted}`}>Decode confusing company responses</p></div>
              <span className={c.textMuted}>→</span>
            </a>
            <a href="/DecisionCoach" target="_blank" rel="noopener noreferrer" className={`${c.card} border ${c.border} rounded-xl p-4 flex items-center gap-3 hover:shadow-md transition-shadow`}>
              <span className="text-xl">🧭</span>
              <div className="flex-1"><p className={`text-sm font-bold ${c.text}`}>Decision Coach</p><p className={`text-xs ${c.textMuted}`}>Unsure whether to escalate or accept?</p></div>
              <span className={c.textMuted}>→</span>
            </a>
            <a href="/BillGuiltEraser" target="_blank" rel="noopener noreferrer" className={`${c.card} border ${c.border} rounded-xl p-4 flex items-center gap-3 hover:shadow-md transition-shadow`}>
              <span className="text-xl">💳</span>
              <div className="flex-1"><p className={`text-sm font-bold ${c.text}`}>Bill Guilt Eraser</p><p className={`text-xs ${c.textMuted}`}>Analyze unfair charges and billing</p></div>
              <span className={c.textMuted}>→</span>
            </a>
          </div>

          {/* Disclaimer */}
          <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-zinc-800/50' : 'bg-gray-50'}`}>
            <p className={`text-xs ${c.textMuted}`}>⚖️ This tool provides strategic guidance for consumer complaints. It does not constitute legal advice. Consult an attorney for specific legal questions. All letters and complaints should be reviewed for accuracy before sending.</p>
          </div>
        </div>
      )}
    </div>
  );
};

ComplaintEscalationWriter.displayName = 'ComplaintEscalationWriter';
export default ComplaintEscalationWriter;
