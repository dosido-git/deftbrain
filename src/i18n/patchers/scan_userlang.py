#!/usr/bin/env python3
"""
Scan all route files for the userLanguage destructure bug.

A route is BROKEN if it:
  1. Uses `userLanguage` somewhere (typically inside withLanguage()), AND
  2. Does NOT destructure userLanguage from req.body
     - either via destructuring: `const { ..., userLanguage, ... } = req.body`
     - or direct member: `req.body.userLanguage`

A route is CLEAN if either:
  - It doesn't use userLanguage at all (no i18n needed), OR
  - It does and properly extracts it from req.body

Note: a route could also receive userLanguage as a function parameter or
get it from middleware (req.userLanguage), so we check those patterns too.
"""
import re
from pathlib import Path

ROUTES_DIR = Path('/home/claude/routes_extracted/routes')

# Match destructure-from-req.body that includes userLanguage
DESTRUCTURE_RE = re.compile(
    r'const\s*\{[^}]*\buserLanguage\b[^}]*\}\s*=\s*req\.body'
)
# Match direct member access
DIRECT_RE = re.compile(r'req\.body\.userLanguage\b')
# Match middleware-set req.userLanguage (rare but possible)
MIDDLEWARE_RE = re.compile(r'req\.userLanguage\b')
# Match any use of the bare identifier `userLanguage`
USE_RE = re.compile(r'\buserLanguage\b')

broken = []
clean_with_i18n = []
clean_no_i18n = []

for f in sorted(ROUTES_DIR.glob('*.js')):
    src = f.read_text(encoding='utf-8')
    uses = bool(USE_RE.search(src))
    if not uses:
        clean_no_i18n.append(f.name)
        continue

    has_destructure = bool(DESTRUCTURE_RE.search(src))
    has_direct = bool(DIRECT_RE.search(src))
    has_middleware = bool(MIDDLEWARE_RE.search(src))

    if has_destructure or has_direct or has_middleware:
        clean_with_i18n.append(f.name)
    else:
        # Uses userLanguage but never extracts it — broken
        broken.append(f.name)

print(f'Total routes scanned: {len(list(ROUTES_DIR.glob("*.js")))}')
print(f'  Clean (no i18n needed):     {len(clean_no_i18n)}')
print(f'  Clean (i18n + destructure): {len(clean_with_i18n)}')
print(f'  BROKEN (i18n, no extract):  {len(broken)}')
print()
if broken:
    print('=== BROKEN FILES ===')
    for name in broken:
        print(f'  {name}')
