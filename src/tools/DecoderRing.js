import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';
import { usePersistentState } from '../hooks/usePersistentState';
import { CopyBtn, ActionBar } from '../components/ActionButtons';

// ════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════
const SOURCE_OPTIONS = [
  { value: 'text', label: '📱 Text message' },
  { value: 'email', label: '📧 Email' },
  { value: 'slack', label: '💬 Slack/Teams' },
  { value: 'social', label: '🌐 Social media' },
  { value: 'in-person', label: '🗣️ In-person (paraphrased)' },
  { value: 'letter', label: '📝 Letter/formal' },
  { value: 'dating', label: '💕 Dating app' },
  { value: 'other', label: '💬 Other' },
];

const RELATIONSHIP_OPTIONS = [
  { value: 'boss', label: '👔 Boss/Manager' },
  { value: 'coworker', label: '🤝 Coworker' },
  { value: 'client', label: '💼 Client' },
  { value: 'partner', label: '💕 Partner/Spouse' },
  { value: 'ex', label: '💔 Ex' },
  { value: 'friend', label: '🫂 Friend' },
  { value: 'family', label: '👨‍👩‍👧 Family' },
  { value: 'crush', label: '🦋 Crush/New person' },
  { value: 'landlord', label: '🏠 Landlord' },
  { value: 'stranger', label: '👤 Stranger/Unknown' },
];

const EXAMPLE_MESSAGE = `Hey! So I was thinking about what you said the other day and I totally get where you're coming from. I just think maybe we should take some time to think about things separately, you know? No pressure at all, whenever you're ready to talk. Or not! Totally fine either way 😊`;

const TECHNIQUE_EMOJIS = {
  'passive aggression': '😤',
  'hedging': '🌫️',
  'guilt trip': '😔',
  'genuine warmth': '💛',
  'power move': '👑',
  'non-answer': '🤷',
  'emotional bid': '🫴',
  'deflection': '↩️',
  'boundary setting': '🛡️',
  'sarcasm': '🙃',
  'love bombing': '💐',
  'minimizing': '📉',
};

