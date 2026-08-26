# Drive Home — architecture & lock notes (v3, 2026-08-25)

Pre-drive decision helper. One question: should you start this drive right now?
`MODELS.SMART`, `max_tokens 3400`, no tools, single `POST /api/drive-home`
(`action: 'assess'`). Returns `recommendation` (`go` | `pause` | `do_not_drive`)
plus headline, summary, main_concern, factors_harder, factors_in_favor,
before_you_decide, safer_options, prep_checklist, watch_for, limits.
`router.outputStandard = 'v2'` with a real `router.outputGuard` profile. In
`LOCALIZED_TOOLS`.

- **Golden:** `audit/drive-home-golden-sample.json`, 4 cases. Verify: `npm run check:golden drive-home`.

## What v3 removed, and why it is not coming back

v1 ran `web_search` and spoke about the route: "the SR-520 floating bridge is
known for crosswinds", "the I-405/I-90 interchange near Factoria is a known
high-pressure merge zone", "rear-end collisions spike on rain-slicked I-405".
It had never seen the road. It also returned a `risk_level` and an
`honest_assessment`, which read as a safety rating on a drive it could not
assess. All of it is gone: no web search, no risk score, no certification, and
place names are context only.

The emergency alarm, the 30-second auto-SOS, the SMS composer, the shared
contact list and the three-tab layout went with the rewrite (owner, 2026-08-25).
What remains is an arrival reminder that runs in the visitor's own browser and
contacts nobody. ~95 `dh_*` keys were retired with those features.

## DO NOT silently reverse

1. **`driver_state: 'very_tired'` is a server-side boundary.** It returns
   `do_not_drive` from `UI_STRINGS` **without calling the model at all**. Never
   route it through the prompt "for a better explanation" — the whole point is
   that no amount of context can talk it round. Golden case 4 locks this.
2. **`factors_harder` is empty on that path on purpose.** It used to echo the
   form back through the English `TIME_LABELS` / `CONDITION_LABELS` constants,
   so a German reader got "Time: late night" and "snow or ice" sitting inside
   otherwise translated text. It also added nothing to a do-not-drive call.
3. **`recommendation` is pinned to English in the prompt.** `withLanguage`
   translates JSON string *values*, so without the pin a German run returns
   "Los" and `sanitizeResult` silently falls back to `pause` — a wrong verdict
   in twelve languages with no error anywhere. The rule is in the OUTPUT block.
4. **`finalise()` runs again after `runOutputGuard`.** The guard's repair writes
   into the object *after* sanitisation, so a repaired field re-enters
   unfiltered — one live run came back with an empty string sitting in
   `watch_for`. Anything the sanitiser guarantees has to be re-established once
   the guard has had its turn.
5. **`cleanList` dedupes.** The repair reprinted one `factors_harder` entry
   verbatim; exact duplicates are dropped. Near-duplicates it cannot catch, and
   the repair does occasionally produce a longer paraphrase of a sibling.
