/**
 * Footer — Site-wide footer component
 * ────────────────────────────────────
 * Branded footer rendering on every page. Includes logo + wordmark,
 * "Guides" link, and copyright line.
 *
 * Designed to accept additional links (privacy, terms, contact)
 * by appending to the links array as they exist.
 */
import React from 'react';
import { useTheme } from '../hooks/useTheme';

/**
 * TinyStartupsBadge — vendor-supplied launch badge, transcribed to JSX.
 *
 * Kept as its own component (rather than a row in the `badges` array) because
 * that array is for hosted <img> badges and this one is inline SVG + gradient
 * border. The vendor's colours, gradient, fonts and white card are reproduced
 * as given: a launch badge is a third-party brand asset, so it is deliberately
 * NOT themed for dark mode — same treatment as the hosted SaaSHub image, which
 * also stays light on a dark footer.
 *
 * The <svg> carries aria-hidden because the badge's own text ("Launched on
 * Tiny Startups") is real text and already announces it; the link gets the
 * accessible name.
 */
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

const Footer = () => {
  const { isDark } = useTheme();

  const c = {
    bg:        isDark ? 'bg-zinc-900' : 'bg-[#faf8f5]',
    border:    isDark ? 'border-zinc-800' : 'border-[#e8e1d5]',
    text:      isDark ? 'text-zinc-400' : 'text-[#5a544a]',
    // Two-tone wordmark, matching the header lockup (gold "D" + navy rest) —
    // the footer used to render an all-ochre "DeftBrain", two brand marks on
    // one page.
    goldD:     isDark ? 'text-orange-400' : 'text-[#c8872e]',
    navyRest:  isDark ? 'text-zinc-200'   : 'text-[#2c4a6e]',
    link:      isDark ? 'text-zinc-300 hover:text-zinc-100' : 'text-[#2c4a6e] hover:text-[#1a2e44]',
  };

  const year = new Date().getFullYear();

  // Right-side links (extensible — append future links here)
  const links = [
    { label: 'Find a Tool', href: '/ToolFinder' },
    { label: 'Guides',      href: '/guides' },
    { label: 'About',       href: '/about' },
    { label: 'Privacy',     href: '/privacy' },
    { label: 'Terms',       href: '/terms' },
    { label: 'Contact',     href: 'mailto:hello@deftbrain.com' },
  ];

  // Directory/trust badges (extensible — append future ones here as
  // submissions from audit/DIRECTORY-SUBMISSIONS.md go live, e.g. Product
  // Hunt, G2). Sitewide placement so the dofollow link fires on every page,
  // not just one.
  const badges = [
    {
      key: 'saashub',
      href: 'https://www.saashub.com/deftbrain?utm_source=badge&utm_campaign=badge&utm_content=deftbrain&badge_variant=color&badge_kind=approved',
      src: 'https://cdn-b.saashub.com/img/badges/approved-color.png?v=1',
      alt: 'DeftBrain badge',
    },
  ];

  return (
    <footer className={`${c.bg} border-t ${c.border} print:hidden`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">

          {/* Left: brand */}
          <a
            href="/"
            className="flex items-center gap-3"
            aria-label="DeftBrain — home"
          >
            <img
              src="/pBrain-r.png"
              alt=""
              className="h-12 w-auto object-contain"
              height="48"
            />
            <span className="text-lg font-semibold">
              <span className={c.goldD}>D</span><span className={c.navyRest}>eftBrain</span>
            </span>
          </a>

          {/* Right: links + copyright */}
          <div className={`flex flex-col sm:flex-row items-center gap-4 text-sm ${c.text}`}>
            {/* py-1.5 pads each link to a ≥32px tap target (mobile a11y);
                gap-y-0 compensates so the visual rhythm barely changes. */}
            <nav className="flex flex-wrap justify-center gap-x-4 gap-y-0">
              {links.map(link => (
                <a
                  key={link.href}
                  href={link.href}
                  className={`${c.link} transition-colors inline-block py-1.5`}
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <span className="hidden sm:inline">·</span>
            <span>© {year} DeftBrain · deftbrain.com</span>
          </div>

        </div>

        {/* flex-wrap so the badge row reflows on narrow screens instead of
            overflowing — the Tiny Startups badge is ~230px wide on its own. */}
        <div className="flex flex-wrap justify-center items-center gap-4 mt-4">
          {badges.map(b => (
            <a key={b.key} href={b.href} target="_blank" rel="noopener noreferrer" aria-label={b.alt}>
              <img src={b.src} alt={b.alt} className="max-w-[150px] h-auto" />
            </a>
          ))}
          <TinyStartupsBadge />
        </div>

      </div>
    </footer>
  );
};

export default Footer;
