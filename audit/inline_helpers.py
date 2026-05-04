#!/usr/bin/env python3
"""
inline_helpers.py — inline MoneyDiplomat's Field, Select, Btn helper components.

Strategy: scan for opening tag `<Field ...`, balance braces to find the closing
` />`, parse props with a state machine (handles `{...}`, `"..."`, `<>...</>`),
emit inline JSX preserving indentation.
"""

import re
import sys

def find_call_sites(text, name):
    """Yield (start, end, indent) for each <name ... /> in text."""
    pattern = re.compile(r'(?P<indent>[ \t]*)<' + name + r'\b')
    i = 0
    while i < len(text):
        m = pattern.search(text, i)
        if not m:
            return
        start = m.start()
        indent = m.group('indent')
        # Walk forward, balancing braces, finding self-close ` />` or `>` opening.
        j = m.end()
        brace_depth = 0
        in_string = None  # ' or " or `
        while j < len(text):
            ch = text[j]
            if in_string:
                if ch == in_string:
                    in_string = None
                elif ch == '\\':
                    j += 1
                j += 1
                continue
            if ch in ('"', "'", '`'):
                in_string = ch
                j += 1
                continue
            if ch == '{':
                brace_depth += 1
            elif ch == '}':
                brace_depth -= 1
            elif brace_depth == 0:
                if ch == '/' and j + 1 < len(text) and text[j + 1] == '>':
                    yield (start, j + 2, indent)
                    i = j + 2
                    break
                if ch == '>':
                    # Non-self-closing — bail, this is an opening tag
                    raise ValueError(f"<{name}> at offset {start}: non-self-closing")
            j += 1
        else:
            return


def parse_props(props_text):
    """Parse JSX prop string into dict. Values keep their JSX form (raw)."""
    props = {}
    i = 0
    n = len(props_text)
    while i < n:
        # skip whitespace
        while i < n and props_text[i].isspace():
            i += 1
        if i >= n:
            break
        # parse key
        m = re.match(r'([A-Za-z_]\w*)\s*=', props_text[i:])
        if not m:
            break
        key = m.group(1)
        i += m.end()
        # parse value: either "string", {expr}, or true (no =)
        if i >= n:
            break
        if props_text[i] == '"':
            # string literal
            end = i + 1
            while end < n and props_text[end] != '"':
                if props_text[end] == '\\':
                    end += 1
                end += 1
            value = props_text[i:end + 1]  # include quotes
            props[key] = ('string', value)
            i = end + 1
        elif props_text[i] == "'":
            end = i + 1
            while end < n and props_text[end] != "'":
                if props_text[end] == '\\':
                    end += 1
                end += 1
            value = props_text[i:end + 1]
            props[key] = ('string', value)
            i = end + 1
        elif props_text[i] == '{':
            # JSX expression — balance braces
            depth = 1
            end = i + 1
            in_str = None
            while end < n and depth > 0:
                ch = props_text[end]
                if in_str:
                    if ch == in_str:
                        in_str = None
                    elif ch == '\\':
                        end += 1
                elif ch in ('"', "'", '`'):
                    in_str = ch
                elif ch == '{':
                    depth += 1
                elif ch == '}':
                    depth -= 1
                end += 1
            value = props_text[i:end]  # includes outer { }
            props[key] = ('expr', value)
            i = end
        else:
            # boolean prop
            props[key] = ('bool', 'true')
    return props


def label_to_inline(label_value):
    """Extract label content: 'string' → escaped text; '{<>X</>}' → X; '{X}' → {X}."""
    kind, val = label_value
    if kind == 'string':
        # val includes quotes; strip them, content goes inside <label>...</label>
        return val[1:-1]
    if kind == 'expr':
        inner = val[1:-1].strip()  # strip { }
        # Fragment: <>...</>
        m = re.match(r'<>(.*)</>$', inner, re.DOTALL)
        if m:
            return m.group(1).strip()
        # Plain expr: wrap in {}
        return '{' + inner + '}'
    return ''


def onchange_to_inline(onchange_value):
    """Convert onChange={setX} or onChange={v => fn(v)} to e => ...e.target.value."""
    kind, val = onchange_value
    if kind != 'expr':
        return val
    inner = val[1:-1].strip()
    # Bare identifier: setX → e => setX(e.target.value)
    if re.fullmatch(r'[A-Za-z_]\w*', inner):
        return '{e => ' + inner + '(e.target.value)}'
    # Arrow function `v => ...`: substitute v → e.target.value
    arrow_m = re.match(r'(\w+)\s*=>\s*(.+)', inner, re.DOTALL)
    if arrow_m:
        param = arrow_m.group(1)
        body = arrow_m.group(2)
        # Substitute param-name token → e.target.value (word boundaries to avoid
        # partial-match damage like `value` matching inside `valueOf`).
        sub = re.sub(r'\b' + re.escape(param) + r'\b', 'e.target.value', body)
        return '{e => ' + sub + '}'
    # Fallback: IIFE form (still functionally correct)
    return '{e => (' + inner + ')(e.target.value)}'


