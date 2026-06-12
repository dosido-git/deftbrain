import React from 'react';
import { useLocale } from '../hooks/useLocale';

/**
 * LocaleSelectors — the two global override dropdowns (language + currency).
 * Written once, dropped into every header surface. State lives in LocaleProvider,
 * so each tool reads the chosen values via useClaudeAPI without any extra wiring.
 *
 * `dark` controls styling only (the dashboard header is always light; the
 * tool-page header follows the theme).
 */
const LocaleSelectors = ({ dark = false }) => {
  const { language, currency, setLanguage, setCurrency, LANGUAGES, CURRENCIES } = useLocale();

  const selectCls = `text-xs font-medium rounded-lg border px-2 py-1 outline-none cursor-pointer transition-colors ${
    dark
      ? 'bg-zinc-800 border-zinc-600 text-zinc-100 hover:border-zinc-400 focus:border-cyan-500'
      : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400 focus:border-blue-400'
  }`;

  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <label className="flex items-center gap-1" title="Interface & response language">
        <span className="text-sm" aria-hidden="true">🌐</span>
        <select
          aria-label="Language"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className={selectCls}
        >
          <option value="auto">Auto</option>
          {LANGUAGES.map(l => (
            <option key={l.code} value={l.code}>{l.label}</option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-1" title="Currency">
        <span className="text-sm" aria-hidden="true">💱</span>
        <select
          aria-label="Currency"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className={selectCls}
        >
          <option value="auto">Auto</option>
          {CURRENCIES.map(c => (
            <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
          ))}
        </select>
      </label>
    </div>
  );
};

export default LocaleSelectors;
