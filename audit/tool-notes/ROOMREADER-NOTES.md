# Read the Room (was RoomReader) — architecture & lock notes

**Known-good:** tag `readtheroom-v2` · golden `audit/room-reader-golden-sample.json`
(16 cases — one per endpoint plus 2 dedicated regression cases, all
live-captured 2026-09-08)
**Verify:** `npm run check:golden room-reader` (backend up: `npm run dev:backend`)

## What it is

A social-situation coach reorganized around 4 moments — Prepare / Right Now /
Decode / Afterward — each exposing 2-4 contextual actions, instead of the old
13 flat modes. Frontend `src/tools/ReadTheRoom.js`. Backend
`backend/routes/room-reader.js` — 14 endpoints (2 new: `-stalled`, `-exit`;
2 dropped: `-energy`, `-ladder`, folded into `-depth`), all `MODELS.SMART` via
`callClaudeWithRetry` + `withLanguage`, on `router.outputStandard = 'v2'` with
`runOutputGuard` on every endpoint.

## V2 rewrite (2026-09-08) — owner brief

The v1 tool was pitched and written as a confident mind-reader: it predicted
exactly what the other person would say next (`they_say`), assigned a numeric
awkwardness score (`how_bad_really` 1-10) and a numeric read-confidence
(`pretty sure | likely | ...`), inferred someone's `likely_personality` from a
job title or one interaction, invented group hierarchies and cliques nobody
described, stated cultural generalizations ("people in X expect...") as fact
about the specific people involved, and auto-added model suggestions to the
Playbook as if the visitor had already validated them. The interface also
made a first-time visitor read a 13-item mode taxonomy before the tool could
help at all.

**What changed:**

- **Navigation collapsed to 4 groups x contextual sub-actions**: Prepare (an
  event / one person / a group / a cross-cultural situation), Right Now
  (something to say / conversation stalled / said something awkward / need to
  leave), Decode (what did that mean? / go deeper or back off?), Afterward
  (debrief / follow-up / something went badly). Saved Plans and the Playbook
  are utilities in the header, not modes.
- **Every schema rewritten** to remove: predicted dialogue as fact (replaced
  with "if they respond this way..." branches, at most 1-2), numeric
  confidence/severity scores (`my_read.label` is now a qualitative pinned
  enum — see below), `likely_personality` (replaced with `what_you_know` /
  `what_you_dont_know_yet`, grounded only in supplied clues), invented group
  hierarchy/alliances (replaced with `what_you_know` naming only supplied
  structural facts), `dangerous_topics`/cultural facts stated flatly
  (replaced with `norms_worth_checking` framed as tendencies to verify, plus
  `when_in_doubt`/`graceful_recovery`), exact no-reply timelines (replaced
  with qualitative timing tied to context), "how it probably looked from the
  outside" (replaced with `another_way_to_read_it`, grounded in the same
  supplied event), and forensic-sounding `signals_you_missed`/invented moods
  (Autopsy → "Afterward: Something Went Badly", every `plausible_turning_points`
  entry must cite an actual supplied event).
