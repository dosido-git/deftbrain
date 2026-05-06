#!/usr/bin/env python3
"""add_pf19.py — Mechanical patcher for PF-19 violations.

v1.5 · 2026-05-06 · refactored to use shared _helpers.py for the brace
                    walker. Side benefit: walker now correctly handles
                    nested template literals (was a latent bug: nested
                    backticks would prematurely close the outer string,
                    causing the scanner to miss patches in some files).
v1.4 · 2026-05-05 · handles if-cond contexts, default-only React imports,
                    value-binding exemption.

Adds the 4-part focus pattern to growable input lists:
  1. Refs near other useRefs:
       const xInputRefs = useRef([]);
       const shouldFocusNewXRef = useRef(false);
  2. Flag-set before each setX(p => [...p, ...]) call.
  3. useEffect on [x.length] focusing last input when flag is set.
  4. ref={el => { xInputRefs.current[i] = el; }} on first <input>/<textarea>
     in the map body.

Conservative: when a case is unusual (no index var in map callback,
input already has a ref attr, etc.), the patcher SKIPS that state with
a warning rather than risk corrupting the file.

Usage:
  python3 add_pf19.py --dry-run src/tools/Tool.js
  python3 add_pf19.py src/tools/Tool.js          # backup .bak then patch
  python3 add_pf19.py --no-backup src/tools/Tool.js
  python3 add_pf19.py src/tools/*.js             # full catalog

Exit 0 if no errors; 1 if any file errored. Idempotent.
"""

import os, re, sys, glob, shutil

# Allow running from any directory by adjusting sys.path to find _helpers.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _helpers import find_matching_paren


# ─── Naming helpers ──────────────────────────────────────────────────────

def _cap(s):
    return s[0].upper() + s[1:]


def state_to_setter(state):
    return f'set{_cap(state)}'


def refs_var_for(state):
    return f'{state}InputRefs'


def flag_var_for(state):
    return f'shouldFocusNew{_cap(state)}Ref'


# ─── Detection ───────────────────────────────────────────────────────────

def find_growable_input_states(content):
    """Return list of state names (camelCase) that:
      - Have a setX(p => [...p, {...}]) appender, AND
      - Are rendered with X.map((item, idx) => ...) whose body contains an
        <input> or <textarea> whose value attribute binds to the map item
        or index variable.

    The value-binding check matters: a map can contain an input that's
    semantically unrelated (e.g. an inline-edit/correction UI bound to a
    separate state). For those, PF-19 doesn't apply — focusing on append
    would target a hidden or wrong field.
    """
    no_comments = re.sub(r'//[^\n]*|/\*[\s\S]*?\*/', '', content)
    pat = re.compile(
        r'\bset([A-Z]\w*)\s*\(\s*\w+\s*=>\s*\[\s*\.\.\.\s*\w+\s*,\s*\{'
    )
    candidates = sorted(set(pat.findall(no_comments)))

    result = []
    for setter in candidates:
        state = setter[0].lower() + setter[1:]
        map_pat = re.compile(r'\b' + re.escape(state) + r'\.map\s*\(')
        for m in map_pat.finditer(no_comments):
            close = find_matching_paren(no_comments, m.end() - 1)
            if close is None:
                continue
            body = no_comments[m.end():close]
            if not re.search(r'<(?:input|textarea)\b', body):
                continue
            # Extract item + index from callback signature
            sig = re.match(
                r'\s*(?:\(\s*(\w+)\s*(?:,\s*(\w+)\s*)?\)|(\w+))\s*=>',
                body
            )
            if not sig:
                continue
            item_var = sig.group(1) or sig.group(3)
            idx_var = sig.group(2)
            if not item_var or item_var == '_':
                continue
            vars_to_check = [item_var]
            if idx_var and idx_var != '_':
                vars_to_check.append(idx_var)
            binding_pat = re.compile(
                r'\bvalue\s*=\s*\{[^}]*?\b(?:'
                + '|'.join(re.escape(v) for v in vars_to_check)
                + r')\b'
            )
            if binding_pat.search(body):
                result.append(state)
                break
    return result


