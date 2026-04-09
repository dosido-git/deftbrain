# DeftBrain Component Conventions
> **Read this file before writing or editing any tool component.**
> Copy snippets verbatim. Do not reconstruct from memory.

---

## ⚡ MANDATORY PRE-WRITE PROTOCOL (new tools and significant edits)

Before writing the first line of any new tool component, or making structural changes to an existing one, complete ALL of the following steps in order. Do not skip or abbreviate.

1. **Read this entire file** (CONVENTIONS.md). Do not reconstruct patterns from memory.
2. **State the header pattern** you will use: persistent `<h2>` + tagline, inset `border-b`, inside padded wrapper.
3. **State the c block source**: copied verbatim from PF-2, not reconstructed.
4. **State the hook order**: useClaudeAPI → useTheme → c block → linkStyle → useState → useRef → usePersistentState → handlers → buildFullText → useRegisterActions → useEffect scroll → useEffect keyboard → render helpers → return.
5. **Confirm cross-refs are present**: 1–3 links from `cross-reference-map.md`, emoji before name, `/PascalCase` hrefs, no `target="_blank"`. Zero cross-refs is a violation.
6. **Confirm the root div** is `<div className={\`space-y-4 \${c.text}\`}>` with no background color.

Only after all six steps are confirmed may writing begin.

> This protocol exists because patterns reconstructed from memory drift. The conventions file is the only authoritative source. Reading it takes 90 seconds. Not reading it costs hours of correction.

---

## ⚡ PRE-FLIGHT CORRECTIONS
Run these checks on every file before doing anything else. Each one has a deterministic fix — no judgment required. Resolving these first eliminates the majority of recurring audit violations.

---

### PF-1 · Imports

**Scan:**
```bash
grep -n "^import" ComponentName.js
```

**Required — must all be present:**
```js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';
import { usePersistentState } from '../hooks/usePersistentState';
import { CopyBtn } from '../components/ActionButtons';
import { useRegisterActions } from '../components/ActionBarContext';
```

**Must NOT be present:**
```bash
grep -n "lucide-react\|from 'lucide'\|ActionBar.*ActionButtons\|getToolById" ComponentName.js
# Must return zero results
```

---

### PF-2 · `c` Block, Aliases, and linkStyle

**Scan:**
```bash
grep -n "const linkStyle\|const c = {" ComponentName.js | head -3
# linkStyle line number must be GREATER than c block line number
```

**Copy this exact block:**
```js
const c = {
  card:          isDark ? 'bg-zinc-800' : 'bg-white',
  cardAlt:       isDark ? 'bg-zinc-700/50' : 'bg-slate-50',
  input:         isDark ? 'bg-zinc-900 border-zinc-600 text-zinc-100 placeholder-zinc-400 focus:border-cyan-500 focus:ring-cyan-500/20'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-cyan-500 focus:ring-cyan-100',
  text:          isDark ? 'text-zinc-50' : 'text-gray-900',
  textSecondary: isDark ? 'text-zinc-300' : 'text-gray-600',
  textMuted:     isDark ? 'text-zinc-500' : 'text-gray-400',
  labelText:     isDark ? 'text-zinc-200' : 'text-gray-700',
  accentTxt:     isDark ? 'text-cyan-400' : 'text-cyan-600',
  btnPrimary:    isDark ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                        : 'bg-cyan-600 hover:bg-cyan-700 text-white',
  btnSecondary:  isDark ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-200'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700',
  border:        isDark ? 'border-zinc-700' : 'border-gray-200',
  success:       isDark ? 'bg-emerald-900/20 border-emerald-700 text-emerald-200'
                        : 'bg-emerald-50 border-emerald-300 text-emerald-800',
  warning:       isDark ? 'bg-amber-900/20 border-amber-700 text-amber-200'
                        : 'bg-amber-50 border-amber-300 text-amber-800',
  danger:        isDark ? 'bg-red-900/20 border-red-700 text-red-200'
                        : 'bg-red-50 border-red-200 text-red-800',
  infoBox:       isDark ? 'bg-sky-900/20 border-sky-700 text-sky-200'
                        : 'bg-sky-50 border-sky-200 text-sky-800',
  successBox:    isDark ? 'bg-emerald-900/20 border-emerald-700' : 'bg-emerald-50 border-emerald-300',
  successTxt:    isDark ? 'text-emerald-300' : 'text-emerald-800',
  warningBox:    isDark ? 'bg-amber-900/20 border-amber-700' : 'bg-amber-50 border-amber-300',
  warningTxt:    isDark ? 'text-amber-300' : 'text-amber-800',
  pillActive:    isDark ? 'border-cyan-500 bg-cyan-900/30 text-cyan-200'
                        : 'border-cyan-600 bg-cyan-100 text-cyan-900',
  pillInactive:  isDark ? 'border-zinc-600 text-zinc-400 hover:border-zinc-500'
                        : 'border-gray-300 text-gray-500 hover:border-gray-400',
  required:      isDark ? 'text-amber-400' : 'text-amber-500',
};
// Always include these two alias lines immediately after the closing brace:
c.textMuteded = c.textMuted;
c.label = c.labelText;

const linkStyle = isDark
  ? 'text-cyan-400 hover:text-cyan-300 underline underline-offset-2'
  : 'text-cyan-600 hover:text-cyan-700 underline underline-offset-2';
```

