// Learning FAQ pages (topic: learning) — reading research and checking what you
// read. Every claim is from the page linked in that entry's sources, read
// 2026-11-25.

const S = {
  trials: { label: 'What Are Clinical Trials and Studies? (National Institute on Aging)', url: 'https://www.nia.nih.gov/health/clinical-trials-and-studies/what-are-clinical-trials-and-studies' },
  reliable: { label: 'How To Find Reliable Health Information Online (National Institute on Aging)', url: 'https://www.nia.nih.gov/health/healthy-aging/how-find-reliable-health-information-online' },
  plain: { label: 'An introduction to plain language (Digital.gov, U.S. General Services Administration)', url: 'https://digital.gov/resources/an-introduction-to-plain-language' },
  pvalue: { label: '“P < 0.05” Might Not Mean What You Think: American Statistical Association Clarifies P Values (Journal of the National Cancer Institute, via PubMed Central)', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5017929/' },
  preprint: { label: 'NIH Preprint Pilot: What is a preprint? (National Library of Medicine)', url: 'https://pmc.ncbi.nlm.nih.gov/about/nihpreprints/' },
  errata: { label: 'Errata, Retractions, and Other Linked Citations in PubMed (National Library of Medicine)', url: 'https://www.nlm.nih.gov/bsd/policy/errata.html' },
};

const MODIFIED = '2026-11-25';

module.exports = [
  {
    slug: 'what-is-the-difference-between-an-observational-study-and-a-clinical-trial',
    question: 'What is the difference between an observational study and a clinical trial?',
    answer: 'An observational study watches people in their normal lives and compares changes over time. A clinical trial tests a treatment or other intervention in people.',
    paras: [
      'The National Institute on Aging’s example of an observational study: asking older adults about their exercise habits and giving them memory tests every month for a year, to see how activity is associated with memory. It doesn’t test a drug or device.',
      'Clinical trials are the main way researchers find out whether a new drug, diet or device is safe and effective in people, and often whether it works better or has fewer side effects than existing treatments.',
      'Observational studies can point to treatments worth testing; clinical trials are where they get tested.',
    ],
    sources: [S.trials],
  },
  {
    slug: 'what-are-the-phases-of-clinical-trials',
    question: 'What are the phases of clinical trials?',
    answer: 'Four. Phase 1 tests safety and dose in about 20 to 80 people, Phase 2 tests whether it works in about 100 to 300, Phase 3 confirms it in several hundred to a few thousand, and Phase 4 follows it after approval.',
    paras: [
      'The FDA typically requires Phases 1, 2 and 3 before it approves a drug or device. If the results support its use for a condition, the FDA approves it and keeps monitoring its effects.',
      'Phase 3 also compares the treatment with other drugs or approaches and studies different groups of people and doses. Phase 4 matters because some side effects don’t become clear until many more people have used a treatment for longer.',
      'Trials of behavior changes go through similar steps, but they aren’t regulated by the FDA.',
    ],
    sources: [S.trials],
  },
  {
    slug: 'how-do-you-know-if-health-information-online-is-reliable',
    question: 'How do you know if health information online is reliable?',
    answer: 'Ask who runs the site and why, who wrote and reviewed the information, and when it was last updated. The National Institute on Aging says federal government health sites are, as a rule, accurate sources.',
    paras: [
      'A site that is trying to sell you something may favor its own products. Ads should be clearly marked, and the NIA warns about ads designed to look like neutral health information.',
      'Look for named experts, sources and citations, contact details, and a date showing when the page was written or reviewed.',
      'Be cautious with testimonials, personal blogs and discussion boards. No online information, however good, replaces a health professional who can look at your own situation.',
    ],
    sources: [S.reliable],
  },
  {
    slug: 'what-do-gov-edu-org-and-com-mean-in-a-website-address',
    question: 'What do .gov, .edu, .org and .com mean in a website address?',
    answer: '.gov is a U.S. government agency, .edu an educational institution, .org usually a nonprofit, and .com a commercial site such as a business or drug company.',
    paras: [
      'The National Institute on Aging suggests using the address as one clue to who owns a site and why it exists.',
      'Many .com sites give accurate health information, it says, but it can be hard to tell that content apart from marketing. Check the “About Us” page to see who sponsors the site.',
    ],
    sources: [S.reliable],
  },
  {
    slug: 'what-is-plain-language',
    question: 'What is plain language?',
    answer: 'Communication your audience can understand the first time they read or hear it. For U.S. federal agencies it is also the law, under the Plain Writing Act of 2010.',
    paras: [
      'The Act defines plain writing as writing that is clear, concise, well-organized and follows best practices for the subject and the intended audience.',
      'Federal agencies must write clearly about benefits, services and how to comply with requirements, train staff in plain language, and keep a plain language section on their websites. The Act doesn’t cover the text of official regulations.',
      'Digital.gov notes that people usually search in everyday words, not jargon, which is one reason plain language works.',
    ],
    sources: [S.plain],
  },
  {
    slug: 'what-does-a-p-value-mean',
    question: 'What does a p-value mean?',
    answer: 'The probability, under a specified statistical model, that a summary of the data would be equal to or more extreme than what was actually observed. It is not the probability that a hypothesis is true.',
    paras: [
      'That is the definition from the American Statistical Association, which issued a statement in 2016 because p-values were so often misread.',
      'Common mistakes it addressed: a p-value above 0.05 doesn’t mean no effect was observed, and a “significant” result doesn’t mean the hypothesis being tested is false.',
    ],
    sources: [S.pvalue],
  },
  {
    slug: 'does-statistically-significant-mean-important',
    question: 'Does statistically significant mean important?',
    answer: 'No. A small effect can have a “significant” p-value and still be clinically or biologically unimportant, and a result is not true on one side of 0.05 and false on the other.',
    paras: [
      'The American Statistical Association’s 2016 statement warned that a conclusion doesn’t become true or false at a threshold. Treating it that way means real findings get dropped as “insignificant” and trivial ones get attention.',
      'The panel encouraged methods that estimate how big an effect is, such as confidence intervals, rather than only testing whether a result crosses a line.',
    ],
    sources: [S.pvalue],
  },
  {
    slug: 'what-is-a-preprint',
    question: 'What is a preprint?',
    answer: 'A complete, public draft of a scientific paper that has not yet been certified by peer review.',
    paras: [
      'Peer review is the key difference between a preprint and a published article, the National Library of Medicine says. Any part of a preprint, including the results and conclusions, may change after review.',
      'Many preprints are later submitted to journals, and authors may post updated versions in the meantime. Preprints let findings circulate sooner and invite feedback.',
    ],
    sources: [S.preprint],
  },
  {
    slug: 'how-do-you-know-if-a-study-has-been-retracted',
    question: 'How do you know if a study has been retracted?',
    answer: 'In PubMed, a retracted article is tagged as a Retracted Publication and its record says “Retraction in:” followed by the notice that retracted it.',
    paras: [
      'The retraction notice itself carries the phrase “Retraction of:” and links back to the original. The National Library of Medicine creates these links from what the journal publishes.',
      'Journals retract articles for pervasive error or for data that is unsubstantiated or can’t be reproduced. PubMed doesn’t say whether a retraction was for honest error or for misconduct.',
    ],
    sources: [S.errata],
  },
  {
    slug: 'what-is-an-erratum-on-a-research-paper',
    question: 'What is an erratum on a research paper?',
    answer: 'A published correction to an earlier article. The National Library of Medicine treats corrections, addenda and partial retractions, such as of a single graph or table, as errata.',
    paras: [
      'In PubMed, the original article’s record says “Erratum in:” and links to the correction, which says “Erratum for:”.',
      'The NLM doesn’t distinguish errors made in publishing from errors in the science itself, because journals don’t make that distinction consistently.',
    ],
    sources: [S.errata],
  },
].map(p => ({ modified: MODIFIED, topic: 'learning', ...p }));
