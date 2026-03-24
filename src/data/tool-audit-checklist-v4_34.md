# Tool Audit Checklist v4.34
### DeftBrain — Pre-Ship Quality & Consistency Standard

Score each item: ✅ Pass | ⚠️ Needs Work | ❌ Fail | N/A

**Launch blocker rule**: Any item marked 🚨 must be fixed before shipping.

**Review type key**: 🔍 Code review (readable from source) | 🧪 Live test (requires running the tool)

**Grep rule**: Every 🔍 item that has a mandatory grep scan must have that scan run and return zero violations before the item can be marked ✅. "Looks fine from reading" is not sufficient.

**Substitution**: Replace `ComponentName` with the actual filename (e.g. `BragSheetBuilder.js`), and `backend.js` with the actual route file.

---

## SECTION 0 — TOOL IDENTITY
> These define how the tool presents itself to the world. Get these right before touching any code.

- [ ] 🔍 **Name is clear and self-explanatory** — a new user should understand the tool's purpose from the name alone, without reading the description. Clever names are fine if they don't obscure meaning.
  > *Subjective — no mechanical scan. Read the name cold and ask: does it tell you what it does?*

- [ ] 🔍 **Name matches across all surfaces** — `id` in tools.js, `title` in tools.js, `<h2>` in the component, and the URL route are consistent (or intentional differences are documented).
  ```bash
  grep -n "id:\|title:\|\"ToolId\"" tools.js | grep -A1 "ToolId"
  grep -n "<h2\|tool?\.title\|tool\.title" ComponentName.js
  # Confirm the string in h2 matches tools.js title (or is dynamic via tool?.title)
  ```

- [ ] 🔍 **Tagline is one punchy line** — 10 words or less are preferred but don't sacrifice clarity for number of words. Completes the name, doesn't restate it.
  ```bash
  grep "tagline:" tools.js | grep "ToolId" -A1
  # Count words manually — flag if > 8
  ```

- [ ] 🔍 **Description is concise and specific** — 1–2 sentences max. Says what the tool *does*, not what it *is*. Avoids filler phrases ("powerful", "easy to use", "seamlessly").
  ```bash
  grep -A2 "id: \"ToolId\"" tools.js | grep "description:"
  grep -i "powerful\|easy to use\|seamlessly\|comprehensive\|robust" tools.js | grep "ToolId" -A5
  # Must be 1-2 sentences. Zero filler phrases.
  ```

- [ ] 🔍 **Icon is the best available choice** — the emoji immediately signals the tool's purpose. If the current icon is a generic fallback (✨, 🔧, ⚡), flag for reconsideration.
  ```bash
  grep "icon:" tools.js | grep "ToolId" -A1
  # Check if icon is ✨ 🔧 ⚡ 💡 🌀 ❓ — if so, flag for reconsideration
  ```

- [ ] 🔍 **Icon placement is consistent** — icon appears *before* the title in the component `<h2>`: `<span className="mr-2">{tool?.icon}</span>{tool?.title}`. Never after, never hardcoded.
  ```bash
  grep -n "<h2" ComponentName.js
  # Must show: <span className="mr-2">{tool?.icon ...}</span>{tool?.title ...}
  # Icon span must come BEFORE title text
  grep -n 'mr-2' ComponentName.js | head -5
  # Must return a result showing the mr-2 span on the icon — this is the required pattern
  grep -n '<h[12][^>]*>[^{<]' ComponentName.js
  # Must return zero results — any h1/h2 with a bare string is a violation
  grep -n 'tool?.icon' ComponentName.js | grep -i 'h[12]\|header\|mr-2'
  # Must return at least one result confirming tool?.icon is in the header
  ```

  > ⚠️ **BUG PATTERN — Icon after title or hardcoded in header (discovered UpsellShield audit, v4.25)**
  > Tools write `<h2>UpsellShield 🧲</h2>` — icon hardcoded after the tool name. Two violations at once: title is hardcoded (sync hazard) AND icon is in the wrong position.
  > The required pattern is: `<span className="mr-2">{tool?.icon ?? 'fallback'}</span>{tool?.title ?? 'Fallback'}` — always dynamic, always icon-first.
  > ```bash
  > # Quick combined scan — all three must pass:
  > grep -n 'mr-2.*tool.*icon\|tool.*icon.*mr-2' ComponentName.js  # must return result
  > grep -c 'tool?.icon' ComponentName.js                          # must be ≥ 2 (header + submit)
  > grep -n '<h[12][^>]*>[^{<]' ComponentName.js                   # must return zero
  > ```

- [ ] 🔍 **Title and tagline are dynamic, not hardcoded** — the component header uses `{tool?.title}` and `{tool?.tagline}` rather than string literals. `tools.js` is the single source of truth for both. Hardcoding them creates a sync hazard: if you update `tools.js`, the component silently stays stale.
  ```bash
  grep -n "tool?\.title\|tool?\.tagline" ComponentName.js
  # Must return at least one result each for title and tagline
  grep -n "<h[12][^>]*>[^{<]" ComponentName.js
  # Any h1/h2 containing a bare string (not a JSX expression) is a violation
  ```

  > ⚠️ **BUG PATTERN — Hardcoded title/tagline in component header (discovered WhatIfMachine audit, v4.24)**
  > Tools hardcode their title and tagline in JSX: `<h2>WhatIfMachine 🎲</h2>` / `<p>See the road not taken…</p>`. When the tool's `tools.js` entry is updated, the component header never changes. **Fix:** Replace with `{tool?.title}` and `{tool?.tagline}`. The `tool` prop is always available — `ToolPageWrapper` passes it through to every component.
  > ```jsx
  > // ❌ WRONG
  > <h2>WhatIfMachine 🎲</h2>
  > <p>See the road not taken before you decide</p>
  >
  > // ✅ CORRECT
  > <h2><span className="mr-2">{tool?.icon}</span>{tool?.title}</h2>
  > <p>{tool?.tagline}</p>
  > ```

- [ ] 🔍 **Icon is dynamic, not hardcoded** — component renders `{tool?.icon}` in the header AND in all branches of every submit button. `tools.js` is the single source of truth.
  ```bash
  grep -n "tool?\.icon\|tool\.icon" ComponentName.js
  # Every submit button must have tool?.icon in BOTH loading and idle branches
  # Scan for hardcoded emoji inside <span> near submit buttons:
  grep -n "text-lg\">[^{<]" ComponentName.js
  # Must return zero results (any emoji directly inside a span is a violation)
  ```

  > ⚠️ **BUG PATTERN — Hardcoded emoji in submit button idle state (discovered BragSheetBuilder audit, v4.13)**
  > Tools often correctly use `tool?.icon` in the loading spinner, but revert to a hardcoded emoji for the idle state of the same button:
  > ```jsx
  > // ❌ WRONG — idle branch hardcodes the emoji
  > {loading
  >   ? <><span className="animate-spin inline-block">{tool?.icon ?? '🏆'}</span> Loading…</>
  >   : <><span className="text-lg">🏆</span> Build My Brag Sheet</>}
  > ```
  > **Fix:** Use `tool?.icon` in both branches. Both loading AND idle must use `{tool?.icon ?? 'fallback'}`.

- [ ] 🔍 **Categories are accurate** — tool is in the right primary category. Consider whether a 2nd or 3rd category is warranted.
  ```bash
  grep -A2 "id: \"ToolId\"" tools.js | grep "categories:"
  ```

- [ ] 🔍 **Tags are thorough** — covers what a user would search to find this tool. No obvious missing terms.
  ```bash
  grep -A3 "id: \"ToolId\"" tools.js | grep "tags:"
  # Count tags — flag if fewer than 8. Read and ask: what would a user search that isn't here?
  ```

- [ ] 🔍 **No Rule 10 violations in metadata** — `description`, `guide.overview`, `guide.howToUse`, `guide.tips`, `guide.pitfalls`, and `guide.example` must not reference specific psychological or medical diagnoses.
  ```bash
  grep -i "adhd\|autism\|neurodivergent\|executive function\|executive dysfunction\|sensory processing disorder\|spd\|bipolar\|ocd\|borderline" tools.js
  # Must return zero results
  ```

---

## SECTION 1 — FAMILY CONSISTENCY
> Every tool is a family member. A user moving from one tool to another should feel at home immediately.

### 1.1 Color System

