// ============================================================
// guides/workplace/how-to-see-the-real-structure-of-a-complex-document.js
// ============================================================

module.exports = {
  slug:          'how-to-see-the-real-structure-of-a-complex-document',
  category:      'workplace',
  categoryLabel: 'Workplace',

  title:         "How to See the Real Structure of a Complex Document",
  titleHtml:     "How to See the <em>Real Structure of a Complex Document</em>",
  shortTitle:    "Real Structure of a Document",
  navTitle:      "How to see the real structure of a complex document",

  description:   "Every document has two structures: the one in the table of contents and the one that carries the argument. Here's how to find the second — where the meaning lives.",
  deck:          "Every document has two structures: the one in the table of contents and the one that carries the argument. Here's how to find the second — where the meaning lives.",

  published:     '2026-04-28',
  modified:      '2026-04-28',

  ledes: [
    `You're reading the proposal, the contract, the strategy doc, the RFP. The headings tell you it has eight sections. The sections seem to follow a logical order. And yet, twenty pages in, you're not sure what the document is actually arguing — or whether it's arguing anything at all. The visible structure isn't lying to you. It's just not the same as the load-bearing structure underneath, which is where the real meaning lives.`,
    `Most professional documents have two structures. The visible one is the table of contents. The underlying one is the chain of claims and dependencies that actually carries the argument. Once you can see the second one, the document becomes legible — and you can usually find it in five moves. Here are the five.`,
  ],

  steps: [
    {
      name: "Find the document's central claim",
      body: "Most complex documents are built around one central claim — a recommendation, a request, a verdict, a finding. Before you read in detail, find that claim. It's usually in the executive summary or the conclusion, and it's usually one or two sentences. Once you know what the document is trying to convince you of, every other section becomes easier to read: it's either supporting the claim, qualifying it, or hedging against the case where the claim is wrong.",
    },
    {
      name: "Map which sections support which",
      body: "Sections in a complex document aren't peers — they have dependencies. Section 4 might support the claim in Section 2; Section 6 might be a qualification on Section 3. Read the headings as nodes, then sketch the relationships. The actual logical structure is usually a tree with the central claim at the top, not a flat list. The table of contents shows the flat version; the tree is what carries the meaning.",
    },
    {
      name: "Find the load-bearing paragraphs",
      body: "Most paragraphs in a document are filler — context, transitions, restatements, throat-clearing. A few paragraphs are doing the actual work — making a specific claim, presenting a specific finding, articulating a specific commitment. These are the load-bearing paragraphs, and the document collapses if any of them turn out to be wrong. The rest is decoration. Identify the three to five paragraphs the entire argument depends on. Read those carefully; skim the rest.",
    },
    {
      name: "Notice what's been moved to the appendix",
      body: "Anything important enough to include but inconvenient enough to bury usually ends up in the appendix. Limitations, caveats, alternative interpretations, contradicting data — appendix material is the document's nervous system, made invisible by location. Read the appendix before you finalize your understanding of the main text. What was put in the back is often what changes the conclusion in the front.",
    },
    {
      name: "Look for the claims that aren't argued",
      body: "Every complex document contains some claims that are argued in detail and others that are simply asserted. The asserted claims are the most interesting. They're either too obvious to argue, too weak to argue, or assumed in a way the writer hopes you won't notice. Find the unsupported claims and ask: would I accept this if it weren't sitting next to all this evidence for other things? That's where the document is most likely to be wrong.",
    },
  ],

  cta: {
    glyph:    '🔍',
    headline: "Get the structural X-ray of any document",
    body:     "PlainTalk maps the real structure of a complex document — central claim, supporting sections, load-bearing paragraphs, appendix content, and the unsupported assertions — so you can see the argument the way the writer can.",
    features: [
      "Structural document map",
      "Argument chain analysis",
      "Load-bearing paragraph flagging",
      "Appendix surfacing",
      "Unsupported-claim detection",
    ],
    toolId:   'PlainTalk',
    toolName: 'PlainTalk',
  },
};
