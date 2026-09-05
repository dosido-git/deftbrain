# CutToTheChase (was NoiseCanceler) — lock notes (`noisecanceler-v1`)

**Renamed 2026-07-16 in two passes.** Pass 1: display title "Noise Canceler" → "Cut to the
Chase" only (title, `seoTitle`, description, guide prose, icon `🔇`→`✂️`) — catalog `id` and URL
left alone at first. Pass 2, same day, on the user's explicit "definitely and always" (the
display name should always match the URL — a real, user-visible inconsistency, unlike the
backend-route-only mismatches on WhichLife/SocialBatteryAdvisor): catalog `id`
`NoiseCanceler`→`CutToTheChase`, frontend file `src/tools/NoiseCanceler.js`→`CutToTheChase.js`,
`TOOL_IDS` entry in `backend/server.js`, a `/NoiseCanceler`→`/CutToTheChase` 301 in
`LEGACY_REDIRECTS`, `tool-og-slugs.json` / `og-slug-map.json` keys, the
`localization-audit.js` allowlist entry, and the 7 `guides/workplace/*.js` `toolId` refs (then
`npm run build:guides` to regenerate all 551 static guide pages, since every guide embeds the
shared `chrome.js` all-tools footer index). **Deliberately left unchanged, per the established
i18n-stability precedent (SubSweep/DebateMe):** backend route file/endpoint
(`noise-canceler.js` / `/api/noise-canceler`), i18n filename/prefix
(`noise-canceler.js` / `nc_`), and the golden sample (still tests `/api/noise-canceler`,
unaffected since the API itself never changed).