- [ ] 🔍 **Uses the standard theme system** — all colors come from the `c = {}` config object. No bespoke hex values, no hardcoded Tailwind color classes outside the config block.
  ```bash
  # Check for raw hex values in JSX
  grep -n "#[0-9a-fA-F]\{3,6\}" ComponentName.js
  # Check for hardcoded Tailwind color classes directly in JSX (outside c = {} block)
  # Run both greps below — results that appear AFTER the c={} closing brace are violations:
  grep -n "className=.*bg-\|className=.*text-\|className=.*border-" ComponentName.js | grep -v "c\.\|isDark\|{`"
  # Zero results required
  ```

- [ ] 🔍 **Uses `useTheme()` → `isDark` pattern** — not `localStorage`, not `document.body`, not a custom hook.
  ```bash
  grep -n "useTheme\|isDark" ComponentName.js | head -5
  # Must show: import useTheme and const { isDark } = useTheme()
  grep -n "localStorage.*theme\|document\.body.*dark\|useColors\b" ComponentName.js
  # Must return zero results
  ```

  > ⚠️ **BUG PATTERN — External `useColors()` hook (discovered BrainRoulette audit)**
  > Defining a `useColors()` hook *outside* the component that calls `useTheme()` internally violates the inline `c = {}` rule and leaks raw `d` booleans into JSX.
  >
  > **Fix:** Delete the external hook. Move all keys into `const c = { ... }` inside the component.
  > ```bash
  > grep "c\.d[^a-zA-Z_]" ComponentName.js   # must return zero results
  > ```

- [ ] 🔍 **`c` object contains all standard keys** — `card`, `cardAlt`, `text`, `textSecondary`, `textMuted`, `input`, `btnPrimary`, `btnSecondary`, `border`, `success`, `warning`, `danger`.
  ```bash
  for key in card cardAlt text textSecondary textMuted input btnPrimary btnSecondary border success warning danger; do
    grep -c "${key}:" ComponentName.js | grep -q "^0$" && echo "MISSING: $key"
  done
  # Any MISSING output is a violation
  ```

- [ ] 🔍 **No banned `c` key names** — `divider`, `muted`, `label`, `accent`, `accentBg`, `dangerText`, `successText`, `warningText`, `info`, `purple` are never allowed.
  ```bash
  grep -n "\bdivider:\|\bmuted:\|\blabel:\|\baccent:\|\baccentBg:\|\bdangerText:\|\bsuccessText:\|\bwarningText:\|\binfo:\|\bpurple:" ComponentName.js
  # Must return zero results
  # Also check usage in JSX:
  grep -n "c\.\(divider\|muted\b\|label\b\|accent\b\|accentBg\|dangerText\|successText\|warningText\|info\b\|purple\b\)" ComponentName.js
  # Must return zero results
  ```

  > ⚠️ See full banned-key reference in the standard `c` object block below.

- [ ] 🔍 **`card` is background-only** — no `border-` class baked into the `card` key value.
  ```bash
  grep "card:" ComponentName.js | head -3
  # Value must start with bg- and must NOT contain border-
  grep "card:.*border-" ComponentName.js
  # Must return zero results
  ```

- [ ] 🔍 **All `c.*` references in JSX have a matching definition in the `c` block** — undefined keys silently resolve to `undefined`, producing a className like `"undefined rounded-lg p-3"` with no crash and no warning.
  ```bash
  # Extract all c.keyName usages:
  grep -oP '(?<=c\.)[a-zA-Z]+' ComponentName.js | sort | uniq > /tmp/c_used.txt
  # Extract all defined keys in the c block:
  grep -oP '^\s+\K[a-zA-Z]+(?=\s*:)' ComponentName.js | sort | uniq > /tmp/c_defined.txt
  # Find used-but-not-defined:
  comm -23 /tmp/c_used.txt /tmp/c_defined.txt
  # Must return zero results. Any output is a missing or misspelled key.
  ```

  > ⚠️ **BUG PATTERN — Typo in `c` key name / undefined `c` key (discovered WrongAnswersOnly audit, v4.23)**
  > `c.textMuteded` (typo for `c.textMuted`) and `c.quoteBg` (used but never defined) both resolve silently to `undefined`. The panel renders with no background — no crash, no React warning, just broken styling. The grep scan above catches both missing keys and typos in one pass. Always fix the definition, not the callsite spelling, unless the key is genuinely wrong everywhere.

- [ ] 🔍 **No local-scope lookup objects hiding banned colors** — `VERDICT_COLORS`, `ratingColors`, and similar inline objects must not use banned color families.
  ```bash
  grep -n "bg-blue\|text-blue\|bg-yellow\|text-yellow\|bg-purple\|text-purple\|bg-teal\|text-teal\|bg-indigo\|text-indigo\|bg-violet\|text-violet\|bg-stone\|text-stone" ComponentName.js | grep -v "^[[:space:]]*//"
  # Must return zero results
  ```

  > ⚠️ **BUG PATTERN — Lookup objects with raw Tailwind class strings bypassing `c` (discovered BrainRoulette audit, v4.16)**
  > Objects like `VERDICT_LABELS = { mostly_false: { color: 'text-red-500' } }` store raw class strings
  > that are interpolated directly into JSX: `className={VERDICT_LABELS[v]?.color}`. This bypasses the `c`
  > object entirely — colors are not theme-aware and can't be audited by the standard scan.
  >
  > **Fix:** Replace the `color` property with a `colorKey` string that names a key in `c`:
  > ```js
  > // ✅ CORRECT
  > VERDICT_LABELS = { mostly_false: { colorKey: 'verdictFalse' } }
  > // In c:
  > verdictFalse: isDark ? 'text-red-400' : 'text-red-600'
  > // In JSX:
  > className={c[VERDICT_LABELS[v]?.colorKey] || c.text}
  > ```
  > ```bash
  > # Scan for raw class strings in lookup objects:
  > grep -n "color: 'text-\|color: \"text-\|color:.*'bg-\|color:.*\"bg-" ComponentName.js
  > # Must return zero results
  > ```

- [ ] 🔍 🚨 **Approved color families only** — zinc, slate, cyan, emerald, amber, red, sky, green, gray. **Blue, purple, violet, indigo, teal, stone, yellow, rose, pink** are banned everywhere — in `c`, in local objects, and hardcoded in JSX.
  ```bash
  grep -n "\bbg-blue\|\btext-blue\|\bborder-blue\|\bbg-purple\|\btext-purple\|\bbg-violet\|\btext-violet\|\bbg-indigo\|\btext-indigo\|\bbg-teal\|\btext-teal\|\bbg-stone\|\btext-stone\|\bbg-yellow\|\btext-yellow" ComponentName.js | grep -v "^[[:space:]]*//"
  # Must return zero results
  ```

  > ⚠️ **BUG PATTERN — `teal` used instead of `cyan`**: `teal` is not in the approved palette. All interactive/accent uses must be `cyan`.
  > ```bash
  > grep -n "\bteal-" ComponentName.js   # must return zero results
  > ```

  > ⚠️ **BUG PATTERN — Non-standard neutral family**: The approved neutral is **zinc** (not stone, not neutral). Light mode surfaces use `slate`. See replacement table in bug pattern notes.

- [ ] 🔍 **`btnPrimary` uses cyan** — not amber, not green, not any other family.
  ```bash
  grep "btnPrimary:" ComponentName.js
  # Value must contain bg-cyan- in both dark and light branches
  grep "btnPrimary:.*amber\|btnPrimary:.*green\|btnPrimary:.*blue" ComponentName.js
  # Must return zero results
  ```

- [ ] 🔍 **`linkStyle` is a standalone constant** — defined as `const linkStyle = isDark ? ...` *after* the `c = {}` block. Never nested inside `c`.
  ```bash
  grep -n "linkStyle" ComponentName.js
  # Must find: const linkStyle = isDark ? ...
  # Must NOT find: linkStyle: isDark ? ... (inside c block)
  grep "linkStyle:.*isDark" ComponentName.js
  # Must return zero results
  ```

- [ ] 🔍 **No hardcoded light-only or dark-only colors in JSX** — every color reference traces back to a `c.*` key.
  ```bash
  # Find className strings with raw Tailwind color classes not wrapped in c.* or isDark
  grep -n 'className=.*"[^"]*\b\(bg\|text\|border\)-[a-z]\+-[0-9]\+[^"]*"' ComponentName.js | grep -v "c\.\|animate\|rounded\|shadow\|opacity\|ring\|outline\|flex\|grid\|p-\|m-\|w-\|h-\|font\|text-[sxlb]\|text-xs\|text-sm\|text-base\|text-lg\|text-xl\|space\|gap\|overflow\|z-\|col\|row\|sr-"
  # Review each result — raw color classes in className literals are violations
  ```

  > ⚠️ **BUG PATTERN — Helper functions returning light-mode-only class strings (discovered ConflictCoach audit, v4.20)**
  > Helper functions that return Tailwind class strings (e.g. `histTempBadge`, `tempColor`, status mappers)
  > must account for `isDark`. A function that returns only `'bg-red-100 text-red-700'` without checking
  > `isDark` will render light-mode colors in dark mode, even when called from inside `c.*`-styled cards.
  >
  > **Fix:** Add `isDark` branches to every class-returning helper function:
  > ```js
  > // ❌ WRONG — light-mode only
  > const histTempBadge = (t) => t === 'high' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700';
  >
  > // ✅ CORRECT — dark-mode aware
  > const histTempBadge = (t) => {
  >   if (t === 'high') return isDark ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-700';
  >   return isDark ? 'bg-emerald-900/40 text-emerald-300' : 'bg-emerald-100 text-emerald-700';
  > };
  > ```
  > ```bash
  > # Scan for helper functions that return raw class strings without isDark:
  > grep -n "=> .*'bg-\|=> .*'text-\|=> .*'border-" ComponentName.js | grep -v "isDark"
  > # Review each result — any that return a class string without isDark are violations
  > ```

**Standard `c` object reference:**
```js
const c = {
  card:          isDark ? 'bg-zinc-800'  : 'bg-white',
  cardAlt:       isDark ? 'bg-zinc-700/50' : 'bg-slate-50',
  text:          isDark ? 'text-zinc-50'  : 'text-gray-900',
  textSecondary: isDark ? 'text-zinc-300' : 'text-gray-600',
  textMuted:     isDark ? 'text-zinc-500' : 'text-gray-400',
  input:         isDark ? 'bg-zinc-700 border-zinc-600 text-zinc-100 placeholder-zinc-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400',
  btnPrimary:    isDark ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                        : 'bg-cyan-600 hover:bg-cyan-700 text-white',
  btnSecondary:  isDark ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-100'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700',
  border:        isDark ? 'border-zinc-700' : 'border-gray-200',
  success:       isDark ? 'bg-green-900/20 border-green-700 text-green-200'
                        : 'bg-green-50 border-green-300 text-green-800',
  warning:       isDark ? 'bg-amber-900/20 border-amber-700 text-amber-200'
                        : 'bg-amber-50 border-amber-300 text-amber-800',
  danger:        isDark ? 'bg-red-900/20 border-red-700 text-red-200'
                        : 'bg-red-50 border-red-200 text-red-800',
  // NOTE: 'info' (blue box) is NOT in the standard. Use highlightBg (cyan) or warning (amber) instead.
};

const linkStyle = isDark
  ? 'text-cyan-400 hover:text-cyan-300 underline underline-offset-2'
  : 'text-cyan-600 hover:text-cyan-700 underline underline-offset-2';
