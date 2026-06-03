#!/usr/bin/env node
/**
 * scan-guard-keys.js — DeftBrain audit (Pile 1)
 *
 * Catches a bug class ESLint cannot see: a response guard that checks a key the
 * prompt never asks Claude to return. Because `callClaudeWithRetry` resolves to
 * parsed JSON, a guard like `if (!parsed.batches) return res.status(500)...` is
 * valid JS — but if the prompt's schema returns `execution_plan`, the guard is
 * ALWAYS true and the endpoint 500s on every call. Silent in lint, fatal at runtime.
 *
 * Heuristic: for each handler scope (a block containing `const parsed = await
 * callClaudeWithRetry(...)`), collect the JSON keys the prompt requests (every
 * "key": token in the prompt's string/template literals), then check each guard
 * that (a) negates a `parsed.<key>` and (b) returns via `res.status(...)`. If NONE
 * of the guard's keys appear in the prompt schema (own block + enclosing scopes),
 * it is flagged.
 *
 * Usage:
 *   node scripts/scan-guard-keys.js                 # scans backend/routes
 *   node scripts/scan-guard-keys.js path [path...]  # scan specific files/dirs
 *   node scripts/scan-guard-keys.js --json          # machine-readable output
 *
 * Exit code 1 if any mismatch is found (so it can gate CI / pre-push).
 */

const fs = require('fs');
const path = require('path');

let parser;
try { parser = require('@babel/parser'); }
catch { console.error('scan-guard-keys: @babel/parser not found (npm i -D @babel/parser).'); process.exit(2); }

const GUARD_OBJ = 'parsed';          // the variable holding the parsed AI response
const RES_OBJ = 'res';               // express response object
const SKIP_KEYS = new Set(['loc', 'start', 'end', 'range', 'leadingComments', 'trailingComments', 'comments', 'tokens', 'extra']);
const KEY_RE = /"([A-Za-z_][A-Za-z0-9_]*)"\s*:/g;

// ── tiny AST helpers (manual walk; no @babel/traverse dependency) ──
function walk(node, parent, parentMap, cb) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) { for (const n of node) walk(n, parent, parentMap, cb); return; }
  if (typeof node.type === 'string') { parentMap.set(node, parent); cb(node); parent = node; }
  for (const k in node) {
    if (SKIP_KEYS.has(k)) continue;
    const v = node[k];
    if (v && typeof v === 'object') walk(v, parent, parentMap, cb);
  }
}

function memberRoot(node, objName) {
  // returns first-level property name for `objName.<prop>` (or objName?.<prop>), else null
  if (!node) return null;
  if ((node.type === 'MemberExpression' || node.type === 'OptionalMemberExpression') && !node.computed) {
    if (node.object && node.object.type === 'Identifier' && node.object.name === objName) {
      return node.property && node.property.name;
    }
  }
  return null;
}

function collectParsedKeys(testNode) {
  const keys = new Set();
  (function rec(n) {
    if (!n || typeof n !== 'object') return;
    if (Array.isArray(n)) { n.forEach(rec); return; }
    const root = memberRoot(n, GUARD_OBJ);
    if (root) keys.add(root);
    for (const k in n) { if (SKIP_KEYS.has(k)) continue; const v = n[k]; if (v && typeof v === 'object') rec(v); }
  })(testNode);
  return keys;
}

function subtreeReferencesResStatus(node) {
  let found = false;
  (function rec(n) {
    if (found || !n || typeof n !== 'object') return;
    if (Array.isArray(n)) { n.forEach(rec); return; }
    if ((n.type === 'MemberExpression' || n.type === 'OptionalMemberExpression') &&
        n.object && n.object.type === 'Identifier' && n.object.name === RES_OBJ) { found = true; return; }
    for (const k in n) { if (SKIP_KEYS.has(k)) continue; const v = n[k]; if (v && typeof v === 'object') rec(v); }
  })(node);
  return found;
}

// schema keys from a block's OWN statements — do not descend into nested blocks (other scopes)
function directSchemaKeys(block) {
  const text = [];
  (function rec(n) {
    if (!n || typeof n !== 'object') return;
    if (Array.isArray(n)) { n.forEach(rec); return; }
    if (n.type === 'BlockStatement' && n !== block) return; // stop at nested scope
    if (n.type === 'TemplateLiteral' && Array.isArray(n.quasis)) {
      for (const q of n.quasis) text.push((q.value && (q.value.cooked != null ? q.value.cooked : q.value.raw)) || '');
    }
    if (n.type === 'StringLiteral') text.push(n.value);
    for (const k in n) { if (SKIP_KEYS.has(k)) continue; const v = n[k]; if (v && typeof v === 'object') rec(v); }
  })(block);
  const keys = new Set();
  const blob = text.join('\n');
  let m;
  while ((m = KEY_RE.exec(blob)) !== null) keys.add(m[1]);
  KEY_RE.lastIndex = 0;
  return keys;
}

