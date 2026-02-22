// backend/lib/claude.js
// Shared Anthropic client and utility functions for all route handlers

const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Strip markdown fences and extract the JSON object from Claude's response.
 * Handles cases where Claude wraps JSON in ```json ... ``` or adds preamble text.
 */
function cleanJsonResponse(text) {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  const firstBrace = cleaned.indexOf('{');
  if (firstBrace > 0) cleaned = cleaned.substring(firstBrace);
  const lastBrace = cleaned.lastIndexOf('}');
  if (lastBrace !== -1 && lastBrace < cleaned.length - 1) {
    cleaned = cleaned.substring(0, lastBrace + 1);
  }
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
 * Safely parse a JSON response from Claude, handling markdown fences
 * and minor formatting issues. Returns the parsed object or throws.
 */
function safeParseJSON(text) {
  const cleaned = cleanJsonResponse(text);
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // Try fixing common issues: trailing commas, unescaped newlines
    let patched = cleaned
      .replace(/,\s*([}\]])/g, '$1')           // trailing commas
      .replace(/[\x00-\x1F\x7F]/g, (ch) =>     // control chars inside strings
        ch === '\n' ? '\\n' : ch === '\t' ? '\\t' : ''
      );
    return JSON.parse(patched);
  }
}

/**
 * Call Claude with automatic retry (up to 2 retries) and safe JSON parsing.
 *
 * Usage:
 *   const parsed = await callClaudeWithRetry(prompt, {
 *     label: 'ToolName',       // for logging
 *     max_tokens: 2500,
 *     model: 'claude-sonnet-4-20250514',  // optional, defaults to sonnet
 *     system: 'optional system prompt',
 *   });
 *
 * @param {string} prompt - The user-turn prompt (must be a non-empty string)
 * @param {object} options - { label, max_tokens, model, system }
 * @returns {object} Parsed JSON from Claude's response
 */
async function callClaudeWithRetry(prompt, options = {}) {
  const {
    label = 'unknown',
    max_tokens = 2000,
    model = 'claude-sonnet-4-20250514',
    system,
  } = options;

  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const requestBody = {
        model,
        max_tokens,
        messages: [{ role: 'user', content: prompt }],
      };

      if (system) {
        requestBody.system = system;
      }

      const response = await anthropic.messages.create(requestBody);
      const text = response.content[0].text;
      const parsed = safeParseJSON(text);
      return parsed;
    } catch (error) {
      console.error(`[${label}] Attempt ${attempt}/${maxAttempts} failed:`, error.message);
      if (attempt === maxAttempts) {
        throw error;
      }
      // Brief back-off before retry
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }
}

module.exports = { anthropic, cleanJsonResponse, withLanguage, callClaudeWithRetry, safeParseJSON };
