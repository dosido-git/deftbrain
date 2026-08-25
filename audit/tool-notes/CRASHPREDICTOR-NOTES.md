# CrashPredictor — architecture & lock notes (v1, 2026-07-02)

Burnout tracker/predictor: daily check-ins (energy/sleep/stress/mood + symptoms/biometrics/weather) in localStorage → client-side alerts → AI risk analysis + 14-day pattern detection. 4-mode UI (dashboard/checkin/analysis/history). In `LOCALIZED_TOOLS`.

- **Model:** `claude-sonnet-4-6` — `/api/crash-predictor-analyze` (max_tokens 5000) + `/api/crash-predictor-patterns`.
- **Golden:** `audit/crash-predictor-golden-sample.json` (analyze-3-logs + patterns-14-logs). Verify: `npm run check:golden crash-predictor`.

## DO NOT silently reverse
1. **JSX nesting: checkin / analysis / history mode blocks are SIBLINGS.** A missing `</div>` once nested analysis+history *inside* the checkin block (`mode==='checkin' && mode==='analysis'` — impossible) → the tool's entire output layer never rendered; users paid a 60–90s API call for a blank page, and a literal `)}` showed on screen. All five gates were green — this class is invisible to them. If editing this file's JSX, re-verify block nesting by AST (babel parse → mode-block spans must not overlap).
2. **Patterns sends `logs.slice(0, 90)`** — the backend requires ≥14 and accepts 90. It previously sent `slice(0, 6)` → deterministic 400 on every use. Patterns schema is BOUNDED (4-6 strongest patterns, max_tokens 5000) — at 3000 unbounded it truncated → 500 on a real 14-log run.
3. **Try Example confirms before overwriting** (`cpr_example_confirm` ×13) — `setLogs(EXAMPLE.logs)` used to silently destroy weeks of persisted daily check-ins.
4. **Contacts/goals/experiments add-forms exist** (quick-add rows with sr-only labels — the PF-15 v2.0 exemption pattern). They previously had only remove/toggle setters — permanently empty features.
5. Cycle & Weather analysis sections wire real `expandedSections` state (were hardcoded `expanded={false}` — content unreachable forever).
6. Enums are clean and ===-switched (risk levels, urgency, priority) — keep them annotation-free.

## v2 (2026-07-12) — German-truncation residual fix
A post-batch headroom spot-check found `/crash-predictor-analyze` (the ~15-nested-object
schema) **truncated at `max_tokens 5000`** in German (arrays were already capped; the fixed
schema is just large). **Fix:** `max_tokens` 5000 → **7500**. Golden gains a `de-truncation-guard`
case. Tag → `crashpredictor-v2`.

## Re-lock v2 — 2026-08-24 (`crashpredictor-v2`)

Tool rewritten front and back by the owner; this pass was integration repair, not redesign.

**The route was down — 500 on every call.** Four faults, each sufficient alone:

| Fault | Effect |
| --- | --- |
| `parseJson(raw)` on an already-parsed object | `callClaudeWithRetry` parses; the second parse received `[object Object]` and threw. Every call, both endpoints. |
| `MODELS.SONNET` | Does not exist — the roles are `SMART` / `FAST` / `DEEP`. Resolved `undefined`. |
| `callClaudeWithRetry(prompt, system, opts)` | The helper takes **two** arguments. `system` landed in the options slot and the real options were ignored, so `label` never reached the logs. |
| `maxTokens: 4200` | The option is snake_case `max_tokens`. Silently left both schemas on the 2500 default. |

Now on the full-request form (`{ model, max_tokens, system, messages }`, `{ label }`), which is what S7.12 asks for and removes the question of which options the string form honours.

**Enforcement.** The rewrite set `router.outputGuard = 'crash-predictor-v2'` — a string. It reads as a declaration to a human and enforces nothing; Gate 9's regex matched it. Replaced with a real profile and `runOutputGuard` wired into both endpoints across every string field, with the visitor's own log entries as the only source of truth:

```
prohibit: invented_log_entry, causal_claim_from_correlation, medical_or_diagnostic_language,
          unsupported_prediction, false_precision, pattern_from_too_few_days
require:  traceable_to_logged_entries, fulfills_tool_promise
```

It fires usefully rather than decoratively — a 7-entry log drew `causal_claim_from_correlation`, `false_precision` and `pattern_from_too_few_days` on the first live run. `pattern_from_too_few_days` is the one that matters for this tool: a handful of check-ins is not a pattern, and saying so is the honest output.

