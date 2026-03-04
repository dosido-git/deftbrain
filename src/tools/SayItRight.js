import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';
import { usePersistentState } from '../hooks/usePersistentState';
import { CopyBtn, ActionBar } from '../components/ActionButtons';

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
    btn:         d ? 'bg-[#2c4a6e] hover:bg-[#4a6a8a] text-white' : 'bg-[#2c4a6e] hover:bg-[#1e3a58] text-white',
    btnSec:      d ? 'bg-[#332e2a] hover:bg-[#3d3630] text-[#c8c3b9] border border-[#3d3630]' : 'bg-[#f3efe8] hover:bg-[#e8e1d5] text-[#5e5042] border border-[#d5cab8]',
    btnDis:      d ? 'bg-[#332e2a] text-[#5a544a] cursor-not-allowed' : 'bg-[#e8e1d5] text-[#8a8275] cursor-not-allowed',
    pillActive:  d ? 'border-[#4a6a8a] bg-[#2c4a6e]/30 text-[#a8b9ce]' : 'border-[#2c4a6e] bg-[#d4dde8] text-[#1e3a58]',
    pillInactive: d ? 'border-[#3d3630] text-[#8a8275] hover:border-[#5a544a]' : 'border-[#d5cab8] text-[#5a544a] hover:border-[#8a8275]',
    badge:       d ? 'bg-[#2c4a6e]/30 text-[#a8b9ce]' : 'bg-[#d4dde8] text-[#1e3a58]',
    divider:     d ? 'border-[#3d3630]' : 'border-[#e8e1d5]',
    tipBg:       d ? 'bg-[#c8872e]/10 border-[#c8872e]/30' : 'bg-[#f9edd8] border-[#c8872e]/30',
    tipText:     d ? 'text-[#d9a04e]' : 'text-[#93541f]',
    successBg:   d ? 'bg-[#5a8a5c]/10 border-[#5a8a5c]/30' : 'bg-[#e8f0e8] border-[#5a8a5c]/30',
    successText: d ? 'text-[#7aba7c]' : 'text-[#3a6a3c]',
    warnBg:      d ? 'bg-[#b54a3f]/10 border-[#b54a3f]/30' : 'bg-[#fceae8] border-[#e8a8a0]',
    warnText:    d ? 'text-[#e88880]' : 'text-[#b54a3f]',
    infoBg:      d ? 'bg-[#2c4a6e]/15 border-[#4a6a8a]/30' : 'bg-[#d4dde8]/30 border-[#2c4a6e]/15',
    infoText:    d ? 'text-[#a8b9ce]' : 'text-[#1e3a58]',
    errBg:       d ? 'bg-[#b54a3f]/15 border-[#b54a3f]/40' : 'bg-[#fceae8] border-[#e8a8a0]',
    errText:     d ? 'text-[#e88880]' : 'text-[#b54a3f]',
    histBg:      d ? 'bg-[#2c4a6e]/10 border-[#4a6a8a]/30' : 'bg-[#d4dde8]/30 border-[#2c4a6e]/15',
    histCard:    d ? 'bg-[#2a2623] border-[#3d3630]' : 'bg-white border-[#e8e1d5]',
    linkStyle:   d ? 'text-[#6e8aaa] hover:text-[#a8b9ce] underline' : 'text-[#2c4a6e] hover:text-[#1e3a58] underline',
    phonBg:      d ? 'bg-[#2c4a6e]/20 border-[#4a6a8a]/40' : 'bg-[#d4dde8]/50 border-[#2c4a6e]/20',
    ipaBg:       d ? 'bg-[#332e2a]' : 'bg-[#f3efe8]',
  };
};

// ════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════
const CATEGORIES = [
  { value: 'name',      emoji: '👤', label: 'Name',           placeholder: 'Siobhan, Nguyễn, Xiomara...' },
  { value: 'food',      emoji: '🍝', label: 'Food / Drink',   placeholder: 'Gnocchi, Pho, Gewürztraminer...' },
  { value: 'place',     emoji: '📍', label: 'Place',          placeholder: 'Reykjavik, Worcestershire...' },
  { value: 'brand',     emoji: '👗', label: 'Brand',          placeholder: 'Hermès, Givenchy, Loewe...' },
  { value: 'music_art', emoji: '🎵', label: 'Music / Art',    placeholder: 'Chopin, Caravaggio, Dvořák...' },
  { value: 'science',   emoji: '🔬', label: 'Science',        placeholder: 'Acetaminophen, Euler...' },
  { value: 'phrase',    emoji: '💬', label: 'Phrase',          placeholder: 'Schadenfreude, coup de grâce...' },
  { value: 'other',     emoji: '❓', label: 'Other',           placeholder: 'Any word you want to get right...' },
];