```

### 1.2 Layout & Header Pattern

- [ ] 🔍 **Tool card uses the standard color frame** — the `ToolPageWrapper` renders every tool inside a `<section>` with `headerColor` as a top-heavy gradient background (solid for ~60px, fading to transparent by ~220px) and the tool's content inside a white inner div with **`m-8 rounded-xl p-6`** (32px margin). This creates a thick colored frame that is heaviest at the top and fades away — identical across all tools. **This is controlled entirely by `ToolPageWrapper.js` and `tools.js` — tools themselves must never set their own background color on their outermost wrapper div.**

  **Critical `ToolPageWrapper` values — never change without visual QA:**
  | Element | Class/Style | Effect if changed |
  |---------|------------|-------------------|
  | `<section>` gradient | `solid 0%, solid 60px, transparent 220px` | Frame height / fade shape |
  | Inner div | `m-8 rounded-xl p-6` | Frame thickness (m-8 = 32px — must not shrink) |
  | Bookmark row | `mt-4 mb-2` | Spacing between description and buttons |

  ```bash
  grep -n "min-h-screen\|bg-white\|bg-zinc\|background:" ComponentName.js | head -10
  # Must return zero results for any background color set on the outermost wrapper div
  grep -n "headerColor" tools.js | grep "ToolId"
  # Confirm headerColor is set and matches the tool's category color family (see CATEGORY-COLOR-MAP-2.md)
  ```

  > ⚠️ **BUG PATTERN — Tool sets its own background color on root div (v4.31)**
  > Some tools set `min-h-screen` + a background color on their outermost div (e.g. `<div className="min-h-screen bg-slate-50 ...">`). This overrides the `ToolPageWrapper` frame entirely — the category color disappears and the tool looks like a bare white page, inconsistent with the family. The tool component's root element must be a plain `<div>` with no background. All background styling comes from `ToolPageWrapper`.

  > ⚠️ **BUG PATTERN — ToolPageWrapper change regresses frame or spacing (v4.32)**
  > When `ToolPageWrapper.js` is edited, two regressions are common: (1) the inner div margin shrinks (e.g. `m-3` instead of `m-8`), making the colored frame visibly thin; (2) `mt-4` is dropped from the bookmark/dark mode row, collapsing the spacing between the description and the buttons. Both are invisible to the audit script. **Rule: any edit to `ToolPageWrapper.js` must be followed by a live visual check of at least two tools — one with results loaded, one without.**

- [ ] 🔍 **Input area is a card** — wrapped in `${c.card} rounded-xl shadow-lg`. Not a bare div.
  ```bash
  grep -n "rounded-xl shadow-lg" ComponentName.js | head -5
  grep -n "c\.card" ComponentName.js | head -5
  # Confirm the primary input container uses c.card + rounded-xl shadow-lg
  ```

- [ ] 🔍 **Header follows standard pattern** — card opens with a `border-b ${c.border}` div containing `<h2>` (icon first, then title) and a subtitle `<p>` in `c.textSecondary`. Both are left-aligned — no `text-center` on the header or tagline.
  ```bash
  grep -n "border-b\|c\.border\|c\.textSecondary" ComponentName.js | head -10
  grep -n "<h2" ComponentName.js
  # Verify: border-b and c.border appear near <h2>; icon span precedes title text
  ```

- [ ] 🔍 **Header and content are left-aligned** — `text-center` is banned on the tool `<h2>`, tagline `<p>`, and input card content. Left-alignment is the unconditional standard across all tools; centered headers create visual inconsistency in the family.
  ```bash
  grep -n "text-center" ComponentName.js | head -20
  # Flag any text-center on: the h2, tagline p, input labels, or card-level wrappers
  # Allowed only on: stat/score display numbers, isolated metric callouts inside result cards
  ```

  > ⚠️ **BUG PATTERN — Centered tool header (discovered session 88, v4.29)**
  > Some tools wrap the `<h2>` block in `<div className="text-center ...">` — a pattern inherited from landing-page-style layouts. This creates inconsistency across the family, where most tools use left-aligned card headers. The correct pattern is always left-aligned: `<h2 className={...}><span className="mr-2">{tool?.icon}</span>{tool?.title}</h2>`. Remove any `text-center` ancestor of the header block.

- [ ] 🔍 **Primary submit button is full-width** — uses `w-full`, `min-h-[48px]` (or `py-3`+), and `c.btnPrimary`.
  ```bash
  grep -n "w-full.*btnPrimary\|btnPrimary.*w-full" ComponentName.js
  grep -n "handleSubmit\|handleBuild\|onClick.*submit\|onClick.*build" ComponentName.js | head -5
  # Confirm the primary CTA button has w-full and c.btnPrimary
  ```

- [ ] 🔍 **Results appear below input card** — results container is a sibling after the input card, not a replacement.
  ```bash
  grep -n "results\b\|setResults\b" ComponentName.js | head -10
  # Confirm input card and results are siblings (both rendered), not conditionally swapped
  # Look for: {results && (...)} appearing AFTER the input card JSX, not instead of it
  ```

- [ ] 🔍 **Consistent section spacing** — top-level cards separated by `space-y-4` or `space-y-5` on the wrapper.
  ```bash
  grep -n "space-y-" ComponentName.js | head -10
  # Confirm outer wrapper uses space-y-4 or space-y-5
  ```

### 1.3 Dark Mode Visual Check
> All items require a live browser test. Toggle via Chrome DevTools → Rendering → "Emulate CSS prefers-color-scheme: dark".

- [ ] 🧪 **All body text is readable** — WCAG minimum 4.5:1 for normal text, 3:1 for large/bold.
- [ ] 🧪 **All secondary and muted text is readable** — `textSecondary` and `textMuted` pass contrast against their actual background.
- [ ] 🧪 **No white or light boxes in dark mode** — every card, panel, and container has a dark background.
- [ ] 🧪 **Input fields are fully themed** — background, border, typed text, and placeholder all visible in dark mode.
- [ ] 🧪 **Status colors readable in both modes** — success, warning, danger each pass contrast in light AND dark.
- [ ] 🧪 **Chip/toggle active state visible in both modes** — selected vs unselected is obvious without relying on color alone.
- [ ] 🧪 **Disabled button state is visually distinct but not invisible.**
- [ ] 🧪 **Range/slider inputs visible** — if present, custom track and thumb styles render correctly in both modes.
- [ ] 🧪 **No flash of wrong theme on load.**

### 1.4 Action Buttons

> 🚨 **SHARED INFRASTRUCTURE FILES ARE READ-ONLY DURING AUDITS**
> `ToolPageWrapper.js`, `ActionBarContext.js`, `ActionButtons.js`, `useTheme.js`, `App.js`, and all other shared components must **never** be modified during a tool audit unless explicitly requested by the user. These files govern the layout and behavior of every tool on the site. A one-line change to any of them can break every tool simultaneously.
>
> **If a visual problem is reported:** The cause is always in the tool file — not the wrapper. The first diagnostic question is always: *"Has the audited tool file been deployed?"* — not *"Is there a layout bug in the wrapper?"*
>
> **The ActionBar position is fixed by design:** It sits to the RIGHT of the Bookmark and Dark Mode buttons in the `ToolPageWrapper` header row, right-aligned by the `justify-between` outer flex container. This position was intentionally designed. Do not move it, do not propose changes to the wrapper structure, do not "fix" it without being explicitly asked.

> `ActionBar` lives in the **`ToolPageWrapper` persistent header row** — right side, with bookmark and dark/light mode buttons on the left. Tools register their export content via `useRegisterActions(content, title)` — the wrapper renders the ActionBar automatically when content is available. An inline `<ActionBar>` remaining in tool JSX is a duplicate violation. Standalone `CopyBtn` or `PrintBtn` are still allowed inside a tool for per-item actions (e.g. copy a single question). The absolute rule: **never use `window.open` / `buildPrintHtml` for custom printing** — use `PrintBtn` from ActionButtons instead.

- [ ] 🔍 **Imports `useRegisterActions` from `../components/ActionBarContext`** — and calls it with the tool's export content and title.
  ```bash
  grep -n "useRegisterActions\|ActionBarContext" ComponentName.js
  # Must show: import { useRegisterActions } from '../components/ActionBarContext'
  # Must show: useRegisterActions(...) called in the component body
  ```

- [ ] 🔍 **No inline `<ActionBar>` in results output** — the wrapper header renders it. An `<ActionBar>` still in the tool JSX is a duplicate and must be removed.
  ```bash
  grep -n "<ActionBar" ComponentName.js
  # Must return zero results (ActionBar is now rendered by ToolPageWrapper, not the tool)
  # Exception: standalone CopyBtn/PrintBtn for per-item actions are still fine
  ```

- [ ] 🔍 **`useRegisterActions` called with correct content** — passes the tool's full export string (e.g. `buildFullExport()`) and `tool?.title`. Content must include `BRAND` so copy output ends with the DeftBrain attribution line.
  ```bash
  grep -n "useRegisterActions" ComponentName.js
  # Must show content builder function (buildFullExport, buildText, etc.) passed as first arg
  # Must NOT pass an empty string or null — that hides the ActionBar entirely
  ```

- [ ] 🔍 **No `lucide-react` imports** — all icons are emojis in `<span>` tags.
  ```bash
  grep -n "lucide-react\|from 'lucide'" ComponentName.js
  # Must return zero results
  ```

- [ ] 🔍 **No custom print bypass** — no `window.open`, `buildPrintHtml`, or hardcoded `.branding` div. All printing must go through `PrintBtn` from ActionButtons (called via ActionBar in the wrapper).
  ```bash
  grep -n "window\.open\|buildPrintHtml\|buildPrintHTML\|class=\"branding\"\|className=\"branding\"" ComponentName.js
  # Must return zero results
  ```

- [ ] 🔍 **Copy content includes DeftBrain branding** — `BRAND` constant used, ends with `\n\n— Generated by DeftBrain · deftbrain.com`.
  ```bash
  grep -n "const BRAND" ComponentName.js
  grep -n "BRAND" ComponentName.js | grep -v "const BRAND"
  # Second grep must return at least one result (BRAND must be used, not just defined)
  ```

  > ⚠️ **BUG PATTERN — `BRAND` defined but not wired (discovered WrongAnswersOnly audit, v4.23)**
  > `const BRAND` declared at top of file but `buildFullText` hardcoded the branding string directly: `lines.push('\n— Generated by DeftBrain · deftbrain.com')`. This passes the "is BRAND defined?" scan but means any future change to BRAND won't propagate. **Fix:** Replace all hardcoded branding strings with `lines.push(BRAND)`.

### 1.5 Navigation & State — Reset, Rerun, History

- [ ] 🔍 **"Start Over" / Reset button present in results view.**
  ```bash
  grep -n "reset\|Start Over\|startOver\|setResults(null)\|setResults(undefined)" ComponentName.js | head -10
  # Must show a reset function and a button that calls it
  ```

- [ ] 🔍 **Reset is visually distinct from Rerun** — Reset uses `btnSecondary`; Rerun can use `btnPrimary`.
  ```bash
  grep -n "reset\|Start Over" ComponentName.js | grep -i "btn\|class"
  # Confirm reset button uses c.btnSecondary, not c.btnPrimary
  ```

- [ ] 🔍 **"Run again" produces a different result** — tools with a secondary submit ("Different Answer", "Try Again", "Regenerate") must send a variation signal to the API so the model doesn't return identical output.
  ```bash
  grep -n "seed\|timestamp\|Date\.now\|Math\.random\|variation\|attempt" ComponentName.js | grep -v "^[[:space:]]*//"
  # At least one of these must appear in the API payload object passed to callToolEndpoint
  # If the payload is identical on every call, the backend has no signal to vary its output
  ```

  > ⚠️ **BUG PATTERN — "Run again" returns identical answer (discovered WrongAnswersOnly audit, v4.23)**
  > The "Different Wrong Answer" button called `runWrong()` which sent the exact same payload as the first call. The model returned identical output every time. **Fix:** Add `seed: Date.now()` to the API payload. The backend route should pass this through to the Claude prompt (e.g. as `"(variation #${seed})"`) or simply rely on model non-determinism being nudged by the changed input. Either way, the payload must differ on each call.

- [ ] 🔍 **Per-tool history implemented** — `usePersistentState` for history array.
  ```bash
  grep -n "history\|usePersistentState" ComponentName.js | head -10
  # Must show: const [history, setHistory] = usePersistentState(...)
  ```

- [ ] 🔍 **History entry contains `preview` (primary input truncated to ~40 chars) and `result`.**
  ```bash
  grep -n "preview:\|\.slice(0, 40)\|\.slice(0,40)" ComponentName.js
  grep -n "result: data\|result: parsed\|result:" ComponentName.js | grep "history\|setHistory" -A2
  # Both preview and result must appear in the history entry object
  ```

- [ ] 🔍 **History capped at 5–6 entries.**
  ```bash
  grep -n "\.slice(0, [56]\b\|\.slice(0,[56]\b" ComponentName.js
  # Must show .slice(0, 5) or .slice(0, 6) on the history setter
  grep -n "\.slice(0, [789]\|\.slice(0, 10\|\.slice(0, 1[0-9]" ComponentName.js | grep -i "history\|setHistory"
  # Must return zero results (cap must not exceed 6)
  ```

- [ ] 🔍 **History panel rendered in JSX** — history entries are displayed and clickable.
  ```bash
  grep -n "history\.map\|history\.length" ComponentName.js
  # Must return results showing history is rendered in JSX, not just stored
  ```

### 1.6 Mobile Responsiveness
> Every tool must be fully usable on a 375px-wide screen.

- [ ] 🧪 **No horizontal scroll at 375px**
- [ ] 🧪 **All tap targets ≥ 44×44px**
- [ ] 🧪 **Depth/mode selectors wrap gracefully**
- [ ] 🧪 **Quick-prompt chips don't create excessive rows**
- [ ] 🧪 **Reset and Rerun buttons are thumb-reachable**
- [ ] 🧪 **ActionBar buttons have sufficient spacing**
- [ ] 🧪 **Results grid collapses correctly** — `grid-cols-2` → `grid-cols-1` on mobile.
  ```bash
  grep -n "grid-cols-2" ComponentName.js
  # Every grid-cols-2 must be paired with sm:grid-cols-2 or preceded by grid-cols-1
  grep "grid-cols-2" ComponentName.js | grep -v "sm:\|md:\|lg:"
  # Results here are potential mobile layout bugs — review each
  ```
- [ ] 🧪 **Text does not clip or truncate unintentionally**
- [ ] 🔍 **Share via Web Share API is mobile-first** — `ActionBar`'s Share uses `navigator.share`.
  ```bash
  grep -n "navigator\.share\|Web Share" ComponentName.js ../components/ActionButtons.js
  # Must show navigator.share usage in ActionBar implementation
  ```

### 1.7 Component Patterns

- [ ] 🔍 **No unused imports** — every named import is referenced in the component body. Unused imports produce ESLint warnings that mask real errors.
  ```bash
  # Spot-check the most common offenders:
  grep -n "useEffect\b" ComponentName.js | grep -v "import\|//"
  # If useEffect appears only in the import line, it's unused — remove it
  grep -n "\bCopyBtn\b" ComponentName.js | grep -v "import\|//"
  # If CopyBtn appears only in the import line, it's unused — remove it
  ```

  > ⚠️ **BUG PATTERN — Unused `useEffect` and `CopyBtn` imports (discovered WrongAnswersOnly audit, v4.23)**
  > `useEffect` left over from a refactor and `CopyBtn` imported "just in case" both produce ESLint `no-unused-vars` warnings. These are harmless individually but accumulate warning noise that masks real issues. Remove any import not referenced below the import block.

- [ ] 🔍 **`useCallback` dependency arrays are complete** — all `setState` functions from `usePersistentState` that are called inside a `useCallback` must be listed as deps.
  ```bash
  grep -n "useCallback" ComponentName.js
  # For each useCallback, read its dep array and verify every set* called inside is listed.
  # Missing set* deps create stale closures where the callback captures an outdated setter.
  ```

  > ⚠️ **BUG PATTERN — Missing `set*` deps in `useCallback` (discovered WrongAnswersOnly audit, v4.23)**
  > `setResults` and `setHistory` omitted from the `runWrong` dep array created a stale closure — "Different Wrong Answer" never cleared the previous result. ESLint flags this as `react-hooks/exhaustive-deps`. **Fix:** Add all called `set*` functions to the dep array. `usePersistentState` setters are stable references so this is safe.

- [ ] 🔍 **`displayName` set** — last line before `export default`.
  ```bash
  grep -n "displayName" ComponentName.js
  # Must show: ComponentName.displayName = 'ComponentName'
  # Must be within the last ~5 lines before export
  ```

- [ ] 🔍 **No inline state for copy feedback** — no `copiedField`, `copiedIndex`, `isCopied`, or local `CopyBtn` definitions.
  ```bash
  grep -n "copiedField\|copiedIndex\|isCopied\|setCopied\b" ComponentName.js
  grep -n "const CopyBtn\|function CopyBtn" ComponentName.js
  # Both must return zero results
  ```

- [ ] 🔍 **Primary input persisted** — the tool's main input field uses `usePersistentState`.
  ```bash
  grep -n "usePersistentState" ComponentName.js
  # The primary user-facing input (main textarea or text field) must use usePersistentState
  # Confirm the key name is tool-scoped (e.g. 'brag-accomplishments', not 'input')
  ```

- [ ] 🔍 **Last result persisted** — most recent result uses `usePersistentState`, not `useState`.
  ```bash
  grep -n "results\b.*usePersistentState\|usePersistentState.*results\b" ComponentName.js
  # Must return a result. If results uses useState, that's a violation.
  grep -n "const \[results\b" ComponentName.js
  # If this shows useState, it's a violation — must be usePersistentState
  ```

---

## SECTION 2 — FUNCTIONAL RELIABILITY

### 2.1 Input Handling

- [ ] 🔍 **Required fields clearly marked** — muted asterisk only. Never `text-red-500` for required markers.
  ```bash
  grep -n "text-red-500\|text-red-600" ComponentName.js | grep -v "danger\|error\|c\."
  # Any text-red- class outside the danger/error context is a potential violation
  # Required field markers must use c.textMuted, never raw red
  ```

- [ ] 🔍 🧪 **Enter/Return submits** — every text input has a keyboard path to the submit action.
  ```bash
  grep -n "onKeyDown\|onKeyPress\|key.*Enter\|Enter.*key" ComponentName.js | grep -v "^[[:space:]]*//"
  # For EVERY onKeyDown handler found, read it and verify:
  # 1. Does at least one branch call the submit/build/generate handler?
  # 2. If tool has add-items pattern: does Enter on empty field also submit?
  # An onKeyDown that ONLY calls addItem() with no submit path is a FAIL.
  ```

- [ ] 🔍 🚨 **Global `Cmd/Ctrl+Enter` listener present** — every tool must have a document-level keydown listener that triggers submit when `Cmd+Enter` (Mac) or `Ctrl+Enter` (Windows) is pressed from anywhere on the page. An `onKeyDown` on a single input field is insufficient — it only fires when that field has focus.
  ```bash
  grep -n "document.addEventListener.*keydown\|document.addEventListener.*'keydown'" ComponentName.js
  # Must return at least one result — global listener is required in every tool
  grep -n "metaKey\|ctrlKey" ComponentName.js
  # Must return at least one result confirming Cmd/Ctrl is checked
  grep -n "metaKey.*ctrlKey\|ctrlKey.*metaKey" ComponentName.js
  # Must show both metaKey AND ctrlKey checked together (cross-platform)
  ```
  > **Required pattern** (in a `useEffect` with cleanup):
  > ```js
  > useEffect(() => {
  >   const handler = (e) => {
  >     if (e.key !== 'Enter' || !(e.metaKey || e.ctrlKey)) return;
  >     const tag = document.activeElement?.tagName;
  >     if (tag === 'TEXTAREA') return; // let textarea handle its own newlines
  >     if (!canSubmit || loading) return;
  >     e.preventDefault();
  >     handleSubmit();
  >   };
  >   document.addEventListener('keydown', handler);
  >   return () => document.removeEventListener('keydown', handler);
  > // eslint-disable-next-line react-hooks/exhaustive-deps
  > }, [loading, handleSubmit]);
  > ```
  > Note: TEXTAREA inputs should be excluded from the global listener (they may have their own Cmd+Enter behavior). INPUT fields do not need exclusion — the global listener covers them.

⚠️ BUG PATTERN — Pill-only inputs never receive Enter (discovered BrainStateDeejay/BrainRoulette)
Tools whose primary inputs are pill buttons or dropdowns (no text field) have no natural keyboard path to submit — clicking a pill leaves focus on the button, which doesn't propagate to any onKeyDown handler.
Fix: Add a document-level listener inside a no-dep-array useEffect. Guard against firing when an INPUT or TEXTAREA is focused (to avoid double-firing on tools that also have text fields).

useEffect(() => {
  const handleKeyDown = (e) => {
    if (e.key !== 'Enter') return;
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (!canSubmit) return;
    e.preventDefault();
    handleSubmit();
  };
  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
});
  ```
  > ⚠️ **BUG PATTERN — Enter adds but never submits (discovered BragSheetBuilder audit, v4.14)**
  > **Required behavior for add-then-submit inputs:**
  > - Plain `Enter` + text typed → add item
  > - Plain `Enter` on empty field (items exist) → trigger build
  > - `Cmd/Ctrl+Enter` anywhere → trigger build

  > ⚠️ **BUG PATTERN — Broken toggle `<label>` wrapper (discovered BuyWise audit, v4.19)**
  > A `<label>` used as a clickable toggle wrapper without an `<input>` inside it and without its own `onClick` is completely non-interactive. Clicking the label does nothing — `onChange` never fires because there's no controlled input, and there's no click handler to call `setState`.
  >
  > **Fix:** Replace the `<label>` wrapper with a `<button>` that has an explicit `onClick={() => setState(p => !p)}`. This is the correct React pattern for custom toggle UI.
  > ```bash
  > # Scan for label-based toggles with no onClick and no input child:
  > grep -n "<label" ComponentName.js | grep -v "className.*sr-only\|htmlFor="
  > # For each result: verify it has onClick OR contains <input type="checkbox">
  > # A <label> with neither is a silent no-op
  > ```
  > **Wrong:**
  > ```jsx
  > <label className="...">  {/* ← clicks do nothing */}
  >   <div>checkmark UI</div>
  >   <span>Toggle label</span>
  > </label>
  > ```
  > **Correct:**
  > ```jsx
  > <button onClick={() => setIsActive(p => !p)} className="... text-left min-h-[44px]">
  >   <div>checkmark UI</div>
  >   <span>Toggle label</span>
  > </button>
  > ```

