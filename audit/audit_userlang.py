#!/usr/bin/env python3
"""
audit_userlang.py — comprehensive i18n verification for backend route files.

Supersedes scan_userlang.py and the buggy inline comprehensive checker.
Foundation is a paren-aware walker that correctly handles template literals,
nested function calls, single/double quotes, escapes, and ${...} expression
interpolations — so multi-line withLanguage calls with embedded `.join(', ')`
or other parens don't trigger false positives.

Bug classes (cause production breakage or silent wrong behavior):
  P1  ReferenceError: handler references `userLanguage` inside withLanguage
      but never destructures it from req.body. Throws on every request.
  P2  Legacy `locale` parameter name still in code. Frontend sends
      `userLanguage`, so `req.body.locale` is undefined → silent
      English-only output OR literal string "undefined" injected into
      prompts via ${lang} template antipattern.
  P3  Route calls Claude (anthropic.messages.create or callClaudeWithRetry)
      but never wraps any prompt with withLanguage. Always-English output
      regardless of user language.
  P4  Imports withLanguage but never calls it. Dead import suggesting
      forgotten i18n integration.
  P5  Destructures userLanguage from req.body but no withLanguage call
      receives it as second argument. Declared but unused.

Informational (not bugs, but worth tracking for normalization):
  S1  Uses `req.body.userLanguage` direct access instead of destructuring.
      Functionally equivalent; bypasses canonical pattern.
  S2  Uses `userLanguage || 'en'` defensive fallback. Works fine; just
      stylistic variation.

Usage:
  python3 audit_userlang.py <routes_dir>
  python3 audit_userlang.py backend/routes/

Exit codes:
  0 — no production bugs (P1–P5 all clean)
  1 — production bugs found
  2 — invocation error (bad path, etc.)

Designed for inheritance into backend_audit_v1_5.py as check S7.4d.
The PARSER class is the reusable component.
"""
import re
import sys
from pathlib import Path


