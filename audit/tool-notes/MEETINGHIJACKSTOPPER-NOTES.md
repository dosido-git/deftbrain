# Meeting Hijack Stopper — tool notes

**Renamed from Meeting Hijack Preventer on 2026-09-03**, the day after the
plan-first rewrite. Route `backend/routes/meeting-hijack-stopper.js`, component
`src/tools/MeetingHijackStopper.js`, i18n prefix stays `mhp_` and the catalog
file keeps its old name (naming-consistency rule: route file and endpoint follow
the catalog id, the i18n prefix never does). og slug stays
`meeting-hijack-preventer`, so the existing card image still resolves.

## The 2026-09-02 rewrite, in one table

| Then | Now |
| --- | --- |
| Pick a template (Sprint Planning, Retro, Brainstorm…) | Start from what has to be true when the meeting ends |
| Facilitator / Timekeeper / Notetaker, plus Tech Support if "virtual" | No roles unless the meeting needs one |
| Fixed 10% buffer, agenda rescaled up or down to hit it | Fitted to the duration **downward only**; slack the model left is slack it meant |
| Explicit speaking order | Participation chosen from what the meeting needs |
| Cost tracking, success metrics, effectiveness questionnaire | None of it |
| Minutes, decision log, action-item tracker and follow-up email, all pre-generated | One follow-up, generated **after**, from what the visitor captured |
| "Prioritise psychological safety", "neurodivergent-friendly" | Neither, unless the visitor raised it |
| Setup → agenda → review → run → capture | Plan the meeting → keep it on track → capture what matters |

## The things that will bite the next person

**The checkbox wording is load-bearing.** The old set said "one person tends to
dominate" and "quiet participants struggle to contribute". That is a character
sketch, and the model wrote it straight into the plan — scripts addressed to
"the quiet ones", strategies for "the dominator". The list now names
facilitation problems only ("One person takes a lot of airtime"), and the prompt
says in as many words that a selected challenge establishes the problem and
nothing about who causes it or why. Do not let this drift back.

**Five detectors, all unit-tested to fire.** `INFERRED_PERSON`,
`IMPORTED_FRAME`, `INVENTED_LEAD_TIME` (spared when hedged), `INVENTED_AUTHORITY`
and `UNKNOWABLE_SUCCESS`. A rule that never matches reads exactly like a rule
that passes, so prove each one still fires after editing it — run a string that
should be caught, not only one that should pass.

**The agenda fit is one-directional on purpose.** `fitAgendaToDuration` scales
down when the agenda overruns and does nothing when it comes in short. Scaling
up would reintroduce the fixed buffer the brief bans, in reverse.
`scheduled_minutes` and `unscheduled_minutes` are computed in code from the
fitted agenda; `unscheduled_minutes > 0` is correct behaviour.

**Authority is never invented.** With the framework left at "Not sure", the plan
must name who-decides as the thing to clarify rather than assuming an answer,
and "Disagree & commit" must never become a COMMIT ceremony or an escalation to
leadership. Both verified live and locked into the goldens.

**A blank field is a real answer.** The follow-up omits a section nobody
captured rather than emitting a placeholder — the failure the old tool shipped,
which handed you a decision log before the meeting had happened.

**Storage keys were bumped to `-v2`** in the rewrite commit (`meeting-plan-v2`,
`meeting-history-v2`, `meeting-actions-v2`), per the rule learned from Magic
Mouth: a persisted v1 result restored into a v2 renderer crashes the tool for
every existing user.

**Dropped features, deliberately.** The live speaking tracker went with the
structured participant list the new form replaced with free-text "names or roles
that matter". The parking-lot store was folded into Capture's "what's still
open". The template suggestions were built on the effectiveness scores and went
with them.

## The 2026-09-03 grounding pass

A live read of the on-call-split probe found the tool doing four things the
input did not support. The largest was decision authority.

**A framework is not authority.** The tool correctly noticed that nobody had
established who decides if Sam and Priya disagree — and then wrote scripts that
demanded commitment anyway: "I need a yes or a no from both of you", "we can
note a disagreement and still commit to moving forward". Selecting
"disagree & commit" says how the discussion should run. It says nothing about
who may close it. With authority unknown, nothing may require a participant to
commit, vote, accept or enact.

**Success has two branches now.** The old end state was "a split agreed, with
Sam and Priya both committed to it" — an outcome that only counts when the room
agrees, which is an outcome for half the meetings. It now reads: a specific
split is agreed and written down, **or** the exact unresolved question and its
decision owner are identified. `before_people_leave` works either way, and so
does the closing script.

| It wrote | It now writes |
| --- | --- |
| "the three most directly affected" | "the three people whose roles or impact were specifically described" |
| "get Dana's constraints" | "ask Dana how the proposed splits would affect the platform group" |
| "the overlap creates heat rather than progress" | "two people start speaking at once and one point risks getting lost" |
| "no one is actually committed to it" | "the agreement is still vague enough that the next action is unclear" |
| "it needs to be settled today" / "we cannot let that happen again" | "last quarter it stayed unresolved; today the goal is a clear split, or a clear decision path" |

