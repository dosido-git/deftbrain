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

## The 2026-09-05 micro-pass

A live Kindling probe (Business, "warm, easy to remember") found six more of
the same species — a heuristic dressed as a finding — plus one real gap: the
tool had never actually verified it caught the codebase's most common
current-world overreach, domain status.

| It wrote | It now writes |
| --- | --- |
| "it passes the core tests of memorability and ease" | "it is easy to pronounce and structurally simple enough to test well by word of mouth" |
| "...spelled exactly as it sounds, making it easy to remember and search..." | "...spelled exactly as it sounds, which gives it a good word-of-mouth starting point" |
| "approachable for weekday commuters, soft enough for weekend family visits" | "does not read as overtly corporate or child-focused, and its warmth may fit a neighborhood bakery-coffee setting" |
| "...and potentially other businesses that have used the same word" | "search results may be shared with general uses of the word; business-name conflicts still need to be checked" |
| "kindling.com is likely taken or expensive — variants will probably be necessary" | "worth checking early... do not assume availability or price until a registrar confirms it" |
| "some people may briefly conflate them, particularly in typing or voice search" | "worth testing... the audit cannot establish how often that would happen" |
| "the soft opening consonant and the -ling ending give it a gentle, cozy sound" | "the initial K gives the name a clear start, while the '-ling' ending softens the sound; it may read as informal and warm" |
| "someone who hears it once can almost certainly spell it..."; "no plausible rival word" | dropped — absolutist confidence about an untested name |
| `kindeling`, `kindlng` | `kindeling` only — the second wasn't a plausible mishearing, just generated |

**The domain-price line was the one that mattered most.** "kindling.com is
likely taken or expensive" is a live-world prediction the tool has no way to
make — and nothing in the original `RULES` caught it, because every existing
pattern was scoped to ownership/existence verbs ("is owned by"), not
availability/price verbs ("is likely taken", "will probably be necessary").
New backstop, plus an explicit CORE PROMPT rule, plus the section prose says
so directly: name the check (a registrar lookup), never guess its outcome.

**Two "gives it a [feeling] sound" phrasings look identical to a detector and
aren't.** "The long 'oo' gives the name a rounded, softer sound" is the
tool's own approved example; "the -ling ending gives it a gentle, cozy sound"
is the violation. The difference is EMOTIONAL vocabulary (gentle, cozy, warm)
versus ACOUSTIC vocabulary (rounded, softer) — a regex distinguishing those
reliably enough not to blank the approved example was not worth the risk of
getting subtly wrong, so this one stays prompt-only, same call as the
no-prep/pre-read-timing rules in Justify My Meeting's notes.

**`word_of_mouth.rating` was never pinned.** `verdict` had `pinVerdict`;
`rating` did not — a silent gap from the original rewrite, closed in the same
pass that renamed its middle value (`MAY NEED REPEATING` → `WORKABLE`, to
read as a plain heuristic label rather than a hedge stacked on a hedge).
`pinRating` follows the same pattern, defaulting to `WORKABLE` on anything
unrecognized.

Five new backstops, all unit-tested in both directions alongside the original
seven (24 bad forms fire, 17 legitimate phrasings survive) — full set now 12.

**Three UI-only renames**, no backend involvement: "Live Availability" →
"Availability To Verify" (DNS is real-time; the social handle beside it is
not, so "Live" oversold the whole section); Challenge This Audit's helper
text dropped "run the analysis again independently" (two passes of the same
model are not independent, which is the exact claim the feature exists to
prevent — the description was still making it after the earlier rewrite
fixed the backend prompt); Next Steps' "Keep It" → "Keep Exploring This
Name", because `check_before_you_commit` is a fixed, always-present
checklist by design — there is no code state where "no material unresolved
issue remains" is true, so "Keep It" could never have honestly appeared. No
new conditional logic was added for this; the button already scrolled to the
checklist, and the false-closure problem was entirely in what the label said.

## The judgment rule — bold on the name, cautious on people, verified on the world