# ──────────────────────────────────────────────────────────────────────
# Paren-aware parser
# ──────────────────────────────────────────────────────────────────────
class JSParser:
    """
    Lightweight JS parser. Knows enough to identify call-argument spans
    while respecting template literals (with ${...}), strings, and escapes.
    Does NOT parse JS into an AST — but does correctly find matching
    parens for any function call in the source.
    """

    @staticmethod
    def find_call_args(src, call_re):
        """
        Yield (call_match, args_text, args_start, args_end) for every
        function call matching call_re. args_text is the substring
        BETWEEN the outer parens, args_start/args_end are absolute offsets.

        call_re must include the opening `(` (or end with `\\(` ).
        Example: r'\\bwithLanguage\\s*\\('
        """
        for m in re.finditer(call_re, src):
            args_start = m.end()
            args_end = JSParser._find_matching_paren(src, args_start - 1)
            if args_end is None:
                continue  # malformed source — skip
            yield m, src[args_start:args_end], args_start, args_end

    @staticmethod
    def _find_matching_paren(src, open_idx):
        """
        Given the index of an opening `(`, return the index of the matching `)`.
        Tracks template literals (with nested ${...}), strings, and escapes.
        Returns None if no match found.
        """
        if src[open_idx] != '(':
            return None
        i = open_idx + 1
        depth = 1
        n = len(src)
        while i < n and depth > 0:
            c = src[i]
            if c == '`':
                i = JSParser._skip_template(src, i)
                continue
            if c == "'" or c == '"':
                i = JSParser._skip_string(src, i, c)
                continue
            if c == '/' and i + 1 < n:
                # could be a regex or comment — skip both safely
                if src[i+1] == '/':
                    nl = src.find('\n', i)
                    i = nl + 1 if nl != -1 else n
                    continue
                if src[i+1] == '*':
                    end = src.find('*/', i + 2)
                    i = end + 2 if end != -1 else n
                    continue
                # Regex literals are tricky to disambiguate from division;
                # given our route files don't use regex literals as call args,
                # we treat `/` as division. (Documented assumption.)
            if c == '(':
                depth += 1
            elif c == ')':
                depth -= 1
                if depth == 0:
                    return i
            i += 1
        return None

    @staticmethod
    def _skip_template(src, i):
        """Skip over a template literal starting at i (a backtick), including
        nested ${...} expressions which can themselves contain templates."""
        n = len(src)
        i += 1  # past opening `
        while i < n:
            c = src[i]
            if c == '\\':
                i += 2
                continue
            if c == '`':
                return i + 1
            if c == '$' and i + 1 < n and src[i+1] == '{':
                # nested expression — scan for matching close brace
                j = i + 2
                depth = 1
                while j < n and depth > 0:
                    cc = src[j]
                    if cc == '\\':
                        j += 2
                        continue
                    if cc == '`':
                        j = JSParser._skip_template(src, j)
                        continue
                    if cc == "'" or cc == '"':
                        j = JSParser._skip_string(src, j, cc)
                        continue
                    if cc == '{':
                        depth += 1
                    elif cc == '}':
                        depth -= 1
                    j += 1
                i = j
                continue
            i += 1
        return n

    @staticmethod
    def _skip_string(src, i, quote):
        """Skip over a single- or double-quoted string starting at i."""
        n = len(src)
        i += 1
        while i < n:
            c = src[i]
            if c == '\\':
                i += 2
                continue
            if c == quote:
                return i + 1
            if c == '\n':
                return i + 1  # JS strings don't span lines (without backslash)
            i += 1
        return n

    @staticmethod
    def split_top_level(args_text):
        """
        Split a function-arg string on top-level commas (ignoring commas
        inside parens, brackets, braces, strings, and templates).
        Returns list of trimmed argument strings.
        """
        out = []
        depth = 0
        bracket = 0
        brace = 0
        i = 0
        n = len(args_text)
        last = 0
        while i < n:
            c = args_text[i]
            if c == '`':
                i = JSParser._skip_template(args_text, i)
                continue
            if c == "'" or c == '"':
                i = JSParser._skip_string(args_text, i, c)
                continue
            if c == '(': depth += 1
            elif c == ')': depth -= 1
            elif c == '[': bracket += 1
            elif c == ']': bracket -= 1
            elif c == '{': brace += 1
            elif c == '}': brace -= 1
            elif c == ',' and depth == 0 and bracket == 0 and brace == 0:
                out.append(args_text[last:i].strip())
                last = i + 1
            i += 1
        tail = args_text[last:].strip()
        if tail:
            out.append(tail)
        return out


# ──────────────────────────────────────────────────────────────────────
# Strip comments (so `locale` in a comment doesn't trip P2)
# ──────────────────────────────────────────────────────────────────────
def strip_comments(src):
    """Replace JS line and block comments with spaces (preserving offsets)."""
    out = []
    i = 0
    n = len(src)
    while i < n:
        c = src[i]
        if c == '`':
            j = JSParser._skip_template(src, i)
            out.append(src[i:j])
            i = j
            continue
        if c == "'" or c == '"':
            j = JSParser._skip_string(src, i, c)
            out.append(src[i:j])
            i = j
            continue
        if c == '/' and i + 1 < n:
            if src[i+1] == '/':
                nl = src.find('\n', i)
                end = nl if nl != -1 else n
                out.append(' ' * (end - i))
                i = end
                continue
            if src[i+1] == '*':
                close = src.find('*/', i + 2)
                end = close + 2 if close != -1 else n
                # Preserve newlines so line numbers stay aligned
                blanked = ''.join(ch if ch == '\n' else ' ' for ch in src[i:end])
                out.append(blanked)
                i = end
                continue
        out.append(c)
        i += 1
    return ''.join(out)


# ──────────────────────────────────────────────────────────────────────
# Audit checks
# ──────────────────────────────────────────────────────────────────────
def line_of(src, offset):
    return src[:offset].count('\n') + 1


