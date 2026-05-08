"""Unified runner: takes a tool spec, applies EXAMPLE + loadExample + button wrap.

Usage:
    from process_tool import process_tool
    spec = {
        'name': 'MyTool',
        'example': 'const EXAMPLE = { ... };\\n',
        'loader': '  const loadExample = useCallback(...);\\n',
        'load_marker': '  const buildFullText',  # insert loader BEFORE this
        'handler': 'generate',                    # for button wrap
        'unique_text': None,                      # optional disambiguator
    }
    result = process_tool(spec, working_dir='/home/claude/working')
"""
import re, os, sys
sys.path.insert(0, '/home/claude')
from wrap_v2 import wrap_submit


def insert_example_and_loader(filepath, name, example, loader, load_marker):
    with open(filepath) as f:
        content = f.read()

    log = []

    # 1. Insert EXAMPLE after BRAND (or before component declaration)
    if 'const EXAMPLE = {' in content:
        log.append('EXAMPLE already exists, skipped')
    else:
        brand_m = re.search(r"const BRAND\s*=\s*['\"][^'\"]*['\"];\s*\n", content)
        if brand_m:
            insert_pt = brand_m.end()
            content = content[:insert_pt] + '\n' + example + content[insert_pt:]
            log.append('EXAMPLE inserted after BRAND')
        else:
            cm = re.search(
                r'^(const|function)\s+' + re.escape(name) + r'\s*[=({]',
                content, re.MULTILINE
            )
            if cm:
                content = content[:cm.start()] + example + '\n' + content[cm.start():]
                log.append('EXAMPLE inserted before component decl')
            else:
                return {'ok': False, 'reason': 'no insertion anchor for EXAMPLE'}

    # 2. Insert loader before load_marker
    if 'const loadExample' in content:
        log.append('loadExample already exists, skipped')
    else:
        idx = content.find(load_marker)
        if idx == -1:
            return {'ok': False, 'reason': f'load_marker {load_marker!r} not found'}
        content = content[:idx] + loader + content[idx:]
        log.append(f'loadExample inserted before {load_marker!r}')

    with open(filepath, 'w') as f:
        f.write(content)

    return {'ok': True, 'log': log}


def ensure_use_callback_imported(filepath):
    """Add useCallback to React imports if missing."""
    with open(filepath) as f:
        content = f.read()
    # Find first import { ... } from 'react';
    m = re.search(r"^import\s+React\s*,\s*\{([^}]*)\}\s+from\s+['\"]react['\"];", content, re.MULTILINE)
    if not m:
        # Try: import { ... } from 'react';
        m = re.search(r"^import\s+\{([^}]*)\}\s+from\s+['\"]react['\"];", content, re.MULTILINE)
        if not m:
            return False
    inner = m.group(1)
    if 'useCallback' in inner:
        return True
    # Add useCallback
    new_inner = inner.rstrip().rstrip(',') + ', useCallback'
    new_import = m.group(0).replace(inner, new_inner, 1)
    content = content[:m.start()] + new_import + content[m.end():]
    with open(filepath, 'w') as f:
        f.write(content)
    return True


def process_tool(spec, working_dir='/home/claude/working'):
    name = spec['name']
    fp = os.path.join(working_dir, f'{name}.js')
    if not os.path.exists(fp):
        return {'ok': False, 'reason': 'file not found', 'tool': name}

    # Step 1: ensure useCallback in imports (loaders need it)
    ensure_use_callback_imported(fp)

    # Step 2: insert EXAMPLE + loadExample
    r1 = insert_example_and_loader(
        fp, name, spec['example'], spec['loader'], spec['load_marker']
    )
    if not r1['ok']:
        return {'ok': False, 'reason': r1['reason'], 'tool': name, 'phase': 'insert'}

    # Step 3: wrap button
    r2 = wrap_submit(fp, spec['handler'], unique_text=spec.get('unique_text'))
    if not r2['ok']:
        return {'ok': False, 'reason': r2['reason'], 'tool': name, 'phase': 'wrap', 'insert_log': r1['log']}

    return {
        'ok': True,
        'tool': name,
        'insert_log': r1['log'],
        'wrap': 'already wrapped (skipped)' if r2.get('no_change') else 'wrapped',
    }


if __name__ == '__main__':
    print('process_tool module loaded. Import and call process_tool(spec).')
