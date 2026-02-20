import React, { useState, useCallback } from 'react';
import { Loader2, AlertCircle, Check, ChevronDown, ChevronUp, RefreshCw, Copy, Shuffle, User, ArrowRight, ArrowLeftRight, Pencil, Trash2, Sparkles } from 'lucide-react';
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
    text: d ? 'text-zinc-50' : 'text-gray-900',
    textSec: d ? 'text-zinc-400' : 'text-gray-600',
    textMut: d ? 'text-zinc-500' : 'text-gray-500',
    border: d ? 'border-zinc-700' : 'border-stone-200',
    card: d ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-stone-200',
    inset: d ? 'bg-zinc-700' : 'bg-stone-100',
    input: d ? 'bg-zinc-700 border-zinc-600 text-zinc-100 placeholder-zinc-500 focus:border-indigo-500' : 'bg-white border-stone-300 text-gray-900 placeholder-stone-400 focus:border-indigo-500',
    label: d ? 'text-zinc-300' : 'text-gray-700',
    btn: d ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white',
    btnSec: d ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-200' : 'bg-stone-100 hover:bg-stone-200 text-gray-700',
    btnGhost: d ? 'text-zinc-400 hover:text-zinc-100' : 'text-gray-500 hover:text-gray-800',
    btnDis: d ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed' : 'bg-stone-200 text-stone-400 cursor-not-allowed',
    pillActive: d ? 'border-indigo-500 bg-indigo-900/30 text-indigo-300' : 'border-indigo-500 bg-indigo-50 text-indigo-700',
    pillInactive: d ? 'border-zinc-600 text-zinc-400 hover:border-zinc-500' : 'border-stone-200 text-gray-500 hover:border-stone-400',
    // Chain
    chainNode: d ? 'bg-indigo-900/40 border-indigo-600 text-indigo-200' : 'bg-indigo-50 border-indigo-300 text-indigo-800',
    chainNodeA: d ? 'bg-violet-900/40 border-violet-500 text-violet-200' : 'bg-violet-50 border-violet-400 text-violet-800',
    chainNodeB: d ? 'bg-emerald-900/40 border-emerald-500 text-emerald-200' : 'bg-emerald-50 border-emerald-400 text-emerald-800',
    chainLine: d ? 'border-indigo-700' : 'border-indigo-200',
    chainLink: d ? 'text-zinc-400' : 'text-gray-500',
    chainExplain: d ? 'text-zinc-300' : 'text-gray-700',
    insightBg: d ? 'bg-violet-900/20 border-violet-700/40' : 'bg-violet-50 border-violet-200',
    insightText: d ? 'text-violet-300' : 'text-violet-800',
    insightTitle: d ? 'text-violet-200' : 'text-violet-900',
    profileBg: d ? 'bg-indigo-900/15 border-indigo-700/40' : 'bg-indigo-50/50 border-indigo-200',
    profileAccent: d ? 'text-indigo-400' : 'text-indigo-700',
    errBg: d ? 'bg-red-900/30 border-red-700' : 'bg-red-50 border-red-200',
    errText: d ? 'text-red-300' : 'text-red-700',
    histBg: d ? 'bg-indigo-900/15 border-indigo-700/40' : 'bg-indigo-50/50 border-indigo-200',
    histCard: d ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-stone-200',
    histAccent: d ? 'text-indigo-400' : 'text-indigo-700',
  };
};

// ════════════════════════════════════════════════════════════
// PROFILE PILL OPTIONS
// ════════════════════════════════════════════════════════════
const INTEREST_PILLS = [
  { value: 'music', label: '🎵 Music' },
  { value: 'cooking', label: '🍳 Cooking' },
  { value: 'sports', label: '⚽ Sports' },
  { value: 'gaming', label: '🎮 Gaming' },
  { value: 'reading', label: '📚 Reading' },
  { value: 'travel', label: '✈️ Travel' },
  { value: 'art', label: '🎨 Art' },
  { value: 'tech', label: '💻 Tech' },
  { value: 'outdoors', label: '🏕️ Outdoors' },
  { value: 'fitness', label: '💪 Fitness' },
  { value: 'film', label: '🎬 Film/TV' },
  { value: 'science', label: '🔬 Science' },
  { value: 'writing', label: '✍️ Writing' },
  { value: 'pets', label: '🐾 Pets' },
  { value: 'gardening', label: '🌱 Gardening' },
  { value: 'fashion', label: '👗 Fashion' },
];

