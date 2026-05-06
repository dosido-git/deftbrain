#!/usr/bin/env python3
# wrap_json_parse.py
# v1.2 · 2026-05-06 · refactored to use shared _helpers.py for the brace
#                     walker and CLI runner. Behavior unchanged from v1.1.
# v1.1 · 2026-05-05 · adds peephole skip for the two-step idiom:
#                       const cleaned = cleanJsonResponse(text);
#                       const parsed  = JSON.parse(cleaned);
#                     Also fixed nested template-literal scanner bug where
#                     `${flag ? `inner` : 'fallback'}` would cause the scanner
#                     to close the outer backtick prematurely and skip
#                     downstream JSON.parse calls.
# v1.0 · 2026-05-04 · mechanical patcher for Tier A backend audit issue
#                     "JSON.parse not wrapped in cleanJsonResponse".
#
# Usage:
#   python3 wrap_json_parse.py backend/routes/foo.js               # patch in place
#   python3 wrap_json_parse.py --dry-run backend/routes/*.js       # preview only
#   python3 wrap_json_parse.py --no-backup backend/routes/*.js     # skip .bak files

import os, re, sys

# Allow running from any directory by adjusting sys.path to find _helpers.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _helpers import (
    find_matching_paren,
    skip_string_or_comment,
    run_per_file_cli,
    write_with_backup,
)


# ────────────────────────────────────────────────────────────────────────────
# Wrapping logic
# ────────────────────────────────────────────────────────────────────────────

JSON_PARSE_RE = re.compile(r'\bJSON\.parse\s*\(')

# Bare identifier pattern (allows $ and _ as JS does)
BARE_IDENT_RE = re.compile(r'^[A-Za-z_$][\w$]*$')

# Look-back window for the peephole. Most route handlers are < 40 lines
# of body, so this generously covers the dominant case without leaking
# across function boundaries in typical files.
CLEAN_VAR_LOOKBACK_LINES = 40


def _find_json_parse_in_code(content, start):
    """Find next `JSON.parse(` occurrence at or after `start` that is in code
    (not inside a string or comment). Returns (start_index, end_index) where
    end_index points just past the opening `(`. Returns None if no match.
    """
    pos = start
    while pos < len(content):
        new_pos = skip_string_or_comment(content, pos)
        if new_pos != pos:
            pos = new_pos
            continue
        m = JSON_PARSE_RE.match(content, pos)
        if m:
            return (m.start(), m.end())
        pos += 1
    return None


def _is_clean_var(arg_stripped, content, json_parse_pos):
    """Peephole: True if `arg_stripped` is a bare identifier whose most
    recent prior assignment in the file was `<name> = cleanJsonResponse(...)`.

    Catches the two-step idiom:
        const cleaned = cleanJsonResponse(text);
        const parsed  = JSON.parse(cleaned);   ← arg is bare `cleaned`
    """
    if not BARE_IDENT_RE.match(arg_stripped):
        return False

    name = arg_stripped
    head = content[:json_parse_pos]
    lines = head.split('\n')
    window = (
        lines[-CLEAN_VAR_LOOKBACK_LINES:]
        if len(lines) > CLEAN_VAR_LOOKBACK_LINES
        else lines
    )

    pattern = re.compile(
        rf'\b{re.escape(name)}\s*=\s*cleanJsonResponse\s*\('
    )
    for line in window:
        if pattern.search(line):
            return True
    return False


def wrap_json_parses(content):
    """Walk content, wrapping every bare JSON.parse(<arg>) in cleanJsonResponse.
    Returns (new_content, num_wrapped, num_skipped_already_wrapped,
    num_skipped_clean_var)."""
    result = []
    pos = 0
    wrapped = 0
    skipped_already_wrapped = 0
    skipped_clean_var = 0

    while pos < len(content):
        match = _find_json_parse_in_code(content, pos)
        if not match:
            result.append(content[pos:])
            break

        match_start, match_end = match
        result.append(content[pos:match_start])

        open_paren_pos = match_end - 1
        close_paren_pos = find_matching_paren(content, open_paren_pos)

        if close_paren_pos is None:
            result.append(content[match_start:])
            break

        arg_text = content[open_paren_pos + 1:close_paren_pos]
        arg_stripped = arg_text.strip()

        if (arg_stripped.startswith('cleanJsonResponse(')
                or arg_stripped.startswith('cleanJsonResponse (')):
            result.append(content[match_start:close_paren_pos + 1])
            skipped_already_wrapped += 1
        elif _is_clean_var(arg_stripped, content, match_start):
            result.append(content[match_start:close_paren_pos + 1])
            skipped_clean_var += 1
        else:
            result.append(f'JSON.parse(cleanJsonResponse({arg_text}))')
            wrapped += 1

        pos = close_paren_pos + 1

    return ''.join(result), wrapped, skipped_already_wrapped, skipped_clean_var


