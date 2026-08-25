# CultureBriefing — architecture & lock notes (`culturebriefing-v1`)

Travel culture briefing for a destination: overview + risk_level + ~11 sections (greetings, taboos, dining, dress, tipping, business, religion, transport, safety, phrases) each with dos/donts/notes + insider_tips. **Frontend:** `src/tools/CultureBriefing.js`. **Backend:** `backend/routes/culture-briefing.js` (1 endpoint). **Golden:** `audit/culture-briefing-golden-sample.json` (2 cases). Verify: `npm run check:golden culture-briefing`.

## Shape
- **1 endpoint `/api/culture-briefing`.** `claude-sonnet-4-6` (`MODELS.SMART`), **`max_tokens 5000`**, `callClaudeWithRetry` (no robustness gap), guard `!sections || !Array.isArray(sections) || !overview` (top-level). Section titles are HARDCODED in the schema; the model fills dos/donts/notes (allowed empty []). In `LOCALIZED_TOOLS`.

## Audit fixes locked here (2026-07-12)
1. **⚠️→cleaned: 11 annotations stripped** (`— 3-6 words` ×10 on the HARDCODED section titles — harmless, model doesn't generate them; `— 1-2 sentences` ×1 on `overview`, redundant with its "2–3 sentence" text). No behavior change.
2. **🐢 Bounded output for latency + scannability.** This is a HEAVY tool — sonnet at 5000 tokens generating ~11 sections runs slow (~145s EN, longer DE; observed spikes to 400s+ under API load). Added a rule: **dos/donts/notes ≤3 items each, insider_tips 3-4, each string ONE short phrase**. Keeps the briefing scannable and reduces generation time. (Did NOT switch model to haiku — that's a quality call left to the owner.)

## DO NOT silently reverse
1. **The array-cap rule** — without it the model writes long paragraphs → very slow + near the 5000 ceiling.
2. **Stripped annotations** — check-golden checks STRUCTURE not content.

## Known / accepted
- 0 baseline audit issues (was already clean — callClaudeWithRetry, guard correct).
- **SLOW tool** (~145s+/call). Golden's DE case can approach the 300s per-case timeout under API load — re-run when latency is normal if it flags.
- Golden neutralizes per-section `dos`/`donts`/`notes` to `[]` (the schema explicitly allows them empty); asserts on `sections` (~10-11), `insider_tips`, `overview`, `risk_level`.

## Re-lock `culturebriefing-v2` (2026-07-12) — Haiku + prompt levers + code-computed risk
Switched model **Sonnet → Haiku** (`MODELS.FAST`) after an A/B showed Haiku+prompt ≈ Sonnet quality at ~⅛ latency (~20s vs ~145s). Added 4 prompt levers: (1) **name local-language concepts** with a gloss (Haiku now surfaces *meishi/nemawashi/wasta* — the exact Sonnet advantage), (2) **weight depth by tripPurpose** (business → meetings/hierarchy/**gift-giving**), (3) **contrast against `homeCountry`** (deltas from home, not absolutes — this input was collected but unused), (4) **realistic numbers, no inflation** (killed the "carry 200 cards" overstatement). **`risk_level` is now CODE-COMPUTED**: the model returns a `cultural_gap` 0-100 (anchored rubric: US↔Canada minimal, US↔Japan-business significant, secular-West↔Gulf major, "round up when unsure"); code buckets it (`<25 low / 25-54 medium / 55+ high`) and deletes `cultural_gap` — fixes the stubborn under-rating (Haiku alone kept saying "low"). Verified across the spectrum: US→Japan=high, US→Canada=low, US→Saudi=high. Array caps + annotation strip from v1 retained. `check:golden` 2/2, gates clean. Frontend contract unchanged (`risk_level` still present).

## Re-lock `culturebriefing-v3` (2026-07-12) — richer inputs + output
Added the input/schema ideas from the v2 review. **New inputs:** `region` (city/region — sharpens advice for large countries) + `context` (free-text catch-all for who-you're-meeting + constraints: dietary/religious/alcohol/kids/accessibility). Both threaded into the prompt with a "HONOR these" rule — verified honored (dining tailored to vegetarian, region → Osaka/Kansai). **New output:** (1) a `gift_giving` section (🎁, model-translated title, renders via the existing sections loop — empty arrays when N/A); (2) `forgiveness{forgiven[], serious[]}` — minor slips locals overlook vs. mistakes that damage trust (rendered as green/red chip lists + in copy); (3) `confidence` (high/medium/low — model self-rates knowledge depth; **low → a subtle UI banner** so obscure destinations get hedged instead of hallucinated; verified Japan=high, Bhutan=medium). **i18n:** 8 new `cb_` keys × 13 languages (cb_region[_ph], cb_context[_ph], cb_forgiveness_title, cb_forgiven_label, cb_serious_label, cb_confidence_low) — localization gate green. Haiku + code-computed risk_level (v2) retained. Frontend verified in preview (inputs render, forgiveness/gift blocks render, constraints honored). `check:golden` 2/2, all gates + backend audit clean. Golden neutralizes per-section dos/donts/notes; keeps forgiveness non-empty.

## Schema rewritten to the governing standard — 2026-08-25 (`culturebriefing-v4`)

Owner's standard, now the single text used to write the briefing and to check
it (one constant, so the two cannot drift into paraphrases):

> Describe common practices and useful tendencies without treating a country,
> city, religion, or population as culturally uniform. Distinguish strong
> conventions from variable practices. Avoid invented precision and categorical
> claims about how locals will react. Never claim insider knowledge. For legal,
> safety, payment, tipping, religious, or rapidly changing practical
> information, clearly qualify uncertainty and avoid presenting potentially
> changing information as guaranteed fact.

**The section shape carried the problem.** `dos` / `donts` / `notes` states
rules; it had nowhere to put "this varies, and here is what it varies with",
which is the second sentence of the standard. Replaced with four arrays:

| | |
| --- | --- |
| `widely_observed` | a strong convention — a safe default across the destination |
| `best_avoided` | what commonly causes friction, described by what it signals |
| `varies` | what differs by region, city, generation, setting, religion — **and what it varies with** |
| `check_locally` | anything legal, financial, religious, safety-related or liable to have changed |

**Three renames, all of which were the field name commissioning the
violation.** `insider_tips` → `practical_tips`: a field called insider tips
will produce insider claims. `forgiveness{forgiven, serious}` → `missteps
{small_slips, higher_stakes}`: "what locals forgive" is a categorical claim
about how a population reacts. And the prompt opened "You are a cultural
intelligence expert", which claims the standing the standard forbids before a
word is written.

**`cultural_gap` and `risk_level` deleted.** A single 0–100 score for how
different a culture is *is* the uniformity claim in numeric form, and "⚠️ High
cultural complexity" was that claim on the screen. Both are also `delete`d
defensively after parsing in case the model volunteers them.

Adopted **PF-39 v2** (not among the 47 frozen). The guard does not police
describing a common practice — that is the product. It policies five things:
population treated as uniform, invented precision, predicted reactions, claimed
insider standing, volatile information stated as settled.

**Two bugs the golden caught that live testing had not.**

1. **German 500 on every call.** A fourth array across ~11 sections pushed the
   response past `max_tokens: 5000` — the documented truncation class for this
   catalog. Raised to 7000 *and* capped at 6 items total per section, because
   raising alone just moves the cliff. DE 200/56s, AR 200/46s afterwards.
2. **The thin-result detector was reporting `missing: [insider_tips,
   forgiveness, risk_level]`** on every successful call. Its expected-shape
   index is built from the goldens, so re-locking fixed it — but until the
   re-lock, a healthy response was being logged as degraded.

Catalog copy carried the same claims and was rewritten: the description
promised "the insider tips guidebooks miss", and the worked example was the
standard's failure list in miniature — a precise bow angle, "never write in red
ink", and "don't tip — it's considered insulting" as flat fact.

**Live:** guard fired usefully on the first browser run —
`population_treated_as_uniform` on the overview and `false_precision` on a
practical tip. EN/DE/AR all 200. Golden 2/2 at v4.

**Worth knowing:** the guard cannot verify a foreign-language term. One run
glossed the upright-chopsticks taboo as "yasukidachi", which does not match the
usual names for it. The prompt rule ("only include a local-language word when
CERTAIN") is the only defence there, and a confident wrong term is exactly the
failure the standard names. A vocabulary check would need a real source.

## Variability discipline made global — 2026-08-25

The rules were written for the section arrays and reached nothing else, so
`overview`, `practical_tips` and `missteps` were ungoverned. All three field
descriptions now carry the discipline directly, plus a rule stating that it
governs every field ("a sweeping sentence is not more acceptable for being in
the introduction").

- **overview** — no longer permitted to characterise a place with adjectives.
  "Lagos is direct, energetic and relationship-driven" became "Business
  practice leans formal in corporate settings… Religious observance varies by
  individual and neighbourhood rather than being uniform across the city."
- **missteps** — the owner's registers: `small_slips` describes a **recovery**
  ("a brief apology and asking for the pronunciation is a reasonable
  recovery"), never a reassurance; `higher_stakes` describes **how something
  can come across**, never an effect ("can read as rejecting hospitality", not
  "this damages trust").
- **practical_tips** — the "arrive early / Nigerian time" tip is gone.

**The real bug was in a shared library, and it had been eating the guard.**
`factCheck.getByPath` matched `^([a-z_]+)(\[(\d+)\])?(\.([a-z_]+))?$` — at most
one index and one key. Culture Briefing's content lives at
`sections[0].widely_observed[1]` and `missteps.small_slips[0]`, which both
resolve to `undefined`. `outputGuard` filters violations on
`getByPath(draft, v.field) !== undefined`, so the validator was finding
problems and every one of them was discarded before repair. The log said
`FAIL (0 field(s))` — a guard reporting failure and doing nothing.

That is why three rounds of prompt tightening had no visible effect: the
generation rule was competing with an unenforced repair. Both helpers now parse
arbitrary paths. Same run afterwards: **16 fields flagged and repaired** where
it had been 0.

This affected any route whose response nests arrays inside arrays. The other
nine v2 routes use `key[i].sub` shapes, which the old regex handled, so
Culture Briefing is the first to hit it — but it was a silent hole for
everything that followed.

**Honest state.** Nigeria and the six specific complaints come back clean. A
German run still produced one "locals will …" out of 16 flagged-and-repaired
fields. Categorical qualifiers ("is standard", "is expected") are much reduced
but not eliminated — of five survivors in one run, four were sound
("eating with your right hand is standard practice; cutlery is available in
formal restaurants but not universal in casual settings") and one was a real
failure: "Nigerians may arrive late without apology", the stereotype restated
as a plain trait after being banned from the tips. That prompted a rule
banning national and ethnic trait claims in **every** field, and it cleared.
Nothing here is a guarantee; the guard is a second reader, not a filter.
