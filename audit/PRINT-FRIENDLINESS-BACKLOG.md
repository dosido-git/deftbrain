# Print / Export Friendliness Backlog

Living note on making tool pages produce a clean artifact when a user prints or
saves to PDF (browser **Cmd-P / "Save as PDF"**, which is what people actually
reach for — not every tool has a dedicated export button). Born from a BuyWise
PDF review (June 2026): a saved page showed **blank collapsed sections**, **leaked
interactive chrome** (tab bar, inputs, buttons), and the **site marketing footer**
("Browse all 551 guides") appended to a $50K car-buying report.

---

## How printing works in this app (read first)

- The app supports Tailwind's **`print:` variant** (confirmed: `.print:hidden`
  and `.print:block` compile into `@media print {}`). Use `print:hidden` to drop
  an element on print, and `hidden print:block` to keep an element `display:none`
  on screen but reveal it on print.
- `src/components/ToolPageWrapper.js` injects a print stylesheet on mount and
  already hides the **outer site chrome** via `data-print-hide` (header, sidebar,
  controls) and shows print-only branding via `data-print-show-flex`. The main
  tool content renders inside `data-print-section` / `data-print-main`.
- That outer system does **not** reach (a) the marketing **Footer**, which is
  rendered outside the wrapper, or (b) anything **inside** a tool component — its
  own tab bar, inputs, buttons, and collapsible sections.

## The core gotcha: collapsibles unmount their body

Most tools have a **copy-pasted `Section`/accordion** that renders its body as
`{open && (<div>…</div>)}`. When collapsed, the body is **not in the DOM**, so no
CSS (`@media print` or otherwise) can reveal it — a printed page shows an empty
header bar. There is **no shared `Section` component**, so this lives in ~each of
the ~128 tool files independently.

## The fix pattern (proven, already shipping)

Reference implementations in the repo:
- **`src/tools/RentersDepositSaver.js`** — uses `hidden print:block` on section
  bodies and `print:hidden` on chrome. The original template.
- **`src/tools/BuyWise.js`** — `Section` converted (June 2026): body is always
  mounted as `${open ? '' : 'hidden print:block'}`; toggle arrow `print:hidden`.
- **`src/components/Footer.js`** — `print:hidden` on `<footer>` (global; done).

Per-tool recipe:
1. **Collapsibles:** change `{open && (<body>)}` → always-render
   `<div className={`… ${open ? '' : 'hidden print:block'}`}>…</div>`, and add
   `print:hidden` to the open/close arrow. (Body becomes always-mounted — fine
   for display-only result panels; check before doing it to a section that runs
   heavy effects or holds large lists.)
2. **Interactive chrome:** add `print:hidden` to the tool's view/tab switcher,
   text inputs, submit/ask buttons, "convince partner"-style action rows, and
   any control that's meaningless on paper.
3. Keep the actual results/verdict content visible (default — don't tag it).

## Status

- ✅ **Footer** — `print:hidden` (global; every tool's print). `a69d548`.
- ✅ **BuyWise `Section`** force-expand on print. `a69d548`.
- ☐ **BuyWise chrome** — tab bar, "Ask your own question" box, "Convince partner"
  buttons not yet tagged `print:hidden`. (Small.)
- ☐ **App-wide** — ~128 other tools still have unmount-`Section`s + untagged
  chrome.

## Recommended approach for app-wide (decide before starting)

Two paths — **option B is preferred**:

- **A. Per-tool tagging** — apply the recipe above to each tool. Mechanical but
  ~128 files; easy to do in localization-style batches; low risk per file.
- **B. Extract one shared print-aware `Section`** (e.g. `src/components/Section.js`)
  that renders body-always + `hidden print:block` and exposes the same
  `{icon,title,badge,defaultOpen,children}` API the local copies use, then
  migrate tools to import it (delete their local `Section`). Fixes collapsibles
  app-wide in one component; still need per-tool `print:hidden` on chrome.
  Watch the name-keyed frontend audit (`audit/audit_v2-3-2.py`) — several tools
  rely on the local `Section` using a non-`useState` hook so the file's first
  `useState` match lands in the main component (PF-14 ordering); a shared
  component must preserve that or the tools' own ordering still satisfies it.

## Verifying a print change

- Gates: standard 5 (syntax / audit / guard-keys / diff-audit / localization).
  Adding `print:` classes touches no `t()` keys, so localized tools stay green.
- Confirm Tailwind compiled the variant: in the browser, scan `document.styleSheets`
  for an `@media print` block containing `.print\:hidden` / `.print\:block`.
- True print rendering can't be toggled from page JS; rely on the compiled-rule
  check + the proven pattern, or use a real Cmd-P / DevTools "Emulate print media".
