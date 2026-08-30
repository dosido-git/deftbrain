#!/usr/bin/env node
/**
 * i18n-convention-audit.js — the settled per-language conventions, enforced.
 *
 * Gate 5 (localization-audit.js) proves a key EXISTS in thirteen languages.
 * i18n-quality-audit.js proves a translation is not STALE. Neither can see
 * whether a translation follows the conventions the review campaign settled —
 * and the 2026-08-30 sweep found 615 places where it does not, in 80 of 125
 * tools, including tools that had already been reviewed by eye. Reading for
 * these by hand does not scale and demonstrably missed things: 您 (banned)
 * survived in LeaseTrapDetector and LayoverMaximizer through a batch that was
 * marked reviewed.
 *
 * The conventions are the table in audit/I18N-REVIEW-LEDGER.md. This script is
 * that table, executable:
 *
 *   German      du, -e imperative          Portuguese  Brazilian, você
 *   French      vous                       Spanish     tú
 *   Japanese    です/ます, あなた banned      Korean      해요체, 당신 banned
 *   Chinese     你, never 您                Russian     вы
 *   Arabic      MSA, verbal-noun recast    Hindi       आप with -एँ
 *   Thai        polite, no ครับ/ค่ะ         Vietnamese  bạn
 *
 * Forced gender is RECAST, never hedged — no (a), no @, no o/a, no (in).
 *
 * Baseline, not a wall. A rewrite must not introduce a violation, but the 615
 * already in the catalog cannot block work on unrelated tools. So the accepted
 * set lives in src/data/i18n-conventions.json and only NEW findings fail —
 * the same contract as scripts/diff-audit.py. The baseline must travel with
 * the content it describes; a stale one silently accepts everything.
 *
 * Deliberate keeps live in the baseline too, because they are indistinguishable
 * from debt by regex: the quarrel dialogue in ConflictCoach and DecoderRing is
 * a character addressing someone, not us addressing the reader, and informal
 * register is correct there.
 *
 * Usage:
 *   node scripts/i18n-convention-audit.js               # report
 *   node scripts/i18n-convention-audit.js --strict      # exit 1 on NEW findings
 *   node scripts/i18n-convention-audit.js --write-state # accept current as baseline
 *   node scripts/i18n-convention-audit.js --json
 *   node scripts/i18n-convention-audit.js <tool>...     # limit to some tools
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const TOOLS = path.join(ROOT, 'src/i18n/locales/tools');
const STATE = path.join(ROOT, 'src/data/i18n-conventions.json');

const argv = process.argv.slice(2);
const WRITE_STATE = argv.includes('--write-state');
const STRICT = argv.includes('--strict');
const JSON_OUT = argv.includes('--json');
const ONLY = argv.filter(a => !a.startsWith('--')).map(a => a.replace(/\.js$/, ''));

// Word boundaries that understand non-ASCII letters. JS \b does not: it treats
// the ê in "êtes" as a boundary, so /\btes\b/ matches inside it. That cost a
// round of false positives before it was caught.
const W = '(?<!\\p{L})';
const Wa = '(?!\\p{L})';
const rx = (body, flags = 'u') => new RegExp(body, flags);
const word = (alts) => rx(`${W}(?:${alts})${Wa}`, 'iu');

const RULES = {
  ko: [
    ['dangsin', rx('당신'), '당신 is banned — drop the pronoun or use 내/자기'],
    ['hasipsio', rx('하십시오|하시옵'), 'convention is 해요체, not 하십시오체'],
  ],
  zh: [
    ['nin', rx('您'), '您 is banned — the convention is 你'],
  ],
  ja: [
    ['anata', rx('あなた'), 'あなた is banned — the topic is understood'],
    ['plain-form', rx('(?:だ|である)。'), 'convention is です/ます throughout'],
  ],
  hi: [
    ['iye-imperative', rx('इए(?![\\u0900-\\u097F])'), 'convention is -एँ, not -इए'],
    ['tum-level', rx('तुम(?![\\u0900-\\u097F])'), 'convention is आप-level, not तुम'],
    ['anusvara', rx('एं(?![\\u0900-\\u097F])'), 'convention is -एँ (chandrabindu), not -एं'],
  ],
  ru: [
    ['ty', word('ты|тебя|тебе|тобой|твой|твоя|твоё|твои|твоего|твоих'), 'convention is вы'],
  ],
  es: [
    ['usted', word('usted|ustedes'), 'convention is tú'],
    ['gender-hedge', rx('\\((?:a|as|os)\\)|(?<=\\p{L})/a(?!\\p{L})|@(?=\\s|$)'), 'recast, never hedge'],
  ],
  pt: [
    // "vais", "tens", "podes" — tu-conjugated verbs, the clearest EP marker.
    ['ep-verb', word('vais|vens|tens|és|estás|podes|queres|sabes|fazes|dizes|deves|vês|dás|lês|pões|preferes|registas|percebes|marcaste|notaste|terminaste|gostaste|bateste|foste|tiveste|souberes|quiseres|ficares|começares'), 'European Portuguese — the convention is Brazilian, você'],
    ['ep-vocab', word('registo|registos|planear|planeia|registar|regista|ecrã|telemóvel|ficheiro|ficheiros|utilizador|utilizadores|autocarro|comboio|pequeno-almoço|casa de banho'), 'European Portuguese vocabulary'],
    ['tu-possessive', word('o teu|a tua|os teus|as tuas|teu|tua|teus|tuas|contigo'), 'tu-form possessive — the convention is você/seu'],
    ['gender-hedge', rx('\\((?:a|as|os)\\)|(?<=\\p{L})/a(?!\\p{L})'), 'recast, never hedge'],
  ],
  fr: [
    // Not ton/ta/tes: "le bon ton", "Alertes de ton" — the tone noun is the
    // same string, and a gate that cries wolf gets ignored.
    ['tutoiement', word('tu|toi'), 'convention is vous'],
    ['gender-hedge', rx('\\((?:e|es|se|ve)\\)'), 'recast, never hedge'],
  ],
  de: [
    // Case-sensitive on purpose: lowercase "ihrer" is "their", not formal address.
    ['formal-address', rx(`${W}(?:Ihnen|Ihrem|Ihrer|Ihren|Ihres)${Wa}`, 'u'), 'convention is du'],
    ['gender-hedge', rx('\\(in(?:nen)?\\)|(?<=\\p{L})[*:·]in(?:nen)?(?!\\p{L})|(?<=\\p{L})/in(?:nen)?(?!\\p{L})'), 'recast, never hedge'],
  ],
  ar: [
    ['gender-hedge', rx('\\(ة\\)|\\(ه\\)|\\(ين\\)'), 'recast to the verbal noun, never hedge'],
  ],
  th: [
    // Only the unambiguous particles. Bare คะ lives inside โยคะ (yoga) and
    // คะแนน (score); both cost a false positive before this line existed.
    ['polite-particle', rx('(?:ครับ|ค่ะ)(?![\\u0E00-\\u0E7F])'), 'convention is polite without ครับ/ค่ะ'],
  ],
};

function evalExport(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const m = raw.match(/export\s+const\s+(\w+)\s*=/);
  if (!m) throw new Error(`no "export const <name>" in ${file}`);
  // eslint-disable-next-line no-new-func
  return new Function(`${raw.replace(/\bexport\s+const\b/g, 'const')}\n;return ${m[1]};`)();
}

const id = f => `${f.tool}|${f.lang}|${f.key}|${f.rule}`;

function scan() {
  let files = fs.readdirSync(TOOLS).filter(f => f.endsWith('.js')).sort();
  if (ONLY.length) files = files.filter(f => ONLY.includes(f.replace('.js', '')));
  const findings = [];
  for (const file of files) {
    const tool = file.replace('.js', '');
    let block;
    try { block = evalExport(path.join(TOOLS, file)); }
    catch (e) { console.warn(`i18n-convention-audit: skipping ${file} — ${e.message}`); continue; }
    for (const [lang, rules] of Object.entries(RULES)) {
      const values = block[lang];
      if (!values) continue;
      for (const [key, value] of Object.entries(values)) {
        if (typeof value !== 'string') continue;
        for (const [rule, re, why] of rules) {
          if (re.test(value)) findings.push({ tool, lang, key, rule, why, value: value.slice(0, 90) });
        }
      }
    }
  }
  return findings;
}

function main() {
  const findings = scan();

  if (WRITE_STATE) {
    if (ONLY.length) {
      console.error('❌ --write-state rewrites the whole baseline; do not combine it with a tool filter.');
      return 1;
    }
    fs.writeFileSync(STATE, JSON.stringify({
      note: 'Accepted convention findings — see scripts/i18n-convention-audit.js. Only NEW findings fail.',
      accepted: findings.map(id).sort(),
    }, null, 0) + '\n');
    console.log(`✓ i18n-conventions: baseline written for ${findings.length} accepted finding(s).`);
    return 0;
  }

  const accepted = fs.existsSync(STATE)
    ? new Set(JSON.parse(fs.readFileSync(STATE, 'utf8')).accepted)
    : null;
  const fresh = accepted ? findings.filter(f => !accepted.has(id(f))) : findings;

  if (JSON_OUT) { console.log(JSON.stringify({ new: fresh, total: findings.length }, null, 2)); return fresh.length && STRICT ? 1 : 0; }

  const byRule = {};
  for (const f of fresh) (byRule[`${f.lang} ${f.rule}`] = byRule[`${f.lang} ${f.rule}`] || []).push(f);

  console.log(`i18n-convention-audit — ${findings.length} finding(s), ${fresh.length} new\n`);
  if (!accepted) {
    console.log('   NOTE: no baseline — run with --write-state to accept the current catalog.\n');
  }
  for (const [label, list] of Object.entries(byRule).sort((a, b) => b[1].length - a[1].length)) {
    console.log(`⚠️  ${String(list.length).padStart(4)}  ${label} — ${list[0].why}`);
    for (const f of list.slice(0, 6)) console.log(`        ${f.tool}  ${f.key}  ${JSON.stringify(f.value)}`);
    if (list.length > 6) console.log(`        … and ${list.length - 6} more`);
  }
  if (!fresh.length) console.log('✅ no new convention violations.');
  console.log(`\n${fresh.length ? '⚠️ ' : '✅'} ${fresh.length} new finding(s), ${findings.length - fresh.length} accepted.`);
  return STRICT && fresh.length ? 1 : 0;
}

process.exit(main());