Reasoning for the rename itself: "Noise Canceler" tested badly with the user directly ("I read
the name and didn't have a clue what it does") — the noise-canceling-headphones metaphor
requires an extra translation step (audio noise → information noise) that didn't land, and the
word "noise" was already doing a different job on `SignalVsNoise`. Landed on "Cut to the Chase"
after ruling out `Essence Extractor` (too abstract, sounds like a generic summarizer — collides
conceptually with Recall/Plain Talk/The Debrief) and confirming this tool is NOT redundant with
**Jargon Assassin** (language comprehension — full plain-English rewrite, no personalization) or
**Plain Talk** (broader text-structure/rhetorical analysis, explicitly recommends other tools) —
this tool's unique mechanic is that it's the only one of the three that takes the reader's
personal situation as input and filters for personal relevance (costs/requires
action/buried), not language or structure. Also fixed the `seoTitle` along the way — it said
"Summarize Long Documents," directly contradicting this tool's own guide copy ("Not a
summarizer — a personalized relevance filter").

## Original lock notes ("What Actually Affects Me?")

Personal relevance filter — pastes a dense bureaucratic document + your situation, extracts only what
affects you (actions, costs, savings, buried items, questions). **Frontend:** `src/tools/CutToTheChase.js`.
**Backend:** `backend/routes/noise-canceler.js` (1 endpoint, `MODELS.SMART`, **max_tokens 3500**).
**Golden:** `audit/noise-canceler-golden-sample.json` (1 dense DE lease case). Verify: `npm run check:golden noise-canceler`.

## Audit fixes locked here (2026-07-14)
1. **🐛 `effort` enum degradation.** Schema was `"quick (< 5 min) | moderate (30 min) | involved (1+
   hour)"`; the frontend does strict `e === 'quick'` / `=== 'moderate'` for the effort badge → the
   parentheticals meant every effort fell through to the "involved" label. **Fix:** bare
   `"quick | moderate | involved"`. Verified DE: quick/moderate emitted clean.
2. **🐛 Truncation on the tool's own target inputs.** 7 uncapped arrays at `max_tokens 2000` — a
   dense German lease/EOB (exactly what this tool is for) truncated → parse fail → 500. **Fix:** cap
   all 7 arrays (action ≤5, costs ≤5, saves ≤4, affects ≤4, buried ≤4, consult ≤3, questions ≤5) +
   `max_tokens 3500`. Verified DE dense lease: ~1372 tok, 4/3/3/3 items.
3. **⚠️ amount fields.** Rendered raw; carried a `(number)` annotation. **Fix:** stripped + "short
   values in the user's local currency". Verified DE: "+85 EUR/Monat" etc.
4. **⚠️→cleaned:** 23 annotation leaks (`— one sentence` ×20, `(number)` ×2, `— 3-6 words`); cleaned
   the `confidence` enum; added the no-inner-double-quote rule (quoted document phrases in German).

## DO NOT silently reverse
- Clean pipe enums (`effort`/`confidence`/`priority`); the 7 array caps + `max_tokens 3500`;
  local-currency amounts; the no-inner-double-quote rule; no annotation suffixes.

## Rename + full rewrite, 2026-09-04 (`CutToTheChase` → `DocumentDetective`)

**Rename.** "Cut to the Chase" → "Document Detective," alongside the rewrite
below (not a bare relabeling). Component file, `tools.js` id/title/tagline/
description/guide, `TOOL_IDS`, OG slug map (added a `DocumentDetective` key
pointing at the same `noise-canceler` slug value; the old `CutToTheChase` key
stays, per the `CrashPredictor` precedent — a legacy id key needs to keep
resolving an OG image for anyone hitting the old URL before the redirect
fires), `TOOL_ALIASES`, `localization-audit.js` allowlist, and the 7
`guides/workplace/*.js` `toolId` refs all updated. `server.js` 301s from
`/NoiseCanceler`, `/noisecanceler`, `/CutToTheChase`, `/cuttothechase` — all
single-hop to `/DocumentDetective`. `audit/RENAMES.md`'s `NoiseCanceler` row
collapsed to point at the final name rather than gaining a second row.
**Deliberately left unchanged, per the established i18n-stability precedent
(SubSweep/DebateMe) — this tool was already locked (`noisecanceler-v1` +
golden sample) before this pass:** backend route file/endpoint
(`noise-canceler.js` / `/api/noise-canceler`) and i18n filename/prefix
(`noise-canceler.js` / `nc_`). localStorage keys stay `noisecanceler-*` too
(the exception's own logic — a rename must not silently empty saved user
state), but were bumped to `-v2` for an unrelated reason: the result shape
changed completely, and an old cached `noisecanceler-result` would be the
wrong shape for the new renderer.

**Why rewrite, not just rename.** The old prompt was a generic "extract what
matters" filter with no source discipline. Live bug reports (all fixed here):
asserting a claim was "almost certainly still valid" when the document alone
can't establish that; broadening a document's "must not make an agreement"
into "must not admit liability"; inventing a betterment deduction as
"significant" with no method behind the word; inventing who else owes money
("the neighbour or their insurer would need to cover that") when the
document only says what it doesn't cover; treating the ABSENCE of a
mentioned fact as evidence of its opposite ("no indication your flat was
unoccupied, so this exclusion isn't a concern"); inventing reader psychology
and outside-industry norms in "Buried but Important" ("easy to miss when
anxious," "insurers sometimes apply betterment routinely"); and an aggregate
AI confidence badge that the new CONFIDENCE section explicitly bans.

**Backend.** Full CORE PROMPT replacement built around a three-way SOURCE
BOUNDARY (DOCUMENT / USER / REASONING — never a fourth, silent category of
outside-world facts). Schema replaced: `document{type, bottom_line}` plus 8
arrays (`needs_attention`, `money`, `also_relevant`, `doesnt_appear_relevant`,
`buried_but_important`, `practical_next_steps`, `questions_to_ask`,
`outside_help`), each grounded item carrying a `source` and, on the three
substantive arrays, a per-item `status` (`CLEAR FROM DOCUMENT` /
`REASONABLE READING` / `NEEDS CLARIFICATION`) replacing the old single
aggregate `confidence` field. `max_tokens` raised 3500→6000 given the richer
per-item shape (this exact tool has a documented history of truncating on
dense German leases/EOBs at a lower cap); structural array caps enforced in
code (`capArrays`) as a backstop to the prompt's own "AT MOST" limits.

Adopted `runOutputGuard` (the LLM-based adversarial v2 guard used by
`contract-decoder.js` and 20 other routes) rather than a bespoke regex
`validateResult` array, because this tool's failure modes are exactly the
shape that guard already generalizes well — invented facts, unsupported
predictions, false precision — plus a `prohibit`/`require` list encoding the
tool-specific corrections above (`unsupported_claim_or_coverage_validity`,
`invented_outside_practice_or_norm`, `invented_reader_psychology`,
`broadened_or_strengthened_document_language`,
`invented_third_party_obligation`,
`practical_suggestion_stated_as_document_requirement`,
`absence_of_a_fact_treated_as_its_opposite`,
`invented_deadline_or_consequence_not_in_document`,
`aggregate_confidence_score_or_badge`, `invented_effort_or_time_estimate`,
`unsourced_conclusion`). The guard's `promise` block spells out the exact
bad examples from the bug report so the adversarial checker has concrete
positive/negative anchors, not just abstract categories. Fail-open: a guard
failure (timeout, API error) ships the ungrounded-but-otherwise-fine answer
rather than a 500.

**The `status` enum is pinned to exact English in the prompt regardless of
response language** — the userPrompt says so explicitly, right before the
schema's limits paragraph. Without this, `withLanguage` would translate the
status VALUE along with the rest of the JSON's prose in a non-English
response, and the frontend's badge color switch (which matches the literal
English string) would silently render an unstyled badge. This is the
`i18n-enum-vs-English-literals` failure class from the audit playbook,
caught and fixed before it ever shipped rather than after a live probe.

**Frontend.** `needs_attention`/`money`/`also_relevant` render inline with a
color-coded status badge (emerald/sky/amber for
clear/reasonable/needs-clarification — a clarity signal, calm on purpose,
not a risk score). A "Needs Clarification" section is a DERIVED rollup —
every `NEEDS CLARIFICATION` item across those three arrays, collected for
scanability — not a separate backend field; items still appear in their own
section too. Renamed "🔇 Safely ignore" → "➖ Doesn't Appear Relevant" and
"👨‍⚖️ Consider consulting a professional" → "👤 Outside Help May Be Useful";
dropped the old aggregate "⚠ medium confidence" badge entirely, not replaced
with anything. Cross-sell to Lease Trap Detector reworded from "goes even
deeper on predatory clauses" (calling clauses predatory before they've been
evaluated) to "can help you examine lease clauses in more detail."

**Past Filters** stores exactly: document type, situation, concern, bottom
line, date, and the full result object to reopen — no pattern detection,
risk scoring, or behavioral profiling across entries, matching the explicit
instruction not to build any of that on top of history.

**Relationship to Jargon Assassin, preserved on purpose:** Document
Detective answers "what in this long document matters to MY situation"
(personalized relevance filter); Jargon Assassin answers "what does this
difficult document actually mean" (plain-English translation, no
personalization). Document Detective may explain enough of a clause to make
its relevance legible, but stays a relevance filter — it does not expand
into Jargon Assassin's full clause-by-clause translation job.

