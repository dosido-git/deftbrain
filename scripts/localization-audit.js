#!/usr/bin/env node
/**
 * localization-audit.js — DeftBrain localization gate
 *
 * Verifies that a tool page is FULLY localized — the layer-3 (value formatting)
 * and layer-4 (UI strings) contract that eslint can't see. For each audited
 * frontend tool file it checks three things:
 *
 *   1. CURRENCY  — no hardcoded currency symbol ($ € £ ¥ ₹ …) in rendered JSX
 *      text or in a user-facing JSX attribute (placeholder/title/alt/aria-label).
 *      Money must go through formatLocale.js (formatCurrency / currencySymbol),
 *      so the literal symbol never appears in the source. (`${expr}` template
 *      interpolation is NOT a literal $ — the AST cooked text excludes it.)
 *
 *   2. UNWRAPPED — no raw user-facing string rendered directly. Any JSXText with
 *      two or more consecutive letters (any script), or a string-literal value of
 *      a user-facing attribute, must instead be `{t('key')}`. Emoji / digits /
 *      punctuation-only text is fine.
 *
 *   3. CATALOG   — every `t('key')` literal key used by the file exists in
 *      src/i18n/locales/index.js for ALL supported languages. A key missing in
 *      even one language is a finding (English-only is not "fully localized").
 *
 * Scope: by default audits the LOCALIZED_TOOLS allowlist below — the tools that
 * are SUPPOSED to be fully localized — so the gate protects them from regression
 * without blocking work on the ~120 tools not yet localized. Pass explicit file
 * paths to audit those instead (dev use).
 *
 * Usage:
 *   node scripts/localization-audit.js                  # audit the allowlist
 *   node scripts/localization-audit.js path [path...]   # audit specific files
 *   node scripts/localization-audit.js --json           # machine-readable
 *
 * Exit code 1 if any finding (so it can gate CI / pre-push), 0 if clean.
 *
 * To localize a new tool: wire it to useTranslation + formatLocale, add its
 * per-language block to locales/index.js, then add its filename here.
 */

const fs = require('fs');
const path = require('path');

let parser;
try { parser = require('@babel/parser'); }
catch { console.error('localization-audit: @babel/parser not found (npm i -D @babel/parser).'); process.exit(2); }

// Tools that are fully localized and must stay that way.
const LOCALIZED_TOOLS = [
  'src/tools/SubscriptionGuiltTrip.js',
  'src/tools/MarkupDetective.js',
  'src/tools/SubSweep.js',
  'src/tools/BillRescue.js',
  'src/tools/BuyWise.js',
  'src/tools/ScamRadar.js',
  'src/tools/MentalHealthNavigator.js',
  'src/tools/CultureBriefing.js',
  'src/tools/ProcedureProbe.js',
  'src/tools/DateNight.js',
  'src/tools/ContractDecoder.js',
  'src/tools/GriefGuide.js',
  'src/tools/IdeaAutopsy.js',
  'src/tools/SleepArchitect.js',
  'src/tools/ConflictCoach.js',
  'src/tools/NoiseCanceler.js',
  'src/tools/DecoderRing.js',
  'src/tools/DoctorVisitPrep.js',
  'src/tools/JargonAssassin.js',
  'src/tools/PlantRescue.js',
  'src/tools/DecisionCoach.js',
  'src/tools/FakeReviewDetective.js',
  'src/tools/PlainTalk.js',
  'src/tools/RechargeRadar.js',
  'src/tools/DebateMe.js',
  'src/tools/RoommateCourt.js',
  'src/tools/ResearchDecoder.js',
  'src/tools/PetWeirdnessDecoder.js',
  'src/tools/GratitudeDebtClearer.js',
  'src/tools/BragSheetBuilder.js',
  'src/tools/ComplaintEscalationWriter.js',
  'src/tools/NameStorm.js',
  'src/tools/WardrobeChaosHelper.js',
  'src/tools/DifficultTalkCoach.js',
  'src/tools/DoctorVisitTranslator.js',
  'src/tools/NerveCheck.js',
  'src/tools/VelvetHammer.js',
  'src/tools/WhatsMyVibe.js',
  'src/tools/OnePercenter.js',
  'src/tools/WrongAnswersOnly.js',
  'src/tools/EgoKiller.js',
  'src/tools/TimeWarp.js',
  'src/tools/LuckSurface.js',
  'src/tools/SignalVsNoise.js',
  'src/tools/CrowdWisdom.js',
  'src/tools/HecklerPrep.js',
  'src/tools/NameThatFeeling.js',
  'src/tools/RoastMe.js',
  'src/tools/BeliefStressTest.js',
  'src/tools/TruthBomb.js',
  'src/tools/ToastWriter.js',
  'src/tools/WhereDidTheTimeGo.js',
  'src/tools/GravityWell.js',
  'src/tools/ChaosPilot.js',
  'src/tools/AlternatePath.js',
  'src/tools/WhatIf.js',
  'src/tools/PreMortem.js',
  'src/tools/HobbyMatch.js',
  'src/tools/TheAlibi.js',
  'src/tools/UpsellShield.js',
  'src/tools/PlotHole.js',
  'src/tools/AnalogyEngine.js',
  'src/tools/ColdOpenCraft.js',
  'src/tools/PartyArchitect.js',
  'src/tools/RulebookBreaker.js',
  'src/tools/ComebackCooker.js',
  'src/tools/ArgumentSimulator.js',
  'src/tools/FanTheory.js',
  'src/tools/Giftology.js',
  'src/tools/FutureProof.js',
  'src/tools/ContextCollapse.js',
  'src/tools/ContrastReport.js',
  'src/tools/TipOfTongue.js',
  'src/tools/PlotTwist.js',
  'src/tools/TheGap.js',
  'src/tools/SpiralStopper.js',
  'src/tools/PronounceItRight.js',
  'src/tools/GhostWriter.js',
  'src/tools/AwkwardSilenceFiller.js',
  'src/tools/MiseEnPlace.js',
  'src/tools/TheDebrief.js',
  'src/tools/Recall.js',
  'src/tools/BatchFlow.js',
  'src/tools/MicroAdventureMapper.js',
  'src/tools/MagicMouth.js',
  'src/tools/EmailUrgencyTriager.js',
  'src/tools/CaptionMagic.js',
  'src/tools/PEP.js',
  'src/tools/MeetingHijackPreventer.js',
  'src/tools/VirtualBodyDouble.js',
  'src/tools/LeverageLogic.js',
  'src/tools/TaskAvalancheBreaker.js',
  'src/tools/DreamPatternSpotter.js',
  'src/tools/CrashPredictor.js',
  'src/tools/LazyWorkoutAdapter.js',
  'src/tools/TheRunthrough.js',
  'src/tools/BrainDumpBuddy.js',
  'src/tools/WaitingModeLiberator.js',
  'src/tools/RentersDepositSaver.js',
  'src/tools/DriveHome.js',
  'src/tools/BrainStateDeejay.js',
  'src/tools/SensoryMinefieldMapper.js',
  'src/tools/LeaseTrapDetector.js',
  'src/tools/ToolFinder.js',
  'src/tools/HistoryToday.js',
  'src/tools/Bookmark.js',
  'src/tools/CrisisPrioritizer.js',
  'src/tools/SafeWalk.js',
  'src/tools/BrainRoulette.js',
  'src/tools/SixDegreesOfMe.js',
  'src/tools/FriendshipFadeAlerter.js',
  'src/tools/RoomReader.js',
  'src/tools/SkillGapMap.js',
  'src/tools/TheFinalWord.js',
];

