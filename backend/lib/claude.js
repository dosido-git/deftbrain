// backend/lib/claude.js
// Shared Anthropic client and utility functions for all route handlers

const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ──────────────────────────────────────────────────────────────────────
// Current-date injection (global).
// Models otherwise reason from their training-era "present" (~2023), which
// makes time-sensitive tools wrong — e.g. BuyWise treating a 2023 car as a
// brand-new MSRP purchase instead of a 3-year-old used one. Every route —
// both the callClaudeWithRetry path and the ~31 routes that call
// anthropic.messages.create directly — shares THIS one client, so wrapping
// create() here injects today's date into every request with no per-route
// change. `system` is always a plain string in this codebase (no array /
// cache_control form), so a simple prepend is safe.
const _messagesCreate = anthropic.messages.create.bind(anthropic.messages);
anthropic.messages.create = function (params, ...rest) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const dateLine = `CURRENT DATE: Today is ${today}. Reason from this date as "now" — treat model years, product ages, prices, recency, availability, and any reference to "current"/"this year"/"new" accordingly. Do not assume an earlier year.`;
  const system = params && params.system ? `${dateLine}\n\n${params.system}` : dateLine;
  return _messagesCreate({ ...params, system }, ...rest);
};

/**
 * Repair literal control characters inside JSON string values.
 *
 * Claude occasionally emits literal newlines, carriage returns, or tabs
 * inside JSON string values instead of the required escape sequences
 * (\n, \r, \t). JSON.parse treats a bare newline inside a string as an
 * unterminated-string error. This walk fixes them before parsing.
 *
 * Safe to run on any JSON text: escape sequences already present (\n, \\, \")
 * are preserved unchanged; structural whitespace between fields is untouched.
 */
function repairJsonStrings(text) {
  let result = '';
  let inString = false;
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (!inString) {
      result += ch;
      if (ch === '"') inString = true;
    } else if (ch === '\\') {
      // Escape sequence — pass both characters through unchanged
      result += ch;
      if (i + 1 < text.length) { result += text[i + 1]; i++; }
    } else if (ch === '"') {
      result += ch;
      inString = false;
    } else if (ch === '\n') {
      result += '\\n';
    } else if (ch === '\r') {
      // Skip CR before LF (CRLF pair); lone CR becomes \r
      if (i + 1 < text.length && text[i + 1] === '\n') { /* LF handles it */ }
      else result += '\\r';
    } else if (ch === '\t') {
      result += '\\t';
    } else if (ch.charCodeAt(0) < 0x20) {
      result += '\\u' + ch.charCodeAt(0).toString(16).padStart(4, '0');
    } else {
      result += ch;
    }
    i++;
  }
  return result;
}

/**
 * Strip markdown fences and extract the JSON object from Claude's response.
 * Handles cases where Claude wraps JSON in ```json ... ``` or adds preamble text.
 * Also repairs literal control characters inside string values (see repairJsonStrings).
 */
function cleanJsonResponse(text) {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  // Array-aware: when the payload is a top-level JSON array, trim to the outer
  // [ ... ] instead of the object braces. Guarded on a leading '[' so object
  // responses (the overwhelming majority) take the unchanged path below.
  if (cleaned.startsWith('[')) {
    const lastBracket = cleaned.lastIndexOf(']');
    if (lastBracket !== -1 && lastBracket < cleaned.length - 1) {
      cleaned = cleaned.substring(0, lastBracket + 1);
    }
    return repairJsonStrings(cleaned);
  }
  const firstBrace = cleaned.indexOf('{');
  if (firstBrace > 0) cleaned = cleaned.substring(firstBrace);
  const lastBrace = cleaned.lastIndexOf('}');
  if (lastBrace !== -1 && lastBrace < cleaned.length - 1) {
    cleaned = cleaned.substring(0, lastBrace + 1);
  }
  cleaned = repairJsonStrings(cleaned);
  return cleaned;
}

/**
 * Map browser locale codes to human-readable language names.
 */
const LANGUAGE_NAMES = {
  'en': 'English', 'es': 'Spanish', 'fr': 'French', 'de': 'German',
  'it': 'Italian', 'pt': 'Portuguese', 'nl': 'Dutch', 'ru': 'Russian',
  'ja': 'Japanese', 'ko': 'Korean', 'zh': 'Chinese',
  'ar': 'Arabic', 'hi': 'Hindi', 'bn': 'Bengali', 'ta': 'Tamil',
  'te': 'Telugu', 'mr': 'Marathi', 'ur': 'Urdu',
  'tr': 'Turkish', 'pl': 'Polish', 'uk': 'Ukrainian', 'cs': 'Czech',
  'sv': 'Swedish', 'no': 'Norwegian', 'da': 'Danish', 'fi': 'Finnish',
  'el': 'Greek', 'he': 'Hebrew', 'th': 'Thai', 'vi': 'Vietnamese',
  'id': 'Indonesian', 'ms': 'Malay', 'tl': 'Filipino', 'fil': 'Filipino',
  'ro': 'Romanian', 'hu': 'Hungarian', 'sk': 'Slovak', 'bg': 'Bulgarian',
  'hr': 'Croatian', 'sr': 'Serbian', 'sl': 'Slovenian',
  'ca': 'Catalan', 'eu': 'Basque', 'gl': 'Galician',
  'af': 'Afrikaans', 'sw': 'Swahili', 'am': 'Amharic',
};

