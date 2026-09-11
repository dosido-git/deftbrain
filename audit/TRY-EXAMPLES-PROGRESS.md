# Try-Example coverage — five per tool, five per mode

Owner request (2026-09-11): every tool, and every input mode a tool has, gets **five** "Try an
example" entries designed to exercise the full range of the tool's possible outputs — not five
variations of the happy path. English first; tools whose examples already live in the i18n catalog
get all 13 languages at once (Gate 5 requires it).

## Conventions

- **Keep each tool's existing mechanism.** 76 tools carry an inline `EXAMPLES` array read through
  `pickExample('<Tool>', EXAMPLES)` (`src/utils/exampleRotation.js` — a per-tool localStorage counter,
  so five examples rotate deterministically across clicks and visits). Tools already on `_exN_`
  i18n keys stay on keys. No cross-catalog refactor.
- **Modes rotate independently.** A tool with input modes keeps one example list per mode and picks
  with `pickExample('<Tool>:<mode>', EXAMPLES[mode])`, so switching mode does not skip an example.
- **Range, not repetition.** The five should differ on the dimensions that change the OUTPUT: the
  enum inputs (tone, depth, level, format, type), the length/richness of free text, the domain
  (health / money / work / family / tech / civic), edge conditions (missing optional fields, an
  input that should produce a "can't tell" or "mixed" result), and at least one that is not the
  obvious first guess.
- **An example is a promise.** It must be something the tool genuinely handles well end-to-end;
  never an input that reliably 500s, truncates, or produces a thin result. Spot-check one live when
  in doubt.
- Inline examples are English in every language (pre-existing behaviour for those 76 tools);
  translating them is a separate follow-up, tracked at the bottom.

## Status