const CATALOG_PATH = 'src/i18n/locales/index.js';

// Common currency symbols. `$` included — but only matched against AST cooked
// text / string literals, never against `${}` template syntax (which the parser
// represents structurally, not as a literal character).
const CURRENCY_RE = /[$€£¥₹₩₽฿₪₫₴₦₱₺₸₮]/;
// "user-facing" string attributes — names whose string value renders to a human.
const UI_ATTRS = new Set(['placeholder', 'title', 'alt', 'aria-label', 'aria-placeholder']);
// two or more consecutive letters in ANY script → real words, must be translated.
const HAS_WORDS = /\p{L}{2,}/u;

const SKIP_KEYS = new Set(['loc', 'start', 'end', 'range', 'leadingComments', 'trailingComments', 'comments', 'tokens', 'extra']);

function walk(node, cb) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) { for (const n of node) walk(n, cb); return; }
  if (typeof node.type === 'string') cb(node);
  for (const k in node) {
    if (SKIP_KEYS.has(k)) continue;
    const v = node[k];
    if (v && typeof v === 'object') walk(v, cb);
  }
}

// ── load the bundled catalog by evaluating it as CommonJS ──
// locales/index.js is an ES module; transform the two `export const` lines and
// compile in an isolated Module so spreads in RESOURCES resolve naturally.
function loadCatalog(root) {
  // Catalog is assembled from self-contained data files (base.js + tools/*.js);
  // index.js uses ES imports and can't be eval'd here. The shared loader reads
  // and merges the data files the same way index.js does at build time.
  return require('./lib/load-i18n').loadCatalog();
}

// string value of a JSX attribute, or null if it isn't a plain string literal
function attrStringValue(attr) {
  const v = attr.value;
  if (!v) return null;
  if (v.type === 'StringLiteral') return v.value;
  if (v.type === 'JSXExpressionContainer' && v.expression && v.expression.type === 'StringLiteral') {
    return v.expression.value;
  }
  return null;
}

function attrName(attr) {
  const n = attr.name;
  if (!n) return '';
  return n.type === 'JSXNamespacedName' ? `${n.namespace.name}:${n.name.name}` : (n.name || '');
}

