// Home & Daily Life FAQ pages (topic: home) — food safety, records and
// paperwork, advance directives. Every claim is from the page linked in that
// entry's sources, read 2026-11-25.

const S = {
  fsis: { label: 'Leftovers and Food Safety (USDA Food Safety and Inspection Service)', url: 'https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/leftovers-and-food-safety' },
  temps: { label: 'Cook to a Safe Minimum Internal Temperature (FoodSafety.gov)', url: 'https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures' },
  irs: { label: 'How long should I keep records? (Internal Revenue Service)', url: 'https://www.irs.gov/businesses/small-businesses-self-employed/how-long-should-i-keep-records' },
  ssa: { label: 'Replace Social Security card (Social Security Administration)', url: 'https://www.ssa.gov/number-card/replace-card' },
  vital: { label: 'Where to Write for Vital Records (CDC National Center for Health Statistics)', url: 'https://www.cdc.gov/nchs/w2w/index.htm' },
  nia: { label: 'Advance Care Planning: Advance Directives for Health Care (National Institute on Aging)', url: 'https://www.nia.nih.gov/health/advance-care-planning/advance-care-planning-advance-directives-health-care' },
};

const MODIFIED = '2026-11-25';

module.exports = [
  {
    slug: 'how-long-can-leftovers-stay-in-the-fridge',
    question: 'How long can leftovers stay in the fridge?',
    answer: '3 to 4 days, according to the USDA. They can also be frozen for 3 to 4 months.',
    paras: [
      'Frozen leftovers stay safe indefinitely, the USDA says, but they lose moisture and flavor the longer they are stored.',
      'Refrigerate leftovers within 2 hours of cooking. Dividing large amounts, such as a pot of soup, into shallow containers helps them cool quickly to 40°F or below.',
      'When you reheat leftovers, bring them to 165°F, and bring sauces, soups and gravies to a rolling boil.',
    ],
    sources: [S.fsis],
  },
  {
    slug: 'how-long-can-food-sit-out',
    question: 'How long can food sit out?',
    answer: 'No more than 2 hours at room temperature, or 1 hour if it is above 90°F, such as at a summer picnic. After that, the USDA says to throw perishable food away.',
    paras: [
      'Bacteria grow rapidly between 40°F and 140°F, the range the USDA calls the danger zone. Hot food should be kept at 140°F or warmer and cold food at 40°F or below.',
      'At a buffet, keep hot food in chafing dishes, slow cookers or warming trays, and keep cold food in bowls nested in ice.',
    ],
    sources: [S.fsis],
  },
  {
    slug: 'can-you-refreeze-thawed-leftovers',
    question: 'Can you refreeze thawed leftovers?',
    answer: 'Yes, if they were thawed in the refrigerator. Leftovers thawed in cold water or the microwave should be cooked or heated to 165°F before refreezing.',
    paras: [
      'Refrigerator thawing takes longest but keeps food safe the whole time. Food thawed that way should be used within 3 to 4 days or can be refrozen.',
      'If you thaw a large container in the refrigerator and need only part of it, the USDA says you can refreeze the rest without reheating it. Food left over after reheating to 165°F can also be refrozen.',
    ],
    sources: [S.fsis],
  },
  {
    slug: 'what-temperature-should-meat-be-cooked-to',
    question: 'What temperature should meat be cooked to?',
    answer: '145°F for steaks, roasts and chops of beef, pork, lamb and veal, with a 3-minute rest; 160°F for ground meat and sausage; and 165°F for all poultry.',
    paras: [
      'Fish should reach 145°F or cook until the flesh is no longer translucent and separates easily with a fork. Egg dishes such as quiche should reach 160°F, and leftovers and casseroles 165°F.',
      'The federal food safety site says to check with a food thermometer. The rest time lets the inside of the meat finish cooking safely.',
    ],
    sources: [S.temps],
  },
  {
    slug: 'how-long-should-you-keep-tax-records',
    question: 'How long should you keep tax records?',
    answer: 'Generally 3 years after you file, the IRS says, but longer in some situations: 6 years if you left out more than 25% of your income, 7 years for a claim for a worthless-securities loss or bad debt.',
    paras: [
      'If you file a claim for a credit or refund, keep records 3 years from filing or 2 years from paying the tax, whichever is later. If you don’t file a return, or file a fraudulent one, keep them indefinitely.',
      'Keep records about property until the limitation period ends for the year you sell or dispose of it. The IRS also suggests keeping copies of your filed returns.',
      'Before you throw records away, check whether an insurance company or creditor needs them for longer.',
    ],
    sources: [S.irs],
  },
  {
    slug: 'how-do-you-replace-a-social-security-card',
    question: 'How do you replace a Social Security card?',
    answer: 'Request a free replacement from the Social Security Administration, online if your situation allows it. The card arrives by mail in 5 to 10 business days.',
    paras: [
      'Starting online is the fastest way, the SSA says; your local office cannot print a card for you. If you need to visit, an appointment can shorten the wait. You can also call 1-800-772-1213.',
      'You may not need a new card at all: if you know your number, a physical card usually isn’t necessary.',
    ],
    sources: [S.ssa],
  },
  {
    slug: 'how-do-you-get-a-copy-of-your-birth-certificate',
    question: 'How do you get a copy of your birth certificate?',
    answer: 'From the vital records office of the state or territory where you were born. The federal government does not issue birth certificates.',
    paras: [
      'The CDC’s National Center for Health Statistics keeps a directory, Where to Write for Vital Records, that links to each state’s and territory’s office and its application guidelines. New York City has its own office, separate from the rest of New York State.',
      'The same directory covers death, marriage and divorce records, which are also held by the place where the event happened.',
    ],
    sources: [S.vital],
  },
  {
    slug: 'what-is-a-living-will',
    question: 'What is a living will?',
    answer: 'A legal document that tells doctors how you want to be treated if you can’t make your own decisions about emergency treatment.',
    paras: [
      'In it you can say which common medical treatments you would want, which you would want to avoid, and under which conditions each choice applies.',
      'It is one of the two most common advance directives; the other names a health care proxy. The National Institute on Aging suggests reviewing advance directives at least once a year and after major events such as retirement, a move to another state or a big change in your health.',
      'An advance directive is legally recognized but not legally binding: your provider and proxy will try to follow it, but may not be able to follow it exactly in every situation.',
    ],
    sources: [S.nia],
  },
  {
    slug: 'what-is-a-health-care-proxy',
    question: 'What is a health care proxy?',
    answer: 'The person you name to make health care decisions for you if you can’t communicate them yourself. You name them in a legal document called a durable power of attorney for health care.',
    paras: [
      'A proxy may also be called a representative, surrogate or agent, and should know your values and wishes.',
      'You can choose one in addition to a living will or instead of one. The National Institute on Aging says a proxy helps with situations no one can foresee, such as a serious car accident or a stroke.',
    ],
    sources: [S.nia],
  },
  {
    slug: 'what-happens-if-you-dont-have-an-advance-directive',
    question: 'What happens if you don’t have an advance directive?',
    answer: 'If you can’t make decisions yourself, your state’s laws decide who makes medical decisions for you, typically your spouse, your parents or your adult children.',
    paras: [
      'The National Institute on Aging notes that if you are unmarried and haven’t named your partner as your proxy, your partner could be left out of decisions.',
      'If you have no family, some states let a close friend who knows your values help, or a physician may be assigned. A state legal aid office or state bar association can tell you your state’s rules.',
    ],
    sources: [S.nia],
  },
].map(p => ({ modified: MODIFIED, topic: 'home', ...p }));
