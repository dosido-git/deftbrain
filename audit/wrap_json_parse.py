#!/usr/bin/env python3
# wrap_json_parse.py
# v1.0 · 2026-05-04 · mechanical patcher for Tier A backend audit issue
#                     "JSON.parse not wrapped in cleanJsonResponse" surfaced
#                     by backend_audit_v1.py. Wraps every bare JSON.parse(...)
#                     call in cleanJsonResponse(...) to prevent intermittent
#                     crashes when Anthropic's models wrap output in markdown
#                     code fences.
#
# Usage:
#   python3 wrap_json_parse.py backend/routes/foo.js               # patch in place
#   python3 wrap_json_parse.py --dry-run backend/routes/*.js       # preview only
#   python3 wrap_json_parse.py --no-backup backend/routes/*.js     # skip .bak files
#
# Exit code: 0 if all files processed successfully, 1 if any file errored.
#
# What it does:
#   1. Find every `JSON.parse(<arg>)` call respecting parens/strings/comments
#   2. Skip if already wrapped (`JSON.parse(cleanJsonResponse(...))`)
#   3. Otherwise rewrite as `JSON.parse(cleanJsonResponse(<arg>))`
#   4. If `cleanJsonResponse` is not in the require destructure, add it
#   5. Write `.bak` backup (unless --no-backup), then overwrite original
#
# Why brace-aware:
#   `JSON.parse` arguments can contain nested function calls, ternaries,
#   optional chaining, etc. — `JSON.parse(msg.content.find(b => b.type ===
#   'text')?.text || '')` has 4 nested parens. A naive regex would either
#   stop at the first `)` (corrupting the rewrite) or greedily span across
#   call boundaries (corrupting different code). The brace walker handles
#   this correctly and also respects string literals and comments.
#
# Idempotent:
#   Safe to re-run. Already-wrapped calls are detected by checking if the
#   argument starts with `cleanJsonResponse(` and skipped.
#
# Limitations:
#   - Template literal interpolation `${...}` inside string literals is
#     treated as opaque string content. JSON.parse arguments containing
#     template literals are vanishingly rare in route files (you'd be
#     parsing a constructed string), so this is not a practical issue.
#   - Files with no `require('../lib/claude')` line will get `cleanJsonResponse`
#     added to a NEW require statement near the top.

import os, re, sys
import shutil

# ────────────────────────────────────────────────────────────────────────────
# Brace-aware paren matcher
# ────────────────────────────────────────────────────────────────────────────

def find_matching_paren(s, open_pos):
    """Given position of '(' in s, return position of the matching ')'.
    Returns None if no match found. Respects nested parens, single/double/
    backtick strings, line comments, and block comments. Does not deeply
    parse template literal interpolations — treats them as opaque content.
    """
    if open_pos >= len(s) or s[open_pos] != '(':
        return None

    depth = 0
    i = open_pos
    in_string = None  # ' or " or `

    while i < len(s):
        ch = s[i]

        if in_string:
            if ch == '\\' and i + 1 < len(s):
                i += 2  # skip escaped char
                continue
            if ch == in_string:
                in_string = None
            i += 1
            continue

        # Skip comments BEFORE checking for string starts
        if ch == '/' and i + 1 < len(s):
            if s[i + 1] == '/':
                # Line comment — skip to newline
                end = s.find('\n', i)
                i = end if end != -1 else len(s)
                continue
            if s[i + 1] == '*':
                # Block comment — skip to */
                end = s.find('*/', i + 2)
                i = (end + 2) if end != -1 else len(s)
                continue

        # String start
        if ch in ('"', "'", '`'):
            in_string = ch
            i += 1
            continue

        # Paren tracking
        if ch == '(':
            depth += 1
        elif ch == ')':
            depth -= 1
            if depth == 0:
                return i

        i += 1

    return None


# ────────────────────────────────────────────────────────────────────────────
# Wrapping logic
# ────────────────────────────────────────────────────────────────────────────