Added the same day, immediately after the micro-pass above, because twelve
corrections in a row that all pushed toward more hedging is exactly the
condition that teaches a model to hedge everything, including judgments it
can actually support. Every one of the twelve was individually correct — the
risk was in the aggregate, read without a counterweight.

The CORE PROMPT now says explicitly that epistemic caution and timid analysis
are different failures, and lists what may be stated PLAINLY, without
hedging, when it comes from the name and the supplied context: semantic fit,
category clarity, spelling/pronunciation difficulty, genericness,
flexibility, visual possibilities, obvious associations, naming tradeoffs,
and — in Compare — which candidate is stronger and why. Hedging is reserved
for claims about PEOPLE (what an audience will remember, feel, or infer) and
verification for claims about THE WORLD (trademarks, domains, competitors,
search, handles, popularity, trends) — the same three-way split the CORE
PROMPT already made, just named explicitly enough that it survives being read
after eleven restraint-only rules in a row.

Live probe, a deliberately generic name ("Quality Solutions Group," IT
consulting, wanting distinctive/memorable): verdict RECONSIDER, and the
weaknesses are direct — "almost a parody of generic corporate naming,"
"reads as a placeholder rather than a considered choice," "unremarkable and
likely shared with many other entities" — while `structural_findability` and
`word_of_mouth` stayed correctly scoped to what's actually knowable rather
than turning bold into reckless. This is the calibration to protect: confident
on the name, careful about people, verified about the world — not uniformly
soft.

**The specific hedged phrasings dictated in the micro-pass above were not
reopened.** "It may read as informal and warm rather than refined" was the
user's own literal corrected text for the sound-impression example; the
judgment rule is the general counterweight for everything the prompt doesn't
script line-by-line, not a retraction of a phrasing given minutes earlier in
writing.

## The 2026-09-05 individual-audit + Compare corrections

Four more from a live Kindling probe (bakery/coffee, "warm, easy to remember"),
plus the Compare grounding boundary reintroducing exactly the current-world
claims the single-name audit had already removed.

**A legal-conflation rule, not just a hedging one.** "Trademark registration
for a common descriptive word is harder and more expensive" sounds like
restraint and isn't — it treats "this is an English word" as though it
settles "this word is descriptive of THESE goods/services," which is a
category error: a word can be highly descriptive for one category (Kindling,
for firestarters) and arbitrary — a STRONG mark — for an unrelated one
(Kindling, for a bakery). The tool cannot make that determination on its own.
New rule in COMPETITION & FINDABILITY plus a dedicated backstop. Correct
version: "Because '[name]' is an existing English word, its protectability
and any conflicting uses are worth checking before investing heavily in the
brand" — the check survives, the legal conclusion doesn't.

**SOUND & IMPRESSION needed a second, stricter pass.** The 2026-09-04 rewrite
already banned unhedged phoneme-to-emotion claims ("open vowels signal
approachability"); what survived was the SAME move wearing a hedge: "the
initial K gives the name a clear start, while the '-ling' ending softens the
sound" is still phoneme-by-phoneme analysis, just with softer verbs. The fix
wasn't a stronger hedge — it was moving the unit of analysis. The section now
describes the WHOLE WORD (easy to say, familiar vs. invented, fits the
stated context) and explicitly forbids naming which letter or suffix does
what, hedged or not. No backstop: two "gives it a [feeling] sound"
phrasings look identical to a detector and aren't (the tool's own approved
"rounded, softer sound" example would have false-positived), so this stays
prompt-only — same call as the Justify My Meeting no-prep/pre-read-timing
rules.

**Restraint had quietly eaten the tool's personality, not just its
overclaims.** `word_of_mouth` had been collapsed from five named heuristic
tests into one hedged paragraph over the two prior passes — technically
accurate, and also the thing that made this tool distinctive. Restored as
four named tests (SAY-IT-ONCE, SPELL-IT, NOISY-ROOM, DRUNK), each a short
verdict plus one sentence, with the SAME restraint rules threaded through
each individually rather than one paragraph trying to cover all of them:
`spell_it_test` only names a misspelling that's genuinely plausible;
`noisy_room_test` only names a real near-homophone, never an invented
frequency ("particularly in typing or voice search"); none of the four
assert memorability as an achieved fact or use absolutist language. The
lesson: hedging isn't the same axis as detail. You can cut a tool's specific,
checkable structure while making every sentence MORE cautious, and the
result reads worse, not more honest.

