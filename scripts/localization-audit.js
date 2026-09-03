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
  // SubscriptionGuiltTrip retired (merged into SubSweep, 2026-07-06) — removed
  // from the allowlist so the gate stops auditing a retired tool.
  'src/tools/MarkupDetective.js',
  'src/tools/TicketTackler.js',
  'src/tools/SubscriptionTamer.js',
  'src/tools/BillRescue.js',
  'src/tools/BuyWise.js',
  'src/tools/ScamRadar.js',
  'src/tools/MentalHealthNavigator.js',
  'src/tools/CultureBriefing.js',
  'src/tools/ProcedureProbe.js',
  'src/tools/DateNight.js',
  'src/tools/ContractDecoder.js',
  'src/tools/GriefGuide.js',
  'src/tools/ConceptCoach.js',
  'src/tools/SleepArchitect.js',
  'src/tools/ConflictCoach.js',
  'src/tools/CutToTheChase.js',
  'src/tools/DecoderRing.js',
  'src/tools/DoctorVisitPrep.js',
  'src/tools/JargonAssassin.js',
  'src/tools/PlantRescue.js',
  'src/tools/DecisionCoach.js',
  'src/tools/FakeReviewDetective.js',
  'src/tools/PlainTalk.js',
  'src/tools/ArgueSmarter.js',
  'src/tools/RoommateCourt.js',
  'src/tools/ResearchDecoder.js',
  'src/tools/PetWeirdnessDecoder.js',
  // TEMPORARILY OFF THE ALLOWLIST — 2026-08-28.
  // The tool was rewritten front and back; the owner is holding translations
  // until the design settles, which is the right order. Seven strings are still
  // hardcoded English, listed in the commit that removed this line. Put it back
  // the moment they are wrapped, or the gate stops protecting the other twelve
  // languages here at all.
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
  'src/tools/TimeWarp.js',
  'src/tools/GetNoticed.js',
  'src/tools/SignalVsNoise.js',
  'src/tools/CrowdWisdom.js',
  'src/tools/HecklerPrep.js',
  'src/tools/NameThatFeeling.js',
  'src/tools/RoastMe.js',
  'src/tools/BeliefStressTest.js',
  'src/tools/TruthBomb.js',
  'src/tools/ToastWriter.js',
  'src/tools/WhereDidTheTimeGo.js',
  'src/tools/BeforeHello.js',
  'src/tools/ChaosPilot.js',
  'src/tools/AlternatePath.js',
  'src/tools/WhichLife.js',
  'src/tools/PreMortem.js',
  'src/tools/HobbyMatch.js',
  'src/tools/TheWholeStory.js',
  'src/tools/UpsellShield.js',
  'src/tools/PlotHole.js',
  'src/tools/AnalogyEngine.js',
  'src/tools/ColdOpenCraft.js',
  'src/tools/PartyArchitect.js',
  'src/tools/NotSoFast.js',
  'src/tools/ComebackCooker.js',
  'src/tools/FanTheory.js',
  'src/tools/Giftology.js',
  'src/tools/FutureProof.js',
  'src/tools/ContextCollapse.js',
  'src/tools/TipOfTongue.js',
  'src/tools/PlotTwist.js',
  'src/tools/MissingLink.js',
  'src/tools/SpiralStopper.js',
  'src/tools/PronounceItRight.js',
  'src/tools/GhostWriter.js',
  'src/tools/AwkwardSilenceFiller.js',
  'src/tools/MiseEnPlace.js',
  'src/tools/TheDebrief.js',
  'src/tools/TheCrux.js',
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
  'src/tools/BeforeTheCrash.js',
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
  'src/tools/ReadTheRoom.js',
  'src/tools/SkillGapMap.js',
  'src/tools/TheFinalWord.js',
  'src/tools/MoneyDiplomat.js',
  'src/tools/RecipeChaosSolver.js',
  'src/tools/Mend.js',
  'src/tools/BikeMedic.js',
  'src/tools/FinalWish.js',
  'src/tools/FocusPocus.js',
  'src/tools/FocusSoundArchitect.js',
  'src/tools/GentlePushGenerator.js',
  'src/tools/LaundroMat.js',
  'src/tools/LayoverMaximizer.js',
  'src/tools/MeetingBSDetector.js',
  'src/tools/NameAudit.js',
  'src/tools/SocialBatteryAdvisor.js',
  'src/tools/PaperworkPath.js',
  'src/tools/QuoteCheck.js',
];

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
function loadCatalog(_root) {
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
  const pluralKeys = [];        // { key, line } — tPlural(), checked per CLDR category
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
      // tPlural('key', count) resolves key_<CLDR category> at runtime, so the
      // key-existence check above cannot see what it actually needs. A missing
      // category is invisible until a Russian visitor hits a count of 5 and
      // gets English.
      const isTP =
        (callee.type === 'Identifier' && callee.name === 'tPlural') ||
        ((callee.type === 'MemberExpression' || callee.type === 'OptionalMemberExpression') &&
          callee.property && callee.property.name === 'tPlural');
      if (isTP && n.arguments.length) {
        const a0 = n.arguments[0];
        if (a0.type === 'StringLiteral') pluralKeys.push({ key: a0.value, line });
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

  // ── plural completeness ──
  // Not every category Intl declares is reachable: Spanish, Portuguese and
  // French list `many`, but it only fires at 10^6 and in compact notation,
  // which no count in this catalog reaches. Demanding it would mean thirteen
  // strings nobody will ever see. So the requirement is empirical — the
  // categories a real count can actually produce, sampled over the integers a
  // counter plausibly shows plus the halves that a duration does.
  for (const { key, line } of pluralKeys) {
    for (const l of langs) {
      const need = reachableCategories(l);
      const missing = [...need].filter(cat => !(catalog.RESOURCES[l] && `${key}_${cat}` in catalog.RESOURCES[l]));
      if (missing.length) {
        findings.push({
          type: 'catalog',
          line,
          detail: `tPlural('${key}') missing ${l} form(s): ${missing.map(c => `${key}_${c}`).join(', ')}`,
        });
      }
    }
  }

  return { file, findings, dynamicKeys, usedCount: usedKeys.length + pluralKeys.length };
}

const PLURAL_SAMPLE = [
  ...Array.from({ length: 201 }, (_, i) => i),   // 0–200: what a counter shows
  0.5, 1.5, 2.5, 3.5,                            // durations: "About 2½ hours"
];
const catCache = new Map();
function reachableCategories(lang) {
  if (catCache.has(lang)) return catCache.get(lang);
  let set;
  try {
    const pr = new Intl.PluralRules(lang);
    set = new Set(PLURAL_SAMPLE.map(n => pr.select(n)));
  } catch {
    set = new Set(['one', 'other']);
  }
  catCache.set(lang, set);
  return set;
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
    const collisions = checkPrefixCollisions(root);
    if (collisions.length) {
      console.log('\n✖ i18n prefix collision — two tools share a key namespace:');
      for (const c of collisions) {
        console.log(`  ${c.prefix}_  ${c.a}  vs  ${c.b}`);
        console.log(`     ${c.shared.length} key(s) where one tool renders the other's string: ${c.shared.join(', ')}`);
      }
      console.log('\n  Fix: give the smaller of the two a unique prefix, in its locale file and its tool file.');
      process.exit(1);
    }
    console.log(`✅ localization-audit: ${results.length} tool(s) fully localized across ${langN} languages, no prefix collisions.`);
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

// ── Prefix collisions ────────────────────────────────────────────────────────
// Every tool's block spreads into one flat namespace per language, so two tools
// sharing a key prefix is not a style problem — for any key they both define,
// whichever merges last wins and the other tool silently renders its
// neighbour's string. Four pairs had drifted into this (cc_, md_, pp_, br_),
// and nothing caught it: the strings were valid, present in all 13 languages,
// and simply belonged to the wrong tool.
function checkPrefixCollisions(root) {
  const dir = path.join(root, 'src/i18n/locales/tools');
  if (!fs.existsSync(dir)) return [];
  const byPrefix = new Map();
  for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.js'))) {
    const src = fs.readFileSync(path.join(dir, f), 'utf8');
    let i = src.indexOf('\n  en: {');
    if (i < 0) i = src.indexOf('\n  "en": {');
    if (i < 0) continue;
    let j = src.indexOf('\n  es: {', i);
    if (j < 0) j = src.indexOf('\n  "es": {', i);
    const blk = src.slice(i, j > 0 ? j : src.length);
    const counts = new Map(); const keys = new Set();
    for (const m of blk.matchAll(/^ {4}"?([a-z0-9]{2,5})_([a-z0-9_]+)"?\s*:/gm)) {
      counts.set(m[1], (counts.get(m[1]) || 0) + 1);
      keys.add(m[1] + '_' + m[2]);
    }
    if (!counts.size) continue;
    const prefix = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
    const own = new Set([...keys].filter(k => k.startsWith(prefix + '_')));
    if (!byPrefix.has(prefix)) byPrefix.set(prefix, []);
    byPrefix.get(prefix).push({ file: f, keys: own });
  }
  const out = [];
  for (const [prefix, list] of byPrefix) {
    if (list.length < 2) continue;
    for (let a = 0; a < list.length; a++) for (let b = a + 1; b < list.length; b++) {
      const shared = [...list[a].keys].filter(k => list[b].keys.has(k)).sort();
      out.push({ prefix, a: list[a].file, b: list[b].file, shared });
    }
  }
  return out;
}

if (require.main === module) main();
module.exports = { scanFile, loadCatalog };
