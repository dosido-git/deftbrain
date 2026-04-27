// ============================================================
// guide-specs/planning/how-to-know-if-your-business-idea-is-actually-going-to-work.js
// ============================================================

module.exports = {
  slug:          'how-to-know-if-your-business-idea-is-actually-going-to-work',
  category:      'planning',
  categoryLabel: 'Planning',

  title:         "How to Know if Your Business Idea Is Actually Going to Work",
  titleHtml:     "How to Know if Your Business Idea <em>Is Actually Going to Work</em>",
  shortTitle:    "Know if Your Business Idea Will Work",
  navTitle:      "How to know if your business idea is actually going to work",

  description:   "You can't know with certainty before you start. You can know whether the question itself is the right one, what assumptions you're making, and what would change your mind. Five steps for an honest read.",
  deck:          "You can't know with certainty before you start. You can know whether the question itself is the right one, what assumptions you're making, and what would change your mind. Five steps for an honest read.",

  published:     '2026-04-25',
  modified:      '2026-04-25',

  ledes: [
    `You have an idea. You've been turning it over for weeks or months. The basics check out — there's a real problem, you have a plausible angle, you can imagine someone paying for it — and now you're at the question that always blocks the next move: is this actually going to work? You want a clear answer before you spend serious time, money, or reputation on it. The honest news is that no method gives you that answer, and any method that claims to is selling you something.`,
    `What's available is something more useful than a yes/no: a structured read on whether the question itself is well-formed, what you're implicitly betting on, what would change your mind, and what the cheapest version of a real test looks like. Pre-mortem-style thinking — assuming you tried this and failed, then explaining why — surfaces this faster than most other planning techniques. The five steps below walk through what to ask and how to interpret the answers.`,
  ],

  steps: [
    {
      name: "Define what 'work' actually means — concretely",
      body: "The single most underdone step in evaluating business ideas is defining what success looks like in concrete terms. Most people answer 'will this work' without having specified what working means. Does it mean replacing your salary? Generating $X in revenue? Reaching Y users? Building something you can sell in five years? Becoming the dominant player in the category? Each of these is a different bar, and the same idea might be a strong yes for one and a clear no for another. Before evaluating viability, write down what working means in numbers and timeline. 'Profitable side income of $3K/month within 18 months' is a definition. 'A successful business' is not. The exercise of being specific often reveals that what you actually want is different from what you thought you wanted, which can change which ideas are worth pursuing.",
    },
    {
      name: "Find the five ways smart people would say no",
      body: "If you presented this idea to five thoughtful people who weren't trying to be encouraging, what would their objections be? Brainstorm them on paper. The categories typically include: market objections (the demand isn't really there, the timing is wrong, the segment is too small), competitive objections (someone bigger will do this, an incumbent already does it well enough), execution objections (you don't have the skills, the distribution channel, the capital), and economic objections (the unit economics don't work, customer acquisition cost will be too high, retention is structurally weak). Write each objection as a steelman — the strongest version of the case against, not the weakest. The list usually contains two or three that you have good answers for, two or three that you have okay answers for, and one or two that genuinely concern you. Those last ones are the real risks. The exercise tells you what you're betting on by showing you what you're choosing not to worry about.",
    },
    {
      name: "Stress-test the assumptions you can't easily test in advance",
      body: "Some assumptions can be tested cheaply: whether people will click on an ad describing your product, whether anyone will pay $20 to access an early prototype, whether a landing page generates email signups. Others can't be tested without committing real resources: whether customers who try it will keep using it, whether you can build the product at the cost you're projecting, whether the channel you're betting on will scale. The first category should be tested before commitment; the second category has to be evaluated through reasoning rather than measurement. For each untestable assumption, ask: what's my evidence that this is true? Is it based on similar businesses succeeding (which?), on a structural argument about the market (what's the argument?), on direct conversations with potential customers (how many, how predictive?), or on optimism alone? Assumptions that rely on optimism are the riskiest, and they're the ones most likely to break in ways the plan won't survive.",
    },
    {
      name: "Identify the smallest experiment that could change your mind",
      body: "The most useful question in evaluating a business idea is often: what's the smallest experiment that would change my conclusion? If you'd be willing to commit fully if 100 people pre-paid $50 for early access, that's the experiment. If you'd be willing to commit if a paid ad campaign generated leads at under $30 each, that's the experiment. If you'd be willing to commit if 20 customer conversations produced a specific pattern, that's the experiment. The discipline of naming the experiment in advance protects against two failure modes: deciding mid-experiment to lower the bar because the result was disappointing, and refusing to commit even when the experiment came back positive because new doubts emerged. Set the bar before the test. The size of the experiment should match the size of the commitment — small experiments before small commitments, larger before larger — but the specificity has to be there in either case. 'Talking to a few customers' isn't an experiment; 'twenty customer conversations using the same script, looking for a specific pattern' is.",
    },
    {
      name: "Know when 'is this going to work' is the wrong question",
      body: "Sometimes the most honest read on a business idea is that 'will this work' is the wrong question to be asking. Three patterns that signal this. First: you're financially or psychologically committed to the idea regardless of the answer, so 'will this work' is decorative — you're going to try it either way, which means the useful questions are about how to fail well rather than whether to start. Second: the answer changes nothing, because the upside of the idea working is small and the downside of not trying is large — you'd regret not having tried more than you'd lose by trying, in which case skip the analysis and start. Third: the idea is partly an emotional or identity project rather than a pure business one — you want to be a person who runs this kind of business, which is a real reason to do it but doesn't respond to viability analysis. In each of these cases, the analysis paralysis the 'will this work' question produces is the actual cost. The harder question to ask is: 'would I be okay if it doesn't work — and if yes, what's stopping me from starting?' The answer often reveals that the planning has been substituting for the start.",
    },
  ],

  callout: {
    afterStep: 1,
    scriptedLine: "Working = $3K/month in profit within 18 months, while keeping my day job. If at month 18 I'm at $1K/month, I shut it down. If I'm at $3K, I keep going. If I'm at $6K, I quit my job and go full-time.",
    explanation: "This is what 'define success concretely' looks like in practice. Specific number, specific timeline, specific decision points at different outcomes. Compare to the unspecific version — 'I want this to be a successful side business' — which can't generate any decisions because it can't distinguish between outcomes. Concrete success criteria turn the question 'will this work' into questions you can actually answer with evidence.",
  },

  cta: {
    glyph:    '💀',
    headline: "Run the pre-mortem on your business idea before you start",
    body:     "Pre-Mortem takes your idea — startup, side business, career move — and produces the failure memo from 18 months in the future. The Fatal Assumption surfaces the single belief most likely to kill it. The Assumptions Autopsy becomes your pre-launch checklist. The technique used by NASA, military planners, and venture investors, applied in minutes.",
    features: [
      "Failure memo from your future self — specific failure narrative, not abstract risks",
      "Fatal Assumption — the single belief most likely to kill the idea",
      "Failure modes ranked by probability — focus stress-testing on what matters",
      "Warning signs you'll ignore — the early indicators most founders miss",
      "Plan-type tuning — startup, side business, career move, partnership each get different analysis",
    ],
    toolId:   'PreMortem',
    toolName: 'Pre-Mortem',
  },
};
