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
 *
 * HIT AREA — the whole pill, deliberately (fixed 2026-08-01).
 * Previously the <select> sat in normal flow with no vertical padding, so the
 * real target was 16px tall inside a 26px pill, and the caret carried
 * `pointer-events-none` with only the pill span beneath it — tapping the arrow
 * did nothing at all. Apple's guidance is 44px; WCAG 2.2 AA's floor is 24px.
 * This is the header control on every page, and it is the language switcher,
 * so it is the worst place on the site to be hard to hit.
 *
 * The select is now absolutely positioned over the entire pill at opacity 0,
 * and the chosen value is rendered as ordinary text beside the glyph. Every
 * pixel of the pill — glyph, label, caret, padding — opens the menu. The select
 * is still a real <select>, so keyboard and screen-reader behaviour is
 * unchanged; `aria-hidden` on the visible label stops it being announced twice.
 */
const LocaleSelectors = ({ dark = false }) => {
  const { language, currency, setLanguage, setCurrency, LANGUAGES, CURRENCIES } = useLocale();

  const pill = `relative inline-flex items-center gap-1.5 ps-2 pe-5 rounded-lg border text-xs font-medium transition-colors min-h-[32px] ${
    dark
      ? 'bg-zinc-800 border-zinc-600 text-zinc-100 hover:border-zinc-400'
      : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400'
  }`;
  // Covers the pill edge to edge. opacity-0 rather than `sr-only`/`hidden` so it
  // stays a hit-testable element; `cursor-pointer` keeps the desktop affordance.
  // -inset-px, not inset-0: an absolutely positioned box is laid out against the
  // ancestor's PADDING box, so inset-0 leaves the 1px border ring uncovered.
  const select = 'absolute -inset-px w-auto h-auto opacity-0 cursor-pointer appearance-none';
  const caret = `pointer-events-none absolute end-1.5 text-[10px] ${dark ? 'text-zinc-400' : 'text-slate-500'}`;

  const langLabel = language === 'auto'
    ? 'Auto'
    : (LANGUAGES.find(l => l.code === language)?.label || language);
  const curr = CURRENCIES.find(c => c.code === currency);
  const currLabel = currency === 'auto'
    ? 'Auto'
    : (curr ? `${curr.name} (${curr.symbol})` : currency);

  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <span className={pill} title="Interface & response language">
        <span aria-hidden="true">🌐</span>
        <span aria-hidden="true" className="truncate max-w-[10rem]">{langLabel}</span>
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
        <span aria-hidden="true" className="truncate max-w-[12rem]">{currLabel}</span>
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
