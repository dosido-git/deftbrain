import React, { useState, useCallback, useMemo } from 'react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';
import { CopyBtn, ActionBar } from '../components/ActionButtons';
import { usePersistentState } from '../hooks/usePersistentState';

// ════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════
const POPULAR_AIRPORTS = [
  { code: 'JFK', name: 'New York JFK' },
  { code: 'LAX', name: 'Los Angeles' },
  { code: 'ORD', name: 'Chicago O\'Hare' },
  { code: 'LHR', name: 'London Heathrow' },
  { code: 'CDG', name: 'Paris CDG' },
  { code: 'FRA', name: 'Frankfurt' },
  { code: 'DXB', name: 'Dubai' },
  { code: 'SIN', name: 'Singapore Changi' },
  { code: 'HND', name: 'Tokyo Haneda' },
  { code: 'ICN', name: 'Seoul Incheon' },
  { code: 'IST', name: 'Istanbul' },
  { code: 'DOH', name: 'Doha Hamad' },
  { code: 'AMS', name: 'Amsterdam Schiphol' },
  { code: 'MUC', name: 'Munich' },
  { code: 'ATL', name: 'Atlanta' },
  { code: 'DFW', name: 'Dallas/Fort Worth' },
  { code: 'DEN', name: 'Denver' },
  { code: 'SFO', name: 'San Francisco' },
  { code: 'MIA', name: 'Miami' },
  { code: 'TPE', name: 'Taipei Taoyuan' },
];

const TRAVEL_STYLES = [
  { value: 'explorer', label: 'I want to see the city', emoji: '🌍' },
  { value: 'foodie', label: 'Feed me the local food', emoji: '🍜' },
  { value: 'relaxer', label: 'I just want to rest', emoji: '😴' },
  { value: 'efficient', label: 'Maximum value, minimum stress', emoji: '⚡' },
];

const STORE_LAYOVERS = 'lm-saved';
const MAX_SAVED = 20;

function loadStore(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}
function saveStore(key, items, max) {
  try { localStorage.setItem(key, JSON.stringify(items.slice(0, max))); } catch {}
}

// ════════════════════════════════════════════════════════════
// SECTION COMPONENT
// ════════════════════════════════════════════════════════════
function Section({ icon, title, badge, badgeColor, children, defaultOpen = false, c }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`${c.card} ${c.border} border rounded-xl overflow-hidden`}>
      <button onClick={() => setOpen(!open)} className="w-full px-4 py-3 flex items-center gap-2 text-left min-h-[44px]">
        <span>{icon}</span>
        <span className={`text-xs font-bold flex-1 ${c.text}`}>{title}</span>
        {badge && <span className={`text-[9px] font-black px-2 py-0.5 rounded ${badgeColor || c.badge}`}>{badge}</span>}
        <span className={`text-xs ${c.textMuteded}`}>{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className={`px-4 pb-4 border-t ${c.border} pt-3`}>{children}</div>}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════
