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

// The price rule (owner, 2026-11-26): a per-person rate for the first people,
// a lower rate after that, and a minimum. Same rule as the spreadsheet's Tiers
// "The price you quote". The numbers come from the server with the prices.
function quoteFor(people, rule) {
  const first = Math.min(people, rule.upTo) * rule.perPerson;
  const after = Math.max(0, people - rule.upTo) * rule.perPersonAfter;
  return Math.max(rule.minimum, Math.round((first + after) / 10) * 10);
}
const cents = n => `${Math.round(n * 100)}¢`;

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
  const quote = pricing && peopleN > 0 ? quoteFor(peopleN, pricing.rule) : undefined;

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
            <p className="org-pricing-rule"><strong>{cents(pricing.rule.perPerson)} per person a year</strong>, with a minimum of {usd(pricing.rule.minimum)}. Past the first {pricing.rule.upTo.toLocaleString('en-US')} people, {cents(pricing.rule.perPersonAfter)} each.</p>
            <div className="org-table-wrap">
              <table className="org-pricing-table">
                <thead><tr><th scope="col">People served</th><th scope="col">Price per year</th></tr></thead>
                <tbody>{pricing.examples.map(n => (
                  <tr key={n}><th scope="row">{n.toLocaleString('en-US')}</th><td>{usd(quoteFor(n, pricing.rule))}</td></tr>
                ))}</tbody>
              </table>
            </div>
            <div className="org-quote org-pricing-calc">
              <label className="org-quote-wide">How many people does your organization serve?
                <input type="number" min="1" inputMode="numeric" value={people} onChange={e => setPeople(e.target.value)} placeholder="60000" />
              </label>
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
