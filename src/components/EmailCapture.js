/**
 * EmailCapture — site-wide subscription band ("Dispatches from The Operator").
 * ───────────────────────────────────────────────────────────────────────────
 * Renders between RelatedLinks and Footer in the app shell, so it appears on
 * every React page (homepage, all tools, 404). Static pages (guides, about,
 * privacy, terms) carry the equivalent build-time band from src/seo/chrome.js
 * — keep the copy in sync when editing either.
 *
 * Like Footer/RelatedLinks, the band carries its OWN themed background: the
 * app shell behind it is always white, so theme-following text needs a
 * theme-following backdrop.
 *
 * POSTs to /api/subscribe (first-party — no third-party embed or script);
 * the backend forwards to Buttondown, which handles double opt-in.
 *
 * PRINTS. This band, RelatedLinks and Footer all used to carry `print:hidden`,
 * so a printed page stopped dead after the last tool row. On paper the reader
 * has no address bar and cannot click anything, which makes the tail of the
 * page MORE useful in print, not less — it is where the site name, the URL,
 * the guide links and what the newsletter is all live. Tool pages still strip
 * their chrome via data-print-hide, which none of these three use.
 *
 * 2026-08-20: all three were given data-print-hide anyway. The reasoning was
 * that a tool print-out ended with a page of navigation — true, but the page
 * of navigation was the point, and this comment said so. Reverted the same
 * day, on the owner's report that the footer had gone missing. What stays
 * hidden is the db-tool-index strip: the collapsed A-Z link wall exists for
 * crawlers, and DashBoard has hidden it in print for exactly that reason.
 */
import React, { useState } from 'react';
import { useTheme } from '../hooks/useTheme';

const EmailCapture = () => {
  const { isDark } = useTheme();
  const [email, setEmail] = useState('');
  const [state, setState] = useState('idle'); // idle | sending | done | already | error
  const [error, setError] = useState('');

  const c = {
    bg:     isDark ? 'bg-zinc-950' : 'bg-[#f2ece1]',
    border: isDark ? 'border-zinc-800' : 'border-[#e8e1d5]',
    head:   isDark ? 'text-zinc-100' : 'text-[#1a2e44]',
    body:   isDark ? 'text-zinc-400' : 'text-[#5a544a]',
    accent: isDark ? 'text-orange-400' : 'text-[#c8872e]',
    input:  isDark
      ? 'bg-zinc-900 border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:border-orange-400'
      : 'bg-white border-[#d8d0c2] text-[#1a2e44] placeholder-[#a8a39a] focus:border-[#c8872e]',
    btn:    isDark
      ? 'bg-orange-500 text-zinc-950 hover:bg-orange-400 disabled:opacity-60'
      : 'bg-[#1a2e44] text-white hover:bg-[#165b9a] disabled:opacity-60',
  };

  const submit = async (e) => {
    e.preventDefault();
    if (state === 'sending') return;
    setState('sending');
    setError('');
    try {
      const r = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: window.location.pathname }),
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok && d.ok) {
        setState(d.already ? 'already' : 'done');
      } else {
        setError(d.error || 'Something went wrong — try again.');
        setState('error');
      }
    } catch {
      setError('Something went wrong — try again.');
      setState('error');
    }
  };

  return (
    <div className={`${c.bg} border-y ${c.border}`}>
      <div className="max-w-7xl mx-auto px-5 py-5 sm:py-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6">
          <div className="lg:flex lg:items-baseline lg:gap-4 lg:flex-1 min-w-0">
            <p className={`shrink-0 text-[11px] uppercase tracking-[0.16em] font-bold ${c.accent}`}>
              <span>📮</span> Before you go
            </p>
            <p className={`text-sm mt-1.5 lg:mt-0 leading-relaxed ${c.body}`}>
              One useful tool a month — the one worth knowing about before life demands it.
            </p>
          </div>

          {(state === 'done' || state === 'already') ? (
            <p className={`text-sm font-medium lg:text-right ${c.head}`}>
              {state === 'done'
                ? 'Check your inbox — confirm the email and you’re in.'
                : 'You’re already on the list. The Operator admires the enthusiasm.'}
            </p>
          ) : (
            <form onSubmit={submit} className="flex w-full lg:w-auto lg:min-w-[360px] gap-2">
              <label htmlFor="db-capture-email" className="sr-only">Email address</label>
              <input
                id="db-capture-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@anywhere.com"
                autoComplete="email"
                className={`flex-1 min-w-0 px-3.5 py-2 rounded-lg border text-sm outline-none transition-colors ${c.input}`}
              />
              <button
                type="submit"
                disabled={state === 'sending'}
                className={`shrink-0 px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${c.btn}`}
              >
                {state === 'sending' ? 'Sending…' : 'Subscribe'}
              </button>
            </form>
          )}
        </div>

        {state === 'error' && (
          <p className={`text-sm mt-2 lg:text-right ${c.accent}`}>{error}</p>
        )}
      </div>
    </div>
  );
};

export default EmailCapture;
