# Pet Behavior Decoder — architecture & lock notes (`petweirdnessdecoder-v2`)

Displays as **Pet Behavior Decoder**. **id/route/i18n prefix deliberately kept as
`PetWeirdnessDecoder`/`pet-weirdness-decoder`/`pwd_`** — a display-name-only rename,
following the Before the Crash precedent (memory: `deftbrain-before-the-crash`),
not the full REWRITE-INSTALL-KIT §7 rename checklist. This avoids touching
`TOOL_IDS`, `LEGACY_REDIRECTS`, `TOOL_ALIASES`, and `tool-og-slugs.json` (the id
itself never moves, so none of those need to change).

**2026-09-06: the display-text side of the rename was finished.** The initial
display-only rename correctly left the URL/id alone, but it also left every
STATIC place the old display name was baked into generated content:
`toolName`/body-copy in 6 `guides/pets/*.js` source files (feeding
`public/guides/**/*.html`'s cross-ref cards — regenerated via
`node scripts/build-guides.js`, which fixed all 552 stale occurrences since
they're derived, not hand-written), `src/components/DemoCards.js`'s landing-page
demo card, and `public/llms.txt` (regenerated via `node scripts/generate-llms.js`,
safe/local-only — do NOT run the full `npm run build` postbuild chain casually to
fix a stale derived file; it ends in `indexnow.js`, which pings external search
engines, a real outward action that needs the user's actual deploy intent, not a
side effect of a text fix). `public/guides-manifest.json` is written only by
`scripts/prerender.js`, which needs a full CRA production build first — left
stale on purpose; it self-corrects on the next real deploy (Railway builds from
git) now that its source (`guides/pets/*.js`) is fixed, the same
build-derived-state-travels-with-content reasoning as the sitemap-lastmod gate.
The DemoCards.js example `output` text was also rewritten in the same pass — it
had a confident invented-motivation line ("it's the reflection... irresistible
to a hunter brain") that no longer matches how the real V2 tool answers.

Reasons about an observed pet behavior — plausible explanations grounded in what
was reported, an action-level triage (never a diagnosis or probability), and a
factual vet summary. Vision-capable (photo/video of the pet).
**Frontend:** `src/tools/PetWeirdnessDecoder.js`. **Backend:**
`backend/routes/pet-weirdness-decoder.js` (2 endpoints, `MODELS.SMART` +
`MODELS.FAST` v2 guard). **Golden:**
`audit/pet-weirdness-decoder-golden-sample.json` (3 cases, incl. 1 DE). Verify:
`npm run check:golden pet-weirdness-decoder`.

## V2 REWRITE (2026-09-05)

The old tool asked the model to diagnose: likelihood-scored "differentials,"
breed "genetic predispositions," arbitrary age-bucket rules ("senior pets = vet
soon minimum"), invented prevalence ("how common is this"), fabricated community
anecdotes, and behavior-modification programs with invented timelines ("expect
improvement in 1-3 weeks," "extinction will take several weeks"). None of that
is something a text description (plus maybe a photo) can actually support — the
tool was commissioning fabrication by its own schema, not just its prose.

### Old schema → new schema (do not resurrect the old keys)

| Old | New |
| --- | --- |
| `behavior_analysis.urgency_level` (not_urgent/monitor/vet_soon/vet_now, joke emoji 😂) | `assessment.action_level` (likely_low_concern/watch_closely/vet_contact_recommended/emergency) — action categories, never diagnoses |
| `breed_specific_info.genetic_predispositions[]` / `common_breed_behaviors[]` | Removed. Breed appears in prose only when it genuinely helps interpret THIS behavior — no list, no stereotype table. |
| `life_stage_context` (age-bucket rules) | Removed as a dedicated section. Age is situational context in `what_could_explain_it`, never a rigid rule. |
| `most_likely_explanation` (single answer, implies certainty) | `what_could_explain_it[]` (1-3 possibilities, each with `why_it_could_fit` + `what_would_make_it_more_or_less_plausible[]`) — no possibility is "most likely." |
| `how_common` (invented prevalence) | Removed entirely. |
| `other_possibilities[].likelihood` ("high/medium/low") | Removed. No possibility carries a likelihood label — there's no defensible denominator behind one. |
| `when_to_worry.red_flags[]` + `.timeline` (invented waiting periods) | `what_would_change_the_next_step[]` — observable conditions, never a countdown. |
| `if_its_just_quirky` ("celebratory" framing) | Removed. `likely_low_concern` still preserves uncertainty ("sounds compatible with," never "completely normal"). |
| `behavioral_modification[]` (invented schedules/timelines) | Folded into `what_you_can_do_now[]` — only low-risk, reversible, un-timelined experiments. |
| `similar_pet_stories` (fabricated anecdote) | Removed entirely. |

New top-level shape: `assessment{action_level,headline,bottom_line}`,
`what_you_reported[]`, `what_could_explain_it[]`, `what_to_watch[]`,
`what_would_change_the_next_step[]`, `what_you_can_do_now[]`,
`vet_prep{show_only_when_useful,what_to_record[],questions_or_details_to_bring[]}`.

### Guard mechanism: `runOutputGuard`, not a regex `validateResult()`

Unlike PEP/Party Architect-style tools whose failure modes are mostly *phrasing*
(banned words, absolutes), this tool's failure modes are **invented facts** — a
symptom, a trigger, a medication side effect, a breed predisposition — which a
regex cannot reliably catch (there's no fixed vocabulary for "the model made up
a symptom"). Added `router.outputStandard='v2'` + `router.outputGuard.prohibit`
(17 categories, e.g. `invented_symptom_or_physical_sign_not_reported`,
`likelihood_percentage_or_high_medium_low_label_on_a_possibility`,
`invented_behavior_modification_timeline_or_improvement_estimate`) +
`router.outputGuard.require` (3 categories) + an actual `runOutputGuard()` call
after generation — an adversarial LLM-judge check + targeted per-field repair,
same mechanism as Party Architect.

### Fixed along the way (found during install, not asked for explicitly)

1. **`/followup` endpoint anti-pattern.** Raw `anthropic.messages.create` in a
   hand-rolled 3-try retry loop — the same "local retry instead of
   `callClaudeWithRetry`" anti-pattern flagged elsewhere in this codebase
   (`[[deftbrain-full-sweep-callclaudewithretry]]`). Fixed: now uses
   `callClaudeWithRetry`. Since that helper **always** `JSON.parse()`s its
   response (no free-text mode exists — confirmed by reading `lib/claude.js`
   before assuming otherwise), the followup prompt now asks for
   `{"answer": "..."}` JSON instead of raw prose.
2. **"AI-assisted" in the vet summary footer, all 13 languages, since the tool
   shipped.** `pwd_vet_sum_footer` read "AI-assisted preliminary analysis" (or
   the equivalent in each language — IA/KI/ИИ/AI/الذكاء الاصطناعي) — a direct
   "people have problems, not prompts" violation the earlier PEP sessions this
   week already caught twice elsewhere. Fixed to "Preliminary information, not
   a professional diagnosis" in all 13 languages.
3. **F3/PF-21 optional chaining.** The new results-rendering JSX accessed
   `results.assessment.X` without `?.` in ~20 places — would crash if the model
   ever omitted a field. All converted to `results?.`.
4. **A duplicate "(optional)"** on the photo/video label — the reused i18n
   value already said "Photo or video (optional)" and the new JSX appended its
   own `(optional)` marker. Fixed by stripping the parenthetical from the base
   string (13 languages) since the marker is now added consistently in JSX,
   matching the pattern used for mood/location-style optional fields elsewhere.
5. **A missed rename.** The user's spec explicitly asked to rename "Other
   changes?" → "Anything else that changed?" — reused verbatim from the old
   file without checking the rename list on the first pass. Caught live in the
   browser, fixed across all 13 languages.
6. **"1 observations saved"** — grammatically wrong in English and worse in
   Russian/Arabic. Switched `pwd_compare_count` from a flat `t()` string to
   `tPlural()`, with full CLDR forms (`_one`/`_other` for most languages;
   `_zero`/`_one`/`_two`/`_few`/`_many`/`_other` for Arabic; `_one`/`_few`/
   `_many`/`_other` for Russian) — `scripts/localization-audit.js` enforces
   this completeness for any `tPlural()` call site and caught the initial
   incomplete Arabic/Russian forms before they shipped.

### Feature removals (not asked to keep, cut for focus)

Pet Profiles manager, the severity-tracker bar-chart widget, multi-pet pattern
detection, and the seasonal (Fall/Spring/Summer/Winter Watch) hazard cards are
all **gone**, not hidden. None of these were in the rewrite spec's KEEP/ADD
list, and they depended on the old schema's `category`/urgency shape. Replaced
by a single flat "Save This Observation" → "Compare With Earlier Observations"
→ "Make a Vet Summary" flow, matching the spec's PEP-style principle: **use
history as observation, not diagnosis** — a saved log never becomes "the
condition is worsening," only "ratings were 2, 2, and 4."

### Input form changes

- "Other changes?" → "Anything else that changed?", each checked category now
  reveals an optional short detail field (`{category, detail}` pairs), not a
  bare boolean — a real usability gap: "you checked Eating" told the model
  nothing about what actually changed.
- Added "When does it happen?" (optional) — captures actual before/during/after
  context instead of asking the model to manufacture a trigger.
- Added "Recent health changes or vet visits" alongside the existing
  medications/diet disclosure fields.
- Removed the permanent 8-bullet emergency encyclopedia + Google-Maps-locator
  banner that used to render below the form on every load. Replaced with a
  concise 2-line escape hatch at the TOP of the form, before any input field —
  the "Find Vet Near Me" locator button still exists but only appears attached
  to an actual `emergency`/`vet_contact_recommended` result, not permanently.
- Removed the seasonal hazard card entirely (no date-driven injection into the
  prompt or the UI).

## FINAL GENERAL PROMPT CORRECTIONS pass (2026-09-06)

Additive only — the user explicitly said "Keep the current V2 architecture. Do
not rewrite the tool again." Added 20 general reasoning rules + a "FINAL
INPUT-INTEGRITY PASS" ledger-and-self-check to `CORE_PROMPT`, inserted between
the existing HISTORY and FOLLOW-UP QUESTIONS sections. The single most
important rule, called out first by the user's own diagnosis of the tool's
biggest remaining failure:

**Contradictory inputs are unknowns to resolve, never facts to average
together.** A free-text description ("it has happened four times this week")
and a structured field (Duration: "Just started today," Frequency: "Multiple
times daily") can conflict. Before, the model silently merged them into one
smoothed story. Now it must build an internal ledger (PET FACTS / OBSERVED
BEHAVIOR / ASSOCIATED CHANGES / HEALTH CONTEXT / MEDIA OBSERVATIONS /
CONFLICTS / UNKNOWNS) before reasoning, and when fields disagree, say so
plainly in `what_you_reported` and state which account it's relying on —
never guess silently. **Live-verified** (not just prompted for) against the
user's own exact example — see the new golden case
`contradictory-duration-frequency-vs-description` — and reproduced
consistently across two separate runs:
> "The Duration field says 'Just started today,' but the description says
> four times this week — these don't fully agree. The four-episode
> description is used here as the more specific account."

The other 19 rules, condensed: not-entered ≠ none; a checked category doesn't
license inventing a specific meaning for it (checking "Eating" ≠ appetite
change specifically); a physical symptom (vomiting, limping, etc.) never gets
downgraded into a "just quirky" behavior story; no invented diagnostic
discriminator manufactured to fill the schema when none genuinely exists;
possibilities describe, never pathologize (no "compulsive/anxious/stress-
driven" labels); breed never supplies personality or motive in body text
(same rule the dedicated breed section already had, now generalized to all
prose); a home observation experiment ("try preventing grass access") changes
plausibility, it never proves cause; no arbitrary test periods ("for a day or
two"); no inventing a new unreported problem (e.g. dehydration) to justify
generic advice; normal-between-episode behavior is information, not grounds
to rule something out; toxin/exposure reasoning stays tied to an actual
reported exposure, never expands into a speculative story; "what to watch" is
not a symptom encyclopedia (3-5 items, materially useful only); every "what
would change the next step" item must actually change the next step or it
belongs under "what to watch" instead; no false precision from repetition
(four episodes ≠ a probability or trend); action level and bottom line must
tell one coherent story (self-check before returning). Never infer sex/
pronoun from species, breed, or name — added explicitly to both endpoints.

**Severity → "concern" rename.** The existing HISTORY section's own GOOD
example ("your severity rating rose from 2 to 4") directly contradicted the
new rule that the 1-5 slider is the owner's own subjective impression, never
a clinical severity or progression measure — rewritten to "rated how
concerning it seemed as 2, then 4." Matching UI change: `pwd_severity_optional`
removed; slider now labeled via `pwd_concern_label`/`pwd_concern_low`/
`pwd_concern_high` across all 13 languages. `pwd_followup_ph` placeholder
also changed from the gendered "What if she also starts limping?" to the
pronoun-neutral "What if another symptom appears?" (no pet-sex field exists
to infer a pronoun from — the spec explicitly forbids inferring one from
species/breed/name).

**`router.outputGuard` extended** with 6 new categories matching the least
mechanically-obvious of the new rules (arbitrary test periods,
home-observation-as-proof, breed-as-personality-in-body-text, checkbox-
meaning-expansion, silently-merged contradictions, invented-new-problem-for-
generic-advice) — same defense-in-depth reasoning as the original v2 guard
list: these are invented-fact/reasoning failures, not fixed-vocabulary
phrasing, so the LLM-judge check is what actually catches them; the guard
categories just make sure the checker knows to look.

**`/followup` reinforced directly** (it doesn't literally embed `CORE_PROMPT`,
just says "apply the same rules") with explicit lines for the pathologizing-
label ban, breed-as-personality ban, home-observation-isn't-proof, arbitrary-
test-period ban, concern-rating-is-subjective, and the contradiction-surfacing
rule, plus the sex/pronoun-inference ban. Live-tested with a "would stopping
grass for a few days prove it's the cause?" question — correctly answered
"it would give you useful information... but it would not prove grass is the
cause," not a false-certainty yes.

**Found and fixed along the way (not asked for): empty-bullet rendering bug.**
The v2 guard's repair pass can only rewrite a string LEAF, not resize an
array — so when it flags one item of a string array (e.g.
`what_you_reported[5]=contradicted_supplied_fact`) and repairs it, the
rewritten value can come back as an empty string rather than being removed
from the array. Live-caught during golden re-recording (a German case's
`what_you_reported` rendered a bare "•" bullet with no text). This is a
`backend/lib/outputGuard.js` limitation shared by every v2-guarded tool in
the codebase, out of scope to fix there for this pass — instead, every list
render in `PetWeirdnessDecoder.js` (`what_you_reported`, `what_to_watch`,
`what_would_change_the_next_step`, `what_you_can_do_now`, each possibility's
plausibility sub-list, `vet_prep.what_to_record`,
`vet_prep.questions_or_details_to_bring`) and the `buildFullText()`
copy-to-clipboard builder now filter out empty/whitespace-only items before
rendering — a correct-either-way defensive fix that doesn't depend on this
guard behavior ever recurring. Worth a look at `outputGuard.js` itself if
this recurs on another tool.

**Golden sample re-recorded** (`audit/pet-weirdness-decoder-golden-sample.json`,
now 4 cases) — added `contradictory-duration-frequency-vs-description` as a
permanent regression guard reproducing the user's own worked example
verbatim; the other 3 cases re-captured against the corrected prompt.
`npm run check:golden pet-weirdness-decoder`: 4/4 PASS.

## Client-side input-consistency check + demo-data fix (2026-09-06)

The golden case above proved the backend's input-integrity pass works. But
live-testing it surfaced that the tool's own "Try Example" data (`EXAMPLES` in
`PetWeirdnessDecoder.js`) was ITSELF the same kind of contradiction — the dog
example's free text ("It's happened 4 times this week") paired with
`frequency: 'Multiple times daily'`, and `loadExample()` never set `duration`
at all, so it silently kept whatever the form's default or last value was
("Just started (today)" on a fresh load). Clicking "Try Example" reproduced
the exact bug shape without a real visitor ever typing anything contradictory.
**Per explicit instruction: fix the example data, do not touch the analysis
prompt again for this.**

Fixed both `EXAMPLES` entries to be internally consistent (`duration: 'About a
week'`, dog's `frequency` changed from `'Multiple times daily'` to
`'Occasionally'` — matching the cat example's existing bucket, since "4 times
this week" doesn't fit any exact dropdown option but is closer to occasional
than daily) and `loadExample()` now explicitly calls `setDuration(ex.duration)`
— previously the only field it silently dropped.

**New: a lightweight, client-side pre-submit consistency check**
(`detectFieldConflict()` in `PetWeirdnessDecoder.js`), so a REAL visitor who
types a genuinely contradictory description gets a same-page nudge before the
request ever reaches the backend, rather than only finding out from the
model's answer. Deliberately narrow by design — two high-confidence signals
only:
1. An explicit "N times today/this week/last week/this month" count phrase
   whose implied rate is clearly incompatible with the selected Frequency
   (e.g. "4 times this week" vs. "Multiple times daily").
2. An explicit onset phrase ("just started") vs. an established-pattern
   Duration, or the reverse ("for weeks/months/always") vs. "Just started
   (today)."

False negatives (a real conflict this misses) are fine — this is a nudge, not
a parser, and the backend's own input-integrity pass is still the real
backstop. False positives are not fine, so both signals require a literal,
explicit phrase rather than an inference. **Never reconciles the conflict
itself** — the banner shows the mismatch and offers exactly two actions, per
spec: "Use what I wrote" (dismisses and resubmits as-is, `skipConflictCheck`
passed as an explicit function argument, not tracked in state — a value set
just before the call wouldn't be visible to that closure until the next
render) or "Change the selections" (dismisses and focuses the Duration
select). The warning also self-clears via a `useEffect` the moment any of the
three compared fields changes, so it can never point at stale text.
Live-verified end-to-end: the banner fires on the exact reported example, both
buttons behave correctly, and after "Use what I wrote" the backend's own
input-integrity pass still independently caught and reported the same
conflict — the two layers reinforce rather than duplicate each other.

**Also added:** a disclosure `Caret` (from `src/components/Caret.js`, per
PF-34) plus `aria-expanded` on the "Add medications, diet, or recent health
changes" toggle, which previously had no visual affordance that it expanded.

## FINAL OUTPUT CORRECTIONS pass (2026-09-06, same day, third pass)

A live-judged read of real output against the input-integrity fix above found
18 more specific wording failures — not architecture problems, phrasing ones.
Added directly to `CORE_PROMPT`, still additive. Highlights:

- **Conflict precedence, stated up front, not just explained after the fact.**
  Order: (1) a specific free-text observation, (2) a deliberately changed
  structured field, (3) a generic/default structured field.
- **Two exact banned phrases**, needing a SECOND, more forceful pass after the
  first wording failed live: "even if he seems fine between episodes" (an
  invented reassuring negative the owner never reported) and "something feels
  off in his gut" (a narrated internal sensation). The first attempt phrased
  these as "do not add X, such as EXAMPLE" — the model reproduced the example
  almost verbatim anyway. Fixed by switching to "BANNED, verbatim and in
  substance: ..." framing. **This is the concrete lesson**: a rule that quotes
  its own bad example as illustration can get read as permission if it isn't
  phrased as a literal ban — re-verified clean across 2 fresh runs only after
  the stronger phrasing.
- No causal-chain language for a mere association (A/B co-occurring doesn't
  establish A causes B, B causes A, or C causes both).
- Consolidate overlapping possibilities to at most 3 truly distinct branches.
- `what_to_watch` (descriptive) and `what_would_change_the_next_step`
  (action-triggering) must stay non-overlapping.
- State a vet-contact recommendation directly ("contacting your vet is
  reasonable") instead of hedging behind "a low threshold for calling your
  vet" once that IS the actual advice.
- **`action_level` must match the actual recommendation** — the user's own
  top-priority fix. If the answer's own text recommends contacting a vet, the
  category must be `vet_contact_recommended`, not a softened `watch_closely`.
  Reinforced at three separate points now: the earlier general rule, a new
  dedicated rule, and the merged final self-check (10 items now, combining
  the original 8 with 7 new ones from this pass, deduping overlap).
- Preserve the owner's own descriptive word ("obsessively") as their
  characterization rather than silently upgrading it to a clinical label
  ("compulsive," "pica").
- 5 new `outputGuard.prohibit` categories + 1 new `require` matching the most
  guard-catchable of these (reassuring negatives, causal chains, embellished
  scene detail, hedged vet-contact recommendations, descriptive-word-to-
  clinical-label conversion, action-level/recommendation agreement) — though
  note the guard's LLM-judge check only sees the tool's "promise" text and the
  prohibit SLUG NAMES, not the full `CORE_PROMPT` rule text, so it did not
  catch either of the two exact-phrase violations in testing; the generating
  prompt's own wording strength is the real defense for phrase-level bans,
  not the guard.

Golden `contradictory-duration-frequency-vs-description` case re-captured
against the corrected prompt (`_meta` updated, `check:golden`: 4/4 PASS).

## DO NOT silently reverse

- The schema replacement — no likelihood labels, no breed-predisposition list,
  no invented prevalence, no behavior-mod timeline, ever.
- `runOutputGuard` (not a regex-only backstop) — this tool's failure mode is
  invented facts, which regex cannot reliably catch.
- `id`/route/i18n prefix staying `PetWeirdnessDecoder`/`pet-weirdness-decoder`/
  `pwd_` — only the display name changed.
- The `/followup` endpoint's `{"answer": "..."}` JSON envelope — do not revert
  to a raw `anthropic.messages.create` loop or assume `callClaudeWithRetry` has
  a free-text mode (it doesn't).
- `pwd_vet_sum_footer` never mentioning "AI" again, in any language.
- `tPlural()` for `pwd_compare_count` with full CLDR forms for ar/ru — do not
  collapse back to a flat `t()` string.
- Pet Profiles / severity-tracker widget / multi-pet detection / seasonal
  hazard cards staying removed — they were cut for focus, not lost by accident.
- The INPUT INTEGRITY / contradictory-inputs rule in `CORE_PROMPT` — this is
  the fix for the tool's biggest identified failure mode. Do not let a future
  edit quietly drop the "surface the conflict, don't average it" instruction.
- The concern-rating language (never "severity," never "progressed") in both
  the HISTORY section and the UI (`pwd_concern_*` keys) — a 1-5 slider is the
  owner's own impression, not a clinical measure.
- The empty-string `.filter()` guards on every result list render and in
  `buildFullText()` in `PetWeirdnessDecoder.js` — they protect against a real
  `outputGuard.js` repair-pass edge case, not defensive clutter to trim.
- `EXAMPLES`' explicit `duration` field and `loadExample()` setting it — this
  is the fix for a real bug (a silently-defaulted Duration contradicting the
  example text), not incidental. Any new example added to `EXAMPLES` must
  have a `duration` that actually agrees with its `behavior` and `frequency`.
- The client-side `detectFieldConflict()` check and its "use what I wrote" /
  "change the selections" banner — it does NOT replace the backend's
  input-integrity pass, it catches the same failure earlier for a real
  visitor. Do not make it try to auto-reconcile a conflict; that decision
  belongs to the owner by explicit design.
- The "BANNED, verbatim and in substance" phrasing on the reassuring-negative
  and internal-state rules — a softer "don't do X, such as EXAMPLE" phrasing
  was tried first and failed live (the model echoed the example almost
  verbatim). Don't soften this back without re-testing.
- `action_level` matching the actual recommendation stated in the answer —
  reinforced in 3 places (general rule, dedicated rule, final self-check
  item 8). This was the user's own top-priority fix; don't let a future edit
  drop any of the three reinforcements.
