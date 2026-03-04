import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';
import { usePersistentState } from '../hooks/usePersistentState';
import { CopyBtn } from '../components/ActionButtons';

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
    label:       d ? 'text-[#c8c3b9]'  : 'text-[#5a544a]',
    btn:         d ? 'bg-[#2c4a6e] hover:bg-[#4a6a8a] text-white' : 'bg-[#2c4a6e] hover:bg-[#1e3a58] text-white',
    btnSec:      d ? 'bg-[#332e2a] hover:bg-[#3d3630] text-[#c8c3b9] border border-[#3d3630]' : 'bg-[#f3efe8] hover:bg-[#e8e1d5] text-[#5e5042] border border-[#d5cab8]',
    btnDis:      d ? 'bg-[#332e2a] text-[#5a544a] cursor-not-allowed' : 'bg-[#e8e1d5] text-[#8a8275] cursor-not-allowed',
    pillActive:  d ? 'border-[#4a6a8a] bg-[#2c4a6e]/30 text-[#a8b9ce]' : 'border-[#2c4a6e] bg-[#d4dde8] text-[#1e3a58]',
    pillInactive: d ? 'border-[#3d3630] text-[#8a8275] hover:border-[#5a544a]' : 'border-[#d5cab8] text-[#5a544a] hover:border-[#8a8275]',
    badge:       d ? 'bg-[#2c4a6e]/30 text-[#a8b9ce]' : 'bg-[#d4dde8] text-[#1e3a58]',
    divider:     d ? 'border-[#3d3630]' : 'border-[#e8e1d5]',
    tipBg:       d ? 'bg-[#c8872e]/10 border-[#c8872e]/30' : 'bg-[#f9edd8] border-[#c8872e]/30',
    tipText:     d ? 'text-[#d9a04e]' : 'text-[#93541f]',
    errBg:       d ? 'bg-[#b54a3f]/15 border-[#b54a3f]/40' : 'bg-[#fceae8] border-[#e8a8a0]',
    errText:     d ? 'text-[#e88880]' : 'text-[#b54a3f]',
    // Confidence
    highBg:      d ? 'bg-[#5a8a5c]/10 border-[#5a8a5c]/40' : 'bg-[#e8f0e8] border-[#5a8a5c]/30',
    highText:    d ? 'text-[#7aba7c]' : 'text-[#3a6a3c]',
    medBg:       d ? 'bg-[#c8872e]/10 border-[#c8872e]/30' : 'bg-[#f9edd8] border-[#c8872e]/30',
    medText:     d ? 'text-[#d9a04e]' : 'text-[#93541f]',
    lowBg:       d ? 'bg-[#2c4a6e]/15 border-[#4a6a8a]/30' : 'bg-[#d4dde8]/30 border-[#2c4a6e]/15',
    lowText:     d ? 'text-[#a8b9ce]' : 'text-[#1e3a58]',
    histBg:      d ? 'bg-[#2c4a6e]/10 border-[#4a6a8a]/30' : 'bg-[#d4dde8]/30 border-[#2c4a6e]/15',
    histCard:    d ? 'bg-[#2a2623] border-[#3d3630]' : 'bg-white border-[#e8e1d5]',
    linkStyle:   d ? 'text-[#6e8aaa] hover:text-[#a8b9ce] underline' : 'text-[#2c4a6e] hover:text-[#1e3a58] underline',
  };
};

