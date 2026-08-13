/**
 * src/i18n/useTranslation.js
 * ─────────────────────────────────────────────────────────────
 * React hook — mirrors the react-i18next useTranslation API.
 *
 * Usage in any component:
 *   import { useTranslation } from '../i18n/useTranslation';
 *   const { t, i18n } = useTranslation();
 *   <input placeholder={t('describe_situation')} />
 *
 * When migrating to react-i18next, change only the import:
 *   import { useTranslation } from 'react-i18next';
 * Everything else stays the same.
 */

import { useSyncExternalStore } from 'react';
import i18n from './index.js';

export const useTranslation = () => {
  // Re-render this component whenever the active language changes.
  // i18n.snapshot(), not i18n.language: a language's strings arrive after the
  // language itself does now, and React must re-render for the second event too.
  useSyncExternalStore(i18n.subscribe, i18n.snapshot, i18n.snapshot);
  return {
    t: (key, vars) => i18n.t(key, vars),
    i18n,
  };
};
