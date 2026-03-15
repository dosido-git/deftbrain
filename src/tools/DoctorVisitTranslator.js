import React, { useState, useCallback, useMemo, useRef } from 'react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';
import { usePersistentState } from '../hooks/usePersistentState';
import { CopyBtn, ActionBar } from '../components/ActionButtons';

// ════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════
const VISIT_TYPES = ['Diagnosis','Follow-up','Treatment plan','Test results','Preventive care','Urgent care','Specialist consultation'];
const LANGUAGES = [
  { code: 'en', label: 'English only' },
  { code: 'es', label: '🇪🇸 + Spanish' }, { code: 'zh', label: '🇨🇳 + Mandarin' },
  { code: 'vi', label: '🇻🇳 + Vietnamese' }, { code: 'tl', label: '🇵🇭 + Tagalog' },
  { code: 'ko', label: '🇰🇷 + Korean' }, { code: 'fr', label: '🇫🇷 + French' },
  { code: 'ar', label: '🇸🇦 + Arabic' }, { code: 'pt', label: '🇧🇷 + Portuguese' },
  { code: 'ru', label: '🇷🇺 + Russian' }, { code: 'ht', label: '🇭🇹 + Haitian Creole' },
];
const DOC_TYPES = [
  { id: 'visit', label: '🩺 Visit', placeholder: "Paste visit notes or write what you remember the doctor saying..." },
  { id: 'prescription-label', label: '💊 Rx Label', placeholder: "Type or paste what's on your prescription label or medication instructions..." },
  { id: 'lab-report', label: '🔬 Lab', placeholder: "Paste your lab results, test values, and any notes from the lab..." },
  { id: 'insurance-eob', label: '🏥 Bill/EOB', placeholder: "Paste your Explanation of Benefits, billing codes, or medical bill details..." },
  { id: 'discharge', label: '🏨 Discharge', placeholder: "Paste your hospital discharge instructions or summary..." },
];
const SYMPTOM_PRESETS = ['Headache','Fatigue','Pain','Nausea','Dizziness','Shortness of breath','Insomnia','Anxiety','Joint pain','Swelling','Rash','Cough','Fever','Chest tightness'];

