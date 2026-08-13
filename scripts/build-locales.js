#!/usr/bin/env node
/**
 * scripts/build-locales.js
 * ──────────────────────────────────────────────────────────────────────
 * Emits one flat JSON file per language into src/i18n/locales/generated/,
 * so webpack can hand a visitor the language they read and nothing else.
 *
 * WHY THIS EXISTS
 * The catalog is authored per TOOL — src/i18n/locales/tools/<tool>.js, each
 * holding all thirteen languages — because that is the right shape for
 * writing and reviewing a tool's copy. It is the wrong shape for shipping:
 * index.js statically imported all 126 of them, so the main bundle carried
 * every string of every tool in every language, and a visitor reading one
 * tool in English paid for twelve languages they cannot read. That catalog
 * was 15 MB of a 19.9 MB bundle.
 *
 * So the authoring shape stays, and this pivots it at build time. The
 * generated files are artifacts, never edited and never committed —
 * prestart and prebuild regenerate them, which is also why they cannot
 * drift from source.
 *
 * ENGLISH IS DELIBERATELY STILL BUNDLED. index.js imports en.json
 * statically and the other twelve dynamically: t() already falls back to
 * English for any missing key, so a non-English visitor sees correct
 * English for the few hundred milliseconds before their chunk lands,
 * rather than a flash of raw key names or an empty screen.
 *
 * Usage:
 *   node scripts/build-locales.js           write the files
 *   node scripts/build-locales.js --check   verify they match source (CI)
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { loadCatalog } = require('./lib/load-i18n');

const OUT_DIR = path.join(__dirname, '..', 'src', 'i18n', 'locales', 'generated');
const CHECK = process.argv.includes('--check');

function main() {
  const { RESOURCES } = loadCatalog();
  const langs = Object.keys(RESOURCES).sort();

  if (!langs.length) {
    console.error('❌ build-locales: catalog loaded but contains no languages.');
    process.exit(1);
  }
  if (!RESOURCES.en) {
    // en.json is imported statically and is the fallback for every other
    // language; without it the app has nothing to render.
    console.error('❌ build-locales: no English catalog — en is the static fallback and cannot be missing.');
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  let drift = 0;
  let total = 0;
  const sizes = [];

  for (const lang of langs) {
    // Sorted keys so the output is byte-stable between runs — otherwise
    // --check reports drift every time the source files are reordered.
    const table = RESOURCES[lang];
    const sorted = Object.fromEntries(Object.keys(table).sort().map(k => [k, table[k]]));
    const json = JSON.stringify(sorted) + '\n';
    const file = path.join(OUT_DIR, `${lang}.json`);

    total += Object.keys(sorted).length;
    sizes.push([lang, Buffer.byteLength(json)]);

    if (CHECK) {
      const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
      if (current !== json) {
        console.error(`   drift: ${lang}.json ${current === null ? 'is missing' : 'does not match source'}`);
        drift++;
      }
    } else {
      fs.writeFileSync(file, json);
    }
  }

  // A stale language file left behind after a language is dropped would keep
  // being served to anyone whose browser still asks for it.
  const expected = new Set(langs.map(l => `${l}.json`));
  const strays = fs.existsSync(OUT_DIR)
    ? fs.readdirSync(OUT_DIR).filter(f => f.endsWith('.json') && !expected.has(f))
    : [];
  for (const stray of strays) {
    if (CHECK) { console.error(`   stray: ${stray} is not a supported language`); drift++; }
    else fs.unlinkSync(path.join(OUT_DIR, stray));
  }

  if (CHECK) {
    if (drift) {
      console.error(`\n❌ build-locales: ${drift} generated file(s) out of date.\n   Fix: node scripts/build-locales.js\n`);
      process.exit(1);
    }
    console.log(`✅ build-locales: ${langs.length} language file(s) match source.`);
    return;
  }

  const biggest = sizes.sort((a, b) => b[1] - a[1])[0];
  const sum = sizes.reduce((n, [, b]) => n + b, 0);
  console.log(
    `✅ build-locales: ${langs.length} languages, ${total.toLocaleString()} keys, ` +
    `${(sum / 1048576).toFixed(1)} MB total — largest ${biggest[0]}.json at ${(biggest[1] / 1048576).toFixed(1)} MB. ` +
    `Only en.json ships in the main bundle.`
  );
}

main();
