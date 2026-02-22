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
    try {
      const message = await anthropic.messages.create(requestParams);

      const textContent = message.content.find(item => item.type === 'text')?.text || '';
      const cleaned = cleanJsonResponse(textContent);
      const parsed = JSON.parse(cleaned);
      return parsed;
    } catch (err) {
      lastError = err;
      console.error(`[${label}] Attempt ${attempt + 1} failed:`, err.message);
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
      }
    }
  }

  throw new Error(`[${label}] All ${maxRetries + 1} attempts failed. Last error: ${lastError?.message}`);
}

module.exports = { anthropic, cleanJsonResponse, callClaudeWithRetry, withLanguage };
