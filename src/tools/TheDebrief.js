import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';
import { usePersistentState } from '../hooks/usePersistentState';
import { CopyBtn, ActionBar } from '../components/ActionButtons';

// ════════════════════════════════════════════════════════════
// THEME — Navy & Gold
// ════════════════════════════════════════════════════════════
const useColors = () => {
  const { theme } = useTheme();
  const d = theme === 'dark';
  return {
    card:        d ? 'bg-[#2a2623] border-[#3d3630]'  : 'bg-white border-[#e8e1d5]',
    cardAlt:     d ? 'bg-[#332e2a] border-[#3d3630]'  : 'bg-[#faf8f5] border-[#e8e1d5]',
    inset:       d ? 'bg-[#1a1816]'                    : 'bg-[#faf8f5]',
    inputBg:     d ? 'bg-[#1a1816] border-[#3d3630] text-[#f0eeea] placeholder-[#8a8275] focus:border-[#4a6a8a] focus:ring-[#4a6a8a]/20'
                    : 'bg-[#faf8f5] border-[#d5cab8] text-[#3d3935] placeholder-[#8a8275] focus:border-[#4a6a8a] focus:ring-[#4a6a8a]/20',
    text:        d ? 'text-[#f0eeea]'  : 'text-[#3d3935]',
    heading:     d ? 'text-[#f3efe8]'  : 'text-[#1e2a3a]',
    textSec:     d ? 'text-[#c8c3b9]'  : 'text-[#5a544a]',
    textMut:     d ? 'text-[#8a8275]'  : 'text-[#8a8275]',
    btn:         d ? 'bg-[#2c4a6e] hover:bg-[#4a6a8a] text-white' : 'bg-[#2c4a6e] hover:bg-[#1e3a58] text-white',
    btnSec:      d ? 'bg-[#332e2a] hover:bg-[#3d3630] text-[#c8c3b9] border border-[#3d3630]' : 'bg-[#f3efe8] hover:bg-[#e8e1d5] text-[#5e5042] border border-[#d5cab8]',
    btnDis:      d ? 'bg-[#332e2a] text-[#5a544a] cursor-not-allowed' : 'bg-[#e8e1d5] text-[#8a8275] cursor-not-allowed',
    pillActive:  d ? 'border-[#4a6a8a] bg-[#2c4a6e]/30 text-[#a8b9ce]' : 'border-[#2c4a6e] bg-[#d4dde8] text-[#1e3a58]',
    pillInactive: d ? 'border-[#3d3630] text-[#8a8275] hover:border-[#5a544a]' : 'border-[#d5cab8] text-[#5a544a] hover:border-[#8a8275]',
    badge:       d ? 'bg-[#2c4a6e]/30 text-[#a8b9ce]' : 'bg-[#d4dde8] text-[#1e3a58]',
    divider:     d ? 'border-[#3d3630]' : 'border-[#e8e1d5]',
    tipBg:       d ? 'bg-[#c8872e]/10 border-[#c8872e]/30' : 'bg-[#f9edd8] border-[#c8872e]/30',
    tipText:     d ? 'text-[#d9a04e]' : 'text-[#93541f]',
    successBg:   d ? 'bg-[#5a8a5c]/10 border-[#5a8a5c]/30' : 'bg-[#e8f0e8] border-[#5a8a5c]/30',
    successText: d ? 'text-[#7aba7c]' : 'text-[#3a6a3c]',
    warnBg:      d ? 'bg-[#b54a3f]/10 border-[#b54a3f]/30' : 'bg-[#fceae8] border-[#e8a8a0]',
    warnText:    d ? 'text-[#e88880]' : 'text-[#b54a3f]',
    infoBg:      d ? 'bg-[#2c4a6e]/15 border-[#4a6a8a]/30' : 'bg-[#d4dde8]/30 border-[#2c4a6e]/15',
    infoText:    d ? 'text-[#a8b9ce]' : 'text-[#1e3a58]',
    errBg:       d ? 'bg-[#b54a3f]/15 border-[#b54a3f]/40' : 'bg-[#fceae8] border-[#e8a8a0]',
    errText:     d ? 'text-[#e88880]' : 'text-[#b54a3f]',
    histBg:      d ? 'bg-[#2c4a6e]/10 border-[#4a6a8a]/30' : 'bg-[#d4dde8]/30 border-[#2c4a6e]/15',
    histCard:    d ? 'bg-[#2a2623] border-[#3d3630]' : 'bg-white border-[#e8e1d5]',
    linkStyle:   d ? 'text-[#6e8aaa] hover:text-[#a8b9ce] underline' : 'text-[#2c4a6e] hover:text-[#1e3a58] underline',
    // Priority
    highPri:     d ? 'bg-[#b54a3f]/20 text-[#e88880]' : 'bg-[#fceae8] text-[#b54a3f]',
    medPri:      d ? 'bg-[#c8872e]/15 text-[#d9a04e]' : 'bg-[#f9edd8] text-[#93541f]',
    lowPri:      d ? 'bg-[#5a8a5c]/15 text-[#7aba7c]' : 'bg-[#e8f0e8] text-[#3a6a3c]',
  };
};

