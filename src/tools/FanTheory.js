import React, { useState, useCallback } from 'react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';
import { CopyBtn, ActionBar } from '../components/ActionButtons';

// ════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════
const MEDIA_TYPES = [
  { value: 'movie', label: 'Movie', icon: '🎬' },
  { value: 'show', label: 'TV Show', icon: '📺' },
  { value: 'book', label: 'Book', icon: '📖' },
  { value: 'game', label: 'Game', icon: '🎮' },
];

const DIRECTIONS = [
  { value: 'wild', label: 'Surprise Me', icon: '🎲', desc: 'Most creative angle' },
  { value: 'villain', label: 'Secret Villain', icon: '😈', desc: 'Hero is actually evil' },
  { value: 'connected', label: 'Shared Universe', icon: '🔗', desc: 'Connected to another franchise' },
  { value: 'timeline', label: 'Timeline Twist', icon: '⏰', desc: 'Events are out of order' },
  { value: 'alive', label: 'Dead or Alive', icon: '👻', desc: 'Dead character is alive, or vice versa' },
  { value: 'simulation', label: 'It\'s a Simulation', icon: '🖥️', desc: 'None of it is real' },
];

const EVIDENCE_STYLES = {
  'COMPELLING': { icon: '🔥', color: 'accent' },
  'SUSPICIOUS': { icon: '🧐', color: 'warningText' },
  'A STRETCH': { icon: '🤸', color: 'textMuted' },
  'PURE DELUSION': { icon: '🤡', color: 'dangerText' },
};

