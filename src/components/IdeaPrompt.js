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
export default function IdeaPrompt({ source = 'unknown', query = '', compact = false, className = '' }) {
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
    wrap:  isDark ? 'border-zinc-700' : 'border-gray-200',
    title: isDark ? 'text-zinc-100' : 'text-gray-900',
    body:  isDark ? 'text-zinc-400' : 'text-gray-500',
    input: isDark ? 'bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500' : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400',
    send:  isDark ? 'bg-cyan-600 hover:bg-cyan-500 text-white' : 'bg-cyan-600 hover:bg-cyan-700 text-white',
    link:  isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-600 hover:text-cyan-700',
  };

  if (done) {
    return (
      <div className={`text-center text-sm py-3 ${c.body} ${className}`}>
        🙏 Got it — thank you. If we build it, it ships fast.
      </div>
    );
  }

  if (compact && !open) {
    return (
      <div className={`text-center text-xs py-2 ${c.body} ${className}`}>
        None of these fit?{' '}
        <button onClick={() => setOpen(true)} className={`font-semibold underline underline-offset-2 ${c.link}`}>
          Tell us what you're stuck on
        </button>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border p-4 max-w-md mx-auto ${c.wrap} ${className}`}>
      <p className={`text-sm font-bold ${c.title}`}>No tool for your problem?</p>
      <p className={`text-xs mt-0.5 mb-3 ${c.body}`}>Describe it — we build fast.</p>
      <div className="flex gap-2">
        <input
          type="text"
          value={problem}
          onChange={e => setProblem(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') submit(); }}
          placeholder="What are you trying to deal with?"
          className={`flex-1 px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 ${c.input}`}
        />
        <button onClick={submit} disabled={!problem.trim()} className={`${c.send} px-4 py-2 rounded-lg text-xs font-bold min-h-[36px] disabled:opacity-40`}>
          Send
        </button>
      </div>
    </div>
  );
}
