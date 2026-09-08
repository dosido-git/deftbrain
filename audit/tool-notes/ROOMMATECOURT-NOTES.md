# Roommate Court — architecture & lock notes (`roommate-court-v2`)

Two tools sharing one tab strip: Work It Out (household-conflict mediation from one
account) and Chore Roulette (chore rotation). **Frontend:** `src/tools/RoommateCourt.js`.
**Backend:** `backend/routes/roommate-court.js` (one route, `action` dispatch:
`mediate` | `assign` | `rebalance`, `MODELS.SMART`). **Golden:**
`audit/roommate-court-golden-sample.json` (1 DE mediate case + 2 EN chore cases).
Verify: `npm run check:golden roommate-court`.

## V2 rewrite (2026-09-08) — owner brief

The v1 tool promised to adjudicate fault from one person's account (numeric
`your_fault_pct`/`their_fault_pct`, a `whos_right` verdict), invent the "real
underlying conflict" behind a dispute, script a full two-sided conversation
ending in a fictional accepted agreement, and assert jurisdiction-dependent
housing law. Chore Roulette claimed to compute objective fairness from
universal 1/2/3 effort weights nobody supplied, down to "1 heavy chore = 3
light chores." This rewrite keeps the courtroom PERSONALITY — Roommate Court
can still have a clear, verdict-like voice — while dropping every claim to
evidence it doesn't have: it heard one witness, not both, and has no
household-specific data on how burdensome a chore actually is unless told.

