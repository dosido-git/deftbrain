import React, { useState, useRef, useEffect } from 'react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';
import { CopyBtn, ActionBar } from '../components/ActionButtons';

const TIMEFRAME_OPTIONS = [
  { id: 'today',          label: 'Today' },
  { id: 'yesterday',      label: 'Yesterday' },
  { id: 'this week',      label: 'This week' },
  { id: 'this past weekend', label: 'Weekend' },
];

const WhereDidItGo = () => {
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
    gapBg:         isDark ? 'bg-[#6e4a2c]/10'  : 'bg-[#fef8f0]',
    gapBorder:     isDark ? 'border-[#8a6a40]/30' : 'border-[#e8d4b8]',
    greenBg:       isDark ? 'bg-[#5a8a5c]/10'  : 'bg-[#e8f0e8]',
    greenBorder:   isDark ? 'border-[#5a8a5c]/30' : 'border-[#b8d4b9]',
    greenText:     isDark ? 'text-[#8aba8c]'   : 'text-[#3d6e3f]',
    invisBg:       isDark ? 'bg-[#6e3a3a]/10'  : 'bg-[#fdf0ee]',
    invisBorder:   isDark ? 'border-[#8a5a5a]/20' : 'border-[#e8d0ca]',
    invisText:     isDark ? 'text-[#d0a0a0]'   : 'text-[#7a4040]',
    divider:       isDark ? 'border-[#3d3630]' : 'border-[#e8e1d5]',
    error:         isDark ? 'bg-[#b54a3f]/15 border-[#b54a3f] text-[#e8a9a3]'
                          : 'bg-[#fceae8] border-[#d4908a] text-[#8a3028]',
  };

  // ─── State ───
  const [dayDescription, setDayDescription] = useState('');
  const [perceivedBreakdown, setPerceivedBreakdown] = useState('');
  const [timeframe, setTimeframe] = useState('today');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [showInvisible, setShowInvisible] = useState(false);

  useEffect(() => {
    if (results && resultsRef.current) {
      setTimeout(() => resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }), 250);
    }
  }, [results]);

  // ─── Handlers ───
  const handleSubmit = async () => {
    if (!dayDescription.trim()) return;
    setError('');
    setResults(null);
    setShowInvisible(false);

    try {
      const res = await callToolEndpoint('where-did-it-go', {
        dayDescription: dayDescription.trim(),
        perceivedBreakdown: perceivedBreakdown.trim() || undefined,
        timeframe,
      });
      setResults(res);
    } catch (err) {
      setError(err.message || 'Failed to analyze time.');
    }
  };

  const handleReset = () => {
    setDayDescription('');
    setPerceivedBreakdown('');
    setResults(null);
    setError('');
    setShowInvisible(false);
  };

  // ─── Build text ───
  const buildFullText = () => {
    if (!results) return '';
    const r = results;
    let t = `⏳ WHERE DID IT GO\nTimeframe: ${timeframe}\n\n`;

    if (r.what_you_actually_did) t += `WHAT YOU ACTUALLY DID:\n${r.what_you_actually_did}\n\n`;

    if (r.the_visible_day?.activities?.length) {
      t += `━━ THE VISIBLE DAY (${r.the_visible_day.total_hours_described}) ━━\n\n`;
      r.the_visible_day.activities.forEach(a => {
        t += `${a.activity}\n`;
        t += `  You think: ${a.perceived_time} → Likely: ${a.likely_actual_time}\n`;
        t += `  Hidden: ${a.hidden_overhead}\n\n`;
      });
    }

    if (r.the_invisible_hours?.where_it_went?.length) {
      t += `━━ THE INVISIBLE HOURS (~${r.the_invisible_hours.total_unaccounted}) ━━\n\n`;
      r.the_invisible_hours.where_it_went.forEach(h => {
        t += `${h.category} (~${h.estimated_time})\n`;
        t += `  ${h.why_you_didnt_see_it}\n\n`;
      });
    }

    if (r.the_perception_gap) {
      t += `━━ THE BIGGEST GAP ━━\n${r.the_perception_gap.biggest_gap}\n`;
      t += `${r.the_perception_gap.why_this_is_normal}\n\n`;
    }

    if (r.the_one_thing) {
      t += `━━ THE ONE THING ━━\n${r.the_one_thing.change}\n`;
      t += `${r.the_one_thing.why_it_works}\n`;
      t += `Time reclaimed: ${r.the_one_thing.time_reclaimed}\n\n`;
    }

    if (r.honest_capacity) t += `━━ HONEST CAPACITY ━━\n${r.honest_capacity}\n\n`;

    t += `— Generated by DeftBrain · deftbrain.com`;
    return t;
  };

  // ─── Render ───
  return (
    <div className={`min-h-screen ${c.pageBg} transition-colors duration-200`}>
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="text-4xl">⏳</div>
          <h1 className={`text-2xl font-bold ${c.heading}`}>Where Did It Go?</h1>
          <p className={`text-sm ${c.textSecondary} max-w-md mx-auto leading-relaxed`}>
            Describe how you spent your time. Optionally guess where it went. See the gap between what you think happened and what actually happened.
          </p>
        </div>

        {/* Input */}
        {!results && (
          <div className={`${c.card} ${c.cardBorder} border rounded-2xl p-6 shadow-sm space-y-5`}>

            {/* Timeframe */}
            <div className="space-y-2">
              <label className={`text-sm font-semibold ${c.text}`}>Timeframe</label>
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

            {/* Day description */}
            <div className="space-y-2">
              <label className={`text-sm font-semibold ${c.text}`}>
                <span className="mr-1.5">📋</span> What did you do {timeframe}?
              </label>
              <textarea
                value={dayDescription}
                onChange={(e) => setDayDescription(e.target.value)}
                placeholder={"Describe your day as you remember it — meetings, tasks, breaks, whatever comes to mind.\n\ne.g. Had a team standup at 9, then worked on the presentation until lunch. Afternoon was mostly emails and a 1-on-1 with my manager. Tried to write the report but kept getting pulled into Slack..."}
                rows={5}
                maxLength={1000}
                className={`w-full px-4 py-3 rounded-xl text-sm ${c.inputBg} ${c.inputBorder} ${c.inputFocus} border ${c.text} placeholder:${c.textMuted} resize-none outline-none transition-colors`}
              />
            </div>

            {/* Perceived breakdown */}
            <div className="space-y-2">
              <label className={`text-sm font-semibold ${c.text}`}>
                <span className="mr-1.5">🤔</span> Where do you <em>think</em> time went? <span className={`font-normal ${c.textMuted}`}>(optional — makes the gap analysis much better)</span>
              </label>
              <textarea
                value={perceivedBreakdown}
                onChange={(e) => setPerceivedBreakdown(e.target.value)}
                placeholder="e.g. Maybe 4 hours of real work, 2 hours of meetings, 1 hour of email, 1 hour of lunch..."
                rows={2}
                maxLength={400}
                className={`w-full px-4 py-3 rounded-xl text-sm ${c.inputBg} ${c.inputBorder} ${c.inputFocus} border ${c.text} placeholder:${c.textMuted} resize-none outline-none transition-colors`}
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={loading || !dayDescription.trim()}
              className={`w-full ${c.btnGold} py-3 rounded-xl font-semibold text-sm shadow-md
                disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2`}
            >
              {loading ? (
                <>
                  <span className="animate-spin inline-block">⏳</span>
                  Tracing the hours...
                </>
              ) : (
                <>
                  <span>⏳</span> Where did it go?
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

            {/* Validation first */}
            {results.what_you_actually_did && (
              <div className={`${c.greenBg} ${c.greenBorder} border rounded-2xl p-5`}>
                <p className={`text-xs font-semibold uppercase tracking-wider ${c.greenText} mb-2 flex items-center gap-1.5`}>
                  <span>✅</span> What you actually did
                </p>
                <p className={`text-sm ${c.text} leading-relaxed`}>
                  {results.what_you_actually_did}
                </p>
              </div>
            )}

            {/* The visible day */}
            {results.the_visible_day?.activities?.length > 0 && (
              <div className={`${c.card} ${c.cardBorder} border rounded-2xl p-5`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`font-bold ${c.heading} flex items-center gap-2`}>
                    <span>📊</span> The Visible Day
                  </h3>
                  {results.the_visible_day.total_hours_described && (
                    <span className={`text-xs font-bold ${c.goldText} px-2 py-1 rounded-lg ${c.goldBg}`}>
                      ~{results.the_visible_day.total_hours_described}
                    </span>
                  )}
                </div>
                <div className="space-y-3">
                  {results.the_visible_day.activities.map((a, i) => (
                    <div key={i} className={`${c.cardAlt} ${c.cardBorder} border rounded-xl p-4`}>
                      <p className={`text-sm font-semibold ${c.text} mb-2`}>{a.activity}</p>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs ${c.textMuted}`}>You think:</span>
                          <span className={`text-xs font-bold ${c.textSecondary}`}>{a.perceived_time}</span>
                        </div>
                        <span className={`text-xs ${c.textMuted}`}>→</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs ${c.textMuted}`}>Likely:</span>
                          <span className={`text-xs font-bold ${c.goldText}`}>{a.likely_actual_time}</span>
                        </div>
                      </div>
                      <p className={`text-xs ${c.textMuted} italic`}>
                        <span className="mr-1">👻</span> {a.hidden_overhead}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* The invisible hours */}
            {results.the_invisible_hours?.where_it_went?.length > 0 && (
              <div>
                {!showInvisible ? (
                  <button
                    onClick={() => setShowInvisible(true)}
                    className={`w-full ${c.btnSecondary} py-3 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2`}
                  >
                    <span>👻</span> Show the invisible hours
                    {results.the_invisible_hours.total_unaccounted && (
                      <span className={`text-xs ${c.textMuted}`}>(~{results.the_invisible_hours.total_unaccounted})</span>
                    )}
                  </button>
                ) : (
                  <div className={`${c.invisBg} ${c.invisBorder} border rounded-2xl p-5`}>
                    <div className="flex items-center justify-between mb-4">
                      <p className={`text-xs font-semibold uppercase tracking-wider ${c.invisText} flex items-center gap-1.5`}>
                        <span>👻</span> The invisible hours
                      </p>
                      {results.the_invisible_hours.total_unaccounted && (
                        <span className={`text-xs font-bold ${c.invisText}`}>
                          ~{results.the_invisible_hours.total_unaccounted}
                        </span>
                      )}
                    </div>
                    <div className="space-y-3">
                      {results.the_invisible_hours.where_it_went.map((h, i) => (
                        <div key={i} className={`${c.card} rounded-xl p-4`}>
                          <div className="flex items-center justify-between mb-1">
                            <p className={`text-sm font-semibold ${c.text}`}>{h.category}</p>
                            <span className={`text-xs font-bold ${c.goldText}`}>~{h.estimated_time}</span>
                          </div>
                          <p className={`text-xs ${c.textMuted} leading-relaxed`}>{h.why_you_didnt_see_it}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* The perception gap */}
            {results.the_perception_gap && (
              <div className={`${c.gapBg} ${c.gapBorder} border rounded-2xl p-5`}>
                <p className={`text-xs font-semibold uppercase tracking-wider ${c.goldText} mb-2 flex items-center gap-1.5`}>
                  <span>🔍</span> The biggest gap
                </p>
                <p className={`text-sm font-medium ${c.text} leading-relaxed mb-2`}>
                  {results.the_perception_gap.biggest_gap}
                </p>
                <p className={`text-xs ${c.textMuted} italic`}>
                  {results.the_perception_gap.why_this_is_normal}
                </p>
              </div>
            )}

            {/* The one thing */}
            {results.the_one_thing && (
              <div className="rounded-2xl p-6"
                style={{
                  background: isDark
                    ? 'linear-gradient(135deg, #2a2623, #332e2a)'
                    : 'linear-gradient(135deg, #f3efe8, #e8e1d5)',
                }}
              >
                <p className={`text-xs font-semibold uppercase tracking-wider ${c.accentText} mb-3 text-center`}>
                  The one thing that would actually help
                </p>
                <p className={`text-base font-bold ${c.heading} text-center leading-relaxed mb-3`}>
                  {results.the_one_thing.change}
                </p>
                <p className={`text-sm ${c.textSecondary} text-center mb-2`}>
                  {results.the_one_thing.why_it_works}
                </p>
                {results.the_one_thing.time_reclaimed && (
                  <p className={`text-xs font-semibold ${c.goldText} text-center`}>
                    ⏳ Potential time reclaimed: {results.the_one_thing.time_reclaimed}
                  </p>
                )}
              </div>
            )}

            {/* Honest capacity */}
            {results.honest_capacity && (
              <div className={`${c.cardAlt} ${c.cardBorder} border rounded-xl p-4 text-center`}>
                <p className={`text-xs font-semibold uppercase tracking-wider ${c.textMuted} mb-2`}>Honest capacity</p>
                <p className={`text-sm ${c.text} leading-relaxed italic max-w-md mx-auto`}>
                  {results.honest_capacity}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <ActionBar
                content={buildFullText()}
                title="Where Did It Go?"
              />
              <button
                onClick={handleReset}
                className={`${c.btnSecondary} px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-1.5`}
              >
                <span>🔄</span> Analyze another {timeframe === 'today' ? 'day' : 'period'}
              </button>
            </div>

            {/* Cross-references */}
            <div className={`${c.cardAlt} ${c.cardBorder} border rounded-xl p-4 space-y-2`}>
              <p className={`text-xs font-semibold ${c.textMuted} uppercase tracking-wider`}>
                Related tools
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'CrashPredictor', icon: '📉', label: 'Check your burnout risk' },
                  { id: 'ContrastReport', icon: '🔮', label: 'Compare two paths' },
                  { id: 'MirrorTest', icon: '🪞', label: 'Test what you believe' },
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

WhereDidItGo.displayName = 'WhereDidItGo';
export default WhereDidItGo;
