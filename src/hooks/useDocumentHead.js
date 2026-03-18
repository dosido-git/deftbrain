// src/hooks/useDocumentHead.js
// Lightweight per-page SEO: updates document title and meta tags.
// No external dependencies needed (replaces react-helmet).

import { useEffect } from 'react';

const SITE_NAME = 'DeftBrain — Intelligence on Demand';
const BASE_URL = 'https://deftbrain.com';
const DEFAULT_DESCRIPTION = 'DeftBrain offers 100+ free AI-powered tools for productivity, communication, health, finance, and more. Get instant, intelligent help for real-life problems.';

/**
 * Updates document <head> for SEO on each page.
 * 
 * @param {Object} options
 * @param {string} options.title - Page title (will be appended with site name)
 * @param {string} options.description - Meta description for this page
 * @param {string} [options.canonicalPath] - Canonical URL path (e.g., '/PlantRescue')
 * @param {string} [options.ogImageSlug] - Slug for OG image (e.g., 'what-if-machine'). Defaults to default.png.
 */
export function useDocumentHead({ title, description, canonicalPath, ogImageSlug } = {}) {
  useEffect(() => {
    // â”€â”€ Title â”€â”€
    const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
    document.title = fullTitle;

    // â”€â”€ Meta description â”€â”€
    const desc = description || DEFAULT_DESCRIPTION;
    setMeta('description', desc);

    // â”€â”€ Open Graph â”€â”€
    setMeta('og:title', fullTitle, 'property');
    setMeta('og:description', desc, 'property');
    setMeta('og:type', 'website', 'property');
    setMeta('og:site_name', 'DeftBrain', 'property');
    setMeta('og:url', `${BASE_URL}${canonicalPath || '/'}`, 'property');

    // ── OG Image ──
    const imgSlug = ogImageSlug || 'default';
    const ogImageUrl = `${BASE_URL}/og/${imgSlug}.png`;
    setMeta('og:image', ogImageUrl, 'property');
    setMeta('og:image:width', '1200', 'property');
    setMeta('og:image:height', '630', 'property');

    // â”€â”€ Twitter Card â”€â”€
    setMeta('twitter:card', 'summary_large_image', 'name');
    setMeta('twitter:title', fullTitle, 'name');
    setMeta('twitter:description', desc, 'name');
    setMeta('twitter:image', ogImageUrl, 'name');

    // â”€â”€ Canonical URL â”€â”€
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
