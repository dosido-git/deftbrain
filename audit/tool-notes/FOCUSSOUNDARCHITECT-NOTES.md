# FocusSoundArchitect — architecture & lock notes

**Known-good:** tag `focussoundarchitect-v1` · golden `audit/focus-sound-architect-golden-sample.json`
**Verify:** `npm run check:golden focus-sound-architect` (backend up: `npm run dev:backend`)

## What it is
A focus-soundscape designer with a full in-browser **Web Audio synthesis engine** (no audio
files — white/pink/brown noise are generated from Float32 buffers; rain/ocean/wind/forest/fire/
café are layered filtered-noise + LFO; binaural beats are two detuned panned oscillators).
Frontend `src/tools/FocusSoundArchitect.js` (~2150 lines). Backend
`backend/routes/focus-sound-architect.js` — **3 endpoints**, all `claude-haiku-4-5-20251001`:

| Endpoint | max_tokens | Returns |
|---|---|---|
| `/focus-sound-architect` (main) | 2000 | `{soundscape_name, description, layers[], usage_tips[], adjustment_guide}` |
| `/focus-sound-architect/scene` | 4000 | evolving `{scene_name, description, phases[], arc_explanation, transition_notes[]}` |
| `/focus-sound-architect/adjust` | 4000 | `{adjustments[], add_layer, remove_index, explanation}` |

Backend uses `callClaudeWithRetry` → a parse failure throws to the route's top-level catch → a
500. No per-endpoint success guard needed. Each endpoint validates `layer.type` against the
10-type whitelist and **silently drops** unknown types (see fix #2 below).

## DO NOT silently reverse
1. **All 3 endpoints on `claude-haiku-4-5-20251001`.** Cheap, fast; synthesis is client-side.
2. **Keep enum `type` and display `label` example fields free of length annotations.** The
   schema examples used to read `"type": "brown_noise — one sentence"` / `"label": "Deep
   Foundation — one sentence"`. `type` MUST be an exact enum — if the model echoes the suffix,
   the layer is **silently filtered out** (empty/short soundscape, no error). The golden MAIN
   case guards this (all layer types must be valid enums). Don't reintroduce the annotations on
   `type`/`label`. (Length hints on free-text fields like `description`/`why` are fine.)
3. **Scene phase durations MUST sum to `totalMinutes`.** The prompt enforces it and the scene
   playback engine auto-advances phases on that timing. Golden SCENE case = 90 min → durations
   sum to 90.
4. **`handleSmartFeedback` computes ONE consistent `newLayers`** (apply volume adjustments →
   append `add_layer` → drop `remove_index`), then: volume-only changes apply via
   `setVolumeSmooth` without interrupting playback; a structural change (add/remove) does a
   single `setRecipe` + `startAudio` rebuild so `recipe.layers` and the live `layersRef` indices
   can't desync. Don't go back to incremental splicing across `addLayerToRecipe`/
   `removeLayerFromRecipe` from inside the feedback handler (that lost volume adjustments on
   remove and double-set the recipe).

## Mobile (render-layer, NOT in golden)
- **Layer cards are two rows:** label (+ binaural Hz meta) on its own full-width row, then the
  controls (mute / solo / EQ · volume · remove) on a second row. The old single-row layout
  packed emoji + label(`flex-1`) + 5 controls and crushed the label to ~18px (one word per line),
  worse in longer locales. Keep the two-row split.
- Otherwise clean at 375px. Minor (catalog-wide): volume/EQ sliders are `h-1.5`/`h-2` (<44px).

## Gotchas
- **Backend rate limit = 4 req/min.** `check:golden` runs the 3 cases sequentially and fits; the
  **scene** case can take ~60-110s (golden runner timeout is 180s).
- **Presets render with no API call** (`loadPreset` builds the recipe locally) — handy for
  testing the player/layer-card render deterministically.
- Cross-tool: `focusCorrelation` reads FocusPocus history from `localStorage['fp-history']` to
  correlate soundscapes with focus scores — keep that key in sync if FocusPocus changes.
- Fully localized (in `LOCALIZED_TOOLS`); `fsa_*` keys in `src/i18n/locales/tools/focus-sound-architect.js`.
