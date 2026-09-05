# PEP — Personal Energy Planner — architecture & lock notes (`pep-v2`)

Helps a visitor choose what fits their current energy, decide what deserves limited
capacity, learn what actually helps them recharge from their own logged history, and
adapt a routine when it gets knocked sideways. **Frontend:** `src/tools/PEP.js` (five
tabs: ✨ Right Now · 🥄 Prioritize · 🔋 Week · 📡 Patterns · 🔄 Adapt — all localStorage
keys `pep-*`, unchanged by this rewrite). **Backend:** `backend/routes/pep.js`
(`MODELS.SMART`, 17-action dispatch on one route, `router.outputStandard='v2'` +
`router.outputGuard={checks:['validateResult']}`). **Golden:**
`audit/pep-golden-sample.json` (4 cases). Verify: `npm run check:golden pep`.

## FULL V2 REWRITE (2026-09-05)

Complete replacement of prompt, schema, and large parts of the UI, per a detailed user
spec. This was not a wording pass — the OLD tool had a fabricated measurement system
baked into the schema and the UI, not just the prose. The old `pep-v1` golden's own
captured output (still visible in git history) shows the failure mode directly:
`energy_read`/`pleasure_vs_numbing` language, "your nervous system needs stillness, not
new stimulation," quick_hits/medium_recharge/deep_reset categorization, an
introvert/extrovert energy-type slider with hosting=2x/presenting=1.5x cost multipliers,
literal task-cost arithmetic ("total_cost" summed against "available"), a burnout-risk
radar with green/yellow/orange/red status and "time until concern" estimates, and a
`debt-check` action whose schema was literally `prescription`/`debt_level`/
`gentle_warning`.

Description/tagline also replaced — old copy promised a "five-mode energy management
system" including forecasting battery drain and spotting burnout early; new copy frames
PEP around planning, adaptation, and learning from the visitor's own observations.

### Old schema → new schema (do not resurrect the old keys)

| Mode (tab) | Old shape | New shape |
| --- | --- | --- |
| Right Now (`generate`) | `energy_read/mood_note/time_note/transition_tip/pleasure_vs_numbing` + `menu.{top_pick,quick_hits[≤4],medium_recharges[≤4],deep_resets[≤3],avoid[≤3]}` | `{read, top_pick:{activity,why_it_fits,first_step,duration,done_when}, other_options:[{activity,why_it_fits,duration}], from_your_history:{activity,evidence}}` |
| `just-do-this` | `{activity, why_this, duration, after, category}` | `{activity, first_move, why_it_fits, duration, done_when}` |
| `build-menu` | items carried `category`/`effort` | `{menu_balance_note, suggestions:[{activity,why_add,duration,energy_min,energy_max,environments}]}` |
| `swap` | alternatives carried `effort`/`category` | `{read, alternatives:[{activity,why_different,duration}], wildcard:{activity,why}}` |
| Log & Reflect (`rate-activity`) | `rating`/`sensory_anchor` in, `anchor_suggestion` out | `{reflection, pattern_note}`; ordinal-rating discipline — a 3→6 change is "3 points higher," never "nearly doubled" |
| `energy-match` | included `anchor_reminder` | `{matched:[{rank,activity,why_now}], gap_note}` |
| Patterns history piece (`pattern-check`) | `top_restorers`/`numbing_traps`/`mood_patterns`/`best_insight` | `{summary, notable_patterns:[{activity,observation}], not_enough_data:[]}` |
| `recharge-insights` | `avg_energy_gain`/`high_rated_pct`/`best_category`/`recommendation` | `{dashboard:{avg_rating,total_sessions,most_tried_activity}, trend, trend_detail}` |
| Build a Plan (`build-sequence`) | `sequence_name`/`arc`/`arc_description`/`completion_feeling`/`transition_from_previous` | `{plan_name, total_time, steps:[{step,activity,duration,why_this_order}]}` — no process-arc/emotional-progression framing; completion message is now a static string in the frontend (`pep_plan_complete`), not model-predicted |
| `schedule-checkin` | `why` | `{prep_tip, reminder_message, suggested_activity:{activity,why_it_fits,duration}}` |
| Prioritize (`budget`) | `capacity_status/total_cost/available/permissions/protection_suggestion/tomorrow_note` — literal task-cost summation, "it's math" framing | `{read, protect:[{task,why,make_it_easier}], consider_next:[], postpone_or_drop:[{task,reason}], sequence:[], one_decision}` — no arithmetic, no "required tasks must happen" absolutism |
| Week (`forecast`) | `energy_type`(introvert/extrovert)/`current_battery`/`recharge_hours`, battery-percentage output | inputs: `demanding_factors[]` (checkbox list) + `what_helps` (free text) + `starting_capacity` (1-10); output `{week_shape, demanding_stretches:[{when,what_makes_it_notable}], breathing_room:[{when,option}], commitments_to_reconsider:[], from_your_history, one_move_now}` — no battery %, no burnout-risk flag |
| Patterns daily (`radar-checkin`) + Patterns history (`radar-analyze`) | TWO different shapes — checkin's ad hoc fields vs analyze's `overall_risk/time_until_concern/metric_trends/cross_signals/interventions/bright_spots/reality_check` | **UNIFIED** to one shared shape: `{today, what_changed:[], possible_patterns:[{observation,evidence,strength}], not_enough_to_tell:[], worth_watching:[], optional_next_step}` — OBSERVED/POSSIBLE PATTERN/TOO LITTLE DATA framing, no color status, no time-until-burnout estimate |
| Adapt (`disruption`) | `acknowledgment/adapted_routine/survival_schedule/self_care_minimum/return_trigger/duration_note/reality_check` | `{situation, keep:[{item,lighter_version}], lighten:[{item,temporary_version}], pause:[{item,reason}], temporary_shape:[{part_of_day,what_matters}], unknowns:[], reassess_when, one_next_step}` |
| `debt-check` | `prescription/debt_level/gentle_warning` | **ACTION REMOVED ENTIRELY** — every field it returned was a banned term |