**Frontend.** Shipped English-only — 37 strings unwrapped. Now `t()` with `cpv2_*` keys across all 13 languages. Palette conformed to the `c = {}` convention, hook ordering fixed, and `analysis || patterns` collapsed into one `results` binding so both endpoints render through the same path.

**Audit rule widened, not exempted.** `audit_v2-3-2.py`'s persistence check accepted a stored `logs` (it matches `[A-Za-z]+Log`) while the render check did not, so a tool whose history *is* a log of check-ins failed half a rule it satisfied. Widened the render side to `[A-Za-z]*[Ll]ogs?` — the two halves now agree. No exemption added.

**Live:** `analyze` 200 / 32.7s, `patterns` 200 / 24.1s, `analyze` DE 200 / 49.2s. Golden 3/3.

## Copy + integration pass — 2026-08-24

Owner's list, plus two things the list implied.

| Asked | Done |
| --- | --- |
| Stale catalog description | Replaced with the owner's text. The old one shouted (`YOUR`, "can't trust their own assessment") and promised a days-to-crash countdown the tool no longer makes. |
| ⚠️ on **Save check-in** | Removed at rest. The spinner keeps `tool?.icon` — S0 requires it, and a *spinning* icon reads as progress, not alarm. |
| "Anything you noticed?" | → "Anything else you noticed?" — the four sliders above it are already observations. |
| "Fatigue" → "Low energy" | See below; there was no string to change. |
| Check-in stamped tomorrow | `toISOString()` converts to UTC first, so west of Greenwich an evening check-in files as the next day. Now built from local `getFullYear/getMonth/getDate`. Verified: stored `2026-08-24` where the old path wrote `2026-08-25`. |
| Two icons before the tagline | `cpv2_hero` began with "⚡" and the catalog icon `⚠️` rendered immediately before it. Dropped the ⚡ from the string in all 13 languages. |
| Collapsed "How it works" | Native `<details class="group">` + `Caret groupOpen` (PF-34), under the sub-line and above Try an example — it answers "what am I signing up for?" before the visitor decides. |

**"Fatigue" had no string to replace.** The chips were labelled by transforming their own object keys — `k.replace(/([A-Z])/g, ' $1')`, so `brainFog` → "Brain Fog". English by construction, in every language, with no literal for a translator or for Gate 5 to find. The `cpr_act_*` / `cpr_sym_*` / `cpr_warn_*` keys already existed in all 13 languages; the rewrite had simply stopped using them. Added a `CHIP_LABELS` key→locale-key map beside `EMPTY_ENTRY` so a new symptom cannot be added without a label.

Same class, three more places: the four sliders (`label="Sleep" low="Poor" high="Restful"`), the three tab labels, and the history heading template. All now `t()`. New keys use the rewrite's gentler wording rather than reusing v1's `cpr_energy_low` ("Depleted", "Terrible", "Awful") — the owner called this form Green in English, so English is what the other twelve should say.

**Gate 5 cannot see any of this.** It looks for unwrapped literals; a label computed from a key is not a literal, and a JSX string *attribute* (`low="Poor"`) is not one either. Worth a rule.

Spot-checked es (chips, sliders, tabs, disclosure all translated, no English leak) and ar (RTL, caret at inline-end, no tofu, no clipping, no overflow at 375px).

## Header conformed to PF-30 / PF-17c — 2026-08-24

The rewrite hand-rolled its own header instead of the catalog-wide one, so
Crash Predictor was the odd page out. Against the spec:

| | Rewrite | PF-30 / PF-17c |
| --- | --- | --- |
| Tagline | `text-lg font-semibold` — a heading | `text-base ${c.textSecondary}` — one muted line |
| Icon | no size class | `text-lg`, one step above the tagline |
| Card padding | `p-5` (20px top) | `px-5 pt-2.5` — 20 reads as a blank line |
| Divider | none | `pb-3 border-b border-zinc-500` under the header row |
| Shadow | none | `shadow-sm` |
| Grey lines | two (tagline + sub) | **one** — PF-30 is explicit; Batch Flow's second sentence was removed for the same reason |
| Try an example | no `disabled` binding | `disabled={loading}` + `disabled:opacity-40` |
| Start over | `py-1.5 text-xs` | `py-2 text-sm font-bold min-h-[40px]` |
| Mode tabs | 3 tall emoji cards, active state = a ring and **no background at all** | `flex gap-2 pt-3`, `c.btnPrimary` / `c.btnSecondary` |

