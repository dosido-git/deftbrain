# v1.9 · 2026-05-03 · PF-16 split regex broadened to recognize render-helper
#                     pattern `{results && renderResults()}` (and renderOutput,
#                     renderAnswer, etc.). Previously the split regex required
#                     `(` or `<` after `&&`, missing tools that delegate body
#                     rendering to a helper function. Catalog re-sweep on
#                     2026-05-03 surfaced 9 such tools, all verified clean
#                     (reset in canonical header position above render call).
#                     This patch closes the hole for future drift.
# v1.8 · 2026-05-02 · session backlog burndown:
#                     (1) added 'accentTxt' to S1.1k _CONVENTION_KEYS whitelist
#                     — PF-2 canonical block includes accentTxt and 39 tools
#                     use it, but the whitelist omitted it, causing false
#                     positives on tools that copied PF-2 verbatim without
#                     happening to reference accentTxt in JSX.
#                     (2) PF-2 ordering: detect linkStyle-before-c-block and
#                     report explicitly; jsx_area now sliced AFTER c-block end
#                     instead of at linkStyle position, so reversed order
#                     no longer cascades into spurious "hardcoded color in JSX"
#                     flags.
#                     (3) S1.1i / S1.1k: added \b word-boundary to c.X regex
#                     to prevent false positives where identifiers like
#                     `uc.explanation` were substring-matched as `c.explanation`.
#                     (4) PF-16: broadened reset-button regex from `handleReset`
#                     literal to alternation of all canonical reset names
#                     (handleReset|handleClear|handleNew|resetForm|resetAll|
#                     startOver|clearAll|reset). Applied consistently across
#                     placement check, results-block check, and btnPrimary check.
# v1.7 · 2026-05-01 · added backend-route detection (express.Router files)
#                     with checks B0 (no console.log — Railway log retention
#                     leaks user content) and B1 (no user-content interpolation
#                     in console.error). Backend files now skip the React
#                     structural checks instead of producing 30+ false positives.
# v1.6 · 2026-04-27 · added PF-14 (hook ordering), PF-17 (Try Example), TOOLS
#                     (registration check), PF-13 (disabled:opacity-40, strict),
#                     CONV slider check, and S1.1k (dead c-block keys).
#                     ESLint now default-on (opt-out via AUDIT_SKIP_ESLINT=1)
#                     instead of opt-in. Tightened PF-16 and S5.5 regexes to
#                     require whitespace-only between 'results' and '&&'
#                     (was matching property accesses).
# v1.5 · 2026-04-27 · added PF-18 hygiene checks (unused imports, dead constants,
#                     broken <a>) and optional ESLint integration. Closes the gap
#                     between "audit passes" and "lint-clean" — a passing audit now
#                     means the file is genuinely clean.
# v1.4 · 2026-04-24 · removed vestigial S1.4 ActionButtons-import check; the ActionBarContext check already covers what tools actually need
# Usage: python3 audit_v2-3-2.py path/to/Component.js
#        AUDIT_SKIP_ESLINT=1 python3 audit_v2-3-2.py path/to/Component.js  (skip ESLint pass)
# tools.js path resolution order:
#   1. $TOOLS_JS environment variable (if set)
#   2. ../src/data/tools.js (relative to this script — assumes /audit/ is at repo root)
#   3. /mnt/project/tools.js (Claude environment fallback)
# If none exist, cross-ref link validation (S5.5) is skipped — script still runs.
import os, re, glob, sys

_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

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
BANNED_COLORS = ['bg-blue', 'text-blue', 'border-blue', 'bg-purple', 'text-purple', 'border-purple',
                 'bg-violet', 'text-violet', 'border-violet', 'bg-indigo', 'text-indigo', 'border-indigo',
                 'bg-teal', 'text-teal', 'border-teal', 'bg-stone', 'text-stone', 'border-stone',
                 'bg-yellow', 'text-yellow', 'border-yellow',
                 'bg-rose', 'text-rose', 'border-rose', 'bg-pink', 'text-pink', 'border-pink']
SKIP = {'usePersistentState','tools','ActionButtons','printBranding','BrandMark','GlobalHeader','ToolPageWrapper','server','index','rateLimiter','useTheme','useDocumentHead','useSurvivalMath','usePersistentState','imageCompression', 'ToolFinderWizard'}

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
# If a file path is passed as argument, audit that file directly (no project-file pairing required)
if len(sys.argv) > 1:
    fpath = os.path.abspath(sys.argv[1])
    if os.path.isfile(fpath):
        name = os.path.basename(fpath).replace('.js', '')
        if name not in SKIP:
            tools.append((name, fpath))
    else:
        print(f'ERROR: file not found: {fpath}', file=sys.stderr)
        sys.exit(1)