- [ ] 🔍 **Submit blocked on empty required fields** — button is `disabled` when required inputs are empty.
  ```bash
  grep -n "disabled={" ComponentName.js | grep -i "loading\|empty\|trim\|length"
  # Primary submit button must have a disabled condition based on input state
  ```

- [ ] 🔍 **No phantom state** — stale results from a previous mode/tab are cleared on mode change.
  ```bash
  grep -n "setResults\|setError\|setActiveTab\|setMode" ComponentName.js | head -20
  # Confirm setResults(null) or setError('') appears in reset/mode-change handlers
  ```

### 2.2 API & Backend

- [ ] 🔍 🚨 **Backend uses `callClaudeWithRetry`** — never raw `anthropic.messages.create`.
  ```bash
  grep -n "callClaudeWithRetry\|anthropic\.messages\.create" backend.js
  # Must show callClaudeWithRetry on every route
  # anthropic.messages.create must return zero results (or only in documented exceptions)
  ```

- [ ] 🔍 🚨 **Backend routes match frontend calls** — every `callToolEndpoint('route-name')` in the frontend must have a corresponding `router.post('/route-name')` in the backend.
  ```bash
  # Extract all frontend endpoint strings:
  grep -o "callToolEndpoint('[^']*')" ComponentName.js | sort -u
  # Extract all backend route declarations:
  grep -o "router\.post('[^']*'" backend.js | sort -u
  # Diff them — any frontend endpoint with no matching backend route is a launch blocker.
  ```

  > ⚠️ **BUG PATTERN — Incomplete backend upload (discovered BrainRoulette audit, v4.16)**
  > A tool may have multiple backend route files (e.g., one file per feature version). When uploading for audit,
  > ensure ALL route files that serve this tool's frontend are included. A missing backend file produces no
  > import errors — the failure only manifests as a 404 at runtime when the user triggers that feature.
  > **Fix:** Grep both sides as above and upload any missing route files before marking the audit complete.

