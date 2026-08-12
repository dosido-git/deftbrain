/**
 * ToolFaq — the React mirror of the "Frequently asked questions" block that
 * scripts/prerender.js writes into each enriched tool's static HTML.
 * ──────────────────────────────────
 * Why this exists: the prerendered block lives INSIDE #root, so React replaces
 * it on mount. Nineteen tools carry FAQPage JSON-LD, and their Q&As used to
 * render in the guide sidebar — until the sidebar was distilled down to the
 * nutshell (3ca6667a, 68b8a7a0) and the FAQ went with it. From then on the
 * structured data described content that:
 *   - no human visitor could see, because React had wiped the static copy, and
 *   - Googlebot could not see either, because it renders JS and gets the same
 *     wiped page.
 * So 90 hand-written Q&As were dead weight in tools.js, and the markup was
 * making a claim about the page that the page did not support.
 *
 * This restores them as real, visible content — at the very bottom, after the
 * tool has done its job, rather than back in the sidebar the owner
 * deliberately stripped. Keep in sync with prerender.js (buildBodyContent).
 */

import React from 'react';
import { useLocation } from 'react-router-dom';
import { tools } from '../data/tools';
import { useTheme } from '../hooks/useTheme';

export default function ToolFaq() {
  const { pathname } = useLocation();
  const { isDark } = useTheme();

  // '' on the homepage, toolId on a tool page — same derivation RelatedLinks uses.
  const seg = pathname.replace(/^\/+/, '').split('/')[0];
  if (!seg) return null;

  const tool = tools.find(t => t.id === seg);
  const faq = tool && Array.isArray(tool.faq) ? tool.faq : null;
  if (!faq || !faq.length) return null;

  const c = {
    band: isDark ? 'bg-zinc-900' : 'bg-[#faf8f5]',
    head: isDark ? 'text-zinc-400' : 'text-[#6e675c]',
    q: isDark ? 'text-zinc-100' : 'text-[#1e293b]',
    a: isDark ? 'text-zinc-400' : 'text-[#4b5563]',
    border: isDark ? 'border-zinc-800' : 'border-[#e7e2d9]',
  };

  return (
    <section data-print-hide className={`${c.band} border-t ${c.border}`}>
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h2 className={`text-[11px] font-bold uppercase tracking-widest ${c.head} mb-5`}>
          Questions people ask
        </h2>
        <dl className="space-y-5">
          {faq.map((f, i) => (
            <div key={i}>
              <dt className={`text-sm font-bold ${c.q} mb-1`}>{f.q}</dt>
              <dd className={`text-sm leading-relaxed ${c.a}`}>{f.a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