**Undefined key scan — run before and after every edit:**
```bash
grep -oP 'c\.[a-zA-Z]+' ComponentName.js | sed 's/c\.//' | sort -u > /tmp/c_used.txt
grep -oP '[a-zA-Z]+(?=:\s+isDark)' ComponentName.js | sort -u > /tmp/c_defined.txt
comm -23 /tmp/c_used.txt /tmp/c_defined.txt
# Must return zero lines
```

---

### PF-3 · Input Card

The header (`<h2>` + tagline) must live **inside** the primary input card — not in its own separate card before it. One card. Header at the top, inputs below the divider. This is a single unit.

**Scan:**
```bash
grep -n "c\.card.*rounded\|rounded.*c\.card" ComponentName.js | head -5
# Every result must contain: border ${c.border} rounded-xl shadow-sm
# Flag any with shadow-lg, missing border, or missing ${c.border}

# Detect header-only card (closing tag within ~3 lines of the header divider):
grep -n "border-b border-zinc-500" ComponentName.js
# Take that line number N. Check line N+3 to N+5 — if it contains </div> with nothing
# between it and the next card open, the header is isolated in its own card. FAIL.
# The line after the closing </div> of the header section must be an input element,
# not another <div className=... card.
```

**✅ Correct pattern — header and inputs in one card:**
```jsx
<div className={`${c.card} border ${c.border} rounded-xl shadow-sm p-5 space-y-4`}>
  <div className="pb-3 border-b border-zinc-500">
    <h2 className={`text-xl font-bold ${c.text}`}>
      <span className="mr-2">{tool?.icon ?? '❓'}</span>{tool?.title ?? 'Fallback Title'}
    </h2>
    <p className={`text-sm ${c.textSecondary}`}>{tool?.tagline ?? 'Fallback tagline'}</p>
  </div>
  {/* inputs go here — inside the same card */}
  <div>
    <label ...>...</label>
    <input ... />
  </div>
  <button ...>Submit</button>
</div>
```

**❌ Wrong pattern — header-only card (discovered PronounceItRight / SensoryMinefieldMapper audit, v4.35):**
```jsx
{/* WRONG — header isolated in its own card */}
<div className={`${c.card} border ${c.border} rounded-xl shadow-sm p-5`}>
  <div className="pb-3 border-b border-zinc-500">
    <h2>...</h2>
    <p>...</p>
  </div>
</div>  {/* ← card closes with no inputs inside */}

{/* inputs in a completely separate card below */}
<div className={`${c.card} border rounded-xl p-5`}>
  <input ... />
</div>
```

This passes the gradient-blocking scan (because `<h2>` IS inside a `c.card`) but produces two cards where one belongs, creates visual redundancy, and separates the tool's identity from its action.

