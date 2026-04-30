module.exports = {
  slug:          'whats-that-movie-where-something-happens',
  category:      'learning',
  categoryLabel: 'Learning',
  title:         "How to Find That Movie Where Something Specific Happened",
  titleHtml:     "How to Find That Movie <em>Where Something Specific Happened</em>",
  shortTitle:    "Find the Movie",
  navTitle:      "find a movie from a detail",
  description:   "You remember a scene but not the title. Here is how to identify a movie from a fragment — what to search, what to describe, and how to triangulate to the right one.",
  deck:          "You remember a scene but not the title. Here is how to identify a movie from a fragment — what to search, what to describe, and how to triangulate to the right one.",
  ledes: [
    `You remember a scene clearly. The protagonist is in a hotel hallway, the carpet is patterned, there is a character with a specific quirk, something happens with a child or a phone or a knife. You cannot remember the title, the year, the actors, or any of the things a search engine usually wants. You spend ten minutes searching variations like 'movie where someone in hotel' and get nothing useful.\n\nFinding a movie from a fragment is its own kind of search problem. Search engines are tuned for keyword matching against titles and reviews, not for fuzzy memory of scenes. The trick is figuring out what details you remember are unique enough to be findable, what a movie database can match against, and when to ask a person — or a tool — that can pattern-match against everything at once.`,
    `Here is how to triangulate — and how Tip of Tongue makes it fast.`,
  ],
  steps: [
    { name: 'List the unique details, not the generic ones', body: 'Hotel hallway is not unique — thousands of movies have hotel scenes. The character with the specific quirk is unique. The unusual prop, the specific line of dialogue, the strange transition from one scene to another — those are the searchable details. Write down what you remember and circle the things that feel specific to this movie. Search those, not the generic backdrop.' },
    { name: 'Pin down the era as tightly as you can', body: 'Was it filmed in the last ten years or older? Black and white or color? Were cell phones in it? Cars look modern or vintage? Movie databases let you filter by year, and even a rough range cuts the candidate set by 90%. You probably do not know the exact year, but \'roughly 2010s, definitely color, definitely modern phones\' is enough information to narrow significantly.' },
    { name: 'Try genre-specific subreddits or movie forums', body: 'Communities like r/tipofmytongue exist for exactly this. Post your description with whatever fragments you have. Crowdsourced memory is often the fastest path — somebody else has seen the movie and recognizes the scene. The post needs to be specific. Vague descriptions get vague answers; specific ones get titles within hours.' },
    { name: 'Use the actor or director if you remember either', body: 'If you remember an actor, look at their filmography on a database site. Most actors have 20-50 films listed; you can scan and recognize the right one. Same for directors. This is often faster than describing the scene to a search engine, because filmographies are concrete lists you can recognize. Even partial actor memories — "I think it was the guy who was in that other movie about X" — can chain into the right film.' },
    { name: 'Use Tip of Tongue to identify the movie from your description', body: 'Describe what you remember to Tip of Tongue — scene, era, vibe, half-remembered actor. The output suggests candidate movies ranked by match strength. Often one is clearly the right answer; sometimes two or three need to be ruled out by checking trailers or summaries. Faster and more accurate than search engines for this kind of fuzzy query, because the matching is over the actual content of the movie, not its keywords.' }
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
