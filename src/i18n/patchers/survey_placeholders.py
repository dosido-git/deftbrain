#!/usr/bin/env python3
"""
survey_placeholders.py
─────────────────────────────────────────────────────────────────
Inventory every literal placeholder= attribute across the catalog
so we know which strings deserve translation keys.

Skips placeholder={...} (already dynamic — out of scope for this sweep).

Usage:
  python3 survey_placeholders.py src/tools/
  python3 survey_placeholders.py --csv src/tools/ > placeholders.csv
  python3 survey_placeholders.py --min 2 src/tools/   # only show ≥2 occurrences
"""
import argparse
import csv
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

# Match placeholder="..." or placeholder='...'
# Captures the quote and the literal text. Skips placeholder={...}.
PLACEHOLDER_RE = re.compile(r'''placeholder=(?P<q>["'])(?P<text>(?:(?!(?P=q)).)*)(?P=q)''')


def scan_file(path):
    """Yield (literal, line_number) for every static placeholder in the file."""
    src = path.read_text(encoding='utf-8', errors='replace')
    for m in PLACEHOLDER_RE.finditer(src):
        text = m.group('text')
        # Compute line number
        line_num = src[:m.start()].count('\n') + 1
        yield text, line_num


def main():
    p = argparse.ArgumentParser(description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument('paths', nargs='+', help='Files or directories to scan')
    p.add_argument('--csv', action='store_true', help='CSV output')
    p.add_argument('--min', type=int, default=1,
                   help='Minimum frequency to include (default 1)')
    p.add_argument('--locations', action='store_true',
                   help='Show file:line for each occurrence')
    args = p.parse_args()

    targets = []
    for path_arg in args.paths:
        path = Path(path_arg)
        if path.is_dir():
            targets.extend(sorted(path.glob('*.js')))
        elif path.is_file():
            targets.append(path)

    counter = Counter()
    locations = defaultdict(list)  # literal → [(file, line), ...]
    for path in targets:
        for literal, line in scan_file(path):
            counter[literal] += 1
            locations[literal].append((path.name, line))

    # Frequency-ranked, then alphabetical
    sorted_items = sorted(counter.items(), key=lambda x: (-x[1], x[0].lower()))
    sorted_items = [(lit, n) for lit, n in sorted_items if n >= args.min]

    if args.csv:
        w = csv.writer(sys.stdout)
        w.writerow(['count', 'placeholder', 'sample_file', 'sample_line'])
        for lit, n in sorted_items:
            sample_file, sample_line = locations[lit][0]
            w.writerow([n, lit, sample_file, sample_line])
        return

    # Plain text output
    print(f'\nScanned {len(targets)} files. {len(counter)} distinct placeholders found.\n')
    print(f"{'count':>6}  placeholder")
    print('─' * 72)
    for lit, n in sorted_items:
        # Truncate very long literals for the table
        display = lit if len(lit) <= 60 else lit[:57] + '…'
        print(f'{n:>6}  {display!r}')
        if args.locations:
            for fname, line in locations[lit]:
                print(f'{"":>6}  └─ {fname}:{line}')

    if args.min > 1:
        suppressed = sum(1 for _, n in counter.items() if n < args.min)
        if suppressed:
            print(f'\n({suppressed} placeholders suppressed — count < {args.min})')

    # Quick stats
    total_occurrences = sum(counter.values())
    singleton_count = sum(1 for n in counter.values() if n == 1)
    print(f'\nTotal placeholder occurrences: {total_occurrences}')
    print(f'Distinct strings:              {len(counter)}')
    print(f'Singletons (one occurrence):   {singleton_count}')


if __name__ == '__main__':
    main()
