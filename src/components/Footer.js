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

const Footer = () => {
  const { isDark } = useTheme();

  const c = {
    bg:        isDark ? 'bg-zinc-900' : 'bg-[#faf8f5]',
    border:    isDark ? 'border-zinc-800' : 'border-[#e8e1d5]',
    text:      isDark ? 'text-zinc-400' : 'text-[#5a544a]',
    brandText: isDark ? 'text-orange-400' : 'text-[#c8872e]',
    link:      isDark ? 'text-zinc-300 hover:text-zinc-100' : 'text-[#2c4a6e] hover:text-[#1a2e44]',
  };

  const year = new Date().getFullYear();

  // Right-side links (extensible — append future links here)
  const links = [
    { label: 'Guides', href: '/guides' },
    // Future: { label: 'Privacy', href: '/privacy' },
    // Future: { label: 'Terms',   href: '/terms' },
    // Future: { label: 'Contact', href: '/contact' },
  ];

  return (
    <footer className={`${c.bg} border-t ${c.border} mt-16`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
            <span className={`text-lg font-semibold ${c.brandText}`}>
              DeftBrain
            </span>
          </a>

          {/* Right: links + copyright */}
          <div className={`flex flex-col sm:flex-row items-center gap-4 text-sm ${c.text}`}>
            <nav className="flex gap-4">
              {links.map(link => (
                <a
                  key={link.href}
                  href={link.href}
                  className={`${c.link} transition-colors`}
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <span className="hidden sm:inline">·</span>
            <span>© {year} DeftBrain · deftbrain.com</span>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;
