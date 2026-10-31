// A result shared from any tool's Share menu (ShareBtn `parts`) lands here.
// Like SharedVerdict, the result travels inside the link itself
// (src/utils/shareEncode.js), so there is no server record to expire.
//
// Payload: { t: toolId, p: [[label, text], ...] }. The tool's name and link
// come from the catalog, never the payload, so a hand-made link can't claim
// to be from a tool that doesn't exist or point "Try it" somewhere else.
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../i18n/useTranslation';
import { decodeSharePayload } from '../utils/shareEncode';
import BrandMark from './BrandMark';

export default function SharedResult({ allTools = [] }) {
  const { id } = useParams();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const [payload] = useState(() => decodeSharePayload(id));
  const tool = payload && allTools.find(x => x.id === payload.t);
  const parts = Array.isArray(payload?.p)
    ? payload.p.filter(x => Array.isArray(x) && typeof x[1] === 'string' && x[1].trim())
    : [];
  const ok = !!tool && parts.length > 0;

  const c = {
    bg: isDark ? 'bg-zinc-950' : 'bg-[#faf8f5]',
    card: isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-[#e8e1d5]',
    line: isDark ? 'border-zinc-800' : 'border-[#e8e1d5]',
    text: isDark ? 'text-zinc-100' : 'text-[#1a2e44]',
    textSecondary: isDark ? 'text-zinc-300' : 'text-[#3a3530]',
    textMuted: isDark ? 'text-zinc-400' : 'text-[#8a8378]',
    primary: isDark ? 'bg-amber-500 text-zinc-950 hover:bg-amber-400' : 'bg-[#1a2e44] text-white hover:bg-[#165b9a]',
  };

  return (
    <div className={`min-h-screen ${c.bg} px-4 py-10 sm:py-16`}>
      <div className="max-w-xl mx-auto space-y-5">
        <Link to="/" className="flex justify-center mb-2">
          <BrandMark direction="right" size="sm" isDark={isDark} showTagline />
        </Link>

        {!ok && (
          <div className={`${c.card} border rounded-2xl p-8 text-center space-y-3`}>
            <h1 className={`text-lg font-bold ${c.text}`}>{t('share_bad_link_title')}</h1>
            <p className={`text-sm ${c.textSecondary}`}>{t('share_bad_link_body')}</p>
            <Link to="/tools" className={`inline-block mt-2 px-5 py-2.5 rounded-xl font-semibold text-sm ${c.primary}`}>{t('share_browse_tools')}</Link>
          </div>
        )}

        {ok && (
          <div className={`${c.card} border rounded-2xl overflow-hidden shadow-sm`}>
            <div className="px-6 py-5 space-y-4">
              <p className={`text-xs font-semibold ${c.textMuted}`}>
                <span className="me-1">{tool.icon}</span>{t('share_shared_from', { tool: tool.title })}
              </p>
              {parts.map(([label, text], i) => (
                <section key={i} className="space-y-1">
                  {label && <h2 dir="auto" className={`text-sm font-bold ${c.text}`}>{label}</h2>}
                  <p dir="auto" className={`text-sm leading-relaxed whitespace-pre-line ${c.textSecondary}`}>{text}</p>
                </section>
              ))}
            </div>
            <div className={`px-6 py-4 border-t ${c.line} text-center`}>
              <Link to={`/${tool.id}`} className={`inline-block px-5 py-2.5 rounded-xl font-semibold text-sm ${c.primary}`}>
                {t('share_try_yourself', { tool: tool.title })}
              </Link>
            </div>
          </div>
        )}

        {ok && <p className={`text-center text-xs ${c.textMuted}`}>{t('share_page_note')}</p>}
      </div>
    </div>
  );
}
