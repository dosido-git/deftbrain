// ============================================================
// guides/workplace/how-to-skim-a-long-document-without-missing-the-important-parts.js
// ============================================================

module.exports = {
  slug:          'how-to-skim-a-long-document-without-missing-the-important-parts',
  category:      'workplace',
  categoryLabel: 'Workplace',

  title:         "How to Skim a Long Document Without Missing the Important Parts",
  titleHtml:     "How to Skim a Long Document <em>Without Missing the Important Parts</em>",
  shortTitle:    "How to Skim a Long Document",
  navTitle:      "How to skim a long document without missing the important parts",

  description:   "Reading every word is a waste. Reading none of it is a risk. Here's the middle path — a five-pass skim that catches what matters and lets you ignore the rest with a clean conscience.",
  deck:          "Reading every word is a waste. Reading none of it is a risk. Here's the middle path — a five-pass skim that catches what matters and lets you ignore the rest with a clean conscience.",

  published:     '2026-04-28',
  modified:      '2026-04-28',

  ledes: [
    `The document is forty pages and you have nine minutes. The HR portal needs you to confirm receipt; the email said 'please review carefully'; the policy applies starting next month. You can't read it carefully. You also can't truthfully click 'I have read and understood' — but everyone clicks anyway, and you will too, because the alternative is staring at forty pages of formatting until your meeting starts. The premise of professional life is that you'll skim things you were told to read.`,
    `Skimming well is a real skill — different from reading carefully, different from not reading at all. The pros don't read every word; they read the right words in the right order, and they catch the parts that matter without absorbing the parts that don't. Five passes, in this order. The whole thing takes five to ten minutes.`,
  ],

  steps: [
    {
      name: "Read the headings first, in order",
      body: "Before you read any body text, scroll through the entire document and read only the section headings. This takes about thirty seconds and gives you the structure: how long is this thing, what's it about, where is the important section likely to be. Headings won't tell you the content, but they'll tell you the shape — and the shape is what tells you where to spend your remaining attention.",
    },
    {
      name: "Read the first sentence of each section",
      body: "Most professional writing has a thesis sentence at the top of each section. Read just that sentence, every section, in order. Skip everything else. This pass takes another two or three minutes and gives you roughly 80% of what the document is trying to communicate. The remaining 20% is detail, examples, and supporting evidence — important if you need it, ignorable if you don't.",
    },
    {
      name: "Search for the action verbs",
      body: "Anything that requires you to do something is what actually matters. Ctrl-F these: 'must,' 'required,' 'shall,' 'will need to,' 'by [date].' Each hit is a candidate action — read the surrounding sentence to see if the action applies to you. Most of the document's hundreds of words exist to set context for a small number of obligations. The skim catches the obligations and lets the context stay in the document.",
    },
    {
      name: "Find what's specific to your situation",
      body: "A 40-page benefits packet is mostly content for people who aren't you — different plans, different jurisdictions, different family situations. Skim for the variables that match your case: your plan name, your state, your role, your dependents. The relevant material is usually 10-15% of the document. The other 85% is real content for someone, just not for you, and you can let it stay theirs.",
    },
    {
      name: "Read the table of changes if there is one",
      body: "Many long documents — policy updates, plan revisions, contract amendments — include a 'summary of changes' or 'what's new' section. Find it and read it carefully. That single section often replaces 90% of the document for a returning reader; the rest is the unchanged baseline. Most people read the full new version because they're too rushed to find the diff. Find the diff first; the diff is the document.",
    },
  ],

  cta: {
    glyph:    '🔇',
    headline: "Get the relevance-filtered version of any document",
    body:     "Noise Canceler takes any long document — benefits packet, policy update, lease, HOA notice — and extracts only what requires your action, costs you money, or affects your specific situation. Not a summary; a personalized filter.",
    features: [
      "Personalized relevance filter",
      "Action-item extraction",
      "Diff against prior version",
      "Situation-aware filtering",
      "Plain-language summaries",
    ],
    toolId:   'NoiseCanceler',
    toolName: 'Noise Canceler',
  },
};