**Critical values:**
| Class | Rule |
|-------|------|
| `border ${c.border}` | Always present — card edge against gradient |
| `shadow-sm` | Never `shadow-lg` |
| `border-b border-zinc-500` | Always hardcoded — `${c.border}` is near-invisible in light mode |
| `{tool?.icon}` before `{tool?.title}` | Icon always left of title — never after, never hardcoded |
| `c.textSecondary` on tagline | Not `c.textMuted` |
| Inputs inside the same card | Never in a separate card below the header card |
| Header is the **first** thing inside the card | No input elements, pickers, tabs, or navigation may appear before the header — they must all follow the `border-b` divider |
| `border-b border-zinc-500` is on an **inner div**, not the outer card div | The outer card has `px-5` padding; the `border-b` div sits inside it — so the divider line is inset from the card edges, not edge-to-edge |

> ⚠️ **BUG PATTERN — Input controls rendered before the header (discovered PronounceItRight audit, v4.35)**
> A category picker strip was placed as its own element *before* the input card, making it the first visible UI inside the gradient frame — above the tool title. The fix is to move all input controls inside the card, below the `border-b border-zinc-500` divider. Nothing should precede the header inside the gradient frame.

**❌ Wrong pattern — border-b placed on the outer padded div (edge-to-edge divider):**
```jsx
{/* WRONG — border runs wall-to-wall, visually heavy */}
<div className="flex items-start justify-between px-5 pt-5 pb-3 border-b border-zinc-500">
  <h2>...</h2>
</div>
```

**✅ Correct pattern — border-b on an inner div, inside the padded container (inset divider):**
```jsx
{/* CORRECT — padding wraps both the header content and the border */}
<div className="px-5 pt-5">
  <div className="flex items-start justify-between pb-3 border-b border-zinc-500">
    <h2>...</h2>
  </div>
</div>
```

> ⚠️ **BUG PATTERN — Edge-to-edge header divider (discovered DriveHome / SafeWalk, March 2026)**
> Placing `border-b border-zinc-500` on the same div that carries `px-5` padding causes the border to run from card edge to card edge — visually heavy and inconsistent with all other tools. The `border-b` must always be on a child div, inside the padded wrapper, so the line is naturally inset.

---

### PF-4 · Header Violations

There are two distinct header violations — both involve `c.card` near `<h2>`, but they are different problems with different fixes:

| Violation | Pattern | Effect | Fix |
|-----------|---------|--------|-----|
| **Gradient blocker** (v4.34) | `<h2>` in its own `c.card` with no inputs, placed as the first element | White card sits over the ToolPageWrapper gradient, category color invisible | Remove the card — make header bare `<h2>` + `<p>` |
| **Header-only card** (v4.35) | `<h2>` in a `c.card` that closes immediately before a separate input card | Two cards instead of one, identity separated from action | Fold header into the top of the input card with `border-b border-zinc-500` divider |

The PF-4 scan previously only caught the first violation. Both must now be checked:

```bash
# Violation 1 — Hardcoded text in h1/h2:
grep -n '<h[12][^>]*>[^{<]' ComponentName.js
# Must return zero results

# Violation 2 — Header card closes before inputs (header-only card):
# Find the border-b border-zinc-500 divider line:
grep -n "border-b border-zinc-500" ComponentName.js
# Read 4-6 lines after that line number in the file.
# If the pattern is: </div> → </div> → {/* inputs or next card */}
# with no input elements between the divider's parent close and the next sibling,
# the header is isolated. FAIL — fold inputs into the same card.

# Violation 3 — First c.card is a header-only card (gradient blocker):
grep -n "c\.card" ComponentName.js | head -3
# Read those lines. The first c.card must contain inputs, not just a header.
```

---

### PF-5 · ActionBar and Copy/Share/Print Buttons

The global ActionBar — rendered automatically by `ToolPageWrapper` via `useRegisterActions` — is the **only** sanctioned copy, share, and print mechanism in any tool. No inline buttons of any kind may duplicate these actions.

**Scan — all must return zero results:**
```bash
grep -n "<ActionBar" ComponentName.js
# Must return zero — inline ActionBar is forbidden

grep -n "CopyBtn\|PrintBtn\|ShareBtn" ComponentName.js | grep -v "^import"
# Must return zero — inline copy/share/print buttons are forbidden

grep -n "copyToClipboard\|navigator\.clipboard\|copiedField\|copiedIndex\|setCopied" ComponentName.js
# Must return zero — local clipboard logic is forbidden
```

