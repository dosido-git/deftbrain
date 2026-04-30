module.exports = {
  slug:          'whats-that-song-with-a-specific-vibe',
  category:      'learning',
  categoryLabel: 'Learning',
  title:         "How to Find That Song You Half-Remember",
  titleHtml:     "How to Find That Song <em>You Half-Remember</em>",
  shortTitle:    "Find the Song",
  navTitle:      "find a song from memory",
  description:   "A few lyrics. A vibe. A scene from the music video. Here is how to identify a song from fragments — and which apps are best for which kind of fragment.",
  deck:          "A few lyrics. A vibe. A scene from the music video. Here is how to identify a song from fragments — and which apps are best for which kind of fragment.",
  ledes: [
    `You heard it once. Maybe years ago. You remember a fragment of the chorus, or just the feeling — a particular kind of slow guitar, a male voice singing about something melancholy, a music video with rain in it. You hum it to yourself but cannot find it. The lyric you half-remember turns out to be wrong when you search it, or returns nothing.\n\nFinding a song from fragmentary memory is one of the cases where multiple specialized tools each work for one type of fragment. Shazam works if you can hear it playing. Hum-search works if you can hum the melody. Lyric search works if you remember actual words. Vibe-based search works if you can describe the era and feel. The skill is matching the type of memory you have to the right kind of search.`,
    `Here is the matching — and how Tip of Tongue handles vibe-only descriptions.`,
  ],
  steps: [
    { name: 'For sound-only memories: hum it to a hum-search app', body: 'Apps like Google Hum and SoundHound let you hum the melody and identify the song. They work surprisingly well for popular songs even with imperfect humming. If you can produce the melody at all, this is the fastest path. The downside is they work best for songs that are well-known; obscure songs may not match. If your hum returns nothing, the song is probably either obscure or your hum is sufficiently off-key — try again on the chorus rather than the verse.' },
    { name: 'For partial-lyric memories: search the exact phrase in quotes', body: 'Type the lyric you remember in quotation marks. Add "lyrics" to the search. Even four or five words usually identifies the song uniquely. The trap is misremembered lyrics — what you think you heard might be different from the actual line. If exact-quote search fails, try variations of the phonetics. Lyric search engines like Genius are tolerant of approximate matches.' },
    { name: 'For era-and-vibe memories: describe the kind of song to a music finder', body: 'When all you have is era and vibe — \'2000s, melancholy male vocal, slow guitar, sounded like a breakup song\' — search engines fail but conversational AI tools and music recommendation services can pattern-match. Describe specific instruments, the apparent era, the mood, anything visual you remember from the video. The more specific, the narrower the candidate set.' },
    { name: 'Use the source to narrow it: where did you hear it?', body: 'If you remember the context — a coffee shop, a TV show episode, a friend\'s playlist, a movie trailer — that narrows enormously. TV shows have published soundtracks. Movies do too. The friend who played it might remember. Coffee shop playlists are often public on Spotify. The context where you heard the song is often more specific information than anything about the song itself.' },
    { name: 'Use Tip of Tongue to identify it from a vibe description', body: 'Tip of Tongue handles the vibe-only case where lyric search and hum search both fail. Describe the song in any words — era, mood, instruments, fragments of lyric, where you heard it — and it suggests candidates. Often combines well with hum search; it can narrow the field, then a hum confirms. For the songs you have been trying to find for years, Tip of Tongue is often the breakthrough.' }
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
