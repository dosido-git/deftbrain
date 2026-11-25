// Health & Wellness FAQ pages (topic: health). Every claim is from the page
// linked in that entry's sources, read 2026-11-25. Health pages state what the
// source says and who said it; none gives a diagnosis or a treatment choice.

const S = {
  nia: { label: 'How To Prepare for a Doctor’s Appointment (National Institute on Aging)', url: 'https://www.nia.nih.gov/health/medical-care-and-appointments/how-prepare-doctors-appointment' },
  labs: { label: 'How to Understand Your Lab Results (MedlinePlus, National Library of Medicine)', url: 'https://medlineplus.gov/lab-tests/how-to-understand-your-lab-results/' },
  medicare2nd: { label: 'Second surgical opinions (Medicare.gov)', url: 'https://www.medicare.gov/coverage/second-surgical-opinions' },
  samhsa988: { label: '988 Frequently Asked Questions (SAMHSA)', url: 'https://www.samhsa.gov/mental-health/988/faqs' },
  pgd: { label: 'Prolonged Grief Disorder (American Psychiatric Association)', url: 'https://www.psychiatry.org/patients-families/prolonged-grief-disorder/' },
  cdcSleep: { label: 'About Sleep (Centers for Disease Control and Prevention)', url: 'https://www.cdc.gov/sleep/about/index.html' },
  nami: { label: 'Types of Mental Health Professionals (National Alliance on Mental Illness)', url: 'https://www.nami.org/treatments-and-approaches/types-of-mental-health-professionals/' },
};

const MODIFIED = '2026-11-25';