# ────────────────────────────────────────────────────────────────────────────
# Import injection
# ────────────────────────────────────────────────────────────────────────────

CLAUDE_REQUIRE_RE = re.compile(
    r"const\s*\{\s*([^}]+)\s*\}\s*=\s*require\(['\"]\.\./lib/claude['\"]\s*\)\s*;?",
    re.MULTILINE,
)


def ensure_clean_json_response_imported(content):
    """If cleanJsonResponse is not already imported from ../lib/claude,
    add it to the existing destructure. If no destructure exists, insert
    a new require line near the top. Returns (new_content, was_changed)."""
    match = CLAUDE_REQUIRE_RE.search(content)
    if match:
        names_raw = match.group(1)
        names = [n.strip() for n in names_raw.split(',') if n.strip()]
        if 'cleanJsonResponse' in names:
            return content, False
        names.append('cleanJsonResponse')
        new_destructure = ', '.join(names)
        new_require = f"const {{ {new_destructure} }} = require('../lib/claude');"
        new_content = content[:match.start()] + new_require + content[match.end():]
        return new_content, True

    lines = content.split('\n')
    head = lines[:50]
    last_require_idx = -1
    for i, line in enumerate(head):
        if re.search(r'\brequire\s*\(', line):
            last_require_idx = i
    new_line = "const { cleanJsonResponse } = require('../lib/claude');"
    if last_require_idx >= 0:
        lines.insert(last_require_idx + 1, new_line)
    else:
        lines.insert(0, new_line)
    return '\n'.join(lines), True


# ────────────────────────────────────────────────────────────────────────────
# Per-file processing (called by run_per_file_cli)
# ────────────────────────────────────────────────────────────────────────────

def process_file(filepath, dry_run=False, make_backup=True):
    stats = {
        'file': filepath,
        'wrapped': 0,
        'skipped_already_wrapped': 0,
        'skipped_clean_var': 0,
        'import_added': False,
        'error': None,
        'changed': False,
    }

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            original = f.read()
    except Exception as e:
        stats['error'] = f'read failed: {e}'
        return stats

    new_content, wrapped, skipped, skipped_clean = wrap_json_parses(original)
    stats['wrapped'] = wrapped
    stats['skipped_already_wrapped'] = skipped
    stats['skipped_clean_var'] = skipped_clean

    if wrapped > 0:
        new_content, import_added = ensure_clean_json_response_imported(new_content)
        stats['import_added'] = import_added

    stats['changed'] = (new_content != original)

    if stats['changed']:
        extras = []
        if stats['import_added']:
            extras.append('+ import added')
        if stats['skipped_already_wrapped']:
            extras.append(f'{stats["skipped_already_wrapped"]} already-wrapped skipped')
        if stats['skipped_clean_var']:
            extras.append(f'{stats["skipped_clean_var"]} clean-var skipped')
        extra_str = (' · ' + ', '.join(extras)) if extras else ''
        stats['_report_line'] = f"wrapped {stats['wrapped']} call(s){extra_str}"

    if stats['changed'] and not dry_run:
        err = write_with_backup(filepath, new_content, make_backup=make_backup)
        if err:
            stats['error'] = err

    return stats


if __name__ == '__main__':
    sys.exit(run_per_file_cli(
        sys.argv,
        process_file,
        prog_name='wrap_json_parse.py',
        summary_keys=[
            ('wrapped', 'Total JSON.parse calls wrapped'),
            ('skipped_clean_var', 'Skipped (already-clean two-step idiom)'),
        ],
    ))
