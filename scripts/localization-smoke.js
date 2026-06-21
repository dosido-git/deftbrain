#!/usr/bin/env node
// scripts/localization-smoke.js
//
// Translation-QUALITY smoke test for a localized tool's i18n keys.
//
// Gate 5 (localization-audit.js) is an AST static check: it verifies a tool's
// JSX has no hardcoded currency/strings and that every t('key') EXISTS in every
// language. It cannot tell whether a translation is actually translated. This
// script complements it by reading the resolved catalog and flagging the
// failure modes a human/LLM translator actually produces during rollout:
//
//   FAIL  missing/empty      — key absent or blank in a language
//   FAIL  placeholder drift  — {{var}} tokens differ from English → broken interpolation
//   FAIL  wrong script       — non-Latin language whose value is all-ASCII (English left in)
//   WARN  identical-to-en    — value byte-identical to English (likely untranslated;
//                              suppressed for invariant tokens: CSV, brand names, etc.)
//
// Usage:
//   node scripts/localization-smoke.js [prefix]      # default prefix: sgt
//   node scripts/localization-smoke.js sgt --verbose
//
// Browser-free and deterministic — safe to run per tool in the localization
// rollout. Pairs with the manual runtime switch-test (load build, cycle langs).

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT     = path.join(__dirname, '..');
const prefix   = (process.argv[2] && !process.argv[2].startsWith('--')) ? process.argv[2] : 'sgt';
const VERBOSE  = process.argv.includes('--verbose');

// English is the reference; everything else is compared against it.
const REF = 'en';

// Expected script per language — if a value for one of these is entirely ASCII
// while the English had letters, it's almost certainly untranslated English.
const SCRIPT_RANGES = {
  zh: /[一-鿿]/,
  ja: /[぀-ヿ一-鿿]/,
  ko: /[가-힯]/,
  hi: /[ऀ-ॿ]/,
  ar: /[؀-ۿ]/,
  ru: /[Ѐ-ӿ]/,
  th: /[฀-๿]/,
};

// Strings that are legitimately identical across languages — never flagged.
// Brand/loanword seed set, augmented at runtime with every tool name (tools
// reference each other by name, e.g. "SubSweep", and brand names stay Latin in
// all languages — they must not trip the script/identical checks).
const INVARIANT = new Set(['CSV', 'PDF', 'OK', 'DeftBrain', 'Netflix', 'Spotify', 'URL', 'AI', 'Fitness', 'Streaming', 'vs', 'Ctrl', 'Enter', 'PRO', 'KB']);

// A value containing a domain (brand footers like "BuyWise · deftbrain.com") is
// invariant by nature. So are designated format-illustration keys whose value is
// a structural sample (e.g. a monospace bank-statement placeholder), not prose.
const DOMAIN_RE = /[a-z0-9-]+\.(?:com|org|net|io|co|app)\b/i;
const INVARIANT_KEYS = new Set(['ss_scan_ph', 'rcs_xref_link', 'apc_xref_conflict_coach', 'apc_xref_difficult_link', 'apc_xref_velvet_link', 'apc_cal_draft_link', 'apc_cal_major_link', 'apc_det_heading', 'apc_txt_flag_line', 'bmd_xref_buywise', 'bmd_xref_decision_coach', 'bmd_xref_dot_sep', 'bmd_miles_short', 'bmd_anim_psi', 'bmd_fix_patch_part_1_example', 'bmd_fix_replace_tube_part_1_example', 'bmd_fix_valve_part_1_example', 'bmd_fix_rimtape_part_1_example', 'bmd_fix_tubeless_plug_part_1_example', 'bmd_fix_tubeless_burp_part_1_example', 'bmd_fix_tubeless_refresh_part_1_example', 'bmd_fix_tubeless_boot_part_1_example', 'bmd_fix_reseat_worn_part_1_example', 'bmd_fix_chain_break_part_1_example', 'bmd_fix_chain_worn_part_1_example', 'bmd_fix_chain_worn_part_2_example', 'bmd_fix_disc_bleed_part_1_example', 'bmd_fix_disc_bleed_part_2_example', 'bmd_fix_rim_squeal_part_1_example', 'bmd_fix_chain_inspect_part_1_example', 'bmd_fix_tire_pressure_inspect_part_1_example', 'bmd_fix_ghost_shift_part_1_example', 'bmd_fix_electronic_dead_part_1_example', 'bmd_fix_electronic_battery_part_1_example', 'bmd_fix_internal_hub_part_1_example', 'bmd_fix_headset_gritty_part_1_example', 'bmd_fix_noise_wheel_part_1_example', 'bmd_fix_noise_creak_part_1_example', 'bmd_fix_noise_chainlube_part_1_example', 'bmd_fix_true_wheel_part_1_example', 'bmd_fix_broken_spoke_part_1_example', 'bmd_fix_hub_play_part_1_example', 'bmd_fix_axle_part_1_example', 'bmd_fix_tubeless_seat_part_1_example', 'fws_xref_gratitude', 'fws_xref_gratitude_footer', 'fws_xref_decision_coach', 'fws_xref_difficult_talk', 'fws_count_of_5', 'fws_count_unit', 'fws_diff_section_count', 'fpc_sound_architect_link', 'fpc_xref_sound_architect', 'fpc_xref_task_avalanche', 'fpc_hist_chain', 'fpc_chain_progress', 'fpc_hist_distractions', 'fpc_template_meta', 'fpc_break_timer_min', 'fpc_distract_count_x', 'fpc_fav_prefix', 'fpc_pill_total_time_val', 'fpc_pill_avg_score_val', 'fpc_pill_top_distractor_val', 'fsa_xref_focus_pocus', 'fsa_xref_task_avalanche', 'fsa_title', 'fsa_phase_meta', 'fsa_stat_hours', 'fsa_stat_minutes', 'fsa_layer_hz_meta', 'fsa_eq_db', 'fsa_count_x', 'fsa_timer_infinite', 'fsa_phase_join', 'fsa_copy_why', 'fsa_eq', 'gpg_xref_difficult_talk', 'gpg_xref_crash_predictor', 'lmt_xref_pep', 'lmt_xref_buywise']);

