// ============================================================
// guides/workplace/how-to-read-a-long-policy-update-without-losing-your-mind.js
// ============================================================

module.exports = {
  slug:          'how-to-read-a-long-policy-update-without-losing-your-mind',
  category:      'workplace',
  categoryLabel: 'Workplace',

  title:         "How to Read a Long Policy Update Without Losing Your Mind",
  titleHtml:     "How to Read a Long Policy Update <em>Without Losing Your Mind</em>",
  shortTitle:    "Read a Long Policy Update",
  navTitle:      "How to read a long policy update without losing your mind",

  description:   "The email said 'effective in 30 days.' The PDF is 24 pages. Here's how to find what actually changed, what affects you, and what you can ignore — without reading all 24 pages.",
  deck:          "The email said 'effective in 30 days.' The PDF is 24 pages. Here's how to find what actually changed, what affects you, and what you can ignore — without reading all 24 pages.",

  published:     '2026-04-28',
  modified:      '2026-04-28',

  ledes: [
    `The email arrived from HR. The subject line was 'Updated Travel & Expense Policy — Effective May 15.' Attached: a 24-page PDF. The body of the email said 'please review carefully.' You scrolled the PDF for ninety seconds, found nothing that looked dramatically different, and closed the tab. In four weeks something will go wrong because of a clause on page eleven, and the email will be cited at you. This is the entire pattern of corporate policy updates.`,
    `Reading a long policy update front-to-back is almost never the right move — most of the document is unchanged from last time, and the part that matters is small. Five steps that find the part that matters without making you read the rest. Here they are.`,
  ],

  steps: [
    {
      name: "Look for the 'summary of changes' first",
      body: "Most updated policies include a one-page section near the front that lists what changed since the previous version. This is the only section that matters in 80% of cases. Find it before you read anything else; if it exists, read it carefully and stop. The full policy is the unchanged context; the change summary is the news. Reading the unchanged context is what costs you the afternoon.",
    },
    {
      name: "If there's no change summary, diff it yourself",
      body: "Pull the previous version of the policy from your inbox or HR portal. Open both side by side. The fastest way to find what changed is to scroll both at once, looking for sections where the formatting has shifted, where new bullet points appear, or where paragraph length has grown. Real changes almost always disturb the visual pattern. The page where the formatting suddenly changes is usually the page where the policy changed.",
    },
    {
      name: "Search for dates and dollar amounts",
      body: "Policy changes most often modify two things: timing and money. Specific dates ('effective May 15') and specific amounts ('limit increased from $X to $Y') are the most concrete kinds of change, and they're easy to find with Ctrl-F. Search for '$', '%', 'effective,' and 'as of.' The hits cluster around the actual changes; the rest of the document is connective tissue.",
    },
    {
      name: "Identify what applies to your role",
      body: "A policy that applies to all employees is usually 30% directly relevant to any individual employee. If you're remote, ignore the in-office sections. If you don't manage people, ignore the manager sections. If you don't travel internationally, ignore the international travel section. Skim for your specific situation; the rest of the policy is real content for someone, just not for you.",
    },
    {
      name: "Note the deadline and set a reminder",
      body: "Most policy updates have a date by which something needs to be done — re-acknowledge, update preferences, complete training, change a setting. Find that date and put it on your calendar with a buffer of three days. The single biggest cost of policy updates isn't reading them; it's missing the deadline buried inside them. The five-minute skim is worth roughly nothing if it doesn't end with the date in your calendar.",
    },
  ],

  cta: {
    glyph:    '🔇',
    headline: "Diff the policy and extract what affects you",
    body:     "Noise Canceler reads the policy update against the previous version, surfaces every concrete change, filters for what applies to your specific role, and pulls every deadline into a clean action list.",
    features: [
      "Policy diff against prior version",
      "Role-specific filtering",
      "Deadline extraction",
      "Concrete-change detection",
      "Action-item summary",
    ],
    toolId:   'NoiseCanceler',
    toolName: 'Noise Canceler',
  },
};
