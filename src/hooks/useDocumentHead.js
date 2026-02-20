// src/hooks/useDocumentHead.js
// Lightweight per-page SEO: updates document title and meta tags.
// No external dependencies needed (replaces react-helmet).

import { useEffect } from 'react';

const SITE_NAME = 'DeftBrain — Intelligence on Demand';
const DEFAULT_DESCRIPTION = 'DeftBrain offers 70+ free AI-powered tools for productivity, communication, health, finance, and more. Get instant, intelligent help for real-life problems.';

/**
 * Updates document <head> for SEO on each page.
 * 
 * @param {Object} options
 * @param {string} options.title - Page title (will be appended with site name)
 * @param {string} options.description - Meta description for this page
 * @param {string} [options.canonicalPath] - Canonical URL path (e.g., '/PlantRescue')
 */
export function useDocumentHead({ title, description, canonicalPath } = {}) {
  useEffect(() => {
    // ── Title ──
    const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
    document.title = fullTitle;

    // ── Meta description ──
    const desc = description || DEFAULT_DESCRIPTION;
    setMeta('description', desc);

    // ── Open Graph ──
    setMeta('og:title', fullTitle, 'property');
    setMeta('og:description', desc, 'property');
    setMeta('og:type', 'website', 'property');
    setMeta('og:site_name', 'DeftBrain', 'property');

    // ── Twitter Card ──
    setMeta('twitter:card', 'summary', 'name');
    setMeta('twitter:title', fullTitle, 'name');
    setMeta('twitter:description', desc, 'name');

    // ── Canonical URL ──
    if (canonicalPath) {
      let link = document.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', `${window.location.origin}${canonicalPath}`);
    }

    // Cleanup: restore defaults when unmounting
    return () => {
      document.title = SITE_NAME;
      setMeta('description', DEFAULT_DESCRIPTION);
    };
  }, [title, description, canonicalPath]);
}

/**
 * Helper: create-or-update a <meta> tag in <head>.
 */
function setMeta(identifier, content, attr = 'name') {
  let el = document.querySelector(`meta[${attr}="${identifier}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, identifier);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export default useDocumentHead;
