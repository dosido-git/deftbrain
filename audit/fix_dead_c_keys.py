#!/usr/bin/env python3
"""
fix_dead_c_keys.py — remove unused c-block keys from a DeftBrain tool file.

Mirrors audit_v2-3-2.py S1.1k. A key is "dead" if it appears in the c block
but has no `c.keyname` reference outside the c block AND isn't in the
convention-mandated whitelist (REQUIRED_KEYS + 'required', 'textMuteded',
'label', 'labelText', 'accentTxt').

SAFETY
- Bails (no changes) if the file uses `c[expr]` dynamic access — the canonical
  S1.1j colorKey-indirection pattern. Any key could be referenced via the
  computed lookup; static analysis can't tell which.
- Idempotent: running twice produces no further changes.
- ALWAYS re-audit after running. The script is mechanical; the audit is the
  gate.

USAGE
  python3 fix_dead_c_keys.py <file.js>          # writes in place
  python3 fix_dead_c_keys.py --dry <file.js>    # preview only
  python3 fix_dead_c_keys.py src/tools/*.js     # batch — runs each file

Exit codes
  0 — file processed (changes written or no-op)
  1 — file unreadable / no c block found / unparseable
"""

import sys
import re
import argparse

# Mirror audit_v2-3-2.py whitelist.
REQUIRED_KEYS = {
    'card', 'cardAlt', 'text', 'textSecondary', 'textMuted',
    'border', 'input', 'btnPrimary', 'btnSecondary',
    'success', 'warning', 'danger',
}
CONVENTION_KEYS = REQUIRED_KEYS | {
    'required', 'textMuteded', 'label', 'labelText', 'accentTxt',
}


def find_c_block(content):
    """Return (start_idx, end_idx, block_text) or (None, None, None).

    end_idx is the position immediately after the closing semicolon.
    """
    c_start = content.find('const c = {')
    if c_start == -1:
        return None, None, None
    depth = 0
    for i, ch in enumerate(content[c_start:], c_start):
        if ch == '{':
            depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0:
                # Walk forward to the closing semicolon.
                j = i + 1
                while j < len(content) and content[j] != ';':
                    j += 1
                return c_start, j + 1, content[c_start:j + 1]
    return None, None, None


def extract_keys(c_block):
    """Return set of top-level key names defined in the c block.

    Matches `keyname:` at the start of a line (after indent). Skips lines
    starting with `//` (comments) and `[` (computed keys, none in DeftBrain).
    """
    return set(
        re.findall(r'(?m)^\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*:', c_block)
    )


def strip_comments(s):
    """Strip JS line comments and block comments. Crude — adequate for the
    narrow purpose of removing comment-only `c[...]` mentions before the
    dynamic-access check. Does not handle strings containing `//` or `/*`."""
    s = re.sub(r'/\*.*?\*/', '', s, flags=re.DOTALL)
    s = re.sub(r'//[^\n]*', '', s)
    return s


def has_dynamic_access(content_no_cblock):
    """True if the file uses `c[expr]` indirection.

    Strips comments first so that comments mentioning `c[...]` (e.g. the
    workaround note we leave next to `resistanceClass` helpers) don't trip
    the bail. Matches `c[` with a word boundary before — catches `c[k]`,
    `c[someVar]`, `c[obj.colorKey]`. Does not match `c.foo[0]`.
    """
    return bool(re.search(r'\bc\[', strip_comments(content_no_cblock)))


def find_dead_keys(content):
    """Return (dead_set, c_start, c_end, c_block) or (None, ...) on bail.

    dead_set is None when the file should be skipped (no c block or dynamic
    access). Empty set means file is clean.
    """
    c_start, c_end, c_block = find_c_block(content)
    if c_block is None:
        return None, None, None, None

    content_no_cblock = content[:c_start] + content[c_end:]

    if has_dynamic_access(content_no_cblock):
        return None, c_start, c_end, c_block

    used = set(re.findall(
        r'\bc\.([a-zA-Z][a-zA-Z0-9_]*)\b',
        content_no_cblock,
    ))
    defined = extract_keys(c_block)
    dead = defined - used - CONVENTION_KEYS
    return dead, c_start, c_end, c_block


def strip_keys(c_block, keys):
    """Return c_block with each key's full line removed."""
    new_block = c_block
    for k in sorted(keys):
        new_block = re.sub(
            rf'(?m)^\s+{re.escape(k)}\s*:[^\n]*\n',
            '',
            new_block,
        )
    return new_block


def process_file(path, dry_run):
    try:
        with open(path) as f:
            content = f.read()
    except OSError as e:
        print(f'{path}: ERROR: {e}', file=sys.stderr)
        return 1

    dead, c_start, c_end, c_block = find_dead_keys(content)

    if dead is None and c_block is None:
        print(f'{path}: no c block — skipping', file=sys.stderr)
        return 1

    if dead is None:
        print(
            f'{path}: SKIP — uses c[expr] dynamic access '
            f'(S1.1j colorKey indirection); manual review required',
            file=sys.stderr,
        )
        return 0

    if not dead:
        print(f'{path}: clean (0 dead keys)')
        return 0

    print(f'{path}: {len(dead)} dead key(s): {sorted(dead)}')

    if dry_run:
        return 0

    new_block = strip_keys(c_block, dead)
    new_content = content[:c_start] + new_block + content[c_end:]

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
