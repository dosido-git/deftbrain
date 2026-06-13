// src/i18n/locales/index.js
// ──────────────────────────────────────────────────────────────────────
// Catalog assembler. Base UI-chrome keys live in ./base.js; each fully
// localized tool contributes a per-language block from ./tools/<tool>.js.
// This module merges them into the i18next-shaped RESOURCES object.
//
// To localize a new tool:
//   1. Create src/i18n/locales/tools/<tool>.js exporting `export const <name> = { en: {...}, ... }`
//   2. Import it below and add it to TOOL_BLOCKS.
// The localization scripts (localization-audit.js, localization-smoke.js)
// auto-discover the tools/ directory, so they need no per-tool change.
// ──────────────────────────────────────────────────────────────────────

import { base } from './base';
import { subscriptionGuiltTrip } from './tools/subscription-guilt-trip';
import { markupDetective } from './tools/markup-detective';

// Every fully-localized tool's block, merged on top of the base chrome keys.
const TOOL_BLOCKS = [
  subscriptionGuiltTrip,
  markupDetective,
];

const LANGS = Object.keys(base);

export const RESOURCES = Object.fromEntries(
  LANGS.map(lang => [
    lang,
    Object.assign({}, base[lang], ...TOOL_BLOCKS.map(block => block[lang] || {})),
  ])
);

export const SUPPORTED_LANGUAGES = Object.keys(RESOURCES);
