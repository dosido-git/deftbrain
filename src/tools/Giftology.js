import React, { useState, useRef, useEffect } from 'react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';
import { usePersistentState } from '../hooks/usePersistentState';
import { CopyBtn, ActionBar } from '../components/ActionButtons';

// ════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════
const OCCASIONS = [
  { id: 'birthday',   label: 'Birthday',     icon: '🎂' },
  { id: 'holiday',    label: 'Holiday',       icon: '🎄' },
  { id: 'thankyou',   label: 'Thank You',     icon: '🙏' },
  { id: 'wedding',    label: 'Wedding',       icon: '💍' },
  { id: 'baby',       label: 'New Baby',      icon: '👶' },
  { id: 'graduation', label: 'Graduation',    icon: '🎓' },
  { id: 'housewarming', label: 'Housewarming', icon: '🏠' },
  { id: 'justbecause', label: 'Just Because', icon: '💛' },
  { id: 'apology',    label: 'Apology',       icon: '🕊️' },
  { id: 'other',      label: 'Other',         icon: '🎁' },
];

const DEADLINES = [
  { id: 'today',     label: 'Today (panic mode)' },
  { id: 'tomorrow',  label: 'Tomorrow' },
  { id: 'this-week', label: 'This week' },
  { id: 'no-rush',   label: 'No rush' },
];

const EXAMPLES = [
  'My mom, 60s, retired teacher, loves gardening and mystery novels. Practical person who says "don\'t get me anything" every year.',
  'Best friend turning 30, loves craft beer and hiking. Already has everything. Budget is tight.',
  'Boss who went above and beyond helping me this year. Professional but warm. Don\'t want it to seem like sucking up.',
  'My partner\'s parents — meeting them for the first time at dinner this weekend. They live in a small apartment.',
  'My 14-year-old nephew who I don\'t know that well. He\'s into gaming but I don\'t know which games.',
  'Coworker\'s going-away party. We\'re friendly but not close. Office is doing a group card.',
];

