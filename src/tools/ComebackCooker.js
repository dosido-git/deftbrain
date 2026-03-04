import React, { useState, useRef, useEffect } from 'react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';
import { CopyBtn, ActionBar } from '../components/ActionButtons';

const MOOD_OPTIONS = [
  { id: 'surgical',  label: 'Surgical',  icon: '🧊', desc: 'Cold and precise' },
  { id: 'witty',     label: 'Witty',     icon: '⚡', desc: 'Quick and clever' },
  { id: 'petty',     label: 'Petty',     icon: '💅', desc: 'Unapologetically so' },
  { id: 'dignified', label: 'Dignified', icon: '👑', desc: 'Calm but lethal' },
];

const TECHNIQUE_EMOJIS = {
  callback:           '🔁',
  reframe:            '🔄',
  deadpan:            '😐',
  'rhetorical question': '❓',
  understatement:     '🤏',
  escalation:         '📈',
  'agreement-twist':  '🔀',
  'compliment-bomb':  '💐',
  'exit line':        '🚪',
  reversal:           '↩️',
  silence:            '🤐',
};

const ComebackCooker = () => {
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
    chipActive:    isDark
      ? 'bg-[#2c4a6e]/40 border-[#4a6a8a] text-[#a8b9ce]'
      : 'bg-[#d4dde8] border-[#2c4a6e] text-[#1e3a58]',
    chipInactive:  isDark
      ? 'bg-[#2a2623] border-[#3d3630] text-[#8a8275] hover:border-[#5a544a]'
      : 'bg-white border-[#e8e1d5] text-[#8a8275] hover:border-[#d5cab8]',
    accentBg:      isDark ? 'bg-[#2c4a6e]/10' : 'bg-[#e8eef5]',
    accentText:    isDark ? 'text-[#a8b9ce]'   : 'text-[#2c4a6e]',
    goldBg:        isDark ? 'bg-[#b06d22]/10' : 'bg-[#fdf3e4]',
    goldBorder:    isDark ? 'border-[#b06d22]/30' : 'border-[#e0c49a]',
    goldText:      isDark ? 'text-[#d9a04e]'   : 'text-[#93541f]',
    nuclearBg:     isDark ? 'bg-[#b54a3f]/10' : 'bg-[#fceae8]',
    nuclearBorder: isDark ? 'border-[#b54a3f]/30' : 'border-[#e0b8b4]',
    nuclearText:   isDark ? 'text-[#e8a9a3]'   : 'text-[#8a3028]',
    highRoadBg:    isDark ? 'bg-[#5a8a5c]/10'  : 'bg-[#e8f0e8]',
    highRoadBorder:isDark ? 'border-[#5a8a5c]/30' : 'border-[#b8d4b9]',
    highRoadText:  isDark ? 'text-[#8aba8c]'   : 'text-[#3d6e3f]',
    divider:       isDark ? 'border-[#3d3630]' : 'border-[#e8e1d5]',
    error:         isDark ? 'bg-[#b54a3f]/15 border-[#b54a3f] text-[#e8a9a3]'
                          : 'bg-[#fceae8] border-[#d4908a] text-[#8a3028]',
  };

  // ─── State ───
  const [situation, setSituation] = useState('');
  const [whatTheySaid, setWhatTheySaid] = useState('');
  const [relationship, setRelationship] = useState('');
  const [mood, setMood] = useState('witty');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [revealedNuclear, setRevealedNuclear] = useState(false);
  const [expandedCards, setExpandedCards] = useState({});

  useEffect(() => {
    if (results && resultsRef.current) {
      setTimeout(() => resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }), 250);
    }
  }, [results]);

  // ─── Handlers ───
  const handleSubmit = async () => {
    if (!situation.trim()) return;
    setError('');
    setResults(null);
    setRevealedNuclear(false);
    setExpandedCards({});

    try {
      const res = await callToolEndpoint('comeback-cooker', {
        situation: situation.trim(),
        whatTheySaid: whatTheySaid.trim() || undefined,
        relationship: relationship.trim() || undefined,
        mood,
      });
      setResults(res);
    } catch (err) {
      setError(err.message || 'Comeback generation failed.');
    }
  };

  const handleReset = () => {
    setSituation('');
    setWhatTheySaid('');
    setRelationship('');
    setResults(null);
    setError('');
    setRevealedNuclear(false);
    setExpandedCards({});
  };

  const toggleCard = (idx) => {
    setExpandedCards(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  // ─── Build text ───
  const buildFullText = () => {
    if (!results) return '';
    let t = `🍳 COMEBACK COOKER\n\n`;
    t += `Situation: ${situation}\n`;
    if (whatTheySaid) t += `They said: "${whatTheySaid}"\n`;
    t += `Mood: ${MOOD_OPTIONS.find(m => m.id === mood)?.label || mood}\n\n`;

    if (results.situation_read) t += `Read: ${results.situation_read}\n\n`;

    t += `━━ COMEBACKS ━━\n\n`;
    (results.comebacks || []).forEach((cb, i) => {
      t += `${i + 1}. "${cb.line}"\n`;
      t += `   [${cb.technique}] ${cb.why_it_works}\n`;
      t += `   🎬 ${cb.delivery_note}\n\n`;
    });

    if (results.the_nuclear_option) {
      t += `━━ THE NUCLEAR OPTION ━━\n`;
      t += `"${results.the_nuclear_option.line}"\n`;
      t += `⚠️ ${results.the_nuclear_option.warning}\n\n`;
    }

    if (results.the_high_road) {
      t += `━━ THE HIGH ROAD ━━\n`;
      t += `"${results.the_high_road.line}"\n`;
      t += `${results.the_high_road.why_its_devastating}\n\n`;
    }

    t += `— Generated by DeftBrain · deftbrain.com`;
    return t;
  };

  // ─── Render ───
  return (
    <div className={`min-h-screen ${c.pageBg} transition-colors duration-200`}>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="text-4xl">🍳</div>
          <h1 className={`text-2xl font-bold ${c.heading}`}>Comeback Cooker</h1>
          <p className={`text-sm ${c.textSecondary} max-w-sm mx-auto`}>
            The perfect response you thought of three hours too late. Served hot.
          </p>
        </div>

        {/* Input */}
        {!results && (
          <div className={`${c.card} ${c.cardBorder} border rounded-2xl p-5 shadow-sm space-y-4`}>

            {/* Situation */}
            <div className="space-y-2">
              <label className={`text-sm font-semibold ${c.text}`}>
                <span className="mr-1.5">📍</span> What happened?
              </label>
              <textarea
                value={situation}
                onChange={(e) => setSituation(e.target.value)}
                placeholder="e.g. My coworker took credit for my idea in a meeting in front of our entire team..."
                rows={3}
                maxLength={500}
                className={`w-full px-4 py-3 rounded-xl text-sm ${c.inputBg} ${c.inputBorder} ${c.inputFocus} border ${c.text} placeholder:${c.textMuted} resize-none outline-none transition-colors`}
              />
            </div>

            {/* What they said */}
            <div className="space-y-2">
              <label className={`text-sm font-semibold ${c.text}`}>
                <span className="mr-1.5">💬</span> What did they say? <span className={`font-normal ${c.textMuted}`}>(optional — exact words help)</span>
              </label>
              <input
                type="text"
                value={whatTheySaid}
                onChange={(e) => setWhatTheySaid(e.target.value)}
                placeholder={`e.g. "Oh, I was actually the one who suggested that approach..."`}
                maxLength={300}
                className={`w-full px-4 py-2.5 rounded-xl text-sm ${c.inputBg} ${c.inputBorder} ${c.inputFocus} border ${c.text} placeholder:${c.textMuted} outline-none transition-colors`}
              />
            </div>

            {/* Relationship */}
            <div className="space-y-2">
              <label className={`text-sm font-semibold ${c.text}`}>
                <span className="mr-1.5">👤</span> Who are they to you? <span className={`font-normal ${c.textMuted}`}>(optional)</span>
              </label>
              <input
                type="text"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                placeholder="e.g. coworker, in-law, ex, boss, stranger at the grocery store..."
                maxLength={100}
                className={`w-full px-4 py-2.5 rounded-xl text-sm ${c.inputBg} ${c.inputBorder} ${c.inputFocus} border ${c.text} placeholder:${c.textMuted} outline-none transition-colors`}
              />
            </div>

            {/* Mood */}
            <div className="space-y-2">
              <label className={`text-sm font-semibold ${c.text}`}>
                <span className="mr-1.5">🎭</span> Comeback mood
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {MOOD_OPTIONS.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setMood(m.id)}
                    className={`${mood === m.id ? c.chipActive : c.chipInactive} border rounded-xl px-2 py-2.5 text-center transition-all duration-150`}
                  >
                    <span className="text-lg block mb-0.5">{m.icon}</span>
                    <p className="text-xs font-medium leading-tight">{m.label}</p>
                    <p className={`text-xs ${c.textMuted} leading-tight mt-0.5 hidden sm:block`}>{m.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={loading || !situation.trim()}
              className={`w-full ${c.btnGold} py-3 rounded-xl font-semibold text-sm shadow-md
                disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2`}
            >
              {loading ? (
                <>
                  <span className="animate-spin inline-block">⏳</span>
                  Cooking up the perfect comeback...
                </>
              ) : (
                <>
                  <span>🍳</span> Cook My Comeback
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
        {results && (
          <div ref={resultsRef} className="space-y-5">

            {/* Situation read */}
            {results.situation_read && (
              <div className={`${c.cardAlt} ${c.cardBorder} border rounded-xl p-4 text-center`}>
                <p className={`text-xs font-semibold uppercase tracking-wider ${c.textMuted} mb-1`}>The read</p>
                <p className={`text-sm italic ${c.text}`}>{results.situation_read}</p>
              </div>
            )}

            {/* Comebacks */}
            {results.comebacks?.length > 0 && (
              <div className="space-y-3">
                <h3 className={`text-xs font-semibold uppercase tracking-wider ${c.textMuted} px-1`}>
                  What you should have said
                </h3>
                {results.comebacks.map((cb, i) => {
                  const isOpen = expandedCards[i];
                  const emoji = TECHNIQUE_EMOJIS[cb.technique?.toLowerCase()] || '💬';
                  return (
                    <div key={i} className={`${c.card} ${c.cardBorder} border rounded-2xl overflow-hidden transition-all duration-200`}>
                      <button
                        onClick={() => toggleCard(i)}
                        className="w-full p-5 text-left"
                      >
                        <div className="flex items-start gap-3">
                          <span className={`text-lg font-bold ${c.accentText} flex-shrink-0`}>{i + 1}.</span>
                          <div className="flex-1 min-w-0">
                            <p className={`text-base font-semibold ${c.text} leading-snug`}
                               style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                              "{cb.line}"
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-sm">{emoji}</span>
                              <span className={`text-xs ${c.textMuted}`}>{cb.technique}</span>
                            </div>
                          </div>
                          <span className={`text-sm ${c.textMuted} flex-shrink-0 mt-1`}>
                            {isOpen ? '▲' : '▼'}
                          </span>
                        </div>
                      </button>

                      {isOpen && (
                        <div className={`px-5 pb-5 space-y-3 border-t ${c.divider} pt-3 ml-8`}>
                          <div>
                            <p className={`text-xs font-semibold ${c.textMuted} mb-1`}>Why it works</p>
                            <p className={`text-sm ${c.textSecondary} leading-relaxed`}>{cb.why_it_works}</p>
                          </div>
                          <div className={`${c.accentBg} rounded-xl p-3`}>
                            <p className={`text-xs font-semibold ${c.accentText} mb-1`}>🎬 Delivery</p>
                            <p className={`text-sm ${c.textSecondary} leading-relaxed italic`}>{cb.delivery_note}</p>
                          </div>
                          <div className="pt-1">
                            <CopyBtn
                              content={`"${cb.line}"\n\n— Generated by DeftBrain · deftbrain.com`}
                              label="Copy this one"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* The High Road */}
            {results.the_high_road && (
              <div className={`${c.highRoadBg} ${c.highRoadBorder} border rounded-2xl p-5`}>
                <p className={`text-xs font-semibold uppercase tracking-wider ${c.highRoadText} mb-3 flex items-center gap-1.5`}>
                  <span>👑</span> The high road
                </p>
                <p className={`text-base font-semibold ${c.text} leading-snug mb-3`}
                   style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                  "{results.the_high_road.line}"
                </p>
                <p className={`text-sm ${c.textSecondary} leading-relaxed italic`}>
                  {results.the_high_road.why_its_devastating}
                </p>
                <div className="mt-3">
                  <CopyBtn
                    content={`"${results.the_high_road.line}"\n\n— Generated by DeftBrain · deftbrain.com`}
                    label="Copy"
                  />
                </div>
              </div>
            )}

            {/* Nuclear Option — hidden by default */}
            {results.the_nuclear_option && (
              <div>
                {!revealedNuclear ? (
                  <button
                    onClick={() => setRevealedNuclear(true)}
                    className={`w-full ${c.btnSecondary} py-3 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2`}
                  >
                    <span>☢️</span> Reveal the nuclear option
                    <span className={`text-xs ${c.textMuted}`}>(fantasy drawer only)</span>
                  </button>
                ) : (
                  <div className={`${c.nuclearBg} ${c.nuclearBorder} border rounded-2xl p-5`}>
                    <p className={`text-xs font-semibold uppercase tracking-wider ${c.nuclearText} mb-3 flex items-center gap-1.5`}>
                      <span>☢️</span> The nuclear option
                    </p>
                    <p className={`text-base font-semibold ${c.text} leading-snug mb-3`}
                       style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                      "{results.the_nuclear_option.line}"
                    </p>
                    <p className={`text-xs ${c.textMuted} italic flex items-start gap-1.5`}>
                      <span>⚠️</span> {results.the_nuclear_option.warning}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Disclaimer */}
            <p className={`text-xs ${c.textMuted} text-center italic`}>
              Purely cathartic. What you should have said — not what you should go say now.
            </p>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <ActionBar
                content={buildFullText()}
                title="Comeback Cooker"
              />
              <button
                onClick={handleReset}
                className={`${c.btnSecondary} px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-1.5`}
              >
                <span>🔄</span> New situation
              </button>
            </div>

            {/* Cross-references */}
            <div className={`${c.cardAlt} ${c.cardBorder} border rounded-xl p-4 space-y-2`}>
              <p className={`text-xs font-semibold ${c.textMuted} uppercase tracking-wider`}>
                Keep the fun going
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'RoastMe', icon: '🔥', label: 'Get roasted' },
                  { id: 'ArgumentSimulator', icon: '⚔️', label: 'Argue both sides' },
                  { id: 'VelvetHammer', icon: '🔨', label: 'Actually send something' },
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
      </div>
    </div>
  );
};

ComebackCooker.displayName = 'ComebackCooker';
export default ComebackCooker;
