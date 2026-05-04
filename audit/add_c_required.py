#!/usr/bin/env python3
"""
add_c_required.py — inject `required: isDark ? 'text-amber-400' : 'text-amber-500',`
into the c block of any tool file missing it.

Strategy:
  1. Skip if `required:` already present in c block.
  2. Locate `const c = useMemo(() =>` or `const c = isDark ?` patterns.
  3. Find a `textMuted:` line as anchor (always present, formatting consistent).
  4. Insert `required:` line directly after the anchor with matching indentation.

Idempotent. Dry-run by default; pass --apply to write.
"""

import argparse
import re
import sys
from pathlib import Path

CANONICAL_LINE = "    required:      isDark ? 'text-amber-400' : 'text-amber-500',"
ANCHOR_RE = re.compile(r'^(\s*)textMuted:\s*.*$', re.MULTILINE)

def patch_file(path: Path, apply: bool) -> str:
    content = path.read_text()

    if 'required:' in content:
        return 'SKIP: already has required'

    matches = list(ANCHOR_RE.finditer(content))
    if not matches:
        return 'FAIL: no textMuted anchor found'

    new_content = content
    inserts = 0
    for m in reversed(matches):
        indent = m.group(1)
        line_end = m.end()
        canonical = f"\n{indent}required:      isDark ? 'text-amber-400' : 'text-amber-500',"
        new_content = new_content[:line_end] + canonical + new_content[line_end:]
        inserts += 1

    if apply:
        path.write_text(new_content)
        return f'PATCHED: {inserts} insert(s)'
    return f'DRY-RUN: would insert {inserts} time(s)'


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('files', nargs='+')
    ap.add_argument('--apply', action='store_true')
    args = ap.parse_args()

    results = {}
    for f in args.files:
        p = Path(f)
        if not p.exists():
            results[f] = 'FAIL: not found'
            continue
        try:
            results[f] = patch_file(p, args.apply)
        except Exception as e:
            results[f] = f'ERROR: {e}'

    width = max(len(Path(f).name) for f in args.files)
    for f, status in results.items():
        print(f'{Path(f).name:<{width}}  {status}')

    summary = {}
    for s in results.values():
        key = s.split(':')[0]
        summary[key] = summary.get(key, 0) + 1
    print('\n--- summary ---')
    for k, v in summary.items():
        print(f'{k}: {v}')


if __name__ == '__main__':
    main()
