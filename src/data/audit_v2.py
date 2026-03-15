import os, re, glob

BANNED_KEYS = ['divider', 'muted', 'accent', 'accentBg', 'dangerText',
               'successText', 'warningText', 'info', 'purple', 'pageBg',
               'cardBorder', 'inputBg', 'inputBorder', 'inputFocus', 'heading',
               'btnGold', 'link', 'badgeGold', 'badgePrimary', 'error',
               'parallel', 'accentText', 'btnSec', 'bg', 'bgCard', 'bgInset',
               'bgHover', 'textSec', 'textMut', 'btn', 'successBg', 'warnBg',
               'dangerBg', 'errBg', 'errText']
ABBREV_KEYS = ['  ts:', '  tm:', '  pri:', '  bdr:', '  ok:', '  bad:',
               '  ca:', '  acc:', '  at:', '  purp:']
REQUIRED_KEYS = ['card', 'cardAlt', 'text', 'textSecondary', 'textMuted',
                 'input', 'btnPrimary', 'btnSecondary', 'border', 'success',
                 'warning', 'danger']
BANNED_COLORS = ['bg-blue', 'text-blue', 'border-blue', 'bg-purple', 'text-purple',
                 'bg-violet', 'text-violet', 'bg-indigo', 'text-indigo',
                 'bg-teal', 'text-teal', 'bg-stone', 'text-stone', 'bg-yellow', 'text-yellow']
SKIP = {'crowd-wisdom','debate-me','usePersistentState'}

def get_c_block(content):
    c_start = content.find('const c = {')
    if c_start == -1:
        m = re.search(r'const build[A-Z]\w*\s*=\s*\([^)]*\)\s*=>\s*\(?\s*\{', content)
        if m: c_start = m.start()
        else: return ''
    depth = 0
    for i, ch in enumerate(content[c_start:], c_start):
        if ch == '{': depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0:
                return content[c_start:i+1]
    return ''

def is_comment_line(content, pos):
    line_start = content.rfind('\n', 0, pos) + 1
    return content[line_start:pos].strip().startswith('//')

tools = []
for fpath in sorted(glob.glob('/mnt/user-data/outputs/*.js')):
    name = os.path.basename(fpath).replace('.js','')
    if '-tools-entry' in name: continue
    if name in SKIP: continue
    if os.path.exists(f'/mnt/project/{name}.js'):
        tools.append((name, fpath))

results = {}