def already_patched(content, state):
    """All 4 PF-19 components already in place?"""
    refs_var = refs_var_for(state)
    flag_var = flag_var_for(state)
    if refs_var not in content:
        return False
    if flag_var not in content:
        return False
    if not re.search(re.escape(flag_var) + r'\.current\s*=\s*true', content):
        return False
    # useEffect block referencing flag, .focus(), and [state.length]
    if not re.search(
        r'useEffect[\s\S]{0,500}?' + re.escape(flag_var)
        + r'[\s\S]{0,500}?\.focus\s*\(\s*\)[\s\S]{0,200}?\[\s*'
        + re.escape(state) + r'\.length\s*\]',
        content
    ):
        return False
    # ref attribute on an input
    if not re.search(
        r'\bref\s*=\s*\{\s*\w+\s*=>\s*\{?\s*' + re.escape(refs_var)
        + r'\.current\[',
        content
    ):
        return False
    return True


# ─── React import maintenance ─────────────────────────────────────────────

def ensure_react_imports(content, names_needed):
    """Ensure each name in names_needed is imported from React, IF it's used
    in the file as a function call. Returns (content, list_of_added_names).

    Handles three React import shapes:
      1. `import React, { useState, ... } from 'react';`  (extends destructure)
      2. `import { useState, ... } from 'react';`         (extends destructure)
      3. `import React from 'react';`                      (converts to shape 1)

    Earlier versions of this patcher injected `useRef(...)` declarations
    without verifying that `useRef` was imported. ESLint then failed with
    no-undef. This function backfills missing imports for files patched by
    older versions, and is also safe to run on freshly-patched files.

    Idempotent: only modifies the file if at least one name needs adding.
    """
    # First, filter to names that are actually used as function calls.
    # Lookbehind excludes `React.useRef(...)` namespace usages.
    used_names = []
    for name in names_needed:
        usage_pat = re.compile(r'(?<![\.\w])' + re.escape(name) + r'\s*\(')
        if usage_pat.search(content):
            used_names.append(name)

    if not used_names:
        return content, []

    # Shape 1 or 2: destructured React import already exists.
    destruct_pat = re.compile(
        r"(import\s+(?:[A-Z]\w*\s*,\s*)?\{)([^}]*?)(\}\s*from\s*['\"]react['\"])",
        re.MULTILINE
    )
    m = destruct_pat.search(content)
    if m:
        existing_names = set(
            n.strip() for n in m.group(2).split(',') if n.strip()
        )
        to_add = [n for n in used_names if n not in existing_names]
        if not to_add:
            return content, []

        open_part, inner, close_part = m.group(1), m.group(2), m.group(3)
        trimmed = inner.rstrip()
        trailing_ws = inner[len(trimmed):]

        if not trimmed or trimmed.endswith(','):
            addition = ' ' + ', '.join(to_add)
        else:
            addition = ', ' + ', '.join(to_add)

        new_inner = trimmed + addition + (trailing_ws or ' ')
        new_import = open_part + new_inner + close_part
        return (
            content[:m.start()] + new_import + content[m.end():],
            to_add,
        )

    # Shape 3: default-only `import React from 'react'` — convert to shape 1.
    default_pat = re.compile(
        r"(import\s+([A-Z]\w*)\s+from\s*['\"]react['\"])",
        re.MULTILINE
    )
    m = default_pat.search(content)
    if m:
        react_var = m.group(2)
        replacement = (
            f"import {react_var}, {{ {', '.join(used_names)} }} "
            f"from 'react'"
        )
        return (
            content[:m.start()] + replacement + content[m.end():],
            used_names,
        )

    # No React import found at all — file structure is non-standard, bail.
    return content, []


# ─── Injection 1: refs ──────────────────────────────────────────────────

def inject_refs(content, state):
    refs_var = refs_var_for(state)
    flag_var = flag_var_for(state)
    if refs_var in content and flag_var in content:
        return content, True, ''  # already present

    new_block = (
        f'  const {refs_var} = useRef([]);\n'
        f'  const {flag_var} = useRef(false);\n'
    )

    # Insert after the last useRef declaration.
    matches = list(re.finditer(
        r'^[ \t]*const\s+\w+\s*=\s*useRef\s*\([^)]*\)\s*;?\s*\n',
        content, re.MULTILINE
    ))
    if matches:
        last = matches[-1]
        return content[:last.end()] + new_block + content[last.end():], True, ''

    # Fall back to last useState
    matches = list(re.finditer(
        r'^[ \t]*const\s+\[[^\]]+\]\s*=\s*useState\s*\([^;]*\)\s*;?\s*\n',
        content, re.MULTILINE
    ))
    if matches:
        last = matches[-1]
        return content[:last.end()] + new_block + content[last.end():], True, ''

    return content, False, 'no useRef or useState anchor found'


