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
  useSyncExternalStore(i18n.subscribe, () => i18n.language, () => i18n.language);
  return {
    t: (key, vars) => i18n.t(key, vars),
    i18n,
  };
};
