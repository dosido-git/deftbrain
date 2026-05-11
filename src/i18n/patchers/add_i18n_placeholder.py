#!/usr/bin/env python3
"""
add_i18n_placeholder.py
─────────────────────────────────────────────────────────────────────
Catalog sweep patcher: swap hardcoded English placeholders for t() calls.

Narrow-match strategy (Step 1 of i18n catalog sweep):
  Only swaps placeholders whose literal text exactly matches one of the
  3 generic prompts in the en bundle. Tool-specific placeholders
  ('Paste your contract...', 'What's the gift situation?...') are left
  alone — they need their own keys in a follow-up sweep.

Matched literals → keys (must match en bundle exactly):
  "Describe your situation..."   → t('describe_situation')
  "Describe your problem..."     → t('describe_problem')
  "What's going on?"             → t('whats_going_on')

For each matching tool file, the patcher:
  1. Skips if file already imports useTranslation (idempotent)
  2. Replaces the literal with t('key') in the placeholder= attribute
  3. Adds `import { useTranslation } from '../i18n/useTranslation';`
     after the last existing import line
  4. Adds `const { t } = useTranslation();` inside the default export
     function, immediately after the first useTheme() call (or first
     hook call if useTheme isn't present)

Skipped (logged, no change):
  - Files with no matching placeholder literal
  - Files that already import useTranslation
  - Files where insertion points can't be found (logged loudly)

Usage:
  python3 add_i18n_placeholder.py <file_or_dir> [<file_or_dir> ...]
  python3 add_i18n_placeholder.py --dry-run src/tools/
  python3 add_i18n_placeholder.py --verbose src/tools/SafeWalk.js
"""
import argparse
import re
import sys
from pathlib import Path

# ── Match table ──────────────────────────────────────────────────────
# Placeholder literal → translation key
# Order matters: longer/more specific patterns first (none here, but if
# you add 'describe' as a prefix later, put it after the full strings).
LITERAL_TO_KEY = [
    ('Describe your situation...', 'describe_situation'),
    ('Describe your problem...',   'describe_problem'),
    ("What's going on?",           'whats_going_on'),
]

IMPORT_LINE = "import { useTranslation } from '../i18n/useTranslation';"
HOOK_LINE   = "  const { t } = useTranslation();"


def already_patched(src):
    return 'useTranslation' in src


def replace_placeholders(src):
    """Returns (new_src, swap_count, swapped_keys)."""
    new_src = src
    swap_count = 0
    swapped_keys = []
    for literal, key in LITERAL_TO_KEY:
        # Match placeholder="<literal>" or placeholder='<literal>'
        # (JSX expression placeholders like placeholder={...} are NOT
        # matched — they're already dynamic and warrant manual review.)
        for quote in ('"', "'"):
            pat = f'placeholder={quote}{re.escape(literal)}{quote}'
            repl = f"placeholder={{t('{key}')}}"
            count_before = new_src.count(pat[:30])
            new_src, n = re.subn(pat, repl, new_src)
            if n > 0:
                swap_count += n
                swapped_keys.append((key, n))
    return new_src, swap_count, swapped_keys


def add_import(src):
    """Insert IMPORT_LINE after the last top-level import statement."""
    lines = src.split('\n')
    last_import_idx = -1
    for i, line in enumerate(lines):
        # Only top-level imports (no leading whitespace)
        if re.match(r'^import\b', line):
            last_import_idx = i
    if last_import_idx == -1:
        return None  # no imports found — bail loudly
    lines.insert(last_import_idx + 1, IMPORT_LINE)
    return '\n'.join(lines)


def add_hook_call(src):
    """
    Insert `const { t } = useTranslation();` inside the default export
    function. Anchor: line containing `useTheme(` — insert immediately
    after that line. Falls back to the first `useState` if no useTheme.
    """
    lines = src.split('\n')

    # First choice: after useTheme()
    for i, line in enumerate(lines):
        if 'useTheme(' in line and not line.strip().startswith('//'):
            # Insert after this line, preserving the original indent
            indent_match = re.match(r'^(\s*)', line)
            indent = indent_match.group(1) if indent_match else '  '
            lines.insert(i + 1, f"{indent}const {{ t }} = useTranslation();")
            return '\n'.join(lines), 'after useTheme'

    # Second choice: before the first useState (so t is available everywhere)
    for i, line in enumerate(lines):
        if re.search(r'\buseState\b', line) and not line.strip().startswith('//'):
            indent_match = re.match(r'^(\s*)', line)
            indent = indent_match.group(1) if indent_match else '  '
            lines.insert(i, f"{indent}const {{ t }} = useTranslation();")
            return '\n'.join(lines), 'before useState'

    return None, None  # no anchor found — bail


def patch_file(path, dry_run=False, verbose=False):
    """Returns dict with keys: status, file, swaps, anchor, error."""
    src = path.read_text(encoding='utf-8')

    if already_patched(src):
        return {'status': 'skip-already-patched', 'file': str(path)}

    new_src, swap_count, swapped = replace_placeholders(src)
    if swap_count == 0:
        return {'status': 'skip-no-match', 'file': str(path)}

    new_src_with_import = add_import(new_src)
    if new_src_with_import is None:
        return {'status': 'fail-no-import-anchor', 'file': str(path)}

    final_src, anchor = add_hook_call(new_src_with_import)
    if final_src is None:
        return {'status': 'fail-no-hook-anchor', 'file': str(path)}

    if not dry_run:
        path.write_text(final_src, encoding='utf-8')

    return {
        'status': 'patched' if not dry_run else 'would-patch',
        'file': str(path),
        'swaps': swapped,
        'anchor': anchor,
    }


def main():
    p = argparse.ArgumentParser(description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument('paths', nargs='+', help='Files or directories to patch')
    p.add_argument('--dry-run', action='store_true', help='Preview only')
    p.add_argument('--verbose', action='store_true', help='Per-file output')
    args = p.parse_args()

    targets = []
    for path_arg in args.paths:
        path = Path(path_arg)
        if path.is_dir():
            targets.extend(sorted(path.glob('*.js')))
        elif path.is_file():
            targets.append(path)
        else:
            print(f'NOT FOUND: {path}', file=sys.stderr)

    counts = {'patched': 0, 'would-patch': 0, 'skip-already-patched': 0,
              'skip-no-match': 0, 'fail-no-import-anchor': 0,
              'fail-no-hook-anchor': 0}

    for target in targets:
        result = patch_file(target, dry_run=args.dry_run, verbose=args.verbose)
        counts[result['status']] = counts.get(result['status'], 0) + 1
        if args.verbose or result['status'].startswith('fail'):
            swaps_str = ''
            if 'swaps' in result:
                swaps_str = f"  swaps={dict(result['swaps'])}"
            anchor_str = f"  anchor='{result['anchor']}'" if result.get('anchor') else ''
            print(f"{result['status']:24}  {target.name}{swaps_str}{anchor_str}")

    print(f"\n{'─'*60}")
    print(f"Total files scanned:           {len(targets)}")
    for status, n in counts.items():
        if n > 0:
            label = status.replace('-', ' ').replace('_', ' ')
            print(f"  {label:30} {n}")
    if counts['fail-no-import-anchor'] + counts['fail-no-hook-anchor'] > 0:
        print('\n⚠️  Failures need manual review.')
        sys.exit(1)


if __name__ == '__main__':
    main()