**Examples unchanged.** `loadExample`'s two input examples (the dense lease
and the benefits packet) are pure input text, independent of the output
schema — kept as-is, avoiding a second full-catalog translation pass for
content that didn't need to change. Only the example ROTATION KEY changed
(`CutToTheChase` → `DocumentDetective`, an internal `localStorage` counter,
not user data — not covered by the localStorage-stability exception).

**i18n.** All value/key changes stayed under the `nc_` prefix — see the
backend-route-stability rule above for why the prefix itself never moves. A
new instruction pinning the `status` enum to English was checked against
`i18n-convention-audit` in every language after translation, since a model
told "respond in German" will translate an enum value unless explicitly told
not to.

## Original lock notes carried forward below (pre-2026-09-04)

## Follow-up pass, 2026-09-05: file upload, FINAL LLM CORRECTIONS, backend rename, icon

**File upload.** Matches ContractDecoder's pattern exactly — this repo has no
shared dropzone component, every tool hand-rolls the same ~15-line
FileReader/base64 flow. PDF → `FileReader.readAsDataURL`, sent as
`pdfBase64` (the full data URL, untouched by the client); any other accepted
type (`.txt`/`.md`/`.rtf`/`.html`) is read as plain text straight into the
existing textarea. The two paths are mutually exclusive in the UI — picking
a file clears any pasted text and hides the textarea; removing the file
clears the file input's own value too, not just React state. 10 MB client
cap, matching the majority convention (ContractDecoder/PlainTalk/DVT/
BillRescue/QuoteCheck) over LeaseTrapDetector's 20 MB outlier.