- [ ] 🔍 🚨 **Rate limiter active** — covered globally in `server.js` or per-route via `rateLimit(DEFAULT_LIMITS)`.
  ```bash
  grep -n "rateLimit\|rateLimiter\|DEFAULT_LIMITS" backend.js server.js
  # At least one of these must cover the route
  grep -n "require.*rateLimiter\|require.*rateLimit" backend.js
  ```

- [ ] 🔍 🚨 **400 on missing required fields, never 500** — backend validates before calling Claude.
  ```bash
  grep -n "res\.status(400)\|return res\.status(400)" backend.js
  # Must appear once per required-field check, before any callClaudeWithRetry call
  grep -n "if (!" backend.js | head -20
  # Every if (!requiredField) should be followed by res.status(400)
  ```

- [ ] 🔍 **Missing optional fields handled on frontend** — optional fields accessed with `?.` or guarded defaults.
  ```bash
  grep -n "results\." ComponentName.js | grep -v "\?\." | head -20
  # Any result.field without ?. is a potential crash if the field is absent
  # Review each — required fields are OK; optional fields must use ?.
  ```

### 2.3 State Management

- [ ] 🔍 🚨 **Loading spinner uses the tool's own icon** — `animate-spin` on `{tool?.icon ?? 'fallback'}`. Never ⏳.
  ```bash
  grep -n "⏳" ComponentName.js
  # Must return zero results
  grep -n "animate-spin" ComponentName.js
  # Must return results showing animate-spin paired with tool?.icon
  grep -n "animate-spin.*tool\|tool.*animate-spin" ComponentName.js
  ```

- [ ] 🔍 🚨 **No double-submit** — submit button disabled while loading.
  ```bash
  grep -n "disabled={loading\|disabled={.*loading" ComponentName.js
  # Every submit button must include loading in its disabled condition
  ```

- [ ] 🔍 🚨 **No stale state** — `setResults(null)` called before new request.
  ```bash
  grep -n "setResults(null)\|setResults(undefined)\|setError('')\|setError(\"\")" ComponentName.js
  # Must appear inside the submit handler, before the API call
  ```

- [ ] 🔍 **Error state is informative** — error is displayed to the user with actionable text.
  ```bash
  grep -n "error &&\|{error}\|error ?\|setError(" ComponentName.js | head -10
  # Confirm error is rendered in JSX (not just set in state and ignored)
  grep -n "An error occurred\|Something went wrong" ComponentName.js
  # Generic messages — flag for improvement
  ```

- [ ] 🔍 **Reset clears all state** — inputs, results, and error all cleared by the reset function.
  ```bash
  grep -n "const reset\|function reset\|const handleReset\|function handleReset" ComponentName.js
  # Read the reset function — verify it calls: setResults(null), setError(''), and clears primary inputs
  grep -A 10 "const reset\b\|const handleReset\b" ComponentName.js
  ```

- [ ] 🔍 🚨 **No silent saves** — any localStorage write gives immediate visual feedback (button state flip ≥ 2s + location hint).
  ```bash
  grep -n "usePersistentState\|localStorage\.setItem" ComponentName.js
  # For every write-triggering button, check that a feedback state exists:
  grep -n "setSaved\|setBookmarked\|setLogged\|Saved\|saved" ComponentName.js | head -10
  # Every save action must have a corresponding feedback state that flips for ~2s
  ```

---

## SECTION 3 — CONTENT QUALITY & DEPTH

### 3.1 Value Proposition
- [ ] 🧪 **Passes the "ChatGPT test"** — output is meaningfully better/faster/more structured than a general chatbot.
- [ ] 🧪 **Structured output** — results are organized into scannable sections.
- [ ] 🧪 **Actionable results** — user gets something they can immediately use.
- [ ] 🔍 **Tool delivers on its description** — `tools.js` description matches what the tool actually produces.
  ```bash
  grep -A3 "id: \"ToolId\"" tools.js | grep "description:"
  # Read description, then read the component's output JSX — do they match?
  ```

### 3.2 Depth & Reusability
- [ ] 🔍 **Not one-shot shallow** — tool has follow-up actions, adjustable modes, or layers.
  ```bash
  grep -n "activeTab\|setMode\|setView\|handleRefine\|handleTweak\|handleFollow" ComponentName.js | head -10
  # At least one secondary action or mode beyond the initial submit
  ```

- [ ] 🧪 **Different inputs yield genuinely different results.**
- [ ] 🔍 **Reason to return** — history panel, persistent state, or evolving utility.
  ```bash
  grep -n "usePersistentState\|history\b" ComponentName.js | wc -l
  # Should show multiple persistent state uses; history panel rendered
  ```

---

## SECTION 4 — INTERNATIONALIZATION (i18n)

### 4.1 AI Response Language

- [ ] 🔍 **Backend uses `withLanguage()`** — wraps prompts for non-English users.
  ```bash
  grep -n "withLanguage\|userLanguage" backend.js
  # Must appear in every route's prompt and system prompt
  grep -n "withLanguage" backend.js | wc -l
  # Count — should be ≥ 2× the number of routes (system + user prompt each)
  ```

- [ ] 🔍 **JSON keys remain English** — only string values are translated, not structural keys.
  ```bash
  # This is verified by reading the JSON spec in the backend prompt.
  grep -n "Return ONLY valid JSON\|json spec\|output spec" backend.js | head -5
  # Confirm JSON keys in the spec are English identifiers (camelCase/snake_case)
  ```

- [ ] 🔍 **Frontend doesn't compare against AI-returned string values.**
  ```bash
  grep -n "=== '" ComponentName.js | grep -v "isDark\|activeTab\|tone\|level\|severity\|type\|mode\|tab"
  # Any string comparison against an AI-returned value is a potential i18n failure
  # Review each result
  ```

### 4.2 UI Readiness

- [ ] 🔍 **Date/time formats use locale-aware formatting** — not hardcoded US strings.
  ```bash
  grep -n "toLocaleDateString\|toLocaleTimeString\|Intl\." ComponentName.js
  # If dates are displayed, one of these must be present
  grep -n "new Date.*toISOString\b" ComponentName.js | grep -v "timestamp\|history\|entry"
  # ISO strings shown directly to users (not just stored) are a localization issue
  ```

