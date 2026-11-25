// Travel & Events FAQ pages (topic: travel). Every claim is from the page linked
// in that entry's sources, read 2026-11-25. Where official sources disagreed
// (hours awake vs blood alcohol), the claim was left out rather than picked.

const S = {
  cbpGuide: { label: 'Welcome to the United States: A Guide for International Visitors (U.S. Customs and Border Protection)', url: 'https://www.cbp.gov/sites/default/files/documents/WelcomeToTheUS.pdf' },
  cbpIrbs: { label: 'CBP launches International Remote Baggage Screening Initiative, April 8, 2025 (U.S. Customs and Border Protection)', url: 'https://www.cbp.gov/newsroom/national-media-release/cbp-launches-innovative-international-remote-baggage-screening' },
  ukTransit: { label: 'Visit the UK in transit (GOV.UK)', url: 'https://www.gov.uk/transit-visa' },
  ukDatv: { label: 'Direct Airside Transit visa (GOV.UK)', url: 'https://www.gov.uk/transit-visa/direct-airside-transit-visa' },
  ukVit: { label: 'Visitor in Transit visa (GOV.UK)', url: 'https://www.gov.uk/transit-visa/visitor-in-transit-visa' },
  euVisa: { label: 'Applying for a Schengen visa (European Commission, Migration and Home Affairs)', url: 'https://home-affairs.ec.europa.eu/policies/schengen/schengen-visas/applying-schengen-visa_en' },
  jnto: { label: 'Tipping in Japan (Japan National Tourism Organization)', url: 'https://www.japan.travel/en/plan/tipping-in-japan/' },
  nhtsa: { label: 'Drowsy Driving (National Highway Traffic Safety Administration)', url: 'https://www.nhtsa.gov/risky-driving/drowsy-driving' },
  fmcsa: { label: 'CMV Driving Tips: Driver Fatigue (Federal Motor Carrier Safety Administration)', url: 'https://www.fmcsa.dot.gov/safety/driver-safety/cmv-driving-tips-driver-fatigue' },
  hwCode: { label: 'The Highway Code, rule 91 (GOV.UK)', url: 'https://www.gov.uk/guidance/the-highway-code/rules-for-drivers-and-motorcyclists-89-to-102' },
};

const MODIFIED = '2026-11-25';

