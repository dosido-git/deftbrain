import React, { useState, useCallback, useRef } from 'react';
import { Loader2, Plus, X, Check, ChevronDown, ChevronUp, AlertCircle, Copy, Trash2, Scale, Dices, RotateCcw, MessageSquare, Shield, Eye, EyeOff, Gavel, Users, Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';
import { usePersistentState } from '../hooks/usePersistentState';

// ════════════════════════════════════════════════════════════
// THEME
// ════════════════════════════════════════════════════════════
const useColors = () => {
  const { theme } = useTheme();
  const d = theme === 'dark';
  return {
    d,
    bg: d ? 'bg-zinc-900' : 'bg-stone-50',
    bgCard: d ? 'bg-zinc-800' : 'bg-white',
    bgInset: d ? 'bg-zinc-700' : 'bg-stone-100',
    bgHover: d ? 'hover:bg-zinc-700' : 'hover:bg-stone-50',
    text: d ? 'text-zinc-50' : 'text-stone-900',
    textSec: d ? 'text-zinc-400' : 'text-stone-600',
    textMut: d ? 'text-zinc-500' : 'text-stone-400',
    border: d ? 'border-zinc-700' : 'border-stone-200',
    accent: d ? 'text-amber-400' : 'text-amber-600',
    accentBg: d ? 'bg-amber-500/20 border-amber-600/40' : 'bg-amber-50 border-amber-200',
    input: d ? 'bg-zinc-700 border-zinc-600 text-zinc-100 placeholder-zinc-500 focus:border-amber-500' : 'bg-white border-stone-300 text-stone-900 placeholder-stone-400 focus:border-amber-500',
    btn: d ? 'bg-amber-500 hover:bg-amber-400 text-zinc-900 font-bold' : 'bg-stone-800 hover:bg-stone-900 text-white font-bold',
    btnSec: d ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-200' : 'bg-stone-100 hover:bg-stone-200 text-stone-700',
    btnGhost: d ? 'text-zinc-400 hover:text-zinc-100' : 'text-stone-500 hover:text-stone-800',
    btnDis: d ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed' : 'bg-stone-200 text-stone-400 cursor-not-allowed',
    tabActive: d ? 'bg-amber-500 text-zinc-900' : 'bg-stone-800 text-white',
    tabInactive: d ? 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 border-zinc-700' : 'bg-white text-stone-500 hover:text-stone-700 border-stone-200',
    pillActive: d ? 'border-amber-500 bg-amber-900/30 text-amber-300' : 'border-amber-400 bg-amber-50 text-amber-700',
    pillInactive: d ? 'border-zinc-600 text-zinc-400' : 'border-stone-200 text-stone-500',
    successBg: d ? 'bg-emerald-900/30 border-emerald-700' : 'bg-emerald-50 border-emerald-200',
    successText: d ? 'text-emerald-300' : 'text-emerald-800',
    warnBg: d ? 'bg-amber-900/30 border-amber-700' : 'bg-amber-50 border-amber-200',
    warnText: d ? 'text-amber-300' : 'text-amber-800',
    dangerBg: d ? 'bg-red-900/30 border-red-700' : 'bg-red-50 border-red-200',
    dangerText: d ? 'text-red-300' : 'text-red-800',
    errBg: d ? 'bg-red-900/30 border-red-700' : 'bg-red-50 border-red-200',
    errText: d ? 'text-red-300' : 'text-red-700',
    verdictBg: d ? 'bg-slate-800 border-amber-600/50' : 'bg-slate-50 border-amber-300',
    verdictText: d ? 'text-amber-300' : 'text-amber-800',
    scriptBg: d ? 'bg-zinc-900/80 border-zinc-600' : 'bg-stone-50 border-stone-300',
    barColors: [
      d ? 'bg-amber-500' : 'bg-amber-500',
      d ? 'bg-sky-500' : 'bg-sky-500',
      d ? 'bg-emerald-500' : 'bg-emerald-500',
      d ? 'bg-violet-500' : 'bg-violet-500',
      d ? 'bg-rose-500' : 'bg-rose-500',
      d ? 'bg-cyan-500' : 'bg-cyan-500',
    ],
    effortLight: d ? 'bg-emerald-900/30 text-emerald-400 border-emerald-700' : 'bg-emerald-50 text-emerald-700 border-emerald-200',
    effortMed: d ? 'bg-amber-900/30 text-amber-400 border-amber-700' : 'bg-amber-50 text-amber-700 border-amber-200',
    effortHeavy: d ? 'bg-red-900/30 text-red-400 border-red-700' : 'bg-red-50 text-red-700 border-red-200',
  };
};

// ════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════
const DISPUTE_CATEGORIES = [
  { id: 'chores', label: '🧹 Chores' },
  { id: 'noise', label: '🔊 Noise' },
  { id: 'guests', label: '👥 Guests' },
  { id: 'space', label: '🛋️ Shared space' },
  { id: 'money', label: '💰 Money/Bills' },
  { id: 'food', label: '🍕 Food/Kitchen' },
  { id: 'pets', label: '🐾 Pets' },
  { id: 'boundaries', label: '🚪 Boundaries' },
  { id: 'lease', label: '📝 Lease/Moving' },
  { id: 'other', label: '💬 Other' },
];

const DURATION_OPTIONS = [
  { id: 'just_now', label: 'Just happened' },
  { id: 'days', label: 'Days' },
  { id: 'weeks', label: 'Weeks' },
  { id: 'months', label: 'Months' },
  { id: 'forever', label: 'Recurring forever' },
];

const COMM_OPTIONS = [
  { id: 'not_yet', label: 'Not yet' },
  { id: 'tried', label: 'Tried, went badly' },
  { id: 'circles', label: 'Going in circles' },
  { id: 'wont_engage', label: "They won't engage" },
];

const LIVING_OPTIONS = [
  { id: 'dorm', label: '🎓 College dorm' },
  { id: 'apartment', label: '🏢 Shared apt' },
  { id: 'house', label: '🏠 House' },
  { id: 'partner', label: '💑 Partner' },
  { id: 'family', label: '👨‍👩‍👧 Family' },
];

const COMMON_CHORES = [
  'Dishes', 'Vacuum', 'Bathroom', 'Trash', 'Kitchen wipe-down',
  'Mopping', 'Laundry (shared)', 'Grocery run',
];

const EFFORT_LABEL = { 1: 'Light', 2: 'Medium', 3: 'Heavy' };

// ════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════
const RoommateCourt = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const c = useColors();

  // Tabs
  const [activeTab, setActiveTab] = useState('dispute');

  // ── Persistent state ──
  const [roommates, setRoommates] = usePersistentState('court-members', []);
  const [choreList, setChoreList] = usePersistentState('court-chores', []);
  const [assignHistory, setAssignHistory] = usePersistentState('court-history', []);
  const [currentRound, setCurrentRound] = usePersistentState('court-current-round', null);

  // ── Dispute tab ──
  const [dispute, setDispute] = useState('');
  const [category, setCategory] = useState('');
  const [yourSide, setYourSide] = useState('');
  const [theirSide, setTheirSide] = useState('');
  const [duration, setDuration] = useState('');
  const [priorComm, setPriorComm] = useState('');
  const [livingSituation, setLivingSituation] = useState('');
  const [disputeResult, setDisputeResult] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    verdict: true, underlying: false, resolution: true, stuck: false, prevention: false, reality: false,
  });

  // ── Chore tab ──
  const [newRoommate, setNewRoommate] = useState('');
  const [newChore, setNewChore] = useState('');
  const [assignResult, setAssignResult] = useState(null);
  const [isShuffling, setIsShuffling] = useState(false);
  const [showRebalance, setShowRebalance] = useState(false);
  const [complaint, setComplaint] = useState('');
  const [rebalanceResult, setRebalanceResult] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  // Shared
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // ══════════════════════════════════════════
  // DISPUTE LOGIC
  // ══════════════════════════════════════════
  const submitDispute = useCallback(async () => {
    if (!dispute.trim()) return;
    setError(''); setDisputeResult(null);
    try {
      const res = await callToolEndpoint('roommate-court', {
        action: 'mediate',
        dispute: dispute.trim(),
        category: DISPUTE_CATEGORIES.find(c => c.id === category)?.label.replace(/^..\s/, '') || category,
        yourSide: yourSide.trim(),
        theirSide: theirSide.trim(),
        duration: DURATION_OPTIONS.find(d => d.id === duration)?.label || duration,
        priorCommunication: COMM_OPTIONS.find(c => c.id === priorComm)?.label || priorComm,
        livingSituation: LIVING_OPTIONS.find(l => l.id === livingSituation)?.label.replace(/^..\s/, '') || livingSituation,
      });
      setDisputeResult(res);
      setExpandedSections({ verdict: true, underlying: false, resolution: true, stuck: false, prevention: false, reality: false });
    } catch (err) { setError(err.message || 'Failed to mediate dispute'); }
  }, [dispute, category, yourSide, theirSide, duration, priorComm, livingSituation, callToolEndpoint]);

  const resetDispute = useCallback(() => {
    setDispute(''); setCategory(''); setYourSide(''); setTheirSide('');
    setDuration(''); setPriorComm(''); setLivingSituation('');
    setDisputeResult(null); setError('');
  }, []);

  // ══════════════════════════════════════════
  // CHORE LOGIC
  // ══════════════════════════════════════════
  const addRoommate = useCallback(() => {
    const name = newRoommate.trim();
    if (!name || roommates.includes(name)) return;
    setRoommates(prev => [...prev, name]);
    setNewRoommate('');
  }, [newRoommate, roommates, setRoommates]);

  const removeRoommate = useCallback((name) => {
    setRoommates(prev => prev.filter(n => n !== name));
  }, [setRoommates]);

  const addChore = useCallback((choreName) => {
    const name = (choreName || newChore).trim();
    if (!name || choreList.includes(name)) return;
    setChoreList(prev => [...prev, name]);
    setNewChore('');
  }, [newChore, choreList, setChoreList]);

  const removeChore = useCallback((name) => {
    setChoreList(prev => prev.filter(n => n !== name));
  }, [setChoreList]);

  const assignChores = useCallback(async () => {
    if (roommates.length < 2 || choreList.length < 1) return;
    setError(''); setAssignResult(null); setRebalanceResult(null);
    setShowRebalance(false); setComplaint('');
    setIsShuffling(true);

    // Brief shuffle animation delay
    await new Promise(r => setTimeout(r, 1200));

    try {
      const res = await callToolEndpoint('roommate-court', {
        action: 'assign',
        roommates,
        chores: choreList,
        history: assignHistory.slice(0, 10),
      });
      setAssignResult(res);
      setIsShuffling(false);

      // Save to current round (with completion tracking)
      const round = {
        id: Date.now(),
        date: new Date().toLocaleDateString(),
        assignments: res.assignments,
        fairness_score: res.fairness_score,
        completed: {},
      };
      setCurrentRound(round);
    } catch (err) {
      setError(err.message || 'Failed to assign chores');
      setIsShuffling(false);
    }
  }, [roommates, choreList, assignHistory, callToolEndpoint, setCurrentRound]);

  const saveRoundToHistory = useCallback(() => {
    if (!currentRound) return;
    setAssignHistory(prev => {
      const updated = [currentRound, ...prev].slice(0, 20);
      return updated;
    });
    setCurrentRound(null);
    setAssignResult(null);
  }, [currentRound, setAssignHistory, setCurrentRound]);

  const toggleChoreComplete = useCallback((roommate, choreName) => {
    if (!currentRound) return;
    const key = `${roommate}::${choreName}`;
    setCurrentRound(prev => ({
      ...prev,
      completed: { ...prev.completed, [key]: !prev.completed[key] },
    }));
  }, [currentRound, setCurrentRound]);

  const submitRebalance = useCallback(async () => {
    if (!complaint.trim() || !assignResult) return;
    setError(''); setRebalanceResult(null);
    try {
      const res = await callToolEndpoint('roommate-court', {
        action: 'rebalance',
        currentAssignments: assignResult.assignments,
        complaint: complaint.trim(),
        history: assignHistory.slice(0, 10),
        roommates,
      });
      setRebalanceResult(res);
      // If valid and revised, update current round
      if (res.complaint_valid && res.revised_assignments) {
        setAssignResult(prev => ({
          ...prev,
          assignments: res.revised_assignments,
          effort_totals: res.revised_effort_totals || prev.effort_totals,
          fairness_score: res.revised_fairness_score || prev.fairness_score,
        }));
        setCurrentRound(prev => prev ? {
          ...prev,
          assignments: res.revised_assignments,
          fairness_score: res.revised_fairness_score || prev.fairness_score,
        } : prev);
      }
    } catch (err) { setError(err.message || 'Failed to rebalance'); }
  }, [complaint, assignResult, assignHistory, roommates, callToolEndpoint, setCurrentRound]);

  // ══════════════════════════════════════════
  // HELPERS
  // ══════════════════════════════════════════
  const copyText = useCallback((text) => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  const toggleSection = (key) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const effortStyle = (effort) => {
    if (effort >= 3) return c.effortHeavy;
    if (effort >= 2) return c.effortMed;
    return c.effortLight;
  };

  // ══════════════════════════════════════════
  // RENDER: HEADER + TABS
  // ══════════════════════════════════════════
  const renderHeader = () => {
    const activeChoreCount = currentRound
      ? currentRound.assignments.reduce((sum, a) => sum + a.chores.filter(ch => !currentRound.completed[`${a.roommate}::${ch.name}`]).length, 0)
      : 0;

    return (
      <div className="mb-5">
        <div className="flex items-center gap-3 mb-4">
          <div>
            <h2 className={`text-2xl font-bold ${c.text}`}>RoommateCourt ⚖️</h2>
            <p className={`text-sm ${c.textMut}`}>Fair disputes, fair chores — no arguments</p>
          </div>
        </div>
        <div className="flex gap-1.5">
          {[
            { id: 'dispute', label: '⚖️ Dispute Court' },
            { id: 'chores', label: '🎰 Chore Roulette', badge: activeChoreCount },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5
                ${activeTab === tab.id ? c.tabActive : `${c.tabInactive} border`}`}>
              {tab.label}
              {tab.badge > 0 && (
                <span className={`ml-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black
                  ${activeTab === tab.id ? 'bg-white/20' : (c.d ? 'bg-amber-500/30 text-amber-300' : 'bg-amber-100 text-amber-700')}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
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
  // RENDER: DISPUTE COURT TAB
  // ══════════════════════════════════════════
  const renderDisputeTab = () => {

    const renderPillRow = (options, value, setter) => (
      <div className="flex flex-wrap gap-1.5 mb-3">
        {options.map(opt => (
          <button key={opt.id} onClick={() => setter(value === opt.id ? '' : opt.id)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all
              ${value === opt.id ? c.pillActive : c.pillInactive}`}>
            {opt.label}
          </button>
        ))}
      </div>
    );

    // ── Dispute results ──
    const renderDisputeResults = () => {
      if (!disputeResult) return null;
      const r = disputeResult;

      const renderCollapsible = (key, icon, title, children, defaultColor) => {
        const isOpen = expandedSections[key];
        return (
          <div className={`rounded-xl border ${c.border} ${c.bgCard} overflow-hidden mb-3`}>
            <button onClick={() => toggleSection(key)}
              className={`w-full flex items-center gap-2 p-4 text-left`}>
              <span>{icon}</span>
              <span className={`text-sm font-bold ${c.text} flex-1`}>{title}</span>
              {isOpen ? <ChevronUp className={`w-4 h-4 ${c.textMut}`} /> : <ChevronDown className={`w-4 h-4 ${c.textMut}`} />}
            </button>
            {isOpen && <div className="px-4 pb-4">{children}</div>}
          </div>
        );
      };

      // Fault bar
      const yourPct = r.verdict?.your_fault_pct || 50;
      const theirPct = r.verdict?.their_fault_pct || 50;

      return (
        <div className="space-y-3 mt-5">
          {/* Verdict */}
          {renderCollapsible('verdict', '⚖️', 'The Verdict', (
            <div className="space-y-3">
              <div className={`p-4 rounded-xl border-2 ${c.verdictBg}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Gavel className={`w-5 h-5 ${c.verdictText}`} />
                  <span className={`text-lg font-black ${c.verdictText} uppercase`}>
                    {r.verdict?.whos_right === 'you' ? "You're right" :
                     r.verdict?.whos_right === 'them' ? "They're right" :
                     r.verdict?.whos_right === 'both' ? "You're both right" : "Neither is right"}
                  </span>
                </div>
                <p className={`text-sm ${c.text}`}>{r.verdict?.reasoning}</p>
              </div>
              {/* Fault split bar */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className={`text-xs font-semibold ${c.textSec}`}>You: {yourPct}%</span>
                  <span className={`text-xs font-semibold ${c.textSec}`}>Them: {theirPct}%</span>
                </div>
                <div className={`h-3 rounded-full overflow-hidden flex ${c.d ? 'bg-zinc-700' : 'bg-stone-200'}`}>
                  <div className="bg-amber-500 h-full rounded-l-full transition-all" style={{ width: `${yourPct}%` }} />
                  <div className={`${c.d ? 'bg-sky-500' : 'bg-sky-500'} h-full rounded-r-full transition-all`} style={{ width: `${theirPct}%` }} />
                </div>
              </div>
            </div>
          ))}

          {/* Underlying issues */}
          {r.underlying_issues && renderCollapsible('underlying', '🔍', "What's Really Going On", (
            <div className="space-y-3">
              <div>
                <span className={`text-xs font-bold ${c.textMut} uppercase`}>Surface conflict</span>
                <p className={`text-sm ${c.text} mt-0.5`}>{r.underlying_issues.surface_conflict}</p>
              </div>
              <div>
                <span className={`text-xs font-bold ${c.accent} uppercase`}>Real conflict</span>
                <p className={`text-sm ${c.text} mt-0.5`}>{r.underlying_issues.real_conflict}</p>
              </div>
              <div>
                <span className={`text-xs font-bold ${c.textMut} uppercase`}>Communication breakdown</span>
                <p className={`text-sm ${c.text} mt-0.5`}>{r.underlying_issues.communication_breakdown}</p>
              </div>
            </div>
          ))}

          {/* Resolution path */}
          {r.resolution && renderCollapsible('resolution', '🤝', 'Resolution Path', (
            <div className="space-y-4">
              {/* Immediate actions */}
              {r.resolution.immediate_actions?.length > 0 && (
                <div>
                  <span className={`text-xs font-bold ${c.textSec} uppercase block mb-2`}>Do these now</span>
                  <div className="space-y-1.5">
                    {r.resolution.immediate_actions.map((act, i) => (
                      <div key={i} className={`flex items-start gap-2 text-sm ${c.text}`}>
                        <span className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-black text-white ${c.d ? 'bg-amber-600' : 'bg-amber-500'}`}>{i + 1}</span>
                        <span>{act}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Conversation script */}
              {r.resolution.conversation_script && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-bold ${c.textSec} uppercase`}>Conversation script</span>
                    <button onClick={() => copyText(r.resolution.conversation_script)}
                      className={`flex items-center gap-1 text-xs font-semibold ${c.btnGhost}`}>
                      {copied ? <><CheckCircle2 className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                    </button>
                  </div>
                  <div className={`p-4 rounded-xl border ${c.scriptBg} font-mono text-xs leading-relaxed whitespace-pre-wrap ${c.text}`}>
                    {r.resolution.conversation_script}
                  </div>
                </div>
              )}

              {/* Compromise */}
              {r.resolution.compromise && (
                <div className={`p-3 rounded-xl border ${c.successBg}`}>
                  <span className={`text-xs font-bold ${c.successText} uppercase block mb-1`}>Compromise</span>
                  <p className={`text-sm ${c.successText}`}>{r.resolution.compromise}</p>
                </div>
              )}

              {/* Boundaries */}
              {r.resolution.boundaries?.length > 0 && (
                <div>
                  <span className={`text-xs font-bold ${c.textSec} uppercase block mb-2`}>Set these boundaries</span>
                  {r.resolution.boundaries.map((b, i) => (
                    <div key={i} className={`flex items-start gap-2 text-sm ${c.text} mb-1.5`}>
                      <Shield className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${c.accent}`} />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* If stuck */}
          {r.if_stuck && renderCollapsible('stuck', '🚨', "If They Won't Cooperate", (
            <div className="space-y-3">
              {r.if_stuck.escalation_options?.length > 0 && (
                <div>
                  <span className={`text-xs font-bold ${c.textSec} uppercase block mb-2`}>Escalation ladder</span>
                  {r.if_stuck.escalation_options.map((opt, i) => (
                    <div key={i} className={`flex items-start gap-2 text-sm ${c.text} mb-1.5`}>
                      <span className={`text-xs font-bold ${c.textMut}`}>{i + 1}.</span>
                      <span>{opt}</span>
                    </div>
                  ))}
                </div>
              )}
              {r.if_stuck.self_protection && (
                <div className={`p-3 rounded-xl border ${c.warnBg}`}>
                  <span className={`text-xs font-bold ${c.warnText} uppercase block mb-1`}>Self-protection</span>
                  <p className={`text-sm ${c.warnText}`}>{r.if_stuck.self_protection}</p>
                </div>
              )}
              {r.if_stuck.exit_strategy && (
                <div className={`p-3 rounded-xl border ${c.dangerBg}`}>
                  <span className={`text-xs font-bold ${c.dangerText} uppercase block mb-1`}>Exit strategy</span>
                  <p className={`text-sm ${c.dangerText}`}>{r.if_stuck.exit_strategy}</p>
                </div>
              )}
            </div>
          ))}

          {/* Prevention */}
          {r.prevention && renderCollapsible('prevention', '🛡️', 'Prevention', (
            <p className={`text-sm ${c.text}`}>{r.prevention}</p>
          ))}

          {/* Reality check */}
          {r.reality_check && renderCollapsible('reality', '🪞', 'Reality Check', (
            <div className={`p-4 rounded-xl border-2 ${c.verdictBg}`}>
              <p className={`text-sm ${c.verdictText} italic`}>{r.reality_check}</p>
            </div>
          ))}

          <button onClick={resetDispute}
            className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 ${c.btnSec}`}>
            <RotateCcw className="w-4 h-4" /> File Another Case
          </button>
        </div>
      );
    };

    if (disputeResult) return renderDisputeResults();

    // ── Input form ──
    return (
      <div>
        <div className={`p-5 rounded-2xl border ${c.border} ${c.bgCard} mb-4`}>
          <span className={`text-xs font-bold ${c.textSec} uppercase tracking-wide mb-3 block`}>File a case</span>

          <span className={`text-xs font-semibold ${c.textSec} mb-1.5 block`}>What's the dispute about?</span>
          <textarea value={dispute} onChange={e => setDispute(e.target.value)}
            placeholder="Describe the situation as fairly as you can..."
            rows={3}
            className={`w-full px-4 py-2.5 rounded-xl border text-sm ${c.input} outline-none mb-3 resize-none`} />

          <span className={`text-xs font-semibold ${c.textSec} mb-1.5 block`}>Category</span>
          {renderPillRow(DISPUTE_CATEGORIES, category, setCategory)}

          <span className={`text-xs font-semibold ${c.textSec} mb-1.5 block`}>Your side</span>
          <textarea value={yourSide} onChange={e => setYourSide(e.target.value)}
            placeholder="What's your perspective? What do you want?"
            rows={2}
            className={`w-full px-4 py-2.5 rounded-xl border text-sm ${c.input} outline-none mb-3 resize-none`} />

          <span className={`text-xs font-semibold ${c.textSec} mb-1.5 block`}>Their side (be honest)</span>
          <textarea value={theirSide} onChange={e => setTheirSide(e.target.value)}
            placeholder="What would THEY say if they were here?"
            rows={2}
            className={`w-full px-4 py-2.5 rounded-xl border text-sm ${c.input} outline-none mb-3 resize-none`} />

          <span className={`text-xs font-semibold ${c.textSec} mb-1.5 block`}>How long?</span>
          {renderPillRow(DURATION_OPTIONS, duration, setDuration)}

          <span className={`text-xs font-semibold ${c.textSec} mb-1.5 block`}>Have you talked?</span>
          {renderPillRow(COMM_OPTIONS, priorComm, setPriorComm)}

          <span className={`text-xs font-semibold ${c.textSec} mb-1.5 block`}>Living situation</span>
          {renderPillRow(LIVING_OPTIONS, livingSituation, setLivingSituation)}
        </div>

        <button onClick={submitDispute}
          disabled={loading || !dispute.trim()}
          className={`w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2
            ${dispute.trim() && !loading ? c.btn : c.btnDis}`}>
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> The court is deliberating...</>
            : <><Gavel className="w-4 h-4" /> Hear My Case</>}
        </button>
      </div>
    );
  };

  // ══════════════════════════════════════════
  // RENDER: CHORE ROULETTE TAB
  // ══════════════════════════════════════════
  const renderChoreTab = () => {

    // ── Fairness bar ──
    const renderFairnessBar = (effortTotals) => {
      if (!effortTotals) return null;
      const names = Object.keys(effortTotals);
      const totalEffort = Object.values(effortTotals).reduce((s, v) => s + v, 0) || 1;

      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold ${c.textSec} uppercase`}>Effort balance</span>
            {assignResult?.fairness_score && (
              <span className={`text-xs font-bold ${assignResult.fairness_score >= 80 ? c.successText : assignResult.fairness_score >= 60 ? c.warnText : c.dangerText}`}>
                {assignResult.fairness_score}% fair
              </span>
            )}
          </div>
          {/* Stacked bar */}
          <div className={`h-5 rounded-full overflow-hidden flex ${c.d ? 'bg-zinc-700' : 'bg-stone-200'}`}>
            {names.map((name, i) => (
              <div key={name} className={`${c.barColors[i % c.barColors.length]} h-full transition-all`}
                style={{ width: `${(effortTotals[name] / totalEffort) * 100}%` }}
                title={`${name}: ${effortTotals[name]} pts`} />
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {names.map((name, i) => (
              <span key={name} className={`flex items-center gap-1.5 text-xs ${c.textSec}`}>
                <span className={`w-2.5 h-2.5 rounded-full ${c.barColors[i % c.barColors.length]}`} />
                {name}: {effortTotals[name]} pts
              </span>
            ))}
          </div>
        </div>
      );
    };

    // ── Assignment cards ──
    const renderAssignments = () => {
      if (!assignResult) return null;
      const r = assignResult;

      return (
        <div className="space-y-4 mt-5">
          {/* Fairness bar */}
          <div className={`p-4 rounded-xl border ${c.border} ${c.bgCard}`}>
            {renderFairnessBar(r.effort_totals)}
          </div>

          {/* Per-roommate assignment cards */}
          {r.assignments.map((a, idx) => (
            <div key={a.roommate} className={`p-4 rounded-xl border ${c.border} ${c.bgCard}`}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white ${c.barColors[idx % c.barColors.length]}`}>
                  {a.roommate.charAt(0).toUpperCase()}
                </span>
                <span className={`text-sm font-bold ${c.text}`}>{a.roommate}</span>
                <span className={`text-xs ${c.textMut} ml-auto`}>
                  {a.chores.reduce((s, ch) => s + ch.effort, 0)} pts
                </span>
              </div>
              <div className="space-y-1.5">
                {a.chores.map(ch => {
                  const key = `${a.roommate}::${ch.name}`;
                  const done = currentRound?.completed?.[key];
                  return (
                    <button key={ch.name} onClick={() => toggleChoreComplete(a.roommate, ch.name)}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-lg border text-left transition-all
                        ${done ? (c.d ? 'bg-emerald-900/20 border-emerald-700' : 'bg-emerald-50 border-emerald-200')
                          : `${c.bgInset} ${c.border}`}`}>
                      <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center
                        ${done ? 'bg-emerald-500 border-emerald-500 text-white' : c.border}`}>
                        {done && <Check className="w-3 h-3" />}
                      </div>
                      <span className={`flex-1 text-sm ${done ? `line-through ${c.textMut}` : c.text}`}>{ch.name}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${effortStyle(ch.effort)}`}>
                        {EFFORT_LABEL[ch.effort] || 'Med'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* AI reasoning */}
          {r.reasoning && (
            <div className={`p-4 rounded-xl border ${c.border} ${c.bgCard}`}>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className={`w-4 h-4 ${c.accent}`} />
                <span className={`text-xs font-bold ${c.textSec} uppercase`}>Why these assignments</span>
              </div>
              <p className={`text-sm ${c.textSec}`}>{r.reasoning}</p>
            </div>
          )}

          {/* Rebalance section */}
          <div className={`p-4 rounded-xl border ${c.border} ${c.bgCard}`}>
            {!showRebalance ? (
              <button onClick={() => setShowRebalance(true)}
                className={`w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 ${c.btnSec}`}>
                <AlertTriangle className="w-4 h-4" /> That's Not Fair!
              </button>
            ) : (
              <div className="space-y-3">
                <span className={`text-xs font-bold ${c.textSec} uppercase`}>What's unfair?</span>
                <textarea value={complaint} onChange={e => setComplaint(e.target.value)}
                  placeholder='e.g. "I always get bathroom" or "Jordan never does heavy chores"'
                  rows={2}
                  className={`w-full px-3 py-2.5 rounded-xl border text-sm ${c.input} outline-none resize-none`} />
                <div className="flex gap-2">
                  <button onClick={submitRebalance}
                    disabled={loading || !complaint.trim()}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2
                      ${complaint.trim() && !loading ? c.btn : c.btnDis}`}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scale className="w-4 h-4" />}
                    {loading ? 'Reviewing...' : 'Review Complaint'}
                  </button>
                  <button onClick={() => { setShowRebalance(false); setComplaint(''); setRebalanceResult(null); }}
                    className={`px-3 py-2.5 rounded-xl text-xs font-semibold ${c.btnSec}`}>Cancel</button>
                </div>

                {rebalanceResult && (
                  <div className={`p-4 rounded-xl border ${rebalanceResult.complaint_valid ? c.successBg : c.warnBg}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {rebalanceResult.complaint_valid
                        ? <CheckCircle2 className={`w-4 h-4 ${c.successText}`} />
                        : <Scale className={`w-4 h-4 ${c.warnText}`} />}
                      <span className={`text-sm font-bold ${rebalanceResult.complaint_valid ? c.successText : c.warnText}`}>
                        {rebalanceResult.complaint_valid ? 'Complaint upheld — assignments revised' : 'Complaint reviewed — assignments are fair'}
                      </span>
                    </div>
                    <p className={`text-sm ${rebalanceResult.complaint_valid ? c.successText : c.warnText}`}>
                      {rebalanceResult.explanation}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Save round */}
          <div className="flex gap-2">
            <button onClick={saveRoundToHistory}
              className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 ${c.btn}`}>
              <Check className="w-4 h-4" /> Finalize Round
            </button>
            <button onClick={assignChores}
              disabled={loading || isShuffling}
              className={`py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 ${c.btnSec}`}>
              <RotateCcw className="w-4 h-4" /> Reshuffle
            </button>
          </div>
        </div>
      );
    };

    // ── Shuffle animation ──
    const renderShuffling = () => (
      <div className={`p-8 rounded-2xl border ${c.border} ${c.bgCard} mt-5 text-center`}>
        <Dices className={`w-10 h-10 mx-auto mb-3 ${c.accent} animate-bounce`} />
        <p className={`text-sm font-bold ${c.text} mb-1`}>Shuffling the deck...</p>
        <p className={`text-xs ${c.textMut}`}>Balancing effort based on history</p>
      </div>
    );

    // ── History section ──
    const renderHistorySection = () => {
      if (assignHistory.length === 0) return null;
      return (
        <div className={`mt-5 rounded-xl border ${c.border} ${c.bgCard} overflow-hidden`}>
          <button onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center gap-2 p-4 text-left">
            <span className={`text-sm font-bold ${c.text} flex-1`}>📋 History</span>
            <span className={`text-xs ${c.textMut}`}>{assignHistory.length} rounds</span>
            {showHistory ? <ChevronUp className={`w-4 h-4 ${c.textMut}`} /> : <ChevronDown className={`w-4 h-4 ${c.textMut}`} />}
          </button>
          {showHistory && (
            <div className="px-4 pb-4 space-y-3">
              {/* Running totals */}
              <div className={`p-3 rounded-lg ${c.bgInset}`}>
                <span className={`text-xs font-bold ${c.textSec} uppercase block mb-2`}>All-time effort totals</span>
                <div className="flex flex-wrap gap-3">
                  {(() => {
                    const totals = {};
                    assignHistory.forEach(round => {
                      round.assignments.forEach(a => {
                        if (!totals[a.roommate]) totals[a.roommate] = 0;
                        a.chores.forEach(ch => { totals[a.roommate] += ch.effort; });
                      });
                    });
                    return Object.entries(totals).sort((a, b) => b[1] - a[1]).map(([name, total], i) => (
                      <span key={name} className={`text-xs font-semibold ${c.text}`}>
                        {name}: <span className={c.accent}>{total} pts</span>
                      </span>
                    ));
                  })()}
                </div>
              </div>

              {/* Individual rounds */}
              {assignHistory.slice(0, 10).map((round, ri) => (
                <div key={round.id || ri} className={`p-3 rounded-lg border ${c.border}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-bold ${c.textSec}`}>{round.date}</span>
                    {round.fairness_score && (
                      <span className={`text-xs font-semibold ${round.fairness_score >= 80 ? c.successText : c.warnText}`}>
                        {round.fairness_score}% fair
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    {round.assignments.map(a => (
                      <div key={a.roommate} className={`text-xs ${c.textSec}`}>
                        <span className={`font-semibold ${c.text}`}>{a.roommate}:</span>{' '}
                        {a.chores.map(ch => ch.name).join(', ')}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <button onClick={() => { setAssignHistory([]); setShowHistory(false); }}
                className={`w-full text-center text-xs font-semibold ${c.btnGhost} hover:text-red-500 py-1.5`}>
                Clear all history
              </button>
            </div>
          )}
        </div>
      );
    };

    return (
      <div>
        {/* Household roster */}
        <div className={`p-4 rounded-2xl border ${c.border} ${c.bgCard} mb-4`}>
          <span className={`text-xs font-bold ${c.textSec} uppercase tracking-wide mb-3 block`}>
            <Users className="w-3.5 h-3.5 inline mr-1.5" />Household ({roommates.length})
          </span>

          <div className="flex gap-2 mb-3">
            <input type="text" value={newRoommate} onChange={e => setNewRoommate(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addRoommate(); }}
              placeholder="Add roommate..."
              className={`flex-1 px-3 py-2.5 rounded-xl border text-sm ${c.input} outline-none`} />
            <button onClick={addRoommate} disabled={!newRoommate.trim()}
              className={`px-3 py-2.5 rounded-xl text-sm font-bold ${newRoommate.trim() ? c.btn : c.btnDis}`}>
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {roommates.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {roommates.map((name, i) => (
                <span key={name} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold ${c.pillActive}`}>
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black text-white ${c.barColors[i % c.barColors.length]}`}>
                    {name.charAt(0).toUpperCase()}
                  </span>
                  {name}
                  <button onClick={() => removeRoommate(name)} className="hover:text-red-500 ml-0.5"><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
          ) : (
            <p className={`text-xs ${c.textMut} text-center py-2`}>Add at least 2 household members to get started</p>
          )}
        </div>

        {/* Chore list */}
        <div className={`p-4 rounded-2xl border ${c.border} ${c.bgCard} mb-4`}>
          <span className={`text-xs font-bold ${c.textSec} uppercase tracking-wide mb-3 block`}>Chores</span>

          {/* Quick add common chores */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {COMMON_CHORES.filter(ch => !choreList.includes(ch)).map(ch => (
              <button key={ch} onClick={() => addChore(ch)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${c.pillInactive} hover:${c.pillActive}`}>
                + {ch}
              </button>
            ))}
          </div>

          <div className="flex gap-2 mb-3">
            <input type="text" value={newChore} onChange={e => setNewChore(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addChore(); }}
              placeholder="Custom chore..."
              className={`flex-1 px-3 py-2.5 rounded-xl border text-sm ${c.input} outline-none`} />
            <button onClick={() => addChore()} disabled={!newChore.trim()}
              className={`px-3 py-2.5 rounded-xl text-sm font-bold ${newChore.trim() ? c.btn : c.btnDis}`}>
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {choreList.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {choreList.map(ch => (
                <span key={ch} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold ${c.pillActive}`}>
                  {ch}
                  <button onClick={() => removeChore(ch)} className="hover:text-red-500 ml-0.5"><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
          ) : (
            <p className={`text-xs ${c.textMut} text-center py-2`}>What needs doing? Add chores above</p>
          )}
        </div>

        {/* Assign button */}
        {roommates.length >= 2 && choreList.length >= 1 && !assignResult && !isShuffling && (
          <button onClick={assignChores}
            disabled={loading}
            className={`w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2
              ${!loading ? c.btn : c.btnDis}`}>
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Shuffling...</>
              : <><Dices className="w-4 h-4" /> Assign Chores</>}
          </button>
        )}

        {/* Empty state */}
        {roommates.length < 2 && choreList.length === 0 && (
          <div className={`p-6 rounded-2xl border border-dashed ${c.border} text-center`}>
            <Scale className={`w-8 h-8 mx-auto mb-2 ${c.textMut}`} />
            <p className={`text-sm ${c.textMut}`}>Add roommates and chores above to get started.</p>
            <p className={`text-xs ${c.textMut} mt-1`}>The AI balances workload so nobody can claim it's unfair.</p>
          </div>
        )}

        {isShuffling && !assignResult && renderShuffling()}
        {assignResult && renderAssignments()}
        {renderHistorySection()}
      </div>
    );
  };

  // ══════════════════════════════════════════
  // MAIN RENDER
  // ══════════════════════════════════════════
  return (
    <div className={c.text}>
      {renderHeader()}
      {activeTab === 'dispute' && renderDisputeTab()}
      {activeTab === 'chores' && renderChoreTab()}
      {renderError()}
    </div>
  );
};

RoommateCourt.displayName = 'RoommateCourt';
export default RoommateCourt;
