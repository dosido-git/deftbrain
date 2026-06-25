# Mobile pass — a required step in the per-tool audit (Prompt 1)

The 5 gates and the golden check **output**; desktop preview checks **desktop render**.
Neither catches **mobile render** — and these tools (forms → score cards/badges → tables →
charts) break on phones in predictable ways. This pass is mandatory before a tool is
"prime-time." It does NOT belong in the golden (the API output is viewport-agnostic) — it's
a render-layer check.

## How to run
1. `preview_resize` → **mobile (375px)**.
2. Run the **mobile lint** (below) on the **input view** AND the **results view** (drive a
   real analysis first — and for tools with a table/compare mode, that view too).
3. **One screenshot of the results view at 375px** — the lint proves "fits," only eyes prove
   "readable / stacked / not crushed."
4. Report each finding ✅ / ⚠️ / 🐛 with the offending class and a fix.

## The mobile lint (preview_eval at 375px)
```js
(() => {
  const vw = innerWidth, all = [...document.querySelectorAll('*')];
  const overflowX = document.documentElement.scrollWidth > vw + 1;
  const wideEls = all.filter(e => {const r=e.getBoundingClientRect(); return r.width>0 && r.right > vw + 1;})
    .map(e => e.tagName.toLowerCase()+'.'+String(e.className||'').split(' ').filter(Boolean)[0]+' r='+Math.round(e.getBoundingClientRect().right)).slice(0,10);
  const smallTaps = [...document.querySelectorAll('button,a,select,input[type=range]')]
    .filter(e => {const r=e.getBoundingClientRect(); return r.height>0 && r.height<44;})
    .map(e => `"${e.textContent.trim().slice(0,16)}" ${Math.round(e.getBoundingClientRect().height)}px`).slice(0,12);
  const zoomInputs = [...document.querySelectorAll('input,textarea,select')]
    .filter(e => parseFloat(getComputedStyle(e).fontSize) < 16).length;
  // crushed text column: any leaf text element narrower than ~60px holding a real sentence
  const crushed = all.filter(e => e.children.length===0 && e.textContent.trim().split(' ').length>4 && e.getBoundingClientRect().width>0 && e.getBoundingClientRect().width<60)
    .map(e => Math.round(e.getBoundingClientRect().width)+'px: "'+e.textContent.trim().slice(0,30)+'"').slice(0,5);
  return { vw, overflowX, wideEls, smallTaps, zoomInputs, crushed };
})()
```

## What to flag
- **🐛 `overflowX:true` or `crushed` non-empty** — content cut off or text in a 1-word-per-line
  column. The worst class. Usual cause: a desktop `flex`/`grid` row that doesn't stack
  (`flex` should be `flex-col sm:flex-row`), a fixed-width element (score circle/chart) eating a
  flex row, or width-wasting `m-8`/nested `p-6` on small screens.
- **⚠️ `smallTaps`** — interactive elements < 44px tall (Apple) / 48px (Google). App chrome
  (Dashboard/Bookmark/Dark Mode) is global, not the tool's concern; flag the tool's own.
- **⚠️ `zoomInputs` > 0** — inputs/selects < 16px font trigger iOS Safari auto-zoom on focus.
- **screenshot** — judge stacking, chart fit, readability, sticky-element overlap.

## Worked example — NameAudit (2026-06-25), what the pass caught
- ✅ no document overflow; radar chart (128×128) fits.
- **🐛 results view crushed to ~28px text column** — "Lumen / is / a / genuinely / beautiful…"
  one word per line. Cause chain: outer `div.bg-white.m-8.p-6` (32px margins + 24px padding
  waste ~110px of a 375px screen → 229px) → inner result card `p-6` → `flex items-start gap-5`
  (score circle ~128px + gap 20px leaves ~28px for the summary text), and the score+text row
  does **not** stack on mobile. Fix: `m-8`→`m-3 sm:m-8`, the score/text `flex`→`flex-col
  sm:flex-row`, `gap-5`→`gap-3 sm:gap-5`, `p-6`→`p-4 sm:p-6`.
- ⚠️ inputs 14px / selects 12px (iOS zoom); several tool buttons 22–38px (< 44px tap target).

**Likely catalog-wide:** the crushing pattern (non-responsive `flex` rows + fixed-width
elements + width-wasting margins/padding) is probably repeated across tools — a mobile sweep of
the catalog is worth scheduling, not just per-tool.
