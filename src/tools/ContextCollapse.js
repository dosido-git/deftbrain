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
    btnGhost:    d ? 'text-[#8a8275] hover:text-[#f0eeea]' : 'text-[#8a8275] hover:text-[#3d3935]',
    btnDis:      d ? 'bg-[#332e2a] text-[#5a544a] cursor-not-allowed' : 'bg-[#e8e1d5] text-[#8a8275] cursor-not-allowed',
    pillActive:  d ? 'border-[#4a6a8a] bg-[#2c4a6e]/30 text-[#a8b9ce]' : 'border-[#2c4a6e] bg-[#d4dde8] text-[#1e3a58]',
    pillInactive: d ? 'border-[#3d3630] text-[#8a8275] hover:border-[#5a544a]' : 'border-[#d5cab8] text-[#5a544a] hover:border-[#8a8275]',
    badge:       d ? 'bg-[#2c4a6e]/30 text-[#a8b9ce]' : 'bg-[#d4dde8] text-[#1e3a58]',
    divider:     d ? 'border-[#3d3630]' : 'border-[#e8e1d5]',
    tipBg:       d ? 'bg-[#c8872e]/10 border-[#c8872e]/30' : 'bg-[#f9edd8] border-[#c8872e]/30',
    tipText:     d ? 'text-[#d9a04e]' : 'text-[#93541f]',
    successBg:   d ? 'bg-[#5a8a5c]/10 border-[#5a8a5c]/30' : 'bg-[#e8f0e8] border-[#5a8a5c]/30',
    successText: d ? 'text-[#7aba7c]' : 'text-[#3a6a3c]',
    warnBg:      d ? 'bg-[#c8872e]/15 border-[#c8872e]/40' : 'bg-[#f9edd8] border-[#c8872e]/40',
    warnText:    d ? 'text-[#d9a04e]' : 'text-[#93541f]',
    dangerBg:    d ? 'bg-[#b54a3f]/15 border-[#b54a3f]/40' : 'bg-[#fceae8] border-[#b54a3f]/30',
    dangerText:  d ? 'text-[#e88880]' : 'text-[#b54a3f]',
    errBg:       d ? 'bg-[#b54a3f]/15 border-[#b54a3f]/40' : 'bg-[#fceae8] border-[#e8a8a0]',
    errText:     d ? 'text-[#e88880]' : 'text-[#b54a3f]',
    histBg:      d ? 'bg-[#2c4a6e]/10 border-[#4a6a8a]/30' : 'bg-[#d4dde8]/30 border-[#2c4a6e]/15',
    histCard:    d ? 'bg-[#2a2623] border-[#3d3630]' : 'bg-white border-[#e8e1d5]',
    linkStyle:   d ? 'text-[#6e8aaa] hover:text-[#a8b9ce] underline' : 'text-[#2c4a6e] hover:text-[#1e3a58] underline',
  };
};

const PLATFORMS = [
  { value: 'text', label: '💬 Text' },
  { value: 'email', label: '📧 Email' },
  { value: 'group_chat', label: '👥 Group Chat' },
  { value: 'slack', label: '💼 Slack / Teams' },
  { value: 'social_media', label: '📱 Social Media' },
  { value: 'public_post', label: '🌐 Public Post' },
  { value: 'announcement', label: '📢 Announcement' },
  { value: 'other', label: '📎 Other' },
];

const riskBg = (level, c) => {
  if (level === 'safe') return c.successBg;
  if (level === 'mild_risk') return c.tipBg;
  if (level === 'risky') return c.warnBg;
  return c.dangerBg;
};
const riskText = (level, c) => {
  if (level === 'safe') return c.successText;
  if (level === 'mild_risk') return c.tipText;
  if (level === 'risky') return c.warnText;
  return c.dangerText;
};
const riskEmoji = (level) => {
  if (level === 'safe') return '✅';
  if (level === 'mild_risk') return '🟡';
  if (level === 'risky') return '🟠';
  return '🔴';
};