else:
    # No argv given — fall back to scanning a default outputs directory.
    # Order: $AUDIT_OUTPUTS env var > Claude's /mnt/user-data/outputs (if present) > nothing
    _env_dir = os.environ.get('AUDIT_OUTPUTS')
    if _env_dir:
        # If env var is explicitly set, it MUST point to a real directory — silently
        # falling back to a default would mask configuration mistakes.
        if not os.path.isdir(_env_dir):
            print(f'ERROR: $AUDIT_OUTPUTS points to {_env_dir!r} which is not a directory.\n'
                  f'       fix the env var or unset it to use the built-in fallback.',
                  file=sys.stderr)
            sys.exit(1)
        _outputs_dir = _env_dir
    elif os.path.isdir('/mnt/user-data/outputs'):
        _outputs_dir = '/mnt/user-data/outputs'
    else:
        _outputs_dir = None

    if _outputs_dir:
        for fpath in sorted(glob.glob(os.path.join(_outputs_dir, '*.js'))):
            name = os.path.basename(fpath).replace('.js','')
            if '-tools-entry' in name: continue
            if name in SKIP: continue
            tools.append((name, fpath))
        if not tools:
            print(f'ERROR: no auditable .js files found in {_outputs_dir!r}.\n'
                  f'       (files matching SKIP or "-tools-entry" are excluded — that may be all of them)',
                  file=sys.stderr)
            sys.exit(1)
    else:
        print('ERROR: no file argument and no default outputs directory found.\n'
              '       pass a file path: python3 audit_v2-3-2.py path/to/Component.js\n'
              '       or set $AUDIT_OUTPUTS to a directory of .js files', file=sys.stderr)
        sys.exit(1)

# Load valid tool IDs from tools.js for cross-ref link validation
# Also capture per-tool icon + title so we can cross-check fallbacks
VALID_TOOL_IDS = set()
TOOL_META = {}  # id -> {'icon': '...', 'title': '...'}

# Resolve tools.js path: env var > sibling-of-/audit/ > Claude environment
_candidate_paths = [
    os.environ.get('TOOLS_JS'),
    os.path.normpath(os.path.join(_SCRIPT_DIR, '..', 'src', 'data', 'tools.js')),
    '/mnt/project/tools.js',
]
tools_js_path = next((p for p in _candidate_paths if p and os.path.exists(p)), None)

if tools_js_path:
    import re as _re2
    with open(tools_js_path) as f:
        _tools_js = f.read()
    VALID_TOOL_IDS = set(_re2.findall(r'id:\s*["\']([A-Za-z][A-Za-z0-9]+)["\']', _tools_js))
    # Capture id + following icon/title within the same tool entry (next ~400 chars after id)
    for _m in _re2.finditer(r'id:\s*["\']([A-Za-z][A-Za-z0-9]+)["\']', _tools_js):
        _id = _m.group(1)
        _window = _tools_js[_m.end():_m.end() + 600]
        _icon_m = _re2.search(r'icon:\s*["\']([^"\']+)["\']', _window)
        _title_m = _re2.search(r'title:\s*["\']([^"\']+)["\']', _window)
        TOOL_META[_id] = {
            'icon': _icon_m.group(1) if _icon_m else None,
            'title': _title_m.group(1) if _title_m else None,
        }

results = {}

SUSPICIOUS_LOG_VARS = {
    'word', 'name', 'email', 'question', 'description', 'input', 'text',
    'message', 'recipientName', 'recipient', 'task', 'topic', 'feedback',
    'prompt', 'situation', 'event', 'activity', 'company', 'audience',
    'instruction', 'leaseText', 'pdfText', 'content',
}

