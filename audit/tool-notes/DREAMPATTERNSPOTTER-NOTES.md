# DreamPatternSpotter — architecture & lock notes (v1, 2026-07-02)

Dual-mode dream tool: single-dream depth analysis (classification, themes with multi-school perspectives, symbols, lucid/nightmare/sleep analysis, insights, reflection questions, therapist export) + multi-dream pattern analysis. 2 `claude-sonnet-4-6` endpoints. Reflective, non-deterministic framing (prompts mandate tentative language). In `LOCALIZED_TOOLS`.

- **Golden:** `audit/dream-pattern-spotter-golden-sample.json` (single + pattern — both guard the restored schemas). Verify: `npm run check:golden dream-pattern-spotter`.

## DO NOT silently reverse
1. **Both prompt JSON schemas are COMPLETE, CLOSED, and BOUNDED (max_tokens 6000 each).** They were once truncated mid-template (missing closing `}` + dangling comma) — sections were deleted from the prompts but not the frontend, orphaning ~8 renderer sections including the tool's flagship features (insights, reflection_questions, therapist_export_summary, life-event connections). Restoring them WITHOUT the OUTPUT LIMITS caps truncated every run at 4000 (→ 500) — keep the per-array caps (themes ≤3, symbols ≤4, reflection_questions ≤4, …) AND the 6000 ceiling together; neither alone suffices. The goldens assert the restored keys exist. If editing the prompts, verify the JSON template braces balance.
2. **`loadExample` spreads into the existing state shape** (`setSingleDream(prev => ({...prev, …}))`) — replacing the whole object drops the `emotions` object and **hard-crashes the tool** on the new-user first-click path (TypeError reading `.anxious`).
3. `nightmare_frequency` is an instruction ("count dreams whose description indicates a nightmare"), NOT the old hard-interpolated `"0/${totalDreams}"` literal — no UI collects `isNightmare`, so the literal deterministically contradicted the analysis text.
4. Cmd+Enter is handled ONLY by the document-level handler (the inline textarea handler double-submitted). No second example button in pattern mode (a ghost, label-less one existed).
5. History cap 50 (`// Exception (PF-25)` comment required — it's a journal). Copy export ends with the `BRAND` const; history dates via `formatDate(h.date, userLocale)`.

## Rebuilt on what a dream can actually support — 2026-08-25 (`dreampatternspotter-v2`)

**Deleted.** Sleep quality analysis, sleep health assessment, REM/dream-recall
inference, nightmare severity, nightmare type, PTSD indicators,
professional-help recommendation, nightmare prognosis, therapeutic value,
growth areas, sleep recommendations, the therapist export summary, dream-type
classification and the lucid-dreaming section. All of it was produced from one
paragraph of remembered dream, which supports none of it.

**Single dream, the owner's seven sections:** at a glance · what stands out ·
possible associations (always several, never "the meaning") · different lenses
(collapsed; Jungian and Freudian named as *traditions*, plus what dream
research can and cannot say) · connections to your life · questions worth
sitting with · patterns to watch.

`connections_to_your_life` is **forced empty in code** when the dreamer gave no
waking-life context. Inventing a correlation is the failure the section exists
to avoid, and a prompt rule alone would not be worth the risk.

**Pattern analysis became counting**, which is what earns the tool its name:
recurring elements, recurring *reported* emotions, and recurring narrative
patterns, each with a real count out of N and the dreams named. Anything
appearing once is filtered out in code — a pattern of one is a single dream
wearing a label — and `of` is filled server-side after one array came back
rendering "2 of undefined".

**Two input changes.** "What was happening in your life? (optional but
helpful)" became "Anything happening in your life that might be relevant?
(optional)" — the old phrasing recruited the model as much as the dreamer,
framing a waking-life correlation as the thing being looked for. And emotional
tone stays optional in the form, with the backend now told explicitly not to
infer feelings when none were reported, rather than quietly deciding.

**Both endpoints collapsed from two parallel calls to one.** The split existed
for a 10-key schema at 6000 tokens that no longer exists; the new output is
small enough that one call is faster and cheaper.

Live: single dream 33.8s, none of the deleted concepts present, no emotions
inferred when none supplied, `connections_to_your_life` empty. Pattern mode
over five dreams found transit settings 3/5, college figures 3/5, anxious 4/5,
and told the dreamer plainly that patterns this small can form by chance.

One clean-up worth recording: sweeping "unused" palette keys automatically
removed four that the house rules require whether referenced or not
(`required`, `success`, `warning`, `danger`). Restored. The audit asks for
those by name; only the dream-specific keys were genuinely dead.

**Adopted v2.** Not among the 47 frozen, so the rewrite triggered Gate 9. The
guard leaves interpretation alone — offering several readings of a dream is the
product, and multiple competing readings of one image are correct rather than
contradictory. It polices the authority this rebuild removed: clinical
judgement, sleep claims, neurological explanation of this dream, universal
symbol meanings stated as fact, invented waking-life events, emotions never
reported, prescriptions, and any single definitive meaning.

Gate 9's schema-congruence check flagged the `emotion` key in
`recurring_emotions` as "names what another person feels". Here it names what
the *dreamer selected about their own dream and sent to us*, which is the one
case the smell is not meant to catch — recorded in
`SCHEMA_CONGRUENCE_EXEMPT` with that reason rather than renaming a field to
dodge a check. The smell still fires for the other nine patterns.

## Borrowed evidence — 2026-08-25

Description replaced with the owner's, which describes what the tool now does
rather than the frameworks it used to invoke: spots notable elements, possible
associations and recurring patterns, then asks questions — with the three
lenses as *optional additional ways of looking*, which is where they belong now
that they are collapsed and named as traditions.

**The prompt did not cover the claim rule and now does.** Nothing had stopped
an interpretation being dressed as evidence. "Water commonly represents the
unconscious in the research" is a *stronger* claim than "water is the
unconscious", because it borrows a citation that does not exist — and the
existing rules only caught the second form. Added: do not describe an
interpretation or claim about dream content as documented, research-supported,
scientifically established, universal, common or typical unless it actually is;
and where general dream-science context is given, separate what research has
broadly found from speculation about *this* dream, with no general finding
presented as explaining the dream in front of you.

Guard terms `interpretation_dressed_as_research` and
`general_finding_applied_to_this_dream`. **Both fired on their first real run**
— a deliberately over-symbolised dream (falling, teeth crumbling, a snake) drew
the first on the Freudian lens and the second on the dream-science lens. The
shipped text after repair reads: *"Falling, teeth-loss, and fear are common
elements in remembered dreams across many people, though what any individual
dream means — or whether it means anything at all — remains an open
question."* General finding stated as general, this dream left open.

Checked the repair did not cost a section: all seven present afterwards, with
`connections_to_your_life` empty because no waking-life context was supplied,
which is the enforced behaviour rather than a loss.

Worth knowing: the V2 core check flagged `patterns_to_watch` as an
`unnecessary_section`. It is a section the owner specified, and the repair
rewrote rather than removed it, so nothing was lost — but the general standard
and this tool's design disagree about that field, and a future repair could
decide differently.
