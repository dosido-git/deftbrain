#!/usr/bin/env python3
"""
Patcher: fix the userLanguage-not-defined bug across affected route files.

Strategy:
  For each broken file, walk handler-by-handler. A "handler" begins at a
  `router.post(...)` or `router.get(...)` line and runs until the next
  router invocation or end-of-file.

  For each handler:
    1. If it contains `withLanguage(` AND `userLanguage` is not already
       extracted (via destructure or req.body.userLanguage), then add
       `userLanguage` to the FIRST `const {...} = req.body` destructure
       found in the handler.
    2. JS scope rules mean a destructure at the top of the handler is
       visible to all nested if/else branches, so we don't need to walk
       every nested destructure — patching the outermost one is sufficient.

Safety:
  - Idempotent: re-running on already-patched files makes no changes.
  - Does NOT touch handlers that don't call withLanguage.
  - Does NOT touch destructures that already include userLanguage.
  - Validates JS syntax via `node --check` after patching.
"""
import re
import subprocess
import sys
from pathlib import Path

ROUTES_DIR = Path('/home/claude/routes_extracted/routes')
OUT_DIR    = Path('/home/claude/routes_patched')
OUT_DIR.mkdir(exist_ok=True)

BROKEN = [
    'doctor-visit-translator.js',
    'dream-pattern-spotter.js',
    'email-urgency-triager.js',
    'leverage-logic.js',
    'markup-detective.js',
    'meeting-hijack-preventer.js',
    'nerve-check.js',
    'renters-deposit-saver.js',
    'sensory-minefield-mapper.js',
    'subscription-guilt-trip.js',
]

ROUTER_RE = re.compile(r'^router\.(post|get|put|delete|patch)\b', re.MULTILINE)
DESTRUCTURE_LINE_RE = re.compile(
    # Match `const { ...identifiers... } = req.body;` (single line, possibly indented)
    # Captures: leading whitespace, the open brace + content, the close brace + tail
    r'^(\s*)const\s*\{([^}]*)\}\s*=\s*req\.body\s*;',
    re.MULTILINE,
)
WITH_LANGUAGE_RE = re.compile(r'\bwithLanguage\s*\(')
HAS_USERLANG_DESTRUCT_RE = re.compile(r'\buserLanguage\b')


def split_handlers(src):
    """Yield (start_idx, end_idx) byte offsets for each handler block."""
    matches = list(ROUTER_RE.finditer(src))
    if not matches:
        return
    for i, m in enumerate(matches):
        start = m.start()
        end   = matches[i + 1].start() if i + 1 < len(matches) else len(src)
        yield start, end


def patch_handler(handler_src):
    """
    If handler uses withLanguage and doesn't already extract userLanguage,
    add userLanguage to the first `const {...} = req.body` destructure.
    Returns (new_handler_src, was_patched, reason).
    """
    if not WITH_LANGUAGE_RE.search(handler_src):
        return handler_src, False, 'no withLanguage call'

    # Already has userLanguage somewhere as a destructure or req.body access?
    # Check destructures first.
    for dm in DESTRUCTURE_LINE_RE.finditer(handler_src):
        body = dm.group(2)
        if HAS_USERLANG_DESTRUCT_RE.search(body):
            return handler_src, False, 'userLanguage already destructured'
    # Check direct req.body.userLanguage or req.userLanguage usage
    if re.search(r'req\.body\.userLanguage\b|req\.userLanguage\b', handler_src):
        return handler_src, False, 'userLanguage already accessed via req'

    # Find the first destructure and add userLanguage to it
    m = DESTRUCTURE_LINE_RE.search(handler_src)
    if not m:
        return handler_src, False, 'NO DESTRUCTURE FOUND — manual review needed'

    indent = m.group(1)
    body   = m.group(2).strip()
    # Build new destructure preserving original indent and a trailing newline shape
    if not body:
        # `const { } = req.body;` — unusual, but handle it
        new_decl = f'{indent}const {{ userLanguage }} = req.body;'
    else:
        # Keep existing fields; append userLanguage with comma + space
        # Trim trailing comma in body (rare but possible)
        body_clean = body.rstrip(', \t')
        new_decl = f'{indent}const {{ {body_clean}, userLanguage }} = req.body;'

    new_handler = handler_src[:m.start()] + new_decl + handler_src[m.end():]
    return new_handler, True, 'patched'


def patch_file(src):
    """Walk handlers, patch each, return (new_src, num_handlers_patched, log)."""
    handler_spans = list(split_handlers(src))
    if not handler_spans:
        return src, 0, ['no router handlers found']

    # Build new source by reassembling: pre-handler prelude + each (possibly
    # patched) handler block.
    log = []
    out_parts = []
    prelude_end = handler_spans[0][0]
    out_parts.append(src[:prelude_end])
    patched_count = 0
    for idx, (start, end) in enumerate(handler_spans):
        chunk = src[start:end]
        new_chunk, was_patched, reason = patch_handler(chunk)
        log.append(f'  handler #{idx + 1}: {reason}')
        if was_patched:
            patched_count += 1
        out_parts.append(new_chunk)

    return ''.join(out_parts), patched_count, log


def main():
    total_patched_handlers = 0
    files_changed = 0

    for fname in BROKEN:
        src_path = ROUTES_DIR / fname
        out_path = OUT_DIR / fname

        src = src_path.read_text(encoding='utf-8')
        new_src, n_patched, log = patch_file(src)

        print(f'\n[{fname}]  ({n_patched} handlers patched)')
        for line in log:
            print(line)

        if new_src != src:
            files_changed += 1
            total_patched_handlers += n_patched
            out_path.write_text(new_src, encoding='utf-8')
            # syntax validation
            r = subprocess.run(
                ['node', '--check', str(out_path)],
                capture_output=True, text=True,
            )
            if r.returncode != 0:
                print(f'  ❌ SYNTAX ERROR after patch:\n{r.stderr}')
                sys.exit(1)
            print(f'  ✓ syntax OK')
        else:
            print(f'  (no change)')

    print(f'\n=== summary ===')
    print(f'files changed:    {files_changed}/{len(BROKEN)}')
    print(f'handlers patched: {total_patched_handlers}')

if __name__ == '__main__':
    main()
