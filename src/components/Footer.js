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
import { TOOL_FINDER_PAUSED } from '../data/toolFinderPaused';

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
    // Dropped while Tool Finder is paused — it sits on every page, and a
    // sitewide link to a maintenance notice is not a useful footer entry.
    ...(TOOL_FINDER_PAUSED ? [] : [{ label: 'Find a Tool', href: '/ToolFinder' }]),
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

  // Prints. This used to carry `print:hidden`, so a printed page ended with
  // the last tool row and no site name, URL, or legal links — exactly what a
  // reader on paper needs, having no address bar. Tool pages hide their chrome
  // via data-print-hide, which this deliberately does not use.
  //
  // 2026-08-20: data-print-hide was added here anyway, while removing a whole
  // page of navigation from tool print-outs — the interlink block, the
  // newsletter and the tools index all genuinely did not belong on paper, and
  // this got swept up with them. It is not chrome. Reverted the same day. If
  // you are here to hide it again: the paragraph above is the reason not to.
  //
  // A normal JS comment, not a JSX one: a {/* */} between `return (` and the
  // root element is a second child of the return and does not compile.
  return (
    <footer className={`${c.bg} border-t ${c.border}`}>
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

        {/* The Tiny Startups badge is NOT here by choice (2026-07-30): their
            verification never completed, so it sits as static HTML on /about at
            ~60% size rather than as a site-wide outbound link. See
            audit/DIRECTORY-SUBMISSIONS.xlsx for the reasoning. */}
        {badges.length > 0 && (
          <div className="flex flex-wrap justify-center items-center gap-4 mt-4">
            {badges.map(b => (
              <a key={b.key} href={b.href} target="_blank" rel="noopener noreferrer" aria-label={b.alt}>
                <img src={b.src} alt={b.alt} className="max-w-[150px] h-auto" />
              </a>
            ))}
          </div>
        )}

      </div>
    </footer>
  );
};

export default Footer;
