// backend/lib/claude.js
// Shared Anthropic client and utility functions for all route handlers

const Anthropic = require('@anthropic-ai/sdk');
const { MODELS, ALL_MODELS } = require('./models');

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
 * Also repairs INVALID escapes inside strings — e.g. \' (an escaped single
 * quote, which JSON forbids; some languages' quoted-speech output emits it) —
 * by dropping the stray backslash. Valid JSON never contains an invalid escape,
 * so this is a no-op on well-formed output.
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
      const next = i + 1 < text.length ? text[i + 1] : '';
      if (next && '"\\/bfnrtu'.indexOf(next) === -1) {
        // Invalid JSON escape (e.g. \' from single-quoted speech) — drop the stray backslash
        result += next;
        i++;
      } else {
        // Valid escape sequence — pass both characters through unchanged
        result += ch;
        if (next) { result += next; i++; }
      }
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

// Last-resort repairs for malformed-but-recoverable JSON: a trailing comma
// before a closing bracket, or an unquoted object key (both invalid JSON,
// occasional model slip-ups). Deliberately NOT folded into cleanJsonResponse
// itself — these are naive (non-string-aware) regexes that could corrupt a
// string value containing a comma-then-brace or word-then-colon pattern in
// prose, so they only run as a second attempt after the primary parse fails,
// matching the staged-escalation approach LeaseTrapDetector's local parser
// used before this was generalized into the shared helper.
function repairMalformedJson(text) {
  return text
    .replace(/,(\s*[}\]])/g, '$1')
    .replace(/[\x00-\x1F\x7F]/g, ' ')
    .replace(/([{,]\s*)(\w+)\s*:/g, '$1"$2":');
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
 * Backoff before a retry: exponential with equal jitter, capped at 10s.
 * An overloaded API (429/529) needs room to recover — retrying too fast just
 * gets rejected again — so this grows 1s→2s→4s… and adds jitter to avoid a
 * thundering herd of synchronized retries. (Linear 0.5s steps recovered too
 * aggressively under overload.)
 * @param {number} attempt - zero-based attempt index
 * @returns {number} delay in milliseconds, in [base/2, base]
 */
function retryBackoffMs(attempt) {
  const base = Math.min(10000, 1000 * Math.pow(2, attempt)); // 1s, 2s, 4s, 8s, 10s(cap)
  return Math.round(base / 2 + Math.random() * (base / 2));
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
 *      model: MODELS.SMART,
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
        model: promptOrRequest.model || MODELS.SMART,
        max_tokens: promptOrRequest.max_tokens || options.max_tokens || 2500,
        system: promptOrRequest.system || 'You are a JSON API. You MUST respond with ONLY a valid JSON object. No preamble, no explanation, no markdown fences, no text before or after the JSON. Your entire response must be parseable by JSON.parse().',
        messages: promptOrRequest.messages,
        // Optional passthrough for server-side tools (e.g. web_search). Only a
        // handful of tools need this (SafeWalk, DriveHome) — omitted entirely
        // when absent so every other caller's request shape is unchanged.
        ...(promptOrRequest.tools ? { tools: promptOrRequest.tools } : {}),
      }
    : {
        // Simple string mode: wrap in messages array. options.system/options.model
        // are honored — they used to be silently dropped, which stripped
        // contrast-report's personality + withLanguage directive (non-English
        // users got English output) without any gate noticing.
        model: options.model || MODELS.SMART,
        max_tokens: options.max_tokens || 2500,
        system: options.system || 'You are a JSON API. You MUST respond with ONLY a valid JSON object. No preamble, no explanation, no markdown fences, no text before or after the JSON. Your entire response must be parseable by JSON.parse().',
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
        await new Promise(r => setTimeout(r, retryBackoffMs(attempt)));
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
      // Join ALL text blocks, not just the first — a tools-enabled response
      // (web_search) can interleave tool_use blocks with multiple text blocks
      // across search rounds; .find() would silently drop everything after
      // the first one. For the common single-text-block case this is
      // identical to before.
      const textContent = message.content.filter(item => item.type === 'text').map(item => item.text).join('');
      const cleaned = cleanJsonResponse(textContent);
      try {
        return JSON.parse(cleaned);
      } catch (_primaryErr) {
        // Second attempt with the more aggressive (non-string-aware) repairs —
        // see repairMalformedJson. A genuinely malformed response fails both
        // and falls through to the retry loop below as before.
        return JSON.parse(repairMalformedJson(cleaned));
      }
    } catch (err) {
      // Complete response but unparseable JSON — uncommon model variance; a retry may help.
      lastError = err;
      console.error(`[${label}] Attempt ${attempt + 1} parse error:`, err.message);
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, retryBackoffMs(attempt)));
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

// ──────────────────────────────────────────────────────────────────────
// Model liveness check — catch a retired model at DEPLOY time, not when a
// user hits a silent 500 (the 2026-07 contrast-report outage). Pings every id
// in ALL_MODELS with a 1-token request (~3 calls total, negligible cost).
// A retired/unknown model answers 404 not_found → that's the alarm. Transient
// errors (429/5xx/network) are NOT treated as retirement — we don't want false
// alarms from a blip. Never throws. Result is cached for /api/health/models.
// ──────────────────────────────────────────────────────────────────────
let _modelStatus = null;  // { at, allOk, retired:[], results:[{model, ok, retired, error}] }

async function checkModels() {
  const results = await Promise.all(ALL_MODELS.map(async (model) => {
    try {
      // Raw client (skip the date-injection wrapper — irrelevant for a ping).
      await _messagesCreate({ model, max_tokens: 1, messages: [{ role: 'user', content: 'hi' }] });
      return { model, ok: true, retired: false };
    } catch (err) {
      const status = err && err.status;
      const retired = status === 404 || /not_found/i.test((err && err.message) || '');
      return { model, ok: false, retired, error: `${status || '?'} ${(err && err.message) || err}`.slice(0, 140) };
    }
  }));
  const retired = results.filter(r => r.retired).map(r => r.model);
  // allOk = no CONFIRMED retirement. Transient failures don't flip it (avoids
  // false 503s), but they're still visible in `results`.
  _modelStatus = { at: Date.now(), allOk: retired.length === 0, retired, results };
  return _modelStatus;
}

function getModelStatus() { return _modelStatus; }

module.exports = { anthropic, cleanJsonResponse, callClaudeWithRetry, withLanguage, withLocaleContext, checkModels, getModelStatus, MODELS, ALL_MODELS };
