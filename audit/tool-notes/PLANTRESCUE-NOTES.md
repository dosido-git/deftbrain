# Plant Rescue — architecture & lock notes (`plantrescue-v2`)

Reasons about a struggling or unfamiliar plant — plausible explanations
grounded in what was reported/visible, a discriminating check before any
conditional treatment, and a practical next step. Never a diagnosis, never a
percentage, never an invented recovery timeline. Vision-capable (photo +
2 extra close-up/soil photos in Rescue mode). Three modes (Rescue/Care/
Identify) dispatched off one endpoint, plus follow-up Q&A and a companion
(care-compatibility) grouping advisor.

**Frontend:** `src/tools/PlantRescue.js`. **Backend:**
`backend/routes/plant-rescue.js` (3 endpoints, `MODELS.SMART`, v2 guard).
**Golden:** `audit/plant-rescue-golden-sample.json` (5 cases: rescue, care,
identify, companions, followup). Verify: `npm run check:golden plant-rescue`.

## V2 REWRITE (2026-09-06)

The v1 prompt asked the model to diagnose from ambiguous symptoms: a single
`primary_problem`, a numeric `confidence_score`, an `is_saveable` boolean, a
`recovery_timeline`, a **mandatory 12-month `seasonal_calendar`** (always on,
regardless of what was actually asked or known), and an unconditional
`propagation_guide` with an invented `success_rate`. None of that is
something a photo plus a few environmental facts can actually support — the
schema was commissioning fabrication by its own shape, the same lesson as
the Pet Behavior Decoder rewrite. The rewrite keeps the tool to what it can
back up: a small evidence ledger (REPORTED/VISIBLE/IDENTIFIED/INFERRED/
UNKNOWN, internal to the prompt), up to 3 plausible explanations each paired
with a distinguishing check, and one most-useful check **before** any
conditional treatment — "possibility → discriminating check → conditional
action," deliberately reversing the old order (the old output declared
"overwatering/root congestion — most likely cause" and only later admitted
the roots hadn't been inspected).

### Old schema → new schema (do not resurrect the old keys)

Three schemas now, one per mode, dispatched by `mode` inside a single
`/plant-rescue` handler (`RESCUE_SCHEMA`/`CARE_SCHEMA`/`IDENTIFY_SCHEMA` in
the route file):

| Old (single schema, all modes) | New |
| --- | --- |
| `plant_identification.confidence_score` (0-100) | `confidence: high\|moderate\|low` — never a percentage; a number implies calibration the model doesn't have |
| `diagnosis.primary_problem` (single answer) | `possible_explanations[]` (≤3, each with `why_it_could_fit` + `check`) — no possibility is "most likely" without evidence that distinguishes it |
| `diagnosis.severity` (critical/concerning/minor) + `is_saveable` boolean | `bottom_line.attention_level` (`likely_minor\|watch_and_check\|needs_attention\|serious_damage_possible`) — a condition label, never a survival prediction |
| `recovery_timeline` (invented) | `what_improvement_looks_like[]` — observable milestones, never a countdown |
| `seasonal_calendar` (mandatory 12-month) | `when_conditions_change[]` (Care mode only) — "if this changes, adjust like this," relevant to the actual reported environment, not calendar month |
| `repotting_guide` / `propagation_guide` (unconditional, always generated) | `repot_when[]` (Care mode, descriptive) / propagation removed from the schema entirely — mentioned only in prompt rules for follow-up, shown only if asked |
| `action_plan[]` with `priority: 1-3` (P1/P2/P3 framing) | `what_to_do_now[]` — lightest useful intervention first, no artificial urgency tiers unless priorities genuinely differ |
| `toxicity_warning.alternative_plants` (always included if toxic+pets/children) | `safety.guidance` only — a "safe alternative plants" shopping list is generated only if the visitor actually asks |

New shapes: **Rescue** — `plant_identification{best_match,scientific_name,
confidence,why_it_fits,alternatives,what_would_confirm}` /
`bottom_line{attention_level,summary}` / `what_you_reported[]` /
`possible_explanations[]` / `check_first[]{check,what_to_look_for,if_yes,
if_no}` / `what_to_do_now[]{action,why,condition}` /
`what_improvement_looks_like[]` / `safety{show,who_or_what,guidance}` /
`useful_next_photo`. **Care** — `plant{name,scientific_name,confidence}` /
`core_care{light,watering,soil_and_drainage,feeding,temperature_and_humidity}`
/ `repot_when[]` / `when_conditions_change[]` / `watch_for[]` /
`pet_child_safety{show,guidance}`. **Identify** — `best_match{common_name,
scientific_name,confidence,why_it_fits[]}` / `alternatives[]{name,
why_possible,how_to_distinguish}` / `what_would_help_confirm[]` /
`safety_note{show,guidance}`.

