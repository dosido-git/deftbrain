// One entry per FAQ topic. Each topic has its own folder under /faq/ (owner,
// 2026-11-25: organized by topic to build topical authority). Each page in faq/pages.js names its topic; the
// builder takes the eyebrow, the closing paragraph and the "More ..." list
// heading from here, and lists only that topic's other pages. The category
// page named by `category` lists every question in the topic.
//
// `close` accepts inline links: [label](/path).

const TOPICS = {
  deposits: {
    folder: 'security-deposits', // pages are served at /faq/security-deposits/<slug>
    category: 'Home & Daily Life', // the /tools category page that lists this topic's questions
    eyebrow: 'Security deposits · Quick answer',
    eyebrowHref: '/guides/home/security-deposit-laws-by-state',
    close: 'Rules differ by state: the [security deposit laws by state](/guides/home/security-deposit-laws-by-state) table lists yours. To record the unit\'s condition at move-in and make your case at move-out, there\'s [Renter\'s Deposit Saver](/RentersDepositSaver).',
    more: 'More deposit questions',
  },
  travel: {
    folder: 'travel', // pages are served at /faq/travel/<slug>
    category: 'Travel & Events', // the /tools category page that lists this topic's questions
    eyebrow: 'Travel & Events · Quick answer',
    eyebrowHref: '/tools/travel-events',
    close: 'For a long connection, [Layover Maximizer](/LayoverMaximizer) works out what you can do with the time you have. Before a trip abroad, [Culture Briefing](/CultureBriefing) covers the customs that catch visitors out. And before a drive you are unsure about, [Drive Home](/DriveHome) helps you weigh going, pausing or not starting.',
    more: 'More travel questions',
  },
  health: {
    folder: 'health', // pages are served at /faq/health/<slug>
    category: 'Health & Wellness', // the /tools category page that lists this topic's questions
    eyebrow: 'Health & Wellness · Quick answer',
    eyebrowHref: '/tools/health-wellness',
    close: 'Before a visit, [Doctor Visit Prep](/DoctorVisitPrep) helps you decide what to raise first; afterwards, [Doctor Visit Translator](/DoctorVisitTranslator) puts what you were told into plain words. [Mental Health Navigator](/MentalHealthNavigator) matches what you are going through to the kind of professional that fits, and [GriefGuide](/GriefGuide) is for the weeks after a loss.',
    more: 'More health questions',
  },
  money: {
    folder: 'money', // pages are served at /faq/money/<slug>
    category: 'Money', // the /tools category page that lists this topic's questions
    eyebrow: 'Money · Quick answer',
    eyebrowHref: '/tools/money',
    close: 'If a message or call feels off, [Scam Radar](/ScamRadar) checks it for the warning signs. [Fake Review Detective](/FakeReviewDetective) weighs a page of reviews, [Quote Check](/QuoteCheck) tells you whether a repair quote is fair, and [Bill Rescue](/BillRescue) helps with a bill that looks wrong.',
    more: 'More money questions',
  },
  home: {
    folder: 'home', // pages are served at /faq/home/<slug>
    category: 'Home & Daily Life', // the /tools category page that lists this topic's questions
    eyebrow: 'Home & Daily Life · Quick answer',
    eyebrowHref: '/tools/home-daily-life',
    close: 'For a life change that comes with forms, [Paperwork Path](/PaperworkPath) lists the documents that matter and the order to tackle them. [Final Wish](/FinalWish) helps you put your wishes in one place, and [Mise en Place](/MiseEnPlace) plans meals from what is already in your kitchen.',
    more: 'More home and everyday questions',
  },
  career: {
    folder: 'work', // pages are served at /faq/work/<slug>
    category: 'Career and Business', // the /tools category page that lists this topic's questions
    eyebrow: 'Career and Business · Quick answer',
    eyebrowHref: '/tools/career',
    close: 'These are US federal rules; your state may add more. When it is time to make your case for a raise or a review, [Brag Sheet Builder](/BragSheetBuilder) turns what you did into evidence, and [Skill Gap Map](/SkillGapMap) shows what stands between you and the role you want.',
    more: 'More work questions',
  },
  learning: {
    folder: 'research', // pages are served at /faq/research/<slug>
    category: 'Learning', // the /tools category page that lists this topic's questions
    eyebrow: 'Learning · Quick answer',
    eyebrowHref: '/tools/learning',
    close: 'For a study you want to understand, [Research Decoder](/ResearchDecoder) explains what it found and how much weight it can bear. [Plain Talk](/PlainTalk) turns dense writing into plain language, and [Signal vs. Noise](/SignalVsNoise) checks a claim against what sources actually say.',
    more: 'More questions about research and reading',
  },
  decisions: {
    folder: 'decisions', // pages are served at /faq/decisions/<slug>
    category: 'Decisions', // the /tools category page that lists this topic's questions
    eyebrow: 'Decisions · Quick answer',
    eyebrowHref: '/tools/decisions',
    close: 'For a choice in front of you, [Decision Coach](/DecisionCoach) helps when you keep going back and forth, and [Break My Plan?](/BreakMyPlan) tests a plan against what could go wrong before you commit to it.',
    more: 'More questions about deciding',
  },
  ideas: {
    folder: 'thinking', // pages are served at /faq/thinking/<slug>
    category: 'Ideas & Diversions', // the /tools category page that lists this topic's questions
    eyebrow: 'Ideas & Diversions · Quick answer',
    eyebrowHref: '/tools/ideas-diversions',
    close: 'When a word won\'t come, [Tip of Tongue](/TipOfTongue) works from whatever you remember about it. [Belief Stress Test](/BeliefStressTest) puts a rule you live by under pressure, and [Argue Smarter](/ArgueSmarter) tests your ideas against the strongest criticism you can find.',
    more: 'More questions about how minds work',
  },
  conversations: {
    folder: 'conversations', // pages are served at /faq/conversations/<slug>
    category: 'Conversations', // the /tools category page that lists this topic's questions
    eyebrow: 'Conversations · Quick answer',
    eyebrowHref: '/tools/conversations',
    close: 'Before a hard conversation, [Difficult Talk Coach](/DifficultTalkCoach) lets you practice it. [Mend](/Mend) matches an apology to the harm done, and [Complaint Escalation Writer](/ComplaintEscalationWriter) gives you a clear plan when a company stops answering.',
    more: 'More questions about conversations',
  },
  relationships: {
    folder: 'relationships', // pages are served at /faq/relationships/<slug>
    category: 'Relationships', // the /tools category page that lists this topic's questions
    eyebrow: 'Relationships · Quick answer',
    eyebrowHref: '/tools/relationships',
    close: '[Friendship Fade Alerter](/FriendshipFadeAlerter) helps you notice which friendships are fading before they are gone, and [Giftology](/Giftology) finds a gift for the hardest person on your list.',
    more: 'More relationship questions',
  },
};

// The one place a FAQ page's URL path is built (builder, category pages, server redirects).
const faqPath = p => `/faq/${TOPICS[p.topic].folder}/${p.slug}`;

module.exports = TOPICS;
// Non-enumerable so loops over the topics never see it.
Object.defineProperty(module.exports, 'faqPath', { value: faqPath });
