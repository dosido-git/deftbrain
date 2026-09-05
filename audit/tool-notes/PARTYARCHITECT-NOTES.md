# PartyArchitect — architecture & lock notes (`party-architect-v2`)

Designs the FLOW of a gathering — a pacing strategy, a timed run-of-show, how to help
unfamiliar guests connect, food/drink/music format, budget priorities, and a wind-down.
**Frontend:** `src/tools/PartyArchitect.js`. **Backend:** `backend/routes/party-architect.js`
(1 endpoint, `MODELS.SMART` × 2 parallel calls + 1 `MODELS.FAST` v2 guard check/repair,
`max_tokens` 3000 per generation call). **Golden:** `audit/party-architect-golden-sample.json`.
Verify: `npm run check:golden party-architect`.

## PARTY ARCHITECT — REWRITE INSTRUCTIONS pass (2026-09-05)

Full schema replacement, following a spec supplied by the user. The old prompt cast the
model as a "social psychologist / behavioral scientist / improv director" and the output
followed suit: an "energy curve" prediction (simmer → peak → cool contentedly), a
fabricated 6:00–9:30 PM clock schedule from a visitor who only picked an approximate
4-hour duration, guest-behavior predictions stated as fact ("stranger bridges rarely form
on their own," "the group either becomes one party or stays three separate
conversations"), invented local prices ("the $900 budget is workable," "food typically
consumes half"), and possessions the visitor never confirmed owning ("free" lamps, string
lights, blankets).

**Old schema → new schema (do not resurrect the old keys):**

| Old | New |
| --- | --- |
| `energy_curve` (string, a feelings prediction) | `event_shape` (string, a pacing STRATEGY) |
| `timeline[]` (clock times, no adjust field) | `timeline[]` — RELATIVE offsets only (Arrival/+20 min/Around halfway/Final 45 min), + new `adjust_if` |
| `mixing_strategies[]` (fixed at 2, `why_it_works` = "social psychology") | `helping_people_connect[]` (0-3, `why_it_fits` = practical reason) |
| `conversation_starters[]` (fixed at 4) | `conversation_catalysts[]` (0-3) |
| `food_and_drink_strategy{}` (no allergy field) | `food_and_drink{}` + `dietary_considerations` |
| `music_plan{arrival,peak,wind_down}` | `music{show,arrival,later,wind_down}` — `show` gates the whole section |
| `budget_breakdown{total_estimate,biggest_expense,where_to_save,free_upgrades[]}` (fabricated numbers) | `budget_priorities{approach,protect_spending_on[],keep_secondary[],use_what_you_have[]}` (priorities, no numbers) |
| `disaster_prevention[]` (fixed at 3, predicted-future-fact framing) | `things_to_plan_for[]` (0-4, grounded-only framing) |
| `the_exit{signal,script}` | `wind_down{signals[],script}` — **top-level**, distinct from `music.wind_down` (lowering volume) which lives one level down inside the OTHER half's output |
| `event_read` (flat string) | `event_read{what_matters,design_priority}` |

There was no `outputContractVersion` field anywhere in the codebase — the spec's "Set
outputContractVersion: 2" was interpreted as "apply the real v2 mechanism"
(`router.outputStandard = 'v2'`), not as a literal schema field to invent.

## Architecture

