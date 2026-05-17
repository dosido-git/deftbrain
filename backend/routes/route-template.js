// ─────────────────────────────────────────────────────────────────────────────
// ROUTE TEMPLATE — copy this file to start a new backend route
// Replace every TODO with actual values before shipping.
//
// Naming: file name = kebab-case tool name (e.g. my-tool.js)
// Route path = /my-tool  (must match what callToolEndpoint() sends from frontend)
//
// Audit: run `python3 scripts/backend_audit_v1.py routes/my-tool.js` before PR.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';
const express = require('express');
const router  = express.Router();
const { callClaudeWithRetry, withLanguage } = require('../lib/claude');
// Add withLocaleContext if this tool reasons about money/costs:
// const { callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { rateLimit } = require('../lib/rateLimiter');

// ─── System prompt ───────────────────────────────────────────────────────────
// Keep this concise — it counts against your token budget on every call.
const SYSTEM_PROMPT = `TODO: describe the AI's role and output contract.
You always return only valid JSON with no markdown, no code blocks, and
no explanation outside the JSON object.`;

// ─── Route ───────────────────────────────────────────────────────────────────
// IMPORTANT: path must be the full /api segment — index.js mounts flat at /api/
// ✅ router.post('/my-tool', ...)   → handles POST /api/my-tool
// ❌ router.post('/', ...)          → registers at /api/ (wrong)
// ❌ router.post('/stream', ...)    → registers at /api/stream (wrong)

router.post('/TODO-tool-name', rateLimit(), async (req, res) => {
  // ── Destructure inputs ──────────────────────────────────────────────────
  const {
    // TODO: add your fields here
    primaryInput,
    userLanguage,
    // userLocale, userCurrency, userRegion,  // uncomment for locale-aware tools
  } = req.body;

  // ── Input validation ────────────────────────────────────────────────────
  if (!primaryInput?.trim()) {
    return res.status(400).json({ error: 'TODO: friendly validation message.' });
  }

  // ── Prompt ─────────────────────────────────────────────────────────────
  // Token sizing: set max_tokens to ~125% of expected output.
  // Count schema fields × average field length to estimate.
  // Most JSON tools: 1500–3000 tokens. Never exceed 3500 without justification.
  const prompt = `TODO: build the user prompt here.

Context: ${primaryInput.trim()}

Return ONLY valid JSON — no markdown fences, no preamble:

{
  "field_one": "...",
  "field_two": ["..."],
  "field_three": { "sub": "..." }
}`;

  try {
    // ── API call ──────────────────────────────────────────────────────────
    // callClaudeWithRetry returns a PARSED JS object — do NOT call
    // cleanJsonResponse() or JSON.parse() on the result.
    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,  // TODO: right-size to ~125% of expected output
      system: withLanguage(SYSTEM_PROMPT, userLanguage),
      // For locale-aware tools: withLanguage(SYSTEM_PROMPT, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion)
      messages: [{ role: 'user', content: prompt }],
    }, { label: 'TODO-tool-name' });

    // ── Response validation ───────────────────────────────────────────────
    // Check at least one required top-level field before sending to client.
    if (!parsed.field_one) {
      return res.status(500).json({ error: 'TODO: friendly error. Please try again.' });
    }

    // ── Send ──────────────────────────────────────────────────────────────
    // Shape the response explicitly — don't res.json(parsed) without validation.
    return res.json({
      field_one:   parsed.field_one   ?? '',
      field_two:   Array.isArray(parsed.field_two)   ? parsed.field_two   : [],
      field_three: parsed.field_three ?? null,
    });

  } catch (err) {
    // Always log the error so it appears in server console for debugging.
    // Never send err.message to the client — use a friendly hardcoded string.
    console.error('TODO-tool-name error:', err);
    return res.status(500).json({ error: 'TODO: friendly error. Please try again.' });
  }
});

// Additional routes follow the same pattern:
// router.post('/TODO-tool-name/sub-action', rateLimit(), async (req, res) => { ... });

module.exports = router;
