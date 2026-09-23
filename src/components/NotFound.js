import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { TOOL_COUNT_LABEL } from '../data/toolCount';
import { TOOL_FINDER_PAUSED } from '../data/toolFinderPaused';
import IdeaPrompt from './IdeaPrompt';

const NotFound = ({
  headline = "This page doesn't exist.",
  message = `Unusual, for a site with ${TOOL_COUNT_LABEL} tools — but here we are. Whatever you were actually looking for, one of them probably handles it.`,
}) => {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const c = {
    bg:        isDark ? 'bg-zinc-950' : 'bg-[#faf8f5]',
    card:      isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-[#e8e1d5]',
    heading:   isDark ? 'text-zinc-100' : 'text-[#1a2e44]',
    accent:    isDark ? 'text-orange-400' : 'text-[#c8872e]',
    body:      isDark ? 'text-zinc-400' : 'text-[#5a544a]',
    primary:   isDark
      ? 'bg-orange-500 text-zinc-950 hover:bg-orange-400'
      : 'bg-[#1a2e44] text-white hover:bg-[#2c4a6e]',
    secondary: isDark
      ? 'bg-zinc-900 text-zinc-200 border-zinc-700 hover:border-orange-400 hover:text-orange-400'
      : 'bg-white text-[#1a2e44] border-[#e8e1d5] hover:border-[#c8872e] hover:text-[#c8872e]',
  };

  const [reportState, setReportState] = useState('idle'); // 'idle' | 'sent'

  // Reuses the same /api/idea capture pipe as IdeaPrompt (logged to the
  // metrics sink, emailed to hello@ when configured) under a distinct
  // `source` so it's tellable apart from tool-idea submissions. One click,
  // no typing required — path + referrer are already the useful signal.
  const reportBrokenLink = useCallback(() => {
    if (reportState === 'sent') return;
    try {
      fetch('/api/idea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem: 'Broken link reported from the 404 page',
          source: '404-broken-link',
          query: typeof document !== 'undefined' ? (document.referrer || '(no referrer)') : '',
          path: typeof window !== 'undefined' ? window.location.pathname : '',
        }),
        keepalive: true,
      }).catch(() => {});
    } catch (_) { /* never surface */ }
    setReportState('sent');
  }, [reportState]);

  return (
    <div className={`min-h-screen ${c.bg} flex items-center justify-center p-6`}>
      <div className={`text-center space-y-5 ${c.card} border p-10 sm:p-12 rounded-2xl shadow-sm max-w-md w-full`}>
        {/* Was inert (plain divs, no onClick) — every other logo on the site
            goes home on click, this is the one 404 users specifically land
            on and it wasn't one of them. `navigate`, not <Link>: this file
            already uses it for the explicit Home button below, no need for
            a second navigation primitive. */}
        <button
          type="button"
          onClick={() => navigate('/')}
          aria-label="DeftBrain — home"
          className="flex flex-col items-center gap-2 mx-auto animate-[brand-spin-rest_3s_infinite] motion-reduce:animate-none"
        >
          {/* Footer-standard size (2026-09-22) — this is a "brand mark on
              the bottom of a page" occasion, not a page header, even though
              it sits at the top of the 404 card: same size/no-tagline
              treatment as Footer.js, just recolored blue "Deft" + gold
              "Brain" to match the site-wide split. */}
          <img
            src="/pBrain-l.png"
            alt=""
            className="h-16 w-auto object-contain"
          />
          <span
            className="text-sm font-extrabold leading-none tracking-tight"
            style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
          >
            <span className={isDark ? 'text-[#a8b9ce]' : 'text-[#2c4a6e]'}>Deft</span>
            <span className={isDark ? 'text-[#d9a04e]' : 'text-[#c8872e]'}>Brain</span>
          </span>
        </button>
        <div>
          <h1 className={`text-6xl font-bold tracking-tight ${c.heading}`}>
            4<span className={c.accent}>0</span>4
          </h1>
          <p className={`text-sm font-medium mt-3 ${c.heading}`}>
            {headline}
          </p>
          <p className={`text-sm mt-2 leading-relaxed ${c.body}`}>
            {message}
          </p>
        </div>

        <div className="space-y-3 pt-1">
          {!TOOL_FINDER_PAUSED && (
            <button
              onClick={() => navigate('/ToolFinder')}
              className={`w-full py-3.5 ${c.primary} rounded-xl font-semibold transition-colors`}
            >
              🔎 Use Tool Finder
            </button>
          )}
          <button
            onClick={() => navigate('/')}
            className={`w-full py-3 ${TOOL_FINDER_PAUSED ? c.primary : `${c.secondary} border`} rounded-xl font-semibold transition-colors`}
          >
            Browse all tools
          </button>
          {/* Anchor (not navigate) — /guides is server-rendered, not a React route */}
          <a
            href="/guides"
            className={`block w-full py-3 ${c.secondary} border rounded-xl font-semibold transition-colors text-center`}
          >
            Read the guides
          </a>
          {/* Demand capture — they expected something at this URL; full card (not
              compact) so the ask is prominent */}
          <IdeaPrompt source="404" accent className="mt-4 border-2" />

          {/* Low-emphasis — this is a bug report, not the primary ask on the page */}
          <p className="text-center text-xs pt-1">
            {reportState === 'sent' ? (
              <span className={c.body}>✅ Thanks — we'll take a look.</span>
            ) : (
              <button
                onClick={reportBrokenLink}
                className={`underline underline-offset-2 ${isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-gray-400 hover:text-gray-600'}`}
              >
                🔗 Report this broken link
              </button>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