**What changed:**
- **Tab renamed** "Dispute Court" → "Work It Out" (tool name stays Roommate
  Court — the courtroom identity is fine, the fake-adjudication behavior
  wasn't). Internal `activeTab` state values (`'dispute'`/`'chores'`) and the
  `rc_` i18n prefix are unchanged — this is a rewrite, not a rename.
- **Category selector removed** from Work It Out's input — the dispute
  description supplies the relevant subject; the field added a large taxonomy
  before the tool did any useful work.
- **"Their side (be honest)" → "What would they say? — if you know"** — the
  old wording pressured the visitor to manufacture the absent person's
  perspective.
- **Mediate schema rewrite**: `the_read{label, explanation}` (label is a
  pinned 8-value English enum: `YOUR REQUEST LOOKS REASONABLE` /
  `THEIR CONCERN LOOKS REASONABLE TOO` / `YOU MAY BE ASKING TOO MUCH` /
  `THEIR RESPONSE DOESN'T ADDRESS THE PROBLEM` / `YOU'RE TALKING PAST EACH
  OTHER` / `THE EXPECTATION ISN'T CLEAR YET` / `THIS NEEDS A FIRMER BOUNDARY` /
  `NOT ENOUGH TO TELL` — never translated, the frontend maps it to a display
  string via `READ_LABEL_KEY`), `where_the_disagreement_is{your_stated_concern,
  their_reported_concern, collision, unknowns_that_matter[]}`,
  `what_to_try[]{action, why_it_may_help}`, `conversation{start_with_this,
  ask_this, if_they_push_back[]{possible_response, you_could_say},
  proposal}`, `if_that_doesnt_work[]{next_step, when_it_makes_sense}`
  (progressive disclosure — collapsed by default), `one_thing_not_to_lose_
  sight_of` (optional). Was `verdict{whos_right, reasoning, your_fault_pct,
  their_fault_pct}` / `underlying_issues{surface_conflict, real_conflict,
  communication_breakdown}` / `resolution{immediate_actions, conversation_
  script, compromise, boundaries}` / `if_stuck{escalation_options,
  self_protection, exit_strategy}` / `prevention` / `reality_check`. Guard:
  `!parsed?.the_read?.label`. 3500 max_tokens (down from 5000 — the schema is
  smaller now that fictional dialogue is gone).
- **`if_they_push_back` entries are explicitly hypothetical** — the prompt
  requires "if they respond along the lines of..." framing, never scripted
  as words that were actually said, and `proposal` is explicitly a thing to
  suggest, never an agreement already reached. This is the single most
  important behavior change: v1's rendered example scripted both sides
  through to a fabricated "firm and mutual" 48-hour agreement.
- **No unsourced tenancy/landlord claims** — the prompt explicitly prohibits
  asserting lease provisions, habitability violations, tenant/eviction/buyout
  rights, mediation availability, or deposit consequences; when housing law
  matters it says "your lease and local housing rules determine your
  options — verify those before acting" instead.
- **Chore Roulette schema rewrite**: chores now carry an optional
  household-supplied `load` (`UNSPECIFIED|LIGHTER|MEDIUM|HEAVIER`) instead of
  a model-invented numeric `effort` (1/2/3). The backend echoes the supplied
  load back exactly — it never invents its own judgment of how heavy a chore
  is. `this_round{chore_counts, load_totals}` replaces `effort_totals` +
  `fairness_score`; `load_totals` stays `null` unless at least one chore had
  a household-supplied load (verified live: unweighted chores show as plain
  counts, weighted ones show load points). No fairness percentage anywhere.
  Guard: `!parsed?.assignments` (assign has no output-guard call — matches
  other lightweight non-narrative endpoints catalog-wide).
- **Rebalance rewrite** (was "That's Not Fair!", now "Something Doesn't
  Work?"): returns `what_changed` + `adjustment_needed` (bool) +
  `revised_assignments` (or `null`) + `explanation`, replacing
  `complaint_valid`. The complaint is treated as NEW INFORMATION to
  incorporate, never a claim to adjudicate as valid/invalid/upheld — verified
  live with a genuine new constraint (no car) plus a repeat-chore complaint,
  both correctly incorporated without a verdict-style badge.
- **Frontend "Adjust the Load" UI** (new): after chores are added, each one
  gets an optional Lighter/Medium/Heavier toggle (default unset/unspecified —
  clicking the already-selected option clears it back to unspecified). The
  AI never silently decides how burdensome a chore is; only what the
  household actually sets gets sent as a `load` value.
- **Catalog copy rewritten** (`src/data/tools.js`): tagline, description,
  primer, and the full `guide` block all described the v1 tool (fault
  percentages, "real underlying conflict," "nobody can claim it's unfair").
  All replaced to match the actual v2 promise.
- **Retranslated the i18n locale file fresh** across all 13 languages
  (prefix kept: `rc_`) — nearly every key's English meaning changed. Fixed
  one banned-pronoun finding along the way (Japanese あなた in two new keys,
  reworded to drop the explicit pronoun — matches the fix pattern already
  used on Say What?).
- **Persisted keys bumped**: `court-history` → `court-history-v2`,
  `court-current-round` → `court-current-round-v2` (v1 stored a numeric
  `effort` on every chore; a v1 round/history restored here would carry a
  shape this file never reads). Added `court-chore-loads` (new). `court-
  members` and `court-chores` are unchanged in shape and keep their v1 keys.
- **Removed a stale cross-reference**: the "Related" block linked `/NotSoFast`
  under the label "Rulebook Breaker" — a leftover from before that tool's own
  rename, and thematically unrelated to a household-conflict tool anyway.
  Dropped rather than replaced.

## DO NOT silently reverse
- `the_read.label` staying the exact pinned English enum string, with the
  frontend switching the display text on it via `READ_LABEL_KEY` — never
  compare against a translated string.
- `if_they_push_back` staying explicitly hypothetical ("if they respond along
  the lines of...") and `proposal` staying explicitly unaccepted — this is
  the core fix the rewrite exists for.
- No numeric fault split, no fairness percentage, no `complaint_valid`
  verdict anywhere in any of the three actions — these are explicit
  `router.outputGuard.prohibit` entries on the mediate action.
- Chore `load` values echoed back exactly as supplied, never invented by the
  model when unset — `load_totals` stays `null` with no household-supplied
  weights present.