// ════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════
const CATEGORIES = [
  { value: 'food',    emoji: '🍝', label: 'Food / Drink',   placeholder: 'Creamy pasta, slightly smoky, crispy bits on top, had it in a tiny restaurant...', hints: 'Flavors, textures, temperature, where you ate/drank it, what cuisine it might be' },
  { value: 'music',   emoji: '🎵', label: 'Music',          placeholder: 'Chill song, female voice, piano, something about rain, heard it in a coffee shop...', hints: 'Mood, instruments, vocal style, any lyrics you remember (even wrong), era, where you heard it' },
  { value: 'film',    emoji: '🎬', label: 'Movie / Show',   placeholder: '90s movie, kid gets stuck in a board game world, kind of dark and scary, NOT Jumanji...', hints: 'Plot fragments, characters, visual style, tone, era, "similar to X but not"' },
  { value: 'product', emoji: '🧴', label: 'Product',        placeholder: 'Face cream, thick texture, green jar, smelled like eucalyptus, bought at Target...', hints: 'Packaging (color, shape, material), scent, texture, where you bought it, price range' },
  { value: 'scent',   emoji: '🕯️', label: 'Scent',          placeholder: 'Candle that smelled like old books and vanilla but not too sweet, kind of smoky...', hints: 'Sweet/woody/fresh/floral, intensity, what it reminds you of, candle/perfume/room spray' },
  { value: 'color',   emoji: '🎨', label: 'Color',          placeholder: 'That dusty sage green — not mint, not olive, more like dried herbs on a gray day...', hints: 'What it\'s NOT (too bright, too blue), what it reminds you of, warm/cool, where you saw it' },
  { value: 'place',   emoji: '📍', label: 'Place',          placeholder: 'Restaurant in Rome near the Pantheon, tiny, handmade pasta, grandma was cooking...', hints: 'City/neighborhood, vibe, specific details (decor, food, crowd), when you visited' },
  { value: 'fabric',  emoji: '👕', label: 'Fabric / Material', placeholder: 'Softest t-shirt I ever owned, slightly stretchy, heavier than normal cotton...', hints: 'How it feels (soft, crisp, silky), weight (light, heavy), stretch, what garment it was' },
  { value: 'other',   emoji: '❓', label: 'Something Else',  placeholder: 'Describe whatever you\'re trying to remember — the more sensory detail, the better...', hints: 'Any details: what it looked/felt/sounded/tasted/smelled like, when, where, what it\'s NOT' },
];

const EXAMPLES = [
  { label: 'Pasta from Rome', category: 'food', description: 'Creamy pasta with black pepper, no cream sauce though, had these crispy pork bits. Simple but incredible. Ate it near Trastevere.', whenWhere: 'Rome, 2019' },
  { label: 'Coffee shop song', category: 'music', description: 'Slow, dreamy, female voice, acoustic guitar, something about "golden" or "glow", felt like a warm blanket. Not mainstream.', whenWhere: 'Coffee shop, 2020-2021' },
  { label: 'Childhood movie', category: 'film', description: 'Animated, not Disney, a kid goes to a creepy other world through a small door. The other version of his mom has button eyes. Kind of scary for a kids movie.', notThis: 'Coraline... wait, maybe it IS Coraline? But I remember it differently.' },
  { label: 'Mystery face cream', category: 'product', description: 'Thick moisturizer, came in a round dark green jar, almost no scent, felt expensive but wasn\'t. Made my skin feel amazing for like 12 hours.', whenWhere: 'Target or CVS, around 2021' },
  { label: 'That green', category: 'color', description: 'Not mint, not sage exactly, dustier and more muted. Like if you took olive green and added gray and a tiny bit of blue. Saw it in a pottery store.', notThis: 'Not sage, not olive, not forest green' },
];

