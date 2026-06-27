# GentlePushGenerator — architecture & lock notes

**Known-good:** tag `gentlepushgenerator-v1` · golden `audit/gentle-push-generator-golden-sample.json`
**Verify:** `npm run check:golden gentle-push-generator` (backend up: `npm run dev:backend`)

## What it is
A comfort-zone growth coach. Frontend `src/tools/GentlePushGenerator.js` is a **view state
machine** (`view`: setup · pick · active · countdown · log · reflection · growth · ladder ·
inventory · vault), backend `backend/routes/gentle-push-generator.js` dispatches **7 actions**,
all `claude-sonnet-4-6`:

| Action | max_tokens | Notes |
|---|---|---|
| generate | 4000 | 3 calibrated pushes (gentle/moderate/bold) |
| regenerate | 800 | one replacement push from feedback (small schema) |
| reflect | 800 | post-outcome reflection (small schema) |
| review | 4000 | growth-map analysis from push history |
| courage-countdown | 4000 | in-the-moment 4-6 step sequence |
| escalation-ladder | 4000 | 7-rung progression |
| fear-inventory | 3000 | profile from 5-20 scenario ratings |

Backend uses `callClaudeWithRetry` (lib/claude.js): a JSON parse failure throws to the route's
top-level catch → a generic 500. **There is intentionally no per-action success guard** — the
retry helper owns parsing. Don't add `parsed.x`-style guards (that's how the S7.13 bug crept in).

## DO NOT silently reverse
1. **All 7 actions on `claude-sonnet-4-6`.** Consistent model; don't split.
2. **`domain_scores` is computed server-side, not trusted from the model.** `handleFearInventory`
   computes domain averages from the user's ratings, inverts scariness→comfort, and **always
   overrides** `parsed.domain_scores` with the computed map ([backend ~line 468]). It used to be
   gated behind `if (!parsed.acknowledgment)` — a dead condition (`acknowledgment` is never an
   inventory key) that the backend audit flagged as S7.13. Keep the unconditional override.
3. **`pushLog` cap is 100, in BOTH the reflect flow and quick-log.** The reflect flow used to
   `.slice(0, 6)` while quick-log kept 100 — that truncated history on every reflect (data loss)
   and made Silver(15)/Gold(30) domain badges unreachable. Keep both at 100.
4. **Single shared header** (`renderPersistentHeader(mode)`) is the only place a reset button
   lives in markup — that's what keeps PF-16 at exactly 1 reset. `mode==='setup'` shows the
   "Try example" pill and hides reset; every other view shows reset. Don't re-inline per-view
   headers (that was the 9-reset PF-16 violation).
5. **`buildFullText` is view-aware.** Order: growth → inventory → vault → activePush → vault
   fallback. The growth-map and fear-inventory branches build their copy text entirely from
   EXISTING `gpg_*` keys (no new i18n keys). Keep it view-keyed so the right export is registered.

## Mobile (render-layer, NOT in golden)
- Clean at 375px across setup / pick / growth (radar chart is a fixed 220px `mx-auto` element —
  fits). No overflow, no crushed columns.
- Minor (catalog-wide, not fixed): push-day `<select>` is 12px (iOS zoom) / 34px tall; the
  inventory 5-point rating buttons are 28px (<44px).

## Gotchas
- **Backend rate limit = 4 req/min.** `check:golden gentle-push-generator` runs its 3 cases
  sequentially and fits; manual bursts will 429. The **review** case can take ~60-90s.
- **Copy branding appears twice by design:** the shared `CopyBtn` prepends
  `"DeftBrain · deftbrain.com\n\n"` and `buildFullText` appends `BRAND`. Two mentions is correct.
- Fully localized (in `LOCALIZED_TOOLS`); `gpg_*` keys in `src/i18n/locales/tools/gentle-push-generator.js`
  across 13 languages. The now-unused `gpg_seed_comfort`/`gpg_seed_growth` keys (the removed empty
  seed button) are harmless orphans.
