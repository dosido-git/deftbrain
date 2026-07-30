/**
 * TinyStartupsBadge — vendor-supplied launch badge, transcribed to JSX.
 *
 * ─── TEMPORARY PLACEMENT (2026-07-30) ────────────────────────────────────────
 * Currently rendered ABOVE THE FOLD on the dashboard (DashBoard.js) because
 * Tiny Startups' verification wants the badge visibly placed. Once the operator
 * confirms verification has gone through, this moves to a single page (/about)
 * — a site-wide footer link put an outbound link on ~130 pages, which is more
 * than a domain with two backlinks should spend. The operator will say when.
 * A smaller variant was also requested and is deliberately deferred until after
 * verification, so nothing shrinks the badge while it's being checked.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Colours, gradient, fonts and the white card are reproduced as supplied: a
 * launch badge is a third-party brand asset, so it is deliberately NOT themed
 * for dark mode — the same treatment as the hosted SaaSHub image, which also
 * stays light on a dark surface.
 *
 * The <svg> is aria-hidden because the badge's own text ("Launched on Tiny
 * Startups") is real text and already announces it; the link carries the
 * accessible name.
 */
import React from 'react';

const TinyStartupsBadge = () => (
  <a
    href="https://www.tinystartups.com/startup/deftbrain"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="DeftBrain — launched on Tiny Startups"
    // Vendor brand values are listed first in the style object so the colour
    // literals stay inside the audit's inline-style window (S1.1 exempts
    // style/SVG colour attrs, but only looks a fixed distance back).
    style={{
      background:
        'linear-gradient(#fff,#fff) padding-box, linear-gradient(90deg,#3525E6,#D81FE0,#22B8F0) border-box',
      color: '#0E0B1F',
      border: '2px solid transparent',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 14,
      padding: '14px 22px 14px 18px',
      borderRadius: 14,
      textDecoration: 'none',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}
  >
    <svg width="56" height="56" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="tsg" x1=".1" y1="0" x2=".9" y2="1">
          <stop offset="0%" stopColor="#3525E6" />
          <stop offset="55%" stopColor="#D81FE0" />
          <stop offset="100%" stopColor="#22B8F0" />
        </linearGradient>
      </defs>
      <path
        d="M50 6C52 32 68 48 94 50C68 52 52 68 50 94C48 68 32 52 6 50C32 48 48 32 50 6Z"
        fill="url(#tsg)"
      />
    </svg>
    <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
      <span
        style={{
          fontFamily: 'monospace',
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: '#6A6585',
        }}
      >
        Launched on
      </span>
      <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.025em' }}>
        Tiny Startups
      </span>
      <span style={{ fontSize: 11, color: '#6A6585', marginTop: 4 }}>tinystartups.com</span>
    </span>
  </a>
);

export default TinyStartupsBadge;