/**
 * Get the language name from a browser locale string.
 * @param {string} locale - e.g., 'ja-JP', 'pt-BR', 'en-US'
 * @returns {string|null} - e.g., 'Japanese', 'Portuguese', null for English
 */
function getLanguageName(locale) {
  if (!locale) return null;
  const lower = locale.toLowerCase();
  // English users don't need a language instruction
  if (lower.startsWith('en')) return null;
  // Try exact match first (e.g., 'pt-br'), then language code only
  const langCode = lower.split('-')[0];
  return LANGUAGE_NAMES[langCode] || null;
}

/**
 * Append a language instruction to a system prompt if the user's locale
 * indicates a non-English language. Returns the original prompt unchanged
 * for English-speaking users.
 *
 * Usage in routes:
 *   const { userLanguage } = req.body;
 *   const system = withLanguage(`Your prompt here...`, userLanguage);
 *
 * @param {string} systemPrompt - The base system prompt
 * @param {string} userLanguage - Browser locale (e.g., 'ja-JP', 'pt-BR')
 * @returns {string} - System prompt with language instruction appended
 */
function withLanguage(systemPrompt, userLanguage) {
  const langName = getLanguageName(userLanguage);
  if (!langName) return systemPrompt;
  return `${systemPrompt}

LANGUAGE: Respond entirely in ${langName}. All advice, descriptions, explanations, scripts, and human-readable text must be in ${langName}. Keep JSON keys in English but write all JSON string values in ${langName}. If you include a ready-to-use message or script the user will copy, write it in ${langName}.`;
}

/**
 * Call Claude with retry logic and safe JSON parsing.
 * 
 * Supports TWO calling conventions:
 * 
 * 1. Simple (prompt string):
 *    callClaudeWithRetry('Analyze this...', { label: 'MyTool', max_tokens: 2500 })
 * 
 * 2. Full request object:
 *    callClaudeWithRetry({
 *      model: 'claude-sonnet-4-20250514',
 *      max_tokens: 6000,
 *      system: 'You are...',
 *      messages: [{ role: 'user', content: prompt }],
 *    }, { label: 'MyTool' })
 * 
 * @param {string|object} promptOrRequest - Either a prompt string or a full API request object
 * @param {object} options - { label, max_tokens (for simple mode), maxRetries }
 * @returns {object} - Parsed JSON response
 */
async function callClaudeWithRetry(promptOrRequest, options = {}) {
  const { label = 'tool', maxRetries = 2 } = options;
  let lastError;

  // Detect calling convention: string = simple, object with messages = full request
  const isFullRequest = typeof promptOrRequest === 'object' && promptOrRequest.messages;

  const requestParams = isFullRequest
    ? {
        // Full request mode: use what was passed, apply defaults for missing fields
        model: promptOrRequest.model || 'claude-sonnet-4-20250514',
        max_tokens: promptOrRequest.max_tokens || options.max_tokens || 2500,
        system: promptOrRequest.system || 'You are a JSON API. You MUST respond with ONLY a valid JSON object. No preamble, no explanation, no markdown fences, no text before or after the JSON. Your entire response must be parseable by JSON.parse().',
        messages: promptOrRequest.messages,
      }
    : {
        // Simple string mode: wrap in messages array
        model: 'claude-sonnet-4-20250514',
        max_tokens: options.max_tokens || 2500,
        system: 'You are a JSON API. You MUST respond with ONLY a valid JSON object. No preamble, no explanation, no markdown fences, no text before or after the JSON. Your entire response must be parseable by JSON.parse().',
        messages: [{ role: 'user', content: promptOrRequest }],
      };

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    let message;
    try {
      message = await anthropic.messages.create(requestParams);
    } catch (err) {
      // API/network error (429, 5xx, overload) — transient, worth retrying.
      lastError = err;
      console.error(`[${label}] Attempt ${attempt + 1} API error:`, err.message);
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
        continue;
      }
      break;
    }

    // Truncation: the response hit the token ceiling, so the JSON is cut off. Retrying
    // regenerates the same over-budget output and truncates again — 3 slow attempts that
    // end in a gateway 502. Fail fast with an actionable error instead of retrying.
    if (message.stop_reason === 'max_tokens') {
      throw new Error(`[${label}] Response truncated at max_tokens=${requestParams.max_tokens}. Increase max_tokens or bound the schema/output size.`);
    }

    try {
      const textContent = message.content.find(item => item.type === 'text')?.text || '';
      return JSON.parse(cleanJsonResponse(textContent));
    } catch (err) {
      // Complete response but unparseable JSON — uncommon model variance; a retry may help.
      lastError = err;
      console.error(`[${label}] Attempt ${attempt + 1} parse error:`, err.message);
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
      }
    }
  }

  throw new Error(`[${label}] All ${maxRetries + 1} attempts failed. Last error: ${lastError?.message}`);
}

