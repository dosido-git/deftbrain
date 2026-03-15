# Tool Audit Checklist v4.22
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

- [ ] 🔍 **Icon placement is consistent** — icon appears *before* the title in the component `<h2>`: `<span>icon</span> Tool Name`. Never after.
  ```bash
  grep -n "<h2" ComponentName.js
  # Verify span with icon comes before title text, not after
  ```

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

- [ ] 🔍 **Input area is a card** — wrapped in `${c.card} rounded-xl shadow-lg`. Not a bare div.
  ```bash
  grep -n "rounded-xl shadow-lg" ComponentName.js | head -5
  grep -n "c\.card" ComponentName.js | head -5
  # Confirm the primary input container uses c.card + rounded-xl shadow-lg
  ```

- [ ] 🔍 **Header follows standard pattern** — card opens with a `border-b ${c.border}` div containing `<h2>` (icon first, then title) and a subtitle `<p>` in `c.textSecondary`.
  ```bash
  grep -n "border-b\|c\.border\|c\.textSecondary" ComponentName.js | head -10
  grep -n "<h2" ComponentName.js
  # Verify: border-b and c.border appear near <h2>; icon span precedes title text
  ```

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
> `ActionBar` is the single source of Copy + Print + Share. Never add standalone `PrintBtn`, `ShareBtn`, or `CopyBtn` alongside `ActionBar`.

- [ ] 🔍 **Imports from `../components/ActionButtons`** — uses `ActionBar` (and optionally standalone `CopyBtn` for per-field copies).
  ```bash
  grep -n "ActionButtons\|ActionBar\|CopyBtn\|PrintBtn\|ShareBtn" ComponentName.js | head -10
  # Must show import from ../components/ActionButtons
  # Must NOT import from lucide-react
  ```

- [ ] 🔍 **No `lucide-react` imports** — all icons are emojis in `<span>` tags.
  ```bash
  grep -n "lucide-react\|from 'lucide'" ComponentName.js
  # Must return zero results
  ```

- [ ] 🔍 **`ActionBar` is present in the component.**
  ```bash
  grep -n "<ActionBar" ComponentName.js
  # Must return at least one result
  ```

- [ ] 🔍 **No duplicate action buttons** — `ActionBar` not accompanied by standalone `<PrintBtn` or `<ShareBtn`.
  ```bash
  grep -n "<PrintBtn\|<ShareBtn" ComponentName.js
  # If ActionBar is present, these must return zero results
  ```

- [ ] 🔍 **ActionBar placement** — within ~5 lines of the `resultsRef` div opening.
  ```bash
  grep -n "resultsRef\|<ActionBar" ComponentName.js
  # ActionBar line number must be within ~5 lines of the resultsRef div
  ```

- [ ] 🔍 **Copy content includes DeftBrain branding** — `BRAND` constant used, ends with `\n\n— Generated by DeftBrain · deftbrain.com`.
  ```bash
  grep -n "BRAND\|deftbrain\.com\|Generated by DeftBrain" ComponentName.js
  # BRAND constant must be defined; every CopyBtn content prop must append it
  grep -n "content={" ComponentName.js | grep -v "BRAND\|deftbrain"
  # Ideally returns zero results (all copy content uses BRAND)
  ```

- [ ] 🔍 **Print template includes branding div** — printed output identifies the source.
  ```bash
  grep -n "printContent\|printTemplate\|deftbrain" ComponentName.js | head -10
  # Confirm branding is included in print template
  ```

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

- [ ] 🔍 **Pre-result cross-ref present** — complementary tool mentioned before/alongside input.
  ```bash
  grep -n "href=.*linkStyle\|linkStyle.*href" ComponentName.js | head -10
  # Confirm at least one cross-ref exists in the pre-results (input) area
  ```

- [ ] 🔍 **Post-result cross-ref present** — logical next-step tool shown after results load.
  ```bash
  grep -n "href=.*linkStyle\|linkStyle.*href" ComponentName.js
  # Confirm at least one cross-ref exists inside a results-conditional block
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

*v4.22 — New bug pattern discovered during CrisisPrioritizer audit, March 2026:*

**(1) Unnamed / abbreviated c keys (Section 1.1):** Tools sometimes use compressed key aliases (`ts`, `tm`, `pri`, `sec`, `bdr`, `ok`, `warn`, `bad`) instead of the required standard names (`textSecondary`, `textMuted`, `btnPrimary`, `btnSecondary`, `border`, `success`, `warning`, `danger`). These aliases are functionally equivalent at runtime but fail the standard keys check and make cross-tool auditing harder. **Scan:** `grep -n "  ts:\|  tm:\|  pri:\|  sec:\|  bdr:\|  ok:\|  warn:\|  bad:" ComponentName.js` — must return zero results. Any hit is a rename violation; update both the definition and every JSX reference in the same pass.*

**(2) `btnPrimary` defaulting to a bespoke theme color instead of cyan (Section 1.1):** Crisis-themed or urgency-themed tools sometimes set `btnPrimary` (or its alias `pri:`) to `bg-red-600` to match the tool's urgency palette. This violates the family standard: `btnPrimary` must always be cyan. The tool's urgency palette belongs in bespoke keys like `panic:`, `crit:`, etc. — never in `btnPrimary`. **Scan:** `grep "btnPrimary:" ComponentName.js` — value must contain `bg-cyan-` in both branches. If it contains any other color family, replace.*

**(3) History cap above 6 requires documented exception (Section 1.5):** The standard caps history at 5–6 entries. Tools with pattern-analysis features that require larger history sets (e.g., CrisisPrioritizer's pattern analysis uses up to 20 sessions) may exceed this cap, but must document it explicitly in the component as a comment and in the audit notes. **Scan:** `grep "\.slice(0, [0-9]" ComponentName.js | grep -i "journal\|history\|setHistory"` — any cap above 6 without a documented exception comment is a violation.*
