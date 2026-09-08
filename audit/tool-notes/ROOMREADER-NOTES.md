# Read the Room (was RoomReader) — architecture & lock notes

**Known-good:** tag `readtheroom-v2` · golden `audit/room-reader-golden-sample.json`
(14 cases — one per endpoint, all live-captured 2026-09-08)
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