**Evolution Timeline was rendering duplicate entries from repeat audits of
the same unchanged name** — "three Kindli entries," the truncated 6-char bar
label making three identical audits look like three broken ones.
`saveToEvolution` now skips a new entry when the immediately-prior one has
the same name (trimmed, case-insensitive) and the same verdict. The render
guard is independent of that: it counts DISTINCT (name, verdict) pairs
currently in the array and requires at least 2, because data saved before
this fix can still be sitting in a visitor's localStorage — a raw
`length >= 2` check would still render a fake "timeline" built entirely from
old duplicates.

**Compare had reintroduced exactly the claims the single-name audit
removed, in the one place it looks least like a regression.** Comparing two
names naturally invites "which one is occupied" as a differentiator, and
because a real product (Loomly, a social-media scheduling tool) IS
recognizable from training data, the model asserted it as settled fact —
then, by contrast, described the other candidate as "carrying no known
competing brand," which is exactly as unverified as the claim it was
implicitly contrasted against. Compare now states, in as many words, that it
follows the identical verification boundary as the single-name audit. A
recognized name may surface only inside `needs_verification`, phrased
"Worth checking: [name/entity]" — never in `best_quality`/`biggest_risk`,
and never as what `recommendation.why`/`decision_driver` cite as the reason
one candidate won. Verified live: Kindling vs. Loomly for a bakery now wins
on semantic fit ("Kindling has a genuine semantic connection to heat,
warmth, and morning ritual that Loomly simply lacks") with Loomly's product
conflict correctly demoted to a hedged verification item — the exact
opposite of the original bug, where the verdict depended on which name
happened to be free.

**The `stated a live-world ownership fact as settled` backstop needed
widening twice over, not once.** Broadened for Compare to add
product/service/tool to the noun list and allow "a"/"an" — but "is an
existing social-media scheduling product" still didn't fire, because the
noun list required the adjective (existing/active/funded) to sit directly
next to the noun. Real sentences put modifiers between them ("existing
**social-media scheduling** product"). Fixed by allowing up to 40 characters
between the adjective and the noun. Caught by testing the exact sentence
from the bug report, not a simplified version of it.

**A null byte crept into a template-literal edit and made the file invisible
to grep.** `` `${e.name} ${e.verdict}` `` — the space between the two
interpolations came out as `\x00` in one Edit call, for reasons that never
became clear. The file stayed syntactically valid JS (`node --check` and
eslint both passed) and functionally correct (a null character in a Set key
still works for uniqueness), so nothing broke — but `grep`/`ugrep` treat a
file containing a null byte as binary and silently skip it, meaning every
`grep`-based check across this whole session (guard sweeps, key diffs, the
regression test extraction) would have reported false negatives against
this file without ever erroring. Found by chance, because a routine `grep`
for `compareResults` came back with zero hits in a 1600-line file that
obviously uses it dozens of times. Worth an occasional
`python3 -c "b'\x00' in open(path,'rb').read()"` sanity check after an Edit
that composes a template literal by hand, and a reason not to fully trust a
clean `grep` result as proof of anything until the file's byte-validity is
separately confirmed.

## The evidence-boundary consolidation

A bug report plus a rule addition, both from the same root cause: "Clicking
'compare these names' changes focus to the bottom of the page" didn't
reproduce — `78ea2a27` (the focus-scroll fix above) already excludes the
loading phase from the reveal effect, live-tested clean on a fresh tab. Most
likely a stale cached bundle on the deployed site at the moment it was
reported, not a live regression. No code change; a hard refresh should
resolve it.

**The rule addition was real, and it replaced rather than stacked onto the
existing framework.** The user supplied two verbatim blocks — NAME AUDIT —
EVIDENCE BOUNDARY for the CORE PROMPT, COMPARE NAMES — WINNER RULE for the
Compare route — explicitly as ONE compact, generalizable rule rather than
more Kindling/Loomly-specific patching. Both blocks cover almost exactly the
same ground as language already in the prompt (OBSERVABLE / REASONABLE
INTERPRETATION / REQUIRES VERIFICATION; the Compare "follows exactly the same
verification boundary" paragraph) — same three-way split, same "worth
checking" phrasing, same ban on asserting an unverified conflict. Keeping
both would have meant two frameworks the model has to reconcile in one
prompt, which is the kind of redundancy this session has repeatedly found
correlates with truncation and self-contradiction, not extra safety. Replaced
the old DISTINGUISH section (and its follow-up "do not predict a domain's
status" / "do not infer audience response" / "do not confuse epistemic
caution" paragraphs) with EVIDENCE BOUNDARY verbatim, and replaced the old
Compare-specific grounding paragraphs with WINNER RULE verbatim — keeping only
what neither block covers: the "do not perform naming theater" line and the
"do not manufacture a winner merely because the interface asks for one" line.
This was a judgment call, not something explicitly requested — flagged to the
user rather than silently made.

**The sentence the user flagged as most important wasn't in the prompt
before in any form.** "A candidate does not need an external problem for
another candidate to be better" has no equivalent in the old Compare
grounding — that text banned asserting unverified facts, but never told the
model the winner's OWN stated reason is sufficient on its own, which is what
let the model go looking for a supporting problem with the loser even after
correctly picking a winner on the name's own merits. This is the actual
mechanism behind the user's diagnosis of the Kindling/Loomly leak: the model
had already reached the right verdict and then over-justified it.

Verified live against the exact case from the bug report (Kindling vs.
Loomly, bakery, "warmth and approachability"): Kindling wins with
`decision_driver` grounded entirely in semantic fit ("Kindling earns its
warmth from the word itself; Loomly would have to build that association
from scratch"), Loomly's `biggest_risk` is a real semantic gap ("no clear
semantic connection to baking"), not a fabricated competitor/domain/trademark
claim, and no candidate anywhere says "no known conflicts." Also re-ran the
single-name Analyze endpoint on the same input as a regression check on the
CORE PROMPT replacement — `what_could_get_in_the_way` correctly hedges the
Kindle-adjacent product-name collision ("worth verifying what comes up when
someone searches it") instead of asserting it.

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

**`revealSection` on `loading` alone can scroll to the wrong place — this
tool's own header card is why.** The effect fired on `loading || results`,
meaning it ran the instant Submit was clicked, before `results` existed. At
that moment `resultsAnchorRef` is the LAST thing the tool has rendered — no
results yet — so its position is dominated by whatever page chrome (footer,
guides, newsletter) follows the component, not by the tool's own content.
Name Audit's input form is unusually tall (12 context chips, 3 optional
fields, a growing audit-history block), which pushed the anchor far enough
down that the premature scroll read as "jumped to the bottom of the page."
A second, correct scroll fired moments later once results arrived, but the
first jump had already happened and was what a visitor actually saw. Fixed
by dropping `loading`/`compareLoading` from the trigger entirely — the
anchor now only fires once there's real content to point at. Worth checking
other tools with an unusually tall input form for the same `loading ||
results` trigger pattern; a short form may simply never have exposed this.

**"Widen the submit button" means change `flex-1` to `w-full` — nothing
else.** Fixed once as a one-line swap (`flex-1` is a no-op without a flex
parent), which correctly widened the button but left `py-4 px-6 text-lg
shadow-lg` in place — sizing that read as merely large on the old
shrink-to-fit button became a visibly oversized, overlapping-with-the-⌘↵-hint
button once stretched full width. The established pattern for a wide submit
button with the kbd hint, already proven in Money Diplomat and BatchFlow, is
`relative w-full px-4 py-3 rounded-xl text-sm font-bold ... min-h-[48px]` —
smaller padding and font than feels intuitive, because the width is what's
supposed to carry the visual weight, not the padding. Match that pattern
exactly rather than reasoning about it fresh next time.

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