---

## SECTION 5 — POLISH & PRESENTATION

### 5.1 Visual Quality
- [ ] 🧪 **No layout jank on result load.**
- [ ] 🔍 **No orphaned UI elements** — every button and section is functional.
  ```bash
  grep -n "onClick\|href=" ComponentName.js | grep -v "={\|{(" | head -20
  # Scan for onClick or href with empty/placeholder values
  grep -n "onClick={() => {}}\|onClick={()=>{}}\|href=\"#\"" ComponentName.js
  # Must return zero results
  ```
- [ ] 🧪 **Results are scannable.**

### 5.2 Empty State & First Impression
- [ ] 🔍 **Empty-state hook present** — something explains why the tool is worth using before submit.
  ```bash
  grep -n "!results\b\|results === null\|!data\b" ComponentName.js | head -5
  # Read the JSX rendered when there are no results — is there more than a bare input form?
  ```

- [ ] 🔍 **Result stickiness** — score, grade, history panel, or persistent output gives a reason to return.
  ```bash
  grep -n "history\|score\|grade\|usePersistentState.*result" ComponentName.js | head -10
  ```

### 5.3 Output & Sharing

- [ ] 🔍 **`ActionBar` present.**
  ```bash
  grep -n "<ActionBar" ComponentName.js
  # Must return at least one result
  ```

- [ ] 🔍 **No duplicate action buttons.**
  ```bash
  grep -n "<PrintBtn\|<ShareBtn" ComponentName.js
  # Must return zero results when ActionBar is present
  ```

- [ ] 🔍 **Shared/printed output includes DeftBrain credit.**
  ```bash
  grep -n "deftbrain\.com\|Generated by DeftBrain\|BRAND" ComponentName.js
  # Must appear in BRAND constant definition and in print template
  ```

- [ ] 🧪 **Share uses native OS share sheet on mobile.**

### 5.4 Disclaimers

- [ ] 🔍 **"AI-generated" note present** — wherever users might treat output as authoritative.
  ```bash
  grep -in "ai.generated\|ai generated\|generated by ai\|not a lawyer\|not financial advice\|not medical advice\|consult a" ComponentName.js
  # At least one disclaimer must appear
  ```

- [ ] 🔍 **Domain-specific disclaimer present if applicable** — legal, medical, or financial tools need explicit disclaimers.
  ```bash
  grep -in "not a lawyer\|not legal advice\|not financial advice\|not a doctor\|not medical advice" ComponentName.js
  # Required if tool touches those domains. N/A otherwise.
  ```

### 5.5 Cross-Tool Links

> **Placement standard:** Cross-refs live at the *bottom* of their section — never immediately under the title or tagline.
> - **Pre-result:** below the submit button, at the bottom of the input area
> - **Post-result:** below the results content, at the bottom of the results section
> - Both must be plain `{results && ...}` or similar inline JSX conditionals in the main return — **not** inside render helper functions (the audit script cannot see inside them)

- [ ] 🔍 **Pre-result cross-ref present** — a complementary tool linked at the **bottom of the input area**, below the submit button. Answers "what would a user want before or instead of this tool?"
  ```bash
  grep -n "href=.*linkStyle\|linkStyle.*href" ComponentName.js | head -10
  # Confirm at least one cross-ref exists — then manually verify it sits below the submit button,
  # not near the header/tagline
  ```

- [ ] 🔍 **Post-result cross-ref present** — a logical next-step tool linked at the **bottom of the results section**. Answers "what would a user naturally want to do after seeing these results?"
  ```bash
  grep -n "href=.*linkStyle\|linkStyle.*href" ComponentName.js
  # Confirm at least one cross-ref exists inside a results-conditional block ({results && ...})
  # in the main return statement — not inside a renderResults() helper
  ```

- [ ] 🔍 **At least one conditional cross-ref** — a reference that appears only when a specific result condition is met.
  ```bash
  grep -n "href=" ComponentName.js | grep -v "^[[:space:]]*//"
  # Find cross-refs and check if any are inside a conditional: {condition && <p>...<a href=...
  grep -B3 "href=\"/" ComponentName.js | grep "&&\|score\|grade\|gap\|low\|fail\|warning"
  # At least one should return a result
  ```

- [ ] 🔍 **All tool mentions are linked** — no plain-text tool name references without an `<a>` wrapper.
  ```bash
  # List all tool titles from tools.js, then check for unlinked mentions:
  grep -in "DifficultTalkCoach\|ColdOpenCraft\|BragSheetBuilder" ComponentName.js | grep -v "href=\|//\|import\|tools\.js"
  # Any result not inside an <a href> is an unlinked mention — violation
  # (Repeat for whichever tools are referenced by name in this component)
  ```

- [ ] 🔍 **Max 2–3 cross-refs total.**
  ```bash
  grep -c "href=\"/" ComponentName.js
  # Count — flag if > 3
  ```

- [ ] 🔍 **Cross-ref links include the tool's icon** — every `<a>` cross-reference must include the target tool's emoji before the name. A bare text link with no icon fails this check.
  ```bash
  grep -n "href=\"/" ComponentName.js
  # For each result, confirm the link text starts with an emoji before the tool name
  # e.g. ✅ <a href="/VelvetHammer" className={linkStyle}>🔨 Velvet Hammer</a>
  # e.g. ❌ <a href="/VelvetHammer" className={linkStyle}>Velvet Hammer</a>
  ```

- [ ] 🔍 **Bidirectional check** — Tool B mentions this tool if this tool mentions Tool B.
  ```bash
  # For each tool referenced (e.g. DifficultTalkCoach):
  grep -in "ToolId\|ToolTitle" DifficultTalkCoach.js
  # If zero results: flag as bidirectional gap for Tool B's next audit
  ```

---

## SECTION 6 — ROBUSTNESS
> These items verify the backend behaves correctly under all conditions.

- [ ] 🧪 **POST valid payload → 200 + valid JSON**
- [ ] 🧪 **POST empty body → 400 with descriptive error (not 500)**
- [ ] 🧪 **POST missing required fields → 400 (not 500)**
- [ ] 🧪 **POST extra/unexpected fields → 200 (extras ignored)**
- [ ] 🧪 **Response matches expected schema** — all required fields present
- [ ] 🧪 **Response time < 30 seconds** on standard input
- [ ] 🧪 **Empty string inputs → 400, not 500**
- [ ] 🧪 **Injection attempt in user field** — prompt injection strings handled gracefully, not executed
- [ ] 🧪 **Unicode/emoji-heavy input** — doesn't break JSON or rendering
- [ ] 🧪 **2000+ character input** — doesn't crash or timeout

---

## SECTION 7 — TESTING METHODOLOGY

### 7.1 Persona-Based Testing

| Persona | Locale | Primary Coverage |
|---------|--------|-----------------|
| Alex (startup founder) | en-US | Naming, business, communication |
| Maria (grad student) | en-US | Focus, mental health, academic |
| James (middle manager) | en-US | Workplace conflict, negotiation |
| Kenji (Tokyo engineer) | ja-JP | Japanese i18n, non-Latin character handling |
| Sofia (SP designer) | pt-BR | Portuguese i18n, creative tools |

**Test order per persona:**
1. Run all their tools on desktop (English locale)
2. Repeat on mobile (375px) — check layout, tap targets, Share behavior
3. Switch to persona's locale and re-run (for international personas)
4. Run adversarial inputs through the same tools

