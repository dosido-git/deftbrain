import React, { useState, useCallback, useRef } from 'react';
import { Loader2, AlertCircle, MapPin, Clock, Calendar, Sparkles, RefreshCw, Copy, Check, Printer, ChevronDown, ChevronUp, X, Compass, Footprints, CloudRain, ArrowRight, Plus, Backpack, BookOpen, Trash2, RotateCcw } from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';
import { usePersistentState } from '../hooks/usePersistentState';

// ════════════════════════════════════════════════════════════
// THEME — outdoorsy palette: mossy greens, earthy ambers, sky blues
// ════════════════════════════════════════════════════════════
const useColors = () => {
  const { theme } = useTheme();
  const d = theme === 'dark';
  return {
    d,
    bg: d ? 'bg-zinc-900' : 'bg-stone-50',
    bgCard: d ? 'bg-zinc-800' : 'bg-white',
    bgInset: d ? 'bg-zinc-700' : 'bg-stone-100',
    text: d ? 'text-zinc-50' : 'text-gray-900',
    textSec: d ? 'text-zinc-400' : 'text-gray-600',
    textMut: d ? 'text-zinc-500' : 'text-gray-500',
    border: d ? 'border-zinc-700' : 'border-stone-200',
    input: d ? 'bg-zinc-700 border-zinc-600 text-zinc-100 placeholder-zinc-500 focus:border-emerald-500' : 'bg-white border-stone-300 text-gray-900 placeholder-stone-400 focus:border-emerald-500',
    btn: d ? 'bg-emerald-600 hover:bg-emerald-500 text-white font-bold' : 'bg-emerald-700 hover:bg-emerald-800 text-white font-bold',
    btnSec: d ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-200' : 'bg-stone-100 hover:bg-stone-200 text-gray-700',
    btnGhost: d ? 'text-zinc-400 hover:text-zinc-100' : 'text-gray-600 hover:text-gray-900',
    btnDis: d ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed' : 'bg-stone-200 text-stone-400 cursor-not-allowed',
    pillActive: d ? 'border-emerald-500 bg-emerald-900/30 text-emerald-300' : 'border-emerald-500 bg-emerald-50 text-emerald-700',
    pillInactive: d ? 'border-zinc-600 text-zinc-400 hover:border-zinc-500' : 'border-stone-200 text-gray-500 hover:border-stone-400',
    accent: d ? 'text-emerald-400' : 'text-emerald-600',
    accentBg: d ? 'bg-emerald-900/30 border-emerald-700' : 'bg-emerald-50 border-emerald-200',
    headerBg: d ? 'bg-gradient-to-br from-emerald-900/40 to-zinc-800 border-emerald-700' : 'bg-gradient-to-br from-emerald-50 to-sky-50 border-emerald-200',
    timeline: d ? 'border-zinc-600' : 'border-stone-300',
    timelineDot: d ? 'bg-emerald-500 border-zinc-800' : 'bg-emerald-600 border-white',
    transitText: d ? 'text-zinc-500 bg-zinc-900' : 'text-gray-400 bg-stone-50',
    stopCard: d ? 'bg-zinc-800 border-zinc-700 hover:border-zinc-600' : 'bg-white border-stone-200 hover:border-stone-300',
    tipBg: d ? 'bg-amber-900/20 border-amber-700/40 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800',
    rainBg: d ? 'bg-sky-900/20 border-sky-700/40 text-sky-300' : 'bg-sky-50 border-sky-200 text-sky-800',
    extendBg: d ? 'bg-violet-900/20 border-violet-700/40 text-violet-300' : 'bg-violet-50 border-violet-200 text-violet-800',
    tagBg: d ? 'bg-zinc-700 text-zinc-300' : 'bg-stone-100 text-gray-600',
    errBg: d ? 'bg-red-900/30 border-red-700' : 'bg-red-50 border-red-200',
    errText: d ? 'text-red-300' : 'text-red-700',
    checkBg: d ? 'bg-emerald-900/20 border-emerald-700' : 'bg-emerald-50 border-emerald-200',
    journalBg: d ? 'bg-amber-900/15 border-amber-700/40' : 'bg-amber-50 border-amber-300',
    journalCard: d ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-stone-200',
    journalAccent: d ? 'text-amber-400' : 'text-amber-700',
  };
};

// ════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════
const TIME_OPTIONS = [
  { value: '1hr', label: '1 hr' },
  { value: '2hrs', label: '2 hrs' },
  { value: '3hrs', label: '3 hrs' },
  { value: 'halfday', label: 'Half day' },
];

const WHEN_OPTIONS = [
  { value: 'right_now', label: '🕐 Right now' },
  { value: 'later_today', label: '🌤️ Later today' },
  { value: 'weekend', label: '📅 This weekend' },
];

