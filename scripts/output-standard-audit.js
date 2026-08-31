#!/usr/bin/env node
// Gate: a tool reviewed from now on must declare the output standard it was
// reviewed under.
//
// The failure this exists to stop has already happened twice in this project:
// a tool gets a careful review, ships, and only later does someone notice it
// never received a standard adopted three weeks earlier. Nothing said so,
// because nothing could. Now the push says so.
//
// Scoped to the route files this push touches, like Gate 4 — the 48 approved
// tools are frozen and stay silent until someone opens one. Opening one is
// exactly when the question should be asked.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const ROUTES = path.join(ROOT, 'backend', 'routes');
const { FROZEN_V1 } = require(path.join(ROOT, 'backend', 'lib', 'outputStandard'));

const DECLARES_V2 = /(?:^|\n)\s*router\.outputStandard\s*=\s*['"]v2['"]/;
const problems = [];
const notes = [];

// ── 1. The mechanism itself must stay intact ─────────────────────────────
const lib = fs.readFileSync(path.join(ROOT, 'backend', 'lib', 'claude.js'), 'utf8');
if (!lib.includes("require('./outputStandard')") || !lib.includes('withOutputStandard(')) {
  problems.push('backend/lib/claude.js no longer applies withOutputStandard — no v2 tool receives the standard');
}
const index = fs.readFileSync(path.join(ROUTES, 'index.js'), 'utf8');
// The bare identifier is not enough: it appears in the require line, so an
// audit that greps for the name passes while the call site is gone. Check the
// call, and check that the declaration is still read off the module.
if (!/enterRouteStandard\s*\(/.test(index) || !/routeModule\.outputStandard/.test(index)) {
  problems.push('backend/routes/index.js no longer puts each route\'s declaration in scope — every declaration is inert');
}

// ── 2. The frozen list must describe real files ──────────────────────────
const onDisk = new Set(
  fs.readdirSync(ROUTES).filter(f => f.endsWith('.js') && f !== 'index.js').map(f => f.replace(/\.js$/, ''))
);
for (const slug of FROZEN_V1) {
  if (!onDisk.has(slug)) {
    problems.push(`FROZEN_V1 lists "${slug}" but backend/routes/${slug}.js does not exist — renamed or deleted, so the freeze protects nothing`);
  }
}

// ── 3. A tool cannot be frozen and converted at the same time ────────────
for (const slug of onDisk) {
  const src = fs.readFileSync(path.join(ROUTES, `${slug}.js`), 'utf8');
  if (DECLARES_V2.test(src) && FROZEN_V1.has(slug)) {
    problems.push(`backend/routes/${slug}.js declares v2 but is still in FROZEN_V1 — converting on contact means deleting it from that list`);
  }
}

// ── 3b. Declaring v2 is not the same as enforcing it ────────────────────
// A route can carry the standard in its prompt and still ship whatever the
// model returned. Every v2 route therefore declares an enforcement profile —
// router.outputGuard — and calls the validator, or says out loud that it does
// not need one. Without this, "reviewed under v2" means the prompt got longer.
const DECLARES_GUARD = /(?:^|\n)\s*router\.outputGuard\s*=/;
// validateAndRepair is HecklerPrep v3's equivalent, and it is a stricter one:
// it checks every user-facing component against an extracted evidence ledger
// and repairs only the components that fail. Recognised by name for the same
// reason enforceSuppliedFacts is — a tool's own check counts, provided it runs
// after generation and can change what ships.
const CALLS_GUARD = /runOutputGuard\s*\(|checkAgainstSupplied\s*\(|enforceEnvelope\s*\(|enforceSuppliedFacts\s*\(|validateAndRepair\s*\(/;
// Routes exempt from needing a guard, by name and with a reason. Empty today.
const GUARD_EXEMPT = new Map([]);

for (const slug of onDisk) {
  const src = fs.readFileSync(path.join(ROUTES, `${slug}.js`), 'utf8');
  if (!DECLARES_V2.test(src)) continue;
  if (GUARD_EXEMPT.has(slug)) continue;
  if (!CALLS_GUARD.test(src)) {
    problems.push(`backend/routes/${slug}.js declares v2 but never runs a post-generation check — v2 would be an instruction nothing verifies.\n     Call runOutputGuard() from lib/outputGuard (or a tool-specific equivalent) before responding.`);
  } else if (!DECLARES_GUARD.test(src)) {
    problems.push(`backend/routes/${slug}.js runs a check but declares no router.outputGuard — the tool's own failure modes are the half the generic standard cannot know.\n     Add router.outputGuard = { prohibit: [...], require: [...] } beside the outputStandard declaration.`);
  }
}

// ── 3c. Schema congruence ───────────────────────────────────────────────
// A guard cannot save a schema that asks for the violation. Conflict Coach
// REQUIRED primary_emotion_detected, underlying_need, emotional_temperature and
// a manipulation_tactics array — the software was commissioning the
// hallucination, and every response would have failed and been repaired into an
// empty field the frontend still rendered.
//
// So: a v2 route's schema must not name a field whose purpose is unsupported
// inference. Matched against JSON key declarations only ("field": ...), never
// prose, so a comment explaining why a field was removed does not re-flag it.
// Mechanical detection catches the named shapes; the rest is a first-pass
// review item, because a field can commission a guess without saying so.
const SCHEMA_SMELLS = [
  [/^(?:.*_)?(?:emotional_)?temperature$/,                'a score for a feeling nobody measured'],
  [/^(?:primary_)?emotion(?:_detected|s)?$/,              'names what another person feels'],
  [/^underlying_(?:need|motive|reason|fear)$/,            'states a motive behind someone\u2019s words'],
  [/^manipulation_(?:tactics|detected|score)$/,           'diagnoses intent from a message'],
  [/^(?:communication_|personality_|attachment_)style$/,  'a psychological label as a determination'],
  [/^(?:likely|predicted|expected)_/,                     'predicts behaviour nobody observed'],
  [/_(?:probability|likelihood|odds)$/,                   'a number attached to a guess'],
  [/^(?:risk|escalation|toxicity|compatibility)_(?:score|level|rating)$/, 'false precision on a judgement'],
  [/^response_rate|_success_rate$/,                       'a population claim nobody counted'],
  [/^(?:their|his|her|they)_(?:intent|intention|goal|feelings?)$/, 'attributes an inner state to a real person'],
];
// Named exceptions, with reasons. Empty — an exception here should be a
// conspicuous decision, not a hole somebody fell into.
const SCHEMA_CONGRUENCE_EXEMPT = new Map([
  ['dream-pattern-spotter',
    'The "emotion" field holds emotions the DREAMER selected about their own ' +
    'dream and sent to us — recurring_emotions counts how often each of their ' +
    'own reported feelings recurs. The smell targets a field that names what ' +
    'another person feels; this one names what the visitor told us they felt. ' +
    'The prompt and the guard both forbid inferring an emotion that was not ' +
    'reported (emotion_the_dreamer_did_not_report).'],
]);

for (const slug of onDisk) {
  const src = fs.readFileSync(path.join(ROUTES, `${slug}.js`), 'utf8');
  if (!DECLARES_V2.test(src) || SCHEMA_CONGRUENCE_EXEMPT.has(slug)) continue;
  const keys = new Set([...src.matchAll(/"([a-z][a-z0-9_]{2,})"\s*:/g)].map(m => m[1]));
  for (const key of keys) {
    const hit = SCHEMA_SMELLS.find(([re]) => re.test(key));
    if (hit) {
      problems.push(
        `backend/routes/${slug}.js schema declares "${key}" — ${hit[1]}.\n` +
        `     A v2 guard cannot suppress a field whose whole purpose is the violation; it would empty it on every call.\n` +
        `     Remove or redesign the field, or add it to SCHEMA_CONGRUENCE_EXEMPT with a reason.`
      );
    }
  }
}

// ── 4. A v2 route's model calls must all be reachable by the contract ────
// enterRouteStandard covers every call under the request, including direct
// create() calls — but only if the call happens inside the request. A call at
// module load or from a detached timer runs with no store and silently loses
// the standard.
for (const slug of onDisk) {
  const src = fs.readFileSync(path.join(ROUTES, `${slug}.js`), 'utf8');
  if (!DECLARES_V2.test(src)) continue;
  if (/setInterval\s*\(|setTimeout\s*\(/.test(src) && /messages\.create/.test(src)) {
    notes.push(`backend/routes/${slug}.js is v2 and uses a timer — confirm no model call runs outside the request, or it loses the standard`);
  }
}

// ── 5. Touched routes must have answered the question ────────────────────
let changed = [];
try {
  const base = process.env.OUTPUT_STANDARD_BASE
    || execFileSync('git', ['rev-parse', '--verify', '--quiet', '@{upstream}'], { cwd: ROOT, encoding: 'utf8' }).trim()
    || execFileSync('git', ['rev-parse', '--verify', '--quiet', 'origin/main'], { cwd: ROOT, encoding: 'utf8' }).trim();
  if (base) {
    changed = execFileSync('git', ['diff', '--name-only', `${base}...HEAD`, '--', 'backend/routes/'], { cwd: ROOT, encoding: 'utf8' })
      .split('\n').map(s => s.trim()).filter(f => f.endsWith('.js') && !f.endsWith('/index.js'));
  }
} catch {
  // No upstream (fresh clone, detached head). Scope check is skipped, not failed.
}

for (const file of changed) {
  const slug = path.basename(file, '.js');
  if (FROZEN_V1.has(slug)) continue;
  const full = path.join(ROOT, file);
  if (!fs.existsSync(full)) continue;
  const touchedSrc = fs.readFileSync(full, 'utf8');
  if (DECLARES_V2.test(touchedSrc)) continue;
  // An output standard governs what the MODEL returns. Routes that never call
  // the model have no output to govern — the metrics report renders HTML from
  // the JSONL sink, /api/subscribe talks to Buttondown. Demanding a
  // declaration there teaches people to reach for OUTPUT_STANDARD_SKIP=1 on
  // edits that WERE reviewed, which is the exact habit this gate exists to
  // prevent. Detected rather than listed, so a route that starts calling the
  // model is caught on the commit that adds the call.
  if (!/messages\.create|callClaudeWithRetry|callClaude\b/.test(touchedSrc)) {
    notes.push(`backend/routes/${slug}.js changed but makes no model call — no output standard applies`);
    continue;
  }
  problems.push(
    `${file} was changed but declares no output standard, and is not among the 48 frozen tools.\n` +
    `     Review it against backend/lib/outputStandard.js, then add near the export:\n` +
    `       router.outputStandard = 'v2';\n` +
    `     If this edit was mechanical and no review happened, say so with OUTPUT_STANDARD_SKIP=1.`
  );
}

if (process.env.OUTPUT_STANDARD_SKIP === '1' && problems.length) {
  console.log('⚠️  output-standard-audit: skipped by OUTPUT_STANDARD_SKIP=1 —', problems.length, 'route(s) undeclared.');
  process.exit(0);
}

notes.forEach(n => console.log('   note: ' + n));
if (problems.length) {
  console.error('✖ output-standard-audit:');
  problems.forEach(p => console.error('   ' + p));
  process.exit(1);
}
const v2Count = [...onDisk].filter(s => DECLARES_V2.test(fs.readFileSync(path.join(ROUTES, `${s}.js`), 'utf8'))).length;
const guarded = [...onDisk].filter(sl => {
  const src = fs.readFileSync(path.join(ROUTES, `${sl}.js`), 'utf8');
  return DECLARES_V2.test(src) && DECLARES_GUARD.test(src);
}).length;
console.log(`✅ output-standard-audit: ${FROZEN_V1.size} frozen, ${v2Count} on v2 (${guarded} with an enforcement profile), ${changed.length} route(s) in scope.`);
