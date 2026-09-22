// Shared by DashBoard.js (category filter pills) and HomeIntro.js (homepage
// category chips) — pulled into its own module rather than exported from
// DashBoard.js because HomeIntro.js is rendered BY DashBoard.js, so an
// import the other way would be circular. Also read by
// scripts/build-tools-category-pages.js (Node, not React — see that
// script's own loader for how a plain-data ES module like this one gets
// parsed without a bundler).
//
// Permanent category names (2026-09-21) — replaces the playful names as the
// primary label. The playful name isn't gone: it moved into `tag`, the small
// plain-language line TilePill renders under the big label (DashBoard.js) —
// hierarchy flipped. `sub` is DashBoard's hover-tooltip text; unused by the
// homepage chips.
//
// `slug` (2026-09-22) — the URL segment for that category's real page at
// /tools/{slug}. `example` (2026-09-22, moved here from a same-named object
// that used to live in HomeIntro.js) is the homepage pill's own hover
// tooltip, one real ROTATION-sourced line per category. `desc` (2026-09-22)
// is the one-paragraph description on that category's /tools/{slug} page —
// same job GUIDES' own CATEGORY_META.desc does for /guides/{category}, and
// written the same way: concrete to what's actually IN the category, not
// generic filler.
export const CATEGORY_META = [
  { name: 'Home & Daily Life',   emoji: '🌅', tag: 'the grind', sub: 'home · household · daily life', slug: 'home-daily-life',
    example: 'Something in my lease looks wrong.',
    desc: "Leases, repairs, chores, and the small household decisions that pile up when nobody's watching." },
  { name: 'Travel & Events',     emoji: '🗺️',  tag: 'out & about', sub: 'travel · events · adventure', slug: 'travel-events',
    example: 'I have hours between flights.',
    desc: "Layovers, itineraries, packing, and the logistics that decide whether a trip goes smoothly." },
  { name: 'Relationships',       emoji: '👥', tag: 'humans', sub: 'relationships · people · bonds', slug: 'relationships',
    example: 'I need to say something that matters.',
    desc: "Hard conversations, apologies, and the moments where what you say next actually matters." },
  { name: 'Money',               emoji: '💰', tag: 'loot', sub: 'money · finances · consumer', slug: 'money',
    example: 'This bill doesn’t look right.',
    desc: "Bills, quotes, negotiations, and figuring out whether a price is actually fair." },
  { name: 'Career',              emoji: '🚀', tag: 'pursuits', sub: 'career · growth · identity', slug: 'career',
    example: 'I need to talk about my own work.',
    desc: "Performance reviews, brag sheets, and making the case for work you've already done." },
  { name: 'Work & Meetings',     emoji: '🏢', tag: 'the office', sub: 'work · meetings · tools', slug: 'work-meetings',
    example: 'The meeting ended and I’m still not sure what was decided.',
    desc: "Meetings that ran long, emails that need the right tone, and the office politics nobody explains." },
  { name: 'Health & Wellness',   emoji: '⚡', tag: 'energy', sub: 'mind · body · fuel', slug: 'health-wellness',
    example: 'I have a doctor appointment coming up.',
    desc: "Doctor visits, sleep, energy, and understanding what your body's actually telling you." },
  { name: 'Conversations',       emoji: '🗣️ ', tag: 'discourse', sub: 'say it well!', slug: 'conversations',
    example: 'I need to have a difficult conversation.',
    desc: "Difficult talks, awkward silences, and finding the words before you need them." },
  { name: 'Learning',            emoji: '🔬', tag: 'go deep!', sub: 'research · learning · knowledge', slug: 'learning',
    example: 'I’m stuck on a concept and don’t know why.',
    desc: "Research, concepts that aren't clicking, and making sense of something unfamiliar." },
  { name: 'Just for Fun',        emoji: '🧩', tag: 'diversions', sub: 'fun · curiosity · play', slug: 'just-for-fun',
    example: 'I know it. I just can’t remember it.',
    desc: "Curiosity, wordplay, and tools that exist because they're genuinely fun to use." },
  { name: 'Self & Reflection',   emoji: '🪞', tag: 'me', sub: 'self · reflection · growth', slug: 'self-reflection',
    example: 'Everything is stuck in my head at once.',
    desc: "Understanding your own patterns, beliefs, and the things you haven't said out loud." },
  { name: 'Ideas & Imagination', emoji: '✨', tag: 'what if?', sub: 'imagination · creativity', slug: 'ideas-imagination',
    example: 'I can only see the road not taken in hindsight.',
    desc: "Naming things, exploring what-ifs, and stress-testing an idea before you commit to it." },
  { name: 'Decisions',           emoji: '🧭', tag: 'veer', sub: 'decisions · direction · choices', slug: 'decisions',
    example: 'I’m about to buy something big.',
    desc: "The hard calls — job offers, big purchases, plans that might not survive contact with reality." },
  { name: 'Tasks',               emoji: '✅', tag: 'do it!', sub: 'execution · unstuck · tasks', slug: 'tasks',
    example: 'Everything feels urgent at once.',
    desc: "Overwhelming to-do lists, procrastination, and turning a pile of things into a next step." },
];
