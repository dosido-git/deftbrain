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
const rateText =n => (n < 1 ? `${Math.round(n * 100)}¢` : `$${Number.isInteger(n) ? n : n.toFixed(2)}`);

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
        try { sessionStorage.setItem(CODE_KEY, value); } catch (_) { /* this tab only; nothing else */ }
        if (!quiet) setTimeout(() => resultRef.current?.focus(), 120);
        return;
      }
      try { sessionStorage.removeItem(CODE_KEY); } catch (_) { /* nothing to clear */ }
      setStatus(res.status === 401 ? 'wrong' : res.status === 503 ? 'closed' : 'failed');
    } catch (_) {
      setStatus('failed');
    }
  };

  useEffect(() => {
    let saved = '';
    try { saved = sessionStorage.getItem(CODE_KEY) || ''; } catch (_) { /* no saved code */ }
    if (saved) unlock(saved, true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const mail = `mailto:${SALES}?subject=${encodeURIComponent('DeftBrain pricing for our organization')}`;

  return (
    <main className="org-page">
      <SiteHeader isDark={isDark} onToggleTheme={toggleTheme} showCurrency={false} />
      <section className="org-section org-shell">
        <div className="org-section-heading">
          <div className="org-kicker">DEFTBRAIN FOR ORGANIZATIONS</div>
          <h1 className="org-aud-title">{pricing?.org ? `Pricing for ${pricing.org}` : 'Pricing'}</h1>
          {!pricing && <p>Email <a className="org-text-link" href={mail}>{SALES}</a> from your organization address to access pricing. We'll reply with an access code for your organization.</p>}
        </div>

        {!pricing && (
          <form className="org-quote org-pricing-gate" onSubmit={e => { e.preventDefault(); unlock(code); }} aria-labelledby="org-code-title">
            <h2 id="org-code-title">Have an access code?</h2>
            <label className="org-quote-wide">Access code
              <input type="text" value={code} onChange={e => { setCode(e.target.value); if (status !== 'checking') setStatus('idle'); }} autoComplete="off" spellCheck="false" />
            </label>
            <div className="org-quote-wide org-quote-send">
              <button type="submit" className="org-btn org-btn-primary" disabled={status === 'checking' || !code.trim()}>{status === 'checking' ? 'Checking…' : 'See pricing →'}</button>
              <span role="status">
                {status === 'wrong' && 'That code didn’t match. Check it, or email us for a new one.'}
                {status === 'closed' && <>Pricing isn’t open yet. Email <a href={mail}>{SALES}</a> and we’ll send it directly.</>}
                {status === 'failed' && 'Something went wrong. Try again in a moment.'}
              </span>
            </div>
          </form>
        )}

        {pricing && (
          <div ref={resultRef} tabIndex={-1} className="org-pricing-result">
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
            <div className="org-quote org-pricing-calc">
              <label>Your organization
                <select value={aud.key} onChange={e => setAudienceKey(e.target.value)}>
                  {pricing.audiences.map(a => <option key={a.key} value={a.key}>{a.label}</option>)}
                </select>
              </label>
              <label>How many {aud.units}?
                <input type="number" min="1" inputMode="numeric" value={people} onChange={e => setPeople(e.target.value)} placeholder="10000" />
              </label>
              {aud.sizes?.length > 0 && (
                <div className="org-quote-wide org-pricing-sizes" role="group" aria-label={`Common sizes, in ${aud.units}`}>
                  {aud.sizes.map(n => (
                    <button key={n} type="button" className="org-pricing-size" aria-pressed={peopleN === n} onClick={() => setPeople(String(n))}>{compact(n)}</button>
                  ))}
                </div>
              )}
              <p className="org-quote-wide org-pricing-hint">Count {aud.counts}.</p>
              <p className="org-quote-wide org-pricing-yours" aria-live="polite">
                {quote === undefined ? 'Enter a number to see your price.'
                  : <>Your price: <strong>{usd(quote)}</strong> a year</>}
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