### Critical prompt guards (verified live, do not weaken)

- **Adapt/disruption with a blank `normal_routine` must NOT invent a generic
  exercise/meal-planning/hygiene/medication/sleep routine.** The prompt has an explicit
  "DO NOT FILL IN A GENERIC SURVIVAL ROUTINE" section for this. Verified live: a sick-day
  call with `normal_routine: ''` correctly returned `lighten: []`, `pause: []`, and listed
  "What your normal routine contains" under `unknowns` instead of fabricating one — this
  is the `adapt-sick-day-sparse-input` golden case specifically to guard this regression.
- **Ordinal-scale discipline** (Log & Reflect): a 1-10 self-report is not a measurable
  quantity. Banned: "nearly doubled your energy." Required: "X points higher." A single
  before/after pair is not evidence of causation — banned "this activity restored you,"
  required "your rating was higher afterward."
- **Prioritize/budget must not sum task "cost" as literal arithmetic** or treat "required"
  as absolute — the visitor's own judgment about what can move still matters.
- **`validateResult()` regex backstop** (same shape as `one-percenter.js`'s): 8 rule
  categories (burnout terminology, battery/energy-cost-as-measurement, introvert/
  extrovert stereotype, nervous-system/deep-rest claims, forced encouragement, restorative-
  vs-numbing binary, invented-causal-mechanism/ordinal-as-quantity error, generic medical/
  medication instruction) blank any matching leaf string before `res.json()`. Fired ZERO
  times across 11+ live test calls during this rewrite — the prompt discipline is holding
  without needing the net, but the net stays as defense-in-depth.

### Data-continuity decisions (do not "clean up" without a migration)

- **`radar-checkin`/`radar-analyze` wire field names `productivity` and `social_energy`
  are UNCHANGED** despite the UI relabeling "Productivity" → "Focus / getting things
  done." Existing visitors' `checkinLog` history is keyed on these field names — renaming
  the wire field would silently orphan every prior check-in. Only the human-readable
  prompt label changed.
- **My Menu no longer stores `category`/`effort`/`avg_rating`/`use_count`/
  `sensory_anchor`** as stale, incrementally-updated fields. Menu item shape is now just
  `{id, name, duration, energy_min, energy_max, environments, addedAt}`. All stats (times
  tried, typical rating, energy-before range, last tried) are computed FRESH from
  `activityLog` on every render via `menuStats()` — a whole class of stale-cache bug is
  now structurally impossible. `activityLog`'s client-side cap raised 6 → 100 (PF-25
  exception, comment placed directly above the `.slice(0, 100)` call).