# ─── Injection 2: flag-set before each setter call ──────────────────────

def inject_handler_flag(content, state):
    flag_var = flag_var_for(state)
    setter = state_to_setter(state)
    flag_stmt = f'{flag_var}.current = true;'

    pat = re.compile(
        r'\b' + re.escape(setter) + r'\s*\(\s*\w+\s*=>\s*\[\s*\.\.\.'
    )
    matches = list(pat.finditer(content))
    if not matches:
        return content, False, f'no {setter}(p => [...) appender found'

    warnings = []
    # Process from end to start so earlier positions stay valid.
    for m in reversed(matches):
        # Idempotency: flag-set already within lookback window?
        lookback = content[max(0, m.start() - 250):m.start()]
        if f'{flag_var}.current = true' in lookback:
            continue

        # Determine syntactic context by walking back through whitespace.
        i = m.start() - 1
        while i >= 0 and content[i] in ' \t\n':
            i -= 1
        if i < 0:
            warnings.append(f'setter at {m.start()}: at file start')
            continue
        prev_ch = content[i]

        if prev_ch in (';', '{'):
            # Block context. Prepend flag-set as a separate statement.
            line_start = content.rfind('\n', 0, m.start()) + 1
            indent = ''
            for cc in content[line_start:m.start()]:
                if cc in ' \t':
                    indent += cc
                else:
                    break
            prefix = f'{flag_stmt}\n{indent}'
            content = content[:m.start()] + prefix + content[m.start():]
        elif prev_ch in (')', '>') and (
            prev_ch == ')'
            or (prev_ch == '>' and i > 0 and content[i-1] == '=')
        ):
            # Two cases handled identically by wrapping the setter call:
            #   - `if (cond) setX(...)` / `while (cond) setX(...)` etc.
            #     (prev_ch is ')', the close of the test expression)
            #   - `() => setX(...)` arrow expression body
            #     (prev_ch is '>' from '=>')
            # In either case, wrap setter call in a block so flag-set
            # precedes it: `setX(...)` becomes `{ flag; setX(...); }`.
            setter_paren_open = content.find('(', m.start())
            if setter_paren_open == -1:
                warnings.append(
                    f'setter at {m.start()}: no paren found'
                )
                continue
            close_paren = find_matching_paren(content, setter_paren_open)
            if close_paren is None:
                warnings.append(
                    f'setter at {m.start()}: unterminated call'
                )
                continue
            end = close_paren + 1
            wrapped = (
                '{ ' + flag_stmt + ' '
                + content[m.start():end]
                + '; }'
            )
            content = content[:m.start()] + wrapped + content[end:]
        else:
            # Unrecognized context — too risky to auto-edit
            warnings.append(
                f'setter at {m.start()} in unrecognized context '
                f'(prev char: {prev_ch!r}); manual fix needed'
            )

    return content, True, '; '.join(warnings) if warnings else ''


# ─── Injection 3: useEffect ─────────────────────────────────────────────

def inject_use_effect(content, state):
    refs_var = refs_var_for(state)
    flag_var = flag_var_for(state)

    # Idempotency check
    if re.search(
        r'useEffect[\s\S]{0,500}?' + re.escape(flag_var)
        + r'[\s\S]{0,500}?\.focus\s*\(\s*\)[\s\S]{0,200}?\[\s*'
        + re.escape(state) + r'\.length\s*\]',
        content
    ):
        return content, True, ''

    block = (
        '\n  useEffect(() => {\n'
        f'    if ({flag_var}.current) {{\n'
        f'      const last = {refs_var}.current[{state}.length - 1];\n'
        '      if (last) last.focus();\n'
        f'      {flag_var}.current = false;\n'
        '    }\n'
        f'  }}, [{state}.length]);\n'
    )

    # Insert after the last useEffect declaration.
    matches = list(re.finditer(r'\buseEffect\s*\(', content))
    if matches:
        last = matches[-1]
        close = find_matching_paren(content, last.end() - 1)
        if close is not None:
            end = close + 1
            if end < len(content) and content[end] == ';':
                end += 1
            if end < len(content) and content[end] == '\n':
                end += 1
            return content[:end] + block + content[end:], True, ''

    # No useEffect — fall back to right after the refs we added.
    refs_pat = re.compile(
        r'^[ \t]*const\s+' + re.escape(refs_var)
        + r'\s*=\s*useRef\s*\([^)]*\)\s*;\s*\n',
        re.MULTILINE
    )
    m = refs_pat.search(content)
    if m:
        # Find end of the flag-ref line that follows
        next_line_end = content.find('\n', m.end())
        if next_line_end != -1:
            return content[:next_line_end + 1] + block + content[next_line_end + 1:], True, ''

    return content, False, 'no useEffect anchor and refs not found'


