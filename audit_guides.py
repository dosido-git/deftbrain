#!/usr/bin/env python3
"""
audit_guides.py — DeftBrain guides validator
=============================================
Usage:
    python3 audit_guides.py path/to/guide.html
    python3 audit_guides.py build/guides/         # audit whole tree
    python3 audit_guides.py                        # defaults to ./build/guides/

Follows the same pattern as audit_v2-3.py for tools.
Exit 0 = clean; exit 1 = violations found.
"""

import json
import os
import re
import sys
from pathlib import Path

# ---- Checks ----------------------------------------------------------------

REQUIRED_META_TAGS = [
    ('name',     'description'),
    ('property', 'og:type'),
    ('property', 'og:title'),
    ('property', 'og:description'),
    ('property', 'og:url'),
    ('property', 'og:image'),
    ('property', 'og:image:width'),
    ('property', 'og:image:height'),
    ('property', 'article:published_time'),
    ('property', 'article:modified_time'),
    ('property', 'article:section'),
    ('name',     'twitter:card'),
    ('name',     'twitter:image'),
]

REQUIRED_LINK_TAGS = ['canonical']


def find_meta(html, attr, value):
    """Return True if <meta {attr}='{value}' content='...'/> exists."""
    pattern = rf'<meta\s+[^>]*{re.escape(attr)}=["\']{re.escape(value)}["\'][^>]*content=["\']([^"\']*)["\']'
    return re.search(pattern, html, re.IGNORECASE)


def find_link(html, rel):
    pattern = rf'<link\s+[^>]*rel=["\']{re.escape(rel)}["\'][^>]*href=["\']([^"\']+)["\']'
    return re.search(pattern, html, re.IGNORECASE)


def extract_jsonld_blocks(html):
    blocks = re.findall(
        r'<script\s+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',
        html, re.DOTALL | re.IGNORECASE
    )
    return blocks


def expected_canonical(filepath, guides_root):
    """Derive the canonical URL a guide SHOULD declare from its filepath."""
    rel = Path(filepath).resolve().relative_to(Path(guides_root).resolve())
    slug_path = str(rel).replace(os.sep, '/').removesuffix('.html')
    return f'https://deftbrain.com/guides/{slug_path}'


def audit_file(filepath, guides_root):
    violations = []
    html = Path(filepath).read_text(encoding='utf-8')

    # --- 1. Required meta tags ---
    for attr, value in REQUIRED_META_TAGS:
        if not find_meta(html, attr, value):
            violations.append(f'missing <meta {attr}="{value}" ...>')

    # --- 2. Canonical link ---
    canonical_match = find_link(html, 'canonical')
    if not canonical_match:
        violations.append('missing <link rel="canonical">')
    else:
        declared = canonical_match.group(1)
        expected = expected_canonical(filepath, guides_root)
        if declared != expected:
            violations.append(
                f'canonical URL mismatch:\n    declared: {declared}\n    expected: {expected}'
            )

    # --- 3. Stylesheet reference ---
    if '/guides/guide.css' not in html:
        violations.append('not linking /guides/guide.css (shared stylesheet)')
    if '<style>' in html.lower():
        violations.append('inline <style> block present — all styles belong in /guides/guide.css')

    # --- 4. JSON-LD blocks parse and required types present ---
    blocks = extract_jsonld_blocks(html)
    types_found = []
    for i, block in enumerate(blocks, 1):
        try:
            parsed = json.loads(block)
            t = parsed.get('@type')
            types_found.append(t)
            if t == 'HowTo':
                steps = parsed.get('step', [])
                if not steps:
                    violations.append(f'JSON-LD HowTo block {i}: no steps')
                for j, step in enumerate(steps, 1):
                    text = step.get('text', '')
                    # Catch the truncation bug we saw in the first guide
                    if text and not re.search(r'[.!?]["\']?$', text.strip()):
                        violations.append(
                            f'JSON-LD HowTo step {j}: text not ending in sentence terminator '
                            f'(likely truncated): "...{text[-40:]}"'
                        )
        except json.JSONDecodeError as e:
            violations.append(f'JSON-LD block {i}: invalid JSON ({e})')

    if 'HowTo' not in types_found:
        violations.append('missing HowTo JSON-LD schema')
    if 'BreadcrumbList' not in types_found:
        violations.append('missing BreadcrumbList JSON-LD schema')

    # --- 5. DeftBrain brand markers in body ---
    if 'deftbrain.com' not in html.lower():
        violations.append('no deftbrain.com reference in document')
    if 'class="masthead"' not in html:
        violations.append('missing .masthead header')
    if 'class="footer-brand"' not in html:
        violations.append('missing .footer-brand element')

    # --- 6. CTA link uses PascalCase tool route, not /tool/ prefix ---
    cta_match = re.search(r'<a\s+href=["\'](/[^"\']+)["\'][^>]*class=["\']cta-btn["\']', html)
    if cta_match:
        cta_href = cta_match.group(1)
        if cta_href.startswith('/tool/'):
            violations.append(f'CTA uses /tool/ prefix (should be /PascalCase): {cta_href}')
        elif not re.match(r'^/[A-Z][A-Za-z0-9]+$', cta_href):
            violations.append(f'CTA href not in /PascalCase format: {cta_href}')

    # --- 7. Related-card hrefs point to guides that exist on disk ---
    related_refs = re.findall(
        r'<a\s+href=["\'](/guides/[^"\']+)["\'][^>]*class=["\']related-card["\']',
        html
    )
    for ref in related_refs:
        rel_path = ref.replace('/guides/', '')
        candidate_html = Path(guides_root) / (rel_path + '.html')
        candidate_index = Path(guides_root) / rel_path / 'index.html'
        if not candidate_html.exists() and not candidate_index.exists():
            violations.append(f'related-card link points to nonexistent guide: {ref}')

    # --- 8. No DEFTBRAIN_SLOT_* markers left over from template ---
    slot_markers = re.findall(r'DEFTBRAIN_SLOT_[A-Z0-9_]+', html)
    if slot_markers:
        uniques = sorted(set(slot_markers))
        violations.append(f'unfilled template slots: {", ".join(uniques)}')

    return violations


def find_targets(arg):
    """Accept a file, a directory, or nothing (default ./build/guides/)."""
    if arg is None:
        arg = 'build/guides'
    p = Path(arg)
    if p.is_file():
        return [p], p.parent
    if p.is_dir():
        files = [f for f in p.rglob('*.html') if f.name not in ('_template.html', 'index.html', '404.html')]
        return files, p
    print(f'✗ not found: {arg}', file=sys.stderr)
    sys.exit(2)


def main():
    arg = sys.argv[1] if len(sys.argv) > 1 else None
    targets, guides_root = find_targets(arg)

    if not targets:
        print('No guide files found.')
        sys.exit(0)

    total_violations = 0
    for fp in targets:
        violations = audit_file(fp, guides_root)
        rel = fp.relative_to(guides_root) if fp.is_relative_to(guides_root) else fp
        if violations:
            total_violations += len(violations)
            print(f'\n✗ {rel}  ({len(violations)} violation{"s" if len(violations) != 1 else ""})')
            for v in violations:
                print(f'    · {v}')
        else:
            print(f'✓ {rel}')

    print()
    if total_violations == 0:
        print(f'All {len(targets)} guide(s) clean.')
        sys.exit(0)
    else:
        print(f'{total_violations} total violation(s) across {len(targets)} file(s).')
        sys.exit(1)


if __name__ == '__main__':
    main()
