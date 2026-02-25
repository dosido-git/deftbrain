import React, { useState, useCallback, useMemo, useRef } from 'react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';
import { CopyBtn, ActionBar } from '../components/ActionButtons';

// ════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════
const BILL_TYPES = [
  { value: 'medical', label: 'Medical', emoji: '🏥' },
  { value: 'credit_card', label: 'Credit Card', emoji: '💳' },
  { value: 'utilities', label: 'Utilities', emoji: '⚡' },
  { value: 'student_loans', label: 'Student Loans', emoji: '🎓' },
  { value: 'rent', label: 'Rent / Housing', emoji: '🏠' },
  { value: 'auto', label: 'Auto / Car', emoji: '🚗' },
  { value: 'phone_internet', label: 'Phone / Internet', emoji: '📱' },
  { value: 'insurance', label: 'Insurance', emoji: '🛡️' },
  { value: 'taxes', label: 'Taxes', emoji: '📋' },
  { value: 'other', label: 'Other', emoji: '📄' },
];

const OVERDUE_STATUS = [
  { value: 'current', label: 'Current', emoji: '🟢' },
  { value: '30_days', label: '30 days', emoji: '🟡' },
  { value: '60_days', label: '60 days', emoji: '🟠' },
  { value: '90_plus', label: '90+ days', emoji: '🔴' },
  { value: 'collections', label: 'Collections', emoji: '⚫' },
  { value: 'unknown', label: "Don't know", emoji: '❓' },
];

const REASONS = [
  { value: 'cant_afford', label: "Can't afford it" },
  { value: 'lost_job', label: 'Lost my job' },
  { value: 'medical_emergency', label: 'Medical emergency' },
  { value: 'reduced_hours', label: 'Reduced income' },
  { value: 'forgot', label: 'Forgot / overwhelmed' },
  { value: 'disputing', label: 'Disputing the charges' },
  { value: 'dont_understand', label: "Don't understand the bill" },
  { value: 'too_scared', label: 'Too scared to deal with it' },
];

const CURRENCIES = ['$', '€', '£', '¥', '₹', 'R$', 'A$', 'C$', 'CHF', 'kr'];

function detectCurrency() {
  try {
    const l = (navigator.language || 'en-US').toLowerCase();
    const map = { 'en-us': '$', 'en-gb': '£', 'en-au': 'A$', 'en-ca': 'C$', 'en-in': '₹', 'pt-br': 'R$', 'de-ch': 'CHF', 'sv': 'kr', de: '€', fr: '€', es: '€', it: '€' };
    return map[l] || map[l.split('-')[0]] || '$';
  } catch { return '$'; }
}

const STORE_PLANS = 'br-plans';
const STORE_LOGS = 'br-logs';
const MAX_PLANS = 20;
const MAX_LOGS = 50;

function loadStore(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}
function saveStore(key, items, max) {
  try { localStorage.setItem(key, JSON.stringify(items.slice(0, max))); } catch {}
}

const CROSS_REFS = [
  { id: 'MoneyMoves', icon: '💰', label: 'Practice money conversations' },
  { id: 'CrisisPrioritizer', icon: '🚨', label: 'Prioritize when everything feels urgent' },
];

const billTypeLabel = (val) => BILL_TYPES.find(b => b.value === val)?.label || val;
const billTypeEmoji = (val) => BILL_TYPES.find(b => b.value === val)?.emoji || '📄';

// ════════════════════════════════════════════════════════════
// SECTION COMPONENT
// ════════════════════════════════════════════════════════════
function Section({ icon, title, badge, badgeColor, children, defaultOpen = false, c }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`${c.card} border rounded-xl overflow-hidden`}>
      <button onClick={() => setOpen(p => !p)}
        className="w-full p-4 flex items-center justify-between text-left min-h-[44px]">
        <div className="flex items-center gap-2.5">
          {icon && <span className="text-sm">{icon}</span>}
          <h3 className={`text-sm font-bold ${c.text}`}>{title}</h3>
          {badge && <span className={`text-[9px] font-black px-2 py-0.5 rounded ${badgeColor || c.accentBg}`}>{badge}</span>}
        </div>
        <span className={`text-xs ${c.textMuted}`}>{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className={`px-4 pb-4 border-t ${c.divider} pt-3 space-y-3`}>{children}</div>}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// IMAGE COMPRESSION
