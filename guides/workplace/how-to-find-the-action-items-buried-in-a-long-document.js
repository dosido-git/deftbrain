// ============================================================
// guides/workplace/how-to-find-the-action-items-buried-in-a-long-document.js
// ============================================================

module.exports = {
  slug:          'how-to-find-the-action-items-buried-in-a-long-document',
  category:      'workplace',
  categoryLabel: 'Workplace',

  title:         "How to Find the Action Items Buried in a Long Document",
  titleHtml:     "How to Find the Action Items <em>Buried in a Long Document</em>",
  shortTitle:    "Find Action Items in a Document",
  navTitle:      "How to find the action items buried in a long document",

  description:   "Long documents like to hide their requests inside paragraphs of context. Here's how to extract every action item from any document in five minutes — without missing anything.",
  deck:          "Long documents like to hide their requests inside paragraphs of context. Here's how to extract every action item from any document in five minutes — without missing anything.",

  published:     '2026-04-28',
  modified:      '2026-04-28',

  ledes: [
    `The document you just read had 18 pages. Somewhere inside it were three things that required your action — a form to fill out, a date to confirm, a checkbox to update. You read the document carefully, you absorbed the gist, and you missed two of the three. They were buried in paragraphs of context, mentioned in passing, sandwiched between background information and follow-up notes. Reading carefully wasn't enough. Reading carefully isn't always the right strategy.`,
    `Finding action items in a long document is a different mode than reading for understanding. It's extraction, not absorption. You're looking for verbs and deadlines, not arguments and context. Five moves that surface every action without making you read everything.`,
  ],

  steps: [
    {
      name: "Search for command-form verbs",
      body: "Action items begin with verbs in the imperative or future-conditional: 'submit,' 'confirm,' 'review,' 'sign,' 'update,' 'will need to,' 'must.' Ctrl-F for these in any combination. Each hit is a candidate for an action that applies to you; skim the surrounding sentence to see if it does. The verbs are the entry points; the context is recoverable once you've found them.",
    },
    {
      name: "Find every deadline phrase",
      body: "'By Friday,' 'no later than May 15,' 'within seven days,' 'before the next billing cycle.' Deadlines are the metadata of action items — every action you owe has one, and the deadline is usually adjacent to the action in the text. Search for date formats, 'by,' 'before,' 'no later than,' and 'within.' Where dates cluster, actions cluster. The two travel together.",
    },
    {
      name: "Look for forms, links, and attachments",
      body: "Action items frequently come with infrastructure — a form to fill, a link to click, an attachment to sign. Anywhere the document references one of these, there's an action attached. Scroll through quickly looking only for embedded forms or 'click here to acknowledge' links; each one is a request that the document is making of you. The link is the action made literal.",
    },
    {
      name: "Distinguish your actions from other people's",
      body: "Long documents address multiple audiences. An action item written to 'all employees' is yours; one written to 'managers' may not be. One written to 'tenants' applies to you only if you're a tenant. Read each action item with the audience filter on — and don't add to your task list anything that's actually someone else's task. False positives are how you end up doing work that isn't yours; false negatives are how you miss work that is. Both costs are real.",
    },
    {
      name: "Build a clean list at the end",
      body: "After you've extracted candidate actions, rewrite them as a flat checklist with the deadline next to each item: 'Sign acknowledgment form — by May 15.' 'Update beneficiary on portal — by end of month.' This list is now your contract with the document; the document itself can be archived. You'll act from the list, not the source. The list is the document's actual output; the rest of it was the route you had to walk to get there.",
    },
  ],

  cta: {
    glyph:    '🔇',
    headline: "Extract every action item automatically",
    body:     "Paste any long document and Noise Canceler extracts every action item with its deadline, filters for the ones that apply to your role, and produces a clean checklist you can act from — the source archived, the list ready.",
    features: [
      "Action-item extraction",
      "Deadline pairing",
      "Role-specific filtering",
      "Form-and-link surfacing",
      "Calendar-ready checklist",
    ],
    toolId:   'NoiseCanceler',
    toolName: 'Noise Canceler',
  },
};
