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
    d,
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
    border:      d ? 'border-[#3d3630]' : 'border-[#e8e1d5]',
    divider:     d ? 'border-[#3d3630]' : 'border-[#e8e1d5]',
    btn:         d ? 'bg-[#2c4a6e] hover:bg-[#4a6a8a] text-white' : 'bg-[#2c4a6e] hover:bg-[#1e3a58] text-white',
    btnGold:     d ? 'bg-[#b06d22] hover:bg-[#c8872e] text-white' : 'bg-[#c8872e] hover:bg-[#b06d22] text-white',
    btnSec:      d ? 'bg-[#332e2a] hover:bg-[#3d3630] text-[#c8c3b9] border border-[#3d3630]'
                    : 'bg-[#f3efe8] hover:bg-[#e8e1d5] text-[#5e5042] border border-[#d5cab8]',
    btnGhost:    d ? 'text-[#8a8275] hover:text-[#f0eeea]' : 'text-[#8a8275] hover:text-[#3d3935]',
    btnDis:      d ? 'bg-[#332e2a] text-[#5a544a] cursor-not-allowed' : 'bg-[#e8e1d5] text-[#8a8275] cursor-not-allowed',
    pillActive:  d ? 'border-[#4a6a8a] bg-[#2c4a6e]/30 text-[#a8b9ce]' : 'border-[#2c4a6e] bg-[#d4dde8] text-[#1e3a58]',
    pillInactive: d ? 'border-[#3d3630] text-[#8a8275] hover:border-[#5a544a]' : 'border-[#d5cab8] text-[#5a544a] hover:border-[#8a8275]',
    badge:       d ? 'bg-[#2c4a6e]/30 text-[#a8b9ce]' : 'bg-[#d4dde8] text-[#1e3a58]',
    // Decoded layers
    surfaceBg:   d ? 'bg-[#332e2a]' : 'bg-[#f3efe8]',
    subtextBg:   d ? 'bg-[#2c4a6e]/15 border-[#4a6a8a]/30' : 'bg-[#d4dde8]/40 border-[#2c4a6e]/20',
    subtextText: d ? 'text-[#a8b9ce]' : 'text-[#1e3a58]',
    // Flags
    redFlagBg:   d ? 'bg-[#b54a3f]/10 border-[#b54a3f]/30' : 'bg-[#fceae8] border-[#e8a8a0]',
    redFlagText: d ? 'text-[#e88880]' : 'text-[#b54a3f]',
    greenFlagBg: d ? 'bg-[#5a8a5c]/10 border-[#5a8a5c]/30' : 'bg-[#e8f0e8] border-[#5a8a5c]/30',
    greenFlagText: d ? 'text-[#7aba7c]' : 'text-[#3a6a3c]',
    // Emotion
    emotionBg:   d ? 'bg-[#c8872e]/10 border-[#c8872e]/30' : 'bg-[#f9edd8] border-[#c8872e]/30',
    emotionText: d ? 'text-[#d9a04e]' : 'text-[#93541f]',
    // Tone bars
    barBg:       d ? 'bg-[#332e2a]' : 'bg-[#e8e1d5]',
    barNavy:     'bg-[#2c4a6e]',
    barGold:     'bg-[#c8872e]',
    barRed:      'bg-[#b54a3f]',
    barGreen:    'bg-[#5a8a5c]',
    // Strategy cards
    stratBg:     d ? 'bg-[#1a1816] border-[#3d3630]' : 'bg-[#faf8f5] border-[#e8e1d5]',
    // Error
    errBg:       d ? 'bg-[#b54a3f]/15 border-[#b54a3f]/40' : 'bg-[#fceae8] border-[#e8a8a0]',
    errText:     d ? 'text-[#e88880]' : 'text-[#b54a3f]',
    // Translation highlight
    transBg:     d ? 'bg-[#c8872e]/15 border-[#c8872e]/40' : 'bg-[#f9edd8] border-[#c8872e]/40',
    transText:   d ? 'text-[#d9a04e]' : 'text-[#93541f]',
    // History
    histBg:      d ? 'bg-[#2c4a6e]/10 border-[#4a6a8a]/30' : 'bg-[#d4dde8]/30 border-[#2c4a6e]/15',
    histCard:    d ? 'bg-[#2a2623] border-[#3d3630]' : 'bg-white border-[#e8e1d5]',
    histAccent:  d ? 'text-[#a8b9ce]' : 'text-[#2c4a6e]',
    linkStyle:   d ? 'text-[#6e8aaa] hover:text-[#a8b9ce] underline' : 'text-[#2c4a6e] hover:text-[#1e3a58] underline',
  };
};

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
const DecoderRing = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const c = useColors();
  const resultsRef = useRef(null);

  // Persistent
  const [history, setHistory] = usePersistentState('decoder-ring-history', []);
  const [showHistory, setShowHistory] = useState(false);

  // Input
  const [message, setMessage] = useState('');
  const [source, setSource] = useState('');
  const [relationship, setRelationship] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');

  // Results
  const [results, setResults] = useState(null);
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
      preview: message.trim().slice(0, 60),
      emotion: data.emotional_undercurrent?.primary_emotion || '',
      results: data,
    };
    setHistory(prev => [entry, ...prev].slice(0, 20));
  }, [message, setHistory]);

  const loadFromHistory = useCallback((entry) => {
    setResults(entry.results); setShowHistory(false);
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
        <span className={`text-xs ${c.textMut}`}>{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className={`px-5 pb-5 border-t ${c.divider}`}>{children}</div>}
    </div>
  );

  // Score bar
  const ScoreBar = ({ label, value, max = 10, color = 'navy' }) => {
    const barColor = color === 'gold' ? c.barGold : color === 'red' ? c.barRed : color === 'green' ? c.barGreen : c.barNavy;
    return (
      <div className="flex items-center gap-3">
        <span className={`text-xs font-medium ${c.textMut} w-24 shrink-0`}>{label}</span>
        <div className={`flex-1 h-2 rounded-full ${c.barBg}`}>
          <div className={`h-2 rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${(value / max) * 100}%` }} />
        </div>
        <span className={`text-xs font-mono ${c.textMut} w-6 text-right`}>{value}</span>
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
          <button onClick={() => setMessage(EXAMPLE_MESSAGE)} className={`text-xs ${c.linkStyle}`}>Try example</button>
        </div>
        <p className={`text-sm ${c.textMut} mb-4`}>What did they send you? Paste the exact message — tone and wording matter.</p>
        <textarea value={message} onChange={e => setMessage(e.target.value)}
          placeholder="Paste the confusing text, email, DM, or message here..."
          className={`w-full h-32 p-4 border-2 rounded-xl ${c.inputBg} outline-none focus:ring-2 resize-none text-base`} />
        <span className={`text-xs ${c.textMut} mt-2 block`}>{message.length} characters</span>
      </div>

      {/* Source */}
      <div className={`${c.card} border rounded-xl p-5`}>
        <label className={`text-xs font-bold ${c.textSec} uppercase tracking-wide mb-2 block`}>📬 Where did this come from?</label>
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
        <label className={`text-xs font-bold ${c.textSec} uppercase tracking-wide mb-2 block`}>👤 Who sent it?</label>
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
        <label className={`text-xs font-bold ${c.textSec} uppercase tracking-wide mb-1 block`}>💬 Backstory</label>
        <p className={`text-xs ${c.textMut} mb-2`}>Optional — helps decode ambiguous messages more accurately</p>
        <input type="text" value={additionalContext} onChange={e => setAdditionalContext(e.target.value)}
          placeholder="e.g., 'We had an argument yesterday' or 'This is my new manager'"
          className={`w-full px-4 py-2.5 rounded-xl border text-sm ${c.inputBg} outline-none`} />
      </div>

      {/* Decode button */}
      <button onClick={decode}
        disabled={loading || !message.trim()}
        className={`w-full py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
          loading || !message.trim() ? c.btnDis : c.btn
        }`}>
        {loading ? <><span className="animate-spin inline-block">⏳</span> Decoding...</>
          : <><span>🔍</span> Decode This Message</>}
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
            <p className={`text-xs font-bold ${c.textMut} mb-1`}>🎯 What they want from you</p>
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
            <p className={`text-xs font-bold ${c.textMut} uppercase tracking-wide mb-3`}>📊 Tone Analysis</p>
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
                        <span className={`text-[10px] font-bold uppercase ${c.textMut}`}>Surface</span>
                        <p className={`text-sm ${c.textSec}`}>{layer.surface}</p>
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
                        <span className={`text-[10px] ${c.textMut}`}>Confidence: {layer.confidence}</span>
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
                <div key={idx} className={`p-4 rounded-xl border ${c.stratBg}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-bold ${c.text}`}>{strat.approach}</span>
                    <span className={`text-xs ${c.textMut}`}>{strat.goal}</span>
                  </div>
                  <div className={`p-3 rounded-lg ${c.inset} mb-2`}>
                    <p className={`text-sm ${c.text} whitespace-pre-wrap`}>{strat.example}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${c.textMut}`}>⚠️ Risk: {strat.risk}</span>
                    <CopyBtn content={`${strat.example}\n\n— Generated by DeftBrain · deftbrain.com`} label="Copy" />
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <div className="flex-1"><CopyBtn content={buildFullCopy()} label="Copy Full Analysis" /></div>
          <button onClick={handleReset}
            className={`flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 ${c.btn}`}>
            <span>🔄</span> Decode Another
          </button>
        </div>

        {/* Cross-references */}
        <div className={`p-4 rounded-2xl border ${c.card}`}>
          <p className={`text-xs font-bold ${c.textMut} uppercase tracking-wide mb-2`}>🔗 Related Tools</p>
          <div className={`space-y-1.5 text-xs ${c.textSec}`}>
            <p>Need to craft a tough reply? <a href="/VelvetHammer" target="_blank" rel="noopener noreferrer" className={c.linkStyle}>Velvet Hammer</a> turns angry drafts into assertive messages.</p>
            <p>Stuck on a bigger decision this triggered? <a href="/PlotTwist" target="_blank" rel="noopener noreferrer" className={c.linkStyle}>Plot Twist</a> untangles complex decisions with multiple frameworks.</p>
          </div>
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
          <span className={`text-xs ${c.textMut}`}>{history.length}</span>
          <span className={`text-xs ${c.textMut}`}>{showHistory ? '▲' : '▼'}</span>
        </button>
        {showHistory && (
          <div className="mt-3 space-y-2">
            {history.map(entry => (
              <div key={entry.id} className={`rounded-xl border ${c.histCard} p-3 flex items-center gap-3`}>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-semibold ${c.text} truncate`}>"{entry.preview}..."</div>
                  <div className={`text-xs ${c.textMut} mt-0.5`}>{formatDate(entry.date)}{entry.emotion ? ` · ${entry.emotion}` : ''}</div>
                </div>
                <button onClick={() => loadFromHistory(entry)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${c.btnSec}`}>View</button>
                <button onClick={() => setHistory(prev => prev.filter(h => h.id !== entry.id))}
                  className={`px-2 py-1.5 rounded-lg text-xs ${c.btnGhost} hover:text-red-500`}>🗑️</button>
              </div>
            ))}
            {history.length > 1 && (
              <button onClick={() => setHistory([])}
                className={`w-full mt-1 text-center text-xs font-semibold ${c.btnGhost} hover:text-red-500 py-1.5`}>Clear all</button>
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
          <h2 className={`text-2xl font-bold ${c.heading}`}>Decoder Ring <span className="text-xl">🔍</span></h2>
          <p className={`text-sm ${c.textMut}`}>Decode what they actually mean beneath what they said</p>
        </div>
      </div>
      {!results && renderInput()}
      {results && renderResults()}
      {error && (
        <div className={`mt-4 p-4 ${c.errBg} border rounded-xl flex items-start gap-3`}>
          <span className={`text-base ${c.errText}`}>⚠️</span>
          <p className={`text-sm ${c.errText}`}>{error}</p>
        </div>
      )}
      {renderHistory()}
    </div>
  );
};

DecoderRing.displayName = 'DecoderRing';
export default DecoderRing;
