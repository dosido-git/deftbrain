#!/usr/bin/env python3
# v1.0 · 2026-04-20 · ground-zero baseline
"""
DeftBrain UX smoke-test catalog scanner.

Automates Phase 1 of the UX smoke-test playbook: greps every tool in the
catalog for six known behavioral anti-patterns that the compliance audit
(audit_v2-3.py) cannot catch by design.

Usage:
    python3 ux-smoke.py                   # scan all tools in src/tools/ and /mnt/project/
    python3 ux-smoke.py path/to/Foo.js    # scan a single file
    python3 ux-smoke.py --verbose         # include every hit's line number
    python3 ux-smoke.py --json            # machine-readable output

Output: per-tool flag counts, sorted by severity. Exit code = total flag count
(so CI can gate on it).
"""
import os, re, sys, glob, json

# ─── Anti-pattern definitions ─────────────────────────────────────────────
# Each pattern is a regex + a triage hint. Patterns are intentionally tight
# to minimize false positives — manual review is still required, but the
# signal-to-noise should be high.

PATTERNS = [
    {
        'id': 'clock-swap',
        'name': 'Clock-icon loading swap',
        'regex': re.compile(r"\?\s*'🕐'"),
        'fix': 'Wrap in <Spin on={loading} icon="<emoji>">Label</Spin>',
    },
    {
        'id': 'results-guard',
        'name': 'Panel silenced by !results guard',
        'regex': re.compile(r'show[A-Z]\w*\s*&&\s*!results\b'),
        'fix': 'Remove `&& !results`; toggle is sole gate on visibility',
    },
    {
        'id': 'relative-href',
        'name': 'Relative kebab-case href',
        'regex': re.compile(r'href=["\'][^/#\s"\'][a-z][a-z0-9-]*["\']'),
        'fix': 'Convert to absolute /PascalCase matching tools.js id',
    },
    {
        'id': 'template-relative-href',
        'name': 'Relative template-literal href',
        # Matches href={`...`} where the template does NOT start with / or ${
        'regex': re.compile(r'href=\{`(?!/|\$\{)[^`]+`\}'),
        'fix': 'Add leading slash and use PascalCase tool id',
    },
    {
        'id': 'lucide-react',
        'name': 'lucide-react import (banned)',
        'regex': re.compile(r"from\s+['\"]lucide-react['\"]"),
        'fix': 'Replace icon components with emoji in <span>',
    },
]

# Special per-file check: setTimeout count > clearTimeout count
def check_unpaired_timeout(content):
    st = len(re.findall(r'\bsetTimeout\s*\(', content))
    ct = len(re.findall(r'\bclearTimeout\s*\(', content))
    if st > ct:
        return [{'id': 'unpaired-setTimeout',
                 'name': 'Unpaired setTimeout',
                 'line': 0,
                 'detail': f'{st} setTimeout calls, {ct} clearTimeout calls',
                 'fix': 'Pair every setTimeout with a clearTimeout in effect cleanup'}]
    return []

# Weak signal: handlers that set a result without clearing first.
# High false-positive rate — flagged as "needs manual triage" only.
def check_stale_refetch(content):
    hits = []
    # Find `const handleX = async () => { ... setXResult(data) ... }` blocks.
    # Flag any where setXLoading(true) is NOT followed by setXResult(null) before the await.
    for m in re.finditer(r'(const\s+handle\w+\s*=\s*(?:async\s+)?\([^)]*\)\s*=>\s*\{[^{}]*?await[^}]*?\})', content, re.DOTALL):
        block = m.group(1)
        # Does this handler set a loading state and a result?
        has_loading = re.search(r'set\w+Loading\s*\(\s*true\s*\)', block)
        has_result  = re.search(r'set\w+Result\s*\(\s*[^n]', block)  # not null
        if not (has_loading and has_result):
            continue
        # Does it clear the result before the await?
        pre_await = block.split('await', 1)[0]
        if re.search(r'set\w+Result\s*\(\s*null\s*\)', pre_await):
            continue
        # Flag it
        handler_name = re.search(r'handle\w+', block)
        line_n = content[:m.start()].count('\n') + 1
        hits.append({
            'id': 'stale-refetch-candidate',
            'name': 'Potential stale result during refetch',
            'line': line_n,
            'detail': handler_name.group(0) if handler_name else '<unknown>',
            'fix': 'Call setXResult(null) immediately after setXLoading(true)',
        })
    return hits

# ─── Scan logic ───────────────────────────────────────────────────────────

# Files to exclude from scan — non-tool infrastructure
SKIP_BASENAMES = {
    'App', 'ActionBarContext', 'ActionButtons', 'BrandMark', 'DashBoard',
    'GlobalHeader', 'IconRenderer', 'ToolFinderWizard', 'ToolPageWrapper',
    'ToolRenderer', 'useClaudeAPI', 'useDocumentHead', 'usePersistentState',
    'useSurvivalMath', 'useTheme', 'imageCompression', 'rateLimiter',
    'server', 'index', 'tools',
}

