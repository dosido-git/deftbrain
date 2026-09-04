# Name That Feeling — tool notes

Grounding rewrite, 2026-09-05. The v1 lock note called this "the healthiest
tool in the batch — no 🐛" — true by the metrics that gate checked (guard
keys, sync, format hazards) and false by the metric that actually mattered:
the tool was inventing foreign words, etymologies, and pronunciations, then
using the invented word to tell the visitor what kind of person they were.

## North star

Name That Feeling is strongest when the delight is recognition — *"Oh.
THAT'S close to what I mean."* It is weakest when the delight is manufactured
— an exotic foreign word stretched until it sounds like it fits, dressed in
false etymology and a claim about what its speakers uniquely understand.

**Prefer accuracy over exoticism. Prefer one revealing distinction over five
impressive words. Name the feeling. Don't explain the person.**

## What it was doing

The Welsh-word probe is the clearest case. Asked to name a feeling of
displacement, the tool wrote: *"Welsh has no exact English translation for
this word because the feeling is so specific to people who understand
displacement and the weight of memory."* Nothing about that sentence is
checkable — not the claim that Welsh lacks a translation, not the claim about
who "understands" the feeling, and the construction itself (X language has no
word because ITS SPEAKERS are somehow different) is the exact move the
rewrite exists to stop.

Elsewhere: *"Toska is often described as uniquely Russian"* (a culture
turned into a monolith); a dépaysement interpretation built entirely around
"two selves — the person who stayed and the person who traveled" (invented
biography from a single foreign word); *"that's saudade's exact signature"*
for a feeling saudade only partially covers, with the gap never named; *"the
mark of someone who travels with their full attention"* and *"everyone who
loves travel feels this"* (a matched word turned into a personality reading,
then a false universality claim) under a section literally called
`you_are_not_alone`; and a `from_other_languages` array that existed purely
to force additional foreign words after a satisfying match had already been
found — structurally guaranteeing the increasingly exotic, increasingly
stretched entries the visitor actually complained about.

## What changed

| Then | Now |
| --- | --- |
| `close_matches` + `from_other_languages` (two arrays, foreign-language variety required) | `other_words` (one array, 1-3 items, only when genuinely different shade of meaning — no quota) |
| No confidence signal — every match implicitly "exact" | `match`: STRONG MATCH / CLOSE MATCH / PARTIAL MATCH, with `where_it_doesnt` naming the gap |
| `the_poetic_name` (always offered, even when best_match was already perfect) | `made_up_name` with a `useful` boolean — empty when nothing coined adds value |
| `you_are_not_alone` (personality reading + false universality) | removed entirely |
| No plain-language fallback | `plain_english` — a natural phrase the visitor could use whether or not a word exists |
| `beauty_note` ("why this language bothered to name the feeling") | removed — the CULTURE section bans the construction outright |
| `withLocaleContext` on the system prompt | removed — this tool does no economic reasoning; it was vestigial |

**The two-question "Add context" panel replaced one free-text field**, per
the spec's own instruction not to make the visitor classify the emotion
before the tool does its job: "What was happening?" and "Anything important
about why this feeling is hard to name?" — both optional, neither
diagnostic-shaped. The two answers fold into one `context` string before
the API call; the backend schema never needed two separate fields.

**The pre-result Spiral Stopper line was a quasi-safety intervention on every
session.** *"Thoughts spiraling? Spiral Stopper can help you slow down
first"* presumed every visitor naming a feeling is in distress — untrue for
someone naming wistfulness, post-book sadness, or musical resonance. Removed
from the input area; Spiral Stopper stays in the post-result Related Tools
row, where it was always an appropriate, non-presumptive discovery link. The
pre-result slot instead carries a neutral "Related: NerveCheck" line —
present mainly because `audit_v2-3-2.py`'s S5.5 rule requires some pre-result
cross-ref to exist; see the exemption note below for the parallel case where
a gate's generic assumption didn't fit this tool and the fix was a documented
exemption rather than a wrong wording.

