#!/usr/bin/env python3
"""
Phase 2: migrate `locale` → `userLanguage` in legacy backend routes.

Six files use the stale parameter name `locale` instead of `userLanguage`.
The frontend always sends `userLanguage` (per useClaudeAPI.js), so
`req.body.locale` is always undefined → silent broken localization
(prompts contain literal "undefined" or are never localized).

Transformations (applied in order):

  1. `withLanguage(locale)` → `withLanguage('', userLanguage)`
     The legacy antipattern — `const lang = withLanguage(locale)` was treating
     withLanguage as if it returned a directive string. With current signature
     `withLanguage(systemPrompt, userLanguage)`, calling it with `'', userLanguage`
     returns either '' (English) or the directive string. `${lang}` template
     usage downstream still works.

  2. `, locale)` → `, userLanguage)`
     Pattern X: two-arg withLanguage(prompt, locale). Frontend doesn't send
     `locale`, so renaming makes the data flow correctly.

  3. Within `const { ... } = req.body;` destructures (single or multi-line),
     standalone identifier `locale` → `userLanguage`. Bounded by word boundaries
     so `language` (a separate field in doctor-visit-prep) is not touched.

Validation:
  - node --check after every patch
  - re-run scan_userlang.py + deep audit checks after to confirm zero broken
"""
import re
import subprocess
import sys
from pathlib import Path

ROUTES_DIR = Path('/home/claude/routes_extracted/routes')
OUT_DIR    = Path('/home/claude/routes_phase2')
OUT_DIR.mkdir(exist_ok=True)

TARGET_FILES = [
    'brain-roulette.js',
    'brainstate-deejay.js',
    'decision-coach.js',
    'doctor-visit-prep.js',
    'final-wish.js',
    'six-degrees-of-me.js',
]


def patch_destructures(src):
    """
    Within each `const { ... } = req.body;` (possibly multi-line),
    rename standalone `locale` → `userLanguage`.

    Strategy: find each destructure block, replace `\blocale\b` only inside
    the braces. Multi-line destructures span braces over multiple lines; we
    use a non-greedy match for the brace contents.
    """
    DESTRUCTURE_RE = re.compile(
        r'(const\s*\{)([^}]*)(\}\s*=\s*req\.body)',
        re.DOTALL,  # let `.` match newlines for multi-line destructures
    )

    def rewrite(m):
        prefix, body, suffix = m.group(1), m.group(2), m.group(3)
        # Replace standalone `locale` with `userLanguage` inside the braces only.
        new_body = re.sub(r'\blocale\b', 'userLanguage', body)
        return f'{prefix}{new_body}{suffix}'

    return DESTRUCTURE_RE.sub(rewrite, src)


def patch_file(src):
    """Apply all three transformations in order."""
    n_changes = {}

    # Step 1: withLanguage(locale) — legacy single-arg antipattern
    pattern_1 = r'withLanguage\(locale\)'
    new_src, n1 = re.subn(pattern_1, "withLanguage('', userLanguage)", src)
    n_changes['withLanguage(locale) → withLanguage(\'\', userLanguage)'] = n1

    # Step 2: , locale) — Pattern X two-arg call closing
    pattern_2 = r', locale\)'
    new_src, n2 = re.subn(pattern_2, ', userLanguage)', new_src)
    n_changes[', locale) → , userLanguage)'] = n2

    # Step 3: destructure renames
    before_step3 = new_src
    new_src = patch_destructures(new_src)
    # Count by scanning destructures pre/post (rough proxy)
    n3 = before_step3.count('locale,') + before_step3.count(', locale\n') \
        - new_src.count('locale,') - new_src.count(', locale\n')
    # Cleaner: count occurrences of `locale` removed
    n3 = sum(1 for _ in re.finditer(r'\blocale\b', before_step3)) \
       - sum(1 for _ in re.finditer(r'\blocale\b', new_src))
    n_changes['destructure: locale → userLanguage'] = n3

    return new_src, n_changes


def main():
    total_changes = 0
    files_changed = 0

    for fname in TARGET_FILES:
        src_path = ROUTES_DIR / fname
        out_path = OUT_DIR / fname

        src = src_path.read_text(encoding='utf-8')
        new_src, n_changes = patch_file(src)

        print(f'\n[{fname}]')
        for label, n in n_changes.items():
            print(f'  {label}: {n}')

        # Sanity: any `locale` references left?
        residual = len(re.findall(r'\blocale\b', new_src))
        print(f'  residual `locale` references: {residual}')
        if residual:
            for m in re.finditer(r'\blocale\b', new_src):
                line_no = new_src[:m.start()].count('\n') + 1
                # Show the line for review
                line = new_src.split('\n')[line_no - 1].strip()
                print(f'    line {line_no}: {line[:80]}')

        if new_src != src:
            files_changed += 1
            total_changes += sum(n_changes.values())
            out_path.write_text(new_src, encoding='utf-8')
            r = subprocess.run(
                ['node', '--check', str(out_path)],
                capture_output=True, text=True,
            )
            if r.returncode != 0:
                print(f'  ❌ SYNTAX ERROR after patch:\n{r.stderr}')
                sys.exit(1)
            print(f'  ✓ syntax OK')

    print(f'\n=== summary ===')
    print(f'files changed: {files_changed}/{len(TARGET_FILES)}')
    print(f'total textual changes: {total_changes}')


if __name__ == '__main__':
    main()
