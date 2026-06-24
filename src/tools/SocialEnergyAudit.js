import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';
import { usePersistentState } from '../hooks/usePersistentState';
import { useRegisterActions } from '../components/ActionBarContext';
import { useTranslation } from '../i18n/useTranslation';


// ════════════════════════════════════════════════════════════
// CONSTANTS
// `value`/`category` ids stay English (sent to backend); display labels resolve
// through t() at render via labelKey.
// ════════════════════════════════════════════════════════════
const CATEGORIES = [
  { value: 'work', labelKey: 'sea_cat_work', icon: '💼' },
  { value: 'social', labelKey: 'sea_cat_social', icon: '🎉' },
  { value: 'family', labelKey: 'sea_cat_family', icon: '👨‍👩‍👧' },
  { value: 'errands', labelKey: 'sea_cat_errands', icon: '🏃' },
  { value: 'creative', labelKey: 'sea_cat_creative', icon: '🎨' },
  { value: 'health', labelKey: 'sea_cat_health', icon: '🏥' },
];

// `situation` is the backend-bound English id (also matched against typed
// interaction.situation); `labelKey` is the displayed/typed value.
const QUICK_PRESETS = [
  { situation: 'Team meeting', labelKey: 'sea_preset_team_meeting', category: 'work', performance: 6, icon: '🗣️' },
  { situation: '1-on-1 with manager', labelKey: 'sea_preset_1on1_manager', category: 'work', performance: 7, icon: '👔' },
  { situation: 'Client/customer call', labelKey: 'sea_preset_client_call', category: 'work', performance: 8, icon: '📞' },
  { situation: 'Networking event', labelKey: 'sea_preset_networking', category: 'social', performance: 9, icon: '🤝' },
  { situation: 'Lunch with coworkers', labelKey: 'sea_preset_lunch_coworkers', category: 'work', performance: 5, icon: '🍽️' },
  { situation: 'Dinner with friends', labelKey: 'sea_preset_dinner_friends', category: 'social', performance: 3, icon: '🍕' },
  { situation: 'Family gathering', labelKey: 'sea_preset_family_gathering', category: 'family', performance: 6, icon: '🏠' },
  { situation: 'Date night', labelKey: 'sea_preset_date_night', category: 'social', performance: 4, icon: '💕' },
  { situation: 'Grocery shopping', labelKey: 'sea_preset_grocery', category: 'errands', performance: 3, icon: '🛒' },
  { situation: 'Doctor appointment', labelKey: 'sea_preset_doctor', category: 'health', performance: 5, icon: '🩺' },
  { situation: 'Presentation/talk', labelKey: 'sea_preset_presentation', category: 'work', performance: 9, icon: '📊' },
  { situation: 'Solo time (recharge)', labelKey: 'sea_preset_solo', category: 'creative', performance: 1, icon: '🧘' },
];

// `value` is the backend-bound English day id; `labelKey` is the display label.
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_LABEL_KEYS = {
  Monday: 'sea_day_monday', Tuesday: 'sea_day_tuesday', Wednesday: 'sea_day_wednesday',
  Thursday: 'sea_day_thursday', Friday: 'sea_day_friday', Saturday: 'sea_day_saturday',
  Sunday: 'sea_day_sunday',
};

// `value` is the backend-bound English duration; `labelKey` is the display label.
const DURATION_OPTIONS = [
  { value: '15 min', labelKey: 'sea_dur_15min' },
  { value: '30 min', labelKey: 'sea_dur_30min' },
  { value: '1 hour', labelKey: 'sea_dur_1hour' },
  { value: '1.5 hours', labelKey: 'sea_dur_15hours' },
  { value: '2 hours', labelKey: 'sea_dur_2hours' },
  { value: '3+ hours', labelKey: 'sea_dur_3plus' },
  { value: 'Half day', labelKey: 'sea_dur_halfday' },
  { value: 'Full day', labelKey: 'sea_dur_fullday' },
];

const MAX_WEEKS = 12;

const CROSS_REFS = [
  { id: 'CrashPredictor', icon: '📉', labelKey: 'sea_xref_crash_label' },
  { id: 'DopamineMenuBuilder', icon: '🧪', labelKey: 'sea_xref_dopamine_label' },
  { id: 'BrainStateDeejay', icon: '🎧', labelKey: 'sea_xref_brainstate_label' },
];

