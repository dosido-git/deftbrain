# Name Audit — tool notes

Grounding rewrite, 2026-09-04. The tool was good at sounding like a naming
consultant with a measuring instrument, and it didn't have one — a 72/100
overall score, eleven separate 0-10 dimension scores, a radar chart, and a
"clean global language profile" after a scan across 15+ languages that never
happened.

## North star

Name Audit is strongest when it answers **"what can I actually judge from
this name, and what still needs a real check before I commit?"** It is
weakest pretending to have measured something it only estimated, or to have
verified something it only recalled.

**Be confident about the name itself — spelling, structure, pronunciation
possibilities, structural findability. Be appropriately tentative about
impressions, tone, and fit. Never silently promote a REQUIRES VERIFICATION
fact — trademark status, company existence, competitors, search results,
domain/social availability, cultural meaning — into something stated as
settled.**

## What it was doing

The Loomly probe (the reference case both audits use) produced "virtually no
pronunciation disagreement across accents," "open vowels signal
approachability... L consonants add fluency without authority" (branding
folklore stated as behavioral science), a "clean global language profile"
after no actual multilingual review, live-sounding claims that Loomly "is an
existing, funded company" from model memory rather than a lookup, and a
personified "if it were a person, this name would be a capable but unhurried
collaborator."

Elsewhere: an Audience Reaction Simulator that invented personas and reported
what they supposedly thought, remembered, and trusted; a Pronunciation
Confidence Map that assigned a ✓/~/✗ per-country accuracy score from a
letter-pattern heuristic with zero linguistic grounding; a "Name Psychology"
section running bouba/kiki phoneme analysis and vowel-based "size symbolism"
entirely client-side; DNS resolution labeled `likely_available`/`taken` as
though it were a registrar check; five social platforms HEAD-requested and
labeled `likely_available`/`likely_taken` from a 404 that platforms return
inconsistently; a Second Opinion mode that treated two AI generations
agreeing as "reliable signal"; and a Deep Dive default framework built on
Funding Appeal, Talent Attraction, and Acquisition Proof — none of which the
name itself can answer.

## What changed

`NAME_AUDIT_CORE` prepends every route: the OBSERVABLE / REASONABLE
INTERPRETATION / REQUIRES VERIFICATION split. Numeric scoring is gone
entirely — `overall_score`, `section_scores`, the radar chart, and every
`estimated_score`/`0-10` field. The headline is a pinned five-value `verdict`
(`STRONG FIT | GOOD FIT | MIXED | HAS PROBLEMS | RECONSIDER`) instead of a
72 that implied precision the analysis never had.

| Then | Now |
| --- | --- |
| `overall_score`, `section_scores`, radar chart | `verdict`, pinned English |
| "Name Psychology (Sound Science)" — phoneme-to-trait claims | "Sound & Impression," hedged, folded into `how_it_sounds` |
| 5 boolean memorability tests (day-after, tell-a-friend, phone, drunk, shout) | `word_of_mouth.rating` (LIKELY EASY / MAY NEED REPEATING / LIKELY CONFUSING) + why |
| "Global Language Scan" across 15+ languages, "clean" claim | `language_flags`, only what's identifiable with reasonable confidence; omitted (not "cleared") when nothing surfaces |
| Competitive Landscape + SEO, model-memory claims of existence/funding/dominance | `competition_and_findability` — structural findability only, `checks_needed` for the rest |
| `tld_analysis` (typosquatting risk, trust signal — all invented) | removed entirely |
| DNS `taken` / `likely_available` | `dns_detected` / `no_dns_detected` / `unknown`, with an explicit "not a registration check" disclaimer |
| Live social HEAD-check, `likely_available`/`likely_taken` per platform | `suggested_handle` — deterministic string formatting, no network call, no availability claim |
| Emotional Resonance — "if it were a person..." | "Tone & Associations," no personification |
| Audience Reaction Simulator — fabricated personas | "Test It With People" — a real 5-question protocol, static, no API call |
| Deep Dive default: Funding Appeal, Talent Attraction, Acquisition Proof | Distinctiveness, Category Fit, Room to Expand, Word-of-Mouth, Visual Use, Search Ambiguity, Verification Checks |
| Second Opinion: score/grade comparison, "agreement = reliable signal" | "Challenge This Audit" — `holds_up` / `worth_reconsidering` / `missed_the_first_time` / `facts_to_verify` |
| Pronunciation Confidence Map (frontend, letter-heuristic ✓/~/✗ per country) | removed entirely |
| Name Psychology Profile (frontend, bouba/kiki + vowel size symbolism) | removed entirely |

**The two frontend-only features were the biggest surprise.** Neither was in
the supplied spec — they were pure client-side pseudo-science bolted onto the
results view, computing a per-country pronunciation "confidence" from regex
letter-matching and a phoneme-to-personality profile from vowel/consonant
counts. Both directly contradicted the rewrite's own first rule ("do not make
an ordinary observation sound scientific") and both are exactly the kind of
thing no backend prompt change would ever touch. Found by reading the whole
file before touching it, not from the spec.

