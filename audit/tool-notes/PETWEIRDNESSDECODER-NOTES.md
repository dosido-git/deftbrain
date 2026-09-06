# Pet Behavior Decoder — architecture & lock notes (`petweirdnessdecoder-v2`)

Displays as **Pet Behavior Decoder**. **id/route/i18n prefix deliberately kept as
`PetWeirdnessDecoder`/`pet-weirdness-decoder`/`pwd_`** — a display-name-only rename,
following the Before the Crash precedent (memory: `deftbrain-before-the-crash`),
not the full REWRITE-INSTALL-KIT §7 rename checklist. This avoids touching
`TOOL_IDS`, `LEGACY_REDIRECTS`, `TOOL_ALIASES`, `tool-og-slugs.json`, the 552
cross-ref links in `public/guides/**/*.html`, and `llms.txt` — none of which
needed to change since the URL never moves.

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
