# Localization review — campaign ledger

The catalog-wide translation-accuracy review of the **rewritten tools**, one
batch at a time. Gate 5 proves a key *exists* in 13 languages; nothing proved
it was *right*. This is that pass, and this file is its memory.

It exists because the campaign's progress lived only in a conversation, and a
conversation gets summarized. On 2026-08-29 the list of which tools had been
reviewed had to be reconstructed from the session transcript. Once.

## How a tool gets reviewed

1. A reviewer reads the tool's locale file and its component against the
   English source, in all 12 target languages, judging: mistranslation,
   inversion / ladder integrity, register, forced gender, unnatural phrasing,
   untranslated strings, terminology consistency, UI fit.
2. A second pass writes the corrections as a per-language JSON patch — reading
   the English value first, never translating the translation.
3. Patches are applied, locales rebuilt, gates run, committed.

Reviewers are told the settled conventions rather than left to guess:

| | |
| --- | --- |
| German | `du`, with the **-e** imperative (Diskutiere, nicht Diskutier) |
| French | `vous` |
| Portuguese | **Brazilian**, `você` — never European enclisis |
| Spanish | `tú` |
| Japanese | です/ます throughout |
| Korean | 해요체, and **당신 is banned** |
| Chinese | 你, never 您 |
| Russian | вы |
| Arabic | MSA; forced gender fixed by recasting to the verbal noun |
| Hindi | आप-level with **-एँ** (not -इए, not तुम/-ओ) |
| Thai | polite, without ครับ/ค่ะ |
| Vietnamese | bạn |

Forced gender is **recast**, never hedged: no `(a)`, no `@`, no `o/a`.

## Reviewed

**Batch 1–2 (19)** — Mend · FinalWish · BillRescue · GentlePushGenerator ·
LayoverMaximizer · FriendshipFadeAlerter · BuyWise · ComplaintEscalationWriter ·
PlainTalk · DifficultTalkCoach · LeaseTrapDetector · ContractDecoder ·
NameStorm · BragSheetBuilder · GratitudeDebtClearer · DoctorVisitPrep ·
TheDebrief · DecisionCoach · FakeReviewDetective

**Batch 3 (12)** — commit `6afb1da1`, 967 keys — ArgueSmarter · SixDegreesOfMe ·
TipOfTongue · WaitingModeLiberator · DoctorVisitTranslator · BatchFlow ·
DreamPatternSpotter · DateNight · EmailUrgencyTriager · VirtualBodyDouble ·
RentersDepositSaver · BrainRoulette

**Reviewed as part of their own rewrite** — BeforeHello (`f1252d6d`)

## In progress

**Batch 4 (12)** — FocusSoundArchitect · AnalogyEngine · BeforeTheCrash ·
CultureBriefing · GriefGuide · ConflictCoach · FutureProof · DriveHome ·
AlternatePath · CrisisPrioritizer · CaptionMagic · FocusPocus

## Scope, and what is uncertain about it

The user scoped the campaign to the **68 tools rewritten since 2026-08-12**
(the first was DateNight), with the rest folded into future rewrites. That list
was given in conversation and is **not reproducible from the repository** —
locale files all predate the rewrites (June), and a diff-size heuristic over
`src/tools/*.js` since Aug 11 finds 27 tools, not 68, because later formatting
commits obscure the original rewrite.

Batch 4 was therefore assembled from tools that are *demonstrably* rewritten:
a commit whose subject says rewrite/redesign/replace, or a single commit
changing ≥150 lines of the tool file. **Confirm the remaining set against the
original list of 68 before declaring the campaign complete.**

BrainStateDeejay was excluded — it has no locale file, so it is not localized
at all and belongs to the rollout, not this review.

## Carried forward, not yet fixed

- "Voice" rendered as an audible voice in de/ru/hi/zh/ja/ko.
- Hand-rolled `_one`/`_many` key pairs elsewhere in the catalog
  (`dvt_overdue_*`, others) are now inconsistent with `tPlural` — deliberate
  sweep, not a drive-by.
- 74 expansion findings from `npm run audit:i18n` (clipping risk, not error).
- BikeMedic km-vs-miles: a product decision, not a translation one.
- `dm_ai_side` (ar) still reads `جانب AI: {{side}}`.
- `sdm_example2_thingB` (pt) reads as European Portuguese.
- `sdm_surprise_me` (ru) is still `ты`.