// ════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════
const MODES = [
  { value: 'distill',   emoji: '📋', label: 'Distill',    desc: 'Decisions & action items' },
  { value: 'followup',  emoji: '📨', label: 'Follow Up',  desc: 'Draft messages' },
  { value: 'series',    emoji: '🔄', label: 'Series',     desc: 'Cross-meeting patterns' },
];

const MEETING_TYPES = [
  { value: 'general',    label: '📋 General' },
  { value: 'standup',    label: '🏃 Standup / Sync' },
  { value: 'planning',   label: '🗺️ Planning' },
  { value: 'retro',      label: '🔄 Retrospective' },
  { value: 'one_on_one', label: '👥 1:1' },
  { value: 'client',     label: '🤝 Client' },
  { value: 'brainstorm', label: '💡 Brainstorm' },
];

const TONES = [
  { value: 'professional', label: '👔 Professional' },
  { value: 'formal',       label: '🎩 Formal' },
  { value: 'casual',       label: '😊 Casual' },
];

const PRI_BADGE = { high: '🔴', medium: '🟡', low: '🟢' };

// ════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════
const TheDebrief = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const c = useColors();
  const resultsRef = useRef(null);

  const [history, setHistory] = usePersistentState('the-debrief-history', []);
  const [showHistory, setShowHistory] = useState(false);

  // Mode
  const [mode, setMode] = useState('distill');

  // Shared input
  const [transcript, setTranscript] = useState('');
  const [meetingType, setMeetingType] = useState('general');
  const [attendees, setAttendees] = useState('');
  const [context, setContext] = useState('');

  // Follow-up options
  const [tone, setTone] = useState('professional');

  // Series mode
  const [meetings, setMeetings] = useState([
    { title: '', date: '', transcript: '' },
    { title: '', date: '', transcript: '' },
  ]);

  // Results
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [expandedSections, setExpandedSections] = useState({});

  useEffect(() => {
    if (results && resultsRef.current) {
      setTimeout(() => resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
    }
  }, [results]);

  const charCount = useMemo(() => {
    if (mode === 'series') return meetings.reduce((sum, m) => sum + (m.transcript?.length || 0), 0);
    return transcript.length;
  }, [mode, transcript, meetings]);

  // Series helpers
  const addMeeting = useCallback(() => { if (meetings.length < 5) setMeetings(p => [...p, { title: '', date: '', transcript: '' }]); }, [meetings.length]);
  const removeMeeting = useCallback((i) => { if (meetings.length > 2) setMeetings(p => p.filter((_, idx) => idx !== i)); }, [meetings.length]);
  const updateMeeting = useCallback((i, field, val) => setMeetings(p => p.map((m, idx) => idx === i ? { ...m, [field]: val } : m)), []);

  const toggleSection = useCallback((key) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] })), []);

  const canSubmit = mode === 'series'
    ? meetings.filter(m => m.transcript?.trim()).length >= 2
    : transcript.trim().length > 0;

  // ── API ──
  const submit = useCallback(async () => {
    setError(''); setResults(null); setExpandedSections({});
    try {
      let data;
      if (mode === 'distill') {
        if (!transcript.trim()) { setError('Paste your meeting transcript'); return; }
        data = await callToolEndpoint('the-debrief', {
          transcript: transcript.trim(), meetingType, attendees: attendees.trim() || null,
          context: context.trim() || null,
        });
      } else if (mode === 'followup') {
        if (!transcript.trim()) { setError('Paste your meeting transcript'); return; }
        data = await callToolEndpoint('the-debrief/followup', {
          transcript: transcript.trim(), meetingType, attendees: attendees.trim() || null, tone,
        });
      } else if (mode === 'series') {
        const valid = meetings.filter(m => m.transcript?.trim());
        if (valid.length < 2) { setError('Need at least 2 meetings'); return; }
        data = await callToolEndpoint('the-debrief/series', {
          meetings: valid.map(m => ({ title: m.title.trim() || null, date: m.date.trim() || null, transcript: m.transcript.trim() })),
          context: context.trim() || null,
        });
      }
      setResults(data);
      const entry = {
        id: 'db_' + Date.now(), date: new Date().toISOString(), mode,
        title: data?.meeting_summary?.substring(0, 50) || meetingType || mode,
        actions: data?.action_items?.length || 0,
      };
      setHistory(prev => [entry, ...prev].slice(0, 30));
    } catch (err) { setError(err.message || 'Processing failed.'); }
  }, [mode, transcript, meetingType, attendees, context, tone, meetings, callToolEndpoint, setHistory]);

  const handleReset = useCallback(() => {
    setTranscript(''); setAttendees(''); setContext('');
    setResults(null); setError(''); setExpandedSections({});
    setMeetings([{ title: '', date: '', transcript: '' }, { title: '', date: '', transcript: '' }]);
  }, []);

  const priBg = (p) => p === 'high' ? c.highPri : p === 'medium' ? c.medPri : c.lowPri;

  // ── Copy builders ──
  const buildDistillCopy = useCallback(() => {
    if (!results) return '';
    const lines = [`📋 Meeting Debrief`, '', results.meeting_summary || '', ''];
    if (results.decisions?.length) {
      lines.push('DECISIONS:');
      results.decisions.forEach((d, i) => lines.push(`${i + 1}. ${d.decision}`));
      lines.push('');
    }
    if (results.action_items?.length) {
      lines.push('ACTION ITEMS:');
      results.action_items.forEach(a => lines.push(`• ${a.action} → ${a.owner} (${a.deadline})`));
      lines.push('');
    }
    if (results.open_questions?.length) {
      lines.push('OPEN QUESTIONS:');
      results.open_questions.forEach(q => lines.push(`? ${q.question}`));
      lines.push('');
    }
    lines.push('— Generated by DeftBrain · deftbrain.com');
    return lines.join('\n');
  }, [results]);

  const buildFollowupCopy = useCallback(() => {
    if (!results) return '';
    const lines = ['📨 Follow-Up Messages', ''];
    if (results.group_email) {
      lines.push(`Subject: ${results.group_email.subject}`, '', results.group_email.body, '');
    }
    lines.push('— Generated by DeftBrain · deftbrain.com');
    return lines.join('\n');
  }, [results]);

  // ── Shared ──
  const Pill = ({ active, onClick, children }) => (
    <button onClick={onClick} className={'px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ' + (active ? c.pillActive : c.pillInactive)}>
      {active && <span className="mr-1">✓</span>}{children}
    </button>
  );

  const Section = ({ title, emoji, sKey, badge, defaultOpen = false, children }) => {
    const open = expandedSections[sKey] ?? defaultOpen;
    return (
      <div className={c.card + ' border rounded-xl overflow-hidden'}>
        <button onClick={() => toggleSection(sKey)} className="w-full flex items-center justify-between p-4 text-left hover:opacity-80">
          <div className="flex items-center gap-2">
            <span className="text-base">{emoji}</span>
            <span className={'text-sm font-semibold ' + c.text}>{title}</span>
            {badge && <span className={'text-xs px-2 py-0.5 rounded-full ' + c.badge}>{badge}</span>}
          </div>
          <span className={'text-xs ' + c.textMut}>{open ? '▲' : '▼'}</span>
        </button>
        {open && <div className={'px-4 pb-4 border-t ' + c.divider}>{children}</div>}
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════
  // INPUT
  // ════════════════════════════════════════════════════════════
  const renderInput = () => (
    <div className="space-y-4">
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {MODES.map(m => (
          <button key={m.value} onClick={() => { setMode(m.value); setResults(null); setError(''); }}
            className={'flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all flex-shrink-0 ' +
              (mode === m.value ? c.pillActive + ' border-2' : c.pillInactive)}>
            <span className="text-lg">{m.emoji}</span>
            <div className="text-left">
              <p className={'text-xs font-bold ' + (mode === m.value ? '' : c.textMut)}>{m.label}</p>
              <p className={'text-[10px] ' + c.textMut}>{m.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {mode !== 'series' ? (
        <div className={c.card + ' border rounded-xl p-5'}>
          <label className={'text-base font-bold ' + c.text + ' mb-1 block'}>📄 Paste meeting transcript or notes</label>
          <p className={'text-xs ' + c.textMut + ' mb-3'}>From Zoom, Teams, Google Meet, Otter.ai, or your own notes.</p>
          <textarea value={transcript} onChange={e => setTranscript(e.target.value)}
            placeholder="Paste your meeting transcript here..."
            className={'w-full h-40 p-4 border-2 rounded-xl ' + c.inputBg + ' outline-none focus:ring-2 resize-none text-sm font-mono'} />
          {charCount > 0 && (
            <p className={'text-xs ' + c.textMut + ' mt-1'}>
              {charCount.toLocaleString()} characters · ~{Math.round(charCount / 750)} min of meeting
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {meetings.map((mtg, idx) => (
            <div key={idx} className={c.card + ' border rounded-xl p-4'}>
              <div className="flex items-center gap-2 mb-2">
                <span className={'text-xs font-bold ' + c.badge + ' px-2 py-0.5 rounded-full'}>Meeting {idx + 1}</span>
                <input type="text" value={mtg.title} onChange={e => updateMeeting(idx, 'title', e.target.value)}
                  placeholder="Meeting title (optional)"
                  className={'flex-1 px-3 py-1.5 rounded-lg border text-xs ' + c.inputBg + ' outline-none'} />
                <input type="text" value={mtg.date} onChange={e => updateMeeting(idx, 'date', e.target.value)}
                  placeholder="Date (optional)"
                  className={'w-28 px-3 py-1.5 rounded-lg border text-xs ' + c.inputBg + ' outline-none'} />
                {meetings.length > 2 && (
                  <button onClick={() => removeMeeting(idx)} className={'text-xs px-2 py-1 rounded ' + c.warnText}>✕</button>
                )}
              </div>
              <textarea value={mtg.transcript} onChange={e => updateMeeting(idx, 'transcript', e.target.value)}
                placeholder="Paste transcript..."
                className={'w-full h-24 p-3 border-2 rounded-xl ' + c.inputBg + ' outline-none focus:ring-2 resize-none text-xs font-mono'} />
            </div>
          ))}
          {meetings.length < 5 && (
            <button onClick={addMeeting} className={'w-full py-3 rounded-xl border-2 border-dashed text-xs font-bold ' + c.pillInactive}>
              ➕ Add another meeting
            </button>
          )}
        </div>
      )}

      <div className={c.card + ' border rounded-xl p-5 space-y-3'}>
        <div>
          <label className={'text-xs font-bold ' + c.textSec + ' uppercase tracking-wide mb-2 block'}>Meeting type</label>
          <div className="flex flex-wrap gap-1.5">
            {MEETING_TYPES.map(mt => <Pill key={mt.value} active={meetingType === mt.value} onClick={() => setMeetingType(mt.value)}>{mt.label}</Pill>)}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={'text-xs font-bold ' + c.textSec + ' uppercase tracking-wide mb-1 block'}>👥 Attendees (optional)</label>
            <input type="text" value={attendees} onChange={e => setAttendees(e.target.value)}
              placeholder="e.g., Sarah, Mike, Product team"
              className={'w-full px-3 py-2 rounded-xl border text-sm ' + c.inputBg + ' outline-none'} />
          </div>
          <div>
            <label className={'text-xs font-bold ' + c.textSec + ' uppercase tracking-wide mb-1 block'}>📝 Context (optional)</label>
            <input type="text" value={context} onChange={e => setContext(e.target.value)}
              placeholder="e.g., Weekly sprint planning, Q3 kickoff"
              className={'w-full px-3 py-2 rounded-xl border text-sm ' + c.inputBg + ' outline-none'} />
          </div>
        </div>

        {mode === 'followup' && (
          <div>
            <label className={'text-xs font-bold ' + c.textSec + ' uppercase tracking-wide mb-2 block'}>Tone</label>
            <div className="flex flex-wrap gap-1.5">
              {TONES.map(t => <Pill key={t.value} active={tone === t.value} onClick={() => setTone(t.value)}>{t.label}</Pill>)}
            </div>
          </div>
        )}
      </div>

      <button onClick={submit} disabled={loading || !canSubmit}
        className={'w-full py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all ' + (loading || !canSubmit ? c.btnDis : c.btn)}>
        {loading ? <><span className="animate-spin inline-block">⏳</span> Processing meeting...</>
          : mode === 'distill' ? <><span>📋</span> Extract Decisions & Actions</>
          : mode === 'followup' ? <><span>📨</span> Draft Follow-Ups</>
          : <><span>🔄</span> Analyze Series</>}
      </button>
    </div>
  );

  // ════════════════════════════════════════════════════════════
  // RESULTS — DISTILL
  // ════════════════════════════════════════════════════════════
  const renderDistill = () => {
    if (!results) return null;
    return (
      <div className="space-y-4">
        {/* Summary */}
        <div className={'p-5 rounded-2xl border-2 ' + c.tipBg}>
          <div className="flex items-center gap-2 mb-1">
            <span className={'text-xs font-bold px-2 py-0.5 rounded-full ' + c.badge}>{results.meeting_type_detected || meetingType}</span>
            {results.duration_estimate && <span className={'text-xs ' + c.textMut}>⏱️ {results.duration_estimate}</span>}
          </div>
          <p className={'text-sm font-bold ' + c.text}>{results.meeting_summary}</p>
        </div>

        {/* Decisions */}
        {results.decisions?.length > 0 && (
          <Section title="Decisions Made" emoji="✅" sKey="decisions" badge={results.decisions.length + ''} defaultOpen>
            <div className="space-y-2 mt-3">
              {results.decisions.map((d, i) => (
                <div key={i} className={'p-3 rounded-lg border ' + c.successBg}>
                  <p className={'text-sm font-semibold ' + c.text}>{d.decision}</p>
                  {d.context && <p className={'text-xs ' + c.textSec + ' mt-1'}>{d.context}</p>}
                  <div className="flex gap-3 mt-1">
                    {d.who_decided && <span className={'text-[10px] ' + c.textMut}>👤 {d.who_decided}</span>}
                    {d.reversibility && <span className={'text-[10px] ' + c.textMut}>↩️ {d.reversibility}</span>}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Action Items */}
        {results.action_items?.length > 0 && (
          <Section title="Action Items" emoji="🎯" sKey="actions" badge={results.action_items.length + ''} defaultOpen>
            <div className="space-y-2 mt-3">
              {results.action_items.map((a, i) => (
                <div key={i} className={c.card + ' border rounded-lg p-3'}>
                  <div className="flex items-start gap-3">
                    <span className="text-base mt-0.5">{PRI_BADGE[a.priority] || '⚪'}</span>
                    <div className="flex-1 min-w-0">
                      <p className={'text-sm font-semibold ' + c.text}>{a.action}</p>
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        <span className={'text-[10px] font-bold px-2 py-0.5 rounded-full ' +
                          (a.owner === 'UNASSIGNED' ? c.highPri : c.badge)}>
                          👤 {a.owner}
                        </span>
                        <span className={'text-[10px] font-bold px-2 py-0.5 rounded-full ' +
                          (a.deadline === 'No deadline set' ? c.medPri : c.badge)}>
                          📅 {a.deadline}
                        </span>
                        <span className={'text-[10px] px-2 py-0.5 rounded-full ' + priBg(a.priority)}>
                          {a.priority}
                        </span>
                      </div>
                      {a.depends_on && <p className={'text-[10px] ' + c.textMut + ' mt-1'}>🔗 Depends on: {a.depends_on}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Open Questions */}
        {results.open_questions?.length > 0 && (
          <Section title="Open Questions" emoji="❓" sKey="questions" badge={results.open_questions.length + ''}>
            <div className="space-y-2 mt-3">
              {results.open_questions.map((q, i) => (
                <div key={i} className={'p-3 rounded-lg ' + c.inset}>
                  <p className={'text-sm font-semibold ' + c.text}>{q.question}</p>
                  <p className={'text-xs ' + c.textSec + ' mt-1'}>{q.why_unresolved}</p>
                  {q.suggested_owner && <p className={'text-[10px] ' + c.tipText + ' mt-0.5'}>→ Suggested owner: {q.suggested_owner}</p>}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Parking Lot */}
        {results.parking_lot?.length > 0 && (
          <Section title="Parking Lot" emoji="🅿️" sKey="parking">
            <div className="space-y-1 mt-3">
              {results.parking_lot.map((p, i) => <p key={i} className={'text-xs ' + c.textSec}>• {p}</p>)}
            </div>
          </Section>
        )}

        {/* Tensions */}
        {results.tensions?.length > 0 && (
          <Section title="Tensions Detected" emoji="⚡" sKey="tensions">
            <div className="space-y-2 mt-3">
              {results.tensions.map((t, i) => (
                <div key={i} className={'p-3 rounded-lg border ' + c.warnBg}>
                  <p className={'text-xs font-bold ' + c.warnText}>{t.topic}</p>
                  <p className={'text-xs ' + c.textSec + ' mt-0.5'}>{t.nature}</p>
                  <p className={'text-[10px] ' + c.textMut + ' mt-0.5'}>Resolution: {t.resolution}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Meeting Health */}
        {results.meeting_health && (
          <div className={'p-4 rounded-xl ' + c.inset}>
            <p className={'text-xs font-bold ' + c.textMut + ' uppercase mb-2'}>📊 Meeting Health</p>
            <div className="space-y-1">
              {results.meeting_health.efficiency && <p className={'text-xs ' + c.text}>⚡ Efficiency: {results.meeting_health.efficiency}</p>}
              {results.meeting_health.accountability && <p className={'text-xs ' + c.text}>👤 Accountability: {results.meeting_health.accountability}</p>}
              {results.meeting_health.pattern_warning && (
                <p className={'text-xs ' + c.warnText}>⚠️ {results.meeting_health.pattern_warning}</p>
              )}
            </div>
          </div>
        )}

        {/* Follow-up Email */}
        {results.follow_up_email && (
          <Section title="Ready-to-Send Follow-Up" emoji="📨" sKey="email" defaultOpen>
            <div className={'mt-3 p-4 rounded-lg ' + c.inset + ' whitespace-pre-wrap'}>
              <p className={'text-xs font-mono ' + c.text}>{results.follow_up_email}</p>
            </div>
            <div className="mt-2">
              <CopyBtn content={results.follow_up_email + '\n\n— Generated by DeftBrain · deftbrain.com'} label="Copy Email" />
            </div>
          </Section>
        )}

        <ActionBar content={buildDistillCopy()} title="Meeting Debrief" />
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════
  // RESULTS — FOLLOW UP
  // ════════════════════════════════════════════════════════════
  const renderFollowup = () => {
    if (!results) return null;
    return (
      <div className="space-y-4">
        {/* Group Email */}
        {results.group_email && (
          <div className={c.card + ' border rounded-xl p-5'}>
            <p className={'text-xs font-bold ' + c.textMut + ' uppercase mb-1'}>📨 Group Follow-Up Email</p>
            <p className={'text-sm font-bold ' + c.text + ' mb-3'}>Subject: {results.group_email.subject}</p>
            <div className={'p-4 rounded-lg ' + c.inset + ' whitespace-pre-wrap mb-3'}>
              <p className={'text-xs font-mono ' + c.text}>{results.group_email.body}</p>
            </div>
            <CopyBtn content={`Subject: ${results.group_email.subject}\n\n${results.group_email.body}\n\n— Generated by DeftBrain · deftbrain.com`} label="Copy Email" />
          </div>
        )}

        {/* Individual Nudges */}
        {results.individual_nudges?.length > 0 && (
          <Section title="Individual Follow-Ups" emoji="💬" sKey="nudges" badge={results.individual_nudges.length + ''} defaultOpen>
            <div className="space-y-3 mt-3">
              {results.individual_nudges.map((n, i) => (
                <div key={i} className={c.cardAlt + ' border rounded-lg p-3'}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={'text-xs font-bold ' + c.text}>→ {n.to}</span>
                    <span className={'text-[9px] font-bold px-2 py-0.5 rounded-full ' + c.badge}>{n.channel}</span>
                    <span className={'text-[9px] px-2 py-0.5 rounded-full ' +
                      (n.urgency === 'send_now' ? c.highPri : n.urgency === 'within_24h' ? c.medPri : c.lowPri)}>
                      {n.urgency === 'send_now' ? '🔴 Send now' : n.urgency === 'within_24h' ? '🟡 Within 24h' : '🟢 Can wait'}
                    </span>
                  </div>
                  <p className={'text-xs ' + c.text + ' mb-2'}>{n.message}</p>
                  <CopyBtn content={n.message + '\n\n— Generated by DeftBrain · deftbrain.com'} label="Copy" />
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Boss Update */}
        {results.boss_update && (
          <div className={c.card + ' border rounded-xl p-5'}>
            <p className={'text-xs font-bold ' + c.textMut + ' uppercase mb-1'}>⬆️ Upward Summary (for your manager)</p>
            <p className={'text-sm font-bold ' + c.text + ' mb-2'}>Subject: {results.boss_update.subject}</p>
            <div className={'p-3 rounded-lg ' + c.inset + ' mb-2'}>
              <p className={'text-xs ' + c.text + ' whitespace-pre-wrap'}>{results.boss_update.body}</p>
            </div>
            <CopyBtn content={`Subject: ${results.boss_update.subject}\n\n${results.boss_update.body}\n\n— Generated by DeftBrain · deftbrain.com`} label="Copy" />
          </div>
        )}

        {/* Calendar Invites */}
        {results.calendar_invites?.length > 0 && (
          <Section title="Meetings to Schedule" emoji="📅" sKey="calendar" badge={results.calendar_invites.length + ''}>
            <div className="space-y-2 mt-3">
              {results.calendar_invites.map((cal, i) => (
                <div key={i} className={'p-3 rounded-lg ' + c.inset}>
                  <p className={'text-xs font-bold ' + c.text}>{cal.title}</p>
                  <p className={'text-[10px] ' + c.textSec}>👥 {cal.attendees} · 📅 {cal.when}</p>
                  <p className={'text-[10px] ' + c.textMut + ' mt-0.5'}>{cal.purpose}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        <ActionBar content={buildFollowupCopy()} title="Meeting Follow-Ups" />
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════
  // RESULTS — SERIES
  // ════════════════════════════════════════════════════════════
  const renderSeries = () => {
    if (!results) return null;
    return (
      <div className="space-y-4">
        {results.series_summary && (
          <div className={'p-5 rounded-2xl border-2 ' + c.tipBg}>
            <p className={'text-xs font-bold ' + c.tipText + ' uppercase mb-1'}>🔄 Series Overview</p>
            <p className={'text-sm font-bold ' + c.text}>{results.series_summary}</p>
          </div>
        )}

        {/* Productivity Trend */}
        {results.productivity_trend && (
          <div className={'p-4 rounded-xl border ' + (results.productivity_trend.direction === 'improving' ? c.successBg : results.productivity_trend.direction === 'declining' ? c.warnBg : c.infoBg)}>
            <p className={'text-xs font-bold ' + (results.productivity_trend.direction === 'improving' ? c.successText : results.productivity_trend.direction === 'declining' ? c.warnText : c.infoText) + ' mb-1'}>
              {results.productivity_trend.direction === 'improving' ? '📈' : results.productivity_trend.direction === 'declining' ? '📉' : '➡️'} Trend: {results.productivity_trend.direction}
            </p>
            <p className={'text-xs ' + c.text}>{results.productivity_trend.evidence}</p>
            {results.productivity_trend.recommendation && <p className={'text-xs ' + c.tipText + ' mt-1'}>💡 {results.productivity_trend.recommendation}</p>}
          </div>
        )}

        {/* Recurring Topics */}
        {results.recurring_topics?.length > 0 && (
          <Section title="Recurring Topics" emoji="🔁" sKey="recurring" badge={results.recurring_topics.length + ''} defaultOpen>
            <div className="space-y-2 mt-3">
              {results.recurring_topics.map((t, i) => (
                <div key={i} className={'p-3 rounded-lg border ' + (t.resolved ? c.successBg : c.warnBg)}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={'text-xs font-bold ' + c.text}>{t.topic}</span>
                    <span className={'text-[9px] font-bold px-2 py-0.5 rounded-full ' + (t.resolved ? 'bg-[#5a8a5c]/20 text-[#5a8a5c]' : 'bg-[#b54a3f]/20 text-[#b54a3f]')}>
                      {t.resolved ? '✅ Resolved' : '🔴 Unresolved'}
                    </span>
                    <span className={'text-[9px] ' + c.textMut}>{t.frequency}</span>
                  </div>
                  <p className={'text-xs ' + c.textSec}>{t.why_recurring}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Accountability Gaps */}
        {results.accountability_gaps?.length > 0 && (
          <Section title="Accountability Gaps" emoji="⚠️" sKey="gaps" badge={results.accountability_gaps.length + ''}>
            <div className="space-y-2 mt-3">
              {results.accountability_gaps.map((g, i) => (
                <div key={i} className={'p-3 rounded-lg border ' + c.warnBg}>
                  <p className={'text-xs font-bold ' + c.text}>{g.action}</p>
                  <p className={'text-[10px] ' + c.textSec}>👤 {g.owner} · Assigned in: {g.assigned_meeting}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={'text-[9px] font-bold px-2 py-0.5 rounded-full ' +
                      (g.status === 'completed' ? 'bg-[#5a8a5c]/20 text-[#5a8a5c]' : g.status === 'disappeared' ? 'bg-[#b54a3f]/20 text-[#b54a3f]' : c.medPri)}>
                      {g.status}
                    </span>
                    {g.pattern && <span className={'text-[10px] ' + c.warnText}>🔁 {g.pattern}</span>}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Decisions Revisited */}
        {results.decisions_revisited?.length > 0 && (
          <Section title="Decisions Revisited" emoji="↩️" sKey="revisited">
            <div className="space-y-2 mt-3">
              {results.decisions_revisited.map((dr, i) => (
                <div key={i} className={'p-3 rounded-lg ' + c.inset}>
                  <p className={'text-xs font-bold ' + c.text}>{dr.decision}</p>
                  <p className={'text-[10px] ' + c.textSec}>Decided: {dr.original_meeting} → Reopened: {dr.revisited_meeting}</p>
                  <p className={'text-[10px] ' + c.tipText + ' mt-0.5'}>Why: {dr.why}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Next Meeting Agenda */}
        {results.next_meeting_agenda?.length > 0 && (
          <div className={'p-4 rounded-xl border ' + c.successBg}>
            <p className={'text-xs font-bold ' + c.successText + ' mb-2'}>📋 Suggested Next Agenda</p>
            {results.next_meeting_agenda.map((a, i) => <p key={i} className={'text-xs ' + c.successText + ' mb-1'}>{i + 1}. {a}</p>)}
            <div className="mt-2">
              <CopyBtn content={results.next_meeting_agenda.map((a, i) => `${i + 1}. ${a}`).join('\n') + '\n\n— Generated by DeftBrain · deftbrain.com'} label="Copy Agenda" />
            </div>
          </div>
        )}
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════
  // HISTORY
  // ════════════════════════════════════════════════════════════
  const renderHistory = () => {
    if (history.length === 0) return null;
    const modeEmoji = (m) => MODES.find(mo => mo.value === m)?.emoji || '📋';
    const formatDate = (iso) => { try { const d = new Date(iso); const diff = Math.floor((new Date() - d) / 86400000); return diff === 0 ? 'Today' : diff === 1 ? 'Yesterday' : diff < 7 ? diff + 'd ago' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); } catch { return ''; } };
    return (
      <div className={'mt-6 p-4 rounded-2xl border ' + c.histBg}>
        <button onClick={() => setShowHistory(!showHistory)} className="w-full flex items-center gap-2 text-left">
          <span>📋</span>
          <span className={'text-sm font-bold ' + c.text + ' flex-1'}>Past Debriefs</span>
          <span className={'text-xs ' + c.textMut}>{history.length}</span>
          <span className={'text-xs ' + c.textMut}>{showHistory ? '▲' : '▼'}</span>
        </button>
        {showHistory && (
          <div className="mt-3 space-y-2">
            {history.map(entry => (
              <div key={entry.id} className={'rounded-xl border ' + c.histCard + ' p-3 flex items-center gap-3'}>
                <span className="text-lg">{modeEmoji(entry.mode)}</span>
                <div className="flex-1 min-w-0">
                  <div className={'text-sm font-semibold ' + c.text + ' truncate'}>{entry.title}</div>
                  <div className={'text-xs ' + c.textMut + ' mt-0.5'}>
                    {formatDate(entry.date)}{entry.actions > 0 ? ` · ${entry.actions} action items` : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════
  // MAIN RENDER
  // ════════════════════════════════════════════════════════════
  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div>
          <h2 className={'text-2xl font-bold ' + c.heading}>The Debrief <span className="text-xl">📋</span></h2>
          <p className={'text-sm ' + c.textMut}>Paste a meeting transcript — get decisions, actions, and follow-ups</p>
        </div>
      </div>
      {!results && renderInput()}
      {results && (
        <div ref={resultsRef} className="space-y-4 mt-4">
          {mode === 'distill' && renderDistill()}
          {mode === 'followup' && renderFollowup()}
          {mode === 'series' && renderSeries()}

          <div className="flex gap-2">
            <button onClick={handleReset} className={'flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 ' + c.btn}>
              <span>📋</span> New Meeting
            </button>
            <button onClick={() => { setResults(null); setError(''); }} className={'flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 ' + c.btnSec}>
              <span>✏️</span> Edit Input
            </button>
          </div>

          <div className={'p-4 rounded-2xl border ' + c.card}>
            <p className={'text-xs font-bold ' + c.textMut + ' uppercase tracking-wide mb-2'}>🔗 Related Tools</p>
            <div className={'space-y-1.5 text-xs ' + c.textSec}>
              <p>Need to send a difficult follow-up? <a href="/VelvetHammer" target="_blank" rel="noopener noreferrer" className={c.linkStyle}>Velvet Hammer</a> crafts the words.</p>
              <p>Drafting a longer recap or report? <a href="/GhostWriter" target="_blank" rel="noopener noreferrer" className={c.linkStyle}>Ghost Writer</a> does the heavy lifting.</p>
            </div>
          </div>
        </div>
      )}
      {error && (
        <div className={'mt-4 p-4 ' + c.errBg + ' border rounded-xl flex items-start gap-3'}>
          <span className={'text-base ' + c.errText}>⚠️</span>
          <p className={'text-sm ' + c.errText}>{error}</p>
        </div>
      )}
      {renderHistory()}
    </div>
  );
};

TheDebrief.displayName = 'TheDebrief';
export default TheDebrief;