- **Still split into two parallel calls** (parallel-split pattern, disjoint top-level
  keys, merged `{...mechanicsPart, ...arcPart}`). The pre-split single-schema version
  measured ~82s — past the ~60s point where Safari abandons the fetch. Arc call owns
  `event_read`/`event_shape`/`timeline`/`wind_down`; mechanics call owns
  `helping_people_connect`/`conversation_catalysts`/`food_and_drink`/`music`/
  `budget_priorities`/`things_to_plan_for`. Both calls carry the FULL shared
  `SHARED_PROMPT` design/grounding block (input tokens are cheap; dropping it from
  either half is how a discipline silently disappears from that half — see
  `audit/LATENCY-SWEEP.md`'s length-discipline gotcha).
- **First v2 upgrade for this tool**: `router.outputStandard = 'v2'` +
  `router.outputGuard = { prohibit: [...], require: [...] }` + `runOutputGuard()` on the
  MERGED result (one guard call after both parallel generations complete, not one per
  half) — replaces the old bare `toArray()`-coerce with no guard at all. Measured total
  latency with the guard included: ~40-52s across several live test calls, still under
  the 60s ceiling.
- **No exact start time in this form.** `duration` is a bucket (2h/3h/4h/all day), never
  a clock time — so the timeline ALWAYS uses relative offsets (Arrival, +20 min, Around
  halfway, Final 45 min, Final 15 min). The prompt's "if an exact start time IS supplied"
  branch is future-proofing for a field that does not exist yet, not active behavior
  today.

## Real bugs caught during live testing, same day

1. **Dietary safety over-assurance.** First live test's guard flagged
   `food_and_drink.dietary_considerations` as `casual_allergy_safety_assurance` — the
   draft said a labeling/serving setup "will keep the tree-nut-allergic guests safe,"
   an outcome this tool cannot actually guarantee. Fixed with a sharper prompt BAD/GOOD
   pair banning "will keep...safe"/"will be safe" framing, in favor of the procedural
   instruction alone ("identify which dishes contain or may contain X, keep those
   separate, label clearly"). Re-tested clean on 2 further live calls.
2. **Guard repair can blank a field to `""` with no restoration net.** `runOutputGuard`'s
   own safety net (`requiredNonEmpty`) only restores a FIXED, known-in-advance field path
   if repair hollows it out — it cannot help here, since which array INDEX gets flagged
   is different every call (`conversation_catalysts[0]`, `budget_priorities.
   protect_spending_on[1]`, etc. — never the same index twice). Observed live: a first
   test run came back with `"conversation_catalysts": ["", ""]` — the guard flagged both
   items, repair produced nothing usable for them, and they landed in the response as
   silent blank bullets. Fixed with a new `pruneEmpties()` pass, called after the guard,
   that drops a blanked plain-string array item outright and drops an object-array item
   whose primary field (`.how` / `.plan` / `.action`+`.host_job`) came back blank —
   same shape as one-percenter's `validateResult` prune pass, just applied post-guard
   instead of post-regex. **DO NOT remove `pruneEmpties`** — verified with a targeted
   leak-scanning test script across 3 live calls that it stays silent when nothing needs
   pruning and would have caught the exact failure mode above.

## Frontend rework

- **"Who's coming?"** replaces "Guest mix" as the label (JS state var stays `whoIsComing`
  → sent to the backend as `whoIsComing`, was `guestMix`/`mix` — this field's meaning
  changed enough this session that carrying the old name forward would have been
  confusing, unlike a same-meaning field getting a cosmetic-only label change).
  Broadened helper text on both this field and Constraints, rendered as its own line
  below the label (not the old inline "(key for mixing strategies)" parenthetical).
- **Recent Plans rework**: `party-plans` (NEW store — `{id, createdAt, preview, inputs,
  plan}`, capped at 15, PF-25 exception documented inline) replaces relying on the old
  `party-history` (preview-only, no stored plan — "View" could never have worked against
  it). `party-history` stays read-only/legacy below the new list, same migration
  precedent as Small Change Big Difference's Recent Small Changes. **"View →"** calls
  `viewPlan()` — reopens the STORED plan directly, never regenerates. **"Duplicate &
  Edit →"** calls `duplicateAndEdit()` — repopulates every input field from the stored
  plan's `inputs` and clears `results`, landing the visitor back on the form ready to
  change one thing and resubmit. Both live-verified end-to-end through the actual UI:
  generated → confirmed `localStorage` held the full record → Start Over → View
  reopened the exact stored result with no new network call → Duplicate & Edit
  repopulated all 6 text inputs correctly.
- Dietary considerations rendered with the existing `c.warningTxt` token (no new color
  introduced) for a modest safety-relevant emphasis, per the "no gratuitous color
  changes" constraint from the redesign-restraint precedent.
- `event_shape` and `wind_down` keep the tool's pre-existing amber/warning card styling
  (same visual weight as the old `energy_curve`/`the_exit` sections) rather than
  introducing a new accent color for the "no longer a prediction" framing change —
  visual restraint, not a redesign.

## Localization

Fully localized, 13 languages, `pa_` prefix unchanged (no tool rename, just a schema/copy
rewrite — naming-consistency rule doesn't apply). 19 dead keys removed (old section
names), 4 keys' VALUES changed (`pa_tagline`, `pa_food_drink`, `pa_music`,
`pa_copy_timeline`), 27 new keys added, verified with an automated key-set-equality check
(`en` vs all 12 other languages) before and after. Spanish spot-checked live in the
browser (tagline, "¿Quién viene?", helper text, Recent Plans row with translated vibe
label, "Ver →"/"Duplicar y editar →") — all rendered correctly.

## GENERAL REASONING & GROUNDING RULES pass (2026-09-05, second same-day pass)

`SHARED_PROMPT` was **replaced whole**, not appended to — a 25-section grounding spec
supplied verbatim by the user (three information types — ESTABLISHED/DESIGN
CHOICE/UNKNOWN; recommendations-may-add-things-facts-may-not; don't write the future as
fact; observable event states not predicted social states; no social psychology as
decoration; no invented causation; no invented "typical" event rituals from an occasion
label; no invented resources; exact numerical relationships; the time/budget/food/music/
wind-down rules; an internal provenance tag pass; a final adversarial word-scan). The
output schema, the arc/mechanics split, and each half's own schema-mechanics (item
counts, field names) are **unchanged** — `buildArcPrompt`/`buildMechanicsPrompt` were
trimmed to schema mechanics only (item counts, JSON field meanings, the
`music.wind_down`-vs-top-level-`wind_down` disambiguation) since the general reasoning
they used to carry now lives once in `SHARED_PROMPT`, referenced by section number.