Backend: `hasPdf = typeof pdfBase64 === 'string' && pdfBase64.length > 100`;
the `data:application/pdf;base64,` header is stripped server-side
(`pdfBase64.slice(pdfBase64.indexOf(',') + 1)`), never on the client, and
`media_type` is hardcoded to `'application/pdf'` rather than guessed from
the data URL's own prefix — bill-rescue shipped a PDF as `image/jpeg` that
way (commit `164fffee`) and every upload 500'd instantly. `messages[].content`
becomes `[...pdfBlocks, {type:'text', text: userPrompt}]` only when a PDF is
present; `system` is untouched either way — `withLanguage`/`withLocaleContext`
apply only to the system STRING, never to a content array (`array + string`
coerces to `"[object Object],…"`, the exact bug that broke every PDF upload
on doctor-visit-translator, commit `8199f070`).

Added `/api/document-detective` to `PDF_BODY_PREFIXES` in `backend/server.js`
(30 MB body limit) — it wasn't there before because the route accepted no
uploads until this pass. In the process, noticed `/api/contract-decoder` is
missing from that same list despite advertising 10 MB PDFs in its own
frontend — a pre-existing gap, unrelated to this tool, flagged as a separate
task rather than folded in here.

**The v2 guard's own check call never sees the PDF** (attaching it twice
would double the cost for no benefit — the guard checks for invented outside
facts, not document re-verification). When `hasPdf`, the guard's `supplied`
block says so explicitly and narrows which violation categories are even
askable: it must not flag `unsourced_conclusion` or
`broadened_or_strengthened_document_language` on the PDF path, since both
require reading text it was never given — mirrors how contract-decoder's own
PDF path instructs its guard ("you cannot see it — but the quotes below ARE
the contract... assume the generator read the document and you did not").

**FINAL LLM CORRECTIONS.** The most important leak, per live review: the
tool would answer "is this enforceable" from remembered legal knowledge —
calling an absent governing-law clause "a material gap" or "the primary
factor," asserting such clauses are "typically present," then explaining how
different states treat a non-compete. None of that is document content. Added
a new CORE_PROMPT section, OUTSIDE-WORLD QUESTIONS, placed right before
OUTSIDE HELP (the section is the correct destination for exactly these
questions): separates what the document establishes from what needs outside
verification, with the governing-law case as the worked example precisely
because it was the one that kept getting through. Also strengthened BURIED
BUT IMPORTANT's existing banned-outside-claims list (already had "insurers
routinely.../employers normally.../HOAs typically...") to include "clauses
of this type are typically present," since it's the same violation in a new
domain, and reinforced OUTSIDE HELP to ban jurisdiction-specific legal
explanation even inside an outside-help item. Added a closing NORTH STAR
("Document Detective does not complete the document... investigates the
document the visitor supplied... identifying a boundary the document can't
answer IS a successful answer") right before the JSON instruction.

Five new `outputGuard.prohibit` categories, anchored in the guard's `promise`
text with the exact bad examples so the adversarial checker has concrete
positive/negative cases, not just abstract labels:
`outside_legal_or_practice_conclusion`, `invented_missing_clause_significance`,
`invented_legal_consequence_from_signing`, `invented_visitor_context_not_supplied`,
`document_called_incomplete_rather_than_silent`.

Live-verified on the employment-agreement example (the same one the bug
report used): first draft failed the guard on 7 fields — including 2 hits
each on the two new categories that map directly to this correction
(`invented_visitor_context_not_supplied`, `outside_legal_or_practice_conclusion`)
— and the repaired final answer contains zero mentions of "governing,"
"jurisdiction," "material gap," "primary factor," or "typically present."
`document.bottom_line` correctly reads "...this document alone cannot tell
you how enforceable either one is against you," and the `outside_help` items
state flatly that the document doesn't specify governing law and name an
employment attorney — without explaining why or how enforceability varies
by state. This case is now `employment-agreement-governing-law` in the
golden sample specifically to regression-test this leak.

**Known limitation, not a regression:** the guard repairs each flagged field
independently, with no view of sibling array items, so a rare run can leave
two `practical_next_steps` entries saying nearly the same thing (seen once,
this session). Cosmetic — not a grounding violation, and not worth a
cross-field dedup pass that risks the guard's actual job.

**Backend route rename** (separate decision from the icon/prompt work,
requested directly): `noise-canceler.js`/`/api/noise-canceler` →
`document-detective.js`/`/api/document-detective`, so the backend finally
matches the frontend component name. i18n filename/prefix
(`noise-canceler.js`/`nc_`) deliberately did NOT move — same call as
JustifyMyMeeting/MeetingHijackStopper. Updated: the route file itself
(`git mv`), the frontend's `callToolEndpoint('document-detective', ...)`
call, `PDF_BODY_PREFIXES` in `backend/server.js`, the golden sample
(renamed + both `endpoint` fields inside), and `audit/RENAMES.md`'s
`NoiseCanceler` row. `backend/routes/index.js` needed no manual wiring — it
auto-discovers every route file in the directory by filename.

**Icon rebrand**, completing the transition away from "Cut to the Chase":
`icon` in `tools.js` changed ✂️ → 🔎, along with every hardcoded ✂️ fallback
literal inside `DocumentDetective.js` (header icon, the results-header "What
Matters Here" card, the loading spinner, the submit button) — the exact
"changed the icon but left the fallback behind" gotcha this file itself
warns about, caught by grepping for the old emoji rather than trusting the
one `tools.js` edit. `nc_copy_header`'s hardcoded ✂️ prefix (13 languages)
also updated — that one isn't a React fallback, it's plain text baked into
the copy-to-clipboard header string. Tagline TEXT is unchanged
("Paste the document. Find what matters to you.") — the 🔎 the user wrote in
their instruction is the icon that already renders separately via
`tool?.icon` before the tagline text; baking it into the string too would
double it, the same reasoning applied to NerveCheck's tagline earlier this
session. "✂️ THE CHASE" → "🔎 WHAT MATTERS HERE": the icon prop on that card
became 🔎, and `nc_result_the_chase`'s VALUE (not its key name — matches this
session's established practice of leaving key names stable across a copy
change) was retranslated to a "what matters here" equivalent across all 13
languages.

**Bug found and fixed in passing, unrelated to any of the above:** the
original 2026-09-04 rewrite's i18n assembly double-escaped every embedded
newline in `nc_ex_doc`/`nc_ex2_doc` (the two "Try an Example" document texts)
across all 13 languages — the source carried a literal `\\n` (backslash,
backslash, n) instead of `\n`, so the parsed string held a literal
backslash-n character pair rather than a line break. Every example document
shown via "Try an Example," in every language, rendered as one run-on
paragraph with visible `\n\n` text instead of paragraph breaks. Caused by my
own extraction script treating already-escaped source text as raw and
re-escaping it. Fixed with a single global replace (416 occurrences, all
confined to those two keys — verified before applying).
