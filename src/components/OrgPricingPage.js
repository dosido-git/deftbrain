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

// Quote by exact size (owner, 2026-11-26): a straight line between the prices
// of the sizes around it, so crossing a row never jumps. Below the smallest
// size the first price applies; above the largest it is quoted (null).
// Same rule as the spreadsheet's Tiers "Quote by exact size".
function quoteFor(people, sizes) {
  const pts = [...sizes].sort((x, y) => x.people - y.people);
  if (people <= pts[0].people) return pts[0].annual;
  for (let i = 1; i < pts.length; i++) {
    const lo = pts[i - 1], hi = pts[i];
    if (people <= hi.people) return Math.round((lo.annual + (people - lo.people) / (hi.people - lo.people) * (hi.annual - lo.annual)) / 10) * 10;
  }
  return null;
}

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
  const quote = pricing && peopleN > 0 ? quoteFor(peopleN, pricing.sizes) : undefined;

  const unlock = async (value, quiet) => {
    if (!value.trim()) return;
    setStatus('checking');
    try {
      const res = await fetch('/api/pricing-access', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: value }),
      });
      if (res.ok) {
        setPricing(await res.json());
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
                <thead><tr><th scope="col">People served</th><th scope="col">Price per year</th></tr></thead>
                <tbody>{pricing.sizes.map(s => (
                  <tr key={s.label}><th scope="row">{s.label}</th><td>{usd(s.annual)}</td></tr>
                ))}</tbody>
              </table>
            </div>
            <div className="org-quote org-pricing-calc">
              <label className="org-quote-wide">How many people does your organization serve?
                <input type="number" min="1" inputMode="numeric" value={people} onChange={e => setPeople(e.target.value)} placeholder="60000" />
              </label>
              <p className="org-quote-wide org-pricing-yours" aria-live="polite">
                {quote === undefined ? 'Enter a number to see your price.'
                  : quote === null ? <>Over 1,000,000 people is quoted: email <a className="org-text-link" href={mail}>{SALES}</a>.</>
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
