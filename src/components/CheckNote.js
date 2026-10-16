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

export default function CheckNote({ status, className = '' }) {
  const { t } = useTranslation();
  if (!status) return null;
  const text = status === 'checking' ? t('check_pending') : status === 'fixed' ? t('check_fixed') : t('check_done');
  return (
    <p data-print-hide role="status" aria-live="polite" className={`text-xs ${className}`}>
      {status === 'checking'
        ? <span className="inline-block animate-pulse" aria-hidden="true">⋯ </span>
        : <span aria-hidden="true">✓ </span>}
      {text}
    </p>
  );
}

// Map a progressive call's onChecked(changed) to a CheckNote status.
export const checkStatusFor = (changed) => (Array.isArray(changed) && changed.length ? 'fixed' : 'done');
