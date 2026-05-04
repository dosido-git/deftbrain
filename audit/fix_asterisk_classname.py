#!/usr/bin/env python3
"""
fix_asterisk_classname.py — replace non-canonical asterisk span classNames with c.required.

Targets these patterns on lines containing `*</span>`:
  - className="text-red-400"
  - className="text-red-500"
  - className={c.textMuteded}   (typo alias for textMuted)
  - className={c.textMuted}

Replaces with: className={c.required}

Skips lines where className already references c.required.
Idempotent. Dry-run by default; pass --apply to write.
Reports every line touched.
"""

import argparse
import re
import sys
from pathlib import Path

# Match the className attribute on lines that include `*</span>` somewhere.
PATTERNS = [
    (re.compile(r'className="text-red-400(?:\s+[^"]*)?"'), 'className={c.required}'),
    (re.compile(r'className="text-red-500(?:\s+[^"]*)?"'), 'className={c.required}'),
    (re.compile(r'className=\{c\.textMuteded\}'), 'className={c.required}'),
    (re.compile(r'className=\{c\.textMuted\}'), 'className={c.required}'),
]

ASTERISK_LINE_RE = re.compile(r'\*</span>')


def patch_file(path: Path, apply: bool) -> tuple[str, list[str]]:
    lines = path.read_text().splitlines(keepends=True)
    changes = []
    new_lines = []

    for i, line in enumerate(lines, start=1):
        if not ASTERISK_LINE_RE.search(line):
            new_lines.append(line)
            continue
        if 'c.required' in line:
            new_lines.append(line)
            continue

        replaced = line
        for pat, repl in PATTERNS:
            new_replaced, n = pat.subn(repl, replaced)
            if n:
                replaced = new_replaced
                changes.append(f'  line {i}: matched {pat.pattern!r}')
                break

        new_lines.append(replaced)

    if not changes:
        return ('SKIP: no matches', [])

    if apply:
        path.write_text(''.join(new_lines))
        return (f'PATCHED: {len(changes)} change(s)', changes)
    return (f'DRY-RUN: would change {len(changes)} line(s)', changes)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('files', nargs='+')
    ap.add_argument('--apply', action='store_true')
    ap.add_argument('--verbose', '-v', action='store_true')
    args = ap.parse_args()

    width = max(len(Path(f).name) for f in args.files)
    summary = {}

    for f in args.files:
        p = Path(f)
        if not p.exists():
            print(f'{Path(f).name:<{width}}  FAIL: not found')
            summary['FAIL'] = summary.get('FAIL', 0) + 1
            continue
        try:
            status, changes = patch_file(p, args.apply)
        except Exception as e:
            print(f'{Path(f).name:<{width}}  ERROR: {e}')
            summary['ERROR'] = summary.get('ERROR', 0) + 1
            continue

        print(f'{Path(f).name:<{width}}  {status}')
        if args.verbose:
            for c in changes:
                print(c)

        key = status.split(':')[0]
        summary[key] = summary.get(key, 0) + 1

    print('\n--- summary ---')
    for k, v in summary.items():
        print(f'{k}: {v}')


if __name__ == '__main__':
    main()