const TIME_OF_DAY = [
  { value: 'morning', label: 'Morning' },
  { value: 'afternoon', label: 'Afternoon' },
  { value: 'evening', label: 'Evening' },
];

const INTERESTS = [
  { value: 'nature', label: '🌿 Nature' },
  { value: 'food_drink', label: '🍜 Food & Drink' },
  { value: 'art_culture', label: '🎨 Art & Culture' },
  { value: 'history', label: '🏛️ History' },
  { value: 'active', label: '🏃 Active' },
  { value: 'browsing', label: '🛍️ Browsing' },
  { value: 'photography', label: '📸 Photography' },
  { value: 'relaxation', label: '😌 Relaxation' },
  { value: 'surprise', label: '🎲 Surprise me' },
];

const VIBE_OPTIONS = [
  { value: 'energizing', label: '⚡ Energizing' },
  { value: 'balanced', label: '☯️ Balanced' },
  { value: 'chill', label: '🧘 Chill' },
  { value: 'surprise', label: '🎲 Surprise' },
];

const BUDGET_OPTIONS = [
  { value: 'free', label: 'Free only' },
  { value: 'low', label: '$0–20' },
  { value: 'moderate', label: '$20–50' },
  { value: 'any', label: 'Any' },
];

const TRANSPORT_OPTIONS = [
  { value: 'walking', label: '🚶 Walking' },
  { value: 'biking', label: '🚲 Biking' },
  { value: 'driving', label: '🚗 Driving' },
  { value: 'transit', label: '🚇 Transit' },
];

const COMPANION_OPTIONS = [
  { value: 'solo', label: 'Solo' },
  { value: 'partner', label: 'Partner/Friend' },
  { value: 'family', label: 'Family w/ Kids' },
  { value: 'group', label: 'Group' },
];

const ACCESSIBILITY_OPTIONS = [
  { value: 'wheelchair', label: 'Wheelchair accessible' },
  { value: 'limited_mobility', label: 'Limited mobility friendly' },
  { value: 'dog_friendly', label: 'Dog-friendly' },
];

