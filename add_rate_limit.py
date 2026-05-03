#!/usr/bin/env python3
"""
add_rate_limit.py — Catalog-wide patcher for backend route files missing
                    rateLimit() middleware.

Usage:
  python3 add_rate_limit.py <input_dir>                  # dry run
  python3 add_rate_limit.py <input_dir> <output_dir> --apply

Pattern (canonical, sourced from name-audit.js — session ~110 reference):
  1. Add `const { rateLimit } = require('../lib/rateLimiter');` to imports
     if missing. Inserted after the last existing top-of-file require().
  2. On every safe `router.post` / `router.get` declaration, inject
     `rateLimit()` as positional middleware between the path string and
     the handler function:

       router.post('/path', async (req, res) => {
         ↓
       router.post('/path', rateLimit(), async (req, res) => {

A "safe" route declaration is one where the second argument is directly
the handler — async arrow, async function, or bare identifier reference.
Routes that already have other middleware between path and handler are
NOT patched (would risk double-wrapping or wrong order); they go to the
manual queue.

File outcomes:
  - PATCHED              all routes transformed cleanly
  - PATCHED_PARTIAL      some routes patched, some irregular (queued)
  - ALREADY_OK           file already calls rateLimit() — no change
  - SKIPPED_NO_ROUTES    no router.post / router.get found
  - SKIPPED_IRREGULAR    every route uses an unsafe pattern — manual review
  - ERROR_NO_IMPORT_BLOCK  no top-level require() lines, can't add import
  - ERROR_IO             read failed

Safety: default mode is dry-run. With --apply, writes patched files to
<output_dir>. Originals are never modified in place.
"""
import os, re, sys, argparse
from collections import Counter

IMPORT_LINE = "const { rateLimit } = require('../lib/rateLimiter');"

# Match a route declaration where the SECOND argument is the handler directly
# (no middleware in between). We accept arrow functions, function declarations,
# and bare identifier references (function passed by name).
# Capture group 1 is the prefix up through the comma after the path string.
# Capture group 2 is the start of the handler.
ROUTE_RE = re.compile(
    r"""(router\.(?:post|get)\(\s*['"][^'"]+['"]\s*,\s*)"""  # router.post('/x', _
    r"""(async\s|function\s|\([^)]*\)\s*=>|[a-zA-Z_][a-zA-Z0-9_]*\s*\))""",  # handler start
    re.MULTILINE
)


def already_has_import(content):
    return ("require('../lib/rateLimiter')" in content
            or 'require("../lib/rateLimiter")' in content)


def find_import_insertion_point(content):
    """Position to insert the require line — just after the last top-of-file require()."""
    requires = list(re.finditer(r"^const\s+.*require\([^)]+\);", content, re.MULTILINE))
    if not requires:
        return None
    return requires[-1].end()


def patch_file(content):
    """Return (new_content, info_dict). info['status'] is the outcome label."""
    info = {
        'routes_total': 0,
        'routes_patched': 0,
        'import_added': False,
        'irregular_routes': [],
    }

    all_routes = list(re.finditer(r"router\.(?:post|get)\(", content))
    info['routes_total'] = len(all_routes)
    if info['routes_total'] == 0:
        info['status'] = 'SKIPPED_NO_ROUTES'
        return content, info

    if 'rateLimit()' in content or re.search(r'\brateLimit\s*\([^)]*\)', content):
        info['status'] = 'ALREADY_OK'
        return content, info

    new_content, n = ROUTE_RE.subn(r"\1rateLimit(), \2", content)
    info['routes_patched'] = n

    # Identify which paths weren't patched (irregular middleware ordering, etc.)
    if n < info['routes_total']:
        all_paths = re.findall(r"router\.(?:post|get)\(\s*(['\"][^'\"]+['\"])", content)
        patched_paths = re.findall(
            r"router\.(?:post|get)\(\s*(['\"][^'\"]+['\"])\s*,\s*rateLimit\(\)",
            new_content
        )
        unpatched = list((Counter(all_paths) - Counter(patched_paths)).elements())
        info['irregular_routes'] = unpatched

    if info['routes_patched'] == 0:
        info['status'] = 'SKIPPED_IRREGULAR'
        return content, info

    if not already_has_import(new_content):
        ins_pos = find_import_insertion_point(new_content)
        if ins_pos is None:
            info['status'] = 'ERROR_NO_IMPORT_BLOCK'
            return content, info
        new_content = new_content[:ins_pos] + "\n" + IMPORT_LINE + new_content[ins_pos:]
        info['import_added'] = True

    info['status'] = 'PATCHED' if n == info['routes_total'] else 'PATCHED_PARTIAL'
    return new_content, info