| # | Tool | Mechanism | Modes | Before | After | Done |
|---|------|-----------|-------|--------|-------|------|
| 1 | AlternatePath | inline | — | 2 | 5 | ✅ 2026-09-11 |
| 2 | AnalogyEngine | inline | — | 2 | 5 | ✅ 2026-09-11 |
| 3 | ArgueSmarter | inline | setup / quick / prep (fallacy is a quiz — no input to seed) | 2 (setup only) | 5 + 5 + 5 | ✅ 2026-09-11 |
| 4 | AwkwardSilenceFiller | inline | 8 scenarios | 2 | 5 (5 scenarios, 5 comfort levels; 2 new i18n keys ×13) | ✅ 2026-09-11 |
| 5 | BatchFlow | i18n | — | 2 sets | 5 sets (4 energy curves, 5 day types, time 2h→unknown; 17 keys ×13) | ✅ 2026-09-11 |
| 6 | BeforeHello | i18n | 7 target types | 2 | 5 (investor/mentor/employer/client/connector; 9 keys ×13) | ✅ 2026-09-11 |
| 7 | BeforeTheCrash | inline | check-in (patterns reads the saved log — no seed) | 2 | 5 (sliding / good / marked crash / wired + wearable numbers / flat-withdrawn) | ✅ 2026-09-11 |
| 8 | BeliefStressTest | i18n | — | 8 bare beliefs | 5 rotated pairs, 3 with the optional context (3 keys ×13); 8 chips kept | ✅ 2026-09-11 |
| 9 | BikeMedic | i18n | 10 problems (loadExample seeds the interpreter or a tree) | 2 | 5 (shifting / noise / repeat flat / hydraulic brakes / 'custom' vague fault; 3 keys ×13; custom no longer routed to a tree that does not exist) | ✅ 2026-09-11 |
| 10 | BillRescue | i18n | rescue / letters (quick, triage, rehearse, tracker take no free input) | 2 (rescue) | 5 + 5 (rescue: 5 bill types × 5 statuses; letters: 5 letter types, 2 with context; 10 keys ×13; fixed dead 'dispute' reason value) | ✅ 2026-09-11 |
| 11 | Bookmark | i18n | show / book / game / sports | 1 per type, no rotation | 5 per type via pickExample('Bookmark:<type>') — precise vs vague stopping points, one per type with nothing remembered (44 keys ×13) | ✅ 2026-09-11 |
| 12 | BragSheetBuilder | inline | transform (other tabs consume results) | 2 | 5 (senior tech / mid nonprofit / entry retail / executive finance / student, 3 lines) — role, years, purposes, tone now travel with each | ✅ 2026-09-11 |
| 13 | BrainDumpBuddy | inline | freetext / rapid / voice (one rotation; each example carries its mode) | 2 | 5 (two long typed dumps, a rapid list, a short feelings-only dump, a voice transcript) | ✅ 2026-09-11 |
| 14 | BrainRoulette | inline + i18n topics | spin (debate/journey/digest consume a spin) | 4 | 5 (+ a folk belief at quick/casual; 1 key ×13) — depths quick/medium/deep, audiences casual/curious/nerd | ✅ 2026-09-11 |
| 15 | BrainStateDeejay | inline | — | 2 | 5 (overwhelmed→grounded, low_energy→energized, anxious→sleepy with no task/genres and a written taste; sensitivities and taste now travel) | ✅ 2026-09-11 |
| 16 | BreakMyPlan | i18n | 8 plan types | 2 | 5 (creative / project / career / financial / relationship; 9 keys ×13) | ✅ 2026-09-11 |
| 17 | BuyWise | inline | form / budget / calendar / quote / haul / convince (photo needs an image — shares the form's product) | 2 (form) | 5 × 6 views via pickExample('BuyWise:<view>'); impulse, gift and priority now travel with form examples | ✅ 2026-09-11 |
| 18 | CaptionMagic | i18n | 7 platforms × 3 lengths | 2 | 5 (+ twitter/short, linkedin/long, facebook/medium; 6 keys ×13) | ✅ 2026-09-11 |
| 19 | ChaosPilot | inline | — | 3 | 5 (+ parental leave with no work in it; night shifts with no daytime and an empty "stuck") | ✅ 2026-09-11 |
| 20 | ColdOpenCraft | i18n | 5 channels | 2 (both email) | 5 (email ×2, linkedin, instagram_dm, text; 12 keys ×13) | ✅ 2026-09-11 |
| 21 | ComebackCooker | inline | 4 moods | 2 (witty, dignified) | 5 (all four moods; a jab from a friend, a kindness from a stranger, a cruelty from a child) | ✅ 2026-09-11 |
| 22 | ComplaintEscalationWriter | inline | 12 industries | 2 | 5 (airline, contractor, telecom rate dispute, healthcare billing-code error, subscription still-charging) | ✅ 2026-09-11 |
| 23 | ConceptCoach (IdeaAutopsy) | i18n | 4 stages × 8 focus areas | 2 (shared desc/evidence/founder text — stage was the only thing that changed) | 5 — each with its own desc/evidence/founder keys (idea/exploring/building/launched, zero-validation to real-traction-with-churn; 9 keys ×13) | ✅ 2026-09-11 |
| 24 | ConflictCoach | i18n | 7 relationships | 2 (Roommate, Partner) | 5 (+ Coworker cc'ing a manager, Family at Christmas, Customer complaint; 3 keys ×13; fixed 8 banned-pronoun findings in ja/hi/ru/fr) | ✅ 2026-09-11 |
| 25 | ContextCollapse | i18n | 8 platforms | 2 (email, announcement) | 5 (+ group_chat resignation, social_media ex-photo, slack migration-delay; 18 keys ×13) | ✅ 2026-09-11 |
| 26 | ContractDecoder | i18n | contractType/focusAreas are unused decorative fields | 2 (freelance, saas) | 5 (+ lease, employment offer with non-compete, mutual NDA; 6 keys ×13, full contract text each) | ✅ 2026-09-11 |
| 27 | CrisisPrioritizer | inline | — | 2 | 5 (+ full high-energy day with five deadlines, near-empty low-energy list with nothing urgent) | ✅ 2026-09-11 |
| 28 | CrowdWisdom | i18n | — | already 5 (cw_ex1–5) | — | ✅ pre-existing |
| 29 | CultureBriefing | inline | 6 trip purposes | 2 (business, family) | 5 (+ tourism, a full relocation with family, a student exchange with a host family) | ✅ 2026-09-11 |
| 30 | DateNight | inline | 6 date types (shared location/last-time/restrictions across the rotation) | 2 (anniversary, stay_in) | 5 (+ big-budget adventurous 1yr in, cheap-and-short first date, long casual afternoon; $25–$350, 0–11 years) | ✅ 2026-09-11 |
| 31 | DecisionCoach | i18n | 5 categories | 4 | 5 (+ 'other' category, quiet/no_screens; 2 keys ×13) | ✅ 2026-09-11 |
| 32 | DecisionPrism (PlotTwist) | i18n | 8 stuck-reasons | 2 (fear_of_regret, people_pleasing) | 5 (+ analysis_paralysis on a second child, fear_of_unknown on a career leap, sunk_cost on an old friendship; 9 keys ×13) | ✅ 2026-09-11 |
| 33 | DecoderRing | i18n | 7 sources × 10 relationships | 2 (text/partner, email/coworker) | 5 (+ slack/boss, dating/crush, letter/landlord; 6 keys ×13; fixed zh 您 and fr tu findings) | ✅ 2026-09-11 |
| 34 | DifficultTalkCoach | inline | 6 goals × 8 relationships | 2 | 5 (+ landlord repairs, coworker feedback, adult-child boundary) | ✅ 2026-09-11 |
| 35 | DoctorVisitPrep | i18n | 8 appointment types | 2 (follow-up/specialist, new-problem) | 5 (+ annual-physical with no complaint, second-opinion pushing back on surgery, first mental-health visit; 24 keys ×13) | ✅ 2026-09-11 |
| 36 | DoctorVisitTranslator | inline | 5 document types | 2 (visit, insurance-eob) | 5 (+ prescription label, abnormal lab panel, discharge summary) | ✅ 2026-09-11 |
| 37 | DocumentDetective | i18n | 6 document types | 2 (legal, benefits) | 5 (+ lease break clause, disability-benefit decision, surgical consent; 9 keys ×13) | ✅ 2026-09-11 |
| 38 | DreamPatternSpotter | i18n | single / pattern (pattern needs 2+ saved dreams — not seedable) | 2 | 5 (+ exam-anxiety, body-won't-move chase, grief dream; 3 keys ×13) | ✅ 2026-09-11 |
| 39 | DriveHome | inline | 5 driver states | 3 | 5 (+ very_tired after a double shift, not_great/shaken after an argument — exercises the very_tired guard-key fix) | ✅ 2026-09-11 |
| 40 | EmailUrgencyTriager | i18n | — | 2 inboxes | 5 (+ deadline buried under process noise, quiet newsletter-only day, family-emergency signal buried in retail spam; 3 keys ×13) | ✅ 2026-09-11 |
| 41 | FakeReviewDetective | inline | 11 categories | 1 | 5 (+ beauty with 'received for free' disclosures, kitchenware mostly genuine, books with competitor-bashing, automotive with incentivized reviews) | ✅ 2026-09-11 |
| 42 | FanTheory | inline | 4 media types | 2 (show, movie) | 5 (+ book, game, a second show) | ✅ 2026-09-11 |
| 43 | FinalWish | inline | — | 2 (complete solo, deliberately unfinished) | 5 (+ a couple with young children/guardianship, a business owner with a tangled company estate) | ✅ 2026-09-11 |
| 44 | FocusPocus | inline | — | 3 | 5 (+ a difficult performance review with a vague 'enough', a no-exit-condition garage clean) | ✅ 2026-09-11 |
| 45 | FocusSoundArchitect | inline | 7 tasks × 7 environments | 2 | 5 (+ studying/high-frequency-sensitive, relaxing toward sleep, tedious commute wanting variety) | ✅ 2026-09-11 |
| 46 | FriendshipFadeAlerter | i18n | 6 relationships × 5 rhythms | 2 | 5 (+ a sister mid-divorce, an old manager who taught the job, a mentor's unanswered message; 6 keys ×13) | ✅ 2026-09-11 |
| 47 | FutureProof | i18n | 5 subject types | 2 (career, skill) | 5 (+ physical retail's future, a long-term index-fund bet, a long-distance commitment with no concrete plan; 6 keys ×13) | ✅ 2026-09-11 |
| 48 | GentlePushGenerator | i18n | 6 domains | already 7 | — | ✅ pre-existing |
| 49 | GetNoticed | inline | — | 2 | 5 (+ overshadowed PhD student, isolated new-city nurse, plateaued small-business owner) | ✅ 2026-09-11 |
| 50 | GhostWriter | inline | 7 letter types × 3 formality levels | 1 | 5 (grad-school, casual LinkedIn, scholarship, rental join job reference; two leave optional fields blank) | ✅ 2026-09-11 |
| 51 | Giftology | i18n | — | already 6 | — | ✅ pre-existing |
| 52 | GratitudeDebtClearer | inline | 5 relationships | 2 | 5 (+ a parent, a neighbor, a friend who lent money without making it awkward) | ✅ 2026-09-11 |
| 53 | GriefGuide | i18n | 10 loss types × 5 timelines × myself/helping | 3 | 5 (+ a sudden pet death, helping a brother 8 months into job-loss identity grief; 2 keys ×13) | ✅ 2026-09-11 |
| 54 | HecklerPrep | i18n | 3 stakes levels | 2 (both high) | 5 (+ moderate HOA parking fee, low-stakes tool switch, high-stakes school board proposal; 12 keys ×13) | ✅ 2026-09-11 |
| 55 | HistoryToday | inline | 3 motives (5 bare quick-chips are separate) | 2 | 5 (+ moon-landing conspiracy, a decision-relevant historical pattern, a crisis's untested reforms) | ✅ 2026-09-11 |
| 56 | HobbyMatch | i18n | 4 budgets × 8 goals | 2 | 5 (+ competitive weekend-only, free-only with chronic fatigue, restless hands-on with bad knees; 12 keys ×13) | ✅ 2026-09-11 |
| 57 | JargonAssassin | i18n | 9 document types | 2 (legal, government) | 5 (+ medical prior-auth denial, mortgage disclosure, software license; 9 keys ×13; fixed 3 zh/es formal-register findings) | ✅ 2026-09-11 |
| 58 | JustifyMyMeeting | inline | 4 modes (judge/zombie/week/rescue) | 2 each | 5 each (20 total): incident post-mortem, unwanted vendor demo, 3-person daily standup; zombie innovation committee, bug triage, customer advisory; 4th/5th week audits; rescue leading-it and asleep-on-camera scenarios | ✅ 2026-09-11 |
| 59 | LaundroMat | i18n | — | 2 | 5 (+ red wine on white tablecloth, hand-wash-only wool+silk, mystery stain on baby clothes; 3 keys ×13) | ✅ 2026-09-11 |
| 60 | LayoverMaximizer | inline | 4 travel styles | 2 (both efficient) | 5 (+ explorer 9h Seoul, foodie 6h Singapore, relaxer 3h Dubai overnight with checked bags) | ✅ 2026-09-11 |
| 61 | LazyWorkoutAdapter | i18n | 5 modes (right-now/micro/body/stack/recovery) | 2 each | 5 each (25 total), each mode's five spanning its full enum range; 7 new keys ×13 | ✅ 2026-09-11 |
| 62 | LeaseTrapDetector | inline | 5 lease types | 2 (residential, commercial) | 5 (+ house shifting maintenance to tenant, room rental with master key + 14-day notice, sublease with no landlord consent) | ✅ 2026-09-11 |
| 63 | LeverageLogic | i18n | 8 negotiation types | 2 (freelance, salary) | 5 (+ vendor price hike, lease renewal, car purchase; 12 keys ×13) | ✅ 2026-09-11 |
| 64 | MagicMouth | i18n | 3 modes (ask/phone/nuclear) | ask already 8; phone 2; nuclear 2 | ask unchanged; phone 5, nuclear 5 (+ mobile carrier, gym, electric co, online retailer, delivery, moving co; keys ×13) | ✅ 2026-09-11 |
| 65 | MarkupDetective | i18n | — | already 6 | — | ✅ pre-existing |
| 66 | MeetingHijackStopper | inline | 8 meeting types | 2 (Decision, Difficult discussion) | 5 (+ hybrid brainstorm with quiet remote half, blame-prone retro, harder-than-usual 1:1) | ✅ 2026-09-11 |
| 67 | Mend (ApologyCalibrator) | inline | 10 views (button only lives on calibrate) | 2 | 5 (+ forgotten school pickup, accidentally-spoiled surprise, honest feedback that may not need an apology) | ✅ 2026-09-11 |
| 68 | MentalHealthNavigator | inline | 14 areas × 6 tried-before × 7 barriers | 2 | 5 (+ escalating drinking against a 3-month waitlist, restrictive eating that doesn't 'look like' a disorder, postpartum numbness masked by functioning) | ✅ 2026-09-11 |
| 69 | MicroAdventureMapper | inline | 4 when × 3 time-of-day × 4 budget × 4 transport | 2 | 5 (+ energizing free bike ride, fully-surprise weekend drive, chill moderate-budget evening) | ✅ 2026-09-11 |
| 70 | MiseEnPlace | inline | 3 skill levels × 4 meal types | 2 | 5 (+ advanced sourdough-discard breakfast, 10-minute beginner lunch, make-ahead gathering snack) | ✅ 2026-09-11 |
| 71 | MissingLink (TheoryGap) | i18n | — | already 5 | — | ✅ pre-existing |
| 72 | MoneyDiplomat | i18n | 6 request types | already 6 | — | ✅ pre-existing |
| 73 | NameAudit | inline | — | 2 | 5 (+ overly long/generic consulting name, marketplace-search toy brand, a name that may overpromise) | ✅ 2026-09-11 |
| 74 | NameStorm | inline | 3 modes (generate/blend/quick), 15 categories | 1 each (no rotation) | 5 each — converted single-example-per-mode to pickExample rotation (15 total) | ✅ 2026-09-11 |
| 75 | NameThatFeeling | i18n | — | 2 | 5 (+ relief tangled with disappointment, quiet satisfaction at someone's struggle, dread-hope waiting on news; 6 keys ×13) | ✅ 2026-09-11 |
| 76 | NerveCheck | i18n | 3 sub-modes (main/debrief/coach) | 2 each | 5 each (15 total): presentation/date/medical; debrief spanning the readiness range; coach covering every relation and both non-adult ages; keys ×13 | ✅ 2026-09-11 |
| 77 | NotSoFast (RulebookBreaker) | i18n | — | already 5 | — | ✅ pre-existing |
| 78 | PEP | i18n | 7 moods × 5 environments | 2 | 5 (+ anxious pre-presentation spike, numb do-nothing day, overstimulated commute; 3 keys ×13) | ✅ 2026-09-11 |
| 79 | PaperworkPath | i18n | 8 life events | 2 (move, death) | 5 (+ new baby, divorce, retiring; 6 keys ×13) | ✅ 2026-09-11 |
| 80 | PartyArchitect | inline | 5 vibes × 4 durations | 2 (both chill) | 5 (+ energetic kids' party, elegant engagement merging two families, retirement party that must not feel like a funeral) | ✅ 2026-09-11 |
| 81 | PetBehaviorDecoder | inline | 5 pet types × 5 durations × 5 frequencies | 2 (cat, dog) | 5 (+ bird plucking feathers, rabbit's intermittent months-long hunching, cat's sudden constant thirst; covers every pet type) | ✅ 2026-09-11 |
| 82 | PlainTalk | i18n | 10 text types | 3 (legal, medical, academic) | 5 (+ financial disclosure, bureaucratic form; new shared-constant samples, deliberately English across all languages like the other three; fixed es/pt gender-hedge false positive) | ✅ 2026-09-11 |
| 83 | PlantRescue | inline | 3 modes (rescue/identify/care — identify needs a photo, not seedable) | 2 (rescue only) | 5 (+ overwatered succulent, outdoor rose with powdery mildew, a care-mode monstera; loader now handles care mode) | ✅ 2026-09-11 |
| 84 | PlotHoleFinder | inline | find/defend × 4 media types | 2 (find only) | 5 (+ book, game, and a defend-mode example pushing back on an alleged hole; loader now handles defend mode) | ✅ 2026-09-11 |

(rows 13–126 are appended as each batch is inventoried — see
`scratchpad/examples/inventory.json` for the machine inventory of all 126.)

## Follow-ups

- Translate inline example sets for localized tools (13 languages) once English coverage is complete.