function enclosingBlock(node, parentMap) {
  let cur = parentMap.get(node);
  while (cur && cur.type !== 'BlockStatement') cur = parentMap.get(cur);
  return cur;
}
function ancestorBlocks(block, parentMap) {
  const out = [];
  let cur = parentMap.get(block);
  while (cur) {
    if (cur.type === 'BlockStatement' || cur.type === 'Program') out.push(cur);
    cur = parentMap.get(cur);
  }
  return out;
}

// label from `callClaudeWithRetry(..., { label: 'X' })` within a block (best-effort, for reporting)
function blockLabel(block) {
  let label = null;
  (function rec(n) {
    if (label || !n || typeof n !== 'object') return;
    if (Array.isArray(n)) { n.forEach(rec); return; }
    if (n.type === 'BlockStatement' && n !== block) return;
    if (n.type === 'ObjectProperty' && n.key && (n.key.name === 'label' || n.key.value === 'label') &&
        n.value && n.value.type === 'StringLiteral') { label = n.value.value; return; }
    for (const k in n) { if (SKIP_KEYS.has(k)) continue; const v = n[k]; if (v && typeof v === 'object') rec(v); }
  })(block);
  return label;
}

function scanFile(file) {
  const src = fs.readFileSync(file, 'utf8');
  let ast;
  for (const sourceType of ['script', 'module']) {
    try { ast = parser.parse(src, { sourceType, plugins: ['jsx', 'optionalChaining', 'nullishCoalescingOperator'] }); break; }
    catch (e) { if (sourceType === 'module') return { file, error: e.message, findings: [] }; }
  }
  const parentMap = new Map();
  const guards = [];
  walk(ast.program, null, parentMap, (n) => {
    if (n.type === 'IfStatement') {
      const keys = collectParsedKeys(n.test);
      if (keys.size && subtreeReferencesResStatus(n.consequent)) {
        guards.push({ node: n, keys, line: n.loc && n.loc.start.line });
      }
    }
  });

  const findings = [];
  for (const g of guards) {
    const blk = enclosingBlock(g.node, parentMap);
    if (!blk) continue;
    const schema = directSchemaKeys(blk);
    for (const ab of ancestorBlocks(blk, parentMap)) for (const k of directSchemaKeys(ab)) schema.add(k);
    if (schema.size === 0) continue; // no prompt schema in scope — can't judge, skip (avoid false positives)
    const hit = [...g.keys].some(k => schema.has(k));
    if (!hit) {
      findings.push({ line: g.line, keys: [...g.keys], label: blockLabel(blk), schemaSample: [...schema].slice(0, 8) });
    }
  }
  return { file, findings };
}

function gatherFiles(targets) {
  const files = [];
  const visit = (p) => {
    const st = fs.statSync(p);
    if (st.isDirectory()) { for (const e of fs.readdirSync(p)) { if (e === 'node_modules' || e.startsWith('.')) continue; visit(path.join(p, e)); } }
    else if (/\.(js|jsx)$/.test(p)) files.push(p);
  };
  for (const t of targets) { if (fs.existsSync(t)) visit(t); }
  return files;
}

function main() {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const targets = args.filter(a => !a.startsWith('--'));
  const roots = targets.length ? targets : ['backend/routes'];
  const files = gatherFiles(roots);

  const all = [];
  let parseErrors = 0;
  for (const f of files) {
    const r = scanFile(f);
    if (r.error) { parseErrors++; continue; }
    if (r.findings.length) all.push(r);
  }

  if (json) { console.log(JSON.stringify(all, null, 2)); process.exit(all.length ? 1 : 0); }

  if (!all.length) {
    console.log(`✅ scan-guard-keys: no mismatches in ${files.length} file(s)${parseErrors ? ` (${parseErrors} unparseable, skipped)` : ''}.`);
    process.exit(0);
  }
  let count = 0;
  for (const r of all) {
    console.log(`\n${r.file}`);
    for (const f of r.findings) {
      count++;
      const where = f.label ? ` [${f.label}]` : '';
      console.log(`  line ${f.line}${where}: guard checks ${f.keys.map(k => `parsed.${k}`).join(' / ')} — not in prompt schema`);
      console.log(`      prompt returns: ${f.schemaSample.join(', ')}${f.schemaSample.length >= 8 ? ', …' : ''}`);
    }
  }
  console.log(`\n✖ ${count} guard/schema mismatch(es) across ${all.length} file(s). Each one 500s on every request.`);
  process.exit(1);
}

if (require.main === module) main();
module.exports = { scanFile, gatherFiles };
