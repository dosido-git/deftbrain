# TicketTackler — lock notes (ticket-tackler-v3, 2026-09-15 second rewrite)

## 2026-09-15 (round 2) — owner-supplied full prompt replacement: 5-way verdict, structured pay/contest

Same day as the v2 rewrite below, the owner supplied two complete replacement
prompts (not incremental edits) and asked to swap them in wholesale — same
"replace, don't patch" pattern as v2, applied to itself one round later.

**Verdict taxonomy expanded 3→5.** `WORTH_CONTESTING/VERIFY_FIRST/PROBABLY_PAY` →
`STRONG_REASON_TO_CONTEST / MAY_BE_WORTH_CONTESTING / NOT_ENOUGH_INFORMATION_YET /
LITTLE_BASIS_TO_CONTEST / PAYING_MAY_BE_THE_PRACTICAL_CHOICE`. The extra two states
separate "there's a real issue but a fact could go either way" (MAY_BE_WORTH) from
"the decisive fact simply isn't known yet" (NOT_ENOUGH_INFO) from "the account itself
supports the citation" (LITTLE_BASIS) — three flavors of "not clearly worth it" that
v2 collapsed into one VERIFY_FIRST. Reused for `pay_or_contest.recommendation` too,
which the prompt explicitly says need NOT equal the top `assessment.verdict` — it's a
second pass after `what_may_matter`/`what_to_verify`/`evidence_to_get` are laid out,
so it can land somewhere more specific (verified live: Chicago camera case topped out
at NOT_ENOUGH_INFORMATION_YET, both fields — see golden case
`camera-chicago-verify-first`).