def audit_file(path):
    """
    Returns dict of findings keyed by class (P1, P2, ...).
    Each finding is (line_no, message).
    """
    raw = path.read_text(encoding='utf-8')
    src = strip_comments(raw)  # checks operate on de-commented source
    findings = {k: [] for k in ('P1', 'P2', 'P3', 'P4', 'P5', 'S1', 'S2')}

    # Patterns
    CLAUDE_CALL_RE = r'\b(?:anthropic\.messages\.create|callClaudeWithRetry)\s*\('
    WITH_LANG_RE   = r'\bwithLanguage\s*\('
    WITH_LANG_IMPORT_RE = r'\b(?:const|let|var)\s*\{[^}]*\bwithLanguage\b[^}]*\}\s*=\s*require'
    USER_LANG_DESTRUCT_RE = re.compile(
        r'const\s*\{[^}]*\buserLanguage\b[^}]*\}\s*=\s*req\.body',
        re.DOTALL,
    )
    REQ_BODY_USER_LANG_RE = r'\breq\.body\.userLanguage\b'

    # Inventory
    claude_calls = list(re.finditer(CLAUDE_CALL_RE, src))
    withlang_calls = list(JSParser.find_call_args(src, WITH_LANG_RE))
    has_withlang_import = bool(re.search(WITH_LANG_IMPORT_RE, src))
    has_userlang_destruct = bool(USER_LANG_DESTRUCT_RE.search(src))
    has_req_body_userlang = bool(re.search(REQ_BODY_USER_LANG_RE, src))

    # P1 — references userLanguage but never destructures or accesses via req.body
    if not has_userlang_destruct and not has_req_body_userlang:
        # Check: is bare `userLanguage` referenced as an identifier anywhere?
        for m in re.finditer(r'\buserLanguage\b', src):
            findings['P1'].append((
                line_of(src, m.start()),
                f'`userLanguage` referenced but never destructured from req.body'
            ))
            break  # first instance is enough

    # P2 — legacy `locale` parameter name in destructure or call
    # Restricted to identifiers in destructures and withLanguage args, since
    # `locale` is a common English word that may legitimately appear elsewhere
    # (we already stripped comments).
    LOCALE_DESTRUCT_RE = re.compile(
        r'const\s*\{[^}]*\blocale\b[^}]*\}\s*=\s*req\.body',
        re.DOTALL,
    )
    for m in LOCALE_DESTRUCT_RE.finditer(src):
        findings['P2'].append((
            line_of(src, m.start()),
            f'legacy `locale` in req.body destructure (frontend sends userLanguage)'
        ))
    for _, args, args_start, _ in withlang_calls:
        # Look for `locale` as second argument
        parts = JSParser.split_top_level(args)
        if len(parts) >= 2 and re.match(r'^locale$', parts[1].strip()):
            findings['P2'].append((
                line_of(src, args_start),
                f'withLanguage(..., locale) — should be userLanguage'
            ))
        # Pattern Y antipattern: withLanguage(locale) single-arg
        if len(parts) == 1 and parts[0].strip() == 'locale':
            findings['P2'].append((
                line_of(src, args_start),
                f'withLanguage(locale) antipattern — should be withLanguage(\'\', userLanguage)'
            ))

    # P3 — calls Claude but never wraps any prompt with withLanguage
    if claude_calls and not withlang_calls:
        findings['P3'].append((
            line_of(src, claude_calls[0].start()),
            f'calls Claude ({len(claude_calls)}x) but never wraps any prompt with withLanguage — always English'
        ))

    # P4 — imports withLanguage but never calls it
    if has_withlang_import and not withlang_calls:
        findings['P4'].append((
            1,
            f'withLanguage imported but never called — dead import'
        ))

    # P5 — destructures userLanguage but no withLanguage call uses it
    # Use paren-aware walker (the original Q3 false-positive bug fix)
    if has_userlang_destruct:
        any_call_uses_userlang = False
        for _, args, _, _ in withlang_calls:
            parts = JSParser.split_top_level(args)
            if any(re.search(r'\buserLanguage\b', p) for p in parts):
                any_call_uses_userlang = True
                break
        if not any_call_uses_userlang and withlang_calls:
            # Has both destructure AND withLanguage calls but mismatch
            findings['P5'].append((
                line_of(src, withlang_calls[0][0].start()),
                f'destructures userLanguage but no withLanguage call passes it'
            ))

    # S1 — req.body.userLanguage direct access (style note)
    for m in re.finditer(REQ_BODY_USER_LANG_RE, src):
        findings['S1'].append((
            line_of(src, m.start()),
            f'`req.body.userLanguage` direct access (canonical pattern is destructure)'
        ))

    # S2 — userLanguage || 'something' fallback (style note)
    for m in re.finditer(r"userLanguage\s*\|\|\s*['\"]([a-z\-]+)['\"]", src):
        findings['S2'].append((
            line_of(src, m.start()),
            f"`userLanguage || \"{m.group(1)}\"` fallback"
        ))

    return findings, {
        'claude_calls': len(claude_calls),
        'withlang_calls': len(withlang_calls),
        'has_userlang_destruct': has_userlang_destruct,
        'has_req_body_userlang': has_req_body_userlang,
    }


