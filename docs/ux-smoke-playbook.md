<!-- v1.0 · 2026-04-20 · ground-zero baseline -->
# DeftBrain Catalog-Wide UX Smoke-Test Playbook

A one-time post-audit pass to catch UX bugs the compliance audit cannot detect by design.
Run once after the compliance audit campaign completes, and keep the Phase 1 automation in place for regression prevention.

---

## Why this exists

The compliance audit (`audit_v2-3.py`) enforces **structure** — imports, hook order, c block keys, cross-refs, file conventions. It cannot detect **behavior** — panels that render below the fold, loading feedback that flickers, buttons that toggle state but show nothing visible.

Four real bugs in BatchFlow all passed the compliance audit:

1. **Weekly Rhythm panel hidden by `&& !results` guard** — button toggled state, nothing visible happened
2. **Share / Template / "What's next?" panels rendered off-screen** — below the heatmap + batches, user didn't realize click worked
3. **"What's next?" showed stale content during refetch** — old result visible the whole API call, new result looked identical
4. **Loading icon swapped for 🕐 instead of spinning in place** — button's identity disappeared during loading

Patterns 1, 2, and 4 appear in many other tools (same Python-replace scripts that propagated the `🕐` convention across the catalog). This playbook finds them systematically.

---

## When to run

- After 100% of tools pass `audit_v2-3.py`
- Before any marketing launch or user-volume push
- Quarterly, as a regression check
- After any catalog-wide refactor

---

## Four phases

### Phase 1 — Automated pattern grep (30 min)

Run `python3 ux-smoke.py` from repo root. It flags every occurrence of six known anti-patterns and ranks tools by flag count. Output is a per-tool table; zero-flag tools skip further phases, 3+ flag tools become Phase 3 priorities.

Detected patterns:

| Pattern | What it catches | Triage |
|---|---|---|
| **clock-swap** | `{X ? '🕐' : '...'}` — BatchFlow bug #4 | Fix via `<Spin>` in Phase 2 |
| **results-guard** | `showX && !results &&` — BatchFlow bug #1 | Remove `!results` conjunction |
| **relative-href** | `href="kebab-slug"` or `href={\`${slug}\`}` | Convert to `/PascalCase` |
| **unpaired-setTimeout** | `setTimeout` count > `clearTimeout` count | Pair each fire with cleanup |
| **lucide-react** | Any `lucide-react` import (should be none post-audit) | Replace with emoji in span |
| **stale-refetch-candidate** | Secondary `handleX` sets a result without clearing first | Manual review — add `setXResult(null)` before API call |

Exit Phase 1 when every flagged tool is either fixed or explicitly triaged as a false positive.

### Phase 2 — Shared helper lift (1 hour)

Extract the `<Spin>` component from its tool-local definitions into `src/components/ActionButtons.js` so every tool imports from one source. Update every clock-swap hit from Phase 1 to use the shared helper.

```jsx
// Add to ActionButtons.js
export const Spin = ({ on, icon, children }) => (
  <>
    <span className={on ? 'animate-spin inline-block' : 'inline-block'}>{icon}</span>
    {children && <> {children}</>}
  </>
);
```

Rewrite pattern — done one tool at a time, ~3 min each:

```jsx
// Before
<button>{isLoading ? '🕐' : '📊 Insights'}</button>

// After
import { CopyBtn, Spin } from '../components/ActionButtons';
<button><Spin on={isLoading} icon="📊">Insights</Spin></button>
```

Commit structure: one commit per tool (or per batch of 3–5 tools), never bundled with layout or content changes. Keeps diffs reviewable and revertible.

### Phase 3 — Click-test the top 20 (2 hours)

Select 20 tools:
- All tools with 3+ flags from Phase 1
- Top-traffic tools from analytics (or best-guess if no data)
- Fill to 20 with alphabetical samples if under 20

Deploy current main to Railway. Open each tool on the live URL (not localhost — catches deploy-layer bugs like CDN caching, prerender mismatches, redirect chains). Run the Click-Test Checklist below against each. Log bugs to a single list; fix in batches organized by bug class.

### Phase 4 — Spot-check the remainder (1 hour)

Random-sample 10 tools from the untested pool. Run the Click-Test Checklist against each.

**Exit criteria:**
- Zero new bug classes in the sample → campaign complete, the pool is trusted
- New bug class found → encode it as a new Phase 1 grep pattern in `ux-smoke.py`, rerun against the full catalog, then resample 10 new tools until clean

---

## The Click-Test Checklist

Run top-to-bottom against every Phase 3 and Phase 4 tool. Each box is a single observable behavior; check or log.

### Empty state
- [ ] Page loads without JS errors in console
- [ ] Header icon, title, tagline all render (match `tools.js` metadata exactly)
- [ ] Every visible nav button produces a visible response on click — panel opens, scrolls into view, tab changes, etc. No silent state toggles.
- [ ] Pre-result cross-ref link resolves to a real tool (no 404)

### Input state
- [ ] Every required field has an amber asterisk
- [ ] Submit with empty required fields triggers validation feedback (not a silent no-op)
- [ ] Typing in a field clears any previously-shown validation error
- [ ] Try Example button (if present) populates all fields plausibly

