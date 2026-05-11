#!/usr/bin/env python3
"""
fix_opacity_normalize.py — normalize disabled:opacity-* to canonical opacity-40.

PF-13 requires `disabled:opacity-40` on any button that disables on loading
or on a `.trim()` empty check. This script catches stragglers
(opacity-30, -50, -60, etc.) and replaces them with -40.

Only `disabled:opacity-XX` patterns are touched. Plain `opacity-50` (without
the `disabled:` prefix) is preserved — that's a different concept.

USAGE
  python3 fix_opacity_normalize.py <file.js>          # writes in place
  python3 fix_opacity_normalize.py --dry <file.js>    # preview only
  python3 fix_opacity_normalize.py src/tools/*.js     # batch

Exit codes
  0 — file processed (changes written or no-op)
  1 — file unreadable
"""

import sys
import re
import argparse

PATTERN = re.compile(r'\bdisabled:opacity-(\d+)\b')


def process_file(path, dry_run):
    try:
        with open(path) as f:
            content = f.read()
    except OSError as e:
        print(f'{path}: ERROR: {e}', file=sys.stderr)
        return 1

    matches = []
    for m in PATTERN.finditer(content):
        if m.group(1) != '40':
            line = content[:m.start()].count('\n') + 1
            matches.append((line, m.group(0)))

    if not matches:
        print(f'{path}: clean (0 non-canonical disabled:opacity values)')
        return 0

    print(f'{path}: normalizing {len(matches)} disabled:opacity value(s):')
    for ln, val in matches:
        print(f'  line {ln}: {val} → disabled:opacity-40')

    if dry_run:
        return 0

    new_content = PATTERN.sub('disabled:opacity-40', content)

    with open(path, 'w') as f:
        f.write(new_content)

    print(f'{path}: written. Re-audit to confirm.')
    return 0


def main():
    p = argparse.ArgumentParser(description=__doc__.split('\n', 1)[0])
    p.add_argument('files', nargs='+', help='one or more .js files')
    p.add_argument('--dry', action='store_true', help='preview only — no writes')
    args = p.parse_args()

    rc = 0
    for path in args.files:
        rc |= process_file(path, args.dry)
    sys.exit(rc)


if __name__ == '__main__':
    main()
