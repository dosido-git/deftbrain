export const toolFinderMetadata = {
  TipOfTongue: {
    problems: [
      "I know what something is like but can't remember what it's called",
      "A word or name is on the tip of my tongue",
      "I can remember pieces of something but not its name",
      "I'm trying to identify a song, movie, show, food, product, place, color, scent, word, or other thing from partial clues",
      "I can picture, hear, taste, smell, or describe something but don't know what to search for"
    ],

    capabilities: [
      "suggests likely identities from incomplete or uncertain memory clues",
      "uses sensory details, context, partial facts, sounds, fragments, and exclusions to narrow possibilities",
      "explains which remembered clues support each likely match",
      "offers alternatives when more than one match is plausible",
      "provides memory triggers and ways to verify likely matches",
      "supports iterative narrowing when the first matches are wrong or only partly right"
    ],

    accepts: [
      "free-text descriptions of whatever the user remembers",
      "sensory details such as appearance, taste, smell, sound, texture, or feel",
      "partial words, names, sounds, syllables, phrases, lyrics, scenes, or other fragments",
      "context such as where or when the user encountered it",
      "things the user knows it is not",
      "uncertain or possibly incorrect remembered details",
      "a category when the user knows one"
    ],

    // Dead ends only — nothing in the catalog picks these up. A near-miss that
    // another tool owns belongs in handoffs, where it becomes a route instead
    // of a wall.
    notFor: [
      "explaining something whose name the user already knows",
      "general factual research about an identified thing",
      "fact checking or verifying a claim",
      "recovering passwords, account credentials, or private access information"
    ],

    handoffs: [
      {
        when: "the user knows what the product is and wants to judge the price, the timing, or what it will really cost to own",
        toolId: "BuyWise"
      },
      {
        when: "the user knows what something costs and wants to understand why it costs that",
        toolId: "MarkupDetective"
      }
    ],

    primaryIntent:
      "identify something the user cannot remember the name of from partial memory",

    whenToRecommend:
      "Recommend when the user is trying to recall or identify a specific word, name, title, object, food, drink, place, product, song, movie, show, scent, color, fabric, or other thing from incomplete, indirect, or uncertain clues.",

    whenNotToRecommend:
      "Do not recommend when the user already knows what the thing is and wants it explained, researched, compared, verified, evaluated, purchased, located, or otherwise acted on."
  },

  // Remaining tools...
};
