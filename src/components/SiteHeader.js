// src/components/SiteHeader.js
//
// The site header as the home page shows it — brand on the left, then Tools /
// Categories / Guides / About, the locale controls and the light/dark switch
// on the right, with a ☰
// menu below md — for pages outside the home page. PILOT (2026-09-27): used by
// ToolPageWrapper for the tools in SITE_STYLE_PILOT only, to judge whether tool
// pages should share the home page's look. If it's adopted, DashBoard's own
// copy of this header should move onto this component too.
//
// Categories is a link to /#categories (HomeIntro scrolls to it on arrival),
// not an in-page button: off the home page there's no card to scroll to.

import React from 'react';
import { Link } from 'react-router-dom';
import BrandMark from './BrandMark';
import LocaleSelectors from './LocaleSelectors';
import './SiteHeader.css';

export default function SiteHeader({ isDark = false, showCurrency = true, onToggleTheme }) {
  return (
    <header className={`site-header${isDark ? ' site-header--dark' : ''}`} data-print-hide>
      <div className="site-header-inner">
        <Link to="/" className="site-header-brand" aria-label="DeftBrain home">
          {/* Small mark WITH the definition — a step down from the home page's
              medium mark, the size tool pages used before this header. */}
          <BrandMark direction="left" size="sm" isDark={isDark} showTagline />
        </Link>
        <div className="site-header-end">
          <nav className="site-header-nav" aria-label="Primary">
            <Link to="/tools">Tools</Link>
            <Link to="/#categories">Categories</Link>
            {/* Plain <a>: /guides and /about are static pages, not routes. */}
            <a href="/guides">Guides</a>
            <a href="/about">About</a>
          </nav>
          <div className="site-header-controls">
            <LocaleSelectors dark={isDark} showCurrency={showCurrency} />
            {onToggleTheme && (
              <button type="button" className="site-header-theme" onClick={onToggleTheme}
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
                <span aria-hidden="true">{isDark ? '☀️' : '🌙'}</span>
              </button>
            )}
          </div>
          <details className="site-header-menu">
            <summary aria-label="Navigation menu"><span aria-hidden="true">☰</span></summary>
            <nav aria-label="Mobile navigation" onClick={e => { e.currentTarget.closest('details').open = false; }}>
              <Link to="/tools">Tools</Link>
              <Link to="/#categories">Categories</Link>
              <a href="/guides">Guides</a>
              <a href="/about">About</a>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
