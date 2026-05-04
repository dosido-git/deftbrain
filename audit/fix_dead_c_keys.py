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


def strip_keys(c_block, keys):
    """Return c_block with each key's full entry removed.

    Handles both single-line and multi-line ternary entries. A multi-line
    entry has the key on one line and one or more continuation lines
    starting with `: '...'` (the false branch of a multi-line ternary).
    """
    new_block = c_block
    for k in sorted(keys):
        # Match line starting with `key:` plus zero-or-more continuation
        # lines (continuation = whitespace + ':' + anything, no key prefix).
        new_block = re.sub(
            rf'(?m)^\s+{re.escape(k)}\s*:[^\n]*\n(?:\s+:[^\n]*\n)*',
            '',
            new_block,
        )
    return new_block


def repair_orphans(c_block):
    """Remove orphan continuation lines left over from prior buggy runs.

    An orphan is a line starting with whitespace + `:` whose previous
    non-empty line already ended with a comma — meaning a complete entry
    has terminated and the `:` line cannot be a valid ternary continuation.

    Runs on every invocation so prior damage from the v1 single-line regex
    gets cleaned up automatically. Idempotent.
    """
    lines = c_block.split('\n')
    out = []
    prev_terminates = False
    for line in lines:
        stripped = line.strip()
        is_orphan = (
            prev_terminates
            and bool(re.match(r'^\s+:', line))
            and bool(stripped)
        )
        if is_orphan:
            continue
        out.append(line)
        if stripped:
            prev_terminates = stripped.endswith(',')
    return '\n'.join(out)


def process_file(path, dry_run):
    try:
        with open(path) as f:
            content = f.read()
    except OSError as e:
        print(f'{path}: ERROR: {e}', file=sys.stderr)
        return 1

    # Step 1: locate c block
    c_start, c_end, c_block = find_c_block(content)
    if c_block is None:
        print(f'{path}: no c block — skipping', file=sys.stderr)
        return 1

    # Step 2: repair any orphan continuation lines from prior buggy runs.
    # Idempotent — if there are no orphans, c_block is unchanged.
    repaired_block = repair_orphans(c_block)
    repair_changed = repaired_block != c_block
    if repair_changed:
        n_orphans = c_block.count('\n') - repaired_block.count('\n')
        print(f'{path}: REPAIR — removed {n_orphans} orphan continuation line(s)')

    # Step 3: dead-key analysis on the repaired block
    content_for_analysis = content[:c_start] + repaired_block + content[c_end:]
    new_c_start, new_c_end, _ = find_c_block(content_for_analysis)
    content_no_cblock = content_for_analysis[:new_c_start] + content_for_analysis[new_c_end:]

    if has_dynamic_access(content_no_cblock):
        if repair_changed and not dry_run:
            with open(path, 'w') as f:
                f.write(content_for_analysis)
            print(f'{path}: written (repair only — dynamic access prevents key removal)')
        else:
            print(
                f'{path}: SKIP key removal — uses c[expr] dynamic access '
                f'(S1.1j colorKey indirection); manual review required',
                file=sys.stderr,
            )
        return 0

    used = set(re.findall(
        r'\bc\.([a-zA-Z][a-zA-Z0-9_]*)\b',
        content_no_cblock,
    ))
    defined = extract_keys(repaired_block)
    dead = defined - used - CONVENTION_KEYS

    if not dead and not repair_changed:
        print(f'{path}: clean (0 dead keys, 0 orphans)')
        return 0

    if dead:
        print(f'{path}: {len(dead)} dead key(s): {sorted(dead)}')

    if dry_run:
        return 0

    final_block = strip_keys(repaired_block, dead) if dead else repaired_block
    new_content = content[:c_start] + final_block + content[c_end:]

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