### Submit / loading
- [ ] Submit button disables during loading
- [ ] Button's icon spins in place — never replaced with `🕐` or any other static icon
- [ ] Button label stays visible (e.g., "Generating…" or unchanged label)
- [ ] ⌘/Ctrl+Enter triggers submit from any non-SELECT input
- [ ] API error produces a visible error banner, not a silent failure

### Results state
- [ ] Results scroll into view on first render
- [ ] ↺ Start Over button appears in header top-right (not elsewhere)
- [ ] Every button in the results controls bar produces a visible response — if it opens a panel, the panel scrolls into view within 100ms
- [ ] Post-result cross-ref link resolves to a real tool
- [ ] Copy / Share / Print actions work through the global ActionBar (header), not inline (exception: per-item copy buttons on discrete standalone content)

### Refetch
- [ ] Clicking a secondary-action button (Insights, Progress, Compare) a second time clears old content and shows in-panel loading feedback before new content appears — not a silent swap

### Reset
- [ ] ↺ Start Over clears all state and returns to empty-state UI
- [ ] No stale data leaks into the fresh state (history preview, persistent state keys, etc.)

### Theme
- [ ] Flip dark/light — every text color, background, border, chip, and icon recolors cleanly
- [ ] No hardcoded light-only values survive the flip (watch for washed-out text, invisible borders)

### Mobile (browser devtools, 390px wide)
- [ ] Header, buttons, cards all fit without horizontal scroll
- [ ] Primary action buttons meet `min-h-[48px]` touch target
- [ ] Panels that open from the results controls bar scroll into view
- [ ] Nav button row wraps cleanly instead of overflowing

---

## Anti-Pattern Reference

Each entry: **what it is → why it's bad → how to fix**.

### Clock-icon swap
**Signature:** `{loading ? '🕐' : '📊 Insights'}`
**Bad:** User loses the button's identity during loading; feedback looks like a bug.
**Fix:** `<Spin on={loading} icon="📊">Insights</Spin>` using the shared helper.

### Panel silenced by `!results` guard
**Signature:** `{showX && !results && <div>panel</div>}`
**Bad:** Toggle button flips state, panel ignores the flip, user sees nothing.
**Fix:** Remove the `&& !results` conjunction. The toggle is the sole gate on visibility.

### Off-screen panel after results exist
**Signature:** Panel renders in JSX after a long results block (heatmap, efficiency card, batches), but the toggle button is far above.
**Bad:** Click appears to do nothing. Panel is open but below the fold.
**Fix:** `useRef` on the panel + `useEffect` watching the toggle state + `scrollIntoView({behavior: 'smooth', block: 'center'})` inside a `setTimeout(50)` (DOM needs one frame to mount the panel).

### Stale result during refetch
**Signature:** `const handleX = async () => { setXLoading(true); const d = await …; setXResult(d); }` — no clearing step between loading and result.
**Bad:** Second click keeps old result visible for the entire API call duration. New result often looks identical to old, so user thinks nothing happened.
**Fix:** `setXResult(null)` immediately after `setXLoading(true)`. Gate panel rendering on `(xResult || xLoading)` and render an explicit loading state inside the panel.

### Relative kebab-case href
**Signature:** `href="other-tool"` or `href={\`${slug}\`}`
**Bad:** Browser resolves relative to current path → `/CurrentTool/other-tool` → 404 for users, ghost URL indexed by Google, Search Console flags as "page with redirect."
**Fix:** `href="/OtherTool"` — absolute + PascalCase matching the `id` in `tools.js`.

### Unpaired setTimeout
**Signature:** `setTimeout` count in file > `clearTimeout` count.
**Bad:** Fires after component unmount → sets state on a dead component → React warnings → potential memory leaks.
**Fix:** Every `setTimeout` call captures its handle; every useEffect that fires one returns a cleanup function calling `clearTimeout(handle)`.

### lucide-react import
**Signature:** `import { X } from 'lucide-react'`
**Bad:** Violates the emoji-in-span icon convention; bloats bundle; inconsistent visual style.
**Fix:** Replace each icon component with an emoji wrapped in `<span>`.

---

## Exit criteria for the full campaign

Campaign is complete when:

1. `ux-smoke.py` returns zero flags against the full catalog (or every flag is triaged as a documented false positive)
2. All 20 Phase 3 tools pass the Click-Test Checklist
3. Phase 4 sample of 10 tools finds zero new bug classes
4. Any new bug class found during Phases 3 or 4 has been encoded as a new `ux-smoke.py` pattern and re-run against the full catalog

Keep `ux-smoke.py` wired into CI (or at minimum, a pre-push git hook) so future regressions are caught before deploy.

---

## Estimated total time

| Phase | Estimate | Output |
|---|---|---|
| 1 — Automated grep | 30 min | Per-tool flag table, 🎯 priority list |
| 2 — Shared helper lift | 1 hour | `Spin` in `ActionButtons`, all clock-swaps replaced |
| 3 — Click-test top 20 | 2 hours | Bug list, batch fixes |
| 4 — Spot-check remainder | 1 hour | Confidence interval on the untested pool |
| **Total** | **~4.5 hours** | Catalog-wide UX confidence, reusable regression tooling |
