import React, { useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { useDocumentHead } from '../hooks/useDocumentHead';
import NotFound from './NotFound';
import { ToolMiniCard } from './OrganizationsPage';
import PARTNERS from '../data/partners.json';
import './OrganizationsPage.css';
import './PartnerPage.css';

// Co-branded starting page for an organization: /for/<partner>.
// One template, filled from src/data/partners.json (the server reads the same
// file to answer 200 vs 404). Partner pages are noindex: they repeat public
// tool pages for one audience and exist to be linked from the partner's own
// channels. Attribution needs nothing extra — analytics already records the
// landing path (/for/<partner>) for the whole session.
export default function PartnerPage({ allTools = [] }) {
  const { partnerId } = useParams();
  const partner = Object.prototype.hasOwnProperty.call(PARTNERS, partnerId) ? PARTNERS[partnerId] : null;
  const { isDark, toggleTheme } = useTheme();
  const byId = useMemo(() => Object.fromEntries(allTools.map(t => [t.id, t])), [allTools]);

  useDocumentHead({
    title: partner ? `${partner.name} — ${partner.packageTitle}` : 'Page not found',
    description: partner?.intro,
    canonicalPath: `/for/${partnerId}`,
  });

  useEffect(() => {
    document.body.classList.add('db-sand-page');
    // index.html ships "index, follow"; flip it while here, restore on leave.
    let robots = document.querySelector('meta[name="robots"]');
    const before = robots?.getAttribute('content');
    if (!robots) { robots = document.createElement('meta'); robots.name = 'robots'; document.head.appendChild(robots); }
    robots.setAttribute('content', 'noindex');
    return () => {
      document.body.classList.remove('db-sand-page');
      if (before == null) robots.remove(); else robots.setAttribute('content', before);
    };
  }, []);

  if (!partner) return <NotFound />;
  const tools = partner.tools.map(id => byId[id]).filter(Boolean);

  return (
    <main className="org-page partner-page">
      <header className="partner-bar">
        <div className="org-shell partner-bar-inner">
          <div className="partner-brand">
            <span className="partner-badge" aria-hidden="true">{partner.initials}</span>
            <span className="partner-name">{partner.name}</span>
          </div>
          <div className="partner-bar-end">
            <Link className="partner-with" to="/">with <b>Deft</b><b className="gold">Brain</b></Link>
            <button type="button" className="org-theme-toggle" onClick={toggleTheme} aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
              <span aria-hidden="true">{isDark ? '☀️' : '🌙'}</span>
            </button>
          </div>
        </div>
      </header>

      <section className="org-shell partner-main">
        {partner.sample && <p className="partner-sample">Sample page — the organization and phone number are fictional.</p>}
        <h1>{partner.packageTitle}</h1>
        <p className="partner-intro">{partner.intro}</p>
        <p className="partner-privacy"><span aria-hidden="true">🔒</span> Free and private, no account needed. {partner.name} sees only overall usage counts, never what you type. Please don't enter account numbers or passwords.</p>

        <div className="partner-grid">{tools.map(t => <ToolMiniCard key={t.id} tool={t} />)}</div>

        {partner.help && (
          <p className="partner-help">
            <span aria-hidden="true">📞</span> {partner.help.text}
            {partner.help.phone && <> <a href={`tel:${partner.help.phone.replace(/[^\d+]/g, '')}`}>{partner.help.phone}</a></>}
          </p>
        )}

        <Link className="org-text-link partner-more" to="/tools">Explore more guidance from DeftBrain →</Link>

        <p className="partner-foot">
          Guidance to widen your view, not a verdict.{partner.advisor ? ` ${partner.advisor}` : ''}
          <br />Provided by DeftBrain · <a href="/privacy">Privacy</a> · <a href="/contact">Report a problem</a>
        </p>
      </section>
    </main>
  );
}