**Fix:** Replace any inline `<ActionBar>`, `<CopyBtn>`, `<PrintBtn>`, or `<ShareBtn>` in JSX with `useRegisterActions(buildFullText(), tool?.title || 'Tool Name')` placed AFTER `buildFullText` is declared. The import line `import { CopyBtn } from '../components/ActionButtons'` is still required (the audit checks for it), but `CopyBtn` must not appear anywhere in JSX.

**Why this rule exists:** Inline copy buttons duplicate the global action bar, producing redundant UI (e.g. two Copy buttons visible at once). They also fragment the copy content — each inline button copies only a subset of results, while `useRegisterActions` copies everything via `buildFullText`. When users see inline buttons, they lose trust in the global bar and both become confusing.

**The one exception:** A tool may use `CopyBtn` inline for content that is *always independent of the main results* — e.g. a delegate message draft that users copy to send separately, where copying the whole plan would be wrong. This must be discussed and explicitly approved before implementation. All other uses are prohibited.

---

### PF-6 · Keyboard Handler

```bash
# Blocked tags — only SELECT allowed:
grep -n "tag === 'INPUT'\|tag === 'TEXTAREA'" ComponentName.js
# Must return zero results

# Stale closure check — direct function calls are violations:
grep -n "document.addEventListener.*keydown" ComponentName.js -A5 | grep -v "Ref\|current\|handler"
# Handler must call handleXxxRef.current?.() not handleXxx() directly

# canSubmit check — handler must not bypass disabled logic:
grep -n "disabled={" ComponentName.js | grep -v "loading" | head -5
# Any disabled condition beyond just loading must be mirrored as a canSubmitRef

# COVERAGE CHECK 1 — multi-view tools must wire every submit-capable view:
grep -c "setActiveTab\|setView\|activeTab ===\|view ===" ComponentName.js
# If result > 2, this is a multi-view tool. Then run:
grep -n "viewRef\|tabRef\|modeRef" ComponentName.js
# Must return at least one result — zero on a multi-view tool = FAIL (keyboard broken on secondary views)
grep -n "viewRef\.current\|tabRef\.current\|modeRef\.current" ComponentName.js | grep -v "useRef\|\.current ="
# Must appear inside the keyboard handler body, not just as assignment

# COVERAGE CHECK 2 — count async submit handlers vs wired refs:
grep -c "const handle[A-Z][a-zA-Z]* = async\|async function handle[A-Z]" ComponentName.js
# Note the count (N). Then verify N matching handleXxxRef.current?.() calls exist:
grep -n "Ref\.current?.()" ComponentName.js
# Count must equal number of distinct submit handlers exposed by the tool.
# Fewer refs than handlers = some submit action unreachable by keyboard.

# COVERAGE CHECK 3 — every submit view has its own canRef:
grep -n "canSubmitRef\|can[A-Z][a-zA-Z]*Ref" ComponentName.js
# Must have one canRef per submit-capable view.
# Each canRef must mirror that view's button's disabled condition — read and verify.
```

**Correct pattern — single mode:**
```js
const handleSubmitRef = useRef(null);
const canSubmitRef = useRef(false);

// Assigned every render, always fresh:
handleSubmitRef.current = handleSubmit;
canSubmitRef.current = !!primaryInput.trim(); // mirror the button's disabled condition exactly

useEffect(() => {
  const handler = (e) => {
    const tag = document.activeElement?.tagName;
    if (tag === 'SELECT') return;
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !loading && canSubmitRef.current)
      handleSubmitRef.current?.();
  };
  document.addEventListener('keydown', handler);
  return () => document.removeEventListener('keydown', handler);
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [loading]);
```

**For multi-mode tools**, also track mode and per-mode validity:
```js
const modeRef = useRef(null);
modeRef.current = mode;
// canSubmitRef mirrors the disabled condition for whichever mode is active:
canSubmitRef.current = !!currentRole.trim() && (mode !== 'map' || !!targetRole.trim());

// Inside handler, route by mode:
if (modeRef.current === 'explore') handleExploreRef.current?.();
else handleAnalyzeRef.current?.();
```

> ⚠️ **BUG PATTERN — keyboard handler bypasses disabled logic**
> The submit button has `disabled={!canSubmit || loading}` but the keyboard handler only checks `!loading`. The handler fires, the function hits validation, throws an error or silently does nothing — keyboard appears broken. Always track the full disabled condition in `canSubmitRef` and check it in the handler.

