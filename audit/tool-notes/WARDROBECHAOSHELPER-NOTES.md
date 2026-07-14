# WardrobeChaosHelper — audit lock notes (`wardrobechaoshelper-v1`, 2026-07-14)

Backend `wardrobe-chaos-helper.js` — 3 endpoints, all `MODELS.FAST`:
- `POST /wardrobe-chaos-helper` (main outfit gen) — max_tokens 4000 — emits `outfit_combinations[]`
- `POST /wardrobe-chaos-helper/regenerate` (swap/regen) — max_tokens 4000 — emits `outfit`
- `POST /wardrobe-chaos-helper/pack` (packing list) — max_tokens 2000→**4000** — emits `packing_list[]`

## 🐛 Critical — 2 of 3 endpoints were DOWN every call
A secondary guard was copy-pasted verbatim into all three endpoints after each correct primary guard:
```js
if (!parsed.outfit_combinations && !parsed.outfits && !parsed.items) {
  return res.status(500).json({ error: 'Could not analyze your wardrobe...' });
}
```
`regenerate` emits only `outfit`; `pack` emits only `packing_list`/`outfit_plan`/… — neither emits `outfit_combinations`/`outfits`/`items`, so all three were `undefined` → the block **always fired** → **500 on every Swap/Regenerate and every packing-list generation** (entire Packing tab dead). On `main` the same block was harmless dead code (its primary guard already guarantees `outfit_combinations`). **Fix: deleted the block from all three endpoints.** Each primary guard (`outfit_combinations` / `outfit` / `packing_list`, all top-level non-nullable) is correct and sufficient.

## Other fixes
- **Truncation:** pack was max_tokens **2000** with an up-to-14-day `outfit_plan` (5-field `items` each) + uncapped `packing_list`/`tips` → German truncation. Bumped to **4000** and hard-capped `packing_list ≤ 15`, `tips ≤ 4`, `outfit_plan ≤ numDays`. (Verified live: 14-day Berlin/DE trip → 200, 10 items / 14 days / 4 tips, no truncation.)
- **German unescaped double-quotes:** added the no-inner-double-quote rule to all three prompts (prose fields `why_this_works`/`confidence_boost`/`color_coordination` quote item & color words in German).
- **Annotation leaks:** stripped ~23 `— one sentence` / `— 3-6 words` suffixes across all three schemas; added ONE global brevity line ("Keep every field to one tight phrase or sentence") per prompt.
- **PF-2:** frontend `c.label = c.labelText` alias had extra spaces (`c.label       = c.labelText`) → normalized. `labelText` already in the c block.

## Not bugs (verified)
- `comfort_rating`/`style_rating` are bare integers, rendered `{v}/10` — **must stay numeric**.
- No i18n-enum switch bug: `weather`/`mood` comparisons use stored English input values, not localized model output.
- USD-anchor: none (no price fields anywhere).
- `sessionHistory` key `wardrobechaoshelper-history` is write-only, kept for the name-keyed frontend audit.

## Verify
`npm run check:golden wardrobe-chaos-helper` (3 cases, all German incl. the two previously-DOWN endpoints). Backend must be up.
