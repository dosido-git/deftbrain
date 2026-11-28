import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import SiteHeader from './SiteHeader';
import { useTheme } from '../hooks/useTheme';
import { useDocumentHead } from '../hooks/useDocumentHead';
import { useNoindex } from '../hooks/useNoindex';
import './OrganizationsPage.css';

// A partner opens its own usage report with its report code (partner perk,
// owner 2026-11-27). The report comes from POST /api/partner-report
// (backend/routes/metrics.js) as printable HTML: totals only, small groups
// hidden. Nothing is kept after the tab closes.
const SALES = 'sales@deftbrain.com';

// Reports cover one finished calendar quarter (the server refuses any other
// window, so two reports can never be subtracted). The last eight, newest first.
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const finishedQuarters = (now = new Date()) => {
  let y = now.getUTCFullYear(); let q = Math.floor(now.getUTCMonth() / 3); // current quarter, 0-based
  const out = [];
  for (let i = 0; i < 8; i++) {
    if (q === 0) { y -= 1; q = 4; }
    out.push({ value: `${y}-Q${q}`, label: `${MONTHS[(q - 1) * 3]} to ${MONTHS[(q - 1) * 3 + 2]} ${y}` });
    q -= 1;
  }
  return out;
};

export default function PartnerReportPage() {
  const { isDark, toggleTheme } = useTheme();
  useDocumentHead({ title: 'Partner usage report', description: 'Usage report for DeftBrain partners, by report code.', canonicalPath: '/partners/report' });
  useNoindex();
  useEffect(() => {
    document.body.classList.add('db-sand-page');
    return () => { document.body.classList.remove('db-sand-page'); };
  }, []);

  const [code, setCode] = useState('');
  const quarters = finishedQuarters();
  const [quarter, setQuarter] = useState(quarters[0].value);
  const [report, setReport] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | checking | wrong | closed | failed
  const resultRef = useRef(null);
  const codeRef = useRef(null);

  const open = async () => {
    if (!code.trim() || status === 'checking') return;
    setStatus('checking');
    try {
      const res = await fetch('/api/partner-report', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim(), quarter }),
      });
      if (res.ok) {
        setReport(await res.json());
        setStatus('idle');
        setTimeout(() => resultRef.current?.focus(), 120);
        return;
      }
      setStatus(res.status === 401 ? 'wrong' : res.status === 503 ? 'closed' : 'failed');
    } catch (_) {
      setStatus('failed');
    }
  };

  const printable = html => {
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
    window.open(url, '_blank', 'noopener');
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  const close = () => {
    setReport(null);
    setCode('');
    setTimeout(() => codeRef.current?.focus(), 120);
  };

  return (
    <main className="org-page">
      <SiteHeader isDark={isDark} onToggleTheme={toggleTheme} showCurrency={false} />
      <section className="org-section org-shell">
        <div className="org-section-heading">
          <div className="org-kicker">DEFTBRAIN FOR ORGANIZATIONS</div>
          <h1 className="org-aud-title">{report ? `Usage report: ${report.name}` : 'Usage report'}</h1>
          {report
            ? <button type="button" className="org-pricing-signout" onClick={close}>Close report</button>
            : <p>Partners: enter your report code to see how your people are using DeftBrain. Totals only; we never see or report what anyone types.</p>}
        </div>

        {!report && (
          <form className="org-quote org-pricing-gate" onSubmit={e => { e.preventDefault(); open(); }} aria-labelledby="rp-title">
            <h2 id="rp-title">Your report code</h2>
            <label className="org-quote-wide">Report code
              <input ref={codeRef} type="text" value={code} autoComplete="off" spellCheck="false"
                onChange={e => { setCode(e.target.value); if (status !== 'checking') setStatus('idle'); }}
                onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); open(); } }} />
            </label>
            <label className="org-quote-wide">Quarter<select value={quarter} onChange={e => setQuarter(e.target.value)}>{quarters.map(q => <option key={q.value} value={q.value}>{q.label}</option>)}</select></label>
            <p className="org-quote-wide org-price-small">Reports cover whole quarters that have ended, so no two reports overlap and nobody can be singled out by comparing them. For a pilot's midpoint or final report, email us.</p>
            <div className="org-quote-wide org-quote-send">
              <button type="submit" className="org-btn org-btn-primary" disabled={status === 'checking' || !code.trim()}>{status === 'checking' ? 'Checking…' : 'See report →'}</button>
              <span role="status">
                {status === 'wrong' && 'That code didn’t match. Check it, or email us for a new one.'}
                {status === 'closed' && <>Reports aren’t open yet. Email <a href={`mailto:${SALES}`}>{SALES}</a> and we’ll send yours.</>}
                {status === 'failed' && 'Something went wrong. Try again in a moment.'}
              </span>
            </div>
          </form>
        )}

        {report && (
          <div ref={resultRef} tabIndex={-1} className="org-pricing-result">
            <p className="org-pricing-actions">
              <button type="button" className="org-btn org-btn-primary" onClick={() => printable(report.html)}>Open printable report ↗</button>
              {report.funderHtml && <button type="button" className="org-btn org-btn-outline" onClick={() => printable(report.funderHtml)}>One-page summary for funders ↗</button>}
            </p>
            <iframe title={`Usage report: ${report.name}`} srcDoc={report.html} sandbox="" style={{ width: '100%', minHeight: '1400px', border: '1px solid var(--line)', borderRadius: '14px', background: '#fff' }} />
          </div>
        )}

        <p className="org-price-small"><Link className="org-text-link" to="/organizations">← DeftBrain for Organizations</Link></p>
      </section>
    </main>
  );
}
