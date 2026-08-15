# ContextCollapse — architecture & lock notes (`contextcollapse-v1`)

Analyzes a message against multiple audiences (context-collapse risk): per-audience readings, intent-vs-reality gap, verdict, safer rewrites, "nuclear scenarios". **Frontend:** `src/tools/ContextCollapse.js`. **Backend:** `backend/routes/context-collapse.js` (1 endpoint). **Golden:** `audit/context-collapse-golden-sample.json` (2 cases). Verify: `npm run check:golden context-collapse` (haiku — fast).

## Shape
- **1 endpoint `/api/context-collapse`.** `claude-haiku-4-5` (`MODELS.FAST`), `max_tokens 4000`, via `callClaudeWithRetry` (no robustness gap) + `withLanguage('', userLanguage)` + `withLocaleContext`. Guard `!message_analysis && !rewrites` (top-level). In `LOCALIZED_TOOLS` (`ctc_`).
- Output: message_analysis, readings[] (per audience), intent_vs_reality, verdict, rewrites[], nuclear_scenarios[]. `readings`/`rewrites` scale with audience count.

## Audit fixes locked here (2026-07-12)
1. **⚠️→cleaned: 15 annotations stripped** (`— one sentence` ×13, `— 1-2 sentences` ×1, `— 2-4 sentences` ×1).
2. **⚠️ PF-22 — the lone inline `<CopyBtn>` removed** (+ its import). ContextCollapse was the ONLY tool in the catalog with an inline copy button; the catalog-wide pattern is global-ActionBar copy only (via `useRegisterActions(buildCopy())`). Per "standards override UX", removed the per-rewrite copy button for consistency; the global copy still includes all rewrites.

## DO NOT silently reverse
1. **Stripped annotations** — check-golden checks STRUCTURE not content.
2. **No inline CopyBtn** — copy goes through `useRegisterActions` only (PF-22).

## Known / accepted
- 0 baseline issues after PF-22 fix. No truncation at 4000 (haiku, DE ~28s).
- No golden neutralization — readings/rewrites always ≥ audience count; nuclear_scenarios always present.

## Rewrite + DeftBrain treatment (2026-08-15)
- **Description** replaced with the owner's copy.
- **Audience rows: three decisions became two.** Audience, relationship and
  context were three separate inputs, repeated per audience — with two
  audiences that is six fields before the message is even described.
  Relationship folds into the label ("My boss (manager)"), context stays on its
  own line and reads as optional. `ctc_relationship_ph` and the three
  `ctc_ex_audN_rel` example keys were removed rather than left as dead keys in
  thirteen languages — 40 keys in total.
  The `relationship` property is still sent as an empty string so the route's
  shape is unchanged; only the input is gone.
- **PF-31** ⌘↵ chip. PF-30/17c came in with the catalog sweep.
- **Two fixed panels** at the head of the results: 💚 First, this matters
  ("most communication problems aren't caused by bad intentions") and 🎯
  Today's only job ("don't change your message yet — first, see how it's being
  read").

**Untouched on purpose:** "What are you trying to say?" and "What are you
worried about?" — the review called them the two strongest fields in the form,
and the Decoder Ring cross-link stays exactly where it is.

## Certainty and section names (2026-08-15)
**The overconfidence had a specific cause.** The tool receives the message AND
the sender's stated intent, and was treating both as evidence about the
message. "The sender is anxious about trust" came from `without losing trust`
in the INTENT field, which the audience never sees. It also quoted inferences
as if they were in the message — "I made this decision unilaterally because I
had to" appears nowhere in what was written.

A HOW CERTAIN YOU MAY SOUND block now heads the prompt with three rules: never
put words in the message, the stated intent is not part of the message, and no
mind-reading (describe what the wording does, not what the writer feels).
Verified live: readings now open "this may land as…"; four hedge markers, zero
hard claims.

**Risk labels say what to do.** "Safe" is a promise no communication tool can
make. safe → **Unlikely to be misread**, mild_risk → **Worth a second look**,
risky → **Rewrite recommended**, dangerous → **Rewrite before sending**.

This also fixed a live i18n bug: the badge rendered
`r.risk_level.replace('_',' ')` — the raw English enum, in all thirteen
languages. The enum stays pinned to English (withLanguage translates JSON
string VALUES, so a frontend switch on a translated enum breaks everywhere) and
a `RISK_KEY` map resolves the localised label.

**Sections renamed to the tool's own philosophy**: Tone detected → **What you
meant**, a new heading over the readings → **What they're likely to hear**,
Trigger: → **What might trigger a different reading:**

**Untouched, at the owner's explicit request:** the disclaimer, and
"screenshot-safe" in the platform note — which they want to become part of the
DeftBrain vocabulary.

## Why the first hedging pass did not hold (2026-08-15)
A STANCE block at the top of a prompt does not survive a field description that
demonstrates the opposite. `tone_detected` said "not just 'friendly' but
'casually assertive with an undercurrent of frustration'" — that is where
"steel confidence" came from. `subtext` asked "what does this communicate
between the lines that the sender might not realize?", which is an invitation
to psychoanalyse. `emotional_impact` said "how this makes them FEEL". The
nearest example wins; the same lesson as the tone selector in Complaint
Escalation Writer. **Fix the fields, not just the preamble.**

- `tone_detected` → **Overall impression**: 3-4 short plain lines, explicitly
  no metaphor, describing the message rather than the person. Live: "Decisive
  and solution-focused. / Minimal emotional labor. / Frames delay as a quality
  choice, not a failure. / No acknowledgment of impact on the receiver."
- `subtext` → **One possible reading**: a first-person paraphrase of what the
  WORDS convey, with both offending sentences quoted in the schema as BAD
  examples. Live: "I identified problems and I am taking action to fix them. /
  The decision is already made."
- `reads_as` must hedge; `emotional_impact` may not state a feeling as fact.

**Confidence per reading.** New `confidence: high | medium | low`, pinned
English like the risk enum, rendered as ●●● / ●●○ / ●○○ plus a localised
label. The rule ties it to the relationship: professional and transactional is
high, close or emotionally complex is low, and a parent's reading is inherently
more speculative than a manager's. Live on a three-audience run: boss high, mum
low, friends high — exactly the asymmetry the owner described. It does per
reading what the disclaimer does once at the foot.

**Owner's verdict, recorded:** the structure is finished. From here the work is
calibrating the model's confidence, not moving sections around.
