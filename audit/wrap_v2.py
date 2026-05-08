"""Hardened wrap utility for PF-17 sweep.

Usage as module:
    from wrap_v2 import wrap_submit
    wrap_submit('/path/to/Tool.js', handler='generate', unique_text=None)

Or invoke as CLI for batch.
"""
import re, sys


# ─────────────────────────────────────────────────────────────────
# Handler matcher
# ─────────────────────────────────────────────────────────────────

def _handler_pattern(handler_spec):
    """Build a regex pattern that matches the handler in onClick={...}.

    handler_spec accepts:
      - 'generate'                   → matches `generate` (bare identifier)
      - '()=>startSession()'         → matches the literal arrow form
      - '() => startSession()'       → equivalent to above (whitespace-flexible)
      - 'obj.method'                 → matches member access

    Returns a compiled pattern that matches inside onClick={...}.
    """
    # Normalize whitespace in handler_spec: collapse all whitespace to single space
    normalized = re.sub(r'\s+', ' ', handler_spec.strip())

    # If it's a simple identifier or member access (no parens), match as word/dotted
    if re.fullmatch(r'[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*', normalized):
        # Bare handler — must match at word boundary
        return re.compile(
            r'<button\s+onClick=\{\s*' + re.escape(normalized) + r'\s*\}',
            re.DOTALL
        )

    # Otherwise: build a pattern from the spec, but make whitespace flexible
    # Escape regex metacharacters, then turn spaces into \s*
    escaped = re.escape(normalized).replace(r'\ ', r'\s*')
    return re.compile(
        r'<button\s+onClick=\{\s*' + escaped + r'\s*\}',
        re.DOTALL
    )


# ─────────────────────────────────────────────────────────────────
# Brace-balanced JSX walker
# ─────────────────────────────────────────────────────────────────

def find_button_block(text, handler_spec, start_pos=0, unique_text=None):
    """Find <button onClick={handler}...>...</button>.
    If unique_text is given, scan all matches and return the first whose
    button block contains unique_text (case-sensitive substring)."""
    pat = _handler_pattern(handler_spec)
    pos = start_pos
    while True:
        m = pat.search(text, pos)
        if not m:
            return None
        # Walk JSX brace depth to find matching </button>
        depth = 1
        i = m.end()
        n = len(text)
        end = None
        while i < n:
            nxt_open = text.find('<button', i)
            nxt_close = text.find('</button>', i)
            if nxt_close == -1:
                break
            if nxt_open != -1 and nxt_open < nxt_close:
                depth += 1
                i = nxt_open + len('<button')
            else:
                depth -= 1
                if depth == 0:
                    end = nxt_close + len('</button>')
                    break
                i = nxt_close + len('</button>')

        if end is None:
            pos = m.end()
            continue

        block = text[m.start():end]
        if unique_text is None or unique_text in block:
            return (m.start(), end, block)

        pos = end


# ─────────────────────────────────────────────────────────────────
# className extraction (balanced-brace, handles nested templates)
# ─────────────────────────────────────────────────────────────────

def extract_classname_text(button_block):
    """Extract the className expression's INNER text.

    Returns the contents inside className={...} as a string, or '' if not found.
    Handles nested braces and template literals.
    """
    cn_idx = button_block.find('className=')
    if cn_idx == -1:
        return ''
    i = cn_idx + len('className=')
    if i >= len(button_block) or button_block[i] != '{':
        return ''
    # Walk brace depth
    depth = 1
    i += 1
    start = i
    in_str = None  # tracks ', ", `
    while i < len(button_block):
        ch = button_block[i]
        if in_str:
            if ch == '\\':
                i += 2
                continue
            if ch == in_str:
                in_str = None
        else:
            if ch in ("'", '"', '`'):
                in_str = ch
            elif ch == '{':
                depth += 1
            elif ch == '}':
                depth -= 1
                if depth == 0:
                    return button_block[start:i]
        i += 1
    return ''


def parse_classname_components(cn_inner):
    """Pull py-X, rounded-X, min-h-[Xpx], w-full presence from className."""
    out = {'py': 'py-3', 'rounded': 'rounded-lg', 'min_h': '', 'has_w_full': False}
    if not cn_inner:
        return out
    py_m = re.search(r'\bpy-([\d.]+)\b', cn_inner)
    if py_m:
        out['py'] = f'py-{py_m.group(1)}'
    r_m = re.search(r'\brounded-([a-z0-9]+)\b', cn_inner)
    if r_m:
        out['rounded'] = f'rounded-{r_m.group(1)}'
    mh_m = re.search(r'min-h-\[\d+px\]', cn_inner)
    if mh_m:
        out['min_h'] = mh_m.group(0)
    out['has_w_full'] = bool(re.search(r'\bw-full\b', cn_inner))
    return out


# ─────────────────────────────────────────────────────────────────
# Indent helpers
# ─────────────────────────────────────────────────────────────────

