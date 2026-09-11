# Signal vs. Noise — architecture & lock notes (`signalvsnoise-v2` → `v3` → `v4`)

**Known-good:** tag `signalvsnoise-v4` · golden `audit/signal-vs-noise-golden-sample.json`
(2 cases, live-captured 2026-09-10 — both investing-domain, replacing the v3 career cases; see the
"V4" section below for why)
**Verify:** `npm run check:golden signal-vs-noise` (backend up: `npm run dev:backend`)

## What it is

Paste a contested topic — sleep, diet, investing, parenting, anything with confidently contradictory
advice — and get an evidence-calibration map: what's reasonably well supported, which popular claims
outrun their evidence and how, what's genuinely still unresolved, and a bottom line traceable to the
preceding analysis. **Frontend:** `src/tools/SignalVsNoise.js` (`svn_*` keys, fully localized).
**Backend:** `backend/routes/signal-vs-noise.js` — 1 endpoint that fans out to 2 parallel calls
(signal / noise) merged server-side, `MODELS.SMART`, `max_tokens: 3000` each, `router.outputStandard
= 'v2'` with `router.outputGuard`.

## V2 rewrite (2026-09-09, full owner-supplied spec)

The v1 tool was pitched as an epistemics expert with real authority: it asserted "real consensus,"
named specific actors as "generating noise" and stated their incentives as fact, and — most
seriously — invoked specific research designs, biomarkers, genetic variants, and validation findings
from memory as though it had performed a sourced, current literature review. It never had that
capability; the sleep-optimization example that prompted this rewrite showed the tool inventing
exactly that authority on a topic it was never given sources for.

**Full schema rename** (every field), reflecting the new epistemic framing rather than v1's
confident-expert voice:

| v1 | v2 | why |
|---|---|---|
| `why_this_field_is_noisy` | `framing` | 1-2 sentences on the central distinction, not a causal essay on why the field is contentious |
| `the_signal.items[].why_we_know_this` | `.basis` | the general kind of evidence, never invented citations |
| `the_signal.items[].the_nuance` | `.limits` | what the claim does NOT establish |
| `genuinely_debated[].side_a` / `.side_b` | `.what_supports_one_view` / `.what_supports_another_view` | names the evidence, not a "side" |
| `the_noise[].the_problem` | `.what_went_wrong` | + new `.what_the_evidence_supports_instead` — every noise item must offer the defensible version, not just the complaint |
| `the_bottom_line.what_to_do` (string) | `.supported_takeaways` (array) | a synthesis is rarely one sentence; forcing it to be one sentence is exactly how v1 ended up with oddly specific single prescriptions |
| `the_bottom_line.what_to_ignore` (string) | `.treat_skeptically` (array) | same reasoning |
| `the_bottom_line.the_honest_uncertainty` (string) | `.what_would_change_the_answer` (array) | reframed from a vague uncertainty statement to a concrete "what would move this" list |
| `sources_of_noise[].actor` | `.source_type` | a general mechanism ("consumer product marketing"), never a named or implied actor |
| `sources_of_noise[].incentive` | `.how_it_distorts` | describes the distortion mechanism, not a motive |
| `sources_of_noise[].how_to_spot_it` | `.how_to_recognize_it` | unchanged in spirit |