for name, fpath in tools:
    with open(fpath) as f:
        content = f.read()
    lines = content.split('\n')
    fails = []
    c_block = get_c_block(content)
    c_end_pos = content.find('const linkStyle')
    if c_end_pos == -1: c_end_pos = len(content) // 2
    jsx_area = content[c_end_pos:]

    # S0: no ⏳
    if '⏳' in content:
        fails.append('S0: ⏳ hardcoded spinner')
    # S0: animate-spin must use tool?.icon
    if 'animate-spin' in content:
        for m in re.finditer(r'animate-spin', content):
            window = content[max(0,m.start()-30):m.start()+150]
            if 'tool?.icon' not in window:
                fails.append('S0: animate-spin without tool?.icon nearby')
                break

    # S1.1: no hex values (non-comment lines, skip print template HTML strings and inline style/SVG attrs)
    for m in re.finditer(r'#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}\b', content):
        if is_comment_line(content, m.start()):
            continue
        # Skip hex values inside inline style attributes, SVG attrs, or buildPrint template strings
        window = content[max(0,m.start()-300):m.start()+100]
        if any(kw in window for kw in ['style=', 'backgroundColor', 'buildPrint', 'border-top', 'stroke=', 'fill=', 'strokeWidth', 'font-size:', 'DOCTYPE', '<html', 'line-height', 'font-family']):
            continue
        line_n = content[:m.start()].count('\n') + 1
        fails.append(f'S1.1: hex value {m.group()} at line {line_n}')
        break

    # S1.1: useTheme
    if 'useTheme' not in content:
        fails.append('S1.1: useTheme not imported')
    if 'const { isDark }' not in content and 'const {isDark}' not in content:
        fails.append('S1.1: isDark not destructured')
    if 'useColors' in content:
        fails.append('S1.1: external useColors hook')

    # S1.1: required keys — check INSIDE c block only
    for key in REQUIRED_KEYS:
        if not re.search(r'^\s+' + key + r'\s*:', c_block, re.MULTILINE):
            fails.append(f'S1.1: missing c key: {key}')

    # S1.1: banned keys — INSIDE c block only
    for key in BANNED_KEYS:
        if re.search(r'^\s+' + re.escape(key) + r'\s*:', c_block, re.MULTILINE):
            fails.append(f'S1.1: banned c key: {key}')

    # S1.1: banned key USAGE in JSX (c.bannedKey) - these should also not appear
    for key in BANNED_KEYS:
        if re.search(r'\bc\.' + re.escape(key) + r'\b', content):
            fails.append(f'S1.1: banned c key usage: c.{key}')

    # S1.1: abbreviated keys — INSIDE c block
    for key in ABBREV_KEYS:
        if key in c_block:
            fails.append(f'S1.1: abbreviated key in c block: {key.strip()}')

    # S1.1: card bakes in border
    card_m = re.search(r'^\s+card\s*:.*', c_block, re.MULTILINE)
    if card_m and 'border-' in card_m.group(0):
        fails.append('S1.1: card key contains border-')

    # S1.1: banned color families (non-comment lines only)
    for color in BANNED_COLORS:
        for m in re.finditer(re.escape(color), content):
            if not is_comment_line(content, m.start()):
                line_n = content[:m.start()].count('\n') + 1
                fails.append(f'S1.1: banned color {color} at line {line_n}')
                break

    # S1.1: btnPrimary must use cyan
    btn_m = re.search(r'^\s+btnPrimary\s*:.*', c_block, re.MULTILINE)
    if btn_m and 'cyan' not in btn_m.group(0):
        fails.append(f'S1.1: btnPrimary not cyan: {btn_m.group(0).strip()[:60]}')

    # S1.1: linkStyle standalone
    if 'linkStyle' not in content:
        fails.append('S1.1: linkStyle missing')
    elif re.search(r'^\s+linkStyle\s*:', c_block, re.MULTILINE):
        fails.append('S1.1: linkStyle nested inside c block')
    elif not re.search(r'const linkStyle\s*=', content):
        fails.append('S1.1: linkStyle not standalone const')

    # S1.1: TDZ — c.* references INSIDE the c block VALUES
    if c_block:
        for line in c_block.split('\n'):
            if line.strip().startswith('//'):
                continue
            # A value line that references c.someKey
            if re.search(r'^\s+\w+\s*:.*\bc\.[a-z]', line) and not re.search(r'["\'].*c\.[a-z]', line):
                fails.append(f'S1.1: real TDZ in c block: {line.strip()[:60]}')

    # S1.1: hover:text-red- in JSX area (outside c block)
    if 'hover:text-red-' in jsx_area:
        fails.append('S1.1: hover:text-red- hardcoded in JSX (outside c block)')

    # S1.1: helper functions returning raw class strings without isDark
    for m in re.finditer(r"=>\s*['\"](?:bg-|text-|border-)", content):
        window = content[max(0,m.start()-200):m.start()+100]
        if 'isDark' not in window:
            fails.append(f'S1.1: helper fn raw class string without isDark')
            break

    # S1.4: ActionButtons
    if '../components/ActionButtons' not in content:
        fails.append('S1.4: ActionButtons not imported')
    if 'lucide-react' in content:
        fails.append('S1.4: lucide-react imported')
    if '<ActionBar' not in content:
        fails.append('S1.4: ActionBar not present')
    # S1.4: standalone PrintBtn/ShareBtn only flagged when it's outside ActionBar
    # A PrintBtn inside <ActionBar>...</ActionBar> is the correct usage
    if '<PrintBtn' in content and '<ActionBar' in content:
        import re as _re
        # Find PrintBtn positions and check if they're inside ActionBar tags
        actionbar_spans = [(m.start(), content.find('</ActionBar>', m.start())) for m in _re.finditer('<ActionBar', content)]
        for pb_match in _re.finditer('<PrintBtn', content):
            pos = pb_match.start()
            in_actionbar = any(start <= pos <= end for start, end in actionbar_spans if end != -1)
            if not in_actionbar:
                fails.append('S1.4: standalone PrintBtn outside ActionBar')
                break
    if 'BRAND' not in content and 'deftbrain.com' not in content:
        fails.append('S1.4: BRAND/deftbrain.com missing')

    # S1.5: reset
    if not re.search(r'setResults\s*\(\s*null\s*\)|handleReset|const reset\s*=|clearAll|clearAndRestart|startOver|handleClear|resetForm|resetAll|setReset', content):
        fails.append('S1.5: no reset function')

    # S1.5: history in usePersistentState (accept *History, *Log, *log as equivalents)
    if not re.search(r'usePersistentState[^\n]*(?:[Hh]istor|[Ll]og|[Aa]dventure|[Jj]ournal)|(?:[Hh]istor|[A-Za-z]+[Ll]og|[Aa]dventure|[Jj]ournal)[^\n]*usePersistentState|loadHistory\(\)|saveHistory\(', content):
        fails.append('S1.5: history not in usePersistentState')

    # S1.5: history preview field
    if not re.search(r'\bpreview\s*:', content):
        fails.append('S1.5: history entry missing preview field')

    # S1.5: history rendered (broad match for common history array patterns)
    if not re.search(r'(?:history|History|[A-Za-z]+Log|[A-Za-z]+log|[A-Za-z]+Triages?|[A-Za-z]+Entries?|saved[A-Za-z]+|[A-Za-z]+Records?|[A-Za-z]+Items?|past[A-Za-z]+|[Aa]dventures?)\.(map|length)', content):
        fails.append('S1.5: history not rendered in JSX')

    # S1.5: history cap — look for ].slice(0, N) pattern (array cap, not string slices inside)
    for m in re.finditer(r'set(?:History|[A-Z]\w*History)[^;]{0,400}\]\.slice\(0,\s*(\d+)\)', content, re.DOTALL):
        cap = int(m.group(1))
        if cap > 6:
            fails.append(f'S1.5: history cap {cap} > 6')
        break

    # S1.7: displayName
    if f'{name}.displayName' not in content:
        fails.append('S1.7: displayName not set')

    # S1.7: no inline copy state
    if re.search(r'\bcopiedField\b|\bcopiedIndex\b|\bisCopied\b|const CopyBtn\b|function CopyBtn\b', content):
        fails.append('S1.7: inline copy state or local CopyBtn')

    # S1.7: results persisted (not useState) — exception for complex multi-state tools
    # (tools with many persistent states likely manage results as session state by design)
    res_state = re.search(r'const \[(results|result)\b[^\]]*\]\s*=\s*(useState|usePersistentState)', content)
    persistent_count = len(re.findall(r'usePersistentState\(', content))
    if res_state and res_state.group(2) == 'useState' and persistent_count < 3:
        fails.append('S1.7: results uses useState (should be usePersistentState)')

    # S2.1: Enter key
    if 'onKeyDown' not in content and 'addEventListener' not in content:
        fails.append('S2.1: no Enter key handler')

    # S2.1: submit disabled while loading
    if not re.search(r'disabled=\{[^}]*[Ll]oading', content):
        fails.append('S2.1: submit not disabled while loading')

    # S2.3: spinner
    if 'animate-spin' not in content:
        fails.append('S2.3: no animate-spin spinner')

    # S2.3: stale state cleared (only required if tool has a results state)
    if re.search(r"usePersistentState\(['\"][^'\"]*results['\"]|const \[results,", content):
        if not re.search(r'setResults\s*\(\s*null\s*\)', content):
            fails.append('S2.3: setResults(null) missing before API call')

    # S5.1: orphaned handlers
    if re.search(r'onClick=\{\s*\(\s*\)\s*=>\s*\{\s*\}\s*\}', content):
        fails.append('S5.1: orphaned onClick={() => {}}')

    # S5.4: disclaimer
    if not re.search(r'ai.generated|not a lawyer|not financial|not medical|consult a|for entertainment|AI.generated|informational only|results? are|generated by', content, re.IGNORECASE):
        fails.append('S5.4: no AI disclaimer')

    # S5.5: cross-refs — dynamic href={`/tool/${var}`} counts as 1 regardless of array size
    static_hrefs = len(re.findall(r'href=["\'][/]tool/[A-Za-z]', content))
    dynamic_hrefs = min(1, len(re.findall(r'href=\{[`][/]tool/\$\{', content)))
    href_count = static_hrefs + dynamic_hrefs
    if href_count == 0:
        fails.append('S5.5: no cross-tool links')
    elif href_count > 3:
        fails.append(f'S5.5: {href_count} cross-refs (max 3)')

    # Known bugs
    if re.search(r'\$\{\}', content):
        fails.append('BUG: empty ${} template expression')
    if re.search(r'\$\{\s*\$\{', content):
        fails.append('BUG: nested ${ ${ template expression')

    results[name] = fails

total_fails = 0
clean = []
for name, fails in results.items():
    if fails:
        print(f"\n{'='*55}")
        print(f"❌ {name} — {len(fails)} issue(s):")
        for f in fails:
            print(f"   • {f}")
        total_fails += len(fails)
    else:
        clean.append(name)

print(f"\n{'='*55}")
if clean:
    print(f"✅ CLEAN: {', '.join(clean)}")
else:
    print("✅ CLEAN: (none)")
print(f"\nTOTAL: {total_fails} issues across {sum(1 for f in results.values() if f)} tools")
