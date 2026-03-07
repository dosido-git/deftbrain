import React, { useState, useCallback, useEffect } from 'react';
import {
  Camera, ClipboardCheck, ChevronRight, ChevronLeft,
  Loader2, AlertCircle, Copy, CheckCircle, Plus, X, RotateCcw,
  FileText, Lightbulb, Scale, Home, Search, CopyPlus, Check, Save, Printer
} from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';
import { usePersistentState } from '../hooks/usePersistentState';
import { getToolById } from '../data/tools';

// ════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════
const US_STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut',
  'Delaware','District of Columbia','Florida','Georgia','Hawaii','Idaho','Illinois',
  'Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts',
  'Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada',
  'New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota',
  'Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina',
  'South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington',
  'West Virginia','Wisconsin','Wyoming',
];

const CA_PROVINCES = [
  'Alberta','British Columbia','Manitoba','New Brunswick','Newfoundland and Labrador',
  'Northwest Territories','Nova Scotia','Nunavut','Ontario','Prince Edward Island',
  'Quebec','Saskatchewan','Yukon',
];

const AU_STATES = [
  'Australian Capital Territory','New South Wales','Northern Territory','Queensland',
  'South Australia','Tasmania','Victoria','Western Australia',
];

const COUNTRIES = [
  { code: 'US', label: 'United States', regionLabel: 'State', regions: US_STATES },
  { code: 'CA', label: 'Canada', regionLabel: 'Province', regions: CA_PROVINCES },
  { code: 'UK', label: 'United Kingdom', regionLabel: 'Region (optional)', regions: ['England','Scotland','Wales','Northern Ireland'] },
  { code: 'AU', label: 'Australia', regionLabel: 'State / Territory', regions: AU_STATES },
  { code: 'IE', label: 'Ireland', regionLabel: 'County (optional)', regions: null },
  { code: 'NZ', label: 'New Zealand', regionLabel: 'Region (optional)', regions: null },
  { code: 'DE', label: 'Germany', regionLabel: 'State (optional)', regions: null },
  { code: 'NL', label: 'Netherlands', regionLabel: 'Province (optional)', regions: null },
  { code: 'FR', label: 'France', regionLabel: 'Region (optional)', regions: null },
  { code: 'OTHER', label: 'Other country', regionLabel: 'Country & Region', regions: null },
];

const ROOM_TEMPLATES = [
  {
    name: 'Living Room', emoji: '🛋️',
    checkpoints: [
      'Walls (scuffs, holes, paint)','Ceiling (stains, cracks)','Flooring (scratches, stains, damage)',
      'Windows (cracks, locks, screens)','Light fixtures & switches','Electrical outlets',
      'Doors (hinges, locks, damage)','Baseboards & trim',
    ],
  },
  {
    name: 'Kitchen', emoji: '🍳',
    checkpoints: [
      'Countertops (chips, stains, burns)','Cabinets (doors, hinges, interior)','Sink & faucet (leaks, stains)',
      'Stove/Oven (burners, interior, knobs)','Refrigerator (interior, seals, ice maker)',
      'Dishwasher (interior, racks, door)','Microwave (if built-in)','Flooring (stains, damage)',
      'Walls & backsplash','Garbage disposal',
    ],
  },
  {
    name: 'Bedroom', emoji: '🛏️', duplicable: true,
    checkpoints: [
      'Walls (scuffs, holes, paint)','Ceiling (stains, cracks)','Flooring (scratches, stains)',
      'Windows (cracks, locks, screens)','Closet (doors, shelves, rods)',
      'Light fixtures & switches','Electrical outlets','Doors (hinges, locks)',
    ],
  },
  {
    name: 'Bathroom', emoji: '🚿', duplicable: true,
    checkpoints: [
      'Toilet (flush, base, seat)','Sink & faucet (leaks, stains)','Bathtub/Shower (caulking, drain, tiles)',
      'Mirror & medicine cabinet','Tile & grout (mold, cracks)','Exhaust fan',
      'Towel bars & hardware','Flooring (water damage, stains)',
    ],
  },
  {
    name: 'Hallway / Entry', emoji: '🚪',
    checkpoints: [
      'Front door (lock, deadbolt, frame)','Walls & paint','Flooring',
      'Light fixtures','Closet (if present)','Doorbell / intercom',
    ],
  },
  {
    name: 'Laundry Area', emoji: '🧺',
    checkpoints: [
      'Washer connections','Dryer vent & connections','Flooring (water stains)',
      'Walls & paint','Cabinets/shelving',
    ],
  },
  {
    name: 'Outdoor / Patio', emoji: '🌿',
    checkpoints: [
      'Patio/Balcony surface','Railings','Exterior door & lock',
      'Outdoor lighting','Screens / storm doors',
    ],
  },
];

const DEFAULT_INCLUDED = ['Living Room', 'Kitchen', 'Bedroom', 'Bathroom', 'Hallway / Entry'];

const buildDefaultRooms = () =>
  ROOM_TEMPLATES.map(t => ({
    name: t.name,
    emoji: t.emoji,
    duplicable: !!t.duplicable,
    included: DEFAULT_INCLUDED.includes(t.name),
    checkpoints: t.checkpoints.map(cp => ({ label: cp, condition: '', notes: '' })),
  }));