`noise_type` enum: dropped `ideology` (the new PERSONALITY explicitly forbids labeling a claim
"ideology" merely for being extreme, popular, or political — rule 6), added `weak_evidence`. Frontend
`NOISE_TYPE_CONFIG` and the i18n badge (`svn_nt_weak_evidence`, deliberately plain "Weak Evidence" —
no emoji — matching the owner's exact supplied text, unlike its emoji-carrying siblings) updated to
match. The prompt also explicitly forbids `ideology` as a `noise_type` value.

**16 epistemic rules in `PERSONALITY`**, the actual substance of the rewrite:

1. No fake literature review — never imply a search/review was performed; no invented studies,
   researchers, journals, genes, statistics, or dates from memory.
2. Calibrate the claim itself, not just the hedge sentence under it — "a confident-sounding sentence
   with a nuance sentence underneath is still an overclaim."
3. Five internal categories (SUPPORTED / OVERSTATED / WEAKLY SUPPORTED / UNSETTLED / UNKNOWN HERE) —
   not every topic needs every category.
4. "Noise" ≠ "false" — noise can be an absolute claim from conditional evidence, correlation
   presented as causation, a population average turned into an individual prescription, etc.
5. No invented motives or conflicts of interest — a company/researcher/industry is never said to be
   "generating noise" because they profit, unless that relationship is supplied or verified. May
   describe incentive structures conditionally ("products built around a simple claim can create
   incentives to...").
6. Never label a claim "ideology" merely for being extreme, popular, political, or unconventional.
7. No false balance — "genuinely debated" is for meaningful unresolved questions, not automatic
   two-sides-equal-space.
8. No false consensus — a conventional-sounding claim doesn't earn THE SIGNAL if the evidence is
   actually mixed, indirect, or still developing.
9. User-supplied context is for relevance, not diagnosis — never infer diagnoses, risk level,
   motives, habits, medical/financial status, or unstated goals from it.
10. Health/finance: never turn population evidence into an individualized medical or financial
    instruction. Prefer "what this supports as a general rule" / "worth discussing with a clinician."
11. No invented precision — no unsupported percentages, probabilities, exact thresholds, timelines,
    or effect sizes.
12. Source discipline — if the visitor supplied a claim but not its source, evaluate the claim
    itself; don't reconstruct what the original speaker's evidence must have been.
13. Practical advice must trace to the preceding analysis — no generic lifestyle advice appended.
14. Omit empty sections rather than manufacturing noise/debate/uncertainty to fill the schema.
15. Plain, calm, non-ideological language; explain technical terms; "you" only for the visitor's own
    supplied context.
16. DeftBrain Output Standard V2 generally (grounded claims, explicit uncertainty, no invented
    biography, no fake precision, progressive disclosure).

**New `NO_QUOTE_RULE`** — v1 never had it at all; added for the first time this pass (the frontend
wraps `the_noise[].claim` and the model can easily quote a phrase from visitor-supplied conflicting
advice, exactly the failure class that has taken other tools down in non-English languages).

**New `router.outputStandard = 'v2'` + `router.outputGuard`** — v1 had zero output checking despite
being an "epistemics expert" whose entire job is calibrating confidence. 12-entry prohibit list, one
per major failure mode in PERSONALITY (fake literature review, overclaimed confidence, invented
motive, ideology-labeling, false balance, false consensus, context-based diagnosis, individualized
health/finance instruction, invented precision, reconstructed unsupplied sources, untraceable
recommendation, manufactured filler item).

**Structural validation pass, run AFTER `runOutputGuard`** (owner-supplied, hardened slightly): drops
any `the_signal`/`the_noise`/`genuinely_debated`/`sources_of_noise` item missing a required field, and
caps each array's length. Placed after the guard call, not before — the guard mutates its argument in
place and its repair pass can leave a field blank or incomplete despite being told not to; a pre-guard
filter only catches gaps in the raw model output. Same lesson learned live on ScamRadar and Sensory
Scout earlier the same session; `nonBlank()` (checks `typeof === 'string' && .trim().length`) was used
instead of the supplied bare `Boolean`/truthy checks, so a whitespace-only field is also treated as
missing.

## Frontend changes

- **Fixed a live tagline double-icon bug while doing this pass.** The old JSX used
  `tool?.tagline ?? t('svn_tagline')`, and the catalog tagline never carried a leading emoji, so the
  bug was dormant. The new catalog tagline (`📡 Find what holds up — and what doesn't.`) does carry
  one, matching the `toolTagline()` convention — so the JSX now uses `t('svn_tagline')` only (kept
  emoji-free), same fix as Sensory Scout's identical pattern.
- **THE NOISE and STILL UNSETTLED (was GENUINELY DEBATED) headers dropped their item counts** — both
  are now static strings, not `{header_a} {count} {header_b}` — collapsing the old two-part i18n keys
  (`svn_noise_header_a/b`, `svn_debated_header_a/b`) into one each (`svn_noise_header`,
  `svn_debated_header`).
- **Noise card claim text is no longer wrapped in quote marks** in the JSX — matches the supplied
  mock's unquoted `[CLAIM]` style.
- **THE BOTTOM LINE renders three bulleted lists now, not three single-sentence paragraphs** — each
  sub-section (`✓ What Holds Up` / `⚠ Treat Skeptically` / `? What Could Change the Answer`) renders
  independently and only when its array is non-empty; the whole card is omitted only if all three are
  empty.
- **Sources-of-noise cards gained a small eyebrow label** (`svn_source_mechanism_label`, "Source /
  Mechanism") above the mechanism name, since `source_type` alone reads more like a category than a
  named thing the way `actor` used to.
- **`buildText()` (copy-to-clipboard) fully rewritten** for the new schema, including three new/
  repurposed copy labels for the bottom line's three arrays.

## Catalog / guide content

Rewrote `description` and `tagline` (owner-supplied text) plus `seoDescription`/`seoTitle`,
`guide.overview`, `guide.howToUse`, `guide.example.result`, and `guide.tips` — the old guide text
described v1 behavior no longer true (`guide.tips` literally said "the 'sources of noise' section
names who benefits from the misinformation," which the rewrite explicitly forbids; `guide.example`'s
"if you lift, probably worth it" was exactly the kind of overly specific bottom-line prescription this
rewrite exists to stop generating). `modified` bumped to 2026-09-09.

## Live verification (2026-09-09)

Two cases tested live end-to-end (curl + browser): the sleep-optimization example named in the
rewrite request (EN, no context — this is the case that motivated the whole pass) and the pre-existing
DE nutrition/weight-loss case (with `userContext` supplied, to confirm rule 9/10 hold under real
conditions — the response used the visitor's stated "10 kg" goal only for relevance framing, never as
an individualized calorie/macro prescription, and correctly deferred medical specifics to a
clinician). Both: 0 empty items, correct schema keys, no `ideology` noise_type, no named actors in
`sources_of_noise`, bottom line fully traceable to the preceding signal/noise items. Browser-verified
full render order matches the mock: Analyzing → The Question Underneath the Noise → The Signal → The
Noise → Still Unsettled (collapsed by default) → The Bottom Line → How the Noise Gets Made (collapsed
by default). `npm run check:golden signal-vs-noise` → 2/2 PASS.

## DO NOT silently reverse

1. **The full field rename above** — do not reintroduce `why_this_field_is_noisy`,
   `why_we_know_this`, `the_nuance`, `side_a`/`side_b`, `the_problem` alone (without
   `what_the_evidence_supports_instead`), the three-single-string `the_bottom_line`, or
   `actor`/`incentive`/`how_to_spot_it`.
2. **`ideology` stays removed from `noise_type`**, and `weak_evidence` stays added — in the prompt
   enum, the frontend `NOISE_TYPE_CONFIG`, and the i18n catalog. `svn_nt_weak_evidence` stays
   emoji-free (matches the owner-supplied text exactly; every sibling key has an emoji, this one
   deliberately doesn't).
3. **`NO_QUOTE_RULE`** — v1 never had it; this tool has never been verified without it, don't remove
   it to "simplify."
4. **`router.outputStandard = 'v2'` + `router.outputGuard`'s 12-entry prohibit list** — v1 shipped
   with zero output checking on a tool whose entire premise is calibrated confidence.
5. **The structural validation pass runs AFTER `runOutputGuard`, not before** — and uses `nonBlank()`
   (trimmed length check), not bare truthiness — both orderings/checks were tried and found
   insufficient live on other tools this exact session.
6. **`sources_of_noise` never names an actor** — `source_type` describes a general mechanism
   ("consumer product marketing," "media simplification of research findings"), never a company,
   person, or industry unless the visitor supplied that specific claim.
7. **The 4 array caps** (signal ≤4, noise ≤4, debated ≤3, sources ≤4 — `noise` was tightened 5→4 and
   `debated` raised 2→3 in the V3 pass below) — this is what fixed v1's double-truncation bug on a
   maximally-noisy German topic; removing the caps entirely reopens that failure.
8. **Zero `genuinely_debated` items is a correct, expected result**, not a bug — the prompt is
   explicitly told never to manufacture a debate to fill the schema (rule 8, "no false consensus" /
   rule 14). Don't "fix" a topic that returns `[]` there.
9. **Tagline renders via `t('svn_tagline')`, never `tool?.tagline`** — the catalog field keeps its
   emoji for card display elsewhere; using it in-page doubles the icon already rendered next to it.

## V3 — FINAL CORRECTIONS pass (2026-09-10)

V2 fixed the tool's literature-review-voice problem in the health domain it was tested against. The
owner then tested it on a career/labor topic (three classic career slogans — "follow your passion,"
"job-hop for salary," "get an MBA") and the exact same failure mode came back in a domain-specific
disguise, plus five smaller leaks. **Lesson: a rule proven against one domain's examples is not proven
against all domains — test new epistemic rules against a domain unlike the one that motivated them.**

What broke and what fixed it (all verified live against this exact scenario before recording the new
golden — see `svn_career_test.json`-style transcript in the session, not committed):

1. **Literature-review voice recurred as market/labor claims** — "wage data shows," "employer
   recruiting patterns support," an invented MBA-recruiting-pipeline market map stated as established
   fact. Rule 1 extended with career/industry-specific banned phrases and an "institution- or
   industry-specific historical claim stated as established fact" example (the MBA market map).
2. **A strength qualifier ("a weak guide... in most cases") invented scope the evidence didn't
   support.** Rule 5 (was rule 3, "calibrate the claim") extended: qualifiers like "typically,"
   "generally," "in most cases" need the same evidentiary support as the outcome claim itself.
3. **New rule 3 — no invented causal mechanism.** "Changing jobs increases pay *because* external
   offers reset salary to market rate" bundles an unverified explanation onto a claim; state the
   pattern without the mechanism unless the mechanism is itself established.
4. **New rule 4 — don't rebut an overclaim with another overclaim.** The model countered "get an MBA"
   with an unverified claim about which career outcomes get discussed/publicized more (a selection-bias
   claim stated as fact). Now: state a real possibility as a possibility, never as the explanation.
5. **New rule 21 — stay within what was supplied.** V2 output added a 4th "signal" claim ("early
   career years are disproportionately important...") that nobody raised, alongside analysis of the 3
   claims the visitor actually supplied. Both prompts (signal + noise) now instruct: when the visitor
   supplies discrete claims, analyze those — don't append an unprompted one.
6. **Strawmanning.** "The 'follow your passion' model assumes passions are fixed and identifiable in
   advance" reads assumptions into the claim that its own wording doesn't require. Rule 7 (was rule 5,
   "noise ≠ false") extended: critique the claim as supplied, not a stronger/more-naive version that's
   easier to debunk.
7. **Enumerated hypothetical harms turned one claim into an advice essay** ("vesting schedules,
   seniority benefits... periods without income, failed negotiations, probationary periods"). Rule 16
   (was rule 13, "practical advice must follow from the analysis") extended: name a consideration only
   when it materially clarifies the claim, otherwise say plainly that it depends on the specifics.
8. **`noise_type` mislabeling — "cherry_picked" and "individual_variation" used where the actual
   defect was scope, not selective evidence or biological variation.** New rule 22 + two new enum
   values, `too_broad` and `context_dependent` (frontend `NOISE_TYPE_CONFIG` + all 13 languages'
   `svn_nt_too_broad`/`svn_nt_context_dependent`). `cherry_picked` and `individual_variation` are now
   restricted in the prompt to when that specific defect is actually observable — not a catch-all for
   "overgeneralized."
9. **STILL UNSETTLED read as empty** — not literally empty, but forced into a two-sided
   evidence-dispute shape ("what supports one view" / "what supports another view") for a question
   that was actually person-dependent ("would an MBA be worth it for *your* situation"), which the
   model couldn't fill with anything real. **Schema change:** `genuinely_debated[].what_supports_one_
   view`/`.what_supports_another_view` are now nullable — both null signals "the real answer needs
   information about the visitor's specific situation, not more research"; both populated signals a
   live evidence dispute. The backend filter requires the pair to be null-or-populated *together*.
   Frontend (`SignalVsNoise.js`) renders the two-view comparison grid only when at least one view is
   present; otherwise `why_unsettled` becomes the card's main content, not an italic footnote. Rule 17
   (was rule 14, "omit empty sections") extended with this distinction. `expanded.debated` default
   flipped `false`→`true` (only "How the Noise Gets Made" stays collapsed by default now — matches the
   target layout: signal, noise, and still-unsettled are all part of the main answer).
10. **Debate-club phrasing** ("the burden is on the specific claim to show it applies to your
    situation") — not literally in the old prompt, but the model produced it live. Rule 19 (language)
    now explicitly names and bans this phrasing pattern with a plain-language replacement.
11. **`svn_why_we_know`'s label ("Evidence behind it:") itself implied a review that never
    happened** — reworded to "Why this holds up:" in all 13 languages. This is the one purely-i18n fix
    in this pass; no schema or prompt change needed it, just the static label the field renders under.
12. **New top-of-file `EVIDENCE MODE` section** in `PERSONALITY` — names Mode A (claim analysis, the
    default), Mode B (source analysis, only when the visitor's own text quotes/pastes a specific
    source), and Mode C (verified research — explicitly: this tool never performs live retrieval, so
    Mode C never applies here, don't write as though it does). This operationalizes the "first
    determine what evidence you actually have" framing that now opens `PERSONALITY`, and gives the
    per-rule fixes above (1, 3, 4) a shared vocabulary instead of restating "you weren't given sources"
    ad hoc in each one.
13. **`outputGuard.prohibit` grew from 21 to 28 entries** — one new entry per new rule above (3, 4, 21,
    22) plus one for the qualifier-invention fix in rule 5.
14. **`genuinely_debated` cap raised 2→3** (both in the prompt RULES and the code `.slice()`) — matches
    the target "STILL UNSETTLED: 0–3 concise items" shape; was previously capped tighter than the
    other sections for no principled reason.

**Live-tested against:** the exact 3-claim career scenario above (EN, the case that motivated this
pass), the same scenario in German (confirms JSON-escaping/locale safety on the longer prompt and
exercises *both* debate shapes — one populated-views item for a genuinely disputed claim, one
null-views item for the person-dependent MBA question, in the same response), and the original v2
intermittent-fasting scenario (confirms the OVERSTATED-vs-UNSETTLED split from v2 still holds and a
real evidence dispute still gets populated views, not nulled out by the new rule). All three: 0 banned
literature-review phrases (grepped), correct new `noise_type` values used only where warranted, no
extra unprompted claims, no debate-club phrasing. `npm run check:golden signal-vs-noise` → 2/2 PASS on
the re-recorded golden (see the file's own `_meta` for why the v2 sleep/nutrition cases were replaced
rather than kept alongside — the whole point was to prove the career domain, and the golden file
should demonstrate the fix, not just avoid contradicting it).

## DO NOT silently reverse (V3 additions)

10. **SUPERSEDED BY V4 — see below.** V3's nullable `genuinely_debated` view fields (and the
    "null-or-populated together" filter) were removed entirely in V4, not extended. Do not
    reintroduce them; see V4 item 1.
11. **SUPERSEDED BY V4.** `expanded.debated` now defaults to `false` again (V4 item 4) — V3's
    "defaults to `true`" was correct for V3's UI but the section it applied to (a two-sided debate
    card) no longer exists in the same shape.
12. **`too_broad` / `context_dependent` stay in the `noise_type` enum**, and `cherry_picked` /
    `individual_variation` stay restricted to when that specific defect is actually observable — don't
    quietly widen them back into catch-alls.
13. **`svn_why_we_know` stays "Why this holds up:" (or the equivalent per-language rewording)** — not
    "Evidence behind it" in any language; that phrasing is the exact thing rule 1 forbids the model
    from implying, and the label shouldn't imply it either.

## V4 — hard mode switch (2026-09-10, same day as V3, third "final corrections" pass)

V3 fixed the literature-review-voice problem recurring in a career/labor domain. The owner then
tested a THIRD domain — finance — and found the identical failure: "This is supported by persistent
tracking of fund returns against benchmarks over multi-decade periods... the pattern holds across
multiple markets and asset classes," and a compounded version of it — "the evidence covers funds that
survived long enough to be measured, which may exclude funds that closed after poor performance" (a
fabricated methodological limitation of a dataset that was never examined in the first place). Three
prompt-only correction passes (V2, and two same-day V3 rounds) had not fully suppressed this pattern
across domains. V4's central change: **a deterministic, code-level backstop, not a fourth round of
prompt language alone.**

1. **SCHEMA CHANGE — `genuinely_debated` removed, replaced by two arrays.** V3's nullable-views
   mechanism (populated views = evidence dispute, null views = person-dependent question) is gone.
   In its place: `still_worth_verifying[]` (`{question, why_it_matters, what_would_help}` — a
   genuinely unresolved GENERAL empirical question; never a fabricated two-sided "evidence pointing
   this way / another way," since this tool has no sources to characterize two sides of anything) and
   `what_general_claims_cant_decide[]` (plain strings — person-specific questions a general analysis
   can never resolve, e.g. "whether direct real estate fits your actual situation"). The two concepts
   V3 conflated into one nullable field are now two clearly separate things, per the owner's
   diagnosis: "STILL UNSETTLED is misclassifying two different things."
2. **CODE-LEVEL ENFORCEMENT — `CLAIM_MODE_BANNED_RE` / `findBannedPhrase` / `callClaimModeChecked`
   in `backend/routes/signal-vs-noise.js`.** Every prose field in each of the two calls (signal, noise)
   is scanned against a fixed phrase list ("evidence shows/suggests/supports/that", "studies show",
   "historical data show", "tracking of returns", "documented tendency/context/case/advantage",
   "research finds/shows/confirms", "empirical/observational/controlled evidence", "multiple markets
   and asset classes", "multi-decade", "evidence base", "track record", "literature shows/suggests",
   "the evidence covers", "historical N comparisons", plus a few more; see the regex itself). A hit
   triggers ONE regeneration of that half with the exact offending phrase quoted back at the model. If
   the regenerated result still violates, the structural-validation pass (which already dropped
   incomplete items) also drops any item that still contains a hit — the visitor never sees it, the
   section just has one fewer item, exactly the same "omit rather than pad" behavior already used for
   incomplete items. **ENGLISH ONLY** — `withLanguage()` translates output into 12 other languages and
   this regex does not follow it there; a live German test during this pass produced correct output on
   its own (the prompt-level SOURCE MODE rules held), but that is NOT the same guarantee the English
   regex provides. If violations start appearing in a non-English language, translate the phrase list —
   don't declare the job done because English is covered.
3. **A negation/missing-evidence exception window (`ALLOWED_EXCEPTION_RE`)** prevents the broadened
   "evidence that/is evidence that" patterns from flagging the explicitly-ALLOWED phrasing the prompt
   itself teaches the model to use — "does not provide evidence for," "no evidence that," "would be
   needed to establish." Checks a 60-char window before the raw regex match for a negation cue before
   calling it a real violation. Verified against 12 hand-built test cases (5 real violations from the
   owner's cited output, 7 legitimate/allowed sentences) — all 12 passed before this shipped.
4. **UI**: `svn_debated_header` reworded "Still Unsettled" → "Still Worth Verifying"; `svn_nuance`
   reworded "Limits:" → "What it doesn't establish:"; new keys `svn_verify_why`/`svn_verify_would_help`/
   `svn_cant_decide_header`. The old two-column "evidence pointing this way / another way" comparison
   grid is gone from the JSX, not relabeled — replaced by a plain question+why+what-would-help card for
   `still_worth_verifying` and a bullet list for `what_general_claims_cant_decide`, both under one
   collapsed disclosure (`expanded.debated`, now defaulting to `false`). `svn_one_view`/
   `svn_another_view`/`svn_why_unsettled` are orphaned in the 13 locale files (harmless, not deleted —
   matches this session's established practice of leaving unused i18n keys rather than touching all 13
   languages to remove them).
5. **Caps changed**: `the_signal` 4→3; `still_worth_verifying` capped at 2 (replacing
   `genuinely_debated`'s 3); `what_general_claims_cant_decide` capped at 3;
   `the_bottom_line.what_would_change_the_answer` 2→3.
6. **New PERSONALITY rules 23–25** (renumbered from the old 19-item scheme, which is now 26 rules
   total): rule 23 (unsourced research summary for an "X matters" claim, with the valuation worked
   example verbatim from the owner's spec), rule 24 (no historical performance comparison even
   hedged — real estate vs. stocks), rule 25 (the still-worth-verifying vs. can't-decide split,
   described above). Rules 8, 13, 14, 16 extended in place with worked examples for: motive assigned
   through a comparison's framing ("tends to favor whichever asset class the presenter prefers"), a
   default professional-referral closer ("worth working through with a fiduciary adviser"), a factor
   ranked against unnamed alternatives ("among the most reliably controllable factors"), an unsourced
   quantified population claim ("most actively managed funds have not outperformed"), and reaching for
   a specific historical argument to support a point pure logic already establishes ("missing a small
   number of strong return days").
7. **`outputGuard.prohibit` grew from 28 to 37 entries** — one per new/extended rule above.
8. **Golden re-recorded** (2 investing cases, EN + DE, live-verified, 0 banned-phrase hits on either) —
   the old V3 career-domain cases used the now-removed `genuinely_debated` shape and couldn't pass
   structurally under the new schema regardless of content quality.

**Live-tested against:** the exact investing scenario from the owner's spec (index funds / market
timing / valuations / real estate vs. stocks), in English and German, run twice each. Zero banned-
phrase hits on any of the 4 runs — the regenerate-once mechanism was not even needed live, though its
correctness was verified separately via 12 unit-style test cases run directly against the regex.

## DO NOT silently reverse (V4 additions)

14. **The `genuinely_debated` → `still_worth_verifying` + `what_general_claims_cant_decide` split** —
    do not recombine them into one field, and do not put a person-specific question into
    `still_worth_verifying` (or vice versa) to save a UI section.
15. **The code-level `CLAIM_MODE_BANNED_RE` backstop and its one-regeneration-then-drop behavior** —
    this is what V3's prompt-only approach was missing after three attempts. Do not remove it because
    "the prompt should be enough now" — that exact reasoning is what let the finance-domain failure
    reach production after two prior corrections already shipped.
16. **The backstop is English-only, by design, for now** — do not assume it silently covers other
    languages. If a non-English violation is reported, the fix is translating `CLAIM_MODE_BANNED_RE`,
    not just adding another English example to PERSONALITY.
17. **`ALLOWED_EXCEPTION_RE`'s negation window** — removing it will cause the tool's OWN
    explicitly-taught allowed phrasing ("does not provide evidence for...") to trigger false-positive
    regenerations/drops on every response that correctly describes missing evidence.

## V5 — broad phrase matching + per-field regen + traceability guard (2026-09-10, same day, 4th pass)

V4's regex shipped locally but had NOT been deployed (`origin/main` was still 2 commits behind) when
the owner ran the next live test — a parenting/screen-time/homework topic. That test genuinely
exposed two real, separate problems, not just a stale-deployment artifact:

**Problem 1 — the regex itself was too narrow.** V4's patterns were verb-conjugation-specific
("evidence shows/suggests/supports/that"). Tested directly against the 13 new violating sentences
from this live output, it caught only 1 of 13: "the evidence tends to show," "observational
research," "reviews of homework research... broadly recognized in ... literature," "researchers
argue," "is associated with," "historically," "documented," "the evidence on X is Y" all sailed
through. **Lesson: narrow verb-matching does not generalize** — a model has many ways to phrase "I
reviewed a body of evidence," and each new domain surfaces new ones. The fix is broad WORD/PHRASE
matching (bare `literature`, `historically`, `documented`, `associated with`; `evidence`/`research` +
up to 3 words + a wide verb set; `observational|experimental` + `research|studies|comparisons`, etc.),
verified against all 13 new violations plus 7 legitimate ALLOWED sentences (0 false positives, 0
false negatives) via a standalone test script before shipping — see the git history of this file's
`CLAIM_MODE_BANNED_RE` for the exact before/after.

**Problem 2 — scope creep, a different failure from evidence-language.** The same live output
introduced "free-range parenting" into `still_worth_verifying` and invented "the core of free-range
parenting" as a definition — the visitor supplied "screen time, intensive vs. permissive parenting
styles, and homework," never free-range parenting as its own topic. This is NOT an evidence-
provenance problem a phrase-ban can catch; it's the tool wandering onto an adjacent topic because it
seemed interesting. Fixed with an explicit traceability test added to rule 21: before writing any
claim/question, ask whether it's traceable to (A) a claim the visitor supplied, (B) a distinction
necessary to analyze that claim, or (C) an examined source — if none apply, don't write it. Backed by
5 new `outputGuard` entries (LLM-judged, since "is this topically related" is a semantic call a regex
cannot make the way "does this phrase imply a literature review" can).

**Architecture change — per-FIELD regeneration, not per-CALL.** V4's `callClaimModeChecked` retried
the ENTIRE signal or noise half on any violation — wasteful, and risks trading one violation for a
new one somewhere else in a large response it didn't need to touch. V5 replaces it with
`enforceClaimModeFields()` / `regenerateField()` / `setAtPath()`: every violating field is identified
by its exact path (e.g. `the_signal.items[0].basis`), rewritten individually via a small, cheap
`MODELS.FAST` call (no JSON schema to fill, just `{"rewritten": "..."}`), and spliced back into the
parsed object at that exact path. Everything the model got right elsewhere in the response is left
untouched. A field that's still a violation after its one regeneration attempt is simply left as-is —
the existing `clean()`-based structural filter (unchanged from V4) drops the enclosing array item,
same fallback as before. `regenerateField` is `withLanguage()`'d on `userLanguage` even though the
quoted original text is already in that language — without an explicit instruction the rewrite is one
inference away from drifting into English on a non-English response.

**Other fixes this pass:**
- Reinforced rule 21 (STAY WITHIN WHAT WAS SUPPLIED) with the traceability test above.
- New rule 26: the_signal does not need one item per noise item (sometimes the honest signal is that
  a claim needs a missing distinction, not a matching empirical rebuttal); don't insert an unprompted
  epistemic lesson ("before-and-after comparisons") the visitor's claims didn't raise; don't invent an
  individual person/child to apply a population-level claim to (that belongs in
  `what_general_claims_cant_decide`, addressed to "you," not smuggled into the general bottom line).
- UI: a "CLAIM ANALYSIS" mode badge with a tooltip now renders under ANALYZING
  (`svn_mode_claim_analysis` / `svn_mode_claim_analysis_tip`, 13 languages) — reinforces the boundary
  for the visitor, not just internal bookkeeping. `source_analysis`/`verified_research` labels are
  deliberately not built — this tool performs no live retrieval, so those modes are unreachable today;
  build them only if that capability is ever added (see "NOT built this pass" below).
- Catalog copy (`src/data/tools.js` `description`/`seoDescription`/`primer.get`) and `svn_tagline`
  (13 languages) reworded away from "stronger evidence" / "genuinely unsettled" phrasing that implied
  the tool always has access to an evidence base to sort — the tool's own promise needed to be true in
  Claim Analysis mode too, which is the mode almost every request actually runs in.

**NOT built this pass — flagged as a real decision, not defaulted on:** the owner's spec proposed a
"Research These Claims" escalation button that would switch the tool into a genuine `verified_research`
mode with live source retrieval and citations. This tool has no web-search/retrieval capability wired
in today. Building it is a real product/infrastructure decision (cost per request, latency, a new
external dependency, reliability) — not something to add silently as part of a prompt-correction pass.
Left unbuilt pending an explicit decision to invest in that capability.

**Live-tested against:** the exact parenting/screen-time/homework scenario from the owner's spec.
0 banned-phrase hits, 0 free-range-parenting scope creep, 0 field-fix regenerations needed (the
strengthened PERSONALITY got it right without needing the backstop this time — the backstop's own
correctness was verified separately, via direct regex unit tests, not by hoping a live call would
trigger it). Browser-verified the CLAIM ANALYSIS badge and its tooltip render. `npm run check:golden
signal-vs-noise` → 3/3 PASS on the re-recorded golden (added a 3rd, parenting-domain case rather than
replacing the 2 investing cases — this pass didn't change the schema, so the existing cases still
validate it correctly).

## DO NOT silently reverse (V5 additions)

18. **`CLAIM_MODE_BANNED_RE` must stay broad word/phrase matching**, not narrow verb-conjugation
    patterns — that specific narrowness is what let 12 of 13 violations through in the test that
    triggered this pass. Any future addition to the list should default to the broader shape unless
    there's a specific, tested reason to narrow it.
19. **Per-field regeneration (`enforceClaimModeFields`/`regenerateField`/`setAtPath`), not a whole-call
    retry.** Don't collapse this back into re-running the entire signal or noise prompt on any
    violation — that's strictly worse (slower, and risks introducing a new violation while fixing the
    old one) with no compensating benefit.
20. **Rule 21's traceability test** — this is a different failure class from evidence-language
    invention (scope creep vs. fabricated provenance) and needs its own defense; don't assume the
    phrase-ban regex covers it, it doesn't and structurally can't.
21. **The "CLAIM ANALYSIS" mode badge** — don't remove it as "just disclosure text"; the owner's
    stated reasoning is that it reinforces the conceptual boundary for the visitor, not merely informs.

## V6 — "WHAT AUTHORIZES THIS SENTENCE?" (sleep domain)

V5's hard mode switch and broad-phrase regex killed the fake-literature-review voice, confirmed by
the owner. A fourth live test (sleep: "everyone needs exactly 8 hours," blue-light glasses, sleep
debt) found a narrower, different failure: **unlabeled empirical premises that never use
evidence-provenance wording at all**, so `CLAIM_MODE_BANNED_RE` structurally cannot catch them —
"most adults need roughly 7-9 hours," "light exposure is one input to the body's circadian timing
system," "additional sleep after restriction can reduce sleepiness" are stated as bare fact, not as
"evidence shows" or "studies find." Plus two more issues: a logical non-sequitur reasoning backward
from a metaphor's usefulness to a property of the thing it describes ("if a single night fully erased
sleep debt, the metaphor wouldn't be useful" does not follow), and a bottom line that broke back into
sleep guidance and invented personal context (`what_would_change_the_answer`) nobody supplied.

**Fix is prompt-level, not regex** — this class of error has no stable lexical marker a regex can key
on; a bare factual sentence looks identical whether or not the model actually knows it's true.

- **New rule 27 ("WHAT AUTHORIZES THIS SENTENCE?")** — before writing a factual sentence, checks it
  against three bases: A. USER_CLAIM (the visitor supplied it), B. LOGIC (follows from the claim's own
  structure — overbreadth, ambiguity, unsupported causal jumps, false precision — no empirical finding
  needed), C. LABELED_BACKGROUND (genuinely ordinary vocabulary-only background, e.g. what "circadian
  rhythm" *means* — used sparingly, never to supply the central empirical answer). None of the three →
  rewrite or remove. Explicitly frames this as "claim analysis does not mean ignore everything you
  know" — logic and vocabulary stay available, remembered *findings* do not.
- **New rule 28 ("A metaphor's usefulness does not establish the underlying reality")** — fixes the
  sleep-debt non-sequitur. Critique what a metaphor actually fails to establish (e.g. "'sleep debt' is
  a metaphor — it doesn't establish that lost sleep accumulates hour-for-hour, or that a given amount
  of recovery sleep restores the prior state"), never reason backward from "what would make the
  metaphor useful."
- **New rule 29 ("The bottom line summarizes the claim analysis, not sleep/finance/parenting
  guidance")** — every bottom-line item must be traceable to what `the_signal`/`the_noise` already
  established about *these* claims, never a new substantive conclusion about the underlying topic.
  Also locks `what_would_change_the_answer` to being about evidence, not an invented personal
  situation — that belongs only when the visitor's own supplied context leaves a real, specific gap.
- NORTH STAR gained a prepended 3-line frame: "USE KNOWLEDGE TO UNDERSTAND THE CLAIM. USE LOGIC TO
  TEST THE CLAIM. USE ACTUAL EVIDENCE TO SETTLE THE CLAIM." (kept the existing 3 lines below it).
- 3 new `OUTPUT_GUARD.prohibit` entries (37 → 40): `unauthorized_empirical_fact_or_figure_used_as_an_
  unlabeled_premise`, `metaphors_usefulness_used_to_infer_a_property_of_the_underlying_reality`,
  `personal_situation_invented_in_what_would_help_evidence_replaced_with_a_case_nobody_supplied`.

**TRAP HIT AND FIXED DURING THIS PASS** — worth remembering on its own: rule 27 and rule 29's first
draft quoted the exact attractor phrase "additional sleep after restriction can reduce sleepiness"
**twice**, verbatim, as a "here's what NOT to write" example. Live testing showed the model echoing
that near-verbatim phrase straight into `the_noise[].what_the_evidence_supports_instead` anyway — see
`deftbrain-voice-prompt-traps` memory: worked BAD-example text tends to get copied rather than
avoided. Fixed by rewriting both examples to describe the ERROR PATTERN in the abstract (no specific
number, no specific mechanism, no specific magnitude-of-benefit claim left to copy verbatim), plus an
explicit "this is illustrating a pattern, not a script — a close paraphrase is the same violation"
line. Verified 0 attractor-phrase / 0 banned-phrase hits across 3 consecutive live regenerations of
the exact sleep scenario after the reword (the run immediately before the reword did produce the
attractor phrase; none of the 3 after did).

**UI additions (pure frontend, no new backend capability):**
- A visible **"No outside sources reviewed"** sub-label now sits beside the CLAIM ANALYSIS badge
  itself (`svn_no_sources_reviewed`) — the existing disclosure lived only in a hover tooltip, which is
  poor discoverability for something meant to set an expectation up front.
- A **"Research These Claims"** disclosure (`svn_research_these_claims`) now renders at the end of
  results, built from `still_worth_verifying` (falling back to `the_bottom_line.
  what_would_change_the_answer` when that's empty) — one external search-engine link per open
  question, opened in a new tab. This is **not** a live-retrieval / verified-research mode: nothing is
  fetched or checked by DeftBrain itself, the link just hands the visitor a ready-made search. Built
  as an honest, low-risk version of "finish the idea" — see "NOT built this pass" below for what
  remains a real decision.
- i18n: `svn_honest_uncertainty` relabeled "? What Could Change the Answer" → "? What Would Help"
  across all 13 languages — claim-analysis mode is never actually about the visitor's personal
  situation today (this tool doesn't branch on a genuinely-supplied personal case), so the
  evidence-focused label is the honest default. New keys: `svn_no_sources_reviewed`,
  `svn_research_these_claims`, `svn_research_intro`, `svn_search_this` (13 languages each).

**STILL NOT built this pass — flagged as a real decision again, not defaulted on:** the owner asked a
second time ("finish the idea") for a genuine live-retrieval `verified_research` mode with real
sources and citations. This tool still has no web-search/retrieval capability wired in. The search-
link button above is the honest, zero-infra version of that idea; actual retrieval remains a real
product/infrastructure decision (cost per request, latency, a new external dependency, reliability)
that should be made explicitly, not defaulted into or out of during a prompt-correction pass.

**Live-tested against:** the exact sleep-hours/blue-light-glasses/sleep-debt scenario from the
owner's spec, 3 consecutive regenerations post-fix. 0 hits for the attractor phrase, 0 hits for the
v5 banned-phrase list, "circadian" appeared once in a LOGIC-framed open question ("whether circadian
timing effects... offset any recovery benefit") which is legitimate rule-27-C vocabulary use, not an
unlabeled premise. Recorded as a 4th golden case (`en-sleep-hours-claim-mode`) rather than replacing
the existing 3 — this pass didn't change the schema, so the investing/parenting cases still validate
correctly against it.

## DO NOT silently reverse (V6 additions)

22. **Rule 27's "WHAT AUTHORIZES THIS SENTENCE?" test (USER_CLAIM/LOGIC/LABELED_BACKGROUND)** — this
    is the only defense against unlabeled bare-fact premises; the regex structurally cannot do this
    job (no stable lexical marker distinguishes a true bare fact from a false one).
23. **Rule 27/28/29's illustrative examples must stay abstract, not quote a specific number, mechanism,
    or magnitude figure.** This was a proven, live-tested trap in this exact file: a concrete "here's
    what NOT to write" example gets echoed back into output rather than avoided. If a future domain
    needs a new illustrative example, describe the *shape* of the error, not a copyable sentence.
24. **The "Research These Claims" search-link disclosure is deliberately NOT live retrieval.** Don't
    quietly upgrade it into fetching or verifying anything without the explicit infra decision noted
    above — that changes this tool's cost/latency/reliability profile in a way a UI pass shouldn't
    decide unilaterally.

## V7 — the claim-mode validation pipeline (code, not prompt)

**Why this exists.** After V6, the owner ran the same nutrition test ("hormones matter more than
calories", skipping breakfast, intermittent fasting, processed foods) against two successive rounds
of the global epistemics contract (`backend/lib/epistemics.js`, commits e915b0e7 and 60cc93d5). Both
rounds were acknowledged by the model and neither materially changed the output. Five prompt-only
passes in total had now failed the same test the same way: the model stopped writing "research
shows" and started stating the premise as bare fact ("hormones regulate appetite and energy
expenditure"), as a hedge ("meal timing may interact with circadian rhythms", "workable for some
people"), or laundered through logic ("this follows from the accounting relationship: hormonal
signals influence appetite, satiety, and energy expenditure…"). None of those has a lexical marker.
`CLAIM_MODE_BANNED_RE` structurally cannot see them. The owner's conclusion, which this pass
implements: *a logical inference inherits the epistemic requirements of its premises*, and the only
thing that can check that is a judged question with a deterministic consequence for FAIL.

**The pipeline** (`enforceClaimModeFields` in `backend/routes/signal-vs-noise.js`, runs after
`runOutputGuard`, before the structural filter):

1. **REGEX** — `CLAIM_MODE_BANNED_RE` kept, demoted to cheap first-pass detection.
2. **SEMANTIC EMPIRICAL-RESOLUTION CHECK** — `semanticEmpiricalCheck` asks ONE narrow question per
   field: does this text assert or rely on a real-world proposition that was not supplied by the
   visitor, not supported by a source examined in this run (none are), and materially helps decide
   the claim? Ignores definitions, wording analysis, logical requirements, missing-information and
   evidence-needed statements. Hedges and subgroup narrowing ("for some people") do not convert
   FAIL to PASS. Skips `topic_as_understood` and `the_noise[].claim` (restatements of what the
   visitor supplied).
3. **REWRITE** — `rewriteFlaggedField`, the owner's exact rewrite prompt, one attempt per field,
   `MODELS.SMART`, capped at `MAX_FIELD_REWRITES = 12`; overflow goes straight to stage 5.
4. **REVALIDATE** — regex locally, then the judge again on each rewrite *alone* (batch size 1).
5. **SAFE FALLBACK** — `CLAIM_MODE_FALLBACKS`, fixed text per field type in all 13 languages
   (`holds_up_instead`, `what_went_wrong`, `kernel_of_truth`, `why_holds_up`, `doesnt_establish`,
   `bottom_line`, `framing`, `noise_label`). A rewrite that fails regex, fails its recheck, or whose
   recheck could not run is replaced — never regenerated again. Fields with no fallback (a signal
   item's `claim`, `still_worth_verifying.*`, `sources_of_noise.*`, `what_general_claims_cant_decide[]`)
   are blanked, and the existing structural filter drops the item.
   - **5b** — a signal item whose `basis` fell back gets its `claim` re-judged alone and blanked
     unless it passes. The claim *is* the tool's assertion; a fixed basis under an unlicensed claim
     would lend it exactly the logical veneer the pipeline removes (seen live in run 3: "hormonal
     factors operate within that relationship" sitting on "this follows from the structure…").

**Three things measured during the build, each of which changed the design:**
- **Judge recall collapses with batch size.** One call over a real 48-field response flagged 3 and
  missed the two plainest violations ("meal timing can affect hunger…"); the same two fields alone
  were both flagged in 1.7s. → `SEMANTIC_BATCH_SIZE = 6`, batches run in parallel (eight calls of
  six cost about the same wall-clock as one call of forty-eight: 6.5s vs 4.2s).
- **The judge is consistent but neighborhood-sensitive.** 3/3 on what it flags in one batching, 1/2
  on the same sentence in another. → stage 2 runs two passes with batch boundaries offset by half
  a batch and unions the verdicts; the recheck judges each rewrite solo.
- **The judge gets laundered too.** With the definitional-identity exemption phrased loosely, it
  passed "this follows from the accounting structure: hormonal signals influence appetite, satiety,
  and energy expenditure" 0/2 — the same trick that worked on the generator. → the judge is told to
  judge every sentence on its own; the framing sentence is not authority.

**Verification.** Standalone replay of a leaked live response through the finished pipeline (the
`pipeline_diag` harness slices the route source, since the module only exports the router):
`regex=0 semantic=9 rewritten=6 fallback=2 blanked=1`, and a fresh judge pass over the result found
the flagship leaks gone. Four consecutive live runs of the nutrition scenario: fallbacks fired 1–5
times per run, route time 58–68s (was 50–61s in V6 — the judge calls are parallel), all
`check:golden` cases passing. **Cost:** roughly 20–35 small `MODELS.SMART` calls per request on a
leaky response, near zero on a clean one. That is a deliberate trade for a tool whose entire promise
is this discipline; it is not a pattern to copy into a tool that isn't making that promise.

**The validation prompt (V7.1, same day).** The owner supplied the judge prompt now in
`SEMANTIC_CHECK_SYSTEM` — PASS only if every substantive claim is visitor-supplied or logical
analysis needing no extra real-world premise; FAIL on remembered knowledge, unsupplied factual
examples, "unestablished, then asserted anyway," hedge-disguised claims, or a conclusion not
established by the validated material; the counterfactual key test. It is used verbatim in
substance, with the batch/JSON contract around it and a CLARIFICATIONS block that exists because of
two measurements: (a) **as written, it over-flags the tool's own correct output** — on the replay
it flagged "is an empirical question this analysis cannot settle" and "these two claims may not
contradict each other," and on a live run it blanked the entire Signal section and turned 3 of 4
kernels into boilerplate. Restoring the owner's earlier "ignore statements that merely define,
analyze wording, identify missing information, say evidence is needed" list brought the replay from
`semantic=11 rewritten=8 fallback=2 blanked=1 (signal item dropped)` to `semantic=10 rewritten=8
fallback=2 blanked=0`. (b) The laundering and subgroup clauses from V7 stay, for the reasons
measured above. **Cost as it stands:** on the nutrition scenario, live, 12 fallbacks fired in one
run — 5 of 8 bottom-line items, 2 of 4 noise "instead" fields, and the framing were boilerplate.
That is the rule applied faithfully ("empty or epistemically limited is better than invented
completeness"); how much boilerplate density is acceptable is a product judgment for the owner,
recorded here so it is made deliberately rather than discovered.

**Fallback presentation (V7.2, same day).** Twelve fallbacks in one run meant enforcement was working
and presentation wasn't: the Bottom Line rendered the same sentence three times. Owner's rule —
DE-DUPLICATE THE LIMITATION, NOT THE EPISTEMIC STANDARD — implemented as three levers, the judge
untouched:
1. **Per-list wording.** The single `bottom_line` fallback became `takeaway` / `skeptical` /
   `would_help`, each with a `_many` variant, in all 13 languages.
2. **Omit optional sub-fields.** A failed `kernel_of_truth` or signal `limits` is now omitted (set
   `null`) rather than replaced — the UI renders them only when present, and "There may be a
   narrower version…" under three cards was repetition, not honesty. Required fields
   (`what_the_evidence_supports_instead`, `what_went_wrong`, `basis`, `framing`, `noise_label`) keep
   their fixed text, because dropping them drops the card.
3. **Collapse per list** (`collapseBottomLineFallbacks`, stage 5c). Surviving items are never
   touched; all fallback items in one list fold into at most one bullet, placed last — the list's
   own wording when one item failed, the `_many` wording when several did. Five failed candidates
   out of eight is a three-bullet Bottom Line plus one limitation, not eight bullets. Compares
   against every language's strings, so a language-mismatched fallback still collapses. Nothing asks
   the model to make failed content "more varied."
   Live: run 7 rendered one collapsed "Several of these claims depend on real-world effects…"
   bullet, last; kernels 3/4 present, the fourth omitted; no repeated fallback anywhere. **Bug the
   unit test caught before it shipped:** the English `would_help` fallbacks began "Evidence about…",
   which matches `CLAIM_MODE_BANNED_RE` — the structural filter would have silently dropped the very
   limitation bullet the collapse had just written. Reworded; `test_fallbacks.js` now checks every
   fallback string in every language against the regex for exactly this reason.

**What this does NOT fix, honestly:** the independent judge tally on a finished response still
finds 2–3 borderline flags per run — a definitional identity the judge reads as empirical ("energy
balance is part of what determines whether body mass changes"), a person-specific
`what_general_claims_cant_decide` item ("depends on your schedule, hunger patterns…"), a takeaway
that presupposes a mild premise. These are the residue of an LLM judge, not gaps in the pipeline
logic; closing them would mean either more judge passes (cost) or exempting whole sections (a hole).
Left as is, documented here, for the owner to weigh.

**Golden:** schema unchanged. `sources_of_noise` and `what_general_claims_cant_decide` are now
`optionalSections` on every case (alongside `still_worth_verifying`) because the pipeline
legitimately empties them — their fields have no fallback text, so a flagged item drops. The
frontend already renders each of those sections only when non-empty.

## DO NOT silently reverse (V7 additions)

25. **The five-stage pipeline stays a pipeline.** Do not collapse it back to "regex + one regen" —
    five prompt-only passes and one regex-only pass are the documented evidence that neither
    suffices. If a future domain leaks, the first question is which *stage* let it through, measured
    the way this pass measured it — not another prompt rule.
26. **Small judge batches, two offset passes, solo recheck.** Each of the three was forced by a
    measurement above; undoing any one of them re-opens a measured hole. If cost has to come down,
    the honest lever is fewer eligible fields, not bigger batches.
27. **One rewrite, then fixed text.** Never a second regeneration. A validator/regenerator loop is
    exactly how the model finds new vocabulary for the same assertion.
28. **A rewrite whose recheck could not run is not kept.** Unknown means fail at stage 4. The
    first-pass check treats unknown as pass only because there is nothing to act on yet.
29. **Fallbacks stay content-free and localized.** They assert nothing about the world, which is
    the whole point; do not "improve" them with domain content, and do not let them go English-only
    — `CLAIM_MODE_FALLBACKS` has all 13 catalog languages on purpose.
30. **No fallback for `still_worth_verifying`, `sources_of_noise`, `what_general_claims_cant_decide`,
    or a signal item's `claim`.** Fixed text in those slots would be filler; dropping the item is the
    honest outcome, and the goldens now allow it.
31. **`the_noise[].claim` and `topic_as_understood` stay out of the judge.** They restate what the
    visitor typed; judging them produces guaranteed false FAILs on the very claims under analysis.

## V8 — researched architecture (owner-supplied rebuild, 2026-09-11)

**Everything in V4–V7.2 above is superseded, not reversed.** The owner's conclusion after seven
iterations of the source-free design: a tool that must decide what holds up while forbidding itself
from using any empirical knowledge as evidence was the wrong architecture, not a badly-tuned one. The
supplied rebuild (`SignalVsNoise_research_rebuild.zip`) replaces it with research-first:

```
visitor claims → cached web-search research pass (lib/claimResearch.js, via the production
groundedFacts helper) → structured evidence packet → search-free synthesis (one MODELS.SMART call,
no tools) → source-ID validation (sanitizeResult) → cited Signal / Noise / unresolved result
```

- `lib/claimResearch.js` (new): decomposes the visitor's actual claims, runs a bounded Anthropic
  `web_search` pre-pass (`SIGNAL_RESEARCH_MAX_USES`, default 6) with a source-quality policy
  (reviews/primary → official/regulator → professional bodies → high-quality secondary), returns a
  packet `{researched_at, claims[{claim, assessment, findings[{text, source_ids}], limits}],
  sources[{id, title, publisher, url, date, source_type}]}`, cached 24h stale-while-revalidate.
- `lib/groundedFacts.js`: one additive option, `maxUses` (default stays 3 — every existing consumer
  unchanged).
- Route: the synthesis call receives ONLY visitor input + packet; every Signal/Noise item must carry
  `source_ids` that exist in the packet, invalid IDs are stripped, items with none surviving are
  dropped, and `sources_examined` is pruned to sources actually referenced. `analysis_mode` is
  `verified_research`; `research_status: 'complete'`; `researched_at` surfaces the packet date.
  `runOutputGuard` runs with the packet included in `supplied` so packet-sourced facts are not
  flagged as invented; `sanitizeResult` runs again after the guard because source IDs are
  code-owned.
- **Cold-cache behaviour is a product decision, stated in the README:** a researched answer is the
  product, so a cold request waits up to `SIGNAL_RESEARCH_COLD_WAIT_MS` (default 60s) for the
  search, then returns **HTTP 503 `code: research_unavailable`** rather than an unresearched
  answer. The background fetch continues and warms the cache for the next attempt.
- **Removed:** `ANALYSIS_MODE = 'claim_analysis'`, `CLAIM_MODE_BANNED_RE` + `ALLOWED_EXCEPTION_RE`,
  the semantic judge (`SEMANTIC_CHECK_SYSTEM`, `judgeBatch`, `semanticEmpiricalCheck`), per-field
  rewrite, `CLAIM_MODE_FALLBACKS` (all 13 languages), `collapseBottomLineFallbacks`, the 30-rule
  PERSONALITY and its 40-entry guard list, the "No outside sources reviewed" label and the
  search-link "Research These Claims" disclosure. The i18n keys those used (`svn_mode_claim_analysis*`,
  `svn_no_sources_reviewed`, `svn_research_*`, `svn_search_this`) are now orphaned in the catalog,
  same treatment as `svn_one_view` after V4 — left, not deleted.

**Installed per `audit/REWRITE-INSTALL-KIT.md`; what the repo required on top of the supplied files:**
- §3 i18n: the frontend shipped a 13-language `researchUi` map inline and a hardcoded `SOURCES`
  copy header. Both moved into the catalog — `svn_mode_research`, `svn_sources_checked` (`{{n}}`),
  `svn_sources_list_header`, `svn_source_generic`, `svn_copy_sources`, 13 languages each, using the
  supplied translations. Inline maps bypass Gate 5 and the convention audit.
- §9 persisted key bumped `signalvsnoise-result` → `signalvsnoise-result-v2` (shape changed).
- §6 supplied bug: an unused `sourceBacked` helper in `sanitizeResult` — one warning against the
  `--max-warnings=0` gate. Removed.
- §13 copy: `src/data/tools.js` description / seoDescription / primer / guide overview / howToUse /
  tips still promised "not a literature review… does not invent citations." Rewritten for a tool that
  checks and shows sources, and honest about scope ("a targeted source check, not a systematic
  review"). `public/llms*.txt` regenerated. The five guides that reference the tool do so only by id
  (no CTA prose to update). `svn_tagline` ("Separate what a claim supports from what outruns it") is
  still true and kept.
- Goldens re-recorded against the new shape; `the_noise` added to `optionalSections` (an item with
  no surviving source ID is dropped, so the list can legitimately be empty).

**Cost profile (new):** a cold run pays up to 6 web searches (~$0.06 at list) plus a ~6.5k-token
research generation and a 6k-token synthesis; a warm run pays synthesis only. Per-tool cost is now
visible in the metrics dashboard's "LLM usage by route" section (shipped the same day).

**Measured on install (nutrition scenario, local):** the research pre-pass lands at **~80–100s**;
synthesis adds **~50–80s**. With the default 60s cold wait, **the first-ever request on any topic
always 503s**, and the second request (which joins the in-flight fetch) returns the researched
answer — 200 at +158s from the first click; 17 sources, 3 Signal, 3 Noise, 2 Still Worth Verifying.
That is the route's honest behaviour, but as shipped it put an error screen in front of every first
visitor to a topic. **Fix installed on the client side, route untouched:** `useClaudeAPI` now attaches
`err.status` and `err.code` to a non-2xx error (backward compatible — existing callers read
`.message` only), and SignalVsNoise retries on `code === 'research_unavailable'` up to 6 times, 8s
apart, showing `svn_research_warming` ("First run on this topic — checking sources takes a minute
or two") while it waits, and `svn_research_unavailable` only if all retries fail. No single HTTP
request runs longer than the route's own cold wait + synthesis. Keys `svn_research_running`,
`svn_research_warming`, `svn_research_unavailable` — 13 languages.

**Cache persistence — read before trusting a golden run.** `groundedFacts` is in-memory, plus an
optional runtime file at `GROUNDED_CACHE_PATH` and the committed venue seed. Locally
`GROUNDED_CACHE_PATH` is unset, so **every nodemon restart empties the research cache** and every
golden case 503s again until re-warmed. The pre-push hook's `check:golden` therefore only passes if
the four cases were warmed after the last backend edit — warm, record, commit, push, in that order,
with no backend edits in between. On Railway, confirm `GROUNDED_CACHE_PATH` points at the mounted
volume, or every deploy makes every topic cold again (the 5 "Try Example" topics would be the ones
to pre-warm if that ever matters).

**Source policy observation for the owner:** the research pass admitted a Medium blog post as
`high_quality_secondary` (S13 on the nutrition run) alongside the BMJ, Lancet and NIH sources.
The policy allows secondary sources "only when stronger primary material is not available"; it was
not needed here. Tightening that (exclude blog platforms outright, or cap secondary sources at one)
is a prompt change in `claimResearch.js`, and a policy call — not made in this install.

## DO NOT silently reverse (V8)

32. **Research-first is the architecture now.** Do not reintroduce a source-free "claim analysis"
    path, the phrase-list regex, the semantic judge, or fixed-text fallbacks into this route — seven
    iterations established that they cannot make remembered premises safe; the packet + source-ID
    validation is what replaced them.
33. **A cold cache 503s by design.** Do not make the route answer unresearched when the search does
    not land; the client retry is the UX, not a silent fallback.
34. **Source IDs are code-owned.** `sanitizeResult` runs after the guard on purpose; keep it there.
35. **`groundedFacts.maxUses` defaults to 3.** Only this tool passes 6; do not raise the default.
36. **Warm before golden.** See "Cache persistence" above.