// ════════════════════════════════════════════════════════════
// SECTION COMPONENT
// ════════════════════════════════════════════════════════════
function Sec({ icon, title, badge, open, onToggle, children, c, actions }) {
  return (
    <div className={`${c.card} border rounded-xl p-5`}>
      <div className="flex items-center gap-2 w-full">
        <button onClick={onToggle} className="flex items-center gap-2 flex-1 text-left">
          <span className="text-lg">{icon}</span>
          <h3 className={`text-sm font-bold ${c.text} flex-1`}>{title}</h3>
          {badge && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${c.pillGray} border`}>{badge}</span>}
          <span className={c.textMuteded}>{open ? '▲' : '▼'}</span>
        </button>
        {actions}
      </div>
      {open && <div className="mt-4">{children}</div>}
    </div>
  );
}

const priorityColor = (p, d) => {
  if (p === 'high') return d ? 'text-red-400 bg-red-900/20' : 'text-red-700 bg-red-100';
  if (p === 'medium') return d ? 'text-amber-400 bg-amber-900/20' : 'text-amber-700 bg-amber-100';
  return d ? 'text-cyan-400 bg-cyan-900/20' : 'text-cyan-700 bg-cyan-100';
};

// F2: Bilingual text helper — splits "English ||| Translation"
const BiText = ({ text, c }) => {
  if (!text || !text.includes('|||')) return <span>{text}</span>;
  const [en, tr] = text.split('|||').map(s => s.trim());
  return <span>{en}<br /><span className={`${c.textSecondaryondary} italic`}>{tr}</span></span>;
};

// ════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════
const DoctorVisitTranslator = ({ tool }) => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const { isDark } = useTheme();
  const resultsRef = useRef(null);

  const c = {
    // Standard keys
    card:          isDark ? 'bg-zinc-800' : 'bg-white',
    cardAlt:       isDark ? 'bg-zinc-700/50' : 'bg-slate-50',
    text:          isDark ? 'text-zinc-50' : 'text-gray-900',
    textSecondary: isDark ? 'text-zinc-300' : 'text-gray-600',
    textMuted:     isDark ? 'text-zinc-500' : 'text-gray-400',
    input:         isDark ? 'bg-zinc-900 border-zinc-700 text-zinc-50 placeholder:text-zinc-500 focus:border-cyan-500 focus:ring-cyan-500/20' : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-cyan-500',
    btnPrimary:    isDark ? 'bg-cyan-600 hover:bg-cyan-500 text-white' : 'bg-cyan-600 hover:bg-cyan-700 text-white',
    btnSecondary:  isDark ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-100' : 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    border:        isDark ? 'border-zinc-700' : 'border-gray-200',
    success:       isDark ? 'bg-green-900/20 border-green-700 text-green-200' : 'bg-green-50 border-green-300 text-green-800',
    warning:       isDark ? 'bg-amber-900/20 border-amber-700 text-amber-200' : 'bg-amber-50 border-amber-300 text-amber-800',
    danger:        isDark ? 'bg-red-900/20 border-red-700 text-red-200' : 'bg-red-50 border-red-200 text-red-800',
    // Bespoke tool-specific keys
    btnDanger:     isDark ? 'bg-red-900/30 hover:bg-red-900/50 text-red-300 border border-red-700/50' : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200',
    highlight:     isDark ? 'bg-cyan-900/20 border-cyan-700 text-cyan-200' : 'bg-cyan-50 border-cyan-200 text-cyan-800',
    pillGreen:     isDark ? 'bg-emerald-900/40 text-emerald-300 border-emerald-700/40' : 'bg-emerald-100 text-emerald-700 border-emerald-200',
    pillAmber:     isDark ? 'bg-amber-900/40 text-amber-300 border-amber-700/40' : 'bg-amber-100 text-amber-700 border-amber-200',
    pillRed:       isDark ? 'bg-red-900/40 text-red-300 border-red-700/40' : 'bg-red-100 text-red-700 border-red-200',
    pillGray:      isDark ? 'bg-zinc-700 text-zinc-400 border-zinc-600' : 'bg-zinc-100 text-zinc-500 border-zinc-200',
    accentTxt:    isDark ? 'text-cyan-400' : 'text-cyan-600',
    deleteHover: isDark ? 'hover:text-red-400' : 'hover:text-red-600',
  };

  const linkStyle = isDark
    ? 'text-cyan-400 hover:text-cyan-300 underline underline-offset-2'
    : 'text-cyan-600 hover:text-cyan-700 underline underline-offset-2';

  // MODE: input | results | journal | health | prep
  const [mode, setMode] = useState('input');

  // FORM
  const [doctorNotes, setDoctorNotes] = usePersistentState('dvt-notes', '');
  const [visitType, setVisitType] = useState('Follow-up');
  const [concerns, setConcerns] = useState('');
  const [currentMedications, setCurrentMedications] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [language, setLanguage] = useState('en');
  const [documentType, setDocumentType] = useState('visit');

  // RESULTS
  const [results, setResults] = usePersistentState('dvt-results', null);
  const [error, setError] = useState('');

  // UI TOGGLES
  const [secs, setSecs] = useState({
    summary: true, terms: true, visualAids: false, actions: true, medications: false,
    medSafety: false, tests: false, followUp: true, questions: false,
    secondOpinion: false, advocacy: false, insurance: false, tips: false, comparison: false,
  });
  const tog = (k) => setSecs(p => ({ ...p, [k]: !p[k] }));

  // PERSISTENT STORES
  const [history, setHistory] = usePersistentState('doctor-visit-history', []);
  const [medList, setMedList] = usePersistentState('doctor-meds-list', []);
  const [journal, setJournal] = usePersistentState('doctor-symptom-journal', []);
  const [reminders, setReminders] = usePersistentState('doctor-reminders', []);

  // PREP + JOURNAL FORM
  const [prepData, setPrepData] = useState({ symptoms: '', duration: '', severity: '', questions: [''] });
  const [journalEntry, setJournalEntry] = useState({ symptom: '', severity: 5, triggers: '', notes: '' });

  // F3: Auto-inject meds
  const activeMeds = useMemo(() => medList.filter(m => m.active), [medList]);

  // ─── TRANSLATE ───
  const handleTranslate = async () => {
    if (!doctorNotes.trim()) { setError('Please enter what the doctor said'); return; }
    setError(''); setResults(null);
    const allMeds = currentMedications.trim()
      ? currentMedications.trim() + (activeMeds.length ? `\n\nAlso taking (from tracked list): ${activeMeds.map(m => m.name).join(', ')}` : '')
      : activeMeds.length ? activeMeds.map(m => m.name).join(', ') : null;
    try {
      const data = await callToolEndpoint('doctor-visit-translator', {
        doctorNotes: doctorNotes.trim(), visitType,
        concerns: concerns.trim() || null,
        currentMedications: allMeds,
        language: language !== 'en' ? language : null,
        documentType: documentType !== 'visit' ? documentType : null,
        knownMedications: activeMeds.length ? activeMeds.map(m => ({ name: m.name, purpose: m.purpose, prescribedDate: m.prescribedDate })) : null,
      });
      setResults(data); setMode('results');
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      setSecs(p => ({ ...p, summary: true, actions: true, followUp: true, medSafety: !!allMeds, comparison: false }));
    } catch (err) { setError(err.message || 'Failed to translate.'); }
  };

  // ─── SAVE TO HISTORY ───
  const saveToHistory = useCallback(() => {
    if (!results) return;
    const entry = {
      id: Date.now(), date: new Date().toISOString().split('T')[0],
      doctorName: doctorName.trim() || 'Unknown', visitType, language, documentType,
      doctorNotes: doctorNotes.trim().slice(0, 60), concerns: concerns.trim(), results,
      preview: (doctorName.trim() || visitType || 'Visit').slice(0, 40),
    };
    setHistory(prev => [entry, ...prev].slice(0, 6));
    if (results.medications?.length) {
      setMedList(prev => {
        const existing = new Set(prev.map(m => m.name.toLowerCase()));
        const newMeds = results.medications.filter(m => !existing.has(m.name.toLowerCase())).map(m => ({
          id: Date.now() + Math.random(), name: m.name, purpose: m.purpose,
          howToTake: m.how_to_take, sideEffects: m.side_effects_to_watch || [],
          prescribedDate: new Date().toISOString().split('T')[0],
          doctor: doctorName.trim() || 'Unknown', active: true,
          genericAvailable: m.generic_available || '', costInfo: m.cost_considerations || '',
        }));
        return [...newMeds, ...prev].slice(0, 6);
      });
    }
    // F5: Extract reminders from action checklist
    if (results.action_checklist?.length) {
      const today = new Date();
      const newReminders = results.action_checklist.filter(a => a.priority === 'high' || a.priority === 'medium').map(a => {
        const dueDays = a.due_in_days || (a.priority === 'high' ? 7 : 30);
        const dueDate = new Date(today); dueDate.setDate(dueDate.getDate() + dueDays);
        return {
          id: Date.now() + Math.random(), action: a.action, why: a.why, when: a.when,
          priority: a.priority, status: 'pending', createdDate: today.toISOString().split('T')[0],
          dueDate: dueDate.toISOString().split('T')[0], visitDate: today.toISOString().split('T')[0],
          visitGoal: doctorName ? `${visitType} with ${doctorName}` : visitType,
        };
      });
      if (newReminders.length) setReminders(prev => [...newReminders, ...prev].slice(0, 6));
    }
    return entry;
  }, [results, doctorName, visitType, doctorNotes, concerns, language, documentType, setHistory, setMedList, setReminders]);

  const viewEntry = (entry) => {
    setResults(entry.results); setDoctorNotes(entry.doctorNotes);
    setVisitType(entry.visitType); setDoctorName(entry.doctorName);
    setConcerns(entry.concerns || ''); setLanguage(entry.language || 'en');
    setDocumentType(entry.documentType || 'visit'); setMode('results');
  };

  // F4: Visit comparison
  const comparisonEntry = useMemo(() => {
    if (!results) return null;
    return history.find(e =>
      (e.visitType === visitType || (e.doctorName === doctorName && doctorName !== 'Unknown')) &&
      e.results?.plain_english_summary
    ) || null;
  }, [results, history, visitType, doctorName]);

  // F5: Reminders
  const overdueReminders = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return reminders.filter(r => r.status === 'pending' && r.dueDate < today);
  }, [reminders]);
  const upcomingReminders = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const week = new Date(); week.setDate(week.getDate() + 7);
    return reminders.filter(r => r.status === 'pending' && r.dueDate >= today && r.dueDate <= week.toISOString().split('T')[0]);
  }, [reminders]);

  // F1: Symptom journal
  const addJournalEntry = () => {
    if (!journalEntry.symptom.trim()) return;
    const entry = { ...journalEntry, id: Date.now(), date: new Date().toISOString().split('T')[0], time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setJournal(prev => [entry, ...prev].slice(0, 6));
    setJournalEntry({ symptom: '', severity: 5, triggers: '', notes: '' });
  };

  const symptomTrends = useMemo(() => {
    if (journal.length < 2) return null;
    const bySymptom = {};
    journal.forEach(e => { if (!bySymptom[e.symptom]) bySymptom[e.symptom] = []; bySymptom[e.symptom].push({ date: e.date, severity: e.severity }); });
    return Object.entries(bySymptom).filter(([_, entries]) => entries.length >= 2).map(([name, entries]) => {
      const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
      const avg = Math.round(sorted.reduce((s, e) => s + e.severity, 0) / sorted.length * 10) / 10;
      const recent = sorted.slice(-3);
      const recentAvg = Math.round(recent.reduce((s, e) => s + e.severity, 0) / recent.length * 10) / 10;
      const trend = recentAvg < avg - 0.5 ? 'improving' : recentAvg > avg + 0.5 ? 'worsening' : 'stable';
      return { name, count: sorted.length, avg, recentAvg, trend, last: sorted[sorted.length - 1] };
    });
  }, [journal]);

  const buildSymptomReport = useCallback(() => {
    if (!journal.length) return '';
    const lines = ['SYMPTOM JOURNAL REPORT', '═'.repeat(40), `Generated: ${new Date().toISOString().split('T')[0]}`, ''];
    if (symptomTrends?.length) { lines.push('TRENDS:'); symptomTrends.forEach(t => lines.push(`• ${t.name}: ${t.count} entries, avg ${t.avg}/10, ${t.trend}`)); lines.push(''); }
    lines.push('RECENT:');
    journal.slice(0, 6).forEach(e => lines.push(`${e.date} ${e.time || ''} — ${e.symptom} (${e.severity}/10)${e.triggers ? ` [${e.triggers}]` : ''}${e.notes ? ` ${e.notes}` : ''}`));
    lines.push('', '— Generated by DeftBrain · deftbrain.com');
    return lines.join('\n');
  }, [journal, symptomTrends]);

  // ─── EXPORTS ───
  const buildFullExport = useCallback(() => {
    if (!results) return '';
    const r = results;
    const lines = ['DOCTOR VISIT TRANSLATION', '═'.repeat(50), `Date: ${new Date().toISOString().split('T')[0]}`, `Visit: ${visitType}`, doctorName ? `Doctor: ${doctorName}` : '', language !== 'en' ? `Language: Bilingual` : '', ''];
    if (r.plain_english_summary) { lines.push('SUMMARY', '─'.repeat(40)); ['diagnosis','treatment_plan','prognosis','timeline'].forEach(k => { if (r.plain_english_summary[k]) lines.push(`${k === 'diagnosis' ? 'What You Have' : k === 'treatment_plan' ? 'What To Do' : k === 'prognosis' ? 'Expect' : 'Timeline'}: ${r.plain_english_summary[k]}`); }); lines.push(''); }
    if (r.action_checklist?.length) { lines.push('ACTIONS', '─'.repeat(40)); r.action_checklist.forEach((a, i) => lines.push(`${i + 1}. [${a.priority?.toUpperCase()}] ${a.action}`, `   Why: ${a.why}`, `   When: ${a.when}`, `   How: ${a.how}`, '')); }
    if (r.medications?.length) { lines.push('MEDS', '─'.repeat(40)); r.medications.forEach(m => { lines.push(`${m.name}`, `  Purpose: ${m.purpose}`, `  How: ${m.how_to_take}`); if (m.side_effects_to_watch?.length) lines.push(`  Watch: ${m.side_effects_to_watch.join(', ')}`); lines.push(''); }); }
    if (r.follow_up_requirements) { lines.push('FOLLOW-UP', '─'.repeat(40)); if (r.follow_up_requirements.next_appointment) lines.push(`Next: ${r.follow_up_requirements.next_appointment}`); if (r.follow_up_requirements.when_to_call_doctor?.length) { lines.push('Call if:'); r.follow_up_requirements.when_to_call_doctor.forEach(w => lines.push(`  • ${w}`)); } lines.push(''); }
    if (r.questions_for_next_visit?.length) { lines.push('QUESTIONS', '─'.repeat(40)); r.questions_for_next_visit.forEach(q => lines.push(`? ${q}`)); lines.push(''); }
    lines.push('', '— Generated by DeftBrain · deftbrain.com');
    return lines.join('\n');
  }, [results, visitType, doctorName, language]);

  const buildCaregiverSummary = useCallback(() => {
    if (!results) return '';
    const r = results;
    const lines = ['VISIT SUMMARY FOR FAMILY/CAREGIVER', '═'.repeat(40), `Date: ${new Date().toISOString().split('T')[0]}`, doctorName ? `Doctor: ${doctorName}` : '', `Visit: ${visitType}`, ''];
    if (r.plain_english_summary) { if (r.plain_english_summary.diagnosis) lines.push(`FOUND: ${r.plain_english_summary.diagnosis}`, ''); if (r.plain_english_summary.treatment_plan) lines.push(`TO DO: ${r.plain_english_summary.treatment_plan}`, ''); if (r.plain_english_summary.timeline) lines.push(`TIMELINE: ${r.plain_english_summary.timeline}`, ''); }
    if (r.action_checklist?.length) { lines.push('TO-DO:'); r.action_checklist.filter(a => a.priority !== 'low').forEach(a => lines.push(`• ${a.action} — ${a.when}`)); lines.push(''); }
    if (r.medications?.length) { lines.push('MEDS:'); r.medications.forEach(m => lines.push(`• ${m.name}: ${m.purpose}`, `  Take: ${m.how_to_take}`)); lines.push(''); }
    if (r.follow_up_requirements?.when_to_call_doctor?.length) { lines.push('🚨 CALL IF:'); r.follow_up_requirements.when_to_call_doctor.forEach(w => lines.push(`• ${w}`)); lines.push(''); }
    if (r.follow_up_requirements?.next_appointment) lines.push(`NEXT: ${r.follow_up_requirements.next_appointment}`, '');
    lines.push('', '— Generated by DeftBrain · deftbrain.com');
    return lines.join('\n');
  }, [results, visitType, doctorName]);

  const buildPrepExport = useCallback(() => {
    const lines = ['APPOINTMENT PREP', '═'.repeat(40), `Visit: ${visitType}`, doctorName ? `Doctor: ${doctorName}` : '', ''];
    if (prepData.symptoms.trim()) lines.push(`SYMPTOMS: ${prepData.symptoms}`, '');
    if (prepData.duration.trim()) lines.push(`DURATION: ${prepData.duration}`, '');
    if (prepData.severity.trim()) lines.push(`SEVERITY: ${prepData.severity}/10`, '');
    if (symptomTrends?.length) { lines.push('JOURNAL TRENDS:'); symptomTrends.forEach(t => lines.push(`• ${t.name}: ${t.count}x, avg ${t.avg}/10, ${t.trend}`)); lines.push(''); }
    const qs = prepData.questions.filter(q => q.trim());
    if (qs.length) { lines.push('QUESTIONS:'); qs.forEach(q => lines.push(`? ${q}`)); lines.push(''); }
    const pastQs = history.filter(e => e.results?.questions_for_next_visit?.length).flatMap(e => e.results.questions_for_next_visit).slice(0, 5);
    if (pastQs.length) { lines.push('FROM PAST VISITS:'); pastQs.forEach(q => lines.push(`? ${q}`)); lines.push(''); }
    lines.push('BRING:', '• Insurance card & ID', '• Medication list', '• This sheet', '• Notebook', '');
    if (activeMeds.length) { lines.push('CURRENT MEDS:'); activeMeds.forEach(m => lines.push(`• ${m.name} — ${m.howToTake || ''}`)); lines.push(''); }
    lines.push('', '— Generated by DeftBrain · deftbrain.com');
    return lines.join('\n');
  }, [visitType, doctorName, prepData, history, activeMeds, symptomTrends]);

  const medStats = useMemo(() => ({ active: activeMeds.length, total: medList.length }), [activeMeds, medList]);
  const handleReset = () => { setDoctorNotes(''); setVisitType('Follow-up'); setConcerns(''); setCurrentMedications(''); setDoctorName(''); setLanguage('en'); setDocumentType('visit'); setResults(null); setError(''); setMode('input'); };

  // ════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════
  return (
    <div className={`space-y-6 ${c.text}`}>
      <div className="mb-2">
        <h2 className={`text-2xl font-bold ${c.text}`}><span className="mr-2">{tool?.icon ?? '🩺'}</span>{tool?.title || 'Doctor Visit Translator'}</h2>
        <p className={`text-sm ${c.textMuteded}`}>{tool?.tagline || 'Understand visits, labs, prescriptions, and bills in plain language'}</p>
      </div>

      {/* MODE TABS */}
      <div className={`${c.card} border rounded-xl p-4`}>
        <div className="grid grid-cols-5 gap-2">
          {[
            { id: 'input', icon: '✏️', label: 'Translate' },
            { id: 'results', icon: '📋', label: 'Results', disabled: !results },
            { id: 'journal', icon: '📓', label: `Journal (${journal.length})` },
            { id: 'health', icon: '💊', label: 'Health' },
            { id: 'prep', icon: '📝', label: 'Prep' },
          ].map(m => (
            <button key={m.id} onClick={() => !m.disabled && setMode(m.id)} disabled={m.disabled}
              className={`p-2.5 border-2 rounded-lg text-center transition-colors ${m.disabled ? 'opacity-30 cursor-not-allowed' : ''} ${mode === m.id ? (isDark ? 'border-cyan-500 bg-cyan-900/20' : 'border-cyan-500 bg-cyan-50') : (isDark ? 'border-zinc-700 hover:border-zinc-600' : 'border-gray-200 hover:border-gray-300')}`}>
              <span className="text-lg block">{m.icon}</span>
              <p className={`text-[10px] font-semibold ${c.text}`}>{m.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* F5: Overdue alert */}
      {mode === 'input' && overdueReminders.length > 0 && (
        <div className={`${c.danger} border rounded-xl p-4 flex items-start gap-2`}>
          <span>🔴</span>
          <div><p className="text-sm font-bold">{overdueReminders.length} overdue health task{overdueReminders.length > 1 ? 's' : ''}</p>
            {overdueReminders.slice(0, 3).map(r => <p key={r.id} className="text-xs mt-0.5">• {r.action} (due {r.dueDate})</p>)}
            <button onClick={() => setMode('health')} className="text-xs underline mt-1">View all →</button></div>
        </div>
      )}
      {mode === 'input' && upcomingReminders.length > 0 && !overdueReminders.length && (
        <div className={`${c.highlight} border rounded-xl p-4 flex items-start gap-2`}>
          <span>📋</span>
          <div><p className="text-sm font-bold">{upcomingReminders.length} due this week</p>
            {upcomingReminders.slice(0, 2).map(r => <p key={r.id} className="text-xs mt-0.5">• {r.action} (by {r.dueDate})</p>)}</div>
        </div>
      )}

      {/* ══════════ INPUT MODE ══════════ */}
      {mode === 'input' && (
        <div className={`${c.card} border rounded-xl p-6 space-y-5`}>
          <div className={`${c.warning} border-l-4 rounded-r-lg p-4 flex items-start gap-2`}>
            <span>⚠️</span>
            <div><h4 className="font-bold text-sm mb-0.5">Medical Disclaimer</h4><p className="text-xs">This helps understand medical info but does NOT replace advice. Always follow your doctor's instructions.</p></div>
          </div>

          {/* F6: Document type */}
          <div>
            <label className={`text-sm font-semibold ${c.textSecondaryondary} block mb-1.5`}>What are you translating?</label>
            <div className="grid grid-cols-5 gap-1.5">{DOC_TYPES.map(dt => (
              <button key={dt.id} onClick={() => setDocumentType(dt.id)}
                className={`p-2 border-2 rounded-lg text-center transition-colors ${documentType === dt.id ? (isDark ? 'border-cyan-500 bg-cyan-900/20' : 'border-cyan-500 bg-cyan-50') : (isDark ? 'border-zinc-700' : 'border-gray-200')}`}>
                <p className={`text-[10px] font-semibold ${c.text}`}>{dt.label}</p>
              </button>
            ))}</div>
          </div>

          <div>
            <label className={`text-sm font-semibold ${c.textSecondaryondary} block mb-1.5`}>{DOC_TYPES.find(d => d.id === documentType)?.label || 'Notes'} *</label>
            <textarea value={doctorNotes} onChange={e => setDoctorNotes(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && doctorNotes.trim()) handleTranslate(); }}
              placeholder={DOC_TYPES.find(d => d.id === documentType)?.placeholder}
              className={`w-full h-36 p-4 border-2 rounded-lg ${c.input} outline-none focus:ring-2 resize-none text-sm`} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div><label className={`text-sm font-semibold ${c.textSecondaryondary} block mb-1.5`}>Visit Type</label>
              <select value={visitType} onChange={e => setVisitType(e.target.value)} className={`w-full p-2.5 border rounded-lg ${c.input} outline-none text-sm`}>{VISIT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
            <div><label className={`text-sm font-semibold ${c.textSecondaryondary} block mb-1.5`}>Doctor</label>
              <input value={doctorName} onChange={e => setDoctorName(e.target.value)} placeholder="Dr. Smith" className={`w-full p-2.5 border rounded-lg ${c.input} outline-none text-sm`} /></div>
            <div><label className={`text-sm font-semibold ${c.textSecondaryondary} block mb-1.5`}>🌐 Language</label>
              <select value={language} onChange={e => setLanguage(e.target.value)} className={`w-full p-2.5 border rounded-lg ${c.input} outline-none text-sm`}>
                {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}</select></div>
          </div>

          <div>
            <label className={`text-sm font-semibold ${c.textSecondaryondary} block mb-1.5`}>Concerns <span className={`text-[10px] ${c.textMuteded}`}>(optional)</span></label>
            <textarea value={concerns} onChange={e => setConcerns(e.target.value)} placeholder="What worries you most?"
              className={`w-full h-16 p-3 border-2 rounded-lg ${c.input} outline-none resize-none text-sm`} />
          </div>

          <div>
            <label className={`text-sm font-semibold ${c.textSecondaryondary} block mb-1.5`}>Medications <span className={`text-[10px] ${c.textMuteded}`}>(for interaction check)</span></label>
            {activeMeds.length > 0 && (
              <div className={`${c.success} border rounded-lg p-3 mb-2`}>
                <p className="text-[10px] font-bold mb-1">💊 Auto-included ({activeMeds.length}):</p>
                <p className="text-xs">{activeMeds.map(m => m.name).join(', ')}</p>
                <p className={`text-[10px] ${c.textMuteded} mt-1`}>Checked for interactions with new prescriptions</p>
              </div>
            )}
            <textarea value={currentMedications} onChange={e => setCurrentMedications(e.target.value)} placeholder="Add any meds not in your tracked list..."
              className={`w-full h-16 p-3 border-2 rounded-lg ${c.input} outline-none resize-none text-sm`} />
          </div>

          <button onClick={handleTranslate} disabled={loading || !doctorNotes.trim()}
            className={`w-full ${c.btnPrimaryPrimary} disabled:opacity-40 font-bold py-3 rounded-lg flex items-center justify-center gap-2`}>
            {loading ? <><span className="animate-spin inline-block">{tool?.icon ?? '🩺'}</span> Translating...</> : <><span>{tool?.icon ?? '🩺'}</span> Translate</>}
          </button>
          {error && <div className={`${c.danger} border rounded-lg p-4 flex items-start gap-2`}><span>⚠️</span><p className="text-sm">{error}</p></div>}
        </div>
      )}

      {/* ══════════ RESULTS MODE ══════════ */}
      {mode === 'results' && results && (
        <div ref={resultsRef} className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex flex-wrap gap-2">
              <button onClick={saveToHistory} className={`${c.btnPrimarySecondaryondary} py-2 px-4 rounded-lg text-sm font-semibold`}>💾 Save</button>
              <button onClick={handleReset} className={`${c.btnPrimarySecondaryondary} py-2 px-3 rounded-lg text-sm`}>✨ New</button>
            </div>
            <ActionBar content={buildFullExport()} title="Doctor Visit Translation" />
          </div>

          {/* F3: Interaction banner */}
          {results.medication_safety?.known_med_interactions && !results.medication_safety.known_med_interactions.toLowerCase().includes('no significant') && (
            <div className={`${c.danger} border-2 rounded-xl p-4 flex items-start gap-2`}>
              <span>⚠️</span>
              <div><p className="text-sm font-bold">Potential Medication Interaction</p><p className="text-xs mt-1">{results.medication_safety.known_med_interactions}</p><p className={`text-[10px] ${c.textMuteded} mt-1`}>Discuss with your doctor or pharmacist</p></div>
            </div>
          )}

          {/* Summary */}
          {results.plain_english_summary && (
            <Sec icon="📖" title="Plain English Summary" open={secs.summary} onToggle={() => tog('summary')} c={c}>
              <div className="space-y-3">{[{ k: 'diagnosis', l: 'What You Have', i: '🔍' }, { k: 'treatment_plan', l: 'What to Do', i: '📋' }, { k: 'prognosis', l: 'Expect', i: '🔮' }, { k: 'timeline', l: 'Timeline', i: '📅' }].map(f => results.plain_english_summary[f.k] && (
                <div key={f.k} className={`${c.cardAlt} border rounded-lg p-4`}>
                  <h4 className={`font-semibold text-sm ${c.text} mb-1`}>{f.i} {f.l}</h4>
                  <p className={`text-sm ${c.textSecondaryondary}`}><BiText text={results.plain_english_summary[f.k]} c={c} /></p>
                </div>
              ))}</div>
            </Sec>
          )}

          {/* F4: Comparison */}
          {comparisonEntry && (
            <Sec icon="🔄" title="vs Last Visit" badge={comparisonEntry.date} open={secs.comparison} onToggle={() => tog('comparison')} c={c}>
              <div className="space-y-3">
                {comparisonEntry.results?.plain_english_summary?.diagnosis && results.plain_english_summary?.diagnosis && (
                  <div className={`${c.cardAlt} border rounded-lg p-4`}>
                    <p className={`text-[10px] font-bold ${c.textMuteded} mb-1`}>DIAGNOSIS</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div><p className={`text-[9px] ${c.textMuteded}`}>{comparisonEntry.date}</p><p className={`text-xs ${c.textSecondaryondary}`}>{comparisonEntry.results.plain_english_summary.diagnosis?.split('|||')[0]?.slice(0, 6)}</p></div>
                      <div><p className={`text-[9px] ${c.textSecondaryondary}`}>Today</p><p className={`text-xs ${c.text} font-semibold`}>{results.plain_english_summary.diagnosis?.split('|||')[0]?.slice(0, 6)}</p></div>
                    </div>
                  </div>
                )}
                {comparisonEntry.results?.test_results_explained?.length > 0 && results.test_results_explained?.length > 0 && (
                  <div className={`${c.cardAlt} border rounded-lg p-4`}>
                    <p className={`text-[10px] font-bold ${c.textMuteded} mb-2`}>TESTS</p>
                    {results.test_results_explained.map((t, i) => {
                      const prev = comparisonEntry.results.test_results_explained?.find(p => p.test?.toLowerCase() === t.test?.toLowerCase());
                      if (!prev) return null;
                      return <div key={i} className="flex items-center gap-2 mb-1"><span className={`text-xs ${c.text} w-24 truncate`}>{t.test}</span><span className={`text-xs ${c.textMuteded}`}>{prev.your_result}</span><span className="text-xs">{parseFloat(t.your_result) < parseFloat(prev.your_result) ? '📉' : parseFloat(t.your_result) > parseFloat(prev.your_result) ? '📈' : '➡️'}</span><span className={`text-xs font-semibold ${c.text}`}>{t.your_result}</span></div>;
                    })}
                  </div>
                )}
                {comparisonEntry.results?.medications?.length > 0 && results.medications?.length > 0 && (
                  <div className={`${c.cardAlt} border rounded-lg p-4`}>
                    <p className={`text-[10px] font-bold ${c.textMuteded} mb-1`}>MED CHANGES</p>
                    {(() => {
                      const prevN = new Set(comparisonEntry.results.medications.map(m => m.name.toLowerCase()));
                      const currN = new Set(results.medications.map(m => m.name.toLowerCase()));
                      const added = results.medications.filter(m => !prevN.has(m.name.toLowerCase()));
                      const removed = comparisonEntry.results.medications.filter(m => !currN.has(m.name.toLowerCase()));
                      return <>{added.map((m, i) => <p key={`a${i}`} className="text-xs text-emerald-500">➕ {m.name}</p>)}{removed.map((m, i) => <p key={`r${i}`} className="text-xs text-red-400">➖ {m.name}</p>)}{!added.length && !removed.length && <p className={`text-xs ${c.textMuteded}`}>No changes</p>}</>;
                    })()}
                  </div>
                )}
              </div>
            </Sec>
          )}

          {/* Terms */}
          {results.medical_terms_explained?.length > 0 && (
            <Sec icon="📚" title="Medical Terms" badge={`${results.medical_terms_explained.length}`} open={secs.terms} onToggle={() => tog('terms')} c={c}>
              <div className="space-y-3">{results.medical_terms_explained.map((t, i) => (
                <div key={i} className={`${c.cardAlt} border rounded-lg p-4`}>
                  <h4 className={`font-bold text-sm ${c.text} mb-1`}>{t.term}</h4><p className={`text-sm ${c.textSecondaryondary} mb-2`}>{t.definition}</p>
                  <div className={`${c.highlight} border rounded p-3`}><p className="text-[10px] font-bold mb-0.5">For you:</p><p className="text-xs">{t.what_it_means_for_you}</p></div>
                  {t.visual_aid_suggestion && <p className={`text-[10px] ${c.textMuteded} mt-2`}>🖼️ {t.visual_aid_suggestion}</p>}
                </div>
              ))}</div>
            </Sec>
          )}

          {/* Visual Aids */}
          {results.visual_aids_recommended && (
            <Sec icon="🖼️" title="Visual Aids" open={secs.visualAids} onToggle={() => tog('visualAids')} c={c}>
              <div className="space-y-3">{[{ k: 'body_diagram_description', l: 'Body', i: '🫀' }, { k: 'treatment_timeline', l: 'Timeline', i: '📅' }, { k: 'medication_schedule', l: 'Schedule', i: '⏰' }, { k: 'test_results_visualization', l: 'Scale', i: '📊' }].map(f => results.visual_aids_recommended[f.k] && (
                <div key={f.k} className={`${c.cardAlt} border rounded-lg p-4`}><h4 className={`font-semibold text-sm ${c.text} mb-1`}>{f.i} {f.l}</h4><p className={`text-sm ${c.textSecondaryondary}`}>{results.visual_aids_recommended[f.k]}</p></div>
              ))}</div>
            </Sec>
          )}

          {/* Actions */}
          {results.action_checklist?.length > 0 && (
            <Sec icon="☑️" title="Actions" badge={`${results.action_checklist.length}`} open={secs.actions} onToggle={() => tog('actions')} c={c}>
              <div className="space-y-3">{results.action_checklist.map((a, i) => (
                <div key={i} className={`${c.cardAlt} border rounded-lg p-4`}>
                  <div className="flex items-center gap-2 mb-2"><span>☑️</span><h4 className={`font-bold text-sm ${c.text} flex-1`}><BiText text={a.action} c={c} /></h4><span className={`text-[10px] px-2 py-0.5 rounded font-bold ${priorityColor(a.priority, isDark)}`}>{a.priority}</span></div>
                  <div className="space-y-1 ml-7"><p className={`text-xs ${c.textMuteded}`}>Why: {a.why}</p><p className={`text-xs ${c.textMuteded}`}>When: {a.when}</p><p className={`text-sm ${c.textSecondaryondary}`}>How: <BiText text={a.how} c={c} /></p>{a.what_if_you_dont && <p className={`text-xs ${c.textMuteded} italic`}>If skipped: {a.what_if_you_dont}</p>}</div>
                </div>
              ))}</div>
            </Sec>
          )}

          {/* Medications */}
          {results.medications?.length > 0 && (
            <Sec icon="💊" title="Medications" badge={`${results.medications.length}`} open={secs.medications} onToggle={() => tog('medications')} c={c}>
              <div className="space-y-4">{results.medications.map((m, i) => (
                <div key={i} className={`${c.cardAlt} border rounded-lg p-4`}>
                  <h4 className={`font-bold text-sm ${c.text} mb-2`}>💊 {m.name}</h4>
                  <div className="space-y-2">
                    <div><p className={`text-[10px] font-bold ${c.textMuteded}`}>PURPOSE</p><p className={`text-sm ${c.textSecondaryondary}`}><BiText text={m.purpose} c={c} /></p></div>
                    <div><p className={`text-[10px] font-bold ${c.textMuteded}`}>HOW</p><p className={`text-sm ${c.textSecondaryondary}`}><BiText text={m.how_to_take} c={c} /></p></div>
                    {m.generic_available && <p className={`text-xs ${c.textMuteded}`}>💰 {m.generic_available}</p>}
                    {m.cost_considerations && <p className={`text-xs ${c.textMuteded}`}>💵 {m.cost_considerations}</p>}
                    {m.side_effects_to_watch?.length > 0 && <div className={`${c.warning} border rounded p-3`}><p className="text-[10px] font-bold mb-1">⚠️ Watch:</p>{m.side_effects_to_watch.map((e, j) => <p key={j} className="text-xs">• {e}</p>)}</div>}
                    {m.questions_to_ask_pharmacist?.length > 0 && <div className={`${c.highlight} border rounded p-3`}><p className="text-[10px] font-bold mb-1">💬 Ask:</p>{m.questions_to_ask_pharmacist.map((q, j) => <p key={j} className="text-xs">• {q}</p>)}</div>}
                  </div>
                </div>
              ))}</div>
            </Sec>
          )}

          {/* Med Safety */}
          {results.medication_safety && (
            <Sec icon="🛡️" title="Med Safety" open={secs.medSafety} onToggle={() => tog('medSafety')} c={c}>
              <div className="space-y-3">
                {results.medication_safety.interaction_warnings && <div className={`${c.danger} border rounded-lg p-4`}><h4 className="text-sm font-bold mb-1">⚠️ Interactions</h4><p className="text-xs">{results.medication_safety.interaction_warnings}</p></div>}
                {results.medication_safety.known_med_interactions && <div className={`${c.highlight} border rounded-lg p-4`}><h4 className="text-sm font-bold mb-1">💊 Known Med Check</h4><p className="text-xs">{results.medication_safety.known_med_interactions}</p></div>}
                {results.medication_safety.timing_conflicts && <div className={`${c.warning} border rounded-lg p-4`}><h4 className="text-sm font-bold mb-1">⏰ Timing</h4><p className="text-xs">{results.medication_safety.timing_conflicts}</p></div>}
                {results.medication_safety.food_interactions && <div className={`${c.cardAlt} border rounded-lg p-4`}><h4 className={`text-sm font-bold ${c.text} mb-1`}>🍽️ Food</h4><p className={`text-xs ${c.textSecondaryondary}`}>{results.medication_safety.food_interactions}</p></div>}
                {results.medication_safety.when_to_call_pharmacist?.length > 0 && <div className={`${c.highlight} border rounded-lg p-4`}><h4 className="text-sm font-bold mb-1">📞 Pharmacist</h4>{results.medication_safety.when_to_call_pharmacist.map((w, i) => <p key={i} className="text-xs">• {w}</p>)}</div>}
              </div>
            </Sec>
          )}

          {/* Tests */}
          {results.test_results_explained?.length > 0 && (
            <Sec icon="🔬" title="Tests" badge={`${results.test_results_explained.length}`} open={secs.tests} onToggle={() => tog('tests')} c={c}>
              <div className="space-y-3">{results.test_results_explained.map((t, i) => (
                <div key={i} className={`${c.cardAlt} border rounded-lg p-4`}>
                  <h4 className={`font-bold text-sm ${c.text} mb-2`}>{t.test}</h4>
                  <div className="grid grid-cols-2 gap-3 mb-2"><div><p className={`text-[10px] ${c.textMuteded}`}>Yours</p><p className={`text-sm font-semibold ${c.text}`}>{t.your_result}</p></div><div><p className={`text-[10px] ${c.textMuteded}`}>Normal</p><p className={`text-sm ${c.textSecondaryondary}`}>{t.normal_range}</p></div></div>
                  {t.trend && <p className={`text-xs ${c.textMuteded} mb-1`}>{t.trend === 'improving' ? '📉' : t.trend === 'worsening' ? '📈' : '➡️'} {t.trend}</p>}
                  <div className={`${c.highlight} border rounded p-3`}><p className="text-[10px] font-bold mb-0.5">Meaning:</p><p className="text-xs">{t.what_it_means}</p></div>
                  {t.next_steps && <p className={`text-xs ${c.textMuteded} mt-1`}>→ {t.next_steps}</p>}
                </div>
              ))}</div>
            </Sec>
          )}

          {/* Follow-up */}
          {results.follow_up_requirements && (
            <Sec icon="📅" title="Follow-up" open={secs.followUp} onToggle={() => tog('followUp')} c={c}>
              <div className="space-y-3">
                {results.follow_up_requirements.next_appointment && <div className={`${c.cardAlt} border rounded-lg p-4`}><h4 className={`font-semibold text-sm ${c.text} mb-1`}>📅 Next</h4><p className={`text-sm ${c.textSecondaryondary}`}><BiText text={results.follow_up_requirements.next_appointment} c={c} /></p></div>}
                {results.follow_up_requirements.what_to_monitor?.length > 0 && <div className={`${c.cardAlt} border rounded-lg p-4`}><h4 className={`font-semibold text-sm ${c.text} mb-1`}>👁️ Monitor</h4>{results.follow_up_requirements.what_to_monitor.map((w, i) => <p key={i} className={`text-xs ${c.textSecondaryondary}`}>• {w}</p>)}</div>}
                {results.follow_up_requirements.expected_results_timeline && <div className={`${c.highlight} border rounded-lg p-4`}><h4 className="text-sm font-bold mb-1">⏰ Improvement</h4><p className="text-xs">{results.follow_up_requirements.expected_results_timeline}</p></div>}
                {results.follow_up_requirements.warning_signs_immediate?.length > 0 && <div className={`${c.danger} border rounded-lg p-4`}><h4 className="text-sm font-bold mb-1">🚨 IMMEDIATELY:</h4>{results.follow_up_requirements.warning_signs_immediate.map((w, i) => <p key={i} className="text-xs">• <BiText text={w} c={c} /></p>)}</div>}
                {results.follow_up_requirements.warning_signs_soon?.length > 0 && <div className={`${c.warning} border rounded-lg p-4`}><h4 className="text-sm font-bold mb-1">📞 24-48h:</h4>{results.follow_up_requirements.warning_signs_soon.map((w, i) => <p key={i} className="text-xs">• {w}</p>)}</div>}
                {results.follow_up_requirements.when_to_call_doctor?.length > 0 && <div className={`${c.danger} border rounded-lg p-4`}><h4 className="text-sm font-bold mb-1">🚨 Call If:</h4>{results.follow_up_requirements.when_to_call_doctor.map((w, i) => <p key={i} className="text-xs">• <BiText text={w} c={c} /></p>)}</div>}
                {results.follow_up_requirements.what_to_bring_next_time?.length > 0 && <div className={`${c.cardAlt} border rounded-lg p-4`}><h4 className={`font-semibold text-sm ${c.text} mb-1`}>🎒 Bring</h4>{results.follow_up_requirements.what_to_bring_next_time.map((w, i) => <p key={i} className={`text-xs ${c.textSecondaryondary}`}>• {w}</p>)}</div>}
              </div>
            </Sec>
          )}

          {/* Questions */}
          {results.questions_for_next_visit?.length > 0 && (
            <Sec icon="❓" title="Questions" badge={`${results.questions_for_next_visit.length}`} open={secs.questions} onToggle={() => tog('questions')} c={c}
              actions={<CopyBtn content={results.questions_for_next_visit.join('\n') + '\n\n— Generated by DeftBrain · deftbrain.com'} label="Copy" />}>
              <div className={`${c.cardAlt} border rounded-lg p-4`}>{results.questions_for_next_visit.map((q, i) => <p key={i} className={`text-sm ${c.textSecondaryondary} mb-1`}>❓ {q}</p>)}</div>
            </Sec>
          )}

          {/* Second Opinion */}
          {results.second_opinion_guidance && (
            <Sec icon="🤝" title="Second Opinion" open={secs.secondOpinion} onToggle={() => tog('secondOpinion')} c={c}>
              <div className="space-y-3">
                {results.second_opinion_guidance.when_appropriate && <div className={`${c.cardAlt} border rounded-lg p-4`}><h4 className={`font-semibold text-sm ${c.text} mb-1`}>When</h4><p className={`text-xs ${c.textSecondaryondary}`}>{results.second_opinion_guidance.when_appropriate}</p></div>}
                {results.second_opinion_guidance.what_to_say && <div className={`${c.highlight} border rounded-lg p-4`}><h4 className="text-sm font-bold mb-1">💬 Say</h4><p className="text-xs italic">"{results.second_opinion_guidance.what_to_say}"</p></div>}
                {results.second_opinion_guidance.how_to_request_records && <div className={`${c.cardAlt} border rounded-lg p-4`}><h4 className={`font-semibold text-sm ${c.text} mb-1`}>📄 Records</h4><p className={`text-xs ${c.textSecondaryondary}`}>{results.second_opinion_guidance.how_to_request_records}</p></div>}
                {results.second_opinion_guidance.not_offensive && <div className={`${c.success} border rounded-lg p-4`}><p className="text-xs">✅ {results.second_opinion_guidance.not_offensive}</p></div>}
              </div>
            </Sec>
          )}

          {/* Advocacy */}
          {results.patient_advocacy && (
            <Sec icon="💪" title="Self-Advocacy" open={secs.advocacy} onToggle={() => tog('advocacy')} c={c}>
              <div className="space-y-3">{[{ k: 'if_you_disagree', l: 'Disagree', i: '🤔' }, { k: 'ask_for_clarification', l: 'Clarity', i: '💬' }, { k: 'bring_support', l: 'Support', i: '👥' }, { k: 'get_it_in_writing', l: 'Writing', i: '📝' }].map(f => results.patient_advocacy[f.k] && (
                <div key={f.k} className={`${c.cardAlt} border rounded-lg p-4`}><h4 className={`font-semibold text-sm ${c.text} mb-1`}>{f.i} {f.l}</h4><p className={`text-xs ${c.textSecondaryondary}`}>{results.patient_advocacy[f.k]}</p></div>
              ))}</div>
            </Sec>
          )}

          {/* Insurance */}
          {results.insurance_navigation && (
            <Sec icon="🏥" title="Insurance & Cost" open={secs.insurance} onToggle={() => tog('insurance')} c={c}>
              <div className="space-y-3">
                {results.insurance_navigation.likely_coverage && <div className={`${c.cardAlt} border rounded-lg p-4`}><h4 className={`font-semibold text-sm ${c.text} mb-1`}>📋 Coverage</h4><p className={`text-xs ${c.textSecondaryondary}`}>{results.insurance_navigation.likely_coverage}</p></div>}
                {results.insurance_navigation.prior_authorization && <div className={`${c.warning} border rounded-lg p-4`}><h4 className="text-sm font-bold mb-1">📑 Prior Auth</h4><p className="text-xs">{results.insurance_navigation.prior_authorization}</p></div>}
                {results.insurance_navigation.appeal_process && <div className={`${c.highlight} border rounded-lg p-4`}><h4 className="text-sm font-bold mb-1">📞 If Denied</h4><p className="text-xs">{results.insurance_navigation.appeal_process}</p></div>}
                {results.insurance_navigation.cost_resources?.length > 0 && <div className={`${c.success} border rounded-lg p-4`}><h4 className="text-sm font-bold mb-1">💡 Resources</h4>{results.insurance_navigation.cost_resources.map((r, i) => <p key={i} className="text-xs">• {r}</p>)}</div>}
              </div>
            </Sec>
          )}

          {results.health_literacy_tips?.length > 0 && (
            <Sec icon="💡" title="Tips" open={secs.tips} onToggle={() => tog('tips')} c={c}>
              <div className={`${c.success} border rounded-lg p-4`}>{results.health_literacy_tips.map((t, i) => <p key={i} className="text-xs mb-1">💡 {t}</p>)}</div>
            </Sec>
          )}

          <div className={`${c.warning} border-l-4 rounded-r-lg p-4 flex items-start gap-2`}><span>⚠️</span><p className="text-xs"><strong>Remember:</strong> This helps understand, not replace your doctor.</p></div>

          {/* Cross-references */}
          <p className={`text-xs ${c.textMuteded} text-center`}>
            Got a bill to dispute?{' '}<a href="/BillRescue" target="_blank" rel="noopener noreferrer" className={linkStyle}>Bill Rescue</a>{' '}
            helps fight insurance denials and medical billing errors.
          </p>
        </div>
      )}

      {/* ══════════ F1: SYMPTOM JOURNAL ══════════ */}
      {mode === 'journal' && (
        <div className="space-y-4">
          <div className={`${c.card} border rounded-xl p-5 space-y-4`}>
            <h3 className={`text-sm font-bold ${c.text} flex items-center gap-2`}><span>📓</span> Log Symptom</h3>
            <div>
              <label className={`text-xs font-semibold ${c.textSecondaryondary} block mb-1`}>Symptom</label>
              <div className="flex flex-wrap gap-1 mb-2">{SYMPTOM_PRESETS.map(s => (
                <button key={s} onClick={() => setJournalEntry(p => ({ ...p, symptom: s }))}
                  className={`text-[10px] px-2 py-1 rounded border transition-colors ${journalEntry.symptom === s ? (isDark ? 'border-cyan-500 bg-cyan-900/20' : 'border-cyan-500 bg-cyan-50') : `${c.pillGray} border`}`}>{s}</button>
              ))}</div>
              <input value={journalEntry.symptom} onChange={e => setJournalEntry(p => ({ ...p, symptom: e.target.value }))} placeholder="Or type custom..." className={`w-full p-2 border rounded-lg ${c.input} outline-none text-sm`} />
            </div>
            <div>
              <label className={`text-xs font-semibold ${c.textSecondaryondary} block mb-1`}>Severity: {journalEntry.severity}/10</label>
              <input type="range" min="1" max="10" value={journalEntry.severity} onChange={e => setJournalEntry(p => ({ ...p, severity: Number(e.target.value) }))} className="w-full" />
              <div className="flex justify-between text-[9px]"><span className={c.textMuteded}>Mild</span><span className={c.textMuteded}>Moderate</span><span className={c.textMuteded}>Severe</span></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={`text-xs font-semibold ${c.textSecondaryondary} block mb-1`}>Triggers</label><input value={journalEntry.triggers} onChange={e => setJournalEntry(p => ({ ...p, triggers: e.target.value }))} placeholder="Stress, food..." className={`w-full p-2 border rounded-lg ${c.input} outline-none text-sm`} /></div>
              <div><label className={`text-xs font-semibold ${c.textSecondaryondary} block mb-1`}>Notes</label><input value={journalEntry.notes} onChange={e => setJournalEntry(p => ({ ...p, notes: e.target.value }))} placeholder="Details..." className={`w-full p-2 border rounded-lg ${c.input} outline-none text-sm`} /></div>
            </div>
            <button onClick={addJournalEntry} disabled={!journalEntry.symptom.trim()} className={`w-full ${c.btnPrimaryPrimary} disabled:opacity-40 py-2 rounded-lg text-sm font-semibold`}>📓 Log</button>
          </div>

          {symptomTrends?.length > 0 && (
            <div className={`${c.card} border rounded-xl p-5`}>
              <div className="flex items-center justify-between mb-3"><h3 className={`text-sm font-bold ${c.text}`}>📈 Trends</h3><CopyBtn content={buildSymptomReport()} label="Export" /></div>
              <div className="space-y-2">{symptomTrends.map(t => (
                <div key={t.name} className={`${c.cardAlt} border rounded-lg p-3`}>
                  <div className="flex items-center justify-between mb-1"><span className={`text-sm font-semibold ${c.text}`}>{t.name}</span><span className={`${t.trend === 'improving' ? c.success : t.trend === 'worsening' ? c.danger : c.pillGray} border text-[9px] font-bold px-1.5 py-0.5 rounded`}>{t.trend === 'improving' ? '📉 Better' : t.trend === 'worsening' ? '📈 Worse' : '➡️ Stable'}</span></div>
                  <div className="flex items-center gap-2"><div className={`flex-1 h-3 rounded-full overflow-hidden ${isDark ? 'bg-zinc-800' : 'bg-gray-200'}`}><div className={`h-full rounded-full ${t.recentAvg >= 7 ? 'bg-red-500' : t.recentAvg >= 4 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${t.recentAvg * 10}%` }} /></div><span className={`text-xs ${c.textMuteded} w-14 text-right`}>{t.recentAvg}/10</span></div>
                  <p className={`text-[10px] ${c.textMuteded} mt-1`}>{t.count}× · avg {t.avg}/10 · last {t.last.date}</p>
                </div>
              ))}</div>
            </div>
          )}

          <div className={`${c.card} border rounded-xl p-5`}>
            <div className="flex items-center justify-between mb-3"><h3 className={`text-sm font-bold ${c.text}`}>📋 Recent ({journal.length})</h3>{journal.length > 0 && <button onClick={() => { if (window.confirm('Clear journal?')) setJournal([]); }} className={`text-xs ${c.textMuteded} ${c.deleteHover}`}>Clear</button>}</div>
            {journal.length === 0 ? <p className={`text-sm ${c.textSecondaryondary} text-center py-4`}>Log symptoms to track patterns.</p>
            : <div className="space-y-1.5 max-h-72 overflow-y-auto">{journal.slice(0, 6).map(e => (
              <div key={e.id} className="flex items-center gap-2">
                <span className={`w-16 text-[10px] ${c.textMuteded}`}>{e.date}</span>
                <span className={`text-xs font-semibold ${c.text} w-24 truncate`}>{e.symptom}</span>
                <div className={`flex-1 h-2 rounded-full overflow-hidden ${isDark ? 'bg-zinc-800' : 'bg-gray-200'}`}><div className={`h-full rounded-full ${e.severity >= 7 ? 'bg-red-500' : e.severity >= 4 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${e.severity * 10}%` }} /></div>
                <span className={`w-6 text-right text-[10px] font-bold ${c.textMuteded}`}>{e.severity}</span>
                {e.triggers && <span className={`${c.pillGray} border text-[9px] px-1 py-0.5 rounded truncate max-w-[60px]`}>{e.triggers}</span>}
                <button onClick={() => setJournal(p => p.filter(j => j.id !== e.id))} className={`text-[10px] ${c.textMuteded} ${c.deleteHover}`}>✕</button>
              </div>
            ))}</div>}
          </div>
        </div>
      )}

      {/* ══════════ HEALTH MODE ══════════ */}
      {mode === 'health' && (
        <div className="space-y-4">
          {/* F5: Reminders */}
          <div className={`${c.card} border rounded-xl p-5`}>
            <h3 className={`text-sm font-bold ${c.text} mb-3`}>⏰ Tasks ({reminders.filter(r => r.status === 'pending').length})</h3>
            {reminders.filter(r => r.status === 'pending').length === 0 ? <p className={`text-sm ${c.textSecondaryondary} text-center py-3`}>Save visits to auto-generate tasks.</p>
            : <div className="space-y-2">{reminders.filter(r => r.status === 'pending').sort((a, b) => a.dueDate.localeCompare(b.dueDate)).map(r => {
              const overdue = r.dueDate < new Date().toISOString().split('T')[0];
              return <div key={r.id} className={`${overdue ? c.danger : c.cardAlt} border rounded-lg p-3`}>
                <div className="flex items-start justify-between"><div className="flex-1"><p className={`text-sm font-semibold ${c.text}`}>{r.action}</p><div className="flex gap-1 mt-1"><span className={`${overdue ? c.danger : c.pillGray} border text-[9px] px-1.5 py-0.5 rounded`}>{overdue ? '🔴 ' : ''}Due {r.dueDate}</span><span className={`${r.priority === 'high' ? c.danger : c.warning} border text-[9px] px-1.5 py-0.5 rounded`}>{r.priority}</span></div>{r.why && <p className={`text-[10px] ${c.textMuteded} mt-1`}>{r.why}</p>}</div><div className="flex gap-1 ml-2"><button onClick={() => setReminders(p => p.map(rr => rr.id === r.id ? { ...rr, status: 'done' } : rr))} className={`text-xs ${c.textSecondaryondary}`}>✅</button><button onClick={() => setReminders(p => p.filter(rr => rr.id !== r.id))} className={`text-xs ${c.textMuteded} ${c.deleteHover}`}>🗑️</button></div></div>
              </div>;
            })}</div>}
            {reminders.filter(r => r.status === 'done').length > 0 && <div className="mt-3"><p className={`text-[10px] font-bold ${c.textMuteded} mb-1`}>DONE ({reminders.filter(r => r.status === 'done').length})</p>{reminders.filter(r => r.status === 'done').slice(0, 5).map(r => <p key={r.id} className={`text-xs ${c.textMuteded} line-through`}>✅ {r.action}</p>)}<button onClick={() => setReminders(p => p.filter(r => r.status !== 'done'))} className={`text-[10px] ${c.textMuteded} ${c.deleteHover} mt-1`}>Clear done</button></div>}
          </div>

          {/* Meds */}
          <div className={`${c.card} border rounded-xl p-5`}>
            <div className="flex items-center justify-between mb-3"><h3 className={`text-sm font-bold ${c.text}`}>💊 Meds ({medStats.active})</h3>{activeMeds.length > 0 && <CopyBtn content={activeMeds.map(m => `${m.name}\n  ${m.purpose}\n  ${m.howToTake}`).join('\n\n') + '\n\n— Generated by DeftBrain · deftbrain.com'} label="Copy" />}</div>
            {medList.length === 0 ? <p className={`text-sm ${c.textSecondaryondary} text-center py-3`}>Meds auto-add when you save visits.</p>
            : <>{activeMeds.length > 0 && <div className="space-y-2 mb-3">{activeMeds.map(m => (
              <div key={m.id} className={`${c.cardAlt} border rounded-lg p-3`}>
                <div className="flex items-start justify-between"><h4 className={`font-bold text-sm ${c.text}`}>💊 {m.name}</h4><button onClick={() => setMedList(p => p.map(mm => mm.id === m.id ? { ...mm, active: false } : mm))} className={`text-[10px] ${c.textMuteded}`}>Stop</button></div>
                <p className={`text-xs ${c.textSecondaryondary}`}>{m.purpose}</p><p className={`text-xs ${c.textMuteded}`}>📋 {m.howToTake}</p>
                {m.sideEffects?.length > 0 && <p className={`text-[10px] ${c.textMuteded} mt-1`}>⚠️ {m.sideEffects.slice(0, 2).join(', ')}</p>}
                <div className="flex gap-1 mt-1"><span className={`${c.pillGray} border text-[9px] px-1.5 py-0.5 rounded`}>Since {m.prescribedDate}</span>{m.doctor !== 'Unknown' && <span className={`${c.pillGray} border text-[9px] px-1.5 py-0.5 rounded`}>🩺 {m.doctor}</span>}</div>
              </div>
            ))}</div>}{medList.filter(m => !m.active).length > 0 && <div><p className={`text-[10px] font-bold ${c.textMuteded} mb-1`}>PAST</p>{medList.filter(m => !m.active).map(m => <div key={m.id} className="flex items-center justify-between opacity-60 mb-0.5"><span className={`text-xs ${c.text}`}>{m.name} <span className={`text-[10px] ${c.textMuteded}`}>{m.prescribedDate}</span></span><div className="flex gap-1"><button onClick={() => setMedList(p => p.map(mm => mm.id === m.id ? { ...mm, active: true } : mm))} className={`text-[10px] ${c.textSecondaryondary}`}>Reactivate</button><button onClick={() => setMedList(p => p.filter(mm => mm.id !== m.id))} className={`text-[10px] ${c.textMuteded} ${c.deleteHover}`}>🗑️</button></div></div>)}</div>}</>}
          </div>

          {/* History */}
          <div className={`${c.card} border rounded-xl p-5`}>
            <div className="flex items-center justify-between mb-3"><h3 className={`text-sm font-bold ${c.text}`}>📚 Visits ({history.length})</h3>{history.length > 0 && <button onClick={() => { if (window.confirm('Clear?')) setHistory([]); }} className={`text-xs ${c.textMuteded} ${c.deleteHover}`}>Clear</button>}</div>
            {history.length === 0 ? <p className={`text-sm ${c.textSecondaryondary} text-center py-3`}>Save translations to build history.</p>
            : <div className="space-y-2 max-h-80 overflow-y-auto">{history.map(e => (
              <div key={e.id} className={`${c.cardAlt} border rounded-lg p-3`}>
                <div className="flex items-center gap-1.5 mb-0.5 flex-wrap"><span className={`text-xs font-semibold ${c.text}`}>{e.date}</span><span className={`${c.highlight} border text-[9px] font-bold px-1.5 py-0.5 rounded`}>{e.visitType}</span>{e.doctorName !== 'Unknown' && <span className={`${c.pillGray} border text-[9px] px-1.5 py-0.5 rounded`}>🩺 {e.doctorName}</span>}{e.language && e.language !== 'en' && <span className={`${c.warning} border text-[9px] px-1.5 py-0.5 rounded`}>🌐</span>}{e.documentType && e.documentType !== 'visit' && <span className={`${c.pillGray} border text-[9px] px-1.5 py-0.5 rounded`}>{DOC_TYPES.find(d => d.id === e.documentType)?.label?.split(' ')[0]}</span>}</div>
                <p className={`text-xs ${c.text} line-clamp-1`}>{e.results?.plain_english_summary?.diagnosis?.split('|||')[0]?.slice(0, 6) || e.doctorNotes.slice(0, 6)}</p>
                {e.results?.medications?.length > 0 && <div className="flex flex-wrap gap-1 mt-0.5">{e.results.medications.slice(0, 3).map((m, i) => <span key={i} className={`${c.warning} border text-[9px] px-1 py-0.5 rounded`}>💊 {m.name.split(' ')[0]}</span>)}</div>}
                <div className="flex gap-2 mt-1.5"><button onClick={() => viewEntry(e)} className={`${c.btnPrimarySecondaryondary} text-xs px-3 py-1 rounded-lg`}>👁️ View</button><button onClick={() => setHistory(p => p.filter(h => h.id !== e.id))} className={`text-xs ${c.textMuteded} ${c.deleteHover} px-1`}>🗑️</button></div>
              </div>
            ))}</div>}
          </div>

          {history.length >= 2 && (
            <div className={`${c.card} border rounded-xl p-5`}><h3 className={`text-sm font-bold ${c.text} mb-3`}>📈 Timeline</h3><div className="relative pl-4 border-l-2 border-gray-300 space-y-2">{history.slice(0, 6).map(e => (<div key={e.id} className="relative"><div className="absolute -left-[21px] w-3 h-3 rounded-full bg-cyan-500" /><p className={`text-[10px] font-bold ${c.textMuteded}`}>{e.date} · {e.visitType}</p><p className={`text-xs ${c.text}`}>{e.results?.plain_english_summary?.diagnosis?.split('|||')[0]?.slice(0, 6) || 'Visit'}</p>{e.results?.medications?.length > 0 && <p className={`text-[10px] ${c.textSecondaryondary}`}>💊 {e.results.medications.map(m => m.name.split(' ')[0]).join(', ')}</p>}</div>))}</div></div>
          )}
        </div>
      )}

      {/* ══════════ PREP MODE ══════════ */}
      {mode === 'prep' && (
        <div className="space-y-4">
          <div className={`${c.card} border rounded-xl p-6 space-y-5`}>
            <div className={`${c.highlight} border-l-4 rounded-r-lg p-4 flex items-start gap-2`}><span>📝</span><div><h4 className="font-bold text-sm mb-0.5">Prepare for Your Visit</h4><p className="text-xs">Fill this before your appointment.</p></div></div>
            <div className="grid grid-cols-2 gap-4"><div><label className={`text-sm font-semibold ${c.textSecondaryondary} block mb-1.5`}>Type</label><select value={visitType} onChange={e => setVisitType(e.target.value)} className={`w-full p-2.5 border rounded-lg ${c.input} outline-none text-sm`}>{VISIT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div><div><label className={`text-sm font-semibold ${c.textSecondaryondary} block mb-1.5`}>Doctor</label><input value={doctorName} onChange={e => setDoctorName(e.target.value)} placeholder="Dr. Smith" className={`w-full p-2.5 border rounded-lg ${c.input} outline-none text-sm`} /></div></div>
            <div><label className={`text-sm font-semibold ${c.textSecondaryondary} block mb-1.5`}>Symptoms</label><textarea value={prepData.symptoms} onChange={e => setPrepData(p => ({ ...p, symptoms: e.target.value }))} placeholder="What's bothering you?" className={`w-full h-20 p-3 border-2 rounded-lg ${c.input} outline-none resize-none text-sm`} /></div>
            <div className="grid grid-cols-2 gap-4"><div><label className={`text-sm font-semibold ${c.textSecondaryondary} block mb-1.5`}>Duration</label><input value={prepData.duration} onChange={e => setPrepData(p => ({ ...p, duration: e.target.value }))} placeholder="2 weeks, 3 months..." className={`w-full p-2.5 border rounded-lg ${c.input} outline-none text-sm`} /></div><div><label className={`text-sm font-semibold ${c.textSecondaryondary} block mb-1.5`}>Severity (1-10)</label><input value={prepData.severity} onChange={e => setPrepData(p => ({ ...p, severity: e.target.value }))} placeholder="1=mild 10=worst" className={`w-full p-2.5 border rounded-lg ${c.input} outline-none text-sm`} /></div></div>
            <div><div className="flex items-center justify-between mb-1.5"><label className={`text-sm font-semibold ${c.textSecondaryondary}`}>Questions</label><button onClick={() => setPrepData(p => ({ ...p, questions: [...p.questions, ''] }))} className={`text-xs ${c.textSecondaryondary}`}>➕</button></div><div className="space-y-1.5">{prepData.questions.map((q, i) => <div key={i} className="flex gap-2"><span className={c.textMuteded}>❓</span><input value={q} onChange={e => setPrepData(p => ({ ...p, questions: p.questions.map((qq, j) => j === i ? e.target.value : qq) }))} placeholder={`Question ${i + 1}...`} className={`flex-1 p-2 border rounded-lg ${c.input} outline-none text-sm`} />{prepData.questions.length > 1 && <button onClick={() => setPrepData(p => ({ ...p, questions: p.questions.filter((_, j) => j !== i) }))} className={`${c.textMuteded} ${c.deleteHover}`}>🗑️</button>}</div>)}</div></div>
          </div>

          {symptomTrends?.length > 0 && <div className={`${c.card} border rounded-xl p-5`}><h3 className={`text-sm font-bold ${c.text} mb-3`}>📓 Journal Trends</h3><p className={`text-xs ${c.textMuteded} mb-2`}>Show your doctor</p>{symptomTrends.map(t => <div key={t.name} className="flex items-center gap-2 mb-1.5"><span className={`text-xs font-semibold ${c.text} w-24`}>{t.name}</span><div className={`flex-1 h-2 rounded-full ${isDark ? 'bg-zinc-800' : 'bg-gray-200'}`}><div className={`h-full rounded-full ${t.recentAvg >= 7 ? 'bg-red-500' : t.recentAvg >= 4 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${t.recentAvg * 10}%` }} /></div><span className={`text-[10px] ${c.textMuteded}`}>{t.recentAvg}/10 · {t.trend}</span></div>)}</div>}

          {history.some(e => e.results?.questions_for_next_visit?.length) && <div className={`${c.card} border rounded-xl p-5`}><h3 className={`text-sm font-bold ${c.text} mb-3`}>❓ Past Questions</h3>{history.filter(e => e.results?.questions_for_next_visit?.length).slice(0, 3).flatMap(e => e.results.questions_for_next_visit.map((q, i) => <div key={`${e.id}-${i}`} className="flex items-start gap-2 mb-1"><span className={c.textMuteded}>❓</span><div><p className={`text-xs ${c.textSecondaryondary}`}>{q}</p><p className={`text-[9px] ${c.textMuteded}`}>{e.date}</p></div></div>))}</div>}

          {activeMeds.length > 0 && <div className={`${c.card} border rounded-xl p-5`}><h3 className={`text-sm font-bold ${c.text} mb-2`}>💊 Med List</h3>{activeMeds.map(m => <div key={m.id} className="flex gap-2 mb-0.5"><span>💊</span><span className={`text-xs ${c.text}`}>{m.name}</span><span className={`text-[10px] ${c.textMuteded}`}>— {m.howToTake}</span></div>)}</div>}

          <div className={`${c.card} border rounded-xl p-5`}><h3 className={`text-sm font-bold ${c.text} mb-2`}>🎒 Bring</h3>{['Insurance card & ID','Medication list','This prep sheet','Notebook','Recent test results','Questions list'].map((item, i) => <div key={i} className="flex items-start gap-2 mb-0.5"><span>☑️</span><p className={`text-xs ${c.textSecondaryondary}`}>{item}</p></div>)}</div>

          <ActionBar content={buildPrepExport()} title="Appointment Prep" />
        </div>
      )}
        <div className={`mt-6 pt-4 border-t text-sm ${c.border} ${c.textMuteded}`}>
          <p className="mb-2 font-medium">You might also like:</p>
          <div className="flex flex-wrap gap-2">
            {[{slug:'procedure-probe',label:'🔬 Procedure Probe'},{slug:'plain-talk',label:'💬 Plain Talk'},{slug:'jargon-assassin',label:'🗡️ Jargon Assassin'}].map(({slug,label})=>(
              <a key={slug} href={`/tool/${slug}`} className={linkStyle}>{label}</a>
            ))}
          </div>
        </div>
    </div>
  );
};

DoctorVisitTranslator.displayName = 'DoctorVisitTranslator';
export default DoctorVisitTranslator;
