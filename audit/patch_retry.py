#!/usr/bin/env python3
"""
patch_retry.py — bulletproofing sweep S7.4e + S7.7b patcher  v1.0

Targets: single-call backend routes using bare anthropic.messages.create
         without callClaudeWithRetry.

Per eligible file:
  1. Import swap — add callClaudeWithRetry; remove `anthropic` if unused elsewhere
  2. Call conversion — replace create({...}) + text/clean/parse lines
                       with callClaudeWithRetry({...}, {label})
  3. S7.7b — replace `error: err.message` with hardcoded friendly string

Skips:
  - streaming routes
  - files already using callClaudeWithRetry
  - files with >1 .create call (multi-route; manual needed)
  - files where .create block can't be parsed safely

Usage:
    python3 patch_retry.py routes/*.js
    python3 patch_retry.py --dry-run routes/analogy-engine.js
"""

import re, sys, os, argparse, glob

STREAMING_SKIP = {
    'complaint-escalation-writer.js',
    'contrast-report.js',
    'ghost-writer.js',
    'plain-talk.js',
    'renters-deposit-saver.js',
}


# ── Import fixer ──────────────────────────────────────────────────────────────

def fix_import(content):
    """Add callClaudeWithRetry to ../lib/claude destructure;
    remove `anthropic` if it doesn't appear outside the import line."""
    pat = re.compile(
        r"(const\s*\{)([^}]+)(\}\s*=\s*require\(['\"]\.\.\/lib\/claude['\"]\)\s*;?)",
        re.DOTALL,
    )
    m = pat.search(content)
    if not m:
        return content, False

    full_match = m.group(0)
    names = [n.strip() for n in m.group(2).split(',') if n.strip()]
    changed = False

    if 'callClaudeWithRetry' not in names:
        names.append('callClaudeWithRetry')
        changed = True

    if 'anthropic' in names:
        rest = content[:m.start()] + content[m.end():]
        if 'anthropic' not in rest:
            names = [n for n in names if n != 'anthropic']
            changed = True

    if not changed:
        return content, False

    new_import = f"{m.group(1)} {', '.join(names)} {m.group(3)}"
    return content.replace(full_match, new_import, 1), True


# ── Brace matching ────────────────────────────────────────────────────────────

def find_brace_end(text, open_pos):
    """Return position after the closing } matching text[open_pos] == '{'."""
    depth = 0
    i = open_pos
    in_str = None
    while i < len(text):
        c = text[i]
        if in_str:
            if c == '\\':
                i += 2
                continue
            if c == in_str:
                in_str = None
        elif c in ('"', "'", '`'):
            in_str = c
        elif c == '{':
            depth += 1
        elif c == '}':
            depth -= 1
            if depth == 0:
                return i + 1
        i += 1
    return -1


# ── Core conversion ───────────────────────────────────────────────────────────

def convert_create(content, route_name):
    """Replace .create block + extraction lines with callClaudeWithRetry call.
    Returns (new_content, changed, parsed_var_name)."""

    create_re = re.compile(
        r"(?P<indent>[ \t]*)(?:const|let)\s+(?P<var>\w+)\s*=\s*"
        r"await\s+anthropic\.messages\.create\s*\("
    )
    m = create_re.search(content)
    if not m:
        return content, False, None

    indent = m.group('indent')
    resp_var = m.group('var')
    call_start = m.start()

    open_brace = content.index('{', m.end())
    close_brace = find_brace_end(content, open_brace)
    if close_brace < 0:
        return content, False, None

    args_inner = content[open_brace + 1:close_brace - 1].strip()

    after = content[close_brace:]
    end_m = re.match(r'\s*\)\s*;?\n?', after)
    if not end_m:
        return content, False, None
    create_end = close_brace + end_m.end()

    # Extraction patterns — all capture `parsed` group for the result var name
    RV = re.escape(resp_var)
    patterns = [
        # 3-line: text + cleaned + parsed
        re.compile(
            r"[ \t]*const\s+\w+\s*=\s*" + RV +
            r"\.content\.find\([^)]+\)\?\.text\s*\|\|\s*['\"][^'\"]*['\"];\n"
            r"[ \t]*const\s+\w+\s*=\s*cleanJsonResponse\(\w+\);\n"
            r"[ \t]*(?:const|let)\s+(?P<parsed>\w+)\s*=\s*JSON\.parse\(\w+\);\n?"
        ),
        # 3-line: raw + cleaned + parsed (content[0])
        re.compile(
            r"[ \t]*const\s+\w+\s*=\s*" + RV +
            r"\.content\[0\]\?\.text\s*\|\|\s*['\"][^'\"]*['\"];\n"
            r"[ \t]*const\s+\w+\s*=\s*cleanJsonResponse\(\w+\);\n"
            r"[ \t]*(?:const|let)\s+(?P<parsed>\w+)\s*=\s*JSON\.parse\(\w+\);\n?"
        ),
        # 2-line: text + JSON.parse(cleanJsonResponse(text))
        re.compile(
            r"[ \t]*const\s+(?P<t1>\w+)\s*=\s*" + RV +
            r"\.content\.find\([^)]+\)\?\.text\s*\|\|\s*['\"][^'\"]*['\"];\n"
            r"[ \t]*(?:const|let)\s+(?P<parsed>\w+)\s*=\s*JSON\.parse\s*\(\s*cleanJsonResponse\s*\((?P=t1)\s*\)\s*\);\n?"
        ),
        # 2-line content[0] variant
        re.compile(
            r"[ \t]*const\s+(?P<t1>\w+)\s*=\s*" + RV +
            r"\.content\[0\]\?\.text\s*\|\|\s*['\"][^'\"]*['\"];\n"
            r"[ \t]*(?:const|let)\s+(?P<parsed>\w+)\s*=\s*JSON\.parse\s*\(\s*cleanJsonResponse\s*\((?P=t1)\s*\)\s*\);\n?"
        ),
        # 2-line: let jsonText = resp.content[0].text.trim(); + JSON.parse(cleanJsonResponse(...))
        re.compile(
            r"[ \t]*let\s+(?P<t1>\w+)\s*=\s*" + RV +
            r"\.content\[0\]\.text\.trim\(\);\n"
            r"[ \t]*(?:const|let)\s+(?P<parsed>\w+)\s*=\s*JSON\.parse\s*\(\s*cleanJsonResponse\s*\((?P=t1)\s*\)\s*\);\n?"
        ),
        # Inline one-liner: const parsed = JSON.parse(cleanJsonResponse(resp.content.find(...).text || ''))
        re.compile(
            r"[ \t]*(?:const|let)\s+(?P<parsed>\w+)\s*=\s*JSON\.parse\s*\(\s*cleanJsonResponse\s*\(\s*"
            + RV +
            r"\.content\.find\([^)]+\)\?\.text\s*\|\|\s*['\"][^'\"]*['\"]\s*\)\s*\);\n?"
        ),
        # Inline one-liner res.json variant (no parsed var — build one)
        re.compile(
            r"[ \t]*return\s+res\.json\s*\(\s*JSON\.parse\s*\(\s*cleanJsonResponse\s*\(\s*"
            + RV +
            r"\.content\.find\([^)]+\)\?\.text\s*\|\|\s*['\"][^'\"]*['\"]\s*\)\s*\)\s*\);\n?"
        ),
    ]

    rest = content[create_end:]
    # Skip optional blank lines between .create block and extraction lines
    blank_m = re.match(r'(\n[ \t]*)*', rest)
    blank_skip = blank_m.end() if blank_m else 0
    rest_trimmed = rest[blank_skip:]

    matched = None
    parsed_var = None
    for pat in patterns:
        em = pat.match(rest_trimmed)
        if em:
            matched = em
            try:
                parsed_var = em.group('parsed')
            except IndexError:
                parsed_var = 'parsed'
            break

    if not matched:
        return content, False, None

    extract_end = create_end + blank_skip + matched.end()
    label = os.path.basename(route_name).replace('.js', '')

    new_call = (
        f"{indent}const {parsed_var} = await callClaudeWithRetry({{\n"
        f"{args_inner}\n"
        f"{indent}}}, {{ label: '{label}' }});\n"
    )

    return content[:call_start] + new_call + content[extract_end:], True, parsed_var