def _line_indent(text, pos):
    """Return the indent (whitespace prefix) of the line containing pos."""
    line_start = text.rfind('\n', 0, pos) + 1
    line = text[line_start:pos]
    m = re.match(r'^[ \t]*', line)
    return m.group(0) if m else ''


# ─────────────────────────────────────────────────────────────────
# Public: wrap a single submit button
# ─────────────────────────────────────────────────────────────────

def wrap_submit(filepath, handler, unique_text=None, dry_run=False):
    """Wrap the submit button in flex+Try-example. Returns dict with status."""
    with open(filepath) as f:
        text = f.read()

    found = find_button_block(text, handler, unique_text=unique_text)
    if found is None:
        return {'ok': False, 'reason': f'handler {handler!r} not found'
                + (f' with unique_text {unique_text!r}' if unique_text else '')}
    start, end, button_block = found

    # Don't double-wrap: skip if Try example already adjacent
    nearby = text[end:end + 200]
    if 'loadExample' in nearby and 'Try example' in nearby:
        return {'ok': True, 'reason': 'already wrapped (skipped)', 'no_change': True}

    cn_inner = extract_classname_text(button_block)
    comp = parse_classname_components(cn_inner)

    # Modify submit's className: w-full → flex-1
    new_button = button_block
    if comp['has_w_full']:
        new_button = re.sub(r'\bw-full\b', 'flex-1', new_button, count=1)

    # Build Try example button matching submit's vertical sizing
    parts = ['px-4', comp['py'], comp['rounded'], 'text-xs', 'font-bold', '${c.btnSecondary}']
    if comp['min_h']:
        parts.append(comp['min_h'])
    cn_try = ' '.join(parts)

    # Use the indent of the line where the button STARTS as our base
    base_indent = _line_indent(text, start)
    inner_indent = base_indent + '  '

    try_button = (
        f'\n{inner_indent}<button\n'
        f'{inner_indent}  onClick={{loadExample}}\n'
        f'{inner_indent}  className={{`{cn_try}`}}\n'
        f'{inner_indent}>\n'
        f'{inner_indent}  Try example\n'
        f'{inner_indent}</button>'
    )

    wrapper_open = '<div className="flex gap-2">\n' + inner_indent
    wrapper_close = '\n' + base_indent + '</div>'

    replacement = wrapper_open + new_button + try_button + wrapper_close

    new_text = text[:start] + replacement + text[end:]

    if not dry_run:
        with open(filepath, 'w') as f:
            f.write(new_text)
    return {'ok': True, 'wrapped_at': start, 'comp': comp, 'no_change': False}


# ─────────────────────────────────────────────────────────────────
# Module self-test
# ─────────────────────────────────────────────────────────────────

if __name__ == '__main__':
    # Self-test cases
    cases = [
        # (label, html, handler, expected_match)
        ('plain identifier',
         '<button onClick={generate} disabled={loading}>Go</button>',
         'generate', True),
        ('arrow with empty call',
         '<button onClick={() => startSession()}\n  disabled={!x}>Run</button>',
         '() => startSession()', True),
        ('whitespace-flexible arrow',
         '<button onClick={()=>startSession()}>Run</button>',
         '() => startSession()', True),
        ('member access',
         '<button onClick={form.submit}>Submit</button>',
         'form.submit', True),
        ('mismatched handler',
         '<button onClick={handleA}>A</button><button onClick={handleB}>B</button>',
         'handleA', True),
        ('nested button (depth)',
         '<button onClick={a}><span><button>X</button></span> Y</button>',
         'a', True),
        ('className with nested template literal',
         '<button onClick={go} className={`bg-${isDark ? "zinc" : "white"} py-4 rounded-2xl w-full`}>Run</button>',
         'go', True),
    ]
    fails = 0
    for label, html, handler, expected in cases:
        found = find_button_block(html, handler)
        ok = bool(found) == expected
        print(f'  {"PASS" if ok else "FAIL"}: {label}')
        if not ok:
            fails += 1
    # className extraction tests
    block = '<button className={`bg-${isDark ? "zinc" : "white"} py-4 rounded-2xl w-full`}>X</button>'
    inner = extract_classname_text(block)
    expected_inner = '`bg-${isDark ? "zinc" : "white"} py-4 rounded-2xl w-full`'
    if inner == expected_inner:
        print('  PASS: nested-template className extraction')
    else:
        print(f'  FAIL: nested-template extraction got {inner!r}')
        fails += 1
    comp = parse_classname_components(inner)
    if comp['py'] == 'py-4' and comp['rounded'] == 'rounded-2xl' and comp['has_w_full']:
        print('  PASS: component parsing on nested-template')
    else:
        print(f'  FAIL: components: {comp}')
        fails += 1
    print(f'\n{len(cases) + 2 - fails} passed / {fails} failed')
    sys.exit(fails)