module.exports = [
  {
    slug: 'how-do-i-prepare-for-a-doctors-appointment',
    question: 'How do I prepare for a doctor’s appointment?',
    answer: 'Make a list of what you want to discuss, put the most important things first, and bring your medicines (or a list of them), your insurance cards and the names of your other doctors.',
    paras: [
      'The National Institute on Aging suggests raising what is really on your mind right away rather than leaving it for the end of the appointment.',
      'Some doctors ask you to bring all your prescription drugs, over-the-counter medicines, vitamins and supplements in a bag; others prefer a list of everything you take and the dose.',
      'Tell the doctor what has changed since your last visit: emergency room or specialist visits, changes in appetite, weight, sleep or energy, and any change in your medicines or their effects.',
      'If you need an interpreter, call the office ahead of time so it can arrange one.',
    ],
    sources: [S.nia],
  },
  {
    slug: 'should-i-bring-someone-to-my-doctors-appointment',
    question: 'Should I bring someone to my doctor’s appointment?',
    answer: 'It can help. A family member or friend can remind you what you meant to ask, take notes and help you remember what the doctor said.',
    paras: [
      'The National Institute on Aging suggests telling your companion in advance what you want from the visit and how they can be most helpful.',
      'It also says not to let them take too strong a role: the visit is between you and the doctor. You can ask them to wait outside for part of the appointment if you want to raise something privately.',
    ],
    sources: [S.nia],
  },
  {
    slug: 'what-does-it-mean-if-lab-results-are-out-of-range',
    question: 'What does it mean if lab results are out of range?',
    answer: 'Not necessarily that something is wrong. MedlinePlus says it is common for healthy people to sometimes have results outside the reference range.',
    paras: [
      'A reference range is the span of results considered normal, based on test results from large groups of healthy people. A result above or below the range that applies to you may or may not be a sign of a health problem.',
      'The reverse also holds: a result inside the range is not a guarantee of good health, and you may still need more testing if you have symptoms.',
      'Your provider reads results alongside your physical exam, your health history and any other tests, which is why MedlinePlus says to talk with them about what your results mean for you.',
    ],
    sources: [S.labs],
  },
  {
    slug: 'can-you-compare-lab-results-from-different-labs',
    question: 'Can you compare lab results from different labs?',
    answer: 'Not reliably. Labs often use different testing methods and different reference ranges, so MedlinePlus says you can’t compare results from different labs.',
    paras: [
      'Check your result against the reference range printed on your own lab report, not one you find elsewhere.',
      'If you are watching a result change over time, MedlinePlus suggests using the same lab each time. Results can also be reported in different units, such as micrograms per deciliter or micromoles per liter.',
    ],
    sources: [S.labs],
  },
  {
    slug: 'does-medicare-cover-a-second-opinion',
    question: 'Does Medicare cover a second opinion?',
    answer: 'Yes, in some cases. Medicare Part B covers a second opinion for medically necessary surgery that is not an emergency, and a third opinion if the first two differ.',
    paras: [
      'After you meet the Part B deductible, you pay 20% of the Medicare-approved amount for the second opinion, and the same for a third.',
      'If the second doctor asks for more tests, Medicare covers them as it covers other medically necessary services. What you owe depends on things such as other insurance, what the doctor charges and whether the doctor accepts assignment.',
    ],
    sources: [S.medicare2nd],
  },
  {
    slug: 'what-happens-when-you-call-988',
    question: 'What happens when you call 988?',
    answer: 'You hear a short greeting and menu, then a trained crisis counselor answers. They ask about your safety, listen, and share resources that may help.',
    paras: [
      'The menu offers counselors for veterans and service members, and for Spanish speakers. If you choose neither, you are connected to a local crisis center based on your approximate location or area code. You can skip the menu by dialing zero.',
      'SAMHSA says the average wait after the menu is typically under a minute, and if your local center cannot answer, the call goes to a national backup center. Interpreters are available in more than 240 languages.',
      '988 does not require payment or insurance information, and you can call, text or chat about someone else you are worried about.',
    ],
    sources: [S.samhsa988],
  },
  {
    slug: 'will-police-come-if-you-call-988',
    question: 'Will police come if you call 988?',
    answer: 'Usually not. SAMHSA says most crises are handled by the counselor with you, without law enforcement, unless there is an immediate threat to someone’s physical safety.',
    paras: [
      'If you or the person you are calling about is in physical danger, the counselor will contact 911. SAMHSA gives examples such as a suicide attempt in progress or a suspected overdose.',
      'The counselor knows your phone number, or your IP address if you use chat, but not who you are or where you are. You do not have to give personal information to get support.',
      'SAMHSA says most people’s needs are resolved during the call, text or chat itself.',
    ],
    sources: [S.samhsa988],
  },
  {
    slug: 'how-long-is-too-long-to-grieve',
    question: 'How long is too long to grieve?',
    answer: 'For most people, grief eases over time. The diagnosis of prolonged grief disorder applies only when intense grief causes real distress or trouble with daily life at least a year after the loss, for adults.',
    paras: [
      'The American Psychiatric Association says that for the diagnosis, at least three symptoms must occur nearly every day for at least the last month. They include intense emotional pain, feeling that part of oneself has died, emotional numbness and intense loneliness.',
      'The grief also has to last longer than might be expected under the person’s social, cultural or religious norms. For children and adolescents the loss must be at least six months past.',
      'The APA estimates that 4% to 15% of bereaved adults develop prolonged grief disorder.',
    ],
    sources: [S.pgd],
  },
  {
    slug: 'how-much-sleep-do-adults-need',
    question: 'How much sleep do adults need?',
    answer: 'The CDC recommends 7 or more hours a night for adults aged 18 to 60, 7 to 9 hours from 61 to 64, and 7 to 8 hours at 65 and older.',
    paras: [
      'Quality matters as well as hours. The CDC lists trouble falling asleep, waking repeatedly at night and feeling tired after enough sleep as signs of poor sleep quality.',
      'Habits it suggests: the same bedtime and wake time every day, a quiet, cool bedroom, screens off at least 30 minutes before bed, and no caffeine in the afternoon or evening.',
    ],
    sources: [S.cdcSleep],
  },
  {
    slug: 'what-is-the-difference-between-a-psychologist-and-a-psychiatrist',
    question: 'What is the difference between a psychologist and a psychiatrist?',
    answer: 'A psychiatrist is a medical doctor who can diagnose, provide therapy and prescribe medication. A psychologist holds a doctorate in psychology and diagnoses and provides therapy.',
    paras: [
      'According to the National Alliance on Mental Illness, psychologists hold a Ph.D. or Psy.D., are licensed by each state, and are trained to evaluate mental health through interviews, evaluations and testing.',
      'Psychiatrists hold an MD or DO and have completed a residency in psychiatry. NAMI lists them, psychiatric nurse practitioners (in some states) and primary care doctors among the professionals who prescribe.',
      'Counselors, therapists and clinical social workers usually hold a master’s degree and provide therapy. Job titles and requirements vary by state.',
    ],
    sources: [S.nami],
  },
].map(p => ({ modified: MODIFIED, topic: 'health', ...p }));
