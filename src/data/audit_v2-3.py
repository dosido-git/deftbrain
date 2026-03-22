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
SKIP = {'crowd-wisdom','debate-me','usePersistentState','tools','ActionButtons','printBranding','BrandMark','GlobalHeader','ToolPageWrapper','server','index','rateLimiter','useTheme','useDocumentHead','useSurvivalMath','usePersistentState','imageCompression'}

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

# Load valid tool IDs from tools.js for cross-ref link validation
VALID_TOOL_IDS = set()
tools_js_path = '/mnt/project/tools.js'
if os.path.exists(tools_js_path):
    import re as _re2
    with open(tools_js_path) as f:
        _tools_js = f.read()
    VALID_TOOL_IDS = set(_re2.findall(r'id:\s*["\']([A-Za-z][A-Za-z0-9]+)["\']', _tools_js))

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

    # S0: icon placement — must be inline before title with mr-2, dynamic not hardcoded
    import re as _re
    # Check 1: h1/h2 must not contain bare string (non-JSX expression)
    # Only flag bare h1/h2 strings when tool?.title is absent (avoids flagging internal view headings)
    if 'tool?.title' not in content:
        bare_h = [m for m in _re.findall(r'<h[12][^>]*>([^\n{<]{3,})', content) if m.strip()]
        if bare_h:
            fails.append(f'S0: hardcoded text in h1/h2 (must use {{tool?.title}}): {bare_h[:2]}')
    # Check 2: mr-2 + tool?.icon must both exist somewhere in the file (multiline headers)
    if 'mr-2' not in content or 'tool?.icon' not in content:
        fails.append('S0: header missing icon pattern — use <span className="mr-2">{tool?.icon ?? fallback}</span>{tool?.title}')
    # Check 3: tool?.icon must appear at least twice (header + submit button)
    icon_count = content.count('tool?.icon')
    if icon_count < 2:
        fails.append(f'S0: tool?.icon appears only {icon_count} time(s) — must be in header AND submit button(s)')

    # S1.2: left-alignment — text-center banned on the tool page header (h2/tagline area)
    # Allowed on: result cards, metric callouts, verdict displays
    # Only flag text-center that is within the first 30 lines of the JSX return statement
    _lines_lc = content.split('\n')
    return_line = next((i for i, l in enumerate(_lines_lc) if 'return (' in l and i > len(_lines_lc)//3), None)
    if return_line:
        header_zone = _lines_lc[return_line:return_line+30]
        for i, line in enumerate(header_zone):
            if 'text-center' not in line or line.strip().startswith('//'):
                continue
            ctx = '\n'.join(header_zone[max(0,i-3):i+4])
            if re.search(r'<h[12]\b|tool\?\.title|tool\?\.tagline|tagline|<p[^>]*textSecondary', ctx):
                fails.append(f'S1.2: text-center near header/tagline at line {return_line+i+1} — page header must be left-aligned')
                break

    # S1.1: no hex values (non-comment lines, skip print template HTML strings and inline style/SVG attrs)
    for m in re.finditer(r'#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}\b', content):
        if is_comment_line(content, m.start()):
            continue
        # Skip Tailwind arbitrary hex values like bg-[#2a5248] or border-[#b8dcd8]
        if m.start() > 0 and content[m.start()-1] == '[':
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
    # Exclude matches that are inside a c-block string value (part of a textGhostDel-style key)
    import re as _re3
    for _m in _re3.finditer(r'hover:text-red-', jsx_area):
        _window = jsx_area[max(0,_m.start()-80):_m.start()]
        # Skip if it's inside a c-block value (key: isDark ? '...' pattern)
        if not _re3.search(r"(?:isDark\s*\?|:\s*')[^']*$", _window):
            fails.append('S1.1: hover:text-red- hardcoded in JSX (outside c block)')
            break

    # S1.1: helper functions returning raw class strings without isDark
    for m in re.finditer(r"=>\s*['\"](?:bg-|text-|border-)", content):
        window = content[max(0,m.start()-200):m.start()+100]
        if 'isDark' not in window:
            fails.append(f'S1.1: helper fn raw class string without isDark')
            break

    # S1.2: tool must not set background on root element — ToolPageWrapper owns the frame
    # Look for min-h-screen or bg-* on the first JSX return div (the tool's outermost element)
    return_match = re.search(r'return\s*\([\s\n]*<div\s+className=\{?[`"\']([^`"\'>{]+)', content)
    if return_match:
        root_classes = return_match.group(1)
        if re.search(r'min-h-screen|bg-white|bg-zinc|bg-slate|bg-gray|bg-stone|bg-gradient', root_classes):
            fails.append(f'S1.2: root div sets background color — remove it; ToolPageWrapper provides the frame (found: {root_classes[:60]})')

    # S1.4: ActionButtons
    if '../components/ActionButtons' not in content:
        fails.append('S1.4: ActionButtons not imported')
    if 'lucide-react' in content:
        fails.append('S1.4: lucide-react imported')
    # S1.4: ActionBar via useRegisterActions (v4.28+ standard)
    # ActionBar lives in ToolPageWrapper header — tools register content via hook, no inline <ActionBar>
    has_register = 'useRegisterActions' in content
    has_actionbar_import = 'ActionBarContext' in content
    has_inline_actionbar = bool(re.search(r'<ActionBar\b', content.replace('import', '')))

    if not has_register:
        fails.append('S1.4: useRegisterActions not called — ActionBar must be registered via useRegisterActions(content, title)')
    if not has_actionbar_import:
        fails.append('S1.4: ActionBarContext not imported — add: import { useRegisterActions } from \'../components/ActionBarContext\'')
    if has_inline_actionbar:
        fails.append('S1.4: inline <ActionBar> found in tool JSX — remove it; ToolPageWrapper renders ActionBar in the header via useRegisterActions')
    # S1.4: standalone PrintBtn is valid when used directly alongside CopyBtn
    # The real violation is custom window.open bypasses (caught by S1.4e below)
    if 'BRAND' not in content and 'deftbrain.com' not in content:
        fails.append('S1.4: BRAND/deftbrain.com missing')
    # S1.4e: no custom print bypass (must use ActionBar/PrintBtn, not manual window.open)
    if re.search(r"window\.open\s*\(", content):
        # Allow if it's inside a comment
        lines_with_open = [l for l in content.split('\n') if re.search(r"window\.open\s*\(", l) and not l.strip().startswith('//')]
        if lines_with_open:
            fails.append('S1.4e: custom window.open print bypass (use ActionBar/PrintBtn instead)')
    if re.search(r'buildPrint(Html|HTML|html)\s*=', content):
        fails.append('S1.4e: buildPrintHtml function (dead or active — remove, use ActionBar/PrintBtn)')
    if re.search(r'class=["\']branding["\']|className=["\']branding["\']', content):
        fails.append('S1.4e: hardcoded .branding div (remove, ActionBar provides branding footer)')

    # S1.4f: TDZ — plain const functions must not appear in useEffect dep arrays
    import re as _re2
    effect_blocks = _re2.findall(r'useEffect\s*\(\s*\(\s*\)\s*=>\s*\{.*?\}\s*,\s*\[([^\]]*)\]', content, _re2.DOTALL)
    for deps_str in effect_blocks:
        dep_names = [d.strip() for d in deps_str.split(',') if d.strip()]
        for dep in dep_names:
            # Check if dep is declared as a plain const fn (not a hook result)
            if _re2.search(rf'const {re.escape(dep)}\s*=\s*(async\s*)?\(', content):
                # Verify it's not a useCallback
                if not _re2.search(rf'const {re.escape(dep)}\s*=\s*useCallback', content):
                    fails.append(f'S1.4f: plain const fn "{dep}" in useEffect dep array (TDZ risk)')
                    break

    # S1.4g: locale 'default' — Safari crashes on toLocaleString('default', ...)
    if re.search(r"toLocaleString\s*\(\s*'default'", content) or re.search(r"toLocaleDateString\s*\(\s*'default'", content):
        fails.append("S1.4g: toLocaleString/toLocaleDateString('default') — use undefined or 'en' (Safari crash)")

    # S1.5: reset function exists
    reset_fn = re.search(r'setResults\s*\(\s*null\s*\)|handleReset|const reset\s*=|clearAll|clearAndRestart|startOver|handleClear|resetForm|resetAll|setReset', content)
    if not reset_fn:
        fails.append('S1.5: no reset function')
    else:
        # Reset must also be wired to a visible button in JSX
        reset_names = re.findall(r'const (reset\w*|handleReset\w*|startOver\w*|clearAll\w*|resetForm\w*|resetAndGoBack\w*)', content)
        reset_rendered = False
        for rn in reset_names:
            if re.search(rf'onClick={{[^}}]*{re.escape(rn)}', content):
                reset_rendered = True
                break
        # Also accept inline setResults(null) in onClick
        if re.search(r"onClick=\{[^}]*setResults\(null\)", content):
            reset_rendered = True
        if not reset_rendered:
            fails.append('S1.5: reset function defined but no onClick button renders it')

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

    # S2.1: Enter key — global document listener required
    has_global_listener = bool(re.search(r"document\.addEventListener\s*\(\s*['\"]keydown['\"]", content))
    has_meta = 'metaKey' in content
    has_ctrl = 'ctrlKey' in content
    if not has_global_listener:
        fails.append('S2.1: no global keydown listener — document.addEventListener(\'keydown\',...) required')
    elif not has_meta or not has_ctrl:
        fails.append('S2.1: global keydown listener missing metaKey and/or ctrlKey check (must handle both Mac and Windows)')
    else:
        # S2.1: TEXTAREA guard bug — handler must NOT block Cmd/Ctrl+Enter from textareas.
        # Bad pattern: TEXTAREA in an unconditional early-return (no metaKey/ctrlKey check on same line)
        # Good pattern: if (tag === 'TEXTAREA' && !e.metaKey && !e.ctrlKey) return;  ← already gated
        for m in re.finditer(r"if\s*\([^)]*TEXTAREA[^)]*\)\s*return", content):
            guard_line = content[m.start():m.end()]
            # If the guard itself contains metaKey or ctrlKey, it's already properly gated — skip
            if 'metaKey' in guard_line or 'ctrlKey' in guard_line:
                continue
            # Verify this is inside a keydown handler context
            window_start = max(0, m.start() - 600)
            window = content[window_start:m.start()]
            if 'keydown' in window or 'metaKey' in window or 'ctrlKey' in window:
                fails.append('S2.1: TEXTAREA included in unconditional early-return guard — Cmd/Ctrl+Enter is blocked from textareas. Use: if (tag === \'TEXTAREA\' && !e.metaKey && !e.ctrlKey) return;')
                break

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

    # S5.5: cross-refs
    # Split at the first JSX results conditional block (not state declarations).
    # Look for patterns like: {results && (, results && (, {result && ( — JSX conditionals
    href_pattern = r'href=["\'][/][A-Za-z]|href=\{[`][/]\$?\{?[A-Za-z]'

    # Find JSX results conditional — must be followed by ( or <, not = or ,
    results_jsx = re.search(r'\{?\s*(?:\(\s*)?(?<![!])(?:results|result)\b[^=\n]{0,40}&&\s*[(<r]', content)
    if results_jsx:
        pre_content = content[:results_jsx.start()]
        post_content = content[results_jsx.start():]
    else:
        pre_content = content
        post_content = ''

    pre_hrefs = len(re.findall(href_pattern, pre_content))
    post_hrefs_raw = re.findall(href_pattern, post_content)
    # Dynamic array refs count as 1
    dynamic_count = len(re.findall(r'href=\{[`][/]\$?\{?[A-Za-z]', post_content))
    post_hrefs = (len(post_hrefs_raw) - dynamic_count) + min(1, dynamic_count)

    total_hrefs = pre_hrefs + post_hrefs

    if total_hrefs == 0:
        fails.append('S5.5: no cross-tool links at all — add pre-result and post-result refs')
    else:
        if pre_hrefs == 0:
            fails.append('S5.5: no pre-result cross-ref — add a tool link visible before submit (e.g. "Need X first? Try [Tool]")')
        if post_hrefs == 0:
            fails.append('S5.5: no post-result cross-ref — add a tool link inside the results block (e.g. "Next step: [Tool]")')
        if total_hrefs > 3:
            fails.append(f'S5.5: {total_hrefs} cross-refs (max 3 total)')


    # S5.5: cross-ref link validity — check all static /ToolId hrefs resolve to a real tool in tools.js
    # Only checks plain string hrefs (href="/ToolId"), not template literals
    if VALID_TOOL_IDS:
        for tool_id in re.findall(r'href=["\'][/]([A-Za-z][A-Za-z0-9]+)["\']', content):
            if tool_id not in VALID_TOOL_IDS:
                fails.append(f'S5.5: cross-ref link /{tool_id} does not exist in tools.js — broken link')

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