const LayoverMaximizer = ({ tool }) => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const { isDark } = useTheme();

  const c = {
    card: isDark ? 'bg-zinc-800' : 'bg-white',
    input: isDark
      ? 'bg-zinc-900 border-zinc-600 text-zinc-50 placeholder:text-zinc-500 focus:border-sky-500 focus:ring-sky-500/20'
      : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-sky-100',
    text: isDark ? 'text-zinc-50' : 'text-slate-900',
    skyText: isDark ? 'text-sky-400' : 'text-sky-600',
    btnPrimary:    isDark ? 'bg-cyan-600 hover:bg-cyan-500 text-white' : 'bg-cyan-600 hover:bg-cyan-700 text-white',
    danger: isDark ? 'bg-red-900/20 border-red-700/50 text-red-200' : 'bg-red-50 border-red-200 text-red-800',
    success: isDark ? 'bg-emerald-900/20 border-emerald-700/50 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-800',
    warning: isDark ? 'bg-amber-900/20 border-amber-700/50 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-800',
    highlight: isDark ? 'bg-sky-900/20 border-sky-700/50 text-sky-200' : 'bg-sky-50 border-sky-200 text-sky-800',
    pillActive: isDark ? 'bg-sky-600 border-sky-500 text-white' : 'bg-sky-600 border-sky-600 text-white',
    pillInactive: isDark ? 'bg-zinc-700 border-zinc-600 text-zinc-300 hover:border-zinc-500' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300',
    quoteBg: isDark ? 'bg-zinc-900/60' : 'bg-slate-50',
    border:        isDark ? 'border-zinc-700' : 'border-gray-200',
    textSecondary: isDark ? 'text-zinc-300' : 'text-gray-600',
    textMuted:     isDark ? 'text-zinc-400' : 'text-gray-400',
    btnSecondary:  isDark ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-100' : 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    badge:         isDark ? 'bg-zinc-700 text-zinc-300' : 'bg-gray-100 text-gray-600',
    cardAlt:       isDark ? 'bg-zinc-700/50' : 'bg-slate-50',
  };

  const linkStyle = isDark
    ? 'text-cyan-400 hover:text-cyan-300 underline underline-offset-2'
    : 'text-cyan-600 hover:text-cyan-700 underline underline-offset-2';

  // ── View ──
  const resultsRef = React.useRef(null);

  const [view, setView] = useState('plan');
  const [error, setError] = useState('');

  // ── Main form ──
  const [airport, setAirport] = useState('');
  const [layoverHours, setLayoverHours] = useState('');
  const [nationality, setNationality] = useState('');
  const [hasCheckedBags, setHasCheckedBags] = useState(false);
  const [hasPreCheck, setHasPreCheck] = useState(false);
  const [arrivalTerminal, setArrivalTerminal] = useState('');
  const [connectionTerminal, setConnectionTerminal] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [travelStyle, setTravelStyle] = useState('');
  const [results, setResults] = usePersistentState('lm-results', null);
  const [layoverHistory, setLayoverHistory] = usePersistentState('lm-history', []);

  // ── Lounge form ──
  const [loungeAirport, setLoungeAirport] = useState('');
  const [loungeTerminal, setLoungeTerminal] = useState('');
  const [loungeCards, setLoungeCards] = useState('');
  const [loungeAirline, setLoungeAirline] = useState('');
  const [loungeStatus, setLoungeStatus] = useState('');
  const [loungeResults, setLoungeResults] = useState(null);

  // ── Risk form ──
  const [riskAirport, setRiskAirport] = useState('');
  const [riskAirline, setRiskAirline] = useState('');
  const [riskHours, setRiskHours] = useState('');
  const [riskScenario, setRiskScenario] = useState('');
  const [riskDelay, setRiskDelay] = useState('');
  const [riskIntl, setRiskIntl] = useState(false);
  const [riskResults, setRiskResults] = useState(null);

  // ── Saved layovers ──
  const [savedLayovers, setSavedLayovers] = useState(() => loadStore(STORE_LAYOVERS));

  // ── "I'm here now" mode ──
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [departureTime, setDepartureTime] = useState('');

  const liveHoursRemaining = useMemo(() => {
    if (!isLiveMode || !departureTime) return null;
    const now = new Date();
    const [h, m] = departureTime.split(':').map(Number);
    const dep = new Date(now);
    dep.setHours(h, m, 0, 0);
    if (dep < now) dep.setDate(dep.getDate() + 1); // next day if past
    const diff = (dep - now) / 3600000;
    return Math.max(0, Math.round(diff * 10) / 10);
  }, [isLiveMode, departureTime]);

  // ── Gate-to-Gate ──
  const [g2gAirport, setG2gAirport] = useState('');
  const [g2gArrival, setG2gArrival] = useState('');
  const [g2gDeparture, setG2gDeparture] = useState('');
  const [g2gMinutes, setG2gMinutes] = useState('');
  const [g2gResults, setG2gResults] = useState(null);

  // ── Compare ──
  const [cmpOptions, setCmpOptions] = useState([
    { airport: '', hours: '', notes: '' },
    { airport: '', hours: '', notes: '' },
  ]);
  const [cmpResults, setCmpResults] = useState(null);

  // ── Delay Tracker ──
  const [delayMinutes, setDelayMinutes] = useState('');

  // ── Packing ──
  const [packResults, setPackResults] = useState(null);

  // ── Survival Kit ──
  const [kitAirport, setKitAirport] = useState('');
  const [kitAirline, setKitAirline] = useState('');
  const [kitHours, setKitHours] = useState('');
  const [kitResults, setKitResults] = useState(null);

  // ── API: Main analysis ──
  const runAnalysis = useCallback(async () => {
    const ap = airport.trim();
    const hours = isLiveMode && liveHoursRemaining !== null ? liveHoursRemaining : Number(layoverHours);
    if (!ap) { setError('Enter an airport.'); return; }
    if (!hours || hours < 0.5) { setError('Enter your layover duration.'); return; }
    setError('');
    setResults(null);
    try {
      const data = await callToolEndpoint('layover-maximizer', {
        airport: ap, layoverHours: hours, nationality: nationality.trim() || null,
        hasCheckedBags, hasPreCheck,
        arrivalTerminal: arrivalTerminal.trim() || null,
        connectionTerminal: connectionTerminal.trim() || null,
        arrivalTime: arrivalTime || null, travelStyle: travelStyle || null,
      });
      setResults(data);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      // Auto-populate lounge/risk airport
      setLoungeAirport(data.airport_code || ap);
      setRiskAirport(data.airport_code || ap);
    } catch (err) {
      setError(err.message || 'Analysis failed');
    }
  }, [airport, layoverHours, nationality, hasCheckedBags, hasPreCheck, arrivalTerminal, connectionTerminal, arrivalTime, travelStyle, isLiveMode, liveHoursRemaining, callToolEndpoint]);

  // ── API: Lounge finder ──
  const runLounge = useCallback(async () => {
    if (!loungeAirport.trim()) { setError('Enter an airport.'); return; }
    setError('');
    setLoungeResults(null);
    try {
      const data = await callToolEndpoint('layover-maximizer/lounge', {
        airport: loungeAirport.trim(),
        terminal: loungeTerminal.trim() || null,
        cards: loungeCards.trim() ? loungeCards.split(',').map(s => s.trim()) : null,
        airline: loungeAirline.trim() || null,
        status: loungeStatus.trim() || null,
      });
      setLoungeResults(data);
    } catch (err) {
      setError(err.message || 'Lounge search failed');
    }
  }, [loungeAirport, loungeTerminal, loungeCards, loungeAirline, loungeStatus, callToolEndpoint]);

  // ── API: Risk calculator ──
  const runRisk = useCallback(async () => {
    if (!riskAirport.trim()) { setError('Enter an airport.'); return; }
    setError('');
    setRiskResults(null);
    try {
      const data = await callToolEndpoint('layover-maximizer/risk', {
        airport: riskAirport.trim(),
        airline: riskAirline.trim() || null,
        layoverHours: riskHours ? Number(riskHours) : null,
        scenario: riskScenario.trim() || null,
        delayMinutes: riskDelay ? Number(riskDelay) : null,
        isInternational: riskIntl,
      });
      setRiskResults(data);
    } catch (err) {
      setError(err.message || 'Risk analysis failed');
    }
  }, [riskAirport, riskAirline, riskHours, riskScenario, riskDelay, riskIntl, callToolEndpoint]);

  // ── API: Gate-to-Gate ──
  const runGateToGate = useCallback(async () => {
    if (!g2gAirport.trim()) { setError('Enter an airport.'); return; }
    setError(''); setG2gResults(null);
    try {
      const data = await callToolEndpoint('layover-maximizer/gate-to-gate', {
        airport: g2gAirport.trim(),
        arrivalGate: g2gArrival.trim() || null,
        departureGate: g2gDeparture.trim() || null,
        hasPreCheck,
        minutesAvailable: g2gMinutes ? Number(g2gMinutes) : null,
      });
      setG2gResults(data);
    } catch (err) { setError(err.message || 'Gate transfer failed'); }
  }, [g2gAirport, g2gArrival, g2gDeparture, hasPreCheck, g2gMinutes, callToolEndpoint]);

  // ── API: Compare ──
  const runCompare = useCallback(async () => {
    const valid = cmpOptions.filter(o => o.airport.trim() && o.hours);
    if (valid.length < 2) { setError('Enter at least 2 layover options.'); return; }
    setError(''); setCmpResults(null);
    try {
      const data = await callToolEndpoint('layover-maximizer/compare', {
        options: valid.map(o => ({ airport: o.airport.trim(), hours: Number(o.hours), notes: o.notes.trim() || null })),
        nationality: nationality.trim() || null,
        travelStyle: travelStyle || null,
      });
      setCmpResults(data);
    } catch (err) { setError(err.message || 'Comparison failed'); }
  }, [cmpOptions, nationality, travelStyle, callToolEndpoint]);

  // ── API: Packing ──
  const runPacking = useCallback(async () => {
    const ap = results?.airport_code || airport.trim();
    if (!ap) { setError('Run a layover analysis first, or enter an airport.'); return; }
    setError(''); setPackResults(null);
    try {
      const data = await callToolEndpoint('layover-maximizer/packing', {
        airport: ap,
        hours: layoverHours || null,
        leavingAirport: results?.verdict === 'YES',
        scenario: travelStyle || null,
      });
      setPackResults(data);
    } catch (err) { setError(err.message || 'Packing list failed'); }
  }, [results, airport, layoverHours, travelStyle, callToolEndpoint]);

  // ── API: Survival Kit ──
  const runSurvivalKit = useCallback(async () => {
    const ap = kitAirport.trim() || results?.airport_code || airport.trim();
    if (!ap) { setError('Enter an airport.'); return; }
    setError(''); setKitResults(null);
    try {
      const data = await callToolEndpoint('layover-maximizer/survival-kit', {
        airport: ap,
        airline: kitAirline.trim() || null,
        hours: kitHours || layoverHours || null,
        plan: results?.verdict === 'YES' ? 'Leaving airport to explore' : 'Staying in airport',
      });
      setKitResults(data);
    } catch (err) { setError(err.message || 'Survival kit failed'); }
  }, [kitAirport, kitAirline, kitHours, results, airport, layoverHours, callToolEndpoint]);

  // ── Delay recalculation ──
  const delayImpact = useMemo(() => {
    if (!results?.time_math || !delayMinutes) return null;
    const dm = Number(delayMinutes);
    if (dm <= 0) return null;
    const tm = results.time_math;
    const newAvailable = tm.available_city_minutes - dm;
    const originalVerdict = results.verdict;
    let newVerdict = originalVerdict;
    if (newAvailable < 30) newVerdict = 'NO';
    else if (newAvailable < 90) newVerdict = 'RISKY';
    else newVerdict = 'YES';
    return {
      originalMinutes: tm.available_city_minutes,
      newMinutes: Math.max(0, newAvailable),
      lost: dm,
      originalVerdict,
      newVerdict,
      changed: newVerdict !== originalVerdict,
    };
  }, [results, delayMinutes]);

  // ── Save layover ──
  const saveLayover = useCallback(() => {
    if (!results) return;
    const saved = {
      id: Date.now(),
      airport: results.airport_code || airport,
      airportName: results.airport_name || airport,
      city: results.city,
      hours: Number(layoverHours),
      verdict: results.verdict,
      date: new Date().toISOString(),
    };
    const updated = [saved, ...savedLayovers].slice(0, MAX_SAVED);
    setLayoverHistory(prev => [{ id: saved.id, date: saved.date || new Date().toISOString(), preview: (saved.airportName || saved.airport || '').slice(0, 40) }, ...prev].slice(0, 6));
    setSavedLayovers(updated);
    saveStore(STORE_LAYOVERS, updated, MAX_SAVED);
  }, [results, airport, layoverHours, savedLayovers]);

  const removeSaved = useCallback((id) => {
    const updated = savedLayovers.filter(s => s.id !== id);
    setSavedLayovers(updated);
    saveStore(STORE_LAYOVERS, updated, MAX_SAVED);
  }, [savedLayovers]);

  // Global Cmd/Ctrl+Enter submit
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !loading) runAnalysis();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [runAnalysis, loading]);

  // ── Build copy text ──
  const buildPlanText = useCallback(() => {
    if (!results) return '';
    const r = results;
    let t = `LAYOVER PLAN — ${r.airport_name || airport}\n`;
    t += `${r.verdict_emoji} Verdict: ${r.verdict} — ${r.verdict_summary}\n\n`;

    if (r.time_math) {
      t += `TIME MATH:\n${r.time_math.breakdown_explanation}\n`;
      if (r.time_math.return_by_time) t += `Return by: ${r.time_math.return_by_time}\n`;
      t += `Available time: ${Math.floor(r.time_math.available_city_minutes / 60)}h ${r.time_math.available_city_minutes % 60}min\n\n`;
    }

    if (r.leave_the_airport?.explore_itinerary?.stops?.length) {
      t += `EXPLORE:\n`;
      r.leave_the_airport.explore_itinerary.stops.forEach((s, i) => {
        t += `${i + 1}. ${s.name} — ${s.what} (${s.time_needed})\n`;
      });
      t += '\n';
    }

    if (r.stay_in_airport?.food?.length) {
      t += `EAT:\n`;
      r.stay_in_airport.food.forEach(f => { t += `• ${f.name} (${f.terminal}) — ${f.type}\n`; });
      t += '\n';
    }

    if (r.pro_tips?.length) {
      t += `PRO TIPS:\n`;
      r.pro_tips.forEach(tip => { t += `• ${tip}\n`; });
    }

    t += '\n— Generated by DeftBrain · deftbrain.com';
    return t;
  }, [results, airport]);

  // ════════════════════════════════════════════════════════════
  // NAV
  // ════════════════════════════════════════════════════════════
  const renderNav = () => (
    <div className="flex flex-wrap gap-1.5 mb-5">
      {[
        { key: 'plan', label: '✈️ Plan' },
        { key: 'gate', label: '🚶 Gate-to-Gate' },
        { key: 'delay', label: '⏰ Delay Tracker' },
        { key: 'compare', label: '⚖️ Compare' },
        { key: 'lounge', label: '🛋️ Lounges' },
        { key: 'packing', label: '🎒 Packing' },
        { key: 'kit', label: '🧰 Survival Kit' },
        { key: 'risk', label: '⚠️ Risk' },
        { key: 'saved', label: `📌 Saved${savedLayovers.length ? ` (${savedLayovers.length})` : ''}` },
      ].map(tab => (
        <button key={tab.key} onClick={() => { setView(tab.key); setError(''); }}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors min-h-[32px] ${
            view === tab.key ? c.pillActive : c.pillInactive
          }`}>{tab.label}</button>
      ))}
    </div>
  );

  // ════════════════════════════════════════════════════════════
  // RENDER: PLAN (main form + results)
  // ════════════════════════════════════════════════════════════
  const renderPlan = () => {
    const VERDICT_COLORS = {
      'YES': isDark ? 'bg-emerald-900/40 border-emerald-700 text-emerald-200' : 'bg-emerald-50 border-emerald-300 text-emerald-800',
      'NO': isDark ? 'bg-red-900/40 border-red-700 text-red-200' : 'bg-red-50 border-red-300 text-red-800',
      'RISKY': isDark ? 'bg-amber-900/40 border-amber-700 text-amber-200' : 'bg-amber-50 border-amber-300 text-amber-800',
    };

    return (
      <div className="space-y-4">
        <div className={`${c.card} ${c.border} border rounded-xl p-5`}>
          <h3 className={`text-sm font-bold ${c.text} mb-1`}><span className='mr-1'>{tool?.icon ?? '✈️'}</span>{tool?.title || 'Layover Planner'}</h3>
          <p className={`text-xs ${c.textMuteded} mb-4`}>Should you leave the airport? And what should you do either way?</p>

          <div className="space-y-3">
            {/* Live mode toggle */}
            <div className={`flex items-center gap-2 p-2.5 rounded-lg border ${isLiveMode ? (isDark ? 'border-sky-600 bg-sky-900/20' : 'border-sky-300 bg-sky-50') : c.card}`}>
              <input type="checkbox" checked={isLiveMode} onChange={() => setIsLiveMode(!isLiveMode)} className="accent-sky-500" />
              <span className={`text-xs font-bold ${c.text}`}>📍 I'm at the airport right now</span>
              {isLiveMode && (
                <div className="flex items-center gap-1 ml-auto">
                  <span className={`text-[10px] ${c.textMuteded}`}>Departure:</span>
                  <input type="time" value={departureTime} onChange={e => setDepartureTime(e.target.value)}
                    className={`px-2 py-1 border rounded text-xs ${c.input} outline-none`} />
                  {liveHoursRemaining !== null && (
                    <span className={`text-xs font-black ${liveHoursRemaining < 2 ? c.danger : c.skyText}`}>
                      {liveHoursRemaining}h left
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Airport */}
            <div>
              <label className={`text-xs font-bold ${c.textSecondaryondary} block mb-1.5`}>Airport *</label>
              <input value={airport} onChange={e => setAirport(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') runAnalysis(); }}
                placeholder="Airport code or name (e.g. NRT, Narita, Istanbul)"
                className={`w-full px-3 py-2 border rounded-lg text-xs ${c.input} outline-none focus:ring-2`} />
              <div className="flex flex-wrap gap-1 mt-1.5">
                {POPULAR_AIRPORTS.slice(0, 6).map(ap => (
                  <button key={ap.code} onClick={() => setAirport(ap.code)}
                    className={`text-[9px] px-1.5 py-0.5 rounded border ${airport === ap.code ? c.pillActive : c.pillInactive} min-h-[22px]`}>
                    {ap.code}
                  </button>
                ))}
              </div>
            </div>

            {/* Layover duration */}
            {!isLiveMode && (
              <div>
                <label className={`text-xs font-bold ${c.textSecondaryondary} block mb-1.5`}>Layover duration (hours) *</label>
                <input type="number" step="0.5" min="0.5" max="24" value={layoverHours}
                  onChange={e => setLayoverHours(e.target.value)}
                  placeholder="e.g. 5"
                  className={`w-full px-3 py-2 border rounded-lg text-xs ${c.input} outline-none focus:ring-2`} />
              </div>
            )}

            {/* Details row */}
            <div className="flex flex-wrap gap-2">
              <div className="flex-1 min-w-[140px]">
                <label className={`text-xs font-bold ${c.textSecondaryondary} block mb-1.5`}>Nationality / Passport</label>
                <input value={nationality} onChange={e => setNationality(e.target.value)}
                  placeholder="e.g. US, UK, Indian"
                  className={`w-full px-2 py-1.5 border rounded-lg text-xs ${c.input} outline-none`} />
              </div>
              <div className="flex-1 min-w-[100px]">
                <label className={`text-xs font-bold ${c.textSecondaryondary} block mb-1.5`}>Arrival terminal</label>
                <input value={arrivalTerminal} onChange={e => setArrivalTerminal(e.target.value)}
                  placeholder="e.g. 1, B"
                  className={`w-full px-2 py-1.5 border rounded-lg text-xs ${c.input} outline-none`} />
              </div>
              <div className="flex-1 min-w-[100px]">
                <label className={`text-xs font-bold ${c.textSecondaryondary} block mb-1.5`}>Departure terminal</label>
                <input value={connectionTerminal} onChange={e => setConnectionTerminal(e.target.value)}
                  placeholder="e.g. 3, E"
                  className={`w-full px-2 py-1.5 border rounded-lg text-xs ${c.input} outline-none`} />
              </div>
            </div>

            {/* Arrival time */}
            {!isLiveMode && (
              <div>
                <label className={`text-xs font-bold ${c.textSecondaryondary} block mb-1.5`}>Landing time (optional — for return-by calculation)</label>
                <input type="time" value={arrivalTime} onChange={e => setArrivalTime(e.target.value)}
                  className={`px-3 py-2 border rounded-lg text-xs ${c.input} outline-none`} />
              </div>
            )}

            {/* Checkboxes */}
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input type="checkbox" checked={hasCheckedBags} onChange={() => setHasCheckedBags(!hasCheckedBags)}
                  className="accent-sky-500" />
                <span className={c.text}>🧳 Checked bags (through to destination)</span>
              </label>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input type="checkbox" checked={hasPreCheck} onChange={() => setHasPreCheck(!hasPreCheck)}
                  className="accent-sky-500" />
                <span className={c.text}>⚡ TSA PreCheck / Global Entry</span>
              </label>
            </div>

            {/* Travel style */}
            <div>
              <label className={`text-xs font-bold ${c.textSecondaryondary} block mb-1.5`}>Travel style</label>
              <div className="flex flex-wrap gap-1.5">
                {TRAVEL_STYLES.map(ts => (
                  <button key={ts.value} onClick={() => setTravelStyle(travelStyle === ts.value ? '' : ts.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors min-h-[32px] ${
                      travelStyle === ts.value ? c.pillActive : c.pillInactive
                    }`}>{ts.emoji} {ts.label}</button>
                ))}
              </div>
            </div>

            <button onClick={runAnalysis} disabled={loading || !airport.trim()}
              className={`w-full ${c.btnPrimaryPrimary} disabled:opacity-40 font-bold py-3 rounded-lg flex items-center justify-center gap-2 min-h-[48px]`}>
              {loading ? <><span className="animate-spin inline-block">{tool?.icon ?? '✈️'}</span> Analyzing...</> : <><span>{tool?.icon ?? '✈️'}</span> Analyze My Layover</>}
            </button>
          </div>
        </div>

        {/* ── RESULTS ── */}
        {results && (() => {
          const r = results;
          return (
            <div ref={resultsRef} className="space-y-4">
              {/* Verdict banner */}
              <div className={`border-2 rounded-xl p-5 text-center ${VERDICT_COLORS[r.verdict] || c.card}`}>
                <p className="text-3xl mb-1">{r.verdict_emoji}</p>
                <p className="text-xl font-black">{r.verdict === 'YES' ? 'Go Explore!' : r.verdict === 'NO' ? 'Stay in the Airport' : 'Risky — But Possible'}</p>
                <p className="text-sm mt-1">{r.verdict_summary}</p>

                {/* Save + action buttons */}
                <div className="flex justify-center gap-2 mt-3">
                  <button onClick={saveLayover}
                    className={`${c.btnPrimarySecondaryondary} px-3 py-1.5 rounded-lg text-xs font-bold min-h-[32px]`}>
                    📌 Save
                  </button>
                  <button onClick={() => { setRiskAirport(r.airport_code || airport); setRiskHours(layoverHours); setView('risk'); }}
                    className={`${c.btnPrimarySecondaryondary} px-3 py-1.5 rounded-lg text-xs font-bold min-h-[32px]`}>
                    ⚠️ Check Risk
                  </button>
                  <button onClick={() => { setLoungeAirport(r.airport_code || airport); setView('lounge'); }}
                    className={`${c.btnPrimarySecondaryondary} px-3 py-1.5 rounded-lg text-xs font-bold min-h-[32px]`}>
                    🛋️ Find Lounges
                  </button>
                </div>
              </div>

              {/* Time math */}
              {r.time_math && (
                <Section icon="⏱️" title="Time Math" defaultOpen c={c}>
                  <p className={`text-sm ${c.text} mb-3`}>{r.time_math.breakdown_explanation}</p>
                  <div className="space-y-1.5">
                    {[
                      { label: 'Total layover', val: `${Math.floor(r.time_math.total_layover_minutes / 60)}h ${r.time_math.total_layover_minutes % 60}m` },
                      { label: 'Deplane + walk', val: `${r.time_math.deplane_and_walk_minutes}m`, minus: true },
                      { label: 'Immigration (exit)', val: `${r.time_math.immigration_exit_minutes}m`, minus: true },
                      { label: 'Transit to city', val: `${r.time_math.transit_to_city_minutes}m`, minus: true },
                      { label: 'Transit back', val: `${r.time_math.transit_from_city_minutes}m`, minus: true },
                      { label: 'Security re-entry', val: `${r.time_math.security_reentry_minutes}m`, minus: true },
                      { label: 'Safety buffer', val: `${r.time_math.buffer_minutes}m`, minus: true },
                    ].filter(row => {
                      const num = parseInt(row.val);
                      return num > 0;
                    }).map((row, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className={c.textMuteded}>{row.minus ? '−' : ''} {row.label}</span>
                        <span className={`font-bold ${row.minus ? c.danger : c.text}`}>{row.val}</span>
                      </div>
                    ))}
                    <div className={`flex items-center justify-between text-sm font-black border-t ${c.border} pt-2 mt-2`}>
                      <span className={c.text}>= Available time</span>
                      <span className={r.time_math.available_city_minutes > 60 ? c.success : c.danger}>
                        {Math.floor(r.time_math.available_city_minutes / 60)}h {r.time_math.available_city_minutes % 60}m
                      </span>
                    </div>
                  </div>
                  {r.time_math.return_by_time && (
                    <div className={`${c.warning} border rounded-lg p-3 mt-3 text-center`}>
                      <p className={`text-xs font-bold ${c.warning}`}>⏰ Be back at the airport by: <span className="text-sm">{r.time_math.return_by_time}</span></p>
                    </div>
                  )}
                </Section>
              )}

              {/* Terminal change warning */}
              {r.terminal_change_warning && (
                <div className={`${c.warning} border rounded-xl p-4 flex items-start gap-2`}>
                  <span className="flex-shrink-0">🔀</span>
                  <div>
                    <p className={`text-xs font-bold ${c.warning}`}>Terminal Change</p>
                    <p className="text-xs">{r.terminal_change_warning}</p>
                  </div>
                </div>
              )}

              {/* GO EXPLORE */}
              {r.leave_the_airport?.can_leave && r.leave_the_airport?.explore_itinerary?.stops?.length > 0 && (
                <Section icon="🌍" title="Go Explore" badge={r.leave_the_airport.explore_itinerary.total_explore_time} badgeColor={c.success} defaultOpen={r.verdict === 'YES'} c={c}>
                  <div className="space-y-4">
                    {/* Visa info */}
                    {r.leave_the_airport.visa_info && (
                      <div className={`${c.highlight} border rounded-lg p-3`}>
                        <p className={`text-[10px] font-bold ${c.textSecondaryondary} uppercase mb-1`}>🛂 Visa / Transit</p>
                        <p className="text-xs">{r.leave_the_airport.visa_info}</p>
                      </div>
                    )}

                    {/* Transit options */}
                    {r.leave_the_airport.transit_options?.length > 0 && (
                      <div>
                        <p className={`text-[10px] font-bold ${c.textSecondaryondary} uppercase mb-1.5`}>🚇 Getting to the city</p>
                        {r.leave_the_airport.transit_options.map((t, i) => (
                          <div key={i} className={`${c.quoteBg} rounded-lg p-3 mb-1.5`}>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold">{t.mode}: {t.name}</span>
                              <span className={`text-xs ${c.textMuteded}`}>{t.time_minutes}min • {t.cost_estimate}</span>
                            </div>
                            {t.notes && <p className={`text-[10px] ${c.textMuteded} mt-0.5`}>{t.notes}</p>}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Itinerary */}
                    <div>
                      <p className={`text-xs font-bold ${c.text} mb-0.5`}>{r.leave_the_airport.explore_itinerary.theme}</p>
                      <div className="space-y-2">
                        {r.leave_the_airport.explore_itinerary.stops.map((stop, i) => (
                          <div key={i} className={`flex gap-3 ${c.quoteBg} rounded-lg p-3`}>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-black ${c.pillActive}`}>
                              {i + 1}
                            </div>
                            <div>
                              <p className="text-xs font-bold">{stop.name}</p>
                              <p className={`text-xs ${c.textMuteded}`}>{stop.what}</p>
                              <div className="flex gap-3 mt-0.5">
                                <span className={`text-[10px] ${c.textMuteded}`}>⏱ {stop.time_needed}</span>
                                {stop.distance_from_previous && <span className={`text-[10px] ${c.textMuteded}`}>🚶 {stop.distance_from_previous}</span>}
                              </div>
                              {stop.tip && <p className={`text-[10px] italic ${c.skyText} mt-0.5`}>💡 {stop.tip}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {r.leave_the_airport.explore_itinerary.food_recommendation && (
                      <div className={`${c.success} border rounded-lg p-3`}>
                        <p className="text-xs">🍜 {r.leave_the_airport.explore_itinerary.food_recommendation}</p>
                      </div>
                    )}

                    {r.leave_the_airport.warnings?.length > 0 && (
                      <div className={`${c.warning} border rounded-lg p-3`}>
                        <p className={`text-[10px] font-bold ${c.warning} uppercase mb-1`}>⚠️ Warnings</p>
                        {r.leave_the_airport.warnings.map((w, i) => <p key={i} className="text-xs">• {w}</p>)}
                      </div>
                    )}
                  </div>
                </Section>
              )}

              {/* STAY IN AIRPORT */}
              {r.stay_in_airport && (
                <Section icon="🏢" title="Stay & Thrive" defaultOpen={r.verdict !== 'YES'} c={c}>
                  <div className="space-y-4">
                    {r.stay_in_airport.terminal_info && (
                      <p className={`text-xs ${c.textMuteded}`}>📍 {r.stay_in_airport.terminal_info}</p>
                    )}

                    {/* Food */}
                    {r.stay_in_airport.food?.length > 0 && (
                      <div>
                        <p className={`text-[10px] font-bold ${c.textSecondaryondary} uppercase mb-1.5`}>🍽️ Food</p>
                        <div className="space-y-1.5">
                          {r.stay_in_airport.food.map((f, i) => (
                            <div key={i} className={`${c.quoteBg} rounded-lg p-3`}>
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold">{f.name}</span>
                                <span className={`text-[10px] ${c.textMuteded}`}>{f.terminal} • {f.price_range}</span>
                              </div>
                              <p className={`text-xs ${c.textMuteded}`}>{f.type}</p>
                              {f.tip && <p className={`text-[10px] italic ${c.skyText}`}>💡 {f.tip}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Lounges summary */}
                    {r.stay_in_airport.lounges?.length > 0 && (
                      <div>
                        <p className={`text-[10px] font-bold ${c.textSecondaryondary} uppercase mb-1.5`}>🛋️ Lounges</p>
                        {r.stay_in_airport.lounges.map((l, i) => (
                          <div key={i} className={`${c.quoteBg} rounded-lg p-3 mb-1.5`}>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold">{l.name}</span>
                              <span className={`text-[10px] ${l.worth_it ? c.success : c.textMuteded}`}>
                                {l.worth_it ? '✓ Worth it' : '? Maybe'}
                              </span>
                            </div>
                            <p className={`text-xs ${c.textMuteded}`}>{l.access} • {l.terminal}</p>
                            {l.highlights && <p className={`text-[10px] ${c.text}`}>{l.highlights}</p>}
                          </div>
                        ))}
                        <button onClick={() => { setLoungeAirport(r.airport_code || airport); setView('lounge'); }}
                          className={`text-xs font-bold ${c.skyText} underline min-h-[28px]`}>See full lounge guide →</button>
                      </div>
                    )}

                    {/* Sleep, hidden gems, practical */}
                    {r.stay_in_airport.sleep_spots && (
                      <div className={`${c.quoteBg} rounded-lg p-3`}>
                        <p className={`text-[10px] font-bold ${c.textSecondaryondary} uppercase mb-1`}>😴 Rest spots</p>
                        <p className="text-xs">{r.stay_in_airport.sleep_spots}</p>
                      </div>
                    )}

                    {r.stay_in_airport.hidden_gems?.length > 0 && (
                      <div className={`${isDark ? 'bg-cyan-600/20 border-purple-800' : 'bg-cyan-600 border-purple-200'} border rounded-lg p-3`}>
                        <p className={`text-[10px] font-bold ${c.textSecondaryondary} uppercase mb-1`}>✨ Hidden gems</p>
                        {r.stay_in_airport.hidden_gems.map((g, i) => <p key={i} className="text-xs">• {g}</p>)}
                      </div>
                    )}

                    {r.stay_in_airport.practical && (
                      <div className="grid grid-cols-2 gap-2">
                        {r.stay_in_airport.practical.wifi && (
                          <div className={`${c.quoteBg} rounded-lg p-2`}>
                            <p className={`text-[10px] font-bold ${c.textSecondaryondary}`}>📶 WiFi</p>
                            <p className={`text-[10px] ${c.textMuteded}`}>{r.stay_in_airport.practical.wifi}</p>
                          </div>
                        )}
                        {r.stay_in_airport.practical.charging && (
                          <div className={`${c.quoteBg} rounded-lg p-2`}>
                            <p className={`text-[10px] font-bold ${c.textSecondaryondary}`}>🔌 Charging</p>
                            <p className={`text-[10px] ${c.textMuteded}`}>{r.stay_in_airport.practical.charging}</p>
                          </div>
                        )}
                        {r.stay_in_airport.practical.showers && (
                          <div className={`${c.quoteBg} rounded-lg p-2`}>
                            <p className={`text-[10px] font-bold ${c.textSecondaryondary}`}>🚿 Showers</p>
                            <p className={`text-[10px] ${c.textMuteded}`}>{r.stay_in_airport.practical.showers}</p>
                          </div>
                        )}
                        {r.stay_in_airport.practical.walking_path && (
                          <div className={`${c.quoteBg} rounded-lg p-2`}>
                            <p className={`text-[10px] font-bold ${c.textSecondaryondary}`}>🚶 Walking</p>
                            <p className={`text-[10px] ${c.textMuteded}`}>{r.stay_in_airport.practical.walking_path}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Section>
              )}

              {/* Pro tips */}
              {r.pro_tips?.length > 0 && (
                <Section icon="🧠" title="Pro Tips" c={c}>
                  <div className="space-y-2">
                    {r.pro_tips.map((tip, i) => <p key={i} className="text-xs">💡 {tip}</p>)}
                  </div>
                </Section>
              )}

              <ActionBar content={buildPlanText()} brandLine="— Generated by DeftBrain · deftbrain.com" />
            </div>
          );
        })()}
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════
  // RENDER: LOUNGE FINDER
  // ════════════════════════════════════════════════════════════
  const renderLounge = () => (
    <div className="space-y-4">
      <div className={`${c.card} ${c.border} border rounded-xl p-5`}>
        <h3 className={`text-sm font-bold ${c.text} mb-1`}>🛋️ Lounge Finder</h3>
        <p className={`text-xs ${c.textMuteded} mb-4`}>Every lounge at your airport. Which ones you can access and whether they're worth it.</p>

        <div className="space-y-3">
          <div>
            <label className={`text-xs font-bold ${c.textSecondaryondary} block mb-1.5`}>Airport *</label>
            <input value={loungeAirport} onChange={e => setLoungeAirport(e.target.value)}
              placeholder="Airport code or name"
              className={`w-full px-3 py-2 border rounded-lg text-xs ${c.input} outline-none focus:ring-2`} />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className={`text-xs font-bold ${c.textSecondaryondary} block mb-1.5`}>Terminal</label>
              <input value={loungeTerminal} onChange={e => setLoungeTerminal(e.target.value)}
                placeholder="Optional"
                className={`w-full px-2 py-1.5 border rounded-lg text-xs ${c.input} outline-none`} />
            </div>
            <div className="flex-1">
              <label className={`text-xs font-bold ${c.textSecondaryondary} block mb-1.5`}>Airline</label>
              <input value={loungeAirline} onChange={e => setLoungeAirline(e.target.value)}
                placeholder="Optional"
                className={`w-full px-2 py-1.5 border rounded-lg text-xs ${c.input} outline-none`} />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className={`text-xs font-bold ${c.textSecondaryondary} block mb-1.5`}>Credit cards (comma-separated)</label>
              <input value={loungeCards} onChange={e => setLoungeCards(e.target.value)}
                placeholder="e.g. Amex Platinum, Chase Sapphire"
                className={`w-full px-2 py-1.5 border rounded-lg text-xs ${c.input} outline-none`} />
            </div>
            <div className="flex-1">
              <label className={`text-xs font-bold ${c.textSecondaryondary} block mb-1.5`}>Airline status</label>
              <input value={loungeStatus} onChange={e => setLoungeStatus(e.target.value)}
                placeholder="e.g. Gold, Platinum"
                className={`w-full px-2 py-1.5 border rounded-lg text-xs ${c.input} outline-none`} />
            </div>
          </div>
          <button onClick={runLounge} disabled={loading || !loungeAirport.trim()}
            className={`w-full ${c.btnPrimaryPrimary} disabled:opacity-40 font-bold py-3 rounded-lg flex items-center justify-center gap-2 min-h-[48px]`}>
            {loading ? <><span className="animate-spin inline-block">{tool?.icon ?? '✈️'}</span> Searching...</> : <><span>{tool?.icon ?? '✈️'}</span> Find Lounges</>}
          </button>
        </div>
      </div>

      {loungeResults?.lounges?.length > 0 && (
        <div className="space-y-4">
          {/* Best picks */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {loungeResults.best_overall && (
              <div className={`${c.success} border rounded-lg p-3 text-center`}>
                <p className={`text-[10px] font-bold ${c.success} uppercase`}>🏆 Best Overall</p>
                <p className="text-xs font-bold mt-0.5">{loungeResults.best_overall}</p>
              </div>
            )}
            {loungeResults.best_value && (
              <div className={`${c.highlight} border rounded-lg p-3 text-center`}>
                <p className={`text-[10px] font-bold ${c.textSecondaryondary} uppercase`}>💰 Best Value</p>
                <p className="text-xs font-bold mt-0.5">{loungeResults.best_value}</p>
              </div>
            )}
            {loungeResults.best_for_sleep && (
              <div className={`${c.card} ${c.border} border rounded-lg p-3 text-center`}>
                <p className={`text-[10px] font-bold ${c.textSecondaryondary} uppercase`}>😴 Best for Sleep</p>
                <p className="text-xs font-bold mt-0.5">{loungeResults.best_for_sleep}</p>
              </div>
            )}
          </div>

          {/* Lounge cards */}
          {loungeResults.lounges.map((lounge, i) => (
            <Section key={i} icon="🛋️" title={lounge.name}
              badge={`${'⭐'.repeat(Math.min(Number(lounge.quality_rating) || 0, 5))}`}
              defaultOpen={i === 0} c={c}>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded ${c.badge} font-bold`}>{lounge.terminal}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded ${c.badge} font-bold`}>{lounge.network}</span>
                  {lounge.has_showers && <span className={`text-[10px] px-2 py-0.5 rounded ${c.success} font-bold`}>🚿 Showers</span>}
                  {lounge.has_sleeping && <span className={`text-[10px] px-2 py-0.5 rounded ${c.success} font-bold`}>😴 Sleep</span>}
                </div>

                {lounge.access_methods?.length > 0 && (
                  <div>
                    <p className={`text-[10px] font-bold ${c.textSecondaryondary} uppercase mb-1`}>Access</p>
                    {lounge.access_methods.map((am, ai) => (
                      <div key={ai} className="flex items-center gap-2 text-xs mb-0.5">
                        <span>{am.eligible ? '✅' : '❌'}</span>
                        <span className={am.eligible ? `font-bold ${c.text}` : c.textMuteded}>{am.method}</span>
                        <span className={c.textMuteded}>{am.cost}</span>
                      </div>
                    ))}
                  </div>
                )}

                {lounge.food_quality && <p className="text-xs">🍽️ {lounge.food_quality}</p>}
                {lounge.drinks && <p className="text-xs">🍷 {lounge.drinks}</p>}
                {lounge.crowding && <p className={`text-xs ${c.textMuteded}`}>👥 {lounge.crowding}</p>}
                {lounge.best_feature && <p className={`text-xs ${c.success}`}>✓ Best: {lounge.best_feature}</p>}
                {lounge.worst_feature && <p className={`text-xs ${c.danger}`}>✕ Worst: {lounge.worst_feature}</p>}
                {lounge.tip && <p className={`text-xs italic ${c.skyText}`}>💡 {lounge.tip}</p>}

                {lounge.day_pass_price && (
                  <div className={`${lounge.worth_day_pass ? c.success : c.warning} border rounded-lg p-2 text-center text-xs`}>
                    Day pass: {lounge.day_pass_price} — {lounge.worth_day_pass ? '✅ Worth it' : '⚠️ Think twice'}
                  </div>
                )}
              </div>
            </Section>
          ))}

          {loungeResults.no_lounge_alternative && (
            <div className={`${c.highlight} border rounded-lg p-3`}>
              <p className={`text-[10px] font-bold ${c.textSecondaryondary} uppercase mb-1`}>No lounge? Try this instead</p>
              <p className="text-xs">{loungeResults.no_lounge_alternative}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // ════════════════════════════════════════════════════════════
  // RENDER: RISK CALCULATOR
  // ════════════════════════════════════════════════════════════
  const renderRisk = () => {
    const RISK_COLORS = {
      'LOW': isDark ? 'bg-emerald-900/40 border-emerald-700' : 'bg-emerald-50 border-emerald-300',
      'MEDIUM': isDark ? 'bg-amber-900/40 border-amber-700' : 'bg-amber-50 border-amber-300',
      'HIGH': isDark ? 'bg-orange-900/40 border-orange-700' : 'bg-orange-50 border-orange-300',
      'CRITICAL': isDark ? 'bg-red-900/40 border-red-700' : 'bg-red-50 border-red-300',
    };

    return (
      <div className="space-y-4">
        <div className={`${c.card} ${c.border} border rounded-xl p-5`}>
          <h3 className={`text-sm font-bold ${c.text} mb-1`}>⚠️ Risk Calculator</h3>
          <p className={`text-xs ${c.textMuteded} mb-4`}>What happens if things go wrong? Delays, missed connections, worst-case scenarios.</p>

          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <label className={`text-xs font-bold ${c.textSecondaryondary} block mb-1.5`}>Airport *</label>
                <input value={riskAirport} onChange={e => setRiskAirport(e.target.value)}
                  placeholder="Airport code"
                  className={`w-full px-3 py-2 border rounded-lg text-xs ${c.input} outline-none focus:ring-2`} />
              </div>
              <div className="flex-1">
                <label className={`text-xs font-bold ${c.textSecondaryondary} block mb-1.5`}>Airline</label>
                <input value={riskAirline} onChange={e => setRiskAirline(e.target.value)}
                  placeholder="Optional"
                  className={`w-full px-2 py-1.5 border rounded-lg text-xs ${c.input} outline-none`} />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className={`text-xs font-bold ${c.textSecondaryondary} block mb-1.5`}>Layover hours</label>
                <input type="number" step="0.5" value={riskHours} onChange={e => setRiskHours(e.target.value)}
                  className={`w-full px-2 py-1.5 border rounded-lg text-xs ${c.input} outline-none`} />
              </div>
              <div className="flex-1">
                <label className={`text-xs font-bold ${c.textSecondaryondary} block mb-1.5`}>Current delay (min)</label>
                <input type="number" value={riskDelay} onChange={e => setRiskDelay(e.target.value)}
                  placeholder="0"
                  className={`w-full px-2 py-1.5 border rounded-lg text-xs ${c.input} outline-none`} />
              </div>
            </div>
            <div>
              <label className={`text-xs font-bold ${c.textSecondaryondary} block mb-1.5`}>What are you worried about?</label>
              <input value={riskScenario} onChange={e => setRiskScenario(e.target.value)}
                placeholder="e.g. My first flight is delayed 90 min, should I still try to leave the airport?"
                className={`w-full px-3 py-2 border rounded-lg text-xs ${c.input} outline-none focus:ring-2`} />
            </div>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input type="checkbox" checked={riskIntl} onChange={() => setRiskIntl(!riskIntl)} className="accent-sky-500" />
              <span className={c.text}>🌍 International connection</span>
            </label>
            <button onClick={runRisk} disabled={loading || !riskAirport.trim()}
              className={`w-full ${c.btnPrimaryPrimary} disabled:opacity-40 font-bold py-3 rounded-lg flex items-center justify-center gap-2 min-h-[48px]`}>
              {loading ? <><span className="animate-spin inline-block">{tool?.icon ?? '✈️'}</span> Calculating...</> : <><span>⚠️</span> Assess Risk</>}
            </button>
          </div>
        </div>

        {riskResults && (() => {
          const r = riskResults;
          return (
            <div className="space-y-4">
              {/* Risk verdict */}
              <div className={`border-2 rounded-xl p-5 text-center ${RISK_COLORS[r.risk_level] || c.card}`}>
                <p className="text-3xl mb-1">{r.risk_emoji}</p>
                <p className="text-xl font-black">Risk: {r.risk_level}</p>
                <p className="text-sm mt-1">{r.risk_summary}</p>
              </div>

              {/* If you miss it */}
              {r.if_you_miss_it && (
                <Section icon="😰" title="If You Miss Your Flight" defaultOpen c={c}>
                  <div className="space-y-2">
                    {r.if_you_miss_it.next_flight_likely && (
                      <div className={`${c.quoteBg} rounded-lg p-3`}>
                        <p className={`text-[10px] font-bold ${c.textSecondaryondary} uppercase mb-1`}>✈️ Next flight</p>
                        <p className="text-xs">{r.if_you_miss_it.next_flight_likely}</p>
                      </div>
                    )}
                    {r.if_you_miss_it.rebooking_policy && <p className="text-xs">📋 {r.if_you_miss_it.rebooking_policy}</p>}
                    {r.if_you_miss_it.hotel_situation && <p className="text-xs">🏨 {r.if_you_miss_it.hotel_situation}</p>}
                    {r.if_you_miss_it.estimated_cost && (
                      <div className={`${c.danger} border rounded-lg p-3 text-center`}>
                        <p className={`text-xs font-bold ${c.danger}`}>Potential cost: {r.if_you_miss_it.estimated_cost}</p>
                      </div>
                    )}
                  </div>
                </Section>
              )}

              {/* Delay cascade */}
              {r.delay_cascade && r.delay_cascade.adjusted_plan && (
                <Section icon="⏰" title="Delay Impact" c={c}>
                  <p className="text-xs mb-2">Buffer remaining: <strong>{r.delay_cascade.current_buffer}</strong></p>
                  <p className={`text-xs ${r.delay_cascade.still_feasible ? c.success : c.danger} font-bold`}>
                    {r.delay_cascade.still_feasible ? '✅ Still feasible' : '❌ Plan is no longer safe'}
                  </p>
                  <p className="text-xs mt-1">{r.delay_cascade.adjusted_plan}</p>
                  {r.delay_cascade.when_to_worry && (
                    <p className={`text-xs ${c.warning} mt-1`}>⚠️ Worry point: {r.delay_cascade.when_to_worry}</p>
                  )}
                </Section>
              )}

              {/* Mitigation */}
              {r.mitigation?.length > 0 && (
                <Section icon="🛡️" title="What You Can Do" c={c}>
                  <div className="space-y-2">
                    {r.mitigation.map((m, i) => (
                      <div key={i} className={`${c.quoteBg} rounded-lg p-3`}>
                        <p className="text-xs font-bold">{m.action}</p>
                        <p className={`text-[10px] ${c.textMuteded}`}>{m.why}</p>
                        {m.when && <p className={`text-[10px] ${c.skyText}`}>⏰ {m.when}</p>}
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Worst case */}
              {r.worst_case_timeline && (
                <div className={`${c.danger} border rounded-xl p-4`}>
                  <p className={`text-[10px] font-bold ${c.danger} uppercase mb-1`}>☠️ Worst case scenario</p>
                  <p className="text-xs">{r.worst_case_timeline}</p>
                </div>
              )}

              {/* Gamble verdict */}
              {r.gamble_verdict && (
                <div className={`${c.card} ${c.border} border-2 rounded-xl p-4`}>
                  <p className={`text-[10px] font-bold ${c.textSecondaryondary} uppercase mb-1`}>🎲 The verdict</p>
                  <p className="text-sm font-bold">{r.gamble_verdict}</p>
                </div>
              )}
            </div>
          );
        })()}
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════
  // RENDER: SAVED LAYOVERS
  // ════════════════════════════════════════════════════════════
  const renderSaved = () => (
    <div className="space-y-4">
      <div className={`${c.card} ${c.border} border rounded-xl p-5`}>
        <h3 className={`text-sm font-bold ${c.text} mb-1`}>📌 Saved Layovers</h3>
        <p className={`text-xs ${c.textMuteded} mb-4`}>Your layover history. Tap any to reload that airport.</p>

        {savedLayovers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-2xl mb-2">📌</p>
            <p className={`text-xs ${c.textMuteded}`}>No saved layovers yet. Analyze a layover and hit Save.</p>
            <button onClick={() => setView('plan')} className={`${c.btnPrimaryPrimary} px-4 py-2 rounded-lg text-xs font-bold mt-3 min-h-[36px]`}>✈️ Plan a Layover</button>
          </div>
        ) : (
          <div className="space-y-2">
            {savedLayovers.map(lay => {
              const verdictColor = lay.verdict === 'YES' ? c.success : lay.verdict === 'NO' ? c.danger : c.warning;
              return (
                <div key={lay.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border ${c.card} ${c.border}`}>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded ${verdictColor}`}>{lay.verdict}</span>
                  <button onClick={() => { setAirport(lay.airport); setLayoverHours(String(lay.hours)); setView('plan'); }}
                    className={`flex-1 text-left min-h-[28px]`}>
                    <span className={`text-xs font-bold ${c.text}`}>{lay.airportName || lay.airport}</span>
                    <span className={`text-xs ${c.textMuteded} ml-2`}>{lay.hours}h</span>
                    {lay.city && <span className={`text-xs ${c.textMuteded} ml-1`}>• {lay.city}</span>}
                  </button>
                  <span className={`text-[10px] ${c.textMuteded}`}>{new Date(lay.date).toLocaleDateString()}</span>
                  <button onClick={() => removeSaved(lay.id)} className={`text-xs ${c.danger} min-h-[24px]`}>✕</button>
                </div>
              );
            })}
            <button onClick={() => {
              if (window.confirm('Clear all saved layovers?')) {
                setSavedLayovers([]);
                saveStore(STORE_LAYOVERS, [], MAX_SAVED);
              }
            }} className={`text-xs ${c.danger} min-h-[28px]`}>🗑️ Clear all</button>
          </div>
        )}
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════
  // RENDER: GATE-TO-GATE
  // ════════════════════════════════════════════════════════════
  const renderGateToGate = () => {
    const DIFF_COLORS = {
      EASY: isDark ? 'bg-emerald-900/40 border-emerald-700 text-emerald-200' : 'bg-emerald-50 border-emerald-300 text-emerald-800',
      MODERATE: isDark ? 'bg-amber-900/40 border-amber-700 text-amber-200' : 'bg-amber-50 border-amber-300 text-amber-800',
      TIGHT: isDark ? 'bg-orange-900/40 border-orange-700 text-orange-200' : 'bg-orange-50 border-orange-300 text-orange-800',
      DANGEROUS: isDark ? 'bg-red-900/40 border-red-700 text-red-200' : 'bg-red-50 border-red-300 text-red-800',
    };
    return (
      <div className="space-y-4">
        <div className={`${c.card} ${c.border} border rounded-xl p-5`}>
          <h3 className={`text-sm font-bold ${c.text} mb-1`}>🚶 Gate-to-Gate Navigator</h3>
          <p className={`text-xs ${c.textMuteded} mb-4`}>How to get between terminals/gates. Step-by-step, with time estimates.</p>
          <div className="space-y-3">
            <div>
              <label className={`text-xs font-bold ${c.textSecondaryondary} block mb-1.5`}>Airport *</label>
              <input value={g2gAirport} onChange={e => setG2gAirport(e.target.value)} placeholder="Airport code or name"
                className={`w-full px-3 py-2 border rounded-lg text-xs ${c.input} outline-none focus:ring-2`} />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className={`text-xs font-bold ${c.textSecondaryondary} block mb-1.5`}>Arriving at (gate/terminal)</label>
                <input value={g2gArrival} onChange={e => setG2gArrival(e.target.value)} placeholder="e.g. Gate B22, Terminal 1"
                  className={`w-full px-2 py-1.5 border rounded-lg text-xs ${c.input} outline-none`} />
              </div>
              <div className="flex-1">
                <label className={`text-xs font-bold ${c.textSecondaryondary} block mb-1.5`}>Departing from (gate/terminal)</label>
                <input value={g2gDeparture} onChange={e => setG2gDeparture(e.target.value)} placeholder="e.g. Gate E15, Terminal 4"
                  className={`w-full px-2 py-1.5 border rounded-lg text-xs ${c.input} outline-none`} />
              </div>
            </div>
            <div>
              <label className={`text-xs font-bold ${c.textSecondaryondary} block mb-1.5`}>Minutes available</label>
              <input type="number" value={g2gMinutes} onChange={e => setG2gMinutes(e.target.value)} placeholder="Optional"
                className={`w-32 px-2 py-1.5 border rounded-lg text-xs ${c.input} outline-none`} />
            </div>
            <button onClick={runGateToGate} disabled={loading || !g2gAirport.trim()}
              className={`w-full ${c.btnPrimaryPrimary} disabled:opacity-40 font-bold py-3 rounded-lg flex items-center justify-center gap-2 min-h-[48px]`}>
              {loading ? <><span className="animate-spin inline-block">{tool?.icon ?? '✈️'}</span> Routing...</> : <><span>🚶</span> Get Directions</>}
            </button>
          </div>
        </div>

        {g2gResults && (() => {
          const r = g2gResults;
          return (
            <div className="space-y-4">
              <div className={`border-2 rounded-xl p-5 text-center ${DIFF_COLORS[r.difficulty] || c.card}`}>
                <p className="text-3xl mb-1">{r.difficulty_emoji}</p>
                <p className="text-lg font-black">{r.difficulty} — {r.total_estimated_minutes} minutes</p>
                {r.requires_security_recheck && <p className={`text-xs font-bold ${c.danger} mt-1`}>⚠️ Requires security re-screening</p>}
                {r.feasibility && <p className="text-sm mt-2">{r.feasibility}</p>}
              </div>

              {r.fastest_route && (
                <div className={`${c.highlight} border rounded-lg p-3`}>
                  <p className={`text-[10px] font-bold ${c.textSecondaryondary} uppercase mb-1`}>🏃 Fastest route</p>
                  <p className="text-xs">{r.fastest_route}</p>
                </div>
              )}

              {r.steps?.length > 0 && (
                <div className={`${c.card} ${c.border} border rounded-xl p-4`}>
                  <p className={`text-[10px] font-bold ${c.textSecondaryondary} uppercase mb-3`}>Step by step</p>
                  <div className="space-y-2">
                    {r.steps.map((step, i) => (
                      <div key={i} className="flex gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-black ${c.pillActive}`}>{step.step || i + 1}</div>
                        <div className="flex-1">
                          <p className="text-xs">{step.instruction}</p>
                          <div className="flex gap-2 mt-0.5">
                            <span className={`text-[10px] ${c.textMuteded}`}>⏱ {step.time_minutes}min</span>
                            {step.tip && <span className={`text-[10px] italic ${c.skyText}`}>💡 {step.tip}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {r.shuttle_or_train?.available && (
                <div className={`${c.success} border rounded-lg p-3`}>
                  <p className="text-xs font-bold">🚃 {r.shuttle_or_train.name}</p>
                  <p className={`text-xs ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
                    Every {r.shuttle_or_train.frequency} • {r.shuttle_or_train.travel_time}
                  </p>
                  {r.shuttle_or_train.where_to_catch && <p className={`text-[10px] ${c.textMuteded}`}>📍 {r.shuttle_or_train.where_to_catch}</p>}
                </div>
              )}

              {r.security_info && <p className={`text-xs ${c.textMuteded}`}>🛡️ {r.security_info}</p>}

              {r.tight_connection_tips?.length > 0 && (
                <div className={`${c.warning} border rounded-lg p-3`}>
                  <p className={`text-[10px] font-bold ${c.warning} uppercase mb-1`}>⚡ Tight connection tips</p>
                  {r.tight_connection_tips.map((t, i) => <p key={i} className="text-xs">• {t}</p>)}
                </div>
              )}
            </div>
          );
        })()}
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════
  // RENDER: DELAY TRACKER
  // ════════════════════════════════════════════════════════════
  const renderDelay = () => {
    const thresholds = results?.time_math ? [
      { delay: 30, available: results.time_math.available_city_minutes - 30 },
      { delay: 60, available: results.time_math.available_city_minutes - 60 },
      { delay: 90, available: results.time_math.available_city_minutes - 90 },
      { delay: 120, available: results.time_math.available_city_minutes - 120 },
    ].filter(t => t.available > -60) : [];

    return (
      <div className="space-y-4">
        <div className={`${c.card} ${c.border} border rounded-xl p-5`}>
          <h3 className={`text-sm font-bold ${c.text} mb-1`}>⏰ Delay Tracker</h3>
          <p className={`text-xs ${c.textMuteded} mb-4`}>Your flight is delayed. Does your layover plan still work?</p>

          {!results ? (
            <div className="text-center py-8">
              <p className="text-2xl mb-2">⏰</p>
              <p className={`text-xs ${c.textMuteded}`}>Run a layover analysis first to enable the delay tracker.</p>
              <button onClick={() => setView('plan')} className={`${c.btnPrimaryPrimary} px-4 py-2 rounded-lg text-xs font-bold mt-3 min-h-[36px]`}>✈️ Plan First</button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className={`${c.quoteBg} rounded-lg p-3`}>
                <p className={`text-xs ${c.textMuteded}`}>Current plan: <strong>{results.airport_name}</strong> — {results.verdict_emoji} {results.verdict}</p>
                <p className={`text-xs ${c.textMuteded}`}>Available time: <strong>{Math.floor(results.time_math.available_city_minutes / 60)}h {results.time_math.available_city_minutes % 60}m</strong></p>
              </div>

              <div>
                <label className={`text-xs font-bold ${c.textSecondaryondary} block mb-1.5`}>How many minutes delayed?</label>
                <input type="number" value={delayMinutes} onChange={e => setDelayMinutes(e.target.value)}
                  placeholder="e.g. 45"
                  className={`w-full px-3 py-2 border rounded-lg text-xs ${c.input} outline-none focus:ring-2`} />
              </div>

              {/* Live impact */}
              {delayImpact && (
                <div className={`border-2 rounded-xl p-5 text-center ${
                  delayImpact.newVerdict === 'YES' ? (isDark ? 'bg-emerald-900/40 border-emerald-700' : 'bg-emerald-50 border-emerald-300')
                  : delayImpact.newVerdict === 'RISKY' ? (isDark ? 'bg-amber-900/40 border-amber-700' : 'bg-amber-50 border-amber-300')
                  : (isDark ? 'bg-red-900/40 border-red-700' : 'bg-red-50 border-red-300')
                }`}>
                  {delayImpact.changed ? (
                    <>
                      <p className="text-sm font-bold mb-1">Verdict changed: {delayImpact.originalVerdict} → {delayImpact.newVerdict}</p>
                      <p className="text-2xl font-black">
                        {delayImpact.newMinutes > 0
                          ? `${Math.floor(delayImpact.newMinutes / 60)}h ${delayImpact.newMinutes % 60}m remaining`
                          : 'No time left — go to your gate'}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-bold mb-1">Still {delayImpact.newVerdict}</p>
                      <p className="text-2xl font-black">
                        {Math.floor(delayImpact.newMinutes / 60)}h {delayImpact.newMinutes % 60}m remaining
                      </p>
                      <p className={`text-xs ${c.textMuteded} mt-1`}>Lost {delayImpact.lost}min but plan still works</p>
                    </>
                  )}
                </div>
              )}

              {/* Threshold scale */}
              {thresholds.length > 0 && (
                <div className={`${c.card} ${c.border} border rounded-xl p-4`}>
                  <p className={`text-[10px] font-bold ${c.textSecondaryondary} uppercase mb-3`}>Delay impact scale</p>
                  <div className="space-y-2">
                    {thresholds.map((t, i) => {
                      const verdict = t.available < 30 ? 'NO' : t.available < 90 ? 'RISKY' : 'YES';
                      const active = delayMinutes && Number(delayMinutes) >= t.delay && (i === thresholds.length - 1 || Number(delayMinutes) < thresholds[i + 1]?.delay);
                      return (
                        <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-lg ${active ? (isDark ? 'bg-sky-900/30 border border-sky-700' : 'bg-sky-50 border border-sky-200') : ''}`}>
                          <span className={`text-xs font-bold w-14 ${c.textMuteded}`}>{t.delay}min</span>
                          <div className={`flex-1 h-2 rounded ${isDark ? 'bg-zinc-700' : 'bg-slate-200'}`}>
                            <div className={`h-full rounded transition-all ${
                              verdict === 'YES' ? 'bg-emerald-500' : verdict === 'RISKY' ? 'bg-amber-500' : 'bg-red-500'
                            }`} style={{ width: `${Math.max(0, Math.min(100, t.available / results.time_math.available_city_minutes * 100))}%` }} />
                          </div>
                          <span className={`text-xs font-bold ${verdict === 'YES' ? c.success : verdict === 'RISKY' ? c.warning : c.danger}`}>
                            {t.available > 0 ? `${Math.floor(t.available / 60)}h${t.available % 60}m` : '—'}
                          </span>
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                            verdict === 'YES' ? c.success : verdict === 'RISKY' ? c.warning : c.danger
                          }`}>{verdict}</span>
                        </div>
                      );
                    })}
                  </div>
                  <p className={`text-[10px] ${c.textMuteded} mt-2`}>
                    {thresholds.find(t => t.available < 30)
                      ? `At ${thresholds.find(t => t.available < 30).delay}min delay: abandon exploration plan.`
                      : 'Your layover can absorb up to 2 hours of delay.'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════
  // RENDER: COMPARE
  // ════════════════════════════════════════════════════════════
  const renderCompare = () => (
    <div className="space-y-4">
      <div className={`${c.card} ${c.border} border rounded-xl p-5`}>
        <h3 className={`text-sm font-bold ${c.text} mb-1`}>⚖️ Layover Comparison</h3>
        <p className={`text-xs ${c.textMuteded} mb-4`}>Choosing between connections? Compare layover quality side-by-side.</p>
        <div className="space-y-3">
          {cmpOptions.map((opt, i) => (
            <div key={i} className={`flex gap-2 p-3 rounded-lg border ${c.card} ${c.border}`}>
              <span className={`text-xs font-black ${c.skyText} mt-2`}>#{i + 1}</span>
              <input value={opt.airport} onChange={e => {
                const up = [...cmpOptions]; up[i] = { ...up[i], airport: e.target.value }; setCmpOptions(up);
              }} placeholder="Airport (e.g. FRA)"
                className={`flex-1 min-w-[80px] px-2 py-1.5 border rounded-lg text-xs ${c.input} outline-none`} />
              <input type="number" step="0.5" value={opt.hours} onChange={e => {
                const up = [...cmpOptions]; up[i] = { ...up[i], hours: e.target.value }; setCmpOptions(up);
              }} placeholder="Hours"
                className={`w-20 px-2 py-1.5 border rounded-lg text-xs ${c.input} outline-none`} />
              <input value={opt.notes} onChange={e => {
                const up = [...cmpOptions]; up[i] = { ...up[i], notes: e.target.value }; setCmpOptions(up);
              }} placeholder="Notes (optional)"
                className={`flex-1 px-2 py-1.5 border rounded-lg text-xs ${c.input} outline-none`} />
              {cmpOptions.length > 2 && (
                <button onClick={() => setCmpOptions(cmpOptions.filter((_, idx) => idx !== i))}
                  className={`text-xs ${c.danger} min-h-[28px]`}>✕</button>
              )}
            </div>
          ))}
          {cmpOptions.length < 4 && (
            <button onClick={() => setCmpOptions([...cmpOptions, { airport: '', hours: '', notes: '' }])}
              className={`${c.btnPrimarySecondaryondary} font-bold py-1.5 px-3 rounded-lg text-xs min-h-[32px]`}>➕ Add option</button>
          )}
          <button onClick={runCompare} disabled={loading || cmpOptions.filter(o => o.airport.trim() && o.hours).length < 2}
            className={`w-full ${c.btnPrimaryPrimary} disabled:opacity-40 font-bold py-3 rounded-lg flex items-center justify-center gap-2 min-h-[48px]`}>
            {loading ? <><span className="animate-spin inline-block">{tool?.icon ?? '✈️'}</span> Comparing...</> : <><span>⚖️</span> Compare Layovers</>}
          </button>
        </div>
      </div>

      {cmpResults && (
        <div className="space-y-4">
          {/* Winner */}
          {cmpResults.winner && (
            <div className={`${c.success} border-2 rounded-xl p-5 text-center`}>
              <p className="text-2xl mb-1">🏆</p>
              <p className={`text-lg font-black ${c.success}`}>{cmpResults.winner} wins</p>
              <p className="text-sm mt-1">{cmpResults.winner_reason}</p>
              {cmpResults.runner_up_case && <p className={`text-xs ${c.textMuteded} mt-2 italic`}>But: {cmpResults.runner_up_case}</p>}
            </div>
          )}

          {/* Side-by-side */}
          {cmpResults.options?.length > 0 && (
            <div className={`grid grid-cols-1 ${cmpResults.options.length === 2 ? 'sm:grid-cols-2' : cmpResults.options.length === 3 ? 'sm:grid-cols-3' : ''} gap-3`}>
              {cmpResults.options.map((opt, i) => {
                const isWinner = opt.airport === cmpResults.winner;
                return (
                  <div key={i} className={`${c.card} ${c.border} border rounded-xl p-4 ${isWinner ? (isDark ? 'border-emerald-600' : 'border-emerald-400') : ''}`}>
                    <div className="flex items-center gap-2 mb-3">
                      {isWinner && <span className="text-sm">🏆</span>}
                      <span className={`text-sm font-black ${c.text}`}>{opt.airport_name || opt.airport}</span>
                      <span className={`text-xs ${c.textMuteded}`}>{opt.hours}h</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className={c.textMuteded}>Can leave?</span>
                        <span className={`font-bold ${opt.can_leave ? c.success : c.danger}`}>{opt.leave_verdict}</span>
                      </div>
                      {opt.city_time_minutes > 0 && (
                        <div className="flex items-center justify-between text-xs">
                          <span className={c.textMuteded}>City time</span>
                          <span className="font-bold">{Math.floor(opt.city_time_minutes / 60)}h{opt.city_time_minutes % 60}m</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-xs">
                        <span className={c.textMuteded}>Airport</span>
                        <span>{'⭐'.repeat(Math.min(Number(opt.airport_rating) || 0, 5))}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className={c.textMuteded}>Food</span>
                        <span>{'⭐'.repeat(Math.min(Number(opt.food_rating) || 0, 5))}</span>
                      </div>
                      {opt.best_thing && <p className={`text-[10px] ${c.success}`}>✓ {opt.best_thing}</p>}
                      {opt.worst_thing && <p className={`text-[10px] ${c.danger}`}>✕ {opt.worst_thing}</p>}
                      {opt.explore_highlight && <p className={`text-[10px] ${c.textMuteded}`}>🌍 {opt.explore_highlight}</p>}
                      <div className="text-center pt-2">
                        <span className={`text-lg font-black ${c.skyText}`}>{opt.overall_score}</span>
                        <span className={`text-[10px] ${c.textMuteded}`}>/100</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {cmpResults.travel_hack && (
            <div className={`${isDark ? 'bg-cyan-600/20 border-purple-800' : 'bg-cyan-600 border-purple-200'} border rounded-lg p-3`}>
              <p className="text-xs font-bold">🧳 Travel hack: {cmpResults.travel_hack}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // ════════════════════════════════════════════════════════════
  // RENDER: PACKING
  // ════════════════════════════════════════════════════════════
  const renderPacking = () => (
    <div className="space-y-4">
      <div className={`${c.card} ${c.border} border rounded-xl p-5`}>
        <h3 className={`text-sm font-bold ${c.text} mb-1`}>🎒 Layover Packing List</h3>
        <p className={`text-xs ${c.textMuteded} mb-4`}>
          {results ? `Based on your ${results.airport_name} layover. What to grab from your bag before deplaning.`
            : 'Run a layover analysis first to get a personalized packing list.'}
        </p>

        {!results ? (
          <div className="text-center py-6">
            <button onClick={() => setView('plan')} className={`${c.btnPrimaryPrimary} px-4 py-2 rounded-lg text-xs font-bold min-h-[36px]`}>✈️ Plan a Layover First</button>
          </div>
        ) : (
          <button onClick={runPacking} disabled={loading}
            className={`w-full ${c.btnPrimaryPrimary} disabled:opacity-40 font-bold py-3 rounded-lg flex items-center justify-center gap-2 min-h-[48px]`}>
            {loading ? <><span className="animate-spin inline-block">{tool?.icon ?? '✈️'}</span> Building list...</> : <><span>🎒</span> Generate Packing List</>}
          </button>
        )}
      </div>

      {packResults && (
        <div className="space-y-4">
          {/* Grab list */}
          <div className={`${c.card} ${c.border} border rounded-xl p-5`}>
            <p className={`text-[10px] font-bold ${c.textSecondaryondary} uppercase mb-3`}>🎒 Grab before deplaning</p>
            <div className="space-y-2">
              {(packResults.grab_before_deplaning || []).map((item, i) => (
                <div key={i} className={`flex items-start gap-2 text-xs px-3 py-2 rounded-lg ${
                  item.priority === 'essential' ? (isDark ? 'bg-red-900/20' : 'bg-red-50')
                  : item.priority === 'recommended' ? (isDark ? 'bg-amber-900/20' : 'bg-amber-50')
                  : c.quoteBg
                }`}>
                  <span className="flex-shrink-0 mt-0.5">{item.priority === 'essential' ? '🔴' : item.priority === 'recommended' ? '🟡' : '🟢'}</span>
                  <div>
                    <p className="font-bold">{item.item}</p>
                    <p className={c.textMuteded}>{item.why}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Context cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {packResults.weather_note && (
              <div className={`${c.quoteBg} rounded-lg p-3`}>
                <p className={`text-[10px] font-bold ${c.textSecondaryondary}`}>🌤️ Weather</p>
                <p className={`text-xs ${c.textMuteded}`}>{packResults.weather_note}</p>
              </div>
            )}
            {packResults.currency_tip && (
              <div className={`${c.quoteBg} rounded-lg p-3`}>
                <p className={`text-[10px] font-bold ${c.textSecondaryondary}`}>💰 Currency</p>
                <p className={`text-xs ${c.textMuteded}`}>{packResults.currency_tip}</p>
              </div>
            )}
            {packResults.phone_tip && (
              <div className={`${c.quoteBg} rounded-lg p-3`}>
                <p className={`text-[10px] font-bold ${c.textSecondaryondary}`}>📱 Phone</p>
                <p className={`text-xs ${c.textMuteded}`}>{packResults.phone_tip}</p>
              </div>
            )}
            {packResults.cultural_note && (
              <div className={`${c.quoteBg} rounded-lg p-3`}>
                <p className={`text-[10px] font-bold ${c.textSecondaryondary}`}>🌍 Culture</p>
                <p className={`text-xs ${c.textMuteded}`}>{packResults.cultural_note}</p>
              </div>
            )}
          </div>

          {packResults.pro_tip && (
            <div className={`${c.highlight} border rounded-lg p-3`}>
              <p className="text-xs">💡 {packResults.pro_tip}</p>
            </div>
          )}

          <CopyBtn label="Copy packing list" content={
            `LAYOVER PACKING LIST — ${packResults.airport}\n\n` +
            (packResults.grab_before_deplaning || []).map(i =>
              `${i.priority === 'essential' ? '🔴' : i.priority === 'recommended' ? '🟡' : '🟢'} ${i.item} — ${i.why}`
            ).join('\n') +
            (packResults.weather_note ? `\n\n🌤️ ${packResults.weather_note}` : '') +
            (packResults.currency_tip ? `\n💰 ${packResults.currency_tip}` : '') +
            '\n\n— Generated by DeftBrain · deftbrain.com'
          } />
        </div>
      )}
    </div>
  );

  // ════════════════════════════════════════════════════════════
  // RENDER: SURVIVAL KIT
  // ════════════════════════════════════════════════════════════
  const renderSurvivalKit = () => (
    <div className="space-y-4">
      <div className={`${c.card} ${c.border} border rounded-xl p-5`}>
        <h3 className={`text-sm font-bold ${c.text} mb-1`}>🧰 Airport Survival Kit</h3>
        <p className={`text-xs ${c.textMuteded} mb-4`}>Everything you need when you land — screenshot this before you lose WiFi.</p>
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className={`text-xs font-bold ${c.textSecondaryondary} block mb-1.5`}>Airport *</label>
              <input value={kitAirport || results?.airport_code || ''} onChange={e => setKitAirport(e.target.value)}
                placeholder="Airport code" className={`w-full px-3 py-2 border rounded-lg text-xs ${c.input} outline-none focus:ring-2`} />
            </div>
            <div className="flex-1">
              <label className={`text-xs font-bold ${c.textSecondaryondary} block mb-1.5`}>Airline</label>
              <input value={kitAirline} onChange={e => setKitAirline(e.target.value)}
                placeholder="Optional" className={`w-full px-2 py-1.5 border rounded-lg text-xs ${c.input} outline-none`} />
            </div>
            <div className="flex-1">
              <label className={`text-xs font-bold ${c.textSecondaryondary} block mb-1.5`}>Hours</label>
              <input type="number" value={kitHours || layoverHours || ''} onChange={e => setKitHours(e.target.value)}
                className={`w-full px-2 py-1.5 border rounded-lg text-xs ${c.input} outline-none`} />
            </div>
          </div>
          <button onClick={runSurvivalKit} disabled={loading || !(kitAirport.trim() || results?.airport_code || airport.trim())}
            className={`w-full ${c.btnPrimaryPrimary} disabled:opacity-40 font-bold py-3 rounded-lg flex items-center justify-center gap-2 min-h-[48px]`}>
            {loading ? <><span className="animate-spin inline-block">{tool?.icon ?? '✈️'}</span> Building kit...</> : <><span>🧰</span> Generate Survival Kit</>}
          </button>
        </div>
      </div>

      {kitResults && (() => {
        const r = kitResults;
        return (
          <div className="space-y-3">
            <div className={`${c.card} ${c.border} border rounded-xl p-5`}>
              <h3 className={`text-sm font-black ${c.text} text-center mb-4`}>🧰 {r.airport_name || r.airport}</h3>

              {/* WiFi */}
              {r.wifi && (
                <div className={`${c.highlight} border rounded-lg p-3 mb-3`}>
                  <p className={`text-[10px] font-bold ${c.textSecondaryondary} uppercase mb-1`}>📶 WiFi</p>
                  <p className="text-xs font-bold">{r.wifi.network_name}</p>
                  {r.wifi.password && <p className={`text-xs ${c.textMuteded}`}>Password: {r.wifi.password}</p>}
                  {r.wifi.how_to_connect && <p className={`text-[10px] ${c.textMuteded}`}>{r.wifi.how_to_connect}</p>}
                </div>
              )}

              {/* Grid of essentials */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                {r.time_zone && (
                  <div className={`${c.quoteBg} rounded-lg p-2`}>
                    <p className={`text-[10px] font-bold ${c.textSecondaryondary}`}>🕐 Time Zone</p>
                    <p className="text-xs">{r.time_zone}</p>
                  </div>
                )}
                {r.currency && (
                  <div className={`${c.quoteBg} rounded-lg p-2`}>
                    <p className={`text-[10px] font-bold ${c.textSecondaryondary}`}>💰 Currency</p>
                    <p className="text-xs">{r.currency.local_currency}</p>
                    {r.currency.exchange_rate_approx && <p className={`text-[10px] ${c.textMuteded}`}>{r.currency.exchange_rate_approx}</p>}
                  </div>
                )}
                {r.power_outlets && (
                  <div className={`${c.quoteBg} rounded-lg p-2`}>
                    <p className={`text-[10px] font-bold ${c.textSecondaryondary}`}>🔌 Outlets</p>
                    <p className="text-xs">{r.power_outlets}</p>
                  </div>
                )}
                {r.emergency_numbers && (
                  <div className={`${c.quoteBg} rounded-lg p-2`}>
                    <p className={`text-[10px] font-bold ${c.textSecondaryondary}`}>🆘 Emergency</p>
                    <p className="text-xs">{r.emergency_numbers.local_emergency}</p>
                  </div>
                )}
              </div>

              {r.airline_desk && (
                <div className={`${c.quoteBg} rounded-lg p-3 mb-3`}>
                  <p className={`text-[10px] font-bold ${c.textSecondaryondary}`}>✈️ Airline Desk</p>
                  <p className="text-xs">{r.airline_desk}</p>
                </div>
              )}

              {r.transport_from_airport && (
                <div className={`${c.quoteBg} rounded-lg p-3 mb-3`}>
                  <p className={`text-[10px] font-bold ${c.textSecondaryondary}`}>🚇 Getting to the City</p>
                  <p className="text-xs">{r.transport_from_airport.to_city}</p>
                  {r.transport_from_airport.taxi_tip && <p className={`text-[10px] ${c.warning}`}>⚠️ {r.transport_from_airport.taxi_tip}</p>}
                </div>
              )}

              {/* Key phrases */}
              {r.key_phrases?.length > 0 && (
                <div className="mb-3">
                  <p className={`text-[10px] font-bold ${c.textSecondaryondary} uppercase mb-1.5`}>🗣️ Key Phrases</p>
                  <div className="space-y-1">
                    {r.key_phrases.map((p, i) => (
                      <div key={i} className={`${c.quoteBg} rounded px-3 py-1.5 flex items-center justify-between text-xs`}>
                        <span className={c.textMuteded}>{p.english}</span>
                        <span className="font-bold">{p.local}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {r.one_thing_to_know && (
                <div className={`${isDark ? 'bg-cyan-600/20 border-purple-800' : 'bg-cyan-600 border-purple-200'} border rounded-lg p-3`}>
                  <p className={`text-[10px] font-bold ${c.textSecondaryondary} uppercase mb-1`}>☝️ One thing to know</p>
                  <p className="text-xs font-bold">{r.one_thing_to_know}</p>
                </div>
              )}
            </div>

            <ActionBar content={
              `🧰 SURVIVAL KIT — ${r.airport_name || r.airport}\n\n` +
              (r.wifi ? `📶 WiFi: ${r.wifi.network_name}${r.wifi.password ? ` (${r.wifi.password})` : ''}\n` : '') +
              (r.time_zone ? `🕐 ${r.time_zone}\n` : '') +
              (r.currency ? `💰 ${r.currency.local_currency} (${r.currency.exchange_rate_approx || ''})\n` : '') +
              (r.power_outlets ? `🔌 ${r.power_outlets}\n` : '') +
              (r.emergency_numbers ? `🆘 Emergency: ${r.emergency_numbers.local_emergency}\n` : '') +
              (r.transport_from_airport ? `\n🚇 To city: ${r.transport_from_airport.to_city}\n` : '') +
              (r.key_phrases?.length ? `\n🗣️ Phrases:\n${r.key_phrases.map(p => `${p.english} → ${p.local}`).join('\n')}\n` : '') +
              (r.one_thing_to_know ? `\n☝️ ${r.one_thing_to_know}\n` : '') +
              '\n— Generated by DeftBrain · deftbrain.com'
            } brandLine="— Generated by DeftBrain · deftbrain.com" />
          </div>
        );
      })()}
    </div>
  );

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

      {view === 'plan' && renderPlan()}
      {view === 'gate' && renderGateToGate()}
      {view === 'delay' && renderDelay()}
      {view === 'compare' && renderCompare()}
      {view === 'lounge' && renderLounge()}
      {view === 'packing' && renderPacking()}
      {view === 'kit' && renderSurvivalKit()}
      {view === 'risk' && renderRisk()}
      {view === 'saved' && renderSaved()}
        <div className={`mt-6 pt-4 border-t text-sm ${c.border} ${c.textMuteded}`}>
          <p className="mb-2 font-medium">You might also like:</p>
          <div className="flex flex-wrap gap-2">
            {[{slug:'micro-adventure-mapper',label:'🗺️ Micro Adventure Mapper'},{slug:'date-night',label:'🌙 Date Night'},{slug:'where-did-it-go',label:'💸 Where Did It Go'}].map(({slug,label})=>(
              <a key={slug} href={`/tool/${slug}`} className={linkStyle}>{label}</a>
            ))}
          </div>
        </div>
    </div>
  );
};

LayoverMaximizer.displayName = 'LayoverMaximizer';
export default LayoverMaximizer;
