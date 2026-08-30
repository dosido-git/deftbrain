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
| Japanese | です/ます throughout; **あなた is banned** — drop the pronoun, the topic is understood |
| Korean | 해요체, and **당신 is banned** |
| Chinese | 你, never 您 |
| Russian | вы |
| Arabic | MSA. Buttons and labels take the verbal noun (إضافة, not أضف); **sentences keep the masculine imperative** — MSA has no genderless one, and the recast turns an instruction into a fragment |
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

**Batch 5 (12)** — commit `26df15a7`, 56 keys — AwkwardSilenceFiller · BeliefStressTest ·
ChaosPilot · ContextCollapse · DecoderRing · GhostWriter · HistoryToday ·
MarkupDetective · MentalHealthNavigator · MiseEnPlace · NotSoFast ·
ProcedureProbe. HistoryToday came through clean — no corrections at all, the
first tool in the campaign to do so.

**Batch 6 (15)** — commit `eb5089ca`, 109 keys — RoastMe · MissingLink · TheWholeStory ·
ToolFinder · WhichLife · WrongAnswersOnly · BikeMedic · Bookmark ·
BrainDumpBuddy · BrainStateDeejay · ColdOpenCraft · ComebackCooker ·
CrowdWisdom · FanTheory · Giftology

**Reviewed as part of their own rewrite** — BeforeHello (`f1252d6d`)


## In progress

_Nothing in flight._

## Remaining

_None. The campaign is complete — all 69 rewritten tools reviewed in 12
languages across six batches, 2026-08-29 to 2026-08-30._

Five tools have a locale file whose name no longer matches the tool — renamed
display names, prefixes deliberately left alone. Kept here because the mismatch
outlives the campaign; look them up rather than guessing, which has cost a batch
before:

| Tool | Locale file | Prefix | Keys/lang |
| --- | --- | --- | --- |
| NotSoFast | `rulebook-breaker.js` | `rb_` | 75 |
| MissingLink | `the-gap.js` | `tg_` | 101 |
| TheWholeStory | `the-alibi.js` | `ta_` | 68 |
| WhichLife | `contrast-report.js` | `cr_` | 52 |
| BrainStateDeejay | `brainstate-deejay.js` | `bsd_` | 146 |
| SocialBatteryAdvisor | `social-energy-audit.js` | `sea_` | — |
| SubscriptionTamer | `sub-sweep.js` | `ss_` | — |
| TheCrux | `recall.js` | `rec_` | — |

FocusSoundArchitect and GriefGuide were reviewed in batch 4 but are **not** on
the list — extra coverage, no harm. GriefGuide was rewritten the same day.

## The conventions are now a gate

`scripts/i18n-convention-audit.js` is the table above, executable, and Gate 10
of the pre-push hook. It exists because reading for these by hand does not
scale and demonstrably missed things — 您 survived in LeaseTrapDetector and
LayoverMaximizer through a batch marked reviewed, and the first full run found
**700 violations in 80 of 125 tools**.

Baseline in `src/data/i18n-conventions.json`: only a NEW violation fails, so
the existing debt blocks nobody. A deliberate one — sample dialogue is a
character addressing someone, not us addressing the reader — is accepted with
`--write-state`. The baseline must travel with the content it describes.

Of the 700, **342 sit in tools queued for rewrite** and should not be swept:
the rewrite replaces that copy, and the gate checks the new translations as
they land. The **273 outside the queue** are the real sweep, and they collide
with nothing in flight.

## Carried forward, not yet fixed

Found during batch 6:

- ~~`/PlotHole` 301-redirects to `/PlotTwist`~~ — **fixed 2026-08-30.** They are
  two separate tools, confirmed by the user: a narrative-logic analyst and a
  decision tool, each with its own catalog entry, component, backend route and
  13-language locale block. Only two places implemented the "rename" — the
  `LEGACY_REDIRECTS` line and the RENAMES row — and both are gone. Verified
  against the real server: `/PlotHole` now 200s, `/plothole` still canonicalises
  to it, and a genuine rename still redirects.
- **The RENAMED audit check is case-sensitive.** It does spell out the spaced
  form of each old name, but matches it literally, so `cr_copy_header` sat at
  "THE CONTRAST REPORT" — the name retired 2026-07-10 — in all thirteen
  languages, in the string the user copies to their clipboard, and the check
  never saw it. The smoke test caught it instead, by accident. Batch 6 fixed
  the string; the check still needs the `i` flag.
- **`wao_plothole` is a false positive** in the 38 remaining retired-name
  findings, for the reason above: PlotHole is a real tool.

Found during batch 5:

- **38 findings of a retired tool name in a user-facing value**, in four keys:
  `dm_argument_simulator`, `plh_title` (+ `plh_copy_defense_header`),
  `wao_plothole`, and `sdm_whatif_header` / `ss_whatif_title`. The audit's
  RENAMED check has been reporting these; nobody has acted on them. Batch 5
  cleared the fifth, `bst_egokiller` — a cross-reference from BeliefStressTest
  to Ego Killer, which was folded *into* BeliefStressTest in July 2026, so the
  tool was pointing at itself under a dead name in thirteen languages. The
  matching tip in `src/data/tools.js` went with it.

Found during batch 4, deliberately left for their own change:

- ~~226 dead `cpr_*` keys~~ — **fixed `ab3f1e30`.** crash-predictor.js went
  4,077 → 1,139 lines; that tool's smoke warnings went 34 → 5.
- ~~`FeedbackTap` is hardcoded English~~ — **fixed `e9ab9825`.** Eight `fb_*`
  keys in base.js, all thirteen languages. (The ActionBar Copy/Print/Share labels, long listed
  here beside it, turned out to be fine — `ActionButtons.js` already uses
  `t('copy')`/`t('print')`/`t('share')` and no tool passes a literal label.)
- **15 European-Portuguese keys survive outside batch 4** — decision-coach (7),
  contract-decoder (3), gentle-push-generator (2), contrast-report (1),
  truth-bomb (1). The catalog-wide pt sweep (`01ead7df`) predates the rewrites,
  so anything a rewrite added after it was never swept. Batch 4's own pt blocks
  were EP throughout and are now Brazilian.
- ~~Arabic imperatives in prose~~ — **settled 2026-08-30: not a defect.** The
  line the reviewed batches were already drawing by instinct is now written into
  the table above. 870 imperatives across 113 tools stay as they are.
- ~~Japanese あなた~~ — **settled and swept 2026-08-30.** 556 occurrences in
  107 of 125 tools, now 4: the quarrel dialogue in ConflictCoach and
  DecoderRing and the lecture transcript in Recap, where あなた is a character
  speaking rather than us addressing the reader.
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
