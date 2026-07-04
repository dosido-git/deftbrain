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
 */
import React, { useState } from 'react';
import { useTheme } from '../hooks/useTheme';

const EmailCapture = () => {
  const { isDark } = useTheme();
  const [email, setEmail] = useState('');
  const [state, setState] = useState('idle'); // idle | sending | done | already | error
  const [error, setError] = useState('');

  const c = {
    bg:     isDark ? 'bg-zinc-900' : 'bg-[#faf8f5]',
    border: isDark ? 'border-zinc-800' : 'border-[#e8e1d5]',
    head:   isDark ? 'text-zinc-100' : 'text-[#1a2e44]',
    body:   isDark ? 'text-zinc-400' : 'text-[#5a544a]',
    accent: isDark ? 'text-orange-400' : 'text-[#c8872e]',
    input:  isDark
      ? 'bg-zinc-950 border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:border-orange-400'
      : 'bg-white border-[#e8e1d5] text-[#1a2e44] placeholder-[#a8a39a] focus:border-[#c8872e]',
    btn:    isDark
      ? 'bg-orange-500 text-zinc-950 hover:bg-orange-400 disabled:opacity-60'
      : 'bg-[#1a2e44] text-white hover:bg-[#2c4a6e] disabled:opacity-60',
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
    <div className={`${c.bg} border-t ${c.border} print:hidden`}>
      <div className="max-w-5xl mx-auto px-5 py-8">
        <div className="max-w-xl">
          <p className={`text-[11px] uppercase tracking-[0.18em] font-bold ${c.accent}`}>
            <span>📮</span> The Deft Brief
          </p>
          <p className={`text-sm mt-2 leading-relaxed ${c.body}`}>
            A short email about once a month: what shipped, and one tool worth
            knowing before life demands it. No spam — The Operator hates it more
            than you do. Unsubscribe in one click.
          </p>

          {(state === 'done' || state === 'already') ? (
            <p className={`text-sm font-medium mt-4 ${c.head}`}>
              {state === 'done'
                ? 'Check your inbox — confirm the email and you’re in.'
                : 'You’re already on the list. The Operator admires the enthusiasm.'}
            </p>
          ) : (
            <form onSubmit={submit} className="mt-4 flex flex-col sm:flex-row gap-2">
              <label htmlFor="db-capture-email" className="sr-only">Email address</label>
              <input
                id="db-capture-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@anywhere.com"
                autoComplete="email"
                className={`flex-1 min-w-0 px-4 py-2.5 rounded-xl border text-sm outline-none transition-colors ${c.input}`}
              />
              <button
                type="submit"
                disabled={state === 'sending'}
                className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors ${c.btn}`}
              >
                {state === 'sending' ? 'Sending…' : 'Subscribe'}
              </button>
            </form>
          )}

          {state === 'error' && (
            <p className={`text-sm mt-2 ${c.accent}`}>{error}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailCapture;
