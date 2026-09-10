# Signal vs. Noise — architecture & lock notes (`signalvsnoise-v2` → `signalvsnoise-v3`)

**Known-good:** tag `signalvsnoise-v3` · golden `audit/signal-vs-noise-golden-sample.json`
(2 cases, live-captured 2026-09-10 — both career-domain, replacing the v2 sleep/nutrition cases;
see the "V3" section below for why)
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

10. **The nullable `genuinely_debated` view fields and the "null-or-populated together" filter** — a
    person-dependent unsettled question is a legitimate, common result for this tool once claims get
    specific (career, finance, any decision that hinges on details only the visitor has); don't force
    it back into a two-view shape or drop it for having empty views.
11. **`expanded.debated` defaults to `true`** — only `expanded.sources` (How the Noise Gets Made) stays
    collapsed by default.
12. **`too_broad` / `context_dependent` stay in the `noise_type` enum**, and `cherry_picked` /
    `individual_variation` stay restricted to when that specific defect is actually observable — don't
    quietly widen them back into catch-alls.
13. **`svn_why_we_know` stays "Why this holds up:" (or the equivalent per-language rewording)** — not
    "Evidence behind it" in any language; that phrasing is the exact thing rule 1 forbids the model
    from implying, and the label shouldn't imply it either.
