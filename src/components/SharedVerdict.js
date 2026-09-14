// A verdict shared from The Final Word (handleCreateShareLink →
// POST /api/the-final-word/share) lands here when someone opens the copied
// link. Standalone page, not a "tool" — no ToolPageWrapper, no catalog
// lookup, just the verdict the backend has on file for this id (30-day TTL,
// see backend/routes/the-final-word.js `sharedVerdicts`).
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

const SourcesList = ({ sources, c }) => {
  if (!sources?.length) return null;
  return (
    <div className={`p-3 rounded-xl border ${c.cardAlt}`}>
      <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${c.textMuted}`}>Sources</p>
      {sources.map((s, i) => <p key={i} className={`text-xs ${c.textSecondary}`}>{s}</p>)}
    </div>
  );
};

// Reduces the four shapes the-final-word's main endpoint can produce
// (question / dispute / factcheck / devils-advocate — the only modes
// handleCreateShareLink ever POSTs) to one common {headline, body, extras}
// so the page has a single render path instead of four near-duplicate ones.
function summarize(verdict) {
  const mode = verdict._mode;
  if (mode === 'question') {
    return {
      kicker: 'Quick Answer', headline: verdict.answer, body: verdict.explanation,
      extras: [
        verdict.confidence && { label: 'Confidence', value: verdict.confidence },
        verdict.common_misconception && { label: 'Common misconception', value: verdict.common_misconception },
        verdict.fun_extra && { label: 'Bonus', value: verdict.fun_extra },
      ].filter(Boolean),
    };
  }
  if (mode === 'dispute') {
    return {
      kicker: 'Settle It', headline: verdict.verdict_headline, body: verdict.explanation,
      extras: [
        verdict.score?.person_a && { label: verdict.score.person_a.name, value: `${verdict.score.person_a.accuracy}% support — ${verdict.score.person_a.what_they_got_right}` },
        verdict.score?.person_b && { label: verdict.score.person_b.name, value: `${verdict.score.person_b.accuracy}% support — ${verdict.score.person_b.what_they_got_right}` },
        verdict.settlement_suggestion && { label: 'A way to move on', value: verdict.settlement_suggestion },
      ].filter(Boolean),
    };
  }
  if (mode === 'factcheck') {
    return {
      kicker: 'Fact Check', headline: verdict.ruling_display, body: verdict.explanation,
      extras: [
        verdict.the_nuance && { label: 'The nuance', value: verdict.the_nuance },
        verdict.what_is_true && { label: 'What is true', value: verdict.what_is_true },
      ].filter(Boolean),
    };
  }
  if (mode === 'devils-advocate') {
    return {
      kicker: "Devil's Advocate", headline: verdict.verdict_headline, body: verdict.explanation,
      extras: [
        verdict.counter_position && { label: 'The counter-argument', value: verdict.counter_position },
        verdict.the_nuance && { label: 'The key insight', value: verdict.the_nuance },
        verdict.recommendation && { label: 'What to consider', value: verdict.recommendation },
      ].filter(Boolean),
    };
  }
  // Unknown/future shape — still show whatever text fields exist rather
  // than a blank page, since the link is real and the data did load.
  return {
    kicker: 'Verdict',
    headline: verdict.verdict_headline || verdict.answer || verdict.ruling_display || 'The Final Word',
    body: verdict.explanation || '',
    extras: [],
  };
}

export default function SharedVerdict() {
  const { id } = useParams();
  const { isDark } = useTheme();
  const [state, setState] = useState('loading'); // loading | ready | notfound | error
  const [verdict, setVerdict] = useState(null);
  const [inputSummary, setInputSummary] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const resp = await fetch(`${BACKEND_URL}/api/the-final-word/share/${id}`);
        if (resp.status === 404) { if (!cancelled) setState('notfound'); return; }
        if (!resp.ok) { if (!cancelled) setState('error'); return; }
        const data = await resp.json();
        if (cancelled) return;
        setVerdict(data.verdict);
        setInputSummary(data.inputSummary || '');
        setState('ready');
      } catch (_) {
        if (!cancelled) setState('error');
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const c = {
    bg: isDark ? 'bg-zinc-950' : 'bg-[#faf8f5]',
    card: isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-[#e8e1d5]',
    cardAlt: isDark ? 'bg-zinc-800/60 border-zinc-700' : 'bg-slate-50 border-slate-200',
    text: isDark ? 'text-zinc-100' : 'text-[#1a2e44]',
    textSecondary: isDark ? 'text-zinc-300' : 'text-[#3a3530]',
    textMuted: isDark ? 'text-zinc-500' : 'text-[#8a8378]',
    accent: isDark ? 'text-amber-400' : 'text-[#c8872e]',
    primary: isDark ? 'bg-amber-500 text-zinc-950 hover:bg-amber-400' : 'bg-[#1a2e44] text-white hover:bg-[#2c4a6e]',
  };

  return (
    <div className={`min-h-screen ${c.bg} px-4 py-10 sm:py-16`}>
      <div className="max-w-xl mx-auto space-y-5">
        <Link to="/" className="flex items-center justify-center gap-2 mb-2">
          <img src="/pBrain-l.png" alt="DeftBrain" className="h-10 w-auto object-contain" />
          <span className="text-xl font-extrabold tracking-tight" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
            <span className={isDark ? 'text-[#d9a04e]' : 'text-[#c8872e]'}>D</span>
            <span className={isDark ? 'text-[#a8b9ce]' : 'text-[#2c4a6e]'}>eftBrain</span>
          </span>
        </Link>

        {state === 'loading' && (
          <div className={`${c.card} border rounded-2xl p-8 text-center`}>
            <span className="inline-block animate-spin text-2xl">⚖️</span>
            <p className={`text-sm mt-3 ${c.textMuted}`}>Loading the verdict…</p>
          </div>
        )}

        {state === 'notfound' && (
          <div className={`${c.card} border rounded-2xl p-8 text-center space-y-3`}>
            <span className="text-3xl">⚖️</span>
            <h1 className={`text-lg font-bold ${c.text}`}>This verdict is gone.</h1>
            <p className={`text-sm ${c.textSecondary}`}>Shared verdicts expire after 30 days, or this link was never valid. The argument may be over — or it may need a fresh ruling.</p>
            <Link to="/TheFinalWord" className={`inline-block mt-2 px-5 py-2.5 rounded-xl font-semibold text-sm ${c.primary}`}>⚖️ Settle a new one</Link>
          </div>
        )}

        {state === 'error' && (
          <div className={`${c.card} border rounded-2xl p-8 text-center space-y-3`}>
            <span className="text-3xl">⚠️</span>
            <h1 className={`text-lg font-bold ${c.text}`}>Couldn't load this verdict.</h1>
            <p className={`text-sm ${c.textSecondary}`}>Something went wrong on our end. Try reloading, or settle a new one.</p>
            <Link to="/TheFinalWord" className={`inline-block mt-2 px-5 py-2.5 rounded-xl font-semibold text-sm ${c.primary}`}>⚖️ Go to The Final Word</Link>
          </div>
        )}

        {state === 'ready' && verdict && (() => {
          const { kicker, headline, body, extras } = summarize(verdict);
          return (
            <div className={`${c.card} border rounded-2xl overflow-hidden shadow-sm`}>
              <div className="px-6 py-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-black uppercase tracking-widest ${c.accent}`}>⚖️ {kicker}</span>
                  <span className={`text-[10px] uppercase tracking-wider font-semibold ${c.textMuted}`}>The Final Word</span>
                </div>
                {inputSummary && <p className={`text-xs italic ${c.textMuted}`}>"{inputSummary}"</p>}
                <h1 className={`text-xl font-black leading-snug ${c.text}`}>{headline}</h1>
                {body && <p className={`text-sm leading-relaxed ${c.textSecondary}`}>{body}</p>}
                {extras.map((ex, i) => (
                  <div key={i} className={`p-3 rounded-xl border ${c.cardAlt}`}>
                    <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${c.textMuted}`}>{ex.label}</p>
                    <p className={`text-sm ${c.textSecondary}`}>{ex.value}</p>
                  </div>
                ))}
                <SourcesList sources={verdict.sources} c={c} />
              </div>
              <div className={`px-6 py-4 border-t ${isDark ? 'border-zinc-800' : 'border-[#e8e1d5]'} text-center`}>
                <Link to="/TheFinalWord" className={`inline-block px-5 py-2.5 rounded-xl font-semibold text-sm ${c.primary}`}>⚖️ Settle your own argument</Link>
              </div>
            </div>
          );
        })()}

        <p className={`text-center text-xs ${c.textMuted}`}>AI-generated — verify claims with primary sources before citing.</p>
      </div>
    </div>
  );
}
