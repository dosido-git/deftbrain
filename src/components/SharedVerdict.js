// A verdict shared from The Final Word (handleCreateShareLink) lands here
// when someone opens the copied link. Standalone page, not a "tool" — no
// ToolPageWrapper, no catalog lookup.
//
// The verdict is encoded directly into `id` (see src/utils/shareEncode.js)
// rather than looked up from a server-side record. Two earlier versions
// stored it server-side — first in memory, then in a JSON file — and both
// 404'd once the backend process (in production, the whole container) had
// cycled since the link was created. A link that carries its own data
// can't go stale that way.
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { decodeSharePayload } from '../utils/shareEncode';
import BrandMark from './BrandMark';

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
// English-only labels — this page isn't wired into the i18n system, same
// as its headline/body text below. Mirrors TheFinalWord.js's
// SUPPORT_LABEL_KEY / getSupportLabel (kept in sync by hand; there's no
// shared module between a localized tool component and this standalone,
// unlocalized page).
const SUPPORT_LABEL = {
  strongly_supported: 'Strongly supported',
  mostly_supported: 'Mostly supported',
  partly_supported: 'Partly supported',
  weakly_supported: 'Weakly supported',
  not_supported: 'Not supported',
};

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
        verdict.score?.person_a && { label: verdict.score.person_a.name, value: `${SUPPORT_LABEL[verdict.score.person_a.support] || 'Partly supported'} — ${verdict.score.person_a.what_they_got_right}` },
        verdict.score?.person_b && { label: verdict.score.person_b.name, value: `${SUPPORT_LABEL[verdict.score.person_b.support] || 'Partly supported'} — ${verdict.score.person_b.what_they_got_right}` },
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
  // Decoding is synchronous and pure — computed once per `id` via the
  // lazy initializer, no request and no loading state to show.
  const [payload] = useState(() => decodeSharePayload(id));
  const state = payload?.verdict ? 'ready' : 'notfound';
  const verdict = payload?.verdict || null;
  const inputSummary = payload?.inputSummary || '';

  const c = {
    bg: isDark ? 'bg-zinc-950' : 'bg-[#faf8f5]',
    card: isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-[#e8e1d5]',
    cardAlt: isDark ? 'bg-zinc-800/60 border-zinc-700' : 'bg-slate-50 border-slate-200',
    text: isDark ? 'text-zinc-100' : 'text-[#1a2e44]',
    textSecondary: isDark ? 'text-zinc-300' : 'text-[#3a3530]',
    textMuted: isDark ? 'text-zinc-500' : 'text-[#8a8378]',
    accent: isDark ? 'text-amber-400' : 'text-[#c8872e]',
    primary: isDark ? 'bg-amber-500 text-zinc-950 hover:bg-amber-400' : 'bg-[#1a2e44] text-white hover:bg-[#165b9a]',
  };

  return (
    <div className={`min-h-screen ${c.bg} px-4 py-10 sm:py-16`}>
      <div className="max-w-xl mx-auto space-y-5">
        {/* Full left-facing logo (2026-09-22 site-wide standard) — this page
            has no other chrome (no ToolPageWrapper, no dashboard nav), so
            it's the page's only header; upgraded from a small tagline-less
            mark to the real BrandMark, matching every other page header. */}
        <Link to="/" className="flex justify-center mb-2">
          <BrandMark direction="right" size="sm" isDark={isDark} showTagline />
        </Link>

        {state === 'notfound' && (
          <div className={`${c.card} border rounded-2xl p-8 text-center space-y-3`}>
            <span className="text-3xl">⚖️</span>
            <h1 className={`text-lg font-bold ${c.text}`}>This isn't a valid verdict link.</h1>
            <p className={`text-sm ${c.textSecondary}`}>The link may have been cut off in copying, or mistyped. Settle a new one and share the full link this time.</p>
            <Link to="/TheFinalWord" className={`inline-block mt-2 px-5 py-2.5 rounded-xl font-semibold text-sm ${c.primary}`}>⚖️ Settle a new one</Link>
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
