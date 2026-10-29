/**
 * CheckNote — one quiet line under a progressive answer (2026-10-15).
 *
 * A progressive tool (useClaudeAPI().callToolEndpointProgressive) shows its
 * answer before the details are double-checked. This line says so while the
 * check runs, and says plainly when the check corrected something — the
 * answer never changes silently under the reader.
 *
 *   status: 'checking' | 'done' | 'fixed' | null
 *   className: the tool's own muted text class, so it matches the page.
 */
import React from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { useTheme } from '../hooks/useTheme';

// A boxed status line, not a quiet one (owner, 2026-10-24): once the first
// part shows, the submit button's spinner stops, and "Double-checking…" in
// small grey text did not say whether the tool was finished. While working it
// says so, with a spinner and what is still coming; when done, it says
// "Finished". `className` (the tool's muted text class) is no longer needed
// for the colors but is still accepted from the 89 callers.
export default function CheckNote({ status }) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  if (!status) return null;
  const working = status === 'checking';
  const text = working ? t('check_pending') : status === 'fixed' ? t('check_fixed') : status === 'finished' ? t('check_finished') : t('check_done');
  const tone = working
    ? (isDark ? 'bg-amber-900/25 border-amber-700 text-amber-100' : 'bg-amber-50 border-amber-300 text-amber-900')
    : (isDark ? 'bg-emerald-900/20 border-emerald-700 text-emerald-200' : 'bg-emerald-50 border-emerald-300 text-emerald-800');
  // On a category-colour page (ToolPageWrapper sets data-scheme) the note
  // takes the page's shades instead of amber / green (audit/CONVENTIONS.md
  // "Category-colour pages": no traffic-light colours).
  const scheme = working
    ? '[[data-scheme]_&]:bg-[var(--sc-envelope)] [[data-scheme]_&]:border-[var(--sc-border,var(--sc-accent))] [[data-scheme]_&]:text-[var(--sc-strong)]'
    : '[[data-scheme]_&]:bg-[var(--sc-card)] [[data-scheme]_&]:border-[var(--sc-line)] [[data-scheme]_&]:text-[var(--sc-strong)]';
  return (
    <p data-print-hide role="status" aria-live="polite" className={`flex items-start gap-2 border rounded-lg px-3 py-2 text-sm font-semibold ${tone} ${scheme}`}>
      {working
        ? <span aria-hidden="true" className="mt-[3px] inline-block w-3.5 h-3.5 flex-shrink-0 rounded-full border-2 border-current border-t-transparent animate-spin" />
        : <span aria-hidden="true">✓</span>}
      <span>{text}</span>
    </p>
  );
}

// Map a progressive call's onChecked(changed) to a CheckNote status.
// null = the stream ended with no check (useClaudeAPI): finished, not "double-checked".
export const checkStatusFor = (changed) => (changed === null ? 'finished' : Array.isArray(changed) && changed.length ? 'fixed' : 'done');