### 7.2 Backend Smoke Tests
```bash
# Valid request
curl -X POST http://localhost:3001/api/{endpoint} \
  -H "Content-Type: application/json" \
  -d '{ ...valid payload... }'

# Missing required fields — expect 400
curl -X POST http://localhost:3001/api/{endpoint} \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## GHOST-DELETE HOVER COLOR BUG PATTERN (v4.19)

⚠️ **BUG PATTERN — Ghost-delete hover color hardcoded** (discovered CaptionMagic)

A pattern of `${c.textGhost} hover:text-red-500` (or `${c.btnGhost} hover:text-red-500`) appears on soft-delete buttons like 🗑️ or "Clear all history". The `hover:text-red-500` is a raw hardcoded class appended after a `c.*` key, bypassing the theme system entirely and breaking dark mode (dark needs `hover:text-red-400`).

**Fix:** Create a dedicated `c` key that bundles ghost base + hover-red:
```js
textGhostDel: isDark ? 'text-zinc-500 hover:text-red-400' : 'text-gray-400 hover:text-red-500',
```
Use `${c.textGhostDel}` on the button — never append raw `hover:text-red-*` inline.

**Scan:** `grep -n "hover:text-red-" ComponentName.js | grep -v "^\s*[a-z]*:"` — any result outside the `c = {}` block is a violation.

## ENHANCEMENT NOTES

For each tool, capture:

1. **Depth rating**: Shallow / Adequate / Deep
2. **Most obvious missing feature** — what would a user ask for immediately after using it?
3. **Quick win** (< 2 hours) — small addition with meaningful impact
4. **Bigger enhancement** (1–2 days) — what takes it to the next level?
5. **Cross-ref gaps** — which tools should link here but don't yet?
6. **i18n / cultural assumptions** — anything hardcoded for US/Western context?
7. **Notes for subsequent tools** — any pattern found here that should be checked in all tools going forward?

---

## SCORING SUMMARY

| Section | Items | ✅ Pass | ⚠️ Needs Work | ❌ Fail | N/A |
|---------|-------|---------|--------------|---------|-----|
| 0. Tool Identity | | | | | |
| 1. Family Consistency | | | | | |
| 2. Functional Reliability | | | | | |
| 3. Content Quality & Depth | | | | | |
| 4. Internationalization | | | | | |
| 5. Polish & Presentation | | | | | |
| 6. Robustness | | | | | |
| 7. Testing Methodology | | | | | |
| **TOTAL** | | | | | |

**Overall Tool Status**: 🟢 Ship Ready | 🟡 Needs Work | 🔴 Do Not Ship

---

*v4.19 — Added: Broken toggle `<label>` wrapper bug pattern (Section 2.1). A `<label>` used as a clickable toggle wrapper without an `<input>` child AND without an `onClick` is a completely silent no-op — clicks do nothing, state never updates. Fix: replace with a `<button onClick={() => setState(p => !p)}>`. Discovered BuyWise audit, March 2026.*

*v.17 - Added: Check that pill-only inputs respond to Enter key.

*v4.16 — Added: Backend route completeness check (Section 2.2). Discovered BrainRoulette audit: frontend called 8 distinct endpoints; uploaded backend file contained only 3. The gap was silent — no import errors, just missing server handlers. Added mandatory grep to cross-check all callToolEndpoint() route strings in the frontend against router.post() declarations in the backend file. Also added: `VERDICT_LABELS`/`ratingColors` must use `colorKey` (a key name string) pointing into `c`, not raw Tailwind class strings. Using `color: 'text-red-500'` in a lookup object and interpolating it directly into JSX bypasses the c object entirely and bakes in non-theme-aware colors. March 2026.*

*v4.15 — Major: Added mandatory grep scan to every verifiable 🔍 checklist item. The principle: a rule without a scan is a reading comprehension test, and reading comprehension fails. Items that are genuinely subjective (icon quality, description tone) retain prose-only guidance. All structural, color, state, and API rules now have explicit bash commands that must return zero violations before the item can be marked ✅. March 2026.*

*v4.14 — Strengthened: Enter/Return submits (Section 2.1). Added mandatory grep scan — an onKeyDown that only calls addItem() is a FAIL even if Enter "works." Added required behavior spec for add-then-submit patterns (plain Enter on empty field → submit; Cmd/Ctrl+Enter anywhere → submit). Discovered BragSheetBuilder audit. March 2026.*

*v4.13 — Added: Hardcoded emoji in submit button idle state (Section 0, discovered BragSheetBuilder audit). Tools correctly use `tool?.icon` in spinner branches but hardcode the fallback emoji in the idle branch of the same button. Both branches must use `{tool?.icon ?? 'fallback'}`. March 2026.*

*v4.12 — Tightened: ActionBar placement check (Section 1.4e). "Top of results" was too vague — now requires a grep verification that ActionBar line number is within ~5 lines of the resultsRef div. Catches cases where ActionBar is present but buried at the bottom. Discovered during Bookmark audit. March 2026.*

*v4.3–v4.11 — See prior session notes for earlier additions.*

*v4.21 — Two new bug patterns discovered during CrashPredictor audit, March 2026:*

**(1) Frontend/Backend JSON key mismatch (Section 2.2):** Frontend accesses a JSON key name that differs from what the backend prompt instructs the model to return. Example: frontend renders `analysis.poor_interoception_support` but backend prompt defines the key as `poor_self_awareness_support` — section silently never renders because the key is always undefined. **Scan:** `grep -h "analysis\.\|data\." ComponentName.js | grep -oP '(?<=\.)[a-z_]+(?=\b)' | sort | uniq` then cross-check against all `"key_name":` strings in the corresponding backend .js file. Any mismatch is a silent data loss bug.

**(2) `useTheme` non-standard destructure pattern (Section 1.3):** Some tools use `const { theme } = useTheme(); const isDark = theme === 'dark'` instead of the standard `const { isDark } = useTheme()`. Both work at runtime but the non-standard form adds a manual derivation step, is inconsistent with the family, and adds surface area for bugs if the hook's return shape changes. **Scan:** `grep "const { theme }" ComponentName.js` — must return zero results. If found, replace with `const { isDark } = useTheme()`.*

*v4.28 — Redesigned: ActionBar moved to persistent wrapper header (Section 1.4), March 2026.*

**(1) ActionBar now lives in `ToolPageWrapper`, not inside tool components.** `ToolPageWrapper` renders `<ActionBar>` in the header row (right side, alongside bookmark/dark mode on the left) via `ActionBarContext`. Tools register their export content with `useRegisterActions(content, title)` — a single hook call that updates the header ActionBar whenever results change. The old pattern of placing `<ActionBar>` inside the results JSX is now a violation — it creates a duplicate. **Migration:** add `import { useRegisterActions } from '../components/ActionBarContext'`, call `useRegisterActions(buildFullExport(), tool?.title)` near the top of the component body, and remove any `<ActionBar>` from the results section. Tools not yet migrated simply show no ActionBar in the header — they continue to work as before during the transition.*

**(3) Bookmark toast must use `left-0`, not `right-0`.** The bookmark button moved to the left side of the header row when ActionBar was added on the right. The toast popup (`absolute top-full mt-2`) is positioned relative to its parent — `left-0` drops it below the bookmark button correctly. `right-0` sends it to the far right of the row, away from the button that triggered it. **Scan in `ToolPageWrapper.js`:** `grep "showBookmarkToast" ToolPageWrapper.js` — the toast div must have `left-0`, not `right-0`.*

**(2) `useRegisterActions` must use `useEffect` internally** — calling `registerActions` (which calls `setState`) directly on every render creates an infinite loop that freezes the UI. The hook wraps the call in `useEffect([content, title])` so it only fires when content actually changes. Any direct call to `registerActions` outside a `useEffect` is a violation.*

*v4.27 — Hardened: Global `Cmd/Ctrl+Enter` listener is now a 🚨 mandatory mechanical check (Section 2.1). The existing Enter/Return check only verified that *some* `onKeyDown` exists — it did not enforce the document-level global listener that covers pill-only inputs, dropdowns, and focus-anywhere scenarios. New check requires: (1) `document.addEventListener('keydown', ...)` present, (2) `metaKey` checked, (3) `ctrlKey` checked, (4) both checked together for cross-platform support. This has been the intended standard all along; the check now enforces it mechanically. March 2026.*

*v4.26 — Clarified: `callClaudeWithRetry` vs `anthropic.messages.create` (Section 2.2). The 🚨 rule "never raw `anthropic.messages.create`" has a documented exception: routes that return structured JSON must use `anthropic.messages.create` + `cleanJsonResponse` because `callClaudeWithRetry(prompt, options)` returns already-parsed JSON directly and has an incompatible call signature. Attempting to substitute `callClaudeWithRetry` on a JSON route silently breaks parsing. **Rule clarified to:** use `callClaudeWithRetry` for plain-text routes; use `anthropic.messages.create` + `cleanJsonResponse` + `JSON.parse` for JSON-returning routes. Both are acceptable — the violation is mixing them incorrectly. Discovered UpsellShield audit, March 2026.*

*v4.25 — Four new checks, discovered during WardrobeChaosHelper audit, March 2026:*

**(1) Custom print bypass (Section 1.4):** Tools must not use `window.open` + hand-built HTML for printing. All print output must go through `PrintBtn` from `ActionButtons`, which provides the full-colour salmon logo header and footer automatically. Standalone `PrintBtn` alongside `ActionBar` is now explicitly permitted for per-item print actions. **Scan:** `grep -n "window\.open\|buildPrintHtml\|buildPrintHTML\|class=\"branding\"" ComponentName.js` — must return zero results.*

**(2) TDZ: plain `const` fn in `useEffect` dep array (Section 1.7):** A plain `const` function declared later in the component body must never appear in a `useEffect` dependency array. React evaluates dep array entries at declaration time — referencing a not-yet-initialized `const` throws a TDZ ReferenceError at mount. Only `useCallback`-wrapped functions are safe in dep arrays. Plain handlers should be listed in an `// eslint-disable-next-line` comment if needed, not in the array. **Scan:** `grep -A2 "useEffect" ComponentName.js | grep -A1 "\}, \["` — check each dep against whether it's a `useCallback` or a plain `const`.*

