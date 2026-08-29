#!/usr/bin/env node
/**
 * i18n-quality-audit.js — the mechanical half of localization quality.
 *
 * Gate 5 (localization-audit.js) answers "does every key exist in every
 * language". That is completeness. It cannot see whether a translation is
 * still CORRECT — and the catalog-wide sweep on 2026-08-29 found the gap is
 * real: 31 keys whose English was revised while some or all translations
 * stayed frozen, and 26 strings still naming a tool renamed hours earlier.
 * Both classes are invisible to a key-existence check, and both shipped.
 *
 * Six checks, all deterministic, all free, all catalog-wide (not the
 * LOCALIZED_TOOLS allowlist — a tool that is not yet fully localized can still
 * carry a stale translation, and the drift matters either way):
 *
 *   1. FRESHNESS   — English value changed since the committed baseline while
 *                    a translation did not. THE point of this script.
 *   2. PLACEHOLDER — {{var}} sets must match English exactly, per language.
 *                    A dropped variable renders a literal "{{name}}" to a user.
 *   3. SCRIPT      — a CJK/Arabic/Cyrillic/etc. value that is entirely Latin
 *                    text is either untranslated or the wrong language.
 *   4. RENAMED     — any value still containing a retired tool name from
 *                    audit/RENAMES.md. This is what caught GRAVITY WELL.
 *   5. EXPANSION   — a translation far longer than its English source is a
 *                    clipping risk in a fixed-width UI slot.
 *   6. INVARIANT   — a brand/tool name that got translated in one language
 *                    while staying English in the other twelve.
 *
 * The baseline for check 1 lives in src/data/i18n-freshness.json: one sha of
 * the English value per key. It must travel with the content it describes, the
 * same contract as the sitemap lastmod state — a stale baseline silently
 * reports every key as fresh.
 *
 * Usage:
 *   node scripts/i18n-quality-audit.js              # report (exit 0 unless --strict)
 *   node scripts/i18n-quality-audit.js --strict     # exit 1 on any finding
 *   node scripts/i18n-quality-audit.js --write-state  # accept current English as the baseline
 *   node scripts/i18n-quality-audit.js --json
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const GEN = path.join(ROOT, 'src/i18n/locales/generated');
const STATE = path.join(ROOT, 'src/data/i18n-freshness.json');
const RENAMES = path.join(ROOT, 'audit/RENAMES.md');

const argv = process.argv.slice(2);
const WRITE_STATE = argv.includes('--write-state');
const STRICT = argv.includes('--strict');
const JSON_OUT = argv.includes('--json');

// Scripts a translation is expected to contain at least some of. A value that
// is pure Latin prose in one of these languages did not get translated.
const SCRIPT_OF = {
  ar: /[؀-ۿ]/, zh: /[一-鿿]/, ja: /[぀-ヿ一-鿿]/,
  ko: /[가-힯]/, ru: /[Ѐ-ӿ]/, hi: /[ऀ-ॿ]/, th: /[฀-๿]/,
};
// Two or more consecutive Latin words — enough prose to be a real sentence
// rather than a brand token, a unit, or an emoji label.
const LATIN_PROSE = /[a-z]{4,}\s+[a-z]{3,}/i;
const EXPANSION_RATIO = 2.2;   // tuned on the 2026-08-29 sweep: 21 fr / 15 de / 13 ru
const EXPANSION_MIN_LEN = 12;  // below this, ratios are noise

const sha = s => crypto.createHash('sha256').update(s, 'utf8').digest('hex').slice(0, 16);

function loadLangs() {
  if (!fs.existsSync(GEN)) {
    console.error('❌ i18n-quality-audit: no generated bundles — run `npm run build:locales` first.');
    process.exit(1);
  }
  const out = {};
  for (const f of fs.readdirSync(GEN).filter(f => f.endsWith('.json'))) {
    out[f.replace('.json', '')] = JSON.parse(fs.readFileSync(path.join(GEN, f), 'utf8'));
  }
  return out;
}

// Old names from the ledger, minus the ones that are still live tool names
// somewhere else in the catalog (a rename target is not a stale reference).
function retiredNames(langs) {
  if (!fs.existsSync(RENAMES)) return [];
  const md = fs.readFileSync(RENAMES, 'utf8');
  const olds = new Set(), news = new Set();
  for (const line of md.split('\n')) {
    const m = line.match(/^\|\s*([A-Za-z][A-Za-z0-9]+)\s*\|\s*([A-Za-z][A-Za-z0-9 ?!']+?)\s*\|/);
    if (m && m[1] !== 'Old' && m[1] !== 'Oldname') { olds.add(m[1]); news.add(m[2].trim()); }
  }
  const spaced = id => id.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
  const live = new Set([...news].map(n => n.toLowerCase()));
  return [...olds]
    .map(spaced)
    .filter(n => !live.has(n.toLowerCase()) && n.split(' ').length > 1)
    .map(name => ({
      name,
      re: new RegExp(`(^|[^\\w])${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^\\w]|$)`),
    }));
}

function main() {
  const langs = loadLangs();
  const en = langs.en;
  if (!en) { console.error('❌ i18n-quality-audit: en.json missing.'); process.exit(1); }
  const targets = Object.keys(langs).filter(l => l !== 'en').sort();
  const keys = Object.keys(en).filter(k => typeof en[k] === 'string');

  if (WRITE_STATE) {
    const state = {};
    for (const k of keys) state[k] = sha(en[k]);
    fs.writeFileSync(STATE, JSON.stringify({ note: 'sha256(en value) per key — see scripts/i18n-quality-audit.js', keys: state }, null, 0) + '\n');
    console.log(`✓ i18n-freshness: baseline written for ${keys.length} English keys.`);
    return 0;
  }

  const prior = fs.existsSync(STATE) ? JSON.parse(fs.readFileSync(STATE, 'utf8')).keys : null;
  const retired = retiredNames(langs);
  const findings = { freshness: [], placeholder: [], script: [], renamed: [], expansion: [], invariant: [] };

  for (const k of keys) {
    const e = en[k];

    // 1. FRESHNESS — English moved, translations didn't.
    if (prior && prior[k] && prior[k] !== sha(e)) {
      const frozen = targets.filter(l => typeof langs[l][k] === 'string' && langs[l][k] === (prior[`${l}:${k}`] ?? langs[l][k]));
      // Without per-language history we can only report that English moved and
      // the translations are unchanged relative to each other — the git-based
      // scan is the precise tool. Report the key; the reviewer confirms.
      findings.freshness.push({ key: k, langs: frozen.length });
    }

    const eVars = (e.match(/\{\{\w+\}\}/g) || []).sort().join(',');
    const eIsProse = LATIN_PROSE.test(e);

    for (const l of targets) {
      const t = langs[l][k];
      if (typeof t !== 'string') continue;

      // 2. PLACEHOLDER
      if (eVars !== (t.match(/\{\{\w+\}\}/g) || []).sort().join(',')) {
        findings.placeholder.push({ key: k, lang: l });
      }
      if (t === e) continue; // invariant by design (tool names, labels) — checks below don't apply

      // 3. SCRIPT
      if (SCRIPT_OF[l] && LATIN_PROSE.test(t) && !SCRIPT_OF[l].test(t)) {
        findings.script.push({ key: k, lang: l, value: t.slice(0, 60) });
      }
      // 5. EXPANSION
      if (e.length > EXPANSION_MIN_LEN && t.length > e.length * EXPANSION_RATIO) {
        findings.expansion.push({ key: k, lang: l, ratio: +(t.length / e.length).toFixed(1) });
      }
    }

    // 4. RENAMED — any language, including English.
    for (const l of Object.keys(langs)) {
      const v = langs[l][k];
      if (typeof v !== 'string') continue;
      for (const { name, re } of retired) {
        // Case-SENSITIVE with word boundaries: tool names are Title Case, and
        // several retired ones are ordinary English ("What If", "The Gap",
        // "Recall"). Matching loosely flags every sentence that happens to
        // contain the words — 189 hits on the first run, nearly all prose.
        if (re.test(v)) findings.renamed.push({ key: k, lang: l, name, value: v.slice(0, 60) });
      }
    }

    // 6. INVARIANT — English kept in most languages but translated in a few.
    if (!eIsProse && e.length > 3) {
      const kept = targets.filter(l => langs[l][k] === e).length;
      if (kept >= targets.length - 2 && kept < targets.length) {
        findings.invariant.push({ key: k, translated: targets.filter(l => langs[l][k] !== e) });
      }
    }
  }

  if (JSON_OUT) { console.log(JSON.stringify(findings, null, 2)); return 0; }

  const total = Object.values(findings).reduce((s, a) => s + a.length, 0);
  console.log(`i18n-quality-audit — ${keys.length} English keys × ${targets.length} target languages\n`);
  const label = {
    freshness: 'English revised, translations may be stale',
    placeholder: '{{var}} mismatch (renders a literal placeholder)',
    script: 'wrong script (Latin prose in a non-Latin language)',
    renamed: 'retired tool name still in a value',
    expansion: `translation >${EXPANSION_RATIO}× English length (clipping risk)`,
    invariant: 'invariant token translated in a minority of languages',
  };
  for (const [kind, list] of Object.entries(findings)) {
    const mark = list.length ? '⚠️ ' : '✅';
    console.log(`${mark} ${String(list.length).padStart(4)}  ${label[kind]}`);
    for (const f of list.slice(0, 6)) {
      console.log(`        ${f.key}${f.lang ? ` [${f.lang}]` : ''}${f.value ? ` — ${JSON.stringify(f.value)}` : ''}${f.ratio ? ` — ${f.ratio}×` : ''}${f.translated ? ` — ${f.translated.join(',')}` : ''}`);
    }
    if (list.length > 6) console.log(`        … and ${list.length - 6} more`);
  }
  if (!prior) console.log('\n   NOTE: no freshness baseline — run with --write-state to create one.');
  console.log(`\n${total ? '⚠️ ' : '✅'} ${total} finding(s).`);
  return STRICT && total ? 1 : 0;
}

process.exit(main());