// ════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════
const ContextCollapse = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const c = useColors();
  const resultsRef = useRef(null);

  const [history, setHistory] = usePersistentState('context-collapse-history', []);
  const [showHistory, setShowHistory] = useState(false);

  // Input
  const [message, setMessage] = useState('');
  const [platform, setPlatform] = useState('text');
  const [audiences, setAudiences] = useState([{ label: '', relationship: '', context: '' }, { label: '', relationship: '', context: '' }]);
  const [intent, setIntent] = useState('');
  const [concerns, setConcerns] = useState('');

  // Results
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [showNuclear, setShowNuclear] = useState(false);

  useEffect(() => {
    if (results && resultsRef.current) {
      setTimeout(() => resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
    }
  }, [results]);

  // Audience helpers
  const addAudience = useCallback(() => { if (audiences.length < 6) setAudiences(prev => [...prev, { label: '', relationship: '', context: '' }]); }, [audiences.length]);
  const removeAudience = useCallback((idx) => { if (audiences.length > 2) setAudiences(prev => prev.filter((_, i) => i !== idx)); }, [audiences.length]);
  const updateAudience = useCallback((idx, field, val) => setAudiences(prev => prev.map((a, i) => i === idx ? { ...a, [field]: val } : a)), []);

  const analyze = useCallback(async () => {
    if (!message.trim()) { setError('Paste the message you\'re about to send'); return; }
    if (!audiences.some(a => a.label.trim())) { setError('Add at least one audience'); return; }
    setError(''); setResults(null);
    try {
      const data = await callToolEndpoint('context-collapse', {
        message: message.trim(), platform,
        audiences: audiences.filter(a => a.label.trim()),
        intent: intent.trim() || null, concerns: concerns.trim() || null,
      });
      setResults(data);
      const entry = { id: 'cc_' + Date.now(), date: new Date().toISOString(), message: message.trim().substring(0, 50) + '...', verdict: data.verdict?.verdict_label, results: data };
      setHistory(prev => [entry, ...prev].slice(0, 20));
    } catch (err) { setError(err.message || 'Failed to analyze message.'); }
  }, [message, platform, audiences, intent, concerns, callToolEndpoint, setHistory]);

  const handleReset = useCallback(() => {
    setMessage(''); setIntent(''); setConcerns('');
    setAudiences([{ label: '', relationship: '', context: '' }, { label: '', relationship: '', context: '' }]);
    setResults(null); setError('');
  }, []);

  const buildCopy = useCallback(() => {
    if (!results) return '';
    const lines = ['📢 Context Collapse — Message Analysis', '', 'VERDICT: ' + (results.verdict?.summary || ''), ''];
    results.readings?.forEach(r => {
      lines.push(riskEmoji(r.risk_level) + ' ' + r.audience + ': ' + r.reads_as);
    });
    if (results.rewrites?.length) {
      lines.push('', 'SUGGESTED REWRITE:');
      lines.push(results.rewrites[0].message);
    }
    lines.push('', '— Generated by DeftBrain · deftbrain.com');
    return lines.join('\n');
  }, [results]);

  const Pill = ({ active, onClick, children }) => (
    <button onClick={onClick} className={'px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ' + (active ? c.pillActive : c.pillInactive)}>
      {active && <span className="mr-1">✓</span>}{children}
    </button>
  );

  const verdictBg = (label) => {
    if (!label) return c.tipBg;
    if (label === 'SEND AS IS') return c.successBg;
    if (label === 'MINOR TWEAKS') return c.tipBg;
    if (label === 'REWRITE NEEDED') return c.warnBg;
    return c.dangerBg;
  };
  const verdictText = (label) => {
    if (!label) return c.tipText;
    if (label === 'SEND AS IS') return c.successText;
    if (label === 'MINOR TWEAKS') return c.tipText;
    if (label === 'REWRITE NEEDED') return c.warnText;
    return c.dangerText;
  };

  // ══════════════════════════════════════════
  // INPUT
  // ══════════════════════════════════════════
  const renderInput = () => (
    <div className="space-y-4">
      <div className={c.card + ' border rounded-xl p-5'}>
        <label className={'text-base font-bold ' + c.text + ' mb-1 block'}>📢 What are you about to send?</label>
        <p className={'text-sm ' + c.textMut + ' mb-4'}>We'll show you how different people will read the same message.</p>
        <textarea value={message} onChange={e => setMessage(e.target.value)}
          placeholder="Paste your message, post, email, or announcement here..."
          className={'w-full h-28 p-4 border-2 rounded-xl ' + c.inputBg + ' outline-none focus:ring-2 resize-none text-sm'} />
      </div>

      <div className={c.card + ' border rounded-xl p-5 space-y-4'}>
        <div>
          <label className={'text-xs font-bold ' + c.textSec + ' uppercase tracking-wide mb-2 block'}>📱 Platform</label>
          <div className="flex flex-wrap gap-1.5">
            {PLATFORMS.map(p => <Pill key={p.value} active={platform === p.value} onClick={() => setPlatform(p.value)}>{p.label}</Pill>)}
          </div>
        </div>

        <div>
          <label className={'text-xs font-bold ' + c.textSec + ' uppercase tracking-wide mb-2 block'}>👥 Who will see this?</label>
          <div className="space-y-3">
            {audiences.map((a, idx) => (
              <div key={idx} className={'p-3 rounded-xl border ' + c.cardAlt + ' space-y-2'}>
                <div className="flex items-center gap-2">
                  <span className={'text-xs font-bold ' + c.textMut + ' w-20'}>Audience {idx + 1}</span>
                  <input type="text" value={a.label} onChange={e => updateAudience(idx, 'label', e.target.value)}
                    placeholder="e.g., My boss, Mom, College friends..."
                    className={'flex-1 px-3 py-1.5 rounded-lg border text-sm ' + c.inputBg + ' outline-none'} />
                  {audiences.length > 2 && (
                    <button onClick={() => removeAudience(idx)} className={'px-2 py-1 rounded-lg text-xs ' + c.btnGhost + ' hover:text-red-500'}>✕</button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" value={a.relationship} onChange={e => updateAudience(idx, 'relationship', e.target.value)}
                    placeholder="Relationship (manager, friend...)"
                    className={'px-3 py-1.5 rounded-lg border text-xs ' + c.inputBg + ' outline-none'} />
                  <input type="text" value={a.context} onChange={e => updateAudience(idx, 'context', e.target.value)}
                    placeholder="Context (e.g., 'we had a fight')"
                    className={'px-3 py-1.5 rounded-lg border text-xs ' + c.inputBg + ' outline-none'} />
                </div>
              </div>
            ))}
          </div>
          {audiences.length < 6 && <button onClick={addAudience} className={'mt-2 text-xs font-semibold ' + c.linkStyle}>➕ Add audience</button>}
        </div>

        <div>
          <label className={'text-xs font-bold ' + c.textSec + ' uppercase tracking-wide mb-1 block'}>🎯 What are you trying to say?</label>
          <input type="text" value={intent} onChange={e => setIntent(e.target.value)}
            placeholder="e.g., 'Setting a boundary', 'Announcing I'm leaving my job', 'Being funny'"
            className={'w-full px-4 py-2.5 rounded-xl border text-sm ' + c.inputBg + ' outline-none'} />
        </div>
        <div>
          <label className={'text-xs font-bold ' + c.textSec + ' uppercase tracking-wide mb-1 block'}>😰 What are you worried about? (optional)</label>
          <input type="text" value={concerns} onChange={e => setConcerns(e.target.value)}
            placeholder="e.g., 'My boss might take it personally', 'Mom will overreact'"
            className={'w-full px-4 py-2.5 rounded-xl border text-sm ' + c.inputBg + ' outline-none'} />
        </div>
      </div>

      <button onClick={analyze} disabled={loading || !message.trim() || !audiences.some(a => a.label.trim())}
        className={'w-full py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all ' + (loading || !message.trim() || !audiences.some(a => a.label.trim()) ? c.btnDis : c.btn)}>
        {loading ? <><span className="animate-spin inline-block">⏳</span> Analyzing audiences...</> : <><span>📢</span> Preview How It Lands</>}
      </button>
    </div>
  );

  // ══════════════════════════════════════════
  // RESULTS
  // ══════════════════════════════════════════
  const renderResults = () => {
    if (!results) return null;
    const v = results.verdict;

    return (
      <div ref={resultsRef} className="space-y-4 mt-4">
        {/* Verdict */}
        {v && (
          <div className={'p-5 rounded-2xl border-2 ' + verdictBg(v.verdict_label)}>
            <div className="flex items-center gap-2 mb-2">
              <span className={'text-xs font-bold px-3 py-1 rounded-full ' + c.badge}>{v.verdict_label}</span>
              <span className={'text-xs ' + verdictText(v.verdict_label)}>{v.safe_to_send ? '✅ Safe to send' : '⚠️ Review first'}</span>
            </div>
            <p className={'text-sm font-bold ' + c.text}>{v.summary}</p>
          </div>
        )}

        {/* Your message */}
        <div className={'p-4 rounded-xl ' + c.inset}>
          <p className={'text-xs font-bold ' + c.textMut + ' mb-2'}>📝 Your message</p>
          <p className={'text-sm ' + c.text + ' italic'}>"{message}"</p>
        </div>

        {/* Tone analysis */}
        {results.message_analysis && (
          <div className={c.card + ' border rounded-xl p-5'}>
            <p className={'text-xs font-bold ' + c.textMut + ' uppercase mb-2'}>🔍 Tone detected</p>
            <p className={'text-sm ' + c.text + ' mb-2'}>{results.message_analysis.tone_detected}</p>
            {results.message_analysis.subtext && (
              <p className={'text-xs ' + c.textSec + ' mb-2'}>💭 Subtext: {results.message_analysis.subtext}</p>
            )}
            {results.message_analysis.ambiguous_elements?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {results.message_analysis.ambiguous_elements.map((el, i) => (
                  <span key={i} className={'text-[10px] px-2 py-0.5 rounded-full border ' + c.tipBg + ' ' + c.tipText}>⚡ {el}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Audience readings */}
        {results.readings?.map((r, idx) => (
          <div key={idx} className={'p-5 rounded-xl border-2 ' + riskBg(r.risk_level, c)}>
            <div className="flex items-center gap-2 mb-2">
              <span>{riskEmoji(r.risk_level)}</span>
              <span className={'text-sm font-bold ' + c.text}>{r.audience}</span>
              <span className={'text-[10px] font-bold px-2 py-0.5 rounded-full ' + c.badge}>{r.risk_level?.replace('_', ' ')}</span>
            </div>
            <p className={'text-sm ' + c.text + ' mb-2'}>{r.reads_as}</p>
            {r.emotional_impact && <p className={'text-xs ' + c.textSec + ' mb-1'}>💭 Feels: {r.emotional_impact}</p>}
            {r.key_trigger && <p className={'text-xs ' + riskText(r.risk_level, c) + ' mb-1'}>⚡ Trigger: "{r.key_trigger}"</p>}
            {r.what_they_might_do && <p className={'text-xs ' + c.textMut + ' italic'}>→ They might: {r.what_they_might_do}</p>}
          </div>
        ))}

        {/* Intent vs reality */}
        {results.intent_vs_reality && (
          <div className={c.card + ' border rounded-xl p-5'}>
            <p className={'text-xs font-bold ' + c.textMut + ' uppercase mb-2'}>🎯 Intent vs. Reality</p>
            <p className={'text-xs ' + c.textSec + ' mb-2'}>{results.intent_vs_reality.gap_analysis}</p>
            {results.intent_vs_reality.biggest_risk && (
              <div className={'p-3 rounded-lg ' + c.warnBg}>
                <p className={'text-xs font-bold ' + c.warnText}>⚠️ Biggest risk: {results.intent_vs_reality.biggest_risk}</p>
              </div>
            )}
          </div>
        )}

        {/* Rewrites */}
        {results.rewrites?.length > 0 && (
          <div className="space-y-3">
            <p className={'text-xs font-bold ' + c.textMut + ' uppercase'}>✏️ Suggested Rewrites</p>
            {results.rewrites.map((rw, idx) => (
              <div key={idx} className={'p-4 rounded-xl border ' + c.successBg}>
                <p className={'text-xs font-bold ' + c.successText + ' mb-2'}>{rw.label}</p>
                <div className={'p-3 rounded-lg ' + c.inset + ' mb-2'}>
                  <p className={'text-sm ' + c.text + ' italic'}>"{rw.message}"</p>
                </div>
                <p className={'text-xs ' + c.textMut + ' mb-2'}>Trade-off: {rw.tradeoff}</p>
                <CopyBtn content={rw.message} label="Copy rewrite" />
              </div>
            ))}
          </div>
        )}

        {/* Platform note */}
        {results.platform_note && (
          <div className={'p-4 rounded-xl ' + c.inset}>
            <p className={'text-xs font-bold ' + c.textMut + ' mb-1'}>📱 Platform consideration</p>
            <p className={'text-sm ' + c.text}>{results.platform_note}</p>
          </div>
        )}

        {/* Nuclear scenarios */}
        {results.nuclear_scenarios?.length > 0 && (
          <div>
            <button onClick={() => setShowNuclear(!showNuclear)} className={'w-full flex items-center gap-2 p-3 rounded-xl ' + c.cardAlt + ' border hover:opacity-80'}>
              <span>💣</span>
              <span className={'text-xs font-bold ' + c.text + ' flex-1'}>Worst-Case Scenarios</span>
              <span className={'text-xs ' + c.textMut}>{showNuclear ? '▲' : '▼'}</span>
            </button>
            {showNuclear && (
              <div className="mt-2 space-y-2">
                {results.nuclear_scenarios.map((n, idx) => (
                  <div key={idx} className={'p-3 rounded-lg ' + c.dangerBg}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={'text-[10px] font-bold px-2 py-0.5 rounded-full ' + c.badge}>{n.likelihood}</span>
                      <span className={'text-xs font-bold ' + c.dangerText}>{n.scenario}</span>
                    </div>
                    <p className={'text-xs ' + c.textSec}>Mitigation: {n.mitigation}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <div className="flex-1"><CopyBtn content={buildCopy()} label="Copy Analysis" /></div>
          <button onClick={handleReset} className={'flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 ' + c.btn}><span>📢</span> New Message</button>
        </div>

        <div className={'p-4 rounded-2xl border ' + c.card}>
          <p className={'text-xs font-bold ' + c.textMut + ' uppercase tracking-wide mb-2'}>🔗 Related Tools</p>
          <div className={'space-y-1.5 text-xs ' + c.textSec}>
            <p>Need to decode an incoming message? <a href="/DecoderRing" target="_blank" rel="noopener noreferrer" className={c.linkStyle}>Decoder Ring</a> reads subtext.</p>
            <p>Writing something that needs to be firm but diplomatic? <a href="/VelvetHammer" target="_blank" rel="noopener noreferrer" className={c.linkStyle}>Velvet Hammer</a> crafts it.</p>
          </div>
        </div>
      </div>
    );
  };

  // History
  const renderHistory = () => {
    if (history.length === 0) return null;
    const formatDate = (iso) => { try { const d = new Date(iso); const diff = Math.floor((new Date() - d) / 86400000); return diff === 0 ? 'Today' : diff === 1 ? 'Yesterday' : diff < 7 ? diff + 'd ago' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); } catch { return ''; } };
    const verdictEmoji = (v) => v === 'SEND AS IS' ? '✅' : v === 'MINOR TWEAKS' ? '🟡' : v === 'REWRITE NEEDED' ? '🟠' : '🔴';
    return (
      <div className={'mt-6 p-4 rounded-2xl border ' + c.histBg}>
        <button onClick={() => setShowHistory(!showHistory)} className="w-full flex items-center gap-2 text-left">
          <span>📢</span>
          <span className={'text-sm font-bold ' + c.text + ' flex-1'}>Past Analyses</span>
          <span className={'text-xs ' + c.textMut}>{history.length}</span>
          <span className={'text-xs ' + c.textMut}>{showHistory ? '▲' : '▼'}</span>
        </button>
        {showHistory && (
          <div className="mt-3 space-y-2">
            {history.map(entry => (
              <div key={entry.id} className={'rounded-xl border ' + c.histCard + ' p-3 flex items-center gap-3'}>
                <span>{verdictEmoji(entry.verdict)}</span>
                <div className="flex-1 min-w-0">
                  <div className={'text-sm font-semibold ' + c.text + ' truncate'}>{entry.message}</div>
                  <div className={'text-xs ' + c.textMut + ' mt-0.5'}>{formatDate(entry.date)}</div>
                </div>
                <button onClick={() => { setResults(entry.results); setMessage(entry.message?.replace('...', '') || ''); setShowHistory(false); }}
                  className={'px-3 py-1.5 rounded-lg text-xs font-bold ' + c.btnSec}>View</button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div>
          <h2 className={'text-2xl font-bold ' + c.heading}>Context Collapse <span className="text-xl">📢</span></h2>
          <p className={'text-sm ' + c.textMut}>See how different people will read the same message — before you send it</p>
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

ContextCollapse.displayName = 'ContextCollapse';
export default ContextCollapse;