// ════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════
const Giftology = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const resultsRef = useRef(null);

  const c = {
    card:          isDark ? 'bg-zinc-800'       : 'bg-white',
    cardAlt:       isDark ? 'bg-zinc-700/50'    : 'bg-slate-50',
    text:          isDark ? 'text-zinc-50'      : 'text-gray-900',
    textSecondary: isDark ? 'text-zinc-300'     : 'text-gray-600',
    textMuted:     isDark ? 'text-zinc-500'     : 'text-gray-400',
    input:         isDark ? 'bg-zinc-700 border-zinc-600 text-zinc-100 placeholder-zinc-400 focus:border-cyan-500 focus:ring-cyan-500/20'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-cyan-500 focus:ring-cyan-500/20',
    btnPrimary:    isDark ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                          : 'bg-cyan-600 hover:bg-cyan-700 text-white',
    btnSecondary:  isDark ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-100'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    border:        isDark ? 'border-zinc-700'   : 'border-gray-200',
    success:       isDark ? 'bg-green-900/20 border-green-700 text-green-200'
                          : 'bg-green-50 border-green-300 text-green-800',
    warning:       isDark ? 'bg-amber-900/20 border-amber-700 text-amber-200'
                          : 'bg-amber-50 border-amber-300 text-amber-800',
    danger:        isDark ? 'bg-red-900/20 border-red-700 text-red-200'
                          : 'bg-red-50 border-red-200 text-red-800',
    info:          isDark ? 'bg-blue-900/20 border-blue-700 text-blue-200'
                          : 'bg-blue-50 border-blue-200 text-blue-800',
    pillActive:    isDark ? 'bg-cyan-600 border-cyan-600 text-white'
                          : 'bg-cyan-600 border-cyan-600 text-white',
    pillInactive:  isDark ? 'bg-zinc-700 border-zinc-600 text-zinc-300 hover:border-zinc-500'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300',
    // Tool-specific semantic slots
    warmBg:        isDark ? 'bg-amber-900/20 border-amber-700' : 'bg-amber-50 border-amber-200',
    warmText:      isDark ? 'text-amber-300'    : 'text-amber-700',
    wildcardBg:    isDark ? 'bg-purple-900/20 border-purple-700' : 'bg-purple-50 border-purple-200',
    wildcardText:  isDark ? 'text-purple-300'   : 'text-purple-700',
    giftCard:      isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-slate-50 border-gray-200',
  };

  const linkStyle = isDark
    ? 'text-cyan-400 hover:text-cyan-300 underline underline-offset-2'
    : 'text-cyan-600 hover:text-cyan-700 underline underline-offset-2';

  // ─── State ───
  const [recipient, setRecipient] = usePersistentState('giftology-recipient', '');
  const [occasion, setOccasion] = useState('');
  const [budget, setBudget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [alreadyGiven, setAlreadyGiven] = useState('');
  const [avoid, setAvoid] = useState('');
  const [results, setResults] = usePersistentState('giftology-last', null);
  const [history, setHistory] = usePersistentState('giftology-history', []);
  const [error, setError] = useState('');
  const [expandedPick, setExpandedPick] = useState(0);
  const [showWildcard, setShowWildcard] = useState(false);

  useEffect(() => {
    if (results && resultsRef.current) {
      setTimeout(() => resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }), 250);
    }
  }, [results]);

  // ─── Handlers ───
  const handleSubmit = async () => {
    if (!recipient.trim()) return;
    setError('');
    setResults(null);
    setExpandedPick(0);
    setShowWildcard(false);

    try {
      const occasionLabel = OCCASIONS.find(o => o.id === occasion)?.label || occasion || undefined;
      const deadlineLabel = DEADLINES.find(d => d.id === deadline)?.label || deadline || undefined;

      const data = await callToolEndpoint('giftology', {
        recipient: recipient.trim(),
        occasion: occasionLabel,
        budget: budget.trim() || undefined,
        deadline: deadlineLabel,
        alreadyGiven: alreadyGiven.trim() || undefined,
        avoid: avoid.trim() || undefined,
      });
      setResults(data);
      const newEntry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        preview: recipient.trim().slice(0, 40),
        result: data,
      };
      setHistory(prev => [newEntry, ...(prev || [])].slice(0, 6));
    } catch (err) {
      setError(err.message || 'Gift search failed.');
    }
  };

  const handleReset = () => {
    setRecipient('');
    setOccasion('');
    setBudget('');
    setDeadline('');
    setAlreadyGiven('');
    setAvoid('');
    setResults(null);
    setError('');
    setShowWildcard(false);
  };

  const loadExample = () => {
    const ex = EXAMPLES[Math.floor(Math.random() * EXAMPLES.length)];
    setRecipient(ex);
  };

  // ─── Build text ───
  const buildFullText = () => {
    if (!results) return '';
    const r = results;
    let t = `🎁 GIFTOLOGY\n\n`;
    if (r.situation_read) t += `${r.situation_read}\n\n`;

    if (r.perfect_picks?.length) {
      t += `━━ GIFT IDEAS ━━\n\n`;
      r.perfect_picks.forEach((p, i) => {
        t += `${i + 1}. ${p.gift} (${p.price_range})\n`;
        t += `   Why: ${p.why_its_perfect}\n`;
        t += `   Where: ${p.where_to_get}\n`;
        if (p.presentation_tip) t += `   Tip: ${p.presentation_tip}\n`;
        t += `   Card: "${p.card_message}"\n\n`;
      });
    }

    if (r.the_wildcard) {
      t += `━━ WILDCARD ━━\n`;
      t += `${r.the_wildcard.gift} (${r.the_wildcard.price_range})\n`;
      t += `${r.the_wildcard.why_its_perfect}\n`;
      t += `Card: "${r.the_wildcard.card_message}"\n\n`;
    }

    if (r.if_deadline_is_now) {
      t += `━━ LAST-MINUTE SAVE ━━\n`;
      t += `${r.if_deadline_is_now.instant_option}\n`;
      t += `${r.if_deadline_is_now.how}\n\n`;
    }

    if (r.never_do_this) t += `⚠️ Don't: ${r.never_do_this}\n\n`;

    t += `— Generated by DeftBrain · deftbrain.com`;
    return t;
  };

  // ════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════
  return (
    <div className={`space-y-4 ${c.text}`}>

      {/* ── Input ── */}
      <div className={`${c.card} border ${c.border} rounded-xl shadow-lg p-5`}>
        <div className={`mb-4 pb-3 border-b ${c.border}`}>
          <h2 className={`text-xl font-bold ${c.text} flex items-center gap-2`}>
            <span>🎁</span> Giftology
          </h2>
          <p className={`text-sm ${c.textSecondary}`}>Tell me about the person. I'll find a gift that feels like you spent weeks on it.</p>
        </div>

        {/* Recipient */}
        <div className="mb-4">
          <label className={`text-xs font-bold ${c.textSecondary} block mb-1.5`}>
            Who's this for? <span className="text-zinc-400">*</span>
          </label>
          <textarea
            value={recipient}
            onChange={e => setRecipient(e.target.value)}
            onKeyDown={e => (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) && recipient.trim() && handleSubmit()}
            placeholder={"Describe the person — relationship, interests, personality, anything you know.\n\ne.g., My sister, 28, graphic designer, obsessed with her cat, into thrifting and true crime podcasts. Notoriously hard to shop for."}
            rows={4}
            maxLength={800}
            className={`w-full px-3 py-2.5 border rounded-lg text-sm ${c.input} outline-none focus:ring-2 resize-none`}
          />
          <div className="flex justify-between mt-1">
            <span className={`text-[10px] ${c.textMuted}`}>Ctrl/Cmd+Enter to submit</span>
            <button onClick={loadExample} className={`text-[10px] ${c.textMuted} hover:underline`}>
              🎲 Load example
            </button>
          </div>
        </div>

        {/* Occasion */}
        <div className="mb-4">
          <label className={`text-[10px] font-bold ${c.textSecondary} uppercase block mb-2`}>Occasion</label>
          <div className="flex flex-wrap gap-1.5">
            {OCCASIONS.map(o => (
              <button
                key={o.id}
                onClick={() => setOccasion(occasion === o.id ? '' : o.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors min-h-[32px] flex items-center gap-1 ${
                  occasion === o.id ? c.pillActive : c.pillInactive
                }`}
              >
                <span>{o.icon}</span> {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* Budget + Deadline row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div>
            <label className={`text-[10px] font-bold ${c.textSecondary} uppercase block mb-1.5`}>Budget</label>
            <input
              type="text"
              value={budget}
              onChange={e => setBudget(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && recipient.trim() && handleSubmit()}
              placeholder="e.g., $25-50, under $100, any"
              className={`w-full px-3 py-2 border rounded-lg text-sm ${c.input} outline-none focus:ring-2`}
            />
          </div>
          <div>
            <label className={`text-[10px] font-bold ${c.textSecondary} uppercase block mb-1.5`}>Deadline</label>
            <div className="flex flex-wrap gap-1.5">
              {DEADLINES.map(d => (
                <button
                  key={d.id}
                  onClick={() => setDeadline(deadline === d.id ? '' : d.id)}
                  className={`px-2 py-1.5 rounded-lg text-[11px] font-medium border transition-colors ${
                    deadline === d.id ? c.pillActive : c.pillInactive
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Optional extras */}
        <details className="mb-5">
          <summary className={`text-xs font-bold cursor-pointer ${c.textSecondary} mb-2`}>➕ Already tried / things to avoid</summary>
          <div className="space-y-3 mt-3">
            <div>
              <label className={`text-xs ${c.textSecondary} block mb-1`}>Already given or considered</label>
              <input
                type="text"
                value={alreadyGiven}
                onChange={e => setAlreadyGiven(e.target.value)}
                placeholder="e.g., Gave her a book last year, she already has an Ember mug"
                className={`w-full px-3 py-2 border rounded-lg text-sm ${c.input} outline-none focus:ring-2`}
              />
            </div>
            <div>
              <label className={`text-xs ${c.textSecondary} block mb-1`}>Definitely avoid</label>
              <input
                type="text"
                value={avoid}
                onChange={e => setAvoid(e.target.value)}
                placeholder="e.g., No candles (she has too many), nothing too personal"
                className={`w-full px-3 py-2 border rounded-lg text-sm ${c.input} outline-none focus:ring-2`}
              />
            </div>
          </div>
        </details>

        <p className={`text-xs text-center ${c.textMuted} mb-3`}>
          Buying something pricey?{' '}
          <a href="/BuyWise" className={linkStyle}>Buy Wise</a>{' '}
          checks if it's worth the price first.
        </p>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!recipient.trim() || loading}
          className={`w-full ${c.btnPrimary} disabled:opacity-40 font-bold py-3 rounded-lg flex items-center justify-center gap-2 min-h-[48px]`}
        >
          {loading
            ? <><span className="animate-spin inline-block">🎁</span> Finding the perfect gift...</>
            : <><span>🎁</span> Find Gift Ideas</>}
        </button>
      </div>

      {error && (
        <div className={`${c.danger} border rounded-lg p-4 flex items-start gap-3`}>
          <span className="flex-shrink-0">⚠️</span>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {results && (
        <div ref={resultsRef} className="space-y-4">

          {/* Action bar */}
          <div className="flex items-center justify-between gap-2">
            <button onClick={handleReset} className={`${c.btnSecondary} px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1.5 min-h-[40px]`}>
              ↩ Start Over
            </button>
            <ActionBar content={buildFullText()} title="Giftology" />
          </div>

          {/* Situation read */}
          {results.situation_read && (
            <div className={`${c.warmBg} border rounded-xl p-4`}>
              <p className={`text-sm ${c.text} leading-relaxed`}>{results.situation_read}</p>
            </div>
          )}

          {results.perfect_picks?.length > 0 && (
            <div className="space-y-3">
              <p className={`text-xs font-bold uppercase tracking-wider ${c.textSecondary}`}>🎁 Gift ideas</p>
              {results.perfect_picks.map((pick, i) => {
                const isExpanded = expandedPick === i;
                return (
                  <div key={i} className={`${c.giftCard} border rounded-xl overflow-hidden transition-all duration-200`}>
                    <button
                      onClick={() => setExpandedPick(isExpanded ? -1 : i)}
                      className="w-full text-left px-5 py-4 flex items-start justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-bold ${c.textMuted}`}>#{i + 1}</span>
                          <h3 className={`text-sm font-bold ${c.text} truncate`}>{pick.gift}</h3>
                        </div>
                        <p className={`text-xs ${c.textMuted}`}>{pick.price_range}</p>
                      </div>
                      <span className={`text-xs ${c.textMuted} flex-shrink-0 mt-1`}>
                        {isExpanded ? '▲' : '▼'}
                      </span>
                    </button>

                    {isExpanded && (
                      <div className={`px-5 pb-5 space-y-3 border-t ${c.border} pt-3`}>
                        <div>
                          <p className={`text-[10px] font-bold uppercase ${c.textSecondary} mb-1`}>Why it's perfect for them</p>
                          <p className={`text-sm ${c.textSecondary} leading-relaxed`}>{pick.why_its_perfect}</p>
                        </div>
                        <div>
                          <p className={`text-[10px] font-bold uppercase ${c.textSecondary} mb-1`}>Where to get it</p>
                          <p className={`text-sm ${c.text}`}>{pick.where_to_get}</p>
                        </div>
                        {pick.presentation_tip && (
                          <div className={`${c.cardAlt} rounded-lg p-3`}>
                            <p className={`text-[10px] font-bold uppercase ${c.textSecondary} mb-1`}>✨ Presentation tip</p>
                            <p className={`text-xs ${c.textSecondary}`}>{pick.presentation_tip}</p>
                          </div>
                        )}
                        {pick.card_message && (
                          <div className={`${c.warmBg} border rounded-lg p-4`}>
                            <div className="flex items-center justify-between mb-2">
                              <p className={`text-[10px] font-bold uppercase ${c.warmText}`}>✉️ What to write in the card</p>
                              <CopyBtn content={`${pick.card_message}\n\n— Generated by DeftBrain · deftbrain.com`} label="Copy" />
                            </div>
                            <p className={`text-sm italic ${c.text} leading-relaxed`} style={{ fontFamily: 'Georgia, serif' }}>
                              "{pick.card_message}"
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {results.the_wildcard && (
            <div>
              {!showWildcard ? (
                <button
                  onClick={() => setShowWildcard(true)}
                  className={`w-full ${c.btnSecondary} py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2`}
                >
                  <span>🃏</span> Show the wildcard option
                </button>
              ) : (
                <div className={`${c.wildcardBg} border rounded-xl p-5`}>
                  <p className={`text-xs font-bold uppercase tracking-wider ${c.wildcardText} mb-2 flex items-center gap-1.5`}>
                    <span>🃏</span> The wildcard
                  </p>
                  <h3 className={`text-base font-bold ${c.text} mb-1`}>{results.the_wildcard.gift}</h3>
                  <p className={`text-xs ${c.textMuted} mb-2`}>{results.the_wildcard.price_range}</p>
                  <p className={`text-sm ${c.textSecondary} mb-3`}>{results.the_wildcard.why_its_perfect}</p>
                  <p className={`text-xs ${c.text} mb-3`}>
                    <span className={`font-bold ${c.textSecondary}`}>Where: </span>{results.the_wildcard.where_to_get}
                  </p>
                  {results.the_wildcard.card_message && (
                    <div className={`${c.warmBg} border rounded-lg p-3`}>
                      <div className="flex items-center justify-between mb-1">
                        <p className={`text-[10px] font-bold uppercase ${c.warmText}`}>✉️ Card</p>
                        <CopyBtn content={`${results.the_wildcard.card_message}\n\n— Generated by DeftBrain · deftbrain.com`} label="Copy" />
                      </div>
                      <p className={`text-sm italic ${c.text}`} style={{ fontFamily: 'Georgia, serif' }}>"{results.the_wildcard.card_message}"</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {results.if_deadline_is_now && (
            <div className={`${c.success} border rounded-xl p-4`}>
              <p className={`text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5`}>
                <span>⏰</span> Last-minute save
              </p>
              <p className={`text-sm font-semibold ${c.text} mb-1`}>{results.if_deadline_is_now.instant_option}</p>
              <p className={`text-xs mb-2`}>{results.if_deadline_is_now.how}</p>
              {results.if_deadline_is_now.card_message && (
                <div className="flex items-center gap-2 mt-2">
                  <p className={`text-xs italic flex-1`}>✉️ "{results.if_deadline_is_now.card_message}"</p>
                  <CopyBtn content={`${results.if_deadline_is_now.card_message}\n\n— Generated by DeftBrain · deftbrain.com`} label="Copy" />
                </div>
              )}
            </div>
          )}

          {results.never_do_this && (
            <div className={`${c.danger} border rounded-xl p-4 flex items-start gap-3`}>
              <span className="flex-shrink-0">⚠️</span>
              <div>
                <p className={`text-[10px] font-bold uppercase mb-1`}>Don't do this</p>
                <p className="text-sm">{results.never_do_this}</p>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <p className={`text-xs text-center ${c.textMuted}`}>
              Need help writing the card?{' '}
              <a href="/VelvetHammer" className={linkStyle}>Velvet Hammer</a>{' '}
              crafts messages that land perfectly.
            </p>
            {results.perfect_picks?.some(p => p.price_range?.includes('$1') || p.price_range?.includes('$2')) && (
              <p className={`text-xs text-center ${c.textMuted}`}>
                Spending more than expected?{' '}
                <a href="/BuyWise" className={linkStyle}>Buy Wise</a>{' '}
                checks if it's really worth it.
              </p>
            )}
          </div>
        </div>
      )}

      {history?.length > 0 && (
        <div className={`${c.card} border ${c.border} rounded-xl p-4`}>
          <h3 className={`text-sm font-bold ${c.text} mb-3`}>🕐 Recent Gift Searches</h3>
          <div className="space-y-1.5">
            {history.map(entry => (
              <button key={entry.id}
                onClick={() => setResults(entry.result)}
                className={`w-full text-left px-3 py-2 rounded-lg ${c.btnSecondary} text-xs flex items-center gap-2`}>
                <span className={c.textMuted}>
                  {new Date(entry.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                </span>
                <span className={c.text}>{entry.preview}{entry.preview.length >= 40 ? '…' : ''}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

Giftology.displayName = 'Giftology';
export default Giftology;