def emit_field_inline(props, indent):
    """Generate inline JSX for a <Field /> call."""
    label_inner = label_to_inline(props.get('label', ('string', '""')))
    value_expr = props['value'][1]  # raw, includes braces
    onchange_inline = onchange_to_inline(props['onChange'])
    has_rows = 'rows' in props
    rows_attr = f" rows={props['rows'][1]}" if has_rows else ''
    placeholder_attr = ''
    if 'placeholder' in props:
        kind, val = props['placeholder']
        placeholder_attr = f' placeholder={val}' if kind == 'expr' else f' placeholder={val}'
    type_attr = ''
    if not has_rows:
        if 'type' in props:
            type_attr = f' type={props["type"][1]}' if props['type'][0] == 'expr' else f' type={props["type"][1]}'
        else:
            type_attr = ' type="text"'

    label_jsx = f'<label className={{`text-[10px] font-bold ${{c.textMuted}} block mb-0.5`}}>{label_inner}</label>'

    if has_rows:
        ctrl = f'<textarea value={value_expr} onChange={onchange_inline}{rows_attr}{placeholder_attr} className={{`w-full p-2 border rounded-lg outline-none text-sm ${{c.input}}`}} />'
    else:
        ctrl = f'<input{type_attr} value={value_expr} onChange={onchange_inline}{placeholder_attr} className={{`w-full p-2 border rounded-lg outline-none text-sm ${{c.input}}`}} />'

    inner_indent = indent + '  '
    return f'{indent}<div>\n{inner_indent}{label_jsx}\n{inner_indent}{ctrl}\n{indent}</div>'


def emit_select_inline(props, indent):
    """Generate inline JSX for a <Select /> call."""
    label_inner = label_to_inline(props.get('label', ('string', '""')))
    value_expr = props['value'][1]
    onchange_inline = onchange_to_inline(props['onChange'])
    options_expr = props['options'][1]  # {[...]}

    label_jsx = f'<label className={{`text-[10px] font-bold ${{c.textMuted}} block mb-0.5`}}>{label_inner}</label>'
    select_jsx = (
        f'<select value={value_expr} onChange={onchange_inline} '
        f'className={{`w-full p-2 border rounded-lg outline-none text-sm ${{c.input}}`}}>\n'
    )
    inner_indent = indent + '  '
    deeper = indent + '    '
    map_line = (
        f'{deeper}{{{options_expr[1:-1]}.map(o => <option key={{o.value ?? o}} value={{o.value ?? o}}>{{o.label ?? o}}</option>)}}\n'
    )
    select_jsx += map_line + f'{inner_indent}</select>'
    return f'{indent}<div>\n{inner_indent}{label_jsx}\n{inner_indent}{select_jsx}\n{indent}</div>'


def _string_or_expr_inline(prop_value):
    """For props rendered as JSX text content: strip quotes if string, keep braces if expr."""
    kind, val = prop_value
    if kind == 'string':
        # Strip surrounding quotes; the content goes raw into JSX text.
        return val[1:-1]
    return val  # expr already has {}


def emit_btn_inline(props, indent):
    """Generate inline JSX for a <Btn /> call."""
    onclick = props['onClick'][1]
    disabled_attr = f' disabled={props["disabled"][1]}' if 'disabled' in props else ''
    # Color: if provided, use it directly; else default to c.btnPrimary.
    if 'color' in props:
        kind, val = props['color']
        color_inner = val[1:-1] if kind == 'expr' else val[1:-1]  # strip quotes or braces
        color_clause = '${' + color_inner + '}'
    else:
        color_clause = '${c.btnPrimary}'
    icon_inline = _string_or_expr_inline(props['icon'])
    label_inline = _string_or_expr_inline(props['label'])
    loading_expr = props.get('loading', ('expr', '{false}'))[1]
    tool_icon_expr = props.get('toolIcon', ('expr', "{tool?.icon}"))[1]
    loading_inner = loading_expr[1:-1]
    tool_icon_inner = tool_icon_expr[1:-1]

    return (
        f'{indent}<button onClick={onclick}{disabled_attr} '
        f'className={{`{color_clause} px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50 flex items-center gap-2`}}>\n'
        f'{indent}  {{{loading_inner} ? <span className="inline-block animate-spin">{{{tool_icon_inner} ?? \'⚙️\'}}</span> : <span>{icon_inline}</span>}}\n'
        f'{indent}  {label_inline}\n'
        f'{indent}</button>'
    )


def transform(text, name, emitter):
    """Replace all <name ... /> calls using emitter; return new text."""
    sites = list(find_call_sites(text, name))
    # Replace from end to start to keep offsets stable
    for start, end, indent in reversed(sites):
        original = text[start:end]
        # Strip leading indent from original to extract props
        # original looks like:  <Field c={c} label="X" ... />
        m = re.match(r'\s*<' + name + r'\b\s*(.*?)\s*/>\s*$', original, re.DOTALL)
        if not m:
            print(f'WARN: could not match {name} at {start}', file=sys.stderr)
            continue
        props_text = m.group(1)
        props = parse_props(props_text)
        # Drop c={c} prop — no longer needed in inlined JSX (uses ambient c)
        props.pop('c', None)
        new_jsx = emitter(props, indent)
        text = text[:start] + new_jsx + text[end:]
    return text


def remove_helper_definitions(text):
    """Remove function Field, Select, Btn definitions."""
    for name in ('Btn', 'Field', 'Select'):
        pattern = re.compile(
            r'function ' + name + r'\([^)]*\)\s*\{.*?^\}\s*\n\n',
            re.DOTALL | re.MULTILINE
        )
        text = pattern.sub('', text)
    return text


def main():
    if len(sys.argv) < 2:
        print('usage: inline_helpers.py <file>', file=sys.stderr)
        sys.exit(1)

    path = sys.argv[1]
    with open(path) as f:
        text = f.read()

    text = transform(text, 'Field', emit_field_inline)
    text = transform(text, 'Select', emit_select_inline)
    text = transform(text, 'Btn', emit_btn_inline)
    text = remove_helper_definitions(text)

    with open(path, 'w') as f:
        f.write(text)
    print(f'Inlined {path}')


if __name__ == '__main__':
    main()
