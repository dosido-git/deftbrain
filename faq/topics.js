// One entry per FAQ topic. Each page in faq/pages.js names its topic; the
// builder takes the eyebrow, the closing paragraph and the "More ..." list
// heading from here, and lists only that topic's other pages. The category
// page named by `category` lists every question in the topic.
//
// `close` accepts inline links: [label](/path).

module.exports = {
  deposits: {
    category: 'Home & Daily Life', // the /tools category page that lists this topic's questions
    eyebrow: 'Security deposits · Quick answer',
    eyebrowHref: '/guides/home/security-deposit-laws-by-state',
    close: 'Rules differ by state: the [security deposit laws by state](/guides/home/security-deposit-laws-by-state) table lists yours. To record the unit\'s condition at move-in and make your case at move-out, there\'s [Renter\'s Deposit Saver](/RentersDepositSaver).',
    more: 'More deposit questions',
  },
  travel: {
    category: 'Travel & Events', // the /tools category page that lists this topic's questions
    eyebrow: 'Travel & Events · Quick answer',
    eyebrowHref: '/tools/travel-events',
    close: 'For a long connection, [Layover Maximizer](/LayoverMaximizer) works out what you can do with the time you have. Before a trip abroad, [Culture Briefing](/CultureBriefing) covers the customs that catch visitors out. And before a drive you are unsure about, [Drive Home](/DriveHome) helps you weigh going, pausing or not starting.',
    more: 'More travel questions',
  },
  health: {
    category: 'Health & Wellness', // the /tools category page that lists this topic's questions
    eyebrow: 'Health & Wellness · Quick answer',
    eyebrowHref: '/tools/health-wellness',
    close: 'Before a visit, [Doctor Visit Prep](/DoctorVisitPrep) helps you decide what to raise first; afterwards, [Doctor Visit Translator](/DoctorVisitTranslator) puts what you were told into plain words. [Mental Health Navigator](/MentalHealthNavigator) matches what you are going through to the kind of professional that fits, and [GriefGuide](/GriefGuide) is for the weeks after a loss.',
    more: 'More health questions',
  },
  money: {
    category: 'Money', // the /tools category page that lists this topic's questions
    eyebrow: 'Money · Quick answer',
    eyebrowHref: '/tools/money',
    close: 'If a message or call feels off, [Scam Radar](/ScamRadar) checks it for the warning signs. [Fake Review Detective](/FakeReviewDetective) weighs a page of reviews, [Quote Check](/QuoteCheck) tells you whether a repair quote is fair, and [Bill Rescue](/BillRescue) helps with a bill that looks wrong.',
    more: 'More money questions',
  },
  home: {
    category: 'Home & Daily Life', // the /tools category page that lists this topic's questions
    eyebrow: 'Home & Daily Life · Quick answer',
    eyebrowHref: '/tools/home-daily-life',
    close: 'For a life change that comes with forms, [Paperwork Path](/PaperworkPath) lists the documents that matter and the order to tackle them. [Final Wish](/FinalWish) helps you put your wishes in one place, and [Mise en Place](/MiseEnPlace) plans meals from what is already in your kitchen.',
    more: 'More home and everyday questions',
  },
  career: {
    category: 'Career and Business', // the /tools category page that lists this topic's questions
    eyebrow: 'Career and Business · Quick answer',
    eyebrowHref: '/tools/career',
    close: 'These are US federal rules; your state may add more. When it is time to make your case for a raise or a review, [Brag Sheet Builder](/BragSheetBuilder) turns what you did into evidence, and [Skill Gap Map](/SkillGapMap) shows what stands between you and the role you want.',
    more: 'More work questions',
  },
  learning: {
    category: 'Learning', // the /tools category page that lists this topic's questions
    eyebrow: 'Learning · Quick answer',
    eyebrowHref: '/tools/learning',
    close: 'For a study you want to understand, [Research Decoder](/ResearchDecoder) explains what it found and how much weight it can bear. [Plain Talk](/PlainTalk) turns dense writing into plain language, and [Signal vs. Noise](/SignalVsNoise) checks a claim against what sources actually say.',
    more: 'More questions about research and reading',
  },
};
