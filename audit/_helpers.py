"""
_helpers.py — Shared infrastructure for per-file mechanical patchers.

Provides:
  - skip_string_or_comment(s, pos): walk past a string or comment that starts
    at pos (handles nested ${...} interpolation in backtick template literals)
  - find_matching_paren(s, open_pos), find_matching_brace(s, open_pos)
  - run_per_file_cli(argv, process_file, prog_name): handles --dry-run,
    --no-backup, glob expansion, backup-then-write, and uniform reporting

Used by wrap_json_parse.py and add_pf19.py. add_rate_limit.py uses a
different (directory-based) model and does not consume this module.
"""
import os, sys, glob, shutil


# ────────────────────────────────────────────────────────────────────────────
# String/comment-aware brace walker
# ────────────────────────────────────────────────────────────────────────────

def skip_string_or_comment(s, pos):
    """If s[pos] starts a string literal or comment, return the position just
    past it. Otherwise return pos unchanged. Handles:
      - // line comments
      - /* block comments */
      - 'single' and "double" quoted strings with backslash escapes
      - `backtick` template literals INCLUDING ${...} interpolation
        (recursively skips nested strings/comments inside the ${} expression
        and tracks brace depth so nested objects don't false-close)

    The recursive design is necessary: a backtick string containing
    nested templates like `${flag ? `inner` : 'fallback'}` would otherwise
    be incorrectly closed at the inner backtick, after which the scanner
    enters phantom-string mode and silently skips downstream code.
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
                    nj = skip_string_or_comment(s, j)
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


def _find_matching(s, open_pos, open_ch, close_ch):
    """Walk forward from open_pos (must be open_ch) to matching close_ch.
    Respects strings and comments via skip_string_or_comment.
    Returns close index or None.
    """
    if open_pos >= len(s) or s[open_pos] != open_ch:
        return None

    depth = 0
    i = open_pos
    while i < len(s):
        new_i = skip_string_or_comment(s, i)
        if new_i != i:
            i = new_i
            continue
        ch = s[i]
        if ch == open_ch:
            depth += 1
        elif ch == close_ch:
            depth -= 1
            if depth == 0:
                return i
        i += 1
    return None


def find_matching_paren(s, open_pos):
    """Given position of '(' in s, return position of matching ')' or None."""
    return _find_matching(s, open_pos, '(', ')')


def find_matching_brace(s, open_pos):
    """Given position of '{' in s, return position of matching '}' or None."""
    return _find_matching(s, open_pos, '{', '}')


# ────────────────────────────────────────────────────────────────────────────
# Per-file CLI runner
# ────────────────────────────────────────────────────────────────────────────

def run_per_file_cli(argv, process_file, prog_name, summary_keys=None):
    """Standard CLI driver for per-file patchers.

    Parses --dry-run / --no-backup / paths-with-glob from argv[1:], iterates
    each file through process_file(filepath, dry_run, make_backup), and
    prints uniform per-file and summary output.

    process_file MUST return a stats dict shaped like:
        {
          'file': filepath,                    # absolute or relative path
          'changed': bool,                     # whether content differed
          'error': str or None,                # read/write failure message
          ...patcher-specific counters...
        }

    summary_keys is an optional list of (stat_key, label) tuples for the
    final totals line. The runner also auto-counts files_changed and errors.

    Returns 0 on success, 1 if any file errored, 2 on bad usage.
    """
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
            print(__doc__ or f'See {prog_name} header for usage.', file=sys.stderr)
            return 0
        else:
            expanded = glob.glob(a) if ('*' in a or '?' in a) else [a]
            if not expanded:
                print(f'⚠️  no files match {a}', file=sys.stderr)
                continue
            filepaths.extend(expanded)

    if not filepaths:
        print(
            f'Usage: python3 {prog_name} [--dry-run] [--no-backup] '
            f'<file.js> [more...]',
            file=sys.stderr
        )
        return 2

    all_stats = []
    for fp in filepaths:
        if not os.path.isfile(fp):
            print(f'⚠️  not a file: {fp}', file=sys.stderr)
            continue
        all_stats.append(
            process_file(fp, dry_run=dry_run, make_backup=make_backup)
        )

    return _print_summary(all_stats, dry_run, summary_keys or [])


def _print_summary(all_stats, dry_run, summary_keys):
    """Common reporting block. Returns exit code."""
    print(f"\n{'=' * 60}")
    if dry_run:
        print('DRY RUN — no files modified')
        print(f"{'=' * 60}")

    files_changed = 0
    errors = 0
    totals = {key: 0 for key, _ in summary_keys}

    for s in all_stats:
        name = os.path.basename(s['file'])
        if s.get('error'):
            print(f"❌ {name} — {s['error']}")
            errors += 1
            continue
        for key, _ in summary_keys:
            if key in s and isinstance(s[key], int):
                totals[key] += s[key]

        if s.get('changed'):
            files_changed += 1
            # Patcher is responsible for its own per-file line if it wants
            # one beyond the default. The default minimal line:
            tag = '[would change]' if dry_run else '[changed]'
            extras = s.get('_report_line', '')
            if extras:
                print(f"  {tag} {name} — {extras}")
            else:
                print(f"  {tag} {name}")

    print(f"\n{'=' * 60}")
    print(f"Files {'would be ' if dry_run else ''}changed: {files_changed}")
    for key, label in summary_keys:
        if totals[key]:
            print(f"{label}: {totals[key]}")
    if errors:
        print(f"Errors: {errors}")

    return 1 if errors > 0 else 0


# ────────────────────────────────────────────────────────────────────────────
# Backup-and-write helper
# ────────────────────────────────────────────────────────────────────────────

def write_with_backup(filepath, new_content, make_backup=True):
    """Write new_content to filepath. Optionally create .bak first.
    Returns None on success, error string on failure."""
    try:
        if make_backup:
            shutil.copy2(filepath, filepath + '.bak')
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return None
    except Exception as e:
        return f'write failed: {e}'