## A live bug the first probe caught

`how_it_looks.issues` came back as the **string** `"null"` on the very first
live call — not a JSON null. The schema hint said `"issues": "Specific trap or
null"`, and the model answered the word literally. Every card in the frontend
renders `field && (...)`, and a non-empty string is truthy, so this would have
rendered a visible "null" in the issues box. This is a documented codebase
trap (see `deftbrain-voice-prompt-traps` memory, and `crisis-prioritizer.js`'s
`nullifyNullStrings`): `validateResult` now normalizes any string value that
is literally `"null"` (case-insensitive, trimmed) to a real `null` before
anything else runs, across all five endpoints. Caught by running a live probe
before recording the golden — a synthetic test would not have found it, since
nothing in the schema itself looks wrong.

## Deterministic backstops

Seven, in `RULES` inside `validateResult`, unit-tested in both directions (14
bad forms fire, 9 legitimate phrasings survive): `INVENTED_SCORE` (a number
leaking into prose — "scores about 74," "8/10" — now that no schema field
asks for one), `CLEAN_GLOBAL_CLAIM` ("clean global language profile,"
"globally safe"), `LIVE_WORLD_ASSERTION` (unhedged "is owned by / trademarked
by / an active, funded company" — hedge-spared, since "may be owned by" is a
different, legitimate claim), the fictional-personality rule, the
phoneme-folklore rule (hedge-spared), the pronunciation-universality rule, and
`AGREEMENT_AS_RELIABILITY` for Challenge This Audit.

**The score-leak rule needed a second pass.** The first regex required
`scores` to be immediately followed by a number; "scores **about** 74" walked
through it. Widened to allow `about`/`around`/`roughly` between the verb and
the digit, then retested.

## Things allowed, deliberately

- **A stable, well-known name collision, stated as what it is.** The Compare
  probe correctly said "Verdana is one of the most widely recognized
  typefaces in the world, created by Microsoft" as fact — that is common
  knowledge, not a REQUIRES VERIFICATION current-lookup fact — while putting
  the actually-uncertain part ("whether Microsoft's trademark coverage
  extends beyond typefaces into software") in `needs_verification`. The CORE
  PROMPT's three-way split has room for this distinction and the model found
  it unprompted; worth watching if future probes blur the line.
- **The drunk test and its four siblings survive as reasoning heuristics**,
  just not as five separate boolean fields. The prompt still asks the model
  to reason about the day-after test, the phone test, the shout test; the
  schema just doesn't force a `true`/`false` per test any more.
- **Context Mockups and pronunciation audio (TTS) are untouched.** Neither
  asserts anything about the world — a business-card mockup with the supplied
  name is typography, not a claim.

## Things that will bite the next person

**`check_before_you_commit` is code-computed, not model-authored.** Five
fixed sentences, conditional only on whether the context shows domain/social
checks (`showDomainChecks`). This was a deliberate call: a model-generated
checklist risks the exact failure the rewrite exists to stop — an item that
quietly implies the check already happened. If this ever needs to get more
name-specific, keep the fixed items and consider ADDING model-generated ones
alongside them, not replacing them.

**`withLanguage` was called wrong on 5 of 6 endpoints before this rewrite.**
`compare`/`fix`/`reactions`/`deepdive`/`second-opinion` all called
`withLanguage(userLanguage)` — one argument. The real signature is
`withLanguage(systemPrompt, userLanguage)`; called with one argument,
`systemPrompt` becomes the language code and `userLanguage` is `undefined`,
so the function returns the language code back unchanged and that gets
pasted into the prompt as if it were an instruction. Only the main
`/nameaudit` route ever called it correctly. All five rewritten routes now
build the full prompt string first and call `withLanguage(prompt,
userLanguage)`, matching the one call site that worked. Worth grep-ing other
old, not-yet-rewritten tools for the same one-argument pattern.

**Guard sweep: 2 of 5 needed fixing, 3 didn't.** `/nameaudit`'s guard moved
from `overall_grade` to `verdict`; `/second-opinion`'s moved from `score` to
`bottom_line`. `/compare` (`candidates`), `/fix` (`approach`) and `/deepdive`
(`sections`) kept their outer field names even though the content inside
changed completely — a reminder that the guard-vs-schema sweep has to check
the actual field, not assume a route changed just because its prompt did.

**Golden filename renamed.** The v1 golden was `nameaudit-golden-sample.json`
(no hyphen), predating the route-file-matches-catalog-id convention; the
route file is `name-audit.js`, and `check-golden.js` derives its expected
path from the CLI argument. Renamed to `name-audit-golden-sample.json` so
`npm run check:golden name-audit` finds it without a special case.

**Storage keys bumped**: `nameaudit-history-v2`, `nameaudit-evolution-v2`.
`nameaudit-context` and `nameaudit-journal` were NOT bumped — their shape
(a plain string, and a name-keyed note list) doesn't depend on the results
schema, so a v1 value restored into the v2 renderer is still valid.

**Evolution Timeline no longer charts a score, because there isn't one.** Bar
height now tracks the verdict's ordinal rank (RECONSIDER=1 .. STRONG
FIT=5) rather than a 0-100 number — a 5-step category rendered as relative
height is a fair encoding; a fabricated percentage would not have been.
`saveToEvolution` and the tooltip were updated together with the storage-key
bump, in the same commit, per the Magic Mouth rule.

