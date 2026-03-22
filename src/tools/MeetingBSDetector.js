import React, { useState, useCallback, useMemo, useEffect} from 'react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';
import { CopyBtn, ActionBar } from '../components/ActionButtons';

// ════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════
const MESSAGE_TYPES = [
  { value: 'decline', label: 'Decline meeting', icon: '❌' },
  { value: 'shorten', label: 'Propose shortening', icon: '⏱️' },
  { value: 'async', label: 'Suggest async instead', icon: '📧' },
  { value: 'optional', label: 'Request optional attendance', icon: '🤷' },
  { value: 'prereq', label: 'Request pre-read/agenda first', icon: '📋' },
  { value: 'cancel_recurring', label: 'Propose cancelling recurring', icon: '☠️' },
];


const FREQUENCY_OPTIONS = ['Daily', 'Weekly', 'Biweekly', 'Monthly', 'Quarterly'];

const HISTORY_KEY = 'mbsd-history';
const STATS_KEY = 'mbsd-stats';
const SCORECARD_KEY = 'mbsd-scorecards';
const MAX_HISTORY = 20;
const MAX_SCORECARDS = 50;

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
}
function saveHistory(items) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, MAX_HISTORY))); } catch {}
}
function loadStats() {
  try { return JSON.parse(localStorage.getItem(STATS_KEY) || 'null'); } catch { return null; }
}
function saveStatsStore(data) {
  try { localStorage.setItem(STATS_KEY, JSON.stringify(data)); } catch {}
}
function loadScorecards() {
  try { return JSON.parse(localStorage.getItem(SCORECARD_KEY) || '[]'); } catch { return []; }
}
function saveScorecards(items) {
  try { localStorage.setItem(SCORECARD_KEY, JSON.stringify(items.slice(0, MAX_SCORECARDS))); } catch {}
}

const CROSS_REFS = [
  { id: 'JargonAssassin', icon: '🗡️', label: 'Kill jargon in meeting notes' },
  { id: 'BrainDumpStructurer', icon: '🧠', label: 'Structure meeting takeaways' },
  { id: 'ConfrontationCoach', icon: '🥊', label: 'Navigate meeting conflict' },
];