module.exports = [
  {
    slug: 'do-you-have-to-go-through-customs-on-a-connecting-flight-in-the-us',
    question: 'Do you have to go through customs on a connecting flight in the US?',
    answer: 'Yes. Arrival processing has to be finished at the first US airport you land at, even when you are flying on to another US city.',
    paras: [
      'U.S. Customs and Border Protection’s guide for visitors says processing must be completed at the first port of entry, so many travelers finish all arrival processing and then go straight to their connecting flight.',
      'After the final CBP checkpoint, major airports let you re-check your luggage, which goes through the X-ray screening TSA requires. You then go through a TSA checkpoint before your departure gate.',
      'So a US connection after an international flight includes immigration, customs, re-checking bags and a security checkpoint, all between the two flights.',
    ],
    sources: [S.cbpGuide],
  },
  {
    slug: 'do-you-have-to-pick-up-your-bags-on-a-connecting-flight-to-the-us',
    question: 'Do you have to pick up your bags on a connecting flight to the US?',
    answer: 'Usually yes. You collect your checked bags at the first US airport, take them through customs, then re-check them. A few routes in a CBP program skip this.',
    paras: [
      'CBP’s guide for visitors says to pick up your baggage at the carousel and take it to the CBP checkpoint. From there an officer lets you go on to your connecting flight, and major airports let you re-check the bags for it.',
      'In April 2025, CBP started a remote baggage screening program in which officers review X-ray images taken at the foreign airport before the plane lands. On covered routes, connecting passengers can go on without re-checking their bags unless CBP refers them for inspection.',
      'The first route was American Airlines from Sydney to Los Angeles, and CBP said it would expand to other routes and airlines. Your airline can tell you whether your flight is covered.',
    ],
    sources: [S.cbpGuide, S.cbpIrbs],
  },
  {
    slug: 'do-i-need-a-transit-visa-for-a-layover-in-the-uk',
    question: 'Do I need a transit visa for a layover in the UK?',
    answer: 'It depends on your nationality and on whether you go through UK border control. Many travelers need no transit visa at all.',
    paras: [
      'If you change flights without going through border control, the visa for nationalities that need one is the Direct Airside Transit visa.',
      'If you go through border control, for example to check in luggage for your next flight, and leave the UK within 48 hours, the visa is the Visitor in Transit visa.',
      'You do not need a transit visa if you hold a valid electronic travel authorisation (ETA), a Standard Visitor visa, a Marriage Visitor visa, an EU Settlement Scheme family permit or a Home Office travel document. Which of these applies depends on your nationality.',
    ],
    sources: [S.ukTransit, S.ukDatv, S.ukVit],
  },
  {
    slug: 'can-you-leave-the-airport-on-a-layover-in-the-uk',
    question: 'Can you leave the airport on a layover in the UK?',
    answer: 'Only by going through UK border control, which needs whatever permission your passport requires to enter. For stays up to 48 hours in transit, some travelers need a Visitor in Transit visa.',
    paras: [
      'The UK’s transit rules turn on one question: whether you go through border control when you arrive. Staying airside and changing flights is covered by different rules from passing through border control.',
      'The Visitor in Transit visa is for people who go through border control and leave the UK within 48 hours. To stay longer than 48 hours, GOV.UK says you need a Standard Visitor visa.',
      'Holders of a valid electronic travel authorisation (ETA) or a Standard Visitor visa do not need a transit visa.',
    ],
    sources: [S.ukTransit, S.ukVit],
  },
  {
    slug: 'do-i-need-a-visa-for-a-layover-in-europe',
    question: 'Do I need a visa for a layover in Europe?',
    answer: 'Only nationals of some countries need an airport transit visa to change planes in the Schengen area. Leaving the airport is a different matter: that means entering the Schengen area.',
    paras: [
      'The Schengen area has three kinds of visa, and one is the airport transit visa. It lets you connect through the international transit area of a Schengen airport during a stopover or a change of flights.',
      'It does not let you leave the international transit area. To leave the airport, you need whatever your passport requires to enter the Schengen area.',
      'All 29 Schengen countries apply the same visa rules. The European Commission keeps the lists of nationalities that need a visa and those that need one for airport transfers.',
    ],
    sources: [S.euVisa],
  },
  {
    slug: 'do-you-tip-in-japan',
    question: 'Do you tip in Japan?',
    answer: 'Generally no. Japan’s national tourism organization says tipping is not common in bars, cafes, restaurants, taxis or hotels.',
    paras: [
      'There is a gratuity custom called kokorozuke for some situations, but the tourism organization says it is not expected.',
      'If you do give one, do it discreetly. It is customary to put the money in an envelope rather than hand over cash directly.',
    ],
    sources: [S.jnto],
  },
  {
    slug: 'how-often-should-you-take-a-break-when-driving',
    question: 'How often should you take a break when driving?',
    answer: 'The UK Highway Code recommends a break of at least 15 minutes after every two hours of driving, and stopping somewhere safe whenever you feel sleepy.',
    paras: [
      'The same rule says not to start a journey tired, to get enough sleep before a long one, and to avoid long drives between midnight and 6 a.m., when natural alertness is at its lowest.',
      'The U.S. National Highway Traffic Safety Administration says drowsy-driving crashes happen most often between midnight and 6 a.m. and in the late afternoon.',
    ],
    sources: [S.hwCode, S.nhtsa],
  },
  {
    slug: 'does-coffee-help-you-stay-awake-while-driving',
    question: 'Does coffee help you stay awake while driving?',
    answer: 'Only briefly. US road safety agencies say coffee can make you feel more alert for a short time, but it is not a cure for drowsiness.',
    paras: [
      'The National Highway Traffic Safety Administration says that if you are seriously sleep-deprived you may still have microsleeps of four or five seconds after coffee. At 55 miles per hour that is more than 100 yards traveled asleep.',
      'Its suggestion if you get sleepy while driving: one to two cups of coffee and a 20-minute nap in a safe place, such as a lighted rest stop. Studies show that raises alertness, but only for a short time.',
      'The Federal Motor Carrier Safety Administration adds that caffeine takes several minutes to work, has a smaller effect on regular users, and that short naps restore energy better than coffee. Opening the window or turning up the radio helps only for an instant.',
    ],
    sources: [S.nhtsa, S.fmcsa],
  },
  {
    slug: 'how-long-should-you-nap-before-driving',
    question: 'How long should you nap before driving?',
    answer: 'The US trucking safety agency suggests at least 10 minutes and ideally up to 45, then at least 15 minutes awake before you drive.',
    paras: [
      'That guidance is from the Federal Motor Carrier Safety Administration, which also says naps taken to prevent drowsiness work better than naps taken once you are already drowsy.',
      'The National Highway Traffic Safety Administration suggests a 20-minute nap in a safe place, such as a lighted rest stop, if you get sleepy while driving. It says the only real protection is enough sleep: seven to eight hours a night.',
    ],
    sources: [S.fmcsa, S.nhtsa],
  },
  {
    slug: 'what-are-the-signs-you-are-too-tired-to-drive',
    question: 'What are the signs you are too tired to drive?',
    answer: 'Frequent yawning, heavy eyes and blurred vision, and on the road, drifting over lane lines or hitting a rumble strip.',
    paras: [
      'The yawning, heavy eyes and blurred vision come from the Federal Motor Carrier Safety Administration. Crossing lane lines and hitting rumble strips are the road signs the National Highway Traffic Safety Administration names.',
      'NHTSA says drowsy-driving crashes often involve a lone driver running off the road at high speed with no sign of braking, most often between midnight and 6 a.m. or in the late afternoon.',
      'The UK Highway Code says that if you feel sleepy, stop in a safe place, though not on a motorway hard shoulder.',
    ],
    sources: [S.fmcsa, S.nhtsa, S.hwCode],
  },
].map(p => ({ modified: MODIFIED, topic: 'travel', ...p }));