const CONDITION_OPTIONS = [
  { value: 'good',    label: 'Good',    dot: 'bg-emerald-500', light: 'bg-emerald-50 border-emerald-200 text-emerald-700',  dark: 'bg-emerald-900/30 border-emerald-700 text-emerald-300' },
  { value: 'fair',    label: 'Fair',    dot: 'bg-amber-500',   light: 'bg-amber-50 border-amber-200 text-amber-700',        dark: 'bg-amber-900/30 border-amber-700 text-amber-300' },
  { value: 'poor',    label: 'Poor',    dot: 'bg-orange-500',  light: 'bg-orange-50 border-orange-200 text-orange-700',      dark: 'bg-orange-900/30 border-orange-700 text-orange-300' },
  { value: 'damaged', label: 'Damaged', dot: 'bg-red-500',     light: 'bg-red-50 border-red-200 text-red-700',              dark: 'bg-red-900/30 border-red-700 text-red-300' },
  { value: 'na',      label: 'N/A',     dot: 'bg-zinc-400',    light: 'bg-stone-50 border-stone-200 text-stone-500',        dark: 'bg-zinc-700 border-zinc-600 text-zinc-400' },
];

const TODAY = new Date().toISOString().split('T')[0];

// ════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════
const RentersDepositSaver = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { callToolEndpoint, loading } = useClaudeAPI();
  const toolData = getToolById('RentersDepositSaver');

  // ── Persisted state (survives tab close) ──
  const [country, setCountry]           = usePersistentState('rds-country', 'US');
  const [region, setRegion]             = usePersistentState('rds-region', '');
  const [rooms, setRooms]               = usePersistentState('rds-rooms', buildDefaultRooms());
  const [address, setAddress]           = usePersistentState('rds-address', '');
  const [unit, setUnit]                 = usePersistentState('rds-unit', '');
  const [landlordName, setLandlordName] = usePersistentState('rds-landlordName', '');
  const [landlordEmail, setLandlordEmail] = usePersistentState('rds-landlordEmail', '');
  const [moveInDate, setMoveInDate]     = usePersistentState('rds-moveInDate', TODAY);
  const [depositAmount, setDepositAmount] = usePersistentState('rds-depositAmount', '');

  // ── Ephemeral state ──
  const [step, setStep]               = useState(1); // 1=walkthrough, 2=details, 3=results
  const [activeRoom, setActiveRoom]    = useState(() => {
    const first = buildDefaultRooms().findIndex(r => r.included);
    return first >= 0 ? first : 0;
  });
  const [customRoomName, setCustomRoomName] = useState('');
  const [results, setResults]          = useState(null);
  const [error, setError]              = useState('');
  const [copied, setCopied]            = useState({});
  const [expandedSection, setExpandedSection] = useState('report');

  // ── Rights quick-lookup state ──
  const [rightsResult, setRightsResult]   = useState(null);
  const [rightsLoading, setRightsLoading] = useState(false);
  const [rightsError, setRightsError]     = useState('');
  const [showRights, setShowRights]       = useState(false);

  // ── Theme ──
  const c = {
    card: isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-stone-200',
    text: isDark ? 'text-zinc-50' : 'text-gray-900',
    textSec: isDark ? 'text-zinc-300' : 'text-gray-600',
    textMuted: isDark ? 'text-zinc-500' : 'text-gray-500',
    input: isDark
      ? 'bg-zinc-700 border-zinc-600 text-zinc-100 placeholder:text-zinc-500 focus:border-teal-500 focus:ring-teal-500/20'
      : 'bg-white border-stone-300 text-gray-900 placeholder:text-stone-400 focus:border-teal-500 focus:ring-teal-500/20',
  };

  // ── Derived ──
  const countryObj = COUNTRIES.find(c => c.code === country) || COUNTRIES[0];
  const hasDropdownRegions = countryObj.regions && countryObj.regions.length > 0;
  const regionRequired = country === 'US' || country === 'CA' || country === 'AU';

  const locationString = (() => {
    if (country === 'OTHER') return region.trim();
    const parts = [];
    if (region.trim()) parts.push(region.trim());
    parts.push(countryObj.label);
    return parts.join(', ');
  })();
  const locationValid = country === 'OTHER' ? region.trim().length >= 2 : (!regionRequired || region.trim().length > 0);

  const includedRooms = rooms.filter(r => r.included);
  const completionStats = includedRooms.reduce(
    (acc, room) => {
      const total = room.checkpoints.length;
      const done = room.checkpoints.filter(cp => cp.condition).length;
      return { total: acc.total + total, done: acc.done + done };
    },
    { total: 0, done: 0 }
  );

  const step2Valid = address.trim() && moveInDate && locationValid;

  // If activeRoom points to an excluded room, jump to the first included one
  useEffect(() => {
    if (!rooms[activeRoom]?.included) {
      const first = rooms.findIndex(r => r.included);
      if (first >= 0) setActiveRoom(first);
    }
  }, [rooms, activeRoom]);

  // ═══════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════

  const toggleRoom = (idx) => {
    setRooms(prev => prev.map((r, i) => i === idx ? { ...r, included: !r.included } : r));
  };

  const updateCheckpoint = (roomIdx, cpIdx, field, value) => {
    setRooms(prev =>
      prev.map((r, ri) =>
        ri === roomIdx
          ? { ...r, checkpoints: r.checkpoints.map((cp, ci) => ci === cpIdx ? { ...cp, [field]: value } : cp) }
          : r
      )
    );
  };

  const updateCheckpointLabel = (roomIdx, cpIdx, label) => {
    setRooms(prev =>
      prev.map((r, ri) =>
        ri === roomIdx
          ? { ...r, checkpoints: r.checkpoints.map((cp, ci) => ci === cpIdx ? { ...cp, label } : cp) }
          : r
      )
    );
  };

  const removeCheckpoint = (roomIdx, cpIdx) => {
    setRooms(prev =>
      prev.map((r, ri) =>
        ri === roomIdx ? { ...r, checkpoints: r.checkpoints.filter((_, ci) => ci !== cpIdx) } : r
      )
    );
  };

  const addCheckpoint = (roomIdx) => {
    setRooms(prev =>
      prev.map((r, i) =>
        i === roomIdx
          ? { ...r, checkpoints: [...r.checkpoints, { label: '', condition: '', notes: '' }] }
          : r
      )
    );
  };

  const addCustomRoom = () => {
    if (!customRoomName.trim()) return;
    const newRoom = {
      name: customRoomName.trim(),
      emoji: '📋',
      duplicable: true,
      included: true,
      checkpoints: [
        { label: 'Walls & paint', condition: '', notes: '' },
        { label: 'Flooring', condition: '', notes: '' },
        { label: 'Windows', condition: '', notes: '' },
        { label: 'Light fixtures', condition: '', notes: '' },
        { label: 'Doors', condition: '', notes: '' },
      ],
    };
    setRooms(prev => [...prev, newRoom]);
    setActiveRoom(rooms.length); // jump to new room
    setCustomRoomName('');
  };

  // ── NEW: Mark remaining unrated items in a room as Good ──
  const markRemainingGood = (roomIdx) => {
    setRooms(prev =>
      prev.map((r, ri) =>
        ri === roomIdx
          ? { ...r, checkpoints: r.checkpoints.map(cp => cp.condition ? cp : { ...cp, condition: 'good' }) }
          : r
      )
    );
  };

  // ── NEW: Duplicate a room (for multiple bedrooms/bathrooms) ──
  const duplicateRoom = (idx) => {
    const room = rooms[idx];
    const baseName = room.name.replace(/\s+\d+$/, ''); // "Bedroom 2" → "Bedroom"
    const existing = rooms.filter(r => r.name === baseName || r.name.match(new RegExp(`^${baseName}\\s+\\d+$`))).length;
    const newName = `${baseName} ${existing + 1}`;

    // Also rename the original if it has no number yet
    const needsRename = room.name === baseName && existing === 1;

    const newRoom = {
      name: newName,
      emoji: room.emoji,
      duplicable: true,
      included: true,
      checkpoints: ROOM_TEMPLATES.find(t => t.name === baseName)
        ? ROOM_TEMPLATES.find(t => t.name === baseName).checkpoints.map(cp => ({ label: cp, condition: '', notes: '' }))
        : room.checkpoints.map(cp => ({ label: cp.label, condition: '', notes: '' })),
    };

    setRooms(prev => {
      let updated = [...prev];
      if (needsRename) {
        updated = updated.map((r, i) => i === idx ? { ...r, name: `${baseName} 1` } : r);
      }
      updated.splice(idx + 1, 0, newRoom);
      return updated;
    });
    setActiveRoom(idx + 1);
  };

  // ── NEW: Quick rights lookup ──
  const lookupRights = async () => {
    if (!locationValid) return;
    setRightsLoading(true);
    setRightsError('');
    setRightsResult(null);
    setShowRights(true);
    try {
      const data = await callToolEndpoint('renters-deposit-saver', {
        action: 'rights-only',
        location: locationString,
      });
      setRightsResult(data.deposit_rights);
    } catch (err) {
      setRightsError(err.message || 'Failed to look up deposit rights.');
    } finally {
      setRightsLoading(false);
    }
  };

  // ── Generate full report ──
  const generateReport = async () => {
    setError('');
    setResults(null);

    const checklistData = includedRooms.map(room => ({
      room: room.name,
      items: room.checkpoints
        .filter(cp => cp.condition && cp.condition !== 'na')
        .map(cp => ({ item: cp.label, condition: cp.condition, notes: cp.notes || null })),
    }));

    try {
      const data = await callToolEndpoint('renters-deposit-saver', {
        address: address.trim(), unit: unit.trim(),
        landlordName: landlordName.trim(), landlordEmail: landlordEmail.trim(),
        moveInDate, location: locationString,
        depositAmount: depositAmount.trim(), checklist: checklistData,
      });
      setResults(data);
      setStep(3);
    } catch (err) {
      setError(err.message || 'Failed to generate report. Please try again.');
    }
  };

  // ── Copy helpers ──
  const copySection = useCallback((key, text) => {
    navigator.clipboard.writeText(text);
    setCopied(prev => ({ ...prev, [key]: true }));
    setTimeout(() => setCopied(prev => ({ ...prev, [key]: false })), 2000);
  }, []);

  const copyAll = useCallback(() => {
    if (!results) return;
    const divider = '\n\n' + '═'.repeat(50) + '\n\n';
    const sections = [];
    if (results.condition_report)  sections.push('MOVE-IN CONDITION REPORT\n' + '─'.repeat(30) + '\n\n' + results.condition_report);
    if (results.landlord_letter)   sections.push('LANDLORD COVER LETTER\n' + '─'.repeat(30) + '\n\n' + results.landlord_letter);
    if (results.photo_shot_list)   sections.push('PHOTO SHOT LIST\n' + '─'.repeat(30) + '\n\n' + results.photo_shot_list);
    if (results.deposit_rights)    sections.push('DEPOSIT RIGHTS\n' + '─'.repeat(30) + '\n\n' + results.deposit_rights);
    if (results.move_out_tips)     sections.push('MOVE-OUT TIPS\n' + '─'.repeat(30) + '\n\n' + results.move_out_tips);
    navigator.clipboard.writeText(sections.join(divider));
    setCopied(prev => ({ ...prev, all: true }));
    setTimeout(() => setCopied(prev => ({ ...prev, all: false })), 2000);
  }, [results]);

  // ── Print helpers ──
  const buildPrintHTML = useCallback((title, body) => {
    const escaped = body.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title>
<style>
body{font-family:-apple-system,'Segoe UI',Helvetica,sans-serif;max-width:750px;margin:40px auto;padding:0 24px;color:#1c1917;line-height:1.7;font-size:13px}
h1{font-size:1.4em;margin-bottom:2px}
.sub{color:#78716c;font-size:0.85em;margin-bottom:20px}
pre{white-space:pre-wrap;word-wrap:break-word;font-family:inherit;margin:0}
.disclaimer{margin-top:24px;padding:12px;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;font-size:0.85em;color:#92400e}
@media print{body{margin:16px;font-size:12px}.disclaimer{background:#fff;border-color:#d1d5db}}
</style></head><body>
<h1>🏦 ${title}</h1>
<div class="sub">${address ? address : 'Move-In Documentation'} · ${moveInDate || ''} · ${locationString}</div>
<pre>${escaped}</pre>
</body></html>`;
  }, [address, moveInDate, locationString]);

  const printSection = useCallback((title, body) => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(buildPrintHTML(title, body));
    w.document.close();
    setTimeout(() => { try { w.focus(); w.print(); } catch(e) { /* blocked */ } }, 300);
  }, [buildPrintHTML]);

  const printAll = useCallback(() => {
    if (!results) return;
    const divider = '\n\n' + '═'.repeat(60) + '\n\n';
    const sections = [];
    if (results.condition_report)  sections.push('MOVE-IN CONDITION REPORT\n' + '─'.repeat(40) + '\n\n' + results.condition_report);
    if (results.landlord_letter)   sections.push('LANDLORD COVER LETTER\n' + '─'.repeat(40) + '\n\n' + results.landlord_letter);
    if (results.photo_shot_list)   sections.push('PHOTO SHOT LIST\n' + '─'.repeat(40) + '\n\n' + results.photo_shot_list);
    if (results.deposit_rights)    sections.push('DEPOSIT RIGHTS\n' + '─'.repeat(40) + '\n\n' + results.deposit_rights);
    if (results.move_out_tips)     sections.push('MOVE-OUT TIPS\n' + '─'.repeat(40) + '\n\n' + results.move_out_tips);
    printSection('Complete Move-In Documentation', sections.join(divider));
  }, [results, printSection]);

  // ── Reset ──
  const reset = () => {
    setStep(1);
    setCountry('US');
    setRegion('');
    setAddress('');
    setUnit('');
    setLandlordName('');
    setLandlordEmail('');
    setMoveInDate(TODAY);
    setDepositAmount('');
    setRooms(buildDefaultRooms());
    setActiveRoom(0);
    setResults(null);
    setError('');
    setExpandedSection('report');
    setRightsResult(null);
    setRightsError('');
    setShowRights(false);
  };

  // Check if user has any persisted progress
  const hasProgress = rooms.some(r => r.included && r.checkpoints.some(cp => cp.condition));

  // ════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════
  return (
    <div>

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className={`text-2xl font-bold ${c.text}`}>{toolData?.title || "Renter's Deposit Saver"} {toolData?.icon || '🏦'}</h2>
          <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>{toolData?.tagline || 'Protect your security deposit on move-in day'}</p>
        </div>
        {hasProgress && step < 3 && (
          <div className={`flex items-center gap-1.5 text-xs ${isDark ? 'text-teal-400' : 'text-teal-600'}`}>
            <Save className="w-3.5 h-3.5" />
            <span className="font-medium">Progress saved</span>
          </div>
        )}
      </div>

      {/* ── Step indicator ── */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {[
          { num: 1, label: 'Walkthrough' },
          { num: 2, label: 'Details' },
          { num: 3, label: 'Report' },
        ].map(({ num, label }) => (
          <React.Fragment key={num}>
            {num > 1 && (
              <div className={`w-8 h-px ${step >= num ? 'bg-teal-400' : isDark ? 'bg-zinc-600' : 'bg-stone-300'}`} />
            )}
            <button
              onClick={() => { if (num < step) setStep(num); }}
              disabled={num > step}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                step === num
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-200 dark:shadow-teal-900/40'
                  : step > num
                  ? isDark ? 'bg-teal-900/40 text-teal-300 hover:bg-teal-800/50 cursor-pointer'
                    : 'bg-teal-100 text-teal-700 hover:bg-teal-200 cursor-pointer'
                  : isDark ? 'bg-zinc-700 text-zinc-500' : 'bg-stone-100 text-stone-400'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                step > num ? 'bg-teal-500 text-white' : step === num ? 'bg-white/20 text-white' : ''
              }`}>
                {step > num ? '✓' : num}
              </span>
              <span className="hidden sm:inline">{label}</span>
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* STEP 1: WALKTHROUGH (the urgent part)              */}
      {/* ═══════════════════════════════════════════════════ */}
      {step === 1 && (
        <div className="space-y-4">

          {/* ── Location bar + Rights lookup ── */}
          <div className={`${c.card} border rounded-2xl shadow-lg p-4 sm:p-5`}>
            <div className="flex items-center gap-2 mb-3">
              <Scale className={`w-4 h-4 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />
              <h3 className={`text-sm font-bold ${c.text}`}>Your Location</h3>
              <span className={`text-xs ${c.textMuted}`}>(for deposit law lookup)</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-3">
              {/* Country */}
              <select
                value={country}
                onChange={e => { setCountry(e.target.value); setRegion(''); setRightsResult(null); setShowRights(false); }}
                className={`sm:w-48 p-2.5 border rounded-lg text-sm outline-none focus:ring-2 transition-colors ${c.input}`}
              >
                {COUNTRIES.map(c => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>

              {/* Region: dropdown for US/CA/UK/AU, freetext for others */}
              <div className="flex-1">
                {hasDropdownRegions ? (
                  <select
                    value={region}
                    onChange={e => { setRegion(e.target.value); setRightsResult(null); setShowRights(false); }}
                    className={`w-full p-2.5 border rounded-lg text-sm outline-none focus:ring-2 transition-colors ${c.input}`}
                  >
                    <option value="">Select {countryObj.regionLabel}…</option>
                    {countryObj.regions.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={region}
                    onChange={e => { setRegion(e.target.value); setRightsResult(null); setShowRights(false); }}
                    placeholder={countryObj.regionLabel}
                    className={`w-full p-2.5 border rounded-lg text-sm outline-none focus:ring-2 transition-colors ${c.input}`}
                  />
                )}
              </div>

              {/* Rights lookup button */}
              <button
                onClick={lookupRights}
                disabled={!locationValid || rightsLoading}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                  !locationValid
                    ? isDark ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed' : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                    : 'bg-teal-600 hover:bg-teal-700 text-white'
                }`}
              >
                {rightsLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                {rightsLoading ? 'Looking up…' : 'Look Up My Rights'}
              </button>
            </div>

            {/* Quick rights result */}
            {showRights && (
              <div className={`mt-3 rounded-xl border p-4 ${isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-stone-50 border-stone-200'}`}>
                {rightsLoading && (
                  <div className={`flex items-center gap-2 ${c.textMuted} text-sm`}>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Looking up deposit rights for {locationString}…
                  </div>
                )}
                {rightsError && (
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className={`text-sm ${isDark ? 'text-red-300' : 'text-red-700'}`}>{rightsError}</p>
                  </div>
                )}
                {rightsResult && (
                  <>
                    <div className="flex items-start justify-between mb-2">
                      <h4 className={`text-sm font-bold ${c.text} flex items-center gap-1.5`}>
                        <Scale className={`w-4 h-4 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />
                        Deposit Rights — {locationString}
                      </h4>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => copySection('quickRights', rightsResult)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 transition-colors"
                        >
                          {copied.quickRights ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          {copied.quickRights ? 'Copied' : 'Copy'}
                        </button>
                        <button
                          onClick={() => printSection('Deposit Rights — ' + locationString, rightsResult)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 transition-colors"
                        >
                          <Printer className="w-3 h-3" />
                          Print
                        </button>
                        <button
                          onClick={() => setShowRights(false)}
                          className={`p-1 rounded-lg transition-colors ${isDark ? 'hover:bg-zinc-700 text-zinc-400' : 'hover:bg-stone-200 text-stone-400'}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className={`text-xs leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>
                      {rightsResult}
                    </div>
                    <div className={`mt-3 p-2 rounded-lg text-xs ${isDark ? 'bg-amber-900/20 text-amber-300' : 'bg-amber-50 text-amber-800'}`}>
                      This is general legal information, not legal advice. Consult a local tenant rights attorney for specific disputes.
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* ── Room selector bar ── */}
          <div className={`${c.card} border rounded-2xl shadow-lg p-4`}>
            <div className="flex items-center justify-between mb-3">
              <h2 className={`text-lg font-bold ${c.text} flex items-center gap-2`}>
                <ClipboardCheck className={`w-5 h-5 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />
                Room Walkthrough
              </h2>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                completionStats.done === completionStats.total && completionStats.total > 0
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                  : isDark ? 'bg-zinc-700 text-zinc-300' : 'bg-stone-100 text-gray-600'
              }`}>
                {completionStats.done}/{completionStats.total} items
              </span>
            </div>

            {/* Room tabs with per-room progress */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {rooms.map((room, idx) => {
                const roomDone = room.included ? room.checkpoints.filter(cp => cp.condition).length : 0;
                const roomTotal = room.included ? room.checkpoints.length : 0;
                const isComplete = room.included && roomDone === roomTotal && roomTotal > 0;

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      if (!room.included) toggleRoom(idx);
                      setActiveRoom(idx);
                    }}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                      !room.included
                        ? isDark ? 'border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600'
                          : 'border-stone-200 text-stone-400 hover:text-gray-600 hover:border-stone-300'
                        : activeRoom === idx
                        ? 'border-teal-300 bg-teal-50 text-teal-700 dark:border-teal-600 dark:bg-teal-900/40 dark:text-teal-300'
                        : isComplete
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                        : isDark ? 'border-zinc-600 bg-zinc-700 text-zinc-200' : 'border-stone-200 bg-white text-gray-700'
                    }`}
                  >
                    <span className="text-sm">{room.emoji}</span>
                    <span className="hidden sm:inline">{room.name}</span>
                    {room.included && isComplete && <CheckCircle className="w-3 h-3 text-emerald-500 ml-0.5" />}
                    {room.included && !isComplete && roomTotal > 0 && (
                      <span className={`text-[10px] font-bold ml-0.5 ${isDark ? 'text-zinc-400' : 'text-stone-400'}`}>
                        {roomDone}/{roomTotal}
                      </span>
                    )}
                    {!room.included && <Plus className="w-3 h-3 ml-0.5" />}
                  </button>
                );
              })}
            </div>

            {/* Add custom room */}
            <div className="flex gap-2">
              <input
                type="text"
                value={customRoomName}
                onChange={e => setCustomRoomName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCustomRoom()}
                placeholder="Add custom room…"
                className={`flex-1 p-2 border rounded-lg text-xs outline-none focus:ring-2 transition-colors ${c.input}`}
              />
              <button
                onClick={addCustomRoom}
                disabled={!customRoomName.trim()}
                className="px-3 py-2 rounded-lg text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 disabled:bg-stone-300 disabled:text-stone-500 dark:disabled:bg-zinc-600 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* ── Active room checklist ── */}
          {rooms[activeRoom] && rooms[activeRoom].included && (
            <div className={`${c.card} border rounded-2xl shadow-lg p-4 sm:p-6`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-bold ${c.text} flex items-center gap-2`}>
                  <span className="text-xl">{rooms[activeRoom].emoji}</span>
                  {rooms[activeRoom].name}
                </h3>
                <div className="flex items-center gap-2">
                  {/* Duplicate button */}
                  {(rooms[activeRoom].duplicable || ROOM_TEMPLATES.find(t => rooms[activeRoom].name.replace(/\s+\d+$/, '') === t.name)?.duplicable) && (
                    <button
                      onClick={() => duplicateRoom(activeRoom)}
                      className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors ${
                        isDark ? 'text-teal-400 hover:bg-teal-900/30' : 'text-teal-600 hover:bg-teal-50'
                      }`}
                    >
                      <CopyPlus className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Duplicate</span>
                    </button>
                  )}
                  <button
                    onClick={() => toggleRoom(activeRoom)}
                    className={`text-xs font-medium px-2.5 py-1 rounded-lg transition-colors ${
                      isDark ? 'text-red-400 hover:bg-red-900/30' : 'text-red-500 hover:bg-red-50'
                    }`}
                  >
                    Remove
                  </button>
                </div>
              </div>

              {/* Mark remaining as Good */}
              {rooms[activeRoom].checkpoints.some(cp => !cp.condition) && (
                <button
                  onClick={() => markRemainingGood(activeRoom)}
                  className={`w-full mb-4 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-bold transition-colors ${
                    isDark
                      ? 'border-emerald-700 text-emerald-400 hover:bg-emerald-900/20'
                      : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark {rooms[activeRoom].checkpoints.filter(cp => !cp.condition).length} remaining as Good
                </button>
              )}

              <div className="space-y-3">
                {rooms[activeRoom].checkpoints.map((cp, cpIdx) => (
                  <div
                    key={cpIdx}
                    className={`rounded-xl border p-3 transition-colors ${
                      cp.condition === 'damaged'
                        ? isDark ? 'border-red-800 bg-red-900/20' : 'border-red-200 bg-red-50/50'
                        : cp.condition === 'poor'
                        ? isDark ? 'border-orange-800 bg-orange-900/20' : 'border-orange-200 bg-orange-50/50'
                        : isDark ? 'border-zinc-700 bg-zinc-800/50' : 'border-stone-200 bg-white'
                    }`}
                  >
                    {/* Checkpoint label */}
                    <div className="flex items-center justify-between mb-2">
                      <input
                        type="text"
                        value={cp.label}
                        onChange={e => updateCheckpointLabel(activeRoom, cpIdx, e.target.value)}
                        className={`font-semibold text-sm bg-transparent outline-none flex-1 ${c.text}`}
                        placeholder="Item to check…"
                      />
                      <button
                        onClick={() => removeCheckpoint(activeRoom, cpIdx)}
                        className={`p-1 rounded-lg transition-colors ${isDark ? 'hover:bg-zinc-700 text-zinc-500' : 'hover:bg-stone-100 text-stone-400'}`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Condition buttons */}
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {CONDITION_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => updateCheckpoint(activeRoom, cpIdx, 'condition', opt.value)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                            cp.condition === opt.value
                              ? `${isDark ? opt.dark : opt.light} ring-1 ring-offset-1 ${isDark ? 'ring-offset-zinc-800' : 'ring-offset-white'} ring-current`
                              : isDark ? 'border-zinc-600 text-zinc-400 hover:text-zinc-200'
                                : 'border-stone-200 text-stone-400 hover:text-gray-600'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${cp.condition === opt.value ? opt.dot : isDark ? 'bg-zinc-600' : 'bg-stone-300'}`} />
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    {/* Notes */}
                    {(cp.condition === 'poor' || cp.condition === 'damaged' || cp.condition === 'fair' || cp.notes) && (
                      <textarea
                        value={cp.notes}
                        onChange={e => updateCheckpoint(activeRoom, cpIdx, 'notes', e.target.value)}
                        placeholder={
                          cp.condition === 'damaged'
                            ? 'Describe the damage in detail (size, location, severity)…'
                            : cp.condition === 'poor'
                            ? 'Describe what you see (wear, staining, etc.)…'
                            : 'Optional notes…'
                        }
                        rows={2}
                        className={`w-full p-2.5 border rounded-lg text-xs outline-none focus:ring-2 resize-none transition-colors ${c.input}`}
                      />
                    )}
                  </div>
                ))}

                {/* Add checkpoint */}
                <button
                  onClick={() => addCheckpoint(activeRoom)}
                  className={`w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 border-dashed text-xs font-bold transition-colors ${
                    isDark
                      ? 'border-zinc-600 text-zinc-400 hover:border-teal-600 hover:text-teal-400'
                      : 'border-stone-300 text-stone-400 hover:border-teal-400 hover:text-teal-600'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add item to check
                </button>
              </div>
            </div>
          )}

          {/* Photo tips card */}
          <div className={`${c.card} border rounded-2xl shadow-lg p-4 sm:p-5`}>
            <div className="flex items-start gap-3">
              <Camera className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />
              <div>
                <h4 className={`text-sm font-bold ${c.text} mb-1.5`}>Photo Tips</h4>
                <div className={`text-xs ${c.textSec} space-y-1`}>
                  <p>Take wide shots of each room first, then close-ups of any damage.</p>
                  <p>Make sure your phone's date & location metadata is on — this timestamps your photos.</p>
                  <p>Email the photos to yourself immediately — this creates a third-party timestamp.</p>
                  <p>For damage, include a coin or ruler for scale.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-end">
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white bg-teal-600 hover:bg-teal-700 transition-colors shadow-md shadow-teal-100 dark:shadow-none"
            >
              Next: Property Details
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* STEP 2: PROPERTY DETAILS                           */}
      {/* ═══════════════════════════════════════════════════ */}
      {step === 2 && (
        <div className={`${c.card} border rounded-2xl shadow-lg p-6 sm:p-8`}>
          <div className="flex items-center gap-2 mb-6">
            <Home className={`w-5 h-5 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />
            <h2 className={`text-xl font-bold ${c.text}`}>Property Details</h2>
          </div>

          <div className="space-y-5">
            {/* Address */}
            <div>
              <label className={`block text-sm font-semibold ${c.text} mb-1.5`}>
                Property Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="123 Main Street, Chicago, IL 60601"
                className={`w-full p-3 border rounded-lg outline-none focus:ring-2 transition-colors ${c.input}`}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Unit */}
              <div>
                <label className={`block text-sm font-semibold ${c.text} mb-1.5`}>Unit / Apt #</label>
                <input
                  type="text"
                  value={unit}
                  onChange={e => setUnit(e.target.value)}
                  placeholder="4B"
                  className={`w-full p-3 border rounded-lg outline-none focus:ring-2 transition-colors ${c.input}`}
                />
              </div>

              {/* Move-in date (defaults to today) */}
              <div>
                <label className={`block text-sm font-semibold ${c.text} mb-1.5`}>
                  Move-In Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={moveInDate}
                  onChange={e => setMoveInDate(e.target.value)}
                  className={`w-full p-3 border rounded-lg outline-none focus:ring-2 transition-colors ${c.input}`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Location display (set in step 1) */}
              <div>
                <label className={`block text-sm font-semibold ${c.text} mb-1.5`}>
                  Location <span className="text-red-500">*</span>
                </label>
                <div className={`flex items-center gap-2 p-3 border rounded-lg ${isDark ? 'bg-zinc-700/50 border-zinc-600' : 'bg-stone-50 border-stone-200'}`}>
                  <span className={`text-sm ${locationValid ? c.text : isDark ? 'text-red-400' : 'text-red-600'}`}>
                    {locationValid ? locationString : 'Set location in Step 1'}
                  </span>
                  {!locationValid && (
                    <button onClick={() => setStep(1)} className="text-xs font-bold text-teal-600 hover:underline ml-auto">Edit</button>
                  )}
                </div>
              </div>

              {/* Deposit amount */}
              <div>
                <label className={`block text-sm font-semibold ${c.text} mb-1.5`}>Security Deposit Amount</label>
                <input
                  type="text"
                  value={depositAmount}
                  onChange={e => setDepositAmount(e.target.value)}
                  placeholder="$1,500"
                  className={`w-full p-3 border rounded-lg outline-none focus:ring-2 transition-colors ${c.input}`}
                />
              </div>
            </div>

            <div className={`border-t ${isDark ? 'border-zinc-700' : 'border-stone-200'} pt-5`}>
              <p className={`text-xs font-bold uppercase tracking-wider ${c.textMuted} mb-3`}>Landlord / Property Manager (optional)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${c.textSec} mb-1.5`}>Name</label>
                  <input
                    type="text"
                    value={landlordName}
                    onChange={e => setLandlordName(e.target.value)}
                    placeholder="Jane Smith"
                    className={`w-full p-3 border rounded-lg outline-none focus:ring-2 transition-colors ${c.input}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${c.textSec} mb-1.5`}>Email</label>
                  <input
                    type="email"
                    value={landlordEmail}
                    onChange={e => setLandlordEmail(e.target.value)}
                    placeholder="landlord@email.com"
                    className={`w-full p-3 border rounded-lg outline-none focus:ring-2 transition-colors ${c.input}`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={() => setStep(1)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                isDark ? 'text-zinc-300 hover:bg-zinc-700' : 'text-gray-600 hover:bg-stone-100'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={generateReport}
              disabled={loading || !step2Valid || completionStats.done === 0}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:bg-stone-300 disabled:text-stone-500 dark:disabled:bg-zinc-600 dark:disabled:text-zinc-400 transition-colors shadow-md shadow-teal-100 dark:shadow-none"
            >
              {loading ? (
                <>
                  <span className="animate-spin inline-block">⏳</span>
                  Generating Report…
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  Generate Report
                </>
              )}
            </button>
          </div>

          {error && (
            <div className={`mt-4 p-4 rounded-xl flex items-start gap-3 ${isDark ? 'bg-red-900/30 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className={`text-sm ${isDark ? 'text-red-300' : 'text-red-800'}`}>{error}</p>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* STEP 3: GENERATED RESULTS                          */}
      {/* ═══════════════════════════════════════════════════ */}
      {step === 3 && results && (
        <div className="space-y-4">

          {/* Section tabs + Copy All */}
          <div className={`${c.card} border rounded-2xl shadow-lg p-3 flex flex-wrap items-center gap-1.5`}>
            {[
              { key: 'report', label: 'Condition Report', icon: ClipboardCheck },
              { key: 'letter', label: 'Landlord Letter', icon: FileText },
              { key: 'photos', label: 'Photo Shot List', icon: Camera },
              { key: 'rights', label: 'Your Rights', icon: Scale },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setExpandedSection(key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                  expandedSection === key
                    ? 'bg-teal-600 text-white shadow-md'
                    : isDark ? 'text-zinc-300 hover:bg-zinc-700' : 'text-gray-600 hover:bg-stone-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}

            {/* Copy All + Print All */}
            <div className="ml-auto flex gap-1.5">
              <button
                onClick={copyAll}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                  copied.all
                    ? 'bg-emerald-600 text-white'
                    : isDark ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600' : 'bg-stone-100 text-gray-600 hover:bg-stone-200'
                }`}
              >
                {copied.all ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied.all ? 'Copied All' : 'Copy All'}
              </button>
              <button
                onClick={printAll}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                  isDark ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600' : 'bg-stone-100 text-gray-600 hover:bg-stone-200'
                }`}
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Print All</span>
              </button>
            </div>
          </div>

          {/* ── Condition Report ── */}
          {expandedSection === 'report' && results.condition_report && (
            <div className={`${c.card} border rounded-2xl shadow-lg p-5 sm:p-6`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className={`text-xl font-bold ${c.text} flex items-center gap-2`}>
                    <ClipboardCheck className={`w-5 h-5 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />
                    Move-In Condition Report
                  </h3>
                  <p className={`text-xs ${c.textMuted} mt-1`}>Formal documentation for your records</p>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => copySection('report', results.condition_report)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 transition-colors"
                  >
                    {copied.report ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied.report ? 'Copied!' : 'Copy'}
                  </button>
                  <button
                    onClick={() => printSection('Move-In Condition Report', results.condition_report)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print
                  </button>
                </div>
              </div>
              <div className={`rounded-xl border p-5 text-sm leading-relaxed whitespace-pre-wrap font-mono ${
                isDark ? 'bg-zinc-900 border-zinc-700 text-zinc-200' : 'bg-stone-50 border-stone-200 text-gray-800'
              }`}>
                {results.condition_report}
              </div>
            </div>
          )}

          {/* ── Landlord Letter ── */}
          {expandedSection === 'letter' && results.landlord_letter && (
            <div className={`${c.card} border rounded-2xl shadow-lg p-5 sm:p-6`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className={`text-xl font-bold ${c.text} flex items-center gap-2`}>
                    <FileText className={`w-5 h-5 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />
                    Landlord Cover Letter
                  </h3>
                  <p className={`text-xs ${c.textMuted} mt-1`}>Send this with your condition report</p>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => copySection('letter', results.landlord_letter)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 transition-colors"
                  >
                    {copied.letter ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied.letter ? 'Copied!' : 'Copy'}
                  </button>
                  <button
                    onClick={() => printSection('Landlord Cover Letter', results.landlord_letter)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print
                  </button>
                </div>
              </div>
              <div className={`rounded-xl border p-5 text-sm leading-relaxed whitespace-pre-wrap ${
                isDark ? 'bg-zinc-900 border-zinc-700 text-zinc-200' : 'bg-stone-50 border-stone-200 text-gray-800'
              }`}>
                {results.landlord_letter}
              </div>
            </div>
          )}

          {/* ── Photo Shot List ── */}
          {expandedSection === 'photos' && results.photo_shot_list && (
            <div className={`${c.card} border rounded-2xl shadow-lg p-5 sm:p-6`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className={`text-xl font-bold ${c.text} flex items-center gap-2`}>
                    <Camera className={`w-5 h-5 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />
                    Photo Shot List
                  </h3>
                  <p className={`text-xs ${c.textMuted} mt-1`}>Every photo you should take today</p>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => copySection('photos', results.photo_shot_list)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 transition-colors"
                  >
                    {copied.photos ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied.photos ? 'Copied!' : 'Copy'}
                  </button>
                  <button
                    onClick={() => printSection('Photo Shot List', results.photo_shot_list)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print
                  </button>
                </div>
              </div>
              <div className={`rounded-xl border p-5 text-sm leading-relaxed whitespace-pre-wrap ${
                isDark ? 'bg-zinc-900 border-zinc-700 text-zinc-200' : 'bg-stone-50 border-stone-200 text-gray-800'
              }`}>
                {results.photo_shot_list}
              </div>
            </div>
          )}

          {/* ── Your Rights ── */}
          {expandedSection === 'rights' && results.deposit_rights && (
            <div className={`${c.card} border rounded-2xl shadow-lg p-5 sm:p-6`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className={`text-xl font-bold ${c.text} flex items-center gap-2`}>
                    <Scale className={`w-5 h-5 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />
                    Your Security Deposit Rights
                  </h3>
                  <p className={`text-xs ${c.textMuted} mt-1`}>Based on {locationString} law</p>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => copySection('rights', results.deposit_rights)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 transition-colors"
                  >
                    {copied.rights ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied.rights ? 'Copied!' : 'Copy'}
                  </button>
                  <button
                    onClick={() => printSection('Security Deposit Rights — ' + locationString, results.deposit_rights)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print
                  </button>
                </div>
              </div>
              <div className={`rounded-xl border p-5 text-sm leading-relaxed whitespace-pre-wrap ${
                isDark ? 'bg-zinc-900 border-zinc-700 text-zinc-200' : 'bg-stone-50 border-stone-200 text-gray-800'
              }`}>
                {results.deposit_rights}
              </div>

              {/* Disclaimer */}
              <div className={`mt-4 p-3 rounded-lg text-xs ${isDark ? 'bg-amber-900/20 text-amber-300' : 'bg-amber-50 text-amber-800'}`}>
                <strong>Note:</strong> This is general legal information, not legal advice. For specific disputes, consult a local tenant rights attorney or your area's tenant union.
              </div>
            </div>
          )}

          {/* Move-out reminder */}
          {results.move_out_tips && (
            <div className={`${c.card} border rounded-2xl shadow-lg p-5`}>
              <div className="flex items-start gap-3">
                <Lightbulb className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDark ? 'text-amber-400' : 'text-amber-500'}`} />
                <div>
                  <h4 className={`text-sm font-bold ${c.text} mb-1.5`}>When You Move Out</h4>
                  <div className={`text-xs ${c.textSec} whitespace-pre-wrap leading-relaxed`}>
                    {results.move_out_tips}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep(1)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                isDark ? 'text-zinc-300 hover:bg-zinc-800' : 'text-gray-600 hover:bg-white'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Edit Walkthrough
            </button>
            <button
              onClick={reset}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                isDark ? 'text-zinc-300 hover:bg-zinc-800' : 'text-gray-600 hover:bg-white'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              Start Over
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

RentersDepositSaver.displayName = 'RentersDepositSaver';
export default RentersDepositSaver;