**`what_may_matter[]` gained a `source` field** (`citation | user_account |
supporting_evidence`) — an explicit tag on every claimed fact, matching the prompt's
EVIDENCE DISCIPLINE categories. Field renames: `issue`→`fact`, `supports_it`→
`why_it_matters`. `evidence_that_would_help` is now independently nullable ("if
applicable" in the prompt) — verified live on the fire-hydrant case (item 1: "Nothing
further — this is established" needs_verification, `evidence_that_would_help: null`).

**`evidence_to_get[].urgency` expanded 2→3 tiers**: `today/before_filing` →
`PRESERVE_NOW / BEFORE_DECIDING / BEFORE_FILING` — separates "may vanish, get it now"
from "needed to even decide" from "needed only once you've decided to file."

**`pay_or_contest` restructured from freeform to fields**: was `{recommendation,
reasoning}` (one paragraph); now `{recommendation, supports_contesting,
supports_paying, key_unresolved_fact, next_step}` — each of the first three
independently nullable, `next_step` never null. This is a real behavior change, not
just a rename: the old single `reasoning` string let the model blend "what supports
X" and "what supports Y" into one paragraph a reader had to parse apart; the new
shape forces the model to state each side (or admit one side has nothing) as its own
field, and the frontend renders them as separate labeled lines.

**New field `appeal_conditional_on`** (nullable): when `appeal_letter` depends on an
unverified fact, names it in one sentence; the frontend shows it as a `⚠️` banner
above the letter. Must be `null` whenever `appeal_letter` is `null`, and null when the
letter rests only on already-established facts — not populated defensively. Verified
live: the Seattle sign-hours case populated it ("Confirm the sign's exact posted
hours..."), the fire-hydrant case correctly left both `appeal_letter` and this field
`null`.

**`how_to_file.method_tips` is now independently nullable** — was always populated in
v2 (often with generic filler when nothing was actually verified). Caught a real
frontend bug during verification: the JSX rendered a bare `Tips:` label with nothing
after it when `method_tips` was `null` (the string version, `buildFullText`, already
guarded this correctly — the JSX render didn't). Fixed by wrapping the JSX line in
the same null-check.

**`groundedFacts` pre-pass broadened** from 4 topics (deadline/filing/stages/grounds)
to 6 (+ `fee`, + `enforcement_hours`) per the owner's second prompt ("search the web
... when the answer depends on jurisdiction-specific rules, enforcement hours,
deadlines, procedures, defenses, or fees"). Deliberately did NOT bolt live web_search
onto the main generation call itself — `lib/groundedFacts.js`'s own header comment
documents why that pattern was rejected codebase-wide ("a single search+long
generation held the connection open past the API limit") and why the pre-pass is
stale-while-revalidate instead of blocking (measured: search takes ~50s regardless of
`max_uses`, a bounded await just meant every cold request paid the wait AND got an
empty block). Kept the existing two-call architecture; widened what the pre-pass
asks for. The main system prompt gained a "VERIFY BEFORE ADVISING" section (the
owner's second prompt, inserted after DO NOT INVENT) plus a bridging note explaining
that a supplied `VERIFIED RULES` block counts as established fact, not "needs
verification," and should be cited by source domain when relied on.

**FINAL CHECK section dropped.** The owner's replacement prompts don't include one
(the v2 prompt's self-audit questions) — per "replace, don't patch," it's gone, not
merged back in.

**Frontend tone mapping**: 5 verdicts need 5 visual treatments, but this codebase's
`c` color-config convention only allows the canonical `success/warning/danger` triad
(`audit_v2-3-2.py`'s `BANNED_KEYS` explicitly bans `info` as a key name — a past tool
apparently invented it and the rule was written to stop the drift). Mapped: STRONG→
success, MAY_BE→reused the already-existing `pillActive` (cyan) + `accentTxt` rather
than inventing a banned `info` key, NOT_ENOUGH_INFO→warning, LITTLE_BASIS→new
`neutral`/`neutralTxt` keys (not banned), PAYING_PRACTICAL→danger (red for "the news
isn't in your favor" — same precedent as v1/v2's PROBABLY_PAY/JUST PAY).

**i18n**: 13 languages, scripted exact-line patch again. One genuine collision this
round (not caught until the localization-audit gate flagged it): Spanish and
Portuguese's `tt_letter_copy` values are byte-identical ("Copiar carta"), so a
plain-text anchor match inserted the new `tt_appeal_conditional` line at the wrong
(first/Spanish) location twice and left Portuguese with none — the classic
non-unique-anchor trap. Fixed by hand with line-number-scoped edits once the gate
named the exact missing key + language. Lesson: a per-language scripted i18n patch
needs anchors verified unique across the WHOLE file, not just assumed unique because
each language block is authored once — two Romance languages sharing a short,
common phrase is exactly the collision case script-based patching should expect.

**Golden sample rewritten** (not relabeled) to `ticket-tackler-v3`: all 4 main-endpoint
cases substantively updated for the new verdict tokens, the `source` field, 3-tier
urgency, structured `pay_or_contest`, and `appeal_conditional_on`. Two cases
(`main-en-seattle-sign-hours-conditional`, `weak-case-must-say-probably-pay-en`) are
verbatim live captures from this session's own verification, not hand-authored —
higher fidelity than the DE and Chicago cases, which were adapted from the v2 fixture.
Chicago case renamed `camera-chicago-verify-first` (was `-verify-first` already in
v2, verdict now specifically `NOT_ENOUGH_INFORMATION_YET` rather than the old
`VERIFY_FIRST`).

## 2026-09-15 (round 1) — owner rewrite: build the case the facts support, not the case the AI can imagine

Owner-authored spec covering description/tagline, input, the full LLM prompt, output
tone, and interface. Full replacement, not a patch — see `audit/REWRITE-INSTALL-KIT.md`
pattern (structural change over iterative prose patching); the previous session's
FocusSoundArchitect rewrite the same day established the same pattern for a different
tool.

**Copy.** Catalog `description`/`tagline`/`seoTitle`/`seoDescription`/`guide` in
`src/data/tools.js` replaced — dropped "complete appeal package" and the promise of
one before the tool has even seen the ticket. New tagline: "Got a ticket? See what kind
of case you actually have." Button label "Build my appeal" → "Review my ticket",
because the correct result may be don't appeal.

**Architecture — structural change, not just prompt text.** The old route ran TWO
**unconditional parallel calls**: a case-assessment call and an appeal-drafting call,
merged with `{...appeal, ...case}`. This meant a full appeal letter was drafted for
*every* ticket regardless of verdict — even a hopeless one — because the appeal call
had no visibility into the case call's verdict (a probe at the original 2026-07-26 lock
had already caught this producing a contradictory "worth attempting" appeal under a
JUST PAY banner). The new prompt makes drafting an appeal **conditional on the
assessment** ("draft an appeal only when there is at least one plausible supported
basis"), which those two calls structurally can't express — you can't condition on an
answer you don't have yet. Fix: collapsed to **one call**, `system` = the owner's full
rule doc (identity, evidence discipline, output philosophy), `user` message = ticket
context + one JSON schema covering everything. `MODELS.SMART`, `max_tokens` 4000
(single call, but the schema is smaller than the old case+appeal combined — no
numeric score, no strength enum, no decision-math cost fields). The `groundedFacts`
pre-pass (`ticket-appeal:{city}:{type}`, 14d cache) is unchanged — it's exactly the
"VERIFIED RULES" evidence category the new prompt names.

**Schema.** `{assessment: {verdict, reason}, what_may_matter[], what_to_verify[],
evidence_to_get[], appeal_letter, how_to_file{}, pay_or_contest: {recommendation,
reasoning}, dont_say}`. Verdict tokens renamed **FIGHT/BORDERLINE/JUST PAY →
WORTH_CONTESTING/VERIFY_FIRST/PROBABLY_PAY** (reused for `pay_or_contest.recommendation`
too, for consistent UI styling). Gone entirely: `case_assessment.fight_worthiness`
(the 1-10 numeric score — "implies predictive precision you do not have"),
`defense_angles[].strength` (strong/moderate/weak — same objection), `description`
(the old case-call summary field, folded into `assessment.reason`),
`decision_math.cost_of_paying`/`cost_of_fighting` (routinely invented "$10-20
reduction", "20-30 minutes", "roughly 15-30 minutes online" — exactly the manufactured
decision math the new PAY VS. CONTEST rule forbids; `pay_or_contest.reasoning` replaces
it with prose that weighs strength/evidence/amount-at-stake/procedural-burden using
**only** the user-supplied fine amount, no invented figures). `defense_angles` renamed
`what_may_matter`, each item gaining a `needs_verification` field (previously
implicit) alongside `issue`/`supports_it` (was `how_to_argue`)/`evidence_that_would_help`
(was `evidence_needed`). `evidence_checklist` renamed `evidence_to_get` — same shape,
`item`/`why`/`urgency` unchanged. New: `what_to_verify[]` — genuine uncertainties with
nowhere else to go before this (facts, rules, deadlines); this was the same missing-slot
problem the WhereDidTheTimeGo `whats_still_unclear` addition solved for that tool.

**Nullability is load-bearing, not incidental.** `what_may_matter` and `what_to_verify`
may legitimately be empty arrays — a hopeless case (see the fire-hydrant-style probe
below) returns `[]` for both, and that's correct, not a broken response. `appeal_letter`
is `null` when there's no supported basis to contest. `dont_say` must be `null` (never
an empty-array placeholder or invented filler) unless the user's own account actually
contains something that could hurt their case. Verified live: a knowingly-parked-in-
front-of-a-fire-hydrant account correctly returned empty `what_may_matter`/
`what_to_verify`, `appeal_letter: null`, and a `PROBABLY_PAY` verdict whose reasoning
explained why — no manufactured angle to fill the schema.

**Binaural-style temptation avoided.** Nothing here needed a FocusSoundArchitect-style
"remove capability X" decision — the removed fields (numeric score, strength enum,
decision math) were pure invented-precision, not a real feature anyone used them for.

**Interface.** Removed the pre-submit "Fighting a bigger bill? BillRescue" line and the
post-result BillRescue + ComplaintEscalationWriter cross-ref pair — both ends, like
FocusSoundArchitect's same-day rewrite. Added `TicketTackler` to
`audit/audit_v2-3-2.py`'s `NO_CROSSREF` set **and** its `_pre_exempt` tuple (both are
needed for a tool with zero links at either end — see the FocusSoundArchitect entry in
that file for why one alone isn't enough). Removed the now-unused `linkStyle` const and
two now-dead `c` keys (`meterBar`/`meterTrack` — the case-strength meter bar they
styled is gone with the numeric score). The verdict banner in the results view lost its
strength meter for the same reason.

**Localization.** All 13 languages patched in one script-based pass (exact-line
replace, verified every anchor existed before writing): 6 fields retexted per language
(tagline, submit, building-spinner, evidence_title, letter_title, disclaimer), the
8-line verdict+strength block renamed/retexted (13×), the 4-line decision-math block
collapsed to 1 line (13×), and the 3 cross-ref keys deleted (13×). Caught and fixed by
the i18n-convention-audit gate (not by translation review): Korean `tt_letter_title`
used the banned pronoun 당신 (dangsin) and Japanese used あなた (anata) — both
dropped, matching the existing convention already followed by every neighboring key in
those two languages ("~할 만함", "요確認" etc. never carry the pronoun either).

**Golden sample rewritten**, not just relabeled — the pre-rewrite fixture's
`decision_math` fields contained exactly the invented time/cost figures the new rule
forbids ("20-30 minutes", "$10-20 reduction"), so a field-rename-only migration would
have preserved the anti-pattern the rewrite exists to fix. Rewrote all 4 main-endpoint
cases' `output` substantively: verdict tokens mapped 1:1 (FIGHT→WORTH_CONTESTING,
JUST PAY→PROBABLY_PAY), `pay_or_contest.reasoning` rewritten to drop every invented
number, the weak case (`weak-case-must-say-probably-pay-en`) now correctly has
`appeal_letter: null` and empty `what_may_matter`/`what_to_verify` instead of a
"no-contest mercy plea" letter (that concept doesn't exist in the new prompt — it never
argues for leniency, only for or against contesting), and the Chicago camera case was
reclassified `VERIFY_FIRST` (renamed `camera-chicago-verify-first`) rather than kept as
a weak `JUST PAY` with one throwaway defense angle — the duplicate-paper-citation
question is a genuine unresolved fact, not a supported issue, so it now lives in
`what_to_verify` rather than a padded `what_may_matter` entry.

# TicketTackler — lock notes (ticket-tackler-v1, 2026-07-26)

Parking/camera-ticket appeal builder. Built 2026-07-25 (ad7682a), locked next
day after a 5-case edge probe + fixes. Route `backend/routes/ticket-tackler.js`,
frontend `src/tools/TicketTackler.js`, fully localized (13 langs, allowlisted).

## Architecture (current standards from day one)

- **Parallel split** (latency): case call (case_assessment + defense_angles +
  evidence_checklist, 3500) ∥ appeal call (appeal_letter + how_to_file +
  decision_math + dont_say, 3500). Disjoint keys, merged `{...appeal, ...case}`.
  Guard: `parsed.case_assessment` (top-level, always present). Measured: 39-62s
  cold (incl. grounding), followup 5-6s.
- **Grounded pre-pass** via lib/groundedFacts: cacheKey
  `ticket-appeal:{city}:{type}` (14d TTL). Hyper-local → low hit-rate expected;
  empty result degrades to the generic-channel rule, never invention.
- **Vision**: ticket photo as image content block in BOTH split calls.
- **Positioning guardrail** (DoNotPay FTC lesson): "helps you write your own
  appeal" — no outcome promises in prompts; disclaimer key in UI.

## Probe findings fixed before lock (2026-07-26)

1. **Cross-call verdict contradiction**: appeal call recommended "worth
   attempting" under a JUST PAY banner (it can't see the case call's verdict —
   structural, parallel split). Fix = bottom_line rule: no-defense account →
   recommend paying. Passing the verdict across calls would serialize the
   split; don't.
2. **Hypothetical defenses ranked strong** (stolen/leased-vehicle boilerplate
   the user never claimed) → angles must be grounded in the user's account.
3. **Unverified day-count** ("within 60 days") → day-counts only if VERIFIED
   or user-provided.
4. **Statute cited slightly wrong as certain** (§ 45 StVO variant) → cite
   sections only when certain, else describe the rule.

Verified impressive: grounding produced REAL small-city specifics (Pocatello
blue payment boxes, Schwäbisch Gmünd Ordnungsamt address+email — all
web-checked by the probe agent); honest JUST PAY (fight_worthiness 1) on the
clear-cut case, no sycophancy.

## Recurring bug classes to watch (from catalog memory)

- Enum translation (verdict/strength/urgency badges) — pinned English, guarded
  in golden meta.
- fight_worthiness consumed as `{n}/10` + meter width — bare integer pinned.
- German quote-heavy input — NO_QUOTE_RULE in both split prompts + followup.
- Invented-procedure risk in ungroundable cities — the generic-channel rule is
  the load-bearing defense; probe it in every quality wave.

## Verify

`npm run check:golden ticket-tackler` — 5 cases (small-city EN, quote-heavy DE,
weak-case JUST PAY, camera consistency, followup). Structure only — eyeball
wording after prompt edits.
