import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import i18n from '../i18n/index.js';
import { SUPPORTED_LANGUAGES } from '../i18n/locales/index.js';

/**
 * useLocale — single global source of truth for the user's locale.
 *
 * Two INDEPENDENT knobs the user can override from the header:
 *   • language  → drives UI strings (t() catalog), the AI's reply language
 *                 (userLanguage), and number/date formatting locale (userLocale)
 *   • currency  → drives the displayed currency symbol/format (userCurrency)
 *                 and the backend's economic-reasoning region (userRegion)
 *
 * Either knob can be 'auto', in which case it's detected from navigator.language.
 * Both choices persist to localStorage. Every tool reads the resolved fields via
 * useClaudeAPI (which now delegates here), so tools need no per-tool wiring.
 */

const LS_LANGUAGE = 'deftbrain-language';
const LS_CURRENCY = 'deftbrain-currency';

// region (ISO 3166-1 alpha-2) → currency (ISO 4217)
const REGION_CURRENCY = {
  US: 'USD', CA: 'CAD', AU: 'AUD', NZ: 'NZD', GB: 'GBP',
  DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR', NL: 'EUR', PT: 'EUR',
  BE: 'EUR', AT: 'EUR', FI: 'EUR', IE: 'EUR', GR: 'EUR', LU: 'EUR',
  CH: 'CHF', SE: 'SEK', NO: 'NOK', DK: 'DKK', PL: 'PLN',
  CZ: 'CZK', HU: 'HUF', RO: 'RON', BG: 'BGN', HR: 'EUR',
  JP: 'JPY', KR: 'KRW', CN: 'CNY', TW: 'TWD', HK: 'HKD',
  SG: 'SGD', MY: 'MYR', ID: 'IDR', TH: 'THB', VN: 'VND',
  PH: 'PHP', IN: 'INR', PK: 'PKR', BD: 'BDT', LK: 'LKR',
  BR: 'BRL', MX: 'MXN', AR: 'ARS', CL: 'CLP', CO: 'COP', PE: 'PEN',
  ZA: 'ZAR', NG: 'NGN', KE: 'KES', GH: 'GHS', EG: 'EGP',
  RU: 'RUB', UA: 'UAH', TR: 'TRY', IL: 'ILS',
  SA: 'SAR', AE: 'AED', QA: 'QAR', KW: 'KWD',
};

// language-only code → most likely region (fallback when navigator.language has no region tag)
const LANGUAGE_REGION_FALLBACK = {
  ja: 'JP', ko: 'KR', zh: 'CN', ar: 'SA', hi: 'IN', id: 'ID',
  ms: 'MY', th: 'TH', vi: 'VN', tl: 'PH', fil: 'PH',
  tr: 'TR', pl: 'PL', ru: 'RU', uk: 'UA', he: 'IL',
  sv: 'SE', no: 'NO', da: 'DK', fi: 'FI', el: 'GR',
};

// currency → representative region, for the backend's "user is in X" economic
// reasoning when the user overrides currency. First region wins (EUR → DE, etc.).
const CURRENCY_REGION = (() => {
  const m = {};
  for (const [region, cur] of Object.entries(REGION_CURRENCY)) {
    if (!(cur in m)) m[cur] = region;
  }
  return m;
})();

// Native display names for the 13 catalog languages (the ones with t() support).
const LANGUAGE_LABELS = {
  en: 'English', es: 'Español', zh: '中文', hi: 'हिन्दी', ar: 'العربية',
  pt: 'Português', fr: 'Français', de: 'Deutsch', ja: '日本語', ko: '한국어',
  ru: 'Русский', th: 'ไทย', vi: 'Tiếng Việt',
};

// Languages offered in the selector — only those the UI catalog can render.
export const LANGUAGES = SUPPORTED_LANGUAGES.map(code => ({
  code,
  label: LANGUAGE_LABELS[code] || code,
}));