---

### PF-7 · Scroll useEffect

```bash
grep -n "setTimeout" ComponentName.js | grep -v "clearTimeout"
# Any hit is a violation — every setTimeout needs clearTimeout in the return

# COVERAGE CHECK — every below-fold result needs a scroll useEffect:
grep -n "const \[.*[Rr]esult\b\|const \[results\b" ComponentName.js | grep "usePersistentState\|useState" | grep -v "Loading\|Ref"
# Note the count (N) of distinct result variables.
grep -n "scrollIntoView" ComponentName.js | wc -l
# If scroll count < result count, flag each un-scrolled result for review.
# Not every result requires scroll (e.g. results that replace the form above the fold),
# but any result that appears below existing content with no scroll = likely UX bug.
```

**Correct pattern:**
```js
const resultsRef = useRef(null);

useEffect(() => {
  if (!results || !resultsRef.current) return;
  const t = setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
  return () => clearTimeout(t);
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [results]);
```

---

### PF-8 · useRegisterActions

```bash
# TDZ check — useRegisterActions must come AFTER buildFullText:
grep -n "useRegisterActions\|const buildFullText\|const buildText\|const buildCopy" ComponentName.js
# useRegisterActions line number must be GREATER than build function line number

# COVERAGE CHECK — buildFullText must include every result variable:
grep -n "const \[.*[Rr]esult\b\|const \[results\b" ComponentName.js | grep "usePersistentState\|useState" | grep -v "Loading\|Ref"
# Note each result variable name. Then verify each one appears inside the build function body:
grep -n "buildFullText\|buildText\|buildCopy\|buildFull" ComponentName.js
# Read the build function (use view tool) — any result variable absent from it
# means that content is never included in copy/export. That is a silent data loss.
```

**Correct pattern:**
```js
const buildFullText = useCallback(() => {
  if (!results) return '';
  const lines = ['Tool Name', ''];
  // ...
  lines.push(BRAND);
  return lines.join('\n');
}, [results]);

useRegisterActions(buildFullText(), tool?.title || 'Tool Name'); // AFTER buildFullText
```

---

### PF-9 · Cross-References

Cross-references are **mandatory**. Every tool must link to at least one related tool. Absence of cross-refs is a violation, not a pass.

```bash
# MANDATORY — must have at least 1, no more than 3:
grep -c 'href="/' ComponentName.js
# Zero results = VIOLATION. More than 3 = VIOLATION.

# No target=_blank:
grep -n 'target=' ComponentName.js
# Must return zero results

# Correct href format (/PascalCase, no /?tool=):
grep -n 'href=' ComponentName.js
# Each must be /ToolName format

# Emoji before name:
grep -n 'href="/' ComponentName.js
# Each link text must start with an emoji
```

**Placement rules:**
- **Pre-result:** one inline sentence below the submit button, inside the input card
- **Post-result:** a `🔗 Related tools` block inside the results section
- Use `cross-reference-map.md` to find the correct tools for each cluster

**Correct pattern:**
```jsx
<div className={`${c.cardAlt} border ${c.border} rounded-xl p-4`}>
  <p className={`text-[10px] font-bold ${c.textMuted} uppercase mb-2`}>🔗 Related tools</p>
  <div className="flex flex-wrap gap-3">
    <a href="/ToolNameA" className={`text-xs ${linkStyle}`}>🔨 Tool Name A</a>
    <a href="/ToolNameB" className={`text-xs ${linkStyle}`}>📋 Tool Name B</a>
  </div>
</div>
```

---

### PF-10 · Hook Ordering

```bash
FIRST_EFFECT=$(grep -n "useEffect" ComponentName.js | head -1 | cut -d: -f1)
LAST_STATE=$(grep -n "useState\|usePersistentState" ComponentName.js | tail -1 | cut -d: -f1)
echo "Last state: $LAST_STATE | First effect: $FIRST_EFFECT"
# LAST_STATE must be less than FIRST_EFFECT
```

**Required order inside component:**
1. `useClaudeAPI()` + `useTheme()`
2. `const c = { ... }` + aliases + `linkStyle`
3. All `useState` declarations
4. All `useRef` declarations
5. All `usePersistentState` declarations
6. Handler functions
7. `const buildFullText = ...`
8. `useRegisterActions(...)`
9. Scroll `useEffect`
10. Keyboard `useEffect`
11. Render helpers / return

