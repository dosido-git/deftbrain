# Sensory Scout (was Sensory Minefield Mapper) — architecture & lock notes (`sensoryminefieldmapper-v3.1`)

**Known-good:** tag `sensoryminefieldmapper-v3.1` · golden `audit/sensory-minefield-mapper-golden-sample.json`
(re-captured 2026-09-09 after the v3.1 output-correction + Route-mode pass)
**Verify:** `npm run check:golden sensory-minefield-mapper` (backend up: `npm run dev:backend`)

## What it is

Helps someone prepare for the sensory demands of a place or route — not by
predicting conditions, but by turning what the visitor actually knows, what
matters to them, and general possibilities for that TYPE of setting into a
practical plan. **Frontend:** `src/tools/SensoryScout.js` (`smm_*` keys,
fully localized). **Backend:** `backend/routes/sensory-minefield-mapper.js`
— 7 endpoints, `MODELS.SMART` (`ASK_SCRIPT` on `MODELS.FAST`), all on
`router.outputStandard = 'v2'` with a shared `router.outputGuard`.

## V3 rewrite (2026-09-09, full owner-supplied spec)

The v2 tool was pitched as an environmental forecasting service: it
predicted crowd density, noise, lighting, smells, and temperature by time of
day (`intensity_rating`: low/moderate/high/intense), invented a whole
building's layout (`layout_intel`: quietest spots, exits, restrooms, fresh
air), named a "better time to go" and a crowd-comparison percentage from
nothing but the place type, called itself a "live rescan" when it cannot
sense anything, and generated nearby "alternative places" by name with no
search capability behind it. See git history for the full v2 prompts.

**Rename**: display name only. `SensoryMinefieldMapper` → `SensoryScout` in
`tools.js`/component file/`TOOL_IDS`/`TOOL_ALIASES`/og-slug maps (per
`audit/RENAMES.md` convention — old id kept as a single-hop 301 in
`LEGACY_REDIRECTS`). **Backend route filename, all 6 pre-existing endpoint
paths, and the i18n prefix (`smm_`) deliberately kept the old name** — same
treatment as every other rename this repo has done since the ArgueBetter/
SubscriptionTamer precedent.

