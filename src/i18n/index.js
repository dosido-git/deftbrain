/**
 * src/i18n/index.js
 * ─────────────────────────────────────────────────────────────
 * Lightweight i18next-compatible translation singleton.
 *
 * Works today without installing i18next. When you're ready to
 * migrate to the full library:
 *   1. npm install i18next react-i18next
 *   2. Replace this file with standard i18next initialization
 *   3. Update useTranslation imports from '../i18n/useTranslation'
 *      to 'react-i18next'
 *   4. The locale data in ./locales/index.js is already in the
 *      key/value format i18next expects — split into per-language
 *      JSON files at migration time.
 *
 * API mirrors i18next:
 *   import { t } from '../i18n';
 *   import { useTranslation } from '../i18n/useTranslation';
 *   const { t } = useTranslation();
 *   t('describe_situation') // → localized string
 *
 * Supported languages: en es zh hi ar pt fr de ja ko ru th vi
 *
 * Language resolution order:
 *   navigator.language (e.g. 'fr-FR') → strip region → 'fr'
 *   If not supported → fall back to 'en'
 *   If key missing in active language → fall back to 'en'
 *   If key missing in 'en' → return the key itself (safe fallback)
 */

import { EN_RESOURCES, SUPPORTED_LANGUAGES, loadLanguage } from './locales/index.js';

// Only the active language is held in memory, and only English is present at
// first paint — the other twelve arrive as chunks. See locales/index.js.
const RESOURCES = { en: EN_RESOURCES };
const loading = new Set();

// Fetch a language once, then wake every mounted t() consumer. Failures are
// swallowed on purpose: a chunk that will not load leaves the interface in
// English, which is the same fallback a missing key already takes.
function ensureLanguage(lang) {
  if (!lang || RESOURCES[lang] || loading.has(lang)) return;
  loading.add(lang);
  loadLanguage(lang)
    .then(table => { RESOURCES[lang] = table; notify(); })
    .catch(() => {})
    .finally(() => loading.delete(lang));
}

// Subscribers (React components via useSyncExternalStore) notified on language change.
const listeners = new Set();

// useSyncExternalStore re-renders only when the SNAPSHOT changes, and the
// snapshot used to be i18n.language alone. That was fine while every language
// was in the bundle, because language changed and the strings were already
// there. Now a switch to Spanish fires twice — once when the language changes,
// once when its chunk lands — and the second notify carried an identical
// snapshot ('es' → 'es'), so React skipped the render that would have shown
// the Spanish. The revision makes "the table changed" visible to React even
// when the language name did not.
let revision = 0;
function notify() { revision++; listeners.forEach(cb => cb()); }

// Detect language from browser, resolve to supported code or 'en'
function detectLanguage() {
  try {
    const raw =
      (typeof navigator !== 'undefined' &&
        (navigator.language || navigator.userLanguage)) ||
      'en';
    // 'fr-FR' → 'fr', 'pt-BR' → 'pt', 'zh-Hans' → 'zh'
    const base = raw.split('-')[0].toLowerCase();
    return SUPPORTED_LANGUAGES.includes(base) ? base : 'en';
  } catch {
    return 'en';
  }
}

