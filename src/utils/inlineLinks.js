// Inline links in authored copy (guide bodies and ledes, tool FAQ answers):
//   [label](/path)          a page on this site
//   [label](https://...)    an outside site: new tab, rel="noopener"
// Any other scheme (http:, javascript:, ...) is not a link and stays text.
//
// One module for every renderer, so users and crawlers always get the same
// links: scripts/build-guides.js and scripts/prerender.js require() it, and
// src/components/ToolFaq.js imports it (CommonJS, like ./returnVisit).

const INLINE_LINK = /\[([^\]]+)\]\(((?:\/|https:\/\/)[^)\s]*)\)/g;

// Split text into plain-text and link segments:
// [{ text }, { label, href, external }, ...]
function linkParts(text) {
  const s = String(text);
  const parts = [];
  let last = 0;
  for (const m of s.matchAll(INLINE_LINK)) {
    if (m.index > last) parts.push({ text: s.slice(last, m.index) });
    parts.push({ label: m[1], href: m[2], external: !m[2].startsWith('/') });
    last = m.index + m[0].length;
  }
  if (last < s.length) parts.push({ text: s.slice(last) });
  return parts;
}

// HTML string. `escape` is the caller's HTML escaper, applied to every
// segment. Options: style (inline style for <a>), base (prefix for site
// paths, e.g. for JSON-LD), newTab (default true: outside links open in a
// new tab).
function linksToHtml(text, escape, { style = '', base = '', newTab = true } = {}) {
  return linkParts(text).map(p => {
    if (p.text !== undefined) return escape(p.text);
    const href = p.external ? p.href : base + p.href;
    const target = p.external && newTab ? ' target="_blank" rel="noopener"' : '';
    const css = style ? ` style="${style}"` : '';
    return `<a href="${escape(href)}"${target}${css}>${escape(p.label)}</a>`;
  }).join('');
}

// Plain text: each link becomes its label.
function stripLinks(text) {
  return linkParts(text).map(p => (p.text !== undefined ? p.text : p.label)).join('');
}

module.exports = { linkParts, linksToHtml, stripLinks };
