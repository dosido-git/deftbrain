// Ideas & Diversions FAQ pages (topic: ideas) — how minds play tricks. Every
// claim is from the APA Dictionary of Psychology entry linked in that page's
// sources.
const { apa } = require('./apa');

const MODIFIED = '2026-11-25';

module.exports = [
  {
    slug: 'why-cant-i-think-of-a-word-i-know',
    question: 'Why can’t I think of a word I know?',
    answer: 'It is the tip-of-the-tongue phenomenon: trying to recall a specific word or name and not being able to, while it seems to hover just out of reach. Usually the word does come back.',
    paras: [
      'Psychologists call it a retrieval block: a brief inability to recall something, with the feeling that something is in the way.',
      'The sense that you do know the word is real and has a name too, the feeling of knowing. The APA Dictionary calls the tip-of-the-tongue state the classic case of it.',
    ],
    sources: [apa('tip-of-the-tongue-phenomenon'), apa('retrieval-block'), apa('feeling-of-knowing')],
  },
  {
    slug: 'what-is-cognitive-dissonance',
    question: 'What is cognitive dissonance?',
    answer: 'The unpleasant state of holding two or more beliefs, attitudes or ideas that don’t fit together. It creates a drive to reduce the conflict.',
    paras: [
      'It was first described by psychologist Leon Festinger. The APA Dictionary compares the drive to reduce dissonance to physical drives such as hunger.',
      'People reduce it by making the clashing ideas consistent, by deciding one of them matters less, or by adding new ideas that fit. Affirming something you value about yourself, even if unrelated, can also ease it.',
    ],
    sources: [apa('cognitive-dissonance'), apa('dissonance-reduction')],
  },
  {
    slug: 'what-is-confirmation-bias',
    question: 'What is confirmation bias?',
    answer: 'The tendency to gather evidence that confirms what you already expect, by focusing on supporting evidence and dismissing or not looking for evidence against it.',
    paras: [
      'Because it works through what you search for as well as how you read it, one check is to look deliberately for the strongest case against your view.',
    ],
    sources: [apa('confirmation-bias')],
  },
  {
    slug: 'why-do-people-keep-believing-something-after-its-been-disproven',
    question: 'Why do people keep believing something after it’s been disproven?',
    answer: 'Psychologists call it belief perseverance: the tendency to hold on to a belief even after the information that created it has been shown to be wrong.',
    paras: [
      'It is related to confirmation bias, the habit of seeking evidence that supports what you already think and dismissing evidence against it.',
    ],
    sources: [apa('belief-perseverance'), apa('confirmation-bias')],
  },
  {
    slug: 'why-does-it-feel-like-i-knew-it-all-along',
    question: 'Why does it feel like I knew it all along?',
    answer: 'That is hindsight bias: after something happens, overestimating how predictable it was.',
    paras: [
      'The APA Dictionary gives three causes: people selectively remember what fits the outcome they now know, mistake how easy the outcome is to understand for how likely it was, and want the world to seem orderly and predictable.',
    ],
    sources: [apa('hindsight-bias')],
  },
  {
    slug: 'what-is-counterfactual-thinking',
    question: 'What is counterfactual thinking?',
    answer: 'Imagining how events might have turned out differently. It often brings regret (“if only I hadn’t been so hasty”), but it can also bring relief, as after a narrow escape.',
    paras: [
      'The term also covers “what if” reasoning about things known to be untrue or impossible, as in historical speculation such as “if this battle had gone the other way…”.',
      'The APA Dictionary notes that this kind of reasoning can be useful in thought experiments and in testing what a theory implies.',
    ],
    sources: [apa('counterfactual-thinking')],
  },
  {
    slug: 'what-is-the-gamblers-fallacy',
    question: 'What is the gambler’s fallacy?',
    answer: 'Believing that past results of a chance event change the odds of the next one. After several heads in a row, tails is still exactly 50% on the next toss.',
    paras: [
      'The mistake is not recognizing that chance events are independent: each coin toss has no memory of the last.',
    ],
    sources: [apa('gamblers-fallacy')],
  },
  {
    slug: 'what-is-the-availability-heuristic',
    question: 'What is the availability heuristic?',
    answer: 'Judging how likely something is by how easily examples come to mind. It can mislead when some events are much more memorable than others.',
    paras: [
      'The APA Dictionary’s example: heavy coverage of plane crashes can make them seem more likely than they are, while less-publicized causes of death, such as diabetes, can seem less likely than they are.',
      'It was described in 1973 by Amos Tversky and Daniel Kahneman.',
    ],
    sources: [apa('availability-heuristic')],
  },
  {
    slug: 'what-is-an-illusory-correlation',
    question: 'What is an illusory correlation?',
    answer: 'Seeing a relationship between two things that doesn’t exist, or overestimating how strongly they are related.',
    paras: [
      'The APA Dictionary’s example: if something unusual happens while a teenager is in a group of adults, assuming the teenager did it.',
    ],
    sources: [apa('illusory-correlation')],
  },
  {
    slug: 'what-is-the-false-consensus-effect',
    question: 'What is the false consensus effect?',
    answer: 'Assuming your own opinions, beliefs or habits are more widely shared than they really are.',
    paras: [
      'The APA Dictionary calls it robustly demonstrated, and links it to wanting to see your own thoughts and actions as normal and correct.',
      'The APA Dictionary contrasts it with the false-uniqueness effect.',
    ],
    sources: [apa('false-consensus-effect')],
  },
].map(p => ({ modified: MODIFIED, topic: 'ideas', ...p }));
