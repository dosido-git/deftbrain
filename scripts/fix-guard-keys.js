#!/usr/bin/env node
/**
 * fix-guard-keys.js — DeftBrain codemod
 *
 * Fixes the guard/schema mismatch bug found by scan-guard-keys.js:
 * replaces response guards that check a key the prompt never returns with the
 * first key the handler's own prompt schema actually provides.
 *
 * Usage:
 *   node scripts/fix-guard-keys.js                 # dry-run — shows what would change
 *   node scripts/fix-guard-keys.js --write          # apply fixes in-place
 *   node scripts/fix-guard-keys.js --write path/... # specific files or dirs
 *
 * Always review `git diff` after --write before committing.
 *
 * NOTES:
 *   - Uses schemaSample[0] from scan-guard-keys as the replacement key. This is
 *     usually correct but check the diff for any key that looks like a boolean flag
 *     (e.g. `!parsed.has_something`, `!parsed.is_valid`). Those may need manual review
 *     since a falsy boolean would re-trigger the guard. They are marked ⚠ in output.
 *   - Each fix is validated by re-scanning the patched content before writing.
 *     Unresolved findings (where the first schema key didn't help) are left untouched
 *     and reported separately.
 */

const fs = require('fs');
const path = require('path');

let { scanFile, gatherFiles } = {};
try { ({ scanFile, gatherFiles } = require('./scan-guard-keys')); }
catch { console.error('fix-guard-keys: cannot find scan-guard-keys.js in the same directory.'); process.exit(2); }

// Regex matching the full multi-key guard test: !parsed.X && !parsed.Y [&& !parsed.Z...]
const GUARD_RE = /!parsed\.\w+(?:\s*&&\s*!parsed\.\w+)*/;
// Heuristic for likely-boolean key names (flag for manual review)
const BOOL_HINT_RE = /^(has_|is_|was_|can_|should_|will_|no_|needs_|found)/i;

function pickBestKey(schemaSample) {
  // Prefer the first non-boolean-looking key; fall back to first key
  return schemaSample.find(k => !BOOL_HINT_RE.test(k)) || schemaSample[0];
}

function patchFile(filepath, findings, dryRun) {
  const src = fs.readFileSync(filepath, 'utf8');
  const lines = src.split('\n');
  const patches = [];
  const unresolved = [];

  for (const f of findings) {
    if (!f.schemaSample || !f.schemaSample.length) {
      unresolved.push({ ...f, reason: 'no schema keys available' });
      continue;
    }
    const lineIdx = f.line - 1;
    if (lineIdx < 0 || lineIdx >= lines.length) {
      unresolved.push({ ...f, reason: 'line out of range' });
      continue;
    }

    const original = lines[lineIdx];
    if (!GUARD_RE.test(original)) {
      unresolved.push({ ...f, reason: 'guard pattern not found on reported line' });
      continue;
    }

    const newKey = pickBestKey(f.schemaSample);
    const newTest = `!parsed.${newKey}`;
    const patched = original.replace(GUARD_RE, newTest);
    if (patched === original) {
      unresolved.push({ ...f, reason: 'replacement produced no change' });
      continue;
    }

    // Validate: re-scan the patched content; the fix should eliminate this finding
    const patchedLines = [...lines];
    patchedLines[lineIdx] = patched;
    const tempSrc = patchedLines.join('\n');
    const tmpPath = filepath + '.tmp_scan';
    fs.writeFileSync(tmpPath, tempSrc);
    let stillFlagged = false;
    try {
      const recheck = scanFile(tmpPath);
      stillFlagged = recheck.findings.some(rf => rf.line === f.line);
    } finally {
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    }
    if (stillFlagged) {
      unresolved.push({ ...f, reason: `'${newKey}' still not found in schema after patch — manual review needed` });
      continue;
    }

    const isBoolish = BOOL_HINT_RE.test(newKey);
    patches.push({ lineIdx, original, patched, finding: f, newKey, isBoolish });
    lines[lineIdx] = patched; // apply to line buffer for subsequent patches in same file
  }

  return { patches, unresolved };
}

function main() {
  const args = process.argv.slice(2);
  const write = args.includes('--write');
  const targets = args.filter(a => !a.startsWith('--'));
  const roots = targets.length ? targets : ['backend/routes'];
  const files = gatherFiles(roots);

  let totalPatched = 0, totalUnresolved = 0, filesChanged = 0;
  const summary = [];

  for (const f of files) {
    const result = scanFile(f);
    if (result.error || !result.findings.length) continue;

    const src = fs.readFileSync(f, 'utf8');
    const lines = src.split('\n');
    const { patches, unresolved } = patchFile(f, result.findings, !write);

    if (!patches.length && !unresolved.length) continue;

    const relPath = path.relative(process.cwd(), f);
    console.log(`\n${relPath}`);
    for (const p of patches) {
      const warn = p.isBoolish ? ' ⚠ (boolean key — verify)' : '';
      console.log(`  line ${p.finding.line}${p.finding.label ? ` [${p.finding.label}]` : ''}: ${p.finding.keys.map(k=>`parsed.${k}`).join(' / ')} → parsed.${p.newKey}${warn}`);
    }
    for (const u of unresolved) {
      console.log(`  line ${u.line}${u.label ? ` [${u.label}]` : ''}: ⚠ UNRESOLVED — ${u.reason}`);
    }

    totalPatched += patches.length;
    totalUnresolved += unresolved.length;
    summary.push({ file: f, patches: patches.length, unresolved: unresolved.length });

    if (write && patches.length) {
      // Re-apply patches to the original source (patchFile mutates `lines` during validation)
      const freshLines = src.split('\n');
      for (const p of patches) freshLines[p.lineIdx] = p.patched;
      fs.writeFileSync(f, freshLines.join('\n'));
      filesChanged++;
    }
  }

  console.log('');
  if (!totalPatched && !totalUnresolved) {
    console.log(`✅ fix-guard-keys: nothing to fix across ${files.length} file(s).`);
    process.exit(0);
  }

  if (write) {
    console.log(`✅ Applied ${totalPatched} fix(es) across ${filesChanged} file(s).`);
  } else {
    console.log(`Dry run — ${totalPatched} fix(es) across ${summary.length} file(s) would be applied. Re-run with --write to apply.`);
  }
  if (totalUnresolved) {
    console.log(`⚠  ${totalUnresolved} finding(s) unresolved — manual review needed (see above).`);
  }
  if (!write && totalPatched) process.exit(1); // exit 1 so CI sees work is pending
}

main();
