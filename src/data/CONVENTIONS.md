# DeftBrain Component Conventions
> **Read this file before writing or editing any tool component.**
> Copy snippets verbatim. Do not reconstruct from memory.

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

> ⚠️ **BUG PATTERN — Input controls rendered before the header (discovered PronounceItRight audit, v4.35)**
> A category picker strip was placed as its own element *before* the input card, making it the first visible UI inside the gradient frame — above the tool title. The fix is to move all input controls inside the card, below the `border-b border-zinc-500` divider. Nothing should precede the header inside the gradient frame.

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

### PF-5 · Inline ActionBar

```bash
grep -n "<ActionBar" ComponentName.js
# Must return zero results — remove any found
```

Replace with `useRegisterActions(buildFullText(), tool?.title || 'Tool Name')` placed AFTER `buildFullText` is declared.

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

```bash
# No target=_blank:
grep -n 'target=' ComponentName.js
# Must return zero results

# Correct href format (/PascalCase, no /?tool=):
grep -n 'href=' ComponentName.js
# Each must be /ToolName format

# Count (max 3):
grep -c 'href="/' ComponentName.js

# Emoji before name:
grep -n 'href="/' ComponentName.js
# Each link text must start with an emoji
```

**Correct pattern:**
```jsx
<div className={`${c.card} border ${c.border} rounded-xl p-4`}>
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