### Architecture simplification: no more parallel-split

The old route ran two parallel `callClaudeWithRetry` calls (diagnose + care)
specifically because the mandatory 12-month calendar made the combined
response too large/slow (~150s single-call). With the calendar and the
unconditional repotting/propagation guides gone, each mode's schema is small
enough for **one call, one schema, per mode** — the split was removed as a
direct consequence of the schema shrinkage the rewrite required, not a
separate optimization decision.

### Guard mechanism: `runOutputGuard`, not a regex `validateResult()`

Same reasoning as Pet Behavior Decoder: this tool's failure modes are
**invented facts** (a cause, a schedule, a recovery timeline, a chemical
treatment) with no fixed vocabulary a regex could catch. Added
`router.outputStandard='v2'` + `router.outputGuard.prohibit` (22 categories,
e.g. `symptom_mapped_directly_to_a_cause_without_supporting_evidence`,
`invented_recovery_timeline_or_stabilization_schedule`,
`unjustified_chemical_or_quasi_chemical_treatment_recommended`) +
`router.outputGuard.require` (3 categories) + `runOutputGuard()` calls after
generation for all three modes, with mode-specific `fields` arrays (Rescue:
`bottom_line.summary`, `what_you_reported[]`, `possible_explanations[].
why_it_could_fit`/`.check`, `check_first[].if_yes`/`.if_no`,
`what_to_do_now[].why`/`.condition`; Care: `core_care.watering`/`.feeding`,
`when_conditions_change[].adjustment`; Identify: `best_match.why_it_fits[]`
expanded per-index, `alternatives[].why_possible`/`.how_to_distinguish`).

**Bug found and fixed during install**: the Identify-mode guard call
initially pushed `best_match.why_it_fits` as a single joined-string field —
but that path in the actual parsed draft is an ARRAY (`why_it_fits: [""]`
per schema), so `getByPath` returned an array and `outputGuard.js`'s
container-hit safety check correctly refused to repair it (a repair can only
rewrite a string leaf, not a whole array) and silently dropped the
violation — confirmed live via the guard log (`dropped 2 violation(s) naming
a non-string field`). Fixed by expanding it into indexed `why_it_fits[i]`
fields, matching the pattern already used for every other array field.

### Follow-up: structured context, not a flattened "Diagnosis: [claim]"

The old `/followup` built its context as `Diagnosis: ${primary_problem}
(${severity})` — literally turning an uncertain model guess into a labeled
fact for the next call to build on. The new follow-up passes forward
REPORTED/POSSIBILITIES/CHECKS as plain sentences (mode-aware — Rescue vs.
Care vs. Identify each have differently-shaped `originalDiagnosis`), applies
`GENERAL_RULES` again, and is explicitly told a prior possibility "remains a
possibility until new evidence establishes it" and it "is allowed to revise
the earlier interpretation." Live-verified: asked "should I repot it now
just in case?" against a watch-and-check pothos result — correctly answered
that repotting first would add stress without evidence it would help, and
pointed back to the soil-moisture check instead of agreeing because the
question sounded cautious.

### Companion planting: care compatibility, not plant benefits

The old prompt opened with "You are an indoor plant placement expert" and
invited air-purifying claims, room/window inventions, and always suggested
buying 1-2 more plants. Rewritten to group by light/water/temperature/
humidity **compatibility** only — explicitly told not to invent room
availability, window direction, household humidity, or biological
companion-plant benefits, and not to automatically upsell more plants.
Schema changed: `groupings[]/conflicts[]/suggestions[]` →
`good_to_group[]/better_kept_apart[]/placement_principle`.

### Input form changes

- "What do you see?" → "🩺 What's happening?" (symptom section header).
- The `root_rot` symptom's label changed from "Bad smell/possible root rot"
  to plain "Bad smell" — the old label pre-supposed a diagnosis inside a
  checkbox, which is exactly the "symptoms are not diagnoses" rule the
  rewrite exists to enforce. The internal id (`root_rot`) is unchanged —
  it's a JS object key never shown to the model or the visitor.