function evalModule(file, ret) {
  const src = fs.readFileSync(file, 'utf8').replace(/\bexport\s+(const|default)\b/g, '$1');
  // eslint-disable-next-line no-new-func
  return new Function(`${src}\n;return ${ret};`)();
}

function loadResources() {
  // Catalog is assembled from self-contained data files (base.js + tools/*.js);
  // the shared loader reads and merges them (index.js itself uses ES imports).
  return require('./lib/load-i18n').loadCatalog().RESOURCES;
}

// Tool ids + titles are brand names; add them to INVARIANT so cross-tool
// references (e.g. "SubSweep") aren't flagged as untranslated in any language.
function loadToolNames() {
  try {
    const tools = evalModule(path.join(ROOT, 'src', 'data', 'tools.js'), "typeof tools !== 'undefined' ? tools : []");
    for (const t of tools) { if (t.id) INVARIANT.add(t.id); if (t.title) INVARIANT.add(String(t.title).trim()); }
  } catch { /* non-fatal: fall back to the seed invariant set */ }
}

const placeholders = (s) => new Set((String(s).match(/\{\{\s*\w+\s*\}\}/g) || []).map(x => x.replace(/\s/g, '')));
const hasLetters   = (s) => /[A-Za-z]/.test(String(s));
const eq = (a, b) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());

function main() {
  loadToolNames();
  const R = loadResources();
  const langs = Object.keys(R);
  if (!langs.includes(REF)) { console.error(`localization-smoke: no '${REF}' language in catalog`); process.exit(2); }

  // Case-insensitive invariant check — brand/tool names stay Latin in any case
  // (e.g. a copy-export header "MARKUP DETECTIVE" is the tool name "Markup Detective").
  const invariantLC = new Set([...INVARIANT].map(s => String(s).toLowerCase()));
  const isInvariant = (s) => invariantLC.has(String(s).trim().toLowerCase());

  const keys = Object.keys(R[REF]).filter(k => k.startsWith(prefix + '_') || k === prefix);
  if (!keys.length) {
    console.error(`localization-smoke: no keys matching prefix "${prefix}_" in catalog. Try a different prefix.`);
    process.exit(2);
  }

  const others = langs.filter(l => l !== REF);
  console.log(`\nlocalization-smoke: "${prefix}" — ${keys.length} keys × ${others.length} languages\n`);

  let fails = 0, warns = 0;
  const perLang = {};

  for (const lang of others) {
    const issues = [];
    for (const key of keys) {
      const en  = R[REF][key];
      const val = R[lang] ? R[lang][key] : undefined;

      if (val === undefined || String(val).trim() === '') {
        issues.push({ sev: 'FAIL', key, msg: 'missing/empty' }); continue;
      }
      // placeholder drift breaks interpolation at runtime
      if (!eq(placeholders(en), placeholders(val))) {
        issues.push({ sev: 'FAIL', key, msg: `placeholder drift — en${[...placeholders(en)].join(',')||'∅'} vs ${lang}${[...placeholders(val)].join(',')||'∅'}` });
      }
      // wrong script: non-Latin language, English had letters, value has none of
      // its script — but skip brand/invariant names (legitimately stay Latin).
      // exempt: brand/loanword names, brand+domain footers, and designated
      // format-sample keys (all legitimately the same / Latin in every language).
      const exempt = isInvariant(en) || INVARIANT_KEYS.has(key) || DOMAIN_RE.test(String(en));
      const rng = SCRIPT_RANGES[lang];
      if (rng && hasLetters(en) && !rng.test(String(val)) && !exempt) {
        issues.push({ sev: 'FAIL', key, msg: `no ${lang} script characters — likely untranslated: "${String(val).slice(0, 40)}"` });
      }
      // identical to English (only meaningful for translatable phrases)
      if (String(val) === String(en) && hasLetters(en) && String(en).trim().length > 2 && !exempt) {
        issues.push({ sev: 'WARN', key, msg: `identical to English — possibly untranslated: "${String(en).slice(0, 40)}"` });
      }
    }
    const f = issues.filter(i => i.sev === 'FAIL').length;
    const w = issues.filter(i => i.sev === 'WARN').length;
    fails += f; warns += w;
    perLang[lang] = { f, w, issues };
    const mark = f ? '❌' : (w ? '⚠️ ' : '✅');
    console.log(`  ${mark} ${lang}: ${f} fail, ${w} warn`);
    if (VERBOSE || f) {
      for (const i of issues) console.log(`        ${i.sev === 'FAIL' ? '✗' : '·'} [${i.key}] ${i.msg}`);
    }
  }

  console.log(`\n${fails ? '❌' : (warns ? '⚠️ ' : '✅')} ${prefix}: ${fails} failures, ${warns} warnings across ${others.length} languages` +
              (warns && !VERBOSE ? '  (run with --verbose to list warnings)' : ''));
  process.exit(fails ? 1 : 0);
}

main();