const FUN_PAIR_STARTERS = [
  ['My college major', 'My current career'],
  ['My childhood hobby', 'Where I live now'],
  ['My first job', 'My closest friend'],
  ['My biggest fear', 'My favorite food'],
  ['My hometown', 'My taste in music'],
  ['My worst subject in school', 'My best skill now'],
  ['A trip that changed me', 'My daily routine'],
  ['My favorite book', 'How I met my partner'],
  ['My weirdest habit', 'My proudest achievement'],
  ['A failure that shaped me', 'What I do for fun'],
];

// ════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════
const SixDegreesOfMe = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const c = useColors();

  // ── Persistent Profile ──
  const [profile, setProfile] = usePersistentState('six-degrees-profile', {
    hometown: '',
    schools: '',
    jobs: '',
    interests: [],
    freeform: '',
  });
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileDraft, setProfileDraft] = useState(profile);

  // ── Past chains ──
  const [history, setHistory] = usePersistentState('six-degrees-history', []);
  const [showHistory, setShowHistory] = useState(false);

  // ── Inputs ──
  const [thingA, setThingA] = useState('');
  const [thingB, setThingB] = useState('');

  // ── Results ──
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // ══════════════════════════════════════════
  // PROFILE
  // ══════════════════════════════════════════
  const hasProfile = profile.hometown || profile.schools || profile.jobs || profile.interests.length > 0 || profile.freeform;

  const startEditProfile = useCallback(() => {
    setProfileDraft({ ...profile });
    setEditingProfile(true);
  }, [profile]);

  const saveProfile = useCallback(() => {
    setProfile(profileDraft);
    setEditingProfile(false);
  }, [profileDraft, setProfile]);

  const toggleInterest = useCallback((val) => {
    setProfileDraft(prev => ({
      ...prev,
      interests: prev.interests.includes(val)
        ? prev.interests.filter(i => i !== val)
        : [...prev.interests, val],
    }));
  }, []);

  const profileSummary = useCallback(() => {
    const parts = [];
    if (profile.hometown) parts.push(`From ${profile.hometown}`);
    if (profile.schools) parts.push(profile.schools);
    if (profile.jobs) parts.push(profile.jobs);
    if (profile.interests.length) parts.push(profile.interests.map(i => {
      const p = INTEREST_PILLS.find(x => x.value === i);
      return p ? p.label.replace(/^[^\s]+\s/, '') : i;
    }).join(', '));
    return parts.join(' · ') || 'No profile yet';
  }, [profile]);

  // ══════════════════════════════════════════
  // API
  // ══════════════════════════════════════════
  const generate = useCallback(async (a, b) => {
    const pointA = a || thingA.trim();
    const pointB = b || thingB.trim();
    if (!pointA || !pointB) {
      setError('Fill in both Thing A and Thing B');
      return;
    }
    setError(''); setResults(null); setCopied(false);

    // Build profile context string
    const ctx = [];
    if (profile.hometown) ctx.push(`Hometown: ${profile.hometown}`);
    if (profile.schools) ctx.push(`Education: ${profile.schools}`);
    if (profile.jobs) ctx.push(`Work: ${profile.jobs}`);
    if (profile.interests.length) {
      ctx.push(`Interests: ${profile.interests.map(i => {
        const p = INTEREST_PILLS.find(x => x.value === i);
        return p ? p.label.replace(/^[^\s]+\s/, '') : i;
      }).join(', ')}`);
    }
    if (profile.freeform) ctx.push(`Other: ${profile.freeform}`);

    try {
      const res = await callToolEndpoint('six-degrees-of-me', {
        thingA: pointA,
        thingB: pointB,
        profileContext: ctx.join('. ') || 'No profile provided',
      });
      setResults(res);
      // Save to history
      setHistory(prev => [{
        id: `sd_${Date.now()}`,
        date: new Date().toISOString(),
        a: pointA,
        b: pointB,
        degrees: res.chain?.length ? res.chain.length - 1 : '?',
        results: res,
      }, ...prev].slice(0, 30));
    } catch (err) {
      setError(err.message || 'Failed to trace connections. Try again.');
    }
  }, [thingA, thingB, profile, callToolEndpoint, setHistory]);

  const flipIt = useCallback(() => {
    if (!results) return;
    const a = thingB;
    const b = thingA;
    setThingA(a);
    setThingB(b);
    generate(a, b);
  }, [results, thingA, thingB, generate]);

  const tryRandomPair = useCallback(() => {
    const pair = FUN_PAIR_STARTERS[Math.floor(Math.random() * FUN_PAIR_STARTERS.length)];
    setThingA(pair[0]);
    setThingB(pair[1]);
    setResults(null);
  }, []);

  // ══════════════════════════════════════════
  // COPY
  // ══════════════════════════════════════════
  const copyChain = useCallback(() => {
    if (!results?.chain) return;
    const lines = [
      `Six Degrees of Me: ${thingA} --> ${thingB}`,
      `(${results.chain.length - 1} degrees)`,
      '',
    ];
    results.chain.forEach((node, i) => {
      lines.push(`${i + 1}. ${node.point}`);
      if (node.connection) lines.push(`   --> ${node.connection}`);
    });
    if (results.insight) {
      lines.push('');
      lines.push(`Insight: ${results.insight}`);
    }
    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [results, thingA, thingB]);

  // ══════════════════════════════════════════
  // RENDER: Profile
  // ══════════════════════════════════════════
  const renderProfile = () => (
    <div className={`p-4 rounded-2xl border ${c.profileBg} mb-4`}>
      {!editingProfile ? (
        <div className="flex items-center gap-2">
          <User className={`w-4 h-4 ${c.profileAccent} flex-shrink-0`} />
          <p className={`text-sm ${c.text} flex-1 truncate`}>{profileSummary()}</p>
          <button onClick={startEditProfile}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${c.btnSec}`}>
            <Pencil className="w-3 h-3" /> {hasProfile ? 'Edit' : 'Set up'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className={`w-4 h-4 ${c.profileAccent}`} />
              <span className={`text-sm font-bold ${c.text}`}>About Me</span>
            </div>
            <span className={`text-xs ${c.textMut}`}>Fill in what you like — more context = richer chains</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input type="text" value={profileDraft.hometown} onChange={e => setProfileDraft(p => ({ ...p, hometown: e.target.value }))}
              placeholder="Hometown" className={`px-3 py-2 rounded-lg border text-xs ${c.input} outline-none`} />
            <input type="text" value={profileDraft.schools} onChange={e => setProfileDraft(p => ({ ...p, schools: e.target.value }))}
              placeholder="Schools (e.g., 'UMass Amherst, econ')" className={`px-3 py-2 rounded-lg border text-xs ${c.input} outline-none`} />
            <input type="text" value={profileDraft.jobs} onChange={e => setProfileDraft(p => ({ ...p, jobs: e.target.value }))}
              placeholder="Jobs (e.g., 'teaching, then software')" className={`px-3 py-2 rounded-lg border text-xs ${c.input} outline-none`} />
          </div>

          <div>
            <span className={`text-xs font-semibold ${c.textSec} block mb-1.5`}>Interests</span>
            <div className="flex flex-wrap gap-1.5">
              {INTEREST_PILLS.map(opt => (
                <button key={opt.value} onClick={() => toggleInterest(opt.value)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${profileDraft.interests.includes(opt.value) ? c.pillActive : c.pillInactive}`}>
                  {profileDraft.interests.includes(opt.value) && <Check className="w-3 h-3 inline mr-0.5" />}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <input type="text" value={profileDraft.freeform} onChange={e => setProfileDraft(p => ({ ...p, freeform: e.target.value }))}
            placeholder="Anything else? Random facts, places you've lived, life-changing moments..."
            className={`w-full px-3 py-2 rounded-lg border text-xs ${c.input} outline-none`} />

          <div className="flex gap-2">
            <button onClick={saveProfile} className={`px-4 py-2 rounded-lg text-xs font-bold ${c.btn}`}>Save Profile</button>
            <button onClick={() => setEditingProfile(false)} className={`px-4 py-2 rounded-lg text-xs font-bold ${c.btnSec}`}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );

  // ══════════════════════════════════════════
  // RENDER: Input
  // ══════════════════════════════════════════
  const renderInput = () => (
    <div className="space-y-4">
      <div className={`p-5 rounded-2xl border ${c.border} ${c.card}`}>
        <div className="flex items-center justify-between mb-3">
          <label className={`text-xs font-bold ${c.textSec} uppercase tracking-wide`}>🔗 Connect two things from your life</label>
          <button onClick={tryRandomPair}
            className={`flex items-center gap-1 text-xs font-semibold ${c.btnGhost} hover:underline`}>
            <Shuffle className="w-3 h-3" /> Surprise me
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-stretch">
          <div className="flex-1">
            <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${c.d ? 'text-violet-400' : 'text-violet-600'}`}>Thing A</div>
            <input type="text" value={thingA} onChange={e => setThingA(e.target.value)}
              placeholder="e.g., 'My philosophy degree'"
              className={`w-full px-4 py-2.5 rounded-xl border text-sm ${c.input} outline-none`} />
          </div>
          <div className={`hidden sm:flex items-center pt-4 ${c.textMut}`}>
            <ArrowLeftRight className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${c.d ? 'text-emerald-400' : 'text-emerald-600'}`}>Thing B</div>
            <input type="text" value={thingB} onChange={e => setThingB(e.target.value)}
              placeholder="e.g., 'My career in software'"
              className={`w-full px-4 py-2.5 rounded-xl border text-sm ${c.input} outline-none`} />
          </div>
        </div>
      </div>

      <button onClick={() => generate()}
        disabled={loading || !thingA.trim() || !thingB.trim()}
        className={`w-full py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all
          ${loading || !thingA.trim() || !thingB.trim() ? c.btnDis : c.btn}`}>
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Tracing connections...</>
        ) : (
          <><Sparkles className="w-4 h-4" /> Find the Chain</>
        )}
      </button>
    </div>
  );

  // ══════════════════════════════════════════
  // RENDER: Chain
  // ══════════════════════════════════════════
  const renderChain = () => {
    if (!results?.chain) return null;
    const chain = results.chain;
    const degrees = chain.length - 1;

    return (
      <div className="space-y-4 mt-5">
        {/* Degree count */}
        <div className="text-center">
          <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold ${c.pillActive}`}>
            {degrees} degree{degrees !== 1 ? 's' : ''} of separation
          </span>
        </div>

        {/* Chain visualization */}
        <div className={`p-5 rounded-2xl border ${c.card}`}>
          <div className="space-y-0">
            {chain.map((node, i) => {
              const isFirst = i === 0;
              const isLast = i === chain.length - 1;
              const nodeColor = isFirst ? c.chainNodeA : isLast ? c.chainNodeB : c.chainNode;

              return (
                <div key={i}>
                  {/* Node */}
                  <div className={`flex items-start gap-3`}>
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-black flex-shrink-0 ${nodeColor}`}>
                        {i + 1}
                      </div>
                      {!isLast && <div className={`w-px h-8 border-l-2 border-dashed ${c.chainLine}`} />}
                    </div>
                    <div className="pt-1 pb-2 flex-1 min-w-0">
                      <p className={`text-sm font-bold ${c.text}`}>{node.point}</p>
                      {node.connection && !isLast && (
                        <p className={`text-xs mt-1 ${c.chainLink}`}>
                          <ArrowRight className="w-3 h-3 inline mr-1 opacity-60" />
                          {node.connection}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Insight */}
        {results.insight && (
          <div className={`p-5 rounded-2xl border ${c.insightBg}`}>
            <h3 className={`text-sm font-bold mb-2 ${c.insightTitle}`}>💡 The Hidden Thread</h3>
            <p className={`text-sm ${c.insightText}`}>{results.insight}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button onClick={flipIt}
            disabled={loading}
            className={`flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 ${c.btnSec}`}>
            <ArrowLeftRight className="w-3.5 h-3.5" /> Flip It (B → A)
          </button>
          <button onClick={copyChain}
            className={`flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 ${c.btnSec}`}>
            {copied ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Share Chain</>}
          </button>
          <button onClick={() => { setResults(null); setCopied(false); }}
            className={`flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 ${c.btn}`}>
            <RefreshCw className="w-3.5 h-3.5" /> New Pair
          </button>
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════
  // RENDER: History
  // ══════════════════════════════════════════
  const renderHistory = () => {
    if (history.length === 0) return null;

    return (
      <div className={`mt-6 p-4 rounded-2xl border ${c.histBg}`}>
        <button onClick={() => setShowHistory(!showHistory)}
          className="w-full flex items-center gap-2 text-left">
          <Sparkles className={`w-4 h-4 ${c.histAccent}`} />
          <span className={`text-sm font-bold ${c.text} flex-1`}>Past Chains</span>
          <span className={`text-xs ${c.textMut}`}>{history.length}</span>
          {showHistory ? <ChevronUp className={`w-4 h-4 ${c.textMut}`} /> : <ChevronDown className={`w-4 h-4 ${c.textMut}`} />}
        </button>

        {showHistory && (
          <div className="mt-3 space-y-2">
            {history.map(entry => (
              <button key={entry.id}
                onClick={() => {
                  setThingA(entry.a);
                  setThingB(entry.b);
                  setResults(entry.results);
                  setShowHistory(false);
                }}
                className={`w-full rounded-xl border ${c.histCard} p-3 text-left hover:opacity-80 transition-opacity`}>
                <div className={`text-sm font-semibold ${c.text} truncate`}>{entry.a} → {entry.b}</div>
                <div className={`text-xs ${c.textMut} mt-0.5`}>{entry.degrees} degrees</div>
              </button>
            ))}
            {history.length > 1 && (
              <button onClick={() => setHistory([])}
                className={`w-full mt-1 text-center text-xs font-semibold ${c.btnGhost} hover:text-red-500 py-1.5`}>
                Clear history
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  // ══════════════════════════════════════════
  // RENDER: Error
  // ══════════════════════════════════════════
  const renderError = () => error ? (
    <div className={`mt-4 p-4 ${c.errBg} border rounded-xl flex items-start gap-3`}>
      <AlertCircle className={`w-5 h-5 ${c.errText} flex-shrink-0 mt-0.5`} />
      <p className={`text-sm ${c.errText}`}>{error}</p>
    </div>
  ) : null;

  // ══════════════════════════════════════════
  // MAIN RENDER
  // ══════════════════════════════════════════
  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div>
          <h2 className={`text-2xl font-bold ${c.text}`}>Six Degrees of Me 🔗</h2>
          <p className={`text-sm ${c.textMut}`}>Find the hidden connections between any two parts of your life</p>
        </div>
      </div>

      {renderProfile()}
      {renderInput()}
      {renderChain()}
      {renderError()}
      {renderHistory()}
    </div>
  );
};

SixDegreesOfMe.displayName = 'SixDegreesOfMe';
export default SixDegreesOfMe;