// ════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════
const TipOfTongue = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const c = useColors();
  const resultsRef = useRef(null);

  const [history, setHistory] = usePersistentState('tip-of-tongue-history', []);
  const [showHistory, setShowHistory] = useState(false);

  // Input
  const [category, setCategory] = useState('food');
  const [description, setDescription] = useState('');
  const [notThis, setNotThis] = useState('');
  const [whenWhere, setWhenWhere] = useState('');
  const [extraClues, setExtraClues] = useState('');

  // Results
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [expandedMatch, setExpandedMatch] = useState(0);

  // Refinement
  const [refineMode, setRefineMode] = useState(false);
  const [matchFeedback, setMatchFeedback] = useState({}); // { idx: 'yes' | 'close' | 'no' }
  const [refinement, setRefinement] = useState('');

  useEffect(() => {
    if (results && resultsRef.current) {
      setTimeout(() => resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
    }
  }, [results]);

  const currentCat = CATEGORIES.find(cat => cat.value === category) || CATEGORIES[0];

  const identify = useCallback(async () => {
    if (!description.trim()) { setError('Describe what you\'re trying to remember'); return; }
    setError(''); setResults(null); setRefineMode(false); setMatchFeedback({});
    try {
      const data = await callToolEndpoint('tip-of-tongue', {
        category, description: description.trim(),
        notThis: notThis.trim() || null, whenWhere: whenWhere.trim() || null,
        extraClues: extraClues.trim() || null,
      });
      setResults(data);
      setExpandedMatch(0);
      const entry = { id: 'tot_' + Date.now(), date: new Date().toISOString(), category, emoji: currentCat.emoji, description: description.trim().substring(0, 60) + '...', topMatch: data.matches?.[0]?.name };
      setHistory(prev => [entry, ...prev].slice(0, 30));
    } catch (err) { setError(err.message || 'Identification failed.'); }
  }, [category, description, notThis, whenWhere, extraClues, callToolEndpoint, currentCat.emoji, setHistory]);

  const refine = useCallback(async () => {
    if (!results?.matches?.length) return;
    const feedback = results.matches.map((m, i) => ({
      name: m.name, was_it: matchFeedback[i] || 'no',
    }));
    if (!feedback.some(f => f.was_it !== 'no') && !refinement.trim()) {
      setError('Mark at least one match as "close" or add more details'); return;
    }
    setError('');
    try {
      const data = await callToolEndpoint('tip-of-tongue/refine', {
        category, originalDescription: description.trim(),
        previousMatches: feedback, refinement: refinement.trim() || null,
      });
      setResults(data);
      setRefineMode(false); setMatchFeedback({}); setRefinement('');
      setExpandedMatch(0);
    } catch (err) { setError(err.message || 'Refinement failed.'); }
  }, [results, matchFeedback, refinement, category, description, callToolEndpoint]);

  const handleReset = useCallback(() => {
    setDescription(''); setNotThis(''); setWhenWhere(''); setExtraClues('');
    setResults(null); setError(''); setRefineMode(false); setMatchFeedback({}); setRefinement('');
  }, []);

  const loadExample = useCallback((ex) => {
    setCategory(ex.category); setDescription(ex.description);
    setNotThis(ex.notThis || ''); setWhenWhere(ex.whenWhere || '');
    setResults(null); setError('');
  }, []);

  const confBg = (conf) => conf === 'high' ? c.highBg : conf === 'medium' ? c.medBg : c.lowBg;
  const confText = (conf) => conf === 'high' ? c.highText : conf === 'medium' ? c.medText : c.lowText;
  const confBar = (pct) => Math.max(5, Math.min(100, pct || 50));

  const buildCopy = useCallback(() => {
    if (!results?.matches?.length) return '';
    const lines = [`🔍 Tip of My Tongue — ${currentCat.emoji} ${currentCat.label}`, '', `"${description}"`, ''];
    results.matches.forEach((m, i) => {
      lines.push(`${i + 1}. ${m.name} (${m.confidence_pct || '?'}% confidence)`);
      lines.push(`   ${m.why_it_fits}`);
      if (m.how_to_find) lines.push(`   → ${m.how_to_find}`);
      lines.push('');
    });
    lines.push('— Generated by DeftBrain · deftbrain.com');
    return lines.join('\n');
  }, [results, description, currentCat]);

  const Pill = ({ active, onClick, children, className = '' }) => (
    <button onClick={onClick} className={'px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ' + (active ? c.pillActive : c.pillInactive) + ' ' + className}>
      {active && <span className="mr-1">✓</span>}{children}
    </button>
  );

  // ══════════════════════════════════════════
  // INPUT
  // ══════════════════════════════════════════
  const renderInput = () => (
    <div className="space-y-4">
      {/* Category picker */}
      <div className={c.card + ' border rounded-xl p-5'}>
        <label className={'text-xs font-bold ' + c.textSec + ' uppercase tracking-wide mb-3 block'}>What are you trying to remember?</label>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
          {CATEGORIES.map(cat => (
            <button key={cat.value} onClick={() => setCategory(cat.value)}
              className={'flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all text-center ' +
                (category === cat.value ? c.pillActive + ' border-2' : c.pillInactive)}>
              <span className="text-xl">{cat.emoji}</span>
              <span className="text-[10px] font-semibold leading-tight">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div className={c.card + ' border rounded-xl p-5'}>
        <label className={'text-base font-bold ' + c.text + ' mb-1 block'}>
          {currentCat.emoji} Describe it from memory
        </label>
        <p className={'text-xs ' + c.textMut + ' mb-3'}>{currentCat.hints}</p>
        <textarea value={description} onChange={e => setDescription(e.target.value)}
          placeholder={currentCat.placeholder}
          className={'w-full h-28 p-4 border-2 rounded-xl ' + c.inputBg + ' outline-none focus:ring-2 resize-none text-sm'} />
      </div>

      {/* Context fields */}
      <div className={c.card + ' border rounded-xl p-5 space-y-3'}>
        <div>
          <label className={'text-xs font-bold ' + c.textSec + ' uppercase tracking-wide mb-1 block'}>🚫 It's definitely NOT... (optional)</label>
          <input type="text" value={notThis} onChange={e => setNotThis(e.target.value)}
            placeholder="e.g., 'Not Jumanji', 'Not sage green', 'Not Ed Sheeran'"
            className={'w-full px-4 py-2.5 rounded-xl border text-sm ' + c.inputBg + ' outline-none'} />
        </div>
        <div>
          <label className={'text-xs font-bold ' + c.textSec + ' uppercase tracking-wide mb-1 block'}>📍 When / where? (optional)</label>
          <input type="text" value={whenWhere} onChange={e => setWhenWhere(e.target.value)}
            placeholder="e.g., 'Rome 2019', 'Heard in a coffee shop around 2021', 'Bought at Target'"
            className={'w-full px-4 py-2.5 rounded-xl border text-sm ' + c.inputBg + ' outline-none'} />
        </div>
        <div>
          <label className={'text-xs font-bold ' + c.textSec + ' uppercase tracking-wide mb-1 block'}>💡 Any other clues? (optional)</label>
          <input type="text" value={extraClues} onChange={e => setExtraClues(e.target.value)}
            placeholder="e.g., 'A friend recommended it', 'Saw it on TikTok', 'It was seasonal'"
            className={'w-full px-4 py-2.5 rounded-xl border text-sm ' + c.inputBg + ' outline-none'} />
        </div>
      </div>

      {/* Examples */}
      <div className={'p-4 rounded-xl ' + c.inset}>
        <p className={'text-xs font-bold ' + c.textMut + ' mb-2'}>💡 Try an example:</p>
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLES.map((ex, i) => (
            <button key={i} onClick={() => loadExample(ex)}
              className={'px-3 py-1.5 rounded-lg border text-xs font-semibold ' + c.pillInactive}>
              {CATEGORIES.find(cat => cat.value === ex.category)?.emoji} {ex.label}
            </button>
          ))}
        </div>
      </div>

      <button onClick={identify} disabled={loading || !description.trim()}
        className={'w-full py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all ' + (loading || !description.trim() ? c.btnDis : c.btn)}>
        {loading ? <><span className="animate-spin inline-block">⏳</span> Searching memory banks...</> : <><span>🔍</span> Identify This</>}
      </button>
    </div>
  );

  // ══════════════════════════════════════════
  // RESULTS
  // ══════════════════════════════════════════
  const renderResults = () => {
    if (!results) return null;
    const matches = results.matches || [];

    return (
      <div ref={resultsRef} className="space-y-4 mt-4">
        {/* Thinking */}
        {(results.thinking || results.refined_thinking) && (
          <div className={'p-4 rounded-xl ' + c.inset}>
            <p className={'text-xs font-bold ' + c.textMut + ' mb-1'}>🧠 Reasoning</p>
            <p className={'text-sm ' + c.text}>{results.refined_thinking || results.thinking}</p>
          </div>
        )}

        {/* Matches */}
        {matches.map((m, idx) => (
          <div key={idx} className={'rounded-xl border-2 overflow-hidden transition-all ' + confBg(m.confidence)}>
            <button onClick={() => setExpandedMatch(expandedMatch === idx ? -1 : idx)}
              className="w-full text-left p-5">
              <div className="flex items-center gap-3 mb-2">
                <span className={'text-xl font-bold ' + confText(m.confidence)}>#{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className={'text-base font-bold ' + c.text + ' truncate'}>{m.name}</p>
                  <p className={'text-xs ' + c.textMut + ' mt-0.5'}>{m.confidence_pct}% confidence</p>
                </div>
                <span className={'text-xs font-bold px-2.5 py-1 rounded-full ' + confBg(m.confidence) + ' ' + confText(m.confidence)}>
                  {m.confidence === 'high' ? '🎯 Likely' : m.confidence === 'medium' ? '🤔 Maybe' : '💭 Possible'}
                </span>
              </div>
              {/* Confidence bar */}
              <div className={'w-full h-1.5 rounded-full ' + c.inset + ' overflow-hidden'}>
                <div className={'h-full rounded-full transition-all ' + (m.confidence === 'high' ? 'bg-[#5a8a5c]' : m.confidence === 'medium' ? 'bg-[#c8872e]' : 'bg-[#4a6a8a]')}
                  style={{ width: confBar(m.confidence_pct) + '%' }} />
              </div>
            </button>

            {expandedMatch === idx && (
              <div className={'px-5 pb-5 border-t ' + c.divider + ' space-y-3'}>
                {/* Why it fits */}
                <div className="mt-3">
                  <p className={'text-xs font-bold ' + c.textMut + ' uppercase mb-1'}>Why this matches</p>
                  <p className={'text-sm ' + c.text}>{m.why_it_fits}</p>
                </div>

                {/* Memory trigger */}
                {m.memory_trigger && (
                  <div className={'p-3 rounded-lg border ' + c.tipBg}>
                    <p className={'text-xs font-bold ' + c.tipText + ' mb-1'}>⚡ Memory trigger</p>
                    <p className={'text-sm ' + c.tipText}>{m.memory_trigger}</p>
                  </div>
                )}

                {/* How to verify */}
                {m.how_to_verify && (
                  <div>
                    <p className={'text-xs font-bold ' + c.textMut + ' uppercase mb-1'}>🔍 How to verify</p>
                    <p className={'text-xs ' + c.textSec}>{m.how_to_verify}</p>
                  </div>
                )}

                {/* How to find */}
                {m.how_to_find && (
                  <div className={c.cardAlt + ' border rounded-lg p-3'}>
                    <p className={'text-xs font-bold ' + c.textMut + ' uppercase mb-1'}>📍 How to find / get / recreate</p>
                    <p className={'text-sm ' + c.text}>{m.how_to_find}</p>
                  </div>
                )}

                {/* Fun fact */}
                {m.fun_fact && (
                  <p className={'text-xs ' + c.textMut + ' italic'}>💎 {m.fun_fact}</p>
                )}

                <CopyBtn content={`${m.name}\n${m.why_it_fits}\n→ ${m.how_to_find || ''}\n\n— Generated by DeftBrain · deftbrain.com`} label="Copy this match" />

                {/* Refine feedback buttons */}
                {!refineMode && (
                  <div className="flex gap-1.5">
                    <button onClick={() => { setRefineMode(true); setMatchFeedback(prev => ({ ...prev, [idx]: 'yes' })); }}
                      className={'flex-1 py-2 rounded-lg text-xs font-bold border ' + c.pillInactive + ' hover:border-[#5a8a5c]'}>
                      ✅ That's it!
                    </button>
                    <button onClick={() => { setRefineMode(true); setMatchFeedback(prev => ({ ...prev, [idx]: 'close' })); }}
                      className={'flex-1 py-2 rounded-lg text-xs font-bold border ' + c.pillInactive + ' hover:border-[#c8872e]'}>
                      🤏 Close but no
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Also try */}
        {results.also_try?.length > 0 && (
          <div className={c.card + ' border rounded-xl p-5'}>
            <p className={'text-xs font-bold ' + c.textMut + ' uppercase mb-3'}>✨ You might also like</p>
            <div className="space-y-2">
              {results.also_try.map((item, idx) => (
                <div key={idx} className={'p-3 rounded-lg ' + c.inset}>
                  <p className={'text-sm font-semibold ' + c.text}>{item.name}</p>
                  <p className={'text-xs ' + c.textSec + ' mt-0.5'}>{item.why}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Refine panel */}
        {refineMode && (
          <div className={'p-5 rounded-xl border-2 ' + c.tipBg}>
            <p className={'text-sm font-bold ' + c.tipText + ' mb-3'}>🎯 Help us narrow it down</p>
            <p className={'text-xs ' + c.textSec + ' mb-3'}>Mark each match, then add any additional detail:</p>
            <div className="space-y-2 mb-3">
              {matches.map((m, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className={'text-xs font-bold ' + c.textMut + ' w-6'}>{idx + 1}.</span>
                  <span className={'text-xs ' + c.text + ' flex-1 truncate'}>{m.name}</span>
                  {['yes', 'close', 'no'].map(val => (
                    <button key={val} onClick={() => setMatchFeedback(prev => ({ ...prev, [idx]: val }))}
                      className={'px-2 py-1 rounded-lg text-[10px] font-bold border transition-all ' +
                        (matchFeedback[idx] === val
                          ? val === 'yes' ? 'border-[#5a8a5c] bg-[#5a8a5c]/20 text-[#5a8a5c]'
                            : val === 'close' ? 'border-[#c8872e] bg-[#c8872e]/20 text-[#c8872e]'
                            : 'border-[#b54a3f] bg-[#b54a3f]/20 text-[#b54a3f]'
                          : c.pillInactive)}>
                      {val === 'yes' ? '✅' : val === 'close' ? '🤏' : '❌'}
                    </button>
                  ))}
                </div>
              ))}
            </div>
            <textarea value={refinement} onChange={e => setRefinement(e.target.value)}
              placeholder="What was close? What was off? Any new details?"
              className={'w-full h-16 p-3 border-2 rounded-xl ' + c.inputBg + ' outline-none focus:ring-2 resize-none text-sm mb-3'} />
            <div className="flex gap-2">
              <button onClick={refine} disabled={loading}
                className={'flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 ' + (loading ? c.btnDis : c.btn)}>
                {loading ? <><span className="animate-spin inline-block">⏳</span> Refining...</> : <><span>🔍</span> Try Again</>}
              </button>
              <button onClick={() => { setRefineMode(false); setMatchFeedback({}); }}
                className={'px-4 py-3 rounded-xl text-xs font-bold ' + c.btnSec}>Cancel</button>
            </div>
          </div>
        )}

        {/* If none match */}
        {results.if_none_match && !refineMode && (
          <div className={'p-4 rounded-xl ' + c.inset}>
            <p className={'text-xs font-bold ' + c.textMut + ' mb-1'}>🤷 None of these?</p>
            <p className={'text-sm ' + c.text + ' mb-2'}>{results.if_none_match}</p>
            <button onClick={() => setRefineMode(true)}
              className={'px-4 py-2 rounded-lg text-xs font-bold ' + c.btnSec}>🔍 Refine Search</button>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <div className="flex-1"><CopyBtn content={buildCopy()} label="Copy All Matches" /></div>
          <button onClick={handleReset} className={'flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 ' + c.btn}><span>🔍</span> New Search</button>
        </div>

        {/* Cross-refs */}
        <div className={'p-4 rounded-2xl border ' + c.card}>
          <p className={'text-xs font-bold ' + c.textMut + ' uppercase tracking-wide mb-2'}>🔗 Related Tools</p>
          <div className={'space-y-1.5 text-xs ' + c.textSec}>
            <p>Found a recipe to recreate? <a href="/MiseEnPlace" target="_blank" rel="noopener noreferrer" className={c.linkStyle}>Mise en Place</a> plans the cook.</p>
            <p>Trying to place a show or movie? <a href="/Bookmark" target="_blank" rel="noopener noreferrer" className={c.linkStyle}>Bookmark</a> catches you up spoiler-free.</p>
          </div>
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════
  // HISTORY
  // ══════════════════════════════════════════
  const renderHistory = () => {
    if (history.length === 0) return null;
    const formatDate = (iso) => { try { const d = new Date(iso); const diff = Math.floor((new Date() - d) / 86400000); return diff === 0 ? 'Today' : diff === 1 ? 'Yesterday' : diff < 7 ? diff + 'd ago' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); } catch { return ''; } };
    return (
      <div className={'mt-6 p-4 rounded-2xl border ' + c.histBg}>
        <button onClick={() => setShowHistory(!showHistory)} className="w-full flex items-center gap-2 text-left">
          <span>🔍</span>
          <span className={'text-sm font-bold ' + c.text + ' flex-1'}>Past Searches</span>
          <span className={'text-xs ' + c.textMut}>{history.length}</span>
          <span className={'text-xs ' + c.textMut}>{showHistory ? '▲' : '▼'}</span>
        </button>
        {showHistory && (
          <div className="mt-3 space-y-2">
            {history.map(entry => (
              <div key={entry.id} className={'rounded-xl border ' + c.histCard + ' p-3 flex items-center gap-3'}>
                <span className="text-lg">{entry.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className={'text-sm font-semibold ' + c.text + ' truncate'}>{entry.description}</div>
                  <div className={'text-xs ' + c.textMut + ' mt-0.5'}>
                    {formatDate(entry.date)}{entry.topMatch ? ` · Best match: ${entry.topMatch}` : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ══════════════════════════════════════════
  // MAIN RENDER
  // ══════════════════════════════════════════
  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div>
          <h2 className={'text-2xl font-bold ' + c.heading}>Tip of My Tongue <span className="text-xl">🔍</span></h2>
          <p className={'text-sm ' + c.textMut}>Describe it from memory — we'll figure out what it was</p>
        </div>
      </div>
      {!results && renderInput()}
      {renderResults()}
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

TipOfTongue.displayName = 'TipOfTongue';
export default TipOfTongue;