// ════════════════════════════════════════════════════════════
// SECTION COMPONENT
// ════════════════════════════════════════════════════════════
function Section({ icon, title, badge, children, defaultOpen = false, c }) {
  const [open, setOpen] = useState(defaultOpen);


  return (
    <div className={`${c.card} border rounded-xl overflow-hidden`}>
      <button onClick={() => setOpen(p => !p)}
        className="w-full p-4 flex items-center justify-between text-left min-h-[44px]">
        <div className="flex items-center gap-2.5">
          {icon && <span className="text-sm">{icon}</span>}
          <h3 className={`text-sm font-bold ${c.text}`}>{title}</h3>
          {badge && <span className={`text-[9px] font-black px-2 py-0.5 rounded ${c.cardAlt}`}>{badge}</span>}
        </div>
        <span className={`text-xs ${c.textMuteded}`}>{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className={`px-4 pb-4 border-t ${c.border} pt-3 space-y-3`}>{children}</div>}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════
const MeetingBSDetector = ({ tool }) => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const { isDark } = useTheme();

  const linkStyle = isDark
    ? 'text-cyan-400 hover:text-cyan-300 underline underline-offset-2'
    : 'text-cyan-600 hover:text-cyan-700 underline underline-offset-2';

    const c = {
    card:          isDark ? 'bg-zinc-800' : 'bg-white',
    input: isDark
      ? 'bg-zinc-900 border-zinc-600 text-zinc-50 placeholder:text-zinc-500 focus:border-cyan-500 focus:ring-indigo-500/20'
      : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:ring-indigo-100',
    text: isDark ? 'text-zinc-50' : 'text-slate-900',
    textMuted: isDark ? 'text-zinc-500' : 'text-slate-500',
    label: isDark ? 'text-zinc-300' : 'text-slate-700',
    btnPrimary: isDark ? 'bg-cyan-600 hover:bg-cyan-500 text-white' : 'bg-cyan-600 hover:bg-cyan-700 text-white',
    danger: isDark ? 'bg-red-900/20 border-red-700/50 text-red-200' : 'bg-red-50 border-red-200 text-red-800',
    success: isDark ? 'bg-emerald-900/20 border-emerald-700/50 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-800',
    warning: isDark ? 'bg-amber-900/20 border-amber-700/50 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-800',
    pillActive: isDark ? 'bg-cyan-600 border-cyan-500 text-white' : 'bg-cyan-600 border-cyan-600 text-white',
    pillInactive: isDark ? 'bg-zinc-700 border-zinc-600 text-zinc-300 hover:border-zinc-500' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300',
    quoteBg: isDark ? 'bg-zinc-900/60' : 'bg-slate-50',
    verdict: isDark ? 'bg-cyan-900/40 border-cyan-700/50' : 'bg-cyan-50 border-cyan-200',
    cardAlt:       isDark ? 'bg-zinc-700/50' : 'bg-slate-50',
    textSecondary: isDark ? 'text-zinc-300' : 'text-gray-600',
    btnSecondary:  isDark ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    border:        isDark ? 'border-zinc-700' : 'border-gray-200',
  };

  // ── State ──
  const [view, setView] = useState('analyze');
  const [error, setError] = useState('');

  // Analyze
  const [meetingText, setMeetingText] = useState('');
  const [duration, setDuration] = useState('');
  const [attendees, setAttendees] = useState('');
  const [analyzeResults, setAnalyzeResults] = useState(null);

  // Calendar
  const [calMeetings, setCalMeetings] = useState([
    { title: '', duration: '1 hour', attendees: '', recurring: false, notes: '' },
  ]);
  const [calResults, setCalResults] = useState(null);

  // Live
  const [liveWhat, setLiveWhat] = useState('');
  const [liveMinutes, setLiveMinutes] = useState('');
  const [liveRole, setLiveRole] = useState('');
  const [liveResults, setLiveResults] = useState(null);

  // Recurring
  const [recName, setRecName] = useState('');
  const [recPurpose, setRecPurpose] = useState('');
  const [recActual, setRecActual] = useState('');
  const [recFreq, setRecFreq] = useState('Weekly');
  const [recDuration, setRecDuration] = useState('1 hour');
  const [recAttendees, setRecAttendees] = useState('');
  const [recResults, setRecResults] = useState(null);

  // Messages
  const [msgType, setMsgType] = useState('decline');
  const [msgMeeting, setMsgMeeting] = useState('');
  const [msgContext, setMsgContext] = useState('');
  const [msgRelationship, setMsgRelationship] = useState('');
  const [msgResults, setMsgResults] = useState(null);

  // History & Stats
  const [history, setHistory] = useState(() => loadHistory());
  const [stats, setStats] = useState(() => loadStats() || {
    totalAnalyzed: 0, hoursSaved: 0, meetingsKilled: 0, weeklyData: [],
  });

  // Scorecards (post-meeting ratings)
  const [scorecards, setScorecards] = useState(() => loadScorecards());
  const [scName, setScName] = useState('');
  const [scScore, setScScore] = useState(3);
  const [scDecision, setScDecision] = useState(false);
  const [scShorter, setScShorter] = useState(false);
  const [scAllNeeded, setScAllNeeded] = useState(true);
  const [scNotes, setScNotes] = useState('');

  // Agenda Builder
  const [agTopic, setAgTopic] = useState('');
  const [agDuration, setAgDuration] = useState('30 minutes');
  const [agAttendees, setAgAttendees] = useState('');
  const [agOutcome, setAgOutcome] = useState('');
  const [agContext, setAgContext] = useState('');
  const [agResults, setAgResults] = useState(null);

  // Meeting Culture Report
  const [reportResults, setReportResults] = useState(null);
  const [reportHours, setReportHours] = useState('');

  // Meeting-Free Time Calculator
  const [focusMeetings, setFocusMeetings] = useState([
    { day: 'Monday', hours: '' },
    { day: 'Tuesday', hours: '' },
    { day: 'Wednesday', hours: '' },
    { day: 'Thursday', hours: '' },
    { day: 'Friday', hours: '' },
  ]);
  const [workHoursPerDay, setWorkHoursPerDay] = useState('8');

  // Team / Manager Mode
  const [teamSize, setTeamSize] = useState('');
  const [teamContext, setTeamContext] = useState('');
  const [teamMeetings, setTeamMeetings] = useState([
    { title: '', duration: '1 hour', attendeesFromTeam: '', frequency: 'Weekly', notes: '' },
  ]);
  const [teamResults, setTeamResults] = useState(null);

  // ── Save to history ──
  const addToHistory = useCallback((type, title, verdict, hoursSaved) => {
    const entry = {
      id: Date.now(), type, title: title.slice(0, 60),
      verdict, hoursSaved: hoursSaved || 0,
      date: new Date().toISOString(),
      preview: title.slice(0, 40),
    };
    const updated = [entry, ...history].slice(0, MAX_HISTORY);
    setHistory(updated);
    saveHistory(updated);

    // Update stats
    const newStats = {
      ...stats,
      totalAnalyzed: stats.totalAnalyzed + 1,
      hoursSaved: stats.hoursSaved + (hoursSaved || 0),
      meetingsKilled: stats.meetingsKilled + (verdict?.includes('EMAIL') || verdict?.includes('CANCEL') || verdict?.includes('KILL') ? 1 : 0),
    };
    setStats(newStats);
    saveStatsStore(newStats);
  }, [history, stats]);

  // ── API: Analyze ──
  const runAnalyze = useCallback(async () => {
    if (!meetingText.trim()) return;
    setError('');
    setAnalyzeResults(null);
    try {
      const data = await callToolEndpoint('meeting-bs-detector', {
        meetingText: meetingText.trim(),
        duration: duration ? parseFloat(duration) : null,
        attendees: attendees ? parseInt(attendees) : null,
      });
      setAnalyzeResults(data);
      addToHistory('analyze', meetingText.slice(0, 6), data.verdict, data.time_cost?.could_save_hours);
    } catch (err) {
      setError(err.message || 'Analysis failed');
    }
  }, [meetingText, duration, attendees, callToolEndpoint, addToHistory]);

  // ── API: Calendar ──
  const runCalendar = useCallback(async () => {
    const valid = calMeetings.filter(m => m.title.trim());
    if (valid.length === 0) return;
    setError('');
    setCalResults(null);
    try {
      const data = await callToolEndpoint('meeting-bs-detector/calendar', {
        meetings: valid,
      });
      setCalResults(data);
      addToHistory('calendar', `${valid.length} meetings`, data.week_verdict, data.potential_savings_hours);
    } catch (err) {
      setError(err.message || 'Calendar audit failed');
    }
  }, [calMeetings, callToolEndpoint, addToHistory]);

  // ── API: Live ──
  const runLive = useCallback(async () => {
    if (!liveWhat.trim()) return;
    setError('');
    setLiveResults(null);
    try {
      const data = await callToolEndpoint('meeting-bs-detector/live', {
        whatsHappening: liveWhat.trim(),
        minutesIn: liveMinutes ? parseInt(liveMinutes) : null,
        yourRole: liveRole || null,
      });
      setLiveResults(data);
    } catch (err) {
      setError(err.message || 'Live rescue failed');
    }
  }, [liveWhat, liveMinutes, liveRole, callToolEndpoint]);

  // ── API: Recurring ──
  const runRecurring = useCallback(async () => {
    if (!recName.trim()) return;
    setError('');
    setRecResults(null);
    try {
      const data = await callToolEndpoint('meeting-bs-detector/recurring', {
        meetingName: recName.trim(),
        originalPurpose: recPurpose.trim() || null,
        whatActuallyHappens: recActual.trim() || null,
        frequency: recFreq,
        duration: recDuration,
        attendees: recAttendees ? parseInt(recAttendees) : null,
      });
      setRecResults(data);
      addToHistory('recurring', recName, data.verdict, null);
    } catch (err) {
      setError(err.message || 'Recurring audit failed');
    }
  }, [recName, recPurpose, recActual, recFreq, recDuration, recAttendees, callToolEndpoint, addToHistory]);

  // ── API: Messages ──
  const runMessages = useCallback(async () => {
    if (!msgMeeting.trim()) return;
    setError('');
    setMsgResults(null);
    try {
      const data = await callToolEndpoint('meeting-bs-detector/messages', {
        messageType: msgType,
        meetingName: msgMeeting.trim(),
        context: msgContext.trim() || null,
        relationship: msgRelationship || null,
      });
      setMsgResults(data);
    } catch (err) {
      setError(err.message || 'Message generation failed');
    }
  }, [msgType, msgMeeting, msgContext, msgRelationship, callToolEndpoint]);

  // ── API: Agenda Builder ──
  const runAgenda = useCallback(async () => {
    if (!agTopic.trim()) return;
    setError('');
    setAgResults(null);
    try {
      const data = await callToolEndpoint('meeting-bs-detector/agenda', {
        topic: agTopic.trim(),
        duration: agDuration,
        attendees: agAttendees.trim() || null,
        desiredOutcome: agOutcome.trim() || null,
        context: agContext.trim() || null,
      });
      setAgResults(data);
    } catch (err) {
      setError(err.message || 'Agenda generation failed');
    }
  }, [agTopic, agDuration, agAttendees, agOutcome, agContext, callToolEndpoint]);

  // ── API: Culture Report ──
  const runReport = useCallback(async () => {
    setError('');
    setReportResults(null);
    const histSummary = history.length > 0
      ? history.map(h => `${h.type}: "${h.title}" — ${h.verdict || 'no verdict'}${h.hoursSaved ? ` (${h.hoursSaved}h saved)` : ''}`).join('\n')
      : null;
    try {
      const data = await callToolEndpoint('meeting-bs-detector/report', {
        scorecards: scorecards.length > 0 ? scorecards : null,
        historySummary: histSummary,
        totalHours: reportHours ? parseFloat(reportHours) : null,
      });
      setReportResults(data);
    } catch (err) {
      setError(err.message || 'Report generation failed');
    }
  }, [history, scorecards, reportHours, callToolEndpoint]);

  // ── API: Team Analysis ──
  const runTeam = useCallback(async () => {
    const valid = teamMeetings.filter(m => m.title.trim());
    if (valid.length === 0) return;
    setError('');
    setTeamResults(null);
    try {
      const data = await callToolEndpoint('meeting-bs-detector/team', {
        teamSize: teamSize ? parseInt(teamSize) : null,
        meetings: valid,
        teamContext: teamContext.trim() || null,
      });
      setTeamResults(data);
    } catch (err) {
      setError(err.message || 'Team analysis failed');
    }
  }, [teamSize, teamMeetings, teamContext, callToolEndpoint]);

  // ── Scorecard helpers ──
  const addScorecard = useCallback(() => {
    if (!scName.trim()) return;
    const card = {
      id: Date.now(),
      name: scName.trim(),
      score: scScore,
      decisionMade: scDecision,
      couldBeShorter: scShorter,
      allNeeded: scAllNeeded,
      notes: scNotes.trim(),
      date: new Date().toISOString(),
    };
    const updated = [card, ...scorecards].slice(0, MAX_SCORECARDS);
    setScorecards(updated);
    saveScorecards(updated);
    setScName('');
    setScScore(3);
    setScDecision(false);
    setScShorter(false);
    setScAllNeeded(true);
    setScNotes('');
  }, [scName, scScore, scDecision, scShorter, scAllNeeded, scNotes, scorecards]);

  const removeScorecard = useCallback((id) => {
    const updated = scorecards.filter(s => s.id !== id);
    setScorecards(updated);
    saveScorecards(updated);
  }, [scorecards]);

  // ── Scorecard computed stats ──
  const scorecardStats = useMemo(() => {
    if (scorecards.length === 0) return null;
    const avgScore = scorecards.reduce((a, s) => a + s.score, 0) / scorecards.length;
    const decisionPct = Math.round((scorecards.filter(s => s.decisionMade).length / scorecards.length) * 100);
    const shorterPct = Math.round((scorecards.filter(s => s.couldBeShorter).length / scorecards.length) * 100);
    const allNeededPct = Math.round((scorecards.filter(s => s.allNeeded).length / scorecards.length) * 100);
    return { avgScore, decisionPct, shorterPct, allNeededPct };
  }, [scorecards]);

  // ── Focus time calculator (pure frontend) ──
  const focusStats = useMemo(() => {
    const workHrs = parseFloat(workHoursPerDay) || 8;
    const days = focusMeetings.map(d => {
      const mtgHrs = parseFloat(d.hours) || 0;
      const focusHrs = Math.max(0, workHrs - mtgHrs);
      return { ...d, mtgHrs, focusHrs };
    });
    const totalMtg = days.reduce((a, d) => a + d.mtgHrs, 0);
    const totalFocus = days.reduce((a, d) => a + d.focusHrs, 0);
    const totalWork = workHrs * days.length;
    const mtgPct = totalWork > 0 ? Math.round((totalMtg / totalWork) * 100) : 0;
    const bestDay = [...days].sort((a, b) => b.focusHrs - a.focusHrs)[0];
    const worstDay = [...days].sort((a, b) => a.focusHrs - b.focusHrs)[0];
    return { days, totalMtg, totalFocus, totalWork, mtgPct, bestDay, worstDay };
  }, [focusMeetings, workHoursPerDay]);

  // ── Team helpers ──
  const addTeamMeeting = () => {
    setTeamMeetings(p => [...p, { title: '', duration: '1 hour', attendeesFromTeam: '', frequency: 'Weekly', notes: '' }]);
  };
  const removeTeamMeeting = (i) => setTeamMeetings(p => p.filter((_, idx) => idx !== i));
  const updateTeamMeeting = (i, field, val) => {
    setTeamMeetings(p => p.map((m, idx) => idx === i ? { ...m, [field]: val } : m));
  };

  // ── Calendar helpers ──
  const addCalMeeting = () => {
    setCalMeetings(p => [...p, { title: '', duration: '1 hour', attendees: '', recurring: false, notes: '' }]);
  };
  const removeCalMeeting = (i) => setCalMeetings(p => p.filter((_, idx) => idx !== i));
  const updateCalMeeting = (i, field, val) => {
    setCalMeetings(p => p.map((m, idx) => idx === i ? { ...m, [field]: val } : m));
  };

  // ── Verdict helpers ──
  const verdictColor = (v) => {
    if (!v) return c.cardAlt;
    const s = v.toUpperCase();
    if (s.includes('JUSTIFIED') || s.includes('KEEP') || s.includes('HEALTHY')) return c.success;
    if (s.includes('EMAIL') || s.includes('CANCEL') || s.includes('KILL') || s.includes('HELL') || s.includes('OVERLOADED')) return c.danger;
    return c.warning;
  };

  // ── Build text ──
  const buildAnalyzeText = useCallback(() => {
    if (!analyzeResults) return '';
    const r = analyzeResults;
    return `${r.verdict_emoji || '📊'} Meeting Analysis: ${r.verdict}\n\n${r.one_liner || ''}\n\n${r.reasoning?.map(x => `• ${x}`).join('\n') || ''}\n\n${r.time_cost ? `⏱️ ${r.time_cost.total_person_hours}h total person-hours` : ''}\n${r.alternative ? `\n💡 Alternative: ${r.alternative}` : ''}\n\n— Generated by DeftBrain · deftbrain.com`;
  }, [analyzeResults]);

  const buildAgendaText = useCallback(() => {
    if (!agResults) return '';
    const r = agResults;
    let t = `📋 Meeting Agenda: ${r.meeting_title}\nDuration: ${r.duration}\n`;
    if (r.pre_work) t += `\n📚 Pre-work: ${r.pre_work.what_to_send} (send ${r.pre_work.when_to_send})\n`;
    if (r.roles) t += `\n👥 Roles: Facilitator: ${r.roles.facilitator} | Notes: ${r.roles.note_taker} | Time: ${r.roles.timekeeper}\n`;
    if (r.agenda_blocks) t += `\n⏱️ Agenda:\n${r.agenda_blocks.map(b => `${b.time} — ${b.title}: ${b.description} [${b.owner}]`).join('\n')}\n`;
    if (r.exit_criteria) t += `\n✅ Done when: ${r.exit_criteria}\n`;
    if (r.decision_method) t += `🗳️ Decisions: ${r.decision_method}\n`;
    t += '\n— Generated by DeftBrain · deftbrain.com';
    return t;
  }, [agResults]);

  const buildReportText = useCallback(() => {
    if (!reportResults) return '';
    const r = reportResults;
    let t = `${r.headline_emoji || '📊'} ${r.report_title}\n${r.period || ''}\n\n`;
    t += `Grade: ${r.grade} — ${r.grade_label}\n`;
    t += `${r.headline_stat}\n\n`;
    if (r.key_stats) t += `Key Stats:\n${r.key_stats.map(s => `${s.emoji} ${s.label}: ${s.value} (${s.verdict})`).join('\n')}\n\n`;
    if (r.time_analysis) t += `⏱️ ${r.time_analysis.meeting_hours_per_week}h/week in meetings | ${r.time_analysis.productive_meeting_pct}% productive | Could reclaim ${r.time_analysis.could_reclaim_hours}h\n\n`;
    if (r.recommendations) t += `Recommendations:\n${r.recommendations.map(x => `• ${x}`).join('\n')}\n\n`;
    if (r.share_summary) t += `"${r.share_summary}"\n\n`;
    t += '— Generated by DeftBrain · deftbrain.com';
    return t;
  }, [reportResults]);

  const buildTeamText = useCallback(() => {
    if (!teamResults) return '';
    const r = teamResults;
    let t = `${r.team_emoji || '👥'} Team Meeting Health: ${r.team_verdict}\n${r.headline}\n\n`;
    if (r.team_stats) t += `📊 ${r.team_stats.total_team_meeting_hours_per_week}h team mtg hours/week | ${r.team_stats.avg_per_person_per_week}h avg/person | ${r.team_stats.pct_of_work_week_in_meetings}% of week\n\n`;
    if (r.meeting_ranking) t += `Rankings:\n${r.meeting_ranking.map(m => `• ${m.title}: ${m.team_impact} impact → ${m.recommendation}`).join('\n')}\n\n`;
    if (r.top_3_changes) t += `Top Changes:\n${r.top_3_changes.map(x => `• ${x}`).join('\n')}\n\n`;
    t += '— Generated by DeftBrain · deftbrain.com';
    return t;
  }, [teamResults]);

  // ════════════════════════════════════════════════════════════
  // NAV
  // ════════════════════════════════════════════════════════════
  const renderNav = () => (
    <div className="flex gap-1 flex-wrap mb-4">
      {[
        { key: 'analyze', label: '🔍 Analyze' },
        { key: 'calendar', label: '📅 Week Audit' },
        { key: 'live', label: '🚨 Live Rescue' },
        { key: 'recurring', label: '🧟 Recurring' },
        { key: 'messages', label: '✉️ Messages' },
        { key: 'agenda', label: '📋 Agenda' },
        { key: 'scorecard', label: `⭐ Rate${scorecards.length ? ` (${scorecards.length})` : ''}` },
        { key: 'focus', label: '🎯 Focus Time' },
        { key: 'team', label: '👥 Team' },
        { key: 'report', label: '📈 Report' },
        { key: 'stats', label: `📊 Stats${history.length ? ` (${history.length})` : ''}` },
      ].map(t => (
        <button key={t.key} onClick={() => setView(t.key)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors min-h-[36px] ${
            view === t.key ? c.pillActive : c.pillInactive
          }`}>{t.label}</button>
      ))}
    </div>
  );

  // ════════════════════════════════════════════════════════════
  // RENDER: ANALYZE
  // ════════════════════════════════════════════════════════════
  const renderAnalyze = () => (
    <div className="space-y-4">
      <div className={`${c.card} border rounded-xl p-5`}>
        <div className={`mb-4 pb-3 border-b ${c.border}`}>
          <h2 className={`text-xl font-bold ${c.text}`}><span className="mr-2">🔍</span>Meeting BS Detector</h2>
          <p className={`text-sm ${c.textSecondary}`}>Paste a meeting invite — I'll tell you if it's worth your time</p>
        </div>

        <div className="mb-4">
          <label className={`text-sm font-bold ${c.label} block mb-1.5`}>Meeting invite or description</label>
          <textarea value={meetingText} onChange={e => setMeetingText(e.target.value)}
            placeholder={"Paste the meeting invite, calendar description, or just describe it: who, what, how long, why..."}
            rows={5}
            className={`w-full px-3 py-2.5 border rounded-lg text-sm ${c.input} outline-none focus:ring-2 resize-none`} />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div>
            <label className={`text-xs font-bold ${c.label} block mb-1`}>Duration (hours)</label>
            <input type="number" step="0.5" value={duration} onChange={e => setDuration(e.target.value)}
              placeholder="e.g., 1"
              className={`w-full px-2 py-2 border rounded-lg text-sm ${c.input} outline-none focus:ring-2`} />
          </div>
          <div>
            <label className={`text-xs font-bold ${c.label} block mb-1`}>Attendees</label>
            <input type="number" value={attendees} onChange={e => setAttendees(e.target.value)}
              placeholder="e.g., 8"
              className={`w-full px-2 py-2 border rounded-lg text-sm ${c.input} outline-none focus:ring-2`} />
          </div>
        </div>

        <button onClick={runAnalyze} disabled={!meetingText.trim() || loading}
          className={`w-full ${c.btnPrimaryPrimary} disabled:opacity-40 font-bold py-3 rounded-lg flex items-center justify-center gap-2 min-h-[48px]`}>
          {loading ? <><span className="animate-spin inline-block">{tool?.icon ?? '⚙️'}</span> Analyzing...</> : <><span>🔍</span> Detect BS</>}
        </button>
      </div>

      {analyzeResults && (
        <div className="space-y-4">
          <div className={`${verdictColor(analyzeResults.verdict)} border-2 rounded-xl p-5 text-center`}>
            <span className="text-4xl block mb-2">{analyzeResults.verdict_emoji || '📊'}</span>
            <p className={`text-xl font-black ${c.text}`}>{analyzeResults.verdict}</p>
            {analyzeResults.one_liner && <p className={`text-sm ${c.textSecondary} mt-2`}>{analyzeResults.one_liner}</p>}
            {analyzeResults.confidence && (
              <p className={`text-[10px] ${c.textMuteded} mt-1`}>{analyzeResults.confidence}% confidence · Quality: {analyzeResults.quality_score}/10</p>
            )}
          </div>

          {analyzeResults.reasoning?.length > 0 && (
            <Section icon="📋" title="Reasoning" defaultOpen={true} c={c}>
              {analyzeResults.reasoning.map((r, i) => (
                <p key={i} className={`text-xs ${c.textSecondary}`}>• {r}</p>
              ))}
            </Section>
          )}

          {(analyzeResults.red_flags?.length > 0 || analyzeResults.green_flags?.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {analyzeResults.red_flags?.length > 0 && (
                <div className={`${c.danger} border rounded-xl p-4`}>
                  <p className={`text-xs font-bold ${c.danger} mb-1`}>🚩 Red Flags</p>
                  {analyzeResults.red_flags.map((f, i) => <p key={i} className="text-xs">• {f}</p>)}
                </div>
              )}
              {analyzeResults.green_flags?.length > 0 && (
                <div className={`${c.success} border rounded-xl p-4`}>
                  <p className={`text-xs font-bold ${c.success} mb-1`}>✅ Green Flags</p>
                  {analyzeResults.green_flags.map((f, i) => <p key={i} className={`text-xs ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>• {f}</p>)}
                </div>
              )}
            </div>
          )}

          {analyzeResults.time_cost && (
            <div className={`${c.card} border rounded-xl p-4`}>
              <h3 className={`text-sm font-bold ${c.text} mb-2`}>⏱️ Time Cost</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: 'Duration', value: `${analyzeResults.time_cost.duration_hours}h` },
                  { label: 'People', value: analyzeResults.time_cost.participants },
                  { label: 'Person-hours', value: `${analyzeResults.time_cost.total_person_hours}h` },
                  { label: 'Could save', value: `${analyzeResults.time_cost.could_save_hours}h`, highlight: true },
                ].map((item, i) => (
                  <div key={i} className={`${item.highlight ? c.success : c.quoteBg} rounded-lg p-3 text-center border`}>
                    <p className={`text-lg font-black ${item.highlight ? c.success : c.text}`}>{item.value}</p>
                    <p className={`text-[9px] ${c.textMuteded}`}>{item.label}</p>
                  </div>
                ))}
              </div>
              {analyzeResults.time_cost.annual_cost_if_recurring && (
                <p className={`text-[10px] ${c.warning} mt-2`}>📅 {analyzeResults.time_cost.annual_cost_if_recurring}</p>
              )}
            </div>
          )}

          {analyzeResults.optimal_format && (
            <div className={`${c.cardAlt} border rounded-lg p-3`}>
              <p className={`text-xs font-bold ${c.textSecondaryondary}`}>💡 Optimal format: {analyzeResults.optimal_format}</p>
            </div>
          )}

          {analyzeResults.alternative && (
            <div className={`${c.cardAlt} border rounded-xl p-4`}>
              <p className={`text-xs font-bold ${isDark ? 'text-sky-200' : 'text-sky-800'} mb-1`}>📧 Instead, try:</p>
              <p className={`text-xs ${isDark ? 'text-sky-300' : 'text-sky-700'}`}>{analyzeResults.alternative}</p>
            </div>
          )}

          {analyzeResults.decline_message && (
            <div className={`${c.card} border rounded-xl p-4`}>
              <p className={`text-xs font-bold ${c.text} mb-2`}>✉️ Decline message</p>
              <div className={`${c.quoteBg} rounded-lg p-3 mb-2`}>
                <p className={`text-xs ${c.textSecondary} whitespace-pre-wrap`}>{analyzeResults.decline_message}</p>
              </div>
              <CopyBtn content={`${analyzeResults.decline_message}\n\n— Generated by DeftBrain · deftbrain.com`} label="Copy decline" />
            </div>
          )}

          {analyzeResults.rescue_tips?.length > 0 && (
            <Section icon="🔧" title="If You MUST Attend" c={c}>
              {analyzeResults.rescue_tips.map((t, i) => <p key={i} className={`text-xs ${c.textSecondary}`}>→ {t}</p>)}
            </Section>
          )}

          <ActionBar content={buildAnalyzeText()} title="Meeting Analysis" />
        </div>
      )}
    </div>
  );

  // ════════════════════════════════════════════════════════════
  // RENDER: CALENDAR (Week Audit)
  // ════════════════════════════════════════════════════════════
  const renderCalendar = () => (
    <div className="space-y-4">
      <div className={`${c.card} border rounded-xl p-5`}>
        <h2 className={`text-lg font-bold ${c.text} mb-1`}>📅 Weekly Calendar Audit</h2>
        <p className={`text-sm ${c.textSecondary} mb-4`}>Add your meetings — I'll rank them all and tell you what to cut</p>

        <div className="space-y-3 mb-4">
          {calMeetings.map((m, i) => (
            <div key={i} className={`${c.quoteBg} rounded-lg p-3`}>
              <div className="flex items-start gap-2">
                <span className={`text-xs font-black ${c.textSecondaryondary} mt-2`}>{i + 1}</span>
                <div className="flex-1 space-y-2">
                  <input type="text" value={m.title} onChange={e => updateCalMeeting(i, 'title', e.target.value)}
                    placeholder="Meeting name"
                    className={`w-full px-2 py-1.5 border rounded text-sm ${c.input} outline-none focus:ring-2`} />
                  <div className="flex gap-2 flex-wrap">
                    <select value={m.duration} onChange={e => updateCalMeeting(i, 'duration', e.target.value)}
                      className={`px-2 py-1 border rounded text-[11px] ${c.input}`}>
                      {['15 min', '30 min', '45 min', '1 hour', '1.5 hours', '2 hours', '2+ hours'].map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                    <input type="number" value={m.attendees} onChange={e => updateCalMeeting(i, 'attendees', e.target.value)}
                      placeholder="# people" className={`w-20 px-2 py-1 border rounded text-[11px] ${c.input}`} />
                    <label className={`flex items-center gap-1 text-[11px] ${c.textSecondary}`}>
                      <input type="checkbox" checked={m.recurring} onChange={e => updateCalMeeting(i, 'recurring', e.target.checked)} />
                      Recurring
                    </label>
                  </div>
                  <input type="text" value={m.notes} onChange={e => updateCalMeeting(i, 'notes', e.target.value)}
                    placeholder="Notes (optional): purpose, agenda, who called it..."
                    className={`w-full px-2 py-1 border rounded text-[11px] ${c.input}`} />
                </div>
                {calMeetings.length > 1 && (
                  <button onClick={() => removeCalMeeting(i)} className={`text-sm ${c.danger} min-h-[28px]`}>✕</button>
                )}
              </div>
            </div>
          ))}
        </div>

        <button onClick={addCalMeeting} className={`text-xs font-bold ${c.textSecondaryondary} mb-4 min-h-[32px]`}>➕ Add meeting</button>

        <button onClick={runCalendar} disabled={!calMeetings.some(m => m.title.trim()) || loading}
          className={`w-full ${c.btnPrimaryPrimary} disabled:opacity-40 font-bold py-3 rounded-lg flex items-center justify-center gap-2 min-h-[48px]`}>
          {loading ? <><span className="animate-spin inline-block">{tool?.icon ?? '⚙️'}</span> Auditing week...</> : <><span>📅</span> Audit My Week</>}
        </button>
      </div>

      {calResults && (
        <div className="space-y-4">
          <div className={`${verdictColor(calResults.week_verdict)} border-2 rounded-xl p-5 text-center`}>
            <span className="text-4xl block mb-2">{calResults.week_emoji || '📅'}</span>
            <p className={`text-xl font-black ${c.text}`}>{calResults.week_verdict}</p>
            {calResults.one_liner && <p className={`text-sm ${c.textSecondary} mt-2`}>{calResults.one_liner}</p>}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className={`${c.quoteBg} rounded-lg p-3 text-center border`}>
              <p className={`text-lg font-black ${c.text}`}>{calResults.total_meeting_hours}h</p>
              <p className={`text-[9px] ${c.textMuteded}`}>Meeting hours</p>
            </div>
            <div className={`${c.quoteBg} rounded-lg p-3 text-center border`}>
              <p className={`text-lg font-black ${c.text}`}>{calResults.total_person_hours}h</p>
              <p className={`text-[9px] ${c.textMuteded}`}>Person-hours</p>
            </div>
            <div className={`${c.success} rounded-lg p-3 text-center border`}>
              <p className={`text-lg font-black ${c.success}`}>{calResults.potential_savings_hours}h</p>
              <p className={`text-[9px] ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>Could save</p>
            </div>
          </div>

          {calResults.meetings?.length > 0 && (
            <div className="space-y-2">
              {calResults.meetings.sort((a, b) => (a.priority || 99) - (b.priority || 99)).map((m, i) => (
                <div key={i} className={`${verdictColor(m.verdict)} border rounded-xl p-3`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-bold ${c.text}`}>{m.verdict_emoji || '📊'} {m.title}</span>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded ${verdictColor(m.verdict)}`}>{m.verdict}</span>
                  </div>
                  <p className={`text-[10px] ${c.textSecondary}`}>{m.reason}</p>
                  {m.time_cost && <p className={`text-[9px] ${c.textMuteded}`}>⏱️ {m.time_cost}</p>}
                </div>
              ))}
            </div>
          )}

          {calResults.weekly_advice && (
            <div className={`${c.cardAlt} border rounded-lg p-3`}>
              <p className={`text-xs font-bold ${c.textSecondaryondary}`}>💡 {calResults.weekly_advice}</p>
            </div>
          )}

          {calResults.meeting_free_blocks && (
            <div className={`${c.cardAlt} border rounded-lg p-3`}>
              <p className={`text-xs ${isDark ? 'text-sky-300' : 'text-sky-700'}`}>🛡️ Protect: {calResults.meeting_free_blocks}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // ════════════════════════════════════════════════════════════
  // RENDER: LIVE RESCUE
  // ════════════════════════════════════════════════════════════
  const renderLive = () => (
    <div className="space-y-4">
      <div className={`${isDark ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-300'} border-2 rounded-xl p-5`}>
        <h2 className={`text-lg font-bold ${c.text} mb-1`}>🚨 Live Rescue</h2>
        <p className={`text-sm ${c.textSecondary} mb-4`}>You're IN the meeting and it's going sideways? I've got you.</p>

        <div className="mb-4">
          <label className={`text-sm font-bold ${c.label} block mb-1.5`}>What's happening right now?</label>
          <textarea value={liveWhat} onChange={e => setLiveWhat(e.target.value)}
            placeholder={"e.g., We're 30 min in and still no agenda. Two people are arguing about scope. Nobody's making decisions..."}
            rows={3}
            className={`w-full px-3 py-2.5 border rounded-lg text-sm ${c.input} outline-none focus:ring-2 resize-none`} />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className={`text-xs font-bold ${c.label} block mb-1`}>Minutes in</label>
            <input type="number" value={liveMinutes} onChange={e => setLiveMinutes(e.target.value)}
              placeholder="e.g., 25"
              className={`w-full px-2 py-2 border rounded-lg text-sm ${c.input} outline-none focus:ring-2`} />
          </div>
          <div>
            <label className={`text-xs font-bold ${c.label} block mb-1`}>Your role</label>
            <div className="flex flex-wrap gap-1">
              {['Leading it', 'Attending', 'Optional'].map(r => (
                <button key={r} onClick={() => setLiveRole(liveRole === r ? '' : r)}
                  className={`px-2 py-1 rounded text-[10px] font-bold border min-h-[28px] ${
                    liveRole === r ? c.pillActive : c.pillInactive
                  }`}>{r}</button>
              ))}
            </div>
          </div>
        </div>

        <button onClick={runLive} disabled={!liveWhat.trim() || loading}
          className={`w-full bg-red-600 hover:bg-red-500 text-white disabled:opacity-40 font-bold py-3 rounded-lg flex items-center justify-center gap-2 min-h-[48px]`}>
          {loading ? <><span className="animate-spin inline-block">{tool?.icon ?? '⚙️'}</span> Getting help...</> : <><span>🚨</span> Rescue Me NOW</>}
        </button>
      </div>

      {liveResults && (
        <div className="space-y-4">
          <div className={`${
            liveResults.urgency === 'REDIRECT NOW' ? c.danger
            : liveResults.urgency === 'WRAP IT UP' ? c.warning
            : c.cardAlt
          } border-2 rounded-xl p-5 text-center`}>
            <span className="text-3xl block mb-2">{liveResults.urgency_emoji || '🚨'}</span>
            <p className={`text-lg font-black ${c.text}`}>{liveResults.urgency}</p>
            {liveResults.situation_read && <p className={`text-xs ${c.textSecondary} mt-2`}>{liveResults.situation_read}</p>}
          </div>

          {/* Say This NOW */}
          {liveResults.say_this_now && (
            <div className={`${c.success} border-2 rounded-xl p-4`}>
              <p className={`text-[10px] font-bold ${c.success} uppercase mb-1`}>Say this right now</p>
              <p className={`text-sm ${isDark ? 'text-emerald-200' : 'text-emerald-900'} leading-relaxed font-bold`}>
                "{liveResults.say_this_now}"
              </p>
              <CopyBtn content={`${liveResults.say_this_now}\n\n— Generated by DeftBrain · deftbrain.com`} label="Copy" />
            </div>
          )}

          {liveResults.say_this_softer && (
            <div className={`${c.card} border rounded-xl p-4`}>
              <p className={`text-[10px] font-bold ${c.label} uppercase mb-1`}>Softer version</p>
              <p className={`text-xs ${c.textSecondary}`}>"{liveResults.say_this_softer}"</p>
              <CopyBtn content={`${liveResults.say_this_softer}\n\n— Generated by DeftBrain · deftbrain.com`} label="Copy" />
            </div>
          )}

          {liveResults.if_youre_not_the_lead && (
            <div className={`${c.card} border rounded-xl p-4`}>
              <p className={`text-[10px] font-bold ${c.label} uppercase mb-1`}>If you're not leading</p>
              <p className={`text-xs ${c.textSecondary}`}>"{liveResults.if_youre_not_the_lead}"</p>
            </div>
          )}

          {liveResults.escape_hatch && (
            <div className={`${c.warning} border rounded-xl p-4`}>
              <p className={`text-xs font-bold ${c.warning} mb-1`}>🚪 Escape hatch</p>
              <p className={`text-xs`}>"{liveResults.escape_hatch}"</p>
              <CopyBtn content={`${liveResults.escape_hatch}\n\n— Generated by DeftBrain · deftbrain.com`} label="Copy" />
            </div>
          )}

          {liveResults.salvage_plan && (
            <div className={`${c.cardAlt} border rounded-lg p-3`}>
              <p className={`text-xs ${isDark ? 'text-sky-300' : 'text-sky-700'}`}>🔧 Salvage: {liveResults.salvage_plan}</p>
            </div>
          )}

          {liveResults.post_meeting_move && (
            <div className={`${c.cardAlt} border rounded-lg p-3`}>
              <p className={`text-xs font-bold ${c.textSecondaryondary}`}>📤 After: {liveResults.post_meeting_move}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // ════════════════════════════════════════════════════════════
  // RENDER: RECURRING
  // ════════════════════════════════════════════════════════════
  const renderRecurring = () => (
    <div className="space-y-4">
      <div className={`${c.card} border rounded-xl p-5`}>
        <h2 className={`text-lg font-bold ${c.text} mb-1`}>🧟 Recurring Meeting Audit</h2>
        <p className={`text-sm ${c.textSecondary} mb-4`}>Is this meeting still earning its spot on the calendar?</p>

        <div className="mb-4">
          <label className={`text-sm font-bold ${c.label} block mb-1.5`}>Meeting name</label>
          <input type="text" value={recName} onChange={e => setRecName(e.target.value)}
            placeholder={"e.g., Weekly team standup, Monday planning meeting..."}
            className={`w-full px-3 py-2.5 border rounded-lg text-sm ${c.input} outline-none focus:ring-2`} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div>
            <label className={`text-xs font-bold ${c.label} block mb-1`}>Frequency</label>
            <div className="flex flex-wrap gap-1">
              {FREQUENCY_OPTIONS.map(f => (
                <button key={f} onClick={() => setRecFreq(f)}
                  className={`px-2 py-1 rounded text-[10px] font-bold border min-h-[28px] ${recFreq === f ? c.pillActive : c.pillInactive}`}>{f}</button>
              ))}
            </div>
          </div>
          <div>
            <label className={`text-xs font-bold ${c.label} block mb-1`}>Duration</label>
            <select value={recDuration} onChange={e => setRecDuration(e.target.value)}
              className={`w-full px-2 py-2 border rounded-lg text-sm ${c.input}`}>
              {['15 min', '30 min', '45 min', '1 hour', '1.5 hours', '2 hours'].map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={`text-xs font-bold ${c.label} block mb-1`}>Attendees</label>
            <input type="number" value={recAttendees} onChange={e => setRecAttendees(e.target.value)}
              placeholder="# people" className={`w-full px-2 py-2 border rounded-lg text-sm ${c.input} outline-none focus:ring-2`} />
          </div>
        </div>

        <div className="mb-4">
          <label className={`text-xs font-bold ${c.label} block mb-1`}>What was this meeting originally for?</label>
          <input type="text" value={recPurpose} onChange={e => setRecPurpose(e.target.value)}
            placeholder={"e.g., Coordinate sprint planning, align on Q3 goals..."}
            className={`w-full px-3 py-2 border rounded-lg text-sm ${c.input} outline-none focus:ring-2`} />
        </div>

        <div className="mb-5">
          <label className={`text-xs font-bold ${c.label} block mb-1`}>What actually happens in it now?</label>
          <input type="text" value={recActual} onChange={e => setRecActual(e.target.value)}
            placeholder={"e.g., Status updates that could be Slack messages, same 2 people talking the whole time..."}
            className={`w-full px-3 py-2 border rounded-lg text-sm ${c.input} outline-none focus:ring-2`} />
        </div>

        <button onClick={runRecurring} disabled={!recName.trim() || loading}
          className={`w-full ${c.btnPrimaryPrimary} disabled:opacity-40 font-bold py-3 rounded-lg flex items-center justify-center gap-2 min-h-[48px]`}>
          {loading ? <><span className="animate-spin inline-block">{tool?.icon ?? '⚙️'}</span> Auditing...</> : <><span>🧟</span> Audit This Recurring</>}
        </button>
      </div>

      {recResults && (
        <div className="space-y-4">
          <div className={`${verdictColor(recResults.verdict)} border-2 rounded-xl p-5 text-center`}>
            <span className="text-4xl block mb-2">{recResults.verdict_emoji || '🧟'}</span>
            <p className={`text-xl font-black ${c.text}`}>{recResults.verdict}</p>
            {recResults.zombie_score && (
              <p className={`text-xs ${c.textMuteded} mt-1`}>Zombie score: {recResults.zombie_score}/10 — {recResults.zombie_label}</p>
            )}
          </div>

          {recResults.honest_take && (
            <div className={`${c.card} border rounded-xl p-4`}>
              <p className={`text-sm ${c.textSecondary} leading-relaxed`}>{recResults.honest_take}</p>
            </div>
          )}

          {recResults.annual_cost && (
            <div className={`${c.danger} border rounded-xl p-4`}>
              <p className={`text-xs font-bold ${c.danger} mb-2`}>💸 Annual Cost</p>
              <p className={`text-2xl font-black ${c.text} text-center`}>{recResults.annual_cost.total_person_hours_per_year}h/year</p>
              {recResults.annual_cost.equivalent && (
                <p className={`text-xs ${c.textSecondary} text-center mt-1`}>{recResults.annual_cost.equivalent}</p>
              )}
            </div>
          )}

          {recResults.the_drift && (
            <div className={`${c.warning} border rounded-lg p-3`}>
              <p className={`text-xs font-bold ${c.warning} mb-1`}>📉 The Drift</p>
              <p className={`text-xs`}>{recResults.the_drift}</p>
            </div>
          )}

          {recResults.restructure_plan && (
            <Section icon="🔧" title="Restructure Plan" defaultOpen={true} c={c}>
              {Object.entries(recResults.restructure_plan).filter(([, v]) => v).map(([key, val]) => (
                <div key={key}>
                  <p className={`text-[10px] font-bold ${c.label} uppercase`}>{key.replace(/_/g, ' ')}</p>
                  <p className={`text-xs ${c.textSecondary}`}>{val}</p>
                </div>
              ))}
            </Section>
          )}

          {recResults.kill_email && (
            <div className={`${c.card} border rounded-xl p-4`}>
              <p className={`text-xs font-bold ${c.text} mb-2`}>✉️ Proposal email</p>
              <div className={`${c.quoteBg} rounded-lg p-3 mb-2`}>
                <p className={`text-xs ${c.textSecondary} whitespace-pre-wrap`}>{recResults.kill_email}</p>
              </div>
              <CopyBtn content={`${recResults.kill_email}\n\n— Generated by DeftBrain · deftbrain.com`} label="Copy email" />
            </div>
          )}

          {recResults.keep_if && (
            <div className={`${c.cardAlt} border rounded-lg p-3`}>
              <p className={`text-xs ${isDark ? 'text-sky-300' : 'text-sky-700'}`}>✅ Keep if: {recResults.keep_if}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // ════════════════════════════════════════════════════════════
  // RENDER: MESSAGES
  // ════════════════════════════════════════════════════════════
  const renderMessages = () => (
    <div className="space-y-4">
      <div className={`${c.card} border rounded-xl p-5`}>
        <h2 className={`text-lg font-bold ${c.text} mb-1`}>✉️ Meeting Messages</h2>
        <p className={`text-sm ${c.textSecondary} mb-4`}>Ready-to-send emails for every meeting situation</p>

        <div className="mb-4">
          <label className={`text-xs font-bold ${c.label} block mb-1.5`}>What do you need to say?</label>
          <div className="flex flex-wrap gap-1.5">
            {MESSAGE_TYPES.map(mt => (
              <button key={mt.value} onClick={() => setMsgType(mt.value)}
                className={`${c.btnPrimarySecondary} px-2.5 py-1.5 rounded-lg text-[11px] font-medium min-h-[32px] flex items-center gap-1 ${
                  msgType === mt.value ? 'ring-2 ring-indigo-500' : ''
                }`}>
                <span>{mt.icon}</span> {mt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className={`text-sm font-bold ${c.label} block mb-1.5`}>Which meeting?</label>
          <input type="text" value={msgMeeting} onChange={e => setMsgMeeting(e.target.value)}
            placeholder={"e.g., Weekly team sync, Q3 planning meeting..."}
            className={`w-full px-3 py-2.5 border rounded-lg text-sm ${c.input} outline-none focus:ring-2`} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          <div>
            <label className={`text-xs font-bold ${c.label} block mb-1`}>Context</label>
            <input type="text" value={msgContext} onChange={e => setMsgContext(e.target.value)}
              placeholder="Why you want to send this..."
              className={`w-full px-2 py-2 border rounded-lg text-sm ${c.input} outline-none focus:ring-2`} />
          </div>
          <div>
            <label className={`text-xs font-bold ${c.label} block mb-1`}>Sending to</label>
            <div className="flex flex-wrap gap-1">
              {['Boss', 'Peer', 'Report', 'Team', 'External'].map(r => (
                <button key={r} onClick={() => setMsgRelationship(msgRelationship === r ? '' : r)}
                  className={`px-2 py-1 rounded text-[10px] font-bold border min-h-[28px] ${
                    msgRelationship === r ? c.pillActive : c.pillInactive
                  }`}>{r}</button>
              ))}
            </div>
          </div>
        </div>

        <button onClick={runMessages} disabled={!msgMeeting.trim() || loading}
          className={`w-full ${c.btnPrimaryPrimary} disabled:opacity-40 font-bold py-3 rounded-lg flex items-center justify-center gap-2 min-h-[48px]`}>
          {loading ? <><span className="animate-spin inline-block">{tool?.icon ?? '⚙️'}</span> Writing...</> : <><span>✉️</span> Generate Messages</>}
        </button>
      </div>

      {msgResults?.versions?.length > 0 && (
        <div className="space-y-4">
          {msgResults.versions.map((v, i) => (
            <div key={i} className={`${c.card} border rounded-xl p-4`}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className={`text-xs font-black ${c.text}`}>{v.label}</span>
                  <span className={`text-[10px] ${c.textMuteded} ml-2`}>{v.tone}</span>
                </div>
                <span className={`text-[9px] ${c.textMuteded}`}>{v.best_for}</span>
              </div>
              {v.subject && (
                <p className={`text-[10px] font-bold ${c.textSecondaryondary} mb-1`}>Subject: {v.subject}</p>
              )}
              <div className={`${c.quoteBg} rounded-lg p-3 mb-2`}>
                <p className={`text-xs ${c.textSecondary} whitespace-pre-wrap leading-relaxed`}>{v.body}</p>
              </div>
              <CopyBtn content={`${v.subject ? `Subject: ${v.subject}\n\n` : ''}${v.body}\n\n— Generated by DeftBrain · deftbrain.com`} label="Copy" />
            </div>
          ))}

          {msgResults.pro_tip && (
            <div className={`${c.cardAlt} border rounded-lg p-3`}>
              <p className={`text-xs ${isDark ? 'text-sky-300' : 'text-sky-700'}`}>💡 {msgResults.pro_tip}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // ════════════════════════════════════════════════════════════
  // RENDER: AGENDA BUILDER
  // ════════════════════════════════════════════════════════════
  const renderAgenda = () => (
    <div className="space-y-4">
      <div className={`${c.card} border rounded-xl p-5`}>
        <div className={`mb-4 pb-3 border-b ${c.border}`}>
          <h2 className={`text-base font-black ${c.text}`}>📋 Agenda Builder</h2>
          <p className={`text-xs ${c.textMuteded} mt-1`}>Turn bad meetings into focused, time-boxed ones</p>
        </div>

        <div className="mb-4">
          <label className={`text-xs font-bold ${c.label} block mb-1`}>What's this meeting about? *</label>
          <input type="text" value={agTopic} onChange={e => setAgTopic(e.target.value)}
            placeholder="e.g., Decide on vendor for new CRM, Q3 planning kickoff..."
            className={`w-full px-3 py-2 border rounded-lg text-sm ${c.input} outline-none focus:ring-2`} />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className={`text-xs font-bold ${c.label} block mb-1`}>Duration</label>
            <select value={agDuration} onChange={e => setAgDuration(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg text-sm ${c.input}`}>
              {['15 minutes', '30 minutes', '45 minutes', '1 hour', '90 minutes', '2 hours'].map(d =>
                <option key={d} value={d}>{d}</option>
              )}
            </select>
          </div>
          <div>
            <label className={`text-xs font-bold ${c.label} block mb-1`}>Attendees</label>
            <input type="text" value={agAttendees} onChange={e => setAgAttendees(e.target.value)}
              placeholder="e.g., Product lead, 2 engineers, designer"
              className={`w-full px-3 py-2 border rounded-lg text-sm ${c.input} outline-none focus:ring-2`} />
          </div>
        </div>

        <div className="mb-4">
          <label className={`text-xs font-bold ${c.label} block mb-1`}>Desired outcome</label>
          <input type="text" value={agOutcome} onChange={e => setAgOutcome(e.target.value)}
            placeholder="e.g., Pick one of three options, align on timeline, get sign-off..."
            className={`w-full px-3 py-2 border rounded-lg text-sm ${c.input} outline-none focus:ring-2`} />
        </div>

        <div className="mb-5">
          <label className={`text-xs font-bold ${c.label} block mb-1`}>Additional context (optional)</label>
          <input type="text" value={agContext} onChange={e => setAgContext(e.target.value)}
            placeholder="e.g., Previous meeting went nowhere, people keep relitigating..."
            className={`w-full px-3 py-2 border rounded-lg text-sm ${c.input} outline-none focus:ring-2`} />
        </div>

        <button onClick={runAgenda} disabled={!agTopic.trim() || loading}
          className={`w-full ${c.btnPrimaryPrimary} disabled:opacity-40 font-bold py-3 rounded-lg flex items-center justify-center gap-2 min-h-[48px]`}>
          {loading ? <><span className="animate-spin inline-block">{tool?.icon ?? '⚙️'}</span> Building agenda...</> : <><span>📋</span> Build Agenda</>}
        </button>
      </div>

      {/* Agenda Results */}
      {agResults && (
        <div className="space-y-3">
          <div className={`${c.card} border rounded-xl p-5`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`text-sm font-black ${c.text}`}>{agResults.meeting_title || 'Your Agenda'}</h3>
              <span className={`text-xs ${c.textMuteded}`}>{agResults.duration}</span>
            </div>

            {/* Pre-work */}
            {agResults.pre_work && (
              <div className={`${c.cardAlt} border rounded-lg p-3 mb-3`}>
                <p className="text-xs font-bold mb-1">📚 Pre-work (send {agResults.pre_work.when_to_send})</p>
                <p className="text-xs">{agResults.pre_work.what_to_send}</p>
                {agResults.pre_work.read_time && <p className={`text-[10px] ${c.textMuteded} mt-1`}>~{agResults.pre_work.read_time} to read</p>}
              </div>
            )}

            {/* Roles */}
            {agResults.roles && (
              <div className={`${c.quoteBg} rounded-lg p-3 mb-3`}>
                <p className="text-xs font-bold mb-1">👥 Roles</p>
                <div className="grid grid-cols-3 gap-2 text-[10px]">
                  <div><span className="font-bold">Facilitator:</span> {agResults.roles.facilitator}</div>
                  <div><span className="font-bold">Notes:</span> {agResults.roles.note_taker}</div>
                  <div><span className="font-bold">Timekeeper:</span> {agResults.roles.timekeeper}</div>
                </div>
              </div>
            )}

            {/* Agenda blocks */}
            {agResults.agenda_blocks?.map((block, i) => (
              <div key={i} className={`${c.card} border rounded-lg p-3 mb-2`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${c.cardAlt}`}>{block.time}</span>
                  <span className={`text-xs font-bold ${c.text}`}>{block.title}</span>
                </div>
                <p className={`text-xs ${c.textSecondary}`}>{block.description}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`text-[10px] ${c.textMuteded}`}>👤 {block.owner}</span>
                  {block.output && <span className={`text-[10px] ${c.textMuteded}`}>→ {block.output}</span>}
                </div>
              </div>
            ))}

            {/* Exit criteria */}
            {agResults.exit_criteria && (
              <div className={`${c.success} border rounded-lg p-3 mt-3`}>
                <p className="text-xs font-bold">✅ Done when:</p>
                <p className="text-xs mt-0.5">{agResults.exit_criteria}</p>
              </div>
            )}

            {agResults.decision_method && (
              <p className={`text-xs ${c.textSecondary} mt-2`}>🗳️ <strong>Decision method:</strong> {agResults.decision_method}</p>
            )}
          </div>

          {/* Calendar invite description */}
          {agResults.calendar_description && (
            <Section icon="📅" title="Calendar invite (copy & paste)" c={c} defaultOpen>
              <div className={`${c.quoteBg} rounded-lg p-3`}>
                <p className="text-xs whitespace-pre-wrap">{agResults.calendar_description}</p>
              </div>
              <CopyBtn content={agResults.calendar_description + '\n\n— Generated by DeftBrain · deftbrain.com'} label="Copy invite" />
            </Section>
          )}

          {/* Follow-up template */}
          {agResults.follow_up_template && (
            <Section icon="📨" title="Follow-up template" c={c}>
              <div className={`${c.quoteBg} rounded-lg p-3`}>
                <p className="text-xs whitespace-pre-wrap">{agResults.follow_up_template}</p>
              </div>
              <CopyBtn content={agResults.follow_up_template + '\n\n— Generated by DeftBrain · deftbrain.com'} label="Copy follow-up" />
            </Section>
          )}

          <ActionBar content={buildAgendaText()} />
        </div>
      )}
    </div>
  );

  // ════════════════════════════════════════════════════════════
  // RENDER: POST-MEETING SCORECARD
  // ════════════════════════════════════════════════════════════
  const renderScorecard = () => (
    <div className="space-y-4">
      <div className={`${c.card} border rounded-xl p-5`}>
        <div className={`mb-4 pb-3 border-b ${c.border}`}>
          <h2 className={`text-base font-black ${c.text}`}>⭐ Rate a Meeting</h2>
          <p className={`text-xs ${c.textMuteded} mt-1`}>10-second post-meeting check-in. Build data that reveals patterns.</p>
        </div>

        <div className="mb-4">
          <label className={`text-xs font-bold ${c.label} block mb-1`}>Meeting name *</label>
          <input type="text" value={scName} onChange={e => setScName(e.target.value)}
            placeholder="e.g., Monday team sync, 1:1 with Sarah..."
            className={`w-full px-3 py-2 border rounded-lg text-sm ${c.input} outline-none focus:ring-2`} />
        </div>

        {/* Score slider */}
        <div className="mb-4">
          <label className={`text-xs font-bold ${c.label} block mb-2`}>
            How productive was it? <span className="text-base ml-1">
              {['😩', '😕', '😐', '🙂', '🤩'][scScore - 1]}
            </span>
            <span className={`ml-1 ${c.textMuteded} font-normal`}>({scScore}/5)</span>
          </label>
          <input type="range" min="1" max="5" value={scScore}
            onChange={e => setScScore(parseInt(e.target.value))}
            className="w-full accent-indigo-600" />
          <div className="flex justify-between text-[9px] mt-0.5">
            <span className={c.textMuteded}>Total waste</span>
            <span className={c.textMuteded}>Highly productive</span>
          </div>
        </div>

        {/* Quick toggles */}
        <div className="space-y-2 mb-4">
          {[
            { label: 'A decision was actually made', val: scDecision, set: setScDecision, icon: '✅' },
            { label: 'It could have been shorter', val: scShorter, set: setScShorter, icon: '⏱️' },
            { label: 'Everyone there needed to be there', val: scAllNeeded, set: setScAllNeeded, icon: '👥' },
          ].map((toggle, i) => (
            <button key={i} onClick={() => toggle.set(!toggle.val)}
              className={`w-full flex items-center gap-2.5 p-2.5 rounded-lg border text-xs font-medium text-left min-h-[40px] transition-colors ${
                toggle.val ? c.success : `${c.card}`
              }`}>
              <span>{toggle.val ? toggle.icon : '○'}</span>
              <span>{toggle.label}</span>
            </button>
          ))}
        </div>

        <div className="mb-5">
          <label className={`text-xs font-bold ${c.label} block mb-1`}>Notes (optional)</label>
          <input type="text" value={scNotes} onChange={e => setScNotes(e.target.value)}
            placeholder="e.g., Got derailed by unrelated topic, good energy today..."
            className={`w-full px-3 py-2 border rounded-lg text-sm ${c.input} outline-none focus:ring-2`} />
        </div>

        <button onClick={addScorecard} disabled={!scName.trim()}
          className={`w-full ${c.btnPrimaryPrimary} disabled:opacity-40 font-bold py-3 rounded-lg flex items-center justify-center gap-2 min-h-[48px]`}>
          <span>⭐</span> Log Rating
        </button>
      </div>

      {/* Scorecard stats summary */}
      {scorecardStats && (
        <div className={`${c.card} border rounded-xl p-5`}>
          <h3 className={`text-sm font-black ${c.text} mb-3`}>📊 Your Meeting Patterns ({scorecards.length} rated)</h3>
          <div className="grid grid-cols-2 gap-2">
            <div className={`${scorecardStats.avgScore >= 3.5 ? c.success : scorecardStats.avgScore >= 2.5 ? c.warning : c.danger} border rounded-lg p-3 text-center`}>
              <p className="text-2xl font-black">{scorecardStats.avgScore.toFixed(1)}</p>
              <p className="text-[9px]">Avg score (of 5)</p>
            </div>
            <div className={`${scorecardStats.decisionPct >= 60 ? c.success : c.warning} border rounded-lg p-3 text-center`}>
              <p className="text-2xl font-black">{scorecardStats.decisionPct}%</p>
              <p className="text-[9px]">Made a decision</p>
            </div>
            <div className={`${scorecardStats.shorterPct > 50 ? c.danger : c.success} border rounded-lg p-3 text-center`}>
              <p className="text-2xl font-black">{scorecardStats.shorterPct}%</p>
              <p className="text-[9px]">Could be shorter</p>
            </div>
            <div className={`${scorecardStats.allNeededPct >= 70 ? c.success : c.warning} border rounded-lg p-3 text-center`}>
              <p className="text-2xl font-black">{scorecardStats.allNeededPct}%</p>
              <p className="text-[9px]">Right attendance</p>
            </div>
          </div>

          {scorecards.length >= 5 && (
            <div className={`${c.quoteBg} rounded-lg p-3 mt-3`}>
              <p className={`text-xs ${c.textSecondary} text-center`}>
                {scorecardStats.avgScore < 2.5
                  ? `Your meetings average ${scorecardStats.avgScore.toFixed(1)}/5. Only ${scorecardStats.decisionPct}% produce decisions. Time for a culture report →`
                  : scorecardStats.shorterPct > 60
                    ? `${scorecardStats.shorterPct}% of your meetings could be shorter. That's a lot of wasted time.`
                    : scorecardStats.avgScore >= 4.0
                      ? `${scorecardStats.avgScore.toFixed(1)}/5 average — your meeting hygiene is strong. 💪`
                      : `${scorecards.length} meetings rated. Patterns are emerging — generate a culture report for the full picture.`
                }
              </p>
              {scorecards.length >= 5 && (
                <button onClick={() => setView('report')}
                  className={`${c.btnPrimarySecondary} px-3 py-1.5 rounded-lg text-xs font-bold mt-2 mx-auto block min-h-[32px]`}>
                  📈 Generate Culture Report
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Scorecard history */}
      {scorecards.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className={`text-xs font-bold ${c.label} uppercase`}>Recent ratings</p>
            <button onClick={() => {
              if (window.confirm('Clear all scorecards?')) {
                setScorecards([]);
                saveScorecards([]);
              }
            }} className={`text-xs ${c.danger} min-h-[32px]`}>🗑️ Clear</button>
          </div>
          {scorecards.slice(0, 6).map(card => (
            <div key={card.id} className={`${c.card} border rounded-xl p-3`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm">{['😩', '😕', '😐', '🙂', '🤩'][card.score - 1]}</span>
                    <span className={`text-xs font-bold ${c.text} truncate`}>{card.name}</span>
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                      card.score >= 4 ? c.success : card.score >= 3 ? c.warning : c.danger
                    }`}>{card.score}/5</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {card.decisionMade && <span className={`text-[9px] ${c.success}`}>✅ Decision</span>}
                    {card.couldBeShorter && <span className={`text-[9px] ${c.warning}`}>⏱️ Too long</span>}
                    {!card.allNeeded && <span className={`text-[9px] ${c.danger}`}>👥 Wrong people</span>}
                  </div>
                  {card.notes && <p className={`text-[10px] ${c.textMuteded} mt-1 truncate`}>{card.notes}</p>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-[10px] ${c.textMuteded}`}>{new Date(card.date).toLocaleDateString()}</span>
                  <button onClick={() => removeScorecard(card.id)} className={`text-xs ${c.danger} min-h-[24px]`}>✕</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ════════════════════════════════════════════════════════════
  // RENDER: MEETING-FREE TIME CALCULATOR
  // ════════════════════════════════════════════════════════════
  const renderFocus = () => (
    <div className="space-y-4">
      <div className={`${c.card} border rounded-xl p-5`}>
        <div className={`mb-4 pb-3 border-b ${c.border}`}>
          <h2 className={`text-base font-black ${c.text}`}>🎯 Focus Time Calculator</h2>
          <p className={`text-xs ${c.textMuteded} mt-1`}>How much uninterrupted work time do you actually have?</p>
        </div>

        <div className="mb-4">
          <label className={`text-xs font-bold ${c.label} block mb-1`}>Work hours per day</label>
          <input type="number" value={workHoursPerDay} onChange={e => setWorkHoursPerDay(e.target.value)}
            min="1" max="16" className={`w-full px-3 py-2 border rounded-lg text-sm ${c.input} outline-none focus:ring-2`} />
        </div>

        <p className={`text-xs font-bold ${c.label} mb-2`}>Hours in meetings per day:</p>
        {focusMeetings.map((day, i) => (
          <div key={day.day} className="flex items-center gap-3 mb-2">
            <span className={`text-xs font-bold ${c.text} w-20`}>{day.day}</span>
            <input type="number" value={day.hours}
              onChange={e => {
                const updated = [...focusMeetings];
                updated[i] = { ...updated[i], hours: e.target.value };
                setFocusMeetings(updated);
              }}
              min="0" max="16" step="0.5"
              placeholder="0"
              className={`flex-1 px-3 py-2 border rounded-lg text-sm ${c.input} outline-none focus:ring-2`} />
            <span className={`text-xs ${c.textMuteded} w-16`}>{focusStats.days[i]?.focusHrs.toFixed(1)}h free</span>
          </div>
        ))}
      </div>

      {/* Results always visible */}
      <div className={`${c.card} border rounded-xl p-5`}>
        <h3 className={`text-sm font-black ${c.text} mb-3`}>Your Week at a Glance</h3>

        {/* Visual bar chart */}
        <div className="space-y-2 mb-4">
          {focusStats.days.map((day, i) => {
            const workHrs = parseFloat(workHoursPerDay) || 8;
            const mtgPct = workHrs > 0 ? (day.mtgHrs / workHrs) * 100 : 0;
            const focusPct = 100 - mtgPct;
            return (
              <div key={i}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className={`text-[10px] font-bold ${c.text} w-16`}>{day.day.slice(0, 3)}</span>
                  <span className={`text-[10px] ${c.textMuteded}`}>{day.focusHrs.toFixed(1)}h focus | {day.mtgHrs.toFixed(1)}h meetings</span>
                </div>
                <div className="flex h-3 rounded-full overflow-hidden">
                  <div className={`${isDark ? 'bg-emerald-600' : 'bg-emerald-400'} transition-all`} style={{ width: `${focusPct}%` }} />
                  <div className={`${isDark ? 'bg-red-600' : 'bg-red-400'} transition-all`} style={{ width: `${mtgPct}%` }} />
                </div>
              </div>
            );
          })}
          <div className="flex items-center gap-4 mt-1">
            <div className="flex items-center gap-1">
              <div className={`w-2.5 h-2.5 rounded ${isDark ? 'bg-emerald-600' : 'bg-emerald-400'}`} />
              <span className={`text-[9px] ${c.textMuteded}`}>Focus time</span>
            </div>
            <div className="flex items-center gap-1">
              <div className={`w-2.5 h-2.5 rounded ${isDark ? 'bg-red-600' : 'bg-red-400'}`} />
              <span className={`text-[9px] ${c.textMuteded}`}>Meetings</span>
            </div>
          </div>
        </div>

        {/* Big number stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className={`${focusStats.mtgPct > 50 ? c.danger : focusStats.mtgPct > 30 ? c.warning : c.success} border rounded-lg p-3 text-center`}>
            <p className="text-2xl font-black">{focusStats.totalFocus.toFixed(1)}h</p>
            <p className="text-[9px]">Total focus time</p>
          </div>
          <div className={`${c.cardAlt} border rounded-lg p-3 text-center`}>
            <p className={`text-2xl font-black ${c.textSecondaryondary}`}>{focusStats.totalMtg.toFixed(1)}h</p>
            <p className="text-[9px]">In meetings</p>
          </div>
          <div className={`${focusStats.mtgPct > 50 ? c.danger : focusStats.mtgPct > 30 ? c.warning : c.success} border rounded-lg p-3 text-center`}>
            <p className="text-2xl font-black">{focusStats.mtgPct}%</p>
            <p className="text-[9px]">Meeting load</p>
          </div>
        </div>

        {/* Insights */}
        <div className={`${c.quoteBg} rounded-lg p-3 space-y-2`}>
          {focusStats.bestDay && focusStats.bestDay.focusHrs > 0 && (
            <p className={`text-xs ${c.textSecondary}`}>
              🏆 <strong>{focusStats.bestDay.day}</strong> is your best day — {focusStats.bestDay.focusHrs.toFixed(1)}h of focus time. Schedule your hardest work here.
            </p>
          )}
          {focusStats.worstDay && focusStats.worstDay.mtgHrs > 0 && (
            <p className={`text-xs ${c.textSecondary}`}>
              🔴 <strong>{focusStats.worstDay.day}</strong> is your worst — only {focusStats.worstDay.focusHrs.toFixed(1)}h free. Consider moving or cutting meetings here.
            </p>
          )}
          {focusStats.mtgPct > 50 ? (
            <p className={`text-xs font-bold ${c.danger}`}>
              ⚠️ Over half your week is meetings. Deep work is nearly impossible. Time to audit aggressively.
            </p>
          ) : focusStats.mtgPct > 30 ? (
            <p className={`text-xs ${c.warning}`}>
              Your meeting load is above average. Look for 2-3 meetings you can cut or shorten.
            </p>
          ) : focusStats.totalMtg > 0 ? (
            <p className={`text-xs ${c.success}`}>
              Your meeting load is manageable. Protect this balance — it's rare.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════
  // RENDER: MEETING CULTURE REPORT
  // ════════════════════════════════════════════════════════════
  const renderReport = () => (
    <div className="space-y-4">
      <div className={`${c.card} border rounded-xl p-5`}>
        <div className={`mb-4 pb-3 border-b ${c.border}`}>
          <h2 className={`text-base font-black ${c.text}`}>📈 Meeting Culture Report</h2>
          <p className={`text-xs ${c.textMuteded} mt-1`}>
            {scorecards.length >= 5 && history.length >= 3
              ? `Based on ${scorecards.length} ratings + ${history.length} analyses — your data is ready.`
              : `Need data: ${scorecards.length < 5 ? `rate ${5 - scorecards.length} more meetings` : '✅ ratings ready'}${scorecards.length < 5 && history.length < 3 ? ' and ' : ''}${history.length < 3 ? `analyze ${3 - history.length} more meetings` : ''} for best results.`
            }
          </p>
        </div>

        {(scorecards.length > 0 || history.length > 0) && (
          <>
            <div className="mb-4">
              <label className={`text-xs font-bold ${c.label} block mb-1`}>Approx. weekly meeting hours (optional)</label>
              <input type="number" value={reportHours} onChange={e => setReportHours(e.target.value)}
                placeholder="e.g., 15" min="0" max="60"
                className={`w-full px-3 py-2 border rounded-lg text-sm ${c.input} outline-none focus:ring-2`} />
            </div>

            <button onClick={runReport} disabled={loading}
              className={`w-full ${c.btnPrimaryPrimary} disabled:opacity-40 font-bold py-3 rounded-lg flex items-center justify-center gap-2 min-h-[48px]`}>
              {loading ? <><span className="animate-spin inline-block">{tool?.icon ?? '⚙️'}</span> Generating report...</> : <><span>📈</span> Generate Report</>}
            </button>
          </>
        )}

        {scorecards.length === 0 && history.length === 0 && (
          <div className="text-center py-4">
            <span className="text-3xl block mb-2">📊</span>
            <p className={`text-sm ${c.textMuteded} mb-3`}>Rate some meetings first — that's the data this report is built on.</p>
            <button onClick={() => setView('scorecard')} className={`${c.btnPrimaryPrimary} px-4 py-2 rounded-lg text-xs font-bold min-h-[36px]`}>
              ⭐ Rate a Meeting
            </button>
          </div>
        )}
      </div>

      {/* Report results */}
      {reportResults && (
        <div className="space-y-3">
          {/* Grade card */}
          <div className={`${c.card} border rounded-xl p-5 text-center`}>
            <p className="text-4xl mb-1">{reportResults.headline_emoji || '📊'}</p>
            <p className={`text-3xl font-black ${
              reportResults.grade === 'A' ? c.success :
              reportResults.grade === 'B' ? c.textSecondaryondary :
              reportResults.grade === 'C' ? c.warning : c.danger
            }`}>{reportResults.grade}</p>
            <p className={`text-sm font-bold ${c.text} mt-1`}>{reportResults.grade_label}</p>
            <p className={`text-xs ${c.textMuteded} mt-1`}>{reportResults.period}</p>
          </div>

          {/* Headline stat */}
          <div className={`${c.verdict} border rounded-xl p-4 text-center`}>
            <p className={`text-sm font-bold ${c.text}`}>{reportResults.headline_stat}</p>
          </div>

          {/* Key stats grid */}
          {reportResults.key_stats?.length > 0 && (
            <div className={`${c.card} border rounded-xl p-4`}>
              <p className={`text-xs font-bold ${c.label} uppercase mb-2`}>Key metrics</p>
              <div className="grid grid-cols-2 gap-2">
                {reportResults.key_stats.map((s, i) => (
                  <div key={i} className={`${s.verdict === 'Good' ? c.success : s.verdict === 'Bad' ? c.danger : c.warning} border rounded-lg p-3 text-center`}>
                    <p className="text-lg">{s.emoji}</p>
                    <p className="text-lg font-black">{s.value}</p>
                    <p className="text-[9px]">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Time analysis */}
          {reportResults.time_analysis && (
            <div className={`${c.card} border rounded-xl p-4`}>
              <p className={`text-xs font-bold ${c.label} uppercase mb-2`}>Time breakdown</p>
              <div className="grid grid-cols-2 gap-2">
                <div className={`${c.cardAlt} border rounded-lg p-3 text-center`}>
                  <p className={`text-xl font-black ${c.textSecondaryondary}`}>{reportResults.time_analysis.meeting_hours_per_week}h</p>
                  <p className="text-[9px]">Meeting hrs/week</p>
                </div>
                <div className={`${c.success} border rounded-lg p-3 text-center`}>
                  <p className={`text-xl font-black`}>{reportResults.time_analysis.could_reclaim_hours}h</p>
                  <p className="text-[9px]">Could reclaim</p>
                </div>
              </div>
              {reportResults.time_analysis.maker_time_ratio && (
                <p className={`text-xs ${c.textSecondary} mt-2 text-center`}>⚖️ {reportResults.time_analysis.maker_time_ratio}</p>
              )}
            </div>
          )}

          {/* Wins and problems */}
          {reportResults.biggest_win && (
            <div className={`${c.success} border rounded-lg p-3`}>
              <p className="text-xs font-bold">🏆 Biggest win:</p>
              <p className="text-xs mt-0.5">{reportResults.biggest_win}</p>
            </div>
          )}
          {reportResults.biggest_problem && (
            <div className={`${c.danger} border rounded-lg p-3`}>
              <p className="text-xs font-bold">🔴 Biggest problem:</p>
              <p className="text-xs mt-0.5">{reportResults.biggest_problem}</p>
            </div>
          )}

          {/* Recommendations */}
          {reportResults.recommendations?.length > 0 && (
            <Section icon="💡" title="Recommendations" c={c} defaultOpen>
              <div className="space-y-2">
                {reportResults.recommendations.map((rec, i) => (
                  <div key={i} className={`${c.quoteBg} rounded-lg p-3`}>
                    <p className={`text-xs ${c.textSecondary}`}>{i + 1}. {rec}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Share summary */}
          {reportResults.share_summary && (
            <div className={`${c.cardAlt} border rounded-lg p-3`}>
              <p className="text-xs font-bold mb-1">📱 Share-ready summary:</p>
              <p className="text-xs italic">"{reportResults.share_summary}"</p>
            </div>
          )}

          <ActionBar content={buildReportText()} />
        </div>
      )}
    </div>
  );

  // ════════════════════════════════════════════════════════════
  // RENDER: TEAM / MANAGER MODE
  // ════════════════════════════════════════════════════════════
  const renderTeam = () => (
    <div className="space-y-4">
      <div className={`${c.card} border rounded-xl p-5`}>
        <div className={`mb-4 pb-3 border-b ${c.border}`}>
          <h2 className={`text-base font-black ${c.text}`}>👥 Team Meeting Health</h2>
          <p className={`text-xs ${c.textMuteded} mt-1`}>Analyze your team's total meeting load — find where to cut</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className={`text-xs font-bold ${c.label} block mb-1`}>Team size</label>
            <input type="number" value={teamSize} onChange={e => setTeamSize(e.target.value)}
              placeholder="e.g., 6" min="2" max="100"
              className={`w-full px-3 py-2 border rounded-lg text-sm ${c.input} outline-none focus:ring-2`} />
          </div>
          <div>
            <label className={`text-xs font-bold ${c.label} block mb-1`}>Team context</label>
            <input type="text" value={teamContext} onChange={e => setTeamContext(e.target.value)}
              placeholder="e.g., Engineering, remote, product team..."
              className={`w-full px-3 py-2 border rounded-lg text-sm ${c.input} outline-none focus:ring-2`} />
          </div>
        </div>

        <p className={`text-xs font-bold ${c.label} mb-2`}>Team meetings:</p>
        {teamMeetings.map((m, i) => (
          <div key={i} className={`${c.quoteBg} rounded-lg p-3 mb-2`}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-bold ${c.textSecondaryondary}`}>#{i + 1}</span>
              {teamMeetings.length > 1 && (
                <button onClick={() => removeTeamMeeting(i)} className={`ml-auto text-xs ${c.danger} min-h-[24px]`}>✕</button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <input type="text" value={m.title}
                onChange={e => updateTeamMeeting(i, 'title', e.target.value)}
                placeholder="Meeting name" className={`px-2 py-1.5 border rounded text-xs ${c.input}`} />
              <select value={m.duration} onChange={e => updateTeamMeeting(i, 'duration', e.target.value)}
                className={`px-2 py-1.5 border rounded text-xs ${c.input}`}>
                {['15 min', '30 min', '1 hour', '90 min', '2 hours'].map(d =>
                  <option key={d} value={d}>{d}</option>
                )}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input type="number" value={m.attendeesFromTeam}
                onChange={e => updateTeamMeeting(i, 'attendeesFromTeam', e.target.value)}
                placeholder="Team members in meeting" min="1"
                className={`px-2 py-1.5 border rounded text-xs ${c.input}`} />
              <select value={m.frequency} onChange={e => updateTeamMeeting(i, 'frequency', e.target.value)}
                className={`px-2 py-1.5 border rounded text-xs ${c.input}`}>
                {FREQUENCY_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>
        ))}

        {teamMeetings.length < 15 && (
          <button onClick={addTeamMeeting}
            className={`${c.btnPrimarySecondary} w-full py-2 rounded-lg text-xs font-bold mb-4 min-h-[36px]`}>
            + Add Meeting
          </button>
        )}

        <button onClick={runTeam} disabled={!teamMeetings.some(m => m.title.trim()) || loading}
          className={`w-full ${c.btnPrimaryPrimary} disabled:opacity-40 font-bold py-3 rounded-lg flex items-center justify-center gap-2 min-h-[48px]`}>
          {loading ? <><span className="animate-spin inline-block">{tool?.icon ?? '⚙️'}</span> Analyzing team...</> : <><span>👥</span> Analyze Team</>}
        </button>
      </div>

      {/* Team results */}
      {teamResults && (
        <div className="space-y-3">
          {/* Verdict */}
          <div className={`${verdictColor(teamResults.team_verdict)} border rounded-xl p-5 text-center`}>
            <p className="text-3xl mb-1">{teamResults.team_emoji}</p>
            <p className="text-lg font-black">{teamResults.team_verdict}</p>
            <p className={`text-xs ${c.textSecondary} mt-1`}>{teamResults.headline}</p>
          </div>

          {/* Team stats */}
          {teamResults.team_stats && (
            <div className="grid grid-cols-2 gap-2">
              <div className={`${c.cardAlt} border rounded-lg p-3 text-center`}>
                <p className={`text-2xl font-black ${c.textSecondaryondary}`}>{teamResults.team_stats.total_team_meeting_hours_per_week}h</p>
                <p className="text-[9px]">Team mtg hrs/week</p>
              </div>
              <div className={`${c.card} border rounded-lg p-3 text-center`}>
                <p className={`text-2xl font-black ${c.text}`}>{teamResults.team_stats.avg_per_person_per_week}h</p>
                <p className="text-[9px]">Avg per person/week</p>
              </div>
              <div className={`${teamResults.team_stats.pct_of_work_week_in_meetings > 30 ? c.danger : c.warning} border rounded-lg p-3 text-center`}>
                <p className="text-2xl font-black">{teamResults.team_stats.pct_of_work_week_in_meetings}%</p>
                <p className="text-[9px]">Of work week</p>
              </div>
              <div className={`${c.card} border rounded-lg p-3 text-center`}>
                <p className={`text-2xl font-black ${c.text}`}>{teamResults.team_stats.total_person_hours_per_week}h</p>
                <p className="text-[9px]">Total person-hours</p>
              </div>
            </div>
          )}

          {/* Meeting ranking */}
          {teamResults.meeting_ranking?.length > 0 && (
            <div className={`${c.card} border rounded-xl p-4`}>
              <p className={`text-xs font-bold ${c.label} uppercase mb-2`}>Meeting triage</p>
              <div className="space-y-2">
                {teamResults.meeting_ranking.map((m, i) => (
                  <div key={i} className={`flex items-center gap-3 p-2 rounded-lg ${c.quoteBg}`}>
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                      m.team_impact === 'HIGH' ? c.success :
                      m.team_impact === 'LOW' ? c.danger : c.warning
                    }`}>{m.team_impact}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold ${c.text} truncate`}>{m.title}</p>
                      <p className={`text-[10px] ${c.textMuteded}`}>{m.recommendation}</p>
                    </div>
                    {m.team_hours_saved_if_fixed > 0 && (
                      <span className={`text-[10px] font-bold ${c.success} flex-shrink-0`}>+{m.team_hours_saved_if_fixed}h</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top 3 changes */}
          {teamResults.top_3_changes?.length > 0 && (
            <Section icon="🎯" title="Top changes to make" c={c} defaultOpen>
              <div className="space-y-2">
                {teamResults.top_3_changes.map((ch, i) => (
                  <div key={i} className={`${c.success} border rounded-lg p-3`}>
                    <p className="text-xs">{i + 1}. {ch}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Overlaps & consolidation */}
          {teamResults.overlaps?.length > 0 && (
            <Section icon="🔄" title="Meeting overlaps" c={c}>
              <div className="space-y-1">
                {teamResults.overlaps.map((o, i) => (
                  <p key={i} className={`text-xs ${c.textSecondary}`}>• {o}</p>
                ))}
              </div>
            </Section>
          )}

          {teamResults.consolidation_opportunities?.length > 0 && (
            <Section icon="🔗" title="Consolidation opportunities" c={c}>
              <div className="space-y-1">
                {teamResults.consolidation_opportunities.map((o, i) => (
                  <p key={i} className={`text-xs ${c.textSecondary}`}>• {o}</p>
                ))}
              </div>
            </Section>
          )}

          {/* Manager talking points */}
          {teamResults.manager_talking_points?.length > 0 && (
            <Section icon="🎤" title="Say this to your team" c={c}>
              <div className="space-y-2">
                {teamResults.manager_talking_points.map((tp, i) => (
                  <div key={i} className={`${c.cardAlt} border rounded-lg p-3`}>
                    <p className="text-xs">"{tp}"</p>
                  </div>
                ))}
              </div>
              <CopyBtn content={teamResults.manager_talking_points.join('\n\n') + '\n\n— Generated by DeftBrain · deftbrain.com'} label="Copy talking points" />
            </Section>
          )}

          {teamResults.team_maker_time && (
            <div className={`${c.quoteBg} rounded-lg p-3`}>
              <p className={`text-xs ${c.textSecondary}`}>🎯 <strong>Team focus time:</strong> {teamResults.team_maker_time}</p>
            </div>
          )}

          <ActionBar content={buildTeamText()} />
        </div>
      )}
    </div>
  );
  const renderStats = () => (
    <div className="space-y-4">
      <div className={`${c.card} border rounded-xl p-5`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className={`text-lg font-bold ${c.text}`}>📊 Meeting Stats</h2>
            <p className={`text-sm ${c.textSecondary}`}>Your meeting analysis track record</p>
          </div>
          {history.length > 0 && (
            <button onClick={() => {
              if (window.confirm('Clear all history and stats?')) {
                setHistory([]);
                saveHistory([]);
                setStats({ totalAnalyzed: 0, hoursSaved: 0, meetingsKilled: 0, weeklyData: [] });
                saveStatsStore({ totalAnalyzed: 0, hoursSaved: 0, meetingsKilled: 0, weeklyData: [] });
              }
            }} className={`text-xs ${c.danger} min-h-[32px]`}>🗑️ Clear</button>
          )}
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className={`${c.cardAlt} rounded-lg p-3 text-center border`}>
            <p className={`text-2xl font-black ${c.textSecondaryondary}`}>{stats.totalAnalyzed}</p>
            <p className={`text-[9px] ${c.textMuteded}`}>Meetings analyzed</p>
          </div>
          <div className={`${c.success} rounded-lg p-3 text-center border`}>
            <p className={`text-2xl font-black ${c.success}`}>{stats.hoursSaved.toFixed(1)}h</p>
            <p className={`text-[9px] ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>Hours saved</p>
          </div>
          <div className={`${c.danger} rounded-lg p-3 text-center border`}>
            <p className={`text-2xl font-black ${c.danger}`}>{stats.meetingsKilled}</p>
            <p className={`text-[9px]`}>Meetings killed</p>
          </div>
        </div>

        {stats.totalAnalyzed > 0 && (
          <div className={`${c.quoteBg} rounded-lg p-3`}>
            <p className={`text-xs ${c.textSecondary} text-center`}>
              {stats.meetingsKilled > 0
                ? `You've identified ${Math.round((stats.meetingsKilled / stats.totalAnalyzed) * 100)}% of analyzed meetings as unnecessary — and saved ${stats.hoursSaved.toFixed(1)} hours so far.`
                : `${stats.totalAnalyzed} meetings analyzed so far. Keep going — the patterns will emerge.`
              }
            </p>
          </div>
        )}
      </div>

      {/* History */}
      {history.length > 0 ? (
        <div className="space-y-2">
          <p className={`text-xs font-bold ${c.label} uppercase`}>Recent analyses</p>
          {history.map(entry => (
            <div key={entry.id} className={`${c.card} border rounded-xl p-3`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${c.cardAlt}`}>{entry.type}</span>
                    <span className={`text-xs font-bold ${c.text} truncate`}>{entry.title}</span>
                  </div>
                  <p className={`text-[10px] ${c.textMuteded}`}>{new Date(entry.date).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {entry.verdict && (
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${verdictColor(entry.verdict)}`}>
                      {entry.verdict}
                    </span>
                  )}
                  {entry.hoursSaved > 0 && (
                    <span className={`text-[10px] font-bold ${c.success}`}>+{entry.hoursSaved}h</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={`${c.card} border rounded-xl p-8 text-center`}>
          <span className="text-3xl block mb-2">📊</span>
          <p className={`text-sm ${c.textMuteded}`}>No meetings analyzed yet. Start detecting BS!</p>
          <button onClick={() => setView('analyze')} className={`${c.btnPrimaryPrimary} px-4 py-2 rounded-lg text-xs font-bold mt-3 min-h-[36px]`}>
            🔍 Analyze First Meeting
          </button>
        </div>
      )}

      {/* Cross refs */}
      {history.length > 0 && (
        <div className={`${c.card} border rounded-xl p-4`}>
          <p className={`text-[10px] font-bold ${c.label} uppercase mb-2`}>Related tools</p>
          <div className="flex flex-wrap gap-2">
            {CROSS_REFS.map(ref => (
              <a key={ref.id} href={`/?tool=${ref.id}`} target="_blank" rel="noopener noreferrer"
                className={`${c.btnPrimarySecondary} px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 min-h-[32px]`}>
                <span>{ref.icon}</span> {ref.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // ════════════════════════════════════════════════════════════
  // MAIN RENDER
  // ════════════════════════════════════════════════════════════
  const handleReset = () => { setAnalyzeResults(null); setCalResults(null); setLiveResults(null); setRecResults(null); setMsgResults(null); setAgResults(null); setReportResults(null); setTeamResults(null); setError(''); };
  return (
    <div className={`space-y-4 ${c.text}`}>
      {renderNav()}

      {error && (
        <div className={`${c.danger} border rounded-lg p-4 flex items-start gap-3`}>
          <span className="flex-shrink-0">⚠️</span>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {view === 'analyze' && renderAnalyze()}
      {view === 'calendar' && renderCalendar()}
      {view === 'live' && renderLive()}
      {view === 'recurring' && renderRecurring()}
      {view === 'messages' && renderMessages()}
      {view === 'agenda' && renderAgenda()}
      {view === 'scorecard' && renderScorecard()}
      {view === 'focus' && renderFocus()}
      {view === 'report' && renderReport()}
      {view === 'team' && renderTeam()}
      {view === 'stats' && renderStats()}
        <div className={`mt-6 pt-4 border-t text-sm ${c.border} ${c.textMuted}`}>
          <p className="mb-2 font-medium">You might also like:</p>
          <div className="flex flex-wrap gap-2">
            {[{slug:'heckler-prep',label:'😤 Heckler Prep'},{slug:'jargon-assassin',label:'🗡️ Jargon Assassin'},{slug:'pre-mortem',label:'💀 Pre-Mortem'}].map(({slug,label})=>(
              <a key={slug} href={`${slug}`} className={linkStyle}>{label}</a>
            ))}
          </div>
        </div>
    </div>
  );
};

MeetingBSDetector.displayName = 'MeetingBSDetector';
export default MeetingBSDetector;
