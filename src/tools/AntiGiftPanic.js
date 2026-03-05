import React, { useState, useRef, useEffect } from 'react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';
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
const AntiGiftPanic = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const resultsRef = useRef(null);

  const c = {
    card:         isDark ? 'bg-[#1a1a2e] border-[#2a2a4a]' : 'bg-white border-[#d4d4d4]',
    cardAlt:      isDark ? 'bg-[#0f0f1e]/60'               : 'bg-[#f8f8f8]',
    input:        isDark
      ? 'bg-[#0f0f1e] border-[#2a2a4a] text-[#e8e8e8] placeholder:text-[#555] focus:border-[#c8a951] focus:ring-[#c8a951]/20'
      : 'bg-white border-[#ccc] text-[#1e3a5f] placeholder:text-[#999] focus:border-[#1e3a5f] focus:ring-[#1e3a5f]/20',
    text:         isDark ? 'text-[#e8e8e8]' : 'text-[#1e3a5f]',
    textSec:      isDark ? 'text-[#a0a0b8]' : 'text-[#4a6a8a]',
    textMuted:    isDark ? 'text-[#666680]' : 'text-[#8a8a8a]',
    label:        isDark ? 'text-[#c0c0d0]' : 'text-[#2a4a6a]',
    accent:       isDark ? 'text-[#c8a951]' : 'text-[#1e3a5f]',
    accentBg:     isDark ? 'bg-[#c8a951]/10 border-[#c8a951]/30' : 'bg-[#1e3a5f]/5 border-[#1e3a5f]/20',
    btnPrimary:   isDark ? 'bg-[#c8a951] hover:bg-[#d4b85c] text-[#1a1a2e]' : 'bg-[#1e3a5f] hover:bg-[#2a4a6f] text-white',
    btnSec:       isDark ? 'bg-[#2a2a4a] hover:bg-[#3a3a5a] text-[#e8e8e8]' : 'bg-[#f0f0f0] hover:bg-[#e0e0e0] text-[#1e3a5f]',
    chipActive:   isDark ? 'bg-[#c8a951] border-[#c8a951] text-[#1a1a2e]'    : 'bg-[#1e3a5f] border-[#1e3a5f] text-white',
    chipInactive: isDark ? 'bg-[#2a2a4a] border-[#3a3a5a] text-[#c0c0d0] hover:border-[#4a4a6a]' : 'bg-white border-[#d4d4d4] text-[#4a6a8a] hover:border-[#aaa]',
    divider:      isDark ? 'border-[#2a2a4a]' : 'border-[#e0e0e0]',
    giftCard:     isDark ? 'bg-[#1e1e38] border-[#2a2a5a]' : 'bg-[#fafbff] border-[#d8dce8]',
    warmBg:       isDark ? 'bg-[#2e2a1a] border-[#c8a951]/30' : 'bg-[#fffbf0] border-[#c8a951]/30',
    greenBg:      isDark ? 'bg-[#1a2e1a] border-[#2a4a2a]'    : 'bg-[#f0faf0] border-[#c0dcc0]',
    greenText:    isDark ? 'text-[#a0e0a0]' : 'text-[#2a5a2a]',
    alertBg:      isDark ? 'bg-[#3a1a1a] border-[#5a2a2a]'    : 'bg-[#fef2f2] border-[#e8c0c0]',
    alertText:    isDark ? 'text-[#f0a0a0]' : 'text-[#7a2a2a]',
    wildcardBg:   isDark ? 'bg-[#2a1a2e] border-[#4a2a5a]'    : 'bg-[#f8f0ff] border-[#d8c0e8]',
    wildcardText: isDark ? 'text-[#d0a0e0]' : 'text-[#5a2a6a]',
    error:        isDark ? 'bg-[#3a1a1a] border-[#5a2a2a] text-[#f0a0a0]' : 'bg-[#fef2f2] border-[#e8c0c0] text-[#7a2a2a]',
  };

  // ─── State ───
  const [recipient, setRecipient] = useState('');
  const [occasion, setOccasion] = useState('');
  const [budget, setBudget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [alreadyGiven, setAlreadyGiven] = useState('');
  const [avoid, setAvoid] = useState('');
  const [results, setResults] = useState(null);
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

      const data = await callToolEndpoint('anti-gift-panic', {
        recipient: recipient.trim(),
        occasion: occasionLabel,
        budget: budget.trim() || undefined,
        deadline: deadlineLabel,
        alreadyGiven: alreadyGiven.trim() || undefined,
        avoid: avoid.trim() || undefined,
      });
      setResults(data);
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
    let t = `🎁 ANTI-GIFT PANIC\n\n`;
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
      {!results && (
        <div className={`${c.card} border rounded-xl p-5`}>
          <div className={`mb-4 pb-3 border-b ${c.divider}`}>
            <h2 className={`text-xl font-bold ${c.text}`}>
              <span className="mr-2">🎁</span>Anti-Gift Panic
            </h2>
            <p className={`text-sm ${c.textSec}`}>Tell me about the person. I'll find a gift that feels like you spent weeks thinking about it.</p>
          </div>

          {/* Recipient */}
          <div className="mb-4">
            <label className={`text-sm font-bold ${c.label} block mb-1.5`}>
              Who's this for?
            </label>
            <textarea
              value={recipient}
              onChange={e => setRecipient(e.target.value)}
              placeholder={"Describe the person — relationship, interests, personality, anything you know.\n\ne.g., My sister, 28, graphic designer, obsessed with her cat, into thrifting and true crime podcasts. Notoriously hard to shop for."}
              rows={4}
              maxLength={800}
              className={`w-full px-3 py-2.5 border rounded-lg text-sm ${c.input} outline-none focus:ring-2 resize-none`}
            />
            <div className="flex justify-end mt-1">
              <button onClick={loadExample} className={`text-[10px] ${c.textMuted} hover:underline`}>
                🎲 Load example
              </button>
            </div>
          </div>

          {/* Occasion */}
          <div className="mb-4">
            <label className={`text-[10px] font-bold ${c.label} uppercase block mb-2`}>Occasion</label>
            <div className="flex flex-wrap gap-1.5">
              {OCCASIONS.map(o => (
                <button
                  key={o.id}
                  onClick={() => setOccasion(occasion === o.id ? '' : o.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors min-h-[32px] flex items-center gap-1 ${
                    occasion === o.id ? c.chipActive : c.chipInactive
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
              <label className={`text-[10px] font-bold ${c.label} uppercase block mb-1.5`}>Budget</label>
              <input
                type="text"
                value={budget}
                onChange={e => setBudget(e.target.value)}
                placeholder="e.g., $25-50, under $100, any"
                className={`w-full px-3 py-2 border rounded-lg text-sm ${c.input} outline-none focus:ring-2`}
              />
            </div>
            <div>
              <label className={`text-[10px] font-bold ${c.label} uppercase block mb-1.5`}>Deadline</label>
              <div className="flex flex-wrap gap-1.5">
                {DEADLINES.map(d => (
                  <button
                    key={d.id}
                    onClick={() => setDeadline(deadline === d.id ? '' : d.id)}
                    className={`px-2 py-1.5 rounded-lg text-[11px] font-medium border transition-colors ${
                      deadline === d.id ? c.chipActive : c.chipInactive
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Optional extras */}
          <details className={`mb-5 ${c.textSec}`}>
            <summary className={`text-xs font-bold cursor-pointer ${c.accent} mb-2`}>➕ Already tried / things to avoid</summary>
            <div className="space-y-3 mt-3">
              <div>
                <label className={`text-xs ${c.label} block mb-1`}>Already given or considered</label>
                <input
                  type="text"
                  value={alreadyGiven}
                  onChange={e => setAlreadyGiven(e.target.value)}
                  placeholder="e.g., Gave her a book last year, she already has an Ember mug"
                  className={`w-full px-3 py-2 border rounded-lg text-sm ${c.input} outline-none focus:ring-2`}
                />
              </div>
              <div>
                <label className={`text-xs ${c.label} block mb-1`}>Definitely avoid</label>
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

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!recipient.trim() || loading}
            className={`w-full ${c.btnPrimary} disabled:opacity-40 font-bold py-3 rounded-lg flex items-center justify-center gap-2 min-h-[48px]`}
          >
            {loading
              ? <><span className="animate-spin inline-block">⏳</span> Finding the perfect gift...</>
              : <><span>🎁</span> Find Gift Ideas</>}
          </button>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className={`${c.error} border rounded-lg p-4 flex items-start gap-3`}>
          <span className="flex-shrink-0">⚠️</span>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* ── Results ── */}
      {results && (
        <div ref={resultsRef} className="space-y-4">

          {/* Action bar */}
          <div className="flex items-center justify-between">
            <button onClick={handleReset} className={`${c.btnSec} px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5`}>
              <span>←</span> New search
            </button>
            <ActionBar content={buildFullText()} title="Anti-Gift Panic" />
          </div>

          {/* Situation read */}
          {results.situation_read && (
            <div className={`${c.warmBg} border rounded-xl p-4`}>
              <p className={`text-sm ${c.text} leading-relaxed`}>{results.situation_read}</p>
            </div>
          )}

          {/* Perfect picks */}
          {results.perfect_picks?.length > 0 && (
            <div className="space-y-3">
              <p className={`text-xs font-bold uppercase tracking-wider ${c.accent}`}>🎁 Gift ideas</p>
              {results.perfect_picks.map((pick, i) => {
                const isExpanded = expandedPick === i;
                return (
                  <div
                    key={i}
                    className={`${c.giftCard} border rounded-xl overflow-hidden transition-all duration-200 ${isExpanded ? 'ring-2 ring-[#c8a951]/30' : ''}`}
                  >
                    {/* Header — always visible */}
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

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className={`px-5 pb-5 space-y-3 border-t ${c.divider} pt-3`}>
                        {/* Why it's perfect */}
                        <div>
                          <p className={`text-[10px] font-bold uppercase ${c.label} mb-1`}>Why it's perfect for them</p>
                          <p className={`text-sm ${c.textSec} leading-relaxed`}>{pick.why_its_perfect}</p>
                        </div>

                        {/* Where to get */}
                        <div>
                          <p className={`text-[10px] font-bold uppercase ${c.label} mb-1`}>Where to get it</p>
                          <p className={`text-sm ${c.text}`}>{pick.where_to_get}</p>
                        </div>

                        {/* Presentation tip */}
                        {pick.presentation_tip && (
                          <div className={`${c.cardAlt} rounded-lg p-3`}>
                            <p className={`text-[10px] font-bold uppercase ${c.label} mb-1`}>✨ Presentation tip</p>
                            <p className={`text-xs ${c.textSec}`}>{pick.presentation_tip}</p>
                          </div>
                        )}

                        {/* Card message */}
                        {pick.card_message && (
                          <div className={`${c.warmBg} border rounded-lg p-4`}>
                            <div className="flex items-center justify-between mb-2">
                              <p className={`text-[10px] font-bold uppercase ${isDark ? 'text-[#c8a951]' : 'text-[#8a6a20]'}`}>
                                ✉️ What to write in the card
                              </p>
                              <CopyBtn
                                content={`${pick.card_message}\n\n— Generated by DeftBrain · deftbrain.com`}
                                label="Copy"
                              />
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

          {/* Wildcard */}
          {results.the_wildcard && (
            <div>
              {!showWildcard ? (
                <button
                  onClick={() => setShowWildcard(true)}
                  className={`w-full ${c.btnSec} py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2`}
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
                  <p className={`text-sm ${c.textSec} mb-3`}>{results.the_wildcard.why_its_perfect}</p>
                  <p className={`text-xs ${c.text} mb-3`}>
                    <span className={`font-bold ${c.label}`}>Where: </span>{results.the_wildcard.where_to_get}
                  </p>
                  {results.the_wildcard.card_message && (
                    <div className={`${c.warmBg} border rounded-lg p-3`}>
                      <div className="flex items-center justify-between mb-1">
                        <p className={`text-[10px] font-bold uppercase ${isDark ? 'text-[#c8a951]' : 'text-[#8a6a20]'}`}>✉️ Card</p>
                        <CopyBtn content={`${results.the_wildcard.card_message}\n\n— Generated by DeftBrain · deftbrain.com`} label="Copy" />
                      </div>
                      <p className={`text-sm italic ${c.text}`} style={{ fontFamily: 'Georgia, serif' }}>"{results.the_wildcard.card_message}"</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Last-minute save */}
          {results.if_deadline_is_now && (
            <div className={`${c.greenBg} border rounded-xl p-4`}>
              <p className={`text-xs font-bold uppercase tracking-wider ${c.greenText} mb-2 flex items-center gap-1.5`}>
                <span>⏰</span> Last-minute save
              </p>
              <p className={`text-sm font-semibold ${c.text} mb-1`}>{results.if_deadline_is_now.instant_option}</p>
              <p className={`text-xs ${c.textSec} mb-2`}>{results.if_deadline_is_now.how}</p>
              {results.if_deadline_is_now.card_message && (
                <div className="flex items-center gap-2 mt-2">
                  <p className={`text-xs italic ${c.textMuted} flex-1`}>✉️ "{results.if_deadline_is_now.card_message}"</p>
                  <CopyBtn content={`${results.if_deadline_is_now.card_message}\n\n— Generated by DeftBrain · deftbrain.com`} label="Copy" />
                </div>
              )}
            </div>
          )}

          {/* Never do this */}
          {results.never_do_this && (
            <div className={`${c.alertBg} border rounded-xl p-4 flex items-start gap-3`}>
              <span className="flex-shrink-0">⚠️</span>
              <div>
                <p className={`text-[10px] font-bold uppercase ${c.alertText} mb-1`}>Don't do this</p>
                <p className={`text-sm ${c.alertText}`}>{results.never_do_this}</p>
              </div>
            </div>
          )}

          {/* Cross-refs */}
          <div className={`${c.cardAlt} rounded-xl p-4`}>
            <p className={`text-[10px] font-bold ${c.textMuted} uppercase tracking-wider mb-2`}>Related tools</p>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'VelvetHammer', icon: '🔨', label: 'Write the card message differently' },
                { id: 'MagicMouth', icon: '🪄', label: 'Negotiate a return' },
                { id: 'BuyWise', icon: '🛒', label: 'Check if the gift is worth the price' },
              ].map(ref => (
                <a key={ref.id} href={`/tool/${ref.id}`} target="_blank" rel="noopener noreferrer"
                  className={`${c.btnSec} px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1.5`}>
                  <span>{ref.icon}</span> {ref.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

AntiGiftPanic.displayName = 'AntiGiftPanic';
export default AntiGiftPanic;
