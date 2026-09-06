# PEP — Personal Energy Planner — architecture & lock notes (`pep-focused-v1`)

One product loop: report capacity, get a suggestion, try it, report what happened,
PEP uses that evidence next time. **Frontend:** `src/tools/PEP.js` (no tabs — one
form, plus My Menu / What I've Tried panels; localStorage keys `pep-energy`,
`pep-my-menu`, `pep-log`). **Backend:** `backend/routes/pep.js` (`MODELS.SMART`,
3-action dispatch on one route, `router.outputStandard='v2'` +
`router.outputGuard={checks:['validateResult']}`). **Golden:**
`audit/pep-golden-sample.json` (3 cases). Verify: `npm run check:golden pep`.

## FOCUSED REBUILD (2026-09-05) — installed from an owner-supplied zip

Followed `audit/REWRITE-INSTALL-KIT.md` end to end. The supplied zip
(`PEP_focused_rebuild.zip`: `backend/routes/pep.js`, `src/tools/PEP.js`, a
README) reduces PEP from the same-day FULL V2 REWRITE's five modes (Right Now /
Prioritize / Week / Patterns / Adapt, 17 actions) down to 3 actions: `generate`
(Right Now menu — top pick + up to 2 alternatives), `just-do-this` (single
suggestion, no menu), `reflect` (log what happened). **Prioritize, Week,
Patterns, Adapt, the Shared menu, Energy Match, Build a Plan sequencing, and
scheduled check-ins are GONE, not renamed or hidden** — this was a deliberate
scope decision, not an oversight; do not "complete" the tool by adding them back.

### What the supplied code got right

The prompt (`SYSTEM` + per-action prompts) already incorporated the same-day
"RIGHT NOW FINAL CORRECTIONS" pass almost verbatim — no invented clock times,
history as evidence not biography, "explain fit, not internal effect." The
epistemic model (energy as self-report, not measurement) and the schema shapes
were sound. This was a genuinely good draft, not a rewrite that needed
re-deriving from scratch.

### What the install had to fix (a supplied rewrite is a draft, not a patch)

1. **Missing `NO_QUOTE_RULE`.** Every other v2 route in this codebase carries
   it; without it, a quoted phrase in a non-English reply breaks the JSON
   parse — this exact bug has hard-downed other tools in German before.
   Restored.
2. **`router.outputStandard='v2'` with no check at all.** The supplied route
   declared v2 but called nothing to enforce it — `output-standard-audit.js`
   treats that as "v2 would be an instruction nothing verifies" and fails
   outright. Added `router.outputGuard` + a `validateResult()` regex-walk
   (same pattern as the prior PEP rewrite and `one-percenter.js`), carrying
   forward the categories still relevant to `generate`/`just-do-this`/`reflect`
   (burnout terminology, battery/energy-cost arithmetic, nervous-system/deep-
   rest claims, forced encouragement, restorative-vs-numbing binary, invented-
   causal-mechanism/ordinal-as-quantity error, generic medical instruction)
   plus the three added in the same-day RIGHT NOW FINAL CORRECTIONS pass
   (unsupported effort absolutes, internal-effect claims, saved-menu
   overselling). Dropped the introvert/extrovert stereotype category — it
   targeted Week/Forecast, which no longer exists here.
3. **A stray `router.outputContractVersion = 2`** matched no mechanism
   anywhere in this codebase (confirmed via grep) — dropped.
