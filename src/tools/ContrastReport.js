import React, { useState, useRef, useEffect } from 'react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';
import { CopyBtn, ActionBar } from '../components/ActionButtons';

const TIMEFRAME_OPTIONS = [
  { id: '1 year',   label: '1 year' },
  { id: '2 years',  label: '2 years' },
  { id: '5 years',  label: '5 years' },
  { id: '10 years', label: '10 years' },
];

const EXAMPLE_DECISIONS = [
  { a: 'Stay in my current city', b: 'Move across the country for the new job' },
  { a: 'Stay at my stable job', b: 'Quit and start my own business' },
  { a: 'Stay in this relationship', b: 'Leave and start over' },
  { a: 'Go back to school full-time', b: 'Keep working and study part-time' },
  { a: 'Keep renting in the city', b: 'Buy a house in the suburbs' },
  { a: 'Accept the promotion', b: 'Turn it down and protect my free time' },
];

const ContrastReport = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const resultsRef = useRef(null);

  // ─── Colors: Navy & Gold — editorial feel ───
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
    // Path-specific
    pathABg:       isDark ? 'bg-[#2c4a6e]/8'  : 'bg-[#edf1f7]',
    pathABorder:   isDark ? 'border-[#4a6a8a]/30' : 'border-[#c4d0de]',
    pathAAccent:   isDark ? 'text-[#a8b9ce]'   : 'text-[#2c4a6e]',
    pathABar:      isDark ? 'bg-[#4a6a8a]'     : 'bg-[#2c4a6e]',
    pathBBg:       isDark ? 'bg-[#b06d22]/6'   : 'bg-[#fdf6ee]',
    pathBBorder:   isDark ? 'border-[#b06d22]/20' : 'border-[#e0cfb0]',
    pathBAccent:   isDark ? 'text-[#d9a04e]'   : 'text-[#93541f]',
    pathBBar:      isDark ? 'bg-[#d9a04e]'     : 'bg-[#c8872e]',
    // Insight
    insightBg:     isDark ? 'bg-[#332e2a]'     : 'bg-[#f3efe8]',
    divider:       isDark ? 'border-[#3d3630]' : 'border-[#e8e1d5]',
    error:         isDark ? 'bg-[#b54a3f]/15 border-[#b54a3f] text-[#e8a9a3]'
                          : 'bg-[#fceae8] border-[#d4908a] text-[#8a3028]',
  };

  // ─── State ───
  const [pathA, setPathA] = useState('');
  const [pathB, setPathB] = useState('');
  const [aboutYou, setAboutYou] = useState('');
  const [timeframe, setTimeframe] = useState('2 years');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [activeNarrative, setActiveNarrative] = useState('a');

  useEffect(() => {
    if (results && resultsRef.current) {
      setTimeout(() => resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }), 250);
    }
  }, [results]);

  // ─── Handlers ───
  const handleExample = () => {
    const filtered = EXAMPLE_DECISIONS.filter(e => e.a !== pathA);
    const ex = filtered[Math.floor(Math.random() * filtered.length)];
    setPathA(ex.a);
    setPathB(ex.b);
  };

  const handleSubmit = async () => {
    if (!pathA.trim() || !pathB.trim()) return;
    setError('');
    setResults(null);
    setActiveNarrative('a');

    try {
      const res = await callToolEndpoint('contrast-report', {
        pathA: pathA.trim(),
        pathB: pathB.trim(),
        aboutYou: aboutYou.trim() || undefined,
        timeframe,
      });
      setResults(res);
    } catch (err) {
      setError(err.message || 'Failed to generate contrast report.');
    }
  };

  const handleReset = () => {
    setPathA('');
    setPathB('');
    setAboutYou('');
    setResults(null);
    setError('');
    setActiveNarrative('a');
  };

  // ─── Build copyable text ───
  const buildFullText = () => {
    if (!results) return '';
    let t = `🔮 THE CONTRAST REPORT\n`;
    t += `"${results.decision_framed || `${pathA} vs. ${pathB}`}"\n`;
    t += `Timeframe: ${timeframe}\n\n`;

    if (results.path_a) {
      t += `━━ PATH A: ${results.path_a.label} ━━\n\n`;
      t += `${results.path_a.narrative}\n\n`;
      t += `✦ Best moment: ${results.path_a.the_good_moment}\n`;
      t += `✧ Honest cost: ${results.path_a.the_honest_cost}\n\n`;
    }
    if (results.path_b) {
      t += `━━ PATH B: ${results.path_b.label} ━━\n\n`;
      t += `${results.path_b.narrative}\n\n`;
      t += `✦ Best moment: ${results.path_b.the_good_moment}\n`;
      t += `✧ Honest cost: ${results.path_b.the_honest_cost}\n\n`;
    }
    if (results.what_i_noticed) {
      t += `━━ WHAT I NOTICED ━━\n\n`;
      t += `The pull: ${results.what_i_noticed.the_pull}\n\n`;
      t += `What you're trading: ${results.what_i_noticed.what_youre_trading}\n\n`;
      t += `The question underneath: ${results.what_i_noticed.the_question_underneath}\n\n`;
    }
    t += `— Generated by DeftBrain · deftbrain.com`;
    return t;
  };

  // ─── Narrative Section ───
  const NarrativeSection = ({ path, side }) => {
    if (!path) return null;
    const isA = side === 'a';
    const bg = isA ? c.pathABg : c.pathBBg;
    const border = isA ? c.pathABorder : c.pathBBorder;
    const accent = isA ? c.pathAAccent : c.pathBAccent;
    const bar = isA ? c.pathABar : c.pathBBar;

    return (
      <div className="space-y-5">
        {/* Label */}
        <div className="flex items-center gap-3">
          <div className={`w-1 h-8 rounded-full ${bar}`} />
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wider ${c.textMuted}`}>
              Path {side.toUpperCase()}
            </p>
            <h3 className={`text-lg font-bold ${c.heading}`}>{path.label}</h3>
          </div>
        </div>

        {/* Narrative — the star of the show */}
        <div className={`${bg} ${border} border rounded-2xl p-6 sm:p-8`}>
          <p className={`text-sm sm:text-base ${c.text} leading-[1.85] whitespace-pre-wrap`}
             style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            {path.narrative}
          </p>
        </div>

        {/* Good moment + honest cost */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {path.the_good_moment && (
            <div className={`${c.card} ${c.cardBorder} border rounded-xl p-4`}>
              <p className={`text-xs font-semibold uppercase tracking-wider ${accent} mb-2 flex items-center gap-1.5`}>
                <span>✦</span> The moment that makes it worth it
              </p>
              <p className={`text-sm ${c.textSecondary} leading-relaxed italic`}>
                {path.the_good_moment}
              </p>
            </div>
          )}
          {path.the_honest_cost && (
            <div className={`${c.card} ${c.cardBorder} border rounded-xl p-4`}>
              <p className={`text-xs font-semibold uppercase tracking-wider ${c.textMuted} mb-2 flex items-center gap-1.5`}>
                <span>✧</span> The cost nobody warns you about
              </p>
              <p className={`text-sm ${c.textSecondary} leading-relaxed italic`}>
                {path.the_honest_cost}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ─── Render ───
  return (
    <div className={`min-h-screen ${c.pageBg} transition-colors duration-200`}>
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="text-4xl">🔮</div>
          <h1 className={`text-2xl font-bold ${c.heading}`}>The Contrast Report</h1>
          <p className={`text-sm ${c.textSecondary} max-w-md mx-auto leading-relaxed`}>
            Describe two paths you're considering. Instead of a pro/con list, you'll get a vivid day in each life — so your gut can weigh in, not just your brain.
          </p>
        </div>

        {/* Input */}
        {!results && (
          <div className={`${c.card} ${c.cardBorder} border rounded-2xl p-6 shadow-sm space-y-5`}>

            {/* Path A */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={`w-1 h-5 rounded-full ${c.pathABar}`} />
                <label className={`text-sm font-semibold ${c.text}`}>Path A</label>
              </div>
              <textarea
                value={pathA}
                onChange={(e) => setPathA(e.target.value)}
                placeholder="e.g. Stay in my current city, keep my job, stay close to family..."
                rows={2}
                maxLength={400}
                className={`w-full px-4 py-3 rounded-xl text-sm ${c.inputBg} ${c.inputBorder} ${c.inputFocus} border ${c.text} placeholder:${c.textMuted} resize-none outline-none transition-colors`}
              />
            </div>

            {/* Path B */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={`w-1 h-5 rounded-full ${c.pathBBar}`} />
                <label className={`text-sm font-semibold ${c.text}`}>Path B</label>
              </div>
              <textarea
                value={pathB}
                onChange={(e) => setPathB(e.target.value)}
                placeholder="e.g. Move across the country for the new job, start over in a new city..."
                rows={2}
                maxLength={400}
                className={`w-full px-4 py-3 rounded-xl text-sm ${c.inputBg} ${c.inputBorder} ${c.inputFocus} border ${c.text} placeholder:${c.textMuted} resize-none outline-none transition-colors`}
              />
            </div>

            {/* About you */}
            <div className="space-y-2">
              <label className={`text-sm font-semibold ${c.text}`}>
                About you <span className={`font-normal ${c.textMuted}`}>(optional — makes narratives more personal)</span>
              </label>
              <textarea
                value={aboutYou}
                onChange={(e) => setAboutYou(e.target.value)}
                placeholder="e.g. I'm 28, in a relationship, love cooking, work in marketing, introverted..."
                rows={2}
                maxLength={400}
                className={`w-full px-4 py-3 rounded-xl text-sm ${c.inputBg} ${c.inputBorder} ${c.inputFocus} border ${c.text} placeholder:${c.textMuted} resize-none outline-none transition-colors`}
              />
            </div>

            {/* Timeframe */}
            <div className="space-y-2">
              <label className={`text-sm font-semibold ${c.text}`}>
                <span className="mr-1.5">⏳</span> How far out?
              </label>
              <div className="flex gap-2">
                {TIMEFRAME_OPTIONS.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTimeframe(t.id)}
                    className={`flex-1 ${timeframe === t.id ? c.chipActive : c.chipInactive} border rounded-xl py-2 text-sm font-medium text-center transition-all duration-150`}
                  >
                    {t.label}
                  </button>
                ))}
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
              disabled={loading || !pathA.trim() || !pathB.trim()}
              className={`w-full ${c.btnGold} py-3 rounded-xl font-semibold text-sm shadow-md
                disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2`}
            >
              {loading ? (
                <>
                  <span className="animate-spin inline-block">⏳</span>
                  Living both lives for you...
                </>
              ) : (
                <>
                  <span>🔮</span> Show me both futures
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
          <div ref={resultsRef} className="space-y-8">

            {/* Decision framed */}
            {results.decision_framed && (
              <div className="text-center py-2">
                <p className={`text-xs font-semibold uppercase tracking-wider ${c.textMuted} mb-2`}>
                  The decision
                </p>
                <p className={`text-base font-medium italic ${c.heading} max-w-md mx-auto`}>
                  "{results.decision_framed}"
                </p>
                <p className={`text-xs ${c.textMuted} mt-1`}>{timeframe} from now</p>
              </div>
            )}

            {/* Narrative toggle — mobile-friendly */}
            <div className={`flex border-b ${c.divider}`}>
              <button
                onClick={() => setActiveNarrative('a')}
                className={`flex-1 py-3 text-sm font-medium text-center transition-all duration-150 flex items-center justify-center gap-2
                  ${activeNarrative === 'a'
                    ? `${c.pathAAccent} border-b-2 ${isDark ? 'border-[#6e8aaa]' : 'border-[#2c4a6e]'}`
                    : `${c.textMuted}`
                  }`}
              >
                <div className={`w-2 h-2 rounded-full ${c.pathABar}`} />
                {results.path_a?.label || 'Path A'}
              </button>
              <button
                onClick={() => setActiveNarrative('b')}
                className={`flex-1 py-3 text-sm font-medium text-center transition-all duration-150 flex items-center justify-center gap-2
                  ${activeNarrative === 'b'
                    ? `${c.pathBAccent} border-b-2 ${isDark ? 'border-[#d9a04e]' : 'border-[#c8872e]'}`
                    : `${c.textMuted}`
                  }`}
              >
                <div className={`w-2 h-2 rounded-full ${c.pathBBar}`} />
                {results.path_b?.label || 'Path B'}
              </button>
            </div>

            {/* Active narrative */}
            <div>
              {activeNarrative === 'a' && <NarrativeSection path={results.path_a} side="a" />}
              {activeNarrative === 'b' && <NarrativeSection path={results.path_b} side="b" />}
            </div>

            {/* What I noticed */}
            {results.what_i_noticed && (
              <div className="space-y-4">
                <div className="flex items-center gap-4 py-2">
                  <div className={`flex-1 border-t ${c.divider}`} />
                  <span className={`text-xs font-semibold uppercase tracking-wider ${c.textMuted}`}>What I noticed</span>
                  <div className={`flex-1 border-t ${c.divider}`} />
                </div>

                {/* The pull */}
                {results.what_i_noticed.the_pull && (
                  <div className={`${c.insightBg} rounded-2xl p-5`}>
                    <p className={`text-xs font-semibold uppercase tracking-wider ${c.textMuted} mb-2 flex items-center gap-1.5`}>
                      <span>🧲</span> The pull
                    </p>
                    <p className={`text-sm ${c.text} leading-relaxed`}>
                      {results.what_i_noticed.the_pull}
                    </p>
                  </div>
                )}

                {/* What you're trading */}
                {results.what_i_noticed.what_youre_trading && (
                  <div className={`${c.card} ${c.cardBorder} border rounded-2xl p-5`}>
                    <p className={`text-xs font-semibold uppercase tracking-wider ${c.textMuted} mb-2 flex items-center gap-1.5`}>
                      <span>⚖️</span> What you're trading
                    </p>
                    <p className={`text-sm ${c.text} leading-relaxed`}>
                      {results.what_i_noticed.what_youre_trading}
                    </p>
                  </div>
                )}

                {/* The question underneath */}
                {results.what_i_noticed.the_question_underneath && (
                  <div className="rounded-2xl p-6 text-center"
                    style={{
                      background: isDark
                        ? 'linear-gradient(135deg, #2a2623, #332e2a)'
                        : 'linear-gradient(135deg, #f3efe8, #e8e1d5)',
                    }}
                  >
                    <p className={`text-xs font-semibold uppercase tracking-wider ${c.textMuted} mb-3`}>
                      The question underneath
                    </p>
                    <p className={`text-base italic ${c.heading} leading-relaxed max-w-md mx-auto`}>
                      "{results.what_i_noticed.the_question_underneath}"
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <ActionBar
                content={buildFullText()}
                title="The Contrast Report"
              />
              <button
                onClick={handleReset}
                className={`${c.btnSecondary} px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-1.5`}
              >
                <span>🔄</span> New decision
              </button>
            </div>

            {/* Cross-references */}
            <div className={`${c.cardAlt} ${c.cardBorder} border rounded-xl p-4 space-y-2`}>
              <p className={`text-xs font-semibold ${c.textMuted} uppercase tracking-wider`}>
                Related tools
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'MirrorTest', icon: '🪞', label: 'Test what you believe' },
                  { id: 'PlotTwist', icon: '🔄', label: 'See other perspectives' },
                  { id: 'TheAlibi', icon: '🎭', label: 'Reframe your story' },
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

ContrastReport.displayName = 'ContrastReport';
export default ContrastReport;