for name, fpath in tools:
    with open(fpath) as f:
        content = f.read()
    lines = content.split('\n')
    fails = []

    # Backend route detection — short-circuits the React-component checks.
    # Routes are Express files; running React structural checks on them
    # produces 30+ false positives. Backend files get their own check set.
    is_backend_route = (
        re.search(r"require\(['\"]express['\"]\)", content) is not None
        and re.search(r"express\.Router\(\)", content) is not None
    )
    if is_backend_route:
        # B0: no console.log — backend stdout is captured by Railway and
        # retained for the plan's log window; success-path debug logs leak
        # user content (names, slices of inputs, Claude output excerpts).
        # Use console.error in catch blocks for genuine failures only.
        log_lines = [content[:m.start()].count('\n') + 1
                     for m in re.finditer(r'(?:^|\n)[ \t]*console\.log\(', content)]
        if log_lines:
            shown = ', '.join(map(str, log_lines[:8]))
            more = f' (+{len(log_lines) - 8} more)' if len(log_lines) > 8 else ''
            fails.append(f'B0: {len(log_lines)} console.log call(s) — remove all. Lines: {shown}{more}')

        # B1: console.error must not interpolate user-content variables.
        # Error messages are fine; ${word}, ${name}, ${email}, etc. are not.
        for m in re.finditer(r'console\.error\([^\n]*', content):
            for vm in re.finditer(r'\$\{([a-zA-Z_][a-zA-Z0-9_]*)', m.group()):
                if vm.group(1) in SUSPICIOUS_LOG_VARS:
                    ln = content[:m.start()].count('\n') + 1
                    fails.append(f'B1: console.error line {ln} interpolates `${{{vm.group(1)}}}` — strip user content from error logs')
                    break

        results[name] = fails
        continue

    c_block = get_c_block(content)
    # PF-2 ordering: c block must come before linkStyle. If linkStyle precedes
    # the c block, the legacy jsx_area slice (content[linkStyle_pos:]) would
    # include the c block itself, causing spurious "hardcoded color in JSX"
    # flags on legitimate c-block values. Detect and report explicitly.
    _c_block_start = content.find('const c = {')
    _linkstyle_pos = content.find('const linkStyle')
    if c_block and _c_block_start != -1 and _linkstyle_pos != -1 and _linkstyle_pos < _c_block_start:
        fails.append('PF-2: linkStyle declared before c block — must come after c block (canonical order: c block + aliases, then linkStyle)')
    # Compute c_end_pos as the position AFTER the c block closes, regardless of
    # linkStyle order. Aliases (c.textMuteded, c.label) and linkStyle itself sit
    # between c-block-end and JSX, but contain no JSX-pattern content that any
    # downstream check would mismatch.
    if c_block:
        c_end_pos = content.find(c_block) + len(c_block)
    elif _linkstyle_pos != -1:
        c_end_pos = _linkstyle_pos
    else:
        c_end_pos = len(content) // 2
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

    # S0f: icon/title fallback values must match tools.js metadata
    # Pattern: tool?.icon ?? 'X' and tool?.title ?? 'Y' fallbacks should equal what tools.js has
    if name in TOOL_META and TOOL_META[name].get('icon'):
        expected_icon = TOOL_META[name]['icon']
        # Collect all tool?.icon ?? 'X' fallbacks
        fallback_icons = set(re.findall(r"tool\?\.icon\s*\?\?\s*['\"]([^'\"]+)['\"]", content))
        bad = [f for f in fallback_icons if f != expected_icon]
        if bad:
            fails.append(f'S0f: tool?.icon fallback(s) {bad} mismatch tools.js icon "{expected_icon}"')
    if name in TOOL_META and TOOL_META[name].get('title'):
        expected_title = TOOL_META[name]['title']
        fallback_titles = set(re.findall(r"tool\?\.title\s*\?\?\s*['\"]([^'\"]+)['\"]", content))
        bad = [t for t in fallback_titles if t != expected_title]
        if bad:
            fails.append(f'S0f: tool?.title fallback(s) {bad} mismatch tools.js title "{expected_title}"')

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

    # S1.1i: used-but-undefined c keys (WrongAnswersOnly pattern — silent undefined classNames)
    # Collect all c.xxx references in the component body, then check each is defined either
    # as a literal key inside c block OR as an alias assignment (c.foo = c.bar).
    c_used = set(re.findall(r'\bc\.([a-zA-Z][a-zA-Z0-9]*)\b', content))
    # Keys defined via literal `key: value` inside c block
    c_literal_keys = set(re.findall(r'^\s+([a-zA-Z][a-zA-Z0-9]*)\s*:', c_block, re.MULTILINE))
    # Keys defined via alias assignment anywhere in file: `c.foo = c.bar;`
    c_alias_keys = set(re.findall(r'\bc\.([a-zA-Z][a-zA-Z0-9]*)\s*=\s*c\.', content))
    c_defined = c_literal_keys | c_alias_keys
    undefined_keys = c_used - c_defined
    for k in sorted(undefined_keys):
        fails.append(f'S1.1i: c.{k} used but not defined in c block (silent undefined className)')

    # S1.1k: defined-but-unused c keys (dead-key cleanup after refactors).
    # Complement to S1.1i. Whitelist exempts keys mandated by convention even
    # when a specific tool doesn't reference them: REQUIRED_KEYS (baseline),
    # 'required' (PF-15), and the PF-2 alias scaffolding ('textMuteded', 'label',
    # 'labelText'). Computing c_used by stripping the c-block declarations means
    # a literal key whose only "reference" is its own definition isn't counted as
    # used — so dead literal keys get caught the same as dead aliases.
    _CONVENTION_KEYS = set(REQUIRED_KEYS) | {'required', 'textMuteded', 'label', 'labelText', 'accentTxt'}
    # Recompute c_used from content with c_block declarations stripped
    # (so a literal key isn't "used" merely by existing in the c block).
    _content_no_cblock = content.replace(c_block, '') if c_block else content
    _c_used_external = set(re.findall(r'\bc\.([a-zA-Z][a-zA-Z0-9]*)\b', _content_no_cblock))
    unused_keys = (c_defined - _c_used_external) - _CONVENTION_KEYS
    for k in sorted(unused_keys):
        fails.append(f'S1.1k: c.{k} defined but never used in JSX (dead key — remove from c block)')

    # S1.1j: raw Tailwind in lookup-object color props (BrainRoulette pattern)
    # Catches both `color: 'text-...'` (direct string) and `color: (d) => d ? 'bg-...' : ...` (fn).
    # We look for `color:` followed within 200 chars by a Tailwind class prefix inside quotes.
    for m in re.finditer(r"color\s*:\s*[^,}\n]{0,220}?['\"](?:bg-|text-|border-)[a-z]+-\d", content):
        if is_comment_line(content, m.start()):
            continue
        line_n = content[:m.start()].count('\n') + 1
        fails.append(f'S1.1j: lookup-object uses raw Tailwind color at line {line_n} — use colorKey: "themeKey" and c[key] indirection')
        break

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

    # S1.4: lucide-react ban
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
    # S1.4: standalone <PrintBtn> is NEVER valid inline — always a whole-document action
    # Whole-output CopyBtn belongs in useRegisterActions; per-item CopyBtn (helper takes a param) is fine
    # (This codifies the ContextCollapse-style exception for per-item copy buttons)
    if 'BRAND' not in content and 'deftbrain.com' not in content:
        fails.append('S1.4: BRAND/deftbrain.com missing')
    # S1.4g: inline <PrintBtn> is always a violation — print has no legitimate per-item use case
    if re.search(r'<PrintBtn\b', content):
        fails.append('S1.4g: inline <PrintBtn> found — print actions go through useRegisterActions, never inline')
    # S1.4h: whole-output CopyBtn helpers (called with empty parens) must go through useRegisterActions
    # Per-item helpers that take a parameter — buildChainText(chain), buildCopyText(variant) — are allowed
    _whole_helpers = r'(buildFullText|buildAllScripts|buildAllScriptsContent|buildReport|buildReportText|buildCopy|buildReminderText|buildCompareText|buildResults|buildPlanText|buildBreakPlan)'
    _whole_hits = re.findall(r'<CopyBtn[^>]*content=\{\s*' + _whole_helpers + r'\s*\(\s*\)', content)
    for _fname in _whole_hits:
        fails.append(f'S1.4h: inline <CopyBtn content={{{_fname}()}}> — whole-output copy must go through useRegisterActions')
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

    # PF-16: Reset button placement — exactly 1, in header top-right, never in results block or submit row
    # Signals of a reset button: onClick={handleReset|reset|handleClear|...} OR onClick containing setResults(null) reset-like pattern
    # We count distinct <button> elements that look like reset buttons.
    # Reset function names recognized across the catalog (longer first — alternation is left-to-right):
    _RESET_ALT = r'(?:handleReset|handleClear|handleNew|resetForm|resetAll|startOver|clearAll|reset)'
    reset_btn_matches = list(re.finditer(
        r'<button[^>]*onClick=\{(?:[^}]*handleReset|[^}]*setResults\(null\)[^}]*setBelief|[^}]*setResults\(null\)[^}]*setInput|\(\s*\)\s*=>\s*\{[^}]*setResults\(null\)[^}]*set)',
        content
    ))
    # Simpler coverage: count reset-named onClick usages (most tools use a dedicated fn)
    reset_onclick_count = len(re.findall(rf'onClick=\{{\s*{_RESET_ALT}\s*\}}', content))
    # Also look for buttons whose label is "Start Over" / "New" / "Clear" / "Reset" + ↺ / ↩
    reset_label_count = len(re.findall(r'<button[^>]*>[^<]{0,50}(?:↺|↩)\s*(?:Start Over|New|Clear|Reset|Fresh)', content))
    # The best count is the max — captures both patterns
    reset_count = max(reset_onclick_count, reset_label_count)
    if reset_count > 1:
        fails.append(f'PF-16: {reset_count} reset buttons detected — must be exactly 1 (header top-right only)')
    # PF-16: reset button must NOT appear inside a {results && ( block.
    # Strategy: find the first {results && ( split, then check any reset-named button appears only BEFORE it.
    # v1.9: broadened split regex to recognize render-helper pattern
    # `{results && renderResults()}` — previously missed, leaving render-helper
    # tools un-checked for AFTER-split reset buttons.
    _results_split = re.search(r'\{\s*(?<![!])results\s*&&\s*(?:[(<]|render[A-Z]\w*\s*\(\s*\))', content)
    if _results_split:
        _after = content[_results_split.end():]
        _btn_after = re.search(rf'<button[^>]*onClick=\{{\s*{_RESET_ALT}\s*\}}', _after)
        if _btn_after:
            line_n = content[:_results_split.end() + _btn_after.start()].count('\n') + 1
            fails.append(f'PF-16: reset button at line {line_n} is inside {{results && (...)}} — must be in header top-right')
    # PF-16: reset button must NOT use c.btnPrimary
    if re.search(rf'<button[^>]*onClick=\{{\s*{_RESET_ALT}\s*\}}[^>]*c\.btnPrimary\b', content):
        fails.append('PF-16: reset button uses c.btnPrimary — must be c.btnSecondary')

    # PF-12: Python-replace script corruption typos (self-reference doubling pattern)
    # These emerge when a find/replace accidentally runs twice. All are silent: className
    # resolves to "undefined undefined" and styles disappear with no error.
    PY_REPLACE_TYPOS = [
        'btnPrimaryPrimary',
        'btnPrimarySecondaryondary',
        'btnSecondaryondary',
        'textSecondaryondary',
        'textMutedMuted',
        'borderBorder',
        'cardCard',
    ]
    for typo in PY_REPLACE_TYPOS:
        if typo in content:
            fails.append(f'PF-12: Python-replace corruption typo "{typo}" — fix the class name at each callsite')

    # S1.5: history preview length must be ~40 chars (not 6, not 100)
    for m in re.finditer(r'preview\s*:\s*[^,\n}]+\.slice\(\s*0\s*,\s*(\d+)\s*\)', content):
        n = int(m.group(1))
        if n < 20 or n > 80:
            line_n = content[:m.start()].count('\n') + 1
            fails.append(f'S1.5: preview slice length {n} at line {line_n} — should be 30–60 (typical is 40)')

    # S2.1: keyboard handler SELECT-only guard (not INPUT/TEXTAREA)
    # Over-broad guards (tag === 'INPUT' || tag === 'TEXTAREA') prevent the global
    # ⌘/Ctrl+Enter shortcut from working while the user is typing in the main input —
    # defeating the purpose of the shortcut.
    for m in re.finditer(r"tag\s*===\s*['\"](?:INPUT|TEXTAREA)['\"]", content):
        line_n = content[:m.start()].count('\n') + 1
        fails.append(f'S2.1: keyboard handler at line {line_n} guards on INPUT/TEXTAREA — use SELECT-only guard so ⌘/Ctrl+Enter works while typing')
        break

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
        if cap > 50:
            fails.append(f'S1.5: history cap {cap} > 50')
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
    # Classify hrefs as pre-result or post-result.
    # Two tool patterns:
    #   A) Inline JSX: {results && (<div>...hrefs...</div>)} — split at results &&
    #   B) Render functions: const renderResults = () => ... called as {renderResults()} in return
    #      pre_region  = main return content BEFORE the {renderResults()} call
    #      post_region = the renderResults function body itself
    href_pattern = r'href=["\'][/][A-Za-z]|href=\{[`][/]\$?\{?[A-Za-z]'

    # Find the main component's top-level return( to anchor JSX-only searches.
    # Use shallow indentation (1-6 spaces) to exclude deeply-nested IIFE returns
    # inside JSX (which use 8+ spaces). Fallback to any return( if needed.
    _top_level_returns = list(re.finditer(r'^\s{1,6}return\s*\(', content, re.MULTILINE))
    _return_matches = _top_level_returns if _top_level_returns else list(re.finditer(r'\breturn\s*\(', content))
    _jsx_start = _return_matches[-1].start() if _return_matches else 0

    # Pattern B: does a renderResults render-function exist?
    _render_results_m = re.search(r'\bconst\s+render(?:Results?|Output|Answer)\s*=', content)
    _rr_call_m = re.search(r'render(?:Results?|Output|Answer)\(\)', content[_jsx_start:]) if _render_results_m else None

    # Pattern A: inline {results && ( or {result && ( inside the JSX return
    _inline_jsx = re.search(
        r'\{?\s*(?:\(\s*)?(?<![!])(?:results|result)\s*&&\s*[(<]',
        content[_jsx_start:]
    )

    if _inline_jsx:
        # Inline pattern — single split point
        _split = _jsx_start + _inline_jsx.start()
        pre_content = content[:_split]
        post_content = content[_split:]
    elif _render_results_m and _rr_call_m:
        # Render-function pattern — two separate regions
        _rr_body_start = _render_results_m.start()
        _rr_call_pos   = _jsx_start + _rr_call_m.start()
        pre_content  = content[_jsx_start:_rr_call_pos]   # main return before {renderResults()}
        post_content = content[_rr_body_start:_jsx_start]  # renderResults function body
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

        # Per-cluster rule (v4.38): no more than 3 hrefs within any 5-source-line window.
        # Counts every href occurrence with its line number, groups by proximity, flags dense clusters.
        PROXIMITY_LINES = 5
        MAX_PER_CLUSTER = 3
        href_lines = []
        for m in re.finditer(r'href=["\'{`]', content):
            href_lines.append(content[:m.start()].count('\n') + 1)
        href_lines.sort()
        if href_lines:
            cluster_start = href_lines[0]
            cluster_hits = [href_lines[0]]
            worst_cluster = None
            for ln in href_lines[1:]:
                if ln - cluster_hits[-1] <= PROXIMITY_LINES:
                    cluster_hits.append(ln)
                else:
                    if len(cluster_hits) > MAX_PER_CLUSTER and (worst_cluster is None or len(cluster_hits) > len(worst_cluster)):
                        worst_cluster = cluster_hits[:]
                    cluster_start = ln
                    cluster_hits = [ln]
            # Final cluster
            if len(cluster_hits) > MAX_PER_CLUSTER and (worst_cluster is None or len(cluster_hits) > len(worst_cluster)):
                worst_cluster = cluster_hits[:]
            if worst_cluster:
                fails.append(f'S5.5: {len(worst_cluster)} cross-refs clustered within {PROXIMITY_LINES} lines (lines {worst_cluster[0]}–{worst_cluster[-1]}) — max {MAX_PER_CLUSTER} per cluster; spread them out')


    # S5.5: cross-ref link validity — check all static /ToolId hrefs resolve to a real tool in tools.js
    # Only checks plain string hrefs (href="/ToolId"), not template literals
    if VALID_TOOL_IDS:
        for tool_id in re.findall(r'href=["\'][/]([A-Za-z][A-Za-z0-9]+)["\']', content):
            if tool_id not in VALID_TOOL_IDS:
                fails.append(f'S5.5: cross-ref link /{tool_id} does not exist in tools.js — broken link')

    # S5.5: relative href check — catches href="tool-name" or href={`tool-name`} missing leading slash
    # These resolve as child URLs (e.g. /CurrentTool/tool-name) and create ghost pages in Google
    for bad in re.findall(r'href=["\'][^"\'/#{][^"\'>]*["\']', content):
        m = re.search(r'href=["\']([^"\'/#{][^"\'>]*)["\']', bad)
        if m:
            fails.append(f'S5.5: relative href "{m.group(1)}" missing leading slash — will create ghost URLs in Google')
    for bad_m in re.finditer(r'href=\{`(?!/|\$\{)([^`]+)`\}', content):
        fails.append(f'S5.5: relative template href "{bad_m.group(1)}" missing leading slash — will create ghost URLs in Google')

    # PF-15: Required field asterisks
    # 1. c.required must be defined in the c block
    if c_block and not re.search(r'^\s+required\s*:', c_block, re.MULTILINE):
        fails.append('PF-15: c.required not defined in c block')

    # 2. Every asterisk <span> must use c.required — not raw color classes or bare text
    for _span_m in re.finditer(r'<span([^>]*)>\s*\*\s*</span>', content):
        if 'c.required' not in _span_m.group(1):
            _line_n = content[:_span_m.start()].count('\n') + 1
            fails.append(f'PF-15: asterisk span at line {_line_n} does not use c.required — must be <span className={{c.required}}>*</span>')
            break  # one report is enough

    # 3. Required field variables (from submit disabled={}) must have a c.required asterisk in their label
    # Extract required vars: !varName[.sub.path][.trim()] in disabled condition, excluding control vars.
    # Handles both bare identifiers (!hotTake, !practiceInput) and dot-nested form paths
    # (!calForm.whatHappened.trim(), !fixForm.theirReaction.trim()). Dot-nesting is common in
    # multi-mode tools that collect inputs into a single form object per mode.
    # Iterates ALL disabled={} expressions, not just the first — multi-mode tools have 10+.
    _CONTROL_VARS = {'loading', 'isLoading', 'isRunning', 'true', 'false', 'null', 'undefined', 'error'}
    _required_paths = set()
    for _submit_dis in re.finditer(r'disabled=\{([^}]{5,400})\}', jsx_area):
        _dis_expr = _submit_dis.group(1)
        # Greedy match: identifier + optional dotted sub-path. Trailing .trim() is inside the
        # capture if present, and we strip it below to recover the actual binding path.
        for _vm in re.finditer(r'!\s*([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)', _dis_expr):
            _path = _vm.group(1)
            if _path.endswith('.trim'):
                _path = _path[:-5]
            if not _path:
                continue
            _root = _path.split('.')[0]
            if _root in _CONTROL_VARS:
                continue
            _required_paths.add(_path)
    for _path in _required_paths:
        # Find the input/textarea/select that binds value={<path>} in jsx_area.
        # re.escape handles the dots in nested paths correctly.
        _input_m = re.search(r'value=\{' + re.escape(_path) + r'\b', jsx_area)
        if not _input_m:
            continue
        # Search backwards for the nearest <label before this input
        _before = jsx_area[:_input_m.start()]
        _label_matches = list(re.finditer(r'<label\b', _before))
        if not _label_matches:
            continue
        _label_start = _label_matches[-1].start()
        # Grab text from <label to </label> (up to 500 chars)
        _label_snippet = jsx_area[_label_start:_label_start + 500]
        if '</label>' not in _label_snippet:
            continue  # malformed / multiline edge case — skip
        _label_text = _label_snippet[:_label_snippet.index('</label>') + 8]
        if 'c.required' not in _label_text:
            _abs_line = content[:c_end_pos + _label_start].count('\n') + 1
            fails.append(f'PF-15: required field "{_path}" — label at line {_abs_line} missing <span className={{c.required}}>*</span>')

    # ── PF-18: Hygiene checks (catch what ESLint catches, without needing ESLint) ──
    # Goal: a "passing audit" means the file is also lint-clean. These checks find
    # dead imports, unused constants, and patterns that linger after refactors —
    # the long tail of "Compiled with warnings" noise. They overlap with ESLint
    # warnings but run without ESLint being available, so they always work in
    # the Claude environment.

    # PF-18a: ActionButton imports declared but never used in JSX.
    # The single largest source of warning noise: tools converted to
    # useRegisterActions kept their `CopyBtn` (and friends) imports.
    _action_import_m = re.search(
        r"import\s*\{\s*([^}]+?)\s*\}\s*from\s*['\"][^'\"]*ActionButtons['\"]",
        content
    )
    if _action_import_m:
        imported = {n.strip() for n in _action_import_m.group(1).split(',') if n.strip()}
        body_after = content[_action_import_m.end():]
        for imp in imported & {'CopyBtn', 'PrintBtn', 'ShareBtn', 'ActionBar'}:
            # Used as JSX tag (<CopyBtn) or as function reference
            if not re.search(rf'<{imp}\b|\b{imp}\s*\(', body_after):
                fails.append(f'PF-18a: "{imp}" imported from ActionButtons but never used — remove from import')

    # PF-18b: BRAND defined or imported but never appended.
    # PF-12 says BRAND must be appended in builder functions. This catches the
    # converse: BRAND is declared but no builder ever uses it (silent PF-12 gap).
    _has_brand_decl = bool(
        re.search(r'\bconst\s+BRAND\s*=', content) or
        re.search(r'import[^;]*\bBRAND\b', content)
    )
    if _has_brand_decl:
        # Strip declaration/import lines (allow leading whitespace); check body for any BRAND ref
        _body = re.sub(r'^\s*const\s+BRAND\s*=.*$', '', content, flags=re.MULTILINE)
        _body = re.sub(r'^\s*import[^;]*\bBRAND\b[^;]*;?\s*$', '', _body, flags=re.MULTILINE)
        if not re.search(r'\bBRAND\b', _body):
            fails.append('PF-18b: BRAND defined but never appended — must be used in buildFullText (PF-12)')

    # PF-18c: CROSS_REFS defined but never rendered.
    # Architectural decay signal: cross-refs were declared but the JSX rendering
    # was removed (or never wired up). Either remove the constant or render it.
    _cross_refs_m = re.search(r'\bconst\s+CROSS_REFS\s*=', content)
    if _cross_refs_m:
        # Look for actual usage (not the declaration itself)
        _body_after_decl = content[_cross_refs_m.end():]
        if not re.search(r'\bCROSS_REFS\b', _body_after_decl):
            fails.append('PF-18c: CROSS_REFS defined but never rendered — render it (PF-9) or remove the constant')

    # PF-18d: React hook imports present but never called.
    # `import { useMemo, useCallback } from 'react'` where useMemo is never invoked.
    _react_import_m = re.search(
        r"import\s+(?:React,?\s*)?\{\s*([^}]+?)\s*\}\s*from\s*['\"]react['\"]",
        content
    )
    if _react_import_m:
        _react_imports = {n.strip() for n in _react_import_m.group(1).split(',') if n.strip()}
        _body_after = content[_react_import_m.end():]
        _hook_names = {'useState', 'useEffect', 'useCallback', 'useMemo', 'useRef',
                       'useContext', 'useReducer', 'useLayoutEffect', 'useImperativeHandle'}
        for hook in _react_imports & _hook_names:
            if not re.search(rf'\b{hook}\s*\(', _body_after):
                fails.append(f'PF-18d: React hook "{hook}" imported but never called — remove from import')

    # PF-18e: Anchor tags with empty or fragment-only href (a11y violation).
    # `<a href="">` and `<a href="#">` fail screen readers and keyboard nav.
    # Should be `<button>` styled to look like a link.
    for _m in re.finditer(r'<a\s+[^>]*?href=(["\'])(#?)\1', content):
        _line_n = content[:_m.start()].count('\n') + 1
        fails.append(f'PF-18e: <a> with empty/placeholder href at line {_line_n} — use <button> styled as link (a11y)')
        break  # one report is enough; user fixes all instances

    # PF-18f: linkStyle defined but never used in JSX.
    # Symptom of cross-refs being removed without cleaning up their styling helper.
    if re.search(r'\bconst\s+linkStyle\s*=', content):
        # Strip the declaration line (allow leading whitespace), check body for usage
        _body = re.sub(r'^\s*const\s+linkStyle\s*=.*$', '', content, flags=re.MULTILINE)
        if not re.search(r'\blinkStyle\b', _body):
            fails.append('PF-18f: linkStyle defined but never used — remove the const or wire it into cross-refs')

    # ── PF-14: Hook ordering (canonical sequence enforced) ─────────────────────
    # Required order: useTheme → c block → linkStyle → useState → usePersistentState
    # → useRegisterActions (after buildFullText). Out-of-order placement causes
    # silent TDZ bugs (c referenced before declaration, etc.).
    def _first_line(pattern, source=content, flags=0):
        m = re.search(pattern, source, flags)
        return source[:m.start()].count('\n') + 1 if m else None

    _ln_useTheme    = _first_line(r'\buseTheme\s*\(')
    _ln_c_block     = _first_line(r'\bconst\s+c\s*=\s*\{')
    _ln_linkStyle   = _first_line(r'\bconst\s+linkStyle\s*=')
    _ln_useState    = _first_line(r'\buseState\s*\(')
    _ln_persistent  = _first_line(r'\busePersistentState\s*\(')
    _ln_buildFull   = _first_line(r'\bconst\s+build\w*Text\s*=\s*useCallback\b')
    _ln_register    = _first_line(r'\buseRegisterActions\s*\(')

    # Each invariant: (name, line_a, line_b, message) — flag if line_a > line_b
    _PF14_INVARIANTS = [
        ('useTheme before c block',          _ln_useTheme,   _ln_c_block,    'useTheme must be called before const c = {...}'),
        ('c block before useState',          _ln_c_block,    _ln_useState,   'const c = {...} must be defined before first useState (TDZ risk)'),
        ('linkStyle before useState',        _ln_linkStyle,  _ln_useState,   'const linkStyle must be defined before first useState'),
        ('useState before usePersistentState', _ln_useState, _ln_persistent, 'all useState calls must come before any usePersistentState call (PF-11)'),
        ('buildFullText before useRegisterActions', _ln_buildFull, _ln_register, 'buildFullText (useCallback) must be defined before useRegisterActions'),
    ]
    for _label, _a, _b, _msg in _PF14_INVARIANTS:
        if _a is not None and _b is not None and _a > _b:
            fails.append(f'PF-14: {_msg} (found at lines {_a} → {_b})')

    # ── PF-17: Try Example required on multi-field tools ───────────────────────
    # If a tool has 2+ user input fields (textarea/text-input/select), it must
    # offer a "Try Example" button to demo functionality with sample data.
    _input_count = (
        len(re.findall(r'<textarea\b', content)) +
        len(re.findall(r"<input\s+[^>]*type=['\"](?:text|number|email|tel|url|search)['\"]", content)) +
        len(re.findall(r'<select\b', content))
    )
    if _input_count >= 2:
        # Strip JS comments so "Try Example" in a comment doesn't satisfy the check
        _no_comments = re.sub(r'//[^\n]*|/\*[\s\S]*?\*/', '', content)
        _has_example = bool(re.search(
            r"[Tt]ry\s+(?:an?\s+)?[Ee]xample"
            r"|[Ll]oad\s+[Ee]xample"
            r"|[Ss]ee\s+[Ee]xample"
            r"|fillExample|loadExample|setExample|useExample|tryExample"
            r"|[Ss]how\s+[Ee]xample",
            _no_comments
        ))
        if not _has_example:
            fails.append(f'PF-17: multi-field tool ({_input_count} inputs) missing Try Example button — required to demo functionality')

    # ── TOOLS: tool must have an entry in tools.js ─────────────────────────────
    # Caught early: a tool component without a tools.js registration is unreachable.
    # Skipped if tools.js wasn't found at audit time (offline / wrong path).
    if VALID_TOOL_IDS and name not in VALID_TOOL_IDS:
        fails.append(f'TOOLS: "{name}" not found in tools.js — file is unreachable; add a registration entry')

    # ── PF-13: loading-disabled buttons must use disabled:opacity-40 ───────────
    # Strict: only `disabled:opacity-40` is accepted. The ternary pattern
    # (e.g. `${loading ? c.btnDis : c.btnPrimary}`) is rejected to keep disabled
    # feedback visually consistent across tools. CONVENTIONS.md is the source
    # of truth on this — one pattern only.
    # Brace-aware walker: JSX attrs commonly contain `=>`, so `[^>]` regexes
    # break on arrow functions. Track brace depth to find the real closing `>`.
    for _btn_m in re.finditer(r'<button\b', content):
        _depth = 0
        _btn_end = None
        for _i in range(_btn_m.end(), min(len(content), _btn_m.end() + 2000)):
            _ch = content[_i]
            if _ch == '{': _depth += 1
            elif _ch == '}': _depth -= 1
            elif _ch == '>' and _depth == 0:
                _btn_end = _i
                break
        if _btn_end is None:
            continue
        _btn_open = content[_btn_m.start():_btn_end]
        # Only check buttons that disable on loading (skip others — not subject to PF-13)
        if not re.search(r'disabled=\{[^}]*[Ll]oading[^}]*\}', _btn_open):
            continue
        # Extract className value (supports template literals via backticks)
        _cn_m = re.search(r"className=\{?[`\"']([^`\"']+)", _btn_open)
        if not _cn_m:
            continue
        if 'disabled:opacity-40' not in _cn_m.group(1):
            _line_n = content[:_btn_m.start()].count('\n') + 1
            fails.append(f'PF-13: button at line {_line_n} disables on loading but className missing "disabled:opacity-40"')
            break

    # ── CONV: appearance-none on range inputs (slider track regression) ────────
    # Strips browser track rendering; we use accent-cyan-600 instead. See
    # CONVENTIONS.md "appearance-none on sliders" entry.
    # Window-based check: scan the line containing type="range" plus the next
    # 4 lines (sliders' className often lives on a continuation line in JSX).
    _lines_arr = content.split('\n')
    for _i, _line in enumerate(_lines_arr):
        if 'type="range"' in _line or "type='range'" in _line:
            _window = '\n'.join(_lines_arr[max(0, _i - 1):_i + 5])
            if 'appearance-none' in _window:
                fails.append(f'CONV: <input type="range"> at line {_i + 1} uses appearance-none — strip it (kills track rendering); keep accent-cyan-600')
                break

    # ── LINT: ESLint integration (default-on; opt-out via AUDIT_SKIP_ESLINT=1) ──
    # Runs ESLint on the file and surfaces every warning as an audit failure.
    # Catches everything the regex checks miss (hooks-deps, accessibility,
    # useless escapes, unused locals beyond PF-18 set, etc).
    # Silently skipped when ESLint isn't available (e.g. Claude environment).
    if not os.environ.get('AUDIT_SKIP_ESLINT'):
        import subprocess as _sp, json as _json
        try:
            _r = _sp.run(
                ['npx', '--no-install', 'eslint', '--format', 'json', fpath],
                capture_output=True, text=True, timeout=45
            )
            # ESLint exit codes: 0 (clean), 1 (has issues), 2 (config error)
            if _r.returncode in (0, 1) and _r.stdout.strip():
                try:
                    _data = _json.loads(_r.stdout)
                    if _data and _data[0].get('messages'):
                        for _msg in _data[0]['messages']:
                            _rule = _msg.get('ruleId') or 'unknown'
                            _ln = _msg.get('line', 0)
                            _txt = _msg.get('message', '').strip()
                            fails.append(f'LINT [{_rule}]: line {_ln} — {_txt}')
                except _json.JSONDecodeError:
                    pass  # malformed output — silently skip
        except (_sp.TimeoutExpired, FileNotFoundError, OSError):
            pass  # eslint not available — silently skip

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
