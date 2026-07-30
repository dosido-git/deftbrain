#!/usr/bin/env node
/**
 * scan-value-fields.js — DeftBrain audit
 *
 * Catches a bug class invisible to every other gate, because nothing 500s and
 * nothing lints: a schema field whose value is CONSUMED AS A VALUE — an enum
 * the frontend switches on, a string handed to CSS, a number divided — but
 * whose prompt spec is written like prose.
 *
 * Four checks, all drawn from real buy-wise bugs found on 2026-07-30:
 *
 *  ENUM-TAIL (backend only) — the spec is an option list AND ends in a
 *    copyable annotation, so the model emits the annotation as part of the
 *    value:
 *      "trust": "HIGH/MEDIUM/LOW — one sentence"  → "HIGH — refunds cover…"
 *    Frontend did `pt.trust === 'HIGH'`, which that never equals, so every row
 *    fell through to the same fallback colour. Silent for months.
 *
 *  NAME-TAIL (backend only) — same echo, but on a field that names a thing
 *    rather than choosing from options. A name IS a name, so the length
 *    annotation reads as content:
 *      "platform": "Store/platform name — one sentence"
 *      → rendered "Canyon.com directly — one sentence:" in the live UI.
 *
 *  DEAD-BRANCH — the frontend compares against a literal the enum spec never
 *    offers. The branch cannot execute.
 *
 *  UNPINNED (ADVISORY — risk, not a live defect) — the frontend switches on an
 *    enum and the route wraps its prompt with withLanguage(), whose directive is
 *    blanket: "write all JSON string values in {lang}". Nothing exempts enums,
 *    so 'HIGH' may return 'HOCH' and the switch dies in 12 of 13 languages while
 *    looking perfect in English.
 *      BUT measured, not assumed: a German buy-wise run returned unpinned
 *      verdict_badge "HIGH" and timing_badge "WAIT" in English anyway — SHOUTED
 *      tokens read as identifiers, so the model tends to leave them alone. The
 *      risk is real (it is a recurring entry in the project's bug log) but
 *      probabilistic. Reported as advisory and does NOT fail the run; lowercase
 *      and Title-case options rank first, being the ones a translator will
 *      actually translate.
 *
 *  FORMAT — the value lands in CSS (width/inset) or in arithmetic ({v}/10), so
 *    it must be a bare token, but the spec invites prose.
 *
 * PRECISION: a paired finding is raised only when the backend spec is a
 * recognisable ENUM (2+ short options split on | or /). Matching on field name
 * alone produced ~40 false positives per run — common names like `type`,
 * `level`, and `category` collide across unrelated schemas and with frontend
 * view state. The enum shape is the anchor.
 *
 * Usage:
 *   node scripts/scan-value-fields.js            # all tools + all routes
 *   node scripts/scan-value-fields.js Foo.js …   # specific tool pages
 *   node scripts/scan-value-fields.js --json
 *
 * Exit 1 if any finding is raised.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TOOLS_DIR = path.join(ROOT, 'src/tools');
const ROUTES_DIR = path.join(ROOT, 'backend/routes');

const asJson = process.argv.includes('--json');
const argFiles = process.argv.slice(2).filter(a => !a.startsWith('--'));

// ── Spec shapes ──────────────────────────────────────────────────────────────

// An annotation the model can copy verbatim instead of obeying.
function echoTail(spec) {
  const t = spec.trim();
  let m = t.match(/(—\s*(?:one|two|1-2|2-3|3-6|a few|\d+[-–]\d+)\b[^"]{0,44})$/i);
  if (m) return m[1].trim();
  m = t.match(/(\([^)]{0,44}(?:sentence|words|if applicable|one emoji|number)[^)]{0,20}\))$/i);
  if (m) return m[1].trim();
  return null;
}

// Is this spec an option list? Strip any tail first, then split on | or /.
function enumOptions(spec) {
  let body = spec.trim();
  const tail = echoTail(body);
  if (tail) body = body.slice(0, body.length - tail.length).trim();
  // Drop a leading gloss like "detected category: "
  body = body.replace(/^[^:|/]{0,40}:\s*/, '');
  const sep = body.includes('|') ? '|' : '/';
  if (!body.includes(sep)) return null;
  const parts = body.split(sep).map(s => s.trim()).filter(Boolean);
  if (parts.length < 2) return null;
  // Strip a gloss hanging off the final option ("disappeared — never mentioned
  // again"), which is otherwise mistaken for a 4-word option and sinks the
  // whole spec.
  parts[parts.length - 1] = parts[parts.length - 1].replace(/\s*—.*$/, '').trim();
  if (!parts[parts.length - 1]) return null;
  // Options are short tokens — not clauses.
  if (!parts.every(p => p.length <= 25 && /^[\p{L}\p{Emoji_Presentation}\w '’-]+$/u.test(p))) return null;
  // A slash is far more often prose than an option list: "Person/role",
  // "trust/bond was damaged", "Restaurant/bar name". Real enums give
  // themselves away three ways — every option at most 3 words, PLUS either
  // 3+ options, a spaced separator, or SHOUTED options. Without this,
  // 30-odd slashed phrases per run drown the genuine findings.
  if (!parts.every(p => p.split(/\s+/).length <= 3)) return null;
  const spaced = new RegExp(`\\s\\${sep}\\s`).test(body);
  const shouted = parts.every(p => p === p.toUpperCase() && /[A-Z]/.test(p));
  if (parts.length < 3 && !spaced && !shouted) return null;
  return parts;
}

const PIN_RE = /untranslated|exact English|English word|in English|do not translate|keep in English/i;

// ── Frontend consumption ─────────────────────────────────────────────────────

const CMP_RE = /[A-Za-z_$][\w$]*(?:\?\.|\.)(?:[\w$]+(?:\?\.|\.))*([\w$]+)\s*(?:===|!==)\s*'([^']{1,40})'/g;
const CMP_REV_RE = /'([^']{1,40})'\s*(?:===|!==)\s*[A-Za-z_$][\w$]*(?:\?\.|\.)(?:[\w$]+(?:\?\.|\.))*([\w$]+)/g;
const CSS_RE = /(?:width|height|flexBasis|maxWidth|minWidth|insetInlineStart)\s*:\s*[`'"]?\$?\{?\s*[A-Za-z_$][\w$.?]*\.([\w$]+)/g;
const RATIO_RE = /\{\s*[A-Za-z_$][\w$.?]*\.([\w$]+)\s*\}\s*\/\s*\d/g;

function frontendUse(code) {
  const out = new Map(); // field -> {literals:Set, css:bool, ratio:bool, line:number}
  const touch = (field, idx) => {
    if (!out.has(field)) out.set(field, { literals: new Set(), css: false, ratio: false, line: code.slice(0, idx).split('\n').length });
    return out.get(field);
  };
  let m;
  while ((m = CMP_RE.exec(code))) touch(m[1], m.index).literals.add(m[2]);
  while ((m = CMP_REV_RE.exec(code))) touch(m[2], m.index).literals.add(m[1]);
  while ((m = CSS_RE.exec(code))) touch(m[1], m.index).css = true;
  while ((m = RATIO_RE.exec(code))) touch(m[1], m.index).ratio = true;

  const SW_RE = /switch\s*\(\s*[A-Za-z_$][\w$.?]*\.([\w$]+)\s*\)\s*\{([\s\S]{0,900}?)\}/g;
  while ((m = SW_RE.exec(code))) {
    const e = touch(m[1], m.index);
    for (const c of m[2].matchAll(/case\s+'([^']{1,40})'/g)) e.literals.add(c[1]);
  }
  return out;
}

// ── Route parsing ────────────────────────────────────────────────────────────

function routeSpecs(code) {
  const specs = new Map(); // field -> Set(spec)
  for (const m of code.matchAll(/"([\w$]+)"\s*:\s*"((?:[^"\\]|\\.)*)"/g)) {
    if (!specs.has(m[1])) specs.set(m[1], new Set());
    specs.get(m[1]).add(m[2]);
  }
  return specs;
}

function routeFileFor(code) {
  for (const m of code.matchAll(/callToolEndpoint\(\s*'([^']+)'/g)) {
    const f = path.join(ROUTES_DIR, m[1].split('/')[0] + '.js');
    if (fs.existsSync(f)) return f;
  }
  return null;
}

// Specs are captured with their JS escapes intact ("...\\"quoted\\"..."). Unescape
// before reporting, and never clip mid-escape — a trailing lone backslash
// produced invalid --json output.
const unesc = s => s.replace(/\\(.)/g, '$1');
const clip = s => { const u = unesc(s); return u.length > 92 ? u.slice(0, 92) + '…' : u; };

// ── Scan ─────────────────────────────────────────────────────────────────────

const findings = [];

// Check 1 — backend only. Every route, no pairing needed.
for (const rf of fs.readdirSync(ROUTES_DIR).filter(f => f.endsWith('.js') && f !== 'index.js')) {
  const code = fs.readFileSync(path.join(ROUTES_DIR, rf), 'utf8');
  for (const [field, set] of routeSpecs(code)) {
    for (const spec of set) {
      const tail = echoTail(spec);
      if (!tail) continue;
      const opts = enumOptions(spec);
      if (!opts) continue;
      findings.push({
        kind: 'ENUM-TAIL', route: rf, field, tool: '—', line: 0,
        detail: `enum [${opts.join(', ')}] with copyable tail "${tail}" — model will emit "${opts[0]} ${tail}"`,
        spec: clip(spec),
      });
    }
  }
  // NAME-TAIL: a short spec that asks for a NAME and then appends a length
  // annotation. The annotation cannot be distinguished from the name itself,
  // so the model periodically writes it out. Requires the spec body to be
  // short and name-ish, which keeps prose like "Why this platform for this
  // specific product — one sentence" out.
  for (const [field, set] of routeSpecs(code)) {
    for (const spec of set) {
      const tail = echoTail(spec);
      if (!tail || enumOptions(spec)) continue;
      const body = spec.slice(0, spec.length - tail.length).trim();
      if (body.length > 40) continue;
      if (!/^[^.?!]{0,30}\b(name|label|title|platform|store|month|brand)\b/i.test(body)) continue;
      // Split by how contradictory the pairing is. "name — one sentence" is
      // self-contradicting (a name is not a sentence), which is the shape that
      // actually leaked into the live UI. "name — 3-6 words" is coherent: the
      // annotation could still be copied, but it has not been observed doing
      // so, so it is filed as advisory rather than a defect.
      const contradictory = /sentence/i.test(tail);
      findings.push({
        kind: contradictory ? 'NAME-TAIL' : 'NAME-TAIL-SOFT', route: rf, field, tool: '—', line: 0,
        detail: contradictory
          ? `a name is not a sentence, yet the spec appends "${tail}" — this is the shape that leaked into the live UI`
          : `names a thing, then appends "${tail}" — copyable, but no observed leak for word-count tails`,
        spec: clip(spec),
      });
    }
  }
}

// Checks 2-4 — paired.
const toolFiles = (argFiles.length ? argFiles : fs.readdirSync(TOOLS_DIR).filter(f => f.endsWith('.js')))
  .map(f => (path.isAbsolute(f) ? f : path.join(TOOLS_DIR, path.basename(f))))
  .filter(f => fs.existsSync(f));

let paired = 0;
for (const tf of toolFiles) {
  const fe = fs.readFileSync(tf, 'utf8');
  const routeFile = routeFileFor(fe);
  if (!routeFile) continue;
  paired++;
  const be = fs.readFileSync(routeFile, 'utf8');
  const specs = routeSpecs(be);
  const localized = /withLanguage\s*\(/.test(be);
  const tool = path.basename(tf), route = path.basename(routeFile);

  for (const [field, use] of frontendUse(fe)) {
    const set = specs.get(field);
    if (!set) continue;
    const enumSpecs = [...set].map(s => ({ s, opts: enumOptions(s) })).filter(x => x.opts);
    if (!enumSpecs.length) {
      if ((use.css || use.ratio) && [...set].some(s => /sentence|words|explain|describe/i.test(s))) {
        const s = [...set].find(x => /sentence|words|explain|describe/i.test(x));
        findings.push({
          kind: 'FORMAT', tool, route, field, line: use.line,
          detail: `value is consumed by ${use.css ? 'CSS' : 'arithmetic'} — must be a bare token, but the spec invites prose`,
          spec: clip(s),
        });
      }
      continue;
    }

    const allOpts = new Set(enumSpecs.flatMap(x => x.opts.map(o => o.toLowerCase())));
    const lits = [...use.literals];
    const NOT_AN_ENUM = /^(?:[a-z]+\/[a-z0-9.+-]+|https?:|\/|\.)/i; // MIME, URL, path
    const dead = lits.filter(l => !allOpts.has(l.toLowerCase()) && !NOT_AN_ENUM.test(l));
    const styleOf = t => (t === t.toUpperCase() && /[A-Z]/.test(t) ? 'UPPER' : /_/.test(t) ? 'SNAKE' : 'other');
    const optStyles = new Set([...allOpts].map(styleOf));
    const sameStyle = dead.some(l => optStyles.has(styleOf(l)));
    if (lits.length && dead.length === lits.length && sameStyle) {
      findings.push({
        kind: 'DEAD-BRANCH', tool, route, field, line: use.line,
        detail: `frontend compares ${dead.map(l => `'${l}'`).join('/')}, enum offers [${[...allOpts].join(', ')}]`,
        spec: clip(enumSpecs[0].s),
      });
    }
    // Only claim the frontend consumes THIS enum if one of its comparison
    // literals is actually one of the options. Field names like `type`,
    // `mode` and `level` collide constantly with frontend view state; an
    // overlapping literal is what proves it is the same field.
    const overlaps = lits.some(l => allOpts.has(l.toLowerCase()));
    if (overlaps && localized && !enumSpecs.some(x => PIN_RE.test(x.s))) {
      findings.push({
        kind: 'UNPINNED', tool, route, field, line: use.line,
        detail: `switched on in JSX but not pinned to English — withLanguage will translate it in 12 of 13 languages`,
        spec: clip(enumSpecs[0].s),
      });
    }
  }
}

// ── Report ───────────────────────────────────────────────────────────────────

// ENUM-TAIL / DEAD-BRANCH / FORMAT are defects you can see in the rendered
// page. UNPINNED is a hardening backlog — see the header note.
const DEFECTS = ['ENUM-TAIL', 'NAME-TAIL', 'DEAD-BRANCH', 'FORMAT'];
const ORDER = [...DEFECTS, 'NAME-TAIL-SOFT', 'UNPINNED'];
findings.sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind) || (a.route + a.field).localeCompare(b.route + b.field));
const defectCount = findings.filter(f => DEFECTS.includes(f.kind)).length;

if (asJson) {
  console.log(JSON.stringify({ paired, findings }, null, 2));
} else if (!findings.length) {
  console.log(`✅ scan-value-fields: clean (${paired} tool/route pair(s)).`);
} else {
  console.log(`scan-value-fields — ${paired} pair(s), ${defectCount} defect(s), ${findings.length - defectCount} advisory\n`);
  for (const kind of ORDER) {
    const g = findings.filter(f => f.kind === kind);
    if (!g.length) continue;
    console.log(`── ${kind} (${g.length})${DEFECTS.includes(kind) ? '' : '  [advisory — does not fail the run]'} ──`);
    for (const f of g) {
      console.log(`  ${f.route} › ${f.field}${f.tool !== '—' ? `   [${f.tool}:${f.line}]` : ''}`);
      console.log(`     ${f.detail}`);
      console.log(`     spec: "${f.spec}"`);
    }
    console.log();
  }
}

// process.exit() would discard buffered stdout when piped — --json output was
// being cut off mid-string at the 64KB pipe boundary. Setting exitCode lets
// node flush and exit naturally.
process.exitCode = defectCount ? 1 : 0;
