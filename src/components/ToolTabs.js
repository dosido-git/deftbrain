/**
 * ToolTabs — tabs that look like tabs, for tools with several modes.
 * ──────────────────────────────────
 * Owner's rules (2026-10-22), after mode rows across the catalog read as
 * loose buttons nobody recognised as tabs:
 *   1. Tabs look like tabs: the active one is a different shade AND joins the
 *      panel below it (no line between them).
 *   2. Each tab has its own colour, and the panel it opens carries the same
 *      colour, so you can see which tab you're in from anywhere in the panel.
 *   3. One tab is always selected — the caller passes `active`.
 *
 * Usage:
 *   <ToolTabs label="Ways to practise" active={tab} onChange={setTab} tabs={[
 *     { id: 'debate', icon: '🥊', label: 'Debate', tone: 'amber', badge: 3 }, …]}>   // badge: optional count
 *     …the selected tab's content…
 *   </ToolTabs>
 *
 * Tones come from the site's category palette (audit/CONVENTIONS.md, L3).
 * Keyboard: ←/→ move between tabs (mirrored in right-to-left), Home/End jump.
 */
import React, { useRef } from 'react';
import { useTheme } from '../hooks/useTheme';

const TONES = {
  amber: { line: '#c8872e', tint: '#fdf4e8', darkLine: '#e0a458', darkTint: 'rgba(224,164,88,0.14)' },
  blue:  { line: '#5b7fa6', tint: '#eef2f7', darkLine: '#8fb0d4', darkTint: 'rgba(143,176,212,0.14)' },
  teal:  { line: '#3f9a8f', tint: '#e4f2f0', darkLine: '#6cc4b8', darkTint: 'rgba(108,196,184,0.14)' },
  rose:  { line: '#b86b6b', tint: '#f5eaea', darkLine: '#d99a9a', darkTint: 'rgba(217,154,154,0.14)' },
  green: { line: '#6a9a5c', tint: '#edf4e8', darkLine: '#9cc78c', darkTint: 'rgba(156,199,140,0.14)' },
  // The tool's category colours (src/data/toolSchemes.js), light and dark
  // both via the CSS variables ToolPageWrapper sets.
  scheme: { line: 'var(--sc-accent)', tint: 'var(--sc-envelope)', darkLine: 'var(--sc-accent)', darkTint: 'var(--sc-envelope)' },
};

export default function ToolTabs({ tabs, active, onChange, label, children }) {
  const { isDark } = useTheme();
  const refs = useRef([]);
  const surface = isDark ? '#27272a' : '#ffffff'; // the tool card's own surface (ToolPageWrapper)
  const current = tabs.find(tb => tb.id === active) || tabs[0];
  const tone = TONES[current.tone] || TONES.amber;
  // Under a category scheme the panel is the scheme's lightest shade.
  const panel = current.tone === 'scheme' ? 'var(--sc-field)' : surface;
  const line = isDark ? tone.darkLine : tone.line;

  const onKeyDown = (e, i) => {
    const rtl = document.documentElement.dir === 'rtl';
    const step = { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1 }[e.key];
    let next = null;
    if (step) next = (i + step + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    if (next === null) return;
    e.preventDefault();
    onChange(tabs[next].id);
    refs.current[next]?.focus();
  };

  return (
    <div>
      <div role="tablist" aria-label={label} className="flex items-end gap-1 relative z-[1] -mb-[2px]">
        {tabs.map((tb, i) => {
          const sel = tb.id === current.id;
          const tt = TONES[tb.tone] || TONES.amber;
          const tl = isDark ? tt.darkLine : tt.line;
          return (
            <button key={tb.id} ref={el => { refs.current[i] = el; }}
              type="button" role="tab" id={`tooltab-${tb.id}`} aria-controls="tooltab-panel"
              aria-selected={sel} tabIndex={sel ? 0 : -1}
              onClick={() => onChange(tb.id)} onKeyDown={e => onKeyDown(e, i)}
              className={`flex-1 sm:flex-none min-w-0 flex flex-col sm:flex-row items-center sm:gap-1.5 px-1 sm:px-4 rounded-t-lg border text-[11px] leading-tight sm:text-sm text-center sm:whitespace-nowrap transition-colors ${
                sel ? 'pt-2 pb-2.5 font-bold' : `py-1.5 font-medium ${isDark ? 'text-zinc-300 hover:text-zinc-100' : 'text-stone-600 hover:text-stone-900'}`}`}
              style={sel
                ? { background: panel, borderColor: tl, borderTopWidth: 3, borderBottomWidth: 2, borderBottomColor: panel }
                : { background: isDark ? tt.darkTint : tt.tint, borderColor: 'transparent', borderBottomWidth: 2, borderBottomColor: line }}>
              <span className="text-base sm:text-sm" aria-hidden="true">{tb.icon}</span><span>{tb.label}</span>
              {tb.badge > 0 && <span className={`min-w-[1.25rem] h-5 px-1 rounded-full inline-flex items-center justify-center text-xs font-black ${isDark ? 'bg-amber-500/30 text-amber-300' : 'bg-amber-100 text-amber-800'}`}>{tb.badge}</span>}
            </button>
          );
        })}
      </div>
      <div role="tabpanel" id="tooltab-panel" aria-labelledby={`tooltab-${current.id}`}
        className="border rounded-b-xl rounded-se-xl p-3 sm:p-5"
        style={{ background: panel, borderColor: line, borderTopWidth: 2 }}>
        {children}
      </div>
    </div>
  );
}
