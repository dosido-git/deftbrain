import React, { useState, useRef, useEffect } from 'react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';
import { CopyBtn, ActionBar } from '../components/ActionButtons';

const DIFFICULTY_MAP = {
  easy:      { label: 'Easy',      icon: '🟢', desc: 'High odds — just need the right words' },
  moderate:  { label: 'Moderate',  icon: '🟡', desc: 'Doable with the right approach' },
  hard:      { label: 'Hard',      icon: '🟠', desc: 'Uphill but not impossible' },
  long_shot: { label: 'Long Shot', icon: '🔴', desc: 'Low odds — but worth the try' },
};

const EXAMPLE_ASKS = [
  { want: 'A refund on shoes I wore once — 2 weeks past the return window', situation: 'The sole started peeling after one wear but I don\'t have the receipt' },
  { want: 'Free upgrade to first class', situation: 'Long flight, I\'m a frequent flyer but not top-tier status' },
  { want: 'A free donut from the bakery', situation: 'Walking in cold, no reason other than charm' },
  { want: 'Late fee waived on my credit card', situation: 'First time missing a payment in 3 years' },
  { want: 'A table at a fully booked restaurant tonight', situation: 'Special anniversary, called too late to reserve' },
  { want: 'My landlord to fix the dishwasher faster', situation: 'Submitted a request 2 weeks ago, no response' },
  { want: 'A discount on my internet bill', situation: 'Been a customer for 4 years, prices keep going up' },
  { want: 'Extra sauce at a restaurant without being charged', situation: 'They charge $1.50 per extra sauce cup' },
];

