/**
 * CategoryStyle — the shared pieces of a category-colour tool page
 * (audit/CONVENTIONS.md "Category-colour pages"). Bill Rescue is the
 * reference; every restyled tool builds from these instead of copying it.
 *
 * The colours are CSS variables ToolPageWrapper sets from the tool's first
 * category (src/data/toolSchemes.js): --sc-field (lightest), --sc-envelope,
 * --sc-accent (medium), --sc-strong (dark), --sc-x* (contrast, warnings only).
 *
 *   const sv = schemeStyle(tool, isDark);
 *   if (sv) Object.assign(c, SCHEME_C, { ...this tool's own keys });
 *
 *   <AnswerCard title={t('your_answer')}> …answer… </AnswerCard>
 *   <KeyBox label="Today's only job">…</KeyBox>      the one block that matters most
 *   <NoteBox>…</NoteBox>                              recap, where you stand, bottom line
 *   <SectionGroup> <ExpandAll /> <Section …/> … </SectionGroup>
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import Caret from './Caret';
import { RegisteredActions } from './ActionButtons';
import { useTranslation } from '../i18n/useTranslation';

export const SERIF = "'Source Serif 4', Georgia, serif";

// The standard `c` keys every tool shares, mapped to the scheme's roles.
// A tool adds its own keys after these.
export const SCHEME_C = {
  // Text boxes white on the lighter panel; typed text in the medium shade.
  input:         'bg-[var(--sc-card)] border-[var(--sc-line)] text-[var(--sc-accent)] placeholder:text-[var(--sc-accent)] placeholder:opacity-60 focus:border-[var(--sc-border,var(--sc-accent))] focus:ring-[var(--sc-line)]',
  labelText:     'text-[var(--sc-strong)]',
  sectionTitle:  'text-[var(--sc-strong)]',
  accentTxt:     'text-[var(--sc-accent)]',
  required:      'text-[var(--sc-accent)]',
  btnPrimary:    'bg-[var(--sc-button,var(--sc-strong))] hover:opacity-90 text-[var(--sc-button-text,var(--sc-on-strong))]',
  btnIdle:       '!bg-transparent !border-2 !border-[var(--sc-border,var(--sc-accent))] !text-[var(--sc-accent)] cursor-not-allowed',
  btnSecondary:  'border border-[var(--sc-border,var(--sc-accent))] text-[var(--sc-accent)] bg-transparent hover:bg-[var(--sc-field)]',
  border:        'border-[var(--sc-line)]',
  pillActive:    'border-[var(--sc-strong)] bg-[var(--sc-strong)] text-[var(--sc-on-strong)]',
  pillInactive:  'border-[var(--sc-border,var(--sc-accent))] text-[var(--sc-accent)] hover:bg-[var(--sc-field)]',
  highlightBg:   'bg-[var(--sc-envelope)] border-[var(--sc-line)]',
  highlightText: 'text-[var(--sc-strong)]',
  badge:         'bg-[var(--sc-envelope)] text-[var(--sc-accent)]',
  accentBadge:   'border border-[var(--sc-x-line)] text-[var(--sc-x-text)]',
  // Inside a section a card is spacing, not a box.
  card:          'border-transparent !px-0',
  cardAlt:       'bg-[var(--sc-envelope)]',
  quoteBg:       'border-s-2 border-[var(--sc-line)] !rounded-none !py-1 !pe-0',
  dropzone:      'border-[var(--sc-border,var(--sc-accent))] bg-[var(--sc-envelope)] text-[var(--sc-strong)]',
  // No traffic-light colours: key figures dark, small labels medium, warnings
  // (the contrast colour's one job) in the contrast shade.
  success:       'border-transparent !px-0 text-[var(--sc-strong)]',
  warning:       'border-transparent !px-0 text-[var(--sc-strong)]',
  danger:        'bg-[var(--sc-card)] border border-[var(--sc-x-line)] text-[var(--sc-x-text)]',
  successFg:     'text-[var(--sc-strong)]',
  warningFg:     'text-[var(--sc-accent)]',
  dangerFg:      'text-[var(--sc-x-text)]',
};

// Choice chips: a finger-sized target; the chosen one filled and ticked.
export const CHIP = 'px-3 py-2 rounded-lg text-[13px] font-bold border min-h-[40px]';

// The form's own panel: lightest shade, medium border, on the envelope.
export const FORM_PANEL = 'rounded-xl border-2 border-[var(--sc-border,var(--sc-accent))] bg-[var(--sc-field)] p-3 sm:p-5';

// The answer: one long card in the lightest shade, separate from the form,
// headed by its name with Copy / Share / Print on the same row.
export const ANSWER_CARD = 'rounded-2xl border border-[var(--sc-line)] bg-[var(--sc-field)] p-4 sm:p-5';

// The answer card's heading row, for a tool whose answer is several sibling
// blocks that one wrapper element holds (it adds ANSWER_CARD itself).
export function AnswerHeader({ title }) {
  return (
    // Wraps on a phone: the title keeps its line, the actions drop below.
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pb-3 mb-4 border-b border-[var(--sc-line)]">
      <h2 className="text-xl font-bold text-[var(--sc-strong)] whitespace-nowrap" style={{ fontFamily: SERIF }}>{title}</h2>
      <div data-print-hide><RegisteredActions /></div>
    </div>
  );
}

export function AnswerCard({ title, children, className = '' }) {
  return (
    <div className={`${ANSWER_CARD} ${className}`}>
      <AnswerHeader title={title} />
      {children}
    </div>
  );
}

// The single most important block of an answer: white, a stronger border in
// the medium shade, its label in the dark shade. One per answer.
export function KeyBox({ label, children, className = '' }) {
  return (
    <div data-keybox="" className={`border-2 border-[var(--sc-border,var(--sc-accent))] bg-[var(--sc-card)] rounded-xl p-4 sm:p-5 ${className}`}>
      {label && <p className="text-[13px] font-bold text-[var(--sc-strong)] mb-1">{label}</p>}
      {children}
    </div>
  );
}

// A boxed note in the envelope shade: what they told us, where they stand, a
// bottom line. `tone="alert"` for an urgent status — the contrast colour.
export function NoteBox({ children, tone, className = '' }) {
  const tint = tone === 'alert'
    ? 'border-[var(--sc-x-line)] text-[var(--sc-x-text)]'
    : 'border-[var(--sc-line)]';
  return <div className={`bg-[var(--sc-envelope)] border-2 rounded-xl p-5 ${tint} ${className}`}>{children}</div>;
}

// A part of the answer (Your next step, Your roadmap…): serif, over a rule.
// newPage: on paper the part starts a fresh page.
// (An arrow with no return statement, so audits that read a file's last
// top-level `return (` as its main render are not misled.)
export const PartHeading = ({ children, newPage = false }) => (
  <h2 className={`keep-with-next pt-5 pb-1 text-lg font-bold text-[var(--sc-strong)] border-b border-[var(--sc-line)] print:break-after-avoid ${newPage ? 'print:break-before-page' : ''}`}
    style={{ fontFamily: SERIF, breakAfter: 'avoid', pageBreakAfter: 'avoid' }}>
    {children}
  </h2>
);

// Expand all / Collapse all: one control for every Section inside a group.
const SectionsSignal = createContext(null);
// For a tool's own collapsible section: { n, open } changes on each Expand all.
export const useExpandAll = () => useContext(SectionsSignal);

export function SectionGroup({ children }) {
  const [all, setAll] = useState({ n: 0, open: false });
  return <SectionsSignal.Provider value={{ ...all, toggle: () => setAll(p => ({ n: p.n + 1, open: !p.open })) }}>{children}</SectionsSignal.Provider>;
}

export function ExpandAll({ className = '' }) {
  const all = useContext(SectionsSignal);
  const { t } = useTranslation();
  if (!all) return null;
  return (
    <div data-print-hide className={`flex justify-end -mb-2 ${className}`}>
      <button onClick={all.toggle}
        className="text-sm font-semibold text-[var(--sc-accent)] hover:text-[var(--sc-strong)] underline underline-offset-2">
        {all.open ? t('collapse_all') : t('expand_all')}
      </button>
    </div>
  );
}

// A collapsible section: a heading over a rule, not a card. Prints whether
// open or closed (data-print-heading / data-sec-body, printStyles).
// keepTogether: a short section prints whole on one page.
// `c` is the tool's colour object, so the same section works on a page
// without a category scheme.
export function Section({ icon, title, badge, badgeColor, children, defaultOpen = false, keepTogether = false, c }) {
  const [open, setOpen] = useState(defaultOpen);
  const all = useContext(SectionsSignal);
  useEffect(() => { if (all?.n) setOpen(all.open); }, [all?.n]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className={`border-t ${c.border} ${keepTogether ? 'keep-together' : ''}`}>
      <div className="keep-with-next">
        <button data-print-heading aria-expanded={open} onClick={() => setOpen(p => !p)}
          className="w-full py-4 flex items-center justify-between text-start min-h-[44px]">
          <div className="flex items-center gap-2.5">
            {icon && <span className="text-base">{icon}</span>}
            <h3 className={`text-base font-bold ${c.sectionTitle}`}>{title}</h3>
            {badge && <span className={`text-xs font-black px-2 py-0.5 rounded ${badgeColor || c.highlightBg}`}>{badge}</span>}
          </div>
          <span data-print-hide className={c.accentTxt}><Caret open={open} /></span>
        </button>
      </div>
      <div data-sec-body hidden={!open} className="pb-5 space-y-3">{children}</div>
    </div>
  );
}

// The row above the form: Try an example on the left, the tool's other
// controls (Edit details, Start over…) on the right. Labels never break.
export function ToolTopRow({ onExample, loading, children }) {
  const { t } = useTranslation();
  return (
    <div data-print-hide className="flex flex-wrap items-center justify-between gap-2 mb-4">
      {onExample
        ? <button onClick={onExample} disabled={loading} className={`px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap ${SCHEME_C.btnSecondary} disabled:opacity-40`}>{t('try_example')}</button>
        : <span />}
      {children && <div className="flex items-center gap-2 ms-auto">{children}</div>}
    </div>
  );
}
