// ============================================================
// guides/workplace/how-to-translate-a-confusing-document-into-plain-language.js
// ============================================================

module.exports = {
  slug:          'how-to-translate-a-confusing-document-into-plain-language',
  category:      'workplace',
  categoryLabel: 'Workplace',

  title:         "How to Translate a Confusing Document Into Plain Language",
  titleHtml:     "How to Translate a Confusing Document <em>Into Plain Language</em>",
  shortTitle:    "Translate a Confusing Document",
  navTitle:      "How to translate a confusing document into plain language",

  description:   "The document is dense, formal, and giving you nothing. Here's a five-pass method for translating any complicated text into something a normal person can read.",
  deck:          "The document is dense, formal, and giving you nothing. Here's a five-pass method for translating any complicated text into something a normal person can read.",

  published:     '2026-04-28',
  modified:      '2026-04-28',

  ledes: [
    `The document arrived in your inbox an hour ago. You've read the first paragraph four times. Each individual sentence is technically grammatical, and you understand each of the words, and yet you've extracted approximately zero meaning from the page. This is the specific failure mode of professional writing — text that is correct without being clear, and that's been signed off on by everyone in the chain because nobody wanted to admit they didn't understand it either.`,
    `Translating dense writing into plain language is a real skill — different from writing well, different from reading well. It's a process. Five passes, in order. By the end you'll have a version you can act on, send to a colleague, or actually keep in your head. Here are the passes.`,
  ],

  steps: [
    {
      name: "Read it once with no notes",
      body: "The first read is for shape, not substance. Don't highlight, don't take notes, don't try to understand. You're getting a feel for the document — how long it is, what the sections are, where it speeds up and slows down. Trying to understand a complex document on the first read is how you get lost in the second paragraph and stay lost. Skim, then start.",
    },
    {
      name: "Find the verbs and circle them",
      body: "Bad writing hides the verbs. 'Authorization is required' is doing the same work as 'you need to authorize this,' but the first version puts the action two clauses away from anyone doing it. The fastest way to translate a document is to find the verbs, identify who's doing them, and rewrite each sentence around that subject-verb pair. The fog clears immediately when you can name who's supposed to do what.",
    },
    {
      name: "Strip the modifiers, then read it again",
      body: "Most density comes from modifiers — 'comprehensive,' 'reasonable,' 'subject to,' 'including but not limited to,' 'in accordance with the provisions of.' Cross them out. Read the sentence without them. Almost always, the sentence still says the same thing, and the meaning is suddenly visible. The modifiers were doing legal or political work; they weren't doing comprehension work.",
    },
    {
      name: "Translate clause by clause, not paragraph by paragraph",
      body: "Don't try to summarize a paragraph; translate each clause separately, then reassemble. A clause is a complete idea. A paragraph is several clauses pretending to be one. When you translate at the paragraph level, you lose specifics; when you translate at the clause level, the specifics survive. Do the small unit, then put the small units back together. The output will be longer than you expect and clearer than the original.",
    },
    {
      name: "Test the translation against the original",
      body: "After you've rewritten the document in plain language, go back and check each translated section against its source. Did you preserve the meaning, or did you smooth over a real subtlety? Plain language is dangerous when it papers over distinctions that mattered. The good translation is shorter, clearer, and identical in substance. The bad translation is shorter, clearer, and quietly wrong. Run the comparison; that's where you catch yourself.",
    },
  ],

  cta: {
    glyph:    '🔍',
    headline: "Run the five-pass translation in seconds",
    body:     "PlainTalk takes any document — legal, financial, medical, technical — and produces the plain-language version with structural analysis, key sections highlighted, and a glossary built as you read.",
    features: [
      "Plain-language translation",
      "Structural document map",
      "Key-section highlighting",
      "Built-in glossary",
      "Reading-level controls",
    ],
    toolId:   'PlainTalk',
    toolName: 'PlainTalk',
  },
};
