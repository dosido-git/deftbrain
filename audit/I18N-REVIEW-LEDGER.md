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

## Remaining (27)

Reconciled 2026-08-29 against the authoritative list the user supplied — 69
unique tools (the list read 70; "Which Life?" and "WhichLife?" are one tool).
The repository cannot reproduce this list on its own: locale files all predate
the rewrites, and a diff-size heuristic over `src/tools/*.js` finds 27 of them,
not 69. **The list below is the scope. Do not re-derive it.**

AwkwardSilenceFiller · BeliefStressTest · ChaosPilot · ContextCollapse ·
DecoderRing · GhostWriter · HistoryToday · MarkupDetective ·
MentalHealthNavigator · MiseEnPlace · NotSoFast · ProcedureProbe · RoastMe ·
MissingLink · TheWholeStory · ToolFinder · WhichLife · WrongAnswersOnly ·
BikeMedic · Bookmark · BrainDumpBuddy · BrainStateDeejay · ColdOpenCraft ·
ComebackCooker · CrowdWisdom · FanTheory · Giftology

**Five of these have a locale file whose name no longer matches the tool** —
renamed display names, prefixes deliberately left alone. Look them up here
rather than guessing, which has cost a batch before:

| Tool | Locale file | Prefix | Keys/lang |
| --- | --- | --- | --- |
| NotSoFast | `rulebook-breaker.js` | `rb_` | 75 |
| MissingLink | `the-gap.js` | `tg_` | 101 |
| TheWholeStory | `the-alibi.js` | `ta_` | 68 |
| WhichLife | `contrast-report.js` | `cr_` | 52 |
| BrainStateDeejay | `brainstate-deejay.js` | `bsd_` | 146 |

FocusSoundArchitect and GriefGuide were reviewed in batch 4 but are **not** on
the list — extra coverage, no harm. GriefGuide was rewritten the same day.

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