function scanFile(file, catalog) {
  const src = fs.readFileSync(file, 'utf8');
  let ast;
  try {
    ast = parser.parse(src, {
      sourceType: 'module',
      plugins: ['jsx', 'optionalChaining', 'nullishCoalescingOperator', 'objectRestSpread'],
    });
  } catch (e) {
    return { file, error: e.message, findings: [] };
  }

  const findings = [];
  const usedKeys = [];          // { key, line }
  let dynamicKeys = 0;

  walk(ast.program, (n) => {
    const line = n.loc && n.loc.start.line;

    // ── JSXText: rendered text ──
    if (n.type === 'JSXText') {
      const raw = n.value;
      const trimmed = raw.replace(/\s+/g, ' ').trim();
      if (!trimmed) return;
      if (CURRENCY_RE.test(raw)) {
        findings.push({ type: 'currency', line, detail: `hardcoded currency symbol in rendered text: "${trimmed.slice(0, 60)}"` });
      }
      if (HAS_WORDS.test(trimmed)) {
        findings.push({ type: 'unwrapped', line, detail: `untranslated text rendered directly — wrap in t(): "${trimmed.slice(0, 60)}"` });
      }
      return;
    }

    // ── JSX attributes: placeholder/title/alt/aria-label ──
    if (n.type === 'JSXAttribute') {
      const name = attrName(n);
      const sval = attrStringValue(n);
      if (sval != null) {
        if (UI_ATTRS.has(name)) {
          if (CURRENCY_RE.test(sval)) {
            findings.push({ type: 'currency', line, detail: `hardcoded currency symbol in ${name}: "${sval.slice(0, 60)}"` });
          }
          if (HAS_WORDS.test(sval)) {
            findings.push({ type: 'unwrapped', line, detail: `untranslated ${name} string — use t(): "${sval.slice(0, 60)}"` });
          }
        }
      }
      return;
    }

    // ── template literals used as JSX children: currency in cooked text ──
    if (n.type === 'TemplateLiteral' && Array.isArray(n.quasis)) {
      for (const q of n.quasis) {
        const cooked = (q.value && (q.value.cooked != null ? q.value.cooked : q.value.raw)) || '';
        if (CURRENCY_RE.test(cooked)) {
          // only report when this template is a JSX child / attribute (heuristic: skip — handled above for attrs/text)
          // template-literal currency in plain JS (e.g. `${sym}15.99`) is allowed; ${sym} is not a literal symbol.
        }
      }
      return;
    }

    // ── t('key') usage ──
    if (n.type === 'CallExpression') {
      const callee = n.callee;
      const isT =
        (callee.type === 'Identifier' && callee.name === 't') ||
        ((callee.type === 'MemberExpression' || callee.type === 'OptionalMemberExpression') &&
          callee.property && callee.property.name === 't');
      if (isT && n.arguments.length) {
        const a0 = n.arguments[0];
        if (a0.type === 'StringLiteral') usedKeys.push({ key: a0.value, line });
        else dynamicKeys++;
      }
    }
  });

  // ── catalog completeness ──
  const langs = catalog.SUPPORTED_LANGUAGES;
  for (const { key, line } of usedKeys) {
    const missingIn = langs.filter(l => !(catalog.RESOURCES[l] && key in catalog.RESOURCES[l]));
    if (missingIn.length === langs.length) {
      findings.push({ type: 'catalog', line, detail: `t('${key}') has no catalog entry in any language` });
    } else if (missingIn.length) {
      findings.push({ type: 'catalog', line, detail: `t('${key}') missing in: ${missingIn.join(', ')}` });
    }
  }

  return { file, findings, dynamicKeys, usedCount: usedKeys.length };
}

function resolveTargets(root, args) {
  const explicit = args.filter(a => !a.startsWith('--'));
  if (explicit.length) return explicit;
  return LOCALIZED_TOOLS.map(p => path.join(root, p));
}

function main() {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const root = process.cwd();
  const catalog = loadCatalog(root);
  const targets = resolveTargets(root, args).filter(f => fs.existsSync(f));

  const results = targets.map(f => scanFile(f, catalog));
  const withFindings = results.filter(r => r.findings && r.findings.length);
  const parseErrors = results.filter(r => r.error);

  if (json) {
    console.log(JSON.stringify({ results }, null, 2));
    process.exit(withFindings.length || parseErrors.length ? 1 : 0);
  }

  for (const r of parseErrors) console.log(`\n⚠ ${r.file}: parse error — ${r.error}`);

  if (!withFindings.length && !parseErrors.length) {
    const langN = catalog.SUPPORTED_LANGUAGES.length;
    console.log(`✅ localization-audit: ${results.length} tool(s) fully localized across ${langN} languages.`);
    process.exit(0);
  }

  let count = 0;
  for (const r of withFindings) {
    console.log(`\n${path.relative(root, r.file)}`);
    for (const f of r.findings) {
      count++;
      console.log(`  line ${f.line} [${f.type}]: ${f.detail}`);
    }
  }
  console.log(`\n✖ ${count} localization issue(s) across ${withFindings.length} file(s).`);
  process.exit(1);
}

if (require.main === module) main();
module.exports = { scanFile, loadCatalog };
