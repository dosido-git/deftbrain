// Decisions FAQ pages (topic: decisions) — how people choose. Every claim is
// from the APA Dictionary of Psychology entry linked in that page's sources.
const { apa } = require('./apa');

const MODIFIED = '2026-11-25';

module.exports = [
  {
    slug: 'what-does-satisficing-mean',
    question: 'What does satisficing mean?',
    answer: 'Choosing an option that meets what the situation needs, even if it may not be the best possible choice in the abstract. The word blends “satisfy” and “suffice.”',
    paras: [
      'It was coined by Herbert A. Simon. In economics, the idea is that people with limited time and information aim for an outcome that is satisfactory rather than optimal.',
      'Satisficing is not settling for something bad: the option still has to meet your requirements. It stops the search once one does.',
    ],
    sources: [apa('satisfice')],
  },
  {
    slug: 'what-is-the-difference-between-a-maximizer-and-a-satisficer',
    question: 'What is the difference between a maximizer and a satisficer?',
    answer: 'A maximizer wants to make the very best choice; a satisficer is happy with a good-enough one. The terms were defined in 2002 by psychologist Barry Schwartz.',
    paras: [
      'The APA Dictionary’s example: in a grocery store, a maximizer carefully examines every cereal before buying one, while a satisficer buys the first reasonably priced box they see.',
      'Maximizers are generally considered more prone than satisficers to regret, including buyer’s remorse.',
    ],
    sources: [apa('maximizer'), apa('satisficer')],
  },
  {
    slug: 'what-is-the-planning-fallacy',
    question: 'What is the planning fallacy?',
    answer: 'The tendency to underestimate how long a future task will take, partly because people rely on overly optimistic pictures of how it will go.',
    paras: [
      'It was identified by psychologists Amos Tversky and Daniel Kahneman.',
      'Because the optimism is built into the plan itself, it helps to test a plan against what could go wrong before you commit to its timeline.',
    ],
    sources: [apa('planning-fallacy')],
  },
  {
    slug: 'what-is-anchoring-bias',
    question: 'What is anchoring bias?',
    answer: 'Giving too much weight to a starting value, such as the first number you hear or your first guess, and not adjusting enough when later information arrives.',
    paras: [
      'The APA Dictionary’s example: people asked to estimate 9 × 8 × 7 × 6 × 5 × 4 × 3 × 2 × 1 give higher answers than people asked to estimate 1 × 2 × 3 × 4 × 5 × 6 × 7 × 8 × 9, though the two are the same.',
      'It is also called the anchoring effect or the anchoring-and-adjustment heuristic, and shows up when people judge quantities under uncertainty.',
    ],
    sources: [apa('anchoring-bias')],
  },
  {
    slug: 'what-is-the-framing-effect',
    question: 'What is the framing effect?',
    answer: 'How the way a question or problem is presented influences how people see and judge it.',
    paras: [
      'The APA Dictionary defines framing as setting up the context or issues around a question in a way that shapes how they are perceived and evaluated, and notes it is also called the framing effect.',
      'Reframing, describing the same choice another way, is one way to check whether the frame rather than the facts is driving a decision.',
    ],
    sources: [apa('framing')],
  },
  {
    slug: 'what-is-loss-aversion',
    question: 'What is loss aversion?',
    answer: 'The tendency to be more strongly motivated by the fear of a loss than by the prospect of an equal gain. Prospect theory describes it.',
    paras: [
      'Prospect theory, formulated by Daniel Kahneman and Amos Tversky, explains how attitudes toward risk, uncertainty, loss and gain shape decisions.',
      'It also holds that people are systematically poor at evaluating probabilities, which adds to the pull of avoiding losses.',
    ],
    sources: [apa('prospect-theory')],
  },
  {
    slug: 'what-is-the-endowment-effect',
    question: 'What is the endowment effect?',
    answer: 'Valuing something more once you own it. Sellers often price an item above what they would pay to buy the same item.',
    paras: [
      'The term was coined in 1980 by economist Richard Thaler. The APA Dictionary notes the effect comes with more positive feelings toward the object.',
      'It can make keeping what you have feel better than it is, which is worth knowing when you are weighing whether to sell, switch or let something go.',
    ],
    sources: [apa('endowment-effect')],
  },
  {
    slug: 'how-does-fear-of-regret-affect-decisions',
    question: 'How does fear of regret affect decisions?',
    answer: 'Strongly, according to regret theory: fear of regretting a poor choice, and past experience of regret, play a large role in what people do when the outcome is uncertain.',
    paras: [
      'Anticipatory regret is imagining how bad a choice could feel afterwards, which can change the choice; for example, passing on an investment because of how an imagined loss would feel.',
      'Regret theory, proposed in 1982 by economists Graham Loomes and Robert Sugden, describes two parts of regret: wishing you had chosen differently, and blaming yourself for misjudging.',
    ],
    sources: [apa('regret-theory'), apa('anticipatory-regret')],
  },
  {
    slug: 'what-is-omission-bias',
    question: 'What is omission bias?',
    answer: 'Judging harm caused by doing something as worse than equal harm caused by doing nothing.',
    paras: [
      'The APA Dictionary’s examples include patients putting off checkups for fear of what might be found, and parents avoiding vaccination out of concern about side effects.',
      'In each case, not acting can have serious consequences that acting could have avoided, so “doing nothing” is still a choice with its own risks.',
    ],
    sources: [apa('omission-bias')],
  },
  {
    slug: 'what-is-groupthink',
    question: 'What is groupthink?',
    answer: 'A strong pull toward agreement in a group that gets in the way of good decisions. The idea comes from psychologist Irving Janis.',
    paras: [
      'Signs include apparent unanimity, a sense that the group can’t be wrong, pressure on doubters, self-censorship and poor decision methods.',
      'The causes are thought to include a tight-knit or isolated group, poor leadership and the stress of making the decision.',
    ],
    sources: [apa('groupthink')],
  },
].map(p => ({ modified: MODIFIED, topic: 'decisions', ...p }));