# ─── Injection 4: ref attribute on the first input in map body ──────────

def inject_ref_attribute(content, state):
    refs_var = refs_var_for(state)

    pat = re.compile(r'\b' + re.escape(state) + r'\.map\s*\(')
    for m in pat.finditer(content):
        open_paren = m.end() - 1
        close_paren = find_matching_paren(content, open_paren)
        if close_paren is None:
            continue
        body = content[m.end():close_paren]
        if not re.search(r'<(?:input|textarea)\b', body):
            continue

        # Extract index variable from callback signature.
        # Signatures handled:
        #   (item, i) =>   (idx = i)
        #   item =>        (no idx)
        #   (item) =>      (no idx)
        sig = re.match(
            r'\s*(?:\(\s*\w+\s*(?:,\s*(\w+)\s*)?\)|\w+)\s*=>',
            body
        )
        if not sig:
            return content, False, (
                f'cannot parse {state}.map(...) callback signature: '
                f'{body[:80]!r}'
            )
        idx_var = sig.group(1)
        if not idx_var or idx_var == '_':
            return content, False, (
                f'{state}.map(...) callback has no usable index var '
                f'(signature looks like `{body[:60]!r}`)'
            )

        # Find first <input> or <textarea> in body.
        inp_m = re.search(r'<(input|textarea)\b', body)
        if not inp_m:
            return content, False, 'no input/textarea in body'

        abs_tag_end = m.end() + inp_m.end()  # position right after "input" word
        # Walk to closing > or /> of this tag, respecting nested {} for JSX
        # expression containers
        i = abs_tag_end
        brace_depth = 0
        in_string = None
        tag_end = None
        while i < len(content):
            ch = content[i]
            if in_string:
                if ch == '\\' and i + 1 < len(content):
                    i += 2; continue
                if ch == in_string:
                    in_string = None
                i += 1; continue
            if ch in ('"', "'", '`'):
                in_string = ch; i += 1; continue
            if ch == '{':
                brace_depth += 1
            elif ch == '}':
                brace_depth -= 1
            elif ch == '>' and brace_depth == 0:
                tag_end = i
                break
            i += 1
        if tag_end is None:
            return content, False, 'unterminated input tag'

        tag_attrs = content[abs_tag_end:tag_end]

        # Idempotency
        if f'{refs_var}.current[{idx_var}]' in tag_attrs:
            return content, True, ''
        if re.search(r'\bref\s*=\s*\{', tag_attrs):
            return content, False, (
                f'first <input> in {state}.map(...) already has a '
                f'ref attribute; manual fix needed'
            )

        ref_attr = (
            f' ref={{el => {{ {refs_var}.current[{idx_var}] = el; }}}}'
        )
        return (
            content[:abs_tag_end] + ref_attr + content[abs_tag_end:],
            True,
            ''
        )

    return content, False, f'no {state}.map(...) with inputs found'


# ─── Process file ────────────────────────────────────────────────────────

