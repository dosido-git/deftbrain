// Career and Business FAQ pages (topic: career) — US federal workplace rules.
// Every claim is from the page linked in that entry's sources, read 2026-11-25.
// Federal law sets a floor; pages say so where state law can add to it.

const S = {
  lastPay: { label: 'Last Paycheck (U.S. Department of Labor)', url: 'https://www.dol.gov/general/topic/wages/lastpaycheck' },
  vacation: { label: 'Vacation Leave (U.S. Department of Labor)', url: 'https://www.dol.gov/general/topic/workhours/vacation_leave' },
  fullTime: { label: 'Full-Time Employment (U.S. Department of Labor)', url: 'https://www.dol.gov/general/topic/workhours/full-time' },
  breaks: { label: 'Breaks and Meal Periods (U.S. Department of Labor)', url: 'https://www.dol.gov/general/topic/workhours/breaks' },
  exempt: { label: 'Fact Sheet #17A: Exemption for Executive, Administrative, Professional, Computer & Outside Sales Employees (U.S. Department of Labor)', url: 'https://www.dol.gov/agencies/whd/fact-sheets/17a-overtime' },
  nlrb: { label: 'Your Right to Discuss Wages (National Labor Relations Board)', url: 'https://www.nlrb.gov/about-nlrb/rights-we-protect/your-rights/your-rights-to-discuss-wages' },
  eeoc: { label: 'Prohibited Employment Policies/Practices (U.S. Equal Employment Opportunity Commission)', url: 'https://www.eeoc.gov/prohibited-employment-policiespractices' },
};

const MODIFIED = '2026-11-25';

module.exports = [
  {
    slug: 'when-do-you-get-your-final-paycheck',
    question: 'When do you get your final paycheck?',
    answer: 'Federal law does not require your employer to pay you immediately when you leave. Some states do require immediate payment.',
    paras: [
      'If the regular payday for your last pay period has passed and you haven’t been paid, the U.S. Department of Labor says to contact its Wage and Hour Division or your state labor department.',
      'Because the deadline is set by state law, your state labor department is the place to check how soon your final pay is due.',
    ],
    sources: [S.lastPay],
  },
  {
    slug: 'do-you-get-paid-for-unused-vacation-when-you-leave-a-job',
    question: 'Do you get paid for unused vacation when you leave a job?',
    answer: 'Federal law doesn’t require it. Under the Fair Labor Standards Act, vacation pay is a matter of agreement between you and your employer.',
    paras: [
      'The FLSA doesn’t require payment for time not worked at all: vacations, sick leave and holidays are all left to the employer’s policy or your contract.',
      'Look at your employee handbook or contract for what your employer promised, and at your state labor department for any state rule.',
    ],
    sources: [S.vacation],
  },
  {
    slug: 'do-employers-have-to-give-paid-holidays',
    question: 'Do employers have to give paid holidays?',
    answer: 'Not under federal law. The Fair Labor Standards Act doesn’t require pay for federal or other holidays, or for vacations or sick leave.',
    paras: [
      'The Department of Labor says these benefits are matters of agreement between an employer and an employee or the employee’s representative.',
      'Some federal service and construction contracts are an exception: their wage determinations can require holiday or vacation benefits for covered workers.',
    ],
    sources: [S.vacation],
  },
  {
    slug: 'how-many-hours-is-full-time',
    question: 'How many hours is full time?',
    answer: 'There is no federal definition. The Fair Labor Standards Act does not define full-time or part-time work; it is generally up to the employer.',
    paras: [
      'Being called full-time or part-time doesn’t change how the FLSA applies to you, including its minimum wage and overtime rules.',
    ],
    sources: [S.fullTime],
  },
  {
    slug: 'are-breaks-required-at-work',
    question: 'Are breaks required at work?',
    answer: 'Not by federal law. But when an employer does offer short breaks, usually about 5 to 20 minutes, federal law counts them as paid work time.',
    paras: [
      'Those short breaks also count toward your weekly hours when working out whether you worked overtime.',
      'An employer can refuse to pay for a break you stretch past the allowed time, but only if it has clearly told you how long the break is, that going over breaks its rules, and that going over will be punished.',
      'For any rules your state adds, check your state labor department.',
    ],
    sources: [S.breaks],
  },
  {
    slug: 'do-you-get-paid-for-your-lunch-break',
    question: 'Do you get paid for your lunch break?',
    answer: 'Usually not. Under federal law, meal periods, typically at least 30 minutes, are not work time and don’t have to be paid.',
    paras: [
      'Short breaks of about 5 to 20 minutes are different: when an employer offers them, they count as paid hours worked.',
      'Federal law doesn’t require either kind of break. For any rules your state adds, check your state labor department.',
    ],
    sources: [S.breaks],
  },
  {
    slug: 'do-salaried-employees-get-overtime',
    question: 'Do salaried employees get overtime?',
    answer: 'Some do. Being paid a salary doesn’t by itself make you exempt from overtime. Your job duties have to meet federal tests too, and the salary has to be at least $684 a week.',
    paras: [
      'Most employees must get overtime at time and a half for hours over 40 in a workweek. The exemptions cover bona fide executive, administrative, professional, computer and outside sales employees.',
      'Job titles don’t decide it, the Department of Labor says: your specific duties and your salary must meet all the requirements. An executive, for example, must manage the business or a department and regularly direct at least two full-time employees.',
    ],
    sources: [S.exempt],
  },
  {
    slug: 'is-it-illegal-to-discuss-pay-with-coworkers',
    question: 'Is it illegal to discuss pay with coworkers?',
    answer: 'No. Under the National Labor Relations Act, covered employees have the right to talk about their pay with each other, whether or not they have a union.',
    paras: [
      'The National Labor Relations Board says rules that ban pay discussions, or require permission for them, are unlawful, and so is punishing, threatening or questioning you about such a conversation.',
      'You can talk about pay off work, on a break, and during work if other non-work conversations are allowed. You also have the right not to discuss your pay.',
      'If you think an employer is interfering with that right, you can contact an NLRB regional office about filing a charge.',
    ],
    sources: [S.nlrb],
  },
  {
    slug: 'can-an-employer-ask-your-age-in-an-interview',
    question: 'Can an employer ask your age in an interview?',
    answer: 'Federal law doesn’t clearly forbid the question, but the EEOC says employers should generally avoid it, because it can be used as evidence of age discrimination.',
    paras: [
      'The EEOC’s general rule is that hiring questions should be limited to what is essential to decide whether you are qualified. Race, sex, national origin, age and religion are irrelevant to that.',
      'It is illegal to base hiring and other job decisions on age for people 40 or older. The EEOC also says employers shouldn’t ask for a photograph before an offer is made and accepted.',
    ],
    sources: [S.eeoc],
  },
  {
    slug: 'can-an-employer-ask-about-a-disability-in-an-interview',
    question: 'Can an employer ask about a disability in an interview?',
    answer: 'No. The EEOC says employers are explicitly prohibited from asking about disability before making a job offer.',
    paras: [
      'This is stricter than the rule for other characteristics. Questions that could reveal race, sex, age, religion or national origin are not clearly banned, but the EEOC says they should generally be avoided.',
      'Its general rule is that questions before hiring should be limited to what is essential to decide whether a person is qualified for the job.',
    ],
    sources: [S.eeoc],
  },
].map(p => ({ modified: MODIFIED, topic: 'career', ...p }));