4. **Zero i18n.** The supplied `src/tools/PEP.js` had every user-facing string
   hardcoded in English (the README said so explicitly: "if the surrounding
   i18n pass requires full locale coverage immediately, add these strings
   before deployment"). PEP is in Gate 5's `LOCALIZED_TOOLS` allowlist — full
   localization was required, not optional. Wrapped every string in `t()`.
   **Reused, not re-translated:** `TIME_META`/`MOOD_META`/`ENV_META` (18 keys ×
   13 languages) survive unchanged from the prior rewrite — the supplied
   component's hardcoded time/mood/location option values matched them
   exactly. **New:** 24 keys × 13 languages. **Net i18n:** 254 → 72 keys (the
   removed-mode keys are genuinely dead now, not orphaned-but-reachable).
5. **A hardcoded `text-emerald-600` "On menu" badge** outside the `c` object —
   moved into `c.savedBadge` (dark-mode aware).
6. **PF-2/S0/S1.1/S1.5/S2.1/S2.3/S5.5 structural conventions** (diff-audit
   caught 22 findings on the first install pass, all mechanical): `c` block
   reordered before all `useState` (which must precede all
   `usePersistentState`); renamed `result`/`setResult` → `results`/`setResults`
   (the catalog-wide convention this repo's checks assume); added a named
   `reset()` function wired to Start Over; canonical `c` key set (`textMuted`
   not `muted`, `textSecondary` not `secondary`, `btnPrimary`/`btnSecondary`
   not `primary`/`secondaryBtn`) plus the `c.textMuteded = c.textMuted` /
   `c.label = c.labelText` alias lines and `linkStyle`, all per
   `CONVENTIONS.md` PF-2; canonical Try Example pill placed directly under the
   tagline; `tool?.icon` given a second occurrence (submit-button spinner) and
   `me-2` (was `me-1`) on the header icon span; a global Cmd/Ctrl+Enter
   keydown listener (ref-based, guards only on SELECT); a `preview` field
   added to logged entries for the history list; restored the pre-result
   (Spiral Stopper) and post-result (Before the Crash / Brain State Deejay)
   cross-tool refs, which the supplied file dropped along with everything
   else. A `PF-25` exception comment was added for the 12-entry history cap
   (need enough attempts to notice a pattern, not just echo the latest one).
7. **`withLanguage()` sharing anti-pattern.** The supplied backend factored
   `withLanguage(SYSTEM, userLanguage) + withLocaleContext(...)` into a shared
   `localeSystem()` helper called from both action branches — the same
   previously-documented S7.4 gotcha (`[[deftbrain-parallel-split-pattern]]`:
   each call site must inline its own `withLanguage()`, not share a variable).
   Inlined at both of the 2 call sites; deleted the helper.

### Live-caught bug, not visible to any gate

The SYSTEM prompt's own "avoid absolutes about effort" rule listed the banned
phrases as a literal example set: *"Avoid absolutes such as zero effort, no
attention, no decisions, completely passive."* On the **first** live test call,
the model echoed that list back almost verbatim: *"This requires zero setup,
zero decisions, and zero physical effort."* — handed a copyable bad-phrase
template, it copied it. This is the documented `[[deftbrain-voice-prompt-traps]]`
pattern (worked examples move a voice; the model can also copy them literally).
Fixed by describing the constraint without listing the banned words as an
example set: *"say 'very little' or 'barely any' rather than claiming none at
all."* The `validateResult()` regex backstop **also missed this on the first
pass** — its inherited 260-char/2-sentence safety cap (meant to spare a long
paragraph from being nuked over one incidental keyword) let a genuine,
3-sentence, repeated "zero X" violation straight through. Raised to
400 chars/3 sentences. Verified together: re-ran the exact failing input
post-fix and got a clean result ("asks very little... no setup, no goal, no
output" — describing fit, never claiming zero demand). The
`generate-low-energy-evening-screens` golden case **is that exact regression
input** — if a fresh run of it ever contains "zero setup/effort/decisions/
attention" again, the bug is back.

### Catalog + cross-content sweep (install-kit §13 — chase every place the old promise still lives)

- `src/data/tools.js`: `primer`, `seoDescription`, `seoTitle` (kept distinct
  from `title` — see the duplicate-`<title>` bug from the same-day earlier
  rewrite), `description`, and the full `guide` block rewritten to describe
  the 3-action loop, not the five old modes.
- `src/data/toolFinderMetadata.js`: one handoff line (from a music/state-
  transition tool) described routing to PEP for "allocating work around
  changing energy" — that was Prioritize. Rewritten to "choosing what to do
  given their current energy." Two other PEP handoff lines (from Before the
  Crash and a movement tool) already described Right Now-shaped needs and
  needed no change.
- **5 wellness guide CTAs** (`guides/wellness/how-to-know-if-you-should-push-
  through-or-rest.js`, `how-to-get-things-done-when-you-have-no-energy.js`,
  `how-to-plan-around-lowenergy-days.js`,
  `how-to-schedule-tasks-based-on-your-energy-levels.js`,
  `why-am-i-tired-all-the-time-even-when-i-sleep-enough.js`) — byte-identical
  CTA blocks, stale since 2026-04-29, still selling "Recharge mode: quick
  hits and deep resets," "Forecast mode: weekly battery drain prediction,"
  and "Spot burnout early" — the literal banned language, in *live wellness
  content*, predating even the same-day FULL V2 REWRITE (which also missed
  these). Rewritten to describe the 3-action loop. `modified` dates bumped;
  `src/data/guides-lastmod.json` regenerated (`--write-state`) so the sitemap
  gate doesn't re-stamp every guide with the deploy date.
- A second, independent "AI-generated" mechanics leak was caught while
  restoring the cross-ref keys: `pep_xref_intro` read "AI-generated
  suggestions — you know your energy best" in **all 13 languages**, since
  before this rewrite. Rewritten to "These are suggestions, not certainties —
  you know your energy best" (all 13 languages) — no mechanism named.

### i18n convention fixes caught mid-install

- French: 12 new keys used tutoiement (tu/te/ton/tes) where this catalog's
  convention is vous. Rewritten to formal register.
- Japanese: 2 new keys used あなた (banned — subject is understood from
  context). Dropped.
- Hindi: 2 anusvara issues (-एं → -एँ), the same recurring class as prior
  sessions.

## Cramped-title layout bug, caught from a user screenshot after ship

A visitor screenshot showed the top pick's activity title rendering one word
per line in a narrow collapsed column. Root cause: `duration` held a full
clause ("20 minutes lying still, leaving 10 minutes to sit up, reorient, and
prepare for your call.") instead of a short time span, and the duration
`<span>` was `whitespace-nowrap` — demanding its full single-line width and
starving the sibling `<h4>`'s share of the flex row down to its
longest-word minimum. This is the same "cramped-column bug" class documented
for SEA (Social Energy Audit)'s SHORT-VALUES contract — a card field that's
supposed to be short but isn't breaks the layout, not just the copy.

Fixed at three layers, all live-verified together on the exact reported
scenario:
1. **Prompt**: `duration` is now specified as "a SHORT time span only... never
   more than about 4 words," with the layout consequence spelled out and a
   concrete example in the schema itself (`"20 minutes"`).
2. **Backend backstop**: `shortenDuration()` in `backend/routes/pep.js`,
   called from inside `validateResult()` for any field literally named
   `duration` — extracts the leading time-span pattern
   (`\d+\s*(?:-\d+)?\s*(?:minutes?|hours?)`) if present, otherwise cuts at the
   first clause break (comma, " - ", "leaving", "then", period, semicolon).
   Deterministic; does not depend on the model complying with #1.
3. **Frontend defense**: the `Activity` card's title `<h4>` now carries
   `flex-1 min-w-0` and the duration `<span>` carries `flex-shrink-0
   max-w-[40%] text-end` instead of an unbounded `whitespace-nowrap` — even an
   unexpectedly long duration string can no longer collapse the title, it
   wraps within its own 40%-width budget instead.

Golden re-recorded with the fix in place — all three cases' `duration` values
are now short spans. **Do not remove any of the three layers** — they were
added specifically because the first two together still weren't guaranteed
(a supplied backend can miss the prompt discipline; a prompt alone can't fix
an already-shipped bad response; CSS alone doesn't get the field length right
in the first place, it only bounds the damage).

## DO NOT silently reverse

- The 3-action scope (`generate`/`just-do-this`/`reflect`) — do not re-add
  Prioritize/Week/Patterns/Adapt/Shared/Match/sequencing without an explicit
  new instruction to do so.
- `shortenDuration()` and its call from inside `validateResult()` for any
  `duration`-named field, and the frontend's `flex-1 min-w-0` /
  `max-w-[40%]` split on the Activity card's title/duration row (no
  `whitespace-nowrap` on that span again).
- `NO_QUOTE_RULE`, `router.outputGuard` + `validateResult()`, and the inlined
  (not shared) `withLanguage()` calls at both action sites.
- The prompt's effort-absolutes rule staying phrased as a constraint
  description, never as a literal list of banned phrases the model can copy.
- The `validateResult()` cap at 400 chars / 3 sentences (not the tighter
  260/2 this tool started with — verified insufficient).
- `results`/`setResults` naming, the canonical `c` block + aliases +
  `linkStyle`, the Cmd/Ctrl+Enter listener, and the pre/post cross-tool refs.
- The catalog, toolFinderMetadata, and wellness-guide copy staying in sync
  with the 3-action product — none of it should re-promise Prioritize/Week/
  Patterns/Adapt/battery-drain/burnout-prediction language.
- `pep_xref_intro` never mentioning "AI" again.

## FINAL FOCUSED TOOL CORRECTIONS pass (2026-09-05, same day)

Twelve numbered corrections, most already substantially addressed by the
earlier passes — this one closed the remaining gaps.

1. **No "recharge" as a promised outcome.** Already true throughout (the
   prompt already bans promising "restore energy" as an outcome; the only
   "recharge" occurrences were banned-phrase regexes, a search tag, and
   the visitor's own example text — which is explicitly fine). Added the
   preferred-phrasing guidance directly to VOICE anyway: "something that
   fits what you have" / "manageable given your capacity" over "recharge,"
   "restore," "recovery."
2. **History at the activity level first.** HISTORY section rewritten:
   describe multiple saved/tried activities individually ("you rated these
   two lying-down activities 7/10 each"), and if they share a surface
   trait, name the trait but say plainly that sparse history can't yet
   confirm it's what mattered — never present it as an established
   preference ("low stimulation works for you").
3. **Capacity rise stays before→after, never a caused effect.** Extended in
   both HISTORY (generate/`history_note`) and REFLECT ON AN ACTIVITY
   (`history_observation`): "went from 5 to 8, a 3-point rise" — never
   "gave you 3 points," "raised your energy," "restored 3 points,"
   "produced a reliable lift." New regex category.
4. **No invented internal-demand claims when the visitor's own words are
   enough.** Added directly to VOICE: restate the visitor's own supplied
   fact plainly, then explain from it — don't translate it into an
   internal-state claim ("your attention has been demanded continuously").
5. **"You're not doing anything" is too absolute — extended, not new.** The
   effort-absolutes ban (from the earlier RIGHT NOW pass) now also covers
   "you're not doing/tracking/deciding anything," "not making decisions,"
   "nothing is required." **Live-caught during this pass's own testing**:
   "asks nothing of you" slipped through the original zero/no-paired-with-
   noun pattern — a genuinely different phrasing of the same violation.
   Added `\basks? nothing of you\b|\brequires? nothing\b/i`, verified in
   both directions (catches "asks nothing of you," spares "asks barely
   anything of you").
6. **My Menu and What I've Tried are now structurally distinct.** Found a
   real bug: `submitReflection()` called `addToMenu(entry.activity)` on
   every rating, meaning ANY tried activity was auto-saved to My Menu —
   exactly the merge the correction asked to undo. Removed the auto-add;
   saving is now only ever the explicit "+ My Menu" button on an Activity
   card. Live-verified: rated a brand-new, never-saved activity — it
   correctly appeared in "What I've Tried" without appearing in My Menu.
7. **Menu summary language is now the most literal claim the evidence
   supports.** New `ratingSummary()` helper: 1 try → "rated R/10"; 2
   identical → "rated R/10 both times"; 3+ identical → "rated R/10 all N
   times"; varying → "usually rated LO–HI/10" (a range, not a single
   average that implies more precision than 2-3 data points support).
   Replaces the old universal "typically rated R/10." Live-verified: a
   second identical 7/10 rating correctly produced "rated 7/10 both times."
8. **History only shown when it changes the answer — already the design,
   reinforced.** `history_note`/`history_observation` were already
   conditionally rendered and prompted as "only if it mattered"; wording
   tightened to explicitly forbid mentioning history "just because it
   exists." Live-verified both states: empty when irrelevant, populated
   with real reasoning when it actually changed the pick or ranking.
9. **"Show me different" must actually exclude the prior set.** Added an
   explicit rule, applied whenever the avoid list is non-empty: items on
   it must not reappear, and a reworded version of one doesn't count as
   different — if little else fits, say so rather than manufacturing
   novelty. Live-verified: avoid list of 3 activities correctly excluded
   from a fresh generate call, and `history_note` explicitly named which
   ones were excluded and why.
10. **Just Tell Me What To Do is now structurally simpler, not just
    differently worded.** `why_it_fits` REMOVED from the just-do-this
    schema entirely (was: activity, why_it_fits, first_step, duration,
    done_when, history_note → now: activity, first_step, duration,
    done_when, history_note). Frontend also drops the "⭐ Top pick" heading
    for this mode — it goes straight to the activity card, since there was
    no menu to pick from. Live-verified: response has no why_it_fits key,
    UI shows no heading and no analysis paragraph.
11. **"Evening" removed from the duration row.** `TIME_META`'s `'All
    evening'` (a daypart) replaced with `'open-ended'` (a duration concept,
    matching pep_time_5m/15m/30m/1hr/2hr). Dead key `pep_time_evening`
    removed; new key `pep_time_open_ended` added, all 13 languages.
    Live-verified: time row now reads 5m · 15m · 30m · 1hr · 2hr ·
    Open-ended.
12. **North Star reaffirmed, no functional change** — scope stays at
    generate/just-do-this/reflect; no new modes were added by this pass.

**New diagnostic tooling, not user-facing:** `validateResult()` now logs
which field got blanked and by which rule when `PEP_DEBUG=1` is set in the
environment — used during this pass to confirm several blanks were genuine
catches (the model writing "no decisions to track" or "asks nothing of you"
inside an otherwise-good sentence), not false positives. Zero cost when the
env var isn't set; safe to leave in.

## DO NOT silently reverse (cont'd)

- The removal of `addToMenu()` from `submitReflection()` — rating an
  activity must never automatically save it to My Menu again.
- `ratingSummary()`'s four-way split (once / both times / all N times /
  range) — do not collapse back to a single "typically rated" average.
- `why_it_fits` staying absent from the just-do-this schema, and the "⭐ Top
  pick" heading staying suppressed for `results.justDo`.
- `pep_time_open_ended` (not a daypart) in the duration row.
- The two regex categories added this pass (observed-rating-change-as-
  effect, unsupported-pattern-generalization) and the widened effort-
  absolutes pattern (`asks nothing of you` / `requires nothing`).
- `PEP_DEBUG=1` diagnostic logging in `validateResult()` — cheap, keep it.

## ADDITIONAL RIGHT-NOW RULES pass (2026-09-05, same day)

Backend-prompt-only — no schema or UI change. Added to the `generate`/
`just-do-this` SELECTION RULES (shared by both actions):

1. **AUDIO/SCREEN RULE.** An audio-led suggestion recommended specifically
   because the visitor wants less screen demand must be genuinely usable
   without watching — never visually-oriented media passed off as
   audio-only.
2. **ACTIVITY CHARACTERISTICS.** Explain a recommendation through observable
   characteristics (setup, cognitive/physical/social/sensory demand,
   decision-making, location compatibility, time flexibility), never
   internal-effect adjectives ("more present," "activating," "grounding,"
   "a step up," "regulating") unless the visitor explicitly asked for that
   quality or their own history supports it for that specific activity.
   Be confident about WHY it fits; careful about WHAT it will do.
3. **CONSTRAINT DIMENSIONS — the big one.** The 1-10 capacity score is
   context, not a single internal state governing every kind of demand.
   Cognitive, physical, social, sensory, decision-making, setup, mobility,
   location, and time are separate dimensions. A specific stated
   constraint controls FOR ITS OWN DIMENSION even when the general score
   is high — it does not average with the score, and the score does not
   override it. Critically: **do not invent a hidden explanation to
   reconcile the two** ("your body is fine, but your mind is exhausted" —
   banned; "You rated your overall capacity 7/10 and also said you don't
   want anything that requires thinking" — required). History comparisons
   must match on the dimension that matters today, not just the capacity
   number. A documented conflict-resolution order: hard constraints →
   explicit preferences/exclusions → a named domain limit → time/location
   → relevant history → the general score → generic ideas — a lower item
   never overrides a higher one. If two constraints genuinely can't both
   be satisfied, say so rather than silently picking one.

Two new `validateResult()` regex categories (defense-in-depth for #2 and
#3): an unearned internal-effect adjective, and the invented body/mind
split. Both verified in both directions before shipping (catches the
banned form, spares legitimate "very little demand" phrasing).

**Live-verified against the spec's own worked example** (capacity 7/10 +
"I can't do anything that requires thinking" + 4 hours of screens): the
`read` field came back nearly verbatim to the spec's own GOOD example —
"You rated your overall capacity 7/10 and also said you cannot do
anything that requires thinking..." — and the top pick correctly chose a
cognitively-empty, physically-open activity (a directionless walk) rather
than assuming the high score licensed more demand generally. New golden
case `generate-high-capacity-explicit-cognitive-limit` captures this
exact scenario as a permanent regression guard.

**Recurring backstop activity worth knowing about:** across this pass's
live testing, the "no decisions to track" / "no decisions once it starts"
phrasing came up repeatedly despite the existing effort-absolutes rule
already naming "decisions" explicitly — `PEP_DEBUG=1` confirmed each
instance was a genuine catch (blanking `why_it_fits`, never the whole
response). This is the accepted, working tradeoff for this tool: the
prompt reduces frequency, the regex backstop is the actual guarantee. A
field arriving empty is expected behavior, not a bug — do not chase this
by trying to enumerate every possible phrasing of "no decisions" in the
prompt text (risks the model echoing a longer banned-phrase list, per the
RIGHT NOW FINAL CORRECTIONS pass's own lesson).

## DO NOT silently reverse (cont'd, ADDITIONAL RIGHT-NOW RULES pass)

- The CONSTRAINT DIMENSIONS framework — never let a high general capacity
  score justify increasing cognitive, social, sensory, or physical demand
  the visitor didn't confirm tolerance for.
- The ban on inventing a body/mind (or any other) split to explain
  conflicting inputs — state both facts plainly instead.
- The conflict-resolution order (hard constraints highest, generic ideas
  lowest) — a lower-priority signal must never override a higher one.
- The two new regex categories (internal-effect adjective, invented hidden
  explanation) and their verified-both-directions test cases.

## Nav-label rename (2026-09-05, same day) — frontend copy only, no backend change

"My Menu" → "My Activities" (`pep_my_menu`, and `pep_add_my_menu` for the
"＋ My Activities" button, kept in sync for the same reason the two were
identical strings before — one renamed label with two render sites would
read as a mismatch). "What I've Tried" → "Past Attempts" (`pep_history_nav`).
Both nav cards' bare counts became explicit `{{n}} saved` /
`{{n}} attempts` via two new keys, `pep_count_saved`/`pep_count_attempts` —
replacing `{myMenu.length}` / `{activityLog.length}` rendered as a bare
number. All 13 languages. `pep_on_menu` ("On menu" badge) and internal
identifiers (`myMenu`/`showMenu`/localStorage key `pep-my-menu`) were
deliberately left unrenamed — cosmetic label only, no state or storage
migration needed.