// ── i18next-compatible singleton ──────────────────────────────
// languages: en, es, zh, hi, ar, pt, fr, de, ja, ko, ru, th, vi
const i18n = {
  language: detectLanguage(),

  // Core lookup — mirrors i18next t()
  // Supports interpolation: t('hello_name', { name: 'Bruce' })
  // with template: "Hello {{name}}" → "Hello Bruce"
  t(key, vars) {
    const lang = i18n.language;
    // `??` falls through on null/undefined but NOT on '', so an empty value in
    // the active language returned an empty string — the control rendered with
    // no label at all, which is worse than either the English text or the raw
    // key, and gives nobody a thread to pull. Fan Theory's submit button
    // (2026-08-26) is how this surfaced: the same component's loading label
    // rendered and its idle label did not. Treat empty as missing.
    const own = RESOURCES[lang]?.[key];
    const str =
      (own !== undefined && own !== '') ? own
      : (RESOURCES['en']?.[key] || key); // never return nothing

    if (!vars) return str;

    // Simple {{variable}} interpolation
    return str.replace(/\{\{(\w+)\}\}/g, (_, k) =>
      vars[k] !== undefined ? vars[k] : `{{${k}}}`
    );
  },

  // Count-aware lookup. t() alone cannot do this: a single string per key
  // forces one grammatical form on every count, which is merely slightly off
  // in English ("1 sessions") and outright ungrammatical in Russian, where
  // 2 and 5 take different noun forms, or Arabic, which has six.
  //
  // Resolves <key>_<CLDR category> for the ACTIVE language's own category
  // set — ru needs one/few/many/other, ar all six, zh/ja/ko/th/vi only
  // other — then falls back within that language to _other, then to the bare
  // key. If the language has none of them, the English fallback re-selects
  // using ENGLISH's categories, because ru's `_few` has no English counterpart.
  //
  // Callers pass the raw number; `vars` still carries whatever the string
  // interpolates, which is not always named `count` (dn_about_hours uses {{n}}
  // and can be fractional — Intl handles that, and it is why ru keeps _other).
  tPlural(key, count, vars) {
    const n = Number(count);
    const pick = (lang) => {
      let cat = 'other';
      try {
        cat = new Intl.PluralRules(lang).select(Number.isFinite(n) ? n : 0);
      } catch {
        cat = n === 1 ? 'one' : 'other';
      }
      for (const k of [`${key}_${cat}`, `${key}_other`, key]) {
        const v = RESOURCES[lang]?.[k];
        if (v !== undefined && v !== '') return v;
      }
      return null;
    };
    const str = pick(i18n.language) ?? pick('en') ?? key;
    if (!vars) return str;
    return str.replace(/\{\{(\w+)\}\}/g, (_, k) =>
      vars[k] !== undefined ? vars[k] : `{{${k}}}`
    );
  },

  // The English value for a key, whatever the active language is.
  //
  // For CODE that compares two strings rather than showing one. BikeMedic
  // decides whether you own the tool a repair needs by substring-matching the
  // inventory label against the fix's tool label — a comparison that only
  // holds in the language the two labels were written to overlap in. In
  // Russian, Hindi, Thai and Vietnamese the translations drifted apart and the
  // tool told people they were missing a wrench they had told it they owned.
  // Compare in English; display with t().
  tEn(key) {
    const v = RESOURCES.en?.[key];
    return (v !== undefined && v !== '') ? v : key;
  },

  // Set the active language (base code or full locale). Unsupported → 'en'.
  // Notifies subscribers so mounted t() consumers re-render.
  setLanguage(lang) {
    const base = String(lang || 'en').split('-')[0].toLowerCase();
    const next = SUPPORTED_LANGUAGES.includes(base) ? base : 'en';
    // Switch immediately and fetch behind it. Until the chunk lands t()
    // falls through to English, so the screen stays readable rather than
    // going blank or showing key names while the network works.
    if (next !== i18n.language) {
      i18n.language = next;
      ensureLanguage(next);
      notify();
    }
  },

  // Programmatic language change (i18next-compatible shape).
  changeLanguage(lang) {
    i18n.setLanguage(lang);
    return Promise.resolve();
  },

  // What useSyncExternalStore compares between renders: the active language
  // AND how many times the catalog has changed under it.
  snapshot() { return i18n.language + '#' + revision; },

  // Subscribe to language changes (for useSyncExternalStore).
  subscribe(cb) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },

  // List of supported language codes
  supportedLngs: SUPPORTED_LANGUAGES,

  // i18next compatibility shims
  isInitialized: true,
  on() {},   // no-op event emitter stub
  off() {},
};

// A visitor whose browser is set to something other than English starts the
// download now rather than on first render.
ensureLanguage(i18n.language);

export default i18n;
export const t = (key, vars) => i18n.t(key, vars);
export const tPlural = (key, count, vars) => i18n.tPlural(key, count, vars);
