/**
 * src/i18n/index.js
 * ─────────────────────────────────────────────────────────────
 * Lightweight i18next-compatible i18n core.
 *
 * Works today without installing i18next. When you're ready to
 * migrate to the full library:
 *   1. npm install i18next react-i18next
 *   2. Replace this file with standard i18next initialization
 *   3. Update useTranslation imports from '../i18n/useTranslation'
 *      to 'react-i18next'
 *   4. The JSON locale files in ./locales/ are unchanged — they're
 *      already in the format i18next expects.
 *
 * API mirrors i18next:
 *   import { t } from '../i18n';
 *   import { useTranslation } from '../i18n/useTranslation';
 *   const { t } = useTranslation();
 *   t('describe_situation') // → localized string
 *
 * Supported languages (add more by dropping a JSON file in ./locales/):
 *   en es zh hi ar pt fr de ja ko ru th vi
 *
 * Language resolution order:
 *   navigator.language (e.g. 'fr-FR') → strip region → 'fr'
 *   If not supported → fall back to 'en'
 *   If key missing in active language → fall back to 'en'
 *   If key missing in 'en' → return the key itself (safe fallback)
 */

import en from './locales/en.json';
import es from './locales/es.json';
import zh from './locales/zh.json';
import hi from './locales/hi.json';
import ar from './locales/ar.json';
import pt from './locales/pt.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import ja from './locales/ja.json';
import ko from './locales/ko.json';
import ru from './locales/ru.json';
import th from './locales/th.json';
import vi from './locales/vi.json';

const RESOURCES = { en, es, zh, hi, ar, pt, fr, de, ja, ko, ru, th, vi };

// Detect language from browser, resolve to supported code or 'en'
function detectLanguage() {
  try {
    const raw = navigator.language || navigator.userLanguage || 'en';
    // 'fr-FR' → 'fr', 'pt-BR' → 'pt', 'zh-Hans' → 'zh'
    const base = raw.split('-')[0].toLowerCase();
    return RESOURCES[base] ? base : 'en';
  } catch {
    return 'en';
  }
}

// ── i18next-compatible singleton ──────────────────────────────
const i18n = {
  language: detectLanguage(),

  // Core lookup — mirrors i18next t()
  // Supports interpolation: t('hello_name', { name: 'Bruce' })
  // with template: "Hello {{name}}" → "Hello Bruce"
  t(key, vars) {
    const lang = i18n.language;
    const str =
      RESOURCES[lang]?.[key] ??
      RESOURCES['en']?.[key] ??
      key; // safe fallback — returns the key if nothing found

    if (!vars) return str;

    // Simple {{variable}} interpolation
    return str.replace(/\{\{(\w+)\}\}/g, (_, k) =>
      vars[k] !== undefined ? vars[k] : `{{${k}}}`
    );
  },

  // Programmatic language change (for future language selector)
  changeLanguage(lang) {
    const base = lang.split('-')[0].toLowerCase();
    if (RESOURCES[base]) {
      i18n.language = base;
    }
    // Returns a promise to match i18next API shape
    return Promise.resolve();
  },

  // List of supported language codes
  supportedLngs: Object.keys(RESOURCES),

  // i18next compatibility shims
  isInitialized: true,
  on() {},   // no-op event emitter stub
  off() {},
};

export default i18n;
export const t = (key, vars) => i18n.t(key, vars);