---

### PF-11 · Root Div

```bash
grep -n "min-h-screen" ComponentName.js
# Must return zero results — ToolPageWrapper provides all background/frame styling
```

**Correct root:**
```jsx
return (
  <div className={`space-y-4 ${c.text}`}>
    {/* content */}
  </div>
);
```

---

### PF-12 · Common Typos

```bash
grep -n "textSecondaryondary\|btnSecondaryondary" ComponentName.js
# Must return zero — fix: → textSecondary / btnSecondary

grep -n ";;" ComponentName.js
# Must return zero — fix: remove extra semicolon
```

---

### PF-13 · BRAND Constant

```bash
grep -n "const BRAND" ComponentName.js
# Must show: const BRAND = '\n\n— Generated by DeftBrain · deftbrain.com'

grep -n "BRAND" ComponentName.js | grep -v "const BRAND"
# Must return at least one result — BRAND must be used, not just defined

grep -n "Generated by DeftBrain" ComponentName.js | grep -v "BRAND\|const "
# Must return zero — no hardcoded branding strings
```

---

### PF-14 · Submit Button

```bash
grep -n "w-full.*btnPrimary\|btnPrimary.*w-full" ComponentName.js
# Must return at least one result

grep -n "⏳" ComponentName.js
# Must return zero — use tool?.icon with animate-spin instead
```

**Correct pattern:**
```jsx
<button
  onClick={handleSubmit}
  disabled={!canSubmit || loading}
  className={`w-full ${c.btnPrimary} disabled:opacity-40 font-bold py-3 rounded-lg flex items-center justify-center gap-2 min-h-[48px]`}
>
  {loading
    ? <><span className="inline-block animate-spin">{tool?.icon ?? '⚙️'}</span> Working...</>
    : <><span className="mr-1">{tool?.icon ?? '❓'}</span> Submit Label</>}
</button>
```

---

### PF-15 · Required Field Asterisks

Asterisks on required fields are **mandatory**. Every required input must have a visible `*` rendered using `c.required` (amber). A tool with any unasterisked required field is a compliance failure. Muted or red asterisks are also failures.

**Scan:**
```bash
# Confirm c.required is defined in the c block:
grep -n "required:" ComponentName.js | head -3
# Must show: required: isDark ? 'text-amber-400' : 'text-amber-500'

# Confirm c.required is used:
grep -n "c\.required" ComponentName.js
# Must return at least one result

# Scan for asterisks NOT using c.required:
grep -n '"\*"\|'"'"'\*'"'" ComponentName.js | grep -v "c\.required"
# Must return zero results — all asterisks must go through c.required

# Check labels on required fields have an asterisk:
grep -n "<label" ComponentName.js | grep -v "\*" | head -20
# Review each — any label for a required input without an asterisk is a FAIL
```

**Correct pattern:**
```jsx
<label className={`block text-sm font-medium ${c.labelText} mb-1`}>
  Describe the behavior <span className={c.required}>*</span>
</label>
<textarea ... />
```

**Rules:**
| Rule | Detail |
|------|--------|
| Asterisk is mandatory | Every required field must have one — no exceptions |
| Color | `c.required` only — `text-amber-400` dark / `text-amber-500` light |
| Never `c.textMuted` | Muted asterisks are invisible and therefore useless |
| Never `text-red-500` | Red belongs to the error/danger semantic — not form marking |
| Placement | Inside the `<label>`, after the label text, in a `<span className={c.required}>*</span>` |
| Optional fields | No asterisk — silence means optional |

---

## JUDGMENT-REQUIRED ITEMS
These cannot be auto-corrected — they require reading context:

- `headerColor` in `tools.js` uses the **dark** category hex, not the L4 pale tint (see `CATEGORY-COLOR-MAP-2.md`)
- Cross-ref tool IDs actually exist in `tools.js`
- `useRegisterActions` content is meaningful (not empty string)
- History `preview` field truncates the right input
- Reset function clears all relevant state
- Mode-switching clears stale results
- All API result fields accessed with `?.`
- No references to psychological/medical diagnoses in metadata or UI copy