// ════════════════════════════════════════════════════════════
function compressImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) { reject(new Error('Invalid file')); return; }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Read failed'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Load failed'));
      img.onload = () => {
        try {
          let w = img.width, h = img.height;
          const max = 1024;
          if (w > max || h > max) {
            if (w > h) { h = Math.round((h / w) * max); w = max; }
            else { w = Math.round((w / h) * max); h = max; }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, w, h);
          let dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          if (Math.round((dataUrl.length * 0.75) / 1024) > 800) {
            dataUrl = canvas.toDataURL('image/jpeg', 0.6);
          }
          resolve(dataUrl);
        } catch (err) { reject(err); }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// ════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════
const BillRescue = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const billPhotoRef = useRef(null);

  const c = {
    card: isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-slate-200',
    input: isDark
      ? 'bg-zinc-900 border-zinc-600 text-zinc-50 placeholder:text-zinc-500 focus:border-teal-500 focus:ring-teal-500/20'
      : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:ring-teal-100',
    text: isDark ? 'text-zinc-50' : 'text-slate-900',
    textSec: isDark ? 'text-zinc-400' : 'text-slate-600',
    textMuted: isDark ? 'text-zinc-500' : 'text-slate-500',
    label: isDark ? 'text-zinc-300' : 'text-slate-700',
    accent: isDark ? 'text-teal-400' : 'text-teal-600',
    accentBg: isDark ? 'bg-teal-900/30 border-teal-700/50' : 'bg-teal-50 border-teal-200',
    btnPrimary: isDark ? 'bg-teal-600 hover:bg-teal-500 text-white' : 'bg-teal-600 hover:bg-teal-700 text-white',
    btnSec: isDark ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-100' : 'bg-slate-100 hover:bg-slate-200 text-slate-800',
    danger: isDark ? 'bg-red-900/20 border-red-700/50 text-red-200' : 'bg-red-50 border-red-200 text-red-800',
    dangerText: isDark ? 'text-red-400' : 'text-red-600',
    success: isDark ? 'bg-emerald-900/20 border-emerald-700/50 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-800',
    successText: isDark ? 'text-emerald-400' : 'text-emerald-600',
    warning: isDark ? 'bg-amber-900/20 border-amber-700/50 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-800',
    warningText: isDark ? 'text-amber-400' : 'text-amber-600',
    info: isDark ? 'bg-blue-900/20 border-blue-700/50 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-800',
    purple: isDark ? 'bg-purple-900/20 border-purple-700/50 text-purple-200' : 'bg-purple-50 border-purple-200 text-purple-800',
    pillActive: isDark ? 'bg-teal-600 border-teal-500 text-white' : 'bg-teal-600 border-teal-600 text-white',
    pillInactive: isDark ? 'bg-zinc-700 border-zinc-600 text-zinc-300 hover:border-zinc-500' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300',
    divider: isDark ? 'border-zinc-700' : 'border-slate-200',
    quoteBg: isDark ? 'bg-zinc-900/60' : 'bg-slate-50',
    dropzone: isDark ? 'border-zinc-600 bg-zinc-800/50 hover:border-teal-500' : 'border-slate-300 bg-slate-50 hover:border-teal-400',
  };

  // ── View ──
  const [view, setView] = useState('rescue');
  const [error, setError] = useState('');

  // ── Rescue form ──
  const [billType, setBillType] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(() => detectCurrency());
  const [overdueStatus, setOverdueStatus] = useState('');
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [canAffordMonthly, setCanAffordMonthly] = useState('');
  const [pastedBill, setPastedBill] = useState('');
  const [billImagePreview, setBillImagePreview] = useState(null);
  const [billImageBase64, setBillImageBase64] = useState(null);
  const [compressingImage, setCompressingImage] = useState(false);
  const [results, setResults] = useState(null);

  // ── Triage ──
  const [triageBills, setTriageBills] = useState([
    { type: '', amount: '', overdue: '', note: '' },
    { type: '', amount: '', overdue: '', note: '' },
  ]);
  const [triageBudget, setTriageBudget] = useState('');
  const [triageResults, setTriageResults] = useState(null);

  // ── Persistence ──
  const [savedPlans, setSavedPlans] = useState(() => loadStore(STORE_PLANS));
  const [callLogs, setCallLogs] = useState(() => loadStore(STORE_LOGS));

  // ── Call log form ──
  const [logPlanId, setLogPlanId] = useState(null);
  const [logOutcome, setLogOutcome] = useState('');
  const [logRepName, setLogRepName] = useState('');
  const [logConfNum, setLogConfNum] = useState('');
  const [logAgreed, setLogAgreed] = useState('');
  const [logNotes, setLogNotes] = useState('');
  const [logNextDate, setLogNextDate] = useState('');

  // ── Quick Check ──
  const [qcCharge, setQcCharge] = useState('');
  const [qcAmount, setQcAmount] = useState('');
  const [qcType, setQcType] = useState('');
  const [qcResults, setQcResults] = useState(null);

  // ── Rehearsal ──
  const [rhSituation, setRhSituation] = useState('');
  const [rhType, setRhType] = useState('');
  const [rhMessage, setRhMessage] = useState('');
  const [rhDifficulty, setRhDifficulty] = useState('normal');
  const [rhHistory, setRhHistory] = useState([]); // { role, content, parsed }
  const [rhActive, setRhActive] = useState(false);

  // ── Victories ──
  const [victories, setVictories] = useState(() => loadStore('br-victories'));
  const [vicText, setVicText] = useState('');
  const [vicAmount, setVicAmount] = useState('');
  const [vicType, setVicType] = useState('');

  // ── Letter Generator ──
  const [ltType, setLtType] = useState('');
  const [ltBillType, setLtBillType] = useState('');
  const [ltAmount, setLtAmount] = useState('');
  const [ltSituation, setLtSituation] = useState('');
  const [ltContext, setLtContext] = useState('');
  const [ltResults, setLtResults] = useState(null);

  // ── Image handler ──
  const handleBillPhoto = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Please upload an image'); return; }
    setCompressingImage(true);
    try {
      const compressed = await compressImageFile(file);
      setBillImageBase64(compressed);
      setBillImagePreview(compressed);
    } catch (err) {
      setError('Image processing failed');
    } finally {
      setCompressingImage(false);
    }
  }, []);

  // ── Analyze bill ──
  const analyze = useCallback(async () => {
    if (!billType) { setError('Please select a bill type.'); return; }
    setError('');
    setResults(null);
    try {
      const data = await callToolEndpoint('bill-rescue', {
        billType,
        amount: amount ? Number(amount) : null,
        currency,
        overdueStatus: overdueStatus || 'unknown',
        reason: reason || 'cant_afford',
        details: details.trim() || null,
        canAffordMonthly: canAffordMonthly ? Number(canAffordMonthly) : null,
        pastedBill: pastedBill.trim() || null,
        billImageBase64: billImageBase64 || null,
      });
      setResults(data);
    } catch (err) {
      setError(err.message || 'Analysis failed');
    }
  }, [billType, amount, currency, overdueStatus, reason, details, canAffordMonthly, pastedBill, billImageBase64, callToolEndpoint]);

  // ── Triage ──
  const runTriage = useCallback(async () => {
    const valid = triageBills.filter(b => b.type);
    if (valid.length < 2) { setError('Add at least 2 bills for triage.'); return; }
    setError('');
    setTriageResults(null);
    try {
      const data = await callToolEndpoint('bill-rescue/triage', {
        bills: valid,
        totalMonthlyBudget: triageBudget ? Number(triageBudget) : null,
        currency,
      });
      setTriageResults(data);
    } catch (err) {
      setError(err.message || 'Triage failed');
    }
  }, [triageBills, triageBudget, currency, callToolEndpoint]);

  // ── Save plan ──
  const savePlan = useCallback(() => {
    if (!results) return;
    const plan = {
      id: Date.now(),
      billType,
      amount: amount || null,
      currency,
      overdueStatus,
      reason,
      results,
      date: new Date().toISOString(),
      status: 'pending', // pending | in_progress | resolved
    };
    const updated = [plan, ...savedPlans].slice(0, MAX_PLANS);
    setSavedPlans(updated);
    saveStore(STORE_PLANS, updated, MAX_PLANS);
  }, [results, billType, amount, currency, overdueStatus, reason, savedPlans]);

  const removePlan = useCallback((id) => {
    const updated = savedPlans.filter(p => p.id !== id);
    setSavedPlans(updated);
    saveStore(STORE_PLANS, updated, MAX_PLANS);
  }, [savedPlans]);

  const updatePlanStatus = useCallback((id, status) => {
    const updated = savedPlans.map(p => p.id === id ? { ...p, status } : p);
    setSavedPlans(updated);
    saveStore(STORE_PLANS, updated, MAX_PLANS);
  }, [savedPlans]);

  // ── Call log ──
  const addCallLog = useCallback(() => {
    if (!logOutcome) return;
    const log = {
      id: Date.now(),
      planId: logPlanId,
      outcome: logOutcome,
      repName: logRepName.trim() || null,
      confirmationNumber: logConfNum.trim() || null,
      agreed: logAgreed.trim() || null,
      notes: logNotes.trim() || null,
      nextFollowUp: logNextDate || null,
      date: new Date().toISOString(),
    };
    const updated = [log, ...callLogs].slice(0, MAX_LOGS);
    setCallLogs(updated);
    saveStore(STORE_LOGS, updated, MAX_LOGS);
    // Reset form
    setLogOutcome(''); setLogRepName(''); setLogConfNum('');
    setLogAgreed(''); setLogNotes(''); setLogNextDate('');
    setLogPlanId(null);
    // Update plan status
    if (logPlanId) {
      const newStatus = logOutcome === 'accepted' || logOutcome === 'settled' ? 'resolved' : 'in_progress';
      updatePlanStatus(logPlanId, newStatus);
    }
  }, [logPlanId, logOutcome, logRepName, logConfNum, logAgreed, logNotes, logNextDate, callLogs, updatePlanStatus]);

  const removeLog = useCallback((id) => {
    const updated = callLogs.filter(l => l.id !== id);
    setCallLogs(updated);
    saveStore(STORE_LOGS, updated, MAX_LOGS);
  }, [callLogs]);

  // ── Triage helpers ──
  const updateTriageBill = (idx, field, val) => {
    setTriageBills(p => p.map((b, i) => i === idx ? { ...b, [field]: val } : b));
  };
  const addTriageBill = () => setTriageBills(p => [...p, { type: '', amount: '', overdue: '', note: '' }]);
  const removeTriageBill = (idx) => setTriageBills(p => p.filter((_, i) => i !== idx));

  // ── Quick Check ──
  const runQuickCheck = useCallback(async () => {
    if (!qcCharge.trim()) return;
    setError('');
    setQcResults(null);
    try {
      const data = await callToolEndpoint('bill-rescue/quick-check', {
        billType: qcType || null,
        charge: qcCharge.trim(),
        amount: qcAmount ? Number(qcAmount) : null,
        currency,
      });
      setQcResults(data);
    } catch (err) {
      setError(err.message || 'Quick check failed');
    }
  }, [qcCharge, qcType, qcAmount, currency, callToolEndpoint]);

  // ── Rehearsal ──
  const startRehearsal = useCallback(async () => {
    if (!rhSituation.trim()) return;
    setError('');
    setRhHistory([]);
    setRhActive(true);
    try {
      const data = await callToolEndpoint('bill-rescue/rehearse', {
        billType: rhType || null,
        situation: rhSituation.trim(),
        userMessage: rhMessage.trim() || null,
        conversationHistory: [],
        difficulty: rhDifficulty,
        currency,
      });
      const newHistory = [];
      if (rhMessage.trim()) {
        newHistory.push({ role: 'user', content: rhMessage.trim(), parsed: null });
      }
      newHistory.push({ role: 'assistant', content: JSON.stringify(data), parsed: data });
      setRhHistory(newHistory);
      setRhMessage('');
    } catch (err) {
      setError(err.message || 'Rehearsal failed');
      setRhActive(false);
    }
  }, [rhSituation, rhType, rhMessage, rhDifficulty, currency, callToolEndpoint]);

  const continueRehearsal = useCallback(async () => {
    if (!rhMessage.trim()) return;
    setError('');
    const userMsg = rhMessage.trim();
    const updatedHistory = [...rhHistory, { role: 'user', content: userMsg, parsed: null }];
    setRhHistory(updatedHistory);
    setRhMessage('');
    try {
      // Build conversation for API (just role + content)
      const apiHistory = updatedHistory.map(h => ({ role: h.role, content: h.content }));
      const data = await callToolEndpoint('bill-rescue/rehearse', {
        billType: rhType || null,
        situation: rhSituation.trim(),
        userMessage: userMsg,
        conversationHistory: apiHistory.slice(0, -1), // all but the latest user msg
        difficulty: rhDifficulty,
        currency,
      });
      setRhHistory(prev => [...prev, { role: 'assistant', content: JSON.stringify(data), parsed: data }]);
    } catch (err) {
      setError(err.message || 'Rehearsal failed');
    }
  }, [rhMessage, rhHistory, rhType, rhSituation, rhDifficulty, currency, callToolEndpoint]);

  const resetRehearsal = useCallback(() => {
    setRhHistory([]);
    setRhActive(false);
    setRhMessage('');
  }, []);

  // ── Victory helpers ──
  const addVictory = useCallback(() => {
    if (!vicText.trim()) return;
    const vic = {
      id: Date.now(),
      text: vicText.trim(),
      amount: vicAmount ? Number(vicAmount) : 0,
      type: vicType || 'other',
      date: new Date().toISOString(),
    };
    const updated = [vic, ...victories].slice(0, 50);
    setVictories(updated);
    saveStore('br-victories', updated, 50);
    setVicText(''); setVicAmount(''); setVicType('');
  }, [vicText, vicAmount, vicType, victories]);

  const removeVictory = useCallback((id) => {
    const updated = victories.filter(v => v.id !== id);
    setVictories(updated);
    saveStore('br-victories', updated, 50);
  }, [victories]);

  const totalSaved = useMemo(() => victories.reduce((sum, v) => sum + (v.amount || 0), 0), [victories]);

  // ── Letter Generator ──
  const generateLetter = useCallback(async () => {
    if (!ltType) return;
    setError('');
    setLtResults(null);
    try {
      const data = await callToolEndpoint('bill-rescue/letter', {
        letterType: ltType,
        billType: ltBillType || null,
        amount: ltAmount ? Number(ltAmount) : null,
        currency,
        situation: ltSituation.trim() || null,
        additionalContext: ltContext.trim() || null,
      });
      setLtResults(data);
    } catch (err) {
      setError(err.message || 'Letter generation failed');
    }
  }, [ltType, ltBillType, ltAmount, currency, ltSituation, ltContext, callToolEndpoint]);

  // ── Bill Calendar data ──
  const calendarData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const items = [];

    // From saved plans
    savedPlans.forEach(plan => {
      items.push({
        id: plan.id,
        type: 'plan',
        label: `${billTypeEmoji(plan.billType)} ${billTypeLabel(plan.billType)}${plan.amount ? ` — ${plan.currency}${plan.amount}` : ''}`,
        status: plan.status,
        date: plan.date,
      });
    });

    // From call logs with follow-ups
    callLogs.forEach(log => {
      if (log.nextFollowUp) {
        items.push({
          id: log.id,
          type: 'followup',
          label: `📞 Follow up: ${log.agreed || log.notes || log.outcome}`,
          status: new Date(log.nextFollowUp) < now ? 'overdue' : 'upcoming',
          date: log.nextFollowUp,
        });
      }
    });

    return items.sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [savedPlans, callLogs]);

  // ── Reset ──
  const handleReset = useCallback(() => {
    setBillType(''); setAmount(''); setOverdueStatus(''); setReason('');
    setDetails(''); setCanAffordMonthly(''); setPastedBill('');
    setBillImagePreview(null); setBillImageBase64(null);
    setResults(null); setError('');
  }, []);

  // ── Build text for copy/print ──
  const buildPlanText = useCallback(() => {
    if (!results) return '';
    const r = results;
    let t = `BILL RESCUE PLAN — ${billTypeLabel(billType)}\n`;
    t += `${amount ? `Amount: ${currency}${amount}` : ''} | Status: ${overdueStatus || 'unknown'}\n`;
    t += `${'═'.repeat(40)}\n\n`;

    if (r.shame_to_action) {
      t += `💚 ${r.shame_to_action.reframe}\n`;
      if (r.shame_to_action.micro_step) t += `\n📌 First step: ${r.shame_to_action.micro_step}\n`;
      t += '\n';
    }
    if (r.bill_autopsy) {
      t += `🔍 BILL AUTOPSY: ${r.bill_autopsy.verdict}\n${r.bill_autopsy.analysis}\n`;
      r.bill_autopsy.flagged_charges?.forEach(f => { t += `  ⚠️ ${f.charge}: ${f.issue}\n`; });
      t += '\n';
    }
    if (r.know_your_rights?.length) {
      t += '⚖️ YOUR RIGHTS:\n';
      r.know_your_rights.forEach(right => { t += `• ${right.right}: ${right.explanation}\n`; });
      t += '\n';
    }
    if (r.action_steps?.length) {
      t += '📋 ACTION STEPS:\n';
      r.action_steps.forEach((s, i) => {
        t += `${i + 1}. ${s.title}: ${s.action}\n`;
        if (s.script) t += `   Say: "${s.script}"\n`;
        if (s.when) t += `   When: ${s.when}\n`;
      });
      t += '\n';
    }
    if (r.phone_script) {
      t += '📞 PHONE SCRIPT:\n';
      if (r.phone_script.opening) t += `Opening: "${r.phone_script.opening}"\n`;
      r.phone_script.key_phrases?.forEach(p => { t += `• "${p}"\n`; });
      if (r.phone_script.if_they_say_no) t += `If they say no: ${r.phone_script.if_they_say_no}\n`;
      t += '\n';
    }
    if (r.payment_plan) {
      t += '💵 PAYMENT PLAN:\n';
      t += `Strategy: ${r.payment_plan.strategy}\n`;
      if (r.payment_plan.offer_amount) t += `Offer: ${r.payment_plan.offer_amount}\n`;
      if (r.payment_plan.script) t += `Say: "${r.payment_plan.script}"\n`;
      t += '\n';
    }
    if (r.escalation_ladder?.length) {
      t += '📈 ESCALATION LADDER:\n';
      r.escalation_ladder.forEach((l, i) => { t += `${i + 1}. ${l.who}: ${l.what_to_say}\n`; });
      t += '\n';
    }
    if (r.collections_defense) {
      t += '🛡️ COLLECTIONS DEFENSE:\n';
      t += `${r.collections_defense.overview}\n`;
      if (r.collections_defense.validation_letter) t += `\nValidation Letter:\n${r.collections_defense.validation_letter}\n`;
      t += '\n';
    }
    if (r.hardship_letter) {
      t += `📝 HARDSHIP LETTER:\n${r.hardship_letter}\n\n`;
    }
    if (r.what_they_wont_tell_you?.length) {
      t += '🤫 INSIDER KNOWLEDGE:\n';
      r.what_they_wont_tell_you.forEach(s => { t += `• ${s}\n`; });
      t += '\n';
    }
    if (r.assistance_programs?.length) {
      t += '💚 ASSISTANCE PROGRAMS:\n';
      r.assistance_programs.forEach(p => { t += `• ${p.program}: ${p.who_qualifies} — ${p.how_to_apply}\n`; });
      t += '\n';
    }
    if (r.worst_case) t += `⚠️ WORST CASE: ${r.worst_case}\n`;
    if (r.worst_case_reassurance) t += `💚 ${r.worst_case_reassurance}\n\n`;
    if (r.follow_up) {
      t += '📅 FOLLOW UP:\n';
      if (r.follow_up.document_this) t += `Document: ${r.follow_up.document_this}\n`;
      if (r.follow_up.calendar_reminder) t += `Reminder: ${r.follow_up.calendar_reminder}\n`;
      t += '\n';
    }
    if (r.permission) t += `💚 ${r.permission}\n`;
    t += '\n— Generated by DeftBrain · deftbrain.com';
    return t;
  }, [results, billType, amount, currency, overdueStatus]);

  const buildTriageText = useCallback(() => {
    if (!triageResults) return '';
    const r = triageResults;
    let t = `BILL TRIAGE — ${r.severity_emoji} ${r.severity}\n`;
    t += `${r.headline}\n\n`;
    if (r.priority_order?.length) {
      t += 'PRIORITY ORDER:\n';
      r.priority_order.forEach(b => {
        t += `${b.rank}. ${b.urgency_emoji} ${b.bill} — ${b.urgency}\n   ${b.why}\n   Action: ${b.recommended_action}\n`;
        if (b.allocate) t += `   Budget: ${b.allocate}\n`;
      });
    }
    if (r.strategy) t += `\nSTRATEGY: ${r.strategy}\n`;
    t += '\n— Generated by DeftBrain · deftbrain.com';
    return t;
  }, [triageResults]);

  // ── Upcoming follow-ups ──
  const upcomingFollowUps = useMemo(() => {
    const now = new Date();
    return callLogs
      .filter(l => l.nextFollowUp && new Date(l.nextFollowUp) >= now)
      .sort((a, b) => new Date(a.nextFollowUp) - new Date(b.nextFollowUp))
      .slice(0, 5);
  }, [callLogs]);

  // ════════════════════════════════════════════════════════════
  // NAV
  // ════════════════════════════════════════════════════════════
  const renderNav = () => (
    <div className="flex flex-wrap gap-1.5 mb-5">
      {[
        { key: 'rescue', label: '🧾 Rescue' },
        { key: 'quick', label: '⚡ Quick Check' },
        { key: 'triage', label: '📊 Triage' },
        { key: 'rehearse', label: '🎭 Rehearse' },
        { key: 'letters', label: '✉️ Letters' },
        { key: 'tracker', label: `📋 Tracker${savedPlans.length ? ` (${savedPlans.length})` : ''}` },
        { key: 'log', label: `📞 Log${callLogs.length ? ` (${callLogs.length})` : ''}` },
        { key: 'calendar', label: '📅 Calendar' },
        { key: 'victories', label: `🏆 Wins${victories.length ? ` (${totalSaved > 0 ? currency + totalSaved.toLocaleString() : victories.length})` : ''}` },
      ].map(tab => (
        <button key={tab.key} onClick={() => { setView(tab.key); setError(''); }}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors min-h-[32px] ${
            view === tab.key ? c.pillActive : c.pillInactive
          }`}>{tab.label}</button>
      ))}
    </div>
  );

  // ════════════════════════════════════════════════════════════
  // RENDER: RESCUE (main form + results)
  // ════════════════════════════════════════════════════════════
  const renderRescue = () => (
    <div className="space-y-4">
      <div className={`${c.card} border rounded-xl p-5`}>
        <div className={`mb-4 pb-3 border-b ${c.divider}`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-base font-black ${c.text}`}>🧾 Bill Rescue</h2>
              <p className={`text-xs ${c.textMuted} mt-0.5`}>Turn bill anxiety into a clear action plan</p>
            </div>
            <select value={currency} onChange={e => setCurrency(e.target.value)}
              className={`py-1 px-2 border rounded-lg text-xs font-bold ${c.input} outline-none`}>
              {CURRENCIES.map(cur => <option key={cur} value={cur}>{cur}</option>)}
            </select>
          </div>
        </div>

        {/* Bill type */}
        <div className="mb-4">
          <label className={`text-xs font-bold ${c.label} block mb-1.5`}>What kind of bill? *</label>
          <div className="flex flex-wrap gap-1.5">
            {BILL_TYPES.map(bt => (
              <button key={bt.value} onClick={() => setBillType(bt.value === billType ? '' : bt.value)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border min-h-[32px] ${
                  billType === bt.value ? c.pillActive : c.pillInactive}`}>
                {bt.emoji} {bt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Amount + Monthly afford */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div>
            <label className={`text-[10px] font-bold ${c.textMuted} block mb-0.5`}>How much?</label>
            <div className="flex items-center gap-1">
              <span className={`text-xs font-bold ${c.textMuted}`}>{currency}</span>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0"
                className={`flex-1 px-2 py-1.5 border rounded-lg text-xs ${c.input} outline-none focus:ring-2`} />
            </div>
          </div>
          <div>
            <label className={`text-[10px] font-bold ${c.textMuted} block mb-0.5`}>Can pay monthly?</label>
            <div className="flex items-center gap-1">
              <span className={`text-xs font-bold ${c.textMuted}`}>{currency}</span>
              <input type="number" value={canAffordMonthly} onChange={e => setCanAffordMonthly(e.target.value)} placeholder="0"
                className={`flex-1 px-2 py-1.5 border rounded-lg text-xs ${c.input} outline-none focus:ring-2`} />
            </div>
          </div>
        </div>

        {/* Overdue status */}
        <div className="mb-4">
          <label className={`text-xs font-bold ${c.label} block mb-1.5`}>How late?</label>
          <div className="flex flex-wrap gap-1.5">
            {OVERDUE_STATUS.map(os => (
              <button key={os.value} onClick={() => setOverdueStatus(os.value === overdueStatus ? '' : os.value)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border min-h-[28px] ${
                  overdueStatus === os.value ? c.pillActive : c.pillInactive}`}>
                {os.emoji} {os.label}
              </button>
            ))}
          </div>
        </div>

        {/* Reason */}
        <div className="mb-4">
          <label className={`text-xs font-bold ${c.label} block mb-1.5`}>Why is this hard?</label>
          <div className="flex flex-wrap gap-1.5">
            {REASONS.map(re => (
              <button key={re.value} onClick={() => setReason(re.value === reason ? '' : re.value)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border min-h-[28px] ${
                  reason === re.value ? c.pillActive : c.pillInactive}`}>
                {re.label}
              </button>
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="mb-3">
          <label className={`text-[10px] font-bold ${c.textMuted} block mb-0.5`}>Anything else?</label>
          <input type="text" value={details} onChange={e => setDetails(e.target.value)}
            placeholder="e.g., They keep calling, I got a court notice, I think they overcharged me..."
            className={`w-full px-3 py-2 border rounded-lg text-xs ${c.input} outline-none focus:ring-2`} />
        </div>

        {/* Bill input: paste OR photo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
          <div>
            <label className={`text-[10px] font-bold ${c.textMuted} block mb-0.5`}>Paste bill text</label>
            <textarea value={pastedBill} onChange={e => setPastedBill(e.target.value)}
              placeholder="Paste charges, line items, EOB..."
              rows={2}
              className={`w-full px-2 py-1.5 border rounded-lg text-xs ${c.input} outline-none focus:ring-2 font-mono`} />
          </div>
          <div>
            <label className={`text-[10px] font-bold ${c.textMuted} block mb-0.5`}>Or upload bill photo</label>
            <input type="file" ref={billPhotoRef} accept="image/*" onChange={handleBillPhoto} className="hidden" />
            {billImagePreview ? (
              <div className="relative">
                <img src={billImagePreview} alt="Bill" className="w-full h-16 object-cover rounded-lg border" />
                <button onClick={() => { setBillImagePreview(null); setBillImageBase64(null); }}
                  className="absolute top-1 right-1 bg-red-600 text-white w-5 h-5 rounded-full text-[10px] flex items-center justify-center">✕</button>
                <p className={`text-[9px] ${c.successText} mt-0.5`}>✅ Bill photo ready</p>
              </div>
            ) : (
              <button onClick={() => billPhotoRef.current?.click()} disabled={compressingImage}
                className={`w-full h-16 border-2 border-dashed rounded-lg flex items-center justify-center text-xs ${c.dropzone}`}>
                {compressingImage ? <span className="animate-spin inline-block">⏳</span> : '📷 Upload bill photo'}
              </button>
            )}
          </div>
        </div>

        <p className={`text-[9px] ${c.textMuted} mb-3`}>Your data stays in this session only — nothing is saved to any server.</p>

        {/* Actions */}
        <div className="flex gap-2">
          <button onClick={analyze} disabled={loading || !billType}
            className={`flex-1 ${c.btnPrimary} disabled:opacity-40 font-bold py-3 rounded-lg flex items-center justify-center gap-2 min-h-[48px]`}>
            {loading ? <><span className="animate-spin inline-block">⏳</span> Working on it...</> : <><span>🧾</span> Get My Action Plan</>}
          </button>
          {results && (
            <button onClick={handleReset} className={`${c.btnSec} px-4 py-3 rounded-lg text-xs font-bold min-h-[48px]`}>
              🔄 New
            </button>
          )}
        </div>
      </div>

      {/* ══════════════ RESULTS ══════════════ */}
      {results && (() => {
        const r = results;
        return (
          <div className="space-y-3">
            {/* Shame-to-action */}
            {r.shame_to_action && (
              <div className={`${c.accentBg} border-2 rounded-xl p-5`}>
                <div className="flex items-start gap-3">
                  <span className="text-lg flex-shrink-0">💚</span>
                  <div>
                    <h3 className={`text-sm font-bold ${c.text} mb-1`}>First: Deep Breath</h3>
                    <p className={`text-sm ${c.textSec}`}>{r.shame_to_action.reframe}</p>
                    {r.shame_to_action.micro_step && (
                      <div className={`mt-3 p-3 rounded-lg ${isDark ? 'bg-teal-900/40' : 'bg-teal-100'}`}>
                        <p className={`text-xs font-bold ${c.accent}`}>📌 Your only step today: {r.shame_to_action.micro_step}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Bill autopsy */}
            {r.bill_autopsy && (
              <Section icon="🔍" title="Bill Autopsy" badge={r.bill_autopsy.verdict} badgeColor={
                r.bill_autopsy.verdict?.toLowerCase().includes('overcharg') || r.bill_autopsy.verdict?.toLowerCase().includes('flag') ? c.danger
                : r.bill_autopsy.verdict?.toLowerCase().includes('fair') ? c.success : c.warning
              } defaultOpen c={c}>
                <p className={`text-sm ${c.textSec}`}>{r.bill_autopsy.analysis}</p>
                {r.bill_autopsy.total_potential_savings && (
                  <div className={`${c.success} border rounded-lg p-3 text-center`}>
                    <p className={`text-xs font-bold ${c.successText}`}>💰 Potential savings: {r.bill_autopsy.total_potential_savings}</p>
                  </div>
                )}
                {r.bill_autopsy.flagged_charges?.length > 0 && (
                  <div className="space-y-2">
                    <p className={`text-[10px] font-bold ${c.dangerText} uppercase`}>Flagged charges:</p>
                    {r.bill_autopsy.flagged_charges.map((flag, i) => (
                      <div key={i} className={`${c.danger} border rounded-lg p-3`}>
                        <p className={`text-xs font-bold ${c.dangerText}`}>{flag.charge}</p>
                        <p className="text-xs">{flag.issue}</p>
                      </div>
                    ))}
                  </div>
                )}
                {r.bill_autopsy.request_itemized && (
                  <p className={`text-xs ${c.textSec}`}>💡 {r.bill_autopsy.request_itemized}</p>
                )}
              </Section>
            )}

            {/* Know your rights */}
            {r.know_your_rights?.length > 0 && (
              <Section icon="⚖️" title="Know Your Rights" defaultOpen c={c}>
                <div className="space-y-2">
                  {r.know_your_rights.map((right, i) => (
                    <div key={i} className={`${c.info} border rounded-lg p-3`}>
                      <p className="text-xs font-bold">{right.right}</p>
                      <p className="text-[10px] mt-1">{right.explanation}</p>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Action steps */}
            {r.action_steps?.length > 0 && (
              <Section icon="📋" title="Step-by-Step Action Plan" defaultOpen c={c}>
                <div className="space-y-3">
                  {r.action_steps.map((step, i) => (
                    <div key={i} className={`${c.quoteBg} rounded-lg p-4 border-l-4 ${isDark ? 'border-teal-500' : 'border-teal-400'}`}>
                      <p className={`text-[10px] font-bold ${c.accent} uppercase mb-1`}>Step {i + 1}: {step.title}</p>
                      <p className={`text-sm ${c.textSec} mb-2`}>{step.action}</p>
                      {step.script && (
                        <div className={`${c.card} border rounded-lg p-3`}>
                          <p className={`text-[10px] font-bold ${c.textMuted} mb-1`}>Say this:</p>
                          <p className={`text-xs ${c.text}`}>"{step.script}"</p>
                          <div className="mt-1.5">
                            <CopyBtn content={step.script} label="Copy" />
                          </div>
                        </div>
                      )}
                      {step.when && <p className={`text-[10px] ${c.textMuted} mt-2`}>⏰ {step.when}</p>}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Payment plan */}
            {r.payment_plan && (
              <Section icon="💵" title="Payment Plan Proposal" c={c}>
                <p className={`text-sm ${c.textSec}`}>{r.payment_plan.strategy}</p>
                {r.payment_plan.offer_amount && (
                  <div className={`${c.success} border rounded-lg p-3`}>
                    <p className={`text-xs font-bold ${c.successText}`}>Offer: {r.payment_plan.offer_amount}</p>
                    {r.payment_plan.they_will_counter && (
                      <p className="text-[10px] mt-1">They'll counter: {r.payment_plan.they_will_counter}</p>
                    )}
                    {r.payment_plan.accept_up_to && (
                      <p className="text-[10px]">Accept up to: {r.payment_plan.accept_up_to}</p>
                    )}
                  </div>
                )}
                {r.payment_plan.script && (
                  <div className={`${c.quoteBg} rounded-lg p-3`}>
                    <p className={`text-[10px] font-bold ${c.textMuted} mb-1`}>Propose this:</p>
                    <p className={`text-xs ${c.text}`}>"{r.payment_plan.script}"</p>
                    <div className="mt-1.5"><CopyBtn content={r.payment_plan.script} label="Copy" /></div>
                  </div>
                )}
              </Section>
            )}

            {/* Phone script */}
            {r.phone_script && (
              <Section icon="📞" title="Phone Call Script" defaultOpen c={c}>
                {r.phone_script.opening && (
                  <div className={`${c.quoteBg} rounded-lg p-3`}>
                    <p className={`text-[10px] font-bold ${c.accent} mb-1`}>Opening:</p>
                    <p className={`text-xs ${c.text}`}>"{r.phone_script.opening}"</p>
                    <div className="mt-1.5"><CopyBtn content={r.phone_script.opening} label="Copy" /></div>
                  </div>
                )}
                {r.phone_script.key_phrases?.length > 0 && (
                  <div>
                    <p className={`text-[10px] font-bold ${c.label} uppercase mb-1.5`}>Magic phrases:</p>
                    {r.phone_script.key_phrases.map((phrase, i) => (
                      <div key={i} className="flex items-center gap-2 mb-1">
                        <p className={`flex-1 text-xs ${c.text}`}>• "{phrase}"</p>
                        <CopyBtn content={phrase} label="" />
                      </div>
                    ))}
                  </div>
                )}
                {r.phone_script.if_they_say_no && (
                  <div className={`${c.warning} border rounded-lg p-3`}>
                    <p className={`text-[10px] font-bold ${c.warningText} mb-1`}>If they say no:</p>
                    <p className="text-xs">{r.phone_script.if_they_say_no}</p>
                  </div>
                )}
              </Section>
            )}

            {/* Escalation ladder */}
            {r.escalation_ladder?.length > 0 && (
              <Section icon="📈" title="Escalation Ladder" c={c}>
                <p className={`text-xs ${c.textMuted} mb-2`}>If the first person says no, climb:</p>
                <div className="space-y-2">
                  {r.escalation_ladder.map((level, i) => (
                    <div key={i} className={`flex items-start gap-3 p-3 rounded-lg ${c.quoteBg}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-black ${
                        isDark ? 'bg-teal-700 text-teal-100' : 'bg-teal-100 text-teal-700'}`}>{i + 1}</div>
                      <div>
                        <p className={`text-xs font-bold ${c.text}`}>{level.who}</p>
                        <p className={`text-[10px] ${c.textSec}`}>{level.what_to_say}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Collections defense */}
            {r.collections_defense && (
              <Section icon="🛡️" title="Collections Defense Kit" badge="IMPORTANT" badgeColor={c.danger} defaultOpen c={c}>
                <p className={`text-sm ${c.textSec}`}>{r.collections_defense.overview}</p>
                {r.collections_defense.validation_letter && (
                  <div>
                    <p className={`text-[10px] font-bold ${c.label} uppercase mb-1`}>Debt Validation Letter (send first):</p>
                    <div className={`${c.quoteBg} rounded-lg p-3 font-mono`}>
                      <p className={`text-xs ${c.text} whitespace-pre-wrap leading-relaxed`}>{r.collections_defense.validation_letter}</p>
                    </div>
                    <div className="mt-1.5"><CopyBtn content={r.collections_defense.validation_letter} label="Copy letter" /></div>
                  </div>
                )}
                {r.collections_defense.what_to_say_on_phone && (
                  <div className={`${c.warning} border rounded-lg p-3`}>
                    <p className={`text-[10px] font-bold ${c.warningText} mb-1`}>If they call you:</p>
                    <p className="text-xs">"{r.collections_defense.what_to_say_on_phone}"</p>
                  </div>
                )}
                {r.collections_defense.never_do?.length > 0 && (
                  <div>
                    <p className={`text-[10px] font-bold ${c.dangerText} uppercase mb-1`}>NEVER do:</p>
                    {r.collections_defense.never_do.map((item, i) => (
                      <p key={i} className={`text-xs ${c.textSec}`}>🚫 {item}</p>
                    ))}
                  </div>
                )}
              </Section>
            )}

            {/* Hardship letter */}
            {r.hardship_letter && (
              <Section icon="📝" title="Hardship Letter" c={c}>
                <p className={`text-xs ${c.textMuted} mb-2`}>Ready to send — request hardship program, reduction, or forgiveness:</p>
                <div className={`${c.quoteBg} rounded-lg p-4`}>
                  <p className={`text-xs ${c.text} whitespace-pre-wrap leading-relaxed`}>{r.hardship_letter}</p>
                </div>
                <div className="mt-1.5"><CopyBtn content={r.hardship_letter} label="Copy letter" /></div>
              </Section>
            )}

            {/* Insider knowledge */}
            {r.what_they_wont_tell_you?.length > 0 && (
              <Section icon="🤫" title="What They Won't Tell You" c={c}>
                <div className="space-y-2">
                  {r.what_they_wont_tell_you.map((secret, i) => (
                    <div key={i} className={`${c.purple} border rounded-lg p-3`}>
                      <p className="text-xs">💡 {secret}</p>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Assistance programs */}
            {r.assistance_programs?.length > 0 && (
              <Section icon="💚" title="Assistance Programs" c={c}>
                <div className="space-y-2">
                  {r.assistance_programs.map((prog, i) => (
                    <div key={i} className={`${c.success} border rounded-lg p-3`}>
                      <p className={`text-xs font-bold ${c.successText}`}>{prog.program}</p>
                      <p className="text-[10px] mt-1">Who qualifies: {prog.who_qualifies}</p>
                      <p className="text-[10px]">How to apply: {prog.how_to_apply}</p>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Worst case */}
            {r.worst_case && (
              <Section icon="⚠️" title="Realistic Worst Case" c={c}>
                <p className={`text-sm ${c.textSec}`}>{r.worst_case}</p>
                {r.worst_case_reassurance && (
                  <p className={`text-xs ${c.textMuted} italic`}>💚 {r.worst_case_reassurance}</p>
                )}
              </Section>
            )}

            {/* Follow-up */}
            {r.follow_up && (
              <Section icon="📅" title="After the Call" c={c}>
                {r.follow_up.document_this && (
                  <div>
                    <p className={`text-[10px] font-bold ${c.label} uppercase mb-1`}>Document immediately:</p>
                    <p className={`text-xs ${c.textSec}`}>{r.follow_up.document_this}</p>
                  </div>
                )}
                {r.follow_up.calendar_reminder && (
                  <div className={`${c.info} border rounded-lg p-3`}>
                    <p className="text-xs">📅 {r.follow_up.calendar_reminder}</p>
                  </div>
                )}
                {r.follow_up.if_they_dont_follow_through && (
                  <p className={`text-xs ${c.textSec}`}>If they don't follow through: {r.follow_up.if_they_dont_follow_through}</p>
                )}
                <button onClick={() => { setLogPlanId(null); setView('log'); }}
                  className={`${c.btnPrimary} px-4 py-2 rounded-lg text-xs font-bold min-h-[36px] w-full`}>
                  📞 Log a call outcome
                </button>
              </Section>
            )}

            {/* Permission */}
            {r.permission && (
              <div className={`${c.success} border-2 rounded-xl p-5 text-center`}>
                <p className="text-sm font-semibold">💚 {r.permission}</p>
              </div>
            )}

            {/* Save + Copy All */}
            <div className="flex items-center gap-2">
              <button onClick={savePlan}
                className={`${c.btnPrimary} px-4 py-2.5 rounded-lg text-xs font-bold min-h-[40px]`}>
                📌 Save Plan
              </button>
              <ActionBar content={buildPlanText()} />
            </div>

            <p className={`text-[9px] ${c.textMuted} text-center px-4`}>
              General guidance, not legal/financial advice. Programs and rights vary by location.
            </p>

            {/* Cross-refs */}
            <div className={`${c.card} border rounded-xl p-4`}>
              <p className={`text-[10px] font-bold ${c.textMuted} uppercase mb-2`}>Related tools</p>
              <div className="flex flex-wrap gap-2">
                {CROSS_REFS.map(ref => (
                  <a key={ref.id} href={`/tool/${ref.id}`} target="_blank" rel="noopener noreferrer"
                    className={`${c.quoteBg} border rounded-lg px-3 py-2 text-xs ${c.text} hover:opacity-80 min-h-[32px]`}>
                    {ref.icon} {ref.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );

  // ════════════════════════════════════════════════════════════
  // RENDER: TRIAGE
  // ════════════════════════════════════════════════════════════
  const renderTriage = () => (
    <div className="space-y-4">
      <div className={`${c.card} border rounded-xl p-5`}>
        <div className={`mb-4 pb-3 border-b ${c.divider}`}>
          <h2 className={`text-base font-black ${c.text}`}>📊 Multi-Bill Triage</h2>
          <p className={`text-xs ${c.textMuted} mt-0.5`}>Got multiple bills? Find out which to tackle first.</p>
        </div>

        {triageBills.map((bill, idx) => (
          <div key={idx} className={`${c.quoteBg} rounded-lg p-3 mb-2`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-bold ${c.text}`}>Bill {idx + 1}</span>
              {triageBills.length > 2 && (
                <button onClick={() => removeTriageBill(idx)} className={`text-xs ${c.dangerText} min-h-[24px]`}>✕</button>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <select value={bill.type} onChange={e => updateTriageBill(idx, 'type', e.target.value)}
                className={`px-2 py-1.5 border rounded-lg text-xs ${c.input}`}>
                <option value="">Type...</option>
                {BILL_TYPES.map(bt => <option key={bt.value} value={bt.value}>{bt.emoji} {bt.label}</option>)}
              </select>
              <div className="flex items-center gap-0.5">
                <span className={`text-[10px] ${c.textMuted}`}>{currency}</span>
                <input type="number" value={bill.amount} onChange={e => updateTriageBill(idx, 'amount', e.target.value)}
                  placeholder="Amount" className={`flex-1 px-2 py-1.5 border rounded-lg text-xs ${c.input} outline-none w-full`} />
              </div>
              <select value={bill.overdue} onChange={e => updateTriageBill(idx, 'overdue', e.target.value)}
                className={`px-2 py-1.5 border rounded-lg text-xs ${c.input}`}>
                <option value="">How late?</option>
                {OVERDUE_STATUS.map(os => <option key={os.value} value={os.value}>{os.emoji} {os.label}</option>)}
              </select>
            </div>
            <input type="text" value={bill.note} onChange={e => updateTriageBill(idx, 'note', e.target.value)}
              placeholder="Notes (optional)" className={`w-full px-2 py-1 border rounded-lg text-[10px] mt-1.5 ${c.input} outline-none`} />
          </div>
        ))}

        {triageBills.length < 10 && (
          <button onClick={addTriageBill} className={`${c.btnSec} px-3 py-1.5 rounded-lg text-xs font-bold min-h-[32px] mb-3`}>
            ➕ Add bill
          </button>
        )}

        <div className="mb-4">
          <label className={`text-[10px] font-bold ${c.textMuted} block mb-0.5`}>Total monthly budget for all bills?</label>
          <div className="flex items-center gap-1">
            <span className={`text-xs font-bold ${c.textMuted}`}>{currency}</span>
            <input type="number" value={triageBudget} onChange={e => setTriageBudget(e.target.value)}
              placeholder="Total you can put toward bills each month"
              className={`flex-1 px-2 py-1.5 border rounded-lg text-xs ${c.input} outline-none focus:ring-2`} />
          </div>
        </div>

        <button onClick={runTriage} disabled={loading || triageBills.filter(b => b.type).length < 2}
          className={`w-full ${c.btnPrimary} disabled:opacity-40 font-bold py-3 rounded-lg flex items-center justify-center gap-2 min-h-[48px]`}>
          {loading ? <><span className="animate-spin inline-block">⏳</span> Analyzing...</> : <><span>📊</span> Triage My Bills</>}
        </button>
      </div>

      {/* Triage results */}
      {triageResults && (() => {
        const r = triageResults;
        return (
          <div className="space-y-3">
            <div className={`${
              r.severity === 'EMERGENCY' || r.severity === 'CRITICAL' ? c.danger :
              r.severity === 'STRESSFUL' ? c.warning : c.success
            } border-2 rounded-xl p-5 text-center`}>
              <p className="text-3xl mb-1">{r.severity_emoji}</p>
              <p className="text-lg font-black">{r.severity}</p>
              <p className={`text-sm mt-1 ${c.text}`}>{r.headline}</p>
              {r.total_owed && <p className={`text-xs ${c.textMuted} mt-1`}>Total: {r.total_owed}</p>}
            </div>

            {/* Priority order */}
            {r.priority_order?.length > 0 && (
              <div className="space-y-2">
                <p className={`text-xs font-bold ${c.label} uppercase`}>Priority order:</p>
                {r.priority_order.map((bill, i) => (
                  <div key={i} className={`${c.card} border rounded-xl p-4`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black ${
                        bill.urgency === 'PAY NOW' ? 'bg-red-600 text-white' :
                        bill.urgency === 'NEGOTIATE FIRST' ? (isDark ? 'bg-amber-700 text-amber-100' : 'bg-amber-100 text-amber-800') :
                        bill.urgency === 'DISPUTE' ? (isDark ? 'bg-blue-700 text-blue-100' : 'bg-blue-100 text-blue-800') :
                        isDark ? 'bg-emerald-700 text-emerald-100' : 'bg-emerald-100 text-emerald-800'
                      }`}>{bill.rank}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`text-xs font-bold ${c.text}`}>{bill.bill}</span>
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                            bill.urgency === 'PAY NOW' ? c.danger :
                            bill.urgency === 'NEGOTIATE FIRST' ? c.warning :
                            bill.urgency === 'DISPUTE' ? c.info : c.success
                          }`}>{bill.urgency_emoji} {bill.urgency}</span>
                        </div>
                        <p className={`text-[10px] ${c.textSec}`}>{bill.why}</p>
                        <p className={`text-[10px] font-bold ${c.accent} mt-1`}>→ {bill.recommended_action}</p>
                        {bill.allocate && <p className={`text-[10px] ${c.textMuted}`}>Budget: {bill.allocate}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Budget plan */}
            {r.budget_plan && (
              <div className={`${c.accentBg} border rounded-xl p-4`}>
                <p className={`text-[10px] font-bold ${c.label} uppercase mb-2`}>Budget allocation</p>
                <div className="grid grid-cols-3 gap-2 text-center mb-2">
                  <div><p className={`text-xs font-bold ${c.text}`}>{r.budget_plan.total_monthly}</p><p className={`text-[9px] ${c.textMuted}`}>Budget</p></div>
                  <div><p className={`text-xs font-bold ${c.accent}`}>{r.budget_plan.allocated}</p><p className={`text-[9px] ${c.textMuted}`}>To bills</p></div>
                  <div><p className={`text-xs font-bold ${c.text}`}>{r.budget_plan.remaining}</p><p className={`text-[9px] ${c.textMuted}`}>Remaining</p></div>
                </div>
                {r.budget_plan.warning && <p className={`text-[10px] ${c.warningText}`}>⚠️ {r.budget_plan.warning}</p>}
              </div>
            )}

            {/* Quick wins + Danger zones */}
            {r.quick_wins?.length > 0 && (
              <Section icon="⚡" title="Quick Wins" defaultOpen c={c}>
                {r.quick_wins.map((w, i) => <p key={i} className={`text-xs ${c.textSec}`}>✅ {w}</p>)}
              </Section>
            )}
            {r.danger_zones?.length > 0 && (
              <Section icon="🚨" title="Danger Zones" defaultOpen c={c}>
                {r.danger_zones.map((d, i) => <p key={i} className={`text-xs ${c.dangerText}`}>⚠️ {d}</p>)}
              </Section>
            )}

            {r.strategy && (
              <div className={`${c.card} border rounded-xl p-4`}>
                <p className={`text-xs font-bold ${c.label} uppercase mb-1`}>Overall strategy</p>
                <p className={`text-sm ${c.textSec}`}>{r.strategy}</p>
              </div>
            )}
            {r.encouragement && (
              <div className={`${c.success} border-2 rounded-xl p-4 text-center`}>
                <p className="text-sm font-semibold">💚 {r.encouragement}</p>
              </div>
            )}

            <ActionBar content={buildTriageText()} />
          </div>
        );
      })()}
    </div>
  );

  // ════════════════════════════════════════════════════════════
  // RENDER: TRACKER (saved plans)
  // ════════════════════════════════════════════════════════════
  const renderTracker = () => (
    <div className="space-y-4">
      <div className={`${c.card} border rounded-xl p-5`}>
        <div className={`mb-4 pb-3 border-b ${c.divider}`}>
          <h2 className={`text-base font-black ${c.text}`}>📋 Plan Tracker</h2>
          <p className={`text-xs ${c.textMuted} mt-0.5`}>Your saved rescue plans and their status</p>
        </div>

        {/* Upcoming follow-ups */}
        {upcomingFollowUps.length > 0 && (
          <div className={`${c.warning} border rounded-xl p-3 mb-4`}>
            <p className={`text-[10px] font-bold ${c.warningText} uppercase mb-1`}>Upcoming follow-ups</p>
            {upcomingFollowUps.map((fu, i) => (
              <p key={i} className="text-xs">📅 {new Date(fu.nextFollowUp).toLocaleDateString()} — {fu.agreed || fu.notes || 'Follow up'}</p>
            ))}
          </div>
        )}

        {savedPlans.length > 0 ? (
          <div className="space-y-2">
            {savedPlans.map(plan => (
              <div key={plan.id} className={`${c.quoteBg} rounded-lg p-3`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span>{billTypeEmoji(plan.billType)}</span>
                      <span className={`text-xs font-bold ${c.text}`}>{billTypeLabel(plan.billType)}</span>
                      {plan.amount && <span className={`text-xs ${c.accent}`}>{plan.currency}{plan.amount}</span>}
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                        plan.status === 'resolved' ? c.success :
                        plan.status === 'in_progress' ? c.warning : c.info
                      }`}>{plan.status === 'resolved' ? '✅ Resolved' : plan.status === 'in_progress' ? '🔄 In Progress' : '⏳ Pending'}</span>
                    </div>
                    <p className={`text-[9px] ${c.textMuted}`}>{new Date(plan.date).toLocaleDateString()}</p>
                    {plan.results?.shame_to_action?.micro_step && (
                      <p className={`text-[10px] ${c.textSec} mt-0.5 truncate`}>📌 {plan.results.shame_to_action.micro_step}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {plan.status !== 'resolved' && (
                      <select value={plan.status} onChange={e => updatePlanStatus(plan.id, e.target.value)}
                        className={`px-1.5 py-0.5 border rounded text-[9px] ${c.input}`}>
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    )}
                    <button onClick={() => { setLogPlanId(plan.id); setView('log'); }}
                      className={`${c.btnSec} px-2 py-1 rounded text-[9px] font-bold min-h-[24px]`}>📞 Log</button>
                    <button onClick={() => removePlan(plan.id)} className={`text-xs ${c.dangerText} min-h-[24px]`}>✕</button>
                  </div>
                </div>
              </div>
            ))}
            <button onClick={() => {
              if (window.confirm('Clear all saved plans?')) {
                setSavedPlans([]);
                saveStore(STORE_PLANS, [], MAX_PLANS);
              }
            }} className={`text-xs ${c.dangerText} min-h-[28px]`}>🗑️ Clear all</button>
          </div>
        ) : (
          <div className="text-center py-6">
            <span className="text-3xl block mb-2">📋</span>
            <p className={`text-sm ${c.textMuted} mb-2`}>No saved plans yet.</p>
            <p className={`text-xs ${c.textMuted}`}>Analyze a bill, then tap "Save Plan" to track it here.</p>
            <button onClick={() => setView('rescue')} className={`${c.btnPrimary} px-4 py-2 rounded-lg text-xs font-bold mt-3 min-h-[36px]`}>
              🧾 Rescue a bill
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════
  // RENDER: CALL LOG
  // ════════════════════════════════════════════════════════════
  const renderCallLog = () => (
    <div className="space-y-4">
      <div className={`${c.card} border rounded-xl p-5`}>
        <div className={`mb-4 pb-3 border-b ${c.divider}`}>
          <h2 className={`text-base font-black ${c.text}`}>📞 Call Log</h2>
          <p className={`text-xs ${c.textMuted} mt-0.5`}>Track what happened when you made the call</p>
        </div>

        {/* Log form */}
        <div className="mb-4">
          <label className={`text-xs font-bold ${c.label} block mb-1.5`}>What happened?</label>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {[
              { value: 'accepted', label: '✅ They accepted my plan' },
              { value: 'counter', label: '🔄 They countered' },
              { value: 'denied', label: '❌ They said no' },
              { value: 'escalated', label: '📈 Escalated to manager' },
              { value: 'settled', label: '🤝 Settled for less' },
              { value: 'callback', label: '📞 Need to call back' },
              { value: 'sent_letter', label: '📝 Sent letter/email' },
            ].map(o => (
              <button key={o.value} onClick={() => setLogOutcome(o.value === logOutcome ? '' : o.value)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border min-h-[28px] ${
                  logOutcome === o.value ? c.pillActive : c.pillInactive}`}>
                {o.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className={`text-[10px] font-bold ${c.textMuted} block mb-0.5`}>Rep name</label>
              <input type="text" value={logRepName} onChange={e => setLogRepName(e.target.value)}
                placeholder="Who you spoke to" className={`w-full px-2 py-1.5 border rounded-lg text-xs ${c.input} outline-none`} />
            </div>
            <div>
              <label className={`text-[10px] font-bold ${c.textMuted} block mb-0.5`}>Confirmation #</label>
              <input type="text" value={logConfNum} onChange={e => setLogConfNum(e.target.value)}
                placeholder="Reference number" className={`w-full px-2 py-1.5 border rounded-lg text-xs ${c.input} outline-none`} />
            </div>
          </div>

          <div className="mb-2">
            <label className={`text-[10px] font-bold ${c.textMuted} block mb-0.5`}>What was agreed?</label>
            <input type="text" value={logAgreed} onChange={e => setLogAgreed(e.target.value)}
              placeholder="e.g., $50/month for 12 months, waived late fee, 30-day extension..."
              className={`w-full px-2 py-1.5 border rounded-lg text-xs ${c.input} outline-none`} />
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <div>
              <label className={`text-[10px] font-bold ${c.textMuted} block mb-0.5`}>Notes</label>
              <input type="text" value={logNotes} onChange={e => setLogNotes(e.target.value)}
                placeholder="Anything else to remember"
                className={`w-full px-2 py-1.5 border rounded-lg text-xs ${c.input} outline-none`} />
            </div>
            <div>
              <label className={`text-[10px] font-bold ${c.textMuted} block mb-0.5`}>Next follow-up</label>
              <input type="date" value={logNextDate} onChange={e => setLogNextDate(e.target.value)}
                className={`w-full px-2 py-1.5 border rounded-lg text-xs ${c.input} outline-none`} />
            </div>
          </div>

          <button onClick={addCallLog} disabled={!logOutcome}
            className={`w-full ${c.btnPrimary} disabled:opacity-40 font-bold py-2.5 rounded-lg text-xs min-h-[40px]`}>
            📞 Save Call Log
          </button>
        </div>
      </div>

      {/* Past logs */}
      {callLogs.length > 0 && (
        <div className={`${c.card} border rounded-xl p-5`}>
          <p className={`text-xs font-bold ${c.label} uppercase mb-3`}>Past calls ({callLogs.length})</p>
          <div className="space-y-2">
            {callLogs.map(log => (
              <div key={log.id} className={`${c.quoteBg} rounded-lg p-3`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                        log.outcome === 'accepted' || log.outcome === 'settled' ? c.success :
                        log.outcome === 'denied' ? c.danger : c.warning
                      }`}>{log.outcome}</span>
                      {log.repName && <span className={`text-[10px] ${c.textSec}`}>with {log.repName}</span>}
                    </div>
                    {log.agreed && <p className={`text-xs ${c.text}`}>🤝 {log.agreed}</p>}
                    {log.confirmationNumber && <p className={`text-[10px] ${c.accent}`}># {log.confirmationNumber}</p>}
                    {log.notes && <p className={`text-[10px] ${c.textMuted}`}>{log.notes}</p>}
                    <div className="flex items-center gap-3 mt-0.5">
                      <p className={`text-[9px] ${c.textMuted}`}>{new Date(log.date).toLocaleDateString()}</p>
                      {log.nextFollowUp && <p className={`text-[9px] ${c.warningText}`}>📅 Follow up: {new Date(log.nextFollowUp).toLocaleDateString()}</p>}
                    </div>
                  </div>
                  <button onClick={() => removeLog(log.id)} className={`text-xs ${c.dangerText} flex-shrink-0 min-h-[24px]`}>✕</button>
                </div>
              </div>
            ))}
            <button onClick={() => {
              if (window.confirm('Clear all call logs?')) {
                setCallLogs([]);
                saveStore(STORE_LOGS, [], MAX_LOGS);
              }
            }} className={`text-xs ${c.dangerText} min-h-[28px]`}>🗑️ Clear all</button>
          </div>
        </div>
      )}
    </div>
  );

  // ════════════════════════════════════════════════════════════
  // RENDER: QUICK CHECK
  // ════════════════════════════════════════════════════════════
  const renderQuickCheck = () => {
    const VERDICT_COLORS = {
      'NORMAL': isDark ? 'bg-green-900/40 border-green-700 text-green-300' : 'bg-green-50 border-green-300 text-green-800',
      'WORTH QUESTIONING': isDark ? 'bg-yellow-900/40 border-yellow-700 text-yellow-300' : 'bg-yellow-50 border-yellow-300 text-yellow-800',
      'DEFINITELY FIGHT THIS': isDark ? 'bg-red-900/40 border-red-700 text-red-300' : 'bg-red-50 border-red-300 text-red-800',
    };
    return (
      <div className="space-y-4">
        <div className={`${c.card} border rounded-xl p-5`}>
          <h3 className={`text-sm font-bold ${c.text} mb-1`}>⚡ Quick Check</h3>
          <p className={`text-xs ${c.muted} mb-4`}>Describe a charge. Get an instant verdict: fight it or forget it.</p>

          <div className="space-y-3">
            <div>
              <label className={`text-xs font-bold ${c.label} block mb-1.5`}>What's the charge? *</label>
              <input value={qcCharge} onChange={e => setQcCharge(e.target.value)} placeholder='e.g. "Activation fee $35" or "Balance transfer fee"'
                className={`w-full px-3 py-2 border rounded-lg text-xs ${c.input} outline-none focus:ring-2`} />
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <label className={`text-xs font-bold ${c.label} block mb-1.5`}>Bill type</label>
                <select value={qcType} onChange={e => setQcType(e.target.value)}
                  className={`w-full py-1.5 px-2 border rounded-lg text-xs ${c.input}`}>
                  <option value="">Any</option>
                  {BILL_TYPES.map(bt => <option key={bt.value} value={bt.value}>{bt.emoji} {bt.label}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className={`text-xs font-bold ${c.label} block mb-1.5`}>Amount</label>
                <input type="number" value={qcAmount} onChange={e => setQcAmount(e.target.value)} placeholder="Optional"
                  className={`w-full px-2 py-1.5 border rounded-lg text-xs ${c.input} outline-none`} />
              </div>
            </div>

            <button onClick={runQuickCheck} disabled={loading || !qcCharge.trim()}
              className={`w-full ${c.btnPrimary} disabled:opacity-40 font-bold py-3 rounded-lg flex items-center justify-center gap-2 min-h-[48px]`}>
              {loading ? <span className="animate-spin">⏳</span> : <span>⚡</span>}
              {loading ? 'Checking...' : 'Check This Charge'}
            </button>
          </div>
        </div>

        {qcResults && (
          <div className={`border rounded-xl p-5 ${VERDICT_COLORS[qcResults.verdict] || c.card}`}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">{qcResults.verdict_emoji}</span>
              <span className="text-base font-black tracking-tight">{qcResults.verdict}</span>
              {qcResults.confidence && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${c.badge} font-bold`}>{qcResults.confidence} confidence</span>
              )}
            </div>
            <p className="text-sm mb-3">{qcResults.why}</p>

            {qcResults.typical_range && (
              <div className={`${c.card} border rounded-lg p-3 mb-3`}>
                <p className={`text-[10px] font-bold ${c.label} uppercase mb-1`}>Typical range</p>
                <p className="text-xs">{qcResults.typical_range}</p>
              </div>
            )}
            {qcResults.best_phrase && (
              <div className={`${c.card} border rounded-lg p-3 mb-3`}>
                <p className={`text-[10px] font-bold ${c.label} uppercase mb-1`}>Best phone phrase</p>
                <p className="text-xs font-bold italic">"{qcResults.best_phrase}"</p>
                <div className="mt-2"><CopyBtn content={qcResults.best_phrase + '\n\n— Generated by DeftBrain · deftbrain.com'} label="Copy phrase" /></div>
              </div>
            )}
            {qcResults.quick_tip && (
              <p className={`text-xs ${c.muted}`}>💡 {qcResults.quick_tip}</p>
            )}
            {qcResults.potential_savings && (
              <p className="text-xs font-bold mt-2">💰 Potential savings: {currency}{qcResults.potential_savings}</p>
            )}
          </div>
        )}
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════
  // RENDER: REHEARSAL
  // ════════════════════════════════════════════════════════════
  const renderRehearsal = () => {
    const ratingColors = { great: 'text-green-500', good: 'text-blue-500', needs_work: 'text-yellow-500', try_again: 'text-red-500' };
    return (
      <div className="space-y-4">
        <div className={`${c.card} border rounded-xl p-5`}>
          <h3 className={`text-sm font-bold ${c.text} mb-1`}>🎭 Negotiation Rehearsal</h3>
          <p className={`text-xs ${c.muted} mb-4`}>Practice the call before you make it. AI plays the billing rep.</p>

          {!rhActive ? (
            <div className="space-y-3">
              <div>
                <label className={`text-xs font-bold ${c.label} block mb-1.5`}>What's the situation? *</label>
                <textarea rows={3} value={rhSituation} onChange={e => setRhSituation(e.target.value)}
                  placeholder='e.g. "I have a $2,400 medical bill and I can only afford $100/month. I want to negotiate a payment plan."'
                  className={`w-full px-3 py-2 border rounded-lg text-xs ${c.input} outline-none focus:ring-2`} />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className={`text-xs font-bold ${c.label} block mb-1.5`}>Bill type</label>
                  <select value={rhType} onChange={e => setRhType(e.target.value)}
                    className={`w-full py-1.5 px-2 border rounded-lg text-xs ${c.input}`}>
                    <option value="">Any</option>
                    {BILL_TYPES.map(bt => <option key={bt.value} value={bt.value}>{bt.emoji} {bt.label}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className={`text-xs font-bold ${c.label} block mb-1.5`}>Difficulty</label>
                  <select value={rhDifficulty} onChange={e => setRhDifficulty(e.target.value)}
                    className={`w-full py-1.5 px-2 border rounded-lg text-xs ${c.input}`}>
                    <option value="normal">Normal</option>
                    <option value="hard">Hard (worst case rep)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={`text-xs font-bold ${c.label} block mb-1.5`}>Your opening line (optional)</label>
                <input value={rhMessage} onChange={e => setRhMessage(e.target.value)}
                  placeholder="e.g. Hi, I'm calling about my account..."
                  className={`w-full px-3 py-2 border rounded-lg text-xs ${c.input} outline-none focus:ring-2`} />
              </div>
              <button onClick={startRehearsal} disabled={loading || !rhSituation.trim()}
                className={`w-full ${c.btnPrimary} disabled:opacity-40 font-bold py-3 rounded-lg flex items-center justify-center gap-2 min-h-[48px]`}>
                {loading ? <span className="animate-spin">⏳</span> : <span>📞</span>}
                {loading ? 'Connecting...' : 'Start Practice Call'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Difficulty badge */}
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${rhDifficulty === 'hard' ? (isDark ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-700') : c.badge}`}>
                  {rhDifficulty === 'hard' ? '🔥 HARD MODE' : '📞 NORMAL MODE'}
                </span>
                <button onClick={resetRehearsal} className={`text-xs ${c.muted} underline min-h-[28px]`}>End call</button>
              </div>

              {/* Conversation */}
              <div className={`${c.card} border rounded-lg p-3 space-y-3 max-h-[400px] overflow-y-auto`}>
                {rhHistory.map((msg, i) => (
                  <div key={i} className={`text-xs ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                    {msg.role === 'user' ? (
                      <div className="inline-block">
                        <span className={`text-[10px] font-bold ${c.label} block mb-0.5`}>You:</span>
                        <div className={`inline-block px-3 py-2 rounded-lg ${isDark ? 'bg-blue-900/40 border border-blue-700' : 'bg-blue-50 border border-blue-200'}`}>
                          {msg.content}
                        </div>
                      </div>
                    ) : msg.parsed ? (
                      <div className="space-y-2">
                        <div>
                          <span className={`text-[10px] font-bold ${c.label} block mb-0.5`}>Rep ({msg.parsed.rep_tone || 'neutral'}):</span>
                          <div className={`inline-block px-3 py-2 rounded-lg text-left ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-gray-100 border border-gray-200'}`}>
                            {msg.parsed.rep_response}
                          </div>
                        </div>
                        <div className={`border-l-2 pl-2 ${isDark ? 'border-purple-700' : 'border-purple-300'}`}>
                          <span className={`text-[10px] font-bold ${ratingColors[msg.parsed.coach_rating] || c.muted}`}>
                            🎯 Coach ({msg.parsed.coach_rating}):
                          </span>
                          <p className={`text-xs ${c.muted}`}>{msg.parsed.coach_feedback}</p>
                          {msg.parsed.coach_tip && <p className="text-xs font-bold mt-0.5">💡 Try: "{msg.parsed.coach_tip}"</p>}
                        </div>
                        {msg.parsed.negotiation_progress != null && (
                          <div className="flex items-center gap-2">
                            <div className={`flex-1 h-1.5 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                              <div className="h-full rounded bg-green-500 transition-all" style={{ width: `${msg.parsed.negotiation_progress}%` }} />
                            </div>
                            <span className="text-[10px] font-bold">{msg.parsed.negotiation_progress}%</span>
                          </div>
                        )}
                        {msg.parsed.is_resolved && (
                          <div className={`px-3 py-2 rounded-lg text-xs font-bold ${
                            msg.parsed.resolution === 'accepted' ? (isDark ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-700')
                            : msg.parsed.resolution === 'partial' ? (isDark ? 'bg-yellow-900/40 text-yellow-300' : 'bg-yellow-100 text-yellow-700')
                            : (isDark ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-700')
                          }`}>
                            {msg.parsed.resolution === 'accepted' ? '✅ Success! The rep agreed.' : msg.parsed.resolution === 'partial' ? '🤝 Partial win — they made a counter offer.' : '❌ Denied. Try escalating or calling back.'}
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                ))}
                {loading && <div className="text-xs text-center animate-pulse">Rep is responding...</div>}
              </div>

              {/* Input */}
              {!rhHistory.some(h => h.parsed?.is_resolved) && (
                <div className="flex gap-2">
                  <input value={rhMessage} onChange={e => setRhMessage(e.target.value)}
                    placeholder="What do you say?"
                    onKeyDown={e => e.key === 'Enter' && !loading && rhMessage.trim() && continueRehearsal()}
                    className={`flex-1 px-3 py-2 border rounded-lg text-xs ${c.input} outline-none focus:ring-2`} />
                  <button onClick={continueRehearsal} disabled={loading || !rhMessage.trim()}
                    className={`${c.btnPrimary} disabled:opacity-40 px-4 py-2 rounded-lg text-xs font-bold min-h-[36px]`}>
                    Send
                  </button>
                </div>
              )}
              {rhHistory.some(h => h.parsed?.is_resolved) && (
                <div className="flex gap-2">
                  <button onClick={resetRehearsal}
                    className={`flex-1 ${c.btnPrimary} px-4 py-2 rounded-lg text-xs font-bold min-h-[36px]`}>
                    🔄 Practice Again
                  </button>
                  <button onClick={() => setView('rescue')}
                    className={`flex-1 ${c.pillInactive} px-4 py-2 rounded-lg text-xs font-bold min-h-[36px]`}>
                    🧾 Get Full Rescue Plan
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════
  // RENDER: LETTERS
  // ════════════════════════════════════════════════════════════
  const renderLetters = () => {
    const LETTER_TYPES = [
      { value: 'hardship', label: 'Hardship Letter', emoji: '🙏', desc: 'Request financial help or payment plan' },
      { value: 'dispute', label: 'Dispute Letter', emoji: '⚖️', desc: 'Challenge specific charges formally' },
      { value: 'goodwill', label: 'Goodwill Adjustment', emoji: '💚', desc: 'Ask to remove negative credit mark' },
      { value: 'appeal', label: 'Insurance Appeal', emoji: '🛡️', desc: 'Challenge a claim denial' },
      { value: 'cease_desist', label: 'Cease & Desist (Collectors)', emoji: '🛑', desc: 'Stop collector contact' },
      { value: 'complaint', label: 'Regulatory Complaint', emoji: '📣', desc: 'Formal complaint to regulators' },
      { value: 'payment_confirm', label: 'Payment Agreement', emoji: '🤝', desc: 'Document what was agreed on a call' },
    ];
    return (
      <div className="space-y-4">
        <div className={`${c.card} border rounded-xl p-5`}>
          <h3 className={`text-sm font-bold ${c.text} mb-1`}>✉️ Letter Generator</h3>
          <p className={`text-xs ${c.muted} mb-4`}>Ready-to-send letters for every situation. Pick a type, add your details.</p>

          <div className="space-y-3">
            <div>
              <label className={`text-xs font-bold ${c.label} block mb-1.5`}>Letter type *</label>
              <div className="grid grid-cols-1 gap-1.5">
                {LETTER_TYPES.map(lt => (
                  <button key={lt.value} onClick={() => setLtType(lt.value)}
                    className={`text-left px-3 py-2 rounded-lg border text-xs transition-colors min-h-[36px] ${
                      ltType === lt.value ? c.pillActive : c.pillInactive
                    }`}>
                    <span className="font-bold">{lt.emoji} {lt.label}</span>
                    <span className={`ml-1.5 ${c.muted}`}>— {lt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <label className={`text-xs font-bold ${c.label} block mb-1.5`}>Bill type</label>
                <select value={ltBillType} onChange={e => setLtBillType(e.target.value)}
                  className={`w-full py-1.5 px-2 border rounded-lg text-xs ${c.input}`}>
                  <option value="">Any</option>
                  {BILL_TYPES.map(bt => <option key={bt.value} value={bt.value}>{bt.emoji} {bt.label}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className={`text-xs font-bold ${c.label} block mb-1.5`}>Amount</label>
                <input type="number" value={ltAmount} onChange={e => setLtAmount(e.target.value)} placeholder="Optional"
                  className={`w-full px-2 py-1.5 border rounded-lg text-xs ${c.input} outline-none`} />
              </div>
            </div>

            <div>
              <label className={`text-xs font-bold ${c.label} block mb-1.5`}>Your situation</label>
              <textarea rows={3} value={ltSituation} onChange={e => setLtSituation(e.target.value)}
                placeholder="Briefly describe what happened and what you need..."
                className={`w-full px-3 py-2 border rounded-lg text-xs ${c.input} outline-none focus:ring-2`} />
            </div>

            <div>
              <label className={`text-xs font-bold ${c.label} block mb-1.5`}>Additional context</label>
              <input value={ltContext} onChange={e => setLtContext(e.target.value)}
                placeholder="Rep name, dates, reference numbers, etc."
                className={`w-full px-3 py-2 border rounded-lg text-xs ${c.input} outline-none focus:ring-2`} />
            </div>

            <button onClick={generateLetter} disabled={loading || !ltType}
              className={`w-full ${c.btnPrimary} disabled:opacity-40 font-bold py-3 rounded-lg flex items-center justify-center gap-2 min-h-[48px]`}>
              {loading ? <span className="animate-spin">⏳</span> : <span>✉️</span>}
              {loading ? 'Generating...' : 'Generate Letter'}
            </button>
          </div>
        </div>

        {ltResults && (
          <div className={`${c.card} border rounded-xl p-5 space-y-4`}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">{ltResults.letter_title}</h3>
              <CopyBtn content={ltResults.letter_body + '\n\n— Generated by DeftBrain · deftbrain.com'} label="Copy letter" />
            </div>

            {ltResults.send_to && (
              <div className={`${isDark ? 'bg-blue-900/30 border-blue-800' : 'bg-blue-50 border-blue-200'} border rounded-lg p-3`}>
                <p className={`text-[10px] font-bold ${c.label} uppercase mb-1`}>Send to</p>
                <p className="text-xs">{ltResults.send_to}</p>
                {ltResults.send_via && <p className="text-xs mt-1">📨 Via: <strong>{ltResults.send_via}</strong></p>}
              </div>
            )}

            <div className={`${c.card} border rounded-lg p-4`}>
              <pre className="text-xs whitespace-pre-wrap font-sans leading-relaxed">{ltResults.letter_body}</pre>
            </div>

            {ltResults.important_notes?.length > 0 && (
              <div className={`${isDark ? 'bg-yellow-900/30 border-yellow-800' : 'bg-yellow-50 border-yellow-200'} border rounded-lg p-3`}>
                <p className={`text-[10px] font-bold ${c.label} uppercase mb-1.5`}>⚠️ Before you send</p>
                {ltResults.important_notes.map((n, i) => <p key={i} className="text-xs mb-1">• {n}</p>)}
              </div>
            )}

            {ltResults.follow_up && (
              <div className={`${c.card} border rounded-lg p-3`}>
                <p className={`text-[10px] font-bold ${c.label} uppercase mb-1`}>📅 After sending</p>
                <p className="text-xs">{ltResults.follow_up}</p>
              </div>
            )}

            <ActionBar content={ltResults.letter_body + '\n\n— Generated by DeftBrain · deftbrain.com'} brandLine="— Generated by DeftBrain · deftbrain.com" />
          </div>
        )}
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════
  // RENDER: CALENDAR
  // ════════════════════════════════════════════════════════════
  const renderCalendar = () => {
    const now = new Date();
    const overdueItems = calendarData.filter(it => {
      const d = new Date(it.date);
      return d < now && (it.status === 'overdue' || it.status === 'pending');
    });
    const upcomingItems = calendarData.filter(it => {
      const d = new Date(it.date);
      return d >= now || it.status === 'upcoming';
    });

    const formatDate = (ds) => {
      try { return new Date(ds).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); } catch { return ds; }
    };

    return (
      <div className="space-y-4">
        <div className={`${c.card} border rounded-xl p-5`}>
          <h3 className={`text-sm font-bold ${c.text} mb-1`}>📅 Bill Calendar</h3>
          <p className={`text-xs ${c.muted} mb-4`}>Your saved plans and follow-ups at a glance.</p>

          {calendarData.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-2xl mb-2">📅</p>
              <p className={`text-xs ${c.muted}`}>No bills tracked yet. Use Rescue to analyze a bill, then save the plan.</p>
              <button onClick={() => setView('rescue')} className={`${c.btnPrimary} px-4 py-2 rounded-lg text-xs font-bold mt-3 min-h-[36px]`}>🧾 Rescue a Bill</button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary */}
              <div className="flex gap-3">
                <div className={`flex-1 text-center py-3 rounded-lg border ${isDark ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'}`}>
                  <p className="text-lg font-black">{overdueItems.length}</p>
                  <p className={`text-[10px] ${c.muted}`}>Overdue</p>
                </div>
                <div className={`flex-1 text-center py-3 rounded-lg border ${isDark ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'}`}>
                  <p className="text-lg font-black">{upcomingItems.length}</p>
                  <p className={`text-[10px] ${c.muted}`}>Upcoming</p>
                </div>
                <div className={`flex-1 text-center py-3 rounded-lg border ${isDark ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200'}`}>
                  <p className="text-lg font-black">{savedPlans.filter(p => p.status === 'resolved').length}</p>
                  <p className={`text-[10px] ${c.muted}`}>Resolved</p>
                </div>
              </div>

              {/* Overdue alert */}
              {overdueItems.length > 0 && (
                <div className={`${isDark ? 'bg-red-900/30 border-red-800' : 'bg-red-50 border-red-300'} border rounded-lg p-3`}>
                  <p className="text-xs font-bold mb-2">🔴 Overdue / Needs Attention</p>
                  {overdueItems.map(it => (
                    <div key={it.id} className="flex items-center gap-2 text-xs mb-1.5">
                      <span>{it.type === 'followup' ? '📞' : '⚠️'}</span>
                      <span className="flex-1">{it.label}</span>
                      <span className={`${c.muted} text-[10px]`}>{formatDate(it.date)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Upcoming */}
              {upcomingItems.length > 0 && (
                <div>
                  <p className={`text-[10px] font-bold ${c.label} uppercase mb-2`}>Upcoming</p>
                  <div className="space-y-1.5">
                    {upcomingItems.map(it => (
                      <div key={it.id} className={`${c.card} border rounded-lg px-3 py-2 flex items-center gap-2 text-xs`}>
                        <span>{it.type === 'followup' ? '📞' : '📄'}</span>
                        <span className="flex-1">{it.label}</span>
                        <span className={`${c.muted} text-[10px]`}>{formatDate(it.date)}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                          it.status === 'resolved' ? (isDark ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-700')
                          : it.status === 'in_progress' ? (isDark ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-700')
                          : c.badge
                        }`}>{it.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Monthly total */}
        {savedPlans.length > 0 && (
          <div className={`${c.card} border rounded-xl p-4`}>
            <p className={`text-[10px] font-bold ${c.label} uppercase mb-2`}>Monthly obligations</p>
            <p className="text-xl font-black">
              {currency}{savedPlans.reduce((sum, p) => sum + (Number(p.amount) || 0), 0).toLocaleString()}
            </p>
            <p className={`text-xs ${c.muted} mt-1`}>Across {savedPlans.length} tracked bill{savedPlans.length !== 1 ? 's' : ''}</p>
          </div>
        )}
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════
  // RENDER: VICTORIES
  // ════════════════════════════════════════════════════════════
  const renderVictories = () => {
    const typeLabel = (t) => {
      const map = { fee_waived: 'Fee Waived', rate_reduced: 'Rate Reduced', bill_lowered: 'Bill Lowered', payment_plan: 'Payment Plan', charity_care: 'Charity Care', credit_fixed: 'Credit Fixed', other: 'Other Win' };
      return map[t] || 'Win';
    };
    const WIN_TYPES = [
      { value: 'fee_waived', label: 'Fee waived', emoji: '🎯' },
      { value: 'rate_reduced', label: 'Rate reduced', emoji: '📉' },
      { value: 'bill_lowered', label: 'Bill lowered', emoji: '✂️' },
      { value: 'payment_plan', label: 'Payment plan', emoji: '📅' },
      { value: 'charity_care', label: 'Charity/forgiveness', emoji: '💚' },
      { value: 'credit_fixed', label: 'Credit report fixed', emoji: '📊' },
      { value: 'other', label: 'Other win', emoji: '🏆' },
    ];
    // Pattern insights
    const topType = victories.length >= 3 ? (() => {
      const counts = {};
      victories.forEach(v => { counts[v.type] = (counts[v.type] || 0) + 1; });
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      return sorted[0] ? sorted[0][0] : null;
    })() : null;

    return (
      <div className="space-y-4">
        {/* Hero stat */}
        <div className={`${c.card} border rounded-xl p-5 text-center`}>
          <p className="text-3xl mb-1">🏆</p>
          <p className={`text-3xl font-black ${c.text}`}>{totalSaved > 0 ? `${currency}${totalSaved.toLocaleString()}` : victories.length > 0 ? `${victories.length} win${victories.length !== 1 ? 's' : ''}` : 'No wins yet'}</p>
          <p className={`text-xs ${c.muted} mt-1`}>{totalSaved > 0 ? `saved across ${victories.length} win${victories.length !== 1 ? 's' : ''}` : 'Start fighting those bills!'}</p>
          {topType && victories.length >= 3 && (
            <p className={`text-xs mt-2 ${isDark ? 'text-purple-300' : 'text-purple-600'}`}>
              ✨ Your best move: <strong>{typeLabel(topType)}</strong>
            </p>
          )}
        </div>

        {/* Add a win */}
        <div className={`${c.card} border rounded-xl p-5`}>
          <h3 className={`text-sm font-bold ${c.text} mb-3`}>Log a Win</h3>
          <div className="space-y-3">
            <div>
              <label className={`text-xs font-bold ${c.label} block mb-1.5`}>What happened? *</label>
              <input value={vicText} onChange={e => setVicText(e.target.value)}
                placeholder='e.g. "Got $35 late fee waived on electric bill"'
                className={`w-full px-3 py-2 border rounded-lg text-xs ${c.input} outline-none focus:ring-2`} />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className={`text-xs font-bold ${c.label} block mb-1.5`}>Saved ({currency})</label>
                <input type="number" value={vicAmount} onChange={e => setVicAmount(e.target.value)} placeholder="0"
                  className={`w-full px-2 py-1.5 border rounded-lg text-xs ${c.input} outline-none`} />
              </div>
              <div className="flex-1">
                <label className={`text-xs font-bold ${c.label} block mb-1.5`}>Type</label>
                <select value={vicType} onChange={e => setVicType(e.target.value)}
                  className={`w-full py-1.5 px-2 border rounded-lg text-xs ${c.input}`}>
                  <option value="">Pick one</option>
                  {WIN_TYPES.map(wt => <option key={wt.value} value={wt.value}>{wt.emoji} {wt.label}</option>)}
                </select>
              </div>
            </div>
            <button onClick={addVictory} disabled={!vicText.trim()}
              className={`w-full ${c.btnPrimary} disabled:opacity-40 font-bold py-2.5 rounded-lg text-xs min-h-[40px]`}>
              🏆 Log Win
            </button>
          </div>
        </div>

        {/* Win list */}
        {victories.length > 0 && (
          <div className={`${c.card} border rounded-xl p-4`}>
            <p className={`text-[10px] font-bold ${c.label} uppercase mb-3`}>Your victories</p>
            <div className="space-y-2">
              {victories.map(v => (
                <div key={v.id} className={`flex items-start gap-2 px-3 py-2 rounded-lg border ${c.card} text-xs`}>
                  <span className="mt-0.5">{WIN_TYPES.find(w => w.value === v.type)?.emoji || '🏆'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold">{v.text}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {v.amount > 0 && <span className="font-bold text-green-500">+{currency}{v.amount.toLocaleString()}</span>}
                      <span className={c.muted}>{new Date(v.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button onClick={() => removeVictory(v.id)} className={`${c.dangerText} text-[10px] min-h-[24px]`}>✕</button>
                </div>
              ))}
            </div>
            {victories.length > 0 && (
              <div className="mt-3">
                <CopyBtn label="Copy all wins" content={
                  `🏆 BILL RESCUE VICTORIES\nTotal saved: ${currency}${totalSaved.toLocaleString()}\n\n` +
                  victories.map(v => `• ${v.text}${v.amount ? ` (+${currency}${v.amount})` : ''} — ${new Date(v.date).toLocaleDateString()}`).join('\n') +
                  '\n\n— Generated by DeftBrain · deftbrain.com'
                } />
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════
  // MAIN RETURN
  // ════════════════════════════════════════════════════════════
  return (
    <div className={`space-y-1 ${c.text}`}>
      {renderNav()}

      {error && (
        <div className={`${c.danger} border rounded-lg p-3 flex items-start gap-2 mb-3`}>
          <span className="flex-shrink-0">⚠️</span>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {view === 'rescue' && renderRescue()}
      {view === 'quick' && renderQuickCheck()}
      {view === 'triage' && renderTriage()}
      {view === 'rehearse' && renderRehearsal()}
      {view === 'letters' && renderLetters()}
      {view === 'tracker' && renderTracker()}
      {view === 'log' && renderCallLog()}
      {view === 'calendar' && renderCalendar()}
      {view === 'victories' && renderVictories()}
    </div>
  );
};

BillRescue.displayName = 'BillRescue';
export default BillRescue;