const LANGUAGES = [
  'English (American)', 'English (British)', 'Spanish', 'French', 'German',
  'Italian', 'Portuguese', 'Mandarin Chinese', 'Japanese', 'Korean',
  'Arabic', 'Hindi', 'Russian', 'Dutch', 'Swedish', 'Turkish', 'Polish', 'Other',
];

const EXAMPLES = [
  { word: 'Gnocchi', category: 'food' },
  { word: 'Hermès', category: 'brand' },
  { word: 'Siobhan', category: 'name' },
  { word: 'Worcestershire', category: 'place' },
  { word: 'Chopin', category: 'music_art' },
  { word: 'Schadenfreude', category: 'phrase' },
  { word: 'Quinoa', category: 'food' },
  { word: 'Dvořák', category: 'music_art' },
];

// ════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════
const SayItRight = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const c = useColors();
  const resultsRef = useRef(null);

  const [history, setHistory] = usePersistentState('say-it-right-history', []);
  const [showHistory, setShowHistory] = useState(false);

  // Input
  const [word, setWord] = useState('');
  const [category, setCategory] = useState('other');
  const [context, setContext] = useState('');
  const [nativeLang, setNativeLang] = useState('English (American)');
  const [showIPA, setShowIPA] = useState(false);

  // Batch mode
  const [batchMode, setBatchMode] = useState(false);
  const [batchWords, setBatchWords] = useState('');

  // Results
  const [results, setResults] = useState(null);
  const [batchResults, setBatchResults] = useState(null);
  const [error, setError] = useState('');
  const [expandedSections, setExpandedSections] = useState({});

  useEffect(() => {
    if ((results || batchResults) && resultsRef.current) {
      setTimeout(() => resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
    }
  }, [results, batchResults]);

  const toggleSection = useCallback((key) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] })), []);

  const activeCat = CATEGORIES.find(cat => cat.value === category) || CATEGORIES[7];

  const submit = useCallback(async () => {
    setError(''); setResults(null); setBatchResults(null);
    try {
      if (batchMode) {
        const words = batchWords.split(/[,\n]/).map(w => w.trim()).filter(Boolean);
        if (words.length < 2) { setError('Enter at least 2 words, separated by commas or newlines'); return; }
        const data = await callToolEndpoint('say-it-right/batch', { words, category, nativeLang });
        setBatchResults(data);
        words.forEach(w => {
          const entry = { id: 'sir_' + Date.now() + Math.random(), date: new Date().toISOString(), word: w, category, emoji: activeCat.emoji };
          setHistory(prev => [entry, ...prev].slice(0, 50));
        });
      } else {
        if (!word.trim()) { setError('Enter a word to pronounce'); return; }
        const data = await callToolEndpoint('say-it-right', { word: word.trim(), category, context: context.trim() || null, nativeLang });
        setResults(data);
        const entry = { id: 'sir_' + Date.now(), date: new Date().toISOString(), word: word.trim(), category, emoji: activeCat.emoji, phonetic: data?.pronunciation?.phonetic };
        setHistory(prev => [entry, ...prev].slice(0, 50));
      }
    } catch (err) { setError(err.message || 'Pronunciation guide failed.'); }
  }, [word, category, context, nativeLang, batchMode, batchWords, callToolEndpoint, setHistory, activeCat.emoji]);

  const handleReset = useCallback(() => {
    setWord(''); setContext(''); setResults(null); setBatchResults(null); setError('');
    setBatchWords(''); setExpandedSections({});
  }, []);

  const loadExample = useCallback((ex) => {
    setWord(ex.word); setCategory(ex.category);
    setResults(null); setBatchResults(null); setError(''); setBatchMode(false);
  }, []);

  const buildCopy = useCallback(() => {
    if (!results) return '';
    const p = results.pronunciation;
    const lines = [
      `🗣️ Say It Right — ${results.word}`,
      '',
      `Pronunciation: ${p?.phonetic || ''}`,
      p?.ipa ? `IPA: ${p.ipa}` : '',
      p?.syllables?.length ? `Syllables: ${p.syllables.join(' · ')}` : '',
      p?.stress ? `Stress: ${p.stress}` : '',
      p?.sounds_like ? `Sounds like: ${p.sounds_like}` : '',
      '',
      results.context_info?.what_it_is ? `What it is: ${results.context_info.what_it_is}` : '',
      results.fun_fact ? `Fun fact: ${results.fun_fact}` : '',
      '',
      '— Generated by DeftBrain · deftbrain.com',
    ].filter(Boolean);
    return lines.join('\n');
  }, [results]);

  const Pill = ({ active, onClick, children }) => (
    <button onClick={onClick} className={'px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ' + (active ? c.pillActive : c.pillInactive)}>
      {active && <span className="mr-1">✓</span>}{children}
    </button>
  );

  const Section = ({ title, emoji, sKey, defaultOpen = false, children }) => {
    const open = expandedSections[sKey] ?? defaultOpen;
    return (
      <div className={c.card + ' border rounded-xl overflow-hidden'}>
        <button onClick={() => toggleSection(sKey)} className="w-full flex items-center justify-between p-4 text-left hover:opacity-80">
          <div className="flex items-center gap-2">
            <span className="text-base">{emoji}</span>
            <span className={'text-sm font-semibold ' + c.text}>{title}</span>
          </div>
          <span className={'text-xs ' + c.textMut}>{open ? '▲' : '▼'}</span>
        </button>
        {open && <div className={'px-4 pb-4 border-t ' + c.divider}>{children}</div>}
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════
  // INPUT
  // ════════════════════════════════════════════════════════════
  const renderInput = () => (
    <div className="space-y-4">
      {/* Category picker */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {CATEGORIES.map(cat => (
          <button key={cat.value} onClick={() => setCategory(cat.value)}
            className={'flex items-center gap-1.5 px-3 py-2.5 rounded-xl border-2 transition-all flex-shrink-0 ' +
              (category === cat.value ? c.pillActive + ' border-2' : c.pillInactive)}>
            <span className="text-base">{cat.emoji}</span>
            <span className={'text-xs font-bold ' + (category === cat.value ? '' : c.textMut)}>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Word input */}
      <div className={c.card + ' border rounded-xl p-5'}>
        <div className="flex items-center justify-between mb-2">
          <label className={'text-base font-bold ' + c.text}>
            {activeCat.emoji} {batchMode ? 'Enter multiple words' : 'What do you want to say right?'}
          </label>
          <button onClick={() => { setBatchMode(!batchMode); setResults(null); setBatchResults(null); }}
            className={'text-[10px] font-bold px-2.5 py-1 rounded-lg border ' + (batchMode ? c.pillActive : c.pillInactive)}>
            {batchMode ? '✓ Batch mode' : 'Batch mode'}
          </button>
        </div>

        {batchMode ? (
          <>
            <p className={'text-xs ' + c.textMut + ' mb-3'}>Enter 2-10 words, one per line or separated by commas.</p>
            <textarea value={batchWords} onChange={e => setBatchWords(e.target.value)}
              placeholder={'e.g.,\nGnocchi\nBruschetta\nProsciutto'}
              className={'w-full h-28 p-4 border-2 rounded-xl ' + c.inputBg + ' outline-none focus:ring-2 resize-none text-sm'} />
          </>
        ) : (
          <>
            <p className={'text-xs ' + c.textMut + ' mb-3'}>We'll show you exactly how to say it, calibrated to your native language.</p>
            <input type="text" value={word} onChange={e => setWord(e.target.value)}
              placeholder={activeCat.placeholder}
              className={'w-full px-4 py-3 border-2 rounded-xl ' + c.inputBg + ' outline-none focus:ring-2 text-sm'}
              onKeyDown={e => { if (e.key === 'Enter' && word.trim()) submit(); }} />
          </>
        )}
      </div>

      {/* Options */}
      <div className={c.card + ' border rounded-xl p-5 space-y-3'}>
        <div>
          <label className={'text-xs font-bold ' + c.textSec + ' uppercase tracking-wide mb-2 block'}>🗣️ Your native language</label>
          <div className="flex flex-wrap gap-1.5">
            {LANGUAGES.slice(0, 8).map(lang => (
              <Pill key={lang} active={nativeLang === lang} onClick={() => setNativeLang(lang)}>{lang}</Pill>
            ))}
            <select value={LANGUAGES.slice(0, 8).includes(nativeLang) ? '' : nativeLang}
              onChange={e => { if (e.target.value) setNativeLang(e.target.value); }}
              className={'px-2 py-1.5 rounded-lg border text-xs ' + c.inputBg + ' outline-none'}>
              <option value="">More...</option>
              {LANGUAGES.slice(8).map(lang => <option key={lang} value={lang}>{lang}</option>)}
            </select>
          </div>
        </div>
        {!batchMode && (
          <div>
            <label className={'text-xs font-bold ' + c.textSec + ' uppercase tracking-wide mb-1 block'}>📝 Extra context (optional)</label>
            <input type="text" value={context} onChange={e => setContext(e.target.value)}
              placeholder="e.g., 'It's a coworker's name', 'Ordering at a French restaurant'"
              className={'w-full px-3 py-2 rounded-xl border text-sm ' + c.inputBg + ' outline-none'} />
          </div>
        )}
      </div>

      {/* Examples */}
      {!batchMode && (
        <div className={'p-4 rounded-xl ' + c.inset}>
          <p className={'text-xs font-bold ' + c.textMut + ' mb-2'}>💡 Try one:</p>
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLES.map((ex, i) => (
              <button key={i} onClick={() => loadExample(ex)}
                className={'px-3 py-1.5 rounded-lg border text-xs font-semibold ' + c.pillInactive}>
                {CATEGORIES.find(c2 => c2.value === ex.category)?.emoji} {ex.word}
              </button>
            ))}
          </div>
        </div>
      )}

      <button onClick={submit} disabled={loading || (!batchMode && !word.trim()) || (batchMode && !batchWords.trim())}
        className={'w-full py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all ' +
          (loading || (!batchMode && !word.trim()) || (batchMode && !batchWords.trim()) ? c.btnDis : c.btn)}>
        {loading ? <><span className="animate-spin inline-block">⏳</span> Looking it up...</>
          : <><span>🗣️</span> Say It Right</>}
      </button>
    </div>
  );

  // ════════════════════════════════════════════════════════════
  // SINGLE RESULT
  // ════════════════════════════════════════════════════════════
  const renderResult = () => {
    if (!results) return null;
    const p = results.pronunciation;
    const ctx = results.context_info;

    return (
      <div ref={resultsRef} className="space-y-4 mt-4">
        {/* Hero pronunciation */}
        <div className={'p-6 rounded-2xl border-2 ' + c.phonBg + ' text-center'}>
          <p className={'text-xs font-bold ' + c.textMut + ' uppercase mb-1'}>{results.language_of_origin || 'Pronunciation'}</p>
          <p className={'text-3xl font-black tracking-wide ' + c.text + ' mb-2'}>{results.word}</p>
          <p className={'text-xl font-bold ' + c.tipText + ' mb-1'}>{p?.phonetic}</p>
          {p?.ipa && (
            <button onClick={() => setShowIPA(!showIPA)} className={'text-xs ' + c.linkStyle}>
              {showIPA ? `IPA: ${p.ipa}` : 'Show IPA'}
            </button>
          )}
        </div>

        {/* Syllables & stress */}
        {p?.syllables?.length > 0 && (
          <div className={'p-4 rounded-xl ' + c.inset + ' flex items-center justify-center gap-1'}>
            {p.syllables.map((syl, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span className={'text-lg font-light ' + c.textMut}>·</span>}
                <span className={'text-lg font-bold px-2 py-1 rounded-lg ' +
                  (p.stress?.toLowerCase().includes(syl.toLowerCase()) || p.phonetic?.includes(syl.toUpperCase())
                    ? c.tipBg + ' ' + c.tipText : c.text)}>
                  {syl}
                </span>
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Sounds like + Mouth guide */}
        {(p?.sounds_like || p?.mouth_guide) && (
          <div className={c.card + ' border rounded-xl p-4 space-y-3'}>
            {p.sounds_like && (
              <div>
                <p className={'text-xs font-bold ' + c.textMut + ' uppercase mb-1'}>👂 Sounds like</p>
                <p className={'text-sm ' + c.text}>{p.sounds_like}</p>
              </div>
            )}
            {p.mouth_guide && (
              <div>
                <p className={'text-xs font-bold ' + c.textMut + ' uppercase mb-1'}>👄 Mouth guide</p>
                <p className={'text-sm ' + c.text}>{p.mouth_guide}</p>
              </div>
            )}
            {p.stress && (
              <div>
                <p className={'text-xs font-bold ' + c.textMut + ' uppercase mb-1'}>💪 Stress</p>
                <p className={'text-xs ' + c.textSec}>{p.stress}</p>
              </div>
            )}
          </div>
        )}

        {/* Common mistakes */}
        {results.common_mistakes?.length > 0 && (
          <Section title="Common Mistakes" emoji="❌" sKey="mistakes" defaultOpen>
            <div className="space-y-2 mt-3">
              {results.common_mistakes.map((m, i) => (
                <div key={i} className={'p-3 rounded-lg border ' + c.warnBg}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={'text-xs font-bold line-through ' + c.warnText}>{m.wrong}</span>
                    <span className={'text-xs ' + c.textMut}>→</span>
                    <span className={'text-xs font-bold ' + c.successText}>{m.fix}</span>
                  </div>
                  <p className={'text-[10px] ' + c.textSec}>{m.why}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Context info */}
        {ctx && (
          <div className={c.card + ' border rounded-xl p-4 space-y-3'}>
            {ctx.what_it_is && (
              <div>
                <p className={'text-xs font-bold ' + c.textMut + ' uppercase mb-1'}>{activeCat.emoji} What it is</p>
                <p className={'text-sm ' + c.text}>{ctx.what_it_is}</p>
              </div>
            )}
            {ctx.origin_story && (
              <div>
                <p className={'text-xs font-bold ' + c.textMut + ' uppercase mb-1'}>📖 Origin</p>
                <p className={'text-xs ' + c.textSec}>{ctx.origin_story}</p>
              </div>
            )}
            {ctx.use_in_sentence && (
              <div className={'p-3 rounded-lg ' + c.inset}>
                <p className={'text-xs font-bold ' + c.textMut + ' mb-1'}>💬 Use it in a sentence</p>
                <p className={'text-sm italic ' + c.text}>"{ctx.use_in_sentence}"</p>
              </div>
            )}
            {ctx.pro_tip && (
              <div className={'p-3 rounded-lg ' + c.tipBg}>
                <p className={'text-xs font-bold ' + c.tipText}>💡 Pro tip: {ctx.pro_tip}</p>
              </div>
            )}
          </div>
        )}

        {/* Don't confuse with */}
        {results.dont_confuse_with?.length > 0 && (
          <Section title="Don't Confuse With" emoji="⚠️" sKey="confuse">
            <div className="space-y-2 mt-3">
              {results.dont_confuse_with.map((item, i) => (
                <div key={i} className={'p-3 rounded-lg ' + c.inset}>
                  <p className={'text-xs font-bold ' + c.text}>{item.word}</p>
                  <p className={'text-[10px] ' + c.textSec}>{item.difference}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Regional variants */}
        {results.regional_variants?.length > 0 && (
          <Section title="Regional Variants" emoji="🌍" sKey="regional">
            <div className="space-y-2 mt-3">
              {results.regional_variants.map((v, i) => (
                <div key={i} className={'p-3 rounded-lg ' + c.inset}>
                  <div className="flex items-center gap-2">
                    <span className={'text-xs font-bold ' + c.text}>{v.region}</span>
                    <span className={'text-xs ' + c.tipText}>{v.pronunciation}</span>
                  </div>
                  {v.note && <p className={'text-[10px] ' + c.textMut + ' mt-0.5'}>{v.note}</p>}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Confidence script */}
        {results.confidence_script && (
          <div className={'p-4 rounded-xl border ' + c.successBg}>
            <p className={'text-xs font-bold ' + c.successText + ' mb-1'}>💬 If you're unsure in the moment</p>
            <p className={'text-sm italic ' + c.successText}>"{results.confidence_script}"</p>
          </div>
        )}

        {/* Fun fact */}
        {results.fun_fact && (
          <div className={'p-3 rounded-lg ' + c.infoBg}>
            <p className={'text-xs ' + c.infoText}>🧠 {results.fun_fact}</p>
          </div>
        )}

        <ActionBar content={buildCopy()} title={`Say It Right: ${results.word}`} />
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════
  // BATCH RESULTS
  // ════════════════════════════════════════════════════════════
  const renderBatch = () => {
    if (!batchResults?.guides?.length) return null;
    return (
      <div ref={resultsRef} className="space-y-3 mt-4">
        <p className={'text-xs font-bold ' + c.textMut + ' uppercase'}>🗣️ {batchResults.guides.length} Pronunciations</p>
        {batchResults.guides.map((g, i) => (
          <div key={i} className={c.card + ' border rounded-xl p-4'}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className={'text-lg font-bold ' + c.text}>{g.word}</p>
                <p className={'text-base font-bold ' + c.tipText}>{g.phonetic}</p>
              </div>
              {g.ipa && <span className={'text-[10px] font-mono px-2 py-0.5 rounded ' + c.ipaBg + ' ' + c.textMut}>{g.ipa}</span>}
            </div>
            {g.syllables?.length > 0 && (
              <p className={'text-xs ' + c.textSec + ' mb-1'}>{g.syllables.join(' · ')}</p>
            )}
            {g.sounds_like && <p className={'text-xs ' + c.text + ' mb-1'}>👂 {g.sounds_like}</p>}
            {g.top_mistake && (
              <div className={'p-2 rounded-lg ' + c.warnBg + ' mt-2'}>
                <p className={'text-[10px] ' + c.warnText}>❌ {g.top_mistake}</p>
              </div>
            )}
            {g.what_it_is && <p className={'text-[10px] ' + c.textMut + ' mt-1'}>{activeCat.emoji} {g.what_it_is}</p>}
            {g.fun_fact && <p className={'text-[10px] ' + c.textMut + ' mt-0.5 italic'}>🧠 {g.fun_fact}</p>}
          </div>
        ))}
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════
  // HISTORY
  // ════════════════════════════════════════════════════════════
  const renderHistory = () => {
    if (history.length === 0) return null;
    const formatDate = (iso) => { try { const d = new Date(iso); const diff = Math.floor((new Date() - d) / 86400000); return diff === 0 ? 'Today' : diff === 1 ? 'Yesterday' : diff < 7 ? diff + 'd ago' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); } catch { return ''; } };
    return (
      <div className={'mt-6 p-4 rounded-2xl border ' + c.histBg}>
        <button onClick={() => setShowHistory(!showHistory)} className="w-full flex items-center gap-2 text-left">
          <span>🗣️</span>
          <span className={'text-sm font-bold ' + c.text + ' flex-1'}>Words You've Looked Up</span>
          <span className={'text-xs ' + c.textMut}>{history.length}</span>
          <span className={'text-xs ' + c.textMut}>{showHistory ? '▲' : '▼'}</span>
        </button>
        {showHistory && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {history.map(entry => (
              <button key={entry.id}
                onClick={() => { setWord(entry.word); setCategory(entry.category); setResults(null); setBatchResults(null); setBatchMode(false); }}
                className={'px-3 py-1.5 rounded-lg border text-xs font-semibold ' + c.pillInactive}>
                {entry.emoji} {entry.word}
                {entry.phonetic && <span className={'ml-1.5 ' + c.textMut}>({entry.phonetic})</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════
  // MAIN RENDER
  // ════════════════════════════════════════════════════════════
  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div>
          <h2 className={'text-2xl font-bold ' + c.heading}>Say It Right <span className="text-xl">🗣️</span></h2>
          <p className={'text-sm ' + c.textMut}>Names, food, places, brands — never mispronounce anything again</p>
        </div>
      </div>
      {!results && !batchResults && renderInput()}
      {renderResult()}
      {renderBatch()}
      {(results || batchResults) && (
        <div className="mt-4 space-y-3">
          <div className="flex gap-2">
            <button onClick={handleReset} className={'flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 ' + c.btn}>
              <span>🗣️</span> New Word
            </button>
            <button onClick={() => { setResults(null); setBatchResults(null); setError(''); }}
              className={'flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 ' + c.btnSec}>
              <span>✏️</span> Edit Input
            </button>
          </div>
          <div className={'p-4 rounded-2xl border ' + c.card}>
            <p className={'text-xs font-bold ' + c.textMut + ' uppercase tracking-wide mb-2'}>🔗 Related Tools</p>
            <div className={'space-y-1.5 text-xs ' + c.textSec}>
              <p>Meeting someone new? <a href="/DecoderRing" target="_blank" rel="noopener noreferrer" className={c.linkStyle}>Decoder Ring</a> reads the subtext in their messages.</p>
              <p>Traveling somewhere unfamiliar? <a href="/TipOfTongue" target="_blank" rel="noopener noreferrer" className={c.linkStyle}>Tip of My Tongue</a> identifies things you can't name.</p>
            </div>
          </div>
        </div>
      )}
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

SayItRight.displayName = 'SayItRight';
export default SayItRight;