def main():
    ap = argparse.ArgumentParser(description='Add rateLimit() to backend route files')
    ap.add_argument('input_dir')
    ap.add_argument('output_dir', nargs='?')
    ap.add_argument('--apply', action='store_true',
                    help='Write patched files to output_dir (default: dry run)')
    args = ap.parse_args()

    if args.apply and not args.output_dir:
        ap.error('--apply requires output_dir')

    if args.apply:
        os.makedirs(args.output_dir, exist_ok=True)

    files = sorted(f for f in os.listdir(args.input_dir) if f.endswith('.js'))
    counts = {}
    manual_queue = []

    for fname in files:
        path = os.path.join(args.input_dir, fname)
        try:
            with open(path) as f:
                content = f.read()
        except Exception as e:
            print(f'  ERROR_IO            {fname}: {e}')
            counts['ERROR_IO'] = counts.get('ERROR_IO', 0) + 1
            continue

        new_content, info = patch_file(content)
        status = info['status']
        counts[status] = counts.get(status, 0) + 1

        if status in ('PATCHED', 'PATCHED_PARTIAL'):
            note = '+import' if info['import_added'] else 'import already present'
            print(f'  {status:18s} {fname}: '
                  f'{info["routes_patched"]}/{info["routes_total"]} routes ({note})')
            if info['irregular_routes']:
                print(f'                     irregular: {info["irregular_routes"]}')
                manual_queue.append((fname, info['irregular_routes']))
            if args.apply:
                with open(os.path.join(args.output_dir, fname), 'w') as f:
                    f.write(new_content)
        elif status == 'SKIPPED_IRREGULAR':
            print(f'  SKIPPED_IRREGULAR  {fname}: '
                  f'0/{info["routes_total"]} patched, all irregular')
            print(f'                     {info["irregular_routes"]}')
            manual_queue.append((fname, info['irregular_routes']))
        elif status == 'SKIPPED_NO_ROUTES':
            print(f'  SKIPPED_NO_ROUTES  {fname}')
        elif status == 'ERROR_NO_IMPORT_BLOCK':
            print(f'  ERROR_NO_IMPORTS   {fname}: no require() lines found')
            manual_queue.append((fname, ['no require() lines found']))
        # ALREADY_OK is silent — common case on re-runs

    print()
    print('═' * 60)
    print('SUMMARY')
    print('═' * 60)
    for status in ['PATCHED', 'PATCHED_PARTIAL', 'ALREADY_OK',
                   'SKIPPED_NO_ROUTES', 'SKIPPED_IRREGULAR',
                   'ERROR_NO_IMPORT_BLOCK', 'ERROR_IO']:
        if counts.get(status, 0) > 0:
            print(f'  {status:22s} {counts[status]}')
    print(f'  {"TOTAL":22s} {sum(counts.values())}')

    if manual_queue:
        print()
        print('MANUAL QUEUE — files needing human review:')
        for fname, items in manual_queue:
            print(f'  {fname}')
            for item in items:
                print(f'      {item}')

    if not args.apply:
        print()
        print('DRY RUN — no files written. Re-run with output_dir + --apply to write.')

    print()
    print('After applying, verify with:')
    print('  grep -L "rateLimit()" <output_dir>/*.js')
    print('  (any file listed = still uncovered, needs manual attention)')


if __name__ == '__main__':
    main()
