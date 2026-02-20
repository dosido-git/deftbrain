import React, { useState, useCallback } from 'react';
import {
  Loader2, AlertTriangle, Copy, Check, ChevronDown, ChevronUp,
  DollarSign, Phone, FileText, Shield, ArrowRight, Heart,
  Clock, AlertCircle, Zap, Scale,
} from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';

// ════════════════════════════════════════════════════════════
// THEME
// ════════════════════════════════════════════════════════════
function useColors() {
  const { theme } = useTheme();
  const d = theme === 'dark';
  return {
    card: d ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-slate-200',
    input: d
      ? 'bg-zinc-900 border-zinc-600 text-zinc-50 placeholder:text-zinc-500 focus:border-teal-500 focus:ring-teal-500/20'
      : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:ring-teal-100',
    text: d ? 'text-zinc-50' : 'text-slate-900',
    textSec: d ? 'text-zinc-400' : 'text-slate-600',
    textMuted: d ? 'text-zinc-500' : 'text-slate-500',
    label: d ? 'text-zinc-300' : 'text-slate-700',
    accent: d ? 'text-teal-400' : 'text-teal-600',
    accentBg: d ? 'bg-teal-900/30 border-teal-700/50' : 'bg-teal-50 border-teal-200',
    btnPrimary: d ? 'bg-teal-600 hover:bg-teal-500 text-white' : 'bg-teal-600 hover:bg-teal-700 text-white',
    btnSec: d ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-100' : 'bg-slate-100 hover:bg-slate-200 text-slate-800',
    danger: d ? 'bg-red-900/20 border-red-700/50 text-red-200' : 'bg-red-50 border-red-200 text-red-800',
    dangerText: d ? 'text-red-400' : 'text-red-600',
    success: d ? 'bg-emerald-900/20 border-emerald-700/50 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-800',
    successText: d ? 'text-emerald-400' : 'text-emerald-600',
    warning: d ? 'bg-amber-900/20 border-amber-700/50 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-800',
    warningText: d ? 'text-amber-400' : 'text-amber-600',
    info: d ? 'bg-blue-900/20 border-blue-700/50 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-800',
    purple: d ? 'bg-purple-900/20 border-purple-700/50 text-purple-200' : 'bg-purple-50 border-purple-200 text-purple-800',
    purpleText: d ? 'text-purple-400' : 'text-purple-600',
    pillActive: d ? 'bg-teal-600 border-teal-500 text-white' : 'bg-teal-600 border-teal-600 text-white',
    pillInactive: d ? 'bg-zinc-700 border-zinc-600 text-zinc-300 hover:border-zinc-500' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300',
    divider: d ? 'border-zinc-700' : 'border-slate-200',
    quoteBg: d ? 'bg-zinc-900/60' : 'bg-slate-50',
  };
}

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
  { value: 'current', label: 'Current (not late)', emoji: '🟢' },
  { value: '30_days', label: '30 days late', emoji: '🟡' },
  { value: '60_days', label: '60 days late', emoji: '🟠' },
  { value: '90_plus', label: '90+ days late', emoji: '🔴' },
  { value: 'collections', label: 'In collections', emoji: '⚫' },
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

const LOCALE_CURRENCY = {
  'en-us': '$', 'en-gb': '£', 'en-au': 'A$', 'en-ca': 'C$',
  'en-in': '₹', 'pt-br': 'R$', 'de-ch': 'CHF', 'sv': 'kr',
  'de': '€', 'fr': '€', 'es': '€', 'it': '€',
};

function detectCurrency() {
  try {
    const l = (navigator.language || 'en-US').toLowerCase();
    return LOCALE_CURRENCY[l] || LOCALE_CURRENCY[l.split('-')[0]] || '$';
  } catch { return '$'; }
}

// ════════════════════════════════════════════════════════════
// COLLAPSIBLE SECTION
// ════════════════════════════════════════════════════════════
function Section({ icon: Icon, iconColor, title, badge, badgeColor, children, defaultOpen = false, c }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`${c.card} border rounded-xl overflow-hidden`}>
      <button onClick={() => setOpen(p => !p)} className="w-full p-4 flex items-center justify-between text-left min-h-[44px]">
        <div className="flex items-center gap-2.5">
          {Icon && <Icon className={`w-4 h-4 ${iconColor || c.accent}`} />}
          <h3 className={`text-sm font-bold ${c.text}`}>{title}</h3>
          {badge && <span className={`text-[9px] font-black px-2 py-0.5 rounded ${badgeColor || c.accentBg}`}>{badge}</span>}
        </div>
        {open ? <ChevronUp className={`w-4 h-4 ${c.textMuted}`} /> : <ChevronDown className={`w-4 h-4 ${c.textMuted}`} />}
      </button>
      {open && <div className={`px-4 pb-4 border-t ${c.divider} pt-3 space-y-3`}>{children}</div>}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════
