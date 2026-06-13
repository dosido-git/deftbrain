import React from 'react';
import { useLocale } from '../hooks/useLocale';

/**
 * LocaleSelectors — the two global override controls (language + currency).
 * Written once, dropped into every header surface. State lives in LocaleProvider,
 * so each tool reads the chosen values via useClaudeAPI without extra wiring.
 *
 * Styled as compact DeftBrain pills with `appearance: none` so they shed the
 * heavy native OS chrome, while keeping a real <select> underneath for keyboard
 * and screen-reader support. `dark` controls styling only (the dashboard header
 * is always light; the tool-page header follows the theme).
 */
const LocaleSelectors = ({ dark = false }) => {
  const { language, currency, setLanguage, setCurrency, LANGUAGES, CURRENCIES } = useLocale();

  const pill = `relative inline-flex items-center gap-1.5 pl-2 pr-5 py-1 rounded-lg border text-xs font-medium transition-colors ${
    dark
      ? 'bg-zinc-800 border-zinc-600 text-zinc-100 hover:border-zinc-400'
      : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400'
  }`;
  const select = `appearance-none bg-transparent outline-none cursor-pointer ${dark ? 'text-zinc-100' : 'text-slate-700'}`;
  const caret = `pointer-events-none absolute right-1.5 text-[8px] ${dark ? 'text-zinc-400' : 'text-slate-400'}`;

  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <span className={pill} title="Interface & response language">
        <span aria-hidden="true">🌐</span>
        <select aria-label="Language" value={language} onChange={(e) => setLanguage(e.target.value)} className={select}>
          <option value="auto">Auto</option>
          {LANGUAGES.map(l => (
            <option key={l.code} value={l.code}>{l.label}</option>
          ))}
        </select>
        <span className={caret} aria-hidden="true">▼</span>
      </span>

      <span className={pill} title="Currency">
        <span aria-hidden="true">💱</span>
        <select aria-label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)} className={select}>
          <option value="auto">Auto</option>
          {CURRENCIES.map(c => (
            <option key={c.code} value={c.code}>
              {c.name} ({c.symbol})
            </option>
          ))}
        </select>
        <span className={caret} aria-hidden="true">▼</span>
      </span>
    </div>
  );
};

export default LocaleSelectors;
