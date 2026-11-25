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
};