/**
 * Human-readable region names for prompt injection.
 */
const REGION_NAMES = {
  US: 'the United States', CA: 'Canada', AU: 'Australia', NZ: 'New Zealand',
  GB: 'the United Kingdom', IE: 'Ireland',
  DE: 'Germany', FR: 'France', IT: 'Italy', ES: 'Spain', NL: 'the Netherlands',
  PT: 'Portugal', BE: 'Belgium', AT: 'Austria', FI: 'Finland', GR: 'Greece',
  CH: 'Switzerland', SE: 'Sweden', NO: 'Norway', DK: 'Denmark', PL: 'Poland',
  CZ: 'the Czech Republic', HU: 'Hungary', RO: 'Romania', HR: 'Croatia',
  JP: 'Japan', KR: 'South Korea', CN: 'China', TW: 'Taiwan', HK: 'Hong Kong',
  SG: 'Singapore', MY: 'Malaysia', ID: 'Indonesia', TH: 'Thailand',
  VN: 'Vietnam', PH: 'the Philippines', IN: 'India', PK: 'Pakistan',
  BD: 'Bangladesh', LK: 'Sri Lanka',
  BR: 'Brazil', MX: 'Mexico', AR: 'Argentina', CL: 'Chile', CO: 'Colombia',
  ZA: 'South Africa', NG: 'Nigeria', KE: 'Kenya', GH: 'Ghana', EG: 'Egypt',
  RU: 'Russia', UA: 'Ukraine', TR: 'Turkey', IL: 'Israel',
  SA: 'Saudi Arabia', AE: 'the United Arab Emirates', QA: 'Qatar', KW: 'Kuwait',
};

/**
 * Human-readable currency names for prompt injection.
 */
const CURRENCY_NAMES = {
  USD: 'US dollars', CAD: 'Canadian dollars', AUD: 'Australian dollars',
  NZD: 'New Zealand dollars', GBP: 'British pounds', EUR: 'euros',
  CHF: 'Swiss francs', SEK: 'Swedish kronor', NOK: 'Norwegian kroner',
  DKK: 'Danish kroner', PLN: 'Polish zloty', CZK: 'Czech koruna',
  HUF: 'Hungarian forints', RON: 'Romanian lei',
  JPY: 'Japanese yen', KRW: 'South Korean won', CNY: 'Chinese yuan',
  TWD: 'New Taiwan dollars', HKD: 'Hong Kong dollars', SGD: 'Singapore dollars',
  MYR: 'Malaysian ringgit', IDR: 'Indonesian rupiah', THB: 'Thai baht',
  VND: 'Vietnamese dong', PHP: 'Philippine pesos', INR: 'Indian rupees',
  PKR: 'Pakistani rupees', BDT: 'Bangladeshi taka', LKR: 'Sri Lankan rupees',
  BRL: 'Brazilian reais', MXN: 'Mexican pesos', ARS: 'Argentine pesos',
  CLP: 'Chilean pesos', COP: 'Colombian pesos',
  ZAR: 'South African rand', NGN: 'Nigerian naira', KES: 'Kenyan shillings',
  GHS: 'Ghanaian cedis', EGP: 'Egyptian pounds',
  RUB: 'Russian rubles', UAH: 'Ukrainian hryvnias', TRY: 'Turkish lira',
  ILS: 'Israeli shekels', SAR: 'Saudi riyals', AED: 'UAE dirhams',
  QAR: 'Qatari riyals', KWD: 'Kuwaiti dinars',
};

/**
 * Inject regional economic context into a system prompt.
 * Use in tools that reason about money, costs, budgets, or quantities
 * that carry different meaning across economic environments.
 *
 * Returns an empty string for US/USD (the default training environment)
 * to avoid adding tokens with no benefit for the majority case.
 *
 * Usage in routes:
 *   const { userLocale, userCurrency, userRegion } = req.body;
 *   const localeDirective = withLocaleContext(userLocale, userCurrency, userRegion);
 *   const system = `${basePrompt}${langDirective}${localeDirective}`;
 *
 * @param {string} userLocale   - BCP 47 locale, e.g. 'id-ID'
 * @param {string} userCurrency - ISO 4217 code, e.g. 'IDR'
 * @param {string} userRegion   - ISO 3166-1 alpha-2, e.g. 'ID'
 * @returns {string}
 */
function withLocaleContext(userLocale, userCurrency, userRegion) {
  if (!userRegion || (userRegion === 'US' && userCurrency === 'USD')) return '';
  const regionName   = REGION_NAMES[userRegion]   || userRegion;
  const currencyName = CURRENCY_NAMES[userCurrency] || userCurrency;
  return `

LOCALE CONTEXT: The user is in ${regionName}. Format all currency amounts in ${currencyName} (${userCurrency}). Reason about amounts relative to ${regionName}'s economic norms and purchasing power — do not convert from USD or apply US economic intuitions. Use number and date conventions appropriate for ${userLocale}.`;
}

module.exports = { anthropic, cleanJsonResponse, callClaudeWithRetry, withLanguage, withLocaleContext };
