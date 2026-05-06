#!/usr/bin/env python3
# wrap_json_parse.py
# v1.1 · 2026-05-05 · adds peephole skip for the two-step idiom:
#                       const cleaned = cleanJsonResponse(text);
#                       const parsed  = JSON.parse(cleaned);
#                     This pattern is functionally equivalent to a wrapped
#                     parse — the cleaning has already happened. v1.0 would
#                     rewrite as JSON.parse(cleanJsonResponse(cleaned)),
#                     which is idempotent but stylistically noisy across
#                     the catalog (~131 sites). v1.1 detects bare-identifier
#                     args whose nearest prior assignment was a cleanJsonResponse
#                     call and leaves them alone.
#
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

def _skip_string_or_comment(s, pos):
    """If s[pos] starts a string literal or comment, return the position just
    past it. Otherwise return pos unchanged. Handles:
      - // line comments
      - /* block comments */
      - 'single' and "double" quoted strings with backslash escapes
      - `backtick` template literals INCLUDING ${...} interpolation
        (recursively skips nested strings/comments inside the ${} expression
        and tracks brace depth so nested objects don't false-close)

    This recursive design fixes the v1.0 bug where a backtick string
    containing nested templates like ${flag ? `inner` : 'fallback'} was
    incorrectly closed at the inner backtick, after which the scanner ran
    into phantom-string territory and silently skipped any JSON.parse calls
    in the rest of the file.
    """
    if pos >= len(s):
        return pos
    ch = s[pos]

    # Line comment
    if ch == '/' and pos + 1 < len(s) and s[pos + 1] == '/':
        end = s.find('\n', pos)
        return end if end != -1 else len(s)

    # Block comment
    if ch == '/' and pos + 1 < len(s) and s[pos + 1] == '*':
        end = s.find('*/', pos + 2)
        return (end + 2) if end != -1 else len(s)

    # Single/double quoted strings — no interpolation
    if ch in ('"', "'"):
        quote = ch
        i = pos + 1
        while i < len(s):
            c = s[i]
            if c == '\\' and i + 1 < len(s):
                i += 2
                continue
            if c == quote:
                return i + 1
            i += 1
        return len(s)

    # Backtick template literal — handle ${...} interpolation
    if ch == '`':
        i = pos + 1
        while i < len(s):
            c = s[i]
            if c == '\\' and i + 1 < len(s):
                i += 2
                continue
            if c == '`':
                return i + 1
            if c == '$' and i + 1 < len(s) and s[i + 1] == '{':
                # Enter ${...} expression. Walk it as code, tracking brace
                # depth and recursively skipping nested strings/comments.
                depth = 1
                j = i + 2
                while j < len(s) and depth > 0:
                    nj = _skip_string_or_comment(s, j)
                    if nj != j:
                        j = nj
                        continue
                    cj = s[j]
                    if cj == '{':
                        depth += 1
                    elif cj == '}':
                        depth -= 1
                        if depth == 0:
                            j += 1
                            break
                    j += 1
                i = j
                continue
            i += 1
        return len(s)

    return pos


def find_matching_paren(s, open_pos):
    """Given position of '(' in s, return position of the matching ')'.
    Returns None if no match found. Respects nested parens, single/double/
    backtick strings (with proper template-literal interpolation handling),
    and line/block comments.
    """
    if open_pos >= len(s) or s[open_pos] != '(':
        return None

    depth = 0
    i = open_pos
    while i < len(s):
        # Skip strings and comments first (including templates with ${...})
        new_i = _skip_string_or_comment(s, i)
        if new_i != i:
            i = new_i
            continue
        ch = s[i]
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

# Bare identifier pattern (allows $ and _ as JS does)
BARE_IDENT_RE = re.compile(r'^[A-Za-z_$][\w$]*$')

# Look-back window for the peephole. Most route handlers are < 40 lines
# of body, so this generously covers the dominant case without leaking
# across function boundaries in typical files.
CLEAN_VAR_LOOKBACK_LINES = 40


def _is_clean_var(arg_stripped, content, json_parse_pos):
    """Peephole: True if `arg_stripped` is a bare identifier whose most
    recent prior assignment in the file was `<name> = cleanJsonResponse(...)`.

    Catches the two-step idiom:
        const cleaned = cleanJsonResponse(text);
        const parsed  = JSON.parse(cleaned);   ← arg is bare `cleaned`

    Also tolerates intervening reassignments like
        cleaned = cleaned.replace(/.../, '...');
    because those preserve the cleanJsonResponse origin (they operate on
    the already-cleaned value).
    """
    if not BARE_IDENT_RE.match(arg_stripped):
        return False

    name = arg_stripped
    head = content[:json_parse_pos]
    lines = head.split('\n')
    window = lines[-CLEAN_VAR_LOOKBACK_LINES:] if len(lines) > CLEAN_VAR_LOOKBACK_LINES else lines

    # Match: optional declarator, the identifier, '=', cleanJsonResponse(...)
    # Word boundary prevents `notcleaned = cleanJsonResponse(...)` from matching `cleaned`.
    pattern = re.compile(
        rf'\b{re.escape(name)}\s*=\s*cleanJsonResponse\s*\('
    )
    for line in window:
        if pattern.search(line):
            return True
    return False


def _next_code_position(content, pos):
    """Advance from `pos` through any string literal or comment that starts
    at `pos`, returning the position where code resumes. If `pos` is already
    in code, returns `pos` unchanged. Delegates to _skip_string_or_comment
    so backtick template literals with `${...}` interpolation are handled
    correctly (v1.1 fix — see _skip_string_or_comment docstring).
    """
    return _skip_string_or_comment(content, pos)


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
    cleanJsonResponse. Returns (new_content, num_wrapped, num_skipped_already_wrapped,
    num_skipped_clean_var).
    """
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
        elif _is_clean_var(arg_stripped, content, match_start):
            # Two-step idiom — variable was assigned cleanJsonResponse(...) earlier.
            # Already safe; wrapping would just produce double-cleaning.
            result.append(content[match_start:close_paren_pos + 1])
            skipped_clean_var += 1
        else:
            # Wrap it. Preserve the original argument text exactly (including
            # any leading/trailing whitespace) inside the new wrapper.
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
    total_skipped_clean_var = 0
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
        total_skipped_clean_var += s['skipped_clean_var']
        if s['changed']:
            total_changed_files += 1
            total_wrapped += s['wrapped']
            tag = '[would change]' if dry_run else '[changed]'
            extras = []
            if s['import_added']:
                extras.append('+ import added')
            if s['skipped_already_wrapped']:
                extras.append(f'{s["skipped_already_wrapped"]} already-wrapped skipped')
            if s['skipped_clean_var']:
                extras.append(f'{s["skipped_clean_var"]} clean-var skipped')
            extra_str = (' · ' + ', '.join(extras)) if extras else ''
            print(f"  {tag} {name} — wrapped {s['wrapped']} call(s){extra_str}")
        elif s['skipped_already_wrapped'] or s['skipped_clean_var']:
            # File has JSON.parse but all already safe
            pass  # silent — it's the steady state
        # else: file has no JSON.parse calls — silent

    print(f"\n{'=' * 60}")
    print(f"Files {'would be ' if dry_run else ''}changed: {total_changed_files}")
    print(f"Total JSON.parse calls {'would be ' if dry_run else ''}wrapped: {total_wrapped}")
    if total_skipped_clean_var:
        print(f"Skipped (already-clean two-step idiom): {total_skipped_clean_var}")
    if errors:
        print(f"Errors: {errors}")

    return 1 if errors > 0 else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv))
