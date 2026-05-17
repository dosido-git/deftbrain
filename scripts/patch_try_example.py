#!/usr/bin/env python3
"""
patch_try_example.py
Moves "Try example" button to below tagline in all DeftBrain tool files.

Run from project root:
  python3 scripts/patch_try_example.py            # apply
  python3 scripts/patch_try_example.py --dry-run  # preview
"""
import re, sys
from pathlib import Path

DRY_RUN   = '--dry-run' in sys.argv
TOOLS_DIR = Path(__file__).parent.parent / 'src' / 'tools'

NEW_BUTTON = (
    "<button onClick={loadExample} disabled={loading} "
    "style={{ backgroundColor: (tool?.headerColor ?? '#888888') + '80' }} "
    "className={`mt-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border disabled:opacity-40 "
    "${isDark ? 'text-white border-white/40' : 'text-gray-800 border-transparent'}`}"
    ">Try example</button>"
)


def remove_example_button(lines):
    """Remove the old Try example <button> block. Returns new list or None."""
    onclick_idx = None
    for i, line in enumerate(lines):
        # Single-line: onClick and text on same line
        if 'onClick={loadExample}' in line and 'Try example' in line:
            return lines[:i] + lines[i+1:]
        if 'onClick={loadExample}' in line:
            onclick_idx = i
            break
    if onclick_idx is None:
        return None

    # Walk back to opening <button (max 5 lines)
    start = onclick_idx
    for i in range(onclick_idx, max(onclick_idx - 5, -1), -1):
        if '<button' in lines[i]:
            start = i
            break

    # Walk forward to </button> (max 8 lines)
    end = onclick_idx
    for i in range(onclick_idx, min(onclick_idx + 8, len(lines))):
        if '</button>' in lines[i]:
            end = i
            break

    block = '\n'.join(lines[start:end+1])
    if 'Try example' not in block:
        return None

    return lines[:start] + lines[end+1:]


def fix_flex_wrapper(lines):
    """Unwrap <div className="flex gap-2"> if loadExample no longer inside."""
    result = []
    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.lstrip()
        if stripped.startswith('<div className="flex gap-2">'):
            indent = line[:len(line) - len(stripped)]
            block = [line]
            j = i + 1
            depth = 1
            while j < len(lines) and depth > 0:
                if re.search(r'<div\b', lines[j]):
                    depth += 1
                if '</div>' in lines[j]:
                    depth -= 1
                block.append(lines[j])
                j += 1
            inner = block[1:-1]
            if 'loadExample' not in '\n'.join(inner):
                for ln in inner:
                    if ln.startswith(indent + '  '):
                        result.append(indent + ln[len(indent)+2:])
                    else:
                        result.append(ln)
                i = j
                continue
        result.append(line)
        i += 1
    return result


def patch_file(path):
    src = path.read_text(encoding='utf-8')

    if "(tool?.headerColor ?? '#888888') + '80'" in src:
        return False, 'already patched'
    if 'loadExample' not in src:
        return False, 'no loadExample'
    if 'Try example' not in src:
        return False, 'no Try example text'

    lines = src.splitlines()

    # Step 1: remove old button FIRST (before inserting new one)
    new_lines = remove_example_button(lines)
    if new_lines is None:
        return False, 'could not locate old Try example button'
    lines = new_lines

    # Step 2: insert new button after tagline line
    tagline_idx = next((i for i, l in enumerate(lines) if '{tool?.tagline' in l), None)
    # Fallback: hardcoded description <p> immediately after the title <h1>/<h2>
    if tagline_idx is None:
        title_idx = next((i for i, l in enumerate(lines) if ('{tool?.title' in l or '{tool?.icon' in l) and ('h1' in l or 'h2' in l)), None)
        if title_idx is not None:
            for i in range(title_idx + 1, min(title_idx + 5, len(lines))):
                if ('<p ' in lines[i] and ('textSecondary' in lines[i] or 'textMuted' in lines[i])):
                    tagline_idx = i
                    break
    if tagline_idx is None:
        return False, 'tagline line not found'
    indent = lines[tagline_idx][:len(lines[tagline_idx]) - len(lines[tagline_idx].lstrip())]
    lines.insert(tagline_idx + 1, indent + NEW_BUTTON)

    # Step 3: flex-1 -> w-full on submit button
    lines = [
        re.sub(r'(className=\{`)flex-1 ', r'\1w-full ', ln)
        if ('btnPrimary' in ln or 'btnDis' in ln) and 'flex-1' in ln else ln
        for ln in lines
    ]

    # Step 4: unwrap flex gap-2 div if loadExample no longer inside
# lines = fix_flex_wrapper(lines)  # disabled: caused JSX structural damage

    out = '\n'.join(lines)
    if src.endswith('\n') and not out.endswith('\n'):
        out += '\n'

    if out == src:
        return False, 'no changes produced'

    if not DRY_RUN:
        path.write_text(out, encoding='utf-8')

    return True, 'patched'


def main():
    if not TOOLS_DIR.exists():
        print(f'ERROR: tools dir not found: {TOOLS_DIR}')
        sys.exit(1)

    files = sorted(TOOLS_DIR.glob('*.js'))
    patched, skipped, failed = [], [], []

    for f in files:
        changed, reason = patch_file(f)
        if changed:
            patched.append((f.name, reason))
        elif reason in ('already patched', 'no loadExample', 'no Try example text'):
            skipped.append((f.name, reason))
        else:
            failed.append((f.name, reason))

    mode = 'DRY RUN -- ' if DRY_RUN else ''
    print(f'\n{mode}patch_try_example results\n{"=" * 50}')
    print(f'\nPatched ({len(patched)}):')
    for name, _ in patched:
        print(f'  OK  {name}')
    if failed:
        print(f'\nNeeds manual review ({len(failed)}):')
        for name, reason in failed:
            print(f'  !!  {name}  --  {reason}')
    print(f'\nSkipped ({len(skipped)}):')
    for name, reason in skipped:
        print(f'  --  {name}  ({reason})')
    print()

if __name__ == '__main__':
    main()
