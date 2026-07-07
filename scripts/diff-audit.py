#!/usr/bin/env python3
"""diff-audit — turnkey differential audit (working tree vs. git HEAD).

Replaces the manual `edit/`/`pristine/` staging described in older handoffs.
The pristine baseline is pulled straight from git HEAD, so there is nothing to
stage by hand: point it at one or more tool/route files and it reports which
audit issues are NEW in your working tree (regressions) versus already present
in the committed version (pre-existing, not your fault) or FIXED by your edit.

  python3 scripts/diff-audit.py src/tools/RoommateCourt.js
  python3 scripts/diff-audit.py backend/routes/lease-trap-detector.js
  python3 scripts/diff-audit.py src/tools/*.js

The baseline ref defaults to HEAD (dev use: catch uncommitted regressions).
Pass `--base <ref>` to compare against a different commit — the pre-push hook
uses the upstream/remote ref so it gates only what the push introduces:

  python3 scripts/diff-audit.py --base origin/main src/tools/Foo.js

Audit script is chosen by path:
  backend/routes/*.js -> audit/backend_audit_v1_7.py
  everything else     -> audit/audit_v2-3-2.py

Exit code: 0 if no file gained a new issue, 1 if any did (so it can gate a push).
The name-keyed audits identify a tool by basename, so the pristine copy is
written to a temp dir under its ORIGINAL basename to keep that keying intact.
"""
import os
import re
import sys
import subprocess
import tempfile
from collections import Counter

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_AUDIT = os.path.join(REPO, 'audit', 'audit_v2-3-2.py')
BACKEND_AUDIT = os.path.join(REPO, 'audit', 'backend_audit_v1_7.py')

ISSUE_RE = re.compile(r'^\s*•\s*(.+?)\s*$')


def audit_script_for(relpath):
    norm = relpath.replace(os.sep, '/')
    return BACKEND_AUDIT if norm.startswith('backend/routes/') else FRONTEND_AUDIT


def run_audit(script, filepath):
    """Run an audit script on a file; return a Counter of issue lines."""
    proc = subprocess.run(
        [sys.executable, script, filepath],
        cwd=REPO, capture_output=True, text=True,
    )
    issues = Counter()
    for line in proc.stdout.splitlines():
        m = ISSUE_RE.match(line)
        if m:
            issues[m.group(1)] += 1
    return issues


def git_show(relpath, ref='HEAD'):
    """Return the blob for relpath at ref, or None if not tracked there."""
    proc = subprocess.run(
        ['git', 'show', f'{ref}:{relpath}'],
        cwd=REPO, capture_output=True, text=True,
    )
    return proc.stdout if proc.returncode == 0 else None


def diff_one(relpath, base='HEAD'):
    abspath = os.path.join(REPO, relpath)
    if not os.path.isfile(abspath):
        # Deleted file (present in the diff vs base but gone from the working
        # tree). A file that no longer exists can't introduce new issues, so
        # it passes — don't fail the gate on a legitimate deletion.
        print(f'• {relpath}: deleted — skipped (no new issues possible)')
        return True

    script = audit_script_for(relpath)
    current = run_audit(script, abspath)

    pristine_src = git_show(relpath, base)
    if pristine_src is None:
        # New / untracked file at `base` — no baseline to diff against.
        print(f'• {relpath}: no {base} baseline (new file) — {sum(current.values())} '
              f'current issue(s), nothing to compare')
        for issue, n in sorted(current.items()):
            print(f'    current: {issue}' + (f' (x{n})' if n > 1 else ''))
        return True  # not a regression: there is no baseline it could regress from

    basename = os.path.basename(relpath)
    with tempfile.TemporaryDirectory() as td:
        baseline_path = os.path.join(td, basename)  # preserve basename for name-keying
        with open(baseline_path, 'w', encoding='utf-8') as fh:
            fh.write(pristine_src)
        baseline = run_audit(script, baseline_path)

    new = current - baseline      # issues introduced in working tree
    fixed = baseline - current    # issues resolved in working tree

    if not new and not fixed:
        print(f'✓ {relpath}: no change ({sum(current.values())} pre-existing issue(s))')
        return True

    status = '✗' if new else '✓'
    print(f'{status} {relpath}: '
          f'{sum(new.values())} new, {sum(fixed.values())} fixed, '
          f'{sum((current & baseline).values())} pre-existing')
    for issue, n in sorted(new.items()):
        print(f'    NEW:   {issue}' + (f' (x{n})' if n > 1 else ''))
    for issue, n in sorted(fixed.items()):
        print(f'    fixed: {issue}' + (f' (x{n})' if n > 1 else ''))
    return not new


def main(argv):
    base = 'HEAD'
    files = []
    it = iter(argv)
    for arg in it:
        if arg in ('--base', '-b'):
            base = next(it, 'HEAD')
        elif arg.startswith('--base='):
            base = arg.split('=', 1)[1]
        else:
            files.append(arg)
    if not files:
        print(__doc__)
        return 2
    ok = True
    for arg in files:
        relpath = os.path.relpath(os.path.abspath(arg), REPO)
        ok = diff_one(relpath, base) and ok
    print()
    print('RESULT: ' + ('no regressions' if ok else 'NEW ISSUES INTRODUCED'))
    return 0 if ok else 1


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