// ════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════
const MicroAdventureMapper = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const c = useColors();

  // ── Adventure Journal (persistent) ──
  const [pastAdventures, setPastAdventures] = usePersistentState('micro-adventure-journal', []);
  const [showJournal, setShowJournal] = useState(false);
  const [expandedJournalId, setExpandedJournalId] = useState(null);

  // ── Inputs ──
  const [location, setLocation] = useState('');
  const [timeAvailable, setTimeAvailable] = useState('2hrs');
  const [when, setWhen] = useState('right_now');
  const [timeOfDay, setTimeOfDay] = useState('afternoon');
  const [interests, setInterests] = useState([]);
  const [vibe, setVibe] = useState('balanced');
  const [budget, setBudget] = useState('low');
  const [transport, setTransport] = useState('walking');
  const [companions, setCompanions] = useState('solo');
  const [accessibility, setAccessibility] = useState([]);
  const [showAccessibility, setShowAccessibility] = useState(false);

  // ── Results ──
  const [results, setResults] = useState(null);
  const [showInputs, setShowInputs] = useState(true);
  const [error, setError] = useState('');
  const [swapping, setSwapping] = useState(null); // stop number being swapped
  const [copied, setCopied] = useState(false);
  const [checkedItems, setCheckedItems] = useState({});

  // ══════════════════════════════════════════
  // INPUT HANDLERS
  // ══════════════════════════════════════════
  const toggleInterest = useCallback((val) => {
    if (val === 'surprise') {
      setInterests(prev => prev.includes('surprise') ? [] : ['surprise']);
    } else {
      setInterests(prev => {
        const without = prev.filter(i => i !== 'surprise' && i !== val);
        if (prev.includes(val)) return without;
        if (without.length >= 3) return without;
        return [...without, val];
      });
    }
  }, []);

  const toggleAccessibility = useCallback((val) => {
    setAccessibility(prev => prev.includes(val) ? prev.filter(a => a !== val) : [...prev, val]);
  }, []);

  // ══════════════════════════════════════════
  // JOURNAL HELPERS
  // ══════════════════════════════════════════
  const saveToJournal = useCallback((adventureResults, loc) => {
    const entry = {
      id: `adv_${Date.now()}`,
      date: new Date().toISOString(),
      location: loc,
      adventure: adventureResults.adventure,
      stops: adventureResults.stops,
      transit_between: adventureResults.transit_between,
      what_to_bring: adventureResults.what_to_bring,
      rainy_backup: adventureResults.rainy_backup,
      extend_it: adventureResults.extend_it,
    };
    setPastAdventures(prev => [entry, ...prev].slice(0, 50)); // Keep last 50
  }, [setPastAdventures]);

  const getPastAdventureNames = useCallback((loc) => {
    const locLower = (loc || '').toLowerCase().trim();
    if (!locLower) return [];
    return pastAdventures
      .filter(a => (a.location || '').toLowerCase().includes(locLower) || locLower.includes((a.location || '').toLowerCase()))
      .map(a => ({
        name: a.adventure?.name || 'Unknown',
        stops: (a.stops || []).map(s => s.name),
      }));
  }, [pastAdventures]);

  const removeFromJournal = useCallback((id) => {
    setPastAdventures(prev => prev.filter(a => a.id !== id));
    if (expandedJournalId === id) setExpandedJournalId(null);
  }, [setPastAdventures, expandedJournalId]);

  const loadFromJournal = useCallback((entry) => {
    setResults({
      adventure: entry.adventure,
      stops: entry.stops,
      transit_between: entry.transit_between,
      what_to_bring: entry.what_to_bring,
      rainy_backup: entry.rainy_backup,
      extend_it: entry.extend_it,
    });
    setLocation(entry.location || '');
    setShowInputs(false);
    setCheckedItems({});
    setShowJournal(false);
  }, []);

  const clearJournal = useCallback(() => {
    setPastAdventures([]);
    setExpandedJournalId(null);
  }, [setPastAdventures]);

  // ══════════════════════════════════════════
  // AI CALLS
  // ══════════════════════════════════════════
  const getInputPayload = useCallback(() => ({
    location: location.trim(),
    timeAvailable,
    when,
    timeOfDay: when === 'later_today' ? timeOfDay : null,
    interests: interests.length > 0 ? interests : ['surprise'],
    vibe,
    budget,
    transport,
    companions,
    accessibility,
  }), [location, timeAvailable, when, timeOfDay, interests, vibe, budget, transport, companions, accessibility]);

  const generate = useCallback(async () => {
    if (location.trim().length < 2) return;
    setError(''); setResults(null); setCheckedItems({});
    try {
      const pastForLocation = getPastAdventureNames(location.trim());
      const res = await callToolEndpoint('micro-adventure-mapper', {
        action: 'generate',
        ...getInputPayload(),
        previousAdventures: pastForLocation,
      });
      setResults(res);
      setShowInputs(false);
      saveToJournal(res, location.trim());
    } catch (err) {
      setError(err.message || 'Failed to plan adventure. Please try again.');
    }
  }, [location, callToolEndpoint, getInputPayload, getPastAdventureNames, saveToJournal]);

  const regenerate = useCallback(async () => {
    if (!results?.adventure) return;
    setError('');
    try {
      const pastForLocation = getPastAdventureNames(location.trim());
      const res = await callToolEndpoint('micro-adventure-mapper', {
        action: 'regenerate',
        ...getInputPayload(),
        previousAdventureName: results.adventure.name,
        previousAdventures: pastForLocation,
      });
      setResults(res);
      setCheckedItems({});
      saveToJournal(res, location.trim());
    } catch (err) {
      setError(err.message || 'Failed to regenerate. Please try again.');
    }
  }, [results, callToolEndpoint, getInputPayload, getPastAdventureNames, saveToJournal, location]);

  const swapStop = useCallback(async (stopNumber) => {
    if (!results) return;
    setSwapping(stopNumber);
    setError('');
    try {
      const res = await callToolEndpoint('micro-adventure-mapper', {
        action: 'swap',
        ...getInputPayload(),
        currentItinerary: results,
        swapStopNumber: stopNumber,
      });
      // Merge swapped stop into existing results
      if (res.stops) {
        setResults(prev => {
          const newStops = [...prev.stops];
          const swappedStop = res.stops.find(s => s.number === stopNumber);
          if (swappedStop) {
            const idx = newStops.findIndex(s => s.number === stopNumber);
            if (idx !== -1) newStops[idx] = swappedStop;
          }
          const newTransit = prev.transit_between ? [...prev.transit_between] : [];
          if (res.transit_between) {
            res.transit_between.forEach(t => {
              const tIdx = newTransit.findIndex(nt => nt.from_stop === t.from_stop && nt.to_stop === t.to_stop);
              if (tIdx !== -1) newTransit[tIdx] = t;
              else newTransit.push(t);
            });
          }
          return { ...prev, stops: newStops, transit_between: newTransit };
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to swap stop. Try again.');
    } finally {
      setSwapping(null);
    }
  }, [results, callToolEndpoint, getInputPayload]);

  // ══════════════════════════════════════════
  // COPY / PRINT
  // ══════════════════════════════════════════
  const copyItinerary = useCallback(() => {
    if (!results) return;
    const adv = results.adventure || {};
    const lines = [
      `🗺️ ${adv.name || 'Micro-Adventure'}`,
      adv.tagline || '', '',
      `⏱️ ${adv.total_time || ''} · 💰 ${adv.total_cost || ''} · ${adv.difficulty || ''}`, '',
      adv.why_adventure ? `Why: ${adv.why_adventure}` : '', '',
      '── ITINERARY ──', '',
    ];
    (results.stops || []).forEach((s, i) => {
      lines.push(`Stop ${s.number || i + 1}: ${s.name}`);
      lines.push(`📍 ${s.location || ''}`);
      lines.push(`⏱️ ${s.time_start || ''} – ${s.time_end || ''} (${s.duration_min || '?'} min)`);
      lines.push(s.description || '');
      if (s.pro_tip) lines.push(`💡 ${s.pro_tip}`);
      if (s.photo_op) lines.push(`📸 ${s.photo_op}`);
      lines.push('');
      const transit = (results.transit_between || []).find(t => t.from_stop === (s.number || i + 1));
      if (transit) lines.push(`→ ${transit.method} (${transit.duration}, ${transit.distance})`, '');
    });
    if (results.what_to_bring) lines.push('🎒 BRING: ' + results.what_to_bring.join(', '), '');
    if (results.rainy_backup) lines.push(`☔ RAIN PLAN: ${results.rainy_backup.description}`, '');
    if (results.extend_it) lines.push(`⏳ EXTEND: ${results.extend_it.suggestion}`, '');

    navigator.clipboard.writeText(lines.filter(l => l !== undefined).join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [results]);

  const printItinerary = useCallback(() => {
    if (!results) return;
    const adv = results.adventure || {};
    const stopsHtml = (results.stops || []).map((s, i) => {
      const transit = (results.transit_between || []).find(t => t.from_stop === (s.number || i + 1));
      return `
        <div style="margin-bottom:20px;padding:16px;border:1px solid #e7e5e4;border-radius:12px">
          <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px">
            <strong style="font-size:1.1em">Stop ${s.number || i + 1}: ${s.name}</strong>
            <span style="color:#78716c;font-size:0.85em">${s.time_start || ''} – ${s.time_end || ''}</span>
          </div>
          <div style="color:#57534e;font-size:0.85em;margin-bottom:8px">📍 ${s.location || ''} · ${s.duration_min || '?'} min · ${s.cost || 'Free'}</div>
          <p style="margin-bottom:8px">${s.description || ''}</p>
          ${s.pro_tip ? `<p style="color:#92400e;font-size:0.9em;font-style:italic">💡 ${s.pro_tip}</p>` : ''}
          ${s.photo_op ? `<p style="color:#1d4ed8;font-size:0.9em">📸 ${s.photo_op}</p>` : ''}
        </div>
        ${transit ? `<div style="text-align:center;color:#a8a29e;font-size:0.8em;margin:8px 0">→ ${transit.method} (${transit.duration})</div>` : ''}`;
    }).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${adv.name || 'Micro-Adventure'}</title>
<style>body{font-family:-apple-system,'Segoe UI',sans-serif;max-width:650px;margin:40px auto;padding:0 20px;color:#1c1917;line-height:1.6}
h1{margin-bottom:4px}
.meta{color:#78716c;font-size:0.9em;margin-bottom:16px}
.section{margin-top:24px;padding:14px;border-radius:10px;font-size:0.9em}
.rain{background:#eff6ff;border:1px solid #bfdbfe}
.extend{background:#f5f3ff;border:1px solid #ddd6fe}
@media print{body{margin:20px}}</style></head><body>
<h1>🗺️ ${adv.name || 'Adventure'}</h1>
<div class="meta">${adv.tagline || ''}<br>⏱️ ${adv.total_time || ''} · 💰 ${adv.total_cost || ''} · ${adv.difficulty || ''}</div>
${adv.why_adventure ? `<p style="font-style:italic;color:#57534e">${adv.why_adventure}</p>` : ''}
${stopsHtml}
${results.what_to_bring ? `<div class="section" style="background:#f0fdf4;border:1px solid #bbf7d0"><strong>🎒 Bring:</strong> ${results.what_to_bring.join(', ')}</div>` : ''}
${results.rainy_backup ? `<div class="section rain"><strong>☔ Rain plan:</strong> ${results.rainy_backup.description}</div>` : ''}
${results.extend_it ? `<div class="section extend"><strong>⏳ Keep going:</strong> ${results.extend_it.suggestion}</div>` : ''}
</body></html>`;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(html);
    w.document.close();
    setTimeout(() => { try { w.focus(); w.print(); } catch (e) { /* blocked */ } }, 300);
  }, [results]);

  // ══════════════════════════════════════════
  // RENDER: Header (in-card identity)
  // ══════════════════════════════════════════
  const renderHeader = () => (
    <div className="flex items-center gap-3 mb-5">
      <div>
        <h2 className={`text-2xl font-bold ${c.text}`}>Micro-Adventure Mapper 🗺️</h2>
        <p className={`text-sm ${c.textMut}`}>Plan a local adventure in 30 seconds</p>
      </div>
    </div>
  );

  // ══════════════════════════════════════════
  // RENDER: Pill Selector (reusable)
  // ══════════════════════════════════════════
  const renderPills = (options, value, setter, multi = false) => (
    <div className="flex flex-wrap gap-1.5">
      {options.map(opt => {
        const active = multi ? value.includes(opt.value) : value === opt.value;
        return (
          <button key={opt.value}
            onClick={() => multi ? setter(opt.value) : setter(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${active ? c.pillActive : c.pillInactive}`}>
            {active && !multi && <Check className="w-3 h-3 inline mr-1" />}
            {active && multi && <Check className="w-3 h-3 inline mr-1" />}
            {opt.label}
          </button>
        );
      })}
    </div>
  );

  // ══════════════════════════════════════════
  // RENDER: Input Form
  // ══════════════════════════════════════════
  const renderInputForm = () => (
    <div className="space-y-4">
      {/* Location */}
      <div className={`p-5 rounded-2xl border ${c.border} ${c.bgCard}`}>
        <label className={`text-xs font-bold ${c.textSec} uppercase tracking-wide mb-2 block`}>📍 Where are you?</label>
        <input type="text" value={location} onChange={e => setLocation(e.target.value)}
          placeholder="City, neighborhood, or address..."
          className={`w-full px-4 py-2.5 rounded-xl border text-sm ${c.input} outline-none`} />
      </div>

      {/* Time + When */}
      <div className={`p-5 rounded-2xl border ${c.border} ${c.bgCard}`}>
        <label className={`text-xs font-bold ${c.textSec} uppercase tracking-wide mb-2 block`}>⏱️ How much time?</label>
        {renderPills(TIME_OPTIONS, timeAvailable, setTimeAvailable)}

        <label className={`text-xs font-bold ${c.textSec} uppercase tracking-wide mb-2 mt-4 block`}>📅 When?</label>
        {renderPills(WHEN_OPTIONS, when, setWhen)}

        {when === 'later_today' && (
          <div className="mt-3">
            <label className={`text-xs font-semibold ${c.textMut} mb-1.5 block`}>Time of day</label>
            {renderPills(TIME_OF_DAY, timeOfDay, setTimeOfDay)}
          </div>
        )}
      </div>

      {/* Interests */}
      <div className={`p-5 rounded-2xl border ${c.border} ${c.bgCard}`}>
        <label className={`text-xs font-bold ${c.textSec} uppercase tracking-wide mb-1 block`}>🎯 What sounds good?</label>
        <p className={`text-xs ${c.textMut} mb-2`}>Pick up to 3, or "Surprise me"</p>
        {renderPills(INTERESTS, interests, toggleInterest, true)}
      </div>

      {/* Vibe + Budget */}
      <div className={`p-5 rounded-2xl border ${c.border} ${c.bgCard}`}>
        <label className={`text-xs font-bold ${c.textSec} uppercase tracking-wide mb-2 block`}>✨ Vibe</label>
        {renderPills(VIBE_OPTIONS, vibe, setVibe)}

        <label className={`text-xs font-bold ${c.textSec} uppercase tracking-wide mb-2 mt-4 block`}>💰 Budget</label>
        {renderPills(BUDGET_OPTIONS, budget, setBudget)}
      </div>

      {/* Transport + Companions */}
      <div className={`p-5 rounded-2xl border ${c.border} ${c.bgCard}`}>
        <label className={`text-xs font-bold ${c.textSec} uppercase tracking-wide mb-2 block`}>🚶 Getting around</label>
        {renderPills(TRANSPORT_OPTIONS, transport, setTransport)}

        <label className={`text-xs font-bold ${c.textSec} uppercase tracking-wide mb-2 mt-4 block`}>👥 Who's coming?</label>
        {renderPills(COMPANION_OPTIONS, companions, setCompanions)}
      </div>

      {/* Accessibility */}
      <div className={`p-5 rounded-2xl border ${c.border} ${c.bgCard}`}>
        <button onClick={() => setShowAccessibility(!showAccessibility)}
          className={`flex items-center gap-2 text-xs font-bold ${c.textSec} uppercase tracking-wide`}>
          {showAccessibility ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          ♿ Accessibility (optional)
          {accessibility.length > 0 && <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] ${c.pillActive}`}>{accessibility.length}</span>}
        </button>
        {showAccessibility && (
          <div className="flex flex-wrap gap-2 mt-3">
            {ACCESSIBILITY_OPTIONS.map(opt => (
              <button key={opt.value} onClick={() => toggleAccessibility(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${accessibility.includes(opt.value) ? c.pillActive : c.pillInactive}`}>
                {accessibility.includes(opt.value) && <Check className="w-3 h-3 inline mr-1" />}
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Generate Button */}
      <button onClick={generate}
        disabled={loading || location.trim().length < 2}
        className={`w-full py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg transition-all
          ${location.trim().length >= 2 && !loading ? `${c.btn} hover:scale-[1.01] active:scale-[0.99]` : c.btnDis}`}>
        {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Planning your adventure...</>
          : <><Compass className="w-5 h-5" /> Map My Adventure</>}
      </button>
    </div>
  );

  // ══════════════════════════════════════════
  // RENDER: Results
  // ══════════════════════════════════════════
  const renderResults = () => {
    if (!results) return null;
    const adv = results.adventure || {};
    const stops = results.stops || [];
    const transits = results.transit_between || [];

    // Adventure header
    const renderAdventureHeader = () => (
      <div className={`p-5 rounded-2xl border-2 ${c.headerBg} mb-5`}>
        <h3 className={`text-xl font-bold ${c.text} mb-1`}>🗺️ {adv.name || 'Your Adventure'}</h3>
        {adv.tagline && <p className={`text-sm ${c.textSec} mb-3`}>{adv.tagline}</p>}
        <div className="flex flex-wrap gap-2 mb-3">
          {adv.category && <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${c.tagBg}`}>🎯 {adv.category}</span>}
          {adv.total_time && <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${c.tagBg}`}>⏱️ {adv.total_time}</span>}
          {adv.total_cost && <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${c.tagBg}`}>💰 {adv.total_cost}</span>}
          {adv.difficulty && <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${c.tagBg}`}>{adv.difficulty}</span>}
        </div>
        {adv.why_adventure && (
          <p className={`text-sm italic ${c.textSec}`}>🤔 {adv.why_adventure}</p>
        )}
      </div>
    );

    // Timeline
    const renderTimeline = () => (
      <div className="relative mb-5">
        {stops.map((stop, idx) => {
          const transit = transits.find(t => t.from_stop === (stop.number || idx + 1));
          const isSwapping = swapping === (stop.number || idx + 1);

          return (
            <div key={idx}>
              {/* Stop card with timeline connector */}
              <div className="flex gap-4">
                {/* Timeline line + dot */}
                <div className="flex flex-col items-center flex-shrink-0" style={{ width: '28px' }}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white border-2 ${c.timelineDot} z-10`}>
                    {stop.number || idx + 1}
                  </div>
                  {idx < stops.length - 1 && (
                    <div className={`flex-1 w-0 border-l-2 ${c.timeline}`} style={{ minHeight: '100%' }} />
                  )}
                </div>

                {/* Stop content */}
                <div className={`flex-1 p-4 rounded-xl border ${c.stopCard} mb-2 transition-all ${isSwapping ? 'opacity-50' : ''}`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className={`text-sm font-bold ${c.text}`}>{stop.name}</h4>
                    {stop.cost && <span className={`text-xs font-semibold ${c.accent} flex-shrink-0`}>{stop.cost}</span>}
                  </div>

                  <div className={`flex flex-wrap items-center gap-3 text-xs ${c.textMut} mb-2`}>
                    {stop.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{stop.location}</span>}
                    {(stop.time_start || stop.time_end) && (
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{stop.time_start}{stop.time_end ? ` – ${stop.time_end}` : ''}</span>
                    )}
                    {stop.duration_min && <span>{stop.duration_min} min</span>}
                  </div>

                  {stop.description && <p className={`text-sm ${c.text} mb-2`}>{stop.description}</p>}

                  {stop.pro_tip && (
                    <div className={`text-xs p-2.5 rounded-lg border mb-2 ${c.tipBg}`}>💡 {stop.pro_tip}</div>
                  )}

                  {stop.photo_op && (
                    <p className={`text-xs italic ${c.textSec} mb-2`}>📸 {stop.photo_op}</p>
                  )}

                  {/* Swap button */}
                  <button onClick={() => swapStop(stop.number || idx + 1)} disabled={isSwapping || loading}
                    className={`text-xs font-semibold flex items-center gap-1 ${c.btnGhost}`}>
                    {isSwapping ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                    {isSwapping ? 'Swapping...' : 'Swap this stop'}
                  </button>
                </div>
              </div>

              {/* Transit between stops */}
              {transit && idx < stops.length - 1 && (
                <div className="flex gap-4 mb-2">
                  <div className="flex flex-col items-center flex-shrink-0" style={{ width: '28px' }}>
                    <div className={`flex-1 w-0 border-l-2 border-dashed ${c.timeline}`} />
                  </div>
                  <div className={`flex items-center gap-2 py-1.5 px-3 rounded-lg text-xs ${c.transitText}`}>
                    <Footprints className="w-3 h-3" />
                    <span>{transit.method}</span>
                    {transit.duration && <span className="opacity-60">· {transit.duration}</span>}
                    {transit.distance && <span className="opacity-60">· {transit.distance}</span>}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );

    // What to bring (checkable)
    const renderBringList = () => {
      if (!results.what_to_bring || results.what_to_bring.length === 0) return null;
      return (
        <div className={`p-4 rounded-xl border ${c.checkBg} mb-4`}>
          <h4 className={`text-sm font-bold ${c.text} mb-3 flex items-center gap-2`}>
            <Backpack className="w-4 h-4" /> What to Bring
          </h4>
          <div className="space-y-1.5">
            {results.what_to_bring.map((item, i) => {
              const done = checkedItems[`bring-${i}`];
              return (
                <button key={i} onClick={() => setCheckedItems(prev => ({ ...prev, [`bring-${i}`]: !prev[`bring-${i}`] }))}
                  className={`flex items-center gap-2.5 w-full text-left text-sm ${done ? c.textMut : c.text}`}>
                  <div className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border-2 transition-all
                    ${done ? 'bg-emerald-500 border-emerald-500 text-white' : c.border}`}>
                    {done && <Check className="w-3 h-3" />}
                  </div>
                  <span className={done ? 'line-through' : ''}>{item}</span>
                </button>
              );
            })}
          </div>
        </div>
      );
    };

    // Rainy backup
    const renderRainyBackup = () => {
      if (!results.rainy_backup) return null;
      const rb = results.rainy_backup;
      return (
        <div className={`p-4 rounded-xl border ${c.rainBg} mb-4`}>
          <h4 className="text-sm font-bold mb-1 flex items-center gap-2">
            <CloudRain className="w-4 h-4" /> If It Rains
          </h4>
          <p className="text-sm">{rb.description}</p>
          {(rb.time || rb.cost) && (
            <p className={`text-xs mt-1 opacity-70`}>{rb.time ? `⏱️ ${rb.time}` : ''}{rb.cost ? ` · 💰 ${rb.cost}` : ''}</p>
          )}
        </div>
      );
    };

    // Extend it
    const renderExtend = () => {
      if (!results.extend_it) return null;
      return (
        <div className={`p-4 rounded-xl border ${c.extendBg} mb-4`}>
          <h4 className="text-sm font-bold mb-1 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Want to Keep Going?
          </h4>
          {results.extend_it.extra_time && <p className="text-xs opacity-70 mb-1">Add {results.extend_it.extra_time}</p>}
          <p className="text-sm">{results.extend_it.suggestion}</p>
        </div>
      );
    };

    // Action buttons
    const renderActions = () => (
      <div className="flex flex-wrap gap-2">
        <button onClick={regenerate} disabled={loading}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 ${loading ? c.btnDis : c.btn}`}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Different Adventure
        </button>
        <button onClick={copyItinerary}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 ${c.btnSec}`}>
          {copied ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
        </button>
        <button onClick={printItinerary}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 ${c.btnSec}`}>
          <Printer className="w-3.5 h-3.5" /> Print
        </button>
      </div>
    );

    return (
      <div>
        {/* Edit toggle */}
        <button onClick={() => setShowInputs(!showInputs)}
          className={`flex items-center gap-2 text-xs font-semibold ${c.btnGhost} mb-4`}>
          {showInputs ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {showInputs ? 'Hide inputs' : '✏️ Edit inputs'}
          <span className={`${c.textMut}`}>· {location}</span>
        </button>

        {showInputs && renderInputForm()}

        {renderAdventureHeader()}
        {renderTimeline()}
        {renderBringList()}
        {renderRainyBackup()}
        {renderExtend()}
        {renderActions()}
      </div>
    );
  };

  const renderError = () => error ? (
    <div className={`mt-4 p-4 ${c.errBg} border rounded-xl flex items-start gap-3`}>
      <AlertCircle className={`w-5 h-5 ${c.errText} flex-shrink-0 mt-0.5`} />
      <p className={`text-sm ${c.errText}`}>{error}</p>
    </div>
  ) : null;

  // ══════════════════════════════════════════
  // RENDER: Adventure Journal
  // ══════════════════════════════════════════
  const renderJournal = () => {
    if (pastAdventures.length === 0) return null;

    const formatDate = (iso) => {
      try {
        const d = new Date(iso);
        const now = new Date();
        const diffMs = now - d;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } catch { return ''; }
    };

    // Group by location (normalized lowercase)
    const grouped = {};
    pastAdventures.forEach(a => {
      const key = (a.location || 'Unknown').trim();
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(a);
    });
    const locationKeys = Object.keys(grouped);

    const renderJournalEntry = (entry) => {
      const isExpanded = expandedJournalId === entry.id;
      const adv = entry.adventure || {};
      const stops = entry.stops || [];

      return (
        <div key={entry.id} className={`rounded-xl border ${c.journalCard} overflow-hidden mb-2`}>
          {/* Summary row */}
          <button onClick={() => setExpandedJournalId(isExpanded ? null : entry.id)}
            className={`w-full flex items-center gap-3 p-3 text-left`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold ${c.text} truncate`}>{adv.name || 'Adventure'}</span>
              </div>
              <div className={`flex items-center gap-2 text-xs ${c.textMut} mt-0.5`}>
                <span>{formatDate(entry.date)}</span>
                <span>·</span>
                <span>{stops.length} stops</span>
                {adv.total_cost && <><span>·</span><span>{adv.total_cost}</span></>}
              </div>
            </div>
            {isExpanded ? <ChevronUp className={`w-4 h-4 ${c.textMut} flex-shrink-0`} /> : <ChevronDown className={`w-4 h-4 ${c.textMut} flex-shrink-0`} />}
          </button>

          {/* Expanded detail */}
          {isExpanded && (
            <div className={`px-3 pb-3 border-t ${c.border}`}>
              {adv.tagline && <p className={`text-xs italic ${c.textSec} mt-2 mb-2`}>{adv.tagline}</p>}

              {/* Condensed stop list */}
              <div className="space-y-1.5 mb-3">
                {stops.map((s, i) => (
                  <div key={i} className={`flex items-start gap-2 text-xs ${c.text}`}>
                    <span className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-black text-white ${c.d ? 'bg-zinc-600' : 'bg-stone-400'}`}>{s.number || i + 1}</span>
                    <div className="min-w-0">
                      <span className="font-semibold">{s.name}</span>
                      {s.location && <span className={`${c.textMut} ml-1`}>— {s.location}</span>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button onClick={() => loadFromJournal(entry)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 ${c.btn}`}>
                  <RotateCcw className="w-3 h-3" /> Do This Again
                </button>
                <button onClick={() => {
                    // Copy this past adventure
                    const lines = [`🗺️ ${adv.name || 'Adventure'}`, adv.tagline || '', ''];
                    stops.forEach((s, i) => {
                      lines.push(`${s.number || i + 1}. ${s.name} — ${s.location || ''}`);
                      if (s.description) lines.push(`   ${s.description}`);
                      lines.push('');
                    });
                    navigator.clipboard.writeText(lines.join('\n'));
                  }}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${c.btnSec}`}>
                  <Copy className="w-3 h-3" /> Copy
                </button>
                <button onClick={() => removeFromJournal(entry.id)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${c.btnSec} hover:text-red-500`}>
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      );
    };

    return (
      <div className={`mt-6 p-4 rounded-2xl border ${c.journalBg}`}>
        <button onClick={() => setShowJournal(!showJournal)}
          className={`w-full flex items-center gap-2 text-left`}>
          <BookOpen className={`w-4 h-4 ${c.journalAccent}`} />
          <span className={`text-sm font-bold ${c.text} flex-1`}>Adventure Journal</span>
          <span className={`text-xs ${c.textMut}`}>{pastAdventures.length} past</span>
          {showJournal ? <ChevronUp className={`w-4 h-4 ${c.textMut}`} /> : <ChevronDown className={`w-4 h-4 ${c.textMut}`} />}
        </button>

        {showJournal && (
          <div className="mt-3">
            {/* Dedup indicator */}
            <p className={`text-xs ${c.textMut} mb-3`}>
              AI avoids repeating adventures you've already done in the same area.
            </p>

            {locationKeys.length === 1 ? (
              // Single location — flat list
              <div className="space-y-0">
                {grouped[locationKeys[0]].map(renderJournalEntry)}
              </div>
            ) : (
              // Multiple locations — grouped
              locationKeys.map(loc => (
                <div key={loc} className="mb-3 last:mb-0">
                  <div className={`flex items-center gap-1.5 mb-1.5`}>
                    <MapPin className={`w-3 h-3 ${c.journalAccent}`} />
                    <span className={`text-xs font-bold ${c.textSec} uppercase tracking-wide`}>{loc}</span>
                    <span className={`text-xs ${c.textMut}`}>({grouped[loc].length})</span>
                  </div>
                  {grouped[loc].map(renderJournalEntry)}
                </div>
              ))
            )}

            {/* Clear all */}
            {pastAdventures.length > 1 && (
              <button onClick={clearJournal}
                className={`w-full mt-2 text-center text-xs font-semibold ${c.btnGhost} hover:text-red-500 py-1.5`}>
                Clear all history
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  // ══════════════════════════════════════════
  // MAIN RENDER
  // ══════════════════════════════════════════
  return (
    <div>
      {renderHeader()}
      {results ? renderResults() : renderInputForm()}
      {renderError()}
      {renderJournal()}
    </div>
  );
};

MicroAdventureMapper.displayName = 'MicroAdventureMapper';
export default MicroAdventureMapper;
