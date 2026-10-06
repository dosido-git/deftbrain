import React, { useState, useCallback } from 'react';
import { useTheme } from '../hooks/useTheme';

/**
 * IdeaPrompt — "No tool for your problem? Describe it — we build fast."
 *
 * Demand-capture at the moments a visitor has just proven they need something
 * we don't have: search zero-results, end of the catalog, below ToolFinder's
 * recommendations, the 404 page. Asks for the PROBLEM (users know their
 * problem, not a tool design).
 *
 * Owned + privacy-clean: posts to /api/idea (logged to the metrics sink;
 * emailed to hello@ when RESEND_API_KEY is configured server-side).
 * Fire-and-forget — never blocks or errors into the page.
 *
 * Props:
 *   source  — placement id for the metrics record (e.g. "search-zero", "404")
 *   query   — the search text that came up empty; prefills the box
 *   compact — one-line variant for low-emphasis spots (below results/grid)
 *
 * App-chrome component: English by design (like FeedbackTap / DashBoard copy).
 */
export default function IdeaPrompt({ source = 'unknown', query = '', compact = false, accent = false, className = '' }) {
  const { isDark } = useTheme();
  const [open, setOpen] = useState(!compact);
  const [problem, setProblem] = useState(query);
  const [done, setDone] = useState(false);
  const [sending, setSending] = useState(false);

  const submit = useCallback(() => {
    const text = problem.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      fetch('/api/idea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem: text,
          source,
          query,
          path: typeof window !== 'undefined' ? window.location.pathname : '',
        }),
        keepalive: true,
      }).catch(() => {});
    } catch (_) { /* never surface */ }
    setDone(true);
  }, [problem, sending, source, query]);

  const c = {
    body: isDark ? 'text-zinc-400' : 'text-gray-500',
    link: isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-600 hover:text-cyan-700',
  };

  // The full box wears the site-end look (owner, 2026-10-05): the same card,
  // type, field and button as the ideas and newsletter boxes every page ends
  // with — public/site-footer.css (.site-end-*), loaded on every page.
  if (done) {
    return (
      <div className={`site-end site-end-card ${className}`}>
        <p className="site-end-msg" role="status">🙏 Got it — thank you. If we build it, it ships fast.</p>
      </div>
    );
  }

  if (compact && !open) {
    return (
      <div className={`text-center text-xs py-2 ${c.body} ${className}`}>
        Can't find what you need?{' '}
        <button onClick={() => setOpen(true)} className={`font-semibold underline underline-offset-2 ${c.link}`}>
          Suggest a tool
        </button>
      </div>
    );
  }

  return (
    <div className={`site-end site-end-card${accent ? ' site-end-card--accent' : ''} max-w-md mx-auto ${className}`}>
      <div className="site-end-part">
        <p className="site-end-text"><strong>No tool for your problem?</strong> Describe it — we build fast.</p>
        <form className="site-end-form" onSubmit={e => { e.preventDefault(); submit(); }}>
          <label className="sr-only-se" htmlFor={`idea-${source}`}>What are you trying to deal with?</label>
          <input
            id={`idea-${source}`}
            type="text"
            value={problem}
            onChange={e => setProblem(e.target.value)}
            placeholder="What are you trying to deal with?"
            maxLength={1000}
          />
          <button type="submit" disabled={!problem.trim()}>Send</button>
        </form>
      </div>
    </div>
  );
}