// English names for the offered currencies (for the dropdown labels).
const CURRENCY_NAMES = {
  USD: 'US Dollar', EUR: 'Euro', GBP: 'British Pound', JPY: 'Japanese Yen',
  CNY: 'Chinese Yuan', CAD: 'Canadian Dollar', AUD: 'Australian Dollar',
  NZD: 'NZ Dollar', CHF: 'Swiss Franc', SEK: 'Swedish Krona', NOK: 'Norwegian Krone',
  DKK: 'Danish Krone', PLN: 'Polish Złoty', CZK: 'Czech Koruna', HUF: 'Hungarian Forint',
  RON: 'Romanian Leu', BGN: 'Bulgarian Lev', KRW: 'South Korean Won', TWD: 'Taiwan Dollar',
  HKD: 'Hong Kong Dollar', SGD: 'Singapore Dollar', MYR: 'Malaysian Ringgit',
  IDR: 'Indonesian Rupiah', THB: 'Thai Baht', VND: 'Vietnamese Đồng', PHP: 'Philippine Peso',
  INR: 'Indian Rupee', PKR: 'Pakistani Rupee', BDT: 'Bangladeshi Taka', LKR: 'Sri Lankan Rupee',
  BRL: 'Brazilian Real', MXN: 'Mexican Peso', ARS: 'Argentine Peso', CLP: 'Chilean Peso',
  COP: 'Colombian Peso', PEN: 'Peruvian Sol', ZAR: 'South African Rand', NGN: 'Nigerian Naira',
  KES: 'Kenyan Shilling', GHS: 'Ghanaian Cedi', EGP: 'Egyptian Pound', RUB: 'Russian Ruble',
  UAH: 'Ukrainian Hryvnia', TRY: 'Turkish Lira', ILS: 'Israeli Shekel', SAR: 'Saudi Riyal',
  AED: 'UAE Dirham', QAR: 'Qatari Riyal', KWD: 'Kuwaiti Dinar',
};

// Best-effort currency symbol for a code (for compact selector labels).
const currencySymbolFor = (code) => {
  try {
    return new Intl.NumberFormat('en', { style: 'currency', currency: code })
      .formatToParts(0).find(p => p.type === 'currency')?.value || code;
  } catch {
    return code;
  }
};

// Currencies offered in the selector — the unique set we can map to a region.
export const CURRENCIES = Object.keys(CURRENCY_REGION)
  .map(code => ({ code, name: CURRENCY_NAMES[code] || code, region: CURRENCY_REGION[code], symbol: currencySymbolFor(code) }))
  .sort((a, b) => a.name.localeCompare(b.name));

// Detect the browser defaults (used whenever a knob is 'auto').
function detectBrowser() {
  try {
    const locale = navigator.language || navigator.userLanguage || 'en-US';
    const parts = locale.split('-');
    const langBase = parts[0].toLowerCase();
    const region = parts[1] ? parts[1].toUpperCase() : (LANGUAGE_REGION_FALLBACK[langBase] || 'US');
    const currency = REGION_CURRENCY[region] || 'USD';
    return { locale, langBase, region, currency };
  } catch {
    return { locale: 'en-US', langBase: 'en', region: 'US', currency: 'USD' };
  }
}

const LocaleContext = createContext(null);

export const LocaleProvider = ({ children }) => {
  const browser = useMemo(detectBrowser, []);

  const [language, setLanguageState] = useState(() => localStorage.getItem(LS_LANGUAGE) || 'auto');
  const [currency, setCurrencyState] = useState(() => localStorage.getItem(LS_CURRENCY) || 'auto');

  const setLanguage = useCallback((lang) => {
    setLanguageState(lang);
    localStorage.setItem(LS_LANGUAGE, lang);
  }, []);

  const setCurrency = useCallback((cur) => {
    setCurrencyState(cur);
    localStorage.setItem(LS_CURRENCY, cur);
  }, []);

  // Resolve the four fields tools consume.
  const resolved = useMemo(() => {
    const langBase = language === 'auto' ? browser.langBase : language;
    // userLanguage: full browser locale when auto (keeps region-specific behavior),
    // else the base code (getLanguageName + the catalog both accept base codes).
    const userLanguage = language === 'auto' ? browser.locale : langBase;
    const userLocale = language === 'auto' ? browser.locale : langBase;

    const userCurrency = currency === 'auto' ? browser.currency : currency;
    const userRegion = currency === 'auto' ? browser.region : (CURRENCY_REGION[currency] || browser.region);

    return { userLanguage, userLocale, userRegion, userCurrency, langBase };
  }, [language, currency, browser]);

  // Keep the i18n singleton's active language in sync (drives t()).
  useEffect(() => {
    i18n.setLanguage(resolved.langBase);
  }, [resolved.langBase]);

  const value = useMemo(() => ({
    language,                 // 'auto' | catalog code
    currency,                 // 'auto' | ISO 4217
    setLanguage,
    setCurrency,
    userLanguage: resolved.userLanguage,
    userLocale: resolved.userLocale,
    userRegion: resolved.userRegion,
    userCurrency: resolved.userCurrency,
    LANGUAGES,
    CURRENCIES,
  }), [language, currency, setLanguage, setCurrency, resolved]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
};

export const useLocale = () => {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error('useLocale must be used within a LocaleProvider. Wrap your App with <LocaleProvider>.');
  }
  return ctx;
};
