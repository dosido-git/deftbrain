# ResearchDecoder — architecture & lock notes (`research-decoder-v2`)

Explains research a visitor actually supplies — decode, headline-vs-research check, two-paper
compare, single-term explanation, and personal relevance as progressive disclosure. **Frontend:**
`src/tools/ResearchDecoder.js`. **Backend:** `backend/routes/research-decoder.js` (5 endpoints;
`MODELS.SMART` for decode/headline/compare/relevance, `MODELS.FAST` for term). **Golden:**
`audit/research-decoder-golden-sample.json` (1 DE case + 4 EN). Verify:
`npm run check:golden research-decoder`.

## V2 rewrite (2026-09-08) — owner brief

The v1 tool promised more than a single supplied paper could support: "a growing body of
research," other cohort studies nobody supplied, what researchers find "surprising," a live
scientific debate, and a dietary-measurement method filled in from "what's standard in this
field" — none of it present in the supplied abstract. The rewrite draws one hard line: explain
the research in front of you, and say so plainly whenever something needs outside knowledge the
product doesn't have.

**What changed:**
- **File/PDF upload added** — decode, headline, and relevance all accept `pdfBase64`, mirroring
  `document-detective.js`'s exact pattern (`type: 'document'` content block, `media_type` fixed to
  `application/pdf` never guessed, PDF blocks spread ahead of the text block in the message array
  — never concatenated with the system STRING, which coerces an array to `"[object Object],…"`).
- **Primary nav**: Decode · Headline Check · Compare · Explain a Term · Recent. Removed as
  primary modes: For Me? (now progressive disclosure under a decode result, renamed "What does
  this mean for me?"), Saved (merged into Recent), Dictionary (removed — auto-accumulating jargon
  glossary was peripheral to the core problem).
- **Field/category selector removed** from Decode — selecting a field encouraged the model to
  import field-specific assumptions the supplied text never stated.
- **One shared `SYSTEM_PROMPT`** carries the source-boundary discipline (SOURCE FACT / DIRECT
  INFERENCE / GENERAL EXPLANATION / UNKNOWN FROM EXCERPT / OUTSIDE RESEARCH CLAIM) for every mode;
  each endpoint's user prompt states `ACTIVE MODE: X` and supplies that mode's schema. No literal
  `DEFTBRAIN_OUTPUT_STANDARD_V2` string in the prompt text — that's decorative noise the real v2
  standard doesn't need (same fix as Say What?'s install); the real standard comes from
  `router.outputStandard = 'v2'` below.
- **Schema rewrite, all 5 endpoints**:
  - `/research-decoder` (decode): `source_scope, finding, what_they_did{study_design,
    population_or_subjects, measurement_or_intervention, comparison, timeframe}, key_numbers[],
    what_this_study_supports[], what_it_doesnt_establish[], limitations{reported_in_source[],
    design_limits[], may_be_missing_from_excerpt}, jargon[], bottom_line, important_unknowns[]`.
    Was `one_sentence/why_it_matters/what_they_did/what_it_proves/what_it_doesnt_prove/
    limitations[]/jargon_decoded/so_what/field_context`. Guard: `!parsed?.finding`. 5500 max_tokens.
  - `/research-decoder-headline` (was `-media`): `research_says, headline_says, assessment
    (MATCHES|MOSTLY_MATCHES|OVERSTATES|MISSING_CONTEXT|CONTRADICTS|NOT_ENOUGH_TO_TELL),
    differences[], what_it_got_right[], more_accurate_version`. Requires BOTH research text (or
    PDF) and headline — never analyzes a headline from headline claims alone. Dropped
    `should_you_worry` entirely (a headline comparison is not a personal risk assessment) and the
    `Accurate..Completely wrong` + intent-implying distortion-type labels. Guard:
    `!parsed?.research_says`. 3000 max_tokens.
  - `/research-decoder-compare`: `same_question{assessment: YES|PARTLY|NO|UNCLEAR}, paper_1.finding,
    paper_2.finding, material_differences[], relationship
    (AGREE|MOSTLY_AGREE|MIXED|DISAGREE|DIFFERENT_QUESTIONS|UNCLEAR), possible_explanations[]
    {status: OBSERVED_DIFFERENCE|POSSIBILITY}, what_each_can_tell_you, together, still_unknown[]`.
    Dropped `which_to_trust_more` (no global paper-trust ranking) and unlabeled "why different"
    guesses. Guard: `!parsed?.paper_1?.finding`. 3000 max_tokens.
  - `/research-decoder-term` (was `-jargon`, now single-term not a list): `plain_meaning,
    what_it_means_here, why_it_matters_here, example, common_confusion`. Lightweight — `MODELS.FAST`,
    900 max_tokens, no output guard (matches other lightweight single-field modes catalog-wide).
  - `/research-decoder-relevance`: `population_match, outcome_match, decision_support` (three
    DISTINCT assessments — a person can resemble the study population while the study still
    doesn't settle their decision), `what_you_can_take_from_it, what_it_cannot_tell_you_personally[],
    questions_worth_asking[]`. MUST be grounded in the actual paper text/PDF, never only the
    decode digest — `paperText`/`pdfBase64` are required inputs, not a summary string. Guard:
    `!parsed?.population_match?.assessment`. 2200 max_tokens.
- **i18n prefix unchanged** (`rd_`) — this is a rewrite, not a rename; nearly every key's English
  changed meaning, so the whole locale file was retranslated fresh rather than patched key-by-key.
- **Persisted key bumped**: `research-decoder-recent-v2` (was two separate v1 keys, `-saved` and
  `-history`, with different shapes — a v1 value restored here would not match what this file
  reads from it).
- **Catalog copy rewritten** (`src/data/tools.js`): tagline, description, primer, and the full
  `guide` block all described the v1 tool (field selector, confidence-level "so what," auto
  dictionary, "whether what you read about it is true"). All replaced to match the actual v2
  promise per the install kit's "copy outlives the tool" trap.

## DO NOT silently reverse
- The source-boundary discipline in `SYSTEM_PROMPT` (OUTSIDE RESEARCH CLAIM must never be
  presented as coming from the supplied paper; abstract vs. full-text distinction via
  `source_scope`).
- `population_match` / `outcome_match` / `decision_support` staying THREE separate assessments,
  never collapsed into one relevance verdict.
- `pdfBase64` accepted on decode, headline, AND relevance (a paper uploaded as a PDF for Decode
  must carry through to "Check a headline" and "What does this mean for me?" without forcing a
  re-paste — the frontend's `hlPdfBase64` state and quick-action carry-over exist for exactly this).
- No "bigger picture," fake confidence label, personal behavior recommendation from one study, or
  invented reason two papers differ — these are explicit `router.outputGuard.prohibit` entries.
- Array caps on decode (key_numbers ≤5, supports/doesn't-establish ≤4, limitations sub-arrays
  ≤5/≤4, jargon ≤5, important_unknowns ≤4) — the schema is large enough that German truncation is
  a real risk at anything under ~5000 max_tokens; verified clean at 5500 with a live German case.