JSON_PARSE_RE = re.compile(r'\bJSON\.parse\s*\(')


def _next_code_position(content, pos):
    """Advance from `pos` through any string literal or comment that starts
    at `pos`, returning the position where code resumes. If `pos` is already
    in code, returns `pos` unchanged. This lets the JSON.parse scanner skip
    over occurrences embedded in strings/comments at the top level.
    """
    if pos >= len(content):
        return pos
    ch = content[pos]

    # Line comment
    if ch == '/' and pos + 1 < len(content) and content[pos + 1] == '/':
        end = content.find('\n', pos)
        return end if end != -1 else len(content)

    # Block comment
    if ch == '/' and pos + 1 < len(content) and content[pos + 1] == '*':
        end = content.find('*/', pos + 2)
        return (end + 2) if end != -1 else len(content)

    # String literals — single, double, backtick. Walk through respecting escapes.
    if ch in ('"', "'", '`'):
        quote = ch
        i = pos + 1
        while i < len(content):
            c = content[i]
            if c == '\\' and i + 1 < len(content):
                i += 2
                continue
            if c == quote:
                return i + 1
            i += 1
        return len(content)

    return pos


def _find_json_parse_in_code(content, start):
    """Find next `JSON.parse(` occurrence at or after `start` that is in code
    (not inside a string or comment). Returns (start_index, end_index) where
    end_index points just past the opening `(`. Returns None if no match.
    """
    pos = start
    while pos < len(content):
        # Skip any string/comment that starts here
        new_pos = _next_code_position(content, pos)
        if new_pos != pos:
            pos = new_pos
            continue

        # In code — try to match JSON.parse( starting at pos
        m = JSON_PARSE_RE.match(content, pos)
        if m:
            return (m.start(), m.end())

        pos += 1

    return None


