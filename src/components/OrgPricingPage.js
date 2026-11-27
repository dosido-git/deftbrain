import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import SiteHeader from './SiteHeader';
import { useTheme } from '../hooks/useTheme';
import { useDocumentHead } from '../hooks/useDocumentHead';
import { useNoindex } from '../hooks/useNoindex';
import { formatCurrency } from '../utils/formatLocale';
import './OrganizationsPage.css';

// Organization pricing behind an access code (owner, 2026-11-26). The prices
// come from POST /api/pricing-access (backend/routes/pricing-access.js) and
// only for the right code, so they are never in this bundle. The code is kept
// for this tab only, so a refresh doesn't ask again.
const SALES = 'sales@deftbrain.com';
const CODE_KEY = 'deft:pricing-code';
// Signed out after 15 minutes without a click or key (owner, 2026-11-26), and
// the saved code is dropped too, so a shared screen doesn't stay open.
const SEEN_KEY = 'deft:pricing-seen';
const IDLE_MIN = 15;
const IDLE_MS = IDLE_MIN * 60 * 1000;

// Prices are set in US dollars whatever the visitor's locale.
const usd = n => formatCurrency(n, 'en-US', 'USD');

// Prices by audience (owner, 2026-11-26): each audience has a per-person rate
// for the first 100,000 people, a third of it after that, and a minimum. Rates
// come from the server with the rest of the prices (pricing model, "Market by
// audience"). A code can carry the organization's audience, which opens there.
function quoteFor(people, a, upTo) {
  const first = Math.min(people, upTo) * a.perPerson;
  const after = Math.max(0, people - upTo) * a.perPersonAfter;
  return Math.max(a.minimum, Math.round((first + after) / 10) * 10);
}
const compact = n => new Intl.NumberFormat('en-US', { notation: 'compact' }).format(n);
// What the quote works out to per person: the minimum and the lower rate past
// 100,000 make it differ from the listed rate. Under 10¢ keeps a decimal.
const perText = n => {
  if (n >= 1) return `$${n.toFixed(2)}`;
  const c = n * 100;
  return `${c < 10 ? Number(c.toFixed(1)) : Math.round(c)}¢`;
};
const rateText = n =>(n < 1 ? `${Math.round(n * 100)}¢` : `$${Number.isInteger(n) ? n : n.toFixed(2)}`);