Being *affected* is exposure, not a position. It does not establish a
constraint, a requirement or an objection someone is holding — ask what the
effect would be rather than supplying one. And a previous meeting that ended
unresolved establishes only that. Resolution today is the visitor's goal, not
an external requirement.

New backstops: `DEMANDED_COMMITMENT`, `RANKED_PEOPLE`, `INVENTED_CONSTRAINT`,
`HISTORY_AS_MANDATE`, plus two clauses added to `INFERRED_PERSON` for the hidden
states that had slipped past it by not naming anyone (heat, private intent).
Twelve bad forms caught, eight replacement phrasings verified to survive.

The capture rule is untouched, deliberately: anything left blank stays out of
the follow-up.

## Endpoints

| Path | Purpose | max_tokens |
| --- | --- | --- |
| `/meeting-hijack-stopper` | Build My Meeting Plan | 6000 |
| `/meeting-hijack-stopper/follow-up` | generated after the meeting, from captured input | 2500 |

Both on `MODELS.SMART`, both through `callClaudeWithRetry`, v2 output standard
with `validateResult` as the declared check. The plan endpoint measured ~35s at
60 minutes / 7 people and ~53s with all seven challenges selected — one call,
not the old parallel split, because the schema is much smaller than the nine-key
version that used to take 102s.

## Goldens

Re-recorded 2026-09-03. The v1 golden was discarded rather than ported: its one
case hit an endpoint that no longer exists and expected speaking roles, meeting
artifacts and a success-metrics string.

| Case | What it is there to catch |
| --- | --- |
| `plan-decision-unknown-authority` | framework "Not sure" → must name who decides; 2 challenges → 2 `watch_for`; scheduled + unscheduled == duration |
| `plan-names-supplied-disagree-and-commit` | names supplied so they may be used; no COMMIT ceremony, no escalation; 7 challenges → 7 `watch_for` |
| `plan-bare-minimum` | only a goal and a duration — no invented headcount, platform, roles or lead times |
| `follow-up-full-capture` | an uncaptured owner and date stay empty rather than being guessed |
| `follow-up-only-one-section` | nothing decided → empty arrays, never a placeholder |

`npm run check:golden meeting-hijack-stopper` checks structure only. Four things
it cannot see, listed in the golden's own `_meta.note`, are the ones worth
reading by eye after any prompt change.

---

## Pre-rewrite notes (kept for history)

Structured, hijack-proof meeting agendas + a live facilitator mode (timer, speaking tracker,
per-second cost meter), post-meeting capture, action-item & parking-lot persistence.
**Frontend:** `src/tools/MeetingHijackPreventer.js` (`mhp_` keys, ~1080 lines, 5 modes:
setup/results/facilitator/actions/history). **Backend:** `backend/routes/meeting-hijack-preventer.js`
(1 endpoint, `MODELS.SMART`). **Golden:** `audit/meeting-hijack-preventer-golden-sample.json`
(1 DE max-schema case). Verify: `npm run check:golden meeting-hijack-preventer`.

## Shape
Single endpoint sonnet-4-6 via callClaudeWithRetry + withLanguage + withLocaleContext,
**max_tokens 6000**, guard `!meeting_structure || !facilitator_scripts` (both top-level — fine).
Cost/timer/speaking-tracker are all client-side; hourlyRate never leaves the browser.

## Audit fixes locked here (2026-07-13)
1. **🐛 `virtual_meeting_protocols` empty schema.** The schema emitted `"virtual_meeting_protocols": {}`
   — no keys for the model to fill → the whole "Virtual Protocols" section rendered blank for every
   virtual meeting. **Fix:** defined 5 keys (mute_management, screen_sharing, chat_usage, raise_hand,
   breakout_rooms). Verified DE: all 5 populated.
2. **🐛 `meeting_minutes_template` sync break.** Emitted nested under `meeting_artifacts` but the
   frontend read `results.meeting_minutes_template` (top-level) → never rendered. **Fix:** frontend
   reads `results.meeting_artifacts.meeting_minutes_template`.
3. **🐛 `follow_up_email` + `decision_log` dead renders.** The artifacts section rendered only the
   header (📧 / 🗳️) with no `<pre>` body → the AI-generated templates were invisible. **Fix:** added
   `<pre>` bodies matching the working `action_items_template` block.
4. **⚠️ Truncation.** `agenda_items` uncapped at max_tokens 5000; a 120-min virtual template can run
   long. **Fix:** cap `agenda_items` ≤12, `anti_hijack_strategies` 3-5, `max_tokens` → **6000**.
   Verified DE 120-min sprint: 12 items, ~3567 tok (59% headroom).
5. **⚠️→cleaned:** ~29 annotation leaks (`— one sentence` ×many, `— 3-6 words`, `— 2-4 sentences`)
   that echoed into rendered agenda topics / scripts / strategies.
6. Added the "never place a double-quote inside a string value" JSON rule (German-500 prophylactic).

## DO NOT silently reverse
1. `virtual_meeting_protocols` populated schema (5 keys); frontend reads
   `meeting_artifacts.meeting_minutes_template` + `<pre>` bodies for follow_up_email/decision_log.
2. `agenda_items` ≤12 + `max_tokens 6000`; no annotation suffixes; the no-inner-double-quote rule.
