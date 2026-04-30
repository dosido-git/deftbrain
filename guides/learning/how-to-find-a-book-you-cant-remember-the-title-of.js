module.exports = {
  slug:          'how-to-find-a-book-you-cant-remember-the-title-of',
  category:      'learning',
  categoryLabel: 'Learning',
  title:         "How to Find a Book You Read Once But Cannot Remember the Title",
  titleHtml:     "How to Find a Book <em>You Read Once But Cannot Remember</em>",
  shortTitle:    "Find the Book",
  navTitle:      "find a book from memory",
  description:   "You read it years ago. You remember the plot but not the title. Here is how to identify it from what you do remember — and which databases are best for the search.",
  deck:          "You read it years ago. You remember the plot but not the title. Here is how to identify it from what you do remember — and which databases are best for the search.",
  ledes: [
    `You read a book years ago. You remember a few specific things — the protagonist had a particular profession, there was a setting that stuck with you, a plot turn that surprised you. You cannot remember the title, the author, or the cover. Searching the plot in a search engine returns nothing useful, because plot summaries are not indexed the way you remember them.\n\nFinding a book from fragmentary memory has gotten significantly easier with the rise of book-specific community databases and AI tools. The trick is using the right combination — communities for the human pattern-match, databases for filtering by metadata, and AI tools for fuzzy plot matching. Each catches a different kind of fragment.`,
    `Here is the workflow — and how Tip of Tongue identifies a book from plot fragments.`,
  ],
  steps: [
    { name: 'Post on r/whatsthatbook or Goodreads forums', body: 'Communities exist specifically for this. r/whatsthatbook on Reddit has thousands of active readers who have collectively read everything. Post the plot fragment you remember — protagonist, setting, key plot turn, era. Other readers often recognize the book within hours. Goodreads has \'Help find a book\' threads that work similarly. Crowdsourced memory is often the fastest method for books that are not extremely obscure.' },
    { name: 'Filter by what you remember about its release', body: 'Was it new when you read it, or older? Hardcover or paperback? Library or yours? You can usually narrow the era to within a decade. Goodreads and Amazon let you filter by year. Combined with a genre tag and any plot keyword you remember, you can produce a candidate list of 50-100 books to skim. Cover art is often what triggers recognition — you often do not remember the title but recognize the cover when you see it.' },
    { name: 'Search distinctive plot elements, not generic ones', body: 'The protagonist is a journalist is generic; many novels have journalist protagonists. The protagonist investigates a vanished tech company is more specific. List every detail that feels unusual to you and search those, not the common ones. Distinctive combinations — \'novel about [unusual setting] and [unusual profession]\' — often surface the right book in one search even though either keyword alone returns thousands.' },
    { name: 'Try the author-by-association approach', body: 'If you remember liking the book and have read other books by similar authors, browse those authors\' lists. If you read it during a specific phase of your reading life, check what was popular in that phase. People often re-read or seek out books from similar authors, and the candidate book is often by an author whose other work you have read. Goodreads recommendation lists for books you remember well often surface the forgotten one.' },
    { name: 'Use Tip of Tongue to identify it from plot details', body: 'Describe the plot fragments to Tip of Tongue. The output suggests candidate books with summaries you can verify against your memory. Far better than search engines at fuzzy plot matching, because it can pattern-match across actual plot content rather than indexed metadata. Especially good for older books or books that are not heavily reviewed online, where standard search returns are thin.' }
  ],
  cta: {
    glyph:    '💭',
    headline: "Describe what you almost remember. We will name it.",
    body:     "Describe the word, song, movie, book, or thing in any words you can — vague vibes, partial memories, \"it was like...\" — and Tip of Tongue identifies what you are reaching for.",
    features: [
      "Words, songs, movies, books, objects",
      "Works from vague descriptions",
      "Surfaces near-misses to confirm or rule out",
      "Builds your personal \"found\" list"
    ],
    toolId:   'TipOfTongue',
    toolName: 'Tip of Tongue',
  },
  published: '2026-04-29',
  modified:  '2026-04-29',
};
