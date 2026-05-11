#!/usr/bin/env python3
"""
Cross-reference bug detector for DeftBrain tool catalog.

Catches three failure modes seen in batches 9-13:
  1. RELATIVE href (missing leading slash) — creates ghost URLs in production
       e.g. <a href="HecklerPrep">  →  /CurrentRoute/HecklerPrep (404)
  2. STALE href to a renamed tool — see RENAMES.md
       e.g. /DopamineMenuBuilder    →  should be /PEP
  3. ORPHAN href to a tool that doesn't exist in tools.js
       e.g. /DifficultTalkRehearser →  should be /DifficultTalkCoach

Usage:
    python3 crossref_sweep.py <tools_js_path> <dir1> [dir2] [dir3] ...

The script reads valid tool IDs from tools.js, parses any RENAMES.md found
alongside tools.js, then walks the given directories looking for .js files
with href references.
"""
import sys
import re
from pathlib import Path

if len(sys.argv) < 3:
    print(__doc__, file=sys.stderr)
    sys.exit(2)

tools_js = Path(sys.argv[1])
scan_dirs = [Path(d) for d in sys.argv[2:]]

if not tools_js.exists():
    print(f"❌ tools.js not found: {tools_js}", file=sys.stderr)
    sys.exit(1)

# ── Load valid tool IDs from tools.js ──
tools_text = tools_js.read_text(encoding='utf-8')
valid_ids = set(re.findall(r'^\s*id:\s*"([A-Za-z][A-Za-z0-9]*)"', tools_text, re.MULTILINE))
print(f"📚 Loaded {len(valid_ids)} valid tool IDs from {tools_js}")

# ── Load RENAMES.md if it exists alongside tools.js ──
renames = {}  # old → new
renames_path = tools_js.parent / 'RENAMES.md'
if renames_path.exists():
    rn_text = renames_path.read_text(encoding='utf-8')
    # Match table rows: | OldName | NewName | ...
    for m in re.finditer(r'^\|\s*([A-Za-z][A-Za-z0-9]*)\s*\|\s*([A-Za-z][A-Za-z0-9]*)\s*\|', rn_text, re.MULTILINE):
        old, new = m.group(1), m.group(2)
        if old in ('Old name',):  # skip header row
            continue
        renames[old] = new
    print(f"📋 Loaded {len(renames)} renames from RENAMES.md: " + ", ".join(f"{o}→{n}" for o, n in renames.items()))
else:
    print(f"⚠️  No RENAMES.md found at {renames_path}")

# ── Patterns ──
# Match: href="/PascalCase" or href="PascalCase" (relative — bug)
# Capture full attribute so we can report context
HREF_PATTERN = re.compile(r'''href\s*=\s*["']([^"']+)["']''')
# Match: href={`/${var}`} dynamic — skip these
DYNAMIC_PATTERN = re.compile(r'href=\{[`"\']/?\$\{')

# ── Scan ──
findings = {
    'relative': [],   # missing leading slash
    'renamed':  [],   # points to renamed tool
    'orphan':   [],   # not in tools.js, not renamed
}

js_files = []
for scan_dir in scan_dirs:
    if not scan_dir.exists():
        print(f"⚠️  Directory not found: {scan_dir}", file=sys.stderr)
        continue
    js_files.extend(scan_dir.glob('**/*.js'))

print(f"\n🔍 Scanning {len(js_files)} .js files...\n")

for js_file in js_files:
    # Skip the tools.js file itself
    if js_file.resolve() == tools_js.resolve():
        continue
    try:
        text = js_file.read_text(encoding='utf-8')
    except Exception as e:
        print(f"⚠️  Could not read {js_file}: {e}", file=sys.stderr)
        continue

    for line_no, line in enumerate(text.splitlines(), 1):
        for m in HREF_PATTERN.finditer(line):
            href = m.group(1)

            # Skip mailto:, tel:, http(s)://, anchor links, dynamic templates
            if href.startswith(('http://', 'https://', 'mailto:', 'tel:', '#', '?', '/api/', '/static/')):
                continue
            # Skip routes that aren't tool refs (lowercase first char = not a tool)
            target = href.lstrip('/')
            if not target or not target[0].isupper():
                continue
            # Strip query/anchor
            target = target.split('?')[0].split('#')[0].rstrip('/')
            # Strip subpaths — only the first segment is the tool
            target = target.split('/')[0]

            # Classify
            if not href.startswith('/'):
                # Relative href = ghost URL bug
                findings['relative'].append((js_file, line_no, href, target, line.strip()))
            elif target in renames:
                # Points to a renamed tool — should be updated
                findings['renamed'].append((js_file, line_no, href, target, renames[target], line.strip()))
            elif target not in valid_ids:
                # Not in tools.js and not a known rename = orphan
                findings['orphan'].append((js_file, line_no, href, target, line.strip()))

# ── Report ──
print("=" * 72)
total = sum(len(v) for v in findings.values())

if total == 0:
    print("✅ Clean — no cross-ref bugs detected")
    sys.exit(0)

print(f"❌ Found {total} cross-ref issue(s)\n")

if findings['relative']:
    print(f"🚨 RELATIVE HREFS ({len(findings['relative'])}) — ghost URL bugs in production")
    print("   These create paths like /CurrentRoute/{target} which 404")
    for f, ln, href, target, line in findings['relative']:
        print(f"   {f}:{ln}")
        print(f"      href=\"{href}\"  →  should be href=\"/{target}\"")
        print(f"      {line[:100]}{'…' if len(line) > 100 else ''}")
    print()

if findings['renamed']:
    print(f"🔄 RENAMED TOOLS ({len(findings['renamed'])}) — pointing to old name")
    for f, ln, href, target, new_name, line in findings['renamed']:
        print(f"   {f}:{ln}")
        print(f"      href=\"{href}\"  →  should be href=\"/{new_name}\"")
        print(f"      {line[:100]}{'…' if len(line) > 100 else ''}")
    print()

if findings['orphan']:
    print(f"❓ ORPHAN HREFS ({len(findings['orphan'])}) — target not in tools.js, not in RENAMES.md")
    for f, ln, href, target, line in findings['orphan']:
        print(f"   {f}:{ln}")
        print(f"      href=\"{href}\"  →  '{target}' not found")
        print(f"      {line[:100]}{'…' if len(line) > 100 else ''}")
    print()

print("=" * 72)
sys.exit(1)