The sub-line's sentence is the opening of the catalog description, which the
wrapper already renders above the card — nothing was lost by dropping it, and
`cpv2_hero_sub` would have been a dead key in 13 languages.

**Catalog tagline was stale too.** The page said "Learn what tends to happen
before you run out of steam" while `tools.js` still said "Spot your burnout
patterns before the crash" — the old shouty register, and PF-30 renders the
tagline, so the two need to agree. Catalog now matches the page.

**Cross-ref moved.** The pre-result PEP link sat *above* the header card — the
first thing on the page, before the tool says what it is. CONVENTIONS: "one
inline sentence at the foot of the tool, wrapped in `{!results && (...)}`.
Never above the form." Moved to the foot and re-gated from `!logs.length` to
`!results`.

"How it works" now sits directly below the header card rather than inside it,
so the header keeps its single muted line.

## "Start over" did nothing — 2026-08-24

`reset()` cleared the draft entry, the analysis and the patterns. Its
visibility was keyed on `(logs.length > 0 || analysis || patterns)` — and
`logs` is the one thing it never touches. So in the state a returning visitor
is almost always in (dashboard, check-ins saved, no analysis on screen) the
button was visible and pressing it changed nothing. The condition promised
something the handler didn't do.

Now gated on `canReset` — `analysis || patterns || entryDirty || view !== 'dashboard'`
— so it appears only when it has something to clear, and clicking it always
does something visible. `entryDirty` compares the draft to `EMPTY_ENTRY`
excluding `date`, which is pre-filled and would otherwise read as dirty on
arrival.

**The log had no delete at all.** A mistyped day was permanent, and there was
no way to start a fresh history — which is probably what the owner was reaching
for when they pressed Start over. Added **Clear all check-ins** to the History
view behind `window.confirm`, the house pattern for persisted data
(DoctorVisitPrep, BrainRoulette, DecisionCoach, BuyWise, BillRescue). It clears
`analysis`/`patterns` too, since both describe a history that no longer exists.
`deleteHover` was missing from this tool's palette; added.

Start over deliberately does **not** delete saved check-ins — that is what the
reset control means everywhere else in the catalog, and one click should not
destroy a month of daily entries.

**Still open:** no per-entry delete. One bad day can only be fixed by clearing
everything. Worth adding if the owner wants it.

Verified: fresh dashboard → hidden; Check-In view → appears; click → returns to
dashboard and disappears; after saving → hidden again; History → Clear all
present, confirm fires, log emptied, button gone.

## Per-entry selection + the same-date note — 2026-08-24

**Clear all → checkboxes + Clear checked.** Each History row is now a `<label>`
wrapping a checkbox, so the whole row is the hit target. Selection is keyed by
`date`, which identifies exactly one entry because `save()` dedupes on it.
Clear checked only appears once something is checked, confirms before deleting,
and drops `analysis`/`patterns` — both describe a history that no longer
exists. `reset()` clears the selection too, so a stale one can't survive a
Start over. No select-all: the owner replaced a blanket clear with deliberate
selection, and adding one back would undo the point.

Singular and plural confirms are separate strings. The first version read
"Delete 1 selected check-in(s)?" — visible only by running it, which is why the
live check happens before the commit and not after.

**Same-date note.** "One check-in per day — saving again for the same date
replaces the earlier one," at the top of Today's check-in.

The note was very nearly untrue. `save()` filtered on the raw `entry.date`
while stamping the new row with `entry.date || today()` — different values when
the date is blank, which would have appended a second row for the same day
instead of replacing. Resolved the date once into `stamp` and both the stamp
and the filter now use it. Verified live: 3 entries in, save again for today,
3 entries out, and today's values are the new ones.

**Third wave of key-derived / attribute English** on the dashboard: the four
metric-card labels (an array of literals), the two "keep going / compare"
sentences (ternary operands), the button's loading and idle labels, and the
marked-crash-days sentence (a template literal with inline pluralisation). All
`t()` now. Gate 5 sees none of these shapes.

Spanish spot-check clean — the only English left on the page is the `ENERGY`
category chip, which is app chrome and English by design catalog-wide.