**Architecture**: rebuilt around a shared `CORE_SYSTEM` epistemic contract
(composed via `section()`, same pattern as Read the Room's `CORE_SYSTEM`)
covering the evidence model (KNOWN / REASONABLE POSSIBILITY / UNKNOWN /
VISITOR PREFERENCE), the "no fake environmental forecast" rule, layout
invention ban, and voice — instead of v2's six independently-written prompts
with no shared discipline at all.

**Endpoints**:
- `/sensory-minefield-mapper` (main, "Prepare for a Place") — new schema:
  `summary`, `what_you_know`, `worth_preparing_for[]` (each item tagged
  `USER_SUPPLIED|GENERAL_POSSIBILITY|VERIFIED`), `before_you_go`,
  `while_youre_there`, `things_you_could_ask[]`, `backup_plan`,
  `unknowns_that_matter`. No `intensity_rating`, no `layout_intel`, no
  `best_time`.
- `/route` — simplified from a 2-5 stop "cumulative energy" planner (fake
  per-stop intensity scores driving a "cut point") to a single
  start/destination pair, matching Safe Walk's grounding standard. Schema:
  `route_summary`, `stops[]` (each with its own `what_you_know` /
  `worth_preparing_for`), `before_you_leave`, `backup_plan`,
  `unknowns_that_matter`.
- `/rescan` — renamed in spirit to **Conditions Changed** (frontend copy;
  endpoint path unchanged). Checkbox "what changed" input, not a text
  description of current conditions — the visitor reports, the model adapts.
  No more `stay_or_go`/`adjusted_intensity` enums implying the tool can judge
  severity from a two-line report.
- `/comfort-kit` — same shape, prompt now forbids claiming an item
  "regulates the nervous system" or "prevents overwhelm" unless the visitor
  said so themselves.
- `/alternatives` — reframed from generating named "alternative places" to
  describing qualities to look for (`look_for`, `other_options`, `note`).
  **Real bug found and fixed during this pass** (below).
- `/ask-script` (**new**) — "Help me ask for something." One free-text need
  in, one `{situation, script}` out. Backs the result screen's third action
  button; not in the original v2 tool at all.
- `/companion-summary` — **prompt left untouched, not addressed by the
  supplied spec**, but no longer called from the frontend: neither the
  landing screen nor the result-screen mock in the spec included a "share
  with a companion" button, so the new UI simply doesn't surface it. Route
  still exists and still works if called directly; this was a deliberate
  scope decision, not an oversight — revisit if the feature should come
  back in some form.

## V3.1 output-correction + Route-mode pass (2026-09-09, owner review of V3)

The owner reviewed the V3 rewrite's actual output against the hospital
example and found 10 places where general place-type knowledge or inferred
intent leaked into the response as though it were established fact, plus a
separate approval-blocking issue in the Route mode input/output design.

**The 10 output corrections**, each backed by a new `CORE_SYSTEM` section and
(for 7 of them) a new `OUTPUT_GUARD.prohibit` entry, so every endpoint gets
them since they all compose through `section()`:

1. **No compounding a possibility into an imagined environment.** "Outpatient
   waiting areas sometimes use overhead fluorescent or bright LED lighting
   with little natural light" adds a second, unsupported claim ("little
   natural light") on top of a supportable one. New rule: mention only the
   minimum plausible condition needed to be useful. "Hospital waiting areas
   may have bright overhead lighting" — full stop.
2. **A place-type possibility must not read as a fact about this visit.**
   "Hospital environments can carry a mix of cleaning products..." states it
   as characteristic of the setting; "Some hospital environments have
   noticeable cleaning-product smells. If smells are one of your concerns...
   " keeps it conditional on the visitor's own selection.
3. **No unsupported physiological/mechanistic claims.** "Mouth breathing...
   can reduce what reaches you through the nose" invents a mechanism.
   Replaced with practical, mechanism-free suggestions.
4. **A past visit is evidence, not tomorrow's forecast.** "Plan enough to
   occupy two or more hours comfortably" detaches the visitor's own
   two-hour figure from its source and reissues it as today's expected
   duration. Every restatement must stay conditional: "because your last
   visit involved about a two-hour wait, you may want to bring enough to
   occupy yourself if today's wait is similarly long."
5. **Preserve a supplied constraint exactly — never strengthen it.** "I
   cannot leave and come back — if my name is called and I'm not there I go
   to the end of the line" was rewritten as "you will be in the same space
   for that entire period with no option to step out" — a materially
   broader claim (no bathroom, no nearby hallway) the visitor never made.
   New **PRESERVE CONSTRAINTS EXACTLY** section, and it must not be
   contradicted by the response's own later "ask staff what's actually
   permitted" step.
6. **No invented clock times.** "Pack your waiting kit the night before so
   you are not rushing at 8:00" invents a specific time nothing supplied.
7. **No generic reassurance that doesn't aid the plan.** "You don't need to
   predict all of these correctly to arrive with a useful plan" was cut
   from the end of `unknowns_that_matter` — new **NO GENERIC REASSURANCE**
   section requires ending a list of unknowns with the actual unknowns.
8. **A sensory factor needs a real basis to appear at all.** New 4-part
   test in **SENSORY FACTORS**: the visitor selected it, described it as a
   concern, it follows from a supplied constraint, or it's necessary to
   make a selected concern actionable. Place type alone no longer justifies
   generating a standard checklist of every conceivable factor.
9. **A 5-way evidence model, not 4.** **EVIDENCE MODEL** now separates
   KNOWN / PAST EXPERIENCE / POSSIBILITY / UNKNOWN / PREPARATION (PAST
   EXPERIENCE used to be folded into KNOWN, which is exactly how past-visit
   evidence kept getting silently promoted into today's condition).
10. **New closing north star.** "THE VISITOR KNOWS WHAT BOTHERS THEM..."
    replaced with **THE VISITOR IS THE SENSOR. Sensory Scout prepares the
    visitor for possibilities. It does not simulate having inspected the
    place.** — the same core rule the V3 spec originally scoped to
    Conditions Changed only, now the tool's overall closing instruction.

**Route mode, separately approval-blocking:** two addresses alone give the
model almost nothing it can responsibly say about conditions along a route.
Fixes:

- **"How are you traveling?" is now required**, not optional free text — a
  5-option button grid (Walking/Driving/Public transit/Bicycle/Other,
  `TRAVEL_MODES` in the frontend, `TRAVEL_MODE_LABELS` fixed-English map on
  the backend, same pattern as ScamRadar's `INTERACTION_LABELS`). Validated
  both client-side (`canRouteRef`, `planRoute()`'s early return) and
  server-side (400 if the code isn't one of the five). Walking vs. driving
  vs. transit vs. cycling genuinely changes what's worth preparing for, and
  leaving it optional meant the model had to guess.
- **New ROUTE MODE RULES section** in `ROUTE_SYSTEM`: start/destination are
  context, not evidence; explicitly bans inventing a route, streets, travel
  time, traffic, transit conditions, construction, sidewalk conditions,
  parking, station conditions, accessibility, or "safer/quieter"
  alternatives; possibilities must be labeled and tied to the stated travel
  mode. Closing line: **THE VISITOR IS THE SENSOR. THE ROUTE IS CONTEXT,
  NOT EVIDENCE.**
- **Renamed the submit button** "Plan Route" → "Help Me Prepare" (matching
  the main form's button) — Sensory Scout has no mapping/routing
  connection and must not imply it selected or planned anything.
  Deliberately did NOT rename the panel heading (`smm_route_title`, "Plan a
  Route") or the pre-submit error copy beyond `smm_err_route` — the owner
  scoped this to the button in the supplied mock; the heading wasn't asked
  for.
- **Fixed a real copy bug**: the "what do you already know" textarea on the
  Route screen used `smm_known_label` ("What do you already know about the
  **place**?") — reused verbatim from the main "Prepare for a Place" form.
  New, separate key `smm_route_known_label` ("...about the **route**?").
  `smm_known_label` is now used only by the main form.
- i18n: `smm_plan_route_btn` and `smm_planning` retexted to match
  `smm_help_prepare`/`smm_scouting` in all 13 languages (reused those
  keys' existing translations rather than fresh-translating); added
  `smm_route_known_label`, `smm_err_route_travel_mode`, and 5
  `smm_travel_*` labels (13 languages each); removed the now-unused
  `smm_route_traveling_ph`. 134 keys per language, verified identical
  across all 13.

## Real bug found and fixed live during v3.1 verification (2026-09-09)

Verifying the v3.1 prompt changes against the live backend, a route-mode
call returned `unknowns_that_matter: ["", "", ""]` — three empty strings.
Same failure class independently found on ScamRadar the same day; fixed the
same way in both files.

**Root cause, in two parts:**

1. **`collectProseFields()` only walks strings over 15 characters**, so an
   empty string in the raw model output was never included in what the
   output guard's checker sees — the guard literally cannot flag or repair
   a violation it never receives. Fully-empty bullets can only be caught
   structurally, in code, not by an LLM check-and-repair pass.
2. **`runOutputGuard(draft, opts)` mutates `draft` in place** via its repair
   step. An early fix ran `stripEmptyItems(parsed)` *before* the guard call
   — which caught blanks already in the raw output, but not ones the
   repair step introduced afterward. Confirmed live: a `worth_preparing_for`
   entry came back with a populated `factor` and `prepare[]` sitting next
   to a blank `what_might_matter` — the checker had flagged something in
   that field and the repair pass, instructed to "cut the claim... an empty
   box is not one," produced an empty string anyway.

**Fix, both parts required:**

- Added `stripEmptyItems()` (recursively strips blank strings from arrays,
  and drops an array item that's an object unless **every** one of its own
  string fields is non-blank — not just "at least one non-blank," which
  missed the half-populated-object case above).
- Moved the call to run **after** `runOutputGuard`, not before, in all 6
  active endpoints (main, route, rescan, comfort-kit, alternatives,
  ask-script; `companion-summary` untouched, per its existing "not
  addressed this pass" status).

Verified with 8 consecutive live route-mode calls post-fix, 0 empty items
across all of them (2 failed pre-fix during this same verification pass,
in the two distinct ways described above).

## Real bug found and fixed live (2026-09-09)

**`/alternatives` returned prose instead of JSON, 100% of the time, across
9 consecutive live attempts** (3 top-level calls × 3 internal retries each,
all identical). Root cause, confirmed via a standalone debug script that
captured the raw model text: the model was pattern-matching the short user
message (`PLACE: X\nCONCERNS: Y`) against `CORE_SYSTEM`'s much more detailed
"help prepare for a place" framing and generating a full factor-by-factor
preparation plan in prose — the mode-specific "return only this JSON" tail
instruction was present but effectively out-competed by the dominant shared
context. This is NOT the standard "add `Return ONLY valid JSON`" fix
(diff-audit S7.6) — that phrase was already there and still failed.

Fixed by making the disambiguation explicit rather than implicit:
1. Added an up-front line to `ALTERNATIVES_SYSTEM`: "This is a DIFFERENT
   task from preparing for a place. Do NOT produce a preparation plan... —
   that is a different endpoint's job."
2. Reworded the user-supplied message itself to open with `ALTERNATIVES
   REQUEST — this is not a request to prepare for the place below...`
   instead of a bare `PLACE: / CONCERNS:` pair that looked identical to the
   main endpoint's input shape.
3. Framed the model explicitly as "a JSON API endpoint. The caller is
   software, not the visitor directly."

All three changes were needed together — reverted individually during
debugging, only the combination reliably produced JSON on repeat live
calls. If a future edit touches this endpoint, re-verify with several
consecutive live calls, not one — this failure mode was 100% reproducible
but easy to miss on a single lucky pass.

(One more fix during the same pass: an early version of the
disambiguation text used the literal string `JSON.parse()` inside the
prompt, which `diff-audit.py`'s S7.1/S7.4 rules matched as if it were real
code calling `JSON.parse` outside `cleanJsonResponse` — reworded to
"machine-parsed as JSON" to avoid the false positive without losing the
instruction.)

## Frontend bug fixed before first commit

**Doubled required/optional markers.** v2's i18n strings baked the marker
directly into the label text (`"Where are you going? *"`,
`"Anything specific? (optional)"`) — the v2 notes even warned "do NOT add a
`c.required` span on top; that produced a double asterisk." This rewrite
went the other way: adopted the codebase-wide PF-15 convention (separate
`<span className={c.required}>*</span>`, `({t('smm_optional')})`) for
consistency with every other tool, and stripped the baked-in markers from
all 13 languages instead. **Do not reintroduce a baked-in `*` or
`(optional)` inside an `smm_*` label string** — the marker is now always
the separate span/parenthetical, added at render time.

**Tagline double-icon.** The header renders `tool?.icon` in its own span
before the title, then a tagline paragraph below it. The new catalog
tagline (`🗺️ Prepare for the sensory parts of going somewhere.`) keeps its
leading emoji per the `toolTagline()` convention (right for anywhere it
renders alone, e.g. a dashboard card) — but the in-page tagline line must
use the i18n key (`t('smm_tagline')`, emoji-free) rather than `tool?.tagline`
directly, or the map icon prints twice in quick succession. Same underlying
issue `src/utils/toolTagline.js` documents, just two lines apart instead of
one.

## Live verification (2026-09-09)

Every endpoint tested live: EN main (hospital outpatient scenario — the
`knownInfo` in the owner's own worked example: 8:30 arrival for a 9:00
appointment, cannot leave without losing place, ~2hr wait last time), DE
main (with a literal quoted phrase in the input, to confirm NO_QUOTE_RULE
holds under real conditions), route, rescan (Conditions Changed, both
checkboxes), comfort-kit, alternatives (post-fix, 3 consecutive clean
runs), ask-script. `runOutputGuard` caught and repaired real violations on
most calls (invented layout features, unsupported predictions, an invented
venue accommodation) — expected and correct; every response shown above is
the post-repair version. Full result screen browser-verified against the
owner's hospital example: matches the given output mock's section order
(Your Plan → What You Already Know → What May Be Worth Preparing For →
Before You Go → While You're There → What You Could Ask → Plan B → What We
Don't Know) and the three action buttons (Conditions Changed / Comfort Kit /
Help Me Ask). Conditions Changed panel verified end-to-end including the
4 fixed "Quick Check" questions (static, not model-generated — see
`CHANGE_OPTIONS`/`smm_check_*` in the frontend).

## DO NOT silently reverse

1. **No numeric/categorical intensity score anywhere** — no
   `intensity_rating`, no `adjusted_intensity`, no `overall_difficulty`.
   `worth_preparing_for[].basis` (`USER_SUPPLIED|GENERAL_POSSIBILITY|VERIFIED`)
   is the only classification, and it's an evidence tag, not a severity
   score.
2. **No `layout_intel`** — no invented quietest spots, exits, restrooms, or
   fresh-air spots. Conditional navigation only ("if you have a choice of
   seats...").
3. **No `best_time`/"better time to go" without evidence** — only from the
   visitor's own experience or verified venue info.
4. **Route mode stays a single start/destination pair**, not a revived
   multi-stop "cumulative energy" planner — that mechanic was entirely
   fabricated (the model was never actually measuring anything).
5. **The `/alternatives` disambiguation text** (both the up-front "this is a
   different task" line and the reworded user-supplied message prefix) —
   removing either reopens the prose-instead-of-JSON failure documented
   above.
6. **Required/optional markers are separate spans, never baked into the
   i18n string** — the opposite of v2's convention, deliberately.
7. **`smm_tagline` (i18n key) for the in-page tagline, never `tool?.tagline`
   directly** — the catalog field keeps its emoji; using it here doubles
   the icon.
8. **Persisted keys**: `sensoryminefieldmapper-result` → `-result-v3` (schema
   completely different); `smm-history` → `smm-history-v2` (rating shape
   changed from a single 1-5 star to per-factor lower/about/higher +
   free text). `smm-profiles` and `sensoryminefieldmapper-history`
   (recency list) keep their v1/v2 shape and key — unaffected by this
   rewrite. Concern keys (`noise`, `crowds`, `lighting`, `smells`,
   `temperature`, `visual_clutter`, `parking`) are unchanged despite two
   label rewordings ("Visual activity / clutter", "Arrival / Parking") —
   existing saved profiles keep working with no migration.
9. **The 5-way EVIDENCE MODEL** (KNOWN / PAST EXPERIENCE / POSSIBILITY /
   UNKNOWN / PREPARATION) — do not collapse PAST EXPERIENCE back into
   KNOWN; that collapse is exactly how a past visit's duration silently
   became today's forecast before v3.1.
10. **PRESERVE CONSTRAINTS EXACTLY, TIE ADVICE TO CONSEQUENTIAL ACTIONS, NO
    GENERIC REASSURANCE, DO NOT INVENT A TIME NOT SUPPLIED sections** and
    their outputGuard entries — each is a targeted fix for a specific
    overreach the owner caught in real output; removing the prompt text
    without removing the matching guard entry just makes the guard
    silently repair what the prompt should have prevented (slower, same
    end result the visitor sees, so no reason to run that way).
11. **Route mode's required travel-mode field** (`TRAVEL_MODES` on the
    frontend, `TRAVEL_MODE_LABELS` fixed-English map + 400 validation on
    the backend) — walking/driving/transit/cycling produce different
    preparation advice; don't make this optional again or revert it to
    free text.
12. **`smm_route_known_label` for the Route form's "what do you know"
    label — never `smm_known_label`**, which belongs to the main "Prepare
    for a Place" form and says "the place," not "the route."
13. **`stripEmptyItems()` runs AFTER `runOutputGuard`, not before** — the
    guard mutates its argument in place, and a pre-guard clean only catches
    blanks in the raw model output, not ones the repair step introduces.
    Also: the array-of-objects filter drops an item unless **every** string
    field is non-blank, not "at least one" — both orderings were tried and
    both failed live during this exact session (see the bug writeup
    above).