def process_file(filepath, dry_run=False, make_backup=True):
    stats = {
        'file': filepath,
        'states': [],
        'patched': [],
        'skipped': [],
        'warnings': [],
        'changed': False,
        'error': None,
    }

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            original = f.read()
    except Exception as e:
        stats['error'] = f'read failed: {e}'
        return stats

    states = find_growable_input_states(original)
    stats['states'] = states

    content = original
    for state in states:
        if already_patched(content, state):
            stats['skipped'].append(f'{state} (already patched)')
            continue

        # All 4 must succeed for this state. Use a local `attempt` so a
        # partial failure doesn't leave the file half-patched.
        attempt = content
        msg_log = []

        attempt, ok1, msg = inject_refs(attempt, state)
        if msg: msg_log.append(f'refs: {msg}')

        if ok1:
            attempt, ok2, msg = inject_handler_flag(attempt, state)
            if msg: msg_log.append(f'handler: {msg}')
        else:
            ok2 = False

        if ok1 and ok2:
            attempt, ok3, msg = inject_use_effect(attempt, state)
            if msg: msg_log.append(f'useEffect: {msg}')
        else:
            ok3 = False

        if ok1 and ok2 and ok3:
            attempt, ok4, msg = inject_ref_attribute(attempt, state)
            if msg: msg_log.append(f'refAttr: {msg}')
        else:
            ok4 = False

        if ok1 and ok2 and ok3 and ok4:
            content = attempt
            stats['patched'].append(state)
            # Surface any warnings even on success — partial silent failures
            # were the cause of v1.0's missed handler-flag injections.
            real_warnings = [m for m in msg_log if m and 'already' not in m]
            if real_warnings:
                stats['warnings'].append(
                    f'{state}: ' + '; '.join(real_warnings)
                )
        else:
            stats['skipped'].append(f"{state} — {'; '.join(msg_log)}")

    # Ensure React imports include any hooks the patcher injected. This runs
    # unconditionally (even when no states needed patching) so files patched
    # by older versions of this script — which didn't backfill imports — get
    # corrected next time the patcher passes over the catalog.
    content, imports_added = ensure_react_imports(
        content, ['useRef', 'useEffect']
    )
    if imports_added:
        stats['imports_added'] = imports_added

    stats['changed'] = (content != original)

    if stats['changed'] and not dry_run:
        try:
            if make_backup:
                shutil.copy2(filepath, filepath + '.bak')
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
        except Exception as e:
            stats['error'] = f'write failed: {e}'

    return stats


# ─── Main ───────────────────────────────────────────────────────────────

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
            print(__doc__, file=sys.stderr)
            return 0
        else:
            expanded = glob.glob(a) if ('*' in a or '?' in a) else [a]
            if not expanded:
                print(f'⚠️  no files match {a}', file=sys.stderr)
                continue
            filepaths.extend(expanded)

    if not filepaths:
        print(
            'Usage: python3 add_pf19.py [--dry-run] [--no-backup] '
            '<file.js> [more...]',
            file=sys.stderr
        )
        return 2

    all_stats = []
    for fp in filepaths:
        if not os.path.isfile(fp):
            print(f'⚠️  not a file: {fp}', file=sys.stderr)
            continue
        all_stats.append(process_file(
            fp, dry_run=dry_run, make_backup=make_backup
        ))

    print(f"\n{'═' * 60}")
    if dry_run:
        print('DRY RUN — no files modified')
        print('═' * 60)

    total_patched = 0
    total_skipped_real = 0
    files_changed = 0
    errors = 0

    for s in all_stats:
        name = os.path.basename(s['file'])
        if s['error']:
            print(f"❌ {name} — {s['error']}")
            errors += 1
            continue
        # Report import-only fixes even on files with no PF-19 states.
        if not s['states'] and not s.get('imports_added'):
            continue

        if s['patched']:
            files_changed += 1
            tag = '[would change]' if dry_run else '[changed]'
            print(
                f"  {tag} {name} — patched: {', '.join(s['patched'])}"
            )
            total_patched += len(s['patched'])

        if s.get('imports_added'):
            tag = '[would add]' if dry_run else '[added]'
            print(
                f"  {tag} {name} — React import: "
                f"+{', '.join(s['imports_added'])}"
            )

        for sk in s['skipped']:
            if 'already patched' in sk:
                continue  # silent
            print(f"  ⚠️  {name} — skipped {sk}")
            total_skipped_real += 1

    print(f"\n{'═' * 60}")
    print(f"States {'would be ' if dry_run else ''}patched: {total_patched}")
    if total_skipped_real:
        print(
            f"States skipped (need manual fix): {total_skipped_real}"
        )
    if errors:
        print(f"Errors: {errors}")

    return 1 if errors > 0 else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv))