# ──────────────────────────────────────────────────────────────────────
# Entry point
# ──────────────────────────────────────────────────────────────────────
PROD_BUGS = ('P1', 'P2', 'P3', 'P4', 'P5')
STYLE_NOTES = ('S1', 'S2')

DESCRIPTIONS = {
    'P1': 'ReferenceError: userLanguage referenced but never destructured',
    'P2': 'Legacy `locale` parameter (frontend sends `userLanguage`)',
    'P3': 'Calls Claude but never wraps with withLanguage',
    'P4': 'withLanguage imported but never called (dead import)',
    'P5': 'userLanguage destructured but no withLanguage call uses it',
    'S1': 'req.body.userLanguage direct access (style)',
    'S2': "userLanguage || '...' fallback (style)",
}


def main():
    if len(sys.argv) != 2:
        print(__doc__)
        sys.exit(2)

    routes_dir = Path(sys.argv[1])
    if not routes_dir.is_dir():
        print(f'error: not a directory: {routes_dir}')
        sys.exit(2)

    js_files = sorted(routes_dir.glob('*.js'))
    if not js_files:
        print(f'error: no .js files in {routes_dir}')
        sys.exit(2)

    all_findings = {k: [] for k in PROD_BUGS + STYLE_NOTES}
    file_count = len(js_files)
    files_with_bugs = 0
    files_with_only_style = 0
    files_clean = 0

    for f in js_files:
        try:
            findings, _stats = audit_file(f)
        except Exception as e:
            print(f'error auditing {f.name}: {e}')
            files_with_bugs += 1
            continue

        has_bug = any(findings[k] for k in PROD_BUGS)
        has_style = any(findings[k] for k in STYLE_NOTES)
        if has_bug:
            files_with_bugs += 1
        elif has_style:
            files_with_only_style += 1
        else:
            files_clean += 1

        for k, items in findings.items():
            for line, msg in items:
                all_findings[k].append((f.name, line, msg))

    # ── Report ──
    print(f'Audited {file_count} files in {routes_dir}\n')

    for k in PROD_BUGS:
        items = all_findings[k]
        if not items:
            print(f'✓ {k} — {DESCRIPTIONS[k]}: clean')
            continue
        print(f'✗ {k} — {DESCRIPTIONS[k]}: {len(items)} finding(s)')
        for fname, line, msg in items:
            print(f'    {fname}:{line}  {msg}')

    print()
    for k in STYLE_NOTES:
        items = all_findings[k]
        if not items:
            print(f'• {k} — {DESCRIPTIONS[k]}: none')
            continue
        print(f'• {k} — {DESCRIPTIONS[k]}: {len(items)} finding(s)')
        for fname, line, msg in items[:10]:
            print(f'    {fname}:{line}  {msg}')
        if len(items) > 10:
            print(f'    … and {len(items) - 10} more')

    # ── Summary ──
    total_bugs = sum(len(all_findings[k]) for k in PROD_BUGS)
    total_style = sum(len(all_findings[k]) for k in STYLE_NOTES)
    print(f'\n=== Summary ===')
    print(f'  Files clean:                   {files_clean}/{file_count}')
    print(f'  Files with style notes only:   {files_with_only_style}/{file_count}')
    print(f'  Files with production bugs:    {files_with_bugs}/{file_count}')
    print(f'  Total production bugs (P1-P5): {total_bugs}')
    print(f'  Total style notes  (S1-S2):    {total_style}')

    sys.exit(1 if total_bugs > 0 else 0)


if __name__ == '__main__':
    main()
