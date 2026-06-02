import re, os
RD='routes/routes'
HELPERS=['callClaudeWithRetry','cleanJsonResponse','withLanguage','withLocaleContext','anthropic']
hits=[]
for fn in sorted(os.listdir(RD)):
    if not fn.endswith('.js'): continue
    src=open(os.path.join(RD,fn)).read()
    # what's imported from lib/claude
    imp=set()
    m=re.search(r"const\s*\{([^}]+)\}\s*=\s*require\('\.\./lib/claude'\)",src)
    if m:
        imp={x.strip() for x in m.group(1).split(',')}
    for h in HELPERS:
        # is it CALLED/used (not in the import line) but NOT imported?
        used = re.search(rf'\b{h}\s*\(', src) if h!='anthropic' else re.search(r'\banthropic\.', src)
        if used and h not in imp:
            hits.append((fn,h))
if hits:
    print("🔴 FILES CALLING A lib/claude HELPER THEY DON'T IMPORT (deterministic 500s):")
    for fn,h in hits: print(f"   {fn:<34} missing import: {h}")
else:
    print("✅ No missing-import bugs across the catalog.")
print(f"\nScanned {len([f for f in os.listdir(RD) if f.endswith('.js')])} route files.")
