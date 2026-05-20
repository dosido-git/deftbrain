#!/usr/bin/env python3
"""
fix_pf12b_inplace.py — run from anywhere in the project
python3 src/tools/fix_pf12b_inplace.py
"""
import re
from pathlib import Path

script_dir = Path(__file__).parent
if (script_dir / 'EgoKiller.js').exists():
    tools_dir = script_dir
elif (Path.cwd() / 'src/tools').exists():
    tools_dir = Path.cwd() / 'src/tools'
else:
    tools_dir = script_dir

print(f"Looking in: {tools_dir.resolve()}")

RE_SETTER  = re.compile(r'\bsetHistory\b')
RE_VAR     = re.compile(r'(?<![-.\w])history\b')
RE_STR_VAL = re.compile(r"""(['"])history\1""")
RE_DECL    = re.compile(r'const\s*\[\s*history\s*,\s*setHistory\s*\]')
PLACEHOLDER = '\x00HIST\x00'

js_files = sorted(tools_dir.glob('*.js'))
print(f"Found {len(js_files)} .js files\n")

fixed = skipped = 0
for path in js_files:
    src = path.read_text(encoding='utf-8')

    if 'window.history' in src:
        print(f"  SKIPPED (window.history): {path.name}")
        skipped += 1
        continue

    # Run rename unconditionally
    out = RE_SETTER.sub('setSessionHistory', src)
    out = RE_STR_VAL.sub(lambda m: m.group(1) + PLACEHOLDER + m.group(1), out)
    out = RE_VAR.sub('sessionHistory', out)
    out = out.replace(PLACEHOLDER, 'history')
    out = RE_DECL.sub('const [sessionHistory, setSessionHistory]', out)

    if out != src:
        path.write_text(out, encoding='utf-8')
        fixed += 1
        print(f"  ✅ {path.name}")

print(f"\nFixed {fixed} files, skipped {skipped}. Run npm run build.")
