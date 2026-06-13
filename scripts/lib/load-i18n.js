// scripts/lib/load-i18n.js
//
// Shared catalog loader for the localization scripts (localization-audit.js,
// localization-smoke.js). Reads the self-contained data files directly —
// base.js and every tools/<tool>.js — and merges them the same way
// src/i18n/locales/index.js does at build time.
//
// Why not just load index.js? index.js uses ES `import` (for webpack), which
// neither eval nor CommonJS require can execute, and dynamic import() of a
// typeless .js breaks on Node < 22 (the Railway build runs 18/20). The data
// files have no imports, so stripping `export` and evaluating them works on
// any Node version.

'use strict';

const fs   = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', '..', 'src', 'i18n', 'locales');
const TOOLS_DIR   = path.join(LOCALES_DIR, 'tools');

// Evaluate a self-contained data module and return its single exported const.
function evalExport(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const m = raw.match(/export\s+const\s+(\w+)\s*=/);
  if (!m) throw new Error(`no "export const <name>" in ${file}`);
  const src = raw.replace(/\bexport\s+const\b/g, 'const');
  // eslint-disable-next-line no-new-func
  return new Function(`${src}\n;return ${m[1]};`)();
}

// Returns { RESOURCES, SUPPORTED_LANGUAGES } — identical shape to index.js.
function loadCatalog() {
  const base = evalExport(path.join(LOCALES_DIR, 'base.js'));
  const toolBlocks = fs.existsSync(TOOLS_DIR)
    ? fs.readdirSync(TOOLS_DIR).filter(f => f.endsWith('.js')).sort()
        .map(f => {
          // Skip a file that doesn't evaluate (e.g. mid-write during a parallel
          // localization run). A genuinely broken REGISTERED tool still fails the
          // audit downstream — its t('key') calls won't resolve to catalog entries.
          try { return evalExport(path.join(TOOLS_DIR, f)); }
          catch (e) { console.warn(`load-i18n: skipping ${f} — ${e.message}`); return null; }
        })
        .filter(Boolean)
    : [];
  const langs = Object.keys(base);
  const RESOURCES = {};
  for (const lang of langs) {
    RESOURCES[lang] = Object.assign({}, base[lang], ...toolBlocks.map(b => b[lang] || {}));
  }
  return { RESOURCES, SUPPORTED_LANGUAGES: langs };
}

module.exports = { loadCatalog };
