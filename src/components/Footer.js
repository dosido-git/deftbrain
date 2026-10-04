/**
 * Footer — the last thing on every React page (2026-10-04). The static pages
 * render the same markup from getSiteFooterBar() in src/seo/chrome.js. Links
 * come from src/data/siteNav.json (`footer`); styles only from
 * public/site-footer.css, light and dark. Keep this markup and chrome.js's
 * identical.
 *
 * The Tiny Startups badge is NOT here by choice (2026-07-30): their
 * verification never completed, so it sits as static HTML on /about.
 */
import React from 'react';
import { TOOL_FINDER_PAUSED } from '../data/toolFinderPaused';
import SITE_NAV from '../data/siteNav.json';

export default function Footer() {
  const year = new Date().getFullYear();
  // Plain <a>: several targets (/guides, /about, /privacy, /terms) are static
  // pages, not routes, so every footer link is a full page load.
  const links = SITE_NAV.footer.filter(l => !(l.key === 'toolFinder' && TOOL_FINDER_PAUSED));
  return (
    <footer className="site-footer" data-site-tail>
      <div className="site-footer-inner">
        <a href="/" className="site-footer-brand" aria-label="DeftBrain — home">
          <img src="/pBrain-r.png" alt="" height="64" />
          <span className="site-footer-word">Deft<span>Brain</span></span>
        </a>
        <div className="site-footer-end">
          <nav className="site-footer-nav" aria-label="Footer">
            {links.map(l => <a key={l.href} href={l.href}>{l.label}</a>)}
          </nav>
          <span className="site-footer-dot" aria-hidden="true">·</span>
          <span>© {year} DeftBrain · deftbrain.com</span>
        </div>
      </div>
    </footer>
  );
}