const MagicMouth = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const resultsRef = useRef(null);

  // ─── Colors: Navy & Gold ───
  const c = {
    pageBg:       isDark ? 'bg-[#1a1816]'    : 'bg-[#faf8f5]',
    card:         isDark ? 'bg-[#2a2623]'     : 'bg-white',
    cardAlt:      isDark ? 'bg-[#332e2a]'     : 'bg-[#faf8f5]',
    cardBorder:   isDark ? 'border-[#3d3630]' : 'border-[#e8e1d5]',
    inputBg:      isDark ? 'bg-[#1a1816]'     : 'bg-[#faf8f5]',
    inputBorder:  isDark ? 'border-[#3d3630]' : 'border-[#d5cab8]',
    inputFocus:   isDark ? 'focus:border-[#4a6a8a] focus:ring-[#2c4a6e]/20'
                         : 'focus:border-[#4a6a8a] focus:ring-[#2c4a6e]/12',
    text:          isDark ? 'text-[#f0eeea]'  : 'text-[#3d3935]',
    textSecondary: isDark ? 'text-[#c8c3b9]'  : 'text-[#5a544a]',
    textMuted:     isDark ? 'text-[#8a8275]'  : 'text-[#8a8275]',
    heading:       isDark ? 'text-[#f3efe8]'  : 'text-[#1e2a3a]',
    btnPrimary:    isDark
      ? 'bg-[#2c4a6e] hover:bg-[#4a6a8a] text-white'
      : 'bg-[#2c4a6e] hover:bg-[#1e3a58] text-white',
    btnSecondary:  isDark
      ? 'bg-[#332e2a] hover:bg-[#3d3630] text-[#c8c3b9] border border-[#3d3630]'
      : 'bg-[#f3efe8] hover:bg-[#e8e1d5] text-[#5e5042] border border-[#d5cab8]',
    btnGold:       isDark
      ? 'bg-[#b06d22] hover:bg-[#c8872e] text-white'
      : 'bg-[#c8872e] hover:bg-[#b06d22] text-white',
    accentBg:      isDark ? 'bg-[#2c4a6e]/10' : 'bg-[#e8eef5]',
    accentBorder:  isDark ? 'border-[#4a6a8a]/30' : 'border-[#b0c4d8]',
    accentText:    isDark ? 'text-[#a8b9ce]'   : 'text-[#2c4a6e]',
    goldBg:        isDark ? 'bg-[#b06d22]/10' : 'bg-[#fdf3e4]',
    goldBorder:    isDark ? 'border-[#b06d22]/30' : 'border-[#e0c49a]',
    goldText:      isDark ? 'text-[#d9a04e]'   : 'text-[#93541f]',
    greenBg:       isDark ? 'bg-[#5a8a5c]/10'  : 'bg-[#e8f0e8]',
    greenText:     isDark ? 'text-[#8aba8c]'   : 'text-[#3d6e3f]',
    warningBg:     isDark ? 'bg-[#c8872e]/10'  : 'bg-[#fdf3e4]',
    errorBg:       isDark ? 'bg-[#b54a3f]/10'  : 'bg-[#fceae8]',
    divider:       isDark ? 'border-[#3d3630]' : 'border-[#e8e1d5]',
    error:         isDark ? 'bg-[#b54a3f]/15 border-[#b54a3f] text-[#e8a9a3]'
                          : 'bg-[#fceae8] border-[#d4908a] text-[#8a3028]',
  };

  // ─── State ───
  const [mode, setMode] = useState('ask'); // 'ask' | 'phone'
  const [whatYouWant, setWhatYouWant] = useState('');
  const [situation, setSituation] = useState('');
  const [whoYoureAsking, setWhoYoureAsking] = useState('');
  const [triedAlready, setTriedAlready] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [expandedSections, setExpandedSections] = useState({});
  const [showBackup, setShowBackup] = useState(false);

  // Phone Tree state
  const [phoneCompany, setPhoneCompany] = useState('');
  const [phoneIssue, setPhoneIssue] = useState('');
  const [phoneGoal, setPhoneGoal] = useState('');
  const [phoneResults, setPhoneResults] = useState(null);

  // Nuclear Option state
  const [nuclearCompany, setNuclearCompany] = useState('');
  const [nuclearProblem, setNuclearProblem] = useState('');
  const [nuclearTried, setNuclearTried] = useState('');
  const [nuclearGoal, setNuclearGoal] = useState('');
  const [nuclearResults, setNuclearResults] = useState(null);

  useEffect(() => {
    if (results && resultsRef.current) {
      setTimeout(() => resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }), 250);
    }
  }, [results]);

  const toggleSection = (key) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // ─── Handlers ───
  const handleExample = () => {
    const filtered = EXAMPLE_ASKS.filter(e => e.want !== whatYouWant);
    const ex = filtered[Math.floor(Math.random() * filtered.length)];
    setWhatYouWant(ex.want);
    setSituation(ex.situation);
  };

  const handleSubmit = async () => {
    if (!whatYouWant.trim()) return;
    setError('');
    setResults(null);
    setExpandedSections({});
    setShowBackup(false);

    try {
      const res = await callToolEndpoint('magic-mouth', {
        whatYouWant: whatYouWant.trim(),
        situation: situation.trim() || undefined,
        whoYoureAsking: whoYoureAsking.trim() || undefined,
        triedAlready: triedAlready.trim() || undefined,
      });
      setResults(res);
    } catch (err) {
      setError(err.message || 'Failed to find your angle.');
    }
  };

  const handleReset = () => {
    setWhatYouWant('');
    setSituation('');
    setWhoYoureAsking('');
    setTriedAlready('');
    setResults(null);
    setError('');
    setExpandedSections({});
    setShowBackup(false);
  };

  const handlePhoneTree = async () => {
    if (!phoneCompany.trim()) { setError('Which company are you calling?'); return; }
    if (!phoneIssue.trim()) { setError('Describe the issue.'); return; }
    setError(''); setPhoneResults(null);
    try {
      const res = await callToolEndpoint('magic-mouth/phone-tree', {
        company: phoneCompany.trim(),
        issue: phoneIssue.trim(),
        goal: phoneGoal.trim() || undefined,
      });
      setPhoneResults(res);
    } catch (err) {
      setError(err.message || 'Failed to crack the phone tree.');
    }
  };

  const handlePhoneReset = () => {
    setPhoneCompany(''); setPhoneIssue(''); setPhoneGoal(''); setPhoneResults(null); setError('');
  };

  const handleNuclear = async () => {
    if (!nuclearCompany.trim()) { setError('Who are you up against?'); return; }
    if (!nuclearProblem.trim()) { setError('Describe the problem that isn\'t getting resolved.'); return; }
    setError(''); setNuclearResults(null);
    try {
      const res = await callToolEndpoint('magic-mouth/nuclear', {
        company: nuclearCompany.trim(),
        problem: nuclearProblem.trim(),
        whatTried: nuclearTried.trim() || undefined,
        goal: nuclearGoal.trim() || undefined,
      });
      setNuclearResults(res);
    } catch (err) {
      setError(err.message || 'Failed to map the nuclear options.');
    }
  };

  const handleNuclearReset = () => {
    setNuclearCompany(''); setNuclearProblem(''); setNuclearTried(''); setNuclearGoal(''); setNuclearResults(null); setError('');
  };

  // ─── Build text ───
  const buildFullText = () => {
    if (!results) return '';
    const r = results;
    let t = `🗣️ MAGIC MOUTH\n\n`;
    t += `Want: ${whatYouWant}\n`;
    if (situation) t += `Situation: ${situation}\n`;
    t += `Difficulty: ${DIFFICULTY_MAP[r.difficulty]?.label || r.difficulty}\n\n`;

    if (r.situation_read) t += `━━ THE READ ━━\n${r.situation_read}\n\n`;

    if (r.best_angle) {
      t += `━━ BEST ANGLE: ${r.best_angle.name} ━━\n`;
      t += `${r.best_angle.why_this_works}\n`;
      t += `Who to ask: ${r.best_angle.who_to_ask}\n`;
      t += `When: ${r.best_angle.when_to_ask}\n\n`;
    }

    if (r.the_script) {
      t += `━━ THE SCRIPT ━━\n\n`;
      t += `Opener: "${r.the_script.opener}"\n\n`;
      t += `The Ask: "${r.the_script.the_ask}"\n\n`;
      t += `If they hesitate: "${r.the_script.if_they_hesitate}"\n\n`;
      t += `Graceful exit: "${r.the_script.graceful_exit}"\n\n`;
    }

    if (r.delivery_notes) {
      t += `━━ DELIVERY ━━\n`;
      t += `Tone: ${r.delivery_notes.tone}\n`;
      t += `Body language: ${r.delivery_notes.body_language}\n`;
      t += `Don't do this: ${r.delivery_notes.dont_do_this}\n\n`;
    }

    if (r.backup_angle) {
      t += `━━ BACKUP: ${r.backup_angle.name} ━━\n`;
      t += `Pivot: "${r.backup_angle.pivot_line}"\n\n`;
    }

    if (r.pro_tip) t += `━━ PRO TIP ━━\n${r.pro_tip}\n\n`;

    t += `— Generated by DeftBrain · deftbrain.com`;
    return t;
  };

  // ─── Script Card ───
  const ScriptLine = ({ label, icon, text, copyLabel }) => (
    <div className={`${c.card} ${c.cardBorder} border rounded-xl p-4`}>
      <div className="flex items-center justify-between mb-2">
        <p className={`text-xs font-semibold uppercase tracking-wider ${c.textMuted} flex items-center gap-1.5`}>
          <span>{icon}</span> {label}
        </p>
        <CopyBtn content={`${text}\n\n— Generated by DeftBrain · deftbrain.com`} label={copyLabel || 'Copy'} />
      </div>
      <p className={`text-sm ${c.text} leading-relaxed`}
         style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
        "{text}"
      </p>
    </div>
  );

  // ─── Render ───
  return (
    <div className={`min-h-screen ${c.pageBg} transition-colors duration-200`}>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="text-4xl">🗣️</div>
          <h1 className={`text-2xl font-bold ${c.heading}`}>Magic Mouth</h1>
          <p className={`text-sm ${c.textSecondary} max-w-sm mx-auto`}>
            {mode === 'ask' ? 'Tell me what you want. I\'ll find the angle and write the script.'
              : mode === 'phone' ? 'Crack the phone tree. Get a human who can actually help.'
              : 'Nice has failed. Time for maximum legal leverage.'}
          </p>
        </div>

        {/* Mode Toggle */}
        <div className={`flex gap-1 p-1 rounded-xl ${isDark ? 'bg-[#2a2623]' : 'bg-[#f0eeea]'}`}>
          {[
            { id: 'ask',     icon: '🎯', label: 'Ask for Something' },
            { id: 'phone',   icon: '📞', label: 'Phone Tree Hack' },
            { id: 'nuclear', icon: '💣', label: 'Nuclear Option' },
          ].map(tab => (
            <button key={tab.id} onClick={() => { setMode(tab.id); setError(''); }}
              className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5
                ${mode === tab.id
                  ? 'bg-[#2c4a6e] text-white shadow'
                  : `${isDark ? 'text-[#8a8275] hover:text-[#c8c3b9]' : 'text-[#8a8275] hover:text-[#5a544a]'}`}`}>
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>

        {/* ─── Phone Tree Mode ─── */}
        {mode === 'phone' && !phoneResults && (
          <div className={`${c.card} ${c.cardBorder} border rounded-2xl p-5 shadow-sm space-y-4`}>
            <div className={`p-3 rounded-xl ${c.accentBg} border ${c.accentBorder}`}>
              <p className={`text-xs ${c.accentText}`}>📞 Navigate any automated phone system to reach the right human — menu sequences, magic phrases, escalation scripts.</p>
            </div>
            <div className="space-y-2">
              <label className={`text-sm font-semibold ${c.text}`}><span className="mr-1.5">🏢</span> Which company?</label>
              <input type="text" value={phoneCompany} onChange={e => setPhoneCompany(e.target.value)}
                placeholder="e.g. Chase Bank, United Airlines, Blue Cross, AT&T, DMV…"
                className={`w-full px-4 py-3 rounded-xl text-sm ${c.inputBg} ${c.inputBorder} ${c.inputFocus} border ${c.text} outline-none transition-colors`} />
            </div>
            <div className="space-y-2">
              <label className={`text-sm font-semibold ${c.text}`}><span className="mr-1.5">⚠️</span> What's the issue?</label>
              <textarea value={phoneIssue} onChange={e => setPhoneIssue(e.target.value)}
                placeholder="e.g. Fraudulent charge on my account that wasn't me…"
                rows={2} maxLength={400}
                className={`w-full px-4 py-3 rounded-xl text-sm ${c.inputBg} ${c.inputBorder} ${c.inputFocus} border ${c.text} placeholder:${c.textMuted} resize-none outline-none transition-colors`} />
            </div>
            <div className="space-y-2">
              <label className={`text-sm font-semibold ${c.text}`}><span className="mr-1.5">🎯</span> What do you want to walk away with? <span className={`font-normal ${c.textMuted}`}>(optional)</span></label>
              <input type="text" value={phoneGoal} onChange={e => setPhoneGoal(e.target.value)}
                placeholder="e.g. Full refund, account unlocked, claim approved…"
                className={`w-full px-4 py-3 rounded-xl text-sm ${c.inputBg} ${c.inputBorder} ${c.inputFocus} border ${c.text} outline-none transition-colors`} />
            </div>
            {error && <div className={`p-3 rounded-xl border text-sm flex items-start gap-2 ${c.error}`}><span>⚠️</span>{error}</div>}
            <button onClick={handlePhoneTree} disabled={loading || !phoneCompany.trim() || !phoneIssue.trim()}
              className={`w-full py-3 rounded-xl font-semibold disabled:opacity-40 ${c.btnPrimary}`}>
              {loading ? <><span className="animate-spin inline-block mr-2">⏳</span>Hacking the tree…</> : '📞 Get My Script'}
            </button>
          </div>
        )}

        {mode === 'phone' && phoneResults && (
          <div className="space-y-4">
            {/* Best time to call */}
            <div className={`${c.card} ${c.cardBorder} border rounded-2xl p-5`}>
              <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${c.textMuted}`}>⏰ Best Time to Call</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div className={`p-3 rounded-xl ${c.accentBg} border ${c.accentBorder}`}>
                  <p className={`text-xs font-semibold ${c.accentText} mb-1`}>Day</p>
                  <p className={c.text}>{phoneResults.best_time_to_call?.day}</p>
                </div>
                <div className={`p-3 rounded-xl ${c.accentBg} border ${c.accentBorder}`}>
                  <p className={`text-xs font-semibold ${c.accentText} mb-1`}>Time Window</p>
                  <p className={c.text}>{phoneResults.best_time_to_call?.time}</p>
                </div>
                <div className={`p-3 rounded-xl ${c.errorBg} border ${isDark ? 'border-[#b54a3f]/30' : 'border-[#d4908a]/40'}`}>
                  <p className={`text-xs font-semibold ${isDark ? 'text-red-400' : 'text-red-600'} mb-1`}>Avoid</p>
                  <p className={c.text}>{phoneResults.best_time_to_call?.avoid}</p>
                </div>
              </div>
            </div>

            {/* Menu Navigation */}
            {phoneResults.menu_navigation && (
              <div className={`${c.card} ${c.cardBorder} border rounded-2xl p-5`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${c.textMuted}`}>📱 Menu Navigation</p>
                {phoneResults.menu_navigation.skip_ahead && (
                  <div className={`mb-3 p-3 rounded-xl ${c.goldBg} border ${c.goldBorder}`}>
                    <p className={`text-xs font-semibold ${c.goldText} mb-1`}>⚡ Shortcut</p>
                    <p className={`text-sm font-medium ${c.text}`}>{phoneResults.menu_navigation.skip_ahead}</p>
                  </div>
                )}
                <p className={`text-sm mb-3 ${c.text}`}><span className="font-semibold">Opening move:</span> <span className={c.textSecondary}>{phoneResults.menu_navigation.opening_move}</span></p>
                {phoneResults.menu_navigation.sequence?.length > 0 && (
                  <div className="space-y-2">
                    {phoneResults.menu_navigation.sequence.map((s, i) => (
                      <div key={i} className={`flex gap-3 items-start p-3 rounded-xl border ${c.cardBorder} ${isDark ? 'bg-[#2a2623]' : 'bg-[#faf8f5]'}`}>
                        <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-[#2c4a6e] text-white`}>{s.step}</span>
                        <div className="text-sm">
                          <p className={`font-medium ${c.text}`}>{s.detail}</p>
                          <p className={`text-xs mt-0.5 ${c.textMuted}`}>{s.why}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Magic Phrases */}
            {phoneResults.magic_phrases?.length > 0 && (
              <div className={`${c.card} ${c.cardBorder} border rounded-2xl p-5`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${c.textMuted}`}>✨ Magic Phrases</p>
                <div className="space-y-3">
                  {phoneResults.magic_phrases.map((p, i) => (
                    <div key={i} className={`p-3 rounded-xl border ${c.greenBg} border-[${isDark ? '#5a8a5c' : '#b0ccb0'}]`}>
                      <p className={`text-sm font-semibold italic ${c.text}`}>"{p.phrase}"</p>
                      <p className={`text-xs mt-1 ${c.textMuted}`}>When: {p.when} · {p.effect}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Right Department + Escalation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {phoneResults.right_department && (
                <div className={`${c.card} ${c.cardBorder} border rounded-2xl p-5`}>
                  <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${c.textMuted}`}>📋 Right Department</p>
                  <p className={`text-sm font-bold ${c.text} mb-1`}>{phoneResults.right_department.name}</p>
                  <p className={`text-xs mb-2 ${c.textMuted}`}>{phoneResults.right_department.why}</p>
                  <div className={`p-2 rounded-lg ${c.accentBg} border ${c.accentBorder}`}>
                    <p className={`text-xs font-medium italic ${c.accentText}`}>"{phoneResults.right_department.how_to_ask}"</p>
                  </div>
                </div>
              )}
              {phoneResults.escalation_ladder?.length > 0 && (
                <div className={`${c.card} ${c.cardBorder} border rounded-2xl p-5`}>
                  <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${c.textMuted}`}>⬆️ Escalation Ladder</p>
                  <div className="space-y-2">
                    {phoneResults.escalation_ladder.map((e, i) => (
                      <div key={i} className={`p-2 rounded-lg border text-xs ${c.cardBorder} ${isDark ? 'bg-[#2a2623]' : 'bg-[#faf8f5]'}`}>
                        <p className={`font-semibold ${c.text}`}>Level {e.level}: {e.trigger}</p>
                        <p className={`italic mt-1 ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>"{e.phrase}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Power Move + Script Opener */}
            {(phoneResults.power_move || phoneResults.script_opener) && (
              <div className="space-y-3">
                {phoneResults.power_move && (
                  <div className={`${c.card} ${c.cardBorder} border rounded-2xl p-4`}>
                    <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${c.goldText}`}>⚡ Power Move</p>
                    <p className={`text-sm ${c.textSecondary}`}>{phoneResults.power_move}</p>
                  </div>
                )}
                {phoneResults.script_opener && (
                  <div className={`${c.card} ${c.cardBorder} border rounded-2xl p-4`}>
                    <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${c.textMuted}`}>🎬 Opening Line (once you reach a human)</p>
                    <p className={`text-sm font-medium italic ${c.text}`} style={{ fontFamily: 'Georgia, serif' }}>"{phoneResults.script_opener}"</p>
                    <div className="mt-2">
                      <CopyBtn content={`${phoneResults.script_opener}\n\n— Generated by DeftBrain · deftbrain.com`} label="Copy Opener" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Have Ready + Reset */}
            {phoneResults.things_to_have_ready?.length > 0 && (
              <div className={`${c.card} ${c.cardBorder} border rounded-2xl p-4`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${c.textMuted}`}>📎 Have Ready Before You Call</p>
                <ul className="space-y-1">
                  {phoneResults.things_to_have_ready.map((t, i) => (
                    <li key={i} className={`text-sm flex gap-2 ${c.textSecondary}`}><span>•</span>{t}</li>
                  ))}
                </ul>
              </div>
            )}

            <button onClick={handlePhoneReset} className={`w-full py-2.5 rounded-xl text-sm ${c.btnSecondary}`}>
              📞 Try Another Call
            </button>
          </div>
        )}

        {/* Input (Ask mode only) */}
        {mode === 'ask' && !results && (
          <div className={`${c.card} ${c.cardBorder} border rounded-2xl p-5 shadow-sm space-y-4`}>

            {/* What you want */}
            <div className="space-y-2">
              <label className={`text-sm font-semibold ${c.text}`}>
                <span className="mr-1.5">🎯</span> What do you want?
              </label>
              <textarea
                value={whatYouWant}
                onChange={(e) => setWhatYouWant(e.target.value)}
                placeholder="e.g. A refund on shoes I wore once — 2 weeks past the return window..."
                rows={2}
                maxLength={400}
                className={`w-full px-4 py-3 rounded-xl text-sm ${c.inputBg} ${c.inputBorder} ${c.inputFocus} border ${c.text} placeholder:${c.textMuted} resize-none outline-none transition-colors`}
              />
            </div>

            {/* Situation */}
            <div className="space-y-2">
              <label className={`text-sm font-semibold ${c.text}`}>
                <span className="mr-1.5">📍</span> The situation <span className={`font-normal ${c.textMuted}`}>(the more detail, the better the angle)</span>
              </label>
              <textarea
                value={situation}
                onChange={(e) => setSituation(e.target.value)}
                placeholder="e.g. The sole started peeling after one wear but I don't have the receipt..."
                rows={2}
                maxLength={400}
                className={`w-full px-4 py-3 rounded-xl text-sm ${c.inputBg} ${c.inputBorder} ${c.inputFocus} border ${c.text} placeholder:${c.textMuted} resize-none outline-none transition-colors`}
              />
            </div>

            {/* Optional fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className={`text-sm font-semibold ${c.text}`}>
                  <span className="mr-1.5">👤</span> Who are you asking? <span className={`font-normal ${c.textMuted}`}>(optional)</span>
                </label>
                <input
                  type="text"
                  value={whoYoureAsking}
                  onChange={(e) => setWhoYoureAsking(e.target.value)}
                  placeholder="e.g. Store manager, airline desk, landlord..."
                  maxLength={150}
                  className={`w-full px-4 py-2.5 rounded-xl text-sm ${c.inputBg} ${c.inputBorder} ${c.inputFocus} border ${c.text} placeholder:${c.textMuted} outline-none transition-colors`}
                />
              </div>
              <div className="space-y-2">
                <label className={`text-sm font-semibold ${c.text}`}>
                  <span className="mr-1.5">🔄</span> Already tried? <span className={`font-normal ${c.textMuted}`}>(optional)</span>
                </label>
                <input
                  type="text"
                  value={triedAlready}
                  onChange={(e) => setTriedAlready(e.target.value)}
                  placeholder="e.g. Asked once and they said no..."
                  maxLength={200}
                  className={`w-full px-4 py-2.5 rounded-xl text-sm ${c.inputBg} ${c.inputBorder} ${c.inputFocus} border ${c.text} placeholder:${c.textMuted} outline-none transition-colors`}
                />
              </div>
            </div>

            {/* Example + Submit */}
            <div className="flex items-center justify-between pt-1">
              <button
                onClick={handleExample}
                className={`text-xs ${c.btnSecondary} px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5`}
              >
                <span>🎲</span> Example
              </button>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || !whatYouWant.trim()}
              className={`w-full ${c.btnGold} py-3 rounded-xl font-semibold text-sm shadow-md
                disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2`}
            >
              {loading ? (
                <>
                  <span className="animate-spin inline-block">⏳</span>
                  Finding your angle...
                </>
              ) : (
                <>
                  <span>🗣️</span> Find My Angle
                </>
              )}
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className={`${c.error} border rounded-xl p-4 text-sm flex items-center gap-2`}>
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Results */}
        {mode === 'ask' && results && (
          <div ref={resultsRef} className="space-y-5">

            {/* Situation read + difficulty */}
            <div className={`${c.cardAlt} ${c.cardBorder} border rounded-2xl p-5`}>
              <div className="flex items-center justify-between mb-3">
                <p className={`text-xs font-semibold uppercase tracking-wider ${c.textMuted}`}>The read</p>
                {results.difficulty && (() => {
                  const d = DIFFICULTY_MAP[results.difficulty] || DIFFICULTY_MAP.moderate;
                  return (
                    <span className={`text-xs font-semibold flex items-center gap-1 ${c.textMuted}`}>
                      {d.icon} {d.label}
                    </span>
                  );
                })()}
              </div>
              <p className={`text-sm ${c.text} leading-relaxed`}>{results.situation_read}</p>
            </div>

            {/* Best angle */}
            {results.best_angle && (
              <div className={`${c.goldBg} ${c.goldBorder} border rounded-2xl p-5`}>
                <p className={`text-xs font-semibold uppercase tracking-wider ${c.goldText} mb-1`}>Best angle</p>
                <h3 className={`text-lg font-bold ${c.heading} mb-2`}>{results.best_angle.name}</h3>
                <p className={`text-sm ${c.text} leading-relaxed mb-3`}>{results.best_angle.why_this_works}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className={`${c.card} rounded-lg p-3`}>
                    <p className={`text-xs font-semibold ${c.textMuted} mb-1`}>👤 Who to ask</p>
                    <p className={`text-sm ${c.textSecondary}`}>{results.best_angle.who_to_ask}</p>
                  </div>
                  <div className={`${c.card} rounded-lg p-3`}>
                    <p className={`text-xs font-semibold ${c.textMuted} mb-1`}>⏰ When to ask</p>
                    <p className={`text-sm ${c.textSecondary}`}>{results.best_angle.when_to_ask}</p>
                  </div>
                </div>
              </div>
            )}

            {/* The Script */}
            {results.the_script && (
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className={`flex-1 border-t ${c.divider}`} />
                  <span className={`text-xs font-semibold uppercase tracking-wider ${c.textMuted}`}>The Script</span>
                  <div className={`flex-1 border-t ${c.divider}`} />
                </div>
                <ScriptLine label="Opener" icon="👋" text={results.the_script.opener} />
                <ScriptLine label="The Ask" icon="🎯" text={results.the_script.the_ask} />
                <ScriptLine label="If they hesitate" icon="🤔" text={results.the_script.if_they_hesitate} />
                <ScriptLine label="Graceful exit" icon="🚪" text={results.the_script.graceful_exit} copyLabel="Copy" />
              </div>
            )}

            {/* Delivery Notes */}
            {results.delivery_notes && (
              <div className={`${c.card} ${c.cardBorder} border rounded-2xl p-5`}>
                <button onClick={() => toggleSection('delivery')} className="w-full flex items-center justify-between">
                  <h3 className={`font-bold ${c.heading} flex items-center gap-2`}>
                    <span>🎬</span> Delivery Notes
                  </h3>
                  <span className={`text-sm ${c.textMuted}`}>{expandedSections['delivery'] !== false ? '▲' : '▼'}</span>
                </button>
                {expandedSections['delivery'] !== false && (
                  <div className="mt-4 space-y-3">
                    <div className={`${c.accentBg} rounded-xl p-3`}>
                      <p className={`text-xs font-semibold ${c.accentText} mb-1`}>🎤 Tone</p>
                      <p className={`text-sm ${c.textSecondary} leading-relaxed`}>{results.delivery_notes.tone}</p>
                    </div>
                    <div className={`${c.greenBg} rounded-xl p-3`}>
                      <p className={`text-xs font-semibold ${c.greenText} mb-1`}>🧍 Body language</p>
                      <p className={`text-sm ${c.textSecondary} leading-relaxed`}>{results.delivery_notes.body_language}</p>
                    </div>
                    <div className={`${c.errorBg} rounded-xl p-3`}>
                      <p className={`text-xs font-semibold ${isDark ? 'text-[#e8a9a3]' : 'text-[#8a3028]'} mb-1`}>🚫 Don't do this</p>
                      <p className={`text-sm ${c.textSecondary} leading-relaxed`}>{results.delivery_notes.dont_do_this}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Backup angle */}
            {results.backup_angle && (
              <div>
                {!showBackup ? (
                  <button
                    onClick={() => setShowBackup(true)}
                    className={`w-full ${c.btnSecondary} py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2`}
                  >
                    <span>🔄</span> Show backup angle
                  </button>
                ) : (
                  <div className={`${c.accentBg} ${c.accentBorder} border rounded-2xl p-5`}>
                    <p className={`text-xs font-semibold uppercase tracking-wider ${c.accentText} mb-1`}>Backup angle</p>
                    <h3 className={`text-base font-bold ${c.heading} mb-2`}>{results.backup_angle.name}</h3>
                    <p className={`text-sm ${c.text} leading-relaxed`}
                       style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                      "{results.backup_angle.pivot_line}"
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Pro tip */}
            {results.pro_tip && (
              <div className="rounded-2xl p-5 text-center"
                style={{
                  background: isDark
                    ? 'linear-gradient(135deg, #2a2623, #332e2a)'
                    : 'linear-gradient(135deg, #f3efe8, #e8e1d5)',
                }}
              >
                <p className={`text-xs font-semibold uppercase tracking-wider ${c.goldText} mb-2`}>
                  💡 Pro tip
                </p>
                <p className={`text-sm ${c.text} leading-relaxed max-w-md mx-auto`}>
                  {results.pro_tip}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <ActionBar
                content={buildFullText()}
                title="Magic Mouth"
              />
              <button
                onClick={handleReset}
                className={`${c.btnSecondary} px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-1.5`}
              >
                <span>🔄</span> New ask
              </button>
            </div>

            {/* Cross-references */}
            <div className={`${c.cardAlt} ${c.cardBorder} border rounded-xl p-4 space-y-2`}>
              <p className={`text-xs font-semibold ${c.textMuted} uppercase tracking-wider`}>
                Related tools
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'VelvetHammer', icon: '🔨', label: 'Write the tough message' },
                  { id: 'BuyWise', icon: '🛒', label: 'Check if it\'s worth buying' },
                  { id: 'DecoderRing', icon: '🔓', label: 'Decode their response' },
                ].map(ref => (
                  <a
                    key={ref.id}
                    href={`/tool/${ref.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${c.btnSecondary} px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1.5`}
                  >
                    <span>{ref.icon}</span> {ref.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
        {/* ─── Nuclear Option Mode — Input ─── */}
        {mode === 'nuclear' && !nuclearResults && (
          <div className={`${c.card} ${c.cardBorder} border rounded-2xl p-5 shadow-sm space-y-4`}>
            <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#b54a3f]/10 border-[#b54a3f]/30' : 'bg-[#fceae8] border-[#d4908a]'}`}>
              <p className={`text-xs ${isDark ? 'text-[#e8a9a3]' : 'text-[#8a3028]'}`}>💣 For when polite has failed. Regulatory complaints, executive escalation, demand letters, small claims — mapped out in full. Legal leverage only.</p>
            </div>
            <div className="space-y-2">
              <label className={`text-sm font-semibold ${c.text}`}><span className="mr-1.5">🏢</span> Who are you up against?</label>
              <input type="text" value={nuclearCompany} onChange={e => setNuclearCompany(e.target.value)}
                placeholder="e.g. Comcast, Blue Cross, my landlord, a contractor, Bank of America…"
                className={`w-full px-4 py-3 rounded-xl text-sm ${c.inputBg} ${c.inputBorder} ${c.inputFocus} border ${c.text} outline-none transition-colors`} />
            </div>
            <div className="space-y-2">
              <label className={`text-sm font-semibold ${c.text}`}><span className="mr-1.5">⚠️</span> What's the problem that won't get resolved?</label>
              <textarea value={nuclearProblem} onChange={e => setNuclearProblem(e.target.value)}
                placeholder="What happened, what you want, what they've said, how long this has been going on…"
                rows={3} maxLength={600}
                className={`w-full px-4 py-3 rounded-xl text-sm ${c.inputBg} ${c.inputBorder} ${c.inputFocus} border ${c.text} placeholder:${c.textMuted} resize-none outline-none transition-colors`} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className={`text-sm font-semibold ${c.text}`}><span className="mr-1.5">🔄</span> What you've already tried <span className={`font-normal ${c.textMuted}`}>(optional)</span></label>
                <input type="text" value={nuclearTried} onChange={e => setNuclearTried(e.target.value)}
                  placeholder="Calls, emails, first-level appeals…"
                  className={`w-full px-4 py-3 rounded-xl text-sm ${c.inputBg} ${c.inputBorder} ${c.inputFocus} border ${c.text} outline-none transition-colors`} />
              </div>
              <div className="space-y-2">
                <label className={`text-sm font-semibold ${c.text}`}><span className="mr-1.5">🎯</span> What you want to achieve <span className={`font-normal ${c.textMuted}`}>(optional)</span></label>
                <input type="text" value={nuclearGoal} onChange={e => setNuclearGoal(e.target.value)}
                  placeholder="Refund, reversal, cancellation…"
                  className={`w-full px-4 py-3 rounded-xl text-sm ${c.inputBg} ${c.inputBorder} ${c.inputFocus} border ${c.text} outline-none transition-colors`} />
              </div>
            </div>
            {error && <div className={`p-3 rounded-xl border text-sm flex items-start gap-2 ${c.error}`}><span>⚠️</span>{error}</div>}
            <button onClick={handleNuclear} disabled={loading || !nuclearCompany.trim() || !nuclearProblem.trim()}
              className={`w-full py-3 rounded-xl font-semibold disabled:opacity-40 text-white transition-all`}
              style={{ background: isDark ? 'linear-gradient(135deg, #8a3028, #b54a3f)' : 'linear-gradient(135deg, #b54a3f, #8a3028)' }}>
              {loading ? <><span className="animate-spin inline-block mr-2">⏳</span>Mapping the leverage…</> : '💣 Find My Nuclear Options'}
            </button>
            <p className={`text-xs text-center ${c.textMuted}`}>Legal leverage only. Not legal advice.</p>
          </div>
        )}

        {/* ─── Nuclear Option Mode — Results ─── */}
        {mode === 'nuclear' && nuclearResults && (
          <div className="space-y-4">

            {/* Assessment */}
            {nuclearResults.situation_assessment && (
              <div className={`${c.card} ${c.cardBorder} border rounded-2xl p-5`}>
                <div className="flex items-center justify-between mb-2">
                  <p className={`text-xs font-bold uppercase tracking-wider ${c.textMuted}`}>Leverage Assessment</p>
                  <span className={`text-xs font-black px-2 py-1 rounded-full ${
                    nuclearResults.situation_assessment.leverage_level === 'high'
                      ? (isDark ? 'bg-[#5a8a5c]/20 text-[#8aba8c]' : 'bg-[#e8f0e8] text-[#3d6e3f]')
                      : nuclearResults.situation_assessment.leverage_level === 'medium'
                      ? (isDark ? 'bg-[#c8872e]/20 text-[#d9a04e]' : 'bg-[#fdf3e4] text-[#93541f]')
                      : (isDark ? 'bg-[#b54a3f]/20 text-[#e8a9a3]' : 'bg-[#fceae8] text-[#8a3028]')
                  }`}>{nuclearResults.situation_assessment.leverage_level?.toUpperCase()}</span>
                </div>
                {nuclearResults.situation_assessment.their_strongest_card && (
                  <p className={`text-sm font-semibold mb-1 ${c.text}`}>💪 {nuclearResults.situation_assessment.their_strongest_card}</p>
                )}
                {nuclearResults.situation_assessment.why_nice_failed && (
                  <p className={`text-xs ${c.textMuted}`}>{nuclearResults.situation_assessment.why_nice_failed}</p>
                )}
              </div>
            )}

            {/* Escalation Ladder */}
            {nuclearResults.escalation_ladder?.length > 0 && (
              <div className="space-y-3">
                <p className={`text-xs font-black uppercase tracking-widest px-1 ${c.textMuted}`}>📶 Escalation Ladder</p>
                {nuclearResults.escalation_ladder.map((rung, i) => (
                  <div key={i} className={`${c.card} ${c.cardBorder} border rounded-2xl overflow-hidden`}>
                    <div className={`px-5 py-3 flex items-center gap-3 ${isDark ? 'bg-[#b54a3f]/10' : 'bg-[#fceae8]'}`}>
                      <span className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 bg-[#b54a3f] text-white">{rung.rung}</span>
                      <p className={`font-bold text-sm ${c.text}`}>{rung.title}</p>
                    </div>
                    <div className="px-5 py-4 space-y-2">
                      <p className={`text-sm ${c.textSecondary}`}>{rung.action}</p>
                      {/* Rung-specific fields */}
                      {rung.the_email_formula && (
                        <div className={`p-2 rounded-lg border font-mono text-xs ${isDark ? 'bg-[#1a1816] border-[#3d3630] text-[#c8c3b9]' : 'bg-[#faf8f5] border-[#d5cab8] text-[#5a544a]'}`}>
                          {rung.the_email_formula}
                        </div>
                      )}
                      {rung.subject_line && (
                        <p className={`text-xs ${c.textMuted}`}><span className="font-semibold">Subject:</span> {rung.subject_line}</p>
                      )}
                      {rung.opening_paragraph && (
                        <div className={`p-3 rounded-xl border italic text-sm ${isDark ? 'bg-[#2a2623] border-[#3d3630]' : 'bg-[#faf8f5] border-[#e8e1d5]'} ${c.textSecondary}`}>
                          "{rung.opening_paragraph}"
                          <div className="mt-2 not-italic">
                            <CopyBtn content={`${rung.opening_paragraph}\n\n— Generated by DeftBrain · deftbrain.com`} label="Copy opener" />
                          </div>
                        </div>
                      )}
                      {rung.agency_name && (
                        <p className={`text-xs font-bold ${isDark ? 'text-[#e8a9a3]' : 'text-[#8a3028]'}`}>{rung.agency_name} — <span className="font-normal">{rung.where_to_file}</span></p>
                      )}
                      {rung.why_it_works && (
                        <p className={`text-xs ${c.textMuted}`}>{rung.why_it_works}</p>
                      )}
                      {rung.demand_letter_opener && (
                        <div className={`p-3 rounded-xl border italic text-sm ${isDark ? 'bg-[#2a2623] border-[#3d3630]' : 'bg-[#faf8f5] border-[#e8e1d5]'} ${c.textSecondary}`}>
                          "{rung.demand_letter_opener}"
                        </div>
                      )}
                      {rung.the_magic_sentence && (
                        <div className={`p-2 rounded-lg border ${isDark ? 'bg-[#5a8a5c]/15 border-[#5a8a5c]/40' : 'bg-[#e8f0e8] border-[#a8c4a8]'}`}>
                          <p className={`text-xs font-bold mb-0.5 ${isDark ? 'text-[#8aba8c]' : 'text-[#3d6e3f]'}`}>Magic sentence</p>
                          <p className={`text-xs font-mono ${isDark ? 'text-[#8aba8c]' : 'text-[#3d6e3f]'}`}>"{rung.the_magic_sentence}"</p>
                          <div className="mt-1.5">
                            <CopyBtn content={`${rung.the_magic_sentence}\n\n— Generated by DeftBrain · deftbrain.com`} label="Copy" />
                          </div>
                        </div>
                      )}
                      {rung.platform && (
                        <p className={`text-xs ${c.textMuted}`}><span className="font-semibold">Platform:</span> {rung.platform} — {rung.why_this_platform}</p>
                      )}
                      {rung.post_formula && (
                        <p className={`text-xs ${c.textMuted}`}><span className="font-semibold">Post formula:</span> {rung.post_formula}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Magic sentences */}
            {nuclearResults.magic_sentences?.length > 0 && (
              <div className={`${c.card} ${c.cardBorder} border rounded-2xl p-5`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${c.textMuted}`}>✨ Magic Sentences</p>
                <div className="space-y-3">
                  {nuclearResults.magic_sentences.map((s, i) => (
                    <div key={i} className={`p-3 rounded-xl border ${isDark ? 'bg-[#5a8a5c]/10 border-[#5a8a5c]/30' : 'bg-[#e8f0e8] border-[#a8c4a8]'}`}>
                      <p className={`text-sm font-semibold italic mb-1 ${c.text}`}>"{s.sentence}"</p>
                      <p className={`text-xs ${c.textMuted}`}>{s.when} · {s.what_it_triggers}</p>
                      <div className="mt-2">
                        <CopyBtn content={`${s.sentence}\n\n— Generated by DeftBrain · deftbrain.com`} label="Copy" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* First move + honest assessment */}
            {nuclearResults.the_one_to_start && (
              <div className={`rounded-2xl border-2 p-5 ${isDark ? 'border-[#2c4a6e] bg-[#2c4a6e]/10' : 'border-[#2c4a6e] bg-[#e8eef5]'}`}>
                <p className={`text-xs font-black uppercase tracking-widest mb-2 ${isDark ? 'text-[#a8b9ce]' : 'text-[#2c4a6e]'}`}>⚡ Start Here — Today</p>
                <p className={`text-sm font-semibold mb-1 ${c.text}`}>Step {nuclearResults.the_one_to_start.rung}: {nuclearResults.the_one_to_start.why}</p>
                <p className={`text-sm ${c.textSecondary}`}>{nuclearResults.the_one_to_start.first_action_today}</p>
              </div>
            )}
            {nuclearResults.honest_assessment && (
              <div className={`${c.card} ${c.cardBorder} border rounded-2xl p-4 space-y-1`}>
                <p className={`text-xs font-bold uppercase tracking-wider ${c.textMuted}`}>📊 Honest Assessment</p>
                {nuclearResults.honest_assessment.most_likely_outcome && (
                  <p className={`text-sm ${c.textSecondary}`}><span className={`font-semibold ${c.text}`}>Likely outcome:</span> {nuclearResults.honest_assessment.most_likely_outcome}</p>
                )}
                {nuclearResults.honest_assessment.time_investment && (
                  <p className={`text-xs ${c.textMuted}`}><span className="font-semibold">Time:</span> {nuclearResults.honest_assessment.time_investment}</p>
                )}
                {nuclearResults.honest_assessment.when_to_walk_away && (
                  <p className={`text-xs ${c.textMuted}`}><span className="font-semibold">Walk away when:</span> {nuclearResults.honest_assessment.when_to_walk_away}</p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <ActionBar content={`💣 NUCLEAR OPTION\n\n${nuclearCompany}: ${nuclearProblem}\n\n— Generated by DeftBrain · deftbrain.com`} title="Nuclear Option" />
              <button onClick={handleNuclearReset}
                className={`${c.btnSecondary} px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-1.5`}>
                <span>🔄</span> New situation
              </button>
            </div>

            {/* Cross-references */}
            <div className={`${c.cardAlt} ${c.cardBorder} border rounded-xl p-4 space-y-2`}>
              <p className={`text-xs font-semibold ${c.textMuted} uppercase tracking-wider`}>Related tools</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'RulebookBreaker', icon: '🏴‍☠️', label: 'Find the loopholes' },
                  { id: 'LeaseTrapDetector', icon: '🔍', label: 'Spot traps in contracts' },
                  { id: 'TruthBomb', icon: '💣', label: 'Say the hard thing' },
                ].map(ref => (
                  <a key={ref.id} href={`/tool/${ref.id}`} target="_blank" rel="noopener noreferrer"
                    className={`${c.btnSecondary} px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1.5`}>
                    <span>{ref.icon}</span> {ref.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

MagicMouth.displayName = 'MagicMouth';
export default MagicMouth;