**(3) `toLocaleString('default')` Safari crash (Section 2.1):** Passing the string `'default'` as a locale argument to `toLocaleString` or `toLocaleDateString` works in Chrome/Firefox but throws `locale.toLowerCase is not a function` in Safari. Use `undefined` (browser's own locale) or `'en'` instead. **Scan:** `grep -n "toLocaleString('default'\|toLocaleDateString('default'" ComponentName.js` — must return zero results.*

**(4) `useState`/`useRef` hooks after `useEffect` (Section 1.7):** All state and ref declarations must appear before any `useEffect` calls. Hooks declared after an effect that references them via closure work at runtime but create confusing ordering and can interact badly with StrictMode's double-invoke. Standard order: all `useState` → all `useRef` → `const` derived values → `useEffect`s → handler functions. **Scan:** check line numbers — any `useState`/`useRef` appearing after the first `useEffect` is a violation.*

*v4.25 — Strengthened: Icon placement check (Section 0). Added mandatory grep scans with three tests: (1) `mr-2` pattern present on icon span, (2) `tool?.icon` appears in header, (3) no bare string in h1/h2. Also added bug pattern: icon hardcoded after title name (e.g. `<h2>UpsellShield 🧲</h2>`). Discovered UpsellShield audit, March 2026.*

*v4.24 — New check added, discovered during WhatIfMachine audit, March 2026:*

**(1) Hardcoded title/tagline in component header (Section 0):** Tools hardcode their title and tagline as JSX string literals rather than reading from `tool?.title` and `tool?.tagline`. When `tools.js` is updated the component header silently stays stale. Fix: always use `{tool?.title}` and `{tool?.tagline}`. Applied retroactively to WhatIfMachine, WhatsMyVibe, WhereDidItGo, and WrongAnswersOnly.*

*v4.23 — Four new checks discovered during WrongAnswersOnly audit, March 2026:*

**(1) Undefined / misspelled `c` keys (Section 1.1):** `c.quoteBg` used in JSX but never defined; `c.textMuteded` typo for `c.textMuted`. Both resolve silently to `undefined` — no crash, no warning, just broken styling. Added cross-reference grep scan: diff all `c.*` usages against defined keys; any delta is a violation.*

**(2) `BRAND` defined but not wired (Section 1.4):** `const BRAND` declared at top of file but copy builder hardcoded the branding string directly. Tightened the branding check to verify BRAND is both defined AND referenced — a definition with no usage is now a violation.*

**(3) Unused imports / ESLint warnings (Section 1.7):** `useEffect` and `CopyBtn` left in import line after refactors. Added spot-check scans for the most common offenders. Unused imports accumulate warning noise that masks real errors.*

**(4) Missing `set*` deps in `useCallback` / "run again" returns same result (Sections 1.5, 1.7):** `setResults` and `setHistory` omitted from dep array caused stale closure — "Different Wrong Answer" never cleared the previous result. Added: any tool with a secondary submit must include a variation signal (`seed: Date.now()`) in the API payload.*

*v4.22 — New bug pattern discovered during CrisisPrioritizer audit, March 2026:*

**(1) Unnamed / abbreviated c keys (Section 1.1):** Tools sometimes use compressed key aliases (`ts`, `tm`, `pri`, `sec`, `bdr`, `ok`, `warn`, `bad`) instead of the required standard names (`textSecondary`, `textMuted`, `btnPrimary`, `btnSecondary`, `border`, `success`, `warning`, `danger`). These aliases are functionally equivalent at runtime but fail the standard keys check and make cross-tool auditing harder. **Scan:** `grep -n "  ts:\|  tm:\|  pri:\|  sec:\|  bdr:\|  ok:\|  warn:\|  bad:" ComponentName.js` — must return zero results. Any hit is a rename violation; update both the definition and every JSX reference in the same pass.*

**(2) `btnPrimary` defaulting to a bespoke theme color instead of cyan (Section 1.1):** Crisis-themed or urgency-themed tools sometimes set `btnPrimary` (or its alias `pri:`) to `bg-red-600` to match the tool's urgency palette. This violates the family standard: `btnPrimary` must always be cyan. The tool's urgency palette belongs in bespoke keys like `panic:`, `crit:`, etc. — never in `btnPrimary`. **Scan:** `grep "btnPrimary:" ComponentName.js` — value must contain `bg-cyan-` in both branches. If it contains any other color family, replace.*

**(3) History cap above 6 requires documented exception (Section 1.5):** The standard caps history at 5–6 entries. Tools with pattern-analysis features that require larger history sets (e.g., CrisisPrioritizer's pattern analysis uses up to 20 sessions) may exceed this cap, but must document it explicitly in the component as a comment and in the audit notes. **Scan:** `grep "\.slice(0, [0-9]" ComponentName.js | grep -i "journal\|history\|setHistory"` — any cap above 6 without a documented exception comment is a violation.*

*v4.33 — Shared infrastructure read-only rule + TDZ audit patterns, March 2026:*

**(1) Shared infrastructure files are read-only during audits (Section 1.4):** `ToolPageWrapper.js`, `ActionBarContext.js`, `ActionButtons.js`, `useTheme.js` and all shared components must never be modified during a tool audit. The ActionBar position (right of Bookmark/Dark Mode, in the `ToolPageWrapper` header row) is fixed by design and must not be moved. When a visual problem is reported, the diagnosis is always: "Has the audited tool file been deployed?" — not a wrapper layout bug.*

**(2) TDZ crash pattern — `useRegisterActions` called before `buildFullText` declared (Section 1.4):** `useRegisterActions(buildFullText(), ...)` placed before `const buildFullText = () => {...}` causes a "Cannot access uninitialized variable" crash on mount in production. `useRegisterActions` must be called AFTER the function it invokes is declared. This is distinct from the `useEffect` TDZ pattern (hooks before state) — here the issue is a hook that synchronously calls a `const` function that hasn't been initialized yet. **Scan:** `grep -n "useRegisterActions\|const buildFullText\|const buildText\|const buildCopy\|const buildFull" ComponentName.js` — the `useRegisterActions` call line number must be greater than the `const build*` line number.*

**(3) `useRegisterActions` called inside a `useCallback` (Section 1.4):** Placing `useRegisterActions(...)` or `useEffect(...)` inside a `useCallback` block causes React's rules-of-hooks violation ("React Hook cannot be called inside a callback"). These must always be at the top level of the component function body. **Scan:** `grep -n "useRegisterActions\|useEffect" ComponentName.js` — if either appears inside a `useCallback(() => {` block, it is a violation.*

**(4) Scroll `setTimeout` without `clearTimeout` cleanup (Section 1.7):** A bare `setTimeout(() => ref.current?.scrollIntoView(...), 100)` inside a `useCallback` or API handler has no cleanup path — if the component unmounts before the timeout fires, it throws. The correct pattern is a `useEffect` on `[results]` with a ref: `const t = setTimeout(...); return () => clearTimeout(t)`. **Scan:** `grep -n "setTimeout" ComponentName.js | grep -v "clearTimeout"` — any hit that isn't paired with a clearTimeout return is a violation.*

*v4.32 — ToolPageWrapper change discipline (Section 1.2), March 2026:*

**Two specific regressions documented as bug patterns.** Both were introduced during the `ToolPageWrapper` color frame fix and are invisible to the audit script:

**(1) Inner div margin shrank** — `m-8` (32px) was changed to `m-3` (12px), making the colored frame visibly thin. The correct value is `m-8`. Any value less than this is a regression.

**(2) Bookmark row spacing collapsed** — `mt-4` was dropped from the bookmark/dark mode button row, collapsing the breathing room between the tool description and the buttons. The correct class is `mt-4 mb-2`.

**Rule added:** Any edit to `ToolPageWrapper.js` must be followed by a live visual check of at least two tools — one with results loaded, one without. The audit script cannot catch visual regressions in the wrapper.

*v4.31 — Tool card frame standard codified (Section 1.2), March 2026:*

**Tool card color frame is controlled entirely by `ToolPageWrapper`, not individual tool components.** `ToolPageWrapper` wraps every tool in a `<section>` with `headerColor` as a gradient background (solid for ~60px at top, fading to transparent by ~220px). The tool content sits inside a white inner div (`${colors.surface} m-3 rounded-xl p-6`). This produces a consistent top-heavy colored frame across all tools.

**The violation pattern:** Tools that set `min-h-screen` + a background color on their outermost div override the wrapper frame entirely. The category color disappears and the tool renders as a bare white/grey page, breaking family consistency. Fix: remove all background color from the tool component's root element. The tool root must be a plain `<div>` — no `min-h-screen`, no `bg-*`, no `background:` inline style.

**`headerColor` in `tools.js`** must be set for every tool and must match the tool's primary category color family per `CATEGORY-COLOR-MAP-2.md`. Missing or wrong `headerColor` values produce no frame or the wrong family color.

*v4.30 — Cross-ref placement codified (Section 5.5), March 2026:*

**(1) Pre-result cross-refs belong at the bottom of the input area** — below the submit button, not near the title or tagline. Placing them at the top of the page before the user has engaged with the tool is premature and feels like an ad. Below the submit button is the natural "or alternatively..." moment.

**(2) Post-result cross-refs belong at the bottom of the results section** — after the user has absorbed the output, as a natural "what next?" The bottom of the results section is when the user's task is complete and they are most receptive to a next step.*

**(3) Cross-refs must be inline in the main return, not inside render helper functions** — `{results && <p>...<a href="/tool/X">...</a></p>}` in the main JSX is detectable by the audit script. A cross-ref buried inside `renderResults()` or a sub-component is invisible to the script and harder to audit manually.*

*v4.29 — Two new standards, March 2026:*

**(1) Header is left-aligned (Section 1.2):** `text-center` is banned on the tool `<h2>`, tagline `<p>`, and input card content. Left-alignment is the unconditional standard across all tools. Some older tools wrap the header block in `<div className="text-center ...">` — a pattern inherited from landing-page-style layouts that creates visual inconsistency. Centered alignment is only acceptable for isolated metric callout numbers inside result cards (e.g. a large score display). **Scan:** `grep -n "text-center" ComponentName.js` — flag any `text-center` on the h2, tagline, input labels, or card-level wrappers. Result-card metric callouts are exempt.*

**(2) ActionBar placement is the `ToolPageWrapper` persistent header — not inline in tool JSX (Section 1.4):** The ActionBar sits to the right of the bookmark and dark/light mode buttons in the wrapper header row. Tools register content via `useRegisterActions(content, title)`. An inline `<ActionBar>` remaining in tool JSX is a duplicate and must be removed. The audit script (`audit_v2.py`) still checks for inline ActionBar proximity to `resultsRef` — **that check is now outdated and should be updated** to verify `useRegisterActions` import and call instead.*

*v4.34 — Cross-ref icon standard added (Section 5.5), March 2026:*

**(1) Cross-ref links must include the target tool's icon (Section 5.5):** Every `<a>` cross-reference must include the target tool's emoji immediately before the tool name inside the link text. A bare text link with no emoji fails this check. **Correct:** `<a href="/VelvetHammer" className={linkStyle}>🔨 Velvet Hammer</a>`. **Incorrect:** `<a href="/VelvetHammer" className={linkStyle}>Velvet Hammer</a>`. Icons make links visually scannable and consistent with DeftBrain's emoji-forward design language. **Scan:** `grep -n 'href="/' ComponentName.js` — for each result, confirm the link text starts with an emoji before the tool name.*

**(2) Header wrapped in a card blocks the gradient frame (Section 1.2):** Wrapping the `<h2>` + tagline in `<div className="${c.card} border ...">` places a white/dark card directly over the `ToolPageWrapper` gradient, making the tool card border appear white and the category color invisible. The header must be bare — just `<h2>` and `<p>` with no card wrapper — so the gradient shows through. **Scan:** `grep -n "c\.card" ComponentName.js | head -5` — if the first result is near the `<h2>`, it is a violation. The first `c.card` in the component should be an input card or results card, never the header.*

**(3) Stale closure on keyboard `useEffect` (Section 1.7):** When `handleSubmit` (or any async submit function) is not memoized with `useCallback`, the keyboard `useEffect` captures a stale closure that always sees the initial empty state — causing the handler to fire validation errors even with valid input. The button click works because it always reads fresh state directly. **Fix:** Use a ref pattern — assign `handleRef.current = handleSubmit` outside any effect (on every render), then call `handleRef.current?.()` inside the handler. This ensures the keyboard always invokes the freshest version of the function. **Scan:** Any keyboard `useEffect` that calls a non-memoized `const handle*` function is a candidate — verify the function reads state that could be stale.*
