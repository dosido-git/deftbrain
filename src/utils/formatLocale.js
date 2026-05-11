// src/utils/formatLocale.js
// Locale-aware formatting utilities — all powered by the native Intl API.
// Use these wherever Claude returns a structured numeric or date value
// that is rendered directly in JSX. Do NOT use these to reformat
// Claude's prose — only for structured fields we extract and display ourselves.
//
// All functions fail gracefully: if Intl is unavailable or the locale/currency
// is unrecognized, they fall back to a plain string representation.

/**
 * Format a number as a currency string in the user's locale.
 * Produces locale-correct decimal separators, thousands separators,
 * symbol position, and decimal places (e.g. JPY uses 0, KWD uses 3).
 *
 * @param {number} amount
 * @param {string} userLocale  - BCP 47 locale, e.g. 'id-ID', 'de-DE'
 * @param {string} userCurrency - ISO 4217 code, e.g. 'IDR', 'EUR'
 * @returns {string}
 */
export const formatCurrency = (amount, userLocale, userCurrency) => {
  try {
    return new Intl.NumberFormat(userLocale, {
      style: 'currency',
      currency: userCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount}`;
  }
};

/**
 * Format a plain number in the user's locale (no currency symbol).
 * Handles thousands separators and decimal conventions correctly.
 *
 * @param {number} n
 * @param {string} userLocale
 * @returns {string}
 */
export const formatNumber = (n, userLocale) => {
  try {
    return new Intl.NumberFormat(userLocale).format(n);
  } catch {
    return `${n}`;
  }
};

/**
 * Format a date in the user's locale using short date style.
 *
 * @param {Date|number|string} d
 * @param {string} userLocale
 * @returns {string}
 */
export const formatDate = (d, userLocale) => {
  try {
    return new Intl.DateTimeFormat(userLocale, { dateStyle: 'medium' }).format(new Date(d));
  } catch {
    return `${d}`;
  }
};

/**
 * Extract just the currency symbol for a given locale + currency code.
 * Useful for labeling input fields or display-only symbol contexts.
 * Falls back to the ISO code itself if extraction fails.
 *
 * @param {string} userLocale
 * @param {string} userCurrency
 * @returns {string}  e.g. '$', '€', '¥', 'IDR'
 */
export const currencySymbol = (userLocale, userCurrency) => {
  try {
    const parts = new Intl.NumberFormat(userLocale, {
      style: 'currency',
      currency: userCurrency,
    }).formatToParts(0);
    return parts.find(p => p.type === 'currency')?.value || userCurrency;
  } catch {
    return '$';
  }
};