// ════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════
const FanTheory = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const c = {
    card: isDark ? 'bg-[#1a1a2e] border-[#2a2a4a]' : 'bg-white border-[#d4d4d4]',
    input: isDark
      ? 'bg-[#0f0f1e] border-[#2a2a4a] text-[#e8e8e8] placeholder:text-[#555] focus:border-[#c8a951] focus:ring-[#c8a951]/20'
      : 'bg-white border-[#ccc] text-[#1e3a5f] placeholder:text-[#999] focus:border-[#1e3a5f] focus:ring-[#1e3a5f]/20',
    text: isDark ? 'text-[#e8e8e8]' : 'text-[#1e3a5f]',
    textSec: isDark ? 'text-[#a0a0b8]' : 'text-[#4a6a8a]',
    textMuted: isDark ? 'text-[#666680]' : 'text-[#8a8a8a]',
    label: isDark ? 'text-[#c0c0d0]' : 'text-[#2a4a6a]',
    accent: isDark ? 'text-[#c8a951]' : 'text-[#1e3a5f]',
    accentBg: isDark ? 'bg-[#c8a951]/10 border-[#c8a951]/30' : 'bg-[#1e3a5f]/5 border-[#1e3a5f]/20',
    btnPrimary: isDark ? 'bg-[#c8a951] hover:bg-[#d4b85c] text-[#1a1a2e]' : 'bg-[#1e3a5f] hover:bg-[#2a4a6f] text-white',
    btnSec: isDark ? 'bg-[#2a2a4a] hover:bg-[#3a3a5a] text-[#e8e8e8]' : 'bg-[#f0f0f0] hover:bg-[#e0e0e0] text-[#1e3a5f]',
    danger: isDark ? 'bg-[#3a1a1a] border-[#5a2a2a] text-[#f0a0a0]' : 'bg-[#fef2f2] border-[#e8c0c0] text-[#7a2a2a]',
    dangerText: isDark ? 'text-[#f0a0a0]' : 'text-[#a03030]',
    warningText: isDark ? 'text-[#e0c080]' : 'text-[#8a6a20]',
    success: isDark ? 'bg-[#1a2e1a] border-[#2a4a2a] text-[#a0e0a0]' : 'bg-[#f0faf0] border-[#c0dcc0] text-[#2a5a2a]',
    pillActive: isDark ? 'bg-[#c8a951] border-[#c8a951] text-[#1a1a2e]' : 'bg-[#1e3a5f] border-[#1e3a5f] text-white',
    pillInactive: isDark ? 'bg-[#2a2a4a] border-[#3a3a5a] text-[#c0c0d0] hover:border-[#4a4a6a]' : 'bg-white border-[#d4d4d4] text-[#4a6a8a] hover:border-[#aaa]',
    quoteBg: isDark ? 'bg-[#0f0f1e]/60' : 'bg-[#f8f8f8]',
    warning: isDark ? 'bg-[#2e2a1a] border-[#4a3a2a] text-[#e0c080]' : 'bg-[#fffbf0] border-[#dcc8a0] text-[#6a4a1a]',
  };

  // ── State ──
  const [view, setView] = useState('generate'); // generate | grade
  const [title, setTitle] = useState('');
  const [mediaType, setMediaType] = useState('movie');
  const [direction, setDirection] = useState('wild');
  const [results, setResults] = useState(null);
  const [myTheory, setMyTheory] = useState('');
  const [gradeResults, setGradeResults] = useState(null);
  const [error, setError] = useState('');

  // ── API: Generate theory ──
  const runGenerate = useCallback(async () => {
    if (!title.trim()) return;
    setError(''); setResults(null);
    try {
      const data = await callToolEndpoint('fan-theory', { title: title.trim(), mediaType, direction });
      setResults(data);
    } catch (err) { setError(err.message || 'Theory failed'); }
  }, [title, mediaType, direction, callToolEndpoint]);

  // ── API: Grade theory ──
  const runGrade = useCallback(async () => {
    if (!myTheory.trim()) return;
    setError(''); setGradeResults(null);
    try {
      const data = await callToolEndpoint('fan-theory/grade', { title: title.trim(), theory: myTheory.trim() });
      setGradeResults(data);
    } catch (err) { setError(err.message || 'Grading failed'); }
  }, [title, myTheory, callToolEndpoint]);

  // ── Copy builder ──
  const buildFullText = useCallback(() => {
    if (!results) return '';
    const lines = [`🧵 FAN THEORY: ${results.theory_name || ''}`, ''];
    if (results.one_line) lines.push(`💡 ${results.one_line}`, '');
    if (results.the_theory) lines.push(results.the_theory, '');
    if (results.evidence?.length) {
      lines.push('EVIDENCE:');
      results.evidence.forEach(e => lines.push(`  ${e.strength === 'COMPELLING' ? '🔥' : '🧐'} ${e.detail} → ${e.spin}`));
      lines.push('');
    }
    if (results.the_smoking_gun) lines.push(`🔫 Smoking Gun: ${results.the_smoking_gun}`);
    if (results.plausibility) lines.push(`\nPlausibility: ${results.plausibility}/10`);
    lines.push('\n— Generated by DeftBrain · deftbrain.com');
    return lines.join('\n');
  }, [results]);

  const evStyle = (str) => EVIDENCE_STYLES[str] || EVIDENCE_STYLES['SUSPICIOUS'];

  // ════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════
  return (
    <div className={`space-y-4 ${c.text}`}>
      {/* Nav */}
      <div className="flex gap-2">
        {[
          { key: 'generate', label: '🧵 Generate Theory' },
          { key: 'grade', label: '📝 Grade My Theory' },
        ].map(t => (
          <button key={t.key} onClick={() => setView(t.key)}
            className={`px-4 py-2 rounded-lg text-xs font-bold border transition-colors min-h-[36px] ${
              view === t.key ? c.pillActive : c.pillInactive}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Generate view */}
      {view === 'generate' && (
        <>
          <div className={`${c.card} border rounded-xl p-5`}>
            <div className={`mb-4 pb-3 border-b ${isDark ? 'border-[#2a2a4a]' : 'border-[#e0e0e0]'}`}>
              <h2 className={`text-xl font-bold`}><span className="mr-2">🧵</span>Fan Theory Generator</h2>
              <p className={`text-sm ${c.textSec}`}>Name anything — I'll generate a wild but defensible fan theory</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className={`text-xs font-bold ${c.label} block mb-1.5`}>Title</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="Movie, show, book, or game..."
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm ${c.input} outline-none focus:ring-2`} />
              </div>
              <div>
                <label className={`text-xs font-bold ${c.label} uppercase block mb-1.5`}>Type</label>
                <div className="flex gap-1.5 flex-wrap">
                  {MEDIA_TYPES.map(m => (
                    <button key={m.value} onClick={() => setMediaType(m.value)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border min-h-[30px] ${
                        mediaType === m.value ? c.pillActive : c.pillInactive}`}>
                      {m.icon} {m.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mb-5">
              <label className={`text-xs font-bold ${c.label} uppercase block mb-2`}>Theory direction</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {DIRECTIONS.map(d => (
                  <button key={d.value} onClick={() => setDirection(d.value)}
                    className={`py-2 px-3 rounded-xl border text-left min-h-[48px] transition-colors ${
                      direction === d.value ? c.pillActive : c.pillInactive}`}>
                    <span className="text-sm">{d.icon} {d.label}</span>
                    <span className={`text-[9px] block ${direction === d.value ? 'opacity-80' : c.textMuted}`}>{d.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <button onClick={runGenerate} disabled={!title.trim() || loading}
              className={`w-full ${c.btnPrimary} disabled:opacity-40 font-bold py-3 rounded-lg flex items-center justify-center gap-2 min-h-[48px]`}>
              {loading ? <><span className="animate-spin inline-block">⏳</span> Theorizing...</> : <><span>🧵</span> Generate Theory</>}
            </button>
          </div>

          {/* Results */}
          {results && (
            <div className="space-y-4">
              <div className="flex justify-end"><ActionBar content={buildFullText()} title="Fan Theory" /></div>

              {/* Theory header */}
              <div className={`${c.accentBg} border-2 rounded-xl p-5 text-center`}>
                <span className="text-3xl block mb-2">🧵</span>
                <p className={`text-lg font-black ${c.text} mb-2`}>{results.theory_name}</p>
                {results.one_line && <p className={`text-sm ${c.textSec} italic`}>"{results.one_line}"</p>}
                <div className="flex justify-center gap-4 mt-3">
                  {results.plausibility && (
                    <div><span className={`text-xl font-black ${c.accent}`}>{results.plausibility}</span><span className={`text-xs ${c.textMuted}`}>/10 plausible</span></div>
                  )}
                  {results.mind_blown_factor && (
                    <div><span className={`text-xl font-black ${c.accent}`}>{results.mind_blown_factor}</span><span className={`text-xs ${c.textMuted}`}>/10 mind-blown</span></div>
                  )}
                </div>
              </div>

              {/* The theory */}
              {results.the_theory && (
                <div className={`${c.card} border rounded-xl p-5`}>
                  <h3 className={`text-sm font-bold ${c.text} mb-2`}>🕵️ The Theory</h3>
                  <p className={`text-sm ${c.textSec} leading-relaxed whitespace-pre-line`}>{results.the_theory}</p>
                </div>
              )}

              {/* Evidence */}
              {results.evidence?.length > 0 && (
                <div className={`${c.card} border rounded-xl p-4`}>
                  <h3 className={`text-sm font-bold ${c.text} mb-3`}>📎 Evidence</h3>
                  <div className="space-y-2">
                    {results.evidence.map((e, i) => {
                      const es = evStyle(e.strength);
                      return (
                        <div key={i} className={`${c.quoteBg} rounded-lg p-3`}>
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className={`text-xs font-medium ${c.text}`}>{es.icon} {e.detail}</p>
                            <span className={`text-[8px] font-black ${c[es.color]} whitespace-nowrap`}>{e.strength}</span>
                          </div>
                          <p className={`text-[11px] ${c.textMuted}`}>→ {e.spin}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Smoking gun */}
              {results.the_smoking_gun && (
                <div className={`${c.warning} border-2 rounded-xl p-4`}>
                  <p className={`text-[10px] font-bold uppercase mb-1`}>🔫 The Smoking Gun</p>
                  <p className="text-sm font-bold">{results.the_smoking_gun}</p>
                </div>
              )}

              {/* Counterargument + Rabbit hole */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {results.counterargument && (
                  <div className={`${c.quoteBg} border ${isDark ? 'border-[#2a2a4a]' : 'border-[#d4d4d4]'} rounded-xl p-4`}>
                    <p className={`text-[10px] font-bold ${c.dangerText} uppercase mb-1`}>🤔 Counterargument</p>
                    <p className={`text-xs ${c.textSec}`}>{results.counterargument}</p>
                  </div>
                )}
                {results.rabbit_hole && (
                  <div className={`${c.quoteBg} border ${isDark ? 'border-[#2a2a4a]' : 'border-[#d4d4d4]'} rounded-xl p-4`}>
                    <p className={`text-[10px] font-bold ${c.accent} uppercase mb-1`}>🐇 Rabbit Hole</p>
                    <p className={`text-xs ${c.textSec}`}>{results.rabbit_hole}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button onClick={runGenerate} disabled={loading} className={`flex-1 ${c.btnSec} font-bold py-3 rounded-lg min-h-[44px]`}>
                  🧵 Different Theory
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Grade view */}
      {view === 'grade' && (
        <>
          <div className={`${c.card} border rounded-xl p-5`}>
            <h2 className={`text-lg font-bold mb-1`}><span className="mr-2">📝</span>Grade My Theory</h2>
            <p className={`text-sm ${c.textSec} mb-4`}>Share your fan theory — the professor will grade it</p>

            <div className="mb-3">
              <label className={`text-xs font-bold ${c.label} block mb-1.5`}>About what?</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                placeholder="Movie, show, book, or game..."
                className={`w-full px-3 py-2.5 border rounded-lg text-sm ${c.input} outline-none focus:ring-2`} />
            </div>
            <div className="mb-4">
              <label className={`text-xs font-bold ${c.label} block mb-1.5`}>Your theory</label>
              <textarea value={myTheory} onChange={e => setMyTheory(e.target.value)}
                placeholder="Share your theory... the wilder the better"
                rows={5} className={`w-full px-3 py-2.5 border rounded-lg text-sm ${c.input} outline-none focus:ring-2 resize-y`} />
            </div>

            <button onClick={runGrade} disabled={!myTheory.trim() || loading}
              className={`w-full ${c.btnPrimary} disabled:opacity-40 font-bold py-3 rounded-lg flex items-center justify-center gap-2 min-h-[48px]`}>
              {loading ? <><span className="animate-spin inline-block">⏳</span> Grading...</> : <><span>📝</span> Grade It</>}
            </button>
          </div>

          {gradeResults && (
            <div className="space-y-4">
              {/* Grade */}
              <div className={`${c.accentBg} border-2 rounded-xl p-5 text-center`}>
                <p className={`text-4xl font-black ${c.text} mb-1`}>{gradeResults.grade}</p>
                {gradeResults.grade_title && <p className={`text-sm ${c.accent} font-bold`}>{gradeResults.grade_title}</p>}
                <div className="flex justify-center gap-4 mt-3">
                  {gradeResults.plausibility && (
                    <div><span className={`text-lg font-black ${c.accent}`}>{gradeResults.plausibility}</span><span className={`text-xs ${c.textMuted}`}>/10</span><span className={`text-[9px] ${c.textMuted} block`}>plausible</span></div>
                  )}
                  {gradeResults.creativity && (
                    <div><span className={`text-lg font-black ${c.accent}`}>{gradeResults.creativity}</span><span className={`text-xs ${c.textMuted}`}>/10</span><span className={`text-[9px] ${c.textMuted} block`}>creative</span></div>
                  )}
                </div>
                {gradeResults.evidence_quality && (
                  <p className={`text-xs ${c.textMuted} mt-2`}>Evidence quality: {gradeResults.evidence_quality}</p>
                )}
              </div>

              {/* Strengths + Weaknesses */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {gradeResults.strengths?.length > 0 && (
                  <div className={`${c.success} border rounded-xl p-4`}>
                    <p className={`text-[10px] font-bold uppercase mb-2`}>✅ Strengths</p>
                    {gradeResults.strengths.map((s, i) => <p key={i} className="text-xs mb-1">• {s}</p>)}
                  </div>
                )}
                {gradeResults.weaknesses?.length > 0 && (
                  <div className={`${c.danger} border rounded-xl p-4`}>
                    <p className={`text-[10px] font-bold uppercase mb-2`}>❌ Weaknesses</p>
                    {gradeResults.weaknesses.map((w, i) => <p key={i} className="text-xs mb-1">• {w}</p>)}
                  </div>
                )}
              </div>

              {gradeResults.professor_notes && (
                <div className={`${c.card} border rounded-xl p-4`}>
                  <p className={`text-[10px] font-bold ${c.accent} uppercase mb-1`}>🎓 Professor's Notes</p>
                  <p className={`text-sm ${c.textSec} italic`}>{gradeResults.professor_notes}</p>
                </div>
              )}

              {gradeResults.would_reddit_upvote && (
                <div className={`${c.quoteBg} border ${isDark ? 'border-[#2a2a4a]' : 'border-[#d4d4d4]'} rounded-xl p-4`}>
                  <p className={`text-[10px] font-bold ${c.textMuted} uppercase mb-1`}>📊 Reddit Prediction</p>
                  <p className={`text-xs ${c.textSec}`}>{gradeResults.would_reddit_upvote}</p>
                </div>
              )}

              <CopyBtn content={`📝 Fan Theory Grade: ${gradeResults.grade} "${gradeResults.grade_title}"\n\n${gradeResults.professor_notes || ''}\n\nPlausibility: ${gradeResults.plausibility}/10 | Creativity: ${gradeResults.creativity}/10\n\n— Generated by DeftBrain · deftbrain.com`} label="Copy Report Card" />
            </div>
          )}
        </>
      )}

      {error && (
        <div className={`${c.danger} border rounded-lg p-4 flex items-start gap-3`}>
          <span>⚠️</span><p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  );
};

FanTheory.displayName = 'FanTheory';
export default FanTheory;