// ════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════
const DecoderRing = ({ tool }) => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const { isDark } = useTheme();
  const resultsRef = useRef(null);

  const c = {
    // Standard keys
    card:          isDark ? 'bg-zinc-800' : 'bg-white',
    cardAlt:       isDark ? 'bg-zinc-700/50' : 'bg-slate-50',
    text:          isDark ? 'text-zinc-50' : 'text-gray-900',
    textSecondary: isDark ? 'text-zinc-300' : 'text-gray-600',
    textMuted:     isDark ? 'text-zinc-500' : 'text-gray-400',
    input:         isDark ? 'bg-zinc-700 border-zinc-600 text-zinc-100 placeholder-zinc-400 focus:border-cyan-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-cyan-500',
    btnPrimary:    isDark ? 'bg-cyan-600 hover:bg-cyan-500 text-white' : 'bg-cyan-600 hover:bg-cyan-700 text-white',
    btnSecondary:  isDark ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    border:        isDark ? 'border-zinc-700' : 'border-gray-200',
    success:       isDark ? 'bg-green-900/20 border-green-700 text-green-200' : 'bg-green-50 border-green-300 text-green-800',
    warning:       isDark ? 'bg-amber-900/20 border-amber-700 text-amber-200' : 'bg-amber-50 border-amber-300 text-amber-800',
    danger:        isDark ? 'bg-red-900/20 border-red-700 text-red-200' : 'bg-red-50 border-red-200 text-red-800',
    // Bespoke tool-specific keys
    btnDis:        isDark ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed',
    btnGhost:      isDark ? 'text-zinc-500 hover:text-zinc-100' : 'text-gray-400 hover:text-gray-700',
    btnGhostDel:   isDark ? 'text-zinc-500 hover:text-red-400' : 'text-gray-400 hover:text-red-500',
    pillActive:    isDark ? 'border-cyan-500 bg-cyan-900/30 text-cyan-300' : 'border-cyan-600 bg-cyan-50 text-cyan-800',
    pillInactive:  isDark ? 'border-zinc-600 text-zinc-400 hover:border-zinc-500' : 'border-gray-200 text-gray-500 hover:border-gray-400',
    badge:         isDark ? 'bg-cyan-900/30 text-cyan-300' : 'bg-cyan-50 text-cyan-800',
    inset:         isDark ? 'bg-zinc-900/40' : 'bg-slate-50',
    // Decoded layers
    surfaceBg:     isDark ? 'bg-zinc-700/50' : 'bg-slate-100',
    subtextBg:     isDark ? 'bg-cyan-900/15 border-cyan-700/30' : 'bg-cyan-50/40 border-cyan-200/50',
    subtextText:   isDark ? 'text-cyan-300' : 'text-cyan-800',
    // Flags
    redFlagBg:     isDark ? 'bg-red-900/10 border-red-700/30' : 'bg-red-50 border-red-200',
    redFlagText:   isDark ? 'text-red-300' : 'text-red-700',
    greenFlagBg:   isDark ? 'bg-green-900/10 border-green-700/30' : 'bg-green-50 border-green-200',
    greenFlagText: isDark ? 'text-green-300' : 'text-green-700',
    // Emotion
    emotionBg:     isDark ? 'bg-amber-900/20 border-amber-700/40' : 'bg-amber-50 border-amber-200',
    emotionText:   isDark ? 'text-amber-300' : 'text-amber-800',
    // Tone bars
    barBg:         isDark ? 'bg-zinc-700' : 'bg-gray-200',
    barCyan:       'bg-cyan-500',
    barAmber:      'bg-amber-500',
    barRed:        'bg-red-500',
    barGreen:      'bg-green-500',
    // Translation highlight
    transBg:       isDark ? 'bg-amber-900/20 border-amber-700/40' : 'bg-amber-50 border-amber-300',
    transText:     isDark ? 'text-amber-300' : 'text-amber-800',
    // History
    histBg:        isDark ? 'bg-zinc-800/60 border-zinc-700' : 'bg-slate-50 border-gray-200',
    histAccent:    isDark ? 'text-cyan-400' : 'text-cyan-700',
  };

  const linkStyle = isDark
    ? 'text-cyan-400 hover:text-cyan-300 underline underline-offset-2'
    : 'text-cyan-600 hover:text-cyan-700 underline underline-offset-2';

  // Persistent
  const [history, setHistory] = usePersistentState('decoder-ring-history', []);
  const [showHistory, setShowHistory] = useState(false);

  // Input
  const [message, setMessage] = usePersistentState('decoder-ring-message', '');
  const [source, setSource] = useState('');
  const [relationship, setRelationship] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');

  // Results
  const [results, setResults] = usePersistentState('decoder-ring-results', null);
  const [error, setError] = useState('');

  // Sections
  const [showLayers, setShowLayers] = useState(true);
  const [showStrategies, setShowStrategies] = useState(true);
  const [showFlags, setShowFlags] = useState(false);

  // Scroll to results
  useEffect(() => {
    if (results && resultsRef.current) {
      setTimeout(() => resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
    }
  }, [results]);

  // ══════════════════════════════════════════
  // HANDLERS
  // ══════════════════════════════════════════
  const decode = useCallback(async () => {
    if (!message.trim()) { setError('Paste the message you want decoded'); return; }
    setError(''); setResults(null);
    try {
      const data = await callToolEndpoint('decoder-ring', {
        message: message.trim(),
        source: source || null,
        relationship: relationship || null,
        additionalContext: additionalContext.trim() || null,
      });
      setResults(data);
      saveToHistory(data);
    } catch (err) {
      setError(err.message || 'Failed to decode message.');
    }
  }, [message, source, relationship, additionalContext, callToolEndpoint]);

  const handleReset = useCallback(() => {
    setMessage(''); setSource(''); setRelationship('');
    setAdditionalContext(''); setResults(null); setError('');
  }, []);

  // ══════════════════════════════════════════
  // HISTORY
  // ══════════════════════════════════════════
  const saveToHistory = useCallback((data) => {
    const entry = {
      id: `dr_${Date.now()}`, date: new Date().toISOString(),
      preview: message.trim().slice(0, 40),
      emotion: data.emotional_undercurrent?.primary_emotion || '',
      result: data,
    };
    setHistory(prev => [entry, ...prev].slice(0, 5));
  }, [message, setHistory]);

  const loadFromHistory = useCallback((entry) => {
    setResults(entry.result); setShowHistory(false);
  }, []);

  // ══════════════════════════════════════════
  // COPY
  // ══════════════════════════════════════════
  const buildFullCopy = useCallback(() => {
    if (!results) return '';
    const lines = ['🔍 Decoder Ring Analysis', ''];
    if (results.overall_translation) lines.push('TRANSLATION:', results.overall_translation, '');
    if (results.emotional_undercurrent) {
      lines.push(`EMOTIONAL READ: ${results.emotional_undercurrent.primary_emotion} (${results.emotional_undercurrent.intensity})`);
      lines.push(results.emotional_undercurrent.summary, '');
    }
    if (results.what_they_want) lines.push('WHAT THEY WANT:', results.what_they_want, '');
    if (results.response_strategies?.length) {
      lines.push('RESPONSE STRATEGIES:');
      results.response_strategies.forEach((s, i) => {
        lines.push(`${i + 1}. ${s.approach}: ${s.example}`);
      });
      lines.push('');
    }
    lines.push('— Generated by DeftBrain · deftbrain.com');
    return lines.join('\n');
  }, [results]);

  // ══════════════════════════════════════════
  // RENDER: Pills
  // ══════════════════════════════════════════
  const Pill = ({ active, onClick, children }) => (
    <button onClick={onClick}
      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${active ? c.pillActive : c.pillInactive}`}>
      {active && <span className="mr-1">✓</span>}
      {children}
    </button>
  );

  // Collapsible
  const Section = ({ title, emoji, open, onToggle, badge, children }) => (
    <div className={`${c.card} border rounded-xl overflow-hidden`}>
      <button onClick={onToggle} className="w-full flex items-center justify-between p-5 text-left hover:opacity-80 transition-opacity">
        <div className="flex items-center gap-3">
          <span className="text-lg">{emoji}</span>
          <span className={`text-base font-semibold ${c.text}`}>{title}</span>
          {badge && <span className={`text-xs px-2 py-0.5 rounded-full ${c.badge}`}>{badge}</span>}
        </div>
        <span className={`text-xs ${c.textMuted}`}>{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className={`px-5 pb-5 border-t ${c.border}`}>{children}</div>}
    </div>
  );

  // Score bar
  const ScoreBar = ({ label, value, max = 10, color = 'navy' }) => {
    const barColor = color === 'gold' ? c.barAmber : color === 'red' ? c.barRed : color === 'green' ? c.barGreen : c.barCyan;
    return (
      <div className="flex items-center gap-3">
        <span className={`text-xs font-medium ${c.textMuted} w-24 shrink-0`}>{label}</span>
        <div className={`flex-1 h-2 rounded-full ${c.barBg}`}>
          <div className={`h-2 rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${(value / max) * 100}%` }} />
        </div>
        <span className={`text-xs font-mono ${c.textMuted} w-6 text-right`}>{value}</span>
      </div>
    );
  };

  // ══════════════════════════════════════════
  // RENDER: Input
  // ══════════════════════════════════════════
  const renderInput = () => (
    <div className="space-y-4">
      {/* Message */}
      <div className={`${c.card} border rounded-xl p-5`}>
        <div className="flex items-center justify-between mb-1">
          <label className={`text-base font-bold ${c.text}`}>Paste the message</label>
          <button onClick={() => setMessage(EXAMPLE_MESSAGE)} className={`text-xs ${linkStyle}`}>Try example</button>
        </div>
        <p className={`text-sm ${c.textMuted} mb-4`}>What did they send you? Paste the exact message — tone and wording matter.</p>
        <textarea value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && message.trim()) decode(); }}
          placeholder="Paste the confusing text, email, DM, or message here..."
          className={`w-full h-32 p-4 border-2 rounded-xl ${c.input} outline-none focus:ring-2 resize-none text-base`} />
        <span className={`text-xs ${c.textMuted} mt-2 block`}>{message.length} characters</span>
      </div>

      {/* Source */}
      <div className={`${c.card} border rounded-xl p-5`}>
        <label className={`text-xs font-bold ${c.textSecondary} uppercase tracking-wide mb-2 block`}>📬 Where did this come from?</label>
        <div className="flex flex-wrap gap-1.5">
          {SOURCE_OPTIONS.map(opt => (
            <Pill key={opt.value} active={source === opt.value}
              onClick={() => setSource(source === opt.value ? '' : opt.value)}>
              {opt.label}
            </Pill>
          ))}
        </div>
      </div>

      {/* Relationship */}
      <div className={`${c.card} border rounded-xl p-5`}>
        <label className={`text-xs font-bold ${c.textSecondary} uppercase tracking-wide mb-2 block`}>👤 Who sent it?</label>
        <div className="flex flex-wrap gap-1.5">
          {RELATIONSHIP_OPTIONS.map(opt => (
            <Pill key={opt.value} active={relationship === opt.value}
              onClick={() => setRelationship(relationship === opt.value ? '' : opt.value)}>
              {opt.label}
            </Pill>
          ))}
        </div>
      </div>

      {/* Context */}
      <div className={`${c.card} border rounded-xl p-5`}>
        <label className={`text-xs font-bold ${c.textSecondary} uppercase tracking-wide mb-1 block`}>💬 Backstory</label>
        <p className={`text-xs ${c.textMuted} mb-2`}>Optional — helps decode ambiguous messages more accurately</p>
        <input type="text" value={additionalContext} onChange={e => setAdditionalContext(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && message.trim()) decode(); }}
          placeholder="e.g., 'We had an argument yesterday' or 'This is my new manager'"
          className={`w-full px-4 py-2.5 rounded-xl border text-sm ${c.input} outline-none`} />
      </div>

      {/* Decode button */}
      <button onClick={decode}
        disabled={loading || !message.trim()}
        className={`w-full py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
          loading || !message.trim() ? c.btnDis : c.btnPrimary
        }`}>
        {loading ? <><span className="animate-spin inline-block">{tool?.icon ?? '🔍'}</span> Decoding...</>
          : <><span>{tool?.icon ?? '🔍'}</span> Decode This Message</>}
      </button>
    </div>
  );

  // ══════════════════════════════════════════
  // RENDER: Results
  // ══════════════════════════════════════════
  const renderResults = () => {
    if (!results) return null;

    return (
      <div ref={resultsRef} className="space-y-4 mt-4">
        <ActionBar content={buildFullCopy()} title="Decoder Ring Analysis" />
        {/* Overall Translation — the headline */}
        {results.overall_translation && (
          <div className={`p-5 rounded-2xl border-2 ${c.transBg}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🔑</span>
              <span className={`text-sm font-bold ${c.transText}`}>What they actually mean</span>
            </div>
            <p className={`text-base leading-relaxed ${c.text}`}>{results.overall_translation}</p>
          </div>
        )}

        {/* What they want */}
        {results.what_they_want && (
          <div className={`p-4 rounded-xl ${c.inset}`}>
            <p className={`text-xs font-bold ${c.textMuted} mb-1`}>🎯 What they want from you</p>
            <p className={`text-sm ${c.text}`}>{results.what_they_want}</p>
          </div>
        )}

        {/* Emotional undercurrent */}
        {results.emotional_undercurrent && (
          <div className={`p-5 rounded-2xl border ${c.emotionBg}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">💭</span>
              <span className={`text-sm font-bold ${c.emotionText}`}>Emotional undercurrent</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${c.badge}`}>
                {results.emotional_undercurrent.primary_emotion}
                {results.emotional_undercurrent.secondary_emotion ? ` + ${results.emotional_undercurrent.secondary_emotion}` : ''}
              </span>
              <span className={`text-xs ${c.emotionText}`}>({results.emotional_undercurrent.intensity})</span>
            </div>
            <p className={`text-sm ${c.emotionText}`}>{results.emotional_undercurrent.summary}</p>
          </div>
        )}

        {/* Tone radar */}
        {results.tone_rating && (
          <div className={`p-5 rounded-2xl border ${c.card}`}>
            <p className={`text-xs font-bold ${c.textMuted} uppercase tracking-wide mb-3`}>📊 Tone Analysis</p>
            <div className="space-y-2">
              <ScoreBar label="Warmth" value={results.tone_rating.warmth} color="gold" />
              <ScoreBar label="Directness" value={results.tone_rating.directness} color="navy" />
              <ScoreBar label="Sincerity" value={results.tone_rating.sincerity} color="green" />
              <ScoreBar label="Manipulation" value={results.tone_rating.manipulation} color="red" />
            </div>
          </div>
        )}

        {/* Decoded Layers */}
        {results.decoded_layers?.length > 0 && (
          <Section title="Layer-by-Layer Breakdown" emoji="🧅" open={showLayers}
            onToggle={() => setShowLayers(!showLayers)} badge={`${results.decoded_layers.length} layers`}>
            <div className="space-y-4 mt-4">
              {results.decoded_layers.map((layer, idx) => (
                <div key={idx} className={`rounded-xl border overflow-hidden ${c.subtextBg}`}>
                  {/* The phrase */}
                  <div className={`px-4 py-3 ${c.surfaceBg}`}>
                    <p className={`text-sm font-mono ${c.text}`}>"{layer.phrase}"</p>
                  </div>
                  <div className="px-4 py-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-xs mt-0.5">📝</span>
                      <div>
                        <span className={`text-[10px] font-bold uppercase ${c.textMuted}`}>Surface</span>
                        <p className={`text-sm ${c.textSecondary}`}>{layer.surface}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-xs mt-0.5">🔍</span>
                      <div>
                        <span className={`text-[10px] font-bold uppercase ${c.subtextText}`}>Subtext</span>
                        <p className={`text-sm font-medium ${c.subtextText}`}>{layer.subtext}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${c.badge}`}>
                        {TECHNIQUE_EMOJIS[layer.technique?.toLowerCase()] || '🔮'} {layer.technique}
                      </span>
                      {layer.confidence && (
                        <span className={`text-[10px] ${c.textMuted}`}>Confidence: {layer.confidence}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Flags */}
        {results.flags && (results.flags.red_flags?.length > 0 || results.flags.green_flags?.length > 0) && (
          <Section title="Flags" emoji="🚩" open={showFlags}
            onToggle={() => setShowFlags(!showFlags)}>
            <div className="space-y-3 mt-4">
              {results.flags.red_flags?.length > 0 && (
                <div className={`p-4 rounded-xl border ${c.redFlagBg}`}>
                  <p className={`text-xs font-bold ${c.redFlagText} mb-2`}>🚩 Red Flags</p>
                  {results.flags.red_flags.map((f, i) => (
                    <p key={i} className={`text-sm ${c.redFlagText} mb-1`}>• {f}</p>
                  ))}
                </div>
              )}
              {results.flags.green_flags?.length > 0 && (
                <div className={`p-4 rounded-xl border ${c.greenFlagBg}`}>
                  <p className={`text-xs font-bold ${c.greenFlagText} mb-2`}>🟢 Green Flags</p>
                  {results.flags.green_flags.map((f, i) => (
                    <p key={i} className={`text-sm ${c.greenFlagText} mb-1`}>• {f}</p>
                  ))}
                </div>
              )}
            </div>
          </Section>
        )}

        {/* Response Strategies */}
        {results.response_strategies?.length > 0 && (
          <Section title="How to Respond" emoji="💬" open={showStrategies}
            onToggle={() => setShowStrategies(!showStrategies)} badge={`${results.response_strategies.length} options`}>
            <div className="space-y-3 mt-4">
              {results.response_strategies.map((strat, idx) => (
                <div key={idx} className={`p-4 rounded-xl border ${c.border} ${c.cardAlt}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-bold ${c.text}`}>{strat.approach}</span>
                    <span className={`text-xs ${c.textMuted}`}>{strat.goal}</span>
                  </div>
                  <div className={`p-3 rounded-lg ${c.inset} mb-2`}>
                    <p className={`text-sm ${c.text} whitespace-pre-wrap`}>{strat.example}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${c.textMuted}`}>⚠️ Risk: {strat.risk}</span>
                    <CopyBtn content={`${strat.example}\n\n— Generated by DeftBrain · deftbrain.com`} label="Copy" />
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Disclaimer */}
        <p className={`text-xs ${c.textMuted} text-center`}>AI analysis — use your own judgment when interpreting messages.</p>

        {/* Actions */}
        <div className="flex gap-2">
          <button onClick={handleReset}
            className={`w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 ${c.btnSecondary}`}>
            <span>🔄</span> Decode Another
          </button>
        </div>

        {/* Cross-references */}
        <div className={`p-4 rounded-2xl border ${c.border} ${isDark ? 'bg-zinc-800/60' : 'bg-slate-50'}`}>
          <p className={`text-xs ${c.textMuted}`}>
            💡 Need a tough reply?{' '}<a href="velvet-hammer" target="_blank" rel="noopener noreferrer" className={linkStyle}>Velvet Hammer</a>{' '}
            turns angry drafts into assertive messages. Stuck in a bigger decision?{' '}<a href="context-collapse" target="_blank" rel="noopener noreferrer" className={linkStyle}>Context Collapse</a>{' '}
            shows how your message lands on different people.
          </p>
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════
  // RENDER: History
  // ══════════════════════════════════════════
  const renderHistory = () => {
    if (history.length === 0) return null;
    const formatDate = (iso) => {
      try {
        const d = new Date(iso); const now = new Date();
        const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
        if (diff === 0) return 'Today';
        if (diff === 1) return 'Yesterday';
        if (diff < 7) return `${diff} days ago`;
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } catch { return ''; }
    };

    return (
      <div className={`mt-6 p-4 rounded-2xl border ${c.histBg}`}>
        <button onClick={() => setShowHistory(!showHistory)} className="w-full flex items-center gap-2 text-left">
          <span className={`text-base ${c.histAccent}`}>🔍</span>
          <span className={`text-sm font-bold ${c.text} flex-1`}>Past Decodes</span>
          <span className={`text-xs ${c.textMuted}`}>{history.length}</span>
          <span className={`text-xs ${c.textMuted}`}>{showHistory ? '▲' : '▼'}</span>
        </button>
        {showHistory && (
          <div className="mt-3 space-y-2">
            {history.map(entry => (
              <div key={entry.id} className={`rounded-xl border ${c.card} p-3 flex items-center gap-3`}>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-semibold ${c.text} truncate`}>"{entry.preview}..."</div>
                  <div className={`text-xs ${c.textMuted} mt-0.5`}>{formatDate(entry.date)}{entry.emotion ? ` · ${entry.emotion}` : ''}</div>
                </div>
                <button onClick={() => loadFromHistory(entry)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${c.btnSecondary}`}>View</button>
                <button onClick={() => setHistory(prev => prev.filter(h => h.id !== entry.id))}
                  className={`px-2 py-1.5 rounded-lg text-xs ${c.btnGhostDel}`}>🗑️</button>
              </div>
            ))}
            {history.length > 1 && (
              <button onClick={() => setHistory([])}
                className={`w-full mt-1 text-center text-xs font-semibold ${c.btnGhostDel} py-1.5`}>Clear all</button>
            )}
          </div>
        )}
      </div>
    );
  };

  // ══════════════════════════════════════════
  // MAIN
  // ══════════════════════════════════════════
  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div>
          <h2 className={`text-2xl font-bold ${c.text}`}><span className="mr-2">{tool?.icon ?? '🔍'}</span>Decoder Ring</h2>
          <p className={`text-sm ${c.textMuted}`}>Decode what they actually mean beneath what they said</p>
        </div>
      </div>
      {renderInput()}
      {renderResults()}
      {error && (
        <div className={`mt-4 p-4 ${c.danger} border rounded-xl flex items-start gap-3`}>
          <span className={`text-base ${c.danger}`}>⚠️</span>
          <p className={`text-sm ${c.danger}`}>{error}</p>
        </div>
      )}
      {renderHistory()}
    </div>
  );
};

DecoderRing.displayName = 'DecoderRing';
export default DecoderRing;