**The medical-adjacent disclaimer was replaced with a domain-specific one.**
"Results are AI-generated — for reflection, not medical advice" made a
language tool look medically adjacent for no reason connected to its actual
risk. The new line names the tool's real epistemic risk directly: "Words and
translations can be nuanced. Treat unfamiliar terms as leads worth checking,
especially when the exact meaning matters." `audit_v2-3-2.py`'s S5.4 check
only recognizes a fixed list of generic disclaimer shapes ("not medical
advice", "AI-generated", etc.) and doesn't recognize this one — a genuine,
reasoned mismatch between what the check expects and what the tool actually
needed, not a bug in the new copy. Fixed with a named, dated, explained
exemption (`_s54_exempt`) in `audit_v2-3-2.py`, matching the S1.5 exemption
list's own precedent: "a decision someone has to make and defend in review,
not a check that quietly passes." The exemption had to list BOTH the
frontend's tool name (`NameThatFeeling`) and the i18n file's own basename
(`name-that-feeling`) — diff-audit runs the same check against both files
independently, and `_tool_name` resolves differently for each.

## Deterministic backstops

Four, in `RULES` inside `validateResult`, unit-tested in both directions (10
bad forms fire, 8 legitimate phrasings survive): a ban on "untranslatable"
outright; a rule catching a language turned into a claim about its speakers
("uniquely Russian," "this culture understands," and — found only by testing
the EXACT sentence from the bug report — "Welsh has no exact translation
because the feeling is so specific to people who understand..."); a rule
catching a matched word turned into a personality reading ("the mark of
someone who," "your soul recognizes," "everyone who loves X feels this"); and
a rule catching a coined phrase presented as an established term.

**The culture-claim rule needed two fixes on the first test, not one.** The
regex had no `/i` flag at all, so "This culture understands loss
differently" (capital T, sentence-initial) never matched its own
lowercase-only pattern. And the exact bug-report sentence — "Welsh has no
exact translation... because the feeling is so specific to people who
understand..." — didn't match ANY of the drafted alternatives, because it
uses a different construction (no "uniquely," no "only," no "this culture
understands") than every example the rule was built from. Both fixes
verified against the literal reported sentence, not a simplified stand-in
for it.

## Things allowed, deliberately

- **A real word from another language, honestly caveated.** The rewrite
  doesn't ban foreign words — it bans inventing them, inventing their
  etymology, and inventing what their existence proves about a culture. A
  live probe correctly offered "saudade" for a vacation-ending feeling, rated
  it CLOSE MATCH (not STRONG), and named the specific gap: saudade is
  typically felt for something already gone, and the visitor was feeling it
  while still there.
- **An unestablished coined term, offered as one candidate among others.**
  One live probe offered "fore-nostalgia" inside `other_words` with its
  language field reading "English (contemporary usage, not established)" and
  its `misses` field saying so again — an honest way to surface a real,
  informally-used term without the schema's own `made_up_name` slot, which
  the model judged wasn't the right home for it that time. Not the
  anticipated shape, but not a violation of anything the prompt says either.
- **`made_up_name.useful: false` on a case that clearly could have used
  one.** The vacation-nostalgia probe left it empty because "wistfulness," a
  real English word, already did the job — restraint the OLD tool's
  always-offer-a-poetic-name design would never have shown.

## Things that will bite the next person

**S5.4 (disclaimer) and S1.5 (history preview field) both name-key on exact
shapes.** `preview` has to be the literal field name for a `usePersistentState`
history entry — `description` reads the same to a human and fails the audit.
S5.4 wants one of a fixed list of disclaimer PHRASE SHAPES, not just "some
disclaimer exists" — a domain-appropriate rewrite that doesn't happen to say
"not medical advice" needs an explicit exemption, not a wording compromise.

**S5.5's "pre-result cross-ref" requirement doesn't know about intentional
removal.** Deleting the Spiral Stopper intervention line (correctly, per the
spec) tripped the gate because the input area still needs SOME link to
another tool at its foot. The fix isn't reverting the removal — it's a
different, neutral link satisfying the same structural rule the presumptive
one used to.

**`withLocaleContext` was called on a tool with nothing to localize
economically.** Vestigial from whatever template this route started from.
Removed; worth grep-ing other small single-endpoint tools for the same
unused import.

## Endpoints

One route (`/name-that-feeling`) on `MODELS.FAST`, through `callClaudeWithRetry`,
v2 output standard (`router.outputStandard = 'v2'`) with `validateResult` as
the declared check.

## Storage

`namethatfeeling-result-v2` and `namethatfeeling-history-v2` — both bumped in
the same commit as the schema change, per the Magic Mouth rule. History
entries now also store the matched word (`bestMatchWord`), per the spec's
explicit instruction to keep that field; still no inferred pattern or
emotional history across sessions. See "My Feeling Dictionary" below for the
2026-09-04 addition — `namethatfeeling-history-v2` gained a `results` field
in place rather than bumping to v3, and a new `namethatfeeling-dictionary-v1`
key was added.

## My Feeling Dictionary — 2026-09-04 addition

A second spec, sent right after the focus-bug/evidence-boundary work on Name
Audit: replace the plain Recent log with a vocabulary feature the visitor
explicitly curates, without turning the tool into mood tracking. The spec's
own one-line test for the whole feature: *"If removing the visitor's identity
and replacing it with a list of words would break the feature, the feature is
probably interpreting too much."* Everything below was built to pass that
test by construction, not by prompting something not to fail it — the
Dictionary feature calls no LLM at all.

**Data model.** `namethatfeeling-dictionary-v1` (new key) holds Saved Words —
entries the visitor explicitly chose to keep, deduplicated by a
`word|language` key so the same word saved twice bumps a `seenCount` instead
of creating a second record (spec section 13: "do not interpret that count
psychologically" — it's a tally, not a metric). Each entry carries
`sourceResult`, the FULL API response at save time, which is what lets
"Open" reopen a saved word without ever calling the model again (spec
section 7). `namethatfeeling-history-v2` — the existing Recent key — was
extended in place with a `results` field on new entries rather than bumped
to a `-v3` key, specifically because spec section 19 requires old entries to
keep working and forbids fabricating a stored result for them: a version
bump would have silently orphaned every returning visitor's history, and old
entries lacking `results` fall back to an explicit, labeled "Analyze again"
action instead of a fabricated "Open."

**Per-card save, not a forced picker.** The spec sketches a "Which one feels
closest?" radio chooser as one illustrative way to let the visitor pick what
to save; built instead as an independent ♡/♥ toggle on every card that can
be saved — best_match, each `other_words` entry, plain_english,
made_up_name — since that's simpler, matches this codebase's existing
per-item save precedent (NameStorm, DateNight, ReadTheRoom all use an inline
star/heart toggle rather than a modal), and satisfies "do not force the
visitor to choose" (section 3) trivially: nothing is forced, they click
whichever card resonates, including more than one.

**"From your dictionary" is a Jaccard token-overlap heuristic, not an LLM
call.** Section 9 requires comparing a saved word's meaning against the new
description without inferring psychological similarity ("is this saved WORD
semantically relevant" — not "does this person seem to be experiencing the
same emotional pattern again?"). Prompting a model not to cross that line is
exactly the kind of instruction this whole rewrite exists to distrust.
Comparing sets of 4+ letter words for overlap, with a stopword list and a
conservative 0.12 threshold, can only ever answer "these two texts share
words" — it cannot produce "you often feel this," which makes the ban true
by construction. The tradeoff is real: it will miss a conceptually-related
match that shares no vocabulary, and the spec's own mockup implies a
generated comparison sentence ("the difference is: 'bittersweet' describes…")
that this doesn't attempt — the card instead shows only the previously-saved
word plus its own already-generated `shortMeaning`, no new sentence written
about the relationship between the two. Safer than the alternative, plainer
than the mockup; worth an LLM-backed version later only if the current
version's silence (or occasional miss) turns out to bother visitors more
than a wrong inference would have.

**Full Dictionary view is a backdrop modal, not a route.** No shared
modal/drawer component exists in this codebase (checked); built inline
following the `fixed inset-0 bg-black/50 … z-50` + `stopPropagation()`
pattern already used by ConflictCoach's confirm dialog, as a helper component
(`FeelingDictionaryModal`) above the main component per the install kit's own
convention, taking every piece of state through props so it carries none of
its own.

**Section 18's ordering** (result → save → dictionary preview → "name
another feeling" → related tools) is satisfied by rendering the same
`renderDictionaryPreview()` block in two mutually-exclusive JSX slots —
pre-result, where it replaces the old always-visible raw Recent log, and
post-result, positioned just above the "🔄 Name another feeling" button —
rather than one block whose position moves, which React doesn't really
support cleanly across a conditional this large.

**Verified live**, real API calls, no mocking: submit → save best_match →
preview updates to show the saved word live → "View all" opens the modal
showing both Saved Words and Recent sections correctly → close → "Name
another feeling" clears results and the pre-result view now shows the saved
word instead of the empty teaser → clicking the saved word reopens the full
original result with zero new network calls to `/api/name-that-feeling`
(confirmed via network log — one POST total across the whole sequence).
Spanish spot-check confirmed all 19 new keys render translated and
interpolate correctly (`ntf_previously_saved`'s `{{word}}`, provenance line's
"· establecida").

**No backend changes.** Nothing here needed a new field, a new endpoint, or
`withLanguage`/`withLocaleContext` — the entire feature reads and writes
`results`, which the existing route already returns in full. Gate-wise this
means no golden re-record, no guard-key surface, no three-way-sync entry.

## Word-quality + ambiguity-preservation correction pass — 2026-09-04

A live bug report against the friend's-good-news example (the same
description that seeded `ntf_ex2_*`): the tool's primary match was
"compunction" — an archaic sense of guilt/remorse that isn't what the word
ordinarily means today — plus a string of invented specifics layered on top:
the friend "deserved" the news stated as the tool's own conclusion rather
than the visitor's, "not about wanting what they have" and "a flash of your
own lack" (both resolving an ambiguity the visitor explicitly said they
couldn't name), and "your authentic joy took over" (declaring which feeling
"won" when the visitor never said one did). Two new prompt sections, plus
follow-on fixes the live probes surfaced that the prompt alone didn't reach.

**PRIMARY MATCH RULE.** Added to LEXICAL ACCURACY: a word can't become the
primary match merely because ONE secondary or archaic sense overlaps part of
the description — it has to fit the CENTRAL, ordinary meaning, with four
self-check questions (ordinary meaning / does it fit / does it smuggle in an
unstated element / genuine fit vs. merely interesting) before selection. Also
added a fourth match value, NO ADEQUATE MATCH, so the tool can say "no exact
word" instead of stretching one — the rule's own stated preference.

**DON'T RESOLVE THE AMBIGUITY FOR THEM.** Added right after CORE RULE: when
the visitor says they don't know what part of a feeling means, that
uncertainty must survive into the answer. A short banned-conclusions list
(envy, comparison, personal lack, resentment, guilt, insecurity,
disappointment, fear, grief) with GOOD/BAD examples taken directly from the
bug report. A follow-up paragraph, added after a live probe still chose
"envy" as the primary word despite the visitor's own line ("isn't just
'jealous', which isn't quite right either"): if the visitor names a specific
word themselves and says it's wrong, that same word (or a close synonym
carrying the same baggage) can't become the primary match without
acknowledging why it still applies — their own doubt is information, not an
obstacle to route around.

**Two new deterministic backstops**, both matched to the bug report's exact
sentences and unit-tested in both directions: a named ambiguity flattened
into a flat fact ("It wasn't envy" / "It was jealousy, not admiration" —
hedge-spared so "it may not have been envy" survives); an unstated certainty
attributed to the visitor or someone in their story ("you knew they
deserved it"). Testing the ambiguity rule against real captured output found
a genuine HEDGED gap: "You don't know **whether** it was disappointment..."
— a textbook GOOD hedge — matched the ban regex because `whether` wasn't in
the spare list. It happened to cause no harm only because a separate safety
guard in `validateResult` declines to blank long, multi-sentence fields; a
shorter sentence using the same construction would have been wrongly
blanked. Fixed by adding `whether`, `doesn't establish`, `doesn't say`,
`doesn't settle`, and `not sure/clear if/whether` to `HEDGED`.

**`pinMatch`** — the four-value match enum was never pinned to an exact
English literal, the same i18n-enum-vs-English-literals gap this session has
hit before elsewhere (`withLanguage` translates JSON string VALUES; the
frontend switches on the raw string for both the badge and the new dynamic
hero heading). Live-tested es/de/ja and the model happened to leave it in
English every time before this existed — "happened to" isn't a guarantee,
and a fourth value was exactly the moment to stop relying on luck.

**`cleanNoMatchWord` — the backstop that needed two widenings on its own.**
Even with the prompt explicit that a non-candidate word should be left
empty, three separate probes filled it with a meta-statement about the
absence itself instead — "No established single word," "the discomfort of a
no-win moment" — which would render in the giant hero-word slot as if IT
were the answer. First fix: clear word/language/pronunciation/definition
when the text is a negation opener or longer than a short phrase (5+ words),
scoped to `match === 'NO ADEQUATE MATCH'`. Then a golden capture surfaced the
identical shape at CLOSE MATCH tier — "homesickness for a place that exists
only in memory" (9 words, empty language) rated CLOSE MATCH — proving the
restatement pattern isn't confined to the NO ADEQUATE MATCH path. Widened to
check every match tier: whatever tier the model chose, a restatement isn't a
candidate at any tier, so it's downgraded to NO ADEQUATE MATCH and cleared
along with it. Verified against every real word seen across probes
("end-of-vacation blues," "a pang," "schadenfreude," "caught between," "the
cringe reflex," "social friction" all survive; every meta-statement and
9-word restatement gets cleared).

**Frontend: the hero heading now carries epistemic weight the badge alone
didn't.** "THE WORD YOU'RE LOOKING FOR" was definitive even for a hedged
STRONG MATCH; replaced with a heading that scales with the match value —
"THE WORD YOU MAY BE LOOKING FOR" down to "THERE MAY NOT BE ONE WORD FOR
THIS" — dropping the now-unused `ntf_the_word` key for four new ones. The
match-level pill badge is suppressed for NO ADEQUATE MATCH specifically (the
heading already says so; a second, harsher badge on top would pile on). Two
defensive fixes followed directly from live-testing the empty-word case: the
language/pronunciation row only renders when `language` is actually present
(word can be non-empty with language blank — a dangling flag emoji with
nothing after it otherwise renders on its own); saving a best_match word
with no `language` is labeled `type: 'invented'` in the Dictionary rather
than `'established'`, since a word with no citable language isn't a real
dictionary term regardless of what match tier it carried.

**What this reveals about model variance, honestly.** The friend's-good-news
case was re-run 5+ times across this pass. Most runs cleanly avoided "envy"
entirely once the visitor-rejected-word rule was added; one run still
produced `"a pang of envy"` as the word while the rest of that same response
(share_line, why_it_fits) described it as plain "a pang" — an internal
inconsistency, not a full regression. No backstop was added for this
specific shape: it would need the original description text to know which
word the visitor rejected, which `validateResult` doesn't currently receive,
and the failure is infrequent and partial rather than a clean, mechanically
detectable pattern. Recorded here rather than silently accepted — this is a
real, measured improvement (dramatically better than the "compunction" +
invented-specifics baseline), not a claim of eliminating the failure mode.

## Final grounding pass — same day, second round

A follow-up bug report on top of the pass above: even with the primary word
fixed, the explanatory prose still embellished — "the place felt like it
could have been home," "already grieving its loss," "happiness and
gratitude that are equally present," "you are wishing time would slow
down." None traces to anything supplied.

**FINAL GROUNDING PASS** — added to PERSONALITY, right before OUTPUT (a
last-mile check before the model returns anything): distinguishes what the
visitor described / what the word means / the model's own interpretation,
bans introducing motives, wishes, regrets, gratitude, grief, intensity,
imagined alternatives, significance, or reasons unless the visitor supplied
them, with the four bug-report sentences as BAD examples and their corrected
forms as GOOD ones. Prompt-only — this list is far too varied to reduce to a
safe word-list check (unlike the two families below, which had enough
confirmed live recurrence to justify one).

**`checkInventedEmotionWords`** — the only check in this route that
cross-references the visitor's own supplied text rather than judging a field
in isolation. Two live-confirmed word families only: "grief"/"grieving"/
"mourning" and "gratitude"/"grateful." Took three iterations to get right:

1. First version flagged the word anywhere in an explanatory field. A live
   probe produced "Saudade carries primarily grief and melancholy" inside
   `other_words[].misses` — an accurate lexical fact about the WORD's own
   connotation, exactly the prompt's own "describe the WORD rather than the
   VISITOR" escape valve. Field-wide blanking would have destroyed genuinely
   good content to catch a bad pattern.
2. Narrowed to require the emotion word within 40 characters of a
   "you"/"your" reference, in either direction — close enough to catch "the
   happiness and **gratitude** that **you** also described" without catching
   the saudade sentence (67 characters away). Verified: the nearest true
   positive found sits at 59 characters — 8 characters below the false
   positive's 67. There is no window size that reliably separates the two;
   this is the check's real precision ceiling, not an oversight.
3. The proximity fix alone still didn't work: real captures kept surviving
   despite firing the regex correctly, and server logs showed why —
   `why_it_fits` and `where_it_doesnt` kept hitting the SAME length/sentence
   safety cap the generic `RULES` walk uses ("too long to cut safely"),
   because those are exactly the longer, multi-sentence fields the leak
   shows up in. Removed the cap for this check specifically: the proximity
   requirement already means a match usually IS the sentence's central
   claim, not an incidental word worth preserving the rest of the field
   over — a reasoning that does NOT apply to the generic RULES walk, where a
   stray banned word really can sit inside an otherwise-fine paragraph.
   Also extended coverage to `share_line` and `plain_english`, which weren't
   in the original field set despite carrying the exact same risk — a live
   probe put the violation directly in `share_line`.

Six fresh live attempts after all three fixes: 4 clean, 2 known misses (both
the "same field, different sentence, no nearby you" shape from point 2 —
"...before you have even left... It names... already **mourning**..." with
57+ characters between the pronoun and the word). Accepted, not chased
further — documented here rather than quietly left as an unexplained gap.

## UI polish: Recent rows

Feedback: Recent entries in the Dictionary modal read as "bare bordered text
rows... resembling disabled form inputs" — a bordered card with plain-weight
text, date, and two full buttons stacked below, next to Saved Words' bolder
word + provenance + short-meaning treatment right above it. Converted each
entry to a single compact clickable row — bold primary text (the matched
word when one exists, else the description preview) with the description as
a lighter secondary line, date at right, and a trailing glyph that also
carries real information: `›` when the stored result reopens instantly,
`🔄` when the entry predates full-result storage and needs a fresh submit
(same distinction the old "Open"/"Analyze again" button pair carried,
folded into one row instead of two). Remove stayed, demoted to a small `✕`
icon button beside the row rather than a third labeled button inside it —
polish, not a scope change to what the row can do.

## Goldens

Six cases, re-recorded 2026-09-04 for the word-quality/ambiguity pass above
(two new cases; the original four re-verified against the same backend).
`npm run check:golden name-that-feeling` checks structure only — content
quality for the two new cases specifically needs eyeballing per their
`guards` text, since this pass is entirely about prose judgment a structural
diff can't see.

| Case | What it catches |
| --- | --- |
| `vacation-nostalgia-close-match` | The reference case — CLOSE not STRONG, `where_it_doesnt` names the real gap, no culture/personality claims |
| `rootless-displacement-made-up-name` | The exact feeling-shape (displacement, moved countries) that invited the worst violations in the old tool |
| `schadenfreude-strong-match-sparse` | No context supplied — nothing invented; share_line framing must agree with the match enum |
| `social-fatigue-prefer-english` | Whether an ordinary English phrase wins when it's the honest answer, rather than a foreign word reached for on novelty alone |
| `friend-good-news-dont-resolve-ambiguity` | The exact live bug report — PRIMARY MATCH RULE and DON'T RESOLVE THE AMBIGUITY together; check `best_match.word` isn't a strained archaic sense and no named emotion is flattened into a flat fact |
| `meeting-mispronunciation-no-adequate-match` | The NO ADEQUATE MATCH pathway end to end, including `cleanNoMatchWord` — a passing structural check here doesn't prove the guard fired; eyeball that `best_match.word` isn't a restatement of the gap |