- **Single-data-point display fix**: when `menuStats()`'s `beforeRange` collapses to
  `[v, v]` (only one logged attempt), the UI renders `pep_menu_energy_before_single`
  ("Energy before was {{v}}/10") instead of the two-value `pep_menu_energy_before`
  ("Energy before ranged {{lo}}-{{hi}}/10") — avoids "ranged 5-5/10" reading oddly for a
  single observation.

### i18n bug caught by browser testing, not by any gate

`PatternsResult` renders pattern strength via a **template-literal** dynamic key —
`` t(`pep_pat_strength_${p.strength}`) || p.strength `` — where `p.strength` is one of
the backend's own enum values (`worth_noticing|possible|too_little_data`, see
`backend/routes/pep.js` lines ~905/953). None of the three `pep_pat_strength_*` keys
existed in any language. Because `i18n/index.js`'s documented missing-key fallback
returns **the key string itself** (not `null`/`undefined`), the `|| p.strength` never
fired — the UI rendered the literal string `pep_pat_strength_too_little_data` to a
real visitor. Caught live in the browser exercising the Patterns tab with a second
check-in, not by any script: the key-usage verification script used throughout this
rewrite matches `t\('pep_...'\)` and bare `'pep_...'` string literals, but a
backtick template literal with an interpolated expression (`` t(`pep_..._${x}`) ``)
matches neither pattern — a blind spot the earlier META-array (`t(m.lk)`) fix did not
cover. Fixed by adding all three keys across all 13 languages. **If a future edit adds
another `` t(`pep_..._${x}`) `` dynamic key, grep for the enum's possible values
directly** rather than trusting the string-literal key-usage script — it cannot see
into a template literal's interpolated part.

### i18n

253 → 254 keys/language, +3 more (`pep_pat_strength_*`) found only via live browser
testing — 257 final (net: -83 dead, +40 new, incl. the single-value menu key added
after live testing) across all 13 languages, verified 1:1 against actual frontend usage
(including dynamic `t(m.lk)` references via `DEMANDING_FACTOR_META`/mode-meta arrays —
a naive `t\('pep_...'\)`-only grep undercounts these; match on any `'pep_...'` string
literal instead). 4 Hindi anusvara fixes (`-एं`→`-एँ`): `pep_input_intro_body`,
`pep_forecast_sub`, `pep_disrupt_sub`, `pep_factor_back_to_back`.

### `PEP.js` catalog entry (`src/data/tools.js`)

`seoTitle` deliberately kept DIFFERENT from `title` ("Energy-Based Daily Planner" vs
"PEP — Personal Energy Planner") — `ToolRenderer.js` concatenates `title` + `seoTitle`
unless `seoTitle` is a substring of `title`; an earlier draft had them overlapping but
not substring-equal, which produced a literal duplicate-phrase `<title>` tag live
("PEP — Personal Energy Planner — Personal Energy Planner | DeftBrain"). Verified fixed
via `document.title` in-browser.

## DO NOT silently reverse

- The removal of ALL battery-percentage, introvert/extrovert, burnout-radar, and
  debt-check language — none of it should reappear even as a "helpful" aside.
- The Adapt blank-`normal_routine` guard (no invented generic survival routine).
- The unified Patterns schema shared by `radar-checkin` and `radar-analyze`.
- The `productivity`/`social_energy`/`physical_symptoms` wire field names on radar
  actions (relabel the UI, never the field).
- Fresh-computed (not stored) My Menu stats via `menuStats()`.
- Ordinal-scale rating discipline in Log & Reflect (points, not ratios; correlation, not
  causation from one observation).
- `seoTitle` staying distinct from `title` on the catalog entry.
- `activityLog` cap of 100 (not silently re-lowered back to 6).

### Partner → Shared rename + an "AI" mechanics leak caught in the same pass