**168 i18n keys kept, 60 added, 167 removed** (Psychology, Pronunciation Map,
Radar, Reactions, TLD/domain-tests, old field labels — everything the removed
frontend features touched). The full `nau_` catalog was regenerated
programmatically across all 13 languages rather than hand-edited, because a
174-key surgical edit across 13×~430-line blocks is exactly the kind of job a
script gets right and a human doesn't. **Nine kept keys needed a content
override, not just a carry-over**, because what they described changed even
though the key name didn't: `nau_evolution_desc`/`nau_evolution_tooltip`
(referenced a score that no longer exists), `nau_second_desc` (said
"Agreement = reliable signal" — the exact claim the rewrite bans),
`nau_fix_heading` (promised "Improved Variations," which the spec explicitly
forbids), and all four `nau_deepdive_desc_*` (described the old, removed Deep
Dive frameworks — one still said "funding potential").

**The i18n key scan had to go past literal `t('...')` calls twice over.** A
first pass using only direct `t('nau_x')` calls found 48 missing keys; Gate 5
agreed. A second, broader scan for every `'nau_...'` string literal anywhere
in the file — catching `t(variableName)` lookups through
`verdictLabelKeys`/`ratingLabelKeys`/`wordOfMouthLabelKeys` objects — found
12 more (`nau_verdict_reconsider`, three `nau_rating_*`, three `nau_wom_*`,
`nau_explainer_sound`, and four others already caught). **Gate 5 itself did
not catch these 12** — its own extraction has the same blind spot. Collecting
keys from literals anywhere in the file, not just direct `t()` call sites,
was already the §12 lesson from Money Diplomat; this is the same trap hiding
one layer deeper, behind an indirection object instead of a `labelKey:`
string literal.

## Endpoints

5 routes (`/reactions` deleted) on `MODELS.SMART` (`claude-sonnet-4-6`), all
through `callClaudeWithRetry`, all v2 output standard (`router.outputStandard
= 'v2'`) with `validateResult` as the declared check.

| Path | Purpose | max_tokens |
| --- | --- | --- |
| `/nameaudit` | Full analysis + verdict | 3000 |
| `/nameaudit/compare` | 2-4 names, recommendation | 4000 |
| `/nameaudit/fix` | Alternative names | 2500 |
| `/nameaudit/deepdive` | Context-specific stress tests | 3000 |
| `/nameaudit/second-opinion` | Challenge This Audit | 2500 |

## Goldens

Seven cases, re-recorded 2026-09-04 against the live backend; the v1 golden
(2 cases) was discarded rather than ported — its expected output was full of
fields (`overall_score`, `section_scores`, `deal_breakers`, `tld_analysis`)
that no longer exist. `npm run check:golden name-audit` checks structure only.
What it cannot see, and what actually matters here: (1) no numeric score
anywhere, in any field, in any language; (2) `language_flags` never claims a
"clean" or "globally safe" scan; (3) `competition_and_findability` never
asserts a company exists, is funded, or owns a trademark as settled fact —
only well-known, stable name collisions (à la Verdana) may be stated plainly,
with the current/dynamic part routed to `needs_verification`; (4) no
personification in `tone_and_associations`; (5) `how_it_looks.issues` and
`how_it_sounds.alternate_pronunciations` are real `null`/`[]`, never the
string `"null"`.

| Case | What it catches |
| --- | --- |
| `analyze-business-domain-checks` | The Loomly reference case — every violation in "What it was doing" above, in one probe |
| `analyze-baby-sparse` | `Baby` is not in the domain-check context list → `live_availability` must be `null`; nothing invented from absent industry/audience/priority |
| `compare-three-names` | Verdana's real collision stated as fact, its trademark scope routed to `needs_verification`; no numeric score; pinned verdicts |
| `fix-this-name` | No `estimated_score` anywhere; `direction_to_explore` not `naming_direction` |
| `deepdive-business-default` | The new Business/Product framework, not Funding Appeal/Talent Attraction/Acquisition Proof |
| `deepdive-pet` | The framework actually swaps per context; Multi-Pet Confusion not invented when no other pet name was supplied |
| `challenge-this-audit` | No score/grade grid; no "agreement = reliable signal" language |