def scan_file(path):
    """Return list of hits for one file."""
    try:
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
    except (IOError, UnicodeDecodeError) as e:
        return [{'id': 'read-error', 'name': 'File read error', 'line': 0, 'detail': str(e), 'fix': ''}]

    hits = []
    # Regex-based patterns
    for p in PATTERNS:
        for m in p['regex'].finditer(content):
            # Skip matches inside comments (// ...)
            line_start = content.rfind('\n', 0, m.start()) + 1
            line_prefix = content[line_start:m.start()].strip()
            if line_prefix.startswith('//'):
                continue
            line_n = content[:m.start()].count('\n') + 1
            hits.append({
                'id': p['id'],
                'name': p['name'],
                'line': line_n,
                'detail': m.group(0)[:80],
                'fix': p['fix'],
            })
    # Special checks
    hits.extend(check_unpaired_timeout(content))
    hits.extend(check_stale_refetch(content))
    return hits


def find_tool_files(arg=None):
    """Discover tool files. If a path is given, return that; else glob the usual locations."""
    if arg and os.path.isfile(arg):
        return [os.path.abspath(arg)]

    candidates = []
    for root in ['src/tools', '/mnt/project', '/mnt/user-data/outputs']:
        if os.path.isdir(root):
            candidates.extend(glob.glob(os.path.join(root, '*.js')))

    # Deduplicate by basename (prefer src/tools > /mnt/project)
    seen = {}
    for p in sorted(candidates):
        base = os.path.basename(p).replace('.js', '')
        if base in SKIP_BASENAMES:
            continue
        if base.startswith('.') or base.endswith('-entry'):
            continue
        # Keep first occurrence (src/tools wins due to sort order)
        seen.setdefault(base, p)
    return sorted(seen.values())


# ─── Output formatting ────────────────────────────────────────────────────

def format_text(results, verbose=False):
    """Render human-readable terminal output."""
    lines = []
    total_flags = 0

    # Sort tools by flag count, descending
    sorted_tools = sorted(results.items(), key=lambda kv: -len(kv[1]))

    priority = [(name, hits) for name, hits in sorted_tools if len(hits) >= 3]
    secondary = [(name, hits) for name, hits in sorted_tools if 1 <= len(hits) < 3]
    clean = [name for name, hits in sorted_tools if len(hits) == 0]

    def render_tool(name, hits):
        lines.append(f"\n  {name} — {len(hits)} flag{'s' if len(hits) != 1 else ''}")
        # Group hits by pattern id
        by_id = {}
        for h in hits:
            by_id.setdefault(h['id'], []).append(h)
        for pid, ph in by_id.items():
            lines.append(f"    • {ph[0]['name']} ({len(ph)}x)")
            if verbose:
                for h in ph:
                    lines.append(f"        line {h['line']}: {h['detail']}")
                lines.append(f"        fix: {ph[0]['fix']}")

    if priority:
        lines.append("=" * 60)
        lines.append(f"🎯 PRIORITY — Phase 3 click-test candidates ({len(priority)} tools)")
        lines.append("=" * 60)
        for name, hits in priority:
            render_tool(name, hits)
            total_flags += len(hits)

    if secondary:
        lines.append("\n" + "=" * 60)
        lines.append(f"⚠️  SECONDARY — Phase 4 spot-check candidates ({len(secondary)} tools)")
        lines.append("=" * 60)
        for name, hits in secondary:
            render_tool(name, hits)
            total_flags += len(hits)

    lines.append("\n" + "=" * 60)
    lines.append(f"✅ CLEAN — no UX anti-patterns detected ({len(clean)} tools)")
    lines.append("=" * 60)
    if verbose and clean:
        for name in clean:
            lines.append(f"    {name}")

    lines.append("")
    lines.append(f"TOTAL: {total_flags} flags across {len(priority) + len(secondary)} tools")
    lines.append(f"SCOPE: {len(results)} tools scanned")
    return '\n'.join(lines)


# ─── Entry point ──────────────────────────────────────────────────────────

def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    flags = [a for a in sys.argv[1:] if a.startswith('--')]
    verbose = '--verbose' in flags or '-v' in flags
    as_json = '--json' in flags

    path_arg = args[0] if args else None
    files = find_tool_files(path_arg)

    if not files:
        print("ERROR: no tool files found. Run from repo root or pass a file path.", file=sys.stderr)
        sys.exit(2)

    results = {}
    for f in files:
        name = os.path.basename(f).replace('.js', '')
        results[name] = scan_file(f)

    if as_json:
        print(json.dumps(results, indent=2))
    else:
        print(format_text(results, verbose=verbose))

    total_flags = sum(len(h) for h in results.values())
    sys.exit(total_flags)


if __name__ == '__main__':
    main()
