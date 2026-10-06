// src/components/SiteHeader.js
//
// The site header for every React page — home, toolbox, organizations and
// every tool (2026-10-04). The static pages (guides, guide hubs, tool
// category pages, About, Privacy, Terms) render the same markup from
// getSiteHeaderHTML() in src/seo/chrome.js. Both read their links from
// src/data/siteNav.json and are styled only by public/site-header.css, which
// public/index.html links. Keep this markup and chrome.js's identical; the
// one difference is the language selector, which only these pages have
// (the static pages are English-only).
//
// Props:
//   isDark        — for LocaleSelectors (its colors are not CSS-driven)
//   onToggleTheme — the light/dark switch; the icon itself comes from CSS
//   showCurrency  — passed to LocaleSelectors
//   onBrandClick  — home only: reset the home view instead of navigating to /
//   onCategories  — pages with their own category picker (home, toolbox):
//                   scroll to it instead of going to /#categories
//   current       — href of the page's own nav item, for aria-current
//   large         — the home page's larger brand mark (owner, 2026-10-04)

import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import LocaleSelectors from './LocaleSelectors';
import SITE_NAV from '../data/siteNav.json';

function Brand({ onBrandClick }) {
  const inner = (
    <>
      <img src="/pBrain-r.png" alt="" className="sh-brand-img" height="64" />
      <span className="sh-brand-word">
        <span className="sh-brand-text">Deft<span>Brain</span></span>
        <span className="sh-brand-tag"><b>deft</b> <i>(adj.)</i> — skillful, nimble, clever.</span>
      </span>
    </>
  );
  return onBrandClick
    ? <button type="button" className="site-header-brand" aria-label="DeftBrain home" onClick={onBrandClick}>{inner}</button>
    : <Link to="/" className="site-header-brand" aria-label="DeftBrain home">{inner}</Link>;
}

function NavItems({ onCategories, current }) {
  return SITE_NAV.links.map(link => {
    if (link.key === 'categories' && onCategories) {
      return <button key={link.href} type="button" onClick={onCategories}>{link.label}</button>;
    }
    const aria = current === link.href ? { 'aria-current': 'page' } : {};
    // Static pages (/guides, /about) are not routes: a full page load.
    return link.route
      ? <Link key={link.href} to={link.href} {...aria}>{link.label}</Link>
      : <a key={link.href} href={link.href} {...aria}>{link.label}</a>;
  });
}

export default function SiteHeader({ isDark = false, onToggleTheme, showCurrency = true, onBrandClick, onCategories, current, large = false }) {
  // Keep --site-header-h (public/site-header.css scroll-padding-top) equal to
  // this pinned header's height, so jumps to a section land below it rather
  // than under it. Same job as the script chrome.js writes for static pages.
  const ref = useRef(null);
  useEffect(() => {
    const h = ref.current;
    if (!h) return undefined;
    const set = () => document.documentElement.style.setProperty('--site-header-h', `${h.getBoundingClientRect().height}px`);
    set();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', set);
      return () => window.removeEventListener('resize', set);
    }
    const ro = new ResizeObserver(set);
    ro.observe(h);
    return () => ro.disconnect();
  }, []);
  return (
    <header ref={ref} className={`site-header${large ? ' site-header--large' : ''}`} data-print-hide>
      <div className="site-header-inner">
        <Brand onBrandClick={onBrandClick} />
        <div className="site-header-end">
          <nav className="site-header-nav" aria-label="Primary">
            <NavItems onCategories={onCategories} current={current} />
          </nav>
          <div className="site-header-controls">
            <LocaleSelectors dark={isDark} showCurrency={showCurrency} />
            {onToggleTheme && (
              <button type="button" className="site-header-theme" onClick={onToggleTheme}
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'} />
            )}
          </div>
          <details className="site-header-menu">
            <summary aria-label="Navigation menu"><span aria-hidden="true">☰</span></summary>
            <nav aria-label="Mobile navigation" onClick={e => { e.currentTarget.closest('details').open = false; }}>
              <NavItems onCategories={onCategories} current={current} />
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