const BillGuiltEraser = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const c = useColors();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Input
  const [billType, setBillType] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(() => detectCurrency());
  const [overdueStatus, setOverdueStatus] = useState('');
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [canAffordMonthly, setCanAffordMonthly] = useState('');
  const [pastedBill, setPastedBill] = useState('');

  // State
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [copiedItems, setCopiedItems] = useState({});

  const analyze = useCallback(async () => {
    if (!billType) { setError('Please select a bill type.'); return; }
    setError('');
    setResults(null);

    try {
      const data = await callToolEndpoint('bill-guilt-eraser', {
        billType,
        amount: amount ? Number(amount) : null,
        currency,
        overdueStatus: overdueStatus || 'unknown',
        reason: reason || 'cant_afford',
        details: details.trim() || null,
        canAffordMonthly: canAffordMonthly ? Number(canAffordMonthly) : null,
        pastedBill: pastedBill.trim() || null,
      });
      setResults(data);
    } catch (err) {
      setError(err.message || 'Analysis failed. Try again.');
    }
  }, [billType, amount, currency, overdueStatus, reason, details, canAffordMonthly, pastedBill, callToolEndpoint]);

  const handleReset = useCallback(() => {
    setBillType(''); setAmount(''); setOverdueStatus(''); setReason('');
    setDetails(''); setCanAffordMonthly(''); setPastedBill('');
    setResults(null); setError('');
  }, []);

  const copyText = useCallback((text, key) => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopiedItems(p => ({ ...p, [key]: true }));
      setTimeout(() => setCopiedItems(p => ({ ...p, [key]: false })), 2000);
    }).catch(() => {});
  }, []);

  const r = results;

  // ════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════
  return (
    <div className={`space-y-6 ${c.text}`}>

      {/* ── HEADER + FORM ── */}
      <div className={`${c.card} border rounded-xl p-6`}>
        <div className={`mb-5 pb-4 border-b ${c.divider}`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Bill Guilt Eraser 🧾</h2>
              <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>Turn bill anxiety into a clear action plan</p>
            </div>
            <select value={currency} onChange={e => setCurrency(e.target.value)}
              className={`py-1 px-2 border rounded-lg text-xs font-semibold ${c.input} outline-none`}>
              {CURRENCIES.map(cur => <option key={cur} value={cur}>{cur}</option>)}
            </select>
          </div>
        </div>

        {/* Bill type */}
        <div className="mb-4">
          <label className={`text-sm font-bold ${c.label} block mb-2`}>What kind of bill?</label>
          <div className="flex flex-wrap gap-1.5">
            {BILL_TYPES.map(bt => (
              <button key={bt.value} onClick={() => setBillType(bt.value === billType ? '' : bt.value)}
                className={`px-3 py-2 rounded-lg text-xs font-bold border transition-colors min-h-[36px] ${
                  billType === bt.value ? c.pillActive : c.pillInactive}`}>
                {bt.emoji} {bt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Amount + Monthly afford */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div>
            <label className={`text-sm font-bold ${c.label} block mb-1.5`}>
              How much? <span className={`font-normal ${c.textMuted}`}>(optional)</span>
            </label>
            <div className="flex items-center gap-1">
              <span className={`text-sm font-bold ${c.textMuted}`}>{currency}</span>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className={`flex-1 px-3 py-2.5 border rounded-lg text-sm ${c.input} outline-none focus:ring-2`} />
            </div>
          </div>
          <div>
            <label className={`text-sm font-bold ${c.label} block mb-1.5`}>
              What can you pay monthly? <span className={`font-normal ${c.textMuted}`}>(optional)</span>
            </label>
            <div className="flex items-center gap-1">
              <span className={`text-sm font-bold ${c.textMuted}`}>{currency}</span>
              <input type="number" value={canAffordMonthly} onChange={e => setCanAffordMonthly(e.target.value)}
                placeholder="0.00"
                className={`flex-1 px-3 py-2.5 border rounded-lg text-sm ${c.input} outline-none focus:ring-2`} />
            </div>
          </div>
        </div>

        {/* Overdue status */}
        <div className="mb-4">
          <label className={`text-sm font-bold ${c.label} block mb-2`}>How late is it?</label>
          <div className="flex flex-wrap gap-1.5">
            {OVERDUE_STATUS.map(os => (
              <button key={os.value} onClick={() => setOverdueStatus(os.value === overdueStatus ? '' : os.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors min-h-[32px] ${
                  overdueStatus === os.value ? c.pillActive : c.pillInactive}`}>
                {os.emoji} {os.label}
              </button>
            ))}
          </div>
        </div>

        {/* Reason */}
        <div className="mb-4">
          <label className={`text-sm font-bold ${c.label} block mb-2`}>Why is this hard?</label>
          <div className="flex flex-wrap gap-1.5">
            {REASONS.map(re => (
              <button key={re.value} onClick={() => setReason(re.value === reason ? '' : re.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors min-h-[32px] ${
                  reason === re.value ? c.pillActive : c.pillInactive}`}>
                {re.label}
              </button>
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="mb-4">
          <label className={`text-sm font-bold ${c.label} block mb-1.5`}>
            Anything else? <span className={`font-normal ${c.textMuted}`}>(optional)</span>
          </label>
          <input type="text" value={details} onChange={e => setDetails(e.target.value)}
            placeholder="e.g., They keep calling me, I got a court notice, I think they overcharged me..."
            className={`w-full px-3 py-2.5 border rounded-lg text-sm ${c.input} outline-none focus:ring-2`} />
        </div>

        {/* Paste bill text */}
        <div className="mb-5">
          <label className={`text-sm font-bold ${c.label} block mb-1.5`}>
            Paste your bill or statement <span className={`font-normal ${c.textMuted}`}>(optional — AI will flag overcharges)</span>
          </label>
          <textarea value={pastedBill} onChange={e => setPastedBill(e.target.value)}
            placeholder="Paste bill text, charges, or EOB here for a line-by-line autopsy..."
            rows={3}
            className={`w-full px-3 py-2.5 border rounded-lg text-sm ${c.input} outline-none focus:ring-2 font-mono text-xs`} />
          <p className={`text-[10px] ${c.textMuted} mt-1`}>Your data stays in this session only — nothing is saved or shared.</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={analyze} disabled={loading || !billType}
            className={`flex-1 ${c.btnPrimary} disabled:opacity-40 disabled:cursor-not-allowed font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 min-h-[48px]`}>
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Working on it...</>
            ) : (
              <><DollarSign className="w-5 h-5" /> Get My Action Plan</>
            )}
          </button>
          {results && (
            <button onClick={handleReset} className={`px-5 py-3 border-2 ${isDark ? 'border-zinc-600 text-zinc-300' : 'border-slate-300 text-slate-700'} font-semibold rounded-lg`}>
              New Bill
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className={`${c.danger} border rounded-lg p-4 flex items-start gap-3`}>
          <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${c.dangerText}`} />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* RESULTS                                                  */}
      {/* ══════════════════════════════════════════════════════════ */}
      {r && (
        <div className="space-y-4">

          {/* ── SHAME-TO-ACTION ── */}
          {r.shame_to_action && (
            <div className={`${c.accentBg} border-2 rounded-xl p-5`}>
              <div className="flex items-start gap-3">
                <Heart className={`w-5 h-5 flex-shrink-0 mt-0.5 ${c.accent}`} />
                <div>
                  <h3 className={`text-sm font-bold ${c.text} mb-1`}>First: Deep Breath</h3>
                  <p className={`text-sm ${c.textSec}`}>{r.shame_to_action.reframe}</p>
                  {r.shame_to_action.micro_step && (
                    <div className={`mt-3 p-3 rounded-lg ${isDark ? 'bg-teal-900/40' : 'bg-teal-100'}`}>
                      <p className={`text-xs font-bold ${c.accent}`}>Your only step today: {r.shame_to_action.micro_step}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── BILL AUTOPSY ── */}
          {r.bill_autopsy && (
            <Section icon={AlertCircle} iconColor={c.warningText} title="Bill Autopsy" badge={r.bill_autopsy.verdict} badgeColor={
              r.bill_autopsy.verdict?.toLowerCase().includes('overcharg') || r.bill_autopsy.verdict?.toLowerCase().includes('flag') ? c.danger
              : r.bill_autopsy.verdict?.toLowerCase().includes('fair') ? c.success : c.warning
            } defaultOpen={true} c={c}>
              <p className={`text-sm ${c.textSec}`}>{r.bill_autopsy.analysis}</p>
              {r.bill_autopsy.flagged_charges && r.bill_autopsy.flagged_charges.length > 0 && (
                <div className="space-y-2">
                  <p className={`text-[10px] font-bold ${c.dangerText} uppercase`}>Flagged charges:</p>
                  {r.bill_autopsy.flagged_charges.map((flag, i) => (
                    <div key={i} className={`${c.danger} border rounded-lg p-3`}>
                      <p className={`text-xs font-bold ${c.dangerText}`}>{flag.charge}</p>
                      <p className={`text-xs ${isDark ? 'text-red-300' : 'text-red-700'}`}>{flag.issue}</p>
                    </div>
                  ))}
                </div>
              )}
              {r.bill_autopsy.request_itemized && (
                <p className={`text-xs ${c.textSec}`}>💡 {r.bill_autopsy.request_itemized}</p>
              )}
            </Section>
          )}

          {/* ── KNOW YOUR RIGHTS ── */}
          {r.know_your_rights && r.know_your_rights.length > 0 && (
            <Section icon={Shield} title="Know Your Rights" defaultOpen={true} c={c}>
              <div className="space-y-2">
                {r.know_your_rights.map((right, i) => (
                  <div key={i} className={`${c.info} border rounded-lg p-3`}>
                    <p className={`text-xs font-bold ${isDark ? 'text-blue-200' : 'text-blue-800'}`}>{right.right}</p>
                    <p className={`text-[10px] ${isDark ? 'text-blue-300' : 'text-blue-700'} mt-1`}>{right.explanation}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* ── ACTION STEPS ── */}
          {r.action_steps && r.action_steps.length > 0 && (
            <Section icon={ArrowRight} title="Step-by-Step Action Plan" defaultOpen={true} c={c}>
              <div className="space-y-3">
                {r.action_steps.map((step, i) => (
                  <div key={i} className={`${c.quoteBg} rounded-lg p-4 border-l-4 ${isDark ? 'border-teal-500' : 'border-teal-400'}`}>
                    <p className={`text-[10px] font-bold ${c.accent} uppercase mb-1`}>Step {i + 1}: {step.title}</p>
                    <p className={`text-sm ${c.textSec} mb-2`}>{step.action}</p>
                    {step.script && (
                      <div className="flex items-start gap-2">
                        <div className={`flex-1 ${c.card} border rounded-lg p-3`}>
                          <p className={`text-[10px] font-bold ${c.textMuted} mb-1`}>Say this:</p>
                          <p className={`text-xs ${c.text}`}>"{step.script}"</p>
                        </div>
                        <button onClick={() => copyText(step.script, `step-${i}`)}
                          className={`${c.btnSec} p-2 rounded-lg min-h-[32px] flex-shrink-0`}>
                          {copiedItems[`step-${i}`] ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    )}
                    {step.when && <p className={`text-[10px] ${c.textMuted} mt-2`}>When: {step.when}</p>}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* ── PAYMENT PLAN ── */}
          {r.payment_plan && (
            <Section icon={DollarSign} title="Payment Plan Proposal" c={c}>
              <p className={`text-sm ${c.textSec}`}>{r.payment_plan.strategy}</p>
              {r.payment_plan.offer_amount && (
                <div className={`${c.success} border rounded-lg p-3`}>
                  <p className={`text-xs font-bold ${c.successText}`}>Offer: {r.payment_plan.offer_amount}</p>
                  {r.payment_plan.they_will_counter && (
                    <p className={`text-[10px] ${isDark ? 'text-emerald-300' : 'text-emerald-700'} mt-1`}>They'll counter with: {r.payment_plan.they_will_counter}</p>
                  )}
                  {r.payment_plan.accept_up_to && (
                    <p className={`text-[10px] ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>Accept anything under: {r.payment_plan.accept_up_to}</p>
                  )}
                </div>
              )}
              {r.payment_plan.script && (
                <div className="flex items-start gap-2">
                  <div className={`flex-1 ${c.quoteBg} rounded-lg p-3`}>
                    <p className={`text-[10px] font-bold ${c.textMuted} mb-1`}>Propose this:</p>
                    <p className={`text-xs ${c.text}`}>"{r.payment_plan.script}"</p>
                  </div>
                  <button onClick={() => copyText(r.payment_plan.script, 'payment-plan')}
                    className={`${c.btnSec} p-2 rounded-lg min-h-[32px] flex-shrink-0`}>
                    {copiedItems['payment-plan'] ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              )}
            </Section>
          )}

          {/* ── PHONE SCRIPT ── */}
          {r.phone_script && (
            <Section icon={Phone} title="Phone Call Script" defaultOpen={true} c={c}>
              {r.phone_script.opening && (
                <div className="flex items-start gap-2">
                  <div className={`flex-1 ${c.quoteBg} rounded-lg p-3`}>
                    <p className={`text-[10px] font-bold ${c.accent} mb-1`}>Opening:</p>
                    <p className={`text-xs ${c.text}`}>"{r.phone_script.opening}"</p>
                  </div>
                  <button onClick={() => copyText(r.phone_script.opening, 'phone-open')}
                    className={`${c.btnSec} p-2 rounded-lg min-h-[32px] flex-shrink-0`}>
                    {copiedItems['phone-open'] ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              )}
              {r.phone_script.key_phrases && r.phone_script.key_phrases.length > 0 && (
                <div>
                  <p className={`text-[10px] font-bold ${c.label} uppercase mb-1.5`}>Magic phrases to use:</p>
                  {r.phone_script.key_phrases.map((phrase, i) => (
                    <div key={i} className="flex items-center gap-2 mb-1">
                      <p className={`flex-1 text-xs ${c.text}`}>• "{phrase}"</p>
                      <button onClick={() => copyText(phrase, `phrase-${i}`)}
                        className={`${c.btnSec} p-1 rounded min-h-[24px] flex-shrink-0`}>
                        {copiedItems[`phrase-${i}`] ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {r.phone_script.if_they_say_no && (
                <div className={`${c.warning} border rounded-lg p-3`}>
                  <p className={`text-[10px] font-bold ${c.warningText} mb-1`}>If they say no:</p>
                  <p className={`text-xs ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>{r.phone_script.if_they_say_no}</p>
                </div>
              )}
            </Section>
          )}

          {/* ── ESCALATION LADDER ── */}
          {r.escalation_ladder && r.escalation_ladder.length > 0 && (
            <Section icon={Zap} title="Escalation Ladder" c={c}>
              <p className={`text-xs ${c.textMuted} mb-2`}>If the first person says no, climb this ladder:</p>
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

          {/* ── COLLECTIONS DEFENSE ── */}
          {r.collections_defense && (
            <Section icon={Shield} iconColor={c.dangerText} title="Collections Defense Kit" badge="IMPORTANT" badgeColor={c.danger} defaultOpen={true} c={c}>
              <p className={`text-sm ${c.textSec}`}>{r.collections_defense.overview}</p>
              {r.collections_defense.validation_letter && (
                <div>
                  <p className={`text-[10px] font-bold ${c.label} uppercase mb-1`}>Debt Validation Letter (send this first):</p>
                  <div className="flex items-start gap-2">
                    <div className={`flex-1 ${c.quoteBg} rounded-lg p-3 font-mono`}>
                      <p className={`text-xs ${c.text} whitespace-pre-wrap leading-relaxed`}>{r.collections_defense.validation_letter}</p>
                    </div>
                    <button onClick={() => copyText(r.collections_defense.validation_letter, 'validation')}
                      className={`${c.btnSec} p-2 rounded-lg min-h-[32px] flex-shrink-0`}>
                      {copiedItems.validation ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              )}
              {r.collections_defense.what_to_say_on_phone && (
                <div className={`${c.warning} border rounded-lg p-3`}>
                  <p className={`text-[10px] font-bold ${c.warningText} mb-1`}>If they call you:</p>
                  <p className={`text-xs ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>"{r.collections_defense.what_to_say_on_phone}"</p>
                </div>
              )}
              {r.collections_defense.never_do && r.collections_defense.never_do.length > 0 && (
                <div>
                  <p className={`text-[10px] font-bold ${c.dangerText} uppercase mb-1`}>Never do these:</p>
                  {r.collections_defense.never_do.map((item, i) => (
                    <p key={i} className={`text-xs ${c.textSec}`}>🚫 {item}</p>
                  ))}
                </div>
              )}
            </Section>
          )}

          {/* ── HARDSHIP LETTER ── */}
          {r.hardship_letter && (
            <Section icon={FileText} title="Hardship Letter" c={c}>
              <p className={`text-xs ${c.textMuted} mb-2`}>Send this to request a hardship program, payment reduction, or debt forgiveness:</p>
              <div className="flex items-start gap-2">
                <div className={`flex-1 ${c.quoteBg} rounded-lg p-4`}>
                  <p className={`text-xs ${c.text} whitespace-pre-wrap leading-relaxed`}>{r.hardship_letter}</p>
                </div>
                <button onClick={() => copyText(r.hardship_letter, 'hardship')}
                  className={`${c.btnSec} p-2 rounded-lg min-h-[32px] flex-shrink-0`}>
                  {copiedItems.hardship ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </Section>
          )}

          {/* ── INSIDER KNOWLEDGE ── */}
          {r.what_they_wont_tell_you && r.what_they_wont_tell_you.length > 0 && (
            <Section icon={Scale} title="What They Won't Tell You" c={c}>
              <div className="space-y-2">
                {r.what_they_wont_tell_you.map((secret, i) => (
                  <div key={i} className={`${c.purple} border rounded-lg p-3`}>
                    <p className={`text-xs ${isDark ? 'text-purple-200' : 'text-purple-800'}`}>💡 {secret}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* ── ASSISTANCE PROGRAMS ── */}
          {r.assistance_programs && r.assistance_programs.length > 0 && (
            <Section icon={Heart} iconColor={c.successText} title="Assistance Programs" c={c}>
              <div className="space-y-2">
                {r.assistance_programs.map((prog, i) => (
                  <div key={i} className={`${c.success} border rounded-lg p-3`}>
                    <p className={`text-xs font-bold ${c.successText}`}>{prog.program}</p>
                    <p className={`text-[10px] ${isDark ? 'text-emerald-300' : 'text-emerald-700'} mt-1`}>Who qualifies: {prog.who_qualifies}</p>
                    <p className={`text-[10px] ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>How to apply: {prog.how_to_apply}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* ── WORST CASE ── */}
          {r.worst_case && (
            <Section icon={AlertTriangle} iconColor={c.warningText} title="Realistic Worst Case" c={c}>
              <p className={`text-sm ${c.textSec}`}>{r.worst_case}</p>
              {r.worst_case_reassurance && (
                <p className={`text-xs ${c.textMuted} italic`}>💚 {r.worst_case_reassurance}</p>
              )}
            </Section>
          )}

          {/* ── FOLLOW-UP TRACKER ── */}
          {r.follow_up && (
            <Section icon={Clock} title="After the Call: Follow-Up" c={c}>
              {r.follow_up.document_this && (
                <div>
                  <p className={`text-[10px] font-bold ${c.label} uppercase mb-1`}>Document immediately:</p>
                  <p className={`text-xs ${c.textSec}`}>{r.follow_up.document_this}</p>
                </div>
              )}
              {r.follow_up.calendar_reminder && (
                <div className={`${c.info} border rounded-lg p-3`}>
                  <p className={`text-xs ${isDark ? 'text-blue-200' : 'text-blue-800'}`}>📅 {r.follow_up.calendar_reminder}</p>
                </div>
              )}
              {r.follow_up.if_they_dont_follow_through && (
                <p className={`text-xs ${c.textSec}`}>If they don't follow through: {r.follow_up.if_they_dont_follow_through}</p>
              )}
            </Section>
          )}

          {/* ── PERMISSION ── */}
          {r.permission && (
            <div className={`${c.success} border-2 rounded-xl p-5 text-center`}>
              <p className={`text-sm font-semibold ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>💚 {r.permission}</p>
            </div>
          )}

          <p className={`text-[10px] ${c.textMuted} text-center px-4`}>
            This is general guidance, not legal or financial advice. Programs and rights vary by location. Your data stays in this session only.
          </p>
        </div>
      )}
    </div>
  );
};

BillGuiltEraser.displayName = 'BillGuiltEraser';
export default BillGuiltEraser;