# ── S7.7b fixer ───────────────────────────────────────────────────────────────

def fix_err_message(content):
    """Replace error: err.message (and variants) with friendly string."""
    pat = re.compile(
        r"(res\.status\s*\(\s*\d+\s*\)\.json\s*\(\s*\{[^}]{0,80}?error\s*:\s*)"
        r"(?:err|error|e)\.message"
        r"(?:\s*\|\|\s*['\"][^'\"]*['\"]\s*)?"
    )
    new = pat.sub(r"\1'Something went wrong. Please try again.'", content)
    return new, new != content


# ── Per-file ──────────────────────────────────────────────────────────────────

def process(path, dry_run=False):
    name = os.path.basename(path)
    if name in STREAMING_SKIP:
        return 'skipped', ['streaming route']

    try:
        original = open(path, encoding='utf-8').read()
    except Exception as e:
        return 'error', [str(e)]

    if 'callClaudeWithRetry' in original:
        return 'skipped', ['already has wrapper']

    if not re.search(r'await anthropic\.messages\.create\s*\(', original):
        return 'skipped', ['no .create call']

    n_creates = len(re.findall(r'await anthropic\.messages\.create\s*\(', original))
    if n_creates > 1:
        return 'manual', [f'{n_creates} .create calls — needs manual']

    content = original
    notes = []

    content, ok, parsed_var = convert_create(content, name)
    if not ok:
        return 'manual', ['could not parse .create block']
    notes.append(f'S7.4e: .create → callClaudeWithRetry (var: {parsed_var})')

    content, changed = fix_import(content)
    if changed:
        notes.append('import: added callClaudeWithRetry, cleaned anthropic')

    content, changed = fix_err_message(content)
    if changed:
        notes.append('S7.7b: err.message → friendly string')

    if dry_run:
        return 'dry_run', notes

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    return 'patched', notes


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('files', nargs='+')
    ap.add_argument('--dry-run', action='store_true')
    args = ap.parse_args()

    files = []
    for p in args.files:
        expanded = glob.glob(p)
        files.extend(expanded if expanded else [p])

    ICONS = {'patched': '✅', 'skipped': '⏭ ', 'manual': '⚠️ ',
             'error': '❌', 'dry_run': '🔍', 'clean': '✅'}
    counts = {}
    manual_list = []

    for path in sorted(files):
        result, notes = process(path, dry_run=args.dry_run)
        counts[result] = counts.get(result, 0) + 1
        n = os.path.basename(path)
        print(f"  {ICONS.get(result,'?')} {n}")
        for note in notes:
            print(f"       • {note}")
        if result == 'manual':
            manual_list.append(n)

    print(f"\n{'─'*55}")
    for k, v in sorted(counts.items()):
        print(f"  {k}: {v}")
    if manual_list:
        print(f"\nManual needed ({len(manual_list)}):")
        for f in manual_list:
            print(f"  • {f}")


if __name__ == '__main__':
    main()