Live-tested against both golden scenarios post-rewrite: clean on dietary handling (never
diagnosing "gluten-free" into celiac, never a safety assurance), clean on budget
(priorities only, no fabricated totals), clean on relative timeline, no invented guest
facts. One soft miss observed on an early run — "the environment itself will shift the
energy... without the host needing to do anything to prompt it" (a `will`-stated
emotional/energy prediction, exactly what §3/§6/§24 exist to prevent) — the v2 guard
did not flag it. Did not recur on a second full run. Documented rather than chased with
a bespoke fix: this route has no regex backstop layer (unlike one-percenter's
`validateResult`), so a single non-recurring guard miss is accepted risk rather than
grounds for a new mechanism — re-open this note if the same phrasing pattern shows up
again.

## Keep-alive heartbeat (2026-09-05, same day)

**Live bug report**: "NetworkError when attempting to fetch resource" at 43s on the
first attempt, succeeded on retry. This route is non-streaming (`res.json()` at the very
end) and this tool already has documented history of tripping a browser/proxy
idle-connection timeout at this shape — the original pre-split version measured ~82s,
past the point Safari abandons the fetch. Local testing measured 35-52s end to end
across several calls even on a warm dev backend; production, under load or network
variance, plausibly runs longer. 43s matches no timeout constant in this file, which
points to an idle-socket proxy/browser timeout rather than a code crash.

**Fix**: `res.setHeader('Content-Type', 'application/json'); res.flushHeaders();` then
`setInterval(() => res.write(' '), 10000)` right before the two parallel generation
calls start, cleared on both the success and error paths. `JSON.parse`/
`response.json()` ignore leading whitespace, so the SUCCESS path needed zero frontend
change — verified via a real browser test (React DevTools console clean, full render).

**The catch**: writing any byte commits the HTTP status to 200. An error discovered
*after* the heartbeat has started (Anthropic failure, guard exception, anything) can no
longer be reported via a 4xx/5xx — it can only go in the JSON body, as a bare
`{"error": "..."}`. Matching change in `src/hooks/useClaudeAPI.js`'s `callToolEndpoint`:
after `await response.json()`, checks `Object.keys(json).length === 1 &&
typeof json.error === 'string'` and throws if so — no normal tool result is ever shaped
like that single-key object, so this only ever fires on a genuine error, and it's
backward compatible with every other tool (none of them emit leading whitespace, so
none of them can accidentally match this shape). Verified with a temporary
`PA_TEST_FORCE_ERROR` env-gated throw placed right after the heartbeat starts, hit with
Node's real `fetch()` (not the raw `http` module, to match browser `Response.json()`
semantics) — confirmed `response.ok === true`, `status === 200`, body
`{"error":"..."}"}`, and the new check in `callToolEndpoint` correctly throws instead of
returning it as a result. Reverted the test hook before shipping (`grep -c
PA_TEST_FORCE_ERROR` → 0).

**DO NOT remove the heartbeat and the `useClaudeAPI.js` check separately** — they're one
fix in two files. Removing the heartbeat alone reopens the timeout bug; removing the
`useClaudeAPI.js` check while keeping the heartbeat means any error occurring after
generation starts renders as a blank/broken result instead of a clean error message.

## DO NOT silently reverse

- The new schema shape (see table above) — especially `music.wind_down` vs top-level
  `wind_down` being two DIFFERENT fields.
- Relative-time-only timeline (no clock times) — this form has no start-time input.
- `pruneEmpties()` after the v2 guard.
- The dietary "never a safety assurance, always the procedural step" framing.
- `router.outputStandard = 'v2'` + `runOutputGuard` (this tool did NOT have a guard
  before this pass — do not strip it back to bare `toArray()`).
- `party-plans` as a genuine stored-plan history, not a preview-only log.
- `SHARED_PROMPT`'s 25-section grounding spec — it replaced the first pass's
  design/grounding block; don't restore the old prose alongside it.
- The keep-alive heartbeat + the matching `useClaudeAPI.js` bare-`{error}` check —
  see above, these two only work together.