- **`ageOfOwnership` free-text field removed**, replaced by a
  `symptomDuration` dropdown ("How long has this been happening?" — just
  noticed / a few days / a week or two / several weeks / a few months /
  longer / not sure). The old field conflated "how long you've owned the
  plant" with "how long the symptom has been present" — exactly the
  confusion the PLANT AGE/OWNERSHIP prompt rule warns against. Ownership
  duration, if a visitor wants to share it, still reaches the model via the
  free-text "Tell us a little more" field, which the prompt rule still
  covers.
- New "Has anything changed recently?" checklist (moved / repotted /
  watering changed / light changed / fertilizer changed / temperature
  changed / pest treatment / something else / nothing I can think of) —
  feeds `recentChanges` to the backend, included as REPORTED evidence.
- "Additional details * (if no photo)" → "Tell us a little more (optional)"
  — the required asterisk is gone; it was always effectively optional
  (photo OR text OR symptoms satisfies submission), the old asterisk
  overstated the requirement.
- **`wateringFreq` (daily/few-days/weekly/rarely bucket) replaced** by a
  `wateringMethod` practice question ("How do you decide when to water?" —
  checks soil first / on a schedule / when it looks thirsty / varies) plus
  an optional free-text `wateringFreqText` ("about how often lately?"). A
  calendar interval alone can't establish over- or under-watering per the
  WATERING prompt rule; the owner's actual practice is the more useful
  signal, and the free text lets them add a rough frequency without forcing
  it into a bucket.
- New optional `hasDrainage` (yes/no/not sure) — often more actionable than
  forcing the model to infer drainage from a photo.
- The existing compact symptom checklist, light/location/climate selects,
  and pets/children checkboxes were kept as-is — the spec was explicit that
  this form didn't need a wholesale redesign, only these targeted changes.

### Feature removals (schema-driven, not incidental)

The watering-tracker widget (`getWaterStatus`/`handleMarkWatered`) and the
progress-photos diary strip are **gone**, not hidden. Both depended on the
old schema: the tracker parsed `care_schedule.watering` with a regex
expecting an "every N-M days" string, which the new prompt deliberately
avoids producing (WATERING and NO ARBITRARY PRECISION rules) — so the old
regex would mostly return null against v2 output. Neither was on the KEEP or
ADD list in the rewrite spec, and both are removed for the same reason the
Pet Behavior Decoder rewrite dropped its severity-tracker widget: a feature
built on a schema shape the rewrite deliberately eliminated.

"Past Diagnoses" is also gone, folded into **My Plants**: each saved plant
in `plantCollection` now carries a `checks[]` array (`reported` /
`suggestedChecks` / `attentionLevel` per visit) instead of a flat session
history with a raw AI conclusion attached. "Check Again" preloads the
plant's identity and clears the results/description so the next check
starts fresh, and the current backend already accepts `priorObservations`
in the request body (compared descriptively, per the MY PLANTS / PAST
DIAGNOSES prompt rules — "history is observation, not diagnosis") — wired
from `plantCollection`'s `checks` for the active plant.

### Bugs found and fixed during install (not asked for explicitly)

1. **Stale cross-mode state leaking into a saved observation.** `selectedSymptoms`
   isn't cleared when switching away from Rescue mode (by design — mode
   switches don't reset the form). But `handleSavePlant`'s `reported` text
   unconditionally included `selectedSymptoms`, so saving a Care or Identify
   result could silently claim symptoms were reported that were never shown
   in that mode's UI, left over from an earlier Rescue session. Fixed:
   `reported` only includes symptoms when `mode === 'rescue'`.
2. **PF-15 false flag on a ternary either/or.** The submit button's
   `disabled`/`className` duplicated the same photo-or-text-or-symptoms
   ternary inline instead of referencing `canSubmitRef.current` (already
   computed once above) — the audit's either/or carve-out didn't recognize
   the field as optional once the asterisk was removed, since the shape
   didn't match its extraction regex. Fixed by referencing
   `!canSubmitRef.current` directly in both places, which is also just
   cleaner than the old duplicated inline condition.
