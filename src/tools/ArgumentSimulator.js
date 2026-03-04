import React, { useState, useRef, useEffect } from 'react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';
import { CopyBtn, ActionBar } from '../components/ActionButtons';

const INTENSITY_OPTIONS = [
  { id: 'civil',    label: 'Civil',    icon: '🎓', desc: 'Oxford Union energy — sharp, respectful' },
  { id: 'heated',   label: 'Heated',   icon: '🔥', desc: 'Smart friends at dinner — passionate, pointed' },
  { id: 'unhinged', label: 'Unhinged', icon: '🌋', desc: 'Full rhetorical firepower — mic drops galore' },
];

const EXAMPLE_TOPICS = [
  'Pineapple belongs on pizza',
  'Remote work is better than office work',
  'Hot dogs are sandwiches',
  'The book is always better than the movie',
  'Breakfast for dinner is superior',
  'Cats are better pets than dogs',
  'Cash tips are better than no-tip pricing',
  'AI art is real art',
  'College degrees are overrated',
  'Social media does more harm than good',
];

const ArgumentSimulator = () => {
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
    sideABg:       isDark ? 'bg-[#2c4a6e]/12' : 'bg-[#e8eef5]',
    sideABorder:   isDark ? 'border-[#4a6a8a]' : 'border-[#b0c4d8]',
    sideAAccent:   isDark ? 'text-[#a8b9ce]'   : 'text-[#2c4a6e]',
    sideBBg:       isDark ? 'bg-[#b06d22]/10' : 'bg-[#fdf3e4]',
    sideBBorder:   isDark ? 'border-[#b06d22]' : 'border-[#e0c49a]',
    sideBAccent:   isDark ? 'text-[#d9a04e]'   : 'text-[#93541f]',
    verdictBg:     isDark ? 'bg-[#332e2a]'     : 'bg-[#f3efe8]',
    divider:       isDark ? 'border-[#3d3630]' : 'border-[#e8e1d5]',
    badgePrimary:  isDark ? 'bg-[#2c4a6e]/30 text-[#a8b9ce]' : 'bg-[#d4dde8] text-[#1e3a58]',
    badgeGold:     isDark ? 'bg-[#b06d22]/20 text-[#d9a04e]' : 'bg-[#f9edd8] text-[#93541f]',
    error:         isDark ? 'bg-[#b54a3f]/15 border-[#b54a3f] text-[#e8a9a3]'
                          : 'bg-[#fceae8] border-[#d4908a] text-[#8a3028]',
  };

  // ─── State ───
  const [hotTake, setHotTake] = useState('');
  const [intensity, setIntensity] = useState('heated');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [expandedSections, setExpandedSections] = useState({});
  const [showVerdict, setShowVerdict] = useState(false);

  // Scroll to results
  useEffect(() => {
    if (results && resultsRef.current) {
      setTimeout(() => {
        resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 250);
    }
  }, [results]);

  // ─── Handlers ───
  const handleRandomTopic = () => {
    const filtered = EXAMPLE_TOPICS.filter(t => t !== hotTake);
    setHotTake(filtered[Math.floor(Math.random() * filtered.length)]);
  };

  const handleSubmit = async () => {
    if (!hotTake.trim()) return;
    setError('');
    setResults(null);
    setShowVerdict(false);
    setExpandedSections({});

    try {
      const res = await callToolEndpoint('argument-simulator', {
        hotTake: hotTake.trim(),
        intensity,
      });
      setResults(res);
    } catch (err) {
      setError(err.message || 'Debate failed. Try again.');
    }
  };

  const handleReset = () => {
    setHotTake('');
    setResults(null);
    setError('');
    setShowVerdict(false);
    setExpandedSections({});
  };

  const toggleSection = (key) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // ─── Build copyable text ───
  const buildFullText = () => {
    if (!results) return '';
    let text = `⚔️ ARGUMENT SIMULATOR\n`;
    text += `"${results.topic_framed || hotTake}"\n`;
    text += `Intensity: ${INTENSITY_OPTIONS.find(o => o.id === intensity)?.label || intensity}\n\n`;

    if (results.side_a) {
      text += `━━ ${results.side_a.position} ━━\n`;
      text += `${results.side_a.argument}\n\n`;
      text += `💥 Killer point: ${results.side_a.killer_point}\n`;
      text += `📊 Evidence: ${results.side_a.evidence}\n`;
      text += `😬 Uncomfortable truth: ${results.side_a.uncomfortable_truth}\n\n`;
    }

    if (results.side_b) {
      text += `━━ ${results.side_b.position} ━━\n`;
      text += `${results.side_b.argument}\n\n`;
      text += `💥 Killer point: ${results.side_b.killer_point}\n`;
      text += `📊 Evidence: ${results.side_b.evidence}\n`;
      text += `😬 Uncomfortable truth: ${results.side_b.uncomfortable_truth}\n\n`;
    }

    if (results.where_they_actually_disagree) {
      text += `━━ THE REAL DISAGREEMENT ━━\n`;
      text += `${results.where_they_actually_disagree}\n\n`;
    }

    if (results.judge_verdict) {
      text += `━━ JUDGE'S VERDICT ━━\n`;
      text += `${results.judge_verdict}\n\n`;
    }

    if (results.dinner_party_take) {
      text += `━━ DINNER PARTY TAKE ━━\n`;
      text += `${results.dinner_party_take}\n\n`;
    }

    text += `— Generated by DeftBrain · deftbrain.com`;
    return text;
  };

  // ─── Side Card Component ───
  const SideCard = ({ side, sideKey, emoji }) => {
    if (!side) return null;
    const isA = sideKey === 'a';
    const bg = isA ? c.sideABg : c.sideBBg;
    const border = isA ? c.sideABorder : c.sideBBorder;
    const accent = isA ? c.sideAAccent : c.sideBAccent;
    const detailsKey = `${sideKey}-details`;
    const isExpanded = expandedSections[detailsKey] !== false; // default open

    return (
      <div className={`${bg} ${border} border rounded-2xl overflow-hidden transition-all duration-200`}>
        {/* Position header */}
        <div className="p-5 pb-0">
          <div className="flex items-start gap-3">
            <span className="text-2xl">{emoji}</span>
            <div className="flex-1 min-w-0">
              <p className={`font-bold ${accent} text-base leading-snug`}>
                {side.position}
              </p>
            </div>
          </div>
        </div>

        {/* Main argument */}
        <div className="px-5 py-4">
          <p className={`text-sm ${c.text} leading-relaxed`}>
            {side.argument}
          </p>
        </div>

        {/* Expandable details */}
        <div className={`border-t ${isA ? (isDark ? 'border-[#4a6a8a]/30' : 'border-[#b0c4d8]/50') : (isDark ? 'border-[#b06d22]/20' : 'border-[#e0c49a]/50')}`}>
          <button
            onClick={() => toggleSection(detailsKey)}
            className="w-full px-5 py-3 flex items-center justify-between text-left transition-colors"
          >
            <span className={`text-xs font-semibold uppercase tracking-wider ${c.textMuted}`}>
              Killer point · Evidence · Uncomfortable truth
            </span>
            <span className={`text-sm ${c.textMuted}`}>{isExpanded ? '▲' : '▼'}</span>
          </button>

          {isExpanded && (
            <div className="px-5 pb-5 space-y-4">
              {/* Killer point */}
              <div className="flex items-start gap-2.5">
                <span className="text-base flex-shrink-0 mt-0.5">💥</span>
                <div>
                  <p className={`text-xs font-semibold uppercase ${accent} mb-1`}>Killer Point</p>
                  <p className={`text-sm ${c.textSecondary} leading-relaxed`}>{side.killer_point}</p>
                </div>
              </div>

              {/* Evidence */}
              <div className="flex items-start gap-2.5">
                <span className="text-base flex-shrink-0 mt-0.5">📊</span>
                <div>
                  <p className={`text-xs font-semibold uppercase ${accent} mb-1`}>Evidence</p>
                  <p className={`text-sm ${c.textSecondary} leading-relaxed`}>{side.evidence}</p>
                </div>
              </div>

              {/* Uncomfortable truth */}
              <div className="flex items-start gap-2.5">
                <span className="text-base flex-shrink-0 mt-0.5">😬</span>
                <div>
                  <p className={`text-xs font-semibold uppercase ${accent} mb-1`}>Uncomfortable Truth</p>
                  <p className={`text-sm ${c.textSecondary} leading-relaxed italic`}>{side.uncomfortable_truth}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ─── Render ───
  return (
    <div className={`min-h-screen ${c.pageBg} transition-colors duration-200`}>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* ── Header ── */}
        <div className="text-center space-y-2">
          <div className="text-4xl">⚔️</div>
          <h1 className={`text-2xl font-bold ${c.heading}`}>Argument Simulator</h1>
          <p className={`text-sm ${c.textSecondary}`}>
            Drop a hot take. AI argues both sides with full conviction.
          </p>
        </div>

        {/* ── Input Card ── */}
        <div className={`${c.card} ${c.cardBorder} border rounded-2xl p-5 shadow-sm space-y-5`}>

          {/* Hot take input */}
          <div className="space-y-2">
            <label className={`text-sm font-semibold ${c.text}`}>
              <span className="mr-1.5">💬</span> Your hot take
            </label>
            <textarea
              value={hotTake}
              onChange={(e) => setHotTake(e.target.value)}
              placeholder="e.g. Pineapple belongs on pizza..."
              rows={2}
              maxLength={300}
              className={`w-full px-4 py-3 rounded-xl text-sm ${c.inputBg} ${c.inputBorder} ${c.inputFocus} border ${c.text} placeholder:${c.textMuted} resize-none outline-none transition-colors`}
            />
            <div className="flex items-center justify-between">
              <button
                onClick={handleRandomTopic}
                className={`text-xs ${c.btnSecondary} px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5`}
              >
                <span>🎲</span> Random topic
              </button>
              <span className={`text-xs ${c.textMuted}`}>{hotTake.length}/300</span>
            </div>
          </div>

          {/* Intensity selector */}
          <div className="space-y-2">
            <label className={`text-sm font-semibold ${c.text}`}>
              <span className="mr-1.5">🎚️</span> Intensity
            </label>
            <div className="grid grid-cols-3 gap-2">
              {INTENSITY_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setIntensity(opt.id)}
                  className={`${intensity === opt.id ? c.chipActive : c.chipInactive} border rounded-xl px-3 py-3 text-center transition-all duration-150`}
                >
                  <span className="text-xl block mb-1">{opt.icon}</span>
                  <p className="text-sm font-medium leading-tight">{opt.label}</p>
                  <p className={`text-xs ${c.textMuted} leading-tight mt-0.5 hidden sm:block`}>{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading || !hotTake.trim()}
            className={`w-full ${c.btnGold} py-3 rounded-xl font-semibold text-sm shadow-md
              disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2`}
          >
            {loading ? (
              <>
                <span className="animate-spin inline-block">⏳</span>
                Both sides loading their weapons...
              </>
            ) : (
              <>
                <span>⚔️</span> Start the Argument
              </>
            )}
          </button>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className={`${c.error} border rounded-xl p-4 text-sm flex items-center gap-2`}>
            <span>⚠️</span> {error}
          </div>
        )}

        {/* ── Results ── */}
        {results && (
          <div ref={resultsRef} className="space-y-5">

            {/* Topic banner */}
            {results.topic_framed && (
              <div className={`${c.cardAlt} ${c.cardBorder} border rounded-2xl p-4 text-center`}>
                <p className={`text-xs font-semibold uppercase tracking-wider ${c.textMuted} mb-1`}>
                  Tonight's debate
                </p>
                <p className={`text-lg font-bold ${c.heading} italic`}>
                  "{results.topic_framed}"
                </p>
              </div>
            )}

            {/* Side A — FOR */}
            <SideCard side={results.side_a} sideKey="a" emoji="👍" />

            {/* VS divider */}
            <div className="flex items-center gap-4 py-1">
              <div className={`flex-1 border-t ${c.divider}`} />
              <span className={`text-2xl font-black ${c.textMuted}`}>VS</span>
              <div className={`flex-1 border-t ${c.divider}`} />
            </div>

            {/* Side B — AGAINST */}
            <SideCard side={results.side_b} sideKey="b" emoji="👎" />

            {/* Where they actually disagree */}
            {results.where_they_actually_disagree && (
              <div className={`${c.card} ${c.cardBorder} border rounded-2xl p-5`}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🔍</span>
                  <h3 className={`font-bold ${c.heading}`}>Where They Actually Disagree</h3>
                </div>
                <p className={`text-sm ${c.textSecondary} leading-relaxed`}>
                  {results.where_they_actually_disagree}
                </p>
              </div>
            )}

            {/* Verdict — hidden by default */}
            {results.judge_verdict && (
              <div className="space-y-3">
                {!showVerdict ? (
                  <button
                    onClick={() => setShowVerdict(true)}
                    className={`w-full ${c.btnPrimary} py-3 rounded-xl font-semibold text-sm shadow-md transition-all duration-200 flex items-center justify-center gap-2`}
                  >
                    <span>🏛️</span> Reveal the Judge's Verdict
                  </button>
                ) : (
                  <div className={`${c.verdictBg} ${c.cardBorder} border rounded-2xl p-5 space-y-4`}>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🏛️</span>
                      <h3 className={`text-lg font-bold ${c.heading}`}>Judge's Verdict</h3>
                    </div>
                    <p className={`text-sm ${c.text} leading-relaxed`}>
                      {results.judge_verdict}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Dinner party take */}
            {results.dinner_party_take && (
              <div className={`${c.cardAlt} ${c.cardBorder} border rounded-2xl p-5`}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🍷</span>
                  <h3 className={`font-bold ${c.heading}`}>The Dinner Party Take</h3>
                </div>
                <p className={`text-sm italic ${c.textSecondary} leading-relaxed`}>
                  "{results.dinner_party_take}"
                </p>
                <p className={`text-xs ${c.textMuted} mt-2`}>
                  — The nuanced take that makes you sound smart without alienating anyone
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <ActionBar
                content={buildFullText()}
                title={`Argument Simulator: ${hotTake}`}
              />
              <button
                onClick={handleReset}
                className={`${c.btnSecondary} px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-1.5`}
              >
                <span>🔄</span> New Argument
              </button>
            </div>

            {/* Cross-references */}
            <div className={`${c.cardAlt} ${c.cardBorder} border rounded-xl p-4 space-y-2`}>
              <p className={`text-xs font-semibold ${c.textMuted} uppercase tracking-wider`}>
                Keep the fun going
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'PlotTwist', icon: '🔄', label: 'See other perspectives' },
                  { id: 'WrongAnswersOnly', icon: '🙃', label: 'Get wrong answers' },
                  { id: 'RoastMe', icon: '🔥', label: 'Get roasted instead' },
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

ArgumentSimulator.displayName = 'ArgumentSimulator';
export default ArgumentSimulator;
