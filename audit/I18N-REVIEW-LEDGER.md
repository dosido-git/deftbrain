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

**Batch 4 (12)** — commit `cc0ea83c`, 126 keys — AnalogyEngine · BeforeTheCrash · CultureBriefing ·
ConflictCoach · FutureProof · DriveHome · AlternatePath · CrisisPrioritizer ·
CaptionMagic · FocusPocus (FocusSoundArchitect and GriefGuide were already
covered — see the note below)

**Reviewed as part of their own rewrite** — BeforeHello (`f1252d6d`)


## In progress

_Nothing in flight._

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

Found during batch 4, deliberately left for their own change:

- **226 dead `cpr_*` keys** in `crash-predictor.js`. The BeforeTheCrash v2
  rewrite moved the UI to `cpv2_*`; only 17 `cpr_*` keys are still reached
  (the chip labels behind `CHIP_LABELS` plus two xrefs). 226 × 13 languages is
  roughly 2,900 dead strings, and they are what produces that tool's 34 smoke
  warnings. Deleting them is a separate, reviewable change.
- **`FeedbackTap` is hardcoded English.** "Was this helpful? / Yes / No"
  (`src/components/FeedbackTap.js:68`) renders in English under every tool in
  every language. Same shape as the ActionBar Copy/Print/Share gap: shared
  chrome, so no per-tool review can see it. Needs base-chrome keys.
- **15 European-Portuguese keys survive outside batch 4** — decision-coach (7),
  contract-decoder (3), gentle-push-generator (2), contrast-report (1),
  truth-bomb (1). The catalog-wide pt sweep (`01ead7df`) predates the rewrites,
  so anything a rewrite added after it was never swept. Batch 4's own pt blocks
  were EP throughout and are now Brazilian.
- **Arabic imperatives are still masculine-default in prose and errors.** The
  reviewed batches applied the verbal-noun recast to buttons and labels but not
  to sentences ("أضف مهمة واحدة على الأقل"), which is defensible — MSA prose has
  to pick a gender — but it is an unstated line. Worth settling explicitly.
- **Japanese あなた in UI labels** (`cp2_fact_answer_ph`, `cp2_schedule_title`)
  is the same unnatural-address class the Korean 당신 ban covers, but the
  convention table says nothing about it. Settle, then sweep.
- **French apostrophes are mixed** in crash-predictor (4 curly) and focus-pocus
  (7 curly). The catalog is 3,751 straight to 58 curly, so straight is the house
  style; the fr blocks in those two files are single-quoted, so the swap needs
  escaping rather than a blind replace.


- "Voice" rendered as an audible voice in de/ru/hi/zh/ja/ko.
- Hand-rolled `_one`/`_many` key pairs elsewhere in the catalog
  (`dvt_overdue_*`, others) are now inconsistent with `tPlural` — deliberate
  sweep, not a drive-by.
- 74 expansion findings from `npm run audit:i18n` (clipping risk, not error).
- BikeMedic km-vs-miles: a product decision, not a translation one.
- `dm_ai_side` (ar) still reads `جانب AI: {{side}}`.
- `sdm_example2_thingB` (pt) reads as European Portuguese.
- `sdm_surprise_me` (ru) is still `ты`.