6. **`UI_STRINGS` carries the catalog's thirteen languages** — `en es zh hi ar
   pt fr de ja ko ru th vi`. The version this replaced shipped `it` and `nl`
   (which the product does not offer) and omitted `th` and `vi` (which it does),
   so Thai and Vietnamese silently fell back to English.
7. **`limits` is ONE server-written string** and the frontend renders it and
   nothing else. The card used to hold a heading, the backend's two limit
   strings and a note, three of which said the same thing. The backend
   overwrites it on every path so the model cannot delete the disclaimer.
8. **Three guard terms exist because of one real output** (owner, 2026-08-25):
   `supplied_fact_upgraded` — rain restated as "low-visibility weather", evening
   plus heavy traffic restated as "evening commute conditions"; joining two
   supplied facts into a claim about their cause is an invention even when it
   sounds obvious. `invented_recovery_interval` — "wait 20-30 minutes", food or
   a hot drink offered as evidence the driver will be alert enough; nothing
   establishes how long this person needs, so the shape is wait somewhere safe
   and reassess, go only if you feel clearly alert. `invented_person_or_
   circumstance` — "ask a colleague still in the office", "if someone at home
   can collect you"; offer the category conditionally, never populate it.
   **Golden case 5 is this exact input.** Structure alone will not catch a
   regression here — read it after any prompt change.
9. **Sections are clamped by verdict in `finalise()`, not by the prompt.**
   `watch_for` and `prep_checklist` are GO-only; `safer_options` is for pause
   and do_not_drive. `watch_for` is the one that matters: "signs that should
   make you stop" printed under a do-not-start call reads as terms on which to
   go anyway, and it was reaching the page because the frontend condition was
   missing (owner, 2026-08-25). Both the card and `buildFullText` check it too.
10. **`factors_in_favor` is usually `[]` and that is correct.** It is for facts
   about the DRIVING that offset the concern — a short drive, clear conditions,
   a road they said they know. Not an observation about the driver's judgement
   ("the anxiety is tracking a concrete uncertainty"), not a compliment on their
   self-awareness, not a silver lining inferred from the clock ("early morning
   gives time to wait without arriving very late" — nobody said when they must
   arrive). The "What helps" card simply does not render, and the factors grid
   drops to one column so the survivor is not left in half the width.
11. **`safer_options` are options, and each is a different KIND** — resolve the
   unknown, wait and reassess, hand it to someone else, travel another way, do
   not go. Not questions back to the visitor ("Do you have access to…?"), and
   never asserting the person or resource exists. Two entries that differ only
   in wording are one option padded into two; `cleanList` only catches exact
   duplicates, so the distinctness rule is in the prompt.
12. **`before_you_decide` is the tool at its best** and the prompt now says so:
   where one concrete fact would settle it and an official source exists — a
   road-conditions line, a transport authority, a closure or chain-law notice —
   name the KIND of source and say what a closure, a restriction or an advisory
   they are not equipped for would mean. Never a specific number, URL or agency.
   Golden case 2 is this.
13. **`DriveHome` is in `PF22_PER_ITEM_COPY`** (audit/audit_v2-3-2.py). The one
   inline `CopyBtn` copies the departure message — a different artefact with a
   different recipient than the global copy, which hands over the assessment.
14. **The persisted verdict expires after 90 minutes.** S1.7 wants results in
   `usePersistentState`; a pre-drive call that reappears next week wearing the
   authority of a fresh one is a different problem. Stamped and dropped on mount.
15. Option ids are the frontend/backend contract: `daytime evening late_night
    early_morning` · `clear rain snow_ice fog high_wind heavy_traffic
    construction` · `highway city rural mixed` · `fine a_little_tired very_tired
    anxious not_great`. The backend 400s on anything else, in the reader's language.

16. **OUTPUT DISCIPLINE and STATE-SPECIFIC OUTPUT RULES** (owner, 2026-08-25)
   are the general form of rules 8-12 — do not fill a section because it
   exists, prefer one strong item to three generic ones, empty is a correct
   answer. The `cleanList` caps in `sanitizeResult` ARE those rules' numbers
   (harder 5, favor 4, safer 4, prep 3, watch 2); if you change one, change
   both, or the prompt states a limit nothing enforces. A GO answer should come
   out materially shorter than a pause — roughly 1,000 characters against
   1,800-2,100. If they converge, the discipline block has stopped working.
17. **`invented_recovery_interval` has to name its fields.** The term existed
   for a round and the checker applied it only to `before_you_decide` while
   "wait inside for 10-15 minutes" sailed through as `safer_options[0]` in two
   runs of three. WHAT FAILS #8 now says CHECK safer_options AND prep_checklist
   explicitly, and three clean runs came back with none. A guard term that
   names a failure but not where to look for it is half a rule.

## Known, not fixed

- The Try-an-example pill is **1.2:1 in dark mode** — `headerColor #1e2a3a` at
  50% over `#27272a` with PF-17c's prescribed dark ink. Not specific to this
  tool: 92 of 125 tools are under 4.5:1 and six are effectively invisible
  (DriveHome, PlantRescue, SafeWalk, SensoryMinefieldMapper, SpiralStopper,
  PronounceItRight). PF-17c's premise — "headerColor is pale on 119 of 125" —
  holds in light mode and inverts in dark. Catalog-wide decision, not a local patch.
- The repair occasionally grafts one `safer_options` entry onto another, so two
  entries say nearly the same thing. Exact duplicates are dropped; near ones are
  not. An anti-duplication clause was tried in the SHARED repair prompt on
  2026-08-25 and NOT kept: no benefit could be demonstrated over the tool's own
  "each option is a different KIND" rule, and telling every v2 repair not to
  repeat a sibling field is dangerous for schemas that legitimately carry the
  same identifier in several sections.
- The v2 guard check fails open on roughly 1 call in 49 (`maxRetries: 0`, a JSON
  parse error, logged as "check failed — returning the unguarded result").
  Measured across 49 checks this session. That is a deliberate latency trade in
  `backend/lib/outputGuard.js`, left alone.
- With "Start over" showing, the header tagline is squeezed to roughly one word
  per line at 375px in Spanish. Same flex row as every other PF-30 tool.