// ════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════
const SocialEnergyAudit = ({ tool }) => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const resultsRef = useRef(null);
  const rechargeResultsRef = useRef(null);


  // ── Theme ──

  const c = {
    card:          isDark ? 'bg-zinc-800' : 'bg-white',
    cardAlt:       isDark ? 'bg-zinc-700/50' : 'bg-slate-50',
    input:         isDark ? 'bg-zinc-900 border-zinc-600 text-zinc-100 placeholder-zinc-400 focus:border-cyan-500 focus:ring-cyan-500/20' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-cyan-500 focus:ring-cyan-100',
    text:          isDark ? 'text-zinc-50' : 'text-gray-900',
    textSecondary: isDark ? 'text-zinc-300' : 'text-gray-600',
    textMuted:     isDark ? 'text-zinc-500' : 'text-gray-400',
    required:      isDark ? 'text-amber-400' : 'text-amber-500',
    labelText:     isDark ? 'text-zinc-200' : 'text-gray-700',
    accentTxt:     isDark ? 'text-cyan-400' : 'text-cyan-600',
    btnPrimary:    isDark ? 'bg-cyan-600 hover:bg-cyan-500 text-white' : 'bg-cyan-600 hover:bg-cyan-700 text-white',
    btnSecondary:  isDark ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    border:        isDark ? 'border-zinc-700' : 'border-gray-200',
    success:       isDark ? 'bg-emerald-900/20 border-emerald-700 text-emerald-200' : 'bg-emerald-50 border-emerald-300 text-emerald-800',
    warning:       isDark ? 'bg-amber-900/20 border-amber-700 text-amber-200' : 'bg-amber-50 border-amber-300 text-amber-800',
    danger:        isDark ? 'bg-red-900/20 border-red-700 text-red-200' : 'bg-red-50 border-red-200 text-red-800',
    infoBox:       isDark ? 'bg-sky-900/20 border-sky-700 text-sky-200' : 'bg-sky-50 border-sky-200 text-sky-800',
    successTxt:    isDark ? 'text-emerald-300' : 'text-emerald-800',
    warningBox:    isDark ? 'bg-amber-900/20 border-amber-700' : 'bg-amber-50 border-amber-300',
    warningTxt:    isDark ? 'text-amber-300' : 'text-amber-800',
    pillActive:    isDark ? 'border-cyan-500 bg-cyan-900/30 text-cyan-200' : 'border-cyan-600 bg-cyan-100 text-cyan-900',
    pillInactive:  isDark ? 'border-zinc-600 text-zinc-400 hover:border-zinc-500' : 'border-gray-300 text-gray-500 hover:border-gray-400',
    quoteBg:       isDark ? 'bg-zinc-700/50' : 'bg-slate-50',
    verdict:       isDark ? 'bg-zinc-800' : 'bg-white',
  };
  // Aliases for legacy usages in this component
  c.textMuteded = c.textMuted;
  c.label = c.labelText;

  const linkStyle = isDark
    ? 'text-cyan-400 hover:text-cyan-300 underline underline-offset-2'
    : 'text-cyan-600 hover:text-cyan-700 underline underline-offset-2';

  // ── Views ──
  const [view, setView] = useState('log'); // log | results | plan | recharge | journal

  // ── Interaction Logger ──
  const [interactions, setInteractions] = useState([]);
  const [weekLabel, setWeekLabel] = useState('');

  // ── Results ──
  const [results, setResults] = usePersistentState('socialenergyaudit-result', null);
  const [sessionHistory, setSessionHistory] = usePersistentState('socialenergyaudit-history', []);
  const [error, setError] = useState('');

  // ── Week Planner ──
  const [upcoming, setUpcoming] = useState([
    { situation: '', category: 'work', day: 'Monday', duration: '', performance: 5 },
  ]);
  const [planResults, setPlanResults] = useState(null);

  // ── Recharge ──
  const [currentEnergy, setCurrentEnergy] = useState(4);
  const [topDrains, setTopDrains] = useState('');
  const [rechargePrefs, setRechargePrefs] = useState('');
  const [rechargeResults, setRechargeResults] = useState(null);

  // ── Journal ──
  const [journal, setJournal] = usePersistentState('sea-journal', []);

  // ── Templates ──
  const [savedTemplate, setSavedTemplate] = usePersistentState('sea-template', null);

  // ── Compare ──
  const [compareMode, setCompareMode] = useState(false);
  const [compareA, setCompareA] = useState(null); // journal entry id
  const [compareB, setCompareB] = useState(null);

  // ── Edit journal entry ──
  const [editingEntryId, setEditingEntryId] = useState(null);

  // ── Quick Check ("Should I Say Yes?") ──
  const [qcCommitment, setQcCommitment] = useState('');
  const [qcEnergy, setQcEnergy] = useState(5);
  const [qcWeekContext, setQcWeekContext] = useState('');
  const [qcResults, setQcResults] = useState(null);

  // ── Daily Check-In ──
  const [dailyCheckins, setDailyCheckins] = usePersistentState('sea-checkins', []);
  const [ciEnergy, setCiEnergy] = useState(5);
  const [ciDrain, setCiDrain] = useState('');
  const [ciRecharge, setCiRecharge] = useState('');

  // ── Forecast ──
  const [forecastResults, setForecastResults] = useState(null);

  // ── Ideal Week ──
  const [idealWeekResults, setIdealWeekResults] = useState(null);

  // ── Other / custom interaction entry ──
  const [otherText, setOtherText] = useState('');
  const [showOther, setShowOther] = useState(false);
  const otherInputRef = useRef(null);

  const addFromOther = () => {
    const val = otherText.trim();
    if (!val) return;
    shouldFocusNewInteractionsRef.current = true;
    setInteractions(p => [...p, { situation: val, category: 'work', performance: 5, energyBefore: 7, energyAfter: 5, duration: '', custom: true }]);
    setOtherText('');
    setShowOther(false);
  };

  // ── Scroll to results + reset ──
  useEffect(() => {
    if (!results || !resultsRef.current) return;
    const timer = setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results]);

  useEffect(() => {
    if (!rechargeResults || !rechargeResultsRef.current) return;
    const timer = setTimeout(() => rechargeResultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rechargeResults]);

  const runAuditRef = useRef(null);

  const interactionsInputRefs = useRef([]);
  const shouldFocusNewInteractionsRef = useRef(false);
  const upcomingInputRefs = useRef([]);
  const shouldFocusNewUpcomingRef = useRef(false);
  useEffect(() => {
    const handler = (e) => {
      if (e.key !== 'Enter' || !(e.metaKey || e.ctrlKey)) return;
      const tag = document.activeElement?.tagName;
      if (tag === 'SELECT') return;
      if (!loading) runAuditRef.current?.();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  useEffect(() => {
    if (shouldFocusNewInteractionsRef.current) {
      const last = interactionsInputRefs.current[interactions.length - 1];
      if (last) last.focus();
      shouldFocusNewInteractionsRef.current = false;
    }
  }, [interactions.length]);

  useEffect(() => {
    if (shouldFocusNewUpcomingRef.current) {
      const last = upcomingInputRefs.current[upcoming.length - 1];
      if (last) last.focus();
      shouldFocusNewUpcomingRef.current = false;
    }
  }, [upcoming.length]);

  const handleReset = useCallback(() => {
    setResults(null);
    setView('log');
    setError('');
  }, [setResults]);

  const loadExample = useCallback(() => {
    setInteractions([
      { situation: 'Team meeting', category: 'work', performance: 6, energyBefore: 7, energyAfter: 4, duration: '1 hour', custom: false },
      { situation: 'Lunch with coworkers', category: 'work', performance: 5, energyBefore: 5, energyAfter: 3, duration: '1 hour', custom: false },
      { situation: 'Networking event', category: 'social', performance: 8, energyBefore: 6, energyAfter: 2, duration: '2 hours', custom: false },
      { situation: 'Solo time (recharge)', category: 'creative', performance: 1, energyBefore: 3, energyAfter: 7, duration: '1.5 hours', custom: false },
    ]);
    setError('');
  }, []);

  // ── Interaction helpers ──
  const removeInteraction = (i) => setInteractions(p => p.filter((_, idx) => idx !== i));
  const updateInteraction = (i, field, val) => {
    setInteractions(p => p.map((item, idx) => idx === i ? { ...item, [field]: val } : item));
  };
  const addFromPreset = (preset) => {
    shouldFocusNewInteractionsRef.current = true;
    setInteractions(p => [...p, {
      situation: preset.situation,
      category: preset.category,
      performance: preset.performance,
      energyBefore: 7,
      energyAfter: 5,
      duration: '',
      custom: false,
    }]);
  };

  // ── Template helpers ──
  const saveCurrentAsTemplate = () => {
    const valid = interactions.filter(i => i.situation.trim());
    if (valid.length === 0) return;
    const template = valid.map(i => ({
      situation: i.situation, category: i.category,
      performance: i.performance, duration: i.duration,
    }));
    setSavedTemplate(template);
  };

  const loadFromTemplate = () => {
    if (!savedTemplate) return;
    setInteractions(savedTemplate.map(item => ({
      ...item, energyBefore: 7, energyAfter: 5,
    })));
  };

  const deleteTemplate = () => {
    setSavedTemplate(null);
  };

  // ── Edit from journal ──
  const editJournalEntry = (entry) => {
    if (!entry.interactions?.length) return;
    setInteractions(entry.interactions.map(i => ({ ...i })));
    setWeekLabel(entry.label || '');
    setEditingEntryId(entry.id);
    setView('log');
  };

  // ── Recharge text builder ──
  const buildRechargeText = useCallback(() => {
    if (!rechargeResults) return '';
    const r = rechargeResults;
    const lines = [t('sea_copy_recharge_header'), ''];
    if (r.energy_assessment) lines.push(r.energy_assessment, '');
    if (r.immediate) {
      if (r.immediate.do_now) lines.push(t('sea_copy_right_now', { value: r.immediate.do_now }));
      if (r.immediate.avoid) lines.push(t('sea_copy_avoid', { value: r.immediate.avoid }));
      lines.push('');
    }
    if (r.tonight) lines.push(t('sea_copy_tonight', { value: r.tonight.activity }), '');
    if (r.this_week?.length) {
      lines.push(t('sea_copy_this_week'));
      r.this_week.forEach(a => lines.push(`  → ${a}`));
      lines.push('');
    }
    if (r.boundaries_to_set?.length) {
      lines.push(t('sea_copy_boundaries'));
      r.boundaries_to_set.forEach(b => lines.push(`  • ${b}`));
      lines.push('');
    }
    if (r.recharge_ratio) lines.push(`📐 ${r.recharge_ratio}`);
    lines.push('\n— Generated by DeftBrain · deftbrain.com');
    return lines.join('\n');
  }, [rechargeResults, t]);

  // ── API: Quick Check ──
  const runQuickCheck = useCallback(async () => {
    if (!qcCommitment.trim()) return;
    setError('');
    setQcResults(null);
    try {
      // Build week context from daily check-ins + interactions
      let weekContext = qcWeekContext.trim() || null;
      if (!weekContext && dailyCheckins.length > 0) {
        const recent = dailyCheckins.slice(0, 5);
        weekContext = recent.map(d => `${d.day}: energy ${d.energy}/10${d.biggestDrain ? `, drain: ${d.biggestDrain}` : ''}`).join('; ');
      }
      const data = await callToolEndpoint('social-energy-audit/quick-check', {
        commitment: qcCommitment.trim(),
        currentEnergy: qcEnergy,
        weekSoFar: weekContext,
      });
      setQcResults(data);
    } catch (err) {
      setError(err.message || t('sea_err_qc_failed'));
    }
  }, [qcCommitment, qcEnergy, qcWeekContext, dailyCheckins, callToolEndpoint, t]);

  // ── Daily Check-In: save ──
  const saveDailyCheckin = useCallback(() => {
    const today = new Date();
    const dayName = DAYS[today.getDay() === 0 ? 6 : today.getDay() - 1];
    const entry = {
      id: Date.now(),
      date: today.toISOString(),
      day: dayName,
      energy: ciEnergy,
      biggestDrain: ciDrain.trim() || null,
      biggestRecharge: ciRecharge.trim() || null,
    };
    const updated = [entry, ...dailyCheckins].slice(0, 60);
    setDailyCheckins(updated);
    setCiEnergy(5);
    setCiDrain('');
    setCiRecharge('');
  }, [ciEnergy, ciDrain, ciRecharge, dailyCheckins]);

  // ── API: Forecast ──
  const runForecast = useCallback(async () => {
    setError('');
    setForecastResults(null);
    try {
      // Build past summaries
      let pastSummaries = null;
      if (journal.length > 0) {
        pastSummaries = journal.slice(0, 3).map(w =>
          `${w.label}: score ${w.energyScore}, verdict: ${w.verdict}`
        ).join('\n');
      }
      // Recent daily checkins
      const recentCheckins = dailyCheckins.slice(0, 7);

      const data = await callToolEndpoint('social-energy-audit/forecast', {
        template: savedTemplate || null,
        dailyLogs: recentCheckins.length > 0 ? recentCheckins : null,
        pastWeekSummaries: pastSummaries,
      });
      setForecastResults(data);
    } catch (err) {
      setError(err.message || t('sea_err_forecast_failed'));
    }
  }, [savedTemplate, dailyCheckins, journal, callToolEndpoint, t]);

  // ── API: Ideal Week ──
  const runIdealWeek = useCallback(async () => {
    if (journal.length < 3) return;
    setError('');
    setIdealWeekResults(null);
    try {
      const weekSummaries = journal.slice(0, 6).map(w => ({
        label: w.label,
        interactionCount: w.interactionCount,
        energyScore: w.energyScore,
        verdict: w.verdict,
        interactions: w.interactions,
      }));

      // Recurring interactions (from template or frequency analysis)
      let recurring = null;
      if (savedTemplate) {
        recurring = savedTemplate.map(item => `${item.situation} [${item.category}, perf ${item.performance}]`).join(', ');
      }

      const data = await callToolEndpoint('social-energy-audit/ideal-week', {
        weekSummaries,
        recurringInteractions: recurring,
      });
      setIdealWeekResults(data);
    } catch (err) {
      setError(err.message || t('sea_err_idealweek_failed'));
    }
  }, [journal, savedTemplate, callToolEndpoint, t]);

  // ── People Tracker: mine journal data ──
  const peopleInsights = useMemo(() => {
    if (journal.length < 2) return null;

    // Extract all interactions across all journal entries
    const allInteractions = journal.flatMap(w => w.interactions || []);
    if (allInteractions.length < 5) return null;

    // Find recurring situation keywords that appear 2+ times
    const situationCounts = {};
    allInteractions.forEach(int => {
      const sit = int.situation?.toLowerCase().trim();
      if (!sit) return;
      if (!situationCounts[sit]) {
        situationCounts[sit] = { count: 0, totalDrain: 0, totalPerf: 0, situation: int.situation };
      }
      situationCounts[sit].count += 1;
      situationCounts[sit].totalDrain += (int.energyBefore || 5) - (int.energyAfter || 5);
      situationCounts[sit].totalPerf += (int.performance || 5);
    });

    const recurring = Object.values(situationCounts)
      .filter(s => s.count >= 2)
      .map(s => ({
        situation: s.situation,
        count: s.count,
        avgDrain: +(s.totalDrain / s.count).toFixed(1),
        avgPerf: +(s.totalPerf / s.count).toFixed(1),
      }))
      .sort((a, b) => b.avgDrain - a.avgDrain);

    if (recurring.length === 0) return null;

    const drains = recurring.filter(r => r.avgDrain > 1);
    const rechargers = recurring.filter(r => r.avgDrain < 0);
    const neutral = recurring.filter(r => r.avgDrain >= 0 && r.avgDrain <= 1);

    return { drains, rechargers, neutral, total: recurring.length };
  }, [journal]);

  // ── Upcoming helpers ──
  const addUpcoming = () => {
    shouldFocusNewUpcomingRef.current = true;
    setUpcoming(p => [...p, { situation: '', category: 'work', day: 'Monday', duration: '', performance: 5 }]);
  };
  const removeUpcoming = (i) => setUpcoming(p => p.filter((_, idx) => idx !== i));
  const updateUpcoming = (i, field, val) => {
    setUpcoming(p => p.map((item, idx) => idx === i ? { ...item, [field]: val } : item));
  };


  // ── API: Week Planner ──
  const runPlan = useCallback(async () => {
    const valid = upcoming.filter(u => u.situation.trim());
    if (valid.length === 0) return;
    setError('');
    setPlanResults(null);

    try {
      // Build past patterns summary if we have journal data
      let pastPatterns = null;
      if (journal.length > 0) {
        const recent = journal.slice(0, 3);
        pastPatterns = recent.map(w =>
          `${w.label}: ${w.interactionCount} interactions, energy score ${w.energyScore}, verdict: ${w.verdict}`
        ).join('\n');
      }

      const data = await callToolEndpoint('social-energy-audit/plan', {
        upcoming: valid,
        pastPatterns,
      });
      setPlanResults(data);
    } catch (err) {
      setError(err.message || t('sea_err_planning_failed'));
    }
  }, [upcoming, journal, callToolEndpoint, t]);

  // ── API: Recharge ──
  const runRecharge = useCallback(async () => {
    setError('');
    setRechargeResults(null);
    try {
      const data = await callToolEndpoint('social-energy-audit/recharge', {
        currentEnergy,
        topDrains: topDrains.trim() || (results?.drains?.[0]?.situation) || null,
        preferences: rechargePrefs.trim() || null,
      });
      setRechargeResults(data);
    } catch (err) {
      setError(err.message || t('sea_err_recharge_failed'));
    }
  }, [currentEnergy, topDrains, rechargePrefs, results, callToolEndpoint, t]);

  // ── Build text for copy/share ──
  const buildFullText = useCallback(() => {
    if (!results) return '';
    const r = results;
    const lines = [t('sea_copy_audit_header'), ''];
    if (r.energy_score) {
      lines.push(t('sea_copy_energy', { value: r.energy_score.total_energy_spent }));
      lines.push(t('sea_copy_verdict', { value: r.energy_score.sustainability_verdict }));
      lines.push(r.energy_score.one_liner || '', '');
    }
    if (r.drains?.length) {
      lines.push(t('sea_copy_top_drains'));
      r.drains.forEach(d => lines.push(`  • ${t('sea_copy_drain_line', { situation: d.situation, cost: d.energy_cost, tax: d.performance_tax })}`));
      lines.push('');
    }
    if (r.rechargers?.length) {
      lines.push(t('sea_copy_rechargers'));
      r.rechargers.forEach(rc => lines.push(`  • ${t('sea_copy_recharger_line', { situation: rc.situation, effect: rc.energy_effect })}`));
      lines.push('');
    }
    if (r.restructure_suggestions?.length) {
      lines.push(t('sea_copy_suggestions'));
      r.restructure_suggestions.forEach(s => lines.push(`  • ${s}`));
    }
    lines.push('\n— Generated by DeftBrain · deftbrain.com');
    return lines.join('\n');
  }, [results, t]);

  // Wire runAuditRef every render so keyboard handler always has the latest closure
  const runAudit = async () => {
    const valid = interactions.filter(i => i.situation.trim());
    if (valid.length === 0) { setError(t('sea_err_log_one')); return; }
    setError('');
    setResults(null);

    try {
      const data = await callToolEndpoint('social-energy-audit', {
        interactions: valid,
        weekLabel: weekLabel.trim() || undefined,
      });
      setResults(data);
      // Exception: 40 is a preview-string char truncation, not a history cap; the session-history cap is .slice(0, 6) below.
      setSessionHistory(prev => [{ id: Date.now(), date: new Date().toISOString(), preview: (weekLabel || '').slice(0, 40) }, ...prev].slice(0, 6));
      setView('results');

      // Save to journal (update if editing, prepend if new)
      const entry = {
        id: editingEntryId || Date.now(),
        date: new Date().toISOString(),
        label: weekLabel.trim() || t('sea_week_of', { date: new Date().toLocaleDateString() }),
        interactionCount: valid.length,
        energyScore: data.energy_score?.total_energy_spent,
        verdict: data.energy_score?.sustainability_verdict,
        oneLiner: data.energy_score?.one_liner,
        interactions: valid,
      };
      let updated;
      if (editingEntryId) {
        updated = journal.map(j => j.id === editingEntryId ? entry : j);
        setEditingEntryId(null);
      } else {
        updated = [entry, ...journal].slice(0, MAX_WEEKS);
      }
      setJournal(updated);
    } catch (err) {
      setError(err.message || t('sea_err_audit_failed'));
    }
  };
  runAuditRef.current = runAudit;

  // Register content for the ActionBar in the wrapper header
  const actionContent = view === 'recharge' ? buildRechargeText() : buildFullText();
  useRegisterActions(actionContent, tool?.title || t('sea_title'));

  // ── Journal stats + trends ──
  const journalStats = useMemo(() => {
    if (journal.length < 2) return null;
    const verdicts = journal.map(j => j.verdict).filter(Boolean);
    const burnoutWeeks = verdicts.filter(v => v?.includes('BURNOUT') || v?.includes('EMPTY')).length;
    const sustainableWeeks = verdicts.filter(v => v?.includes('SUSTAINABLE')).length;

    // Parse numeric energy scores for trend
    const scores = journal.map(j => {
      if (!j.energyScore) return null;
      const num = parseInt(String(j.energyScore).replace(/[^0-9]/g, ''));
      return isNaN(num) ? null : num;
    }).filter(n => n !== null);

    // Trend: compare last 2 vs previous 2 (or available)
    let trend = null;
    if (scores.length >= 3) {
      const recent = scores.slice(0, 2).reduce((a, b) => a + b, 0) / 2;
      const older = scores.slice(2, 4).reduce((a, b) => a + b, 0) / Math.min(scores.length - 2, 2);
      if (recent < older - 5) trend = 'improving';
      else if (recent > older + 5) trend = 'worsening';
      else trend = 'stable';
    }

    // Build sparkline-style text trend
    const trendLine = journal.slice(0, 8).reverse().map(j => {
      const v = j.verdict?.toUpperCase() || '';
      if (v.includes('SUSTAINABLE')) return '🟢';
      if (v.includes('BURNOUT') || v.includes('EMPTY')) return '🔴';
      if (v.includes('STRETCHED') || v.includes('HEAVY')) return '🟡';
      return '⚪';
    }).join(' ');

    return {
      weeks: journal.length,
      burnoutWeeks,
      sustainableWeeks,
      avgInteractions: Math.round(journal.reduce((s, j) => s + (j.interactionCount || 0), 0) / journal.length),
      trend,
      trendLine,
      scores,
    };
  }, [journal]);

  // ── Compare helper ──
  const compareEntries = useMemo(() => {
    if (!compareA || !compareB) return null;
    const a = journal.find(j => j.id === compareA);
    const b = journal.find(j => j.id === compareB);
    if (!a || !b) return null;
    return { a, b };
  }, [compareA, compareB, journal]);

  // ── Verdict color helper ──
  const verdictColor = (v) => {
    if (!v) return c.warningBox;
    const s = v.toUpperCase();
    if (s.includes('SUSTAINABLE')) return c.success;
    if (s.includes('BURNOUT') || s.includes('EMPTY')) return c.danger;
    return c.warning;
  };

  // ════════════════════════════════════════════════════════════
  // NAV
  // ════════════════════════════════════════════════════════════
  const renderNav = () => (
    <div className="flex gap-1 flex-wrap mb-4">
      {[
        { key: 'log', label: t('sea_nav_log'), show: true },
        { key: 'results', label: t('sea_nav_results'), show: !!results },
        { key: 'quickcheck', label: t('sea_nav_quickcheck'), show: true },
        { key: 'checkin', label: t('sea_nav_checkin'), show: true },
        { key: 'forecast', label: t('sea_nav_forecast'), show: !!(savedTemplate || dailyCheckins.length) },
        { key: 'plan', label: t('sea_nav_plan'), show: true },
        { key: 'recharge', label: t('sea_nav_recharge'), show: true },
        { key: 'journal', label: journal.length ? t('sea_nav_journal_count', { count: journal.length }) : t('sea_nav_journal'), show: true },
      ].filter(tab => tab.show).map(tab => (
        <button
          key={tab.key}
          onClick={() => setView(tab.key)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors min-h-[36px] ${
            view === tab.key ? c.pillActive : c.pillInactive
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );

  // ════════════════════════════════════════════════════════════
  // RENDER: LOG
  // ════════════════════════════════════════════════════════════
  const renderLog = () => (
    <div className="space-y-4">
      <div className={`${c.card} border rounded-xl p-5`}>

        {/* Week label */}
        <div className="mb-4">
          <label className={`text-sm font-bold ${c.label} block mb-1.5`}>
            {t('sea_label_week')} <span className={`font-normal ${c.textMuteded}`}>{t('sea_optional')}</span>
          </label>
          <input
            type="text"
            value={weekLabel}
            onChange={e => setWeekLabel(e.target.value)}
            placeholder={t('sea_ph_week_label')}
            className={`w-full px-3 py-2 border rounded-lg text-sm ${c.input} outline-none focus:ring-2`}
          />
        </div>

        {/* Editing indicator */}
        {editingEntryId && (
          <div className={`${c.warning} border rounded-lg p-3 mb-4 flex items-center justify-between`}>
            <p className={`text-xs font-bold ${c.warningTxt}`}>{t('sea_editing_notice')}</p>
            <button
              onClick={() => {
                setEditingEntryId(null);
                setInteractions([]);
                setWeekLabel('');
              }}
              className={`text-xs font-bold ${c.accentTxt} min-h-[28px] ml-2`}
            >
              {t('sea_cancel')}
            </button>
          </div>
        )}

        {/* Template controls */}
        <div className={`mb-4 flex flex-wrap gap-2 items-center`}>
          {savedTemplate ? (
            <>
              <button onClick={loadFromTemplate}
                className={`${c.btnSecondary} px-3 py-1.5 rounded-lg text-xs font-bold min-h-[32px] flex items-center gap-1`}>
                <span>📋</span> {t('sea_load_typical', { count: savedTemplate.length })}
              </button>
              <button onClick={saveCurrentAsTemplate}
                className={`text-xs font-bold ${c.accentTxt} min-h-[32px]`}>
                {t('sea_update_template')}
              </button>
              <button onClick={deleteTemplate}
                className={`text-xs ${c.warningTxt} min-h-[32px]`}>
                {t('sea_delete_template')}
              </button>
            </>
          ) : (
            <button
              onClick={saveCurrentAsTemplate}
              disabled={!interactions.some(i => i.situation.trim())}
              className={`text-xs font-bold ${c.accentTxt} min-h-[32px] disabled:opacity-40`}
            >
              {t('sea_save_template')}
            </button>
          )}
        </div>

        {/* Quick add */}
        <div className="mb-2">
          <p className={`text-[10px] font-bold ${c.label} uppercase mb-2`}>{t('sea_quick_add')}</p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_PRESETS.map((preset, i) => {
              const count = interactions.filter(int => int.situation === preset.situation).length;
              return (
                <button
                  key={i}
                  onClick={() => addFromPreset(preset)}
                  className={`${c.btnSecondary} px-2.5 py-1.5 rounded-lg text-[11px] font-medium min-h-[32px] flex items-center gap-1 border transition-colors`}
                >
                  <span>{preset.icon}</span> {t(preset.labelKey)}
                  {count > 0 && (
                    <span className={`ml-1 text-[9px] font-black px-1.5 py-0.5 rounded-full ${c.pillActive}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
            <button
              onClick={() => { setShowOther(p => !p); setTimeout(() => otherInputRef.current?.focus(), 50); }}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium min-h-[32px] flex items-center gap-1 border transition-colors ${showOther ? c.pillActive : c.btnSecondary}`}
            >
              {t('sea_other')}
            </button>
          </div>
          {showOther && (
            <div className="flex gap-2 mt-2">
              <label htmlFor="sea-other-text" className="sr-only">{t('sea_sr_other')}</label>
              <input
                id="sea-other-text"
                ref={otherInputRef}
                type="text"
                value={otherText}
                onChange={e => setOtherText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { addFromOther(); }
                  if (e.key === 'Escape') { setShowOther(false); setOtherText(''); }
                }}
                placeholder={t('sea_ph_other')}
                className={`flex-1 px-3 py-2 border rounded-lg text-sm ${c.input} outline-none focus:ring-2`}
              />
              <button
                onClick={addFromOther}
                disabled={!otherText.trim()}
                className={`${c.btnPrimary} px-3 py-2 rounded-lg text-xs font-bold min-h-[36px] disabled:opacity-40`}
              >
                {t('sea_add')}
              </button>
            </div>
          )}
        </div>

        {/* Your week so far */}
        {interactions.length > 0 && (
          <div className="mb-4">
            <div className={`flex items-center justify-between mb-2 pt-3 border-t ${c.border}`}>
              <p className={`text-[10px] font-bold ${c.label} uppercase`}>
                {t('sea_week_so_far')} <span className={`font-normal ${c.textMuteded}`}>{interactions.length === 1 ? t('sea_week_items_one', { count: interactions.length }) : t('sea_week_items_other', { count: interactions.length })}</span>
              </p>
            </div>
            <div className="space-y-3">
              {interactions.map((int, i) => (
                <div key={i} className={`${c.quoteBg} rounded-xl p-4 space-y-3`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className={`flex items-center gap-1.5 text-sm font-medium ${c.text}`}>
                      <span>{QUICK_PRESETS.find(p => p.situation === int.situation)?.icon ?? '📌'}</span>
                      {int.custom ? (
                        <input ref={el => { interactionsInputRefs.current[i] = el; }}
                          type="text"
                          value={int.situation}
                          onChange={e => updateInteraction(i, 'situation', e.target.value)}
                          className={`px-2 py-1 border rounded-lg text-sm ${c.input} outline-none focus:ring-2`}
                        />
                      ) : (
                        <span>{int.situation}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <select
                        value={int.category}
                        onChange={e => updateInteraction(i, 'category', e.target.value)}
                        className={`w-24 px-2 py-1 border rounded-lg text-xs ${c.input} outline-none`}
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat.value} value={cat.value}>{cat.icon} {t(cat.labelKey)}</option>
                        ))}
                      </select>
                      <button onClick={() => removeInteraction(i)} className={`text-sm ${c.warningTxt} min-h-[28px] px-1`}>✕</button>
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="flex flex-wrap gap-1.5">
                    {DURATION_OPTIONS.map(d => (
                      <button
                        key={d.value}
                        onClick={() => updateInteraction(i, 'duration', int.duration === d.value ? '' : d.value)}
                        className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors min-h-[24px] ${
                          int.duration === d.value ? c.pillActive : c.pillInactive
                        }`}
                      >
                        {t(d.labelKey)}
                      </button>
                    ))}
                  </div>

                  {/* Sliders */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <div className="flex justify-between mb-0.5">
                        <label className={`text-[10px] font-bold ${c.label}`}>{t('sea_performance')}</label>
                        <span className={`text-[10px] font-bold ${int.performance >= 7 ? c.warningTxt : c.successTxt}`}>{int.performance}/10</span>
                      </div>
                      <input type="range" min="1" max="10" value={int.performance}
                        onChange={e => updateInteraction(i, 'performance', Number(e.target.value))}
                        className="w-full accent-zinc-500" />
                      <div className={`flex justify-between text-[8px] ${c.textMuteded}`}><span>{t('sea_perf_natural')}</span><span>{t('sea_perf_full_on')}</span></div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-0.5">
                        <label className={`text-[10px] font-bold ${c.label}`}>{t('sea_energy_before')}</label>
                        <span className={`text-[10px] font-bold ${c.accentTxt}`}>{int.energyBefore}/10</span>
                      </div>
                      <input type="range" min="1" max="10" value={int.energyBefore}
                        onChange={e => updateInteraction(i, 'energyBefore', Number(e.target.value))}
                        className="w-full accent-zinc-500" />
                      <div className={`flex justify-between text-[8px] ${c.textMuteded}`}><span>{t('sea_empty')}</span><span>{t('sea_full')}</span></div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-0.5">
                        <label className={`text-[10px] font-bold ${c.label}`}>{t('sea_energy_after')}</label>
                        <span className={`text-[10px] font-bold ${int.energyAfter < int.energyBefore ? c.warningTxt : c.successTxt}`}>{int.energyAfter}/10</span>
                      </div>
                      <input type="range" min="1" max="10" value={int.energyAfter}
                        onChange={e => updateInteraction(i, 'energyAfter', Number(e.target.value))}
                        className="w-full accent-zinc-500" />
                      <div className={`flex justify-between text-[8px] ${c.textMuteded}`}><span>{t('sea_empty')}</span><span>{t('sea_full')}</span></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}


        <p className={`text-[11px] ${c.textMuted} text-center mb-2`}>
          {t('sea_xref_pre')} <a href="/CrashPredictor" className={linkStyle}>{t('sea_xref_crashpredictor')}</a> {t('sea_xref_post')}
        </p>

        <div className="flex gap-2">
          <button
            onClick={runAudit}
            disabled={!interactions.some(i => i.situation.trim()) || loading}
            className={`flex-1 ${c.btnPrimary} disabled:opacity-40 font-bold py-3 rounded-lg flex items-center justify-center gap-2 min-h-[48px]`}
          >
            {loading
              ? <><span className="inline-block animate-spin">{tool?.icon ?? '⚡'}</span> {t('sea_auditing')}</>
              : editingEntryId
                ? <><span>✏️</span> {t('sea_update_reaudit')}</>
                : <><span className="mr-1">{tool?.icon ?? '⚡'}</span> {t('sea_run_audit')}</>}
          </button>
        </div>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════
  // RENDER: RESULTS
  // ════════════════════════════════════════════════════════════
  const renderResults = () => {
    if (!results) return null;
    const r = results;

    return (
      <div ref={resultsRef} className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <button onClick={() => setView('log')} className={`text-xs font-bold ${c.accentTxt} min-h-[32px]`}>{t('sea_back_to_log')}</button>
          <button onClick={handleReset} className={`${c.btnSecondary} px-3 py-1.5 rounded-lg text-xs font-semibold`}>{t('sea_start_over')}</button>
        </div>

        {/* Energy Score */}
        {r.energy_score && (
          <div className={`${c.verdict} border-2 rounded-xl p-5 text-center`}>
            <span className="text-4xl block mb-2">⚡</span>
            <p className={`text-3xl font-black ${c.text} mb-1`}>{r.energy_score.total_energy_spent}</p>
            <p className={`text-xs ${c.textMuteded} mb-2`}>{t('sea_energy_spent_week')}</p>
            <span className={`inline-block text-[10px] font-black px-3 py-1 rounded-full ${verdictColor(r.energy_score.sustainability_verdict)}`}>
              {r.energy_score.sustainability_verdict}
            </span>
            {r.energy_score.one_liner && (
              <p className={`text-sm ${c.textSecondary} mt-3 max-w-md mx-auto`}>{r.energy_score.one_liner}</p>
            )}
            {r.energy_score.net_energy_change != null && r.energy_score.net_energy_change !== '' && (
              <p className={`text-xs font-bold ${String(r.energy_score.net_energy_change).trim().startsWith('+') ? c.successTxt : c.warningTxt} mt-2`}>
                {t('sea_net_change', { value: r.energy_score.net_energy_change })}
              </p>
            )}
          </div>
        )}

        {/* Energy Budget */}
        {r.weekly_budget && (
          <div className={`${c.card} border rounded-xl p-4`}>
            <h3 className={`text-sm font-bold ${c.text} mb-3`}>{t('sea_weekly_budget')}</h3>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <div className={`${c.quoteBg} rounded-lg p-3 text-center`}>
                <p className={`text-lg font-black ${c.text}`}>{r.weekly_budget.total_capacity}</p>
                <p className={`text-[9px] ${c.textMuteded}`}>{t('sea_budget_capacity')}</p>
              </div>
              <div className={`${c.quoteBg} rounded-lg p-3 text-center`}>
                <p className={`text-lg font-black ${c.warningTxt}`}>{r.weekly_budget.spent}</p>
                <p className={`text-[9px] ${c.textMuteded}`}>{t('sea_budget_spent')}</p>
              </div>
              <div className={`${c.quoteBg} rounded-lg p-3 text-center`}>
                <p className={`text-lg font-black ${String(r.weekly_budget.remaining).startsWith('-') ? c.warningTxt : c.successTxt}`}>
                  {r.weekly_budget.remaining}
                </p>
                <p className={`text-[9px] ${c.textMuteded}`}>{t('sea_budget_remaining')}</p>
              </div>
            </div>
            {r.weekly_budget.verdict && <p className={`text-xs ${c.textSecondary} text-center`}>{r.weekly_budget.verdict}</p>}
          </div>
        )}

        {/* Top Drains */}
        {r.drains?.length > 0 && (
          <Section icon="🔴" title={t('sea_sec_drains')} badge={t('sea_sec_drains_badge', { count: r.drains.length })} badgeClass={c.danger} defaultOpen={true} c={c}>
            <div className="space-y-2">
              {r.drains.map((d, i) => (
                <div key={i} className={`${c.danger} border rounded-lg p-3`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-bold ${c.text}`}>{d.situation}</span>
                    <span className={`text-xs font-black ${c.warningTxt}`}>{d.energy_cost}</span>
                  </div>
                  <div className={`flex gap-2 text-[10px] ${c.textMuteded} mb-1`}>
                    <span>{t('sea_drain_performance', { value: d.performance_tax })}</span>
                    {d.cost_per_hour && <span>{t('sea_drain_per_hour', { value: d.cost_per_hour })}</span>}
                  </div>
                  {d.why_costly && <p className={`text-[11px] ${c.textSecondary}`}>{d.why_costly}</p>}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Rechargers */}
        {r.rechargers?.length > 0 && (
          <Section icon="🟢" title={t('sea_sec_rechargers')} badge={t('sea_sec_rechargers_badge', { count: r.rechargers.length })} badgeClass={c.success} defaultOpen={true} c={c}>
            <div className="space-y-2">
              {r.rechargers.map((rc, i) => (
                <div key={i} className={`${c.success} border rounded-lg p-3`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-bold ${c.text}`}>{rc.situation}</span>
                    <span className={`text-xs font-black ${c.successTxt}`}>{rc.energy_effect}</span>
                  </div>
                  {rc.why_good && <p className={`text-[11px] ${c.textSecondary}`}>{rc.why_good}</p>}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Patterns */}
        {r.patterns && (
          <Section icon="🔍" title={t('sea_sec_patterns')} defaultOpen={true} c={c}>
            <div className="space-y-3">
              {r.patterns.biggest_surprise && (
                <div>
                  <p className={`text-[10px] font-bold ${c.label} uppercase mb-0.5`}>{t('sea_pattern_surprise')}</p>
                  <p className={`text-sm ${c.textSecondary}`}>{r.patterns.biggest_surprise}</p>
                </div>
              )}
              {r.patterns.performance_vs_drain && (
                <div>
                  <p className={`text-[10px] font-bold ${c.label} uppercase mb-0.5`}>{t('sea_pattern_perf_vs_drain')}</p>
                  <p className={`text-sm ${c.textSecondary}`}>{r.patterns.performance_vs_drain}</p>
                </div>
              )}
              {r.patterns.category_breakdown && (
                <div>
                  <p className={`text-[10px] font-bold ${c.label} uppercase mb-0.5`}>{t('sea_pattern_by_category')}</p>
                  <p className={`text-sm ${c.textSecondary}`}>{r.patterns.category_breakdown}</p>
                </div>
              )}
              {r.patterns.optimal_ratio && (
                <div className={`${c.warningBox} border rounded-lg p-3`}>
                  <p className={`text-xs font-bold ${c.accentTxt}`}>📐 {r.patterns.optimal_ratio}</p>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* Restructure Suggestions */}
        {r.restructure_suggestions?.length > 0 && (
          <Section icon="💡" title={t('sea_sec_restructure')} defaultOpen={true} c={c}>
            <div className="space-y-2">
              {r.restructure_suggestions.map((s, i) => (
                <p key={i} className={`text-xs ${c.textSecondary}`}>→ {s}</p>
              ))}
            </div>
          </Section>
        )}

        {/* Recovery */}
        {r.recovery_time && (
          <Section icon="🛋️" title={t('sea_sec_recovery')} c={c}>
            {r.recovery_time.estimated_hours != null && r.recovery_time.estimated_hours !== '' && <p className={`text-sm ${c.textSecondary}`}>⏱️ {r.recovery_time.estimated_hours}</p>}
            {r.recovery_time.best_recovery_day && <p className={`text-sm ${c.textSecondary}`}>📅 {r.recovery_time.best_recovery_day}</p>}
            {r.recovery_time.recovery_type && <p className={`text-sm ${c.textSecondary}`}>🧘 {r.recovery_time.recovery_type}</p>}
          </Section>
        )}

        {/* Quick actions */}
        <div className={`${c.card} border rounded-xl p-4`}>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setView('recharge')} className={`${c.btnPrimary} px-4 py-2 rounded-lg text-xs font-bold min-h-[36px]`}>
              {t('sea_get_recharge_plan')}
            </button>
            <button onClick={() => setView('plan')} className={`${c.btnSecondary} px-4 py-2 rounded-lg text-xs font-bold min-h-[36px]`}>
              {t('sea_plan_next_week')}
            </button>
          </div>
        </div>

        {/* Cross references */}
        <div className={`${c.card} border rounded-xl p-4`}>
          <p className={`text-[10px] font-bold ${c.label} uppercase mb-2`}>{t('sea_related_tools')}</p>
          <div className="flex flex-wrap gap-2">
            {CROSS_REFS.map(ref => (
              <a key={ref.id} href={`/${ref.id}`}
                className={`${c.btnSecondary} px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 min-h-[32px]`}>
                <span>{ref.icon}</span> {t(ref.labelKey)}
              </a>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════
  // RENDER: WEEK PLANNER
  // ════════════════════════════════════════════════════════════
  const renderPlan = () => (
    <div className="space-y-4">
      <div className={`${c.card} border rounded-xl p-5`}>
        <h2 className={`text-lg font-bold ${c.text} mb-1`}>{t('sea_planner_title')}</h2>
        <p className={`text-sm ${c.textSecondary} mb-4`}>{t('sea_planner_subtitle')}</p>

        <div className="space-y-2 mb-4">
          {upcoming.map((u, i) => (
            <div key={i} className="flex gap-2 items-start">
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2">
                <input ref={el => { upcomingInputRefs.current[i] = el; }}
                  type="text"
                  value={u.situation}
                  onChange={e => updateUpcoming(i, 'situation', e.target.value)}
                  placeholder={t('sea_ph_commitment')}
                  className={`col-span-2 sm:col-span-1 px-3 py-2 border rounded-lg text-sm ${c.input} outline-none focus:ring-2`}
                />
                <select value={u.day} onChange={e => updateUpcoming(i, 'day', e.target.value)}
                  className={`px-2 py-2 border rounded-lg text-xs ${c.input} outline-none`}>
                  {DAYS.map(d => <option key={d} value={d}>{t(DAY_LABEL_KEYS[d])}</option>)}
                </select>
                <select value={u.duration} onChange={e => updateUpcoming(i, 'duration', e.target.value)}
                  className={`px-2 py-2 border rounded-lg text-xs ${c.input} outline-none`}>
                  <option value="">{t('sea_duration')}</option>
                  {DURATION_OPTIONS.map(d => <option key={d.value} value={d.value}>{t(d.labelKey)}</option>)}
                </select>
                <div className="col-span-2 sm:col-span-1 flex items-center gap-1">
                  <span className={`text-[9px] ${c.textMuteded}`}>{t('sea_perf_short')}</span>
                  <input type="range" min="1" max="10" value={u.performance}
                    onChange={e => updateUpcoming(i, 'performance', Number(e.target.value))}
                    className="flex-1 accent-zinc-500" />
                  <span className={`text-[10px] font-bold ${u.performance >= 7 ? c.warningTxt : c.successTxt} w-5`}>{u.performance}</span>
                </div>
              </div>
              {upcoming.length > 1 && (
                <button onClick={() => removeUpcoming(i)} className={`text-sm ${c.warningTxt} min-h-[32px] px-1`}>✕</button>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-3 items-center mb-4">
          <button onClick={addUpcoming} className={`text-xs font-bold ${c.accentTxt} min-h-[32px]`}>{t('sea_add_commitment')}</button>
        </div>

        <button onClick={runPlan} disabled={!upcoming.some(u => u.situation.trim()) || loading}
          className={`w-full ${c.btnPrimary} disabled:opacity-40 font-bold py-3 rounded-lg flex items-center justify-center gap-2 min-h-[48px]`}>
          {loading ? <><span className="inline-block animate-spin">{tool?.icon ?? '⚡'}</span> {t('sea_planning')}</> : <><span className="mr-1">{tool?.icon ?? '⚡'}</span> {t('sea_predict_week')}</>}
        </button>
      </div>

      {/* Plan Results */}
      {planResults && (
        <div className="space-y-4">
          <div className={`${c.verdict} border-2 rounded-xl p-5 text-center`}>
            <p className={`text-2xl font-black ${c.text} mb-1`}>{planResults.predicted_total_cost}</p>
            <p className={`text-xs ${c.textMuteded} mb-2`}>{t('sea_predicted_cost')}</p>
            <span className={`inline-block text-[10px] font-black px-3 py-1 rounded-full ${verdictColor(planResults.risk_level)}`}>
              {planResults.risk_level}
            </span>
          </div>

          {/* Day breakdown */}
          {planResults.day_breakdown?.length > 0 && (
            <div className={`${c.card} border rounded-xl p-4`}>
              <h3 className={`text-sm font-bold ${c.text} mb-3`}>{t('sea_day_by_day')}</h3>
              <div className="space-y-2">
                {planResults.day_breakdown.map((day, i) => (
                  <div key={i} className={`${day.risk === 'HIGH' ? c.danger : day.risk === 'LOW' ? c.success : c.warning} border rounded-lg p-3`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-bold ${c.text}`}>{day.day}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold`}>{day.predicted_cost}</span>
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                          day.risk === 'HIGH' ? 'bg-zinc-500 text-white' : day.risk === 'LOW' ? 'bg-zinc-500 text-white' : 'bg-zinc-500 text-white'
                        }`}>{day.risk}</span>
                      </div>
                    </div>
                    {day.note && <p className={`text-[11px] ${c.textSecondary}`}>{day.note}</p>}
                    {day.commitments?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {day.commitments.map((c2, ci) => <span key={ci} className={`text-[9px] px-1.5 py-0.5 rounded ${c.cardAlt} border`}>{c2}</span>)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Danger zones */}
          {planResults.danger_zones?.length > 0 && (
            <div className={`${c.danger} border rounded-xl p-4`}>
              <p className={`text-xs font-bold ${c.warningTxt} mb-1`}>{t('sea_danger_zones')}</p>
              {planResults.danger_zones.map((dz, i) => <p key={i} className={`text-xs`}>• {dz}</p>)}
            </div>
          )}

          {/* Optimization suggestions */}
          {planResults.optimization_suggestions?.length > 0 && (
            <Section icon="💡" title={t('sea_sec_optimizations')} defaultOpen={true} c={c}>
              {planResults.optimization_suggestions.map((s, i) => (
                <p key={i} className={`text-xs ${c.textSecondary}`}>→ {s}</p>
              ))}
            </Section>
          )}

          {planResults.protection_plan && (
            <div className={`${c.infoBox} border rounded-xl p-4`}>
              <p className={`text-xs font-bold ${isDark ? 'text-zinc-500' : 'text-zinc-500'} mb-1`}>{t('sea_protect_time')}</p>
              <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>{planResults.protection_plan}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // ════════════════════════════════════════════════════════════
  // RENDER: RECHARGE
  // ════════════════════════════════════════════════════════════
  const renderRecharge = () => (
    <div className="space-y-4">
      <div className={`${c.card} border rounded-xl p-5`}>
        <h2 className={`text-lg font-bold ${c.text} mb-1`}>{t('sea_recharge_title')}</h2>
        <p className={`text-sm ${c.textSecondary} mb-4`}>{t('sea_recharge_subtitle')}</p>

        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <label className={`text-sm font-bold ${c.label}`}>{t('sea_current_energy')}</label>
            <span className={`text-sm font-bold ${currentEnergy <= 3 ? c.warningTxt : currentEnergy <= 6 ? c.warningTxt : c.successTxt}`}>
              {currentEnergy}/10
            </span>
          </div>
          <input type="range" min="1" max="10" value={currentEnergy}
            onChange={e => setCurrentEnergy(Number(e.target.value))}
            className="w-full accent-zinc-500" />
          <div className={`flex justify-between text-[9px] ${c.textMuteded}`}>
            <span>{t('sea_fumes')}</span><span>{t('sea_okay')}</span><span>{t('sea_fully_charged')}</span>
          </div>
        </div>

        <div className="mb-4">
          <label className={`text-sm font-bold ${c.label} block mb-1.5`}>
            {t('sea_what_drained')} <span className={`font-normal ${c.textMuteded}`}>{t('sea_optional')}</span>
          </label>
          <input type="text" value={topDrains} onChange={e => setTopDrains(e.target.value)}
            placeholder={t('sea_ph_what_drained')}
            className={`w-full px-3 py-2.5 border rounded-lg text-sm ${c.input} outline-none focus:ring-2`} />
        </div>

        <div className="mb-5">
          <label className={`text-sm font-bold ${c.label} block mb-1.5`}>
            {t('sea_what_recharges')} <span className={`font-normal ${c.textMuteded}`}>{t('sea_optional')}</span>
          </label>
          <input type="text" value={rechargePrefs} onChange={e => setRechargePrefs(e.target.value)}
            placeholder={t('sea_ph_what_recharges')}
            className={`w-full px-3 py-2.5 border rounded-lg text-sm ${c.input} outline-none focus:ring-2`} />
        </div>

        <button onClick={runRecharge} disabled={loading}
          className={`w-full ${c.btnPrimary} disabled:opacity-40 font-bold py-3 rounded-lg flex items-center justify-center gap-2 min-h-[48px]`}>
          {loading ? <><span className="inline-block animate-spin">{tool?.icon ?? '⚡'}</span> {t('sea_building_plan')}</> : <><span className="mr-1">{tool?.icon ?? '⚡'}</span> {t('sea_get_recharge_plan')}</>}
        </button>
      </div>

      {/* Recharge Results */}
      {rechargeResults && (
        <div ref={rechargeResultsRef} className="space-y-4">
          {rechargeResults.energy_assessment && (
            <div className={`${c.verdict} border-2 rounded-xl p-5`}>
              <span className="text-3xl block mb-2 text-center">🔋</span>
              <p className={`text-sm ${c.textSecondary} text-center`}>{rechargeResults.energy_assessment}</p>
            </div>
          )}

          {rechargeResults.immediate && (
            <div className={`${c.card} border rounded-xl p-4`}>
              <h3 className={`text-sm font-bold ${c.text} mb-2`}>{t('sea_right_now')}</h3>
              {rechargeResults.immediate.do_now && (
                <div className={`${c.success} border rounded-lg p-3 mb-2`}>
                  <p className={`text-xs font-bold ${c.successTxt}`}>{t('sea_do_this')}</p>
                  <p className={`text-xs ${c.successTxt}`}>{rechargeResults.immediate.do_now}</p>
                </div>
              )}
              {rechargeResults.immediate.avoid && (
                <div className={`${c.danger} border rounded-lg p-3`}>
                  <p className={`text-xs font-bold ${c.warningTxt}`}>{t('sea_avoid')}</p>
                  <p className={`text-xs`}>{rechargeResults.immediate.avoid}</p>
                </div>
              )}
            </div>
          )}

          {rechargeResults.tonight && (
            <Section icon="🌙" title={t('sea_sec_tonight')} defaultOpen={true} c={c}>
              <p className={`text-sm ${c.textSecondary}`}>{rechargeResults.tonight.activity}</p>
              {rechargeResults.tonight.why && <p className={`text-xs ${c.textMuteded}`}>{t('sea_why', { value: rechargeResults.tonight.why })}</p>}
              {rechargeResults.tonight.duration && <p className={`text-xs font-bold ${c.accentTxt}`}>⏱️ {rechargeResults.tonight.duration}</p>}
            </Section>
          )}

          {rechargeResults.this_week?.length > 0 && (
            <Section icon="📋" title={t('sea_sec_this_week')} defaultOpen={true} c={c}>
              {rechargeResults.this_week.map((a, i) => (
                <p key={i} className={`text-xs ${c.textSecondary}`}>→ {a}</p>
              ))}
            </Section>
          )}

          {rechargeResults.boundaries_to_set?.length > 0 && (
            <Section icon="🛡️" title={t('sea_sec_boundaries')} c={c}>
              {rechargeResults.boundaries_to_set.map((b, i) => (
                <p key={i} className={`text-xs ${c.textSecondary}`}>• {b}</p>
              ))}
            </Section>
          )}

          {rechargeResults.recharge_ratio && (
            <div className={`${c.warningBox} border rounded-xl p-4`}>
              <p className={`text-xs font-bold ${c.accentTxt}`}>📐 {rechargeResults.recharge_ratio}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // ════════════════════════════════════════════════════════════
  // RENDER: QUICK CHECK ("Should I Say Yes?")
  // ════════════════════════════════════════════════════════════
  const renderQuickCheck = () => (
    <div className="space-y-4">
      <div className={`${c.card} border rounded-xl p-5`}>
        <h2 className={`text-lg font-bold ${c.text} mb-1`}>{t('sea_qc_title')}</h2>
        <p className={`text-sm ${c.textSecondary} mb-4`}>{t('sea_qc_subtitle')}</p>

        <div className="mb-4">
          <label className={`text-sm font-bold ${c.label} block mb-1.5`}>{t('sea_qc_commitment')} <span className={c.required}>*</span></label>
          <input type="text" value={qcCommitment} onChange={e => setQcCommitment(e.target.value)}
            placeholder={t('sea_ph_qc_commitment')}
            className={`w-full px-3 py-2.5 border rounded-lg text-sm ${c.input} outline-none focus:ring-2`}
            onKeyDown={e => e.key === 'Enter' && qcCommitment.trim() && runQuickCheck()}
          />
        </div>

        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <label className={`text-sm font-bold ${c.label}`}>{t('sea_qc_energy_now')}</label>
            <span className={`text-sm font-bold ${qcEnergy <= 3 ? c.warningTxt : qcEnergy <= 6 ? c.warningTxt : c.successTxt}`}>
              {qcEnergy}/10
            </span>
          </div>
          <input type="range" min="1" max="10" value={qcEnergy}
            onChange={e => setQcEnergy(Number(e.target.value))}
            className="w-full accent-zinc-500" />
        </div>

        <div className="mb-5">
          <label className={`text-sm font-bold ${c.label} block mb-1.5`}>
            {t('sea_qc_on_plate')} <span className={`font-normal ${c.textMuteded}`}>{t('sea_optional')}</span>
          </label>
          <input type="text" value={qcWeekContext} onChange={e => setQcWeekContext(e.target.value)}
            placeholder={t('sea_ph_qc_context')}
            className={`w-full px-3 py-2.5 border rounded-lg text-sm ${c.input} outline-none focus:ring-2`} />
        </div>

        <button onClick={runQuickCheck} disabled={!qcCommitment.trim() || loading}
          className={`w-full ${c.btnPrimary} disabled:opacity-40 font-bold py-3 rounded-lg flex items-center justify-center gap-2 min-h-[48px]`}>
          {loading ? <><span className="inline-block animate-spin">{tool?.icon ?? '⚡'}</span> {t('sea_checking')}</> : <>{t('sea_qc_should_say_yes')}</>}
        </button>
      </div>

      {qcResults && (
        <div className="space-y-4">
          {/* Verdict */}
          <div className={`${
            qcResults.verdict === 'YES' ? c.success
            : qcResults.verdict === 'SKIP IT' ? c.danger
            : c.warning
          } border-2 rounded-xl p-5 text-center`}>
            <span className="text-4xl block mb-2">{qcResults.verdict_emoji || '🤔'}</span>
            <p className={`text-2xl font-black ${c.text} mb-1`}>{qcResults.verdict}</p>
            <p className={`text-sm ${c.textSecondary}`}>{qcResults.one_liner}</p>
            {qcResults.energy_impact && (
              <p className={`text-xs font-bold ${c.warningTxt} mt-2`}>{qcResults.energy_impact}</p>
            )}
          </div>

          {qcResults.condition && (
            <div className={`${c.warning} border rounded-xl p-4`}>
              <p className={`text-xs font-bold ${c.warningTxt} mb-1`}>{t('sea_qc_condition')}</p>
              <p className={`text-xs`}>{qcResults.condition}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {qcResults.if_you_say_yes && (
              <div className={`${c.success} border rounded-xl p-4`}>
                <p className={`text-xs font-bold ${c.successTxt} mb-1`}>{t('sea_qc_if_you_go')}</p>
                <p className={`text-xs ${c.successTxt}`}>{qcResults.if_you_say_yes}</p>
              </div>
            )}
            {qcResults.if_you_say_no && (
              <div className={`${c.card} border rounded-xl p-4`}>
                <p className={`text-xs font-bold ${c.text} mb-1`}>{t('sea_qc_how_to_decline')}</p>
                <p className={`text-xs ${c.textSecondary} mb-2`}>{qcResults.if_you_say_no}</p>
              </div>
            )}
          </div>

          {qcResults.recovery_note && (
            <div className={`${c.infoBox} border rounded-lg p-3`}>
              <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>🔋 {qcResults.recovery_note}</p>
            </div>
          )}

          <button onClick={() => { setQcCommitment(''); setQcResults(null); }}
            className={`text-xs font-bold ${c.accentTxt} min-h-[32px]`}>{t('sea_qc_check_another')}</button>
        </div>
      )}
    </div>
  );

  // ════════════════════════════════════════════════════════════
  // RENDER: DAILY CHECK-IN
  // ════════════════════════════════════════════════════════════
  const renderCheckin = () => {
    const today = new Date();
    const dayName = DAYS[today.getDay() === 0 ? 6 : today.getDay() - 1];
    const todayStr = today.toLocaleDateString();
    const alreadyCheckedIn = dailyCheckins.length > 0 &&
      new Date(dailyCheckins[0].date).toLocaleDateString() === todayStr;

    // This week's check-ins
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
    const thisWeek = dailyCheckins.filter(d => new Date(d.date) >= weekStart);

    return (
      <div className="space-y-4">
        <div className={`${c.card} border rounded-xl p-5`}>
          <h2 className={`text-lg font-bold ${c.text} mb-1`}>{t('sea_ci_title')}</h2>
          <p className={`text-sm ${c.textSecondary} mb-4`}>{t('sea_ci_subtitle')}</p>

          {alreadyCheckedIn && (
            <div className={`${c.success} border rounded-lg p-3 mb-4`}>
              <p className={`text-xs font-bold ${c.successTxt}`}>{t('sea_ci_already')}</p>
            </div>
          )}

          <div className="mb-4">
            <div className="flex justify-between mb-1">
              <label className={`text-sm font-bold ${c.label}`}>{t('sea_ci_energy_now', { day: t(DAY_LABEL_KEYS[dayName]) })}</label>
              <span className={`text-sm font-bold ${ciEnergy <= 3 ? c.warningTxt : ciEnergy <= 6 ? c.warningTxt : c.successTxt}`}>
                {ciEnergy}/10
              </span>
            </div>
            <input type="range" min="1" max="10" value={ciEnergy}
              onChange={e => setCiEnergy(Number(e.target.value))}
              className="w-full accent-zinc-500" />
            <div className={`flex justify-between text-[9px] ${c.textMuteded}`}>
              <span>{t('sea_ci_empty')}</span><span>{t('sea_okay')}</span><span>{t('sea_ci_great')}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div>
              <label className={`text-xs font-bold ${c.label} block mb-1`}>{t('sea_ci_biggest_drain')}</label>
              <input type="text" value={ciDrain} onChange={e => setCiDrain(e.target.value)}
                placeholder={t('sea_ph_ci_drain')}
                className={`w-full px-3 py-2 border rounded-lg text-sm ${c.input} outline-none focus:ring-2`} />
            </div>
            <div>
              <label className={`text-xs font-bold ${c.label} block mb-1`}>{t('sea_ci_biggest_recharge')}</label>
              <input type="text" value={ciRecharge} onChange={e => setCiRecharge(e.target.value)}
                placeholder={t('sea_ph_ci_recharge')}
                className={`w-full px-3 py-2 border rounded-lg text-sm ${c.input} outline-none focus:ring-2`} />
            </div>
          </div>

          <button onClick={saveDailyCheckin}
            className={`w-full ${c.btnPrimary} font-bold py-3 rounded-lg flex items-center justify-center gap-2 min-h-[48px]`}>
            <span>📍</span> {alreadyCheckedIn ? t('sea_ci_update') : t('sea_ci_check_in')}
          </button>
        </div>

        {/* This week's check-ins */}
        {thisWeek.length > 0 && (
          <div className={`${c.card} border rounded-xl p-4`}>
            <h3 className={`text-sm font-bold ${c.text} mb-3`}>{t('sea_ci_this_week')}</h3>
            <div className="flex gap-1.5 flex-wrap mb-3">
              {DAYS.map(day => {
                const checkin = thisWeek.find(d => d.day === day);
                return (
                  <div key={day} className={`flex-1 min-w-[40px] ${checkin ? (
                    checkin.energy <= 3 ? c.danger : checkin.energy <= 6 ? c.warning : c.success
                  ) : c.quoteBg} border rounded-lg p-2 text-center`}>
                    <p className={`text-[8px] font-bold ${c.textMuteded}`}>{t(DAY_LABEL_KEYS[day]).slice(0, 3)}</p>
                    {checkin ? (
                      <p className={`text-sm font-black ${c.text}`}>{checkin.energy}</p>
                    ) : (
                      <p className={`text-sm ${c.textMuteded}`}>—</p>
                    )}
                  </div>
                );
              })}
            </div>
            {thisWeek.length >= 3 && (
              <div className="flex gap-2">
                <button onClick={() => setView('forecast')}
                  className={`${c.btnSecondary} px-3 py-1.5 rounded-lg text-xs font-bold min-h-[32px]`}>
                  {t('sea_ci_see_forecast')}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Recent check-ins list */}
        {dailyCheckins.length > 0 && (
          <Section icon="📋" title={t('sea_ci_recent', { count: dailyCheckins.length })} c={c}>
            <div className="space-y-1.5">
              {dailyCheckins.slice(0, 14).map((d, i) => (
                <div key={d.id || i} className={`flex items-center gap-2 p-2 rounded-lg ${c.quoteBg}`}>
                  <span className={`text-sm font-black w-6 text-center ${
                    d.energy <= 3 ? c.warningTxt : d.energy <= 6 ? c.warningTxt : c.successTxt
                  }`}>{d.energy}</span>
                  <div className="flex-1 min-w-0">
                    <span className={`text-[10px] font-bold ${c.text}`}>{DAY_LABEL_KEYS[d.day] ? t(DAY_LABEL_KEYS[d.day]) : d.day}</span>
                    <span className={`text-[10px] ${c.textMuteded} ml-1`}>{new Date(d.date).toLocaleDateString()}</span>
                  </div>
                  {d.biggestDrain && <span className={`text-[9px] ${c.warningTxt} truncate max-w-[80px]`}>🔴 {d.biggestDrain}</span>}
                  {d.biggestRecharge && <span className={`text-[9px] ${c.successTxt} truncate max-w-[80px]`}>🟢 {d.biggestRecharge}</span>}
                </div>
              ))}
            </div>
            {dailyCheckins.length > 0 && (
              <button onClick={() => { if (window.confirm(t('sea_ci_confirm_clear'))) { setDailyCheckins([]); } }}
                className={`text-xs ${c.warningTxt} min-h-[28px]`}>{t('sea_ci_clear')}</button>
            )}
          </Section>
        )}
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════
  // RENDER: FORECAST
  // ════════════════════════════════════════════════════════════
  const renderForecast = () => (
    <div className="space-y-4">
      <div className={`${c.card} border rounded-xl p-5`}>
        <h2 className={`text-lg font-bold ${c.text} mb-1`}>{t('sea_fc_title')}</h2>
        <p className={`text-sm ${c.textSecondary} mb-2`}>
          {savedTemplate && dailyCheckins.length > 0
            ? t('sea_fc_basis_both')
            : savedTemplate
              ? t('sea_fc_basis_template')
              : t('sea_fc_basis_checkins')}
        </p>
        <div className={`flex gap-2 mb-4 text-[10px] ${c.textMuteded}`}>
          {savedTemplate && <span>{t('sea_fc_chip_template', { count: savedTemplate.length })}</span>}
          {dailyCheckins.length > 0 && <span>{t('sea_fc_chip_checkins', { count: dailyCheckins.length })}</span>}
          {journal.length > 0 && <span>{t('sea_fc_chip_weeks', { count: journal.length })}</span>}
        </div>

        <button onClick={runForecast} disabled={loading || (!savedTemplate && !dailyCheckins.length)}
          className={`w-full ${c.btnPrimary} disabled:opacity-40 font-bold py-3 rounded-lg flex items-center justify-center gap-2 min-h-[48px]`}>
          {loading ? <><span className="inline-block animate-spin">{tool?.icon ?? '⚡'}</span> {t('sea_forecasting')}</> : <><span className="mr-1">{tool?.icon ?? '⚡'}</span> {t('sea_fc_generate')}</>}
        </button>
      </div>

      {forecastResults && (
        <div className="space-y-4">
          {/* Overview */}
          <div className={`${c.verdict} border-2 rounded-xl p-5 text-center`}>
            {forecastResults.forecast_type && <p className={`text-xs font-bold ${c.textMuteded} mb-2 uppercase tracking-wider`}>{forecastResults.forecast_type}</p>}
            <p className={`text-2xl font-black ${c.text} mb-1`}>{forecastResults.weekly_energy_budget}</p>
            <p className={`text-xs ${c.textMuteded}`}>{t('sea_fc_predicted_spend')}</p>
            {forecastResults.reality_check && (
              <p className={`text-xs ${c.textSecondary} mt-2`}>📊 {forecastResults.reality_check}</p>
            )}
          </div>

          {/* Day curve */}
          {forecastResults.predicted_curve?.length > 0 && (
            <div className={`${c.card} border rounded-xl p-4`}>
              <h3 className={`text-sm font-bold ${c.text} mb-3`}>{t('sea_fc_daily_curve')}</h3>
              <div className="space-y-1.5">
                {forecastResults.predicted_curve.map((day, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold w-12 ${c.text} flex-shrink-0`}>{day.day?.slice(0, 3)}</span>
                    <div className={`flex-1 h-4 rounded-full ${isDark ? 'bg-zinc-500' : 'bg-zinc-500'} overflow-hidden`}>
                      <div
                        className={`h-full rounded-full ${
                          day.risk === 'HIGH' ? 'bg-zinc-500' : day.risk === 'LOW' ? 'bg-zinc-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.max(0, Math.min(100, (Number(day.predicted_energy) || 5) * 10))}%` }}
                      />
                    </div>
                    <span className={`text-[10px] font-bold w-6 ${
                      day.risk === 'HIGH' ? c.warningTxt : day.risk === 'LOW' ? c.successTxt : c.warningTxt
                    }`}>{day.predicted_energy}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Best/worst days */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {forecastResults.best_day && (
              <div className={`${c.success} border rounded-lg p-3`}>
                <p className={`text-[10px] font-bold ${c.successTxt} uppercase`}>{t('sea_fc_best_day')}</p>
                <p className={`text-xs ${c.successTxt}`}>{forecastResults.best_day}</p>
              </div>
            )}
            {forecastResults.worst_day && (
              <div className={`${c.danger} border rounded-lg p-3`}>
                <p className={`text-[10px] font-bold ${c.warningTxt} uppercase`}>{t('sea_fc_hardest_day')}</p>
                <p className={`text-xs`}>{forecastResults.worst_day}</p>
              </div>
            )}
          </div>

          {/* Danger zones */}
          {forecastResults.danger_zones?.length > 0 && (
            <div className={`${c.warning} border rounded-xl p-4`}>
              <p className={`text-xs font-bold ${c.warningTxt} mb-1`}>{t('sea_fc_watch_out')}</p>
              {forecastResults.danger_zones.map((d, i) => <p key={i} className={`text-xs`}>• {d}</p>)}
            </div>
          )}

          {/* Strategic advice */}
          {forecastResults.strategic_advice?.length > 0 && (
            <Section icon="💡" title={t('sea_sec_strategic')} defaultOpen={true} c={c}>
              {forecastResults.strategic_advice.map((s, i) => <p key={i} className={`text-xs ${c.textSecondary}`}>→ {s}</p>)}
            </Section>
          )}

          {forecastResults.protect_this && (
            <div className={`${c.infoBox} border rounded-lg p-3`}>
              <p className={`text-xs font-bold ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>{t('sea_fc_protect', { value: forecastResults.protect_this })}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // ════════════════════════════════════════════════════════════
  // RENDER: JOURNAL (enhanced with People Tracker + Ideal Week)
  // ════════════════════════════════════════════════════════════
  const renderJournal = () => (
    <div className="space-y-4">
      <div className={`${c.card} border rounded-xl p-5`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className={`text-lg font-bold ${c.text}`}>{t('sea_jr_title')}</h2>
            <p className={`text-sm ${c.textSecondary}`}>{t('sea_jr_subtitle')}</p>
          </div>
          <div className="flex gap-2">
            {journal.length >= 2 && (
              <button
                onClick={() => { setCompareMode(p => !p); setCompareA(null); setCompareB(null); }}
                className={`text-xs font-bold ${compareMode ? c.warningTxt : c.accentTxt} min-h-[32px]`}
              >
                {compareMode ? t('sea_jr_cancel_compare') : t('sea_jr_compare_weeks')}
              </button>
            )}
            {journal.length > 0 && (
              <button onClick={() => { if (window.confirm(t('sea_jr_confirm_clear'))) { setJournal([]); } }}
                className={`text-xs ${c.warningTxt} min-h-[32px]`}>🗑️</button>
            )}
          </div>
        </div>

        {/* Pattern stats */}
        {journalStats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
            <div className={`${c.quoteBg} rounded-lg p-3 text-center`}>
              <p className={`text-lg font-black ${c.text}`}>{journalStats.weeks}</p>
              <p className={`text-[9px] ${c.textMuteded}`}>{t('sea_jr_weeks_tracked')}</p>
            </div>
            <div className={`${c.quoteBg} rounded-lg p-3 text-center`}>
              <p className={`text-lg font-black ${c.successTxt}`}>{journalStats.sustainableWeeks}</p>
              <p className={`text-[9px] ${c.textMuteded}`}>{t('sea_jr_sustainable')}</p>
            </div>
            <div className={`${c.quoteBg} rounded-lg p-3 text-center`}>
              <p className={`text-lg font-black ${c.warningTxt}`}>{journalStats.burnoutWeeks}</p>
              <p className={`text-[9px] ${c.textMuteded}`}>{t('sea_jr_burnout_risk')}</p>
            </div>
            <div className={`${c.quoteBg} rounded-lg p-3 text-center`}>
              <p className={`text-lg font-black ${c.accentTxt}`}>{journalStats.avgInteractions}</p>
              <p className={`text-[9px] ${c.textMuteded}`}>{t('sea_jr_avg_interactions')}</p>
            </div>
          </div>
        )}

        {/* Trend visualization */}
        {journalStats?.trendLine && (
          <div className={`${c.quoteBg} rounded-lg p-3 mb-3`}>
            <div className="flex items-center justify-between mb-1">
              <p className={`text-[10px] font-bold ${c.label} uppercase`}>{t('sea_jr_trend')}</p>
              {journalStats.trend && (
                <span className={`text-[9px] font-black px-2 py-0.5 rounded ${
                  journalStats.trend === 'improving' ? c.success
                  : journalStats.trend === 'worsening' ? c.danger
                  : c.warning
                }`}>
                  {journalStats.trend === 'improving' ? t('sea_jr_trend_improving') : journalStats.trend === 'worsening' ? t('sea_jr_trend_worsening') : t('sea_jr_trend_stable')}
                </span>
              )}
            </div>
            <p className="text-lg tracking-wider text-center">{journalStats.trendLine}</p>
            <div className={`flex justify-between text-[8px] ${c.textMuteded} mt-1`}>
              <span>{t('sea_jr_legend_sustainable')}</span><span>{t('sea_jr_legend_stretched')}</span><span>{t('sea_jr_legend_burnout')}</span>
            </div>
          </div>
        )}

        {/* Score trend (text-based chart) */}
        {journalStats?.scores?.length >= 3 && (
          <div className={`${c.quoteBg} rounded-lg p-3`}>
            <p className={`text-[10px] font-bold ${c.label} uppercase mb-2`}>{t('sea_jr_energy_by_week')}</p>
            <div className="space-y-1">
              {journal.slice(0, 8).reverse().map((entry, i) => {
                const score = journalStats.scores[journalStats.scores.length - 1 - i];
                if (!score) return null;
                const pct = Math.min(score, 100);
                return (
                  <div key={entry.id} className="flex items-center gap-2">
                    <span className={`text-[9px] ${c.textMuteded} w-16 truncate text-right flex-shrink-0`}>{entry.label?.split(' ').slice(-2).join(' ')}</span>
                    <div className={`flex-1 h-3 rounded-full ${isDark ? 'bg-zinc-500' : 'bg-zinc-500'} overflow-hidden`}>
                      <div
                        className={`h-full rounded-full transition-all ${
                          pct >= 80 ? 'bg-zinc-500' : pct >= 60 ? 'bg-amber-500' : pct >= 40 ? 'bg-zinc-500' : 'bg-zinc-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className={`text-[9px] font-bold ${c.textMuteded} w-6`}>{score}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* People / Situation Tracker */}
      {peopleInsights && (
        <div className={`${c.card} border rounded-xl p-4`}>
          <h3 className={`text-sm font-bold ${c.text} mb-1`}>{t('sea_pt_title')}</h3>
          <p className={`text-[10px] ${c.textMuteded} mb-3`}>{t('sea_pt_subtitle', { count: journal.length })}</p>

          {peopleInsights.drains.length > 0 && (
            <div className="mb-3">
              <p className={`text-[10px] font-bold ${c.warningTxt} uppercase mb-1.5`}>{t('sea_pt_consistent_drains')}</p>
              <div className="space-y-1">
                {peopleInsights.drains.map((d, i) => (
                  <div key={i} className={`flex items-center justify-between p-2 rounded-lg ${c.danger} border`}>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${c.text}`}>{d.situation}</span>
                      <span className={`text-[9px] ${c.textMuteded}`}>×{d.count}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] ${c.textMuteded}`}>{t('sea_pt_perf', { value: d.avgPerf })}</span>
                      <span className={`text-[10px] font-black ${c.warningTxt}`}>{t('sea_pt_drain_per', { value: d.avgDrain })}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {peopleInsights.rechargers.length > 0 && (
            <div className="mb-3">
              <p className={`text-[10px] font-bold ${c.successTxt} uppercase mb-1.5`}>{t('sea_pt_consistent_rechargers')}</p>
              <div className="space-y-1">
                {peopleInsights.rechargers.map((r, i) => (
                  <div key={i} className={`flex items-center justify-between p-2 rounded-lg ${c.success} border`}>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${c.text}`}>{r.situation}</span>
                      <span className={`text-[9px] ${c.textMuteded}`}>×{r.count}</span>
                    </div>
                    <span className={`text-[10px] font-black ${c.successTxt}`}>{t('sea_pt_recharge_per', { value: Math.abs(r.avgDrain) })}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {peopleInsights.neutral.length > 0 && (
            <div>
              <p className={`text-[10px] font-bold ${c.textMuteded} uppercase mb-1.5`}>{t('sea_pt_neutral')}</p>
              <div className="flex flex-wrap gap-1.5">
                {peopleInsights.neutral.map((n, i) => (
                  <span key={i} className={`text-[10px] px-2 py-1 rounded-lg ${c.quoteBg} ${c.textSecondary}`}>
                    {n.situation} ×{n.count}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ideal Week — available after 3+ weeks */}
      {journal.length >= 3 && (
        <div className={`${c.card} border rounded-xl p-4`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-sm font-bold ${c.text}`}>{t('sea_iw_title')}</h3>
              <p className={`text-[10px] ${c.textMuteded}`}>{t('sea_iw_subtitle', { count: journal.length })}</p>
            </div>
            <button onClick={runIdealWeek} disabled={loading}
              className={`${c.btnPrimary} disabled:opacity-40 px-3 py-2 rounded-lg text-xs font-bold min-h-[36px]`}>
              {loading ? (tool?.icon ?? '⚡') : t('sea_iw_generate')}
            </button>
          </div>

          {idealWeekResults && (
            <div className="mt-4 space-y-3">
              {/* Key insight */}
              {idealWeekResults.key_insight && (
                <div className={`${c.verdict} border-2 rounded-lg p-3`}>
                  <p className={`text-sm font-bold ${c.text}`}>💡 {idealWeekResults.key_insight}</p>
                </div>
              )}

              {/* Energy rules */}
              {idealWeekResults.rules?.length > 0 && (
                <div>
                  <p className={`text-[10px] font-bold ${c.label} uppercase mb-1.5`}>{t('sea_iw_energy_rules')}</p>
                  <div className="space-y-1">
                    {idealWeekResults.rules.map((rule, i) => (
                      <p key={i} className={`text-xs ${c.textSecondary} p-2 rounded-lg ${c.quoteBg}`}>📌 {rule}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Ideal week grid */}
              {idealWeekResults.ideal_week?.length > 0 && (
                <div>
                  <p className={`text-[10px] font-bold ${c.label} uppercase mb-1.5`}>{t('sea_iw_day_structure')}</p>
                  <div className="space-y-1.5">
                    {idealWeekResults.ideal_week.map((day, i) => (
                      <div key={i} className={`${c.quoteBg} rounded-lg p-3`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs font-bold ${c.text}`}>{day.day}</span>
                          {day.energy_budget && (
                            <span className={`text-[9px] font-black ${c.accentTxt}`}>{day.energy_budget}</span>
                          )}
                        </div>
                        {day.what_goes_here && <p className={`text-[10px] ${c.successTxt}`}>✅ {day.what_goes_here}</p>}
                        {day.avoid && <p className={`text-[10px] ${c.warningTxt}`}>🚫 {day.avoid}</p>}
                        {day.recharge_window && <p className={`text-[10px] ${c.accentTxt}`}>🔋 {day.recharge_window}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Golden rule */}
              {idealWeekResults.golden_rule && (
                <div className={`${c.warningBox} border-2 rounded-xl p-4 text-center`}>
                  <p className={`text-[10px] font-bold ${c.label} uppercase mb-1`}>{t('sea_iw_golden_rule')}</p>
                  <p className={`text-sm font-bold ${c.accentTxt}`}>⭐ {idealWeekResults.golden_rule}</p>
                </div>
              )}

              {idealWeekResults.biggest_change && (
                <div className={`${c.success} border rounded-lg p-3`}>
                  <p className={`text-xs font-bold ${c.successTxt} mb-0.5`}>{t('sea_iw_biggest_change')}</p>
                  <p className={`text-xs ${c.successTxt}`}>{idealWeekResults.biggest_change}</p>
                </div>
              )}

              {idealWeekResults.warning_pattern && (
                <div className={`${c.danger} border rounded-lg p-3`}>
                  <p className={`text-xs font-bold ${c.warningTxt} mb-0.5`}>{t('sea_iw_warning_pattern')}</p>
                  <p className={`text-xs`}>{idealWeekResults.warning_pattern}</p>
                </div>
              )}

            </div>
          )}
        </div>
      )}

      {/* Compare mode instructions */}
      {compareMode && !compareEntries && (
        <div className={`${c.infoBox} border rounded-lg p-3`}>
          <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
            {t('sea_cmp_instructions')}
            {compareA ? ` ${t('sea_cmp_first_selected')}` : ''}
          </p>
        </div>
      )}

      {/* Compare view */}
      {compareEntries && (
        <div className={`${c.card} border rounded-xl p-4`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-sm font-bold ${c.text}`}>{t('sea_cmp_title')}</h3>
            <button onClick={() => { setCompareMode(false); setCompareA(null); setCompareB(null); }}
              className={`text-xs ${c.warningTxt} min-h-[28px]`}>{t('sea_cmp_close')}</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[compareEntries.a, compareEntries.b].map((entry, idx) => (
              <div key={idx} className={`${c.quoteBg} rounded-lg p-3`}>
                <p className={`text-xs font-bold ${c.text} mb-1`}>{entry.label}</p>
                <p className={`text-[10px] ${c.textMuteded} mb-2`}>{new Date(entry.date).toLocaleDateString()}</p>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className={`text-[10px] ${c.textMuteded}`}>{t('sea_cmp_energy_spent')}</span>
                    <span className={`text-xs font-black ${c.accentTxt}`}>{entry.energyScore || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`text-[10px] ${c.textMuteded}`}>{t('sea_cmp_interactions')}</span>
                    <span className={`text-xs font-bold ${c.text}`}>{entry.interactionCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`text-[10px] ${c.textMuteded}`}>{t('sea_cmp_verdict')}</span>
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${verdictColor(entry.verdict)}`}>
                      {entry.verdict || '—'}
                    </span>
                  </div>
                </div>
                {entry.oneLiner && <p className={`text-[10px] ${c.textSecondary} mt-2`}>{entry.oneLiner}</p>}
                {/* Show interaction list */}
                {entry.interactions?.length > 0 && (
                  <div className="mt-2 space-y-0.5">
                    <p className={`text-[9px] font-bold ${c.label} uppercase`}>{t('sea_cmp_interactions_label')}</p>
                    {entry.interactions.map((int, ii) => (
                      <div key={ii} className={`flex justify-between text-[9px]`}>
                        <span className={c.textSecondary}>{int.situation}</span>
                        <span className={`font-bold ${(int.energyBefore - int.energyAfter) > 3 ? c.warningTxt : c.textMuteded}`}>
                          {int.energyBefore}→{int.energyAfter}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          {/* Difference summary */}
          {compareEntries.a.energyScore && compareEntries.b.energyScore && (() => {
            const aScore = parseInt(String(compareEntries.a.energyScore).replace(/[^0-9]/g, '')) || 0;
            const bScore = parseInt(String(compareEntries.b.energyScore).replace(/[^0-9]/g, '')) || 0;
            const diff = aScore - bScore;
            if (diff === 0) return null;
            return (
              <div className={`mt-3 ${diff < 0 ? c.success : c.danger} border rounded-lg p-3 text-center`}>
                <p className={`text-xs font-bold`}>
                  {diff < 0
                    ? t('sea_cmp_fewer', { label: compareEntries.a.label, count: Math.abs(diff) })
                    : t('sea_cmp_more', { label: compareEntries.a.label, count: diff })
                  }
                </p>
              </div>
            );
          })()}
        </div>
      )}

      {journal.length === 0 ? (
        <div className={`${c.card} border rounded-xl p-8 text-center`}>
          <span className="text-3xl block mb-2">📝</span>
          <p className={`text-sm ${c.textMuteded}`}>{t('sea_jr_empty')}</p>
          <button onClick={() => setView('log')} className={`${c.btnPrimary} px-4 py-2 rounded-lg text-xs font-bold mt-3 min-h-[36px]`}>
            {t('sea_jr_start_audit')}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {journal.map(entry => {
            const isSelectedA = compareA === entry.id;
            const isSelectedB = compareB === entry.id;
            const isSelected = isSelectedA || isSelectedB;

            return (
              <div
                key={entry.id}
                onClick={() => {
                  if (!compareMode) return;
                  if (isSelected) {
                    if (isSelectedA) setCompareA(null);
                    else setCompareB(null);
                  } else if (!compareA) setCompareA(entry.id);
                  else if (!compareB) setCompareB(entry.id);
                }}
                className={`${c.card} border rounded-xl p-4 transition-colors ${
                  compareMode ? 'cursor-pointer' : ''
                } ${isSelected ? (isDark ? 'ring-2 ring-amber-500' : 'ring-2 ring-zinc-500') : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {compareMode && (
                        <span className={`text-xs font-bold ${isSelected ? c.accentTxt : c.textMuteded}`}>
                          {isSelectedA ? 'A' : isSelectedB ? 'B' : '○'}
                        </span>
                      )}
                      <p className={`text-sm font-bold ${c.text} truncate`}>{entry.label}</p>
                    </div>
                    <p className={`text-[10px] ${c.textMuteded}`}>
                      {new Date(entry.date).toLocaleDateString()} · {t('sea_jr_interactions_count', { count: entry.interactionCount })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-right">
                      {entry.energyScore && <p className={`text-sm font-black ${c.accentTxt}`}>{entry.energyScore}</p>}
                      {entry.verdict && (
                        <span className={`inline-block text-[8px] font-black px-2 py-0.5 rounded ${verdictColor(entry.verdict)}`}>
                          {entry.verdict}
                        </span>
                      )}
                    </div>
                    {!compareMode && (
                      <button
                        onClick={(e) => { e.stopPropagation(); editJournalEntry(entry); }}
                        className={`${c.btnSecondary} px-2 py-1 rounded text-[10px] font-bold min-h-[28px]`}
                        title={t('sea_jr_edit_title')}
                      >
                        ✏️
                      </button>
                    )}
                  </div>
                </div>
                {entry.oneLiner && <p className={`text-xs ${c.textSecondary} mt-1`}>{entry.oneLiner}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // ════════════════════════════════════════════════════════════
  // MAIN RENDER
  // ════════════════════════════════════════════════════════════
  return (
    <div className={`space-y-4 ${c.text}`}>
      <div className={`${c.card} border rounded-xl p-5`}>
        <div className={`mb-0 pb-3 border-b ${c.border}`}>
          <h2 className={`text-xl font-bold ${c.text}`}>
            <span className="mr-2">{tool?.icon ?? '⚡'}</span>{tool?.title ?? t('sea_title')}
          </h2>
          <p className={`text-sm ${c.textSecondary}`}>{tool?.tagline ?? t('sea_tagline')}</p>
          <button onClick={loadExample} disabled={loading} style={{ backgroundColor: (tool?.headerColor ?? '#888888') + '80' }} className={`mt-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border disabled:opacity-40 ${isDark ? 'text-white border-white/40' : 'text-gray-800 border-transparent'}`}>{t('sea_try_example')}</button>
        </div>
        <div className="pt-3">
          {renderNav()}
        </div>
      </div>

      {error && (
        <div className={`${c.danger} border rounded-lg p-4 flex items-start gap-3`}>
          <span className="flex-shrink-0">⚠️</span>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {!results && view === 'log' && (
        <p className={`text-[11px] ${c.textMuted} text-center`}>
          {t('sea_xref_pre')} <a href="/CrashPredictor" className={linkStyle}>{t('sea_xref_crashpredictor')}</a> {t('sea_xref_post')}
        </p>
      )}

      {view === 'log' && renderLog()}
      {view === 'results' && renderResults()}
      {view === 'quickcheck' && renderQuickCheck()}
      {view === 'checkin' && renderCheckin()}
      {view === 'forecast' && renderForecast()}
      {view === 'plan' && renderPlan()}
      {view === 'recharge' && renderRecharge()}
      {view === 'journal' && renderJournal()}

      {/* eslint-disable-next-line no-restricted-globals */}
      {sessionHistory.length > 0 && (<div className={`${c.cardAlt} border ${c.border} rounded-xl p-4 mt-4`}><p className={`text-xs font-bold ${c.textMuted} mb-2`}>{t('sea_recent')}</p><div className="space-y-1">{sessionHistory.map(s => (<div key={s.id} className="flex items-center justify-between"><span className={`text-xs ${c.textSecondary} truncate`}>{s.preview||t('sea_session')}</span><span className={`text-xs ${c.textMuted} ml-2`}>{new Date(s.date).toLocaleDateString()}</span></div>))}</div></div>)}
    </div>
  );
};

SocialEnergyAudit.displayName = 'SocialEnergyAudit';

// ════════════════════════════════════════════════════════════
// SECTION COMPONENT (declared after main component so PF-14's first-useState
// scan lands inside the main component, not this helper)
// ════════════════════════════════════════════════════════════
function Section({ icon, title, badge, badgeClass, children, defaultOpen = false, c }) {
  const [open, setOpen] = useState(defaultOpen);
  const ui = (
    <div className={`${c.card} border rounded-xl overflow-hidden`}>
      <button
        onClick={() => setOpen(p => !p)}
        className="w-full p-4 flex items-center justify-between text-left min-h-[44px]"
      >
        <div className="flex items-center gap-2.5">
          {icon && <span className="text-sm">{icon}</span>}
          <h3 className={`text-sm font-bold ${c.text}`}>{title}</h3>
          {badge && (
            <span className={`text-[9px] font-black px-2 py-0.5 rounded ${badgeClass || c.cardAlt}`}>
              {badge}
            </span>
          )}
        </div>
        <span className={`text-xs ${c.textMuteded}`}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className={`px-4 pb-4 border-t ${c.border} pt-3 space-y-3`}>
          {children}
        </div>
      )}
    </div>
  );
  return ui;
}

export default SocialEnergyAudit;