def wrap_json_parses(content):
    """Walk the content, wrapping every bare JSON.parse(<arg>) in
    cleanJsonResponse. Returns (new_content, num_wrapped, num_skipped).
    """
    result = []
    pos = 0
    wrapped = 0
    skipped_already_wrapped = 0

    while pos < len(content):
        match = _find_json_parse_in_code(content, pos)
        if not match:
            result.append(content[pos:])
            break

        match_start, match_end = match

        # Append everything before this match
        result.append(content[pos:match_start])

        # The '(' is at match_end - 1
        open_paren_pos = match_end - 1
        close_paren_pos = find_matching_paren(content, open_paren_pos)

        if close_paren_pos is None:
            # Malformed — append the rest as-is and bail
            result.append(content[match_start:])
            break

        # Extract the argument (without the surrounding parens)
        arg_text = content[open_paren_pos + 1:close_paren_pos]
        arg_stripped = arg_text.strip()

        # Already wrapped? (handles whitespace and possible parenthesized form)
        if arg_stripped.startswith('cleanJsonResponse(') or arg_stripped.startswith('cleanJsonResponse ('):
            # Already wrapped — copy as-is
            result.append(content[match_start:close_paren_pos + 1])
            skipped_already_wrapped += 1
        else:
            # Wrap it. Preserve the original argument text exactly (including
            # any leading/trailing whitespace) inside the new wrapper.
            result.append(f'JSON.parse(cleanJsonResponse({arg_text}))')
            wrapped += 1

        pos = close_paren_pos + 1

    return ''.join(result), wrapped, skipped_already_wrapped


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
    a new require line near the top.

    Returns (new_content, was_changed).
    """
    match = CLAUDE_REQUIRE_RE.search(content)
    if match:
        names_raw = match.group(1)
        names = [n.strip() for n in names_raw.split(',') if n.strip()]
        if 'cleanJsonResponse' in names:
            return content, False
        # Add it. Preserve original formatting style by appending to the
        # end of the destructure list, alphabetized loosely (after the
        # last existing name, which is what most files do anyway).
        names.append('cleanJsonResponse')
        new_destructure = ', '.join(names)
        new_require = f"const {{ {new_destructure} }} = require('../lib/claude');"
        new_content = content[:match.start()] + new_require + content[match.end():]
        return new_content, True

    # No existing claude require — insert a new one. Find the last require()
    # line in the first 50 lines and insert after it. Failing that, insert
    # at the very top.
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
# Per-file processing
# ────────────────────────────────────────────────────────────────────────────

def process_file(filepath, dry_run=False, make_backup=True):
    """Process one file. Returns dict with statistics:
    {file, wrapped, skipped, import_added, error}."""
    stats = {
        'file': filepath,
        'wrapped': 0,
        'skipped_already_wrapped': 0,
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

    new_content, wrapped, skipped = wrap_json_parses(original)
    stats['wrapped'] = wrapped
    stats['skipped_already_wrapped'] = skipped

    if wrapped > 0:
        # We added cleanJsonResponse() calls — make sure it's imported
        new_content, import_added = ensure_clean_json_response_imported(new_content)
        stats['import_added'] = import_added

    stats['changed'] = (new_content != original)

    if stats['changed'] and not dry_run:
        try:
            if make_backup:
                shutil.copy2(filepath, filepath + '.bak')
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
        except Exception as e:
            stats['error'] = f'write failed: {e}'

    return stats


# ────────────────────────────────────────────────────────────────────────────
# Main
# ────────────────────────────────────────────────────────────────────────────

def main(argv):
    args = argv[1:]
    dry_run = False
    make_backup = True
    filepaths = []

    for a in args:
        if a == '--dry-run':
            dry_run = True
        elif a == '--no-backup':
            make_backup = False
        elif a in ('-h', '--help'):
            print(__doc__ or 'See header for usage.', file=sys.stderr)
            return 0
        else:
            # Glob expansion (Windows shells don't expand)
            import glob
            expanded = glob.glob(a) if ('*' in a or '?' in a) else [a]
            if not expanded:
                print(f'⚠️  no files match {a}', file=sys.stderr)
                continue
            filepaths.extend(expanded)

    if not filepaths:
        print('Usage: python3 wrap_json_parse.py [--dry-run] [--no-backup] <file.js> [more...]', file=sys.stderr)
        return 2

    all_stats = []
    for fp in filepaths:
        if not os.path.isfile(fp):
            print(f'⚠️  not a file: {fp}', file=sys.stderr)
            continue
        all_stats.append(process_file(fp, dry_run=dry_run, make_backup=make_backup))

    # Report
    total_wrapped = 0
    total_changed_files = 0
    errors = 0

    print(f"\n{'=' * 60}")
    if dry_run:
        print('DRY RUN — no files modified')
        print(f"{'=' * 60}")

    for s in all_stats:
        name = os.path.basename(s['file'])
        if s['error']:
            print(f"❌ {name} — {s['error']}")
            errors += 1
            continue
        if s['changed']:
            total_changed_files += 1
            total_wrapped += s['wrapped']
            tag = '[would change]' if dry_run else '[changed]'
            extras = []
            if s['import_added']:
                extras.append('+ import added')
            if s['skipped_already_wrapped']:
                extras.append(f'{s["skipped_already_wrapped"]} already-wrapped skipped')
            extra_str = (' · ' + ', '.join(extras)) if extras else ''
            print(f"  {tag} {name} — wrapped {s['wrapped']} call(s){extra_str}")
        elif s['skipped_already_wrapped']:
            # File has JSON.parse but all already wrapped
            pass  # silent — it's the steady state
        # else: file has no JSON.parse calls — silent

    print(f"\n{'=' * 60}")
    print(f"Files {'would be ' if dry_run else ''}changed: {total_changed_files}")
    print(f"Total JSON.parse calls {'would be ' if dry_run else ''}wrapped: {total_wrapped}")
    if errors:
        print(f"Errors: {errors}")

    return 1 if errors > 0 else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv))