export default function OrgPricingPage() {
  const { isDark, toggleTheme } = useTheme();
  useDocumentHead({ title: 'Pricing for Organizations', description: 'DeftBrain pricing for organizations, by access code.', canonicalPath: '/organizations/pricing' });
  useNoindex();
  useEffect(() => {
    document.body.classList.add('db-sand-page');
    return () => { document.body.classList.remove('db-sand-page'); };
  }, []);

  const [code, setCode] = useState('');
  const [pricing, setPricing] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | checking | wrong | closed | failed
  const resultRef = useRef(null);
  const codeRef = useRef(null);
  const [people, setPeople] = useState('');
  const peopleN = Math.floor(Number(people));
  const [audienceKey, setAudienceKey] = useState('');
  const aud = pricing ? (pricing.audiences.find(a => a.key === audienceKey) || pricing.audiences[0]) : null;
  const quote = aud && peopleN > 0 ? quoteFor(peopleN, aud, pricing.upTo) : undefined;

  const unlock = async (value, quiet) => {
    if (!value.trim()) return;
    setStatus('checking');
    try {
      const res = await fetch('/api/pricing-access', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: value }),
      });
      if (res.ok) {
        const data = await res.json();
        setPricing(data);
        setAudienceKey(data.audience || data.audiences[0].key);
        setStatus('idle');
        try { sessionStorage.setItem(CODE_KEY, value); sessionStorage.setItem(SEEN_KEY, String(Date.now())); } catch (_) { /* this tab only; nothing else */ }
        if (!quiet) setTimeout(() => resultRef.current?.focus(), 120);
        return;
      }
      try { sessionStorage.removeItem(CODE_KEY); } catch (_) { /* nothing to clear */ }
      setStatus(res.status === 401 ? 'wrong' : res.status === 503 ? 'closed' : 'failed');
    } catch (_) {
      setStatus('failed');
    }
  };

  const signOut = reason => {
    try { sessionStorage.removeItem(CODE_KEY); sessionStorage.removeItem(SEEN_KEY); } catch (_) { /* nothing to clear */ }
    setPricing(null);
    setCode('');
    setPeople('');
    setStatus(reason);
    setTimeout(() => codeRef.current?.focus(), 120);
  };

  useEffect(() => {
    let saved = '';
    let seen = 0;
    try { saved = sessionStorage.getItem(CODE_KEY) || ''; seen = Number(sessionStorage.getItem(SEEN_KEY)) || 0; } catch (_) { /* no saved code */ }
    if (!saved) return;
    if (Date.now() - seen < IDLE_MS) unlock(saved, true);
    else signOut('timedout');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // While pricing is open, any click or key counts as activity. A check every
  // 30s (and on returning to the tab) also catches a laptop that slept.
  useEffect(() => {
    if (!pricing) return undefined;
    const touch = () => { try { sessionStorage.setItem(SEEN_KEY, String(Date.now())); } catch (_) { /* best effort */ } };
    const check = () => {
      let seen = 0;
      try { seen = Number(sessionStorage.getItem(SEEN_KEY)) || 0; } catch (_) { /* treat as idle */ }
      if (Date.now() - seen >= IDLE_MS) signOut('timedout');
    };
    const onVisible = () => { if (document.visibilityState === 'visible') check(); };
    window.addEventListener('pointerdown', touch);
    window.addEventListener('keydown', touch);
    document.addEventListener('visibilitychange', onVisible);
    const timer = setInterval(check, 30000);
    return () => {
      window.removeEventListener('pointerdown', touch);
      window.removeEventListener('keydown', touch);
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(timer);
    };
  }, [pricing]); // eslint-disable-line react-hooks/exhaustive-deps

  const mail = `mailto:${SALES}?subject=${encodeURIComponent('DeftBrain pricing for our organization')}`;

  return (
    <main className="org-page">
      <SiteHeader isDark={isDark} onToggleTheme={toggleTheme} showCurrency={false} />
      <section className="org-section org-shell">
        <div className="org-section-heading">
          <div className="org-kicker">DEFTBRAIN FOR ORGANIZATIONS</div>
          <h1 className="org-aud-title">{pricing?.org ? `Pricing for ${pricing.org}` : 'Pricing'}</h1>
          {pricing && <button type="button" className="org-pricing-signout" onClick={() => signOut('signedout')}>Sign out</button>}
          {!pricing && <p>Email <a className="org-text-link" href={mail}>{SALES}</a> from your organization address to access pricing. We'll reply with an access code for your organization.</p>}
        </div>

        {!pricing && (
          <form className="org-quote org-pricing-gate" onSubmit={e => { e.preventDefault(); unlock(code); }} aria-labelledby="org-code-title">
            <h2 id="org-code-title">Have an access code?</h2>
            <label className="org-quote-wide">Access code
              <input ref={codeRef} type="text" value={code} onKeyDown={e => {
                // Return or ⌘/Ctrl-Return submits even where a browser skips implicit form submission.
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); if (status !== 'checking') unlock(code); }
              }} onChange={e => { setCode(e.target.value); if (status !== 'checking') setStatus('idle'); }} autoComplete="off" spellCheck="false" />
            </label>
            <div className="org-quote-wide org-quote-send">
              <button type="submit" className="org-btn org-btn-primary" disabled={status === 'checking' || !code.trim()}>{status === 'checking' ? 'Checking…' : 'See pricing →'}</button>
              <span role="status">
                {status === 'wrong' && 'That code didn’t match. Check it, or email us for a new one.'}
                {status === 'closed' && <>Pricing isn’t open yet. Email <a href={mail}>{SALES}</a> and we’ll send it directly.</>}
                {status === 'failed' && 'Something went wrong. Try again in a moment.'}
                {status === 'signedout' && 'Signed out.'}
                {status === 'timedout' && `Signed out after ${IDLE_MIN} minutes without activity. Enter your code to see pricing again.`}
              </span>
            </div>
          </form>
        )}

        {pricing && (
          <div ref={resultRef} tabIndex={-1} className="org-pricing-result">
            {pricing.audiences.length > 1 && (
            <div className="org-table-wrap">
              <table className="org-pricing-table">
                <thead><tr><th scope="col">Organization</th><th scope="col">Per person a year</th><th scope="col">Minimum a year</th></tr></thead>
                <tbody>{pricing.audiences.map(a => (
                  <tr key={a.key} className={a.key === aud.key ? 'is-yours' : undefined}>
                    <th scope="row">{a.label}</th><td>{rateText(a.perPerson)} per {a.unit}</td><td>{usd(a.minimum)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            )}
            <div className="org-quote org-pricing-calc">
              {pricing.audiences.length > 1 && (
                <label>Your organization
                  <select value={aud.key} onChange={e => setAudienceKey(e.target.value)}>
                    {pricing.audiences.map(a => <option key={a.key} value={a.key}>{a.label}</option>)}
                  </select>
                </label>
              )}
              <label>How many {aud.units}?
                {aud.counts && <span className="org-pricing-hint">{aud.counts}</span>}
                <input type="number" min="1" inputMode="numeric" value={people} onChange={e => setPeople(e.target.value)} placeholder="10000" />
              </label>
              {aud.sizes?.length > 0 && (
                <div className="org-quote-wide org-pricing-sizes" role="group" aria-label={`Common sizes, in ${aud.units}`}>
                  {aud.sizes.map(n => (
                    <button key={n} type="button" className="org-pricing-size" aria-pressed={peopleN === n} onClick={() => setPeople(String(n))}>{compact(n)}</button>
                  ))}
                </div>
              )}
              <p className="org-quote-wide org-pricing-hint">Minimum {usd(aud.minimum)} a year.</p>
              <p className="org-quote-wide org-pricing-yours" aria-live="polite">
                {quote === undefined ? 'Enter a number to see your price.'
                  : <>Your price: <strong>{usd(quote)}</strong> a year, or <strong>{perText(quote / peopleN)}</strong> per {aud.unit}</>}
              </p>
            </div>
            <ul className="org-pricing-notes">{pricing.notes.map(n => <li key={n}>{n}</li>)}</ul>
            <p className="org-price-small">Prices in {pricing.currency}. Questions? <a className="org-text-link" href={mail}>{SALES}</a></p>
          </div>
        )}

        <p className="org-price-small"><Link className="org-text-link" to="/organizations">← DeftBrain for Organizations</Link></p>
      </section>
    </main>
  );
}
