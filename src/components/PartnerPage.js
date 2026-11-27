import React, { useEffect, useMemo } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { useDocumentHead } from '../hooks/useDocumentHead';
import { useNoindex } from '../hooks/useNoindex';
import NotFound from './NotFound';
import { ToolMiniCard } from './OrganizationsPage';
import { resolvePartner, rememberPartner } from '../hooks/usePartner';
import './OrganizationsPage.css';
import './PartnerPage.css';

// Co-branded starting page for an organization: /for/<partner>.
// One template, filled from src/data/partners.json (the server reads the same
// file to answer 200 vs 404). Partner pages are noindex: they repeat public
// tool pages for one audience and exist to be linked from the partner's own
// channels. Attribution needs nothing extra — analytics already records the
// landing path (/for/<partner>) for the whole session.
export default function PartnerPage({ allTools = [] }) {
  // /for/<partner>, or /for/<consortium>/<member> for a member of a consortium.
  const { partnerId: first, memberId } = useParams();
  const partnerId = memberId ? `${first}/${memberId}` : first;
  const partner = resolvePartner(partnerId);
  const { isDark, toggleTheme } = useTheme();
  const byId = useMemo(() => Object.fromEntries(allTools.map(t => [t.id, t])), [allTools]);

  useDocumentHead({
    title: partner ? `${partner.name} — ${partner.packageTitle}` : 'Page not found',
    description: partner?.intro,
    canonicalPath: `/for/${partnerId}`,
  });

  useNoindex();
  useEffect(() => {
    document.body.classList.add('db-sand-page');
    // index.html skips Google Analytics when the visit starts here; this covers
    // arriving by in-app navigation (gtag's documented per-property kill switch).
    window['ga-disable-G-0MLY19QEW6'] = true;
    rememberPartner(partnerId); // the tools this visit opens show this partner's contacts
    return () => {
      window['ga-disable-G-0MLY19QEW6'] = false;
      document.body.classList.remove('db-sand-page');
    };
  }, [partnerId]);

  if (!partner) return <NotFound />;
  if (partner.retired) return <Navigate to="/tools" replace />; // ended partnership: keep printed links alive
  const tools = partner.tools.map(id => byId[id]).filter(Boolean);

  return (
    <main className="org-page partner-page">
      {/* Edition branding (consortia, 2026-11-27): an accent line in the partner's colour. */}
      <header className="partner-bar" style={partner.accent ? { borderTop: `4px solid ${partner.accent}` } : undefined}>
        <div className="org-shell partner-bar-inner">
          <div className="partner-brand">
            {partner.logo
              ? <img className="partner-logo" src={partner.logo} alt="" width="40" height="40" />
              : <span className="partner-badge" aria-hidden="true">{partner.initials}</span>}
            <span className="partner-name">{partner.isConsortium && partner.edition ? partner.edition : partner.name}</span>
          </div>
          <div className="partner-bar-end">
            <Link className="partner-with" to="/">by <b>Deft</b><b className="gold">Brain</b></Link>
            <button type="button" className="org-theme-toggle" onClick={toggleTheme} aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
              <span aria-hidden="true">{isDark ? '☀️' : '🌙'}</span>
            </button>
          </div>
        </div>
      </header>

      <section className="org-shell partner-main">
        {partner.sample && <p className="partner-sample">Sample page — the organization and phone number are fictional.</p>}
        {partner.parentId && <p className="partner-edition">Part of {partner.edition}</p>}
        <h1>{partner.packageTitle}</h1>
        <p className="partner-intro">{partner.intro}</p>
        <p className="partner-privacy"><span aria-hidden="true">🔒</span> Free and private, no account needed. {partner.name} sees only overall usage counts, never what you type. Please don't enter account numbers or passwords.</p>

        <div className="partner-grid">{tools.map(t => <ToolMiniCard key={t.id} tool={t} />)}</div>

        {partner.contacts.map(ct => (
          <p className="partner-help" key={`${ct.label}${ct.phone || ''}${ct.url || ''}`}>
            <span aria-hidden="true">{ct.url && !ct.phone ? '🔗' : '📞'}</span> {ct.label}
            {ct.phone && <> <a href={`tel:${ct.phone.replace(/[^\d+]/g, '')}`}>{ct.phone}</a></>}
            {ct.url && <> <a href={ct.url} target="_blank" rel="noopener noreferrer">{ct.urlText || ct.url.replace(/^https?:\/\//, '')}</a></>}
            {ct.hours && <> · {ct.hours}</>}
          </p>
        ))}

        {partner.isConsortium && Object.keys(partner.members).length > 0 && (
          <nav className="partner-members" aria-labelledby="partner-members-title">
            <h2 id="partner-members-title">Find your {partner.memberWord || 'organization'}</h2>
            <ul>{Object.entries(partner.members).filter(([, m]) => !m.retired).sort((a, b) => a[1].name.localeCompare(b[1].name)).map(([mid, m]) => (
              <li key={mid}><Link className="org-text-link" to={`/for/${partner.id}/${mid}`}>{m.name}</Link></li>
            ))}</ul>
          </nav>
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