- **A CORE_SYSTEM prompt is shared across all 14 endpoints** (`section()`
  helper in `backend/routes/room-reader.js` composes it with each endpoint's
  specific rules) — the epistemic rules (OBSERVED/REASONABLE POSSIBILITY/
  UNKNOWN, no predicted dialogue, no fixed gesture meanings, "don't
  overcorrect into uselessness") apply identically everywhere, rather than
  being re-derived per mode as in v1.
- **Pinned English enums** the frontend switches on, never translated:
  `my_read.label` differs per endpoint (Decode: `leans one way | several
  plausible reads | not enough to tell`; Depth/Stalled: shouting-case 3-value
  enums), `do_you_need_to_fix_it.answer` (`PROBABLY NOT|MAYBE|LIKELY YES`).
  Mapped to display text via `DECODE_LABEL_KEY` / `DEPTH_LABEL_KEY` /
  `STALLED_LABEL_KEY` / `RECOVER_ANSWER_KEY` + the `pinned()` helper.
- **Playbook additions are now always visitor-triggered.** v1 auto-called
  `addToPlaybook` whenever a debrief/autopsy response happened to include a
  suggestion string. Now there is a manual 💾 button on each Debrief "win"
  card (`addToPlaybook(w.what, ...)`) — nothing is saved without the visitor
  clicking it. `next_time.add_to_playbook` no longer exists in the Autopsy
  schema at all.
- **PF-31 gap fixed as a side effect of the rewrite**: the shared `InputCard`
  component did not render the ⌘↵ chip even though the global keyboard
  handler covered every mode — only the two modes with a hand-rolled button
  (old Quick, old Recovery) had it. `InputCard` now renders it for every
  group/sub-action.
- **Persisted key bumped**: `room-reader-plans` → `room-reader-plans-v2` (the
  saved-plan payload shape changed with the Prepare→Event schema rewrite —
  old plans stored `vibe_check`/`pep_talk`, which this file no longer reads).
  `room-reader-playbook`, `room-reader-history`, `room-reader-saved`,
  `room-reader-people` are unchanged in shape and keep their v1 keys.
- **Catalog rewritten** (`src/data/tools.js`): tagline, description, primer,
  and guide all described the v1 13-mode tool and its mind-reading claims.
- **Retranslated i18n**: 265 total `rr_*` keys across 13 languages — 146 kept
  verbatim from v1 (generic UI chrome: event/scenario/relationship/comfort
  option labels, placeholders, error strings — meaning unchanged), 119 newly
  written (the 4-group nav labels, every new/changed result field, `rr_tagline`
  updated to match the new tagline). Cross-validated key-for-key against a
  grep of every `t('rr_...')` call and label-map entry in the frontend before
  assembly — zero drift either direction.

## Live verification (2026-09-08)

The account's Anthropic API key hit its usage cap mid-session, then reset
before the rewrite's turn was finished. All 14 endpoints ended up live-tested
in English; the recovery flow also got a full Spanish pass (pinned-label
translation, UI-chrome translation, and epistemic discipline in the model's
own Spanish output all confirmed).

**A real bug surfaced during this pass and was fixed.** `room-reader-stalled`
and `room-reader-recover` were missing the character-for-character
enum-pinning instruction that `room-reader-decode` and `room-reader-depth`
already had. On the first live test, stalled's `my_read.label` came back as
the paraphrased `"PATTERN SUGGESTS WINDING DOWN"` instead of the pinned
`"PROBABLY WINDING DOWN"` — harmless in English (the frontend's `pinned()`
helper falls back to displaying the raw string), but it would have rendered
untranslated in every other language and silently broken the "code value, not
display text" contract. All four pinned-enum endpoints now carry identical,
stronger wording ("copied character-for-character... never paraphrase it, add
words to it, or invent a fourth option") and were re-verified correct after
the fix.

`runOutputGuard` caught and repaired real violations (mind_reading,
unsupported_prediction, invented_fact) on `room-reader-exit`,
`room-reader-depth`, and `room-reader-autopsy` during this pass — every
endpoint had at least one flagged field on at least one of the 15 live test
calls made across both this pass and the earlier one. That is the guard doing
its job, not a sign the prompts are unreliable — the captured golden outputs
are POST-repair, i.e. what a real visitor would actually see.

## PREPARE_EVENT_SYSTEM correction pass (2026-09-08)

The built-in "family holiday" example — three generations, a years-long rift
between the visitor's mother and aunt, a cousin's new partner, two young
children, the visitor's own pattern of always smoothing things over —
surfaced a cluster of invention bugs in `/room-reader` specifically, all
fixed in the same pass:

- **Invented attendees not in the input** ("your cousin's partner" was
  supplied and fine to use; the bug was adding people who were NOT supplied,
  e.g. an uncle or sibling's spouse nobody mentioned). Fixed with an explicit
  DO NOT INVENT ATTENDEES rule plus a FINAL ATTENDEE AUDIT instruction (list
  supplied people/relationships/history/concerns internally, then check every
  named or implied person in the draft against that list).
- **A possible future moment narrated as certain** ("when the moment comes
  where you would normally step in...") — fixed with explicit hypothetical
  framing ("if a tense moment develops and you notice yourself about to step
  in...").
- **Hosting quietly became an obligation to manage tension** — this took
  **three tightening passes** to actually close. First: "since it is his
  house and his stated priority" (a bare invented priority). After the first
  fix: "it is his day to manage" (same invention, reworded). After the second
  fix: "he wants it to go well more than anyone, that means it's his to
  manage, not yours to backstop" (the model built its own inference chain
  from a real supplied fact — wanting a good outcome — to an invented
  obligation). The rule now names that inference chain explicitly as a
  disguised version of the same invention, with the exact phrasing to avoid.
  Re-verify this specific failure mode if the PREPARE_EVENT_SYSTEM prompt is
  ever edited again — it visibly resists correction and needs the sharpest
  wording, not the first draft.
- **A social identity/reputation invented for the visitor** from one stated
  behavior pattern ("the cousin with the quiet reputation I'm actively trying
  to undermine") — fixed; scripts stay playful but grounded (see the actually
  correct output: "I figured I would come say hello before everyone becomes a
  blur").
- **THINGS TO HANDLE CAREFULLY upgrading a possibility into a diagnosis**
  ("that is a structural problem") or inventing a reaction from an unnamed
  person — fixed with explicit grounding language.
- **Scripting who else is present to intervene** ("your brother, another
  adult, the natural flow of conversation" assumes an unnamed adult is
  available) — fixed; now "someone else may respond, or the conversation may
  move on without your help."
- **The visitor's actual stated goal getting quietly reassigned back to
  them** — the concern was "I don't want to be the one who always smooths
  things over," not just "prevent conflict." The rewrite keeps that
  distinction as the center of the plan ("Your goal is not a conflict-free
  day — it is a day where you did not single-handedly hold the peace
  together") rather than routing the visitor back into monitoring seating,
  checking on everyone, or redirecting every difficult topic.

Added as a dedicated golden case
(`prepare-event-family-holiday-no-invented-attendees`) specifically to catch
a regression on this cluster, separate from the simpler
`prepare-event-work-happy-hour` case.

## CORE_SYSTEM correction pass (2026-09-08, third pass) — shared, not event-only

The coworker-dinner Prepare-Event case (Priya, her boss, senior engineers,
product people the visitor had emailed — all correctly drawn from supplied
input, confirming the attendee-invention fix held) still surfaced three
finer epistemic slips. All three are general principles, not event-specific,
so they were added to **CORE_SYSTEM** — shared across all 14 endpoints —
rather than to PREPARE_EVENT_SYSTEM alone:

- **A feeling distributed across a whole room is still mind-reading.**
  "Leaving space to move around is more comfortable for everyone" claims to
  know a group's collective internal state — the same violation as claiming
  to know one person's, just spread out. SOCIAL INTERPRETATION now says so
  explicitly: ground advice in the visitor's own goal or in the mechanics of
  conversation, never in a predicted collective feeling.
- **Status is not an automatic behavior switch.** "Priya's boss is in the
  room — listen more than you talk" invented a deference rule from a title
  alone, with no supplied reason for it. New STATUS IS NOT A BEHAVIOR SWITCH
  section: a title/seniority/age/wealth/fame/authority may be context, but
  never automatically justifies talk-less/defer-more/flatter/impress/avoid/
  seek-out — only the visitor's actual stated goal or situation can justify
  a different behavior. Re-verified live: the corrected output says "you do
  not need to perform for her or avoid her — treat her like anyone else."
- **The visitor's own body language can't be promised a social effect.**
  "The line between quiet and composed is mostly posture and eye contact"
  invents a perception rule and promises a specific read in exchange for a
  specific posture. The existing BODY LANGUAGE section only covered reading
  *other people's* gestures — extended to also cover the reverse direction:
  a suggestion about the visitor's own posture/eye contact/presentation may
  describe an action, never the social meaning it will earn them.

Also fixed: `one_thing_to_remember` claiming "you are not being evaluated on
your small-talk performance" — a direct claim about how the visitor is or
isn't being judged, which the tool cannot know. PREPARE_EVENT_SYSTEM's
encouragement guidance now names this example explicitly alongside the
existing banned reassurances ("literally everyone remembers being new").

Re-verified live on the exact case that surfaced this cluster:
`room-reader-prepare-event` guard PASS with 0 fields flagged — the fix
didn't just relocate the problem into something the guard has to repair.

## Frontend bug fixed the same pass

**The "Recent" history panel did nothing when clicked.** Its header button
called `toggleSection('history')`, but the render check read
`expandedSections.sessionHistory` — two different keys in the same state
object, so the toggle never affected what the render was actually checking.
Fixed by making both use `'sessionHistory'`. Verified live: clicking now
expands the panel and shows the logged entries.

## DO NOT silently reverse

- `my_read.label` / `do_you_need_to_fix_it.answer` staying the exact pinned
  English enum, with the frontend switching display text via the `*_KEY`
  maps — never compare against a translated string.
- No predicted "they will say X" dialogue anywhere — only "if they respond
  this way..." branches, at most 1-2.
- No numeric severity/confidence score on any endpoint.
- `addToPlaybook` staying manual (button click) everywhere — never
  auto-called from a generated response.
- `InputCard`'s ⌘↵ chip — don't let a future hand-rolled button reintroduce
  the old inconsistency.

## Gotchas

- Backend rate limit ~4 req/min; space out manual golden captures.
- Restart the backend after route edits — this session ran under `nodemon`,
  so edits auto-reload (v1's notes assumed a manual restart; that's no longer
  the case in this environment, but don't assume it elsewhere).
- The account-level API usage cap above is unrelated to DeftBrain's own
  per-route `rateLimit(DEFAULT_LIMITS)` — check `/private/tmp/backend.log` (or
  wherever the active backend process's stdout is redirected) for
  `"usage limits"` before assuming a 500 is a code bug.
