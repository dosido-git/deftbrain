// The overview on each tool category page (/tools/<slug>), shown under the
// tool grid. The category pages are the topic pillars (owner, 2026-11-20):
// tool pages and guides link up to them, and this text is what makes each one
// a real page about its topic rather than a list.
//
// Read only by scripts/build-tools-category-pages.js (not imported by the
// app, so it adds nothing to the bundle). Keys are categoryMeta.js names.
// `paras` accept inline links: [label](/path). Any fact that is not about a
// DeftBrain tool carries a source in `sources`; keep it that way.

export const CATEGORY_OVERVIEWS = {
  'Home & Daily Life': {
    heading: 'Running a home, and the small problems that come with it',
    paras: [
      'Most of what goes wrong at home is small, but it rarely arrives one thing at a time. A lease to read before the deadline, a stain that has already set, a plant that keeps dropping leaves, a roommate disagreement that has gone quiet but not away. These tools are for that kind of moment: something has come up, and you want to understand it before you act on it.',
      'Paperwork is where the stakes are highest. [Lease Trap Detector](/LeaseTrapDetector) reads a lease for clauses that could cost you later, and [Contract Decoder](/ContractDecoder) does the same for other agreements. [Document Detective](/DocumentDetective) finds the parts of a long notice or benefits packet that apply to you. When a life event brings its own stack of forms, such as a move, a marriage or a loss, [Paperwork Path](/PaperworkPath) lays out which documents tend to matter and when.',
      'Renting has its own trap: a deposit you lose because you cannot prove what the unit looked like on day one. [Renter’s Deposit Saver](/RentersDepositSaver) walks you through recording the condition at move-in, and the [security deposit laws by state](/guides/home/security-deposit-laws-by-state) table shows the rules where you live. When the trouble is with the people you live with, [Roommate Court](/RoommateCourt) separates what happened from what each side says about it.',
      'Some problems are physical. [Plant Rescue](/PlantRescue), [Bike Medic](/BikeMedic) and [LaundroMat](/LaundroMat) start from what you are seeing and narrow down what may be causing it. In the kitchen, [Mise en Place](/MiseEnPlace) plans a meal around what you have, and [Recipe Chaos Solver](/RecipeChaosSolver) helps when one is going wrong.',
      'Others are about time. [Batch Flow](/BatchFlow) groups a scattered list into a day that makes sense, [Where Did the Time Go?](/WhereDidTheTimeGo) looks back at one that disappeared, and [Waiting Mode Liberator](/WaitingModeLiberator) helps with the stuck feeling before an appointment. [Safe Walk](/SafeWalk) helps you think through a walk alone before you set out, and [Final Wish](/FinalWish) gathers what your family would need to find if something happened to you.',
      'If none of these fits, [Tool Finder](/ToolFinder) takes a description in your own words and suggests where to start.',
    ],
    sources: [],
  },

  'Travel & Events': {
    heading: 'Trips, outings and evenings worth planning',
    paras: [
      'A trip or a night out usually goes well or badly on details nobody thought about in advance: whether a layover is long enough to leave the airport, what counts as rude where you are going, whether you are really in shape to drive home. These tools help you look at those details while there is still time to change the plan.',
      'Before you travel somewhere new, [Culture Briefing](/CultureBriefing) covers greetings, dining, dress, tipping and the things visitors tend to get wrong. If your connection is long, [Layover Maximizer](/LayoverMaximizer) works out whether there is real time to see something, once security, transit and the walk back to the gate are counted, or whether staying put is the safer choice.',
      'Closer to home, [Micro-Adventure Mapper](/MicroAdventureMapper) turns a free hour or two into something different to do nearby, and [Date Night](/DateNight) plans a whole evening around your budget and the kind of night you have in mind.',
      'At the end of a long day, [Drive Home](/DriveHome) looks at the drive and how you are feeling, and helps you weigh whether to go, wait, or find another way.',
      'For the guides on layovers, gatherings and days out, see the list below.',
    ],
    sources: [],
  },

  'Relationships': {
    heading: 'Keeping in touch, celebrating, and the moments in between',
    paras: [
      'Relationships are mostly kept up in small moments: a message sent before too much time has passed, a gift that shows you were paying attention, an evening that feels planned rather than defaulted to. These tools are for those moments.',
      'Friendships rarely end on purpose; they fade when nobody reaches out. [Friendship Fade Alerter](/FriendshipFadeAlerter) lets you choose how often you want to be in touch with the people who matter to you and shows when it may be worth saying hello. When you are together and the conversation stalls, [Awkward Silence Filler](/AwkwardSilenceFiller) offers natural things to say for the setting you are in.',
      'For occasions, [Giftology](/Giftology) turns what you know about someone into gift ideas, which helps most with the people who are hardest to shop for. [Party Architect](/PartyArchitect) plans a gathering from the guest list, space and budget, and [Date Night](/DateNight) builds a full evening around what you want to spend and the kind of night you are hoping for.',
      'Harder relationship conversations, such as apologies, conflicts and things left unsaid, have their own tools under [Conversations](/tools/conversations).',
    ],
    sources: [],
  },

  'Money': {
    heading: 'Bills, prices, scams and getting what you paid for',
    paras: [
      'Most money problems start with a single question: is this right? A bill higher than expected, a quote that seems steep, a message asking you to pay, a product with suspiciously perfect reviews. These tools help you answer it before you pay, sign or reply.',
      'Scams cost real money. Americans reported losing more than $12.5 billion to fraud in 2024, according to the Federal Trade Commission, and a larger share of the people who reported fraud said they lost money than the year before. [Scam Radar](/ScamRadar) looks at a suspicious email, text or invoice and shows which parts deserve caution.',
      'Reviews are another place where appearances mislead. Since October 2024, an FTC rule has banned selling or buying fake reviews, but that has not made them disappear. [Fake Review Detective](/FakeReviewDetective) helps tell genuine reviews from suspect ones, and [Buy Wise](/BuyWise) looks at the trade-offs of a purchase before you commit.',
      'When the money is already owed, [Bill Rescue](/BillRescue) shows where you stand with a bill that is wrong, too big or overdue, including what you may not owe. Medical bills have specific protections: if you are uninsured or paying yourself and the bill comes in at least $400 above the written good faith estimate you were given, federal rules let you dispute it. For repairs, [Quote Check](/QuoteCheck) compares a quote with what the work usually costs.',
      'Some money moments are social rather than technical. [Money Diplomat](/MoneyDiplomat) covers tips, splitting bills and other awkward amounts, [Upsell Shield](/UpsellShield) helps you keep your priorities in a sales conversation, and [Markup Detective](/MarkupDetective) shows where the price of something goes.',
    ],
    sources: [
      { label: 'New FTC data show a big jump in reported losses to fraud, to $12.5 billion in 2024 (Federal Trade Commission)', url: 'https://www.ftc.gov/news-events/news/press-releases/2025/03/new-ftc-data-show-big-jump-reported-losses-fraud-125-billion-2024' },
      { label: 'Federal Trade Commission announces final rule banning fake reviews and testimonials (FTC)', url: 'https://www.ftc.gov/news-events/news/press-releases/2024/08/federal-trade-commission-announces-final-rule-banning-fake-reviews-testimonials' },
      { label: 'Medical bill rights for uninsured and self-pay patients (CMS)', url: 'https://www.cms.gov/nosurprises/consumers/uninsured-and-self-pay-patients' },
    ],
  },

  'Career and Business': {
    heading: 'Work, meetings, and making the case for yourself',
    paras: [
      'Much of work is preparation that nobody sees: getting ready for a review, a negotiation, a presentation or a meeting that could go sideways. These tools help with that preparation, so the moment itself goes more the way you intend.',
      'When it is time to show what you have done, [Brag Sheet Builder](/BragSheetBuilder) turns your accomplishments into a case for a review, a promotion or a résumé. [Skill Gap Map](/SkillGapMap) looks at what your experience already shows and what a new role would ask of you. If part of your history is hard to explain, such as a gap or a firing, [The Whole Story](/TheWholeStory) helps you tell it honestly for the audience in front of you. [Leverage Logic](/LeverageLogic) looks at where each side stands before a negotiation.',
      'Meetings have their own set. [Justify My Meeting](/JustifyMyMeeting) asks whether a meeting needs to happen at all, [Meeting Hijack Stopper](/MeetingHijackStopper) builds an agenda that holds its course, and [The Debrief](/TheDebrief) pulls the decisions and follow-ups out of the notes afterwards. [Email Urgency Triager](/EmailUrgencyTriager) sorts what needs a reply today from what can wait.',
      'For presentations, [Heckler Prep](/HecklerPrep) raises the hardest questions you are likely to face, [The Run-Through](/TheRunthrough) finds what to cut, and [Nerve Check](/NerveCheck) helps with the nerves before any high-stakes moment.',
      'For reaching people, [Before Hello](/BeforeHello), [Cold Open Craft](/ColdOpenCraft) and [Get Noticed](/GetNoticed) help you become known before you ask for anything. For ideas and ventures, [Concept Coach](/ConceptCoach) and [Future Proof](/FutureProof) test a plan, and [Name Storm](/NameStorm) and [Name Audit](/NameAudit) help name it. [Ghost Writer](/GhostWriter) writes recommendation letters, and [Contract Decoder](/ContractDecoder) and [Document Detective](/DocumentDetective) read the fine print.',
    ],
    sources: [],
  },

  'Health & Wellness': {
    heading: 'Doctor visits, energy, focus and getting through hard days',
    paras: [
      'Health questions often come with little time to ask them. A doctor’s appointment goes by quickly, test results arrive in terms nobody explained, and energy and focus are hard to manage when you are already short of both. These tools help you prepare, understand what you were told, and work with the energy you have. They are not a substitute for medical care.',
      'Before an appointment, [Doctor Visit Prep](/DoctorVisitPrep) turns scattered symptoms and worries into a short list of what to raise first. Afterwards, [Doctor Visit Translator](/DoctorVisitTranslator) explains visit notes and lab results in plain language. If a procedure has been recommended, [Procedure Probe](/ProcedureProbe) covers what it involves and what to ask before you schedule it.',
      'Sleep shapes most of the rest. The CDC recommends at least seven hours a night for adults, and about three in ten U.S. adults get less. [Sleep Architect](/SleepArchitect) suggests one change at a time to try. For energy, [PEP](/PEP) matches what you do to how much you have, [Before the Crash](/BeforeTheCrash) looks for patterns in the days that go badly, and [Social Battery Advisor](/SocialBatteryAdvisor) tracks which interactions leave you with more or less.',
      'For focus, [Focus Pocus](/FocusPocus) sets a clear stopping point for an open-ended task, [Task Avalanche Breaker](/TaskAvalancheBreaker) finds one place to begin on a project that feels too big, and [Virtual Body Double](/VirtualBodyDouble) keeps you company while you work. [Brain Dump Buddy](/BrainDumpBuddy) and [Chaos Pilot](/ChaosPilot) sort a crowded mind into what needs you now.',
      'For harder times, [Mental Health Navigator](/MentalHealthNavigator) helps you work out which kind of support fits what you are going through, and [GriefGuide](/GriefGuide) offers guidance through a loss. If you are in crisis or thinking about suicide, you can call or text 988 in the U.S. to reach the 988 Suicide & Crisis Lifeline at any hour.',
    ],
    sources: [
      { label: 'FastStats: Sleep in Adults (Centers for Disease Control and Prevention)', url: 'https://www.cdc.gov/sleep/data-and-statistics/adults.html' },
      { label: '988 Suicide & Crisis Lifeline', url: 'https://988lifeline.org/' },
    ],
  },

  'Conversations': {
    heading: 'What to say, and how it will land',
    paras: [
      'Most hard conversations are hard before they start. You are not sure how a message will read, what the other person meant, or how to say the difficult thing without saying it badly. These tools help you think a conversation through first, so you go in with words you are comfortable standing behind.',
      'When you have received something confusing or tense, [Decoder Ring](/DecoderRing) separates what was said from what may have been meant, and [Conflict Coach](/ConflictCoach) helps you reply to a heated message without making it worse. Before you send something of your own, [Context Collapse](/ContextCollapse) shows how different readers might take it, and [Velvet Hammer](/VelvetHammer) keeps the point while taking out the anger.',
      'For conversations you have been putting off, [Difficult Talk Coach](/DifficultTalkCoach) helps you plan and practise one, [Truth Bomb](/TruthBomb) weighs whether to share something you have been keeping, and [Mend](/Mend) sizes an apology to what actually happened. [Gratitude Debt Clearer](/GratitudeDebtClearer) turns a thank-you you have been meaning to send into words.',
      'When a company or institution says no, [Not So Fast!](/NotSoFast) looks for exceptions and appeal routes that tend to go unmentioned, and [Complaint Escalation Writer](/ComplaintEscalationWriter) lays out how to escalate when a complaint stalls. For problems with a bank, lender or other financial company, the Consumer Financial Protection Bureau accepts complaints and sends them to the company, which generally responds within 15 days.',
      'For occasions and everyday talk, there are [Toast Writer](/ToastWriter) for speeches and tributes, [Read the Room](/ReadTheRoom) for social situations, [Analogy Engine](/AnalogyEngine) for explaining something to a particular listener, and [What’s That Mean?](/WhatsThatMean) for a phrase that makes no sense.',
    ],
    sources: [
      { label: 'Submit a complaint (Consumer Financial Protection Bureau)', url: 'https://www.consumerfinance.gov/complaint/' },
    ],
  },

  'Learning': {
    heading: 'Understanding hard material, and checking what you read',
    paras: [
      'Learning something rarely fails all at once. It stalls at one sentence you cannot follow, one idea that everything else depends on, or one claim you are not sure you can trust. These tools are built around those sticking points.',
      'For dense reading, [Plain Talk](/PlainTalk) explains a passage in plain language and shows how it is put together. [Research Decoder](/ResearchDecoder) does the same for a study, separating what the researchers found from what they actually did. [Heart of the Matter](/HeartOfTheMatter) finds what matters in something long, such as a lecture, a podcast transcript or a set of notes.',
      'When you are stuck on a concept, [Missing Link](/MissingLink) traces back through what it depends on to find the point where understanding broke. When you need to explain something to someone else, [Analogy Engine](/AnalogyEngine) builds the explanation from their world rather than yours.',
      'For claims you have heard repeated, [Signal vs. Noise](/SignalVsNoise) checks sources first, then shows what they support and what is overstated.',
      'For the smaller things, [Pronounce It Right](/PronounceItRight) shows how to say a name or word before you have to, [Someone Said It Better](/SomeoneSaidItBetter) finds a documented quotation that fits what you mean, and [Hobby Match](/HobbyMatch) suggests hobbies that fit your life.',
    ],
    sources: [],
  },

  'Ideas & Diversions': {
    heading: 'Curiosity, stories, and thinking for the fun of it',
    paras: [
      'Not every question needs to be useful. Some are worth asking because they are interesting: what would have happened if history had turned a different way, whether a film’s plot actually holds together, what links two parts of your life that seem to have nothing in common. These tools are for following that kind of curiosity.',
      'For history, [Alternate Path](/AlternatePath) follows one changed moment forward through the decades, [Time Warp](/TimeWarp) drops something modern into a period that was never ready for it, and [History Today](/HistoryToday) finds past events that unfolded much like current ones.',
      'For stories, [Plot Hole Finder](/PlotHoleFinder) looks for where a film, book or show stops adding up, [Fan Theory](/FanTheory) builds a wild but defensible theory or tests yours, and [Bookmark](/Bookmark) catches you up on a series or season without spoilers.',
      'For your own thinking, [Belief Stress Test](/BeliefStressTest) tests a belief you live by against its strongest challenges, [Argue Smarter](/ArgueSmarter) gives you the best case against your position, and [Six Degrees of Me](/SixDegreesOfMe) finds threads that connect parts of your life.',
      'And for pure play: [Brain Roulette](/BrainRoulette) sends you down a random rabbit hole, [Tip of Tongue](/TipOfTongue) helps you recall something half-remembered, [Wrong Answers Only](/WrongAnswersOnly) answers with confident nonsense (the real answer is a click away), and [Magic Mouth](/MagicMouth) helps you ask for something unlikely.',
    ],
    sources: [],
  },

  'Decisions': {
    heading: 'Weighing choices and testing plans',
    paras: [
      'Hard decisions are rarely hard for lack of information. More often the options look close, the trade-offs pull in different directions, or the plan seems fine until something goes wrong. These tools approach a decision from different sides, so you can choose the approach that suits the situation.',
      'For seeing a choice more clearly, [Decision Prism](/DecisionPrism) looks at the trade-offs from several angles and what each option depends on. [Which Life?](/WhichLife) skips the pro-and-con list and imagines an ordinary day in each future, so you can notice how each one feels. If you have gone back and forth long enough, [Decision Coach](/DecisionCoach) applies your own constraints and preferences and gives one answer you can act on.',
      'For testing a plan before you start, [Break My Plan?](/BreakMyPlan) imagines that it has failed and works backward to the weak assumptions. [Concept Coach](/ConceptCoach) does the same for a business idea, pointing out both the risks and the real strengths.',
      'Some decisions are smaller but still matter. [Small Change, Big Difference](/SmallChangeBigDifference) looks for one adjustment to a daily routine, and [Ticket Tackler](/TicketTackler) helps you judge whether a ticket is worth contesting or paying.',
    ],
    sources: [],
  },
};
