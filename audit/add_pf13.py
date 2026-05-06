#!/usr/bin/env python3
"""add_pf13.py — Mechanical patcher for PF-13 violations.

PF-13 (CONVENTIONS.md): every <button> with `disabled={...loading...}` MUST
have `disabled:opacity-40` in its className. Strict — only that exact utility
is accepted; ternary alternatives like `${loading ? c.btnDis : ...}` are
rejected to keep disabled-state feedback consistent across the catalog.

What this patcher does:
  1. Find every <button> whose `disabled={...}` attribute references `loading`
     (case-insensitive).
  2. Walk into the className value (template literal in {}, or quoted string).
  3. If `disabled:opacity-40` is missing, insert it just before the closing
     backtick / quote.

The walker handles the same JSX edge cases the audit script does:
arrow functions inside attrs, nested ${...} interpolation in className
template literals, brace-depth tracking to find the real `>`.

Conservative: skips buttons whose className is in a non-template-literal,
non-quoted form (e.g. spread attributes, computed identifiers). Those go
to the manual queue.

Usage:
  python3 add_pf13.py --dry-run src/tools/Tool.js
  python3 add_pf13.py src/tools/Tool.js               # backup .bak then patch
  python3 add_pf13.py --no-backup src/tools/Tool.js
  python3 add_pf13.py src/tools/*.js                  # full catalog

Idempotent. Exit 0 if no errors; 1 if any file errored.

v1.0 · 2026-05-06 · promoted from inline patcher used during high-violation
                    file cleanup (RoomReader/PEP/TheFinalWord session).
"""
import os, re, sys

# Allow running from any directory by adjusting sys.path to find _helpers.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _helpers import run_per_file_cli, write_with_backup


# ────────────────────────────────────────────────────────────────────────────
# Per-button analysis
# ────────────────────────────────────────────────────────────────────────────

def _find_button_close(content, btn_start_after_tag):
    """From just after `<button`, find the position of the closing `>` of
    the opening tag, respecting `{...}` brace depth (so arrow functions in
    attrs don't fool us). Returns position or None."""
    depth = 0
    cap = min(len(content), btn_start_after_tag + 2000)
    i = btn_start_after_tag
    while i < cap:
        ch = content[i]
        if ch == '{':
            depth += 1
        elif ch == '}':
            depth -= 1
        elif ch == '>' and depth == 0:
            return i
        i += 1
    return None


def _find_classname_value_bounds(btn_open):
    """Within the opening tag text, locate the className value and return
    (kind, start_in_btn, end_in_btn) where:
      kind = 'tmpl' for template-literal in {`...`}
      kind = 'quot' for plain "..." or '...'
      kind = None  if className is in a form we don't patch (spread, ident, etc.)
    Positions are indexes within btn_open (not absolute file offsets)."""
    cn_eq = re.search(r'className=', btn_open)
    if not cn_eq:
        return (None, None, None)

    p = cn_eq.end()
    while p < len(btn_open) and btn_open[p] in ' \t':
        p += 1
    if p >= len(btn_open):
        return (None, None, None)

    # Form 1: className={`...`} — the only form we patch by template literal
    if btn_open[p] == '{':
        p += 1
        while p < len(btn_open) and btn_open[p] in ' \t':
            p += 1
        if p >= len(btn_open) or btn_open[p] != '`':
            # className={someVariable} or {`...` + foo} — too risky, skip
            return (None, None, None)
        sp = p + 1
        p += 1
        # Walk to matching backtick, skipping ${...} interpolations
        while p < len(btn_open):
            if btn_open[p] == '\\':
                p += 2
                continue
            if btn_open[p] == '`':
                return ('tmpl', sp, p)
            if btn_open[p] == '$' and p + 1 < len(btn_open) and btn_open[p+1] == '{':
                d = 1
                p += 2
                while p < len(btn_open) and d > 0:
                    if btn_open[p] == '{':
                        d += 1
                    elif btn_open[p] == '}':
                        d -= 1
                    p += 1
                continue
            p += 1
        return (None, None, None)  # unterminated

    # Form 2: className="..." or className='...'
    if btn_open[p] in '"\'':
        q = btn_open[p]
        sp = p + 1
        p += 1
        while p < len(btn_open) and btn_open[p] != q:
            p += 1
        if p >= len(btn_open):
            return (None, None, None)
        return ('quot', sp, p)

    return (None, None, None)


def patch_pf13(content):
    """Walk the content, patching all PF-13 violations.
    Returns (new_content, num_patched, num_skipped_irregular).
    """
    edits = []  # list of (insert_pos, text_to_insert)
    skipped = 0

    for m in re.finditer(r'<button\b', content):
        btn_open_end = _find_button_close(content, m.end())
        if btn_open_end is None:
            continue
        btn_open = content[m.start():btn_open_end]

        # Only patch buttons that disable on loading
        if not re.search(r'disabled=\{[^}]*[Ll]oading[^}]*\}', btn_open):
            continue

        kind, sp, ep = _find_classname_value_bounds(btn_open)
        if kind is None:
            skipped += 1
            continue

        cn_value = btn_open[sp:ep]
        if 'disabled:opacity-40' in cn_value:
            continue  # idempotent

        # Insert ' disabled:opacity-40' just before the closing ` or quote
        insert_pos = m.start() + ep
        edits.append((insert_pos, ' disabled:opacity-40'))

    # Apply edits in reverse so offsets remain valid
    new_content = content
    for pos, text in sorted(edits, reverse=True):
        new_content = new_content[:pos] + text + new_content[pos:]

    return new_content, len(edits), skipped


# ────────────────────────────────────────────────────────────────────────────
# Per-file processing (called by run_per_file_cli)
# ────────────────────────────────────────────────────────────────────────────

def process_file(filepath, dry_run=False, make_backup=True):
    stats = {
        'file': filepath,
        'patched': 0,
        'skipped_irregular': 0,
        'error': None,
        'changed': False,
    }

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            original = f.read()
    except Exception as e:
        stats['error'] = f'read failed: {e}'
        return stats

    new_content, patched, skipped = patch_pf13(original)
    stats['patched'] = patched
    stats['skipped_irregular'] = skipped
    stats['changed'] = (new_content != original)

    if stats['changed']:
        extras = []
        if skipped:
            extras.append(f'{skipped} irregular skipped')
        extra_str = (' · ' + ', '.join(extras)) if extras else ''
        stats['_report_line'] = f"patched {patched} button(s){extra_str}"

    if stats['changed'] and not dry_run:
        err = write_with_backup(filepath, new_content, make_backup=make_backup)
        if err:
            stats['error'] = err

    return stats


if __name__ == '__main__':
    sys.exit(run_per_file_cli(
        sys.argv,
        process_file,
        prog_name='add_pf13.py',
        summary_keys=[
            ('patched', 'Total buttons patched'),
            ('skipped_irregular', 'Skipped (irregular className form)'),
        ],
    ))
