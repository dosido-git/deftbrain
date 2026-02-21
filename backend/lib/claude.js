// backend/lib/claude.js
// Shared Anthropic client and utility functions for all route handlers
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

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
 * Robust JSON parser that handles common LLM output quirks:
 * - Trailing commas before } or ]
 * - Truncated output (attempts to close open braces/brackets)
 * - Control characters inside strings
 * - Falls back to cleanJsonResponse first
 */
function safeParseJSON(text) {
  const cleaned = cleanJsonResponse(text);

  // First try: direct parse (fast path)
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // Continue to repair attempts
    console.warn('[safeParseJSON] Direct parse failed, attempting repairs...');
  }

  let repaired = cleaned;

  // Fix trailing commas: ,} or ,]
  repaired = repaired.replace(/,\s*([}\]])/g, '$1');

  // Remove control characters inside strings (except \n, \t, \r which are valid)
  repaired = repaired.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '');

  // Second try: after comma/control char fixes
  try {
    return JSON.parse(repaired);
  } catch (e) {
    console.warn('[safeParseJSON] Repaired parse failed, attempting brace closure...');
  }

  // Attempt to close truncated JSON by counting open braces/brackets
  let openBraces = 0;
  let openBrackets = 0;
  let inString = false;
  let escape = false;

  for (let i = 0; i < repaired.length; i++) {
    const ch = repaired[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\' && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') openBraces++;
    if (ch === '}') openBraces--;
    if (ch === '[') openBrackets++;
    if (ch === ']') openBrackets--;
  }

  // Remove any trailing partial key/value (incomplete string after last comma)
  repaired = repaired.replace(/,\s*"[^"]*"?\s*:?\s*"?[^"]*$/, '');
  // Re-fix trailing commas after the trim
  repaired = repaired.replace(/,\s*([}\]])/g, '$1');

  // Close any open brackets/braces
  for (let i = 0; i < openBrackets; i++) repaired += ']';
  for (let i = 0; i < openBraces; i++) repaired += '}';

  // Third try
  try {
    return JSON.parse(repaired);
  } catch (e) {
    console.error('[safeParseJSON] All repair attempts failed. Cleaned text starts with:', cleaned.substring(0, 200));
    throw new Error('Failed to parse AI response as JSON after repair attempts');
  }
}

/**
 * Call Claude with automatic retry on failure.
 * Retries once with a brief delay if the first attempt fails or returns unparseable JSON.
 *
 * @param {object} params - Parameters for anthropic.messages.create
 * @param {object} options - { maxRetries: number, delayMs: number, label: string }
 * @returns {object} Parsed JSON response
 */
async function callClaudeWithRetry(params, options = {}) {
  const { maxRetries = 1, delayMs = 1000, label = 'Claude' } = options;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const message = await anthropic.messages.create(params);
      const textContent = message.content.find(item => item.type === 'text')?.text || '';

      if (!textContent.trim()) {
        throw new Error('Empty response from Claude');
      }

      return safeParseJSON(textContent);
    } catch (err) {
      if (attempt < maxRetries) {
        console.warn(`[${label}] Attempt ${attempt + 1} failed: ${err.message}. Retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      } else {
        throw err;
      }
    }
  }
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

module.exports = { anthropic, cleanJsonResponse, safeParseJSON, callClaudeWithRetry, withLanguage };