Closing the spec's "PARTNER: rename 👥 Shared" item surfaced a second, unrelated
violation in the same five strings: `pep_partner_builder` read "AI Partner Builder" in
literal, human-visible text in **every one of the 13 languages** ("AI 搭档构建器",
"AI साथी बिल्डर", "منشئ الشريك بالذكاء الاصطناعي", "Construtor de parceiro com IA",
"Créateur de partenaire IA", "KI-Partner-Builder", "AIパートナービルダー", "AI 파트너
빌더", "ИИ-конструктор для пары", "ตัวสร้างคู่ด้วย AI", "Trình tạo đối tác bằng AI") —
a direct violation of the charter's "people have problems, not prompts" rule (never
surface AI mechanics in the interface). Fixed alongside the rename: `pep_nav_partner`
→ "Shared", `pep_partner_menu`/`pep_add_partner_menu` → "Shared Menu",
`pep_partner_builder` → "Shared Menu Builder" (AI mention dropped entirely),
`pep_suggest_partner_acts` → "Suggest shared activities" (all 13 languages).
`pep_partner_empty`/`pep_partner_interests_ph` were already partner-neutral text and
were left unchanged. Nav/panel emoji changed 👯 → 👥 in `src/tools/PEP.js` (2 sites) to
match the spec's literal "👥 Shared". Internal identifiers (`partnerMenu` state,
`'partner'` as the internal menu-target string) were deliberately left unrenamed —
they're code-level, not user-facing, and renaming them risks an unrelated localStorage
key migration for no visible benefit.

## DO NOT silently reverse (cont'd)

- `pep_partner_builder` must never mention "AI" again — say what the feature does
  ("Shared Menu Builder"), not what generates it.

## RIGHT NOW FINAL CORRECTIONS pass (2026-09-05, same day)

Six corrections to the `generate` (Right Now) prompt, all found by the user reviewing
a live result, not by any gate:

1. **Never invent a clock time.** A result showed `time_of_day: "Evening"` but the
   `read` text said "between now and 3pm" — a specific hour nobody supplied. Fixed:
   §11 bans deriving a clock time from a period-of-day; relative timing only
   ("before your call," "in the time you have") unless the visitor's own text names
   an exact time. Regression-guarded by the new
   `right-now-evening-no-clock-time-with-saved-menu` golden case.
2. **No effort absolutes unless literally true.** "Zero setup or decisions" →
   "very little setup." §12 bans zero-setup/effort/decisions/attention and
   "completely passive"; low-demand framing stays fine.
3. **Explain fit, not an internal effect.** "Fills the window without demanding
   attention" claims a mental effect. §13 requires describing what the activity
   asks of the visitor and how that matches their stated conditions, never what it
   will produce inside them.
4. **Saved ≠ effective (confirmed correct, unchanged).** The existing "no prior
   ratings under similar conditions are on record here" framing was already right —
   explicitly kept as-is.
5. **Top pick may cite saved-menu status without overselling it.** §14 permits "this
   is already on your saved menu, asks very little of you, and fits inside your
   window" but bans promoting saved-but-unrated to "likely to recharge you," "your
   body already responds well to this," or "your best recovery tool."
6. **Universal test added (§15):** every explanation must answer "why does this fit
   the conditions supplied" (time, location, capacity, mood, constraints, saved
   preference, actual prior ratings) — never "why will this change the visitor's
   internal state."

Three new `validateResult()` regex categories (global across all 17 actions, not
just `generate`, since these are general failure patterns): unsupported absolute
about effort, internal-effect claim instead of a fit explanation, saved-menu status
oversold as proven effectiveness. Live-verified on the exact reported bug scenario
(Evening + "before a call" + saved-menu item) and a second scenario (high energy,
no saved menu) — clean on both, output now nearly matches the user's own supplied
GOOD examples verbatim. Golden re-recorded (`right-now-low-energy-evening` output
refreshed, new case added) — 5 cases total, `check:golden pep` 5/5.

**Do not weaken:** §11-15 in the `generate` prompt, or the three new regex
categories — they are a second layer specifically because the model had already
drifted into exactly these patterns once in production.
