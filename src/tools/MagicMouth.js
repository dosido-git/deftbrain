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
  const [whatYouWant, setWhatYouWant] = useState('');
  const [situation, setSituation] = useState('');
  const [whoYoureAsking, setWhoYoureAsking] = useState('');
  const [triedAlready, setTriedAlready] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [expandedSections, setExpandedSections] = useState({});
  const [showBackup, setShowBackup] = useState(false);

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
            Tell me what you want. I'll find the angle and write the script.
          </p>
        </div>

        {/* Input */}
        {!results && (
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
        {results && (
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
      </div>
    </div>
  );
};

MagicMouth.displayName = 'MagicMouth';
export default MagicMouth;
