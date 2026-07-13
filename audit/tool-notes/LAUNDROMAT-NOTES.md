# LaundroMat — architecture & lock notes

**Known-good:** tag `laundromat-v1` · golden `audit/laundro-mat-golden-sample.json`
**Verify:** `npm run check:golden laundro-mat` (backend must be up: `npm run dev:backend`)

## What it is
Five-in-one laundry tool. Frontend `src/tools/LaundroMat.js` (5 tabs), backend
`backend/routes/laundro-mat.js` (4 actions). Tabs ↔ actions:

| Tab | Backend action | Model | max_tokens |
|---|---|---|---|
| Advisor (text or care-label photo) | `advise` / `label` | `claude-sonnet-4-6` | 4000 |
| Stain SOS | `stain` | `claude-haiku-4-5-20251001` | 2000 |
| Garment Rescue | `rescue` | `claude-haiku-4-5-20251001` | 2000 |
| Care Symbols | — (static `CARE_SYMBOLS` reference, client-only) | — | — |
| Timers | — (client-only Web Audio + Notifications) | — | — |

The Advisor uses `label` (not `advise`) when an image is attached with no typed
description; otherwise `advise`. `care_symbols` are only returned when a label photo
is supplied, and are rendered as the real SVG glyphs from `CARE_SYMBOLS` via
`resolveCareSymbol()` (matched by `code`, then by `name`).

## DO NOT silently reverse
1. **Model split is deliberate.** advise/label = `claude-sonnet-4-6` (vision-heavy care-label
   reading needs the stronger model); stain/rescue = `claude-haiku-4-5-20251001` (cheaper,
   text-led, still vision-capable for the optional photo). Don't "standardize" to one model.
2. **Rescue verdict trio must stay consistent.** `recoverable` (bool), `confidence`
   (high|medium|low) and `success_probability` (High|Medium|Low) must agree — the prompt has a
   `CONSISTENCY:` rule enforcing it (if `recoverable` is false, both must be Low). The frontend
   reads `success_probability` for **both** the on-screen verdict chip *and* the copied text
   (`buildFullText`), so screen and clipboard can't disagree. Don't split them back apart.
3. **`care_symbols` belong in the Advisor copy text.** `buildFullText`'s `advisor` branch
   includes `care_symbols`; there is no longer a dead `symbols`-tab branch (the Symbols tab is a
   static reference and never holds AI results). Don't re-add a symbols branch that copies advice
   data while the static chart is on screen.
4. **`CARE_CODE_REF` (backend) ⇄ `CARE_SYMBOLS` (frontend) must stay in sync.** The backend
   prompt feeds the model the exact code list; the frontend resolves those codes to SVGs. Adding
   or renaming a symbol means editing both.

## Mobile (render-layer, NOT in golden)
- **Tab bar is a 2-row responsive grid:** `grid grid-cols-3 sm:grid-cols-5 gap-1.5` (no
  `flex-1`). The old single-row `flex` clipped the 5th tab ("Timers"/"Temporizadores") off the
  right edge at 375px. Keep it wrapping — five emoji+label tabs do not fit one row on a phone.
- Otherwise clean at 375px: no overflow, no crushed columns, tool's own inputs ≥16px (no iOS
  zoom — the only sub-16px `<select>`s are the global language/currency chrome), tap targets ≥44px.

## Gotchas
- **Backend rate limit = 4 req/min** (`DEFAULT_LIMITS`). `check:golden laundro-mat` runs its 3
  cases sequentially and fits; back-to-back manual bursts will 429 (re-run after ~60s).
- **Label action has no golden case** — it requires a base64 image, impractical to embed. The
  three text cases (advise/stain/rescue) cover the regression surface; rescue guards the
  consistency fix.
- Fully localized (in `LOCALIZED_TOOLS`); `lmt_*` keys live in
  `src/i18n/locales/tools/laundro-mat.js` across 13 languages.
