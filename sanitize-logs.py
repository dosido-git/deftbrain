#!/usr/bin/env python3
"""
sanitize-logs.py — DeftBrain log cleanup

Removes all console.log calls (single-line and multi-line) from backend/routes/
and backend/lib/ source files. Leaves console.error alone but reports any error
logs that interpolate user-content variables for manual review.

Usage:
  python3 sanitize-logs.py                # dry run, prints what would change
  python3 sanitize-logs.py --apply        # write changes in place
  python3 sanitize-logs.py --apply --paths backend/routes backend/lib

Run from the deftbrain repo root.
"""

import argparse, os, re, sys
from pathlib import Path

# Variable names that, if interpolated in a console.error, suggest user content
SUSPICIOUS_VARS = {
    'word', 'name', 'email', 'question', 'description', 'input', 'text',
    'message', 'recipientName', 'recipient', 'task', 'topic', 'feedback',
    'prompt', 'situation', 'event', 'activity', 'company', 'audience',
    'instruction', 'leaseText', 'pdfText', 'content',
}

DEFAULT_PATHS = ['backend/routes', 'backend/lib']

def remove_console_log(source: str):
    """Remove every console.log(...) call. Handles multi-line by paren matching."""
    out = []
    i = 0
    removed = 0
    while i < len(source):
        # Look for "console.log(" preceded only by whitespace on its line
        m = re.match(r'(^|\n)([ \t]*)console\.log\(', source[i:])
        if not m:
            out.append(source[i])
            i += 1
            continue
        # Find matching close paren
        line_start_offset = m.start(2) if m.start(1) == m.end(1) else m.end(1)
        call_start = i + m.end()  # position right after "console.log("
        depth = 1
        j = call_start
        in_str = None
        while j < len(source) and depth > 0:
            ch = source[j]
            if in_str:
                if ch == '\\':
                    j += 2; continue
                if ch == in_str:
                    in_str = None
            else:
                if ch in ('"', "'", '`'):
                    in_str = ch
                elif ch == '(':
                    depth += 1
                elif ch == ')':
                    depth -= 1
            j += 1
        if depth != 0:
            # Malformed — bail and keep original
            out.append(source[i])
            i += 1
            continue
        # j is now just past the close paren. Consume optional ; and trailing newline.
        end = j
        if end < len(source) and source[end] == ';':
            end += 1
        if end < len(source) and source[end] == '\n':
            end += 1
        # Skip from start of "console.log" line including its leading newline+indent
        statement_start = i + m.start()  # includes the leading "\n" if any
        # Output the leading newline if it existed (we keep the line break that preceded the call)
        if m.group(1) == '\n':
            out.append('\n')
        # Drop everything from indent through end
        i = end
        removed += 1
    return ''.join(out), removed

def find_orphan_consts(original: str, cleaned: str):
    """Variables declared with `const X = ...` that lose all uses after cleaning."""
    orphans = []
    for m in re.finditer(r'^[ \t]*const\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=', original, flags=re.MULTILINE):
        var = m.group(1)
        decl_line_start = original.rfind('\n', 0, m.start()) + 1
        decl_line_end = original.find('\n', m.end())
        if decl_line_end == -1: decl_line_end = len(original)
        # Count uses outside the declaration line in the cleaned source
        decl_pat = rf'^[ \t]*const\s+{re.escape(var)}\s*=[^\n]*$'
        non_decl_uses = 0
        for use in re.finditer(rf'\b{re.escape(var)}\b', cleaned):
            line_start = cleaned.rfind('\n', 0, use.start()) + 1
            line_end = cleaned.find('\n', use.end())
            if line_end == -1: line_end = len(cleaned)
            line = cleaned[line_start:line_end]
            if re.match(decl_pat, line):
                continue
            non_decl_uses += 1
        if non_decl_uses == 0:
            # And it had uses in the original outside its declaration?
            orig_non_decl = 0
            for use in re.finditer(rf'\b{re.escape(var)}\b', original):
                line_start = original.rfind('\n', 0, use.start()) + 1
                line_end = original.find('\n', use.end())
                if line_end == -1: line_end = len(original)
                line = original[line_start:line_end]
                if re.match(decl_pat, line):
                    continue
                orig_non_decl += 1
            if orig_non_decl > 0:
                line_no = original[:m.start()].count('\n') + 1
                orphans.append((line_no, var))
    return orphans

def flag_suspicious_errors(source: str):
    """Report console.error calls that interpolate suspicious variable names."""
    flagged = []
    for m in re.finditer(r'console\.error\([^\n]*', source):
        for vm in re.finditer(r'\$\{([a-zA-Z_][a-zA-Z0-9_]*)', m.group()):
            if vm.group(1) in SUSPICIOUS_VARS:
                line_no = source[:m.start()].count('\n') + 1
                flagged.append((line_no, m.group().rstrip()))
                break
    return flagged

def collapse_blank_lines(source: str):
    return re.sub(r'\n{3,}', '\n\n', source)

def process_file(path: Path, apply: bool):
    original = path.read_text()
    cleaned, removed = remove_console_log(original)
    cleaned = collapse_blank_lines(cleaned)
    orphans = find_orphan_consts(original, cleaned)
    flagged = flag_suspicious_errors(cleaned)
    changed = cleaned != original
    if changed and apply:
        path.write_text(cleaned)
    return removed, orphans, flagged, changed

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--apply', action='store_true', help='write changes (default: dry run)')
    ap.add_argument('--paths', nargs='+', default=DEFAULT_PATHS)
    args = ap.parse_args()

    total_removed = 0
    files_changed = 0
    all_orphans = []
    all_flagged = []

    for root in args.paths:
        if not os.path.isdir(root):
            print(f'skip (not a dir): {root}', file=sys.stderr)
            continue
        for js in sorted(Path(root).rglob('*.js')):
            if 'node_modules' in js.parts:
                continue
            removed, orphans, flagged, changed = process_file(js, args.apply)
            if changed:
                files_changed += 1
                total_removed += removed
                print(f'{"FIXED" if args.apply else "WOULD FIX"} {js}: -{removed} console.log')
            for ln, var in orphans:
                all_orphans.append((str(js), ln, var))
            for ln, txt in flagged:
                all_flagged.append((str(js), ln, txt))

    print(f'\n--- Summary ---')
    print(f'Files {"changed" if args.apply else "to change"}: {files_changed}')
    print(f'console.log calls removed: {total_removed}')

    if all_orphans:
        print(f'\n--- Orphan const declarations (review and delete manually) ---')
        for f, ln, var in all_orphans:
            print(f'  {f}:{ln}  const {var}')

    if all_flagged:
        print(f'\n--- console.error with suspicious interpolation (review manually) ---')
        for f, ln, txt in all_flagged:
            snippet = txt[:120] + ('...' if len(txt) > 120 else '')
            print(f'  {f}:{ln}  {snippet}')

    if not args.apply:
        print(f'\n(dry run — re-run with --apply to write changes)')

if __name__ == '__main__':
    main()