3. **S1.5 history-shape false flag.** Same root cause as PF-15's history
   check would expect: the flat `plantrescue-history` list (a
   `usePersistentState` array with a `preview:` field, rendered as a "Past
   Diagnoses" panel) was removed on purpose per the explicit instruction to
   integrate it into My Plants instead. `PlantRescue` added to
   `audit/audit_v2-3-2.py`'s `_NO_HISTORY_TOOLS` exemption set, with a
   comment explaining the integration (matching the LaundroMat/
   JustifyMyMeeting precedent) — the per-plant `checks[]` array is the real
   observation history now, it just doesn't match this rule's naming/shape
   patterns.

## IDENTIFY MODE PROVENANCE fix (2026-09-06, same day)

The user flagged a real gap: nothing stopped a Rescue-mode symptom
description, Care-mode info, or saved-plant history from being used as
*evidence for botanical identity* in an Identify-mode answer. Worked
example given: prior context says "fiddle leaf fig," the current photo
looks like a Rhododendron — the wrong answer confidently identifies the
Rhododendron and then reasons using the fiddle-leaf-fig's leaf-drop/
moving-stress/watering history anyway, blending two different plants into
one answer instead of surfacing the conflict.

Fixed at two layers, deliberately not just one:

1. **Frontend (the real fix).** `handleAnalyze()` in `PlantRescue.js` now
   builds a completely different payload for `mode === 'identify'` —
   `{ imageBase64, mode, plantName, userLocale, userCurrency, userRegion }`
   only. Every Rescue/Care field (`plantDescription`, `symptoms`,
   `symptomDuration`, `recentChanges`, `wateringMethod`, `hasDrainage`,
   `priorObservations`, etc.) is simply never sent for an Identify call.
   Before this, switching from the Rescue tab to the Identify tab without
   resetting left all of that in component state, and the OLD payload
   construction sent everything regardless of mode — the backend would
   receive a full Rescue-shaped `supplied` block on an Identify request.
   Not sending the data in the first place beats trusting a prompt rule to
   ignore data it shouldn't have received.
2. **Backend prompt (the backstop).** A new IDENTIFY MODE PROVENANCE
   section in `IDENTIFY_MODE_RULES`: every `why_it_fits` statement must
   answer "what can I actually see in the CURRENT photo that supports
   this?"; prior context may be held in mind but never presented as visual
   evidence; a conflict between the current photo and prior context must
   be surfaced, not blended. Plus a new `outputGuard.prohibit` category
   (`identification_evidence_drawn_from_non_visual_prior_context_instead_
   of_the_current_photo`). Verified by hitting the API directly with
   `priorObservations` describing a different plant's Rescue history
   alongside an unusable photo (bypassing the frontend fix on purpose, to
   prove this layer holds independently) — the model correctly said the
   image lacked enough detail rather than falling back to the prior
   plant's identity. New permanent golden case:
   `identify-does-not-use-prior-plant-history-as-visual-evidence`.

## "My Plants" click-does-nothing + header layout (2026-09-06, same day)

Two small but real UX bugs, both reported directly:

1. **Clicking "My Plants" appeared to do nothing.** It did toggle
   `showCollection` correctly — the bug was that the panel it reveals
   renders far below the entire input form (photo, symptoms, duration,
   changed-recently, details, light/watering/drainage/climate,
   pets/children, submit), and nothing scrolled or moved focus there. From
   the visitor's position at the top of the page, where they just clicked,
   the screen did not visibly change. Fixed the same way `results` already
   was: a `collectionRef` + a `useEffect` calling `revealSection()` when
   `showCollection` becomes `true`.
2. **Empty "My Plants" state was a dead end.** It said "No saved plants
   yet" and stopped there. Per the explicit ask — "offer to add one" — it
   now also shows a CTA button (`pr_add_first_plant`, new i18n key, 13
   languages) that closes the panel and moves focus back to the top of the
   form (a new `formTopRef` on the main input card) via `revealSection()`,
   since there's no plant yet to jump to — the form itself, where a result
   carries its own "Save to My Plants" button, is the closest "add one."
3. **Header layout**: "My Plants" moved to sit directly beneath "Start
   over" (previously side-by-side) — the right-hand button column changed
   from `flex items-center` to `flex flex-col items-end`, and the row's
   own `items-start` became `items-end` so the bottom of "My Plants" (or
   whichever button ends up last in that column) lines up with the bottom
   of "Try an example" on the left. Verified via `getBoundingClientRect()`
   in both states (Start Over hidden vs. shown) — bottoms matched exactly
   in both.

## DO NOT silently reverse

- The three-schema-per-mode shape — no numeric confidence, no `is_saveable`
  prediction, no mandatory 12-month calendar, no unconditional
  repotting/propagation guide, no automatic safe-alternative-plants list.
- `runOutputGuard` (not a regex-only backstop) — invented facts, not
  fixed-vocabulary phrasing, is the failure mode here.
- The single-call-per-mode architecture — do not reintroduce the
  parallel-split unless a schema grows large enough to need it again.
- Follow-up's structured REPORTED/POSSIBILITIES/CHECKS context — never
  flatten a possibility back into a labeled "Diagnosis:" string.
- Companion planting's care-compatibility framing — no room/window/humidity
  invention, no automatic "buy more plants" suggestion.
- `ageOfOwnership` staying removed in favor of `symptomDuration` — these are
  two different facts (how long owned vs. how long the symptom has been
  present) and conflating them was the original bug.
- `wateringFreq` staying removed in favor of `wateringMethod` +
  `wateringFreqText` — a calendar interval alone doesn't establish over- or
  under-watering.
- The `reported` field in `handleSavePlant` only including symptoms in
  Rescue mode.
- `PlantRescue` in `audit/audit_v2-3-2.py`'s `_NO_HISTORY_TOOLS` — the
  observation history is real, it just lives per-plant in `checks[]` now.
- The Identify-mode-only payload in `handleAnalyze()` — do not go back to
  sending the full Rescue/Care field set regardless of mode. This is the
  actual fix for the identification-provenance bug, not a stylistic
  simplification to "clean up."
- The IDENTIFY MODE PROVENANCE prompt section and its outputGuard category
  — the backstop layer for the same bug, needed independently of the
  frontend fix in case a future payload shape reintroduces the leak.
- The `collectionRef`/`formTopRef` `revealSection()` calls on "My Plants"
  open and its empty-state CTA — without them the button silently fails
  to change what a visitor sees, exactly the bug that was reported.
- "My Plants" staying beneath "Start over" (not restored to side-by-side)
  and the header row's `items-end` — that's what keeps it bottom-aligned
  with "Try an example," which was explicitly requested.

## Mode state isolation + Care mode field redesign (2026-09-06, same day)

**Mode state isolation.** Rescue, Care, and Identify are three separate
tasks. Manually clicking a mode tab now runs `handleModeTabClick(newMode)`,
which no-ops if `newMode === mode` (don't wipe an in-progress form just
because the visitor re-clicked the tab they're already on), otherwise calls
the existing `handleReset()` — clearing every mode's form fields, the
generated result, `plantName`, and `activePlantId` — before setting `mode`.
`handleReset()` is the single shared primitive; three call sites now build
on it with different follow-up behavior:
- `handleModeTabClick` — reset, then switch mode. Nothing carried forward.
- `handleShowCareFromIdentify` — reset, then re-apply the current photo and
  seed `careSpecies` from the Identify result's name, then switch to Care.
  This is the one explicit handoff the spec calls out by name.
- `handleCheckAgain` (My Plants) — reset, then restore `plantName` +
  `activePlantId` from the saved plant record, forcing `mode: 'rescue'`.
  Symptoms/watering/etc. from whatever was on screen before are NOT carried
  — only the plant's own identity.

Live-verified in-browser: filled Rescue's name field + a symptom checkbox,
switched to Care — both cleared, Care rendered a clean form. Filled Care's
`careSpecies`, switched to Identify — cleared, no `careSpecies` input even
exists in that mode's DOM. Clicked My Plants → Check again — `plantName`
populated, symptom checkboxes empty, mode forced to Rescue.

**Care mode field redesign**, per the explicit spec: Care's inputs are now
about a healthy plant's normal growing conditions, not symptoms. New state:
`careSpecies` (required unless handed off), `careWhereIsIt`, `careLight`
(6-option, deliberately its own scale — see below), `careHelpWith`. Care's
JSX no longer shares Rescue's symptom checkboxes, duration select, or
recent-changes select; it keeps sharing watering method/frequency,
drainage, climate, and pets/children with Rescue since those are the same
question in both modes. `pr_desc_care` copy updated to the specified
"Tell us about a plant you want to keep healthy..." line, in all 13
languages; 20 new i18n keys added (all 13 languages, cross-checked for
exact key-count parity against actual `t()` call sites — 178/178, zero
missing/extra/duplicate).

Backend: `CARE_MODE_RULES` gained "CARE MODE IDENTIFICATION INPUT" (treat
`careSpecies` — typed or handed off — as visitor-supplied identification
per the general PLANT IDENTIFICATION rule; don't silently re-derive) and
"CARE MODE FOCUS" (give `careHelpWith`'s area more attention without
zeroing out the rest of `core_care`). Three new label maps
(`CARE_LIGHT_LABEL`, `CARE_WHERE_LABEL`, `CARE_HELP_LABEL`) and four new
`buildSupplied()` fields. Live-verified via direct API call
(`careSpecies: "Pothos"`, `careLight: "bright_indirect"`,
`careHelpWith: "repotting"`, etc.): response correctly reflected all four
fields — bathroom-window humidity called out under temperature/humidity,
`repot_when` populated per the requested focus, watering advice referenced
the visitor's own check-the-soil practice by name rather than restating a
generic interval, no numeric confidence, no invented schedule.

**Bug found and fixed while live-testing Identify, unrelated to the above:**
Identify mode would sometimes claim no photo/image was supplied when one
plainly was — reproduced deterministically-enough (originally ~2 of 3
repeated calls with an identical ambiguous test image) via direct API
calls that bypassed the frontend entirely, ruling out a base64/upload
transport bug (confirmed byte-for-byte: the exact base64 the backend
received round-tripped perfectly through a raw, out-of-band SDK call with
the same model). This is the model itself, under heavy anti-fabrication
framing plus a genuinely ambiguous non-photographic test image (a flat
icon/illustration, not a real photo), sometimes producing "no image was
provided" instead of the correct "this doesn't look like a real photo, so
identification isn't reliable." Fixed with a new GENERAL_RULES paragraph —
"IF 'WHAT THE VISITOR SUPPLIED' SAYS A PHOTO WAS PROVIDED, ONE WAS" —
telling the model explicitly that image content is present whenever the
supplied-context line says so, and that an unclear/illustrated/non-plant
image should be described as such rather than denied outright. Added
`response_claims_no_photo_or_image_was_provided_despite_one_being_supplied`
to `router.outputGuard.prohibit` as a backstop. Re-tested 6 more times
post-fix: 5 of 6 correctly identified the test image as an illustration
and asked for a real photo; 1 of 6 still produced the wrong "no image"
framing despite the v2 guard firing FAIL on it (repair ran but didn't
correct the underlying claim) — an accepted non-deterministic residual,
same pattern as Pet Behavior Decoder's waiting-period-ban residual. A real
user almost always uploads an actual photograph, where this specific
"is this even a photo" confusion has no reason to trigger — the adversarial
test case here was a stylized cartoon plant icon, deliberately picked to
stress this exact edge.

## DO NOT silently reverse (Phase 5 additions)

- `handleModeTabClick`'s no-op guard when `newMode === mode` — without it,
  re-clicking the active tab would wipe an in-progress form for no reason.
- Care's `careSpecies`/`careWhereIsIt`/`careLight`/`careHelpWith` staying
  separate state (and separate backend label maps) from Rescue's
  `lightLevel`/`location` — the option sets genuinely differ (Care's light
  scale has 6 buckets vs. Rescue's 3; Care's location has "both/moved
  seasonally" vs. Rescue's "greenhouse") and merging them re-couples two
  fields the redesign deliberately split apart.
- `handleShowCareFromIdentify` seeding `careSpecies` (not `plantName`) —
  `plantName` is now purely an optional nickname per the redesigned Care
  intake; the identified species belongs in `careSpecies`.
- The "IF 'WHAT THE VISITOR SUPPLIED' SAYS A PHOTO WAS PROVIDED, ONE WAS"
  paragraph and its outputGuard category — removing it reopens the
  false-no-image bug documented above.

## Three more fixes found live-testing the above (2026-09-06, same day, third pass)

1. **Care's 400 used Rescue's validation.** The shared non-identify guard
   checked `plantDescription`/`symptoms` — fields Care's redesigned form
   doesn't even collect (no symptom checkboxes; description is optional
   context) — so a complete, correct Care submission carrying only
   `careSpecies` was rejected with `"Provide a photo, description, or
   select symptoms."`, copy that describes a screen the visitor wasn't on.
   Reported directly: *"Care panel will not submit input without [that
   error]. First, there are no symptom inputs because this is not the
   Rescue screen. Second, shouldn't a common name be enough and then the
   LLM supplies the rest of the data?"* — yes, exactly the intended design.
   Fixed by giving `activeMode === 'care'` its own branch: `careSpecies`
   (trimmed) or a photo satisfies it, nothing else required. New golden
   case `care-species-name-only-no-other-fields` verifies a bare
   `{mode: 'care', careSpecies: 'Pothos'}` now returns a full guide instead
   of a 400.
2. **"Try an example" was invisible in dark mode.** Root cause: this
   tool's `headerColor` (`#1e2a3a`) is one of the catalog's four
   *deliberately* dark entries (see the comment in
   `src/utils/headerGradient.js` — this is intentional, not a data-entry
   mistake, and headerColor must NOT be changed to a light pastel to
   "fix" this). The shared "Try an example" pill pattern used across ~120
   tool files hardcodes near-black text (`text-zinc-900`) and a
   `border-black/25` — correct when `headerColor+'80'` is blended with a
   light page background, but blended with a dark one it composites to a
   near-black chip with near-black text and an invisible border. Fixed
   *for this tool only* by flipping text/border with `isDark`
   (`text-zinc-50`/`border-white/25` in dark mode); the background alpha
   stays the literal `+ '80'` so PF-17b's header-pill audit regex
   (`headerColor[^\n]*\+\s*'80'`) still matches — an earlier attempt that
   bumped dark-mode alpha to `'cc'` broke that pattern match and had to be
   reverted. Verified via computed styles against the real dark-mode page
   background (`rgb(24,24,27)`, from the `[data-print-wrapper]` div) —
   this pane's screenshot tool wasn't reliably rendering this session, so
   contrast was confirmed numerically rather than visually. **The other
   five tools sharing a dark `headerColor`** (DriveHome, SafeWalk,
   SpiralStopper, SensoryMinefieldMapper, PronounceItRight) likely have
   the identical latent bug — out of scope here since only Plant Rescue
   was reported, flagged as a separate follow-up.
3. **"My Plants" overshot, and saving didn't move focus at all.** Two
   related reports: *"Clicking 'my plants' overshoots focus"* and
   *"Clicking 'Save to my plants' should bring focus to my list."*
   `handleSavePlant` previously didn't open or focus the collection at
   all — the only visible confirmation a save happened was a count
   incrementing in a header button the visitor wasn't looking at. It now
   calls `setShowCollection(true)` and schedules `revealSection` directly
   (not only via the `showCollection` effect), so focus moves to the list
   whether or not the panel was already open before the save.
   The "overshoots" half was initially mis-diagnosed as "scrolls further
   than needed" and fixed by switching `collectionRef`'s reveal to
   `block: 'nearest'` — **this was wrong and was reverted the same day**
   once the visitor clarified directly, with a screenshot, that they
   wanted "My Plants" flush at the top of the screen: exactly
   `block: 'start'`, `revealSection`'s default. Both `collectionRef`
   reveal call sites now call `revealSection(collectionRef.current)`
   with no options again, same as `resultsRef`. See the DO-NOT-REVERSE
   note below.

## DO NOT silently reverse (third-pass additions)

- Care's own validation branch (`careSpecies?.trim() || imageBase64`) —
  reverting to the shared Rescue-shaped check breaks every Care submission
  that doesn't happen to also fill in `plantDescription` or symptoms.
- `headerColor` staying `#1e2a3a` — this is one of four *deliberately*
  dark catalog entries per `headerGradient.js`; the fix for its clash with
  the "Try an example" pill lives in the button's text/border, not here.
- The "Try an example" background alpha staying the literal `+ '80'`
  (not a conditional expression) — PF-17b's audit regex requires that
  exact literal on the same line as `headerColor`.
- `handleSavePlant` calling `revealSection` directly rather than relying
  solely on the `showCollection` effect.
- `collectionRef`'s reveal calls staying **plain** `revealSection(collectionRef.current)`
  (default `block: 'start'`) — a same-day attempt at `{ block: 'nearest' }`
  was explicitly reverted per direct visitor feedback: "My Plants" is
  supposed to land flush at the top of the screen, not merely scroll into
  view. Do not reintroduce `nearest` here without a new, equally direct
  instruction to do so.

## Fourth pass: Identify image consistency, identity provenance, precision, wording (2026-09-06, same day)

**IDENTIFY IMAGE CONSISTENCY.** The Identify schema was collapsed from four
independent top-level fields (`best_match`, `alternatives`,
`what_would_help_confirm`, `safety_note`) into `current_image_present` +
one `identification_evidence` object
(`current_image_observations`/`best_match`/`confidence`/`distinguishing_visible_features`/`plausible_alternatives`/`unresolved_identification_questions`)
that every section reads from — no section can independently decide
whether a photo exists. `current_image_present` is set by **code** from
`!!imageBase64` immediately after the first model call, never trusted from
the model's own self-report, so that fact literally cannot be wrong.

The false-no-photo-claim check from the third pass (`identifyImageConsistencyViolation`
+ reject-and-regenerate) was **moved to run LAST**, after the v2 guard's
own check-and-repair pass, not right after the first model call. Root
cause of why it needed to move: the guard's repair rewrites the TEXT of a
flagged field without knowing the code's ground truth about
`current_image_present` — a repair aimed at an "invented_fact" violation
can just as easily land on "No image was provided" as fix it, and checking
only the pre-guard generation missed that entirely. Live-verified: the
"regenerating once" log line now fires and visibly replaces a violating
draft with a clean one; 6/6 clean in the final re-test batch. The regex
itself was also broadened — `NO_IMAGE_DENIAL_RE` used bare `\s+` between
the noun and verb ("no image **was** provided"), which missed a real
observed case with an interposed word ("No image **data** was received");
now uses a bounded `.{0,20}?` gap, plus a new alternation for the softer
"without a photo, ..." denial.

**PLANT IDENTITY PROVENANCE.** New `identity_source`
(`visitor_supplied`|`photo_identified`|`unclear`) field added to Rescue's
`plant_identification`, Care's `plant`, and Identify's
`identification_evidence.best_match`. Frontend gained one shared
`identityBadge(identitySource, confidence)` helper (replacing three
near-duplicate inline confidence-badge blocks) that shows **"Identity
supplied by you"** instead of a confidence badge whenever `identity_source`
is `visitor_supplied` — confidence describes the tool's own identification,
not the visitor's. Known gap, not chased further: the schema still requires
`confidence` as a mandatory `high|moderate|low` enum with no "n/a" option,
so the model still fills in *some* value (observed: "high") even when
`identity_source` is `visitor_supplied` and the prompt tells it not to;
harmless because the frontend never renders it in that branch, but the raw
JSON can carry a stray confidence value that means nothing.

**PRACTICAL PRECISION.** New `GENERAL_RULES` paragraph (applies to all 3
modes — Rescue's existing "NO ARBITRARY PRECISION" only covered Rescue,
which is exactly how "four to six hours of direct light" leaked into a
Care response with no rule against it). Bans a numeric threshold whenever
changing it "somewhat" wouldn't change the advice: a depth ("push a
chopstick 5-7cm") becomes an observable condition ("check below the dry
surface layer with a finger or wooden chopstick"), a light-hours figure
becomes a plain description of the light category. `care-pothos-thriving`
and `care-species-name-only-no-other-fields`'s golden references (which
predate this rule and contained exactly this pattern) were corrected to
match.

**Renamed "💧 Care Schedule" → "🌿 Your Care Guide"** (`pr_care_schedule`,
13 languages) — it was never a schedule. The plain-text copy output's
matching `💧` prefix was updated to `🌿` too, for consistency between the
two representations of the same heading.

**Companion Check reworded.** `good_to_group`/`better_kept_apart` (two
buckets; "apart" read as physical separation) replaced with a single
`pairs[]` array carrying a three-way `verdict`
(`good_match`|`separate_care`|`different_needs`) and `why` text that
describes what a shared **routine** gets wrong, never that the plants
can't be near each other. Live-verified with the exact feedback example
(Jade Plant + Pothos) — the model correctly returned `different_needs`
with "these two routines should run independently," matching the
requested framing exactly.

## DO NOT silently reverse (fourth-pass additions)

- `current_image_present` being set by code (`!!imageBase64`), not read
  from the model's own JSON output, for Identify mode.
- The image-consistency check running AFTER the v2 guard block, not
  before it — this is the actual fix for the guard's repair pass being
  able to reintroduce the contradiction.
- The `identityBadge()` helper and `identity_source` staying wired into
  all three modes' identity displays — removing it brings back a
  confidence badge on an identity the tool never independently confirmed.
- The `PRACTICAL PRECISION` paragraph in `GENERAL_RULES` (not only in
  `RESCUE_MODE_RULES`) — Care mode has no numeric-precision guidance of
  its own and will drift back to inventing hour counts and depths without it.
- Companion Check's `pairs[]`/`verdict` shape, and `why` copy framed
  around routines, not proximity — reverting to `good_to_group`/
  `better_kept_apart` reopens the "keep them apart" misreading.
