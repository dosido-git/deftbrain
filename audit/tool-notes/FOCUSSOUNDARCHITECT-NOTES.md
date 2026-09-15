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

## 2026-09-14 — synthesis rewrite: layers were too static and too similar

User report: "The current live code all sounds like the same static to me." Root cause, on
inspection: `rain`/`ocean`/`wind`/`forest`/`fire`/`cafe` were each a fixed filter cutoff on top
of noise, with only 1-2 near-inaudible LFOs (depth 0.02-0.06 against a 0.4-1.0 base level) —
real movement was there in the code but far too quiet to hear, and several types leaned on
overlapping frequency bands with no distinguishing event-level texture (rain's "droplets,"
fire's "pops," forest's "chirps," cafe's "clinks" were all sub-0.08-gain garnish on top of a
dominant, generic filtered-noise bed). `BUFFER_SECONDS` was also only 4s, short enough for the
loop seam to read as a periodic mechanical tick.

Rewrote all six composite layers (`createRainLayer`, `createOceanLayer`, `createWindLayer`,
`createForestLayer`, `createFireLayer`, `createCafeLayer`) with real, audible per-type dynamics:
rain's patter band sweeps in both filter frequency and volume on an ~18s intensity cycle; ocean
gets an actual wave cycle (body volume + brightness swell together, surf offset slightly after,
plus a ~100s tide drift); wind's gust sweeps volume + cutoff together with a second irregular
non-integer-ratio LFO layered on top, plus a narrow "howl" band that only emerges at gust peaks;
forest's two chirp voices are now square-wave gated (distinct on/off calls, not a continuous
tone) under a slow presence envelope; fire's crackle is gated by two independent fast LFOs for
an actual sputtering rhythm, plus a separate slow mid-band "pop" for logs shifting; café uses
three actual speech-formant bandpass bands (350/850/2300Hz, each independently drifting) instead
of one generic bandpass, so the murmur reads as voices rather than noise. `BUFFER_SECONDS` raised
4→16s.

**Bug introduced and caught in the same pass:** `createNoiseLayer`'s returned interface didn't
expose the internal `BiquadFilterNode`, but the new layer functions all need to attach an LFO to
a filter's own `.frequency` param (e.g. rain's intensity sweep, ocean's wave brightening). Every
new layer crashed on play (`Cannot read properties of undefined (reading 'frequency')`) until
`filter` was added to that returned object. Caught via live testing (console error), not by
reading the diff.

**Verification method, since "does it sound different" can't be read from source:** tapped the
*live* Web Audio graph in the browser (monkeypatched `AudioContext` + `GainNode.prototype.connect`
to intercept the master gain's connection to `ctx.destination` and insert an `AnalyserNode`), then
isolated one layer type at a time via the real UI (load a preset, remove/add layers) and read the
actual frequency spectrum. First attempt gave a false "layers look identical" result — a bug in
the *test harness*, not the code: the analyser was torn down by `stopLayers()`'s
`masterGainRef.current.disconnect()` and never re-attached to the next `startAudio()`'s new master
gain node (the tap only fired once, guarded by `!ctx.__tapAnalyser`), so later readings were a
slowly-decaying remnant of the *first* layer measured, not the current one. Fixed by re-tapping on
every connect and setting `analyser.smoothingTimeConstant = 0` (no carryover between reads). With
a correct tap, Rain and Fire showed clearly distinct spectral shapes (rain: broad and full
50Hz-2200Hz, peaking upper-mid 1500-2200Hz; fire: dominant 50-300Hz, a real valley through
700-2200Hz, a secondary crackle bump 2800-6000Hz) — confirming the fix, not just the code review.
**Lesson: when verifying "do these sound different," tap and measure the actual live audio graph
rather than trusting a spectral read from a single script run — re-verify the measurement setup
itself (does the tap survive a stop/restart cycle?) before trusting what it reports.**

Separately: the user has independently collected 21 real ambient `.wav` recordings (looped and
volume-adjusted) matching a private `docs/ambient sounds.txt` wishlist. Nothing in the current
code loads external audio files — this synthesis rewrite is the good-faith improvement to the
existing engine, not a replacement with real recordings. Swapping in real files would be a
separate, larger project (asset hosting/compression — raw `.wav` is not web-deployable at that
count/size without conversion, `decodeAudioData` loading, looping via real buffers instead of
generated noise, deciding whether real audio replaces or supplements synthesis per layer type)
that hasn't been scoped or started.
