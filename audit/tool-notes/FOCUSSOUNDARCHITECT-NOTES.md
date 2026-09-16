# FocusSoundArchitect — architecture & lock notes

**Known-good:** tag `focussoundarchitect-v1` · golden `audit/focus-sound-architect-golden-sample.json`
**Verify:** `npm run check:golden focus-sound-architect` (backend up: `npm run dev:backend`)

## 2026-09-16 — real bug, not just wording: bass constraint contradicted itself

Live example (Deep Work, "I like deep/low bass" selected) produced a brown-noise
"Deep Bass Foundation" layer whose own `why` text said "You specified you cannot
stand deep/low bass" — recommending exactly what it claimed to be avoiding. Root
cause: the old prompt paragraph ("SENSORY CONSTRAINTS ARE HARD CONSTRAINTS...
sensitivity to sudden sounds, high frequencies, excessive variation, **bass**...")
listed bass in the same breath as the aversions, priming the model to treat ANY
bass-related selection as something to avoid — even though `needLowBass`'s label
(then "Prefer deeper/lower sounds") is a positive preference, confirmed by the
"relaxing bedroom" ready-made example that pairs it with calm/low-energy inputs.

Fix — replaced that paragraph with **HARD CONSTRAINTS**: an explicit per-item list
covering both directions ("Avoid sudden sounds → ...", "I like deep/low bass →
include a brown-noise layer, do not describe the mix as light/bright/thin"), plus
a FINAL CONSTRAINT CHECK line asking the model to compare every layer and every
`why` against every selection before returning. Also added `hasHighFreqSensitivity`
+ `BRIGHT_TYPES = ['white_noise']` as a deterministic code-level filter (mirroring
the pre-existing `hasSuddenSensitivity`/`SHARP_TRANSIENT_TYPES` pattern for
rain/fire) in both `/focus-sound-architect` and `/focus-sound-architect/scene` —
the same "prompt says the right thing, code enforces it too" reasoning, since a
prompt-only fix had already once proven insufficient for exactly this class of bug.
No code-level enforcement added for the bass *inclusion* case (a "must add"
constraint is riskier to enforce by blind injection than a "must remove" filter
is) — relying on HARD CONSTRAINTS + the audit-style final check for that direction.

**UI root cause, fixed alongside:** the "Avoid" heading sat over 5 chips that were
actually a mix of aversions and preferences (`needLowBass` and `needVariety` are
positive wants, not aversions) — "Avoid: Prefer deeper/lower sounds" was
genuinely contradictory framing, not just awkward. Renamed the heading `fsa_avoid`
"Avoid" → "Sound needs" and every chip to a self-contained directive that doesn't
depend on the heading for its polarity: "Avoid sudden sounds", "Avoid high
frequencies", "Keep it consistent", "Give me some variation", "I like deep/low
bass" — across all 13 locales (`src/i18n/locales/tools/focus-sound-architect.js`),
plus the matching hardcoded English fallback `label` in `SENSITIVITIES` (the
string actually sent to the backend — the frontend sends `.label`, not the
translated `t()` string, so this fallback is what the model sees regardless of
UI language). Ran `npm run build:locales` after — the per-tool i18n source file
isn't what the dev server reads; the generated bundle under
`src/i18n/locales/generated/` is, and it needs a rebuild after every i18n source
edit, per CLAUDE.md.

Verified live: same Deep Work + "I like deep/low bass" input now produces
"Brown noise emphasizes deep, lower frequencies as you stated you prefer..." —
no contradiction, correct layer, correct framing.

**Description/tagline:** already fixed in commit `7fabdb51` earlier the same day
(catalog `description`/`tagline` in `src/data/tools.js` already match the
requested text exactly, already on `origin/main`) — a re-check of a report that
was very likely a stale cached page load, not an unfixed regression. No change
needed.

## What it is
A focus-soundscape designer. **As of 2026-09-14, rain/ocean/wind/forest/fire/café play real
recorded ambience from `public/sounds/*.m4a`** (see dated entry below) — white/pink/brown noise
and binaural beats remain **Web Audio synthesis** (generated from Float32 noise buffers /
detuned oscillators; no recording exists for those). Frontend `src/tools/FocusSoundArchitect.js`
(~2130 lines). Backend `backend/routes/focus-sound-architect.js` — **3 endpoints**, all
`claude-haiku-4-5-20251001`:

| Endpoint | max_tokens | Returns |
|---|---|---|
| `/focus-sound-architect` (main) | 2000 | `{soundscape_name, layers[] (1-3), start_here}` |
| `/focus-sound-architect/scene` | 4000 | evolving `{scene_name, description, phases[], arc_explanation, transition_notes[]}` |
| `/focus-sound-architect/adjust` | 4000 | `{adjustments[], add_layer, remove_index, explanation}` |

Backend uses `callClaudeWithRetry` → a parse failure throws to the route's top-level catch → a
500. No per-endpoint success guard needed. **As of 2026-09-15, the main endpoint's `type`
whitelist is 9 values (no `binaural`)** — see dated entry below; scene/adjust also exclude it from
their AI-facing vocabulary. Each endpoint validates `layer.type` against its whitelist and
**silently drops** unknown types (see fix #2 below).

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

## 2026-09-15 — owner rewrite: no neuroscience claims, live feedback is the product philosophy

Owner-authored spec covering description/tagline, input, LLM prompt, output tone, interface, and
ready-made soundscapes. Full replacement, not a patch — see `audit/REWRITE-INSTALL-KIT.md`
pattern (structural change over iterative prose patching).

**Copy.** Catalog `description`/`tagline`/`seoDescription`/`guide` in `src/data/tools.js` replaced
— dropped the "enhance your concentration" claim and the feature-list phrasing entirely. New
tagline: "Build a background your attention can live with."

**Input.** `SOUND_PREFS` (the intake checklist) no longer offers Binaural Beats.
`SENSITIVITIES`' `needLowBass` relabeled "Need deep/low bass" → "Prefer deeper/lower sounds" (the
label is also what's sent to the backend prompt as the sensitivity string, so this one edit
changes both the button text and what the model reads).

**Main-endpoint prompt (`backend/routes/focus-sound-architect.js`), full rewrite.** New governing
rules, verbatim from the owner: USER EVIDENCE FIRST, NO NEUROSCIENCE CLAIMS, NO GUARANTEES,
MASKING (describe as making distractions less distinct, never as eliminating them), SENSORY
CONSTRAINTS ARE HARD CONSTRAINTS, KEEP IT SIMPLE ("earn every layer" — no padding to look
thorough), EXPLAIN THE CHOICE NOT THE USER (no inferring ADHD/anxiety/arousal state), VOLUME
(starting position, not a precise prescription), DURATION (no habituation/fatigue claims).
**Schema simplified**: `{soundscape_name, layers[] (type/volume/label/why), start_here}` —
`description`, `usage_tips[]`, and `adjustment_guide{}` are gone. The static `adjustment_guide`
(if_too_distracting/if_not_enough/after_30_minutes) duplicated what the live "How does it sound?"
feedback buttons already do better (see Interface below); dropping it isn't a capability loss.
`start_here` is new — one concrete instruction for trying the mix, e.g. "Start with brown noise
around 60... give it a minute... if you notice the sound itself, lower it."

**Binaural — scope decision.** The frontend has no `BINAURAL_PROGRAMS` cognitive-claim preset
array (an earlier note describing one was inaccurate — checked, doesn't exist); the manual
"+ Add Layer" binaural option is a plain type + a numeric Hz/base_hz display, no claim attached.
Decision: remove binaural from the **AI's own vocabulary** in all three endpoints (main `layers`,
scene `layers`, adjust `add_layer`) — the AI never recommends it, matching "there's no need for a
scientifically loaded option when ordinary layers can do the job" — while leaving the **manual**
add-layer capability (`createBinauralLayer`, `LAYER_TYPES.binaural`, `ADDABLE_LAYERS`) intact for
anyone who wants to add it themselves; that's an explicit, self-directed action, not an AI claim.
Code-level: `validTypes` in all 3 endpoints dropped `'binaural'`; main endpoint's layer filter also
gained `.slice(0, 3)` (belt-and-braces with the prompt's 1-3 cap). `hasSuddenSensitivity`/
`SHARP_TRANSIENT_TYPES` (the code-level rain/fire filter for sudden-sound sensitivity) untouched.

**`guardProse()`'s field list** updated to match the new schema: was
`description, usage_tips[], layers[].why, adjustment_guide` → now `layers[].why, start_here`.

**Interface.** Removed the "Related Tools" box (Focus Pocus, Task Avalanche Breaker) and the
post-result "Focus Pocus structures the actual session around it" line entirely — **both ends**,
unlike WhatsMyVibe/WhereDidTheTimeGo which each kept one post-result link. Added
`FocusSoundArchitect` to `audit/audit_v2-3-2.py`'s `NO_CROSSREF` set **and** its `_pre_exempt`
tuple (the latter is the one that actually silences "no cross-tool links at all" for a tool with
zero links at either end — WhatsMyVibe/WhereDidTheTimeGo only needed `_pre_exempt` for their
pre-result half, since they kept a post-result link; a tool with none at either end needs both).
Removed the now-unused `linkStyle` const. Added a one-line product-philosophy subtitle under "How
does it sound?": "Don't try to predict the perfect sound. Start sensibly, listen, and adapt."
(new key `fsa_feedback_philosophy`). "Adaptive Volume" checked and kept as-is — it's a real mic
analyser (`getUserMedia` → `AnalyserNode` reading ambient amplitude in the speech band) driving
`masterGain.gain.setTargetAtTime` live, not a cosmetic label; renaming wasn't warranted.
`recipe.start_here` now drives the transport-bar subtitle (`recipe.start_here || recipe.description
|| t('fsa_tap_play')`) and `buildFullText`'s copy output — kept `|| recipe.description` for
backwards-compat with the share-link import path and cached recipes from before this rewrite.

**Ready-made soundscapes.** All 6 `QUICK_PRESETS` descriptions shortened to the owner's exact
one-liners (e.g. "Steady brown + pink noise", "Rain + café murmur") — both the object's `description`
fallback and every language's `fsa_qs_*_d` i18n key.

**Localization.** All 13 languages patched in the same pass (script-based exact-line replace,
verified every anchor line existed before writing — see the Python file-I/O truncation gotcha in
CLAUDE.md): 6 preset descriptions × 13, `needLowBass` × 13, new `fsa_feedback_philosophy` × 13
(translated per-language, not copy-pasted English), and 8 dead keys removed × 13
(`fsa_pref_binauralBeats`, `fsa_related_tools`, `fsa_xref_focus_pocus`, `fsa_xref_task_avalanche`,
`fsa_xref_post_result`, `fsa_too_distracting`, `fsa_not_enough`, `fsa_after_30_min`). Verified
Spanish live end-to-end (setup form + a generated preset) — clean render, no `{{var}}` leaks.

**Golden sample updated** (`audit/focus-sound-architect-golden-sample.json`): main case's `output`
rewritten to the new schema (no `description`/`usage_tips`/`adjustment_guide`, no binaural layer);
scene case's input swapped "Binaural Beats" → "Forest" (the frontend can no longer send the former
since it's off the intake checklist). `check:golden` was genuinely red before this — the checker
derives required sections from the fixture's own keys, so an unmigrated fixture fails against a
migrated schema, not a false alarm.

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

## 2026-09-14 — real recordings replace synthesis for rain/ocean/wind/forest/fire/cafe

Same day as the synthesis rewrite above, the owner's 21 collected `.wav` recordings (24-bit/
48kHz stereo, ~1.4GB total — confirmed via `afinfo`, already prepared as clean loops with
adjusted volume) became real assets. Owner decision: real recordings **replace** synthesis
entirely for the 6 categories with a recording (not a toggle) — white/pink/brown noise and
binaural beats keep synthesis, no recording exists for those.

**Format/hosting:** raw WAV is not web-deployable at this size — converted 6 representative
files (one per category) with macOS's built-in `afconvert` to AAC/M4A at 96kbps:
`steady rain→rain.m4a` (2.0MB), `gentle shore→ocean.m4a` (1.2MB), `soft wind→wind.m4a` (2.6MB),
`Forest without birds→forest.m4a` (2.7MB), `medium fireplace→fire.m4a` (0.4MB, source is mono/
34s — a property of the recording, not the conversion), `moderate cafe→cafe.m4a` (6.2MB, source
is 44.1kHz/~8.3min — also a recording property). **17MB total** in `public/sounds/`, served
statically (not bundled into the JS build) and fetched lazily only when a layer actually plays.

**The other 15 collected files are not wired up.** They're variants within the same 6 categories
(e.g. rain also has gentle/on-window/on-roof/storm versions) that the current architecture has
no slot for — `LAYER_TYPES` is one entry per category, not per variant. A "pick a variant"
selector is a real, scoped follow-up feature, not started.

**Architecture:** `REAL_AUDIO_URLS` maps type→URL for the 6 categories. `loadRealAudioBuffer`
fetches + `decodeAudioData`s + caches by URL (in-flight promises cached too, so two layers
needing the same file share one fetch). `createLayerAsync(ctx, layerDef)` is the new unified
entry point — real recording when a URL exists for the type, falling back to
`LAYER_TYPES[type].create()` synthesis **on any load failure** (offline, 404, decode error) so a
network hiccup degrades to the old synthesized sound instead of a silent/broken layer. Both real
call sites (`startAudio`'s per-layer build, `addLayerToRecipe`'s live-add-while-playing path) now
go through this instead of calling `typeDef.create()` directly — `startAudio` builds all layers
concurrently via `Promise.all` (preserving recipe order, since `eqNodes[idx]`/`vols[idx]` are
keyed by original array position) rather than sequentially, so N files fetch in parallel.

**Gapless looping applies to real files too.** A lossy encode adds a few thousand samples of
encoder priming at the boundaries — even a source recording prepared as a clean loop can pick up
a click at the seam after AAC encoding. `applyLoopCrossfade()` (same technique as
`createNoiseLayer`'s own seam fix) blends the decoded buffer's tail into its head in place before
it's ever played.

**Verification note — dev-only gotcha, not a bug:** this repo's `package.json` has
`"proxy": "http://localhost:3001"` for CRA's dev server. A plain `fetch()` (no `Accept:
text/html`) for `/sounds/*.m4a` gets forwarded to the *backend* in dev instead of served from
`public/`, 404ing even though the file exists on disk — confirmed this happens for `/favicon.ico`
too, so it's a CRA dev-proxy heuristic, not specific to this feature. **Does not affect
production**, where Express serves `build/` (which includes everything copied from `public/`)
directly with no such proxy layer. Verified the real pipeline properly by standing up a throwaway
local static server (`python3 -m http.server` + a CORS header) and running the actual fetch →
decodeAudioData → crossfade → loop code against it — confirmed a real decoded buffer (159.37s,
48000Hz, stereo, matching the source exactly) plays with genuine signal. Separately confirmed the
**fallback** path in the live app (where the dev-proxy 404 is real): no crash, no uncaught
rejection past `createLayerAsync`'s catch, and a live audio-graph tap showed real synthesized
signal — the graceful-degradation path works as designed.
