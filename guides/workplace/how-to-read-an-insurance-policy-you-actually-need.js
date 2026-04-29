// ============================================================
// guides/workplace/how-to-read-an-insurance-policy-you-actually-need.js
// ============================================================

module.exports = {
  slug:          'how-to-read-an-insurance-policy-you-actually-need',
  category:      'workplace',
  categoryLabel: 'Workplace',

  title:         "How to Read an Insurance Policy You Actually Need",
  titleHtml:     "How to Read an Insurance Policy <em>You Actually Need</em>",
  shortTitle:    "How to Read an Insurance Policy",
  navTitle:      "How to read an insurance policy you actually need to understand",

  description:   "The policy is sixty pages. The claim is what you'll care about. Here's how to read auto, home, or renters insurance so you know what you're covered for — before you need it.",
  deck:          "The policy is sixty pages. The claim is what you'll care about. Here's how to read auto, home, or renters insurance so you know what you're covered for — before you need it.",

  published:     '2026-04-28',
  modified:      '2026-04-28',

  ledes: [
    `Your insurance policy arrived as a PDF six months ago. It's sixty-four pages, divided into sections labeled with words like 'declarations,' 'endorsements,' and 'exclusions.' You filed it in a folder called 'Important.' You'll open it for the first time the day you have to file a claim — which is exactly the worst day to discover that something you assumed was covered, isn't. Insurance is one of the few documents where the cost of not reading it is paid in full at the moment you most need it.`,
    `You don't have to read all sixty-four pages. Five sections matter; the rest is boilerplate. Read those five once now, before anything happens, and you'll know what you actually have. Here are the five.`,
  ],

  steps: [
    {
      name: "Read the declarations page first",
      body: "The 'dec page' is the one-page summary at the front of the policy. It lists what's insured, the dollar limits, your deductible, and your premium. This is the policy in shorthand — everything else is the rules that govern what's on this page. If you only read one page, read this one. And if anything on it surprises you — a coverage you thought you had, a limit lower than you remember — that's the conversation to have with your agent before you need it.",
    },
    {
      name: "Find the deductible and the out-of-pocket maximum",
      body: "Deductible is what you pay before the insurer pays anything. The out-of-pocket max — sometimes called the policy limit on the other end — is the most they'll ever pay on a claim. Both numbers matter. A low premium with a high deductible can mean you're effectively self-insuring small claims; a low policy limit can mean a serious loss isn't fully covered. Know both numbers cold. They define your real exposure.",
    },
    {
      name: "Read the exclusions before the coverage",
      body: "Insurance documents start by telling you what's covered, in flattering language. Then, twenty pages later, a section called 'Exclusions' or 'What This Policy Does Not Cover' takes most of it back. Read the exclusions first. That's the truth about your policy. Common surprises: floods aren't covered by standard homeowners; earth movement is excluded; 'wear and tear' is excluded; and many policies exclude damage from things you'd consider obvious — backed-up sewers, mold, certain dog breeds, business equipment.",
    },
    {
      name: "Distinguish 'named perils' from 'all perils'",
      body: "Policies are written one of two ways. A named-perils policy covers only the specific events listed — fire, theft, hail, and so on. If the bad thing that happens isn't named, it isn't covered. An all-perils policy covers everything except what's specifically excluded — the broader, more expensive form. Cheaper policies are usually named-perils. Renters insurance often is. Read the form type, then read the named perils list with the eyes of someone who lives where you live.",
    },
    {
      name: "Verify the limits cover what you actually have",
      body: "A homeowners policy with $300,000 of dwelling coverage is useless if your house costs $600,000 to rebuild. A renters policy that covers $25,000 of belongings won't replace a laptop, a bike, and a guitar collection. Look for sublimits especially: jewelry is often capped at $1,500, electronics at $2,500, cash at a few hundred. Add up what you actually own. The policy that covers everything sounds great until you find out 'everything' has a ceiling.",
    },
  ],

  cta: {
    glyph:    '🗡',
    headline: "Translate the policy before you need to file",
    body:     "Paste your insurance policy and Jargon Assassin extracts coverage limits, deductibles, exclusions, and sublimits — flagged, translated, and compared against typical policies of the same type, so you know what you actually have.",
    features: [
      "Policy translation",
      "Exclusion detection",
      "Sublimit flagging",
      "Standard-policy comparison",
      "Q&A on coverage scenarios",
    ],
    toolId:   'JargonAssassin',
    toolName: 'Jargon Assassin',
  },
};
